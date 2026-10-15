import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { ExamConfig } from '@/lib/exams';
import { Clock, Calendar, Trophy, Target, Sparkles, CheckCircle2, TrendingUp, AlertCircle, Bell, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface OverviewProps {
  examConfig: ExamConfig;
  onNavigateSection?: (sectionId: string) => void;
}

export function Overview({ examConfig, onNavigateSection }: OverviewProps) {
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number }>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  const [topicStats, setTopicStats] = useState({ total: 0, mastered: 0, percentage: 0 });
  const [mockStats, setMockStats] = useState({ count: 0, average: 0, max: 0 });

  // 1. Live Countdown Timer Calculation
  useEffect(() => {
    function calculateTime() {
      const now = new Date().getTime();
      const target = new Date(examConfig.examDate).getTime();
      const diff = Math.max(0, target - now);

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });
    }

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [examConfig.examDate]);

  // 2. Fetch Topic & Mock Stats for current Exam ID
  useEffect(() => {
    async function loadStats() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return;

        // Fetch topics for current exam
        const { data: topics } = await supabase
          .from('topic_tracker')
          .select('status')
          .eq('user_id', session.user.id)
          .eq('exam_id', examConfig.id);

        if (topics && topics.length > 0) {
          const total = topics.length;
          const mastered = topics.filter((t) => t.status === 'Mastered').length;
          setTopicStats({ total, mastered, percentage: Math.round((mastered / total) * 100) });
        } else {
          setTopicStats({ total: examConfig.defaultTopics.length, mastered: 0, percentage: 0 });
        }

        // Fetch mocks for current exam
        const { data: mocks } = await supabase
          .from('mock_tests')
          .select('total_score, max_score')
          .eq('user_id', session.user.id)
          .eq('exam_id', examConfig.id);

        if (mocks && mocks.length > 0) {
          const count = mocks.length;
          const totalScoreSum = mocks.reduce((sum, m) => sum + Number(m.total_score || 0), 0);
          const maxScoreObserved = Math.max(...mocks.map((m) => Number(m.total_score || 0)));
          setMockStats({
            count,
            average: Math.round(totalScoreSum / count),
            max: maxScoreObserved,
          });
        }
      } catch (err) {
        console.warn('Error fetching overview stats:', err);
      }
    }

    loadStats();
  }, [examConfig.id, examConfig.defaultTopics.length]);

  // Campaign progress calculation
  const totalCampaignDays = Math.max(1, Math.floor((new Date(examConfig.examDate).getTime() - new Date(examConfig.campaignStart).getTime()) / (1000 * 60 * 60 * 24)));
  const daysElapsed = Math.max(0, totalCampaignDays - timeLeft.days);
  const campaignPercentage = Math.min(100, Math.max(0, Math.round((daysElapsed / totalCampaignDays) * 100)));

  // Current Phase
  const now = new Date();
  const currentPhase = examConfig.phases.find((p) => new Date(p.startDate) <= now && new Date(p.endDate) >= now) || examConfig.phases[0];

  // Registration Check
  const isRegistrationOpen = examConfig.registrationStart && examConfig.registrationEnd && new Date(examConfig.registrationStart) <= now && new Date(examConfig.registrationEnd) >= now;

  return (
    <div className="space-y-6">
      {/* Registration Alert Banner */}
      {isRegistrationOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-transparent border border-amber-500/30 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-300">Registration is Currently OPEN</h4>
              <p className="text-xs text-amber-400/80">Make sure to submit your official application before the deadline.</p>
            </div>
          </div>
          <span className="text-xs font-mono font-semibold px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
            Official Portal
          </span>
        </motion.div>
      )}

      {/* Main Bento Hero Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* CENTERPIECE: Animated Countdown Ring & Stage Hero */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="lg:col-span-2 p-6 sm:p-8 rounded-3xl bg-zinc-900/80 border border-zinc-800/80 backdrop-blur-xl relative overflow-hidden flex flex-col justify-between"
        >
          {/* Background Ambient Glow */}
          <div
            className="absolute -top-24 -right-24 w-96 h-96 rounded-full blur-3xl opacity-20 pointer-events-none"
            style={{ background: examConfig.primaryColor }}
          />

          <div>
            {/* Header Badge */}
            <div className="flex items-center justify-between mb-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-zinc-800/80 border border-zinc-700/60 text-white">
                <span>{examConfig.emoji}</span>
                <span>Mission {examConfig.name}</span>
              </div>
              <span className="text-xs font-mono text-zinc-400">
                Target: {examConfig.targetScoreLabel}
              </span>
            </div>

            {/* Countdown Digits Grid */}
            <div className="grid grid-cols-4 gap-2 sm:gap-4 my-4">
              {[
                { label: 'DAYS', value: timeLeft.days },
                { label: 'HOURS', value: timeLeft.hours },
                { label: 'MINS', value: timeLeft.minutes },
                { label: 'SECS', value: timeLeft.seconds },
              ].map((unit) => (
                <div
                  key={unit.label}
                  className="p-3 sm:p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 text-center flex flex-col items-center justify-center shadow-inner"
                >
                  <span
                    className="text-2xl sm:text-4xl font-extrabold font-mono tracking-tight"
                    style={{ color: 'var(--exam-primary, #f59e0b)' }}
                  >
                    {String(unit.value).padStart(2, '0')}
                  </span>
                  <span className="text-[10px] sm:text-xs font-semibold tracking-wider text-zinc-500 mt-1">
                    {unit.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Campaign Progress Bar */}
          <div className="mt-6 pt-4 border-t border-zinc-800/60">
            <div className="flex justify-between items-center text-xs text-zinc-400 mb-2">
              <span className="font-semibold text-white">Campaign Progress</span>
              <span className="font-mono text-amber-400">{campaignPercentage}% Complete</span>
            </div>
            <div className="h-3 w-full rounded-full bg-zinc-950 overflow-hidden p-0.5 border border-zinc-800">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${campaignPercentage}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="h-full rounded-full"
                style={{
                  background: `linear-gradient(to right, ${examConfig.primaryColor}, ${examConfig.secondaryColor})`,
                }}
              />
            </div>
          </div>
        </motion.div>

        {/* RIGHT BENTO COLUMN: Current Phase & Target Goals */}
        <div className="space-y-6 flex flex-col justify-between">
          {/* Current Phase Card */}
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            className="p-6 rounded-3xl bg-zinc-900/80 border border-zinc-800/80 backdrop-blur-xl"
          >
            <div className="flex items-center gap-2 text-xs font-bold text-zinc-400 mb-2 uppercase tracking-wider">
              <Target className="w-4 h-4 text-amber-400" />
              Active Campaign Phase
            </div>
            <h3 className="text-lg font-bold text-white mb-2">{currentPhase?.label}</h3>
            <p className="text-xs text-zinc-400 leading-relaxed mb-4">{currentPhase?.description}</p>
            <div className="inline-flex items-center gap-1.5 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-xl font-medium">
              <Sparkles className="w-3.5 h-3.5" />
              Stay Focused on Today's Tasks
            </div>
          </motion.div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800/80 backdrop-blur-xl">
              <div className="text-xs text-zinc-400 mb-1">Topic Mastery</div>
              <div className="text-2xl font-extrabold text-white font-mono">{topicStats.percentage}%</div>
              <div className="text-[11px] text-zinc-500 mt-1">{topicStats.mastered} of {topicStats.total} Mastered</div>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800/80 backdrop-blur-xl">
              <div className="text-xs text-zinc-400 mb-1">Mock Average</div>
              <div className="text-2xl font-extrabold text-white font-mono">
                {mockStats.count > 0 ? mockStats.average : '—'}
              </div>
              <div className="text-[11px] text-zinc-500 mt-1">{mockStats.count} Mocks Logged</div>
            </div>
          </div>
        </div>
      </div>

      {/* OFFICIAL DEADLINES & KEY DATES TIMELINE */}
      <div className="p-6 sm:p-8 rounded-3xl bg-zinc-900/80 border border-zinc-800/80 backdrop-blur-xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Bell className="w-5 h-5 text-amber-400" />
            Official Deadlines & Exam Calendar
          </h3>
          <span className="text-xs text-zinc-400 font-mono">
            {examConfig.deadlines.length} Key Milestones
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
          {examConfig.deadlines.map((dl) => {
            const isPassed = new Date(dl.date) < now;
            const isUpcoming = !isPassed;

            return (
              <div
                key={dl.title}
                className={`p-4 rounded-2xl border transition-all ${
                  isUpcoming
                    ? 'bg-zinc-950/70 border-zinc-800 hover:border-amber-500/40'
                    : 'bg-zinc-950/30 border-zinc-900 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
                    {dl.type.replace('_', ' ')}
                  </span>
                  <span className="text-xs font-mono font-bold text-amber-400">
                    {new Date(dl.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>

                <h4 className="text-sm font-bold text-white mb-1 leading-snug">{dl.title}</h4>
                <p className="text-xs text-zinc-400 leading-relaxed">{dl.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
