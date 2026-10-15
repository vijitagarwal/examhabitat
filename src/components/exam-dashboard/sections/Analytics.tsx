import React from 'react';
import type { ExamConfig } from '@/lib/exams';
import { BarChart3, TrendingUp, Target, Award } from 'lucide-react';

interface AnalyticsProps {
  examConfig: ExamConfig;
}

export function Analytics({ examConfig }: AnalyticsProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-amber-400" />
          {examConfig.name} Analytics & Intelligence
        </h2>
        <p className="text-xs sm:text-sm text-zinc-400 mt-1">
          Deep-dive accuracy trends, topic progression velocity, and mock percentile forecasts.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-6 rounded-3xl bg-zinc-900/80 border border-zinc-800 backdrop-blur-xl">
          <div className="text-xs text-zinc-400 mb-1">Scoring Target</div>
          <div className="text-2xl font-extrabold text-white font-mono">{examConfig.totalMaxMarks} Marks Max</div>
          <div className="text-xs text-amber-400 mt-2 font-medium">{examConfig.targetScoreLabel}</div>
        </div>

        <div className="p-6 rounded-3xl bg-zinc-900/80 border border-zinc-800 backdrop-blur-xl">
          <div className="text-xs text-zinc-400 mb-1">Sections Tracked</div>
          <div className="text-2xl font-extrabold text-white font-mono">{examConfig.sections.length} Sections</div>
          <div className="text-xs text-zinc-400 mt-2">{examConfig.sections.map((s) => s.code).join(', ')}</div>
        </div>

        <div className="p-6 rounded-3xl bg-zinc-900/80 border border-zinc-800 backdrop-blur-xl">
          <div className="text-xs text-zinc-400 mb-1">Scoring Rule</div>
          <div className="text-lg font-bold text-emerald-400">{examConfig.scoringDescription}</div>
          <div className="text-xs text-zinc-500 mt-2">Auto-calculated per attempt</div>
        </div>
      </div>
    </div>
  );
}
