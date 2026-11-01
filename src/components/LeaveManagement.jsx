import React, { useContext, useState } from 'react';
import { HRMSContext } from '../context/HRMSContext';

export default function LeaveManagement() {
  const { employees, leaveRequests, addLeaveRequest, approveLeaveRequest, currentUser } = useContext(HRMSContext);

  const [activeTab, setActiveTab] = useState('balances');
  
  // Application Form States
  const [selectedEmpCode, setSelectedEmpCode] = useState(employees[0]?.employeeCode || '');
  const [leaveType, setLeaveType] = useState('casual');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [attachment, setAttachment] = useState('');
  const [formMsg, setFormMsg] = useState('');

  // Search
  const [searchTerm, setSearchTerm] = useState('');

  const activeEmployees = employees.filter(e => e.status === 'Active');
  const selectedEmp = employees.find(e => e.employeeCode === selectedEmpCode);

  // Calculate Days helper
  const calculateDays = () => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return isNaN(diffDays) ? 0 : diffDays;
  };

  const daysToApply = calculateDays();

  // Handle Leave Apply
  const handleApplySubmit = (e) => {
    e.preventDefault();
    if (!startDate || !endDate) {
      setFormMsg('ERROR: Please select start and end dates.');
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end < start) {
      setFormMsg('ERROR: End Date cannot be before Start Date.');
      return;
    }

    // Check Balance
    const balance = selectedEmp.leaveBalances[leaveType] || 0;
    if (daysToApply > balance) {
      setFormMsg(`ERROR: Insufficient balance! Selected employee only has ${balance} days of ${leaveType} leave left. Requested: ${daysToApply} days.`);
      return;
    }

    // Check overlaps in pending/approved requests
    const hasOverlap = leaveRequests.some(req => {
      if (req.employeeCode !== selectedEmpCode || req.status === 'Rejected') return false;
      const reqStart = new Date(req.startDate);
      const reqEnd = new Date(req.endDate);
      return (start <= reqEnd && end >= reqStart);
    });

    if (hasOverlap) {
      setFormMsg('ERROR: Overlap detected! Employee already has a pending or approved leave request covering these dates.');
      return;
    }

    const request = {
      employeeCode: selectedEmpCode,
      name: selectedEmp.fullNameEnglish,
      department: selectedEmp.department,
      leaveType,
      startDate,
      endDate,
      days: daysToApply,
      reason,
      attachmentName: attachment ? attachment.name : ''
    };

    addLeaveRequest(request);
    setFormMsg(`SUCCESS: Leave application for ${selectedEmp.fullNameEnglish} (${daysToApply} Days of ${leaveType}) has been submitted.`);
    
    // Clear
    setStartDate('');
    setEndDate('');
    setReason('');
    setAttachment('');
    setTimeout(() => setFormMsg(''), 5000);
  };

  // Handle Attachment Upload (mock)
  const handleAttachment = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAttachment(file);
    }
  };

  // Filtered Leave requests
  const pendingRequests = leaveRequests.filter(req => req.status === 'Pending');
  const pastRequests = leaveRequests.filter(req => req.status !== 'Pending');

  // Filtered Balances search
  const filteredBalances = activeEmployees.filter(emp => 
    emp.fullNameEnglish.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.employeeCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Tab Header */}
      <div className="tabs-header" style={{ marginBottom: 0 }}>
        <button className={`tab-btn ${activeTab === 'balances' ? 'active' : ''}`} onClick={() => setActiveTab('balances')}>Leave Balances</button>
        <button className={`tab-btn ${activeTab === 'apply' ? 'active' : ''}`} onClick={() => setActiveTab('apply')}>Online Application</button>
        <button className={`tab-btn ${activeTab === 'workflow' ? 'active' : ''}`} onClick={() => setActiveTab('workflow')}>Approval Workflow ({pendingRequests.length})</button>
        <button className={`tab-btn ${activeTab === 'calendar' ? 'active' : ''}`} onClick={() => setActiveTab('calendar')}>Leave Calendar</button>
      </div>

      {activeTab === 'balances' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Search Bar */}
          <div className="card" style={{ display: 'flex', gap: 16 }}>
            <input
              type="text"
              placeholder="Search employee or department leave balances..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ flex: 1 }}
            />
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }}>
              {filteredBalances.length} employees
            </span>
          </div>

          {/* Leave Balance Cards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
            {filteredBalances.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-secondary)', gridColumn: '1 / -1' }}>No employees found.</div>
            ) : (
              filteredBalances.map((emp, idx) => {
                const QUOTAS = { casual: 10, sick: 14, annual: 18 };
                return (
                  <div className="leave-balance-card" key={emp.id} style={{ animationDelay: `${idx * 0.04}s` }}>
                    <div className="leave-card-header">
                      <div>
                        <div className="leave-card-name">{emp.fullNameEnglish}</div>
                        <div className="leave-card-code">{emp.employeeCode}</div>
                      </div>
                      <span className="leave-card-dept-badge">{emp.department}</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {[['Casual', 'casual', 'warning'], ['Sick', 'sick', 'info'], ['Annual', 'annual', 'primary']].map(([label, key, colorClass]) => {
                        const quota = QUOTAS[key];
                        const used = quota - (emp.leaveBalances[key] || 0);
                        const left = emp.leaveBalances[key] || 0;
                        const pct = Math.round((left / quota) * 100);
                        return (
                          <div className="progress-bar-wrap" key={key}>
                            <div className="progress-bar-header">
                              <span className="progress-bar-label">{label} Leave</span>
                              <span className="progress-bar-value" style={{ color: left < 3 ? 'var(--danger)' : 'inherit' }}>
                                {left} / {quota} days left
                              </span>
                            </div>
                            <div className="progress-bar-track">
                              <div
                                className={`progress-bar-fill ${left < 3 ? 'danger' : colorClass}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
                      {emp.gender === 'female' && <span className="badge badge-info" style={{ fontSize: '0.65rem' }}>Maternity: {emp.leaveBalances.maternity}d</span>}
                      {emp.gender === 'male' && <span className="badge badge-info" style={{ fontSize: '0.65rem' }}>Paternity: {emp.leaveBalances.paternity}d</span>}
                      <span className="badge badge-info" style={{ fontSize: '0.65rem' }}>Special: {emp.leaveBalances.special}d</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {activeTab === 'apply' && (
        <div className="grid-2">
          {/* Apply Form */}
          <div className="card">
            <h3 style={{ color: 'var(--primary-color)', marginBottom: 16 }}>Apply for Leave</h3>
            <form onSubmit={handleApplySubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="form-group">
                <label>Select Applicant</label>
                <select
                  value={selectedEmpCode}
                  onChange={(e) => setSelectedEmpCode(e.target.value)}
                >
                  {activeEmployees.map(emp => (
                    <option key={emp.employeeCode} value={emp.employeeCode}>
                      {emp.employeeCode} - {emp.fullNameEnglish}
                    </option>
                  ))}
                </select>
              </div>

              {selectedEmp && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, padding: 12, background: 'rgba(0,180,216,0.05)', borderRadius: 6, fontSize: '0.75rem', marginBottom: 8 }}>
                  <div><strong>Casual Left:</strong> {selectedEmp.leaveBalances.casual} Days</div>
                  <div><strong>Sick Left:</strong> {selectedEmp.leaveBalances.sick} Days</div>
                  <div><strong>Annual Left:</strong> {selectedEmp.leaveBalances.annual} Days</div>
                </div>
              )}

              <div className="form-group">
                <label>Leave Type</label>
                <select
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value)}
                >
                  <option value="casual">Casual Leave (Short/Personal)</option>
                  <option value="sick">Sick Leave (Medical)</option>
                  <option value="annual">Annual Leave (Planned Vacation)</option>
                  <option value="maternity">Maternity Leave (120 Days - Female)</option>
                  <option value="paternity">Paternity Leave (7 Days - Male)</option>
                  <option value="special">Special Leave (Unpaid/Study/Ex-BD)</option>
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Start Date</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>End Date</label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>

              {daysToApply > 0 && (
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary-color)', marginBottom: 4 }}>
                  Total Requested Duration: {daysToApply} Days
                </div>
              )}

              <div className="form-group">
                <label>Reason / Explanation *</label>
                <textarea
                  required
                  rows="2"
                  placeholder="Explain the purpose of your leave request"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Supporting Attachment (Prescription/Ticket/Forms)</label>
                <input type="file" onChange={handleAttachment} />
              </div>

              <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start', marginTop: 8 }}>
                Submit Application
              </button>

              {formMsg && (
                <div style={{
                  padding: '12px 16px',
                  background: formMsg.startsWith('ERROR') ? 'rgba(239,68,68,0.08)' : 'rgba(16,185,129,0.08)',
                  border: formMsg.startsWith('ERROR') ? '1px solid var(--danger)' : '1px solid var(--success)',
                  borderRadius: 'var(--border-radius-sm)',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: formMsg.startsWith('ERROR') ? 'var(--danger)' : 'var(--success)'
                }}>
                  {formMsg}
                </div>
              )}
            </form>
          </div>

          {/* Leave Quota Details card */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h3 style={{ color: 'var(--primary-color)' }}>ATCL Bangladesh Leave Standard Policies</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: '0.825rem' }}>
              <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: 8 }}>
                <strong>Casual Leave (10 Days):</strong> Applicable for emergency or short personal errands. Cannot be combined with annual leaves.
              </div>
              <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: 8 }}>
                <strong>Sick Leave (14 Days):</strong> Enforced under BD Labor Act. Requires a registered doctor certificate if exceeding 3 consecutive days.
              </div>
              <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: 8 }}>
                <strong>Annual Leave (18 Days):</strong> Accrued during the year. Can be carried forward to next fiscal year up to 30 days.
              </div>
              <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: 8 }}>
                <strong>Maternity Leave (120 Days):</strong> Paid leave for female employees (enforced up to two children).
              </div>
              <div>
                <strong>Special Leave (Unpaid):</strong> Requires executive director approval. Considered as LWP (Leave Without Pay) and deducted during monthly payroll process.
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'workflow' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Pending Applications Queue */}
          <div className="card">
            <h3 style={{ color: 'var(--primary-color)', marginBottom: 16 }}>Pending Leave Requests Queue</h3>
            {pendingRequests.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '30px 0' }}>
                All clear! No pending leave requests requiring approval.
              </div>
            ) : (
              <div className="table-container" style={{ padding: 0, border: 'none' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Employee Code</th>
                      <th>Applicant</th>
                      <th>Leave Type</th>
                      <th>Duration</th>
                      <th>Dates</th>
                      <th>Reason</th>
                      <th>Attachment</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingRequests.map(req => (
                      <tr key={req.id}>
                        <td style={{ fontWeight: 700 }}>{req.employeeCode}</td>
                        <td style={{ fontWeight: 600 }}>{req.name}</td>
                        <td><span className="badge badge-info">{req.leaveType.toUpperCase()}</span></td>
                        <td style={{ fontWeight: 700 }}>{req.days} Days</td>
                        <td style={{ fontSize: '0.8rem' }}>{req.startDate} to {req.endDate}</td>
                        <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={req.reason}>{req.reason}</td>
                        <td>{req.attachmentName ? <span style={{ color: 'var(--secondary-color)', cursor: 'pointer', textDecoration: 'underline' }}>{req.attachmentName}</span> : 'None'}</td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: 8 }}>
                            <button className="btn btn-success btn-sm" onClick={() => approveLeaveRequest(req.id, currentUser.name, 'Approved')}>
                              Approve
                            </button>
                            <button className="btn btn-danger btn-sm" onClick={() => approveLeaveRequest(req.id, currentUser.name, 'Rejected')}>
                              Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Request Audit History */}
          <div className="card">
            <h3 style={{ color: 'var(--primary-color)', marginBottom: 16 }}>Processed Leave Audit logs</h3>
            <div className="table-container" style={{ padding: 0, border: 'none' }}>
              <table>
                <thead>
                  <tr>
                    <th>Employee Code</th>
                    <th>Applicant</th>
                    <th>Leave Type</th>
                    <th>Duration</th>
                    <th>Dates</th>
                    <th>Status</th>
                    <th>Approved / Rejected By</th>
                  </tr>
                </thead>
                <tbody>
                  {pastRequests.map(req => (
                    <tr key={req.id}>
                      <td style={{ fontWeight: 700 }}>{req.employeeCode}</td>
                      <td>{req.name}</td>
                      <td>{req.leaveType.toUpperCase()}</td>
                      <td>{req.days} Days</td>
                      <td style={{ fontSize: '0.8rem' }}>{req.startDate} to {req.endDate}</td>
                      <td>
                        <span className={`badge ${req.status === 'Approved' ? 'badge-success' : 'badge-danger'}`}>
                          {req.status}
                        </span>
                      </td>
                      <td>{req.approvedBy || 'HR Administrator'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'calendar' && (
        <div className="card">
          <h3 style={{ color: 'var(--primary-color)', marginBottom: 16 }}>Active Leaves Calendar</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 20 }}>
            List of employees currently or scheduled to be on leave this month.
          </p>

          <div className="table-container" style={{ padding: 0, border: 'none' }}>
            <table>
              <thead>
                <tr>
                  <th>Employee Code</th>
                  <th>Name</th>
                  <th>Department</th>
                  <th>Leave Type</th>
                  <th>Date Range</th>
                  <th>Duration</th>
                  <th>Remarks / Status</th>
                </tr>
              </thead>
              <tbody>
                {leaveRequests.filter(req => req.status === 'Approved').length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-secondary)' }}>
                      No active scheduled leaves recorded.
                    </td>
                  </tr>
                ) : (
                  leaveRequests.filter(req => req.status === 'Approved').map(req => (
                    <tr key={req.id}>
                      <td style={{ fontWeight: 700 }}>{req.employeeCode}</td>
                      <td style={{ fontWeight: 600 }}>{req.name}</td>
                      <td>{req.department}</td>
                      <td><span className="badge badge-info">{req.leaveType.toUpperCase()}</span></td>
                      <td>{req.startDate} to {req.endDate}</td>
                      <td style={{ fontWeight: 700 }}>{req.days} Days</td>
                      <td><span className="badge badge-success">Approved Vacation</span></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
