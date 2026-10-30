import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PieChart as PieIcon,
  Filter,
  Search,
  Download,
  Printer,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  Sparkles,
  Info
} from 'lucide-react';
import { api } from '../api';
import { Card, Button, Badge } from '../components/UIComponents';
import { FormulaExplainer } from '../components/FormulaExplainer';
import { AnalysisResult, RoleProfile, CurriculumVersion, SkillGapDetail } from '../types';

export const GapAnalysisPage: React.FC = () => {
  const navigate = useNavigate();
  const [roles, setRoles] = useState<RoleProfile[]>([]);
  const [curricula, setCurricula] = useState<CurriculumVersion[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>(() => localStorage.getItem('selectedRoleId') || 'frontend-dev');
  const [selectedCurric, setSelectedCurric] = useState<number>(1);
  
  // Weights configuration
  const [curricWeight, setCurricWeight] = useState<number>(0.4);
  const [selfWeight, setSelfWeight] = useState<number>(0.6);
  const [bloomEnabled, setBloomEnabled] = useState<boolean>(true);

  // Filter & Search
  const [activeFilter, setActiveFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    loadPrerequisites();
  }, []);

  useEffect(() => {
    if (selectedRole && selectedCurric) {
      runAnalysis();
    }
  }, [selectedRole, selectedCurric, curricWeight, selfWeight, bloomEnabled]);

  const loadPrerequisites = async () => {
    try {
      const [rList, cList] = await Promise.all([
        api.getRoles(),
        api.getCurricula()
      ]);
      setRoles(rList);
      setCurricula(cList);
      if (cList.length > 0) {
        setSelectedCurric(cList[0].id);
      }
    } catch (err) {
      console.error('Failed to load prerequisites:', err);
    }
  };

  const runAnalysis = async () => {
    try {
      setLoading(true);
      const res = await api.runAnalysis({
        user_id: 'student_user',
        role_profile_id: selectedRole,
        curriculum_version_id: selectedCurric,
        curriculum_weight: curricWeight,
        self_rating_weight: selfWeight,
        bloom_depth_enabled: bloomEnabled
      });
      setAnalysis(res);
    } catch (err) {
      console.error('Failed to run gap analysis:', err);
    } finally {
      setLoading(false);
    }
  };

  // CSV Export for analysis table
  const handleExportCsv = () => {
    if (!analysis) return;
    const headers = [
      'Skill Name',
      'Category',
      'Role Demand Weight',
      'Normalized Demand',
      'Curriculum Coverage',
      'Bloom Depth Factor',
      'Self Rating',
      'Current Skill Indicator',
      'Required Proficiency',
      'Skill Gap Size',
      'Priority Score',
      'Evidence Status',
      'Recommended Action'
    ];

    const rows = analysis.skill_gaps.map((g) => [
      `"${g.canonical_name}"`,
      `"${g.category}"`,
      g.role_demand,
      g.normalized_demand,
      g.curriculum_coverage,
      g.bloom_depth_factor,
      `"${g.self_rating}"`,
      g.current_skill_indicator,
      g.required_level,
      g.gap_size,
      g.priority_score,
      g.evidence_status,
      `"${g.recommended_action}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${selectedRole}_skill_gap_analysis.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintReport = () => {
    window.print();
  };

  const filteredGaps = analysis?.skill_gaps.filter((g) => {
    const matchesSearch =
      g.canonical_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.category.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (activeFilter === 'HIGH_PRIORITY') return g.priority_score >= 0.3;
    if (activeFilter === 'PARTIALLY_COVERED') return g.status_label === 'PARTIALLY_COVERED';
    if (activeFilter === 'ALREADY_COVERED') return g.status_label === 'ALREADY_COVERED';
    if (activeFilter === 'MISSING_ASSESSMENT') return !g.has_self_assessment;
    if (activeFilter === 'AWAITING_REVIEW') return g.evidence_status === 'AWAITING_REVIEW';
    return true;
  }) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Career Skill Gap Analysis</h1>
            <Badge variant="cyan">Multi-Factor Engine</Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Combines curriculum evidence, Bloom's depth, student self-assessment, and role weights to compute deterministic skill gaps.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={handleExportCsv} disabled={!analysis}>
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Export CSV</span>
          </Button>

          <Button size="sm" variant="outline" onClick={handlePrintReport}>
            <Printer className="w-3.5 h-3.5 text-slate-300" />
            <span>Print Report</span>
          </Button>

          <Button
            size="sm"
            variant="primary"
            onClick={() => {
              localStorage.setItem('selectedRoleId', selectedRole);
              navigate('/roadmap');
            }}
          >
            <span>Generate Roadmap</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </div>
      </div>

      {/* Control Configuration Bar */}
      <Card className="p-4 bg-navy-900 border-slate-800 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {/* Role selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Target Career Role:</label>
            <select
              value={selectedRole}
              onChange={(e) => {
                setSelectedRole(e.target.value);
                localStorage.setItem('selectedRoleId', e.target.value);
              }}
              className="w-full bg-navy-950 border border-slate-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.role_name}
                </option>
              ))}
            </select>
          </div>

          {/* Curriculum selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Academic Curriculum:</label>
            <select
              value={selectedCurric}
              onChange={(e) => setSelectedCurric(Number(e.target.value))}
              className="w-full bg-navy-950 border border-slate-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              {curricula.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.version_name}
                </option>
              ))}
            </select>
          </div>

          {/* Curriculum Weight Slider */}
          <div>
            <div className="flex justify-between font-semibold text-slate-300 mb-1">
              <span>Curriculum Weight:</span>
              <span className="font-mono text-cyan-400 font-bold">{curricWeight.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="0.9"
              step="0.05"
              value={curricWeight}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setCurricWeight(val);
                setSelfWeight(parseFloat((1.0 - val).toFixed(2)));
              }}
              className="w-full accent-cyan-400"
            />
          </div>

          {/* Self-Rating Weight Slider */}
          <div>
            <div className="flex justify-between font-semibold text-slate-300 mb-1">
              <span>Self-Rating Weight:</span>
              <span className="font-mono text-brand-400 font-bold">{selfWeight.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="0.9"
              step="0.05"
              value={selfWeight}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setSelfWeight(val);
                setCurricWeight(parseFloat((1.0 - val).toFixed(2)));
              }}
              className="w-full accent-brand-500"
            />
          </div>
        </div>

        {/* Bloom Depth Toggle */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs">
          <label className="flex items-center gap-2 cursor-pointer text-slate-300">
            <input
              type="checkbox"
              checked={bloomEnabled}
              onChange={(e) => setBloomEnabled(e.target.checked)}
              className="rounded bg-navy-950 border-slate-700 text-brand-600 focus:ring-brand-500"
            />
            <span>Include Bloom’s depth scaling (Higher factor for Apply/Create outcomes vs Remember/Understand)</span>
          </label>

          <span className="text-[11px] text-slate-400">Sum of weights: {(curricWeight + selfWeight).toFixed(1)}</span>
        </div>
      </Card>

      {/* Expandable Mathematical Formula Explainer */}
      <FormulaExplainer />

      {/* Overall Alignment KPI Banner */}
      {analysis && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Card className="p-4 bg-navy-900 border-slate-800">
            <span className="text-[11px] uppercase tracking-wider text-slate-400 block mb-1">Role Alignment</span>
            <div className="text-2xl font-extrabold text-emerald-400">{analysis.role_alignment_pct}%</div>
            <span className="text-[10px] text-slate-400">Σ(wᵢ × cᵢ × bᵢ) / Σ(wᵢ)</span>
          </Card>

          <Card className="p-4 bg-navy-900 border-slate-800">
            <span className="text-[11px] uppercase tracking-wider text-slate-400 block mb-1">Total Profile Skills</span>
            <div className="text-2xl font-extrabold text-white">{analysis.total_skills_count}</div>
            <span className="text-[10px] text-slate-400">Role requirement set</span>
          </Card>

          <Card className="p-4 bg-navy-900 border-slate-800">
            <span className="text-[11px] uppercase tracking-wider text-slate-400 block mb-1">Already Covered</span>
            <div className="text-2xl font-extrabold text-emerald-300">{analysis.covered_skills_count}</div>
            <span className="text-[10px] text-slate-400">Gap ≤ 0.05</span>
          </Card>

          <Card className="p-4 bg-navy-900 border-slate-800">
            <span className="text-[11px] uppercase tracking-wider text-slate-400 block mb-1">Partially Covered</span>
            <div className="text-2xl font-extrabold text-cyan-400">{analysis.partial_skills_count}</div>
            <span className="text-[10px] text-slate-400">Theory or basic competence</span>
          </Card>

          <Card className="p-4 bg-navy-900 border-slate-800">
            <span className="text-[11px] uppercase tracking-wider text-slate-400 block mb-1">High-Priority Gaps</span>
            <div className="text-2xl font-extrabold text-rose-400">{analysis.gap_skills_count}</div>
            <span className="text-[10px] text-slate-400">Priority score ≥ 0.3</span>
          </Card>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search skill or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-navy-900 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 text-xs">
          {[
            { id: 'ALL', label: 'All Skills' },
            { id: 'HIGH_PRIORITY', label: 'High Priority Gaps' },
            { id: 'PARTIALLY_COVERED', label: 'Partially Covered' },
            { id: 'ALREADY_COVERED', label: 'Already Covered' },
            { id: 'MISSING_ASSESSMENT', label: 'Missing Assessment' },
            { id: 'AWAITING_REVIEW', label: 'Mapping Review' }
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id)}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap border transition-all ${
                activeFilter === f.id
                  ? 'bg-brand-600/20 text-brand-300 border-brand-500/40 shadow-sm'
                  : 'bg-navy-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Skill Gap Analysis Table */}
      <div className="border border-slate-800 rounded-xl overflow-hidden bg-navy-900 shadow-xl shadow-black/20">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-navy-950 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-3 font-semibold">Skill</th>
                <th className="py-3 px-3 font-semibold">Demand</th>
                <th className="py-3 px-3 font-semibold">Curric. Coverage</th>
                <th className="py-3 px-3 font-semibold">Self-Rating</th>
                <th className="py-3 px-3 font-semibold">Current Indicator</th>
                <th className="py-3 px-3 font-semibold">Required</th>
                <th className="py-3 px-3 font-semibold">Gap Size</th>
                <th className="py-3 px-3 font-semibold">Priority Score</th>
                <th className="py-3 px-3 font-semibold">Evidence Status</th>
                <th className="py-3 px-3 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-navy-900/40">
              {filteredGaps.map((g) => (
                <tr key={g.skill_id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-3">
                    <div className="font-semibold text-white">{g.canonical_name}</div>
                    <div className="text-[10px] text-slate-400">{g.category}</div>
                  </td>
                  <td className="py-3 px-3 font-mono font-bold text-slate-200">
                    {g.role_demand.toFixed(1)}
                  </td>
                  <td className="py-3 px-3 font-mono text-cyan-400 font-semibold">
                    {(g.curriculum_coverage * 100).toFixed(0)}%
                  </td>
                  <td className="py-3 px-3 text-slate-300">
                    {g.has_self_assessment ? (
                      <span className="font-medium text-slate-200">{g.self_rating}</span>
                    ) : (
                      <Badge variant="warning" className="text-[10px] py-0">Unrated</Badge>
                    )}
                  </td>
                  <td className="py-3 px-3 font-mono font-bold text-amber-300">
                    {(g.current_skill_indicator * 100).toFixed(0)}%
                  </td>
                  <td className="py-3 px-3 font-mono font-bold text-indigo-300">
                    {(g.required_level * 100).toFixed(0)}%
                  </td>
                  <td className="py-3 px-3 font-mono font-bold">
                    {g.gap_size > 0.05 ? (
                      <span className="text-rose-400">{(g.gap_size * 100).toFixed(0)}%</span>
                    ) : (
                      <span className="text-emerald-400">0%</span>
                    )}
                  </td>
                  <td className="py-3 px-3 font-mono font-extrabold text-sm">
                    <span className={g.priority_score >= 0.3 ? 'text-rose-400' : 'text-slate-300'}>
                      {g.priority_score.toFixed(3)}
                    </span>
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap">
                    {g.evidence_status === 'CONFIRMED_MAPPING' ? (
                      <Badge variant="success">Confirmed</Badge>
                    ) : g.evidence_status === 'AWAITING_REVIEW' ? (
                      <Badge variant="warning">Needs Review</Badge>
                    ) : (
                      <Badge variant="slate">No Evidence</Badge>
                    )}
                  </td>
                  <td className="py-3 px-3 text-[11px] text-slate-400 max-w-xs">
                    {g.recommended_action}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
