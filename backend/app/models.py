import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Text, Boolean, DateTime, ForeignKey, Table
)
from sqlalchemy.orm import relationship
from .database import Base

class Institution(Base):
    __tablename__ = "institutions"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, unique=True)
    location = Column(String(255), nullable=True)
    metadata_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    programmes = relationship("Programme", back_populates="institution", cascade="all, delete-orphan")

class Programme(Base):
    __tablename__ = "programmes"
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey("institutions.id"), nullable=False)
    name = Column(String(255), nullable=False)
    degree = Column(String(100), default="B.Tech")
    branch = Column(String(100), default="Computer Science & Engineering")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    institution = relationship("Institution", back_populates="programmes")
    curricula = relationship("CurriculumVersion", back_populates="programme", cascade="all, delete-orphan")

class CurriculumVersion(Base):
    __tablename__ = "curriculum_versions"
    id = Column(Integer, primary_key=True, index=True)
    programme_id = Column(Integer, ForeignKey("programmes.id"), nullable=False)
    academic_year = Column(String(50), default="2024-2025")
    version_name = Column(String(100), nullable=False)
    status = Column(String(50), default="ACTIVE") # DRAFT, ACTIVE, ARCHIVED
    is_demo = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    programme = relationship("Programme", back_populates="curricula")
    semesters = relationship("Semester", back_populates="curriculum", cascade="all, delete-orphan")

class Semester(Base):
    __tablename__ = "semesters"
    id = Column(Integer, primary_key=True, index=True)
    curriculum_version_id = Column(Integer, ForeignKey("curriculum_versions.id"), nullable=False)
    semester_number = Column(Integer, nullable=False)
    name = Column(String(100), nullable=False)
    
    curriculum = relationship("CurriculumVersion", back_populates="semesters")
    courses = relationship("Course", back_populates="semester", cascade="all, delete-orphan")

class Course(Base):
    __tablename__ = "courses"
    id = Column(Integer, primary_key=True, index=True)
    semester_id = Column(Integer, ForeignKey("semesters.id"), nullable=False)
    course_code = Column(String(50), nullable=False)
    name = Column(String(255), nullable=False)
    credits = Column(Float, default=3.0)
    description = Column(Text, nullable=True)
    
    semester = relationship("Semester", back_populates="courses")
    units = relationship("Unit", back_populates="course", cascade="all, delete-orphan")
    outcomes = relationship("CourseOutcome", back_populates="course", cascade="all, delete-orphan")

class Unit(Base):
    __tablename__ = "units"
    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    name = Column(String(255), nullable=False)
    sequence_number = Column(Integer, default=1)
    
    course = relationship("Course", back_populates="units")
    topics = relationship("Topic", back_populates="unit", cascade="all, delete-orphan")
    outcomes = relationship("CourseOutcome", back_populates="unit")

class Topic(Base):
    __tablename__ = "topics"
    id = Column(Integer, primary_key=True, index=True)
    unit_id = Column(Integer, ForeignKey("units.id"), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    
    unit = relationship("Unit", back_populates="topics")

class CourseOutcome(Base):
    __tablename__ = "course_outcomes"
    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    unit_id = Column(Integer, ForeignKey("units.id"), nullable=True)
    outcome_code = Column(String(50), default="CO1")
    outcome_text = Column(Text, nullable=False)
    bloom_level = Column(String(50), default="Understand") # Remember, Understand, Apply, Analyze, Evaluate, Create
    suggested_bloom = Column(String(50), nullable=True)
    
    course = relationship("Course", back_populates="outcomes")
    unit = relationship("Unit", back_populates="outcomes")
    mappings = relationship("CurriculumSkillMapping", back_populates="course_outcome", cascade="all, delete-orphan")

class Skill(Base):
    __tablename__ = "skills"
    id = Column(String(100), primary_key=True) # Stable slug e.g. "react", "fastapi"
    canonical_name = Column(String(255), nullable=False, unique=True)
    description = Column(Text, nullable=False)
    category = Column(String(100), nullable=False)
    aliases_json = Column(Text, default="[]") # JSON list of alternative names
    bloom_depth_min = Column(String(50), default="Apply")
    estimated_hours = Column(Float, default=8.0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    mappings = relationship("CurriculumSkillMapping", back_populates="skill")
    resources = relationship("LearningResource", back_populates="skill", cascade="all, delete-orphan")
    role_skills = relationship("RoleSkill", back_populates="skill")
    assessments = relationship("UserSkillAssessment", back_populates="skill")

class SkillPrerequisite(Base):
    __tablename__ = "skill_prerequisites"
    id = Column(Integer, primary_key=True, index=True)
    skill_id = Column(String(100), ForeignKey("skills.id"), nullable=False)
    prerequisite_skill_id = Column(String(100), ForeignKey("skills.id"), nullable=False)
    
    skill = relationship("Skill", foreign_keys=[skill_id])
    prerequisite = relationship("Skill", foreign_keys=[prerequisite_skill_id])

class RoleProfile(Base):
    __tablename__ = "role_profiles"
    id = Column(String(100), primary_key=True) # e.g. "frontend-dev", "backend-dev"
    role_name = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    source_type = Column(String(100), default="Curated Benchmark Dataset") # Curated Benchmark Dataset / Job Aggregation
    source_date = Column(String(50), default="2024-Q4")
    evidence_status = Column(String(100), default="Standard Curated Industry Profile")
    is_demo = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    skills = relationship("RoleSkill", back_populates="role_profile", cascade="all, delete-orphan")

class RoleSkill(Base):
    __tablename__ = "role_skills"
    id = Column(Integer, primary_key=True, index=True)
    role_profile_id = Column(String(100), ForeignKey("role_profiles.id"), nullable=False)
    skill_id = Column(String(100), ForeignKey("skills.id"), nullable=False)
    demand_weight = Column(Float, default=1.0) # Documented scale e.g. 1.0 - 5.0
    required_level = Column(Float, default=0.8) # 0.0 to 1.0
    
    role_profile = relationship("RoleProfile", back_populates="skills")
    skill = relationship("Skill", back_populates="role_skills")

class CurriculumSkillMapping(Base):
    __tablename__ = "curriculum_skill_mappings"
    id = Column(Integer, primary_key=True, index=True)
    course_outcome_id = Column(Integer, ForeignKey("course_outcomes.id"), nullable=False)
    skill_id = Column(String(100), ForeignKey("skills.id"), nullable=False)
    method = Column(String(50), default="SEMANTIC") # KEYWORD, SEMANTIC, MANUAL
    similarity_score = Column(Float, nullable=False)
    review_status = Column(String(50), default="SUGGESTED") # SUGGESTED, ACCEPTED, REJECTED, NEEDS_REVIEW
    evidence_text = Column(Text, nullable=True)
    model_version = Column(String(100), default="sentence-transformers/all-MiniLM-L6-v2")
    reviewed_at = Column(DateTime, nullable=True)
    
    course_outcome = relationship("CourseOutcome", back_populates="mappings")
    skill = relationship("Skill", back_populates="mappings")

class UserSkillAssessment(Base):
    __tablename__ = "user_skill_assessments"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(100), default="student_user")
    skill_id = Column(String(100), ForeignKey("skills.id"), nullable=False)
    rating = Column(String(50), default="None") # None (0.0), Basic (0.5), Can Build Something (1.0), Not sure
    rating_numeric = Column(Float, default=0.0)
    assessed_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    skill = relationship("Skill", back_populates="assessments")

class AnalysisRun(Base):
    __tablename__ = "analysis_runs"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(100), default="student_user")
    role_profile_id = Column(String(100), ForeignKey("role_profiles.id"), nullable=False)
    curriculum_version_id = Column(Integer, ForeignKey("curriculum_versions.id"), nullable=False)
    formula_version = Column(String(50), default="v1.0-weighted")
    curriculum_weight = Column(Float, default=0.4)
    self_rating_weight = Column(Float, default=0.6)
    role_alignment_pct = Column(Float, default=0.0)
    gap_summary_json = Column(Text, default="{}")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Roadmap(Base):
    __tablename__ = "roadmaps"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(100), default="student_user")
    role_profile_id = Column(String(100), ForeignKey("role_profiles.id"), nullable=False)
    available_weeks = Column(Integer, default=8)
    hours_per_week = Column(Float, default=10.0)
    total_available_hours = Column(Float, default=80.0)
    formula_version = Column(String(50), default="deterministic-priority-dag")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    tasks = relationship("RoadmapTask", back_populates="roadmap", cascade="all, delete-orphan")

class RoadmapTask(Base):
    __tablename__ = "roadmap_tasks"
    id = Column(Integer, primary_key=True, index=True)
    roadmap_id = Column(Integer, ForeignKey("roadmaps.id"), nullable=False)
    skill_id = Column(String(100), ForeignKey("skills.id"), nullable=False)
    week_number = Column(Integer, nullable=False) # 1-indexed, or 0 if unscheduled due to budget
    estimated_hours = Column(Float, default=8.0)
    actual_hours = Column(Float, default=0.0)
    status = Column(String(50), default="TO_LEARN") # TO_LEARN, IN_PROGRESS, COMPLETED, DEFERRED
    notes = Column(Text, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    
    roadmap = relationship("Roadmap", back_populates="tasks")
    skill = relationship("Skill")

class LearningResource(Base):
    __tablename__ = "learning_resources"
    id = Column(Integer, primary_key=True, index=True)
    skill_id = Column(String(100), ForeignKey("skills.id"), nullable=False)
    title = Column(String(255), nullable=False)
    provider = Column(String(100), default="Official Docs") # Official Docs, MDN, Coursera, FreeCodeCamp
    url = Column(String(500), nullable=False)
    resource_type = Column(String(50), default="Tutorial") # Documentation, Tutorial, Course, Practice Exercise, Project
    estimated_hours = Column(Float, default=4.0)
    verified_at = Column(DateTime, default=datetime.datetime.utcnow)
    verification_status = Column(String(50), default="VERIFIED") # VERIFIED, UNVERIFIED, BROKEN
    
    skill = relationship("Skill", back_populates="resources")

class EvaluationDataset(Base):
    __tablename__ = "evaluation_datasets"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    version = Column(String(50), default="v1.0")
    description = Column(Text, nullable=True)
    is_demo = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    examples = relationship("EvaluationExample", back_populates="dataset", cascade="all, delete-orphan")
    runs = relationship("EvaluationRun", back_populates="dataset", cascade="all, delete-orphan")

class EvaluationExample(Base):
    __tablename__ = "evaluation_examples"
    id = Column(Integer, primary_key=True, index=True)
    dataset_id = Column(Integer, ForeignKey("evaluation_datasets.id"), nullable=False)
    curriculum_statement = Column(Text, nullable=False)
    correct_skill_id = Column(String(100), ForeignKey("skills.id"), nullable=False)
    correct_skill_name = Column(String(255), nullable=False)
    role = Column(String(100), default="General CSE")
    partition = Column(String(20), default="TEST") # DEV, VALIDATION, TEST
    annotator_id = Column(String(50), default="CSE_Curriculum_Committee")
    notes = Column(Text, nullable=True)
    
    dataset = relationship("EvaluationDataset", back_populates="examples")

class EvaluationRun(Base):
    __tablename__ = "evaluation_runs"
    id = Column(Integer, primary_key=True, index=True)
    dataset_id = Column(Integer, ForeignKey("evaluation_datasets.id"), nullable=False)
    model_version = Column(String(100), default="sentence-transformers/all-MiniLM-L6-v2")
    baseline_config = Column(String(100), default="Lexical-Token-TFIDF")
    metrics_json = Column(Text, nullable=False) # JSON storing accuracy, precision, recall, f1, top_k, latencies
    error_inspection_json = Column(Text, default="[]")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    dataset = relationship("EvaluationDataset", back_populates="runs")
