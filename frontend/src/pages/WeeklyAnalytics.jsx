import React, { useMemo } from 'react';
import { useRangeTasks, thisWeekStart, todayStr, toDateStr } from '../hooks/useTasks';
import '../styles/Tracker.css';

const DAYS_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function getWeekDates() {
  const start = new Date(thisWeekStart());
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return toDateStr(d);
  });
}

const ProgressRow = ({ label, value, max, unit = 'hrs', colorClass = '' }) => {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="progress-row">
      <div className="progress-label-row">
        <span className="progress-label">{label}</span>
        <span className="progress-value">
          {value}{unit ? ` ${unit}` : ''}
          <span style={{ fontWeight: 400, color: 'var(--text-light)' }}> / {max}{unit ? ` ${unit}` : ''}</span>
        </span>
      </div>
      <div className="progress-track">
        <div className={`progress-fill ${colorClass}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
    strokeLinecap="round" strokeLinejoin="round" width="12" height="12">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const XIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
    strokeLinecap="round" strokeLinejoin="round" width="12" height="12">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const WeeklyAnalytics = ({ currentUser }) => {
  const weekDates = useMemo(() => getWeekDates(), []);
  const from = weekDates[0];
  const to = weekDates[6];
  const today = todayStr();

  const { tasks, loading, error } = useRangeTasks(currentUser._id, from, to);

  const taskMap = useMemo(() => {
    const m = {};
    tasks.forEach(t => { m[t.date] = t; });
    return m;
  }, [tasks]);

  const totalHours = t => t ? (t.learningHours || 0) + (t.dsaHours || 0) + (t.projectHours || 0) : 0;

  const weekStats = useMemo(() => {
    const pastDates = weekDates.filter(d => d <= today);
    const pastTasks = pastDates.map(d => taskMap[d]).filter(Boolean);
    return {
      learningHours: pastTasks.reduce((a, t) => a + (t.learningHours || 0), 0),
      dsaHours:      pastTasks.reduce((a, t) => a + (t.dsaHours || 0), 0),
      projectHours:  pastTasks.reduce((a, t) => a + (t.projectHours || 0), 0),
      jobCount:      pastTasks.reduce((a, t) => a + (t.jobCount || 0), 0),
      wakeUpDays:    pastTasks.filter(t => t.wakeUp).length,
      loggedDays:    pastTasks.length,
      totalDays:     pastDates.length,
      totalHours:    pastTasks.reduce((a, t) => a + totalHours(t), 0),
    };
  }, [tasks, weekDates, today, taskMap]);

  const wakeUpPct = weekStats.totalDays > 0
    ? Math.round((weekStats.wakeUpDays / weekStats.totalDays) * 100) : 0;

  const barData = weekDates.map((d, i) => {
    const t = taskMap[d];
    return { date: d, day: DAYS_SHORT[i], hours: t ? totalHours(t) : 0,
      isPast: d <= today, isToday: d === today };
  });
  const maxHours = Math.max(...barData.map(b => b.hours), 1);

  const weekLabel = (() => {
    const [y, m, d] = from.split('-').map(Number);
    const [y2, m2, d2] = to.split('-').map(Number);
    const f = new Date(y, m - 1, d);
    const t2 = new Date(y2, m2 - 1, d2);
    return `${f.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${t2.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  })();

  return (
    <div className="tracker-panel">
      <div className="tracker-scroll wa-scroll">
        <div className="tracker-header">
          <h2>Weekly Analytics</h2>
          <p>{weekLabel}</p>
        </div>

        {loading && <div className="tracker-loading"><div className="tracker-spinner" /></div>}
        {error && <div className="tracker-error">{error}</div>}

        {!loading && !error && (
          <>
            {/* Summary meta cards */}
            <div className="analytics-meta-grid wa-meta anim-fade-in-up">
              <div className="analytics-meta-item">
                <span className="analytics-meta-label">Learning</span>
                <span className="analytics-meta-value">{weekStats.learningHours.toFixed(1)}</span>
                <span className="analytics-meta-unit">hours this week</span>
              </div>
              <div className="analytics-meta-item">
                <span className="analytics-meta-label">DSA</span>
                <span className="analytics-meta-value">{weekStats.dsaHours.toFixed(1)}</span>
                <span className="analytics-meta-unit">hours this week</span>
              </div>
              <div className="analytics-meta-item">
                <span className="analytics-meta-label">Projects</span>
                <span className="analytics-meta-value">{weekStats.projectHours.toFixed(1)}</span>
                <span className="analytics-meta-unit">hours this week</span>
              </div>
              <div className="analytics-meta-item">
                <span className="analytics-meta-label">Applications</span>
                <span className="analytics-meta-value">{weekStats.jobCount}</span>
                <span className="analytics-meta-unit">jobs applied</span>
              </div>
              <div className="analytics-meta-item">
                <span className="analytics-meta-label">Wake-Up</span>
                <span className="analytics-meta-value">{wakeUpPct}%</span>
                <span className="analytics-meta-unit">{weekStats.wakeUpDays}/{weekStats.totalDays} days</span>
              </div>
              <div className="analytics-meta-item">
                <span className="analytics-meta-label">Total Hours</span>
                <span className="analytics-meta-value">{weekStats.totalHours.toFixed(1)}</span>
                <span className="analytics-meta-unit">combined</span>
              </div>
            </div>

            {/* Progress bars */}
            <div className="section-card wa-goals anim-fade-in-up">
              <div className="section-card-title">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                  strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
                Weekly Progress vs Goals
              </div>
              <ProgressRow label="Learning Hours"     value={weekStats.learningHours.toFixed(1)} max={20} />
              <ProgressRow label="DSA Hours"          value={weekStats.dsaHours.toFixed(1)}      max={10} colorClass="warning" />
              <ProgressRow label="Project Hours"      value={weekStats.projectHours.toFixed(1)}  max={15} colorClass="success" />
              <ProgressRow label="Job Applications"   value={weekStats.jobCount}                 max={20} unit="" />
              <ProgressRow label="Wake-Up Consistency" value={wakeUpPct} max={100} unit="%" colorClass="success" />
            </div>

            {/* Bar chart */}
            <div className="section-card wa-chart anim-fade-in-up">
              <div className="section-card-title">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                  strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                  <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" />
                  <line x1="6" y1="20" x2="6" y2="14" />
                </svg>
                Daily Hours This Week
              </div>
              <div className="bar-chart">
                {barData.map(b => (
                  <div key={b.date} className="bar-chart-col">
                    <div
                      className="bar-chart-bar"
                      style={{
                        height: `${b.isPast ? Math.max(Math.round((b.hours / maxHours) * 100), b.hours > 0 ? 4 : 2) : 4}%`,
                        opacity: b.isToday ? 1 : b.isPast ? 0.7 : 0.18,
                      }}
                      title={`${b.date}: ${b.hours.toFixed(1)}h`}
                    />
                    <span className="bar-chart-label"
                      style={{ color: b.isToday ? 'var(--primary)' : undefined, fontWeight: b.isToday ? 700 : undefined }}>
                      {b.day}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Day breakdown — cards on mobile, table on desktop */}
            <div className="section-card wa-table anim-fade-in-up">
              <div className="section-card-title">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                  strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                  <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                </svg>
                Day-by-Day Breakdown
              </div>

              {/* Mobile: day cards */}
              <div className="day-cards week-cards-mobile" style={{ display: 'none' }}>
                {weekDates.map((date, i) => {
                  const t = taskMap[date];
                  const isPast = date <= today;
                  const isToday = date === today;
                  const hrs = totalHours(t);
                  return (
                    <div key={date}
                      className={`day-card${isToday ? ' today-card' : ''}${!isPast ? ' future-card' : ''}`}>
                      <div className="day-card-date">
                        <div className={`day-card-day${isToday ? ' today-label' : ''}`}>{DAYS_SHORT[i]}</div>
                        <div className="day-card-mmdd">{date.slice(5)}</div>
                      </div>
                      <div className="day-card-stats">
                        <div className="day-stat-chip">
                          <span className="day-stat-chip-value">{isPast ? (t?.learningHours?.toFixed(1) || '0') : '—'}</span>
                          <span className="day-stat-chip-label">Lrn</span>
                        </div>
                        <div className="day-stat-chip">
                          <span className="day-stat-chip-value">{isPast ? (t?.dsaHours?.toFixed(1) || '0') : '—'}</span>
                          <span className="day-stat-chip-label">DSA</span>
                        </div>
                        <div className="day-stat-chip">
                          <span className="day-stat-chip-value">{isPast ? (t?.projectHours?.toFixed(1) || '0') : '—'}</span>
                          <span className="day-stat-chip-label">Prj</span>
                        </div>
                        <div className="day-stat-chip">
                          <span className="day-stat-chip-value" style={{ color: 'var(--primary)', fontWeight: 700 }}>
                            {isPast ? hrs.toFixed(1) : '—'}h
                          </span>
                          <span className="day-stat-chip-label">Total</span>
                        </div>
                      </div>
                      {isPast && (
                        <div className={`day-card-wake ${t?.wakeUp ? 'done' : 'missed'}`}>
                          {t?.wakeUp ? <CheckIcon /> : <XIcon />}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Desktop: table */}
              <div className="week-table-desktop">
                <div className="tracker-table-wrap">
                  <table className="week-table">
                    <thead>
                      <tr>
                        <th>Day</th><th>Wake</th><th>Learn</th>
                        <th>DSA</th><th>Project</th><th>Jobs</th><th>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {weekDates.map((date, i) => {
                        const t = taskMap[date];
                        const isPast = date <= today;
                        const isToday = date === today;
                        return (
                          <tr key={date} className={isToday ? 'today-row' : ''} style={{ opacity: isPast ? 1 : 0.3 }}>
                            <td>
                              {DAYS_SHORT[i]}
                              <span style={{ marginLeft: '5px', fontSize: '11px', color: 'var(--text-light)' }}>
                                {date.slice(5)}
                              </span>
                            </td>
                            <td style={{ color: t?.wakeUp ? 'var(--color-success)' : 'var(--text-light)' }}>
                              {isPast ? (t?.wakeUp ? '✓' : '✗') : '—'}
                            </td>
                            <td>{isPast ? (t?.learningHours?.toFixed(1) || '0') : '—'}</td>
                            <td>{isPast ? (t?.dsaHours?.toFixed(1) || '0') : '—'}</td>
                            <td>{isPast ? (t?.projectHours?.toFixed(1) || '0') : '—'}</td>
                            <td>{isPast ? (t?.jobCount || '0') : '—'}</td>
                            <td style={{ fontWeight: 600, color: 'var(--primary)' }}>
                              {isPast ? totalHours(t).toFixed(1) : '—'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default WeeklyAnalytics;
