// App Controller: M&A Audit History Dashboard

// State variables
let auditReports = [];
let selectedCompanyId = null;
let currentFilter = 'all';
let searchQuery = '';
let activeChart = null;

// Default buying policy thresholds
const DEFAULT_POLICIES = {
    maxDebt: 3000000,
    minRunway: 6,
    maxBurnRate: 200000
};

// Current simulation thresholds
let simPolicies = { ...DEFAULT_POLICIES };

// DOM Elements
const searchInput = document.getElementById('search-input');
const filterPills = document.querySelectorAll('.filter-pill');
const recordCountBadge = document.getElementById('record-count');
const targetsListContainer = document.getElementById('targets-list');
const emptyListState = document.getElementById('empty-list-state');

const emptyDetailState = document.getElementById('empty-detail-state');
const activeDetailPanel = document.getElementById('active-detail-panel');

const detailCompanyName = document.getElementById('detail-company-name');
const detailAuditDate = document.getElementById('detail-audit-date');
const detailComplianceBadge = document.getElementById('detail-compliance-badge');

const complianceChecklist = document.getElementById('compliance-checklist');
const detailDebtVal = document.getElementById('detail-debt');
const detailBurnVal = document.getElementById('detail-burn');
const detailRunwayVal = document.getElementById('detail-runway');
const detailLawsuitsVal = document.getElementById('detail-lawsuits');

const debtSlider = document.getElementById('debt-slider');
const runwaySlider = document.getElementById('runway-slider');
const burnSlider = document.getElementById('burn-slider');

const debtValLabel = document.getElementById('debt-val');
const runwayValLabel = document.getElementById('runway-val');
const burnValLabel = document.getElementById('burn-val');

const resetBtn = document.getElementById('reset-defaults-btn');

// Initialize application on load
window.addEventListener('DOMContentLoaded', () => {
    initSliders();
    loadData();
    setupEventListeners();
});

// Setup slider label listeners
function initSliders() {
    debtSlider.value = simPolicies.maxDebt;
    runwaySlider.value = simPolicies.minRunway;
    burnSlider.value = simPolicies.maxBurnRate;
    
    updateSliderLabels();
}

function updateSliderLabels() {
    debtValLabel.textContent = formatCurrency(simPolicies.maxDebt);
    runwayValLabel.textContent = `${simPolicies.minRunway} month${simPolicies.minRunway > 1 ? 's' : ''}`;
    burnValLabel.textContent = formatCurrency(simPolicies.maxBurnRate);
}

// Load data using CORS-safe fetch + global JS array fallback
async function loadData() {
    try {
        const response = await fetch('audit_reports.json');
        if (!response.ok) throw new Error('Network response not ok');
        const data = await response.json();
        auditReports = data;
        console.log('[+] Successfully loaded audit reports via fetch()');
    } catch (err) {
        console.warn('[!] JSON Fetch failed (likely local file:// CORS policy). Falling back to static data.');
        if (typeof INITIAL_AUDIT_DATA !== 'undefined') {
            auditReports = INITIAL_AUDIT_DATA;
            console.log('[+] Successfully loaded fallback audit reports from data.js');
        } else {
            console.error('[-] Error: Data source not found.');
            targetsListContainer.innerHTML = '<div class="empty-state"><h3>Failed to load database</h3></div>';
            return;
        }
    }
    
    evaluateAndRender();
}

// Setup core event listeners
function setupEventListeners() {
    // Search input
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.trim().toLowerCase();
        renderCompanyList();
    });

    // Filter pills
    filterPills.forEach(pill => {
        pill.addEventListener('click', () => {
            filterPills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            currentFilter = pill.getAttribute('data-filter');
            renderCompanyList();
        });
    });

    // Sliders input (real-time sliding evaluation)
    debtSlider.addEventListener('input', (e) => {
        simPolicies.maxDebt = parseInt(e.target.value);
        updateSliderLabels();
        evaluateAndRender();
    });

    runwaySlider.addEventListener('input', (e) => {
        simPolicies.minRunway = parseInt(e.target.value);
        updateSliderLabels();
        evaluateAndRender();
    });

    burnSlider.addEventListener('input', (e) => {
        simPolicies.maxBurnRate = parseInt(e.target.value);
        updateSliderLabels();
        evaluateAndRender();
    });

    // Reset policy defaults
    resetBtn.addEventListener('click', () => {
        simPolicies = { ...DEFAULT_POLICIES };
        initSliders();
        evaluateAndRender();
    });
}

// Format utilities
function formatCurrency(val) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0
    }).format(val);
}

function formatDate(dateStr) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateStr).toLocaleDateString('en-US', options);
}

// Main evaluation controller
function evaluateAndRender() {
    // 1. Audit targets client-side based on simulation policy rules
    auditReports = auditReports.map(company => {
        const financials = company.currentFinancials;
        
        const violations = [];
        
        // Debt check
        const debtOk = financials.totalDebt <= simPolicies.maxDebt;
        if (!debtOk) {
            violations.push(`Outstanding debt of ${formatCurrency(financials.totalDebt)} exceeds maximum limit of ${formatCurrency(simPolicies.maxDebt)}.`);
        }
        
        // Runway check
        const runwayOk = financials.runway >= simPolicies.minRunway;
        if (!runwayOk) {
            violations.push(`Remaining runway of ${financials.runway} month${financials.runway > 1 ? 's' : ''} is below minimum requirement of ${simPolicies.minRunway} months.`);
        }
        
        // Burn rate check
        const burnOk = financials.burnRate <= simPolicies.maxBurnRate;
        if (!burnOk) {
            violations.push(`Monthly burn rate of ${formatCurrency(financials.burnRate)} exceeds maximum limit of ${formatCurrency(simPolicies.maxBurnRate)}.`);
        }
        
        // Lawsuit check (Corporate guideline)
        const lawsuitOk = !financials.hasLawsuits;
        if (!lawsuitOk) {
            violations.push(`Target has active pending lawsuits or litigation.`);
        }
        
        const compliant = debtOk && runwayOk && burnOk && lawsuitOk;
        
        return {
            ...company,
            isCompliant: compliant,
            violations: violations,
            checks: {
                debt: { ok: debtOk, val: financials.totalDebt, limit: simPolicies.maxDebt },
                runway: { ok: runwayOk, val: financials.runway, limit: simPolicies.minRunway },
                burnRate: { ok: burnOk, val: financials.burnRate, limit: simPolicies.maxBurnRate },
                lawsuits: { ok: lawsuitOk, val: financials.hasLawsuits }
            }
        };
    });

    // 2. Refresh the UI elements
    renderCompanyList();
    
    // 3. Update active detail view if selection exists
    if (selectedCompanyId) {
        renderDetailView(selectedCompanyId);
    }
}

// Render the left-hand company card list
function renderCompanyList() {
    // Filter by search query and compliance status filter
    const filteredCompanies = auditReports.filter(company => {
        const matchesSearch = company.companyName.toLowerCase().includes(searchQuery);
        
        if (currentFilter === 'compliant') {
            return matchesSearch && company.isCompliant;
        } else if (currentFilter === 'non-compliant') {
            return matchesSearch && !company.isCompliant;
        }
        return matchesSearch;
    });

    // Update count badge
    recordCountBadge.textContent = `${filteredCompanies.length} record${filteredCompanies.length !== 1 ? 's' : ''}`;

    // Clean container
    targetsListContainer.innerHTML = '';

    if (filteredCompanies.length === 0) {
        emptyListState.classList.remove('hidden');
        return;
    } else {
        emptyListState.classList.add('hidden');
    }

    // Generate Cards
    filteredCompanies.forEach(company => {
        const card = document.createElement('div');
        card.className = `target-card ${selectedCompanyId === company.id ? 'selected' : ''}`;
        card.setAttribute('data-id', company.id);
        
        const badgeClass = company.isCompliant ? 'badge-success' : 'badge-danger';
        const badgeText = company.isCompliant ? 'Compliant' : 'Non-Compliant';

        card.innerHTML = `
            <div class="card-title-row">
                <h3>${escapeHtml(company.companyName)}</h3>
                <span class="badge ${badgeClass}">${badgeText}</span>
            </div>
            <div class="card-financials-summary">
                <div class="mini-stat">
                    <span class="mini-stat-label">Debt</span>
                    <span class="mini-stat-val">${formatCompact(company.currentFinancials.totalDebt)}</span>
                </div>
                <div class="mini-stat">
                    <span class="mini-stat-label">Burn</span>
                    <span class="mini-stat-val">${formatCompact(company.currentFinancials.burnRate)}/mo</span>
                </div>
                <div class="mini-stat">
                    <span class="mini-stat-label">Runway</span>
                    <span class="mini-stat-val">${company.currentFinancials.runway} mo</span>
                </div>
            </div>
            <div class="card-meta-row">
                <span>ID: #${company.id}</span>
                <span>Audited: ${formatDate(company.auditDate)}</span>
            </div>
        `;

        card.addEventListener('click', () => {
            selectCompany(company.id);
        });

        targetsListContainer.appendChild(card);
    });
}

// Compact currency formatter (e.g., $3.2M, $450K)
function formatCompact(val) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        notation: 'compact',
        maximumFractionDigits: 1
    }).format(val);
}

// Select a company and render details
function selectCompany(id) {
    selectedCompanyId = id;
    
    // Highlight selected card
    const cards = document.querySelectorAll('.target-card');
    cards.forEach(card => {
        if (card.getAttribute('data-id') === id) {
            card.classList.add('selected');
        } else {
            card.classList.remove('selected');
        }
    });

    renderDetailView(id);
}

// Populate the right-hand panel details
function renderDetailView(id) {
    const company = auditReports.find(c => c.id === id);
    if (!company) return;

    // Show panel, hide placeholder
    emptyDetailState.classList.add('hidden');
    activeDetailPanel.classList.remove('hidden');

    // Basic Header
    detailCompanyName.textContent = company.companyName;
    detailAuditDate.textContent = `Audit Assessment Date: ${formatDate(company.auditDate)}`;
    
    // Overall Status Badge
    detailComplianceBadge.className = 'badge';
    if (company.isCompliant) {
        detailComplianceBadge.classList.add('badge-success');
        detailComplianceBadge.textContent = 'Compliant';
    } else {
        detailComplianceBadge.classList.add('badge-danger');
        detailComplianceBadge.textContent = 'Non-Compliant';
    }

    // Financial Values Column
    detailDebtVal.textContent = formatCurrency(company.currentFinancials.totalDebt);
    detailBurnVal.textContent = `${formatCurrency(company.currentFinancials.burnRate)} / month`;
    detailRunwayVal.textContent = `${company.currentFinancials.runway} month${company.currentFinancials.runway > 1 ? 's' : ''}`;
    detailLawsuitsVal.textContent = company.currentFinancials.hasLawsuits ? '⚠️ Active Litigation' : '✓ Zero Pending';
    if (company.currentFinancials.hasLawsuits) {
        detailLawsuitsVal.style.color = 'var(--danger-rose)';
    } else {
        detailLawsuitsVal.style.color = 'var(--success-emerald)';
    }

    // Render Checklist
    complianceChecklist.innerHTML = '';
    
    const checks = [
        {
            name: 'Debt Limit Check',
            ok: company.checks.debt.ok,
            msg: company.checks.debt.ok
                ? `Total Debt (${formatCurrency(company.checks.debt.val)}) is within maximum limit of ${formatCurrency(company.checks.debt.limit)}.`
                : `Debt violation: ${formatCurrency(company.checks.debt.val)} exceeds the allowed maximum of ${formatCurrency(company.checks.debt.limit)}.`
        },
        {
            name: 'Cash Runway Check',
            ok: company.checks.runway.ok,
            msg: company.checks.runway.ok
                ? `Remaining Cash Runway (${company.checks.runway.val} months) satisfies the minimum required ${company.checks.runway.limit} months.`
                : `Runway violation: ${company.checks.runway.val} months is below the minimum required ${company.checks.runway.limit} months.`
        },
        {
            name: 'Monthly Burn Rate Check',
            ok: company.checks.burnRate.ok,
            msg: company.checks.burnRate.ok
                ? `Monthly Net Burn Rate (${formatCurrency(company.checks.burnRate.val)}) satisfies the maximum policy threshold of ${formatCurrency(company.checks.burnRate.limit)}.`
                : `Burn rate violation: Monthly burn of ${formatCurrency(company.checks.burnRate.val)} exceeds policy cap of ${formatCurrency(company.checks.burnRate.limit)}.`
        },
        {
            name: 'Litigation Integrity Check',
            ok: company.checks.lawsuits.ok,
            msg: company.checks.lawsuits.ok
                ? `Zero active legal disputes or lawsuits pending.`
                : `Litigation breach: Target company has active pending litigation.`
        }
    ];

    checks.forEach(check => {
        const li = document.createElement('li');
        li.className = 'checklist-item';
        
        const icon = check.ok ? '✓' : '✗';
        const iconClass = check.ok ? 'pass' : 'fail';
        const textClass = check.ok ? 'item-desc' : 'item-desc fail-detail';

        li.innerHTML = `
            <span class="check-icon ${iconClass}">${icon}</span>
            <div class="item-text">
                <strong>${check.name}:</strong> 
                <span class="${textClass}">${check.msg}</span>
            </div>
        `;
        complianceChecklist.appendChild(li);
    });

    // Render Runway/Burn Historical Projections Chart
    renderTrendChart(company);
}

// Chart.js initialization and rendering
function renderTrendChart(company) {
    const ctx = document.getElementById('trend-chart').getContext('2d');
    
    // Destroy previous Chart instance to prevent rendering conflicts
    if (activeChart) {
        activeChart.destroy();
    }

    const labels = company.historicalData.months;
    const runwayData = company.historicalData.runwayHistory;
    const burnData = company.historicalData.burnRateHistory;

    activeChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Cash Runway (Months)',
                    data: runwayData,
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.05)',
                    yAxisID: 'y-runway',
                    borderWidth: 3,
                    pointBackgroundColor: '#10b981',
                    pointBorderColor: '#ffffff',
                    pointHoverRadius: 6,
                    tension: 0.35,
                    fill: true
                },
                {
                    label: 'Monthly Burn Rate (USD)',
                    data: burnData,
                    borderColor: '#6366f1',
                    backgroundColor: 'rgba(99, 102, 241, 0.05)',
                    yAxisID: 'y-burn',
                    borderWidth: 3,
                    pointBackgroundColor: '#6366f1',
                    pointBorderColor: '#ffffff',
                    pointHoverRadius: 6,
                    tension: 0.35,
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        color: '#9ca3af',
                        font: {
                            family: "'Outfit', sans-serif",
                            size: 12,
                            weight: 500
                        },
                        boxWidth: 16,
                        usePointStyle: true,
                        pointStyle: 'circle'
                    }
                },
                tooltip: {
                    backgroundColor: '#1e293b',
                    titleColor: '#f3f4f6',
                    bodyColor: '#e2e8f0',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    borderWidth: 1,
                    titleFont: { family: "'Outfit', sans-serif" },
                    bodyFont: { family: "'Inter', sans-serif" },
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.datasetIndex === 0) {
                                label += context.raw + ' months';
                            } else {
                                label += formatCurrency(context.raw);
                            }
                            return label;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.03)'
                    },
                    ticks: {
                        color: '#9ca3af',
                        font: { family: "'Inter', sans-serif", size: 11 }
                    }
                },
                'y-runway': {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    min: 0,
                    max: Math.max(...runwayData, 24) + 2,
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)'
                    },
                    ticks: {
                        color: '#10b981',
                        font: { family: "'Outfit', sans-serif", weight: 600 },
                        callback: function(value) {
                            return value + ' mo';
                        }
                    },
                    title: {
                        display: true,
                        text: 'Cash Runway',
                        color: '#10b981',
                        font: { family: "'Outfit', sans-serif", size: 11, weight: 600 }
                    }
                },
                'y-burn': {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    min: 0,
                    grid: {
                        drawOnChartArea: false // only draw grid lines for runway scale
                    },
                    ticks: {
                        color: '#6366f1',
                        font: { family: "'Outfit', sans-serif", weight: 600 },
                        callback: function(value) {
                            return formatCompact(value);
                        }
                    },
                    title: {
                        display: true,
                        text: 'Monthly Burn Rate',
                        color: '#6366f1',
                        font: { family: "'Outfit', sans-serif", size: 11, weight: 600 }
                    }
                }
            }
        }
    });
}

// HTML Entity escaper
function escapeHtml(unsafe) {
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}
