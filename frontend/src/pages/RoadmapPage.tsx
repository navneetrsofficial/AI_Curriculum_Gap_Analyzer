import React, { useEffect, useState } from 'react';
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  BookOpen,
  ArrowRight,
  RotateCcw,
  Download,
  List,
  Columns,
  GitBranch,
  ShieldAlert,
  PlayCircle
} from 'lucide-react';
import { api } from '../api';
import { Card, Button, Badge } from '../components/UIComponents';
import { Roadmap, RoadmapTask, RoleProfile } from '../types';

export const RoadmapPage: React.FC = () => {
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [roles, setRoles] = useState<RoleProfile[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>(() => localStorage.getItem('selectedRoleId') || 'frontend-dev');
  const [availableWeeks, setAvailableWeeks] = useState<number>(8);
  const [hoursPerWeek, setHoursPerWeek] = useState<number>(10);
  const [overridePrereqs, setOverridePrereqs] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'timeline' | 'kanban' | 'dependencies'>('timeline');
  const [loading, setLoading] = useState<boolean>(true);
  const [generating, setGenerating] = useState<boolean>(false);

  useEffect(() => {
    loadInitial();
  }, []);

  const loadInitial = async () => {
    try {
      setLoading(true);
      const rList = await api.getRoles();
      setRoles(rList);
      await generatePlan(selectedRole, availableWeeks, hoursPerWeek, overridePrereqs);
    } catch (err) {
      console.error('Failed to initialize roadmap:', err);
    } finally {
      setLoading(false);
    }
  };

  const generatePlan = async (roleId: string, weeks: number, hours: number, override: boolean) => {
    try {
      setGenerating(true);
      const res = await api.generateRoadmap({
        user_id: 'student_user',
        role_profile_id: roleId,
        curriculum_version_id: 1,
        available_weeks: weeks,
        hours_per_week: hours,
        override_prerequisites: override
      });
      setRoadmap(res);
    } catch (err: any) {
      alert(`Roadmap generation error: ${err.message}`);
    } finally {
      setGenerating(false);
    }
  };

  const handleUpdateTaskStatus = async (taskId: number, newStatus: string) => {
    try {
      await api.updateRoadmapTask(taskId, { status: newStatus });
      if (roadmap) {
        // Refetch full roadmap
        const updated = await api.getRoadmapDetail(roadmap.id);
        setRoadmap(updated);
      }
    } catch (err: any) {
      alert(`Failed to update task: ${err.message}`);
    }
  };

  const handleLogHours = async (taskId: number, hours: number) => {
    try {
      await api.updateRoadmapTask(taskId, { actual_hours: hours });
      if (roadmap) {
        const updated = await api.getRoadmapDetail(roadmap.id);
        setRoadmap(updated);
      }
    } catch (err: any) {
      alert(`Failed to log hours: ${err.message}`);
    }
  };

  const handleExportCsv = () => {
    if (!roadmap) return;
    const headers = ['Skill Name', 'Week Number', 'Estimated Hours', 'Actual Hours', 'Status', 'Prerequisites', 'Learning Resource URL'];
    const rows = roadmap.tasks.map((t) => [
      `"${t.skill_name}"`,
      t.week_number === 0 ? 'Unscheduled / Exceeded Budget' : t.week_number,
      t.estimated_hours,
      t.actual_hours,
      t.status,
      `"${t.prerequisites.join('; ')}"`,
      `"${t.learning_resource?.url || 'N/A'}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${selectedRole}_learning_roadmap.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-400">Synthesizing prerequisite DAG and allocating study hours...</p>
      </div>
    );
  }

  const unscheduledTasks = roadmap?.tasks.filter((t) => t.week_number === 0) || [];
  const scheduledTasks = roadmap?.tasks.filter((t) => t.week_number > 0) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Personalized Learning Roadmap</h1>
            <Badge variant="cyan">Deterministic DAG Scheduler</Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Prerequisite-enforced study plan allocating prioritized skill gaps into realistic weekly study budgets.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={handleExportCsv} disabled={!roadmap}>
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Export CSV</span>
          </Button>

          {/* View Mode Switcher */}
          <div className="flex items-center p-0.5 rounded-lg bg-navy-900 border border-slate-800 text-xs">
            <button
              onClick={() => setViewMode('timeline')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors ${
                viewMode === 'timeline' ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Timeline</span>
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors ${
                viewMode === 'kanban' ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              <span>Kanban</span>
            </button>
            <button
              onClick={() => setViewMode('dependencies')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors ${
                viewMode === 'dependencies' ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <GitBranch className="w-3.5 h-3.5" />
              <span>Dependencies</span>
            </button>
          </div>
        </div>
      </div>

      {/* Scheduler Inputs Configuration Bar */}
      <Card className="p-4 bg-navy-900 border-slate-800">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs items-end">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Target Role:</label>
            <select
              value={selectedRole}
              onChange={(e) => {
                setSelectedRole(e.target.value);
                generatePlan(e.target.value, availableWeeks, hoursPerWeek, overridePrereqs);
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

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Available Weeks:</label>
            <input
              type="number"
              min="2"
              max="24"
              value={availableWeeks}
              onChange={(e) => setAvailableWeeks(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full bg-navy-950 border border-slate-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Study Hours / Week:</label>
            <input
              type="number"
              min="2"
              max="40"
              value={hoursPerWeek}
              onChange={(e) => setHoursPerWeek(Math.max(1, parseFloat(e.target.value) || 1))}
              className="w-full bg-navy-950 border border-slate-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              className="w-full"
              onClick={() => generatePlan(selectedRole, availableWeeks, hoursPerWeek, overridePrereqs)}
              disabled={generating}
            >
              <RotateCcw className={`w-3.5 h-3.5 ${generating ? 'animate-spin' : ''}`} />
              <span>{generating ? 'Scheduling...' : 'Recalculate Roadmap'}</span>
            </Button>
          </div>
        </div>

        {/* Budget Summary & Prerequisite Override Option */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 mt-3 border-t border-slate-800 text-xs">
          <div className="flex items-center gap-4 text-slate-300">
            <span>
              Total Budget: <strong className="text-cyan-400 font-mono">{availableWeeks * hoursPerWeek} hrs</strong>
            </span>
            <span>
              Allocated: <strong className="text-emerald-400 font-mono">{roadmap?.allocated_hours} hrs</strong>
            </span>
            {unscheduledTasks.length > 0 && (
              <span className="text-rose-400 font-semibold flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{unscheduledTasks.length} unscheduled due to budget limits</span>
              </span>
            )}
          </div>

          <label className="flex items-center gap-2 cursor-pointer text-slate-400 hover:text-slate-200">
            <input
              type="checkbox"
              checked={overridePrereqs}
              onChange={(e) => {
                setOverridePrereqs(e.target.checked);
                generatePlan(selectedRole, availableWeeks, hoursPerWeek, e.target.checked);
              }}
              className="rounded bg-navy-950 border-slate-700 text-brand-600 focus:ring-brand-500"
            />
            <span className="text-[11px]">Override Prerequisite Dependencies</span>
          </label>
        </div>
      </Card>

      {/* Unscheduled / Budget Warning Banner */}
      {unscheduledTasks.length > 0 && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs space-y-2">
          <div className="flex items-center gap-2 font-semibold">
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            <span>Time Budget Insufficient for Full Role Preparation</span>
          </div>
          <p className="text-[11px] text-rose-200 leading-relaxed">
            The following prioritized skills could not be scheduled within the {availableWeeks}-week budget ({availableWeeks * hoursPerWeek} total hours). Increase your available weeks or weekly study hours to accommodate them:
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            {unscheduledTasks.map((t) => (
              <span key={t.id} className="px-2 py-0.5 rounded bg-rose-900/60 border border-rose-500/40 text-[11px] font-medium text-white">
                {t.skill_name} ({t.estimated_hours}h)
              </span>
            ))}
          </div>
        </div>
      )}

      {/* VIEW 1: Weekly Timeline View */}
      {viewMode === 'timeline' && (
        <div className="space-y-4">
          {Array.from({ length: availableWeeks }, (_, i) => i + 1).map((weekNum) => {
            const tasksInWeek = roadmap?.scheduled_by_week[weekNum] || [];
            const weekHours = tasksInWeek.reduce((sum, t) => sum + t.estimated_hours, 0);

            return (
              <div key={weekNum} className="space-y-2">
                <div className="flex items-center justify-between text-xs px-1">
                  <div className="flex items-center gap-2 font-bold text-slate-200">
                    <Calendar className="w-3.5 h-3.5 text-brand-400" />
                    <span>Week {weekNum}</span>
                  </div>
                  <span className="text-slate-400 font-mono text-[11px]">
                    {weekHours} / {hoursPerWeek} hrs allocated
                  </span>
                </div>

                {tasksInWeek.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {tasksInWeek.map((task) => (
                      <Card key={task.id} className="p-4 bg-navy-900 border-slate-800 space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-semibold text-white">{task.skill_name}</h4>
                              <Badge variant="slate" className="text-[10px]">{task.category}</Badge>
                            </div>
                            <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
                              <span>Effort: <strong className="text-slate-200 font-mono">{task.estimated_hours}h</strong></span>
                              <span>Gap: <strong className="text-rose-400 font-mono">{(task.gap_size * 100).toFixed(0)}%</strong></span>
                              <span>Priority: <strong className="text-amber-300 font-mono">{task.priority_score.toFixed(2)}</strong></span>
                            </div>
                          </div>

                          {/* Status Dropdown */}
                          <select
                            value={task.status}
                            onChange={(e) => handleUpdateTaskStatus(task.id, e.target.value)}
                            className={`text-[11px] font-semibold rounded-lg px-2.5 py-1 border focus:outline-none ${
                              task.status === 'COMPLETED'
                                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                                : task.status === 'IN_PROGRESS'
                                ? 'bg-cyan-950/80 text-cyan-300 border-cyan-500/40'
                                : 'bg-navy-950 text-slate-300 border-slate-700'
                            }`}
                          >
                            <option value="TO_LEARN">To Learn</option>
                            <option value="IN_PROGRESS">In Progress</option>
                            <option value="COMPLETED">Completed</option>
                          </select>
                        </div>

                        {/* Prerequisites badge */}
                        {task.prerequisites.length > 0 && (
                          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                            <span>Prerequisites met:</span>
                            <span className="text-emerald-400 font-medium">
                              {task.prerequisites.join(', ')}
                            </span>
                          </div>
                        )}

                        {/* Verified Learning Resource Link */}
                        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                          {task.learning_resource ? (
                            <a
                              href={task.learning_resource.url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 text-[11px] font-medium transition-colors"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span className="truncate max-w-xs">{task.learning_resource.title}</span>
                            </a>
                          ) : (
                            <span className="text-slate-500 text-[11px]">No verified learning resource added yet.</span>
                          )}

                          {/* Hours Logger */}
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                            <span>Actual:</span>
                            <input
                              type="number"
                              min="0"
                              max="40"
                              value={task.actual_hours || ''}
                              placeholder="0"
                              onChange={(e) => handleLogHours(task.id, parseFloat(e.target.value) || 0)}
                              className="w-12 bg-navy-950 border border-slate-700 rounded px-1.5 py-0.5 text-right font-mono text-white text-[11px]"
                            />
                            <span>h</span>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 rounded-xl border border-dashed border-slate-800 text-center text-xs text-slate-500">
                    No learning tasks scheduled for Week {weekNum} (Capacity reserved for study & revision).
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW 2: Kanban Board View */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Column: To Learn */}
          <div className="space-y-3">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-navy-900 border border-slate-800 text-xs font-bold text-slate-300">
              <span>To Learn</span>
              <Badge variant="slate">
                {roadmap?.tasks.filter((t) => t.status === 'TO_LEARN' && t.week_number > 0).length}
              </Badge>
            </div>
            <div className="space-y-3">
              {roadmap?.tasks
                .filter((t) => t.status === 'TO_LEARN' && t.week_number > 0)
                .map((task) => (
                  <Card key={task.id} className="p-3 bg-navy-900/90 border-slate-800 space-y-2">
                    <div className="flex items-start justify-between">
                      <span className="font-semibold text-white text-xs">{task.skill_name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">Week {task.week_number}</span>
                    </div>
                    <div className="text-[11px] text-slate-400">Estimated Effort: {task.estimated_hours} hrs</div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full text-xs py-1"
                      onClick={() => handleUpdateTaskStatus(task.id, 'IN_PROGRESS')}
                    >
                      <span>Start Learning</span>
                    </Button>
                  </Card>
                ))}
            </div>
          </div>

          {/* Column: In Progress */}
          <div className="space-y-3">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-navy-900 border border-cyan-500/30 text-xs font-bold text-cyan-300">
              <span>In Progress</span>
              <Badge variant="cyan">
                {roadmap?.tasks.filter((t) => t.status === 'IN_PROGRESS').length}
              </Badge>
            </div>
            <div className="space-y-3">
              {roadmap?.tasks
                .filter((t) => t.status === 'IN_PROGRESS')
                .map((task) => (
                  <Card key={task.id} className="p-3 bg-navy-900/90 border-cyan-500/30 space-y-2">
                    <div className="flex items-start justify-between">
                      <span className="font-semibold text-white text-xs">{task.skill_name}</span>
                      <span className="text-[10px] text-cyan-400 font-mono">Week {task.week_number}</span>
                    </div>
                    <div className="text-[11px] text-slate-400">Estimated: {task.estimated_hours} hrs</div>
                    <Button
                      size="sm"
                      variant="primary"
                      className="w-full text-xs py-1"
                      onClick={() => handleUpdateTaskStatus(task.id, 'COMPLETED')}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                      <span>Mark Complete</span>
                    </Button>
                  </Card>
                ))}
            </div>
          </div>

          {/* Column: Completed */}
          <div className="space-y-3">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-navy-900 border border-emerald-500/30 text-xs font-bold text-emerald-300">
              <span>Completed</span>
              <Badge variant="success">
                {roadmap?.tasks.filter((t) => t.status === 'COMPLETED').length}
              </Badge>
            </div>
            <div className="space-y-3">
              {roadmap?.tasks
                .filter((t) => t.status === 'COMPLETED')
                .map((task) => (
                  <Card key={task.id} className="p-3 bg-navy-900/90 border-emerald-500/30 space-y-2">
                    <div className="flex items-start justify-between">
                      <span className="font-semibold text-emerald-200 text-xs">{task.skill_name}</span>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div className="text-[11px] text-slate-400">Actual Logged: {task.actual_hours || task.estimated_hours} hrs</div>
                    <button
                      onClick={() => handleUpdateTaskStatus(task.id, 'TO_LEARN')}
                      className="text-[10px] text-slate-400 hover:text-white underline"
                    >
                      Reopen task
                    </button>
                  </Card>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: Skill Dependency View */}
      {viewMode === 'dependencies' && (
        <Card className="p-6 bg-navy-900 border-slate-800 space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-white">Skill Prerequisite Dependency Graph</h3>
            <p className="text-xs text-slate-400">
              Verified Directed Acyclic Graph (DAG) ensuring foundational concepts precede applied frameworks.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {roadmap?.tasks.map((task) => (
              <div key={task.id} className="p-3 rounded-xl bg-navy-950 border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between font-semibold text-white">
                  <span>{task.skill_name}</span>
                  <Badge variant={task.week_number > 0 ? 'brand' : 'danger'}>
                    {task.week_number > 0 ? `Week ${task.week_number}` : 'Unscheduled'}
                  </Badge>
                </div>
                <div className="text-[11px] text-slate-400">
                  Prerequisites:{' '}
                  {task.prerequisites.length > 0 ? (
                    <span className="text-cyan-400 font-mono font-medium">{task.prerequisites.join(' → ')}</span>
                  ) : (
                    <span className="text-emerald-400">None (Foundational / Direct Entry)</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};
