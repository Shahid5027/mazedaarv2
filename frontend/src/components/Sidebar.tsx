"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  GraduationCap,
  Network,
  FileCheck2,
  ScanText,
  ShieldCheck,
  AlertTriangle,
  Grid3X3,
  LifeBuoy,
  Users2,
  ChevronLeft,
  ChevronRight,
  School,
  Sparkles,
} from "lucide-react";
import { useUserRole } from "@/lib/useUserRole";

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { role, fullName, userId } = useUserRole();
  const [collapsed, setCollapsed] = useState(false);

  // Grouped Navigation Items with strict Role-Based Access Filtering
  const navSections = [
    {
      title: "Overview",
      items: [
        {
          label: "Dashboard",
          href: "/",
          icon: LayoutDashboard,
          roles: ["student", "teacher", "faculty", "counselor", "admin"],
        },
      ],
    },
    {
      title: "Learning",
      items: [
        {
          label: "Adaptive Learning",
          href: "/ps1-adaptive",
          icon: GraduationCap,
          roles: ["student", "teacher", "faculty", "admin"],
        },
        {
          label: "Knowledge Graph",
          href: "/ps1-adaptive#knowledge-graph",
          icon: Network,
          roles: ["student", "teacher", "faculty", "admin"],
        },
      ],
    },
    {
      title: "Assessment",
      items: [
        {
          label: "Assessment Workspace",
          href: "/ps2-grading",
          icon: FileCheck2,
          roles: ["teacher", "faculty", "admin"],
        },
        {
          label: "OCR Inspector",
          href: "/ps2-grading#ocr-panel",
          icon: ScanText,
          roles: ["teacher", "faculty", "admin"],
        },
        {
          label: "Moderation Queue",
          href: "/ps2-grading#moderation-queue",
          icon: ShieldCheck,
          roles: ["teacher", "faculty", "admin"],
        },
      ],
    },
    {
      title: "Student Success",
      items: [
        {
          label: "Dropout Analytics",
          href: "/ps3-dropout",
          icon: AlertTriangle,
          roles: ["counselor", "admin", "teacher"],
        },
        {
          label: "Risk Heatmap",
          href: "/ps3-dropout#heatmap-matrix",
          icon: Grid3X3,
          roles: ["counselor", "admin"],
        },
        {
          label: "Retention Copilot",
          href: "/ps3-dropout#counselor-tasks",
          icon: LifeBuoy,
          roles: ["counselor", "admin"],
        },
      ],
    },
    {
      title: "Management",
      items: [
        {
          label: "Student Directory",
          href: "/students",
          icon: Users2,
          roles: ["student", "teacher", "faculty", "counselor", "admin"],
        },
      ],
    },
  ];

  return (
    <aside
      className={`border-r border-slate-200/80 bg-white flex flex-col shrink-0 transition-all duration-200 z-30 select-none ${
        collapsed ? "w-16" : "w-64"
      }`}
    >
      {/* Institution Header */}
      <div className="p-3.5 border-b border-slate-100 flex items-center justify-between">
        {!collapsed && (
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
              <School className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-900 truncate">NIT Karnataka</p>
              <p className="text-[10px] text-slate-500 truncate">Computer Science & Eng.</p>
            </div>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition mx-auto"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Nav List */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
        {navSections.map((section, sIdx) => {
          // Filter items based on current role
          const visibleItems = section.items.filter(
            (it) => it.roles.includes(role) || role === "admin"
          );
          if (visibleItems.length === 0) return null;

          return (
            <div key={sIdx} className="space-y-1">
              {!collapsed && (
                <div className="px-2.5 pb-1">
                  <span className="editorial-tag text-[10px] font-semibold text-slate-400">
                    {section.title}
                  </span>
                </div>
              )}
              {visibleItems.map((item, iIdx) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/" && pathname.startsWith(item.href.split("#")[0]));
                const Icon = item.icon;

                return (
                  <Link
                    key={iIdx}
                    href={item.href}
                    title={collapsed ? item.label : undefined}
                    className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition group ${
                      isActive
                        ? "bg-slate-900 text-white shadow-sm"
                        : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900"
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-colors ${
                        isActive ? "text-white" : "text-slate-400 group-hover:text-slate-600"
                      }`}
                    />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* User / Persona Footer */}
      <div className="p-2.5 border-t border-slate-100 bg-slate-50/60">
        {!collapsed ? (
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-indigo-600 text-white font-semibold text-xs flex items-center justify-center shrink-0">
                {fullName.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-800 truncate">{fullName}</p>
                <div className="flex items-center gap-1">
                  <span className="editorial-tag text-[9px] px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 font-medium capitalize">
                    {role}
                  </span>
                  <span className="text-[10px] text-slate-400">{userId}</span>
                </div>
              </div>
            </div>
            <Link
              href={`/students/${userId}`}
              title="View 360° Profile"
              className="p-1 rounded text-slate-400 hover:text-indigo-600"
            >
              <Sparkles className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="w-7 h-7 rounded-full bg-indigo-600 text-white font-semibold text-xs flex items-center justify-center">
              {fullName.charAt(0)}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
