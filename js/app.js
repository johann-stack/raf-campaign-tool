// ========================================
// Aflog Campaign Management System
// Main Application JavaScript v2.1 (Full Feature Set)
// ========================================

// ========================================
// 1. DATA STORE & CONFIG
// ========================================
let brands = JSON.parse(localStorage.getItem('aflog_brands')) || [];
let campaigns = JSON.parse(localStorage.getItem('aflog_campaigns')) || [];
let creators = JSON.parse(localStorage.getItem('aflog_creators')) || [];
let campaignCreators = JSON.parse(localStorage.getItem('aflog_campaign_creators')) || [];
let tasks = JSON.parse(localStorage.getItem('aflog_tasks')) || [];
let activities = JSON.parse(localStorage.getItem('aflog_activities')) || [];
let airtableConfig = JSON.parse(localStorage.getItem('aflog_airtable')) || null;

// New: Creator Selection for Bulk Export
let selectedCreators = new Set(); 

// Current view state
let currentBrandId = null;
let currentCampaignId = null;
let editingBrandId = null;
let editingCampaignId = null;
let editingCreatorId = null;
let editingCampaignCreatorId = null;
let editingTaskId = null;
let editingMemberId = null;
let confirmCallback = null;

// ========================================
// 2. CONSTANTS (Niches, Statuses)
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

const STATUS_MAP = {
    'Hot Brands': 'hot',
    'Warm Brands': 'warm',
    'Lost Brands': 'lost',
    'Converted to Campaign': 'converted',
    'Campaign Running': 'running',
    'Campaign Live': 'live',
    'Invoice Stage': 'invoice'
};

const BRAND_STATUS_OPTIONS = ['Hot Brands', 'Warm Brands', 'Lost Brands', 'Converted to Campaign'];
const CAMPAIGN_STATUS_OPTIONS = ['Planning', 'Running', 'Completed', 'Invoice Pending'];
const CONTENT_STATUS_OPTIONS = ['Pending', 'Received', 'Revision', 'Good to Go', 'Live', 'Dropout'];

// ========================================
// 3. CORE FUNCTIONS (User, Save, Init)
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
    setupModals(); // Consolidates all modal setup
    setupSearch();
    setupCreatorFilters();
    populateDropdowns();
    renderAllViews();
    updateAnalytics();
    
    // User Display
    document.getElementById('current-user').textContent = localStorage.getItem('aflog_user_name');
    document.getElementById('current-role').textContent = localStorage.getItem('aflog_user_role');
    
    // Niche Dropdown Init
    populateNicheDropdown();
}

function saveData() {
    localStorage.setItem('aflog_brands', JSON.stringify(brands));
    localStorage.setItem('aflog_campaigns', JSON.stringify(campaigns));
    localStorage.setItem('aflog_creators', JSON.stringify(creators));
    localStorage.setItem('aflog_campaign_creators', JSON.stringify(campaignCreators));
    localStorage.setItem('aflog_tasks', JSON.stringify(tasks));
    localStorage.setItem('aflog_activities', JSON.stringify(activities));
}

function getUsers() { return JSON.parse(localStorage.getItem('aflog_users')) || []; }
function saveUsers(users) { localStorage.setItem('aflog_users', JSON.stringify(users)); }
function isAdmin() { return localStorage.getItem('aflog_user_role') === 'admin'; }
function getCurrentUser() {
    return {
        name: localStorage.getItem('aflog_user_name'),
        email: localStorage.getItem('aflog_user_email'),
        role: localStorage.getItem('aflog_user_role')
    };
}

// New Helper: Calculate Category based on followers
function calculateCategory(followersInput) {
    // Handle "500K", "1M" or raw numbers
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
            
            // Restricted Access Logic
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
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    
    const viewEl = document.getElementById(`view-${viewId}`);
    if (viewEl) viewEl.classList.add('active');
    
    // Highlight nav item
    const navItem = document.querySelector(`.nav-item[data-view="${viewId}"]`);
    if (navItem) navItem.classList.add('active');

    // Trigger Specific Renders
    if (viewId === 'creators') renderCreatorsGrid();
    if (viewId === 'campaigns') renderAllCampaignsList();
    if (viewId === 'brands') renderBrandsTable(brands);
}
// ========================================
// 5. CREATOR DATABASE LOGIC (New)
// ========================================

// Auto-populate Niche Dropdown
function populateNicheDropdown() {
    const select = document.getElementById('c-niche');
    const filter = document.getElementById('filter-niche');
    if(!select) return;
    
    const options = Object.keys(NICHES).map(n => `<option value="${n}">${n}</option>`).join('');
    select.innerHTML = `<option value="">Select Niche</option>${options}`;
    filter.innerHTML = `<option value="">All Niches</option>${options}`;
}

// Cascade Sub-niches
window.updateSubniches = function() {
    const niche = document.getElementById('c-niche').value;
    const subSelect = document.getElementById('c-subniche');
    if (!niche || !NICHES[niche]) {
        subSelect.innerHTML = '<option value="">Select Niche First</option>';
        return;
    }
    subSelect.innerHTML = NICHES[niche].map(s => `<option value="${s}">${s}</option>`).join('');
}

// Auto update category field in modal
window.autoUpdateCategory = function(val) {
    document.getElementById('c-category').value = calculateCategory(val);
}

// CSV Bulk Upload Logic
window.processCSV = function() {
    const fileInput = document.getElementById('csv-file-input');
    const file = fileInput.files[0];
    if (!file) return showToast('Please select a file', 'error');

    const reader = new FileReader();
    reader.onload = function(e) {
        const text = e.target.result;
        const rows = text.split('\n').slice(1); // Skip header
        let count = 0;
        
        rows.forEach(row => {
            const cols = row.split(','); // Simple split, assumes no commas in fields
            if (cols.length < 4) return;
            
            // Map columns (Name, Link, Username, Followers, Niche, Subniche, Cat, State, City, Contact, Email, Gender)
            const followers = cols[3]?.trim() || 0;
            const newCreator = {
                id: Date.now() + Math.random(),
                name: cols[0]?.trim(),
                profileLink: cols[1]?.trim(),
                handle: cols[2]?.trim(),
                followers: followers,
                niche: cols[4]?.trim(),
                subniche: cols[5]?.trim(),
                category: calculateCategory(followers), // Auto Calc
                state: cols[7]?.trim(),
                city: cols[8]?.trim(),
                contact: cols[9]?.trim(),
                email: cols[10]?.trim(),
                gender: cols[11]?.trim(),
                platform: cols[1]?.includes('youtube') ? 'YouTube' : 'Instagram',
                createdAt: new Date().toISOString()
            };
            creators.push(newCreator);
            count++;
        });
        
        saveData();
        renderCreatorsGrid();
        closeModal('bulk-upload-modal');
        showToast(`Successfully imported ${count} creators!`);
    };
    reader.readAsText(file);
}

// Bookmark & Export Logic
window.toggleCreatorSelection = function(id, isChecked) {
    if (isChecked) selectedCreators.add(id);
    else selectedCreators.delete(id);
    
    // Show/Hide Export Button
    const btn = document.getElementById('export-selected-btn');
    if(btn) btn.style.display = selectedCreators.size > 0 ? 'inline-block' : 'none';
}

window.processExport = function() {
    const campaignId = document.getElementById('export-campaign-select').value;
    if (!campaignId) return showToast('Please select a campaign', 'error');

    let count = 0;
    selectedCreators.forEach(cId => {
        const creator = creators.find(c => c.id === cId);
        if(creator) {
            // Check if already in campaign
            const exists = campaignCreators.find(cc => cc.campaignId == campaignId && cc.creatorId == cId);
            if(!exists) {
                campaignCreators.push({
                    id: Date.now() + Math.random(),
                    campaignId: parseInt(campaignId),
                    creatorId: creator.id,
                    name: creator.name,
                    handle: creator.handle,
                    profileLink: creator.profileLink,
                    followers: creator.followers,
                    contentStatus: 'Pending',
                    deliverables: [],
                    revisions: 0,
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

function setupCreatorFilters() {
    const inputs = ['filter-niche', 'filter-category', 'filter-creator-search'];
    inputs.forEach(id => {
        document.getElementById(id)?.addEventListener('input', renderCreatorsGrid);
    });
}
// ========================================
// 6. RENDER FUNCTIONS (Dashboard, Tables, Grids)
// ========================================

function renderAllViews() {
    renderDashboard();
    renderBrandsTable(brands);
    renderHotTable(brands.filter(b => b.status === 'Hot Brands'));
    renderWarmTable(brands.filter(b => b.status === 'Warm Brands'));
    renderLostTable(brands.filter(b => b.status === 'Lost Brands'));
    renderConvertedTable(brands.filter(b => b.status === 'Converted to Campaign'));
    renderAllCampaignsList();
    renderRunningCampaignsList();
    renderLiveCampaignsList();
    renderInvoiceTable();
    renderCreatorsGrid();
    renderTeamGrid();
    renderManageTeamTable();
    renderMyTasks();
    updateBadges();
}

// Creators Grid (With Checkboxes for Export)
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
                    <a href="${c.profileLink}" target="_blank">${c.handle}</a>
                </div>
            </div>
            <div class="creator-stats" style="margin-top:15px;">
                <div class="creator-stat"><div class="value">${parseInt(c.followers).toLocaleString()}</div><div class="label">Followers</div></div>
                <div class="creator-stat"><div class="value">${c.gender || '-'}</div><div class="label">Gender</div></div>
            </div>
            <div style="text-align:center; font-size:0.8rem; color:var(--text-secondary); margin-top:10px;">
                ${c.niche} ${c.subniche ? '> ' + c.subniche : ''}
            </div>
            <div class="creator-card-footer">
                <span>${c.city || ''}</span>
                <div class="action-btns">
                    <button class="action-btn edit" onclick="editCreator(${c.id})"><i class="fas fa-edit"></i></button>
                    <button class="action-btn delete" onclick="deleteCreator(${c.id})"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        </div>
    `).join('');
}

// Campaign List Renders
function renderAllCampaignsList() {
    const container = document.getElementById('all-campaigns-list');
    if(!container) return;
    if(campaigns.length === 0) return container.innerHTML = getEmptyState('bullhorn', 'No Campaigns', 'Create one from Converted Brands');
    
    container.innerHTML = campaigns.map(c => renderCampaignCard(c)).join('');
}

function renderRunningCampaignsList() {
    const container = document.getElementById('running-campaigns-list');
    if(!container) return;
    const filtered = campaigns.filter(c => c.status === 'Running');
    if(filtered.length === 0) return container.innerHTML = getEmptyState('play-circle', 'No Running Campaigns', '');
    container.innerHTML = filtered.map(c => renderCampaignCard(c)).join('');
}

function renderLiveCampaignsList() {
    const container = document.getElementById('live-campaigns-list');
    if(!container) return;
    // Campaigns with at least one "Live" creator
    const filtered = campaigns.filter(c => {
        const creatorsInCamp = campaignCreators.filter(cc => cc.campaignId === c.id);
        return creatorsInCamp.some(cc => cc.contentStatus === 'Live');
    });
    if(filtered.length === 0) return container.innerHTML = getEmptyState('broadcast-tower', 'No Live Campaigns', '');
    container.innerHTML = filtered.map(c => renderCampaignCard(c)).join('');
}

function renderCampaignCard(c) {
    const stats = getCampaignStats(c.id);
    return `
        <div class="campaign-card-large">
            <div class="campaign-card-header">
                <div class="campaign-card-info">
                    <h3>${c.name} <span class="status-badge ${c.status.toLowerCase()}">${c.status}</span></h3>
                    <p>${c.brandName} • ${c.platform}</p>
                </div>
                <div class="action-btns">
                    <button class="action-btn view" onclick="viewCampaignDetail(${c.id})"><i class="fas fa-eye"></i></button>
                    <button class="action-btn edit" onclick="editCampaign(${c.id})"><i class="fas fa-edit"></i></button>
                </div>
            </div>
            <div class="campaign-card-stats">
                <div class="campaign-mini-stat"><div class="value">${stats.total}</div><div class="label">Creators</div></div>
                <div class="campaign-mini-stat"><div class="value" style="color:var(--success)">${stats.live}</div><div class="label">Live</div></div>
                <div class="campaign-mini-stat"><div class="value" style="color:var(--warning)">${stats.pending}</div><div class="label">Pending</div></div>
            </div>
            <div class="campaign-card-footer">
                <button class="btn btn-sm btn-primary" onclick="viewCampaignDetail(${c.id})">Manage Creators <i class="fas fa-arrow-right"></i></button>
            </div>
        </div>
    `;
}

function getCampaignStats(cId) {
    const list = campaignCreators.filter(cc => cc.campaignId === cId);
    return {
        total: list.length,
        live: list.filter(cc => cc.contentStatus === 'Live').length,
        pending: list.filter(cc => cc.contentStatus === 'Pending' || cc.contentStatus === 'Received').length
    };
}

// Brand Table Renders
function renderBrandsTable(data) {
    const tbody = document.getElementById('tbody-brands');
    if(!tbody) return;
    tbody.innerHTML = data.map(b => `
        <tr data-id="${b.id}">
            <td><strong>${b.name}</strong></td>
            <td>${b.poc || '-'}</td>
            <td>${b.budget || '-'}</td>
            <td><span class="status-badge ${b.status === 'Hot Brands' ? 'hot' : 'warm'}">${b.status}</span></td>
            <td>
                <button class="action-btn edit" onclick="editBrand(${b.id})"><i class="fas fa-edit"></i></button>
                <button class="action-btn delete" onclick="deleteBrand(${b.id})"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
    `).join('');
}

// Converted Table (Specific for Creating Campaigns)
function renderConvertedTable(data) {
    const tbody = document.getElementById('tbody-converted');
    if(!tbody) return;
    tbody.innerHTML = data.map(b => `
        <tr data-id="${b.id}">
            <td><strong>${b.name}</strong></td>
            <td>${b.budget || '-'}</td>
            <td>${b.campaignName || 'Not Set'}</td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="openCampaignModalForBrand(${b.id})">Create Campaign</button>
            </td>
        </tr>
    `).join('');
}

// Tables for Hot/Warm/Lost (Simplified for space, assuming renderBrandsTable structure)
function renderHotTable(d) { renderSimpleBrandTable('tbody-hot', d); }
function renderWarmTable(d) { renderSimpleBrandTable('tbody-warm', d); }
function renderLostTable(d) { renderSimpleBrandTable('tbody-lost', d); }

function renderSimpleBrandTable(id, data) {
    const tbody = document.getElementById(id);
    if(!tbody) return;
    tbody.innerHTML = data.map(b => `
        <tr>
            <td><span class="status-badge ${b.status.includes('Hot') ? 'hot' : b.status.includes('Lost') ? 'lost' : 'warm'}">${b.status}</span></td>
            <td><strong>${b.name}</strong></td>
            <td>${b.poc || '-'}</td>
            <td>${b.budget || '-'}</td>
            <td>
                <button class="action-btn edit" onclick="editBrand(${b.id})"><i class="fas fa-edit"></i></button>
            </td>
        </tr>
    `).join('');
}

function getEmptyState(icon, title, text) {
    return `<div class="empty-state"><i class="fas fa-${icon}"></i><h3>${title}</h3><p>${text}</p></div>`;
}
// ========================================
// 7. MODAL ACTIONS & EVENT LISTENERS
// ========================================

function setupModals() {
    // Open Buttons
    document.getElementById('add-brand-btn')?.addEventListener('click', () => openModal('brand-modal'));
    document.getElementById('add-task-btn')?.addEventListener('click', () => openModal('task-modal'));
    document.getElementById('add-creator-db-btn')?.addEventListener('click', () => openModal('creator-modal'));
    document.getElementById('add-member-btn')?.addEventListener('click', () => openModal('member-modal'));
    document.getElementById('bulk-upload-btn')?.addEventListener('click', () => openModal('bulk-upload-modal'));
    document.getElementById('export-selected-btn')?.addEventListener('click', () => {
        const select = document.getElementById('export-campaign-select');
        select.innerHTML = campaigns.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
        openModal('export-modal');
    });

    // Close Buttons
    document.querySelectorAll('.modal-close, .btn-secondary').forEach(btn => {
        btn.addEventListener('click', (e) => {
            if(e.target.closest('.modal-overlay')) closeModal(e.target.closest('.modal-overlay').id);
        });
    });

    // Form Submits
    document.getElementById('creator-form')?.addEventListener('submit', handleCreatorSubmit);
    document.getElementById('brand-form')?.addEventListener('submit', handleBrandSubmit);
    document.getElementById('campaign-form')?.addEventListener('submit', handleCampaignSubmit);
}

// Brand Form
function handleBrandSubmit(e) {
    e.preventDefault();
    const newBrand = {
        id: Date.now(),
        name: document.getElementById('b-name').value,
        poc: document.getElementById('b-poc').value,
        email: document.getElementById('b-email').value,
        budget: document.getElementById('b-budget').value,
        status: document.getElementById('b-status').value,
        createdAt: new Date().toISOString()
    };
    brands.push(newBrand);
    saveData();
    closeModal('brand-modal');
    renderAllViews();
    showToast('Brand Added Successfully');
}

// Creator Form
function handleCreatorSubmit(e) {
    e.preventDefault();
    const followers = document.getElementById('c-followers').value;
    const newCreator = {
        id: Date.now(),
        name: document.getElementById('c-name').value,
        handle: document.getElementById('c-username').value,
        profileLink: document.getElementById('c-link').value,
        followers: followers,
        niche: document.getElementById('c-niche').value,
        subniche: document.getElementById('c-subniche').value,
        category: calculateCategory(followers),
        gender: document.getElementById('c-gender').value,
        state: document.getElementById('c-state').value,
        city: document.getElementById('c-city').value,
        contact: document.getElementById('c-contact').value,
        email: document.getElementById('c-email').value
    };
    creators.push(newCreator);
    saveData();
    closeModal('creator-modal');
    renderCreatorsGrid();
    showToast('Creator Added Successfully');
}

// Campaign Form
function handleCampaignSubmit(e) {
    e.preventDefault();
    const brandId = document.getElementById('cp-brand').value;
    const brand = brands.find(b => b.id == brandId);
    
    const newCampaign = {
        id: Date.now(),
        name: document.getElementById('cp-name').value,
        brandId: parseInt(brandId),
        brandName: brand ? brand.name : 'Unknown',
        platform: document.getElementById('cp-platform').value,
        status: document.getElementById('cp-status').value,
        createdAt: new Date().toISOString()
    };
    campaigns.push(newCampaign);
    saveData();
    closeModal('campaign-modal');
    renderAllViews();
    showToast('Campaign Created');
}

// Specific Action: Open Campaign Modal for a specific Brand
window.openCampaignModalForBrand = function(brandId) {
    const brand = brands.find(b => b.id === brandId);
    const select = document.getElementById('cp-brand');
    select.innerHTML = `<option value="${brand.id}">${brand.name}</option>`;
    select.disabled = true; // Lock it
    openModal('campaign-modal');
}

// Helper Functions
function openModal(id) { document.getElementById(id).classList.add('active'); }
function closeModal(id) { document.getElementById(id).classList.remove('active'); }

function showToast(msg, type='success') {
    const t = document.getElementById('toast');
    const m = document.getElementById('toast-msg');
    m.innerText = msg;
    t.className = `toast ${type} show`;
    setTimeout(() => t.classList.remove('show'), 3000);
}

// Populate Generic Dropdowns
function populateDropdowns() {
    // Populate Brands in Campaign Form (if not locked)
    const campBrandSelect = document.getElementById('cp-brand');
    if(campBrandSelect && !campBrandSelect.disabled) {
        campBrandSelect.innerHTML = brands.map(b => `<option value="${b.id}">${b.name}</option>`).join('');
    }
}

// Dashboard Stats Update
function updateAnalytics() {
    document.getElementById('stat-total').innerText = brands.length;
    document.getElementById('stat-hot').innerText = brands.filter(b => b.status === 'Hot Brands').length;
    document.getElementById('stat-campaigns').innerText = campaigns.length;
    document.getElementById('stat-creators').innerText = creators.length;
}

// Update Sidebar Badges
function updateBadges() {
    document.getElementById('badge-brands').innerText = brands.length;
    document.getElementById('badge-hot').innerText = brands.filter(b => b.status === 'Hot Brands').length;
    document.getElementById('badge-warm').innerText = brands.filter(b => b.status === 'Warm Brands').length;
    document.getElementById('badge-lost').innerText = brands.filter(b => b.status === 'Lost Brands').length;
    document.getElementById('badge-campaigns').innerText = campaigns.length;
    document.getElementById('badge-running').innerText = campaigns.filter(c => c.status === 'Running').length;
    document.getElementById('badge-live').innerText = campaigns.filter(c => {
        const stats = getCampaignStats(c.id);
        return stats.live > 0;
    }).length;
}
