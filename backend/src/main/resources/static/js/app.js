// js/app.js

document.addEventListener('DOMContentLoaded', () => {
    // Check authentication basic logic (could be improved based on actual auth mechanism)
    // If not logged in, spring security typically redirects to /login on its own, but for SPAs we handle it too.
    
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

    // Try to load user info
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
                const roles = (body.data.roles || []).join(', ');
                userInfo.innerText = roles ? `${body.data.username} (${roles})` : body.data.username;
            }
        }
    } catch(e) {
        console.error('Failed to load user info', e);
    }
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
    'audit-logs': { title: 'Audit Logs', loader: () => window.loadAuditLogs ? window.loadAuditLogs() : showPlaceholder('audit-logs') },
    'reports': { title: 'Reports', loader: () => window.loadReports ? window.loadReports() : showPlaceholder('reports') },
    'settings': { title: 'Settings', loader: () => window.loadSettings ? window.loadSettings() : showPlaceholder('settings') }
};

function handleRoute() {
    let route = window.location.hash.substring(1);
    if (!route || !routes[route]) route = 'dashboard';
    
    // Update active nav
    document.querySelectorAll('.nav-item').forEach(el => {
        el.classList.remove('active');
        if (el.dataset.route === route) el.classList.add('active');
    });
    
    // Update title
    const titleEl = document.getElementById('page-title');
    if (titleEl) titleEl.innerText = routes[route].title;
    
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
