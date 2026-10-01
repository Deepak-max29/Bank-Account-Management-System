// js/cards.js

let allCards = [];
let cardAccountsList = [];
let cardMaskState = {}; // cardId -> boolean (true = unmasked, false/undefined = masked)

window.loadCards = async () => {
    const container = document.getElementById('main-content');
    container.innerHTML = `
        <div class="page-header">
            <h2>Cards Management</h2>
            <button class="btn btn-primary" id="issue-card-btn" onclick="openIssueCardModal()">+ Issue Card</button>
        </div>
        <div class="action-bar">
            <div class="search-wrapper">
                <span class="search-icon">🔍</span>
                <input type="text" id="card-search" placeholder="Search by card number, account, customer, type..." oninput="filterCards()">
            </div>
            <div style="min-width: 160px;">
                <select id="card-type-filter" onchange="filterCards()">
                    <option value="">All Card Types</option>
                    <option value="DEBIT">Debit Card</option>
                    <option value="CREDIT">Credit Card</option>
                </select>
            </div>
            <div style="min-width: 160px;">
                <select id="card-status-filter" onchange="filterCards()">
                    <option value="">All Statuses</option>
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                    <option value="BLOCKED">Blocked</option>
                    <option value="EXPIRED">Expired</option>
                </select>
            </div>
            <button class="btn btn-outline btn-sm" onclick="fetchCards()" title="Refresh">↻ Refresh</button>
        </div>
        <div class="card">
            <div id="cards-table-container"></div>
        </div>
    `;

    // Load accounts list for dropdown cache
    await loadCardAccounts();
    // Fetch and display cards
    await fetchCards();
};

const loadCardAccounts = async () => {
    try {
        const res = await apiGet('/accounts');
        cardAccountsList = Array.isArray(res) ? res : (res && res.data ? res.data : (res && res.content ? res.content : []));
    } catch (e) {
        console.warn('Could not load accounts list for cards:', e);
    }
};

const fetchCards = async () => {
    const tableContainer = document.getElementById('cards-table-container');
    if (!tableContainer) return;
    showLoading(tableContainer);

    try {
        const res = await apiGet('/cards');
        allCards = Array.isArray(res) ? res : (res && res.data ? res.data : []);
        renderCardsTable(allCards);
    } catch (error) {
        showErrorState(tableContainer, 'Failed to load cards from server.', () => fetchCards());
    }
};

window.filterCards = () => {
    const searchInput = document.getElementById('card-search');
    const typeFilter = document.getElementById('card-type-filter');
    const statusFilter = document.getElementById('card-status-filter');

    const query = searchInput ? searchInput.value.trim().toLowerCase() : '';
    const selectedType = typeFilter ? typeFilter.value : '';
    const selectedStatus = statusFilter ? statusFilter.value : '';

    const filtered = allCards.filter(c => {
        const cardIdStr = String(c.cardId || '');
        const cardNumStr = String(c.cardNumber || '').toLowerCase();
        const maskedNumStr = maskCardNumber(c.cardNumber || '').toLowerCase();
        const accNoStr = String(c.accountNo || '');
        const custNameStr = (c.customerName || '').toLowerCase();
        const typeStr = (c.cardType || '').toUpperCase();
        const statusStr = (c.cardStatus || c.status || '').toUpperCase();

        const matchesQuery = !query ||
            cardIdStr.includes(query) ||
            cardNumStr.includes(query) ||
            maskedNumStr.includes(query) ||
            accNoStr.includes(query) ||
            custNameStr.includes(query) ||
            typeStr.includes(query);

        const matchesType = !selectedType || typeStr === selectedType;
        const matchesStatus = !selectedStatus || statusStr === selectedStatus;

        return matchesQuery && matchesType && matchesStatus;
    });

    renderCardsTable(filtered);
};

window.toggleCardMask = (cardId, rawCardNumber) => {
    cardMaskState[cardId] = !cardMaskState[cardId];
    const displayEl = document.getElementById(`card-num-${cardId}`);
    const btnEl = document.getElementById(`card-mask-btn-${cardId}`);
    if (displayEl && btnEl) {
        if (cardMaskState[cardId]) {
            displayEl.innerText = rawCardNumber;
            btnEl.innerText = '🔒';
            btnEl.title = 'Mask card number';
        } else {
            displayEl.innerText = maskCardNumber(rawCardNumber);
            btnEl.innerText = '👁';
            btnEl.title = 'Reveal card number';
        }
    }
};

const renderCardsTable = (cards) => {
    const tableContainer = document.getElementById('cards-table-container');
    if (!tableContainer) return;

    if (!cards || cards.length === 0) {
        tableContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">💳</div>
                <p>No cards found.</p>
            </div>
        `;
        return;
    }

    const headers = ['Card ID', 'Card Number', 'Linked Account', 'Customer', 'Card Type', 'Issue Date', 'Expiry Date', 'Status', 'Actions'];
    const rows = cards.map(c => {
        const cId = c.cardId;
        const isUnmasked = !!cardMaskState[cId];
        const cardDisplayNum = isUnmasked ? escapeHtml(c.cardNumber) : maskCardNumber(c.cardNumber);
        const cardNumHtml = `
            <span style="font-family: monospace; font-weight: 600;" id="card-num-${cId}">${cardDisplayNum}</span>
            <button class="btn btn-sm btn-outline" style="padding: 2px 6px; margin-left: 6px;" id="card-mask-btn-${cId}" 
                onclick="toggleCardMask(${cId}, '${escapeHtml(c.cardNumber)}')" title="${isUnmasked ? 'Mask card number' : 'Reveal card number'}">
                ${isUnmasked ? '🔒' : '👁'}
            </button>
        `;

        const accHtml = `<strong>#${c.accountNo}</strong>`;
        const custName = escapeHtml(c.customerName || '-');

        const cardTypeBadge = c.cardType === 'DEBIT' 
            ? '<span class="badge badge-info">DEBIT</span>' 
            : '<span class="badge badge-warning">CREDIT</span>';

        const issueDate = formatDate(c.issueDate);
        const expiryDate = formatDate(c.expiryDate);
        const statusBadge = getStatusBadge(c.cardStatus || c.status);

        // Action buttons based on card status
        const status = (c.cardStatus || c.status || '').toUpperCase();
        let actionButtons = `
            <button class="btn btn-sm btn-outline" onclick="viewCardDetails(${cId})" title="View Card Details">Details</button>
        `;

        if (status === 'INACTIVE') {
            actionButtons += `
                <button class="btn btn-sm btn-success" onclick="activateCardAction(${cId})" title="Activate Card">Activate</button>
                <button class="btn btn-sm btn-danger" onclick="blockCardAction(${cId})" title="Block Card">Block</button>
            `;
        } else if (status === 'ACTIVE') {
            actionButtons += `
                <button class="btn btn-sm btn-danger" onclick="blockCardAction(${cId})" title="Block Card">Block</button>
                <button class="btn btn-sm btn-outline" onclick="deactivateCardAction(${cId})" title="Deactivate Card">Deactivate</button>
            `;
        } else if (status === 'BLOCKED') {
            actionButtons += `
                <button class="btn btn-sm btn-success" onclick="activateCardAction(${cId})" title="Unblock & Activate Card">Unblock</button>
            `;
        } else if (status === 'EXPIRED') {
            actionButtons += `
                <span class="text-danger small" style="margin-left: 4px;">Expired</span>
            `;
        }

        return [cId, cardNumHtml, accHtml, custName, cardTypeBadge, issueDate, expiryDate, statusBadge, actionButtons];
    });

    tableContainer.innerHTML = createTable(headers, rows);
};

window.openIssueCardModal = async () => {
    if (!cardAccountsList || cardAccountsList.length === 0) {
        await loadCardAccounts();
    }

    // Only active accounts can receive a card
    const activeAccounts = cardAccountsList.filter(a => (a.status || a.accountStatus || '').toUpperCase() === 'ACTIVE');

    if (activeAccounts.length === 0) {
        showToast('No active bank accounts found. Please ensure an active account exists before issuing a card.', 'warning');
        return;
    }

    const accountOptions = activeAccounts.map(a => {
        const custName = a.customerName ? ` - ${escapeHtml(a.customerName)}` : '';
        const bal = a.balance != null ? ` (Bal: ${formatCurrency(a.balance)})` : '';
        const type = a.accountType ? ` [${escapeHtml(a.accountType)}]` : '';
        return `<option value="${a.accountNo}">Account #${a.accountNo}${custName}${type}${bal}</option>`;
    }).join('');

    const bodyHtml = `
        <form id="issue-card-form" class="form-grid" onsubmit="event.preventDefault(); saveCardIssue();">
            <div class="form-group full-width">
                <label for="card-account-no">Select Active Account <span class="text-danger">*</span></label>
                <select id="card-account-no" class="form-control" required onchange="onCardAccountSelected()">
                    <option value="">-- Select Active Account --</option>
                    ${accountOptions}
                </select>
            </div>

            <div class="form-group full-width">
                <label for="card-type-select">Card Type <span class="text-danger">*</span></label>
                <select id="card-type-select" class="form-control" required>
                    <option value="DEBIT">Debit Card (Visa BIN 411111)</option>
                    <option value="CREDIT">Credit Card (Mastercard BIN 512345)</option>
                </select>
                <small class="text-light">Each account may hold at most one active Debit and one Credit card.</small>
            </div>

            <div class="form-group full-width" id="card-account-preview" style="display:none; background:var(--bg); padding:0.75rem 1rem; border-radius:0.375rem; border:1px solid var(--border);">
                <div><strong>Customer:</strong> <span id="preview-card-customer">-</span></div>
                <div><strong>Account Type:</strong> <span id="preview-card-acctype">-</span></div>
                <div><strong>Available Balance:</strong> <span id="preview-card-balance" class="text-success font-weight-bold">-</span></div>
            </div>

            <div class="form-group full-width" style="background:var(--bg); padding:0.75rem 1rem; border-radius:0.375rem; border:1px solid var(--border);">
                <div style="font-size:0.875rem; color:var(--text-secondary, #666);">
                    ℹ️ <strong>Security Notice:</strong> Newly issued cards are created with 5-year validity in <code>INACTIVE</code> status. CVV is securely hashed with BCrypt. Card numbers are masked by default. Activate the card after customer delivery.
                </div>
            </div>

            <div id="issue-card-form-error" class="error-message full-width" style="display: none;"></div>
        </form>
    `;

    const footerHtml = `
        <button type="button" class="btn btn-outline" onclick="closeModal()">Cancel</button>
        <button type="button" class="btn btn-primary" id="save-card-btn" onclick="saveCardIssue()">Issue Card</button>
    `;

    showModal('Issue New Bank Card', bodyHtml, footerHtml);
};

window.onCardAccountSelected = () => {
    const sel = document.getElementById('card-account-no');
    const preview = document.getElementById('card-account-preview');
    const custSpan = document.getElementById('preview-card-customer');
    const typeSpan = document.getElementById('preview-card-acctype');
    const balSpan = document.getElementById('preview-card-balance');

    if (!sel || !preview) return;
    const accNo = sel.value;
    const acc = cardAccountsList.find(a => String(a.accountNo) === String(accNo));

    if (acc) {
        if (custSpan) custSpan.innerText = acc.customerName || (acc.customerId ? `Customer #${acc.customerId}` : '-');
        if (typeSpan) typeSpan.innerText = acc.accountType || '-';
        if (balSpan) balSpan.innerText = acc.balance != null ? formatCurrency(acc.balance) : '-';
        preview.style.display = 'block';
    } else {
        preview.style.display = 'none';
    }
};

window.saveCardIssue = async () => {
    const errorBox = document.getElementById('issue-card-form-error');
    if (errorBox) errorBox.style.display = 'none';

    const accountNoVal = document.getElementById('card-account-no').value;
    const cardTypeVal = document.getElementById('card-type-select').value;

    if (!accountNoVal) {
        showCardFormError('Please select a linked active account.');
        return;
    }
    if (!cardTypeVal) {
        showCardFormError('Please select a card type (DEBIT or CREDIT).');
        return;
    }

    const payload = {
        accountNo: parseInt(accountNoVal, 10),
        cardType: cardTypeVal.toUpperCase()
    };

    const saveBtn = document.getElementById('save-card-btn');
    if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.innerText = 'Issuing...';
    }

    try {
        await apiPost('/cards', payload);
        showToast('Card issued successfully in INACTIVE status', 'success');
        closeModal();
        await fetchCards();
        filterCards();
    } catch (err) {
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.innerText = 'Issue Card';
        }
        showCardFormError(err.message || 'Failed to issue card. Please verify account eligibility.');
    }
};

window.activateCardAction = (cardId) => {
    showConfirmDialog('Activate Card', `Are you sure you want to activate Card #${cardId}? The card will be ready for transactions.`, async () => {
        try {
            const resp = await fetch(`/api/cards/${cardId}/activate`, {
                method: 'PATCH',
                headers: getHeaders()
            });
            await handleResponse(resp);
            showToast(`Card #${cardId} activated successfully`, 'success');
            await fetchCards();
            filterCards();
        } catch (e) {
            if (e.message && e.message !== 'Unauthorized' && e.message !== 'Forbidden') {
                console.error('Activate card failed:', e.message);
            }
        }
    });
};

window.blockCardAction = (cardId) => {
    showConfirmDialog('Block Card', `Are you sure you want to block Card #${cardId}? All future card transactions will be immediately declined.`, async () => {
        try {
            const resp = await fetch(`/api/cards/${cardId}/block`, {
                method: 'PATCH',
                headers: getHeaders()
            });
            await handleResponse(resp);
            showToast(`Card #${cardId} has been BLOCKED`, 'warning');
            await fetchCards();
            filterCards();
        } catch (e) {
            if (e.message && e.message !== 'Unauthorized' && e.message !== 'Forbidden') {
                console.error('Block card failed:', e.message);
            }
        }
    });
};

window.deactivateCardAction = (cardId) => {
    showConfirmDialog('Deactivate Card', `Are you sure you want to deactivate Card #${cardId}? Status will change to INACTIVE.`, async () => {
        try {
            const resp = await fetch(`/api/cards/${cardId}/deactivate`, {
                method: 'PATCH',
                headers: getHeaders()
            });
            await handleResponse(resp);
            showToast(`Card #${cardId} deactivated`, 'info');
            await fetchCards();
            filterCards();
        } catch (e) {
            if (e.message && e.message !== 'Unauthorized' && e.message !== 'Forbidden') {
                console.error('Deactivate card failed:', e.message);
            }
        }
    });
};

window.checkExpiryAction = async (cardId) => {
    try {
        const resp = await fetch(`/api/cards/${cardId}/check-expiry`, {
            method: 'PATCH',
            headers: getHeaders()
        });
        await handleResponse(resp);
        showToast(`Expiry check completed for Card #${cardId}`, 'info');
        closeModal();
        await fetchCards();
        filterCards();
    } catch (e) {
        if (e.message && e.message !== 'Unauthorized' && e.message !== 'Forbidden') {
            console.error('Check expiry failed:', e.message);
        }
    }
};

window.viewCardDetails = async (cardId) => {
    showModal(`Card #${cardId} Details`, '<div class="spinner"></div>');

    try {
        const res = await apiGet(`/cards/${cardId}`);
        const card = Array.isArray(res) ? res[0] : (res && res.data ? res.data : res);

        if (!card) {
            showModal('Card Not Found', '<p class="text-danger">Unable to load card details.</p>', '<button class="btn btn-outline" onclick="closeModal()">Close</button>');
            return;
        }

        const isUnmasked = !!cardMaskState[cardId];
        const cardNumDisplay = isUnmasked ? escapeHtml(card.cardNumber) : maskCardNumber(card.cardNumber);
        const cardTypeBadge = card.cardType === 'DEBIT' 
            ? '<span class="badge badge-info">DEBIT</span>' 
            : '<span class="badge badge-warning">CREDIT</span>';

        const bodyHtml = `
            <div class="card" style="background:var(--bg); border:1px solid var(--border); padding: 1rem;">
                <h4 style="margin-bottom: 1rem;">Card Information</h4>
                <div class="form-grid">
                    <div><strong>Card ID:</strong> #${card.cardId}</div>
                    <div><strong>Card Type:</strong> ${cardTypeBadge}</div>
                    <div>
                        <strong>Card Number:</strong><br>
                        <span style="font-family:monospace; font-size:1.1rem; font-weight:600;" id="detail-card-num-${cardId}">${cardNumDisplay}</span>
                        <button class="btn btn-sm btn-outline" style="padding:2px 6px; margin-left:6px;" id="detail-card-mask-btn-${cardId}"
                            onclick="toggleCardMask(${cardId}, '${escapeHtml(card.cardNumber)}'); document.getElementById('detail-card-num-${cardId}').innerText = cardMaskState[${cardId}] ? '${escapeHtml(card.cardNumber)}' : maskCardNumber('${escapeHtml(card.cardNumber)}');">
                            ${isUnmasked ? '🔒 Mask' : '👁 Reveal'}
                        </button>
                    </div>
                    <div><strong>Linked Account:</strong> Account #${card.accountNo}</div>
                    <div><strong>Customer Name:</strong> ${escapeHtml(card.customerName || '-')}</div>
                    <div><strong>Status:</strong> ${getStatusBadge(card.cardStatus || card.status)}</div>
                    <div><strong>Issue Date:</strong> ${formatDate(card.issueDate)}</div>
                    <div><strong>Expiry Date:</strong> ${formatDate(card.expiryDate)}</div>
                    <div><strong>Security (CVV):</strong> <span class="badge badge-default">Protected (BCrypt Hash)</span></div>
                </div>
            </div>

            <div class="mt-2" style="font-size:0.875rem; color:var(--text-secondary, #666);">
                🔒 Card data is stored locally in Oracle Database XE. Sensitive CVV credentials are cryptographically hashed and never returned in cleartext.
            </div>
        `;

        const status = (card.cardStatus || card.status || '').toUpperCase();
        let footerHtml = '';

        if (status === 'INACTIVE') {
            footerHtml += `<button class="btn btn-success" onclick="closeModal(); activateCardAction(${cardId});">Activate Card</button>`;
            footerHtml += `<button class="btn btn-danger" onclick="closeModal(); blockCardAction(${cardId});">Block Card</button>`;
        } else if (status === 'ACTIVE') {
            footerHtml += `<button class="btn btn-danger" onclick="closeModal(); blockCardAction(${cardId});">Block Card</button>`;
            footerHtml += `<button class="btn btn-outline" onclick="closeModal(); deactivateCardAction(${cardId});">Deactivate</button>`;
        } else if (status === 'BLOCKED') {
            footerHtml += `<button class="btn btn-success" onclick="closeModal(); activateCardAction(${cardId});">Unblock Card</button>`;
        }

        footerHtml += `<button class="btn btn-outline" onclick="checkExpiryAction(${cardId})">Verify Expiry</button>`;
        footerHtml += `<button class="btn btn-outline" onclick="closeModal()">Close</button>`;

        showModal(`Card #${cardId} Details`, bodyHtml, footerHtml);
    } catch (e) {
        showModal('Error', `<p class="text-danger">${escapeHtml(e.message || 'Failed to load card details.')}</p>`, '<button class="btn btn-outline" onclick="closeModal()">Close</button>');
    }
};

const showCardFormError = (msg) => {
    const errorBox = document.getElementById('issue-card-form-error');
    if (errorBox) {
        errorBox.innerText = msg;
        errorBox.style.display = 'block';
    } else {
        showToast(msg, 'error');
    }
};
