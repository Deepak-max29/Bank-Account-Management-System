// js/customers.js - Customer Management with Search, KYC Workflows, and CSV Import/Export

let allCustomers = [];
let filteredCustomers = [];
let customerSearchQuery = '';
let customerKycFilter = 'ALL';

window.loadCustomers = async () => {
    const container = document.getElementById('main-content');
    container.innerHTML = `
        <div class="page-header mb-2">
            <div>
                <h2 class="page-title">Customer Management</h2>
                <p class="text-muted">Manage retail customer profiles, contact records, KYC verifications, and batch data</p>
            </div>
            <div class="action-buttons-group">
                <button class="btn btn-outline" onclick="exportCustomersCsv()">
                    <span>📥</span> Export CSV
                </button>
                <button class="btn btn-outline" onclick="openCustomerCsvModal()">
                    <span>📤</span> Import CSV
                </button>
                <button class="btn btn-primary" onclick="openCustomerModal()">
                    <span>+</span> Add Customer
                </button>
            </div>
        </div>

        <!-- Filter & Search Bar -->
        <div class="filter-bar card mb-2">
            <div class="filter-grid">
                <div class="search-box">
                    <span class="search-icon">🔍</span>
                    <input type="text" id="cust-search-input" class="search-input" 
                        placeholder="Search by name, email, phone, or customer ID..." 
                        oninput="onCustomerSearch(this.value)">
                </div>
                <div class="filter-select-group">
                    <label for="cust-kyc-filter" class="filter-label">KYC Status:</label>
                    <select id="cust-kyc-filter" class="select-control" onchange="onCustomerKycFilter(this.value)">
                        <option value="ALL">All Statuses</option>
                        <option value="VERIFIED">Verified Only</option>
                        <option value="PENDING">Pending Only</option>
                        <option value="REJECTED">Rejected Only</option>
                    </select>
                </div>
                <div class="filter-stats" id="cust-count-badge">
                    <span class="badge badge-neutral">Loading...</span>
                </div>
            </div>
        </div>

        <!-- Customer Table Container -->
        <div class="card card-premium">
            <div id="customers-table-container">
                <div class="loading-state">
                    <div class="spinner"></div>
                    <p class="mt-1 text-muted">Retrieving customer directory from database...</p>
                </div>
            </div>
        </div>
    `;

    fetchCustomers();
};

const fetchCustomers = async () => {
    const container = document.getElementById('customers-table-container');
    if (!container) return;
    
    try {
        const res = await apiGet('/customers');
        // Handle ApiResponse<List<Customer>> or direct array
        const list = Array.isArray(res) ? res : (res && res.data ? res.data : []);
        allCustomers = list;
        applyCustomerFilters();
    } catch (error) {
        showErrorState(container, 'Failed to retrieve customers: ' + (error.message || 'Server error'), fetchCustomers);
    }
};

window.onCustomerSearch = (query) => {
    customerSearchQuery = (query || '').trim().toLowerCase();
    applyCustomerFilters();
};

window.onCustomerKycFilter = (status) => {
    customerKycFilter = status;
    applyCustomerFilters();
};

function applyCustomerFilters() {
    filteredCustomers = allCustomers.filter(c => {
        // KYC status filter
        if (customerKycFilter !== 'ALL' && (c.kycStatus || '').toUpperCase() !== customerKycFilter) {
            return false;
        }

        // Search query filter
        if (customerSearchQuery) {
            const fullName = `${c.firstName || ''} ${c.lastName || ''}`.toLowerCase();
            const email = (c.email || '').toLowerCase();
            const phone = (c.phone || '').toLowerCase();
            const id = String(c.customerId || '');
            const addr = (c.address || '').toLowerCase();

            return fullName.includes(customerSearchQuery) ||
                   email.includes(customerSearchQuery) ||
                   phone.includes(customerSearchQuery) ||
                   id.includes(customerSearchQuery) ||
                   addr.includes(customerSearchQuery);
        }

        return true;
    });

    renderCustomersTable();
}

function renderCustomersTable() {
    const container = document.getElementById('customers-table-container');
    const badgeEl = document.getElementById('cust-count-badge');
    
    if (badgeEl) {
        badgeEl.innerHTML = `<span class="badge badge-accent">${filteredCustomers.length} of ${allCustomers.length} Customers</span>`;
    }

    if (!filteredCustomers || filteredCustomers.length === 0) {
        if (allCustomers.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <span class="empty-icon">👥</span>
                    <h3>No Customers in Database</h3>
                    <p class="text-muted mt-1">Get started by creating a new customer or importing via CSV.</p>
                    <div class="mt-2">
                        <button class="btn btn-primary" onclick="openCustomerModal()">+ Add First Customer</button>
                        <button class="btn btn-outline" onclick="openCustomerCsvModal()">Upload CSV</button>
                    </div>
                </div>
            `;
        } else {
            container.innerHTML = `
                <div class="empty-state">
                    <span class="empty-icon">🔍</span>
                    <h3>No Matching Customers</h3>
                    <p class="text-muted mt-1">No customers match your current filter query "${escapeHtml(customerSearchQuery)}".</p>
                    <button class="btn btn-outline btn-sm mt-1" onclick="clearCustomerFilters()">Clear Filters</button>
                </div>
            `;
        }
        return;
    }

    const rows = filteredCustomers.map(c => {
        const id = c.customerId;
        const name = escapeHtml(`${c.firstName || ''} ${c.lastName || ''}`.trim());
        const email = escapeHtml(c.email || '-');
        const phone = escapeHtml(c.phone || '-');
        const dob = c.dob || c.dateOfBirth ? (c.dob || c.dateOfBirth).split('T')[0] : '-';
        const gender = escapeHtml(c.gender || '-');
        const kycStatus = (c.kycStatus || 'PENDING').toUpperCase();

        let kycBadge = '';
        if (kycStatus === 'VERIFIED') {
            kycBadge = '<span class="badge badge-success">✓ VERIFIED</span>';
        } else if (kycStatus === 'REJECTED') {
            kycBadge = '<span class="badge badge-danger">✗ REJECTED</span>';
        } else {
            kycBadge = '<span class="badge badge-warning">⏳ PENDING</span>';
        }

        const safeCustJson = JSON.stringify(c).replace(/'/g, "&#39;");

        return `
            <tr>
                <td class="font-mono font-medium">#${id}</td>
                <td>
                    <div class="user-cell">
                        <span class="user-avatar-sm">${(c.firstName || 'C')[0].toUpperCase()}</span>
                        <div>
                            <div class="font-medium">${name}</div>
                            <div class="text-xs text-muted">ID: ${id}</div>
                        </div>
                    </div>
                </td>
                <td class="font-mono text-sm">${email}</td>
                <td class="font-mono text-sm">${phone}</td>
                <td class="text-sm">${dob}</td>
                <td><span class="badge badge-neutral">${gender}</span></td>
                <td>${kycBadge}</td>
                <td>
                    <div class="action-btn-group">
                        <button class="btn btn-sm btn-outline" onclick='openCustomerModal(${safeCustJson})' title="Edit Details">
                            Edit
                        </button>
                        <button class="btn btn-sm btn-outline" onclick="openKycModal(${id}, '${kycStatus}', '${name}')" title="Update KYC">
                            KYC
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
                        <th>ID</th>
                        <th>Customer</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Date of Birth</th>
                        <th>Gender</th>
                        <th>KYC Status</th>
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

window.clearCustomerFilters = () => {
    customerSearchQuery = '';
    customerKycFilter = 'ALL';
    const input = document.getElementById('cust-search-input');
    if (input) input.value = '';
    const sel = document.getElementById('cust-kyc-filter');
    if (sel) sel.value = 'ALL';
    applyCustomerFilters();
};

// Customer Create / Edit Modal
window.openCustomerModal = (customer = null) => {
    const isEdit = !!customer;
    const title = isEdit ? `Edit Customer (#${customer.customerId})` : 'New Customer Onboarding';
    
    const dobValue = customer && (customer.dob || customer.dateOfBirth) 
        ? (customer.dob || customer.dateOfBirth).split('T')[0] 
        : '';

    const body = `
        <form id="customer-form" class="modal-form-grid" onsubmit="event.preventDefault(); saveCustomer();">
            <input type="hidden" id="cust-modal-id" value="${isEdit ? customer.customerId : ''}">
            
            <div class="form-group">
                <label for="cust-modal-fname">First Name <span class="required">*</span></label>
                <input type="text" id="cust-modal-fname" class="form-control" 
                    value="${isEdit ? escapeHtml(customer.firstName || '') : ''}" required placeholder="e.g. Rahul">
            </div>

            <div class="form-group">
                <label for="cust-modal-lname">Last Name <span class="required">*</span></label>
                <input type="text" id="cust-modal-lname" class="form-control" 
                    value="${isEdit ? escapeHtml(customer.lastName || '') : ''}" required placeholder="e.g. Sharma">
            </div>

            <div class="form-group">
                <label for="cust-modal-email">Email Address <span class="required">*</span></label>
                <input type="email" id="cust-modal-email" class="form-control" 
                    value="${isEdit ? escapeHtml(customer.email || '') : ''}" required placeholder="customer@example.com">
            </div>

            <div class="form-group">
                <label for="cust-modal-phone">Phone Number (10 digits) <span class="required">*</span></label>
                <input type="tel" id="cust-modal-phone" class="form-control" pattern="\\d{10}" maxlength="10"
                    value="${isEdit ? escapeHtml(customer.phone || '') : ''}" required placeholder="e.g. 9876543210">
                <small class="field-hint">Must be exactly 10 numeric digits</small>
            </div>

            <div class="form-group">
                <label for="cust-modal-dob">Date of Birth <span class="required">*</span></label>
                <input type="date" id="cust-modal-dob" class="form-control" 
                    value="${dobValue}" required>
            </div>

            <div class="form-group">
                <label for="cust-modal-gender">Gender</label>
                <select id="cust-modal-gender" class="form-control">
                    <option value="MALE" ${isEdit && customer.gender === 'MALE' ? 'selected' : ''}>Male</option>
                    <option value="FEMALE" ${isEdit && customer.gender === 'FEMALE' ? 'selected' : ''}>Female</option>
                    <option value="OTHER" ${isEdit && customer.gender === 'OTHER' ? 'selected' : ''}>Other</option>
                </select>
            </div>

            <div class="form-group">
                <label for="cust-modal-kyc">KYC Status</label>
                <select id="cust-modal-kyc" class="form-control">
                    <option value="PENDING" ${isEdit && customer.kycStatus === 'PENDING' ? 'selected' : ''}>PENDING</option>
                    <option value="VERIFIED" ${isEdit && customer.kycStatus === 'VERIFIED' ? 'selected' : ''}>VERIFIED</option>
                    <option value="REJECTED" ${isEdit && customer.kycStatus === 'REJECTED' ? 'selected' : ''}>REJECTED</option>
                </select>
            </div>

            <div class="form-group full-width">
                <label for="cust-modal-address">Residential Address</label>
                <textarea id="cust-modal-address" class="form-control" rows="2" placeholder="Full postal address...">${isEdit ? escapeHtml(customer.address || '') : ''}</textarea>
            </div>
        </form>
    `;

    const footer = `
        <button type="button" class="btn btn-outline" onclick="closeModal()">Cancel</button>
        <button type="button" class="btn btn-primary" onclick="saveCustomer()">
            ${isEdit ? 'Update Customer' : 'Create Customer'}
        </button>
    `;

    showModal(title, body, footer);
};

window.saveCustomer = async () => {
    const id = document.getElementById('cust-modal-id').value;
    const fname = document.getElementById('cust-modal-fname').value.trim();
    const lname = document.getElementById('cust-modal-lname').value.trim();
    const email = document.getElementById('cust-modal-email').value.trim();
    const phone = document.getElementById('cust-modal-phone').value.trim();
    const dob = document.getElementById('cust-modal-dob').value;
    const gender = document.getElementById('cust-modal-gender').value;
    const kyc = document.getElementById('cust-modal-kyc').value;
    const address = document.getElementById('cust-modal-address').value.trim();

    if (!fname || !lname || !email || !phone || !dob) {
        showToast('Please fill in all required fields.', 'warning');
        return;
    }

    if (!/^\d{10}$/.test(phone)) {
        showToast('Phone number must be exactly 10 digits.', 'error');
        return;
    }

    const payload = {
        firstName: fname,
        lastName: lname,
        email: email,
        phone: phone,
        dob: dob,
        gender: gender,
        kycStatus: kyc,
        address: address
    };

    try {
        if (id) {
            await apiPut(`/customers/${id}`, payload);
            showToast(`Customer #${id} updated successfully`, 'success');
        } else {
            await apiPost('/customers', payload);
            showToast('New customer onboarded successfully', 'success');
        }
        closeModal();
        fetchCustomers();
    } catch (e) {
        // handled in api.js toast
    }
};

// KYC Status Quick Update Modal
window.openKycModal = (id, currentStatus, customerName) => {
    const body = `
        <div class="kyc-modal-content">
            <p>Update KYC verification status for <strong>${escapeHtml(customerName)}</strong> (ID #${id}):</p>
            <div class="form-group mt-2">
                <label for="kyc-quick-select">Verification Status</label>
                <select id="kyc-quick-select" class="form-control">
                    <option value="VERIFIED" ${currentStatus === 'VERIFIED' ? 'selected' : ''}>VERIFIED - Documents Approved</option>
                    <option value="PENDING" ${currentStatus === 'PENDING' ? 'selected' : ''}>PENDING - Under Review</option>
                    <option value="REJECTED" ${currentStatus === 'REJECTED' ? 'selected' : ''}>REJECTED - Documentation Insufficient</option>
                </select>
            </div>
        </div>
    `;

    const footer = `
        <button class="btn btn-outline" onclick="closeModal()">Cancel</button>
        <button class="btn btn-primary" onclick="submitKycUpdate(${id})">Apply Status</button>
    `;

    showModal('Update KYC Status', body, footer);
};

window.submitKycUpdate = async (id) => {
    const status = document.getElementById('kyc-quick-select').value;
    try {
        await apiPatch(`/customers/${id}/kyc?status=${status}`);
        showToast(`Customer #${id} KYC updated to ${status}`, 'success');
        closeModal();
        fetchCustomers();
    } catch (e) {}
};

// CSV Export
window.exportCustomersCsv = () => {
    window.location.href = '/api/csv/export/customers';
};

// CSV Import Modal
window.openCustomerCsvModal = () => {
    const body = `
        <div class="csv-import-box">
            <div class="csv-guidelines mb-2">
                <h4 class="font-medium text-sm mb-1">Expected CSV Columns:</h4>
                <code class="code-preview">FirstName,LastName,Email,Phone,Dob,Gender,Address,KycStatus</code>
                <p class="text-xs text-muted mt-1">• Date format: YYYY-MM-DD<br>• Phone: 10 numeric digits<br>• KycStatus: PENDING, VERIFIED, or REJECTED</p>
            </div>
            
            <div class="form-group">
                <label for="customer-csv-file">Select CSV File</label>
                <input type="file" id="customer-csv-file" class="form-control" accept=".csv">
            </div>

            <div id="customer-csv-results" class="mt-2 hidden"></div>
        </div>
    `;

    const footer = `
        <button class="btn btn-outline" onclick="closeModal()">Cancel</button>
        <button class="btn btn-primary" id="btn-import-cust-csv" onclick="uploadCustomerCsv()">Import Records</button>
    `;

    showModal('Import Customers from CSV', body, footer);
};

window.uploadCustomerCsv = async () => {
    const fileInput = document.getElementById('customer-csv-file');
    const resultDiv = document.getElementById('customer-csv-results');
    const btn = document.getElementById('btn-import-cust-csv');

    if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
        showToast('Please select a CSV file to upload.', 'warning');
        return;
    }

    const file = fileInput.files[0];
    const formData = new FormData();
    formData.append('file', file);

    btn.disabled = true;
    btn.innerText = 'Importing...';

    try {
        const response = await fetch('/api/csv/import/customers', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();
        
        if (response.ok && data.success) {
            const stats = data.data || {};
            showToast(`Import completed: ${stats.successCount || 0} customer(s) added!`, 'success');
            
            if (stats.errors && stats.errors.length > 0) {
                resultDiv.classList.remove('hidden');
                resultDiv.innerHTML = `
                    <div class="alert alert-warning text-xs">
                        <strong>Some rows had errors:</strong>
                        <ul class="mt-1 pl-4">
                            ${stats.errors.map(err => `<li>${escapeHtml(err)}</li>`).join('')}
                        </ul>
                    </div>
                `;
            } else {
                closeModal();
            }
            fetchCustomers();
        } else {
            const msg = data.message || 'Import failed.';
            showToast(msg, 'error');
            resultDiv.classList.remove('hidden');
            resultDiv.innerHTML = `<div class="alert alert-danger text-xs">${escapeHtml(msg)}</div>`;
        }
    } catch (err) {
        showToast('Failed to upload CSV: ' + err.message, 'error');
    } finally {
        btn.disabled = false;
        btn.innerText = 'Import Records';
    }
};
