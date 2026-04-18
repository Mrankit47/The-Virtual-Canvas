'use client';

import { TrendingUp, TrendingDown } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isUp: boolean;
  };
  color?: string;
}

export default function StatsCard({ title, value, icon, trend, color = 'bg-ink' }: StatsCardProps) {
  return (
    <div className="bg-white p-4 sm:p-6 rounded-3xl border border-ink/5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div className={`p-3 sm:p-4 rounded-2xl ${color} bg-opacity-10 group-hover:bg-opacity-20 transition-all`}>
          {icon}
        </div>
        
        {trend && (
          <div className={`flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-widest ${trend.isUp ? 'text-emerald-500' : 'text-rose-500'}`}>
            {trend.isUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            {trend.value}%
          </div>
        )}
      </div>

      <div className="space-y-1 sm:space-y-2">
        <p className="text-[10px] uppercase tracking-[0.2em] text-ink/30 font-extrabold leading-none">
          {title}
        </p>
        <h3 className="text-2xl sm:text-3xl font-bold text-ink tracking-tight">
          {value}
        </h3>
      </div>
    </div>
  );
}
