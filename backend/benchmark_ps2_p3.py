import os
import sys
import json

# Ensure backend root is in python path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app.engines.ps2_evaluation_engine import SubjectiveEvaluationEngine
from benchmark_ps2 import SAMPLES, BENCHMARK_REFERENCE, BENCHMARK_RUBRIC

def run_phase3_benchmark():
    print("=" * 95)
    print("EDUCORE AI — PS2 PHASE 3 SEMANTIC GRADING BENCHMARK (SentenceTransformer all-MiniLM-L6-v2)")
    print("=" * 95)
    print(f"{'Sample ID':<10} | {'Category':<8} | {'Human':<6} | {'P3 AI':<6} | {'Max':<5} | {'|Diff|':<6} | {'Tech (H/AI)':<12} | {'Depth (H/AI)':<12} | {'Sim':<6}")
    print("-" * 95)

    results = []
    total_abs_diff = 0.0
    crit_diffs = {"Technical Accuracy": 0.0, "Conceptual Depth": 0.0, "Clarity & Edge Cases": 0.0}

    for sample in SAMPLES:
        eval_result = SubjectiveEvaluationEngine.evaluate_submission(
            submitted_text=sample["text"],
            reference_answer=BENCHMARK_REFERENCE,
            rubric=BENCHMARK_RUBRIC,
            max_marks=30.0
        )

        ai_total = eval_result["total_score"]
        human_total = sample["human_marks"]["Total"]
        abs_diff = round(abs(human_total - ai_total), 2)
        total_abs_diff += abs_diff

        breakdown = eval_result["rubric_breakdown"]
        ai_tech = breakdown.get("Technical Accuracy", {}).get("score", 0.0)
        ai_depth = breakdown.get("Conceptual Depth", {}).get("score", 0.0)
        ai_clarity = breakdown.get("Clarity & Edge Cases", {}).get("score", 0.0)
        sim = eval_result.get("overall_semantic_similarity", 0.0)

        h_tech = sample["human_marks"]["Technical Accuracy"]
        h_depth = sample["human_marks"]["Conceptual Depth"]
        h_clarity = sample["human_marks"]["Clarity & Edge Cases"]

        crit_diffs["Technical Accuracy"] += abs(h_tech - ai_tech)
        crit_diffs["Conceptual Depth"] += abs(h_depth - ai_depth)
        crit_diffs["Clarity & Edge Cases"] += abs(h_clarity - ai_clarity)

        results.append({
            "sample_id": sample["sample_id"],
            "category": sample["category"],
            "human_marks": human_total,
            "ai_marks": ai_total,
            "max_marks": 30.0,
            "abs_difference": abs_diff,
            "semantic_similarity": sim,
            "criterion_agreement": {
                "technical_accuracy": {"human": h_tech, "ai": ai_tech, "diff": round(abs(h_tech - ai_tech), 2)},
                "conceptual_depth": {"human": h_depth, "ai": ai_depth, "diff": round(abs(h_depth - ai_depth), 2)},
                "clarity_edge_cases": {"human": h_clarity, "ai": ai_clarity, "diff": round(abs(h_clarity - ai_clarity), 2)}
            },
            "evidence_extracted": breakdown.get("Technical Accuracy", {}).get("evidence", "")[:80] + "..."
        })

        print(
            f"{sample['sample_id']:<10} | {sample['category']:<8} | {human_total:>5.1f}  | {ai_total:>5.1f}  | {30.0:>5.1f} | "
            f"{abs_diff:>5.1f}  | {h_tech:>4.1f}/{ai_tech:>4.1f}    | {h_depth:>4.1f}/{ai_depth:>4.1f}     | {sim:>5.2f}"
        )

    mae = round(total_abs_diff / len(SAMPLES), 2)
    tech_mae = round(crit_diffs["Technical Accuracy"] / len(SAMPLES), 2)
    depth_mae = round(crit_diffs["Conceptual Depth"] / len(SAMPLES), 2)
    clarity_mae = round(crit_diffs["Clarity & Edge Cases"] / len(SAMPLES), 2)

    # Load Phase 2.1 benchmark results for comparison
    p21_path = os.path.join(os.path.dirname(__file__), "ps2_benchmark_results.json")
    p21_mae = "N/A"
    if os.path.exists(p21_path):
        with open(p21_path, "r", encoding="utf-8") as f:
            p21_data = json.load(f)
            p21_mae = p21_data.get("overall_mae", "N/A")

    print("-" * 95)
    print(f"Phase 3 Overall MAE: {mae} marks / 30.0 ({round((mae/30.0)*100, 1)}% error margin)")
    print(f"Phase 2.1 Baseline MAE: {p21_mae} marks / 30.0")
    print(f"Criterion Breakdown MAE: Technical={tech_mae}, Conceptual={depth_mae}, Clarity={clarity_mae}")
    print("=" * 95)

    summary = {
        "benchmark_name": "PS2 Phase 3 SentenceTransformer Grading Benchmark",
        "model": "all-MiniLM-L6-v2",
        "sample_count": len(SAMPLES),
        "total_max_marks": 30.0,
        "phase3_mae": mae,
        "phase21_mae": p21_mae,
        "overall_mae_percentage": round((mae / 30.0) * 100, 1),
        "criterion_mae": {
            "technical_accuracy": tech_mae,
            "conceptual_depth": depth_mae,
            "clarity_edge_cases": clarity_mae
        },
        "samples": results
    }

    out_path = os.path.join(os.path.dirname(__file__), "ps2_p3_benchmark_results.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2)
    print(f"Phase 3 Benchmark output persisted to: {out_path}")

    return summary

if __name__ == "__main__":
    run_phase3_benchmark()

