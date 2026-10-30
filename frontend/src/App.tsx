import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { LandingPage } from './pages/LandingPage';
import { Dashboard } from './pages/Dashboard';
import { CurriculaPage } from './pages/CurriculaPage';
import { RolesPage } from './pages/RolesPage';
import { AssessmentPage } from './pages/AssessmentPage';
import { GapAnalysisPage } from './pages/GapAnalysisPage';
import { RoadmapPage } from './pages/RoadmapPage';
import { EvaluationLab } from './pages/EvaluationLab';
import { SettingsPage } from './pages/SettingsPage';

export function App() {
  const [darkMode, setDarkMode] = useState<boolean>(true);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      document.body.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.add('light');
    }
  }, [darkMode]);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-navy-950 text-slate-100 flex flex-col font-sans transition-colors duration-200">
        {/* Navigation Bar */}
        <Navbar
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />

        {/* Body Layout: Sidebar + Main Content */}
        <div className="flex-1 flex max-w-full">
          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

          <main className="flex-1 min-w-0 p-4 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/curricula" element={<CurriculaPage />} />
              <Route path="/roles" element={<RolesPage />} />
              <Route path="/assessment" element={<AssessmentPage />} />
              <Route path="/analysis" element={<GapAnalysisPage />} />
              <Route path="/roadmap" element={<RoadmapPage />} />
              <Route path="/evaluation" element={<EvaluationLab />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Routes>
          </main>
        </div>

        {/* Global Footer */}
        <footer className="border-t border-slate-800/80 bg-navy-950 py-4 px-6 text-center text-xs text-slate-500">
          <p>
            AI Curriculum Gap Analyzer © 2024–2025 • Third-Year B.Tech CSE Innovation Project • JSPM University / Autonomous Curriculum
          </p>
        </footer>
      </div>
    </BrowserRouter>
  );
}

export default App;
