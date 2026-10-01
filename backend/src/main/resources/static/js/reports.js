// js/reports.js — Reports & CSV Import/Export Module
(function () {
    'use strict';

    let currentReport = null;
    let currentReportData = null;

    window.loadReports = async function () {
        const main = document.getElementById('main-content');
        main.innerHTML = `
            <div class="card">
                <div class="card-header" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;">
                    <h2>📊 Reports & Data Management</h2>
                    <div style="display:flex;gap:8px;flex-wrap:wrap;">
                        <button class="btn btn-primary btn-sm" onclick="window._showCsvExportPanel()">⬇ CSV Export</button>
                        <button class="btn btn-outline btn-sm" onclick="window._showCsvImportModal()">⬆ CSV Import</button>
                    </div>
                </div>

                <!-- Report selector tabs -->
                <div class="report-tabs" style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px;padding:0 4px;">
                    <button class="btn btn-outline btn-sm report-tab active" data-report="account-balances" onclick="window._selectReport('account-balances', this)">💰 Account Balances</button>
                    <button class="btn btn-outline btn-sm report-tab" data-report="transaction-summary" onclick="window._selectReport('transaction-summary', this)">↔ Transaction Summary</button>
                    <button class="btn btn-outline btn-sm report-tab" data-report="branch-activity" onclick="window._selectReport('branch-activity', this)">📍 Branch Activity</button>
                    <button class="btn btn-outline btn-sm report-tab" data-report="loan-repayments" onclick="window._selectReport('loan-repayments', this)">💵 Loan Repayments</button>
                    <button class="btn btn-outline btn-sm report-tab" data-report="customer-accounts" onclick="window._selectReport('customer-accounts', this)">👤 Customer Accounts</button>
                </div>

                <!-- Filters area -->
                <div id="report-filters" style="display:none;margin-bottom:16px;padding:8px;background:var(--bg-secondary,#f8f9fa);border-radius:8px;"></div>

                <!-- Report content -->
                <div id="report-content">
                    <div class="loading-container"><div class="spinner"></div></div>
                </div>
            </div>
        `;

        // Load initial report
        window._selectReport('account-balances', main.querySelector('.report-tab.active'));
    };

    // ========== Report Selection ==========

    window._selectReport = function (reportName, btnEl) {
        // Update active tab
        document.querySelectorAll('.report-tab').forEach(b => b.classList.remove('active'));
        if (btnEl) btnEl.classList.add('active');

        currentReport = reportName;
        const filtersEl = document.getElementById('report-filters');
        const contentEl = document.getElementById('report-content');

        // Show filters for specific reports
        if (reportName === 'transaction-summary') {
            filtersEl.style.display = 'block';
            filtersEl.innerHTML = `
                <div style="display:flex;gap:12px;align-items:flex-end;flex-wrap:wrap;">
                    <div class="form-group" style="margin:0;">
                        <label for="rpt-start">Start Date</label>
                        <input type="date" id="rpt-start" class="form-control" style="width:auto;">
                    </div>
                    <div class="form-group" style="margin:0;">
                        <label for="rpt-end">End Date</label>
                        <input type="date" id="rpt-end" class="form-control" style="width:auto;">
                    </div>
                    <button class="btn btn-primary btn-sm" onclick="window._loadTransactionSummary()">Apply Filter</button>
                    <button class="btn btn-outline btn-sm" onclick="document.getElementById('rpt-start').value='';document.getElementById('rpt-end').value='';window._loadTransactionSummary()">Clear</button>
                </div>
            `;
        } else if (reportName === 'customer-accounts') {
            filtersEl.style.display = 'block';
            filtersEl.innerHTML = `
                <div style="display:flex;gap:12px;align-items:flex-end;flex-wrap:wrap;">
                    <div class="form-group" style="margin:0;">
                        <label for="rpt-customer">Customer</label>
                        <select id="rpt-customer" class="form-control" style="width:auto;min-width:200px;">
                            <option value="">Loading...</option>
                        </select>
                    </div>
                    <button class="btn btn-primary btn-sm" onclick="window._loadCustomerAccounts()">View Report</button>
                </div>
            `;
            _loadCustomerDropdown();
        } else {
            filtersEl.style.display = 'none';
            filtersEl.innerHTML = '';
        }

        // Load the report data
        _fetchReport(reportName);
    };

    async function _loadCustomerDropdown() {
        try {
            const res = await apiGet('/customers');
            const customers = res.data || res;
            const sel = document.getElementById('rpt-customer');
            if (!sel) return;
            sel.innerHTML = '<option value="">-- Select Customer --</option>';
            (Array.isArray(customers) ? customers : []).forEach(c => {
                const name = escapeHtml((c.firstName || '') + ' ' + (c.lastName || '')).trim();
                sel.innerHTML += `<option value="${c.customerId}">${name} (ID: ${c.customerId})</option>`;
            });
        } catch (e) {
            const sel = document.getElementById('rpt-customer');
            if (sel) sel.innerHTML = '<option value="">Failed to load customers</option>';
        }
    }

    async function _fetchReport(reportName) {
        const contentEl = document.getElementById('report-content');
        if (!contentEl) return;
        showLoading(contentEl);

        try {
            let endpoint;
            switch (reportName) {
                case 'account-balances':
                    endpoint = '/reports/account-balances';
                    break;
                case 'transaction-summary':
                    return window._loadTransactionSummary();
                case 'branch-activity':
                    endpoint = '/reports/branch-activity';
                    break;
                case 'loan-repayments':
                    endpoint = '/reports/loan-repayments';
                    break;
                case 'customer-accounts':
                    return; // Wait for customer selection
                default:
                    contentEl.innerHTML = '<div class="empty-state"><p>Unknown report type.</p></div>';
                    return;
            }

            const res = await apiGet(endpoint);
            const data = res.data || res;
            currentReportData = data;
            _renderReportTable(data, contentEl);
        } catch (e) {
            showErrorState(contentEl, 'Failed to load report: ' + (e.message || e), () => _fetchReport(reportName));
        }
    }

    window._loadTransactionSummary = async function () {
        const contentEl = document.getElementById('report-content');
        if (!contentEl) return;
        showLoading(contentEl);

        try {
            const startVal = document.getElementById('rpt-start')?.value || '';
            const endVal = document.getElementById('rpt-end')?.value || '';
            let params = [];
            if (startVal) params.push('start=' + startVal);
            if (endVal) params.push('end=' + endVal);
            const qs = params.length > 0 ? '?' + params.join('&') : '';

            const res = await apiGet('/reports/transaction-summary' + qs);
            const data = res.data || res;
            currentReportData = data;
            _renderReportTable(data, contentEl);
        } catch (e) {
            showErrorState(contentEl, 'Failed to load transaction summary: ' + (e.message || e));
        }
    };

    window._loadCustomerAccounts = async function () {
        const contentEl = document.getElementById('report-content');
        if (!contentEl) return;
        const custId = document.getElementById('rpt-customer')?.value;

        if (!custId) {
            contentEl.innerHTML = '<div class="empty-state"><div class="empty-state-icon">👤</div><p>Please select a customer to view their accounts.</p></div>';
            return;
        }

        showLoading(contentEl);
        try {
            const res = await apiGet('/reports/customer-accounts/' + custId);
            const data = res.data || res;
            currentReportData = data;
            _renderReportTable(data, contentEl);
        } catch (e) {
            showErrorState(contentEl, 'Failed to load customer account report: ' + (e.message || e));
        }
    };

    // ========== Report Rendering ==========

    function _renderReportTable(data, containerEl) {
        if (!data || !data.headers) {
            containerEl.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📄</div><p>No report data available.</p></div>';
            return;
        }

        const rows = data.rows || [];
        const title = data.title || data.reportType || 'Report';
        const generatedAt = data.generatedAt ? formatDateTime(data.generatedAt) : new Date().toLocaleString('en-GB');

        // Summary cards for numeric columns
        const summaryHtml = _buildSummaryCards(data);

        // Build table
        let tableHtml = '';
        if (rows.length === 0) {
            tableHtml = '<div class="empty-state"><div class="empty-state-icon">📄</div><p>No data found for this report.</p></div>';
        } else {
            tableHtml = '<div class="table-responsive"><table class="table"><thead><tr>';
            data.headers.forEach(h => {
                tableHtml += `<th>${escapeHtml(h)}</th>`;
            });
            tableHtml += '</tr></thead><tbody>';
            rows.forEach(row => {
                tableHtml += '<tr>';
                data.headers.forEach(h => {
                    const val = row[h];
                    tableHtml += `<td>${_formatReportCell(h, val)}</td>`;
                });
                tableHtml += '</tr>';
            });
            tableHtml += '</tbody></table></div>';
        }

        containerEl.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:8px;">
                <div>
                    <h3 style="margin:0;">${escapeHtml(title)}</h3>
                    <small style="color:var(--text-muted,#6c757d);">Generated: ${generatedAt} | ${rows.length} record${rows.length !== 1 ? 's' : ''}</small>
                </div>
                <button class="btn btn-outline btn-sm" onclick="window._exportCurrentReport()" ${rows.length === 0 ? 'disabled' : ''}>⬇ Export as CSV</button>
            </div>
            ${summaryHtml}
            ${tableHtml}
        `;
    }

    function _buildSummaryCards(data) {
        const rows = data.rows || [];
        if (rows.length === 0) return '';

        const rt = data.reportType || '';
        let cards = [];

        if (rt === 'ACCOUNT_BALANCES') {
            const total = rows.reduce((s, r) => s + (Number(r.Balance) || 0), 0);
            const active = rows.filter(r => r.Status === 'ACTIVE').length;
            cards = [
                { label: 'Total Accounts', value: rows.length, icon: '🏦' },
                { label: 'Active Accounts', value: active, icon: '✅' },
                { label: 'Total Balance', value: formatCurrency(total), icon: '💰' }
            ];
        } else if (rt === 'TRANSACTION_SUMMARY') {
            const totalTxn = rows.reduce((s, r) => s + (Number(r.TxnCount) || 0), 0);
            const totalAmt = rows.reduce((s, r) => s + (Number(r.TotalAmount) || 0), 0);
            cards = [
                { label: 'Transaction Types', value: rows.length, icon: '📊' },
                { label: 'Total Transactions', value: totalTxn, icon: '↔' },
                { label: 'Total Volume', value: formatCurrency(totalAmt), icon: '💵' }
            ];
        } else if (rt === 'BRANCH_ACTIVITY') {
            const totalAccts = rows.reduce((s, r) => s + (Number(r.Accounts) || 0), 0);
            const totalTxn = rows.reduce((s, r) => s + (Number(r.TxnCount) || 0), 0);
            const totalVol = rows.reduce((s, r) => s + (Number(r.TxnVolume) || 0), 0);
            cards = [
                { label: 'Branches', value: rows.length, icon: '📍' },
                { label: 'Total Accounts', value: totalAccts, icon: '🏦' },
                { label: 'Total Transactions', value: totalTxn, icon: '↔' },
                { label: 'Transaction Volume', value: formatCurrency(totalVol), icon: '💵' }
            ];
        } else if (rt === 'LOAN_REPAYMENT') {
            const totalPrincipal = rows.reduce((s, r) => s + (Number(r.Principal) || 0), 0);
            const totalOutstanding = rows.reduce((s, r) => s + (Number(r.Outstanding) || 0), 0);
            const totalPaid = rows.reduce((s, r) => s + (Number(r.TotalPaid) || 0), 0);
            const activeLoans = rows.filter(r => r.Status === 'ACTIVE').length;
            cards = [
                { label: 'Total Loans', value: rows.length, icon: '📋' },
                { label: 'Active Loans', value: activeLoans, icon: '✅' },
                { label: 'Total Principal', value: formatCurrency(totalPrincipal), icon: '💰' },
                { label: 'Outstanding', value: formatCurrency(totalOutstanding), icon: '⚠️' },
                { label: 'Total Repaid', value: formatCurrency(totalPaid), icon: '✓' }
            ];
        } else if (rt === 'CUSTOMER_ACCOUNTS') {
            const total = rows.reduce((s, r) => s + (Number(r.Balance) || 0), 0);
            cards = [
                { label: 'Accounts', value: rows.length, icon: '🏦' },
                { label: 'Total Balance', value: formatCurrency(total), icon: '💰' }
            ];
        }

        if (cards.length === 0) return '';

        let html = '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;margin-bottom:16px;">';
        cards.forEach(c => {
            html += `
                <div class="card" style="padding:12px;text-align:center;margin:0;">
                    <div style="font-size:1.5rem;">${c.icon}</div>
                    <div style="font-size:1.2rem;font-weight:600;">${typeof c.value === 'string' ? c.value : c.value}</div>
                    <div style="font-size:0.8rem;color:var(--text-muted,#6c757d);">${escapeHtml(c.label)}</div>
                </div>
            `;
        });
        html += '</div>';
        return html;
    }

    function _formatReportCell(header, value) {
        if (value === null || value === undefined) return '<span style="color:var(--text-muted,#999);">-</span>';

        const h = header.toLowerCase();
        // Currency columns
        if (['balance', 'totalamount', 'txnvolume', 'principal', 'outstanding', 'totalpaid'].includes(h)) {
            return formatCurrency(Number(value));
        }
        // Status columns
        if (['status'].includes(h)) {
            return getStatusBadge(String(value));
        }
        // Numeric count columns
        if (['txncount', 'accounts', 'payments'].includes(h)) {
            return `<strong>${escapeHtml(String(value))}</strong>`;
        }
        return escapeHtml(String(value));
    }

    // ========== Export Current Report as CSV ==========

    window._exportCurrentReport = function () {
        if (!currentReportData || !currentReportData.headers || !currentReportData.rows || currentReportData.rows.length === 0) {
            showToast('No report data to export', 'error');
            return;
        }

        const headers = currentReportData.headers;
        const rows = currentReportData.rows;

        let csv = headers.join(',') + '\r\n';
        rows.forEach(row => {
            const line = headers.map(h => {
                let v = row[h];
                if (v === null || v === undefined) return '';
                v = String(v);
                if (v.includes(',') || v.includes('"') || v.includes('\n')) {
                    return '"' + v.replace(/"/g, '""') + '"';
                }
                return v;
            }).join(',');
            csv += line + '\r\n';
        });

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = (currentReportData.reportType || 'report').toLowerCase() + '_' + new Date().toISOString().slice(0, 10) + '.csv';
        a.click();
        URL.revokeObjectURL(url);
        showToast('Report exported successfully', 'success');
    };

    // ========== CSV Export Panel ==========

    window._showCsvExportPanel = function () {
        const entities = [
            { key: 'banks', label: 'Banks', icon: '🏛' },
            { key: 'branches', label: 'Branches', icon: '📍' },
            { key: 'customers', label: 'Customers', icon: '👤' },
            { key: 'employees', label: 'Employees', icon: '👥' },
            { key: 'accounts', label: 'Accounts', icon: '💳' },
            { key: 'transactions', label: 'Transactions', icon: '↔' },
            { key: 'loans', label: 'Loans', icon: '💵' }
        ];

        let body = '<p style="margin-bottom:12px;">Download data from the database as CSV files.</p>';
        body += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:10px;">';
        entities.forEach(e => {
            body += `
                <button class="btn btn-outline" style="display:flex;align-items:center;gap:8px;justify-content:center;padding:12px;"
                        onclick="window._downloadCsvExport('${e.key}', '${e.label}')">
                    <span style="font-size:1.2rem;">${e.icon}</span>
                    <span>${escapeHtml(e.label)}</span>
                </button>
            `;
        });
        body += '</div>';

        showModal('CSV Export', body, '<button class="btn btn-outline" onclick="closeModal()">Close</button>');
    };

    window._downloadCsvExport = async function (entity, label) {
        try {
            showToast('Downloading ' + label + '...', 'info');
            const response = await fetch('/api/csv/export/' + entity, {
                method: 'GET',
                headers: { 'Accept': 'text/csv' }
            });

            if (response.status === 401) {
                window.location.href = '/login';
                return;
            }
            if (response.status === 403) {
                showToast('Access Denied: You do not have permission to export ' + label, 'error');
                return;
            }
            if (!response.ok) {
                let msg = 'Export failed';
                try { const err = await response.json(); msg = err.message || msg; } catch (e) {}
                showToast(msg, 'error');
                return;
            }

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = entity + '.csv';
            a.click();
            URL.revokeObjectURL(url);
            showToast(label + ' exported successfully', 'success');
        } catch (e) {
            showToast('Export failed: ' + (e.message || e), 'error');
        }
    };

    // ========== CSV Import Modal ==========

    window._showCsvImportModal = function () {
        const importEntities = [
            { key: 'banks', label: 'Banks', role: 'ADMIN' },
            { key: 'branches', label: 'Branches', role: 'ADMIN' },
            { key: 'customers', label: 'Customers', role: 'ADMIN/STAFF' },
            { key: 'employees', label: 'Employees', role: 'ADMIN' }
        ];

        let body = `
            <p style="margin-bottom:12px;">Upload a CSV file to import records into the database. The first row must be the header row.</p>
            <div class="form-group">
                <label for="import-entity">Entity Type</label>
                <select id="import-entity" class="form-control">
                    <option value="">-- Select Entity --</option>
                    ${importEntities.map(e => `<option value="${e.key}">${e.label} (${e.role})</option>`).join('')}
                </select>
            </div>
            <div class="form-group">
                <label for="import-file">CSV File</label>
                <input type="file" id="import-file" class="form-control" accept=".csv,text/csv">
            </div>
            <div id="import-template-info" style="display:none;margin-top:8px;padding:10px;background:var(--bg-secondary,#f1f3f5);border-radius:6px;font-size:0.85rem;"></div>
            <div id="import-result" style="display:none;margin-top:12px;"></div>
        `;

        const footer = `
            <button class="btn btn-outline" onclick="closeModal()">Close</button>
            <button class="btn btn-primary" id="import-submit-btn" onclick="window._submitCsvImport()">Import</button>
        `;

        showModal('CSV Import', body, footer);

        // Show template info on entity change
        document.getElementById('import-entity').addEventListener('change', function () {
            const info = document.getElementById('import-template-info');
            const templates = {
                banks: 'Required columns: <strong>BankName</strong>. Optional: HeadOffice, ContactNo, Email',
                branches: 'Required columns: <strong>BranchName, BankName</strong>. Optional: IFSCCode, City, State, Pincode, Address, ContactNumber, Email',
                customers: 'Required columns: <strong>Email</strong>. Optional: FirstName, LastName, Phone, Dob (yyyy-MM-dd), KycStatus (PENDING/VERIFIED/REJECTED), Gender (MALE/FEMALE/OTHER), Address',
                employees: 'Required columns: <strong>FirstName, Email</strong>. Optional: LastName, Designation, Salary, Phone, BranchId, JoinDate (yyyy-MM-dd)'
            };
            if (templates[this.value]) {
                info.style.display = 'block';
                info.innerHTML = '📋 ' + templates[this.value];
            } else {
                info.style.display = 'none';
            }
            // Clear previous results
            document.getElementById('import-result').style.display = 'none';
        });
    };

    window._submitCsvImport = async function () {
        const entity = document.getElementById('import-entity')?.value;
        const fileInput = document.getElementById('import-file');
        const resultDiv = document.getElementById('import-result');
        const submitBtn = document.getElementById('import-submit-btn');

        if (!entity) {
            showToast('Please select an entity type', 'error');
            return;
        }
        if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
            showToast('Please select a CSV file', 'error');
            return;
        }

        const file = fileInput.files[0];
        if (!file.name.toLowerCase().endsWith('.csv') && file.type !== 'text/csv') {
            showToast('Please select a valid CSV file', 'error');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            showToast('File is too large. Maximum size is 5MB.', 'error');
            return;
        }

        // Disable submit while processing
        submitBtn.disabled = true;
        submitBtn.textContent = 'Importing...';
        resultDiv.style.display = 'block';
        resultDiv.innerHTML = '<div class="loading-container"><div class="spinner"></div></div>';

        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch('/api/csv/import/' + entity, {
                method: 'POST',
                body: formData
            });

            if (response.status === 401) {
                window.location.href = '/login';
                return;
            }

            const result = await response.json();

            if (response.ok && result.success) {
                const data = result.data || {};
                const total = data.totalRows || 0;
                const success = data.successCount || 0;
                const errorCount = data.errorCount || 0;
                const errors = data.errors || [];

                let html = `
                    <div style="padding:12px;border-radius:8px;background:${errorCount === 0 ? '#d4edda' : (success > 0 ? '#fff3cd' : '#f8d7da')};">
                        <h4 style="margin:0 0 8px 0;">${errorCount === 0 ? '✅ Import Successful' : (success > 0 ? '⚠️ Partial Import' : '❌ Import Failed')}</h4>
                        <p style="margin:4px 0;">Total rows processed: <strong>${total}</strong></p>
                        <p style="margin:4px 0;">Successfully imported: <strong>${success}</strong></p>
                        <p style="margin:4px 0;">Errors: <strong>${errorCount}</strong></p>
                `;

                if (errors.length > 0) {
                    html += '<details style="margin-top:8px;"><summary style="cursor:pointer;font-weight:600;">View Errors</summary><ul style="margin:8px 0;padding-left:20px;">';
                    errors.forEach(err => {
                        html += `<li style="color:#721c24;margin:2px 0;">${escapeHtml(String(err))}</li>`;
                    });
                    html += '</ul></details>';
                }
                html += '</div>';
                resultDiv.innerHTML = html;

                if (success > 0) {
                    showToast(`Imported ${success} ${entity} record(s) successfully`, 'success');
                }
            } else {
                const msg = result.message || 'Import failed';
                let html = `<div style="padding:12px;border-radius:8px;background:#f8d7da;">
                    <h4 style="margin:0 0 8px 0;">❌ Import Failed</h4>
                    <p>${escapeHtml(msg)}</p>`;
                if (result.data && Array.isArray(result.data)) {
                    html += '<ul style="margin:8px 0;padding-left:20px;">';
                    result.data.forEach(err => {
                        html += `<li style="color:#721c24;">${escapeHtml(String(err))}</li>`;
                    });
                    html += '</ul>';
                }
                html += '</div>';
                resultDiv.innerHTML = html;
                showToast(msg, 'error');
            }
        } catch (e) {
            resultDiv.innerHTML = `<div style="padding:12px;border-radius:8px;background:#f8d7da;">
                <h4 style="margin:0;">❌ Error</h4>
                <p>${escapeHtml(e.message || 'An unexpected error occurred')}</p>
            </div>`;
            showToast('Import failed: ' + (e.message || e), 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Import';
        }
    };

})();
