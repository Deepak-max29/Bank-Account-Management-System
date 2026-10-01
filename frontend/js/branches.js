// js/branches.js — Branches Management Module
(function () {
    'use strict';

    let allBranches = [];
    let banksList = [];

    window.loadBranches = async function () {
        const container = document.getElementById('main-content');
        if (!container) return;

        container.innerHTML = `
            <div class="page-header" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:1.5rem;">
                <div>
                    <h2>📍 Branches Management</h2>
                    <p class="text-muted" style="margin:4px 0 0 0;font-size:0.9rem;">View and manage bank branch offices, IFSC codes, and contact details.</p>
                </div>
                <div style="display:flex;gap:8px;">
                    <button class="btn btn-outline btn-sm" onclick="window.fetchBranches()" title="Refresh list">↻ Refresh</button>
                    <button class="btn btn-primary" onclick="window.openBranchModal()">+ Add Branch</button>
                </div>
            </div>

            <div class="action-bar" style="display:flex;gap:12px;align-items:center;margin-bottom:1.5rem;flex-wrap:wrap;">
                <div class="search-wrapper" style="flex:1;min-width:250px;position:relative;">
                    <span class="search-icon" style="position:absolute;left:10px;top:50%;transform:translateY(-50%);color:#888;">🔍</span>
                    <input type="text" id="branch-search" class="form-control" placeholder="Search by branch name, IFSC, city, bank..." oninput="window.filterBranches()" style="padding-left:34px;width:100%;">
                </div>
                <div style="min-width:180px;">
                    <select id="branch-bank-filter" class="form-control" onchange="window.filterBranches()">
                        <option value="">All Banks</option>
                    </select>
                </div>
            </div>

            <div class="card" style="margin-bottom:0;">
                <div id="branches-table-container">
                    <div class="loading-container"><div class="spinner"></div></div>
                </div>
            </div>
        `;

        await window.loadBanksDropdown();
        await window.fetchBranches();
    };

    window.loadBanksDropdown = async function () {
        try {
            const res = await apiGet('/banks');
            const data = (res && res.data) ? res.data : (Array.isArray(res) ? res : []);
            banksList = Array.isArray(data) ? data : [];
            const filter = document.getElementById('branch-bank-filter');
            if (filter) {
                const current = filter.value;
                filter.innerHTML = '<option value="">All Banks</option>' + 
                    banksList.map(b => `<option value="${b.bankId}">${escapeHtml(b.bankName || ('Bank #' + b.bankId))}</option>`).join('');
                filter.value = current;
            }
        } catch (e) {
            console.warn('Could not load banks dropdown:', e);
        }
    };

    window.fetchBranches = async function () {
        const container = document.getElementById('branches-table-container');
        if (!container) return;
        showLoading(container);

        try {
            const res = await apiGet('/branches');
            const data = (res && res.data) ? res.data : (Array.isArray(res) ? res : (res && res.content ? res.content : []));
            allBranches = Array.isArray(data) ? data : [];
            window.renderBranchesTable(allBranches);
        } catch (error) {
            showErrorState(container, 'Failed to load branch records from database: ' + (error.message || error), () => window.fetchBranches());
        }
    };

    window.filterBranches = function () {
        const query = (document.getElementById('branch-search')?.value || '').toLowerCase().trim();
        const bankIdFilter = document.getElementById('branch-bank-filter')?.value || '';

        let filtered = allBranches;
        if (bankIdFilter) {
            filtered = filtered.filter(b => String(b.bankId) === String(bankIdFilter));
        }

        if (query) {
            filtered = filtered.filter(b => {
                const name = (b.branchName || '').toLowerCase();
                const ifsc = (b.ifscCode || '').toLowerCase();
                const city = (b.city || '').toLowerCase();
                const state = (b.state || '').toLowerCase();
                const bank = (b.bankName || '').toLowerCase();
                const addr = (b.address || '').toLowerCase();
                return name.includes(query) || ifsc.includes(query) || city.includes(query) || state.includes(query) || bank.includes(query) || addr.includes(query);
            });
        }

        window.renderBranchesTable(filtered);
    };

    window.renderBranchesTable = function (branches) {
        const container = document.getElementById('branches-table-container');
        if (!container) return;

        if (!branches || branches.length === 0) {
            container.innerHTML = `
                <div class="empty-state" style="text-align:center;padding:2.5rem 1rem;">
                    <div class="empty-state-icon" style="font-size:2.5rem;margin-bottom:0.75rem;">📍</div>
                    <p style="color:var(--text-muted,#6c757d);margin:0;font-size:1rem;">No branches found.</p>
                </div>
            `;
            return;
        }

        const headers = ['Branch ID', 'Bank Name', 'Branch Name', 'IFSC Code', 'City', 'State', 'Pincode', 'Actions'];
        const rows = branches.map(b => [
            `<strong>#${b.branchId}</strong>`,
            escapeHtml(b.bankName || ('Bank #' + b.bankId)),
            `<strong>${escapeHtml(b.branchName || '-')}</strong>`,
            `<span class="badge badge-default" style="font-family:monospace;font-size:0.85rem;">${escapeHtml(b.ifscCode || '-')}</span>`,
            escapeHtml(b.city || '-'),
            escapeHtml(b.state || '-'),
            escapeHtml(b.pincode || '-'),
            `<div style="display:flex;gap:6px;">
                <button class="btn btn-sm btn-outline" onclick='window.openBranchModal(${JSON.stringify(b).replace(/'/g, "&#39;")})' title="Edit Branch">Edit</button>
                <button class="btn btn-sm btn-danger" onclick="window.deleteBranch(${b.branchId}, '${escapeHtml(b.branchName || '')}')" title="Delete Branch">Delete</button>
             </div>`
        ]);

        container.innerHTML = createTable(headers, rows);
    };

    window.openBranchModal = function (branch = null) {
        const isEdit = !!branch;
        const title = isEdit ? 'Edit Branch Record' : 'Register New Branch';

        const bankOptions = banksList.map(b => 
            `<option value="${b.bankId}" ${isEdit && branch.bankId === b.bankId ? 'selected' : ''}>${escapeHtml(b.bankName || ('Bank #' + b.bankId))}</option>`
        ).join('');

        const body = `
            <form id="branch-form" onsubmit="window.saveBranch(event)">
                <input type="hidden" id="branch-id" value="${isEdit ? branch.branchId : ''}">
                <div class="form-group" style="margin-bottom:1rem;">
                    <label for="branch-bank-id" style="display:block;font-weight:600;margin-bottom:0.25rem;">Partner Bank *</label>
                    <select id="branch-bank-id" class="form-control" required style="width:100%;">
                        <option value="">-- Select Bank --</option>
                        ${bankOptions}
                    </select>
                </div>
                <div class="form-group" style="margin-bottom:1rem;">
                    <label for="branch-name" style="display:block;font-weight:600;margin-bottom:0.25rem;">Branch Name *</label>
                    <input type="text" id="branch-name" class="form-control" value="${isEdit ? escapeHtml(branch.branchName || '') : ''}" placeholder="e.g. NPB Main Branch" required style="width:100%;">
                </div>
                <div class="form-group" style="margin-bottom:1rem;">
                    <label for="branch-ifsc" style="display:block;font-weight:600;margin-bottom:0.25rem;">IFSC Code (11 alphanumeric, e.g. NPBK0000001) *</label>
                    <input type="text" id="branch-ifsc" class="form-control" value="${isEdit ? escapeHtml(branch.ifscCode || '') : ''}" placeholder="e.g. NPBK0000001" pattern="^[A-Z]{4}0[A-Z0-9]{6}$" title="11-character alphanumeric IFSC code" required style="width:100%;text-transform:uppercase;">
                </div>
                <div class="form-group" style="margin-bottom:1rem;">
                    <label for="branch-city" style="display:block;font-weight:600;margin-bottom:0.25rem;">City *</label>
                    <input type="text" id="branch-city" class="form-control" value="${isEdit ? escapeHtml(branch.city || '') : ''}" placeholder="e.g. New Delhi" required style="width:100%;">
                </div>
                <div class="form-group" style="margin-bottom:1rem;">
                    <label for="branch-state" style="display:block;font-weight:600;margin-bottom:0.25rem;">State *</label>
                    <input type="text" id="branch-state" class="form-control" value="${isEdit ? escapeHtml(branch.state || '') : ''}" placeholder="e.g. Delhi" required style="width:100%;">
                </div>
                <div class="form-group" style="margin-bottom:1rem;">
                    <label for="branch-pincode" style="display:block;font-weight:600;margin-bottom:0.25rem;">Pincode (6 digits) *</label>
                    <input type="text" id="branch-pincode" class="form-control" value="${isEdit ? escapeHtml(branch.pincode || '') : ''}" placeholder="e.g. 110001" pattern="^[1-9][0-9]{5}$" title="6-digit PIN code" required style="width:100%;">
                </div>
                <div class="form-group" style="margin-bottom:1rem;">
                    <label for="branch-address" style="display:block;font-weight:600;margin-bottom:0.25rem;">Street Address (Optional)</label>
                    <input type="text" id="branch-address" class="form-control" value="${isEdit ? escapeHtml(branch.address || '') : ''}" placeholder="e.g. Connaught Place, Block A" style="width:100%;">
                </div>
                <div id="branch-form-error" style="display:none;color:#dc2626;margin-top:0.5rem;font-size:0.875rem;"></div>
            </form>
        `;
        const footer = `
            <button class="btn btn-outline" onclick="closeModal()">Cancel</button>
            <button class="btn btn-primary" id="branch-save-btn" onclick="window.saveBranch()">Save Branch</button>
        `;
        showModal(title, body, footer);
    };

    window.saveBranch = async function (e) {
        if (e) e.preventDefault();

        const id = document.getElementById('branch-id')?.value;
        const bankId = document.getElementById('branch-bank-id')?.value;
        const branchName = document.getElementById('branch-name')?.value?.trim();
        const ifscCode = document.getElementById('branch-ifsc')?.value?.trim().toUpperCase();
        const city = document.getElementById('branch-city')?.value?.trim();
        const state = document.getElementById('branch-state')?.value?.trim();
        const pincode = document.getElementById('branch-pincode')?.value?.trim();
        const address = document.getElementById('branch-address')?.value?.trim();
        const errorDiv = document.getElementById('branch-form-error');
        const saveBtn = document.getElementById('branch-save-btn');

        if (errorDiv) {
            errorDiv.style.display = 'none';
            errorDiv.innerText = '';
        }

        if (!bankId || !branchName || !ifscCode || !city || !state || !pincode) {
            if (errorDiv) {
                errorDiv.style.display = 'block';
                errorDiv.innerText = 'Please fill all required fields.';
            }
            return;
        }

        if (!validateIFSC(ifscCode)) {
            if (errorDiv) {
                errorDiv.style.display = 'block';
                errorDiv.innerText = 'Invalid IFSC code format (e.g. NPBK0000001).';
            }
            return;
        }

        if (!validatePincode(pincode)) {
            if (errorDiv) {
                errorDiv.style.display = 'block';
                errorDiv.innerText = 'Invalid Pincode format (6 digits starting with 1-9).';
            }
            return;
        }

        const payload = {
            bankId: Number(bankId),
            branchName: branchName,
            ifscCode: ifscCode,
            city: city,
            state: state,
            pincode: pincode,
            address: address || null
        };

        if (saveBtn) {
            saveBtn.disabled = true;
            saveBtn.innerText = 'Saving...';
        }

        try {
            if (id) {
                await apiPut(`/branches/${id}`, payload);
                showToast('Branch updated successfully', 'success');
            } else {
                await apiPost('/branches', payload);
                showToast('Branch registered successfully', 'success');
            }
            closeModal();
            await window.fetchBranches();
        } catch (err) {
            if (errorDiv) {
                errorDiv.style.display = 'block';
                errorDiv.innerText = err.message || 'Failed to save branch.';
            }
        } finally {
            if (saveBtn) {
                saveBtn.disabled = false;
                saveBtn.innerText = 'Save Branch';
            }
        }
    };

    window.deleteBranch = function (id, name) {
        showConfirmDialog(
            'Delete Branch Confirmation',
            `Are you sure you want to delete branch "${name || ('#' + id)}"?`,
            async () => {
                try {
                    await apiDelete(`/branches/${id}`);
                    showToast('Branch deleted successfully', 'success');
                    await window.fetchBranches();
                } catch (e) {
                    showToast(e.message || 'Failed to delete branch', 'error');
                }
            }
        );
    };

})();
