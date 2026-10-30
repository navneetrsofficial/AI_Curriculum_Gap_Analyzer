import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, Sun, Moon, RotateCcw, AlertCircle, Compass, Menu, X } from 'lucide-react';
import { api } from '../api';

interface NavbarProps {
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  onToggleSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ darkMode, setDarkMode, onToggleSidebar }) => {
  const [resetting, setResetting] = useState(false);
  const [resetMsg, setResetMsg] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleResetDemo = async () => {
    if (!window.confirm('Reset all curriculum records, mappings, and evaluations to clean demo state?')) return;
    try {
      setResetting(true);
      await api.resetDemoData();
      setResetMsg('Demo data reset successfully.');
      setTimeout(() => {
        setResetMsg(null);
        window.location.reload();
      }, 1000);
    } catch (err: any) {
      alert(`Reset failed: ${err.message}`);
    } finally {
      setResetting(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-navy-950/90 backdrop-blur-md">
      <div className="flex items-center justify-between h-16 px-4 md:px-6">
        {/* Brand */}
        <div className="flex items-center gap-3">
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="md:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              aria-label="Toggle navigation"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <Link to="/" className="flex items-center gap-3 group">
            {/* Custom SVG Logo: Curriculum + Neural Connection + Target */}
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 via-indigo-500 to-cyan-400 p-[1.5px] shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-navy-950 rounded-[10px] flex items-center justify-center">
                <svg className="w-5 h-5 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                  <circle cx="12" cy="9" r="2" fill="#6366f1" />
                  <path d="M12 11v3" />
                  <circle cx="12" cy="15" r="1.5" fill="#22d3ee" />
                </svg>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-100 text-sm md:text-base tracking-tight">
                  AI Curriculum Gap Analyzer
                </span>
                <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-brand-500/10 text-brand-400 border border-brand-500/20">
                  SIH Innovation
                </span>
              </div>
              <p className="hidden md:block text-[11px] text-slate-400 font-normal">
                Career-Aligned Skill Gap Analysis & Personalized Roadmap
              </p>
            </div>
          </Link>
        </div>

        {/* Status & Actions */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Demo Data Badge */}
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span>Demo Dataset Loaded</span>
          </div>

          {/* Reset Demo Button */}
          <button
            onClick={handleResetDemo}
            disabled={resetting}
            title="Reset demo data to initial state"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-700 bg-navy-850 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-medium transition-colors"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${resetting ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Reset Demo</span>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="p-2 rounded-lg border border-slate-800 bg-navy-850 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
            aria-label="Toggle theme"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-brand-400" />}
          </button>

          {/* Start Analysis CTA */}
          <button
            onClick={() => navigate('/analysis')}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-xs font-medium shadow-md shadow-brand-600/20 transition-all"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Analyze Skills</span>
          </button>
        </div>
      </div>
      {resetMsg && (
        <div className="bg-emerald-950/80 border-t border-emerald-500/30 text-emerald-300 text-xs py-1 px-4 text-center">
          {resetMsg}
        </div>
      )}
    </header>
  );
};
