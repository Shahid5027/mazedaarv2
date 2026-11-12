"use client";

import { useState, useEffect } from "react";
import { api } from "./api";

export interface UserRoleState {
  role: string;
  fullName: string;
  userId: string;
  loading: boolean;
}

export function useUserRole(): UserRoleState & { reloadRole: () => Promise<void> } {
  const [state, setState] = useState<UserRoleState>({
    role: "student",
    fullName: "Aarav Sharma",
    userId: "STU001",
    loading: true,
  });

  const fetchRole = async () => {
    try {
      const res = await api.getCurrentUser();
      if (res.success && res.data) {
        setState({
          role: res.data.role.toLowerCase(),
          fullName: res.data.full_name,
          userId: res.data.user_id,
          loading: false,
        });
      }
    } catch {
      setState((prev) => ({ ...prev, loading: false }));
    }
  };

  useEffect(() => {
    fetchRole();
  }, []);

  return { ...state, reloadRole: fetchRole };
}

