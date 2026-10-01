// js/auditLogs.js

let allAuditLogs = [];
let auditCurrentPage = 1; // 1-based page index for backend API
let auditPageSize = 15;
let auditTotalPages = 1;
let auditTotalElements = 0;

window.loadAuditLogs = async () => {
    const container = document.getElementById('main-content');
    container.innerHTML = `
        <div class="page-header">
            <div>
                <h2>Audit Logs</h2>
                <small class="text-light" style="font-size: 0.85rem;">🔒 Immutable security & transaction audit trail (Admin & Manager)</small>
            </div>
            <button class="btn btn-outline btn-sm" onclick="fetchAuditLogs(1)" title="Refresh Audit Logs">↻ Refresh</button>
        </div>
        <div class="action-bar">
            <div class="search-wrapper" style="flex: 2;">
                <span class="search-icon">🔍</span>
                <input type="text" id="audit-search" placeholder="Search loaded logs by action, description, account, staff, IP..." oninput="filterLoadedAuditLogs()">
            </div>
            <div style="min-width: 180px; flex: 1;">
                <select id="audit-action-filter" onchange="onAuditFilterChange()">
                    <option value="">All Action Types</option>
                    <option value="APPLY_LOAN">APPLY_LOAN</option>
                    <option value="APPROVE_LOAN">APPROVE_LOAN</option>
                    <option value="REJECT_LOAN">REJECT_LOAN</option>
                    <option value="LOAN_PAYMENT">LOAN_PAYMENT</option>
                    <option value="ISSUE_CARD">ISSUE_CARD</option>
                    <option value="ACTIVATE_CARD">ACTIVATE_CARD</option>
                    <option value="BLOCK_CARD">BLOCK_CARD</option>
                    <option value="DEACTIVATE_CARD">DEACTIVATE_CARD</option>
                    <option value="EXPIRE_CARD">EXPIRE_CARD</option>
                    <option value="ADD_BENEFICIARY">ADD_BENEFICIARY</option>
                    <option value="UPDATE_BENEFICIARY">UPDATE_BENEFICIARY</option>
                    <option value="VERIFY_BENEFICIARY">VERIFY_BENEFICIARY</option>
                    <option value="DEACTIVATE_BENEFICIARY">DEACTIVATE_BENEFICIARY</option>
                    <option value="CREATE_EMPLOYEE">CREATE_EMPLOYEE</option>
                    <option value="UPDATE_EMPLOYEE">UPDATE_EMPLOYEE</option>
                    <option value="OPEN_ACCOUNT">OPEN_ACCOUNT</option>
                    <option value="DEPOSIT">DEPOSIT</option>
                    <option value="WITHDRAW">WITHDRAW</option>
                    <option value="TRANSFER">TRANSFER</option>
                </select>
            </div>
            <div style="min-width: 150px;">
                <input type="number" id="audit-account-filter" class="form-control" placeholder="Account #" onchange="onAuditFilterChange()">
            </div>
            <button class="btn btn-primary btn-sm" onclick="onAuditFilterChange()">Filter</button>
            <button class="btn btn-outline btn-sm" onclick="resetAuditFilters()">Reset</button>
        </div>
        <div class="card">
            <div id="audit-table-container"></div>
            <div id="audit-pagination-container" class="mt-2" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;"></div>
        </div>
    `;

    auditCurrentPage = 1;
    await fetchAuditLogs(1);
};

window.onAuditFilterChange = async () => {
    auditCurrentPage = 1;
    await fetchAuditLogs(1);
};

window.resetAuditFilters = async () => {
    const searchInput = document.getElementById('audit-search');
    const actionSelect = document.getElementById('audit-action-filter');
    const accInput = document.getElementById('audit-account-filter');

    if (searchInput) searchInput.value = '';
    if (actionSelect) actionSelect.value = '';
    if (accInput) accInput.value = '';

    auditCurrentPage = 1;
    await fetchAuditLogs(1);
};

const fetchAuditLogs = async (page = 1) => {
    auditCurrentPage = page;
    const tableContainer = document.getElementById('audit-table-container');
    const paginationContainer = document.getElementById('audit-pagination-container');
    if (!tableContainer) return;
    showLoading(tableContainer);
    if (paginationContainer) paginationContainer.innerHTML = '';

    const actionFilter = document.getElementById('audit-action-filter') ? document.getElementById('audit-action-filter').value.trim() : '';
    const accFilter = document.getElementById('audit-account-filter') ? document.getElementById('audit-account-filter').value.trim() : '';

    try {
        let endpoint = `/audit?page=${page}&size=${auditPageSize}`;

        if (actionFilter || accFilter) {
            endpoint = `/audit/filter?page=${page}&size=${auditPageSize}`;
            if (actionFilter) endpoint += `&action=${encodeURIComponent(actionFilter)}`;
            if (accFilter) endpoint += `&accountNo=${encodeURIComponent(accFilter)}`;
        }

        const res = await apiGet(endpoint);
        const pagedData = res && res.data ? res.data : (res && res.content ? res : { content: [], totalPages: 1, totalElements: 0, page: 1 });

        allAuditLogs = Array.isArray(pagedData.content) ? pagedData.content : (Array.isArray(pagedData) ? pagedData : []);
        auditTotalPages = pagedData.totalPages || 1;
        auditTotalElements = pagedData.totalElements != null ? pagedData.totalElements : allAuditLogs.length;

        renderAuditLogsTable(allAuditLogs);
        renderAuditPagination();
    } catch (error) {
        if (error.message === 'Forbidden') {
            tableContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon text-danger">🔒</div>
                    <h3 class="text-danger">Access Restricted</h3>
                    <p>Audit logs are confidential. Administrator or Manager role is required to view audit records.</p>
                </div>
            `;
        } else {
            showErrorState(tableContainer, error.message || 'Failed to load audit logs from server.', () => fetchAuditLogs(page));
        }
    }
};

window.filterLoadedAuditLogs = () => {
    const searchInput = document.getElementById('audit-search');
    const query = searchInput ? searchInput.value.trim().toLowerCase() : '';

    if (!query) {
        renderAuditLogsTable(allAuditLogs);
        return;
    }

    const filtered = allAuditLogs.filter(log => {
        const idStr = String(log.logId || '');
        const actionStr = (log.actionType || '').toLowerCase();
        const descStr = (log.description || log.details || '').toLowerCase();
        const accStr = String(log.accountNo || '');
        const empStr = String(log.empId || '');
        const empNameStr = (log.empName || '').toLowerCase();
        const ipStr = (log.ipAddress || '').toLowerCase();

        return idStr.includes(query) ||
            actionStr.includes(query) ||
            descStr.includes(query) ||
            accStr.includes(query) ||
            empStr.includes(query) ||
            empNameStr.includes(query) ||
            ipStr.includes(query);
    });

    renderAuditLogsTable(filtered);
};

const getActionTypeBadge = (action) => {
    if (!action) return '<span class="badge badge-default">UNKNOWN</span>';
    const a = action.toUpperCase();

    if (a.includes('APPROVE') || a.includes('ACTIVATE') || a.includes('VERIFY') || a.includes('SUCCESS') || a.includes('DEPOSIT')) {
        return `<span class="badge badge-success">${escapeHtml(a)}</span>`;
    }
    if (a.includes('ISSUE') || a.includes('APPLY') || a.includes('CREATE') || a.includes('OPEN') || a.includes('ADD')) {
        return `<span class="badge badge-info">${escapeHtml(a)}</span>`;
    }
    if (a.includes('BLOCK') || a.includes('DEACTIVATE') || a.includes('WITHDRAW') || a.includes('UPDATE')) {
        return `<span class="badge badge-warning">${escapeHtml(a)}</span>`;
    }
    if (a.includes('REJECT') || a.includes('EXPIRE') || a.includes('FAIL') || a.includes('DELETE') || a.includes('CLOSE')) {
        return `<span class="badge badge-danger">${escapeHtml(a)}</span>`;
    }
    return `<span class="badge badge-default">${escapeHtml(a)}</span>`;
};

const renderAuditLogsTable = (logs) => {
    const tableContainer = document.getElementById('audit-table-container');
    if (!tableContainer) return;

    if (!logs || logs.length === 0) {
        tableContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📄</div>
                <p>No audit log entries found matching criteria.</p>
            </div>
        `;
        return;
    }

    const headers = ['Log ID', 'Timestamp', 'Action Type', 'Description', 'Account No', 'Staff / Actor', 'IP Address', 'Actions'];
    const rows = logs.map(l => {
        const idHtml = `<strong>#${l.logId}</strong>`;
        const timestamp = formatDateTime(l.logTimestamp || l.timestamp || l.logDate);
        const actionBadge = getActionTypeBadge(l.actionType);
        const description = escapeHtml(l.description || l.details || '-');
        const account = l.accountNo ? `Account #${l.accountNo}` : '<span class="text-light">-</span>';
        
        let staff = '<span class="text-light">System / User</span>';
        if (l.empName && l.empName !== 'null null') {
            staff = `${escapeHtml(l.empName)} <small class="text-light">(ID: ${l.empId})</small>`;
        } else if (l.empId) {
            staff = `Emp #${l.empId}`;
        }

        const ip = escapeHtml(l.ipAddress || '127.0.0.1');
        const actions = `
            <button class="btn btn-sm btn-outline" onclick="viewAuditLogDetails(${l.logId})" title="View Log Details">Details</button>
        `;

        return [idHtml, timestamp, actionBadge, description, account, staff, ip, actions];
    });

    tableContainer.innerHTML = createTable(headers, rows);
};

const renderAuditPagination = () => {
    const container = document.getElementById('audit-pagination-container');
    if (!container) return;

    if (auditTotalPages <= 1 && auditTotalElements <= auditPageSize) {
        container.innerHTML = `
            <div style="font-size:0.875rem; color:var(--text-secondary, #666);">
                Showing <strong>${allAuditLogs.length}</strong> of <strong>${auditTotalElements}</strong> records
            </div>
        `;
        return;
    }

    let pageBtnsHtml = '';
    const maxVisiblePages = 5;
    let startPage = Math.max(1, auditCurrentPage - 2);
    let endPage = Math.min(auditTotalPages, startPage + maxVisiblePages - 1);
    if (endPage - startPage < maxVisiblePages - 1) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    if (startPage > 1) {
        pageBtnsHtml += `<button class="page-btn" onclick="fetchAuditLogs(1)">1</button>`;
        if (startPage > 2) pageBtnsHtml += `<span style="padding:0 4px;">...</span>`;
    }

    for (let p = startPage; p <= endPage; p++) {
        pageBtnsHtml += `<button class="page-btn ${p === auditCurrentPage ? 'active' : ''}" onclick="fetchAuditLogs(${p})">${p}</button>`;
    }

    if (endPage < auditTotalPages) {
        if (endPage < auditTotalPages - 1) pageBtnsHtml += `<span style="padding:0 4px;">...</span>`;
        pageBtnsHtml += `<button class="page-btn" onclick="fetchAuditLogs(${auditTotalPages})">${auditTotalPages}</button>`;
    }

    container.innerHTML = `
        <div style="font-size:0.875rem; color:var(--text-secondary, #666);">
            Showing page <strong>${auditCurrentPage}</strong> of <strong>${auditTotalPages}</strong> (${auditTotalElements} total entries)
        </div>
        <div class="pagination" style="display:flex; gap:4px; align-items:center;">
            <button class="page-btn" ${auditCurrentPage <= 1 ? 'disabled' : ''} onclick="fetchAuditLogs(${auditCurrentPage - 1})">Prev</button>
            ${pageBtnsHtml}
            <button class="page-btn" ${auditCurrentPage >= auditTotalPages ? 'disabled' : ''} onclick="fetchAuditLogs(${auditCurrentPage + 1})">Next</button>
        </div>
    `;
};

window.viewAuditLogDetails = async (logId) => {
    showModal(`Audit Log #${logId} Details`, '<div class="spinner"></div>');

    try {
        const res = await apiGet(`/audit/${logId}`);
        const log = Array.isArray(res) ? res[0] : (res && res.data ? res.data : res);

        if (!log) {
            showModal('Audit Log Not Found', '<p class="text-danger">Log entry not found.</p>', '<button class="btn btn-outline" onclick="closeModal()">Close</button>');
            return;
        }

        let staffText = 'System / Self-service Action';
        if (log.empName && log.empName !== 'null null') {
            staffText = `${escapeHtml(log.empName)} (Staff ID: ${log.empId})`;
        } else if (log.empId) {
            staffText = `Staff ID: ${log.empId}`;
        }

        const bodyHtml = `
            <div class="card" style="background:var(--bg); border:1px solid var(--border); padding: 1rem;">
                <h4 style="margin-bottom: 1rem;">Audit Record Specification</h4>
                <div class="form-grid">
                    <div><strong>Log ID:</strong> #${log.logId}</div>
                    <div><strong>Action Type:</strong> ${getActionTypeBadge(log.actionType)}</div>
                    <div><strong>Timestamp:</strong> ${formatDateTime(log.logTimestamp || log.timestamp || log.logDate)}</div>
                    <div><strong>Linked Account:</strong> ${log.accountNo ? `Account #${log.accountNo}` : 'None'}</div>
                    <div><strong>Employee / Actor:</strong> ${staffText}</div>
                    <div><strong>IP Address:</strong> <code>${escapeHtml(log.ipAddress || '127.0.0.1')}</code></div>
                    <div class="full-width mt-1">
                        <strong>Event Description:</strong><br>
                        <div style="background:var(--card-bg, #fff); padding:0.75rem; border:1px solid var(--border); border-radius:0.375rem; font-family:monospace; margin-top:4px; word-break:break-all;">
                            ${escapeHtml(log.description || log.details || 'No description provided')}
                        </div>
                    </div>
                </div>
            </div>

            <div class="mt-2" style="font-size:0.875rem; color:var(--text-secondary, #666);">
                🔒 <strong>Audit Record Integrity:</strong> This event was recorded by the server in the Oracle XE database <code>AUDIT_LOG</code> table. Audit records are strictly read-only and cannot be altered or removed through the user interface.
            </div>
        `;

        const footerHtml = `
            <button class="btn btn-outline" onclick="closeModal()">Close</button>
        `;

        showModal(`Audit Log #${logId} Details`, bodyHtml, footerHtml);
    } catch (e) {
        showModal('Error', `<p class="text-danger">${escapeHtml(e.message || 'Failed to load audit log details.')}</p>`, '<button class="btn btn-outline" onclick="closeModal()">Close</button>');
    }
};
