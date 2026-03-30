import { ReactNode } from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: string;
  color?: string;
}

export function StatCard({ title, value, icon, trend, color }: StatCardProps) {
  const isPositiveTrend = trend?.startsWith("+");

  return (
    <div className="rounded-card bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-button"
          style={{ backgroundColor: color ? `${color}20` : "#E8553A20" }}
        >
          <span style={{ color: color || "#E8553A" }}>{icon}</span>
        </div>
        {trend && (
          <span
            className={`inline-flex items-center rounded-badge px-2 py-0.5 text-xs font-semibold font-body ${
              isPositiveTrend
                ? "bg-emerald-50 text-emerald-600"
                : "bg-red-50 text-red-500"
            }`}
          >
            {trend}
          </span>
        )}
      </div>
      <p className="mt-4 font-heading text-2xl font-bold text-gray-900">
        {value}
      </p>
      <p className="mt-1 text-sm text-gray-500 font-body">{title}</p>
    </div>
  );
}
