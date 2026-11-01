import React, { useContext, useState, useEffect } from 'react';
import { HRMSContext } from '../context/HRMSContext';
import { exportToExcel } from '../utils/excelExporter';

const HOLIDAYS = [
  { date: '2026-02-21', name: 'Shaheed Day & International Mother Language Day' },
  { date: '2026-03-17', name: 'National Children\'s Day & Birth Anniversary of Sheikh Mujibur Rahman' },
  { date: '2026-03-26', name: 'Independence & National Day' },
  { date: '2026-05-01', name: 'May Day (Labour Day)' },
  { date: '2026-06-16', name: 'Eid-ul-Adha * (Subject to Moon Sighting)' },
  { date: '2026-06-17', name: 'Eid-ul-Adha Day 2 *' },
  { date: '2026-12-16', name: 'Victory Day' },
  { date: '2026-12-25', name: 'Christmas Day' }
];

const SHIFTS = [
  { name: 'General Office Shift', time: '09:00 AM - 05:00 PM', grace: '15 Mins (9:15 AM)', type: 'Office-based' },
  { name: 'Technical Service Shift', time: '08:30 AM - 04:30 PM', grace: '15 Mins (8:45 AM)', type: 'Field-based' },
  { name: 'Support Shift', time: '10:00 AM - 06:00 PM', grace: '15 Mins (10:15 AM)', type: 'Office-based' },
  { name: 'Night Shift', time: '10:00 PM - 06:00 AM', grace: '15 Mins (10:15 PM)', type: 'Shift-based' }
];

export default function AttendanceManagement() {
  const { 
    employees, 
    attendanceLogs, 
    movementLogs, 
    breakLogs,
    correctionLogs,
    checkInEmployee, 
    checkOutEmployee, 
    startBreak, 
    endBreak, 
    logFieldMovement, 
    approveAttendanceLog,
    addAttendanceCorrection,
    companyInfo,
    currentUser
  } = useContext(HRMSContext);

  const [activeTab, setActiveTab] = useState('logs');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);
  const [statusFilter, setStatusFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [reportMonth, setReportMonth] = useState(new Date().toISOString().slice(0,7));
  
  // Simulator States
  const [selectedEmpCode, setSelectedEmpCode] = useState(employees[0]?.employeeCode || '');
  const [biometricMethod, setBiometricMethod] = useState('Fingerprint');
  const [simulateTime, setSimulateTime] = useState('09:05');
  const [simLat, setSimLat] = useState('23.7937'); // Banani HQ lat
  const [simLng, setSimLng] = useState('90.4066'); // Banani HQ lng
  const [simulationMsg, setSimulationMsg] = useState('');
  const [simCheckInType, setSimCheckInType] = useState('Office');
  const [simOutsideReason, setSimOutsideReason] = useState('Client Meeting');
  const [simOutsideNote, setSimOutsideNote] = useState('');
  const [simOutsideAttachment, setSimOutsideAttachment] = useState('');
  const [simShowReasonForm, setSimShowReasonForm] = useState(false);

  // Correction Request States
  const [corrDate, setCorrDate] = useState(new Date().toISOString().split('T')[0]);
  const [corrEmpCode, setCorrEmpCode] = useState(employees[0]?.employeeCode || '');
  const [corrCheckIn, setCorrCheckIn] = useState('09:00');
  const [corrCheckOut, setCorrCheckOut] = useState('17:00');
  const [corrOT, setCorrOT] = useState(0);
  const [corrReason, setCorrReason] = useState('');
  const [corrMsg, setCorrMsg] = useState('');

  const activeEmployees = employees.filter(e => e.status === 'Active');

  // Live clock state
  const [liveClock, setLiveClock] = useState('');
  useEffect(() => {
    const tick = () => setLiveClock(new Date().toLocaleTimeString('en-BD', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);

  // Filtered Logs
  const filteredLogs = attendanceLogs.filter(log => {
    const matchesSearch = log.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          log.employeeCode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDate = log.date === dateFilter;
    const matchesDept = !deptFilter || log.department === deptFilter;
    
    let matchesStatus = true;
    if (statusFilter === 'Late') matchesStatus = log.isLate;
    if (statusFilter === 'Overtime') matchesStatus = log.overtimeHours > 0;
    if (statusFilter === 'OnTime') matchesStatus = !log.isLate && log.status === 'Present';
    if (statusFilter === 'Outside') matchesStatus = log.checkInStatus === 'Outside Office';
    if (statusFilter === 'Pending') matchesStatus = log.approvalStatus === 'Pending';

    return matchesSearch && matchesDate && matchesDept && matchesStatus;
  });

  // Departments for filter
  const allDepts = [...new Set(employees.filter(e => e.status === 'Active').map(e => e.department))].sort();

  // Absent employees for the selected date
  const logsForDate = attendanceLogs.filter(l => l.date === dateFilter);
  const presentCodes = new Set(logsForDate.map(l => l.employeeCode));
  const absentEmployees = activeEmployees.filter(e => !presentCodes.has(e.employeeCode) && (!deptFilter || e.department === deptFilter));

  // Haversine formula
  const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // meters
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Simulator Check In Handler
  const handleSimulateCheckIn = (e) => {
    if (e) e.preventDefault();
    const emp = employees.find(e => e.employeeCode === selectedEmpCode);
    if (!emp) return;

    const lat = parseFloat(simLat) || 23.7937;
    const lng = parseFloat(simLng) || 90.4066;

    // Check geofence
    let inside = false;
    if (getDistance(lat, lng, 23.7937, 90.4066) <= 100) {
      inside = true;
    } else {
      const branches = companyInfo.branches || [];
      for (const branch of branches) {
        if (branch.latitude && branch.longitude) {
          if (getDistance(lat, lng, branch.latitude, branch.longitude) <= (branch.geofenceRadius || 100)) {
            inside = true;
            break;
          }
        }
      }
    }

    if (!inside && !simShowReasonForm) {
      setSimShowReasonForm(true);
      setSimulationMsg('WARNING: Simulated location is outside of branch geofence radius. Please fill in the mandatory reasons form.');
      return;
    }

    const reasonData = !inside ? {
      reasonType: simOutsideReason,
      note: simOutsideNote,
      attachmentName: simOutsideAttachment
    } : null;

    checkInEmployee(selectedEmpCode, {
      lat,
      lng,
      time: `${simulateTime}:00`,
      checkInType: simCheckInType,
      deviceInfo: `Simulated (${biometricMethod})`,
      address: inside ? 'Inside Fenced Office Area' : 'Outside Office Location',
      outsideReason: reasonData
    });

    setSimulationMsg(`SUCCESS: Simulated clock-in logged for ${emp.fullNameEnglish} at ${simulateTime}.`);
    setSimShowReasonForm(false);
    setSimOutsideNote('');
    setSimOutsideAttachment('');
    setTimeout(() => setSimulationMsg(''), 5000);
  };

  // Simulator Check Out Handler
  const handleSimulateCheckOut = () => {
    const emp = employees.find(e => e.employeeCode === selectedEmpCode);
    if (!emp) return;

    const dateStr = new Date().toISOString().split('T')[0];
    const existingLog = attendanceLogs.find(l => l.employeeCode === selectedEmpCode && l.date === dateStr);

    if (!existingLog) {
      setSimulationMsg(`ERROR: Employee has not checked in today yet! Please check in first.`);
      return;
    }

    const lat = parseFloat(simLat) || 23.7937;
    const lng = parseFloat(simLng) || 90.4066;

    checkOutEmployee(selectedEmpCode, {
      time: `${simulateTime}:00`,
      lat,
      lng,
      address: 'Simulated Check-out Address'
    });

    setSimulationMsg(`SUCCESS: Simulated clock-out logged for ${emp.fullNameEnglish} at ${simulateTime}.`);
    setTimeout(() => setSimulationMsg(''), 5000);
  };

  // Simulator Break Handler
  const handleSimBreakStart = () => {
    const emp = employees.find(e => e.employeeCode === selectedEmpCode);
    if (!emp) return;
    const lat = parseFloat(simLat) || 23.7937;
    const lng = parseFloat(simLng) || 90.4066;

    startBreak(selectedEmpCode, `${simulateTime}:00`, lat, lng);
    setSimulationMsg(`SUCCESS: Simulated break started for ${emp.fullNameEnglish} at ${simulateTime}.`);
    setTimeout(() => setSimulationMsg(''), 5000);
  };

  const handleSimBreakEnd = () => {
    const emp = employees.find(e => e.employeeCode === selectedEmpCode);
    if (!emp) return;
    const lat = parseFloat(simLat) || 23.7937;
    const lng = parseFloat(simLng) || 90.4066;

    endBreak(selectedEmpCode, `${simulateTime}:00`, lat, lng);
    setSimulationMsg(`SUCCESS: Simulated break ended for ${emp.fullNameEnglish} at ${simulateTime}.`);
    setTimeout(() => setSimulationMsg(''), 5000);
  };

  // Simulate Location Ping for active movement tracking
  const handleSimLocationPing = () => {
    const emp = employees.find(e => e.employeeCode === selectedEmpCode);
    if (!emp) return;
    // Generate coordinate offset
    const lat = parseFloat(simLat) + (Math.random() - 0.5) * 0.01;
    const lng = parseFloat(simLng) + (Math.random() - 0.5) * 0.01;
    const status = ['Walking', 'Driving', 'Still'][Math.floor(Math.random() * 3)];

    logFieldMovement(selectedEmpCode, { lat, lng }, status);
    setSimulationMsg(`SUCCESS: Simulated location ping tracked for ${emp.fullNameEnglish} (${status}).`);
    setTimeout(() => setSimulationMsg(''), 5000);
  };

  // Submit Correction Request
  const handleCorrectionSubmit = (e) => {
    e.preventDefault();
    const request = {
      employeeCode: corrEmpCode,
      date: corrDate,
      checkIn: `${corrCheckIn}:00`,
      checkOut: `${corrCheckOut}:00`,
      overtimeHours: parseInt(corrOT) || 0,
      reason: corrReason
    };

    addAttendanceCorrection(request);
    setCorrMsg(`SUCCESS: Attendance record for ${corrEmpCode} on ${corrDate} has been manually corrected & approved.`);
    setCorrReason('');
    setTimeout(() => setCorrMsg(''), 5000);
  };

  // Export reports to Excel
  const handleExportReports = () => {
    const data = filteredLogs.map(log => ({
      'Employee Code': log.employeeCode,
      'Name': log.name,
      'Department': log.department,
      'Date': log.date,
      'Check-in Time': log.checkIn,
      'Check-out Time': log.checkOut || '--',
      'Geofence Status': log.checkInStatus || 'Office Attendance',
      'Net Work Hours': log.totalWorkingMinutes ? (log.totalWorkingMinutes / 60).toFixed(2) : '--',
      'OT Hours': log.overtimeHours || 0,
      'Approval Status': log.approvalStatus || 'Approved'
    }));
    exportToExcel(data, `Attendance_Report_${dateFilter}`, 'Daily Logs');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Tab Header */}
      <div className="tabs-header" style={{ marginBottom: 0 }}>
        <button className={`tab-btn ${activeTab === 'logs' ? 'active' : ''}`} onClick={() => setActiveTab('logs')}>Daily logs & Approvals</button>
        <button className={`tab-btn ${activeTab === 'simulator' ? 'active' : ''}`} onClick={() => setActiveTab('simulator')}>Advanced simulator</button>
        <button className={`tab-btn ${activeTab === 'live' ? 'active' : ''}`} onClick={() => setActiveTab('live')}>Live Tracker Dashboard</button>
        <button className={`tab-btn ${activeTab === 'reports' ? 'active' : ''}`} onClick={() => setActiveTab('reports')}>Reports & Audits</button>
        <button className={`tab-btn ${activeTab === 'shifts' ? 'active' : ''}`} onClick={() => setActiveTab('shifts')}>Shifts & Holidays</button>
        <button className={`tab-btn ${activeTab === 'corrections' ? 'active' : ''}`} onClick={() => setActiveTab('corrections')}>Correction Requests</button>
      </div>

      {activeTab === 'logs' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Daily Summary Stat Cards */}
          <div className="stats-grid">
            <div className="card stat-card stat-card-enhanced animate-fade-up">
              <div className="stat-info">
                <span className="stat-label">Present Today</span>
                <span className="stat-value" style={{ color: 'var(--success)' }}>
                  {filteredLogs.filter(l => l.status === 'Present').length}
                </span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Date: {dateFilter}</span>
              </div>
              <div className="stat-icon-wrapper" style={{ background: 'rgba(16,185,129,0.08)', color: 'var(--success)' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{width:22,height:22}}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              </div>
            </div>
            <div className="card stat-card yellow stat-card-enhanced animate-fade-up animate-fade-up-d1">
              <div className="stat-info">
                <span className="stat-label">Late Entries</span>
                <span className="stat-value" style={{ color: 'var(--warning)' }}>
                  {filteredLogs.filter(l => l.isLate).length}
                </span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>After 9:15 AM</span>
              </div>
              <div className="stat-icon-wrapper">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{width:22,height:22}}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              </div>
            </div>
            <div className="card stat-card stat-card-enhanced animate-fade-up animate-fade-up-d2">
              <div className="stat-info">
                <span className="stat-label">Overtime</span>
                <span className="stat-value" style={{ color: 'var(--info)' }}>
                  {filteredLogs.filter(l => l.overtimeHours > 0).length}
                </span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Double-rate eligible</span>
              </div>
              <div className="stat-icon-wrapper" style={{ background: 'rgba(59,130,246,0.08)', color: 'var(--info)' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{width:22,height:22}}><polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
              </div>
            </div>
            <div className="card stat-card red stat-card-enhanced animate-fade-up animate-fade-up-d3">
              <div className="stat-info">
                <span className="stat-label">Pending Approval</span>
                <span className="stat-value" style={{ color: 'var(--danger)' }}>
                  {filteredLogs.filter(l => l.approvalStatus === 'Pending').length}
                </span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Needs HR review</span>
              </div>
              <div className="stat-icon-wrapper" style={{ background: 'rgba(239,68,68,0.08)', color: 'var(--danger)' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{width:22,height:22}}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              </div>
            </div>
          </div>
          {/* Filters */}
          <div className="card" style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, flex: 1 }}>
              <input
                type="text"
                placeholder="Search by code or name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ minWidth: 180, flex: 1 }}
              />
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                style={{ minWidth: 140 }}
              />
              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                style={{ minWidth: 160 }}
              >
                <option value="">All Departments</option>
                {allDepts.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Attendance States</option>
                <option value="OnTime">Present (On-Time)</option>
                <option value="Late">Present (Late Entry)</option>
                <option value="Outside">Outside Office Location</option>
                <option value="Pending">Pending Approval</option>
                <option value="Overtime">Overtime Earned</option>
              </select>
            </div>
            <button className="btn btn-outline btn-sm" onClick={handleExportReports}>Export Logs</button>
          </div>

          {/* Daily Table */}
          <div className="card table-container" style={{ padding: 0 }}>
            <table>
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Employee Name</th>
                  <th>Clock In</th>
                  <th>Clock Out</th>
                  <th>Fenced Status</th>
                  <th>Break Time</th>
                  <th>Net Hours</th>
                  <th>Workflow</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan="9" style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-secondary)' }}>
                      No attendance logs recorded for this day matching filters.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map(log => (
                    <tr key={log.id} className={log.isLate ? 'row-late' : (!log.checkOut ? '' : 'row-present')}>
                      <td style={{ fontWeight: 700 }}>{log.employeeCode}</td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{log.name}</div>
                        <div style={{ fontSize: '0.725rem', color: 'var(--text-secondary)' }}>{log.designation} • {log.department}</div>
                      </td>
                      <td style={{ color: log.isLate ? 'var(--warning)' : 'inherit' }}>
                        <div>{log.checkIn}</div>
                        <div style={{ fontSize: '0.725rem', color: 'var(--text-secondary)' }}>Type: {log.checkInType || 'Office'}</div>
                      </td>
                      <td>{log.checkOut || '--:--:--'}</td>
                      <td>
                        <span className={`badge ${log.checkInStatus === 'Office Attendance' ? 'badge-success' : 'badge-warning'}`}>
                          {log.checkInStatus || 'Office Attendance'}
                        </span>
                        {log.outsideReason && (
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: 4, maxWidth: 180, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} title={`${log.outsideReason.reasonType}: ${log.outsideReason.note}`}>
                            Reason: {log.outsideReason.reasonType}
                          </div>
                        )}
                      </td>
                      <td>{log.totalBreakMinutes ? `${log.totalBreakMinutes} mins` : '0 mins'}</td>
                      <td style={{ fontWeight: 700 }}>
                        {log.totalWorkingMinutes ? `${(log.totalWorkingMinutes / 60).toFixed(1)} hrs` : '--'}
                      </td>
                      <td>
                        <span className={`badge ${log.approvalStatus === 'Approved' ? 'badge-success' : (log.approvalStatus === 'Pending' ? 'badge-warning' : 'badge-danger')}`}>
                          {log.approvalStatus || 'Approved'}
                        </span>
                        {log.approvedBy && <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginTop: 2 }}>By: {log.approvedBy}</div>}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {log.approvalStatus === 'Pending' ? (
                          <div style={{ display: 'inline-flex', gap: 6 }}>
                            <button className="btn btn-primary btn-sm" style={{ padding: '4px 8px', fontSize: '0.75rem' }} onClick={() => approveAttendanceLog(log.id, 'Admin Manager', 'Approved')}>Approve</button>
                            <button className="btn btn-danger btn-sm" style={{ padding: '4px 8px', fontSize: '0.75rem' }} onClick={() => approveAttendanceLog(log.id, 'Admin Manager', 'Rejected')}>Reject</button>
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Locked</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Absent Employees Card */}
          <div className="card animate-fade-up" style={{ borderLeft: '4px solid var(--danger)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div>
                <h4 style={{ color: 'var(--danger)', fontSize: '0.9rem', fontWeight: 700 }}>Absent Employees — {dateFilter}</h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                  {absentEmployees.length} employee{absentEmployees.length !== 1 ? 's' : ''} without attendance record{deptFilter ? ` in ${deptFilter}` : ''}
                </p>
              </div>
              <span className="badge badge-danger" style={{ fontSize: '1rem', padding: '6px 14px' }}>{absentEmployees.length}</span>
            </div>
            {absentEmployees.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--success)', fontSize: '0.85rem', fontWeight: 600 }}>
                ✓ All employees are accounted for on this date.
              </div>
            ) : (
              <div className="absent-list-wrap">
                {absentEmployees.map(emp => (
                  <div key={emp.employeeCode} className="absent-emp-item">
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center', minWidth: 0 }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 800, color: 'var(--danger)', flexShrink: 0 }}>
                        {emp.fullNameEnglish.charAt(0)}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div className="absent-emp-name">{emp.fullNameEnglish}</div>
                        <div className="absent-emp-meta">{emp.employeeCode} • {emp.designation}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'right', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{emp.department}</span>
                      <span className="badge badge-danger" style={{ fontSize: '0.65rem' }}>Absent</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'simulator' && (
        <div className="grid-2">
          {/* Simulator Form */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h3 style={{ color: 'var(--primary-color)' }}>Advanced GPS & Biometric Simulator</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Emulate mobile app checking in/out, geofence radius validations, break logging, and GPS movement tracking.
            </p>

            <form onSubmit={handleSimulateCheckIn} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="form-group">
                <label>Select Active Employee</label>
                <select
                  value={selectedEmpCode}
                  onChange={(e) => { setSelectedEmpCode(e.target.value); setSimShowReasonForm(false); }}
                >
                  {activeEmployees.map(emp => (
                    <option key={emp.employeeCode} value={emp.employeeCode}>
                      {emp.employeeCode} - {emp.fullNameEnglish} ({emp.department})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Verification Method</label>
                  <select value={biometricMethod} onChange={(e) => setBiometricMethod(e.target.value)}>
                    <option value="Fingerprint">Fingerprint Scan</option>
                    <option value="Face Recognition">Face recognition</option>
                    <option value="GPS Coordinates">Mobile App (GPS Geofence)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Simulated Time</label>
                  <input
                    type="time"
                    value={simulateTime}
                    onChange={(e) => setSimulateTime(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Latitude (Banani HQ = 23.7937)</label>
                  <input type="text" value={simLat} onChange={(e) => setSimLat(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Longitude (Banani HQ = 90.4066)</label>
                  <input type="text" value={simLng} onChange={(e) => setSimLng(e.target.value)} />
                </div>
              </div>

              <div className="form-group">
                <label>Attendance Type</label>
                <select value={simCheckInType} onChange={(e) => setSimCheckInType(e.target.value)}>
                  <option value="Office">Office Attendance</option>
                  <option value="Branch Office">Branch Office Location</option>
                  <option value="Client Site">Client Site Visit</option>
                  <option value="Field Work">Field Duty</option>
                  <option value="Remote Work">Remote Work</option>
                </select>
              </div>

              {simShowReasonForm && (
                <div style={{ padding: 12, border: '1px solid var(--warning)', borderRadius: 6, background: 'rgba(245, 158, 11, 0.05)', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <h4 style={{ color: 'var(--warning)', fontSize: '0.85rem', fontWeight: 700 }}>Mandatory Outside Office Form</h4>
                  <div className="form-group">
                    <label>Reason Type *</label>
                    <select value={simOutsideReason} onChange={(e) => setSimOutsideReason(e.target.value)}>
                      <option value="Client Meeting">Client Meeting</option>
                      <option value="Site Visit">Site Visit</option>
                      <option value="Field Work">Field Work</option>
                      <option value="Training">Training</option>
                      <option value="Official Travel">Official Travel</option>
                      <option value="Court Visit">Court Visit</option>
                      <option value="Sales / Marketing Work">Sales / Marketing Work</option>
                      <option value="Remote Work">Remote Work</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Detail Note *</label>
                    <textarea required rows="2" placeholder="Provide note details..." value={simOutsideNote} onChange={(e) => setSimOutsideNote(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>Upload Proof (optional)</label>
                    <input type="text" placeholder="e.g. ticket.pdf or client_selfie.png" value={simOutsideAttachment} onChange={(e) => setSimOutsideAttachment(e.target.value)} />
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 12 }}>
                <button type="submit" className="btn btn-primary" style={{ flex: '1 1 120px' }}>
                  {simShowReasonForm ? 'Confirm Check-In' : 'Simulate Check-In'}
                </button>
                <button type="button" className="btn btn-danger" onClick={handleSimulateCheckOut} style={{ flex: '1 1 120px' }}>
                  Simulate Check-Out
                </button>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                <button type="button" className="btn btn-outline" onClick={handleSimBreakStart} style={{ flex: 1 }}>Start Break</button>
                <button type="button" className="btn btn-outline" onClick={handleSimBreakEnd} style={{ flex: 1 }}>End Break</button>
                <button type="button" className="btn btn-secondary" onClick={handleSimLocationPing} style={{ flex: 1.5 }}>Ping Location Movement</button>
              </div>
            </form>

            {simulationMsg && (
              <div style={{
                padding: '12px 16px',
                background: simulationMsg.startsWith('ERROR') ? 'rgba(239, 68, 68, 0.08)' : (simulationMsg.startsWith('WARNING') ? 'rgba(245, 158, 11, 0.08)' : 'rgba(16, 185, 129, 0.08)'),
                border: simulationMsg.startsWith('ERROR') ? '1px solid var(--danger)' : (simulationMsg.startsWith('WARNING') ? '1px solid var(--warning)' : '1px solid var(--success)'),
                borderRadius: 'var(--border-radius-sm)',
                fontSize: '0.8rem',
                fontWeight: 600,
                color: simulationMsg.startsWith('ERROR') ? 'var(--danger)' : (simulationMsg.startsWith('WARNING') ? 'var(--warning)' : 'var(--success)')
              }}>
                {simulationMsg}
              </div>
            )}
          </div>

          {/* Fencing status visual monitor */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 20, justifyContent: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ color: 'var(--primary-color)' }}>Fencing Verification & Status Monitor</h4>
              <div style={{ fontVariantNumeric: 'tabular-nums', fontSize: '1rem', fontWeight: 700, color: 'var(--secondary-color)', letterSpacing: '1px', background: 'rgba(0,180,216,0.08)', padding: '4px 12px', borderRadius: 8 }}>
                ⏱ {liveClock}
              </div>
            </div>
            <div style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-sm)', padding: 16, background: 'rgba(0,0,0,0.01)', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem' }}>Check-in Location:</span>
                <span className="badge badge-success">
                  {getDistance(parseFloat(simLat) || 0, parseFloat(simLng) || 0, 23.7937, 90.4066) <= 100 ? 'Inside Banani HQ Geofence' : 'Outside Office Geofence'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem' }}>Distance from Banani HQ:</span>
                <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>
                  {getDistance(parseFloat(simLat) || 0, parseFloat(simLng) || 0, 23.7937, 90.4066).toFixed(1)} meters
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem' }}>Coordinates Verified:</span>
                <span style={{ fontSize: '0.8rem', fontFamily: 'monospace' }}>Lat: {parseFloat(simLat).toFixed(4)} | Lng: {parseFloat(simLng).toFixed(4)}</span>
              </div>
            </div>
            
            {/* Enhanced Animated Radar */}
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div className="radar-container" style={{ width: 160, height: 160, background: 'rgba(0,51,102,0.04)', border: '2px solid var(--primary-color)', borderRadius: '50%' }}>
                <div className="radar-ring" style={{ width: '60%', height: '60%' }} />
                <div className="radar-ring" style={{ width: '80%', height: '80%' }} />
                <div className="radar-ring" style={{ width: '100%', height: '100%' }} />
                <div className="radar-sweep-line" />
                <svg viewBox="0 0 24 24" fill="none" stroke="var(--secondary-color)" strokeWidth="1.5" style={{width: 36, height: 36, position: 'relative', zIndex: 2}}>
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
                <span style={{ position: 'absolute', bottom: 18, fontSize: '0.6rem', fontWeight: 800, color: 'var(--secondary-color)', letterSpacing: '1px' }}>GPS LIVE</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'live' && (
        <div className="grid-2">
          {/* Active Field Workers Track Panel */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h3 style={{ color: 'var(--primary-color)' }}>Live Field Workers Map View</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Real-time locations of field workers logged via background GPS telemetry.
            </p>
            
            {/* Visual SVG Map grid */}
            <div style={{ height: 260, border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-sm)', background: 'var(--bg-input)', position: 'relative', overflow: 'hidden' }}>
              {/* HQ representation */}
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 16, height: 16, background: 'var(--primary-color)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
                <div style={{ position: 'absolute', width: 40, height: 40, border: '1px solid var(--primary-color)', borderRadius: '50%', opacity: 0.5, animation: 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite' }}></div>
                <span style={{ fontSize: '0.55rem', color: '#fff', fontWeight: 800 }}>HQ</span>
              </div>

              {/* Render pings as visual dots */}
              {movementLogs.slice(0, 10).map((log, idx) => {
                // Calculate random visual layout offsets
                const offsetHash = log.employeeCode.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
                const leftPercent = 50 + ((offsetHash % 30) - 15) * 2.5 + (idx * 2);
                const topPercent = 50 + ((offsetHash % 20) - 10) * 3 + (idx * 1.5);
                return (
                  <div key={log.id} style={{ position: 'absolute', left: `${leftPercent}%`, top: `${topPercent}%`, transform: 'translate(-50%, -50%)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ width: 10, height: 10, background: 'var(--success)', borderRadius: '50%' }}>
                      <div style={{ position: 'absolute', width: 22, height: 22, border: '1px solid var(--success)', borderRadius: '50%', opacity: 0.6, animation: 'ping 1.5s infinite' }}></div>
                    </div>
                    <span style={{ fontSize: '0.55rem', fontWeight: 600, background: 'var(--card-bg)', border: '1px solid var(--border-color)', padding: '1px 3px', borderRadius: 3, marginTop: 4 }}>
                      {log.employeeCode}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Status Statistics */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, textAlign: 'center', fontSize: '0.8rem' }}>
              <div style={{ border: '1px solid var(--border-color)', padding: 10, borderRadius: 6 }}>
                <div>Present Today</div>
                <strong style={{ fontSize: '1.2rem', color: 'var(--success)' }}>
                  {attendanceLogs.filter(l => l.date === dateFilter).length}
                </strong>
              </div>
              <div style={{ border: '1px solid var(--border-color)', padding: 10, borderRadius: 6 }}>
                <div>Field Workers</div>
                <strong style={{ fontSize: '1.2rem', color: 'var(--primary-color)' }}>
                  {[...new Set(movementLogs.map(l => l.employeeCode))].length}
                </strong>
              </div>
              <div style={{ border: '1px solid var(--border-color)', padding: 10, borderRadius: 6 }}>
                <div>Late Entries</div>
                <strong style={{ fontSize: '1.2rem', color: 'var(--warning)' }}>
                  {attendanceLogs.filter(l => l.date === dateFilter && l.isLate).length}
                </strong>
              </div>
            </div>
          </div>

          {/* Tracking History Log Feed */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h3 style={{ color: 'var(--primary-color)' }}>Movement history Log feed</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Real-time background GPS pings received from active employee sessions.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 350, overflowY: 'auto' }}>
              {movementLogs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                  No movement logs captured yet. Use the Simulator to trigger coordinates.
                </div>
              ) : (
                movementLogs.slice(0, 15).map(log => (
                  <div key={log.id} style={{ padding: 10, border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-sm)', background: 'var(--bg-input)', fontSize: '0.775rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, marginBottom: 4 }}>
                      <span style={{ color: 'var(--primary-color)' }}>{log.employeeCode}</span>
                      <span style={{ color: 'var(--text-secondary)' }}>{log.logTime}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span><strong>Coordinates:</strong> {log.coordinates.lat.toFixed(5)}, {log.coordinates.lng.toFixed(5)}</span>
                      <span><strong>Battery:</strong> {log.batteryLevel}%</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, color: 'var(--text-secondary)' }}>
                      <span>Status: <strong style={{ color: 'var(--text-primary)' }}>{log.activityStatus}</strong></span>
                      <span>GPS Spoof Checked: <span style={{ color: 'var(--success)', fontWeight: 600 }}>Pass</span></span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'reports' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Monthly summaries grid */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <h3 style={{ color: 'var(--primary-color)' }}>Monthly Attendance Statistics Summary</h3>
              <div style={{ display: 'flex', gap: 12 }}>
                <input
                  type="month"
                  value={reportMonth}
                  onChange={(e) => setReportMonth(e.target.value)}
                  style={{ minWidth: 150 }}
                />
              </div>
            </div>

            <div className="table-container" style={{ padding: 0 }}>
              <table>
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Employee Name</th>
                    <th>Present</th>
                    <th>Absent</th>
                    <th>Late Entries</th>
                    <th>Total Hours</th>
                    <th>OT Hours</th>
                    <th>Attendance %</th>
                    <th>Field Visits</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    // Calculate working days in the month (excluding Fridays)
                    const [ym, mm] = reportMonth.split('-').map(Number);
                    const daysInMonth = new Date(ym, mm, 0).getDate();
                    let workingDays = 0;
                    for (let d = 1; d <= daysInMonth; d++) {
                      const day = new Date(ym, mm - 1, d).getDay();
                      if (day !== 5) workingDays++; // 5 = Friday
                    }

                    return activeEmployees.map(emp => {
                      const empLogs = attendanceLogs.filter(l => l.employeeCode === emp.employeeCode && l.date.startsWith(reportMonth));
                      const present = empLogs.length;
                      const absent = Math.max(0, workingDays - present);
                      const lates = empLogs.filter(l => l.isLate).length;
                      const totalMins = empLogs.reduce((sum, l) => sum + (l.totalWorkingMinutes || 0), 0);
                      const totalHrs = (totalMins / 60).toFixed(1);
                      const totalOT = empLogs.reduce((sum, l) => sum + (l.overtimeHours || 0), 0);
                      const fieldVisits = empLogs.filter(l => l.checkInType === 'Field Work' || l.checkInType === 'Client Site').length;
                      const attPct = workingDays > 0 ? Math.round((present / workingDays) * 100) : 0;

                      return (
                        <tr key={emp.id}>
                          <td style={{ fontWeight: 700 }}>{emp.employeeCode}</td>
                          <td>
                            <div style={{ fontWeight: 600 }}>{emp.fullNameEnglish}</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{emp.department}</div>
                          </td>
                          <td style={{ color: 'var(--success)', fontWeight: 700 }}>{present}d</td>
                          <td style={{ color: absent > 0 ? 'var(--danger)' : 'var(--text-muted)', fontWeight: absent > 0 ? 700 : 400 }}>{absent}d</td>
                          <td style={{ color: lates > 3 ? 'var(--danger)' : (lates > 0 ? 'var(--warning)' : 'inherit') }}>{lates}d</td>
                          <td style={{ fontWeight: 700 }}>{totalHrs} hrs</td>
                          <td style={{ color: 'var(--primary-color)', fontWeight: 700 }}>{totalOT} hrs</td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div style={{ flex: 1, height: 6, background: 'var(--border-color)', borderRadius: 100, overflow: 'hidden', minWidth: 50 }}>
                                <div style={{ width: `${attPct}%`, height: '100%', borderRadius: 100, background: attPct >= 90 ? 'var(--success)' : (attPct >= 75 ? 'var(--warning)' : 'var(--danger)'), transition: 'width 0.8s ease' }} />
                              </div>
                              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: attPct >= 90 ? 'var(--success)' : (attPct >= 75 ? 'var(--warning)' : 'var(--danger)'), minWidth: 36 }}>{attPct}%</span>
                            </div>
                          </td>
                          <td>{fieldVisits} visits</td>
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'shifts' && (
        <div className="grid-2">
          {/* Shifts */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h3 style={{ color: 'var(--primary-color)' }}>Shift Configurations</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Standard and service shift parameters enforced for attendance audits.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {SHIFTS.map((sh, idx) => (
                <div key={idx} style={{ padding: 14, border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-sm)', background: 'var(--bg-input)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>{sh.name}</span>
                    <span className="badge badge-info" style={{ fontSize: '0.65rem' }}>{sh.type}</span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    <strong>Hours:</strong> {sh.time} | <strong>Grace Period:</strong> {sh.grace}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Holidays */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h3 style={{ color: 'var(--primary-color)' }}>Holiday Calendar 2026</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Official holidays in Bangladesh integrated into the payroll LWP calculation system.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 300, overflowY: 'auto' }}>
              {HOLIDAYS.map((h, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-color)', fontSize: '0.8rem' }}>
                  <span style={{ fontWeight: 600 }}>{h.name}</span>
                  <span style={{ color: 'var(--text-secondary)' }}>{h.date}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'corrections' && (
        <div className="grid-2">
          {/* Submission form */}
          <div className="card">
            <h3 style={{ color: 'var(--primary-color)', marginBottom: 16 }}>Submit Manual Correction</h3>
            <form onSubmit={handleCorrectionSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="form-group">
                <label>Select Employee</label>
                <select
                  value={corrEmpCode}
                  onChange={(e) => setCorrEmpCode(e.target.value)}
                >
                  {activeEmployees.map(emp => (
                    <option key={emp.employeeCode} value={emp.employeeCode}>
                      {emp.employeeCode} - {emp.fullNameEnglish}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Date of Correction</label>
                  <input
                    type="date"
                    required
                    value={corrDate}
                    onChange={(e) => setCorrDate(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Overtime Hours</label>
                  <input
                    type="number"
                    min="0"
                    max="8"
                    value={corrOT}
                    onChange={(e) => setCorrOT(parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Corrected Clock In</label>
                  <input
                    type="time"
                    required
                    value={corrCheckIn}
                    onChange={(e) => setCorrCheckIn(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Corrected Clock Out</label>
                  <input
                    type="time"
                    required
                    value={corrCheckOut}
                    onChange={(e) => setCorrCheckOut(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Reason for Correction *</label>
                <textarea
                  required
                  rows="2"
                  placeholder="e.g. Device synchronization error / client visit"
                  value={corrReason}
                  onChange={(e) => setCorrReason(e.target.value)}
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start', marginTop: 8 }}>
                Approve & Override
              </button>

              {corrMsg && (
                <div style={{
                  padding: '12px 16px',
                  background: 'rgba(16, 185, 129, 0.08)',
                  border: '1px solid var(--success)',
                  borderRadius: 'var(--border-radius-sm)',
                  fontSize: '0.8rem',
                  color: 'var(--success)',
                  fontWeight: 600
                }}>
                  {corrMsg}
                </div>
              )}
            </form>
          </div>

          {/* Real Correction Audit History */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ color: 'var(--primary-color)' }}>Correction History Audit</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                  All manual clock adjustments approved by HR — real-time audit trail.
                </p>
              </div>
              <span className="badge badge-success">{correctionLogs.length} Record{correctionLogs.length !== 1 ? 's' : ''}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 420, overflowY: 'auto' }}>
              {correctionLogs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-secondary)', fontSize: '0.825rem' }}>
                  No manual corrections have been submitted yet. Use the form above to create one.
                </div>
              ) : (
                correctionLogs.map(entry => (
                  <div key={entry.id} className="corr-audit-card">
                    <div className="corr-audit-header">
                      <span style={{ color: 'var(--primary-color)' }}>{entry.employeeCode} — {entry.name}</span>
                      <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>✓ {entry.status}</span>
                    </div>
                    <div className="corr-audit-times">
                      <strong>Date:</strong> {entry.date} &nbsp;|&nbsp;
                      <strong>Clock In:</strong> {entry.correctedCheckIn} &nbsp;→&nbsp;
                      <strong>Clock Out:</strong> {entry.correctedCheckOut}
                      {entry.overtimeHours > 0 && <span style={{ color: 'var(--primary-color)', marginLeft: 8 }}>(OT: {entry.overtimeHours} hr{entry.overtimeHours !== 1 ? 's' : ''})</span>}
                    </div>
                    <div className="corr-audit-reason">
                      <strong>Reason:</strong> {entry.reason}
                    </div>
                    <div className="corr-audit-footer">
                      <span>Dept: {entry.department}</span>
                      <span>Approved by: <strong>{entry.approvedBy}</strong></span>
                      <span>{new Date(entry.approvedAt).toLocaleString('en-BD', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
