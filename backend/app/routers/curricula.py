import csv
import io
import json
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import Response
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from ..database import get_db
from ..models import (
    Institution, Programme, CurriculumVersion, Semester, Course, Unit, CourseOutcome,
    Skill, CurriculumSkillMapping
)
from ..schemas import (
    InstitutionOut, ProgrammeOut, CurriculumVersionOut, CurriculumVersionCreate,
    CourseCreate, CourseOutcomeCreate
)
from ..ml.preprocessor import provisional_bloom_suggestion

router = APIRouter(prefix="/curricula", tags=["Curricula"])

@router.get("", response_model=List[CurriculumVersionOut])
def get_all_curricula(db: Session = Depends(get_db)):
    """List all available curriculum versions across institutions."""
    return db.query(CurriculumVersion).all()

@router.get("/institutions", response_model=List[InstitutionOut])
def get_institutions(db: Session = Depends(get_db)):
    """List all institutions and their registered programmes."""
    return db.query(Institution).all()

@router.get("/template")
def download_csv_template():
    """Generates standard CSV syllabus template for curriculum import."""
    headers = [
        "institution_name", "programme_name", "curriculum_version", "semester",
        "course_code", "course_name", "unit_name", "topic", "course_outcome",
        "bloom_level", "credits"
    ]
    sample_row = [
        "JSPM University Pune", "Computer Science & Engineering", "2024-2025 Autonomous Syllabus", "3",
        "CS301", "Data Structures and Algorithms", "Unit 1: Trees and Graphs", "Binary Search Trees",
        "Analyze and implement binary search trees and graph traversal algorithms.", "Analyze", "4.0"
    ]
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(headers)
    writer.writerow(sample_row)
    
    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=curriculum_import_template.csv"}
    )

@router.get("/{id}")
def get_curriculum_detail(id: int, db: Session = Depends(get_db)):
    """Retrieve full curriculum hierarchy including courses, units, and outcomes."""
    curric = db.query(CurriculumVersion).filter(CurriculumVersion.id == id).first()
    if not curric:
        raise HTTPException(status_code=404, detail="Curriculum version not found")
    
    # Construct structured view
    prog = curric.programme
    inst = prog.institution if prog else None
    
    semesters_data = []
    total_courses = 0
    total_outcomes = 0

    for sem in curric.semesters:
        courses_data = []
        for c in sem.courses:
            total_courses += 1
            outcomes_data = []
            for o in c.outcomes:
                total_outcomes += 1
                # Check mapped skills count
                accepted_count = db.query(CurriculumSkillMapping).filter(
                    CurriculumSkillMapping.course_outcome_id == o.id,
                    CurriculumSkillMapping.review_status == "ACCEPTED"
                ).count()
                outcomes_data.append({
                    "id": o.id,
                    "outcome_code": o.outcome_code,
                    "outcome_text": o.outcome_text,
                    "bloom_level": o.bloom_level,
                    "suggested_bloom": o.suggested_bloom,
                    "unit_id": o.unit_id,
                    "accepted_mappings_count": accepted_count
                })
            
            courses_data.append({
                "id": c.id,
                "course_code": c.course_code,
                "name": c.name,
                "credits": c.credits,
                "description": c.description,
                "units": [{"id": u.id, "name": u.name, "sequence_number": u.sequence_number} for u in c.units],
                "outcomes": outcomes_data
            })
        
        semesters_data.append({
            "id": sem.id,
            "semester_number": sem.semester_number,
            "name": sem.name,
            "courses": courses_data
        })

    return {
        "id": curric.id,
        "academic_year": curric.academic_year,
        "version_name": curric.version_name,
        "status": curric.status,
        "is_demo": curric.is_demo,
        "created_at": curric.created_at,
        "institution": {"id": inst.id, "name": inst.name, "location": inst.location} if inst else None,
        "programme": {"id": prog.id, "name": prog.name, "degree": prog.degree, "branch": prog.branch} if prog else None,
        "total_courses": total_courses,
        "total_outcomes": total_outcomes,
        "semesters": sorted(semesters_data, key=lambda x: x["semester_number"])
    }

@router.post("/custom")
def create_custom_curriculum(payload: Dict[str, Any], db: Session = Depends(get_db)):
    """
    Creates a new custom curriculum structure (Institution -> Programme -> Version).
    """
    inst_name = payload.get("institution_name", "").strip()
    prog_name = payload.get("programme_name", "Computer Science & Engineering").strip()
    version_name = payload.get("version_name", "Custom Syllabus v1.0").strip()
    academic_year = payload.get("academic_year", "2024-2025").strip()

    if not inst_name or not version_name:
        raise HTTPException(status_code=400, detail="Institution name and Version name are required.")

    # Find or create institution
    inst = db.query(Institution).filter(Institution.name == inst_name).first()
    if not inst:
        inst = Institution(name=inst_name, location=payload.get("location", "India"))
        db.add(inst)
        db.commit()

    # Find or create programme
    prog = db.query(Programme).filter(
        Programme.institution_id == inst.id,
        Programme.name == prog_name
    ).first()
    if not prog:
        prog = Programme(
            institution_id=inst.id,
            name=prog_name,
            degree=payload.get("degree", "B.Tech"),
            branch=payload.get("branch", "Computer Science & Engineering")
        )
        db.add(prog)
        db.commit()

    # Create Curriculum Version
    curric = CurriculumVersion(
        programme_id=prog.id,
        academic_year=academic_year,
        version_name=version_name,
        status="ACTIVE",
        is_demo=False
    )
    db.add(curric)
    db.commit()

    # Create default semester
    sem = Semester(
        curriculum_version_id=curric.id,
        semester_number=1,
        name="Semester I"
    )
    db.add(sem)
    db.commit()

    return {"message": "Custom curriculum created successfully", "curriculum_id": curric.id}

@router.post("/courses")
def add_course_to_curriculum(payload: Dict[str, Any], db: Session = Depends(get_db)):
    """Adds a course to a semester."""
    semester_id = payload.get("semester_id")
    course_code = payload.get("course_code")
    name = payload.get("name")
    credits = payload.get("credits", 3.0)

    if not semester_id or not course_code or not name:
        raise HTTPException(status_code=400, detail="semester_id, course_code, and name are required.")

    sem = db.query(Semester).filter(Semester.id == semester_id).first()
    if not sem:
        raise HTTPException(status_code=404, detail="Semester not found")

    course = Course(
        semester_id=semester_id,
        course_code=course_code,
        name=name,
        credits=float(credits),
        description=payload.get("description", "")
    )
    db.add(course)
    db.commit()

    # Add default Unit
    unit = Unit(course_id=course.id, name="Unit 1: Fundamentals", sequence_number=1)
    db.add(unit)
    db.commit()

    return {"message": "Course added successfully", "course_id": course.id}

@router.post("/outcomes")
def add_outcome_to_course(payload: Dict[str, Any], db: Session = Depends(get_db)):
    """Adds a course outcome with provisional Bloom depth suggestion."""
    course_id = payload.get("course_id")
    outcome_text = payload.get("outcome_text", "").strip()
    outcome_code = payload.get("outcome_code", "CO1")
    bloom_level = payload.get("bloom_level")

    if not course_id or not outcome_text:
        raise HTTPException(status_code=400, detail="course_id and outcome_text are required.")

    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    sugg_bloom, _ = provisional_bloom_suggestion(outcome_text)
    final_bloom = bloom_level if bloom_level else sugg_bloom

    outcome = CourseOutcome(
        course_id=course_id,
        outcome_code=outcome_code,
        outcome_text=outcome_text,
        bloom_level=final_bloom,
        suggested_bloom=sugg_bloom
    )
    db.add(outcome)
    db.commit()

    return {"message": "Course outcome added successfully", "outcome_id": outcome.id, "suggested_bloom": sugg_bloom}

@router.post("/import-csv")
async def import_curriculum_csv(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """
    Parses and validates CSV syllabus data.
    Provides row-level validation, checks required columns, reports duplicates, and saves rows.
    """
    content = await file.read()
    try:
        decoded = content.decode("utf-8-sig")
    except UnicodeDecodeError:
        decoded = content.decode("latin-1")

    reader = csv.DictReader(io.StringIO(decoded))
    required_cols = {"institution_name", "programme_name", "curriculum_version", "course_code", "course_name", "course_outcome"}
    
    if not reader.fieldnames:
        raise HTTPException(status_code=400, detail="CSV file is empty or missing headers.")

    missing = required_cols - set([c.strip().lower() for c in reader.fieldnames])
    if missing:
        raise HTTPException(
            status_code=400,
            detail=f"CSV missing mandatory columns: {', '.join(missing)}. Please use the template."
        )

    # Normalize fieldnames map
    col_map = {c.strip().lower(): c for c in reader.fieldnames}

    created_records = 0
    errors = []
    
    rows = list(reader)
    if not rows:
        raise HTTPException(status_code=400, detail="CSV file has no data rows.")

    # Process first institution / programme / version
    first_row = rows[0]
    inst_name = first_row.get(col_map["institution_name"], "").strip()
    prog_name = first_row.get(col_map["programme_name"], "").strip()
    ver_name = first_row.get(col_map["curriculum_version"], "").strip()

    if not inst_name or not prog_name or not ver_name:
        raise HTTPException(status_code=400, detail="First row must contain valid institution, programme, and version.")

    inst = db.query(Institution).filter(Institution.name == inst_name).first()
    if not inst:
        inst = Institution(name=inst_name)
        db.add(inst)
        db.commit()

    prog = db.query(Programme).filter(Programme.institution_id == inst.id, Programme.name == prog_name).first()
    if not prog:
        prog = Programme(institution_id=inst.id, name=prog_name)
        db.add(prog)
        db.commit()

    curric = db.query(CurriculumVersion).filter(
        CurriculumVersion.programme_id == prog.id,
        CurriculumVersion.version_name == ver_name
    ).first()
    if not curric:
        curric = CurriculumVersion(programme_id=prog.id, version_name=ver_name, is_demo=False)
        db.add(curric)
        db.commit()

    # Track cache for semester & course IDs
    sem_cache = {}
    course_cache = {}

    for idx, row in enumerate(rows, start=2):
        c_code = row.get(col_map.get("course_code"), "").strip()
        c_name = row.get(col_map.get("course_name"), "").strip()
        outcome_txt = row.get(col_map.get("course_outcome"), "").strip()
        sem_num_str = row.get(col_map.get("semester"), "1").strip()
        bloom_val = row.get(col_map.get("bloom_level"), "").strip()

        if not c_code or not outcome_txt:
            errors.append(f"Row {idx}: missing course_code or course_outcome.")
            continue

        try:
            sem_num = int(sem_num_str) if sem_num_str.isdigit() else 1
        except:
            sem_num = 1

        if sem_num not in sem_cache:
            sem = db.query(Semester).filter(
                Semester.curriculum_version_id == curric.id,
                Semester.semester_number == sem_num
            ).first()
            if not sem:
                sem = Semester(
                    curriculum_version_id=curric.id,
                    semester_number=sem_num,
                    name=f"Semester {sem_num}"
                )
                db.add(sem)
                db.commit()
            sem_cache[sem_num] = sem.id

        sem_id = sem_cache[sem_num]

        if (sem_id, c_code) not in course_cache:
            course = db.query(Course).filter(
                Course.semester_id == sem_id,
                Course.course_code == c_code
            ).first()
            if not course:
                course = Course(
                    semester_id=sem_id,
                    course_code=c_code,
                    name=c_name or c_code,
                    credits=3.0
                )
                db.add(course)
                db.commit()
            course_cache[(sem_id, c_code)] = course.id

        course_id = course_cache[(sem_id, c_code)]

        sugg_bloom, _ = provisional_bloom_suggestion(outcome_txt)
        outcome = CourseOutcome(
            course_id=course_id,
            outcome_text=outcome_txt,
            bloom_level=bloom_val if bloom_val else sugg_bloom,
            suggested_bloom=sugg_bloom
        )
        db.add(outcome)
        created_records += 1

    db.commit()

    return {
        "message": f"Import complete. Successfully added {created_records} curriculum outcomes.",
        "curriculum_id": curric.id,
        "errors": errors[:10]
    }
