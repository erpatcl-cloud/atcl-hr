/**
 * templateEngine.js
 * Dynamic HR Document & Monthly Payroll Sheet Template Engine for ATCL HRMS.
 * Supports:
 *  - Bangladeshi currency formatting & Taka-in-words conversion (Crore / Lakh / Thousand)
 *  - Placeholder substitution ({{employee.*}}, {{salary.*}}, {{company.*}}, {{payroll.*}}, {{input.*}})
 *  - Repeating table row blocks ({{#rows}}...{{/rows}}) for Monthly Salary Approval & Bank Confirmation Sheets
 *  - Print / Save as A4 PDF, MS Word (.doc) download, and Rich Clipboard Copy
 */

import { calculateBangladeshTax, REGIONS, TAX_YEARS } from './taxCalculator';

const ONES = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
  'Seventeen', 'Eighteen', 'Nineteen'
];

const TENS = [
  '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'
];

function twoDigitWords(n) {
  if (n === 0) return '';
  if (n < 20) return ONES[n];
  const ten = Math.floor(n / 10);
  const rest = n % 10;
  return `${TENS[ten]}${rest ? ' ' + ONES[rest] : ''}`;
}

function threeDigitWords(n) {
  if (n === 0) return '';
  const hundred = Math.floor(n / 100);
  const rest = n % 100;
  const hundredPart = hundred ? `${ONES[hundred]} Hundred` : '';
  const restPart = twoDigitWords(rest);
  return [hundredPart, restPart].filter(Boolean).join(' ');
}

/**
 * Converts a number into Bangladeshi Taka words (Crore, Lakh, Thousand, Hundred)
 */
export function numberToBDTWords(amount) {
  const num = Math.round(Math.abs(Number(amount) || 0));
  if (num === 0) return 'Taka Zero Only';

  let remaining = num;
  const parts = [];

  const crore = Math.floor(remaining / 10000000);
  remaining %= 10000000;
  if (crore > 0) {
    parts.push(`${threeDigitWords(crore)} Crore`);
  }

  const lakh = Math.floor(remaining / 100000);
  remaining %= 100000;
  if (lakh > 0) {
    parts.push(`${twoDigitWords(lakh)} Lakh`);
  }

  const thousand = Math.floor(remaining / 1000);
  remaining %= 1000;
  if (thousand > 0) {
    parts.push(`${twoDigitWords(thousand)} Thousand`);
  }

  if (remaining > 0) {
    parts.push(threeDigitWords(remaining));
  }

  return `Taka ${parts.join(' ')} Only`;
}

/**
 * Formats a number in Bangladeshi comma style (e.g., 1,25,000)
 */
export function formatBDT(value) {
  const num = Math.round(Number(value) || 0);
  return num.toLocaleString('en-IN');
}

/**
 * Formats an ISO date string (YYYY-MM-DD) into a readable formal date (e.g., 02 November 2026)
 */
export function formatFormalDate(dateInput) {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return String(dateInput);
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
}

/**
 * Converts "2026-11" into "November 2026"
 */
export function formatMonthLabel(monthKey) {
  if (!monthKey || !monthKey.includes('-')) return monthKey || '';
  const [y, m] = monthKey.split('-').map(Number);
  const d = new Date(y, (m || 1) - 1, 1);
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

/**
 * Categorized placeholders for the Template Studio Placeholder Picker
 */
export const PLACEHOLDER_GROUPS = [
  {
    group: 'Employee Profile',
    items: [
      { token: '{{employee.fullNameEnglish}}', label: 'Full Name (English)' },
      { token: '{{employee.fullNameBangla}}', label: 'Full Name (Bangla)' },
      { token: '{{employee.employeeCode}}', label: 'Employee ID / Code' },
      { token: '{{employee.designation}}', label: 'Designation' },
      { token: '{{employee.department}}', label: 'Department' },
      { token: '{{employee.joiningDate}}', label: 'Joining Date (Formal)' },
      { token: '{{employee.dob}}', label: 'Date of Birth' },
      { token: '{{employee.nid}}', label: 'National ID (NID)' },
      { token: '{{employee.tin}}', label: 'TIN Number' },
      { token: '{{employee.taxZone}}', label: 'Tax Zone' },
      { token: '{{employee.taxCircle}}', label: 'Tax Circle' },
      { token: '{{employee.mobileNumber}}', label: 'Mobile Number' },
      { token: '{{employee.emailAddress}}', label: 'Official Email' },
      { token: '{{employee.fatherName}}', label: 'Father Name' },
      { token: '{{employee.motherName}}', label: 'Mother Name' },
      { token: '{{employee.presentAddress}}', label: 'Present Address' },
      { token: '{{employee.permanentAddress}}', label: 'Permanent Address' },
      { token: '{{employee.bankName}}', label: 'Employee Bank Name' },
      { token: '{{employee.bankAccountNo}}', label: 'Employee Bank A/C No' }
    ]
  },
  {
    group: 'Salary & Compensation',
    items: [
      { token: '{{salary.gross}}', label: 'Monthly Gross Salary (BDT)' },
      { token: '{{salary.grossInWords}}', label: 'Gross Salary in Words' },
      { token: '{{salary.basic}}', label: 'Basic Salary (50%)' },
      { token: '{{salary.houseRent}}', label: 'House Rent Allowance (25%)' },
      { token: '{{salary.medical}}', label: 'Medical Allowance (10%)' },
      { token: '{{salary.conveyance}}', label: 'Conveyance Allowance (10%)' },
      { token: '{{salary.mobile}}', label: 'Mobile / Other Allowance (5%)' },
      { token: '{{salary.annualGross}}', label: 'Annual Gross Salary (12 Months)' },
      { token: '{{salary.monthlyTDS}}', label: 'Estimated Monthly Tax (TDS)' },
      { token: '{{salary.netMonthly}}', label: 'Net Monthly Take-Home Pay' },
      { token: '{{salary.netMonthlyInWords}}', label: 'Net Monthly Pay in Words' }
    ]
  },
  {
    group: 'Monthly Payroll & Bank Sheet',
    items: [
      { token: '{{payroll.monthLabel}}', label: 'Salary Month (e.g. November 2026)' },
      { token: '{{payroll.processedDate}}', label: 'Sheet Preparation Date' },
      { token: '{{payroll.employeeCount}}', label: 'Total Employees in Sheet' },
      { token: '{{payroll.bankFilterLabel}}', label: 'Selected Bank Name' },
      { token: '{{payroll.companyBankName}}', label: 'Company Disbursing Bank Name' },
      { token: '{{payroll.companyBankBranch}}', label: 'Company Bank Branch' },
      { token: '{{payroll.companyBankAccountNo}}', label: 'Company Bank Account No' },
      { token: '{{payroll.totalBasic}}', label: 'Total Basic Salary' },
      { token: '{{payroll.totalHouseRent}}', label: 'Total House Rent' },
      { token: '{{payroll.totalMedical}}', label: 'Total Medical Allowance' },
      { token: '{{payroll.totalConveyance}}', label: 'Total Conveyance' },
      { token: '{{payroll.totalMobile}}', label: 'Total Mobile / Other' },
      { token: '{{payroll.totalBonus}}', label: 'Total Festival Bonus' },
      { token: '{{payroll.totalGross}}', label: 'Total Gross Earnings' },
      { token: '{{payroll.totalTDS}}', label: 'Total Income Tax (TDS)' },
      { token: '{{payroll.totalLWP}}', label: 'Total LWP / Absence Deduction' },
      { token: '{{payroll.totalDeductions}}', label: 'Total Deductions' },
      { token: '{{payroll.totalNet}}', label: 'Total Net Payable Salary' },
      { token: '{{payroll.totalNetInWords}}', label: 'Total Net Payable in Words' },
      { token: '{{#rows}} ... {{/rows}}', label: 'Repeating Employee Table Row Block' }
    ]
  },
  {
    group: 'Row Fields (Inside {{#rows}}...{{/rows}})',
    items: [
      { token: '{{row.sl}}', label: 'Serial No (1, 2, 3...)' },
      { token: '{{row.employeeCode}}', label: 'Employee ID' },
      { token: '{{row.name}}', label: 'Employee Name' },
      { token: '{{row.designation}}', label: 'Designation' },
      { token: '{{row.department}}', label: 'Department' },
      { token: '{{row.bankName}}', label: 'Bank Name' },
      { token: '{{row.accountNo}}', label: 'Bank Account No' },
      { token: '{{row.basicSalary}}', label: 'Basic Salary' },
      { token: '{{row.houseRent}}', label: 'House Rent' },
      { token: '{{row.medicalAllowance}}', label: 'Medical Allowance' },
      { token: '{{row.conveyanceAllowance}}', label: 'Conveyance Allowance' },
      { token: '{{row.mobileAllowance}}', label: 'Mobile Allowance' },
      { token: '{{row.allowancesTotal}}', label: 'Total Allowances (HR+Med+Conv+Mob)' },
      { token: '{{row.bonusPay}}', label: 'Bonus Pay' },
      { token: '{{row.grossSalary}}', label: 'Gross Payable' },
      { token: '{{row.taxDeduction}}', label: 'TDS Deduction' },
      { token: '{{row.unpaidLeaveDeduction}}', label: 'LWP / Unpaid Leave Deduction' },
      { token: '{{row.totalDeductions}}', label: 'Total Deductions' },
      { token: '{{row.netSalary}}', label: 'Net Payable Salary' }
    ]
  },
  {
    group: 'Company, Date & Signatory',
    items: [
      { token: '{{today}}', label: 'Current Date (Formal)' },
      { token: '{{refNo}}', label: 'Document Reference No' },
      { token: '{{company.name}}', label: 'Company Legal Name' },
      { token: '{{company.shortName}}', label: 'Company Short Name (ATCL)' },
      { token: '{{company.address}}', label: 'Head Office Address' },
      { token: '{{company.phone}}', label: 'Official Phone' },
      { token: '{{company.email}}', label: 'Official Email' },
      { token: '{{company.website}}', label: 'Company Website' },
      { token: '{{company.tin}}', label: 'Company TIN' },
      { token: '{{company.bin}}', label: 'Company BIN / VAT' },
      { token: '{{signatory.name}}', label: 'Signatory Full Name' },
      { token: '{{signatory.designation}}', label: 'Signatory Designation' }
    ]
  }
];

/**
 * Builds a live payroll dataset for a given monthKey, either from an existing processed run
 * or dynamically computed from active employees so HR can preview/generate approval & bank sheets anytime.
 */
export function buildMonthlyPayrollDataset({
  monthKey = new Date().toISOString().slice(0, 7),
  payrollRuns = [],
  employees = [],
  investmentDeclarations = {},
  bonusType = 'None',
  bonusPercent = 0,
  bankFilter = 'ALL'
}) {
  const existingRun = (payrollRuns || []).find(r => r.month === monthKey);
  let rawRows = [];

  if (existingRun && Array.isArray(existingRun.rows) && existingRun.rows.length > 0) {
    rawRows = existingRun.rows;
  } else {
    // Dynamically compute rows from active employees
    rawRows = (employees || [])
      .filter(e => e.status === 'Active')
      .map(emp => {
        const gross = Number(emp.grossSalary) || 0;
        const comps = emp.salaryComponents || {
          basicSalary: Math.round(gross * 0.5),
          houseRent: Math.round(gross * 0.25),
          medicalAllowance: Math.round(gross * 0.1),
          conveyanceAllowance: Math.round(gross * 0.1),
          mobileAllowance: Math.max(0, gross - Math.round(gross * 0.5) - Math.round(gross * 0.25) - Math.round(gross * 0.1) - Math.round(gross * 0.1)),
          otherAllowances: 0
        };
        const bonusPay = bonusType !== 'None' ? Math.round(comps.basicSalary * ((Number(bonusPercent) || 0) / 100)) : 0;
        const decl = investmentDeclarations?.[emp.employeeCode] || {};
        const annualBasic = comps.basicSalary * 12;
        const annualAllowances = (comps.houseRent + comps.medicalAllowance + comps.conveyanceAllowance + comps.mobileAllowance + (comps.otherAllowances || 0)) * 12;
        const annualBonuses = comps.basicSalary * 2;
        const taxReport = calculateBangladeshTax({
          basicSalary: annualBasic,
          allowances: annualAllowances,
          bonuses: annualBonuses,
          gender: emp.gender,
          dob: emp.dob,
          age: 30,
          taxpayerCategory: decl.taxpayerCategory && decl.taxpayerCategory !== 'auto' ? decl.taxpayerCategory : undefined,
          isDisabled: !!decl.isDisabled,
          isFreedomFighter: !!decl.isFreedomFighter,
          isParentOfDisabled: !!decl.isParentOfDisabled,
          disabledChildrenCount: decl.disabledChildrenCount || 1,
          investmentDetails: decl,
          region: decl.region || REGIONS.DHAKA_CHITTAGONG,
          taxYear: decl.taxYear || TAX_YEARS['2025-2026']
        });
        const taxDeduction = Math.round(taxReport.monthlyTaxDeduction || 0);
        const grossMonthly = comps.basicSalary + comps.houseRent + comps.medicalAllowance + comps.conveyanceAllowance + comps.mobileAllowance + (comps.otherAllowances || 0) + bonusPay;
        const totalDeductions = taxDeduction;
        const netSalary = Math.max(0, grossMonthly - totalDeductions);

        return {
          employeeCode: emp.employeeCode,
          name: emp.fullNameEnglish,
          designation: emp.designation,
          department: emp.department,
          bankName: emp.bankName || 'Al-Arafah Islami Bank Ltd.',
          accountNo: emp.bankAccountNo || 'N/A',
          basicSalary: comps.basicSalary,
          houseRent: comps.houseRent,
          medicalAllowance: comps.medicalAllowance,
          conveyanceAllowance: comps.conveyanceAllowance,
          mobileAllowance: comps.mobileAllowance + (comps.otherAllowances || 0),
          bonusPay,
          grossSalary: grossMonthly,
          taxDeduction,
          unpaidLeaveDeduction: 0,
          totalDeductions,
          netSalary
        };
      });
  }

  const filteredRows =
    bankFilter && bankFilter !== 'ALL'
      ? rawRows.filter(r => (r.bankName || '').toLowerCase() === bankFilter.toLowerCase())
      : rawRows;

  const totals = filteredRows.reduce(
    (acc, r) => {
      const allowances =
        (Number(r.houseRent) || 0) +
        (Number(r.medicalAllowance) || 0) +
        (Number(r.conveyanceAllowance) || 0) +
        (Number(r.mobileAllowance) || 0) +
        (Number(r.otherAllowances) || 0);
      acc.basic += Number(r.basicSalary) || 0;
      acc.houseRent += Number(r.houseRent) || 0;
      acc.medical += Number(r.medicalAllowance) || 0;
      acc.conveyance += Number(r.conveyanceAllowance) || 0;
      acc.mobile += (Number(r.mobileAllowance) || 0) + (Number(r.otherAllowances) || 0);
      acc.allowances += allowances;
      acc.bonus += Number(r.bonusPay) || 0;
      acc.gross += Number(r.grossSalary) || 0;
      acc.tds += Number(r.taxDeduction) || 0;
      acc.lwp += Number(r.unpaidLeaveDeduction) || 0;
      acc.deductions += Number(r.totalDeductions) || 0;
      acc.net += Number(r.netSalary) || 0;
      return acc;
    },
    {
      basic: 0,
      houseRent: 0,
      medical: 0,
      conveyance: 0,
      mobile: 0,
      allowances: 0,
      bonus: 0,
      gross: 0,
      tds: 0,
      lwp: 0,
      deductions: 0,
      net: 0
    }
  );

  return {
    monthKey,
    monthLabel: formatMonthLabel(monthKey),
    processedDate: existingRun?.processedDate ? formatFormalDate(existingRun.processedDate) : formatFormalDate(new Date()),
    bonusType: existingRun?.bonusType || bonusType,
    rows: filteredRows,
    totals
  };
}

/**
 * Renders a template into complete HTML with all placeholders and repeating rows resolved.
 */
export function renderTemplateHtml({
  template,
  employee = null,
  companyInfo = {},
  payrollDataset = null,
  investmentDeclarations = {},
  customInputs = {},
  refNo = 'ATCL/HR/2026/001',
  signatoryOverride = null,
  companyBankAccount = null,
  bankFilter = 'ALL'
}) {
  if (!template) return '';

  const emp = employee || {};
  const gross = Number(emp.grossSalary) || 0;
  const comps = emp.salaryComponents || {
    basicSalary: Math.round(gross * 0.5),
    houseRent: Math.round(gross * 0.25),
    medicalAllowance: Math.round(gross * 0.1),
    conveyanceAllowance: Math.round(gross * 0.1),
    mobileAllowance: Math.max(0, gross - Math.round(gross * 0.5) - Math.round(gross * 0.25) - Math.round(gross * 0.1) - Math.round(gross * 0.1)),
    otherAllowances: 0
  };

  // Compute employee tax for {{salary.monthlyTDS}} and {{salary.netMonthly}}
  const decl = (emp.employeeCode && investmentDeclarations?.[emp.employeeCode]) || {};
  const taxCalc = calculateBangladeshTax({
    basicSalary: (comps.basicSalary || 0) * 12,
    allowances: ((comps.houseRent || 0) + (comps.medicalAllowance || 0) + (comps.conveyanceAllowance || 0) + (comps.mobileAllowance || 0)) * 12,
    bonuses: (comps.basicSalary || 0) * 2,
    gender: emp.gender || 'male',
    dob: emp.dob,
    age: 30,
    investmentDetails: decl,
    region: decl.region || REGIONS.DHAKA_CHITTAGONG,
    taxYear: decl.taxYear || TAX_YEARS['2025-2026']
  });
  const monthlyTDS = Math.round(taxCalc.monthlyTaxDeduction || 0);
  const netMonthly = Math.max(0, gross - monthlyTDS);

  const primaryCompanyBank =
    companyBankAccount ||
    (Array.isArray(companyInfo?.bankAccounts) && companyInfo.bankAccounts[0]) || {
      bankName: 'Al-Arafah Islami Bank PLC',
      branchName: 'Banani Branch, Dhaka',
      accountNumber: '0151020009876',
      accountName: companyInfo?.legalName || 'Advance Technology Consortium Ltd. (ATCL)'
    };

  const signatory = {
    name: signatoryOverride?.name || template.signatory?.name || companyInfo?.keyPersonnel?.mdName || 'Authorized Signatory',
    designation: signatoryOverride?.designation || template.signatory?.designation || 'Managing Director'
  };

  let html = template.body || '';

  // 1. Expand repeating {{#rows}} ... {{/rows}} blocks if present
  const rowsRegex = /\{\{#rows\}\}([\s\S]*?)\{\{\/rows\}\}/g;
  if (rowsRegex.test(html)) {
    const rows = payrollDataset?.rows || [];
    html = html.replace(rowsRegex, (_, rowTemplate) => {
      if (rows.length === 0) {
        return `<tr><td colspan="12" style="text-align:center;padding:16px;color:#64748b;">No employee payroll records found for the selected filter.</td></tr>`;
      }
      return rows
        .map((r, idx) => {
          const allowancesTotal =
            (Number(r.houseRent) || 0) +
            (Number(r.medicalAllowance) || 0) +
            (Number(r.conveyanceAllowance) || 0) +
            (Number(r.mobileAllowance) || 0) +
            (Number(r.otherAllowances) || 0);
          const rowMap = {
            'row.sl': String(idx + 1),
            'row.employeeCode': r.employeeCode || '',
            'row.name': r.name || '',
            'row.designation': r.designation || '',
            'row.department': r.department || '',
            'row.bankName': r.bankName || '',
            'row.accountNo': r.accountNo || '',
            'row.basicSalary': formatBDT(r.basicSalary),
            'row.houseRent': formatBDT(r.houseRent),
            'row.medicalAllowance': formatBDT(r.medicalAllowance),
            'row.conveyanceAllowance': formatBDT(r.conveyanceAllowance),
            'row.mobileAllowance': formatBDT(r.mobileAllowance),
            'row.allowancesTotal': formatBDT(allowancesTotal),
            'row.bonusPay': formatBDT(r.bonusPay),
            'row.grossSalary': formatBDT(r.grossSalary),
            'row.taxDeduction': formatBDT(r.taxDeduction),
            'row.unpaidLeaveDeduction': formatBDT(r.unpaidLeaveDeduction),
            'row.totalDeductions': formatBDT(r.totalDeductions),
            'row.netSalary': formatBDT(r.netSalary)
          };
          return rowTemplate.replace(/\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g, (m, key) =>
            Object.prototype.hasOwnProperty.call(rowMap, key) ? rowMap[key] : m
          );
        })
        .join('\n');
    });
  }

  // 2. Build flat lookup map for scalar placeholders
  const totals = payrollDataset?.totals || {
    basic: 0,
    houseRent: 0,
    medical: 0,
    conveyance: 0,
    mobile: 0,
    allowances: 0,
    bonus: 0,
    gross: 0,
    tds: 0,
    lwp: 0,
    deductions: 0,
    net: 0
  };

  const map = {
    today: formatFormalDate(new Date()),
    refNo: refNo || 'ATCL/HR/2026/001',

    // Employee
    'employee.fullNameEnglish': emp.fullNameEnglish || '',
    'employee.fullNameBangla': emp.fullNameBangla || '',
    'employee.employeeCode': emp.employeeCode || '',
    'employee.designation': emp.designation || '',
    'employee.department': emp.department || '',
    'employee.joiningDate': formatFormalDate(emp.joiningDate),
    'employee.dob': formatFormalDate(emp.dob),
    'employee.nid': emp.nid || '',
    'employee.tin': emp.tin || 'N/A',
    'employee.taxZone': emp.taxZone || 'Zone 15',
    'employee.taxCircle': emp.taxCircle || 'Circle 1',
    'employee.mobileNumber': emp.mobileNumber || '',
    'employee.emailAddress': emp.emailAddress || '',
    'employee.fatherName': emp.fatherName || '',
    'employee.motherName': emp.motherName || '',
    'employee.presentAddress': emp.presentAddress || 'Dhaka, Bangladesh',
    'employee.permanentAddress': emp.permanentAddress || 'Bangladesh',
    'employee.bankName': emp.bankName || 'Al-Arafah Islami Bank Ltd.',
    'employee.bankAccountNo': emp.bankAccountNo || 'N/A',

    // Salary
    'salary.gross': formatBDT(gross),
    'salary.grossInWords': numberToBDTWords(gross),
    'salary.basic': formatBDT(comps.basicSalary),
    'salary.houseRent': formatBDT(comps.houseRent),
    'salary.medical': formatBDT(comps.medicalAllowance),
    'salary.conveyance': formatBDT(comps.conveyanceAllowance),
    'salary.mobile': formatBDT((comps.mobileAllowance || 0) + (comps.otherAllowances || 0)),
    'salary.annualGross': formatBDT(gross * 12),
    'salary.monthlyTDS': formatBDT(monthlyTDS),
    'salary.netMonthly': formatBDT(netMonthly),
    'salary.netMonthlyInWords': numberToBDTWords(netMonthly),

    // Company
    'company.name': companyInfo?.legalName || 'Advance Technology Consortium Ltd. (ATCL)',
    'company.shortName': companyInfo?.shortName || 'ATCL',
    'company.address': companyInfo?.headOfficeAddress || 'House # 12, Road # 05, Banani, Dhaka-1213, Bangladesh',
    'company.phone': companyInfo?.officialPhone || '+880-2-55042100',
    'company.email': companyInfo?.officialEmail || 'erpatcl@gmail.com',
    'company.website': companyInfo?.website || 'www.atcbd.net',
    'company.tin': companyInfo?.taxRegistrations?.tin || '458963147852',
    'company.bin': companyInfo?.taxRegistrations?.bin || '001245789-0101',

    // Signatory
    'signatory.name': signatory.name,
    'signatory.designation': signatory.designation,

    // Payroll & Bank Sheet
    'payroll.monthLabel': payrollDataset?.monthLabel || formatMonthLabel(new Date().toISOString().slice(0, 7)),
    'payroll.processedDate': payrollDataset?.processedDate || formatFormalDate(new Date()),
    'payroll.employeeCount': String(payrollDataset?.rows?.length || 0),
    'payroll.bankFilterLabel': bankFilter && bankFilter !== 'ALL' ? bankFilter : 'All Disbursing Banks',
    'payroll.companyBankName': primaryCompanyBank.bankName || 'Al-Arafah Islami Bank PLC',
    'payroll.companyBankBranch': primaryCompanyBank.branchName || 'Banani Branch, Dhaka',
    'payroll.companyBankAccountNo': primaryCompanyBank.accountNumber || '0151020009876',
    'payroll.totalBasic': formatBDT(totals.basic),
    'payroll.totalHouseRent': formatBDT(totals.houseRent),
    'payroll.totalMedical': formatBDT(totals.medical),
    'payroll.totalConveyance': formatBDT(totals.conveyance),
    'payroll.totalMobile': formatBDT(totals.mobile),
    'payroll.totalAllowances': formatBDT(totals.allowances),
    'payroll.totalBonus': formatBDT(totals.bonus),
    'payroll.totalGross': formatBDT(totals.gross),
    'payroll.totalTDS': formatBDT(totals.tds),
    'payroll.totalLWP': formatBDT(totals.lwp),
    'payroll.totalDeductions': formatBDT(totals.deductions),
    'payroll.totalNet': formatBDT(totals.net),
    'payroll.totalNetInWords': numberToBDTWords(totals.net)
  };

  // Custom inputs from template definition
  if (Array.isArray(template.customFields)) {
    template.customFields.forEach(cf => {
      const val = customInputs?.[cf.key] ?? cf.defaultValue ?? '';
      map[`input.${cf.key}`] = val;
    });
  }
  if (customInputs && typeof customInputs === 'object') {
    Object.entries(customInputs).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        map[`input.${k}`] = v;
      }
    });
  }

  // Replace scalar placeholders
  html = html.replace(/\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g, (match, key) => {
    if (Object.prototype.hasOwnProperty.call(map, key)) {
      const val = map[key];
      if (val === '' || val === undefined || val === null) {
        return `<span style="background:rgba(245,158,11,0.2);color:#b45309;padding:0 4px;border-radius:3px;">[${key}]</span>`;
      }
      return val;
    }
    return match;
  });

  // Wrap with Corporate Letterhead if enabled
  if (template.useLetterhead !== false) {
    const companyName = map['company.name'];
    const companyAddr = map['company.address'];
    const companyPhone = map['company.phone'];
    const companyEmail = map['company.email'];
    const companyWeb = map['company.website'];

    html = `
      <div class="atcl-doc-page" style="font-family:'Plus Jakarta Sans','Segoe UI',Arial,sans-serif;color:#0f172a;line-height:1.65;font-size:10.5pt;">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px double #0a3d7a;padding-bottom:12px;margin-bottom:20px;">
          <div>
            <div style="font-size:15pt;font-weight:800;color:#0a3d7a;letter-spacing:-0.01em;">${companyName}</div>
            <div style="font-size:8.5pt;color:#475569;margin-top:2px;">${companyAddr}</div>
            <div style="font-size:8pt;color:#64748b;margin-top:2px;">Phone: ${companyPhone} &nbsp;|&nbsp; Email: ${companyEmail} &nbsp;|&nbsp; Web: ${companyWeb}</div>
          </div>
          <div style="text-align:right;">
            <div style="display:inline-block;padding:6px 12px;border-radius:6px;background:#0a3d7a;color:#fff;font-weight:800;font-size:11pt;letter-spacing:0.06em;">ATCL</div>
            <div style="font-size:7.5pt;color:#64748b;margin-top:4px;">TIN: ${map['company.tin']}</div>
          </div>
        </div>
        <div class="atcl-doc-body">
          ${html}
        </div>
      </div>
    `;
  } else {
    html = `<div class="atcl-doc-page" style="font-family:'Plus Jakarta Sans','Segoe UI',Arial,sans-serif;color:#0f172a;line-height:1.65;font-size:10.5pt;">${html}</div>`;
  }

  return html;
}

/**
 * Opens a clean print / Save-as-PDF window with A4 or Landscape styling.
 */
export function printRenderedDocument(htmlPages, { title = 'ATCL HR Document', landscape = false } = {}) {
  const pagesArray = Array.isArray(htmlPages) ? htmlPages : [htmlPages];
  const joinedPages = pagesArray
    .map(
      (pageHtml, idx) =>
        `<div class="print-page-sheet" style="${idx < pagesArray.length - 1 ? 'page-break-after: always;' : ''}">${pageHtml}</div>`
    )
    .join('\n');

  const printWin = window.open('', '_blank', 'width=980,height=820');
  if (!printWin) {
    alert('Please allow pop-ups in your browser to print or save as PDF.');
    return;
  }

  printWin.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    @page {
      size: A4 ${landscape ? 'landscape' : 'portrait'};
      margin: ${landscape ? '12mm 12mm' : '16mm 18mm'};
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 20px;
      background: #f1f5f9;
      font-family: 'Plus Jakarta Sans', 'Segoe UI', Arial, sans-serif;
      color: #0f172a;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .print-toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      max-width: ${landscape ? '275mm' : '210mm'};
      margin: 0 auto 16px;
      padding: 10px 16px;
      background: #0a3d7a;
      color: #fff;
      border-radius: 8px;
    }
    .print-toolbar button {
      background: #06b6d4;
      color: #fff;
      border: none;
      padding: 8px 16px;
      border-radius: 6px;
      font-weight: 700;
      cursor: pointer;
      margin-left: 8px;
    }
    .print-page-sheet {
      background: #fff;
      max-width: ${landscape ? '275mm' : '210mm'};
      min-height: ${landscape ? '185mm' : '270mm'};
      margin: 0 auto 20px;
      padding: ${landscape ? '14mm' : '18mm 20mm'};
      box-shadow: 0 8px 24px rgba(15,23,42,0.12);
      border-radius: 4px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 10px 0;
    }
    th, td {
      border: 1px solid #cbd5e1;
      padding: 6px 8px;
      font-size: 9pt;
    }
    th {
      background: #f1f5f9;
      font-weight: 700;
      color: #0f172a;
    }
    @media print {
      body { background: #fff; padding: 0; }
      .print-toolbar { display: none !important; }
      .print-page-sheet {
        box-shadow: none;
        margin: 0;
        padding: 0;
        max-width: 100%;
        min-height: auto;
      }
    }
  </style>
</head>
<body>
  <div class="print-toolbar">
    <div><strong>${title}</strong> — Ready for Print or "Save as PDF"</div>
    <div>
      <button onclick="window.print()">🖨️ Print / Save as PDF</button>
      <button onclick="window.close()" style="background:#475569;">Close</button>
    </div>
  </div>
  ${joinedPages}
  <script>
    setTimeout(() => { window.focus(); }, 300);
  </script>
</body>
</html>`);
  printWin.document.close();
}

/**
 * Downloads the rendered HTML as a Microsoft Word (.doc) file.
 */
export function downloadRenderedWordDoc(htmlContent, fileName = 'ATCL_Document') {
  const cleanName = fileName.replace(/[^a-zA-Z0-9_-]/g, '_');
  const wordDoc = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office'
          xmlns:w='urn:schemas-microsoft-com:office:word'
          xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset="utf-8">
      <title>${cleanName}</title>
      <style>
        body { font-family: 'Calibri', 'Arial', sans-serif; font-size: 11pt; color: #0f172a; line-height: 1.5; }
        table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        th, td { border: 1px solid #94a3b8; padding: 6px 8px; font-size: 9.5pt; }
        th { background-color: #e2e8f0; font-weight: bold; }
      </style>
    </head>
    <body>
      ${htmlContent}
    </body>
    </html>
  `;
  const blob = new Blob(['\ufeff', wordDoc], { type: 'application/msword;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${cleanName}.doc`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Copies both rich HTML and plain text to the clipboard so users can paste directly into Word, Gmail, or Google Docs.
 */
export async function copyRenderedToClipboard(htmlContent) {
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = htmlContent;
  const plainText = tempDiv.innerText || tempDiv.textContent || '';

  if (navigator.clipboard && window.ClipboardItem) {
    try {
      const htmlBlob = new Blob([htmlContent], { type: 'text/html' });
      const textBlob = new Blob([plainText], { type: 'text/plain' });
      await navigator.clipboard.write([
        new window.ClipboardItem({
          'text/html': htmlBlob,
          'text/plain': textBlob
        })
      ]);
      return true;
    } catch {
      // Fallback to writeText below
    }
  }
  await navigator.clipboard.writeText(plainText);
  return true;
}

