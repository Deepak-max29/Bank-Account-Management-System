// js/components.js

const showToast = (message, type = 'info') => {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = escapeHtml(message);
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.animation = 'toastFadeOut 0.3s forwards';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
};

const showModal = (title, bodyHtml, footerHtml = '') => {
    document.getElementById('modal-title').innerText = title;
    document.getElementById('modal-body').innerHTML = bodyHtml;
    document.getElementById('modal-footer').innerHTML = footerHtml;
    document.getElementById('modal-container').style.display = 'flex';
};

const closeModal = () => {
    document.getElementById('modal-container').style.display = 'none';
};

const showConfirmDialog = (title, message, onConfirm) => {
    const body = `<p>${escapeHtml(message)}</p>`;
    const footer = `
        <button class="btn btn-outline" onclick="closeModal()">Cancel</button>
        <button class="btn btn-danger" id="confirm-dialog-btn">Confirm</button>
    `;
    showModal(title, body, footer);
    document.getElementById('confirm-dialog-btn').onclick = () => {
        onConfirm();
        closeModal();
    };
};

const createTable = (headers, rows, emptyMsg = 'No records found') => {
    if (!rows || rows.length === 0) {
        return `<div class="empty-state">
            <div class="empty-state-icon">📄</div>
            <p>${emptyMsg}</p>
        </div>`;
    }
    
    let html = '<div class="table-responsive"><table class="table">';
    html += '<thead><tr>';
    headers.forEach(h => html += `<th>${escapeHtml(h)}</th>`);
    html += '</tr></thead><tbody>';
    
    rows.forEach(row => {
        html += '<tr>';
        row.forEach(cell => html += `<td>${cell !== null && cell !== undefined ? cell : '-'}</td>`);
        html += '</tr>';
    });
    
    html += '</tbody></table></div>';
    return html;
};

const showErrorState = (container, message, onRetry = null) => {
    let el = typeof container === 'string' ? document.getElementById(container) : container;
    if (!el) return;
    let html = `<div class="empty-state">
        <div class="empty-state-icon text-danger">⚠️</div>
        <p class="text-danger">${escapeHtml(message)}</p>`;
    if (onRetry) {
        window._currentRetry = onRetry;
        html += `<button class="btn btn-outline mt-2" onclick="window._currentRetry()">Retry</button>`;
    }
    html += `</div>`;
    el.innerHTML = html;
};
