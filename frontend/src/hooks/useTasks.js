import { useState, useEffect, useCallback, useRef } from 'react';
import { tasksAPI } from '../utils/tasksApi';

// ─── useDayTask ──────────────────────────────────────────────────────────────
/**
 * Fetch + optimistically update a single day's task.
 * @param {string} userId
 * @param {string} date  YYYY-MM-DD
 */
export function useDayTask(userId, date) {
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  useEffect(() => {
    if (!userId || !date) return;
    setLoading(true);
    setError(null);
    tasksAPI
      .getDay(userId, date)
      .then((res) => setTask(res.data))
      .catch((err) => setError(err.message || 'Failed to load'))
      .finally(() => setLoading(false));
  }, [userId, date]);

  const save = useCallback(
    async (data) => {
      setSaving(true);
      setSaveError(null);
      // Optimistic update
      const previous = task;
      setTask((prev) => ({ ...(prev || {}), userId, date, ...data }));
      try {
        const res = await tasksAPI.upsertDay(userId, date, data);
        setTask(res.data);
      } catch (err) {
        setTask(previous); // rollback
        setSaveError(err.message || 'Save failed');
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [userId, date, task]
  );

  return { task, loading, error, saving, saveError, save };
}

// ─── useMonthTasks ───────────────────────────────────────────────────────────
/**
 * Fetch all tasks for a calendar month.
 * @param {string} userId
 * @param {string} month  YYYY-MM
 */
export function useMonthTasks(userId, month) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(() => {
    if (!userId || !month) return;
    setLoading(true);
    setError(null);
    tasksAPI
      .getMonth(userId, month)
      .then((res) => setTasks(res.data || []))
      .catch((err) => setError(err.message || 'Failed to load'))
      .finally(() => setLoading(false));
  }, [userId, month]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { tasks, loading, error, refresh };
}

// ─── useRangeTasks ───────────────────────────────────────────────────────────
/**
 * Fetch tasks between two dates.
 * @param {string} userId
 * @param {string} from  YYYY-MM-DD
 * @param {string} to    YYYY-MM-DD
 */
export function useRangeTasks(userId, from, to) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId || !from || !to) return;
    setLoading(true);
    setError(null);
    tasksAPI
      .getRange(userId, from, to)
      .then((res) => setTasks(res.data || []))
      .catch((err) => setError(err.message || 'Failed to load'))
      .finally(() => setLoading(false));
  }, [userId, from, to]);

  return { tasks, loading, error };
}

// ─── useYearTasks ────────────────────────────────────────────────────────────
/**
 * Fetch all tasks for a year.
 * @param {string} userId
 * @param {number} year
 */
export function useYearTasks(userId, year) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId || !year) return;
    setLoading(true);
    setError(null);
    tasksAPI
      .getYear(userId, String(year))
      .then((res) => setTasks(res.data || []))
      .catch((err) => setError(err.message || 'Failed to load'))
      .finally(() => setLoading(false));
  }, [userId, year]);

  return { tasks, loading, error };
}

// ─── useDashboardStats ───────────────────────────────────────────────────────
/**
 * Fetch aggregated stats for the dashboard.
 * @param {string} userId
 */
export function useDashboardStats(userId) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(() => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    tasksAPI
      .getStats(userId)
      .then((res) => setStats(res.data))
      .catch((err) => setError(err.message || 'Failed to load stats'))
      .finally(() => setLoading(false));
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { stats, loading, error, refresh };
}

// ─── dateUtils ───────────────────────────────────────────────────────────────
/** Format Date to YYYY-MM-DD */
export function toDateStr(date) {
  return date.toISOString().slice(0, 10);
}

/** Today as YYYY-MM-DD */
export function todayStr() {
  return toDateStr(new Date());
}

/** This month as YYYY-MM */
export function thisMonthStr() {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}`;
}

/** Monday of current week as YYYY-MM-DD */
export function thisWeekStart() {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const mon = new Date(now);
  mon.setDate(now.getDate() + diff);
  return toDateStr(mon);
}
