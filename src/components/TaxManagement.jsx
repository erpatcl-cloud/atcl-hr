import React, { useContext, useState, useMemo } from 'react';
import { HRMSContext } from '../context/HRMSContext';
import {
  calculateBangladeshTax,
  REGIONS,
  TAX_YEARS,
  ASSESSMENT_PERIODS,
  TAXPAYER_CATEGORIES,
  CORPORATE_TAX_RATES_2026,
  INVESTMENT_SECTOR_CAPS,
  computeAllowableInvestmentAndRebate,
  simulateProgressiveSlabTax
} from '../utils/taxCalculator';
import { generateTaxCertificatePDF } from '../utils/pdfGenerator';
import { exportTaxReportExcel } from '../utils/excelExporter';

/* ─── Helpers ───────────────────────────────────────────────────────────────── */
const fmt  = (n) => Math.round(n).toLocaleString('en-BD');
const fmtK = (n) => {
  if (n >= 10_00_000) return `৳${(n / 10_00_000).toFixed(1)}L`;
  if (n >= 1000) return `৳${Math.round(n / 1000)}K`;
  return `৳${Math.round(n)}`;
};

export default function TaxManagement() {
  const { employees, investmentDeclarations, updateTaxDeclaration } = useContext(HRMSContext);

  const [activeTab, setActiveTab]           = useState('explorer');
  const [selectedEmpCode, setSelectedEmpCode] = useState(employees[0]?.employeeCode || '');
  const [trackSearch, setTrackSearch]       = useState('');
  const [trackFilter, setTrackFilter]       = useState('all');
  const [returnMsg, setReturnMsg]           = useState('');

  /* ── Statutory Slabs & Corporate Explorer State ────────────────────────── */
  const [explorerMode, setExplorerMode] = useState('individual'); // 'individual' | 'corporate'
  const [explorerPeriodId, setExplorerPeriodId] = useState('AY_2026_2028');
  const [explorerCategoryId, setExplorerCategoryId] = useState('general');
  const [isParentOfDisabled, setIsParentOfDisabled] = useState(false);
  const [simTaxableIncome, setSimTaxableIncome] = useState(1200000);
  const [simInvestments, setSimInvestments] = useState({
    dpsContribution: 120000,
    sanchaypatra: 200000,
    providentFund: 0,
    stocks: 0,
    lifeInsurance: 0,
    otherEligible: 0
  });

  const explorerSim = useMemo(() => simulateProgressiveSlabTax({
    taxableIncome: simTaxableIncome,
    periodId: explorerPeriodId,
    categoryId: explorerCategoryId,
    isParentOfDisabled
  }), [simTaxableIncome, explorerPeriodId, explorerCategoryId, isParentOfDisabled]);

  const explorerRebateSim = useMemo(() => computeAllowableInvestmentAndRebate({
    taxableIncome: simTaxableIncome,
    taxFreeThreshold: explorerSim.activeThreshold,
    investmentDetails: simInvestments
  }), [simTaxableIncome, explorerSim.activeThreshold, simInvestments]);

  const activeCategoryObj = TAXPAYER_CATEGORIES.find(c => c.id === explorerCategoryId) || TAXPAYER_CATEGORIES[0];

  const [taxReturns, setTaxReturns] = useState(() => {
    const saved = localStorage.getItem('atcl_tax_returns');
    if (saved) return JSON.parse(saved);
    const seeds = {};
    employees.forEach(e => {
      if (e.taxReturnSubmitted === true || e.taxReturnSubmitted === 'true') {
        seeds[e.employeeCode] = true;
      }
    });
    return seeds;
  });

  /* ── Active employee ───────────────────────────────────────────────────── */
  const emp  = employees.find(e => e.employeeCode === selectedEmpCode);
  const decl = investmentDeclarations[selectedEmpCode] || {
    tin: emp?.tin || '',
    taxZone: emp?.taxZone || '',
    taxCircle: emp?.taxCircle || '',
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

  /* ── Tax calculation ───────────────────────────────────────────────────── */
  const runTaxCalculation = (targetEmp) => {
    if (!targetEmp?.salaryComponents) return null;
    const d = investmentDeclarations[targetEmp.employeeCode] || {};
    const c = targetEmp.salaryComponents;
    const totalInvestment = (d.dpsContribution || 0) + (d.sanchaypatra || 0) +
                            (d.providentFund || 0)   + (d.stocks || 0) +
                            (d.lifeInsurance || 0)   + (d.otherEligible || 0);
    return calculateBangladeshTax({
      basicSalary : c.basicSalary * 12,
      allowances  : (c.houseRent + c.medicalAllowance + c.conveyanceAllowance + c.mobileAllowance + (c.otherAllowances || 0)) * 12,
      bonuses     : c.basicSalary * 2,
      gender      : targetEmp.gender,
      dob         : targetEmp.dob,
      age         : 30,
      taxpayerCategory: d.taxpayerCategory && d.taxpayerCategory !== 'auto' ? d.taxpayerCategory : undefined,
      isDisabled  : !!d.isDisabled,
      isFreedomFighter: !!d.isFreedomFighter,
      isParentOfDisabled: !!d.isParentOfDisabled,
      investment  : totalInvestment,
      investmentDetails: d,
      region      : d.region   || REGIONS.DHAKA_CHITTAGONG,
      taxYear     : d.taxYear  || TAX_YEARS['2025-2026']
    });
  };

  const calculatedTax = runTaxCalculation(emp);

  /* ── KPI stats (memoised across all active employees) ─────────────────── */
  const kpi = useMemo(() => {
    const active = employees.filter(e => e.status === 'Active');
    let totalMonthlyTDS   = 0;
    let totalAnnualTax    = 0;
    let withTIN           = 0;
    let taxableCount      = 0;
    const slabBuckets     = { '0%': 0, '5%': 0, '10%': 0, '15%': 0, '20%+': 0 };

    active.forEach(e => {
      const t = runTaxCalculation(e);
      if (e.tin) withTIN++;
      if (!t) return;
      totalMonthlyTDS  += t.monthlyTaxDeduction;
      totalAnnualTax   += t.netTax;
      if (t.netTax > 0) taxableCount++;
      // top bracket rate for this employee
      const rates = t.slabsApplied.filter(s => s.tax > 0).map(s => s.rate);
      const topRate = rates.length ? Math.max(...rates) : 0;
      if      (topRate === 0)  slabBuckets['0%']++;
      else if (topRate <= 5)   slabBuckets['5%']++;
      else if (topRate <= 10)  slabBuckets['10%']++;
      else if (topRate <= 15)  slabBuckets['15%']++;
      else                     slabBuckets['20%+']++;
    });

    const filedCount = Object.values(taxReturns).filter(Boolean).length;
    const returnRate = active.length > 0 ? Math.round((filedCount / active.length) * 100) : 0;

    return { active: active.length, withTIN, taxableCount, totalMonthlyTDS, totalAnnualTax, filedCount, returnRate, slabBuckets };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employees, investmentDeclarations, taxReturns]);

  /* ── Event handlers ────────────────────────────────────────────────────── */
  const handleUpdateDeclaration  = (_, field, value) => updateTaxDeclaration(selectedEmpCode, { [field]: value });

  const handleDownloadCertificate = () => {
    if (emp && calculatedTax) {
      generateTaxCertificatePDF(emp, calculatedTax, decl.taxYear || TAX_YEARS['2025-2026'], decl);
    }
  };

  const handleExportAnnualTaxReport = () => {
    const reportData = employees.filter(e => e.status === 'Active').map(e => {
      const taxData   = runTaxCalculation(e);
      const decProfile = investmentDeclarations[e.employeeCode] || {};
      return {
        employeeCode : e.employeeCode,
        name         : e.fullNameEnglish,
        tin          : decProfile.tin || e.tin,
        taxZone      : decProfile.taxZone  || e.taxZone,
        taxCircle    : decProfile.taxCircle || e.taxCircle,
        categoryLabel: taxData?.categoryLabel                 || 'General Individual',
        annualGross           : taxData?.annualGross          || 0,
        allowanceExemption    : taxData?.allowanceExemption   || 0,
        taxableIncome         : taxData?.taxableIncome        || 0,
        taxFreeThreshold      : taxData?.taxFreeThreshold     || 400000,
        grossTax              : taxData?.grossTax             || 0,
        actualTotalInvestment : taxData?.actualTotalInvestment || 0,
        allowableTotalInvestment: taxData?.allowableTotalInvestment || 0,
        rebate                : taxData?.rebate               || 0,
        netTax                : taxData?.netTax               || 0,
        monthlyTaxDeduction   : taxData?.monthlyTaxDeduction  || 0
      };
    });
    exportTaxReportExcel(reportData, decl.taxYear || TAX_YEARS['2025-2026']);
  };

  const handleReturnStatusToggle = (empCode) => {
    setTaxReturns(prev => {
      const updated = { ...prev, [empCode]: !prev[empCode] };
      localStorage.setItem('atcl_tax_returns', JSON.stringify(updated));
      setReturnMsg(`Tax return status for ${empCode} marked as ${updated[empCode] ? '✅ FILED' : '⏳ PENDING'}.`);
      setTimeout(() => setReturnMsg(''), 5000);
      return updated;
    });
  };

  /* ── Tracking list (filtered) ─────────────────────────────────────────── */
  const trackingList = useMemo(() => {
    return employees.filter(e => {
      if (e.status !== 'Active') return false;
      const filed = !!taxReturns[e.employeeCode];
      if (trackFilter === 'filed'   && !filed) return false;
      if (trackFilter === 'pending' && filed)  return false;
      const q = trackSearch.toLowerCase();
      return !q || e.fullNameEnglish.toLowerCase().includes(q) ||
             e.employeeCode.toLowerCase().includes(q) ||
             (e.tin || '').includes(q);
    });
  }, [employees, taxReturns, trackSearch, trackFilter]);

  /* ── Total declared investments (for declarations tab) ────────────────── */
  const totalInvested   = (decl.dpsContribution || 0) + (decl.sanchaypatra || 0) +
                          (decl.providentFund || 0)   + (decl.stocks || 0) +
                          (decl.lifeInsurance || 0)   + (decl.otherEligible || 0);
  const allowableInvested = calculatedTax?.allowableTotalInvestment ?? totalInvested;
  const maxRebateCap    = INVESTMENT_SECTOR_CAPS.REBATE_STATUTORY_CAP; // 7,50,000
  const investedPct     = Math.min(100, Math.round(((calculatedTax?.rebate || 0) / maxRebateCap) * 100));

  /* ── Slab chart max for normalisation ─────────────────────────────────── */
  const slabMax = Math.max(1, ...Object.values(kpi.slabBuckets));

  /* ════════════════════════════════════════════════════════════════════════ */
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* ── Scoped styles ────────────────────────────────────────────────── */}
      <style>{`
        /* KPI Cards */
        .tm-kpi-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
        }
        @media(max-width:900px){ .tm-kpi-grid{ grid-template-columns: repeat(2,1fr); } }
        @media(max-width:500px){ .tm-kpi-grid{ grid-template-columns: 1fr; } }

        .tm-kpi-card {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--border-radius-md);
          padding: 18px 20px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          position: relative;
          overflow: hidden;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .tm-kpi-card:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-lg);
        }
        .tm-kpi-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 3px;
          background: var(--tm-accent, var(--primary-color));
          border-radius: 3px 3px 0 0;
        }
        .tm-kpi-icon {
          width: 36px; height: 36px;
          border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          font-size: 1.1rem;
          margin-bottom: 4px;
          background: color-mix(in srgb, var(--tm-accent, var(--primary-color)) 12%, transparent);
        }
        .tm-kpi-value {
          font-size: 1.6rem;
          font-weight: 800;
          color: var(--text-primary);
          line-height: 1.1;
        }
        .tm-kpi-label {
          font-size: 0.72rem;
          color: var(--text-secondary);
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .tm-kpi-sub {
          font-size: 0.75rem;
          color: var(--text-muted);
          margin-top: 2px;
        }

        /* Selector card */
        .tm-selector {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--border-radius-md);
          padding: 14px 20px;
          display: flex;
          align-items: center;
          gap: 20px;
          flex-wrap: wrap;
        }
        .tm-selector-label {
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--primary-color);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          white-space: nowrap;
        }
        .tm-selector select {
          flex: 1;
          min-width: 240px;
          padding: 9px 14px;
          border-radius: var(--border-radius-sm);
          border: 1.5px solid var(--border-color);
          background: var(--bg-input);
          color: var(--text-primary);
          font-size: 0.875rem;
          font-family: inherit;
          transition: border-color 0.2s;
        }
        .tm-selector select:focus { outline: none; border-color: var(--secondary-color); }
        .tm-selector-meta {
          display: flex; gap: 16px; flex-wrap: wrap;
          font-size: 0.78rem; color: var(--text-secondary);
        }

        /* Tabs */
        .tm-tabs {
          display: flex; gap: 4px;
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--border-radius-md);
          padding: 5px;
          flex-wrap: wrap;
        }
        .tm-tab {
          flex: 1; min-width: 120px;
          padding: 9px 16px;
          border-radius: 8px;
          border: none;
          background: transparent;
          color: var(--text-secondary);
          font-size: 0.8rem;
          font-weight: 600;
          font-family: inherit;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
          text-align: center;
        }
        .tm-tab:hover:not(.active) { background: rgba(0,0,0,0.04); color: var(--text-primary); }
        .tm-tab.active {
          background: var(--primary-color);
          color: #fff;
          box-shadow: 0 2px 10px rgba(0,51,102,0.25);
        }

        /* Calculator layout */
        .tm-calc-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }
        @media(max-width: 820px){ .tm-calc-grid{ grid-template-columns: 1fr; } }

        /* Slab chart bar */
        .tm-slab-bar {
          display: flex; flex-direction: column; gap: 6px;
        }
        .tm-slab-bar-row {
          display: flex; align-items: center; gap: 12px; font-size: 0.78rem;
        }
        .tm-slab-bar-label { width: 110px; color: var(--text-secondary); font-weight: 600; flex-shrink: 0; }
        .tm-slab-bar-track {
          flex: 1; height: 10px;
          background: var(--border-color);
          border-radius: 100px;
          overflow: hidden;
        }
        .tm-slab-bar-fill {
          height: 100%; border-radius: 100px;
          background: linear-gradient(90deg, var(--primary-color), var(--secondary-color));
          transition: width 0.7s cubic-bezier(0.4,0,0.2,1);
        }
        .tm-slab-bar-val { width: 24px; text-align: right; font-weight: 700; color: var(--text-primary); }

        /* Donut chart */
        .tm-donut { width: 130px; height: 130px; border-radius: 50%; display: flex; align-items: center; justify-content: center; position: relative; flex-shrink: 0; }
        .tm-donut-center { position: absolute; inset: 16px; border-radius: 50%; background: var(--bg-card); display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; }
        .tm-donut-value { font-size: 0.9rem; font-weight: 800; color: var(--primary-color); line-height: 1.1; }
        .tm-donut-sub   { font-size: 0.58rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }

        /* Breakdown rows */
        .tm-breakdown-row {
          display: flex; justify-content: space-between;
          font-size: 0.82rem; padding: 4px 0;
          border-bottom: 1px solid var(--border-color);
        }
        .tm-breakdown-row:last-child { border-bottom: none; }

        /* Investment progress bar */
        .tm-inv-bar-track {
          height: 8px; background: var(--border-color); border-radius: 100px; overflow: hidden; margin-top: 6px;
        }
        .tm-inv-bar-fill {
          height: 100%; border-radius: 100px;
          background: linear-gradient(90deg, var(--secondary-color), #0077b6);
          transition: width 0.6s cubic-bezier(0.4,0,0.2,1);
        }

        /* Return tracking search row */
        .tm-track-toolbar {
          display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 16px;
        }
        .tm-track-search {
          flex: 1; min-width: 200px;
          padding: 9px 14px;
          border-radius: var(--border-radius-sm);
          border: 1.5px solid var(--border-color);
          background: var(--bg-input);
          color: var(--text-primary);
          font-size: 0.875rem;
          font-family: inherit;
          transition: border-color 0.2s;
        }
        .tm-track-search:focus { outline: none; border-color: var(--secondary-color); }
        .tm-track-filter {
          padding: 9px 14px;
          border-radius: var(--border-radius-sm);
          border: 1.5px solid var(--border-color);
          background: var(--bg-input);
          color: var(--text-primary);
          font-size: 0.875rem;
          font-family: inherit;
          cursor: pointer;
        }

        /* Return progress ring */
        .tm-ring-track {
          width: 80px; height: 80px; position: relative; flex-shrink: 0;
        }
        .tm-ring-svg { width: 100%; height: 100%; transform: rotate(-90deg); }
        .tm-ring-bg  { fill: none; stroke: var(--border-color); stroke-width: 7; }
        .tm-ring-fg  { fill: none; stroke: var(--success); stroke-width: 7; stroke-linecap: round;
                       transition: stroke-dashoffset 1s ease; }
        .tm-ring-label { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; flex-direction: column; }
        .tm-ring-pct { font-size: 1.1rem; font-weight: 800; color: var(--text-primary); }
        .tm-ring-sub { font-size: 0.55rem; color: var(--text-muted); text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px; }

        /* Form fields in cards */
        .tm-field { display: flex; flex-direction: column; gap: 4px; }
        .tm-field label { font-size: 0.72rem; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px; }
        .tm-field input, .tm-field select {
          padding: 9px 12px;
          border-radius: var(--border-radius-sm);
          border: 1.5px solid var(--border-color);
          background: var(--bg-input);
          color: var(--text-primary);
          font-size: 0.875rem;
          font-family: inherit;
          transition: border-color 0.2s;
          width: 100%;
        }
        .tm-field input:focus, .tm-field select:focus { outline: none; border-color: var(--secondary-color); }
        .tm-field input:disabled { opacity: 0.45; cursor: not-allowed; }

        /* Alert banner */
        .tm-alert-success {
          padding: 12px 16px;
          border-radius: var(--border-radius-sm);
          background: rgba(16,185,129,0.08);
          border: 1px solid rgba(16,185,129,0.3);
          color: var(--success);
          font-size: 0.82rem;
          font-weight: 600;
          animation: tmFadeIn 0.3s ease both;
        }
        @keyframes tmFadeIn { from { opacity:0; transform: translateY(-6px); } to { opacity:1; transform: none; } }

        /* Cert card */
        .tm-cert-card {
          display: flex; flex-direction: column; align-items: center;
          text-align: center; gap: 16px; padding: 60px 32px;
        }
        .tm-cert-icon {
          width: 80px; height: 80px;
          border-radius: 20px;
          background: rgba(0,51,102,0.07);
          display: flex; align-items: center; justify-content: center;
        }

        /* NBR badge */
        .tm-nbr-badge {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 10px 20px;
          border-radius: 100px;
          background: rgba(0,51,102,0.06);
          border: 1px solid rgba(0,51,102,0.15);
          font-size: 0.78rem; font-weight: 700;
          color: var(--primary-color);
        }
      `}</style>

      {/* ══ KPI Summary Cards ══════════════════════════════════════════════ */}
      <div className="tm-kpi-grid">
        {/* Total Employees with TIN */}
        <div className="tm-kpi-card" style={{ '--tm-accent': '#003366' }}>
          <div className="tm-kpi-icon">🪪</div>
          <div className="tm-kpi-value">{kpi.withTIN}<span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>/{kpi.active}</span></div>
          <div className="tm-kpi-label">TIN Registered</div>
          <div className="tm-kpi-sub">{kpi.active - kpi.withTIN} without TIN</div>
        </div>

        {/* Taxable Employees */}
        <div className="tm-kpi-card" style={{ '--tm-accent': '#00b4d8' }}>
          <div className="tm-kpi-icon">📊</div>
          <div className="tm-kpi-value">{kpi.taxableCount}</div>
          <div className="tm-kpi-label">Taxable Employees</div>
          <div className="tm-kpi-sub">{kpi.active - kpi.taxableCount} below threshold</div>
        </div>

        {/* Total Monthly TDS */}
        <div className="tm-kpi-card" style={{ '--tm-accent': '#f59e0b' }}>
          <div className="tm-kpi-icon">💰</div>
          <div className="tm-kpi-value">{fmtK(kpi.totalMonthlyTDS)}</div>
          <div className="tm-kpi-label">Monthly TDS Liability</div>
          <div className="tm-kpi-sub">{fmtK(kpi.totalAnnualTax)} / annual</div>
        </div>

        {/* Returns Filed */}
        <div className="tm-kpi-card" style={{ '--tm-accent': '#10b981' }}>
          <div className="tm-kpi-icon">✅</div>
          <div className="tm-kpi-value">{kpi.returnRate}%</div>
          <div className="tm-kpi-label">Returns Filed</div>
          <div className="tm-kpi-sub">{kpi.filedCount} of {kpi.active} employees</div>
        </div>
      </div>

      {/* ══ Global Employee Selector ═══════════════════════════════════════ */}
      <div className="tm-selector">
        <span className="tm-selector-label">👤 Employee</span>
        <select
          value={selectedEmpCode}
          onChange={(e) => setSelectedEmpCode(e.target.value)}
        >
          {employees.filter(e => e.status === 'Active').map(e => (
            <option key={e.employeeCode} value={e.employeeCode}>
              {e.employeeCode} — {e.fullNameEnglish} ({e.designation})
            </option>
          ))}
        </select>
        {emp && (
          <div className="tm-selector-meta">
            <span>🏢 {emp.department}</span>
            <span>🪪 TIN: <strong style={{ color: 'var(--text-primary)' }}>{emp.tin || 'N/A'}</strong></span>
            <span>📍 {decl.taxCircle || emp.taxCircle || 'Circle 1'} / {decl.taxZone || emp.taxZone || 'Zone 15'}</span>
          </div>
        )}
      </div>

      {/* ══ Tab Navigation ═════════════════════════════════════════════════ */}
      <div className="tm-tabs">
        {[
          { id: 'explorer',     label: '🏛 Slabs & Corporate Explorer' },
          { id: 'calculator',   label: '🧮 Employee Tax Calculator' },
          { id: 'declarations', label: '📋 Investments' },
          { id: 'certificates', label: '📄 Certificates' },
          { id: 'tracking',     label: '📌 Return Tracking' },
        ].map(t => (
          <button
            key={t.id}
            className={`tm-tab ${activeTab === t.id ? 'active' : ''}`}
            onClick={() => setActiveTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ══ TAB: Bangladesh Income Tax Slabs & Corporate Rates Explorer ════ */}
      {activeTab === 'explorer' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          {/* Hero Header Card */}
          <div className="card" style={{
            background: 'linear-gradient(135deg, rgba(0, 51, 102, 0.08), rgba(0, 180, 216, 0.08))',
            border: '1px solid rgba(0, 180, 216, 0.28)',
            display: 'flex',
            flexDirection: 'column',
            gap: 16
          }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-color)', margin: 0 }}>
                Bangladesh Income Tax Slabs & Corporate Rates Explorer
              </h2>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginTop: 6, marginBottom: 0, lineHeight: 1.5 }}>
                Interactive multi-year statutory slab explorer for individual taxpayers (General, Women, Senior Citizens, July Warriors 2024, Disabled) and corporate entities under the <strong>Income Tax Act, 2023 & Finance Act 2026</strong>.
              </p>
            </div>

            {/* Assessment Year & Corporate Rate Pills */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {ASSESSMENT_PERIODS.map(period => {
                const isSelected = explorerMode === 'individual' && explorerPeriodId === period.id;
                return (
                  <button
                    key={period.id}
                    type="button"
                    onClick={() => {
                      setExplorerMode('individual');
                      setExplorerPeriodId(period.id);
                    }}
                    style={{
                      padding: '9px 16px',
                      borderRadius: 8,
                      fontWeight: 700,
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      border: isSelected ? '1.5px solid var(--primary-color)' : '1px solid var(--border-color)',
                      background: isSelected ? 'var(--primary-color)' : 'var(--bg-card)',
                      color: isSelected ? '#fff' : 'var(--text-primary)',
                      boxShadow: isSelected ? '0 3px 10px rgba(0,51,102,0.2)' : 'none',
                      transition: 'all 0.18s'
                    }}
                  >
                    {period.label}
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => setExplorerMode('corporate')}
                style={{
                  padding: '9px 16px',
                  borderRadius: 8,
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  border: explorerMode === 'corporate' ? '1.5px solid #00b4d8' : '1px solid var(--border-color)',
                  background: explorerMode === 'corporate' ? '#00b4d8' : 'var(--bg-card)',
                  color: explorerMode === 'corporate' ? '#fff' : 'var(--text-primary)',
                  boxShadow: explorerMode === 'corporate' ? '0 3px 10px rgba(0,180,216,0.25)' : 'none',
                  transition: 'all 0.18s'
                }}
              >
                🏢 Corporate Tax Rates (AY 2026-27)
              </button>
            </div>
          </div>

          {explorerMode === 'individual' ? (
            <>
              {/* Category Selector + Threshold Highlight Row */}
              <div className="tm-calc-grid">
                <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div className="tm-field">
                    <label>Select Taxpayer Category:</label>
                    <select
                      value={explorerCategoryId}
                      onChange={e => setExplorerCategoryId(e.target.value)}
                    >
                      {TAXPAYER_CATEGORIES.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.label}</option>
                      ))}
                    </select>
                  </div>

                  <label style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 10,
                    padding: '12px 14px',
                    borderRadius: 8,
                    background: isParentOfDisabled ? 'rgba(16, 185, 129, 0.08)' : 'var(--bg-input)',
                    border: isParentOfDisabled ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid var(--border-color)',
                    cursor: 'pointer'
                  }}>
                    <input
                      type="checkbox"
                      checked={isParentOfDisabled}
                      onChange={e => setIsParentOfDisabled(e.target.checked)}
                      style={{ marginTop: 3, width: 16, height: 16 }}
                    />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.84rem', color: 'var(--text-primary)' }}>
                        Parent / Guardian of Person with Disability?
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                        Adds + BDT 50,000 to base tax-free threshold (Section 5 adjustment).
                      </div>
                    </div>
                  </label>
                </div>

                {/* Active Threshold Summary Card */}
                <div className="card" style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: 12,
                  background: 'linear-gradient(135deg, rgba(0,51,102,0.04), rgba(16,185,129,0.05))'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                    <div>
                      <div style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                        Active Tax-Free Threshold ({explorerSim.period.label.replace(/^AY\s+/, '')}):
                      </div>
                      <div style={{ fontSize: '1.9rem', fontWeight: 800, color: 'var(--primary-color)', marginTop: 4 }}>
                        BDT {explorerSim.activeThreshold.toLocaleString('en-US')}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>
                        Base BDT {explorerSim.baseThreshold.toLocaleString('en-US')}
                        {explorerSim.parentAddition > 0 && ` + BDT ${explorerSim.parentAddition.toLocaleString('en-US')} (Disability Guardian)`}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                        Applicable Period:
                      </div>
                      <div className="badge badge-success" style={{ marginTop: 6, fontSize: '0.78rem', padding: '5px 10px' }}>
                        {explorerSim.period.periodText}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Statutory Income Tax Slabs Table + Live Simulator Grid */}
              <div className="tm-calc-grid">
                {/* Statutory Slabs Table */}
                <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--primary-color)', margin: 0 }}>
                    Statutory Income Tax Slabs ({activeCategoryObj.label})
                  </h3>

                  <div className="table-container" style={{ padding: 0, border: '1px solid var(--border-color)', borderRadius: 8 }}>
                    <table>
                      <thead>
                        <tr>
                          <th>Taxable Income Tier</th>
                          <th>Tax Rate</th>
                          <th>Statutory Base Threshold</th>
                          <th>Assessment Year</th>
                        </tr>
                      </thead>
                      <tbody>
                        {explorerSim.breakdown.map((tier, idx) => (
                          <tr key={idx}>
                            <td style={{ fontWeight: 700 }}>{tier.tierLabel}</td>
                            <td>
                              <span className={`badge ${tier.rate === 0 ? 'badge-success' : 'badge-warning'}`} style={{ fontWeight: 700 }}>
                                {tier.rate}%
                              </span>
                            </td>
                            <td>BDT {tier.baseThreshold.toLocaleString('en-US')}</td>
                            <td style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{tier.periodLabel}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Live Individual Income Tax Calculation Simulator */}
                <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--primary-color)', margin: 0 }}>
                      Live Individual Income Tax Calculation Simulator
                    </h3>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 4, marginBottom: 0 }}>
                      Enter annual total taxable income to evaluate exact progressive slab tax computation.
                    </p>
                  </div>

                  <div className="tm-field">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label>Total Taxable Business / Salary Income (BDT)</label>
                      <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--secondary-color)' }}>
                        Tk. {(explorerSim.taxableIncome / 100000).toFixed(2)} Lakhs
                      </span>
                    </div>
                    <input
                      type="number"
                      min={0}
                      step={10000}
                      value={simTaxableIncome}
                      onChange={e => setSimTaxableIncome(Number(e.target.value) || 0)}
                    />
                  </div>

                  <div>
                    <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 8 }}>
                      Step-by-Step Progressive Slab Tax Breakdown:
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {explorerSim.breakdown.filter((b, i) => i === 0 || b.taxableInSlab > 0).map((b, idx) => (
                        <div
                          key={idx}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '10px 12px',
                            borderRadius: 8,
                            background: b.tax > 0 ? 'rgba(0, 180, 216, 0.06)' : 'var(--bg-input)',
                            border: '1px solid var(--border-color)'
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '0.83rem', color: 'var(--text-primary)' }}>
                              {b.tierTitle}
                            </div>
                            <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                              Taxable in slab: BDT {b.taxableInSlab.toLocaleString('en-US')} @ {b.rate}%
                            </div>
                          </div>
                          <div style={{ fontWeight: 800, fontSize: '0.9rem', color: b.tax > 0 ? 'var(--primary-color)' : 'var(--text-muted)' }}>
                            BDT {b.tax.toLocaleString('en-US')}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Gross Income Tax Payable Footer */}
                  <div style={{
                    marginTop: 'auto',
                    padding: '14px 16px',
                    borderRadius: 10,
                    background: 'linear-gradient(135deg, var(--primary-color), #004e92)',
                    color: '#fff',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 12
                  }}>
                    <div>
                      <div style={{ fontSize: '0.75rem', opacity: 0.85, fontWeight: 600 }}>
                        Gross Income Tax Payable (Before Rebate):
                      </div>
                      <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>
                        BDT {explorerSim.grossTax.toLocaleString('en-US')}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{
                        background: 'rgba(255,255,255,0.18)',
                        padding: '6px 12px',
                        borderRadius: 100,
                        fontSize: '0.8rem',
                        fontWeight: 700
                      }}>
                        Effective Tax Rate: {explorerSim.effectiveRate.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Investment Tax Rebate: 3-Limit Formula & Sector-Specific Caps Explorer */}
              <div className="tm-calc-grid">
                <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--primary-color)', margin: 0 }}>
                      Sector-Specific Allowable Investment Caps Simulator
                    </h3>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 4, marginBottom: 0 }}>
                      Amounts invested above statutory sector caps are automatically ignored when computing total allowable investment.
                    </p>
                  </div>

                  {[
                    {
                      field: 'dpsContribution',
                      label: 'Deposit Pension Scheme (DPS)',
                      sub: 'Statutory Cap: Tk. 1,20,000 / year (excess ignored)',
                      cap: 120000
                    },
                    {
                      field: 'sanchaypatra',
                      label: 'Savings Certificates (Sanchayapatra) / Govt. Securities',
                      sub: 'Statutory Cap: Tk. 5,00,000 / year (excess ignored)',
                      cap: 500000
                    },
                    {
                      field: 'providentFund',
                      label: 'Recognized Provident Fund (RPF — Employee + Employer)',
                      sub: '100% Allowable (No sector cap)',
                      cap: null
                    },
                    {
                      field: 'stocks',
                      label: 'Mutual Funds, Unit Certificates, ETFs & Listed Stocks',
                      sub: '100% Allowable (Approved listed securities)',
                      cap: null
                    },
                    {
                      field: 'lifeInsurance',
                      label: 'Life Insurance Premium & Deferred Annuities',
                      sub: 'Actual premium paid allowable',
                      cap: null
                    }
                  ].map(item => {
                    const actualVal = Number(simInvestments[item.field]) || 0;
                    const allowableVal = item.cap ? Math.min(actualVal, item.cap) : actualVal;
                    const excessVal = Math.max(0, actualVal - allowableVal);
                    return (
                      <div key={item.field} style={{
                        padding: '10px 12px',
                        borderRadius: 8,
                        border: '1px solid var(--border-color)',
                        background: 'var(--bg-input)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 6
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '0.82rem' }}>{item.label}</div>
                            <div style={{ fontSize: '0.71rem', color: 'var(--text-secondary)' }}>{item.sub}</div>
                          </div>
                          <div style={{ textAlign: 'right', fontSize: '0.75rem' }}>
                            <span style={{ color: 'var(--success)', fontWeight: 700 }}>
                              Allowable: ৳{allowableVal.toLocaleString('en-BD')}
                            </span>
                            {excessVal > 0 && (
                              <div style={{ color: '#ef4444', fontSize: '0.68rem', fontWeight: 600 }}>
                                Ignored Excess: ৳{excessVal.toLocaleString('en-BD')}
                              </div>
                            )}
                          </div>
                        </div>
                        <input
                          type="number"
                          min={0}
                          step={5000}
                          value={actualVal}
                          onChange={e => setSimInvestments(p => ({ ...p, [item.field]: Math.max(0, Number(e.target.value) || 0) }))}
                          style={{ padding: '7px 10px', borderRadius: 6, border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: '0.84rem' }}
                        />
                      </div>
                    );
                  })}
                </div>

                {/* 3-Limit Formula Comparison Card */}
                <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--primary-color)', margin: 0 }}>
                      Investment Tax Rebate: The 3-Limit Formula
                    </h3>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 4, marginBottom: 0 }}>
                      Your actual tax rebate is the <strong>LOWER</strong> of Limit A, Limit B, and Limit C:
                    </p>
                  </div>

                  <div style={{
                    padding: '12px 14px',
                    borderRadius: 8,
                    background: 'rgba(0, 180, 216, 0.06)',
                    border: '1px solid rgba(0, 180, 216, 0.22)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 8
                  }}>
                    <div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                        Total Actual Investment: ৳{explorerRebateSim.actualTotalInvestment.toLocaleString('en-BD')}
                      </div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--primary-color)' }}>
                        Total Allowable Investment: BDT {explorerRebateSim.allowableTotalInvestment.toLocaleString('en-US')}
                      </div>
                    </div>
                    {explorerRebateSim.ignoredInvestment > 0 && (
                      <span className="badge badge-danger" style={{ fontSize: '0.72rem' }}>
                        Ignored Above Cap: BDT {explorerRebateSim.ignoredInvestment.toLocaleString('en-US')}
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {[
                      {
                        title: 'Limit A: 10% of Total Allowable Investment',
                        desc: `10% × BDT ${explorerRebateSim.allowableTotalInvestment.toLocaleString('en-US')}`,
                        val: explorerRebateSim.limitA
                      },
                      {
                        title: 'Limit B: 3% of Total Taxable Income',
                        desc: `3% × BDT ${explorerSim.taxableIncome.toLocaleString('en-US')} (excluding exempt/reduced-rate income)`,
                        val: explorerRebateSim.limitB
                      },
                      {
                        title: 'Limit C: Statutory Maximum Rebate Cap',
                        desc: 'Fixed statutory ceiling under Income Tax Act guidelines',
                        val: explorerRebateSim.limitC
                      }
                    ].map((lim, i) => {
                      const isLowest = explorerRebateSim.rebate > 0 && lim.val === explorerRebateSim.rebate;
                      return (
                        <div key={i} style={{
                          padding: '12px 14px',
                          borderRadius: 8,
                          border: isLowest ? '1.5px solid var(--success)' : '1px solid var(--border-color)',
                          background: isLowest ? 'rgba(16, 185, 129, 0.08)' : 'var(--bg-input)',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: 12
                        }}>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '0.84rem', color: 'var(--text-primary)' }}>
                              {lim.title} {isLowest && <span className="badge badge-success" style={{ marginLeft: 6, fontSize: '0.66rem' }}>LOWEST (APPLIED)</span>}
                            </div>
                            <div style={{ fontSize: '0.73rem', color: 'var(--text-secondary)', marginTop: 2 }}>{lim.desc}</div>
                          </div>
                          <div style={{ fontWeight: 800, fontSize: '0.95rem', color: isLowest ? 'var(--success)' : 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                            BDT {lim.val.toLocaleString('en-US')}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Final Net Tax After Rebate */}
                  <div style={{
                    marginTop: 'auto',
                    padding: '14px 16px',
                    borderRadius: 10,
                    background: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.35)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 12
                  }}>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 700 }}>
                        Allowable Investment Tax Rebate:
                      </div>
                      <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--success)' }}>
                        BDT {explorerRebateSim.rebate.toLocaleString('en-US')}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 700 }}>
                        Net Tax Payable (After Rebate):
                      </div>
                      <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--primary-color)' }}>
                        BDT {Math.max(0, explorerSim.grossTax - explorerRebateSim.rebate).toLocaleString('en-US')}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* Corporate Tax Rates Explorer Table */
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--primary-color)', margin: 0 }}>
                    🏢 Bangladesh Corporate Income Tax Rates Schedule (AY 2026-2027)
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 4, marginBottom: 0 }}>
                    Statutory corporate tax rates under the Income Tax Act, 2023 & Finance Act 2026 including cashless banking compliance rebates.
                  </p>
                </div>
                <span className="badge badge-success" style={{ padding: '6px 12px', fontSize: '0.78rem' }}>
                  ATCL Applicable Tier: Private Limited (25.0% / 27.5%)
                </span>
              </div>

              <div className="table-container" style={{ padding: 0 }}>
                <table>
                  <thead>
                    <tr>
                      <th>Corporate Entity Classification</th>
                      <th>Compliant Rate (Cashless)</th>
                      <th>Standard / Non-Compliant Rate</th>
                      <th>Statutory Compliance Condition & Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {CORPORATE_TAX_RATES_2026.map((row, i) => (
                      <tr key={i} style={row.category.includes('ATCL') ? { background: 'rgba(0, 180, 216, 0.08)' } : undefined}>
                        <td style={{ fontWeight: 700 }}>{row.category}</td>
                        <td><span className="badge badge-success" style={{ fontWeight: 700 }}>{row.compliantRate}</span></td>
                        <td><span className="badge badge-warning" style={{ fontWeight: 700 }}>{row.nonCompliantRate}</span></td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{row.notes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══ TAB: Calculator ════════════════════════════════════════════════ */}
      {activeTab === 'calculator' && (
        <div className="tm-calc-grid">

          {/* Left: Inputs + Slab Distribution */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <h3 style={{ color: 'var(--primary-color)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>🧮</span> Annual Tax Calculation
              </h3>

              {emp && calculatedTax ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div className="tm-field">
                      <label>Assessment Period / Income Year</label>
                      <select
                        value={decl.taxYear || TAX_YEARS['2025-2026']}
                        onChange={(e) => handleUpdateDeclaration(e, 'taxYear', e.target.value)}
                      >
                        <option value={TAX_YEARS['2025-2026']}>AY 2026-2027, 2027-2028 (Base ৳4.00L)</option>
                        <option value={TAX_YEARS['2028-2029']}>AY 2028-2029 & 2029-2030 (Base ৳4.25L)</option>
                        <option value={TAX_YEARS['2030-2031']}>AY 2030-2031 (Base ৳4.50L)</option>
                        <option value={TAX_YEARS['2024-2025']}>AY 2025-2026 (Base ৳3.50L)</option>
                      </select>
                    </div>
                    <div className="tm-field">
                      <label>Minimum Tax Region</label>
                      <select
                        value={decl.region}
                        onChange={(e) => handleUpdateDeclaration(e, 'region', e.target.value)}
                      >
                        <option value={REGIONS.DHAKA_CHITTAGONG}>{REGIONS.DHAKA_CHITTAGONG} (৳5,000)</option>
                        <option value={REGIONS.OTHER_CITY_CORP}>{REGIONS.OTHER_CITY_CORP} (৳4,000)</option>
                        <option value={REGIONS.OUTSIDE_CITY_CORP}>{REGIONS.OUTSIDE_CITY_CORP} (৳3,000)</option>
                      </select>
                    </div>
                  </div>

                  {/* Statutory Taxpayer Category & Section 5 Disability Guardian Adjustment */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div className="tm-field">
                      <label>Select Taxpayer Category</label>
                      <select
                        value={decl.taxpayerCategory || 'auto'}
                        onChange={(e) => handleUpdateDeclaration(e, 'taxpayerCategory', e.target.value)}
                      >
                        <option value="auto">
                          Auto-Detect ({calculatedTax.categoryLabel} · Age {calculatedTax.computedAge})
                        </option>
                        {TAXPAYER_CATEGORIES.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="tm-field">
                      <label>Parent / Guardian of Person with Disability?</label>
                      <label style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '8px 12px',
                        borderRadius: 'var(--border-radius-sm)',
                        border: '1.5px solid var(--border-color)',
                        background: decl.isParentOfDisabled ? 'rgba(16, 185, 129, 0.08)' : 'var(--bg-input)',
                        cursor: 'pointer',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        textTransform: 'none',
                        letterSpacing: 0,
                        color: 'var(--text-primary)'
                      }}>
                        <input
                          type="checkbox"
                          checked={!!decl.isParentOfDisabled}
                          onChange={(e) => handleUpdateDeclaration(e, 'isParentOfDisabled', e.target.checked)}
                          style={{ width: 16, height: 16, accentColor: 'var(--primary-color)' }}
                        />
                        <span>+BDT 50,000 Threshold (Section 5)</span>
                      </label>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                    <div className="tm-field">
                      <label>TIN Number</label>
                      <input type="text" value={decl.tin || ''} placeholder="12-digit NBR TIN"
                        onChange={(e) => handleUpdateDeclaration(e, 'tin', e.target.value)} />
                    </div>
                    <div className="tm-field">
                      <label>Tax Circle</label>
                      <input type="text" value={decl.taxCircle || ''}
                        onChange={(e) => handleUpdateDeclaration(e, 'taxCircle', e.target.value)} />
                    </div>
                    <div className="tm-field">
                      <label>Tax Zone</label>
                      <input type="text" value={decl.taxZone || ''}
                        onChange={(e) => handleUpdateDeclaration(e, 'taxZone', e.target.value)} />
                    </div>
                  </div>

                  <button type="button" className="btn btn-primary" onClick={handleExportAnnualTaxReport}
                    style={{ width: '100%', marginTop: 4 }}>
                    ⬇ Export Annual Tax Summary (Excel)
                  </button>
                </div>
              ) : (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No salary data found for selected employee.</p>
              )}
            </div>

            {/* Slab Distribution Chart (All active employees) */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <h3 style={{ color: 'var(--primary-color)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>📊</span> Tax Bracket Distribution
                <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 400 }}>
                  All Active Employees
                </span>
              </h3>
              <div className="tm-slab-bar">
                {Object.entries(kpi.slabBuckets).map(([label, count]) => (
                  <div key={label} className="tm-slab-bar-row">
                    <span className="tm-slab-bar-label">{label} Slab</span>
                    <div className="tm-slab-bar-track">
                      <div className="tm-slab-bar-fill"
                        style={{ width: `${Math.round((count / slabMax) * 100)}%` }} />
                    </div>
                    <span className="tm-slab-bar-val">{count}</span>
                  </div>
                ))}
              </div>
              <p style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>
                Shows the highest tax bracket each active employee falls into based on current salary components.
              </p>
            </div>
          </div>

          {/* Right: Tax breakdown for selected employee */}
          {emp && calculatedTax ? (
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <h3 style={{ color: 'var(--primary-color)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>📑</span> Tax Liability — {emp.fullNameEnglish}
              </h3>

              {/* Donut + summary row */}
              <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
                {/* Donut */}
                <div className="tm-donut" style={{
                  background: `conic-gradient(
                    var(--primary-color) 0% ${calculatedTax.grossTax > 0 ? Math.round((calculatedTax.netTax / calculatedTax.grossTax) * 100) : 0}%,
                    var(--secondary-color) ${calculatedTax.grossTax > 0 ? Math.round((calculatedTax.netTax / calculatedTax.grossTax) * 100) : 0}% 100%
                  )`
                }}>
                  <div className="tm-donut-center">
                    <span className="tm-donut-value">৳{fmt(calculatedTax.monthlyTaxDeduction)}</span>
                    <span className="tm-donut-sub">TDS / Month</span>
                  </div>
                </div>

                {/* Text breakdown */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0 }}>
                  <div className="tm-breakdown-row">
                    <span>Annual Gross Income</span>
                    <strong>৳{fmt(calculatedTax.annualGross)}</strong>
                  </div>
                  <div className="tm-breakdown-row" style={{ color: 'var(--text-secondary)' }}>
                    <span>(−) Consolidated Exemption (Lower of 1/3rd or ৳{((calculatedTax.salaryExemptionCap || 500000) / 100000).toFixed(2)}L)</span>
                    <strong>(৳{fmt(calculatedTax.allowanceExemption)})</strong>
                  </div>
                  <div className="tm-breakdown-row">
                    <span>Total Taxable Income</span>
                    <strong>৳{fmt(calculatedTax.taxableIncome)}</strong>
                  </div>
                  <div className="tm-breakdown-row">
                    <span>Taxpayer Category</span>
                    <strong style={{ fontSize: '0.78rem', color: 'var(--primary-color)' }}>{calculatedTax.categoryLabel}</strong>
                  </div>
                  <div className="tm-breakdown-row">
                    <span>Active Tax-Free Threshold {calculatedTax.parentAddition > 0 ? '(incl. +৳50K Sec. 5)' : ''}</span>
                    <strong>৳{calculatedTax.taxFreeThreshold.toLocaleString('en-BD')}</strong>
                  </div>
                  <div className="tm-breakdown-row">
                    <span>Gross Calculated Tax (Progressive Slabs)</span>
                    <strong>৳{fmt(calculatedTax.grossTax)}</strong>
                  </div>
                  <div className="tm-breakdown-row" style={{ color: 'var(--text-secondary)' }}>
                    <span>Allowable Investment (Declared: ৳{fmt(calculatedTax.actualTotalInvestment)})</span>
                    <strong>৳{fmt(calculatedTax.allowableTotalInvestment)}</strong>
                  </div>
                  <div className="tm-breakdown-row" style={{ color: 'var(--success)' }}>
                    <span>(−) 3-Limit Investment Tax Rebate</span>
                    <strong>(৳{fmt(calculatedTax.rebate)})</strong>
                  </div>
                  {calculatedTax.isMinimumTaxApplied && (
                    <div className="tm-breakdown-row" style={{ color: 'var(--warning)' }}>
                      <span>⚠ Minimum Tax Applied ({decl.region})</span>
                      <strong>৳{fmt(calculatedTax.minTaxAmount)}</strong>
                    </div>
                  )}
                  <div className="tm-breakdown-row" style={{
                    borderTop: '2px solid var(--primary-color)',
                    paddingTop: 8,
                    fontWeight: 800,
                    fontSize: '0.95rem',
                    color: 'var(--primary-color)'
                  }}>
                    <span>Net Annual Tax Due (TDS)</span>
                    <span>৳{fmt(calculatedTax.netTax)}</span>
                  </div>
                </div>
              </div>

              {/* Progressive slabs */}
              <div>
                <h4 style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Progressive Slabs Applied
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {calculatedTax.slabsApplied.map((slab, idx) => (
                    <div key={idx}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: 4 }}>
                        <span style={{ color: slab.rate > 0 ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                          {slab.slabName} <span style={{ opacity: 0.6 }}>({slab.rate}%)</span>
                        </span>
                        <span style={{ fontWeight: 700 }}>
                          ৳{fmt(slab.tax)}
                        </span>
                      </div>
                      <div style={{ height: 5, background: 'var(--border-color)', borderRadius: 100, overflow: 'hidden' }}>
                        <div style={{
                          height: '100%',
                          width: slab.tax > 0 ? `${Math.min(100, Math.round((slab.tax / calculatedTax.netTax) * 100))}%` : '0%',
                          background: idx === 0 ? 'var(--text-muted)' : `hsl(${200 - idx * 30}, 80%, 45%)`,
                          borderRadius: 100,
                          transition: 'width 0.7s ease'
                        }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 24px', color: 'var(--text-muted)', flexDirection: 'column', gap: 12 }}>
              <span style={{ fontSize: '2rem' }}>📊</span>
              <p style={{ fontSize: '0.85rem' }}>Select an employee with salary data to view tax breakdown.</p>
            </div>
          )}
        </div>
      )}

      {/* ══ TAB: Declarations ══════════════════════════════════════════════ */}
      {activeTab === 'declarations' && emp && (
        <div className="tm-calc-grid">
          {/* Declaration form */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h3 style={{ color: 'var(--primary-color)' }}>📋 Sector-Specific Investment Declarations</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Declare annual investments under <strong>Section 78, Income Tax Act 2023</strong>. Sector caps apply automatically (DPS max <strong>৳1,20,000</strong>, Sanchayapatra max <strong>৳5,00,000</strong>), and the 3-Limit Rebate Formula caps maximum tax rebate at <strong>৳7,50,000</strong>.
            </p>

            {[
              { field: 'dpsContribution', label: 'Deposit Pension Scheme (DPS)', note: 'Statutory allowable cap: ৳1,20,000 / year', cap: 120000, icon: '🏦' },
              { field: 'sanchaypatra',    label: 'Savings Certificates (Sanchayapatra) / Govt. Securities', note: 'Statutory allowable cap: ৳5,00,000 / year', cap: 500000, icon: '📜' },
              { field: 'providentFund',   label: 'Recognized Provident Fund (RPF)', note: 'Employee + Employer contributions (100% allowable)', cap: null, icon: '🛡' },
              { field: 'stocks',          label: 'Mutual Funds, Unit Certificates, ETFs & Listed Stocks', note: 'Approved listed securities (100% allowable)', cap: null, icon: '📈' },
              { field: 'lifeInsurance',   label: 'Life Insurance Premium & Deferred Annuities', note: 'Actual annual policy premium paid', cap: null, icon: '❤️' },
              { field: 'otherEligible',   label: 'Other Approved Schemes (e.g., Universal Pension)', note: '100% allowable under Sixth Schedule', cap: null, icon: '🏛' },
            ].map(({ field, label, note, cap, icon }) => {
              const val = decl[field] || 0;
              const allowableVal = cap ? Math.min(val, cap) : val;
              const ignoredVal = Math.max(0, val - allowableVal);
              const pct = cap ? Math.min(100, Math.round((val / cap) * 100)) : 100;
              return (
                <div key={field} style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '14px 16px', background: 'rgba(0,0,0,0.015)', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>{icon} {label}</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{note}</span>
                  </div>
                  <input
                    type="number" min={0}
                    value={val}
                    onChange={(e) => handleUpdateDeclaration(e, field, Math.max(0, parseInt(e.target.value) || 0))}
                    style={{ padding: '8px 12px', borderRadius: 8, border: '1.5px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)', fontFamily: 'inherit', fontSize: '0.875rem', width: '100%', transition: 'border-color 0.2s' }}
                    onFocus={e => (e.target.style.borderColor = 'var(--secondary-color)')}
                    onBlur={e  => (e.target.style.borderColor = 'var(--border-color)')}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    <span style={{ color: 'var(--success)', fontWeight: 700 }}>
                      Allowable for Rebate: ৳{allowableVal.toLocaleString('en-BD')}
                    </span>
                    {cap ? (
                      <span>
                        {ignoredVal > 0 ? (
                          <strong style={{ color: '#ef4444' }}>Ignored above cap: ৳{ignoredVal.toLocaleString('en-BD')}</strong>
                        ) : (
                          `${pct}% of ৳${cap.toLocaleString('en-BD')} cap`
                        )}
                      </span>
                    ) : (
                      <span>Fully Allowable</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Rebate assessment card */}
          {calculatedTax && (
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <h3 style={{ color: 'var(--primary-color)' }}>📐 Investment Tax Rebate: The 3-Limit Formula</h3>

              {/* Total Actual vs Allowable investment summary */}
              <div style={{ padding: '16px', background: 'rgba(0,180,216,0.04)', border: '1px solid rgba(0,180,216,0.2)', borderRadius: 'var(--border-radius-sm)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Actual Declared Investment</span>
                  <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>৳{totalInvested.toLocaleString('en-BD')}</strong>
                </div>
                {calculatedTax.ignoredInvestment > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#ef4444', fontSize: '0.76rem' }}>
                    <span>(−) Ignored Excess Above Sector Caps (DPS / Sanchayapatra)</span>
                    <strong>−৳{calculatedTax.ignoredInvestment.toLocaleString('en-BD')}</strong>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: 8 }}>
                  <span style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--primary-color)' }}>Total Allowable Investment</span>
                  <strong style={{ fontSize: '1.05rem', color: 'var(--primary-color)' }}>৳{allowableInvested.toLocaleString('en-BD')}</strong>
                </div>
              </div>

              {/* 3-Limit Formula breakdown */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.82rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                  Three-Way Statutory Comparison (Lower of Limit A, B & C):
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-color)' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Limit A: 10% of Total Allowable Investment (10% × ৳{fmt(allowableInvested)})</span>
                  <strong>৳{fmt(calculatedTax.rebateBreakdown.limitA_tenPercentOfAllowableInvestment)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-color)' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Limit B: 3% of Total Taxable Income (3% × ৳{fmt(calculatedTax.taxableIncome)})</span>
                  <strong>৳{fmt(calculatedTax.rebateBreakdown.limitB_threePercentOfTaxableIncome)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-color)' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Limit C: Statutory Maximum Rebate Cap</span>
                  <strong>৳{calculatedTax.rebateBreakdown.limitC_statutoryCap.toLocaleString('en-BD')}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'rgba(16,185,129,0.08)', borderRadius: 8, fontWeight: 800, color: 'var(--success)' }}>
                  <span>✅ Allowable Tax Rebate (LOWER of Limit A, B, C)</span>
                  <span>৳{fmt(calculatedTax.rebate)}</span>
                </div>
              </div>

              {/* Impact summary */}
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1, padding: 14, background: 'rgba(0,51,102,0.04)', border: '1px solid rgba(0,51,102,0.12)', borderRadius: 10, textAlign: 'center' }}>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary-color)' }}>৳{fmt(calculatedTax.netTax)}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>Annual Tax (After Rebate)</div>
                </div>
                <div style={{ flex: 1, padding: 14, background: 'rgba(16,185,129,0.04)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: 10, textAlign: 'center' }}>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--success)' }}>৳{fmt(calculatedTax.monthlyTaxDeduction)}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>Monthly TDS Deduction</div>
                </div>
              </div>

              {/* Deadline notice */}
              <div style={{ padding: 14, background: 'rgba(245,158,11,0.05)', border: '1px dashed rgba(245,158,11,0.35)', borderRadius: 10, fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                ⏰ <strong>Submission Deadline:</strong> Supporting certificates and challans must be submitted to the Accounts Office by <strong>31 May</strong> to avoid double TDS in the June payroll run.
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══ TAB: Certificates ══════════════════════════════════════════════ */}
      {activeTab === 'certificates' && (
        <div className="card tm-cert-card">
          <div className="tm-cert-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="var(--primary-color)" strokeWidth="1.5" style={{ width: 40, height: 40 }}>
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
              <polyline points="14 2 14 8 20 8" />
              <path d="m9 15 2 2 4-4" />
            </svg>
          </div>

          <div className="tm-nbr-badge">
            🇧🇩 National Board of Revenue — Section 139 TDS Certificate (Income Tax Act, 2023 & Finance Act 2026)
          </div>

          <h3 style={{ color: 'var(--primary-color)', fontSize: '1.1rem' }}>Employee Salary & TDS Clearance Certificate</h3>

          {emp && calculatedTax ? (
            <>
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12,
                padding: 18, background: 'rgba(0,0,0,0.02)', border: '1px solid var(--border-color)',
                borderRadius: 10, textAlign: 'left', width: '100%', maxWidth: 680, fontSize: '0.82rem'
              }}>
                <div><span style={{ color: 'var(--text-muted)' }}>Employee Name:</span> <strong>{emp.fullNameEnglish}</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>Employee Code:</span> <strong>{emp.employeeCode}</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>12-Digit e-TIN:</span> <strong>{decl.tin || emp.tin || '—'}</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>Circle / Zone:</span> <strong>{decl.taxCircle || emp.taxCircle || '—'} / {decl.taxZone || emp.taxZone || '—'}</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>Taxpayer Category:</span> <strong>{calculatedTax.categoryLabel}</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>Active Tax-Free Limit:</span> <strong>৳{calculatedTax.taxFreeThreshold.toLocaleString('en-BD')}</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>Annual Gross Salary:</span> <strong>৳{fmt(calculatedTax.annualGross)}</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>Allowance Exemption:</span> <strong>(৳{fmt(calculatedTax.allowanceExemption)})</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>Total Taxable Income:</span> <strong>৳{fmt(calculatedTax.taxableIncome)}</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>Gross Slab Tax:</span> <strong>৳{fmt(calculatedTax.grossTax)}</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>Allowable Investment:</span> <strong>৳{fmt(calculatedTax.allowableTotalInvestment)} (Declared: ৳{fmt(calculatedTax.actualTotalInvestment)})</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>3-Limit Tax Rebate:</span> <strong style={{ color: 'var(--success)' }}>(৳{fmt(calculatedTax.rebate)})</strong></div>
                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 8 }}>
                  <span style={{ color: 'var(--text-muted)' }}>Net Annual TDS Deducted:</span> <strong style={{ color: 'var(--primary-color)', fontSize: '0.92rem' }}>৳{fmt(calculatedTax.netTax)}</strong>
                </div>
                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 8 }}>
                  <span style={{ color: 'var(--text-muted)' }}>Monthly Payroll TDS:</span> <strong style={{ color: 'var(--primary-color)', fontSize: '0.92rem' }}>৳{fmt(calculatedTax.monthlyTaxDeduction)} / mo</strong>
                </div>
              </div>

              <button className="btn btn-primary" onClick={handleDownloadCertificate}
                style={{ padding: '13px 36px', fontSize: '0.9rem' }}>
                ⬇ Download Section 139 PDF Certificate
              </button>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Includes Part A (Income, Exemption & 3-Limit Rebate) & Part B (Progressive Slab Breakdown) for Income Year {decl.taxYear || TAX_YEARS['2025-2026']}
              </p>
            </>
          ) : (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              Select an employee with complete salary data to generate their certificate.
            </p>
          )}
        </div>
      )}

      {/* ══ TAB: Return Tracking ═══════════════════════════════════════════ */}
      {activeTab === 'tracking' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Header stats row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 16, alignItems: 'center' }}>
            <div className="card" style={{ padding: '16px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary-color)' }}>{kpi.filedCount}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Returns Filed</div>
            </div>
            <div className="card" style={{ padding: '16px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--danger)' }}>{kpi.active - kpi.filedCount}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Pending</div>
            </div>
            <div className="card" style={{ padding: '16px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--success)' }}>{kpi.returnRate}%</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Compliance Rate</div>
            </div>

            {/* Progress ring */}
            <div className="card" style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div className="tm-ring-track">
                <svg className="tm-ring-svg" viewBox="0 0 36 36">
                  <circle className="tm-ring-bg" cx="18" cy="18" r="14.5" />
                  <circle
                    className="tm-ring-fg"
                    cx="18" cy="18" r="14.5"
                    strokeDasharray={`${(kpi.returnRate / 100) * 91} 91`}
                  />
                </svg>
                <div className="tm-ring-label">
                  <span className="tm-ring-pct">{kpi.returnRate}%</span>
                  <span className="tm-ring-sub">Filed</span>
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)' }}>Deadline</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>30 Nov 2026</div>
              </div>
            </div>
          </div>

          {returnMsg && <div className="tm-alert-success">{returnMsg}</div>}

          <div className="card">
            <h3 style={{ color: 'var(--primary-color)', marginBottom: 16 }}>📌 Tax Return Submission Register</h3>

            {/* Toolbar */}
            <div className="tm-track-toolbar">
              <input
                type="text"
                className="tm-track-search"
                placeholder="🔍  Search by name, code or TIN…"
                value={trackSearch}
                onChange={e => setTrackSearch(e.target.value)}
              />
              <select className="tm-track-filter" value={trackFilter} onChange={e => setTrackFilter(e.target.value)}>
                <option value="all">All Employees</option>
                <option value="filed">Filed Only</option>
                <option value="pending">Pending Only</option>
              </select>
              <button className="btn btn-outline btn-sm" onClick={handleExportAnnualTaxReport}>
                ⬇ Export Report
              </button>
            </div>

            <div className="table-container" style={{ padding: 0, border: 'none' }}>
              <table>
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Employee Name</th>
                    <th>TIN</th>
                    <th>Circle / Zone</th>
                    <th>Deadline</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {trackingList.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                        No employees match the filter.
                      </td>
                    </tr>
                  ) : trackingList.map(e => {
                    const isFiled = !!taxReturns[e.employeeCode];
                    return (
                      <tr key={e.employeeCode}>
                        <td style={{ fontWeight: 700 }}>{e.employeeCode}</td>
                        <td style={{ fontWeight: 600 }}>{e.fullNameEnglish}</td>
                        <td>{e.tin || <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                        <td style={{ fontSize: '0.8rem' }}>
                          {(investmentDeclarations[e.employeeCode]?.taxCircle || e.taxCircle || 'Circle 1')} /&nbsp;
                          {(investmentDeclarations[e.employeeCode]?.taxZone  || e.taxZone  || 'Zone 15')}
                        </td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>30 Nov 2026</td>
                        <td>
                          <span className={`badge ${isFiled ? 'badge-success' : 'badge-danger'}`}>
                            {isFiled ? '✓ Filed' : '⏳ Pending'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            className={`btn ${isFiled ? 'btn-outline' : 'btn-success'} btn-sm`}
                            onClick={() => handleReturnStatusToggle(e.employeeCode)}
                          >
                            {isFiled ? 'Mark Pending' : 'Mark Filed'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div style={{ marginTop: 12, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Showing {trackingList.length} of {kpi.active} active employees · Standard BD tax return deadline: November 30
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
