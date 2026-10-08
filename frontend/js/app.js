// js/app.js

document.addEventListener('DOMContentLoaded', () => {
    initRouter();
    initSidebar();
    
    // Logout handler (POST /logout requires the CSRF token)
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try {
                const csrf = await (await fetch('/api/csrf')).json();
                if (csrf && csrf.token) {
                    const headers = {};
                    headers[csrf.headerName || 'X-XSRF-TOKEN'] = csrf.token;
                    await fetch('/logout', { method: 'POST', headers: headers });
                }
            } catch (e) {
                console.error('Logout request failed', e);
            }
            window.location.href = '/login?logout=true';
        });
    }

    // Load user info and apply role-based permissions
    loadUserInfo();
});

function initSidebar() {
    const sidebar = document.getElementById('sidebar');
    const toggle = document.getElementById('sidebar-toggle');
    const close = document.getElementById('sidebar-close');
    
    if (toggle) {
        toggle.addEventListener('click', () => sidebar.classList.add('open'));
    }
    if (close) {
        close.addEventListener('click', () => sidebar.classList.remove('open'));
    }
}

function initRouter() {
    window.addEventListener('hashchange', handleRoute);
    if (!window.location.hash) {
        window.location.hash = '#dashboard';
    } else {
        handleRoute();
    }
}

async function loadUserInfo() {
    try {
        const userInfo = document.getElementById('user-info');
        if (!userInfo) return;
        const resp = await fetch('/api/auth/me', { headers: { 'Accept': 'application/json' } });
        if (resp.ok) {
            const body = await resp.json();
            if (body && body.success && body.data) {
                window.currentUser = body.data;
                const roles = body.data.roles || [];
                window.isCustomerUser = roles.includes('CUSTOMER');

                const displayName = body.data.customerName || body.data.employeeName || body.data.username;
                const rolesStr = roles.join(', ');
                userInfo.innerText = rolesStr ? `${displayName} (${rolesStr})` : displayName;

                if (window.isCustomerUser) {
                    applyCustomerRoleUI();
                }
            }
        }
    } catch(e) {
        console.error('Failed to load user info', e);
    }
}

function applyCustomerRoleUI() {
    // Hide administrative and management modules from customer sidebar
    const restrictedRoutes = ['customers', 'banks', 'branches', 'employees', 'audit-logs', 'reports', 'calendar'];
    restrictedRoutes.forEach(route => {
        const navEl = document.querySelector(`.sidebar-nav .nav-item[data-route="${route}"]`);
        if (navEl) navEl.style.display = 'none';
    });

    // Hide Organization section title
    document.querySelectorAll('.sidebar-nav .nav-section-title').forEach(el => {
        const txt = el.innerText.trim().toUpperCase();
        if (txt.includes('ORGANIZATION')) {
            el.style.display = 'none';
        } else if (txt.includes('OVERVIEW')) {
            el.innerText = 'Customer Portal';
        } else if (txt.includes('CORE BANKING')) {
            el.innerText = 'My Banking Services';
        } else if (txt.includes('CREDIT')) {
            el.innerText = 'My Credit & Loans';
        } else if (txt.includes('GOVERNANCE')) {
            el.innerText = 'My Settings';
        }
    });

    // Rename nav labels for customer self-service
    const renameMap = {
        'dashboard': '⊞ My Portal',
        'accounts': '💳 My Accounts',
        'transactions': '↔ My Transactions',
        'beneficiaries': '✓ Transfer Beneficiaries',
        'cards': '🏷️ My Debit/Credit Cards',
        'loans': '📑 My Loans',
        'loan-payments': '📄 Loan Payments',
        'settings': '⚙ Account Settings'
    };

    Object.entries(renameMap).forEach(([route, newText]) => {
        const el = document.querySelector(`.sidebar-nav .nav-item[data-route="${route}"]`);
        if (el) el.innerHTML = `<span>${newText.split(' ')[0]}</span> ${newText.substring(newText.indexOf(' ') + 1)}`;
    });
}

const routes = {
    'dashboard': { title: 'Dashboard', loader: () => window.loadDashboard ? window.loadDashboard() : showPlaceholder('dashboard') },
    'banks': { title: 'Banks', loader: () => window.loadBanks ? window.loadBanks() : showPlaceholder('banks') },
    'branches': { title: 'Branches', loader: () => window.loadBranches ? window.loadBranches() : showPlaceholder('branches') },
    'employees': { title: 'Employees', loader: () => window.loadEmployees ? window.loadEmployees() : showPlaceholder('employees') },
    'customers': { title: 'Customers', loader: () => window.loadCustomers ? window.loadCustomers() : showPlaceholder('customers') },
    'accounts': { title: 'Accounts', loader: () => window.loadAccounts ? window.loadAccounts() : showPlaceholder('accounts') },
    'transactions': { title: 'Transactions', loader: () => window.loadTransactions ? window.loadTransactions() : showPlaceholder('transactions') },
    'beneficiaries': { title: 'Beneficiaries', loader: () => window.loadBeneficiaries ? window.loadBeneficiaries() : showPlaceholder('beneficiaries') },
    'loans': { title: 'Loans', loader: () => window.loadLoans ? window.loadLoans() : showPlaceholder('loans') },
    'loan-payments': { title: 'Loan Payments', loader: () => window.loadLoanPayments ? window.loadLoanPayments() : showPlaceholder('loan-payments') },
    'cards': { title: 'Cards', loader: () => window.loadCards ? window.loadCards() : showPlaceholder('cards') },
    'calendar': { title: 'Banking Calendar', loader: () => window.loadCalendar ? window.loadCalendar() : showPlaceholder('calendar') },
    'audit-logs': { title: 'Audit Logs', loader: () => window.loadAuditLogs ? window.loadAuditLogs() : showPlaceholder('audit-logs') },
    'reports': { title: 'Reports', loader: () => window.loadReports ? window.loadReports() : showPlaceholder('reports') },
    'settings': { title: 'Settings', loader: () => window.loadSettings ? window.loadSettings() : showPlaceholder('settings') }
};

function handleRoute() {
    let route = window.location.hash.substring(1);
    if (!route || !routes[route]) route = 'dashboard';

    // Route guard for customer role
    if (window.isCustomerUser) {
        const staffOnlyRoutes = ['customers', 'banks', 'branches', 'employees', 'audit-logs', 'reports', 'calendar'];
        if (staffOnlyRoutes.includes(route)) {
            if (typeof showToast === 'function') {
                showToast('Access restricted: Bank staff module only', 'warning');
            }
            window.location.hash = '#dashboard';
            return;
        }
    }
    
    // Update active nav
    document.querySelectorAll('.nav-item').forEach(el => {
        el.classList.remove('active');
        if (el.dataset.route === route) el.classList.add('active');
    });
    
    // Update title
    const titleEl = document.getElementById('page-title');
    if (titleEl) {
        if (window.isCustomerUser && route === 'dashboard') {
            titleEl.innerText = 'Customer Self-Service Portal';
        } else if (window.isCustomerUser && route === 'accounts') {
            titleEl.innerText = 'My Bank Accounts';
        } else if (window.isCustomerUser && route === 'transactions') {
            titleEl.innerText = 'My Financial Transactions';
        } else if (window.isCustomerUser && route === 'loans') {
            titleEl.innerText = 'My Loans';
        } else if (window.isCustomerUser && route === 'cards') {
            titleEl.innerText = 'My Debit & Credit Cards';
        } else {
            titleEl.innerText = routes[route].title;
        }
    }
    
    // Close sidebar on mobile
    const sidebar = document.getElementById('sidebar');
    if (sidebar) sidebar.classList.remove('open');
    
    // Load content
    const container = document.getElementById('main-content');
    if (container) {
        container.innerHTML = '';
        routes[route].loader();
    }
}

function showPlaceholder(module) {
    const container = document.getElementById('main-content');
    if (container) {
        container.innerHTML = `
            <div class="card">
                <h3>${module.charAt(0).toUpperCase() + module.slice(1)} Module</h3>
                <p>Content for this module is being loaded.</p>
            </div>
        `;
    }
}
