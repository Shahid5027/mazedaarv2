"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "./api";

export interface UserRoleState {
  role: string;
  fullName: string;
  userId: string;
  email: string;
  studentId?: string;
  department?: string;
  isAuthenticated: boolean;
  loading: boolean;
}

export function useUserRole() {
  const [state, setState] = useState<UserRoleState>({
    role: "student",
    fullName: "Aarav Sharma",
    userId: "USR_STU1",
    email: "aarav.sharma@educore.edu",
    studentId: "STU001",
    department: "Computer Science",
    isAuthenticated: false,
    loading: true,
  });

  const fetchSession = useCallback(async () => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("educore_token") : null;

      if (token) {
        // Try verifying with /api/auth/me
        const authRes = await api.getMe();
        if (authRes.success && authRes.data) {
          const u = authRes.data;
          setState({
            role: (u.role || "student").toLowerCase(),
            fullName: u.full_name || "User",
            userId: u.user_id,
            email: u.email,
            studentId: u.student_id,
            department: u.department || "Computer Science",
            isAuthenticated: true,
            loading: false,
          });
          return;
        }
      }

      // Fallback: check demo user context
      const demoRes = await api.getCurrentUser();
      if (demoRes.success && demoRes.data) {
        const d = demoRes.data;
        setState({
          role: (d.role || "student").toLowerCase(),
          fullName: d.full_name || "Demo User",
          userId: d.user_id || "USR_DEMO",
          email: d.email || `${d.role}@educore.edu`,
          studentId: d.active_student_id || (d.role === "student" ? "STU001" : undefined),
          department: "Computer Science",
          isAuthenticated: !!token,
          loading: false,
        });
      } else {
        setState((prev) => ({ ...prev, loading: false }));
      }
    } catch {
      setState((prev) => ({ ...prev, loading: false }));
    }
  }, []);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  const login = async (identity: string, password: string): Promise<{ success: boolean; message?: string }> => {
    setState((prev) => ({ ...prev, loading: true }));
    const res = await api.login({ username_or_email: identity, password });
    if (res.success && res.data?.access_token) {
      if (typeof window !== "undefined") {
        localStorage.setItem("educore_token", res.data.access_token);
        localStorage.setItem("educore_user", JSON.stringify(res.data));
      }
      setState({
        role: res.data.role.toLowerCase(),
        fullName: res.data.full_name,
        userId: res.data.user_id,
        email: res.data.email,
        studentId: res.data.student_id,
        department: res.data.department,
        isAuthenticated: true,
        loading: false,
      });
      return { success: true, message: res.message };
    }
    setState((prev) => ({ ...prev, loading: false }));
    return { success: false, message: res.message || "Login failed." };
  };

  const demoLogin = async (targetRole: string): Promise<{ success: boolean; message?: string }> => {
    setState((prev) => ({ ...prev, loading: true }));
    const res = await api.demoLogin(targetRole);
    if (res.success && res.data?.access_token) {
      if (typeof window !== "undefined") {
        localStorage.setItem("educore_token", res.data.access_token);
        localStorage.setItem("educore_user", JSON.stringify(res.data));
      }
      setState({
        role: res.data.role.toLowerCase(),
        fullName: res.data.full_name,
        userId: res.data.user_id,
        email: res.data.email,
        studentId: res.data.student_id,
        department: res.data.department,
        isAuthenticated: true,
        loading: false,
      });
      return { success: true, message: res.message };
    }
    setState((prev) => ({ ...prev, loading: false }));
    return { success: false, message: res.message || "Demo login failed." };
  };

  const logout = async () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("educore_token");
      localStorage.removeItem("educore_user");
    }
    await api.logout().catch(() => {});
    setState({
      role: "student",
      fullName: "",
      userId: "",
      email: "",
      studentId: undefined,
      department: "",
      isAuthenticated: false,
      loading: false,
    });
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  };

  return {
    ...state,
    login,
    demoLogin,
    logout,
    reloadRole: fetchSession,
  };
}
