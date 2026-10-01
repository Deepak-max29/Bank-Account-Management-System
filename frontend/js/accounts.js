// js/accounts.js - Bank Accounts Management with Status Changes, Details & Account Opening

let allAccounts = [];
let filteredAccounts = [];
let accountSearchQuery = '';
let accountStatusFilter = 'ALL';
let accountTypeFilter = 'ALL';

window.loadAccounts = async () => {
    const container = document.getElementById('main-content');
    container.innerHTML = `
        <div class="page-header mb-2">
            <div>
                <h2 class="page-title">Accounts Management</h2>
                <p class="text-muted">Manage savings, current, and retail accounts, update operational statuses, and view balances</p>
            </div>
            <div class="action-buttons-group">
                <button class="btn btn-outline" onclick="exportAccountsCsv()">
                    <span>📥</span> Export CSV
                </button>
                <button class="btn btn-primary" onclick="openAccountModal()">
                    <span>+</span> Open New Account
                </button>
            </div>
        </div>

        <!-- Filter & Search Bar -->
        <div class="filter-bar card mb-2">
            <div class="filter-grid">
                <div class="search-box">
                    <span class="search-icon">🔍</span>
                    <input type="text" id="acc-search-input" class="search-input" 
                        placeholder="Search by account number, customer, branch, or type..." 
                        oninput="onAccountSearch(this.value)">
                </div>
                <div class="filter-select-group">
                    <label for="acc-status-filter" class="filter-label">Status:</label>
                    <select id="acc-status-filter" class="select-control" onchange="onAccountStatusFilter(this.value)">
                        <option value="ALL">All Statuses</option>
                        <option value="ACTIVE">ACTIVE</option>
                        <option value="FROZEN">FROZEN</option>
                        <option value="INACTIVE">INACTIVE</option>
                        <option value="CLOSED">CLOSED</option>
                    </select>
                </div>
                <div class="filter-select-group">
                    <label for="acc-type-filter" class="filter-label">Type:</label>
                    <select id="acc-type-filter" class="select-control" onchange="onAccountTypeFilter(this.value)">
                        <option value="ALL">All Types</option>
                        <option value="SAVINGS">SAVINGS</option>
                        <option value="CURRENT">CURRENT</option>
                    </select>
                </div>
                <div class="filter-stats" id="acc-count-badge">
                    <span class="badge badge-neutral">Loading...</span>
                </div>
            </div>
        </div>

        <!-- Accounts Table Card -->
        <div class="card card-premium">
            <div id="accounts-table-container">
                <div class="loading-state">
                    <div class="spinner"></div>
                    <p class="mt-1 text-muted">Retrieving accounts from ledger...</p>
                </div>
            </div>
        </div>
    `;

    fetchAccounts();
};

const fetchAccounts = async () => {
    const container = document.getElementById('accounts-table-container');
    if (!container) return;

    try {
        const res = await apiGet('/accounts');
        const list = Array.isArray(res) ? res : (res && res.data ? res.data : []);
        allAccounts = list;
        applyAccountFilters();
    } catch (error) {
        showErrorState(container, 'Failed to retrieve accounts: ' + (error.message || 'Server error'), fetchAccounts);
    }
};

window.onAccountSearch = (query) => {
    accountSearchQuery = (query || '').trim().toLowerCase();
    applyAccountFilters();
};

window.onAccountStatusFilter = (status) => {
    accountStatusFilter = status;
    applyAccountFilters();
};

window.onAccountTypeFilter = (type) => {
    accountTypeFilter = type;
    applyAccountFilters();
};

function applyAccountFilters() {
    filteredAccounts = allAccounts.filter(a => {
        if (accountStatusFilter !== 'ALL' && (a.status || '').toUpperCase() !== accountStatusFilter) {
            return false;
        }
        if (accountTypeFilter !== 'ALL' && (a.accountType || '').toUpperCase() !== accountTypeFilter) {
            return false;
        }
        if (accountSearchQuery) {
            const accNo = String(a.accountNo || '');
            const cust = (a.customerName || '').toLowerCase();
            const branch = (a.branchName || '').toLowerCase();
            const type = (a.accountType || '').toLowerCase();
            const custId = String(a.customerId || '');

            return accNo.includes(accountSearchQuery) ||
                   cust.includes(accountSearchQuery) ||
                   branch.includes(accountSearchQuery) ||
                   type.includes(accountSearchQuery) ||
                   custId.includes(accountSearchQuery);
        }
        return true;
    });

    renderAccountsTable();
}

function renderAccountsTable() {
    const container = document.getElementById('accounts-table-container');
    const badgeEl = document.getElementById('acc-count-badge');

    if (badgeEl) {
        badgeEl.innerHTML = `<span class="badge badge-accent">${filteredAccounts.length} of ${allAccounts.length} Accounts</span>`;
    }

    if (!filteredAccounts || filteredAccounts.length === 0) {
        if (allAccounts.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <span class="empty-icon">💳</span>
                    <h3>No Bank Accounts Found</h3>
                    <p class="text-muted mt-1">Open a new retail account to get started.</p>
                    <button class="btn btn-primary mt-2" onclick="openAccountModal()">+ Open First Account</button>
                </div>
            `;
        } else {
            container.innerHTML = `
                <div class="empty-state">
                    <span class="empty-icon">🔍</span>
                    <h3>No Matching Accounts</h3>
                    <p class="text-muted mt-1">No accounts match your current search query "${escapeHtml(accountSearchQuery)}".</p>
                    <button class="btn btn-outline btn-sm mt-1" onclick="clearAccountFilters()">Reset Filters</button>
                </div>
            `;
        }
        return;
    }

    const rows = filteredAccounts.map(a => {
        const accNo = a.accountNo;
        const custName = escapeHtml(a.customerName || (a.customerId ? `Customer #${a.customerId}` : 'Unknown'));
        const branchName = escapeHtml(a.branchName || (a.branchId ? `Branch #${a.branchId}` : 'Main'));
        const type = (a.accountType || 'SAVINGS').toUpperCase();
        const balance = formatCurrency(a.balance);
        const openedDate = a.openedDate || a.openDate ? (a.openedDate || a.openDate).split('T')[0] : '-';
        const status = (a.status || 'ACTIVE').toUpperCase();

        let statusBadge = '';
        if (status === 'ACTIVE') {
            statusBadge = '<span class="badge badge-success">ACTIVE</span>';
        } else if (status === 'FROZEN') {
            statusBadge = '<span class="badge badge-warning">FROZEN</span>';
        } else if (status === 'CLOSED') {
            statusBadge = '<span class="badge badge-danger">CLOSED</span>';
        } else {
            statusBadge = `<span class="badge badge-neutral">${escapeHtml(status)}</span>`;
        }

        const safeAccountJson = JSON.stringify(a).replace(/'/g, "&#39;");

        return `
            <tr>
                <td class="font-mono font-medium text-accent">#${accNo}</td>
                <td>
                    <div class="font-medium">${custName}</div>
                    <div class="text-xs text-muted">Cust ID: ${a.customerId || '-'}</div>
                </td>
                <td>
                    <div class="font-medium">${branchName}</div>
                    <div class="text-xs text-muted">Branch ID: ${a.branchId || '-'}</div>
                </td>
                <td><span class="badge badge-neutral">${type}</span></td>
                <td class="font-semibold font-mono">${balance}</td>
                <td class="text-sm text-muted">${openedDate}</td>
                <td>${statusBadge}</td>
                <td>
                    <div class="action-btn-group">
                        <button class="btn btn-sm btn-outline" onclick='viewAccountDetails(${safeAccountJson})' title="View Details">
                            View
                        </button>
                        <button class="btn btn-sm btn-outline" onclick="openChangeStatusModal(${accNo}, '${status}')" title="Change Status">
                            Status
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    container.innerHTML = `
        <div class="table-responsive">
            <table class="table-modern">
                <thead>
                    <tr>
                        <th>Account No</th>
                        <th>Account Holder</th>
                        <th>Branch</th>
                        <th>Type</th>
                        <th>Current Balance</th>
                        <th>Opened Date</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows}
                </tbody>
            </table>
        </div>
    `;
}

window.clearAccountFilters = () => {
    accountSearchQuery = '';
    accountStatusFilter = 'ALL';
    accountTypeFilter = 'ALL';
    const input = document.getElementById('acc-search-input');
    if (input) input.value = '';
    const selStatus = document.getElementById('acc-status-filter');
    if (selStatus) selStatus.value = 'ALL';
    const selType = document.getElementById('acc-type-filter');
    if (selType) selType.value = 'ALL';
    applyAccountFilters();
};

// Open New Account Modal
window.openAccountModal = async () => {
    let customers = [];
    let branches = [];

    try {
        const [cRes, bRes] = await Promise.all([
            apiGet('/customers'),
            apiGet('/branches')
        ]);
        customers = Array.isArray(cRes) ? cRes : (cRes && cRes.data ? cRes.data : []);
        branches = Array.isArray(bRes) ? bRes : (bRes && bRes.data ? bRes.data : []);
    } catch (e) {
        showToast('Failed to load customers or branches list', 'error');
    }

    const custOptions = customers.map(c => 
        `<option value="${c.customerId}">${escapeHtml(`${c.firstName || ''} ${c.lastName || ''}`.trim())} (ID: ${c.customerId}, ${c.email || ''})</option>`
    ).join('');

    const branchOptions = branches.map(b => 
        `<option value="${b.branchId}">${escapeHtml(b.branchName || '')} (${b.ifscCode || ''} - ${b.city || ''})</option>`
    ).join('');

    const body = `
        <form id="account-open-form" class="modal-form-grid" onsubmit="event.preventDefault(); submitOpenAccount();">
            <div class="form-group full-width">
                <label for="acc-customer-select">Select Customer <span class="required">*</span></label>
                <select id="acc-customer-select" class="form-control" required>
                    <option value="">-- Choose Account Holder --</option>
                    ${custOptions}
                </select>
            </div>

            <div class="form-group full-width">
                <label for="acc-branch-select">Select Branch <span class="required">*</span></label>
                <select id="acc-branch-select" class="form-control" required>
                    <option value="">-- Choose Branch --</option>
                    ${branchOptions}
                </select>
            </div>

            <div class="form-group">
                <label for="acc-type-select">Account Type <span class="required">*</span></label>
                <select id="acc-type-select" class="form-control" required>
                    <option value="SAVINGS">SAVINGS</option>
                    <option value="CURRENT">CURRENT</option>
                </select>
            </div>

            <div class="form-group">
                <label for="acc-initial-deposit">Initial Deposit (₹) <span class="required">*</span></label>
                <input type="number" id="acc-initial-deposit" class="form-control" 
                    step="0.01" min="0" value="1000.00" required placeholder="Minimum deposit">
                <small class="field-hint">Initial balance credited to account</small>
            </div>
        </form>
    `;

    const footer = `
        <button type="button" class="btn btn-outline" onclick="closeModal()">Cancel</button>
        <button type="button" class="btn btn-primary" onclick="submitOpenAccount()">Open Account</button>
    `;

    showModal('Open New Bank Account', body, footer);
};

window.submitOpenAccount = async () => {
    const custId = document.getElementById('acc-customer-select').value;
    const branchId = document.getElementById('acc-branch-select').value;
    const type = document.getElementById('acc-type-select').value;
    const deposit = document.getElementById('acc-initial-deposit').value;

    if (!custId || !branchId || !type) {
        showToast('Please select customer, branch, and account type.', 'warning');
        return;
    }

    const payload = {
        customerId: Number(custId),
        branchId: Number(branchId),
        accountType: type,
        initialDeposit: Number(deposit || 0)
    };

    try {
        await apiPost('/accounts', payload);
        showToast('Account opened successfully!', 'success');
        closeModal();
        fetchAccounts();
    } catch (e) {}
};

// Change Status Modal
window.openChangeStatusModal = (accountNo, currentStatus) => {
    const body = `
        <div>
            <p>Update operational status for Account <strong>#${accountNo}</strong>:</p>
            <div class="form-group mt-2">
                <label for="acc-new-status">Operational Status</label>
                <select id="acc-new-status" class="form-control">
                    <option value="ACTIVE" ${currentStatus === 'ACTIVE' ? 'selected' : ''}>ACTIVE - Normal Banking Operations</option>
                    <option value="FROZEN" ${currentStatus === 'FROZEN' ? 'selected' : ''}>FROZEN - Restrict Debits & Withdrawals</option>
                    <option value="CLOSED" ${currentStatus === 'CLOSED' ? 'selected' : ''}>CLOSED - Account Terminated</option>
                </select>
            </div>
        </div>
    `;

    const footer = `
        <button class="btn btn-outline" onclick="closeModal()">Cancel</button>
        <button class="btn btn-primary" onclick="submitAccountStatusChange(${accountNo})">Update Status</button>
    `;

    showModal('Change Account Status', body, footer);
};

window.submitAccountStatusChange = async (accountNo) => {
    const status = document.getElementById('acc-new-status').value;
    try {
        await apiPatch(`/accounts/${accountNo}/status?status=${status}`);
        showToast(`Account #${accountNo} status updated to ${status}`, 'success');
        closeModal();
        fetchAccounts();
    } catch (e) {}
};

// View Account Details Modal
window.viewAccountDetails = async (account) => {
    const accNo = account.accountNo;
    showModal(`Account #${accNo} Details`, `<div class="loading-state"><div class="spinner"></div></div>`, '');

    let txns = [];
    try {
        const res = await apiGet(`/transactions/account/${accNo}`);
        txns = Array.isArray(res) ? res : (res && res.data ? res.data : []);
    } catch (e) {}

    const txnRows = txns.slice(0, 5).map(t => `
        <tr>
            <td class="font-mono text-xs">#${t.txnId}</td>
            <td><span class="badge ${t.txnType === 'DEPOSIT' ? 'badge-success' : (t.txnType === 'WITHDRAWAL' ? 'badge-danger' : 'badge-purple')}">${t.txnType}</span></td>
            <td class="font-mono text-sm">${formatCurrency(t.amount)}</td>
            <td class="text-xs text-muted">${t.txnDate ? formatDateTime(t.txnDate) : '-'}</td>
        </tr>
    `).join('');

    const body = `
        <div class="account-details-modal">
            <div class="detail-card-header mb-2">
                <div class="balance-display">
                    <span class="text-xs text-muted uppercase">Available Balance</span>
                    <h2 class="font-bold text-accent">${formatCurrency(account.balance)}</h2>
                </div>
                <div class="status-display">
                    <span class="badge ${account.status === 'ACTIVE' ? 'badge-success' : 'badge-warning'}">${account.status}</span>
                </div>
            </div>

            <div class="detail-grid mb-2">
                <div class="detail-item"><span class="label">Account Number:</span> <strong>#${account.accountNo}</strong></div>
                <div class="detail-item"><span class="label">Account Type:</span> <strong>${account.accountType}</strong></div>
                <div class="detail-item"><span class="label">Account Holder:</span> <strong>${escapeHtml(account.customerName || 'Cust #' + account.customerId)}</strong></div>
                <div class="detail-item"><span class="label">Branch Name:</span> <strong>${escapeHtml(account.branchName || 'Branch #' + account.branchId)}</strong></div>
                <div class="detail-item"><span class="label">Opened Date:</span> <strong>${account.openedDate || account.openDate || '-'}</strong></div>
            </div>

            <h4 class="font-medium text-sm mb-1">Recent Account Transactions:</h4>
            ${txns.length > 0 ? `
                <table class="table-modern text-xs">
                    <thead><tr><th>ID</th><th>Type</th><th>Amount</th><th>Date</th></tr></thead>
                    <tbody>${txnRows}</tbody>
                </table>
            ` : '<p class="text-muted text-xs">No recent transactions for this account.</p>'}
        </div>
    `;

    const footer = `
        <button class="btn btn-outline" onclick="closeModal()">Close</button>
        <a href="#transactions" class="btn btn-primary" onclick="closeModal()">Process Transaction</a>
    `;

    showModal(`Account #${accNo} Overview`, body, footer);
};

// CSV Export
window.exportAccountsCsv = () => {
    window.location.href = '/api/csv/export/accounts';
};
