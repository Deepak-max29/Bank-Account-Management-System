// js/calendar.js — Banking Calendar Module
// Displays banking events: loan payments, transactions, account openings, card expiries
// Fully offline — reads from existing backend endpoints only
(function () {
    'use strict';

    // ── State ────────────────────────────────────────────────────────────────
    let _calYear = new Date().getFullYear();
    let _calMonth = new Date().getMonth(); // 0-based
    let _selectedDate = null;
    let _eventMap = {};   // key: 'YYYY-MM-DD' → [{type, title, detail, color}]
    let _eventsLoaded = false;

    // ── Colour palette for event categories ─────────────────────────────────
    const CAT_COLORS = {
        loan_due:    { dot: '#F59E0B', label: 'Loan Due',        badge: 'badge-warning' },
        loan_pay:    { dot: '#10B981', label: 'Loan Payment',     badge: 'badge-success' },
        transaction: { dot: '#3B82F6', label: 'Transaction',      badge: 'badge-info'    },
        account_open:{ dot: '#8B5CF6', label: 'Account Opened',   badge: 'badge-purple'  },
        card_expiry: { dot: '#EF4444', label: 'Card Expiry',      badge: 'badge-danger'  },
    };

    // ── Entry point ──────────────────────────────────────────────────────────
    window.loadCalendar = async function () {
        const main = document.getElementById('main-content');
        if (!main) return;

        main.innerHTML = `
            <div class="cal-wrapper">
                <div class="cal-header-bar">
                    <div>
                        <h2 class="cal-heading">📅 Banking Calendar</h2>
                        <p class="cal-subheading text-muted">Loan due dates, payments, transactions &amp; banking events</p>
                    </div>
                    <div class="cal-header-actions">
                        <button class="btn btn-outline btn-sm" id="cal-today-btn" onclick="calGoToday()">Today</button>
                        <button class="btn btn-outline btn-sm" id="cal-refresh-btn" onclick="calRefreshEvents()">🔄 Refresh</button>
                    </div>
                </div>

                <!-- Legend -->
                <div class="cal-legend">
                    ${Object.entries(CAT_COLORS).map(([k,v]) =>
                        `<span class="cal-legend-item"><span class="cal-dot" style="background:${v.dot}"></span>${escapeHtml(v.label)}</span>`
                    ).join('')}
                </div>

                <div class="cal-body">
                    <!-- Calendar panel -->
                    <div class="cal-panel">
                        <div class="cal-nav">
                            <button class="btn btn-outline btn-sm" id="cal-prev-btn" onclick="calPrevMonth()" aria-label="Previous month">‹ Prev</button>
                            <h3 id="cal-month-title" class="cal-month-title"></h3>
                            <button class="btn btn-outline btn-sm" id="cal-next-btn" onclick="calNextMonth()" aria-label="Next month">Next ›</button>
                        </div>
                        <div id="cal-grid" class="cal-grid"></div>
                    </div>

                    <!-- Events panel -->
                    <div class="cal-events-panel" id="cal-events-panel">
                        <div class="cal-events-header">
                            <h4 id="cal-events-title">Select a date to view events</h4>
                        </div>
                        <div id="cal-events-list" class="cal-events-list">
                            <div class="empty-state" style="padding:2rem;">
                                <div class="empty-state-icon">📅</div>
                                <p>Click a date on the calendar to see banking events for that day.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Load events then render
        await calLoadEvents();
        calRenderGrid();
    };

    // ── Load all events from backend ─────────────────────────────────────────
    async function calLoadEvents() {
        _eventMap = {};
        _eventsLoaded = false;

        try {
            const today = new Date();
            const yearStart = new Date(today.getFullYear() - 1, 0, 1);
            const yearEnd   = new Date(today.getFullYear() + 1, 11, 31);

            // Fetch loans, transactions, accounts, cards in parallel
            const [loansRes, txnsRes, accountsRes, cardsRes, loanPayRes] = await Promise.allSettled([
                apiGet('/loans'),
                apiGet('/transactions/recent?limit=200'),
                apiGet('/accounts'),
                apiGet('/cards'),
                apiGet('/loan-payments?page=1&size=200')
            ]);

            // 1. Loan sanction dates & loan payment due dates
            if (loansRes.status === 'fulfilled' && loansRes.value) {
                const loans = Array.isArray(loansRes.value) ? loansRes.value : (loansRes.value.data || []);
                loans.forEach(loan => {
                    // Sanction date
                    if (loan.sanctionDate) {
                        const d = _toDateKey(loan.sanctionDate);
                        if (d) _addEvent(d, {
                            type: 'loan_due',
                            title: `Loan #${loan.loanId} Sanctioned`,
                            detail: `${escapeHtml(loan.loanType || 'Loan')} — ₹${_fmtAmt(loan.principalAmount)} — ${loan.loanStatus || ''}`,
                            color: CAT_COLORS.loan_due
                        });
                    }
                });
            }

            // 2. Recent transactions
            if (txnsRes.status === 'fulfilled' && txnsRes.value) {
                const txns = Array.isArray(txnsRes.value) ? txnsRes.value : (txnsRes.value.data || []);
                txns.forEach(t => {
                    const d = _toDateKey(t.txnDate);
                    if (!d) return;
                    _addEvent(d, {
                        type: 'transaction',
                        title: `${escapeHtml(t.txnType || 'Txn')} — Acc #${t.accountNo}`,
                        detail: `Amount: ${formatCurrency(t.amount)} | Channel: ${t.channel || '-'} | ${t.remarks || ''}`,
                        color: CAT_COLORS.transaction
                    });
                });
            }

            // 3. Account opening dates
            if (accountsRes.status === 'fulfilled' && accountsRes.value) {
                const accounts = Array.isArray(accountsRes.value) ? accountsRes.value : (accountsRes.value.data || []);
                accounts.forEach(a => {
                    const d = _toDateKey(a.openedDate);
                    if (!d) return;
                    _addEvent(d, {
                        type: 'account_open',
                        title: `Account #${a.accountNo} Opened`,
                        detail: `${escapeHtml(a.accountType || '')} — ${escapeHtml(a.customerName || '')} — ${escapeHtml(a.status || '')}`,
                        color: CAT_COLORS.account_open
                    });
                });
            }

            // 4. Card expiry dates
            if (cardsRes.status === 'fulfilled' && cardsRes.value) {
                const cards = Array.isArray(cardsRes.value) ? cardsRes.value : (cardsRes.value.data || []);
                cards.forEach(c => {
                    const d = _toDateKey(c.expiryDate);
                    if (!d) return;
                    _addEvent(d, {
                        type: 'card_expiry',
                        title: `Card Expiry — ${escapeHtml(c.cardType || 'Card')}`,
                        detail: `Card #${c.cardId} — Account #${c.accountNo} — Status: ${c.cardStatus || ''}`,
                        color: CAT_COLORS.card_expiry
                    });
                });
            }

            // 5. Loan payments made
            if (loanPayRes.status === 'fulfilled' && loanPayRes.value) {
                const raw = loanPayRes.value.data || loanPayRes.value;
                const pays = Array.isArray(raw) ? raw : (raw.content || []);
                pays.forEach(p => {
                    const d = _toDateKey(p.paymentDate);
                    if (!d) return;
                    _addEvent(d, {
                        type: 'loan_pay',
                        title: `Loan Payment — Loan #${p.loanId}`,
                        detail: `Paid: ${formatCurrency(p.amountPaid)} | Remaining: ${formatCurrency(p.remainingBalance)} | ${p.paymentMode || ''}`,
                        color: CAT_COLORS.loan_pay
                    });
                });
            }

            _eventsLoaded = true;
        } catch (e) {
            console.warn('[Calendar] Error loading events:', e);
            _eventsLoaded = true; // Still render even if some fail
        }
    }

    // ── Helper: add event to map ─────────────────────────────────────────────
    function _addEvent(dateKey, event) {
        if (!_eventMap[dateKey]) _eventMap[dateKey] = [];
        _eventMap[dateKey].push(event);
    }

    // ── Helper: convert any date-like value to 'YYYY-MM-DD' ─────────────────
    function _toDateKey(val) {
        if (!val) return null;
        let d;
        if (typeof val === 'number') {
            d = new Date(val);
        } else if (typeof val === 'string') {
            // ISO, date-only, or array-like strings
            d = new Date(val);
        } else if (Array.isArray(val)) {
            // Java LocalDate [YYYY, M, D] or LocalDateTime [YYYY, M, D, H, ...]
            d = new Date(val[0], val[1] - 1, val[2]);
        } else {
            d = new Date(val);
        }
        if (!d || isNaN(d.getTime())) return null;
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    }

    // ── Helper: format amount ────────────────────────────────────────────────
    function _fmtAmt(v) {
        if (!v) return '0.00';
        return Number(v).toLocaleString('en-IN', { minimumFractionDigits: 2 });
    }

    // ── Render calendar grid ─────────────────────────────────────────────────
    function calRenderGrid() {
        const titleEl = document.getElementById('cal-month-title');
        const gridEl  = document.getElementById('cal-grid');
        if (!titleEl || !gridEl) return;

        const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
        titleEl.textContent = `${MONTHS[_calMonth]} ${_calYear}`;

        const today = new Date();
        const todayKey = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;

        // Day headers
        const DAY_NAMES = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
        let html = '<div class="cal-day-headers">';
        DAY_NAMES.forEach(d => { html += `<div class="cal-day-header">${d}</div>`; });
        html += '</div><div class="cal-days">';

        // First day of month (0=Sun)
        const firstDay = new Date(_calYear, _calMonth, 1).getDay();
        // Total days in month
        const daysInMonth = new Date(_calYear, _calMonth + 1, 0).getDate();

        // Empty cells before first day
        for (let i = 0; i < firstDay; i++) {
            html += '<div class="cal-cell cal-cell-empty"></div>';
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const mm = String(_calMonth + 1).padStart(2, '0');
            const dd = String(day).padStart(2, '0');
            const key = `${_calYear}-${mm}-${dd}`;
            const events = _eventMap[key] || [];
            const isToday  = key === todayKey;
            const isSelected = key === _selectedDate;

            // Deduplicate dot colors
            const dotColors = [...new Set(events.map(e => e.color.dot))].slice(0, 4);

            html += `
                <div class="cal-cell ${isToday ? 'cal-today' : ''} ${isSelected ? 'cal-selected' : ''} ${events.length > 0 ? 'cal-has-events' : ''}"
                     role="button" tabindex="0"
                     onclick="calSelectDate('${key}')"
                     onkeydown="if(event.key==='Enter'||event.key===' '){calSelectDate('${key}');}"
                     aria-label="${day} ${MONTHS[_calMonth]} ${_calYear}${events.length > 0 ? ', '+events.length+' event(s)' : ''}"
                     title="${day} ${MONTHS[_calMonth]}${events.length > 0 ? ' — '+events.length+' event(s)' : ''}">
                    <span class="cal-day-num">${day}</span>
                    ${dotColors.length > 0 ? `<div class="cal-dots">${dotColors.map(c => `<span class="cal-dot" style="background:${c}"></span>`).join('')}</div>` : ''}
                    ${events.length > 2 ? `<span class="cal-event-count">+${events.length}</span>` : ''}
                </div>
            `;
        }

        html += '</div>';
        gridEl.innerHTML = html;
    }

    // ── Select a date and show events ────────────────────────────────────────
    window.calSelectDate = function (dateKey) {
        _selectedDate = dateKey;
        // Re-render grid to update selection highlight
        calRenderGrid();

        const titleEl = document.getElementById('cal-events-title');
        const listEl  = document.getElementById('cal-events-list');
        if (!titleEl || !listEl) return;

        const events = _eventMap[dateKey] || [];
        const d = new Date(dateKey + 'T00:00:00');
        const label = d.toLocaleDateString('en-GB', { weekday:'long', year:'numeric', month:'long', day:'numeric' });
        titleEl.textContent = `Events — ${label}`;

        if (events.length === 0) {
            listEl.innerHTML = `
                <div class="empty-state" style="padding:1.5rem;">
                    <div class="empty-state-icon">🗓️</div>
                    <p>No banking events on this date.</p>
                </div>
            `;
            return;
        }

        listEl.innerHTML = events.map(ev => `
            <div class="cal-event-item">
                <div class="cal-event-type-dot" style="background:${ev.color.dot}"></div>
                <div class="cal-event-content">
                    <div class="cal-event-title">
                        <span class="badge ${ev.color.badge}">${escapeHtml(ev.color.label)}</span>
                        ${escapeHtml(ev.title)}
                    </div>
                    <div class="cal-event-detail text-muted text-sm">${escapeHtml(ev.detail)}</div>
                </div>
            </div>
        `).join('');
    };

    // ── Navigation ───────────────────────────────────────────────────────────
    window.calPrevMonth = function () {
        _calMonth--;
        if (_calMonth < 0) { _calMonth = 11; _calYear--; }
        calRenderGrid();
    };

    window.calNextMonth = function () {
        _calMonth++;
        if (_calMonth > 11) { _calMonth = 0; _calYear++; }
        calRenderGrid();
    };

    window.calGoToday = function () {
        const now = new Date();
        _calYear  = now.getFullYear();
        _calMonth = now.getMonth();
        calRenderGrid();
        // Select today
        const key = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
        calSelectDate(key);
    };

    window.calRefreshEvents = async function () {
        const btn = document.getElementById('cal-refresh-btn');
        if (btn) { btn.disabled = true; btn.textContent = 'Loading…'; }
        await calLoadEvents();
        calRenderGrid();
        if (_selectedDate) calSelectDate(_selectedDate);
        if (btn) { btn.disabled = false; btn.textContent = '🔄 Refresh'; }
        showToast('Calendar events refreshed', 'success');
    };

})();
