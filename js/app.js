// ========================================
// Aflog Campaign Management System
// Main Application JavaScript
// ========================================

// ========================================
// Data Store
// ========================================
let brands = JSON.parse(localStorage.getItem('aflog_brands')) || [];
let tasks = JSON.parse(localStorage.getItem('aflog_tasks')) || [];
let activities = JSON.parse(localStorage.getItem('aflog_activities')) || [];
let airtableConfig = JSON.parse(localStorage.getItem('aflog_airtable')) || null;

// Get users from localStorage
function getUsers() {
    return JSON.parse(localStorage.getItem('aflog_users')) || [];
}

// Save users to localStorage
function saveUsers(users) {
    localStorage.setItem('aflog_users', JSON.stringify(users));
}

// Get current logged in user
function getCurrentUser() {
    const email = localStorage.getItem('aflog_user_email') || sessionStorage.getItem('aflog_user_email');
    const name = localStorage.getItem('aflog_user_name') || sessionStorage.getItem('aflog_user_name');
    const role = localStorage.getItem('aflog_user_role') || sessionStorage.getItem('aflog_user_role');
    const id = localStorage.getItem('aflog_user_id') || sessionStorage.getItem('aflog_user_id');
    
    return { email, name, role, id };
}

// Check if current user is admin
function isAdmin() {
    const role = localStorage.getItem('aflog_user_role') || sessionStorage.getItem('aflog_user_role');
    return role === 'admin' || role === 'Admin';
}

// Get team members (active users excluding current for dropdowns)
function getTeamMembers() {
    const users = getUsers();
    return users.filter(u => u.active !== false);
}

const STATUS_MAP = {
    'Hot Brands': 'hot',
    'Warm Brands': 'warm',
    'Lost Brands': 'lost',
    'Converted to Campaign': 'converted',
    'Campaign Running': 'running',
    'Campaign Live': 'live',
    'Invoice Stage': 'invoice'
};

const STATUS_OPTIONS = [
    'Hot Brands',
    'Warm Brands',
    'Lost Brands',
    'Converted to Campaign',
    'Campaign Running',
    'Campaign Live',
    'Invoice Stage'
];

// ========================================
// Initialize App
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

function initializeApp() {
    // Check authentication
    if (localStorage.getItem('aflog_logged_in') !== 'true' && 
        sessionStorage.getItem('aflog_logged_in') !== 'true') {
        window.location.href = 'index.html';
        return;
    }
    
    setupNavigation();
    setupModal();
    setupTaskModal();
    setupMemberModal();
    setupAirtableModal();
    setupCampaignModal();
    setupConfirmModal();
    setupSearch();
    setupLogout();
    setupAdminFeatures();
    displayCurrentUser();
    populateDropdowns();
    renderAllViews();
    updateAnalytics();
    loadAirtableConfig();
    
    // Add sample data if empty
    if (brands.length === 0) {
        addSampleData();
    }
}

// ========================================
// Admin Features Setup
// ========================================
function setupAdminFeatures() {
    const adminOnlyElements = document.querySelectorAll('.admin-only');
    const addMemberBtn = document.getElementById('add-member-btn');
    
    if (isAdmin()) {
        adminOnlyElements.forEach(el => el.classList.remove('hidden'));
        if (addMemberBtn) {
            addMemberBtn.addEventListener('click', () => openMemberModal());
        }
    } else {
        adminOnlyElements.forEach(el => el.classList.add('hidden'));
    }
}

// ========================================
// User Display & Logout
// ========================================
function displayCurrentUser() {
    const user = getCurrentUser();
    const userNameEl = document.getElementById('current-user');
    const userRoleEl = document.getElementById('current-role');
    const userAvatarEl = document.getElementById('user-avatar');
    const headerProfile = document.querySelector('#header-profile img');
    
    if (userNameEl) userNameEl.textContent = user.name || 'User';
    if (userRoleEl) userRoleEl.textContent = isAdmin() ? 'Administrator' : (user.role || 'Team Member');
    
    const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=6366f1&color=fff`;
    if (userAvatarEl) userAvatarEl.src = avatarUrl;
    if (headerProfile) headerProfile.src = avatarUrl;
}

function setupLogout() {
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            // Clear all auth data
            localStorage.removeItem('aflog_logged_in');
            localStorage.removeItem('aflog_user_email');
            localStorage.removeItem('aflog_user_name');
            localStorage.removeItem('aflog_user_role');
            localStorage.removeItem('aflog_user_id');
            sessionStorage.removeItem('aflog_logged_in');
            sessionStorage.removeItem('aflog_user_email');
            sessionStorage.removeItem('aflog_user_name');
            sessionStorage.removeItem('aflog_user_role');
            sessionStorage.removeItem('aflog_user_id');
            window.location.href = 'index.html';
        });
    }
}

// ========================================
// Navigation
// ========================================
function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item[data-view]');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const viewId = item.dataset.view;
            
            // Check admin access for manage-team
            if (viewId === 'manage-team' && !isAdmin()) {
                showToast('Access denied. Admin only.', 'error');
                return;
            }
            
            switchView(viewId);
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
        });
    });
    
    // Back to team button
    const backToTeamBtn = document.getElementById('back-to-team');
    if (backToTeamBtn) {
        backToTeamBtn.addEventListener('click', () => {
            switchView('team');
            document.querySelectorAll('.nav-item').forEach(nav => {
                nav.classList.remove('active');
                if (nav.dataset.view === 'team') nav.classList.add('active');
            });
        });
    }
}

function switchView(viewId) {
    const views = document.querySelectorAll('.view');
    views.forEach(view => {
        view.classList.remove('active');
        if (view.id === `view-${viewId}`) {
            view.classList.add('active');
        }
    });
    renderView(viewId);
}

// ========================================
// Search
// ========================================
function setupSearch() {
    const globalSearch = document.getElementById('global-search');
    if (globalSearch) {
        globalSearch.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            filterData(query);
        });
    }
}

function filterData(query) {
    if (!query) {
        renderAllViews();
        return;
    }
    
    const filteredBrands = brands.filter(brand => 
        brand.brandName.toLowerCase().includes(query) ||
        brand.pocName.toLowerCase().includes(query) ||
        brand.pocEmail.toLowerCase().includes(query) ||
        (brand.campaignName && brand.campaignName.toLowerCase().includes(query))
    );
    
    renderAllViews(filteredBrands);
}

// ========================================
// Populate Dropdowns
// ========================================
function populateDropdowns() {
    const teamMembers = getTeamMembers();
    const aflogPoc = document.getElementById('aflog-poc');
    const taskAssignee = document.getElementById('task-assignee');
    const taskAssignedTo = document.getElementById('task-assigned-to');
    const taskBrand = document.getElementById('task-brand');
    
    // Team member dropdowns
    const memberOptions = '<option value="">Select Team Member</option>' + 
        teamMembers.map(member => `<option value="${member.name}">${member.name}</option>`).join('');
    
    if (aflogPoc) aflogPoc.innerHTML = memberOptions;
    if (taskAssignee) taskAssignee.innerHTML = memberOptions;
    if (taskAssignedTo) {
        const currentUser = getCurrentUser();
        taskAssignedTo.innerHTML = `<option value="${currentUser.name}">Myself (${currentUser.name})</option>` +
            teamMembers.filter(m => m.name !== currentUser.name)
                .map(member => `<option value="${member.name}">${member.name}</option>`).join('');
    }
    
    // Brand dropdown for tasks
    if (taskBrand) {
        taskBrand.innerHTML = '<option value="">No brand selected</option>' +
            brands.map(brand => `<option value="${brand.id}">${brand.brandName}</option>`).join('');
    }
}
// ========================================
// Brand Modal
// ========================================
let editingBrandId = null;

function setupModal() {
    const addBrandBtn = document.getElementById('add-brand-btn');
    const modalOverlay = document.getElementById('modal-overlay');
    const modalClose = document.getElementById('modal-close');
    const cancelBtn = document.getElementById('cancel-btn');
    const brandForm = document.getElementById('brand-form');
    
    if (addBrandBtn) addBrandBtn.addEventListener('click', () => openBrandModal());
    if (modalClose) modalClose.addEventListener('click', () => closeBrandModal());
    if (cancelBtn) cancelBtn.addEventListener('click', () => closeBrandModal());
    if (modalOverlay) {
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) closeBrandModal();
        });
    }
    if (brandForm) brandForm.addEventListener('submit', handleBrandSubmit);
}

function openBrandModal(brand = null) {
    const modalOverlay = document.getElementById('modal-overlay');
    editingBrandId = brand ? brand.id : null;
    document.getElementById('modal-title').textContent = brand ? 'Edit Brand' : 'Add New Brand';
    
    populateDropdowns();
    
    if (brand) {
        document.getElementById('brand-name').value = brand.brandName || '';
        document.getElementById('poc-name').value = brand.pocName || '';
        document.getElementById('poc-number').value = brand.pocNumber || '';
        document.getElementById('poc-email').value = brand.pocEmail || '';
        document.getElementById('budget-status').value = brand.budgetStatus || 'Medium';
        document.getElementById('brand-status').value = brand.status || 'Hot Brands';
        document.getElementById('pipeline-status').value = brand.pipelineStatus || 'Initial Talks';
        document.getElementById('aflog-poc').value = brand.aflogPoc || '';
        document.getElementById('campaign-name').value = brand.campaignName || '';
        document.getElementById('task-assignee').value = brand.taskAssignee || '';
        document.getElementById('brief-comments').value = brand.briefComments || '';
        document.getElementById('brand-tool').checked = brand.brandTool || false;
        document.getElementById('retainer').checked = brand.retainer || false;
        document.getElementById('invoiced').checked = brand.invoiced || false;
        document.getElementById('invoice-amount').value = brand.invoiceAmount || '';
        document.getElementById('invoice-status').value = brand.invoiceStatus || '';
    } else {
        document.getElementById('brand-form').reset();
    }
    
    modalOverlay.classList.add('active');
}

function closeBrandModal() {
    const modalOverlay = document.getElementById('modal-overlay');
    if (modalOverlay) modalOverlay.classList.remove('active');
    const brandForm = document.getElementById('brand-form');
    if (brandForm) brandForm.reset();
    editingBrandId = null;
}

function handleBrandSubmit(e) {
    e.preventDefault();
    
    const currentUser = getCurrentUser();
    
    const brandData = {
        id: editingBrandId || Date.now(),
        brandName: document.getElementById('brand-name').value,
        pocName: document.getElementById('poc-name').value,
        pocNumber: document.getElementById('poc-number').value,
        pocEmail: document.getElementById('poc-email').value,
        budgetStatus: document.getElementById('budget-status').value,
        status: document.getElementById('brand-status').value,
        pipelineStatus: document.getElementById('pipeline-status').value,
        aflogPoc: document.getElementById('aflog-poc').value,
        campaignName: document.getElementById('campaign-name').value,
        taskAssignee: document.getElementById('task-assignee').value,
        briefComments: document.getElementById('brief-comments').value,
        brandTool: document.getElementById('brand-tool').checked,
        retainer: document.getElementById('retainer').checked,
        invoiced: document.getElementById('invoiced').checked,
        invoiceAmount: document.getElementById('invoice-amount').value,
        invoiceStatus: document.getElementById('invoice-status').value,
        monthAdded: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        createdBy: editingBrandId ? brands.find(b => b.id === editingBrandId)?.createdBy : currentUser.name,
        createdAt: editingBrandId ? brands.find(b => b.id === editingBrandId)?.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        updatedBy: currentUser.name
    };
    
    if (editingBrandId) {
        const index = brands.findIndex(b => b.id === editingBrandId);
        if (index !== -1) {
            brands[index] = brandData;
            addActivity('update', `${currentUser.name} updated brand: ${brandData.brandName}`);
        }
    } else {
        brands.push(brandData);
        addActivity('add', `${currentUser.name} added new brand: ${brandData.brandName}`);
    }
    
    saveData();
    populateDropdowns();
    renderAllViews();
    updateAnalytics();
    closeBrandModal();
    showToast(editingBrandId ? 'Brand updated successfully!' : 'Brand added successfully!');
}

// ========================================
// Task Modal
// ========================================
let editingTaskId = null;

function setupTaskModal() {
    const addTaskBtn = document.getElementById('add-task-btn');
    const taskModalOverlay = document.getElementById('task-modal-overlay');
    const taskModalClose = document.getElementById('task-modal-close');
    const taskCancelBtn = document.getElementById('task-cancel-btn');
    const taskForm = document.getElementById('task-form');
    
    if (addTaskBtn) addTaskBtn.addEventListener('click', () => openTaskModal());
    if (taskModalClose) taskModalClose.addEventListener('click', () => closeTaskModal());
    if (taskCancelBtn) taskCancelBtn.addEventListener('click', () => closeTaskModal());
    if (taskModalOverlay) {
        taskModalOverlay.addEventListener('click', (e) => {
            if (e.target === taskModalOverlay) closeTaskModal();
        });
    }
    if (taskForm) taskForm.addEventListener('submit', handleTaskSubmit);
}

function openTaskModal(task = null) {
    const taskModalOverlay = document.getElementById('task-modal-overlay');
    editingTaskId = task ? task.id : null;
    document.getElementById('task-modal-title').textContent = task ? 'Edit Task' : 'Add New Task';
    
    populateDropdowns();
    
    if (task) {
        document.getElementById('task-title').value = task.title || '';
        document.getElementById('task-description').value = task.description || '';
        document.getElementById('task-brand').value = task.brandId || '';
        document.getElementById('task-assigned-to').value = task.assignedTo || '';
        document.getElementById('task-status').value = task.status || 'To Do';
        document.getElementById('task-priority').value = task.priority || 'Medium';
        document.getElementById('task-due-date').value = task.dueDate || '';
    } else {
        document.getElementById('task-form').reset();
        // Set default assignee to current user
        const currentUser = getCurrentUser();
        document.getElementById('task-assigned-to').value = currentUser.name;
    }
    
    taskModalOverlay.classList.add('active');
}

function closeTaskModal() {
    const taskModalOverlay = document.getElementById('task-modal-overlay');
    if (taskModalOverlay) taskModalOverlay.classList.remove('active');
    const taskForm = document.getElementById('task-form');
    if (taskForm) taskForm.reset();
    editingTaskId = null;
}

function handleTaskSubmit(e) {
    e.preventDefault();
    
    const currentUser = getCurrentUser();
    const brandId = document.getElementById('task-brand').value;
    const brand = brands.find(b => b.id == brandId);
    
    const taskData = {
        id: editingTaskId || Date.now(),
        title: document.getElementById('task-title').value,
        description: document.getElementById('task-description').value,
        brandId: brandId || null,
        brandName: brand ? brand.brandName : null,
        assignedTo: document.getElementById('task-assigned-to').value || currentUser.name,
        status: document.getElementById('task-status').value,
        priority: document.getElementById('task-priority').value,
        dueDate: document.getElementById('task-due-date').value,
        createdBy: editingTaskId ? tasks.find(t => t.id === editingTaskId)?.createdBy : currentUser.name,
        createdAt: editingTaskId ? tasks.find(t => t.id === editingTaskId)?.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    if (editingTaskId) {
        const index = tasks.findIndex(t => t.id === editingTaskId);
        if (index !== -1) {
            tasks[index] = taskData;
            addActivity('task', `${currentUser.name} updated task: ${taskData.title}`);
        }
    } else {
        tasks.push(taskData);
        addActivity('task', `${currentUser.name} created task: ${taskData.title}`);
    }
    
    saveData();
    renderAllViews();
    updateAnalytics();
    closeTaskModal();
    showToast(editingTaskId ? 'Task updated successfully!' : 'Task added successfully!');
}

// ========================================
// Team Member Modal (Admin Only)
// ========================================
let editingMemberId = null;

function setupMemberModal() {
    const memberModalOverlay = document.getElementById('member-modal-overlay');
    const memberModalClose = document.getElementById('member-modal-close');
    const memberCancelBtn = document.getElementById('member-cancel-btn');
    const memberForm = document.getElementById('member-form');
    
    if (memberModalClose) memberModalClose.addEventListener('click', () => closeMemberModal());
    if (memberCancelBtn) memberCancelBtn.addEventListener('click', () => closeMemberModal());
    if (memberModalOverlay) {
        memberModalOverlay.addEventListener('click', (e) => {
            if (e.target === memberModalOverlay) closeMemberModal();
        });
    }
    if (memberForm) memberForm.addEventListener('submit', handleMemberSubmit);
}

function openMemberModal(member = null) {
    if (!isAdmin()) {
        showToast('Access denied. Admin only.', 'error');
        return;
    }
    
    const memberModalOverlay = document.getElementById('member-modal-overlay');
    editingMemberId = member ? member.id : null;
    document.getElementById('member-modal-title').textContent = member ? 'Edit Team Member' : 'Add Team Member';
    
    const passwordField = document.getElementById('member-password');
    
    if (member) {
        document.getElementById('member-name').value = member.name || '';
        // Extract username from email (remove @aflog.in)
        const emailUsername = member.email ? member.email.replace('@aflog.in', '') : '';
        document.getElementById('member-email').value = emailUsername;
        document.getElementById('member-password').value = '';
        passwordField.required = false;
        passwordField.placeholder = 'Leave blank to keep current';
        document.getElementById('member-role-select').value = member.role || 'Team Member';
        document.getElementById('member-active').checked = member.active !== false;
        document.getElementById('member-is-admin').checked = member.role === 'admin' || member.role === 'Admin';
    } else {
        document.getElementById('member-form').reset();
        document.getElementById('member-active').checked = true;
        passwordField.required = true;
        passwordField.placeholder = 'Create password';
    }
    
    memberModalOverlay.classList.add('active');
}

function closeMemberModal() {
    const memberModalOverlay = document.getElementById('member-modal-overlay');
    if (memberModalOverlay) memberModalOverlay.classList.remove('active');
    const memberForm = document.getElementById('member-form');
    if (memberForm) memberForm.reset();
    editingMemberId = null;
}

function handleMemberSubmit(e) {
    e.preventDefault();
    
    if (!isAdmin()) {
        showToast('Access denied. Admin only.', 'error');
        return;
    }
    
    const users = getUsers();
    const emailUsername = document.getElementById('member-email').value.trim().toLowerCase();
    const email = emailUsername + '@aflog.in';
    const password = document.getElementById('member-password').value;
    const isAdminRole = document.getElementById('member-is-admin').checked;
    
    // Check if email already exists (for new members)
    if (!editingMemberId) {
        const existingUser = users.find(u => u.email.toLowerCase() === email);
        if (existingUser) {
            showToast('Email already exists!', 'error');
            return;
        }
    }
    
    const memberData = {
        id: editingMemberId || Date.now(),
        name: document.getElementById('member-name').value,
        email: email,
        password: password || (editingMemberId ? users.find(u => u.id === editingMemberId)?.password : ''),
        role: isAdminRole ? 'admin' : document.getElementById('member-role-select').value,
        active: document.getElementById('member-active').checked,
        createdAt: editingMemberId ? users.find(u => u.id === editingMemberId)?.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    if (editingMemberId) {
        const index = users.findIndex(u => u.id === editingMemberId);
        if (index !== -1) {
            users[index] = memberData;
        }
    } else {
        users.push(memberData);
    }
    
    saveUsers(users);
    populateDropdowns();
    renderAllViews();
    closeMemberModal();
    showToast(editingMemberId ? 'Team member updated!' : 'Team member added!');
    addActivity('update', `${getCurrentUser().name} ${editingMemberId ? 'updated' : 'added'} team member: ${memberData.name}`);
}

// ========================================
// Confirm Modal
// ========================================
let confirmCallback = null;

function setupConfirmModal() {
    const confirmModalOverlay = document.getElementById('confirm-modal-overlay');
    const confirmModalClose = document.getElementById('confirm-modal-close');
    const confirmCancel = document.getElementById('confirm-cancel');
    const confirmYes = document.getElementById('confirm-yes');
    
    if (confirmModalClose) confirmModalClose.addEventListener('click', () => closeConfirmModal());
    if (confirmCancel) confirmCancel.addEventListener('click', () => closeConfirmModal());
    if (confirmModalOverlay) {
        confirmModalOverlay.addEventListener('click', (e) => {
            if (e.target === confirmModalOverlay) closeConfirmModal();
        });
    }
    if (confirmYes) {
        confirmYes.addEventListener('click', () => {
            if (confirmCallback) confirmCallback();
            closeConfirmModal();
        });
    }
}

function openConfirmModal(message, callback) {
    const confirmModalOverlay = document.getElementById('confirm-modal-overlay');
    document.getElementById('confirm-message').textContent = message;
    confirmCallback = callback;
    confirmModalOverlay.classList.add('active');
}

function closeConfirmModal() {
    const confirmModalOverlay = document.getElementById('confirm-modal-overlay');
    if (confirmModalOverlay) confirmModalOverlay.classList.remove('active');
    confirmCallback = null;
}

// ========================================
// Airtable Modal
// ========================================
function setupAirtableModal() {
    const airtableSettings = document.getElementById('airtable-settings');
    const airtableModalOverlay = document.getElementById('airtable-modal-overlay');
    const airtableModalClose = document.getElementById('airtable-modal-close');
    const airtableCancel = document.getElementById('airtable-cancel');
    const airtableForm = document.getElementById('airtable-form');
    const testConnectionBtn = document.getElementById('test-connection');
    
    if (airtableSettings) {
        airtableSettings.addEventListener('click', (e) => {
            e.preventDefault();
            airtableModalOverlay.classList.add('active');
        });
    }
    
    if (airtableModalClose) {
        airtableModalClose.addEventListener('click', () => {
            airtableModalOverlay.classList.remove('active');
        });
    }
    
    if (airtableCancel) {
        airtableCancel.addEventListener('click', () => {
            airtableModalOverlay.classList.remove('active');
        });
    }
    
    if (airtableModalOverlay) {
        airtableModalOverlay.addEventListener('click', (e) => {
            if (e.target === airtableModalOverlay) {
                airtableModalOverlay.classList.remove('active');
            }
        });
    }
    
    if (testConnectionBtn) testConnectionBtn.addEventListener('click', testAirtableConnection);
    if (airtableForm) airtableForm.addEventListener('submit', saveAirtableConfig);
}

function loadAirtableConfig() {
    if (airtableConfig) {
        const apiKeyEl = document.getElementById('airtable-api-key');
        const baseIdEl = document.getElementById('airtable-base-id');
        const tableNameEl = document.getElementById('airtable-table-name');
        
        if (apiKeyEl) apiKeyEl.value = airtableConfig.apiKey || '';
        if (baseIdEl) baseIdEl.value = airtableConfig.baseId || '';
        if (tableNameEl) tableNameEl.value = airtableConfig.tableName || 'Brands';
    }
}

async function testAirtableConnection() {
    const apiKey = document.getElementById('airtable-api-key').value;
    const baseId = document.getElementById('airtable-base-id').value;
    const tableName = document.getElementById('airtable-table-name').value;
    const syncStatus = document.getElementById('sync-status');
    
    if (!apiKey || !baseId || !tableName) {
        syncStatus.textContent = 'Please fill in all fields';
        syncStatus.className = 'sync-status error';
        syncStatus.style.display = 'block';
        return;
    }
    
    syncStatus.textContent = 'Testing connection...';
    syncStatus.className = 'sync-status';
    syncStatus.style.display = 'block';
    
    try {
        const response = await fetch(
            `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}?maxRecords=1`,
            {
                headers: {
                    'Authorization': `Bearer ${apiKey}`
                }
            }
        );
        
        if (response.ok) {
            syncStatus.textContent = '✓ Connection successful!';
            syncStatus.className = 'sync-status success';
        } else {
            const error = await response.json();
            syncStatus.textContent = `✗ Error: ${error.error?.message || 'Connection failed'}`;
            syncStatus.className = 'sync-status error';
        }
    } catch (error) {
        syncStatus.textContent = `✗ Error: ${error.message}`;
        syncStatus.className = 'sync-status error';
    }
}

async function saveAirtableConfig(e) {
    e.preventDefault();
    
    airtableConfig = {
        apiKey: document.getElementById('airtable-api-key').value,
        baseId: document.getElementById('airtable-base-id').value,
        tableName: document.getElementById('airtable-table-name').value
    };
    
    localStorage.setItem('aflog_airtable', JSON.stringify(airtableConfig));
    
    await syncFromAirtable();
    
    document.getElementById('airtable-modal-overlay').classList.remove('active');
    showToast('Airtable configuration saved!');
}

async function syncFromAirtable() {
    if (!airtableConfig || !airtableConfig.apiKey) return;
    
    try {
        const response = await fetch(
            `https://api.airtable.com/v0/${airtableConfig.baseId}/${encodeURIComponent(airtableConfig.tableName)}`,
            {
                headers: {
                    'Authorization': `Bearer ${airtableConfig.apiKey}`
                }
            }
        );
        
        if (response.ok) {
            const data = await response.json();
            
            const airtableBrands = data.records.map(record => ({
                id: record.id,
                brandName: record.fields['Brand Name'] || record.fields['Name'] || '',
                pocName: record.fields['POC Name'] || record.fields['Contact Name'] || '',
                pocNumber: record.fields['POC Number'] || record.fields['Phone'] || '',
                pocEmail: record.fields['POC Email'] || record.fields['Email'] || '',
                budgetStatus: record.fields['Budget Status'] || record.fields['Budget'] || 'Medium',
                status: record.fields['Status'] || 'Hot Brands',
                pipelineStatus: record.fields['Pipeline Status'] || 'Initial Talks',
                aflogPoc: record.fields['Aflog POC'] || '',
                campaignName: record.fields['Campaign Name'] || '',
                taskAssignee: record.fields['Task Assignee'] || '',
                briefComments: record.fields['Brief/Comments'] || record.fields['Notes'] || '',
                brandTool: record.fields['Brand Tool'] || false,
                retainer: record.fields['Retainer'] || false,
                invoiced: record.fields['Invoiced'] || false,
                invoiceAmount: record.fields['Invoice Amount'] || '',
                invoiceStatus: record.fields['Invoice Status'] || '',
                monthAdded: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
                createdAt: record.createdTime,
                updatedAt: new Date().toISOString(),
                airtableId: record.id
            }));
            
            airtableBrands.forEach(ab => {
                if (ab.brandName) {
                    const existingIndex = brands.findIndex(b => b.airtableId === ab.airtableId || b.brandName === ab.brandName);
                    if (existingIndex === -1) {
                        brands.push(ab);
                    } else {
                        brands[existingIndex] = { ...brands[existingIndex], ...ab };
                    }
                }
            });
            
            saveData();
            populateDropdowns();
            renderAllViews();
            updateAnalytics();
            addActivity('update', `Synced ${airtableBrands.length} brands from Airtable`);
        }
    } catch (error) {
        console.error('Airtable sync error:', error);
    }
}

// ========================================
// Campaign Modal
// ========================================
function setupCampaignModal() {
    const campaignModalOverlay = document.getElementById('campaign-modal-overlay');
    const campaignModalClose = document.getElementById('campaign-modal-close');
    
    if (campaignModalClose) {
        campaignModalClose.addEventListener('click', () => {
            campaignModalOverlay.classList.remove('active');
        });
    }
    
    if (campaignModalOverlay) {
        campaignModalOverlay.addEventListener('click', (e) => {
            if (e.target === campaignModalOverlay) {
                campaignModalOverlay.classList.remove('active');
            }
        });
    }
}

function openCampaignModal(brand) {
    const campaignModalOverlay = document.getElementById('campaign-modal-overlay');
    document.getElementById('campaign-modal-title').textContent = brand.campaignName || brand.brandName;
    
    const reach = Math.floor(Math.random() * 50000) + 10000;
    const engagement = (Math.random() * 5 + 2).toFixed(1);
    const clicks = Math.floor(Math.random() * 1000) + 100;
    const conversions = Math.floor(Math.random() * 50) + 5;
    
    const detailsHtml = `
        <div class="campaign-overview">
            <div class="overview-stat">
                <div class="overview-stat-value">${reach.toLocaleString()}</div>
                <div class="overview-stat-label">Total Reach</div>
            </div>
            <div class="overview-stat">
                <div class="overview-stat-value">${engagement}%</div>
                <div class="overview-stat-label">Engagement Rate</div>
            </div>
            <div class="overview-stat">
                <div class="overview-stat-value">${clicks.toLocaleString()}</div>
                <div class="overview-stat-label">Clicks</div>
            </div>
            <div class="overview-stat">
                <div class="overview-stat-value">${conversions}</div>
                <div class="overview-stat-label">Conversions</div>
            </div>
        </div>
        <div class="chart-card">
            <h3>Campaign Performance</h3>
            <div class="campaign-chart-placeholder">
                <i class="fas fa-chart-area" style="font-size: 3rem; margin-bottom: 15px;"></i>
                <p>Connect analytics API for real-time data</p>
            </div>
        </div>
        <div style="margin-top: 20px;">
            <h3 style="margin-bottom: 15px;">Campaign Details</h3>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px;">
                <div><strong>Brand:</strong> ${brand.brandName}</div>
                <div><strong>POC:</strong> ${brand.pocName}</div>
                <div><strong>Status:</strong> <span class="status-badge ${STATUS_MAP[brand.status]}">${brand.status}</span></div>
                <div><strong>Retainer:</strong> ${brand.retainer ? 'Yes' : 'No'}</div>
            </div>
        </div>
    `;
    
    document.getElementById('campaign-details').innerHTML = detailsHtml;
    campaignModalOverlay.classList.add('active');
}
// ========================================
// Data Functions
// ========================================
function saveData() {
    localStorage.setItem('aflog_brands', JSON.stringify(brands));
    localStorage.setItem('aflog_tasks', JSON.stringify(tasks));
    localStorage.setItem('aflog_activities', JSON.stringify(activities));
}

function addActivity(type, message) {
    activities.unshift({
        type,
        message,
        time: new Date().toISOString(),
        user: getCurrentUser().name
    });
    if (activities.length > 100) activities = activities.slice(0, 100);
    saveData();
}

// ========================================
// Brand Actions
// ========================================
function updateBrandStatus(brandId, newStatus) {
    const brand = brands.find(b => b.id === brandId);
    if (brand) {
        const oldStatus = brand.status;
        brand.status = newStatus;
        brand.updatedAt = new Date().toISOString();
        brand.updatedBy = getCurrentUser().name;
        
        if (newStatus === 'Converted to Campaign' && !brand.campaignName) {
            brand.campaignName = `${brand.brandName} Campaign`;
        }
        
        saveData();
        renderAllViews();
        updateAnalytics();
        addActivity('status', `${getCurrentUser().name}: ${brand.brandName} moved from ${oldStatus} to ${newStatus}`);
        showToast(`Status updated to ${newStatus}`);
    }
}

function updateBrandTool(brandId, checked) {
    const brand = brands.find(b => b.id === brandId);
    if (brand) {
        brand.brandTool = checked;
        brand.updatedAt = new Date().toISOString();
        saveData();
    }
}

function updateRetainer(brandId, checked) {
    const brand = brands.find(b => b.id === brandId);
    if (brand) {
        brand.retainer = checked;
        brand.updatedAt = new Date().toISOString();
        saveData();
        updateAnalytics();
    }
}

function updateInvoiced(brandId, checked) {
    const brand = brands.find(b => b.id === brandId);
    if (brand) {
        brand.invoiced = checked;
        brand.updatedAt = new Date().toISOString();
        saveData();
    }
}

function editBrand(brandId) {
    const brand = brands.find(b => b.id === brandId);
    if (brand) {
        openBrandModal(brand);
    }
}

function deleteBrand(brandId) {
    const brand = brands.find(b => b.id === brandId);
    openConfirmModal(`Are you sure you want to delete "${brand?.brandName}"?`, () => {
        brands = brands.filter(b => b.id !== brandId);
        // Also delete related tasks
        tasks = tasks.filter(t => t.brandId != brandId);
        saveData();
        renderAllViews();
        updateAnalytics();
        addActivity('update', `${getCurrentUser().name} deleted brand: ${brand?.brandName || 'Unknown'}`);
        showToast('Brand deleted successfully');
    });
}

function viewCampaign(brandId) {
    const brand = brands.find(b => b.id === brandId);
    if (brand) {
        openCampaignModal(brand);
    }
}

// ========================================
// Task Actions
// ========================================
function updateTaskStatus(taskId, newStatus) {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        task.status = newStatus;
        task.updatedAt = new Date().toISOString();
        saveData();
        renderAllViews();
        showToast(`Task moved to ${newStatus}`);
    }
}

function editTask(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        openTaskModal(task);
    }
}

function deleteTask(taskId) {
    const task = tasks.find(t => t.id === taskId);
    openConfirmModal(`Are you sure you want to delete this task?`, () => {
        tasks = tasks.filter(t => t.id !== taskId);
        saveData();
        renderAllViews();
        addActivity('task', `${getCurrentUser().name} deleted task: ${task?.title || 'Unknown'}`);
        showToast('Task deleted successfully');
    });
}

// ========================================
// Team Member Actions
// ========================================
function editMember(memberId) {
    const users = getUsers();
    const member = users.find(u => u.id === memberId);
    if (member) {
        openMemberModal(member);
    }
}

function toggleMemberStatus(memberId) {
    if (!isAdmin()) {
        showToast('Access denied. Admin only.', 'error');
        return;
    }
    
    const users = getUsers();
    const member = users.find(u => u.id === memberId);
    
    if (member) {
        // Prevent deactivating yourself
        const currentUser = getCurrentUser();
        if (member.email === currentUser.email) {
            showToast("You can't deactivate your own account!", 'error');
            return;
        }
        
        const newStatus = member.active === false ? true : false;
        const action = newStatus ? 'activate' : 'deactivate';
        
        openConfirmModal(`Are you sure you want to ${action} ${member.name}?`, () => {
            member.active = newStatus;
            member.updatedAt = new Date().toISOString();
            saveUsers(users);
            renderAllViews();
            showToast(`${member.name} has been ${newStatus ? 'activated' : 'deactivated'}`);
            addActivity('update', `${getCurrentUser().name} ${action}d team member: ${member.name}`);
        });
    }
}

function deleteMember(memberId) {
    if (!isAdmin()) {
        showToast('Access denied. Admin only.', 'error');
        return;
    }
    
    const users = getUsers();
    const member = users.find(u => u.id === memberId);
    
    if (member) {
        // Prevent deleting yourself
        const currentUser = getCurrentUser();
        if (member.email === currentUser.email) {
            showToast("You can't delete your own account!", 'error');
            return;
        }
        
        openConfirmModal(`Are you sure you want to permanently delete ${member.name}? This action cannot be undone.`, () => {
            const updatedUsers = users.filter(u => u.id !== memberId);
            saveUsers(updatedUsers);
            renderAllViews();
            showToast(`${member.name} has been deleted`);
            addActivity('update', `${getCurrentUser().name} deleted team member: ${member.name}`);
        });
    }
}

function viewMemberDetail(memberId) {
    const users = getUsers();
    const member = users.find(u => u.id === memberId);
    
    if (member) {
        // Update member detail view
        document.getElementById('member-detail-name').textContent = member.name;
        document.getElementById('member-detail-role').textContent = member.role;
        document.getElementById('member-detail-avatar').src = 
            `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=6366f1&color=fff&size=100`;
        
        // Get member's tasks
        const memberTasks = tasks.filter(t => t.assignedTo === member.name);
        const pendingTasks = memberTasks.filter(t => t.status === 'To Do');
        const progressTasks = memberTasks.filter(t => t.status === 'In Progress');
        const completedTasks = memberTasks.filter(t => t.status === 'Completed');
        
        // Get member's campaigns
        const memberCampaigns = brands.filter(b => 
            b.aflogPoc === member.name || b.taskAssignee === member.name
        );
        
        // Update stats
        document.getElementById('member-stat-tasks').textContent = memberTasks.length;
        document.getElementById('member-stat-pending').textContent = pendingTasks.length;
        document.getElementById('member-stat-progress').textContent = progressTasks.length;
        document.getElementById('member-stat-completed').textContent = completedTasks.length;
        document.getElementById('member-stat-campaigns').textContent = memberCampaigns.length;
        
        // Render tasks table
        const tasksListEl = document.getElementById('member-tasks-list');
        if (memberTasks.length === 0) {
            tasksListEl.innerHTML = `
                <tr>
                    <td colspan="5" class="empty-state">
                        <p>No tasks assigned</p>
                    </td>
                </tr>
            `;
        } else {
            tasksListEl.innerHTML = memberTasks.map(task => `
                <tr>
                    <td><strong>${task.title}</strong></td>
                    <td>${task.brandName || '-'}</td>
                    <td><span class="status-badge ${task.status === 'Completed' ? 'running' : task.status === 'In Progress' ? 'live' : 'warm'}">${task.status}</span></td>
                    <td>${task.dueDate ? formatDate(task.dueDate) : '-'}</td>
                    <td><span class="task-priority ${task.priority.toLowerCase()}">${task.priority}</span></td>
                </tr>
            `).join('');
        }
        
        // Render campaigns table
        const campaignsListEl = document.getElementById('member-campaigns-list');
        if (memberCampaigns.length === 0) {
            campaignsListEl.innerHTML = `
                <tr>
                    <td colspan="4" class="empty-state">
                        <p>No campaigns assigned</p>
                    </td>
                </tr>
            `;
        } else {
            campaignsListEl.innerHTML = memberCampaigns.map(brand => `
                <tr>
                    <td><strong>${brand.brandName}</strong></td>
                    <td>${brand.campaignName || '-'}</td>
                    <td><span class="status-badge ${STATUS_MAP[brand.status]}">${brand.status}</span></td>
                    <td>${brand.aflogPoc === member.name ? 'Aflog POC' : 'Task Assignee'}</td>
                </tr>
            `).join('');
        }
        
        // Switch to member detail view
        switchView('member-detail');
    }
}

// ========================================
// Rendering Functions
// ========================================
function renderAllViews(filteredBrands = brands) {
    renderBrandsTable(filteredBrands);
    renderHotTable(filteredBrands.filter(b => b.status === 'Hot Brands'));
    renderWarmTable(filteredBrands.filter(b => b.status === 'Warm Brands'));
    renderLostTable(filteredBrands.filter(b => b.status === 'Lost Brands'));
    renderConvertedTable(filteredBrands.filter(b => b.status === 'Converted to Campaign'));
    renderRunningTable(filteredBrands.filter(b => b.status === 'Campaign Running'));
    renderLiveGrid(filteredBrands.filter(b => b.status === 'Campaign Live'));
    renderInvoiceTable(filteredBrands.filter(b => b.status === 'Invoice Stage'));
    renderTeamGrid();
    renderManageTeamTable();
    renderMyTasks();
    renderDashboard();
    updateBadges();
}

function renderView(viewId) {
    switch(viewId) {
        case 'dashboard': renderDashboard(); break;
        case 'my-tasks': renderMyTasks(); break;
        case 'brands': renderBrandsTable(brands); break;
        case 'hot': renderHotTable(brands.filter(b => b.status === 'Hot Brands')); break;
        case 'warm': renderWarmTable(brands.filter(b => b.status === 'Warm Brands')); break;
        case 'lost': renderLostTable(brands.filter(b => b.status === 'Lost Brands')); break;
        case 'converted': renderConvertedTable(brands.filter(b => b.status === 'Converted to Campaign')); break;
        case 'running': renderRunningTable(brands.filter(b => b.status === 'Campaign Running')); break;
        case 'live': renderLiveGrid(brands.filter(b => b.status === 'Campaign Live')); break;
        case 'invoice': renderInvoiceTable(brands.filter(b => b.status === 'Invoice Stage')); break;
        case 'team': renderTeamGrid(); break;
        case 'manage-team': renderManageTeamTable(); break;
    }
}

function getStatusOptions(currentStatus) {
    return STATUS_OPTIONS.map(status => 
        `<option value="${status}" ${status === currentStatus ? 'selected' : ''}>${status}</option>`
    ).join('');
}

function getEmptyState(icon, title, message) {
    return `
        <tr>
            <td colspan="15">
                <div class="empty-state">
                    <i class="fas fa-${icon}"></i>
                    <h3>${title}</h3>
                    <p>${message}</p>
                </div>
            </td>
        </tr>
    `;
}

function formatDate(dateStr) {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
}

function isDueSoon(dateStr) {
    if (!dateStr) return false;
    const dueDate = new Date(dateStr);
    const today = new Date();
    const diffDays = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
    return diffDays <= 3 && diffDays >= 0;
}

function isOverdue(dateStr) {
    if (!dateStr) return false;
    const dueDate = new Date(dateStr);
    const today = new Date();
    return dueDate < today;
}

// ========================================
// My Tasks View
// ========================================
function renderMyTasks() {
    const currentUser = getCurrentUser();
    const myTasks = tasks.filter(t => t.assignedTo === currentUser.name);
    
    const todoTasks = myTasks.filter(t => t.status === 'To Do');
    const progressTasks = myTasks.filter(t => t.status === 'In Progress');
    const completedTasks = myTasks.filter(t => t.status === 'Completed');
    
    // Update counts
    document.getElementById('count-todo').textContent = todoTasks.length;
    document.getElementById('count-progress').textContent = progressTasks.length;
    document.getElementById('count-completed').textContent = completedTasks.length;
    
    // Render each column
    renderTaskColumn('tasks-todo', todoTasks);
    renderTaskColumn('tasks-progress', progressTasks);
    renderTaskColumn('tasks-completed', completedTasks);
    
    // Update badge
    const myTasksBadge = document.getElementById('badge-my-tasks');
    if (myTasksBadge) {
        myTasksBadge.textContent = todoTasks.length + progressTasks.length;
    }
}

function renderTaskColumn(containerId, taskList) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    if (taskList.length === 0) {
        container.innerHTML = `
            <div class="empty-tasks">
                <i class="fas fa-clipboard-check"></i>
                <p>No tasks here</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = taskList.map(task => {
        const dueSoonClass = isDueSoon(task.dueDate) ? 'soon' : '';
        const overdueClass = isOverdue(task.dueDate) && task.status !== 'Completed' ? 'overdue' : '';
        
        return `
            <div class="task-card" data-id="${task.id}">
                <div class="task-card-header">
                    <span class="task-title">${task.title}</span>
                    <span class="task-priority ${task.priority.toLowerCase()}">${task.priority}</span>
                </div>
                ${task.description ? `<p class="task-description">${task.description}</p>` : ''}
                <div class="task-meta">
                    ${task.brandName ? `
                        <span class="task-brand">
                            <i class="fas fa-building"></i>
                            ${task.brandName}
                        </span>
                    ` : '<span></span>'}
                    ${task.dueDate ? `
                        <span class="task-due ${dueSoonClass} ${overdueClass}">
                            <i class="fas fa-calendar"></i>
                            ${formatDate(task.dueDate)}
                        </span>
                    ` : ''}
                </div>
                <div class="task-footer">
                    <select class="task-status-select" onchange="updateTaskStatus(${task.id}, this.value)">
                        <option value="To Do" ${task.status === 'To Do' ? 'selected' : ''}>To Do</option>
                        <option value="In Progress" ${task.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
                        <option value="Completed" ${task.status === 'Completed' ? 'selected' : ''}>Completed</option>
                    </select>
                    <div class="task-actions">
                        <button class="task-action-btn" onclick="editTask(${task.id})" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="task-action-btn" onclick="deleteTask(${task.id})" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}
// ========================================
// Brand Tables
// ========================================
function renderBrandsTable(data) {
    const tbody = document.getElementById('tbody-brands');
    if (!tbody) return;
    
    if (data.length === 0) {
        tbody.innerHTML = getEmptyState('building', 'No brands yet', 'Add your first brand to get started');
        return;
    }
    
    tbody.innerHTML = data.map(brand => `
        <tr data-id="${brand.id}">
            <td><strong>${brand.brandName}</strong></td>
            <td>${brand.pocName}</td>
            <td>${brand.pocNumber || '-'}</td>
            <td>${brand.pocEmail}</td>
            <td><span class="budget-badge ${brand.budgetStatus.toLowerCase()}">${brand.budgetStatus}</span></td>
            <td>
                <select class="status-dropdown" onchange="updateBrandStatus(${brand.id}, this.value)">
                    ${getStatusOptions(brand.status)}
                </select>
            </td>
            <td class="checkbox-cell">
                <input type="checkbox" ${brand.brandTool ? 'checked' : ''} onchange="updateBrandTool(${brand.id}, this.checked)">
            </td>
            <td>
                <div class="action-btns">
                    <button class="action-btn edit" onclick="editBrand(${brand.id})" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete" onclick="deleteBrand(${brand.id})" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function renderHotTable(data) {
    const tbody = document.getElementById('tbody-hot');
    if (!tbody) return;
    
    if (data.length === 0) {
        tbody.innerHTML = getEmptyState('fire', 'No hot brands', 'Move brands here when they show high interest');
        return;
    }
    
    tbody.innerHTML = data.map(brand => `
        <tr data-id="${brand.id}">
            <td>
                <select class="status-dropdown" onchange="updateBrandStatus(${brand.id}, this.value)">
                    ${getStatusOptions(brand.status)}
                </select>
            </td>
            <td><strong>${brand.brandName}</strong></td>
            <td>${brand.pocName}</td>
            <td>${brand.pocNumber || '-'}</td>
            <td>${brand.pocEmail}</td>
            <td><span class="budget-badge ${brand.budgetStatus.toLowerCase()}">${brand.budgetStatus}</span></td>
            <td>${brand.pipelineStatus || '-'}</td>
            <td>${brand.aflogPoc || '-'}</td>
            <td>${brand.monthAdded || '-'}</td>
            <td>${brand.taskAssignee || '-'}</td>
            <td class="checkbox-cell">
                <input type="checkbox" ${brand.brandTool ? 'checked' : ''} onchange="updateBrandTool(${brand.id}, this.checked)">
            </td>
            <td>
                <div class="action-btns">
                    <button class="action-btn edit" onclick="editBrand(${brand.id})" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete" onclick="deleteBrand(${brand.id})" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function renderWarmTable(data) {
    const tbody = document.getElementById('tbody-warm');
    if (!tbody) return;
    
    if (data.length === 0) {
        tbody.innerHTML = getEmptyState('temperature-half', 'No warm brands', 'Brands showing moderate interest appear here');
        return;
    }
    
    tbody.innerHTML = data.map(brand => `
        <tr data-id="${brand.id}">
            <td>
                <select class="status-dropdown" onchange="updateBrandStatus(${brand.id}, this.value)">
                    ${getStatusOptions(brand.status)}
                </select>
            </td>
            <td><strong>${brand.brandName}</strong></td>
            <td>${brand.pocName}</td>
            <td>${brand.pocNumber || '-'}</td>
            <td>${brand.pocEmail}</td>
            <td><span class="budget-badge ${brand.budgetStatus.toLowerCase()}">${brand.budgetStatus}</span></td>
            <td>${brand.pipelineStatus || '-'}</td>
            <td>${brand.aflogPoc || '-'}</td>
            <td>${brand.taskAssignee || '-'}</td>
            <td class="checkbox-cell">
                <input type="checkbox" ${brand.brandTool ? 'checked' : ''} onchange="updateBrandTool(${brand.id}, this.checked)">
            </td>
            <td>
                <div class="action-btns">
                    <button class="action-btn edit" onclick="editBrand(${brand.id})" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete" onclick="deleteBrand(${brand.id})" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function renderLostTable(data) {
    const tbody = document.getElementById('tbody-lost');
    if (!tbody) return;
    
    if (data.length === 0) {
        tbody.innerHTML = getEmptyState('heart-crack', 'No lost brands', 'Brands that did not convert appear here');
        return;
    }
    
    tbody.innerHTML = data.map(brand => `
        <tr data-id="${brand.id}">
            <td>
                <select class="status-dropdown" onchange="updateBrandStatus(${brand.id}, this.value)">
                    ${getStatusOptions(brand.status)}
                </select>
            </td>
            <td><strong>${brand.brandName}</strong></td>
            <td>${brand.pocName}</td>
            <td>${brand.pocEmail}</td>
            <td><span class="budget-badge ${brand.budgetStatus.toLowerCase()}">${brand.budgetStatus}</span></td>
            <td>${brand.briefComments || '-'}</td>
            <td>
                <div class="action-btns">
                    <button class="action-btn edit" onclick="editBrand(${brand.id})" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete" onclick="deleteBrand(${brand.id})" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function renderConvertedTable(data) {
    const tbody = document.getElementById('tbody-converted');
    if (!tbody) return;
    
    if (data.length === 0) {
        tbody.innerHTML = getEmptyState('exchange-alt', 'No converted brands', 'Brands converted to campaigns appear here');
        return;
    }
    
    tbody.innerHTML = data.map(brand => `
        <tr data-id="${brand.id}">
            <td>
                <select class="status-dropdown" onchange="updateBrandStatus(${brand.id}, this.value)">
                    ${getStatusOptions(brand.status)}
                </select>
            </td>
            <td><strong>${brand.brandName}</strong></td>
            <td>${brand.pocName}</td>
            <td>${brand.pocEmail}</td>
            <td><span class="budget-badge ${brand.budgetStatus.toLowerCase()}">${brand.budgetStatus}</span></td>
            <td>${brand.campaignName || '-'}</td>
            <td>${brand.pipelineStatus || '-'}</td>
            <td>${brand.aflogPoc || '-'}</td>
            <td>${brand.taskAssignee || '-'}</td>
            <td>
                <div class="action-btns">
                    <button class="action-btn edit" onclick="editBrand(${brand.id})" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete" onclick="deleteBrand(${brand.id})" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function renderRunningTable(data) {
    const tbody = document.getElementById('tbody-running');
    if (!tbody) return;
    
    if (data.length === 0) {
        tbody.innerHTML = getEmptyState('play-circle', 'No running campaigns', 'Active campaigns appear here');
        return;
    }
    
    tbody.innerHTML = data.map(brand => `
        <tr data-id="${brand.id}">
            <td>
                <select class="status-dropdown" onchange="updateBrandStatus(${brand.id}, this.value)">
                    ${getStatusOptions(brand.status)}
                </select>
            </td>
            <td><strong>${brand.brandName}</strong></td>
            <td>${brand.pocName}</td>
            <td>${brand.campaignName || '-'}</td>
            <td>${brand.pipelineStatus || '-'}</td>
            <td class="checkbox-cell">
                <input type="checkbox" ${brand.retainer ? 'checked' : ''} onchange="updateRetainer(${brand.id}, this.checked)">
            </td>
            <td>${brand.aflogPoc || '-'}</td>
            <td>${brand.taskAssignee || '-'}</td>
            <td>
                <div class="action-btns">
                    <button class="action-btn view" onclick="viewCampaign(${brand.id})" title="View">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="action-btn edit" onclick="editBrand(${brand.id})" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete" onclick="deleteBrand(${brand.id})" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function renderLiveGrid(data) {
    const grid = document.getElementById('campaigns-grid');
    if (!grid) return;
    
    if (data.length === 0) {
        grid.innerHTML = `
            <div class="empty-state" style="grid-column: 1/-1;">
                <i class="fas fa-broadcast-tower"></i>
                <h3>No live campaigns</h3>
                <p>Campaigns that are live appear here with metrics</p>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = data.map(brand => `
        <div class="campaign-card" onclick="viewCampaign(${brand.id})">
            <div class="campaign-card-header">
                <div>
                    <div class="campaign-brand">${brand.brandName}</div>
                    <div class="campaign-name">${brand.campaignName || 'Campaign'}</div>
                </div>
                <div class="campaign-status-live">Live</div>
            </div>
            <div class="campaign-metrics">
                <div class="metric">
                    <div class="metric-value">${(Math.floor(Math.random() * 50) + 10)}K</div>
                    <div class="metric-label">Reach</div>
                </div>
                <div class="metric">
                    <div class="metric-value">${(Math.random() * 5 + 2).toFixed(1)}%</div>
                    <div class="metric-label">Engagement</div>
                </div>
                <div class="metric">
                    <div class="metric-value">${Math.floor(Math.random() * 500) + 100}</div>
                    <div class="metric-label">Clicks</div>
                </div>
                <div class="metric">
                    <div class="metric-value">${Math.floor(Math.random() * 30) + 5}</div>
                    <div class="metric-label">Conversions</div>
                </div>
            </div>
        </div>
    `).join('');
}

function renderInvoiceTable(data) {
    const tbody = document.getElementById('tbody-invoice');
    if (!tbody) return;
    
    if (data.length === 0) {
        tbody.innerHTML = getEmptyState('file-invoice-dollar', 'No invoices pending', 'Campaigns in invoice stage appear here');
        return;
    }
    
    tbody.innerHTML = data.map(brand => `
        <tr data-id="${brand.id}">
            <td>
                <select class="status-dropdown" onchange="updateBrandStatus(${brand.id}, this.value)">
                    ${getStatusOptions(brand.status)}
                </select>
            </td>
            <td><strong>${brand.brandName}</strong></td>
            <td>${brand.campaignName || '-'}</td>
            <td>${brand.pocEmail}</td>
            <td>${brand.updatedAt ? formatDate(brand.updatedAt) : '-'}</td>
            <td class="checkbox-cell">
                <input type="checkbox" ${brand.invoiced ? 'checked' : ''} onchange="updateInvoiced(${brand.id}, this.checked)">
            </td>
            <td>
                <span class="status-badge ${brand.invoiceStatus === 'Invoice Cleared' ? 'running' : 'lost'}">
                    ${brand.invoiceStatus || 'Pending'}
                </span>
            </td>
            <td>₹${brand.invoiceAmount ? Number(brand.invoiceAmount).toLocaleString() : '0'}</td>
            <td>
                <div class="action-btns">
                    <button class="action-btn edit" onclick="editBrand(${brand.id})" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete" onclick="deleteBrand(${brand.id})" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// ========================================
// Team Views
// ========================================
function renderTeamGrid() {
    const grid = document.getElementById('team-grid');
    if (!grid) return;
    
    const users = getUsers().filter(u => u.active !== false);
    
    if (users.length === 0) {
        grid.innerHTML = `
            <div class="empty-state" style="grid-column: 1/-1;">
                <i class="fas fa-users"></i>
                <h3>No team members</h3>
                <p>Add team members from the Manage Team section</p>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = users.map(member => {
        const memberTasks = tasks.filter(t => t.assignedTo === member.name);
        const activeTasks = memberTasks.filter(t => t.status !== 'Completed').length;
        const campaigns = brands.filter(b => 
            (b.aflogPoc === member.name || b.taskAssignee === member.name) && 
            ['Campaign Running', 'Campaign Live'].includes(b.status)
        ).length;
        
        return `
            <div class="team-card" onclick="viewMemberDetail(${member.id})">
                <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=6366f1&color=fff&size=80" 
                     alt="${member.name}" class="team-avatar">
                <div class="team-name">${member.name}</div>
                <div class="team-role">${member.role}</div>
                <div class="team-email">${member.email}</div>
                <div class="team-stats">
                    <div class="team-stat">
                        <div class="team-stat-value">${activeTasks}</div>
                        <div class="team-stat-label">Active Tasks</div>
                    </div>
                    <div class="team-stat">
                        <div class="team-stat-value">${campaigns}</div>
                        <div class="team-stat-label">Campaigns</div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function renderManageTeamTable() {
    const tbody = document.getElementById('tbody-team');
    if (!tbody) return;
    
    if (!isAdmin()) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="empty-state">
                    <i class="fas fa-lock"></i>
                    <h3>Access Denied</h3>
                    <p>Only administrators can manage team members</p>
                </td>
            </tr>
        `;
        return;
    }
    
    const users = getUsers();
    
    if (users.length === 0) {
        tbody.innerHTML = getEmptyState('users', 'No team members', 'Add your first team member');
        return;
    }
    
    tbody.innerHTML = users.map(member => {
        const memberTasks = tasks.filter(t => t.assignedTo === member.name).length;
        const campaigns = brands.filter(b => 
            b.aflogPoc === member.name || b.taskAssignee === member.name
        ).length;
        const currentUser = getCurrentUser();
        const isCurrentUser = member.email === currentUser.email;
        
        return `
            <tr data-id="${member.id}">
                <td>
                    <strong>${member.name}</strong>
                    ${isCurrentUser ? '<span class="status-badge admin" style="margin-left: 8px;">You</span>' : ''}
                </td>
                <td>${member.email}</td>
                <td>
                    ${member.role === 'admin' || member.role === 'Admin' 
                        ? '<span class="status-badge admin">Admin</span>' 
                        : member.role}
                </td>
                <td>
                    <span class="status-badge ${member.active !== false ? 'active' : 'inactive'}">
                        ${member.active !== false ? 'Active' : 'Inactive'}
                    </span>
                </td>
                <td>${memberTasks}</td>
                <td>${campaigns}</td>
                <td>
                    <div class="action-btns">
                        <button class="action-btn view" onclick="viewMemberDetail(${member.id})" title="View Details">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="action-btn edit" onclick="editMember(${member.id})" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        ${!isCurrentUser ? `
                            <button class="action-btn ${member.active !== false ? 'delete' : 'edit'}" 
                                    onclick="toggleMemberStatus(${member.id})" 
                                    title="${member.active !== false ? 'Deactivate' : 'Activate'}">
                                <i class="fas fa-${member.active !== false ? 'user-slash' : 'user-check'}"></i>
                            </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// ========================================
// Dashboard
// ========================================
function renderDashboard() {
    renderPipelineBars();
    renderActivityList();
}

function renderPipelineBars() {
    const container = document.getElementById('pipeline-bars');
    if (!container) return;
    
    const total = brands.length || 1;
    const stages = [
        { label: 'Hot', key: 'Hot Brands', class: 'hot' },
        { label: 'Warm', key: 'Warm Brands', class: 'warm' },
        { label: 'Lost', key: 'Lost Brands', class: 'lost' },
        { label: 'Converted', key: 'Converted to Campaign', class: 'converted' },
        { label: 'Running', key: 'Campaign Running', class: 'running' },
        { label: 'Live', key: 'Campaign Live', class: 'live' },
        { label: 'Invoice', key: 'Invoice Stage', class: 'invoice' }
    ];
    
    container.innerHTML = stages.map(stage => {
        const count = brands.filter(b => b.status === stage.key).length;
        const percent = Math.round((count / total) * 100);
        
        return `
            <div class="pipeline-bar">
                <div class="pipeline-bar-label">${stage.label}</div>
                <div class="pipeline-bar-track">
                    <div class="pipeline-bar-fill ${stage.class}" style="width: ${percent}%">
                        ${count > 0 ? count : ''}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function renderActivityList() {
    const container = document.getElementById('activity-list');
    if (!container) return;
    
    if (activities.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-history"></i>
                <p>No recent activity</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = activities.slice(0, 15).map(activity => {
        let iconClass, icon;
        switch(activity.type) {
            case 'add':
                iconClass = 'add';
                icon = 'plus';
                break;
            case 'status':
                iconClass = 'status';
                icon = 'exchange-alt';
                break;
            case 'task':
                iconClass = 'task';
                icon = 'tasks';
                break;
            default:
                iconClass = 'update';
                icon = 'edit';
        }
        
        return `
            <div class="activity-item">
                <div class="activity-icon ${iconClass}">
                    <i class="fas fa-${icon}"></i>
                </div>
                <div class="activity-content">
                    <div class="activity-text">${activity.message}</div>
                    <div class="activity-time">${getTimeAgo(activity.time)}</div>
                </div>
            </div>
        `;
    }).join('');
}

// ========================================
// Analytics & Badges
// ========================================
function updateAnalytics() {
    const total = brands.length;
    const hot = brands.filter(b => b.status === 'Hot Brands').length;
    const campaigns = brands.filter(b => ['Campaign Running', 'Campaign Live'].includes(b.status)).length;
    const lost = brands.filter(b => b.status === 'Lost Brands').length;
    const retainers = brands.filter(b => b.retainer).length;
    const converted = brands.filter(b => !['Hot Brands', 'Warm Brands', 'Lost Brands'].includes(b.status)).length;
    const conversionRate = total > 0 ? Math.round((converted / total) * 100) : 0;
    
    const elements = {
        'stat-total': total,
        'stat-hot': hot,
        'stat-campaigns': campaigns,
        'stat-lost': lost,
        'stat-retainer': retainers,
        'stat-conversion': `${conversionRate}%`
    };
    
    Object.entries(elements).forEach(([id, value]) => {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    });
}

function updateBadges() {
    const currentUser = getCurrentUser();
    const myTasks = tasks.filter(t => t.assignedTo === currentUser.name && t.status !== 'Completed');
    
    const badges = {
        'badge-brands': brands.length,
        'badge-hot': brands.filter(b => b.status === 'Hot Brands').length,
        'badge-warm': brands.filter(b => b.status === 'Warm Brands').length,
        'badge-lost': brands.filter(b => b.status === 'Lost Brands').length,
        'badge-converted': brands.filter(b => b.status === 'Converted to Campaign').length,
        'badge-running': brands.filter(b => b.status === 'Campaign Running').length,
        'badge-live': brands.filter(b => b.status === 'Campaign Live').length,
        'badge-invoice': brands.filter(b => b.status === 'Invoice Stage').length,
        'badge-my-tasks': myTasks.length
    };
    
    Object.entries(badges).forEach(([id, count]) => {
        const el = document.getElementById(id);
        if (el) el.textContent = count;
    });
}

// ========================================
// Toast Notification
// ========================================
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');
    
    if (toast && toastMessage) {
        toastMessage.textContent = message;
        toast.className = 'toast ' + type;
        toast.classList.add('show');
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
}

// ========================================
// Sample Data
// ========================================
function addSampleData() {
    const currentUser = getCurrentUser();
    
    brands = [
        {
            id: 1,
            brandName: 'Nike India',
            pocName: 'Rajesh Kumar',
            pocNumber: '+91 98765 43210',
            pocEmail: 'rajesh@nike.in',
            budgetStatus: 'High',
            status: 'Hot Brands',
            pipelineStatus: 'Proposal Sent',
            aflogPoc: currentUser.name,
            campaignName: '',
            taskAssignee: currentUser.name,
            briefComments: 'Interested in Q1 campaign',
            brandTool: true,
            retainer: false,
            invoiced: false,
            invoiceAmount: '',
            invoiceStatus: '',
            monthAdded: 'Jan 2024',
            createdBy: currentUser.name,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        },
        {
            id: 2,
            brandName: 'Adidas Sports',
            pocName: 'Meera Patel',
            pocNumber: '+91 87654 32109',
            pocEmail: 'meera@adidas.com',
            budgetStatus: 'Medium',
            status: 'Warm Brands',
            pipelineStatus: 'Initial Talks',
            aflogPoc: currentUser.name,
            campaignName: '',
            taskAssignee: currentUser.name,
            briefComments: 'Follow up next week',
            brandTool: false,
            retainer: false,
            invoiced: false,
            invoiceAmount: '',
            invoiceStatus: '',
            monthAdded: 'Jan 2024',
            createdBy: currentUser.name,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        },
        {
            id: 3,
            brandName: 'Puma Athletics',
            pocName: 'Vikram Singh',
            pocNumber: '+91 76543 21098',
            pocEmail: 'vikram@puma.in',
            budgetStatus: 'High',
            status: 'Campaign Running',
            pipelineStatus: 'Campaign Stage',
            aflogPoc: currentUser.name,
            campaignName: 'Puma Summer 2024',
            taskAssignee: currentUser.name,
            briefComments: 'Campaign going well',
            brandTool: true,
            retainer: true,
            invoiced: false,
            invoiceAmount: '500000',
            invoiceStatus: '',
            monthAdded: 'Dec 2023',
            createdBy: currentUser.name,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        },
        {
            id: 4,
            brandName: 'Reebok Fitness',
            pocName: 'Anita Desai',
            pocNumber: '+91 65432 10987',
            pocEmail: 'anita@reebok.com',
            budgetStatus: 'Low',
            status: 'Campaign Live',
            pipelineStatus: 'Campaign Stage',
            aflogPoc: currentUser.name,
            campaignName: 'Reebok Fit Challenge',
            taskAssignee: currentUser.name,
            briefComments: 'Live campaign - good metrics',
            brandTool: true,
            retainer: false,
            invoiced: false,
            invoiceAmount: '300000',
            invoiceStatus: '',
            monthAdded: 'Jan 2024',
            createdBy: currentUser.name,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        },
        {
            id: 5,
            brandName: 'Under Armour',
            pocName: 'Karan Malhotra',
            pocNumber: '+91 54321 09876',
            pocEmail: 'karan@ua.com',
            budgetStatus: 'Medium',
            status: 'Invoice Stage',
            pipelineStatus: 'Invoice Stage',
            aflogPoc: currentUser.name,
            campaignName: 'UA Performance Series',
            taskAssignee: currentUser.name,
            briefComments: 'Campaign completed, pending invoice',
            brandTool: true,
            retainer: false,
            invoiced: false,
            invoiceAmount: '450000',
            invoiceStatus: 'Invoice Delayed',
            monthAdded: 'Nov 2023',
            createdBy: currentUser.name,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }
    ];
    
    tasks = [
        {
            id: 1,
            title: 'Send proposal to Nike',
            description: 'Prepare and send Q1 campaign proposal',
            brandId: 1,
            brandName: 'Nike India',
            assignedTo: currentUser.name,
            status: 'In Progress',
            priority: 'High',
            dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            createdBy: currentUser.name,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        },
        {
            id: 2,
            title: 'Follow up with Adidas',
            description: 'Schedule a call to discuss requirements',
            brandId: 2,
            brandName: 'Adidas Sports',
            assignedTo: currentUser.name,
            status: 'To Do',
            priority: 'Medium',
            dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            createdBy: currentUser.name,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        },
        {
            id: 3,
            title: 'Review Puma campaign metrics',
            description: 'Check weekly performance and prepare report',
            brandId: 3,
            brandName: 'Puma Athletics',
            assignedTo: currentUser.name,
            status: 'To Do',
            priority: 'Low',
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            createdBy: currentUser.name,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }
    ];
    
    activities = [
        { type: 'add', message: 'Sample data loaded', time: new Date().toISOString(), user: currentUser.name }
    ];
    
    saveData();
    renderAllViews();
    updateAnalytics();
}

// ========================================
// Make Functions Globally Available
// ========================================
window.updateBrandStatus = updateBrandStatus;
window.updateBrandTool = updateBrandTool;
window.updateRetainer = updateRetainer;
window.updateInvoiced = updateInvoiced;
window.editBrand = editBrand;
window.deleteBrand = deleteBrand;
window.viewCampaign = viewCampaign;
window.updateTaskStatus = updateTaskStatus;
window.editTask = editTask;
window.deleteTask = deleteTask;
window.editMember = editMember;
window.toggleMemberStatus = toggleMemberStatus;
window.deleteMember = deleteMember;
window.viewMemberDetail = viewMemberDetail;
