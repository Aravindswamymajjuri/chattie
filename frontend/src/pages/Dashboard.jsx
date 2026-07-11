import React from 'react';
import { useDashboardStats, useRangeTasks, todayStr, thisWeekStart, toDateStr } from '../hooks/useTasks';
import '../styles/Tracker.css';

const GOAL = { learning: 4, dsa: 2, project: 3 };

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

const CategoryRow = ({ label, value, max, colorClass }) => {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="dash-cat">
      <div className="dash-cat-head">
        <span className="dash-cat-label">{label}</span>
        <span className="dash-cat-value">
          <strong>{value}h</strong>
          <span className="dash-cat-target"> / {max}h</span>
        </span>
      </div>
      <div className="dash-cat-track">
        <div className={`dash-cat-fill ${colorClass || ''}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

const Dashboard = ({ currentUser, onNavigate }) => {
  const { stats, loading, error } = useDashboardStats(currentUser._id);

  // Week data for sparkline
  const weekStart = thisWeekStart();
  const weekEnd = toDateStr(new Date(new Date(weekStart).getTime() + 6 * 86400000));
  const { tasks: weekTasks } = useRangeTasks(currentUser._id, weekStart, weekEnd);

  const dayLabel = new Date().toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  });

  if (loading) return (
    <div className="tracker-panel">
      <div className="tracker-scroll dash-scroll">
        <div className="tracker-loading"><div className="tracker-spinner" /></div>
      </div>
    </div>
  );

  if (error) return (
    <div className="tracker-panel">
      <div className="tracker-scroll dash-scroll">
        <div className="tracker-error">Failed to load: {error}</div>
      </div>
    </div>
  );

  const t = stats?.today;
  const a = stats?.allTime || {};
  const w = stats?.weekly || {};
  const todayHours = t ? (t.learningHours + t.dsaHours + t.projectHours) : 0;

  // Build 7-day sparkline (Mon-Sun)
  const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(new Date(weekStart).getTime() + i * 86400000);
    const dateStr = toDateStr(d);
    const task = weekTasks.find(tk => tk.date === dateStr);
    const h = task ? (task.learningHours + task.dsaHours + task.projectHours) : 0;
    return { dateStr, h, isToday: dateStr === todayStr() };
  });
  const weekMax = Math.max(...weekDays.map(d => d.h), 4);
  const weekTotal = weekDays.reduce((s, d) => s + d.h, 0);

  return (
    <div className="tracker-panel">
      <div className="tracker-scroll dash-scroll">
        {/* Greeting row */}
        <header className="dash-greet anim-fade-in-up">
          <div className="dash-greet-text">
            <span className="dash-greet-line1">Good {greeting()},</span>
            <h1 className="dash-greet-line2">{currentUser.username}</h1>
          </div>
          <span className="dash-greet-date">{dayLabel}</span>
        </header>

        {/* Hero row — Today + Streak + Wake */}
        <section className="dash-hero anim-fade-in-up">
          <div className="dash-hero-today">
            <span className="dash-hero-label">Today</span>
            <div className="dash-hero-num">
              <span className="dash-hero-big">{todayHours.toFixed(1)}</span>
              <span className="dash-hero-unit">h</span>
            </div>
            <span className="dash-hero-sub">
              {t?.jobCount || 0} application{t?.jobCount === 1 ? '' : 's'} sent
            </span>
          </div>

          <div className="dash-hero-side">
            <div className="dash-hero-tile">
              <span className="dash-hero-tile-value">{a.streak || 0}</span>
              <span className="dash-hero-tile-label">day streak</span>
            </div>
            <div className={`dash-hero-tile ${t?.wakeUp ? 'accent' : 'muted'}`}>
              <span className="dash-hero-tile-value">{t?.wakeUp ? '✓' : '—'}</span>
              <span className="dash-hero-tile-label">wake-up</span>
            </div>
          </div>
        </section>

        {/* Today's focus — inline bars */}
        <section className="dash-block dash-block-focus anim-fade-in-up">
          <div className="dash-block-head">
            <span className="dash-block-title">Today's focus</span>
            <button className="dash-block-link" onClick={() => onNavigate('daily')}>Edit</button>
          </div>
          <CategoryRow label="Learning" value={t?.learningHours || 0} max={GOAL.learning} colorClass="c1" />
          <CategoryRow label="DSA" value={t?.dsaHours || 0} max={GOAL.dsa} colorClass="c2" />
          <CategoryRow label="Projects" value={t?.projectHours || 0} max={GOAL.project} colorClass="c3" />
        </section>

        {/* Week sparkline */}
        <section className="dash-block dash-block-week anim-fade-in-up">
          <div className="dash-block-head">
            <span className="dash-block-title">This week</span>
            <span className="dash-block-meta">{weekTotal.toFixed(1)}h total</span>
          </div>
          <div className="dash-spark">
            {weekDays.map((d, i) => (
              <div key={d.dateStr} className={`dash-spark-col${d.isToday ? ' today' : ''}`}>
                <div
                  className="dash-spark-bar"
                  style={{ height: `${Math.max(6, (d.h / weekMax) * 100)}%` }}
                  title={`${d.dateStr}: ${d.h.toFixed(1)}h`}
                />
                <span className="dash-spark-label">{dayLabels[i]}</span>
              </div>
            ))}
          </div>
        </section>

        {/* All-time — compact inline row */}
        <section className="dash-alltime anim-fade-in-up">
          <span className="dash-alltime-item">
            <strong>{Math.round(a.learningHours || 0)}h</strong> Learning
          </span>
          <span className="dash-alltime-dot" />
          <span className="dash-alltime-item">
            <strong>{Math.round(a.dsaHours || 0)}h</strong> DSA
          </span>
          <span className="dash-alltime-dot" />
          <span className="dash-alltime-item">
            <strong>{Math.round(a.projectHours || 0)}h</strong> Projects
          </span>
          <span className="dash-alltime-dot" />
          <span className="dash-alltime-item">
            <strong>{a.jobCount || 0}</strong> applied
          </span>
        </section>

        {/* Actions */}
        <div className="dash-actions">
          <button className="dash-btn primary" onClick={() => onNavigate('daily')}>
            Log Today
          </button>
          <button className="dash-btn ghost" onClick={() => onNavigate('calendar')}>
            Open Calendar
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
