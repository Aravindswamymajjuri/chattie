import React, { useState, useCallback } from 'react';
import TopNavBar, { NAV_ITEMS } from '../components/productivity/TopNavBar';
import BottomNav from '../components/productivity/BottomNav';
import ThemeToggle from '../components/ThemeToggle';
import Dashboard from './Dashboard';
import CalendarPage from './CalendarPage';
import DailyTracker from './DailyTracker';
import WeeklyAnalytics from './WeeklyAnalytics';
import MonthlyAnalytics from './MonthlyAnalytics';
import YearlyAnalytics from './YearlyAnalytics';
import ChatPage from './ChatPage';
import { todayStr } from '../hooks/useTasks';
import { mediaAPI } from '../utils/api';
import '../styles/ChatPage.css';
import '../styles/Tracker.css';

/**
 * MainApp — root shell for the productivity tracker.
 *
 * Layout:
 *   Desktop: TopNavBar (header + tabs) → full-width content → floating chat btn
 *   Mobile:  Header bar → full-width content → BottomNav (with Discuss tab)
 */
const MainApp = ({ currentUser, onLogout, onCurrentUserUpdate }) => {
  const [activePage, setActivePage] = useState('dashboard');
  const [trackerDate, setTrackerDate] = useState(todayStr());
  const [chatOpen, setChatOpen] = useState(false);

  const navigate = useCallback((page) => {
    setActivePage(page);
    if (page === 'daily' && !trackerDate) setTrackerDate(todayStr());
  }, [trackerDate]);

  const handleCalendarDateSelect = useCallback((date) => {
    setTrackerDate(date);
    setActivePage('daily');
  }, []);

  const handleBack = useCallback(() => {
    setActivePage('calendar');
  }, []);

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return <Dashboard currentUser={currentUser} onNavigate={navigate} />;
      case 'calendar':
        return <CalendarPage currentUser={currentUser} onSelectDate={handleCalendarDateSelect} />;
      case 'daily':
        return (
          <DailyTracker
            currentUser={currentUser}
            date={trackerDate}
            onBack={handleBack}
          />
        );
      case 'weekly':
        return <WeeklyAnalytics currentUser={currentUser} />;
      case 'monthly':
        return <MonthlyAnalytics currentUser={currentUser} />;
      case 'yearly':
        return <YearlyAnalytics currentUser={currentUser} />;
      default:
        return <Dashboard currentUser={currentUser} onNavigate={navigate} />;
    }
  };



  return (
    <div className="trackr-layout">
      {!chatOpen && (
        <TopNavBar
          currentUser={currentUser}
          activePage={activePage}
          onNavigate={navigate}
          onLogout={onLogout}
          onLogoClick={() => setChatOpen(true)}
        />
      )}

      {/* Mobile: simple header (visible only on mobile via CSS) */}
      {!chatOpen && (
        <div className="trackr-mobile-header">
          <span
            className="trackr-logo-text"
            onClick={() => setChatOpen(true)}
            style={{ cursor: 'pointer', userSelect: 'none' }}
          >Trackr</span>
          <div className="trackr-mobile-header-right">
            <ThemeToggle />
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
            <div className="trackr-user-avatar" title={currentUser.username}>
              {currentUser.profilePic ? (
                <img src={mediaAPI.getProfilePicUrl(currentUser.profilePic)} alt={currentUser.username} />
              ) : (
                <svg viewBox="0 0 212 212" width="100%" height="100%">
                  <path fill="#DFE5E7" d="M106 0C47.5 0 0 47.5 0 106s47.5 106 106 106 106-47.5 106-106S164.5 0 106 0z"/>
                  <path fill="#fff" d="M106 45c20.4 0 37 16.6 37 37s-16.6 37-37 37-37-16.6-37-37 16.6-37 37-37zm0 100c33.1 0 60 14.3 60 32v8H46v-8c0-17.7 26.9-32 60-32z"/>
                </svg>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Welcome text */}
      <div className="trackr-welcome">
        <h1>Welcome, {currentUser.username}..!</h1>
      </div>

      {/* Content area */}
      <div className="trackr-content">
        {chatOpen ? (
          <ChatPage
            currentUser={currentUser}
            onLogout={onLogout}
            onCurrentUserUpdate={onCurrentUserUpdate}
            onBackToTracker={() => setChatOpen(false)}
          />
        ) : (
          renderPage()
        )}
      </div>

      {/* Mobile: bottom nav — hidden when chat is open */}
      {!chatOpen && (
        <div className="trackr-bottom-nav-wrap">
          <BottomNav
            tabs={NAV_ITEMS}
            active={activePage}
            onChange={navigate}
          />
        </div>
      )}
    </div>
  );
};

export default MainApp;
