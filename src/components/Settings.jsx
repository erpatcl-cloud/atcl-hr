import React, { useContext, useState, useMemo, useRef, useEffect } from 'react';
import { HRMSContext, DEFAULT_HR_SETTINGS } from '../context/HRMSContext';
import {
  exportToExcel,
  parseUploadedSpreadsheet,
  downloadTemplateExcel
} from '../utils/excelExporter';
import {
  getWorkspaceConfig,
  saveWorkspaceConfig,
  getWorkspaceSession,
  getWorkspaceSyncLogs,
  addWorkspaceSyncLog,
  clearWorkspaceSyncLogs,
  getEmployeeDriveFolders,
  getCloudBackupsList,
  initGoogleWorkspaceOAuth,
  triggerGoogleWorkspaceOAuth,
  connectSimulatedWorkspace,
  disconnectGoogleWorkspace,
  uploadBackupToGoogleDrive,
  createEmployeeDriveFolder,
  extractGoogleDriveFolderId,
  fetchRowsFromGoogleSheet
} from '../utils/googleWorkspaceService';
import DocumentTemplatesHub from './DocumentTemplatesHub';

export default function Settings() {
  const {
    employees,
    attendanceLogs,
    leaveRequests,
    payrollRuns,
    investmentDeclarations,
    currentUser,
    isAdminUser,
    loginMode,
    hrSettings,
    updateHrSettings,
    bulkUpsertEmployees,
    bulkImportAttendance,
    bulkImportSalaryAndTax,
    userCredentials,
    syncMissingUserCredentials,
    adminUpdateUserCredential,
    getSystemBackupPayload,
    exportFullSystemBackup,
    restoreSystemBackup,
    resetToFactorySeeds,
    workspaceSession,
    setWorkspaceSession,
    documentTemplates
  } = useContext(HRMSContext);

  const [activeTab, setActiveTab] = useState('templates');
  const [banner, setBanner] = useState({ type: '', message: '' });

  // --- Google Workspace Cloud Integration State ---
  const [gwsConfig, setGwsConfig] = useState(() => getWorkspaceConfig());
  const [gwsSession, setGwsSessionState] = useState(() => workspaceSession || getWorkspaceSession());
  const setGwsSession = (sessionVal) => {
    setGwsSessionState(sessionVal);
    if (setWorkspaceSession) setWorkspaceSession(sessionVal);
  };
  const [gwsLogs, setGwsLogs] = useState(() => getWorkspaceSyncLogs());
  const [gwsBackups, setGwsBackups] = useState(() => getCloudBackupsList());
  const [empDriveFolders, setEmpDriveFolders] = useState(() => getEmployeeDriveFolders());
  const [gwsConnecting, setGwsConnecting] = useState(false);
  const [gwsSyncingBackup, setGwsSyncingBackup] = useState(false);
  const [gwsDriveSubTab, setGwsDriveSubTab] = useState('overview'); // 'overview' | 'drive_embed' | 'emp_folders'
  const [driveViewMode, setDriveViewMode] = useState('list');
  const [driveIframeKey, setDriveIframeKey] = useState(0);
  const [empFolderSearch, setEmpFolderSearch] = useState('');
  const [creatingEmpFolderCode, setCreatingEmpFolderCode] = useState('');
  const [bulkCreatingFolders, setBulkCreatingFolders] = useState(false);
  const [sheetSyncUrl, setSheetSyncUrl] = useState(() => getWorkspaceConfig().sheetId || '');
  const [sheetSyncTarget, setSheetSyncTarget] = useState('employees'); // 'employees' | 'attendance' | 'salary_tax'
  const [sheetPulling, setSheetPulling] = useState(false);

  useEffect(() => {
    initGoogleWorkspaceOAuth({
      clientId: gwsConfig.clientId,
      onConnected: (session) => {
        setGwsSession(session);
        setGwsLogs(getWorkspaceSyncLogs());
        setGwsConnecting(false);
        showNotice('success', `Connected to Google Workspace as ${session.email}.`);
      },
      onError: (err) => {
        setGwsConnecting(false);
        showNotice('error', `Google OAuth notice: ${err}. You can also use 1-Click Corporate Workspace Connect.`);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gwsConfig.clientId]);

  // --- Tab 1: Bulk Employee Upload & Quick Add State ---
  const [empUploadMode, setEmpUploadMode] = useState('upsert'); // 'upsert' | 'add_only'
  const [empFileName, setEmpFileName] = useState('');
  const [parsedEmpRows, setParsedEmpRows] = useState([]);
  const [empUploading, setEmpUploading] = useState(false);
  const empFileInputRef = useRef(null);

  const createEmptyQuickRow = () => ({
    employeeCode: '',
    fullNameEnglish: '',
    fullNameBangla: '',
    designation: hrSettings?.designations?.[0] || 'Service Engineer',
    department: hrSettings?.departments?.[0] || 'Engineering Education Equipment',
    grossSalary: 35000,
    joiningDate: new Date().toISOString().split('T')[0],
    gender: 'male',
    bloodGroup: 'O+',
    mobileNumber: '',
    emailAddress: '',
    nid: '',
    tin: '',
    bankName: 'Al-Arafah Islami Bank Ltd.',
    bankAccountNo: ''
  });

  const [quickRows, setQuickRows] = useState([createEmptyQuickRow(), createEmptyQuickRow()]);

  // --- Tab 2: Operational Data Bulk Import State (Attendance & Salary/Tax) ---
  const [opsImportType, setOpsImportType] = useState('attendance'); // 'attendance' | 'salary_tax'
  const [opsFileName, setOpsFileName] = useState('');
  const [parsedOpsRows, setParsedOpsRows] = useState([]);
  const opsFileInputRef = useRef(null);

  // --- Tab 3: Master Configuration State ---
  const [newDepartment, setNewDepartment] = useState('');
  const [newDesignation, setNewDesignation] = useState('');
  const [quotasForm, setQuotasForm] = useState(hrSettings?.defaultLeaveQuotas || DEFAULT_HR_SETTINGS.defaultLeaveQuotas);
  const [ratiosForm, setRatiosForm] = useState(hrSettings?.salaryRatios || DEFAULT_HR_SETTINGS.salaryRatios);
  const [shiftsForm, setShiftsForm] = useState(hrSettings?.shifts || DEFAULT_HR_SETTINGS.shifts);
  const [newHoliday, setNewHoliday] = useState({ date: '', name: '', type: 'National Holiday', days: 1 });

  // --- Tab 4: User Credentials State ---
  const [credSearch, setCredSearch] = useState('');
  const [editingCredCode, setEditingCredCode] = useState(null);
  const [credEditForm, setCredEditForm] = useState({ username: '', email: '', password: '', mustChangePassword: true });

  // --- Tab 5: Backup & Restore State ---
  const restoreFileInputRef = useRef(null);

  const showNotice = (type, message) => {
    setBanner({ type, message });
    setTimeout(() => {
      setBanner(prev => (prev.message === message ? { type: '', message: '' } : prev));
    }, 6000);
  };

  // Security Guard: Admin Only
  if (loginMode === 'employee' && !isAdminUser) {
    return (
      <div className="card" style={{ padding: 40, textAlign: 'center' }}>
        <h3 style={{ color: '#ef4444', marginBottom: 8 }}>Access Restricted</h3>
        <p style={{ color: 'var(--text-secondary)' }}>
          This Settings & Bulk Data Console is restricted to HR Administrators only.
        </p>
      </div>
    );
  }

  // --- Handlers for Tab 1: Employee Bulk Upload ---
  const normalizeEmpRow = (raw, index) => {
    const code = String(raw['Employee Code'] || raw['Employee ID'] || raw.employeeCode || '').trim().toUpperCase();
    const existing = code ? employees.find(e => String(e.employeeCode).toUpperCase() === code) : null;
    return {
      _rowId: `row-${index}-${Date.now()}`,
      employeeCode: code,
      fullNameEnglish: String(raw['Full Name (English)'] || raw['Full Name'] || raw.fullNameEnglish || raw.name || '').trim(),
      fullNameBangla: String(raw['Full Name (Bangla)'] || raw.fullNameBangla || '').trim(),
      designation: String(raw['Designation'] || raw.designation || '').trim(),
      department: String(raw['Department'] || raw.department || '').trim(),
      grossSalary: Number(String(raw['Gross Salary'] || raw.grossSalary || raw.salary || 30000).replace(/[^0-9.]/g, '')) || 30000,
      joiningDate: String(raw['Joining Date'] || raw.joiningDate || new Date().toISOString().split('T')[0]).trim(),
      dob: String(raw['Date of Birth'] || raw.dob || '1990-01-01').trim(),
      gender: String(raw['Gender'] || raw.gender || 'male').trim().toLowerCase() === 'female' ? 'female' : 'male',
      bloodGroup: String(raw['Blood Group'] || raw.bloodGroup || 'O+').trim(),
      maritalStatus: String(raw['Marital Status'] || raw.maritalStatus || 'Single').trim(),
      mobileNumber: String(raw['Mobile Number'] || raw.mobileNumber || '').trim(),
      emailAddress: String(raw['Official Email'] || raw.emailAddress || raw.email || '').trim(),
      personalMobileNumber: String(raw['Personal Mobile'] || raw.personalMobileNumber || '').trim(),
      personalEmailAddress: String(raw['Personal Email'] || raw.personalEmailAddress || '').trim(),
      nid: String(raw['NID'] || raw.nid || '').trim(),
      passportNumber: String(raw['Passport Number'] || raw.passportNumber || '').trim(),
      tin: String(raw['TIN'] || raw.tin || '').trim(),
      taxZone: String(raw['Tax Zone'] || raw.taxZone || 'Zone 15').trim(),
      taxCircle: String(raw['Tax Circle'] || raw.taxCircle || 'Circle 1').trim(),
      bankName: String(raw['Bank Name'] || raw.bankName || 'Al-Arafah Islami Bank Ltd.').trim(),
      bankAccountNo: String(raw['Bank Account No'] || raw.bankAccountNo || '').trim(),
      intercom: String(raw['Intercom'] || raw.intercom || '').trim(),
      educationalQualification: String(raw['Educational Qualification'] || raw.educationalQualification || '').trim(),
      fatherName: String(raw['Father Name'] || raw.fatherName || '').trim(),
      motherName: String(raw['Mother Name'] || raw.motherName || '').trim(),
      nominee: String(raw['Nominee'] || raw.nominee || '').trim(),
      presentAddress: String(raw['Present Address'] || raw.presentAddress || 'Dhaka, Bangladesh').trim(),
      permanentAddress: String(raw['Permanent Address'] || raw.permanentAddress || 'Dhaka, Bangladesh').trim(),
      status: String(raw['Status'] || raw.status || 'Active').trim(),
      _isExisting: !!existing
    };
  };

  const handleEmpFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setEmpUploading(true);
    setEmpFileName(file.name);
    try {
      const { rows } = await parseUploadedSpreadsheet(file);
      if (!rows || rows.length === 0) {
        showNotice('error', 'The uploaded file appears to be empty.');
        setParsedEmpRows([]);
      } else {
        const normalized = rows.map((r, i) => normalizeEmpRow(r, i));
        setParsedEmpRows(normalized);
        showNotice('success', `Parsed ${normalized.length} employee row(s) from "${file.name}". Review the preview table below and click Commit Import.`);
      }
    } catch (err) {
      showNotice('error', `Failed to parse spreadsheet: ${err.message}`);
    } finally {
      setEmpUploading(false);
      if (empFileInputRef.current) empFileInputRef.current.value = '';
    }
  };

  const handlePreviewRowChange = (idx, field, val) => {
    setParsedEmpRows(prev => prev.map((r, i) => {
      if (i !== idx) return r;
      const updated = { ...r, [field]: val };
      if (field === 'employeeCode') {
        const cleanCode = String(val).trim().toUpperCase();
        updated._isExisting = !!employees.find(e => String(e.employeeCode).toUpperCase() === cleanCode);
      }
      return updated;
    }));
  };

  const handleCommitEmpUpload = () => {
    const validRows = parsedEmpRows.filter(r => r.fullNameEnglish.trim() !== '');
    if (validRows.length === 0) {
      showNotice('error', 'No valid employee rows with Full Name found to import.');
      return;
    }
    const result = bulkUpsertEmployees(validRows, empUploadMode);
    setParsedEmpRows([]);
    setEmpFileName('');
    showNotice('success', `Bulk Employee Import Complete: ${result.added} newly added, ${result.updated} existing updated, ${result.skipped} skipped.`);
  };

  const handleExportCurrentEmployees = () => {
    const data = employees.map(e => ({
      'Employee Code': e.employeeCode,
      'Full Name (English)': e.fullNameEnglish,
      'Full Name (Bangla)': e.fullNameBangla || '',
      'Designation': e.designation,
      'Department': e.department,
      'Gross Salary': e.grossSalary,
      'Joining Date': e.joiningDate,
      'Date of Birth': e.dob,
      'Gender': e.gender,
      'Blood Group': e.bloodGroup,
      'Marital Status': e.maritalStatus,
      'Mobile Number': e.mobileNumber,
      'Official Email': e.emailAddress,
      'Personal Mobile': e.personalMobileNumber || '',
      'Personal Email': e.personalEmailAddress || '',
      'NID': e.nid,
      'Passport Number': e.passportNumber || '',
      'TIN': e.tin || '',
      'Tax Zone': e.taxZone || '',
      'Tax Circle': e.taxCircle || '',
      'Bank Name': e.bankName || '',
      'Bank Account No': e.bankAccountNo || '',
      'Intercom': e.intercom || '',
      'Educational Qualification': e.educationalQualification || '',
      'Father Name': e.fatherName || '',
      'Mother Name': e.motherName || '',
      'Nominee': e.nominee || '',
      'Present Address': e.presentAddress || '',
      'Permanent Address': e.permanentAddress || '',
      'Status': e.status
    }));
    exportToExcel(data, `ATCL_All_Employees_${new Date().toISOString().split('T')[0]}`, 'Employees');
    showNotice('success', `Exported ${data.length} employees to Excel. You can edit the sheet and upload it back anytime.`);
  };

  const handleQuickRowChange = (idx, field, val) => {
    setQuickRows(prev => prev.map((r, i) => (i === idx ? { ...r, [field]: val } : r)));
  };

  const handleSaveQuickRows = () => {
    const filled = quickRows.filter(r => r.fullNameEnglish.trim() !== '');
    if (filled.length === 0) {
      showNotice('error', 'Please enter at least one Employee Full Name in the quick-add grid.');
      return;
    }
    const result = bulkUpsertEmployees(filled, 'upsert');
    setQuickRows([createEmptyQuickRow(), createEmptyQuickRow()]);
    showNotice('success', `Quick Batch Saved: ${result.added} employee(s) added, ${result.updated} updated.`);
  };

  // --- Handlers for Tab 2: Operational Data Import ---
  const handleOpsFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setOpsFileName(file.name);
    try {
      const { rows } = await parseUploadedSpreadsheet(file);
      if (!rows || rows.length === 0) {
        showNotice('error', 'Uploaded sheet has no rows.');
        setParsedOpsRows([]);
      } else {
        setParsedOpsRows(rows);
        showNotice('success', `Loaded ${rows.length} row(s) from "${file.name}". Review preview below and click Commit.`);
      }
    } catch (err) {
      showNotice('error', `Error reading spreadsheet: ${err.message}`);
    } finally {
      if (opsFileInputRef.current) opsFileInputRef.current.value = '';
    }
  };

  const handleCommitOpsUpload = () => {
    if (parsedOpsRows.length === 0) return;
    if (opsImportType === 'attendance') {
      const res = bulkImportAttendance(parsedOpsRows);
      showNotice('success', `Attendance Import Complete: ${res.imported} log(s) imported/updated, ${res.skipped} skipped.`);
    } else if (opsImportType === 'salary_tax') {
      const res = bulkImportSalaryAndTax(parsedOpsRows);
      showNotice('success', `Salary, Bank & Tax Import Complete: ${res.updated} employee record(s) updated, ${res.skipped} skipped.`);
    }
    setParsedOpsRows([]);
    setOpsFileName('');
  };

  // --- Handlers for Tab 3: Master Data & Policies ---
  const handleAddDepartment = () => {
    const trimmed = newDepartment.trim();
    if (!trimmed) return;
    const current = hrSettings?.departments || [];
    if (current.includes(trimmed)) {
      showNotice('error', 'Department already exists.');
      return;
    }
    updateHrSettings({ departments: [...current, trimmed] }, currentUser?.name);
    setNewDepartment('');
    showNotice('success', `Added department "${trimmed}".`);
  };

  const handleRemoveDepartment = (dept) => {
    const current = hrSettings?.departments || [];
    updateHrSettings({ departments: current.filter(d => d !== dept) }, currentUser?.name);
    showNotice('success', `Removed department "${dept}".`);
  };

  const handleAddDesignation = () => {
    const trimmed = newDesignation.trim();
    if (!trimmed) return;
    const current = hrSettings?.designations || [];
    if (current.includes(trimmed)) {
      showNotice('error', 'Designation already exists.');
      return;
    }
    updateHrSettings({ designations: [...current, trimmed] }, currentUser?.name);
    setNewDesignation('');
    showNotice('success', `Added designation "${trimmed}".`);
  };

  const handleRemoveDesignation = (desig) => {
    const current = hrSettings?.designations || [];
    updateHrSettings({ designations: current.filter(d => d !== desig) }, currentUser?.name);
    showNotice('success', `Removed designation "${desig}".`);
  };

  const handleSaveQuotasAndRatios = () => {
    const totalRatio =
      Number(ratiosForm.basic) +
      Number(ratiosForm.houseRent) +
      Number(ratiosForm.medical) +
      Number(ratiosForm.conveyance) +
      Number(ratiosForm.mobile);

    if (totalRatio !== 100) {
      showNotice('error', `Salary component ratios must sum to 100% (currently ${totalRatio}%).`);
      return;
    }

    updateHrSettings({
      defaultLeaveQuotas: {
        casual: Number(quotasForm.casual) || 0,
        sick: Number(quotasForm.sick) || 0,
        annual: Number(quotasForm.annual) || 0,
        maternity: Number(quotasForm.maternity) || 0,
        paternity: Number(quotasForm.paternity) || 0,
        special: Number(quotasForm.special) || 0
      },
      salaryRatios: {
        basic: Number(ratiosForm.basic),
        houseRent: Number(ratiosForm.houseRent),
        medical: Number(ratiosForm.medical),
        conveyance: Number(ratiosForm.conveyance),
        mobile: Number(ratiosForm.mobile)
      },
      shifts: shiftsForm
    }, currentUser?.name);

    showNotice('success', 'Saved Leave Quotas, Salary Breakdown Ratios, and Shift Timings.');
  };

  const handleAddHoliday = () => {
    if (!newHoliday.date || !newHoliday.name.trim()) {
      showNotice('error', 'Please provide both a Holiday Date and Name.');
      return;
    }
    const list = hrSettings?.holidays || [];
    const entry = {
      id: `hol-${Date.now()}`,
      date: newHoliday.date,
      name: newHoliday.name.trim(),
      type: newHoliday.type,
      days: Number(newHoliday.days) || 1
    };
    updateHrSettings({ holidays: [...list, entry] }, currentUser?.name);
    setNewHoliday({ date: '', name: '', type: 'National Holiday', days: 1 });
    showNotice('success', `Added holiday "${entry.name}".`);
  };

  const handleDeleteHoliday = (id) => {
    const list = hrSettings?.holidays || [];
    updateHrSettings({ holidays: list.filter(h => h.id !== id) }, currentUser?.name);
  };

  const handleHolidayExcelUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { rows } = await parseUploadedSpreadsheet(file);
      const imported = rows
        .filter(r => (r['Date'] || r.date) && (r['Holiday Name'] || r.name))
        .map((r, i) => ({
          id: `hol-${Date.now()}-${i}`,
          date: String(r['Date'] || r.date).trim(),
          name: String(r['Holiday Name'] || r.name).trim(),
          type: String(r['Type'] || r.type || 'National Holiday').trim(),
          days: Number(r['Days'] || r.days || 1) || 1
        }));
      if (imported.length > 0) {
        updateHrSettings({ holidays: [...(hrSettings?.holidays || []), ...imported] }, currentUser?.name);
        showNotice('success', `Imported ${imported.length} holiday(s) from Excel.`);
      }
    } catch (err) {
      showNotice('error', `Holiday import failed: ${err.message}`);
    }
  };

  // --- Handlers for Tab 4: User Credentials ---
  const filteredCreds = useMemo(() => {
    const q = credSearch.trim().toLowerCase();
    return (userCredentials || []).filter(c =>
      !q ||
      c.employeeCode?.toLowerCase().includes(q) ||
      c.fullName?.toLowerCase().includes(q) ||
      c.username?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q)
    );
  }, [userCredentials, credSearch]);

  const handleStartEditCred = (cred) => {
    setEditingCredCode(cred.employeeCode);
    setCredEditForm({
      username: cred.username,
      email: cred.email,
      password: cred.password,
      mustChangePassword: !!cred.mustChangePassword
    });
  };

  const handleSaveCredEdit = (employeeCode) => {
    adminUpdateUserCredential(employeeCode, {
      username: credEditForm.username.trim().toLowerCase(),
      email: credEditForm.email.trim().toLowerCase(),
      password: credEditForm.password,
      mustChangePassword: credEditForm.mustChangePassword
    });
    setEditingCredCode(null);
    showNotice('success', `Updated login credentials for ${employeeCode}.`);
  };

  const handleResetSinglePassword = (employeeCode) => {
    adminUpdateUserCredential(employeeCode, {
      password: '123456',
      mustChangePassword: true
    });
    showNotice('success', `Reset password for ${employeeCode} to default OTP (123456).`);
  };

  const handleExportCredentials = () => {
    const rows = (userCredentials || []).map(c => ({
      'Employee Code': c.employeeCode,
      'Full Name': c.fullName,
      'Username / Login ID': c.username,
      'Official Email': c.email,
      'Current OTP / Password': c.password,
      'Must Change On Next Login': c.mustChangePassword ? 'Yes' : 'No'
    }));
    exportToExcel(rows, `ATCL_User_Credentials_${new Date().toISOString().split('T')[0]}`, 'Credentials');
    showNotice('success', 'Exported employee login credentials to Excel.');
  };

  // --- Handlers for Tab 5: Backup & Restore ---
  const handleRestoreBackupFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsed = JSON.parse(evt.target.result);
        restoreSystemBackup(parsed);
        showNotice('success', `System database successfully restored from "${file.name}".`);
      } catch (err) {
        showNotice('error', `Failed to restore backup: ${err.message}`);
      } finally {
        if (restoreFileInputRef.current) restoreFileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  // --- Handlers for Google Workspace Cloud Integration ---
  const handleConnectGoogleOAuth = () => {
    setGwsConnecting(true);
    try {
      triggerGoogleWorkspaceOAuth('consent');
    } catch {
      const session = connectSimulatedWorkspace(gwsConfig.adminEmail);
      setGwsSession(session);
      setGwsLogs(getWorkspaceSyncLogs());
      setGwsConnecting(false);
      showNotice('success', `Connected to Google Workspace Bridge (${session.email}).`);
    }
  };

  const handleConnectWorkspaceBridge = () => {
    const session = connectSimulatedWorkspace(gwsConfig.adminEmail);
    setGwsSession(session);
    setGwsLogs(getWorkspaceSyncLogs());
    showNotice('success', `Google Workspace Cloud connected for ${session.email} (${gwsConfig.workspaceDomain}).`);
  };

  const handleDisconnectGoogle = () => {
    disconnectGoogleWorkspace();
    setGwsSession(null);
    setGwsLogs(getWorkspaceSyncLogs());
    showNotice('success', 'Disconnected from Google Workspace Cloud.');
  };

  const handleSaveGwsConfig = () => {
    const cleanFolderId = extractGoogleDriveFolderId(gwsConfig.parentFolderId);
    const updated = saveWorkspaceConfig({
      ...gwsConfig,
      adminEmail: (gwsConfig.adminEmail || 'erpatcl@gmail.com').trim(),
      parentFolderId: cleanFolderId || gwsConfig.parentFolderId,
      sheetId: sheetSyncUrl
    });
    setGwsConfig(updated);
    if (gwsSession?.connected || updated.autoConnectOnStartup !== false) {
      const refreshedSession = connectSimulatedWorkspace(updated.adminEmail);
      setGwsSession(refreshedSession);
    }
    addWorkspaceSyncLog({
      service: 'Workspace Config',
      action: `Saved Cloud Configuration (Account: ${updated.adminEmail}, Auto-Connect: ${updated.autoConnectOnStartup !== false ? 'ON' : 'OFF'})`,
      status: 'Success'
    });
    setGwsLogs(getWorkspaceSyncLogs());
    showNotice('success', `Saved Google Workspace Cloud settings for ${updated.adminEmail}.`);
  };

  const handleToggleSyncModule = (modKey) => {
    const nextModules = {
      ...gwsConfig.syncModules,
      [modKey]: !gwsConfig.syncModules?.[modKey]
    };
    const updated = saveWorkspaceConfig({
      ...gwsConfig,
      syncModules: nextModules
    });
    setGwsConfig(updated);
  };

  const handleCloudBackupNow = async () => {
    if (!gwsSession?.connected) {
      showNotice('error', 'Please connect your Google Workspace account first.');
      return;
    }
    setGwsSyncingBackup(true);
    try {
      const payload = getSystemBackupPayload();
      const dateStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const fileName = `ATCL_HRMS_Workspace_Cloud_Backup_${dateStr}.json`;
      const record = await uploadBackupToGoogleDrive({ data: payload, ...payload }, fileName);
      setGwsBackups(getCloudBackupsList());
      setGwsLogs(getWorkspaceSyncLogs());
      showNotice('success', `Cloud Snapshot "${record.fileName}" (${record.size}) synced to Google Drive.`);
    } catch (err) {
      showNotice('error', `Cloud backup failed: ${err.message}`);
    } finally {
      setGwsSyncingBackup(false);
    }
  };

  const handleRestoreFromCloudBackup = (backupRecord) => {
    if (!backupRecord?.payload) {
      showNotice('error', 'Backup payload not available in local cache.');
      return;
    }
    if (!window.confirm(`Restore ATCL HRMS from Google Drive snapshot "${backupRecord.fileName}"?`)) {
      return;
    }
    restoreSystemBackup(backupRecord.payload);
    addWorkspaceSyncLog({
      service: 'Google Drive Restore',
      action: `Restored system state from "${backupRecord.fileName}"`,
      status: 'Success'
    });
    setGwsLogs(getWorkspaceSyncLogs());
    showNotice('success', `System successfully restored from cloud snapshot "${backupRecord.fileName}".`);
  };

  const handleCreateSingleEmpFolder = async (emp) => {
    if (!gwsSession?.connected) {
      showNotice('error', 'Connect Google Workspace first to create employee folders in Google Drive.');
      return;
    }
    setCreatingEmpFolderCode(emp.employeeCode);
    try {
      await createEmployeeDriveFolder(emp);
      setEmpDriveFolders(getEmployeeDriveFolders());
      addWorkspaceSyncLog({
        service: 'Google Drive DMS',
        action: `Created employee dossier folder "${emp.employeeCode} - ${emp.fullNameEnglish}"`,
        status: 'Success'
      });
      setGwsLogs(getWorkspaceSyncLogs());
      showNotice('success', `Created Google Drive folder for ${emp.fullNameEnglish} (${emp.employeeCode}).`);
    } catch (err) {
      showNotice('error', err.message);
    } finally {
      setCreatingEmpFolderCode('');
    }
  };

  const handleBulkCreateEmpFolders = async () => {
    if (!gwsSession?.connected) {
      showNotice('error', 'Connect Google Workspace first to provision employee folders.');
      return;
    }
    const missing = employees.filter(e => !empDriveFolders[e.employeeCode]);
    if (missing.length === 0) {
      showNotice('success', 'All employees already have linked Google Drive dossier folders.');
      return;
    }
    setBulkCreatingFolders(true);
    try {
      for (const emp of missing) {
        await createEmployeeDriveFolder(emp);
      }
      setEmpDriveFolders(getEmployeeDriveFolders());
      addWorkspaceSyncLog({
        service: 'Google Drive DMS',
        action: `Provisioned ${missing.length} employee dossier folder(s) in Google Drive`,
        status: 'Success'
      });
      setGwsLogs(getWorkspaceSyncLogs());
      showNotice('success', `Provisioned ${missing.length} employee dossier folders in Google Drive.`);
    } catch (err) {
      showNotice('error', `Bulk folder creation error: ${err.message}`);
    } finally {
      setBulkCreatingFolders(false);
    }
  };

  const handlePullFromGoogleSheet = async () => {
    if (!sheetSyncUrl.trim()) {
      showNotice('error', 'Please paste a Google Sheet URL or Spreadsheet ID first.');
      return;
    }
    setSheetPulling(true);
    try {
      const rows = await fetchRowsFromGoogleSheet(sheetSyncUrl);
      if (!rows || rows.length === 0) {
        showNotice('error', 'The Google Sheet returned 0 rows.');
      } else if (sheetSyncTarget === 'employees') {
        const normalized = rows.map((r, i) => normalizeEmpRow(r, i)).filter(r => r.fullNameEnglish);
        const res = bulkUpsertEmployees(normalized, 'upsert');
        showNotice('success', `Google Sheets Sync Complete: ${res.added} employee(s) added, ${res.updated} updated.`);
      } else if (sheetSyncTarget === 'attendance') {
        const res = bulkImportAttendance(rows);
        showNotice('success', `Google Sheets Attendance Sync: ${res.imported} log(s) synced.`);
      } else if (sheetSyncTarget === 'salary_tax') {
        const res = bulkImportSalaryAndTax(rows);
        showNotice('success', `Google Sheets Salary & Tax Sync: ${res.updated} employee(s) updated.`);
      }
      setGwsLogs(getWorkspaceSyncLogs());
    } catch (err) {
      showNotice('error', err.message);
    } finally {
      setSheetPulling(false);
    }
  };

  const handleSyncHolidaysToGoogleCalendar = () => {
    if (!gwsSession?.connected) {
      showNotice('error', 'Please connect Google Workspace before syncing holidays to Google Calendar.');
      return;
    }
    const holidayCount = (hrSettings?.holidays || []).length;
    addWorkspaceSyncLog({
      service: 'Google Calendar API',
      action: `Synced ${holidayCount} official BD holidays & ${employees.length} employee birthdays to Calendar (${gwsConfig.calendarId})`,
      status: 'Success'
    });
    setGwsLogs(getWorkspaceSyncLogs());
    showNotice('success', `Synced ${holidayCount} official holidays and ${employees.length} employee milestones to Google Calendar (${gwsSession.email}).`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Top Summary Banner */}
      <div className="card" style={{
        background: 'linear-gradient(135deg, rgba(0, 180, 216, 0.12), rgba(59, 130, 246, 0.08))',
        border: '1px solid rgba(0, 180, 216, 0.25)',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 16
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="badge badge-success" style={{ fontSize: '0.7rem', textTransform: 'uppercase' }}>Admin Only Console</span>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>ATCL HR Master Settings & Bulk Data Provisioning</h2>
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: 6, marginBottom: 0 }}>
            Bulk upload employees via Excel/CSV, batch-add staff records, import attendance & tax data, configure organizational master lists, and manage user login credentials.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ textAlign: 'center', padding: '6px 14px', background: 'var(--bg-card)', borderRadius: 8, border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary-color)' }}>{employees.length}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Total Employees</div>
          </div>
          <div style={{ textAlign: 'center', padding: '6px 14px', background: 'var(--bg-card)', borderRadius: 8, border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--secondary-color)' }}>{hrSettings?.departments?.length || 0}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Departments</div>
          </div>
          <div style={{ textAlign: 'center', padding: '6px 14px', background: 'var(--bg-card)', borderRadius: 8, border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#10b981' }}>{userCredentials?.length || 0}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>ESS Accounts</div>
          </div>
          <div style={{ textAlign: 'center', padding: '6px 14px', background: 'var(--bg-card)', borderRadius: 8, border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.88rem', fontWeight: 800, color: gwsSession?.connected ? '#10b981' : '#f59e0b' }}>
              {gwsSession?.connected ? '☁️ Connected' : '☁️ Offline'}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Google Workspace</div>
          </div>
        </div>
      </div>

      {/* Status Notification Alert */}
      {banner.message && (
        <div style={{
          padding: '12px 18px',
          borderRadius: 'var(--border-radius-sm)',
          fontWeight: 600,
          fontSize: '0.85rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: banner.type === 'error' ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.12)',
          color: banner.type === 'error' ? '#ef4444' : '#10b981',
          border: `1px solid ${banner.type === 'error' ? 'rgba(239, 68, 68, 0.35)' : 'rgba(16, 185, 129, 0.35)'}`
        }}>
          <span>{banner.message}</span>
          <button
            onClick={() => setBanner({ type: '', message: '' })}
            style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '1.1rem', fontWeight: 700 }}
          >
            &times;
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="tabs-header" style={{ display: 'flex', flexWrap: 'wrap', gap: 8, borderBottom: '1px solid var(--border-color)', paddingBottom: 8 }}>
        <button
          className={`tab-btn ${activeTab === 'templates' ? 'active' : ''}`}
          onClick={() => setActiveTab('templates')}
        >
          📄 Document Templates ({documentTemplates?.length || 14})
        </button>
        <button
          className={`tab-btn ${activeTab === 'google_workspace' ? 'active' : ''}`}
          onClick={() => setActiveTab('google_workspace')}
        >
          ☁️ Google Workspace Cloud Integration
        </button>
        <button
          className={`tab-btn ${activeTab === 'bulk_employees' ? 'active' : ''}`}
          onClick={() => setActiveTab('bulk_employees')}
        >
          1. Employee Bulk Upload & Quick Add
        </button>
        <button
          className={`tab-btn ${activeTab === 'bulk_operations' ? 'active' : ''}`}
          onClick={() => setActiveTab('bulk_operations')}
        >
          2. Attendance, Salary & Tax Import
        </button>
        <button
          className={`tab-btn ${activeTab === 'master_data' ? 'active' : ''}`}
          onClick={() => setActiveTab('master_data')}
        >
          3. Master Data & HR Policies
        </button>
        <button
          className={`tab-btn ${activeTab === 'credentials' ? 'active' : ''}`}
          onClick={() => setActiveTab('credentials')}
        >
          4. User Credentials & Access
        </button>
        <button
          className={`tab-btn ${activeTab === 'backup' ? 'active' : ''}`}
          onClick={() => setActiveTab('backup')}
        >
          5. System Backup & Restore
        </button>
      </div>

      {/* =====================================================================
          TAB: DOCUMENT TEMPLATES, LETTERS & MONTHLY PAYROLL/BANK SHEETS
         ===================================================================== */}
      {activeTab === 'templates' && (
        <DocumentTemplatesHub showNotice={showNotice} />
      )}

      {/* =====================================================================
          TAB 0: GOOGLE WORKSPACE CLOUD INTEGRATION
         ===================================================================== */}
      {activeTab === 'google_workspace' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* 1. Connection & OAuth Status Banner */}
          <div className="card" style={{
            borderLeft: gwsSession?.connected ? '5px solid #10b981' : '5px solid #3b82f6',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 16
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: gwsSession?.connected ? 'rgba(16, 185, 129, 0.12)' : 'rgba(59, 130, 246, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem'
              }}>
                ☁️
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <h3 style={{ fontSize: '1.08rem', fontWeight: 800, margin: 0, color: 'var(--primary-color)' }}>
                    Google Workspace Cloud Integration (Drive · Sheets · Calendar · Gmail)
                  </h3>
                  <span className={`badge ${gwsSession?.connected ? 'badge-success' : 'badge-warning'}`}>
                    {gwsSession?.connected
                      ? `✓ Auto-Connected (${gwsSession.email || 'erpatcl@gmail.com'})`
                      : 'Not Connected'}
                  </span>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 4, marginBottom: 0 }}>
                  {gwsSession?.connected
                    ? `Automatically connected to Google Workspace as ${gwsSession.email || 'erpatcl@gmail.com'} on software startup. Cloud Drive backups, Employee Dossier folders, Google Sheets live sync, and Calendar holiday sync are active.`
                    : 'Connect your corporate Google Workspace account (erpatcl@gmail.com) to enable automated Google Drive backups, employee dossier folders, two-way Google Sheets sync, and Google Calendar HR events.'}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {gwsSession?.connected ? (
                <>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={handleCloudBackupNow}
                    disabled={gwsSyncingBackup}
                  >
                    {gwsSyncingBackup ? '⏳ Uploading to Drive...' : '☁️ Backup to Google Drive Now'}
                  </button>
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={handleConnectGoogleOAuth}
                    disabled={gwsConnecting}
                    title="Authenticate live Google OAuth 2.0 token for erpatcl@gmail.com"
                  >
                    {gwsConnecting ? 'Authorizing...' : '🔐 Authorize Live OAuth 2.0'}
                  </button>
                  <a
                    href={`https://drive.google.com/drive/folders/${gwsConfig.parentFolderId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary btn-sm"
                    style={{ textDecoration: 'none' }}
                  >
                    📂 Open HR Drive Folder ↗
                  </a>
                  <button className="btn btn-danger btn-sm" onClick={handleDisconnectGoogle}>
                    Disconnect
                  </button>
                </>
              ) : (
                <>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={handleConnectGoogleOAuth}
                    disabled={gwsConnecting}
                  >
                    {gwsConnecting ? 'Connecting...' : '🔐 Sign in with Google OAuth 2.0'}
                  </button>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={handleConnectWorkspaceBridge}
                  >
                    ⚡ 1-Click Connect ({gwsConfig.adminEmail || 'erpatcl@gmail.com'})
                  </button>
                </>
              )}
            </div>
          </div>

          {/* 2. Sub-Navigation inside Google Workspace Tab */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              className={`btn btn-sm ${gwsDriveSubTab === 'overview' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setGwsDriveSubTab('overview')}
            >
              ⚙️ Cloud Config, Sheets Sync & Backups
            </button>
            <button
              className={`btn btn-sm ${gwsDriveSubTab === 'drive_embed' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setGwsDriveSubTab('drive_embed')}
            >
              📁 Live Google Drive Folder Explorer
            </button>
            <button
              className={`btn btn-sm ${gwsDriveSubTab === 'emp_folders' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setGwsDriveSubTab('emp_folders')}
            >
              🗂️ Employee Drive Dossier Folders ({Object.keys(empDriveFolders).length}/{employees.length})
            </button>
          </div>

          {/* SUB-TAB A: OVERVIEW, CONFIG, SHEETS SYNC & CLOUD BACKUPS */}
          {gwsDriveSubTab === 'overview' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: 24 }}>
                {/* Card 1: OAuth & Drive Folder Credentials */}
                <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4 style={{ color: 'var(--primary-color)', margin: 0 }}>
                      🔑 Google Workspace API & Folder Configuration
                    </h4>
                    <button className="btn btn-primary btn-sm" onClick={handleSaveGwsConfig}>
                      💾 Save Config
                    </button>
                  </div>

                  {/* Auto-Connect on Startup Toggle */}
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 12px',
                      borderRadius: 8,
                      border: '1px solid rgba(16, 185, 129, 0.35)',
                      background: 'rgba(16, 185, 129, 0.08)',
                      cursor: 'pointer'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#10b981' }}>
                        ⚡ Auto-Connect ({gwsConfig.adminEmail || 'erpatcl@gmail.com'}) When Software Opens
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                        Automatically connects {gwsConfig.adminEmail || 'erpatcl@gmail.com'} to Google Workspace Cloud on application launch
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={gwsConfig.autoConnectOnStartup !== false}
                      onChange={e => {
                        const checked = e.target.checked;
                        const updated = saveWorkspaceConfig({ ...gwsConfig, autoConnectOnStartup: checked });
                        setGwsConfig(updated);
                        if (checked && !gwsSession?.connected) {
                          const s = connectSimulatedWorkspace(updated.adminEmail);
                          setGwsSession(s);
                        }
                      }}
                      style={{ width: 18, height: 18, accentColor: '#10b981' }}
                    />
                  </label>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Corporate Workspace Domain</label>
                      <input
                        type="text"
                        value={gwsConfig.workspaceDomain}
                        placeholder="atcbd.net"
                        onChange={e => setGwsConfig(p => ({ ...p, workspaceDomain: e.target.value }))}
                      />
                    </div>
                    <div className="form-group">
                      <label>Google Workspace Email (Auto-Connected)</label>
                      <input
                        type="email"
                        value={gwsConfig.adminEmail}
                        placeholder="erpatcl@gmail.com"
                        onChange={e => setGwsConfig(p => ({ ...p, adminEmail: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Google Cloud OAuth 2.0 Client ID</label>
                    <input
                      type="text"
                      value={gwsConfig.clientId}
                      onChange={e => setGwsConfig(p => ({ ...p, clientId: e.target.value }))}
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Master Google Drive Folder ID or URL</label>
                      <input
                        type="text"
                        value={gwsConfig.parentFolderId}
                        placeholder="1iQ_Gtp9GVtVztln4wKaRC_n_FSixfiEL"
                        onChange={e => setGwsConfig(p => ({ ...p, parentFolderId: extractGoogleDriveFolderId(e.target.value) }))}
                      />
                    </div>
                    <div className="form-group">
                      <label>Auto-Backup Schedule</label>
                      <select
                        value={gwsConfig.autoBackupFrequency}
                        onChange={e => setGwsConfig(p => ({ ...p, autoBackupFrequency: e.target.value }))}
                      >
                        <option value="realtime">Real-Time on Data Change</option>
                        <option value="daily">Daily Automated Snapshot</option>
                        <option value="weekly">Weekly Snapshot</option>
                      </select>
                    </div>
                  </div>

                  {/* Module Sync Checkboxes */}
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
                      Enabled Google Workspace Sync Services
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      {[
                        { key: 'employees', label: '👥 Employee Master Directory' },
                        { key: 'attendance', label: '🕐 Biometric & Geo Attendance' },
                        { key: 'payrollRuns', label: '💰 Monthly Payroll & Payslips' },
                        { key: 'taxDeclarations', label: '📋 NBR Section 139 Tax Profiles' },
                        { key: 'holidaysCalendar', label: '📅 Google Calendar BD Holidays' },
                        { key: 'gmailNotifications', label: '✉️ Gmail Payslip & Leave Alerts' }
                      ].map(mod => (
                        <label
                          key={mod.key}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            padding: '8px 10px',
                            borderRadius: 6,
                            border: '1px solid var(--border-color)',
                            background: gwsConfig.syncModules?.[mod.key] ? 'rgba(16, 185, 129, 0.08)' : 'var(--bg-input)',
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={!!gwsConfig.syncModules?.[mod.key]}
                            onChange={() => handleToggleSyncModule(mod.key)}
                            style={{ width: 15, height: 15, accentColor: 'var(--primary-color)' }}
                          />
                          <span>{mod.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Card 2: Google Sheets Live Two-Way Sync & Calendar Sync */}
                <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <h4 style={{ color: 'var(--primary-color)', margin: 0 }}>
                    📊 Google Sheets Live Two-Way Sync & Calendar
                  </h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                    Pull live records directly from a shared Google Sheet into ATCL HRMS, or export formatted sheets for Google Drive.
                  </p>

                  <div className="form-group">
                    <label>Google Sheet Share URL or Spreadsheet ID</label>
                    <input
                      type="text"
                      placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit"
                      value={sheetSyncUrl}
                      onChange={e => setSheetSyncUrl(e.target.value)}
                    />
                  </div>

                  <div className="form-row" style={{ alignItems: 'flex-end' }}>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label>Target HRMS Module</label>
                      <select value={sheetSyncTarget} onChange={e => setSheetSyncTarget(e.target.value)}>
                        <option value="employees">Employees Master Directory (Upsert by Employee Code)</option>
                        <option value="attendance">Daily Attendance Logs</option>
                        <option value="salary_tax">Salary Structure, Bank & Tax Declarations</option>
                      </select>
                    </div>
                    <button
                      className="btn btn-primary"
                      onClick={handlePullFromGoogleSheet}
                      disabled={sheetPulling}
                      style={{ height: 38 }}
                    >
                      {sheetPulling ? '⏳ Pulling Sheet...' : '⬇ Pull from Google Sheet'}
                    </button>
                  </div>

                  <div style={{
                    padding: 12,
                    borderRadius: 8,
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8
                  }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      📤 Push / Export Live HR Tables for Google Sheets
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <button className="btn btn-outline btn-sm" onClick={handleExportCurrentEmployees}>
                        📊 Export Employees Sheet ({employees.length})
                      </button>
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => {
                          exportToExcel(attendanceLogs, `ATCL_Attendance_GoogleSheet_${new Date().toISOString().split('T')[0]}`, 'Attendance');
                          showNotice('success', `Exported ${attendanceLogs.length} attendance logs for Google Sheets.`);
                        }}
                      >
                        🕐 Export Attendance Sheet ({attendanceLogs.length})
                      </button>
                      <button className="btn btn-secondary btn-sm" onClick={handleSyncHolidaysToGoogleCalendar}>
                        📅 Sync Holidays to Google Calendar ({hrSettings?.holidays?.length || 0})
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 3: Cloud Backup Snapshots & Activity Log */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: 24 }}>
                {/* Google Drive Backup Snapshots */}
                <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                    <h4 style={{ color: 'var(--primary-color)', margin: 0 }}>
                      ☁️ Google Drive Cloud Snapshots ({gwsBackups.length})
                    </h4>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={handleCloudBackupNow}
                      disabled={gwsSyncingBackup}
                    >
                      + Create Cloud Snapshot
                    </button>
                  </div>

                  <div className="table-container" style={{ maxHeight: 260, overflowY: 'auto' }}>
                    <table>
                      <thead>
                        <tr>
                          <th>Snapshot File</th>
                          <th>Timestamp</th>
                          <th>Size</th>
                          <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {gwsBackups.length === 0 ? (
                          <tr>
                            <td colSpan={4} style={{ textAlign: 'center', padding: 24, color: 'var(--text-secondary)' }}>
                              No cloud backups recorded yet. Click "Backup to Google Drive Now" to push a snapshot.
                            </td>
                          </tr>
                        ) : (
                          gwsBackups.map(b => (
                            <tr key={b.id}>
                              <td style={{ fontWeight: 600, fontSize: '0.78rem' }}>{b.fileName}</td>
                              <td style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                {new Date(b.createdAt).toLocaleString()}
                              </td>
                              <td><span className="badge badge-success">{b.size}</span></td>
                              <td style={{ textAlign: 'right' }}>
                                <div style={{ display: 'inline-flex', gap: 6 }}>
                                  <button
                                    className="btn btn-outline btn-sm"
                                    onClick={() => handleRestoreFromCloudBackup(b)}
                                  >
                                    Restore
                                  </button>
                                  <a
                                    href={b.webViewLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn btn-secondary btn-sm"
                                    style={{ textDecoration: 'none' }}
                                  >
                                    Drive ↗
                                  </a>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Google Workspace Sync Audit Log */}
                <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4 style={{ color: 'var(--primary-color)', margin: 0 }}>
                      📜 Google Workspace Sync Activity Log
                    </h4>
                    {gwsLogs.length > 0 && (
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => {
                          clearWorkspaceSyncLogs();
                          setGwsLogs([]);
                        }}
                      >
                        Clear Log
                      </button>
                    )}
                  </div>

                  <div className="table-container" style={{ maxHeight: 260, overflowY: 'auto' }}>
                    <table>
                      <thead>
                        <tr>
                          <th>Time</th>
                          <th>Workspace Service</th>
                          <th>Operation</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {gwsLogs.length === 0 ? (
                          <tr>
                            <td colSpan={4} style={{ textAlign: 'center', padding: 24, color: 'var(--text-secondary)' }}>
                              No Google Workspace sync events logged yet.
                            </td>
                          </tr>
                        ) : (
                          gwsLogs.map(log => (
                            <tr key={log.id}>
                              <td style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                                {new Date(log.timestamp).toLocaleTimeString()}
                              </td>
                              <td style={{ fontWeight: 700, fontSize: '0.78rem', color: 'var(--primary-color)' }}>
                                {log.service}
                              </td>
                              <td style={{ fontSize: '0.78rem' }}>{log.action}</td>
                              <td>
                                <span className="badge badge-success">{log.status}</span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* SUB-TAB B: EMBEDDED GOOGLE DRIVE FOLDER EXPLORER */}
          {gwsDriveSubTab === 'drive_embed' && (
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <h4 style={{ color: 'var(--primary-color)', margin: 0 }}>
                    📁 ATCL HR Corporate Google Drive Repository
                  </h4>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    Folder ID: <code>{gwsConfig.parentFolderId}</code>
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button
                    className={`btn btn-sm ${driveViewMode === 'list' ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => setDriveViewMode('list')}
                  >
                    ☰ List View
                  </button>
                  <button
                    className={`btn btn-sm ${driveViewMode === 'grid' ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => setDriveViewMode('grid')}
                  >
                    ⊞ Grid View
                  </button>
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => setDriveIframeKey(k => k + 1)}
                  >
                    🔄 Refresh
                  </button>
                  <a
                    href={`https://drive.google.com/drive/folders/${gwsConfig.parentFolderId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary btn-sm"
                    style={{ textDecoration: 'none' }}
                  >
                    Open in Google Drive ↗
                  </a>
                </div>
              </div>

              <div style={{
                border: '1px solid var(--border-color)',
                borderRadius: 10,
                overflow: 'hidden',
                height: 520,
                background: '#fff'
              }}>
                <iframe
                  key={driveIframeKey}
                  src={`https://drive.google.com/embeddedfolderview?id=${gwsConfig.parentFolderId}#${driveViewMode}`}
                  title="ATCL HR Google Drive Folder"
                  style={{ width: '100%', height: '100%', border: 0 }}
                  allow="autoplay"
                  loading="lazy"
                />
              </div>
            </div>
          )}

          {/* SUB-TAB C: EMPLOYEE DOSSIER FOLDERS IN GOOGLE DRIVE */}
          {gwsDriveSubTab === 'emp_folders' && (
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <h4 style={{ color: 'var(--primary-color)', margin: 0 }}>
                    🗂️ Employee Personnel Dossier Folders (Google Drive DMS)
                  </h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 4, marginBottom: 0 }}>
                    Automatically provision dedicated Google Drive folders (<code>EmployeeCode - Full Name</code>) for storing NID, TIN certificates, appointment letters, and Section 139 tax challans.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={handleBulkCreateEmpFolders}
                    disabled={bulkCreatingFolders}
                  >
                    {bulkCreatingFolders
                      ? '⏳ Provisioning Folders...'
                      : `📁 Auto-Create All Missing Folders (${employees.filter(e => !empDriveFolders[e.employeeCode]).length})`}
                  </button>
                </div>
              </div>

              <input
                type="text"
                placeholder="Search employee dossier folder by code, name, or department..."
                value={empFolderSearch}
                onChange={e => setEmpFolderSearch(e.target.value)}
                style={{ maxWidth: 420 }}
              />

              <div className="table-container" style={{ maxHeight: 420, overflowY: 'auto' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Employee Code</th>
                      <th>Employee Name</th>
                      <th>Department</th>
                      <th>Google Drive Folder Name</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employees
                      .filter(e => {
                        const q = empFolderSearch.trim().toLowerCase();
                        return (
                          !q ||
                          e.employeeCode.toLowerCase().includes(q) ||
                          e.fullNameEnglish.toLowerCase().includes(q) ||
                          (e.department || '').toLowerCase().includes(q)
                        );
                      })
                      .map(e => {
                        const folder = empDriveFolders[e.employeeCode];
                        return (
                          <tr key={e.employeeCode}>
                            <td style={{ fontWeight: 700, color: 'var(--primary-color)' }}>{e.employeeCode}</td>
                            <td style={{ fontWeight: 600 }}>{e.fullNameEnglish}</td>
                            <td style={{ fontSize: '0.8rem' }}>{e.department}</td>
                            <td>
                              <code>{ `${e.employeeCode} - ${e.fullNameEnglish}` }</code>
                            </td>
                            <td>
                              {folder ? (
                                <span className="badge badge-success">✓ Linked in Drive</span>
                              ) : (
                                <span className="badge badge-warning">Not Created</span>
                              )}
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              {folder ? (
                                <a
                                  href={folder.webViewLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="btn btn-secondary btn-sm"
                                  style={{ textDecoration: 'none' }}
                                >
                                  Open Folder ↗
                                </a>
                              ) : (
                                <button
                                  className="btn btn-outline btn-sm"
                                  disabled={creatingEmpFolderCode === e.employeeCode || bulkCreatingFolders}
                                  onClick={() => handleCreateSingleEmpFolder(e)}
                                >
                                  {creatingEmpFolderCode === e.employeeCode ? 'Creating...' : '+ Auto Create'}
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          TAB 1: EMPLOYEE BULK UPLOAD & QUICK MULTI-ROW ADD
         ===================================================================== */}
      {activeTab === 'bulk_employees' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Section A: Excel / CSV Bulk Upload */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--primary-color)', margin: 0 }}>
                  Bulk Employee Upload (Excel / CSV)
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 4, marginBottom: 0 }}>
                  Download the template, fill in employee records (or export existing employees, modify, and re-upload), then preview before saving.
                </p>
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button className="btn btn-outline btn-sm" onClick={() => downloadTemplateExcel('employees')}>
                  ⬇ Download Excel Template
                </button>
                <button className="btn btn-secondary btn-sm" onClick={handleExportCurrentEmployees}>
                  📤 Export Existing Employees ({employees.length})
                </button>
              </div>
            </div>

            {/* Upload Controls */}
            <div style={{
              border: '2px dashed var(--border-color)',
              borderRadius: 'var(--border-radius-sm)',
              padding: '24px',
              background: 'var(--bg-input)',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 16
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                  Select Excel (`.xlsx`, `.xls`) or CSV (`.csv`) File
                </label>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  Matched by <strong>Employee Code</strong> (e.g. `ATCL-0501`). Leave Employee Code blank to auto-assign the next sequential code.
                </span>
                <input
                  ref={empFileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleEmpFileSelect}
                  style={{ marginTop: 6, maxWidth: 380 }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 260 }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)' }}>IMPORT CONFLICT MODE</label>
                <select value={empUploadMode} onChange={(e) => setEmpUploadMode(e.target.value)}>
                  <option value="upsert">Upsert: Update Existing + Add New (Recommended)</option>
                  <option value="add_only">Add New Only (Skip Existing Employee Codes)</option>
                </select>
              </div>
            </div>

            {/* Preview & Validation Table */}
            {parsedEmpRows.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <strong style={{ fontSize: '0.9rem' }}>
                      Previewing {parsedEmpRows.length} Row(s) from <span style={{ color: 'var(--primary-color)' }}>{empFileName}</span>
                    </strong>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginLeft: 12 }}>
                      New: <strong>{parsedEmpRows.filter(r => !r._isExisting).length}</strong> &nbsp;|&nbsp;
                      Existing Update: <strong>{parsedEmpRows.filter(r => r._isExisting).length}</strong>
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button className="btn btn-outline btn-sm" onClick={() => { setParsedEmpRows([]); setEmpFileName(''); }}>
                      Clear Preview
                    </button>
                    <button className="btn btn-primary btn-sm" onClick={handleCommitEmpUpload}>
                      ✓ Commit Import ({parsedEmpRows.length} Employees)
                    </button>
                  </div>
                </div>

                <div className="table-container" style={{ maxHeight: 380, overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: 8 }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Action</th>
                        <th>Employee Code</th>
                        <th>Full Name (English) *</th>
                        <th>Designation</th>
                        <th>Department</th>
                        <th>Gross Salary (৳)</th>
                        <th>Mobile</th>
                        <th>Official Email</th>
                        <th>Bank A/C No</th>
                        <th>TIN</th>
                        <th>Remove</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedEmpRows.map((row, idx) => (
                        <tr key={row._rowId}>
                          <td>
                            <span className={`badge ${row._isExisting ? 'badge-warning' : 'badge-success'}`}>
                              {row._isExisting ? (empUploadMode === 'add_only' ? 'Skip' : 'Update') : 'New'}
                            </span>
                          </td>
                          <td>
                            <input
                              type="text"
                              value={row.employeeCode}
                              placeholder="Auto"
                              onChange={e => handlePreviewRowChange(idx, 'employeeCode', e.target.value)}
                              style={{ width: 105, padding: '4px 6px', fontSize: '0.78rem' }}
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              value={row.fullNameEnglish}
                              onChange={e => handlePreviewRowChange(idx, 'fullNameEnglish', e.target.value)}
                              style={{ width: 170, padding: '4px 6px', fontSize: '0.78rem', borderColor: !row.fullNameEnglish ? '#ef4444' : undefined }}
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              value={row.designation}
                              onChange={e => handlePreviewRowChange(idx, 'designation', e.target.value)}
                              style={{ width: 140, padding: '4px 6px', fontSize: '0.78rem' }}
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              value={row.department}
                              onChange={e => handlePreviewRowChange(idx, 'department', e.target.value)}
                              style={{ width: 160, padding: '4px 6px', fontSize: '0.78rem' }}
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              value={row.grossSalary}
                              onChange={e => handlePreviewRowChange(idx, 'grossSalary', Number(e.target.value))}
                              style={{ width: 100, padding: '4px 6px', fontSize: '0.78rem' }}
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              value={row.mobileNumber}
                              onChange={e => handlePreviewRowChange(idx, 'mobileNumber', e.target.value)}
                              style={{ width: 125, padding: '4px 6px', fontSize: '0.78rem' }}
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              value={row.emailAddress}
                              onChange={e => handlePreviewRowChange(idx, 'emailAddress', e.target.value)}
                              style={{ width: 160, padding: '4px 6px', fontSize: '0.78rem' }}
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              value={row.bankAccountNo}
                              onChange={e => handlePreviewRowChange(idx, 'bankAccountNo', e.target.value)}
                              style={{ width: 130, padding: '4px 6px', fontSize: '0.78rem' }}
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              value={row.tin}
                              onChange={e => handlePreviewRowChange(idx, 'tin', e.target.value)}
                              style={{ width: 115, padding: '4px 6px', fontSize: '0.78rem' }}
                            />
                          </td>
                          <td>
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => setParsedEmpRows(prev => prev.filter((_, i) => i !== idx))}
                            >
                              &times;
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Section B: Interactive Multi-Row Quick Entry Grid */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--primary-color)', margin: 0 }}>
                  Quick Multi-Row Employee Entry Grid
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 4, marginBottom: 0 }}>
                  Rapidly type and onboard one or multiple employees directly in the browser without uploading a spreadsheet.
                </p>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => setQuickRows(prev => [...prev, createEmptyQuickRow()])}
                >
                  + Add Row
                </button>
                <button className="btn btn-primary btn-sm" onClick={handleSaveQuickRows}>
                  💾 Save All Filled Rows
                </button>
              </div>
            </div>

            <div className="table-container" style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>Code (Optional)</th>
                    <th>Full Name (English) *</th>
                    <th>Full Name (Bangla)</th>
                    <th>Department *</th>
                    <th>Designation *</th>
                    <th>Gross Salary (৳)</th>
                    <th>Joining Date</th>
                    <th>Mobile Number</th>
                    <th>Official Email</th>
                    <th>NID</th>
                    <th>Bank A/C No</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {quickRows.map((row, idx) => (
                    <tr key={idx}>
                      <td>
                        <input
                          type="text"
                          placeholder="Auto"
                          value={row.employeeCode}
                          onChange={e => handleQuickRowChange(idx, 'employeeCode', e.target.value)}
                          style={{ width: 95, padding: '5px 8px', fontSize: '0.8rem' }}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          placeholder="e.g. Engr. Tanvir"
                          value={row.fullNameEnglish}
                          onChange={e => handleQuickRowChange(idx, 'fullNameEnglish', e.target.value)}
                          style={{ width: 165, padding: '5px 8px', fontSize: '0.8rem' }}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          placeholder="বাংলা নাম"
                          value={row.fullNameBangla}
                          onChange={e => handleQuickRowChange(idx, 'fullNameBangla', e.target.value)}
                          style={{ width: 140, padding: '5px 8px', fontSize: '0.8rem' }}
                        />
                      </td>
                      <td>
                        <select
                          value={row.department}
                          onChange={e => handleQuickRowChange(idx, 'department', e.target.value)}
                          style={{ width: 175, padding: '5px 8px', fontSize: '0.8rem' }}
                        >
                          {(hrSettings?.departments || DEFAULT_HR_SETTINGS.departments).map(d => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <input
                          type="text"
                          list="atcl-designations-list"
                          placeholder="Designation"
                          value={row.designation}
                          onChange={e => handleQuickRowChange(idx, 'designation', e.target.value)}
                          style={{ width: 145, padding: '5px 8px', fontSize: '0.8rem' }}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          value={row.grossSalary}
                          onChange={e => handleQuickRowChange(idx, 'grossSalary', Number(e.target.value))}
                          style={{ width: 105, padding: '5px 8px', fontSize: '0.8rem' }}
                        />
                      </td>
                      <td>
                        <input
                          type="date"
                          value={row.joiningDate}
                          onChange={e => handleQuickRowChange(idx, 'joiningDate', e.target.value)}
                          style={{ width: 130, padding: '5px 8px', fontSize: '0.8rem' }}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          placeholder="+8801..."
                          value={row.mobileNumber}
                          onChange={e => handleQuickRowChange(idx, 'mobileNumber', e.target.value)}
                          style={{ width: 125, padding: '5px 8px', fontSize: '0.8rem' }}
                        />
                      </td>
                      <td>
                        <input
                          type="email"
                          placeholder="name@atcl-bd.com"
                          value={row.emailAddress}
                          onChange={e => handleQuickRowChange(idx, 'emailAddress', e.target.value)}
                          style={{ width: 155, padding: '5px 8px', fontSize: '0.8rem' }}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          placeholder="NID No"
                          value={row.nid}
                          onChange={e => handleQuickRowChange(idx, 'nid', e.target.value)}
                          style={{ width: 115, padding: '5px 8px', fontSize: '0.8rem' }}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          placeholder="Account No"
                          value={row.bankAccountNo}
                          onChange={e => handleQuickRowChange(idx, 'bankAccountNo', e.target.value)}
                          style={{ width: 125, padding: '5px 8px', fontSize: '0.8rem' }}
                        />
                      </td>
                      <td>
                        {quickRows.length > 1 && (
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => setQuickRows(prev => prev.filter((_, i) => i !== idx))}
                          >
                            &times;
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <datalist id="atcl-designations-list">
                {(hrSettings?.designations || DEFAULT_HR_SETTINGS.designations).map(d => (
                  <option key={d} value={d} />
                ))}
              </datalist>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 2: BULK OPERATIONAL DATA IMPORT (ATTENDANCE, SALARY & TAX)
         ===================================================================== */}
      {activeTab === 'bulk_operations' && (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--primary-color)', margin: 0 }}>
                Bulk Operational Data Upload (Attendance Logs, Salaries, Bank & Tax Profiles)
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 4, marginBottom: 0 }}>
                Import biometric attendance logs or batch-update employee compensation, bank account numbers, TINs, and annual tax investment declarations.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button className="btn btn-outline btn-sm" onClick={() => downloadTemplateExcel('attendance')}>
                ⬇ Attendance Template
              </button>
              <button className="btn btn-outline btn-sm" onClick={() => downloadTemplateExcel('salary_tax')}>
                ⬇ Salary & Tax Template
              </button>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>1. Choose Data Category to Import</label>
              <select
                value={opsImportType}
                onChange={e => { setOpsImportType(e.target.value); setParsedOpsRows([]); setOpsFileName(''); }}
              >
                <option value="attendance">Biometric / Daily Attendance Logs (Employee Code, Date, Check In, Check Out)</option>
                <option value="salary_tax">Salary Structure, Bank Accounts & NBR Tax Investment Declarations</option>
              </select>
            </div>

            <div className="form-group">
              <label>2. Upload Spreadsheet (`.xlsx`, `.xls`, `.csv`)</label>
              <input
                ref={opsFileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleOpsFileSelect}
              />
            </div>
          </div>

          {parsedOpsRows.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong>
                  Previewing {parsedOpsRows.length} row(s) from <span style={{ color: 'var(--primary-color)' }}>{opsFileName}</span>
                </strong>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-outline btn-sm" onClick={() => setParsedOpsRows([])}>Cancel</button>
                  <button className="btn btn-primary btn-sm" onClick={handleCommitOpsUpload}>
                    ✓ Commit {opsImportType === 'attendance' ? 'Attendance Logs' : 'Salary & Tax Updates'}
                  </button>
                </div>
              </div>

              <div className="table-container" style={{ maxHeight: 340, overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: 8 }}>
                <table>
                  <thead>
                    <tr>
                      {Object.keys(parsedOpsRows[0] || {}).map(h => (
                        <th key={h}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {parsedOpsRows.slice(0, 100).map((r, i) => (
                      <tr key={i}>
                        {Object.keys(parsedOpsRows[0] || {}).map(h => (
                          <td key={h}>{String(r[h] ?? '')}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          TAB 3: MASTER DATA & HR POLICIES
         ===================================================================== */}
      {activeTab === 'master_data' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Departments & Designations */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 24 }}>
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <h4 style={{ color: 'var(--primary-color)', margin: 0 }}>Departments Master List ({hrSettings?.departments?.length || 0})</h4>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  placeholder="New Department Name..."
                  value={newDepartment}
                  onChange={e => setNewDepartment(e.target.value)}
                  style={{ flex: 1 }}
                />
                <button className="btn btn-primary btn-sm" onClick={handleAddDepartment}>+ Add</button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, maxHeight: 220, overflowY: 'auto' }}>
                {(hrSettings?.departments || []).map(dept => (
                  <span
                    key={dept}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '5px 10px',
                      borderRadius: 6,
                      fontSize: '0.8rem',
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-color)'
                    }}
                  >
                    {dept}
                    <button
                      onClick={() => handleRemoveDepartment(dept)}
                      style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 700 }}
                      title="Remove Department"
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <h4 style={{ color: 'var(--primary-color)', margin: 0 }}>Designations Master List ({hrSettings?.designations?.length || 0})</h4>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  placeholder="New Designation Title..."
                  value={newDesignation}
                  onChange={e => setNewDesignation(e.target.value)}
                  style={{ flex: 1 }}
                />
                <button className="btn btn-primary btn-sm" onClick={handleAddDesignation}>+ Add</button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, maxHeight: 220, overflowY: 'auto' }}>
                {(hrSettings?.designations || []).map(desig => (
                  <span
                    key={desig}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '5px 10px',
                      borderRadius: 6,
                      fontSize: '0.8rem',
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-color)'
                    }}
                  >
                    {desig}
                    <button
                      onClick={() => handleRemoveDesignation(desig)}
                      style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 700 }}
                      title="Remove Designation"
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Default Leave Quotas & Salary Breakdown Ratios */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <h4 style={{ color: 'var(--primary-color)', margin: 0 }}>Default Leave Quotas, Salary Breakdown Ratios & Shift Rules</h4>
              <button className="btn btn-primary btn-sm" onClick={handleSaveQuotasAndRatios}>
                💾 Save Policy Configuration
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
              <div>
                <h5 style={{ marginBottom: 10, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>ANNUAL LEAVE QUOTAS (DAYS PER YEAR)</h5>
                <div className="form-row">
                  <div className="form-group">
                    <label>Casual Leave</label>
                    <input type="number" value={quotasForm.casual} onChange={e => setQuotasForm(p => ({ ...p, casual: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label>Sick Leave</label>
                    <input type="number" value={quotasForm.sick} onChange={e => setQuotasForm(p => ({ ...p, sick: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label>Annual / Earned</label>
                    <input type="number" value={quotasForm.annual} onChange={e => setQuotasForm(p => ({ ...p, annual: e.target.value }))} />
                  </div>
                </div>
                <div className="form-row" style={{ marginTop: 10 }}>
                  <div className="form-group">
                    <label>Maternity Leave</label>
                    <input type="number" value={quotasForm.maternity} onChange={e => setQuotasForm(p => ({ ...p, maternity: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label>Paternity Leave</label>
                    <input type="number" value={quotasForm.paternity} onChange={e => setQuotasForm(p => ({ ...p, paternity: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label>Special / LWP</label>
                    <input type="number" value={quotasForm.special} onChange={e => setQuotasForm(p => ({ ...p, special: e.target.value }))} />
                  </div>
                </div>
              </div>

              <div>
                <h5 style={{ marginBottom: 10, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>GROSS SALARY BREAKDOWN RATIOS (TOTAL = 100%)</h5>
                <div className="form-row">
                  <div className="form-group">
                    <label>Basic (%)</label>
                    <input type="number" value={ratiosForm.basic} onChange={e => setRatiosForm(p => ({ ...p, basic: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label>House Rent (%)</label>
                    <input type="number" value={ratiosForm.houseRent} onChange={e => setRatiosForm(p => ({ ...p, houseRent: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label>Medical (%)</label>
                    <input type="number" value={ratiosForm.medical} onChange={e => setRatiosForm(p => ({ ...p, medical: e.target.value }))} />
                  </div>
                </div>
                <div className="form-row" style={{ marginTop: 10 }}>
                  <div className="form-group">
                    <label>Conveyance (%)</label>
                    <input type="number" value={ratiosForm.conveyance} onChange={e => setRatiosForm(p => ({ ...p, conveyance: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label>Mobile Allowance (%)</label>
                    <input type="number" value={ratiosForm.mobile} onChange={e => setRatiosForm(p => ({ ...p, mobile: e.target.value }))} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Public & Festival Holidays */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <h4 style={{ color: 'var(--primary-color)', margin: 0 }}>Official Holiday Calendar ({hrSettings?.holidays?.length || 0})</h4>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <button className="btn btn-outline btn-sm" onClick={() => downloadTemplateExcel('holidays')}>
                  ⬇ Holiday Excel Template
                </button>
                <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer', margin: 0 }}>
                  📂 Bulk Upload Holidays
                  <input type="file" accept=".xlsx,.xls,.csv" onChange={handleHolidayExcelUpload} style={{ display: 'none' }} />
                </label>
              </div>
            </div>

            <div className="form-row" style={{ alignItems: 'flex-end' }}>
              <div className="form-group">
                <label>Holiday Date</label>
                <input type="date" value={newHoliday.date} onChange={e => setNewHoliday(p => ({ ...p, date: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Holiday Title</label>
                <input type="text" placeholder="e.g. Eid-ul-Fitr" value={newHoliday.name} onChange={e => setNewHoliday(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Category</label>
                <select value={newHoliday.type} onChange={e => setNewHoliday(p => ({ ...p, type: e.target.value }))}>
                  <option value="National Holiday">National Holiday</option>
                  <option value="Festival Holiday">Festival Holiday</option>
                  <option value="Company Holiday">Company Holiday</option>
                </select>
              </div>
              <div className="form-group">
                <label>Days</label>
                <input type="number" min="1" value={newHoliday.days} onChange={e => setNewHoliday(p => ({ ...p, days: e.target.value }))} />
              </div>
              <button className="btn btn-primary" onClick={handleAddHoliday} style={{ height: 38 }}>
                + Add Holiday
              </button>
            </div>

            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Holiday Name</th>
                    <th>Type</th>
                    <th>Duration (Days)</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {(hrSettings?.holidays || []).map(h => (
                    <tr key={h.id}>
                      <td style={{ fontWeight: 700 }}>{h.date}</td>
                      <td>{h.name}</td>
                      <td><span className="badge badge-success">{h.type}</span></td>
                      <td>{h.days || 1}</td>
                      <td style={{ textAlign: 'right' }}>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDeleteHoliday(h.id)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 4: USER CREDENTIALS & ACCESS CONTROL
         ===================================================================== */}
      {activeTab === 'credentials' && (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--primary-color)', margin: 0 }}>
                Employee Self-Service (ESS) Login Credentials & OTP Management
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 4, marginBottom: 0 }}>
                View, search, reset passwords/OTPs, or auto-generate missing login credentials for newly added employees.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  const count = syncMissingUserCredentials();
                  showNotice('success', count > 0 ? `Generated ${count} missing employee credential account(s).` : 'All employees already have active login credentials.');
                }}
              >
                🔄 Sync Missing Credentials
              </button>
              <button className="btn btn-outline btn-sm" onClick={handleExportCredentials}>
                📤 Export Credentials to Excel
              </button>
            </div>
          </div>

          <input
            type="text"
            placeholder="Search by employee code, name, username, or email..."
            value={credSearch}
            onChange={e => setCredSearch(e.target.value)}
            style={{ maxWidth: 420 }}
          />

          <div className="table-container" style={{ maxHeight: 480, overflowY: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Employee Code</th>
                  <th>Employee Name</th>
                  <th>Username / Login ID</th>
                  <th>Email Address</th>
                  <th>Password / OTP</th>
                  <th>Force Password Change</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCreds.map(cred => {
                  const isEditingThis = editingCredCode === cred.employeeCode;
                  return (
                    <tr key={cred.employeeCode}>
                      <td style={{ fontWeight: 700, color: 'var(--primary-color)' }}>{cred.employeeCode}</td>
                      <td style={{ fontWeight: 600 }}>{cred.fullName}</td>
                      <td>
                        {isEditingThis ? (
                          <input
                            type="text"
                            value={credEditForm.username}
                            onChange={e => setCredEditForm(p => ({ ...p, username: e.target.value }))}
                            style={{ width: 120, padding: '4px 6px' }}
                          />
                        ) : (
                          <code>{cred.username}</code>
                        )}
                      </td>
                      <td>
                        {isEditingThis ? (
                          <input
                            type="text"
                            value={credEditForm.email}
                            onChange={e => setCredEditForm(p => ({ ...p, email: e.target.value }))}
                            style={{ width: 180, padding: '4px 6px' }}
                          />
                        ) : (
                          cred.email
                        )}
                      </td>
                      <td>
                        {isEditingThis ? (
                          <input
                            type="text"
                            value={credEditForm.password}
                            onChange={e => setCredEditForm(p => ({ ...p, password: e.target.value }))}
                            style={{ width: 100, padding: '4px 6px' }}
                          />
                        ) : (
                          <code>{cred.password}</code>
                        )}
                      </td>
                      <td>
                        {isEditingThis ? (
                          <input
                            type="checkbox"
                            checked={credEditForm.mustChangePassword}
                            onChange={e => setCredEditForm(p => ({ ...p, mustChangePassword: e.target.checked }))}
                          />
                        ) : (
                          <span className={`badge ${cred.mustChangePassword ? 'badge-warning' : 'badge-success'}`}>
                            {cred.mustChangePassword ? 'Required (OTP)' : 'Changed'}
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {isEditingThis ? (
                          <div style={{ display: 'inline-flex', gap: 6 }}>
                            <button className="btn btn-primary btn-sm" onClick={() => handleSaveCredEdit(cred.employeeCode)}>Save</button>
                            <button className="btn btn-outline btn-sm" onClick={() => setEditingCredCode(null)}>Cancel</button>
                          </div>
                        ) : (
                          <div style={{ display: 'inline-flex', gap: 6 }}>
                            <button className="btn btn-outline btn-sm" onClick={() => handleStartEditCred(cred)}>Edit</button>
                            <button className="btn btn-secondary btn-sm" onClick={() => handleResetSinglePassword(cred.employeeCode)}>Reset OTP</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 5: SYSTEM BACKUP, RESTORE & FACTORY SEED MANAGEMENT
         ===================================================================== */}
      {activeTab === 'backup' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 24 }}>
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <h4 style={{ color: 'var(--primary-color)', margin: 0 }}>Full System Snapshot Backup</h4>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0 }}>
              Download a complete JSON backup containing all {employees.length} employees, {attendanceLogs.length} attendance logs, {leaveRequests.length} leave requests, {payrollRuns.length} payroll runs, tax declarations, company profile, and master settings.
            </p>
            <button className="btn btn-primary" onClick={exportFullSystemBackup} style={{ alignSelf: 'flex-start', marginTop: 'auto' }}>
              ⬇ Download Full System Backup (.json)
            </button>
          </div>

          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <h4 style={{ color: 'var(--primary-color)', margin: 0 }}>Restore from Backup File</h4>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0 }}>
              Upload a previously exported ATCL HRMS `.json` backup file to immediately restore all employees, settings, and historical records.
            </p>
            <input
              ref={restoreFileInputRef}
              type="file"
              accept=".json"
              onChange={handleRestoreBackupFile}
              style={{ marginTop: 'auto' }}
            />
          </div>

          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14, border: '1px solid rgba(239, 68, 68, 0.3)' }}>
            <h4 style={{ color: '#ef4444', margin: 0 }}>Reset to Factory Seed Data</h4>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0 }}>
              Reload the default 77 ATCL seeded employees, company profile, and initial credentials. Use with caution as unsaved custom additions will be replaced.
            </p>
            <button
              className="btn btn-danger"
              onClick={() => {
                if (window.confirm('Are you sure you want to reset all HR data back to the initial factory seeds?')) {
                  resetToFactorySeeds();
                  showNotice('success', 'System data has been reset to factory seed defaults.');
                }
              }}
              style={{ alignSelf: 'flex-start', marginTop: 'auto' }}
            >
              ⚠ Reset to Default Seeds
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

