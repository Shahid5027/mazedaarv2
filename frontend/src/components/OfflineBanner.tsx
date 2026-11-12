"use client";

import React, { useState, useEffect } from "react";
import { WifiOff, Wifi, RefreshCw, CheckCircle2 } from "lucide-react";
import { offlineCache } from "@/lib/offlineCache";
import { api } from "@/lib/api";

export const OfflineBanner: React.FC = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  const checkPending = () => {
    const queue = offlineCache.getPendingSubmissions();
    setPendingCount(queue.length);
  };

  const syncQueue = async () => {
    const queue = offlineCache.getPendingSubmissions();
    if (queue.length === 0) return;

    setSyncing(true);
    let successCount = 0;

    for (const item of queue) {
      try {
        const res = await api.submitQuiz({
          student_id: item.studentId,
          topic_id: item.topicId,
          course_id: item.courseId,
          answers: item.answers,
        });
        if (res.success) {
          offlineCache.dequeueSubmission(item.id);
          successCount++;
        }
      } catch (err) {
        console.error("Failed to sync item:", item.id, err);
      }
    }

    setSyncing(false);
    checkPending();
    if (successCount > 0) {
      setSyncNotice(`Synced ${successCount} offline submission(s) to server.`);
      setTimeout(() => setSyncNotice(null), 5000);
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;

    setIsOnline(navigator.onLine);
    checkPending();

    const handleOnline = () => {
      setIsOnline(true);
      syncQueue();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (isOnline && pendingCount === 0 && !syncNotice) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md animate-in slide-in-from-bottom duration-200">
      {!isOnline ? (
        <div className="p-3.5 rounded-xl bg-slate-900 text-white shadow-xl border border-slate-700 flex items-center gap-3 text-xs">
          <WifiOff className="w-5 h-5 text-amber-400 shrink-0 animate-pulse" />
          <div className="flex-1">
            <p className="font-bold text-amber-300">You are currently offline</p>
            <p className="text-[11px] text-slate-300">
              Content is served from local cache. Quizzes completed offline will automatically sync once connection is restored.
            </p>
            {pendingCount > 0 && (
              <p className="text-[11px] text-amber-200 font-semibold mt-0.5">
                {pendingCount} submission(s) pending sync in local storage.
              </p>
            )}
          </div>
        </div>
      ) : pendingCount > 0 ? (
        <div className="p-3 rounded-xl bg-indigo-900 text-white shadow-xl border border-indigo-700 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Wifi className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Connection restored ({pendingCount} pending offline items)</span>
          </div>
          <button
            type="button"
            onClick={syncQueue}
            disabled={syncing}
            className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 font-bold text-[11px] transition flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw className={`w-3 h-3 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Syncing..." : "Sync Now"}
          </button>
        </div>
      ) : syncNotice ? (
        <div className="p-3 rounded-xl bg-emerald-900 text-white shadow-xl border border-emerald-700 flex items-center gap-2 text-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
          <span>{syncNotice}</span>
        </div>
      ) : null}
    </div>
  );
};

