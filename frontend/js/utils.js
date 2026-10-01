// js/utils.js
const formatCurrency = (amount) => {
    if (amount === undefined || amount === null) return '₹0.00';
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2
    }).format(amount);
};

const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-GB');
};

const formatDateTime = (dateStr) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-GB') + ' ' + d.toLocaleTimeString('en-GB', {hour: '2-digit', minute:'2-digit'});
};

const maskCardNumber = (num) => {
    if (!num || num.length < 4) return num;
    const last4 = num.slice(-4);
    return `XXXX-XXXX-XXXX-${last4}`;
};

const escapeHtml = (unsafe) => {
    if (!unsafe) return '';
    return String(unsafe)
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
};

const getStatusBadge = (status) => {
    if (!status) return '';
    const s = status.toUpperCase();
    let badgeClass = 'badge-default';
    if (['ACTIVE', 'COMPLETED', 'SUCCESS', 'VERIFIED', 'APPROVED', 'CLOSED'].includes(s)) badgeClass = 'badge-success';
    else if (['PENDING', 'FROZEN', 'PROCESSING', 'INACTIVE'].includes(s)) badgeClass = 'badge-warning';
    else if (['FAILED', 'REJECTED', 'BLOCKED', 'EXPIRED'].includes(s)) badgeClass = 'badge-danger';
    return `<span class="badge ${badgeClass}">${escapeHtml(s)}</span>`;
};

const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const validatePhone = (phone) => /^\d{10}$/.test(phone);
const validatePincode = (pin) => /^\d{6}$/.test(pin);
const validateIFSC = (ifsc) => /^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc);

const showLoading = (container) => {
    if(typeof container === 'string') container = document.getElementById(container);
    if(container) container.innerHTML = '<div class="loading-container"><div class="spinner"></div></div>';
};

const buildPagination = (current, total, callback) => {
    if (total <= 1) return '';
    let html = '<div class="pagination">';
    html += `<button class="page-btn" ${current === 0 ? 'disabled' : ''} onclick="${callback}(${current - 1})">Prev</button>`;
    for (let i = 0; i < total; i++) {
        if (i === 0 || i === total - 1 || (i >= current - 1 && i <= current + 1)) {
            html += `<button class="page-btn ${current === i ? 'active' : ''}" onclick="${callback}(${i})">${i + 1}</button>`;
        } else if (i === current - 2 || i === current + 2) {
            html += `<span>...</span>`;
        }
    }
    html += `<button class="page-btn" ${current === total - 1 ? 'disabled' : ''} onclick="${callback}(${current + 1})">Next</button>`;
    html += '</div>';
    return html;
};

const formatAccountNo = (num) => num ? escapeHtml(num) : '-';
const truncate = (str, len) => {
    if (!str) return '';
    return str.length > len ? str.substring(0, len) + '...' : str;
};
