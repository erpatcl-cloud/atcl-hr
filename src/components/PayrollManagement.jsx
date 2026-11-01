import React, { useContext, useState } from 'react';
import { HRMSContext } from '../context/HRMSContext';
import { exportBankTransferExcel, exportToExcel } from '../utils/excelExporter';
import { generatePayslipPDF } from '../utils/pdfGenerator';

const BONUS_TYPES = [
  { id: 'None', name: 'No Bonus Active' },
  { id: 'Eid-ul-Fitr', name: 'Eid-ul-Fitr Bonus' },
  { id: 'Ramadan', name: 'Ramadan Allowance' },
  { id: 'Eid-ul-Adha', name: 'Eid-ul-Adha Bonus' },
  { id: 'Durga Puja', name: 'Durga Puja Bonus' },
  { id: 'New Year Festival', name: 'Festival Bonus' }
];

export default function PayrollManagement() {
  const { employees, payrollRuns, runMonthlyPayroll, revisions, reviseSalary, currentUser } = useContext(HRMSContext);

  const [activeTab, setActiveTab] = useState('process');
  
  // Processing form state
  const [processMonth, setProcessMonth] = useState('2026-06');
  const [bonusType, setBonusType] = useState('None');
  const [bonusPercent, setBonusPercent] = useState(50); // 50% of Basic
  const [runMsg, setRunMsg] = useState('');

  // Salary Revision Form States
  const [revEmpCode, setRevEmpCode] = useState(employees[0]?.employeeCode || '');
  const [revNewGross, setRevNewGross] = useState(30000);
  const [revReason, setRevReason] = useState('');
  const [revMsg, setRevMsg] = useState('');

  // Active processed run
  const activeRun = payrollRuns.find(run => run.month === processMonth);
  const activeEmployees = employees.filter(e => e.status === 'Active');

  const handleProcessPayroll = (e) => {
    e.preventDefault();
    runMonthlyPayroll(processMonth, bonusType, bonusType !== 'None' ? bonusPercent : 0);
    setRunMsg(`SUCCESS: Monthly payroll for ${processMonth} processed successfully for ${activeEmployees.length} employees.`);
    setTimeout(() => setRunMsg(''), 5000);
  };

  const handleReviseSubmit = (e) => {
    e.preventDefault();
    const emp = employees.find(e => e.employeeCode === revEmpCode);
    if (!emp) return;
    
    reviseSalary(revEmpCode, revNewGross, revReason, currentUser.name);
    setRevMsg(`SUCCESS: Salary of ${emp.fullNameEnglish} revised to ৳${revNewGross.toLocaleString()} effective immediately.`);
    setRevReason('');
    setRevNewGross(30000);
    setTimeout(() => setRevMsg(''), 5000);
  };

  const handleDownloadPayslip = (row) => {
    const emp = employees.find(e => e.employeeCode === row.employeeCode);
    if (emp) {
      // Format Month Name
      const [year, month] = processMonth.split('-');
      const dateObj = new Date(year, month - 1);
      const monthName = dateObj.toLocaleString('default', { month: 'long', year: 'numeric' });
      generatePayslipPDF(emp, row, monthName);
    }
  };

  const handleExportBankTransfer = () => {
    if (!activeRun) return;
    const [year, month] = processMonth.split('-');
    const dateObj = new Date(year, month - 1);
    const monthName = dateObj.toLocaleString('default', { month: 'long', year: 'numeric' });
    exportBankTransferExcel(activeRun.rows, 'City Bank Ltd.', monthName);
  };

  const handleExportPayrollSummary = () => {
    if (!activeRun) return;
    const flatRows = activeRun.rows.map(row => ({
      'Employee Code': row.employeeCode,
      'Name': row.name,
      'Designation': row.designation,
      'Department': row.department,
      'Basic Salary (BDT)': row.basicSalary,
      'House Rent (BDT)': row.houseRent,
      'Medical (BDT)': row.medicalAllowance,
      'Conveyance (BDT)': row.conveyanceAllowance,
      'Mobile (BDT)': row.mobileAllowance,
      'Overtime Hours': row.overtimeHours,
      'Overtime Pay (BDT)': row.overtimePay,
      'Bonus Pay (BDT)': row.bonusPay,
      'Gross Salary (BDT)': row.grossSalary,
      'TDS Tax Deduction (BDT)': row.taxDeduction,
      'Provident Fund (BDT)': row.providentFund,
      'LWP Days': row.unpaidLeaveDays,
      'LWP Deduction (BDT)': row.unpaidLeaveDeduction,
      'Total Deductions (BDT)': row.totalDeductions,
      'Net Salary (BDT)': row.netSalary
    }));
    exportToExcel(flatRows, `ATCL_Payroll_Summary_${processMonth}`, 'Payroll Sheet');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Tab Header */}
      <div className="tabs-header" style={{ marginBottom: 0 }}>
        <button className={`tab-btn ${activeTab === 'process' ? 'active' : ''}`} onClick={() => setActiveTab('process')}>Process Payroll</button>
        <button className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>Salary Revision Logs</button>
      </div>

      {activeTab === 'process' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Payroll Control panel */}
          <div className="card">
            <h3 style={{ color: 'var(--primary-color)', marginBottom: 16 }}>Salary Processing Dashboard</h3>
            <form onSubmit={handleProcessPayroll} style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-end' }}>
              <div className="form-group" style={{ margin: 0, minWidth: 150 }}>
                <label>Target Salary Month</label>
                <input
                  type="month"
                  value={processMonth}
                  onChange={(e) => setProcessMonth(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ margin: 0, minWidth: 180 }}>
                <label>Activate Festival Bonus</label>
                <select
                  value={bonusType}
                  onChange={(e) => setBonusType(e.target.value)}
                >
                  {BONUS_TYPES.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>

              {bonusType !== 'None' && (
                <div className="form-group" style={{ margin: 0, minWidth: 150 }}>
                  <label>Bonus (% of Basic)</label>
                  <input
                    type="number"
                    min="10"
                    max="150"
                    value={bonusPercent}
                    onChange={(e) => setBonusPercent(parseInt(e.target.value) || 0)}
                  />
                </div>
              )}

              <button type="submit" className="btn btn-primary">
                Process Salaries
              </button>

              {activeRun && (
                <div style={{ display: 'inline-flex', gap: 10 }}>
                  <button type="button" className="btn btn-secondary" onClick={handleExportBankTransfer}>
                    Export Bank Advice
                  </button>
                  <button type="button" className="btn btn-outline" onClick={handleExportPayrollSummary}>
                    Export Sheet
                  </button>
                </div>
              )}
            </form>

            {runMsg && (
              <div style={{
                padding: '12px 16px',
                background: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid var(--success)',
                borderRadius: 'var(--border-radius-sm)',
                fontSize: '0.8rem',
                color: 'var(--success)',
                fontWeight: 600,
                marginTop: 16
              }}>
                {runMsg}
              </div>
            )}
          </div>

          {/* Processed Salaries table summary */}
          {activeRun ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Runs summary cards */}
              <div className="stats-grid">
                <div className="card stat-card">
                  <div className="stat-info">
                    <span className="stat-label">Total disbursed amount</span>
                    <span className="stat-value">৳{Math.round(activeRun.totalDisbursed).toLocaleString()}</span>
                    <span style={{ fontSize: '0.725rem', color: 'var(--text-secondary)' }}>June 2026 payouts</span>
                  </div>
                  <div className="stat-icon-wrapper">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{width: 20, height: 20}}><rect x="2" y="4" width="20" height="16" rx="2" ry="2" /><line x1="12" y1="18" x2="12" y2="18.01" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                  </div>
                </div>

                <div className="card stat-card teal">
                  <div className="stat-info">
                    <span className="stat-label">TDS Tax Deducted</span>
                    <span className="stat-value">৳{Math.round(activeRun.rows.reduce((sum, r) => sum + r.taxDeduction, 0)).toLocaleString()}</span>
                    <span style={{ fontSize: '0.725rem', color: 'var(--text-secondary)' }}>To deposit to BD Treasury</span>
                  </div>
                  <div className="stat-icon-wrapper">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{width: 20, height: 20}}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>
                  </div>
                </div>

                <div className="card stat-card green">
                  <div className="stat-info">
                    <span className="stat-label">Employees paid</span>
                    <span className="stat-value">{activeRun.employeeCount}</span>
                    <span style={{ fontSize: '0.725rem', color: 'var(--success)', fontWeight: 600 }}>100% active payroll</span>
                  </div>
                  <div className="stat-icon-wrapper">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{width: 20, height: 20}}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className="card table-container" style={{ padding: 0 }}>
                <table>
                  <thead>
                    <tr>
                      <th>Employee Code</th>
                      <th>Name of The Employee</th>
                      <th>Department</th>
                      <th>Designation</th>
                      <th>Basic Salary</th>
                      <th>Gross Salary</th>
                      <th>Bonus Pay</th>
                      <th>Tax Deduction</th>
                      <th>PF (0%)</th>
                      <th>Net Salary</th>
                      <th style={{ textAlign: 'right' }}>Payslip</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeRun.rows.map(row => (
                      <tr key={row.employeeCode}>
                        <td style={{ fontWeight: 700 }}>{row.employeeCode}</td>
                        <td style={{ fontWeight: 600 }}>{row.name}</td>
                        <td>{row.department}</td>
                        <td>{row.designation}</td>
                        <td>৳{row.basicSalary.toLocaleString()}</td>
                        <td>৳{(row.basicSalary + row.houseRent + row.medicalAllowance + row.conveyanceAllowance + row.mobileAllowance).toLocaleString()}</td>
                        <td>৳{row.bonusPay.toLocaleString()}</td>
                        <td style={{ color: 'var(--danger)' }}>৳{row.taxDeduction.toLocaleString()}</td>
                        <td>৳{row.providentFund.toLocaleString()}</td>
                        <td style={{ fontWeight: 700, color: 'var(--primary-color)' }}>৳{row.netSalary.toLocaleString()}</td>
                        <td style={{ textAlign: 'right' }}>
                          <button className="btn btn-outline btn-sm" onClick={() => handleDownloadPayslip(row)}>
                            PDF Payslip
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="card" style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>
              No payroll processed yet for {processMonth}. Adjust bonus and click "Process Salaries" to calculate.
            </div>
          )}

          {/* Salary Bracket Distribution (always shown) */}
          <div className="card animate-fade-up">
            <h3 style={{ color: 'var(--primary-color)', marginBottom: 4 }}>Salary Bracket Distribution</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 16 }}>Active employee count by gross salary band</p>
            {(() => {
              const brackets = [
                { label: 'Below ৳20,000',  min: 0,      max: 20000  },
                { label: '৳20,000–40,000', min: 20000,  max: 40000  },
                { label: '৳40,000–60,000', min: 40000,  max: 60000  },
                { label: '৳60,000–80,000', min: 60000,  max: 80000  },
                { label: 'Above ৳80,000',  min: 80000,  max: Infinity }
              ];
              const total = activeEmployees.length || 1;
              return (
                <div>
                  {brackets.map(b => {
                    const count = activeEmployees.filter(e => e.grossSalary >= b.min && e.grossSalary < b.max).length;
                    const pct = Math.round((count / total) * 100);
                    return (
                      <div key={b.label} className="bracket-row">
                        <span className="bracket-label">{b.label}</span>
                        <div style={{ flex: 1, height: 8, background: 'var(--border-color)', borderRadius: '100px', overflow: 'hidden' }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg, var(--primary-color), var(--secondary-color))', borderRadius: '100px', transition: 'width 1s ease' }} />
                        </div>
                        <span className="bracket-count">{count}</span>
                        <span className="bracket-pct">{pct}%</span>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="grid-2">
          {/* Revise Form */}
          <div className="card">
            <h3 style={{ color: 'var(--primary-color)', marginBottom: 16 }}>Revise Salary (Increment/Adjustment)</h3>
            <form onSubmit={handleReviseSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="form-group">
                <label>Select Employee</label>
                <select
                  value={revEmpCode}
                  onChange={(e) => setRevEmpCode(e.target.value)}
                >
                  {activeEmployees.map(emp => (
                    <option key={emp.employeeCode} value={emp.employeeCode}>
                      {emp.employeeCode} - {emp.fullNameEnglish} (Current Gross: ৳{emp.grossSalary.toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>New Monthly Gross Salary (BDT)</label>
                <input
                  type="number"
                  required
                  min="12000"
                  value={revNewGross}
                  onChange={(e) => setRevNewGross(parseInt(e.target.value) || 0)}
                />
              </div>

              <div className="form-group">
                <label>Reason for Revision *</label>
                <textarea
                  required
                  rows="2"
                  placeholder="e.g. Annual Merit Increment / Promotion"
                  value={revReason}
                  onChange={(e) => setRevReason(e.target.value)}
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start', marginTop: 8 }}>
                Apply Revision
              </button>

              {revMsg && (
                <div style={{
                  padding: '12px 16px',
                  background: 'rgba(16, 185, 129, 0.08)',
                  border: '1px solid var(--success)',
                  borderRadius: 'var(--border-radius-sm)',
                  fontSize: '0.8rem',
                  color: 'var(--success)',
                  fontWeight: 600,
                  marginTop: 12
                }}>
                  {revMsg}
                </div>
              )}
            </form>
          </div>

          {/* Revision Logs list */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h3 style={{ color: 'var(--primary-color)' }}>Salary Revision History Audit</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Audit trails of adjustments made to employees' compensation packages.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 350, overflowY: 'auto' }}>
              {revisions.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '20px 0', fontSize: '0.8rem' }}>
                  No salary revisions processed yet.
                </div>
              ) : (
                revisions.map(rev => (
                  <div key={rev.id} style={{ padding: 12, border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-sm)', background: 'var(--bg-input)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, fontSize: '0.825rem', marginBottom: 4 }}>
                      <span>{rev.employeeCode} - {rev.name}</span>
                      <span style={{ color: 'var(--success)' }}>+{Math.round((rev.newGross - rev.previousGross) / rev.previousGross * 100)}% Adjust</span>
                    </div>
                    <div style={{ fontSize: '0.8rem' }}>
                      <strong>Gross adjusted:</strong> ৳{rev.previousGross.toLocaleString()} &rarr; ৳{rev.newGross.toLocaleString()}
                    </div>
                    <div style={{ fontSize: '0.725rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                      <strong>Reason:</strong> {rev.reason} | <strong>Approved By:</strong> {rev.approvedBy} • {rev.effectiveDate}
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
