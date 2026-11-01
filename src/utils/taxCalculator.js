/**
 * Bangladesh Income Tax Act 2023 - Tax Calculator Engine
 * Supports FY 2024-2025 and FY 2025-2026.
 */

export const TAX_YEARS = {
  '2024-2025': '2024-2025', // AY 2025-2026
  '2025-2026': '2025-2026', // AY 2026-2027, 2027-2028
  '2026-2027': '2026-2027', // AY 2026-2027, 2027-2028
  '2028-2029': '2028-2029', // AY 2028-2029 & 2029-2030
  '2030-2031': '2030-2031'  // AY 2030-2031
};

export const ASSESSMENT_PERIODS = [
  {
    id: 'AY_2026_2028',
    label: 'AY 2026-2027, 2027-2028',
    periodText: 'Assessment Year 2026-2027, 2027-2028',
    taxYearKey: '2026-2027',
    salaryExemptionCap: 500000,
    thresholds: {
      general: 400000,
      female_senior: 450000,
      disabled_third: 500000,
      july_warrior_ff: 525000
    },
    slabs: [
      { limit: 300000, rate: 0.10, tier: 'Next BDT 300,000' },
      { limit: 400000, rate: 0.15, tier: 'Next BDT 400,000' },
      { limit: 500000, rate: 0.20, tier: 'Next BDT 500,000' },
      { limit: 2000000, rate: 0.25, tier: 'Next BDT 2,000,000' },
      { limit: Infinity, rate: 0.30, tier: 'On Balance' }
    ]
  },
  {
    id: 'AY_2028_2030',
    label: 'AY 2028-2029 & 2029-2030',
    periodText: 'Assessment Year 2028-2029 & 2029-2030',
    taxYearKey: '2028-2029',
    salaryExemptionCap: 500000,
    thresholds: {
      general: 425000,
      female_senior: 475000,
      disabled_third: 525000,
      july_warrior_ff: 550000
    },
    slabs: [
      { limit: 300000, rate: 0.10, tier: 'Next BDT 300,000' },
      { limit: 400000, rate: 0.15, tier: 'Next BDT 400,000' },
      { limit: 500000, rate: 0.20, tier: 'Next BDT 500,000' },
      { limit: 2000000, rate: 0.25, tier: 'Next BDT 2,000,000' },
      { limit: Infinity, rate: 0.30, tier: 'On Balance' }
    ]
  },
  {
    id: 'AY_2030_2031',
    label: 'AY 2030-2031',
    periodText: 'Assessment Year 2030-2031',
    taxYearKey: '2030-2031',
    salaryExemptionCap: 500000,
    thresholds: {
      general: 450000,
      female_senior: 500000,
      disabled_third: 550000,
      july_warrior_ff: 575000
    },
    slabs: [
      { limit: 300000, rate: 0.10, tier: 'Next BDT 300,000' },
      { limit: 400000, rate: 0.15, tier: 'Next BDT 400,000' },
      { limit: 500000, rate: 0.20, tier: 'Next BDT 500,000' },
      { limit: 2000000, rate: 0.25, tier: 'Next BDT 2,000,000' },
      { limit: Infinity, rate: 0.30, tier: 'On Balance' }
    ]
  },
  {
    id: 'AY_2025_2026',
    label: 'AY 2025-2026',
    periodText: 'Assessment Year 2025-2026',
    taxYearKey: '2024-2025',
    salaryExemptionCap: 450000,
    thresholds: {
      general: 350000,
      female_senior: 400000,
      disabled_third: 475000,
      july_warrior_ff: 500000
    },
    slabs: [
      { limit: 100000, rate: 0.05, tier: 'Next BDT 100,000' },
      { limit: 400000, rate: 0.10, tier: 'Next BDT 400,000' },
      { limit: 500000, rate: 0.15, tier: 'Next BDT 500,000' },
      { limit: 500000, rate: 0.20, tier: 'Next BDT 500,000' },
      { limit: 2000000, rate: 0.25, tier: 'Next BDT 2,000,000' },
      { limit: Infinity, rate: 0.30, tier: 'On Balance' }
    ]
  }
];

export const TAXPAYER_CATEGORIES = [
  { id: 'general', label: 'General Individual (Male, under 65)' },
  { id: 'female_senior', label: 'Women & Senior Citizens (65+ Years)' },
  { id: 'disabled_third', label: 'Physically Challenged / Third Gender' },
  { id: 'july_warrior_ff', label: 'Gazetted War-Wounded Freedom Fighters & July Warriors 2024' }
];

export const CORPORATE_TAX_RATES_2026 = [
  {
    category: 'Publicly Traded Company (>10% shares issued via IPO)',
    compliantRate: '20.0%',
    nonCompliantRate: '22.5%',
    notes: 'Subject to cashless transaction compliance under Income Tax Act, 2023 & Finance Act 2026'
  },
  {
    category: 'Publicly Traded Company (≤10% shares issued via IPO)',
    compliantRate: '22.5%',
    nonCompliantRate: '25.0%',
    notes: 'Requires all receipts & expenses > BDT 50,000 via banking channel'
  },
  {
    category: 'Non-Publicly Traded / Private Limited Company (e.g. ATCL)',
    compliantRate: '25.0%',
    nonCompliantRate: '27.5%',
    notes: '2.5% rebate if all income/receipts and single transactions >50k (annual >36L) are via bank transfer'
  },
  {
    category: 'One Person Company (OPC)',
    compliantRate: '20.0%',
    nonCompliantRate: '22.5%',
    notes: 'Special SME corporate tier under RJSC OPC registration'
  },
  {
    category: 'Publicly Traded Bank, Insurance & Financial Institution',
    compliantRate: '37.5%',
    nonCompliantRate: '37.5%',
    notes: 'Approved by Bangladesh Bank / IDRA'
  },
  {
    category: 'Non-Publicly Traded Bank, Insurance & Financial Institution',
    compliantRate: '40.0%',
    nonCompliantRate: '40.0%',
    notes: 'Standard financial sector corporate rate'
  },
  {
    category: 'Merchant Bank',
    compliantRate: '37.5%',
    nonCompliantRate: '37.5%',
    notes: 'BSEC regulated merchant banking entities'
  },
  {
    category: 'RMG / Export-Oriented Garments (LEED Certified Green Factory)',
    compliantRate: '10.0%',
    nonCompliantRate: '10.0%',
    notes: '12.0% for non-green RMG factories'
  },
  {
    category: 'Mobile Financial Services (MFS) & Telecom Operators',
    compliantRate: '40.0% / 45.0%',
    nonCompliantRate: '45.0%',
    notes: '40% if publicly listed (min 10% IPO), otherwise 45%'
  },
  {
    category: 'Cigarette, Bidi, Zarda & Tobacco Manufacturers',
    compliantRate: '45.0% + 2.5%',
    nonCompliantRate: '45.0% + 2.5%',
    notes: 'Includes 2.5% health surcharge'
  }
];

/**
 * Sector-Specific Allowable Investment Caps & 3-Limit Rebate Calculator
 *
 * Sector Caps:
 * - Deposit Pension Scheme (DPS): Max allowable BDT 1,20,000 per year
 * - Savings Certificates (Sanchayapatra) / Govt Securities: Max allowable BDT 5,00,000
 * - Recognized Provident Fund (RPF): 100% allowable (employee + employer)
 * - Mutual Funds, Unit Certificates, ETFs & Listed Stocks: 100% allowable
 * - Life Insurance Premium / Deferred Annuity / Other Approved Schemes: Allowable
 *
 * 3-Limit Formula:
 * - Limit A: 10% of total allowable investment
 * - Limit B: 3% of total taxable income (excluding exempt/reduced-rate income)
 * - Limit C: BDT 7,50,000 (statutory maximum rebate cap)
 * Allowable Rebate = MIN(Limit A, Limit B, Limit C)
 */
export const INVESTMENT_SECTOR_CAPS = {
  DPS_MAX: 120000,
  SANCHAYAPATRA_MAX: 500000,
  REBATE_STATUTORY_CAP: 750000,
  LIMIT_A_RATE: 0.10, // 10% of total allowable investment
  LIMIT_B_RATE: 0.03  // 3% of total taxable income
};

export function computeAllowableInvestmentAndRebate({
  taxableIncome = 0,
  taxFreeThreshold = 400000,
  investment = 0,
  investmentDetails = null
}) {
  let actualTotalInvestment = Math.max(0, Number(investment) || 0);
  let allowableTotalInvestment = actualTotalInvestment;
  let sectorBreakdown = null;

  if (investmentDetails && typeof investmentDetails === 'object') {
    const actualDps = Math.max(0, Number(investmentDetails.dpsContribution) || 0);
    const allowableDps = Math.min(actualDps, INVESTMENT_SECTOR_CAPS.DPS_MAX);

    const actualSanchaypatra = Math.max(0, Number(investmentDetails.sanchaypatra) || 0);
    const allowableSanchaypatra = Math.min(actualSanchaypatra, INVESTMENT_SECTOR_CAPS.SANCHAYAPATRA_MAX);

    const actualRpf = Math.max(0, Number(investmentDetails.providentFund) || 0);
    const allowableRpf = actualRpf; // Both employee & employer RPF contributions fully allowable

    const actualStocks = Math.max(0, Number(investmentDetails.stocks) || 0);
    const allowableStocks = actualStocks; // Listed stocks, mutual funds, ETFs, unit certificates fully allowable

    const actualLifeInsurance = Math.max(0, Number(investmentDetails.lifeInsurance || 0));
    const allowableLifeInsurance = actualLifeInsurance;

    const actualOther = Math.max(0, Number(investmentDetails.otherEligible) || 0);
    const allowableOther = actualOther;

    actualTotalInvestment = actualDps + actualSanchaypatra + actualRpf + actualStocks + actualLifeInsurance + actualOther;
    allowableTotalInvestment = allowableDps + allowableSanchaypatra + allowableRpf + allowableStocks + allowableLifeInsurance + allowableOther;

    sectorBreakdown = {
      dps: { actual: actualDps, allowable: allowableDps, cap: INVESTMENT_SECTOR_CAPS.DPS_MAX, ignored: Math.max(0, actualDps - allowableDps) },
      sanchaypatra: { actual: actualSanchaypatra, allowable: allowableSanchaypatra, cap: INVESTMENT_SECTOR_CAPS.SANCHAYAPATRA_MAX, ignored: Math.max(0, actualSanchaypatra - allowableSanchaypatra) },
      providentFund: { actual: actualRpf, allowable: allowableRpf, cap: null, ignored: 0 },
      stocks: { actual: actualStocks, allowable: allowableStocks, cap: null, ignored: 0 },
      lifeInsurance: { actual: actualLifeInsurance, allowable: allowableLifeInsurance, cap: null, ignored: 0 },
      otherEligible: { actual: actualOther, allowable: allowableOther, cap: null, ignored: 0 }
    };
  }

  // Limit A: 10% of total allowable investment
  const limitA = Math.round(allowableTotalInvestment * INVESTMENT_SECTOR_CAPS.LIMIT_A_RATE);
  // Limit B: 3% of total taxable income
  const limitB = Math.round(Math.max(0, Number(taxableIncome) || 0) * INVESTMENT_SECTOR_CAPS.LIMIT_B_RATE);
  // Limit C: Tk. 7,50,000 statutory maximum rebate cap
  const limitC = INVESTMENT_SECTOR_CAPS.REBATE_STATUTORY_CAP;

  let rebate = 0;
  if (taxableIncome > taxFreeThreshold && allowableTotalInvestment > 0) {
    rebate = Math.min(limitA, limitB, limitC);
  } else if (taxableIncome > taxFreeThreshold && allowableTotalInvestment === 0) {
    rebate = 0;
  }

  return {
    actualTotalInvestment,
    allowableTotalInvestment,
    ignoredInvestment: Math.max(0, actualTotalInvestment - allowableTotalInvestment),
    limitA,
    limitB,
    limitC,
    rebate,
    sectorBreakdown
  };
}
export function simulateProgressiveSlabTax({
  taxableIncome = 1200000,
  periodId = 'AY_2026_2028',
  categoryId = 'general',
  isParentOfDisabled = false,
  disabledChildrenCount = 1
}) {
  const period = ASSESSMENT_PERIODS.find(p => p.id === periodId) || ASSESSMENT_PERIODS[0];
  const baseThreshold = period.thresholds[categoryId] ?? period.thresholds.general;
  const parentAddition = isParentOfDisabled ? 50000 * Math.max(1, Number(disabledChildrenCount) || 1) : 0;
  const activeThreshold = baseThreshold + parentAddition;

  let remaining = Math.max(0, Number(taxableIncome) || 0);
  let grossTax = 0;
  const breakdown = [];

  // First tier: Tax-Free Threshold
  const inFreeTier = Math.min(remaining, activeThreshold);
  breakdown.push({
    tierTitle: `First BDT ${activeThreshold.toLocaleString('en-US')} (Tax-Free Threshold)`,
    tierLabel: `First BDT ${activeThreshold.toLocaleString('en-US')}`,
    rate: 0,
    baseThreshold,
    activeThreshold,
    periodLabel: period.label.replace(/^AY\s+/, ''),
    taxableInSlab: inFreeTier,
    tax: 0
  });
  remaining -= inFreeTier;

  for (const slab of period.slabs) {
    const inSlab = remaining > 0 ? Math.min(remaining, slab.limit) : 0;
    const slabTax = Math.round(inSlab * slab.rate);
    grossTax += slabTax;
    breakdown.push({
      tierTitle: slab.tier,
      tierLabel: slab.tier,
      rate: Math.round(slab.rate * 100),
      baseThreshold,
      activeThreshold,
      periodLabel: period.label.replace(/^AY\s+/, ''),
      taxableInSlab: inSlab,
      tax: slabTax
    });
    remaining = Math.max(0, remaining - inSlab);
  }

  const effectiveRate = taxableIncome > 0 ? ((grossTax / taxableIncome) * 100) : 0;

  return {
    period,
    baseThreshold,
    parentAddition,
    activeThreshold,
    taxableIncome: Math.max(0, Number(taxableIncome) || 0),
    grossTax,
    effectiveRate,
    breakdown
  };
}

export const REGIONS = {
  DHAKA_CHITTAGONG: 'Dhaka & Chittagong City Corporation',
  OTHER_CITY_CORP: 'Other City Corporation',
  OUTSIDE_CITY_CORP: 'Outside City Corporation'
};

/**
 * Maps a stored taxYear key (income-year key used in declarations) to its Assessment Period.
 */
export function getPeriodForTaxYear(taxYear) {
  const byKey = {
    '2024-2025': 'AY_2025_2026',
    '2025-2026': 'AY_2026_2028',
    '2026-2027': 'AY_2026_2028',
    '2027-2028': 'AY_2026_2028',
    '2028-2029': 'AY_2028_2030',
    '2029-2030': 'AY_2028_2030',
    '2030-2031': 'AY_2030_2031'
  };
  const id = byKey[taxYear] || 'AY_2026_2028';
  return ASSESSMENT_PERIODS.find(p => p.id === id) || ASSESSMENT_PERIODS[0];
}

export const REGION_MINIMUM_TAX = {
  DHAKA_CHITTAGONG: 5000,
  OTHER_CITY_CORP: 4000,
  OUTSIDE_CITY_CORP: 3000
};

/**
 * Calculates taxable income and progressive tax liability
 * 
 * @param {Object} params
 * @param {number} params.basicSalary - Annual Basic Salary
 * @param {number} params.allowances - Total Annual Allowances (House Rent, Medical, Conveyance, Mobile, etc.)
 * @param {number} params.bonuses - Total Annual Bonuses (Eid, Ramadan, Performance, etc.)
 * @param {string} params.gender - 'male' | 'female' | 'third_gender'
 * @param {number} params.age - Employee age
 * @param {boolean} params.isDisabled - Has disability
 * @param {boolean} params.isFreedomFighter - Is war-wounded freedom fighter
 * @param {number} params.investment - Total actual investments (DPS, Sanchaypatra, Stocks, etc.)
 * @param {string} params.region - REGIONS value
 * @param {string} params.taxYear - TAX_YEARS value
 * @returns {Object} detailed calculation breakdown
 */
export function calculateAgeFromDob(dobStr, defaultAge = 35) {
  if (!dobStr) return defaultAge;
  const dob = new Date(dobStr);
  if (isNaN(dob.getTime())) return defaultAge;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age > 0 ? age : defaultAge;
}

export function getAssessmentPeriodInfo(taxYear) {
  if (taxYear === TAX_YEARS['2030-2031']) {
    return { assessmentYear: '2030-2031', incomeYear: '2029-2030', actLabel: 'Income Tax Act, 2023 & Finance Act 2026' };
  }
  if (taxYear === TAX_YEARS['2028-2029']) {
    return { assessmentYear: '2028-2029 & 2029-2030', incomeYear: '2027-2028 / 2028-2029', actLabel: 'Income Tax Act, 2023 & Finance Act 2026' };
  }
  if (taxYear === TAX_YEARS['2024-2025']) {
    return { assessmentYear: '2025-2026', incomeYear: '2024-2025', actLabel: 'Income Tax Act, 2023' };
  }
  return { assessmentYear: '2026-2027, 2027-2028', incomeYear: '2025-2026 / 2026-2027', actLabel: 'Income Tax Act, 2023 & Finance Act 2026' };
}

export function calculateBangladeshTax({
  basicSalary = 0,
  allowances = 0,
  bonuses = 0,
  gender = 'male',
  age = 30,
  dob = null,
  taxpayerCategory = null,
  isDisabled = false,
  isFreedomFighter = false,
  isParentOfDisabled = false,
  disabledChildrenCount = 1,
  investment = 0,
  investmentDetails = null,
  region = REGIONS.DHAKA_CHITTAGONG,
  taxYear = TAX_YEARS['2025-2026']
}) {
  const annualGross = Math.max(0, (Number(basicSalary) || 0) + (Number(allowances) || 0) + (Number(bonuses) || 0));
  const computedAge = dob ? calculateAgeFromDob(dob, age) : age;

  // Single source of truth: the same period table that powers the Slab Explorer
  const period = getPeriodForTaxYear(taxYear);

  // Salary exemption under the Income Tax Act 2023:
  // Lower of 1/3rd of total annual salary income OR the statutory cap
  // (BDT 4,50,000 for AY 2025-26; BDT 5,00,000 from AY 2026-27 per Finance Ordinance 2025)
  const maxExemptionCap = period.salaryExemptionCap;
  const allowanceExemption = Math.round(Math.min(maxExemptionCap, annualGross / 3));

  // Taxable salary income
  const taxableIncome = Math.max(0, annualGross - allowanceExemption);

  // Resolve effective taxpayer category
  let resolvedCategory = taxpayerCategory;
  if (!resolvedCategory || resolvedCategory === 'auto') {
    if (isFreedomFighter) resolvedCategory = 'july_warrior_ff';
    else if (isDisabled || gender === 'third_gender') resolvedCategory = 'disabled_third';
    else if (gender === 'female' || computedAge >= 65) resolvedCategory = 'female_senior';
    else resolvedCategory = 'general';
  }

  const categoryObj = TAXPAYER_CATEGORIES.find(c => c.id === resolvedCategory) || TAXPAYER_CATEGORIES[0];

  const baseThreshold = period.thresholds[resolvedCategory] ?? period.thresholds.general;
  // Parent/guardian of a person with disability: +BDT 50,000 per such child
  const parentAddition = isParentOfDisabled ? 50000 * Math.max(1, Number(disabledChildrenCount) || 1) : 0;
  const taxFreeThreshold = baseThreshold + parentAddition;

  // Calculate gross tax liability based on progressive slabs
  let remainingTaxable = taxableIncome;
  let grossTax = 0;
  const slabsApplied = [];

  // 1. Tax-Free Slab
  const slab1Amount = Math.min(remainingTaxable, taxFreeThreshold);
  slabsApplied.push({ slabName: 'Tax-Free Limit', range: `First ${taxFreeThreshold.toLocaleString()} BDT`, incomeInSlab: slab1Amount, rate: 0, tax: 0 });
  remainingTaxable -= slab1Amount;

  for (const slab of period.slabs) {
    if (remainingTaxable <= 0) break;
    const slabAmount = Math.min(remainingTaxable, slab.limit);
    const slabTax = Math.round(slabAmount * slab.rate);
    grossTax += slabTax;
    slabsApplied.push({
      slabName: slab.tier,
      range: slab.tier,
      incomeInSlab: slabAmount,
      rate: Math.round(slab.rate * 100),
      tax: slabTax
    });
    remainingTaxable -= slabAmount;
  }

  // Investment Tax Rebate: The 3-Limit Formula
  // Limit A: 10% of total allowable investment (after sector-specific caps: DPS max 1.2L, Sanchayapatra max 5.0L)
  // Limit B: 3% of total taxable income
  // Limit C: Tk. 7,50,000 (statutory maximum rebate cap)
  const rebateEval = computeAllowableInvestmentAndRebate({
    taxableIncome,
    taxFreeThreshold,
    investment,
    investmentDetails
  });

  const rebate = rebateEval.rebate;

  // Net tax before minimum tax constraint
  let netTax = Math.max(0, grossTax - rebate);

  // Apply Minimum Tax if there is any tax liability
  let isMinimumTaxApplied = false;
  let minTaxAmount = 0;

  if (taxableIncome > taxFreeThreshold) {
    if (region === REGIONS.DHAKA_CHITTAGONG) {
      minTaxAmount = REGION_MINIMUM_TAX.DHAKA_CHITTAGONG;
    } else if (region === REGIONS.OTHER_CITY_CORP) {
      minTaxAmount = REGION_MINIMUM_TAX.OTHER_CITY_CORP;
    } else {
      minTaxAmount = REGION_MINIMUM_TAX.OUTSIDE_CITY_CORP;
    }

    if (netTax < minTaxAmount) {
      netTax = minTaxAmount;
      isMinimumTaxApplied = true;
    }
  } else {
    netTax = 0; // If taxable income is below tax-free threshold, no tax is due
  }

  netTax = Math.round(netTax);
  const monthlyTaxDeduction = Math.round(netTax / 12);

  return {
    annualGross,
    allowanceExemption,
    salaryExemptionCap: maxExemptionCap,
    assessmentPeriodLabel: period.label,
    taxableIncome,
    baseThreshold,
    parentAddition,
    taxFreeThreshold,
    resolvedCategory,
    categoryLabel: categoryObj.label,
    computedAge,
    grossTax,
    rebate,
    netTax,
    monthlyTaxDeduction,
    minTaxAmount,
    isMinimumTaxApplied,
    slabsApplied,
    actualTotalInvestment: rebateEval.actualTotalInvestment,
    allowableTotalInvestment: rebateEval.allowableTotalInvestment,
    ignoredInvestment: rebateEval.ignoredInvestment,
    sectorBreakdown: rebateEval.sectorBreakdown,
    rebateBreakdown: {
      limitA_tenPercentOfAllowableInvestment: rebateEval.limitA,
      limitB_threePercentOfTaxableIncome: rebateEval.limitB,
      limitC_statutoryCap: rebateEval.limitC,
      // Keep backwards-compatible keys for any existing consumers
      threePercentOfIncome: rebateEval.limitB,
      tenPercentOfInvestment: rebateEval.limitA,
      fifteenPercentOfInvestment: rebateEval.limitA,
      cap: rebateEval.limitC
    }
  };
}
