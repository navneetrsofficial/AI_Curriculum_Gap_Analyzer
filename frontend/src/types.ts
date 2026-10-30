export interface Institution {
  id: number;
  name: string;
  location?: string;
  metadata_json?: string;
}

export interface Programme {
  id: number;
  name: string;
  degree: string;
  branch: string;
}

export interface CourseOutcome {
  id: number;
  outcome_code: string;
  outcome_text: string;
  bloom_level: string;
  suggested_bloom?: string;
  unit_id?: number;
  accepted_mappings_count?: number;
}

export interface Unit {
  id: number;
  name: string;
  sequence_number: number;
}

export interface Course {
  id: number;
  course_code: string;
  name: string;
  credits: number;
  description?: string;
  units?: Unit[];
  outcomes?: CourseOutcome[];
}

export interface Semester {
  id: number;
  semester_number: number;
  name: string;
  courses: Course[];
}

export interface CurriculumVersion {
  id: number;
  academic_year: string;
  version_name: string;
  status: string;
  is_demo: boolean;
  created_at: string;
  institution?: Institution;
  programme?: Programme;
  total_courses?: number;
  total_outcomes?: number;
  semesters?: Semester[];
}

export interface Skill {
  id: string;
  canonical_name: string;
  description: string;
  category: string;
  aliases_json?: string;
  bloom_depth_min: string;
  estimated_hours: number;
  prerequisites: string[];
}

export interface RoleSkill {
  skill_id: string;
  skill_name: string;
  category: string;
  demand_weight: number;
  required_level: number;
  estimated_hours: number;
  description: string;
}

export interface RoleProfile {
  id: string;
  role_name: string;
  description: string;
  source_type: string;
  source_date: string;
  evidence_status: string;
  is_demo: boolean;
  skill_count: number;
  skills: RoleSkill[];
}

export interface CandidateMatch {
  skill_id: string;
  canonical_name: string;
  category: string;
  similarity_score: number;
  method: 'KEYWORD' | 'SEMANTIC';
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  explanation: string;
}

export interface MappingSuggestResult {
  query_text: string;
  methods_agree: boolean;
  disagreement_note?: string;
  keyword_baseline_candidates: CandidateMatch[];
  semantic_embedding_candidates: CandidateMatch[];
}

export interface CurriculumMapping {
  id: number;
  course_outcome_id: number;
  course_name?: string;
  course_code?: string;
  outcome_code?: string;
  outcome_text?: string;
  bloom_level?: string;
  skill_id: string;
  canonical_name?: string;
  category?: string;
  similarity_score: number;
  method: string;
  review_status: 'SUGGESTED' | 'ACCEPTED' | 'REJECTED' | 'NEEDS_REVIEW';
  evidence_text?: string;
  model_version: string;
}

export interface Assessment {
  id: number;
  user_id: string;
  skill_id: string;
  skill_name?: string;
  rating: 'None' | 'Basic' | 'Can Build Something' | 'Not sure';
  rating_numeric: number;
  assessed_at: string;
}

export interface SkillGapDetail {
  skill_id: string;
  canonical_name: string;
  category: string;
  role_demand: number;
  normalized_demand: number;
  curriculum_coverage: number;
  bloom_depth_factor: number;
  self_rating: string;
  self_rating_numeric: number;
  current_skill_indicator: number;
  required_level: number;
  gap_size: number;
  priority_score: number;
  evidence_status: 'CONFIRMED_MAPPING' | 'PARTIAL' | 'NO_EVIDENCE' | 'AWAITING_REVIEW';
  has_self_assessment: boolean;
  status_label: 'ALREADY_COVERED' | 'PARTIALLY_COVERED' | 'HIGH_PRIORITY_GAP' | 'MISSING_DATA';
  recommended_action: string;
}

export interface AnalysisResult {
  id?: number;
  role_id: string;
  role_name: string;
  curriculum_id: number;
  curriculum_name: string;
  role_alignment_pct: number;
  total_skills_count: number;
  covered_skills_count: number;
  partial_skills_count: number;
  gap_skills_count: number;
  formula_explanation: {
    formula_title: string;
    indicator_formula: string;
    alignment_formula: string;
    gap_formula: string;
    priority_formula: string;
    assumptions: string[];
  };
  skill_gaps: SkillGapDetail[];
}

export interface RoadmapTask {
  id: number;
  skill_id: string;
  skill_name: string;
  category: string;
  week_number: number;
  estimated_hours: number;
  actual_hours: number;
  status: 'TO_LEARN' | 'IN_PROGRESS' | 'COMPLETED' | 'DEFERRED';
  priority_score: number;
  role_demand: number;
  gap_size: number;
  prerequisites: string[];
  prerequisites_met: boolean;
  learning_resource?: {
    title: string;
    provider: string;
    url: string;
    resource_type: string;
    estimated_hours: number;
  };
  notes?: string;
  completed_at?: string;
}

export interface Roadmap {
  id: number;
  role_name: string;
  available_weeks: number;
  hours_per_week: number;
  total_available_hours: number;
  allocated_hours: number;
  unscheduled_skills_count: number;
  tasks: RoadmapTask[];
  scheduled_by_week: Record<number, RoadmapTask[]>;
}

export interface MetricDetail {
  precision: number;
  recall: number;
  f1_score: number;
  top_k_accuracy: number;
  top_1_accuracy: number;
  median_latency_ms: number;
  total_examples: number;
}

export interface EvaluationComparison {
  run_id: number;
  dataset_name: string;
  dataset_version: string;
  evaluated_count: number;
  keyword_baseline: MetricDetail;
  semantic_model: MetricDetail;
  side_by_side_samples: Array<{
    id?: number;
    curriculum_statement: string;
    ground_truth_skill_id: string;
    ground_truth_skill_name: string;
    role: string;
    keyword_prediction?: CandidateMatch;
    keyword_is_correct: boolean;
    semantic_prediction?: CandidateMatch;
    semantic_is_correct: boolean;
    methods_agree: boolean;
  }>;
  per_role_metrics: Record<string, { count: number; keyword_accuracy: number; semantic_accuracy: number }>;
  error_inspection: Array<{
    statement: string;
    target_skill: string;
    keyword_predicted: string;
    keyword_score: number;
    semantic_predicted: string;
    semantic_score: number;
    error_type: string;
  }>;
  execution_notes: string;
  created_at: string;
}
