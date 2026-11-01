import React, { useContext, useState } from 'react';
import { HRMSContext } from '../context/HRMSContext';
import {
  DIVISIONS,
  getDistrictsForDivision,
  getUpazilasForDistrict,
  getPostCodesForUpazila,
  parseAddressString
} from '../utils/bangladeshGeo';

const DEPARTMENTS = [
  'Engineering Education Equipment',
  'Industrial Solutions',
  'Research Laboratory Equipment',
  'Surveying Instruments & Technology Solutions',
  'Finance & Accounts',
  'Human Resources',
  'Administration'
];

export default function EmployeeManagement() {
  const { employees, addEmployee, updateEmployee, deleteEmployee, hrSettings } = useContext(HRMSContext);
  const departmentList = hrSettings?.departments?.length ? hrSettings.departments : DEPARTMENTS;

  // States
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [detailTab, setDetailTab] = useState('profile');

  // Form State for Add/Edit
  const initialFormState = {
    id: '',
    fullNameEnglish: '',
    fullNameBangla: '',
    designation: '',
    department: DEPARTMENTS[0],
    dob: '',
    gender: 'male',
    bloodGroup: 'O+',
    maritalStatus: 'Single',
    nationality: 'Bangladeshi',
    mobileNumber: '',
    emailAddress: '',
    presentAddress: '',
    presentDivision: 'Dhaka',
    presentDistrict: 'Dhaka',
    presentUpazila: 'Banani',
    presentPostCode: '1213',
    presentStreet: '',
    permanentAddress: '',
    permanentDivision: 'Dhaka',
    permanentDistrict: 'Dhaka',
    permanentUpazila: 'Banani',
    permanentPostCode: '1213',
    permanentStreet: '',
    nid: '',
    passportNumber: '',
    bankName: 'City Bank Ltd.',
    bankAccountNo: '',
    taxZone: 'Zone 15',
    taxCircle: 'Circle 1',
    tin: '',
    joiningDate: '',
    grossSalary: 30000,
    intercom: '',
    educationalQualification: '',
    photograph: '',
    signature: '',
    fatherName: '',
    motherName: '',
    nominee: '',
    personalMobileNumber: '',
    personalEmailAddress: '',
    emergencyContact: { name: '', relation: 'Spouse', contact: '' },
    education: [{ degree: '', institute: '', passingYear: '', result: '' }],
    certifications: [{ name: '', issuingBody: '', year: '' }],
    previousHistory: [{ company: '', designation: '', duration: '', salary: '' }],
    documents: []
  };

  const [formState, setFormState] = useState(initialFormState);
  const [isEditing, setIsEditing] = useState(false);

  const handlePresentDivisionChange = (div) => {
    const districts = getDistrictsForDivision(div);
    const district = districts[0];
    const upazilas = getUpazilasForDistrict(district);
    const upazila = upazilas[0];
    const postCodes = getPostCodesForUpazila(upazila);
    const postCode = postCodes[0];
    setFormState(prev => ({
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
    setFormState(prev => ({
      ...prev,
      presentDistrict: dist,
      presentUpazila: upazila,
      presentPostCode: postCode
    }));
  };

  const handlePresentUpazilaChange = (up) => {
    const postCodes = getPostCodesForUpazila(up);
    const postCode = postCodes[0];
    setFormState(prev => ({
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
    setFormState(prev => ({
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
    setFormState(prev => ({
      ...prev,
      permanentDistrict: dist,
      permanentUpazila: upazila,
      permanentPostCode: postCode
    }));
  };

  const handlePermanentUpazilaChange = (up) => {
    const postCodes = getPostCodesForUpazila(up);
    const postCode = postCodes[0];
    setFormState(prev => ({
      ...prev,
      permanentUpazila: up,
      permanentPostCode: postCode
    }));
  };

  const itemsPerPage = 8;

  // Filter and search
  const filteredEmployees = employees.filter(emp => {
    const matchesSearch =
      emp.fullNameEnglish.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.fullNameBangla.includes(searchTerm) ||
      emp.employeeCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.designation.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDept = deptFilter ? emp.department === deptFilter : true;
    const matchesStatus = statusFilter ? emp.status === statusFilter : true;

    return matchesSearch && matchesDept && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);
  const paginatedEmployees = filteredEmployees.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // File Upload Handlers (Base64 mock)
  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormState(prev => ({ ...prev, photograph: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSignatureUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormState(prev => ({ ...prev, signature: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDocumentUpload = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newDoc = {
          name: file.name,
          type,
          size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
          uploadDate: new Date().toISOString().split('T')[0],
          fileData: reader.result // Base64 data URL
        };
        setFormState(prev => ({
          ...prev,
          documents: [...prev.documents, newDoc]
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Submit Handler
  const handleSubmit = (e) => {
    e.preventDefault();

    const finalPresentAddress = `${formState.presentStreet}, ${formState.presentUpazila}, ${formState.presentDistrict}, ${formState.presentDivision} - ${formState.presentPostCode}`;
    const finalPermanentAddress = `${formState.permanentStreet}, ${formState.permanentUpazila}, ${formState.permanentDistrict}, ${formState.permanentDivision} - ${formState.permanentPostCode}`;

    const updatedData = {
      ...formState,
      presentAddress: finalPresentAddress,
      permanentAddress: finalPermanentAddress
    };

    if (isEditing) {
      updateEmployee(updatedData);
    } else {
      addEmployee(updatedData);
    }
    setIsFormModalOpen(false);
    setFormState(initialFormState);
  };

  // Open Form for Adding
  const handleAddClick = () => {
    setIsEditing(false);
    setFormState({
      ...initialFormState,
      presentDivision: 'Dhaka',
      presentDistrict: 'Dhaka',
      presentUpazila: 'Banani',
      presentPostCode: '1213',
      presentStreet: '',
      permanentDivision: 'Dhaka',
      permanentDistrict: 'Dhaka',
      permanentUpazila: 'Banani',
      permanentPostCode: '1213',
      permanentStreet: ''
    });
    setIsFormModalOpen(true);
  };

  // Open Form for Editing
  const handleEditClick = (emp) => {
    setIsEditing(true);
    const parsedPresent = parseAddressString(emp.presentAddress);
    const parsedPermanent = parseAddressString(emp.permanentAddress);
    setFormState({
      ...emp,
      presentDivision: parsedPresent.division,
      presentDistrict: parsedPresent.district,
      presentUpazila: parsedPresent.upazila,
      presentPostCode: parsedPresent.postCode,
      presentStreet: parsedPresent.street,
      permanentDivision: parsedPermanent.division,
      permanentDistrict: parsedPermanent.district,
      permanentUpazila: parsedPermanent.upazila,
      permanentPostCode: parsedPermanent.postCode,
      permanentStreet: parsedPermanent.street
    });
    setIsFormModalOpen(true);
  };

  // View Details
  const handleViewDetails = (emp) => {
    setSelectedEmployee(emp);
    setDetailTab('profile');
    setIsDetailModalOpen(true);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Top Filter and Search Action bar */}
      <div className="card" style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, flex: 1 }}>
          <input
            type="text"
            placeholder="Search by code, name, designation..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            style={{ minWidth: 260 }}
          />
          <select
            value={deptFilter}
            onChange={(e) => { setDeptFilter(e.target.value); setCurrentPage(1); }}
          >
            <option value="">All Departments</option>
            {departmentList.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
          >
            <option value="">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
        <button className="btn btn-primary" onClick={handleAddClick}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 16, height: 16 }}><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          <span>Add Employee</span>
        </button>
      </div>

      {/* Main Table */}
      <div className="card table-container" style={{ padding: 0 }}>
        <table>
          <thead>
            <tr>
              <th>Employee ID</th>
              <th>Photo</th>
              <th>Name (English / Bangla)</th>
              <th>Department</th>
              <th>Designation</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedEmployees.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-secondary)' }}>
                  No employees found matching filter criteria.
                </td>
              </tr>
            ) : (
              paginatedEmployees.map(emp => (
                <tr key={emp.id} style={{ opacity: emp.status === 'Inactive' ? 0.6 : 1 }}>
                  <td style={{ fontWeight: 700, color: 'var(--primary-color)' }}>{emp.employeeCode}</td>
                  <td>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--border-color)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {emp.photograph ? (
                        <img src={emp.photograph} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>{emp.fullNameEnglish.split(' ').map(n => n[0]).join('').slice(0, 2)}</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{emp.fullNameEnglish}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontFamily: 'SutonnyMJ, Arial' }}>{emp.fullNameBangla}</div>
                  </td>
                  <td>{emp.department}</td>
                  <td>{emp.designation}</td>
                  <td>
                    <span className={`badge ${emp.status === 'Active' ? 'badge-success' : 'badge-danger'}`}>
                      {emp.status}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: 8 }}>
                      <button className="btn btn-outline btn-sm" onClick={() => handleViewDetails(emp)}>View</button>
                      <button className="btn btn-secondary btn-sm" onClick={() => handleEditClick(emp)}>Edit</button>
                      {emp.status === 'Active' && (
                        <button className="btn btn-danger btn-sm" onClick={() => deleteEmployee(emp.id)}>Terminate</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Showing Page {currentPage} of {totalPages} ({filteredEmployees.length} Total)
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className="btn btn-outline btn-sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            >
              Previous
            </button>
            <button
              className="btn btn-outline btn-sm"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {isDetailModalOpen && selectedEmployee && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 900 }}>
            <div className="modal-header">
              <h3 className="modal-title">Employee Details - {selectedEmployee.employeeCode}</h3>
              <button className="modal-close-btn" onClick={() => setIsDetailModalOpen(false)}>&times;</button>
            </div>
            <div className="modal-body">
              {/* Tab Header */}
              <div className="tabs-header">
                <button className={`tab-btn ${detailTab === 'profile' ? 'active' : ''}`} onClick={() => setDetailTab('profile')}>Profile Details</button>
                <button className={`tab-btn ${detailTab === 'documents' ? 'active' : ''}`} onClick={() => setDetailTab('documents')}>Documents Vault</button>
                <button className={`tab-btn ${detailTab === 'finance' ? 'active' : ''}`} onClick={() => setDetailTab('finance')}>Compensation & Tax</button>
              </div>

              {/* Tab Contents */}
              {detailTab === 'profile' && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 32 }}>
                  {/* Photo & Signature */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: 180, alignItems: 'center' }}>
                    <div style={{ width: 140, height: 140, borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--border-color)', background: 'var(--border-color)', overflow: 'hidden' }}>
                      {selectedEmployee.photograph ? (
                        <img src={selectedEmployee.photograph} alt="profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>No Photo</div>
                      )}
                    </div>

                    <div style={{ width: 140, height: 60, border: '1px dashed var(--border-color)', borderRadius: 'var(--border-radius-sm)', padding: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginBottom: 2 }}>Signature</span>
                      {selectedEmployee.signature ? (
                        <img src={selectedEmployee.signature} alt="sig" style={{ maxWidth: '100%', maxHeight: '80%', objectFit: 'contain' }} />
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Not Signed</span>
                      )}
                    </div>
                  </div>

                  {/* Profile data grids */}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <div>
                      <h4 style={{ color: 'var(--primary-color)', fontSize: '0.9rem', borderBottom: '1px solid var(--border-color)', paddingBottom: 4, marginBottom: 8 }}>Official Information</h4>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: '0.85rem' }}>
                        <div><strong>English Name:</strong> {selectedEmployee.fullNameEnglish}</div>
                        <div><strong>Bangla Name:</strong> {selectedEmployee.fullNameBangla}</div>
                        <div><strong>Department:</strong> {selectedEmployee.department}</div>
                        <div><strong>Designation:</strong> {selectedEmployee.designation}</div>
                        <div><strong>Joining Date:</strong> {selectedEmployee.joiningDate}</div>
                        <div><strong>Status:</strong> {selectedEmployee.status}</div>
                        <div><strong>Intercom Extension:</strong> {selectedEmployee.intercom || 'N/A'}</div>
                        <div><strong>Educational Qualification:</strong> {selectedEmployee.educationalQualification || 'N/A'}</div>
                      </div>
                    </div>

                    <div>
                      <h4 style={{ color: 'var(--primary-color)', fontSize: '0.9rem', borderBottom: '1px solid var(--border-color)', paddingBottom: 4, marginBottom: 8 }}>Personal Particulars</h4>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: '0.85rem' }}>
                        <div><strong>Date of Birth:</strong> {selectedEmployee.dob}</div>
                        <div><strong>Gender:</strong> {selectedEmployee.gender.toUpperCase()}</div>
                        <div><strong>Blood Group:</strong> {selectedEmployee.bloodGroup}</div>
                        <div><strong>Marital Status:</strong> {selectedEmployee.maritalStatus}</div>
                        <div><strong>Nationality:</strong> {selectedEmployee.nationality}</div>
                        <div><strong>NID:</strong> {selectedEmployee.nid}</div>
                        <div><strong>Passport:</strong> {selectedEmployee.passportNumber || 'N/A'}</div>
                        <div><strong>Father's Name:</strong> {selectedEmployee.fatherName || 'N/A'}</div>
                        <div><strong>Mother's Name:</strong> {selectedEmployee.motherName || 'N/A'}</div>
                        <div><strong>Nominee:</strong> {selectedEmployee.nominee || 'N/A'}</div>
                        <div style={{ gridColumn: 'span 2' }}>
                          <strong>Emergency Contact:</strong> {selectedEmployee.emergencyContact?.name || 'N/A'}
                          {selectedEmployee.emergencyContact?.relation ? ` (${selectedEmployee.emergencyContact.relation})` : ''}
                          {selectedEmployee.emergencyContact?.contact ? ` - ${selectedEmployee.emergencyContact.contact}` : ''}
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 style={{ color: 'var(--primary-color)', fontSize: '0.9rem', borderBottom: '1px solid var(--border-color)', paddingBottom: 4, marginBottom: 8 }}>Contact Particulars</h4>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: '0.85rem' }}>
                        <div><strong>Official Mobile:</strong> {selectedEmployee.mobileNumber}</div>
                        <div><strong>Personal Mobile:</strong> {selectedEmployee.personalMobileNumber || 'N/A'}</div>
                        <div><strong>Official E-Mail:</strong> {selectedEmployee.emailAddress}</div>
                        <div><strong>Personal E-Mail:</strong> {selectedEmployee.personalEmailAddress || 'N/A'}</div>
                        <div style={{ gridColumn: 'span 2' }}><strong>Present Address:</strong> {selectedEmployee.presentAddress}</div>
                        <div style={{ gridColumn: 'span 2' }}><strong>Permanent Address:</strong> {selectedEmployee.permanentAddress}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {detailTab === 'documents' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div className="doc-grid">
                    {selectedEmployee.documents.map((doc, idx) => (
                      <div key={idx} className="doc-card">
                        <div className="doc-name">{doc.name}</div>
                        <div className="doc-meta">{doc.type} • {doc.size}</div>
                        <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
                          <a href={doc.fileData || '#'} download={doc.name} className="btn btn-outline btn-sm" style={{ flex: 1, textAlign: 'center' }}>
                            Download
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {detailTab === 'finance' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                    <div className="card" style={{ boxShadow: 'none', border: '1px solid var(--border-color)' }}>
                      <h4 style={{ color: 'var(--primary-color)', marginBottom: 12 }}>Salary Breakdowns</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.85rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Basic Salary:</span> <strong>৳{selectedEmployee.salaryComponents.basicSalary.toLocaleString()}</strong></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>House Rent Allowance:</span> <strong>৳{selectedEmployee.salaryComponents.houseRent.toLocaleString()}</strong></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Medical Allowance:</span> <strong>৳{selectedEmployee.salaryComponents.medicalAllowance.toLocaleString()}</strong></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Conveyance Allowance:</span> <strong>৳{selectedEmployee.salaryComponents.conveyanceAllowance.toLocaleString()}</strong></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Mobile Allowance:</span> <strong>৳{selectedEmployee.salaryComponents.mobileAllowance.toLocaleString()}</strong></div>
                        <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '8px 0' }} />
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', color: 'var(--primary-color)' }}><span>Gross Salary:</span> <strong>৳{selectedEmployee.grossSalary.toLocaleString()}</strong></div>
                      </div>
                    </div>

                    <div className="card" style={{ boxShadow: 'none', border: '1px solid var(--border-color)' }}>
                      <h4 style={{ color: 'var(--primary-color)', marginBottom: 12 }}>Banking & Tax Profile</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.85rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Salary Bank Name:</span> <strong>{selectedEmployee.bankName || 'N/A'}</strong></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Bank Account No:</span> <strong>{selectedEmployee.bankAccountNo || 'N/A'}</strong></div>
                        <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '4px 0' }} />
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>TIN Number:</span> <strong>{selectedEmployee.tin || 'N/A'}</strong></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Tax Zone:</span> <strong>{selectedEmployee.taxZone || 'N/A'}</strong></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Tax Circle:</span> <strong>{selectedEmployee.taxCircle || 'N/A'}</strong></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setIsDetailModalOpen(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {isFormModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 850 }}>
            <div className="modal-header">
              <h3 className="modal-title">{isEditing ? 'Edit Employee Profile' : 'Register New Employee'}</h3>
              <button className="modal-close-btn" onClick={() => setIsFormModalOpen(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* Basic Details */}
                <h4 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: 4, color: 'var(--primary-color)' }}>1. Basic & Identity Particulars</h4>
                <div className="form-row">
                  <div className="form-group">
                    <label>Full Name (English) *</label>
                    <input
                      type="text"
                      required
                      value={formState.fullNameEnglish}
                      onChange={(e) => setFormState(prev => ({ ...prev, fullNameEnglish: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label>Full Name (Bangla)</label>
                    <input
                      type="text"
                      value={formState.fullNameBangla}
                      onChange={(e) => setFormState(prev => ({ ...prev, fullNameBangla: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Designation *</label>
                    <input
                      type="text"
                      required
                      value={formState.designation}
                      onChange={(e) => setFormState(prev => ({ ...prev, designation: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label>Department *</label>
                    <select
                      value={formState.department}
                      onChange={(e) => setFormState(prev => ({ ...prev, department: e.target.value }))}
                    >
                      {departmentList.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Intercom Extension</label>
                    <input
                      type="text"
                      value={formState.intercom || ''}
                      onChange={(e) => setFormState(prev => ({ ...prev, intercom: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label>Educational Qualification</label>
                    <input
                      type="text"
                      value={formState.educationalQualification || ''}
                      onChange={(e) => setFormState(prev => ({ ...prev, educationalQualification: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>National ID (NID) *</label>
                    <input
                      type="text"
                      required
                      value={formState.nid}
                      onChange={(e) => setFormState(prev => ({ ...prev, nid: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label>Passport Number</label>
                    <input
                      type="text"
                      value={formState.passportNumber}
                      onChange={(e) => setFormState(prev => ({ ...prev, passportNumber: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Upload Photograph</label>
                    <input type="file" accept="image/*" onChange={handlePhotoUpload} />
                  </div>
                  <div className="form-group">
                    <label>Upload Signature</label>
                    <input type="file" accept="image/*" onChange={handleSignatureUpload} />
                  </div>
                </div>

                {/* Personal Details */}
                <h4 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: 4, color: 'var(--primary-color)' }}>2. Personal Particulars</h4>
                <div className="form-row">
                  <div className="form-group">
                    <label>Date of Birth *</label>
                    <input
                      type="date"
                      required
                      value={formState.dob}
                      onChange={(e) => setFormState(prev => ({ ...prev, dob: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label>Gender *</label>
                    <select
                      value={formState.gender}
                      onChange={(e) => setFormState(prev => ({ ...prev, gender: e.target.value }))}
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="third_gender">Third Gender</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Blood Group *</label>
                    <select
                      value={formState.bloodGroup}
                      onChange={(e) => setFormState(prev => ({ ...prev, bloodGroup: e.target.value }))}
                    >
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Father's Name</label>
                    <input
                      type="text"
                      value={formState.fatherName || ''}
                      onChange={(e) => setFormState(prev => ({ ...prev, fatherName: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label>Mother's Name</label>
                    <input
                      type="text"
                      value={formState.motherName || ''}
                      onChange={(e) => setFormState(prev => ({ ...prev, motherName: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Nominee</label>
                    <input
                      type="text"
                      value={formState.nominee || ''}
                      onChange={(e) => setFormState(prev => ({ ...prev, nominee: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label>Emergency Contact Name</label>
                    <input
                      type="text"
                      value={formState.emergencyContact?.name || ''}
                      onChange={(e) => setFormState(prev => ({
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
                      value={formState.emergencyContact?.relation || 'Spouse'}
                      onChange={(e) => setFormState(prev => ({
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
                      value={formState.emergencyContact?.contact || ''}
                      onChange={(e) => setFormState(prev => ({
                        ...prev,
                        emergencyContact: { ...prev.emergencyContact, contact: e.target.value }
                      }))}
                    />
                  </div>
                </div>

                {/* Contacts & Addresses */}
                <h4 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: 4, color: 'var(--primary-color)' }}>3. Contact & Banking Details</h4>
                <div className="form-row">
                  <div className="form-group">
                    <label>Official Mobile Number *</label>
                    <input
                      type="tel"
                      required
                      placeholder="+8801xxxxxxxxx"
                      value={formState.mobileNumber}
                      onChange={(e) => setFormState(prev => ({ ...prev, mobileNumber: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label>Official Email Address *</label>
                    <input
                      type="email"
                      required
                      value={formState.emailAddress}
                      onChange={(e) => setFormState(prev => ({ ...prev, emailAddress: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Personal Mobile Number</label>
                    <input
                      type="tel"
                      placeholder="+8801xxxxxxxxx"
                      value={formState.personalMobileNumber || ''}
                      onChange={(e) => setFormState(prev => ({ ...prev, personalMobileNumber: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label>Personal Email Address</label>
                    <input
                      type="email"
                      value={formState.personalEmailAddress || ''}
                      onChange={(e) => setFormState(prev => ({ ...prev, personalEmailAddress: e.target.value }))}
                    />
                  </div>
                  {/* Present Address */}
                  <h5 style={{ color: 'var(--primary-color)', fontSize: '0.85rem', marginBottom: 4 }}>Present Address</h5>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Division *</label>
                      <select
                        value={formState.presentDivision || 'Dhaka'}
                        onChange={(e) => handlePresentDivisionChange(e.target.value)}
                      >
                        {DIVISIONS.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>District *</label>
                      <select
                        value={formState.presentDistrict || 'Dhaka'}
                        onChange={(e) => handlePresentDistrictChange(e.target.value)}
                      >
                        {getDistrictsForDivision(formState.presentDivision || 'Dhaka').map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Upazila *</label>
                      <select
                        value={formState.presentUpazila || 'Banani'}
                        onChange={(e) => handlePresentUpazilaChange(e.target.value)}
                      >
                        {getUpazilasForDistrict(formState.presentDistrict || 'Dhaka').map(u => <option key={u} value={u}>{u}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Postal Code *</label>
                      <select
                        value={formState.presentPostCode || '1213'}
                        onChange={(e) => setFormState(prev => ({ ...prev, presentPostCode: e.target.value }))}
                      >
                        {getPostCodesForUpazila(formState.presentUpazila || 'Banani').map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Present Street / House Address *</label>
                    <input
                      type="text"
                      required
                      placeholder="House No., Road No., Area Details"
                      value={formState.presentStreet || ''}
                      onChange={(e) => setFormState(prev => ({ ...prev, presentStreet: e.target.value }))}
                    />
                  </div>

                  {/* Permanent Address */}
                  <h5 style={{ color: 'var(--primary-color)', fontSize: '0.85rem', marginBottom: 4, marginTop: 12 }}>Permanent Address</h5>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Division *</label>
                      <select
                        value={formState.permanentDivision || 'Dhaka'}
                        onChange={(e) => handlePermanentDivisionChange(e.target.value)}
                      >
                        {DIVISIONS.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>District *</label>
                      <select
                        value={formState.permanentDistrict || 'Dhaka'}
                        onChange={(e) => handlePermanentDistrictChange(e.target.value)}
                      >
                        {getDistrictsForDivision(formState.permanentDivision || 'Dhaka').map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Upazila *</label>
                      <select
                        value={formState.permanentUpazila || 'Banani'}
                        onChange={(e) => handlePermanentUpazilaChange(e.target.value)}
                      >
                        {getUpazilasForDistrict(formState.permanentDistrict || 'Dhaka').map(u => <option key={u} value={u}>{u}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Postal Code *</label>
                      <select
                        value={formState.permanentPostCode || '1213'}
                        onChange={(e) => setFormState(prev => ({ ...prev, permanentPostCode: e.target.value }))}
                      >
                        {getPostCodesForUpazila(formState.permanentUpazila || 'Banani').map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Permanent Street / House Address *</label>
                    <input
                      type="text"
                      required
                      placeholder="House No., Road No., Area Details"
                      value={formState.permanentStreet || ''}
                      onChange={(e) => setFormState(prev => ({ ...prev, permanentStreet: e.target.value }))}
                    />
                  </div>        </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Salary Bank Name</label>
                    <input
                      type="text"
                      value={formState.bankName}
                      onChange={(e) => setFormState(prev => ({ ...prev, bankName: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label>Bank Account Number</label>
                    <input
                      type="text"
                      value={formState.bankAccountNo}
                      onChange={(e) => setFormState(prev => ({ ...prev, bankAccountNo: e.target.value }))}
                    />
                  </div>
                </div>

                {/* Compensation & Joining */}
                <h4 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: 4, color: 'var(--primary-color)' }}>4. Job Particulars & Salary</h4>
                <div className="form-row">
                  <div className="form-group">
                    <label>Joining Date *</label>
                    <input
                      type="date"
                      required
                      value={formState.joiningDate}
                      onChange={(e) => setFormState(prev => ({ ...prev, joiningDate: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label>Gross Salary (BDT/Month) *</label>
                    <input
                      type="number"
                      required
                      min="10000"
                      value={formState.grossSalary}
                      onChange={(e) => setFormState(prev => ({ ...prev, grossSalary: parseInt(e.target.value) || 0 }))}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Tax Circle</label>
                    <input
                      type="text"
                      value={formState.taxCircle}
                      onChange={(e) => setFormState(prev => ({ ...prev, taxCircle: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label>Tax Zone</label>
                    <input
                      type="text"
                      value={formState.taxZone}
                      onChange={(e) => setFormState(prev => ({ ...prev, taxZone: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label>TIN Number</label>
                    <input
                      type="text"
                      value={formState.tin}
                      onChange={(e) => setFormState(prev => ({ ...prev, tin: e.target.value }))}
                    />
                  </div>
                </div>

                {/* Documents upload */}
                <h4 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: 4, color: 'var(--primary-color)' }}>5. Documents Upload Vault</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
                  <div className="form-group" style={{ border: '1px dashed var(--border-color)', padding: 10, borderRadius: 6 }}>
                    <label style={{ marginBottom: 4 }}>CV / Resume</label>
                    <input type="file" accept=".pdf,.doc,.docx" onChange={(e) => handleDocumentUpload(e, 'CV/Resume')} />
                  </div>
                  <div className="form-group" style={{ border: '1px dashed var(--border-color)', padding: 10, borderRadius: 6 }}>
                    <label style={{ marginBottom: 4 }}>NID Copy</label>
                    <input type="file" accept=".pdf,.jpg,.png" onChange={(e) => handleDocumentUpload(e, 'NID Copy')} />
                  </div>
                  <div className="form-group" style={{ border: '1px dashed var(--border-color)', padding: 10, borderRadius: 6 }}>
                    <label style={{ marginBottom: 4 }}>Passport Copy</label>
                    <input type="file" accept=".pdf,.jpg,.png" onChange={(e) => handleDocumentUpload(e, 'Passport Copy')} />
                  </div>
                  <div className="form-group" style={{ border: '1px dashed var(--border-color)', padding: 10, borderRadius: 6 }}>
                    <label style={{ marginBottom: 4 }}>Joining / Contract</label>
                    <input type="file" accept=".pdf,.doc,.docx" onChange={(e) => handleDocumentUpload(e, 'Joining Letter')} />
                  </div>
                </div>

                {formState.documents.length > 0 && (
                  <div style={{ marginTop: 8 }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Queued uploads:</span>
                    <ul style={{ fontSize: '0.75rem', listStyle: 'none', paddingLeft: 0, marginTop: 4 }}>
                      {formState.documents.map((doc, idx) => (
                        <li key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid var(--border-color)' }}>
                          <span>{doc.name} ({doc.type})</span>
                          <span style={{ color: 'var(--text-secondary)' }}>{doc.size}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setIsFormModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Profile</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
