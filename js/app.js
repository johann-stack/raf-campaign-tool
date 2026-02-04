// ===== JSONbin Configuration =====
const JSONBIN_BIN_ID = '6983a63743b1c97be965ae5f';
const JSONBIN_API_KEY = '$2a$10$c2CLcLc.1Hxw2jN8IPUyguVCBY1F9pxwenqqJfvQL7P68hHl.WSXa';
const JSONBIN_URL = `https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}`;

// ===== Global State =====
let appData = {
    users: [],
    brands: [],
    hotBrands: [],
    warmBrands: [],
    lostBrands: [],
    convertedCampaigns: [],
    runningCampaigns: [],
    liveCampaigns: [],
    invoices: [],
    creators: [],
    bookmarkedCreators: [],
    accessControl: {}
};

let currentUser = null;
let csvData = [];

// ===== Subniche Mapping =====
const subnicheMapping = {
    'Fashion': ['Stylist', 'Designers', 'Reviewers', 'Luxury', 'Bloggers', 'Lifestyle'],
    'Beauty & Skincare': ['Make-up', 'Skincare', 'Nail Artist', 'Reviewers', 'Bloggers', 'Lifestyle'],
    'Food': ['Chefs', 'Bloggers', 'Homechefs', 'Recipe Creator', 'Mukbang', 'Healthy Recipe', 'Non Vegetarian', 'Baking', 'Vegetarian'],
    'Fitness': ['Gym', 'Yoga', 'Pilates', 'Zumba', 'Bodybuilders', 'Lifestyle', 'Coach', 'Calisthenics', 'Hula Hoop', 'Wellbeing'],
    'Sports': ['Cricketers', 'Footballers', 'Hockey', 'Basketball', 'Runner', 'Surfer', 'Athlete', 'Skipper', 'Hiker', 'Trekker', 'Boxing', 'MMA', 'Wrestling', 'Tennis', 'Table-Tennis', 'Squash', 'Hurdles', 'Badminton', 'Swimmer', 'Long-jump', 'Shotput', 'Javelin', 'Archery', 'Rowing', 'Kayaking'],
    'Parenting': ['Mom', 'Dad', 'Senior Citizen', 'Kids', 'Parenting', 'Lifestyle', 'Couple'],
    'Travel': ['Bloggers', 'Hiker', 'Trekker', 'Lifestyle', 'Couple', 'Infotainment'],
    'Comedy': ['Stand-Up', 'Skit', 'Vox-Pop', 'Reviewers', 'Infotainment', 'Lifestyle'],
    'Tech': ['Reviewers', 'Infotainment', 'Lifestyle', 'DIY'],
    'Professionals': ['Actor', 'Doctor', 'Nutritionist', 'CA', 'Anchor', 'Architects', 'Photographer', 'Videographer', 'Journalist', 'Infotainment', 'Wedding Planner', 'Home Decor'],
    'Performing Arts': ['Dancer', 'Singer', 'Musician', 'Poet', 'Story-Teller', 'Doodle Artist', 'Infotainment', 'DIY'],
    'Automobile': ['Reviewers', 'Lifestyle', 'Infotainment']
};

// ===== Initialize App =====
document.addEventListener('DOMContentLoaded', async function() {
    // Check if user is logged in
    const session = JSON.parse(localStorage.getItem('rafSession'));
    
    if (!session || !session.loggedIn) {
        window.location.href = 'index.html';
        return;
    }
    
    currentUser = session;
    
    // Update UI with user info
    updateUserUI();
    
    // Load data from JSONbin
    await loadAppData();
    
    // Initialize navigation
    initNavigation();
    
    // Initialize drag and drop for CSV
    initCSVDragDrop();
    
    // Update all stats and tables
    refreshAllData();
    
    // Check admin access
    checkAdminAccess();
    
    // Check creator database access
    checkCreatorDbAccess();
});

// ===== Update User UI =====
function updateUserUI() {
    const userAvatar = document.getElementById('userAvatar');
    const userName = document.getElementById('userName');
    const userRole = document.getElementById('userRole');
    
    if (currentUser) {
        userAvatar.textContent = currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U';
        userName.textContent = currentUser.name || currentUser.email;
        userRole.textContent = currentUser.role === 'admin' ? 'Administrator' : 'Team Member';
    }
}

// ===== Check Admin Access =====
function checkAdminAccess() {
    const adminNavSection = document.getElementById('adminNavSection');
    
    if (currentUser && currentUser.role === 'admin') {
        adminNavSection.style.display = 'block';
    } else {
        adminNavSection.style.display = 'none';
    }
}

// ===== Check Creator Database Access =====
function checkCreatorDbAccess() {
    const overlay = document.getElementById('creatorRestrictedOverlay');
    
    if (currentUser.role === 'admin') {
        overlay.style.display = 'none';
        return;
    }
    
    // Check if user has access
    const hasAccess = appData.accessControl[currentUser.id] !== false;
    
    if (!hasAccess) {
        overlay.style.display = 'flex';
    } else {
        overlay.style.display = 'none';
    }
}

// ===== Load App Data from JSONbin =====
async function loadAppData() {
    try {
        showToast('Loading data...', 'info');
        
        const response = await fetch(JSONBIN_URL + '/latest', {
            method: 'GET',
            headers: {
                'X-Master-Key': JSONBIN_API_KEY
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch data');
        }
        
        const data = await response.json();
        
        if (data.record) {
            appData = {
                users: data.record.users || [],
                brands: data.record.brands || [],
                hotBrands: data.record.hotBrands || [],
                warmBrands: data.record.warmBrands || [],
                lostBrands: data.record.lostBrands || [],
                convertedCampaigns: data.record.convertedCampaigns || [],
                runningCampaigns: data.record.runningCampaigns || [],
                liveCampaigns: data.record.liveCampaigns || [],
                invoices: data.record.invoices || [],
                creators: data.record.creators || [],
                bookmarkedCreators: data.record.bookmarkedCreators || [],
                accessControl: data.record.accessControl || {}
            };
        }
        
        showToast('Data loaded successfully', 'success');
        
    } catch (error) {
        console.error('Error loading data:', error);
        showToast('Error loading data. Using local storage.', 'error');
        
        // Fallback to localStorage
        const localData = localStorage.getItem('rafAppData');
        if (localData) {
            appData = JSON.parse(localData);
        }
    }
}

// ===== Save App Data to JSONbin =====
async function saveAppData() {
    try {
        const response = await fetch(JSONBIN_URL, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': JSONBIN_API_KEY
            },
            body: JSON.stringify(appData)
        });
        
        if (!response.ok) {
            throw new Error('Failed to save data');
        }
        
        // Also save to localStorage as backup
        localStorage.setItem('rafAppData', JSON.stringify(appData));
        
        return true;
        
    } catch (error) {
        console.error('Error saving data:', error);
        showToast('Error saving data. Saved locally.', 'error');
        
        // Save to localStorage as fallback
        localStorage.setItem('rafAppData', JSON.stringify(appData));
        
        return false;
    }
}

// ===== Navigation =====
function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item[data-section]');
    
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            const section = this.getAttribute('data-section');
            navigateTo(section);
        });
    });
    
    // Logout button
    document.getElementById('logoutBtn').addEventListener('click', logout);
    
    // Global search
    document.getElementById('globalSearch').addEventListener('input', handleGlobalSearch);
}

function navigateTo(sectionId) {
    // Update nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    const activeNavItem = document.querySelector(`.nav-item[data-section="${sectionId}"]`);
    if (activeNavItem) {
        activeNavItem.classList.add('active');
    }
    
    // Update sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    
    const activeSection = document.getElementById(`section-${sectionId}`);
    if (activeSection) {
        activeSection.classList.add('active');
    }
    
    // Update page title
    updatePageTitle(sectionId);
    
    // Check access for creator database
    if (sectionId === 'creator-database') {
        checkCreatorDbAccess();
    }
    
    // Refresh data for the section
    refreshSectionData(sectionId);
}

function updatePageTitle(sectionId) {
    const titles = {
        'dashboard': { title: 'Dashboard', subtitle: 'Welcome back! Here\'s your campaign overview.' },
        'brands': { title: 'Brands', subtitle: 'Manage all your brand contacts.' },
        'hot-brands': { title: 'Hot Brands', subtitle: 'Brands with high conversion potential.' },
        'warm-brands': { title: 'Warm Brands', subtitle: 'Brands showing moderate interest.' },
        'lost-brands': { title: 'Lost Brands', subtitle: 'Brands that didn\'t convert.' },
        'converted-campaigns': { title: 'Converted to Campaign', subtitle: 'Brands that converted to campaigns.' },
        'running-campaigns': { title: 'Campaign Running', subtitle: 'Currently active campaigns.' },
        'live-campaigns': { title: 'Campaign Live', subtitle: 'Live campaigns with metrics.' },
        'invoice-stage': { title: 'Invoice Stage', subtitle: 'Manage campaign invoices.' },
        'all-campaigns': { title: 'All Campaigns', subtitle: 'View all campaigns across stages.' },
        'creator-database': { title: 'Creator Database', subtitle: 'Manage your creator network.' },
        'user-management': { title: 'User Management', subtitle: 'Manage team members and access.' },
        'access-control': { title: 'Access Control', subtitle: 'Control feature access for team members.' }
    };
    
    const pageInfo = titles[sectionId] || { title: 'Dashboard', subtitle: '' };
    
    document.getElementById('pageTitle').textContent = pageInfo.title;
    document.getElementById('pageSubtitle').textContent = pageInfo.subtitle;
}

// ===== Logout =====
function logout() {
    localStorage.removeItem('rafSession');
    window.location.href = 'index.html';
}

// ===== Global Search =====
function handleGlobalSearch(e) {
    const searchTerm = e.target.value.toLowerCase();
    // Implement global search across all data
    console.log('Searching for:', searchTerm);
}
// ===== Refresh All Data =====
function refreshAllData() {
    updateDashboardStats();
    refreshBrandsTable();
    refreshHotBrandsTable();
    refreshWarmBrandsTable();
    refreshLostBrandsTable();
    refreshConvertedCampaignsTable();
    refreshRunningCampaignsTable();
    refreshLiveCampaignsGrid();
    refreshInvoiceTable();
    refreshAllCampaignsTable();
    refreshCreatorDatabase();
    refreshUserManagement();
    refreshAccessControl();
    populateDropdowns();
}

function refreshSectionData(sectionId) {
    switch(sectionId) {
        case 'dashboard':
            updateDashboardStats();
            break;
        case 'brands':
            refreshBrandsTable();
            break;
        case 'hot-brands':
            refreshHotBrandsTable();
            break;
        case 'warm-brands':
            refreshWarmBrandsTable();
            break;
        case 'lost-brands':
            refreshLostBrandsTable();
            break;
        case 'converted-campaigns':
            refreshConvertedCampaignsTable();
            break;
        case 'running-campaigns':
            refreshRunningCampaignsTable();
            populateCampaignDropdowns();
            break;
        case 'live-campaigns':
            refreshLiveCampaignsGrid();
            populateCampaignDropdowns();
            break;
        case 'invoice-stage':
            refreshInvoiceTable();
            populateCampaignDropdowns();
            break;
        case 'all-campaigns':
            refreshAllCampaignsTable();
            break;
        case 'creator-database':
            refreshCreatorDatabase();
            break;
        case 'user-management':
            refreshUserManagement();
            break;
        case 'access-control':
            refreshAccessControl();
            break;
    }
}

// ===== Dashboard Stats =====
function updateDashboardStats() {
    document.getElementById('totalBrands').textContent = appData.brands.length;
    document.getElementById('activeCampaigns').textContent = 
        appData.runningCampaigns.length + appData.liveCampaigns.length;
    document.getElementById('hotLeads').textContent = appData.hotBrands.length;
    document.getElementById('lostBrands').textContent = appData.lostBrands.length;
    document.getElementById('totalCreators').textContent = appData.creators.length;
    
    // Count retainer brands
    const retainerCount = appData.runningCampaigns.filter(c => c.isRetainer).length;
    document.getElementById('retainerBrands').textContent = retainerCount;
    
    // Update badge counts
    document.getElementById('hotBrandsCount').textContent = appData.hotBrands.length;
    document.getElementById('warmBrandsCount').textContent = appData.warmBrands.length;
    
    // Update recent activity
    updateRecentActivity();
}

function updateRecentActivity() {
    const tbody = document.getElementById('recentActivityTable');
    
    // Combine all activities with timestamps
    let activities = [];
    
    appData.brands.forEach(brand => {
        activities.push({
            brand: brand.brandName,
            status: brand.status,
            campaign: '-',
            date: brand.createdAt || new Date().toISOString()
        });
    });
    
    appData.convertedCampaigns.forEach(campaign => {
        activities.push({
            brand: campaign.brandName,
            status: 'Converted',
            campaign: campaign.campaignName,
            date: campaign.createdAt || new Date().toISOString()
        });
    });
    
    // Sort by date (newest first)
    activities.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Take only last 5
    activities = activities.slice(0, 5);
    
    if (activities.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4" class="empty-state">
                    <p>No recent activity</p>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = activities.map(activity => `
        <tr>
            <td>${activity.brand}</td>
            <td><span class="status-badge ${getStatusClass(activity.status)}">${activity.status}</span></td>
            <td>${activity.campaign}</td>
            <td>${formatDate(activity.date)}</td>
        </tr>
    `).join('');
}

// ===== Brands Table =====
function refreshBrandsTable() {
    const tbody = document.getElementById('brandsTableBody');
    
    if (appData.brands.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="empty-state">
                    <p>No brands added yet</p>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = appData.brands.map((brand, index) => `
        <tr>
            <td><strong>${brand.brandName}</strong></td>
            <td>${brand.pocName}</td>
            <td>${brand.pocEmail}</td>
            <td>${brand.pocNumber}</td>
            <td><span class="status-badge ${getBudgetClass(brand.budgetStatus)}">${brand.budgetStatus}</span></td>
            <td>
                <select class="status-dropdown" onchange="updateBrandStatus(${index}, this.value)">
                    <option value="Hot Brands" ${brand.status === 'Hot Brands' ? 'selected' : ''}>Hot Brands</option>
                    <option value="Warm Brands" ${brand.status === 'Warm Brands' ? 'selected' : ''}>Warm Brands</option>
                    <option value="Lost Brands" ${brand.status === 'Lost Brands' ? 'selected' : ''}>Lost Brands</option>
                    <option value="Converted to Campaign" ${brand.status === 'Converted to Campaign' ? 'selected' : ''}>Converted to Campaign</option>
                </select>
            </td>
            <td>
                <button class="btn btn-sm btn-secondary" onclick="editBrand(${index})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteBrand(${index})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// ===== Update Brand Status (Auto-shift) =====
async function updateBrandStatus(index, newStatus) {
    const brand = appData.brands[index];
    const oldStatus = brand.status;
    brand.status = newStatus;
    
    // Remove from old status table
    removeFromStatusTable(brand, oldStatus);
    
    // Add to new status table
    addToStatusTable(brand, newStatus);
    
    await saveAppData();
    refreshAllData();
    
    showToast(`${brand.brandName} moved to ${newStatus}`, 'success');
}

function removeFromStatusTable(brand, status) {
    let targetArray;
    
    switch(status) {
        case 'Hot Brands':
            targetArray = appData.hotBrands;
            break;
        case 'Warm Brands':
            targetArray = appData.warmBrands;
            break;
        case 'Lost Brands':
            targetArray = appData.lostBrands;
            break;
        case 'Converted to Campaign':
            targetArray = appData.convertedCampaigns;
            break;
        default:
            return;
    }
    
    const index = targetArray.findIndex(b => b.brandId === brand.id || b.brandName === brand.brandName);
    if (index > -1) {
        targetArray.splice(index, 1);
    }
}

function addToStatusTable(brand, status) {
    const baseData = {
        brandId: brand.id,
        brandName: brand.brandName,
        pocName: brand.pocName,
        pocEmail: brand.pocEmail,
        pocNumber: brand.pocNumber,
        budgetStatus: brand.budgetStatus,
        createdAt: new Date().toISOString()
    };
    
    switch(status) {
        case 'Hot Brands':
            if (!appData.hotBrands.find(b => b.brandId === brand.id)) {
                appData.hotBrands.push({
                    ...baseData,
                    pipelineStatus: 'Initial Talks',
                    aflogPoc: '',
                    hasBrandTool: false,
                    taskAssignee: '',
                    comments: ''
                });
            }
            break;
        case 'Warm Brands':
            if (!appData.warmBrands.find(b => b.brandId === brand.id)) {
                appData.warmBrands.push({
                    ...baseData,
                    pipelineStatus: 'Initial Talks',
                    aflogPoc: '',
                    hasBrandTool: false,
                    taskAssignee: '',
                    comments: ''
                });
            }
            break;
        case 'Lost Brands':
            if (!appData.lostBrands.find(b => b.brandId === brand.id)) {
                appData.lostBrands.push({
                    ...baseData,
                    lostReason: '',
                    lostDate: new Date().toISOString()
                });
            }
            break;
        case 'Converted to Campaign':
            // Don't auto-add, require campaign name
            break;
    }
}

// ===== Hot Brands Table =====
function refreshHotBrandsTable() {
    const tbody = document.getElementById('hotBrandsTableBody');
    
    if (appData.hotBrands.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" class="empty-state">
                    <p>No hot brands yet</p>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = appData.hotBrands.map((brand, index) => `
        <tr>
            <td><strong>${brand.brandName}</strong></td>
            <td>${brand.pocName}</td>
            <td>${brand.pocEmail}</td>
            <td><span class="status-badge ${getBudgetClass(brand.budgetStatus)}">${brand.budgetStatus}</span></td>
            <td>
                <select class="status-dropdown" onchange="updateHotBrandPipeline(${index}, this.value)">
                    <option value="Initial Talks" ${brand.pipelineStatus === 'Initial Talks' ? 'selected' : ''}>Initial Talks</option>
                    <option value="Requirement Received" ${brand.pipelineStatus === 'Requirement Received' ? 'selected' : ''}>Requirement Received</option>
                    <option value="Proposal Sent" ${brand.pipelineStatus === 'Proposal Sent' ? 'selected' : ''}>Proposal Sent</option>
                    <option value="Conversion Talks" ${brand.pipelineStatus === 'Conversion Talks' ? 'selected' : ''}>Conversion Talks</option>
                    <option value="Campaign Stage" ${brand.pipelineStatus === 'Campaign Stage' ? 'selected' : ''}>Campaign Stage</option>
                    <option value="Invoice Stage" ${brand.pipelineStatus === 'Invoice Stage' ? 'selected' : ''}>Invoice Stage</option>
                </select>
            </td>
            <td>${brand.aflogPoc || '-'}</td>
            <td>${brand.hasBrandTool ? '<i class="fas fa-check text-success"></i>' : '<i class="fas fa-times text-danger"></i>'}</td>
            <td>${brand.taskAssignee || '-'}</td>
            <td>
                <button class="btn btn-sm btn-success" onclick="convertToWarm(${index})">
                    <i class="fas fa-temperature-half"></i>
                </button>
                <button class="btn btn-sm btn-primary" onclick="convertToCampaign(${index}, 'hot')">
                    <i class="fas fa-rocket"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="markAsLost(${index}, 'hot')">
                    <i class="fas fa-heart-crack"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

async function updateHotBrandPipeline(index, newStatus) {
    appData.hotBrands[index].pipelineStatus = newStatus;
    await saveAppData();
    showToast('Pipeline status updated', 'success');
}

async function convertToWarm(index) {
    const brand = appData.hotBrands[index];
    
    // Add to warm brands
    appData.warmBrands.push({...brand});
    
    // Remove from hot brands
    appData.hotBrands.splice(index, 1);
    
    // Update main brand status
    const mainBrand = appData.brands.find(b => b.id === brand.brandId || b.brandName === brand.brandName);
    if (mainBrand) {
        mainBrand.status = 'Warm Brands';
    }
    
    await saveAppData();
    refreshAllData();
    
    showToast(`${brand.brandName} moved to Warm Brands`, 'success');
}

async function convertToCampaign(index, source) {
    let brand;
    
    if (source === 'hot') {
        brand = appData.hotBrands[index];
    } else {
        brand = appData.warmBrands[index];
    }
    
    // Prompt for campaign name
    const campaignName = prompt(`Enter campaign name for ${brand.brandName}:`);
    
    if (!campaignName) {
        return;
    }
    
    // Add to converted campaigns
    appData.convertedCampaigns.push({
        id: generateId(),
        brandId: brand.brandId,
        brandName: brand.brandName,
        campaignName: campaignName,
        pocName: brand.pocName,
        pocEmail: brand.pocEmail,
        budgetStatus: brand.budgetStatus,
        pipelineStatus: 'Campaign Stage',
        creators: [],
        createdAt: new Date().toISOString()
    });
    
    // Remove from source
    if (source === 'hot') {
        appData.hotBrands.splice(index, 1);
    } else {
        appData.warmBrands.splice(index, 1);
    }
    
    // Update main brand
    const mainBrand = appData.brands.find(b => b.id === brand.brandId || b.brandName === brand.brandName);
    if (mainBrand) {
        mainBrand.status = 'Converted to Campaign';
        mainBrand.campaignName = campaignName;
    }
    
    await saveAppData();
    refreshAllData();
    
    showToast(`${brand.brandName} converted to campaign: ${campaignName}`, 'success');
}

async function markAsLost(index, source) {
    let brand;
    
    if (source === 'hot') {
        brand = appData.hotBrands[index];
    } else {
        brand = appData.warmBrands[index];
    }
    
    const reason = prompt(`Enter reason for losing ${brand.brandName}:`);
    
    // Add to lost brands
    appData.lostBrands.push({
        brandId: brand.brandId,
        brandName: brand.brandName,
        pocName: brand.pocName,
        pocEmail: brand.pocEmail,
        lostReason: reason || 'Not specified',
        lostDate: new Date().toISOString()
    });
    
    // Remove from source
    if (source === 'hot') {
        appData.hotBrands.splice(index, 1);
    } else {
        appData.warmBrands.splice(index, 1);
    }
    
    // Update main brand
    const mainBrand = appData.brands.find(b => b.id === brand.brandId || b.brandName === brand.brandName);
    if (mainBrand) {
        mainBrand.status = 'Lost Brands';
    }
    
    await saveAppData();
    refreshAllData();
    
    showToast(`${brand.brandName} marked as lost`, 'warning');
}

// ===== Warm Brands Table =====
function refreshWarmBrandsTable() {
    const tbody = document.getElementById('warmBrandsTableBody');
    
    if (appData.warmBrands.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" class="empty-state">
                    <p>No warm brands yet</p>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = appData.warmBrands.map((brand, index) => `
        <tr>
            <td><strong>${brand.brandName}</strong></td>
            <td>${brand.pocName}</td>
            <td>${brand.pocEmail}</td>
            <td><span class="status-badge ${getBudgetClass(brand.budgetStatus)}">${brand.budgetStatus}</span></td>
            <td>
                <select class="status-dropdown" onchange="updateWarmBrandPipeline(${index}, this.value)">
                    <option value="Initial Talks" ${brand.pipelineStatus === 'Initial Talks' ? 'selected' : ''}>Initial Talks</option>
                    <option value="Requirement Received" ${brand.pipelineStatus === 'Requirement Received' ? 'selected' : ''}>Requirement Received</option>
                    <option value="Proposal Sent" ${brand.pipelineStatus === 'Proposal Sent' ? 'selected' : ''}>Proposal Sent</option>
                    <option value="Conversion Talks" ${brand.pipelineStatus === 'Conversion Talks' ? 'selected' : ''}>Conversion Talks</option>
                    <option value="Campaign Stage" ${brand.pipelineStatus === 'Campaign Stage' ? 'selected' : ''}>Campaign Stage</option>
                    <option value="Invoice Stage" ${brand.pipelineStatus === 'Invoice Stage' ? 'selected' : ''}>Invoice Stage</option>
                </select>
            </td>
            <td>${brand.aflogPoc || '-'}</td>
            <td>${brand.hasBrandTool ? '<i class="fas fa-check text-success"></i>' : '<i class="fas fa-times text-danger"></i>'}</td>
            <td>${brand.taskAssignee || '-'}</td>
            <td>
                <button class="btn btn-sm btn-warning" onclick="convertToHot(${index})">
                    <i class="fas fa-fire"></i>
                </button>
                <button class="btn btn-sm btn-primary" onclick="convertToCampaign(${index}, 'warm')">
                    <i class="fas fa-rocket"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="markAsLost(${index}, 'warm')">
                    <i class="fas fa-heart-crack"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

async function updateWarmBrandPipeline(index, newStatus) {
    appData.warmBrands[index].pipelineStatus = newStatus;
    await saveAppData();
    showToast('Pipeline status updated', 'success');
}

async function convertToHot(index) {
    const brand = appData.warmBrands[index];
    
    // Add to hot brands
    appData.hotBrands.push({...brand});
    
    // Remove from warm brands
    appData.warmBrands.splice(index, 1);
    
    // Update main brand status
    const mainBrand = appData.brands.find(b => b.id === brand.brandId || b.brandName === brand.brandName);
    if (mainBrand) {
        mainBrand.status = 'Hot Brands';
    }
    
    await saveAppData();
    refreshAllData();
    
    showToast(`${brand.brandName} moved to Hot Brands`, 'success');
}

// ===== Lost Brands Table =====
function refreshLostBrandsTable() {
    const tbody = document.getElementById('lostBrandsTableBody');
    
    if (appData.lostBrands.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="empty-state">
                    <p>No lost brands</p>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = appData.lostBrands.map((brand, index) => `
        <tr>
            <td><strong>${brand.brandName}</strong></td>
            <td>${brand.pocName}</td>
            <td>${brand.pocEmail}</td>
            <td>${brand.lostReason || '-'}</td>
            <td>${formatDate(brand.lostDate)}</td>
            <td>
                <button class="btn btn-sm btn-success" onclick="reviveBrand(${index})">
                    <i class="fas fa-redo"></i> Revive
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteLostBrand(${index})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

async function reviveBrand(index) {
    const brand = appData.lostBrands[index];
    
    // Add to warm brands
    appData.warmBrands.push({
        brandId: brand.brandId,
        brandName: brand.brandName,
        pocName: brand.pocName,
        pocEmail: brand.pocEmail,
        pocNumber: brand.pocNumber || '',
        budgetStatus: brand.budgetStatus || 'Medium',
        pipelineStatus: 'Initial Talks',
        aflogPoc: '',
        hasBrandTool: false,
        taskAssignee: '',
        comments: '',
        createdAt: new Date().toISOString()
    });
    
    // Remove from lost brands
    appData.lostBrands.splice(index, 1);
    
    // Update main brand
    const mainBrand = appData.brands.find(b => b.id === brand.brandId || b.brandName === brand.brandName);
    if (mainBrand) {
        mainBrand.status = 'Warm Brands';
    }
    
    await saveAppData();
    refreshAllData();
    
    showToast(`${brand.brandName} revived to Warm Brands`, 'success');
}

async function deleteLostBrand(index) {
    if (confirm('Are you sure you want to permanently delete this brand?')) {
        const brand = appData.lostBrands[index];
        appData.lostBrands.splice(index, 1);
        
        await saveAppData();
        refreshAllData();
        
        showToast(`${brand.brandName} deleted`, 'success');
    }
}
// ===== Converted Campaigns Table =====
function refreshConvertedCampaignsTable() {
    const tbody = document.getElementById('convertedCampaignsTableBody');
    
    if (appData.convertedCampaigns.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="empty-state">
                    <p>No converted campaigns yet</p>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = appData.convertedCampaigns.map((campaign, index) => `
        <tr>
            <td><strong>${campaign.brandName}</strong></td>
            <td>${campaign.campaignName}</td>
            <td>${campaign.pocName}</td>
            <td>${campaign.pocEmail}</td>
            <td><span class="status-badge ${getBudgetClass(campaign.budgetStatus)}">${campaign.budgetStatus}</span></td>
            <td>
                <select class="status-dropdown" onchange="updateConvertedPipeline(${index}, this.value)">
                    <option value="Campaign Stage" ${campaign.pipelineStatus === 'Campaign Stage' ? 'selected' : ''}>Campaign Stage</option>
                    <option value="Invoice Stage" ${campaign.pipelineStatus === 'Invoice Stage' ? 'selected' : ''}>Invoice Stage</option>
                </select>
            </td>
            <td>
                <span class="status-badge info">${campaign.creators ? campaign.creators.length : 0} creators</span>
            </td>
            <td>
                <button class="btn btn-sm btn-success" onclick="moveToRunning(${index})">
                    <i class="fas fa-play"></i>
                </button>
                <button class="btn btn-sm btn-secondary" onclick="viewCampaignCreators(${index})">
                    <i class="fas fa-users"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteConvertedCampaign(${index})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

async function updateConvertedPipeline(index, newStatus) {
    appData.convertedCampaigns[index].pipelineStatus = newStatus;
    await saveAppData();
    showToast('Pipeline status updated', 'success');
}

async function moveToRunning(index) {
    const campaign = appData.convertedCampaigns[index];
    
    // Add to running campaigns
    appData.runningCampaigns.push({
        id: campaign.id,
        brandId: campaign.brandId,
        brandName: campaign.brandName,
        campaignName: campaign.campaignName,
        pocName: campaign.pocName,
        pocEmail: campaign.pocEmail,
        currentStatus: 'Content Creation',
        isRetainer: false,
        startDate: new Date().toISOString().split('T')[0],
        creators: campaign.creators || [],
        comments: '',
        createdAt: new Date().toISOString()
    });
    
    // Remove from converted
    appData.convertedCampaigns.splice(index, 1);
    
    await saveAppData();
    refreshAllData();
    
    showToast(`${campaign.campaignName} moved to Running Campaigns`, 'success');
}

function viewCampaignCreators(index) {
    const campaign = appData.convertedCampaigns[index];
    const creators = campaign.creators || [];
    
    if (creators.length === 0) {
        showToast('No creators added to this campaign yet', 'info');
        return;
    }
    
    let creatorList = creators.map(c => `- ${c.name} (@${c.username})`).join('\n');
    alert(`Creators in ${campaign.campaignName}:\n\n${creatorList}`);
}

async function deleteConvertedCampaign(index) {
    if (confirm('Are you sure you want to delete this campaign?')) {
        const campaign = appData.convertedCampaigns[index];
        appData.convertedCampaigns.splice(index, 1);
        
        await saveAppData();
        refreshAllData();
        
        showToast(`${campaign.campaignName} deleted`, 'success');
    }
}

// ===== Running Campaigns Table =====
function refreshRunningCampaignsTable() {
    const tbody = document.getElementById('runningCampaignsTableBody');
    
    if (appData.runningCampaigns.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="empty-state">
                    <p>No running campaigns</p>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = appData.runningCampaigns.map((campaign, index) => `
        <tr>
            <td><strong>${campaign.brandName}</strong></td>
            <td>${campaign.campaignName}</td>
            <td>${campaign.pocName}</td>
            <td>
                <select class="status-dropdown" onchange="updateRunningStatus(${index}, this.value)">
                    <option value="Content Creation" ${campaign.currentStatus === 'Content Creation' ? 'selected' : ''}>Content Creation</option>
                    <option value="Review Pending" ${campaign.currentStatus === 'Review Pending' ? 'selected' : ''}>Review Pending</option>
                    <option value="Changes Requested" ${campaign.currentStatus === 'Changes Requested' ? 'selected' : ''}>Changes Requested</option>
                    <option value="Approved" ${campaign.currentStatus === 'Approved' ? 'selected' : ''}>Approved</option>
                    <option value="Scheduled" ${campaign.currentStatus === 'Scheduled' ? 'selected' : ''}>Scheduled</option>
                    <option value="Published" ${campaign.currentStatus === 'Published' ? 'selected' : ''}>Published</option>
                </select>
            </td>
            <td>${campaign.isRetainer ? '<i class="fas fa-check-circle text-success"></i> Yes' : '<i class="fas fa-times-circle text-danger"></i> No'}</td>
            <td>${formatDate(campaign.startDate)}</td>
            <td>
                <button class="btn btn-sm btn-success" onclick="moveToLive(${index})">
                    <i class="fas fa-broadcast-tower"></i>
                </button>
                <button class="btn btn-sm btn-warning" onclick="toggleRetainer(${index})">
                    <i class="fas fa-redo"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteRunningCampaign(${index})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

async function updateRunningStatus(index, newStatus) {
    appData.runningCampaigns[index].currentStatus = newStatus;
    await saveAppData();
    showToast('Campaign status updated', 'success');
}

async function toggleRetainer(index) {
    appData.runningCampaigns[index].isRetainer = !appData.runningCampaigns[index].isRetainer;
    await saveAppData();
    refreshRunningCampaignsTable();
    updateDashboardStats();
    
    const status = appData.runningCampaigns[index].isRetainer ? 'marked as' : 'removed from';
    showToast(`Campaign ${status} retainer`, 'success');
}

async function moveToLive(index) {
    const campaign = appData.runningCampaigns[index];
    
    // Add to live campaigns
    appData.liveCampaigns.push({
        id: campaign.id,
        brandId: campaign.brandId,
        brandName: campaign.brandName,
        campaignName: campaign.campaignName,
        pocName: campaign.pocName,
        pocEmail: campaign.pocEmail,
        isRetainer: campaign.isRetainer,
        goLiveDate: new Date().toISOString().split('T')[0],
        totalReach: 0,
        totalEngagement: 0,
        totalViews: 0,
        roi: '',
        reportLink: '',
        creators: campaign.creators || [],
        createdAt: new Date().toISOString()
    });
    
    // Remove from running
    appData.runningCampaigns.splice(index, 1);
    
    await saveAppData();
    refreshAllData();
    
    showToast(`${campaign.campaignName} is now LIVE!`, 'success');
}

async function deleteRunningCampaign(index) {
    if (confirm('Are you sure you want to delete this running campaign?')) {
        const campaign = appData.runningCampaigns[index];
        appData.runningCampaigns.splice(index, 1);
        
        await saveAppData();
        refreshAllData();
        
        showToast(`${campaign.campaignName} deleted`, 'success');
    }
}

// ===== Live Campaigns Grid =====
function refreshLiveCampaignsGrid() {
    const grid = document.getElementById('liveCampaignsGrid');
    
    if (appData.liveCampaigns.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-broadcast-tower"></i>
                <h3>No Live Campaigns</h3>
                <p>Campaigns that are live will appear here with their metrics</p>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = appData.liveCampaigns.map((campaign, index) => `
        <div class="campaign-card">
            <div class="campaign-card-header">
                <h3>${campaign.campaignName}</h3>
                <p>${campaign.brandName}</p>
            </div>
            <div class="campaign-card-body">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                    <div>
                        <p style="font-size: 12px; color: var(--gray-500);">Total Reach</p>
                        <p style="font-size: 18px; font-weight: 600;">${formatNumber(campaign.totalReach)}</p>
                    </div>
                    <div>
                        <p style="font-size: 12px; color: var(--gray-500);">Engagement</p>
                        <p style="font-size: 18px; font-weight: 600;">${formatNumber(campaign.totalEngagement)}</p>
                    </div>
                    <div>
                        <p style="font-size: 12px; color: var(--gray-500);">Total Views</p>
                        <p style="font-size: 18px; font-weight: 600;">${formatNumber(campaign.totalViews)}</p>
                    </div>
                    <div>
                        <p style="font-size: 12px; color: var(--gray-500);">ROI</p>
                        <p style="font-size: 18px; font-weight: 600;">${campaign.roi || '-'}</p>
                    </div>
                </div>
                <div style="margin-top: 16px;">
                    <p style="font-size: 12px; color: var(--gray-500);">Go Live Date</p>
                    <p>${formatDate(campaign.goLiveDate)}</p>
                </div>
                ${campaign.isRetainer ? '<span class="status-badge success" style="margin-top: 12px;">Retainer</span>' : ''}
            </div>
            <div class="campaign-card-footer">
                <button class="btn btn-sm btn-secondary" onclick="editLiveCampaign(${index})">
                    <i class="fas fa-edit"></i> Edit Metrics
                </button>
                <button class="btn btn-sm btn-warning" onclick="moveToInvoice(${index})">
                    <i class="fas fa-file-invoice-dollar"></i>
                </button>
            </div>
        </div>
    `).join('');
}

async function editLiveCampaign(index) {
    const campaign = appData.liveCampaigns[index];
    
    const reach = prompt('Enter Total Reach:', campaign.totalReach);
    if (reach === null) return;
    
    const engagement = prompt('Enter Total Engagement:', campaign.totalEngagement);
    if (engagement === null) return;
    
    const views = prompt('Enter Total Views:', campaign.totalViews);
    if (views === null) return;
    
    const roi = prompt('Enter ROI:', campaign.roi);
    if (roi === null) return;
    
    appData.liveCampaigns[index].totalReach = parseInt(reach) || 0;
    appData.liveCampaigns[index].totalEngagement = parseInt(engagement) || 0;
    appData.liveCampaigns[index].totalViews = parseInt(views) || 0;
    appData.liveCampaigns[index].roi = roi;
    
    await saveAppData();
    refreshLiveCampaignsGrid();
    
    showToast('Campaign metrics updated', 'success');
}

async function moveToInvoice(index) {
    const campaign = appData.liveCampaigns[index];
    
    const amount = prompt(`Enter invoice amount for ${campaign.campaignName}:`);
    if (!amount) return;
    
    // Add to invoices
    appData.invoices.push({
        id: campaign.id,
        brandId: campaign.brandId,
        brandName: campaign.brandName,
        campaignName: campaign.campaignName,
        closedAt: new Date().toISOString().split('T')[0],
        invoiceAmount: parseFloat(amount),
        isInvoiced: false,
        invoiceStatus: 'Invoice Pending',
        createdAt: new Date().toISOString()
    });
    
    // Remove from live campaigns
    appData.liveCampaigns.splice(index, 1);
    
    await saveAppData();
    refreshAllData();
    
    showToast(`${campaign.campaignName} moved to Invoice Stage`, 'success');
}

// ===== Invoice Stage Table =====
function refreshInvoiceTable() {
    const tbody = document.getElementById('invoiceStageTableBody');
    
    if (appData.invoices.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="empty-state">
                    <p>No invoices yet</p>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = appData.invoices.map((invoice, index) => `
        <tr>
            <td><strong>${invoice.brandName}</strong></td>
            <td>${invoice.campaignName}</td>
            <td>${formatDate(invoice.closedAt)}</td>
            <td>₹${formatNumber(invoice.invoiceAmount)}</td>
            <td>
                <input type="checkbox" ${invoice.isInvoiced ? 'checked' : ''} onchange="toggleInvoiced(${index}, this.checked)">
            </td>
            <td>
                <select class="status-dropdown" onchange="updateInvoiceStatus(${index}, this.value)">
                    <option value="Invoice Pending" ${invoice.invoiceStatus === 'Invoice Pending' ? 'selected' : ''}>Invoice Pending</option>
                    <option value="Invoice Cleared" ${invoice.invoiceStatus === 'Invoice Cleared' ? 'selected' : ''}>Invoice Cleared</option>
                    <option value="Invoice Delayed" ${invoice.invoiceStatus === 'Invoice Delayed' ? 'selected' : ''}>Invoice Delayed</option>
                </select>
            </td>
            <td>
                <button class="btn btn-sm btn-secondary" onclick="editInvoice(${index})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteInvoice(${index})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

async function toggleInvoiced(index, checked) {
    appData.invoices[index].isInvoiced = checked;
    await saveAppData();
    showToast('Invoice status updated', 'success');
}

async function updateInvoiceStatus(index, newStatus) {
    appData.invoices[index].invoiceStatus = newStatus;
    await saveAppData();
    showToast('Invoice status updated', 'success');
}

async function editInvoice(index) {
    const invoice = appData.invoices[index];
    const amount = prompt('Enter new invoice amount:', invoice.invoiceAmount);
    
    if (amount !== null) {
        appData.invoices[index].invoiceAmount = parseFloat(amount) || 0;
        await saveAppData();
        refreshInvoiceTable();
        showToast('Invoice updated', 'success');
    }
}

async function deleteInvoice(index) {
    if (confirm('Are you sure you want to delete this invoice?')) {
        const invoice = appData.invoices[index];
        appData.invoices.splice(index, 1);
        
        await saveAppData();
        refreshAllData();
        
        showToast(`Invoice for ${invoice.campaignName} deleted`, 'success');
    }
}

// ===== All Campaigns Table =====
function refreshAllCampaignsTable() {
    const tbody = document.getElementById('allCampaignsTableBody');
    
    // Combine all campaigns
    let allCampaigns = [];
    
    appData.convertedCampaigns.forEach(c => {
        allCampaigns.push({
            ...c,
            status: 'Converted',
            statusClass: 'converted'
        });
    });
    
    appData.runningCampaigns.forEach(c => {
        allCampaigns.push({
            ...c,
            status: 'Running',
            statusClass: 'running'
        });
    });
    
    appData.liveCampaigns.forEach(c => {
        allCampaigns.push({
            ...c,
            status: 'Live',
            statusClass: 'live'
        });
    });
    
    appData.invoices.forEach(c => {
        allCampaigns.push({
            ...c,
            status: 'Invoice',
            statusClass: 'invoice'
        });
    });
    
    if (allCampaigns.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="empty-state">
                    <p>No campaigns yet</p>
                </td>
            </tr>
        `;
        return;
    }
    
    // Sort by created date
    allCampaigns.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    tbody.innerHTML = allCampaigns.map(campaign => `
        <tr>
            <td><strong>${campaign.campaignName}</strong></td>
            <td>${campaign.brandName}</td>
            <td><span class="status-badge ${campaign.statusClass}">${campaign.status}</span></td>
            <td>${formatDate(campaign.startDate || campaign.goLiveDate || campaign.createdAt)}</td>
            <td>${campaign.isRetainer ? '<i class="fas fa-check-circle text-success"></i> Yes' : '-'}</td>
            <td>
                <button class="btn btn-sm btn-secondary" onclick="viewCampaignDetails('${campaign.id}')">
                    <i class="fas fa-eye"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function viewCampaignDetails(campaignId) {
    // Find campaign across all arrays
    let campaign = appData.convertedCampaigns.find(c => c.id === campaignId) ||
                   appData.runningCampaigns.find(c => c.id === campaignId) ||
                   appData.liveCampaigns.find(c => c.id === campaignId) ||
                   appData.invoices.find(c => c.id === campaignId);
    
    if (campaign) {
        alert(`Campaign: ${campaign.campaignName}\nBrand: ${campaign.brandName}\nPOC: ${campaign.pocName}\nEmail: ${campaign.pocEmail}`);
    }
}
// ===== Creator Database =====
function refreshCreatorDatabase() {
    const tbody = document.getElementById('creatorDatabaseTableBody');
    
    if (appData.creators.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="13" class="empty-state">
                    <p>No creators in database yet</p>
                </td>
            </tr>
        `;
        updateBookmarkedBar();
        return;
    }
    
    tbody.innerHTML = appData.creators.map((creator, index) => `
        <tr>
            <td><input type="checkbox" class="creator-select" data-index="${index}"></td>
            <td>
                <button class="bookmark-btn ${isBookmarked(index) ? 'active' : ''}" onclick="toggleBookmark(${index})">
                    <i class="fas fa-bookmark"></i>
                </button>
            </td>
            <td><strong>${creator.name}</strong></td>
            <td><a href="${creator.link}" target="_blank">@${creator.username}</a></td>
            <td>${formatNumber(creator.followers)}</td>
            <td><span class="status-badge ${getCategoryClass(creator.category)}">${creator.category}</span></td>
            <td>${creator.niche}</td>
            <td>${creator.subniche}</td>
            <td>${creator.state}</td>
            <td>${creator.city}</td>
            <td>${creator.gender}</td>
            <td>${creator.contactNo || creator.email}</td>
            <td>
                <button class="btn btn-sm btn-secondary" onclick="editCreator(${index})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteCreator(${index})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
    
    updateBookmarkedBar();
    initCreatorFilters();
}

function initCreatorFilters() {
    // Search filter
    document.getElementById('creatorSearchInput').addEventListener('input', filterCreators);
    
    // Dropdown filters
    document.getElementById('filterNiche').addEventListener('change', filterCreators);
    document.getElementById('filterCategory').addEventListener('change', filterCreators);
    document.getElementById('filterGender').addEventListener('change', filterCreators);
    document.getElementById('filterState').addEventListener('change', filterCreators);
    
    // Populate state filter
    const states = [...new Set(appData.creators.map(c => c.state).filter(s => s))];
    const stateSelect = document.getElementById('filterState');
    stateSelect.innerHTML = '<option value="">All States</option>' + 
        states.map(s => `<option value="${s}">${s}</option>`).join('');
}

function filterCreators() {
    const searchTerm = document.getElementById('creatorSearchInput').value.toLowerCase();
    const nicheFilter = document.getElementById('filterNiche').value;
    const categoryFilter = document.getElementById('filterCategory').value;
    const genderFilter = document.getElementById('filterGender').value;
    const stateFilter = document.getElementById('filterState').value;
    
    const rows = document.querySelectorAll('#creatorDatabaseTableBody tr');
    
    appData.creators.forEach((creator, index) => {
        const row = rows[index];
        if (!row) return;
        
        const matchesSearch = 
            creator.name.toLowerCase().includes(searchTerm) ||
            creator.username.toLowerCase().includes(searchTerm) ||
            (creator.email && creator.email.toLowerCase().includes(searchTerm));
        
        const matchesNiche = !nicheFilter || creator.niche === nicheFilter;
        const matchesCategory = !categoryFilter || creator.category === categoryFilter;
        const matchesGender = !genderFilter || creator.gender === genderFilter;
        const matchesState = !stateFilter || creator.state === stateFilter;
        
        if (matchesSearch && matchesNiche && matchesCategory && matchesGender && matchesState) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

function resetCreatorFilters() {
    document.getElementById('creatorSearchInput').value = '';
    document.getElementById('filterNiche').value = '';
    document.getElementById('filterCategory').value = '';
    document.getElementById('filterGender').value = '';
    document.getElementById('filterState').value = '';
    
    filterCreators();
}

function toggleSelectAllCreators() {
    const selectAll = document.getElementById('selectAllCreators').checked;
    document.querySelectorAll('.creator-select').forEach(checkbox => {
        checkbox.checked = selectAll;
    });
}

// ===== Bookmark Functions =====
function isBookmarked(index) {
    return appData.bookmarkedCreators.includes(index);
}

async function toggleBookmark(index) {
    const bookmarkIndex = appData.bookmarkedCreators.indexOf(index);
    
    if (bookmarkIndex > -1) {
        appData.bookmarkedCreators.splice(bookmarkIndex, 1);
        showToast('Creator removed from bookmarks', 'info');
    } else {
        appData.bookmarkedCreators.push(index);
        showToast('Creator bookmarked', 'success');
    }
    
    await saveAppData();
    refreshCreatorDatabase();
}

function updateBookmarkedBar() {
    const bar = document.getElementById('bookmarkedCreatorsBar');
    const list = document.getElementById('bookmarkedList');
    const count = document.getElementById('bookmarkCount');
    
    if (appData.bookmarkedCreators.length === 0) {
        bar.style.display = 'none';
        return;
    }
    
    bar.style.display = 'block';
    count.textContent = appData.bookmarkedCreators.length;
    
    list.innerHTML = appData.bookmarkedCreators.map(index => {
        const creator = appData.creators[index];
        if (!creator) return '';
        
        return `
            <span class="bookmarked-item">
                ${creator.name}
                <button class="remove-bookmark" onclick="toggleBookmark(${index})">
                    <i class="fas fa-times"></i>
                </button>
            </span>
        `;
    }).join('');
}

async function clearAllBookmarks() {
    if (confirm('Are you sure you want to clear all bookmarks?')) {
        appData.bookmarkedCreators = [];
        await saveAppData();
        refreshCreatorDatabase();
        showToast('All bookmarks cleared', 'success');
    }
}

// ===== Export Bookmarks to Campaign =====
function openExportBookmarksModal() {
    const exportCount = document.getElementById('exportCreatorCount');
    const optionsContainer = document.getElementById('exportCampaignOptions');
    
    exportCount.textContent = appData.bookmarkedCreators.length;
    
    // Get all campaigns that can receive creators
    const campaigns = [
        ...appData.convertedCampaigns.map(c => ({ id: c.id, name: c.campaignName, brand: c.brandName, type: 'converted' })),
        ...appData.runningCampaigns.map(c => ({ id: c.id, name: c.campaignName, brand: c.brandName, type: 'running' }))
    ];
    
    if (campaigns.length === 0) {
        optionsContainer.innerHTML = `
            <div class="empty-state" style="padding: 20px;">
                <p>No campaigns available. Create a campaign first.</p>
            </div>
        `;
        return;
    }
    
    optionsContainer.innerHTML = campaigns.map(campaign => `
        <div class="export-option" onclick="selectExportCampaign('${campaign.id}', '${campaign.type}', this)">
            <i class="fas fa-rocket"></i>
            <div class="export-option-details">
                <h4>${campaign.name}</h4>
                <p>${campaign.brand}</p>
            </div>
        </div>
    `).join('');
    
    openModal('exportBookmarksModal');
}

let selectedExportCampaign = null;

function selectExportCampaign(campaignId, campaignType, element) {
    // Remove previous selection
    document.querySelectorAll('.export-option').forEach(opt => opt.classList.remove('selected'));
    
    // Add selection to clicked element
    element.classList.add('selected');
    
    selectedExportCampaign = { id: campaignId, type: campaignType };
}

async function exportBookmarksToCampaign() {
    if (!selectedExportCampaign) {
        showToast('Please select a campaign', 'error');
        return;
    }
    
    // Get bookmarked creators
    const creatorsToExport = appData.bookmarkedCreators.map(index => {
        const creator = appData.creators[index];
        return {
            id: creator.id || generateId(),
            name: creator.name,
            username: creator.username,
            followers: creator.followers,
            niche: creator.niche,
            category: creator.category
        };
    });
    
    // Find target campaign and add creators
    let targetCampaign;
    
    if (selectedExportCampaign.type === 'converted') {
        targetCampaign = appData.convertedCampaigns.find(c => c.id === selectedExportCampaign.id);
    } else {
        targetCampaign = appData.runningCampaigns.find(c => c.id === selectedExportCampaign.id);
    }
    
    if (targetCampaign) {
        if (!targetCampaign.creators) {
            targetCampaign.creators = [];
        }
        targetCampaign.creators.push(...creatorsToExport);
        
        // Clear bookmarks
        appData.bookmarkedCreators = [];
        
        await saveAppData();
        refreshAllData();
        
        closeModal('exportBookmarksModal');
        showToast(`${creatorsToExport.length} creators added to ${targetCampaign.campaignName}`, 'success');
    }
    
    selectedExportCampaign = null;
}

// ===== Add Creators to Campaign (from Converted section) =====
function openAddCreatorsToCampaignModal() {
    const campaignSelect = document.getElementById('selectCampaignForCreators');
    const creatorsList = document.getElementById('creatorsForCampaignList');
    
    // Populate campaigns dropdown
    const campaigns = [
        ...appData.convertedCampaigns.map(c => ({ id: c.id, name: c.campaignName })),
        ...appData.runningCampaigns.map(c => ({ id: c.id, name: c.campaignName }))
    ];
    
    campaignSelect.innerHTML = '<option value="">Select a campaign</option>' +
        campaigns.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    
    // Populate creators list
    if (appData.creators.length === 0) {
        creatorsList.innerHTML = `
            <tr>
                <td colspan="5" class="empty-state">
                    <p>No creators available</p>
                </td>
            </tr>
        `;
    } else {
        creatorsList.innerHTML = appData.creators.map((creator, index) => `
            <tr>
                <td><input type="checkbox" class="campaign-creator-select" data-index="${index}"></td>
                <td>${creator.name}</td>
                <td>@${creator.username}</td>
                <td>${formatNumber(creator.followers)}</td>
                <td>${creator.niche}</td>
            </tr>
        `).join('');
    }
    
    // Search functionality
    document.getElementById('searchCreatorsForCampaign').addEventListener('input', function(e) {
        const searchTerm = e.target.value.toLowerCase();
        const rows = document.querySelectorAll('#creatorsForCampaignList tr');
        
        rows.forEach((row, index) => {
            const creator = appData.creators[index];
            if (!creator) return;
            
            const matches = creator.name.toLowerCase().includes(searchTerm) ||
                           creator.username.toLowerCase().includes(searchTerm);
            
            row.style.display = matches ? '' : 'none';
        });
    });
    
    openModal('addCreatorsToCampaignModal');
}

async function addSelectedCreatorsToCampaign() {
    const campaignId = document.getElementById('selectCampaignForCreators').value;
    
    if (!campaignId) {
        showToast('Please select a campaign', 'error');
        return;
    }
    
    // Get selected creators
    const selectedCreators = [];
    document.querySelectorAll('.campaign-creator-select:checked').forEach(checkbox => {
        const index = parseInt(checkbox.dataset.index);
        const creator = appData.creators[index];
        
        selectedCreators.push({
            id: creator.id || generateId(),
            name: creator.name,
            username: creator.username,
            followers: creator.followers,
            niche: creator.niche,
            category: creator.category
        });
    });
    
    if (selectedCreators.length === 0) {
        showToast('Please select at least one creator', 'error');
        return;
    }
    
    // Find target campaign
    let targetCampaign = appData.convertedCampaigns.find(c => c.id === campaignId) ||
                         appData.runningCampaigns.find(c => c.id === campaignId);
    
    if (targetCampaign) {
        if (!targetCampaign.creators) {
            targetCampaign.creators = [];
        }
        targetCampaign.creators.push(...selectedCreators);
        
        await saveAppData();
        refreshAllData();
        
        closeModal('addCreatorsToCampaignModal');
        showToast(`${selectedCreators.length} creators added to campaign`, 'success');
    }
}

// ===== CSV Upload =====
function initCSVDragDrop() {
    const dropArea = document.getElementById('csvDropArea');
    
    if (!dropArea) return;
    
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, preventDefaults, false);
    });
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    ['dragenter', 'dragover'].forEach(eventName => {
        dropArea.addEventListener(eventName, () => {
            dropArea.classList.add('dragover');
        });
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, () => {
            dropArea.classList.remove('dragover');
        });
    });
    
    dropArea.addEventListener('drop', (e) => {
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleCSVFile(files[0]);
        }
    });
}

function handleCSVUpload(event) {
    const file = event.target.files[0];
    if (file) {
        handleCSVFile(file);
    }
}

function handleCSVFile(file) {
    if (!file.name.endsWith('.csv')) {
        showToast('Please upload a CSV file', 'error');
        return;
    }
    
    const reader = new FileReader();
    
    reader.onload = function(e) {
        const content = e.target.result;
        parseCSV(content);
    };
    
    reader.readAsText(file);
}

function parseCSV(content) {
    const lines = content.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) {
        showToast('CSV file is empty or has no data rows', 'error');
        return;
    }
    
    // Parse header
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    
    // Expected headers
    const expectedHeaders = ['name', 'link', 'username', 'followers', 'niche', 'subniche', 'category', 'state', 'city', 'contact no', 'email', 'gender'];
    
    // Parse data rows
    csvData = [];
    
    for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        
        if (values.length < 4) continue; // Skip invalid rows
        
        const row = {};
        headers.forEach((header, index) => {
            row[header] = values[index] ? values[index].trim() : '';
        });
        
        // Map to our data structure
        const followers = parseInt(row.followers) || 0;
        
        csvData.push({
            id: generateId(),
            name: row.name || '',
            link: row.link || '',
            username: row.username ? row.username.replace('@', '') : '',
            followers: followers,
            niche: row.niche || '',
            subniche: row.subniche || '',
            category: row.category || calculateCategory(followers),
            state: row.state || row.states || '',
            city: row.city || '',
            contactNo: row['contact no'] || row.contact || '',
            email: row.email || '',
            gender: row.gender || '',
            avgReelViews: '',
            engagement: '',
            commercials: '',
            createdAt: new Date().toISOString()
        });
    }
    
    // Show preview
    showCSVPreview();
}

function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let char of line) {
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current);
    
    return result;
}

function showCSVPreview() {
    const previewContainer = document.getElementById('csvPreview');
    const previewBody = document.getElementById('csvPreviewBody');
    const rowCount = document.getElementById('csvRowCount');
    const uploadBtn = document.getElementById('uploadCSVBtn');
    
    if (csvData.length === 0) {
        previewContainer.style.display = 'none';
        uploadBtn.disabled = true;
        return;
    }
    
    previewContainer.style.display = 'block';
    rowCount.textContent = csvData.length;
    uploadBtn.disabled = false;
    
    // Show first 5 rows as preview
    const previewRows = csvData.slice(0, 5);
    
    previewBody.innerHTML = previewRows.map(creator => `
        <tr>
            <td>${creator.name}</td>
            <td>@${creator.username}</td>
            <td>${formatNumber(creator.followers)}</td>
            <td>${creator.niche}</td>
        </tr>
    `).join('');
}

async function processCSVUpload() {
    if (csvData.length === 0) {
        showToast('No data to upload', 'error');
        return;
    }
    
    // Add all creators
    appData.creators.push(...csvData);
    
    await saveAppData();
    refreshAllData();
    
    // Reset
    csvData = [];
    document.getElementById('csvPreview').style.display = 'none';
    document.getElementById('uploadCSVBtn').disabled = true;
    document.getElementById('csvFileInput').value = '';
    
    closeModal('csvUploadModal');
    showToast(`${csvData.length} creators uploaded successfully`, 'success');
}

function downloadCSVTemplate() {
    const headers = 'Name,Link,Username,Followers,Niche,Subniche,Category,State,City,Contact No,Email,Gender';
    const sampleRow = 'John Doe,https://instagram.com/johndoe,johndoe,50000,Fashion,Lifestyle,Micro,Maharashtra,Mumbai,9876543210,john@email.com,Male';
    
    const csvContent = `${headers}\n${sampleRow}`;
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'creator_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
    
    showToast('Template downloaded', 'success');
}

function calculateCategory(followers) {
    if (followers < 15000) return 'Nano';
    if (followers < 150000) return 'Micro';
    if (followers < 550000) return 'Macro';
    return 'Mega';
}

// ===== Creator Form Functions =====
function updateSubnicheOptions() {
    const nicheSelect = document.getElementById('creatorNiche');
    const subnicheSelect = document.getElementById('creatorSubniche');
    
    const selectedNiche = nicheSelect.value;
    
    if (!selectedNiche || !subnicheMapping[selectedNiche]) {
        subnicheSelect.innerHTML = '<option value="">Select Subniche</option>';
        return;
    }
    
    const subniches = subnicheMapping[selectedNiche];
    
    subnicheSelect.innerHTML = '<option value="">Select Subniche</option>' +
        subniches.map(s => `<option value="${s}">${s}</option>`).join('');
}

function autoCalculateCategory() {
    const followersInput = document.querySelector('#addCreatorForm input[name="followers"]');
    const categoryInput = document.getElementById('creatorCategory');
    
    if (followersInput && categoryInput) {
        const followers = parseInt(followersInput.value) || 0;
        categoryInput.value = calculateCategory(followers);
    }
}

async function saveCreator() {
    const form = document.getElementById('addCreatorForm');
    const formData = new FormData(form);
    
    const followers = parseInt(formData.get('followers')) || 0;
    
    const creator = {
        id: generateId(),
        name: formData.get('name'),
        username: formData.get('username').replace('@', ''),
        link: formData.get('link'),
        followers: followers,
        niche: formData.get('niche'),
        subniche: formData.get('subniche'),
        category: calculateCategory(followers),
        state: formData.get('state'),
        city: formData.get('city'),
        contactNo: formData.get('contactNo'),
        email: formData.get('email'),
        gender: formData.get('gender'),
        avgReelViews: formData.get('avgReelViews') || '',
        engagement: formData.get('engagement') || '',
        commercials: formData.get('commercials') || '',
        createdAt: new Date().toISOString()
    };
    
    appData.creators.push(creator);
    
    await saveAppData();
    refreshAllData();
    
    form.reset();
    closeModal('addCreatorModal');
    
    showToast(`${creator.name} added to database`, 'success');
}

async function editCreator(index) {
    const creator = appData.creators[index];
    
    const name = prompt('Name:', creator.name);
    if (name === null) return;
    
    const username = prompt('Username:', creator.username);
    if (username === null) return;
    
    const followers = prompt('Followers:', creator.followers);
    if (followers === null) return;
    
    appData.creators[index].name = name;
    appData.creators[index].username = username.replace('@', '');
    appData.creators[index].followers = parseInt(followers) || 0;
    appData.creators[index].category = calculateCategory(parseInt(followers) || 0);
    
    await saveAppData();
    refreshCreatorDatabase();
    
    showToast('Creator updated', 'success');
}

async function deleteCreator(index) {
    if (confirm('Are you sure you want to delete this creator?')) {
        const creator = appData.creators[index];
        
        // Remove from bookmarks if present
        const bookmarkIndex = appData.bookmarkedCreators.indexOf(index);
        if (bookmarkIndex > -1) {
            appData.bookmarkedCreators.splice(bookmarkIndex, 1);
        }
        
        // Update bookmark indices
        appData.bookmarkedCreators = appData.bookmarkedCreators.map(i => i > index ? i - 1 : i);
        
        appData.creators.splice(index, 1);
        
        await saveAppData();
        refreshAllData();
        
        showToast(`${creator.name} deleted`, 'success');
    }
}
// ===== User Management =====
function refreshUserManagement() {
    const container = document.getElementById('userManagementList');
    
    if (appData.users.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-users"></i>
                <h3>No users yet</h3>
                <p>Add team members to get started</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = appData.users.map((user, index) => `
        <div class="user-card">
            <div class="user-card-info">
                <div class="user-card-avatar">${user.name ? user.name.charAt(0).toUpperCase() : 'U'}</div>
                <div class="user-card-details">
                    <h4>${user.name}</h4>
                    <p>${user.email}</p>
                </div>
            </div>
            <div style="display: flex; align-items: center; gap: 12px;">
                <span class="role-badge ${user.role}">${user.role === 'admin' ? 'Admin' : 'User'}</span>
                <div class="user-card-actions">
                    <button class="btn btn-sm btn-secondary" onclick="editUser(${index})">
                        <i class="fas fa-edit"></i>
                    </button>
                    ${user.email !== currentUser.email ? `
                        <button class="btn btn-sm btn-danger" onclick="deleteUser(${index})">
                            <i class="fas fa-trash"></i>
                        </button>
                    ` : ''}
                </div>
            </div>
        </div>
    `).join('');
}

async function saveUser() {
    const form = document.getElementById('addUserForm');
    const formData = new FormData(form);
    
    const name = formData.get('name');
    const email = formData.get('email').toLowerCase();
    const password = formData.get('password');
    const role = formData.get('role');
    const creatorDbAccess = formData.get('creatorDbAccess') === 'on';
    
    // Check if email already exists
    if (appData.users.find(u => u.email.toLowerCase() === email)) {
        showToast('A user with this email already exists', 'error');
        return;
    }
    
    const newUser = {
        id: generateId(),
        name: name,
        email: email,
        password: password,
        role: role,
        createdAt: new Date().toISOString()
    };
    
    appData.users.push(newUser);
    
    // Set access control
    appData.accessControl[newUser.id] = creatorDbAccess;
    
    await saveAppData();
    refreshUserManagement();
    refreshAccessControl();
    
    form.reset();
    closeModal('addUserModal');
    
    showToast(`${name} added successfully`, 'success');
}

async function editUser(index) {
    const user = appData.users[index];
    
    const name = prompt('Full Name:', user.name);
    if (name === null) return;
    
    const email = prompt('Email:', user.email);
    if (email === null) return;
    
    const password = prompt('New Password (leave empty to keep current):', '');
    
    const role = prompt('Role (admin/user):', user.role);
    if (role === null) return;
    
    appData.users[index].name = name;
    appData.users[index].email = email.toLowerCase();
    if (password) {
        appData.users[index].password = password;
    }
    appData.users[index].role = role.toLowerCase() === 'admin' ? 'admin' : 'user';
    
    await saveAppData();
    refreshUserManagement();
    
    showToast('User updated successfully', 'success');
}

async function deleteUser(index) {
    const user = appData.users[index];
    
    if (user.email === currentUser.email) {
        showToast('You cannot delete your own account', 'error');
        return;
    }
    
    if (confirm(`Are you sure you want to delete ${user.name}?`)) {
        // Remove access control entry
        delete appData.accessControl[user.id];
        
        appData.users.splice(index, 1);
        
        await saveAppData();
        refreshUserManagement();
        refreshAccessControl();
        
        showToast(`${user.name} deleted`, 'success');
    }
}

// ===== Access Control =====
function refreshAccessControl() {
    const container = document.getElementById('accessControlList');
    
    // Filter out admin users (they always have access)
    const nonAdminUsers = appData.users.filter(u => u.role !== 'admin');
    
    if (nonAdminUsers.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-lock"></i>
                <h3>No team members to manage</h3>
                <p>Add non-admin users to control their access</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = nonAdminUsers.map(user => {
        const hasAccess = appData.accessControl[user.id] !== false;
        
        return `
            <div class="access-item">
                <div class="access-item-info">
                    <div class="user-card-avatar">${user.name ? user.name.charAt(0).toUpperCase() : 'U'}</div>
                    <div>
                        <h4 style="font-size: 14px; font-weight: 600;">${user.name}</h4>
                        <p style="font-size: 13px; color: var(--gray-500);">${user.email}</p>
                    </div>
                </div>
                <label class="access-toggle">
                    <input type="checkbox" ${hasAccess ? 'checked' : ''} onchange="toggleUserAccess('${user.id}', this.checked)">
                    <span class="slider"></span>
                </label>
            </div>
        `;
    }).join('');
}

async function toggleUserAccess(userId, hasAccess) {
    appData.accessControl[userId] = hasAccess;
    
    await saveAppData();
    
    const user = appData.users.find(u => u.id === userId);
    const status = hasAccess ? 'granted' : 'revoked';
    
    showToast(`Creator Database access ${status} for ${user ? user.name : 'user'}`, 'success');
}

// ===== Populate Dropdowns =====
function populateDropdowns() {
    populateBrandDropdowns();
    populateCampaignDropdowns();
    populateTeamDropdowns();
}

function populateBrandDropdowns() {
    const brandSelects = [
        'hotBrandSelect',
        'warmBrandSelect',
        'convertedBrandSelect'
    ];
    
    brandSelects.forEach(selectId => {
        const select = document.getElementById(selectId);
        if (!select) return;
        
        select.innerHTML = '<option value="">Select a brand</option>' +
            appData.brands.map(brand => `
                <option value="${brand.id}">${brand.brandName}</option>
            `).join('');
    });
}

function populateCampaignDropdowns() {
    // Running campaign dropdown
    const runningSelect = document.getElementById('runningCampaignSelect');
    if (runningSelect) {
        runningSelect.innerHTML = '<option value="">Select a campaign</option>' +
            appData.convertedCampaigns.map(campaign => `
                <option value="${campaign.id}">${campaign.campaignName} (${campaign.brandName})</option>
            `).join('');
    }
    
    // Live campaign dropdown
    const liveSelect = document.getElementById('liveCampaignSelect');
    if (liveSelect) {
        liveSelect.innerHTML = '<option value="">Select a campaign</option>' +
            appData.runningCampaigns.map(campaign => `
                <option value="${campaign.id}">${campaign.campaignName} (${campaign.brandName})</option>
            `).join('');
    }
    
    // Invoice campaign dropdown
    const invoiceSelect = document.getElementById('invoiceCampaignSelect');
    if (invoiceSelect) {
        const allCampaigns = [
            ...appData.runningCampaigns,
            ...appData.liveCampaigns
        ];
        
        invoiceSelect.innerHTML = '<option value="">Select a campaign</option>' +
            allCampaigns.map(campaign => `
                <option value="${campaign.id}">${campaign.campaignName} (${campaign.brandName})</option>
            `).join('');
    }
}

function populateTeamDropdowns() {
    const teamSelects = [
        'hotAflogPoc',
        'warmAflogPoc',
        'hotTaskAssignee',
        'warmTaskAssignee'
    ];
    
    teamSelects.forEach(selectId => {
        const select = document.getElementById(selectId);
        if (!select) return;
        
        select.innerHTML = '<option value="">Select Team Member</option>' +
            appData.users.map(user => `
                <option value="${user.name}">${user.name}</option>
            `).join('');
    });
}

// ===== Auto-fill Functions =====
function autoFillBrandDetails(type) {
    let brandSelect, pocNameInput, pocEmailInput, pocNumberInput, budgetInput;
    
    if (type === 'hot') {
        brandSelect = document.getElementById('hotBrandSelect');
        pocNameInput = document.getElementById('hotPocName');
        pocEmailInput = document.getElementById('hotPocEmail');
        pocNumberInput = document.getElementById('hotPocNumber');
        budgetInput = document.getElementById('hotBudgetStatus');
    } else if (type === 'warm') {
        brandSelect = document.getElementById('warmBrandSelect');
        pocNameInput = document.getElementById('warmPocName');
        pocEmailInput = document.getElementById('warmPocEmail');
        pocNumberInput = document.getElementById('warmPocNumber');
        budgetInput = document.getElementById('warmBudgetStatus');
    } else if (type === 'converted') {
        brandSelect = document.getElementById('convertedBrandSelect');
        pocNameInput = document.getElementById('convertedPocName');
        pocEmailInput = document.getElementById('convertedPocEmail');
        budgetInput = document.getElementById('convertedBudgetStatus');
    }
    
    const brandId = brandSelect.value;
    const brand = appData.brands.find(b => b.id === brandId);
    
    if (brand) {
        if (pocNameInput) pocNameInput.value = brand.pocName;
        if (pocEmailInput) pocEmailInput.value = brand.pocEmail;
        if (pocNumberInput) pocNumberInput.value = brand.pocNumber;
        if (budgetInput) budgetInput.value = brand.budgetStatus;
    } else {
        if (pocNameInput) pocNameInput.value = '';
        if (pocEmailInput) pocEmailInput.value = '';
        if (pocNumberInput) pocNumberInput.value = '';
        if (budgetInput) budgetInput.value = '';
    }
}

function autoFillCampaignDetails(type) {
    let campaignSelect, brandNameInput, pocNameInput;
    
    if (type === 'running') {
        campaignSelect = document.getElementById('runningCampaignSelect');
        brandNameInput = document.getElementById('runningBrandName');
        pocNameInput = document.getElementById('runningPocName');
    } else if (type === 'live') {
        campaignSelect = document.getElementById('liveCampaignSelect');
        brandNameInput = document.getElementById('liveBrandName');
    } else if (type === 'invoice') {
        campaignSelect = document.getElementById('invoiceCampaignSelect');
        brandNameInput = document.getElementById('invoiceBrandName');
    }
    
    const campaignId = campaignSelect.value;
    
    let campaign = appData.convertedCampaigns.find(c => c.id === campaignId) ||
                   appData.runningCampaigns.find(c => c.id === campaignId) ||
                   appData.liveCampaigns.find(c => c.id === campaignId);
    
    if (campaign) {
        if (brandNameInput) brandNameInput.value = campaign.brandName;
        if (pocNameInput) pocNameInput.value = campaign.pocName;
    } else {
        if (brandNameInput) brandNameInput.value = '';
        if (pocNameInput) pocNameInput.value = '';
    }
}

// ===== Save Form Functions =====
async function saveBrand() {
    const form = document.getElementById('addBrandForm');
    const formData = new FormData(form);
    
    const brand = {
        id: generateId(),
        brandName: formData.get('brandName'),
        pocName: formData.get('pocName'),
        pocEmail: formData.get('pocEmail'),
        pocNumber: formData.get('pocNumber'),
        budgetStatus: formData.get('budgetStatus'),
        status: formData.get('status'),
        comments: formData.get('comments'),
        createdAt: new Date().toISOString()
    };
    
    appData.brands.push(brand);
    
    // Auto-add to respective status table
    addToStatusTable(brand, brand.status);
    
    await saveAppData();
    refreshAllData();
    
    form.reset();
    closeModal('addBrandModal');
    
    showToast(`${brand.brandName} added successfully`, 'success');
}

async function saveHotBrand() {
    const form = document.getElementById('addHotBrandForm');
    const formData = new FormData(form);
    
    const brandId = formData.get('brandId');
    const brand = appData.brands.find(b => b.id === brandId);
    
    if (!brand) {
        showToast('Please select a brand', 'error');
        return;
    }
    
    const hotBrand = {
        brandId: brand.id,
        brandName: brand.brandName,
        pocName: brand.pocName,
        pocEmail: brand.pocEmail,
        pocNumber: brand.pocNumber,
        budgetStatus: brand.budgetStatus,
        pipelineStatus: formData.get('pipelineStatus'),
        aflogPoc: formData.get('aflogPoc'),
        hasBrandTool: formData.get('hasBrandTool') === 'on',
        taskAssignee: formData.get('taskAssignee'),
        comments: formData.get('comments'),
        createdAt: new Date().toISOString()
    };
    
    // Check if already exists
    if (appData.hotBrands.find(b => b.brandId === brandId)) {
        showToast('This brand is already in Hot Brands', 'error');
        return;
    }
    
    appData.hotBrands.push(hotBrand);
    
    // Update main brand status
    brand.status = 'Hot Brands';
    
    await saveAppData();
    refreshAllData();
    
    form.reset();
    closeModal('addHotBrandModal');
    
    showToast(`${brand.brandName} added to Hot Brands`, 'success');
}

async function saveWarmBrand() {
    const form = document.getElementById('addWarmBrandForm');
    const formData = new FormData(form);
    
    const brandId = formData.get('brandId');
    const brand = appData.brands.find(b => b.id === brandId);
    
    if (!brand) {
        showToast('Please select a brand', 'error');
        return;
    }
    
    const warmBrand = {
        brandId: brand.id,
        brandName: brand.brandName,
        pocName: brand.pocName,
        pocEmail: brand.pocEmail,
        pocNumber: brand.pocNumber,
        budgetStatus: brand.budgetStatus,
        pipelineStatus: formData.get('pipelineStatus'),
        aflogPoc: formData.get('aflogPoc'),
        hasBrandTool: formData.get('hasBrandTool') === 'on',
        taskAssignee: formData.get('taskAssignee'),
        comments: formData.get('comments'),
        createdAt: new Date().toISOString()
    };
    
    // Check if already exists
    if (appData.warmBrands.find(b => b.brandId === brandId)) {
        showToast('This brand is already in Warm Brands', 'error');
        return;
    }
    
    appData.warmBrands.push(warmBrand);
    
    // Update main brand status
    brand.status = 'Warm Brands';
    
    await saveAppData();
    refreshAllData();
    
    form.reset();
    closeModal('addWarmBrandModal');
    
    showToast(`${brand.brandName} added to Warm Brands`, 'success');
}

async function saveConvertedCampaign() {
    const form = document.getElementById('addConvertedCampaignForm');
    const formData = new FormData(form);
    
    const brandId = formData.get('brandId');
    const brand = appData.brands.find(b => b.id === brandId);
    
    if (!brand) {
        showToast('Please select a brand', 'error');
        return;
    }
    
    const campaign = {
        id: generateId(),
        brandId: brand.id,
        brandName: brand.brandName,
        campaignName: formData.get('campaignName'),
        pocName: brand.pocName,
        pocEmail: brand.pocEmail,
        budgetStatus: brand.budgetStatus,
        pipelineStatus: formData.get('pipelineStatus'),
        comments: formData.get('comments'),
        creators: [],
        createdAt: new Date().toISOString()
    };
    
    appData.convertedCampaigns.push(campaign);
    
    // Update main brand
    brand.status = 'Converted to Campaign';
    brand.campaignName = campaign.campaignName;
    
    await saveAppData();
    refreshAllData();
    
    form.reset();
    closeModal('addConvertedCampaignModal');
    
    showToast(`Campaign "${campaign.campaignName}" created`, 'success');
}

async function saveRunningCampaign() {
    const form = document.getElementById('addRunningCampaignForm');
    const formData = new FormData(form);
    
    const campaignId = formData.get('campaignId');
    const campaign = appData.convertedCampaigns.find(c => c.id === campaignId);
    
    if (!campaign) {
        showToast('Please select a campaign', 'error');
        return;
    }
    
    const runningCampaign = {
        id: campaign.id,
        brandId: campaign.brandId,
        brandName: campaign.brandName,
        campaignName: campaign.campaignName,
        pocName: campaign.pocName,
        pocEmail: campaign.pocEmail,
        currentStatus: formData.get('currentStatus'),
        isRetainer: formData.get('isRetainer') === 'on',
        startDate: formData.get('startDate'),
        comments: formData.get('comments'),
        creators: campaign.creators || [],
        createdAt: new Date().toISOString()
    };
    
    appData.runningCampaigns.push(runningCampaign);
    
    // Remove from converted
    const index = appData.convertedCampaigns.findIndex(c => c.id === campaignId);
    if (index > -1) {
        appData.convertedCampaigns.splice(index, 1);
    }
    
    await saveAppData();
    refreshAllData();
    
    form.reset();
    closeModal('addRunningCampaignModal');
    
    showToast(`${runningCampaign.campaignName} is now running`, 'success');
}

async function saveLiveCampaign() {
    const form = document.getElementById('addLiveCampaignForm');
    const formData = new FormData(form);
    
    const campaignId = formData.get('campaignId');
    const campaign = appData.runningCampaigns.find(c => c.id === campaignId);
    
    if (!campaign) {
        showToast('Please select a campaign', 'error');
        return;
    }
    
    const liveCampaign = {
        id: campaign.id,
        brandId: campaign.brandId,
        brandName: campaign.brandName,
        campaignName: campaign.campaignName,
        pocName: campaign.pocName,
        pocEmail: campaign.pocEmail,
        isRetainer: campaign.isRetainer,
        goLiveDate: formData.get('goLiveDate'),
        totalReach: parseInt(formData.get('totalReach')) || 0,
        totalEngagement: parseInt(formData.get('totalEngagement')) || 0,
        totalViews: parseInt(formData.get('totalViews')) || 0,
        roi: formData.get('roi'),
        reportLink: formData.get('reportLink'),
        creators: campaign.creators || [],
        createdAt: new Date().toISOString()
    };
    
    appData.liveCampaigns.push(liveCampaign);
    
    // Remove from running
    const index = appData.runningCampaigns.findIndex(c => c.id === campaignId);
    if (index > -1) {
        appData.runningCampaigns.splice(index, 1);
    }
    
    await saveAppData();
    refreshAllData();
    
    form.reset();
    closeModal('addLiveCampaignModal');
    
    showToast(`${liveCampaign.campaignName} is now LIVE!`, 'success');
}

async function saveInvoice() {
    const form = document.getElementById('addInvoiceForm');
    const formData = new FormData(form);
    
    const campaignId = formData.get('campaignId');
    
    let campaign = appData.runningCampaigns.find(c => c.id === campaignId) ||
                   appData.liveCampaigns.find(c => c.id === campaignId);
    
    if (!campaign) {
        showToast('Please select a campaign', 'error');
        return;
    }
    
    const invoice = {
        id: campaign.id,
        brandId: campaign.brandId,
        brandName: campaign.brandName,
        campaignName: campaign.campaignName,
        closedAt: formData.get('closedAt'),
        invoiceAmount: parseFloat(formData.get('invoiceAmount')) || 0,
        isInvoiced: formData.get('isInvoiced') === 'on',
        invoiceStatus: formData.get('invoiceStatus'),
        createdAt: new Date().toISOString()
    };
    
    appData.invoices.push(invoice);
    
    await saveAppData();
    refreshAllData();
    
    form.reset();
    closeModal('addInvoiceModal');
    
    showToast(`Invoice created for ${invoice.campaignName}`, 'success');
}

// ===== Modal Functions =====
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        populateDropdowns();
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
    }
}

// Close modal on overlay click
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal-overlay')) {
        e.target.classList.remove('active');
    }
});

// ===== Toast Notifications =====
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <i class="fas ${icons[type]} toast-icon"></i>
        <div class="toast-content">
            <p>${message}</p>
        </div>
        <button class="toast-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    container.appendChild(toast);
    
    // Auto remove after 4 seconds
    setTimeout(() => {
        if (toast.parentElement) {
            toast.remove();
        }
    }, 4000);
}

// ===== Utility Functions =====
function generateId() {
    return 'id_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

function formatDate(dateString) {
    if (!dateString) return '-';
    
    const date = new Date(dateString);
    const options = { day: 'numeric', month: 'short', year: 'numeric' };
    
    return date.toLocaleDateString('en-IN', options);
}

function formatNumber(num) {
    if (!num) return '0';
    
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    
    return num.toString();
}

function getStatusClass(status) {
    const classes = {
        'Hot Brands': 'hot',
        'Warm Brands': 'warm',
        'Lost Brands': 'lost',
        'Converted to Campaign': 'converted',
        'Converted': 'converted',
        'Running': 'running',
        'Live': 'live',
        'Invoice': 'invoice'
    };
    
    return classes[status] || 'info';
}

function getBudgetClass(budget) {
    const classes = {
        'High': 'success',
        'Medium': 'warning',
        'Low': 'danger'
    };
    
    return classes[budget] || 'info';
}

function getCategoryClass(category) {
    const classes = {
        'Nano': 'info',
        'Micro': 'success',
        'Macro': 'warning',
        'Mega': 'danger'
    };
    
    return classes[category] || 'info';
}

// ===== Edit/Delete Brand Functions =====
async function editBrand(index) {
    const brand = appData.brands[index];
    
    const brandName = prompt('Brand Name:', brand.brandName);
    if (brandName === null) return;
    
    const pocName = prompt('POC Name:', brand.pocName);
    if (pocName === null) return;
    
    const pocEmail = prompt('POC Email:', brand.pocEmail);
    if (pocEmail === null) return;
    
    const pocNumber = prompt('POC Number:', brand.pocNumber);
    if (pocNumber === null) return;
    
    appData.brands[index].brandName = brandName;
    appData.brands[index].pocName = pocName;
    appData.brands[index].pocEmail = pocEmail;
    appData.brands[index].pocNumber = pocNumber;
    
    await saveAppData();
    refreshAllData();
    
    showToast('Brand updated successfully', 'success');
}

async function deleteBrand(index) {
    const brand = appData.brands[index];
    
    if (confirm(`Are you sure you want to delete ${brand.brandName}? This will also remove it from all pipeline stages.`)) {
        // Remove from all status tables
        removeFromStatusTable(brand, brand.status);
        
        // Remove from brands
        appData.brands.splice(index, 1);
        
        await saveAppData();
        refreshAllData();
        
        showToast(`${brand.brandName} deleted`, 'success');
    }
}

// ===== Initialize on page load =====
console.log('RAF Campaign Tool - App.js Loaded');
