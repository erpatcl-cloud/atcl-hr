import { getAssessmentPeriodInfo } from './taxCalculator';

const { jsPDF } = window.jspdf;

/**
 * Utility to convert numbers to English words (for payslips)
 */
function numberToWords(num) {
  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  if ((num = num.toString()).length > 9) return 'overflow';
  const n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
  if (!n) return '';
  let str = '';
  str += parseInt(n[1]) !== 0 ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'Crore ' : '';
  str += parseInt(n[2]) !== 0 ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'Lakh ' : '';
  str += parseInt(n[3]) !== 0 ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'Thousand ' : '';
  str += parseInt(n[4]) !== 0 ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'Hundred ' : '';
  str += parseInt(n[5]) !== 0 ? ((str !== '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) + 'Taka Only' : 'Taka Only';
  return str.trim();
}

/**
 * Generates a PDF Payslip and triggers a download
 */
export function generatePayslipPDF(employee, payroll, monthName) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Borders & Branding
  doc.rect(5, 5, 200, 287); // Page border
  
  // Header
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(0, 51, 102); // Deep Navy Primary
  doc.text('ADVANCE TECHNOLOGY CONSORTIUM LTD. (ATCL)', 105, 15, { align: 'center' });
  
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text('House-25, Road-11, Banani, Dhaka-1213, Bangladesh', 105, 20, { align: 'center' });
  doc.text('Phone: +880-2-9884567 | Email: info@atcl-bd.com | Web: www.atcl-bd.com', 105, 24, { align: 'center' });
  
  doc.setLineWidth(0.5);
  doc.setDrawColor(0, 51, 102);
  doc.line(10, 28, 200, 28);
  
  // Title
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(0, 51, 102);
  doc.text(`PAYSLIP FOR THE MONTH OF ${monthName.toUpperCase()}`, 105, 36, { align: 'center' });

  // Employee Information Box
  doc.setDrawColor(200, 200, 200);
  doc.rect(10, 42, 190, 32); // Info boundary
  
  doc.setFontSize(9);
  doc.setTextColor(50, 50, 50);
  
  // Left Column
  doc.setFont('Helvetica', 'bold');
  doc.text('Employee Code:', 12, 48);
  doc.setFont('Helvetica', 'normal');
  doc.text(employee.employeeCode, 42, 48);

  doc.setFont('Helvetica', 'bold');
  doc.text('Name (English):', 12, 54);
  doc.setFont('Helvetica', 'normal');
  doc.text(employee.fullNameEnglish, 42, 54);

  doc.setFont('Helvetica', 'bold');
  doc.text('Designation:', 12, 60);
  doc.setFont('Helvetica', 'normal');
  doc.text(employee.designation, 42, 60);

  doc.setFont('Helvetica', 'bold');
  doc.text('Department:', 12, 66);
  doc.setFont('Helvetica', 'normal');
  doc.text(employee.department, 42, 66);

  doc.setFont('Helvetica', 'bold');
  doc.text('Joining Date:', 12, 72);
  doc.setFont('Helvetica', 'normal');
  doc.text(employee.joiningDate || 'N/A', 42, 72);

  // Right Column
  doc.setFont('Helvetica', 'bold');
  doc.text('Bank Name:', 110, 48);
  doc.setFont('Helvetica', 'normal');
  doc.text(employee.bankName || 'City Bank Ltd.', 140, 48);

  doc.setFont('Helvetica', 'bold');
  doc.text('Account No:', 110, 54);
  doc.setFont('Helvetica', 'normal');
  doc.text(employee.bankAccountNo || 'N/A', 140, 54);

  doc.setFont('Helvetica', 'bold');
  doc.text('TIN Number:', 110, 60);
  doc.setFont('Helvetica', 'normal');
  doc.text(employee.tin || 'N/A', 140, 60);

  doc.setFont('Helvetica', 'bold');
  doc.text('Paid Days:', 110, 66);
  doc.setFont('Helvetica', 'normal');
  doc.text(`${payroll.paidDays || 30} days`, 140, 66);

  doc.setFont('Helvetica', 'bold');
  doc.text('LWP Days:', 110, 72);
  doc.setFont('Helvetica', 'normal');
  doc.text(`${payroll.unpaidLeaveDays || 0} days`, 140, 72);

  // Earnings & Deductions Table Headers
  doc.setFillColor(240, 245, 250);
  doc.rect(10, 80, 95, 8, 'F');
  doc.rect(105, 80, 95, 8, 'F');
  doc.rect(10, 80, 95, 8);
  doc.rect(105, 80, 95, 8);
  
  doc.setFont('Helvetica', 'bold');
  doc.setTextColor(0, 51, 102);
  doc.text('EARNINGS', 12, 85);
  doc.text('Amount (BDT)', 85, 85, { align: 'right' });
  doc.text('DEDUCTIONS', 107, 85);
  doc.text('Amount (BDT)', 180, 85, { align: 'right' });

  // Table Data Rows
  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(50, 50, 50);

  const earnings = [
    { label: 'Basic Salary', val: payroll.basicSalary },
    { label: 'House Rent Allowance', val: payroll.houseRent },
    { label: 'Medical Allowance', val: payroll.medicalAllowance },
    { label: 'Conveyance Allowance', val: payroll.conveyanceAllowance },
    { label: 'Mobile Allowance', val: payroll.mobileAllowance },
    { label: 'Other Allowances', val: payroll.otherAllowances || 0 },
    { label: 'Overtime Allowance', val: payroll.overtimePay || 0 },
    { label: 'Bonus / Incentives', val: payroll.bonusPay || 0 }
  ];

  const deductions = [
    { label: 'TDS (Income Tax Deducted)', val: payroll.taxDeduction || 0 },
    { label: 'Provident Fund (Employer Contrib)', val: payroll.providentFund || 0 },
    { label: 'LWP Deduction', val: payroll.unpaidLeaveDeduction || 0 },
    { label: 'Advance/Loan Recovery', val: payroll.loanRecovery || 0 },
    { label: 'Other Deductions', val: payroll.otherDeductions || 0 }
  ];

  let y = 88;
  const maxRows = Math.max(earnings.length, deductions.length);
  for (let i = 0; i < maxRows; i++) {
    doc.rect(10, y, 95, 8);
    doc.rect(105, y, 95, 8);

    if (earnings[i]) {
      doc.text(earnings[i].label, 12, y + 5);
      doc.text(Math.round(earnings[i].val).toLocaleString(), 85, y + 5, { align: 'right' });
    }
    if (deductions[i]) {
      doc.text(deductions[i].label, 107, y + 5);
      doc.text(Math.round(deductions[i].val).toLocaleString(), 180, y + 5, { align: 'right' });
    }
    y += 8;
  }

  // Totals Row
  doc.setFillColor(245, 245, 245);
  doc.rect(10, y, 95, 8, 'F');
  doc.rect(105, y, 95, 8, 'F');
  doc.rect(10, y, 95, 8);
  doc.rect(105, y, 95, 8);

  doc.setFont('Helvetica', 'bold');
  doc.text('Gross Earnings (A)', 12, y + 5);
  doc.text(Math.round(payroll.grossSalary).toLocaleString(), 85, y + 5, { align: 'right' });

  doc.text('Total Deductions (B)', 107, y + 5);
  doc.text(Math.round(payroll.totalDeductions).toLocaleString(), 180, y + 5, { align: 'right' });

  y += 8;

  // Net Pay Box
  doc.setFillColor(230, 240, 250);
  doc.rect(10, y + 4, 190, 10, 'F');
  doc.rect(10, y + 4, 190, 10);
  
  doc.setFontSize(11);
  doc.setTextColor(0, 51, 102);
  doc.text('NET SALARY PAYABLE (A - B):', 12, y + 10.5);
  doc.text(`BDT ${Math.round(payroll.netSalary).toLocaleString()}/-`, 180, y + 10.5, { align: 'right' });

  // In Words
  y += 18;
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(50, 50, 50);
  doc.text('In Words:', 10, y);
  doc.setFont('Helvetica', 'normal');
  doc.text(numberToWords(Math.round(payroll.netSalary)), 28, y);

  // Signatures
  doc.setLineWidth(0.3);
  doc.setDrawColor(150, 150, 150);

  y += 35;
  doc.line(15, y, 65, y);
  doc.line(77, y, 127, y);
  doc.line(140, y, 190, y);

  doc.setFontSize(8.5);
  doc.setFont('Helvetica', 'bold');
  doc.text('Employee Signature', 40, y + 4, { align: 'center' });
  doc.text('Prepared By (HR)', 102, y + 4, { align: 'center' });
  doc.text('Authorized Signature', 165, y + 4, { align: 'center' });

  // Footer
  doc.setFont('Helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(150, 150, 150);
  doc.text('Note: This is a system-generated payslip and does not require a physical stamp unless specified.', 105, 275, { align: 'center' });

  doc.save(`Payslip_${employee.employeeCode}_${monthName.replace(/ /g, '_')}.pdf`);
}

/**
 * Generates a Bangladesh Income Tax Deduction / Clearance Certificate (Section 139)
 * Compliant with Income Tax Act, 2023 & Finance Act 2026 (Slabs & 3-Limit Rebate Formula)
 */
export function generateTaxCertificatePDF(employee, taxSummary, taxYear = '2025-2026', declaration = {}) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const periodInfo = getAssessmentPeriodInfo(taxYear);

  doc.rect(5, 5, 200, 287); // Border

  // Corporate Header
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(0, 51, 102);
  doc.text('ADVANCE TECHNOLOGY CONSORTIUM LTD. (ATCL)', 105, 16, { align: 'center' });

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 100, 100);
  doc.text('House-25, Road-11, Banani, Dhaka-1213, Bangladesh | Web: www.atcl-bd.com | Email: tax@atcl-bd.com', 105, 21, { align: 'center' });
  doc.text('Corporate Status: Private Limited Company | Statutory Deduction Authority under Section 86 & Section 139', 105, 25, { align: 'center' });

  doc.setLineWidth(0.5);
  doc.setDrawColor(0, 51, 102);
  doc.line(10, 28, 200, 28);

  // Certificate Title
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(0, 51, 102);
  doc.text('TO WHOM IT MAY CONCERN', 105, 36, { align: 'center' });
  doc.text('CERTIFICATE OF INCOME TAX DEDUCTED AT SOURCE (TDS) FROM SALARY', 105, 42, { align: 'center' });
  doc.setFontSize(9.5);
  doc.text(`Assessment Year: ${periodInfo.assessmentYear} | Income Year: ${periodInfo.incomeYear} | (${periodInfo.actLabel})`, 105, 47.5, { align: 'center' });

  // Body
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(40, 40, 40);
  
  const tinNum = declaration.tin || employee.tin || 'N/A';
  const circle = declaration.taxCircle || employee.taxCircle || 'Circle 1';
  const zone = declaration.taxZone || employee.taxZone || 'Zone 15';
  const catLabel = taxSummary.categoryLabel || 'General Individual (Male, under 65)';
  const parentNote = taxSummary.parentAddition > 0 ? ' (+ BDT 50,000 Section 5 Disability Guardian Adjustment)' : '';

  let bodyY = 55;
  const bodyText = `This is to certify that ${employee.fullNameEnglish} (${employee.designation}, ${employee.department}), Employee Code: ${employee.employeeCode}, is a regular employee of Advance Technology Consortium Ltd. (ATCL). He/She is assessed under Tax ${circle}, Tax ${zone}, holding NID: ${employee.nid || 'N/A'} and 12-Digit e-TIN: ${tinNum}.
Taxpayer Statutory Category: ${catLabel}${parentNote} | Active Tax-Free Threshold: BDT ${Math.round(taxSummary.taxFreeThreshold || 400000).toLocaleString()}.`;

  const lines = doc.splitTextToSize(bodyText, 180);
  doc.text(lines, 15, bodyY);

  // Part A: Salary, Exemption & 3-Limit Rebate Table
  bodyY += lines.length * 4.5 + 4;
  
  const rowsA = [
    ['1. Annual Gross Salary Income (Basic + Allowances + Festival Bonuses)', Math.round(taxSummary.annualGross).toLocaleString(), false],
    ['2. Less: Statutory Exemption on Salary (Lower of 1/3rd Gross or BDT ' + Math.round(taxSummary.salaryExemptionCap || 500000).toLocaleString('en-IN') + ')', `(${Math.round(taxSummary.allowanceExemption).toLocaleString()})`, false],
    ['3. Total Annual Taxable Salary Income (1 - 2)', Math.round(taxSummary.taxableIncome).toLocaleString(), true],
    [`4. Active Statutory Tax-Free Threshold (${catLabel})`, Math.round(taxSummary.taxFreeThreshold || 400000).toLocaleString(), false],
    ['5. Gross Income Tax Liability (Progressive Slab Computation)', Math.round(taxSummary.grossTax).toLocaleString(), true],
    [
      `6. Total Declared Investment: BDT ${Math.round(taxSummary.actualTotalInvestment || 0).toLocaleString()} | Allowable (After Sector Caps): BDT ${Math.round(taxSummary.allowableTotalInvestment || 0).toLocaleString()}`,
      `Limit A (10%): ${Math.round(taxSummary.rebateBreakdown?.limitA_tenPercentOfAllowableInvestment || 0).toLocaleString()}`,
      false
    ],
    [
      `7. Less: Investment Tax Rebate [Lower of Limit A (10% Inv), Limit B (3% Inc: ${Math.round(taxSummary.rebateBreakdown?.limitB_threePercentOfTaxableIncome || 0).toLocaleString()}), Limit C (7,50,000)]`,
      `(${Math.round(taxSummary.rebate).toLocaleString()})`,
      false
    ],
    [
      `8. Net Annual Income Tax Payable / Deducted at Source (TDS)${taxSummary.isMinimumTaxApplied ? ' [Minimum Tax Applied]' : ''}`,
      Math.round(taxSummary.netTax).toLocaleString(),
      true
    ],
    ['9. Average Monthly TDS Deducted from Payroll (Net Tax / 12)', Math.round(taxSummary.monthlyTaxDeduction).toLocaleString(), false]
  ];

  const rowH = 7;
  const tableHeight = (rowsA.length + 1) * rowH;

  doc.setDrawColor(190, 190, 190);
  doc.setFillColor(240, 245, 250);
  doc.rect(15, bodyY, 180, rowH, 'F');
  doc.rect(15, bodyY, 180, tableHeight);
  doc.line(145, bodyY, 145, bodyY + tableHeight);

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(0, 51, 102);
  doc.text('PART A: STATUTORY SALARY & TAX ASSESSMENT COMPUTATION', 17, bodyY + 4.8);
  doc.text('Amount (BDT)', 192, bodyY + 4.8, { align: 'right' });

  let curY = bodyY + rowH;
  rowsA.forEach(([label, val, isBold]) => {
    doc.line(15, curY, 195, curY);
    doc.setFont('Helvetica', isBold ? 'bold' : 'normal');
    doc.setFontSize(8);
    doc.setTextColor(40, 40, 40);
    doc.text(label, 17, curY + 4.8);
    doc.text(String(val), 192, curY + 4.8, { align: 'right' });
    curY += rowH;
  });

  // Part B: Progressive Slab Breakdown Table
  bodyY = curY + 6;
  const slabs = taxSummary.slabsApplied || [];
  const slabRowH = 6.2;
  const slabTableH = (slabs.length + 1) * slabRowH;

  doc.setFillColor(240, 245, 250);
  doc.rect(15, bodyY, 180, slabRowH, 'F');
  doc.rect(15, bodyY, 180, slabTableH);
  doc.line(95, bodyY, 95, bodyY + slabTableH);
  doc.line(125, bodyY, 125, bodyY + slabTableH);
  doc.line(160, bodyY, 160, bodyY + slabTableH);

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(0, 51, 102);
  doc.text('PART B: PROGRESSIVE SLAB TIER', 17, bodyY + 4.3);
  doc.text('RATE', 110, bodyY + 4.3, { align: 'center' });
  doc.text('TAXABLE IN SLAB', 157, bodyY + 4.3, { align: 'right' });
  doc.text('SLAB TAX (BDT)', 192, bodyY + 4.3, { align: 'right' });

  let slabY = bodyY + slabRowH;
  slabs.forEach(s => {
    doc.line(15, slabY, 195, slabY);
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(7.8);
    doc.setTextColor(50, 50, 50);
    doc.text(String(s.slabName || s.range), 17, slabY + 4.3);
    doc.text(`${s.rate}%`, 110, slabY + 4.3, { align: 'center' });
    doc.text(Math.round(s.incomeInSlab || 0).toLocaleString(), 157, slabY + 4.3, { align: 'right' });
    doc.text(Math.round(s.tax || 0).toLocaleString(), 192, slabY + 4.3, { align: 'right' });
    slabY += slabRowH;
  });

  bodyY = slabY + 7;

  // In Words
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(0, 51, 102);
  doc.text('Total Annual TDS in Words:', 15, bodyY);
  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(40, 40, 40);
  doc.text(numberToWords(Math.round(taxSummary.netTax)), 58, bodyY);

  // Conclusion statement
  bodyY += 7;
  const conclusion = `Certified that the sum of BDT ${Math.round(taxSummary.netTax).toLocaleString()} (Monthly TDS: BDT ${Math.round(taxSummary.monthlyTaxDeduction).toLocaleString()}) has been computed and deducted from the employee's salary in accordance with the ${periodInfo.actLabel} and deposited to Bangladesh Government Treasury via automated challan / bank transfer.`;
  const conclusionLines = doc.splitTextToSize(conclusion, 180);
  doc.setFontSize(8.2);
  doc.text(conclusionLines, 15, bodyY);

  // Signatures
  bodyY = Math.min(265, bodyY + conclusionLines.length * 4.5 + 18);
  doc.setLineWidth(0.3);
  doc.line(130, bodyY, 188, bodyY);
  
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('Authorized Signatory (HR & Finance)', 130, bodyY + 4.5);
  doc.setFont('Helvetica', 'normal');
  doc.text('Advance Technology Consortium Ltd.', 130, bodyY + 8.5);

  // Date
  doc.setFont('Helvetica', 'bold');
  doc.text('Date of Issue:', 15, bodyY + 4.5);
  doc.setFont('Helvetica', 'normal');
  const today = new Date();
  doc.text(`${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`, 38, bodyY + 4.5);

  doc.save(`ATCL_TDS_Certificate_${employee.employeeCode}_AY_${periodInfo.assessmentYear.replace(/[^0-9-]/g, '_')}.pdf`);
}
