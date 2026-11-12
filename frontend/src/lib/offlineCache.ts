/**
 * EDUCORE AI — Offline & Low-Bandwidth Caching Layer
 * Provides persistent localStorage caching for:
 * - Curriculum syllabus topics
 * - Active student progress & mastery
 * - Offline adaptive quiz questions
 * - Offline quiz submission queue with automated re-synchronization on reconnect
 */

const CACHE_PREFIX = "educore_cache_";
const QUEUE_KEY = "educore_offline_quiz_queue";

export interface CachedItem<T> {
  timestamp: number;
  data: T;
  ttlMs: number;
}

export interface OfflineQuizSubmission {
  id: string;
  studentId: string;
  topicId: string;
  courseId: string;
  answers: Record<string, number>;
  timestamp: number;
}

export const offlineCache = {
  /**
   * Stores arbitrary data with a Time-To-Live (default 12 hours)
   */
  set: <T>(key: string, data: T, ttlHours: number = 12): void => {
    if (typeof window === "undefined") return;
    try {
      const item: CachedItem<T> = {
        timestamp: Date.now(),
        data,
        ttlMs: ttlHours * 60 * 60 * 1000,
      };
      localStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(item));
    } catch (e) {
      console.warn("Offline cache quota exceeded or unavailable:", e);
    }
  },

  /**
   * Retrieves data from localStorage, verifying validity against TTL
   */
  get: <T>(key: string): T | null => {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem(`${CACHE_PREFIX}${key}`);
      if (!raw) return null;
      const item: CachedItem<T> = JSON.parse(raw);
      const isExpired = Date.now() - item.timestamp > item.ttlMs;
      if (isExpired) {
        localStorage.removeItem(`${CACHE_PREFIX}${key}`);
        return null;
      }
      return item.data;
    } catch (e) {
      console.warn("Failed to read from offline cache:", e);
      return null;
    }
  },

  /**
   * Enqueues an offline quiz submission when network is disconnected
   */
  enqueueOfflineSubmission: (submission: Omit<OfflineQuizSubmission, "id" | "timestamp">): string => {
    if (typeof window === "undefined") return "";
    try {
      const queue: OfflineQuizSubmission[] = JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]");
      const id = `OFF_SUB_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const newEntry: OfflineQuizSubmission = {
        ...submission,
        id,
        timestamp: Date.now(),
      };
      queue.push(newEntry);
      localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
      return id;
    } catch (e) {
      console.error("Failed to enqueue offline submission:", e);
      return "";
    }
  },

  /**
   * Returns all pending offline submissions
   */
  getPendingSubmissions: (): OfflineQuizSubmission[] => {
    if (typeof window === "undefined") return [];
    try {
      return JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]");
    } catch (e) {
      return [];
    }
  },

  /**
   * Removes a successfully synchronized submission from the queue
   */
  dequeueSubmission: (id: string): void => {
    if (typeof window === "undefined") return;
    try {
      const queue: OfflineQuizSubmission[] = JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]");
      const filtered = queue.filter((item) => item.id !== id);
      localStorage.setItem(QUEUE_KEY, JSON.stringify(filtered));
    } catch (e) {
      console.error("Failed to dequeue offline submission:", e);
    }
  },

  /**
   * Clears the offline submission queue
   */
  clearQueue: (): void => {
    if (typeof window === "undefined") return;
    localStorage.removeItem(QUEUE_KEY);
  },
};

