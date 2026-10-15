import React from 'react';
import type { ExamConfig } from '@/lib/exams';
import { Map, Calendar, CheckCircle, Flag } from 'lucide-react';

interface CampaignMapProps {
  examConfig: ExamConfig;
}

export function CampaignMap({ examConfig }: CampaignMapProps) {
  const now = new Date();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
          <Map className="w-6 h-6 text-amber-400" />
          {examConfig.name} Campaign Roadmap
        </h2>
        <p className="text-xs sm:text-sm text-zinc-400 mt-1">
          Strategic timeline from campaign start to exam day.
        </p>
      </div>

      <div className="relative border-l-2 border-zinc-800 ml-4 sm:ml-6 space-y-8 py-4">
        {examConfig.phases.map((phase, index) => {
          const isPast = new Date(phase.endDate) < now;
          const isCurrent = new Date(phase.startDate) <= now && new Date(phase.endDate) >= now;

          return (
            <div key={phase.label} className="relative pl-6 sm:pl-8">
              {/* Timeline Marker Circle */}
              <div
                className={`absolute -left-[9px] top-1.5 w-4 h-4 rounded-full border-2 transition-all ${
                  isCurrent
                    ? 'bg-amber-500 border-amber-300 ring-4 ring-amber-500/20'
                    : isPast
                    ? 'bg-emerald-500 border-emerald-400'
                    : 'bg-zinc-950 border-zinc-700'
                }`}
              />

              <div
                className={`p-6 rounded-3xl border backdrop-blur-xl transition-all ${
                  isCurrent
                    ? 'bg-zinc-900/90 border-amber-500/50 shadow-xl shadow-amber-500/5'
                    : 'bg-zinc-900/60 border-zinc-800/80'
                }`}
              >
                <div className="flex flex-wrap justify-between items-center gap-2 mb-2">
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                    Phase 0{index + 1} {isCurrent && '• CURRENT ACTIVE'}
                  </span>
                  <span className="text-xs font-mono text-zinc-400 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                    {new Date(phase.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} —{' '}
                    {new Date(phase.endDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </span>
                </div>

                <h3 className="text-base font-bold text-white mb-2">{phase.label}</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">{phase.description}</p>
              </div>
            </div>
          );
        })}

        {/* Final Exam Date Marker */}
        <div className="relative pl-6 sm:pl-8">
          <div className="absolute -left-[11px] top-1.5 w-5 h-5 rounded-full bg-rose-500 border-2 border-white flex items-center justify-center">
            <Flag className="w-3 h-3 text-white" />
          </div>
          <div className="p-6 rounded-3xl bg-gradient-to-r from-rose-950/40 via-zinc-900 to-zinc-900 border border-rose-500/30">
            <h3 className="text-base font-extrabold text-rose-300">EXAM DAY: {examConfig.name}</h3>
            <p className="text-xs text-zinc-400 mt-1 font-mono">
              Official Target Date: {new Date(examConfig.examDate).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
