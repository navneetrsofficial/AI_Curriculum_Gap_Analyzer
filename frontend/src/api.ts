import {
  CurriculumVersion,
  RoleProfile,
  Skill,
  MappingSuggestResult,
  CurriculumMapping,
  Assessment,
  AnalysisResult,
  Roadmap,
  RoadmapTask,
  EvaluationComparison
} from './types';

const getBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (!envUrl) return '/api';
  const clean = envUrl.trim().replace(/\/$/, '');
  const withProtocol = clean.startsWith('http://') || clean.startsWith('https://') 
    ? clean 
    : `https://${clean}`;
  return `${withProtocol}/api`;
};

const API_BASE = getBaseUrl();

export const api = {
  // Curricula
  async getCurricula(): Promise<CurriculumVersion[]> {
    const res = await fetch(`${API_BASE}/curricula`);
    if (!res.ok) throw new Error('Failed to fetch curricula');
    return res.json();
  },

  async getCurriculumDetail(id: number): Promise<CurriculumVersion> {
    const res = await fetch(`${API_BASE}/curricula/${id}`);
    if (!res.ok) throw new Error('Failed to fetch curriculum detail');
    return res.json();
  },

  async createCustomCurriculum(payload: {
    institution_name: string;
    programme_name: string;
    version_name: string;
    academic_year: string;
  }): Promise<{ message: string; curriculum_id: number }> {
    const res = await fetch(`${API_BASE}/curricula/custom`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to create curriculum');
    }
    return res.json();
  },

  async uploadCurriculumCsv(file: File): Promise<{ message: string; curriculum_id: number; errors?: string[] }> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/curricula/import-csv`, {
      method: 'POST',
      body: formData
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'CSV upload failed');
    }
    return res.json();
  },

  getTemplateDownloadUrl(): string {
    return `${API_BASE}/curricula/template`;
  },

  // Roles
  async getRoles(): Promise<RoleProfile[]> {
    const res = await fetch(`${API_BASE}/roles`);
    if (!res.ok) throw new Error('Failed to fetch roles');
    return res.json();
  },

  async getRoleDetail(id: string): Promise<RoleProfile> {
    const res = await fetch(`${API_BASE}/roles/${id}`);
    if (!res.ok) throw new Error('Failed to fetch role detail');
    return res.json();
  },

  // Skills
  async getSkills(): Promise<Skill[]> {
    const res = await fetch(`${API_BASE}/skills`);
    if (!res.ok) throw new Error('Failed to fetch skills');
    return res.json();
  },

  async getSkillGraph(): Promise<{ nodes: any[]; edges: any[]; is_valid_dag: boolean; detected_cycles: any[] }> {
    const res = await fetch(`${API_BASE}/skills/graph`);
    if (!res.ok) throw new Error('Failed to fetch skill graph');
    return res.json();
  },

  // Mapping Engine
  async suggestMappings(payload: { outcome_text: string; course_name?: string; top_k?: number }): Promise<MappingSuggestResult> {
    const res = await fetch(`${API_BASE}/mappings/suggest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to generate skill suggestions');
    return res.json();
  },

  async reviewMapping(payload: {
    course_outcome_id: number;
    skill_id: string;
    review_status: 'ACCEPTED' | 'REJECTED' | 'NEEDS_REVIEW';
    similarity_score: number;
    method: string;
    evidence_text?: string;
  }): Promise<{ message: string; mapping_id: number; review_status: string }> {
    const res = await fetch(`${API_BASE}/mappings/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to update mapping review');
    return res.json();
  },

  async getCurriculumMappings(curriculumId: number): Promise<CurriculumMapping[]> {
    const res = await fetch(`${API_BASE}/mappings/curriculum/${curriculumId}`);
    if (!res.ok) throw new Error('Failed to fetch curriculum mappings');
    return res.json();
  },

  async getMappingEngineStatus(): Promise<any> {
    const res = await fetch(`${API_BASE}/mappings/status`);
    if (!res.ok) throw new Error('Failed to fetch mapping status');
    return res.json();
  },

  // Self Assessments
  async getAssessments(userId: string = 'student_user'): Promise<Assessment[]> {
    const res = await fetch(`${API_BASE}/assessments?user_id=${userId}`);
    if (!res.ok) throw new Error('Failed to fetch self-assessments');
    return res.json();
  },

  async recordAssessment(payload: {
    user_id?: string;
    skill_id: string;
    rating: 'None' | 'Basic' | 'Can Build Something' | 'Not sure';
  }): Promise<Assessment> {
    const res = await fetch(`${API_BASE}/assessments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to record self-assessment');
    return res.json();
  },

  async batchUpdateAssessments(items: Array<{ user_id?: string; skill_id: string; rating: string }>): Promise<any> {
    const res = await fetch(`${API_BASE}/assessments/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(items)
    });
    if (!res.ok) throw new Error('Failed to batch update assessments');
    return res.json();
  },

  // Analysis
  async runAnalysis(payload: {
    user_id?: string;
    role_profile_id: string;
    curriculum_version_id: number;
    curriculum_weight?: number;
    self_rating_weight?: number;
    bloom_depth_enabled?: boolean;
  }): Promise<AnalysisResult> {
    const res = await fetch(`${API_BASE}/analysis`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to execute skill gap analysis');
    return res.json();
  },

  // Roadmap
  async generateRoadmap(payload: {
    user_id?: string;
    role_profile_id: string;
    curriculum_version_id: number;
    available_weeks: number;
    hours_per_week: number;
    override_prerequisites?: boolean;
  }): Promise<Roadmap> {
    const res = await fetch(`${API_BASE}/roadmaps/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to generate learning roadmap');
    return res.json();
  },

  async getRoadmapDetail(roadmapId: number): Promise<Roadmap> {
    const res = await fetch(`${API_BASE}/roadmaps/${roadmapId}`);
    if (!res.ok) throw new Error('Failed to fetch roadmap detail');
    return res.json();
  },

  async updateRoadmapTask(taskId: number, payload: {
    status?: string;
    actual_hours?: number;
    notes?: string;
  }): Promise<any> {
    const res = await fetch(`${API_BASE}/roadmaps/tasks/${taskId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to update roadmap task');
    return res.json();
  },

  // Evaluation Lab
  async getEvaluationDatasets(): Promise<any[]> {
    const res = await fetch(`${API_BASE}/evaluation/datasets`);
    if (!res.ok) throw new Error('Failed to fetch evaluation datasets');
    return res.json();
  },

  async runEvaluation(payload: {
    dataset_id: number;
    threshold?: number;
    top_k?: number;
    test_partition_only?: boolean;
  }): Promise<EvaluationComparison> {
    const res = await fetch(`${API_BASE}/evaluation/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to run evaluation experiment');
    return res.json();
  },

  getEvaluationExportUrl(runId: number): string {
    return `${API_BASE}/evaluation/runs/${runId}/export`;
  },

  // Demo Reset
  async resetDemoData(): Promise<any> {
    const res = await fetch(`${API_BASE}/reset-demo`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to reset demo data');
    return res.json();
  }
};
