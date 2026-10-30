from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from ..database import get_db
from ..models import LearningResource, Skill

router = APIRouter(prefix="/resources", tags=["Learning Resources"])

@router.get("")
def get_learning_resources(skill_id: Optional[str] = None, db: Session = Depends(get_db)):
    """Retrieve verified learning resources, optionally filtered by canonical skill ID."""
    query = db.query(LearningResource)
    if skill_id:
        query = query.filter(LearningResource.skill_id == skill_id)
    
    records = query.all()
    results = []
    for r in records:
        s = r.skill
        results.append({
            "id": r.id,
            "skill_id": r.skill_id,
            "skill_name": s.canonical_name if s else r.skill_id,
            "title": r.title,
            "provider": r.provider,
            "url": r.url,
            "resource_type": r.resource_type,
            "estimated_hours": r.estimated_hours,
            "verification_status": r.verification_status,
            "verified_at": r.verified_at
        })
    return results

@router.post("")
def add_learning_resource(payload: Dict[str, Any], db: Session = Depends(get_db)):
    """Registers a new verified learning resource."""
    skill_id = payload.get("skill_id")
    title = payload.get("title")
    url = payload.get("url")

    if not skill_id or not title or not url:
        raise HTTPException(status_code=400, detail="skill_id, title, and url are required.")

    skill = db.query(Skill).filter(Skill.id == skill_id).first()
    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found in taxonomy")

    new_res = LearningResource(
        skill_id=skill_id,
        title=title,
        url=url,
        provider=payload.get("provider", "Curated Reference"),
        resource_type=payload.get("resource_type", "Tutorial"),
        estimated_hours=float(payload.get("estimated_hours", 4.0)),
        verification_status="VERIFIED"
    )
    db.add(new_res)
    db.commit()
    return {"message": "Resource registered successfully", "id": new_res.id}
