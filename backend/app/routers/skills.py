import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from ..database import get_db
from ..models import Skill, SkillPrerequisite
from ..schemas import SkillOut, SkillCreate

router = APIRouter(prefix="/skills", tags=["Skills Taxonomy"])

def check_cycles(graph: Dict[str, List[str]]) -> List[List[str]]:
    """Detects cycles in prerequisite graph using Depth-First Search."""
    visited = {}
    cycles = []

    def dfs(node: str, path: List[str]):
        visited[node] = 1 # In progress
        for neighbor in graph.get(node, []):
            if visited.get(neighbor) == 1:
                # Cycle found!
                cycle_idx = path.index(neighbor) if neighbor in path else 0
                cycles.append(path[cycle_idx:] + [neighbor])
            elif visited.get(neighbor) == 0 or neighbor not in visited:
                dfs(neighbor, path + [neighbor])
        visited[node] = 2 # Done

    for n in graph:
        if visited.get(n) != 2:
            dfs(n, [n])

    return cycles

@router.get("", response_model=List[SkillOut])
def get_all_skills(db: Session = Depends(get_db)):
    """Retrieve full canonical skill taxonomy."""
    skills = db.query(Skill).all()
    results = []
    for s in skills:
        prereq_links = db.query(SkillPrerequisite).filter(SkillPrerequisite.skill_id == s.id).all()
        prereqs = [p.prerequisite_skill_id for p in prereq_links]
        results.append(SkillOut(
            id=s.id,
            canonical_name=s.canonical_name,
            description=s.description,
            category=s.category,
            aliases_json=s.aliases_json,
            bloom_depth_min=s.bloom_depth_min,
            estimated_hours=s.estimated_hours,
            prerequisites=prereqs
        ))
    return results

@router.get("/graph")
def get_skill_prerequisite_graph(db: Session = Depends(get_db)):
    """Returns prerequisite directed graph and validates for cycles."""
    skills = db.query(Skill).all()
    prereqs = db.query(SkillPrerequisite).all()

    nodes = [{"id": s.id, "name": s.canonical_name, "category": s.category, "hours": s.estimated_hours} for s in skills]
    edges = [{"source": p.prerequisite_skill_id, "target": p.skill_id} for p in prereqs]

    # Build adjacency list: node -> prerequisites
    adj = {s.id: [] for s in skills}
    for p in prereqs:
        if p.skill_id in adj:
            adj[p.skill_id].append(p.prerequisite_skill_id)

    cycles = check_cycles(adj)

    return {
        "nodes": nodes,
        "edges": edges,
        "is_valid_dag": len(cycles) == 0,
        "detected_cycles": cycles
    }

@router.post("")
def create_skill(payload: SkillCreate, db: Session = Depends(get_db)):
    """Creates a new canonical skill record."""
    existing = db.query(Skill).filter((Skill.id == payload.id) | (Skill.canonical_name == payload.canonical_name)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Skill with this ID or canonical name already exists.")

    new_skill = Skill(
        id=payload.id,
        canonical_name=payload.canonical_name,
        description=payload.description,
        category=payload.category,
        aliases_json=payload.aliases_json,
        bloom_depth_min=payload.bloom_depth_min,
        estimated_hours=payload.estimated_hours
    )
    db.add(new_skill)
    db.commit()
    return {"message": "Skill added successfully", "skill_id": new_skill.id}
