(() => {
  "use strict";

window.addEventListener("error", event => {
  console.error("Nexus startup error:", event.error || event.message);

  const loading = document.getElementById("nexusLoading");
  const message = document.getElementById("loadingMessage");

  if (loading && message) {
    message.textContent =
      `Nexus encountered a JavaScript error: ${event.message}`;
  }
});

  const MODULES = {
    dashboard: {
      title: "Command Dashboard",
      breadcrumb: "Nexus / Command",
      icon: "fa-grid-2",
      permission: "dashboard.view"
    },

    live: {
      title: "Live Operations",
      breadcrumb: "Nexus / Broadcast",
      icon: "fa-satellite-dish",
      permission: "broadcast.view"
    },

    tournament: {
      title: "Event Control",
      breadcrumb: "Nexus / Tournament",
      icon: "fa-trophy",
      permission: "tournaments.manage"
    },

    applications: {
      title: "Application Review",
      breadcrumb: "Nexus / Tournament / Applications",
      icon: "fa-file-signature",
      permission: "applications.manage"
    },

    teams: {
      title: "Team Builder",
      breadcrumb: "Nexus / Tournament / Teams",
      icon: "fa-people-group",
      permission: "teams.manage"
    },

    checkin: {
      title: "Check-In Desk",
      breadcrumb: "Nexus / Tournament / Check-In",
      icon: "fa-user-check",
      permission: "checkin.manage"
    },

    bracket: {
      title: "Bracket & Matches",
      breadcrumb: "Nexus / Tournament / Bracket",
      icon: "fa-diagram-project",
      permission: "bracket.manage"
    },

    predictions: {
      title: "Prediction Operations",
      breadcrumb: "Nexus / Engagement / Predictions",
      icon: "fa-crosshairs",
      permission: "predictions.manage"
    },

    posts: {
      title: "Posts & Announcements",
      breadcrumb: "Nexus / Engagement / Content",
      icon: "fa-newspaper",
      permission: "content.manage"
    },

    giveaways: {
      title: "Giveaways & Rewards",
      breadcrumb: "Nexus / Engagement / Giveaways",
      icon: "fa-gift",
      permission: "giveaways.view"
    },

    players: {
      title: "Player Directory",
      breadcrumb: "Nexus / Community / Players",
      icon: "fa-users",
      permission: "users.view"
    },

    staff: {
      title: "Staff & Access",
      breadcrumb: "Nexus / Community / Staff",
      icon: "fa-user-shield",
      permission: "staff.view"
    },

    diagnostics: {
      title: "System Diagnostics",
      breadcrumb: "Nexus / System / Diagnostics",
      icon: "fa-wave-square",
      permission: "diagnostics.view"
    },

    audit: {
      title: "Audit History",
      breadcrumb: "Nexus / System / Audit",
      icon: "fa-clock-rotate-left",
      permission: "audit.view"
    },

    settings: {
      title: "Nexus Settings",
      breadcrumb: "Nexus / System / Settings",
      icon: "fa-sliders",
      permission: "system.manage"
    }
  };

  /*
   * Phase 1 maps your existing roles.
   *
   * Later, these permissions will be loaded from:
   * staffRoles/{roleId}
   * staffMembers/{uid}
   */
  const ROLE_TEMPLATES = {
    owner: {
      label: "Owner",
      level: 100,
      permissions: ["*"]
    },

    admin: {
      label: "Administrator",
      level: 70,
      permissions: [
        "dashboard.view",
        "broadcast.view",
        "broadcast.control",
        "tournaments.manage",
        "applications.manage",
        "teams.manage",
        "checkin.manage",
        "bracket.manage",
        "predictions.manage",
        "content.manage",
        "giveaways.view",
        "users.view",
        "diagnostics.view",
        "audit.view"
      ]
    }
  };

  const state = {
    user: null,
    userRecord: {},
    playerRecord: {},
    roleId: "",
    role: null,
    activeModule: "dashboard",
    connected: false,
    listenersStarted: false
  };

  let auth;
  let database;
  let toastTimer;

  const elements = {};

  document.addEventListener("DOMContentLoaded", initializeNexus);

  function initializeNexus() {
    cacheElements();

    if (
      typeof firebase === "undefined" ||
      !firebase.apps ||
      firebase.apps.length === 0
    ) {
      showFatalError(
        "Firebase Not Initialized",
        "Nexus could not find your Firebase configuration. Check firebase.js."
      );

      return;
    }

    auth = firebase.auth();
    database = firebase.database();

    bindInterfaceEvents();
    watchFirebaseConnection();

    auth.onAuthStateChanged(handleAuthenticationChange);
  }

  function cacheElements() {
    elements.loading = document.getElementById("nexusLoading");
    elements.loadingMessage = document.getElementById("loadingMessage");

    elements.denied = document.getElementById("nexusDenied");
    elements.deniedMessage = document.getElementById("deniedMessage");

    elements.app = document.getElementById("nexusApp");
    elements.sidebar = document.getElementById("nexusSidebar");
    elements.sidebarBackdrop = document.getElementById("sidebarBackdrop");

    elements.navigation = document.getElementById("nexusNavigation");
    elements.content = document.getElementById("nexusContent");

    elements.pageTitle = document.getElementById("nexusPageTitle");
    elements.breadcrumb = document.getElementById("nexusBreadcrumb");

    elements.connectionDot = document.getElementById("connectionDot");
    elements.connectionLabel = document.getElementById("connectionLabel");

    elements.adminDisplayName =
      document.getElementById("adminDisplayName");

    elements.adminRoleLabel =
      document.getElementById("adminRoleLabel");

    elements.adminAvatar =
      document.getElementById("adminAvatar");

    elements.menuAdminName =
      document.getElementById("menuAdminName");

    elements.menuAdminEmail =
      document.getElementById("menuAdminEmail");

    elements.adminAccountButton =
      document.getElementById("adminAccountButton");

    elements.adminAccountMenu =
      document.getElementById("adminAccountMenu");

    elements.commandOverlay =
      document.getElementById("commandOverlay");

    elements.commandSearchInput =
      document.getElementById("commandSearchInput");

    elements.commandResults =
      document.getElementById("commandResults");

    elements.toast =
      document.getElementById("nexusToast");

    elements.applicationNavCount =
      document.getElementById("applicationNavCount");
  }

  function bindInterfaceEvents() {
    elements.navigation.addEventListener("click", event => {
      const button = event.target.closest("[data-module]");
      if (!button || button.hidden) return;

      openModule(button.dataset.module);
    });

    document
      .getElementById("mobileMenuButton")
      .addEventListener("click", openMobileSidebar);

    document
      .getElementById("closeMobileSidebar")
      .addEventListener("click", closeMobileSidebar);

    elements.sidebarBackdrop.addEventListener(
      "click",
      closeMobileSidebar
    );

    document
      .getElementById("collapseSidebarButton")
      .addEventListener("click", toggleDesktopSidebar);

    document
      .getElementById("commandButton")
      .addEventListener("click", openCommandPalette);

    document
      .getElementById("refreshModuleButton")
      .addEventListener("click", () => {
        openModule(state.activeModule, true);
      });

    elements.commandOverlay.addEventListener("click", event => {
      if (event.target === elements.commandOverlay) {
        closeCommandPalette();
      }
    });

    elements.commandSearchInput.addEventListener(
      "input",
      renderCommandResults
    );

    elements.commandResults.addEventListener("click", event => {
      const command = event.target.closest("[data-command-module]");
      if (!command) return;

      closeCommandPalette();
      openModule(command.dataset.commandModule);
    });

    document.addEventListener("keydown", handleKeyboardShortcuts);

    elements.adminAccountButton.addEventListener("click", event => {
      event.stopPropagation();
      elements.adminAccountMenu.hidden =
        !elements.adminAccountMenu.hidden;
    });

    document.addEventListener("click", () => {
      elements.adminAccountMenu.hidden = true;
    });

    document
      .getElementById("signOutButton")
      .addEventListener("click", signOut);

    document
      .getElementById("deniedSignOutButton")
      .addEventListener("click", signOut);
  }

  async function handleAuthenticationChange(user) {
    elements.loading.hidden = false;
    elements.denied.hidden = true;
    elements.app.hidden = true;

    if (!user) {
      redirectToLogin();
      return;
    }

    state.user = user;

    try {
      setLoadingMessage("Loading your Nexus access profile...");

      const [userSnapshot, playerSnapshot] = await Promise.all([
        database.ref(`users/${user.uid}`).once("value"),
        database.ref(`players/${user.uid}`).once("value")
      ]);

      state.userRecord = userSnapshot.val() || {};
      state.playerRecord = playerSnapshot.val() || {};
      state.roleId = state.userRecord.role || "";
      state.role = ROLE_TEMPLATES[state.roleId] || null;

      if (!state.role) {
        denyAccess(
          "Your account is signed in, but it does not have an approved Nexus staff role."
        );

        return;
      }

      populateAdminIdentity();
      applyNavigationPermissions();

      elements.loading.hidden = true;
      elements.denied.hidden = true;
      elements.app.hidden = false;

      startDashboardListeners();
      openModule("dashboard");
    } catch (error) {
      console.error("Nexus access verification failed:", error);

      const permissionDenied = isPermissionDenied(error);

      denyAccess(
        permissionDenied
          ? "Firebase denied access while Nexus was checking your account role. Confirm users/YOUR_UID/role is set to owner or admin."
          : "Nexus could not verify your account. Check the browser console for the full error."
      );
    }
  }

  function populateAdminIdentity() {
    const name =
      state.playerRecord.displayName ||
      state.userRecord.displayName ||
      state.user.displayName ||
      state.user.email ||
      "Administrator";

    const initials = createInitials(name);

    elements.adminDisplayName.textContent = name;
    elements.adminRoleLabel.textContent = state.role.label;
    elements.adminAvatar.textContent = initials;

    elements.menuAdminName.textContent = name;
    elements.menuAdminEmail.textContent =
      state.user.email || "No email available";
  }

  function applyNavigationPermissions() {
    document
      .querySelectorAll("[data-permission]")
      .forEach(element => {
        const permission = element.dataset.permission;
        element.hidden = !hasPermission(permission);
      });
  }

  function hasPermission(permission) {
    if (!state.role) return false;

    return (
      state.role.permissions.includes("*") ||
      state.role.permissions.includes(permission)
    );
  }

  function openModule(moduleId, forceRefresh = false) {
    const module = MODULES[moduleId];

    if (!module || !hasPermission(module.permission)) {
      showToast("You do not have access to that module.");
      return;
    }

    state.activeModule = moduleId;

    elements.pageTitle.textContent = module.title;
    elements.breadcrumb.textContent = module.breadcrumb;

    document.querySelectorAll(".nav-item").forEach(item => {
      item.classList.toggle(
        "active",
        item.dataset.module === moduleId
      );
    });

    closeMobileSidebar();

    if (moduleId === "dashboard") {
      renderDashboard();
      return;
    }

    if (moduleId === "diagnostics") {
      renderDiagnostics(forceRefresh);
      return;
    }

    renderModulePlaceholder(moduleId);
  }

  function renderDashboard() {
    elements.content.innerHTML = `
      <section class="module-intro">
        <div>
          <h2>Command Dashboard</h2>
          <p>
            Tournament operations, broadcast status, pending work and
            system health in one place.
          </p>
        </div>

        <div class="module-actions">
          <button
            class="action-button action-button-primary"
            data-open-module="live"
          >
            <i class="fa-solid fa-satellite-dish"></i>
            Enter Live Operations
          </button>
        </div>
      </section>

      <section class="dashboard-grid">
        ${createMetricCard(
          "Tournament",
          "dashboardTournament",
          "Loading...",
          "fa-trophy"
        )}

        ${createMetricCard(
          "Current Match",
          "dashboardCurrentMatch",
          "Loading...",
          "fa-circle-play"
        )}

        ${createMetricCard(
          "Pending Applications",
          "dashboardApplications",
          "Checking access...",
          "fa-file-signature"
        )}

        ${createMetricCard(
          "Teams Checked In",
          "dashboardCheckIns",
          "Loading...",
          "fa-user-check"
        )}
      </section>

      <section class="dashboard-layout">
        <article class="nexus-panel">
          <header class="panel-header">
            <h3>Primary Commands</h3>
            <span>Fast Access</span>
          </header>

          <div class="panel-content">
            <div class="command-actions-grid">
              ${createQuickCommand(
                "live",
                "Live Operations",
                "Scores, current match and up next",
                "fa-satellite-dish"
              )}

              ${createQuickCommand(
                "applications",
                "Review Applications",
                "Approve, waitlist or decline teams",
                "fa-file-signature"
              )}

              ${createQuickCommand(
                "teams",
                "Team Builder",
                "Build and manage tournament rosters",
                "fa-people-group"
              )}

              ${createQuickCommand(
                "predictions",
                "Prediction Control",
                "Manage locks, answers and results",
                "fa-crosshairs"
              )}

              ${createQuickCommand(
                "posts",
                "Publish Update",
                "Create an official tournament post",
                "fa-newspaper"
              )}

              ${createQuickCommand(
                "giveaways",
                "Create Giveaway",
                "Reward players or tournament groups",
                "fa-gift"
              )}
            </div>
          </div>
        </article>

        <article class="nexus-panel">
          <header class="panel-header">
            <h3>System Status</h3>
            <span>Live Health</span>
          </header>

          <div id="dashboardSystemStatus" class="panel-content status-list">
            ${createStatusRow(
              "Firebase Connection",
              "Checking realtime connection...",
              "warning",
              "CHECKING"
            )}

         ${createStatusRow(
  "Authentication",
  `Signed in as ${escapeHtml(
    state.user.email || state.user.uid
  )}`,
  "good",
  "ACTIVE"
)}

            ${createStatusRow(
              "Nexus Role",
              escapeHtml(state.role.label),
              "good",
              "AUTHORIZED"
            )}

            ${createStatusRow(
              "Prediction Payout Safety",
              "Legacy client payout is not imported into Nexus",
              "info",
              "PROTECTED"
            )}
          </div>
        </article>
      </section>
    `;

    elements.content
      .querySelectorAll("[data-open-module]")
      .forEach(button => {
        const moduleId = button.dataset.openModule;

        if (
          !MODULES[moduleId] ||
          !hasPermission(MODULES[moduleId].permission)
        ) {
          button.hidden = true;
          return;
        }

        button.addEventListener("click", () => {
          openModule(moduleId);
        });
      });

    updateDashboardValues();
  }

  function renderModulePlaceholder(moduleId) {
    const module = MODULES[moduleId];

    const descriptions = {
      live:
        "Your current admin-live controls will be imported here first as a dedicated iPad-friendly Operations Mode.",

      tournament:
        "Tournament settings, event state, prize pool and public visibility will be managed here.",

      applications:
        "Your admin applications page will become a connected review queue with approval and Team Builder handoff.",

      teams:
        "Your existing Team Builder will be migrated here with roster locking, seeding and team inspection.",

      checkin:
        "Your admin check-in page will become a fast Check-In Desk with missing-team alerts and roster finalization.",

      bracket:
        "The visual bracket, match schedule, results and automatic advancement controls will live here.",

      predictions:
        "Bracket Pick’em and Live Prediction administration will be consolidated here without the unsafe client payout logic.",

      posts:
        "Your current admin posts tools will become a complete content and announcement workspace.",

      giveaways:
        "This module will support all-player RP grants, participant rewards, selected users, crates and claimable giveaways.",

      players:
        "Search players, inspect profiles, view RG Point history and review tournament activity.",

      staff:
        "Assign administrative roles, customize permissions and preview Nexus as another role.",

      audit:
        "Every sensitive Nexus action will eventually create a permanent audit record.",

      settings:
        "Feature flags, Control Center configuration and protected system preferences will be managed here."
    };

    elements.content.innerHTML = `
      <section class="module-intro">
        <div>
          <h2>${escapeHtml(module.title)}</h2>
          <p>${escapeHtml(descriptions[moduleId] || "")}</p>
        </div>
      </section>

      <article class="nexus-panel placeholder-panel">
        <div>
          <div class="placeholder-icon">
            <i class="fa-solid ${escapeHtml(module.icon)}"></i>
          </div>

          <h3>${escapeHtml(module.title)}</h3>

          <p>
            The secure Nexus shell is active. This module is ready for
            its existing admin functionality to be imported.
          </p>
        </div>
      </article>
    `;
  }

  function renderDiagnostics(autoRun = false) {
    elements.content.innerHTML = `
      <section class="module-intro">
        <div>
          <h2>System Diagnostics</h2>
          <p>
            Test which important Firebase collections Nexus can read
            with your current account and database rules.
          </p>
        </div>
      </section>

      <div class="diagnostics-toolbar">
        <button
          id="runDiagnosticsButton"
          class="action-button action-button-primary"
        >
          <i class="fa-solid fa-play"></i>
          Run Diagnostics
        </button>
      </div>

      <article class="nexus-panel">
        <div id="diagnosticsList" class="diagnostics-list">
          ${createDiagnosticRow(
            "auth",
            "Firebase Authentication",
            "Confirm a valid user session exists"
          )}

          ${createDiagnosticRow(
            "role",
            "Administrative Role",
            "Read users/{uid}/role"
          )}

          ${createDiagnosticRow(
            "site",
            "Site Configuration",
            "Read site"
          )}

          ${createDiagnosticRow(
            "broadcast",
            "Broadcast Controls",
            "Read broadcastCountdown"
          )}

          ${createDiagnosticRow(
            "posts",
            "Official Posts",
            "Read officialPosts"
          )}

          ${createDiagnosticRow(
            "applications",
            "Application Collection",
            "Read applications/{currentTournament}"
          )}

          ${createDiagnosticRow(
            "users",
            "Player Account Directory",
            "Read users at the collection level"
          )}
        </div>
      </article>
    `;

    document
      .getElementById("runDiagnosticsButton")
      .addEventListener("click", runDiagnostics);

    if (autoRun) {
      runDiagnostics();
    }
  }

  async function runDiagnostics() {
    const button = document.getElementById("runDiagnosticsButton");

    if (button) {
      button.disabled = true;
      button.innerHTML =
        '<i class="fa-solid fa-spinner fa-spin"></i> Running...';
    }

    setDiagnosticRunning("auth");
    setDiagnosticRunning("role");
    setDiagnosticRunning("site");
    setDiagnosticRunning("broadcast");
    setDiagnosticRunning("posts");
    setDiagnosticRunning("applications");
    setDiagnosticRunning("users");

    const tournamentId =
      await getCurrentTournamentId().catch(() => "open1");

    await runDiagnosticTest("auth", async () => {
      if (!auth.currentUser) {
        throw new Error("No authenticated Firebase user.");
      }

      return auth.currentUser.email || auth.currentUser.uid;
    });

    await runDiagnosticTest("role", async () => {
      const snapshot = await database
        .ref(`users/${state.user.uid}/role`)
        .once("value");

      const role = snapshot.val();

      if (role !== "owner" && role !== "admin") {
        throw new Error(`Unsupported role: ${role || "missing"}`);
      }

      return role;
    });

    await runDiagnosticTest("site", async () => {
      const snapshot = await database.ref("site").once("value");
      return snapshot.exists() ? "Readable" : "Readable, no data";
    });

    await runDiagnosticTest("broadcast", async () => {
      const snapshot = await database
        .ref("broadcastCountdown")
        .once("value");

      return snapshot.exists() ? "Readable" : "Readable, no data";
    });

    await runDiagnosticTest("posts", async () => {
      const snapshot = await database
        .ref("officialPosts")
        .limitToFirst(1)
        .once("value");

      return snapshot.exists() ? "Readable" : "Readable, no posts";
    });

    await runDiagnosticTest("applications", async () => {
      const snapshot = await database
        .ref(`applications/${tournamentId}`)
        .once("value");

      return snapshot.exists()
        ? "Tournament applications readable"
        : "Readable, no applications";
    });

    await runDiagnosticTest("users", async () => {
      const snapshot = await database
        .ref("users")
        .limitToFirst(1)
        .once("value");

      return snapshot.exists()
        ? "Account collection readable"
        : "Readable, no accounts";
    });

    if (button) {
      button.disabled = false;
      button.innerHTML =
        '<i class="fa-solid fa-play"></i> Run Diagnostics';
    }

    showToast("Diagnostics complete.");
  }

  async function runDiagnosticTest(id, test) {
    try {
      const result = await test();
      setDiagnosticResult(id, true, result);
    } catch (error) {
      console.error(`Diagnostic ${id} failed:`, error);

      const message = isPermissionDenied(error)
        ? "Permission denied by Firebase rules"
        : error.message || "Test failed";

      setDiagnosticResult(id, false, message);
    }
  }

  function setDiagnosticRunning(id) {
    const row = document.querySelector(
      `[data-diagnostic="${id}"]`
    );

    if (!row) return;

    row.className = "diagnostic-row running";

    row.querySelector(".diagnostic-icon").innerHTML =
      '<i class="fa-solid fa-spinner fa-spin"></i>';

    row.querySelector(".diagnostic-result").textContent =
      "Testing";
  }

  function setDiagnosticResult(id, success, message) {
    const row = document.querySelector(
      `[data-diagnostic="${id}"]`
    );

    if (!row) return;

    row.className =
      `diagnostic-row ${success ? "success" : "failure"}`;

    row.querySelector(".diagnostic-icon").innerHTML = success
      ? '<i class="fa-solid fa-check"></i>'
      : '<i class="fa-solid fa-xmark"></i>';

    row.querySelector(".diagnostic-copy span").textContent =
      message;

    row.querySelector(".diagnostic-result").textContent =
      success ? "Passed" : "Blocked";
  }

  function startDashboardListeners() {
    if (state.listenersStarted) return;
    state.listenersStarted = true;

    database.ref("site").on(
      "value",
      snapshot => {
        window.nexusSiteData = snapshot.val() || {};

        if (state.activeModule === "dashboard") {
          updateDashboardValues();
        }

        updatePendingApplicationCount();
      },
      error => {
        console.error("Unable to read site:", error);
      }
    );

    database.ref("broadcastCountdown").on(
      "value",
      snapshot => {
        window.nexusBroadcastData = snapshot.val() || {};

        if (state.activeModule === "dashboard") {
          updateDashboardValues();
        }
      },
      error => {
        console.error("Unable to read broadcast data:", error);
      }
    );
  }

  async function updateDashboardValues() {
    const site = window.nexusSiteData || {};
    const broadcast = window.nexusBroadcastData || {};

    setText(
      "dashboardTournament",
      site.eventName || site.currentTournament || "No Tournament"
    );

    setText(
      "dashboardCurrentMatch",
      site.currentMatch || "No Match Live"
    );

    const upNext = broadcast.upNext || {};

    setText(
      "dashboardTournamentDetail",
      normalizeStatus(site.status || "Status unavailable")
    );

    setText(
      "dashboardCurrentMatchDetail",
      upNext.teamA && upNext.teamB
        ? `Up next: ${upNext.teamA} vs ${upNext.teamB}`
        : "No upcoming match set"
    );

    updateConnectionStatusRow();
    updatePendingApplicationCount();
    updateCheckInCount();
  }

  async function updatePendingApplicationCount() {
    const valueElement =
      document.getElementById("dashboardApplications");

    const detailElement =
      document.getElementById("dashboardApplicationsDetail");

    if (!valueElement) return;

    try {
      const tournamentId = await getCurrentTournamentId();

      const snapshot = await database
        .ref(`applications/${tournamentId}`)
        .once("value");

      let pending = 0;

      snapshot.forEach(child => {
        const application = child.val() || {};

        if (
          !application.status ||
          application.status === "pending"
        ) {
          pending += 1;
        }
      });

      valueElement.textContent = pending;
      detailElement.textContent =
        pending === 1
          ? "1 application awaiting review"
          : `${pending} applications awaiting review`;

      elements.applicationNavCount.textContent = pending;
      elements.applicationNavCount.hidden = pending === 0;
    } catch (error) {
      valueElement.textContent = "Blocked";
      detailElement.textContent = isPermissionDenied(error)
        ? "Firebase parent read denied"
        : "Unable to load applications";

      elements.applicationNavCount.hidden = true;
    }
  }

  async function updateCheckInCount() {
    const valueElement =
      document.getElementById("dashboardCheckIns");

    const detailElement =
      document.getElementById("dashboardCheckInsDetail");

    if (!valueElement) return;

    try {
      const tournamentId = await getCurrentTournamentId();

      const snapshot = await database
        .ref(`checkIns/${tournamentId}`)
        .once("value");

      let total = 0;
      let checkedIn = 0;

      snapshot.forEach(child => {
        total += 1;

        const checkIn = child.val();

        if (
          checkIn === true ||
          checkIn?.checkedIn === true ||
          checkIn?.status === "checkedIn"
        ) {
          checkedIn += 1;
        }
      });

      valueElement.textContent = `${checkedIn}/${total || 0}`;
      detailElement.textContent =
        total > 0
          ? `${total - checkedIn} still awaiting check-in`
          : "No check-in records yet";
    } catch (error) {
      valueElement.textContent = "Blocked";
      detailElement.textContent = isPermissionDenied(error)
        ? "Firebase read denied"
        : "Unable to load check-ins";
    }
  }

  async function getCurrentTournamentId() {
    const site = window.nexusSiteData;

    if (site?.currentTournament) {
      return site.currentTournament;
    }

    const snapshot = await database
      .ref("site/currentTournament")
      .once("value");

    return snapshot.val() || "open1";
  }

  function watchFirebaseConnection() {
    database.ref(".info/connected").on("value", snapshot => {
      state.connected = snapshot.val() === true;

      elements.connectionDot.classList.toggle(
        "online",
        state.connected
      );

      elements.connectionDot.classList.toggle(
        "offline",
        !state.connected
      );

      elements.connectionLabel.textContent =
        state.connected ? "Connected" : "Disconnected";

      updateConnectionStatusRow();
    });
  }

  function updateConnectionStatusRow() {
    const statusContainer =
      document.getElementById("dashboardSystemStatus");

    if (!statusContainer) return;

    const firstRow = statusContainer.querySelector(".status-row");

    if (!firstRow) return;

    const dot = firstRow.querySelector(".status-dot");
    const detail = firstRow.querySelector("small");
    const result = firstRow.querySelector("em");

    dot.className =
      `status-dot ${state.connected ? "good" : "bad"}`;

    detail.textContent = state.connected
      ? "Realtime Database connection is active"
      : "Realtime Database is disconnected";

    result.textContent =
      state.connected ? "ONLINE" : "OFFLINE";
  }

  function openCommandPalette() {
    elements.commandOverlay.hidden = false;
    elements.commandSearchInput.value = "";
    renderCommandResults();

    requestAnimationFrame(() => {
      elements.commandSearchInput.focus();
    });
  }

  function closeCommandPalette() {
    elements.commandOverlay.hidden = true;
  }

  function renderCommandResults() {
    const query =
      elements.commandSearchInput.value.trim().toLowerCase();

    const availableModules = Object.entries(MODULES)
      .filter(([, module]) => hasPermission(module.permission))
      .filter(([, module]) => {
        if (!query) return true;

        return (
          module.title.toLowerCase().includes(query) ||
          module.breadcrumb.toLowerCase().includes(query)
        );
      });

    if (availableModules.length === 0) {
      elements.commandResults.innerHTML = `
        <div class="command-empty">
          No Nexus commands match that search.
        </div>
      `;

      return;
    }

    elements.commandResults.innerHTML = availableModules
      .map(([id, module]) => `
        <button
          class="command-result"
          data-command-module="${escapeHtml(id)}"
        >
          <i class="fa-solid ${escapeHtml(module.icon)}"></i>

          <div>
            <strong>${escapeHtml(module.title)}</strong>
            <small>${escapeHtml(module.breadcrumb)}</small>
          </div>

          <i class="fa-solid fa-arrow-right"></i>
        </button>
      `)
      .join("");
  }

  function handleKeyboardShortcuts(event) {
    const commandShortcut =
      (event.metaKey || event.ctrlKey) &&
      event.key.toLowerCase() === "k";

    if (commandShortcut) {
      event.preventDefault();

      if (elements.commandOverlay.hidden) {
        openCommandPalette();
      } else {
        closeCommandPalette();
      }

      return;
    }

    if (
      event.key === "Escape" &&
      !elements.commandOverlay.hidden
    ) {
      closeCommandPalette();
    }
  }

  function openMobileSidebar() {
    elements.app.classList.add("mobile-sidebar-open");
  }

  function closeMobileSidebar() {
    elements.app.classList.remove("mobile-sidebar-open");
  }

  function toggleDesktopSidebar() {
    elements.app.classList.toggle("sidebar-collapsed");

    localStorage.setItem(
      "nexusSidebarCollapsed",
      elements.app.classList.contains("sidebar-collapsed")
        ? "1"
        : "0"
    );
  }

  async function signOut() {
    try {
      await auth.signOut();
    } catch (error) {
      console.error("Sign-out failed:", error);
      showToast("Unable to sign out.");
    }
  }

  function redirectToLogin() {
    const returnPath =
      window.location.pathname +
      window.location.search +
      window.location.hash;

    window.location.replace(
      `login.html?redirect=${encodeURIComponent(returnPath)}`
    );
  }

  function denyAccess(message) {
    elements.loading.hidden = true;
    elements.app.hidden = true;
    elements.denied.hidden = false;
    elements.deniedMessage.textContent = message;
  }

  function showFatalError(title, message) {
    elements.loading.innerHTML = `
      <div class="state-icon state-icon-danger">
        <i class="fa-solid fa-triangle-exclamation"></i>
      </div>

      <p class="eyebrow">NEXUS ERROR</p>
      <h1>${escapeHtml(title)}</h1>
      <p>${escapeHtml(message)}</p>
    `;
  }

  function setLoadingMessage(message) {
    elements.loadingMessage.textContent = message;
  }

  function showToast(message) {
    clearTimeout(toastTimer);

    elements.toast.textContent = message;
    elements.toast.classList.add("show");

    toastTimer = setTimeout(() => {
      elements.toast.classList.remove("show");
    }, 2500);
  }

  function setText(id, value) {
    const element = document.getElementById(id);

    if (element) {
      element.textContent = value;
    }
  }

  function isPermissionDenied(error) {
    const code = String(error?.code || "").toLowerCase();
    const message = String(error?.message || "").toLowerCase();

    return (
      code.includes("permission-denied") ||
      message.includes("permission_denied") ||
      message.includes("permission denied")
    );
  }

  function createInitials(value) {
    return String(value || "RG")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part[0])
      .join("")
      .toUpperCase();
  }

  function normalizeStatus(value) {
    return String(value || "")
      .replace("●", "")
      .trim();
  }

  function createMetricCard(label, id, detail, icon) {
    return `
      <article class="metric-card">
        <div class="metric-card-top">
          <span class="metric-label">${escapeHtml(label)}</span>

          <span class="metric-icon">
            <i class="fa-solid ${escapeHtml(icon)}"></i>
          </span>
        </div>

        <strong id="${escapeHtml(id)}" class="metric-value">—</strong>

        <span
          id="${escapeHtml(id)}Detail"
          class="metric-detail"
        >
          ${escapeHtml(detail)}
        </span>
      </article>
    `;
  }

  function createQuickCommand(
    moduleId,
    title,
    detail,
    icon
  ) {
    return `
      <button
        class="quick-command"
        data-open-module="${escapeHtml(moduleId)}"
      >
        <i class="fa-solid ${escapeHtml(icon)}"></i>

        <div>
          <strong>${escapeHtml(title)}</strong>
          <span>${escapeHtml(detail)}</span>
        </div>
      </button>
    `;
  }

  function createStatusRow(
    title,
    detail,
    status,
    result
  ) {
    return `
      <div class="status-row">
        <span class="status-dot ${escapeHtml(status)}"></span>

        <div>
          <strong>${escapeHtml(title)}</strong>
          <small>${detail}</small>
        </div>

        <em>${escapeHtml(result)}</em>
      </div>
    `;
  }

  function createDiagnosticRow(id, title, detail) {
    return `
      <div
        class="diagnostic-row"
        data-diagnostic="${escapeHtml(id)}"
      >
        <span class="diagnostic-icon">
          <i class="fa-solid fa-minus"></i>
        </span>

        <div class="diagnostic-copy">
          <strong>${escapeHtml(title)}</strong>
          <span>${escapeHtml(detail)}</span>
        </div>

        <span class="diagnostic-result">Not tested</span>
      </div>
    `;
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  window.addEventListener("unhandledrejection", event => {
    console.error("Unhandled Nexus promise rejection:", event.reason);
  });
})();
