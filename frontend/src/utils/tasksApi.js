import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

// Retry once on network/5xx errors (matches existing pattern)
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const config = error.config;
    if (config._retried) return Promise.reject(error);
    const isRetryable =
      !error.response || (error.response.status >= 500 && error.response.status < 600);
    if (isRetryable) {
      config._retried = true;
      await new Promise((r) => setTimeout(r, 1500));
      return api(config);
    }
    return Promise.reject(error);
  }
);

export const tasksAPI = {
  /** Get aggregated stats for dashboard */
  getStats: (userId) =>
    api.get(`${API_BASE_URL}/tasks/stats`, { params: { userId } }),

  /** Get all tasks for a calendar month (YYYY-MM) */
  getMonth: (userId, month) =>
    api.get(`${API_BASE_URL}/tasks/month`, { params: { userId, month } }),

  /** Get tasks in a date range (YYYY-MM-DD) */
  getRange: (userId, from, to) =>
    api.get(`${API_BASE_URL}/tasks/range`, { params: { userId, from, to } }),

  /** Get all tasks for a year */
  getYear: (userId, year) =>
    api.get(`${API_BASE_URL}/tasks/year`, { params: { userId, year } }),

  /** Get a single day's task */
  getDay: (userId, date) =>
    api.get(`${API_BASE_URL}/tasks/${date}`, { params: { userId } }),

  /** Create or update a day's task (upsert) */
  upsertDay: (userId, date, data) =>
    api.post(`${API_BASE_URL}/tasks`, { userId, date, ...data }),
};
