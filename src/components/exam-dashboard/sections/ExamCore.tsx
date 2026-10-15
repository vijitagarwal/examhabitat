import React from 'react';
import type { ExamConfig } from '@/lib/exams';
import { Shield, Target, AlertTriangle, ListOrdered, Sparkles, CheckCircle2 } from 'lucide-react';

interface ExamCoreProps {
  examConfig: ExamConfig;
}

export function ExamCore({ examConfig }: ExamCoreProps) {
  const { strategyContent } = examConfig;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
          <Shield className="w-6 h-6 text-amber-400" />
          {examConfig.name} Core Playbook & Strategy
        </h2>
        <p className="text-xs sm:text-sm text-zinc-400 mt-1">
          Tactical blueprints, score targets, contingency protocols, and standing orders for {examConfig.fullName}.
        </p>
      </div>

      {/* Section Tactics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {strategyContent.sections.map((sec, i) => (
          <div key={sec.title} className="p-6 rounded-3xl bg-zinc-900/80 border border-zinc-800 backdrop-blur-xl space-y-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              {sec.title}
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed">{sec.description}</p>
            <ul className="space-y-2 pt-2">
              {sec.keyTactics.map((tactic) => (
                <li key={tactic} className="text-xs text-zinc-300 flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{tactic}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Score Strategies Table */}
      {strategyContent.scoreStrategies.length > 0 && (
        <div className="p-6 rounded-3xl bg-zinc-900/80 border border-zinc-800 backdrop-blur-xl space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Target className="w-4 h-4 text-amber-400" />
            Target Score & Cutoff Benchmarks
          </h3>

          <div className="overflow-x-auto rounded-2xl border border-zinc-800 bg-zinc-950/60">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-900 text-zinc-400 border-b border-zinc-800 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="p-3.5">Target Tier / Percentile</th>
                  <th className="p-3.5 text-right">Target Score</th>
                  <th className="p-3.5">Tactical Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                {strategyContent.scoreStrategies.map((row) => (
                  <tr key={row.targetPercentile}>
                    <td className="p-3.5 font-bold text-white">{row.targetPercentile}</td>
                    <td className="p-3.5 text-right font-mono font-bold text-amber-400">{row.targetScore}</td>
                    <td className="p-3.5 text-zinc-400">{row.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Standing Orders */}
      {strategyContent.standingOrders.length > 0 && (
        <div className="p-6 rounded-3xl bg-zinc-900/80 border border-zinc-800 backdrop-blur-xl space-y-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <ListOrdered className="w-4 h-4 text-amber-400" />
            Standing Preparation Orders
          </h3>
          <div className="space-y-2">
            {strategyContent.standingOrders.map((order, i) => (
              <div key={order} className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80 text-xs text-zinc-300 font-medium">
                <span className="text-amber-400 font-mono font-bold mr-2">0{i + 1}.</span>
                {order}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
