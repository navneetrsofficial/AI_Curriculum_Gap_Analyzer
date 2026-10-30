import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Compass,
  ArrowRight,
  BookOpen,
  PieChart,
  CheckCircle2,
  Calendar,
  Layers,
  FlaskConical,
  ShieldAlert,
  Code2,
  Cpu,
  GraduationCap
} from 'lucide-react';
import { Button, Card, Badge } from '../components/UIComponents';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  const featureCards = [
    {
      title: 'Intelligent Curriculum Mapping',
      icon: BookOpen,
      desc: 'Matches university course outcomes and syllabus topics to canonical industry skills using Sentence Transformers and lexical baselines.',
      badge: 'NLP Engine'
    },
    {
      title: 'Personalized Skill Gap Analysis',
      icon: PieChart,
      desc: 'Rigorously compares curriculum evidence, Bloom’s taxonomy depth, student self-assessment, and target role demand weights.',
      badge: 'Mathematical Model'
    },
    {
      title: 'Explainable AI Results',
      icon: Code2,
      desc: 'Inspect exact source outcome statements, matched canonical skills, cosine similarity scores, lexical overlap, and reviewer decisions.',
      badge: 'Transparency'
    },
    {
      title: 'Adaptive Learning Roadmap',
      icon: Calendar,
      desc: 'Generates deterministic, prerequisite-aware weekly learning schedules based on available study hours without hallucinated timelines.',
      badge: 'DAG Planner'
    },
    {
      title: 'Multi-Institution Support',
      icon: Layers,
      desc: 'Maintain flexible curriculum hierarchies across institutions, degree programmes, semesters, courses, and syllabus units.',
      badge: 'Scalable Data'
    },
    {
      title: 'Measurable AI Evaluation Lab',
      icon: FlaskConical,
      desc: 'Demonstrates authentic scientific metrics comparing the semantic embedding model with a keyword baseline on labelled test examples.',
      badge: 'Core Innovation'
    }
  ];

  const roles = [
    {
      id: 'frontend-dev',
      title: 'Frontend Developer',
      skills: ['HTML5/CSS3', 'Modern JS', 'TypeScript', 'React.js', 'Web Security'],
      desc: 'Client-side reactive interfaces, responsive styling, and modern web application development.'
    },
    {
      id: 'backend-dev',
      title: 'Backend Developer',
      skills: ['Python Core', 'FastAPI/REST', 'SQL & RDBMS', 'Docker', 'Testing & QA'],
      desc: 'Server-side API architectures, transactional database normalization, and containerization.'
    },
    {
      id: 'fullstack-dev',
      title: 'Full-Stack Developer',
      skills: ['React.js', 'FastAPI', 'PostgreSQL', 'TypeScript', 'CI/CD Pipelines'],
      desc: 'End-to-end engineering bridging client web applications with scalable server backends.'
    },
    {
      id: 'data-ml-dev',
      title: 'Data & ML Developer',
      skills: ['Python Data Stack', 'Pandas & EDA', 'Scikit-Learn', 'Deep Learning', 'Statistics'],
      desc: 'Exploratory data analysis, supervised predictive modeling, and machine learning validation.'
    }
  ];

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative pt-8 pb-12 overflow-hidden text-center md:text-left">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Column: Headline & CTAs */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-xs font-semibold">
                <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                <span>Smart India Hackathon 2024–2025 Innovation Project</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
                Bridge the Gap Between Your Curriculum and Your Career.
              </h1>

              <p className="text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed">
                Understand what your academic syllabus covers, discover the practical skills your target industry role demands, and build a personalized learning roadmap using explainable AI.
              </p>

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-2">
                <Button
                  size="lg"
                  variant="primary"
                  onClick={() => navigate('/analysis')}
                  className="shadow-xl shadow-brand-600/25"
                >
                  <Compass className="w-5 h-5" />
                  <span>Analyze My Skills</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>

                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => navigate('/evaluation')}
                >
                  <FlaskConical className="w-5 h-5 text-cyan-400" />
                  <span>Explore Evaluation Lab</span>
                </Button>
              </div>

              {/* Distinguishing Core Principles */}
              <div className="pt-4 grid grid-cols-3 gap-3 border-t border-slate-800/80 text-xs text-slate-400 text-left">
                <div>
                  <span className="font-semibold text-slate-200 block mb-0.5">1. Curriculum Coverage</span>
                  What the academic syllabus appears to teach.
                </div>
                <div>
                  <span className="font-semibold text-slate-200 block mb-0.5">2. Self-Assessment</span>
                  How confidently you can build with the skill.
                </div>
                <div>
                  <span className="font-semibold text-slate-200 block mb-0.5">3. Industry Demand</span>
                  What benchmark career roles actually require.
                </div>
              </div>
            </div>

            {/* Right Column: Hero Visual Diagram */}
            <div className="lg:col-span-5">
              <div className="relative p-6 rounded-2xl bg-gradient-to-b from-navy-900 to-navy-950 border border-slate-800 shadow-2xl">
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Workflow Architecture
                  </span>
                  <Badge variant="cyan">Explainable Engine</Badge>
                </div>

                {/* SVG Visual Flow */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-navy-850/80 border border-slate-700/60">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                      <GraduationCap className="w-4 h-4" />
                    </div>
                    <div className="text-xs">
                      <div className="font-semibold text-slate-100">1. Academic Course Outcomes</div>
                      <div className="text-slate-400 text-[11px]">Syllabus units, Bloom's depth & outcome statements</div>
                    </div>
                  </div>

                  <div className="flex justify-center">
                    <div className="w-0.5 h-4 bg-gradient-to-b from-indigo-500 to-cyan-500" />
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-xl bg-navy-850/80 border border-cyan-500/40 shadow-sm shadow-cyan-500/10">
                    <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                      <Cpu className="w-4 h-4" />
                    </div>
                    <div className="text-xs">
                      <div className="font-semibold text-cyan-300">2. AI Skill Mapping Engine</div>
                      <div className="text-slate-400 text-[11px]">Dense Sentence Transformers vs Lexical Baseline</div>
                    </div>
                  </div>

                  <div className="flex justify-center">
                    <div className="w-0.5 h-4 bg-gradient-to-b from-cyan-500 to-brand-500" />
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-xl bg-navy-850/80 border border-slate-700/60">
                    <div className="w-8 h-8 rounded-lg bg-brand-500/20 text-brand-400 flex items-center justify-center shrink-0">
                      <PieChart className="w-4 h-4" />
                    </div>
                    <div className="text-xs">
                      <div className="font-semibold text-slate-100">3. Industry Role Gap Analysis</div>
                      <div className="text-slate-400 text-[11px]">Weighted role demand vs current skill indicator</div>
                    </div>
                  </div>

                  <div className="flex justify-center">
                    <div className="w-0.5 h-4 bg-gradient-to-b from-brand-500 to-emerald-500" />
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div className="text-xs">
                      <div className="font-semibold text-emerald-300">4. Prerequisite-Aware Roadmap</div>
                      <div className="text-slate-400 text-[11px]">Deterministic weekly plan respecting study hour budget</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Feature Cards Grid */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <Badge variant="brand" className="mb-2">Key System Capabilities</Badge>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Designed for Real Curriculum Alignment
          </h2>
          <p className="text-sm text-slate-400 mt-2">
            Built as a genuine engineering solution with explainable algorithms, persistent database models, and measurable AI benchmarking.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featureCards.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <Card key={idx} className="flex flex-col justify-between hover:-translate-y-0.5 transition-transform">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-brand-500/10 text-brand-400 flex items-center justify-center">
                      <Icon className="w-5 h-5" />
                    </div>
                    <Badge variant="slate">{feat.badge}</Badge>
                  </div>
                  <h3 className="text-base font-semibold text-white mb-2">{feat.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{feat.desc}</p>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Supported Roles Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <Badge variant="cyan" className="mb-2">Career Alignment</Badge>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Supported Industry Roles
          </h2>
          <p className="text-sm text-slate-400 mt-2">
            Curated benchmark profiles with canonical skill taxonomies and documented demand weights.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {roles.map((r) => (
            <Card key={r.id} className="flex flex-col justify-between">
              <div>
                <h4 className="text-base font-semibold text-white mb-1.5">{r.title}</h4>
                <p className="text-xs text-slate-400 mb-4">{r.desc}</p>
                <div className="space-y-1.5">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Core Skills
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {r.skills.map((s, i) => (
                      <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-5 pt-4 border-t border-slate-800">
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate('/analysis')}
                >
                  Analyze for Role
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Project Limitations & Faculty Presentation Guidance */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="p-6 rounded-2xl bg-navy-900 border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 text-amber-400 text-sm font-semibold">
            <ShieldAlert className="w-5 h-5" />
            <span>Honest Evaluation & System Scope</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            This platform provides structured educational and career guidance based on documented curriculum outcomes and curated industry benchmarks. It does not claim to guarantee corporate placement or replace formal university examinations. Similarity scores represent vector alignments, not calibrated probabilities. All baseline evaluation metrics presented in the Evaluation Lab reflect real, measured executions over benchmark test partitions.
          </p>
        </div>
      </section>
    </div>
  );
};
