import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Compass,
  PieChart as PieIcon,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Briefcase,
  ArrowRight,
  TrendingUp,
  Sparkles
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import { api } from '../api';
import { Card, Button, Badge } from '../components/UIComponents';
import { AnalysisResult, RoleProfile, CurriculumVersion, Roadmap } from '../types';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [roles, setRoles] = useState<RoleProfile[]>([]);
  const [curricula, setCurricula] = useState<CurriculumVersion[]>([]);
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>('frontend-dev');

  useEffect(() => {
    loadDashboardData(selectedRole);
  }, [selectedRole]);

  const loadDashboardData = async (roleId: string) => {
    try {
      setLoading(true);
      const [rList, cList] = await Promise.all([
        api.getRoles(),
        api.getCurricula()
      ]);
      setRoles(rList);
      setCurricula(cList);

      const activeCurricId = cList[0]?.id || 1;
      const analysisData = await api.runAnalysis({
        user_id: 'student_user',
        role_profile_id: roleId,
        curriculum_version_id: activeCurricId
      });
      setAnalysis(analysisData);

      // Generate or fetch roadmap
      const rmData = await api.generateRoadmap({
        user_id: 'student_user',
        role_profile_id: roleId,
        curriculum_version_id: activeCurricId,
        available_weeks: 8,
        hours_per_week: 10
      });
      setRoadmap(rmData);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !analysis) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-400">Loading student analytics and AI models...</p>
      </div>
    );
  }

  // Chart 1 & 2: Demand vs Current Skill Indicator Data
  const demandVsIndicatorData = analysis.skill_gaps.map((g) => ({
    name: g.canonical_name.length > 14 ? g.canonical_name.slice(0, 12) + '..' : g.canonical_name,
    fullName: g.canonical_name,
    required: Math.round(g.required_level * 100),
    current: Math.round(g.current_skill_indicator * 100),
    gap: Math.round(g.gap_size * 100),
    roleDemand: g.role_demand
  }));

  // Chart 3: Skill Gap Distribution Pie Data
  const gapDistributionData = [
    { name: 'Already Covered', value: analysis.covered_skills_count, color: '#10b981' },
    { name: 'Partially Covered', value: analysis.partial_skills_count, color: '#06b6d4' },
    { name: 'High-Priority Gaps', value: analysis.gap_skills_count, color: '#f43f5e' }
  ];

  // Chart 4: Skills by Category
  const categoryCounts: Record<string, number> = {};
  analysis.skill_gaps.forEach((g) => {
    categoryCounts[g.category] = (categoryCounts[g.category] || 0) + 1;
  });
  const categoryData = Object.entries(categoryCounts).map(([cat, count]) => ({
    category: cat.replace(' Development', ''),
    skills: count
  }));

  // Chart 5: Weekly Roadmap Hours Allocation
  const weeklyRoadmapData = Array.from({ length: 8 }, (_, i) => i + 1).map((weekNum) => {
    const tasks = roadmap?.scheduled_by_week[weekNum] || [];
    const hours = tasks.reduce((acc, t) => acc + t.estimated_hours, 0);
    return {
      week: `Week ${weekNum}`,
      hours: hours,
      taskCount: tasks.length
    };
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Student Learning Dashboard</h1>
            <Badge variant="cyan">Real-Time Sync</Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Visual analytics synthesizing curriculum coverage, self-assessment, and role alignment.
          </p>
        </div>

        {/* Role Selector Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium">Target Role:</span>
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="text-xs bg-navy-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.role_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card className="p-4 bg-navy-900/90 border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-medium uppercase tracking-wider">Target Role</span>
            <Briefcase className="w-4 h-4 text-brand-400" />
          </div>
          <div className="text-sm font-bold text-white truncate">{analysis.role_name}</div>
          <div className="text-[10px] text-slate-400 mt-1">Curated Industry Benchmark</div>
        </Card>

        <Card className="p-4 bg-navy-900/90 border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-medium uppercase tracking-wider">Role Alignment</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-extrabold text-emerald-400">{analysis.role_alignment_pct}%</div>
          <div className="text-[10px] text-slate-400 mt-1">Weighted Indicator & Bloom's</div>
        </Card>

        <Card className="p-4 bg-navy-900/90 border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-medium uppercase tracking-wider">High Gaps</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-xl font-extrabold text-rose-400">{analysis.gap_skills_count}</div>
          <div className="text-[10px] text-slate-400 mt-1">Critical skills requiring study</div>
        </Card>

        <Card className="p-4 bg-navy-900/90 border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-medium uppercase tracking-wider">Partially Covered</span>
            <Compass className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-xl font-extrabold text-cyan-400">{analysis.partial_skills_count}</div>
          <div className="text-[10px] text-slate-400 mt-1">Theory known / build practical</div>
        </Card>

        <Card className="p-4 bg-navy-900/90 border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-medium uppercase tracking-wider">Already Covered</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-extrabold text-emerald-300">{analysis.covered_skills_count}</div>
          <div className="text-[10px] text-slate-400 mt-1">Syllabus & self-rated meet target</div>
        </Card>

        <Card className="p-4 bg-navy-900/90 border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-medium uppercase tracking-wider">Roadmap Budget</span>
            <Clock className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-xl font-extrabold text-indigo-300">{roadmap?.total_available_hours}h</div>
          <div className="text-[10px] text-slate-400 mt-1">{roadmap?.allocated_hours}h scheduled in 8 wks</div>
        </Card>
      </div>

      {/* Main Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Demand vs Current Indicator Bar Chart */}
        <Card className="lg:col-span-8 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white">
                Role Requirement vs. Current Skill Indicator
              </h3>
              <p className="text-xs text-slate-400">
                Comparing target required level against estimated readiness indicator (0–100%)
              </p>
            </div>
            <Badge variant="brand">Weighted Metric</Badge>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={demandVsIndicatorData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} angle={-25} textAnchor="end" />
                <YAxis stroke="#64748b" fontSize={11} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                  formatter={(val: any) => [`${val}%`]}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="required" name="Required Level" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="current" name="Current Skill Indicator" fill="#06b6d4" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Skill Gap Distribution Donut Chart */}
        <Card className="lg:col-span-4 p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white mb-1">Skill Gap Distribution</h3>
            <p className="text-xs text-slate-400 mb-2">Distribution of role skills by readiness status</p>
            <div className="h-56 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={gapDistributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {gapDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-800 text-xs">
            {gapDistributionData.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-slate-300">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span>{item.name}</span>
                </div>
                <span className="font-semibold text-white">{item.value} skills</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Main Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Weekly Roadmap Hour Allocation */}
        <Card className="lg:col-span-7 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white">Roadmap Schedule Allocation (Hours/Week)</h3>
              <p className="text-xs text-slate-400">Weekly allocation enforcing prerequisite dependencies</p>
            </div>
            <Button size="sm" variant="outline" onClick={() => navigate('/roadmap')}>
              View Roadmap
            </Button>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyRoadmapData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                <XAxis dataKey="week" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} domain={[0, 15]} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                  formatter={(val: any) => [`${val} hrs`]}
                />
                <Bar dataKey="hours" name="Allocated Hours" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Skills by Category */}
        <Card className="lg:col-span-5 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white">Skills by Domain Category</h3>
              <p className="text-xs text-slate-400">Domain representation for {analysis.role_name}</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={categoryData}
                margin={{ top: 10, right: 20, left: 20, bottom: 5 }}
              >
                <XAxis type="number" stroke="#64748b" fontSize={11} />
                <YAxis dataKey="category" type="category" stroke="#64748b" fontSize={10} width={100} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                />
                <Bar dataKey="skills" name="Skills Count" fill="#818cf8" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Action Footer Callouts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 bg-gradient-to-br from-brand-950/60 to-navy-900 border-brand-500/30 flex items-center justify-between">
          <div>
            <h4 className="text-sm font-semibold text-white">Run Skill Gap Analysis</h4>
            <p className="text-xs text-slate-400">Inspect full gaps table & priority scores</p>
          </div>
          <Button size="sm" variant="primary" onClick={() => navigate('/analysis')}>
            Analyze
          </Button>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-indigo-950/60 to-navy-900 border-indigo-500/30 flex items-center justify-between">
          <div>
            <h4 className="text-sm font-semibold text-white">Personalized Roadmap</h4>
            <p className="text-xs text-slate-400">Timeline & Kanban with verified tutorials</p>
          </div>
          <Button size="sm" variant="secondary" onClick={() => navigate('/roadmap')}>
            Roadmap
          </Button>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-cyan-950/60 to-navy-900 border-cyan-500/30 flex items-center justify-between">
          <div>
            <h4 className="text-sm font-semibold text-white">AI Evaluation Lab</h4>
            <p className="text-xs text-slate-400">Benchmark semantic model vs baseline</p>
          </div>
          <Button size="sm" variant="outline" onClick={() => navigate('/evaluation')}>
            Lab
          </Button>
        </Card>
      </div>
    </div>
  );
};
