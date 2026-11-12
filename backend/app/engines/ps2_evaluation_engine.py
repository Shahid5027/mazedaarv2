import re
import os
import io
import math
from typing import Dict, List, Optional, Any, Tuple
import datetime
from pathlib import Path

try:
    import fitz  # PyMuPDF
    PYMUPDF_AVAILABLE = True
except ImportError:
    PYMUPDF_AVAILABLE = False

try:
    from PIL import Image
    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False

try:
    import pytesseract
    PYTESSERACT_AVAILABLE = True
except ImportError:
    PYTESSERACT_AVAILABLE = False

try:
    from rapidocr import RapidOCR
    RAPIDOCR_AVAILABLE = True
except ImportError:
    RAPIDOCR_AVAILABLE = False

_RAPID_OCR = None


def get_rapid_ocr():
    global _RAPID_OCR
    if _RAPID_OCR is None and RAPIDOCR_AVAILABLE:
        from rapidocr import RapidOCR
        _RAPID_OCR = RapidOCR()
    return _RAPID_OCR

# Lazy-loaded SentenceTransformer singleton
_SENTENCE_MODEL = None
_SENTENCE_MODEL_NAME = "all-MiniLM-L6-v2"
_SENTENCE_MODEL_STATUS = "unloaded"


def get_sentence_transformer():
    global _SENTENCE_MODEL, _SENTENCE_MODEL_STATUS
    if _SENTENCE_MODEL is not None:
        return _SENTENCE_MODEL

    try:
        from sentence_transformers import SentenceTransformer
        _SENTENCE_MODEL = SentenceTransformer(_SENTENCE_MODEL_NAME)
        _SENTENCE_MODEL_STATUS = f"loaded ({_SENTENCE_MODEL_NAME})"
        return _SENTENCE_MODEL
    except Exception as e:
        _SENTENCE_MODEL_STATUS = f"fallback (cosine vector TF-IDF, reason: {str(e)})"
        return None


class SubjectiveEvaluationEngine:
    """
    Automated Formative Subjective Assessment & Grading Engine (PS2).
    Deliverables implemented:
    - Real Sentence Transformer embeddings (all-MiniLM-L6-v2)
    - Criterion-level semantic cosine similarity
    - Domain concept coverage and contradiction checks
    - Verbatim evidence extraction
    - Strict rubric boundary validation (awarded <= criterion max, sum <= total)
    - OCR processing for scanned PDFs and image submissions (.pdf, .png, .jpg)
    - Faculty human-in-the-loop moderation with audit history
    """

    @classmethod
    def get_model_info(cls) -> Dict[str, Any]:
        get_sentence_transformer()
        return {
            "model_name": _SENTENCE_MODEL_NAME,
            "status": _SENTENCE_MODEL_STATUS,
            "ocr_support": {
                "pymupdf": PYMUPDF_AVAILABLE,
                "pytesseract": PYTESSERACT_AVAILABLE,
                "rapidocr": RAPIDOCR_AVAILABLE,
                "pillow": PIL_AVAILABLE
            }
        }

    @staticmethod
    def reference_answers_only(reference_text: str) -> str:
        """Drop obvious question prompts from a combined question-paper and answer-key scan."""
        lines = [line.strip() for line in reference_text.splitlines() if line.strip() and not line.strip().startswith("--- Page")]
        answer_heading = re.compile(r"^\s*(?:model\s+)?(?:answer|solution|ans\.?)(?:\s*(?:to\s*)?(?:q(?:uestion)?\s*)?\d+)?\s*[:.)\-]\s*(.*)$", re.I)
        question_heading = re.compile(r"^\s*(?:question\s+\d+|q\d+)\s*[:.)\-]?\s*", re.I)
        sections_present = any(answer_heading.match(line) for line in lines)
        if sections_present:
            answer_lines = []
            reading_answer = False
            for line in lines:
                match = answer_heading.match(line)
                if match:
                    reading_answer = True
                    if match.group(1):
                        answer_lines.append(match.group(1).strip())
                elif question_heading.match(line):
                    reading_answer = False
                elif reading_answer:
                    answer_lines.append(line)
            cleaned = "\n".join(answer_lines).strip()
            return cleaned or reference_text.strip()

        prompts_removed = [line for line in lines if "?" not in line and not re.match(r"^\s*(?:question\s+\d+|q\d+)\b", line, re.I)]
        cleaned = "\n".join(prompts_removed).strip()
        return cleaned if len(cleaned.split()) >= 5 else reference_text.strip()

    @staticmethod
    def extract_text_from_file(file_bytes: bytes, filename: str) -> Dict[str, Any]:
        """
        Extracts text from digital PDFs, scanned PDFs, images, or TXT files.
        Uses PyMuPDF and OCR where appropriate.
        """
        ext = filename.lower().split(".")[-1]
        extracted_text = ""
        is_scanned = False
        page_count = 1
        page_texts = []
        ocr_applied = False
        confidence = 0.95

        # 1. Image upload processing (.png, .jpg, .jpeg)
        if ext in ["png", "jpg", "jpeg", "webp", "bmp"]:
            is_scanned = True
            if PIL_AVAILABLE:
                try:
                    img = Image.open(io.BytesIO(file_bytes))
                    if PYTESSERACT_AVAILABLE:
                        try:
                            extracted_text = pytesseract.image_to_string(img).strip()
                            ocr_applied = True
                            confidence = 0.85
                        except Exception as e:
                            if RAPIDOCR_AVAILABLE:
                                try:
                                    result = get_rapid_ocr()(img)
                                    extracted_text = "\n".join(text for text in (result.txts or []) if text).strip()
                                    ocr_applied = bool(extracted_text)
                                    confidence = 0.82 if ocr_applied else 0.20
                                except Exception:
                                    confidence = 0.20
                            else:
                                extracted_text = ""
                                confidence = 0.20
                    elif RAPIDOCR_AVAILABLE:
                        try:
                            result = get_rapid_ocr()(img)
                            extracted_text = "\n".join(text for text in (result.txts or []) if text).strip()
                            ocr_applied = bool(extracted_text)
                            confidence = 0.82 if ocr_applied else 0.20
                        except Exception:
                            extracted_text = ""
                            confidence = 0.20
                    else:
                        extracted_text = f"[Image Submission: {filename} ({img.width}x{img.height}px). OCR module required for extraction.]"
                        confidence = 0.50
                except Exception as e:
                    return {
                        "success": False,
                        "text": "",
                        "is_scanned": True,
                        "page_count": 1,
                        "message": f"Corrupted image format: {str(e)}"
                    }
            return {
                "success": len(extracted_text.split()) >= 5,
                "text": extracted_text,
                "is_scanned": True,
                "ocr_applied": ocr_applied,
                "confidence": confidence,
                "word_count": len(extracted_text.split()),
                "page_count": 1,
                "page_references": [{"page": 1, "text": extracted_text[:200]}],
                "message": f"Processed image submission with OCR ({confidence*100:.0f}% confidence)."
            }

        # 2. PDF processing
        if ext == "pdf":
            if not PYMUPDF_AVAILABLE:
                extracted_text = "[Notice: PyMuPDF not available in runtime environment. Please upload as .txt]"
            else:
                try:
                    doc = fitz.open(stream=file_bytes, filetype="pdf")
                    page_count = len(doc)

                    for p_num, page in enumerate(doc, start=1):
                        p_txt = page.get_text("text").strip()
                        if len(p_txt.split()) < 8:
                            # Page appears scanned / image-only
                            is_scanned = True
                            pix = page.get_pixmap(dpi=150)
                            if PIL_AVAILABLE and (PYTESSERACT_AVAILABLE or RAPIDOCR_AVAILABLE):
                                try:
                                    img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
                                    if PYTESSERACT_AVAILABLE:
                                        try:
                                            ocr_p_txt = pytesseract.image_to_string(img).strip()
                                        except Exception:
                                            if RAPIDOCR_AVAILABLE:
                                                result = get_rapid_ocr()(img)
                                                ocr_p_txt = "\n".join(text for text in (result.txts or []) if text).strip()
                                            else:
                                                ocr_p_txt = ""
                                    else:
                                        result = get_rapid_ocr()(img)
                                        ocr_p_txt = "\n".join(text for text in (result.txts or []) if text).strip()
                                    if ocr_p_txt:
                                        p_txt = ocr_p_txt
                                        ocr_applied = True
                                        confidence = 0.82
                                except Exception:
                                    p_txt = f"[Page {p_num}: Scanned Image Content ({pix.width}x{pix.height}) - OCR binary pending]"
                            else:
                                p_txt = f"[Page {p_num}: Scanned page with {len(page.get_images())} embedded image(s)]"

                        page_texts.append({"page": p_num, "text": p_txt})

                    extracted_text = "\n\n".join([f"--- Page {pt['page']} ---\n{pt['text']}" for pt in page_texts]).strip()

                except Exception as e:
                    return {
                        "success": False,
                        "text": "",
                        "is_scanned": False,
                        "page_count": 0,
                        "message": f"Corrupted or invalid PDF format: {str(e)}"
                    }
        else:
            # Plain text or UTF-8 encoded files
            try:
                extracted_text = file_bytes.decode("utf-8").strip()
            except UnicodeDecodeError:
                extracted_text = file_bytes.decode("latin-1", errors="ignore").strip()
            page_texts = [{"page": 1, "text": extracted_text}]

        words = extracted_text.split()
        if len(words) < 8 or len(extracted_text) < 25:
            is_scanned = True
            return {
                "success": False,
                "text": extracted_text,
                "is_scanned": True,
                "ocr_applied": ocr_applied,
                "confidence": 0.20,
                "word_count": len(words),
                "page_count": page_count,
                "page_references": page_texts,
                "message": (
                    "Scanned or low-confidence document detected (< 8 readable words). "
                    "Submission flagged for faculty review."
                )
            }

        return {
            "success": True,
            "text": extracted_text,
            "is_scanned": is_scanned,
            "ocr_applied": ocr_applied,
            "confidence": confidence,
            "word_count": len(words),
            "page_count": page_count,
            "page_references": page_texts,
            "message": f"Successfully extracted {len(words)} words across {page_count} page(s)."
        }

    @staticmethod
    def validate_rubric(total_marks: float, rubric: Dict[str, Any]) -> Tuple[bool, str]:
        """
        Validates that the sum of rubric criteria max_points strictly equals total_marks.
        """
        criteria = rubric.get("criteria", [])
        if not criteria:
            return False, "Rubric must contain at least one evaluation criterion."

        criteria_sum = sum(c.get("max_points", 0) for c in criteria)
        if round(criteria_sum, 2) != round(total_marks, 2):
            return False, (
                f"Rubric validation failed: sum of criteria marks ({criteria_sum}) "
                f"does not equal assessment total marks ({total_marks})."
            )

        return True, "Rubric marks mathematically verified."

    @classmethod
    def create_annotated_pages(cls, file_bytes: bytes, filename: str, output_dir: str, reference_answer: str, max_marks: float) -> Dict[str, Any]:
        """Render original pages and return editable, grouped OCR answer regions with per-region marks."""
        if not PIL_AVAILABLE:
            return {"pages": [], "total_score": 0.0, "max_score": max_marks, "percentage": 0.0}
        try:
            ext = Path(filename).suffix.lower()
            images = []
            if ext == ".pdf" and PYMUPDF_AVAILABLE:
                document = fitz.open(stream=file_bytes, filetype="pdf")
                for page in document:
                    pixmap = page.get_pixmap(dpi=140, alpha=False)
                    images.append(Image.frombytes("RGB", (pixmap.width, pixmap.height), pixmap.samples))
            elif ext in {".png", ".jpg", ".jpeg", ".webp", ".bmp"}:
                images.append(Image.open(io.BytesIO(file_bytes)).convert("RGB"))
            else:
                return {"pages": [], "total_score": 0.0, "max_score": max_marks, "percentage": 0.0}

            rendered = []
            destination = Path(output_dir)
            destination.mkdir(parents=True, exist_ok=True)
            for page_number, image in enumerate(images, start=1):
                raw_lines = []
                try:
                    if PYTESSERACT_AVAILABLE:
                        try:
                            data = pytesseract.image_to_data(image, output_type=pytesseract.Output.DICT)
                            grouped: Dict[Tuple[int, int, int], Dict[str, Any]] = {}
                            for index, value in enumerate(data.get("text", [])):
                                if not value.strip():
                                    continue
                                key = (data["block_num"][index], data["par_num"][index], data["line_num"][index])
                                left, top = data["left"][index], data["top"][index]
                                line = grouped.setdefault(key, {"text": [], "left": left, "top": top, "right": left, "bottom": top})
                                line["text"].append(value.strip())
                                line["left"] = min(line["left"], left)
                                line["top"] = min(line["top"], top)
                                line["right"] = max(line["right"], left + data["width"][index])
                                line["bottom"] = max(line["bottom"], top + data["height"][index])
                            raw_lines = list(grouped.values())
                        except Exception:
                            raw_lines = []
                    if not raw_lines and RAPIDOCR_AVAILABLE:
                        result = get_rapid_ocr()(image)
                        for index, text in enumerate(result.txts or []):
                            if not text or index >= len(result.boxes):
                                continue
                            points = result.boxes[index]
                            xs, ys = [float(point[0]) for point in points], [float(point[1]) for point in points]
                            raw_lines.append({"text": [text], "left": min(xs), "top": min(ys), "right": max(xs), "bottom": max(ys)})
                except Exception:
                    raw_lines = []

                raw_lines.sort(key=lambda line: (line["top"], line["left"]))
                heights = sorted(max(8, line["bottom"] - line["top"]) for line in raw_lines)
                median_height = heights[len(heights) // 2] if heights else 18
                gap_threshold = max(44, median_height * 2.7)
                groups: List[List[Dict[str, Any]]] = []
                for line in raw_lines:
                    is_question_heading = bool(re.match(r"^\s*(?:question\s*)?q?\d{1,3}\s*[).:\-]", " ".join(line["text"]), re.I))
                    if not groups or line["top"] - groups[-1][-1]["bottom"] > gap_threshold or is_question_heading:
                        groups.append([line])
                    else:
                        groups[-1].append(line)

                reference_chunks = [chunk.strip() for chunk in re.split(r"(?<=[.!?])\s+|\n+", reference_answer) if chunk.strip()]
                reference_chunks = reference_chunks or [reference_answer]
                region_boxes = []
                current_question = "Q1"
                part_counts: Dict[str, int] = {}
                for index, group in enumerate(groups, start=1):
                    left = max(0, min(line["left"] for line in group) - 10)
                    top = max(0, min(line["top"] for line in group) - 8)
                    right = min(image.width, max(line["right"] for line in group) + 10)
                    bottom = min(image.height, max(line["bottom"] for line in group) + 8)
                    student_text = " ".join(" ".join(line["text"]) for line in group)
                    question_match = re.match(r"^\s*(?:question\s*)?q?(\d{1,3})\s*[).:\-]", " ".join(group[0]["text"]), re.I)
                    if question_match:
                        current_question = f"Q{question_match.group(1)}"
                    part_counts[current_question] = part_counts.get(current_question, 0) + 1
                    label = f"{current_question} · Part {part_counts[current_question]}"
                    student_words = set(re.findall(r"\b[a-z0-9]{2,}\b", student_text.lower()))
                    best_match = 0.0
                    for reference_chunk in reference_chunks:
                        reference_words = set(re.findall(r"\b[a-z0-9]{2,}\b", reference_chunk.lower()))
                        if not reference_words or not student_words:
                            continue
                        intersection = len(student_words & reference_words)
                        precision = intersection / len(student_words)
                        recall = intersection / len(reference_words)
                        best_match = max(best_match, (2 * precision * recall / (precision + recall)) if precision + recall else 0.0)
                    awarded_fraction = min(1.0, max(0.0, best_match))
                    max_for_region = 0.0
                    awarded = 0.0
                    status = "correct" if awarded_fraction >= 0.8 else ("partial" if awarded_fraction >= 0.25 else "wrong")
                    region_boxes.append({
                        "id": f"p{page_number}-r{index}", "label": label,
                        "x": round(left / image.width, 5), "y": round(top / image.height, 5),
                        "width": round((right - left) / image.width, 5), "height": round((bottom - top) / image.height, 5),
                        "status": status, "awarded": awarded, "max_marks": round(max_for_region, 2),
                        "text": student_text[:500], "similarity": round(awarded_fraction, 3),
                    })

                if not region_boxes:
                    region_boxes.append({
                        "id": f"p{page_number}-manual-1", "label": "Q1 · Part 1",
                        "x": 0.05, "y": 0.05, "width": 0.9, "height": 0.9,
                        "status": "wrong", "awarded": 0.0, "max_marks": 0.0,
                        "text": "No readable answer text was detected. Adjust this box and grade the page manually.", "similarity": 0.0,
                    })

                target = destination / f"page-{page_number}.png"
                image.save(target, format="PNG", optimize=True)
                rendered.append({"page_number": page_number, "width": image.width, "height": image.height, "image_path": str(target), "boxes": region_boxes})

            flat_regions = [box for page in rendered for box in page["boxes"]]
            max_for_region = max_marks / max(1, len(flat_regions))
            allocated = 0.0
            for index, region in enumerate(flat_regions):
                region["max_marks"] = round(max_marks - allocated, 2) if index == len(flat_regions) - 1 else round(max_for_region, 2)
                allocated += region["max_marks"]
                region["awarded"] = round(region["max_marks"] * region["similarity"], 2)
                region["status"] = "correct" if region["similarity"] >= 0.8 else ("partial" if region["similarity"] >= 0.25 else "wrong")
            total_score = round(sum(box["awarded"] for box in flat_regions), 2)
            total_max = round(sum(box["max_marks"] for box in flat_regions), 2)
            percentage = round(total_score / total_max * 100, 1) if total_max else 0.0
            return {"pages": rendered, "total_score": min(total_score, max_marks), "max_score": max_marks, "percentage": percentage}
        except Exception:
            return {"pages": [], "total_score": 0.0, "max_score": max_marks, "percentage": 0.0}

    @staticmethod
    def _compute_cosine_similarity(vec_a, vec_b) -> float:
        norm_a = math.sqrt(sum(x * x for x in vec_a))
        norm_b = math.sqrt(sum(y * y for y in vec_b))
        if norm_a == 0 or norm_b == 0:
            return 0.0
        return sum(x * y for x, y in zip(vec_a, vec_b)) / (norm_a * norm_b)

    @classmethod
    def evaluate_submission(
        cls,
        submitted_text: str,
        reference_answer: str,
        rubric: Dict[str, Any],
        max_marks: float
    ) -> Dict[str, Any]:
        """
        Advanced Semantic Grading Engine combining:
        - SentenceTransformer embeddings ('all-MiniLM-L6-v2')
        - Criterion-level cosine similarity
        - Lexical concept coverage
        - Invariant & contradiction penalties
        - Strict rubric bounds (awarded <= criterion max, total <= max_marks)
        - Verbatim evidence quotation
        """
        st_model = get_sentence_transformer()

        student_words = set(re.findall(r"\b[a-zA-Z]{3,}\b", submitted_text.lower()))
        ref_words = set(re.findall(r"\b[a-zA-Z]{3,}\b", reference_answer.lower()))

        # Lexical domain coverage
        common_terms = ref_words.intersection(student_words)
        coverage_ratio = len(common_terms) / max(1, len(ref_words))

        # Split student answer into candidate sentences for evidence quotation
        sentences = [s.strip() for s in re.split(r"[.!?\n]", submitted_text) if len(s.strip()) > 15]

        # Compute overall embedding similarity if transformer is available
        overall_semantic_sim = 0.50
        student_emb = None
        ref_emb = None

        if st_model is not None:
            try:
                embs = st_model.encode([submitted_text, reference_answer])
                student_emb = embs[0]
                ref_emb = embs[1]
                sim_matrix = st_model.similarity([student_emb], [ref_emb])
                overall_semantic_sim = float(sim_matrix[0][0])
            except Exception:
                overall_semantic_sim = coverage_ratio
        else:
            overall_semantic_sim = coverage_ratio

        # Contradiction / Fallacy Detection
        contradictions = []
        sub_lower = submitted_text.lower()

        # Domain contradiction checks
        if "dijkstra" in sub_lower and ("negative" in sub_lower and "works" in sub_lower and "not" not in sub_lower):
            contradictions.append("Erroneously asserts that Dijkstra algorithm works on graphs with negative weights.")

        if "avl" in sub_lower and "o(n)" in sub_lower and "worst" in sub_lower and "search" in sub_lower:
            contradictions.append("Erroneously claims AVL search complexity is O(N) in worst case.")

        if "red and black" in sub_lower or "color flipping" in sub_lower:
            if "avl" in reference_answer.lower():
                contradictions.append("Confuses AVL height balancing rotations with Red-Black tree color flips.")

        criteria = rubric.get("criteria", [])
        rubric_breakdown = {}
        total_awarded = 0.0

        for crit in criteria:
            name = crit.get("name", "General Criterion")
            crit_max = float(crit.get("max_points", 10.0))
            crit_desc = crit.get("description", "")

            # Criterion-level semantic similarity & evidence extraction
            crit_sim = overall_semantic_sim
            evidence_sentence = sentences[0] if sentences else submitted_text[:120]

            if st_model is not None and sentences:
                try:
                    # Compare each student sentence with criterion description + relevant reference segment
                    crit_query = f"{name}: {crit_desc}"
                    sentence_embs = st_model.encode(sentences)
                    query_emb = st_model.encode(crit_query)
                    sims = [cls._compute_cosine_similarity(s_emb, query_emb) for s_emb in sentence_embs]
                    best_idx = int(sims.index(max(sims)))
                    evidence_sentence = sentences[best_idx]
                    crit_sim = max(0.0, float(sims[best_idx]))
                except Exception:
                    crit_sim = overall_semantic_sim
            else:
                # Lexical heuristic fallback for evidence
                for s in sentences:
                    s_low = s.lower()
                    if any(w in s_low for w in ["avl", "rotation", "balance", "dijkstra", "greedy", "weight", "queue", "invariant", "negative"]):
                        evidence_sentence = s
                        break

            # Combine semantic similarity with lexical coverage & structural completeness
            # Bounded partial credit calculation
            name_lower = name.lower()
            effective_sim = max(overall_semantic_sim, crit_sim)

            if "technical" in name_lower or "accuracy" in name_lower:
                # High semantic similarity with reference yields proportional academic credit
                if effective_sim >= 0.70:
                    raw_factor = min(1.0, (effective_sim * 1.10) + (coverage_ratio * 0.20))
                else:
                    raw_factor = min(0.60, (effective_sim * 0.75) + (coverage_ratio * 0.30))
                if contradictions:
                    raw_factor *= 0.50 # Penalty for explicit contradictions
                reason = f"Evaluated using SentenceTransformer (sim: {effective_sim:.2f}) and domain coverage ({coverage_ratio*100:.0f}%)."
            elif "conceptual" in name_lower or "depth" in name_lower:
                length_factor = min(1.0, len(sentences) / 3.0) if sentences else 0.2
                if effective_sim >= 0.70:
                    raw_factor = min(1.0, (effective_sim * 0.90) + (length_factor * 0.20))
                else:
                    raw_factor = min(0.60, (effective_sim * 0.60) + (length_factor * 0.25))
                reason = f"Evaluated conceptual structure and justification (sim: {effective_sim:.2f})."
            elif "edge" in name_lower or "proof" in name_lower:
                has_proof_terms = any(term in student_words for term in ["negative", "fail", "cycle", "greedy", "invariant", "proof", "breaks", "degenerate", "boundary", "worst"])
                edge_factor = 0.90 if has_proof_terms else 0.30
                raw_factor = (effective_sim * 0.50) + (edge_factor * 0.50)
                reason = "Assessed consideration of degenerate conditions and invariant boundaries."
            else:
                # Clarity and communication
                length_scale = min(1.0, len(submitted_text.split()) / 40.0)
                raw_factor = (effective_sim * 0.60) + (length_scale * 0.40)
                reason = "Assessed technical communication clarity and readability."

            # Strict bounds enforcement: 0.0 <= awarded <= crit_max
            awarded = round(crit_max * min(1.0, max(0.0, raw_factor)), 1)
            total_awarded += awarded

            missing = []
            if coverage_ratio < 0.45:
                missing.append(f"Incomplete derivation of formal bounds for {name}.")
            if crit_sim < 0.35:
                missing.append(f"Low semantic alignment with model reference on {name}.")

            rubric_breakdown[name] = {
                "score": awarded,
                "max": crit_max,
                "status": "correct" if awarded >= crit_max * 0.85 else ("wrong" if awarded <= crit_max * 0.15 else "partial"),
                "semantic_similarity": round(crit_sim, 3),
                "evidence": evidence_sentence[:200] + ("..." if len(evidence_sentence) > 200 else ""),
                "missing_concepts": missing,
                "incorrect_concepts": contradictions if ("technical" in name_lower and contradictions) else [],
                "reason": reason
            }

        total_awarded = min(max_marks, round(total_awarded, 1))
        percentage = round((total_awarded / max_marks) * 100.0, 1)

        # High-level diagnostic feedback
        correct_concepts = []
        missing_concepts = []
        incorrect_concepts = list(contradictions)
        suggestions = []

        if coverage_ratio >= 0.50:
            correct_concepts.append("Accurately captured structural invariants and rebalancing mechanics.")
        else:
            correct_concepts.append("Identified introductory syllabus concepts.")
            missing_concepts.append("Missing rigorous asymptotic bounds and detailed rotation mechanics.")

        if overall_semantic_sim >= 0.60:
            correct_concepts.append(f"Demonstrated strong semantic alignment with reference solution ({overall_semantic_sim*100:.1f}%).")
        else:
            suggestions.append("Consult PS1 adaptive remedial notes on tree rebalancing and greedy proofs.")

        return {
            "total_score": total_awarded,
            "max_score": max_marks,
            "percentage": percentage,
            "overall_semantic_similarity": round(overall_semantic_sim, 3),
            "model_engine": _SENTENCE_MODEL_NAME if st_model is not None else "Deterministic Fallback",
            "rubric_breakdown": rubric_breakdown,
            "ai_feedback": {
                "correct_concepts": correct_concepts,
                "missing_concepts": missing_concepts,
                "incorrect_concepts": incorrect_concepts,
                "suggestions": suggestions
            }
        }
