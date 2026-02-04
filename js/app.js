// ========================================
// AFLOG CMS - MAIN APPLICATION LOGIC
// Version: 3.0 (Full Feature Set)
// ========================================

// ========================================
// 1. DATA STORE
// ========================================
let brands = JSON.parse(localStorage.getItem('aflog_brands')) || [];
let campaigns = JSON.parse(localStorage.getItem('aflog_campaigns')) || [];
let creators = JSON.parse(localStorage.getItem('aflog_creators')) || [];
let campaignCreators = JSON.parse(localStorage.getItem('aflog_campaign_creators')) || []; // The link between Campaign & Creator
let tasks = JSON.parse(localStorage.getItem('aflog_tasks')) || [];
let activities = JSON.parse(localStorage.getItem('aflog_activities')) || [];
let selectedCreators = new Set(); // For Bulk Export

// View State
let currentBrandId = null;
let currentCampaignId = null;
let editingId = null; // Generic editing ID

// ========================================
// 2. CONSTANTS & DROPDOWNS
// ========================================
const NICHES = {
    "Fashion": ["Stylist", "Designers", "Reviewers", "Luxury", "Bloggers"],
    "Beauty & Skincare": ["Lifestyle", "Make-up", "Skincare", "Nail Artist", "Reviewers"],
    "Food": ["Chefs", "Bloggers", "Homechefs", "Recipe Creator", "Mukbang", "Healthy Recipe", "Non Vegetarian", "Baking", "Vegetarian"],
    "Fitness": ["Gym", "Yoga", "Pillate", "Zumba", "Bodybuilders", "Lifestyle", "Coach", "Calisthenics", "Hoopa Hoop", "Wellbeing"],
    "Sports": ["Cricketers", "Footballers", "Hockey", "Basketball", "Runner", "Surfer", "Athlete", "Skipper", "Hiker", "Trekker", "Boxing", "MMA", "Wrestling", "Tennis", "Table-Tennis", "Squash", "Hurddles", "Badminton", "Swimmer", "Long-jump", "Shortputt", "Javelline", "Archery", "Rowing", "Kayaking"],
    "Parenting": ["Mom", "Dad", "Senior Citizen", "Kids", "Parenting"],
    "Travel": ["Hiker", "Trekker", "Lifestyle", "Couple", "Infortainment", "Bloggers"],
    "Comedy": ["Stand-Up", "Skit", "Vox-Pop"],
    "Tech": ["Reviewers", "Infortainment", "Lifestyle"],
    "Professionals": ["Actor", "Doctor", "Nutritionist", "CA", "Anchor", "Architechts", "Photographer", "Videographer", "Journalist", "Infortainment", "Wedding Planner", "Home Decor"],
    "Performing Arts": ["Dancer", "Singer", "Musician", "Poet", "Story-Teller", "Doodle Artist"],
    "Automobile": ["Infortainment", "DIY", "Reviewers", "Lifestyle"]
};

// ========================================
// 3. CORE FUNCTIONS (Save, User, Init)
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    if(localStorage.getItem('aflog_logged_in') !== 'true') {
        window.location.href = 'index.html';
        return;
    }
    
    initializeApp();
});

function initializeApp() {
    setupNavigation();
    setupAllModals();
    setupCreatorFilters();
    populateDropdowns();
    renderAllViews();
    updateAnalytics();
    
    // Set User Info
    document.getElementById('current-user').innerText = localStorage.getItem('aflog_user_name');
    document.getElementById('current-role').innerText = localStorage.getItem('aflog_user_role');
}

function saveData() {
    localStorage.setItem('aflog_brands', JSON.stringify(brands));
    localStorage.setItem('aflog_campaigns', JSON.stringify(campaigns));
    localStorage.setItem('aflog_creators', JSON.stringify(creators));
    localStorage.setItem('aflog_campaign_creators', JSON.stringify(campaignCreators));
    localStorage.setItem('aflog_tasks', JSON.stringify(tasks));
    localStorage.setItem('aflog_activities', JSON.stringify(activities));
}

function getUser() {
    return {
        name: localStorage.getItem('aflog_user_name'),
        role: localStorage.getItem('aflog_user_role')
    };
}

function isAdmin() { return getUser().role === 'admin'; }

// Helper: Calculate Category
function calculateCategory(followersInput) {
    let str = followersInput.toString().toUpperCase().replace(/,/g, '');
    let count = 0;
    if (str.includes('K')) count = parseFloat(str) * 1000;
    else if (str.includes('M')) count = parseFloat(str) * 1000000;
    else count = parseInt(str);

    if (isNaN(count)) return "Nano";
    if (count < 15000) return "Nano";
    if (count < 150000) return "Micro";
    if (count < 550000) return "Macro";
    return "Mega";
}

// ========================================
// 4. NAVIGATION
// ========================================
function setupNavigation() {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const view = item.dataset.view;
            
            // Access Control
            if ((view === 'creators' || view === 'manage-team') && !isAdmin()) {
                return showToast('Access Restricted: Admins Only', 'error');
            }
            
            if (view) switchView(view);
        });
    });

    // Back Buttons
    document.getElementById('back-to-brands')?.addEventListener('click', () => switchView('brands'));
    document.getElementById('back-to-campaigns')?.addEventListener('click', () => switchView('campaigns'));
}

function switchView(viewId) {
    // Hide all views
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    
    // Show selected view
    const viewEl = document.getElementById(`view-${viewId}`);
    if (viewEl) viewEl.classList.add('active');
    
    // Highlight nav
    const navItem = document.querySelector(`.nav-item[data-view="${viewId}"]`);
    if (navItem) navItem.classList.add('active');

    // Trigger Specific Renders to refresh data
    if (viewId === 'creators') renderCreatorsGrid();
    if (viewId === 'campaigns') renderAllCampaignsList();
    if (viewId === 'running') renderRunningCampaignsList();
    if (viewId === 'live') renderLiveCampaignsList();
    if (viewId === 'brands') renderBrandsTable();
    if (viewId === 'hot') renderHotTable();
    if (viewId === 'warm') renderWarmTable();
    if (viewId === 'lost') renderLostTable();
    if (viewId === 'converted') renderConvertedTable();
    if (viewId === 'my-tasks') renderMyTasks();
    if (viewId === 'manage-team') renderManageTeamTable();
}
// ========================================
// 5. CREATOR DATABASE LOGIC
// ========================================

// Populate Niche Dropdown
function populateDropdowns() {
    const select = document.getElementById('c-niche');
    const filter = document.getElementById('filter-niche');
    if(!select) return;
    
    const options = Object.keys(NICHES).map(n => `<option value="${n}">${n}</option>`).join('');
    select.innerHTML = `<option value="">Select Niche</option>${options}`;
    filter.innerHTML = `<option value="">All Niches</option>${options}`;
}

// Update Sub-niche based on Niche selection
window.updateSubniches = function() {
    const niche = document.getElementById('c-niche').value;
    const subSelect = document.getElementById('c-subniche');
    if (!niche || !NICHES[niche]) {
        subSelect.innerHTML = '<option value="">Select Niche First</option>';
        return;
    }
    subSelect.innerHTML = NICHES[niche].map(s => `<option value="${s}">${s}</option>`).join('');
}

// Auto update category in modal
window.autoUpdateCategory = function(val) {
    document.getElementById('c-category').value = calculateCategory(val);
}

// Render Creator Grid
function renderCreatorsGrid() {
    const grid = document.getElementById('creators-grid');
    if(!grid) return;
    
    const nicheFilter = document.getElementById('filter-niche').value;
    const catFilter = document.getElementById('filter-category').value;
    const search = document.getElementById('filter-creator-search').value.toLowerCase();

    let filtered = creators.filter(c => {
        return (!nicheFilter || c.niche === nicheFilter) &&
               (!catFilter || c.category === catFilter) &&
               (!search || c.name.toLowerCase().includes(search) || c.handle.toLowerCase().includes(search));
    });

    if(filtered.length === 0) {
        grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><p>No creators found.</p></div>`;
        return;
    }

    grid.innerHTML = filtered.map(c => `
        <div class="creator-card">
            <div class="creator-card-header" style="justify-content: space-between;">
                <div style="display:flex; gap:10px; align-items:center;">
                    <input type="checkbox" style="width:18px; height:18px;" onchange="toggleCreatorSelection(${c.id}, this.checked)" ${selectedCreators.has(c.id) ? 'checked' : ''}>
                    <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(c.name)}&background=random" class="creator-avatar" style="width:40px; height:40px;">
                </div>
                <span class="creator-niche">${c.category}</span>
            </div>
            <div class="creator-info" style="text-align:center; margin-top:10px;">
                <h4 style="margin:0;">${c.name}</h4>
                <div class="creator-handle" style="justify-content:center; margin-top:5px;">
                    <a href="${c.profileLink}" target="_blank" style="color:var(--primary); text-decoration:none;">${c.handle || 'Link'}</a>
                </div>
            </div>
            <div class="creator-stats" style="margin-top:15px; display:grid; grid-template-columns:1fr 1fr; gap:10px; background:var(--bg-tertiary); padding:10px; border-radius:8px;">
                <div class="creator-stat" style="text-align:center;"><div class="value" style="font-weight:bold;">${parseInt(c.followers).toLocaleString()}</div><div class="label" style="font-size:0.7rem; color:var(--text-muted);">Followers</div></div>
                <div class="creator-stat" style="text-align:center;"><div class="value" style="font-weight:bold;">${c.gender || '-'}</div><div class="label" style="font-size:0.7rem; color:var(--text-muted);">Gender</div></div>
            </div>
            <div style="text-align:center; font-size:0.8rem; color:var(--text-secondary); margin-top:10px;">
                ${c.niche} ${c.subniche ? '> ' + c.subniche : ''}
            </div>
            <div class="creator-card-footer" style="margin-top:15px; border-top:1px solid var(--border-color); padding-top:10px; display:flex; justify-content:space-between;">
                <span>${c.city || ''}</span>
                <div class="action-btns">
                    <button class="action-btn edit" onclick="editCreator(${c.id})"><i class="fas fa-edit"></i></button>
                    <button class="action-btn delete" onclick="deleteCreator(${c.id})"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        </div>
    `).join('');
    
    // Toggle Export Button
    const exportBtn = document.getElementById('export-selected-btn');
    if(exportBtn) exportBtn.style.display = selectedCreators.size > 0 ? 'inline-block' : 'none';
}

// Bookmark & Export Logic
window.toggleCreatorSelection = function(id, isChecked) {
    if (isChecked) selectedCreators.add(id);
    else selectedCreators.delete(id);
    document.getElementById('export-selected-btn').style.display = selectedCreators.size > 0 ? 'inline-block' : 'none';
}

window.processExport = function() {
    const campaignId = document.getElementById('export-campaign-select').value;
    if (!campaignId) return showToast('Please select a campaign', 'error');

    let count = 0;
    selectedCreators.forEach(cId => {
        const creator = creators.find(c => c.id === cId);
        if(creator) {
            // Avoid Duplicates
            const exists = campaignCreators.find(cc => cc.campaignId == campaignId && cc.creatorId == cId);
            if(!exists) {
                campaignCreators.push({
                    id: Date.now() + Math.random(),
                    campaignId: parseInt(campaignId),
                    creatorId: creator.id,
                    name: creator.name,
                    handle: creator.handle || creator.username,
                    profileLink: creator.profileLink || creator.link,
                    followers: creator.followers,
                    commercial: creator.commercial || '0',
                    contentStatus: 'Pending',
                    deliverables: [],
                    revisions: 0,
                    driveLink: '',
                    liveLink: '',
                    createdAt: new Date().toISOString()
                });
                count++;
            }
        }
    });
    
    saveData();
    selectedCreators.clear();
    renderCreatorsGrid();
    closeModal('export-modal');
    showToast(`${count} creators exported to campaign!`);
}

// Bulk Upload Logic
window.processCSV = function() {
    const fileInput = document.getElementById('csv-file-input');
    const file = fileInput.files[0];
    if (!file) return showToast('Please select a file', 'error');

    const reader = new FileReader();
    reader.onload = function(e) {
        const text = e.target.result;
        const rows = text.split('\n').slice(1);
        let count = 0;
        
        rows.forEach(row => {
            const cols = row.split(',');
            if (cols.length < 4) return;
            
            const followers = cols[3]?.trim() || 0;
            creators.push({
                id: Date.now() + Math.random(),
                name: cols[0]?.trim(),
                link: cols[1]?.trim(),
                profileLink: cols[1]?.trim(),
                username: cols[2]?.trim(),
                handle: cols[2]?.trim(),
                followers: followers,
                niche: cols[4]?.trim(),
                subniche: cols[5]?.trim(),
                category: calculateCategory(followers),
                state: cols[7]?.trim(),
                city: cols[8]?.trim(),
                contact: cols[9]?.trim(),
                email: cols[10]?.trim(),
                gender: cols[11]?.trim(),
                createdAt: new Date().toISOString()
            });
            count++;
        });
        
        saveData();
        renderCreatorsGrid();
        closeModal('bulk-upload-modal');
        showToast(`Successfully imported ${count} creators!`);
    };
    reader.readAsText(file);
}

function setupCreatorFilters() {
    ['filter-niche', 'filter-category', 'filter-creator-search'].forEach(id => {
        document.getElementById(id)?.addEventListener('input', renderCreatorsGrid);
    });
}
// ========================================
// 6. CAMPAIGN & BRAND MANAGEMENT
// ========================================

// Render Brand Tables
function renderBrandsTable() { renderSpecificTable(brands, 'tbody-brands'); }
function renderHotTable() { renderSpecificTable(brands.filter(b => b.status === 'Hot Brands'), 'tbody-hot'); }
function renderWarmTable() { renderSpecificTable(brands.filter(b => b.status === 'Warm Brands'), 'tbody-warm'); }
function renderLostTable() { renderSpecificTable(brands.filter(b => b.status === 'Lost Brands'), 'tbody-lost'); }

function renderConvertedTable() { 
    const data = brands.filter(b => b.status === 'Converted to Campaign');
    const tbody = document.getElementById('tbody-converted');
    if(!tbody) return;
    tbody.innerHTML = data.map(b => `
        <tr data-id="${b.id}">
            <td><strong>${b.name}</strong></td>
            <td>${b.poc || '-'}</td>
            <td>${b.email || '-'}</td>
            <td>${b.budget || '-'}</td>
            <td>${b.campaigns ? b.campaigns.length : 0} campaigns</td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="openCampaignModalForBrand(${b.id})">Create Campaign</button>
            </td>
        </tr>
    `).join('');
}

// Generic Table Render
function renderSpecificTable(data, tbodyId) {
    const tbody = document.getElementById(tbodyId);
    if(!tbody) return;
    if (data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:20px;">No Data Found</td></tr>`;
        return;
    }
    tbody.innerHTML = data.map(b => `
        <tr data-id="${b.id}">
            <td><strong>${b.name}</strong></td>
            <td>${b.poc || '-'}</td>
            <td>${b.email || '-'}</td>
            <td>${b.budget || '-'}</td>
            <td><span class="status-badge ${b.status === 'Hot Brands' ? 'hot' : 'warm'}">${b.status}</span></td>
            <td>
                <button class="action-btn edit" onclick="editBrand(${b.id})"><i class="fas fa-edit"></i></button>
                <button class="action-btn delete" onclick="deleteBrand(${b.id})"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
    `).join('');
}

// Render Campaigns Lists
function renderAllCampaignsList() { renderCampaignList(campaigns, 'all-campaigns-list'); }
function renderRunningCampaignsList() { renderCampaignList(campaigns.filter(c => c.status === 'Running'), 'running-campaigns-list'); }
function renderLiveCampaignsList() { 
    // Filter campaigns where at least one creator is Live
    const liveCamps = campaigns.filter(c => {
        return campaignCreators.some(cc => cc.campaignId === c.id && cc.contentStatus === 'Live');
    });
    renderCampaignList(liveCamps, 'live-campaigns-list');
}

function renderCampaignList(list, containerId) {
    const container = document.getElementById(containerId);
    if(!container) return;
    if(list.length === 0) {
        container.innerHTML = `<div class="empty-state"><i class="fas fa-bullhorn"></i><p>No campaigns found</p></div>`;
        return;
    }
    container.innerHTML = list.map(c => `
        <div class="campaign-card-large">
            <div class="campaign-card-header">
                <h3>${c.name} <span class="status-badge ${c.status.toLowerCase()}">${c.status}</span></h3>
                <p>${c.brandName} • ${c.platform}</p>
            </div>
            <div class="campaign-card-footer" style="justify-content:flex-end;">
                <button class="btn btn-sm btn-primary" onclick="viewCampaignDetail(${c.id})">Manage Creators <i class="fas fa-arrow-right"></i></button>
            </div>
        </div>
    `).join('');
}

// View Campaign Detail (The Big View)
window.viewCampaignDetail = function(cId) {
    currentCampaignId = cId;
    const camp = campaigns.find(c => c.id === cId);
    if(!camp) return;

    document.getElementById('cd-title').innerText = camp.name;
    document.getElementById('cd-subtitle').innerText = camp.brandName;
    document.getElementById('cinfo-platform').innerText = camp.platform;
    document.getElementById('cinfo-budget').innerText = camp.budget || 'N/A';
    document.getElementById('cinfo-created').innerText = new Date(camp.createdAt).toLocaleDateString();

    // Render Stats
    updateCampaignStats(cId);
    // Render Creators List
    renderCampaignCreatorsList(cId);
    
    switchView('campaign-detail');
}

function renderCampaignCreatorsList(cId) {
    const list = document.getElementById('campaign-creators-list');
    const creatorsInCamp = campaignCreators.filter(cc => cc.campaignId === cId);
    
    if(creatorsInCamp.length === 0) {
        list.innerHTML = `<div class="empty-state"><p>No creators in this campaign yet.</p></div>`;
        return;
    }

    list.innerHTML = creatorsInCamp.map(cc => `
        <div class="campaign-creator-card">
            <div class="campaign-creator-header">
                <div class="campaign-creator-info">
                    <h4>${cc.name}</h4>
                    <p><a href="${cc.profileLink}" target="_blank">${cc.handle}</a></p>
                </div>
                <div class="campaign-creator-status" style="text-align:right;">
                    <select class="status-dropdown" onchange="updateCreatorStatus(${cc.id}, this.value)">
                        ${CONTENT_STATUS_OPTIONS.map(s => `<option value="${s}" ${s === cc.contentStatus ? 'selected' : ''}>${s}</option>`).join('')}
                    </select>
                    ${cc.contentStatus === 'Revision' ? `<div class="revision-counter">Revisions: ${cc.revisions || 0}</div>` : ''}
                </div>
            </div>
            
            <div class="campaign-creator-body">
                <div class="creator-links">
                    <strong>Content Links:</strong><br>
                    Drive: ${cc.driveLink ? `<a href="${cc.driveLink}" target="_blank">View</a>` : 'N/A'} <br>
                    Live: ${cc.liveLink ? `<a href="${cc.liveLink}" target="_blank">View Post</a>` : 'N/A'}
                </div>
                <div class="creator-deliverables">
                    <strong>Deliverables:</strong> ${cc.deliverables ? cc.deliverables.join(', ') : 'None'}
                </div>
            </div>

            <div class="campaign-creator-footer" style="margin-top:10px; border-top:1px solid #eee; padding-top:10px;">
                <button class="btn-sm" onclick="editCampaignCreator(${cc.id})">Edit Details</button>
                <button class="btn-sm btn-danger" onclick="removeCreatorFromCampaign(${cc.id})">Remove</button>
            </div>
        </div>
    `).join('');
}

window.updateCreatorStatus = function(ccId, newStatus) {
    const cc = campaignCreators.find(x => x.id === ccId);
    if(cc) {
        if(newStatus === 'Revision') cc.revisions = (cc.revisions || 0) + 1;
        cc.contentStatus = newStatus;
        saveData();
        updateCampaignStats(currentCampaignId);
        renderCampaignCreatorsList(currentCampaignId); // Re-render to show revisions
    }
}

function updateCampaignStats(cId) {
    const creatorsInCamp = campaignCreators.filter(cc => cc.campaignId === cId);
    document.getElementById('cstat-total').innerText = creatorsInCamp.length;
    document.getElementById('cstat-live').innerText = creatorsInCamp.filter(c => c.contentStatus === 'Live').length;
    document.getElementById('cstat-pending').innerText = creatorsInCamp.filter(c => c.contentStatus === 'Pending').length;
    document.getElementById('cstat-revision').innerText = creatorsInCamp.filter(c => c.contentStatus === 'Revision').length;
    document.getElementById('cstat-approved').innerText = creatorsInCamp.filter(c => c.contentStatus === 'Good to Go').length;
    document.getElementById('cstat-dropout').innerText = creatorsInCamp.filter(c => c.contentStatus === 'Dropout').length;
}
// ========================================
// 7. TASKS & TEAM
// ========================================

function renderMyTasks() {
    const user = getCurrentUser();
    const myTasks = tasks.filter(t => t.assignedTo === user.name);
    
    // Sort columns
    renderTaskList('tasks-todo', myTasks.filter(t => t.status === 'To Do'));
    renderTaskList('tasks-progress', myTasks.filter(t => t.status === 'In Progress'));
    renderTaskList('tasks-completed', myTasks.filter(t => t.status === 'Completed'));
    
    // Update Counts
    document.getElementById('count-todo').innerText = myTasks.filter(t => t.status === 'To Do').length;
    document.getElementById('count-progress').innerText = myTasks.filter(t => t.status === 'In Progress').length;
    document.getElementById('count-completed').innerText = myTasks.filter(t => t.status === 'Completed').length;
}

function renderTaskList(id, list) {
    const container = document.getElementById(id);
    if(!container) return;
    container.innerHTML = list.map(t => `
        <div class="task-card">
            <h4>${t.title}</h4>
            <p>${t.description || ''}</p>
            <div style="font-size:0.8rem; color:#666;">Due: ${t.dueDate || 'No Date'}</div>
            <select class="task-status-select" onchange="updateTaskStatus(${t.id}, this.value)" style="margin-top:5px;">
                <option value="To Do" ${t.status === 'To Do' ? 'selected' : ''}>To Do</option>
                <option value="In Progress" ${t.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
                <option value="Completed" ${t.status === 'Completed' ? 'selected' : ''}>Completed</option>
            </select>
        </div>
    `).join('');
}

window.updateTaskStatus = function(tId, status) {
    const t = tasks.find(x => x.id === tId);
    if(t) {
        t.status = status;
        saveData();
        renderMyTasks();
    }
}

// Team Management
function renderManageTeamTable() {
    const tbody = document.getElementById('tbody-team');
    const users = getUsers();
    if(!tbody) return;
    
    tbody.innerHTML = users.map(u => `
        <tr>
            <td>${u.name}</td>
            <td>${u.role}</td>
            <td>${u.active ? 'Active' : 'Inactive'}</td>
            <td>
                <button class="btn-sm btn-danger" onclick="deleteUser(${u.id})">Remove</button>
            </td>
        </tr>
    `).join('');
}
// ========================================
// 8. MODALS & FORMS
// ========================================

function setupAllModals() {
    // Open Actions
    document.getElementById('add-brand-btn')?.addEventListener('click', () => openModal('brand-modal'));
    document.getElementById('add-task-btn')?.addEventListener('click', () => openModal('task-modal'));
    document.getElementById('add-creator-db-btn')?.addEventListener('click', () => openModal('creator-modal'));
    document.getElementById('add-member-btn')?.addEventListener('click', () => openModal('member-modal'));
    document.getElementById('bulk-upload-btn')?.addEventListener('click', () => openModal('bulk-upload-modal'));
    document.getElementById('export-selected-btn')?.addEventListener('click', () => {
        // Populate Campaign Select for Export
        const select = document.getElementById('export-campaign-select');
        select.innerHTML = campaigns.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
        openModal('export-modal');
    });
    
    document.getElementById('add-creator-to-campaign-btn')?.addEventListener('click', () => {
        // Populate Creators for Selection
        const select = document.getElementById('cc-select-creator');
        select.innerHTML = '<option value="">-- Select --</option>' + creators.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
        openModal('creator-campaign-modal');
    });

    // Close Actions
    document.querySelectorAll('.modal-close, .btn-secondary').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal-overlay');
            if(modal) modal.classList.remove('active');
        });
    });

    // Form Submissions
    document.getElementById('brand-form')?.addEventListener('submit', (e) => {
        e.preventDefault();
        brands.push({
            id: Date.now(),
            name: document.getElementById('b-name').value,
            poc: document.getElementById('b-poc').value,
            email: document.getElementById('b-email').value,
            budget: document.getElementById('b-budget').value,
            status: document.getElementById('b-status').value
        });
        saveData();
        closeModal('brand-modal');
        renderAllViews();
        showToast('Brand Added');
    });

    document.getElementById('campaign-form')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const bId = document.getElementById('cp-brand').value;
        const brand = brands.find(b => b.id == bId);
        campaigns.push({
            id: Date.now(),
            name: document.getElementById('cp-name').value,
            brandId: parseInt(bId),
            brandName: brand ? brand.name : 'Unknown',
            platform: document.getElementById('cp-platform').value,
            status: document.getElementById('cp-status').value,
            createdAt: new Date().toISOString()
        });
        saveData();
        closeModal('campaign-modal');
        renderAllViews();
        showToast('Campaign Created');
    });

    document.getElementById('creator-campaign-form')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const cId = document.getElementById('cc-select-creator').value;
        const creator = creators.find(c => c.id == cId);
        
        if(creator) {
            campaignCreators.push({
                id: Date.now(),
                campaignId: currentCampaignId,
                creatorId: creator.id,
                name: creator.name,
                handle: creator.handle || creator.username,
                profileLink: creator.profileLink || creator.link,
                followers: creator.followers,
                contentStatus: document.getElementById('cc-content-status').value,
                driveLink: document.getElementById('cc-drive-link').value,
                liveLink: document.getElementById('cc-live-link').value,
                commercial: document.getElementById('cc-creator-commercial').value,
                revisions: 0
            });
            saveData();
            closeModal('creator-campaign-modal');
            viewCampaignDetail(currentCampaignId); // Refresh View
            showToast('Creator Added to Campaign');
        }
    });
}

window.openCampaignModalForBrand = function(brandId) {
    const brand = brands.find(b => b.id === brandId);
    const select = document.getElementById('cp-brand');
    select.innerHTML = `<option value="${brand.id}">${brand.name}</option>`;
    select.disabled = true;
    openModal('campaign-modal');
}

// Helper Functions
function openModal(id) { document.getElementById(id).classList.add('active'); }
function closeModal(id) { document.getElementById(id).classList.remove('active'); }
function showToast(msg, type='success') { 
    const t = document.getElementById('toast'); 
    document.getElementById('toast-message').innerText = msg; 
    t.className = `toast ${type} show`; 
    setTimeout(() => t.classList.remove('show'), 3000); 
}

function updateAnalytics() {
    document.getElementById('stat-total').innerText = brands.length;
    document.getElementById('stat-hot').innerText = brands.filter(b => b.status === 'Hot Brands').length;
    document.getElementById('stat-campaigns').innerText = campaigns.length;
    document.getElementById('stat-creators').innerText = creators.length;
}
