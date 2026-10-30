from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from ..database import get_db
from ..models import RoleProfile, RoleSkill, Skill
from ..schemas import RoleProfileOut, RoleSkillOut

router = APIRouter(prefix="/roles", tags=["Roles"])

@router.get("", response_model=List[RoleProfileOut])
def get_all_roles(db: Session = Depends(get_db)):
    """
    Returns the four canonical industry role profiles:
    1. Frontend Developer
    2. Backend Developer
    3. Full-Stack Developer
    4. Data/ML Developer
    """
    roles = db.query(RoleProfile).all()
    results = []
    for r in roles:
        skills_out = []
        for rs in r.skills:
            s = rs.skill
            if s:
                skills_out.append(RoleSkillOut(
                    skill_id=s.id,
                    skill_name=s.canonical_name,
                    category=s.category,
                    demand_weight=rs.demand_weight,
                    required_level=rs.required_level,
                    estimated_hours=s.estimated_hours,
                    description=s.description
                ))
        results.append(RoleProfileOut(
            id=r.id,
            role_name=r.role_name,
            description=r.description,
            source_type=r.source_type,
            source_date=r.source_date,
            evidence_status=r.evidence_status,
            is_demo=r.is_demo,
            skill_count=len(skills_out),
            skills=skills_out
        ))
    return results

@router.get("/{id}", response_model=RoleProfileOut)
def get_role_detail(id: str, db: Session = Depends(get_db)):
    """Retrieve detailed role profile including demand weights and canonical skill requirements."""
    r = db.query(RoleProfile).filter(RoleProfile.id == id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Role profile not found")
    
    skills_out = []
    for rs in r.skills:
        s = rs.skill
        if s:
            skills_out.append(RoleSkillOut(
                skill_id=s.id,
                skill_name=s.canonical_name,
                category=s.category,
                demand_weight=rs.demand_weight,
                required_level=rs.required_level,
                estimated_hours=s.estimated_hours,
                description=s.description
            ))
    
    return RoleProfileOut(
        id=r.id,
        role_name=r.role_name,
        description=r.description,
        source_type=r.source_type,
        source_date=r.source_date,
        evidence_status=r.evidence_status,
        is_demo=r.is_demo,
        skill_count=len(skills_out),
        skills=skills_out
    )
