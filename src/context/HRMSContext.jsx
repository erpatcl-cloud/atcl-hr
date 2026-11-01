import React, { createContext, useState, useEffect } from 'react';
import { calculateBangladeshTax, REGIONS, TAX_YEARS } from '../utils/taxCalculator';
import { SEED_EMPLOYEES } from './employeesSeed';
import { SEED_COMPANY_INFO, SEED_AUDIT_LOGS } from './companySeed';
import { 
  saveToFirestore, 
  loginWithEmail, 
  loginWithGoogle,
  logoutUser, 
  resetUserPassword, 
  subscribeToAuthChanges,
  updateUserPassword,
  initUserCredentials,
  BACKEND_URL
} from '../utils/firebase';
import { USER_SEEDS } from '../utils/userSeeds';
import { SEED_DOCUMENT_TEMPLATES } from '../data/templateSeeds';
import {
  ensureAutoConnectedWorkspace,
  initGoogleWorkspaceOAuth,
  getWorkspaceConfig
} from '../utils/googleWorkspaceService';

export const HRMSContext = createContext();

export const DEFAULT_HR_SETTINGS = {
  departments: [
    'Management',
    'Sales & Service',
    'Engineering Education Equipment',
    'Industrial Solutions',
    'Research Laboratory Equipment',
    'Surveying Instruments & Technology Solutions',
    'Finance & Accounts',
    'Human Resources',
    'Administration',
    'Support & Logistics'
  ],
  designations: [
    'Adviser',
    'Managing Director',
    'General Manager',
    'HR Director',
    'Chief Financial Officer',
    'Project Manager',
    'Senior Service Engineer',
    'Service Engineer',
    'Junior Engineer',
    'Sales Engineer',
    'GIS Specialist',
    'Survey Engineer',
    'Senior Lab Consultant',
    'Lab Engineer',
    'Product Specialist',
    'Technical Executive',
    'Accounts Manager',
    'Senior Accounts Executive',
    'Accounts Assistant',
    'HR Manager',
    'Senior HR Officer',
    'Admin Officer',
    'Office Assistant',
    'Driver'
  ],
  shifts: [
    { id: 'shift-general', name: 'General Office Shift', start: '09:00', end: '17:00', grace: 15 },
    { id: 'shift-tech', name: 'Technical Service Shift', start: '08:30', end: '16:30', grace: 15 },
    { id: 'shift-support', name: 'Support Shift', start: '10:00', end: '18:00', grace: 15 },
    { id: 'shift-night', name: 'Night Shift', start: '22:00', end: '06:00', grace: 15 }
  ],
  defaultLeaveQuotas: {
    casual: 10,
    sick: 14,
    annual: 18,
    maternity: 120,
    paternity: 7,
    special: 5
  },
  salaryRatios: {
    basic: 50,
    houseRent: 25,
    medical: 10,
    conveyance: 10,
    mobile: 5
  },
  holidays: [
    { id: 'hol-1', date: '2026-02-21', name: 'International Mother Language Day', type: 'National Holiday', days: 1 },
    { id: 'hol-2', date: '2026-03-26', name: 'Independence & National Day', type: 'National Holiday', days: 1 },
    { id: 'hol-3', date: '2026-04-14', name: 'Pahela Baishakh (Bangla New Year)', type: 'Festival Holiday', days: 1 },
    { id: 'hol-4', date: '2026-05-01', name: 'May Day (International Workers Day)', type: 'National Holiday', days: 1 },
    { id: 'hol-5', date: '2026-12-16', name: 'Victory Day of Bangladesh', type: 'National Holiday', days: 1 }
  ]
};

const DEPARTMENTS = [
  'Engineering Education Equipment',
  'Industrial Solutions',
  'Research Laboratory Equipment',
  'Surveying Instruments & Technology Solutions',
  'Finance & Accounts',
  'Human Resources',
  'Administration'
];

const DESIGNATIONS = {
  'Engineering Education Equipment': ['Senior Service Engineer', 'Service Engineer', 'Product Specialist', 'Technical Executive'],
  'Industrial Solutions': ['Project Manager', 'Automation Engineer', 'Commissioning Specialist', 'Junior Engineer'],
  'Research Laboratory Equipment': ['Senior Lab Consultant', 'Lab Engineer', 'Scientific Officer', 'Product Engineer'],
  'Surveying Instruments & Technology Solutions': ['GIS Specialist', 'Survey Engineer', 'Sales Engineer', 'Technical Support'],
  'Finance & Accounts': ['Chief Financial Officer', 'Accounts Manager', 'Senior Accounts Executive', 'Accounts Assistant'],
  'Human Resources': ['HR Director', 'HR Manager', 'Senior HR Officer', 'HR Assistant'],
  'Administration': ['General Manager', 'Admin Officer', 'Office Assistant', 'Driver']
};

function generateMockEmployees() {
  return SEED_EMPLOYEES.map(emp => {
    // Generate salary components from gross salary
    const basic = Math.round(emp.grossSalary * 0.50);
    const houseRent = Math.round(emp.grossSalary * 0.25);
    const medical = Math.round(emp.grossSalary * 0.10);
    const conveyance = Math.round(emp.grossSalary * 0.10);
    const mobile = Math.round(emp.grossSalary * 0.05);

    return {
      ...emp,
      leaveBalances: {
        casual: 10,
        sick: 14,
        annual: emp.id % 3 === 0 ? 5 : 18,
        maternity: emp.gender === 'female' ? 120 : 0,
        paternity: emp.gender === 'male' ? 7 : 0,
        special: 5
      },
      salaryComponents: {
        basicSalary: basic,
        houseRent,
        medicalAllowance: medical,
        conveyanceAllowance: conveyance,
        mobileAllowance: mobile,
        otherAllowances: 0
      },
      emergencyContact: {
        name: `Relative of ${emp.fullNameEnglish}`,
        relation: 'Spouse',
        contact: '+8801819-000000'
      },
      familyInfo: [],
      education: emp.educationalQualification ? [
        { degree: emp.educationalQualification, institute: 'Accredited University', passingYear: 'Completed', result: 'Passed' }
      ] : [],
      certifications: [],
      previousHistory: [],
      documents: [
        { name: 'CV_Resume.pdf', type: 'CV/Resume', size: '1.2 MB', uploadDate: emp.joiningDate, mock: true },
        { name: 'NID_Copy.jpg', type: 'NID Copy', size: '850 KB', uploadDate: emp.joiningDate, mock: true }
      ]
    };
  });
}

function generateMockAttendance(employees) {
  const logs = [];
  const today = new Date();
  
  // Seed past 5 days of attendance logs
  for (let d = 5; d >= 0; d--) {
    const logDate = new Date(today);
    logDate.setDate(today.getDate() - d);
    
    // Skip Fridays (standard weekend in BD)
    if (logDate.getDay() === 5) continue; 
    
    const dateStr = logDate.toISOString().split('T')[0];
    
    employees.forEach(emp => {
      if (emp.status === 'Inactive') return;
      
      // 90% attendance rate
      const hash = (emp.id * 13 + d * 7) % 100;
      if (hash > 90) return; // absent
      
      // Late check-in chance (after 9:15 AM is late, standard is 9:00 AM)
      let checkInHour = 8;
      let checkInMin = 45 + (hash % 40); // 8:45 to 9:25
      
      const checkInTime = `${checkInHour.toString().padStart(2, '0')}:${checkInMin.toString().padStart(2, '0')}:00`;
      const checkOutTime = `17:${(15 + (hash % 30)).toString().padStart(2, '0')}:00`;
      
      const isLate = checkInHour > 9 || (checkInHour === 9 && checkInMin > 15);
      const isEarlyLeave = false; // standard is 5:00 PM (17:00)
      
      // Overtime calculation: if worked past 17:00 (5:00 PM) by more than 30 mins
      let overtimeHours = 0;
      if (hash % 4 === 0) {
        overtimeHours = 1 + (hash % 3);
      }
      
      logs.push({
        id: `${emp.employeeCode}_${dateStr}`,
        employeeCode: emp.employeeCode,
        name: emp.fullNameEnglish,
        department: emp.department,
        designation: emp.designation,
        date: dateStr,
        checkIn: checkInTime,
        checkOut: checkOutTime,
        isLate,
        isEarlyLeave,
        overtimeHours,
        status: 'Present',
        gpsLocation: {
          lat: 23.7937 + (hash % 100) * 0.0001,
          lng: 90.4066 + (hash % 100) * 0.0001,
          device: 'Mobile (GPS Approved)'
        },
        biometricVerified: true
      });
    });
  }
  
  return logs;
}

function generateMockLeaveRequests(employees) {
  const requests = [];
  const today = new Date();
  
  employees.slice(0, 10).forEach((emp, index) => {
    const fromDate = new Date(today);
    fromDate.setDate(today.getDate() - (index + 2));
    const toDate = new Date(fromDate);
    toDate.setDate(fromDate.getDate() + 2);
    
    requests.push({
      id: `LR-${1000 + index}`,
      employeeCode: emp.employeeCode,
      name: emp.fullNameEnglish,
      department: emp.department,
      leaveType: index % 3 === 0 ? 'casual' : (index % 3 === 1 ? 'sick' : 'annual'),
      startDate: fromDate.toISOString().split('T')[0],
      endDate: toDate.toISOString().split('T')[0],
      days: 3,
      reason: 'Personal family matters and urgent work.',
      status: index % 4 === 0 ? 'Pending' : (index % 4 === 1 ? 'Approved' : 'Rejected'),
      appliedDate: new Date(fromDate.getTime() - 86400000 * 2).toISOString().split('T')[0],
      approvedBy: index % 4 !== 0 ? 'HR Manager' : '',
      attachmentName: index % 2 === 0 ? 'medical_prescription.pdf' : ''
    });
  });
  
  return requests;
}

export const HRMSProvider = ({ children }) => {
  const [employees, setEmployees] = useState(() => {
    const saved = localStorage.getItem('atcl_employees_v7');
    return saved ? JSON.parse(saved) : generateMockEmployees();
  });

  const [attendanceLogs, setAttendanceLogs] = useState(() => {
    const saved = localStorage.getItem('atcl_attendance');
    return saved ? JSON.parse(saved) : generateMockAttendance(generateMockEmployees());
  });

  const [leaveRequests, setLeaveRequests] = useState(() => {
    const saved = localStorage.getItem('atcl_leave_requests');
    return saved ? JSON.parse(saved) : generateMockLeaveRequests(generateMockEmployees());
  });

  const [payrollRuns, setPayrollRuns] = useState(() => {
    const saved = localStorage.getItem('atcl_payroll_runs');
    return saved ? JSON.parse(saved) : [];
  });

  const [revisions, setRevisions] = useState(() => {
    const saved = localStorage.getItem('atcl_revisions');
    return saved ? JSON.parse(saved) : [];
  });

  const [investmentDeclarations, setInvestmentDeclarations] = useState(() => {
    const saved = localStorage.getItem('atcl_investments_v8');
    if (saved) return JSON.parse(saved);
    
    // Seed investment declarations for first 20 employees under AY 2026-2027, 2027-2028
    const seeds = {};
    employees.slice(0, 20).forEach(emp => {
      seeds[emp.employeeCode] = {
        tin: emp.tin,
        taxZone: emp.taxZone,
        taxCircle: emp.taxCircle,
        region: REGIONS.DHAKA_CHITTAGONG,
        taxYear: TAX_YEARS['2025-2026'],
        taxpayerCategory: 'auto',
        isParentOfDisabled: false,
        dpsContribution: 60000,
        sanchaypatra: 100000,
        providentFund: 0, // PF is 0%
        stocks: 50000,
        lifeInsurance: 0,
        otherEligible: 20000
      };
    });
    return seeds;
  });

  const [movementLogs, setMovementLogs] = useState(() => {
    const saved = localStorage.getItem('atcl_movement_logs');
    return saved ? JSON.parse(saved) : [];
  });

  const [breakLogs, setBreakLogs] = useState(() => {
    const saved = localStorage.getItem('atcl_break_logs');
    return saved ? JSON.parse(saved) : [];
  });

  const [correctionLogs, setCorrectionLogs] = useState(() => {
    const saved = localStorage.getItem('atcl_corrections_v1');
    return saved ? JSON.parse(saved) : [];
  });

  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('atcl_theme');
    return saved || 'light';
  });

  const [loginMode, setLoginMode] = useState('admin');
  const [activeEmployeeCode, setActiveEmployeeCode] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [adminUser, setAdminUser] = useState(null); // stores real admin so it's never lost during impersonation
  const [authLoading, setAuthLoading] = useState(true);
  const [workspaceSession, setWorkspaceSession] = useState(() => ensureAutoConnectedWorkspace());

  // Automatically connect erpatcl@gmail.com to Google Workspace Cloud on software launch
  useEffect(() => {
    const connected = ensureAutoConnectedWorkspace();
    setWorkspaceSession(connected);
    const cfg = getWorkspaceConfig();
    initGoogleWorkspaceOAuth({
      clientId: cfg.clientId,
      onConnected: (liveSession) => {
        setWorkspaceSession(liveSession);
      }
    });
  }, []);

  // Subscribe to auth changes
  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges((firebaseUser) => {
      setAuthLoading(true);
      if (firebaseUser) {
        const email = firebaseUser.email?.trim().toLowerCase();
        // Check if admin
        if (email === "admin@atc.com.bd" || email === "admin.hr@atcl-bd.com" || email === "hmekram@gmail.com" || email === "atc@dhaka.net" || email === "erpatcl@gmail.com") {
          const adminUserObj = {
            name: "Admin HR Manager",
            email: email,
            role: "Administrator",
            avatar: ""
          };
          setCurrentUser(adminUserObj);
          setAdminUser(adminUserObj); // save permanently
          setLoginMode("admin");
          setActiveEmployeeCode("");
        } else {
          // Look up in employees list by code or email
          const code = firebaseUser.employeeCode;
          const emp = employees.find(e => e.employeeCode === code) || employees.find(e => e.emailAddress?.trim().toLowerCase() === email);
          if (emp) {
            setCurrentUser({
              name: emp.fullNameEnglish,
              email: emp.emailAddress,
              role: "Employee (ESS)",
              avatar: emp.photograph || "",
              mustChangePassword: firebaseUser.mustChangePassword,
              employeeCode: emp.employeeCode
            });
            setLoginMode("employee");
            setActiveEmployeeCode(emp.employeeCode);
          } else {
            setCurrentUser({
              name: firebaseUser.displayName || "Unknown User",
              email: email,
              role: "Guest",
              avatar: "",
              mustChangePassword: firebaseUser.mustChangePassword,
              employeeCode: firebaseUser.employeeCode || ""
            });
            setLoginMode("employee");
            setActiveEmployeeCode(firebaseUser.employeeCode || "");
          }
        }
      } else {
        setCurrentUser(null);
      }
      setAuthLoading(false);
    });
    return () => unsubscribe && unsubscribe();
  }, [employees]);

  const [companyInfo, setCompanyInfo] = useState(() => {
    const saved = localStorage.getItem('atcl_company_info_v1');
    return saved ? JSON.parse(saved) : SEED_COMPANY_INFO;
  });

  const [companyAuditLogs, setCompanyAuditLogs] = useState(() => {
    const saved = localStorage.getItem('atcl_company_logs_v1');
    return saved ? JSON.parse(saved) : SEED_AUDIT_LOGS;
  });

  const [hrSettings, setHrSettings] = useState(() => {
    const saved = localStorage.getItem('atcl_hr_settings_v1');
    if (saved) {
      try {
        return { ...DEFAULT_HR_SETTINGS, ...JSON.parse(saved) };
      } catch (e) {
        return DEFAULT_HR_SETTINGS;
      }
    }
    return DEFAULT_HR_SETTINGS;
  });

  const [userCredentials, setUserCredentials] = useState(() => {
    const saved = localStorage.getItem('atcl_user_creds');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.length > 0) return parsed;
      } catch (e) {}
    }
    const seeded = USER_SEEDS.map(seed => ({
      username: seed.id.trim().toLowerCase(),
      fullName: seed.name,
      email: seed.email.trim().toLowerCase(),
      employeeCode: seed.employeeCode,
      password: seed.otp || '123456',
      mustChangePassword: true
    }));
    localStorage.setItem('atcl_user_creds', JSON.stringify(seeded));
    return seeded;
  });

  const [documentTemplates, setDocumentTemplates] = useState(() => {
    const saved = localStorage.getItem('atcl_document_templates_v1');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Ensure any newly added system seed templates are also present
          const existingIds = new Set(parsed.map(t => t.id));
          const missingSeeds = SEED_DOCUMENT_TEMPLATES.filter(s => !existingIds.has(s.id));
          return [...parsed, ...missingSeeds];
        }
      } catch (e) {}
    }
    return SEED_DOCUMENT_TEMPLATES;
  });

  // Persists
  useEffect(() => {
    localStorage.setItem('atcl_document_templates_v1', JSON.stringify(documentTemplates));
  }, [documentTemplates]);
  useEffect(() => {
    localStorage.setItem('atcl_employees_v7', JSON.stringify(employees));
  }, [employees]);

  useEffect(() => {
    localStorage.setItem('atcl_attendance', JSON.stringify(attendanceLogs));
  }, [attendanceLogs]);

  useEffect(() => {
    localStorage.setItem('atcl_leave_requests', JSON.stringify(leaveRequests));
  }, [leaveRequests]);

  useEffect(() => {
    localStorage.setItem('atcl_payroll_runs', JSON.stringify(payrollRuns));
  }, [payrollRuns]);

  useEffect(() => {
    localStorage.setItem('atcl_revisions', JSON.stringify(revisions));
  }, [revisions]);

  useEffect(() => {
    localStorage.setItem('atcl_investments_v8', JSON.stringify(investmentDeclarations));
  }, [investmentDeclarations]);

  useEffect(() => {
    localStorage.setItem('atcl_login_mode', loginMode);
  }, [loginMode]);

  useEffect(() => {
    localStorage.setItem('atcl_active_emp_code', activeEmployeeCode);
  }, [activeEmployeeCode]);

  useEffect(() => {
    localStorage.setItem('atcl_company_info_v1', JSON.stringify(companyInfo));
  }, [companyInfo]);

  useEffect(() => {
    localStorage.setItem('atcl_company_logs_v1', JSON.stringify(companyAuditLogs));
  }, [companyAuditLogs]);

  useEffect(() => {
    localStorage.setItem('atcl_movement_logs', JSON.stringify(movementLogs));
  }, [movementLogs]);

  useEffect(() => {
    localStorage.setItem('atcl_break_logs', JSON.stringify(breakLogs));
  }, [breakLogs]);

  useEffect(() => {
    localStorage.setItem('atcl_corrections_v1', JSON.stringify(correctionLogs));
  }, [correctionLogs]);

  useEffect(() => {
    localStorage.setItem('atcl_hr_settings_v1', JSON.stringify(hrSettings));
  }, [hrSettings]);

  useEffect(() => {
    localStorage.setItem('atcl_user_creds', JSON.stringify(userCredentials));
  }, [userCredentials]);

  useEffect(() => {
    localStorage.setItem('atcl_theme', theme);
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  const [dbConnected, setDbConnected] = useState(false);

  // Sync to backend helper
  const syncToBackend = async (url, method, body) => {
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      return res.ok;
    } catch (e) {
      console.warn(`[MySQL Sync Failed] API call to ${url} failed:`, e.message);
      return false;
    }
  };

  // Sync state on load
  useEffect(() => {
    const checkStatusAndLoad = async () => {
      try {
        const statusRes = await fetch(`${BACKEND_URL}/db-status`);
        if (statusRes.ok) {
          const statusData = await statusRes.json();
          if (statusData.connected) {
            setDbConnected(true);
            console.log('[HRMSContext] Connected to MySQL backend successfully. Syncing data...');
            
            const [
              empRes, attRes, leaveRes, payrollRes, revRes, investRes, movRes, breakRes, corrRes, compRes, auditRes
            ] = await Promise.all([
              fetch(`${BACKEND_URL}/employees`),
              fetch(`${BACKEND_URL}/attendance`),
              fetch(`${BACKEND_URL}/leave-requests`),
              fetch(`${BACKEND_URL}/payroll-runs`),
              fetch(`${BACKEND_URL}/revisions`),
              fetch(`${BACKEND_URL}/investments`),
              fetch(`${BACKEND_URL}/movement-logs`),
              fetch(`${BACKEND_URL}/break-logs`),
              fetch(`${BACKEND_URL}/correction-logs`),
              fetch(`${BACKEND_URL}/company-info`),
              fetch(`${BACKEND_URL}/company-audit-logs`)
            ]);

            if (empRes.ok) setEmployees(await empRes.json());
            if (attRes.ok) setAttendanceLogs(await attRes.json());
            if (leaveRes.ok) setLeaveRequests(await leaveRes.json());
            if (payrollRes.ok) setPayrollRuns(await payrollRes.json());
            if (revRes.ok) setRevisions(await revRes.json());
            if (investRes.ok) setInvestmentDeclarations(await investRes.json());
            if (movRes.ok) setMovementLogs(await movRes.json());
            if (breakRes.ok) setBreakLogs(await breakRes.json());
            if (corrRes.ok) setCorrectionLogs(await corrRes.json());
            if (compRes.ok) setCompanyInfo(await compRes.json());
            if (auditRes.ok) setCompanyAuditLogs(await auditRes.json());
            
            return;
          }
        }
      } catch (err) {
        console.warn('[HRMSContext] MySQL backend server is offline. Running in offline/localStorage mode.', err);
      }
      setDbConnected(false);
    };

    checkStatusAndLoad();
    // Verify connection status every 30 seconds
    const interval = setInterval(checkStatusAndLoad, 30000);
    return () => clearInterval(interval);
  }, []);

  // --- Functions ---
  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const getDistanceInMeters = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Radius of the earth in m
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in meters
  };

  const calculateShiftMetrics = (checkInTimeStr, checkOutTimeStr, shift, dateStr, breakMinutes = 0) => {
    const formatTimeStr = (t) => {
      if (!t) return "00:00:00";
      const parts = t.split(':');
      if (parts.length === 2) return `${t}:00`;
      return t;
    };

    const formattedStart = formatTimeStr(shift.start);
    const formattedEnd = formatTimeStr(shift.end);
    const formattedCheckIn = formatTimeStr(checkInTimeStr);

    const [startH, startM] = formattedStart.split(':').map(Number);
    const [endH, endM] = formattedEnd.split(':').map(Number);
    const [inH, inM] = formattedCheckIn.split(':').map(Number);

    // 1. Scheduled Shift Start DateTime
    const shiftStartDateTime = new Date(`${dateStr}T${formattedStart}`);
    
    // 2. Scheduled Shift End DateTime
    let shiftEndDateTime = new Date(`${dateStr}T${formattedEnd}`);
    if (endH < startH || (endH === startH && endM < startM)) {
      shiftEndDateTime.setDate(shiftEndDateTime.getDate() + 1);
    }
    
    // 3. Actual Check-In DateTime
    let checkInDateTime = new Date(`${dateStr}T${formattedCheckIn}`);
    // If the shift starts late and check-in hour is early morning, it's calendar next day
    if (startH >= 12 && inH < 12) {
      checkInDateTime.setDate(checkInDateTime.getDate() + 1);
    }
    // If the shift starts early and check-in hour is late night before, it's calendar previous day
    else if (startH < 12 && inH >= 12) {
      checkInDateTime.setDate(checkInDateTime.getDate() - 1);
    }
    
    // 4. Calculate Late Minutes
    const graceThreshold = new Date(shiftStartDateTime.getTime() + (shift.grace || 0) * 60 * 1000);
    const isLate = checkInDateTime > graceThreshold;
    const lateMinutes = isLate ? Math.max(0, Math.floor((checkInDateTime - shiftStartDateTime) / (1000 * 60))) : 0;
    
    let earlyExitMinutes = 0;
    let overtimeMinutes = 0;
    let overtimeHours = 0;
    let totalWorkingMinutes = 0;
    let formattedCheckOutDateTime = null;
    
    // 5. If checkout time is provided, compute checkout metrics
    if (checkOutTimeStr) {
      const formattedCheckOut = formatTimeStr(checkOutTimeStr);
      let checkOutDateTime = new Date(`${dateStr}T${formattedCheckOut}`);
      // Adjust check-out date: it must be after check-in date
      if (checkOutDateTime < checkInDateTime) {
        checkOutDateTime.setDate(checkOutDateTime.getDate() + 1);
      }
      
      formattedCheckOutDateTime = checkOutDateTime;
      const diffMs = checkOutDateTime - checkInDateTime;
      const totalMinutes = Math.max(0, Math.floor(diffMs / (1000 * 60)));
      totalWorkingMinutes = Math.max(0, totalMinutes - breakMinutes);
      
      if (checkOutDateTime < shiftEndDateTime) {
        earlyExitMinutes = Math.max(0, Math.floor((shiftEndDateTime - checkOutDateTime) / (1000 * 60)));
      } else {
        overtimeMinutes = Math.max(0, Math.floor((checkOutDateTime - shiftEndDateTime) / (1000 * 60)));
        overtimeHours = Math.max(0, Math.floor(overtimeMinutes / 60));
      }
    }
    
    return {
      shiftStartDateTime,
      shiftEndDateTime,
      checkInDateTime,
      checkOutDateTime: formattedCheckOutDateTime,
      isLate,
      lateMinutes,
      earlyExitMinutes,
      overtimeMinutes,
      overtimeHours,
      totalWorkingMinutes
    };
  };

  const getEmployeeShift = (emp) => {
    if (!emp) return { name: 'General Office Shift', start: '09:00', end: '17:00', grace: 15 };
    const dept = emp.department || '';
    const desig = emp.designation || '';
    if (desig.includes('Adviser') || desig.includes('Driver') || desig.includes('Security') || desig.includes('Night') || dept.includes('Night')) {
      return { name: 'Night Shift', start: '22:00', end: '06:00', grace: 15 };
    }
    if (dept.includes('Service') || dept.includes('Survey') || dept.includes('Industrial')) {
      return { name: 'Technical Service Shift', start: '08:30', end: '16:30', grace: 15 };
    }
    if (dept.includes('Support')) {
      return { name: 'Support Shift', start: '10:00', end: '18:00', grace: 15 };
    }
    return { name: 'General Office Shift', start: '09:00', end: '17:00', grace: 15 };
  };

  const checkInEmployee = (employeeCode, checkInData) => {
    const emp = employees.find(e => e.employeeCode === employeeCode);
    if (!emp) return;

    const lat = checkInData.lat;
    const lng = checkInData.lng;
    const timeStr = checkInData.time;
    const dateStr = checkInData.date || new Date().toISOString().split('T')[0];

    let geofenceStatus = 'Outside Office';
    let matchedBranch = 'Outside Office';

    const hqDist = getDistanceInMeters(lat, lng, 23.7937, 90.4066);
    if (hqDist <= 100) {
      geofenceStatus = 'Office Attendance';
      matchedBranch = 'ATCL Head Office';
    } else {
      const branches = companyInfo.branches || [];
      for (const branch of branches) {
        if (branch.latitude && branch.longitude) {
          const dist = getDistanceInMeters(lat, lng, branch.latitude, branch.longitude);
          if (dist <= (branch.geofenceRadius || 100)) {
            geofenceStatus = 'Office Attendance';
            matchedBranch = branch.name;
            break;
          }
        }
      }
    }

    const shift = getEmployeeShift(emp);
    const metrics = calculateShiftMetrics(timeStr, '', shift, dateStr, 0);

    const newLog = {
      id: `${employeeCode}_${dateStr}`,
      employeeCode,
      name: emp.fullNameEnglish,
      department: emp.department,
      designation: emp.designation,
      date: dateStr,
      checkIn: timeStr,
      checkOut: '',
      isLate: metrics.isLate,
      lateMinutes: metrics.lateMinutes,
      earlyExitMinutes: 0,
      overtimeMinutes: 0,
      overtimeHours: 0,
      totalBreakMinutes: 0,
      totalWorkingMinutes: 0,
      status: 'Present',
      checkInType: checkInData.checkInType || 'Office',
      checkInStatus: geofenceStatus,
      outsideReason: checkInData.outsideReason || null,
      approvalStatus: geofenceStatus === 'Office Attendance' ? 'Approved' : 'Pending',
      approvedBy: geofenceStatus === 'Office Attendance' ? 'System' : '',
      gpsLocation: {
        lat,
        lng,
        device: checkInData.deviceInfo || 'Mobile Client',
        address: checkInData.address || 'Detected Address'
      },
      biometricVerified: true
    };

    setAttendanceLogs(prev => {
      const filtered = prev.filter(l => !(l.employeeCode === employeeCode && l.date === dateStr));
      return [newLog, ...filtered];
    });

    syncToBackend(`${BACKEND_URL}/attendance`, 'POST', newLog);

    return newLog;
  };

  const checkOutEmployee = (employeeCode, checkOutData) => {
    const dateStr = checkOutData.date || new Date().toISOString().split('T')[0];
    const log = attendanceLogs.find(l => l.employeeCode === employeeCode && l.date === dateStr);
    if (!log) return;

    const checkOutTime = checkOutData.time;
    const lat = checkOutData.lat;
    const lng = checkOutData.lng;

    const emp = employees.find(e => e.employeeCode === employeeCode);
    const shift = getEmployeeShift(emp);
    
    const empBreaks = breakLogs.filter(b => b.employeeCode === employeeCode && b.date === dateStr);
    const totalBreakMinutes = empBreaks.reduce((sum, b) => sum + (b.durationMinutes || 0), 0);

    const metrics = calculateShiftMetrics(log.checkIn, checkOutTime, shift, dateStr, totalBreakMinutes);

    const updatedLog = {
      ...log,
      checkOut: checkOutTime,
      totalWorkingMinutes: metrics.totalWorkingMinutes,
      earlyExitMinutes: metrics.earlyExitMinutes,
      overtimeMinutes: metrics.overtimeMinutes,
      overtimeHours: metrics.overtimeHours,
      totalBreakMinutes,
      checkOutLocation: {
        lat,
        lng,
        address: checkOutData.address || 'Detected Address'
      }
    };

    setAttendanceLogs(prev => prev.map(l => (l.employeeCode === employeeCode && l.date === dateStr) ? updatedLog : l));
    
    syncToBackend(`${BACKEND_URL}/attendance`, 'POST', updatedLog);

    return updatedLog;
  };

  const startBreak = (employeeCode, timeStr, lat, lng) => {
    const dateStr = new Date().toISOString().split('T')[0];
    const newBreak = {
      id: `break-${Date.now()}`,
      employeeCode,
      date: dateStr,
      breakStartTime: timeStr,
      breakStartLocation: { lat, lng },
      breakEndTime: '',
      breakEndLocation: null,
      durationMinutes: 0
    };
    setBreakLogs(prev => [newBreak, ...prev]);
    
    syncToBackend(`${BACKEND_URL}/break-logs`, 'POST', newBreak);
  };

  const endBreak = (employeeCode, timeStr, lat, lng) => {
    const dateStr = new Date().toISOString().split('T')[0];
    setBreakLogs(prev => prev.map(b => {
      if (b.employeeCode === employeeCode && b.date === dateStr && !b.breakEndTime) {
        const startDateTime = new Date(`${dateStr}T${b.breakStartTime}`);
        const endDateTime = new Date(`${dateStr}T${timeStr}`);
        const diffMs = Math.abs(endDateTime - startDateTime);
        const durationMinutes = Math.floor(diffMs / (1000 * 60));
        const updatedBreak = {
          ...b,
          breakEndTime: timeStr,
          breakEndLocation: { lat, lng },
          durationMinutes
        };
        
        syncToBackend(`${BACKEND_URL}/break-logs`, 'POST', updatedBreak);
        return updatedBreak;
      }
      return b;
    }));
  };

  const logFieldMovement = (employeeCode, coordinates, activityStatus) => {
    const dateStr = new Date().toISOString().split('T')[0];
    const newLog = {
      id: `mov-${Date.now()}`,
      employeeCode,
      date: dateStr,
      logTime: new Date().toLocaleTimeString('en-US', { hour12: false }),
      coordinates,
      activityStatus,
      batteryLevel: Math.floor(Math.random() * 40) + 60,
      isSpoofed: false
    };
    setMovementLogs(prev => [newLog, ...prev]);
    
    syncToBackend(`${BACKEND_URL}/movement-logs`, 'POST', newLog);
  };

  const approveAttendanceLog = (logId, managerCode, action) => {
    setAttendanceLogs(prev => prev.map(log => {
      if (log.id === logId) {
        const updated = {
          ...log,
          approvalStatus: action,
          approvedBy: managerCode
        };
        
        syncToBackend(`${BACKEND_URL}/attendance`, 'POST', updated);
        return updated;
      }
      return log;
    }));
  };

  // Employee CRUD
  const addEmployee = (empData) => {
    const maxId = employees.reduce((max, e) => e.id > max ? e.id : max, 0);
    const newId = maxId + 1;
    // Generate ATCL-XXXX based on existing highest numeric suffix or 500 + newId
    const maxCodeNum = employees.reduce((max, e) => {
      const m = String(e.employeeCode || '').match(/(\d+)/);
      return m ? Math.max(max, parseInt(m[1], 10)) : max;
    }, 500);
    const empCode = empData.employeeCode && String(empData.employeeCode).trim()
      ? String(empData.employeeCode).trim().toUpperCase()
      : `ATCL-${(maxCodeNum + 1).toString().padStart(4, '0')}`;
    
    const ratios = hrSettings?.salaryRatios || { basic: 50, houseRent: 25, medical: 10, conveyance: 10, mobile: 5 };
    const gross = Number(empData.grossSalary) || 30000;
    const basic = Math.round(gross * (ratios.basic / 100));
    const houseRent = Math.round(gross * (ratios.houseRent / 100));
    const medical = Math.round(gross * (ratios.medical / 100));
    const conveyance = Math.round(gross * (ratios.conveyance / 100));
    const mobile = Math.round(gross * (ratios.mobile / 100));

    const quotas = hrSettings?.defaultLeaveQuotas || { casual: 10, sick: 14, annual: 18, maternity: 120, paternity: 7, special: 5 };

    const newEmp = {
      ...empData,
      id: newId,
      employeeCode: empCode,
      grossSalary: gross,
      status: empData.status || 'Active',
      leaveBalances: empData.leaveBalances || {
        casual: quotas.casual,
        sick: quotas.sick,
        annual: quotas.annual,
        maternity: empData.gender === 'female' ? quotas.maternity : 0,
        paternity: empData.gender === 'male' ? quotas.paternity : 0,
        special: quotas.special
      },
      salaryComponents: empData.salaryComponents || {
        basicSalary: basic,
        houseRent,
        medicalAllowance: medical,
        conveyanceAllowance: conveyance,
        mobileAllowance: mobile,
        otherAllowances: 0
      },
      emergencyContact: empData.emergencyContact || {
        name: `Relative of ${empData.fullNameEnglish}`,
        relation: 'Spouse',
        contact: ''
      },
      education: empData.education || [],
      certifications: empData.certifications || [],
      previousHistory: empData.previousHistory || [],
      documents: empData.documents || []
    };

    setEmployees(prev => [...prev, newEmp]);
    
    syncToBackend(`${BACKEND_URL}/employees`, 'POST', newEmp);
    
    // Auto-create credentials for the new employee
    const cleanFirstName = (empData.fullNameEnglish || 'user').replace(/^(Engr\.|Md\.|MD|Dr\.|Mr\.|Ms\.)\s*/i, '').split(' ')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
    const username = cleanFirstName || `user${newId}`;
    const email = (empData.emailAddress || `${empCode.toLowerCase()}@atcl-bd.com`).trim().toLowerCase();
    const newCred = {
      username,
      fullName: empData.fullNameEnglish,
      email,
      employeeCode: empCode,
      password: '123456',
      mustChangePassword: true
    };
    setUserCredentials(prev => {
      const filtered = prev.filter(c => c.employeeCode !== empCode);
      return [...filtered, newCred];
    });
    syncToBackend(`${BACKEND_URL}/user-credentials`, 'POST', newCred);

    return newEmp;
  };

  const updateEmployee = (updatedEmp) => {
    setEmployees(prev => prev.map(e => e.id === updatedEmp.id ? updatedEmp : e));
    
    syncToBackend(`${BACKEND_URL}/employees/${updatedEmp.id}`, 'PUT', updatedEmp);
  };

  const deleteEmployee = (id) => {
    setEmployees(prev => prev.map(e => e.id === id ? { ...e, status: 'Inactive' } : e));
    
    syncToBackend(`${BACKEND_URL}/employees/${id}`, 'DELETE', {});
  };

  // Attendance CRUD
  const logAttendance = (log) => {
    setAttendanceLogs(prev => {
      const filtered = prev.filter(l => !(l.employeeCode === log.employeeCode && l.date === log.date));
      return [log, ...filtered];
    });
    
    syncToBackend(`${BACKEND_URL}/attendance`, 'POST', log);
  };

  const addAttendanceCorrection = (correctionRequest) => {
    const dateStr = correctionRequest.date;
    const empCode = correctionRequest.employeeCode;
    const emp = employees.find(e => e.employeeCode === empCode);
    
    if (!emp) return;

    const shift = getEmployeeShift(emp);
    const metrics = calculateShiftMetrics(correctionRequest.checkIn, correctionRequest.checkOut, shift, dateStr, 0);

    const updatedLog = {
      id: `${empCode}_${dateStr}`,
      employeeCode: empCode,
      name: emp.fullNameEnglish,
      department: emp.department,
      designation: emp.designation,
      date: dateStr,
      checkIn: correctionRequest.checkIn,
      checkOut: correctionRequest.checkOut,
      isLate: metrics.isLate,
      lateMinutes: metrics.lateMinutes,
      isEarlyLeave: metrics.earlyExitMinutes > 0,
      earlyExitMinutes: metrics.earlyExitMinutes,
      overtimeHours: correctionRequest.overtimeHours !== undefined ? correctionRequest.overtimeHours : metrics.overtimeHours,
      overtimeMinutes: metrics.overtimeMinutes,
      totalWorkingMinutes: metrics.totalWorkingMinutes,
      totalBreakMinutes: 0,
      approvalStatus: 'Approved',
      approvedBy: 'HR Administrator',
      checkInStatus: 'Office Attendance',
      status: 'Present',
      gpsLocation: {
        lat: 23.7937,
        lng: 90.4066,
        device: 'Manual Correction Approved'
      },
      biometricVerified: true
    };

    logAttendance(updatedLog);

    // Push immutable audit record to correctionLogs
    const auditEntry = {
      id: `CORR-${Date.now()}`,
      employeeCode: empCode,
      name: emp.fullNameEnglish,
      department: emp.department,
      designation: emp.designation,
      date: dateStr,
      correctedCheckIn: correctionRequest.checkIn,
      correctedCheckOut: correctionRequest.checkOut,
      overtimeHours: correctionRequest.overtimeHours || 0,
      reason: correctionRequest.reason || 'Manual admin correction',
      approvedBy: 'HR Administrator',
      approvedAt: new Date().toISOString(),
      status: 'Override Approved'
    };
    setCorrectionLogs(prev => [auditEntry, ...prev]);
    
    syncToBackend(`${BACKEND_URL}/correction-logs`, 'POST', auditEntry);
  };

  // Leave CRUD
  const addLeaveRequest = (req) => {
    const newReq = {
      ...req,
      id: `LR-${Date.now().toString().slice(-4)}`,
      status: 'Pending',
      appliedDate: new Date().toISOString().split('T')[0]
    };
    setLeaveRequests(prev => [newReq, ...prev]);
    
    syncToBackend(`${BACKEND_URL}/leave-requests`, 'POST', newReq);
  };

  const approveLeaveRequest = (reqId, approvedBy, status = 'Approved') => {
    setLeaveRequests(prev => prev.map(req => {
      if (req.id !== reqId) return req;
      
      const updatedReq = {
        ...req,
        status,
        approvedBy
      };
      
      syncToBackend(`${BACKEND_URL}/leave-requests/${reqId}`, 'PUT', { status, approvedBy });
      
      // Update employee balance if approved
      if (status === 'Approved') {
        setEmployees(empList => empList.map(emp => {
          if (emp.employeeCode !== req.employeeCode) return emp;
          const currentBal = emp.leaveBalances[req.leaveType] || 0;
          const updatedEmp = {
            ...emp,
            leaveBalances: {
              ...emp.leaveBalances,
              [req.leaveType]: Math.max(0, currentBal - req.days)
            }
          };
          
          syncToBackend(`${BACKEND_URL}/employees/${emp.id}`, 'PUT', updatedEmp);
          return updatedEmp;
        }));
      }

      return updatedReq;
    }));
  };

  // Payroll processing
  const runMonthlyPayroll = (monthKey, bonusType = 'None', bonusPercentage = 0) => {
    // monthKey format: "2026-06"
    const [year, month] = monthKey.split('-');
    
    // Process payroll for all active employees
    const processedRows = employees.filter(e => e.status === 'Active').map(emp => {
      const comps = emp.salaryComponents;
      const gross = emp.grossSalary;

      // Overtime Hours for the month (automated collection disabled)
      const otHours = 0;
      
      // Overtime calculation (automated calculation disabled)
      const overtimePay = 0;

      // Bonuses
      let bonusPay = 0;
      if (bonusType !== 'None') {
        // Eid / Ramadan / Festival bonus is typically calculated on Basic salary
        bonusPay = Math.round(comps.basicSalary * (bonusPercentage / 100));
      }

      // Unpaid Leave Deductions (LWP)
      // Approved 'special' / 'unpaid' / 'lwp' leaves — count only the days that fall inside this month
      const monthStart = new Date(Number(year), Number(month) - 1, 1);
      const monthEnd = new Date(Number(year), Number(month), 0); // last day of month
      const daysInMonth = monthEnd.getDate();
      const toLocalDate = (s) => {
        const [y, m, d] = String(s).split('-').map(Number);
        return new Date(y, (m || 1) - 1, d || 1);
      };
      const lwpDays = leaveRequests
        .filter(req =>
          req.employeeCode === emp.employeeCode &&
          req.status === 'Approved' &&
          ['special', 'unpaid', 'lwp'].includes(String(req.leaveType).toLowerCase()) &&
          req.startDate
        )
        .reduce((sum, req) => {
          const start = toLocalDate(req.startDate);
          const end = req.endDate ? toLocalDate(req.endDate) : start;
          const overlapStart = start > monthStart ? start : monthStart;
          const overlapEnd = end < monthEnd ? end : monthEnd;
          if (overlapEnd < overlapStart) return sum;
          const overlap = Math.round((overlapEnd - overlapStart) / 86400000) + 1;
          return sum + overlap;
        }, 0);
      const cappedLwpDays = Math.min(lwpDays, daysInMonth);

      // Deduction = (Gross / days in month) * LWP Days
      const unpaidLeaveDeduction = Math.round((gross / daysInMonth) * cappedLwpDays);

      // Monthly Income Tax calculation
      // We look up their annual investment declaration or mock one
      const decl = investmentDeclarations[emp.employeeCode] || {
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

      const totalInvestment = (decl.dpsContribution || 0) + 
                              (decl.sanchaypatra || 0) + 
                              (decl.providentFund || 0) + 
                              (decl.stocks || 0) + 
                              (decl.lifeInsurance || 0) +
                              (decl.otherEligible || 0);

      // Annual projection for TDS: 12 months of basic & allowances + 2 festival bonuses (100% of basic each,
      // per company Eid/Festival bonus policy). The bonus paid in this month is one of those two, so it is
      // NOT added again — otherwise TDS would be over-deducted in bonus months.
      const annualBasic = comps.basicSalary * 12;
      const annualAllowances = (comps.houseRent + comps.medicalAllowance + comps.conveyanceAllowance + comps.mobileAllowance + (comps.otherAllowances || 0)) * 12;
      const annualBonuses = comps.basicSalary * 2;

      const taxReport = calculateBangladeshTax({
        basicSalary: annualBasic,
        allowances: annualAllowances,
        bonuses: annualBonuses,
        gender: emp.gender,
        dob: emp.dob,
        age: 30, // Fallback if dob is missing
        taxpayerCategory: decl.taxpayerCategory && decl.taxpayerCategory !== 'auto' ? decl.taxpayerCategory : undefined,
        isDisabled: !!decl.isDisabled,
        isFreedomFighter: !!decl.isFreedomFighter,
        isParentOfDisabled: !!decl.isParentOfDisabled,
        disabledChildrenCount: decl.disabledChildrenCount || 1,
        investment: totalInvestment,
        investmentDetails: decl,
        region: decl.region || REGIONS.DHAKA_CHITTAGONG,
        taxYear: decl.taxYear || TAX_YEARS['2025-2026']
      });

      const taxDeduction = Math.round(taxReport.monthlyTaxDeduction);
      const providentFund = 0; // 0% PF contribution (PF is 0%)

      const totalDeductions = taxDeduction + providentFund + unpaidLeaveDeduction;
      const grossMonthlySalary = comps.basicSalary + comps.houseRent + comps.medicalAllowance + comps.conveyanceAllowance + comps.mobileAllowance + (comps.otherAllowances || 0);
      const earningsTotal = grossMonthlySalary + overtimePay + bonusPay;
      const netSalary = Math.max(0, earningsTotal - totalDeductions);

      return {
        employeeCode: emp.employeeCode,
        name: emp.fullNameEnglish,
        designation: emp.designation,
        department: emp.department,
        bankName: emp.bankName,
        accountNo: emp.bankAccountNo,
        basicSalary: comps.basicSalary,
        houseRent: comps.houseRent,
        medicalAllowance: comps.medicalAllowance,
        conveyanceAllowance: comps.conveyanceAllowance,
        mobileAllowance: comps.mobileAllowance,
        otherAllowances: comps.otherAllowances || 0,
        overtimeHours: otHours,
        overtimePay,
        bonusPay,
        taxDeduction,
        providentFund,
        unpaidLeaveDays: cappedLwpDays,
        unpaidLeaveDeduction,
        loanRecovery: 0,
        otherDeductions: 0,
        grossSalary: earningsTotal,
        totalDeductions,
        netSalary,
        paidDays: daysInMonth - cappedLwpDays
      };
    });

    const payrollRun = {
      id: `PR-${monthKey}`,
      month: monthKey,
      processedDate: new Date().toISOString().split('T')[0],
      bonusType,
      bonusPercentage,
      totalDisbursed: processedRows.reduce((sum, r) => sum + r.netSalary, 0),
      employeeCount: processedRows.length,
      rows: processedRows
    };

    setPayrollRuns(prev => {
      const filtered = prev.filter(pr => pr.month !== monthKey);
      return [payrollRun, ...filtered];
    });
    
    syncToBackend(`${BACKEND_URL}/payroll-runs`, 'POST', payrollRun);
  };

  // Salary Revisions
  const reviseSalary = (employeeCode, newGross, reason, approvedBy) => {
    const dateStr = new Date().toISOString().split('T')[0];
    
    setEmployees(prev => prev.map(emp => {
      if (emp.employeeCode !== employeeCode) return emp;
      
      const prevGross = emp.grossSalary;
      const ratios = hrSettings?.salaryRatios || DEFAULT_HR_SETTINGS.salaryRatios;
      const basic = Math.round(newGross * (ratios.basic / 100));
      const houseRent = Math.round(newGross * (ratios.houseRent / 100));
      const medical = Math.round(newGross * (ratios.medical / 100));
      const conveyance = Math.round(newGross * (ratios.conveyance / 100));
      // Mobile absorbs any rounding remainder so components always sum exactly to gross
      const mobile = Math.max(0, newGross - basic - houseRent - medical - conveyance);

      // Add to revision logs
      const revEntry = {
        id: `REV-${Date.now().toString().slice(-4)}`,
        employeeCode,
        name: emp.fullNameEnglish,
        previousGross: prevGross,
        newGross,
        effectiveDate: dateStr,
        reason,
        approvedBy
      };
      
      setRevisions(revs => {
        const newRevs = [revEntry, ...revs];
        syncToBackend(`${BACKEND_URL}/revisions`, 'POST', revEntry);
        return newRevs;
      });

      const updatedEmp = {
        ...emp,
        grossSalary: newGross,
        salaryComponents: {
          basicSalary: basic,
          houseRent,
          medicalAllowance: medical,
          conveyanceAllowance: conveyance,
          mobileAllowance: mobile,
          otherAllowances: 0
        }
      };
      
      syncToBackend(`${BACKEND_URL}/employees/${emp.id}`, 'PUT', updatedEmp);
      
      return updatedEmp;
    }));
  };

  // Tax investment declaration update
  const updateTaxDeclaration = (employeeCode, data) => {
    setInvestmentDeclarations(prev => {
      // If this is the first time we're creating a declaration for this employee,
      // seed it with their profile data so TIN/Zone/Circle are never blank.
      const existing = prev[employeeCode];
      const empProfile = employees.find(e => e.employeeCode === employeeCode);
      const base = existing || {
        tin: empProfile?.tin || '',
        taxZone: empProfile?.taxZone || '',
        taxCircle: empProfile?.taxCircle || '',
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
      
      const updated = {
        ...prev,
        [employeeCode]: {
          ...base,
          ...data
        }
      };
      
      syncToBackend(`${BACKEND_URL}/investments`, 'POST', { employeeCode, data: updated[employeeCode] });
      
      return updated;
    });
  };

  // Switch login mode
  const switchLoginMode = (mode, employeeCode = '') => {
    if (mode === 'employee' && employeeCode) {
      setLoginMode('employee');
      setActiveEmployeeCode(employeeCode);
      const emp = employees.find(e => e.employeeCode === employeeCode);
      if (emp) {
        setCurrentUser({
          name: emp.fullNameEnglish,
          email: emp.emailAddress,
          role: 'Employee (ESS)',
          avatar: emp.photograph || '',
          employeeCode: emp.employeeCode
        });
      }
    } else {
      // Return to admin — restore the real admin user
      setLoginMode('admin');
      setActiveEmployeeCode('');
      if (adminUser) {
        setCurrentUser(adminUser);
      } else {
        setCurrentUser({
          name: 'Admin HR Manager',
          email: 'admin.hr@atcl-bd.com',
          role: 'Administrator',
          avatar: ''
        });
      }
    }
  };

  // Update employee personal profile in ESS
  const updateEmployeePersonal = (employeeCode, personalData) => {
    setEmployees(prev => prev.map(emp => {
      if (emp.employeeCode !== employeeCode) return emp;
      const updated = {
        ...emp,
        mobileNumber: personalData.mobileNumber || emp.mobileNumber,
        emailAddress: personalData.emailAddress || emp.emailAddress,
        personalMobileNumber: personalData.personalMobileNumber !== undefined ? personalData.personalMobileNumber : emp.personalMobileNumber,
        personalEmailAddress: personalData.personalEmailAddress !== undefined ? personalData.personalEmailAddress : emp.personalEmailAddress,
        fatherName: personalData.fatherName !== undefined ? personalData.fatherName : emp.fatherName,
        motherName: personalData.motherName !== undefined ? personalData.motherName : emp.motherName,
        nominee: personalData.nominee !== undefined ? personalData.nominee : emp.nominee,
        presentAddress: personalData.presentAddress || emp.presentAddress,
        permanentAddress: personalData.permanentAddress || emp.permanentAddress,
        photograph: personalData.photograph || emp.photograph,
        signature: personalData.signature || emp.signature,
        emergencyContact: {
          ...emp.emergencyContact,
          ...personalData.emergencyContact
        }
      };
      
      syncToBackend(`${BACKEND_URL}/employees/${emp.id}`, 'PUT', updated);
      
      return updated;
    }));
  };

  // Update Company Overview/Legal/Contact/Business info
  const updateCompanyInfo = async (data, user = 'HR Administrator') => {
    await saveToFirestore('companies', 'atcl-bd', data);
    
    // Compute changes
    const changes = [];
    Object.keys(data).forEach(key => {
      if (typeof data[key] !== 'object' && companyInfo[key] !== data[key]) {
        changes.push(`Changed ${key} to "${data[key]}"`);
      }
    });
    const details = changes.length > 0 ? changes.join(', ') : "Updated section properties.";
    
    const updatedCompany = {
      ...companyInfo,
      ...data
    };
    
    setCompanyInfo(updatedCompany);
    
    syncToBackend(`${BACKEND_URL}/company-info`, 'PUT', updatedCompany);
 
    const newLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      modifiedBy: user,
      action: "Update Profile Settings",
      details
    };
    setCompanyAuditLogs(prev => [newLog, ...prev]);
    
    syncToBackend(`${BACKEND_URL}/company-audit-logs`, 'POST', newLog);
  };

  // Branch CRUD
  const addCompanyBranch = (branch, user = 'HR Administrator') => {
    const newBranch = { ...branch, id: `br-${Date.now()}` };
    const updatedCompany = {
      ...companyInfo,
      branches: [...(companyInfo.branches || []), newBranch]
    };
    setCompanyInfo(updatedCompany);
    
    syncToBackend(`${BACKEND_URL}/company-info`, 'PUT', updatedCompany);
 
    const newLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      modifiedBy: user,
      action: "Add Office Branch",
      details: `Created office branch: ${branch.name} (${branch.code})`
    };
    setCompanyAuditLogs(prev => [newLog, ...prev]);
    
    syncToBackend(`${BACKEND_URL}/company-audit-logs`, 'POST', newLog);
  };

  const updateCompanyBranch = (branchId, branchData, user = 'HR Administrator') => {
    const updatedCompany = {
      ...companyInfo,
      branches: (companyInfo.branches || []).map(b => b.id === branchId ? { ...b, ...branchData } : b)
    };
    setCompanyInfo(updatedCompany);
    
    syncToBackend(`${BACKEND_URL}/company-info`, 'PUT', updatedCompany);
 
    const newLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      modifiedBy: user,
      action: "Update Office Branch",
      details: `Updated info for branch: ${branchData.name}`
    };
    setCompanyAuditLogs(prev => [newLog, ...prev]);
    
    syncToBackend(`${BACKEND_URL}/company-audit-logs`, 'POST', newLog);
  };

  const deleteCompanyBranch = (branchId, user = 'HR Administrator') => {
    const branch = companyInfo.branches?.find(b => b.id === branchId);
    const updatedCompany = {
      ...companyInfo,
      branches: (companyInfo.branches || []).filter(b => b.id !== branchId)
    };
    setCompanyInfo(updatedCompany);
    
    syncToBackend(`${BACKEND_URL}/company-info`, 'PUT', updatedCompany);
 
    const newLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      modifiedBy: user,
      action: "Delete Office Branch",
      details: `Removed branch office: ${branch ? branch.name : branchId}`
    };
    setCompanyAuditLogs(prev => [newLog, ...prev]);
    
    syncToBackend(`${BACKEND_URL}/company-audit-logs`, 'POST', newLog);
  };

  // Bank CRUD
  const addCompanyBankAccount = (account, user = 'HR Administrator') => {
    const newAcc = { ...account, id: `bank-${Date.now()}` };
    const updatedCompany = {
      ...companyInfo,
      bankAccounts: [...(companyInfo.bankAccounts || []), newAcc]
    };
    setCompanyInfo(updatedCompany);
    
    syncToBackend(`${BACKEND_URL}/company-info`, 'PUT', updatedCompany);
 
    const newLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      modifiedBy: user,
      action: "Add Bank Account",
      details: `Added Salary Account: ${account.bankName} - A/C ${account.accountNumber}`
    };
    setCompanyAuditLogs(prev => [newLog, ...prev]);
    
    syncToBackend(`${BACKEND_URL}/company-audit-logs`, 'POST', newLog);
  };

  const deleteCompanyBankAccount = (accountId, user = 'HR Administrator') => {
    const account = companyInfo.bankAccounts?.find(a => a.id === accountId);
    const updatedCompany = {
      ...companyInfo,
      bankAccounts: (companyInfo.bankAccounts || []).filter(a => a.id !== accountId)
    };
    setCompanyInfo(updatedCompany);
    
    syncToBackend(`${BACKEND_URL}/company-info`, 'PUT', updatedCompany);
 
    const newLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      modifiedBy: user,
      action: "Delete Bank Account",
      details: `Deleted Salary Account: ${account ? account.bankName : accountId}`
    };
    setCompanyAuditLogs(prev => [newLog, ...prev]);
    
    syncToBackend(`${BACKEND_URL}/company-audit-logs`, 'POST', newLog);
  };

  // Documents Upload Repository
  const uploadCompanyDocument = (doc, user = 'HR Administrator') => {
    const newDoc = {
      ...doc,
      id: `doc-${Date.now()}`,
      uploadDate: new Date().toISOString().split('T')[0]
    };
    const updatedCompany = {
      ...companyInfo,
      documents: [...(companyInfo.documents || []), newDoc]
    };
    setCompanyInfo(updatedCompany);
    
    syncToBackend(`${BACKEND_URL}/company-info`, 'PUT', updatedCompany);
 
    const newLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      modifiedBy: user,
      action: "Upload Corporate Document",
      details: `Uploaded file to repository: ${doc.name} (${doc.type})`
    };
    setCompanyAuditLogs(prev => [newLog, ...prev]);
    
    syncToBackend(`${BACKEND_URL}/company-audit-logs`, 'POST', newLog);
  };

  const login = async (email, password) => {
    return await loginWithEmail(email, password);
  };

  const loginGoogle = async () => {
    return await loginWithGoogle();
  };

  const logout = async () => {
    return await logoutUser();
  };

  const resetPassword = async (email) => {
    return await resetUserPassword(email);
  };

  // --- Bulk & Admin Settings Functions ---
  const updateHrSettings = (partialSettings, user = 'HR Administrator') => {
    setHrSettings(prev => {
      const updated = { ...prev, ...partialSettings };
      localStorage.setItem('atcl_hr_settings_v1', JSON.stringify(updated));
      return updated;
    });
    const newLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      modifiedBy: user,
      action: 'Update System Settings',
      details: `Updated HR master configuration (${Object.keys(partialSettings).join(', ')})`
    };
    setCompanyAuditLogs(prev => [newLog, ...prev]);
    syncToBackend(`${BACKEND_URL}/company-audit-logs`, 'POST', newLog);
  };

  const bulkUpsertEmployees = (rows, mode = 'upsert') => {
    if (!Array.isArray(rows) || rows.length === 0) return { added: 0, updated: 0, skipped: 0 };

    const ratios = hrSettings?.salaryRatios || { basic: 50, houseRent: 25, medical: 10, conveyance: 10, mobile: 5 };
    const quotas = hrSettings?.defaultLeaveQuotas || { casual: 10, sick: 14, annual: 18, maternity: 120, paternity: 7, special: 5 };

    let added = 0;
    let updated = 0;
    let skipped = 0;

    let currentList = [...employees];
    let currentCreds = [...userCredentials];

    let maxId = currentList.reduce((max, e) => (e.id > max ? e.id : max), 0);
    let maxCodeNum = currentList.reduce((max, e) => {
      const m = String(e.employeeCode || '').match(/(\d+)/);
      return m ? Math.max(max, parseInt(m[1], 10)) : max;
    }, 500);

    const newDepartmentsSet = new Set(hrSettings?.departments || []);
    const newDesignationsSet = new Set(hrSettings?.designations || []);

    rows.forEach((raw) => {
      const fullNameEnglish = String(raw.fullNameEnglish || raw['Full Name (English)'] || raw['Full Name'] || raw.name || '').trim();
      if (!fullNameEnglish) {
        skipped++;
        return;
      }

      const rawCode = String(raw.employeeCode || raw['Employee Code'] || raw['Employee ID'] || '').trim().toUpperCase();
      const existingIndex = rawCode ? currentList.findIndex(e => String(e.employeeCode).toUpperCase() === rawCode) : -1;

      if (existingIndex !== -1 && mode === 'add_only') {
        skipped++;
        return;
      }

      const department = String(raw.department || raw['Department'] || 'Administration').trim() || 'Administration';
      const designation = String(raw.designation || raw['Designation'] || 'Executive').trim() || 'Executive';
      newDepartmentsSet.add(department);
      newDesignationsSet.add(designation);

      const grossSalary = Number(String(raw.grossSalary || raw['Gross Salary'] || raw.salary || 30000).replace(/[^0-9.]/g, '')) || 30000;
      const gender = String(raw.gender || raw['Gender'] || 'male').trim().toLowerCase() === 'female' ? 'female' : 'male';

      const basic = Math.round(grossSalary * (ratios.basic / 100));
      const houseRent = Math.round(grossSalary * (ratios.houseRent / 100));
      const medical = Math.round(grossSalary * (ratios.medical / 100));
      const conveyance = Math.round(grossSalary * (ratios.conveyance / 100));
      const mobile = Math.round(grossSalary * (ratios.mobile / 100));

      const salaryComponents = {
        basicSalary: basic,
        houseRent,
        medicalAllowance: medical,
        conveyanceAllowance: conveyance,
        mobileAllowance: mobile,
        otherAllowances: 0
      };

      if (existingIndex !== -1) {
        const existingEmp = currentList[existingIndex];
        const mergedEmp = {
          ...existingEmp,
          fullNameEnglish,
          fullNameBangla: String(raw.fullNameBangla ?? raw['Full Name (Bangla)'] ?? existingEmp.fullNameBangla ?? '').trim(),
          designation,
          department,
          grossSalary,
          salaryComponents,
          joiningDate: String(raw.joiningDate || raw['Joining Date'] || existingEmp.joiningDate || '2024-01-01').trim(),
          dob: String(raw.dob || raw['Date of Birth'] || existingEmp.dob || '1990-01-01').trim(),
          gender,
          bloodGroup: String(raw.bloodGroup || raw['Blood Group'] || existingEmp.bloodGroup || 'O+').trim(),
          maritalStatus: String(raw.maritalStatus || raw['Marital Status'] || existingEmp.maritalStatus || 'Single').trim(),
          mobileNumber: String(raw.mobileNumber || raw['Mobile Number'] || existingEmp.mobileNumber || '').trim(),
          emailAddress: String(raw.emailAddress || raw['Official Email'] || raw.email || existingEmp.emailAddress || '').trim(),
          personalMobileNumber: String(raw.personalMobileNumber ?? raw['Personal Mobile'] ?? existingEmp.personalMobileNumber ?? '').trim(),
          personalEmailAddress: String(raw.personalEmailAddress ?? raw['Personal Email'] ?? existingEmp.personalEmailAddress ?? '').trim(),
          nid: String(raw.nid ?? raw['NID'] ?? existingEmp.nid ?? '').trim(),
          passportNumber: String(raw.passportNumber ?? raw['Passport Number'] ?? existingEmp.passportNumber ?? '').trim(),
          tin: String(raw.tin ?? raw['TIN'] ?? existingEmp.tin ?? '').trim(),
          taxZone: String(raw.taxZone || raw['Tax Zone'] || existingEmp.taxZone || 'Zone 15').trim(),
          taxCircle: String(raw.taxCircle || raw['Tax Circle'] || existingEmp.taxCircle || 'Circle 1').trim(),
          bankName: String(raw.bankName || raw['Bank Name'] || existingEmp.bankName || 'Al-Arafah Islami Bank Ltd.').trim(),
          bankAccountNo: String(raw.bankAccountNo ?? raw['Bank Account No'] ?? existingEmp.bankAccountNo ?? '').trim(),
          intercom: String(raw.intercom ?? raw['Intercom'] ?? existingEmp.intercom ?? '').trim(),
          educationalQualification: String(raw.educationalQualification ?? raw['Educational Qualification'] ?? existingEmp.educationalQualification ?? '').trim(),
          fatherName: String(raw.fatherName ?? raw['Father Name'] ?? existingEmp.fatherName ?? '').trim(),
          motherName: String(raw.motherName ?? raw['Mother Name'] ?? existingEmp.motherName ?? '').trim(),
          nominee: String(raw.nominee ?? raw['Nominee'] ?? existingEmp.nominee ?? '').trim(),
          presentAddress: String(raw.presentAddress || raw['Present Address'] || existingEmp.presentAddress || 'Dhaka, Bangladesh').trim(),
          permanentAddress: String(raw.permanentAddress || raw['Permanent Address'] || existingEmp.permanentAddress || 'Dhaka, Bangladesh').trim(),
          status: String(raw.status || raw['Status'] || existingEmp.status || 'Active').trim()
        };
        currentList[existingIndex] = mergedEmp;
        syncToBackend(`${BACKEND_URL}/employees/${mergedEmp.id}`, 'PUT', mergedEmp);
        updated++;
      } else {
        maxId += 1;
        maxCodeNum += 1;
        const empCode = rawCode || `ATCL-${maxCodeNum.toString().padStart(4, '0')}`;
        const emailAddress = String(raw.emailAddress || raw['Official Email'] || raw.email || `${empCode.toLowerCase()}@atcl-bd.com`).trim();

        const newEmp = {
          id: maxId,
          employeeCode: empCode,
          fullNameEnglish,
          fullNameBangla: String(raw.fullNameBangla || raw['Full Name (Bangla)'] || '').trim(),
          designation,
          department,
          status: String(raw.status || raw['Status'] || 'Active').trim(),
          dob: String(raw.dob || raw['Date of Birth'] || '1990-01-01').trim(),
          gender,
          bloodGroup: String(raw.bloodGroup || raw['Blood Group'] || 'O+').trim(),
          maritalStatus: String(raw.maritalStatus || raw['Marital Status'] || 'Single').trim(),
          nationality: 'Bangladeshi',
          mobileNumber: String(raw.mobileNumber || raw['Mobile Number'] || '').trim(),
          emailAddress,
          personalMobileNumber: String(raw.personalMobileNumber || raw['Personal Mobile'] || '').trim(),
          personalEmailAddress: String(raw.personalEmailAddress || raw['Personal Email'] || '').trim(),
          presentAddress: String(raw.presentAddress || raw['Present Address'] || 'Dhaka, Bangladesh').trim(),
          permanentAddress: String(raw.permanentAddress || raw['Permanent Address'] || 'Dhaka, Bangladesh').trim(),
          nid: String(raw.nid || raw['NID'] || '').trim(),
          passportNumber: String(raw.passportNumber || raw['Passport Number'] || '').trim(),
          bankName: String(raw.bankName || raw['Bank Name'] || 'Al-Arafah Islami Bank Ltd.').trim(),
          bankAccountNo: String(raw.bankAccountNo || raw['Bank Account No'] || '').trim(),
          taxZone: String(raw.taxZone || raw['Tax Zone'] || 'Zone 15').trim(),
          taxCircle: String(raw.taxCircle || raw['Tax Circle'] || 'Circle 1').trim(),
          tin: String(raw.tin || raw['TIN'] || '').trim(),
          joiningDate: String(raw.joiningDate || raw['Joining Date'] || new Date().toISOString().split('T')[0]).trim(),
          grossSalary,
          intercom: String(raw.intercom || raw['Intercom'] || '').trim(),
          educationalQualification: String(raw.educationalQualification || raw['Educational Qualification'] || '').trim(),
          fatherName: String(raw.fatherName || raw['Father Name'] || '').trim(),
          motherName: String(raw.motherName || raw['Mother Name'] || '').trim(),
          nominee: String(raw.nominee || raw['Nominee'] || '').trim(),
          photograph: '',
          signature: '',
          leaveBalances: {
            casual: quotas.casual,
            sick: quotas.sick,
            annual: quotas.annual,
            maternity: gender === 'female' ? quotas.maternity : 0,
            paternity: gender === 'male' ? quotas.paternity : 0,
            special: quotas.special
          },
          salaryComponents,
          emergencyContact: {
            name: String(raw.nominee || raw['Nominee'] || `Relative of ${fullNameEnglish}`).trim(),
            relation: 'Spouse',
            contact: String(raw.personalMobileNumber || raw['Personal Mobile'] || raw.mobileNumber || raw['Mobile Number'] || '').trim()
          },
          familyInfo: [],
          education: [],
          certifications: [],
          previousHistory: [],
          documents: []
        };

        currentList.push(newEmp);
        syncToBackend(`${BACKEND_URL}/employees`, 'POST', newEmp);

        const cleanFirstName = fullNameEnglish.replace(/^(Engr\.|Md\.|MD|Dr\.|Mr\.|Ms\.)\s*/i, '').split(' ')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
        const username = cleanFirstName || empCode.toLowerCase();
        const newCred = {
          username,
          fullName: fullNameEnglish,
          email: emailAddress.toLowerCase(),
          employeeCode: empCode,
          password: '123456',
          mustChangePassword: true
        };
        currentCreds = [...currentCreds.filter(c => c.employeeCode !== empCode), newCred];
        syncToBackend(`${BACKEND_URL}/user-credentials`, 'POST', newCred);
        added++;
      }
    });

    setEmployees(currentList);
    setUserCredentials(currentCreds);
    setHrSettings(prev => ({
      ...prev,
      departments: Array.from(newDepartmentsSet),
      designations: Array.from(newDesignationsSet)
    }));

    const auditEntry = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      modifiedBy: currentUser?.name || 'HR Administrator',
      action: 'Bulk Employee Upload',
      details: `Processed bulk employee import: ${added} added, ${updated} updated, ${skipped} skipped.`
    };
    setCompanyAuditLogs(prev => [auditEntry, ...prev]);

    return { added, updated, skipped };
  };

  const bulkImportAttendance = (rows) => {
    if (!Array.isArray(rows) || rows.length === 0) return { imported: 0, skipped: 0 };
    let imported = 0;
    let skipped = 0;
    const newLogsMap = new Map();

    attendanceLogs.forEach(l => {
      newLogsMap.set(`${l.employeeCode}_${l.date}`, l);
    });

    rows.forEach(raw => {
      const empCode = String(raw.employeeCode || raw['Employee Code'] || raw['Employee ID'] || '').trim().toUpperCase();
      const dateStr = String(raw.date || raw['Date'] || '').trim();
      const checkIn = String(raw.checkIn || raw['Check In'] || '09:00:00').trim();
      const checkOut = String(raw.checkOut || raw['Check Out'] || '17:00:00').trim();

      const emp = employees.find(e => String(e.employeeCode).toUpperCase() === empCode);
      if (!emp || !dateStr) {
        skipped++;
        return;
      }

      const shift = getEmployeeShift(emp);
      const metrics = calculateShiftMetrics(checkIn, checkOut, shift, dateStr, 0);

      const logObj = {
        id: `${emp.employeeCode}_${dateStr}`,
        employeeCode: emp.employeeCode,
        name: emp.fullNameEnglish,
        department: emp.department,
        designation: emp.designation,
        date: dateStr,
        checkIn,
        checkOut,
        isLate: metrics.isLate,
        lateMinutes: metrics.lateMinutes,
        isEarlyLeave: metrics.earlyExitMinutes > 0,
        earlyExitMinutes: metrics.earlyExitMinutes,
        overtimeHours: metrics.overtimeHours,
        overtimeMinutes: metrics.overtimeMinutes,
        totalWorkingMinutes: metrics.totalWorkingMinutes,
        totalBreakMinutes: 0,
        status: String(raw.status || raw['Status'] || 'Present').trim(),
        checkInType: String(raw.checkInType || raw['Check In Type'] || 'Office').trim(),
        checkInStatus: 'Office Attendance',
        approvalStatus: 'Approved',
        approvedBy: 'Bulk Import',
        gpsLocation: {
          lat: 23.7937,
          lng: 90.4066,
          device: String(raw.remarks || raw['Remarks'] || 'Bulk Sheet Import')
        },
        biometricVerified: true
      };

      newLogsMap.set(`${emp.employeeCode}_${dateStr}`, logObj);
      syncToBackend(`${BACKEND_URL}/attendance`, 'POST', logObj);
      imported++;
    });

    setAttendanceLogs(Array.from(newLogsMap.values()));
    return { imported, skipped };
  };

  const bulkImportSalaryAndTax = (rows) => {
    if (!Array.isArray(rows) || rows.length === 0) return { updated: 0, skipped: 0 };
    let updated = 0;
    let skipped = 0;

    const ratios = hrSettings?.salaryRatios || { basic: 50, houseRent: 25, medical: 10, conveyance: 10, mobile: 5 };
    const updatedEmployees = [...employees];
    const updatedInvestments = { ...investmentDeclarations };

    rows.forEach(raw => {
      const empCode = String(raw.employeeCode || raw['Employee Code'] || raw['Employee ID'] || '').trim().toUpperCase();
      const idx = updatedEmployees.findIndex(e => String(e.employeeCode).toUpperCase() === empCode);
      if (idx === -1) {
        skipped++;
        return;
      }

      const emp = updatedEmployees[idx];
      const newGross = Number(String(raw.grossSalary || raw['Gross Salary'] || emp.grossSalary).replace(/[^0-9.]/g, '')) || emp.grossSalary;
      const bankName = String(raw.bankName || raw['Bank Name'] || emp.bankName || '').trim();
      const bankAccountNo = String(raw.bankAccountNo ?? raw['Bank Account No'] ?? emp.bankAccountNo ?? '').trim();
      const tin = String(raw.tin ?? raw['TIN'] ?? emp.tin ?? '').trim();
      const taxZone = String(raw.taxZone || raw['Tax Zone'] || emp.taxZone || 'Zone 15').trim();
      const taxCircle = String(raw.taxCircle || raw['Tax Circle'] || emp.taxCircle || 'Circle 1').trim();

      const basic = Math.round(newGross * (ratios.basic / 100));
      const houseRent = Math.round(newGross * (ratios.houseRent / 100));
      const medical = Math.round(newGross * (ratios.medical / 100));
      const conveyance = Math.round(newGross * (ratios.conveyance / 100));
      const mobile = Math.max(0, newGross - basic - houseRent - medical - conveyance);

      const updatedEmp = {
        ...emp,
        grossSalary: newGross,
        bankName,
        bankAccountNo,
        tin,
        taxZone,
        taxCircle,
        salaryComponents: {
          basicSalary: basic,
          houseRent,
          medicalAllowance: medical,
          conveyanceAllowance: conveyance,
          mobileAllowance: mobile,
          otherAllowances: emp.salaryComponents?.otherAllowances || 0
        }
      };

      updatedEmployees[idx] = updatedEmp;
      syncToBackend(`${BACKEND_URL}/employees/${updatedEmp.id}`, 'PUT', updatedEmp);

      const dps = Number(raw.dpsContribution ?? raw['DPS Contribution'] ?? updatedInvestments[empCode]?.dpsContribution ?? 0) || 0;
      const sanchaypatra = Number(raw.sanchaypatra ?? raw['Sanchaypatra'] ?? updatedInvestments[empCode]?.sanchaypatra ?? 0) || 0;
      const pf = Number(raw.providentFund ?? raw['Provident Fund'] ?? updatedInvestments[empCode]?.providentFund ?? 0) || 0;
      const stocks = Number(raw.stocks ?? raw['Stocks'] ?? updatedInvestments[empCode]?.stocks ?? 0) || 0;
      const otherEligible = Number(raw.otherEligible ?? raw['Other Eligible Investment'] ?? updatedInvestments[empCode]?.otherEligible ?? 0) || 0;

      updatedInvestments[emp.employeeCode] = {
        ...(updatedInvestments[emp.employeeCode] || {}),
        tin,
        taxZone,
        taxCircle,
        region: updatedInvestments[emp.employeeCode]?.region || REGIONS.DHAKA_CHITTAGONG,
        taxYear: updatedInvestments[emp.employeeCode]?.taxYear || TAX_YEARS['2025-2026'],
        dpsContribution: dps,
        sanchaypatra,
        providentFund: pf,
        stocks,
        otherEligible
      };

      updated++;
    });

    setEmployees(updatedEmployees);
    setInvestmentDeclarations(updatedInvestments);
    return { updated, skipped };
  };

  const syncMissingUserCredentials = () => {
    let addedCount = 0;
    const currentCreds = [...userCredentials];
    employees.forEach(emp => {
      const exists = currentCreds.some(c => c.employeeCode === emp.employeeCode);
      if (!exists) {
        const cleanFirstName = (emp.fullNameEnglish || 'user').replace(/^(Engr\.|Md\.|MD|Dr\.|Mr\.|Ms\.)\s*/i, '').split(' ')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
        const newCred = {
          username: cleanFirstName || emp.employeeCode.toLowerCase(),
          fullName: emp.fullNameEnglish,
          email: (emp.emailAddress || `${emp.employeeCode.toLowerCase()}@atcl-bd.com`).trim().toLowerCase(),
          employeeCode: emp.employeeCode,
          password: '123456',
          mustChangePassword: true
        };
        currentCreds.push(newCred);
        syncToBackend(`${BACKEND_URL}/user-credentials`, 'POST', newCred);
        addedCount++;
      }
    });
    setUserCredentials(currentCreds);
    return addedCount;
  };

  const adminUpdateUserCredential = (employeeCode, updates) => {
    setUserCredentials(prev => prev.map(c => {
      if (c.employeeCode === employeeCode) {
        return { ...c, ...updates };
      }
      return c;
    }));
  };

  // --- Document Templates Management ---
  const saveDocumentTemplate = (templateData) => {
    const now = new Date().toISOString();
    const actor = currentUser?.name || 'HR Administrator';
    let savedRecord = null;

    setDocumentTemplates(prev => {
      const idx = prev.findIndex(t => t.id === templateData.id);
      if (idx !== -1) {
        const existing = prev[idx];
        savedRecord = {
          ...existing,
          ...templateData,
          version: (Number(existing.version) || 1) + 1,
          updatedAt: now,
          updatedBy: actor
        };
        const next = [...prev];
        next[idx] = savedRecord;
        return next;
      } else {
        savedRecord = {
          id: templateData.id || `tpl-custom-${Date.now()}`,
          name: templateData.name || 'Untitled HR Template',
          category: templateData.category || 'Custom',
          type: templateData.type || 'letter',
          description: templateData.description || 'Custom HR Document Template',
          isSystem: false,
          isFeatured: !!templateData.isFeatured,
          useLetterhead: templateData.useLetterhead !== false,
          pageSize: templateData.pageSize || 'A4',
          signatory: templateData.signatory || { name: 'Managing Director', designation: 'Managing Director, ATCL' },
          customFields: Array.isArray(templateData.customFields) ? templateData.customFields : [],
          version: 1,
          updatedAt: now,
          updatedBy: actor,
          body: templateData.body || '<p>Date: {{today}}</p><p>Dear <strong>{{employee.fullNameEnglish}}</strong>,</p>'
        };
        return [savedRecord, ...prev];
      }
    });

    return savedRecord;
  };

  const duplicateDocumentTemplate = (templateId) => {
    const source = documentTemplates.find(t => t.id === templateId);
    if (!source) return null;
    const copy = {
      ...source,
      id: `tpl-copy-${Date.now()}`,
      name: `${source.name} (Copy)`,
      isSystem: false,
      version: 1,
      updatedAt: new Date().toISOString(),
      updatedBy: currentUser?.name || 'HR Administrator'
    };
    setDocumentTemplates(prev => [copy, ...prev]);
    return copy;
  };

  const toggleFeatureDocumentTemplate = (templateId) => {
    setDocumentTemplates(prev =>
      prev.map(t => (t.id === templateId ? { ...t, isFeatured: !t.isFeatured } : t))
    );
  };

  const resetSystemDocumentTemplate = (templateId) => {
    const seed = SEED_DOCUMENT_TEMPLATES.find(s => s.id === templateId);
    if (!seed) return false;
    setDocumentTemplates(prev =>
      prev.map(t =>
        t.id === templateId
          ? {
              ...seed,
              updatedAt: new Date().toISOString(),
              updatedBy: 'Reset to Factory Seed'
            }
          : t
      )
    );
    return true;
  };

  const deleteDocumentTemplate = (templateId) => {
    const target = documentTemplates.find(t => t.id === templateId);
    if (!target) return false;
    if (target.isSystem) {
      return resetSystemDocumentTemplate(templateId);
    }
    setDocumentTemplates(prev => prev.filter(t => t.id !== templateId));
    return true;
  };

  const importDocumentTemplates = (templatesList) => {
    if (!Array.isArray(templatesList) || templatesList.length === 0) return 0;
    let count = 0;
    setDocumentTemplates(prev => {
      const map = new Map(prev.map(t => [t.id, t]));
      templatesList.forEach(item => {
        if (item && item.name && item.body) {
          const id = item.id || `tpl-import-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
          map.set(id, {
            ...item,
            id,
            updatedAt: new Date().toISOString()
          });
          count++;
        }
      });
      return Array.from(map.values());
    });
    return count;
  };

  const attachGeneratedDocToEmployee = (employeeCode, docRecord) => {
    setEmployees(prev =>
      prev.map(emp => {
        if (emp.employeeCode !== employeeCode) return emp;
        const docs = Array.isArray(emp.documents) ? emp.documents : [];
        return {
          ...emp,
          documents: [docRecord, ...docs]
        };
      })
    );
  };

  const getSystemBackupPayload = () => ({
    version: '2.1',
    exportedAt: new Date().toISOString(),
    employees,
    attendanceLogs,
    leaveRequests,
    payrollRuns,
    revisions,
    investmentDeclarations,
    companyInfo,
    companyAuditLogs,
    hrSettings,
    userCredentials,
    documentTemplates
  });

  const exportFullSystemBackup = () => {
    const backupPayload = getSystemBackupPayload();
    const blob = new Blob([JSON.stringify(backupPayload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ATCL_HRMS_Full_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const restoreSystemBackup = (backupData) => {
    if (!backupData || typeof backupData !== 'object') throw new Error('Invalid backup data format');
    if (Array.isArray(backupData.employees)) setEmployees(backupData.employees);
    if (Array.isArray(backupData.attendanceLogs)) setAttendanceLogs(backupData.attendanceLogs);
    if (Array.isArray(backupData.leaveRequests)) setLeaveRequests(backupData.leaveRequests);
    if (Array.isArray(backupData.payrollRuns)) setPayrollRuns(backupData.payrollRuns);
    if (Array.isArray(backupData.revisions)) setRevisions(backupData.revisions);
    if (backupData.investmentDeclarations) setInvestmentDeclarations(backupData.investmentDeclarations);
    if (backupData.companyInfo) setCompanyInfo(backupData.companyInfo);
    if (Array.isArray(backupData.companyAuditLogs)) setCompanyAuditLogs(backupData.companyAuditLogs);
    if (backupData.hrSettings) setHrSettings({ ...DEFAULT_HR_SETTINGS, ...backupData.hrSettings });
    if (Array.isArray(backupData.userCredentials)) setUserCredentials(backupData.userCredentials);
    if (Array.isArray(backupData.documentTemplates)) setDocumentTemplates(backupData.documentTemplates);
    return true;
  };

  const resetToFactorySeeds = () => {
    const seededEmps = generateMockEmployees();
    setEmployees(seededEmps);
    setAttendanceLogs(generateMockAttendance(seededEmps));
    setLeaveRequests(generateMockLeaveRequests(seededEmps));
    setPayrollRuns([]);
    setRevisions([]);
    setCompanyInfo(SEED_COMPANY_INFO);
    setCompanyAuditLogs(SEED_AUDIT_LOGS);
    setHrSettings(DEFAULT_HR_SETTINGS);
    setDocumentTemplates(SEED_DOCUMENT_TEMPLATES);
    const seededCreds = USER_SEEDS.map(seed => ({
      username: seed.id.trim().toLowerCase(),
      fullName: seed.name,
      email: seed.email.trim().toLowerCase(),
      employeeCode: seed.employeeCode,
      password: seed.otp || '123456',
      mustChangePassword: true
    }));
    setUserCredentials(seededCreds);
  };

  return (
    <HRMSContext.Provider value={{
      employees,
      attendanceLogs,
      leaveRequests,
      payrollRuns,
      revisions,
      investmentDeclarations,
      theme,
      currentUser,
      dbConnected, // expose MySQL database connection status
      toggleTheme,
      addEmployee,
      updateEmployee,
      deleteEmployee,
      logAttendance,
      addAttendanceCorrection,
      addLeaveRequest,
      approveLeaveRequest,
      runMonthlyPayroll,
      reviseSalary,
      updateTaxDeclaration,
      loginMode,
      activeEmployeeCode,
      switchLoginMode,
      updateEmployeePersonal,
      companyInfo,
      companyAuditLogs,
      updateCompanyInfo,
      addCompanyBranch,
      updateCompanyBranch,
      deleteCompanyBranch,
      addCompanyBankAccount,
      deleteCompanyBankAccount,
      uploadCompanyDocument,
      movementLogs,
      breakLogs,
      correctionLogs,
      checkInEmployee,
      checkOutEmployee,
      startBreak,
      endBreak,
      logFieldMovement,
      approveAttendanceLog,
      login,
      loginGoogle,
      logout,
      resetPassword,
      changePassword: async (employeeCode, newPassword) => {
        return await updateUserPassword(employeeCode, newPassword);
      },
      authLoading,
      isAdminUser: !!adminUser,  // true when the real logged-in user is an admin
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
      documentTemplates,
      saveDocumentTemplate,
      duplicateDocumentTemplate,
      deleteDocumentTemplate,
      toggleFeatureDocumentTemplate,
      resetSystemDocumentTemplate,
      importDocumentTemplates,
      attachGeneratedDocToEmployee
    }}>
      {children}
    </HRMSContext.Provider>
  );
};
