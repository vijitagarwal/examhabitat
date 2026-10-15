import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSelectedExam } from '@/hooks/useSelectedExam';
import { ExamThemeProvider } from './ExamThemeProvider';
import { ExamOnboarding } from './ExamOnboarding';

import {
  LayoutDashboard,
  BookOpen,
  Trophy,
  AlertOctagon,
  Shield,
  Map,
  BarChart3,
  Zap,
  AlertTriangle,
  ListOrdered,
  User,
  Settings,
  Sparkles,
  Menu,
  X,
} from 'lucide-react';

// Export all section components from index or direct
import { Overview as OverviewSec } from './sections/Overview';
import { TopicTracker as TopicTrackerSec } from './sections/TopicTracker';
import { MockTracker as MockTrackerSec } from './sections/MockTracker';
import { ErrorLog as ErrorLogSec } from './sections/ErrorLog';
import { ExamCore as ExamCoreSec } from './sections/ExamCore';
import { CampaignMap as CampaignMapSec } from './sections/CampaignMap';
import { Analytics as AnalyticsSec } from './sections/Analytics';
import { RightNow as RightNowSec } from './sections/RightNow';
import { Contingency as ContingencySec } from './sections/Contingency';
import { StandingOrders as StandingOrdersSec } from './sections/StandingOrders';

interface ExamDashboardShellProps {
  onToggleScope?: () => void;
}

export function ExamDashboardShell({ onToggleScope }: ExamDashboardShellProps) {
  const { examId, examConfig, setExam, isLoading, needsOnboarding } = useSelectedExam();
  const [activeSection, setActiveSection] = useState<string>('overview');
  const [showOnboardingModal, setShowOnboardingModal] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Open onboarding modal if user profile is missing target_exam
  const isModalOpen = needsOnboarding || showOnboardingModal;

  // Nav Groups
  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'topics', label: 'Topic Tracker', icon: BookOpen },
    { id: 'mocks', label: 'Mock Tests', icon: Trophy },
    { id: 'errors', label: 'Error Log', icon: AlertOctagon },
    { id: 'core', label: `${examConfig.name} Core`, icon: Shield },
    { id: 'campaign', label: 'Campaign Map', icon: Map },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'rightnow', label: 'Right Now', icon: Zap },
    { id: 'contingency', label: 'Contingency', icon: AlertTriangle },
    { id: 'orders', label: 'Standing Orders', icon: ListOrdered },
  ];

  return (
    <ExamThemeProvider examConfig={examConfig}>
      <div className="exam-shell min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-amber-500 selection:text-zinc-950">

        {/* TOP BAR */}
        <header className="sticky top-0 z-40 h-16 bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-800/80 px-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Mobile Hamburger */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Exam Identity Badge */}
            <div className="flex items-center gap-2.5">
              <span className="text-2xl p-1.5 rounded-xl bg-zinc-900 border border-zinc-800">
                {examConfig.emoji}
              </span>
              <div>
                <h1 className="text-sm font-extrabold text-white leading-tight flex items-center gap-2">
                  Mission {examConfig.name}
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    2026-27
                  </span>
                </h1>
                <p className="text-[11px] text-zinc-400 hidden sm:block">
                  {examConfig.fullName}
                </p>
              </div>
            </div>
          </div>

          {/* Right Actions: Exam Change */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setShowOnboardingModal(true)}
              className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-semibold text-zinc-300 hover:text-white flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Switch Exam</span>
            </button>
          </div>
        </header>

        {/* MAIN LAYOUT: SIDEBAR + CONTENT */}
        <div className="flex-1 flex overflow-hidden">

          {/* SIDEBAR (Desktop) */}
          <aside className="hidden lg:flex w-64 border-r border-zinc-800/80 bg-zinc-950/60 backdrop-blur-xl flex-col justify-between p-4">
            <nav className="space-y-1">
              <div className="px-3 py-2 text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                Exam Workspace
              </div>
              {navItems.map((item) => {
                const isActive = activeSection === item.id;
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveSection(item.id)}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-3 transition-all duration-200 cursor-pointer relative ${
                      isActive
                        ? 'bg-zinc-900 text-white border border-zinc-800 shadow-md'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50'
                    }`}
                  >
                    {/* Left Accent Bar for Active Item */}
                    {isActive && (
                      <motion.div
                        layoutId="activeAccent"
                        className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full"
                        style={{ background: 'var(--exam-primary, #f59e0b)' }}
                      />
                    )}
                    <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-zinc-500'}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Sidebar Footer */}
            <div className="p-3 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 text-xs space-y-1">
              <div className="font-bold text-white flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                {examConfig.name} Protocol
              </div>
              <p className="text-[11px] text-zinc-400 leading-tight">
                {examConfig.scoringDescription}
              </p>
            </div>
          </aside>

          {/* MAIN CONTENT AREA */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSection}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                {activeSection === 'overview' && <OverviewSec examConfig={examConfig} onNavigateSection={setActiveSection} />}
                {activeSection === 'topics' && <TopicTrackerSec examConfig={examConfig} />}
                {activeSection === 'mocks' && <MockTrackerSec examConfig={examConfig} />}
                {activeSection === 'errors' && <ErrorLogSec examConfig={examConfig} />}
                {activeSection === 'core' && <ExamCoreSec examConfig={examConfig} />}
                {activeSection === 'campaign' && <CampaignMapSec examConfig={examConfig} />}
                {activeSection === 'analytics' && <AnalyticsSec examConfig={examConfig} />}
                {activeSection === 'rightnow' && <RightNowSec examConfig={examConfig} />}
                {activeSection === 'contingency' && <ContingencySec examConfig={examConfig} />}
                {activeSection === 'orders' && <StandingOrdersSec examConfig={examConfig} />}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>

        {/* Onboarding & Exam Selection Modal */}
        <ExamOnboarding
          isOpen={isModalOpen}
          currentExamId={examId}
          onSelectExam={setExam}
          onClose={() => setShowOnboardingModal(false)}
        />
      </div>
    </ExamThemeProvider>
  );
}
