import os
import uvicorn
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.database import engine, Base
from app.seed_data import seed_database
from app.routers import health, students, users, ps1_router, ps2_router, ps3_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Ensure database schema & seed demo data
    print("Initializing EDUCORE AI Database...")
    Base.metadata.create_all(bind=engine)
    seed_database()
    yield
    print("Shutting down EDUCORE AI Backend.")

app = FastAPI(
    title="EDUCORE AI — Integrated Foundation API",
    description="Integrated Technical Foundation for CodeSpark 2026: PS1 Adaptive Learning, PS2 Subjective Evaluation, and PS3 Dropout Retention Copilot.",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS setup for frontend Next.js communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Custom exception handler for standard error JSON structure
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "module": "system",
            "student_id": None,
            "data": None,
            "message": f"Server Error: {str(exc)}"
        }
    )

# Include All Module Routers
app.include_router(health.router)
app.include_router(students.router)
app.include_router(users.router)
app.include_router(ps1_router.router)
app.include_router(ps2_router.router)
app.include_router(ps3_router.router)

@app.get("/")
def root():
    return {
        "success": True,
        "module": "system",
        "student_id": None,
        "data": {
            "platform": "EDUCORE AI — Intelligent Student Success & Academic Management System",
            "documentation": "/docs",
            "endpoints": {
                "health": "/api/health",
                "students": "/api/students",
                "ps1_adaptive": "/api/ps1/topics",
                "ps2_evaluation": "/api/ps2/assessments",
                "ps3_retention": "/api/ps3/risk-overview"
            }
        },
        "message": "Welcome to EDUCORE AI Phase 1 Integrated Foundation"
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

