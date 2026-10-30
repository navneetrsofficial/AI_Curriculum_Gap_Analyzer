import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  HelpCircle,
  Save,
  Search,
  Filter,
  ArrowRight,
  ShieldAlert,
  Info
} from 'lucide-react';
import { api } from '../api';
import { Card, Button, Badge } from '../components/UIComponents';
import { Skill, Assessment } from '../types';

export const AssessmentPage: React.FC = () => {
  const navigate = useNavigate();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [assessments, setAssessments] = useState<Record<string, string>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [skillsList, assessList] = await Promise.all([
        api.getSkills(),
        api.getAssessments('student_user')
      ]);
      setSkills(skillsList);

      const map: Record<string, string> = {};
      assessList.forEach((a) => {
        map[a.skill_id] = a.rating;
      });
      setAssessments(map);
    } catch (err) {
      console.error('Failed to load assessment data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRatingChange = (skillId: string, rating: string) => {
    setAssessments((prev) => ({
      ...prev,
      [skillId]: rating
    }));
  };

  const handleSaveAll = async () => {
    try {
      setSaving(true);
      const items = Object.entries(assessments).map(([skill_id, rating]) => ({
        user_id: 'student_user',
        skill_id,
        rating
      }));
      await api.batchUpdateAssessments(items);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      alert(`Save error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const categories = ['ALL', ...Array.from(new Set(skills.map((s) => s.category)))];

  const filteredSkills = skills.filter((s) => {
    const matchesSearch =
      s.canonical_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = categoryFilter === 'ALL' || s.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-400">Loading skills taxonomy and self-assessment records...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Student Skill Self-Assessment</h1>
            <Badge variant="brand">Self-Reported Readiness</Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Rate your practical hands-on capability for each canonical skill. Kept strictly distinct from syllabus curriculum coverage.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {saveSuccess && (
            <span className="text-xs text-emerald-400 font-semibold animate-in fade-in">
              Saved successfully!
            </span>
          )}
          <Button
            size="sm"
            variant="primary"
            onClick={handleSaveAll}
            disabled={saving}
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? 'Saving...' : 'Save Assessments'}</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate('/analysis')}
          >
            <span>Proceed to Analysis</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </div>
      </div>

      {/* Explanatory Definition Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 rounded-xl bg-navy-900 border border-slate-800 text-xs">
        <div className="p-2.5 rounded-lg bg-navy-950 border border-slate-800">
          <div className="flex items-center gap-2 font-semibold text-rose-400 mb-1">
            <span className="w-2 h-2 rounded-full bg-rose-400" />
            <span>None (0.0)</span>
          </div>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            "I have little or no practical understanding of this skill."
          </p>
        </div>

        <div className="p-2.5 rounded-lg bg-navy-950 border border-slate-800">
          <div className="flex items-center gap-2 font-semibold text-cyan-400 mb-1">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <span>Basic (0.5)</span>
          </div>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            "I understand the fundamentals and can perform simple tasks with guidance."
          </p>
        </div>

        <div className="p-2.5 rounded-lg bg-navy-950 border border-slate-800">
          <div className="flex items-center gap-2 font-semibold text-emerald-400 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Can Build Something (1.0)</span>
          </div>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            "I can independently build or complete a small practical task using this skill."
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search canonical skill or topic..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-navy-900 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap border transition-all ${
                categoryFilter === cat
                  ? 'bg-brand-600/20 text-brand-300 border-brand-500/40'
                  : 'bg-navy-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Assessment Table */}
      <div className="border border-slate-800 rounded-xl overflow-hidden bg-navy-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-navy-950 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4 font-semibold">Canonical Skill</th>
                <th className="py-3 px-4 font-semibold">Category</th>
                <th className="py-3 px-4 font-semibold">Target Bloom Depth</th>
                <th className="py-3 px-4 font-semibold text-center">Self-Assessed Competence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-navy-900/40">
              {filteredSkills.map((s) => {
                const currentRating = assessments[s.id] || 'None';
                return (
                  <tr key={s.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-white">{s.canonical_name}</div>
                      <div className="text-[11px] text-slate-400 line-clamp-1 max-w-md">{s.description}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-300 whitespace-nowrap">
                      <Badge variant="slate">{s.category}</Badge>
                    </td>
                    <td className="py-3 px-4 text-cyan-400 font-mono">
                      {s.bloom_depth_min}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-1.5">
                        {['None', 'Basic', 'Can Build Something', 'Not sure'].map((option) => (
                          <button
                            key={option}
                            onClick={() => handleRatingChange(s.id, option)}
                            className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all border ${
                              currentRating === option
                                ? option === 'Can Build Something'
                                  ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500/50 shadow-sm'
                                  : option === 'Basic'
                                  ? 'bg-cyan-600/20 text-cyan-300 border-cyan-500/50 shadow-sm'
                                  : option === 'None'
                                  ? 'bg-rose-600/20 text-rose-300 border-rose-500/50 shadow-sm'
                                  : 'bg-amber-600/20 text-amber-300 border-amber-500/50'
                                : 'bg-navy-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                            }`}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Save Button Row */}
      <div className="flex items-center justify-between pt-2">
        <p className="text-xs text-slate-400 flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-cyan-400" />
          <span>Ratings directly calibrate the Current Skill Indicator and priority score formulas.</span>
        </p>

        <Button variant="primary" onClick={handleSaveAll} disabled={saving}>
          <Save className="w-3.5 h-3.5" />
          <span>{saving ? 'Saving...' : 'Save All Ratings'}</span>
        </Button>
      </div>
    </div>
  );
};
