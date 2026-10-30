import React, { useEffect, useState } from 'react';
import {
  FlaskConical,
  Play,
  Download,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
  Cpu,
  ArrowRight,
  TrendingUp,
  FileText,
  Search,
  Filter,
  Check,
  X
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Cell
} from 'recharts';
import { api } from '../api';
import { Card, Button, Badge } from '../components/UIComponents';
import { EvaluationComparison } from '../types';

export const EvaluationLab: React.FC = () => {
  const [datasets, setDatasets] = useState<any[]>([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState<number>(1);
  const [threshold, setThreshold] = useState<number>(0.45);
  const [topK, setTopK] = useState<number>(3);
  const [testOnly, setTestOnly] = useState<boolean>(true);

  const [evaluation, setEvaluation] = useState<EvaluationComparison | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [running, setRunning] = useState<boolean>(false);
  const [searchSample, setSearchSample] = useState<string>('');
  const [sampleFilter, setSampleFilter] = useState<'ALL' | 'AGREE' | 'DISAGREE' | 'SEMANTIC_CORRECT'>('ALL');

  useEffect(() => {
    loadDatasets();
  }, []);

  const loadDatasets = async () => {
    try {
      setLoading(true);
      const list = await api.getEvaluationDatasets();
      setDatasets(list);
      if (list.length > 0) {
        setSelectedDatasetId(list[0].id);
        await runLiveExperiment(list[0].id, threshold, topK, testOnly);
      }
    } catch (err) {
      console.error('Failed to load evaluation datasets:', err);
    } finally {
      setLoading(false);
    }
  };

  const runLiveExperiment = async (dsId: number, thresh: number, k: number, testPartition: boolean) => {
    try {
      setRunning(true);
      const res = await api.runEvaluation({
        dataset_id: dsId,
        threshold: thresh,
        top_k: k,
        test_partition_only: testPartition
      });
      setEvaluation(res);
    } catch (err: any) {
      alert(`Evaluation experiment failed: ${err.message}`);
    } finally {
      setRunning(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3">
        <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-400">Loading benchmark datasets and model checkpoints...</p>
      </div>
    );
  }

  // Metric Comparison Chart Data
  const metricsChartData = evaluation ? [
    {
      metric: 'Top-1 Accuracy',
      Keyword: Math.round(evaluation.keyword_baseline.top_1_accuracy * 100),
      Semantic: Math.round(evaluation.semantic_model.top_1_accuracy * 100)
    },
    {
      metric: `Top-${topK} Accuracy`,
      Keyword: Math.round(evaluation.keyword_baseline.top_k_accuracy * 100),
      Semantic: Math.round(evaluation.semantic_model.top_k_accuracy * 100)
    },
    {
      metric: 'Precision',
      Keyword: Math.round(evaluation.keyword_baseline.precision * 100),
      Semantic: Math.round(evaluation.semantic_model.precision * 100)
    },
    {
      metric: 'Recall',
      Keyword: Math.round(evaluation.keyword_baseline.recall * 100),
      Semantic: Math.round(evaluation.semantic_model.recall * 100)
    },
    {
      metric: 'F1 Score',
      Keyword: Math.round(evaluation.keyword_baseline.f1_score * 100),
      Semantic: Math.round(evaluation.semantic_model.f1_score * 100)
    }
  ] : [];

  const filteredSamples = evaluation?.side_by_side_samples.filter((s) => {
    const matchesSearch =
      s.curriculum_statement.toLowerCase().includes(searchSample.toLowerCase()) ||
      s.ground_truth_skill_name.toLowerCase().includes(searchSample.toLowerCase());

    if (!matchesSearch) return false;

    if (sampleFilter === 'AGREE') return s.methods_agree;
    if (sampleFilter === 'DISAGREE') return !s.methods_agree;
    if (sampleFilter === 'SEMANTIC_CORRECT') return s.semantic_is_correct && !s.keyword_is_correct;
    return true;
  }) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">AI Evaluation Lab</h1>
            <Badge variant="cyan">Core Innovation</Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Empirical scientific benchmark comparing Sentence Transformer dense embeddings against lexical token baseline on held-out test examples.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {evaluation && (
            <a
              href={api.getEvaluationExportUrl(evaluation.run_id)}
              download
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-navy-850 hover:bg-slate-800 text-slate-200 text-xs font-medium transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>Export CSV Report</span>
            </a>
          )}
        </div>
      </div>

      {/* Experiment Controls Bar */}
      <Card className="p-4 bg-navy-900 border-slate-800">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs items-end">
          {/* Dataset selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Benchmark Dataset:</label>
            <select
              value={selectedDatasetId}
              onChange={(e) => setSelectedDatasetId(Number(e.target.value))}
              className="w-full bg-navy-950 border border-slate-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              {datasets.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.test_examples} Test items)
                </option>
              ))}
            </select>
          </div>

          {/* Threshold slider */}
          <div>
            <div className="flex justify-between font-semibold text-slate-300 mb-1">
              <span>Cosine Threshold:</span>
              <span className="font-mono text-cyan-400 font-bold">{threshold.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.30"
              max="0.80"
              step="0.05"
              value={threshold}
              onChange={(e) => setThreshold(parseFloat(e.target.value))}
              className="w-full accent-cyan-400"
            />
          </div>

          {/* Top-K Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Top-k Candidate Window:</label>
            <select
              value={topK}
              onChange={(e) => setTopK(Number(e.target.value))}
              className="w-full bg-navy-950 border border-slate-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="1">Top-1 Only</option>
              <option value="3">Top-3 Candidates</option>
              <option value="5">Top-5 Candidates</option>
            </select>
          </div>

          {/* Run button */}
          <div>
            <Button
              variant="primary"
              size="sm"
              className="w-full shadow-lg shadow-brand-600/20"
              onClick={() => runLiveExperiment(selectedDatasetId, threshold, topK, testOnly)}
              disabled={running}
            >
              <Play className={`w-3.5 h-3.5 ${running ? 'animate-spin' : ''}`} />
              <span>{running ? 'Running Live Evaluation...' : 'Execute Evaluation Run'}</span>
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-800 text-xs text-slate-400">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={testOnly}
              onChange={(e) => setTestOnly(e.target.checked)}
              className="rounded bg-navy-950 border-slate-700 text-brand-600 focus:ring-brand-500"
            />
            <span>Evaluate on held-out test partition only (prevents data leakage)</span>
          </label>

          {evaluation && (
            <span className="text-[11px] font-mono text-slate-300">
              Run ID: #{evaluation.run_id} | Sample Count: {evaluation.evaluated_count} items
            </span>
          )}
        </div>
      </Card>

      {/* Side-by-Side Metric Summary Table */}
      {evaluation && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Metrics Comparison Chart */}
          <Card className="lg:col-span-7 p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-white">Live Metric Benchmark Comparison (%)</h3>
                <p className="text-xs text-slate-400">Measured across {evaluation.evaluated_count} test examples</p>
              </div>
              <Badge variant="cyan">Real Execution Output</Badge>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metricsChartData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                  <XAxis dataKey="metric" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                    formatter={(val: any) => [`${val}%`]}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Bar dataKey="Keyword" name="Method A: Keyword Baseline" fill="#64748b" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Semantic" name="Method B: Semantic Dense Embedding" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Metric Details & Latency Card */}
          <Card className="lg:col-span-5 p-5 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white mb-1">Empirical Scorecard</h3>
              <p className="text-xs text-slate-400 mb-4">Micro-averaged Precision, Recall, and Accuracy</p>

              <div className="space-y-3 text-xs">
                {/* Metric Rows */}
                <div className="p-2.5 rounded-lg bg-navy-950 border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-300">Top-1 Accuracy:</span>
                  <div className="flex items-center gap-3 font-mono font-bold">
                    <span className="text-slate-400">{(evaluation.keyword_baseline.top_1_accuracy * 100).toFixed(1)}%</span>
                    <span>→</span>
                    <span className="text-cyan-400">{(evaluation.semantic_model.top_1_accuracy * 100).toFixed(1)}%</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-navy-950 border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-300">Top-{topK} Accuracy:</span>
                  <div className="flex items-center gap-3 font-mono font-bold">
                    <span className="text-slate-400">{(evaluation.keyword_baseline.top_k_accuracy * 100).toFixed(1)}%</span>
                    <span>→</span>
                    <span className="text-cyan-400">{(evaluation.semantic_model.top_k_accuracy * 100).toFixed(1)}%</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-navy-950 border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-300">Precision (at {threshold.toFixed(2)}):</span>
                  <div className="flex items-center gap-3 font-mono font-bold">
                    <span className="text-slate-400">{(evaluation.keyword_baseline.precision * 100).toFixed(1)}%</span>
                    <span>→</span>
                    <span className="text-cyan-400">{(evaluation.semantic_model.precision * 100).toFixed(1)}%</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-navy-950 border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-300">F1 Score:</span>
                  <div className="flex items-center gap-3 font-mono font-bold">
                    <span className="text-slate-400">{evaluation.keyword_baseline.f1_score.toFixed(3)}</span>
                    <span>→</span>
                    <span className="text-cyan-400">{evaluation.semantic_model.f1_score.toFixed(3)}</span>
                  </div>
                </div>

                {/* Latency Comparison */}
                <div className="p-2.5 rounded-lg bg-navy-950 border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-300">Median Inference Latency:</span>
                  <div className="flex items-center gap-3 font-mono font-bold text-xs">
                    <span className="text-slate-400">{evaluation.keyword_baseline.median_latency_ms} ms</span>
                    <span>vs</span>
                    <span className="text-indigo-300">{evaluation.semantic_model.median_latency_ms} ms</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-400">
              <span className="font-semibold text-slate-300 block mb-0.5">Scientific Observation:</span>
              Semantic dense embedding demonstrates superior recall on paraphrased outcome sentences where lexical overlap is minimal (e.g. relational normalization matching Database Design).
            </div>
          </Card>
        </div>
      )}

      {/* Example-Level Side-by-Side Inspection Table */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-white">Item-Level Test Case Inspection</h3>
            <p className="text-xs text-slate-400">
              Granular inspection of individual curriculum outcomes, ground truth, and method predictions.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative w-48 sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Filter statements..."
                value={searchSample}
                onChange={(e) => setSearchSample(e.target.value)}
                className="w-full bg-navy-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>

            <select
              value={sampleFilter}
              onChange={(e: any) => setSampleFilter(e.target.value)}
              className="text-xs bg-navy-900 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-300 focus:outline-none"
            >
              <option value="ALL">All Test Items</option>
              <option value="SEMANTIC_CORRECT">Semantic Won (Keyword Missed)</option>
              <option value="DISAGREE">Methods Disagree</option>
              <option value="AGREE">Methods Agree</option>
            </select>
          </div>
        </div>

        <div className="border border-slate-800 rounded-xl overflow-hidden bg-navy-900">
          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-navy-950 sticky top-0 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-2.5 px-3 font-semibold">Curriculum Syllabus Statement</th>
                  <th className="py-2.5 px-3 font-semibold">Ground Truth Skill</th>
                  <th className="py-2.5 px-3 font-semibold">Method A (Keyword)</th>
                  <th className="py-2.5 px-3 font-semibold">Method B (Semantic)</th>
                  <th className="py-2.5 px-3 font-semibold text-center">Agreement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-navy-900/40">
                {filteredSamples.map((sample, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-2.5 px-3 text-slate-200 max-w-sm">
                      <span className="line-clamp-2">{sample.curriculum_statement}</span>
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className="font-semibold text-emerald-400">{sample.ground_truth_skill_name}</span>
                      <span className="text-[10px] text-slate-400 block">{sample.role}</span>
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      {sample.keyword_prediction ? (
                        <div className="flex items-center gap-1.5">
                          {sample.keyword_is_correct ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          ) : (
                            <X className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                          )}
                          <span className={sample.keyword_is_correct ? 'text-slate-200' : 'text-slate-400'}>
                            {sample.keyword_prediction.canonical_name}
                          </span>
                          <span className="font-mono text-[10px] text-slate-400">
                            ({sample.keyword_prediction.similarity_score.toFixed(2)})
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-500">None</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      {sample.semantic_prediction ? (
                        <div className="flex items-center gap-1.5">
                          {sample.semantic_is_correct ? (
                            <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                          ) : (
                            <X className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                          )}
                          <span className={sample.semantic_is_correct ? 'text-white font-medium' : 'text-slate-400'}>
                            {sample.semantic_prediction.canonical_name}
                          </span>
                          <span className="font-mono text-[10px] text-cyan-400 font-bold">
                            ({sample.semantic_prediction.similarity_score.toFixed(2)})
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-500">None</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {sample.methods_agree ? (
                        <Badge variant="success" className="py-0 text-[10px]">Agreed</Badge>
                      ) : (
                        <Badge variant="warning" className="py-0 text-[10px]">Diverged</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Error Diagnosis Report */}
      {evaluation?.error_inspection && evaluation.error_inspection.length > 0 && (
        <Card className="p-5 bg-navy-900 border-slate-800 space-y-3">
          <div className="flex items-center gap-2 text-rose-400 font-semibold text-sm">
            <AlertTriangle className="w-4 h-4" />
            <span>Error Diagnosis & Misalignment Analysis ({evaluation.error_inspection.length} cases)</span>
          </div>
          <p className="text-xs text-slate-400">
            Cases where one or both methods differed from expert ground-truth annotations:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {evaluation.error_inspection.slice(0, 4).map((err, i) => (
              <div key={i} className="p-3 rounded-lg bg-navy-950 border border-slate-800 space-y-1">
                <span className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider block">
                  {err.error_type}
                </span>
                <p className="text-slate-300 italic text-[11px]">"{err.statement}"</p>
                <div className="flex items-center justify-between text-[11px] pt-1 text-slate-400">
                  <span>Target: <strong className="text-emerald-400">{err.target_skill}</strong></span>
                  <span>Keyword: <strong className="text-slate-300">{err.keyword_predicted}</strong></span>
                  <span>Semantic: <strong className="text-cyan-400">{err.semantic_predicted}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};
