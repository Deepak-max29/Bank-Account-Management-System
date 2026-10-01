// js/settings.js — Settings & User Profile Module
(function () {
    'use strict';

    window.loadSettings = async function () {
        const container = document.getElementById('main-content');
        if (!container) return;

        container.innerHTML = `
            <div class="page-header" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:1.5rem;">
                <div>
                    <h2>⚙️ Settings & User Profile</h2>
                    <p class="text-muted" style="margin:4px 0 0 0;font-size:0.9rem;">Manage your account credentials, security settings, and session.</p>
                </div>
                <div>
                    <button class="btn btn-outline btn-sm" onclick="window.loadSettings()">🔄 Refresh</button>
                </div>
            </div>

            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(340px,1fr));gap:1.5rem;">
                <!-- Profile Information Card -->
                <div class="card" id="profile-card" style="margin-bottom:0;">
                    <div class="card-header" style="display:flex;align-items:center;gap:10px;margin-bottom:1.25rem;">
                        <span style="font-size:1.5rem;">👤</span>
                        <h3 style="margin:0;">User Profile</h3>
                    </div>
                    <div id="profile-content">
                        <div class="loading-container"><div class="spinner"></div></div>
                    </div>
                </div>

                <!-- Password Change Card -->
                <div class="card" style="margin-bottom:0;">
                    <div class="card-header" style="display:flex;align-items:center;gap:10px;margin-bottom:1.25rem;">
                        <span style="font-size:1.5rem;">🔒</span>
                        <h3 style="margin:0;">Change Password</h3>
                    </div>
                    <form id="change-password-form" onsubmit="window._handleChangePassword(event)">
                        <div class="form-group" style="margin-bottom:1rem;">
                            <label for="current-pwd" style="display:block;font-weight:600;margin-bottom:0.25rem;">Current Password *</label>
                            <div style="position:relative;display:flex;align-items:center;">
                                <input type="password" id="current-pwd" class="form-control" placeholder="Enter current password" required autocomplete="current-password" style="width:100%;padding-right:40px;">
                                <button type="button" class="btn btn-outline btn-sm" style="position:absolute;right:4px;border:none;background:transparent;padding:4px 8px;" onclick="window._togglePasswordVisibility('current-pwd', this)" title="Show/Hide Password">👁</button>
                            </div>
                        </div>

                        <div class="form-group" style="margin-bottom:1rem;">
                            <label for="new-pwd" style="display:block;font-weight:600;margin-bottom:0.25rem;">New Password *</label>
                            <div style="position:relative;display:flex;align-items:center;">
                                <input type="password" id="new-pwd" class="form-control" placeholder="Min. 6 characters" required autocomplete="new-password" style="width:100%;padding-right:40px;">
                                <button type="button" class="btn btn-outline btn-sm" style="position:absolute;right:4px;border:none;background:transparent;padding:4px 8px;" onclick="window._togglePasswordVisibility('new-pwd', this)" title="Show/Hide Password">👁</button>
                            </div>
                            <small class="text-muted" style="font-size:0.75rem;">Must be at least 6 characters in length.</small>
                        </div>

                        <div class="form-group" style="margin-bottom:1.25rem;">
                            <label for="confirm-pwd" style="display:block;font-weight:600;margin-bottom:0.25rem;">Confirm New Password *</label>
                            <div style="position:relative;display:flex;align-items:center;">
                                <input type="password" id="confirm-pwd" class="form-control" placeholder="Re-enter new password" required autocomplete="new-password" style="width:100%;padding-right:40px;">
                                <button type="button" class="btn btn-outline btn-sm" style="position:absolute;right:4px;border:none;background:transparent;padding:4px 8px;" onclick="window._togglePasswordVisibility('confirm-pwd', this)" title="Show/Hide Password">👁</button>
                            </div>
                        </div>

                        <div id="pwd-msg" style="display:none;margin-bottom:1rem;padding:8px 12px;border-radius:4px;font-size:0.875rem;"></div>

                        <div style="display:flex;justify-content:flex-end;gap:8px;">
                            <button type="reset" class="btn btn-outline btn-sm" onclick="window._resetPasswordForm()">Clear</button>
                            <button type="submit" class="btn btn-primary" id="change-pwd-btn">Update Password</button>
                        </div>
                    </form>
                </div>

                <!-- Session & Security Card -->
                <div class="card" style="margin-bottom:0;">
                    <div class="card-header" style="display:flex;align-items:center;gap:10px;margin-bottom:1.25rem;">
                        <span style="font-size:1.5rem;">🛡️</span>
                        <h3 style="margin:0;">Session & Security</h3>
                    </div>
                    <div style="font-size:0.9rem;line-height:1.6;">
                        <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border,#eee);">
                            <span class="text-muted">Authentication:</span>
                            <span class="badge badge-success">Active Session</span>
                        </div>
                        <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border,#eee);">
                            <span class="text-muted">CSRF Protection:</span>
                            <span class="badge badge-success">Enabled (Spring Security 6)</span>
                        </div>
                        <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border,#eee);">
                            <span class="text-muted">Password Encryption:</span>
                            <span class="badge badge-success">BCrypt (Strength 12)</span>
                        </div>
                        <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border,#eee);">
                            <span class="text-muted">Session Concurrency:</span>
                            <span>Single Active Session</span>
                        </div>
                    </div>
                    <div style="margin-top:1.5rem;">
                        <button class="btn btn-danger btn-full" onclick="window._handleSessionLogout()">
                            🚪 Sign Out Current Session
                        </button>
                    </div>
                </div>

                <!-- System Architecture & Environment Card -->
                <div class="card" style="margin-bottom:0;">
                    <div class="card-header" style="display:flex;align-items:center;gap:10px;margin-bottom:1.25rem;">
                        <span style="font-size:1.5rem;">🏛️</span>
                        <h3 style="margin:0;">Environment & Architecture</h3>
                    </div>
                    <div style="font-size:0.9rem;line-height:1.6;">
                        <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border,#eee);">
                            <span class="text-muted">Database:</span>
                            <strong>Oracle XE (10.2.0.1.0)</strong>
                        </div>
                        <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border,#eee);">
                            <span class="text-muted">Backend Engine:</span>
                            <strong>Spring Boot 3.2.5 (Java 17)</strong>
                        </div>
                        <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border,#eee);">
                            <span class="text-muted">Persistence Layer:</span>
                            <strong>Spring JDBC (HikariCP)</strong>
                        </div>
                        <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border,#eee);">
                            <span class="text-muted">Offline Mode:</span>
                            <span class="badge badge-success">100% Offline (No CDNs)</span>
                        </div>
                        <div style="display:flex;justify-content:space-between;padding:8px 0;">
                            <span class="text-muted">Service Port:</span>
                            <code>localhost:8081</code>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Load profile data
        await _fetchUserProfile();
    };

    async function _fetchUserProfile() {
        const contentEl = document.getElementById('profile-content');
        if (!contentEl) return;
        showLoading(contentEl);

        try {
            const resp = await apiGet('/auth/me');
            if (resp && resp.success && resp.data) {
                const data = resp.data;
                const roles = (data.roles || []).map(r => `<span class="badge badge-success" style="margin-right:4px;">${escapeHtml(r)}</span>`).join('') || '<span class="badge badge-default">USER</span>';
                const statusBadge = (data.isActive !== false) ? '<span class="badge badge-success">ACTIVE</span>' : '<span class="badge badge-danger">INACTIVE</span>';
                const createdStr = data.createdAt ? formatDateTime(data.createdAt) : 'System Default';
                const lastLoginStr = data.lastLogin ? formatDateTime(data.lastLogin) : 'Current Session';

                let employeeHtml = '';
                if (data.empId) {
                    employeeHtml = `
                        <div style="margin-top:1rem;padding-top:0.75rem;border-top:1px dashed var(--border,#eee);">
                            <h4 style="margin:0 0 0.5rem 0;font-size:0.95rem;color:var(--text-light,#555);">Linked Staff Profile</h4>
                            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:0.875rem;">
                                <div><span class="text-muted">Emp ID:</span> <strong>#${escapeHtml(String(data.empId))}</strong></div>
                                <div><span class="text-muted">Name:</span> <strong>${escapeHtml(data.employeeName || '-')}</strong></div>
                                <div><span class="text-muted">Designation:</span> <strong>${escapeHtml(data.designation || '-')}</strong></div>
                                <div><span class="text-muted">Email:</span> <strong>${escapeHtml(data.email || '-')}</strong></div>
                                ${data.phone ? `<div><span class="text-muted">Phone:</span> <strong>${escapeHtml(data.phone)}</strong></div>` : ''}
                            </div>
                        </div>
                    `;
                }

                contentEl.innerHTML = `
                    <div style="display:flex;align-items:center;gap:1rem;margin-bottom:1.25rem;">
                        <div style="width:54px;height:54px;border-radius:50%;background:var(--accent,#2563eb);color:white;display:flex;align-items:center;justify-content:center;font-size:1.5rem;font-weight:700;">
                            ${escapeHtml((data.username || 'U').substring(0, 1).toUpperCase())}
                        </div>
                        <div>
                            <h4 style="margin:0;font-size:1.15rem;">${escapeHtml(data.username || 'User')}</h4>
                            <div style="margin-top:4px;">${roles}</div>
                        </div>
                    </div>

                    <div style="font-size:0.9rem;line-height:1.7;">
                        <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border,#eee);">
                            <span class="text-muted">User ID:</span>
                            <strong>#${data.userId ? escapeHtml(String(data.userId)) : '1'}</strong>
                        </div>
                        <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border,#eee);">
                            <span class="text-muted">Account Status:</span>
                            <span>${statusBadge}</span>
                        </div>
                        <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border,#eee);">
                            <span class="text-muted">Created:</span>
                            <span>${createdStr}</span>
                        </div>
                        <div style="display:flex;justify-content:space-between;padding:6px 0;">
                            <span class="text-muted">Last Login:</span>
                            <span>${lastLoginStr}</span>
                        </div>
                    </div>

                    ${employeeHtml}
                `;
            } else {
                showErrorState(contentEl, resp.message || 'Failed to load profile', () => _fetchUserProfile());
            }
        } catch (e) {
            showErrorState(contentEl, 'Could not retrieve user profile: ' + (e.message || e), () => _fetchUserProfile());
        }
    }

    // ========== Password Management ==========

    window._togglePasswordVisibility = function (inputId, btn) {
        const input = document.getElementById(inputId);
        if (!input) return;
        if (input.type === 'password') {
            input.type = 'text';
            btn.innerText = '🙈';
        } else {
            input.type = 'password';
            btn.innerText = '👁';
        }
    };

    window._resetPasswordForm = function () {
        const form = document.getElementById('change-password-form');
        if (form) form.reset();
        const msgDiv = document.getElementById('pwd-msg');
        if (msgDiv) {
            msgDiv.style.display = 'none';
            msgDiv.innerHTML = '';
        }
    };

    window._handleChangePassword = async function (e) {
        if (e) e.preventDefault();

        const currentPassword = document.getElementById('current-pwd')?.value || '';
        const newPassword = document.getElementById('new-pwd')?.value || '';
        const confirmPassword = document.getElementById('confirm-pwd')?.value || '';
        const msgDiv = document.getElementById('pwd-msg');
        const submitBtn = document.getElementById('change-pwd-btn');

        if (msgDiv) {
            msgDiv.style.display = 'none';
            msgDiv.innerHTML = '';
        }

        // Frontend validations
        if (!currentPassword) {
            _showPasswordMessage('Please enter your current password.', 'danger');
            return;
        }

        if (!newPassword || newPassword.length < 6) {
            _showPasswordMessage('New password must be at least 6 characters long.', 'danger');
            return;
        }

        if (newPassword.length > 50) {
            _showPasswordMessage('New password cannot exceed 50 characters.', 'danger');
            return;
        }

        if (newPassword !== confirmPassword) {
            _showPasswordMessage('New password and confirmation do not match.', 'danger');
            return;
        }

        if (currentPassword === newPassword) {
            _showPasswordMessage('New password cannot be identical to your current password.', 'danger');
            return;
        }

        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerText = 'Updating...';
        }

        try {
            const resp = await apiPost('/auth/change-password', {
                currentPassword: currentPassword,
                newPassword: newPassword,
                confirmPassword: confirmPassword
            });

            if (resp && resp.success) {
                _showPasswordMessage('✅ Password updated successfully! Your credentials have been saved.', 'success');
                showToast('Password changed successfully!', 'success');
                window._resetPasswordForm();
                _showPasswordMessage('✅ Password updated successfully!', 'success');
            } else {
                const errMsg = resp.message || 'Failed to change password.';
                _showPasswordMessage('❌ ' + errMsg, 'danger');
                showToast(errMsg, 'error');
            }
        } catch (err) {
            const errMsg = err.message || 'An error occurred while changing your password.';
            _showPasswordMessage('❌ ' + errMsg, 'danger');
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerText = 'Update Password';
            }
        }
    };

    function _showPasswordMessage(msg, type) {
        const msgDiv = document.getElementById('pwd-msg');
        if (!msgDiv) return;
        msgDiv.style.display = 'block';
        if (type === 'success') {
            msgDiv.style.background = '#d4edda';
            msgDiv.style.color = '#155724';
            msgDiv.style.border = '1px solid #c3e6cb';
        } else {
            msgDiv.style.background = '#f8d7da';
            msgDiv.style.color = '#721c24';
            msgDiv.style.border = '1px solid #f5c6cb';
        }
        msgDiv.innerHTML = escapeHtml(msg);
    }

    // ========== Logout Handler ==========

    window._handleSessionLogout = function () {
        showConfirmDialog('Confirm Sign Out', 'Are you sure you want to end your active session and sign out of the system?', async () => {
            try {
                showToast('Signing out...', 'info');
                const csrfResp = await fetch('/api/csrf', { headers: { 'Accept': 'application/json' } });
                const csrf = await csrfResp.json();
                if (csrf && csrf.token) {
                    const headers = {};
                    headers[csrf.headerName || 'X-XSRF-TOKEN'] = csrf.token;
                    await fetch('/logout', { method: 'POST', headers: headers });
                } else {
                    await fetch('/logout', { method: 'POST' });
                }
            } catch (e) {
                console.error('Logout error:', e);
            }
            window.location.href = '/login?logout=true';
        });
    };

})();