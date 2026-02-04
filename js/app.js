// ========================================
// Aflog Campaign Management System
// Main Application JavaScript v2.0
// ========================================

// ========================================
// Data Store
// ========================================
let brands = JSON.parse(localStorage.getItem('aflog_brands')) || [];
let campaigns = JSON.parse(localStorage.getItem('aflog_campaigns')) || [];
let creators = JSON.parse(localStorage.getItem('aflog_creators')) || [];
let campaignCreators = JSON.parse(localStorage.getItem('aflog_campaign_creators')) || [];
let tasks = JSON.parse(localStorage.getItem('aflog_tasks')) || [];
let activities = JSON.parse(localStorage.getItem('aflog_activities')) || [];
let airtableConfig = JSON.parse(localStorage.getItem('aflog_airtable')) || null;

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
// User Functions
// ========================================
function getUsers() {
    return JSON.parse(localStorage.getItem('aflog_users')) || [];
}

function saveUsers(users) {
    localStorage.setItem('aflog_users', JSON.stringify(users));
}

function getCurrentUser() {
    const email = localStorage.getItem('aflog_user_email') || sessionStorage.getItem('aflog_user_email');
    const name = localStorage.getItem('aflog_user_name') || sessionStorage.getItem('aflog_user_name');
    const role = localStorage.getItem('aflog_user_role') || sessionStorage.getItem('aflog_user_role');
    const id = localStorage.getItem('aflog_user_id') || sessionStorage.getItem('aflog_user_id');
    
    return { email, name, role, id };
}

function isAdmin() {
    const role = localStorage.getItem('aflog_user_role') || sessionStorage.getItem('aflog_user_role');
    return role === 'admin' || role === 'Admin';
}

function getTeamMembers() {
    const users = getUsers();
    return users.filter(u => u.active !== false);
}

// ========================================
// Constants
// ========================================
const STATUS_MAP = {
    'Hot Brands': 'hot',
    'Warm Brands': 'warm',
    'Lost Brands': 'lost',
    'Converted to Campaign': 'converted',
    'Campaign Running': 'running',
    'Campaign Live': 'live',
    'Invoice Stage': 'invoice'
};

const BRAND_STATUS_OPTIONS = [
    'Hot Brands',
    'Warm Brands',
    'Lost Brands',
    'Converted to Campaign'
];

const CAMPAIGN_STATUS_OPTIONS = [
    'Planning',
    'Running',
    'Completed',
    'Invoice Pending'
];

const CONTENT_STATUS_OPTIONS = [
    'Pending',
    'Received',
    'Revision',
    'Good to Go',
    'Live',
    'Dropout'
];

const INSTAGRAM_DELIVERABLES = [
    'Collab Reel',
    'Non-Collab Reel',
    'Collab Reel + Story',
    'Story',
    'Store Visit Reel',
    'Static Post',
    'Carousel Post'
];

const YOUTUBE_DELIVERABLES = [
    'YT Shorts',
    'YT Dedicated Video',
    'YT Integrated Video',
    'YT Community Post'
];

const NICHE_OPTIONS = [
    'Fashion',
    'Tech',
    'Lifestyle',
    'Food',
    'Travel',
    'Fitness',
    'Beauty',
    'Gaming',
    'Education',
    'Entertainment',
    'Automotive',
    'Finance',
    'Parenting',
    'Sports',
    'Other'
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
    setupBrandModal();
    setupCampaignModal();
    setupCreatorDbModal();
    setupCreatorCampaignModal();
    setupTaskModal();
    setupMemberModal();
    setupAirtableModal();
    setupViewContentModal();
    setupConfirmModal();
    setupSearch();
    setupLogout();
    setupAdminFeatures();
    setupCreatorFilters();
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
// Save Data
// ========================================
function saveData() {
    localStorage.setItem('aflog_brands', JSON.stringify(brands));
    localStorage.setItem('aflog_campaigns', JSON.stringify(campaigns));
    localStorage.setItem('aflog_creators', JSON.stringify(creators));
    localStorage.setItem('aflog_campaign_creators', JSON.stringify(campaignCreators));
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
            
            if (viewId === 'manage-team' && !isAdmin()) {
                showToast('Access denied. Admin only.', 'error');
                return;
            }
            
            switchView(viewId);
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
        });
    });
    
    // Back buttons
    const backToBrands = document.getElementById('back-to-brands');
    if (backToBrands) {
        backToBrands.addEventListener('click', () => {
            switchView('brands');
            setActiveNav('brands');
        });
    }
    
    const backToBrandCampaigns = document.getElementById('back-to-brand-campaigns');
    if (backToBrandCampaigns) {
        backToBrandCampaigns.addEventListener('click', () => {
            if (currentBrandId) {
                viewBrandCampaigns(currentBrandId);
            } else {
                switchView('campaigns');
                setActiveNav('campaigns');
            }
        });
    }
    
    const backToTeam = document.getElementById('back-to-team');
    if (backToTeam) {
        backToTeam.addEventListener('click', () => {
            switchView('team');
            setActiveNav('team');
        });
    }
    
    // Add Campaign button
    const addCampaignBtn = document.getElementById('add-campaign-btn');
    if (addCampaignBtn) {
        addCampaignBtn.addEventListener('click', () => openCampaignModal());
    }
    
    // Add Creator to Campaign button
    const addCreatorToCampaignBtn = document.getElementById('add-creator-to-campaign-btn');
    if (addCreatorToCampaignBtn) {
        addCreatorToCampaignBtn.addEventListener('click', () => openCreatorCampaignModal());
    }
    
    // Edit Campaign button
    const editCampaignBtn = document.getElementById('edit-campaign-btn');
    if (editCampaignBtn) {
        editCampaignBtn.addEventListener('click', () => {
            if (currentCampaignId) {
                const campaign = campaigns.find(c => c.id === currentCampaignId);
                if (campaign) openCampaignModal(campaign);
            }
        });
    }
    
    // Add Creator to Database button
    const addCreatorDbBtn = document.getElementById('add-creator-db-btn');
    if (addCreatorDbBtn) {
        addCreatorDbBtn.addEventListener('click', () => openCreatorDbModal());
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

function setActiveNav(viewId) {
    const navItems = document.querySelectorAll('.nav-item[data-view]');
    navItems.forEach(nav => {
        nav.classList.remove('active');
        if (nav.dataset.view === viewId) nav.classList.add('active');
    });
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
        brand.pocEmail.toLowerCase().includes(query)
    );
    
    renderBrandsTable(filteredBrands);
    renderHotTable(filteredBrands.filter(b => b.status === 'Hot Brands'));
    renderWarmTable(filteredBrands.filter(b => b.status === 'Warm Brands'));
    renderLostTable(filteredBrands.filter(b => b.status === 'Lost Brands'));
    renderConvertedTable(filteredBrands.filter(b => b.status === 'Converted to Campaign'));
}

// ========================================
// Creator Filters
// ========================================
function setupCreatorFilters() {
    const filterPlatform = document.getElementById('filter-platform');
    const filterNiche = document.getElementById('filter-niche');
    const filterSearch = document.getElementById('filter-search');
    
    if (filterPlatform) {
        filterPlatform.addEventListener('change', () => renderCreatorsGrid());
    }
    if (filterNiche) {
        filterNiche.addEventListener('change', () => renderCreatorsGrid());
    }
    if (filterSearch) {
        filterSearch.addEventListener('input', () => renderCreatorsGrid());
    }
}

// ========================================
// Populate Dropdowns
// ========================================
function populateDropdowns() {
    const teamMembers = getTeamMembers();
    
    // Team member dropdowns
    const memberOptions = '<option value="">Select Team Member</option>' + 
        teamMembers.map(member => `<option value="${member.name}">${member.name}</option>`).join('');
    
    const aflogPoc = document.getElementById('aflog-poc');
    const campaignPoc = document.getElementById('campaign-poc');
    const taskAssignedTo = document.getElementById('task-assigned-to');
    
    if (aflogPoc) aflogPoc.innerHTML = memberOptions;
    if (campaignPoc) campaignPoc.innerHTML = memberOptions;
    if (taskAssignedTo) {
        const currentUser = getCurrentUser();
        taskAssignedTo.innerHTML = `<option value="${currentUser.name}">Myself (${currentUser.name})</option>` +
            teamMembers.filter(m => m.name !== currentUser.name)
                .map(member => `<option value="${member.name}">${member.name}</option>`).join('');
    }
    
    // Brand dropdown for tasks
    const taskBrand = document.getElementById('task-brand');
    if (taskBrand) {
        taskBrand.innerHTML = '<option value="">No brand selected</option>' +
            brands.map(brand => `<option value="${brand.id}">${brand.brandName}</option>`).join('');
    }
    
    // Creator dropdown for campaign
    const ccSelectCreator = document.getElementById('cc-select-creator');
    if (ccSelectCreator) {
        ccSelectCreator.innerHTML = '<option value="">-- Choose Existing Creator --</option>' +
            creators.map(creator => `<option value="${creator.id}">${creator.name} (${creator.handle})</option>`).join('');
    }
}
// ========================================
// Brand Modal
// ========================================
function setupBrandModal() {
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
        document.getElementById('brief-comments').value = brand.briefComments || '';
        document.getElementById('brand-tool').checked = brand.brandTool || false;
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
        briefComments: document.getElementById('brief-comments').value,
        brandTool: document.getElementById('brand-tool').checked,
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
// Campaign Modal
// ========================================
function setupCampaignModal() {
    const campaignModalOverlay = document.getElementById('campaign-modal-overlay');
    const campaignModalClose = document.getElementById('campaign-modal-close');
    const campaignCancelBtn = document.getElementById('campaign-cancel-btn');
    const campaignForm = document.getElementById('campaign-form');
    
    if (campaignModalClose) campaignModalClose.addEventListener('click', () => closeCampaignModal());
    if (campaignCancelBtn) campaignCancelBtn.addEventListener('click', () => closeCampaignModal());
    if (campaignModalOverlay) {
        campaignModalOverlay.addEventListener('click', (e) => {
            if (e.target === campaignModalOverlay) closeCampaignModal();
        });
    }
    if (campaignForm) campaignForm.addEventListener('submit', handleCampaignSubmit);
}

function openCampaignModal(campaign = null) {
    const campaignModalOverlay = document.getElementById('campaign-modal-overlay');
    editingCampaignId = campaign ? campaign.id : null;
    document.getElementById('campaign-modal-title').textContent = campaign ? 'Edit Campaign' : 'Add New Campaign';
    
    populateDropdowns();
    
    // Set brand ID
    document.getElementById('campaign-brand-id').value = currentBrandId || '';
    
    if (campaign) {
        document.getElementById('campaign-name').value = campaign.name || '';
        document.getElementById('campaign-platform').value = campaign.platform || '';
        document.getElementById('campaign-budget').value = campaign.budget || '';
        document.getElementById('campaign-start-date').value = campaign.startDate || '';
        document.getElementById('campaign-end-date').value = campaign.endDate || '';
        document.getElementById('campaign-status').value = campaign.status || 'Planning';
        document.getElementById('campaign-poc').value = campaign.poc || '';
        document.getElementById('campaign-notes').value = campaign.notes || '';
    } else {
        document.getElementById('campaign-form').reset();
        document.getElementById('campaign-brand-id').value = currentBrandId || '';
    }
    
    campaignModalOverlay.classList.add('active');
}

function closeCampaignModal() {
    const campaignModalOverlay = document.getElementById('campaign-modal-overlay');
    if (campaignModalOverlay) campaignModalOverlay.classList.remove('active');
    const campaignForm = document.getElementById('campaign-form');
    if (campaignForm) campaignForm.reset();
    editingCampaignId = null;
}

function handleCampaignSubmit(e) {
    e.preventDefault();
    
    const currentUser = getCurrentUser();
    const brandId = parseInt(document.getElementById('campaign-brand-id').value) || currentBrandId;
    const brand = brands.find(b => b.id === brandId);
    
    const campaignData = {
        id: editingCampaignId || Date.now(),
        brandId: brandId,
        brandName: brand ? brand.brandName : '',
        name: document.getElementById('campaign-name').value,
        platform: document.getElementById('campaign-platform').value,
        budget: document.getElementById('campaign-budget').value,
        startDate: document.getElementById('campaign-start-date').value,
        endDate: document.getElementById('campaign-end-date').value,
        status: document.getElementById('campaign-status').value,
        poc: document.getElementById('campaign-poc').value,
        notes: document.getElementById('campaign-notes').value,
        createdBy: editingCampaignId ? campaigns.find(c => c.id === editingCampaignId)?.createdBy : currentUser.name,
        createdAt: editingCampaignId ? campaigns.find(c => c.id === editingCampaignId)?.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    if (editingCampaignId) {
        const index = campaigns.findIndex(c => c.id === editingCampaignId);
        if (index !== -1) {
            campaigns[index] = campaignData;
            addActivity('campaign', `${currentUser.name} updated campaign: ${campaignData.name}`);
        }
    } else {
        campaigns.push(campaignData);
        addActivity('campaign', `${currentUser.name} created campaign: ${campaignData.name} for ${campaignData.brandName}`);
        
        // Update brand status if it's still in early stages
        if (brand && ['Hot Brands', 'Warm Brands'].includes(brand.status)) {
            brand.status = 'Converted to Campaign';
            saveData();
        }
    }
    
    saveData();
    renderAllViews();
    updateAnalytics();
    closeCampaignModal();
    
    // Refresh campaign detail view if we're on it
    if (currentCampaignId === editingCampaignId) {
        viewCampaignDetail(editingCampaignId);
    }
    
    // If we're on brand campaigns view, refresh it
    if (currentBrandId) {
        viewBrandCampaigns(currentBrandId);
    }
    
    showToast(editingCampaignId ? 'Campaign updated successfully!' : 'Campaign created successfully!');
}

// ========================================
// Creator Database Modal
// ========================================
function setupCreatorDbModal() {
    const creatorDbModalOverlay = document.getElementById('creator-db-modal-overlay');
    const creatorDbModalClose = document.getElementById('creator-db-modal-close');
    const creatorDbCancelBtn = document.getElementById('creator-db-cancel-btn');
    const creatorDbForm = document.getElementById('creator-db-form');
    
    if (creatorDbModalClose) creatorDbModalClose.addEventListener('click', () => closeCreatorDbModal());
    if (creatorDbCancelBtn) creatorDbCancelBtn.addEventListener('click', () => closeCreatorDbModal());
    if (creatorDbModalOverlay) {
        creatorDbModalOverlay.addEventListener('click', (e) => {
            if (e.target === creatorDbModalOverlay) closeCreatorDbModal();
        });
    }
    if (creatorDbForm) creatorDbForm.addEventListener('submit', handleCreatorDbSubmit);
}

function openCreatorDbModal(creator = null) {
    const creatorDbModalOverlay = document.getElementById('creator-db-modal-overlay');
    editingCreatorId = creator ? creator.id : null;
    document.getElementById('creator-db-modal-title').textContent = creator ? 'Edit Creator' : 'Add Creator to Database';
    
    if (creator) {
        document.getElementById('creator-name').value = creator.name || '';
        document.getElementById('creator-platform').value = creator.platform || '';
        document.getElementById('creator-handle').value = creator.handle || '';
        document.getElementById('creator-profile-link').value = creator.profileLink || '';
        document.getElementById('creator-followers').value = creator.followers || '';
        document.getElementById('creator-niche').value = creator.niche || '';
        document.getElementById('creator-contact').value = creator.contact || '';
        document.getElementById('creator-email').value = creator.email || '';
        document.getElementById('creator-avg-views').value = creator.avgViews || '';
        document.getElementById('creator-engagement').value = creator.engagement || '';
        document.getElementById('creator-commercial').value = creator.commercial || '';
        document.getElementById('creator-location').value = creator.location || '';
        document.getElementById('creator-notes').value = creator.notes || '';
    } else {
        document.getElementById('creator-db-form').reset();
    }
    
    creatorDbModalOverlay.classList.add('active');
}

function closeCreatorDbModal() {
    const creatorDbModalOverlay = document.getElementById('creator-db-modal-overlay');
    if (creatorDbModalOverlay) creatorDbModalOverlay.classList.remove('active');
    const creatorDbForm = document.getElementById('creator-db-form');
    if (creatorDbForm) creatorDbForm.reset();
    editingCreatorId = null;
}

function handleCreatorDbSubmit(e) {
    e.preventDefault();
    
    const currentUser = getCurrentUser();
    
    const creatorData = {
        id: editingCreatorId || Date.now(),
        name: document.getElementById('creator-name').value,
        platform: document.getElementById('creator-platform').value,
        handle: document.getElementById('creator-handle').value,
        profileLink: document.getElementById('creator-profile-link').value,
        followers: document.getElementById('creator-followers').value,
        niche: document.getElementById('creator-niche').value,
        contact: document.getElementById('creator-contact').value,
        email: document.getElementById('creator-email').value,
        avgViews: document.getElementById('creator-avg-views').value,
        engagement: document.getElementById('creator-engagement').value,
        commercial: document.getElementById('creator-commercial').value,
        location: document.getElementById('creator-location').value,
        notes: document.getElementById('creator-notes').value,
        createdBy: editingCreatorId ? creators.find(c => c.id === editingCreatorId)?.createdBy : currentUser.name,
        createdAt: editingCreatorId ? creators.find(c => c.id === editingCreatorId)?.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    if (editingCreatorId) {
        const index = creators.findIndex(c => c.id === editingCreatorId);
        if (index !== -1) {
            creators[index] = creatorData;
            addActivity('creator', `${currentUser.name} updated creator: ${creatorData.name}`);
        }
    } else {
        creators.push(creatorData);
        addActivity('creator', `${currentUser.name} added creator: ${creatorData.name}`);
    }
    
    saveData();
    populateDropdowns();
    renderCreatorsGrid();
    updateAnalytics();
    closeCreatorDbModal();
    showToast(editingCreatorId ? 'Creator updated successfully!' : 'Creator added successfully!');
}

// ========================================
// Creator Campaign Modal (Add creator to campaign)
// ========================================
function setupCreatorCampaignModal() {
    const creatorCampaignModalOverlay = document.getElementById('creator-campaign-modal-overlay');
    const creatorCampaignModalClose = document.getElementById('creator-campaign-modal-close');
    const creatorCampaignCancelBtn = document.getElementById('creator-campaign-cancel-btn');
    const creatorCampaignForm = document.getElementById('creator-campaign-form');
    const ccSelectCreator = document.getElementById('cc-select-creator');
    
    if (creatorCampaignModalClose) creatorCampaignModalClose.addEventListener('click', () => closeCreatorCampaignModal());
    if (creatorCampaignCancelBtn) creatorCampaignCancelBtn.addEventListener('click', () => closeCreatorCampaignModal());
    if (creatorCampaignModalOverlay) {
        creatorCampaignModalOverlay.addEventListener('click', (e) => {
            if (e.target === creatorCampaignModalOverlay) closeCreatorCampaignModal();
        });
    }
    if (creatorCampaignForm) creatorCampaignForm.addEventListener('submit', handleCreatorCampaignSubmit);
    
    // Handle creator selection from dropdown
    if (ccSelectCreator) {
        ccSelectCreator.addEventListener('change', (e) => {
            const creatorId = parseInt(e.target.value);
            if (creatorId) {
                const creator = creators.find(c => c.id === creatorId);
                if (creator) {
                    document.getElementById('cc-creator-name').value = creator.name || '';
                    document.getElementById('cc-creator-handle').value = creator.handle || '';
                    document.getElementById('cc-creator-profile').value = creator.profileLink || '';
                    document.getElementById('cc-creator-followers').value = creator.followers || '';
                    document.getElementById('cc-creator-niche').value = creator.niche || '';
                    document.getElementById('cc-creator-contact').value = creator.contact || '';
                    document.getElementById('cc-creator-email').value = creator.email || '';
                    document.getElementById('cc-creator-commercial').value = creator.commercial || '';
                    document.getElementById('cc-creator-id').value = creator.id;
                }
            }
        });
    }
}

function openCreatorCampaignModal(campaignCreator = null) {
    const creatorCampaignModalOverlay = document.getElementById('creator-campaign-modal-overlay');
    editingCampaignCreatorId = campaignCreator ? campaignCreator.id : null;
    document.getElementById('creator-campaign-modal-title').textContent = campaignCreator ? 'Edit Creator in Campaign' : 'Add Creator to Campaign';
    
    populateDropdowns();
    updateDeliverablesVisibility();
    
    // Set campaign ID
    document.getElementById('cc-campaign-id').value = currentCampaignId || '';
    
    if (campaignCreator) {
        document.getElementById('cc-select-creator').value = campaignCreator.creatorId || '';
        document.getElementById('cc-creator-name').value = campaignCreator.name || '';
        document.getElementById('cc-creator-handle').value = campaignCreator.handle || '';
        document.getElementById('cc-creator-profile').value = campaignCreator.profileLink || '';
        document.getElementById('cc-creator-followers').value = campaignCreator.followers || '';
        document.getElementById('cc-creator-niche').value = campaignCreator.niche || '';
        document.getElementById('cc-creator-contact').value = campaignCreator.contact || '';
        document.getElementById('cc-creator-email').value = campaignCreator.email || '';
        document.getElementById('cc-creator-commercial').value = campaignCreator.commercial || '';
        document.getElementById('cc-content-status').value = campaignCreator.contentStatus || 'Pending';
        document.getElementById('cc-revision-count').value = campaignCreator.revisionCount || 0;
        document.getElementById('cc-drive-link').value = campaignCreator.driveLink || '';
        document.getElementById('cc-live-link').value = campaignCreator.liveLink || '';
        document.getElementById('cc-views').value = campaignCreator.views || '';
        document.getElementById('cc-likes').value = campaignCreator.likes || '';
        document.getElementById('cc-comments').value = campaignCreator.comments || '';
        document.getElementById('cc-shares').value = campaignCreator.shares || '';
        document.getElementById('cc-creator-id').value = campaignCreator.creatorId || '';
        
        // Set deliverables checkboxes
        const deliverables = campaignCreator.deliverables || [];
        document.querySelectorAll('input[name="deliverable"]').forEach(cb => {
            cb.checked = deliverables.includes(cb.value);
        });
    } else {
        document.getElementById('creator-campaign-form').reset();
        document.getElementById('cc-campaign-id').value = currentCampaignId || '';
        document.getElementById('cc-revision-count').value = 0;
    }
    
    creatorCampaignModalOverlay.classList.add('active');
}

function closeCreatorCampaignModal() {
    const creatorCampaignModalOverlay = document.getElementById('creator-campaign-modal-overlay');
    if (creatorCampaignModalOverlay) creatorCampaignModalOverlay.classList.remove('active');
    const creatorCampaignForm = document.getElementById('creator-campaign-form');
    if (creatorCampaignForm) creatorCampaignForm.reset();
    editingCampaignCreatorId = null;
}

function updateDeliverablesVisibility() {
    const campaign = campaigns.find(c => c.id === currentCampaignId);
    const platform = campaign ? campaign.platform : 'Instagram + YouTube';
    
    const instagramDeliverables = document.querySelector('.instagram-deliverables');
    const youtubeDeliverables = document.querySelector('.youtube-deliverables');
    
    if (instagramDeliverables && youtubeDeliverables) {
        if (platform === 'Instagram') {
            instagramDeliverables.style.display = 'block';
            youtubeDeliverables.style.display = 'none';
        } else if (platform === 'YouTube') {
            instagramDeliverables.style.display = 'none';
            youtubeDeliverables.style.display = 'block';
        } else {
            instagramDeliverables.style.display = 'block';
            youtubeDeliverables.style.display = 'block';
        }
    }
}

function handleCreatorCampaignSubmit(e) {
    e.preventDefault();
    
    const currentUser = getCurrentUser();
    const campaignId = parseInt(document.getElementById('cc-campaign-id').value) || currentCampaignId;
    
    // Get selected deliverables
    const selectedDeliverables = [];
    document.querySelectorAll('input[name="deliverable"]:checked').forEach(cb => {
        selectedDeliverables.push(cb.value);
    });
    
    const campaignCreatorData = {
        id: editingCampaignCreatorId || Date.now(),
        campaignId: campaignId,
        creatorId: document.getElementById('cc-creator-id').value ? parseInt(document.getElementById('cc-creator-id').value) : null,
        name: document.getElementById('cc-creator-name').value,
        handle: document.getElementById('cc-creator-handle').value,
        profileLink: document.getElementById('cc-creator-profile').value,
        followers: document.getElementById('cc-creator-followers').value,
        niche: document.getElementById('cc-creator-niche').value,
        contact: document.getElementById('cc-creator-contact').value,
        email: document.getElementById('cc-creator-email').value,
        commercial: document.getElementById('cc-creator-commercial').value,
        deliverables: selectedDeliverables,
        contentStatus: document.getElementById('cc-content-status').value,
        revisionCount: parseInt(document.getElementById('cc-revision-count').value) || 0,
        driveLink: document.getElementById('cc-drive-link').value,
        liveLink: document.getElementById('cc-live-link').value,
        views: parseInt(document.getElementById('cc-views').value) || 0,
        likes: parseInt(document.getElementById('cc-likes').value) || 0,
        comments: parseInt(document.getElementById('cc-comments').value) || 0,
        shares: parseInt(document.getElementById('cc-shares').value) || 0,
        createdBy: editingCampaignCreatorId ? campaignCreators.find(c => c.id === editingCampaignCreatorId)?.createdBy : currentUser.name,
        createdAt: editingCampaignCreatorId ? campaignCreators.find(c => c.id === editingCampaignCreatorId)?.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    if (editingCampaignCreatorId) {
        const index = campaignCreators.findIndex(c => c.id === editingCampaignCreatorId);
        if (index !== -1) {
            campaignCreators[index] = campaignCreatorData;
            addActivity('creator', `${currentUser.name} updated creator ${campaignCreatorData.name} in campaign`);
        }
    } else {
        campaignCreators.push(campaignCreatorData);
        addActivity('creator', `${currentUser.name} added ${campaignCreatorData.name} to campaign`);
    }
    
    saveData();
    renderAllViews();
    updateAnalytics();
    closeCreatorCampaignModal();
    
    // Refresh campaign detail view
    if (currentCampaignId) {
        viewCampaignDetail(currentCampaignId);
    }
    
    showToast(editingCampaignCreatorId ? 'Creator updated successfully!' : 'Creator added to campaign!');
}
// ========================================
// Task Modal
// ========================================
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
    
    document.getElementById('airtable-modal-overlay').classList.remove('active');
    showToast('Airtable configuration saved!');
}

// ========================================
// View Content Modal
// ========================================
function setupViewContentModal() {
    const viewContentModalOverlay = document.getElementById('view-content-modal-overlay');
    const viewContentModalClose = document.getElementById('view-content-modal-close');
    
    if (viewContentModalClose) {
        viewContentModalClose.addEventListener('click', () => {
            viewContentModalOverlay.classList.remove('active');
        });
    }
    
    if (viewContentModalOverlay) {
        viewContentModalOverlay.addEventListener('click', (e) => {
            if (e.target === viewContentModalOverlay) {
                viewContentModalOverlay.classList.remove('active');
            }
        });
    }
}

function openViewContentModal(campaignCreator) {
    const viewContentModalOverlay = document.getElementById('view-content-modal-overlay');
    document.getElementById('view-content-title').textContent = `${campaignCreator.name} - Content Details`;
    
    const container = document.getElementById('content-view-container');
    
    const statusClass = campaignCreator.contentStatus.toLowerCase().replace(' ', '-');
    const statusBadgeClass = getContentStatusBadgeClass(campaignCreator.contentStatus);
    
    container.innerHTML = `
        <div class="content-view-header">
            <div class="content-view-creator">
                <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(campaignCreator.name)}&background=6366f1&color=fff&size=60" alt="${campaignCreator.name}">
                <div>
                    <h3>${campaignCreator.name}</h3>
                    <p><a href="${campaignCreator.profileLink}" target="_blank">${campaignCreator.handle}</a> • ${campaignCreator.followers} followers</p>
                </div>
            </div>
            <div class="content-view-status">
                <span class="status-badge ${statusBadgeClass}">${campaignCreator.contentStatus}</span>
                ${campaignCreator.revisionCount > 0 ? `
                    <div class="revision-counter" style="margin-top: 10px;">
                        <i class="fas fa-sync"></i>
                        <span>${campaignCreator.revisionCount} revision${campaignCreator.revisionCount > 1 ? 's' : ''}</span>
                    </div>
                ` : ''}
            </div>
        </div>
        
        <div class="content-view-grid">
            <div class="content-view-section">
                <h4><i class="fas fa-tasks"></i> Deliverables</h4>
                <div class="deliverable-tags">
                    ${campaignCreator.deliverables && campaignCreator.deliverables.length > 0 
                        ? campaignCreator.deliverables.map(d => `<span class="deliverable-tag">${d}</span>`).join('')
                        : '<span style="color: var(--text-muted)">No deliverables set</span>'}
                </div>
            </div>
            
            <div class="content-view-section">
                <h4><i class="fas fa-link"></i> Links</h4>
                <div class="content-links-list">
                    ${campaignCreator.driveLink ? `
                        <div class="content-link-item">
                            <i class="fab fa-google-drive"></i>
                            <a href="${campaignCreator.driveLink}" target="_blank">Drive Link</a>
                        </div>
                    ` : '<span style="color: var(--text-muted)">No drive link</span>'}
                    ${campaignCreator.liveLink ? `
                        <div class="content-link-item">
                            <i class="fas fa-external-link-alt"></i>
                            <a href="${campaignCreator.liveLink}" target="_blank">Live Post</a>
                        </div>
                    ` : ''}
                </div>
            </div>
            
            <div class="content-view-section full-width">
                <h4><i class="fas fa-chart-bar"></i> Metrics</h4>
                <div class="content-metrics-grid">
                    <div class="content-metric">
                        <div class="value">${formatNumber(campaignCreator.views || 0)}</div>
                        <div class="label">Views</div>
                    </div>
                    <div class="content-metric">
                        <div class="value">${formatNumber(campaignCreator.likes || 0)}</div>
                        <div class="label">Likes</div>
                    </div>
                    <div class="content-metric">
                        <div class="value">${formatNumber(campaignCreator.comments || 0)}</div>
                        <div class="label">Comments</div>
                    </div>
                    <div class="content-metric">
                        <div class="value">${formatNumber(campaignCreator.shares || 0)}</div>
                        <div class="label">Shares</div>
                    </div>
                </div>
            </div>
            
            <div class="content-view-section">
                <h4><i class="fas fa-user"></i> Contact Info</h4>
                <div class="content-links-list">
                    ${campaignCreator.contact ? `
                        <div class="content-link-item">
                            <i class="fas fa-phone"></i>
                            <span>${campaignCreator.contact}</span>
                        </div>
                    ` : ''}
                    ${campaignCreator.email ? `
                        <div class="content-link-item">
                            <i class="fas fa-envelope"></i>
                            <span>${campaignCreator.email}</span>
                        </div>
                    ` : ''}
                    ${campaignCreator.commercial ? `
                        <div class="content-link-item">
                            <i class="fas fa-rupee-sign"></i>
                            <span>${campaignCreator.commercial}</span>
                        </div>
                    ` : ''}
                </div>
            </div>
            
            <div class="content-view-section">
                <h4><i class="fas fa-info-circle"></i> Additional Info</h4>
                <div class="content-links-list">
                    <div class="content-link-item">
                        <i class="fas fa-hashtag"></i>
                        <span>Niche: ${campaignCreator.niche || 'N/A'}</span>
                    </div>
                    <div class="content-link-item">
                        <i class="fas fa-calendar"></i>
                        <span>Added: ${formatDate(campaignCreator.createdAt)}</span>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="form-actions" style="margin-top: 20px;">
            <button class="btn btn-secondary" onclick="document.getElementById('view-content-modal-overlay').classList.remove('active')">Close</button>
            <button class="btn btn-primary" onclick="editCampaignCreator(${campaignCreator.id})">
                <i class="fas fa-edit"></i> Edit
            </button>
        </div>
    `;
    
    viewContentModalOverlay.classList.add('active');
}

// ========================================
// Confirm Modal
// ========================================
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
// Helper Functions
// ========================================
function formatDate(dateStr) {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
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

function getContentStatusBadgeClass(status) {
    switch(status) {
        case 'Pending': return 'pending';
        case 'Received': return 'received';
        case 'Revision': return 'revision';
        case 'Good to Go': return 'approved';
        case 'Live': return 'live';
        case 'Dropout': return 'dropout';
        default: return 'pending';
    }
}

function getPlatformBadge(platform) {
    if (platform === 'Instagram') {
        return '<span class="platform-badge instagram"><i class="fab fa-instagram"></i> Instagram</span>';
    } else if (platform === 'YouTube') {
        return '<span class="platform-badge youtube"><i class="fab fa-youtube"></i> YouTube</span>';
    } else {
        return '<span class="platform-badge both"><i class="fab fa-instagram"></i><i class="fab fa-youtube"></i> Both</span>';
    }
}

function getCampaignStats(campaignId) {
    const campaignCreatorsList = campaignCreators.filter(cc => cc.campaignId === campaignId);
    
    return {
        total: campaignCreatorsList.length,
        live: campaignCreatorsList.filter(cc => cc.contentStatus === 'Live').length,
        pending: campaignCreatorsList.filter(cc => cc.contentStatus === 'Pending').length,
        revision: campaignCreatorsList.filter(cc => cc.contentStatus === 'Revision').length,
        approved: campaignCreatorsList.filter(cc => cc.contentStatus === 'Good to Go').length,
        dropout: campaignCreatorsList.filter(cc => cc.contentStatus === 'Dropout').length,
        received: campaignCreatorsList.filter(cc => cc.contentStatus === 'Received').length,
        totalViews: campaignCreatorsList.reduce((sum, cc) => sum + (cc.views || 0), 0),
        totalLikes: campaignCreatorsList.reduce((sum, cc) => sum + (cc.likes || 0), 0),
        totalComments: campaignCreatorsList.reduce((sum, cc) => sum + (cc.comments || 0), 0)
    };
}

function getBrandCampaignCount(brandId) {
    return campaigns.filter(c => c.brandId === brandId).length;
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

function editBrand(brandId) {
    const brand = brands.find(b => b.id === brandId);
    if (brand) {
        openBrandModal(brand);
    }
}

function deleteBrand(brandId) {
    const brand = brands.find(b => b.id === brandId);
    openConfirmModal(`Are you sure you want to delete "${brand?.brandName}"? This will also delete all associated campaigns and creators.`, () => {
        // Delete associated campaign creators
        const brandCampaigns = campaigns.filter(c => c.brandId === brandId);
        brandCampaigns.forEach(campaign => {
            campaignCreators = campaignCreators.filter(cc => cc.campaignId !== campaign.id);
        });
        
        // Delete associated campaigns
        campaigns = campaigns.filter(c => c.brandId !== brandId);
        
        // Delete associated tasks
        tasks = tasks.filter(t => t.brandId != brandId);
        
        // Delete brand
        brands = brands.filter(b => b.id !== brandId);
        
        saveData();
        renderAllViews();
        updateAnalytics();
        addActivity('update', `${getCurrentUser().name} deleted brand: ${brand?.brandName || 'Unknown'}`);
        showToast('Brand deleted successfully');
    });
}

function viewBrandCampaigns(brandId) {
    currentBrandId = brandId;
    const brand = brands.find(b => b.id === brandId);
    
    if (brand) {
        document.getElementById('brand-campaigns-title').textContent = brand.brandName;
        document.getElementById('brand-campaigns-subtitle').textContent = `Manage campaigns for ${brand.brandName}`;
        
        switchView('brand-campaigns');
        renderBrandCampaignsGrid(brandId);
    }
}

// ========================================
// Campaign Actions
// ========================================
function viewCampaignDetail(campaignId) {
    currentCampaignId = campaignId;
    const campaign = campaigns.find(c => c.id === campaignId);
    
    if (campaign) {
        const brand = brands.find(b => b.id === campaign.brandId);
        currentBrandId = campaign.brandId;
        
        document.getElementById('campaign-detail-title').textContent = campaign.name;
        document.getElementById('campaign-detail-subtitle').textContent = brand ? brand.brandName : '';
        
        // Update campaign info bar
        document.getElementById('cinfo-platform').innerHTML = getPlatformBadge(campaign.platform);
        document.getElementById('cinfo-created').textContent = formatDate(campaign.createdAt);
        document.getElementById('cinfo-budget').textContent = campaign.budget ? `₹${parseInt(campaign.budget).toLocaleString()}` : 'Not set';
        
        // Update campaign stats
        const stats = getCampaignStats(campaignId);
        document.getElementById('cstat-live').textContent = stats.live;
        document.getElementById('cstat-pending').textContent = stats.pending + stats.received;
        document.getElementById('cstat-revision').textContent = stats.revision;
        document.getElementById('cstat-approved').textContent = stats.approved;
        document.getElementById('cstat-dropout').textContent = stats.dropout;
        document.getElementById('cstat-total').textContent = stats.total;
        
        switchView('campaign-detail');
        renderCampaignCreatorsList(campaignId);
    }
}

function editCampaign(campaignId) {
    const campaign = campaigns.find(c => c.id === campaignId);
    if (campaign) {
        currentBrandId = campaign.brandId;
        openCampaignModal(campaign);
    }
}

function deleteCampaign(campaignId) {
    const campaign = campaigns.find(c => c.id === campaignId);
    openConfirmModal(`Are you sure you want to delete campaign "${campaign?.name}"? This will also delete all creators in this campaign.`, () => {
        // Delete associated campaign creators
        campaignCreators = campaignCreators.filter(cc => cc.campaignId !== campaignId);
        
        // Delete campaign
        campaigns = campaigns.filter(c => c.id !== campaignId);
        
        saveData();
        renderAllViews();
        updateAnalytics();
        
        // Go back to brand campaigns or campaigns list
        if (currentBrandId) {
            viewBrandCampaigns(currentBrandId);
        } else {
            switchView('campaigns');
            setActiveNav('campaigns');
        }
        
        addActivity('campaign', `${getCurrentUser().name} deleted campaign: ${campaign?.name || 'Unknown'}`);
        showToast('Campaign deleted successfully');
    });
}

function updateCampaignStatus(campaignId, newStatus) {
    const campaign = campaigns.find(c => c.id === campaignId);
    if (campaign) {
        campaign.status = newStatus;
        campaign.updatedAt = new Date().toISOString();
        
        saveData();
        renderAllViews();
        updateAnalytics();
        showToast(`Campaign status updated to ${newStatus}`);
    }
}

// ========================================
// Creator Actions
// ========================================
function editCreator(creatorId) {
    const creator = creators.find(c => c.id === creatorId);
    if (creator) {
        openCreatorDbModal(creator);
    }
}

function deleteCreator(creatorId) {
    const creator = creators.find(c => c.id === creatorId);
    openConfirmModal(`Are you sure you want to delete "${creator?.name}" from the database?`, () => {
        creators = creators.filter(c => c.id !== creatorId);
        saveData();
        renderCreatorsGrid();
        updateAnalytics();
        addActivity('creator', `${getCurrentUser().name} deleted creator: ${creator?.name || 'Unknown'}`);
        showToast('Creator deleted successfully');
    });
}

function addCreatorToCampaign(creatorId) {
    const creator = creators.find(c => c.id === creatorId);
    if (creator && currentCampaignId) {
        // Pre-fill the form with creator data
        document.getElementById('cc-select-creator').value = creator.id;
        document.getElementById('cc-creator-name').value = creator.name || '';
        document.getElementById('cc-creator-handle').value = creator.handle || '';
        document.getElementById('cc-creator-profile').value = creator.profileLink || '';
        document.getElementById('cc-creator-followers').value = creator.followers || '';
        document.getElementById('cc-creator-niche').value = creator.niche || '';
        document.getElementById('cc-creator-contact').value = creator.contact || '';
        document.getElementById('cc-creator-email').value = creator.email || '';
        document.getElementById('cc-creator-commercial').value = creator.commercial || '';
        document.getElementById('cc-creator-id').value = creator.id;
        
        openCreatorCampaignModal();
    }
}

// ========================================
// Campaign Creator Actions
// ========================================
function editCampaignCreator(campaignCreatorId) {
    const campaignCreator = campaignCreators.find(cc => cc.id === campaignCreatorId);
    if (campaignCreator) {
        currentCampaignId = campaignCreator.campaignId;
        
        // Close view content modal if open
        const viewContentModal = document.getElementById('view-content-modal-overlay');
        if (viewContentModal) viewContentModal.classList.remove('active');
        
        openCreatorCampaignModal(campaignCreator);
    }
}

function deleteCampaignCreator(campaignCreatorId) {
    const campaignCreator = campaignCreators.find(cc => cc.id === campaignCreatorId);
    openConfirmModal(`Are you sure you want to remove "${campaignCreator?.name}" from this campaign?`, () => {
        campaignCreators = campaignCreators.filter(cc => cc.id !== campaignCreatorId);
        saveData();
        
        if (currentCampaignId) {
            viewCampaignDetail(currentCampaignId);
        }
        
        renderAllViews();
        updateAnalytics();
        addActivity('creator', `${getCurrentUser().name} removed ${campaignCreator?.name || 'creator'} from campaign`);
        showToast('Creator removed from campaign');
    });
}

function updateCreatorContentStatus(campaignCreatorId, newStatus) {
    const campaignCreator = campaignCreators.find(cc => cc.id === campaignCreatorId);
    if (campaignCreator) {
        const oldStatus = campaignCreator.contentStatus;
        campaignCreator.contentStatus = newStatus;
        campaignCreator.updatedAt = new Date().toISOString();
        
        // Increment revision count if moving to revision
        if (newStatus === 'Revision' && oldStatus !== 'Revision') {
            campaignCreator.revisionCount = (campaignCreator.revisionCount || 0) + 1;
        }
        
        saveData();
        
        if (currentCampaignId) {
            viewCampaignDetail(currentCampaignId);
        }
        
        renderAllViews();
        updateAnalytics();
        addActivity('creator', `${getCurrentUser().name} updated ${campaignCreator.name} status to ${newStatus}`);
        showToast(`Status updated to ${newStatus}`);
    }
}

function viewCreatorContent(campaignCreatorId) {
    const campaignCreator = campaignCreators.find(cc => cc.id === campaignCreatorId);
    if (campaignCreator) {
        openViewContentModal(campaignCreator);
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

function viewMemberDetail(memberId) {
    const users = getUsers();
    const member = users.find(u => u.id === memberId);
    
    if (member) {
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
        const memberCampaigns = campaigns.filter(c => c.poc === member.name);
        
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
                    <td colspan="5" style="text-align: center; padding: 30px; color: var(--text-muted);">
                        No tasks assigned
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
                    <td colspan="4" style="text-align: center; padding: 30px; color: var(--text-muted);">
                        No campaigns assigned
                    </td>
                </tr>
            `;
        } else {
            campaignsListEl.innerHTML = memberCampaigns.map(campaign => `
                <tr>
                    <td><strong>${campaign.brandName}</strong></td>
                    <td>${campaign.name}</td>
                    <td><span class="status-badge ${campaign.status.toLowerCase().replace(' ', '-')}">${campaign.status}</span></td>
                    <td>Campaign POC</td>
                </tr>
            `).join('');
        }
        
        switchView('member-detail');
    }
}
// ========================================
// Render Functions
// ========================================
function renderAllViews() {
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
        case 'campaigns': renderAllCampaignsList(); break;
        case 'running': renderRunningCampaignsList(); break;
        case 'live': renderLiveCampaignsList(); break;
        case 'invoice': renderInvoiceTable(); break;
        case 'creators': renderCreatorsGrid(); break;
        case 'team': renderTeamGrid(); break;
        case 'manage-team': renderManageTeamTable(); break;
    }
}

function getStatusOptions(currentStatus) {
    return BRAND_STATUS_OPTIONS.map(status => 
        `<option value="${status}" ${status === currentStatus ? 'selected' : ''}>${status}</option>`
    ).join('');
}

function getCampaignStatusOptions(currentStatus) {
    return CAMPAIGN_STATUS_OPTIONS.map(status => 
        `<option value="${status}" ${status === currentStatus ? 'selected' : ''}>${status}</option>`
    ).join('');
}

function getContentStatusOptions(currentStatus) {
    return CONTENT_STATUS_OPTIONS.map(status => 
        `<option value="${status}" ${status === currentStatus ? 'selected' : ''}>${status}</option>`
    ).join('');
}

function getEmptyState(icon, title, message, showButton = false, buttonText = '', buttonAction = '') {
    return `
        <div class="empty-state">
            <i class="fas fa-${icon}"></i>
            <h3>${title}</h3>
            <p>${message}</p>
            ${showButton ? `<button class="btn btn-primary" onclick="${buttonAction}">${buttonText}</button>` : ''}
        </div>
    `;
}

// ========================================
// Brand Tables
// ========================================
function renderBrandsTable(data) {
    const tbody = document.getElementById('tbody-brands');
    if (!tbody) return;
    
    if (data.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7">
                    ${getEmptyState('building', 'No brands yet', 'Add your first brand to get started')}
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = data.map(brand => {
        const campaignCount = getBrandCampaignCount(brand.id);
        return `
            <tr data-id="${brand.id}">
                <td><strong>${brand.brandName}</strong></td>
                <td>${brand.pocName}</td>
                <td>${brand.pocEmail}</td>
                <td><span class="budget-badge ${brand.budgetStatus.toLowerCase()}">${brand.budgetStatus}</span></td>
                <td>
                    <select class="status-dropdown" onchange="updateBrandStatus(${brand.id}, this.value)">
                        ${getStatusOptions(brand.status)}
                    </select>
                </td>
                <td>
                    <span class="status-badge ${campaignCount > 0 ? 'running' : ''}" style="${campaignCount === 0 ? 'background: var(--bg-tertiary); color: var(--text-muted);' : ''}">
                        ${campaignCount} campaign${campaignCount !== 1 ? 's' : ''}
                    </span>
                </td>
                <td>
                    <div class="action-btns">
                        <button class="action-btn campaign" onclick="viewBrandCampaigns(${brand.id})" title="View Campaigns">
                            <i class="fas fa-bullhorn"></i>
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
        `;
    }).join('');
}

function renderHotTable(data) {
    const tbody = document.getElementById('tbody-hot');
    if (!tbody) return;
    
    if (data.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8">
                    ${getEmptyState('fire', 'No hot brands', 'Move brands here when they show high interest')}
                </td>
            </tr>
        `;
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
            <td>${brand.pipelineStatus || '-'}</td>
            <td>${brand.aflogPoc || '-'}</td>
            <td>
                <div class="action-btns">
                    <button class="action-btn campaign" onclick="viewBrandCampaigns(${brand.id})" title="View Campaigns">
                        <i class="fas fa-bullhorn"></i>
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

function renderWarmTable(data) {
    const tbody = document.getElementById('tbody-warm');
    if (!tbody) return;
    
    if (data.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8">
                    ${getEmptyState('temperature-half', 'No warm brands', 'Brands showing moderate interest appear here')}
                </td>
            </tr>
        `;
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
            <td>${brand.pipelineStatus || '-'}</td>
            <td>${brand.aflogPoc || '-'}</td>
            <td>
                <div class="action-btns">
                    <button class="action-btn campaign" onclick="viewBrandCampaigns(${brand.id})" title="View Campaigns">
                        <i class="fas fa-bullhorn"></i>
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

function renderLostTable(data) {
    const tbody = document.getElementById('tbody-lost');
    if (!tbody) return;
    
    if (data.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7">
                    ${getEmptyState('heart-crack', 'No lost brands', 'Brands that did not convert appear here')}
                </td>
            </tr>
        `;
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
        tbody.innerHTML = `
            <tr>
                <td colspan="7">
                    ${getEmptyState('exchange-alt', 'No converted brands', 'Brands converted to campaigns appear here')}
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = data.map(brand => {
        const campaignCount = getBrandCampaignCount(brand.id);
        return `
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
                <td>
                    <span class="status-badge running">${campaignCount} campaign${campaignCount !== 1 ? 's' : ''}</span>
                </td>
                <td>
                    <div class="action-btns">
                        <button class="action-btn campaign" onclick="viewBrandCampaigns(${brand.id})" title="View Campaigns">
                            <i class="fas fa-bullhorn"></i>
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
        `;
    }).join('');
}

// ========================================
// Campaign Lists
// ========================================
function renderAllCampaignsList() {
    const container = document.getElementById('all-campaigns-list');
    if (!container) return;
    
    if (campaigns.length === 0) {
        container.innerHTML = getEmptyState('bullhorn', 'No campaigns yet', 'Create your first campaign from a brand');
        return;
    }
    
    container.innerHTML = campaigns.map(campaign => renderCampaignCard(campaign)).join('');
}

function renderRunningCampaignsList() {
    const container = document.getElementById('running-campaigns-list');
    if (!container) return;
    
    const runningCampaigns = campaigns.filter(c => c.status === 'Running');
    
    if (runningCampaigns.length === 0) {
        container.innerHTML = getEmptyState('play-circle', 'No running campaigns', 'Campaigns in progress will appear here');
        return;
    }
    
    container.innerHTML = runningCampaigns.map(campaign => renderCampaignCard(campaign)).join('');
}

function renderLiveCampaignsList() {
    const container = document.getElementById('live-campaigns-list');
    if (!container) return;
    
    // Get campaigns that have at least one live creator
    const liveCampaigns = campaigns.filter(campaign => {
        const stats = getCampaignStats(campaign.id);
        return stats.live > 0;
    });
    
    if (liveCampaigns.length === 0) {
        container.innerHTML = getEmptyState('broadcast-tower', 'No live campaigns', 'Campaigns with live content will appear here');
        return;
    }
    
    container.innerHTML = liveCampaigns.map(campaign => renderCampaignCard(campaign)).join('');
}

function renderCampaignCard(campaign) {
    const stats = getCampaignStats(campaign.id);
    const statusClass = campaign.status.toLowerCase().replace(' ', '-');
    
    return `
        <div class="campaign-card-large">
            <div class="campaign-card-header">
                <div class="campaign-card-info">
                    <h3>
                        ${campaign.name}
                        <span class="status-badge ${statusClass}">${campaign.status}</span>
                    </h3>
                    <p>${campaign.brandName} • ${getPlatformBadge(campaign.platform)}</p>
                </div>
                <div class="action-btns">
                    <button class="action-btn view" onclick="viewCampaignDetail(${campaign.id})" title="View Details">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="action-btn edit" onclick="editCampaign(${campaign.id})" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete" onclick="deleteCampaign(${campaign.id})" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <div class="campaign-card-stats">
                <div class="campaign-mini-stat">
                    <div class="value">${stats.total}</div>
                    <div class="label">Creators</div>
                </div>
                <div class="campaign-mini-stat">
                    <div class="value" style="color: var(--success);">${stats.live}</div>
                    <div class="label">Live</div>
                </div>
                <div class="campaign-mini-stat">
                    <div class="value" style="color: var(--warning);">${stats.pending + stats.received}</div>
                    <div class="label">Pending</div>
                </div>
                <div class="campaign-mini-stat">
                    <div class="value" style="color: var(--hot);">${stats.revision}</div>
                    <div class="label">Revision</div>
                </div>
                <div class="campaign-mini-stat">
                    <div class="value" style="color: var(--converted);">${stats.approved}</div>
                    <div class="label">Approved</div>
                </div>
                <div class="campaign-mini-stat">
                    <div class="value">${formatNumber(stats.totalViews)}</div>
                    <div class="label">Views</div>
                </div>
            </div>
            <div class="campaign-card-footer">
                <div class="campaign-meta">
                    <span><i class="fas fa-user"></i> ${campaign.poc || 'No POC'}</span>
                    <span><i class="fas fa-calendar"></i> ${formatDate(campaign.startDate) || 'No date'}</span>
                    ${campaign.budget ? `<span><i class="fas fa-rupee-sign"></i> ${parseInt(campaign.budget).toLocaleString()}</span>` : ''}
                </div>
                <button class="btn btn-sm btn-primary" onclick="viewCampaignDetail(${campaign.id})">
                    View Details <i class="fas fa-arrow-right"></i>
                </button>
            </div>
        </div>
    `;
}

function renderBrandCampaignsGrid(brandId) {
    const container = document.getElementById('brand-campaigns-grid');
    if (!container) return;
    
    const brandCampaigns = campaigns.filter(c => c.brandId === brandId);
    
    if (brandCampaigns.length === 0) {
        container.innerHTML = `
            <div class="empty-campaign-card" onclick="openCampaignModal()">
                <i class="fas fa-plus-circle"></i>
                <h4>Create First Campaign</h4>
                <p>Click here to add a campaign for this brand</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = brandCampaigns.map(campaign => {
        const stats = getCampaignStats(campaign.id);
        const statusClass = campaign.status.toLowerCase().replace(' ', '-');
        
        return `
            <div class="brand-campaign-card" onclick="viewCampaignDetail(${campaign.id})">
                <div class="card-header">
                    <h3>${campaign.name}</h3>
                    <span class="status-badge ${statusClass}">${campaign.status}</span>
                </div>
                <div style="margin-bottom: 10px;">
                    ${getPlatformBadge(campaign.platform)}
                </div>
                <div class="card-stats">
                    <div class="mini-stat">
                        <div class="value">${stats.total}</div>
                        <div class="label">Creators</div>
                    </div>
                    <div class="mini-stat">
                        <div class="value" style="color: var(--success);">${stats.live}</div>
                        <div class="label">Live</div>
                    </div>
                    <div class="mini-stat">
                        <div class="value" style="color: var(--warning);">${stats.pending + stats.received}</div>
                        <div class="label">Pending</div>
                    </div>
                </div>
                <div class="card-footer">
                    <span><i class="fas fa-calendar"></i> ${formatDate(campaign.createdAt)}</span>
                    <div class="action-btns" onclick="event.stopPropagation();">
                        <button class="action-btn edit" onclick="editCampaign(${campaign.id})" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn delete" onclick="deleteCampaign(${campaign.id})" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('') + `
        <div class="empty-campaign-card" onclick="openCampaignModal()">
            <i class="fas fa-plus-circle"></i>
            <h4>Add Campaign</h4>
            <p>Create another campaign</p>
        </div>
    `;
}

function renderCampaignCreatorsList(campaignId) {
    const container = document.getElementById('campaign-creators-list');
    if (!container) return;
    
    const creatorsList = campaignCreators.filter(cc => cc.campaignId === campaignId);
    
    if (creatorsList.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="padding: 40px;">
                <i class="fas fa-user-plus" style="font-size: 3rem;"></i>
                <h3>No creators yet</h3>
                <p>Add creators to this campaign to get started</p>
                <button class="btn btn-primary" onclick="openCreatorCampaignModal()" style="margin-top: 15px;">
                    <i class="fas fa-user-plus"></i> Add Creator
                </button>
            </div>
        `;
        return;
    }
    
    container.innerHTML = creatorsList.map(cc => {
        const statusBadgeClass = getContentStatusBadgeClass(cc.contentStatus);
        
        return `
            <div class="campaign-creator-card">
                <div class="campaign-creator-header">
                    <div class="campaign-creator-info">
                        <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(cc.name)}&background=6366f1&color=fff&size=50" 
                             alt="${cc.name}" class="campaign-creator-avatar">
                        <div class="campaign-creator-name">
                            <h4>${cc.name}</h4>
                            <p><a href="${cc.profileLink}" target="_blank">${cc.handle}</a> • ${cc.followers || 'N/A'} followers</p>
                        </div>
                    </div>
                    <div class="campaign-creator-status">
                        ${cc.revisionCount > 0 ? `
                            <div class="revision-counter">
                                <i class="fas fa-sync"></i>
                                <span>${cc.revisionCount}</span>
                            </div>
                        ` : ''}
                        <select class="status-dropdown" onchange="updateCreatorContentStatus(${cc.id}, this.value)" style="min-width: 120px;">
                            ${getContentStatusOptions(cc.contentStatus)}
                        </select>
                    </div>
                </div>
                
                <div class="campaign-creator-body">
                    <div class="creator-deliverables">
                        <h5>Deliverables</h5>
                        <div class="deliverable-tags">
                            ${cc.deliverables && cc.deliverables.length > 0 
                                ? cc.deliverables.map(d => `<span class="deliverable-tag">${d}</span>`).join('')
                                : '<span style="color: var(--text-muted); font-size: 0.8rem;">No deliverables set</span>'}
                        </div>
                    </div>
                    <div class="creator-links">
                        <h5>Content Links</h5>
                        ${cc.driveLink ? `
                            <div class="link-item">
                                <i class="fab fa-google-drive"></i>
                                <a href="${cc.driveLink}" target="_blank">Drive Link</a>
                            </div>
                        ` : ''}
                        ${cc.liveLink ? `
                            <div class="link-item">
                                <i class="fas fa-external-link-alt"></i>
                                <a href="${cc.liveLink}" target="_blank">Live Post</a>
                            </div>
                        ` : ''}
                        ${!cc.driveLink && !cc.liveLink ? '<span style="color: var(--text-muted); font-size: 0.8rem;">No links added</span>' : ''}
                    </div>
                </div>
                
                ${cc.contentStatus === 'Live' ? `
                    <div class="campaign-creator-metrics">
                        <div class="metric-item">
                            <div class="value">${formatNumber(cc.views || 0)}</div>
                            <div class="label">Views</div>
                        </div>
                        <div class="metric-item">
                            <div class="value">${formatNumber(cc.likes || 0)}</div>
                            <div class="label">Likes</div>
                        </div>
                        <div class="metric-item">
                            <div class="value">${formatNumber(cc.comments || 0)}</div>
                            <div class="label">Comments</div>
                        </div>
                        <div class="metric-item">
                            <div class="value">${formatNumber(cc.shares || 0)}</div>
                            <div class="label">Shares</div>
                        </div>
                    </div>
                ` : ''}
                
                <div class="campaign-creator-footer">
                    <div class="creator-contact-info">
                        ${cc.contact ? `<span><i class="fas fa-phone"></i> ${cc.contact}</span>` : ''}
                        ${cc.email ? `<span><i class="fas fa-envelope"></i> ${cc.email}</span>` : ''}
                        ${cc.commercial ? `<span><i class="fas fa-rupee-sign"></i> ${cc.commercial}</span>` : ''}
                    </div>
                    <div class="action-btns">
                        <button class="action-btn view" onclick="viewCreatorContent(${cc.id})" title="View Details">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="action-btn edit" onclick="editCampaignCreator(${cc.id})" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn delete" onclick="deleteCampaignCreator(${cc.id})" title="Remove">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// ========================================
// Invoice Table
// ========================================
function renderInvoiceTable() {
    const tbody = document.getElementById('tbody-invoice');
    if (!tbody) return;
    
    const invoiceCampaigns = campaigns.filter(c => c.status === 'Invoice Pending' || c.status === 'Completed');
    
    if (invoiceCampaigns.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9">
                    ${getEmptyState('file-invoice-dollar', 'No invoices pending', 'Completed campaigns will appear here')}
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = invoiceCampaigns.map(campaign => {
        const stats = getCampaignStats(campaign.id);
        const brand = brands.find(b => b.id === campaign.brandId);
        
        return `
            <tr>
                <td>
                    <select class="status-dropdown" onchange="updateCampaignStatus(${campaign.id}, this.value)">
                        ${getCampaignStatusOptions(campaign.status)}
                    </select>
                </td>
                <td><strong>${campaign.brandName}</strong></td>
                <td>${campaign.name}</td>
                <td>${stats.total}</td>
                <td>${stats.live}</td>
                <td class="checkbox-cell">
                    <input type="checkbox" ${campaign.invoiced ? 'checked' : ''} onchange="toggleCampaignInvoiced(${campaign.id}, this.checked)">
                </td>
                <td>
                    <span class="status-badge ${campaign.invoiceStatus === 'Cleared' ? 'running' : campaign.invoiceStatus === 'Delayed' ? 'lost' : 'pending'}">
                        ${campaign.invoiceStatus || 'Pending'}
                    </span>
                </td>
                <td>₹${campaign.budget ? parseInt(campaign.budget).toLocaleString() : '0'}</td>
                <td>
                    <div class="action-btns">
                        <button class="action-btn view" onclick="viewCampaignDetail(${campaign.id})" title="View">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="action-btn edit" onclick="editCampaign(${campaign.id})" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function toggleCampaignInvoiced(campaignId, checked) {
    const campaign = campaigns.find(c => c.id === campaignId);
    if (campaign) {
        campaign.invoiced = checked;
        campaign.invoiceStatus = checked ? 'Cleared' : 'Pending';
        campaign.updatedAt = new Date().toISOString();
        saveData();
        renderInvoiceTable();
    }
}
// ========================================
// Creators Grid
// ========================================
function renderCreatorsGrid() {
    const container = document.getElementById('creators-grid');
    if (!container) return;
    
    // Apply filters
    const platformFilter = document.getElementById('filter-platform')?.value || '';
    const nicheFilter = document.getElementById('filter-niche')?.value || '';
    const searchFilter = document.getElementById('filter-search')?.value?.toLowerCase() || '';
    
    let filteredCreators = [...creators];
    
    if (platformFilter) {
        filteredCreators = filteredCreators.filter(c => c.platform === platformFilter);
    }
    
    if (nicheFilter) {
        filteredCreators = filteredCreators.filter(c => c.niche === nicheFilter);
    }
    
    if (searchFilter) {
        filteredCreators = filteredCreators.filter(c => 
            c.name.toLowerCase().includes(searchFilter) ||
            c.handle.toLowerCase().includes(searchFilter) ||
            (c.niche && c.niche.toLowerCase().includes(searchFilter))
        );
    }
    
    if (filteredCreators.length === 0) {
        container.innerHTML = getEmptyState('user-astronaut', 'No creators found', 'Add creators to your database or adjust filters');
        return;
    }
    
    container.innerHTML = filteredCreators.map(creator => {
        const platformIcon = creator.platform === 'Instagram' ? 'fab fa-instagram' : 'fab fa-youtube';
        const platformColor = creator.platform === 'Instagram' ? 'var(--instagram)' : 'var(--youtube)';
        
        return `
            <div class="creator-card">
                <div class="creator-card-header">
                    <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(creator.name)}&background=6366f1&color=fff&size=60" 
                         alt="${creator.name}" class="creator-avatar">
                    <div class="creator-info">
                        <h4>${creator.name}</h4>
                        <div class="creator-handle">
                            <i class="${platformIcon}" style="color: ${platformColor};"></i>
                            <a href="${creator.profileLink}" target="_blank">${creator.handle}</a>
                        </div>
                    </div>
                </div>
                
                <div class="creator-stats">
                    <div class="creator-stat">
                        <div class="value">${creator.followers || 'N/A'}</div>
                        <div class="label">Followers</div>
                    </div>
                    <div class="creator-stat">
                        <div class="value">${creator.avgViews || 'N/A'}</div>
                        <div class="label">Avg Views</div>
                    </div>
                    <div class="creator-stat">
                        <div class="value">${creator.engagement || 'N/A'}</div>
                        <div class="label">Engagement</div>
                    </div>
                </div>
                
                <div class="creator-details">
                    ${creator.commercial ? `<span><i class="fas fa-rupee-sign"></i> ${creator.commercial}</span>` : ''}
                    ${creator.location ? `<span><i class="fas fa-map-marker-alt"></i> ${creator.location}</span>` : ''}
                    ${creator.email ? `<span><i class="fas fa-envelope"></i> ${creator.email}</span>` : ''}
                </div>
                
                <div class="creator-card-footer">
                    <span class="creator-niche">${creator.niche || 'General'}</span>
                    <div class="action-btns">
                        <button class="action-btn edit" onclick="editCreator(${creator.id})" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn delete" onclick="deleteCreator(${creator.id})" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// ========================================
// Team Grid
// ========================================
function renderTeamGrid() {
    const container = document.getElementById('team-grid');
    if (!container) return;
    
    const users = getUsers().filter(u => u.active !== false);
    
    if (users.length === 0) {
        container.innerHTML = getEmptyState('users', 'No team members', 'Add team members from Manage Team');
        return;
    }
    
    container.innerHTML = users.map(member => {
        const memberTasks = tasks.filter(t => t.assignedTo === member.name);
        const activeTasks = memberTasks.filter(t => t.status !== 'Completed').length;
        const memberCampaigns = campaigns.filter(c => c.poc === member.name).length;
        
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
                        <div class="team-stat-label">Tasks</div>
                    </div>
                    <div class="team-stat">
                        <div class="team-stat-value">${memberCampaigns}</div>
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
                <td colspan="7">
                    ${getEmptyState('lock', 'Access Denied', 'Only administrators can manage team members')}
                </td>
            </tr>
        `;
        return;
    }
    
    const users = getUsers();
    
    if (users.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7">
                    ${getEmptyState('users', 'No team members', 'Add your first team member')}
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = users.map(member => {
        const memberTasks = tasks.filter(t => t.assignedTo === member.name).length;
        const memberCampaigns = campaigns.filter(c => c.poc === member.name).length;
        const currentUser = getCurrentUser();
        const isCurrentUser = member.email === currentUser.email;
        
        return `
            <tr>
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
                <td>${memberCampaigns}</td>
                <td>
                    <div class="action-btns">
                        <button class="action-btn view" onclick="viewMemberDetail(${member.id})" title="View">
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
// My Tasks
// ========================================
function renderMyTasks() {
    const currentUser = getCurrentUser();
    const myTasks = tasks.filter(t => t.assignedTo === currentUser.name);
    
    const todoTasks = myTasks.filter(t => t.status === 'To Do');
    const progressTasks = myTasks.filter(t => t.status === 'In Progress');
    const completedTasks = myTasks.filter(t => t.status === 'Completed');
    
    document.getElementById('count-todo').textContent = todoTasks.length;
    document.getElementById('count-progress').textContent = progressTasks.length;
    document.getElementById('count-completed').textContent = completedTasks.length;
    
    renderTaskColumn('tasks-todo', todoTasks);
    renderTaskColumn('tasks-progress', progressTasks);
    renderTaskColumn('tasks-completed', completedTasks);
    
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
        { label: 'Converted', key: 'Converted to Campaign', class: 'converted' }
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
            <div class="empty-state" style="padding: 30px;">
                <i class="fas fa-history" style="font-size: 2rem;"></i>
                <p>No recent activity</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = activities.slice(0, 15).map(activity => {
        let iconClass, icon;
        switch(activity.type) {
            case 'add': iconClass = 'add'; icon = 'plus'; break;
            case 'status': iconClass = 'status'; icon = 'exchange-alt'; break;
            case 'task': iconClass = 'task'; icon = 'tasks'; break;
            case 'campaign': iconClass = 'campaign'; icon = 'bullhorn'; break;
            case 'creator': iconClass = 'creator'; icon = 'user'; break;
            default: iconClass = 'update'; icon = 'edit';
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
    const totalBrands = brands.length;
    const hotBrands = brands.filter(b => b.status === 'Hot Brands').length;
    const totalCampaigns = campaigns.filter(c => c.status === 'Running' || c.status === 'Planning').length;
    const totalCreators = creators.length;
    
    // Content live count
    const contentLive = campaignCreators.filter(cc => cc.contentStatus === 'Live').length;
    
    // Pending revisions
    const pendingRevisions = campaignCreators.filter(cc => cc.contentStatus === 'Revision').length;
    
    const elements = {
        'stat-total': totalBrands,
        'stat-hot': hotBrands,
        'stat-campaigns': totalCampaigns,
        'stat-creators': totalCreators,
        'stat-content-live': contentLive,
        'stat-revisions': pendingRevisions
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
        'badge-campaigns': campaigns.length,
        'badge-running': campaigns.filter(c => c.status === 'Running').length,
        'badge-live': campaigns.filter(c => {
            const stats = getCampaignStats(c.id);
            return stats.live > 0;
        }).length,
        'badge-invoice': campaigns.filter(c => c.status === 'Invoice Pending' || c.status === 'Completed').length,
        'badge-creators': creators.length,
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
            status: 'Converted to Campaign',
            pipelineStatus: 'Campaign Stage',
            aflogPoc: currentUser.name,
            briefComments: 'Looking for influencer campaign',
            brandTool: true,
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
            status: 'Hot Brands',
            pipelineStatus: 'Proposal Sent',
            aflogPoc: currentUser.name,
            briefComments: 'Interested in YouTube campaign',
            brandTool: false,
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
            status: 'Warm Brands',
            pipelineStatus: 'Initial Talks',
            aflogPoc: currentUser.name,
            briefComments: 'Follow up next week',
            brandTool: true,
            monthAdded: 'Dec 2023',
            createdBy: currentUser.name,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }
    ];
    
    campaigns = [
        {
            id: 1,
            brandId: 1,
            brandName: 'Nike India',
            name: 'Nike Summer 2024',
            platform: 'Instagram + YouTube',
            budget: '500000',
            startDate: '2024-02-01',
            endDate: '2024-03-31',
            status: 'Running',
            poc: currentUser.name,
            notes: 'Summer collection launch campaign',
            createdBy: currentUser.name,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }
    ];
    
    creators = [
        {
            id: 1,
            name: 'Fitness With Raj',
            platform: 'Instagram',
            handle: '@fitnesswithraj',
            profileLink: 'https://instagram.com/fitnesswithraj',
            followers: '500K',
            niche: 'Fitness',
            contact: '+91 98765 11111',
            email: 'raj@email.com',
            avgViews: '50K',
            engagement: '5.2%',
            commercial: '50,000',
            location: 'Mumbai',
            notes: 'Great for fitness brands',
            createdBy: currentUser.name,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        },
        {
            id: 2,
            name: 'Tech Burner',
            platform: 'YouTube',
            handle: '@techburner',
            profileLink: 'https://youtube.com/@techburner',
            followers: '2M',
            niche: 'Tech',
            contact: '+91 98765 22222',
            email: 'tech@burner.com',
            avgViews: '500K',
            engagement: '8.5%',
            commercial: '2,00,000',
            location: 'Delhi',
            notes: 'Top tech reviewer',
            createdBy: currentUser.name,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }
    ];
    
    campaignCreators = [
        {
            id: 1,
            campaignId: 1,
            creatorId: 1,
            name: 'Fitness With Raj',
            handle: '@fitnesswithraj',
            profileLink: 'https://instagram.com/fitnesswithraj',
            followers: '500K',
            niche: 'Fitness',
            contact: '+91 98765 11111',
            email: 'raj@email.com',
            commercial: '50,000',
            deliverables: ['Collab Reel', 'Story'],
            contentStatus: 'Live',
            revisionCount: 1,
            driveLink: 'https://drive.google.com/example1',
            liveLink: 'https://instagram.com/p/example1',
            views: 125000,
            likes: 8500,
            comments: 320,
            shares: 150,
            createdBy: currentUser.name,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        },
        {
            id: 2,
            campaignId: 1,
            creatorId: 2,
            name: 'Tech Burner',
            handle: '@techburner',
            profileLink: 'https://youtube.com/@techburner',
            followers: '2M',
            niche: 'Tech',
            contact: '+91 98765 22222',
            email: 'tech@burner.com',
            commercial: '2,00,000',
            deliverables: ['YT Integrated Video'],
            contentStatus: 'Revision',
            revisionCount: 2,
            driveLink: 'https://drive.google.com/example2',
            liveLink: '',
            views: 0,
            likes: 0,
            comments: 0,
            shares: 0,
            createdBy: currentUser.name,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }
    ];
    
    tasks = [
        {
            id: 1,
            title: 'Follow up with Adidas',
            description: 'Send updated proposal',
            brandId: 2,
            brandName: 'Adidas Sports',
            assignedTo: currentUser.name,
            status: 'To Do',
            priority: 'High',
            dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            createdBy: currentUser.name,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        },
        {
            id: 2,
            title: 'Review Nike campaign metrics',
            description: 'Prepare weekly report',
            brandId: 1,
            brandName: 'Nike India',
            assignedTo: currentUser.name,
            status: 'In Progress',
            priority: 'Medium',
            dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
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
window.editBrand = editBrand;
window.deleteBrand = deleteBrand;
window.viewBrandCampaigns = viewBrandCampaigns;

window.viewCampaignDetail = viewCampaignDetail;
window.editCampaign = editCampaign;
window.deleteCampaign = deleteCampaign;
window.updateCampaignStatus = updateCampaignStatus;
window.toggleCampaignInvoiced = toggleCampaignInvoiced;

window.editCreator = editCreator;
window.deleteCreator = deleteCreator;
window.addCreatorToCampaign = addCreatorToCampaign;

window.editCampaignCreator = editCampaignCreator;
window.deleteCampaignCreator = deleteCampaignCreator;
window.updateCreatorContentStatus = updateCreatorContentStatus;
window.viewCreatorContent = viewCreatorContent;

window.updateTaskStatus = updateTaskStatus;
window.editTask = editTask;
window.deleteTask = deleteTask;

window.editMember = editMember;
window.toggleMemberStatus = toggleMemberStatus;
window.viewMemberDetail = viewMemberDetail;

window.openBrandModal = openBrandModal;
window.openCampaignModal = openCampaignModal;
window.openCreatorDbModal = openCreatorDbModal;
window.openCreatorCampaignModal = openCreatorCampaignModal;
window.openTaskModal = openTaskModal;
window.openMemberModal = openMemberModal;
