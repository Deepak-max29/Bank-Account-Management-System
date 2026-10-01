// js/dashboard.js - Premium Dashboard with Live Stats & Recent Transactions

window.loadDashboard = async () => {
    const container = document.getElementById('main-content');
    showLoading(container);
    
    try {
        // Fetch live stats and recent transactions in parallel
        const [statsRes, txnsRes] = await Promise.allSettled([
            apiGet('/dashboard/stats'),
            apiGet('/dashboard/recent-transactions?limit=8')
        ]);
        
        let stats = {
            totalCustomers: 0,
            activeAccounts: 0,
            totalBranches: 0,
            transactionCount: 0,
            loanCount: 0,
            totalDeposits: 0,
            totalWithdrawals: 0
        };
        
        if (statsRes.status === 'fulfilled' && statsRes.value) {
            const raw = statsRes.value.data || statsRes.value;
            stats = {
                totalCustomers: raw.totalCustomers ?? 0,
                activeAccounts: raw.activeAccounts ?? 0,
                totalBranches: raw.totalBranches ?? 0,
                transactionCount: raw.transactionCount ?? 0,
                loanCount: raw.loanCount ?? 0,
                totalDeposits: raw.totalDeposits ?? 0,
                totalWithdrawals: raw.totalWithdrawals ?? 0
            };
        }
        
        const txns = (txnsRes.status === 'fulfilled' && txnsRes.value) 
            ? (Array.isArray(txnsRes.value) ? txnsRes.value : (txnsRes.value.data || [])) 
            : [];
        
        const html = `
            <div class="dashboard-header mb-2">
                <div class="header-titles">
                    <h2 class="page-title">Executive Dashboard</h2>
                    <p class="text-muted">Real-time overview of core banking operations, liquidity, and ledger transactions</p>
                </div>
                <div class="dashboard-actions">
                    <button class="btn btn-outline btn-sm" onclick="window.loadDashboard()">
                        <span class="btn-icon">🔄</span> Refresh Data
                    </button>
                </div>
            </div>

            <!-- Primary Stat Cards Grid -->
            <div class="dashboard-stats-grid">
                <div class="stat-card gradient-blue">
                    <div class="stat-card-icon">👥</div>
                    <div class="stat-card-body">
                        <div class="stat-card-title">Total Customers</div>
                        <div class="stat-card-value">${Number(stats.totalCustomers).toLocaleString('en-IN')}</div>
                        <div class="stat-card-sub">Registered KYC accounts</div>
                    </div>
                </div>

                <div class="stat-card gradient-purple">
                    <div class="stat-card-icon">💳</div>
                    <div class="stat-card-body">
                        <div class="stat-card-title">Active Accounts</div>
                        <div class="stat-card-value">${Number(stats.activeAccounts).toLocaleString('en-IN')}</div>
                        <div class="stat-card-sub">Savings & Current ledgers</div>
                    </div>
                </div>

                <div class="stat-card gradient-teal">
                    <div class="stat-card-icon">🏢</div>
                    <div class="stat-card-body">
                        <div class="stat-card-title">Branch Network</div>
                        <div class="stat-card-value">${Number(stats.totalBranches).toLocaleString('en-IN')}</div>
                        <div class="stat-card-sub">Operational branch locations</div>
                    </div>
                </div>

                <div class="stat-card gradient-gold">
                    <div class="stat-card-icon">⚡</div>
                    <div class="stat-card-body">
                        <div class="stat-card-title">Total Transactions</div>
                        <div class="stat-card-value">${Number(stats.transactionCount).toLocaleString('en-IN')}</div>
                        <div class="stat-card-sub">Logged financial events</div>
                    </div>
                </div>
            </div>

            <!-- Liquidity & Financial Summary Grid -->
            <div class="financial-summary-grid mt-2">
                <div class="finance-card deposits-card">
                    <div class="finance-header">
                        <div class="finance-badge in">Deposits Inflow</div>
                        <span class="finance-symbol">📈</span>
                    </div>
                    <div class="finance-amount">${formatCurrency(stats.totalDeposits)}</div>
                    <div class="finance-footer">Cumulative aggregate customer deposits</div>
                </div>

                <div class="finance-card withdrawals-card">
                    <div class="finance-header">
                        <div class="finance-badge out">Withdrawals Outflow</div>
                        <span class="finance-symbol">📉</span>
                    </div>
                    <div class="finance-amount">${formatCurrency(stats.totalWithdrawals)}</div>
                    <div class="finance-footer">Cumulative cash withdrawals & debits</div>
                </div>

                <div class="finance-card loans-card">
                    <div class="finance-header">
                        <div class="finance-badge loan">Active Loans</div>
                        <span class="finance-symbol">📑</span>
                    </div>
                    <div class="finance-amount">${Number(stats.loanCount).toLocaleString('en-IN')} Loans</div>
                    <div class="finance-footer">Disbursed customer credit facilities</div>
                </div>
            </div>
            
            <!-- Dashboard Main Grid: Recent Transactions & Quick Actions -->
            <div class="dashboard-grid mt-2">
                <div class="card card-premium main-table-card">
                    <div class="card-header-flex">
                        <div class="card-header-left">
                            <h3 class="card-heading">Recent Transactions</h3>
                            <span class="badge badge-neutral">Latest 8 Activities</span>
                        </div>
                        <a href="#transactions" class="btn btn-outline btn-sm">View Full Ledger →</a>
                    </div>
                    <div id="recent-transactions-container" class="mt-1 table-responsive">
                        ${renderRecentTxnsHtml(txns)}
                    </div>
                </div>

                <div class="card card-premium quick-actions-card">
                    <div class="card-header-flex">
                        <h3 class="card-heading">Quick Actions</h3>
                        <span class="badge badge-accent">Operational</span>
                    </div>
                    <p class="text-muted text-sm mt-1">Frequently accessed banking modules and operations</p>
                    
                    <div class="quick-action-list mt-2">
                        <a href="#customers" class="quick-action-btn">
                            <span class="qa-icon">👤</span>
                            <div class="qa-details">
                                <span class="qa-title">Customer Onboarding</span>
                                <span class="qa-desc">Add customer & verify KYC</span>
                            </div>
                            <span class="qa-arrow">→</span>
                        </a>

                        <a href="#accounts" class="quick-action-btn">
                            <span class="qa-icon">🏦</span>
                            <div class="qa-details">
                                <span class="qa-title">Open New Account</span>
                                <span class="qa-desc">Savings / Current ledger</span>
                            </div>
                            <span class="qa-arrow">→</span>
                        </a>

                        <a href="#transactions" class="quick-action-btn highlight">
                            <span class="qa-icon">💸</span>
                            <div class="qa-details">
                                <span class="qa-title">Process Transaction</span>
                                <span class="qa-desc">Deposit, withdraw or transfer</span>
                            </div>
                            <span class="qa-arrow">→</span>
                        </a>

                        <a href="#banks" class="quick-action-btn">
                            <span class="qa-icon">🏛</span>
                            <div class="qa-details">
                                <span class="qa-title">Manage Banks</span>
                                <span class="qa-desc">Institutions & branches</span>
                            </div>
                            <span class="qa-arrow">→</span>
                        </a>

                        <a href="#reports" class="quick-action-btn">
                            <span class="qa-icon">📊</span>
                            <div class="qa-details">
                                <span class="qa-title">Analytics & Reports</span>
                                <span class="qa-desc">Export daily summaries</span>
                            </div>
                            <span class="qa-arrow">→</span>
                        </a>
                    </div>
                </div>
            </div>
        `;
        
        container.innerHTML = html;
        
    } catch (error) {
        showErrorState(container, 'Failed to load dashboard data: ' + (error.message || 'Unknown error'), window.loadDashboard);
    }
};

function renderRecentTxnsHtml(txns) {
    if (!txns || txns.length === 0) {
        return `
            <div class="empty-state">
                <span class="empty-icon">💸</span>
                <p class="empty-text">No recent transactions recorded in ledger.</p>
                <a href="#transactions" class="btn btn-sm btn-primary mt-1">Record First Transaction</a>
            </div>
        `;
    }
    
    const rows = txns.map(t => {
        const type = (t.txnType || '').toUpperCase();
        let typeBadgeClass = 'badge-neutral';
        let amountClass = '';
        let sign = '';
        
        if (type === 'DEPOSIT') {
            typeBadgeClass = 'badge-success';
            amountClass = 'text-success font-semibold';
            sign = '+';
        } else if (type === 'WITHDRAWAL') {
            typeBadgeClass = 'badge-danger';
            amountClass = 'text-danger font-semibold';
            sign = '-';
        } else if (type === 'TRANSFER' || type.includes('TRANSFER')) {
            typeBadgeClass = 'badge-purple';
            amountClass = 'text-purple font-semibold';
            sign = '⇄ ';
        }

        const dateStr = t.txnDate ? formatDateTime(t.txnDate) : '-';
        const remarksStr = t.remarks ? escapeHtml(t.remarks) : '-';
        const channelStr = t.channel ? escapeHtml(t.channel) : 'PORTAL';
        
        return `
            <tr>
                <td class="font-mono font-medium">#${t.txnId}</td>
                <td class="font-mono">${t.accountNo || '-'}</td>
                <td><span class="badge ${typeBadgeClass}">${escapeHtml(type)}</span></td>
                <td class="${amountClass}">${sign}${formatCurrency(t.amount)}</td>
                <td><span class="badge badge-channel">${channelStr}</span></td>
                <td class="text-sm text-muted">${dateStr}</td>
                <td class="text-sm text-truncate" title="${remarksStr}">${remarksStr}</td>
            </tr>
        `;
    }).join('');
    
    return `
        <table class="table-modern">
            <thead>
                <tr>
                    <th>Txn ID</th>
                    <th>Account No</th>
                    <th>Type</th>
                    <th>Amount</th>
                    <th>Channel</th>
                    <th>Timestamp</th>
                    <th>Remarks</th>
                </tr>
            </thead>
            <tbody>
                ${rows}
            </tbody>
        </table>
    `;
}
