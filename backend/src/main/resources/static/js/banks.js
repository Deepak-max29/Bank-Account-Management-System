// js/banks.js — Banks Management Module
(function () {
    'use strict';

    let allBanks = [];

    window.loadBanks = async function () {
        const container = document.getElementById('main-content');
        if (!container) return;

        container.innerHTML = `
            <div class="page-header" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:1.5rem;">
                <div>
                    <h2>🏛️ Banks Management</h2>
                    <p class="text-muted" style="margin:4px 0 0 0;font-size:0.9rem;">View, register, and manage partnering banking institutions.</p>
                </div>
                <div style="display:flex;gap:8px;">
                    <button class="btn btn-outline btn-sm" onclick="window.fetchBanks()" title="Refresh list">↻ Refresh</button>
                    <button class="btn btn-primary" onclick="window.openBankModal()">+ Add Bank</button>
                </div>
            </div>

            <div class="action-bar" style="display:flex;gap:12px;align-items:center;margin-bottom:1.5rem;flex-wrap:wrap;">
                <div class="search-wrapper" style="flex:1;min-width:250px;position:relative;">
                    <span class="search-icon" style="position:absolute;left:10px;top:50%;transform:translateY(-50%);color:#888;">🔍</span>
                    <input type="text" id="bank-search" class="form-control" placeholder="Search by bank name, head office, email, phone..." oninput="window.filterBanks()" style="padding-left:34px;width:100%;">
                </div>
            </div>

            <div class="card" style="margin-bottom:0;">
                <div id="banks-table-container">
                    <div class="loading-container"><div class="spinner"></div></div>
                </div>
            </div>
        `;

        await window.fetchBanks();
    };

    window.fetchBanks = async function () {
        const container = document.getElementById('banks-table-container');
        if (!container) return;
        showLoading(container);

        try {
            const res = await apiGet('/banks');
            const data = (res && res.data) ? res.data : (Array.isArray(res) ? res : (res && res.content ? res.content : []));
            allBanks = Array.isArray(data) ? data : [];
            window.renderBanksTable(allBanks);
        } catch (error) {
            showErrorState(container, 'Failed to load bank records from database: ' + (error.message || error), () => window.fetchBanks());
        }
    };

    window.filterBanks = function () {
        const query = (document.getElementById('bank-search')?.value || '').toLowerCase().trim();
        if (!query) {
            window.renderBanksTable(allBanks);
            return;
        }

        const filtered = allBanks.filter(b => {
            const name = (b.bankName || '').toLowerCase();
            const ho = (b.headOffice || b.hoAddress || '').toLowerCase();
            const email = (b.email || '').toLowerCase();
            const phone = (b.contactNo || b.contactNumber || '').toLowerCase();
            const web = (b.website || '').toLowerCase();
            return name.includes(query) || ho.includes(query) || email.includes(query) || phone.includes(query) || web.includes(query);
        });

        window.renderBanksTable(filtered);
    };

    window.renderBanksTable = function (banks) {
        const container = document.getElementById('banks-table-container');
        if (!container) return;

        if (!banks || banks.length === 0) {
            container.innerHTML = `
                <div class="empty-state" style="text-align:center;padding:2.5rem 1rem;">
                    <div class="empty-state-icon" style="font-size:2.5rem;margin-bottom:0.75rem;">🏛️</div>
                    <p style="color:var(--text-muted,#6c757d);margin:0;font-size:1rem;">No banks found.</p>
                </div>
            `;
            return;
        }

        const headers = ['Bank ID', 'Bank Name', 'Head Office', 'Contact Number', 'Email', 'Website', 'Actions'];
        const rows = banks.map(b => [
            `<strong>#${b.bankId}</strong>`,
            `<strong>${escapeHtml(b.bankName || '-')}</strong>`,
            escapeHtml(b.headOffice || b.hoAddress || '-'),
            escapeHtml(b.contactNo || b.contactNumber || '-'),
            b.email ? `<a href="mailto:${escapeHtml(b.email)}">${escapeHtml(b.email)}</a>` : '-',
            b.website ? `<a href="${escapeHtml(b.website.startsWith('http') ? b.website : 'https://' + b.website)}" target="_blank" rel="noopener">${escapeHtml(b.website)}</a>` : '-',
            `<div style="display:flex;gap:6px;">
                <button class="btn btn-sm btn-outline" onclick='window.openBankModal(${JSON.stringify(b).replace(/'/g, "&#39;")})' title="Edit Bank">Edit</button>
                <button class="btn btn-sm btn-danger" onclick="window.deleteBank(${b.bankId}, '${escapeHtml(b.bankName || '')}')" title="Delete Bank">Delete</button>
             </div>`
        ]);

        container.innerHTML = createTable(headers, rows);
    };

    window.openBankModal = function (bank = null) {
        const isEdit = !!bank;
        const title = isEdit ? 'Edit Bank Record' : 'Register New Bank';
        const body = `
            <form id="bank-form" onsubmit="window.saveBank(event)">
                <input type="hidden" id="bank-id" value="${isEdit ? bank.bankId : ''}">
                <div class="form-group" style="margin-bottom:1rem;">
                    <label for="bank-name" style="display:block;font-weight:600;margin-bottom:0.25rem;">Bank Name *</label>
                    <input type="text" id="bank-name" class="form-control" value="${isEdit ? escapeHtml(bank.bankName || '') : ''}" placeholder="e.g. National Prosperity Bank" required style="width:100%;">
                </div>
                <div class="form-group" style="margin-bottom:1rem;">
                    <label for="bank-ho" style="display:block;font-weight:600;margin-bottom:0.25rem;">Head Office Address *</label>
                    <input type="text" id="bank-ho" class="form-control" value="${isEdit ? escapeHtml(bank.headOffice || bank.hoAddress || '') : ''}" placeholder="e.g. Connaught Place, New Delhi - 110001" required style="width:100%;">
                </div>
                <div class="form-group" style="margin-bottom:1rem;">
                    <label for="bank-phone" style="display:block;font-weight:600;margin-bottom:0.25rem;">Contact Number (10 digits) *</label>
                    <input type="tel" id="bank-phone" class="form-control" value="${isEdit ? escapeHtml(bank.contactNo || bank.contactNumber || '') : ''}" placeholder="e.g. 9876543210" pattern="^\\d{10}$" title="Contact number must be exactly 10 digits" required style="width:100%;">
                </div>
                <div class="form-group" style="margin-bottom:1rem;">
                    <label for="bank-email" style="display:block;font-weight:600;margin-bottom:0.25rem;">Official Email Address *</label>
                    <input type="email" id="bank-email" class="form-control" value="${isEdit ? escapeHtml(bank.email || '') : ''}" placeholder="e.g. info@npbank.in" required style="width:100%;">
                </div>
                <div class="form-group" style="margin-bottom:1rem;">
                    <label for="bank-website" style="display:block;font-weight:600;margin-bottom:0.25rem;">Website (Optional)</label>
                    <input type="text" id="bank-website" class="form-control" value="${isEdit ? escapeHtml(bank.website || '') : ''}" placeholder="e.g. www.npbank.in" style="width:100%;">
                </div>
                <div id="bank-form-error" style="display:none;color:#dc2626;margin-top:0.5rem;font-size:0.875rem;"></div>
            </form>
        `;
        const footer = `
            <button class="btn btn-outline" onclick="closeModal()">Cancel</button>
            <button class="btn btn-primary" id="bank-save-btn" onclick="window.saveBank()">Save Bank</button>
        `;
        showModal(title, body, footer);
    };

    window.saveBank = async function (e) {
        if (e) e.preventDefault();

        const id = document.getElementById('bank-id')?.value;
        const name = document.getElementById('bank-name')?.value?.trim();
        const headOffice = document.getElementById('bank-ho')?.value?.trim();
        const phone = document.getElementById('bank-phone')?.value?.trim();
        const email = document.getElementById('bank-email')?.value?.trim();
        const website = document.getElementById('bank-website')?.value?.trim();
        const errorDiv = document.getElementById('bank-form-error');
        const saveBtn = document.getElementById('bank-save-btn');

        if (errorDiv) {
            errorDiv.style.display = 'none';
            errorDiv.innerText = '';
        }

        if (!name || !headOffice || !phone || !email) {
            if (errorDiv) {
                errorDiv.style.display = 'block';
                errorDiv.innerText = 'Please fill all required fields.';
            }
            return;
        }

        if (!/^\d{10}$/.test(phone)) {
            if (errorDiv) {
                errorDiv.style.display = 'block';
                errorDiv.innerText = 'Contact number must be exactly 10 digits.';
            }
            return;
        }

        if (!validateEmail(email)) {
            if (errorDiv) {
                errorDiv.style.display = 'block';
                errorDiv.innerText = 'Please enter a valid email address.';
            }
            return;
        }

        const payload = {
            bankName: name,
            headOffice: headOffice,
            contactNo: phone,
            email: email,
            website: website || null
        };

        if (saveBtn) {
            saveBtn.disabled = true;
            saveBtn.innerText = 'Saving...';
        }

        try {
            if (id) {
                await apiPut(`/banks/${id}`, payload);
                showToast('Bank updated successfully', 'success');
            } else {
                await apiPost('/banks', payload);
                showToast('Bank registered successfully', 'success');
            }
            closeModal();
            await window.fetchBanks();
        } catch (err) {
            if (errorDiv) {
                errorDiv.style.display = 'block';
                errorDiv.innerText = err.message || 'Failed to save bank.';
            }
        } finally {
            if (saveBtn) {
                saveBtn.disabled = false;
                saveBtn.innerText = 'Save Bank';
            }
        }
    };

    window.deleteBank = function (id, name) {
        showConfirmDialog(
            'Delete Bank Confirmation',
            `Are you sure you want to delete bank "${name || ('#' + id)}"? This will also affect linked branches.`,
            async () => {
                try {
                    await apiDelete(`/banks/${id}`);
                    showToast('Bank deleted successfully', 'success');
                    await window.fetchBanks();
                } catch (e) {
                    showToast(e.message || 'Failed to delete bank', 'error');
                }
            }
        );
    };

})();
