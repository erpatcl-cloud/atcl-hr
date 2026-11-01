# AGENTS.md — ATCL Enterprise HRMS (Advance Technology Consortium Ltd.)

This file provides full architectural, domain, statutory tax, payroll, and cloud integration context for AI coding agents (Antigravity, OpenAI Codex, Claude Code, etc.) working on **ATCL Enterprise HRMS**.

---

## 1. Project Overview & Tech Stack
- **Organization**: Advance Technology Consortium Ltd. (ATCL), Dhaka, Bangladesh (`atcbd.net`)
- **Framework**: React 19 + Vite 8 (`http://localhost:5273/`)
- **State & Persistence**:
  - Central React Context in `src/context/HRMSContext.jsx`
  - Offline-first `localStorage` persistence with automatic sync to optional MySQL REST backend (`http://localhost:5000/api`) and Firebase (`erpatcl` project in `src/utils/firebase.js`)
  - Google Workspace Cloud Integration (`erpatcl@gmail.com`) in `src/utils/googleWorkspaceService.js`
- **Client-Side Libraries (loaded via `index.html`)**:
  - SheetJS (`window.XLSX`) for Excel/CSV import & export
  - jsPDF (`window.jspdf`) for Payslip & Section 139 TDS Tax Certificate PDF generation
  - Google Identity Services (`https://accounts.google.com/gsi/client`) for OAuth 2.0

### Commands
```powershell
# Start local development server on port 5273
npm run dev -- --port 5273

# Production build verification
npm run build
```

---

## 2. Directory & Module Architecture

| File Path | Responsibility |
|---|---|
| `src/App.jsx` | Top-level application shell, header status badges (`☁️ erpatcl@gmail.com` & MySQL status), role/employee impersonation switcher, and page router |
| `src/context/HRMSContext.jsx` | Central state provider for employees, attendance, leaves, payroll runs, salary revisions, tax declarations, company profile, user credentials, Google Workspace session, and document templates |
| `src/utils/taxCalculator.js` | **Bangladesh Income Tax Act 2023 & Finance Act 2026** multi-year slab calculator, corporate tax explorer rates, sector-capped investment rebate (3-Limit Formula), and salary exemption rules |
| `src/utils/pdfGenerator.js` | Official Monthly Payslip PDF and NBR **Section 139 TDS Certificate** PDF generator |
| `src/utils/excelExporter.js` | Multi-sheet Excel export, template downloader, and uploaded `.xlsx`/`.csv` parser |
| `src/utils/googleWorkspaceService.js` | Auto-connected Google Workspace service (`erpatcl@gmail.com`), Google Drive JSON backup/restore, employee dossier folder provisioning, and Google Sheets CSV pull |
| `src/utils/templateEngine.js` | Dynamic HR & Payroll Document Template engine with `{{placeholder}}` substitution, `{{#rows}}...{{/rows}}` repeating payroll rows, Bangladeshi Taka-in-words (`numberToBDTWords`), Print/A4 PDF, Word (`.doc`), and rich clipboard copy |
| `src/data/templateSeeds.js` | 14 built-in HR & Payroll starter templates (Appointment Letter, Joining Letter, Resignation Acceptance, Monthly Salary Approval Sheet, Bank Salary Confirmation Sheet, etc.) |
| `src/components/Settings.jsx` | Admin-only console hosting **Document Templates**, **Google Workspace Cloud Integration**, **Bulk Employee Upload**, **Attendance/Salary/Tax Import**, **Master Data**, **User Credentials**, and **Backup & Restore** |
| `src/components/DocumentTemplatesHub.jsx` | Template Library (with `⭐ Emphasized` templates), Copy-Paste Template Builder, Rich Template Studio & Symbol Picker, and Single/Bulk Letter & Monthly Payroll/Bank Sheet Generator |
| `src/components/TaxManagement.jsx` | Admin Tax Compliance console + interactive **Bangladesh Income Tax Slabs & Corporate Rates Explorer** |
| `src/components/PayrollManagement.jsx` | Monthly payroll processing, festival bonus computation, LWP deductions, and bank advice |
| `src/components/EmployeePortal.jsx` | Employee Self-Service (ESS) portal for attendance clock-in/out, leave applications, payslips, and personal tax calculator/certificate |

---

## 3. Statutory Domain Rules (Bangladesh HR & Tax)

### 3.1 Salary Breakdown Policy
Default gross salary split (configurable in `hrSettings.salaryRatios`):
- **Basic Salary**: `50%` of Gross
- **House Rent Allowance**: `25%` of Gross
- **Medical Allowance**: `10%` of Gross
- **Conveyance Allowance**: `10%` of Gross
- **Mobile & Utility Allowance**: `5%` of Gross (absorbs rounding remainder so components always sum to exact `grossSalary`)
- **Festival Bonuses**: 2 annual bonuses (100% of Basic Salary each)
- **Provident Fund (PF)**: `0%`

### 3.2 Bangladesh Income Tax Act, 2023 & Finance Act 2026 (`src/utils/taxCalculator.js`)
1. **Salary Exemption (`allowanceExemption`)**:
   - Lower of **1/3rd of Annual Gross Salary** or **BDT 5,00,000** (for AY 2026-27 onward; BDT 4,50,000 for AY 2025-26).
2. **Tax-Free Thresholds by Assessment Period & Category**:
   - **AY 2026-2027, 2027-2028**:
     - General Individual: **BDT 4,00,000**
     - Women & Senior Citizens (65+): **BDT 4,50,000**
     - Physically Challenged / Third Gender: **BDT 5,00,000**
     - Gazetted War-Wounded Freedom Fighters & July Warriors 2024: **BDT 5,25,000**
   - **AY 2028-2029 & 2029-2030**: +BDT 25,000 across all categories (Base BDT 4,25,000)
   - **AY 2030-2031**: +BDT 50,000 across all categories (Base BDT 4,50,000)
   - **Parent / Guardian of Person with Disability**: Adds **+BDT 50,000** per disabled child to the base threshold.
3. **Progressive Tax Slabs (AY 2026-27 onward)**:
   - First `Active Threshold`: `0%`
   - Next `BDT 3,00,000`: `10%`
   - Next `BDT 4,00,000`: `15%`
   - Next `BDT 5,00,000`: `20%`
   - Next `BDT 20,00,000`: `25%`
   - On Balance: `30%`
4. **Investment Tax Rebate — The 3-Limit Formula & Sector Caps**:
   - **Sector Caps on Eligible Investment**:
     - Deposit Pension Scheme (DPS): Capped at **BDT 1,20,000 / year**
     - Sanchayapatra / Govt. Securities: Capped at **BDT 5,00,000**
     - Recognized Provident Fund (RPF), Listed Stocks/Mutual Funds/ETFs, Life Insurance: 100% allowable
   - **3-Limit Rebate Formula**:
     - `Limit A` = `10%` of Total Allowable Investment
     - `Limit B` = `3%` of Total Taxable Income
     - `Limit C` = `BDT 7,50,000` (Statutory Maximum Cap)
     - `Rebate = MIN(Limit A, Limit B, Limit C)`
5. **Minimum Tax (when Taxable Income > Tax-Free Threshold)**:
   - Dhaka & Chattogram City Corporation: `BDT 5,000`
   - Other City Corporations: `BDT 4,000`
   - Outside City Corporations: `BDT 3,000`

---

## 4. Google Workspace Cloud Integration
- **Default Connected Account**: `erpatcl@gmail.com` (`DEFAULT_WORKSPACE_EMAIL` in `src/utils/googleWorkspaceService.js`)
- **Auto-Connect on Startup**: `ensureAutoConnectedWorkspace()` runs automatically when `HRMSProvider` mounts so `erpatcl@gmail.com` is connected immediately upon opening the software.
- **Root Google Drive Folder ID**: `1iQ_Gtp9GVtVztln4wKaRC_n_FSixfiEL`
- **Admin Login Accounts**: `erpatcl@gmail.com`, `atc@dhaka.net`, `hmekram@gmail.com`, `admin@atc.com.bd`

