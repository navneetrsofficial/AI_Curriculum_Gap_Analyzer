import React from 'react';
import { NavLink } from 'react-router-dom';
import clsx from 'clsx';
import {
  LayoutDashboard,
  BookOpen,
  Briefcase,
  CheckCircle2,
  PieChart,
  MapPin,
  FlaskConical,
  Settings,
  Home,
  ChevronRight
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const navItems = [
    { to: '/', label: 'Overview', icon: Home, end: true },
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/curricula', label: 'My Curricula', icon: BookOpen },
    { to: '/roles', label: 'Industry Roles', icon: Briefcase },
    { to: '/assessment', label: 'Skill Assessment', icon: CheckCircle2 },
    { to: '/analysis', label: 'Gap Analysis', icon: PieChart },
    { to: '/roadmap', label: 'Learning Roadmap', icon: MapPin },
    { to: '/evaluation', label: 'Evaluation Lab', icon: FlaskConical, highlight: true },
    { to: '/settings', label: 'Settings & Formulas', icon: Settings }
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={clsx(
          'fixed md:sticky top-16 z-40 h-[calc(100vh-4rem)] w-64 border-r border-slate-800 bg-navy-950 flex flex-col justify-between transition-transform duration-200 ease-in-out md:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="p-4 space-y-1 overflow-y-auto">
          <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Platform Navigation
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={onClose}
                className={({ isActive }) =>
                  clsx(
                    'group flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                    isActive
                      ? 'bg-brand-600/15 text-brand-300 border border-brand-500/30 shadow-sm shadow-brand-500/10'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/60'
                  )
                }
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={clsx(
                      'w-4 h-4 transition-colors',
                      item.highlight ? 'text-cyan-400' : 'text-slate-400 group-hover:text-brand-400'
                    )}
                  />
                  <span>{item.label}</span>
                </div>

                {item.highlight && (
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                    AI Core
                  </span>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* Faculty presentation footer card */}
        <div className="p-4 border-t border-slate-800/80 bg-navy-900/40">
          <div className="p-3 rounded-xl bg-gradient-to-br from-brand-950/80 to-navy-900 border border-brand-500/20">
            <div className="flex items-center justify-between text-xs text-brand-300 font-semibold mb-1">
              <span>Smart India Hackathon</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-brand-500/20">B.Tech CSE</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Explainable NLP Skill Mapping & Deterministic Planning Prototype.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};
