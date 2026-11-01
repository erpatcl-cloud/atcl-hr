// Seed data for Company Information Module (ATCL)

export const SEED_COMPANY_INFO = {
  nameEnglish: "Advance Technology Consortium Ltd.",
  nameBangla: "অ্যাডভান্সড টেকনোলজি কনসোর্টিয়াম লিমিটেড",
  shortName: "ATCL",
  slogan: "Empowering Industries with Advanced Technology Solutions",
  description: "Advance Technology Consortium Ltd. (ATCL) is a premier technology trading and service provider engineering firm based in Dhaka, Bangladesh, specialized in Scientific Laboratory Equipment, Surveying Instruments, Industrial Solutions, and Academic Trainer Kits.",
  vision: "To be the leading technology integrator in Bangladesh, known for outstanding product quality, engineering excellence, and customer-first support.",
  mission: "To equip Bangladeshi industries, research institutions, and academic centers with state-of-the-art engineering tools, accelerating technological progress and operational excellence.",
  coreValues: "Customer Centricity, Engineering Integrity, Innovation, Team Collaboration, Accountability",
  logoUrl: "",
  coverUrl: "",
  sealUrl: "",
  
  // Registration & Legal Information
  legalInfo: {
    businessType: "Private Limited Company",
    incorporationDate: "2011-04-12",
    registrationNumber: "C-91823/2011",
    certificateIncorporationUrl: "",
    tradeLicenseNumber: "TR/DNCC/004321/2025",
    tradeLicenseExpiryDate: "2027-06-30",
    tradeLicenseCopyUrl: "",
    binNumber: "001245678-0101",
    binCertificateUrl: "",
    tinNumber: "784321098456",
    tinCertificateUrl: "",
    rjscRegistrationNumber: "RJSC-91823-11",
    rjscDocumentsUrl: ""
  },

  // Contact Information
  contactInfo: {
    corporateEmail: "info@atcl-bd.com",
    supportEmail: "support@atcl-bd.com",
    hrEmail: "hr@atcl-bd.com",
    accountsEmail: "accounts@atcl-bd.com",
    websiteUrl: "https://www.atcl-bd.com",
    facebookUrl: "https://facebook.com/atclbd",
    linkedinUrl: "https://linkedin.com/company/atclbd",
    youtubeUrl: "https://youtube.com/c/atclbd",
    whatsappNumber: "+8801819556750",
    hotlineNumber: "16263",
    faxNumber: "+88029876543"
  },

  // Office Location
  headOffice: {
    name: "ATCL Head Office",
    addressLine1: "House 12, Road 5, Banani",
    addressLine2: "Suite 4B, Level 4",
    area: "Banani",
    city: "Dhaka",
    district: "Dhaka",
    division: "Dhaka",
    postalCode: "1213",
    country: "Bangladesh",
    mapLocation: "https://maps.google.com/?q=23.7937,90.4066",
    latitude: 23.7937,
    longitude: 90.4066
  },

  // Branches
  branches: [
    {
      id: "br-1",
      name: "Chattogram Branch Office",
      code: "CTG-01",
      manager: "ASM Shamim",
      address: "Agrabad Commercial Area, Chittogram 4100",
      latitude: 22.3244,
      longitude: 91.8123,
      geofenceRadius: 150,
      contactNumber: "+8801811443524",
      email: "ctg.branch@atcl-bd.com",
      status: "Active"
    },
    {
      id: "br-2",
      name: "Khulna Support Center",
      code: "KHN-01",
      manager: "Engr. ASM Sydul Islam",
      address: "KDA Avenue, Khulna 9100",
      latitude: 22.8200,
      longitude: 89.5500,
      geofenceRadius: 100,
      contactNumber: "+8801847182128",
      email: "khulna.support@atcl-bd.com",
      status: "Active"
    }
  ],

  // Business Information
  businessInfo: {
    industryType: "Engineering & Technology Trading",
    businessNature: "Importer, Supplier, Installer, Service Provider",
    products: "Scientific Lab Equipment, Survey Instruments, Industrial Automation Kits, CNC Trainers",
    services: "System Integration, Warranty Repair, Calibration, GIS Mapping, Educational Training",
    authorizedCapital: 50000000,
    paidUpCapital: 25000000,
    numDirectors: 5,
    numShareholders: 12,
    numDepartments: 7
  },

  // Compliance
  compliance: {
    weeklyHoliday: "Friday",
    workingDays: ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"],
    startTime: "09:00",
    endTime: "17:00",
    ramadanStartTime: "09:00",
    ramadanEndTime: "15:30",
    leavePolicyUrl: "",
    hrPolicyUrl: "",
    employeeHandbookUrl: "",
    codeOfConductUrl: ""
  },

  // Payroll settings
  payrollSettings: {
    salaryPaymentDate: 5,
    payrollMonthClosingDate: 28,
    overtimePolicy: "Double Hourly Rate (Basic / 200 * 2)",
    bonusPolicy: "Calculated based on Basic Salary (50% of Gross)",
    eidBonusPolicy: "100% of Basic Salary (paid for Eid-ul-Fitr and Eid-ul-Adha)",
    festivalBonusPolicy: "100% of Basic Salary (paid for major religious festivals of other faiths)",
    incrementPolicy: "Annual increment based on KPI appraisal reviews every January",
    taxDeductionPolicy: "TDS deductions applied monthly in payroll calculations according to Bangladesh Income Tax Act 2023"
  },

  // Tax and VAT
  taxVat: {
    taxZone: "Zone 15",
    taxCircle: "Circle 1",
    vatCircle: "Circle 4, Banani",
    vatCommissionerate: "Dhaka North",
    authorizedTaxRepresentative: "CFO (Chief Financial Officer)",
    taxConsultantInfo: "M/S Haque & Associates Chartered Accountants, Dhaka"
  },

  // Bank accounts
  bankAccounts: [
    {
      id: "bank-1",
      bankName: "Al-Arafah Islami Bank Ltd.",
      branchName: "Banani Branch",
      accountName: "Advance Technology Consortium Ltd.",
      accountNumber: "0141120094958",
      routingNumber: "015261184",
      swiftCode: "AIBLBDDHXXX",
      certificateUrl: ""
    },
    {
      id: "bank-2",
      bankName: "The City Bank Ltd.",
      branchName: "Gulshan Corporate Branch",
      accountName: "Advance Technology Consortium Ltd.",
      accountNumber: "1102543928101",
      routingNumber: "220261342",
      swiftCode: "CIBKBDDHXXX",
      certificateUrl: ""
    }
  ],

  // Documents repository (metadata list)
  documents: [
    { id: "doc-1", name: "Certificate_of_Incorporation_ATCL.pdf", type: "Certificate of Incorporation", size: "1.4 MB", uploadDate: "2011-04-12", fileData: "" },
    { id: "doc-2", name: "Memorandum_of_Association_ATCL.pdf", type: "Memorandum of Association (MOA)", size: "4.8 MB", uploadDate: "2011-04-12", fileData: "" },
    { id: "doc-3", name: "Articles_of_Association_ATCL.pdf", type: "Articles of Association (AOA)", size: "3.2 MB", uploadDate: "2011-04-12", fileData: "" },
    { id: "doc-4", name: "Trade_License_2025_26.pdf", type: "Trade License", size: "2.1 MB", uploadDate: "2025-07-02", fileData: "" },
    { id: "doc-5", name: "TIN_Certificate_ATCL.pdf", type: "TIN Certificate", size: "850 KB", uploadDate: "2018-09-15", fileData: "" },
    { id: "doc-6", name: "BIN_Certificate_ATCL.pdf", type: "BIN Certificate", size: "920 KB", uploadDate: "2019-11-20", fileData: "" }
  ],

  // Assets summary counts
  assetsSummary: {
    total: 154,
    assigned: 118,
    available: 24,
    maintenance: 8,
    retired: 4
  },

  // Recruitment info
  recruitment: {
    openPositions: 4,
    totalApplicants: 184,
    underReview: 32,
    interviewsScheduled: 8,
    hiredThisQuarter: 5
  },

  // Security levels
  securitySettings: {
    superAdminAccess: true,
    hrManagerAccess: true,
    directorReadOnlyAccess: true
  }
};

export const SEED_AUDIT_LOGS = [
  { id: "log-1", timestamp: "2026-06-05T09:30:00Z", modifiedBy: "HR Administrator", action: "System Initialization", details: "Company profile database initialized with seed records." },
  { id: "log-2", timestamp: "2026-06-05T14:45:00Z", modifiedBy: "HR Administrator", action: "Update Trade License", details: "Updated Trade License Expiry Date to 2027-06-30." }
];
