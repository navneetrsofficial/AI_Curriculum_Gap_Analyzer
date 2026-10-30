import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, ArrowRight, CheckCircle2, ShieldCheck, Database, Layers, Eye } from 'lucide-react';
import { api } from '../api';
import { Card, Button, Badge, Modal } from '../components/UIComponents';
import { RoleProfile } from '../types';

export const RolesPage: React.FC = () => {
  const navigate = useNavigate();
  const [roles, setRoles] = useState<RoleProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoleForModal, setSelectedRoleForModal] = useState<RoleProfile | null>(null);

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    try {
      setLoading(true);
      const data = await api.getRoles();
      setRoles(data);
    } catch (err) {
      console.error('Failed to load roles:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRole = (roleId: string) => {
    // Store in localStorage for persistence across pages
    localStorage.setItem('selectedRoleId', roleId);
    navigate('/analysis');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-400">Loading industry role profiles...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Industry Career Profiles</h1>
          <Badge variant="cyan">Standard Benchmarks</Badge>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Select from four canonical career profiles containing curated skills, normalized demand weights, and required proficiencies.
        </p>
      </div>

      {/* 4 Role Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {roles.map((r) => (
          <Card key={r.id} className="p-6 bg-navy-900 border-slate-800 hover:border-brand-500/40 transition-all flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">{r.role_name}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{r.description}</p>
                </div>
                <div className="p-2.5 rounded-xl bg-brand-500/10 text-brand-400 shrink-0 ml-3">
                  <Briefcase className="w-5 h-5" />
                </div>
              </div>

              {/* Metadata Badges */}
              <div className="flex flex-wrap gap-2 text-[11px]">
                <Badge variant="slate">
                  {r.skill_count} Required Skills
                </Badge>
                <Badge variant="cyan">
                  {r.source_type} ({r.source_date})
                </Badge>
                <Badge variant="brand">
                  {r.evidence_status}
                </Badge>
              </div>

              {/* Sample skills preview */}
              <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Top Profile Skills & Demand Weight:
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {r.skills.slice(0, 6).map((s) => (
                    <div key={s.skill_id} className="flex items-center justify-between p-2 rounded-lg bg-navy-950/60 border border-slate-800">
                      <span className="text-slate-300 truncate">{s.skill_name}</span>
                      <span className="font-mono text-cyan-400 font-bold ml-1">{s.demand_weight.toFixed(1)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-5 mt-4 border-t border-slate-800">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => setSelectedRoleForModal(r)}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>View Full Skill Breakdown</span>
              </Button>
              <Button
                variant="primary"
                size="sm"
                className="flex-1 shadow-md shadow-brand-600/20"
                onClick={() => handleSelectRole(r.id)}
              >
                <span>Select & Analyze</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Role Skill Detail Modal */}
      {selectedRoleForModal && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedRoleForModal(null)}
          title={`${selectedRoleForModal.role_name} — Complete Skill Profile`}
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 rounded-lg bg-navy-950 border border-slate-800 text-slate-300 leading-relaxed">
              <span className="font-semibold text-white block mb-0.5">Profile Methodology:</span>
              Demand weights are normalized on a scale of 1.0 to 5.0 reflecting curated benchmark market importance. Required level reflects the expected baseline proficiency on an interval from 0.0 to 1.0.
            </div>

            <div className="overflow-x-auto max-h-96 border border-slate-800 rounded-xl">
              <table className="w-full text-left border-collapse">
                <thead className="bg-navy-950 sticky top-0 border-b border-slate-800 text-slate-400">
                  <tr>
                    <th className="py-2.5 px-3 font-semibold">Skill</th>
                    <th className="py-2.5 px-3 font-semibold">Domain Category</th>
                    <th className="py-2.5 px-3 font-semibold">Demand Weight</th>
                    <th className="py-2.5 px-3 font-semibold">Req. Level</th>
                    <th className="py-2.5 px-3 font-semibold">Est. Hours</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-navy-900/50">
                  {selectedRoleForModal.skills.map((s) => (
                    <tr key={s.skill_id} className="hover:bg-slate-800/40">
                      <td className="py-2.5 px-3 font-medium text-white">{s.skill_name}</td>
                      <td className="py-2.5 px-3 text-slate-300">{s.category}</td>
                      <td className="py-2.5 px-3 font-mono text-cyan-400 font-bold">{s.demand_weight.toFixed(1)} / 5.0</td>
                      <td className="py-2.5 px-3 font-mono text-indigo-400 font-bold">{Math.round(s.required_level * 100)}%</td>
                      <td className="py-2.5 px-3 text-slate-300">{s.estimated_hours} hrs</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <Button variant="ghost" onClick={() => setSelectedRoleForModal(null)}>Close</Button>
              <Button
                variant="primary"
                onClick={() => {
                  handleSelectRole(selectedRoleForModal.id);
                  setSelectedRoleForModal(null);
                }}
              >
                Select This Role
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
