import React from 'react';
import type { ExamConfig } from '@/lib/exams';
import { AlertTriangle, ShieldAlert, Zap } from 'lucide-react';

interface ContingencyProps {
  examConfig: ExamConfig;
}

export function Contingency({ examConfig }: ContingencyProps) {
  const { contingencies } = examConfig.strategyContent;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
          <AlertTriangle className="w-6 h-6 text-amber-400" />
          {examConfig.name} Contingency Protocols
        </h2>
        <p className="text-xs sm:text-sm text-zinc-400 mt-1">
          Pre-planned emergency actions when exam day scenarios don't go according to Plan A.
        </p>
      </div>

      <div className="space-y-4">
        {contingencies.map((c, i) => (
          <div key={c.scenario} className="p-6 rounded-3xl bg-zinc-900/80 border border-zinc-800 backdrop-blur-xl space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
              <ShieldAlert className="w-4 h-4" />
              Contingency Protocol 0{i + 1}
            </div>
            <h3 className="text-base font-bold text-white">{c.scenario}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="p-3 rounded-2xl bg-zinc-950/60 border border-zinc-800/80">
                <span className="text-[11px] font-semibold text-rose-400 uppercase tracking-wider block mb-1">Trigger Condition</span>
                <p className="text-xs text-zinc-300">{c.trigger}</p>
              </div>
              <div className="p-3 rounded-2xl bg-emerald-950/20 border border-emerald-800/40">
                <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider block mb-1">Immediate Action</span>
                <p className="text-xs text-emerald-200">{c.action}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
