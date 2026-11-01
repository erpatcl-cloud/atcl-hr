import React, { useState, useContext, useMemo, useRef, useEffect } from 'react';
import { HRMSProvider, HRMSContext } from './context/HRMSContext';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import EmployeeManagement from './components/EmployeeManagement';
import AttendanceManagement from './components/AttendanceManagement';
import LeaveManagement from './components/LeaveManagement';
import PayrollManagement from './components/PayrollManagement';
import TaxManagement from './components/TaxManagement';
import EmployeePortal from './components/EmployeePortal';
import CompanyInfo from './components/CompanyInfo';
import Settings from './components/Settings';

import Login from './components/Login';
import ForceChangePassword from './components/ForceChangePassword';

// Notification Bell component for the header
function NotifBell({ count, onClick }) {
  if (count <= 0) return null;
  return (
    <button className="notif-bell-btn" onClick={onClick} title={`${count} pending leave request(s)`}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width: 18, height: 18}}>
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
      <span className="notif-bell-count">{count > 99 ? '99+' : count}</span>
    </button>
  );
}

function AppContent() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const { 
    theme, 
    currentUser, 
    loginMode, 
    activeEmployeeCode, 
    switchLoginMode, 
    employees,
    leaveRequests,
    authLoading,
    logout,
    isAdminUser,
    dbConnected,
    workspaceSession
  } = useContext(HRMSContext);
  const pendingLeaves = leaveRequests ? leaveRequests.filter(r => r.status === 'Pending').length : 0;

  // Sorted employee list for the impersonation dropdown - must be declared before any conditional returns
  const activeEmployees = useMemo(() => 
    employees ? employees.filter(e => e.status === 'Active') : [],
    [employees]
  );

  const sortedEmployees = useMemo(() =>
    [...activeEmployees].sort((a, b) => a.fullNameEnglish.localeCompare(b.fullNameEnglish)),
    [activeEmployees]
  );

  const getPageTitle = () => {
    if (loginMode === 'employee') {
      switch (currentPage) {
        case 'dashboard':
          return { title: 'My ESS Dashboard', subtitle: 'Advance Technology Consortium Ltd. (ATCL)' };
        case 'employees':
          return { title: 'My Profile Editor', subtitle: 'View official details and update personal contact information' };
        case 'attendance':
          return { title: 'My Attendance Logs', subtitle: 'Simulate mobile clock-in/out and audit log history' };
        case 'leave':
          return { title: 'My Leaves Planner', subtitle: 'Apply for leaves online, check quotas, and audit applications' };
        case 'payroll':
          return { title: 'My Payroll & Payslips', subtitle: 'Review annual salary structure and download monthly PDF payslips' };
        case 'tax':
          return { title: 'My Tax Profile', subtitle: 'Input tax declarations and download NBR TDS certificates' };
        default:
          return { title: 'Employee Portal', subtitle: 'Employee Self-Service (ESS)' };
      }
    }

    switch (currentPage) {
      case 'dashboard':
        return { title: 'Executive Dashboard', subtitle: 'Advance Technology Consortium Ltd. (ATCL)' };
      case 'employees':
        return { title: 'Employee Directory', subtitle: 'Manage employee database, identities, and document archives' };
      case 'attendance':
        return { title: 'Attendance Logbook', subtitle: 'Biometric verification logs, GPS mapping, and manual adjustments' };
      case 'leave':
        return { title: 'Leave & Absence Management', subtitle: 'Approve applications, monitor quotas, and view leaves calendar' };
      case 'payroll':
        return { title: 'Payroll Processing Console', subtitle: 'Calculate salaries, adjust festival bonuses, track increments, and print payslips' };
      case 'tax':
        return { title: 'Income Tax compliance', subtitle: 'Bangladesh Income Tax Act 2023 calculator, rebates, and NBR certificates' };
      case 'company':
        return { title: 'Company Profile & Settings', subtitle: 'Central corporate profile database, legal registration, locations, and statistics' };
      case 'settings':
        return { title: 'System Settings & Bulk Data Console', subtitle: 'Admin-only bulk employee/data uploads, master configuration, and access control' };
      default:
        return { title: 'ATCL HRMS', subtitle: 'Enterprise HR Portal' };
    }
  };

  const { title, subtitle } = getPageTitle();

  if (authLoading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100vw',
        height: '100vh',
        background: '#0f172a',
        color: 'white',
        fontFamily: 'system-ui, sans-serif'
      }}>
        <div style={{ width: 40, height: 40, border: '3px solid rgba(255,255,255,0.2)', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <span style={{ marginTop: 20, fontSize: '0.9rem', fontWeight: 600, color: '#94a3b8' }}>Loading ATCL Portal...</span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!currentUser) {
    return <Login />;
  }

  if (currentUser.mustChangePassword) {
    return <ForceChangePassword />;
  }

  const renderPage = () => {
    if (loginMode === 'employee') {
      return <EmployeePortal currentPage={currentPage} />;
    }
    
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard setCurrentPage={setCurrentPage} />;
      case 'employees':
        return <EmployeeManagement />;
      case 'attendance':
        return <AttendanceManagement />;
      case 'leave':
        return <LeaveManagement />;
      case 'payroll':
        return <PayrollManagement />;
      case 'tax':
        return <TaxManagement />;
      case 'company':
        return <CompanyInfo />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard setCurrentPage={setCurrentPage} />;
    }
  };

  const handleRoleChange = (e) => {
    const value = e.target.value;
    if (value === 'employee') {
      const targetEmp = activeEmployees.find(emp => emp.employeeCode === 'ATCL-0508') || activeEmployees[0];
      switchLoginMode('employee', targetEmp?.employeeCode || '');
      setCurrentPage('dashboard');
    } else {
      switchLoginMode('admin');
      setCurrentPage('dashboard');
    }
  };

  const handleEmployeeSwitch = (e) => {
    const val = e.target.value;
    if (!val) {
      switchLoginMode('admin');
      setCurrentPage('dashboard');
    } else {
      switchLoginMode('employee', val);
      setCurrentPage('dashboard');
    }
  };

  return (
    <div className={`app-container ${theme === 'dark' ? 'dark' : ''}`}>
      {/* Navigation Sidebar */}
      <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} />

      {/* Main Panel */}
      <div className="main-wrapper">
        <header className="header">
          <div className="header-title-section">
            <h1 className="header-title">{title}</h1>
            <span className="header-subtitle">
              {subtitle} &nbsp;·&nbsp;
              <span style={{ color: 'var(--secondary-color)', fontWeight: 600 }}>
                {new Date().toLocaleDateString('en-BD', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            </span>
          </div>
          <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Google Workspace Auto-Connected Badge */}
            <div
              onClick={() => {
                if (isAdminUser) {
                  if (loginMode === 'employee') switchLoginMode('admin');
                  setCurrentPage('settings');
                }
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: '0.74rem',
                fontWeight: 700,
                padding: '4px 10px',
                borderRadius: '20px',
                border: workspaceSession?.connected ? '1px solid rgba(59,130,246,0.35)' : '1px solid rgba(148,163,184,0.3)',
                background: workspaceSession?.connected ? 'rgba(59,130,246,0.12)' : 'rgba(148,163,184,0.1)',
                color: workspaceSession?.connected ? '#3b82f6' : 'var(--text-secondary)',
                whiteSpace: 'nowrap',
                cursor: isAdminUser ? 'pointer' : 'default'
              }}
              title={
                workspaceSession?.connected
                  ? `Google Workspace Cloud Connected (${workspaceSession.email}) — Click to open Cloud Settings`
                  : 'Google Workspace Cloud Disconnected — Click to configure'
              }
            >
              <span style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: workspaceSession?.connected ? '#10b981' : '#94a3b8',
                boxShadow: workspaceSession?.connected ? '0 0 8px #10b981' : 'none',
                display: 'inline-block'
              }} />
              ☁️ {workspaceSession?.connected ? workspaceSession.email : 'Workspace Offline'}
            </div>

            {/* Database Connection Status Badge */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: '0.75rem',
              fontWeight: 700,
              padding: '4px 10px',
              borderRadius: '20px',
              border: dbConnected ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(245,158,11,0.3)',
              background: dbConnected ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
              color: dbConnected ? '#10b981' : '#f59e0b',
              whiteSpace: 'nowrap'
            }} title={dbConnected ? 'Successfully connected to MySQL database at 192.168.68.52' : 'MySQL server offline. Working in offline/localStorage mode.'}>
              <span style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: dbConnected ? '#10b981' : '#f59e0b',
                boxShadow: dbConnected ? '0 0 8px #10b981' : '0 0 8px #f59e0b',
                display: 'inline-block'
              }} />
              {dbConnected ? 'MySQL Connected' : 'Offline Mode'}
            </div>

            {/* Admin Employee Impersonation — visible only to actual admin accounts */}
            {isAdminUser && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>

                {/* Back to Admin button — shown when impersonating */}
                {loginMode === 'employee' && (
                  <button
                    onClick={() => { switchLoginMode('admin'); setCurrentPage('dashboard'); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 5,
                      fontSize: '0.75rem', fontWeight: 700,
                      color: '#f59e0b',
                      background: 'rgba(245,158,11,0.10)',
                      border: '1px solid rgba(245,158,11,0.35)',
                      borderRadius: '6px',
                      padding: '5px 10px',
                      cursor: 'pointer',
                      transition: 'background 0.18s',
                      whiteSpace: 'nowrap'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(245,158,11,0.20)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(245,158,11,0.10)'}
                    title="Return to Admin panel"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{width:13,height:13}}>
                      <polyline points="15 18 9 12 15 6" />
                    </svg>
                    Admin Panel
                  </button>
                )}

                {/* Single employee impersonation dropdown */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <label style={{
                    fontSize: '0.7rem', fontWeight: 700,
                    color: loginMode === 'employee' ? '#f59e0b' : 'var(--text-secondary)',
                    whiteSpace: 'nowrap',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em'
                  }}>
                    {loginMode === 'employee' ? '👁 Viewing as:' : 'View Employee:'}
                  </label>
                  <select
                    value={loginMode === 'employee' ? activeEmployeeCode : ''}
                    onChange={handleEmployeeSwitch}
                    style={{
                      fontSize: '0.8rem',
                      padding: '6px 10px',
                      border: loginMode === 'employee'
                        ? '1.5px solid rgba(245,158,11,0.5)'
                        : '1px solid var(--border-color)',
                      borderRadius: 'var(--border-radius-sm)',
                      background: loginMode === 'employee'
                        ? 'rgba(245,158,11,0.07)'
                        : 'var(--bg-input)',
                      color: loginMode === 'employee' ? '#f59e0b' : 'var(--text-primary)',
                      fontWeight: loginMode === 'employee' ? 700 : 400,
                      maxWidth: 220,
                      cursor: 'pointer'
                    }}
                  >
                    <option value="">— সকল এমপ্লয়ি (Admin View) —</option>
                    {sortedEmployees.map(emp => (
                      <option key={emp.employeeCode} value={emp.employeeCode}>
                        {emp.fullNameEnglish}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Notification Bell */}
            <NotifBell count={pendingLeaves} onClick={() => setCurrentPage('leave')} />

            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', paddingLeft: 8, borderLeft: '1px solid var(--border-color)' }}>
              Session: {currentUser?.role || 'User'}
            </span>

            {/* User Avatar Ring */}
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontWeight: 800, fontSize: '0.8rem',
              boxShadow: '0 0 0 2px rgba(0,180,216,0.3)',
              cursor: 'default',
              title: currentUser.name
            }}>
              {(currentUser?.name || 'U').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
            </div>

            <button 
              onClick={logout}
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                color: '#ef4444',
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                borderRadius: '6px',
                padding: '4px 8px',
                cursor: 'pointer',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.background = 'rgba(239, 68, 68, 0.15)'}
              onMouseLeave={(e) => e.target.style.background = 'rgba(239, 68, 68, 0.08)'}
            >
              Sign Out
            </button>
          </div>
        </header>

        <main className="content-body">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <HRMSProvider>
      <AppContent />
    </HRMSProvider>
  );
}
