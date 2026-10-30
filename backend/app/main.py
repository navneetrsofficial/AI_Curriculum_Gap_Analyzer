import os
import time
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .database import engine, Base, SessionLocal
from .seed_data import seed_database
from .routers import (
    curricula, roles, skills, mappings, assessments,
    analysis, roadmaps, resources, evaluation
)

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Career-Aligned Skill Gap Analysis & Personalized Learning Roadmap using Explainable AI",
    version="1.0.0"
)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(curricula.router, prefix=settings.API_V1_STR)
app.include_router(roles.router, prefix=settings.API_V1_STR)
app.include_router(skills.router, prefix=settings.API_V1_STR)
app.include_router(mappings.router, prefix=settings.API_V1_STR)
app.include_router(assessments.router, prefix=settings.API_V1_STR)
app.include_router(analysis.router, prefix=settings.API_V1_STR)
app.include_router(roadmaps.router, prefix=settings.API_V1_STR)
app.include_router(resources.router, prefix=settings.API_V1_STR)
app.include_router(evaluation.router, prefix=settings.API_V1_STR)

@app.on_event("startup")
def on_startup():
    # Robust database connection & schema initialization with retries for cloud cold-starts
    max_retries = 5
    for attempt in range(1, max_retries + 1):
        try:
            Base.metadata.create_all(bind=engine)
            break
        except Exception as e:
            if attempt == max_retries:
                print(f"[Warning] DB initialization failed after {max_retries} attempts: {e}")
            else:
                time.sleep(2)

    db = SessionLocal()
    try:
        seed_database(db)
        mappings.ensure_engines_indexed(db)
    except Exception as e:
        print(f"[Warning] Seeding or indexing warning: {e}")
    finally:
        db.close()

@app.get("/")
def root():
    return {
        "project": settings.PROJECT_NAME,
        "subtitle": "Career-Aligned Skill Gap Analysis & Personalized Learning Roadmap",
        "status": "online",
        "documentation": "/docs",
        "demo_mode": settings.IS_DEMO_MODE
    }

@app.post("/api/reset-demo")
def reset_demo_data():
    """Resets the database and reseeds standard demo records."""
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_database(db)
        mappings.keyword_engine.is_indexed = False
        mappings.semantic_engine.is_indexed = False
        mappings.ensure_engines_indexed(db)
    finally:
        db.close()
    return {"message": "Demo data successfully reset to clean default state."}
