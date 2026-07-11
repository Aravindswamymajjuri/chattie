import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { mediaAPI } from '../../utils/api';

const DefaultAvatar = () => (
  <svg className="default-avatar-svg" viewBox="0 0 212 212" width="100%" height="100%">
    <path fill="#DFE5E7" d="M106 0C47.5 0 0 47.5 0 106s47.5 106 106 106 106-47.5 106-106S164.5 0 106 0z"/>
    <path fill="#fff" d="M106 45c20.4 0 37 16.6 37 37s-16.6 37-37 37-37-16.6-37-37 16.6-37 37-37zm0 100c33.1 0 60 14.3 60 32v8H46v-8c0-17.7 26.9-32 60-32z"/>
  </svg>
);

const NAV_ITEMS = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
        <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
      </svg>
    ),
  },
  {
    id: 'calendar',
    label: 'Calendar',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    ),
  },
  {
    id: 'daily',
    label: 'Daily Tracker',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
      </svg>
    ),
  },
  {
    id: 'weekly',
    label: 'Weekly',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>
    ),
  },
  {
    id: 'monthly',
    label: 'Monthly',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
        <line x1="6" y1="20" x2="6" y2="14"/>
      </svg>
    ),
  },
  {
    id: 'yearly',
    label: 'Yearly',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L2 7l10 5 10-5-10-5z"/>
        <path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
      </svg>
    ),
  },
];

/**
 * TopNavBar — desktop-only horizontal header + tab strip.
 * Inspired by KHUB TPODashboard layout.
 *
 * Desktop: header bar with logo/title + user info + tab strip below.
 * Hidden on mobile (<= 768px); replaced by BottomNav.
 */
const TopNavBar = ({ currentUser, activePage, onNavigate, onLogout, onLogoClick }) => {
  const getProfilePicUrl = (profilePic) => mediaAPI.getProfilePicUrl(profilePic);

  // Tab overflow — auto-calculate how many fit
  const navRef = useRef(null);
  const moreRef = useRef(null);
  const dropdownRef = useRef(null);
  const [visibleTabsCount, setVisibleTabsCount] = useState(NAV_ITEMS.length);
  const [showMoreDropdown, setShowMoreDropdown] = useState(false);
  const [dropdownCoords, setDropdownCoords] = useState(null);

  // Reset visible count on resize
  useEffect(() => {
    const reset = () => {
      setVisibleTabsCount(NAV_ITEMS.length);
      setShowMoreDropdown(false);
    };
    window.addEventListener('resize', reset);
    return () => window.removeEventListener('resize', reset);
  }, []);

  // Auto-shrink tabs if overflowing
  useLayoutEffect(() => {
    const nav = navRef.current;
    if (!nav || nav.offsetWidth === 0) return;
    if (nav.scrollWidth > nav.clientWidth + 2 && visibleTabsCount > 1) {
      setVisibleTabsCount((v) => v - 1);
    }
  });

  // Reposition dropdown on scroll/resize while open
  useEffect(() => {
    if (!showMoreDropdown) return;
    const reposition = () => {
      if (!moreRef.current) return;
      const rect = moreRef.current.getBoundingClientRect();
      const width = 200;
      const top = rect.bottom + 6;
      const left = Math.max(8, rect.right - width);
      setDropdownCoords({ top, left, width });
    };
    reposition();
    window.addEventListener('resize', reposition);
    window.addEventListener('scroll', reposition, true);
    return () => {
      window.removeEventListener('resize', reposition);
      window.removeEventListener('scroll', reposition, true);
    };
  }, [showMoreDropdown]);

  // Close dropdown on outside click
  useEffect(() => {
    const onDocClick = (e) => {
      if (moreRef.current && moreRef.current.contains(e.target)) return;
      if (dropdownRef.current && dropdownRef.current.contains(e.target)) return;
      setShowMoreDropdown(false);
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  const handleMoreToggle = (e) => {
    e.stopPropagation();
    if (!moreRef.current) {
      setShowMoreDropdown((s) => !s);
      return;
    }
    const rect = moreRef.current.getBoundingClientRect();
    const width = 200;
    const top = rect.bottom + 6;
    const left = Math.max(8, rect.right - width);
    setDropdownCoords({ top, left, width });
    setShowMoreDropdown((s) => !s);
  };

  const handleTabClick = (id) => {
    onNavigate(id);
    setShowMoreDropdown(false);
  };

  return (
    <div className="trackr-topnav">
      {/* Header bar */}
      <div className="trackr-header-bar">
        <div className="trackr-header-left">
          <span
            className="trackr-logo-text"
            onClick={onLogoClick}
            style={{ cursor: 'pointer', userSelect: 'none' }}
          >Trackr</span>
        </div>
        <div className="trackr-header-right">
          <div className="trackr-user-info">
            <div className="trackr-user-avatar" title={currentUser.username}>
              {currentUser.profilePic ? (
                <img src={getProfilePicUrl(currentUser.profilePic)} alt={currentUser.username} />
              ) : (
                <DefaultAvatar />
              )}
            </div>
            <span className="trackr-user-name">{currentUser.username}</span>
            {/* Chevron dropdown indicator */}
            <button
              className="trackr-header-icon-btn"
              onClick={onLogout}
              aria-label="Logout"
              title="Logout"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Tab strip */}
      <div className="trackr-tabs-bar">
        <nav ref={navRef} className="trackr-tabs-nav">
          {NAV_ITEMS.slice(0, visibleTabsCount).map((tab) => (
            <button
              key={tab.id}
              className={`trackr-tab${activePage === tab.id ? ' active' : ''}`}
              onClick={() => handleTabClick(tab.id)}
            >
              <span className="trackr-tab-icon">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}

          {NAV_ITEMS.length > visibleTabsCount && (
            <div className="trackr-tab-more-wrap" ref={moreRef}>
              <button
                className="trackr-tab trackr-tab-more"
                onClick={handleMoreToggle}
                aria-label="More tabs"
              >
                <span>More</span>
                <svg
                  viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                  strokeLinecap="round" strokeLinejoin="round" width="14" height="14"
                  style={{
                    transform: showMoreDropdown ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.25s ease',
                  }}
                >
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>

              {showMoreDropdown && dropdownCoords && (
                <div
                  ref={dropdownRef}
                  className="trackr-more-dropdown"
                  style={{
                    position: 'fixed',
                    top: dropdownCoords.top,
                    left: dropdownCoords.left,
                    width: dropdownCoords.width,
                  }}
                >
                  {NAV_ITEMS.slice(visibleTabsCount).map((tab) => (
                    <button
                      key={tab.id}
                      className={`trackr-dropdown-item${activePage === tab.id ? ' active' : ''}`}
                      onClick={() => handleTabClick(tab.id)}
                    >
                      <span className="trackr-tab-icon">{tab.icon}</span>
                      <span>{tab.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </nav>
      </div>
    </div>
  );
};

export { NAV_ITEMS };
export default TopNavBar;
