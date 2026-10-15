import React from 'react';
import type { ExamConfig } from '@/lib/exams';
import { Zap, Clock, ArrowRight, Target } from 'lucide-react';

interface RightNowProps {
  examConfig: ExamConfig;
}

export function RightNow({ examConfig }: RightNowProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
          <Zap className="w-6 h-6 text-amber-400" />
          Right Now Focus Heuristic — {examConfig.name}
        </h2>
        <p className="text-xs sm:text-sm text-zinc-400 mt-1">
          Dynamic recommendation engine for what to focus on right at this moment.
        </p>
      </div>

      <div className="p-8 rounded-3xl bg-zinc-900/80 border border-zinc-800 backdrop-blur-xl space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
          <Clock className="w-3.5 h-3.5" />
          High Yield Action Item
        </div>
        <h3 className="text-xl font-bold text-white">Focus on Core Topics with "Not Started" status</h3>
        <p className="text-sm text-zinc-400 max-w-2xl leading-relaxed">
          Open the Topic Tracker to pick 1 unmastered topic in {examConfig.sections[0]?.name || 'your primary section'} and spend the next 45 minutes on concept learning and problem solving.
        </p>
      </div>
    </div>
  );
}
