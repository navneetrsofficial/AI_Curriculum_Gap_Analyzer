import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from ..database import get_db
from ..models import (
    RoleProfile, RoleSkill, CurriculumVersion, Course, CourseOutcome,
    CurriculumSkillMapping, UserSkillAssessment, AnalysisRun, Skill
)
from ..schemas import AnalysisRequest, AnalysisResultOut, SkillGapDetail

router = APIRouter(prefix="/analysis", tags=["Skill Gap Analysis"])

# Documented Bloom's depth factors
BLOOM_DEPTH_WEIGHTS = {
    "Remember": 0.4,
    "Understand": 0.5,
    "Apply": 0.8,
    "Analyze": 0.9,
    "Evaluate": 0.95,
    "Create": 1.0
}

@router.post("", response_model=AnalysisResultOut)
def run_skill_gap_analysis(payload: AnalysisRequest, db: Session = Depends(get_db)):
    """
    Executes the 5-step Skill Gap Analysis Engine:
    1. Calculate curriculum coverage from accepted mappings.
    2. Retrieve student self-assessed competence.
    3. Calculate Current Skill Indicator (0.4 * Curriculum + 0.6 * Self-Assessment).
    4. Compute Role Alignment % using weighted demand and Bloom's depth factors.
    5. Calculate Skill Gap (Required Level - Indicator) and Priority Score.
    """
    role = db.query(RoleProfile).filter(RoleProfile.id == payload.role_profile_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role profile not found")

    curric = db.query(CurriculumVersion).filter(CurriculumVersion.id == payload.curriculum_version_id).first()
    if not curric:
        raise HTTPException(status_code=404, detail="Curriculum version not found")

    w_curric = payload.curriculum_weight
    w_self = payload.self_rating_weight

    # Retrieve all outcomes for this curriculum
    outcomes = db.query(CourseOutcome).join(Course).join(Course.semester).filter(
        Course.semester.has(curriculum_version_id=curric.id)
    ).all()
    outcome_ids = [o.id for o in outcomes]

    # Map accepted mappings for outcomes
    accepted_mappings = db.query(CurriculumSkillMapping).filter(
        CurriculumSkillMapping.course_outcome_id.in_(outcome_ids),
        CurriculumSkillMapping.review_status == "ACCEPTED"
    ).all()

    # Map pending review mappings
    pending_mappings = db.query(CurriculumSkillMapping).filter(
        CurriculumSkillMapping.course_outcome_id.in_(outcome_ids),
        CurriculumSkillMapping.review_status.in_(["SUGGESTED", "NEEDS_REVIEW"])
    ).all()
    pending_skills = set(m.skill_id for m in pending_mappings)

    # Calculate curriculum coverage per skill
    curriculum_evidence_by_skill = {}
    for m in accepted_mappings:
        co = m.course_outcome
        bloom = co.bloom_level if co else "Understand"
        bloom_factor = BLOOM_DEPTH_WEIGHTS.get(bloom, 0.7)
        # Avoid duplicate outcome overcounting: take highest verified coverage
        curr_val = round(min(1.0, m.similarity_score * bloom_factor), 3)
        if m.skill_id not in curriculum_evidence_by_skill or curr_val > curriculum_evidence_by_skill[m.skill_id]["coverage"]:
            curriculum_evidence_by_skill[m.skill_id] = {
                "coverage": curr_val,
                "bloom_level": bloom,
                "bloom_factor": bloom_factor
            }

    # Retrieve user assessments
    assessments = db.query(UserSkillAssessment).filter(
        UserSkillAssessment.user_id == payload.user_id
    ).all()
    assessment_map = {a.skill_id: (a.rating, a.rating_numeric) for a in assessments}

    # Normalize demand weights
    max_demand = max([rs.demand_weight for rs in role.skills] or [1.0])
    
    skill_gaps: List[SkillGapDetail] = []
    total_weighted_alignment_num = 0.0
    total_demand_denom = 0.0

    covered_count = 0
    partial_count = 0
    gap_count = 0

    for rs in role.skills:
        skill = rs.skill
        if not skill:
            continue

        s_id = skill.id
        role_demand = rs.demand_weight
        norm_demand = round(role_demand / max_demand, 3)
        req_level = rs.required_level

        # Step 1: Curriculum Coverage
        curr_info = curriculum_evidence_by_skill.get(s_id)
        if curr_info:
            curr_cov = curr_info["coverage"]
            bloom_factor = curr_info["bloom_factor"]
            evidence_status = "CONFIRMED_MAPPING"
        elif s_id in pending_skills:
            curr_cov = 0.0
            bloom_factor = 0.7
            evidence_status = "AWAITING_REVIEW"
        else:
            curr_cov = 0.0
            bloom_factor = 0.7
            evidence_status = "NO_EVIDENCE"

        # Step 2: Self-assessment
        if s_id in assessment_map:
            self_rating_str, self_numeric = assessment_map[s_id]
            has_self_assessment = True
        else:
            self_rating_str, self_numeric = ("None (Unassessed)", 0.0)
            has_self_assessment = False

        # Step 3: Current Skill Indicator
        if has_self_assessment:
            current_indicator = round((w_curric * curr_cov) + (w_self * self_numeric), 3)
        else:
            # Conservative fallback: strictly based on curriculum coverage until assessed
            current_indicator = round(curr_cov * 0.5, 3)

        # Step 4: Role alignment accumulator
        effective_bloom = bloom_factor if payload.bloom_depth_enabled else 1.0
        total_weighted_alignment_num += (norm_demand * current_indicator * effective_bloom)
        total_demand_denom += norm_demand

        # Step 5: Skill Gap
        gap_size = round(max(0.0, req_level - current_indicator), 3)
        priority_score = round(norm_demand * gap_size, 3)

        # Classification
        if gap_size <= 0.05:
            status_label = "ALREADY_COVERED"
            covered_count += 1
            action = "Sufficiently covered; maintain through revision or application."
        elif current_indicator > 0.15:
            status_label = "PARTIALLY_COVERED"
            partial_count += 1
            action = "Bridge remaining gap with practical project or advanced exercises."
        else:
            status_label = "HIGH_PRIORITY_GAP"
            gap_count += 1
            action = "Schedule into learning roadmap as core prerequisite skill."

        if not has_self_assessment:
            action = "Complete self-assessment to refine readiness estimate."

        skill_gaps.append(SkillGapDetail(
            skill_id=s_id,
            canonical_name=skill.canonical_name,
            category=skill.category,
            role_demand=role_demand,
            normalized_demand=norm_demand,
            curriculum_coverage=curr_cov,
            bloom_depth_factor=bloom_factor,
            self_rating=self_rating_str,
            self_rating_numeric=self_numeric,
            current_skill_indicator=current_indicator,
            required_level=req_level,
            gap_size=gap_size,
            priority_score=priority_score,
            evidence_status=evidence_status,
            has_self_assessment=has_self_assessment,
            status_label=status_label,
            recommended_action=action
        ))

    # Calculate overall alignment percentage
    if total_demand_denom > 0:
        overall_alignment_pct = round((total_weighted_alignment_num / total_demand_denom) * 100.0, 1)
    else:
        overall_alignment_pct = 0.0

    # Sort gaps by Priority Score descending
    skill_gaps.sort(key=lambda x: (x.priority_score, x.role_demand), reverse=True)

    # Persist analysis run record
    run = AnalysisRun(
        user_id=payload.user_id,
        role_profile_id=role.id,
        curriculum_version_id=curric.id,
        curriculum_weight=w_curric,
        self_rating_weight=w_self,
        role_alignment_pct=overall_alignment_pct,
        gap_summary_json=json.dumps({
            "covered": covered_count,
            "partial": partial_count,
            "gaps": gap_count,
            "total": len(skill_gaps)
        })
    )
    db.add(run)
    db.commit()

    formula_explainer = {
        "formula_title": "Current Skill Indicator & Role Alignment Mathematical Model",
        "indicator_formula": f"Current Skill Indicator = ({w_curric} × Curriculum Coverage) + ({w_self} × Self-Assessment)",
        "alignment_formula": "Role Alignment (%) = 100 × [ Σ (Normalized Demand wᵢ × Indicator cᵢ × Bloom Depth bᵢ) / Σ wᵢ ]",
        "gap_formula": "Skill Gap = max(0, Required Proficiency − Current Skill Indicator)",
        "priority_formula": "Priority Score = Normalized Demand × Skill Gap Size",
        "assumptions": [
            "Curriculum coverage reflects verified academic outcomes, not student mastery.",
            "Self-assessment reflects student-reported confidence, subject to guidance.",
            "Bloom's taxonomy factors weight creation/application (0.8–1.0) higher than conceptual recall (0.4–0.5)."
        ]
    }

    return AnalysisResultOut(
        id=run.id,
        role_id=role.id,
        role_name=role.role_name,
        curriculum_id=curric.id,
        curriculum_name=curric.version_name,
        role_alignment_pct=overall_alignment_pct,
        total_skills_count=len(skill_gaps),
        covered_skills_count=covered_count,
        partial_skills_count=partial_count,
        gap_skills_count=gap_count,
        formula_explanation=formula_explainer,
        skill_gaps=skill_gaps
    )
