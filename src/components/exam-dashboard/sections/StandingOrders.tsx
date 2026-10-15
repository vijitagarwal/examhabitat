import React from 'react';
import type { ExamConfig } from '@/lib/exams';
import { ListOrdered, CheckCircle2 } from 'lucide-react';

interface StandingOrdersProps {
  examConfig: ExamConfig;
}

export function StandingOrders({ examConfig }: StandingOrdersProps) {
  const { standingOrders } = examConfig.strategyContent;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
          <ListOrdered className="w-6 h-6 text-amber-400" />
          {examConfig.name} Standing Orders
        </h2>
        <p className="text-xs sm:text-sm text-zinc-400 mt-1">
          Non-negotiable daily & weekly rules for preparation discipline.
        </p>
      </div>

      <div className="space-y-3">
        {standingOrders.map((order, i) => (
          <div key={order} className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex items-center gap-3 text-sm text-zinc-200 font-medium">
            <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0" />
            <span>{order}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
