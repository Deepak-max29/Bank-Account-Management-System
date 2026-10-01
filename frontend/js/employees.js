// js/employees.js

let allEmployees = [];
let branchesList = [];

window.loadEmployees = async () => {
    const container = document.getElementById('main-content');
    container.innerHTML = `
        <div class="page-header">
            <h2>Employees Management</h2>
            <button class="btn btn-primary" id="add-employee-btn" onclick="openEmployeeModal()">+ Add Employee</button>
        </div>
        <div class="action-bar">
            <div class="search-wrapper">
                <span class="search-icon">🔍</span>
                <input type="text" id="employee-search" placeholder="Search by name, email, phone..." oninput="filterEmployees()">
            </div>
            <div style="min-width: 180px;">
                <select id="employee-branch-filter" onchange="filterEmployees()">
                    <option value="">All Branches</option>
                </select>
            </div>
            <div style="min-width: 160px;">
                <select id="employee-designation-filter" onchange="filterEmployees()">
                    <option value="">All Designations</option>
                    <option value="MANAGER">Manager</option>
                    <option value="TELLER">Teller</option>
                    <option value="LOAN_OFFICER">Loan Officer</option>
                    <option value="CLERK">Clerk</option>
                    <option value="CASHIER">Cashier</option>
                    <option value="ASSISTANT_MANAGER">Assistant Manager</option>
                </select>
            </div>
            <button class="btn btn-outline btn-sm" onclick="fetchEmployees()" title="Refresh">↻ Refresh</button>
        </div>
        <div class="card">
            <div id="employees-table-container"></div>
        </div>
    `;

    // Load branches for filter and cache them
    await loadBranchesDropdown();
    // Fetch and display employees
    await fetchEmployees();
};

const loadBranchesDropdown = async () => {
    try {
        const res = await apiGet('/branches');
        branchesList = Array.isArray(res) ? res : (res && res.data ? res.data : (res && res.content ? res.content : []));
        const filterSelect = document.getElementById('employee-branch-filter');
        if (filterSelect) {
            const currentVal = filterSelect.value;
            filterSelect.innerHTML = '<option value="">All Branches</option>' + 
                branchesList.map(b => `<option value="${b.branchId}">${escapeHtml(b.branchName || ('Branch #' + b.branchId))}</option>`).join('');
            filterSelect.value = currentVal;
        }
    } catch (e) {
        console.warn('Could not pre-load branches for filter:', e);
    }
};

const fetchEmployees = async () => {
    const tableContainer = document.getElementById('employees-table-container');
    if (!tableContainer) return;
    showLoading(tableContainer);

    try {
        const res = await apiGet('/employees');
        allEmployees = Array.isArray(res) ? res : (res && res.data ? res.data : []);
        renderEmployeesTable(allEmployees);
    } catch (error) {
        showErrorState(tableContainer, 'Failed to load employees from server.', () => fetchEmployees());
    }
};

window.filterEmployees = () => {
    const searchInput = document.getElementById('employee-search');
    const branchFilter = document.getElementById('employee-branch-filter');
    const designationFilter = document.getElementById('employee-designation-filter');

    const query = searchInput ? searchInput.value.trim().toLowerCase() : '';
    const selectedBranch = branchFilter ? branchFilter.value : '';
    const selectedDesignation = designationFilter ? designationFilter.value.trim().toUpperCase() : '';

    const filtered = allEmployees.filter(emp => {
        // Name, email, phone match
        const fullName = `${emp.firstName || ''} ${emp.lastName || ''}`.toLowerCase();
        const email = (emp.email || '').toLowerCase();
        const phone = (emp.phone || '').toLowerCase();
        const designation = (emp.designation || '').toUpperCase();
        const branchName = (emp.branchName || '').toLowerCase();
        const matchesQuery = !query || 
            fullName.includes(query) || 
            email.includes(query) || 
            phone.includes(query) ||
            branchName.includes(query);

        // Branch filter match
        const matchesBranch = !selectedBranch || String(emp.branchId) === String(selectedBranch);

        // Designation filter match
        const matchesDesignation = !selectedDesignation || designation === selectedDesignation;

        return matchesQuery && matchesBranch && matchesDesignation;
    });

    renderEmployeesTable(filtered);
};

const renderEmployeesTable = (employees) => {
    const tableContainer = document.getElementById('employees-table-container');
    if (!tableContainer) return;

    if (!employees || employees.length === 0) {
        tableContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">👥</div>
                <p>No employees found.</p>
            </div>
        `;
        return;
    }

    const headers = ['ID', 'Name', 'Branch', 'Designation', 'Salary', 'Phone', 'Email', 'Actions'];
    const rows = employees.map(emp => {
        const empId = emp.empId;
        const name = escapeHtml(`${emp.firstName || ''} ${emp.lastName || ''}`.trim() || '-');
        const branch = escapeHtml(emp.branchName || (emp.branchId ? `Branch #${emp.branchId}` : '-'));
        const designation = `<span class="badge badge-info">${escapeHtml(emp.designation || '-')}</span>`;
        const salary = emp.salary != null ? formatCurrency(emp.salary) : '-';
        const phone = escapeHtml(emp.phone || '-');
        const email = escapeHtml(emp.email || '-');

        const serialized = JSON.stringify(emp).replace(/'/g, "&#39;");
        const actions = `
            <button class="btn btn-sm btn-outline" onclick='openEmployeeModal(${serialized})'>Edit</button>
        `;

        return [empId, name, branch, designation, salary, phone, email, actions];
    });

    tableContainer.innerHTML = createTable(headers, rows);
};

window.openEmployeeModal = async (employee = null) => {
    const isEdit = !!employee;
    const title = isEdit ? `Edit Employee #${employee.empId}` : 'Add New Employee';

    // Ensure branches are available
    if (!branchesList || branchesList.length === 0) {
        try {
            const res = await apiGet('/branches');
            branchesList = Array.isArray(res) ? res : (res && res.data ? res.data : (res && res.content ? res.content : []));
        } catch (e) {
            showToast('Unable to load branch list. Please try again.', 'error');
            return;
        }
    }

    if (!branchesList || branchesList.length === 0) {
        showToast('No branches found. Please create a branch before adding employees.', 'warning');
        return;
    }

    const branchOptions = branchesList.map(b => {
        const isSelected = isEdit && String(employee.branchId) === String(b.branchId);
        return `<option value="${b.branchId}" ${isSelected ? 'selected' : ''}>${escapeHtml(b.branchName || ('Branch #' + b.branchId))}</option>`;
    }).join('');

    const designationOptions = [
        'MANAGER',
        'TELLER',
        'LOAN_OFFICER',
        'CLERK',
        'CASHIER',
        'ASSISTANT_MANAGER'
    ].map(des => {
        const isSelected = isEdit && (employee.designation || '').toUpperCase() === des;
        return `<option value="${des}" ${isSelected ? 'selected' : ''}>${des.replace('_', ' ')}</option>`;
    }).join('');

    const hireDateVal = isEdit && employee.joinDate ? employee.joinDate.split('T')[0] : 
                        (isEdit && employee.hireDate ? employee.hireDate.split('T')[0] : new Date().toISOString().split('T')[0]);

    const bodyHtml = `
        <form id="employee-form" class="form-grid" onsubmit="event.preventDefault(); saveEmployee();">
            <input type="hidden" id="emp-id" value="${isEdit ? employee.empId : ''}">
            
            <div class="form-group">
                <label for="emp-first-name">First Name <span class="text-danger">*</span></label>
                <input type="text" id="emp-first-name" class="form-control" required maxlength="50" 
                    value="${isEdit ? escapeHtml(employee.firstName) : ''}" placeholder="e.g. John">
            </div>

            <div class="form-group">
                <label for="emp-last-name">Last Name <span class="text-danger">*</span></label>
                <input type="text" id="emp-last-name" class="form-control" required maxlength="50" 
                    value="${isEdit ? escapeHtml(employee.lastName) : ''}" placeholder="e.g. Doe">
            </div>

            <div class="form-group">
                <label for="emp-branch">Branch <span class="text-danger">*</span></label>
                <select id="emp-branch" class="form-control" required>
                    <option value="">-- Select Branch --</option>
                    ${branchOptions}
                </select>
            </div>

            <div class="form-group">
                <label for="emp-designation">Designation <span class="text-danger">*</span></label>
                <select id="emp-designation" class="form-control" required>
                    <option value="">-- Select Designation --</option>
                    ${designationOptions}
                </select>
            </div>

            <div class="form-group">
                <label for="emp-salary">Salary (₹) <span class="text-danger">*</span></label>
                <input type="number" id="emp-salary" class="form-control" step="0.01" min="0" required 
                    value="${isEdit && employee.salary != null ? employee.salary : ''}" placeholder="e.g. 50000.00">
            </div>

            <div class="form-group">
                <label for="emp-phone">Phone (10 digits) <span class="text-danger">*</span></label>
                <input type="tel" id="emp-phone" class="form-control" pattern="\\d{10}" maxlength="10" required 
                    value="${isEdit ? escapeHtml(employee.phone) : ''}" placeholder="e.g. 9876543210">
            </div>

            <div class="form-group">
                <label for="emp-email">Email <span class="text-danger">*</span></label>
                <input type="email" id="emp-email" class="form-control" required maxlength="100" 
                    value="${isEdit ? escapeHtml(employee.email) : ''}" placeholder="e.g. john.doe@npbank.in">
            </div>

            <div class="form-group">
                <label for="emp-hire-date">Hire Date</label>
                <input type="date" id="emp-hire-date" class="form-control" value="${hireDateVal}">
            </div>
            
            <div id="employee-form-error" class="error-message full-width" style="display: none;"></div>
        </form>
    `;

    const footerHtml = `
        <button type="button" class="btn btn-outline" onclick="closeModal()">Cancel</button>
        <button type="button" class="btn btn-primary" id="save-employee-btn" onclick="saveEmployee()">
            ${isEdit ? 'Update Employee' : 'Create Employee'}
        </button>
    `;

    showModal(title, bodyHtml, footerHtml);
};

window.saveEmployee = async () => {
    const errorBox = document.getElementById('employee-form-error');
    if (errorBox) errorBox.style.display = 'none';

    const empId = document.getElementById('emp-id').value;
    const firstName = document.getElementById('emp-first-name').value.trim();
    const lastName = document.getElementById('emp-last-name').value.trim();
    const branchId = document.getElementById('emp-branch').value;
    const designation = document.getElementById('emp-designation').value;
    const salaryVal = document.getElementById('emp-salary').value.trim();
    const phone = document.getElementById('emp-phone').value.trim();
    const email = document.getElementById('emp-email').value.trim();
    const hireDate = document.getElementById('emp-hire-date').value;

    // Client-side validations
    if (!firstName || !lastName) {
        showFormError('First name and last name are required.');
        return;
    }
    if (!branchId) {
        showFormError('Please select a branch.');
        return;
    }
    if (!designation) {
        showFormError('Please select a designation.');
        return;
    }
    if (!salaryVal || isNaN(salaryVal) || parseFloat(salaryVal) < 0) {
        showFormError('Please enter a valid non-negative salary.');
        return;
    }
    if (!validatePhone(phone)) {
        showFormError('Phone number must be exactly 10 digits.');
        return;
    }
    if (!validateEmail(email)) {
        showFormError('Please enter a valid email address.');
        return;
    }

    const payload = {
        firstName,
        lastName,
        branchId: parseInt(branchId, 10),
        designation,
        salary: parseFloat(salaryVal),
        phone,
        email,
        hireDate: hireDate || null
    };

    const saveBtn = document.getElementById('save-employee-btn');
    if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.innerText = empId ? 'Updating...' : 'Saving...';
    }

    try {
        if (empId) {
            await apiPut(`/employees/${empId}`, payload);
            showToast('Employee updated successfully', 'success');
        } else {
            await apiPost('/employees', payload);
            showToast('Employee created successfully', 'success');
        }
        closeModal();
        await fetchEmployees();
        filterEmployees();
    } catch (err) {
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.innerText = empId ? 'Update Employee' : 'Create Employee';
        }
        showFormError(err.message || 'Operation failed. Please check form values and server permissions.');
    }
};

const showFormError = (msg) => {
    const errorBox = document.getElementById('employee-form-error');
    if (errorBox) {
        errorBox.innerText = msg;
        errorBox.style.display = 'block';
    } else {
        showToast(msg, 'error');
    }
};
