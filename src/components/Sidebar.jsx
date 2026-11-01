import React, { useContext, useState, useEffect } from 'react';
import { HRMSContext } from '../context/HRMSContext';

// Custom inline SVG icons
const Icons = {
  Dashboard: () => (
    <svg className="svg-icon" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="9" rx="1" /><rect x="14" y="3" width="7" height="5" rx="1" /><rect x="14" y="12" width="7" height="9" rx="1" /><rect x="3" y="16" width="7" height="5" rx="1" /></svg>
  ),
  Employee: () => (
    <svg className="svg-icon" viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
  ),
  Attendance: () => (
    <svg className="svg-icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
  ),
  Leave: () => (
    <svg className="svg-icon" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
  ),
  Payroll: () => (
    <svg className="svg-icon" viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
  ),
  Tax: () => (
    <svg className="svg-icon" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
  ),
  Sun: () => (
    <svg className="svg-icon" viewBox="0 0 24 24" style={{width: 18, height: 18}}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" /></svg>
  ),
  Moon: () => (
    <svg className="svg-icon" viewBox="0 0 24 24" style={{width: 18, height: 18}}><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" /></svg>
  ),
  Company: () => (
    <svg className="svg-icon" viewBox="0 0 24 24"><rect x="4" y="2" width="16" height="20" rx="2" ry="2" /><line x1="9" y1="22" x2="9" y2="16" /><line x1="15" y1="22" x2="15" y2="16" /><path d="M9 16h6v6H9z" /><path d="M8 6h2v2H8zm0 4h2v2H8zm6-4h2v2h-2zm0 4h2v2h-2z" /></svg>
  ),
  Settings: () => (
    <svg className="svg-icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
  )
};

export default function Sidebar({ currentPage, setCurrentPage }) {
  const { theme, toggleTheme, currentUser, loginMode, leaveRequests, attendanceLogs } = useContext(HRMSContext);
  const [clock, setClock] = useState('');
  const [clockDate, setClockDate] = useState('');

  // Live clock effect
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setClock(now.toLocaleTimeString('en-BD', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }));
      setClockDate(now.toLocaleDateString('en-BD', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }));
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, []);

  // Count pending leaves for badge
  const pendingLeaveCount = leaveRequests ? leaveRequests.filter(r => r.status === 'Pending').length : 0;
  
  // Count pending attendance approvals for badge
  const todayStr = new Date().toISOString().split('T')[0];
  const pendingAttendanceCount = attendanceLogs ? attendanceLogs.filter(l => l.approvalStatus === 'Pending').length : 0;

  const menuItems = loginMode === 'employee' ? [
    { id: 'dashboard', name: 'My Dashboard', icon: Icons.Dashboard },
    { id: 'employees', name: 'My Profile', icon: Icons.Employee },
    { id: 'attendance', name: 'My Attendance', icon: Icons.Attendance },
    { id: 'leave', name: 'My Leaves', icon: Icons.Leave },
    { id: 'payroll', name: 'My Payslips', icon: Icons.Payroll },
    { id: 'tax', name: 'My Tax Profile', icon: Icons.Tax }
  ] : [
    { id: 'dashboard', name: 'Dashboard', icon: Icons.Dashboard },
    { id: 'employees', name: 'Employees', icon: Icons.Employee },
    { id: 'attendance', name: 'Attendance', icon: Icons.Attendance, badge: pendingAttendanceCount },
    { id: 'leave', name: 'Leave Management', icon: Icons.Leave, badge: pendingLeaveCount },
    { id: 'payroll', name: 'Payroll', icon: Icons.Payroll },
    { id: 'tax', name: 'Income Tax', icon: Icons.Tax },
    { id: 'company', name: 'Company Profile', icon: Icons.Company },
    { id: 'settings', name: 'Settings', icon: Icons.Settings }
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-logo">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{width: 28, height: 28, stroke: '#00b4d8'}}>
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
            <span style={{ fontSize: '1rem' }}>ATCL HRMS</span>
            <span style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.35)', fontWeight: 500, letterSpacing: '0.5px', marginTop: 1 }}>Enterprise HR Platform v2.0</span>
          </div>
        </div>
      </div>
      
      <div className="sidebar-menu">
        {menuItems.map((item, idx) => {
          const IconComponent = item.icon;
          return (
            <button
              type="button"
              aria-current={currentPage === item.id ? 'page' : undefined}
              key={item.id}
              className={`menu-item ${currentPage === item.id ? 'active' : ''}`}
              onClick={() => setCurrentPage(item.id)}
              style={{ animationDelay: `${idx * 0.04}s`, animation: 'fadeInLeft 0.35s both' }}
            >
              <div className="notification-badge-wrap">
                <IconComponent />
                {item.badge > 0 && (
                  <span className="notification-badge">{item.badge > 99 ? '99+' : item.badge}</span>
                )}
              </div>
              <span style={{ flex: 1 }}>{item.name}</span>
              {item.badge > 0 && (
                <span style={{
                  fontSize: '0.6rem',
                  fontWeight: 700,
                  background: 'rgba(239,68,68,0.15)',
                  color: '#ef4444',
                  borderRadius: '100px',
                  padding: '1px 6px',
                }}>
                  {item.badge} pending
                </span>
              )}
            </button>
          );
        })}
      </div>
      
      <div className="sidebar-footer">
        {/* Live Clock Widget */}
        <div className="sidebar-clock">
          <div className="sidebar-clock-time">{clock}</div>
          <div className="sidebar-clock-date">{clockDate}</div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>THEME</span>
          <button onClick={toggleTheme} className="theme-toggle-btn" style={{ borderColor: 'rgba(255,255,255,0.1)', color: '#fff' }}>
            {theme === 'light' ? <Icons.Moon /> : <Icons.Sun />}
          </button>
        </div>
        
        <div className="user-profile-summary" style={{ background: 'rgba(255,255,255,0.03)' }}>
          <div className="user-avatar" style={{ animation: 'glow-pulse 3s ease-in-out infinite' }}>
            {currentUser.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </div>
          <div className="user-info">
            <div className="user-name">{currentUser.name}</div>
            <div className="user-role">{currentUser.role}</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
