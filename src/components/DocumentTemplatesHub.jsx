import React, { useContext, useState, useMemo, useRef } from 'react';
import { HRMSContext } from '../context/HRMSContext';
import { TEMPLATE_CATEGORIES } from '../data/templateSeeds';
import {
  PLACEHOLDER_GROUPS,
  buildMonthlyPayrollDataset,
  renderTemplateHtml,
  printRenderedDocument,
  downloadRenderedWordDoc,
  copyRenderedToClipboard,
  formatBDT
} from '../utils/templateEngine';
import { exportToExcel } from '../utils/excelExporter';

export default function DocumentTemplatesHub({ showNotice }) {
  const {
    employees,
    payrollRuns,
    investmentDeclarations,
    companyInfo,
    documentTemplates,
    saveDocumentTemplate,
    duplicateDocumentTemplate,
    deleteDocumentTemplate,
    toggleFeatureDocumentTemplate,
    resetSystemDocumentTemplate,
    importDocumentTemplates,
    attachGeneratedDocToEmployee
  } = useContext(HRMSContext);

  // Sub-views: 'library' | 'editor' | 'generator'
  const [subView, setSubView] = useState('library');

  // --- Library State ---
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [onlyFeatured, setOnlyFeatured] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [pasteForm, setPasteForm] = useState({
    name: '',
    category: 'Custom',
    type: 'letter',
    isFeatured: true,
    rawText: ''
  });
  const importInputRef = useRef(null);

  // --- Editor State ---
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [editorMode, setEditorMode] = useState('source'); // 'source' | 'visual'
  const [previewEmpCode, setPreviewEmpCode] = useState(() => employees?.[0]?.employeeCode || '');
  const [newCustomField, setNewCustomField] = useState({ key: '', label: '', defaultValue: '' });
  const bodyTextareaRef = useRef(null);
  const visualEditorRef = useRef(null);

  // --- Generator State ---
  const [selectedTemplateId, setSelectedTemplateId] = useState('tpl-appointment-letter');
  const [genMode, setGenMode] = useState('single'); // 'single' | 'bulk'
  const [genEmpCode, setGenEmpCode] = useState(() => employees?.[0]?.employeeCode || '');
  const [bulkSelectedCodes, setBulkSelectedCodes] = useState([]);
  const [genMonthKey, setGenMonthKey] = useState(() => {
    if (payrollRuns?.length > 0) return payrollRuns[0].month;
    return new Date().toISOString().slice(0, 7);
  });
  const [genBonusType, setGenBonusType] = useState('None');
  const [genBonusPercent, setGenBonusPercent] = useState(100);
  const [genBankFilter, setGenBankFilter] = useState('ALL');
  const [genCompanyBankIdx, setGenCompanyBankIdx] = useState(0);
  const [genRefNo, setGenRefNo] = useState(() => `ATCL/HR/${new Date().getFullYear()}/${String(Math.floor(100 + Math.random() * 900))}`);
  const [genSignatory, setGenSignatory] = useState({ name: '', designation: '' });
  const [genCustomInputs, setGenCustomInputs] = useState({});

  const notify = (type, msg) => {
    if (showNotice) showNotice(type, msg);
  };

  const activeEmployees = useMemo(
    () => (employees || []).filter(e => e.status === 'Active'),
    [employees]
  );

  const distinctEmployeeBanks = useMemo(() => {
    const set = new Set();
    (employees || []).forEach(e => {
      if (e.bankName && e.bankName.trim()) set.add(e.bankName.trim());
    });
    return Array.from(set);
  }, [employees]);

  // Filtered Templates for Library
  const filteredTemplates = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return (documentTemplates || [])
      .filter(t => {
        if (onlyFeatured && !t.isFeatured) return false;
        if (selectedCategory !== 'All' && t.category !== selectedCategory) return false;
        if (q) {
          const matchName = t.name?.toLowerCase().includes(q);
          const matchDesc = t.description?.toLowerCase().includes(q);
          const matchCat = t.category?.toLowerCase().includes(q);
          if (!matchName && !matchDesc && !matchCat) return false;
        }
        return true;
      })
      .sort((a, b) => Number(!!b.isFeatured) - Number(!!a.isFeatured));
  }, [documentTemplates, selectedCategory, onlyFeatured, searchQuery]);

  const featuredTemplates = useMemo(
    () => (documentTemplates || []).filter(t => t.isFeatured),
    [documentTemplates]
  );

  const activeGeneratorTemplate = useMemo(
    () => (documentTemplates || []).find(t => t.id === selectedTemplateId) || documentTemplates?.[0],
    [documentTemplates, selectedTemplateId]
  );

  // Open Generator for a specific template
  const handleOpenGenerator = (tpl) => {
    setSelectedTemplateId(tpl.id);
    setGenSignatory({
      name: tpl.signatory?.name || companyInfo?.keyPersonnel?.mdName || 'Managing Director',
      designation: tpl.signatory?.designation || 'Managing Director, ATCL'
    });
    const defaults = {};
    (tpl.customFields || []).forEach(cf => {
      defaults[cf.key] = cf.defaultValue || '';
    });
    setGenCustomInputs(defaults);
    setSubView('generator');
  };

  // Open Editor for an existing or new template
  const handleOpenEditor = (tpl = null) => {
    if (tpl) {
      setEditingTemplate({
        ...tpl,
        signatory: { ...(tpl.signatory || { name: 'Managing Director', designation: 'Managing Director, ATCL' }) },
        customFields: Array.isArray(tpl.customFields) ? [...tpl.customFields] : []
      });
    } else {
      setEditingTemplate({
        id: `tpl-custom-${Date.now()}`,
        name: 'New Custom HR Document Template',
        category: 'Custom',
        type: 'letter',
        description: 'Custom HR letter or monthly sheet template with dynamic placeholders.',
        isSystem: false,
        isFeatured: true,
        useLetterhead: true,
        pageSize: 'A4',
        signatory: { name: 'Managing Director', designation: 'Managing Director, ATCL' },
        customFields: [
          { key: 'customNote', label: 'Special Note / Subject Detail', defaultValue: '' }
        ],
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
  Subject: Official HR Communication — {{company.shortName}}
</p>

<p>Dear <strong>{{employee.fullNameEnglish}}</strong>,</p>

<p style="margin-top:10px;text-align:justify;">
  Write or paste your letter content here. Use the Placeholder Picker on the right to insert dynamic fields like Gross Salary (<strong>BDT {{salary.gross}}</strong> — <em>{{salary.grossInWords}}</em>), Joining Date (<strong>{{employee.joiningDate}}</strong>), or Bank Account (<strong>{{employee.bankName}} - {{employee.bankAccountNo}}</strong>).
</p>

<div style="margin-top:48px;">
  <div style="border-top:1px solid #0f172a;width:220px;padding-top:6px;font-weight:700;">{{signatory.name}}</div>
  <div style="font-size:9pt;color:#475569;">{{signatory.designation}}</div>
  <div style="font-size:9pt;color:#475569;">{{company.name}}</div>
</div>`
      });
    }
    setEditorMode('source');
    setSubView('editor');
  };

  // Convert pasted plain text into clean HTML paragraphs and open in Editor or save directly
  const handleCreateFromPaste = () => {
    if (!pasteForm.name.trim() || !pasteForm.rawText.trim()) {
      notify('error', 'Please enter a Template Name and paste your template text.');
      return;
    }
    const paragraphs = pasteForm.rawText
      .split(/\n\s*\n/)
      .map(block => `<p style="margin-bottom:12px;text-align:justify;">${block.trim().replace(/\n/g, '<br/>')}</p>`)
      .join('\n');

    const created = saveDocumentTemplate({
      name: pasteForm.name.trim(),
      category: pasteForm.category,
      type: pasteForm.type,
      isFeatured: pasteForm.isFeatured,
      description: 'Created via Quick Copy-Paste Template Builder',
      useLetterhead: true,
      pageSize: pasteForm.type === 'sheet' ? 'A4-Landscape' : 'A4',
      signatory: { name: 'Managing Director', designation: 'Managing Director, ATCL' },
      customFields: [],
      body: `<div style="display:flex;justify-content:space-between;margin-bottom:16px;font-size:10pt;">
  <div><strong>Ref:</strong> {{refNo}}</div>
  <div><strong>Date:</strong> {{today}}</div>
</div>\n${paragraphs}`
    });

    setShowPasteModal(false);
    setPasteForm({ name: '', category: 'Custom', type: 'letter', isFeatured: true, rawText: '' });
    notify('success', `Created template "${created.name}" from pasted content.`);
    handleOpenEditor(created);
  };

  // Quick Copy a template from the Library card (rendered with first active employee / latest month)
  const handleQuickCopyTemplate = async (tpl) => {
    const sampleEmp = activeEmployees[0] || employees?.[0] || {};
    const samplePayroll = buildMonthlyPayrollDataset({
      monthKey: genMonthKey,
      payrollRuns,
      employees,
      investmentDeclarations
    });
    const rendered = renderTemplateHtml({
      template: tpl,
      employee: sampleEmp,
      companyInfo,
      payrollDataset: samplePayroll,
      investmentDeclarations,
      refNo: genRefNo
    });
    await copyRenderedToClipboard(rendered);
    notify('success', `Copied "${tpl.name}" to clipboard! You can now paste (Ctrl+V) into Word, Gmail, or Google Docs.`);
  };

  // Insert placeholder token into the Template Editor
  const handleInsertPlaceholder = (token) => {
    if (!editingTemplate) return;
    const insertText = token === '{{#rows}} ... {{/rows}}'
      ? `{{#rows}}\n<tr>\n  <td>{{row.sl}}</td>\n  <td>{{row.employeeCode}}</td>\n  <td>{{row.name}}</td>\n  <td>{{row.netSalary}}</td>\n</tr>\n{{/rows}}`
      : token;

    if (editorMode === 'source' && bodyTextareaRef.current) {
      const el = bodyTextareaRef.current;
      const start = el.selectionStart || 0;
      const end = el.selectionEnd || 0;
      const current = editingTemplate.body || '';
      const updated = current.slice(0, start) + insertText + current.slice(end);
      setEditingTemplate(prev => ({ ...prev, body: updated }));
      setTimeout(() => {
        el.focus();
        el.setSelectionRange(start + insertText.length, start + insertText.length);
      }, 20);
    } else {
      setEditingTemplate(prev => ({ ...prev, body: `${prev.body || ''}\n${insertText}` }));
    }
    notify('success', `Inserted ${token} into template.`);
  };

  const handleSaveEditorTemplate = () => {
    if (!editingTemplate?.name?.trim()) {
      notify('error', 'Please provide a Template Name.');
      return;
    }
    const saved = saveDocumentTemplate(editingTemplate);
    notify('success', `Saved template "${saved.name}" (v${saved.version}).`);
    setSubView('library');
  };

  // Export all templates as JSON
  const handleExportAllTemplatesJson = () => {
    const blob = new Blob([JSON.stringify(documentTemplates, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ATCL_HR_Document_Templates_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    notify('success', `Exported ${documentTemplates.length} templates to JSON.`);
  };

  const handleImportTemplatesJson = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsed = JSON.parse(evt.target.result);
        const list = Array.isArray(parsed) ? parsed : [parsed];
        const count = importDocumentTemplates(list);
        notify('success', `Imported ${count} template(s) into the Template Library.`);
      } catch (err) {
        notify('error', `Failed to import templates JSON: ${err.message}`);
      } finally {
        if (importInputRef.current) importInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  // --- Computed Live Payroll Dataset & Rendered HTML for Generator ---
  const livePayrollDataset = useMemo(
    () =>
      buildMonthlyPayrollDataset({
        monthKey: genMonthKey,
        payrollRuns,
        employees,
        investmentDeclarations,
        bonusType: genBonusType,
        bonusPercent: genBonusPercent,
        bankFilter: genBankFilter
      }),
    [genMonthKey, payrollRuns, employees, investmentDeclarations, genBonusType, genBonusPercent, genBankFilter]
  );

  const selectedGenEmployee = useMemo(
    () => (employees || []).find(e => e.employeeCode === genEmpCode) || employees?.[0] || {},
    [employees, genEmpCode]
  );

  const selectedCompanyBank = useMemo(() => {
    const banks = companyInfo?.bankAccounts || [];
    return banks[genCompanyBankIdx] || banks[0] || null;
  }, [companyInfo, genCompanyBankIdx]);

  const renderedGeneratorPages = useMemo(() => {
    if (!activeGeneratorTemplate) return [''];
    if (activeGeneratorTemplate.type === 'sheet') {
      return [
        renderTemplateHtml({
          template: activeGeneratorTemplate,
          employee: selectedGenEmployee,
          companyInfo,
          payrollDataset: livePayrollDataset,
          investmentDeclarations,
          customInputs: genCustomInputs,
          refNo: genRefNo,
          signatoryOverride: genSignatory,
          companyBankAccount: selectedCompanyBank,
          bankFilter: genBankFilter
        })
      ];
    }

    if (genMode === 'bulk') {
      const targetCodes = bulkSelectedCodes.length > 0 ? bulkSelectedCodes : [selectedGenEmployee.employeeCode];
      return targetCodes.map((code, idx) => {
        const empObj = (employees || []).find(e => e.employeeCode === code) || selectedGenEmployee;
        return renderTemplateHtml({
          template: activeGeneratorTemplate,
          employee: empObj,
          companyInfo,
          payrollDataset: livePayrollDataset,
          investmentDeclarations,
          customInputs: genCustomInputs,
          refNo: `${genRefNo}-${String(idx + 1).padStart(2, '0')}`,
          signatoryOverride: genSignatory,
          companyBankAccount: selectedCompanyBank,
          bankFilter: genBankFilter
        });
      });
    }

    return [
      renderTemplateHtml({
        template: activeGeneratorTemplate,
        employee: selectedGenEmployee,
        companyInfo,
        payrollDataset: livePayrollDataset,
        investmentDeclarations,
        customInputs: genCustomInputs,
        refNo: genRefNo,
        signatoryOverride: genSignatory,
        companyBankAccount: selectedCompanyBank,
        bankFilter: genBankFilter
      })
    ];
  }, [
    activeGeneratorTemplate,
    selectedGenEmployee,
    companyInfo,
    livePayrollDataset,
    investmentDeclarations,
    genCustomInputs,
    genRefNo,
    genSignatory,
    selectedCompanyBank,
    genBankFilter,
    genMode,
    bulkSelectedCodes,
    employees
  ]);

  // Export Monthly Sheet to Excel
  const handleExportMonthlySheetExcel = () => {
    const rows = livePayrollDataset.rows.map((r, idx) => ({
      'SL': idx + 1,
      'Employee Code': r.employeeCode,
      'Employee Name': r.name,
      'Designation': r.designation,
      'Department': r.department,
      'Bank Name': r.bankName,
      'Bank Account No': r.accountNo,
      'Basic Salary (BDT)': r.basicSalary,
      'House Rent (BDT)': r.houseRent,
      'Medical Allowance (BDT)': r.medicalAllowance,
      'Conveyance (BDT)': r.conveyanceAllowance,
      'Mobile Allowance (BDT)': r.mobileAllowance,
      'Festival Bonus (BDT)': r.bonusPay,
      'Gross Payable (BDT)': r.grossSalary,
      'Income Tax TDS (BDT)': r.taxDeduction,
      'LWP / Absence Deduction (BDT)': r.unpaidLeaveDeduction,
      'Net Payable Salary (BDT)': r.netSalary
    }));
    exportToExcel(
      rows,
      `ATCL_${activeGeneratorTemplate?.id === 'tpl-bank-salary-confirmation-sheet' ? 'Bank_Transfer_Advice' : 'Salary_Approval_Sheet'}_${genMonthKey}`,
      'PayrollSheet'
    );
    notify('success', `Exported ${rows.length} employee rows for ${livePayrollDataset.monthLabel} to Excel.`);
  };

  // Save generated document record to employee profile
  const handleSaveToEmployeeDossier = () => {
    const codes = genMode === 'bulk' && bulkSelectedCodes.length > 0 ? bulkSelectedCodes : [selectedGenEmployee.employeeCode];
    codes.forEach(code => {
      attachGeneratedDocToEmployee(code, {
        name: `${activeGeneratorTemplate.name} (${genRefNo}).pdf`,
        type: activeGeneratorTemplate.category || 'HR Letter',
        size: '145 KB',
        uploadDate: new Date().toISOString().split('T')[0],
        refNo: genRefNo
      });
    });
    notify('success', `Saved "${activeGeneratorTemplate.name}" to ${codes.length} employee dossier(s).`);
  };

  // Preview HTML for the Editor
  const editorPreviewHtml = useMemo(() => {
    if (!editingTemplate) return '';
    const emp = (employees || []).find(e => e.employeeCode === previewEmpCode) || employees?.[0] || {};
    return renderTemplateHtml({
      template: editingTemplate,
      employee: emp,
      companyInfo,
      payrollDataset: livePayrollDataset,
      investmentDeclarations,
      refNo: 'ATCL/HR/2026/PREVIEW'
    });
  }, [editingTemplate, previewEmpCode, employees, companyInfo, livePayrollDataset, investmentDeclarations]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      {/* Top Mode Switcher Bar */}
      <div className="card" style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 14,
        background: 'linear-gradient(135deg, rgba(10, 61, 122, 0.08), rgba(6, 182, 212, 0.08))',
        border: '1px solid rgba(6, 182, 212, 0.28)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="badge badge-info">HR Document & Sheet Center</span>
            <h3 style={{ margin: 0, fontSize: '1.08rem', fontWeight: 800, color: 'var(--primary-color)' }}>
              Corporate Letters, Monthly Salary Approval & Bank Confirmation Templates
            </h3>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Create, customize, emphasize (⭐), copy-paste, and generate Joining Letters, Appointment Letters, Resignation Letters, Monthly Salary Approval Sheets, and Bank Salary Transfer Advice Sheets.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            className={`btn btn-sm ${subView === 'library' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setSubView('library')}
          >
            📚 Template Library ({documentTemplates?.length || 0})
          </button>
          <button
            className={`btn btn-sm ${subView === 'generator' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => handleOpenGenerator(activeGeneratorTemplate)}
          >
            ⚡ Generate Letter / Monthly Sheet
          </button>
          <button
            className={`btn btn-sm ${subView === 'editor' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => handleOpenEditor(editingTemplate || activeGeneratorTemplate)}
          >
            ✏️ Template Studio & Symbol Editor
          </button>
        </div>
      </div>

      {/* =====================================================================
          VIEW 1: TEMPLATE LIBRARY
         ===================================================================== */}
      {subView === 'library' && (
        <>
          {/* Emphasized / Featured Templates Highlight Strip */}
          {featuredTemplates.length > 0 && (
            <div className="card" style={{
              border: '2px solid rgba(245, 158, 11, 0.45)',
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.07), rgba(6, 182, 212, 0.05))'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: '1.2rem' }}>⭐</span>
                  <div>
                    <h4 style={{ margin: 0, color: 'var(--primary-color)', fontSize: '0.96rem' }}>
                      Emphasized & Priority HR Templates ({featuredTemplates.length})
                    </h4>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      Pinned for rapid 1-click generation and copy-pasting (Joining, Appointment, Resignation, Monthly Salary Approval & Bank Confirmation)
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
                {featuredTemplates.map(tpl => (
                  <div
                    key={`feat-${tpl.id}`}
                    style={{
                      padding: 14,
                      borderRadius: 12,
                      background: 'var(--bg-card)',
                      border: '1.5px solid rgba(245, 158, 11, 0.4)',
                      boxShadow: '0 4px 14px -4px rgba(245, 158, 11, 0.15)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: 10
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                        <span className={`badge ${tpl.type === 'sheet' ? 'badge-info' : 'badge-success'}`}>
                          {tpl.type === 'sheet' ? '📊 Monthly Sheet' : `📄 ${tpl.category}`}
                        </span>
                        <button
                          onClick={() => toggleFeatureDocumentTemplate(tpl.id)}
                          title="Click to un-emphasize"
                          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem' }}
                        >
                          ⭐
                        </button>
                      </div>
                      <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-primary)', marginTop: 6 }}>
                        {tpl.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                        {tpl.description}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', paddingTop: 6, borderTop: '1px solid var(--border-color)' }}>
                      <button className="btn btn-primary btn-sm" onClick={() => handleOpenGenerator(tpl)}>
                        ⚡ Generate
                      </button>
                      <button className="btn btn-outline btn-sm" onClick={() => handleQuickCopyTemplate(tpl)}>
                        📋 Copy
                      </button>
                      <button className="btn btn-outline btn-sm" onClick={() => handleOpenEditor(tpl)}>
                        ✏️ Edit
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Library Filter & Action Toolbar */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {TEMPLATE_CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    className={`btn btn-sm ${selectedCategory === cat && !onlyFeatured ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => {
                      setSelectedCategory(cat);
                      setOnlyFeatured(false);
                    }}
                  >
                    {cat}
                  </button>
                ))}
                <button
                  className={`btn btn-sm ${onlyFeatured ? 'btn-secondary' : 'btn-outline'}`}
                  onClick={() => setOnlyFeatured(prev => !prev)}
                >
                  ⭐ Emphasized Only
                </button>
              </div>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button className="btn btn-primary btn-sm" onClick={() => handleOpenEditor(null)}>
                  + Create New Template
                </button>
                <button className="btn btn-secondary btn-sm" onClick={() => setShowPasteModal(true)}>
                  📋 Paste & Create Template
                </button>
                <button className="btn btn-outline btn-sm" onClick={handleExportAllTemplatesJson}>
                  ⬇ Export JSON
                </button>
                <button className="btn btn-outline btn-sm" onClick={() => importInputRef.current?.click()}>
                  ⬆ Import JSON
                </button>
                <input
                  ref={importInputRef}
                  type="file"
                  accept=".json"
                  style={{ display: 'none' }}
                  onChange={handleImportTemplatesJson}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <input
                type="text"
                placeholder="Search templates by title, category, or keyword (e.g., Joining, Appointment, Resignation, Salary Approval, Bank Advice)..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ flex: 1 }}
              />
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                Showing {filteredTemplates.length} of {documentTemplates?.length || 0} templates
              </span>
            </div>
          </div>

          {/* All Templates Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 18 }}>
            {filteredTemplates.map(tpl => (
              <div
                key={tpl.id}
                className="card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: 12,
                  border: tpl.isFeatured ? '1.5px solid rgba(245, 158, 11, 0.45)' : '1px solid var(--border-color)'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                      <span className={`badge ${tpl.type === 'sheet' ? 'badge-info' : 'badge-success'}`}>
                        {tpl.type === 'sheet' ? '📊 Monthly Sheet' : '📄 Letter'}
                      </span>
                      <span className="badge badge-warning">{tpl.category}</span>
                      {tpl.isFeatured && (
                        <span className="badge" style={{ background: 'rgba(245,158,11,0.18)', color: '#d97706' }}>
                          ⭐ Emphasized
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        toggleFeatureDocumentTemplate(tpl.id);
                        notify('success', `${tpl.isFeatured ? 'Removed emphasis from' : 'Emphasized'} "${tpl.name}".`);
                      }}
                      title={tpl.isFeatured ? 'Remove Emphasis' : 'Emphasize / Feature this Template'}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '1.1rem',
                        opacity: tpl.isFeatured ? 1 : 0.35
                      }}
                    >
                      ⭐
                    </button>
                  </div>

                  <h4 style={{ margin: '10px 0 6px', fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {tpl.name}
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {tpl.description}
                  </p>
                </div>

                <div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '0.7rem',
                    color: 'var(--text-muted)',
                    paddingBottom: 8,
                    marginBottom: 8,
                    borderBottom: '1px solid var(--border-color)'
                  }}>
                    <span>Page: {tpl.pageSize || 'A4'} · v{tpl.version || 1}</span>
                    <span>{tpl.isSystem ? 'Built-in Template' : 'Custom Template'}</span>
                  </div>

                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <button className="btn btn-primary btn-sm" onClick={() => handleOpenGenerator(tpl)}>
                      ⚡ Generate
                    </button>
                    <button className="btn btn-outline btn-sm" onClick={() => handleOpenEditor(tpl)}>
                      ✏️ Edit
                    </button>
                    <button className="btn btn-outline btn-sm" onClick={() => handleQuickCopyTemplate(tpl)}>
                      📋 Copy
                    </button>
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => {
                        const copy = duplicateDocumentTemplate(tpl.id);
                        if (copy) notify('success', `Duplicated as "${copy.name}".`);
                      }}
                    >
                      📄 Duplicate
                    </button>
                    {tpl.isSystem ? (
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => {
                          if (window.confirm(`Reset "${tpl.name}" back to its factory seed layout?`)) {
                            resetSystemDocumentTemplate(tpl.id);
                            notify('success', `Reset "${tpl.name}" to default.`);
                          }
                        }}
                      >
                        ↺ Reset
                      </button>
                    ) : (
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => {
                          if (window.confirm(`Delete custom template "${tpl.name}"?`)) {
                            deleteDocumentTemplate(tpl.id);
                            notify('success', `Deleted template "${tpl.name}".`);
                          }
                        }}
                      >
                        🗑 Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* =====================================================================
          VIEW 2: TEMPLATE STUDIO & SYMBOL / PLACEHOLDER EDITOR
         ===================================================================== */}
      {subView === 'editor' && editingTemplate && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
              <h4 style={{ margin: 0, color: 'var(--primary-color)' }}>
                ✏️ Template Studio — {editingTemplate.name}
              </h4>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-outline btn-sm" onClick={() => setSubView('library')}>
                  Cancel
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    const saved = saveDocumentTemplate(editingTemplate);
                    handleOpenGenerator(saved);
                  }}
                >
                  💾 Save & Open Generator
                </button>
                <button className="btn btn-primary btn-sm" onClick={handleSaveEditorTemplate}>
                  💾 Save Template
                </button>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group" style={{ flex: 2 }}>
                <label>Template Title</label>
                <input
                  type="text"
                  value={editingTemplate.name}
                  onChange={e => setEditingTemplate(p => ({ ...p, name: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label>Category</label>
                <select
                  value={editingTemplate.category}
                  onChange={e => setEditingTemplate(p => ({ ...p, category: e.target.value }))}
                >
                  {TEMPLATE_CATEGORIES.filter(c => c !== 'All').map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Document Type</label>
                <select
                  value={editingTemplate.type}
                  onChange={e => setEditingTemplate(p => ({ ...p, type: e.target.value }))}
                >
                  <option value="letter">Individual / Bulk HR Letter</option>
                  <option value="sheet">Monthly Payroll / Bank Sheet</option>
                </select>
              </div>
              <div className="form-group">
                <label>Page Orientation</label>
                <select
                  value={editingTemplate.pageSize || 'A4'}
                  onChange={e => setEditingTemplate(p => ({ ...p, pageSize: e.target.value }))}
                >
                  <option value="A4">A4 Portrait</option>
                  <option value="A4-Landscape">A4 Landscape (Wide Sheet)</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group" style={{ flex: 2 }}>
                <label>Short Description</label>
                <input
                  type="text"
                  value={editingTemplate.description || ''}
                  onChange={e => setEditingTemplate(p => ({ ...p, description: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label>Default Signatory Name</label>
                <input
                  type="text"
                  value={editingTemplate.signatory?.name || ''}
                  onChange={e =>
                    setEditingTemplate(p => ({
                      ...p,
                      signatory: { ...(p.signatory || {}), name: e.target.value }
                    }))
                  }
                />
              </div>
              <div className="form-group">
                <label>Default Signatory Designation</label>
                <input
                  type="text"
                  value={editingTemplate.signatory?.designation || ''}
                  onChange={e =>
                    setEditingTemplate(p => ({
                      ...p,
                      signatory: { ...(p.signatory || {}), designation: e.target.value }
                    }))
                  }
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', alignItems: 'center' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: 700 }}>
                <input
                  type="checkbox"
                  checked={editingTemplate.useLetterhead !== false}
                  onChange={e => setEditingTemplate(p => ({ ...p, useLetterhead: e.target.checked }))}
                />
                <span>Include ATCL Corporate Letterhead Banner</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: 700, color: '#d97706' }}>
                <input
                  type="checkbox"
                  checked={!!editingTemplate.isFeatured}
                  onChange={e => setEditingTemplate(p => ({ ...p, isFeatured: e.target.checked }))}
                />
                <span>⭐ Emphasize / Feature this Template at Top of Library</span>
              </label>
            </div>

            {/* Custom Prompt Fields Builder */}
            <div style={{ padding: 12, borderRadius: 10, background: 'var(--bg-app)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, marginBottom: 8 }}>
                Custom Input Prompts (filled when generating document — referenced as <code>{'{{input.key}}'}</code>)
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                {(editingTemplate.customFields || []).map((cf, i) => (
                  <span
                    key={cf.key || i}
                    className="badge badge-info"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 10px' }}
                  >
                    <strong onClick={() => handleInsertPlaceholder(`{{input.${cf.key}}}`)} style={{ cursor: 'pointer' }}>
                      {`{{input.${cf.key}}}`}
                    </strong>
                    <span>({cf.label})</span>
                    <button
                      onClick={() =>
                        setEditingTemplate(p => ({
                          ...p,
                          customFields: p.customFields.filter((_, idx) => idx !== i)
                        }))
                      }
                      style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 800 }}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <input
                  type="text"
                  placeholder="Field key (e.g. lastWorkingDay)"
                  value={newCustomField.key}
                  onChange={e => setNewCustomField(p => ({ ...p, key: e.target.value.replace(/[^a-zA-Z0-9_]/g, '') }))}
                  style={{ width: 200 }}
                />
                <input
                  type="text"
                  placeholder="Prompt Label (e.g. Last Working Day)"
                  value={newCustomField.label}
                  onChange={e => setNewCustomField(p => ({ ...p, label: e.target.value }))}
                  style={{ width: 240 }}
                />
                <input
                  type="text"
                  placeholder="Default Value"
                  value={newCustomField.defaultValue}
                  onChange={e => setNewCustomField(p => ({ ...p, defaultValue: e.target.value }))}
                  style={{ width: 200 }}
                />
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => {
                    if (!newCustomField.key || !newCustomField.label) return;
                    setEditingTemplate(p => ({
                      ...p,
                      customFields: [...(p.customFields || []), { ...newCustomField }]
                    }));
                    setNewCustomField({ key: '', label: '', defaultValue: '' });
                  }}
                >
                  + Add Custom Prompt Field
                </button>
              </div>
            </div>
          </div>

          {/* Main 3-Column Studio: Editor | Placeholder Picker | Live Preview */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 0.75fr 1.1fr', gap: 16, alignItems: 'start' }}>
            {/* Column 1: Template Body Editor */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                <strong style={{ fontSize: '0.85rem', color: 'var(--primary-color)' }}>
                  1. Template Body (Copy / Paste & Format)
                </strong>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    className={`btn btn-sm ${editorMode === 'source' ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => setEditorMode('source')}
                  >
                    HTML / Symbol Editor
                  </button>
                  <button
                    className={`btn btn-sm ${editorMode === 'visual' ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => setEditorMode('visual')}
                  >
                    Visual Rich Editor
                  </button>
                </div>
              </div>

              {/* Quick Formatting Snippet Bar */}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', padding: '6px 8px', background: 'var(--bg-app)', borderRadius: 8 }}>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => handleInsertPlaceholder('<strong>Bold Text</strong>')}
                >
                  <b>B</b>
                </button>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => handleInsertPlaceholder('<em>Italic Text</em>')}
                >
                  <i>I</i>
                </button>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => handleInsertPlaceholder('<p style="text-align:justify;">New paragraph...</p>')}
                >
                  + Paragraph
                </button>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() =>
                    handleInsertPlaceholder(
                      `<table style="width:100%;border-collapse:collapse;margin:10px 0;">\n  <tr><th style="border:1px solid #cbd5e1;padding:6px;">Column 1</th><th style="border:1px solid #cbd5e1;padding:6px;">Column 2</th></tr>\n  <tr><td style="border:1px solid #cbd5e1;padding:6px;">Value 1</td><td style="border:1px solid #cbd5e1;padding:6px;">Value 2</td></tr>\n</table>`
                    )
                  }
                >
                  + Table
                </button>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={async () => {
                    await navigator.clipboard.writeText(editingTemplate.body || '');
                    notify('success', 'Copied raw template source to clipboard.');
                  }}
                >
                  📋 Copy Source
                </button>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={async () => {
                    try {
                      const text = await navigator.clipboard.readText();
                      if (text) {
                        handleInsertPlaceholder(text);
                      }
                    } catch {
                      notify('error', 'Use Ctrl+V inside the editor box to paste.');
                    }
                  }}
                >
                  📥 Paste Clipboard
                </button>
              </div>

              {editorMode === 'source' ? (
                <textarea
                  ref={bodyTextareaRef}
                  rows={22}
                  value={editingTemplate.body || ''}
                  onChange={e => setEditingTemplate(p => ({ ...p, body: e.target.value }))}
                  style={{ fontFamily: 'monospace', fontSize: '0.8rem', lineHeight: 1.5, resize: 'vertical' }}
                />
              ) : (
                <div
                  ref={visualEditorRef}
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={e => setEditingTemplate(p => ({ ...p, body: e.currentTarget.innerHTML }))}
                  dangerouslySetInnerHTML={{ __html: editingTemplate.body || '' }}
                  style={{
                    minHeight: 420,
                    padding: 16,
                    border: '1px solid var(--border-color)',
                    borderRadius: 10,
                    background: '#fff',
                    color: '#0f172a',
                    overflowY: 'auto'
                  }}
                />
              )}
            </div>

            {/* Column 2: Symbol & Placeholder Picker */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 620, overflowY: 'auto' }}>
              <strong style={{ fontSize: '0.85rem', color: 'var(--primary-color)' }}>
                2. Dynamic Symbols & Placeholders (Click to Insert)
              </strong>
              <p style={{ margin: 0, fontSize: '0.73rem', color: 'var(--text-secondary)' }}>
                Click any symbol below to insert it at your cursor or copy it for pasting.
              </p>

              {PLACEHOLDER_GROUPS.map(grp => (
                <div key={grp.group} style={{ borderTop: '1px solid var(--border-color)', paddingTop: 8 }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--secondary-color)', textTransform: 'uppercase', marginBottom: 6 }}>
                    {grp.group}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {grp.items.map(item => (
                      <div
                        key={item.token}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '5px 8px',
                          borderRadius: 6,
                          background: 'var(--bg-app)',
                          fontSize: '0.74rem',
                          cursor: 'pointer'
                        }}
                        onClick={() => handleInsertPlaceholder(item.token)}
                      >
                        <span>{item.label}</span>
                        <code style={{ fontSize: '0.68rem', color: 'var(--primary-color)', fontWeight: 700 }}>
                          {item.token}
                        </code>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Column 3: Live A4 Preview */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                <strong style={{ fontSize: '0.85rem', color: 'var(--primary-color)' }}>
                  3. Live Document Preview
                </strong>
                <select
                  value={previewEmpCode}
                  onChange={e => setPreviewEmpCode(e.target.value)}
                  style={{ fontSize: '0.76rem', padding: '5px 28px 5px 8px' }}
                >
                  {(employees || []).map(emp => (
                    <option key={emp.employeeCode} value={emp.employeeCode}>
                      {emp.employeeCode} — {emp.fullNameEnglish}
                    </option>
                  ))}
                </select>
              </div>

              <div
                style={{
                  background: '#ffffff',
                  color: '#0f172a',
                  padding: 22,
                  borderRadius: 8,
                  border: '1px solid #cbd5e1',
                  boxShadow: 'inset 0 2px 6px rgba(15,23,42,0.06)',
                  maxHeight: 540,
                  overflowY: 'auto'
                }}
                dangerouslySetInnerHTML={{ __html: editorPreviewHtml }}
              />
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          VIEW 3: DOCUMENT GENERATOR & MONTHLY SALARY / BANK SHEET BUILDER
         ===================================================================== */}
      {subView === 'generator' && activeGeneratorTemplate && (
        <div style={{ display: 'grid', gridTemplateColumns: '390px 1fr', gap: 20, alignItems: 'start' }}>
          {/* Left Configuration Panel */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <h4 style={{ margin: 0, color: 'var(--primary-color)' }}>
              ⚡ Configure & Generate Document
            </h4>

            <div className="form-group" style={{ marginBottom: 4 }}>
              <label>1. Select HR or Payroll Template (⭐ Featured First)</label>
              <select
                value={selectedTemplateId}
                onChange={e => {
                  const nextTpl = (documentTemplates || []).find(t => t.id === e.target.value);
                  if (nextTpl) handleOpenGenerator(nextTpl);
                }}
              >
                {[...(documentTemplates || [])]
                  .sort((a, b) => Number(!!b.isFeatured) - Number(!!a.isFeatured))
                  .map(t => (
                    <option key={t.id} value={t.id}>
                      {t.isFeatured ? '⭐ ' : ''}{t.name} ({t.type === 'sheet' ? 'Monthly Sheet' : t.category})
                    </option>
                  ))}
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 4 }}>
              <label>Document Reference No.</label>
              <input
                type="text"
                value={genRefNo}
                onChange={e => setGenRefNo(e.target.value)}
              />
            </div>

            {/* Controls for LETTER Templates */}
            {activeGeneratorTemplate.type !== 'sheet' && (
              <>
                <div className="form-group" style={{ marginBottom: 4 }}>
                  <label>Generation Mode</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      type="button"
                      className={`btn btn-sm ${genMode === 'single' ? 'btn-primary' : 'btn-outline'}`}
                      style={{ flex: 1 }}
                      onClick={() => setGenMode('single')}
                    >
                      Single Employee
                    </button>
                    <button
                      type="button"
                      className={`btn btn-sm ${genMode === 'bulk' ? 'btn-primary' : 'btn-outline'}`}
                      style={{ flex: 1 }}
                      onClick={() => setGenMode('bulk')}
                    >
                      Bulk Multi-Employee ({bulkSelectedCodes.length})
                    </button>
                  </div>
                </div>

                {genMode === 'single' ? (
                  <div className="form-group" style={{ marginBottom: 4 }}>
                    <label>Select Employee</label>
                    <select value={genEmpCode} onChange={e => setGenEmpCode(e.target.value)}>
                      {(employees || []).map(emp => (
                        <option key={emp.employeeCode} value={emp.employeeCode}>
                          {emp.employeeCode} — {emp.fullNameEnglish} ({emp.designation})
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div style={{
                    maxHeight: 190,
                    overflowY: 'auto',
                    padding: 10,
                    borderRadius: 8,
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-app)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.74rem' }}>
                      <strong>Select Employees ({bulkSelectedCodes.length})</strong>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <span
                          style={{ color: 'var(--primary-color)', cursor: 'pointer', fontWeight: 700 }}
                          onClick={() => setBulkSelectedCodes(activeEmployees.map(e => e.employeeCode))}
                        >
                          Select All
                        </span>
                        <span
                          style={{ color: '#ef4444', cursor: 'pointer', fontWeight: 700 }}
                          onClick={() => setBulkSelectedCodes([])}
                        >
                          Clear
                        </span>
                      </div>
                    </div>
                    {activeEmployees.map(emp => (
                      <label
                        key={emp.employeeCode}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '3px 0', fontSize: '0.76rem', cursor: 'pointer' }}
                      >
                        <input
                          type="checkbox"
                          checked={bulkSelectedCodes.includes(emp.employeeCode)}
                          onChange={e => {
                            if (e.target.checked) {
                              setBulkSelectedCodes(p => [...p, emp.employeeCode]);
                            } else {
                              setBulkSelectedCodes(p => p.filter(c => c !== emp.employeeCode));
                            }
                          }}
                        />
                        <span>{emp.employeeCode} — {emp.fullNameEnglish}</span>
                      </label>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Controls for MONTHLY SALARY APPROVAL & BANK CONFIRMATION SHEETS */}
            {activeGeneratorTemplate.type === 'sheet' && (
              <div style={{
                padding: 12,
                borderRadius: 10,
                background: 'rgba(6, 182, 212, 0.07)',
                border: '1px solid rgba(6, 182, 212, 0.28)',
                display: 'flex',
                flexDirection: 'column',
                gap: 10
              }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--primary-color)' }}>
                  📊 Monthly Payroll & Bank Sheet Parameters
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Select Salary Month</label>
                  <input
                    type="month"
                    value={genMonthKey}
                    onChange={e => setGenMonthKey(e.target.value)}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Filter by Employee Bank</label>
                  <select value={genBankFilter} onChange={e => setGenBankFilter(e.target.value)}>
                    <option value="ALL">All Banks ({activeEmployees.length} Employees)</option>
                    {distinctEmployeeBanks.map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>

                {(companyInfo?.bankAccounts?.length || 0) > 0 && (
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>ATCL Disbursing Corporate Bank A/C</label>
                    <select
                      value={genCompanyBankIdx}
                      onChange={e => setGenCompanyBankIdx(Number(e.target.value))}
                    >
                      {companyInfo.bankAccounts.map((b, idx) => (
                        <option key={b.id || idx} value={idx}>
                          {b.bankName} — A/C {b.accountNumber} ({b.branchName})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="form-row">
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Festival Bonus</label>
                    <select value={genBonusType} onChange={e => setGenBonusType(e.target.value)}>
                      <option value="None">No Festival Bonus</option>
                      <option value="Eid-ul-Fitr">Eid-ul-Fitr Bonus</option>
                      <option value="Eid-ul-Adha">Eid-ul-Adha Bonus</option>
                      <option value="Festival Bonus">Festival Bonus</option>
                    </select>
                  </div>
                  {genBonusType !== 'None' && (
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label>Bonus (% of Basic)</label>
                      <input
                        type="number"
                        value={genBonusPercent}
                        onChange={e => setGenBonusPercent(Number(e.target.value) || 0)}
                      />
                    </div>
                  )}
                </div>

                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', paddingTop: 4, borderTop: '1px solid var(--border-color)' }}>
                  Employees in Sheet: <strong>{livePayrollDataset.rows.length}</strong> &nbsp;|&nbsp; Total Net: <strong>৳{formatBDT(livePayrollDataset.totals.net)}</strong>
                </div>
              </div>
            )}

            {/* Template Custom Input Fields */}
            {(activeGeneratorTemplate.customFields || []).length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--primary-color)' }}>
                  Template-Specific Fields
                </div>
                {activeGeneratorTemplate.customFields.map(cf => (
                  <div key={cf.key} className="form-group" style={{ marginBottom: 0 }}>
                    <label>{cf.label}</label>
                    <input
                      type="text"
                      value={genCustomInputs[cf.key] ?? cf.defaultValue ?? ''}
                      onChange={e =>
                        setGenCustomInputs(p => ({
                          ...p,
                          [cf.key]: e.target.value
                        }))
                      }
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Signatory Override */}
            <div className="form-row">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Signatory Name</label>
                <input
                  type="text"
                  value={genSignatory.name}
                  onChange={e => setGenSignatory(p => ({ ...p, name: e.target.value }))}
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Signatory Title</label>
                <input
                  type="text"
                  value={genSignatory.designation}
                  onChange={e => setGenSignatory(p => ({ ...p, designation: e.target.value }))}
                />
              </div>
            </div>

            {/* Output Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 8, borderTop: '1px solid var(--border-color)' }}>
              <button
                className="btn btn-primary"
                onClick={() =>
                  printRenderedDocument(renderedGeneratorPages, {
                    title: `${activeGeneratorTemplate.name} - ${genRefNo}`,
                    landscape: activeGeneratorTemplate.pageSize === 'A4-Landscape'
                  })
                }
              >
                🖨️ Print / Save as A4 PDF ({renderedGeneratorPages.length} {renderedGeneratorPages.length > 1 ? 'Pages' : 'Page'})
              </button>

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  className="btn btn-secondary btn-sm"
                  style={{ flex: 1 }}
                  onClick={async () => {
                    await copyRenderedToClipboard(renderedGeneratorPages.join('<hr style="page-break-after:always;"/>'));
                    notify('success', 'Copied formatted document to clipboard! Ready to paste into Word, Gmail, or Google Docs.');
                  }}
                >
                  📋 Copy Formatted
                </button>
                <button
                  className="btn btn-outline btn-sm"
                  style={{ flex: 1 }}
                  onClick={() => {
                    downloadRenderedWordDoc(
                      renderedGeneratorPages.join('<br style="page-break-before:always;"/>'),
                      `${activeGeneratorTemplate.name}_${genMonthKey}`
                    );
                    notify('success', 'Downloaded Microsoft Word (.doc) document.');
                  }}
                >
                  📝 Word (.doc)
                </button>
              </div>

              {activeGeneratorTemplate.type === 'sheet' ? (
                <button className="btn btn-success btn-sm" onClick={handleExportMonthlySheetExcel}>
                  📊 Export Monthly Sheet to Excel (.xlsx)
                </button>
              ) : (
                <button className="btn btn-outline btn-sm" onClick={handleSaveToEmployeeDossier}>
                  💾 Save Record to Employee Dossier
                </button>
              )}
            </div>
          </div>

          {/* Right Live Document Preview Canvas */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
              <div>
                <h4 style={{ margin: 0, color: 'var(--primary-color)' }}>
                  📄 Live Document Preview — {activeGeneratorTemplate.name}
                </h4>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  You can select any text inside the preview below to copy-paste, or click "📋 Copy Formatted" on the left.
                </span>
              </div>
              <button
                className="btn btn-outline btn-sm"
                onClick={() => handleOpenEditor(activeGeneratorTemplate)}
              >
                ✏️ Edit This Template
              </button>
            </div>

            <div style={{
              background: '#e2e8f0',
              padding: 24,
              borderRadius: 12,
              maxHeight: '78vh',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 24
            }}>
              {renderedGeneratorPages.map((pageHtml, idx) => (
                <div
                  key={idx}
                  style={{
                    background: '#ffffff',
                    color: '#0f172a',
                    maxWidth: activeGeneratorTemplate.pageSize === 'A4-Landscape' ? '1050px' : '820px',
                    width: '100%',
                    margin: '0 auto',
                    padding: '36px 42px',
                    borderRadius: 6,
                    boxShadow: '0 10px 30px rgba(15, 23, 42, 0.14)'
                  }}
                  dangerouslySetInnerHTML={{ __html: pageHtml }}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          PASTE & CREATE TEMPLATE MODAL
         ===================================================================== */}
      {showPasteModal && (
        <div className="modal-overlay" onClick={() => setShowPasteModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 680 }}>
            <div className="modal-header">
              <div className="modal-title">📋 Paste & Create New Template</div>
              <button className="modal-close-btn" onClick={() => setShowPasteModal(false)}>×</button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                Paste any letter or sheet content copied from Microsoft Word, Google Docs, or email below. You can also include dynamic symbols like <code>{'{{employee.fullNameEnglish}}'}</code> or <code>{'{{salary.gross}}'}</code>.
              </p>

              <div className="form-row">
                <div className="form-group" style={{ flex: 2 }}>
                  <label>New Template Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Project Transfer Letter / Probation Extension Letter"
                    value={pasteForm.name}
                    onChange={e => setPasteForm(p => ({ ...p, name: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <select
                    value={pasteForm.category}
                    onChange={e => setPasteForm(p => ({ ...p, category: e.target.value }))}
                  >
                    {TEMPLATE_CATEGORIES.filter(c => c !== 'All').map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: 700, color: '#d97706' }}>
                <input
                  type="checkbox"
                  checked={pasteForm.isFeatured}
                  onChange={e => setPasteForm(p => ({ ...p, isFeatured: e.target.checked }))}
                />
                <span>⭐ Emphasize / Feature this template in the library</span>
              </label>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Paste Template Content Here (Ctrl+V)</label>
                <textarea
                  rows={10}
                  placeholder="Paste your letter text here..."
                  value={pasteForm.rawText}
                  onChange={e => setPasteForm(p => ({ ...p, rawText: e.target.value }))}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowPasteModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleCreateFromPaste}>
                ✨ Create Template & Open Studio
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

