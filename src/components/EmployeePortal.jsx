import React, { useContext, useState, useEffect } from 'react';
import { HRMSContext } from '../context/HRMSContext';
import { calculateBangladeshTax, REGIONS, TAX_YEARS, TAXPAYER_CATEGORIES } from '../utils/taxCalculator';
import { generatePayslipPDF, generateTaxCertificatePDF } from '../utils/pdfGenerator';
import {
  DIVISIONS,
  getDistrictsForDivision,
  getUpazilasForDistrict,
  getPostCodesForUpazila,
  parseAddressString
} from '../utils/bangladeshGeo';

export default function EmployeePortal({ currentPage }) {
  const { 
    employees, 
    attendanceLogs, 
    leaveRequests, 
    payrollRuns, 
    investmentDeclarations, 
    updateEmployeePersonal, 
    logAttendance, 
    addLeaveRequest, 
    updateTaxDeclaration,
    movementLogs,
    breakLogs,
    checkInEmployee,
    checkOutEmployee,
    startBreak,
    endBreak,
    logFieldMovement
  } = useContext(HRMSContext);

  const activeEmpCode = useContext(HRMSContext).activeEmployeeCode;

  // Active Employee
  const emp = employees.find(e => e.employeeCode === activeEmpCode);

  const initialPresentParsed = parseAddressString(emp?.presentAddress || '');
  const initialPermanentParsed = parseAddressString(emp?.permanentAddress || '');

  // States
  const [personalForm, setPersonalForm] = useState({
    personalMobileNumber: emp?.personalMobileNumber || '',
    personalEmailAddress: emp?.personalEmailAddress || '',
    fatherName: emp?.fatherName || '',
    motherName: emp?.motherName || '',
    nominee: emp?.nominee || '',
    presentAddress: emp?.presentAddress || '',
    presentDivision: initialPresentParsed.division,
    presentDistrict: initialPresentParsed.district,
    presentUpazila: initialPresentParsed.upazila,
    presentPostCode: initialPresentParsed.postCode,
    presentStreet: initialPresentParsed.street,
    permanentAddress: emp?.permanentAddress || '',
    permanentDivision: initialPermanentParsed.division,
    permanentDistrict: initialPermanentParsed.district,
    permanentUpazila: initialPermanentParsed.upazila,
    permanentPostCode: initialPermanentParsed.postCode,
    permanentStreet: initialPermanentParsed.street,
    photograph: emp?.photograph || '',
    signature: emp?.signature || '',
    emergencyContact: {
      name: emp?.emergencyContact?.name || '',
      relation: emp?.emergencyContact?.relation || 'Spouse',
      contact: emp?.emergencyContact?.contact || ''
    }
  });

  useEffect(() => {
    if (emp) {
      const parsedPresent = parseAddressString(emp.presentAddress || '');
      const parsedPermanent = parseAddressString(emp.permanentAddress || '');
      setPersonalForm({
        personalMobileNumber: emp.personalMobileNumber || '',
        personalEmailAddress: emp.personalEmailAddress || '',
        fatherName: emp.fatherName || '',
        motherName: emp.motherName || '',
        nominee: emp.nominee || '',
        presentAddress: emp.presentAddress || '',
        presentDivision: parsedPresent.division,
        presentDistrict: parsedPresent.district,
        presentUpazila: parsedPresent.upazila,
        presentPostCode: parsedPresent.postCode,
        presentStreet: parsedPresent.street,
        permanentAddress: emp.permanentAddress || '',
        permanentDivision: parsedPermanent.division,
        permanentDistrict: parsedPermanent.district,
        permanentUpazila: parsedPermanent.upazila,
        permanentPostCode: parsedPermanent.postCode,
        permanentStreet: parsedPermanent.street,
        photograph: emp.photograph || '',
        signature: emp.signature || '',
        emergencyContact: {
          name: emp.emergencyContact?.name || '',
          relation: emp.emergencyContact?.relation || 'Spouse',
          contact: emp.emergencyContact?.contact || ''
        }
      });
    }
  }, [activeEmpCode, emp]);

  const handlePresentDivisionChange = (div) => {
    const districts = getDistrictsForDivision(div);
    const district = districts[0];
    const upazilas = getUpazilasForDistrict(district);
    const upazila = upazilas[0];
    const postCodes = getPostCodesForUpazila(upazila);
    const postCode = postCodes[0];
    setPersonalForm(prev => ({
      ...prev,
      presentDivision: div,
      presentDistrict: district,
      presentUpazila: upazila,
      presentPostCode: postCode
    }));
  };

  const handlePresentDistrictChange = (dist) => {
    const upazilas = getUpazilasForDistrict(dist);
    const upazila = upazilas[0];
    const postCodes = getPostCodesForUpazila(upazila);
    const postCode = postCodes[0];
    setPersonalForm(prev => ({
      ...prev,
      presentDistrict: dist,
      presentUpazila: upazila,
      presentPostCode: postCode
    }));
  };

  const handlePresentUpazilaChange = (up) => {
    const postCodes = getPostCodesForUpazila(up);
    const postCode = postCodes[0];
    setPersonalForm(prev => ({
      ...prev,
      presentUpazila: up,
      presentPostCode: postCode
    }));
  };

  const handlePermanentDivisionChange = (div) => {
    const districts = getDistrictsForDivision(div);
    const district = districts[0];
    const upazilas = getUpazilasForDistrict(district);
    const upazila = upazilas[0];
    const postCodes = getPostCodesForUpazila(upazila);
    const postCode = postCodes[0];
    setPersonalForm(prev => ({
      ...prev,
      permanentDivision: div,
      permanentDistrict: district,
      permanentUpazila: upazila,
      permanentPostCode: postCode
    }));
  };

  const handlePermanentDistrictChange = (dist) => {
    const upazilas = getUpazilasForDistrict(dist);
    const upazila = upazilas[0];
    const postCodes = getPostCodesForUpazila(upazila);
    const postCode = postCodes[0];
    setPersonalForm(prev => ({
      ...prev,
      permanentDistrict: dist,
      permanentUpazila: upazila,
      permanentPostCode: postCode
    }));
  };

  const handlePermanentUpazilaChange = (up) => {
    const postCodes = getPostCodesForUpazila(up);
    const postCode = postCodes[0];
    setPersonalForm(prev => ({
      ...prev,
      permanentUpazila: up,
      permanentPostCode: postCode
    }));
  };

  const [profileMsg, setProfileMsg] = useState('');

  // Leaves Form States
  const [leaveType, setLeaveType] = useState('casual');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [leaveReason, setLeaveReason] = useState('');
  const [leaveMsg, setLeaveMsg] = useState('');

  // Attendance Simulator States
  const [simTime, setSimTime] = useState('09:00');
  const [attMsg, setAttMsg] = useState('');

  // Advanced Attendance States
  const [attCheckInType, setAttCheckInType] = useState('Office');
  const [attLat, setAttLat] = useState('23.7937');
  const [attLng, setAttLng] = useState('90.4066');
  const [attDeviceInfo, setAttDeviceInfo] = useState('Chrome Browser (Windows 11)');
  const [attAddress, setAttAddress] = useState('Banani HQ, Dhaka');
  const [showReasonForm, setShowReasonForm] = useState(false);
  const [outsideReasonType, setOutsideReasonType] = useState('Client Meeting');
  const [outsideNote, setOutsideNote] = useState('');
  const [outsideAttachment, setOutsideAttachment] = useState('');

  // Heatmap calendar month state
  const [calendarMonth, setCalendarMonth] = useState(() => new Date().toISOString().slice(0, 7));

  if (!emp) {
    return <div className="card">Employee not found. Please log in as a valid employee.</div>;
  }

  // Scoped Data
  const myLogs = attendanceLogs.filter(log => log.employeeCode === emp.employeeCode);
  const myLeaves = leaveRequests.filter(req => req.employeeCode === emp.employeeCode);
  
  // Tax calculations
  const myDecl = investmentDeclarations[emp.employeeCode] || {
    region: REGIONS.DHAKA_CHITTAGONG,
    taxYear: TAX_YEARS['2025-2026'],
    taxpayerCategory: 'auto',
    isParentOfDisabled: false,
    dpsContribution: 0,
    sanchaypatra: 0,
    providentFund: 0,
    stocks: 0,
    lifeInsurance: 0,
    otherEligible: 0
  };

  const comps = emp.salaryComponents;
  const annualBasic = comps.basicSalary * 12;
  const annualAllowances = (comps.houseRent + comps.medicalAllowance + comps.conveyanceAllowance + comps.mobileAllowance + (comps.otherAllowances || 0)) * 12;
  const annualBonuses = comps.basicSalary * 2; // assume 2 festival bonuses

  const myTotalInvestment = (myDecl.dpsContribution || 0) + 
                            (myDecl.sanchaypatra || 0) + 
                            (myDecl.providentFund || 0) + 
                            (myDecl.stocks || 0) + 
                            (myDecl.lifeInsurance || 0) +
                            (myDecl.otherEligible || 0);

  const myTax = calculateBangladeshTax({
    basicSalary: annualBasic,
    allowances: annualAllowances,
    bonuses: annualBonuses,
    gender: emp.gender,
    dob: emp.dob,
    age: 30,
    taxpayerCategory: myDecl.taxpayerCategory && myDecl.taxpayerCategory !== 'auto' ? myDecl.taxpayerCategory : undefined,
    isDisabled: !!myDecl.isDisabled,
    isFreedomFighter: !!myDecl.isFreedomFighter,
    isParentOfDisabled: !!myDecl.isParentOfDisabled,
    investment: myTotalInvestment,
    investmentDetails: myDecl,
    region: myDecl.region || REGIONS.DHAKA_CHITTAGONG,
    taxYear: myDecl.taxYear || TAX_YEARS['2025-2026']
  });

  // Photo & Signature updates in personal profile
  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPersonalForm(prev => ({ ...prev, photograph: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSignatureChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPersonalForm(prev => ({ ...prev, signature: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfileSubmit = (e) => {
    e.preventDefault();
    const finalPresentAddress = `${personalForm.presentStreet}, ${personalForm.presentUpazila}, ${personalForm.presentDistrict}, ${personalForm.presentDivision} - ${personalForm.presentPostCode}`;
    const finalPermanentAddress = `${personalForm.permanentStreet}, ${personalForm.permanentUpazila}, ${personalForm.permanentDistrict}, ${personalForm.permanentDivision} - ${personalForm.permanentPostCode}`;
    
    const updatedData = {
      ...personalForm,
      presentAddress: finalPresentAddress,
      permanentAddress: finalPermanentAddress
    };
    updateEmployeePersonal(emp.employeeCode, updatedData);
    setProfileMsg('SUCCESS: Personal profile details updated successfully.');
    setTimeout(() => setProfileMsg(''), 5000);
  };

  // Leaves Calculator Helper
  const getLeaveDays = () => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diff = Math.abs(end - start);
    return Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
  };

  const leaveDays = getLeaveDays();

  // Apply Leave
  const handleLeaveApply = (e) => {
    e.preventDefault();
    if (end < start) {
      setLeaveMsg('ERROR: End Date cannot be before Start Date.');
      return;
    }

    const balance = emp.leaveBalances[leaveType] || 0;
    if (leaveDays > balance) {
      setLeaveMsg(`ERROR: Insufficient balance! You only have ${balance} days of ${leaveType} leave left.`);
      return;
    }

    const request = {
      employeeCode: emp.employeeCode,
      name: emp.fullNameEnglish,
      department: emp.department,
      leaveType,
      startDate,
      endDate,
      days: leaveDays,
      reason: leaveReason,
      attachmentName: ''
    };

    addLeaveRequest(request);
    setLeaveMsg(`SUCCESS: Your application for ${leaveDays} Days of ${leaveType} has been submitted.`);
    setStartDate('');
    setEndDate('');
    setLeaveReason('');
    setTimeout(() => setLeaveMsg(''), 5000);
  };

  // Check Geofence inside component
  const checkGeofenceInside = (lat, lng) => {
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

    const hqDist = getDistance(lat, lng, 23.7937, 90.4066);
    if (hqDist <= 100) return { inside: true, name: 'ATCL Head Office' };

    const branches = companyInfo.branches || [];
    for (const branch of branches) {
      if (branch.latitude && branch.longitude) {
        const dist = getDistance(lat, lng, branch.latitude, branch.longitude);
        if (dist <= (branch.geofenceRadius || 100)) {
          return { inside: true, name: branch.name };
        }
      }
    }
    return { inside: false };
  };

  const handleAdvancedCheckIn = (e) => {
    if (e) e.preventDefault();
    const lat = parseFloat(attLat) || 23.7937;
    const lng = parseFloat(attLng) || 90.4066;

    const geoCheck = checkGeofenceInside(lat, lng);

    if (!geoCheck.inside && !showReasonForm) {
      setShowReasonForm(true);
      setAttMsg('WARNING: You are outside the office geofence. Please provide a reason to check in.');
      return;
    }

    const reasonData = !geoCheck.inside ? {
      reasonType: outsideReasonType,
      note: outsideNote,
      attachmentName: outsideAttachment
    } : null;

    checkInEmployee(emp.employeeCode, {
      lat,
      lng,
      time: `${simTime}:00`,
      checkInType: attCheckInType,
      deviceInfo: attDeviceInfo,
      address: attAddress,
      outsideReason: reasonData
    });

    setAttMsg(`SUCCESS: Checked in successfully at ${simTime} (${geoCheck.inside ? 'Inside: ' + geoCheck.name : 'Outside Geofence'}).`);
    setShowReasonForm(false);
    setOutsideNote('');
    setOutsideAttachment('');
    setTimeout(() => setAttMsg(''), 5000);
  };

  const handleAdvancedCheckOut = () => {
    const lat = parseFloat(attLat) || 23.7937;
    const lng = parseFloat(attLng) || 90.4066;

    checkOutEmployee(emp.employeeCode, {
      time: `${simTime}:00`,
      lat,
      lng,
      address: attAddress
    });

    setAttMsg(`SUCCESS: Checked out successfully at ${simTime}.`);
    setTimeout(() => setAttMsg(''), 5000);
  };

  const handleStartBreakClick = () => {
    const lat = parseFloat(attLat) || 23.7937;
    const lng = parseFloat(attLng) || 90.4066;
    startBreak(emp.employeeCode, `${simTime}:00`, lat, lng);
    setAttMsg(`SUCCESS: Break started at ${simTime}.`);
    setTimeout(() => setAttMsg(''), 5000);
  };

  const handleEndBreakClick = () => {
    const lat = parseFloat(attLat) || 23.7937;
    const lng = parseFloat(attLng) || 90.4066;
    endBreak(emp.employeeCode, `${simTime}:00`, lat, lng);
    setAttMsg(`SUCCESS: Break ended at ${simTime}.`);
    setTimeout(() => setAttMsg(''), 5000);
  };

  const handleDownloadPayslip = (runMonth) => {
    const run = payrollRuns.find(r => r.month === runMonth);
    if (!run) return;
    const row = run.rows.find(r => r.employeeCode === emp.employeeCode);
    if (row) {
      const [year, month] = runMonth.split('-');
      const dateObj = new Date(year, month - 1);
      const monthName = dateObj.toLocaleString('default', { month: 'long', year: 'numeric' });
      generatePayslipPDF(emp, row, monthName);
    }
  };

  const handleDownloadCertificate = () => {
    if (emp && myTax) {
      generateTaxCertificatePDF(emp, myTax, myDecl.taxYear || TAX_YEARS['2025-2026'], myDecl);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* 1. Dashboard View */}
      {currentPage === 'dashboard' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          {/* Welcome Banner */}
          <div className="card" style={{ background: 'linear-gradient(135deg, var(--primary-color) 0%, var(--primary-light) 100%)', color: '#fff', border: 'none' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 6 }}>
              Assalamu Alaikum, {emp.fullNameEnglish}!
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)' }}>
              {emp.designation} • {emp.department} • Employee Code: {emp.employeeCode}
            </p>
          </div>

          {/* Quick Metrics Grid */}
          <div className="stats-grid">
            <div className="card stat-card">
              <div className="stat-info">
                <span className="stat-label">Casual Leaves left</span>
                <span className="stat-value">{emp.leaveBalances.casual} Days</span>
                <span style={{ fontSize: '0.725rem', color: 'var(--text-secondary)' }}>Out of 10 annual quota</span>
              </div>
              <div className="stat-icon-wrapper">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{width: 20, height: 20}}><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
              </div>
            </div>

            <div className="card stat-card teal">
              <div className="stat-info">
                <span className="stat-label">Sick Leaves left</span>
                <span className="stat-value">{emp.leaveBalances.sick} Days</span>
                <span style={{ fontSize: '0.725rem', color: 'var(--text-secondary)' }}>Out of 14 annual quota</span>
              </div>
              <div className="stat-icon-wrapper">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{width: 20, height: 20}}><circle cx="12" cy="12" r="10" /><path d="m4.93 4.93 4.24 4.24M14.83 9.17l4.24-4.24M14.83 14.83l4.24 4.24M9.17 14.83l-4.24 4.24" /></svg>
              </div>
            </div>

            <div className="card stat-card green">
              <div className="stat-info">
                <span className="stat-label">Monthly Gross</span>
                <span className="stat-value">৳{emp.grossSalary.toLocaleString()}</span>
                <span style={{ fontSize: '0.725rem', color: 'var(--text-secondary)' }}>Bank Transfer Salary</span>
              </div>
              <div className="stat-icon-wrapper">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{width: 20, height: 20}}><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
              </div>
            </div>
          </div>

          {/* Logs of current week */}
          <div className="grid-2">
            <div className="card">
              <h3 style={{ color: 'var(--primary-color)', marginBottom: 16 }}>My Recent Attendance Logs</h3>
              <div className="table-container" style={{ padding: 0, border: 'none' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Clock In</th>
                      <th>Clock Out</th>
                      <th>Status</th>
                      <th>Overtime</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myLogs.slice(0, 4).map(log => (
                      <tr key={log.id}>
                        <td>{log.date}</td>
                        <td style={{ color: log.isLate ? 'var(--warning)' : 'inherit' }}>{log.checkIn}</td>
                        <td>{log.checkOut || '--:--:--'}</td>
                        <td>
                          <span className={`badge ${log.isLate ? 'badge-warning' : 'badge-success'}`}>
                            {log.isLate ? 'Late Entry' : 'On Time'}
                          </span>
                        </td>
                        <td>{log.overtimeHours > 0 ? `${log.overtimeHours} Hrs` : 'None'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <h3 style={{ color: 'var(--primary-color)' }}>My Leaves Applications</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {myLeaves.length === 0 ? (
                  <div style={{ padding: '20px 0', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    No leaves applied.
                  </div>
                ) : (
                  myLeaves.slice(0, 3).map(req => (
                    <div key={req.id} style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid var(--border-color)', fontSize: '0.8rem' }}>
                      <div>
                        <strong>{req.leaveType.toUpperCase()} Leave</strong>
                        <div style={{ fontSize: '0.725rem', color: 'var(--text-secondary)' }}>{req.startDate} to {req.endDate} ({req.days} Days)</div>
                      </div>
                      <div>
                        <span className={`badge ${req.status === 'Approved' ? 'badge-success' : (req.status === 'Pending' ? 'badge-warning' : 'badge-danger')}`}>
                          {req.status}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Profile Editor View */}
      {currentPage === 'employees' && (
        <div className="grid-2">
          {/* View profile details card */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <h3 style={{ color: 'var(--primary-color)', borderBottom: '1px solid var(--border-color)', paddingBottom: 8 }}>My Official Profile</h3>
            
            <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
              <div style={{ width: 100, height: 100, borderRadius: '50%', background: 'var(--border-color)', overflow: 'hidden' }}>
                {personalForm.photograph ? (
                  <img src={personalForm.photograph} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Photo</div>
                )}
              </div>
              <div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>{emp.fullNameEnglish}</h2>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{emp.fullNameBangla}</div>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--primary-color)' }}>{emp.designation} • {emp.department}</div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.825rem', marginTop: 12 }}>
               <div><strong>Employee Code:</strong> {emp.employeeCode}</div>
               <div><strong>Joining Date:</strong> {emp.joiningDate}</div>
               <div><strong>Intercom Extension:</strong> {emp.intercom || 'N/A'}</div>
               <div><strong>Educational Qualification:</strong> {emp.educationalQualification || 'N/A'}</div>
               <div><strong>NID Number:</strong> {emp.nid}</div>
               <div><strong>TIN Number:</strong> {emp.tin}</div>
               <div><strong>Bank Account No:</strong> {emp.bankAccountNo}</div>
               <div><strong>Salary Bank Name:</strong> {emp.bankName}</div>
               <div><strong>Marital Status:</strong> {emp.maritalStatus}</div>
               <div><strong>Blood Group:</strong> {emp.bloodGroup}</div>

               <div style={{ borderTop: '1px solid var(--border-color)', margin: '8px 0', paddingTop: 8 }}>
                 <strong style={{ color: 'var(--primary-color)' }}>Personal Particulars:</strong>
               </div>
               <div><strong>Father's Name:</strong> {emp.fatherName || 'N/A'}</div>
               <div><strong>Mother's Name:</strong> {emp.motherName || 'N/A'}</div>
               <div><strong>Nominee:</strong> {emp.nominee || 'N/A'}</div>
               <div>
                 <strong>Emergency Contact:</strong> {emp.emergencyContact?.name || 'N/A'} 
                 {emp.emergencyContact?.relation ? ` (${emp.emergencyContact.relation})` : ''} 
                 {emp.emergencyContact?.contact ? ` - ${emp.emergencyContact.contact}` : ''}
               </div>

               <div style={{ borderTop: '1px solid var(--border-color)', margin: '8px 0', paddingTop: 8 }}>
                 <strong style={{ color: 'var(--primary-color)' }}>Contact Particulars:</strong>
               </div>
               <div><strong>Official Mobile:</strong> {emp.mobileNumber || 'N/A'}</div>
               <div><strong>Personal Mobile:</strong> {emp.personalMobileNumber || 'N/A'}</div>
               <div><strong>Official E-Mail:</strong> {emp.emailAddress || 'N/A'}</div>
               <div><strong>Personal E-Mail:</strong> {emp.personalEmailAddress || 'N/A'}</div>
               <div><strong>Present Address:</strong> {emp.presentAddress || 'N/A'}</div>
               <div><strong>Permanent Address:</strong> {emp.permanentAddress || 'N/A'}</div>
            </div>
          </div>

          {/* Edit personal info card */}
          <div className="card">
            <h3 style={{ color: 'var(--primary-color)', marginBottom: 16 }}>Update Personal Details</h3>
            <form onSubmit={handleProfileSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="form-row">
                <div className="form-group">
                  <label>Official Mobile (Read-only)</label>
                  <input
                    type="tel"
                    disabled
                    value={emp.mobileNumber || ''}
                    style={{ opacity: 0.7, cursor: 'not-allowed' }}
                  />
                </div>
                <div className="form-group">
                  <label>Official E-Mail (Read-only)</label>
                  <input
                    type="email"
                    disabled
                    value={emp.emailAddress || ''}
                    style={{ opacity: 0.7, cursor: 'not-allowed' }}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Personal Mobile Number</label>
                  <input
                    type="tel"
                    placeholder="+8801xxxxxxxxx"
                    value={personalForm.personalMobileNumber}
                    onChange={(e) => setPersonalForm(prev => ({ ...prev, personalMobileNumber: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label>Personal Email Address</label>
                  <input
                    type="email"
                    value={personalForm.personalEmailAddress}
                    onChange={(e) => setPersonalForm(prev => ({ ...prev, personalEmailAddress: e.target.value }))}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Father's Name</label>
                  <input
                    type="text"
                    value={personalForm.fatherName}
                    onChange={(e) => setPersonalForm(prev => ({ ...prev, fatherName: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label>Mother's Name</label>
                  <input
                    type="text"
                    value={personalForm.motherName}
                    onChange={(e) => setPersonalForm(prev => ({ ...prev, motherName: e.target.value }))}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Nominee</label>
                  <input
                    type="text"
                    value={personalForm.nominee}
                    onChange={(e) => setPersonalForm(prev => ({ ...prev, nominee: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label>Emergency Contact Name</label>
                  <input
                    type="text"
                    value={personalForm.emergencyContact?.name || ''}
                    onChange={(e) => setPersonalForm(prev => ({
                      ...prev,
                      emergencyContact: { ...prev.emergencyContact, name: e.target.value }
                    }))}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Emergency Contact Relation</label>
                  <select
                    value={personalForm.emergencyContact?.relation || 'Spouse'}
                    onChange={(e) => setPersonalForm(prev => ({
                      ...prev,
                      emergencyContact: { ...prev.emergencyContact, relation: e.target.value }
                    }))}
                  >
                    <option value="Spouse">Spouse</option>
                    <option value="Father">Father</option>
                    <option value="Mother">Mother</option>
                    <option value="Brother">Brother</option>
                    <option value="Sister">Sister</option>
                    <option value="Child">Child</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Emergency Contact Number</label>
                  <input
                    type="tel"
                    value={personalForm.emergencyContact?.contact || ''}
                    onChange={(e) => setPersonalForm(prev => ({
                      ...prev,
                      emergencyContact: { ...prev.emergencyContact, contact: e.target.value }
                    }))}
                  />
                </div>
              </div>

              <h5 style={{ color: 'var(--primary-color)', fontSize: '0.85rem', marginBottom: 4, marginTop: 8 }}>Present Address</h5>
              <div className="form-row">
                <div className="form-group">
                  <label>Division *</label>
                  <select
                    value={personalForm.presentDivision || 'Dhaka'}
                    onChange={(e) => handlePresentDivisionChange(e.target.value)}
                  >
                    {DIVISIONS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>District *</label>
                  <select
                    value={personalForm.presentDistrict || 'Dhaka'}
                    onChange={(e) => handlePresentDistrictChange(e.target.value)}
                  >
                    {getDistrictsForDivision(personalForm.presentDivision || 'Dhaka').map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Upazila *</label>
                  <select
                    value={personalForm.presentUpazila || 'Banani'}
                    onChange={(e) => handlePresentUpazilaChange(e.target.value)}
                  >
                    {getUpazilasForDistrict(personalForm.presentDistrict || 'Dhaka').map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Postal Code *</label>
                  <select
                    value={personalForm.presentPostCode || '1213'}
                    onChange={(e) => setPersonalForm(prev => ({ ...prev, presentPostCode: e.target.value }))}
                  >
                    {getPostCodesForUpazila(personalForm.presentUpazila || 'Banani').map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Present Street / House Address *</label>
                <input
                  type="text"
                  required
                  placeholder="House No., Road No., Area Details"
                  value={personalForm.presentStreet || ''}
                  onChange={(e) => setPersonalForm(prev => ({ ...prev, presentStreet: e.target.value }))}
                />
              </div>

              <h5 style={{ color: 'var(--primary-color)', fontSize: '0.85rem', marginBottom: 4, marginTop: 12 }}>Permanent Address</h5>
              <div className="form-row">
                <div className="form-group">
                  <label>Division *</label>
                  <select
                    value={personalForm.permanentDivision || 'Dhaka'}
                    onChange={(e) => handlePermanentDivisionChange(e.target.value)}
                  >
                    {DIVISIONS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>District *</label>
                  <select
                    value={personalForm.permanentDistrict || 'Dhaka'}
                    onChange={(e) => handlePermanentDistrictChange(e.target.value)}
                  >
                    {getDistrictsForDivision(personalForm.permanentDivision || 'Dhaka').map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Upazila *</label>
                  <select
                    value={personalForm.permanentUpazila || 'Banani'}
                    onChange={(e) => handlePermanentUpazilaChange(e.target.value)}
                  >
                    {getUpazilasForDistrict(personalForm.permanentDistrict || 'Dhaka').map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Postal Code *</label>
                  <select
                    value={personalForm.permanentPostCode || '1213'}
                    onChange={(e) => setPersonalForm(prev => ({ ...prev, permanentPostCode: e.target.value }))}
                  >
                    {getPostCodesForUpazila(personalForm.permanentUpazila || 'Banani').map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Permanent Street / House Address *</label>
                <input
                  type="text"
                  required
                  placeholder="House No., Road No., Area Details"
                  value={personalForm.permanentStreet || ''}
                  onChange={(e) => setPersonalForm(prev => ({ ...prev, permanentStreet: e.target.value }))}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Update Photograph</label>
                  <input type="file" accept="image/*" onChange={handlePhotoChange} />
                </div>
                <div className="form-group">
                  <label>Update Signature</label>
                  <input type="file" accept="image/*" onChange={handleSignatureChange} />
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start', marginTop: 12 }}>
                Save Personal Changes
              </button>

              {profileMsg && (
                <div style={{
                  padding: '12px 16px',
                  background: 'rgba(16, 185, 129, 0.08)',
                  border: '1px solid var(--success)',
                  borderRadius: 'var(--border-radius-sm)',
                  fontSize: '0.8rem',
                  color: 'var(--success)',
                  fontWeight: 600
                }}>
                  {profileMsg}
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* 3. Attendance Log & Simulator */}
      {currentPage === 'attendance' && (
        <div className="grid-2">
          {/* Simulator */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h3 style={{ color: 'var(--primary-color)' }}>Mobile check-in simulator & Tracker</h3>
            
            {/* Status of check in */}
            {(() => {
              const todayStr = new Date().toISOString().split('T')[0];
              const todayLog = myLogs.find(l => l.date === todayStr);
              const activeBreak = breakLogs.find(b => b.employeeCode === emp.employeeCode && b.date === todayStr && !b.breakEndTime);

              if (todayLog) {
                // Calculate elapsed working time since check-in
                const checkInParts = todayLog.checkIn ? todayLog.checkIn.split(':').map(Number) : [0, 0];
                const checkInTotalMins = checkInParts[0] * 60 + checkInParts[1];
                const nowTotalMins = new Date().getHours() * 60 + new Date().getMinutes();
                const elapsedMins = Math.max(0, (todayLog.checkOut ? todayLog.totalWorkingMinutes : nowTotalMins - checkInTotalMins) || 0);
                const targetMins = 8 * 60; // 8-hour target
                const progressPct = Math.min(100, Math.round((elapsedMins / targetMins) * 100));
                const progressColor = progressPct >= 100 ? 'green' : (progressPct >= 60 ? 'amber' : 'red');

                return (
                  <div style={{ padding: 12, border: '1px solid var(--border-color)', borderRadius: 6, background: 'rgba(0,0,0,0.01)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Active Daily Session:</span>
                      <span className={`badge ${todayLog.checkInStatus === 'Office Attendance' ? 'badge-success' : 'badge-warning'}`}>
                        {todayLog.checkInStatus}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      <strong>Clock In:</strong> {todayLog.checkIn} | 
                      <strong> Status:</strong> <span className={`badge ${todayLog.approvalStatus === 'Approved' ? 'badge-success' : (todayLog.approvalStatus === 'Pending' ? 'badge-warning' : 'badge-danger')}`}>{todayLog.approvalStatus}</span>
                    </div>

                    {/* Working Hours Progress Bar */}
                    <div className="wh-progress-wrap">
                      <div className="wh-progress-header">
                        <span style={{ color: 'var(--text-secondary)' }}>Working Hours Progress</span>
                        <span style={{ color: progressColor === 'green' ? 'var(--success)' : (progressColor === 'amber' ? 'var(--warning)' : 'var(--danger)') }}>
                          {(elapsedMins / 60).toFixed(1)} / 8.0 hrs ({progressPct}%)
                        </span>
                      </div>
                      <div className="wh-progress-track">
                        <div className={`wh-progress-fill ${progressColor}`} style={{ width: `${progressPct}%` }} />
                      </div>
                    </div>

                    {todayLog.checkOut ? (
                      <div style={{ marginTop: 8, fontSize: '0.8rem', color: 'var(--text-secondary)', borderTop: '1px solid var(--border-color)', paddingTop: 8 }}>
                        <strong>Checked Out:</strong> {todayLog.checkOut} | 
                        <strong> Net Working Hours:</strong> {((todayLog.totalWorkingMinutes || 0) / 60).toFixed(2)} Hrs (Breaks: {todayLog.totalBreakMinutes || 0} mins)
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                        {activeBreak ? (
                          <button className="btn btn-secondary btn-sm" onClick={handleEndBreakClick} style={{ flex: 1 }}>
                            End Break
                          </button>
                        ) : (
                          <button className="btn btn-outline btn-sm" onClick={handleStartBreakClick} style={{ flex: 1 }}>
                            Start Break
                          </button>
                        )}
                        <button className="btn btn-danger btn-sm" onClick={handleAdvancedCheckOut} style={{ flex: 1 }}>
                          Clock Out
                        </button>
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <form onSubmit={handleAdvancedCheckIn} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Set Sim Check-In Time</label>
                      <input
                        type="time"
                        value={simTime}
                        onChange={(e) => setSimTime(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Attendance Type</label>
                      <select value={attCheckInType} onChange={(e) => setAttCheckInType(e.target.value)}>
                        <option value="Office">Office-based</option>
                        <option value="Branch Office">Branch Office</option>
                        <option value="Client Site">Client Site Visit</option>
                        <option value="Field Work">Field Duty</option>
                        <option value="Remote Work">Remote Work</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Latitude (Simulation)</label>
                      <input type="text" value={attLat} onChange={(e) => setAttLat(e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label>Longitude (Simulation)</label>
                      <input type="text" value={attLng} onChange={(e) => setAttLng(e.target.value)} />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Device Specs</label>
                      <input type="text" value={attDeviceInfo} onChange={(e) => setAttDeviceInfo(e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label>Detected Geocode Address</label>
                      <input type="text" value={attAddress} onChange={(e) => setAttAddress(e.target.value)} />
                    </div>
                  </div>

                  {showReasonForm && (
                    <div style={{ padding: 12, border: '1px solid var(--warning)', borderRadius: 6, background: 'rgba(245, 158, 11, 0.05)', display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <h4 style={{ color: 'var(--warning)', fontSize: '0.85rem', fontWeight: 700 }}>Mandatory Outside Office Form</h4>
                      <div className="form-group">
                        <label>Reason Type *</label>
                        <select value={outsideReasonType} onChange={(e) => setOutsideReasonType(e.target.value)}>
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
                        <textarea required rows="2" placeholder="Provide note details..." value={outsideNote} onChange={(e) => setOutsideNote(e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label>Upload Proof (optional)</label>
                        <input type="text" placeholder="e.g. ticket.pdf or client_selfie.png" value={outsideAttachment} onChange={(e) => setOutsideAttachment(e.target.value)} />
                      </div>
                    </div>
                  )}

                  <button type="submit" className="btn btn-primary" style={{ marginTop: 8 }}>
                    {showReasonForm ? 'Confirm Check-In (Outside Geofence)' : 'Check In'}
                  </button>
                </form>
              );
            })()}

            {attMsg && (
              <div style={{
                padding: '12px 16px',
                background: attMsg.startsWith('ERROR') ? 'rgba(239, 68, 68, 0.08)' : (attMsg.startsWith('WARNING') ? 'rgba(245, 158, 11, 0.08)' : 'rgba(16, 185, 129, 0.08)'),
                border: attMsg.startsWith('ERROR') ? '1px solid var(--danger)' : (attMsg.startsWith('WARNING') ? '1px solid var(--warning)' : '1px solid var(--success)'),
                borderRadius: 'var(--border-radius-sm)',
                fontSize: '0.8rem',
                color: attMsg.startsWith('ERROR') ? 'var(--danger)' : (attMsg.startsWith('WARNING') ? 'var(--warning)' : 'var(--success)'),
                fontWeight: 600
              }}>
                {attMsg}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Attendance Heatmap Calendar + Summary Stats — shown on attendance page */}
      {currentPage === 'attendance' && (() => {
        // --- Heatmap Calendar Logic ---
        const HOLIDAYS_LIST = [
          '2026-02-21','2026-03-17','2026-03-26','2026-05-01',
          '2026-06-16','2026-06-17','2026-12-16','2026-12-25'
        ];
        const [calYear, calMonNum] = calendarMonth.split('-').map(Number);
        const daysInCal = new Date(calYear, calMonNum, 0).getDate();
        const firstDayOfWeek = new Date(calYear, calMonNum - 1, 1).getDay(); // 0=Sun
        const todayStr = new Date().toISOString().split('T')[0];
        const logsInMonth = myLogs.filter(l => l.date.startsWith(calendarMonth));
        const myLeaveInMonth = (leaveRequests || []).filter(r => r.employeeCode === emp.employeeCode && r.status === 'Approved' && r.startDate && r.startDate.startsWith(calendarMonth));

        // Per-day status
        const getDayClass = (dayNum) => {
          const dateStr = `${calendarMonth}-${String(dayNum).padStart(2,'0')}`;
          const jsDate = new Date(calYear, calMonNum - 1, dayNum);
          const dayOfWeek = jsDate.getDay(); // 0=Sun,5=Fri
          const isFuture = dateStr > todayStr;
          const isToday = dateStr === todayStr;
          if (dayOfWeek === 5) return 'att-hm-weekend'; // Friday = weekend BD
          if (HOLIDAYS_LIST.includes(dateStr)) return 'att-hm-holiday';
          if (isFuture) return 'att-hm-future';
          const log = logsInMonth.find(l => l.date === dateStr);
          if (log) return log.isLate ? 'att-hm-late' : 'att-hm-present';
          const onLeave = myLeaveInMonth.some(r => dateStr >= r.startDate && dateStr <= r.endDate);
          if (onLeave) return 'att-hm-leave';
          return 'att-hm-absent';
        };

        // Summary stats for the selected month
        const presentDays = logsInMonth.filter(l => !l.isLate).length;
        const lateDays = logsInMonth.filter(l => l.isLate).length;
        const totalPresent = presentDays + lateDays;
        let workingDaysInMonth = 0;
        for (let d = 1; d <= daysInCal; d++) {
          const day = new Date(calYear, calMonNum - 1, d).getDay();
          const dateStr2 = `${calendarMonth}-${String(d).padStart(2,'0')}`;
          if (day !== 5 && dateStr2 <= todayStr && !HOLIDAYS_LIST.includes(dateStr2)) workingDaysInMonth++;
        }
        const absentDaysInMonth = Math.max(0, workingDaysInMonth - totalPresent);
        const totalWorkMins = logsInMonth.reduce((s, l) => s + (l.totalWorkingMinutes || 0), 0);
        const avgHours = totalPresent > 0 ? (totalWorkMins / totalPresent / 60).toFixed(1) : '0.0';
        const attPct = workingDaysInMonth > 0 ? Math.round((totalPresent / workingDaysInMonth) * 100) : 0;

        const DAY_LABELS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

        return (
          <>
            {/* Summary Stats Strip */}
            <div className="card animate-fade-up">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <h3 style={{ color: 'var(--primary-color)', fontSize: '0.95rem' }}>Monthly Attendance Summary</h3>
                <input
                  type="month"
                  value={calendarMonth}
                  onChange={(e) => setCalendarMonth(e.target.value)}
                  style={{ fontSize: '0.8rem', padding: '5px 10px' }}
                />
              </div>
              <div className="att-summary-grid">
                <div className="att-summary-item">
                  <span className="att-summary-value" style={{ color: 'var(--success)' }}>{presentDays}</span>
                  <span className="att-summary-label">On Time</span>
                </div>
                <div className="att-summary-item">
                  <span className="att-summary-value" style={{ color: 'var(--warning)' }}>{lateDays}</span>
                  <span className="att-summary-label">Late Days</span>
                </div>
                <div className="att-summary-item">
                  <span className="att-summary-value" style={{ color: 'var(--danger)' }}>{absentDaysInMonth}</span>
                  <span className="att-summary-label">Absent</span>
                </div>
                <div className="att-summary-item">
                  <span className="att-summary-value" style={{ color: 'var(--primary-color)' }}>{avgHours}</span>
                  <span className="att-summary-label">Avg Hrs/Day</span>
                </div>
                <div className="att-summary-item">
                  <span className="att-summary-value" style={{ color: attPct >= 90 ? 'var(--success)' : (attPct >= 75 ? 'var(--warning)' : 'var(--danger)') }}>{attPct}%</span>
                  <span className="att-summary-label">Attendance</span>
                </div>
              </div>
            </div>

            {/* Heatmap Calendar */}
            <div className="card animate-fade-up animate-fade-up-d1">
              <h3 style={{ color: 'var(--primary-color)', fontSize: '0.95rem', marginBottom: 14 }}>
                Attendance Heatmap —&nbsp;
                {new Date(calYear, calMonNum - 1).toLocaleString('en-BD', { month: 'long', year: 'numeric' })}
              </h3>
              <div className="att-heatmap-wrap">
                <div className="att-heatmap-grid">
                  {DAY_LABELS.map(d => (
                    <div key={d} className="att-hm-day-header">{d}</div>
                  ))}
                  {/* Empty cells before month start */}
                  {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                    <div key={`e-${i}`} className="att-hm-day att-hm-empty" />
                  ))}
                  {/* Day cells */}
                  {Array.from({ length: daysInCal }).map((_, i) => {
                    const dayNum = i + 1;
                    const cls = getDayClass(dayNum);
                    const dateStr3 = `${calendarMonth}-${String(dayNum).padStart(2,'0')}`;
                    const isToday3 = dateStr3 === todayStr;
                    return (
                      <div
                        key={dayNum}
                        className={`att-hm-day ${cls}${isToday3 ? ' att-hm-today' : ''}`}
                        title={`${dateStr3}: ${cls.replace('att-hm-','').replace('-',' ')}`}
                      >
                        {dayNum}
                      </div>
                    );
                  })}
                </div>

                {/* Legend */}
                <div className="att-hm-legend">
                  {[
                    { cls: 'att-hm-present', label: 'On Time' },
                    { cls: 'att-hm-late', label: 'Late Entry' },
                    { cls: 'att-hm-absent', label: 'Absent' },
                    { cls: 'att-hm-leave', label: 'Approved Leave' },
                    { cls: 'att-hm-holiday', label: 'Holiday' },
                    { cls: 'att-hm-weekend', label: 'Weekend (Fri)' },
                  ].map(({ cls, label }) => (
                    <div key={cls} className="att-hm-legend-item">
                      <div className={`att-hm-legend-dot ${cls}`} style={{ width: 12, height: 12, borderRadius: 3 }} />
                      <span>{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        );
      })()}

      {/* 4. Leave Applications */}
      {currentPage === 'leave' && (
        <div className="grid-2">
          {/* Quotas & Application Form */}
          <div className="card">
            <h3 style={{ color: 'var(--primary-color)', marginBottom: 16 }}>Apply for Leave</h3>
            
            <form onSubmit={handleLeaveApply} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="form-group">
                <label>Leave Category</label>
                <select
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value)}
                >
                  <option value="casual">Casual Leave (Remaining: {emp.leaveBalances.casual} Days)</option>
                  <option value="sick">Sick Leave (Remaining: {emp.leaveBalances.sick} Days)</option>
                  <option value="annual">Annual Leave (Remaining: {emp.leaveBalances.annual} Days)</option>
                  <option value="special">Special Leave (Unpaid / LWP)</option>
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

              {leaveDays > 0 && (
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary-color)' }}>
                  Selected Duration: {leaveDays} Days
                </div>
              )}

              <div className="form-group">
                <label>Reason for Leave *</label>
                <textarea
                  required
                  rows="2"
                  placeholder="Provide details for leave verification"
                  value={leaveReason}
                  onChange={(e) => setLeaveReason(e.target.value)}
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start', marginTop: 8 }}>
                Submit Application
              </button>

              {leaveMsg && (
                <div style={{
                  padding: '12px 16px',
                  background: leaveMsg.startsWith('ERROR') ? 'rgba(239, 68, 68, 0.08)' : 'rgba(16, 185, 129, 0.08)',
                  border: leaveMsg.startsWith('ERROR') ? '1px solid var(--danger)' : '1px solid var(--success)',
                  borderRadius: 'var(--border-radius-sm)',
                  fontSize: '0.8rem',
                  color: leaveMsg.startsWith('ERROR') ? 'var(--danger)' : 'var(--success)',
                  fontWeight: 600
                }}>
                  {leaveMsg}
                </div>
              )}
            </form>
          </div>

          {/* Leaves History */}
          <div className="card">
            <h3 style={{ color: 'var(--primary-color)', marginBottom: 16 }}>My Leave History</h3>
            <div className="table-container" style={{ padding: 0, border: 'none' }}>
              <table>
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Dates</th>
                    <th>Days</th>
                    <th>Reason</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {myLeaves.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-secondary)' }}>
                        No leave history found.
                      </td>
                    </tr>
                  ) : (
                    myLeaves.map(req => (
                      <tr key={req.id}>
                        <td><span className="badge badge-info">{req.leaveType.toUpperCase()}</span></td>
                        <td style={{ fontSize: '0.8rem' }}>{req.startDate} to {req.endDate}</td>
                        <td style={{ fontWeight: 700 }}>{req.days} Days</td>
                        <td style={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={req.reason}>{req.reason}</td>
                        <td>
                          <span className={`badge ${req.status === 'Approved' ? 'badge-success' : (req.status === 'Pending' ? 'badge-warning' : 'badge-danger')}`}>
                            {req.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 5. Payroll & Payslips */}
      {currentPage === 'payroll' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Salary Breakdown card */}
          <div className="card">
            <h3 style={{ color: 'var(--primary-color)', marginBottom: 16 }}>My Salary Components</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
              <div style={{ padding: 12, border: '1px solid var(--border-color)', borderRadius: 6 }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Basic Salary</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>৳{comps.basicSalary.toLocaleString()}</div>
              </div>
              <div style={{ padding: 12, border: '1px solid var(--border-color)', borderRadius: 6 }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>House Rent (25%)</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>৳{comps.houseRent.toLocaleString()}</div>
              </div>
              <div style={{ padding: 12, border: '1px solid var(--border-color)', borderRadius: 6 }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Medical & Conveyance</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>৳{(comps.medicalAllowance + comps.conveyanceAllowance).toLocaleString()}</div>
              </div>
              <div style={{ padding: 12, border: '1px solid var(--border-color)', borderRadius: 6, backgroundColor: 'rgba(0,180,216,0.05)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--primary-color)', fontWeight: 700 }}>Gross Salary</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary-color)' }}>৳{emp.grossSalary.toLocaleString()}</div>
              </div>
            </div>
          </div>

          {/* Monthly Payslips download list */}
          <div className="card">
            <h3 style={{ color: 'var(--primary-color)', marginBottom: 16 }}>My Processed Payslips</h3>
            <div className="table-container" style={{ padding: 0, border: 'none' }}>
              <table>
                <thead>
                  <tr>
                    <th>Month</th>
                    <th>OT Pay</th>
                    <th>Bonus Pay</th>
                    <th>Tax Deduction</th>
                    <th>PF Contribution</th>
                    <th>Net Disbursed</th>
                    <th style={{ textAlign: 'right' }}>Download</th>
                  </tr>
                </thead>
                <tbody>
                  {payrollRuns.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-secondary)' }}>
                        No processed payslips available yet.
                      </td>
                    </tr>
                  ) : (
                    payrollRuns.map(run => {
                      const row = run.rows.find(r => r.employeeCode === emp.employeeCode);
                      if (!row) return null;
                      return (
                        <tr key={run.id}>
                          <td style={{ fontWeight: 700 }}>{run.month}</td>
                          <td>৳{row.overtimePay}</td>
                          <td>৳{row.bonusPay}</td>
                          <td style={{ color: 'var(--danger)' }}>৳{row.taxDeduction}</td>
                          <td>৳{row.providentFund}</td>
                          <td style={{ fontWeight: 700, color: 'var(--primary-color)' }}>৳{row.netSalary}</td>
                          <td style={{ textAlign: 'right' }}>
                            <button className="btn btn-outline btn-sm" onClick={() => handleDownloadPayslip(run.month)}>
                              Download PDF
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 6. Tax Profiles & Declarations */}
      {currentPage === 'tax' && myTax && (
        <div className="grid-2">
          {/* Declaration editor */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h3 style={{ color: 'var(--primary-color)' }}>My Tax Profile & Sector-Specific Investments</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Computed under the <strong>Bangladesh Income Tax Act, 2023 & Finance Act 2026</strong>. Your allowable rebate is the <strong>LOWER</strong> of Limit A (10% of allowable investment), Limit B (3% of taxable income), or Limit C (Tk. 7,50,000).
            </p>

            {/* Assessment Year & Taxpayer Category */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Assessment Period / Income Year</label>
                <select
                  value={myDecl.taxYear || TAX_YEARS['2025-2026']}
                  onChange={(e) => updateTaxDeclaration(emp.employeeCode, { taxYear: e.target.value })}
                >
                  <option value={TAX_YEARS['2025-2026']}>AY 2026-2027, 2027-2028 (Base ৳4.00L)</option>
                  <option value={TAX_YEARS['2028-2029']}>AY 2028-2029 & 2029-2030 (Base ৳4.25L)</option>
                  <option value={TAX_YEARS['2030-2031']}>AY 2030-2031 (Base ৳4.50L)</option>
                  <option value={TAX_YEARS['2024-2025']}>AY 2025-2026 (Base ৳3.50L)</option>
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Taxpayer Category</label>
                <select
                  value={myDecl.taxpayerCategory || 'auto'}
                  onChange={(e) => updateTaxDeclaration(emp.employeeCode, { taxpayerCategory: e.target.value })}
                >
                  <option value="auto">Auto-Detect ({myTax.categoryLabel})</option>
                  {TAXPAYER_CATEGORIES.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 12px',
              borderRadius: 8,
              border: '1px solid var(--border-color)',
              background: myDecl.isParentOfDisabled ? 'rgba(16, 185, 129, 0.08)' : 'var(--bg-input)',
              cursor: 'pointer',
              fontSize: '0.8rem'
            }}>
              <input
                type="checkbox"
                checked={!!myDecl.isParentOfDisabled}
                onChange={(e) => updateTaxDeclaration(emp.employeeCode, { isParentOfDisabled: e.target.checked })}
                style={{ width: 16, height: 16, accentColor: 'var(--primary-color)' }}
              />
              <div>
                <div style={{ fontWeight: 700 }}>Parent / Guardian of Person with Disability?</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                  Adds + BDT 50,000 to base tax-free threshold (Section 5 adjustment)
                </div>
              </div>
            </label>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Deposit Pension Scheme (DPS) — Statutory Cap: Tk. 1,20,000/yr</label>
                <input
                  type="number"
                  min="0"
                  value={myDecl.dpsContribution || 0}
                  onChange={(e) => updateTaxDeclaration(emp.employeeCode, { dpsContribution: Math.max(0, parseInt(e.target.value) || 0) })}
                />
                <div style={{ fontSize: '0.72rem', color: 'var(--success)', marginTop: 4 }}>
                  Allowable: ৳{myTax.sectorBreakdown.dps.allowable.toLocaleString('en-BD')}
                  {myTax.sectorBreakdown.dps.ignored > 0 && (
                    <span style={{ color: '#ef4444', marginLeft: 8 }}>
                      (Ignored above cap: ৳{myTax.sectorBreakdown.dps.ignored.toLocaleString('en-BD')})
                    </span>
                  )}
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Savings Certificates (Sanchayapatra) / Govt. Securities — Statutory Cap: Tk. 5,00,000</label>
                <input
                  type="number"
                  min="0"
                  value={myDecl.sanchaypatra || 0}
                  onChange={(e) => updateTaxDeclaration(emp.employeeCode, { sanchaypatra: Math.max(0, parseInt(e.target.value) || 0) })}
                />
                <div style={{ fontSize: '0.72rem', color: 'var(--success)', marginTop: 4 }}>
                  Allowable: ৳{myTax.sectorBreakdown.sanchayapatra.allowable.toLocaleString('en-BD')}
                  {myTax.sectorBreakdown.sanchayapatra.ignored > 0 && (
                    <span style={{ color: '#ef4444', marginLeft: 8 }}>
                      (Ignored above cap: ৳{myTax.sectorBreakdown.sanchayapatra.ignored.toLocaleString('en-BD')})
                    </span>
                  )}
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Recognized Provident Fund (RPF — Employee + Employer) (100% Allowable)</label>
                <input
                  type="number"
                  min="0"
                  value={myDecl.providentFund || 0}
                  onChange={(e) => updateTaxDeclaration(emp.employeeCode, { providentFund: Math.max(0, parseInt(e.target.value) || 0) })}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Mutual Funds, Unit Certificates, ETFs & Listed Stocks (100% Allowable)</label>
                <input
                  type="number"
                  min="0"
                  value={myDecl.stocks || 0}
                  onChange={(e) => updateTaxDeclaration(emp.employeeCode, { stocks: Math.max(0, parseInt(e.target.value) || 0) })}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Life Insurance Premium & Deferred Annuities (Actual Premium Allowable)</label>
                <input
                  type="number"
                  min="0"
                  value={myDecl.lifeInsurance || 0}
                  onChange={(e) => updateTaxDeclaration(emp.employeeCode, { lifeInsurance: Math.max(0, parseInt(e.target.value) || 0) })}
                />
              </div>
            </div>
          </div>

          {/* Calculation projection & TDS cert */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <h3 style={{ color: 'var(--primary-color)' }}>My Annual Tax & TDS Assessment</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.825rem', padding: 14, border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-sm)', background: 'rgba(0,0,0,0.01)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Taxpayer Category:</span>
                <strong style={{ color: 'var(--primary-color)' }}>{myTax.categoryLabel}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Active Tax-Free Threshold:</span>
                <strong>৳{myTax.taxFreeThreshold.toLocaleString('en-BD')} {myTax.parentAddition > 0 ? '(incl. +৳50K Sec. 5)' : ''}</strong>
              </div>
              <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Annual Gross Projected:</span>
                <strong>৳{Math.round(myTax.annualGross).toLocaleString('en-BD')}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                <span>(−) Consolidated Exemption (Lower of 1/3rd or ৳{((myTax.salaryExemptionCap || 500000) / 100000).toFixed(2)}L):</span>
                <strong>(৳{Math.round(myTax.allowanceExemption).toLocaleString('en-BD')})</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Total Taxable Income:</span>
                <strong>৳{Math.round(myTax.taxableIncome).toLocaleString('en-BD')}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Gross Slab Tax (Before Rebate):</span>
                <strong>৳{Math.round(myTax.grossTax).toLocaleString('en-BD')}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                <span>Allowable Investment (Declared: ৳{Math.round(myTax.actualTotalInvestment).toLocaleString('en-BD')}):</span>
                <strong>৳{Math.round(myTax.allowableTotalInvestment).toLocaleString('en-BD')}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>(−) 3-Limit Investment Rebate:</span>
                <strong style={{ color: 'var(--success)' }}>(৳{Math.round(myTax.rebate).toLocaleString('en-BD')})</strong>
              </div>
              <div style={{ fontSize: '0.73rem', color: 'var(--text-secondary)', padding: '6px 10px', background: 'rgba(16, 185, 129, 0.06)', borderRadius: 6 }}>
                Rebate is LOWER of: Limit A (10% Inv: ৳{Math.round(myTax.rebateBreakdown.limitA_tenPercentOfAllowableInvestment).toLocaleString('en-BD')}) · Limit B (3% Taxable: ৳{Math.round(myTax.rebateBreakdown.limitB_threePercentOfTaxableIncome).toLocaleString('en-BD')}) · Limit C (৳7,50,000)
              </div>
              <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--primary-color)', fontSize: '0.95rem', fontWeight: 800 }}>
                <span>Net Annual Tax Due (TDS):</span>
                <span>৳{Math.round(myTax.netTax).toLocaleString('en-BD')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--success)', fontWeight: 700 }}>
                <span>Monthly Payroll TDS Deduction:</span>
                <span>৳{Math.round(myTax.monthlyTaxDeduction).toLocaleString('en-BD')} / month</span>
              </div>
            </div>

            {/* Progressive Slab Breakdown */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                Progressive Slab Breakdown
              </div>
              {myTax.slabsApplied.map((s, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', padding: '5px 8px', background: s.tax > 0 ? 'rgba(0, 180, 216, 0.06)' : 'transparent', borderRadius: 6 }}>
                  <span>{s.slabName} ({s.rate}%)</span>
                  <strong>৳{Math.round(s.tax).toLocaleString('en-BD')}</strong>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, border: '1px dashed var(--border-color)', padding: 16, borderRadius: 8, textAlign: 'center', marginTop: 'auto' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                Official NBR Section 139 TDS Clearance Certificate (Income Tax Act, 2023 & Finance Act 2026)
              </span>
              <button type="button" className="btn btn-primary" onClick={handleDownloadCertificate} style={{ width: '100%' }}>
                ⬇ Download Section 139 TDS Certificate (PDF)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
