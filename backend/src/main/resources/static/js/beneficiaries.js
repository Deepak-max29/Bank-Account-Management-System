// js/beneficiaries.js

let allBeneficiaries = [];
let customersList = [];

window.loadBeneficiaries = async () => {
    const container = document.getElementById('main-content');
    container.innerHTML = `
        <div class="page-header">
            <h2>Beneficiaries Management</h2>
            <button class="btn btn-primary" id="add-beneficiary-btn" onclick="openBeneficiaryModal()">+ Add Beneficiary</button>
        </div>
        <div class="action-bar">
            <div class="search-wrapper">
                <span class="search-icon">🔍</span>
                <input type="text" id="beneficiary-search" placeholder="Search by name, bank, account, IFSC..." oninput="filterBeneficiaries()">
            </div>
            <div style="min-width: 200px;">
                <select id="beneficiary-customer-filter" onchange="filterBeneficiaries()">
                    <option value="">All Customers</option>
                </select>
            </div>
            <div style="min-width: 160px;">
                <select id="beneficiary-status-filter" onchange="filterBeneficiaries()">
                    <option value="">All Statuses</option>
                    <option value="ACTIVE_VERIFIED">Active & Verified</option>
                    <option value="PENDING_VERIFICATION">Pending Verification</option>
                    <option value="INACTIVE">Deactivated</option>
                </select>
            </div>
            <button class="btn btn-outline btn-sm" onclick="fetchBeneficiaries()" title="Refresh">↻ Refresh</button>
        </div>
        <div class="card">
            <div id="beneficiaries-table-container"></div>
        </div>
    `;

    // Load customer dropdown list
    await loadCustomersDropdown();
    // Fetch and display beneficiaries
    await fetchBeneficiaries();
};

const loadCustomersDropdown = async () => {
    try {
        const res = await apiGet('/customers');
        customersList = Array.isArray(res) ? res : (res && res.data ? res.data : (res && res.content ? res.content : []));
        const filterSelect = document.getElementById('beneficiary-customer-filter');
        if (filterSelect) {
            const currentVal = filterSelect.value;
            filterSelect.innerHTML = '<option value="">All Customers</option>' +
                customersList.map(c => {
                    const fullName = `${c.firstName || ''} ${c.lastName || ''}`.trim() || `Customer #${c.customerId}`;
                    return `<option value="${c.customerId}">${escapeHtml(fullName)} (ID: ${c.customerId})</option>`;
                }).join('');
            filterSelect.value = currentVal;
        }
    } catch (e) {
        console.warn('Could not load customers dropdown for filter:', e);
    }
};

const fetchBeneficiaries = async () => {
    const tableContainer = document.getElementById('beneficiaries-table-container');
    if (!tableContainer) return;
    showLoading(tableContainer);

    try {
        const res = await apiGet('/beneficiaries');
        allBeneficiaries = Array.isArray(res) ? res : (res && res.data ? res.data : []);
        renderBeneficiariesTable(allBeneficiaries);
    } catch (error) {
        showErrorState(tableContainer, 'Failed to load beneficiaries from server.', () => fetchBeneficiaries());
    }
};

window.filterBeneficiaries = () => {
    const searchInput = document.getElementById('beneficiary-search');
    const customerFilter = document.getElementById('beneficiary-customer-filter');
    const statusFilter = document.getElementById('beneficiary-status-filter');

    const query = searchInput ? searchInput.value.trim().toLowerCase() : '';
    const selectedCust = customerFilter ? customerFilter.value : '';
    const selectedStatus = statusFilter ? statusFilter.value : '';

    const filtered = allBeneficiaries.filter(b => {
        const name = (b.beneficiaryName || '').toLowerCase();
        const bank = (b.bankName || '').toLowerCase();
        const ifsc = (b.ifscCode || '').toLowerCase();
        const accNo = String(b.beneficiaryAccNo || b.beneficiaryAccountNo || '').toLowerCase();

        // Customer info match
        const custObj = customersList.find(c => String(c.customerId) === String(b.customerId));
        const custName = custObj ? `${custObj.firstName || ''} ${custObj.lastName || ''}`.toLowerCase() : '';

        const matchesQuery = !query ||
            name.includes(query) ||
            bank.includes(query) ||
            ifsc.includes(query) ||
            accNo.includes(query) ||
            custName.includes(query);

        const matchesCustomer = !selectedCust || String(b.customerId) === String(selectedCust);

        let matchesStatus = true;
        if (selectedStatus === 'ACTIVE_VERIFIED') {
            matchesStatus = b.isActive && b.isVerified;
        } else if (selectedStatus === 'PENDING_VERIFICATION') {
            matchesStatus = b.isActive && !b.isVerified;
        } else if (selectedStatus === 'INACTIVE') {
            matchesStatus = !b.isActive;
        }

        return matchesQuery && matchesCustomer && matchesStatus;
    });

    renderBeneficiariesTable(filtered);
};

const maskAccountNumber = (accNo) => {
    if (!accNo) return '-';
    const str = String(accNo);
    if (str.length <= 4) return str;
    const last4 = str.slice(-4);
    const masked = '•'.repeat(Math.min(str.length - 4, 8));
    return `${masked}${last4}`;
};

const renderBeneficiariesTable = (beneficiaries) => {
    const tableContainer = document.getElementById('beneficiaries-table-container');
    if (!tableContainer) return;

    if (!beneficiaries || beneficiaries.length === 0) {
        tableContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">✓</div>
                <p>No beneficiaries found.</p>
            </div>
        `;
        return;
    }

    const headers = ['ID', 'Customer', 'Beneficiary Name', 'Account No', 'Bank', 'IFSC', 'Max Limit', 'Status', 'Actions'];
    const rows = beneficiaries.map(b => {
        const bId = b.beneficiaryId;
        const custObj = customersList.find(c => String(c.customerId) === String(b.customerId));
        const custLabel = custObj 
            ? `${escapeHtml(custObj.firstName || '')} ${escapeHtml(custObj.lastName || '')} <small class="text-light">(ID: ${b.customerId})</small>`
            : `ID: ${b.customerId}`;

        const name = escapeHtml(b.beneficiaryName || '-');
        const accNoRaw = b.beneficiaryAccNo || b.beneficiaryAccountNo || '';
        const accNo = `<span title="${escapeHtml(accNoRaw)}">${escapeHtml(maskAccountNumber(accNoRaw))}</span>`;
        const bank = escapeHtml(b.bankName || '-');
        const ifsc = `<code>${escapeHtml(b.ifscCode || '-')}</code>`;
        const maxLimit = b.maxLimit != null ? formatCurrency(b.maxLimit) : '-';

        // Badges for verified and active status
        let statusBadges = '';
        if (!b.isActive) {
            statusBadges = '<span class="badge badge-danger">INACTIVE</span>';
        } else if (b.isVerified) {
            statusBadges = '<span class="badge badge-success">VERIFIED</span>';
        } else {
            statusBadges = '<span class="badge badge-warning">PENDING</span>';
        }

        const serialized = JSON.stringify(b).replace(/'/g, "&#39;");
        let actionButtons = `
            <button class="btn btn-sm btn-outline" onclick='openBeneficiaryModal(${serialized})' title="Edit">Edit</button>
        `;

        if (b.isActive && !b.isVerified) {
            actionButtons += `
                <button class="btn btn-sm btn-success" onclick="verifyBeneficiaryAction(${bId})" title="Verify Beneficiary">Verify</button>
            `;
        }

        if (b.isActive) {
            actionButtons += `
                <button class="btn btn-sm btn-danger" onclick="deactivateBeneficiaryAction(${bId})" title="Deactivate Beneficiary">Deactivate</button>
            `;
        }

        return [bId, custLabel, name, accNo, bank, ifsc, maxLimit, statusBadges, actionButtons];
    });

    tableContainer.innerHTML = createTable(headers, rows);
};

window.openBeneficiaryModal = async (beneficiary = null) => {
    const isEdit = !!beneficiary;
    const title = isEdit ? `Edit Beneficiary #${beneficiary.beneficiaryId}` : 'Add New Beneficiary';

    // Ensure customer options are loaded
    if (!customersList || customersList.length === 0) {
        try {
            const res = await apiGet('/customers');
            customersList = Array.isArray(res) ? res : (res && res.data ? res.data : (res && res.content ? res.content : []));
        } catch (e) {
            showToast('Unable to load customer list. Please try again.', 'error');
            return;
        }
    }

    if (!customersList || customersList.length === 0) {
        showToast('No customers found. Please add a customer first.', 'warning');
        return;
    }

    const customerOptions = customersList.map(c => {
        const isSelected = isEdit && String(beneficiary.customerId) === String(c.customerId);
        const name = `${c.firstName || ''} ${c.lastName || ''}`.trim() || `Customer #${c.customerId}`;
        return `<option value="${c.customerId}" ${isSelected ? 'selected' : ''}>${escapeHtml(name)} (ID: ${c.customerId})</option>`;
    }).join('');

    const accVal = isEdit ? (beneficiary.beneficiaryAccNo || beneficiary.beneficiaryAccountNo || '') : '';

    const bodyHtml = `
        <form id="beneficiary-form" class="form-grid" onsubmit="event.preventDefault(); saveBeneficiary();">
            <input type="hidden" id="ben-id" value="${isEdit ? beneficiary.beneficiaryId : ''}">
            
            <div class="form-group full-width">
                <label for="ben-customer">Owner Customer <span class="text-danger">*</span></label>
                <select id="ben-customer" class="form-control" ${isEdit ? 'disabled' : 'required'}>
                    <option value="">-- Select Customer --</option>
                    ${customerOptions}
                </select>
                ${isEdit ? '<small class="text-light">Beneficiary owner cannot be changed after creation.</small>' : ''}
            </div>

            <div class="form-group">
                <label for="ben-name">Beneficiary Name <span class="text-danger">*</span></label>
                <input type="text" id="ben-name" class="form-control" required maxlength="100"
                    value="${isEdit ? escapeHtml(beneficiary.beneficiaryName) : ''}" placeholder="e.g. Ramesh Gupta">
            </div>

            <div class="form-group">
                <label for="ben-acc-no">Account Number <span class="text-danger">*</span></label>
                <input type="text" id="ben-acc-no" class="form-control" required maxlength="30"
                    value="${isEdit ? escapeHtml(accVal) : ''}" placeholder="e.g. 100000002 or 9876543210">
            </div>

            <div class="form-group">
                <label for="ben-bank-name">Bank Name <span class="text-danger">*</span></label>
                <input type="text" id="ben-bank-name" class="form-control" required maxlength="100"
                    value="${isEdit ? escapeHtml(beneficiary.bankName) : ''}" placeholder="e.g. State Bank of India">
            </div>

            <div class="form-group">
                <label for="ben-ifsc">IFSC Code <span class="text-danger">*</span></label>
                <input type="text" id="ben-ifsc" class="form-control" required maxlength="11"
                    pattern="^[A-Z]{4}0[A-Z0-9]{6}$"
                    value="${isEdit ? escapeHtml(beneficiary.ifscCode) : ''}" placeholder="e.g. SBIN0001234"
                    style="text-transform: uppercase;" oninput="this.value = this.value.toUpperCase()">
                <small class="text-light">Format: 4 letters, '0', 6 alphanumeric (e.g. SBIN0001234)</small>
            </div>

            <div class="form-group full-width">
                <label for="ben-max-limit">Maximum Transfer Limit (₹) <span class="text-danger">*</span></label>
                <input type="number" id="ben-max-limit" class="form-control" step="1" min="1" required
                    value="${isEdit && beneficiary.maxLimit != null ? beneficiary.maxLimit : '50000'}" placeholder="e.g. 50000">
                <small class="text-light">Transfers to this beneficiary will be capped at this limit per transaction.</small>
            </div>
            
            <div id="beneficiary-form-error" class="error-message full-width" style="display: none;"></div>
        </form>
    `;

    const footerHtml = `
        <button type="button" class="btn btn-outline" onclick="closeModal()">Cancel</button>
        <button type="button" class="btn btn-primary" id="save-beneficiary-btn" onclick="saveBeneficiary()">
            ${isEdit ? 'Update Beneficiary' : 'Add Beneficiary'}
        </button>
    `;

    showModal(title, bodyHtml, footerHtml);
};

window.saveBeneficiary = async () => {
    const errorBox = document.getElementById('beneficiary-form-error');
    if (errorBox) errorBox.style.display = 'none';

    const benId = document.getElementById('ben-id').value;
    const customerIdVal = document.getElementById('ben-customer').value;
    const name = document.getElementById('ben-name').value.trim();
    const accNo = document.getElementById('ben-acc-no').value.trim();
    const bankName = document.getElementById('ben-bank-name').value.trim();
    const ifsc = document.getElementById('ben-ifsc').value.trim().toUpperCase();
    const maxLimitVal = document.getElementById('ben-max-limit').value.trim();

    // Client-side validations
    if (!benId && !customerIdVal) {
        showBeneficiaryFormError('Please select a customer.');
        return;
    }
    if (!name) {
        showBeneficiaryFormError('Beneficiary name is required.');
        return;
    }
    if (!accNo) {
        showBeneficiaryFormError('Beneficiary account number is required.');
        return;
    }
    if (!bankName) {
        showBeneficiaryFormError('Bank name is required.');
        return;
    }
    if (!validateIFSC(ifsc)) {
        showBeneficiaryFormError('Invalid IFSC code format (must be 4 uppercase letters, 0, followed by 6 alphanumeric characters).');
        return;
    }
    if (!maxLimitVal || isNaN(maxLimitVal) || parseFloat(maxLimitVal) <= 0) {
        showBeneficiaryFormError('Maximum transfer limit must be greater than zero.');
        return;
    }

    const payload = {
        customerId: customerIdVal ? parseInt(customerIdVal, 10) : undefined,
        beneficiaryName: name,
        beneficiaryAccNo: accNo,
        bankName: bankName,
        ifscCode: ifsc,
        maxLimit: parseFloat(maxLimitVal)
    };

    const saveBtn = document.getElementById('save-beneficiary-btn');
    if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.innerText = benId ? 'Updating...' : 'Adding...';
    }

    try {
        if (benId) {
            await apiPut(`/beneficiaries/${benId}`, payload);
            showToast('Beneficiary updated successfully', 'success');
        } else {
            await apiPost('/beneficiaries', payload);
            showToast('Beneficiary added successfully', 'success');
        }
        closeModal();
        await fetchBeneficiaries();
        filterBeneficiaries();
    } catch (err) {
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.innerText = benId ? 'Update Beneficiary' : 'Add Beneficiary';
        }
        showBeneficiaryFormError(err.message || 'Operation failed. Please verify inputs.');
    }
};

window.verifyBeneficiaryAction = (id) => {
    showConfirmDialog('Verify Beneficiary', 'Are you sure you want to verify this beneficiary? Once verified, the customer can perform transfers up to the maximum limit.', async () => {
        try {
            const resp = await fetch(`/api/beneficiaries/${id}/verify`, {
                method: 'PATCH',
                headers: getHeaders()
            });
            await handleResponse(resp);
            showToast('Beneficiary verified successfully', 'success');
            await fetchBeneficiaries();
            filterBeneficiaries();
        } catch (e) {}
    });
};

window.deactivateBeneficiaryAction = (id) => {
    showConfirmDialog('Deactivate Beneficiary', 'Are you sure you want to deactivate this beneficiary? Transfers to this beneficiary will no longer be permitted.', async () => {
        try {
            const resp = await fetch(`/api/beneficiaries/${id}/deactivate`, {
                method: 'PATCH',
                headers: getHeaders()
            });
            await handleResponse(resp);
            showToast('Beneficiary deactivated successfully', 'success');
            await fetchBeneficiaries();
            filterBeneficiaries();
        } catch (e) {}
    });
};

const showBeneficiaryFormError = (msg) => {
    const errorBox = document.getElementById('beneficiary-form-error');
    if (errorBox) {
        errorBox.innerText = msg;
        errorBox.style.display = 'block';
    } else {
        showToast(msg, 'error');
    }
};
