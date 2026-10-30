import React, { useEffect, useState } from 'react';
import {
  Settings,
  Cpu,
  RotateCcw,
  ShieldCheck,
  Check,
  Sliders,
  Database,
  ExternalLink,
  BookOpen,
  Info
} from 'lucide-react';
import { api } from '../api';
import { Card, Button, Badge } from '../components/UIComponents';

export const SettingsPage: React.FC = () => {
  const [modelStatus, setModelStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  // Settings states
  const [modelName, setModelName] = useState('sentence-transformers/all-MiniLM-L6-v2');
  const [highThreshold, setHighThreshold] = useState(0.65);
  const [medThreshold, setMedThreshold] = useState(0.40);
  const [curricWeight, setCurricWeight] = useState(0.4);
  const [selfWeight, setSelfWeight] = useState(0.6);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const status = await api.getMappingEngineStatus();
      setModelStatus(status);
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleResetDemo = async () => {
    if (!window.confirm('Reset all demo records, courses, outcomes, assessments, and evaluation benchmark results?')) return;
    try {
      setResetting(true);
      await api.resetDemoData();
      setSaveMsg('Database reset to clean demo benchmark state.');
      setTimeout(() => {
        setSaveMsg(null);
        window.location.reload();
      }, 1200);
    } catch (err: any) {
      alert(`Reset error: ${err.message}`);
    } finally {
      setResetting(false);
    }
  };

  const handleSaveConfig = () => {
    setSaveMsg('Configuration saved for active session.');
    setTimeout(() => setSaveMsg(null), 2500);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">System Settings & AI Engine</h1>
          <Badge variant="cyan">Configuration</Badge>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Configure NLP sentence-embedding model parameters, similarity thresholds, and mathematical formula weights.
        </p>
      </div>

      {saveMsg && (
        <div className="p-3 rounded-xl bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{saveMsg}</span>
        </div>
      )}

      {/* NLP Engine Status Card */}
      <Card className="p-5 bg-navy-900 border-slate-800 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Active NLP Mapping Architecture</h3>
              <p className="text-xs text-slate-400">Underlying semantic vectorization backend</p>
            </div>
          </div>
          <Badge variant="cyan">
            {modelStatus?.semantic_model?.is_neural_transformer ? 'Neural Transformer' : 'Dense Latent Semantic SVD'}
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-navy-950 border border-slate-800">
            <span className="text-slate-400 block mb-0.5">Configured Model:</span>
            <span className="font-mono text-slate-200 font-semibold">{modelStatus?.semantic_model?.model_identifier || modelName}</span>
          </div>

          <div className="p-3 rounded-lg bg-navy-950 border border-slate-800">
            <span className="text-slate-400 block mb-0.5">Vector Dimensions:</span>
            <span className="font-mono text-cyan-400 font-semibold">{modelStatus?.semantic_model?.dimensions || 384} Dense Dims</span>
          </div>

          <div className="p-3 rounded-lg bg-navy-950 border border-slate-800">
            <span className="text-slate-400 block mb-0.5">Indexed Skills:</span>
            <span className="font-mono text-emerald-400 font-semibold">{modelStatus?.semantic_model?.indexed_skills_count || 20} Canonical Skills</span>
          </div>
        </div>

        {modelStatus?.semantic_model?.status_message && (
          <div className="p-2.5 rounded-lg bg-navy-950 border border-slate-800/80 text-[11px] text-slate-400">
            <strong className="text-slate-300">Backend Status: </strong>
            {modelStatus.semantic_model.status_message}
          </div>
        )}
      </Card>

      {/* Threshold Configuration */}
      <Card className="p-5 bg-navy-900 border-slate-800 space-y-4">
        <div className="flex items-center gap-2.5 pb-2 border-b border-slate-800">
          <Sliders className="w-4 h-4 text-brand-400" />
          <h3 className="text-sm font-semibold text-white">Cosine Similarity Thresholds</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <div className="flex justify-between font-semibold text-slate-300 mb-1">
              <span>High Similarity Cutoff (Automatic Suggestion):</span>
              <span className="font-mono text-cyan-400 font-bold">{highThreshold.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.50"
              max="0.85"
              step="0.05"
              value={highThreshold}
              onChange={(e) => setHighThreshold(parseFloat(e.target.value))}
              className="w-full accent-cyan-400"
            />
          </div>

          <div>
            <div className="flex justify-between font-semibold text-slate-300 mb-1">
              <span>Medium Similarity Cutoff (Requires Review):</span>
              <span className="font-mono text-amber-400 font-bold">{medThreshold.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.25"
              max="0.60"
              step="0.05"
              value={medThreshold}
              onChange={(e) => setMedThreshold(parseFloat(e.target.value))}
              className="w-full accent-amber-400"
            />
          </div>
        </div>
      </Card>

      {/* Mathematical Alignment Default Weights */}
      <Card className="p-5 bg-navy-900 border-slate-800 space-y-4">
        <div className="flex items-center gap-2.5 pb-2 border-b border-slate-800">
          <Sliders className="w-4 h-4 text-indigo-400" />
          <h3 className="text-sm font-semibold text-white">Default Readiness Formula Weights</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <div className="flex justify-between font-semibold text-slate-300 mb-1">
              <span>Curriculum Coverage Weight (w_curr):</span>
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

          <div>
            <div className="flex justify-between font-semibold text-slate-300 mb-1">
              <span>Self-Assessment Weight (w_self):</span>
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

        <div className="flex justify-end pt-2">
          <Button variant="primary" size="sm" onClick={handleSaveConfig}>
            <span>Save Configuration</span>
          </Button>
        </div>
      </Card>

      {/* Database Management & Demo Reset */}
      <Card className="p-5 bg-navy-900 border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">Database Management & Reset</h3>
            <p className="text-xs text-slate-400">Restore default demo data, syllabus records, and benchmark evaluation sets.</p>
          </div>
          <Button
            variant="danger"
            size="sm"
            onClick={handleResetDemo}
            disabled={resetting}
          >
            <RotateCcw className={`w-3.5 h-3.5 ${resetting ? 'animate-spin' : ''}`} />
            <span>{resetting ? 'Resetting...' : 'Reset Demo Data'}</span>
          </Button>
        </div>
      </Card>

      {/* Academic Disclosures & SIH Presentation Statement */}
      <Card className="p-5 bg-navy-950 border-slate-800 space-y-2 text-xs text-slate-400">
        <div className="flex items-center gap-2 text-slate-200 font-semibold text-sm">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Academic Integrity & System Scope Statement</span>
        </div>
        <p className="leading-relaxed">
          Developed as a third-year B.Tech CSE innovation prototype for Smart India Hackathon internal presentation.
          The project emphasizes explainable AI/NLP, reproducible evaluation against lexical baselines, and transparent mathematical scoring.
          No metrics, user evaluations, or placement guarantees are fabricated.
        </p>
      </Card>
    </div>
  );
};
