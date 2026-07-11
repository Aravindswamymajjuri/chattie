import React, { useState, useMemo } from 'react';
import { useYearTasks, toDateStr } from '../hooks/useTasks';
import '../styles/Tracker.css';

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const totalHours = t => (t.learningHours || 0) + (t.dsaHours || 0) + (t.projectHours || 0);

function computeLongestStreak(tasks) {
  if (!tasks.length) return 0;
  const sorted = [...tasks].sort((a, b) => (a.date < b.date ? -1 : 1));
  let longest = 0, current = 0, prevDate = null;
  for (const t of sorted) {
    const hasActivity = t.wakeUp || totalHours(t) > 0 || t.jobCount > 0;
    if (!hasActivity) { current = 0; prevDate = null; continue; }
    if (!prevDate) { current = 1; }
    else {
      const diff = (new Date(t.date) - new Date(prevDate)) / 86400000;
      current = diff === 1 ? current + 1 : 1;
    }
    prevDate = t.date;
    if (current > longest) longest = current;
  }
  return longest;
}

const HeatmapMonth = ({ year, monthIdx, taskMap, maxHoursInDay }) => {
  const daysInMonth = new Date(year, monthIdx + 1, 0).getDate();
  const firstDay = new Date(year, monthIdx, 1).getDay();
  const startOffset = firstDay === 0 ? 6 : firstDay - 1;
  const todayStr = toDateStr(new Date());

  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(monthIdx + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const t = taskMap[dateStr];
    const h = t ? totalHours(t) : 0;
    const isFuture = dateStr > todayStr;
    let level = 0;
    if (!isFuture && h > 0) {
      if (h >= maxHoursInDay * 0.75) level = 4;
      else if (h >= maxHoursInDay * 0.5) level = 3;
      else if (h >= maxHoursInDay * 0.25) level = 2;
      else level = 1;
    }
    cells.push({ dateStr, level, hours: h, isFuture });
  }

  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  return (
    <div className="heatmap-month">
      <div className="heatmap-month-label">{MONTHS_SHORT[monthIdx]}</div>
      <div className="heatmap-weeks">
        {weeks.map((week, wi) => (
          <div key={wi} className="heatmap-col">
            {week.map((cell, di) =>
              cell === null ? (
                <div key={`e${di}`} className="heatmap-cell empty" />
              ) : (
                <div
                  key={cell.dateStr}
                  className={`heatmap-cell level-${cell.isFuture ? 0 : cell.level}`}
                  title={cell.isFuture ? '' : `${cell.dateStr}: ${cell.hours.toFixed(1)}h`}
                />
              )
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const YearlyAnalytics = ({ currentUser }) => {
  const thisYear = new Date().getFullYear();
  const [viewYear, setViewYear] = useState(thisYear);

  const { tasks, loading, error } = useYearTasks(currentUser._id, viewYear);

  const taskMap = useMemo(() => {
    const m = {};
    tasks.forEach(t => { m[t.date] = t; });
    return m;
  }, [tasks]);

  const allTimeTotals = useMemo(() => ({
    learning: tasks.reduce((a, t) => a + (t.learningHours || 0), 0),
    dsa:      tasks.reduce((a, t) => a + (t.dsaHours || 0), 0),
    projects: tasks.reduce((a, t) => a + (t.projectHours || 0), 0),
    jobs:     tasks.reduce((a, t) => a + (t.jobCount || 0), 0),
    totalH:   tasks.reduce((a, t) => a + totalHours(t), 0),
    longestStreak: computeLongestStreak(tasks),
  }), [tasks]);

  const maxHoursInDay = useMemo(
    () => Math.max(...tasks.map(t => totalHours(t)), 1),
    [tasks]
  );

  const monthlyBreakdown = useMemo(() => {
    return MONTHS_SHORT.map((_, mi) => {
      const prefix = `${viewYear}-${String(mi + 1).padStart(2, '0')}`;
      const mTasks = tasks.filter(t => t.date.startsWith(prefix));
      return {
        month: mi,
        count: mTasks.length,
        learning:  mTasks.reduce((a, t) => a + (t.learningHours || 0), 0),
        dsa:       mTasks.reduce((a, t) => a + (t.dsaHours || 0), 0),
        projects:  mTasks.reduce((a, t) => a + (t.projectHours || 0), 0),
        jobs:      mTasks.reduce((a, t) => a + (t.jobCount || 0), 0),
        totalH:    mTasks.reduce((a, t) => a + totalHours(t), 0),
        wakeUp:    mTasks.filter(t => t.wakeUp).length,
      };
    });
  }, [tasks, viewYear]);

  const bestMonth = useMemo(() => {
    const best = monthlyBreakdown.reduce((a, b) => (b.totalH > a.totalH ? b : a), monthlyBreakdown[0]);
    return best.totalH > 0 ? best : null;
  }, [monthlyBreakdown]);

  return (
    <div className="tracker-panel">
      <div className="tracker-scroll ya-scroll">
        {/* Header */}
        <div className="tracker-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
          <div>
            <h2>Yearly Analytics</h2>
            <p>{viewYear} overview</p>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', paddingTop: '2px', flexShrink: 0 }}>
            <button className="calendar-nav-btn dark" onClick={() => setViewYear(y => y - 1)} aria-label="Previous year">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', minWidth: '44px', textAlign: 'center' }}>
              {viewYear}
            </span>
            <button className="calendar-nav-btn dark" onClick={() => setViewYear(y => Math.min(y + 1, thisYear))}
              disabled={viewYear >= thisYear} aria-label="Next year">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        </div>

        {loading && <div className="tracker-loading"><div className="tracker-spinner" /></div>}
        {error && <div className="tracker-error">{error}</div>}

        {!loading && !error && (
          <>
            {/* Year totals */}
            <div className="analytics-meta-grid ya-meta anim-fade-in-up">
              <div className="analytics-meta-item">
                <span className="analytics-meta-label">Longest Streak</span>
                <span className="analytics-meta-value">{allTimeTotals.longestStreak}</span>
                <span className="analytics-meta-unit">consecutive days</span>
              </div>
              <div className="analytics-meta-item">
                <span className="analytics-meta-label">Best Month</span>
                <span className="analytics-meta-value">{bestMonth ? MONTHS_SHORT[bestMonth.month] : '—'}</span>
                <span className="analytics-meta-unit">{bestMonth ? `${bestMonth.totalH.toFixed(0)}h` : 'no data'}</span>
              </div>
              <div className="analytics-meta-item">
                <span className="analytics-meta-label">Total Learning</span>
                <span className="analytics-meta-value">{allTimeTotals.learning.toFixed(0)}</span>
                <span className="analytics-meta-unit">hours</span>
              </div>
              <div className="analytics-meta-item">
                <span className="analytics-meta-label">Total DSA</span>
                <span className="analytics-meta-value">{allTimeTotals.dsa.toFixed(0)}</span>
                <span className="analytics-meta-unit">hours</span>
              </div>
              <div className="analytics-meta-item">
                <span className="analytics-meta-label">Total Projects</span>
                <span className="analytics-meta-value">{allTimeTotals.projects.toFixed(0)}</span>
                <span className="analytics-meta-unit">hours</span>
              </div>
              <div className="analytics-meta-item">
                <span className="analytics-meta-label">Job Applications</span>
                <span className="analytics-meta-value">{allTimeTotals.jobs}</span>
                <span className="analytics-meta-unit">total applied</span>
              </div>
            </div>

            {/* Activity Heatmap — always visible, fits screen */}
            <div className="section-card ya-heatmap anim-fade-in-up">
              <div className="section-card-title">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                  strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <line x1="3" y1="9" x2="21" y2="9" /><line x1="3" y1="15" x2="21" y2="15" />
                  <line x1="9" y1="3" x2="9" y2="21" /><line x1="15" y1="3" x2="15" y2="21" />
                </svg>
                Activity Heatmap — {viewYear}
              </div>

              <div className="heatmap-fit">
                {MONTHS_SHORT.map((_, mi) => (
                  <HeatmapMonth key={mi} year={viewYear} monthIdx={mi} taskMap={taskMap} maxHoursInDay={maxHoursInDay} />
                ))}
              </div>
              <div className="heatmap-legend">
                <span>Less</span>
                {[0,1,2,3,4].map(l => (
                  <div key={l} className={`heatmap-cell level-${l}`} />
                ))}
                <span>More</span>
              </div>
            </div>

            {/* Monthly summary table */}
            <div className="section-card ya-table anim-fade-in-up">
              <div className="section-card-title">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                  strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                  <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                </svg>
                Monthly Summary
              </div>
              <div className="tracker-table-wrap">
                <table className="week-table">
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left' }}>Month</th>
                      <th>Days</th><th>Learn</th><th>DSA</th><th>Projects</th><th>Jobs</th><th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyBreakdown.map(m => (
                      <tr key={m.month}
                        style={{
                          opacity: m.count === 0 ? 0.35 : 1,
                          background: bestMonth && m.month === bestMonth.month && m.totalH > 0
                            ? 'var(--primary-tint)' : undefined,
                        }}>
                        <td style={{ textAlign: 'left' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {MONTHS_SHORT[m.month]}
                            {bestMonth && m.month === bestMonth.month && m.totalH > 0 && (
                              <span className="badge primary" style={{ fontSize: '9px', padding: '1px 5px' }}>Best</span>
                            )}
                          </span>
                        </td>
                        <td>{m.count}</td>
                        <td>{m.learning.toFixed(1)}</td>
                        <td>{m.dsa.toFixed(1)}</td>
                        <td>{m.projects.toFixed(1)}</td>
                        <td>{m.jobs}</td>
                        <td style={{ fontWeight: 700, color: 'var(--primary)' }}>
                          {m.totalH.toFixed(1)}h
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default YearlyAnalytics;
