from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

# ----------------- Curricula Schemas -----------------
class CourseOutcomeBase(BaseModel):
    outcome_code: str = "CO1"
    outcome_text: str
    bloom_level: str = "Understand"
    unit_id: Optional[int] = None

class CourseOutcomeCreate(CourseOutcomeBase):
    course_id: int

class CourseOutcomeOut(CourseOutcomeBase):
    id: int
    course_id: int
    suggested_bloom: Optional[str] = None
    class Config:
        from_attributes = True

class UnitBase(BaseModel):
    name: str
    sequence_number: int = 1

class UnitCreate(UnitBase):
    course_id: int

class UnitOut(UnitBase):
    id: int
    course_id: int
    class Config:
        from_attributes = True

class CourseBase(BaseModel):
    course_code: str
    name: str
    credits: float = 3.0
    description: Optional[str] = None

class CourseCreate(CourseBase):
    semester_id: int

class CourseOut(CourseBase):
    id: int
    semester_id: int
    units: List[UnitOut] = []
    outcomes: List[CourseOutcomeOut] = []
    class Config:
        from_attributes = True

class SemesterBase(BaseModel):
    semester_number: int
    name: str

class SemesterCreate(SemesterBase):
    curriculum_version_id: int

class SemesterOut(SemesterBase):
    id: int
    curriculum_version_id: int
    courses: List[CourseOut] = []
    class Config:
        from_attributes = True

class CurriculumVersionBase(BaseModel):
    academic_year: str = "2024-2025"
    version_name: str
    status: str = "ACTIVE"
    is_demo: bool = False

class CurriculumVersionCreate(CurriculumVersionBase):
    programme_id: int

class CurriculumVersionOut(CurriculumVersionBase):
    id: int
    programme_id: int
    created_at: datetime
    semesters: List[SemesterOut] = []
    class Config:
        from_attributes = True

class ProgrammeBase(BaseModel):
    name: str
    degree: str = "B.Tech"
    branch: str = "Computer Science & Engineering"

class ProgrammeCreate(ProgrammeBase):
    institution_id: int

class ProgrammeOut(ProgrammeBase):
    id: int
    institution_id: int
    curricula: List[CurriculumVersionOut] = []
    class Config:
        from_attributes = True

class InstitutionBase(BaseModel):
    name: str
    location: Optional[str] = None
    metadata_json: Optional[str] = None

class InstitutionCreate(InstitutionBase):
    pass

class InstitutionOut(InstitutionBase):
    id: int
    programmes: List[ProgrammeOut] = []
    class Config:
        from_attributes = True

# ----------------- Skill Taxonomy & Roles -----------------
class SkillBase(BaseModel):
    id: str
    canonical_name: str
    description: str
    category: str
    aliases_json: Optional[str] = "[]"
    bloom_depth_min: str = "Apply"
    estimated_hours: float = 8.0

class SkillCreate(SkillBase):
    pass

class SkillOut(SkillBase):
    prerequisites: List[str] = []
    class Config:
        from_attributes = True

class RoleSkillOut(BaseModel):
    skill_id: str
    skill_name: str
    category: str
    demand_weight: float
    required_level: float
    estimated_hours: float
    description: str
    class Config:
        from_attributes = True

class RoleProfileOut(BaseModel):
    id: str
    role_name: str
    description: str
    source_type: str
    source_date: str
    evidence_status: str
    is_demo: bool
    skill_count: int = 0
    skills: List[RoleSkillOut] = []
    class Config:
        from_attributes = True

# ----------------- Mapping & Suggestions -----------------
class MappingSuggestRequest(BaseModel):
    outcome_text: str
    course_name: Optional[str] = None
    top_k: int = 3
    method: str = "BOTH" # KEYWORD, SEMANTIC, or BOTH

class CandidateMatch(BaseModel):
    skill_id: str
    canonical_name: str
    category: str
    similarity_score: float
    method: str # KEYWORD or SEMANTIC
    confidence: str # HIGH, MEDIUM, LOW
    explanation: str

class MappingReviewRequest(BaseModel):
    mapping_id: Optional[int] = None
    course_outcome_id: int
    skill_id: str
    review_status: str # ACCEPTED, REJECTED, NEEDS_REVIEW
    method: str = "SEMANTIC"
    similarity_score: float = 0.8
    evidence_text: Optional[str] = None

class CurriculumMappingOut(BaseModel):
    id: int
    course_outcome_id: int
    course_name: Optional[str] = None
    course_code: Optional[str] = None
    outcome_code: Optional[str] = None
    outcome_text: Optional[str] = None
    bloom_level: Optional[str] = None
    skill_id: str
    canonical_name: Optional[str] = None
    category: Optional[str] = None
    similarity_score: float
    method: str
    review_status: str
    evidence_text: Optional[str] = None
    model_version: str
    class Config:
        from_attributes = True

# ----------------- Assessment Schemas -----------------
class AssessmentCreate(BaseModel):
    user_id: str = "student_user"
    skill_id: str
    rating: str # None, Basic, Can Build Something, Not sure

class AssessmentOut(BaseModel):
    id: int
    user_id: str
    skill_id: str
    skill_name: Optional[str] = None
    rating: str
    rating_numeric: float
    assessed_at: datetime
    class Config:
        from_attributes = True

# ----------------- Gap Analysis Schemas -----------------
class AnalysisRequest(BaseModel):
    user_id: str = "student_user"
    role_profile_id: str
    curriculum_version_id: int
    curriculum_weight: float = 0.4
    self_rating_weight: float = 0.6
    bloom_depth_enabled: bool = True

class SkillGapDetail(BaseModel):
    skill_id: str
    canonical_name: str
    category: str
    role_demand: float
    normalized_demand: float
    curriculum_coverage: float
    bloom_depth_factor: float
    self_rating: str
    self_rating_numeric: float
    current_skill_indicator: float
    required_level: float
    gap_size: float
    priority_score: float
    evidence_status: str # CONFIRMED_MAPPING, PARTIAL, NO_EVIDENCE, AWAITING_REVIEW
    has_self_assessment: bool
    status_label: str # ALREADY_COVERED, PARTIALLY_COVERED, HIGH_PRIORITY_GAP, MISSING_DATA
    recommended_action: str

class AnalysisResultOut(BaseModel):
    id: Optional[int] = None
    role_id: str
    role_name: str
    curriculum_id: int
    curriculum_name: str
    role_alignment_pct: float
    total_skills_count: int
    covered_skills_count: int
    partial_skills_count: int
    gap_skills_count: int
    formula_explanation: Dict[str, Any]
    skill_gaps: List[SkillGapDetail]

# ----------------- Roadmap Schemas -----------------
class RoadmapGenerateRequest(BaseModel):
    user_id: str = "student_user"
    role_profile_id: str
    curriculum_version_id: int
    available_weeks: int = 8
    hours_per_week: float = 10.0
    override_prerequisites: bool = False

class RoadmapTaskOut(BaseModel):
    id: int
    skill_id: str
    skill_name: str
    category: str
    week_number: int # 1..N, or 0 if unscheduled (exceeded budget)
    estimated_hours: float
    actual_hours: float
    status: str # TO_LEARN, IN_PROGRESS, COMPLETED, DEFERRED
    priority_score: float
    role_demand: float
    gap_size: float
    prerequisites: List[str] = []
    prerequisites_met: bool = True
    learning_resource: Optional[Dict[str, Any]] = None
    notes: Optional[str] = None
    completed_at: Optional[datetime] = None
    class Config:
        from_attributes = True

class RoadmapOut(BaseModel):
    id: int
    role_name: str
    available_weeks: int
    hours_per_week: float
    total_available_hours: float
    allocated_hours: float
    unscheduled_skills_count: int
    tasks: List[RoadmapTaskOut]
    scheduled_by_week: Dict[int, List[RoadmapTaskOut]] = {}
    class Config:
        from_attributes = True

class RoadmapTaskUpdate(BaseModel):
    status: Optional[str] = None
    actual_hours: Optional[float] = None
    notes: Optional[str] = None

# ----------------- Evaluation Lab Schemas -----------------
class EvaluationRunRequest(BaseModel):
    dataset_id: int
    threshold: float = 0.50
    top_k: int = 3
    test_partition_only: bool = True

class MetricDetail(BaseModel):
    precision: float
    recall: float
    f1_score: float
    top_k_accuracy: float
    top_1_accuracy: float
    median_latency_ms: float
    total_examples: int

class EvaluationComparisonOut(BaseModel):
    run_id: int
    dataset_name: str
    dataset_version: str
    evaluated_count: int
    keyword_baseline: MetricDetail
    semantic_model: MetricDetail
    side_by_side_samples: List[Dict[str, Any]]
    per_role_metrics: Dict[str, Any]
    error_inspection: List[Dict[str, Any]]
    execution_notes: str
    created_at: datetime
