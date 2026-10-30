import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, Calculator, ShieldCheck } from 'lucide-react';

export const FormulaExplainer: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-brand-500/30 rounded-xl bg-navy-900/80 overflow-hidden shadow-lg shadow-black/20 my-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-brand-950/40 via-navy-900 to-navy-900 hover:bg-slate-800/60 transition-colors text-left"
      >
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-brand-500/10 text-brand-400">
            <Calculator className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-100">
              How is this calculated? Mathematical Alignment Model & Assumptions
            </h4>
            <p className="text-xs text-slate-400">
              Transparent, explainable scoring keeping curriculum evidence, self-confidence, and industry weights separate.
            </p>
          </div>
        </div>
        <div className="text-slate-400">
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {isOpen && (
        <div className="p-5 border-t border-slate-800 space-y-4 text-xs md:text-sm text-slate-300 bg-navy-950/50">
          {/* Step 1 */}
          <div className="p-3 rounded-lg bg-navy-900 border border-slate-800">
            <span className="font-semibold text-brand-400 block mb-1">
              Step 1: Curriculum Coverage (c_curr)
            </span>
            <p className="text-xs text-slate-300 leading-relaxed">
              Derived strictly from accepted outcome-to-skill mappings weighted by Bloom's taxonomy depth.
              Unmapped skills receive 0.0. Conceptual topics receive 0.5; practical/creation outcomes receive up to 1.0. Duplicate outcomes are capped to avoid artificial inflation.
            </p>
          </div>

          {/* Step 2 */}
          <div className="p-3 rounded-lg bg-navy-900 border border-slate-800">
            <span className="font-semibold text-cyan-400 block mb-1">
              Step 2: Self-Assessed Competence (c_self)
            </span>
            <p className="text-xs text-slate-300 leading-relaxed">
              Reflects student-reported practical ability:
              <span className="font-mono text-slate-200 ml-1">None = 0.0</span>,
              <span className="font-mono text-slate-200 ml-1">Basic = 0.5</span>,
              <span className="font-mono text-slate-200 ml-1">Can Build Something = 1.0</span>.
              Explicitly distinguished from objective test scores.
            </p>
          </div>

          {/* Step 3 */}
          <div className="p-3 rounded-lg bg-navy-900 border border-slate-800">
            <span className="font-semibold text-amber-400 block mb-1">
              Step 3: Current Skill Indicator (cᵢ)
            </span>
            <div className="font-mono text-xs bg-navy-950 p-2 rounded border border-slate-800 text-amber-300 my-1">
              Current Skill Indicator = (0.4 × Curriculum Coverage) + (0.6 × Self-Assessment)
            </div>
            <p className="text-xs text-slate-400">
              Weights are configurable in settings. If self-assessment is missing, conservative fallback is applied without substituting arbitrary perfect marks.
            </p>
          </div>

          {/* Step 4 */}
          <div className="p-3 rounded-lg bg-navy-900 border border-slate-800">
            <span className="font-semibold text-emerald-400 block mb-1">
              Step 4: Role Alignment Score (%)
            </span>
            <div className="font-mono text-xs bg-navy-950 p-2 rounded border border-slate-800 text-emerald-300 my-1">
              Role Alignment (%) = 100 × [ Σ (Normalized Demand wᵢ × Indicator cᵢ × Bloom Depth bᵢ) / Σ wᵢ ]
            </div>
            <p className="text-xs text-slate-400">
              Measures degree of preparation for selected role requirements. Does not claim to guarantee employment or placement.
            </p>
          </div>

          {/* Step 5 */}
          <div className="p-3 rounded-lg bg-navy-900 border border-slate-800">
            <span className="font-semibold text-rose-400 block mb-1">
              Step 5: Skill Gap & Priority Score
            </span>
            <div className="font-mono text-xs bg-navy-950 p-2 rounded border border-slate-800 text-rose-300 my-1">
              Skill Gap = max(0, Required Proficiency − Current Skill Indicator)
              <br />
              Priority Score = Normalized Industry Demand × Skill Gap
            </div>
            <p className="text-xs text-slate-400">
              The roadmap planner schedules tasks in order of Priority Score while strictly enforcing prerequisite DAG constraints.
            </p>
          </div>

          <div className="flex items-center gap-2 pt-2 text-[11px] text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Fully transparent rule-based calculations — No LLM hallucination of scores or scheduling.</span>
          </div>
        </div>
      )}
    </div>
  );
};
