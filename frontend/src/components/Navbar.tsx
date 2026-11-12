"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BrainCircuit,
  Search,
  Sparkles,
  CheckCircle2,
  Bell,
  HelpCircle,
  Menu,
  X,
  ChevronRight,
  Wifi,
  LogOut,
  LogIn,
  User,
  Shield,
  GraduationCap,
  Users,
  UserCheck,
} from "lucide-react";
import { RoleSwitcher } from "./RoleSwitcher";
import { useUserRole } from "@/lib/useUserRole";

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const { role, fullName, userId, isAuthenticated, logout } = useUserRole();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Determine current page breadcrumbs
  const getBreadcrumbs = () => {
    if (pathname === "/") return [{ label: "EDUCORE", href: "/" }, { label: "Overview Dashboard" }];
    if (pathname.startsWith("/ps1-adaptive"))
      return [{ label: "Learning", href: "/" }, { label: "PS1 Adaptive Learning" }];
    if (pathname.startsWith("/ps2-grading"))
      return [{ label: "Assessment", href: "/" }, { label: "PS2 Subjective Grading & OCR" }];
    if (pathname.startsWith("/ps3-dropout"))
      return [{ label: "Student Success", href: "/" }, { label: "PS3 Retention & SHAP Copilot" }];
    if (pathname.startsWith("/students/"))
      return [{ label: "Students", href: "/students" }, { label: `Profile (${pathname.split("/").pop()})` }];
    if (pathname === "/students")
      return [{ label: "Directory", href: "/" }, { label: "Shared 360° Students" }];
    if (pathname === "/login")
      return [{ label: "Authentication", href: "/login" }, { label: "Sign In" }];
    if (pathname === "/register")
      return [{ label: "Authentication", href: "/login" }, { label: "Account Registration" }];
    return [{ label: "Overview", href: "/" }];
  };

  const crumbs = getBreadcrumbs();

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14 gap-4">
          {/* Left: Brand Wordmark + Breadcrumb */}
          <div className="flex items-center gap-4 min-w-0">
            <Link href="/" className="flex items-center gap-2 shrink-0">
              <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white shadow-sm">
                <BrainCircuit className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm tracking-tight text-slate-900">EDUCORE</span>
                <span className="editorial-tag text-[9px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold border border-slate-200">
                  AI v3.0
                </span>
              </div>
            </Link>

            {/* Breadcrumb separator */}
            <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-400">
              <span className="text-slate-300">/</span>
              {crumbs.map((c, i) => (
                <React.Fragment key={i}>
                  {i > 0 && <ChevronRight className="w-3 h-3 text-slate-300" />}
                  <span
                    className={
                      i === crumbs.length - 1
                        ? "font-semibold text-slate-800 truncate"
                        : "text-slate-500 hover:text-slate-700"
                    }
                  >
                    {c.label}
                  </span>
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Center Search Input */}
          <div className="hidden lg:flex items-center flex-1 max-w-md mx-4">
            <div className="relative w-full">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search students (e.g. STU001), concepts, rubrics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50/70 hover:bg-slate-50 focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition focus-ring text-slate-800 placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Right Status Badges & Controls */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Real-time Engine Status Pill */}
            <div className="hidden xl:flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-50 border border-slate-200/80 text-[11px] text-slate-600 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Engines Live: PS1 • PS2 • PS3</span>
            </div>

            {/* Quick Link to 360 Profile (only if student or teacher) */}
            {role === "student" && (
              <Link
                href={`/students/${userId || "STU001"}`}
                className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition border border-indigo-200/60"
              >
                <Sparkles className="w-3 h-3 text-indigo-600" />
                <span>My 360° Profile</span>
              </Link>
            )}

            {/* Role Switcher Demo Tool */}
            <RoleSwitcher />

            {/* Auth Action Button */}
            {isAuthenticated ? (
              <button
                onClick={() => logout()}
                title="Sign out of current session"
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 text-slate-700 hover:text-rose-600 hover:bg-rose-50/50 hover:border-rose-200 transition"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition shadow-xs"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </Link>
            )}

            {/* Mobile Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-1">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            Overview Dashboard
          </Link>
          <Link
            href="/ps1-adaptive"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            PS1: Adaptive Learning
          </Link>
          <Link
            href="/ps2-grading"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            PS2: Subjective Evaluation & OCR
          </Link>
          <Link
            href="/ps3-dropout"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            PS3: Retention Intelligence & SHAP
          </Link>
          <Link
            href="/students"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            Students Directory (360°)
          </Link>
          <div className="pt-2 border-t border-slate-100 mt-2">
            {isAuthenticated ? (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  logout();
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out ({fullName})</span>
              </button>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-xs font-semibold text-indigo-600 hover:bg-indigo-50"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
