import React from 'react';
import { mediaAPI } from '../../utils/api';
import '../../styles/Sidebar.css';
import '../../styles/Tracker.css';

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
 * Left navigation sidebar for the productivity tracker.
 * Reuses all existing sidebar CSS classes for visual consistency.
 */
const ProductivitySidebar = ({ currentUser, activePage, onNavigate, onLogout }) => {
  const getProfilePicUrl = (profilePic) => mediaAPI.getProfilePicUrl(profilePic);

  return (
    <div className="sidebar">
      {/* Header */}
      <div className="sidebar-top-header">
        <span className="sidebar-app-title">Trackr</span>
      </div>

      {/* Navigation items — replaces user list */}
      <nav className="nav-list">
        {NAV_ITEMS.map((item) => (
          <div
            key={item.id}
            className={`nav-item${activePage === item.id ? ' active' : ''}`}
            onClick={() => onNavigate(item.id)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && onNavigate(item.id)}
            aria-label={item.label}
          >
            {item.icon}
            <span>{item.label}</span>
          </div>
        ))}
      </nav>

      {/* Current user bottom bar — same as original sidebar */}
      <div className="sidebar-current-user">
        <div className="sidebar-current-user-avatar" title={currentUser.username}>
          {currentUser.profilePic ? (
            <img src={getProfilePicUrl(currentUser.profilePic)} alt={currentUser.username} />
          ) : (
            <DefaultAvatar />
          )}
        </div>
        <span className="sidebar-current-user-name">{currentUser.username}</span>
        <div className="sidebar-current-user-actions">
          <button className="sidebar-action-btn" onClick={onLogout} aria-label="Logout" title="Logout">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductivitySidebar;
