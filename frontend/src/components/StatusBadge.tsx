import React from "react";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  type: "risk" | "mastery" | "submission" | "status";
  value: string | number;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ type, value, className }) => {
  let badgeStyle = "bg-slate-100 text-slate-700 border-slate-200";
  let label = String(value);

  if (type === "risk") {
    const val = String(value).toLowerCase();
    if (val === "high" || (typeof value === "number" && value >= 60)) {
      badgeStyle = "bg-rose-50 text-rose-700 border-rose-200 font-medium";
      label = typeof value === "number" ? `High Risk (${value}%)` : "High Risk";
    } else if (val === "medium" || (typeof value === "number" && value >= 30)) {
      badgeStyle = "bg-amber-50 text-amber-700 border-amber-200 font-medium";
      label = typeof value === "number" ? `Medium Risk (${value}%)` : "Medium Risk";
    } else {
      badgeStyle = "bg-emerald-50 text-emerald-700 border-emerald-200 font-medium";
      label = typeof value === "number" ? `Low Risk (${value}%)` : "Low Risk";
    }
  } else if (type === "mastery") {
    const val = Number(value);
    if (val >= 80) {
      badgeStyle = "bg-emerald-50 text-emerald-700 border-emerald-200 font-medium";
      label = `Mastered (${val}%)`;
    } else if (val >= 50) {
      badgeStyle = "bg-blue-50 text-blue-700 border-blue-200 font-medium";
      label = `In Progress (${val}%)`;
    } else {
      badgeStyle = "bg-rose-50 text-rose-700 border-rose-200 font-medium";
      label = `Needs Remediation (${val}%)`;
    }
  } else if (type === "submission") {
    const val = String(value).toLowerCase();
    if (val === "moderated") {
      badgeStyle = "bg-purple-50 text-purple-700 border-purple-200 font-medium";
      label = "Faculty Moderated";
    } else if (val === "evaluated") {
      badgeStyle = "bg-emerald-50 text-emerald-700 border-emerald-200 font-medium";
      label = "AI Evaluated";
    } else {
      badgeStyle = "bg-amber-50 text-amber-700 border-amber-200 font-medium";
      label = "Pending Grading";
    }
  }

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs border tracking-wide",
        badgeStyle,
        className
      )}
    >
      {label}
    </span>
  );
};

