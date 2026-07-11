import React, { useState, useEffect } from 'react';
import { useDayTask, todayStr } from '../hooks/useTasks';
import '../styles/Tracker.css';

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
    strokeLinecap="round" strokeLinejoin="round" width="13" height="13">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const NUMBER_FIELDS = [
  { key: 'learningHours', label: 'Learning Hours', description: 'Study / courses / reading', max: 24, step: 0.5, color: 'c1' },
  { key: 'dsaHours',      label: 'DSA Hours',      description: 'Data structures & algorithms', max: 24, step: 0.5, color: 'c2' },
  { key: 'projectHours',  label: 'Project Hours',  description: 'Building / coding projects',    max: 24, step: 0.5, color: 'c3' },
  { key: 'jobCount',      label: 'Job Applications', description: 'Number of jobs applied',     max: 999, step: 1 },
];

const GOAL = { learningHours: 4, dsaHours: 2, projectHours: 3 };

const DailyTracker = ({ currentUser, date: propDate, onBack }) => {
  const date = propDate || todayStr();
  const { task, loading, error, saving, saveError, save } = useDayTask(currentUser._id, date);

  const [form, setForm] = useState({
    wakeUp: false, learningHours: 0, dsaHours: 0, projectHours: 0, jobCount: 0, remarks: '',
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (task) {
      setForm({
        wakeUp: task.wakeUp ?? false,
        learningHours: task.learningHours ?? 0,
        dsaHours: task.dsaHours ?? 0,
        projectHours: task.projectHours ?? 0,
        jobCount: task.jobCount ?? 0,
        remarks: task.remarks ?? '',
      });
    }
  }, [task]);

  const set = (key, value) => { setForm(p => ({ ...p, [key]: value })); setSaved(false); };

  const handleSave = async () => {
    try {
      await save(form);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch { /* saveError set by hook */ }
  };

  const displayDate = (() => {
    const [y, m, d] = date.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });
  })();

  const isToday  = date === todayStr();
  const isFuture = date > todayStr();
  const totalHrs = form.learningHours + form.dsaHours + form.projectHours;

  return (
    <div className="tracker-panel">
      <div className="tracker-scroll dt-scroll">
        {/* Header */}
        <div className="tracker-header dt-header">
          <div>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {/* {onBack && (
                <button
                  onClick={onBack}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)',
                    padding: '0 4px 0 0', display: 'flex', alignItems: 'center' }}
                  aria-label="Back to calendar"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                    strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>
              )} */}
              {/* Daily Tracker */}
              <br />
              {isToday && <span className="badge primary">Today</span>}
            </h2>
            <p>{displayDate}</p>
          </div>
        </div>

        {isFuture && (
          <div className="tracker-warn dt-warn">
            You cannot log entries for future dates.
          </div>
        )}

        {loading ? (
          <div className="tracker-loading dt-loading"><div className="tracker-spinner" /></div>
        ) : error ? (
          <div className="tracker-error dt-err">{error}</div>
        ) : (
          <>
            {/* Form panel (left on desktop) */}
            <section className="section-card dt-form-panel anim-scale-in">
              <div className="section-card-title">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                  strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                {isFuture ? 'View Entry' : 'Edit Entry'}
              </div>

              <div className="dt-form">
                <div className={`dt-field${form.wakeUp ? ' active' : ''}`}>
                  <span className="dt-field-dot" />
                  <div className="dt-field-info">
                    <span className="dt-field-label">Morning Wake Up</span>
                    <span className="dt-field-desc">Completed on time</span>
                  </div>
                  <div className="dt-toggle-wrap">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={form.wakeUp}
                      className={`dt-toggle${form.wakeUp ? ' on' : ''}`}
                      onClick={() => !isFuture && set('wakeUp', !form.wakeUp)}
                      disabled={isFuture}
                    >
                      <span className="dt-toggle-thumb" />
                    </button>
                  </div>
                </div>

                {NUMBER_FIELDS.map(field => (
                  <div className={`dt-field${form[field.key] > 0 ? ' active' : ''}`} key={field.key}>
                    <span className={`dt-field-dot${field.color ? ` ${field.color}` : ''}`} />
                    <div className="dt-field-info">
                      <span className="dt-field-label">{field.label}</span>
                      <span className="dt-field-desc">{field.description}</span>
                    </div>
                    <input
                      type="number"
                      className="dt-number-input"
                      value={form[field.key]}
                      min="0"
                      max={field.max}
                      step={field.step}
                      onChange={e => set(field.key, parseFloat(e.target.value) || 0)}
                      disabled={isFuture}
                      aria-label={field.label}
                    />
                  </div>
                ))}
              </div>
            </section>

            {/* Remarks — separate panel, outside the form card */}
            <section className="dt-remarks-panel anim-fade-in-up">
              <div className="dt-remarks-head">
                <span className="dt-remarks-title">Remarks</span>
                <span className="dt-remarks-sub">Notes, thoughts, blockers…</span>
              </div>
              <textarea
                className="dt-textarea"
                value={form.remarks}
                placeholder="What went well? What got in the way?"
                onChange={e => set('remarks', e.target.value)}
                disabled={isFuture}
                maxLength={1000}
                rows={3}
              />
            </section>

            {/* Preview panel (right on desktop) — live mirror of what's entered */}
            <aside className="dt-preview anim-fade-in-up">
              <div className="dt-preview-hero">
                <span className="dt-preview-label">Today's total</span>
                <div className="dt-preview-num">
                  <span className="dt-preview-big">{totalHrs.toFixed(1)}</span>
                  <span className="dt-preview-unit">h</span>
                </div>
                <span className="dt-preview-sub">
                  {form.jobCount} application{form.jobCount === 1 ? '' : 's'} sent
                </span>
                <div className={`dt-preview-wake ${form.wakeUp ? 'on' : 'off'}`}>
                  {form.wakeUp ? <CheckIcon /> : null}
                  <span>{form.wakeUp ? 'Woke up on time' : 'Wake-up not logged'}</span>
                </div>
              </div>

              <div className="dt-preview-bars">
                {NUMBER_FIELDS.filter(f => f.color).map(f => {
                  const v = form[f.key] || 0;
                  const pct = Math.min(100, Math.round((v / GOAL[f.key]) * 100));
                  return (
                    <div key={f.key} className="dt-preview-bar">
                      <div className="dt-preview-bar-head">
                        <span className="dt-preview-bar-label">{f.label.replace(' Hours', '')}</span>
                        <span className="dt-preview-bar-val">
                          <strong>{v}h</strong>
                          <span className="dt-preview-bar-target"> / {GOAL[f.key]}h</span>
                        </span>
                      </div>
                      <div className="dt-preview-bar-track">
                        <div className={`dt-preview-bar-fill ${f.color}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {!isFuture && (
                <div className="dt-preview-save">
                  {saveError && (
                    <span className="save-status error">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                        strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                      {saveError}
                    </span>
                  )}
                  {saved && !saving && (
                    <span className="save-status success">
                      <CheckIcon />
                      Saved!
                    </span>
                  )}
                  <button className="save-btn dt-save-btn" onClick={handleSave} disabled={saving}>
                    {saving ? (
                      <><div className="tracker-spinner" style={{ width: '14px', height: '14px', borderWidth: '2px' }} />Saving…</>
                    ) : (
                      <>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                          strokeLinecap="round" strokeLinejoin="round" width="15" height="15">
                          <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                          <polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" />
                        </svg>
                        Save Entry
                      </>
                    )}
                  </button>
                </div>
              )}
            </aside>
          </>
        )}
      </div>
    </div>
  );
};

export default DailyTracker;
