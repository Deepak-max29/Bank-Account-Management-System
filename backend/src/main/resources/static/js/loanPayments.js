// js/loanPayments.js

let allLoanPayments = [];
let activeLoansList = [];

window.loadLoanPayments = async () => {
    const container = document.getElementById('main-content');
    container.innerHTML = `
        <div class="page-header">
            <h2>Loan Payments Management</h2>
            <button class="btn btn-primary" id="make-repayment-btn" onclick="openRepaymentModal()">+ Make Loan Repayment</button>
        </div>
        <div class="action-bar">
            <div class="search-wrapper">
                <span class="search-icon">🔍</span>
                <input type="text" id="payment-search" placeholder="Search by Payment ID, Loan ID, Mode..." oninput="filterLoanPayments()">
            </div>
            <div style="min-width: 160px;">
                <select id="payment-mode-filter" onchange="filterLoanPayments()">
                    <option value="">All Modes</option>
                    <option value="CASH">Cash</option>
                    <option value="CHEQUE">Cheque</option>
                    <option value="ONLINE">Online Transfer</option>
                    <option value="EMI">EMI</option>
                    <option value="AUTO_DEBIT">Auto Debit</option>
                </select>
            </div>
            <button class="btn btn-outline btn-sm" onclick="fetchLoanPayments()" title="Refresh">↻ Refresh</button>
        </div>
        <div class="card">
            <div id="payments-table-container"></div>
        </div>
    `;

    await fetchActiveLoans();
    await fetchLoanPayments();
};

const fetchActiveLoans = async () => {
    try {
        const res = await apiGet('/loans');
        const list = Array.isArray(res) ? res : (res && res.data ? res.data : []);
        activeLoansList = list.filter(l => l.loanStatus === 'ACTIVE');
    } catch (e) {
        console.warn('Could not load active loans list for repayment:', e);
    }
};

const fetchLoanPayments = async () => {
    const tableContainer = document.getElementById('payments-table-container');
    if (!tableContainer) return;
    showLoading(tableContainer);

    try {
        const res = await apiGet('/loan-payments');
        allLoanPayments = Array.isArray(res) ? res : (res && res.data ? res.data : []);
        renderLoanPaymentsTable(allLoanPayments);
    } catch (error) {
        showErrorState(tableContainer, 'Failed to load loan payments from server.', () => fetchLoanPayments());
    }
};

window.filterLoanPayments = () => {
    const searchInput = document.getElementById('payment-search');
    const modeFilter = document.getElementById('payment-mode-filter');

    const query = searchInput ? searchInput.value.trim().toLowerCase() : '';
    const selectedMode = modeFilter ? modeFilter.value : '';

    const filtered = allLoanPayments.filter(p => {
        const payIdStr = String(p.paymentId || '');
        const loanIdStr = String(p.loanId || '');
        const modeStr = String(p.paymentMode || p.paymentMethod || '').toLowerCase();
        const remarksStr = (p.remarks || '').toLowerCase();

        const matchesQuery = !query ||
            payIdStr.includes(query) ||
            loanIdStr.includes(query) ||
            modeStr.includes(query) ||
            remarksStr.includes(query);

        const matchesMode = !selectedMode || String(p.paymentMode || p.paymentMethod || '').toUpperCase() === selectedMode;

        return matchesQuery && matchesMode;
    });

    renderLoanPaymentsTable(filtered);
};

const renderLoanPaymentsTable = (payments) => {
    const tableContainer = document.getElementById('payments-table-container');
    if (!tableContainer) return;

    if (!payments || payments.length === 0) {
        tableContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📄</div>
                <p>No loan payments recorded yet.</p>
            </div>
        `;
        return;
    }

    const headers = ['Payment ID', 'Loan ID', 'Payment Date', 'Amount Paid', 'Remaining Balance', 'Payment Mode', 'Remarks'];
    const rows = payments.map(p => {
        const pId = `#${p.paymentId}`;
        const lId = `Loan #${p.loanId}`;
        const pDate = formatDate(p.paymentDate);
        const amount = formatCurrency(p.amountPaid);
        const remBal = formatCurrency(p.remainingBalance);
        const mode = `<span class="badge badge-info">${escapeHtml(p.paymentMode || p.paymentMethod || 'CASH')}</span>`;
        const remarks = escapeHtml(p.remarks || '-');

        return [pId, lId, pDate, amount, remBal, mode, remarks];
    });

    tableContainer.innerHTML = createTable(headers, rows);
};

window.openRepaymentModalForId = async (loanId) => {
    await openRepaymentModal(loanId);
};

window.openRepaymentModal = async (preselectedLoanId = null) => {
    if (!activeLoansList.length) {
        await fetchActiveLoans();
    }

    if (!activeLoansList.length) {
        showToast('No active loans available for repayment.', 'warning');
        return;
    }

    const loanOptions = activeLoansList.map(l => {
        const isSelected = preselectedLoanId && String(l.loanId) === String(preselectedLoanId);
        return `<option value="${l.loanId}" ${isSelected ? 'selected' : ''}>Loan #${l.loanId} (Customer ID: ${l.customerId}, Outstanding: ${formatCurrency(l.outstandingBal)})</option>`;
    }).join('');

    const bodyHtml = `
        <form id="repayment-form" class="form-grid" onsubmit="event.preventDefault(); saveLoanRepayment();">
            <div class="form-group full-width">
                <label for="repay-loan">Active Loan <span class="text-danger">*</span></label>
                <select id="repay-loan" class="form-control" required onchange="onRepayLoanSelected()">
                    <option value="">-- Select Active Loan --</option>
                    ${loanOptions}
                </select>
            </div>

            <div class="form-group full-width" id="repay-loan-info-box" style="display: none; background: var(--bg); padding: 1rem; border-radius: 0.375rem; border: 1px solid var(--border);">
                <div><strong>Loan Type:</strong> <span id="info-loan-type">-</span></div>
                <div><strong>Current Outstanding Balance:</strong> <span id="info-loan-outstanding" class="text-danger font-weight-bold">₹0.00</span></div>
            </div>

            <div class="form-group">
                <label for="repay-amount">Repayment Amount (₹) <span class="text-danger">*</span></label>
                <input type="number" id="repay-amount" class="form-control" step="0.01" min="0.01" required placeholder="e.g. 5000.00">
            </div>

            <div class="form-group">
                <label for="repay-mode">Payment Mode <span class="text-danger">*</span></label>
                <select id="repay-mode" class="form-control" required>
                    <option value="EMI">EMI</option>
                    <option value="CASH">Cash</option>
                    <option value="ONLINE">Online Transfer</option>
                    <option value="CHEQUE">Cheque</option>
                    <option value="AUTO_DEBIT">Auto Debit</option>
                </select>
            </div>

            <div class="form-group full-width">
                <label for="repay-remarks">Remarks</label>
                <input type="text" id="repay-remarks" class="form-control" placeholder="e.g. Monthly EMI installment">
            </div>

            <div id="repayment-form-error" class="error-message full-width" style="display: none;"></div>
        </form>
    `;

    const footerHtml = `
        <button type="button" class="btn btn-outline" onclick="closeModal()">Cancel</button>
        <button type="button" class="btn btn-primary" id="save-repayment-btn" onclick="saveLoanRepayment()">Record Payment</button>
    `;

    showModal('Make Loan Repayment', bodyHtml, footerHtml);

    if (preselectedLoanId) {
        onRepayLoanSelected();
    }
};

window.onRepayLoanSelected = () => {
    const loanSelect = document.getElementById('repay-loan');
    const infoBox = document.getElementById('repay-loan-info-box');
    const typeSpan = document.getElementById('info-loan-type');
    const outSpan = document.getElementById('info-loan-outstanding');

    if (!loanSelect || !infoBox) return;

    const selectedId = loanSelect.value;
    const loan = activeLoansList.find(l => String(l.loanId) === String(selectedId));

    if (loan) {
        if (typeSpan) typeSpan.innerText = loan.loanType || '-';
        if (outSpan) outSpan.innerText = formatCurrency(loan.outstandingBal);
        infoBox.style.display = 'block';
    } else {
        infoBox.style.display = 'none';
    }
};

window.saveLoanRepayment = async () => {
    const errorBox = document.getElementById('repayment-form-error');
    if (errorBox) errorBox.style.display = 'none';

    const loanIdVal = document.getElementById('repay-loan').value;
    const amountVal = document.getElementById('repay-amount').value.trim();
    const paymentMode = document.getElementById('repay-mode').value;
    const remarks = document.getElementById('repay-remarks').value.trim();

    if (!loanIdVal) {
        showRepaymentFormError('Please select an active loan.');
        return;
    }

    const selectedLoan = activeLoansList.find(l => String(l.loanId) === String(loanIdVal));
    if (!selectedLoan) {
        showRepaymentFormError('Selected loan is no longer active or valid.');
        return;
    }

    if (!amountVal || isNaN(amountVal) || parseFloat(amountVal) <= 0) {
        showRepaymentFormError('Payment amount must be greater than zero.');
        return;
    }

    const payAmt = parseFloat(amountVal);
    if (payAmt > selectedLoan.outstandingBal) {
        showRepaymentFormError(`Payment amount (₹${payAmt}) cannot exceed outstanding balance (${formatCurrency(selectedLoan.outstandingBal)}).`);
        return;
    }

    const payload = {
        loanId: parseInt(loanIdVal, 10),
        amountPaid: payAmt,
        paymentMode: paymentMode,
        remarks: remarks || 'Loan EMI Repayment'
    };

    const saveBtn = document.getElementById('save-repayment-btn');
    if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.innerText = 'Processing...';
    }

    try {
        await apiPost('/loan-payments', payload);
        showToast('Loan payment recorded successfully!', 'success');
        closeModal();
        await fetchActiveLoans();
        await fetchLoanPayments();
    } catch (err) {
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.innerText = 'Record Payment';
        }
        showRepaymentFormError(err.message || 'Payment processing failed. Please check inputs.');
    }
};

const showRepaymentFormError = (msg) => {
    const errorBox = document.getElementById('repayment-form-error');
    if (errorBox) {
        errorBox.innerText = msg;
        errorBox.style.display = 'block';
    } else {
        showToast(msg, 'error');
    }
};
