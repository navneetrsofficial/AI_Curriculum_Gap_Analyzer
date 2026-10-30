import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from ..database import get_db
from ..models import Skill, CourseOutcome, Course, CurriculumSkillMapping
from ..schemas import MappingSuggestRequest, MappingReviewRequest, CurriculumMappingOut
from ..ml.keyword_engine import KeywordBaselineEngine
from ..ml.semantic_engine import SemanticEmbeddingEngine
from ..config import settings

router = APIRouter(prefix="/mappings", tags=["Mapping Engine"])

# Global singleton engine instances
keyword_engine = KeywordBaselineEngine()
semantic_engine = SemanticEmbeddingEngine(model_name=settings.EMBEDDING_MODEL_NAME)

def ensure_engines_indexed(db: Session):
    """Ensures engines are indexed with all canonical skills from the database."""
    if not keyword_engine.is_indexed or not semantic_engine.is_indexed:
        skills = db.query(Skill).all()
        skills_data = [
            {
                "id": s.id,
                "canonical_name": s.canonical_name,
                "description": s.description,
                "category": s.category,
                "aliases_json": s.aliases_json
            }
            for s in skills
        ]
        keyword_engine.index_skills(skills_data)
        semantic_engine.index_skills(skills_data)

@router.get("/status")
def get_mapping_engine_status(db: Session = Depends(get_db)):
    """Returns transparent metadata on the NLP engines."""
    ensure_engines_indexed(db)
    return {
        "keyword_baseline": {
            "name": "Normalized Token Overlap + Jaccard + TF-IDF Lexical Cosine",
            "is_indexed": keyword_engine.is_indexed,
            "indexed_skills": len(keyword_engine.skills)
        },
        "semantic_model": semantic_engine.get_engine_status(),
        "thresholds": {
            "high": settings.SIMILARITY_THRESHOLD_HIGH,
            "medium": settings.SIMILARITY_THRESHOLD_MEDIUM
        }
    }

@router.post("/suggest")
def suggest_skill_mappings(payload: MappingSuggestRequest, db: Session = Depends(get_db)):
    """
    Core AI Mapping Suggestion:
    Runs both Keyword Baseline and Semantic Embedding mapping on the outcome text,
    returning candidate matches side-by-side with similarity scores, confidence levels, and explanations.
    """
    ensure_engines_indexed(db)
    
    query = payload.outcome_text
    if payload.course_name:
        query = f"{payload.course_name}: {query}"

    kw_matches = keyword_engine.find_matches(query, top_k=payload.top_k)
    sem_matches = semantic_engine.find_matches(query, top_k=payload.top_k)

    # Detect method disagreement for transparency
    top_kw_id = kw_matches[0]["skill_id"] if kw_matches else None
    top_sem_id = sem_matches[0]["skill_id"] if sem_matches else None
    methods_agree = (top_kw_id == top_sem_id)

    disagreement_note = None
    if not methods_agree and top_kw_id and top_sem_id:
        disagreement_note = (
            f"Methods diverge: Keyword baseline prioritizes '{kw_matches[0]['canonical_name']}' "
            f"whereas Semantic embedding prioritizes '{sem_matches[0]['canonical_name']}'. "
            f"Review suggested."
        )

    return {
        "query_text": payload.outcome_text,
        "methods_agree": methods_agree,
        "disagreement_note": disagreement_note,
        "keyword_baseline_candidates": kw_matches,
        "semantic_embedding_candidates": sem_matches
    }

@router.post("/review")
def review_skill_mapping(payload: MappingReviewRequest, db: Session = Depends(get_db)):
    """
    Accept, Reject, or Mark for Review a mapping suggestion.
    Only ACCEPTED mappings contribute to curriculum coverage calculations.
    """
    outcome = db.query(CourseOutcome).filter(CourseOutcome.id == payload.course_outcome_id).first()
    if not outcome:
        raise HTTPException(status_code=404, detail="Course outcome not found")

    skill = db.query(Skill).filter(Skill.id == payload.skill_id).first()
    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")

    # Check existing mapping
    mapping = None
    if payload.mapping_id:
        mapping = db.query(CurriculumSkillMapping).filter(CurriculumSkillMapping.id == payload.mapping_id).first()
    else:
        mapping = db.query(CurriculumSkillMapping).filter(
            CurriculumSkillMapping.course_outcome_id == payload.course_outcome_id,
            CurriculumSkillMapping.skill_id == payload.skill_id
        ).first()

    if not mapping:
        mapping = CurriculumSkillMapping(
            course_outcome_id=payload.course_outcome_id,
            skill_id=payload.skill_id,
            method=payload.method,
            similarity_score=payload.similarity_score,
            review_status=payload.review_status,
            evidence_text=payload.evidence_text or f"Mapped from: {outcome.outcome_text[:100]}...",
            reviewed_at=datetime.datetime.utcnow()
        )
        db.add(mapping)
    else:
        mapping.review_status = payload.review_status
        mapping.similarity_score = payload.similarity_score
        mapping.method = payload.method
        if payload.evidence_text:
            mapping.evidence_text = payload.evidence_text
        mapping.reviewed_at = datetime.datetime.utcnow()

    db.commit()
    db.refresh(mapping)

    return {
        "message": f"Mapping status updated to {payload.review_status}",
        "mapping_id": mapping.id,
        "review_status": mapping.review_status
    }

@router.get("/curriculum/{id}", response_model=List[CurriculumMappingOut])
def get_curriculum_mappings(id: int, db: Session = Depends(get_db)):
    """Retrieve all mappings for outcomes within a specified curriculum version."""
    outcomes = db.query(CourseOutcome).join(Course).join(Course.semester).filter(
        Course.semester.has(curriculum_version_id=id)
    ).all()

    outcome_ids = [o.id for o in outcomes]
    mappings = db.query(CurriculumSkillMapping).filter(
        CurriculumSkillMapping.course_outcome_id.in_(outcome_ids)
    ).all()

    results = []
    for m in mappings:
        co = m.course_outcome
        c = co.course if co else None
        s = m.skill
        results.append(CurriculumMappingOut(
            id=m.id,
            course_outcome_id=m.course_outcome_id,
            course_name=c.name if c else None,
            course_code=c.course_code if c else None,
            outcome_code=co.outcome_code if co else None,
            outcome_text=co.outcome_text if co else None,
            bloom_level=co.bloom_level if co else None,
            skill_id=m.skill_id,
            canonical_name=s.canonical_name if s else None,
            category=s.category if s else None,
            similarity_score=m.similarity_score,
            method=m.method,
            review_status=m.review_status,
            evidence_text=m.evidence_text,
            model_version=m.model_version
        ))
    return results
