// js/loans.js

let allLoans = [];
let loanCustomers = [];
let loanBranches = [];
let loanEmployees = [];

window.loadLoans = async () => {
    const container = document.getElementById('main-content');
    container.innerHTML = `
        <div class="page-header">
            <h2>Loans Management</h2>
            <button class="btn btn-primary" id="apply-loan-btn" onclick="openLoanApplicationModal()">+ Apply for Loan</button>
        </div>
        <div class="action-bar">
            <div class="search-wrapper">
                <span class="search-icon">🔍</span>
                <input type="text" id="loan-search" placeholder="Search by Loan ID, Customer, Type..." oninput="filterLoans()">
            </div>
            <div style="min-width: 160px;">
                <select id="loan-status-filter" onchange="filterLoans()">
                    <option value="">All Statuses</option>
                    <option value="PENDING">Pending</option>
                    <option value="ACTIVE">Active</option>
                    <option value="CLOSED">Closed</option>
                    <option value="REJECTED">Rejected</option>
                </select>
            </div>
            <div style="min-width: 160px;">
                <select id="loan-type-filter" onchange="filterLoans()">
                    <option value="">All Types</option>
                    <option value="PERSONAL">Personal</option>
                    <option value="HOME">Home</option>
                    <option value="AUTO">Auto</option>
                    <option value="EDUCATION">Education</option>
                    <option value="BUSINESS">Business</option>
                </select>
            </div>
            <button class="btn btn-outline btn-sm" onclick="fetchLoans()" title="Refresh">↻ Refresh</button>
        </div>
        <div class="card">
            <div id="loans-table-container"></div>
        </div>
    `;

    await loadLoanDropdownData();
    await fetchLoans();
};

const loadLoanDropdownData = async () => {
    try {
        const [cRes, bRes, eRes] = await Promise.all([
            apiGet('/customers'),
            apiGet('/branches'),
            apiGet('/employees')
        ]);
        loanCustomers = Array.isArray(cRes) ? cRes : (cRes && cRes.data ? cRes.data : []);
        loanBranches = Array.isArray(bRes) ? bRes : (bRes && bRes.data ? bRes.data : []);
        loanEmployees = Array.isArray(eRes) ? eRes : (eRes && eRes.data ? eRes.data : []);
    } catch (e) {
        console.warn('Error pre-loading dropdown data for loans:', e);
    }
};

const fetchLoans = async () => {
    const tableContainer = document.getElementById('loans-table-container');
    if (!tableContainer) return;
    showLoading(tableContainer);

    try {
        const res = await apiGet('/loans');
        allLoans = Array.isArray(res) ? res : (res && res.data ? res.data : []);
        renderLoansTable(allLoans);
    } catch (error) {
        showErrorState(tableContainer, 'Failed to load loans from server.', () => fetchLoans());
    }
};

window.filterLoans = () => {
    const searchInput = document.getElementById('loan-search');
    const statusFilter = document.getElementById('loan-status-filter');
    const typeFilter = document.getElementById('loan-type-filter');

    const query = searchInput ? searchInput.value.trim().toLowerCase() : '';
    const selectedStatus = statusFilter ? statusFilter.value : '';
    const selectedType = typeFilter ? typeFilter.value : '';

    const filtered = allLoans.filter(l => {
        const loanIdStr = String(l.loanId || '');
        const custObj = loanCustomers.find(c => String(c.customerId) === String(l.customerId));
        const custName = custObj ? `${custObj.firstName || ''} ${custObj.lastName || ''}`.toLowerCase() : (l.customerName || '').toLowerCase();
        const typeStr = (l.loanType || '').toLowerCase();
        const branchStr = (l.branchName || '').toLowerCase();

        const matchesQuery = !query ||
            loanIdStr.includes(query) ||
            custName.includes(query) ||
            typeStr.includes(query) ||
            branchStr.includes(query);

        const matchesStatus = !selectedStatus || String(l.loanStatus || '').toUpperCase() === selectedStatus;
        const matchesType = !selectedType || String(l.loanType || '').toUpperCase() === selectedType;

        return matchesQuery && matchesStatus && matchesType;
    });

    renderLoansTable(filtered);
};

const renderLoansTable = (loans) => {
    const tableContainer = document.getElementById('loans-table-container');
    if (!tableContainer) return;

    if (!loans || loans.length === 0) {
        tableContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">💵</div>
                <p>No loans found.</p>
            </div>
        `;
        return;
    }

    const headers = ['ID', 'Customer', 'Branch', 'Type', 'Principal', 'Rate (%)', 'Tenure (Mo)', 'Outstanding', 'Status', 'Actions'];
    const rows = loans.map(l => {
        const lId = l.loanId;
        const custObj = loanCustomers.find(c => String(c.customerId) === String(l.customerId));
        const custLabel = custObj 
            ? `${escapeHtml(custObj.firstName || '')} ${escapeHtml(custObj.lastName || '')} <small class="text-light">(ID: ${l.customerId})</small>`
            : (l.customerName ? escapeHtml(l.customerName) : `ID: ${l.customerId}`);

        const branchLabel = escapeHtml(l.branchName || (l.branchId ? `Branch #${l.branchId}` : '-'));
        const typeLabel = `<span class="badge badge-info">${escapeHtml(l.loanType || '-')}</span>`;
        const principal = l.principalAmount != null ? formatCurrency(l.principalAmount) : '-';
        const rate = l.interestRate != null ? `${l.interestRate}%` : '-';
        const tenure = l.loanTenure != null ? `${l.loanTenure}` : '-';
        const outstanding = l.outstandingBal != null ? formatCurrency(l.outstandingBal) : '-';

        let statusBadge = getStatusBadge(l.loanStatus);
        
        let actionButtons = `
            <button class="btn btn-sm btn-outline" onclick="viewLoanDetails(${lId})" title="View Details & Schedule">Details</button>
        `;

        if (l.loanStatus === 'PENDING') {
            actionButtons += `
                <button class="btn btn-sm btn-success" onclick="approveLoanAction(${lId})" title="Approve Loan">Approve</button>
                <button class="btn btn-sm btn-danger" onclick="rejectLoanAction(${lId})" title="Reject Loan">Reject</button>
            `;
        }

        if (l.loanStatus === 'ACTIVE') {
            actionButtons += `
                <button class="btn btn-sm btn-primary" onclick="openRepaymentForLoan(${lId})" title="Make Payment">Repay</button>
            `;
        }

        return [lId, custLabel, branchLabel, typeLabel, principal, rate, tenure, outstanding, statusBadge, actionButtons];
    });

    tableContainer.innerHTML = createTable(headers, rows);
};

window.openLoanApplicationModal = async () => {
    if (!loanCustomers.length || !loanBranches.length || !loanEmployees.length) {
        await loadLoanDropdownData();
    }

    if (!loanCustomers.length) {
        showToast('No customers found. Please add a customer first.', 'warning');
        return;
    }
    if (!loanBranches.length) {
        showToast('No branches found. Please add a branch first.', 'warning');
        return;
    }
    if (!loanEmployees.length) {
        showToast('No employees found. Please add an employee first.', 'warning');
        return;
    }

    const custOptions = loanCustomers.map(c => 
        `<option value="${c.customerId}">${escapeHtml(`${c.firstName || ''} ${c.lastName || ''}`.trim())} (ID: ${c.customerId})</option>`
    ).join('');

    const branchOptions = loanBranches.map(b => 
        `<option value="${b.branchId}">${escapeHtml(b.branchName || `Branch #${b.branchId}`)}</option>`
    ).join('');

    const empOptions = loanEmployees.map(e => 
        `<option value="${e.empId}">${escapeHtml(`${e.firstName || ''} ${e.lastName || ''}`.trim())} (${e.designation || 'Staff'})</option>`
    ).join('');

    const bodyHtml = `
        <form id="loan-form" class="form-grid" onsubmit="event.preventDefault(); saveLoanApplication();">
            <div class="form-group">
                <label for="loan-cust">Customer <span class="text-danger">*</span></label>
                <select id="loan-cust" class="form-control" required>
                    <option value="">-- Select Customer --</option>
                    ${custOptions}
                </select>
            </div>

            <div class="form-group">
                <label for="loan-branch">Branch <span class="text-danger">*</span></label>
                <select id="loan-branch" class="form-control" required>
                    <option value="">-- Select Branch --</option>
                    ${branchOptions}
                </select>
            </div>

            <div class="form-group">
                <label for="loan-emp">Sanctioning Officer <span class="text-danger">*</span></label>
                <select id="loan-emp" class="form-control" required>
                    <option value="">-- Select Officer --</option>
                    ${empOptions}
                </select>
            </div>

            <div class="form-group">
                <label for="loan-type">Loan Type <span class="text-danger">*</span></label>
                <select id="loan-type" class="form-control" required>
                    <option value="">-- Select Type --</option>
                    <option value="PERSONAL">Personal Loan</option>
                    <option value="HOME">Home Loan</option>
                    <option value="AUTO">Auto Loan</option>
                    <option value="EDUCATION">Education Loan</option>
                    <option value="BUSINESS">Business Loan</option>
                </select>
            </div>

            <div class="form-group">
                <label for="loan-principal">Principal Amount (₹) <span class="text-danger">*</span></label>
                <input type="number" id="loan-principal" class="form-control" step="1000" min="1000" required placeholder="e.g. 100000">
                <small class="text-light">Minimum amount: ₹1,000</small>
            </div>

            <div class="form-group">
                <label for="loan-rate">Annual Interest Rate (%) <span class="text-danger">*</span></label>
                <input type="number" id="loan-rate" class="form-control" step="0.1" min="0.1" max="100" required placeholder="e.g. 10.5">
            </div>

            <div class="form-group full-width">
                <label for="loan-tenure">Tenure (Months) <span class="text-danger">*</span></label>
                <input type="number" id="loan-tenure" class="form-control" step="1" min="1" max="360" required placeholder="e.g. 12">
            </div>

            <div id="loan-form-error" class="error-message full-width" style="display: none;"></div>
        </form>
    `;

    const footerHtml = `
        <button type="button" class="btn btn-outline" onclick="closeModal()">Cancel</button>
        <button type="button" class="btn btn-primary" id="save-loan-btn" onclick="saveLoanApplication()">Submit Application</button>
    `;

    showModal('Apply for Loan', bodyHtml, footerHtml);
};

window.saveLoanApplication = async () => {
    const errorBox = document.getElementById('loan-form-error');
    if (errorBox) errorBox.style.display = 'none';

    const customerId = document.getElementById('loan-cust').value;
    const branchId = document.getElementById('loan-branch').value;
    const sanctionedByEmp = document.getElementById('loan-emp').value;
    const loanType = document.getElementById('loan-type').value;
    const principalVal = document.getElementById('loan-principal').value.trim();
    const rateVal = document.getElementById('loan-rate').value.trim();
    const tenureVal = document.getElementById('loan-tenure').value.trim();

    if (!customerId || !branchId || !sanctionedByEmp || !loanType) {
        showLoanFormError('Please fill all required dropdown fields.');
        return;
    }
    if (!principalVal || isNaN(principalVal) || parseFloat(principalVal) < 1000) {
        showLoanFormError('Principal amount must be at least ₹1,000.');
        return;
    }
    if (!rateVal || isNaN(rateVal) || parseFloat(rateVal) <= 0) {
        showLoanFormError('Interest rate must be greater than 0.');
        return;
    }
    if (!tenureVal || isNaN(tenureVal) || parseInt(tenureVal, 10) < 1) {
        showLoanFormError('Loan tenure must be at least 1 month.');
        return;
    }

    const payload = {
        customerId: parseInt(customerId, 10),
        branchId: parseInt(branchId, 10),
        sanctionedByEmp: parseInt(sanctionedByEmp, 10),
        loanType,
        principalAmount: parseFloat(principalVal),
        interestRate: parseFloat(rateVal),
        loanTenure: parseInt(tenureVal, 10)
    };

    const saveBtn = document.getElementById('save-loan-btn');
    if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.innerText = 'Submitting...';
    }

    try {
        await apiPost('/loans', payload);
        showToast('Loan application submitted successfully', 'success');
        closeModal();
        await fetchLoans();
        filterLoans();
    } catch (err) {
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.innerText = 'Submit Application';
        }
        showLoanFormError(err.message || 'Failed to submit loan application.');
    }
};

window.approveLoanAction = (id) => {
    showConfirmDialog('Approve Loan', 'Are you sure you want to approve this loan? Outstanding balance will be initialized.', async () => {
        try {
            const resp = await fetch(`/api/loans/${id}/approve`, {
                method: 'PATCH',
                headers: getHeaders()
            });
            await handleResponse(resp);
            showToast('Loan approved successfully', 'success');
            await fetchLoans();
            filterLoans();
        } catch (e) {
            // handleResponse already shows toast for HTTP errors; only re-toast for network failures
            if (e.message && e.message !== 'Unauthorized' && e.message !== 'Forbidden') {
                console.error('Approve loan failed:', e.message);
            }
        }
    });
};

window.rejectLoanAction = (id) => {
    showConfirmDialog('Reject Loan', 'Are you sure you want to reject this loan application?', async () => {
        try {
            const resp = await fetch(`/api/loans/${id}/reject`, {
                method: 'PATCH',
                headers: getHeaders()
            });
            await handleResponse(resp);
            showToast('Loan application rejected', 'success');
            await fetchLoans();
            filterLoans();
        } catch (e) {
            if (e.message && e.message !== 'Unauthorized' && e.message !== 'Forbidden') {
                console.error('Reject loan failed:', e.message);
            }
        }
    });
};

window.viewLoanDetails = async (id) => {
    showModal(`Loan #${id} Details & EMI Schedule`, '<div class="spinner"></div>');

    try {
        const [loanRes, schedRes, payRes] = await Promise.all([
            apiGet(`/loans/${id}`),
            apiGet(`/loans/${id}/schedule`),
            apiGet(`/loan-payments/loan/${id}`)
        ]);

        const loan = Array.isArray(loanRes) ? loanRes[0] : (loanRes.data || loanRes);
        const schedule = Array.isArray(schedRes) ? schedRes : (schedRes.data || []);
        const payments = Array.isArray(payRes) ? payRes : (payRes.data || []);

        let schedRowsHtml = '';
        if (schedule && schedule.length > 0) {
            schedRowsHtml = schedule.map(s => `
                <tr>
                    <td>${s.installmentNo}</td>
                    <td>${formatDate(s.dueDate)}</td>
                    <td>${formatCurrency(s.emiAmount)}</td>
                    <td>${formatCurrency(s.principalComponent)}</td>
                    <td>${formatCurrency(s.interestComponent)}</td>
                    <td>${formatCurrency(s.balanceAfter)}</td>
                </tr>
            `).join('');
        }

        let payRowsHtml = '';
        if (payments && payments.length > 0) {
            payRowsHtml = payments.map(p => `
                <tr>
                    <td>#${p.paymentId}</td>
                    <td>${formatDate(p.paymentDate)}</td>
                    <td>${formatCurrency(p.amountPaid)}</td>
                    <td>${formatCurrency(p.remainingBalance)}</td>
                    <td><span class="badge badge-info">${escapeHtml(p.paymentMode || p.paymentMethod || 'CASH')}</span></td>
                </tr>
            `).join('');
        }

        const bodyHtml = `
            <div class="card mb-2" style="background:var(--bg); border:1px solid var(--border);">
                <h4>Loan Summary</h4>
                <div class="form-grid mt-1">
                    <div><strong>Customer ID:</strong> ${loan.customerId}</div>
                    <div><strong>Loan Type:</strong> ${escapeHtml(loan.loanType)}</div>
                    <div><strong>Principal:</strong> ${formatCurrency(loan.principalAmount)}</div>
                    <div><strong>Interest Rate:</strong> ${loan.interestRate}%</div>
                    <div><strong>Tenure:</strong> ${loan.loanTenure} Months</div>
                    <div><strong>Outstanding:</strong> ${formatCurrency(loan.outstandingBal)}</div>
                    <div><strong>Status:</strong> ${getStatusBadge(loan.loanStatus)}</div>
                </div>
            </div>

            <div class="tabs mt-2">
                <div class="tab active" id="tab-sched-btn" onclick="switchLoanDetailTab('sched')">EMI Schedule</div>
                <div class="tab" id="tab-pay-btn" onclick="switchLoanDetailTab('pay')">Repayment History (${payments.length})</div>
            </div>

            <div id="loan-tab-sched-content">
                ${schedule.length > 0 ? `
                    <div class="table-responsive" style="max-height: 250px;">
                        <table class="table">
                            <thead>
                                <tr><th>#</th><th>Due Date</th><th>EMI</th><th>Principal</th><th>Interest</th><th>Balance</th></tr>
                            </thead>
                            <tbody>${schedRowsHtml}</tbody>
                        </table>
                    </div>
                ` : '<p class="text-light">No schedule generated.</p>'}
            </div>

            <div id="loan-tab-pay-content" style="display: none;">
                ${payments.length > 0 ? `
                    <div class="table-responsive" style="max-height: 250px;">
                        <table class="table">
                            <thead>
                                <tr><th>Payment ID</th><th>Date</th><th>Amount Paid</th><th>Remaining</th><th>Mode</th></tr>
                            </thead>
                            <tbody>${payRowsHtml}</tbody>
                        </table>
                    </div>
                ` : '<p class="text-light">No payment history recorded.</p>'}
            </div>
        `;

        const footerHtml = `
            ${loan.loanStatus === 'ACTIVE' ? `<button class="btn btn-primary" onclick="closeModal(); openRepaymentForLoan(${loan.loanId});">Make Repayment</button>` : ''}
            <button class="btn btn-outline" onclick="closeModal()">Close</button>
        `;

        showModal(`Loan #${id} Details & EMI Schedule`, bodyHtml, footerHtml);
    } catch (e) {
        showModal('Error', `<p class="text-danger">${escapeHtml(e.message || 'Failed to load loan details.')}</p>`, '<button class="btn btn-outline" onclick="closeModal()">Close</button>');
    }
};

window.switchLoanDetailTab = (tab) => {
    const schedContent = document.getElementById('loan-tab-sched-content');
    const payContent = document.getElementById('loan-tab-pay-content');
    const schedBtn = document.getElementById('tab-sched-btn');
    const payBtn = document.getElementById('tab-pay-btn');

    if (tab === 'sched') {
        if (schedContent) schedContent.style.display = 'block';
        if (payContent) payContent.style.display = 'none';
        if (schedBtn) schedBtn.classList.add('active');
        if (payBtn) payBtn.classList.remove('active');
    } else {
        if (schedContent) schedContent.style.display = 'none';
        if (payContent) payContent.style.display = 'block';
        if (schedBtn) schedBtn.classList.remove('active');
        if (payBtn) payBtn.classList.add('active');
    }
};

window.openRepaymentForLoan = (loanId) => {
    if (window.location.hash !== '#loan-payments') {
        window.location.hash = '#loan-payments';
        setTimeout(() => {
            if (window.openRepaymentModalForId) window.openRepaymentModalForId(loanId);
        }, 200);
    } else {
        if (window.openRepaymentModalForId) window.openRepaymentModalForId(loanId);
    }
};

const showLoanFormError = (msg) => {
    const errorBox = document.getElementById('loan-form-error');
    if (errorBox) {
        errorBox.innerText = msg;
        errorBox.style.display = 'block';
    } else {
        showToast(msg, 'error');
    }
};
