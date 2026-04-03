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
    <div className="bg-white p-6 rounded-2xl border border-ink/5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl ${color} bg-opacity-10`}>
          {icon}
        </div>
        
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-medium ${trend.isUp ? 'text-green-500' : 'text-red-500'}`}>
            {trend.isUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            {trend.value}%
          </div>
        )}
      </div>

      <div className="space-y-1">
        <p className="text-[10px] uppercase tracking-widest text-ink/40 font-medium">
          {title}
        </p>
        <h3 className="text-2xl font-bold text-ink">
          {value}
        </h3>
      </div>
    </div>
  );
}
