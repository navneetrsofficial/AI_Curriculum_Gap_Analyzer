import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from ..database import get_db
from ..models import (
    Roadmap, RoadmapTask, RoleProfile, Skill, SkillPrerequisite,
    LearningResource, UserSkillAssessment
)
from ..schemas import (
    RoadmapGenerateRequest, RoadmapOut, RoadmapTaskOut, RoadmapTaskUpdate
)
from .analysis import run_skill_gap_analysis
from ..schemas import AnalysisRequest

router = APIRouter(prefix="/roadmaps", tags=["Roadmap Planner"])

@router.post("/generate", response_model=RoadmapOut)
def generate_personalized_roadmap(payload: RoadmapGenerateRequest, db: Session = Depends(get_db)):
    """
    Deterministic Roadmap Generator:
    1. Runs gap analysis to get prioritized skills with genuine gaps.
    2. Builds prerequisite DAG and verifies dependency orders.
    3. Allocates tasks into weeks respecting the student's weekly hour budget.
    4. Identifies skills that exceed the total time budget as UNSCHEDULED / DEFERRED.
    """
    role = db.query(RoleProfile).filter(RoleProfile.id == payload.role_profile_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role profile not found")

    if payload.available_weeks <= 0 or payload.hours_per_week <= 0:
        raise HTTPException(status_code=400, detail="Available weeks and hours per week must be greater than zero.")

    total_budget_hours = payload.available_weeks * payload.hours_per_week

    # 1. Get current gaps from analysis
    analysis_req = AnalysisRequest(
        user_id=payload.user_id,
        role_profile_id=payload.role_profile_id,
        curriculum_version_id=payload.curriculum_version_id
    )
    analysis_res = run_skill_gap_analysis(analysis_req, db)

    # 2. Filter gaps: Keep skills that have an actionable gap (> 0.05)
    gaps_to_learn = [g for g in analysis_res.skill_gaps if g.gap_size > 0.05]
    
    # Prerequisite graph
    all_prereqs = db.query(SkillPrerequisite).all()
    prereq_map = {} # skill_id -> list of required prerequisite skill_ids
    for p in all_prereqs:
        if p.skill_id not in prereq_map:
            prereq_map[p.skill_id] = []
        prereq_map[p.skill_id].append(p.prerequisite_skill_id)

    # Completed or already-covered skills (do not need scheduling)
    covered_skill_ids = set([g.skill_id for g in analysis_res.skill_gaps if g.gap_size <= 0.05])

    # Sort gaps primarily by topological readiness (prerequisites first), then by priority score descending
    scheduled_tasks = []
    weekly_hours_used = {w: 0.0 for w in range(1, payload.available_weeks + 1)}
    scheduled_skill_week = {} # skill_id -> week_number

    # Mark already-covered skills as completed in week 0
    for s_id in covered_skill_ids:
        scheduled_skill_week[s_id] = 0

    # Prerequisite resolution scheduling loop
    remaining_gaps = list(gaps_to_learn)
    # Sort by priority
    remaining_gaps.sort(key=lambda x: x.priority_score, reverse=True)

    # Delete previous roadmap for this role if exists
    existing_roadmap = db.query(Roadmap).filter(
        Roadmap.user_id == payload.user_id,
        Roadmap.role_profile_id == payload.role_profile_id
    ).first()
    if existing_roadmap:
        db.delete(existing_roadmap)
        db.commit()

    # Create new Roadmap record
    new_roadmap = Roadmap(
        user_id=payload.user_id,
        role_profile_id=role.id,
        available_weeks=payload.available_weeks,
        hours_per_week=payload.hours_per_week,
        total_available_hours=total_budget_hours
    )
    db.add(new_roadmap)
    db.commit()
    db.refresh(new_roadmap)

    # Schedule skills
    scheduled_count = 0
    unscheduled_count = 0
    total_allocated_hours = 0.0

    while remaining_gaps:
        # Pick the highest priority gap whose prerequisites are scheduled or overridden
        candidate = None
        for g in remaining_gaps:
            req_prereqs = prereq_map.get(g.skill_id, [])
            if payload.override_prerequisites or all(p in scheduled_skill_week for p in req_prereqs):
                candidate = g
                break

        # If cyclic or unsatisfied prerequisite in gap list, take the first available
        if not candidate:
            candidate = remaining_gaps[0]

        remaining_gaps.remove(candidate)

        # Retrieve skill entity for estimated hours
        skill_obj = db.query(Skill).filter(Skill.id == candidate.skill_id).first()
        est_hours = skill_obj.estimated_hours if skill_obj else 8.0

        # Determine earliest feasible week based on prerequisites
        req_prereqs = prereq_map.get(candidate.skill_id, [])
        earliest_week = 1
        if not payload.override_prerequisites and req_prereqs:
            for p in req_prereqs:
                if p in scheduled_skill_week:
                    earliest_week = max(earliest_week, scheduled_skill_week[p] + 1)

        # Find first week from earliest_week that has enough hour capacity
        assigned_week = 0 # 0 means unscheduled/deferred
        for w in range(earliest_week, payload.available_weeks + 1):
            if weekly_hours_used[w] + est_hours <= payload.hours_per_week:
                assigned_week = w
                weekly_hours_used[w] += est_hours
                total_allocated_hours += est_hours
                break
            # If no single week has full capacity, but week is empty, put it in
            elif weekly_hours_used[w] == 0:
                assigned_week = w
                weekly_hours_used[w] += est_hours
                total_allocated_hours += est_hours
                break

        if assigned_week > 0:
            scheduled_skill_week[candidate.skill_id] = assigned_week
            status = "TO_LEARN"
            scheduled_count += 1
        else:
            status = "DEFERRED"
            unscheduled_count += 1

        # Check for verified learning resource
        res = db.query(LearningResource).filter(
            LearningResource.skill_id == candidate.skill_id,
            LearningResource.verification_status == "VERIFIED"
        ).first()

        res_dict = None
        if res:
            res_dict = {
                "title": res.title,
                "provider": res.provider,
                "url": res.url,
                "resource_type": res.resource_type,
                "estimated_hours": res.estimated_hours
            }

        task = RoadmapTask(
            roadmap_id=new_roadmap.id,
            skill_id=candidate.skill_id,
            week_number=assigned_week,
            estimated_hours=est_hours,
            actual_hours=0.0,
            status=status,
            notes=f"Priority score: {candidate.priority_score:.2f} | Gap: {candidate.gap_size:.2f}"
        )
        db.add(task)
        db.commit()
        db.refresh(task)

        scheduled_tasks.append(RoadmapTaskOut(
            id=task.id,
            skill_id=task.skill_id,
            skill_name=candidate.canonical_name,
            category=candidate.category,
            week_number=assigned_week,
            estimated_hours=est_hours,
            actual_hours=0.0,
            status=status,
            priority_score=candidate.priority_score,
            role_demand=candidate.role_demand,
            gap_size=candidate.gap_size,
            prerequisites=prereq_map.get(candidate.skill_id, []),
            prerequisites_met=all(p in scheduled_skill_week for p in prereq_map.get(candidate.skill_id, [])),
            learning_resource=res_dict,
            notes=task.notes,
            completed_at=None
        ))

    # Sort tasks: scheduled by week_number ascending, then unscheduled
    scheduled_tasks.sort(key=lambda t: (t.week_number == 0, t.week_number, -t.priority_score))

    # Group by week for UI convenience
    grouped_by_week = {}
    for t in scheduled_tasks:
        wn = t.week_number
        if wn not in grouped_by_week:
            grouped_by_week[wn] = []
        grouped_by_week[wn].append(t)

    return RoadmapOut(
        id=new_roadmap.id,
        role_name=role.role_name,
        available_weeks=payload.available_weeks,
        hours_per_week=payload.hours_per_week,
        total_available_hours=total_budget_hours,
        allocated_hours=round(total_allocated_hours, 1),
        unscheduled_skills_count=unscheduled_count,
        tasks=scheduled_tasks,
        scheduled_by_week=grouped_by_week
    )

@router.get("/{id}", response_model=RoadmapOut)
def get_roadmap_detail(id: int, db: Session = Depends(get_db)):
    """Retrieve full roadmap tasks, timeline grouping, and current progress."""
    rm = db.query(Roadmap).filter(Roadmap.id == id).first()
    if not rm:
        raise HTTPException(status_code=404, detail="Roadmap not found")

    tasks = db.query(RoadmapTask).filter(RoadmapTask.roadmap_id == id).all()
    all_prereqs = db.query(SkillPrerequisite).all()
    prereq_map = {}
    for p in all_prereqs:
        if p.skill_id not in prereq_map:
            prereq_map[p.skill_id] = []
        prereq_map[p.skill_id].append(p.prerequisite_skill_id)

    tasks_out = []
    total_allocated = 0.0
    unscheduled_count = 0

    for t in tasks:
        s = t.skill
        if t.week_number > 0:
            total_allocated += t.estimated_hours
        else:
            unscheduled_count += 1

        res = db.query(LearningResource).filter(
            LearningResource.skill_id == t.skill_id,
            LearningResource.verification_status == "VERIFIED"
        ).first()

        res_dict = None
        if res:
            res_dict = {
                "title": res.title,
                "provider": res.provider,
                "url": res.url,
                "resource_type": res.resource_type,
                "estimated_hours": res.estimated_hours
            }

        tasks_out.append(RoadmapTaskOut(
            id=t.id,
            skill_id=t.skill_id,
            skill_name=s.canonical_name if s else t.skill_id,
            category=s.category if s else "General",
            week_number=t.week_number,
            estimated_hours=t.estimated_hours,
            actual_hours=t.actual_hours,
            status=t.status,
            priority_score=0.0,
            role_demand=4.0,
            gap_size=0.8,
            prerequisites=prereq_map.get(t.skill_id, []),
            prerequisites_met=True,
            learning_resource=res_dict,
            notes=t.notes,
            completed_at=t.completed_at
        ))

    tasks_out.sort(key=lambda t: (t.week_number == 0, t.week_number))

    grouped = {}
    for t in tasks_out:
        wn = t.week_number
        if wn not in grouped:
            grouped[wn] = []
        grouped[wn].append(t)

    role = db.query(RoleProfile).filter(RoleProfile.id == rm.role_profile_id).first()

    return RoadmapOut(
        id=rm.id,
        role_name=role.role_name if role else rm.role_profile_id,
        available_weeks=rm.available_weeks,
        hours_per_week=rm.hours_per_week,
        total_available_hours=rm.total_available_hours,
        allocated_hours=round(total_allocated, 1),
        unscheduled_skills_count=unscheduled_count,
        tasks=tasks_out,
        scheduled_by_week=grouped
    )

@router.put("/tasks/{task_id}")
def update_roadmap_task(task_id: int, payload: RoadmapTaskUpdate, db: Session = Depends(get_db)):
    """
    Updates status (TO_LEARN, IN_PROGRESS, COMPLETED), logged actual hours, or notes for a roadmap task.
    When a task is marked COMPLETED, records completion timestamp and updates self-assessment.
    """
    task = db.query(RoadmapTask).filter(RoadmapTask.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Roadmap task not found")

    if payload.status:
        task.status = payload.status
        if payload.status == "COMPLETED":
            task.completed_at = datetime.datetime.utcnow()
            # Automatically update student assessment to "Can Build Something" or "Basic"
            rm = task.roadmap
            user_id = rm.user_id if rm else "student_user"
            assess = db.query(UserSkillAssessment).filter(
                UserSkillAssessment.user_id == user_id,
                UserSkillAssessment.skill_id == task.skill_id
            ).first()
            if assess:
                assess.rating = "Can Build Something"
                assess.rating_numeric = 1.0
                assess.assessed_at = datetime.datetime.utcnow()
            else:
                db.add(UserSkillAssessment(
                    user_id=user_id,
                    skill_id=task.skill_id,
                    rating="Can Build Something",
                    rating_numeric=1.0,
                    assessed_at=datetime.datetime.utcnow()
                ))

    if payload.actual_hours is not None:
        task.actual_hours = payload.actual_hours
    if payload.notes is not None:
        task.notes = payload.notes

    db.commit()
    db.refresh(task)

    return {
        "message": "Task updated successfully",
        "task_id": task.id,
        "status": task.status,
        "actual_hours": task.actual_hours
    }
