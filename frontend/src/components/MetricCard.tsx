import React from "react";
import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  change?: {
    value: string;
    trend: "up" | "down" | "neutral";
  };
  icon?: LucideIcon;
  variant?: "default" | "brand" | "success" | "warning" | "danger";
  badge?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  change,
  icon: Icon,
  variant = "default",
  badge,
}) => {
  const borderStyles = {
    default: "border-slate-200/80 bg-white hover:border-slate-300",
    brand: "border-indigo-100 bg-indigo-50/20 hover:border-indigo-200",
    success: "border-emerald-100 bg-emerald-50/20 hover:border-emerald-200",
    warning: "border-amber-100 bg-amber-50/20 hover:border-amber-200",
    danger: "border-rose-100 bg-rose-50/20 hover:border-rose-200",
  }[variant];

  const iconStyles = {
    default: "text-slate-600 bg-slate-100",
    brand: "text-indigo-600 bg-indigo-50",
    success: "text-emerald-600 bg-emerald-50",
    warning: "text-amber-600 bg-amber-50",
    danger: "text-rose-600 bg-rose-50",
  }[variant];

  return (
    <div
      className={`rounded-xl border p-5 transition-all duration-150 shadow-[0_1px_3px_rgba(0,0,0,0.02)] ${borderStyles}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold tracking-wide text-slate-500 uppercase">{title}</span>
        {Icon && (
          <div className={`p-2 rounded-lg ${iconStyles}`}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl font-bold tracking-tight text-slate-900">{value}</span>
        {badge && (
          <span className="editorial-tag px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
            {badge}
          </span>
        )}
      </div>

      {(subtitle || change) && (
        <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
          {subtitle && <span>{subtitle}</span>}
          {change && (
            <span
              className={`font-semibold ${
                change.trend === "up"
                  ? "text-emerald-600"
                  : change.trend === "down"
                  ? "text-rose-600"
                  : "text-slate-500"
              }`}
            >
              {change.value}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

