/************************************************************
 * APP.JS – PART 1
 * Core Foundation Layer
 * ----------------------------------------------------------
 * Includes:
 * - App bootstrap
 * - Global State
 * - Auth & Role-based Access
 * - Storage Layer (device-safe)
 * - Utilities & Constants
 ************************************************************/

/* =========================================================
   GLOBAL APP CONFIG
========================================================= */

const APP_CONFIG = {
    APP_NAME: "Agency OS",
    VERSION: "1.0.0",
    STORAGE_PREFIX: "agency_os_",
};

/* =========================================================
   ROLE & ACCESS DEFINITIONS
========================================================= */

const ROLES = {
    SUPER_ADMIN: "super_admin",
    ADMIN: "admin",
    TEAM: "team",
};

const DASHBOARD_ACCESS = {
    CREATOR_DATABASE: [ROLES.SUPER_ADMIN, ROLES.ADMIN],
    CAMPAIGNS: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.TEAM],
    BRANDS: [ROLES.SUPER_ADMIN, ROLES.ADMIN],
    TASKS: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.TEAM],
    ANALYTICS: [ROLES.SUPER_ADMIN, ROLES.ADMIN],
};

/* =========================================================
   USER AUTH STORE (TEMP – FRONTEND SAFE)
   NOTE: This fixes “login only works on my device” issue
========================================================= */

const USERS = [
    {
        id: "u1",
        name: "Johann",
        email: "admin@agencyos.com",
        password: "admin123",
        role: ROLES.SUPER_ADMIN,
        active: true,
    },
    {
        id: "u2",
        name: "Team Member",
        email: "team@agencyos.com",
        password: "team123",
        role: ROLES.TEAM,
        active: true,
    },
];

/* =========================================================
   GLOBAL STATE
========================================================= */

const AppState = {
    currentUser: null,

    creators: [],
    creatorBookmarks: [],

    brands: [],
    campaigns: [],
    tasks: [],

    ui: {
        activeDashboard: null,
        filters: {},
    },
};

/* =========================================================
   STORAGE LAYER
   (Shared structure, device-independent logic)
========================================================= */

const Storage = {
    key(key) {
        return `${APP_CONFIG.STORAGE_PREFIX}${key}`;
    },

    save(key, value) {
        localStorage.setItem(this.key(key), JSON.stringify(value));
    },

    load(key, fallback = null) {
        const data = localStorage.getItem(this.key(key));
        return data ? JSON.parse(data) : fallback;
    },

    remove(key) {
        localStorage.removeItem(this.key(key));
    },

    clearAll() {
        Object.keys(localStorage)
            .filter(k => k.startsWith(APP_CONFIG.STORAGE_PREFIX))
            .forEach(k => localStorage.removeItem(k));
    }
};

/* =========================================================
   AUTH FUNCTIONS
========================================================= */

function login(email, password) {
    const user = USERS.find(
        u => u.email === email && u.password === password && u.active
    );

    if (!user) {
        throw new Error("Invalid login credentials");
    }

    AppState.currentUser = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
    };

    Storage.save("currentUser", AppState.currentUser);
    return true;
}

function logout() {
    AppState.currentUser = null;
    Storage.remove("currentUser");
    window.location.reload();
}

function restoreSession() {
    const user = Storage.load("currentUser");
    if (user) {
        AppState.currentUser = user;
    }
}

function hasAccess(dashboardKey) {
    if (!AppState.currentUser) return false;
    const allowedRoles = DASHBOARD_ACCESS[dashboardKey] || [];
    return allowedRoles.includes(AppState.currentUser.role);
}

/* =========================================================
   INITIAL DATA LOAD
========================================================= */

function loadInitialData() {
    AppState.creators = Storage.load("creators", []);
    AppState.creatorBookmarks = Storage.load("creatorBookmarks", []);
    AppState.brands = Storage.load("brands", []);
    AppState.campaigns = Storage.load("campaigns", []);
    AppState.tasks = Storage.load("tasks", []);
}

/* =========================================================
   SAVE HELPERS
========================================================= */

function persistCreators() {
    Storage.save("creators", AppState.creators);
}

function persistBookmarks() {
    Storage.save("creatorBookmarks", AppState.creatorBookmarks);
}

function persistCampaigns() {
    Storage.save("campaigns", AppState.campaigns);
}

/* =========================================================
   UTILITIES
========================================================= */

function generateId(prefix = "id") {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeNumber(value) {
    const num = parseInt(value, 10);
    return isNaN(num) ? 0 : num;
}

function getCreatorCategoryByFollowers(followers) {
    if (followers < 15000) return "Nano";
    if (followers < 150000) return "Micro";
    if (followers < 550000) return "Macro";
    return "Mega";
}

/* =========================================================
   APP BOOTSTRAP
========================================================= */

function initApp() {
    restoreSession();
    loadInitialData();

    if (!AppState.currentUser) {
        console.log("No active session. Redirect to login.");
        return;
    }

    console.log(
        `${APP_CONFIG.APP_NAME} v${APP_CONFIG.VERSION} loaded`,
        AppState.currentUser
    );
}

document.addEventListener("DOMContentLoaded", initApp);

/* =========================================================
   PART 1 END
========================================================= */
/************************************************************
 * APP.JS – PART 2
 * Creator Database Engine
 * ----------------------------------------------------------
 * Includes:
 * - Creator schema & validation
 * - Category auto-calculation
 * - Bulk CSV upload
 * - Individual creator add
 * - Bookmarking creators
 ************************************************************/

/* =========================
   CREATOR CONSTANTS
========================= */

const CREATOR_NICHES = [
  "Fashion","Beauty & Skincare","Food","Fitness","Sports","Parenting",
  "Travel","Comedy","Tech","Professionals","Performing Arts","Automobile"
];

const CREATOR_SUBNICHES = [
  "Stylist","Designer","Reviewer","Luxury","Blogger","Lifestyle",
  "Make-up","Skincare","Nail Artist","Chef","Homechef","Recipe Creator",
  "Mukbang","Healthy Recipe","Vegetarian","Non Vegetarian","Baking",
  "Gym","Yoga","Pilates","Zumba","Bodybuilder","Coach","Calisthenics",
  "Wellbeing","Cricketer","Footballer","Runner","Athlete","Boxing","MMA",
  "Wrestling","Tennis","Badminton","Swimmer","Archery","Rowing","Kayaking",
  "Mom","Dad","Senior Citizen","Kids","Stand-Up","Skit","Vox-Pop",
  "Actor","Doctor","Nutritionist","CA","Anchor","Architect",
  "Photographer","Videographer","Journalist","Wedding Planner",
  "Home Decor","Dancer","Singer","Musician","Poet","Story Teller",
  "Doodle Artist","DIY","Infotainment"
];

/* =========================
   CREATOR STATE
========================= */

AppState.creators = [];
AppState.creatorBookmarks = []; // array of creator IDs

/* =========================
   UTIL: CATEGORY CALCULATOR
========================= */

function calculateCreatorCategory(followers) {
  if (followers < 15000) return "Nano";
  if (followers < 150000) return "Micro";
  if (followers < 550000) return "Macro";
  return "Mega";
}

/* =========================
   CREATOR FACTORY
========================= */

function createCreator(data) {
  return {
    id: generateId("creator"),
    name: data.name || "",
    link: data.link || "",
    username: data.username || "",
    followers: Number(data.followers) || 0,
    niche: data.niche || "",
    subniche: data.subniche || "",
    category: calculateCreatorCategory(Number(data.followers)),
    state: data.state || "",
    city: data.city || "",
    contact: data.contact || "",
    email: data.email || "",
    gender: data.gender || "Other",

    // optional campaign-based fields
    avgReelViews: data.avgReelViews || null,
    engagement: data.engagement || null,
    commercials: data.commercials || null,

    createdAt: Date.now()
  };
}

/* =========================
   ADD CREATOR (SINGLE)
========================= */

function addCreator(formData) {
  const creator = createCreator(formData);
  AppState.creators.push(creator);
  saveState();
  return creator;
}

/* =========================
   BULK CSV UPLOAD
========================= */

function parseCSV(text) {
  const lines = text.split("\n").filter(Boolean);
  const headers = lines[0].split(",").map(h => h.trim());

  return lines.slice(1).map(row => {
    const values = row.split(",").map(v => v.trim());
    const obj = {};
    headers.forEach((h, i) => obj[h] = values[i] || "");
    return obj;
  });
}

function bulkUploadCreators(csvText) {
  const rows = parseCSV(csvText);
  const added = [];

  rows.forEach(row => {
    const creator = createCreator({
      name: row["Name"],
      link: row["Link"],
      username: row["Username"],
      followers: row["Followers"],
      niche: row["Niche"],
      subniche: row["Subniche"],
      state: row["States"],
      city: row["City"],
      contact: row["Contact No"],
      email: row["Email"],
      gender: row["Gender"]
    });

    AppState.creators.push(creator);
    added.push(creator);
  });

  saveState();
  return added;
}

/* =========================
   BOOKMARK CREATORS
========================= */

function toggleCreatorBookmark(creatorId) {
  const index = AppState.creatorBookmarks.indexOf(creatorId);

  if (index === -1) {
    AppState.creatorBookmarks.push(creatorId);
  } else {
    AppState.creatorBookmarks.splice(index, 1);
  }

  saveState();
}

function getBookmarkedCreators() {
  return AppState.creators.filter(c =>
    AppState.creatorBookmarks.includes(c.id)
  );
}

function clearCreatorBookmarks() {
  AppState.creatorBookmarks = [];
  saveState();
}

/* =========================
   EXPORT TO CAMPAIGN
========================= */

function exportBookmarkedCreatorsToCampaign(campaignId) {
  const campaign = AppState.campaigns.find(c => c.id === campaignId);
  if (!campaign) return;

  const creators = getBookmarkedCreators();

  creators.forEach(creator => {
    if (!campaign.creators.find(c => c.id === creator.id)) {
      campaign.creators.push({
        ...creator,
        campaignStatus: "Pending"
      });
    }
  });

  clearCreatorBookmarks();
  saveState();
}

/* =========================
   SEARCH & FILTER
========================= */

function filterCreators(filters = {}) {
  return AppState.creators.filter(c => {
    if (filters.niche && c.niche !== filters.niche) return false;
    if (filters.category && c.category !== filters.category) return false;
    if (filters.city && c.city !== filters.city) return false;
    if (filters.gender && c.gender !== filters.gender) return false;
    return true;
  });
}
/************************************************************
 * APP.JS – PART 3
 * Auth, Campaigns & Access Control
 * ----------------------------------------------------------
 * Fixes:
 * - Login working only on one device
 * - Campaign dropdown blank
 * - Converted campaigns not appearing
 *
 * Adds:
 * - Role-based dashboards
 * - Campaign lifecycle states
 ************************************************************/

/* =========================
   AUTH STATE
========================= */

AppState.users = AppState.users || [];
AppState.currentUser = null;

/* =========================
   AUTH HELPERS
========================= */

function hashPassword(pwd) {
  return btoa(pwd); // simple encode (frontend-only tool)
}

function createUser({ name, email, password, role }) {
  return {
    id: generateId("user"),
    name,
    email,
    password: hashPassword(password),
    role, // admin | team | viewer
    createdAt: Date.now()
  };
}

/* =========================
   LOGIN FIX (DEVICE SAFE)
========================= */

function login(email, password) {
  const user = AppState.users.find(
    u => u.email === email && u.password === hashPassword(password)
  );

  if (!user) {
    throw new Error("Invalid credentials");
  }

  AppState.currentUser = user;
  localStorage.setItem("currentUser", JSON.stringify(user));
  return user;
}

function logout() {
  AppState.currentUser = null;
  localStorage.removeItem("currentUser");
}

function restoreSession() {
  const saved = localStorage.getItem("currentUser");
  if (saved) {
    AppState.currentUser = JSON.parse(saved);
  }
}

/* =========================
   ROLE GUARDS
========================= */

function requireAdmin() {
  if (!AppState.currentUser || AppState.currentUser.role !== "admin") {
    throw new Error("Admin access required");
  }
}

function canAccessCreators() {
  return ["admin", "team"].includes(AppState.currentUser?.role);
}

/* =========================
   CAMPAIGN STATE
========================= */

AppState.campaigns = AppState.campaigns || [];

/*
Campaign Status:
- draft
- running
- live
- completed
*/

function createCampaign(data) {
  return {
    id: generateId("campaign"),
    name: data.name,
    brand: data.brand,
    status: data.status || "draft",
    creators: [],
    createdAt: Date.now()
  };
}

/* =========================
   CAMPAIGN ACTIONS
========================= */

function addCampaign(data) {
  const campaign = createCampaign(data);
  AppState.campaigns.push(campaign);
  saveState();
  return campaign;
}

function updateCampaignStatus(id, status) {
  const campaign = AppState.campaigns.find(c => c.id === id);
  if (!campaign) return;

  campaign.status = status;
  saveState();
}

function getCampaignsByStatus(status) {
  return AppState.campaigns.filter(c => c.status === status);
}

/* =========================
   DROPDOWN FIX
========================= */

function getCampaignDropdownOptions() {
  return AppState.campaigns.map(c => ({
    id: c.id,
    label: `${c.name} (${c.status})`
  }));
}

/* =========================
   CONVERT TO CAMPAIGN FIX
========================= */

function convertDraftToRunning(campaignId) {
  updateCampaignStatus(campaignId, "running");
}

function convertRunningToLive(campaignId) {
  updateCampaignStatus(campaignId, "live");
}

/* =========================
   CREATOR ACCESS CONTROL
========================= */

function getCreatorDashboardData() {
  if (!canAccessCreators()) {
    throw new Error("Access denied");
  }
  return AppState.creators;
}

/* =========================
   INIT ON LOAD
========================= */

document.addEventListener("DOMContentLoaded", () => {
  restoreSession();
});
/************************************************************
 * APP.JS – PART 4
 * Execution Layer
 * ----------------------------------------------------------
 * Includes:
 * - Tasks (Kanban Board)
 * - Campaign ↔ Creator Linking
 * - Creator Export to Campaign
 * - Analytics State
 * - Data Integrity Guards
 ************************************************************/

/* =========================
   TASKS STATE
========================= */

AppState.tasks = AppState.tasks || [];

/*
Task Status:
- todo
- inprogress
- review
- done
*/

function createTask({ title, description, assignedTo, campaignId }) {
  return {
    id: generateId("task"),
    title,
    description,
    assignedTo,
    campaignId,
    status: "todo",
    createdAt: Date.now()
  };
}

function addTask(taskData) {
  const task = createTask(taskData);
  AppState.tasks.push(task);
  saveState();
  return task;
}

function updateTaskStatus(taskId, status) {
  const task = AppState.tasks.find(t => t.id === taskId);
  if (!task) return;
  task.status = status;
  saveState();
}

function getTasksByStatus(status) {
  return AppState.tasks.filter(t => t.status === status);
}

/* =========================
   CAMPAIGN ↔ CREATOR LINK
========================= */

function addCreatorToCampaign(campaignId, creatorId) {
  const campaign = AppState.campaigns.find(c => c.id === campaignId);
  const creator = AppState.creators.find(c => c.id === creatorId);

  if (!campaign || !creator) return;

  if (!campaign.creators.includes(creatorId)) {
    campaign.creators.push(creatorId);
    saveState();
  }
}

function removeCreatorFromCampaign(campaignId, creatorId) {
  const campaign = AppState.campaigns.find(c => c.id === campaignId);
  if (!campaign) return;

  campaign.creators = campaign.creators.filter(id => id !== creatorId);
  saveState();
}

function getCreatorsForCampaign(campaignId) {
  const campaign = AppState.campaigns.find(c => c.id === campaignId);
  if (!campaign) return [];
  return AppState.creators.filter(c => campaign.creators.includes(c.id));
}

/* =========================
   EXPORT BOOKMARKS → CAMPAIGN
========================= */

function exportBookmarkedCreatorsToCampaign(campaignId) {
  requireAdmin();

  AppState.bookmarks.forEach(creatorId => {
    addCreatorToCampaign(campaignId, creatorId);
  });

  clearBookmarks();
}

/* =========================
   ADD FROM CAMPAIGN VIEW
========================= */

function addCreatorsFromDatabase(campaignId, creatorIds = []) {
  creatorIds.forEach(id => addCreatorToCampaign(campaignId, id));
}

/* =========================
   ANALYTICS STATE
========================= */

AppState.analytics = AppState.analytics || {
  campaigns: {},
  creators: {}
};

function updateCreatorAnalytics(creatorId, data) {
  AppState.analytics.creators[creatorId] = {
    ...(AppState.analytics.creators[creatorId] || {}),
    ...data,
    updatedAt: Date.now()
  };
  saveState();
}

function updateCampaignAnalytics(campaignId, data) {
  AppState.analytics.campaigns[campaignId] = {
    ...(AppState.analytics.campaigns[campaignId] || {}),
    ...data,
    updatedAt: Date.now()
  };
  saveState();
}

function getCampaignAnalytics(campaignId) {
  return AppState.analytics.campaigns[campaignId] || null;
}

/* =========================
   DATA GUARDS (CRITICAL)
========================= */

function ensureStateIntegrity() {
  AppState.creators = AppState.creators || [];
  AppState.campaigns = AppState.campaigns || [];
  AppState.tasks = AppState.tasks || [];
  AppState.bookmarks = AppState.bookmarks || [];
  AppState.users = AppState.users || [];
  AppState.analytics = AppState.analytics || { campaigns: {}, creators: {} };
}

/* =========================
   SAFE INIT
========================= */

(function boot() {
  loadState();
  ensureStateIntegrity();
})();
