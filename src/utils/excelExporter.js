const XLSX = window.XLSX;

/**
 * General utility to export an array of JSON objects to Excel
 * 
 * @param {Array<Object>} data - Array of flat objects to export
 * @param {string} fileName - Destination filename (excluding extension)
 * @param {string} sheetName - Sheet tab name
 */
export function exportToExcel(data, fileName = 'export', sheetName = 'Sheet1') {
  try {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
    return true;
  } catch (error) {
    console.error('Failed to export to Excel:', error);
    return false;
  }
}

/**
 * Export a specialized Bank Transfer file for corporate accounts
 * 
 * @param {Array<Object>} payrollRows - Array of processed employee payroll records for a month
 * @param {string} bankName - Bank Name (e.g., Prime Bank, City Bank)
 * @param {string} paymentMonth - Format "YYYY-MM"
 */
export function exportBankTransferExcel(payrollRows, bankName = 'City Bank Ltd.', paymentMonth = 'June 2026') {
  try {
    const data = payrollRows.map((row, idx) => ({
      'Sl No.': idx + 1,
      'Employee Code': row.employeeCode,
      'Employee Name': row.name,
      'Designation': row.designation,
      'Department': row.department,
      'Bank Name': row.bankName || bankName,
      'Account Number': row.accountNo || 'N/A',
      'Net Salary (BDT)': row.netSalary,
      'Month': paymentMonth,
      'Signature/Remarks': ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);

    // Set column widths for better spacing
    const wscols = [
      { wch: 8 },  // Sl No
      { wch: 15 }, // Code
      { wch: 25 }, // Name
      { wch: 20 }, // Designation
      { wch: 15 }, // Department
      { wch: 20 }, // Bank Name
      { wch: 20 }, // Account No
      { wch: 18 }, // Net Salary
      { wch: 12 }, // Month
      { wch: 15 }  // Remarks
    ];
    worksheet['!cols'] = wscols;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Bank Advice');
    XLSX.writeFile(workbook, `ATCL_Bank_Transfer_${paymentMonth.replace(/ /g, '_')}.xlsx`);
    return true;
  } catch (error) {
    console.error('Failed to export bank transfer sheet:', error);
    return false;
  }
}

/**
 * Export Tax Deductions and Calculations summary
 * 
 * @param {Array<Object>} taxSummaries - Computed tax objects
 * @param {string} taxYear - e.g., "2024-2025"
 */
export function exportTaxReportExcel(taxSummaries, taxYear = '2025-2026') {
  try {
    const data = taxSummaries.map((summary, idx) => ({
      'Sl No.': idx + 1,
      'Employee ID': summary.employeeCode,
      'Employee Name': summary.name,
      'Taxpayer Category': summary.categoryLabel || 'General Individual',
      'TIN': summary.tin || 'N/A',
      'Tax Zone': summary.taxZone || 'N/A',
      'Tax Circle': summary.taxCircle || 'N/A',
      'Annual Gross Salary (BDT)': Math.round(summary.annualGross || 0),
      'Allowance Exemption (BDT)': Math.round(summary.allowanceExemption || 0),
      'Taxable Income (BDT)': Math.round(summary.taxableIncome || 0),
      'Active Tax-Free Threshold (BDT)': Math.round(summary.taxFreeThreshold || 400000),
      'Gross Annual Tax (BDT)': Math.round(summary.grossTax || 0),
      'Declared Investment (BDT)': Math.round(summary.actualTotalInvestment || 0),
      'Allowable Investment (BDT)': Math.round(summary.allowableTotalInvestment || 0),
      'Investment Tax Rebate (BDT)': Math.round(summary.rebate || 0),
      'Net Annual Tax / TDS (BDT)': Math.round(summary.netTax || 0),
      'Monthly Deducted TDS (BDT)': Math.round(summary.monthlyTaxDeduction || 0)
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `Tax Summary ${taxYear}`);
    XLSX.writeFile(workbook, `ATCL_Tax_Summary_${taxYear}.xlsx`);
    return true;
  } catch (error) {
    console.error('Failed to export tax report:', error);
    return false;
  }
}

/**
 * Parse an uploaded Excel (.xlsx, .xls) or CSV (.csv) file into an array of row objects
 *
 * @param {File} file - Browser File object
 * @returns {Promise<{ headers: Array<string>, rows: Array<Object>, sheetName: string }>}
 */
export function parseUploadedSpreadsheet(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('No file provided'));
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
        const firstSheetName = workbook.SheetNames[0];
        if (!firstSheetName) {
          reject(new Error('No sheets found in the uploaded file.'));
          return;
        }
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonRows = XLSX.utils.sheet_to_json(worksheet, { defval: '', raw: false });
        const headerMatrix = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        const headers = (headerMatrix[0] || []).map(h => String(h).trim());
        resolve({
          headers,
          rows: jsonRows,
          sheetName: firstSheetName
        });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read the uploaded file.'));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Download pre-formatted Excel templates for Bulk Uploads
 *
 * @param {'employees' | 'attendance' | 'salary_tax' | 'holidays'} templateType
 */
export function downloadTemplateExcel(templateType) {
  try {
    let sampleData = [];
    let fileName = 'ATCL_Template';
    let sheetName = 'Template';

    if (templateType === 'employees') {
      fileName = 'ATCL_Employee_Bulk_Upload_Template';
      sheetName = 'Employees';
      sampleData = [
        {
          'Employee Code': 'ATCL-0578',
          'Full Name (English)': 'Engr. Tanvir Ahmed',
          'Full Name (Bangla)': 'ইঞ্জিনিয়ার তানভীর আহমেদ',
          'Designation': 'Service Engineer',
          'Department': 'Engineering Education Equipment',
          'Gross Salary': 45000,
          'Joining Date': '2026-01-15',
          'Date of Birth': '1995-06-20',
          'Gender': 'male',
          'Blood Group': 'O+',
          'Marital Status': 'Single',
          'Mobile Number': '+8801711000000',
          'Official Email': 'tanvir@atcl-bd.com',
          'Personal Mobile': '+8801811000000',
          'Personal Email': 'tanvir.personal@gmail.com',
          'NID': '1995123456789',
          'Passport Number': '',
          'TIN': '123456789012',
          'Tax Zone': 'Zone 15',
          'Tax Circle': 'Circle 1',
          'Bank Name': 'Al-Arafah Islami Bank Ltd.',
          'Bank Account No': '0141120099999',
          'Intercom': '125',
          'Educational Qualification': 'B.Sc. in EEE',
          'Father Name': 'Md. Rafiqul Ahmed',
          'Mother Name': 'Nasreen Akter',
          'Nominee': 'Nasreen Akter',
          'Present Address': 'Banani, Dhaka - 1213',
          'Permanent Address': 'Cumilla Sadar, Cumilla',
          'Status': 'Active'
        }
      ];
    } else if (templateType === 'attendance') {
      fileName = 'ATCL_Attendance_Bulk_Template';
      sheetName = 'Attendance';
      const todayStr = new Date().toISOString().split('T')[0];
      sampleData = [
        {
          'Employee Code': 'ATCL-0501',
          'Date': todayStr,
          'Check In': '08:55:00',
          'Check Out': '17:10:00',
          'Status': 'Present',
          'Check In Type': 'Office',
          'Remarks': 'Regular biometric attendance'
        },
        {
          'Employee Code': 'ATCL-0502',
          'Date': todayStr,
          'Check In': '09:20:00',
          'Check Out': '17:30:00',
          'Status': 'Present',
          'Check In Type': 'Office',
          'Remarks': 'Late arrival due to traffic'
        }
      ];
    } else if (templateType === 'salary_tax') {
      fileName = 'ATCL_Salary_And_Tax_Bulk_Template';
      sheetName = 'Salary_Tax';
      sampleData = [
        {
          'Employee Code': 'ATCL-0501',
          'Gross Salary': 105000,
          'Bank Name': 'Al-Arafah Islami Bank Ltd.',
          'Bank Account No': '0141120094958',
          'TIN': '780303412459',
          'Tax Zone': 'Zone 15',
          'Tax Circle': 'Circle 1',
          'DPS Contribution': 60000,
          'Sanchaypatra': 100000,
          'Provident Fund': 0,
          'Stocks': 50000,
          'Other Eligible Investment': 20000
        }
      ];
    } else if (templateType === 'holidays') {
      fileName = 'ATCL_Holidays_Template';
      sheetName = 'Holidays';
      sampleData = [
        {
          'Date': '2026-02-21',
          'Holiday Name': 'International Mother Language Day',
          'Type': 'National Holiday',
          'Days': 1
        },
        {
          'Date': '2026-03-26',
          'Holiday Name': 'Independence Day',
          'Type': 'National Holiday',
          'Days': 1
        }
      ];
    }

    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    const headers = Object.keys(sampleData[0] || {});
    worksheet['!cols'] = headers.map(h => ({ wch: Math.max(h.length + 5, 18) }));

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
    return true;
  } catch (error) {
    console.error('Failed to download template:', error);
    return false;
  }
}
