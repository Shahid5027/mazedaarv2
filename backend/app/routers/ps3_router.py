from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
import datetime
import uuid

from app.database import get_db
from app.models.entities import Student, RiskPrediction, Intervention, ActivitySnapshot
from app.schemas.common import APIResponse
from app.schemas.entities import InterventionCreate, InterventionUpdate
from app.engines.ps3_dropout_engine import DropoutPredictionEngine
from app.auth import require_role

router = APIRouter(prefix="/api/ps3", tags=["PS3: Dropout Prediction Engine"])

@router.get("/metrics", response_model=APIResponse[dict])
def get_model_evaluation_metrics():
    """
    Exposes scikit-learn Random Forest model evaluation metrics:
    Precision, Recall, F1-score, ROC-AUC, Confusion Matrix, and class distribution.
    """
    pipeline, metrics = DropoutPredictionEngine.get_or_load_pipeline()
    return APIResponse(
        success=True,
        module="ps3",
        student_id=None,
        data=metrics,
        message="Model evaluation metrics loaded"
    )

@router.post("/retrain", response_model=APIResponse[dict])
def retrain_dropout_model():
    """
    Retrains the Random Forest classifier on the calibrated synthetic training cohort.
    """
    new_metrics = DropoutPredictionEngine.train_model()
    return APIResponse(
        success=True,
        module="ps3",
        student_id=None,
        data=new_metrics,
        message=f"Model {new_metrics['model_version']} retrained successfully. F1: {new_metrics['f1_score']}"
    )

@router.get("/risk-overview", response_model=APIResponse[dict])
def get_institution_risk_overview(db: Session = Depends(get_db)):
    predictions = db.query(RiskPrediction).all()
    total_students = len(predictions)

    if total_students == 0:
        return APIResponse(
            success=True,
            module="ps3",
            student_id=None,
            data={"total_evaluated": 0, "high_risk": 0, "medium_risk": 0, "low_risk": 0, "avg_risk_score": 0.0},
            message="No risk records found"
        )

    high_risk = [p for p in predictions if p.risk_level == "high"]
    med_risk = [p for p in predictions if p.risk_level == "medium"]
    low_risk = [p for p in predictions if p.risk_level == "low"]
    avg_score = round(sum(p.risk_score for p in predictions) / total_students, 1)

    driver_counts = {
        "Attendance Below 75%": 0,
        "Low Formative / Assessment Scores": 0,
        "Low LMS Platform Activity": 0,
        "Academic Probation (< 6.0 CGPA)": 0
    }
    for p in high_risk + med_risk:
        for f in (p.primary_factors or []):
            txt = f.get("factor", "")
            if "Attendance" in txt:
                driver_counts["Attendance Below 75%"] += 1
            elif "Score" in txt or "Mastery" in txt or "Evaluation" in txt or "Academic" in txt:
                driver_counts["Low Formative / Assessment Scores"] += 1
            elif "LMS" in txt or "Engagement" in txt:
                driver_counts["Low LMS Platform Activity"] += 1
            elif "Probation" in txt or "CGPA" in txt:
                driver_counts["Academic Probation (< 6.0 CGPA)"] += 1

    open_interventions = db.query(Intervention).filter(Intervention.status != "completed").count()

    data = {
        "total_monitored_students": total_students,
        "high_risk_count": len(high_risk),
        "medium_risk_count": len(med_risk),
        "low_risk_count": len(low_risk),
        "average_retention_risk_score": avg_score,
        "active_counselor_interventions": open_interventions,
        "distribution_percentage": {
            "high": round((len(high_risk) / total_students) * 100, 1),
            "medium": round((len(med_risk) / total_students) * 100, 1),
            "low": round((len(low_risk) / total_students) * 100, 1)
        },
        "top_institution_risk_drivers": [
            {"factor": k, "affected_students": v} for k, v in driver_counts.items()
        ]
    }

    return APIResponse(
        success=True,
        module="ps3",
        student_id=None,
        data=data,
        message="Institutional retention risk overview calculated"
    )

@router.get("/students", response_model=APIResponse[List[dict]])
def get_risk_student_table(
    risk_level: Optional[str] = None,
    sort_by: Optional[str] = "risk_score",
    db: Session = Depends(get_db)
):
    query = db.query(RiskPrediction).join(Student)
    if risk_level:
        query = query.filter(RiskPrediction.risk_level == risk_level)

    if sort_by == "risk_score":
        query = query.order_by(RiskPrediction.risk_score.desc())
    elif sort_by == "attendance":
        query = query.order_by(Student.attendance_pct.asc())
    elif sort_by == "cgpa":
        query = query.order_by(Student.cgpa.asc())

    predictions = query.all()
    results = []
    for p in predictions:
        student = db.query(Student).filter(Student.student_id == p.student_id).first()
        interventions = db.query(Intervention).filter(Intervention.student_id == p.student_id).all()
        results.append({
            "student_id": p.student_id,
            "student_name": student.name if student else "",
            "department": student.department if student else "",
            "semester": student.semester if student else 1,
            "cgpa": student.cgpa if student else 0.0,
            "attendance_pct": student.attendance_pct if student else 0.0,
            "risk_score": p.risk_score,
            "risk_probability": getattr(p, "risk_probability", round(p.risk_score / 100.0, 3)),
            "risk_level": p.risk_level,
            "confidence": p.confidence,
            "model_version": getattr(p, "model_version", "v1.2-rf-baseline"),
            "top_factor": p.primary_factors[0]["factor"] if p.primary_factors else "None",
            "active_interventions_count": len([i for i in interventions if i.status != "completed"])
        })

    return APIResponse(
        success=True,
        module="ps3",
        student_id=None,
        data=results,
        message=f"Retrieved {len(results)} risk table entries"
    )

@router.get("/explainability/{student_id}", response_model=APIResponse[dict])
def get_student_explainability(student_id: str, db: Session = Depends(get_db)):
    prediction = db.query(RiskPrediction).filter(RiskPrediction.student_id == student_id).first()
    student = db.query(Student).filter(Student.student_id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    snapshot = db.query(ActivitySnapshot).filter(ActivitySnapshot.student_id == student_id).first()

    # Prepare features for ML model explainability
    features = {
        "attendance_rate": student.attendance_pct,
        "average_grade": student.cgpa * 10.0,
        "late_assignments": snapshot.assignment_delays if snapshot else 0,
        "missing_assignments": 2 if student.status == "at_risk" else 0,
        "lms_logins_30d": snapshot.lms_logins if snapshot else 20,
        "engagement_change_pct": -15.0 if student.status == "at_risk" else 5.0,
        "previous_failure_count": 1 if student.cgpa < 5.5 else 0
    }

    ml_prediction = DropoutPredictionEngine.predict_risk(features, student_id)

    # Sync back to DB if needed
    if prediction:
        prediction.risk_score = ml_prediction["risk_score"]
        prediction.risk_level = ml_prediction["risk_level"]
        prediction.primary_factors = ml_prediction["primary_factors"]
        prediction.risk_probability = ml_prediction["risk_probability"]
        db.commit()

    return APIResponse(
        success=True,
        module="ps3",
        student_id=student_id,
        data={
            "student_id": student_id,
            "student_name": student.name,
            "risk_score": ml_prediction["risk_score"],
            "risk_probability": ml_prediction["risk_probability"],
            "risk_level": ml_prediction["risk_level"],
            "confidence": ml_prediction["confidence"],
            "model_version": ml_prediction["model_version"],
            "prediction_timestamp": ml_prediction["prediction_timestamp"],
            "primary_factors": ml_prediction["primary_factors"],
            "recommended_interventions": ml_prediction["recommended_interventions"],
            "historical_trend": prediction.historical_trend if prediction else [],
            "activity_snapshot": {
                "lms_logins": snapshot.lms_logins if snapshot else 0,
                "forum_posts": snapshot.forum_posts if snapshot else 0,
                "quiz_attempts": snapshot.quiz_attempts if snapshot else 0,
                "assignment_delays": snapshot.assignment_delays if snapshot else 0,
                "attendance_rate": student.attendance_pct
            },
            "disclaimer": ml_prediction["disclaimer"]
        },
        message=f"Model explainability indicators generated for {student_id}"
    )

@router.post("/upload-csv", response_model=APIResponse[dict])
async def upload_batch_student_csv(file: UploadFile = File(...), db: Session = Depends(get_db)):
    content = await file.read()
    try:
        decoded = content.decode("utf-8")
    except Exception:
        decoded = content.decode("latin-1", errors="ignore")

    validation_result = DropoutPredictionEngine.validate_csv(decoded)
    if not validation_result["success"] and validation_result["accepted_count"] == 0:
        return APIResponse(
            success=False,
            module="ps3",
            student_id=None,
            data=validation_result,
            message=validation_result["message"]
        )

    created_count = 0
    updated_count = 0

    for row in validation_result["accepted_rows"]:
        s_id = row["student_id"]
        existing = db.query(Student).filter(Student.student_id == s_id).first()
        att = row["attendance_rate"]
        cg = row["average_grade"] / 10.0

        # Run ML risk inference
        features = {
            "attendance_rate": att,
            "average_grade": row["average_grade"],
            "late_assignments": row["late_assignments"],
            "missing_assignments": row["missing_assignments"],
            "lms_logins_30d": row["lms_logins_30d"],
            "engagement_change_pct": row["engagement_change_pct"],
            "previous_failure_count": row["previous_failure_count"]
        }
        pred_result = DropoutPredictionEngine.predict_risk(features, s_id)

        if existing:
            existing.attendance_pct = att
            existing.cgpa = round(cg, 2)
            existing.status = "at_risk" if pred_result["risk_level"] == "high" else "active"
            updated_count += 1
        else:
            new_student = Student(
                student_id=s_id,
                name=row["name"],
                email=f"{s_id.lower()}@educore.edu",
                department=row["department"],
                semester=2,
                cgpa=round(cg, 2),
                attendance_pct=att,
                status="at_risk" if pred_result["risk_level"] == "high" else "active"
            )
            db.add(new_student)
            created_count += 1

        pred = db.query(RiskPrediction).filter(RiskPrediction.student_id == s_id).first()
        if not pred:
            pred = RiskPrediction(
                prediction_id=f"RSK_{s_id}",
                student_id=s_id,
                risk_score=pred_result["risk_score"],
                risk_probability=pred_result["risk_probability"],
                risk_level=pred_result["risk_level"],
                confidence=pred_result["confidence"],
                model_version=pred_result["model_version"],
                primary_factors=pred_result["primary_factors"],
                historical_trend=[{"period": "Batch Ingestion", "risk": pred_result["risk_score"]}]
            )
            db.add(pred)
        else:
            pred.risk_score = pred_result["risk_score"]
            pred.risk_probability = pred_result["risk_probability"]
            pred.risk_level = pred_result["risk_level"]
            pred.primary_factors = pred_result["primary_factors"]

    db.commit()

    return APIResponse(
        success=True,
        module="ps3",
        student_id=None,
        data={
            "accepted_count": validation_result["accepted_count"],
            "rejected_count": validation_result["rejected_count"],
            "created_count": created_count,
            "updated_count": updated_count,
            "rejected_rows": validation_result["rejected_rows"]
        },
        message=f"Batch CSV processed: {created_count} students added, {updated_count} updated ({validation_result['rejected_count']} rejected rows)."
    )

@router.get("/interventions", response_model=APIResponse[List[dict]])
def list_interventions(student_id: Optional[str] = None, status: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Intervention)
    if student_id:
        query = query.filter(Intervention.student_id == student_id)
    if status:
        query = query.filter(Intervention.status == status)

    interventions = query.order_by(Intervention.created_at.desc()).all()
    results = []
    for i in interventions:
        student = db.query(Student).filter(Student.student_id == i.student_id).first()
        results.append({
            "intervention_id": i.intervention_id,
            "student_id": i.student_id,
            "student_name": student.name if student else "",
            "department": student.department if student else "",
            "counselor_name": i.counselor_name,
            "title": i.title,
            "intervention_type": i.intervention_type,
            "status": i.status,
            "priority": i.priority,
            "notes": i.notes,
            "scheduled_date": i.scheduled_date,
            "created_at": i.created_at
        })

    return APIResponse(
        success=True,
        module="ps3",
        student_id=student_id,
        data=results,
        message=f"Retrieved {len(results)} interventions"
    )

@router.get("/shap/{student_id}", response_model=APIResponse[dict])
def get_student_shap_explanation(student_id: str, db: Session = Depends(get_db)):
    """
    Computes genuine local Shapley values using TreeExplainer on the Random Forest pipeline.
    Differentiates risk-increasing positive contributions from risk-reducing protective factors.
    """
    student = db.query(Student).filter(Student.student_id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail=f"Student {student_id} not found")

    snapshot = db.query(ActivitySnapshot).filter(ActivitySnapshot.student_id == student_id).first()

    features = {
        "attendance_rate": student.attendance_pct,
        "average_grade": student.cgpa * 10.0,
        "late_assignments": snapshot.assignment_delays if snapshot else 0,
        "missing_assignments": 2 if student.status == "at_risk" else 0,
        "lms_logins_30d": snapshot.lms_logins if snapshot else 18,
        "engagement_change_pct": -15.0 if student.status == "at_risk" else 4.0,
        "previous_failure_count": 1 if student.cgpa < 5.5 else 0
    }

    shap_data = DropoutPredictionEngine.compute_shap_explanation(features, student_id)
    shap_data["student_name"] = student.name

    return APIResponse(
        success=True,
        module="ps3",
        student_id=student_id,
        data=shap_data,
        message=f"SHAP TreeExplainer local attribution calculated for {student_id}"
    )

@router.get("/longitudinal/{student_id}", response_model=APIResponse[dict])
def get_student_longitudinal_trend(student_id: str, db: Session = Depends(get_db)):
    """
    Retrieves longitudinal historical risk progression and behavioral activity trends.
    """
    student = db.query(Student).filter(Student.student_id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail=f"Student {student_id} not found")

    pred = db.query(RiskPrediction).filter(RiskPrediction.student_id == student_id).first()
    snapshots = db.query(ActivitySnapshot).filter(ActivitySnapshot.student_id == student_id).order_by(ActivitySnapshot.date.asc()).all()

    # Build longitudinal trend points from stored historical records
    history_points = []
    if pred and pred.historical_trend:
        for idx, pt in enumerate(pred.historical_trend):
            period_label = pt.get("period", f"Week {(idx+1)*2}")
            r_val = float(pt.get("risk", 50.0))
            # Associated metric estimates over time
            att_val = max(30.0, min(100.0, student.attendance_pct + (idx - len(pred.historical_trend)) * 2.5))
            grade_val = max(20.0, min(100.0, student.cgpa * 10.0 + (idx - len(pred.historical_trend)) * 1.5))
            lms_val = max(2, int(20 - (r_val / 6.0)))
            history_points.append({
                "period": period_label,
                "risk_score": r_val,
                "risk_probability": round(r_val / 100.0, 3),
                "attendance_rate": round(att_val, 1),
                "average_grade": round(grade_val, 1),
                "lms_logins": lms_val
            })
    elif len(snapshots) >= 2:
        for idx, sn in enumerate(snapshots):
            history_points.append({
                "period": f"Week {(idx+1)*2}",
                "risk_score": round((100.0 - sn.attendance_rate) * 0.7, 1),
                "risk_probability": round((100.0 - sn.attendance_rate) * 0.007, 3),
                "attendance_rate": sn.attendance_rate,
                "average_grade": student.cgpa * 10.0,
                "lms_logins": sn.lms_logins
            })

    interventions = db.query(Intervention).filter(Intervention.student_id == student_id).all()

    has_history = len(history_points) >= 2
    return APIResponse(
        success=True,
        module="ps3",
        student_id=student_id,
        data={
            "student_id": student.student_id,
            "student_name": student.name,
            "current_risk_score": pred.risk_score if pred else 50.0,
            "current_risk_level": pred.risk_level if pred else "medium",
            "has_sufficient_history": has_history,
            "data_point_count": len(history_points),
            "trend_summary": (
                "Longitudinal risk trajectory indicates stabilizing trend." if has_history and history_points[-1]["risk_score"] <= history_points[0]["risk_score"]
                else "Longitudinal risk trajectory exhibits upward escalation requiring counselor intervention." if has_history
                else "Insufficient historical snapshot data (< 2 periods) to compute verified progression trends."
            ),
            "progression_series": history_points,
            "associated_interventions": [
                {
                    "intervention_id": i.intervention_id,
                    "title": i.title,
                    "status": i.status,
                    "priority": i.priority,
                    "created_at": i.created_at
                } for i in interventions
            ]
        },
        message=f"Longitudinal history retrieved for {student_id} ({len(history_points)} periods)"
    )

@router.get("/analytics/heatmap", response_model=APIResponse[dict])
def get_risk_heatmap_and_analytics(db: Session = Depends(get_db)):
    """
    Cohort-wide retention risk heatmap and intervention resolution statistics.
    """
    students = db.query(Student).all()
    predictions = db.query(RiskPrediction).all()
    interventions = db.query(Intervention).all()

    # Department distribution
    dept_map = {}
    for s in students:
        p = next((x for x in predictions if x.student_id == s.student_id), None)
        r_level = p.risk_level if p else "low"
        if s.department not in dept_map:
            dept_map[s.department] = {"department": s.department, "high": 0, "medium": 0, "low": 0, "total": 0}
        dept_map[s.department][r_level] += 1
        dept_map[s.department]["total"] += 1

    # 3x3 Risk Heatmap Matrix: Attendance vs CGPA
    # Attendance bins: <70, 70-85, >=85
    # CGPA bins: <6.0, 6.0-8.0, >=8.0
    matrix = [
        {"attendance_bin": "< 70%", "cgpa_bin": "< 6.0", "student_count": 0, "risk_category": "critical"},
        {"attendance_bin": "< 70%", "cgpa_bin": "6.0 - 8.0", "student_count": 0, "risk_category": "high"},
        {"attendance_bin": "< 70%", "cgpa_bin": ">= 8.0", "student_count": 0, "risk_category": "medium"},
        {"attendance_bin": "70% - 85%", "cgpa_bin": "< 6.0", "student_count": 0, "risk_category": "high"},
        {"attendance_bin": "70% - 85%", "cgpa_bin": "6.0 - 8.0", "student_count": 0, "risk_category": "medium"},
        {"attendance_bin": "70% - 85%", "cgpa_bin": ">= 8.0", "student_count": 0, "risk_category": "low"},
        {"attendance_bin": ">= 85%", "cgpa_bin": "< 6.0", "student_count": 0, "risk_category": "medium"},
        {"attendance_bin": ">= 85%", "cgpa_bin": "6.0 - 8.0", "student_count": 0, "risk_category": "low"},
        {"attendance_bin": ">= 85%", "cgpa_bin": ">= 8.0", "student_count": 0, "risk_category": "minimal"},
    ]

    for s in students:
        att_bin = "< 70%" if s.attendance_pct < 70 else "70% - 85%" if s.attendance_pct < 85 else ">= 85%"
        cg_bin = "< 6.0" if s.cgpa < 6.0 else "6.0 - 8.0" if s.cgpa < 8.0 else ">= 8.0"
        cell = next((c for c in matrix if c["attendance_bin"] == att_bin and c["cgpa_bin"] == cg_bin), None)
        if cell:
            cell["student_count"] += 1

    # Intervention statistics
    total_int = len(interventions)
    completed_int = len([i for i in interventions if i.status == "completed"])
    resolution_rate = round((completed_int / max(1, total_int)) * 100, 1)

    return APIResponse(
        success=True,
        module="ps3",
        student_id=None,
        data={
            "department_breakdown": list(dept_map.values()),
            "risk_matrix_heatmap": matrix,
            "intervention_statistics": {
                "total_tasks": total_int,
                "completed": completed_int,
                "in_progress": len([i for i in interventions if i.status == "in_progress"]),
                "planned": len([i for i in interventions if i.status == "planned"]),
                "resolution_rate_pct": resolution_rate
            }
        },
        message="Cohort risk heatmap and analytics computed"
    )

@router.post("/interventions", response_model=APIResponse[dict])
def create_intervention(
    payload: InterventionCreate,
    current_role: str = Depends(require_role(["counselor", "admin"])),
    db: Session = Depends(get_db)
):
    new_id = f"INT_{uuid.uuid4().hex[:6].upper()}"
    intervention = Intervention(
        intervention_id=new_id,
        student_id=payload.student_id,
        counselor_name=payload.counselor_name,
        title=payload.title,
        intervention_type=payload.intervention_type,
        status="planned",
        priority=payload.priority,
        notes=payload.notes,
        scheduled_date=payload.scheduled_date or (datetime.datetime.utcnow() + datetime.timedelta(days=3))
    )
    db.add(intervention)
    db.commit()

    return APIResponse(
        success=True,
        module="ps3",
        student_id=payload.student_id,
        data={"intervention_id": intervention.intervention_id, "title": intervention.title},
        message=f"Intervention created by authorized {current_role}"
    )

@router.patch("/interventions/{intervention_id}", response_model=APIResponse[dict])
def update_intervention(
    intervention_id: str,
    payload: InterventionUpdate,
    current_role: str = Depends(require_role(["counselor", "admin"])),
    db: Session = Depends(get_db)
):
    intervention = db.query(Intervention).filter(Intervention.intervention_id == intervention_id).first()
    if not intervention:
        raise HTTPException(status_code=404, detail="Intervention not found")

    if payload.status:
        intervention.status = payload.status
    if payload.notes:
        intervention.notes = payload.notes
    if payload.scheduled_date:
        intervention.scheduled_date = payload.scheduled_date

    db.commit()

    return APIResponse(
        success=True,
        module="ps3",
        student_id=intervention.student_id,
        data={"intervention_id": intervention.intervention_id, "status": intervention.status},
        message=f"Intervention updated to {intervention.status} by authorized {current_role}"
    )
