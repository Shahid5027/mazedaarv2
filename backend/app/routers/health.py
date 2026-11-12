from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database import get_db
from app.schemas.common import APIResponse

router = APIRouter(prefix="/api", tags=["System & Health"])

@router.get("/health", response_model=APIResponse[dict])
def health_check(db: Session = Depends(get_db)):
    db_ok = True
    try:
        db.execute(text("SELECT 1"))
    except Exception:
        db_ok = False

    return APIResponse(
        success=True,
        module="system",
        student_id=None,
        data={
            "status": "healthy",
            "service": "EDUCORE AI Integrated Backend",
            "database_connected": db_ok,
            "version": "1.0.0",
            "integrated_modules": ["PS1_AdaptiveLearning", "PS2_AnswerEvaluation", "PS3_DropoutPrediction"]
        },
        message="System operational"
    )

