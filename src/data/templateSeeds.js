/**
 * templateSeeds.js
 * 14 Built-in Starter Templates for ATCL Enterprise HRMS:
 *  - Joining Letter (Emphasized / Featured)
 *  - Appointment Letter (Emphasized / Featured)
 *  - Resignation Acceptance Letter (Emphasized / Featured)
 *  - Resignation Letter (Employee Format)
 *  - Monthly Salary Approval Sheet (Emphasized / Featured)
 *  - Bank Salary Confirmation / Transfer Advice Sheet (Emphasized / Featured)
 *  - Salary Increment & Revision Letter (Emphasized / Featured)
 *  - Service Confirmation Letter (Post-Probation)
 *  - Experience & Service Certificate
 *  - Final Release & No-Dues Clearance Certificate
 *  - Salary Certificate (To Whom It May Concern)
 *  - No Objection Certificate (NOC for Visa / Passport / Loan)
 *  - Show-Cause / Disciplinary Notice
 *  - Official Leave Approval Letter
 */

export const TEMPLATE_CATEGORIES = [
  'All',
  'Onboarding',
  'Payroll & Bank',
  'Employment Changes',
  'Exit',
  'Certificates',
  'Disciplinary',
  'Custom'
];

export const SEED_DOCUMENT_TEMPLATES = [
  // 1. APPOINTMENT LETTER (EMPHASIZED / FEATURED)
  {
    id: 'tpl-appointment-letter',
    name: 'Appointment Letter (Official Offer of Employment)',
    category: 'Onboarding',
    type: 'letter',
    description: 'Comprehensive letter of appointment with full salary breakdown (Basic, House Rent, Medical, Conveyance, Mobile), probation period, and terms of service.',
    isSystem: true,
    isFeatured: true,
    useLetterhead: true,
    pageSize: 'A4',
    signatory: { name: 'Managing Director', designation: 'Managing Director, ATCL' },
    customFields: [
      { key: 'effectiveJoiningDate', label: 'Effective Joining Date', defaultValue: '01 November 2026' },
      { key: 'probationMonths', label: 'Probation Period (Months)', defaultValue: '6 (Six) Months' },
      { key: 'reportingTo', label: 'Reporting Supervisor / Head', defaultValue: 'Head of Department' },
      { key: 'workLocation', label: 'Posting / Work Location', defaultValue: 'ATCL Head Office, Dhaka' }
    ],
    version: 1,
    updatedAt: '2026-11-01T10:00:00Z',
    updatedBy: 'System Seed',
    body: `<div style="display:flex;justify-content:space-between;margin-bottom:16px;font-size:10pt;">
  <div><strong>Ref:</strong> {{refNo}}</div>
  <div><strong>Date:</strong> {{today}}</div>
</div>

<p style="margin-bottom:14px;">
  <strong>To,</strong><br/>
  <strong>{{employee.fullNameEnglish}}</strong><br/>
  Employee Code: {{employee.employeeCode}}<br/>
  Address: {{employee.presentAddress}}<br/>
  Mobile: {{employee.mobileNumber}}
</p>

<p style="margin-bottom:16px;font-weight:700;font-size:11pt;text-decoration:underline;color:#0a3d7a;">
  Subject: Letter of Appointment for the Post of "{{employee.designation}}"
</p>

<p>Dear <strong>{{employee.fullNameEnglish}}</strong>,</p>

<p style="margin-top:10px;text-align:justify;">
  With reference to your application and subsequent interview with the management of <strong>{{company.name}}</strong>, we are pleased to offer you an appointment as <strong>{{employee.designation}}</strong> in the department of <strong>{{employee.department}}</strong> with effect from <strong>{{input.effectiveJoiningDate}}</strong> under the following terms and conditions:
</p>

<h4 style="margin:14px 0 6px;color:#0a3d7a;font-size:10.5pt;">1. Compensation & Monthly Salary Breakdown</h4>
<p style="margin-bottom:8px;">You will receive a consolidated monthly Gross Salary of <strong>BDT {{salary.gross}} ({{salary.grossInWords}})</strong> structured as follows:</p>

<table style="width:100%;border-collapse:collapse;margin:8px 0 14px;">
  <thead>
    <tr style="background:#f1f5f9;">
      <th style="border:1px solid #cbd5e1;padding:7px 10px;text-align:left;">Salary Component</th>
      <th style="border:1px solid #cbd5e1;padding:7px 10px;text-align:center;">Policy Ratio</th>
      <th style="border:1px solid #cbd5e1;padding:7px 10px;text-align:right;">Monthly Amount (BDT)</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="border:1px solid #cbd5e1;padding:6px 10px;">Basic Salary</td>
      <td style="border:1px solid #cbd5e1;padding:6px 10px;text-align:center;">50%</td>
      <td style="border:1px solid #cbd5e1;padding:6px 10px;text-align:right;">{{salary.basic}}</td>
    </tr>
    <tr>
      <td style="border:1px solid #cbd5e1;padding:6px 10px;">House Rent Allowance</td>
      <td style="border:1px solid #cbd5e1;padding:6px 10px;text-align:center;">25%</td>
      <td style="border:1px solid #cbd5e1;padding:6px 10px;text-align:right;">{{salary.houseRent}}</td>
    </tr>
    <tr>
      <td style="border:1px solid #cbd5e1;padding:6px 10px;">Medical Allowance</td>
      <td style="border:1px solid #cbd5e1;padding:6px 10px;text-align:center;">10%</td>
      <td style="border:1px solid #cbd5e1;padding:6px 10px;text-align:right;">{{salary.medical}}</td>
    </tr>
    <tr>
      <td style="border:1px solid #cbd5e1;padding:6px 10px;">Conveyance Allowance</td>
      <td style="border:1px solid #cbd5e1;padding:6px 10px;text-align:center;">10%</td>
      <td style="border:1px solid #cbd5e1;padding:6px 10px;text-align:right;">{{salary.conveyance}}</td>
    </tr>
    <tr>
      <td style="border:1px solid #cbd5e1;padding:6px 10px;">Mobile & Utility Allowance</td>
      <td style="border:1px solid #cbd5e1;padding:6px 10px;text-align:center;">5%</td>
      <td style="border:1px solid #cbd5e1;padding:6px 10px;text-align:right;">{{salary.mobile}}</td>
    </tr>
    <tr style="background:#f8fafc;font-weight:700;">
      <td style="border:1px solid #cbd5e1;padding:7px 10px;" colspan="2">Total Monthly Gross Salary</td>
      <td style="border:1px solid #cbd5e1;padding:7px 10px;text-align:right;">BDT {{salary.gross}}</td>
    </tr>
  </tbody>
</table>

<h4 style="margin:12px 0 4px;color:#0a3d7a;font-size:10.5pt;">2. Probation, Posting & Reporting</h4>
<ul style="margin:4px 0 12px 20px;padding:0;">
  <li><strong>Probation Period:</strong> You will serve a probationary period of <strong>{{input.probationMonths}}</strong> from the date of joining. Upon satisfactory performance, your service will be confirmed in writing.</li>
  <li><strong>Place of Posting:</strong> Your initial place of posting will be at <strong>{{input.workLocation}}</strong>, and you will report to <strong>{{input.reportingTo}}</strong>.</li>
  <li><strong>Festival Bonuses & Leave:</strong> After confirmation, you will be entitled to two annual festival bonuses (each equivalent to 100% of Basic Salary) and statutory leaves as per ATCL HR policy.</li>
  <li><strong>Income Tax (TDS):</strong> Income tax at source (TDS) will be deducted monthly as per the Bangladesh Income Tax Act, 2023 & Finance Act 2026.</li>
  <li><strong>Notice Period:</strong> Either party may terminate this employment by providing 30 (thirty) days' written notice during probation or 60 (sixty) days' notice after confirmation.</li>
</ul>

<p style="margin-top:12px;">Please sign and return the duplicate copy of this letter as a token of your acceptance of the above terms.</p>

<div style="display:flex;justify-content:space-between;margin-top:44px;padding-top:12px;">
  <div>
    <div style="border-top:1px solid #0f172a;width:210px;padding-top:6px;font-weight:700;">{{signatory.name}}</div>
    <div style="font-size:9pt;color:#475569;">{{signatory.designation}}</div>
    <div style="font-size:9pt;color:#475569;">{{company.name}}</div>
  </div>
  <div>
    <div style="border-top:1px solid #0f172a;width:220px;padding-top:6px;font-weight:700;">Accepted By: {{employee.fullNameEnglish}}</div>
    <div style="font-size:9pt;color:#475569;">Signature & Date of Acceptance</div>
  </div>
</div>`
  },

  // 2. JOINING LETTER (EMPHASIZED / FEATURED)
  {
    id: 'tpl-joining-letter',
    name: 'Joining Letter / Joining Report',
    category: 'Onboarding',
    type: 'letter',
    description: 'Formal joining report and acknowledgement letter submitted upon an employee assuming duties at ATCL.',
    isSystem: true,
    isFeatured: true,
    useLetterhead: true,
    pageSize: 'A4',
    signatory: { name: 'Head of Human Resources', designation: 'Human Resources & Administration' },
    customFields: [
      { key: 'appointmentRef', label: 'Appointment Letter Reference', defaultValue: 'ATCL/HR/APT/2026' },
      { key: 'reportingTime', label: 'Reporting Time', defaultValue: '09:00 AM' },
      { key: 'supervisorName', label: 'Department Head / Supervisor', defaultValue: 'Head of Department' }
    ],
    version: 1,
    updatedAt: '2026-11-01T10:00:00Z',
    updatedBy: 'System Seed',
    body: `<div style="display:flex;justify-content:space-between;margin-bottom:16px;font-size:10pt;">
  <div><strong>Ref:</strong> {{refNo}}</div>
  <div><strong>Date:</strong> {{today}}</div>
</div>

<p style="margin-bottom:14px;">
  <strong>To,</strong><br/>
  <strong>The Head of Human Resources</strong><br/>
  {{company.name}}<br/>
  {{company.address}}
</p>

<p style="margin-bottom:16px;font-weight:700;font-size:11pt;text-decoration:underline;color:#0a3d7a;">
  Subject: Joining Report for the Post of "{{employee.designation}}" ({{employee.department}})
</p>

<p>Dear Sir / Madam,</p>

<p style="margin-top:10px;text-align:justify;">
  In accordance with the Appointment Letter bearing reference <strong>{{input.appointmentRef}}</strong>, I, <strong>{{employee.fullNameEnglish}}</strong> (Employee ID: <strong>{{employee.employeeCode}}</strong>), hereby report for duty and assume my responsibilities as <strong>{{employee.designation}}</strong> under the <strong>{{employee.department}}</strong> department at <strong>{{company.name}}</strong> effective from <strong>{{employee.joiningDate}}</strong> at <strong>{{input.reportingTime}}</strong>.
</p>

<p style="margin-top:10px;text-align:justify;">
  I have submitted my National ID ({{employee.nid}}), educational certificates, photographs, and bank account details ({{employee.bankName}}, A/C: {{employee.bankAccountNo}}) to the Human Resources department and pledge to abide by all company rules, code of conduct, and confidentiality policies.
</p>

<table style="width:100%;border-collapse:collapse;margin:18px 0;">
  <tbody>
    <tr>
      <td style="border:1px solid #cbd5e1;padding:7px 10px;font-weight:700;background:#f8fafc;width:32%;">Employee Full Name</td>
      <td style="border:1px solid #cbd5e1;padding:7px 10px;">{{employee.fullNameEnglish}} ({{employee.fullNameBangla}})</td>
    </tr>
    <tr>
      <td style="border:1px solid #cbd5e1;padding:7px 10px;font-weight:700;background:#f8fafc;">Employee ID & Designation</td>
      <td style="border:1px solid #cbd5e1;padding:7px 10px;">{{employee.employeeCode}} — {{employee.designation}}</td>
    </tr>
    <tr>
      <td style="border:1px solid #cbd5e1;padding:7px 10px;font-weight:700;background:#f8fafc;">Department & Supervisor</td>
      <td style="border:1px solid #cbd5e1;padding:7px 10px;">{{employee.department}} (Reporting to: {{input.supervisorName}})</td>
    </tr>
    <tr>
      <td style="border:1px solid #cbd5e1;padding:7px 10px;font-weight:700;background:#f8fafc;">Effective Date of Joining</td>
      <td style="border:1px solid #cbd5e1;padding:7px 10px;">{{employee.joiningDate}} ({{input.reportingTime}})</td>
    </tr>
    <tr>
      <td style="border:1px solid #cbd5e1;padding:7px 10px;font-weight:700;background:#f8fafc;">Contact & Official Email</td>
      <td style="border:1px solid #cbd5e1;padding:7px 10px;">{{employee.mobileNumber}} | {{employee.emailAddress}}</td>
    </tr>
  </tbody>
</table>

<div style="display:flex;justify-content:space-between;margin-top:46px;">
  <div>
    <div style="border-top:1px solid #0f172a;width:210px;padding-top:6px;font-weight:700;">{{employee.fullNameEnglish}}</div>
    <div style="font-size:9pt;color:#475569;">Signature of Joining Employee</div>
  </div>
  <div>
    <div style="border-top:1px solid #0f172a;width:210px;padding-top:6px;font-weight:700;">Accepted & Verified By</div>
    <div style="font-size:9pt;color:#475569;">{{signatory.name}} ({{signatory.designation}})</div>
  </div>
</div>`
  },

  // 3. RESIGNATION ACCEPTANCE LETTER (EMPHASIZED / FEATURED)
  {
    id: 'tpl-resignation-acceptance',
    name: 'Resignation Acceptance Letter',
    category: 'Exit',
    type: 'letter',
    description: 'Official management acceptance of an employee resignation specifying last working day and handover instructions.',
    isSystem: true,
    isFeatured: true,
    useLetterhead: true,
    pageSize: 'A4',
    signatory: { name: 'Head of Human Resources', designation: 'HR & Administration, ATCL' },
    customFields: [
      { key: 'resignationSubmittedDate', label: 'Resignation Application Date', defaultValue: '01 October 2026' },
      { key: 'lastWorkingDay', label: 'Approved Last Working Day', defaultValue: '30 November 2026' },
      { key: 'handoverTo', label: 'Handover Assigned To', defaultValue: 'Department Supervisor' }
    ],
    version: 1,
    updatedAt: '2026-11-01T10:00:00Z',
    updatedBy: 'System Seed',
    body: `<div style="display:flex;justify-content:space-between;margin-bottom:16px;font-size:10pt;">
  <div><strong>Ref:</strong> {{refNo}}</div>
  <div><strong>Date:</strong> {{today}}</div>
</div>

<p style="margin-bottom:14px;">
  <strong>To,</strong><br/>
  <strong>{{employee.fullNameEnglish}}</strong><br/>
  Employee ID: {{employee.employeeCode}}<br/>
  Designation: {{employee.designation}}<br/>
  Department: {{employee.department}}
</p>

<p style="margin-bottom:16px;font-weight:700;font-size:11pt;text-decoration:underline;color:#0a3d7a;">
  Subject: Acceptance of Resignation from the Service of {{company.shortName}}
</p>

<p>Dear <strong>{{employee.fullNameEnglish}}</strong>,</p>

<p style="margin-top:10px;text-align:justify;">
  This has reference to your resignation letter dated <strong>{{input.resignationSubmittedDate}}</strong> wherein you requested to resign from your position as <strong>{{employee.designation}}</strong> in the <strong>{{employee.department}}</strong> department of <strong>{{company.name}}</strong>.
</p>

<p style="margin-top:10px;text-align:justify;">
  We hereby inform you that the management has accepted your resignation, and your final working day with the company will be <strong>{{input.lastWorkingDay}}</strong>.
</p>

<p style="margin-top:10px;text-align:justify;">
  You are requested to hand over all assigned responsibilities, project files, company assets, laptop/SIM/ID card, and technical documents to <strong>{{input.handoverTo}}</strong> and obtain a formal No-Dues Clearance from all concerned departments (Engineering/Operations, IT, Administration, and Finance & Accounts) on or before your last working day for final settlement of accounts.
</p>

<p style="margin-top:12px;">
  We thank you for your valuable contributions during your tenure with <strong>{{company.name}}</strong> and wish you every success in your future endeavors.
</p>

<div style="margin-top:48px;">
  <div style="border-top:1px solid #0f172a;width:220px;padding-top:6px;font-weight:700;">{{signatory.name}}</div>
  <div style="font-size:9pt;color:#475569;">{{signatory.designation}}</div>
  <div style="font-size:9pt;color:#475569;">{{company.name}}</div>
</div>`
  },

  // 4. RESIGNATION LETTER (EMPLOYEE FORMAT)
  {
    id: 'tpl-resignation-employee',
    name: 'Resignation Letter (Employee Submission Format)',
    category: 'Exit',
    type: 'letter',
    description: 'Standard resignation letter format for an employee submitting notice of resignation to HR / Management.',
    isSystem: true,
    isFeatured: false,
    useLetterhead: false,
    pageSize: 'A4',
    signatory: { name: '', designation: '' },
    customFields: [
      { key: 'lastWorkingDay', label: 'Proposed Last Working Day', defaultValue: '30 November 2026' },
      { key: 'reasonForLeaving', label: 'Reason for Resignation', defaultValue: 'personal and career advancement reasons' },
      { key: 'noticePeriodDays', label: 'Notice Period Served', defaultValue: '30 Days' }
    ],
    version: 1,
    updatedAt: '2026-11-01T10:00:00Z',
    updatedBy: 'System Seed',
    body: `<div style="margin-bottom:18px;font-size:10pt;">
  <div><strong>Date:</strong> {{today}}</div>
</div>

<p style="margin-bottom:14px;">
  <strong>To,</strong><br/>
  <strong>The Managing Director / Head of HR</strong><br/>
  {{company.name}}<br/>
  {{company.address}}
</p>

<p style="margin-bottom:16px;font-weight:700;font-size:11pt;text-decoration:underline;">
  Subject: Letter of Resignation from the Post of {{employee.designation}} (ID: {{employee.employeeCode}})
</p>

<p>Respected Sir,</p>

<p style="margin-top:10px;text-align:justify;">
  I am writing to formally notify you of my resignation from my position as <strong>{{employee.designation}}</strong> in the <strong>{{employee.department}}</strong> department at <strong>{{company.name}}</strong> due to {{input.reasonForLeaving}}.
</p>

<p style="margin-top:10px;text-align:justify;">
  In accordance with my employment terms ({{input.noticePeriodDays}} notice), my final working day with the organization will be <strong>{{input.lastWorkingDay}}</strong>. During this transition period, I will complete my pending assignments and ensure a smooth handover of all duties, records, and company property.
</p>

<p style="margin-top:10px;text-align:justify;">
  I am deeply grateful for the professional guidance, learning opportunities, and support extended to me since my joining on <strong>{{employee.joiningDate}}</strong>. I kindly request you to accept my resignation and arrange for my release letter, experience certificate, and final settlement.
</p>

<div style="margin-top:48px;">
  <div style="border-top:1px solid #0f172a;width:220px;padding-top:6px;font-weight:700;">{{employee.fullNameEnglish}}</div>
  <div style="font-size:9.5pt;color:#334155;">Employee ID: {{employee.employeeCode}}</div>
  <div style="font-size:9.5pt;color:#334155;">{{employee.designation}}, {{employee.department}}</div>
  <div style="font-size:9pt;color:#64748b;">Mobile: {{employee.mobileNumber}}</div>
</div>`
  },

  // 5. MONTHLY SALARY APPROVAL SHEET (EMPHASIZED / FEATURED)
  {
    id: 'tpl-monthly-salary-approval-sheet',
    name: 'Monthly Salary Approval Sheet (Master Payroll Statement)',
    category: 'Payroll & Bank',
    type: 'sheet',
    description: 'Complete monthly salary approval sheet for all active employees showing Basic, Allowances, Bonus, Gross, Income Tax (TDS), Deductions, Net Payable, amount in words, and 4-tier approval signatures.',
    isSystem: true,
    isFeatured: true,
    useLetterhead: true,
    pageSize: 'A4-Landscape',
    signatory: { name: 'Managing Director', designation: 'Approved By (Managing Director)' },
    customFields: [
      { key: 'sheetNote', label: 'Payroll Remarks / Disbursement Note', defaultValue: 'Salary processed in compliance with ATCL HR Policy & Bangladesh Income Tax Act 2023 (Finance Act 2026).' }
    ],
    version: 1,
    updatedAt: '2026-11-01T10:00:00Z',
    updatedBy: 'System Seed',
    body: `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;font-size:9.5pt;">
  <div><strong>Ref:</strong> {{refNo}} &nbsp;|&nbsp; <strong>Disbursement Channel:</strong> {{payroll.bankFilterLabel}}</div>
  <div><strong>Preparation Date:</strong> {{payroll.processedDate}}</div>
</div>

<div style="text-align:center;margin-bottom:12px;padding:8px;background:#f1f5f9;border-radius:6px;border:1px solid #cbd5e1;">
  <div style="font-size:12pt;font-weight:800;color:#0a3d7a;text-transform:uppercase;">
    MONTHLY SALARY & ALLOWANCE APPROVAL SHEET — {{payroll.monthLabel}}
  </div>
  <div style="font-size:8.5pt;color:#475569;margin-top:2px;">
    Total Active Staff: <strong>{{payroll.employeeCount}}</strong> &nbsp;|&nbsp; Net Disbursement: <strong>BDT {{payroll.totalNet}} ({{payroll.totalNetInWords}})</strong>
  </div>
</div>

<table style="width:100%;border-collapse:collapse;font-size:8.2pt;">
  <thead>
    <tr style="background:#0a3d7a;color:#ffffff;">
      <th style="border:1px solid #94a3b8;padding:6px 5px;text-align:center;color:#fff;background:#0a3d7a;">SL</th>
      <th style="border:1px solid #94a3b8;padding:6px 6px;text-align:left;color:#fff;background:#0a3d7a;">Emp ID</th>
      <th style="border:1px solid #94a3b8;padding:6px 6px;text-align:left;color:#fff;background:#0a3d7a;">Employee Name & Designation</th>
      <th style="border:1px solid #94a3b8;padding:6px 6px;text-align:left;color:#fff;background:#0a3d7a;">Department</th>
      <th style="border:1px solid #94a3b8;padding:6px 6px;text-align:right;color:#fff;background:#0a3d7a;">Basic (50%)</th>
      <th style="border:1px solid #94a3b8;padding:6px 6px;text-align:right;color:#fff;background:#0a3d7a;">Allowances (50%)</th>
      <th style="border:1px solid #94a3b8;padding:6px 6px;text-align:right;color:#fff;background:#0a3d7a;">Festival Bonus</th>
      <th style="border:1px solid #94a3b8;padding:6px 6px;text-align:right;color:#fff;background:#0a3d7a;">Gross Payable</th>
      <th style="border:1px solid #94a3b8;padding:6px 6px;text-align:right;color:#fff;background:#0a3d7a;">TDS Tax</th>
      <th style="border:1px solid #94a3b8;padding:6px 6px;text-align:right;color:#fff;background:#0a3d7a;">LWP / Other</th>
      <th style="border:1px solid #94a3b8;padding:6px 6px;text-align:right;color:#fff;background:#0a3d7a;">Net Payable (BDT)</th>
    </tr>
  </thead>
  <tbody>
    {{#rows}}
    <tr>
      <td style="border:1px solid #cbd5e1;padding:5px;text-align:center;">{{row.sl}}</td>
      <td style="border:1px solid #cbd5e1;padding:5px;font-weight:700;">{{row.employeeCode}}</td>
      <td style="border:1px solid #cbd5e1;padding:5px;">
        <strong>{{row.name}}</strong><br/>
        <span style="font-size:7.5pt;color:#64748b;">{{row.designation}}</span>
      </td>
      <td style="border:1px solid #cbd5e1;padding:5px;font-size:7.5pt;">{{row.department}}</td>
      <td style="border:1px solid #cbd5e1;padding:5px;text-align:right;">{{row.basicSalary}}</td>
      <td style="border:1px solid #cbd5e1;padding:5px;text-align:right;">{{row.allowancesTotal}}</td>
      <td style="border:1px solid #cbd5e1;padding:5px;text-align:right;">{{row.bonusPay}}</td>
      <td style="border:1px solid #cbd5e1;padding:5px;text-align:right;font-weight:600;">{{row.grossSalary}}</td>
      <td style="border:1px solid #cbd5e1;padding:5px;text-align:right;color:#dc2626;">{{row.taxDeduction}}</td>
      <td style="border:1px solid #cbd5e1;padding:5px;text-align:right;">{{row.unpaidLeaveDeduction}}</td>
      <td style="border:1px solid #cbd5e1;padding:5px;text-align:right;font-weight:800;color:#0a3d7a;">{{row.netSalary}}</td>
    </tr>
    {{/rows}}
  </tbody>
  <tfoot>
    <tr style="background:#e2e8f0;font-weight:800;">
      <td colspan="4" style="border:1px solid #94a3b8;padding:7px 8px;text-align:right;">GRAND TOTAL ({{payroll.employeeCount}} Employees):</td>
      <td style="border:1px solid #94a3b8;padding:7px 6px;text-align:right;">{{payroll.totalBasic}}</td>
      <td style="border:1px solid #94a3b8;padding:7px 6px;text-align:right;">{{payroll.totalAllowances}}</td>
      <td style="border:1px solid #94a3b8;padding:7px 6px;text-align:right;">{{payroll.totalBonus}}</td>
      <td style="border:1px solid #94a3b8;padding:7px 6px;text-align:right;">{{payroll.totalGross}}</td>
      <td style="border:1px solid #94a3b8;padding:7px 6px;text-align:right;color:#dc2626;">{{payroll.totalTDS}}</td>
      <td style="border:1px solid #94a3b8;padding:7px 6px;text-align:right;">{{payroll.totalLWP}}</td>
      <td style="border:1px solid #94a3b8;padding:7px 6px;text-align:right;color:#0a3d7a;font-size:9pt;">BDT {{payroll.totalNet}}</td>
    </tr>
  </tfoot>
</table>

<p style="margin-top:10px;font-size:9pt;">
  <strong>In Words (Net Payable):</strong> <em>{{payroll.totalNetInWords}}</em><br/>
  <span style="font-size:8pt;color:#475569;"><strong>Note:</strong> {{input.sheetNote}}</span>
</p>

<div style="display:grid;grid-template-columns:repeat(4, 1fr);gap:20px;margin-top:42px;text-align:center;font-size:8.5pt;">
  <div>
    <div style="border-top:1px solid #0f172a;padding-top:5px;font-weight:700;">Prepared By</div>
    <div style="color:#475569;">HR & Payroll Officer</div>
  </div>
  <div>
    <div style="border-top:1px solid #0f172a;padding-top:5px;font-weight:700;">Checked & Verified By</div>
    <div style="color:#475569;">Manager, Finance & Accounts</div>
  </div>
  <div>
    <div style="border-top:1px solid #0f172a;padding-top:5px;font-weight:700;">Recommended By</div>
    <div style="color:#475569;">General Manager / HR Director</div>
  </div>
  <div>
    <div style="border-top:1px solid #0f172a;padding-top:5px;font-weight:700;">Approved By</div>
    <div style="color:#475569;">{{signatory.name}} ({{signatory.designation}})</div>
  </div>
</div>`
  },

  // 6. BANK SALARY CONFIRMATION / TRANSFER ADVICE SHEET (EMPHASIZED / FEATURED)
  {
    id: 'tpl-bank-salary-confirmation-sheet',
    name: 'Bank Salary Confirmation & Transfer Advice Sheet (Monthly)',
    category: 'Payroll & Bank',
    type: 'sheet',
    description: 'Formal monthly bank transfer instruction letter and employee account schedule for crediting monthly net salaries from ATCL corporate bank account.',
    isSystem: true,
    isFeatured: true,
    useLetterhead: true,
    pageSize: 'A4',
    signatory: { name: 'Managing Director', designation: 'Authorized Signatory, ATCL' },
    customFields: [
      { key: 'chequeOrEftNo', label: 'Cheque / EFTN / RTGS Reference No', defaultValue: 'EFTN-SAL-2026' },
      { key: 'valueDate', label: 'Transfer Value Date', defaultValue: '01 November 2026' }
    ],
    version: 1,
    updatedAt: '2026-11-01T10:00:00Z',
    updatedBy: 'System Seed',
    body: `<div style="display:flex;justify-content:space-between;margin-bottom:14px;font-size:9.5pt;">
  <div><strong>Ref:</strong> {{refNo}}</div>
  <div><strong>Date:</strong> {{today}}</div>
</div>

<p style="margin-bottom:12px;font-size:9.5pt;">
  <strong>To,</strong><br/>
  <strong>The Branch Manager</strong><br/>
  {{payroll.companyBankName}}<br/>
  {{payroll.companyBankBranch}}
</p>

<p style="margin-bottom:12px;font-weight:700;font-size:10.5pt;text-decoration:underline;color:#0a3d7a;">
  Subject: Advice for Disbursement of Staff Salary for the Month of {{payroll.monthLabel}}
</p>

<p style="font-size:9.5pt;">Dear Sir,</p>

<p style="margin-top:6px;text-align:justify;font-size:9.5pt;">
  We hereby request and authorize you to debit a total sum of <strong>BDT {{payroll.totalNet}} ({{payroll.totalNetInWords}})</strong> from our Corporate Account No. <strong>{{payroll.companyBankAccountNo}}</strong> maintained with your branch (vide Reference/Cheque No: <strong>{{input.chequeOrEftNo}}</strong>, Value Date: <strong>{{input.valueDate}}</strong>) and credit the respective individual bank accounts of our <strong>{{payroll.employeeCount}}</strong> employees for the month of <strong>{{payroll.monthLabel}}</strong> as detailed in the schedule below:
</p>

<table style="width:100%;border-collapse:collapse;margin:12px 0;font-size:8.8pt;">
  <thead>
    <tr style="background:#0a3d7a;color:#ffffff;">
      <th style="border:1px solid #94a3b8;padding:6px;text-align:center;color:#fff;background:#0a3d7a;width:40px;">SL</th>
      <th style="border:1px solid #94a3b8;padding:6px;text-align:left;color:#fff;background:#0a3d7a;">Emp ID</th>
      <th style="border:1px solid #94a3b8;padding:6px;text-align:left;color:#fff;background:#0a3d7a;">Account Holder Name</th>
      <th style="border:1px solid #94a3b8;padding:6px;text-align:left;color:#fff;background:#0a3d7a;">Designation</th>
      <th style="border:1px solid #94a3b8;padding:6px;text-align:left;color:#fff;background:#0a3d7a;">Bank Name</th>
      <th style="border:1px solid #94a3b8;padding:6px;text-align:left;color:#fff;background:#0a3d7a;">Bank Account Number</th>
      <th style="border:1px solid #94a3b8;padding:6px;text-align:right;color:#fff;background:#0a3d7a;">Net Credit Amount (BDT)</th>
    </tr>
  </thead>
  <tbody>
    {{#rows}}
    <tr>
      <td style="border:1px solid #cbd5e1;padding:5px 6px;text-align:center;">{{row.sl}}</td>
      <td style="border:1px solid #cbd5e1;padding:5px 6px;font-weight:600;">{{row.employeeCode}}</td>
      <td style="border:1px solid #cbd5e1;padding:5px 6px;font-weight:700;">{{row.name}}</td>
      <td style="border:1px solid #cbd5e1;padding:5px 6px;font-size:8pt;color:#475569;">{{row.designation}}</td>
      <td style="border:1px solid #cbd5e1;padding:5px 6px;font-size:8pt;">{{row.bankName}}</td>
      <td style="border:1px solid #cbd5e1;padding:5px 6px;font-family:monospace;font-weight:700;">{{row.accountNo}}</td>
      <td style="border:1px solid #cbd5e1;padding:5px 6px;text-align:right;font-weight:800;">{{row.netSalary}}</td>
    </tr>
    {{/rows}}
  </tbody>
  <tfoot>
    <tr style="background:#f1f5f9;font-weight:800;">
      <td colspan="6" style="border:1px solid #94a3b8;padding:7px 8px;text-align:right;">TOTAL TRANSFER AMOUNT ({{payroll.employeeCount}} Employees):</td>
      <td style="border:1px solid #94a3b8;padding:7px 8px;text-align:right;color:#0a3d7a;">BDT {{payroll.totalNet}}</td>
    </tr>
  </tfoot>
</table>

<p style="font-size:9.5pt;margin-top:8px;">
  <strong>Amount in Words:</strong> <em>{{payroll.totalNetInWords}}</em>
</p>
<p style="font-size:9pt;color:#334155;margin-top:6px;">
  Please provide us with the stamped bank confirmation advice once the transfers have been executed.
</p>

<div style="display:flex;justify-content:space-between;margin-top:46px;font-size:9pt;">
  <div>
    <div style="border-top:1px solid #0f172a;width:210px;padding-top:6px;font-weight:700;">Authorized Signatory — 1</div>
    <div style="color:#475569;">Chief Financial Officer / Accounts Head</div>
    <div style="color:#475569;">{{company.name}}</div>
  </div>
  <div>
    <div style="border-top:1px solid #0f172a;width:210px;padding-top:6px;font-weight:700;">{{signatory.name}}</div>
    <div style="color:#475569;">{{signatory.designation}}</div>
    <div style="color:#475569;">{{company.name}}</div>
  </div>
</div>`
  },

  // 7. SALARY INCREMENT & REVISION LETTER (EMPHASIZED / FEATURED)
  {
    id: 'tpl-salary-increment-letter',
    name: 'Salary Increment & Compensation Revision Letter',
    category: 'Employment Changes',
    type: 'letter',
    description: 'Official letter communicating annual performance appraisal increment and revised monthly salary breakdown.',
    isSystem: true,
    isFeatured: true,
    useLetterhead: true,
    pageSize: 'A4',
    signatory: { name: 'Managing Director', designation: 'Managing Director, ATCL' },
    customFields: [
      { key: 'effectiveDate', label: 'Increment Effective From', defaultValue: '01 November 2026' },
      { key: 'previousGross', label: 'Previous Monthly Gross (BDT)', defaultValue: '40,000' },
      { key: 'appraisalYear', label: 'Performance Review Cycle', defaultValue: '2025–2026' }
    ],
    version: 1,
    updatedAt: '2026-11-01T10:00:00Z',
    updatedBy: 'System Seed',
    body: `<div style="display:flex;justify-content:space-between;margin-bottom:16px;font-size:10pt;">
  <div><strong>Ref:</strong> {{refNo}}</div>
  <div><strong>Date:</strong> {{today}}</div>
</div>

<p style="margin-bottom:14px;">
  <strong>To,</strong><br/>
  <strong>{{employee.fullNameEnglish}}</strong><br/>
  Employee ID: {{employee.employeeCode}}<br/>
  Designation: {{employee.designation}}<br/>
  Department: {{employee.department}}
</p>

<p style="margin-bottom:16px;font-weight:700;font-size:11pt;text-decoration:underline;color:#0a3d7a;">
  Subject: Revision of Monthly Compensation & Annual Increment ({{input.appraisalYear}})
</p>

<p>Dear <strong>{{employee.fullNameEnglish}}</strong>,</p>

<p style="margin-top:10px;text-align:justify;">
  In recognition of your dedicated service, technical excellence, and valuable contribution to the growth of <strong>{{company.name}}</strong> during the appraisal period <strong>{{input.appraisalYear}}</strong>, the management is pleased to revise your monthly Gross Salary from <strong>BDT {{input.previousGross}}</strong> to <strong>BDT {{salary.gross}} ({{salary.grossInWords}})</strong> effective from <strong>{{input.effectiveDate}}</strong>.
</p>

<table style="width:100%;border-collapse:collapse;margin:14px 0;">
  <thead>
    <tr style="background:#f1f5f9;">
      <th style="border:1px solid #cbd5e1;padding:7px 10px;text-align:left;">Revised Salary Head</th>
      <th style="border:1px solid #cbd5e1;padding:7px 10px;text-align:right;">Revised Monthly Amount (BDT)</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="border:1px solid #cbd5e1;padding:6px 10px;">Basic Salary (50%)</td>
      <td style="border:1px solid #cbd5e1;padding:6px 10px;text-align:right;">{{salary.basic}}</td>
    </tr>
    <tr>
      <td style="border:1px solid #cbd5e1;padding:6px 10px;">House Rent Allowance (25%)</td>
      <td style="border:1px solid #cbd5e1;padding:6px 10px;text-align:right;">{{salary.houseRent}}</td>
    </tr>
    <tr>
      <td style="border:1px solid #cbd5e1;padding:6px 10px;">Medical Allowance (10%)</td>
      <td style="border:1px solid #cbd5e1;padding:6px 10px;text-align:right;">{{salary.medical}}</td>
    </tr>
    <tr>
      <td style="border:1px solid #cbd5e1;padding:6px 10px;">Conveyance Allowance (10%)</td>
      <td style="border:1px solid #cbd5e1;padding:6px 10px;text-align:right;">{{salary.conveyance}}</td>
    </tr>
    <tr>
      <td style="border:1px solid #cbd5e1;padding:6px 10px;">Mobile & Other Allowance (5%)</td>
      <td style="border:1px solid #cbd5e1;padding:6px 10px;text-align:right;">{{salary.mobile}}</td>
    </tr>
    <tr style="background:#f8fafc;font-weight:800;">
      <td style="border:1px solid #cbd5e1;padding:7px 10px;">New Monthly Gross Salary</td>
      <td style="border:1px solid #cbd5e1;padding:7px 10px;text-align:right;color:#0a3d7a;">BDT {{salary.gross}}</td>
    </tr>
  </tbody>
</table>

<p style="margin-top:10px;">All other terms and conditions of your employment remain unchanged. We look forward to your continued commitment and leadership.</p>

<div style="margin-top:46px;">
  <div style="border-top:1px solid #0f172a;width:220px;padding-top:6px;font-weight:700;">{{signatory.name}}</div>
  <div style="font-size:9pt;color:#475569;">{{signatory.designation}}</div>
  <div style="font-size:9pt;color:#475569;">{{company.name}}</div>
</div>`
  },

  // 8. CONFIRMATION OF SERVICE LETTER
  {
    id: 'tpl-confirmation-letter',
    name: 'Confirmation of Service Letter (Post-Probation)',
    category: 'Employment Changes',
    type: 'letter',
    description: 'Confirms an employee as a permanent member of staff following successful completion of probation.',
    isSystem: true,
    isFeatured: false,
    useLetterhead: true,
    pageSize: 'A4',
    signatory: { name: 'Managing Director', designation: 'Managing Director, ATCL' },
    customFields: [
      { key: 'confirmationDate', label: 'Effective Confirmation Date', defaultValue: '01 November 2026' }
    ],
    version: 1,
    updatedAt: '2026-11-01T10:00:00Z',
    updatedBy: 'System Seed',
    body: `<div style="display:flex;justify-content:space-between;margin-bottom:16px;font-size:10pt;">
  <div><strong>Ref:</strong> {{refNo}}</div>
  <div><strong>Date:</strong> {{today}}</div>
</div>

<p style="margin-bottom:14px;">
  <strong>To,</strong><br/>
  <strong>{{employee.fullNameEnglish}}</strong><br/>
  Employee ID: {{employee.employeeCode}}<br/>
  Designation: {{employee.designation}}, {{employee.department}}
</p>

<p style="margin-bottom:16px;font-weight:700;font-size:11pt;text-decoration:underline;color:#0a3d7a;">
  Subject: Confirmation of Permanent Employment at {{company.shortName}}
</p>

<p>Dear <strong>{{employee.fullNameEnglish}}</strong>,</p>

<p style="margin-top:10px;text-align:justify;">
  Consequent upon the satisfactory completion of your probationary period since joining on <strong>{{employee.joiningDate}}</strong>, the management of <strong>{{company.name}}</strong> is pleased to confirm your permanent employment as <strong>{{employee.designation}}</strong> in the <strong>{{employee.department}}</strong> department with effect from <strong>{{input.confirmationDate}}</strong>.
</p>

<p style="margin-top:10px;text-align:justify;">
  As a confirmed permanent employee, you are now eligible for all statutory and company benefits including full annual leave quotas and festival bonuses in accordance with ATCL Service Rules.
</p>

<div style="margin-top:48px;">
  <div style="border-top:1px solid #0f172a;width:220px;padding-top:6px;font-weight:700;">{{signatory.name}}</div>
  <div style="font-size:9pt;color:#475569;">{{signatory.designation}}</div>
  <div style="font-size:9pt;color:#475569;">{{company.name}}</div>
</div>`
  },

  // 9. EXPERIENCE & SERVICE CERTIFICATE
  {
    id: 'tpl-experience-certificate',
    name: 'Experience & Service Certificate',
    category: 'Certificates',
    type: 'letter',
    description: 'Formal certificate of employment and experience verifying tenure, designation, and professional conduct.',
    isSystem: true,
    isFeatured: false,
    useLetterhead: true,
    pageSize: 'A4',
    signatory: { name: 'Head of Human Resources', designation: 'Human Resources & Administration' },
    customFields: [
      { key: 'tenureEndDate', label: 'Service End Date (or "Present")', defaultValue: 'Present' }
    ],
    version: 1,
    updatedAt: '2026-11-01T10:00:00Z',
    updatedBy: 'System Seed',
    body: `<div style="display:flex;justify-content:space-between;margin-bottom:20px;font-size:10pt;">
  <div><strong>Ref:</strong> {{refNo}}</div>
  <div><strong>Date:</strong> {{today}}</div>
</div>

<h3 style="text-align:center;text-decoration:underline;color:#0a3d7a;letter-spacing:0.04em;margin:24px 0;">
  TO WHOM IT MAY CONCERN
</h3>

<p style="margin-top:16px;text-align:justify;">
  This is to certify that <strong>{{employee.fullNameEnglish}}</strong> (Employee ID: <strong>{{employee.employeeCode}}</strong>, NID: <strong>{{employee.nid}}</strong>) has been employed with <strong>{{company.name}}</strong> from <strong>{{employee.joiningDate}}</strong> to <strong>{{input.tenureEndDate}}</strong>.
</p>

<p style="margin-top:12px;text-align:justify;">
  During this tenure, he/she has served as <strong>{{employee.designation}}</strong> in our <strong>{{employee.department}}</strong> division. In this capacity, he/she has demonstrated strong technical proficiency, integrity, punctuality, and dedication to assigned engineering and organizational responsibilities.
</p>

<p style="margin-top:12px;text-align:justify;">
  His/her last drawn monthly Gross Salary with the organization is <strong>BDT {{salary.gross}} ({{salary.grossInWords}})</strong>.
</p>

<p style="margin-top:12px;">We wish <strong>{{employee.fullNameEnglish}}</strong> continued success in all future endeavors.</p>

<div style="margin-top:52px;">
  <div style="border-top:1px solid #0f172a;width:220px;padding-top:6px;font-weight:700;">{{signatory.name}}</div>
  <div style="font-size:9pt;color:#475569;">{{signatory.designation}}</div>
  <div style="font-size:9pt;color:#475569;">{{company.name}}</div>
</div>`
  },

  // 10. FINAL RELEASE & CLEARANCE CERTIFICATE
  {
    id: 'tpl-release-letter',
    name: 'Release & No-Dues Clearance Certificate',
    category: 'Exit',
    type: 'letter',
    description: 'Official release certificate confirming full clearance of company assets and accounts upon separation.',
    isSystem: true,
    isFeatured: false,
    useLetterhead: true,
    pageSize: 'A4',
    signatory: { name: 'Head of Human Resources', designation: 'Human Resources & Administration' },
    customFields: [
      { key: 'relievingDate', label: 'Relieving / Release Date', defaultValue: '30 November 2026' }
    ],
    version: 1,
    updatedAt: '2026-11-01T10:00:00Z',
    updatedBy: 'System Seed',
    body: `<div style="display:flex;justify-content:space-between;margin-bottom:18px;font-size:10pt;">
  <div><strong>Ref:</strong> {{refNo}}</div>
  <div><strong>Date:</strong> {{today}}</div>
</div>

<h3 style="text-align:center;text-decoration:underline;color:#0a3d7a;margin:20px 0;">
  RELEASE & NO-DUES CLEARANCE CERTIFICATE
</h3>

<p style="margin-top:14px;text-align:justify;">
  This is to certify that <strong>{{employee.fullNameEnglish}}</strong> (Employee ID: <strong>{{employee.employeeCode}}</strong>), who served as <strong>{{employee.designation}}</strong> in the <strong>{{employee.department}}</strong> department of <strong>{{company.name}}</strong> since <strong>{{employee.joiningDate}}</strong>, has been formally relieved of his/her duties at the close of business on <strong>{{input.relievingDate}}</strong> following acceptance of his/her resignation.
</p>

<p style="margin-top:12px;text-align:justify;">
  It is further certified that he/she has handed over all company assets, documents, and technical equipment in good order and has no outstanding financial or administrative liabilities with <strong>{{company.name}}</strong>.
</p>

<div style="margin-top:52px;">
  <div style="border-top:1px solid #0f172a;width:220px;padding-top:6px;font-weight:700;">{{signatory.name}}</div>
  <div style="font-size:9pt;color:#475569;">{{signatory.designation}}</div>
  <div style="font-size:9pt;color:#475569;">{{company.name}}</div>
</div>`
  },

  // 11. SALARY CERTIFICATE
  {
    id: 'tpl-salary-certificate',
    name: 'Employee Salary Certificate (Bank Loan / Embassy / Tax)',
    category: 'Certificates',
    type: 'letter',
    description: 'Official salary and employment certificate detailing monthly gross pay, breakdown, TDS, and net take-home pay.',
    isSystem: true,
    isFeatured: false,
    useLetterhead: true,
    pageSize: 'A4',
    signatory: { name: 'Head of Finance & Accounts', designation: 'Finance & Accounts Department' },
    customFields: [
      { key: 'purpose', label: 'Issued For Purpose', defaultValue: 'Banking / Personal Financial Documentation' }
    ],
    version: 1,
    updatedAt: '2026-11-01T10:00:00Z',
    updatedBy: 'System Seed',
    body: `<div style="display:flex;justify-content:space-between;margin-bottom:16px;font-size:10pt;">
  <div><strong>Ref:</strong> {{refNo}}</div>
  <div><strong>Date:</strong> {{today}}</div>
</div>

<h3 style="text-align:center;text-decoration:underline;color:#0a3d7a;margin:18px 0;">
  SALARY & EMPLOYMENT CERTIFICATE
</h3>

<p style="text-align:justify;">
  This is to certify that <strong>{{employee.fullNameEnglish}}</strong> (Employee ID: <strong>{{employee.employeeCode}}</strong>, NID: <strong>{{employee.nid}}</strong>, TIN: <strong>{{employee.tin}}</strong>) is a permanent employee of <strong>{{company.name}}</strong> serving as <strong>{{employee.designation}}</strong> in the <strong>{{employee.department}}</strong> department since <strong>{{employee.joiningDate}}</strong>.
</p>

<p style="margin-top:10px;">His/her current monthly compensation structure is as follows:</p>

<table style="width:100%;border-collapse:collapse;margin:10px 0 14px;">
  <thead>
    <tr style="background:#f1f5f9;">
      <th style="border:1px solid #cbd5e1;padding:7px 10px;text-align:left;">Particulars</th>
      <th style="border:1px solid #cbd5e1;padding:7px 10px;text-align:right;">Monthly Amount (BDT)</th>
    </tr>
  </thead>
  <tbody>
    <tr><td style="border:1px solid #cbd5e1;padding:6px 10px;">Basic Salary (50%)</td><td style="border:1px solid #cbd5e1;padding:6px 10px;text-align:right;">{{salary.basic}}</td></tr>
    <tr><td style="border:1px solid #cbd5e1;padding:6px 10px;">House Rent Allowance (25%)</td><td style="border:1px solid #cbd5e1;padding:6px 10px;text-align:right;">{{salary.houseRent}}</td></tr>
    <tr><td style="border:1px solid #cbd5e1;padding:6px 10px;">Medical Allowance (10%)</td><td style="border:1px solid #cbd5e1;padding:6px 10px;text-align:right;">{{salary.medical}}</td></tr>
    <tr><td style="border:1px solid #cbd5e1;padding:6px 10px;">Conveyance Allowance (10%)</td><td style="border:1px solid #cbd5e1;padding:6px 10px;text-align:right;">{{salary.conveyance}}</td></tr>
    <tr><td style="border:1px solid #cbd5e1;padding:6px 10px;">Mobile & Other Allowance (5%)</td><td style="border:1px solid #cbd5e1;padding:6px 10px;text-align:right;">{{salary.mobile}}</td></tr>
    <tr style="font-weight:700;background:#f8fafc;"><td style="border:1px solid #cbd5e1;padding:6px 10px;">Gross Monthly Salary</td><td style="border:1px solid #cbd5e1;padding:6px 10px;text-align:right;">BDT {{salary.gross}}</td></tr>
    <tr><td style="border:1px solid #cbd5e1;padding:6px 10px;">Less: Monthly Income Tax Deduction (TDS)</td><td style="border:1px solid #cbd5e1;padding:6px 10px;text-align:right;">({{salary.monthlyTDS}})</td></tr>
    <tr style="font-weight:800;background:#e2e8f0;"><td style="border:1px solid #cbd5e1;padding:7px 10px;">Net Monthly Take-Home Pay</td><td style="border:1px solid #cbd5e1;padding:7px 10px;text-align:right;color:#0a3d7a;">BDT {{salary.netMonthly}}</td></tr>
  </tbody>
</table>

<p style="font-size:9.5pt;">
  <strong>Net Monthly Salary in Words:</strong> <em>{{salary.netMonthlyInWords}}</em><br/>
  <strong>Disbursement Bank A/C:</strong> {{employee.bankName}} — A/C No. {{employee.bankAccountNo}}<br/>
  <strong>Purpose of Issuance:</strong> {{input.purpose}}
</p>

<div style="margin-top:46px;">
  <div style="border-top:1px solid #0f172a;width:220px;padding-top:6px;font-weight:700;">{{signatory.name}}</div>
  <div style="font-size:9pt;color:#475569;">{{signatory.designation}}</div>
  <div style="font-size:9pt;color:#475569;">{{company.name}}</div>
</div>`
  },

  // 12. NO OBJECTION CERTIFICATE (NOC)
  {
    id: 'tpl-noc-certificate',
    name: 'No Objection Certificate (NOC — Visa / Passport / Travel)',
    category: 'Certificates',
    type: 'letter',
    description: 'Official NOC issued for international visa applications, passport renewal, higher study, or bank loan.',
    isSystem: true,
    isFeatured: false,
    useLetterhead: true,
    pageSize: 'A4',
    signatory: { name: 'Managing Director', designation: 'Managing Director, ATCL' },
    customFields: [
      { key: 'nocPurpose', label: 'NOC Purpose / Destination Country', defaultValue: 'obtaining an international tourist/business visa' },
      { key: 'travelPeriod', label: 'Approved Leave / Travel Period', defaultValue: '10 Days during November 2026' }
    ],
    version: 1,
    updatedAt: '2026-11-01T10:00:00Z',
    updatedBy: 'System Seed',
    body: `<div style="display:flex;justify-content:space-between;margin-bottom:18px;font-size:10pt;">
  <div><strong>Ref:</strong> {{refNo}}</div>
  <div><strong>Date:</strong> {{today}}</div>
</div>

<h3 style="text-align:center;text-decoration:underline;color:#0a3d7a;margin:20px 0;">
  NO OBJECTION CERTIFICATE (NOC)
</h3>

<p style="text-align:justify;">
  This is to certify that <strong>{{employee.fullNameEnglish}}</strong> (Employee ID: <strong>{{employee.employeeCode}}</strong>, NID: <strong>{{employee.nid}}</strong>), son/daughter of <strong>{{employee.fatherName}}</strong>, has been working with <strong>{{company.name}}</strong> since <strong>{{employee.joiningDate}}</strong> as <strong>{{employee.designation}}</strong> in our <strong>{{employee.department}}</strong> department.
</p>

<p style="margin-top:12px;text-align:justify;">
  The management of <strong>{{company.name}}</strong> has no objection to <strong>{{employee.fullNameEnglish}}</strong> applying for <strong>{{input.nocPurpose}}</strong> during the approved period of <strong>{{input.travelPeriod}}</strong>. Upon completion of this period, he/she will resume regular duties with the company.
</p>

<p style="margin-top:12px;">
  His/her current monthly Gross Salary is <strong>BDT {{salary.gross}} ({{salary.grossInWords}})</strong>.
</p>

<div style="margin-top:50px;">
  <div style="border-top:1px solid #0f172a;width:220px;padding-top:6px;font-weight:700;">{{signatory.name}}</div>
  <div style="font-size:9pt;color:#475569;">{{signatory.designation}}</div>
  <div style="font-size:9pt;color:#475569;">{{company.name}}</div>
</div>`
  },

  // 13. SHOW-CAUSE / EXPLANATION NOTICE
  {
    id: 'tpl-show-cause-notice',
    name: 'Show-Cause / Written Explanation Notice',
    category: 'Disciplinary',
    type: 'letter',
    description: 'Formal disciplinary notice requesting a written explanation within a specified timeframe.',
    isSystem: true,
    isFeatured: false,
    useLetterhead: true,
    pageSize: 'A4',
    signatory: { name: 'Head of Human Resources', designation: 'Human Resources & Administration' },
    customFields: [
      { key: 'incidentSummary', label: 'Incident / Policy Violation Details', defaultValue: 'repeated unapproved late attendance / absence without prior intimation' },
      { key: 'responseHours', label: 'Response Deadline', defaultValue: '72 (Seventy-Two) Hours' }
    ],
    version: 1,
    updatedAt: '2026-11-01T10:00:00Z',
    updatedBy: 'System Seed',
    body: `<div style="display:flex;justify-content:space-between;margin-bottom:16px;font-size:10pt;">
  <div><strong>Ref:</strong> {{refNo}}</div>
  <div><strong>Date:</strong> {{today}}</div>
</div>

<p style="margin-bottom:14px;">
  <strong>CONFIDENTIAL</strong><br/>
  <strong>To: {{employee.fullNameEnglish}}</strong> ({{employee.employeeCode}})<br/>
  Designation: {{employee.designation}}, {{employee.department}}
</p>

<p style="margin-bottom:16px;font-weight:700;font-size:11pt;text-decoration:underline;color:#b91c1c;">
  Subject: Show-Cause Notice / Request for Written Explanation
</p>

<p>Dear <strong>{{employee.fullNameEnglish}}</strong>,</p>

<p style="margin-top:10px;text-align:justify;">
  It has been brought to the notice of management that you were involved in <strong>{{input.incidentSummary}}</strong>, which constitutes a breach of the service discipline and code of conduct of <strong>{{company.name}}</strong>.
</p>

<p style="margin-top:10px;text-align:justify;">
  You are hereby directed to submit a written explanation to the undersigned within <strong>{{input.responseHours}}</strong> of receipt of this notice explaining why disciplinary action should not be initiated against you in accordance with company policy.
</p>

<div style="margin-top:48px;">
  <div style="border-top:1px solid #0f172a;width:220px;padding-top:6px;font-weight:700;">{{signatory.name}}</div>
  <div style="font-size:9pt;color:#475569;">{{signatory.designation}}</div>
  <div style="font-size:9pt;color:#475569;">{{company.name}}</div>
</div>`
  },

  // 14. OFFICIAL LEAVE APPROVAL LETTER
  {
    id: 'tpl-leave-approval-letter',
    name: 'Official Leave Sanction & Approval Letter',
    category: 'Employment Changes',
    type: 'letter',
    description: 'Formal letter sanctioning approved annual, casual, sick, or maternity/paternity leave for an employee.',
    isSystem: true,
    isFeatured: false,
    useLetterhead: true,
    pageSize: 'A4',
    signatory: { name: 'Head of Human Resources', designation: 'Human Resources & Administration' },
    customFields: [
      { key: 'leaveCategory', label: 'Leave Type', defaultValue: 'Earned / Annual Leave' },
      { key: 'leaveFromDate', label: 'Leave Start Date', defaultValue: '10 November 2026' },
      { key: 'leaveToDate', label: 'Leave End Date', defaultValue: '14 November 2026' },
      { key: 'totalLeaveDays', label: 'Total Sanctioned Days', defaultValue: '5 (Five) Days' },
      { key: 'rejoiningDate', label: 'Scheduled Rejoining Date', defaultValue: '15 November 2026' }
    ],
    version: 1,
    updatedAt: '2026-11-01T10:00:00Z',
    updatedBy: 'System Seed',
    body: `<div style="display:flex;justify-content:space-between;margin-bottom:16px;font-size:10pt;">
  <div><strong>Ref:</strong> {{refNo}}</div>
  <div><strong>Date:</strong> {{today}}</div>
</div>

<p style="margin-bottom:14px;">
  <strong>To,</strong><br/>
  <strong>{{employee.fullNameEnglish}}</strong> ({{employee.employeeCode}})<br/>
  {{employee.designation}}, {{employee.department}}
</p>

<p style="margin-bottom:16px;font-weight:700;font-size:11pt;text-decoration:underline;color:#0a3d7a;">
  Subject: Sanction of {{input.leaveCategory}} for {{input.totalLeaveDays}}
</p>

<p>Dear <strong>{{employee.fullNameEnglish}}</strong>,</p>

<p style="margin-top:10px;text-align:justify;">
  With reference to your leave application, the management of <strong>{{company.name}}</strong> is pleased to sanction <strong>{{input.totalLeaveDays}}</strong> of <strong>{{input.leaveCategory}}</strong> from <strong>{{input.leaveFromDate}}</strong> to <strong>{{input.leaveToDate}}</strong>.
</p>

<p style="margin-top:10px;text-align:justify;">
  You are scheduled to resume your regular official duties on <strong>{{input.rejoiningDate}}</strong>. Please ensure that your ongoing tasks are coordinated with your department supervisor prior to proceeding on leave.
</p>

<div style="margin-top:48px;">
  <div style="border-top:1px solid #0f172a;width:220px;padding-top:6px;font-weight:700;">{{signatory.name}}</div>
  <div style="font-size:9pt;color:#475569;">{{signatory.designation}}</div>
  <div style="font-size:9pt;color:#475569;">{{company.name}}</div>
</div>`
  }
];

