import React, { useState, useRef, useLayoutEffect } from 'react';

/**
 * BottomNav — mobile-only fixed bottom navigation.
 * Shows first MAX_PER_ROW tabs + a More/Less expander.
 * Includes a "Discuss" chat tab that triggers onOpenChat.
 *
 * Inspired by KHUB BottomNav component.
 */

const MAX_PER_ROW = 5;

const TabButton = ({ tab, isActive, onClick }) => (
  <button
    onClick={onClick}
    aria-pressed={isActive}
    aria-label={tab.label}
    className={`bnav-tab${isActive ? ' active' : ''}`}
  >
    <div className="bnav-tab-icon-wrap">
      {tab.icon}
    </div>
    <span className="bnav-tab-label">{tab.label}</span>
  </button>
);

const BottomNav = ({ tabs = [], active, onChange = () => {}, onOpenChat }) => {
  const [expanded, setExpanded] = useState(false);

  const allTabs = [...tabs];

  const MAX_FIRST_ROW = 4; // We will show 4 tabs + More = 5 items total
  const hasMore = allTabs.length > MAX_FIRST_ROW;
  
  // Assemble first row: first 4 tabs
  const firstRow = hasMore ? allTabs.slice(0, MAX_FIRST_ROW) : allTabs;
  const remaining = hasMore ? allTabs.slice(MAX_FIRST_ROW) : [];

  const extraRows = [];
  for (let i = 0; i < remaining.length; i += MAX_PER_ROW) {
    extraRows.push(remaining.slice(i, i + MAX_PER_ROW));
  }

  const handleTabClick = (tabId) => {
    onChange(tabId);
    setExpanded(false);
  };

  return (
    <nav className="bnav">
      {/* Drag handle */}
      <div className="bnav-handle-wrap">
        <div className="bnav-handle" />
      </div>

      <div className="bnav-content">
        {/* First row */}
        <div className="bnav-row">
          {firstRow.map((tab) => (
            <TabButton
              key={tab.id}
              tab={tab}
              isActive={active === tab.id}
              onClick={() => handleTabClick(tab.id)}
            />
          ))}

          {hasMore && (
            <button
              onClick={() => setExpanded((s) => !s)}
              aria-label={expanded ? 'Show less' : 'Show more'}
              className="bnav-tab"
            >
              <div className="bnav-tab-icon-wrap">
                <svg
                  viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                  style={{
                    transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                >
                  <polyline points="18 15 12 9 6 15"/>
                </svg>
              </div>
              <span className="bnav-tab-label">{expanded ? 'Less' : 'More'}</span>
            </button>
          )}
        </div>

        {/* Expanded rows */}
        {hasMore && (
          <div
            className="bnav-expand"
            style={{
              maxHeight: expanded ? '500px' : '0px',
              opacity: expanded ? 1 : 0,
            }}
          >
            <div className="bnav-expand-inner">
              {extraRows.map((row, rIdx) => (
                <div key={rIdx} className="bnav-row">
                  {row.map((tab) => (
                    <TabButton
                      key={tab.id}
                      tab={tab}
                      isActive={active === tab.id}
                      onClick={() => handleTabClick(tab.id)}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default BottomNav;
