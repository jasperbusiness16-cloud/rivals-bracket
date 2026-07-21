(() => {
  "use strict";

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
    reports: {
  title: "Reports & Substitutions",
  breadcrumb: "Tournament Operations / Reports & Substitutions",
  icon: "fa-solid fa-triangle-exclamation",
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

  const LIVE_MATCHES = [
    "No Match Live",
    "R16-1 • Bo3",
    "R16-2 • Bo3",
    "R16-3 • Bo3",
    "R16-4 • Bo3",
    "R16-5 • Bo3",
    "R16-6 • Bo3",
    "R16-7 • Bo3",
    "R16-8 • Bo3",
    "QF1 • Bo3",
    "QF2 • Bo3",
    "QF3 • Bo3",
    "QF4 • Bo3",
    "SF1 • Bo3",
    "SF2 • Bo3",
    "Grand Finals • Bo5"
  ];

  const state = {
    user: null,
    userRecord: {},
    playerRecord: {},
    roleId: "",
    role: null,
    activeModule: "dashboard",
    connected: false,
    listenersStarted: false,

    liveDraft: {
      currentMatchId: "No Match Live",
      teamAScore: 0,
      teamBScore: 0,

      nextMatch: {
        label: "",
        teamA: "",
        teamB: ""
      },

      dirty: false
    }
  };

  const elements = {};

  let auth;
  let database;
  let toastTimer;
  let startupComplete = false;

  window.addEventListener("error", event => {
    console.error(
      "Nexus startup error:",
      event.error || event.message
    );

    if (startupComplete) return;

    const message = document.getElementById("loadingMessage");

    if (message) {
      message.textContent =
        `Nexus JavaScript error: ${
          event.message || "Unknown error"
        }`;
    }
  });

  window.addEventListener("unhandledrejection", event => {
    console.error(
      "Unhandled Nexus promise rejection:",
      event.reason
    );
  });

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      initializeNexus,
      { once: true }
    );
  } else {
    initializeNexus();
  }

  function initializeNexus() {
    try {
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

      auth.onAuthStateChanged(
        handleAuthenticationChange,
        error => {
          console.error(
            "Authentication observer failed:",
            error
          );

          showFatalError(
            "Authentication Failed",
            error.message ||
              "Firebase Authentication did not respond."
          );
        }
      );
    } catch (error) {
      console.error(
        "Nexus initialization failed:",
        error
      );

      showFatalError(
        "Nexus Startup Failed",
        error.message ||
          "An unknown startup error occurred."
      );
    }
  }

  function cacheElements() {
    elements.loading =
      document.getElementById("nexusLoading");

    elements.loadingMessage =
      document.getElementById("loadingMessage");

    elements.denied =
      document.getElementById("nexusDenied");

    elements.deniedMessage =
      document.getElementById("deniedMessage");

    elements.app =
      document.getElementById("nexusApp");

    elements.sidebar =
      document.getElementById("nexusSidebar");

    elements.sidebarBackdrop =
      document.getElementById("sidebarBackdrop");

    elements.navigation =
      document.getElementById("nexusNavigation");

    elements.content =
      document.getElementById("nexusContent");

    elements.pageTitle =
      document.getElementById("nexusPageTitle");

    elements.breadcrumb =
      document.getElementById("nexusBreadcrumb");

    elements.connectionDot =
      document.getElementById("connectionDot");

    elements.connectionLabel =
      document.getElementById("connectionLabel");

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
    elements.navigation.addEventListener(
      "click",
      event => {
        const button =
          event.target.closest("[data-module]");

        if (!button || button.hidden) return;

        openModule(button.dataset.module);
      }
    );

    document
      .getElementById("mobileMenuButton")
      .addEventListener(
        "click",
        openMobileSidebar
      );

    document
      .getElementById("closeMobileSidebar")
      .addEventListener(
        "click",
        closeMobileSidebar
      );

    elements.sidebarBackdrop.addEventListener(
      "click",
      closeMobileSidebar
    );

    document
      .getElementById("collapseSidebarButton")
      .addEventListener(
        "click",
        toggleDesktopSidebar
      );

    document
      .getElementById("commandButton")
      .addEventListener(
        "click",
        openCommandPalette
      );

    document
      .getElementById("refreshModuleButton")
      .addEventListener("click", () => {
        openModule(state.activeModule, true);
      });

    elements.commandOverlay.addEventListener(
      "click",
      event => {
        if (event.target === elements.commandOverlay) {
          closeCommandPalette();
        }
      }
    );

    elements.commandSearchInput.addEventListener(
      "input",
      renderCommandResults
    );

    elements.commandResults.addEventListener(
      "click",
      event => {
        const command = event.target.closest(
          "[data-command-module]"
        );

        if (!command) return;

        closeCommandPalette();
        openModule(command.dataset.commandModule);
      }
    );

    elements.adminAccountButton.addEventListener(
      "click",
      event => {
        event.stopPropagation();

        elements.adminAccountMenu.hidden =
          !elements.adminAccountMenu.hidden;
      }
    );

    document.addEventListener("click", () => {
      elements.adminAccountMenu.hidden = true;
    });

    document.addEventListener(
      "keydown",
      handleKeyboardShortcuts
    );

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
      setLoadingMessage(
        "Loading your Nexus access profile..."
      );

      const [userSnapshot, playerSnapshot] =
        await Promise.all([
          database
            .ref(`users/${user.uid}`)
            .once("value"),

          database
            .ref(`players/${user.uid}`)
            .once("value")
        ]);

      state.userRecord =
        userSnapshot.val() || {};

      state.playerRecord =
        playerSnapshot.val() || {};

      state.roleId =
        state.userRecord.role || "";

      state.role =
        ROLE_TEMPLATES[state.roleId] || null;

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

      startupComplete = true;

      startDashboardListeners();
      openModule("dashboard");
    } catch (error) {
      console.error(
        "Nexus access verification failed:",
        error
      );

      denyAccess(
        isPermissionDenied(error)
          ? "Firebase denied access while Nexus checked your account role. Confirm users/YOUR_UID/role is owner or admin."
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

    elements.adminDisplayName.textContent = name;
    elements.adminRoleLabel.textContent =
      state.role.label;

    elements.adminAvatar.textContent =
      createInitials(name);

    elements.menuAdminName.textContent = name;

    elements.menuAdminEmail.textContent =
      state.user.email ||
      "No email available";
  }

  function applyNavigationPermissions() {
    document
      .querySelectorAll("[data-permission]")
      .forEach(element => {
        element.hidden =
          !hasPermission(
            element.dataset.permission
          );
      });
  }

  function hasPermission(permission) {
    if (!state.role) return false;

    return (
      state.role.permissions.includes("*") ||
      state.role.permissions.includes(permission)
    );
  }

  function openModule(
    moduleId,
    forceRefresh = false
  ) {
    const module = MODULES[moduleId];

    if (
      !module ||
      !hasPermission(module.permission)
    ) {
      showToast(
        "You do not have access to that module."
      );

      return;
    }

    cleanupLiveModuleEvents();

if (
  window.NexusApplications &&
  typeof window.NexusApplications.cleanup === "function"
) {
  window.NexusApplications.cleanup();
}
if (
  window.NexusTeamBuilder &&
  typeof window.NexusTeamBuilder.cleanup === "function"
) {
  window.NexusTeamBuilder.cleanup();
}
if (
  window.NexusCheckIn &&
  typeof window.NexusCheckIn.cleanup === "function"
) {
  window.NexusCheckIn.cleanup();
}
if (
  window.NexusReports &&
  typeof window.NexusReports.cleanup === "function"
) {
  window.NexusReports.cleanup();
}

if (
  window.NexusEventControl &&
  typeof window.NexusEventControl.cleanup === "function"
) {
  window.NexusEventControl.cleanup();
}

state.activeModule = moduleId;

    elements.pageTitle.textContent =
      module.title;

    elements.breadcrumb.textContent =
      module.breadcrumb;

    document
      .querySelectorAll(".nav-item")
      .forEach(item => {
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

    if (moduleId === "live") {
  renderLiveOperations();
  return;
}

if (moduleId === "tournament") {
  if (
    !window.NexusEventControl ||
    typeof window.NexusEventControl.render !== "function"
  ) {
    showToast("The Event Control module failed to load.");
    renderModulePlaceholder(moduleId);
    return;
  }

  window.NexusEventControl.render({
    database,
    content: elements.content,
    currentUser: auth.currentUser,
    roleId: state.roleId,
    showToast,
    openModule,
    getCurrentTournamentId,
    escapeHtml,
    isPermissionDenied
  });

  return;
}

if (moduleId === "applications") {
  if (
    !window.NexusApplications ||
    typeof window.NexusApplications.render !== "function"
  ) {
    showToast("The Applications module failed to load.");
    renderModulePlaceholder(moduleId);
    return;
  }

  window.NexusApplications.render({
    database,
    content: elements.content,
    currentUser: auth.currentUser,
    showToast,
    openModule,
    getCurrentTournamentId,
    escapeHtml,
    isPermissionDenied
  });

  return;
}

if (moduleId === "teams") {
  if (
    !window.NexusTeamBuilder ||
    typeof window.NexusTeamBuilder.render !== "function"
  ) {
    showToast("The Team Builder module failed to load.");
    renderModulePlaceholder(moduleId);
    return;
  }

  window.NexusTeamBuilder.render({
    database,
    content: elements.content,
    currentUser: auth.currentUser,
    roleId: state.roleId,
    showToast,
    openModule,
    getCurrentTournamentId,
    escapeHtml,
    isPermissionDenied
  });

  return;
}

if (moduleId === "checkin") {
  if (
    !window.NexusCheckIn ||
    typeof window.NexusCheckIn.render !== "function"
  ) {
    showToast("The Check-In module failed to load.");
    renderModulePlaceholder(moduleId);
    return;
  }

  window.NexusCheckIn.render({
    database,
    content: elements.content,
    currentUser: auth.currentUser,
    roleId: state.roleId,
    showToast,
    openModule,
    getCurrentTournamentId,
    escapeHtml,
    isPermissionDenied
  });

  return;
}

if (moduleId === "reports") {
  if (
    !window.NexusReports ||
    typeof window.NexusReports.render !== "function"
  ) {
    showToast("The Reports module failed to load.");
    renderModulePlaceholder(moduleId);
    return;
  }

  window.NexusReports.render({
    database,
    content: elements.content,
    currentUser: auth.currentUser,
    roleId: state.roleId,
    showToast,
    openModule,
    getCurrentTournamentId,
    escapeHtml,
    isPermissionDenied
  });

  return;
}

if (moduleId === "diagnostics") {
      renderDiagnostics(forceRefresh);
      return;
    }

    renderModulePlaceholder(moduleId);
  }

  function cleanupLiveModuleEvents() {
    if (!elements.content) return;

    elements.content.removeEventListener(
      "click",
      handleLiveOperationsClick
    );

    elements.content.removeEventListener(
      "change",
      handleLiveOperationsChange
    );
  }

  function renderDashboard() {
    elements.content.innerHTML = `
      <section class="module-intro">
        <div>
          <h2>Command Dashboard</h2>
          <p>
            Tournament operations, broadcast status,
            pending work and system health in one place.
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

          <div
            id="dashboardSystemStatus"
            class="panel-content status-list"
          >
            ${createStatusRow(
              "Firebase Connection",
              "Checking realtime connection...",
              "warning",
              "CHECKING"
            )}

            ${createStatusRow(
              "Authentication",
              `Signed in as ${escapeHtml(
                state.user.email ||
                state.user.uid
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
        const moduleId =
          button.dataset.openModule;

        if (
          !MODULES[moduleId] ||
          !hasPermission(
            MODULES[moduleId].permission
          )
        ) {
          button.hidden = true;
          return;
        }

        button.addEventListener(
          "click",
          () => openModule(moduleId)
        );
      });

    updateDashboardValues();
  }

  function renderLiveOperations() {
    elements.content.innerHTML = `
      <section class="module-intro">
        <div>
          <h2>Live Operations</h2>
          <p>
            Fast tournament controls for current match,
            scores, Up Next, broadcast status and break timers.
          </p>
        </div>

        <div class="module-actions">
          <button
            id="toggleOperationsModeButton"
            class="action-button"
          >
            <i class="fa-solid fa-expand"></i>
            Focus Mode
          </button>
        </div>
      </section>

      <div class="live-safety-note">
        <i class="fa-solid fa-shield-halved"></i>

        <div>
          <strong>
            Prediction payout protection is active.
          </strong>

          Match results save normally, but Nexus
          will not distribute prediction RP until
          the secure payout system is added.
        </div>
      </div>

      <section class="live-ops-layout">

        <div class="live-ops-stack">

          <article class="nexus-panel">
            <header class="panel-header">
              <h3>Current Match</h3>

              <span
                id="liveSaveState"
                class="live-save-state"
              >
                Synced with Firebase
              </span>
            </header>

            <div class="live-panel-content">

              <label
                class="live-field-label"
                for="liveCurrentMatchSelect"
              >
                Match
              </label>

              <div class="live-match-toolbar">

                <select
                  id="liveCurrentMatchSelect"
                  class="live-select"
                >
                  ${LIVE_MATCHES.map(match => `
                    <option value="${escapeHtml(match)}">
                      ${escapeHtml(match)}
                    </option>
                  `).join("")}
                </select>

                <button
                  id="setCurrentMatchButton"
                  class="action-button action-button-primary"
                >
                  <i class="fa-solid fa-bolt"></i>
                  Set Live
                </button>

              </div>

              <div class="live-score-stage">

                <div class="live-team-card">
                  <h3 id="liveTeamAName">
                    Team A
                  </h3>

                  <small>TEAM A</small>

                  <div class="live-score-controls">

                    <button
                      class="live-score-button"
                      data-score-side="A"
                      data-score-change="-1"
                      aria-label="Decrease Team A score"
                    >
                      −
                    </button>

                    <strong
                      id="liveTeamAScore"
                      class="live-score-value"
                    >
                      0
                    </strong>

                    <button
                      class="live-score-button"
                      data-score-side="A"
                      data-score-change="1"
                      aria-label="Increase Team A score"
                    >
                      +
                    </button>

                  </div>
                </div>

                <div class="live-vs">
                  VS
                </div>

                <div class="live-team-card">
                  <h3 id="liveTeamBName">
                    Team B
                  </h3>

                  <small>TEAM B</small>

                  <div class="live-score-controls">

                    <button
                      class="live-score-button"
                      data-score-side="B"
                      data-score-change="-1"
                      aria-label="Decrease Team B score"
                    >
                      −
                    </button>

                    <strong
                      id="liveTeamBScore"
                      class="live-score-value"
                    >
                      0
                    </strong>

                    <button
                      class="live-score-button"
                      data-score-side="B"
                      data-score-change="1"
                      aria-label="Increase Team B score"
                    >
                      +
                    </button>

                  </div>
                </div>

              </div>

              <div class="live-winner-preview">
                Winner:
                <strong id="liveWinnerPreview">
                  Not decided
                </strong>
              </div>

              <div class="live-button-row">
                <button
                  id="saveLiveResultButton"
                  class="action-button action-button-primary"
                >
                  <i class="fa-solid fa-floppy-disk"></i>
                  Save Scores / Result
                </button>
              </div>

            </div>
          </article>

          <article class="nexus-panel">
            <header class="panel-header">
              <h3>Up Next</h3>
              <span>Broadcast Queue</span>
            </header>

            <div class="live-panel-content">

              <div class="live-up-next">
                <span
                  id="liveNextLabel"
                  class="live-up-next-label"
                >
                  NO MATCH
                </span>

                <strong id="liveNextTeams">
                  No upcoming match
                </strong>

                <span>
                  Displayed across tournament
                  and broadcast surfaces
                </span>
              </div>

              <div class="live-button-row">

                <button
                  id="autoGenerateNextButton"
                  class="action-button"
                >
                  <i class="fa-solid fa-wand-magic-sparkles"></i>
                  Auto Generate
                </button>

                <button
                  id="saveNextMatchButton"
                  class="action-button action-button-primary"
                >
                  <i class="fa-solid fa-arrow-up-right-dots"></i>
                  Save Up Next
                </button>

              </div>
            </div>
          </article>

        </div>

        <div class="live-ops-stack">

          <article class="nexus-panel">
            <header class="panel-header">
              <h3>Broadcast Status</h3>
              <span>Public State</span>
            </header>

            <div class="live-panel-content">

              <label
                class="live-field-label"
                for="liveBroadcastStatusSelect"
              >
                Stream Status
              </label>

              <select
                id="liveBroadcastStatusSelect"
                class="live-select"
              >
                <option value="● OFFLINE">
                  ● OFFLINE
                </option>

                <option value="● LIVE">
                  ● LIVE
                </option>
              </select>

              <div class="live-button-row">
                <button
                  id="saveBroadcastStatusButton"
                  class="action-button action-button-primary"
                >
                  <i class="fa-solid fa-tower-broadcast"></i>
                  Save Status
                </button>
              </div>

            </div>
          </article>

          <article class="nexus-panel">
            <header class="panel-header">
              <h3>Break Timer</h3>
              <span>Tournament Hub</span>
            </header>

            <div class="live-panel-content">
              <div class="live-break-grid">

                <button data-break-minutes="3">
                  3 Minutes
                </button>

                <button data-break-minutes="5">
                  5 Minutes
                </button>

                <button data-break-minutes="10">
                  10 Minutes
                </button>

                <button id="resetBreakTimerButton">
                  Reset Timer
                </button>

              </div>
            </div>
          </article>

          <article class="nexus-panel">
            <header class="panel-header">
              <h3>Tournament State</h3>
              <span>Protected Action</span>
            </header>

            <div class="live-panel-content">

              <div class="live-danger-zone">
                <p>
                  Clears Current Match and removes
                  the Up Next matchup. It does not
                  erase bracket results.
                </p>

                <button
                  id="finishTournamentButton"
                  class="live-danger-button"
                >
                  <i class="fa-solid fa-flag-checkered"></i>
                  Mark Tournament Complete
                </button>
              </div>

            </div>
          </article>

        </div>
      </section>
    `;

    bindLiveOperationsEvents();
    syncLiveOperationsFromFirebase(true);
  }

  function bindLiveOperationsEvents() {
    cleanupLiveModuleEvents();

    elements.content.addEventListener(
      "click",
      handleLiveOperationsClick
    );

    elements.content.addEventListener(
      "change",
      handleLiveOperationsChange
    );
  }

  function handleLiveOperationsClick(event) {
    if (state.activeModule !== "live") return;

    const button =
      event.target.closest("button");

    if (
      !button ||
      !elements.content.contains(button)
    ) {
      return;
    }

    if (button.matches("[data-score-side]")) {
      changeLiveScore(
        button.dataset.scoreSide,
        Number(button.dataset.scoreChange)
      );

      return;
    }

    if (
      button.matches("[data-break-minutes]")
    ) {
      void startLiveBreakTimer(
        Number(button.dataset.breakMinutes),
        button
      );

      return;
    }

    switch (button.id) {
      case "setCurrentMatchButton":
        void setCurrentMatchLive(button);
        break;

      case "saveLiveResultButton":
        void saveLiveResult(button);
        break;

      case "autoGenerateNextButton":
        autoGenerateLiveNext();

        state.liveDraft.dirty = true;

        setLiveSaveState(
          "Up Next not saved"
        );

        paintLiveOperations();

        showToast(
          "Next match generated."
        );

        break;

      case "saveNextMatchButton":
        void saveLiveNextMatch(button);
        break;

      case "saveBroadcastStatusButton":
        void saveLiveBroadcastStatus(button);
        break;

      case "resetBreakTimerButton":
        void resetLiveBreakTimer(button);
        break;

      case "finishTournamentButton":
        void completeLiveTournament(button);
        break;

      case "toggleOperationsModeButton":
        toggleOperationsMode(button);
        break;

      default:
        break;
    }
  }

  function handleLiveOperationsChange(event) {
    if (state.activeModule !== "live") return;

    const target = event.target;

    if (
      target.id === "liveCurrentMatchSelect"
    ) {
      state.liveDraft.currentMatchId =
        target.value;

      state.liveDraft.dirty = true;

      loadSelectedMatchScores();
      autoGenerateLiveNext();

      setLiveSaveState(
        "Match selection not saved"
      );

      paintLiveOperations();

      return;
    }

    if (
      target.id ===
      "liveBroadcastStatusSelect"
    ) {
      state.liveDraft.dirty = true;

      setLiveSaveState(
        "Broadcast status not saved"
      );
    }
  }

  function getLiveMatchConfig(
    matchId = state.liveDraft.currentMatchId
  ) {
    const site =
      window.nexusSiteData || {};

    const is16 =
      (
        site.formatType ||
        "8_single_elim"
      ) === "16_single_elim";

    const configs = {
      "R16-1 • Bo3": {
        label: "R16-1",
        a: site.team1 || "Team 1",
        b: site.team2 || "Team 2",
        scoreA: "r16m1Team1Score",
        scoreB: "r16m1Team2Score",
        winner: "r16m1Winner",
        max: 2
      },

      "R16-2 • Bo3": {
        label: "R16-2",
        a: site.team3 || "Team 3",
        b: site.team4 || "Team 4",
        scoreA: "r16m2Team1Score",
        scoreB: "r16m2Team2Score",
        winner: "r16m2Winner",
        max: 2
      },

      "R16-3 • Bo3": {
        label: "R16-3",
        a: site.team5 || "Team 5",
        b: site.team6 || "Team 6",
        scoreA: "r16m3Team1Score",
        scoreB: "r16m3Team2Score",
        winner: "r16m3Winner",
        max: 2
      },

      "R16-4 • Bo3": {
        label: "R16-4",
        a: site.team7 || "Team 7",
        b: site.team8 || "Team 8",
        scoreA: "r16m4Team1Score",
        scoreB: "r16m4Team2Score",
        winner: "r16m4Winner",
        max: 2
      },

      "R16-5 • Bo3": {
        label: "R16-5",
        a: site.team9 || "Team 9",
        b: site.team10 || "Team 10",
        scoreA: "r16m5Team1Score",
        scoreB: "r16m5Team2Score",
        winner: "r16m5Winner",
        max: 2
      },

      "R16-6 • Bo3": {
        label: "R16-6",
        a: site.team11 || "Team 11",
        b: site.team12 || "Team 12",
        scoreA: "r16m6Team1Score",
        scoreB: "r16m6Team2Score",
        winner: "r16m6Winner",
        max: 2
      },

      "R16-7 • Bo3": {
        label: "R16-7",
        a: site.team13 || "Team 13",
        b: site.team14 || "Team 14",
        scoreA: "r16m7Team1Score",
        scoreB: "r16m7Team2Score",
        winner: "r16m7Winner",
        max: 2
      },

      "R16-8 • Bo3": {
        label: "R16-8",
        a: site.team15 || "Team 15",
        b: site.team16 || "Team 16",
        scoreA: "r16m8Team1Score",
        scoreB: "r16m8Team2Score",
        winner: "r16m8Winner",
        max: 2
      },

      "QF1 • Bo3": {
        label: "QF1",

        a: is16
          ? site.r16m1Winner ||
            "Winner R16-1"
          : site.team1 ||
            "Team 1",

        b: is16
          ? site.r16m2Winner ||
            "Winner R16-2"
          : site.team2 ||
            "Team 2",

        scoreA: "qf1Team1Score",
        scoreB: "qf1Team2Score",
        winner: "qf1Winner",
        max: 2
      },

      "QF2 • Bo3": {
        label: "QF2",

        a: is16
          ? site.r16m3Winner ||
            "Winner R16-3"
          : site.team3 ||
            "Team 3",

        b: is16
          ? site.r16m4Winner ||
            "Winner R16-4"
          : site.team4 ||
            "Team 4",

        scoreA: "qf2Team1Score",
        scoreB: "qf2Team2Score",
        winner: "qf2Winner",
        max: 2
      },

      "QF3 • Bo3": {
        label: "QF3",

        a: is16
          ? site.r16m5Winner ||
            "Winner R16-5"
          : site.team5 ||
            "Team 5",

        b: is16
          ? site.r16m6Winner ||
            "Winner R16-6"
          : site.team6 ||
            "Team 6",

        scoreA: "qf3Team1Score",
        scoreB: "qf3Team2Score",
        winner: "qf3Winner",
        max: 2
      },

      "QF4 • Bo3": {
        label: "QF4",

        a: is16
          ? site.r16m7Winner ||
            "Winner R16-7"
          : site.team7 ||
            "Team 7",

        b: is16
          ? site.r16m8Winner ||
            "Winner R16-8"
          : site.team8 ||
            "Team 8",

        scoreA: "qf4Team1Score",
        scoreB: "qf4Team2Score",
        winner: "qf4Winner",
        max: 2
      },

      "SF1 • Bo3": {
        label: "SF1",

        a:
          site.qf1Winner ||
          "Winner QF1",

        b:
          site.qf2Winner ||
          "Winner QF2",

        scoreA: "sf1Team1Score",
        scoreB: "sf1Team2Score",
        winner: "sf1Winner",
        max: 2
      },

      "SF2 • Bo3": {
        label: "SF2",

        a:
          site.qf3Winner ||
          "Winner QF3",

        b:
          site.qf4Winner ||
          "Winner QF4",

        scoreA: "sf2Team1Score",
        scoreB: "sf2Team2Score",
        winner: "sf2Winner",
        max: 2
      },

      "Grand Finals • Bo5": {
        label: "Grand Finals",

        a:
          site.sf1Winner ||
          "Winner SF1",

        b:
          site.sf2Winner ||
          "Winner SF2",

        scoreA: "gfTeam1Score",
        scoreB: "gfTeam2Score",
        winner: "grandWinner",
        max: 3
      }
    };

    return configs[matchId] || null;
  }

  function syncLiveOperationsFromFirebase(
    force = false
  ) {
    if (state.activeModule !== "live") return;

    const site =
      window.nexusSiteData || {};

    const broadcast =
      window.nexusBroadcastData || {};

    if (
      force ||
      !state.liveDraft.dirty
    ) {
      state.liveDraft.currentMatchId =
        site.currentMatch ||
        "No Match Live";

      loadSelectedMatchScores();

      const savedNext =
        broadcast.upNext;

      if (savedNext) {
        state.liveDraft.nextMatch = {
          label: savedNext.label || "",
          teamA: savedNext.teamA || "",
          teamB: savedNext.teamB || ""
        };
      } else {
        autoGenerateLiveNext();
      }
    }

    paintLiveOperations();
  }

  function loadSelectedMatchScores() {
    const config =
      getLiveMatchConfig();

    const site =
      window.nexusSiteData || {};

    if (!config) {
      state.liveDraft.teamAScore = 0;
      state.liveDraft.teamBScore = 0;
      return;
    }

    state.liveDraft.teamAScore =
      Number(
        site[config.scoreA] || 0
      );

    state.liveDraft.teamBScore =
      Number(
        site[config.scoreB] || 0
      );
  }

  function paintLiveOperations() {
    const config =
      getLiveMatchConfig();

    const site =
      window.nexusSiteData || {};

    const matchSelect =
      document.getElementById(
        "liveCurrentMatchSelect"
      );

    if (!matchSelect) return;

    matchSelect.value =
      state.liveDraft.currentMatchId;

    setText(
      "liveTeamAName",
      config
        ? config.a
        : "No Match"
    );

    setText(
      "liveTeamBName",
      config
        ? config.b
        : "Select Match"
    );

    setText(
      "liveTeamAScore",
      state.liveDraft.teamAScore
    );

    setText(
      "liveTeamBScore",
      state.liveDraft.teamBScore
    );

    setText(
      "liveWinnerPreview",
      getLiveWinner(config) ||
      "Not decided"
    );

    setText(
      "liveNextLabel",
      state.liveDraft.nextMatch.label ||
      "NO MATCH"
    );

    setText(
      "liveNextTeams",
      (
        state.liveDraft.nextMatch.teamA &&
        state.liveDraft.nextMatch.teamB
      )
        ? `${state.liveDraft.nextMatch.teamA} vs ${state.liveDraft.nextMatch.teamB}`
        : "No upcoming match"
    );

    const statusSelect =
      document.getElementById(
        "liveBroadcastStatusSelect"
      );

    if (
      statusSelect &&
      !state.liveDraft.dirty
    ) {
      statusSelect.value =
        site.status ||
        "● OFFLINE";
    }
  }

  function changeLiveScore(
    side,
    amount
  ) {
    const config =
      getLiveMatchConfig();

    if (!config) return;

    if (side === "A") {
      state.liveDraft.teamAScore =
        Math.max(
          0,
          Math.min(
            config.max,
            state.liveDraft.teamAScore +
              amount
          )
        );
    }

    if (side === "B") {
      state.liveDraft.teamBScore =
        Math.max(
          0,
          Math.min(
            config.max,
            state.liveDraft.teamBScore +
              amount
          )
        );
    }

    state.liveDraft.dirty = true;

    setLiveSaveState(
      "Unsaved score changes"
    );

    paintLiveOperations();
  }

  function getLiveWinner(config) {
    if (!config) return "";

    if (
      state.liveDraft.teamAScore >=
        config.max &&
      state.liveDraft.teamAScore >
        state.liveDraft.teamBScore
    ) {
      return config.a;
    }

    if (
      state.liveDraft.teamBScore >=
        config.max &&
      state.liveDraft.teamBScore >
        state.liveDraft.teamAScore
    ) {
      return config.b;
    }

    return "";
  }

  function getAutoLiveNextMatch() {
    const site =
      window.nexusSiteData || {};

    const order8 = [
      "QF1 • Bo3",
      "QF2 • Bo3",
      "QF3 • Bo3",
      "QF4 • Bo3",
      "SF1 • Bo3",
      "SF2 • Bo3",
      "Grand Finals • Bo5"
    ];

    const order16 = [
      "R16-1 • Bo3",
      "R16-2 • Bo3",
      "R16-3 • Bo3",
      "R16-4 • Bo3",
      "R16-5 • Bo3",
      "R16-6 • Bo3",
      "R16-7 • Bo3",
      "R16-8 • Bo3",
      ...order8
    ];

    const order =
      (
        site.formatType ||
        "8_single_elim"
      ) === "16_single_elim"
        ? order16
        : order8;

    const index =
      order.indexOf(
        state.liveDraft.currentMatchId
      );

    const nextId =
      index >= 0
        ? order[index + 1]
        : order[0];

    const config =
      getLiveMatchConfig(nextId);

    if (!config) {
      return {
        label: "TOURNAMENT COMPLETE",
        teamA: "",
        teamB: ""
      };
    }

    return {
      label: config.label,
      teamA: config.a,
      teamB: config.b
    };
  }

  function autoGenerateLiveNext() {
    state.liveDraft.nextMatch =
      getAutoLiveNextMatch();
  }

  function getLivePredictionType(matchId) {
    return `match_${String(matchId || "")
      .replaceAll(" ", "_")
      .replaceAll("•", "")
      .replaceAll("-", "_")}`;
  }

  async function setCurrentMatchLive(button) {
    const config =
      getLiveMatchConfig();

    if (!config) {
      showToast(
        "Select a valid tournament match."
      );

      return;
    }

    await runLiveButtonAction(
      button,
      "Setting Live...",
      async () => {
        const tournamentId =
          await getCurrentTournamentId();

        const next =
          getAutoLiveNextMatch();

        const currentPredictionId =
          getLivePredictionType(
            state.liveDraft.currentMatchId
          );

        const nextFullMatchId =
          LIVE_MATCHES.find(match => {
            const matchConfig =
              getLiveMatchConfig(match);

            return (
              matchConfig &&
              matchConfig.label === next.label
            );
          });

        const updates = {
          "site/currentMatch":
            state.liveDraft.currentMatchId,

          [`predictionLocks/${tournamentId}/${currentPredictionId}`]:
            {
              locked: true,

              matchId:
                state.liveDraft.currentMatchId,

              lockedAt:
                firebase.database
                  .ServerValue
                  .TIMESTAMP
            },

          "broadcastCountdown/upNext":
            next
        };

        if (
          nextFullMatchId &&
          next.label !==
            "TOURNAMENT COMPLETE"
        ) {
          const nextPredictionId =
            getLivePredictionType(
              nextFullMatchId
            );

          updates[
            `predictionLocks/${tournamentId}/${nextPredictionId}`
          ] = null;
        }

        await database
          .ref()
          .update(updates);

        state.liveDraft.nextMatch = next;
        state.liveDraft.dirty = false;

        setLiveSaveState(
          "Current match is live"
        );

        showToast(
          "Current match live. Up Next updated."
        );
      }
    );
  }

  async function saveLiveResult(button) {
    const config =
      getLiveMatchConfig();

    if (!config) {
      showToast(
        "Select a valid match first."
      );

      return;
    }

    await runLiveButtonAction(
      button,
      "Saving Result...",
      async () => {
        const winner =
          getLiveWinner(config);

        const next =
          getAutoLiveNextMatch();

        const updates = {
          "site/currentMatch":
            state.liveDraft.currentMatchId,

          [`site/${config.scoreA}`]:
            String(
              state.liveDraft.teamAScore
            ),

          [`site/${config.scoreB}`]:
            String(
              state.liveDraft.teamBScore
            ),

          [`site/${config.winner}`]:
            winner || null,

          "broadcastCountdown/upNext":
            next
        };

        await database
          .ref()
          .update(updates);

        state.liveDraft.nextMatch = next;
        state.liveDraft.dirty = false;

        setLiveSaveState(
          "Saved to Firebase"
        );

        showToast(
          winner
            ? `Result saved: ${winner} wins`
            : "Scores saved"
        );
      }
    );
  }

  async function saveLiveNextMatch(button) {
    await runLiveButtonAction(
      button,
      "Saving...",
      async () => {
        await database
          .ref("broadcastCountdown/upNext")
          .set(state.liveDraft.nextMatch);

        state.liveDraft.dirty = false;

        setLiveSaveState(
          "Up Next saved"
        );

        showToast(
          "Up Next saved."
        );
      }
    );
  }

  async function saveLiveBroadcastStatus(
    button
  ) {
    const select =
      document.getElementById(
        "liveBroadcastStatusSelect"
      );

    await runLiveButtonAction(
      button,
      "Saving...",
      async () => {
        await database
          .ref("site/status")
          .set(select.value);

        state.liveDraft.dirty = false;

        setLiveSaveState(
          "Broadcast status saved"
        );

        showToast(
          "Broadcast status saved."
        );
      }
    );
  }

  async function startLiveBreakTimer(
    minutes,
    button
  ) {
    const durationMs =
      minutes * 60 * 1000;

    await runLiveButtonAction(
      button,
      "Starting...",
      async () => {
        await database
          .ref("broadcastCountdown")
          .update({
            hubEndTime:
              new Date(
                Date.now() + durationMs
              ).toISOString(),

            hubDurationMs:
              durationMs
          });

        showToast(
          `${minutes}-minute break started.`
        );
      }
    );
  }

  async function resetLiveBreakTimer(button) {
    await runLiveButtonAction(
      button,
      "Resetting...",
      async () => {
        await database
          .ref("broadcastCountdown")
          .update({
            hubEndTime: null,
            hubDurationMs: null
          });

        showToast(
          "Break timer reset."
        );
      }
    );
  }

  async function completeLiveTournament(
    button
  ) {
    const confirmed =
      window.confirm(
        "Mark the tournament complete?\n\n" +
        "This clears Current Match and Up Next. " +
        "Bracket results will remain saved."
      );

    if (!confirmed) return;

    await runLiveButtonAction(
      button,
      "Completing...",
      async () => {
        const completedNext = {
          label: "NO MATCH",
          teamA: "",
          teamB: ""
        };

        await database
          .ref()
          .update({
            "site/currentMatch":
              "No Match Live",

            "broadcastCountdown/upNext":
              completedNext
          });

        state.liveDraft.currentMatchId =
          "No Match Live";

        state.liveDraft.teamAScore = 0;
        state.liveDraft.teamBScore = 0;

        state.liveDraft.nextMatch =
          completedNext;

        state.liveDraft.dirty = false;

        paintLiveOperations();

        setLiveSaveState(
          "Tournament complete"
        );

        showToast(
          "Tournament marked complete."
        );
      }
    );
  }

  async function runLiveButtonAction(
    button,
    loadingText,
    action
  ) {
    if (!button) {
      window.alert(
        "Nexus could not identify the selected control."
      );

      return;
    }

    if (
      !auth ||
      !auth.currentUser
    ) {
      window.alert(
        "Your Firebase session is no longer active. Sign in again."
      );

      return;
    }

    if (!state.role) {
      window.alert(
        "Nexus could not verify your administrative role."
      );

      return;
    }

    const originalHtml =
      button.innerHTML;

    button.disabled = true;

    button.innerHTML = `
      <i class="fa-solid fa-spinner fa-spin"></i>
      ${escapeHtml(loadingText)}
    `;

    try {
      await action();
    } catch (error) {
      console.error(
        "[NEXUS LIVE] Firebase action failed:",
        error
      );

      const message =
        isPermissionDenied(error)
          ? "Firebase denied this operation. Your session is valid, but this database path does not allow the write."
          : error.message ||
            "An unknown Live Operations error occurred.";

      showToast(message);

      window.alert(
        `Live Operations Error\n\n${message}`
      );
    } finally {
      button.disabled = false;
      button.innerHTML = originalHtml;
    }
  }

  function setLiveSaveState(message) {
    setText(
      "liveSaveState",
      message
    );
  }

  function toggleOperationsMode(button) {
    const enabled =
      elements.app.classList.toggle(
        "operations-mode"
      );

    button.innerHTML = enabled
      ? '<i class="fa-solid fa-compress"></i> Exit Focus Mode'
      : '<i class="fa-solid fa-expand"></i> Focus Mode';
  }

  function renderModulePlaceholder(moduleId) {
    const module =
      MODULES[moduleId];

    const descriptions = {
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
        "Bracket Pick’em and Live Prediction administration will be consolidated here without unsafe client payout logic.",

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
          <p>
            ${escapeHtml(
              descriptions[moduleId] || ""
            )}
          </p>
        </div>
      </section>

      <article class="nexus-panel placeholder-panel">
        <div>
          <div class="placeholder-icon">
            <i class="fa-solid ${escapeHtml(module.icon)}"></i>
          </div>

          <h3>
            ${escapeHtml(module.title)}
          </h3>

          <p>
            The secure Nexus shell is active.
            This module is ready for its
            existing admin functionality
            to be imported.
          </p>
        </div>
      </article>
    `;
  }

  function renderDiagnostics(
    autoRun = false
  ) {
    elements.content.innerHTML = `
      <section class="module-intro">
        <div>
          <h2>System Diagnostics</h2>

          <p>
            Test which important Firebase
            collections Nexus can read with
            your current account and database rules.
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
        <div
          id="diagnosticsList"
          class="diagnostics-list"
        >
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
      .addEventListener(
        "click",
        runDiagnostics
      );

    if (autoRun) {
      void runDiagnostics();
    }
  }

  async function runDiagnostics() {
    const button =
      document.getElementById(
        "runDiagnosticsButton"
      );

    if (button) {
      button.disabled = true;

      button.innerHTML =
        '<i class="fa-solid fa-spinner fa-spin"></i> Running...';
    }

    [
      "auth",
      "role",
      "site",
      "broadcast",
      "posts",
      "applications",
      "users"
    ].forEach(setDiagnosticRunning);

    const tournamentId =
      await getCurrentTournamentId()
        .catch(() => "open1");

    await runDiagnosticTest(
      "auth",
      async () => {
        if (!auth.currentUser) {
          throw new Error(
            "No authenticated Firebase user."
          );
        }

        return (
          auth.currentUser.email ||
          auth.currentUser.uid
        );
      }
    );

    await runDiagnosticTest(
      "role",
      async () => {
        const snapshot =
          await database
            .ref(
              `users/${state.user.uid}/role`
            )
            .once("value");

        const role = snapshot.val();

        if (
          role !== "owner" &&
          role !== "admin"
        ) {
          throw new Error(
            `Unsupported role: ${
              role || "missing"
            }`
          );
        }

        return role;
      }
    );

    await runDiagnosticTest(
      "site",
      async () => {
        const snapshot =
          await database
            .ref("site")
            .once("value");

        return snapshot.exists()
          ? "Readable"
          : "Readable, no data";
      }
    );

    await runDiagnosticTest(
      "broadcast",
      async () => {
        const snapshot =
          await database
            .ref("broadcastCountdown")
            .once("value");

        return snapshot.exists()
          ? "Readable"
          : "Readable, no data";
      }
    );

    await runDiagnosticTest(
      "posts",
      async () => {
        const snapshot =
          await database
            .ref("officialPosts")
            .limitToFirst(1)
            .once("value");

        return snapshot.exists()
          ? "Readable"
          : "Readable, no posts";
      }
    );

    await runDiagnosticTest(
      "applications",
      async () => {
        const snapshot =
          await database
            .ref(
              `applications/${tournamentId}`
            )
            .once("value");

        return snapshot.exists()
          ? "Tournament applications readable"
          : "Readable, no applications";
      }
    );

    await runDiagnosticTest(
      "users",
      async () => {
        const snapshot =
          await database
            .ref("users")
            .limitToFirst(1)
            .once("value");

        return snapshot.exists()
          ? "Account collection readable"
          : "Readable, no accounts";
      }
    );

    if (button) {
      button.disabled = false;

      button.innerHTML =
        '<i class="fa-solid fa-play"></i> Run Diagnostics';
    }

    showToast(
      "Diagnostics complete."
    );
  }

  async function runDiagnosticTest(
    id,
    test
  ) {
    try {
      const result = await test();

      setDiagnosticResult(
        id,
        true,
        result
      );
    } catch (error) {
      console.error(
        `Diagnostic ${id} failed:`,
        error
      );

      setDiagnosticResult(
        id,
        false,
        isPermissionDenied(error)
          ? "Permission denied by Firebase rules"
          : error.message ||
            "Test failed"
      );
    }
  }

  function setDiagnosticRunning(id) {
    const row =
      document.querySelector(
        `[data-diagnostic="${id}"]`
      );

    if (!row) return;

    row.className =
      "diagnostic-row running";

    row
      .querySelector(".diagnostic-icon")
      .innerHTML =
        '<i class="fa-solid fa-spinner fa-spin"></i>';

    row
      .querySelector(".diagnostic-result")
      .textContent =
        "Testing";
  }

  function setDiagnosticResult(
    id,
    success,
    message
  ) {
    const row =
      document.querySelector(
        `[data-diagnostic="${id}"]`
      );

    if (!row) return;

    row.className =
      `diagnostic-row ${
        success
          ? "success"
          : "failure"
      }`;

    row
      .querySelector(".diagnostic-icon")
      .innerHTML =
        success
          ? '<i class="fa-solid fa-check"></i>'
          : '<i class="fa-solid fa-xmark"></i>';

    row
      .querySelector(".diagnostic-copy span")
      .textContent =
        message;

    row
      .querySelector(".diagnostic-result")
      .textContent =
        success
          ? "Passed"
          : "Blocked";
  }

  function startDashboardListeners() {
    if (state.listenersStarted) return;

    state.listenersStarted = true;

    database.ref("site").on(
      "value",

      snapshot => {
        window.nexusSiteData =
          snapshot.val() || {};

        if (
          state.activeModule ===
          "dashboard"
        ) {
          void updateDashboardValues();
        }

        if (
          state.activeModule ===
          "live"
        ) {
          syncLiveOperationsFromFirebase();
        }

        void updatePendingApplicationCount();
      },

      error => {
        console.error(
          "Unable to read site:",
          error
        );
      }
    );

    database
      .ref("broadcastCountdown")
      .on(
        "value",

        snapshot => {
          window.nexusBroadcastData =
            snapshot.val() || {};

          if (
            state.activeModule ===
            "dashboard"
          ) {
            void updateDashboardValues();
          }

          if (
            state.activeModule ===
            "live"
          ) {
            syncLiveOperationsFromFirebase();
          }
        },

        error => {
          console.error(
            "Unable to read broadcast data:",
            error
          );
        }
      );
  }

  async function updateDashboardValues() {
    const site =
      window.nexusSiteData || {};

    const broadcast =
      window.nexusBroadcastData || {};

    const upNext =
      broadcast.upNext || {};

    setText(
      "dashboardTournament",
      site.eventName ||
      site.currentTournament ||
      "No Tournament"
    );

    setText(
      "dashboardCurrentMatch",
      site.currentMatch ||
      "No Match Live"
    );

    setText(
      "dashboardTournamentDetail",
      normalizeStatus(
        site.status ||
        "Status unavailable"
      )
    );

    setText(
      "dashboardCurrentMatchDetail",

      upNext.teamA &&
      upNext.teamB
        ? `Up next: ${upNext.teamA} vs ${upNext.teamB}`
        : "No upcoming match set"
    );

    updateConnectionStatusRow();

    await Promise.all([
      updatePendingApplicationCount(),
      updateCheckInCount()
    ]);
  }

  async function updatePendingApplicationCount() {
    const valueElement =
      document.getElementById(
        "dashboardApplications"
      );

    const detailElement =
      document.getElementById(
        "dashboardApplicationsDetail"
      );

    if (
      !valueElement ||
      !detailElement
    ) {
      return;
    }

    try {
      const tournamentId =
        await getCurrentTournamentId();

      const snapshot =
        await database
          .ref(
            `applications/${tournamentId}`
          )
          .once("value");

      let pending = 0;

      snapshot.forEach(child => {
        const application =
          child.val() || {};

        if (
          !application.status ||
          application.status === "pending"
        ) {
          pending += 1;
        }
      });

      valueElement.textContent =
        pending;

      detailElement.textContent =
        pending === 1
          ? "1 application awaiting review"
          : `${pending} applications awaiting review`;

      elements.applicationNavCount.textContent =
        pending;

      elements.applicationNavCount.hidden =
        pending === 0;
    } catch (error) {
      valueElement.textContent =
        "Blocked";

      detailElement.textContent =
        isPermissionDenied(error)
          ? "Firebase parent read denied"
          : "Unable to load applications";

      elements.applicationNavCount.hidden =
        true;
    }
  }

  async function updateCheckInCount() {
    const valueElement =
      document.getElementById(
        "dashboardCheckIns"
      );

    const detailElement =
      document.getElementById(
        "dashboardCheckInsDetail"
      );

    if (
      !valueElement ||
      !detailElement
    ) {
      return;
    }

    try {
      const tournamentId =
        await getCurrentTournamentId();

      const snapshot =
        await database
          .ref(
            `checkIns/${tournamentId}`
          )
          .once("value");

      let total = 0;
      let checkedIn = 0;

      snapshot.forEach(child => {
        total += 1;

        const checkIn =
          child.val();

        if (
          checkIn === true ||
          (
            checkIn &&
            checkIn.checkedIn === true
          ) ||
          (
            checkIn &&
            checkIn.status === "checkedIn"
          )
        ) {
          checkedIn += 1;
        }
      });

      valueElement.textContent =
        `${checkedIn}/${total}`;

      detailElement.textContent =
        total > 0
          ? `${total - checkedIn} still awaiting check-in`
          : "No check-in records yet";
    } catch (error) {
      valueElement.textContent =
        "Blocked";

      detailElement.textContent =
        isPermissionDenied(error)
          ? "Firebase read denied"
          : "Unable to load check-ins";
    }
  }

  async function getCurrentTournamentId() {
    const site =
      window.nexusSiteData;

    if (
      site &&
      site.currentTournament
    ) {
      return site.currentTournament;
    }

    const snapshot =
      await database
        .ref("site/currentTournament")
        .once("value");

    return (
      snapshot.val() ||
      "open1"
    );
  }

  function watchFirebaseConnection() {
    database
      .ref(".info/connected")
      .on("value", snapshot => {
        state.connected =
          snapshot.val() === true;

        elements.connectionDot.classList
          .toggle(
            "online",
            state.connected
          );

        elements.connectionDot.classList
          .toggle(
            "offline",
            !state.connected
          );

        elements.connectionLabel.textContent =
          state.connected
            ? "Connected"
            : "Disconnected";

        updateConnectionStatusRow();
      });
  }

  function updateConnectionStatusRow() {
    const statusContainer =
      document.getElementById(
        "dashboardSystemStatus"
      );

    if (!statusContainer) return;

    const firstRow =
      statusContainer.querySelector(
        ".status-row"
      );

    if (!firstRow) return;

    const dot =
      firstRow.querySelector(
        ".status-dot"
      );

    const detail =
      firstRow.querySelector("small");

    const result =
      firstRow.querySelector("em");

    dot.className =
      `status-dot ${
        state.connected
          ? "good"
          : "bad"
      }`;

    detail.textContent =
      state.connected
        ? "Realtime Database connection is active"
        : "Realtime Database is disconnected";

    result.textContent =
      state.connected
        ? "ONLINE"
        : "OFFLINE";
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
      elements.commandSearchInput
        .value
        .trim()
        .toLowerCase();

    const availableModules =
      Object.entries(MODULES)
        .filter(
          ([, module]) =>
            hasPermission(
              module.permission
            )
        )
        .filter(
          ([, module]) => {
            if (!query) return true;

            return (
              module.title
                .toLowerCase()
                .includes(query) ||

              module.breadcrumb
                .toLowerCase()
                .includes(query)
            );
          }
        );

    if (
      availableModules.length === 0
    ) {
      elements.commandResults.innerHTML = `
        <div class="command-empty">
          No Nexus commands match that search.
        </div>
      `;

      return;
    }

    elements.commandResults.innerHTML =
      availableModules
        .map(
          ([id, module]) => `
            <button
              class="command-result"
              data-command-module="${escapeHtml(id)}"
            >
              <i class="fa-solid ${escapeHtml(module.icon)}"></i>

              <div>
                <strong>
                  ${escapeHtml(module.title)}
                </strong>

                <small>
                  ${escapeHtml(module.breadcrumb)}
                </small>
              </div>

              <i class="fa-solid fa-arrow-right"></i>
            </button>
          `
        )
        .join("");
  }

  function handleKeyboardShortcuts(event) {
    const commandShortcut =
      (
        event.metaKey ||
        event.ctrlKey
      ) &&
      event.key.toLowerCase() === "k";

    if (commandShortcut) {
      event.preventDefault();

      if (
        elements.commandOverlay.hidden
      ) {
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
    elements.app.classList.add(
      "mobile-sidebar-open"
    );
  }

  function closeMobileSidebar() {
    elements.app.classList.remove(
      "mobile-sidebar-open"
    );
  }

  function toggleDesktopSidebar() {
    elements.app.classList.toggle(
      "sidebar-collapsed"
    );

    localStorage.setItem(
      "nexusSidebarCollapsed",

      elements.app.classList.contains(
        "sidebar-collapsed"
      )
        ? "1"
        : "0"
    );
  }

  async function signOut() {
    try {
      await auth.signOut();
    } catch (error) {
      console.error(
        "Sign-out failed:",
        error
      );

      showToast(
        "Unable to sign out."
      );
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

    elements.deniedMessage.textContent =
      message;
  }

  function showFatalError(
    title,
    message
  ) {
    if (!elements.loading) return;

    elements.loading.innerHTML = `
      <div class="state-icon state-icon-danger">
        <i class="fa-solid fa-triangle-exclamation"></i>
      </div>

      <p class="eyebrow">
        NEXUS ERROR
      </p>

      <h1>
        ${escapeHtml(title)}
      </h1>

      <p>
        ${escapeHtml(message)}
      </p>
    `;
  }

  function setLoadingMessage(message) {
    if (elements.loadingMessage) {
      elements.loadingMessage.textContent =
        message;
    }
  }

  function showToast(message) {
    clearTimeout(toastTimer);

    elements.toast.textContent =
      message;

    elements.toast.classList.add(
      "show"
    );

    toastTimer = setTimeout(() => {
      elements.toast.classList.remove(
        "show"
      );
    }, 2500);
  }

  function setText(id, value) {
    const element =
      document.getElementById(id);

    if (element) {
      element.textContent = value;
    }
  }

  function isPermissionDenied(error) {
    const code =
      String(
        error?.code || ""
      ).toLowerCase();

    const message =
      String(
        error?.message || ""
      ).toLowerCase();

    return (
      code.includes(
        "permission-denied"
      ) ||
      message.includes(
        "permission_denied"
      ) ||
      message.includes(
        "permission denied"
      )
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

  function createMetricCard(
    label,
    id,
    detail,
    icon
  ) {
    return `
      <article class="metric-card">
        <div class="metric-card-top">

          <span class="metric-label">
            ${escapeHtml(label)}
          </span>

          <span class="metric-icon">
            <i class="fa-solid ${escapeHtml(icon)}"></i>
          </span>

        </div>

        <strong
          id="${escapeHtml(id)}"
          class="metric-value"
        >
          —
        </strong>

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
          <strong>
            ${escapeHtml(title)}
          </strong>

          <span>
            ${escapeHtml(detail)}
          </span>
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

        <span
          class="status-dot ${escapeHtml(status)}"
        ></span>

        <div>
          <strong>
            ${escapeHtml(title)}
          </strong>

          <small>
            ${detail}
          </small>
        </div>

        <em>
          ${escapeHtml(result)}
        </em>

      </div>
    `;
  }

  function createDiagnosticRow(
    id,
    title,
    detail
  ) {
    return `
      <div
        class="diagnostic-row"
        data-diagnostic="${escapeHtml(id)}"
      >
        <span class="diagnostic-icon">
          <i class="fa-solid fa-minus"></i>
        </span>

        <div class="diagnostic-copy">
          <strong>
            ${escapeHtml(title)}
          </strong>

          <span>
            ${escapeHtml(detail)}
          </span>
        </div>

        <span class="diagnostic-result">
          Not tested
        </span>
      </div>
    `;
  }

  function escapeHtml(value) {
    return String(
      value == null
        ? ""
        : value
    )
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }
})();