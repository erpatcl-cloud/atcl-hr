import React, { useContext, useState, useEffect } from 'react';
import { HRMSContext } from '../context/HRMSContext';
import { exportToExcel } from '../utils/excelExporter';
import { uploadFileToStorage } from '../utils/firebase';
import {
  DIVISIONS,
  getDistrictsForDivision,
  getUpazilasForDistrict,
  getPostCodesForUpazila,
  parseAddressString
} from '../utils/bangladeshGeo';

export default function CompanyInfo() {
  const {
    companyInfo,
    companyAuditLogs,
    updateCompanyInfo,
    addCompanyBranch,
    updateCompanyBranch,
    deleteCompanyBranch,
    addCompanyBankAccount,
    deleteCompanyBankAccount,
    uploadCompanyDocument,
    employees,
    attendanceLogs,
    leaveRequests,
    currentUser
  } = useContext(HRMSContext);

  // Checks if user is authorized to edit (Super Admin or HR Admin)
  const isAuthorizedToEdit = currentUser.role === 'Administrator' || currentUser.role === 'Super Admin';

  // States
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditMode, setIsEditMode] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Form States
  const [overviewForm, setOverviewForm] = useState({ ...companyInfo });

  // Upload progress simulation states
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoProgress, setLogoProgress] = useState(0);
  const [coverUploading, setCoverUploading] = useState(false);
  const [coverProgress, setCoverProgress] = useState(0);
  const [sealUploading, setSealUploading] = useState(false);
  const [sealProgress, setSealProgress] = useState(0);

  // Dynamic document upload form state
  const [docFile, setDocFile] = useState(null);
  const [docType, setDocType] = useState('Trade License');
  const [docUploading, setDocUploading] = useState(false);
  const [docProgress, setDocProgress] = useState(0);

  // New Branch state
  const [newBranch, setNewBranch] = useState({
    name: '',
    code: '',
    manager: '',
    address: '',
    branchDivision: 'Dhaka',
    branchDistrict: 'Dhaka',
    branchUpazila: 'Banani',
    branchPostCode: '1213',
    branchStreet: '',
    contactNumber: '',
    email: '',
    status: 'Active'
  });

  const handleHeadOfficeDivisionChange = (div) => {
    const districts = getDistrictsForDivision(div);
    const district = districts[0];
    const upazilas = getUpazilasForDistrict(district);
    const upazila = upazilas[0];
    const postCodes = getPostCodesForUpazila(upazila);
    const postCode = postCodes[0];
    setOverviewForm(prev => ({
      ...prev,
      headOffice: {
        ...prev.headOffice,
        division: div,
        district: district,
        area: upazila,
        city: district,
        postalCode: postCode
      }
    }));
  };

  const handleHeadOfficeDistrictChange = (dist) => {
    const upazilas = getUpazilasForDistrict(dist);
    const upazila = upazilas[0];
    const postCodes = getPostCodesForUpazila(upazila);
    const postCode = postCodes[0];
    setOverviewForm(prev => ({
      ...prev,
      headOffice: {
        ...prev.headOffice,
        district: dist,
        area: upazila,
        city: dist,
        postalCode: postCode
      }
    }));
  };

  const handleHeadOfficeUpazilaChange = (up) => {
    const postCodes = getPostCodesForUpazila(up);
    const postCode = postCodes[0];
    setOverviewForm(prev => ({
      ...prev,
      headOffice: {
        ...prev.headOffice,
        area: up,
        postalCode: postCode
      }
    }));
  };

  const handleBranchDivisionChange = (div) => {
    const districts = getDistrictsForDivision(div);
    const district = districts[0];
    const upazilas = getUpazilasForDistrict(district);
    const upazila = upazilas[0];
    const postCodes = getPostCodesForUpazila(upazila);
    const postCode = postCodes[0];
    setNewBranch(prev => ({
      ...prev,
      branchDivision: div,
      branchDistrict: district,
      branchUpazila: upazila,
      branchPostCode: postCode
    }));
  };

  const handleBranchDistrictChange = (dist) => {
    const upazilas = getUpazilasForDistrict(dist);
    const upazila = upazilas[0];
    const postCodes = getPostCodesForUpazila(upazila);
    const postCode = postCodes[0];
    setNewBranch(prev => ({
      ...prev,
      branchDistrict: dist,
      branchUpazila: upazila,
      branchPostCode: postCode
    }));
  };

  const handleBranchUpazilaChange = (up) => {
    const postCodes = getPostCodesForUpazila(up);
    const postCode = postCodes[0];
    setNewBranch(prev => ({
      ...prev,
      branchUpazila: up,
      branchPostCode: postCode
    }));
  };
  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);
  const [editingBranchId, setEditingBranchId] = useState(null);

  // New Bank Account state
  const [newBank, setNewBank] = useState({
    bankName: '',
    branchName: '',
    accountName: '',
    accountNumber: '',
    routingNumber: '',
    swiftCode: '',
    certificateUrl: ''
  });
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [bankFileUploading, setBankFileUploading] = useState(false);
  const [bankFileProgress, setBankFileProgress] = useState(0);

  // Document Vault filter & search states
  const [docSearch, setDocSearch] = useState('');
  const [docFilter, setDocFilter] = useState('All');

  // Sync state with context changes
  useEffect(() => {
    setOverviewForm({ ...companyInfo });
  }, [companyInfo]);

  // Real-time Statistics Computations
  const activeEmployees = employees.filter(e => e.status === 'Active');
  const inactiveEmployees = employees.filter(e => e.status === 'Inactive');
  const maleEmployees = employees.filter(e => e.gender === 'male');
  const femaleEmployees = employees.filter(e => e.gender === 'female');
  
  // Calculate probation vs permanent (assume probation if joined in last 180 days)
  const getProbationAndPermanentStats = () => {
    let probation = 0;
    let permanent = 0;
    const today = new Date();
    employees.forEach(emp => {
      if (emp.status === 'Active') {
        const join = new Date(emp.joiningDate);
        const diffTime = Math.abs(today - join);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays <= 180) {
          probation++;
        } else {
          permanent++;
        }
      }
    });
    return { probation, permanent };
  };
  const { probation: probationEmployees, permanent: permanentEmployees } = getProbationAndPermanentStats();

  // New joiners this month
  const getNewJoinersThisMonth = () => {
    const today = new Date();
    const currentMonth = today.getMonth(); // 0-indexed
    const currentYear = today.getFullYear();
    return employees.filter(emp => {
      const join = new Date(emp.joiningDate);
      return join.getMonth() === currentMonth && join.getFullYear() === currentYear;
    }).length;
  };
  const newJoinersThisMonth = getNewJoinersThisMonth();

  // Active departments and designations count
  const totalDepts = [...new Set(employees.map(e => e.department))].length;
  const totalDesignations = [...new Set(employees.map(e => e.designation))].length;

  // Attendance stats for today (2026-06-06 or current system date)
  const todayDateStr = new Date().toISOString().split('T')[0];
  const todayLogs = attendanceLogs.filter(log => log.date === todayDateStr);
  const presentToday = todayLogs.length;
  const lateToday = todayLogs.filter(log => log.isLate).length;
  
  const getLeavesToday = () => {
    const today = new Date(todayDateStr);
    return leaveRequests.filter(req => {
      if (req.status !== 'Approved') return false;
      const start = new Date(req.startDate);
      const end = new Date(req.endDate);
      return today >= start && today <= end;
    }).length;
  };
  const leavesToday = getLeavesToday();
  const absentToday = Math.max(0, activeEmployees.length - presentToday - leavesToday);

  // Expiring Trade License calculations
  const getTradeLicenseDaysLeft = () => {
    if (!companyInfo.legalInfo?.tradeLicenseExpiryDate) return 0;
    const expiry = new Date(companyInfo.legalInfo.tradeLicenseExpiryDate);
    const today = new Date();
    const diffTime = expiry - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };
  const tradeLicenseDaysLeft = getTradeLicenseDaysLeft();

  // Company Age calculation
  const getCompanyAge = () => {
    if (!companyInfo.legalInfo?.incorporationDate) return "N/A";
    const incDate = new Date(companyInfo.legalInfo.incorporationDate);
    const today = new Date();
    let years = today.getFullYear() - incDate.getFullYear();
    let months = today.getMonth() - incDate.getMonth();
    if (months < 0 || (months === 0 && today.getDate() < incDate.getDate())) {
      years--;
      months += 12;
    }
    return `${years} Years, ${months} Months`;
  };

  // Image upload handler (Logo, Cover, Seal)
  const handleImageUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    if (type === 'logo') {
      setLogoUploading(true);
      setLogoProgress(0);
      try {
        const downloadUrl = await uploadFileToStorage(file, `company/branding/${file.name}`, (p) => setLogoProgress(p));
        setOverviewForm(prev => ({ ...prev, logoUrl: downloadUrl }));
        setSuccessMsg("Branding Logo uploaded successfully.");
        setTimeout(() => setSuccessMsg(''), 4000);
      } catch (err) {
        setErrorMsg("Failed to upload logo.");
        setTimeout(() => setErrorMsg(''), 4000);
      } finally {
        setLogoUploading(false);
      }
    } else if (type === 'cover') {
      setCoverUploading(true);
      setCoverProgress(0);
      try {
        const downloadUrl = await uploadFileToStorage(file, `company/branding/${file.name}`, (p) => setCoverProgress(p));
        setOverviewForm(prev => ({ ...prev, coverUrl: downloadUrl }));
        setSuccessMsg("Branding Cover uploaded successfully.");
        setTimeout(() => setSuccessMsg(''), 4000);
      } catch (err) {
        setErrorMsg("Failed to upload cover.");
        setTimeout(() => setErrorMsg(''), 4000);
      } finally {
        setCoverUploading(false);
      }
    } else if (type === 'seal') {
      setSealUploading(true);
      setSealProgress(0);
      try {
        const downloadUrl = await uploadFileToStorage(file, `company/branding/${file.name}`, (p) => setSealProgress(p));
        setOverviewForm(prev => ({ ...prev, sealUrl: downloadUrl }));
        setSuccessMsg("Branding Corporate Seal uploaded successfully.");
        setTimeout(() => setSuccessMsg(''), 4000);
      } catch (err) {
        setErrorMsg("Failed to upload seal.");
        setTimeout(() => setErrorMsg(''), 4000);
      } finally {
        setSealUploading(false);
      }
    }
  };

  // Document Vault document upload
  const handleDocUploadSubmit = async (e) => {
    e.preventDefault();
    if (!docFile) {
      setErrorMsg("Please select a file to upload.");
      return;
    }

    setDocUploading(true);
    setDocProgress(0);
    try {
      const downloadUrl = await uploadFileToStorage(docFile, `company/documents/${docFile.name}`, (p) => setDocProgress(p));
      const documentMetadata = {
        name: docFile.name,
        type: docType,
        size: `${(docFile.size / 1024 / 1024).toFixed(2)} MB`,
        fileData: downloadUrl
      };
      uploadCompanyDocument(documentMetadata, currentUser.name);
      setSuccessMsg(`Document ${docFile.name} uploaded successfully to repository.`);
      setDocFile(null);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setErrorMsg("Failed to upload document.");
      setTimeout(() => setErrorMsg(''), 4000);
    } finally {
      setDocUploading(false);
    }
  };

  // Branch Form Submit
  const handleBranchSubmit = (e) => {
    e.preventDefault();
    const finalBranchAddress = `${newBranch.branchStreet || ''}, ${newBranch.branchUpazila || ''}, ${newBranch.branchDistrict || ''}, ${newBranch.branchDivision || ''} - ${newBranch.branchPostCode || ''}`;
    const branchWithAddress = {
      ...newBranch,
      address: finalBranchAddress
    };

    if (editingBranchId) {
      updateCompanyBranch(editingBranchId, branchWithAddress, currentUser.name);
      setSuccessMsg("Branch details updated successfully.");
    } else {
      addCompanyBranch(branchWithAddress, currentUser.name);
      setSuccessMsg("New branch created successfully.");
    }
    setNewBranch({
      name: '',
      code: '',
      manager: '',
      address: '',
      branchDivision: 'Dhaka',
      branchDistrict: 'Dhaka',
      branchUpazila: 'Banani',
      branchPostCode: '1213',
      branchStreet: '',
      contactNumber: '',
      email: '',
      status: 'Active'
    });
    setIsBranchModalOpen(false);
    setEditingBranchId(null);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleEditBranchClick = (branch) => {
    setEditingBranchId(branch.id);
    const parsed = parseAddressString(branch.address);
    setNewBranch({
      ...branch,
      branchDivision: parsed.division,
      branchDistrict: parsed.district,
      branchUpazila: parsed.upazila,
      branchPostCode: parsed.postCode,
      branchStreet: parsed.street
    });
    setIsBranchModalOpen(true);
  };

  // Bank Form Submit
  const handleBankSubmit = async (e) => {
    e.preventDefault();
    addCompanyBankAccount(newBank, currentUser.name);
    setSuccessMsg("Corporate Bank Account added successfully.");
    setNewBank({ bankName: '', branchName: '', accountName: '', accountNumber: '', routingNumber: '', swiftCode: '', certificateUrl: '' });
    setIsBankModalOpen(false);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleBankCertificateUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setBankFileUploading(true);
    setBankFileProgress(0);
    try {
      const downloadUrl = await uploadFileToStorage(file, `company/banking/${file.name}`, (p) => setBankFileProgress(p));
      setNewBank(prev => ({ ...prev, certificateUrl: downloadUrl }));
      setSuccessMsg("Bank Solvency Certificate uploaded.");
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setErrorMsg("Failed to upload solvency certificate.");
      setTimeout(() => setErrorMsg(''), 3000);
    } finally {
      setBankFileUploading(false);
    }
  };

  // Save profile changes
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      await updateCompanyInfo(overviewForm, currentUser.name);
      setIsEditMode(false);
      setSuccessMsg("Company Profile details updated and saved to Firestore.");
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err) {
      setErrorMsg("Error saving company profile changes.");
      setTimeout(() => setErrorMsg(''), 5000);
    }
  };

  // Document Vault filtering & search
  const filteredDocs = (companyInfo.documents || []).filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(docSearch.toLowerCase()) || doc.type.toLowerCase().includes(docSearch.toLowerCase());
    const matchesFilter = docFilter === 'All' || doc.type === docFilter;
    return matchesSearch && matchesFilter;
  });

  // Export Branches to Excel
  const handleExportBranches = () => {
    const data = (companyInfo.branches || []).map(b => ({
      'Branch Code': b.code,
      'Branch Name': b.name,
      'Branch Manager': b.manager,
      'Email Address': b.email,
      'Contact Phone': b.contactNumber,
      'Address Location': b.address,
      'Branch Status': b.status
    }));
    exportToExcel(data, `${companyInfo.shortName}_Branches_Report`, 'Branches List');
  };

  // Export Bank Accounts to Excel
  const handleExportBanks = () => {
    const data = (companyInfo.bankAccounts || []).map(a => ({
      'Bank Name': a.bankName,
      'Branch Name': a.branchName,
      'Account Name': a.accountName,
      'Account Number': a.accountNumber,
      'Routing Number': a.routingNumber,
      'SWIFT Code': a.swiftCode
    }));
    exportToExcel(data, `${companyInfo.shortName}_Bank_Accounts_Report`, 'Bank Accounts');
  };

  // Export Factsheet Dossier to PDF
  const handleExportPDFDossier = () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    
    // Branding borders
    doc.rect(5, 5, 200, 287);
    
    // Header
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(0, 80, 160);
    doc.text(companyInfo.nameEnglish.toUpperCase(), 105, 18, { align: 'center' });
    
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(companyInfo.nameBangla, 105, 23, { align: 'center' });
    doc.text(`Slogan: ${companyInfo.slogan || 'N/A'}`, 105, 27, { align: 'center' });
    
    doc.line(10, 31, 200, 31);
    
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(0, 80, 160);
    doc.text('CORPORATE FACTS SHEET & DOSSIER', 105, 39, { align: 'center' });
    
    // 1. Basic Info
    doc.setFontSize(11);
    doc.text('1. Company Overview', 10, 48);
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(50, 50, 50);
    
    let textY = 54;
    doc.text(`Short Name: ${companyInfo.shortName}`, 12, textY);
    doc.text(`Business Type: ${companyInfo.legalInfo?.businessType || 'N/A'}`, 110, textY);
    
    textY += 6;
    doc.text(`Incorporation Date: ${companyInfo.legalInfo?.incorporationDate || 'N/A'}`, 12, textY);
    doc.text(`Registration No: ${companyInfo.legalInfo?.registrationNumber || 'N/A'}`, 110, textY);
    
    textY += 6;
    doc.text(`TIN Number: ${companyInfo.legalInfo?.tinNumber || 'N/A'}`, 12, textY);
    doc.text(`BIN Number: ${companyInfo.legalInfo?.binNumber || 'N/A'}`, 110, textY);
    
    textY += 6;
    doc.text(`Corporate Email: ${companyInfo.contactInfo?.corporateEmail || 'N/A'}`, 12, textY);
    doc.text(`Website URL: ${companyInfo.contactInfo?.websiteUrl || 'N/A'}`, 110, textY);
    
    // 2. Vision & Mission
    textY += 12;
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(0, 80, 160);
    doc.text('2. Corporate Vision & Mission', 10, textY);
    
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(50, 50, 50);
    textY += 6;
    
    const visionLines = doc.splitTextToSize(`Vision: ${companyInfo.vision || 'N/A'}`, 180);
    doc.text(visionLines, 12, textY);
    textY += visionLines.length * 4.5 + 2;
    
    const missionLines = doc.splitTextToSize(`Mission: ${companyInfo.mission || 'N/A'}`, 180);
    doc.text(missionLines, 12, textY);
    textY += missionLines.length * 4.5 + 2;
    
    // 3. Head Office
    textY += 6;
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(0, 80, 160);
    doc.text('3. Head Office Address', 10, textY);
    
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(50, 50, 50);
    textY += 6;
    doc.text(`Address Line 1: ${companyInfo.headOffice?.addressLine1 || 'N/A'}`, 12, textY);
    doc.text(`Postal Code: ${companyInfo.headOffice?.postalCode || 'N/A'}`, 110, textY);
    
    textY += 6;
    doc.text(`Area / City: ${companyInfo.headOffice?.area || 'N/A'} / ${companyInfo.headOffice?.city || 'N/A'}`, 12, textY);
    doc.text(`Country: ${companyInfo.headOffice?.country || 'N/A'}`, 110, textY);
    
    textY += 6;
    doc.text(`Latitude / Longitude: ${companyInfo.headOffice?.latitude || 'N/A'} / ${companyInfo.headOffice?.longitude || 'N/A'}`, 12, textY);
    
    // 4. Compliance & Working Hours
    textY += 12;
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(0, 80, 160);
    doc.text('4. Compliance Policies', 10, textY);
    
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(50, 50, 50);
    textY += 6;
    doc.text(`Weekly Holiday: ${companyInfo.compliance?.weeklyHoliday || 'N/A'}`, 12, textY);
    doc.text(`Office Working Hours: ${companyInfo.compliance?.startTime || 'N/A'} to ${companyInfo.compliance?.endTime || 'N/A'}`, 110, textY);
    
    textY += 6;
    doc.text(`Ramadan Office Time: ${companyInfo.compliance?.ramadanStartTime || 'N/A'} to ${companyInfo.compliance?.ramadanEndTime || 'N/A'}`, 12, textY);
    doc.text(`Salary Payment Date: Every ${companyInfo.payrollSettings?.salaryPaymentDate || 'N/A'}th of the month`, 110, textY);
    
    // 5. Statistics
    textY += 12;
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(0, 80, 160);
    doc.text('5. Current Employee & Office Statistics', 10, textY);
    
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(50, 50, 50);
    textY += 6;
    doc.text(`Total Active Employees: ${activeEmployees.length} (Permanent: ${permanentEmployees}, Probation: ${probationEmployees})`, 12, textY);
    doc.text(`Total Branches: ${(companyInfo.branches || []).length} Office Outlets`, 110, textY);
    
    textY += 6;
    doc.text(`Department Count: ${totalDepts} Functional Divisions`, 12, textY);
    doc.text(`Designation Count: ${totalDesignations} Professional Titles`, 110, textY);
    
    // Footer
    doc.setFont('Helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(150, 150, 150);
    doc.text(`Generated on: ${new Date().toLocaleString()} | User: ${currentUser.name} | Confirmed by NBR/RJSC`, 105, 280, { align: 'center' });
    
    doc.save(`${companyInfo.shortName}_Corporate_Factsheet.pdf`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      
      {/* 1. Profile Visual Banner */}
      <div className="card" style={{
        padding: 0,
        position: 'relative',
        overflow: 'hidden',
        background: 'var(--card-bg)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--border-radius-lg)'
      }}>
        {/* Cover Photo */}
        <div style={{
          height: 180,
          background: overviewForm.coverUrl ? `url(${overviewForm.coverUrl}) center/cover no-repeat` : 'linear-gradient(135deg, var(--primary-color) 0%, var(--primary-light) 100%)',
          position: 'relative',
          display: 'flex',
          alignItems: 'flex-end',
          padding: '20px 32px'
        }}>
          {isEditMode && (
            <label style={{
              position: 'absolute',
              top: 16,
              right: 16,
              background: 'rgba(0,0,0,0.5)',
              color: '#fff',
              fontSize: '0.75rem',
              padding: '6px 12px',
              borderRadius: 4,
              cursor: 'pointer',
              fontWeight: 600,
              backdropFilter: 'blur(4px)'
            }}>
              Change Cover
              <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'cover')} style={{ display: 'none' }} />
            </label>
          )}

          {/* Slogan Overlay */}
          <div style={{
            position: 'absolute',
            bottom: 16,
            right: 32,
            textAlign: 'right',
            color: '#fff',
            textShadow: '0 2px 4px rgba(0,0,0,0.3)'
          }}>
            <h4 style={{ fontSize: '1.25rem', fontWeight: 800, italic: true }}>"{overviewForm.slogan}"</h4>
          </div>
        </div>

        {/* Profile Details Header */}
        <div style={{
          padding: '24px 32px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 24,
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: -50
        }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'flex-end' }}>
            {/* Logo */}
            <div style={{
              width: 110,
              height: 110,
              borderRadius: 'var(--border-radius-md)',
              background: '#fff',
              border: '4px solid var(--card-bg)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative'
            }}>
              {overviewForm.logoUrl ? (
                <img src={overviewForm.logoUrl} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              ) : (
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary-color)' }}>
                  {overviewForm.shortName}
                </div>
              )}

              {isEditMode && (
                <label style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'rgba(0,0,0,0.6)',
                  color: '#fff',
                  fontSize: '0.65rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  textAlign: 'center',
                  padding: 8
                }}>
                  Upload Logo
                  <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'logo')} style={{ display: 'none' }} />
                </label>
              )}
            </div>

            {/* Names & Basic Metadata */}
            <div style={{ paddingBottom: 6 }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>{overviewForm.nameEnglish}</h2>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{overviewForm.nameBangla}</div>
              <div style={{ display: 'flex', gap: 16, fontSize: '0.775rem', color: 'var(--text-muted)', marginTop: 6, fontWeight: 600 }}>
                <span>Type: {overviewForm.legalInfo?.businessType}</span>
                <span>•</span>
                <span>Incorporated: {overviewForm.legalInfo?.incorporationDate}</span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 12 }}>
            <button className="btn btn-outline" onClick={handleExportPDFDossier}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 15, height: 15 }}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>
              <span>Corporate Factsheet</span>
            </button>

            {isAuthorizedToEdit && (
              isEditMode ? (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-outline" onClick={() => { setIsEditMode(false); setOverviewForm({ ...companyInfo }); }}>Cancel</button>
                  <button className="btn btn-primary" onClick={handleSaveProfile}>Save Profile</button>
                </div>
              ) : (
                <button className="btn btn-secondary" onClick={() => setIsEditMode(true)}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 14, height: 14 }}><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
                  <span>Edit Profile</span>
                </button>
              )
            )}
          </div>
        </div>

        {/* Branding upload progress loader if any */}
        {(logoUploading || coverUploading || sealUploading) && (
          <div style={{ padding: '0 32px 16px' }}>
            <div style={{ background: 'rgba(0,180,216,0.08)', border: '1px dashed var(--primary-color)', padding: '12px 16px', borderRadius: 'var(--border-radius-sm)', fontSize: '0.8rem', color: 'var(--primary-color)' }}>
              <span>Uploading asset to Firebase Storage... Progress: </span>
              <strong>{logoUploading ? logoProgress : (coverUploading ? coverProgress : sealProgress)}%</strong>
              <div style={{ height: 4, width: '100%', background: 'var(--border-color)', marginTop: 8, borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ height: '100%', background: 'var(--primary-color)', width: `${logoUploading ? logoProgress : (coverUploading ? coverProgress : sealProgress)}%` }}></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. Top-level ERP Dashboard Metrics Widgets */}
      <div className="stats-grid">
        <div className="card stat-card">
          <div className="stat-info">
            <span className="stat-label">Company Age</span>
            <span className="stat-value" style={{ fontSize: '1.25rem' }}>{getCompanyAge()}</span>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Inc: {companyInfo.legalInfo?.incorporationDate}</span>
          </div>
          <div className="stat-icon-wrapper">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 18, height: 18 }}><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
          </div>
        </div>

        <div className="card stat-card teal">
          <div className="stat-info">
            <span className="stat-label">Active Headcount</span>
            <span className="stat-value">{activeEmployees.length} Active</span>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Male: {maleEmployees.length} | Female: {femaleEmployees.length}</span>
          </div>
          <div className="stat-icon-wrapper">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 18, height: 18 }}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
          </div>
        </div>

        <div className="card stat-card green">
          <div className="stat-info">
            <span className="stat-label">Attendance Today</span>
            <span className="stat-value">{presentToday} Present</span>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>On Leave: {leavesToday} | Absent: {absentToday}</span>
          </div>
          <div className="stat-icon-wrapper">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 18, height: 18 }}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
          </div>
        </div>

        <div className="card stat-card purple">
          <div className="stat-info">
            <span className="stat-label">Trade License Expiry</span>
            <span className="stat-value" style={{ color: tradeLicenseDaysLeft < 60 ? 'var(--danger)' : 'inherit' }}>
              {tradeLicenseDaysLeft} Days
            </span>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Exp: {companyInfo.legalInfo?.tradeLicenseExpiryDate}</span>
          </div>
          <div className="stat-icon-wrapper">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 18, height: 18 }}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>
          </div>
        </div>
      </div>

      {/* Messages banner */}
      {successMsg && (
        <div className="card" style={{ padding: '12px 18px', background: 'rgba(16, 185, 129, 0.06)', border: '1px solid var(--success)', color: 'var(--success)', fontSize: '0.85rem', fontWeight: 600 }}>
          {successMsg}
        </div>
      )}

      {errorMsg && (
        <div className="card" style={{ padding: '12px 18px', background: 'rgba(239, 68, 68, 0.06)', border: '1px solid var(--danger)', color: 'var(--danger)', fontSize: '0.85rem', fontWeight: 600 }}>
          {errorMsg}
        </div>
      )}

      {/* 3. Tabbed Content Interface */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Navigation Tab Header */}
        <div className="tabs-header" style={{ overflowX: 'auto', whiteSpace: 'nowrap' }}>
          <button className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => { setActiveTab('overview'); setIsEditMode(false); }}>Profile & Legal</button>
          <button className={`tab-btn ${activeTab === 'locations' ? 'active' : ''}`} onClick={() => { setActiveTab('locations'); setIsEditMode(false); }}>Locations & Branches</button>
          <button className={`tab-btn ${activeTab === 'finance' ? 'active' : ''}`} onClick={() => { setActiveTab('finance'); setIsEditMode(false); }}>Finance & Banking</button>
          <button className={`tab-btn ${activeTab === 'compliance' ? 'active' : ''}`} onClick={() => { setActiveTab('compliance'); setIsEditMode(false); }}>Compliance & Policies</button>
          <button className={`tab-btn ${activeTab === 'vault' ? 'active' : ''}`} onClick={() => { setActiveTab('vault'); setIsEditMode(false); }}>Document Vault</button>
          <button className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`} onClick={() => { setActiveTab('analytics'); setIsEditMode(false); }}>Org Analytics</button>
          <button className={`tab-btn ${activeTab === 'security' ? 'active' : ''}`} onClick={() => { setActiveTab('security'); setIsEditMode(false); }}>Security & Logs</button>
        </div>

        {/* Tab Body Contents */}
        <div style={{ marginTop: 8 }}>
          
          {/* TAB 1: OVERVIEW & LEGAL */}
          {activeTab === 'overview' && (
            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              
              {/* Mission Vision values */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
                <div className="card" style={{ background: 'var(--bg-input)', border: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <h4 style={{ color: 'var(--primary-color)', borderBottom: '1px solid var(--border-color)', paddingBottom: 4 }}>Vision Statement</h4>
                  {isEditMode ? (
                    <textarea rows="3" value={overviewForm.vision} onChange={(e) => setOverviewForm(prev => ({ ...prev, vision: e.target.value }))} />
                  ) : (
                    <p style={{ fontSize: '0.825rem', lineHeight: 1.5 }}>{companyInfo.vision}</p>
                  )}
                </div>

                <div className="card" style={{ background: 'var(--bg-input)', border: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <h4 style={{ color: 'var(--primary-color)', borderBottom: '1px solid var(--border-color)', paddingBottom: 4 }}>Mission Statement</h4>
                  {isEditMode ? (
                    <textarea rows="3" value={overviewForm.mission} onChange={(e) => setOverviewForm(prev => ({ ...prev, mission: e.target.value }))} />
                  ) : (
                    <p style={{ fontSize: '0.825rem', lineHeight: 1.5 }}>{companyInfo.mission}</p>
                  )}
                </div>

                <div className="card" style={{ background: 'var(--bg-input)', border: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <h4 style={{ color: 'var(--primary-color)', borderBottom: '1px solid var(--border-color)', paddingBottom: 4 }}>Corporate Core Values</h4>
                  {isEditMode ? (
                    <textarea rows="3" value={overviewForm.coreValues} onChange={(e) => setOverviewForm(prev => ({ ...prev, coreValues: e.target.value }))} />
                  ) : (
                    <p style={{ fontSize: '0.825rem', lineHeight: 1.5 }}>{companyInfo.coreValues}</p>
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="form-group">
                <label>Company Description</label>
                {isEditMode ? (
                  <textarea rows="4" value={overviewForm.description} onChange={(e) => setOverviewForm(prev => ({ ...prev, description: e.target.value }))} />
                ) : (
                  <p style={{ fontSize: '0.85rem', lineHeight: 1.6, color: 'var(--text-secondary)' }}>{companyInfo.description}</p>
                )}
              </div>

              {/* Legal info registration */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <h4 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: 6, color: 'var(--primary-color)' }}>
                  Registration & Legal Certificates
                </h4>

                <div className="form-row">
                  <div className="form-group">
                    <label>Business Type *</label>
                    {isEditMode ? (
                      <select value={overviewForm.legalInfo.businessType} onChange={(e) => setOverviewForm(prev => ({ ...prev, legalInfo: { ...prev.legalInfo, businessType: e.target.value } }))}>
                        <option value="Private Limited Company">Private Limited Company</option>
                        <option value="Public Limited Company">Public Limited Company</option>
                        <option value="Partnership Firm">Partnership Firm</option>
                        <option value="Proprietorship">Proprietorship</option>
                        <option value="NGO">NGO</option>
                        <option value="Branch Office">Branch Office</option>
                        <option value="Liaison Office">Liaison Office</option>
                      </select>
                    ) : (
                      <div className="view-field-value">{companyInfo.legalInfo?.businessType || 'N/A'}</div>
                    )}
                  </div>

                  <div className="form-group">
                    <label>Incorporation Date *</label>
                    {isEditMode ? (
                      <input type="date" value={overviewForm.legalInfo.incorporationDate} onChange={(e) => setOverviewForm(prev => ({ ...prev, legalInfo: { ...prev.legalInfo, incorporationDate: e.target.value } }))} />
                    ) : (
                      <div className="view-field-value">{companyInfo.legalInfo?.incorporationDate || 'N/A'}</div>
                    )}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Company Registration No (RJSC) *</label>
                    {isEditMode ? (
                      <input type="text" value={overviewForm.legalInfo.registrationNumber} onChange={(e) => setOverviewForm(prev => ({ ...prev, legalInfo: { ...prev.legalInfo, registrationNumber: e.target.value } }))} />
                    ) : (
                      <div className="view-field-value">{companyInfo.legalInfo?.registrationNumber || 'N/A'}</div>
                    )}
                  </div>

                  <div className="form-group">
                    <label>Trade License Number *</label>
                    {isEditMode ? (
                      <input type="text" value={overviewForm.legalInfo.tradeLicenseNumber} onChange={(e) => setOverviewForm(prev => ({ ...prev, legalInfo: { ...prev.legalInfo, tradeLicenseNumber: e.target.value } }))} />
                    ) : (
                      <div className="view-field-value">{companyInfo.legalInfo?.tradeLicenseNumber || 'N/A'}</div>
                    )}
                  </div>

                  <div className="form-group">
                    <label>Trade License Expiry Date *</label>
                    {isEditMode ? (
                      <input type="date" value={overviewForm.legalInfo.tradeLicenseExpiryDate} onChange={(e) => setOverviewForm(prev => ({ ...prev, legalInfo: { ...prev.legalInfo, tradeLicenseExpiryDate: e.target.value } }))} />
                    ) : (
                      <div className="view-field-value">{companyInfo.legalInfo?.tradeLicenseExpiryDate || 'N/A'}</div>
                    )}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>BIN Number *</label>
                    {isEditMode ? (
                      <input type="text" value={overviewForm.legalInfo.binNumber} onChange={(e) => setOverviewForm(prev => ({ ...prev, legalInfo: { ...prev.legalInfo, binNumber: e.target.value } }))} />
                    ) : (
                      <div className="view-field-value">{companyInfo.legalInfo?.binNumber || 'N/A'}</div>
                    )}
                  </div>

                  <div className="form-group">
                    <label>TIN Number *</label>
                    {isEditMode ? (
                      <input type="text" value={overviewForm.legalInfo.tinNumber} onChange={(e) => setOverviewForm(prev => ({ ...prev, legalInfo: { ...prev.legalInfo, tinNumber: e.target.value } }))} />
                    ) : (
                      <div className="view-field-value">{companyInfo.legalInfo?.tinNumber || 'N/A'}</div>
                    )}
                  </div>

                  <div className="form-group">
                    <label>RJSC Registration Number</label>
                    {isEditMode ? (
                      <input type="text" value={overviewForm.legalInfo.rjscRegistrationNumber || ''} onChange={(e) => setOverviewForm(prev => ({ ...prev, legalInfo: { ...prev.legalInfo, rjscRegistrationNumber: e.target.value } }))} />
                    ) : (
                      <div className="view-field-value">{companyInfo.legalInfo?.rjscRegistrationNumber || 'N/A'}</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Corporate Seal display */}
              <div className="form-row" style={{ marginTop: 12 }}>
                <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                  <div style={{ width: 80, height: 80, border: '1px dashed var(--border-color)', borderRadius: '50%', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {overviewForm.sealUrl ? (
                      <img src={overviewForm.sealUrl} alt="Seal" style={{ width: '80%', height: '80%', objectFit: 'contain' }} />
                    ) : (
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>No Seal</span>
                    )}
                  </div>
                  <div>
                    <strong style={{ display: 'block', fontSize: '0.85rem' }}>Corporate Seal</strong>
                    <span style={{ display: 'block', fontSize: '0.725rem', color: 'var(--text-muted)', marginBottom: 8 }}>Used for signing corporate letters/approvals</span>
                    {isEditMode && (
                      <label className="btn btn-outline btn-sm" style={{ cursor: 'pointer' }}>
                        Upload Seal
                        <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'seal')} style={{ display: 'none' }} />
                      </label>
                    )}
                  </div>
                </div>
              </div>

              {isEditMode && (
                <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start', marginTop: 16 }}>
                  Save Legal Profile Settings
                </button>
              )}
            </form>
          )}

          {/* TAB 2: LOCATIONS & BRANCHES */}
          {activeTab === 'locations' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
              
              {/* Head office */}
              <form onSubmit={handleSaveProfile} className="card" style={{ border: '1px solid var(--border-color)', boxShadow: 'none' }}>
                <h3 style={{ color: 'var(--primary-color)', marginBottom: 16 }}>Head Office Particulars</h3>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Office Building Name</label>
                    {isEditMode ? (
                      <input type="text" value={overviewForm.headOffice.name} onChange={(e) => setOverviewForm(prev => ({ ...prev, headOffice: { ...prev.headOffice, name: e.target.value } }))} />
                    ) : (
                      <div className="view-field-value">{companyInfo.headOffice?.name}</div>
                    )}
                  </div>
                  
                  <div className="form-group">
                    <label>Address Line 1 *</label>
                    {isEditMode ? (
                      <input type="text" value={overviewForm.headOffice.addressLine1} onChange={(e) => setOverviewForm(prev => ({ ...prev, headOffice: { ...prev.headOffice, addressLine1: e.target.value } }))} />
                    ) : (
                      <div className="view-field-value">{companyInfo.headOffice?.addressLine1}</div>
                    )}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Address Line 2</label>
                    {isEditMode ? (
                      <input type="text" value={overviewForm.headOffice.addressLine2} onChange={(e) => setOverviewForm(prev => ({ ...prev, headOffice: { ...prev.headOffice, addressLine2: e.target.value } }))} />
                    ) : (
                      <div className="view-field-value">{companyInfo.headOffice?.addressLine2 || 'N/A'}</div>
                    )}
                  </div>

                  <div className="form-group">
                    <label>Country *</label>
                    {isEditMode ? (
                      <input type="text" value={overviewForm.headOffice.country} onChange={(e) => setOverviewForm(prev => ({ ...prev, headOffice: { ...prev.headOffice, country: e.target.value } }))} />
                    ) : (
                      <div className="view-field-value">{companyInfo.headOffice?.country}</div>
                    )}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Division *</label>
                    {isEditMode ? (
                      <select
                        value={overviewForm.headOffice.division || 'Dhaka'}
                        onChange={(e) => handleHeadOfficeDivisionChange(e.target.value)}
                      >
                        {DIVISIONS.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    ) : (
                      <div className="view-field-value">{companyInfo.headOffice?.division} Division</div>
                    )}
                  </div>

                  <div className="form-group">
                    <label>District *</label>
                    {isEditMode ? (
                      <select
                        value={overviewForm.headOffice.district || 'Dhaka'}
                        onChange={(e) => handleHeadOfficeDistrictChange(e.target.value)}
                      >
                        {getDistrictsForDivision(overviewForm.headOffice.division || 'Dhaka').map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    ) : (
                      <div className="view-field-value">{companyInfo.headOffice?.district} District</div>
                    )}
                  </div>

                  <div className="form-group">
                    <label>Area / Upazila *</label>
                    {isEditMode ? (
                      <select
                        value={overviewForm.headOffice.area || 'Banani'}
                        onChange={(e) => handleHeadOfficeUpazilaChange(e.target.value)}
                      >
                        {getUpazilasForDistrict(overviewForm.headOffice.district || 'Dhaka').map(u => <option key={u} value={u}>{u}</option>)}
                      </select>
                    ) : (
                      <div className="view-field-value">{companyInfo.headOffice?.area}</div>
                    )}
                  </div>

                  <div className="form-group">
                    <label>Postal Code *</label>
                    {isEditMode ? (
                      <select
                        value={overviewForm.headOffice.postalCode || '1213'}
                        onChange={(e) => setOverviewForm(prev => ({
                          ...prev,
                          headOffice: { ...prev.headOffice, postalCode: e.target.value }
                        }))}
                      >
                        {getPostCodesForUpazila(overviewForm.headOffice.area || 'Banani').map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    ) : (
                      <div className="view-field-value">{companyInfo.headOffice?.postalCode}</div>
                    )}
                  </div>
                </div>

                {/* Geo map coordination */}
                <div className="form-row">
                  <div className="form-group">
                    <label>Google Map Link</label>
                    {isEditMode ? (
                      <input type="url" value={overviewForm.headOffice.mapLocation} onChange={(e) => setOverviewForm(prev => ({ ...prev, headOffice: { ...prev.headOffice, mapLocation: e.target.value } }))} />
                    ) : (
                      <div className="view-field-value">
                        <a href={companyInfo.headOffice?.mapLocation} target="_blank" rel="noreferrer" style={{ color: 'var(--primary-color)', fontWeight: 600, textDecoration: 'underline' }}>
                          View on Google Maps Map Link
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="form-group">
                    <label>Coordinates (Latitude / Longitude)</label>
                    {isEditMode ? (
                      <div style={{ display: 'flex', gap: 10 }}>
                        <input type="number" step="0.00001" placeholder="Latitude" value={overviewForm.headOffice.latitude} onChange={(e) => setOverviewForm(prev => ({ ...prev, headOffice: { ...prev.headOffice, latitude: parseFloat(e.target.value) || 0 } }))} />
                        <input type="number" step="0.00001" placeholder="Longitude" value={overviewForm.headOffice.longitude} onChange={(e) => setOverviewForm(prev => ({ ...prev, headOffice: { ...prev.headOffice, longitude: parseFloat(e.target.value) || 0 } }))} />
                      </div>
                    ) : (
                      <div className="view-field-value">Lat: {companyInfo.headOffice?.latitude} | Lng: {companyInfo.headOffice?.longitude}</div>
                    )}
                  </div>
                </div>

                {isEditMode && (
                  <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start', marginTop: 16 }}>
                    Save Head Office Info
                  </button>
                )}
              </form>

              {/* Branch Offices Manager */}
              <div className="card" style={{ border: '1px solid var(--border-color)', boxShadow: 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <h3 style={{ color: 'var(--primary-color)' }}>Corporate Branch Offices</h3>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-outline btn-sm" onClick={handleExportBranches}>Export Branches</button>
                    {isAuthorizedToEdit && (
                      <button className="btn btn-primary btn-sm" onClick={() => { setEditingBranchId(null); setNewBranch({ name: '', code: '', manager: '', address: '', branchDivision: 'Dhaka', branchDistrict: 'Dhaka', branchUpazila: 'Banani', branchPostCode: '1213', branchStreet: '', contactNumber: '', email: '', status: 'Active' }); setIsBranchModalOpen(true); }}>
                        + Add Branch
                      </button>
                    )}
                  </div>
                </div>

                <div className="table-container" style={{ padding: 0 }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Branch Code</th>
                        <th>Branch Name</th>
                        <th>Branch Manager</th>
                        <th>Contact Number</th>
                        <th>Email Address</th>
                        <th>Status</th>
                        {isAuthorizedToEdit && <th style={{ textAlign: 'right' }}>Actions</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {(companyInfo.branches || []).length === 0 ? (
                        <tr>
                          <td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>No branches recorded.</td>
                        </tr>
                      ) : (
                        companyInfo.branches.map(branch => (
                          <tr key={branch.id}>
                            <td style={{ fontWeight: 700, color: 'var(--primary-color)' }}>{branch.code}</td>
                            <td style={{ fontWeight: 600 }}>{branch.name}</td>
                            <td>{branch.manager}</td>
                            <td>{branch.contactNumber}</td>
                            <td>{branch.email}</td>
                            <td>
                              <span className={`badge ${branch.status === 'Active' ? 'badge-success' : 'badge-danger'}`}>
                                {branch.status}
                              </span>
                            </td>
                            {isAuthorizedToEdit && (
                              <td style={{ textAlign: 'right' }}>
                                <div style={{ display: 'inline-flex', gap: 8 }}>
                                  <button className="btn btn-outline btn-sm" onClick={() => handleEditBranchClick(branch)}>Edit</button>
                                  <button className="btn btn-danger btn-sm" onClick={() => deleteCompanyBranch(branch.id, currentUser.name)}>Remove</button>
                                </div>
                              </td>
                            )}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Branch Add/Edit Modal */}
              {isBranchModalOpen && (
                <div className="modal-overlay">
                  <div className="modal-content" style={{ maxWidth: 550 }}>
                    <div className="modal-header">
                      <h3 className="modal-title">{editingBranchId ? 'Edit Branch Office' : 'Create Branch Office'}</h3>
                      <button className="modal-close-btn" onClick={() => setIsBranchModalOpen(false)}>&times;</button>
                    </div>
                    <form onSubmit={handleBranchSubmit}>
                      <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div className="form-row">
                          <div className="form-group">
                            <label>Branch Name *</label>
                            <input type="text" required value={newBranch.name} onChange={(e) => setNewBranch(prev => ({ ...prev, name: e.target.value }))} />
                          </div>
                          <div className="form-group">
                            <label>Branch Code *</label>
                            <input type="text" required placeholder="e.g. DHK-02" value={newBranch.code} onChange={(e) => setNewBranch(prev => ({ ...prev, code: e.target.value }))} />
                          </div>
                        </div>

                        <div className="form-row">
                          <div className="form-group">
                            <label>Branch Manager *</label>
                            <input type="text" required value={newBranch.manager} onChange={(e) => setNewBranch(prev => ({ ...prev, manager: e.target.value }))} />
                          </div>
                          <div className="form-group">
                            <label>Status</label>
                            <select value={newBranch.status} onChange={(e) => setNewBranch(prev => ({ ...prev, status: e.target.value }))}>
                              <option value="Active">Active</option>
                              <option value="Inactive">Inactive</option>
                            </select>
                          </div>
                        </div>

                        <div className="form-row">
                          <div className="form-group">
                            <label>Contact Number *</label>
                            <input type="tel" required value={newBranch.contactNumber} onChange={(e) => setNewBranch(prev => ({ ...prev, contactNumber: e.target.value }))} />
                          </div>
                          <div className="form-group">
                            <label>Branch E-Mail *</label>
                            <input type="email" required value={newBranch.email} onChange={(e) => setNewBranch(prev => ({ ...prev, email: e.target.value }))} />
                          </div>
                        </div>

                        <h5 style={{ color: 'var(--primary-color)', fontSize: '0.85rem', marginBottom: 4, marginTop: 8 }}>Branch Address</h5>
                        <div className="form-row">
                          <div className="form-group">
                            <label>Division *</label>
                            <select
                              value={newBranch.branchDivision || 'Dhaka'}
                              onChange={(e) => handleBranchDivisionChange(e.target.value)}
                            >
                              {DIVISIONS.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                          </div>
                          <div className="form-group">
                            <label>District *</label>
                            <select
                              value={newBranch.branchDistrict || 'Dhaka'}
                              onChange={(e) => handleBranchDistrictChange(e.target.value)}
                            >
                              {getDistrictsForDivision(newBranch.branchDivision || 'Dhaka').map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                          </div>
                          <div className="form-group">
                            <label>Upazila *</label>
                            <select
                              value={newBranch.branchUpazila || 'Banani'}
                              onChange={(e) => handleBranchUpazilaChange(e.target.value)}
                            >
                              {getUpazilasForDistrict(newBranch.branchDistrict || 'Dhaka').map(u => <option key={u} value={u}>{u}</option>)}
                            </select>
                          </div>
                          <div className="form-group">
                            <label>Postal Code *</label>
                            <select
                              value={newBranch.branchPostCode || '1213'}
                              onChange={(e) => setNewBranch(prev => ({ ...prev, branchPostCode: e.target.value }))}
                            >
                              {getPostCodesForUpazila(newBranch.branchUpazila || 'Banani').map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                          </div>
                        </div>
                        <div className="form-group">
                          <label>Branch Street / House Address *</label>
                          <input
                            type="text"
                            required
                            placeholder="House No., Road No., Area Details"
                            value={newBranch.branchStreet || ''}
                            onChange={(e) => setNewBranch(prev => ({ ...prev, branchStreet: e.target.value }))}
                          />
                        </div>
                      </div>
                      <div className="modal-footer">
                        <button type="button" className="btn btn-outline" onClick={() => setIsBranchModalOpen(false)}>Cancel</button>
                        <button type="submit" className="btn btn-primary">Save Branch</button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* TAB 3: FINANCE & BANKING */}
          {activeTab === 'finance' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
              
              {/* Business Info & Taxes */}
              <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <div className="card" style={{ border: '1px solid var(--border-color)', boxShadow: 'none' }}>
                  <h3 style={{ color: 'var(--primary-color)', marginBottom: 16 }}>Tax, VAT & Legal Particulars</h3>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label>Tax Zone *</label>
                      {isEditMode ? (
                        <input type="text" value={overviewForm.taxVat.taxZone} onChange={(e) => setOverviewForm(prev => ({ ...prev, taxVat: { ...prev.taxVat, taxZone: e.target.value } }))} />
                      ) : (
                        <div className="view-field-value">{companyInfo.taxVat?.taxZone}</div>
                      )}
                    </div>
                    <div className="form-group">
                      <label>Tax Circle *</label>
                      {isEditMode ? (
                        <input type="text" value={overviewForm.taxVat.taxCircle} onChange={(e) => setOverviewForm(prev => ({ ...prev, taxVat: { ...prev.taxVat, taxCircle: e.target.value } }))} />
                      ) : (
                        <div className="view-field-value">{companyInfo.taxVat?.taxCircle}</div>
                      )}
                    </div>
                    <div className="form-group">
                      <label>VAT Circle</label>
                      {isEditMode ? (
                        <input type="text" value={overviewForm.taxVat.vatCircle} onChange={(e) => setOverviewForm(prev => ({ ...prev, taxVat: { ...prev.taxVat, vatCircle: e.target.value } }))} />
                      ) : (
                        <div className="view-field-value">{companyInfo.taxVat?.vatCircle || 'N/A'}</div>
                      )}
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>VAT Commissionerate</label>
                      {isEditMode ? (
                        <input type="text" value={overviewForm.taxVat.vatCommissionerate} onChange={(e) => setOverviewForm(prev => ({ ...prev, taxVat: { ...prev.taxVat, vatCommissionerate: e.target.value } }))} />
                      ) : (
                        <div className="view-field-value">{companyInfo.taxVat?.vatCommissionerate || 'N/A'}</div>
                      )}
                    </div>
                    <div className="form-group">
                      <label>Authorized Tax Representative</label>
                      {isEditMode ? (
                        <input type="text" value={overviewForm.taxVat.authorizedTaxRepresentative} onChange={(e) => setOverviewForm(prev => ({ ...prev, taxVat: { ...prev.taxVat, authorizedTaxRepresentative: e.target.value } }))} />
                      ) : (
                        <div className="view-field-value">{companyInfo.taxVat?.authorizedTaxRepresentative || 'N/A'}</div>
                      )}
                    </div>
                    <div className="form-group">
                      <label>Tax Consultant Agency</label>
                      {isEditMode ? (
                        <input type="text" value={overviewForm.taxVat.taxConsultantInfo} onChange={(e) => setOverviewForm(prev => ({ ...prev, taxVat: { ...prev.taxVat, taxConsultantInfo: e.target.value } }))} />
                      ) : (
                        <div className="view-field-value">{companyInfo.taxVat?.taxConsultantInfo || 'N/A'}</div>
                      )}
                    </div>
                  </div>

                  {isEditMode && (
                    <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start', marginTop: 16 }}>
                      Save Tax Profile
                    </button>
                  )}
                </div>

                <div className="card" style={{ border: '1px solid var(--border-color)', boxShadow: 'none' }}>
                  <h3 style={{ color: 'var(--primary-color)', marginBottom: 16 }}>Corporate Capital & Shareholding</h3>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Authorized Capital (BDT)</label>
                      {isEditMode ? (
                        <input type="number" value={overviewForm.businessInfo.authorizedCapital} onChange={(e) => setOverviewForm(prev => ({ ...prev, businessInfo: { ...prev.businessInfo, authorizedCapital: parseInt(e.target.value) || 0 } }))} />
                      ) : (
                        <div className="view-field-value">৳{companyInfo.businessInfo?.authorizedCapital.toLocaleString()}</div>
                      )}
                    </div>
                    <div className="form-group">
                      <label>Paid-up Capital (BDT)</label>
                      {isEditMode ? (
                        <input type="number" value={overviewForm.businessInfo.paidUpCapital} onChange={(e) => setOverviewForm(prev => ({ ...prev, businessInfo: { ...prev.businessInfo, paidUpCapital: parseInt(e.target.value) || 0 } }))} />
                      ) : (
                        <div className="view-field-value">৳{companyInfo.businessInfo?.paidUpCapital.toLocaleString()}</div>
                      )}
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Number of Directors</label>
                      {isEditMode ? (
                        <input type="number" value={overviewForm.businessInfo.numDirectors} onChange={(e) => setOverviewForm(prev => ({ ...prev, businessInfo: { ...prev.businessInfo, numDirectors: parseInt(e.target.value) || 0 } }))} />
                      ) : (
                        <div className="view-field-value">{companyInfo.businessInfo?.numDirectors} Directors</div>
                      )}
                    </div>
                    <div className="form-group">
                      <label>Number of Shareholders</label>
                      {isEditMode ? (
                        <input type="number" value={overviewForm.businessInfo.numShareholders} onChange={(e) => setOverviewForm(prev => ({ ...prev, businessInfo: { ...prev.businessInfo, numShareholders: parseInt(e.target.value) || 0 } }))} />
                      ) : (
                        <div className="view-field-value">{companyInfo.businessInfo?.numShareholders} Shareholders</div>
                      )}
                    </div>
                  </div>

                  {isEditMode && (
                    <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start', marginTop: 16 }}>
                      Save Business Info
                    </button>
                  )}
                </div>
              </form>

              {/* Corporate Bank Accounts */}
              <div className="card" style={{ border: '1px solid var(--border-color)', boxShadow: 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <h3 style={{ color: 'var(--primary-color)' }}>Corporate Salary Bank Accounts</h3>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-outline btn-sm" onClick={handleExportBanks}>Export Accounts</button>
                    {isAuthorizedToEdit && (
                      <button className="btn btn-primary btn-sm" onClick={() => { setNewBank({ bankName: '', branchName: '', accountName: '', accountNumber: '', routingNumber: '', swiftCode: '', certificateUrl: '' }); setIsBankModalOpen(true); }}>
                        + Add Bank Account
                      </button>
                    )}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
                  {(companyInfo.bankAccounts || []).length === 0 ? (
                    <div style={{ textAlign: 'center', color: 'var(--text-secondary)', gridColumn: 'span 2' }}>No Bank Accounts configured.</div>
                  ) : (
                    companyInfo.bankAccounts.map(account => (
                      <div key={account.id} className="card" style={{
                        background: 'var(--bg-input)',
                        border: '1px solid var(--border-color)',
                        padding: 16,
                        boxShadow: 'none',
                        position: 'relative'
                      }}>
                        {isAuthorizedToEdit && (
                          <button
                            onClick={() => deleteCompanyBankAccount(account.id, currentUser.name)}
                            style={{
                              position: 'absolute',
                              top: 12,
                              right: 12,
                              background: 'transparent',
                              border: 'none',
                              color: 'var(--danger)',
                              cursor: 'pointer',
                              fontWeight: 700,
                              fontSize: '1.25rem'
                            }}
                            title="Delete Account"
                          >
                            &times;
                          </button>
                        )}
                        <h4 style={{ color: 'var(--primary-color)', fontSize: '0.95rem', marginBottom: 10 }}>{account.bankName}</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.8rem' }}>
                          <div><strong>Branch:</strong> {account.branchName}</div>
                          <div><strong>Account Name:</strong> {account.accountName}</div>
                          <div><strong>Account Number:</strong> {account.accountNumber}</div>
                          <div><strong>Routing Number:</strong> {account.routingNumber}</div>
                          <div><strong>SWIFT Code:</strong> {account.swiftCode}</div>
                          {account.certificateUrl && (
                            <div style={{ marginTop: 6 }}>
                              <a href={account.certificateUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--primary-color)', fontWeight: 600 }}>
                                View Solvency Certificate
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Bank Modal */}
              {isBankModalOpen && (
                <div className="modal-overlay">
                  <div className="modal-content" style={{ maxWidth: 550 }}>
                    <div className="modal-header">
                      <h3 className="modal-title">Configure Corporate Salary Bank</h3>
                      <button className="modal-close-btn" onClick={() => setIsBankModalOpen(false)}>&times;</button>
                    </div>
                    <form onSubmit={handleBankSubmit}>
                      <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div className="form-group">
                          <label>Bank Name *</label>
                          <input type="text" required placeholder="e.g. Dutch-Bangla Bank Ltd." value={newBank.bankName} onChange={(e) => setNewBank(prev => ({ ...prev, bankName: e.target.value }))} />
                        </div>

                        <div className="form-row">
                          <div className="form-group">
                            <label>Branch Name *</label>
                            <input type="text" required value={newBank.branchName} onChange={(e) => setNewBank(prev => ({ ...prev, branchName: e.target.value }))} />
                          </div>
                          <div className="form-group">
                            <label>Account Name *</label>
                            <input type="text" required value={newBank.accountName} onChange={(e) => setNewBank(prev => ({ ...prev, accountName: e.target.value }))} />
                          </div>
                        </div>

                        <div className="form-group">
                          <label>Account Number *</label>
                          <input type="text" required value={newBank.accountNumber} onChange={(e) => setNewBank(prev => ({ ...prev, accountNumber: e.target.value }))} />
                        </div>

                        <div className="form-row">
                          <div className="form-group">
                            <label>Routing Number *</label>
                            <input type="text" required value={newBank.routingNumber} onChange={(e) => setNewBank(prev => ({ ...prev, routingNumber: e.target.value }))} />
                          </div>
                          <div className="form-group">
                            <label>SWIFT Code</label>
                            <input type="text" value={newBank.swiftCode} onChange={(e) => setNewBank(prev => ({ ...prev, swiftCode: e.target.value }))} />
                          </div>
                        </div>

                        <div className="form-group">
                          <label>Upload Solvency Certificate</label>
                          <input type="file" accept=".pdf,.png,.jpg" onChange={handleBankCertificateUpload} />
                          {bankFileUploading && (
                            <span style={{ fontSize: '0.75rem', color: 'var(--primary-color)' }}>
                              Uploading to Storage... {bankFileProgress}%
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="modal-footer">
                        <button type="button" className="btn btn-outline" onClick={() => setIsBankModalOpen(false)}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={bankFileUploading}>Save Account</button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* TAB 4: COMPLIANCE & POLICIES */}
          {activeTab === 'compliance' && (
            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              
              {/* Working hours & holiday */}
              <div className="card" style={{ border: '1px solid var(--border-color)', boxShadow: 'none' }}>
                <h3 style={{ color: 'var(--primary-color)', marginBottom: 16 }}>Office Schedules & Holidays</h3>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Weekly Holiday *</label>
                    {isEditMode ? (
                      <select value={overviewForm.compliance.weeklyHoliday} onChange={(e) => setOverviewForm(prev => ({ ...prev, compliance: { ...prev.compliance, weeklyHoliday: e.target.value } }))}>
                        <option value="Friday">Friday (Standard BD)</option>
                        <option value="Friday & Saturday">Friday & Saturday</option>
                        <option value="Sunday">Sunday</option>
                      </select>
                    ) : (
                      <div className="view-field-value">{companyInfo.compliance?.weeklyHoliday}</div>
                    )}
                  </div>

                  <div className="form-group">
                    <label>Standard Office Timings *</label>
                    {isEditMode ? (
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        <input type="time" value={overviewForm.compliance.startTime} onChange={(e) => setOverviewForm(prev => ({ ...prev, compliance: { ...prev.compliance, startTime: e.target.value } }))} />
                        <span>to</span>
                        <input type="time" value={overviewForm.compliance.endTime} onChange={(e) => setOverviewForm(prev => ({ ...prev, compliance: { ...prev.compliance, endTime: e.target.value } }))} />
                      </div>
                    ) : (
                      <div className="view-field-value">{companyInfo.compliance?.startTime} - {companyInfo.compliance?.endTime}</div>
                    )}
                  </div>

                  <div className="form-group">
                    <label>Ramadan Office Timings</label>
                    {isEditMode ? (
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        <input type="time" value={overviewForm.compliance.ramadanStartTime} onChange={(e) => setOverviewForm(prev => ({ ...prev, compliance: { ...prev.compliance, ramadanStartTime: e.target.value } }))} />
                        <span>to</span>
                        <input type="time" value={overviewForm.compliance.ramadanEndTime} onChange={(e) => setOverviewForm(prev => ({ ...prev, compliance: { ...prev.compliance, ramadanEndTime: e.target.value } }))} />
                      </div>
                    ) : (
                      <div className="view-field-value">{companyInfo.compliance?.ramadanStartTime} - {companyInfo.compliance?.ramadanEndTime}</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Payroll settings */}
              <div className="card" style={{ border: '1px solid var(--border-color)', boxShadow: 'none' }}>
                <h3 style={{ color: 'var(--primary-color)', marginBottom: 16 }}>Payroll Policies</h3>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Salary Disbursement Day (Every Month) *</label>
                    {isEditMode ? (
                      <input type="number" min="1" max="15" value={overviewForm.payrollSettings.salaryPaymentDate} onChange={(e) => setOverviewForm(prev => ({ ...prev, payrollSettings: { ...prev.payrollSettings, salaryPaymentDate: parseInt(e.target.value) || 0 } }))} />
                    ) : (
                      <div className="view-field-value">Every {companyInfo.payrollSettings?.salaryPaymentDate}th day</div>
                    )}
                  </div>

                  <div className="form-group">
                    <label>Attendance/Payroll Closing Day *</label>
                    {isEditMode ? (
                      <input type="number" min="20" max="31" value={overviewForm.payrollSettings.payrollMonthClosingDate} onChange={(e) => setOverviewForm(prev => ({ ...prev, payrollSettings: { ...prev.payrollSettings, payrollMonthClosingDate: parseInt(e.target.value) || 0 } }))} />
                    ) : (
                      <div className="view-field-value">Every {companyInfo.payrollSettings?.payrollMonthClosingDate}th day</div>
                    )}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Overtime Hourly Rate Policy</label>
                    {isEditMode ? (
                      <input type="text" value={overviewForm.payrollSettings.overtimePolicy} onChange={(e) => setOverviewForm(prev => ({ ...prev, payrollSettings: { ...prev.payrollSettings, overtimePolicy: e.target.value } }))} />
                    ) : (
                      <div className="view-field-value">{companyInfo.payrollSettings?.overtimePolicy}</div>
                    )}
                  </div>

                  <div className="form-group">
                    <label>Appraisal & Increment Policy</label>
                    {isEditMode ? (
                      <input type="text" value={overviewForm.payrollSettings.incrementPolicy} onChange={(e) => setOverviewForm(prev => ({ ...prev, payrollSettings: { ...prev.payrollSettings, incrementPolicy: e.target.value } }))} />
                    ) : (
                      <div className="view-field-value">{companyInfo.payrollSettings?.incrementPolicy}</div>
                    )}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Eid & Festival Bonus Policy</label>
                    {isEditMode ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <input type="text" placeholder="Eid Bonus" value={overviewForm.payrollSettings.eidBonusPolicy} onChange={(e) => setOverviewForm(prev => ({ ...prev, payrollSettings: { ...prev.payrollSettings, eidBonusPolicy: e.target.value } }))} />
                        <input type="text" placeholder="Other Festival Bonus" value={overviewForm.payrollSettings.festivalBonusPolicy} onChange={(e) => setOverviewForm(prev => ({ ...prev, payrollSettings: { ...prev.payrollSettings, festivalBonusPolicy: e.target.value } }))} />
                      </div>
                    ) : (
                      <div className="view-field-value">
                        <div><strong>Muslims:</strong> {companyInfo.payrollSettings?.eidBonusPolicy}</div>
                        <div><strong>Other Faiths:</strong> {companyInfo.payrollSettings?.festivalBonusPolicy}</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {isEditMode && (
                <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>
                  Save Compliance Settings
                </button>
              )}
            </form>
          )}

          {/* TAB 5: DOCUMENT VAULT */}
          {activeTab === 'vault' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              
              {/* Filter search bar */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', gap: 12, flex: 1, minWidth: 260 }}>
                  <input
                    type="text"
                    placeholder="Search documents by name, type..."
                    value={docSearch}
                    onChange={(e) => setDocSearch(e.target.value)}
                  />
                  <select value={docFilter} onChange={(e) => setDocFilter(e.target.value)}>
                    <option value="All">All Documents</option>
                    <option value="Certificate of Incorporation">Certificate of Incorporation</option>
                    <option value="Memorandum of Association (MOA)">Memorandum of Association</option>
                    <option value="Articles of Association (AOA)">Articles of Association</option>
                    <option value="Trade License">Trade License</option>
                    <option value="BIN Certificate">BIN Certificate</option>
                    <option value="TIN Certificate">TIN Certificate</option>
                  </select>
                </div>

                {isAuthorizedToEdit && (
                  <form onSubmit={handleDocUploadSubmit} style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                    <select value={docType} onChange={(e) => setDocType(e.target.value)}>
                      <option value="Trade License">Trade License</option>
                      <option value="BIN Certificate">BIN Certificate</option>
                      <option value="TIN Certificate">TIN Certificate</option>
                      <option value="Certificate of Incorporation">Incorporation Copy</option>
                      <option value="Lease Agreement">Lease Agreement</option>
                      <option value="Office Rent Agreement">Office Rent Agreement</option>
                      <option value="Board Resolutions">Board Resolution</option>
                      <option value="Audit Reports">Audit Report</option>
                      <option value="Financial Statements">Financial Statement</option>
                    </select>
                    <input type="file" required onChange={(e) => setDocFile(e.target.files[0])} style={{ fontSize: '0.8rem', maxWidth: 200 }} />
                    <button type="submit" className="btn btn-primary btn-sm" disabled={docUploading}>
                      Upload Document
                    </button>
                  </form>
                )}
              </div>

              {/* Progress Bar for doc uploads */}
              {docUploading && (
                <div style={{ background: 'rgba(0,180,216,0.08)', border: '1px dashed var(--primary-color)', padding: 16, borderRadius: 'var(--border-radius-sm)', fontSize: '0.85rem' }}>
                  <span>Uploading corporate dossier file to Firebase Storage: <strong>{docProgress}%</strong></span>
                  <div style={{ height: 6, width: '100%', background: 'var(--border-color)', marginTop: 8, borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', background: 'var(--primary-color)', width: `${docProgress}%` }}></div>
                  </div>
                </div>
              )}

              {/* Documents grid repository */}
              <div className="doc-grid">
                {filteredDocs.length === 0 ? (
                  <div style={{ textAlign: 'center', color: 'var(--text-secondary)', width: '100%', padding: '40px 0', gridColumn: 'span 3' }}>
                    No corporate documents found matching search criteria.
                  </div>
                ) : (
                  filteredDocs.map(doc => (
                    <div key={doc.id} className="doc-card" style={{
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-color)',
                      padding: 16,
                      borderRadius: 'var(--border-radius-md)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
                      position: 'relative'
                    }}>
                      <div className="doc-icon-wrapper" style={{
                        width: 42,
                        height: 42,
                        borderRadius: 8,
                        background: 'rgba(0,180,216,0.1)',
                        color: 'var(--primary-color)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 6
                      }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 20, height: 20 }}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>
                      </div>
                      <div className="doc-name" style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-main)', wordBreak: 'break-all' }}>{doc.name}</div>
                      <div className="doc-meta" style={{ fontSize: '0.725rem', color: 'var(--text-secondary)' }}>Type: {doc.type}</div>
                      <div className="doc-meta" style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>Uploaded: {doc.uploadDate} • {doc.size}</div>
                      
                      <div style={{ marginTop: 'auto', paddingTop: 10 }}>
                        <a href={doc.fileData || '#'} download={doc.name} className="btn btn-outline btn-sm" style={{ display: 'block', textAlign: 'center' }}>
                          Download
                        </a>
                      </div>
                    </div>
                  ))
                )}
              </div>

            </div>
          )}

          {/* TAB 6: ORG ANALYTICS & STATS */}
          {activeTab === 'analytics' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
              
              {/* Employee demographics ratio */}
              <div className="grid-2">
                <div className="card" style={{ border: '1px solid var(--border-color)', boxShadow: 'none' }}>
                  <h3 style={{ color: 'var(--primary-color)', marginBottom: 16 }}>Employee Headcounts</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.85rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Total Seeded Directory:</span> <strong>{employees.length} Employees</strong></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Active Employees:</span> <strong style={{ color: 'var(--success)' }}>{activeEmployees.length} Active</strong></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Inactive (Terminated):</span> <strong style={{ color: 'var(--danger)' }}>{inactiveEmployees.length} Inactive</strong></div>
                    <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '4px 0' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Permanent Employees:</span> <strong>{permanentEmployees} Staff</strong></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Probation (New Starters):</span> <strong style={{ color: 'var(--warning)' }}>{probationEmployees} Staff</strong></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>New Hires This Month:</span> <strong>{newJoinersThisMonth} Joiners</strong></div>
                  </div>
                </div>

                <div className="card" style={{ border: '1px solid var(--border-color)', boxShadow: 'none' }}>
                  <h3 style={{ color: 'var(--primary-color)', marginBottom: 16 }}>Department & Structure</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.85rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Functional Departments:</span> <strong>{totalDepts} Departments</strong></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Unique Designations:</span> <strong>{totalDesignations} Designations</strong></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Sub-teams:</span> <strong>{totalDepts * 2} Operational Teams</strong></div>
                    <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '4px 0' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Male Employees:</span> <strong>{maleEmployees.length} ({Math.round(maleEmployees.length/employees.length*100)}%)</strong></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Female Employees:</span> <strong>{femaleEmployees.length} ({Math.round(femaleEmployees.length/employees.length*100)}%)</strong></div>
                  </div>
                </div>
              </div>

              {/* Assets and Recruitment */}
              <div className="grid-2">
                <div className="card" style={{ border: '1px solid var(--border-color)', boxShadow: 'none' }}>
                  <h3 style={{ color: 'var(--primary-color)', marginBottom: 16 }}>Company Inventory Assets Summary</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.85rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Total Assets Registry:</span> <strong>{companyInfo.assetsSummary.total} Items</strong></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Assigned to Employees:</span> <strong>{companyInfo.assetsSummary.assigned} Items</strong></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Available in Stock:</span> <strong style={{ color: 'var(--success)' }}>{companyInfo.assetsSummary.available} Items</strong></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Under IT Maintenance:</span> <strong style={{ color: 'var(--warning)' }}>{companyInfo.assetsSummary.maintenance} Items</strong></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Retired Assets:</span> <strong>{companyInfo.assetsSummary.retired} Items</strong></div>
                  </div>
                </div>

                <div className="card" style={{ border: '1px solid var(--border-color)', boxShadow: 'none' }}>
                  <h3 style={{ color: 'var(--primary-color)', marginBottom: 16 }}>Recruitment & ATS Tracker</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.85rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Open Positions:</span> <strong style={{ color: 'var(--primary-color)' }}>{companyInfo.recruitment.openPositions} Jobs</strong></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Total Received Applications:</span> <strong>{companyInfo.recruitment.totalApplicants} Applicants</strong></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Candidates Under Review:</span> <strong>{companyInfo.recruitment.underReview} Candidates</strong></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Scheduled Technical Interviews:</span> <strong>{companyInfo.recruitment.interviewsScheduled} Candidates</strong></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Hired Candidates (This Quarter):</span> <strong style={{ color: 'var(--success)' }}>{companyInfo.recruitment.hiredThisQuarter} Hires</strong></div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 7: SECURITY & AUDIT TRAIL */}
          {activeTab === 'security' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
              
              {/* Access Levels */}
              <div className="card" style={{ border: '1px solid var(--border-color)', boxShadow: 'none' }}>
                <h3 style={{ color: 'var(--primary-color)', marginBottom: 12 }}>Corporate Security Authorization Levels</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 16 }}>
                  Configure user groups with write and read permissions for administrative documents.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 6, borderBottom: '1px solid var(--border-color)' }}>
                    <span>Super Admin Access (Full Write / Delete)</span>
                    <span style={{ color: 'var(--success)', fontWeight: 700 }}>ENABLED</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 6, borderBottom: '1px solid var(--border-color)' }}>
                    <span>HR Manager Access (Full Write / Edit)</span>
                    <span style={{ color: 'var(--success)', fontWeight: 700 }}>ENABLED</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 6, borderBottom: '1px solid var(--border-color)' }}>
                    <span>Director Access (Read-Only fact sheet access)</span>
                    <span style={{ color: 'var(--success)', fontWeight: 700 }}>ENABLED</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 6 }}>
                    <span>Regular Employee ESS Access (Profile details viewing only)</span>
                    <span style={{ color: 'var(--danger)', fontWeight: 700 }}>RESTRICTED</span>
                  </div>
                </div>
              </div>

              {/* Audit logs */}
              <div className="card" style={{ border: '1px solid var(--border-color)', boxShadow: 'none' }}>
                <h3 style={{ color: 'var(--primary-color)', marginBottom: 16 }}>System Activity Audit Trail</h3>
                
                <div className="table-container" style={{ padding: 0 }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Timestamp</th>
                        <th>User Account</th>
                        <th>Action Category</th>
                        <th>Revision Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {companyAuditLogs.map(log => (
                        <tr key={log.id}>
                          <td style={{ fontSize: '0.725rem', whiteSpace: 'nowrap' }}>{new Date(log.timestamp).toLocaleString()}</td>
                          <td style={{ fontWeight: 600 }}>{log.modifiedBy}</td>
                          <td>
                            <span className="badge badge-outline" style={{ border: '1px solid var(--primary-color)', color: 'var(--primary-color)' }}>
                              {log.action}
                            </span>
                          </td>
                          <td style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{log.details}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

        </div>
      </div>

    </div>
  );
}
