import React, { useContext } from 'react';
import { HRMSContext } from '../context/HRMSContext';
import { bangladeshDate, attendanceSummary } from '../utils/dashboardMetrics';

const HOLIDAYS = [
  { date: '2026-06-16', name: 'Eid-ul-Adha (Subject to Moon Sighting)' },
  { date: '2026-12-16', name: 'Victory Day' },
  { date: '2026-12-25', name: 'Christmas Day' },
];

function TrendArrow({ direction, label }) {
  if (direction === 'up') return (
    <span className="stat-card-trend trend-up">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{width:13,height:13}}><polyline points="18 15 12 9 6 15" /></svg>
      {label}
    </span>
  );
  if (direction === 'down') return (
    <span className="stat-card-trend trend-down">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{width:13,height:13}}><polyline points="6 9 12 15 18 9" /></svg>
      {label}
    </span>
  );
  return <span className="stat-card-trend trend-flat">— Stable</span>;
}

function MiniDonut({ presentCount, activeEmployees }) {
  const total = activeEmployees;
  const present = Math.min(presentCount, total);
  const absent = total - present;
  const presentPct = total ? Math.round((present / total) * 100) : 0;
  const absentPct = total ? 100 - presentPct : 0;
  const size = 140;
  const innerSize = 100;
  
  const gradient = `conic-gradient(
    var(--success) 0% ${presentPct}%,
    var(--danger) ${presentPct}% ${presentPct + absentPct}%
  )`;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
      <div
        className="mini-donut"
        style={{ width: size, height: size, background: gradient, flexShrink: 0 }}
      >
        <div
          className="mini-donut-center"
          style={{ width: innerSize, height: innerSize }}
        >
          <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>{presentPct}%</span>
          <span style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Attendance</span>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div className="donut-legend-item">
          <div className="donut-legend-dot" style={{ background: 'var(--success)' }} />
          <span><strong>{present}</strong> Present ({presentPct}%)</span>
        </div>
        <div className="donut-legend-item">
          <div className="donut-legend-dot" style={{ background: 'var(--danger)' }} />
          <span><strong>{absent}</strong> Not recorded present ({absentPct}%)</span>
        </div>
        <div className="donut-legend-item">
          <div className="donut-legend-dot" style={{ background: 'var(--warning)', borderRadius: '50%' }} />
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.725rem' }}>Today's rate</span>
        </div>
      </div>
    </div>
  );
}

function EventsPanel({ payrollRuns }) {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  const upcomingHolidays = HOLIDAYS
    .filter(h => h.date >= todayStr)
    .slice(0, 3);

  const events = [
    ...upcomingHolidays.map(h => ({
      date: h.date,
      title: h.name,
      sub: 'Public Holiday — Bangladesh',
      type: 'holiday'
    })),
    {
      date: (() => {
        const d = new Date(); d.setMonth(d.getMonth() + 1); d.setDate(5);
        return d.toISOString().split('T')[0];
      })(),
      title: 'Monthly Payroll Run Due',
      sub: 'HR Finance Action Required',
      type: 'payroll'
    }
  ].sort((a, b) => a.date.localeCompare(b.date)).slice(0, 4);

  const typeColors = {
    holiday: 'var(--warning)',
    payroll: 'var(--success)',
    default: 'var(--info)'
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {events.map((ev, i) => {
        const d = new Date(ev.date + 'T00:00:00');
        const day = d.getDate();
        const month = d.toLocaleString('default', { month: 'short' }).toUpperCase();
        return (
          <div className="event-item" key={i}>
            <div className="event-date-badge" style={{ borderColor: `${typeColors[ev.type] || typeColors.default}33`, background: `${typeColors[ev.type] || typeColors.default}12` }}>
              <span className="event-date-day" style={{ color: typeColors[ev.type] || typeColors.default }}>{day}</span>
              <span className="event-date-month">{month}</span>
            </div>
            <div style={{ flex: 1 }}>
              <div className="event-info-title">{ev.title}</div>
              <div className="event-info-sub">{ev.sub}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function Dashboard({ setCurrentPage }) {
  const { employees, attendanceLogs, leaveRequests, payrollRuns } = useContext(HRMSContext);

  const totalEmployees = employees.length;
  const activeEmployees = employees.filter(e => e.status === 'Active').length;
  
  // Calculate today's attendance stats
  const todayStr = bangladeshDate();
  const { presentCount, lateCount, overtimeCount, absentCount } = attendanceSummary(employees, attendanceLogs, todayStr);
  const pendingAttendance = attendanceLogs.filter(log => log.approvalStatus === 'Pending').length;

  // Leave stats
  const pendingLeaves = leaveRequests.filter(req => req.status === 'Pending').length;

  // Last payroll details
  const lastPayroll = [...payrollRuns].sort((a, b) => String(b.month).localeCompare(String(a.month)))[0] || { totalDisbursed: 0, month: '' };

  // Calculate department distributions
  const deptCounts = {};
  employees.forEach(emp => {
    if (emp.status === 'Active') {
      deptCounts[emp.department] = (deptCounts[emp.department] || 0) + 1;
    }
  });
  const maxDeptCount = Math.max(...Object.values(deptCounts), 1);

  // Recent logs & leaves
  const recentLogs = [...attendanceLogs].sort((a, b) => `${b.date} ${b.checkIn || ''}`.localeCompare(`${a.date} ${a.checkIn || ''}`)).slice(0, 5);
  const recentLeaves = [...leaveRequests].filter(l => l.status === 'Pending').slice(0, 3);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      <section className="dashboard-overview" aria-label="HR work overview">
        <div>
          <span className="overview-eyebrow">PEOPLE OPERATIONS</span>
          <h2>Your team at a glance</h2>
          <p>Review today's attendance and keep your HR tasks moving.</p>
        </div>
        <div className="overview-actions">
          <button className="btn btn-outline" onClick={() => setCurrentPage('leave')}>Leave requests <strong>{pendingLeaves}</strong></button>
          <button className="btn btn-outline" onClick={() => setCurrentPage('attendance')}>Attendance approvals <strong>{pendingAttendance}</strong></button>
          <button className="btn btn-primary" onClick={() => setCurrentPage('payroll')}>Open payroll →</button>
        </div>
      </section>
      {/* Executive stats cards — animated entrance */}
      <div className="stats-grid">
        <div className="card stat-card stat-card-enhanced animate-fade-up animate-fade-up-d1">
          <div className="stat-info">
            <span className="stat-label">Total Employees</span>
            <span className="stat-value">{totalEmployees}</span>
            <span style={{ fontSize: '0.725rem', color: 'var(--success)', fontWeight: 600 }}>
              {activeEmployees} Active
            </span>
            <span className="stat-card-trend">{totalEmployees - activeEmployees} inactive</span>
          </div>
          <div className="stat-icon-wrapper">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{width: 24, height: 24}}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
          </div>
        </div>

        <div className="card stat-card teal stat-card-enhanced animate-fade-up animate-fade-up-d2">
          <div className="stat-info">
            <span className="stat-label">Present Today</span>
            <span className="stat-value">{presentCount}</span>
            <span style={{ fontSize: '0.725rem', color: 'var(--text-secondary)' }}>
              {lateCount} Late · {overtimeCount} OT
            </span>
            <TrendArrow direction={presentCount >= activeEmployees * 0.8 ? 'up' : 'down'} label={`${Math.round((presentCount/Math.max(activeEmployees,1))*100)}% rate`} />
          </div>
          <div className="stat-icon-wrapper">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{width: 24, height: 24}}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
          </div>
        </div>

        <div className="card stat-card yellow stat-card-enhanced animate-fade-up animate-fade-up-d3">
          <div className="stat-info">
            <span className="stat-label">Pending Leave</span>
            <span className="stat-value">{pendingLeaves}</span>
            <span style={{ fontSize: '0.725rem', color: 'var(--warning)', fontWeight: 600 }}>
              Requires HR Approval
            </span>
            <TrendArrow direction={pendingLeaves > 3 ? 'down' : 'flat'} label={pendingLeaves > 0 ? `${pendingLeaves} pending` : 'All clear'} />
          </div>
          <div className="stat-icon-wrapper">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{width: 24, height: 24}}><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
          </div>
        </div>

        <div className="card stat-card green stat-card-enhanced animate-fade-up animate-fade-up-d4">
          <div className="stat-info">
            <span className="stat-label">Last Payroll</span>
            <span className="stat-value" style={{ fontSize: '1.45rem', marginTop: 3 }}>
              ৳{Math.round(lastPayroll.totalDisbursed).toLocaleString()}
            </span>
            <span style={{ fontSize: '0.725rem', color: 'var(--text-secondary)' }}>
              Disbursed for {lastPayroll.month || 'N/A'}
            </span>
            <span className="stat-card-trend">{lastPayroll.month ? 'Latest recorded payroll' : 'No payroll runs yet'}</span>
          </div>
          <div className="stat-icon-wrapper">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{width: 24, height: 24}}><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
          </div>
        </div>
      </div>

      {/* Analytics Row: Dept Chart + Attendance Donut */}
      <div className="grid-2">
        {/* Department Distribution Chart */}
        <div className="card animate-fade-up animate-fade-up-d2">
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--primary-color)', marginBottom: 4 }}>
            Department Distribution
          </h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 20 }}>
            Active employee count by specialized business unit
          </p>
          <div className="custom-chart-bar-container">
            {Object.keys(deptCounts).map(dept => {
              const count = deptCounts[dept];
              const pct = (count / maxDeptCount) * 100;
              return (
                <div key={dept} className="custom-chart-bar-row">
                  <div className="custom-chart-bar-label" title={dept}>{dept}</div>
                  <div className="custom-chart-bar-rail">
                    <div className="custom-chart-bar-fill" style={{ width: `${pct}%` }}></div>
                  </div>
                  <div className="custom-chart-bar-value">{count}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Today's Attendance Donut */}
        <div className="card animate-fade-up animate-fade-up-d3">
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--primary-color)', marginBottom: 4 }}>
            Today's Attendance Rate
          </h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 20 }}>
            Recorded presence for {todayStr} (Bangladesh time)
          </p>
          <MiniDonut presentCount={presentCount} activeEmployees={activeEmployees} />
          <div style={{ marginTop: 16, display: 'flex', gap: 16 }}>
            <div style={{ flex: 1, background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)', borderRadius: 8, padding: '8px 12px', textAlign: 'center' }}>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--warning)' }}>{lateCount}</div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Late Entries</div>
            </div>
            <div style={{ flex: 1, background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: 8, padding: '8px 12px', textAlign: 'center' }}>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--info)' }}>{overtimeCount}</div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Overtime</div>
            </div>
            <div style={{ flex: 1, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 8, padding: '8px 12px', textAlign: 'center' }}>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--danger)' }}>{absentCount}</div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Not recorded present</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions + Events Row */}
      <div className="grid-2">
        {/* Quick Operations */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--primary-color)', marginBottom: 4 }}>
              Quick Action Vault
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Common shortcuts to accelerate administrative workflows
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <button className="btn btn-primary" onClick={() => setCurrentPage('employees')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{width: 16, height: 16}}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" /></svg>
              <span>Add Employee</span>
            </button>
            <button className="btn btn-secondary" onClick={() => setCurrentPage('attendance')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{width: 16, height: 16}}><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
              <span>Verify Logins</span>
            </button>
            <button className="btn btn-outline" onClick={() => setCurrentPage('leave')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{width: 16, height: 16}}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="12" y1="18" x2="12" y2="12" /><line x1="9" y1="15" x2="15" y2="15" /></svg>
              <span>Review Leaves {pendingLeaves > 0 && <span style={{ background: 'var(--danger)', borderRadius: '100px', padding: '0 5px', fontSize: '0.65rem', marginLeft: 4, color: '#fff' }}>{pendingLeaves}</span>}</span>
            </button>
            <button className="btn btn-outline" onClick={() => setCurrentPage('payroll')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{width: 16, height: 16}}><rect x="2" y="4" width="20" height="16" rx="2" ry="2" /><line x1="12" y1="18" x2="12" y2="18.01" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
              <span>Process Salary</span>
            </button>
            <button className="btn btn-outline" onClick={() => setCurrentPage('tax')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{width: 16, height: 16}}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
              <span>Tax Reports</span>
            </button>
            <button className="btn btn-outline" onClick={() => setCurrentPage('company')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{width: 16, height: 16}}><rect x="4" y="2" width="16" height="20" rx="2" ry="2" /><path d="M8 6h2v2H8zm0 4h2v2H8zm6-4h2v2h-2zm0 4h2v2h-2z" /></svg>
              <span>Company Profile</span>
            </button>
          </div>

          <div style={{ padding: '14px', background: 'rgba(0, 180, 216, 0.04)', border: '1px dashed rgba(0, 180, 216, 0.2)', borderRadius: 'var(--border-radius-sm)', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary-color)' }}>🇧🇩 Bangladesh Labor Standard Compliant</span>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
              Tracks late entry policy (&gt;9:15 AM trigger), early out, double-rate overtime, and Section 139 TDS certificate generators.
            </span>
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--primary-color)', marginBottom: 4 }}>
              Upcoming Events & Deadlines
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Holidays, payroll dates, and scheduled HR actions
            </p>
          </div>
          <EventsPanel payrollRuns={payrollRuns} />
        </div>
      </div>

      {/* Lists sections */}
      <div className="grid-2">
        {/* Recent logs */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--primary-color)' }}>
            Recent Activity Logs
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {recentLogs.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '20px 0', fontSize: '0.8rem' }}>No recent logs.</div>
            ) : recentLogs.map((log, index) => (
              <div key={index} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 10, borderBottom: '1px solid var(--border-color)' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.825rem', fontWeight: 600 }}>{log.name}</div>
                  <div style={{ fontSize: '0.725rem', color: 'var(--text-secondary)' }}>{log.designation} • {log.date}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className={`badge ${log.isLate ? 'badge-warning' : 'badge-success'}`} style={{ fontSize: '0.65rem' }}>
                    {log.isLate ? 'Late Entry' : 'On Time'}
                  </span>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: 2 }}>{log.checkIn}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Leave Requests Queue */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--primary-color)' }}>
            Leave Applications Queue
            {pendingLeaves > 0 && (
              <span className="badge badge-warning" style={{ marginLeft: 10, fontSize: '0.65rem' }}>{pendingLeaves} Pending</span>
            )}
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {recentLeaves.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '20px 0', fontSize: '0.8rem' }}>
                No pending leave applications.
              </div>
            ) : (
              recentLeaves.map((leave, index) => (
                <div key={index} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 10, borderBottom: '1px solid var(--border-color)' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.825rem', fontWeight: 600 }}>{leave.name}</div>
                    <div style={{ fontSize: '0.725rem', color: 'var(--text-secondary)' }}>
                      {leave.leaveType.toUpperCase()} • {leave.days} Days ({leave.startDate} to {leave.endDate})
                    </div>
                  </div>
                  <div>
                    <button className="btn btn-outline btn-sm" onClick={() => setCurrentPage('leave')}>
                      Manage
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
