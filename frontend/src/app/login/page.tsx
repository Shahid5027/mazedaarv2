"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BrainCircuit,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  Shield,
  GraduationCap,
  Users,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Loader2,
} from "lucide-react";
import { api } from "@/lib/api";
import { useUserRole } from "@/lib/useUserRole";

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, role: activeRole, login, demoLogin } = useUserRole();

  const [identity, setIdentity] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [demoLoadingRole, setDemoLoadingRole] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [demoAccounts, setDemoAccounts] = useState<any[]>([]);

  useEffect(() => {
    // Load demo credentials list for evaluation
    api.getDemoAccounts().then((res) => {
      if (res.success && res.data) {
        setDemoAccounts(res.data);
      }
    });
  }, []);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!identity.trim()) {
      setErrorMsg("Please enter your email or username.");
      return;
    }
    if (!password) {
      setErrorMsg("Please enter your password.");
      return;
    }

    setLoading(true);
    try {
      const res = await login(identity.trim(), password);
      if (res.success) {
        setSuccessMsg("Authentication successful! Redirecting to workspace...");
        setTimeout(() => {
          router.push("/");
        }, 600);
      } else {
        setErrorMsg(res.message || "Invalid credentials. Please verify your email/password.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred during authentication.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async (role: string) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setDemoLoadingRole(role);
    try {
      const res = await demoLogin(role);
      if (res.success) {
        setSuccessMsg(`Authenticated as ${role.toUpperCase()}! Redirecting...`);
        setTimeout(() => {
          router.push("/");
        }, 500);
      } else {
        setErrorMsg(res.message || "Demo authentication failed.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to switch demo account.");
    } finally {
      setDemoLoadingRole(null);
    }
  };

  const roleIcons: Record<string, React.ReactNode> = {
    admin: <Shield className="w-4 h-4 text-rose-500" />,
    teacher: <UserCheck className="w-4 h-4 text-emerald-500" />,
    student: <GraduationCap className="w-4 h-4 text-indigo-500" />,
    counselor: <Users className="w-4 h-4 text-amber-500" />,
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative Background Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-indigo-100/40 via-purple-50/20 to-transparent pointer-events-none" />
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-200/20 rounded-full blur-3xl pointer-events-none" />

      {/* Header / Brand */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center relative z-10">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-slate-900 text-white shadow-md shadow-slate-900/10 mb-3">
          <BrainCircuit className="w-6 h-6 text-indigo-400" />
        </div>
        <div className="flex items-center justify-center gap-2 mb-1">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">EDUCORE AI</h2>
          <span className="editorial-tag text-[10px] px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-semibold border border-indigo-100">
            Enterprise
          </span>
        </div>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          Unified Academic Intelligence uniting PS1 Adaptive Learning, PS2 Subjective Grading, and PS3 Retention Copilot.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200/80 rounded-2xl sm:px-10">
          
          {/* Notifications */}
          {errorMsg && (
            <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="leading-relaxed">{errorMsg}</div>
            </div>
          )}

          {successMsg && (
            <div className="mb-5 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="leading-relaxed font-medium">{successMsg}</div>
            </div>
          )}

          {/* Form */}
          <form className="space-y-4" onSubmit={handleFormSubmit}>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email Address or Username
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={identity}
                  onChange={(e) => setIdentity(e.target.value)}
                  placeholder="e.g. admin@educore.edu or student_demo"
                  className="block w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="block w-full pl-9 pr-10 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 transition flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Verifying credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Accounts Selection */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Instant Evaluation Logins</span>
              </span>
              <span className="editorial-tag text-[9px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold border border-emerald-100">
                1-Click JWT
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {[
                { role: "admin", label: "Admin / Dean", desc: "Executive Analytics" },
                { role: "teacher", label: "Faculty / Teacher", desc: "Rubrics & Grading" },
                { role: "student", label: "Student (STU001)", desc: "Adaptive & Quizzes" },
                { role: "counselor", label: "Counselor", desc: "Retention & SHAP" },
              ].map((acc) => (
                <button
                  key={acc.role}
                  type="button"
                  onClick={() => handleQuickDemo(acc.role)}
                  disabled={demoLoadingRole !== null}
                  className="p-2.5 rounded-xl border border-slate-200/90 bg-slate-50/60 hover:bg-indigo-50/50 hover:border-indigo-200 transition text-left group flex items-start gap-2 disabled:opacity-60"
                >
                  <div className="p-1 rounded-lg bg-white border border-slate-200 shadow-2xs mt-0.5 shrink-0">
                    {roleIcons[acc.role]}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-slate-800 leading-tight group-hover:text-indigo-900 truncate">
                      {acc.label}
                    </p>
                    <p className="text-[9px] text-slate-500 truncate mt-0.5">
                      {acc.desc}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Registration Links */}
          <div className="mt-6 pt-4 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500">
              Don&apos;t have an account yet?{" "}
              <Link
                href="/register"
                className="font-semibold text-indigo-600 hover:text-indigo-800"
              >
                Register as Student or Faculty
              </Link>
            </p>
          </div>
        </div>

        {/* Development Helper Badge */}
        <div className="mt-4 text-center">
          <p className="text-[11px] text-slate-400">
            EDUCORE AI v3.0 • Secure Bcrypt Hash & Standard JWT HS256 Session Active
          </p>
        </div>
      </div>
    </div>
  );
}

