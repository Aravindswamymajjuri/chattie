import React, { useState, useMemo } from 'react';
import { useMonthTasks, toDateStr } from '../hooks/useTasks';
import '../styles/Tracker.css';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const ProgressRow = ({ label, value, max, unit = 'h', colorClass = '' }) => {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="progress-row">
      <div className="progress-label-row">
        <span className="progress-label">{label}</span>
        <span className="progress-value">{value.toFixed(1)}{unit} <span style={{ fontWeight: 400, color: 'var(--text-light)' }}>({pct}%)</span></span>
      </div>
      <div className="progress-track">
        <div className={`progress-fill ${colorClass}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

const MonthlyAnalytics = ({ currentUser }) => {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const monthStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`;
  const { tasks, loading, error } = useMonthTasks(currentUser._id, monthStr);

  const todayStr = toDateStr(today);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  };

  const nextMonth = () => {
    const now = new Date();
    if (viewYear > now.getFullYear() || (viewYear === now.getFullYear() && viewMonth >= now.getMonth())) return;
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  };

  const canGoNext = !(viewYear === today.getFullYear() && viewMonth >= today.getMonth());

  const stats = useMemo(() => {
    if (!tasks.length) return null;
    const totalH = t => (t.learningHours || 0) + (t.dsaHours || 0) + (t.projectHours || 0);
    const isCurrentMonth = viewYear === today.getFullYear() && viewMonth === today.getMonth();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const daysElapsed = isCurrentMonth ? today.getDate() : daysInMonth;
    const activeTasks = tasks.filter(t => t.wakeUp || totalH(t) > 0 || t.jobCount > 0);
    const completionPct = daysElapsed > 0 ? Math.round((activeTasks.length / daysElapsed) * 100) : 0;
    const totalL = tasks.reduce((a, t) => a + (t.learningHours || 0), 0);
    const totalD = tasks.reduce((a, t) => a + (t.dsaHours || 0), 0);
    const totalP = tasks.reduce((a, t) => a + (t.projectHours || 0), 0);
    const totalJ = tasks.reduce((a, t) => a + (t.jobCount || 0), 0);
    const total  = tasks.reduce((a, t) => a + totalH(t), 0);
    const avgHours = tasks.length > 0 ? (total / tasks.length).toFixed(1) : 0;
    const wakeUpDays = tasks.filter(t => t.wakeUp).length;
    return { completionPct, totalL, totalD, totalP, totalJ, total, avgHours, wakeUpDays, activeDays: activeTasks.length, daysElapsed };
  }, [tasks, viewYear, viewMonth]);

  const barData = useMemo(() => {
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const t = tasks.find(t => t.date === dateStr);
      return {
        day, dateStr,
        hours: t ? (t.learningHours || 0) + (t.dsaHours || 0) + (t.projectHours || 0) : 0,
        isPast: dateStr <= todayStr,
        isToday: dateStr === todayStr,
      };
    });
  }, [tasks, viewYear, viewMonth, todayStr]);

  const maxHours = Math.max(...barData.map(b => b.hours), 1);

  return (
    <div className="tracker-panel">
      <div className="tracker-scroll ma-scroll">
        {/* Header + nav */}
        <div className="tracker-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
          <div>
            <h2>Monthly Analytics</h2>
            <p>{MONTHS[viewMonth]} {viewYear}</p>
          </div>
          <div className="analytics-nav-row" style={{ paddingTop: '2px', flexShrink: 0 }}>
            <button className="calendar-nav-btn dark" onClick={prevMonth} aria-label="Previous month">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <button className="calendar-nav-btn dark" onClick={nextMonth} disabled={!canGoNext} aria-label="Next month">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        </div>

        {loading && <div className="tracker-loading"><div className="tracker-spinner" /></div>}
        {error && <div className="tracker-error">{error}</div>}

        {!loading && !error && !stats && (
          <div className="tracker-empty section-card">No entries found for {MONTHS[viewMonth]} {viewYear}.</div>
        )}

        {!loading && !error && stats && (
          <>
            <div className="analytics-meta-grid ma-meta anim-fade-in-up">
              <div className="analytics-meta-item">
                <span className="analytics-meta-label">Completion</span>
                <span className="analytics-meta-value">{stats.completionPct}%</span>
                <span className="analytics-meta-unit">{stats.activeDays}/{stats.daysElapsed} days active</span>
              </div>
              <div className="analytics-meta-item">
                <span className="analytics-meta-label">Total Hours</span>
                <span className="analytics-meta-value">{stats.total.toFixed(0)}</span>
                <span className="analytics-meta-unit">combined hours</span>
              </div>
              <div className="analytics-meta-item">
                <span className="analytics-meta-label">Avg / Day</span>
                <span className="analytics-meta-value">{stats.avgHours}</span>
                <span className="analytics-meta-unit">hours per logged day</span>
              </div>
              <div className="analytics-meta-item">
                <span className="analytics-meta-label">Applications</span>
                <span className="analytics-meta-value">{stats.totalJ}</span>
                <span className="analytics-meta-unit">jobs applied</span>
              </div>
              <div className="analytics-meta-item">
                <span className="analytics-meta-label">Wake-Up</span>
                <span className="analytics-meta-value">
                  {tasks.length > 0 ? Math.round((stats.wakeUpDays / tasks.length) * 100) : 0}%
                </span>
                <span className="analytics-meta-unit">{stats.wakeUpDays}/{tasks.length} days</span>
              </div>
            </div>

            {/* Category breakdown */}
            <div className="section-card ma-breakdown anim-fade-in-up">
              <div className="section-card-title">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                  strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                  <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" />
                  <line x1="6" y1="20" x2="6" y2="14" />
                </svg>
                Category Breakdown
              </div>
              <ProgressRow label={`Learning — ${stats.totalL.toFixed(1)}h`} value={stats.totalL} max={stats.total || 1} />
              <ProgressRow label={`DSA — ${stats.totalD.toFixed(1)}h`}      value={stats.totalD} max={stats.total || 1} colorClass="warning" />
              <ProgressRow label={`Projects — ${stats.totalP.toFixed(1)}h`} value={stats.totalP} max={stats.total || 1} colorClass="success" />
            </div>

            {/* Daily trend bar chart */}
            <div className="section-card ma-chart anim-fade-in-up">
              <div className="section-card-title">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                  strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
                Daily Trend — {MONTHS[viewMonth]}
              </div>
              <div className="bar-chart" style={{ gap: '2px' }}>
                {barData.map(b => (
                  <div key={b.dateStr} className="bar-chart-col">
                    <div
                      className="bar-chart-bar"
                      style={{
                        height: `${b.isPast && b.hours > 0 ? Math.max(Math.round((b.hours / maxHours) * 100), 4) : b.isPast ? 2 : 4}%`,
                        opacity: b.isToday ? 1 : b.isPast ? (b.hours > 0 ? 0.78 : 0.2) : 0.12,
                        minHeight: b.isPast ? '2px' : '4px',
                      }}
                      title={`${b.dateStr}: ${b.hours.toFixed(1)}h`}
                    />
                    <span className="bar-chart-label"
                      style={{ fontSize: '9px', color: b.isToday ? 'var(--primary)' : undefined }}>
                      {b.day % 5 === 0 || b.day === 1 ? b.day : ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MonthlyAnalytics;
