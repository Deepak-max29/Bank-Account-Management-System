// js/transactions.js - Core Financial Transactions (Deposit, Withdraw, Transfer) & Audit Ledger

let transactionHistory = [];
let txnSearchQuery = '';

window.loadTransactions = () => {
    const container = document.getElementById('main-content');
    container.innerHTML = `
        <div class="page-header mb-2">
            <div>
                <h2 class="page-title">Financial Transactions</h2>
                <p class="text-muted">Execute real-time deposits, withdrawals, fund transfers, and inspect ledger histories</p>
            </div>
            <div class="action-buttons-group">
                <button class="btn btn-outline" onclick="exportTransactionsCsv()">
                    <span>📥</span> Export Ledger CSV
                </button>
            </div>
        </div>
        
        <!-- Transaction Processing Card with Tabs -->
        <div class="card card-premium mb-2">
            <div class="tabs-header">
                <button class="tab-btn active" id="tab-deposit" onclick="switchTrxTab('deposit')">
                    <span>📥</span> Cash Deposit
                </button>
                <button class="tab-btn" id="tab-withdraw" onclick="switchTrxTab('withdraw')">
                    <span>📤</span> Cash Withdrawal
                </button>
                <button class="tab-btn" id="tab-transfer" onclick="switchTrxTab('transfer')">
                    <span>⇄</span> Internal Transfer
                </button>
            </div>
            <div id="trx-action-container" class="tab-content-area"></div>
        </div>

        <!-- Ledger History Card -->
        <div class="card card-premium">
            <div class="card-header-flex">
                <div>
                    <h3 class="card-heading">Transaction Ledger History</h3>
                    <p class="text-xs text-muted">Recent financial operations recorded in Oracle XE ledger</p>
                </div>
                <div class="search-box sm">
                    <span class="search-icon">🔍</span>
                    <input type="text" id="txn-search-input" class="search-input" 
                        placeholder="Search ledger by Txn ID, Acc No, Type, or Remarks..." 
                        oninput="onTxnSearch(this.value)">
                </div>
            </div>
            <div id="transactions-table-container" class="mt-2">
                <div class="loading-state">
                    <div class="spinner"></div>
                    <p class="mt-1 text-muted">Loading transaction records...</p>
                </div>
            </div>
        </div>
    `;

    renderTrxForm('deposit');
    fetchTransactions();
};

window.switchTrxTab = (type) => {
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
    const activeBtn = document.getElementById(`tab-${type}`);
    if (activeBtn) activeBtn.classList.add('active');
    renderTrxForm(type);
};

const renderTrxForm = (type) => {
    const container = document.getElementById('trx-action-container');
    if (!container) return;
    
    if (type === 'deposit' || type === 'withdraw') {
        const isDep = type === 'deposit';
        container.innerHTML = `
            <form id="trx-form" class="modal-form-grid" onsubmit="event.preventDefault(); processTrx('${type}');">
                <div class="form-group">
                    <label for="trx-acc">Target Account Number <span class="required">*</span></label>
                    <input type="number" id="trx-acc" class="form-control" placeholder="e.g. 1001" required>
                    <small class="field-hint">Oracle XE Account ID</small>
                </div>

                <div class="form-group">
                    <label for="trx-amount">Amount (₹) <span class="required">*</span></label>
                    <input type="number" step="0.01" min="1" id="trx-amount" class="form-control" placeholder="0.00" required>
                    <small class="field-hint">Minimum transaction amount is ₹1.00</small>
                </div>

                <div class="form-group full-width">
                    <label for="trx-remarks">Transaction Remarks</label>
                    <input type="text" id="trx-remarks" class="form-control" placeholder="${isDep ? 'Cash deposit at counter' : 'ATM / Branch withdrawal'}">
                </div>

                <div class="form-group full-width mt-1">
                    <button type="submit" class="btn ${isDep ? 'btn-success' : 'btn-danger'}">
                        ${isDep ? '📥 Process Cash Deposit' : '📤 Process Cash Withdrawal'}
                    </button>
                </div>
            </form>
        `;
    } else if (type === 'transfer') {
        container.innerHTML = `
            <form id="trx-form" class="modal-form-grid" onsubmit="event.preventDefault(); processTrx('transfer');">
                <div class="form-group">
                    <label for="trx-from-acc">Source (From) Account <span class="required">*</span></label>
                    <input type="number" id="trx-from-acc" class="form-control" placeholder="e.g. 1001" required>
                    <small class="field-hint">Account to be debited</small>
                </div>

                <div class="form-group">
                    <label for="trx-to-acc">Destination (To) Account <span class="required">*</span></label>
                    <input type="number" id="trx-to-acc" class="form-control" placeholder="e.g. 1002" required>
                    <small class="field-hint">Account to be credited</small>
                </div>

                <div class="form-group">
                    <label for="trx-amount">Transfer Amount (₹) <span class="required">*</span></label>
                    <input type="number" step="0.01" min="1" id="trx-amount" class="form-control" placeholder="0.00" required>
                </div>

                <div class="form-group">
                    <label for="trx-remarks">Payment Narration / Remarks</label>
                    <input type="text" id="trx-remarks" class="form-control" placeholder="Funds transfer / Bill payment">
                </div>

                <div class="form-group full-width mt-1">
                    <button type="submit" class="btn btn-primary">
                        ⇄ Authorize Fund Transfer
                    </button>
                </div>
            </form>
        `;
    }
};

window.processTrx = async (type) => {
    const amountVal = document.getElementById('trx-amount').value;
    const remarksVal = document.getElementById('trx-remarks').value;
    
    if (!amountVal || Number(amountVal) <= 0) {
        showToast('Please specify a valid positive amount.', 'warning');
        return;
    }

    try {
        if (type === 'deposit' || type === 'withdraw') {
            const accNo = document.getElementById('trx-acc').value;
            if (!accNo) {
                showToast('Please enter an account number.', 'warning');
                return;
            }

            const payload = {
                accountNo: Number(accNo),
                amount: Number(amountVal),
                channel: 'BRANCH',
                remarks: remarksVal || (type === 'deposit' ? 'Branch Cash Deposit' : 'Branch Cash Withdrawal')
            };

            const endpoint = type === 'deposit' ? '/transactions/deposit' : '/transactions/withdraw';
            const res = await apiPost(endpoint, payload);
            
            showToast(`${type === 'deposit' ? 'Deposit' : 'Withdrawal'} successful! New Balance: ${formatCurrency(res.data ? res.data.balanceAfter : res.balanceAfter)}`, 'success');
            document.getElementById('trx-form').reset();
            fetchTransactions();

        } else if (type === 'transfer') {
            const fromAcc = document.getElementById('trx-from-acc').value;
            const toAcc = document.getElementById('trx-to-acc').value;

            if (!fromAcc || !toAcc) {
                showToast('Please enter both source and destination account numbers.', 'warning');
                return;
            }
            if (fromAcc === toAcc) {
                showToast('Source and destination accounts cannot be identical.', 'warning');
                return;
            }

            const payload = {
                sourceAccountNo: Number(fromAcc),
                destinationAccountNo: Number(toAcc),
                amount: Number(amountVal),
                channel: 'ONLINE',
                remarks: remarksVal || 'Internal Account Transfer',
                idempotencyKey: 'TRF-' + Date.now() + '-' + Math.random().toString(36).substring(2, 8)
            };

            await apiPost('/transactions/transfer', payload);
            showToast('Transfer completed successfully!', 'success');
            document.getElementById('trx-form').reset();
            fetchTransactions();
        }
    } catch (e) {}
};

const fetchTransactions = async () => {
    const container = document.getElementById('transactions-table-container');
    if (!container) return;

    try {
        const res = await apiGet('/transactions/recent?limit=25');
        const list = Array.isArray(res) ? res : (res && res.data ? res.data : []);
        transactionHistory = list;
        renderTrxTable();
    } catch (error) {
        showErrorState(container, 'Failed to load transactions: ' + (error.message || 'Server error'), fetchTransactions);
    }
};

window.onTxnSearch = (query) => {
    txnSearchQuery = (query || '').trim().toLowerCase();
    renderTrxTable();
};

const renderTrxTable = () => {
    const container = document.getElementById('transactions-table-container');
    if (!container) return;

    const filtered = transactionHistory.filter(t => {
        if (!txnSearchQuery) return true;
        const id = String(t.txnId || '');
        const acc = String(t.accountNo || '');
        const type = (t.txnType || '').toLowerCase();
        const rem = (t.remarks || '').toLowerCase();
        const chan = (t.channel || '').toLowerCase();
        return id.includes(txnSearchQuery) || 
               acc.includes(txnSearchQuery) || 
               type.includes(txnSearchQuery) || 
               rem.includes(txnSearchQuery) ||
               chan.includes(txnSearchQuery);
    });

    if (!filtered || filtered.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <span class="empty-icon">💸</span>
                <p class="empty-text">No transactions found matching your criteria.</p>
            </div>
        `;
        return;
    }

    const rows = filtered.map(t => {
        const type = (t.txnType || '').toUpperCase();
        let badgeClass = 'badge-neutral';
        let amountClass = '';
        let sign = '';

        if (type === 'DEPOSIT') {
            badgeClass = 'badge-success';
            amountClass = 'text-success font-semibold';
            sign = '+';
        } else if (type === 'WITHDRAWAL') {
            badgeClass = 'badge-danger';
            amountClass = 'text-danger font-semibold';
            sign = '-';
        } else if (type.includes('TRANSFER')) {
            badgeClass = 'badge-purple';
            amountClass = 'text-purple font-semibold';
            sign = '⇄ ';
        }

        const dateStr = t.txnDate ? formatDateTime(t.txnDate) : '-';
        const remarksStr = t.remarks ? escapeHtml(t.remarks) : '-';

        return `
            <tr>
                <td class="font-mono font-medium">#${t.txnId}</td>
                <td class="font-mono">#${t.accountNo}</td>
                <td><span class="badge ${badgeClass}">${escapeHtml(type)}</span></td>
                <td class="${amountClass}">${sign}${formatCurrency(t.amount)}</td>
                <td class="font-mono text-sm">${t.balanceAfter !== null && t.balanceAfter !== undefined ? formatCurrency(t.balanceAfter) : '-'}</td>
                <td><span class="badge badge-channel">${escapeHtml(t.channel || 'BRANCH')}</span></td>
                <td class="text-sm text-muted">${dateStr}</td>
                <td class="text-sm text-truncate" title="${remarksStr}">${remarksStr}</td>
            </tr>
        `;
    }).join('');

    container.innerHTML = `
        <div class="table-responsive">
            <table class="table-modern">
                <thead>
                    <tr>
                        <th>Txn ID</th>
                        <th>Account No</th>
                        <th>Type</th>
                        <th>Amount</th>
                        <th>Balance After</th>
                        <th>Channel</th>
                        <th>Timestamp</th>
                        <th>Remarks</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows}
                </tbody>
            </table>
        </div>
    `;
};

// CSV Export
window.exportTransactionsCsv = () => {
    window.location.href = '/api/csv/export/transactions';
};
