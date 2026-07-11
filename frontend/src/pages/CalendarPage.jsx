import React, { useState } from 'react';
import { useMonthTasks, toDateStr } from '../hooks/useTasks';
import '../styles/Tracker.css';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function daysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function firstDayOfWeek(year, month) {
  const d = new Date(year, month, 1).getDay();
  return d === 0 ? 6 : d - 1;
}

const sum = (arr, field) => arr.reduce((acc, t) => acc + (t[field] || 0), 0);

const CalendarPage = ({ currentUser, onSelectDate }) => {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const monthStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`;
  const { tasks, loading } = useMonthTasks(currentUser._id, monthStr);

  const hoursByDate = {};
  tasks.forEach(t => {
    hoursByDate[t.date] = (t.learningHours || 0) + (t.dsaHours || 0) + (t.projectHours || 0);
  });
  const maxDayHours = Math.max(...Object.values(hoursByDate), 1);
  const bestDay = tasks.reduce((best, t) => {
    const h = (t.learningHours || 0) + (t.dsaHours || 0) + (t.projectHours || 0);
    return h > (best?.h || 0) ? { date: t.date, h } : best;
  }, null);

  const todayStr = toDateStr(today);
  const totalDays = daysInMonth(viewYear, viewMonth);
  const startOffset = firstDayOfWeek(viewYear, viewMonth);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  };

  const handleDayClick = day => {
    const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    if (dateStr > todayStr) return;
    onSelectDate(dateStr);
  };

  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push({ empty: true, key: `e${i}` });
  for (let d = 1; d <= totalDays; d++) {
    const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const h = hoursByDate[dateStr] || 0;
    const level = h === 0 ? 0 : Math.min(4, Math.max(1, Math.ceil((h / maxDayHours) * 4)));
    cells.push({
      day: d, dateStr, level,
      isToday: dateStr === todayStr,
      hasData: h > 0,
      isFuture: dateStr > todayStr,
    });
  }

  return (
    <div className="tracker-panel">
      <div className="tracker-scroll cal-scroll">
        {/* <div className="tracker-header">
          <h2>Calendar</h2>
          <p>Tap any past date to view or edit its entry</p>
        </div> */}

        <div className="calendar-wrap anim-scale-in">
          {/* Navigation */}
          <div className="calendar-nav">
            <button className="calendar-nav-btn" onClick={() => setViewYear(y => y - 1)}
              title="Previous year" aria-label="Previous year">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round">
                <polyline points="11 17 6 12 11 7" /><polyline points="18 17 13 12 18 7" />
              </svg>
            </button>
            <button className="calendar-nav-btn" onClick={prevMonth} aria-label="Previous month">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>

            <span className="calendar-nav-title">{MONTHS[viewMonth]} {viewYear}</span>

            <button className="calendar-nav-btn" onClick={nextMonth} aria-label="Next month">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
            <button className="calendar-nav-btn" onClick={() => setViewYear(y => y + 1)}
              title="Next year" aria-label="Next year">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round">
                <polyline points="13 17 18 12 13 7" /><polyline points="6 17 11 12 6 7" />
              </svg>
            </button>
          </div>

          {/* Grid */}
          <div className="calendar-grid">
            <div className="calendar-day-labels">
              {DAYS.map(d => <div key={d} className="calendar-day-label">{d}</div>)}
            </div>
            <div className="calendar-days">
              {cells.map(cell =>
                cell.empty ? (
                  <div key={cell.key} className="calendar-day empty" />
                ) : (
                  <div
                    key={cell.dateStr}
                    className={['calendar-day',
                      cell.isToday ? 'today' : '',
                      cell.hasData ? 'has-data' : '',
                      cell.isFuture ? 'future' : '',
                    ].filter(Boolean).join(' ')}
                    title={cell.isFuture ? undefined : `${cell.dateStr}${cell.hasData ? ` — ${(hoursByDate[cell.dateStr]).toFixed(1)}h` : ''}`}
                    onClick={() => !cell.isFuture && handleDayClick(cell.day)}
                    role={cell.isFuture ? undefined : 'button'}
                    tabIndex={cell.isFuture ? -1 : 0}
                    onKeyDown={e => e.key === 'Enter' && !cell.isFuture && handleDayClick(cell.day)}
                    aria-label={cell.dateStr}
                  >
                    {cell.day}
                  </div>
                )
              )}
            </div>
          </div>

          {/* Legend */}
          <div className="calendar-legend">
            {loading && (
              <span style={{ fontSize: '11px', color: 'var(--text-light)' }}>Loading…</span>
            )}
            {!loading && (
              <>
                <div className="calendar-legend-item">
                  <span className="calendar-legend-dot" />
                  Today
                </div>
                <div className="calendar-legend-item">
                  <span className="calendar-legend-dot faded" />
                  Has entry
                </div>
              </>
            )}
          </div>
        </div>

        {/* Monthly summary — unique panel: ring stat + bars + chips */}
        {tasks.length > 0 && (() => {
          const dim = daysInMonth(viewYear, viewMonth);
          const daysLogged = tasks.length;
          const pctLogged = Math.round((daysLogged / dim) * 100);
          const learning = sum(tasks, 'learningHours');
          const dsa = sum(tasks, 'dsaHours');
          const projects = sum(tasks, 'projectHours');
          const jobs = sum(tasks, 'jobCount');
          const wake = tasks.filter(t => t.wakeUp).length;
          const maxH = Math.max(learning, dsa, projects, 1);

          return (
            <div className="section-card cal-insight anim-fade-in-up">
              <div className="section-card-title">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                  strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                  <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                </svg>
                {MONTHS[viewMonth]} at a glance
              </div>

              {/* Hero ring */}
              <div className="cal-insight-hero">
                <div className="cal-ring" style={{ '--pct': pctLogged }}>
                  <div className="cal-ring-inner">
                    <span className="cal-ring-num">{daysLogged}</span>
                    <span className="cal-ring-den">/ {dim}</span>
                  </div>
                </div>
                <div className="cal-insight-hero-text">
                  <span className="cal-insight-hero-label">Days logged</span>
                  <span className="cal-insight-hero-sub">{pctLogged}% of the month</span>
                </div>
              </div>

              {/* Time breakdown bars */}
              <div className="cal-insight-bars">
                <div className="cal-insight-bar-row">
                  <span className="cal-insight-bar-label">Learning</span>
                  <div className="cal-insight-bar-track">
                    <div className="cal-insight-bar-fill c1" style={{ width: `${(learning/maxH)*100}%` }} />
                  </div>
                  <span className="cal-insight-bar-val">{learning.toFixed(0)}h</span>
                </div>
                <div className="cal-insight-bar-row">
                  <span className="cal-insight-bar-label">DSA</span>
                  <div className="cal-insight-bar-track">
                    <div className="cal-insight-bar-fill c2" style={{ width: `${(dsa/maxH)*100}%` }} />
                  </div>
                  <span className="cal-insight-bar-val">{dsa.toFixed(0)}h</span>
                </div>
                <div className="cal-insight-bar-row">
                  <span className="cal-insight-bar-label">Projects</span>
                  <div className="cal-insight-bar-track">
                    <div className="cal-insight-bar-fill c3" style={{ width: `${(projects/maxH)*100}%` }} />
                  </div>
                  <span className="cal-insight-bar-val">{projects.toFixed(0)}h</span>
                </div>
              </div>

              {/* Best day spotlight */}
              {bestDay && (() => {
                const [by, bm, bd] = bestDay.date.split('-').map(Number);
                const label = new Date(by, bm - 1, bd).toLocaleDateString('en-US', {
                  weekday: 'short', month: 'short', day: 'numeric',
                });
                return (
                  <div className="cal-best">
                    <div className="cal-best-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                        strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                    </div>
                    <div className="cal-best-body">
                      <span className="cal-best-title">Best day</span>
                      <span className="cal-best-detail">{label} · {bestDay.h.toFixed(1)}h</span>
                    </div>
                  </div>
                );
              })()}

              {/* Chip row */}
              <div className="cal-insight-chips">
                <div className="cal-chip">
                  <span className="cal-chip-value">{jobs}</span>
                  <span className="cal-chip-label">Applications</span>
                </div>
                <div className="cal-chip">
                  <span className="cal-chip-value">{wake}<span className="cal-chip-den">/{daysLogged}</span></span>
                  <span className="cal-chip-label">Wake-ups</span>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
};

export default CalendarPage;
