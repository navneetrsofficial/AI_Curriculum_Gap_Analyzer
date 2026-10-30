import React, { useEffect, useState } from 'react';
import {
  BookOpen,
  Plus,
  Upload,
  Download,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  ChevronDown,
  Layers,
  Sparkles,
  Search,
  Check,
  X
} from 'lucide-react';
import { api } from '../api';
import { Card, Button, Badge, Modal } from '../components/UIComponents';
import { CurriculumVersion, CandidateMatch, MappingSuggestResult } from '../types';

export const CurriculaPage: React.FC = () => {
  const [curricula, setCurricula] = useState<CurriculumVersion[]>([]);
  const [selectedCurricId, setSelectedCurricId] = useState<number | null>(null);
  const [curricDetail, setCurricDetail] = useState<CurriculumVersion | null>(null);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showMappingModal, setShowMappingModal] = useState(false);

  // Form states
  const [newInst, setNewInst] = useState('');
  const [newProg, setNewProg] = useState('Computer Science & Engineering');
  const [newVer, setNewVer] = useState('');
  const [newYear, setNewYear] = useState('2024-2025');
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Mapping test modal state
  const [activeOutcome, setActiveOutcome] = useState<{ id: number; text: string; courseName: string } | null>(null);
  const [mappingResult, setMappingResult] = useState<MappingSuggestResult | null>(null);
  const [mappingLoading, setMappingLoading] = useState(false);
  const [reviewMsg, setReviewMsg] = useState<string | null>(null);

  useEffect(() => {
    loadCurricula();
  }, []);

  const loadCurricula = async () => {
    try {
      setLoading(true);
      const list = await api.getCurricula();
      setCurricula(list);
      if (list.length > 0) {
        const id = selectedCurricId || list[0].id;
        setSelectedCurricId(id);
        await loadDetail(id);
      }
    } catch (err) {
      console.error('Failed to load curricula:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadDetail = async (id: number) => {
    try {
      const detail = await api.getCurriculumDetail(id);
      setCurricDetail(detail);
      setSelectedCurricId(id);
    } catch (err) {
      console.error('Failed to load curriculum detail:', err);
    }
  };

  const handleCreateCurriculum = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInst || !newVer) {
      alert('Institution and Version Name are required.');
      return;
    }
    try {
      setSubmitting(true);
      const res = await api.createCustomCurriculum({
        institution_name: newInst,
        programme_name: newProg,
        version_name: newVer,
        academic_year: newYear
      });
      setShowCreateModal(false);
      setNewInst('');
      setNewVer('');
      await loadCurricula();
      await loadDetail(res.curriculum_id);
    } catch (err: any) {
      alert(`Error creating curriculum: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleImportCsv = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importFile) {
      alert('Please select a CSV file.');
      return;
    }
    try {
      setSubmitting(true);
      setImportErrors([]);
      const res = await api.uploadCurriculumCsv(importFile);
      if (res.errors && res.errors.length > 0) {
        setImportErrors(res.errors);
      }
      setShowImportModal(false);
      setImportFile(null);
      await loadCurricula();
      await loadDetail(res.curriculum_id);
    } catch (err: any) {
      setImportErrors([err.message]);
    } finally {
      setSubmitting(false);
    }
  };

  const openMappingInspector = async (outcomeId: number, outcomeText: string, courseName: string) => {
    setActiveOutcome({ id: outcomeId, text: outcomeText, courseName });
    setShowMappingModal(true);
    setMappingLoading(true);
    setReviewMsg(null);
    try {
      const res = await api.suggestMappings({
        outcome_text: outcomeText,
        course_name: courseName,
        top_k: 3
      });
      setMappingResult(res);
    } catch (err) {
      console.error('Failed to run mapping suggestion:', err);
    } finally {
      setMappingLoading(false);
    }
  };

  const handleReviewAction = async (skillId: string, status: 'ACCEPTED' | 'REJECTED' | 'NEEDS_REVIEW', score: number, method: string) => {
    if (!activeOutcome) return;
    try {
      const res = await api.reviewMapping({
        course_outcome_id: activeOutcome.id,
        skill_id: skillId,
        review_status: status,
        similarity_score: score,
        method: method,
        evidence_text: `Review decision for ${activeOutcome.courseName}`
      });
      setReviewMsg(`Decision saved: ${status} for skill ${skillId}`);
      if (selectedCurricId) {
        await loadDetail(selectedCurricId);
      }
    } catch (err: any) {
      alert(`Review error: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Curriculum Management</h1>
            <Badge variant="brand">Multi-Institution Support</Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Maintain institutional curricula, courses, units, and learning outcomes mapped to industry skills.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowImportModal(true)}
          >
            <Upload className="w-3.5 h-3.5 text-cyan-400" />
            <span>Import CSV</span>
          </Button>

          <Button
            size="sm"
            variant="primary"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Curriculum</span>
          </Button>
        </div>
      </div>

      {/* Curriculum Selector Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {curricula.map((c) => (
          <button
            key={c.id}
            onClick={() => loadDetail(c.id)}
            className={`px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all border ${
              selectedCurricId === c.id
                ? 'bg-brand-600/20 text-brand-300 border-brand-500/40 shadow-sm shadow-brand-500/10'
                : 'bg-navy-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <BookOpen className="w-3.5 h-3.5" />
              <span>{c.version_name}</span>
              {c.is_demo && <Badge variant="slate" className="text-[10px] py-0 px-1.5">Demo</Badge>}
            </div>
          </button>
        ))}
      </div>

      {/* Curriculum Detail Content */}
      {curricDetail ? (
        <div className="space-y-6">
          {/* Metadata Bar */}
          <Card className="p-4 bg-navy-900/90 border-slate-800">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block mb-0.5">Institution:</span>
                <span className="font-semibold text-white">{curricDetail.institution?.name || 'Autonomous Institution'}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Programme:</span>
                <span className="font-semibold text-white">{curricDetail.programme?.degree} in {curricDetail.programme?.branch}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Academic Year:</span>
                <span className="font-semibold text-slate-200">{curricDetail.academic_year}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Curriculum Metrics:</span>
                <span className="font-semibold text-cyan-400">{curricDetail.total_courses || 0} Courses, {curricDetail.total_outcomes || 0} Outcomes</span>
              </div>
            </div>
          </Card>

          {/* Semesters and Courses List */}
          <div className="space-y-4">
            {curricDetail.semesters?.map((sem) => (
              <div key={sem.id} className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider px-1">
                  <Layers className="w-3.5 h-3.5 text-brand-400" />
                  <span>{sem.name}</span>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {sem.courses.map((course) => (
                    <Card key={course.id} className="p-4 bg-navy-900 border-slate-800/80">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-3 border-b border-slate-800 gap-2">
                        <div className="flex items-center gap-3">
                          <span className="px-2 py-1 rounded bg-brand-500/10 border border-brand-500/20 text-brand-400 font-mono text-xs font-semibold">
                            {course.course_code}
                          </span>
                          <h4 className="text-sm font-semibold text-white">{course.name}</h4>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <span>Credits: <strong className="text-slate-200">{course.credits}</strong></span>
                        </div>
                      </div>

                      {/* Course Outcomes */}
                      <div className="space-y-2">
                        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                          Course Outcomes & Verified Mappings
                        </span>
                        <div className="space-y-2">
                          {course.outcomes?.map((outcome) => (
                            <div
                              key={outcome.id}
                              className="p-3 rounded-lg bg-navy-950/70 border border-slate-800 hover:border-slate-700 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                            >
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono font-semibold text-slate-300">{outcome.outcome_code}:</span>
                                  <span className="text-slate-200">{outcome.outcome_text}</span>
                                </div>
                                <div className="flex items-center gap-3 text-[11px] text-slate-400">
                                  <span>Bloom's Taxonomy: <strong className="text-cyan-400">{outcome.bloom_level}</strong></span>
                                  {outcome.suggested_bloom && (
                                    <span className="text-slate-400">(Heuristic: {outcome.suggested_bloom})</span>
                                  )}
                                  {outcome.accepted_mappings_count !== undefined && outcome.accepted_mappings_count > 0 ? (
                                    <Badge variant="success" className="py-0 text-[10px]">
                                      {outcome.accepted_mappings_count} Accepted Skill Mappings
                                    </Badge>
                                  ) : (
                                    <Badge variant="warning" className="py-0 text-[10px]">
                                      Pending Verification
                                    </Badge>
                                  )}
                                </div>
                              </div>

                              <div className="shrink-0">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => openMappingInspector(outcome.id, outcome.outcome_text, course.name)}
                                >
                                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                                  <span>AI Mapping Engine</span>
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <Card className="p-8 text-center text-slate-400">
          <BookOpen className="w-8 h-8 mx-auto mb-2 text-slate-500" />
          <p>No curriculum selected. Choose or import a syllabus to view courses.</p>
        </Card>
      )}

      {/* Modal 1: Create Custom Curriculum */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Custom Academic Curriculum"
      >
        <form onSubmit={handleCreateCurriculum} className="space-y-4 text-xs md:text-sm">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Institution Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={newInst}
              onChange={(e) => setNewInst(e.target.value)}
              placeholder="e.g. Pune Autonomous Engineering Institute"
              className="w-full bg-navy-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-brand-500 text-xs"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Programme & Degree
            </label>
            <input
              type="text"
              value={newProg}
              onChange={(e) => setNewProg(e.target.value)}
              placeholder="e.g. B.Tech Computer Science and Engineering"
              className="w-full bg-navy-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-brand-500 text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Version Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={newVer}
                onChange={(e) => setNewVer(e.target.value)}
                placeholder="e.g. Autonomous Syllabus 2024–2028"
                className="w-full bg-navy-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-brand-500 text-xs"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Academic Year</label>
              <input
                type="text"
                value={newYear}
                onChange={(e) => setNewYear(e.target.value)}
                placeholder="2024-2025"
                className="w-full bg-navy-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-brand-500 text-xs"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
            <Button variant="ghost" onClick={() => setShowCreateModal(false)}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={submitting}>
              {submitting ? 'Creating...' : 'Create Curriculum'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal 2: CSV Bulk Import */}
      <Modal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        title="Import Syllabus from CSV"
      >
        <form onSubmit={handleImportCsv} className="space-y-4 text-xs">
          <div className="p-3 rounded-lg bg-navy-950 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="font-semibold text-white block">Download Syllabus Template</span>
              <span className="text-slate-400">Pre-formatted columns including course outcomes and Bloom levels.</span>
            </div>
            <a
              href={api.getTemplateDownloadUrl()}
              download
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>Template CSV</span>
            </a>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Select CSV File</label>
            <input
              type="file"
              accept=".csv"
              onChange={(e) => setImportFile(e.target.files?.[0] || null)}
              className="w-full bg-navy-950 border border-slate-700 rounded-lg p-2 text-slate-300 text-xs file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-brand-600 file:text-white hover:file:bg-brand-500"
            />
          </div>

          {importErrors.length > 0 && (
            <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-500/30 text-rose-300 space-y-1">
              <div className="font-semibold flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Import Validation Errors:</span>
              </div>
              <ul className="list-disc list-inside text-[11px] space-y-0.5 text-rose-200">
                {importErrors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
            <Button variant="ghost" onClick={() => setShowImportModal(false)}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={submitting || !importFile}>
              {submitting ? 'Importing...' : 'Upload & Validate'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal 3: Live AI Skill Mapping Inspector */}
      <Modal
        isOpen={showMappingModal}
        onClose={() => setShowMappingModal(false)}
        title="NLP Curriculum-to-Skill Mapping Inspector"
      >
        <div className="space-y-4 text-xs">
          {activeOutcome && (
            <div className="p-3 rounded-lg bg-navy-950 border border-slate-800">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                Selected Course Outcome ({activeOutcome.courseName}):
              </span>
              <p className="text-slate-100 italic">"{activeOutcome.text}"</p>
            </div>
          )}

          {reviewMsg && (
            <div className="p-2.5 rounded-lg bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>{reviewMsg}</span>
            </div>
          )}

          {mappingLoading ? (
            <div className="py-8 text-center text-slate-400 space-y-2">
              <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p>Executing dual-engine matching (Keyword Baseline & Semantic Dense Vectors)...</p>
            </div>
          ) : mappingResult ? (
            <div className="space-y-4">
              {mappingResult.disagreement_note && (
                <div className="p-2.5 rounded-lg bg-amber-950/50 border border-amber-500/30 text-amber-300">
                  <span className="font-semibold block mb-0.5">Method Disagreement Detected:</span>
                  <span>{mappingResult.disagreement_note}</span>
                </div>
              )}

              {/* Side by side candidates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Method A: Keyword Baseline */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between pb-1 border-b border-slate-800">
                    <span className="font-semibold text-slate-300">Method A: Keyword Baseline</span>
                    <Badge variant="slate">Lexical TF-IDF</Badge>
                  </div>
                  <div className="space-y-2">
                    {mappingResult.keyword_baseline_candidates.map((c, i) => (
                      <div key={i} className="p-2.5 rounded-lg bg-navy-900 border border-slate-800 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-white">{c.canonical_name}</span>
                          <span className="font-mono text-indigo-400 font-bold">{c.similarity_score.toFixed(3)}</span>
                        </div>
                        <p className="text-[11px] text-slate-400">{c.explanation}</p>
                        <div className="flex items-center gap-1.5 pt-1">
                          <button
                            onClick={() => handleReviewAction(c.skill_id, 'ACCEPTED', c.similarity_score, 'KEYWORD')}
                            className="px-2 py-0.5 rounded bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600/30 border border-emerald-500/30 text-[10px]"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleReviewAction(c.skill_id, 'REJECTED', c.similarity_score, 'KEYWORD')}
                            className="px-2 py-0.5 rounded bg-rose-600/20 text-rose-300 hover:bg-rose-600/30 border border-rose-500/30 text-[10px]"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Method B: Semantic Model */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between pb-1 border-b border-slate-800">
                    <span className="font-semibold text-cyan-300">Method B: Semantic Embedding</span>
                    <Badge variant="cyan">Sentence Transformers</Badge>
                  </div>
                  <div className="space-y-2">
                    {mappingResult.semantic_embedding_candidates.map((c, i) => (
                      <div key={i} className="p-2.5 rounded-lg bg-navy-900 border border-cyan-500/20 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-white">{c.canonical_name}</span>
                          <span className="font-mono text-cyan-400 font-bold">{c.similarity_score.toFixed(3)}</span>
                        </div>
                        <p className="text-[11px] text-slate-400">{c.explanation}</p>
                        <div className="flex items-center gap-1.5 pt-1">
                          <button
                            onClick={() => handleReviewAction(c.skill_id, 'ACCEPTED', c.similarity_score, 'SEMANTIC')}
                            className="px-2 py-0.5 rounded bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600/30 border border-emerald-500/30 text-[10px]"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleReviewAction(c.skill_id, 'REJECTED', c.similarity_score, 'SEMANTIC')}
                            className="px-2 py-0.5 rounded bg-rose-600/20 text-rose-300 hover:bg-rose-600/30 border border-rose-500/30 text-[10px]"
                          >
                            Reject
                          </button>
                          <button
                            onClick={() => handleReviewAction(c.skill_id, 'NEEDS_REVIEW', c.similarity_score, 'SEMANTIC')}
                            className="px-2 py-0.5 rounded bg-amber-600/20 text-amber-300 hover:bg-amber-600/30 border border-amber-500/30 text-[10px]"
                          >
                            Flag Review
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          <div className="flex justify-end pt-3 border-t border-slate-800">
            <Button variant="ghost" onClick={() => setShowMappingModal(false)}>Close Inspector</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
