import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from ..database import get_db
from ..models import UserSkillAssessment, Skill
from ..schemas import AssessmentCreate, AssessmentOut

router = APIRouter(prefix="/assessments", tags=["Self Assessment"])

RATING_NUMERIC_MAP = {
    "None": 0.0,
    "Basic": 0.5,
    "Can Build Something": 1.0,
    "Not sure": 0.0 # Kept separate, conservative indicator
}

@router.get("", response_model=List[AssessmentOut])
def get_user_assessments(user_id: str = "student_user", db: Session = Depends(get_db)):
    """Retrieve all self-assessments recorded for the student."""
    records = db.query(UserSkillAssessment).filter(UserSkillAssessment.user_id == user_id).all()
    results = []
    for r in records:
        s = r.skill
        results.append(AssessmentOut(
            id=r.id,
            user_id=r.user_id,
            skill_id=r.skill_id,
            skill_name=s.canonical_name if s else r.skill_id,
            rating=r.rating,
            rating_numeric=r.rating_numeric,
            assessed_at=r.assessed_at
        ))
    return results

@router.post("", response_model=AssessmentOut)
def record_self_assessment(payload: AssessmentCreate, db: Session = Depends(get_db)):
    """
    Records or updates a student's self-assessed competence:
    - None (0.0): Little or no practical understanding.
    - Basic (0.5): Understands fundamentals; simple tasks with guidance.
    - Can Build Something (1.0): Independently builds or completes practical tasks.
    - Not sure: Needs verification.
    """
    skill = db.query(Skill).filter(Skill.id == payload.skill_id).first()
    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found in taxonomy")

    rating_num = RATING_NUMERIC_MAP.get(payload.rating, 0.0)

    # Upsert existing record
    existing = db.query(UserSkillAssessment).filter(
        UserSkillAssessment.user_id == payload.user_id,
        UserSkillAssessment.skill_id == payload.skill_id
    ).first()

    if existing:
        existing.rating = payload.rating
        existing.rating_numeric = rating_num
        existing.assessed_at = datetime.datetime.utcnow()
        db.commit()
        db.refresh(existing)
        return AssessmentOut(
            id=existing.id,
            user_id=existing.user_id,
            skill_id=existing.skill_id,
            skill_name=skill.canonical_name,
            rating=existing.rating,
            rating_numeric=existing.rating_numeric,
            assessed_at=existing.assessed_at
        )
    else:
        new_rec = UserSkillAssessment(
            user_id=payload.user_id,
            skill_id=payload.skill_id,
            rating=payload.rating,
            rating_numeric=rating_num,
            assessed_at=datetime.datetime.utcnow()
        )
        db.add(new_rec)
        db.commit()
        db.refresh(new_rec)
        return AssessmentOut(
            id=new_rec.id,
            user_id=new_rec.user_id,
            skill_id=new_rec.skill_id,
            skill_name=skill.canonical_name,
            rating=new_rec.rating,
            rating_numeric=new_rec.rating_numeric,
            assessed_at=new_rec.assessed_at
        )

@router.post("/batch")
def batch_update_assessments(items: List[AssessmentCreate], db: Session = Depends(get_db)):
    """Batch updates multiple skill self-assessments in one call."""
    count = 0
    for item in items:
        rating_num = RATING_NUMERIC_MAP.get(item.rating, 0.0)
        existing = db.query(UserSkillAssessment).filter(
            UserSkillAssessment.user_id == item.user_id,
            UserSkillAssessment.skill_id == item.skill_id
        ).first()
        if existing:
            existing.rating = item.rating
            existing.rating_numeric = rating_num
            existing.assessed_at = datetime.datetime.utcnow()
        else:
            db.add(UserSkillAssessment(
                user_id=item.user_id,
                skill_id=item.skill_id,
                rating=item.rating,
                rating_numeric=rating_num,
                assessed_at=datetime.datetime.utcnow()
            ))
        count += 1
    db.commit()
    return {"message": f"Successfully updated {count} skill self-assessments"}
