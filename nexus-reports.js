(() => {
  "use strict";

  const ISSUE_LABELS = {
    afk: "Player AFK",
    throwing: "Intentional Throwing",
    disconnected: "Player Disconnected",
    missing_lobby: "Missing From Lobby",
    replacement: "Replacement Needed",
    opponent_missing: "Opponent Missing",
    roster: "Roster Problem",
    technical: "Technical Problem",
    other: "Other Urgent Issue"
  };

  const STATUS_LABELS = {
    open: "New",
    reviewing: "Reviewing",
    contacted: "Contacted",
    replacement_required: "Replacement Required",
    resolved: "Resolved",
    dismissed: "Dismissed"
  };

  const RANK_VALUES = {
    "One Above All": 9,
    Eternity: 8,
    Celestial: 7,
    Grandmaster: 6,
    Diamond: 5,
    Platinum: 4,
    Gold: 3,
    Silver: 2,
    Bronze: 1
  };

  const moduleState = {
    activeTournamentId: "",
    tournamentId: "",
    tournaments: {},
    tournament: {},
    reports: {},
    applications: [],
players: {},
teamsRecord: {},
    checkIns: {},
    availability: {},
    selectedIncidentKey: "",

manualTeamKey: "",
manualOutgoingUid: "",
manualIncomingUid: "",

incomingScope: "all",
incomingReadiness: "all",
incomingRole: "all",
incomingSearch: "",
manualReason: "",

listeners: []
  };

  let context = null;
  let boundContent = null;

  function render(nexusContext) {
    cleanup();

    context = nexusContext;
    boundContent = context.content;

    resetState();

    boundContent.innerHTML = `
      <section class="module-intro">
        <div>
          <h2>Reports & Substitutions</h2>

          <p>
            Review tournament incidents, respond to players and access
            eligible substitutes at any point during the event.
          </p>
        </div>

        <div class="module-actions">
          <button
            id="reportsRefreshButton"
            class="action-button"
            type="button"
          >
            <i class="fa-solid fa-rotate"></i>
            Refresh
          </button>
        </div>
      </section>

      <section class="reports-layout">

        <article class="nexus-panel">
          <header class="panel-header">
            <h3>Tournament Context</h3>

            <span id="reportsActiveBadge">
              Loading
            </span>
          </header>

          <div class="reports-panel-content">

            <div class="reports-context-row">
              <div class="reports-field">
                <label for="reportsTournamentSelect">
                  Tournament to Monitor
                </label>

                <select
                  id="reportsTournamentSelect"
                  class="reports-select"
                >
                  <option value="">
                    Loading tournaments...
                  </option>
                </select>
              </div>

              <button
                id="reportsOpenCheckInButton"
                class="action-button"
                type="button"
              >
                <i class="fa-solid fa-user-check"></i>
                Check-In Desk
              </button>
            </div>

            <div class="reports-context-grid">
              ${contextMetric(
                "reportsTournamentName",
                "Tournament",
                "Loading..."
              )}

              ${contextMetric(
                "reportsRosterCount",
                "Main Roster",
                "0"
              )}

              ${contextMetric(
                "reportsEligibleSubCount",
                "Eligible Subs",
                "0"
              )}

              ${contextMetric(
                "reportsReadySubCount",
                "Ready Subs",
                "0"
              )}
            </div>

          </div>
        </article>

        <section class="reports-summary-grid">

          ${summaryMetric(
            "reportsOpenCount",
            "New / Open",
            "0",
            "fa-inbox"
          )}

          ${summaryMetric(
            "reportsReviewingCount",
            "In Review",
            "0",
            "fa-magnifying-glass"
          )}

          ${summaryMetric(
            "reportsHighPriorityCount",
            "High Priority",
            "0",
            "fa-triangle-exclamation"
          )}

          ${summaryMetric(
            "reportsReplacementCount",
            "Replacement Cases",
            "0",
            "fa-people-arrows"
          )}

          ${summaryMetric(
            "reportsResolvedCount",
            "Resolved",
            "0",
            "fa-circle-check"
          )}

        </section>
<article class="nexus-panel reports-roster-command-panel">
  <header class="panel-header reports-roster-command-header">
    <div>
      <h3>Roster Command Board</h3>

      <span>
        Tap any roster player to begin a substitution
      </span>
    </div>

    <span id="reportsRosterCommandState">
      No player selected
    </span>
  </header>

  <div class="reports-roster-help-strip">
    <i class="fa-solid fa-shield-halved"></i>

    Select an outgoing player directly from a team card. Then choose any
    registered RG player, waitlisted substitute, or player on another team.
  </div>

  <div
    id="reportsRosterBoard"
    class="reports-roster-board"
  >
    ${loadingState(
      "Loading published team rosters..."
    )}
  </div>

  <div
    id="reportsIncomingDrawer"
    class="reports-incoming-drawer"
  >
    ${emptyState(
      "Choose an outgoing player",
      "Select a player from any team roster to open the replacement pool.",
      "fa-arrow-pointer"
    )}
  </div>
</article>
        <section class="reports-workspace">

          <article class="nexus-panel reports-inbox-panel">
            <header class="panel-header">
              <h3>Report Inbox</h3>

              <span id="reportsInboxCount">
                0 Cases
              </span>
            </header>

            <div class="reports-panel-content reports-inbox-content">

              <div class="reports-filter-grid">

                <div class="reports-search">
                  <i class="fa-solid fa-magnifying-glass"></i>

                  <input
                    id="reportsSearchInput"
                    type="search"
                    placeholder="Search player, reporter, team or details..."
                    autocomplete="off"
                  >
                </div>

                <select
                  id="reportsStatusFilter"
                  class="reports-select"
                >
                  <option value="active">
                    Active Cases
                  </option>

                  <option value="all">
                    All Cases
                  </option>

                  <option value="open">
                    New
                  </option>

                  <option value="reviewing">
                    Reviewing
                  </option>

                  <option value="contacted">
                    Contacted
                  </option>

                  <option value="replacement_required">
                    Replacement Required
                  </option>

                  <option value="resolved">
                    Resolved
                  </option>

                  <option value="dismissed">
                    Dismissed
                  </option>
                </select>

                <select
                  id="reportsIssueFilter"
                  class="reports-select"
                >
                  <option value="all">
                    All Issue Types
                  </option>

                  ${Object.entries(
                    ISSUE_LABELS
                  )
                    .map(
                      ([value, label]) => `
                        <option value="${escapeHtml(value)}">
                          ${escapeHtml(label)}
                        </option>
                      `
                    )
                    .join("")}
                </select>

              </div>

              <div
                id="reportsIncidentList"
                class="reports-incident-list"
              >
                ${loadingState(
                  "Loading tournament reports..."
                )}
              </div>

            </div>
          </article>

          <article class="nexus-panel reports-case-panel">
            <header class="panel-header">
              <h3>Case Review</h3>

              <span id="reportsCaseStatus">
                Select a case
              </span>
            </header>

            <div
              id="reportsCaseDetail"
              class="reports-case-detail"
            >
              ${emptyState(
                "Select a report",
                "Choose an incident from the inbox to review reporters, respond and manage replacements.",
                "fa-folder-open"
              )}
            </div>
          </article>

        </section>

        <article class="nexus-panel">
          <header class="panel-header">
            <h3>Substitute Command Panel</h3>

            <span id="reportsSubContextLabel">
              All eligible substitutes
            </span>
          </header>

          <div class="reports-panel-content">

            <div class="reports-sub-toolbar">

              <div class="reports-search">
                <i class="fa-solid fa-magnifying-glass"></i>

                <input
                  id="reportsSubSearch"
                  type="search"
                  placeholder="Search substitutes..."
                  autocomplete="off"
                >
              </div>

              <select
                id="reportsSubReadinessFilter"
                class="reports-select"
              >
                <option value="ready">
                  Ready Now
                </option>

                <option value="all">
                  All Eligible
                </option>

                <option value="not_ready">
                  Not Ready
                </option>

                <option value="assigned">
                  Already Assigned
                </option>
              </select>

              <select
                id="reportsSubRoleFilter"
                class="reports-select"
              >
                <option value="all">
                  All Roles
                </option>
              </select>

            </div>

            <div
              id="reportsSubPool"
              class="reports-sub-pool"
            >
              ${loadingState(
                "Loading substitute candidates..."
              )}
            </div>

          </div>
        </article>

      </section>
    `;

    bindEvents();
    void initialize();
  }

  function cleanup() {
    detachListeners();

    if (boundContent) {
      boundContent.removeEventListener(
        "click",
        handleClick
      );

      boundContent.removeEventListener(
        "change",
        handleChange
      );

      boundContent.removeEventListener(
        "input",
        handleInput
      );
    }

    boundContent = null;
    context = null;
  }

  function resetState() {
    moduleState.activeTournamentId = "";
    moduleState.tournamentId = "";
    moduleState.tournaments = {};
    moduleState.tournament = {};
    moduleState.reports = {};
    moduleState.applications = [];
moduleState.players = {};
moduleState.teamsRecord = {};
    moduleState.checkIns = {};
    moduleState.availability = {};
moduleState.selectedIncidentKey = "";

moduleState.manualTeamKey = "";
moduleState.manualOutgoingUid = "";
moduleState.manualIncomingUid = "";

moduleState.incomingScope = "all";
moduleState.incomingReadiness = "all";
moduleState.incomingRole = "all";
moduleState.incomingSearch = "";
moduleState.manualReason = "";

moduleState.listeners = [];
  }

  function bindEvents() {
    boundContent.addEventListener(
      "click",
      handleClick
    );

    boundContent.addEventListener(
      "change",
      handleChange
    );

    boundContent.addEventListener(
      "input",
      handleInput
    );
  }

  async function initialize() {
    try {
      const [
        activeTournamentId,
        tournamentsSnapshot
      ] = await Promise.all([
        context.getCurrentTournamentId(),

        context.database
          .ref("tournaments")
          .once("value")
      ]);

      moduleState.activeTournamentId =
        activeTournamentId ||
        "open1";

      moduleState.tournaments =
        tournamentsSnapshot.val() ||
        {};

      const requested =
        sessionStorage.getItem(
          "nexusReportsTournament"
        );

      sessionStorage.removeItem(
        "nexusReportsTournament"
      );

      const initialTournament =
        requested &&
        moduleState.tournaments[
          requested
        ]
          ? requested
          : moduleState.activeTournamentId;

      renderTournamentOptions();
      switchTournament(
        initialTournament
      );
    } catch (error) {
      console.error(
        "Reports module initialization failed:",
        error
      );

      showModuleError(
        context.isPermissionDenied(error)
          ? "Firebase denied access to tournament reports or substitute data."
          : error.message ||
            "Reports & Substitutions could not be loaded."
      );
    }
  }

 function handleClick(event) {
  const button =
    event.target.closest(
      "button"
    );

  if (
    !button ||
    !boundContent.contains(button)
  ) {
    return;
  }

  if (
    button.id ===
    "reportsRefreshButton"
  ) {
    void refreshModule(button);
    return;
  }

  if (
    button.id ===
    "reportsOpenCheckInButton"
  ) {
    sessionStorage.setItem(
      "nexusCheckInTournament",
      moduleState.tournamentId
    );

    context.openModule(
      "checkin"
    );

    return;
  }

  const rosterAction =
    button.dataset.rosterAction;

  if (
    rosterAction ===
    "select-outgoing"
  ) {
    moduleState.manualTeamKey =
      button.dataset.teamKey ||
      "";

    moduleState.manualOutgoingUid =
      button.dataset.playerUid ||
      "";

    moduleState.manualIncomingUid =
      "";

    renderRosterCommandBoard();
    return;
  }

  if (
    rosterAction ===
    "select-incoming"
  ) {
    moduleState.manualIncomingUid =
      button.dataset.playerUid ||
      "";

    renderRosterCommandBoard();
    return;
  }

  if (
    rosterAction ===
    "clear-selection"
  ) {
    clearManualSelection();
    renderRosterCommandBoard();
    return;
  }

  if (
    rosterAction ===
    "execute"
  ) {
    void executeManualSubstitution(
      button
    );

    return;
  }

  const incidentKey =
    button.dataset.incidentKey;

  if (incidentKey) {
    moduleState.selectedIncidentKey =
      incidentKey;

    renderIncidentList();
    renderCaseDetail();
    renderSubPool();

    return;
  }

  const action =
    button.dataset.reportAction;

  if (
    action ===
    "status"
  ) {
    void updateCaseStatus(
      button.dataset.status,
      button
    );

    return;
  }

  if (
    action ===
    "save-notes"
  ) {
    void saveInternalNotes(
      button
    );

    return;
  }

  if (
    action ===
    "send-response"
  ) {
    void sendReporterResponse(
      button
    );

    return;
  }

  if (
    action ===
    "focus-subs"
  ) {
    document
      .getElementById(
        "reportsSubPool"
      )
      ?.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });

    return;
  }

  if (
    action ===
    "replace"
  ) {
    void replacePlayerWithSub(
      button.dataset.subUid,
      button
    );
  }
}

  function handleChange(event) {
  if (
    event.target.id ===
    "reportsTournamentSelect"
  ) {
    switchTournament(
      event.target.value
    );

    return;
  }

  if (
    event.target.id ===
    "reportsIncomingScopeFilter"
  ) {
    moduleState.incomingScope =
      event.target.value ||
      "all";

    renderIncomingDrawer();
    return;
  }

  if (
    event.target.id ===
    "reportsIncomingReadinessFilter"
  ) {
    moduleState.incomingReadiness =
      event.target.value ||
      "all";

    renderIncomingDrawer();
    return;
  }

  if (
    event.target.id ===
    "reportsIncomingRoleFilter"
  ) {
    moduleState.incomingRole =
      event.target.value ||
      "all";

    renderIncomingDrawer();
    return;
  }

  if (
    event.target.id ===
      "reportsStatusFilter" ||
    event.target.id ===
      "reportsIssueFilter"
  ) {
    renderIncidentList();
    renderCaseDetail();
    renderSubPool();

    return;
  }

  if (
    event.target.id ===
      "reportsSubReadinessFilter" ||
    event.target.id ===
      "reportsSubRoleFilter"
  ) {
    renderSubPool();
  }
}

  function handleInput(event) {
  if (
    event.target.id ===
    "reportsIncomingSearch"
  ) {
    moduleState.incomingSearch =
      event.target.value ||
      "";

    renderIncomingPoolOnly();
    return;
  }

  if (
    event.target.id ===
    "reportsManualReason"
  ) {
    moduleState.manualReason =
      event.target.value ||
      "";

    return;
  }

  if (
    event.target.id ===
    "reportsSearchInput"
  ) {
    renderIncidentList();
    return;
  }

  if (
    event.target.id ===
    "reportsSubSearch"
  ) {
    renderSubPool();
  }
}

  async function refreshModule(
    button
  ) {
    await buttonAction(
      button,
      "Refreshing...",
      async () => {
        const snapshot =
          await context.database
            .ref("tournaments")
            .once("value");

        moduleState.tournaments =
          snapshot.val() ||
          {};

        renderTournamentOptions();

        switchTournament(
          moduleState.tournamentId ||
          moduleState.activeTournamentId
        );

        context.showToast(
          "Reports & Substitutions refreshed."
        );
      }
    );
  }

  function switchTournament(
    tournamentId
  ) {
    if (!tournamentId) return;

    detachListeners();

    moduleState.tournamentId =
      tournamentId;

    moduleState.tournament = {};
    moduleState.reports = {};
    moduleState.applications = [];
moduleState.players = {};
moduleState.teamsRecord = {};
    moduleState.checkIns = {};
    moduleState.availability = {};
    moduleState.selectedIncidentKey =
      "";
clearManualSelection();
    const select =
      document.getElementById(
        "reportsTournamentSelect"
      );

    if (select) {
      select.value =
        tournamentId;
    }

    setHtml(
      "reportsIncidentList",
      loadingState(
        "Loading tournament reports..."
      )
    );

    setHtml(
      "reportsSubPool",
      loadingState(
        "Loading substitute candidates..."
      )
    );
setHtml(
  "reportsRosterBoard",
  loadingState(
    "Loading published team rosters..."
  )
);
    listen(
      context.database.ref(
        `tournaments/${tournamentId}`
      ),

      snapshot => {
        moduleState.tournament =
          snapshot.val() ||
          {};

        renderAll();
      },

      "tournament data"
    );

    listen(
      context.database.ref(
        `tournamentReports/${tournamentId}`
      ),

      snapshot => {
        moduleState.reports =
          snapshot.val() ||
          {};

        reconcileSelectedIncident();
        renderAll();
      },

      "tournament reports"
    );

        listen(
      context.database.ref(
        `applications/${tournamentId}`
      ),

      snapshot => {
        const data =
          snapshot.val() ||
          {};

        moduleState.applications =
          Object.entries(data).map(
            ([
              uid,
              application
            ]) => ({
              ...(application || {}),

              uid:
                application?.uid ||
                uid
            })
          );

        renderAll();
      },

      "applications"
    );

    listen(
      context.database.ref(
        "players"
      ),

      snapshot => {
        moduleState.players =
          snapshot.val() ||
          {};

        renderAll();
      },

      "player directory"
    );

    listen(
      context.database.ref(
        `teams/${tournamentId}`
      ),

      snapshot => {
        moduleState.teamsRecord =
  snapshot.val() ||
  {};

reconcileManualSelection();
renderAll();
      },

      "teams"
    );

    listen(
      context.database.ref(
        `checkIns/${tournamentId}`
      ),

      snapshot => {
        moduleState.checkIns =
          snapshot.val() ||
          {};

        renderAll();
      },

      "check-ins"
    );

    listen(
      context.database.ref(
        `availability/${tournamentId}`
      ),

      snapshot => {
        moduleState.availability =
          snapshot.val() ||
          {};

        renderAll();
      },

      "availability"
    );

    renderTournamentOptions();
    renderAll();
  }

  function listen(
    reference,
    handler,
    label
  ) {
    reference.on(
      "value",
      handler,

      error => {
        console.error(
          `${label} listener failed:`,
          error
        );

        context.showToast(
          context.isPermissionDenied(
            error
          )
            ? `Firebase denied access to ${label}.`
            : `${capitalize(
                label
              )} could not be loaded.`
        );
      }
    );

    moduleState.listeners.push({
      reference,
      handler
    });
  }

  function detachListeners() {
    moduleState.listeners.forEach(
      listener => {
        listener.reference.off(
          "value",
          listener.handler
        );
      }
    );

    moduleState.listeners = [];
  }

  function renderAll() {
  renderTournamentOptions();
  renderContext();
  renderSummary();
  renderRosterCommandBoard();
  renderRoleOptions();
  renderIncidentList();
  renderCaseDetail();
  renderSubPool();
}

  function renderTournamentOptions() {
    const select =
      document.getElementById(
        "reportsTournamentSelect"
      );

    if (!select) return;

    const entries =
      Object.entries(
        moduleState.tournaments
      );

    if (!entries.length) {
      select.innerHTML = `
        <option value="">
          No tournaments found
        </option>
      `;

      return;
    }

    select.innerHTML =
      entries
        .sort(
          (
            [, first],
            [, second]
          ) =>
            Number(
              second.createdAt ||
              0
            ) -
            Number(
              first.createdAt ||
              0
            )
        )
        .map(
          ([id, tournament]) => {
            const active =
              id ===
              moduleState.activeTournamentId
                ? " — ACTIVE"
                : "";

            return `
              <option value="${escapeHtml(id)}">
                ${escapeHtml(
                  tournament.name ||
                  id
                )}
                (${escapeHtml(id)})${active}
              </option>
            `;
          }
        )
        .join("");

    select.value =
      moduleState.tournamentId ||
      moduleState.activeTournamentId;
  }

  function renderContext() {
    setText(
      "reportsTournamentName",

      moduleState.tournament
        .name ||
      moduleState.tournamentId ||
      "Tournament"
    );

    setText(
      "reportsRosterCount",
      mainRoster().length
    );

    setText(
      "reportsEligibleSubCount",
      eligibleSubs().length
    );

    setText(
      "reportsReadySubCount",
      readySubs().length
    );

    setText(
      "reportsActiveBadge",

      moduleState.tournamentId ===
      moduleState.activeTournamentId
        ? "Active Tournament"
        : "Inactive Tournament"
    );
  }

  function renderSummary() {
    const incidents =
      normalizedIncidents();

    setText(
      "reportsOpenCount",

      incidents.filter(
        incident =>
          incident.status ===
          "open"
      ).length
    );

    setText(
      "reportsReviewingCount",

      incidents.filter(
        incident =>
          [
            "reviewing",
            "contacted"
          ].includes(
            incident.status
          )
      ).length
    );

    setText(
      "reportsHighPriorityCount",

      incidents.filter(
        incident =>
          [
            "high",
            "critical"
          ].includes(
            incident.priority
          )
      ).length
    );

    setText(
      "reportsReplacementCount",

      incidents.filter(
        incident =>
          incident.issueType ===
            "replacement" ||
          incident.status ===
            "replacement_required"
      ).length
    );

    setText(
      "reportsResolvedCount",

      incidents.filter(
        incident =>
          incident.status ===
          "resolved"
      ).length
    );
  }

  function renderIncidentList() {
    const container =
      document.getElementById(
        "reportsIncidentList"
      );

    if (!container) return;

    const incidents =
      filteredIncidents();

    setText(
      "reportsInboxCount",

      `${incidents.length} ${
        incidents.length === 1
          ? "Case"
          : "Cases"
      }`
    );

    if (!incidents.length) {
      container.innerHTML =
        emptyState(
          "No matching reports",
          "No tournament incidents match the current filters.",
          "fa-inbox"
        );

      return;
    }

    if (
      !moduleState
        .selectedIncidentKey ||
      !incidents.some(
        incident =>
          incident.key ===
          moduleState.selectedIncidentKey
      )
    ) {
      moduleState.selectedIncidentKey =
        incidents[0].key;
    }

    container.innerHTML =
      incidents
        .map(incidentCard)
        .join("");
  }

  function incidentCard(
    incident
  ) {
    const selected =
      incident.key ===
      moduleState.selectedIncidentKey;

    const target =
      incident.targetName ||
      getPlayer(
        incident.targetUid
      )?.displayName ||
      "Team / General Issue";

    return `
      <button
        class="reports-incident-card ${
          selected
            ? "selected"
            : ""
        }"
        type="button"
        data-incident-key="${escapeHtml(
          incident.key
        )}"
      >
        <div class="reports-incident-topline">

          <span
            class="reports-priority-badge ${escapeHtml(
              incident.priority
            )}"
          >
            ${escapeHtml(
              priorityLabel(
                incident.priority
              )
            )}
          </span>

          <span
            class="reports-status-badge status-${escapeHtml(
              incident.status
            )}"
          >
            ${escapeHtml(
              STATUS_LABELS[
                incident.status
              ] ||
              formatLabel(
                incident.status
              )
            )}
          </span>

        </div>

        <strong class="reports-incident-title">
          ${escapeHtml(target)}
        </strong>

        <span class="reports-incident-type">
          ${escapeHtml(
            ISSUE_LABELS[
              incident.issueType
            ] ||
            formatLabel(
              incident.issueType
            )
          )}
        </span>

        <div class="reports-incident-meta">

          <span>
            <i class="fa-solid fa-users"></i>

            ${incident.reporterCount}

            ${
              incident.reporterCount ===
              1
                ? "reporter"
                : "reporters"
            }
          </span>

          <span>
            <i class="fa-solid fa-shield-halved"></i>

            ${escapeHtml(
              formatTeamName(
                incident.teamKey
              )
            )}
          </span>

          <span>
            <i class="fa-solid fa-gamepad"></i>

            ${escapeHtml(
              formatLabel(
                incident.matchKey ||
                "general"
              )
            )}
          </span>

        </div>

        <small>
          Updated
          ${escapeHtml(
            formatDateTime(
              incident.updatedAt
            )
          )}
        </small>
      </button>
    `;
  }

  function renderCaseDetail() {
    const container =
      document.getElementById(
        "reportsCaseDetail"
      );

    if (!container) return;

    const incident =
      selectedIncident();

    if (!incident) {
      setText(
        "reportsCaseStatus",
        "Select a case"
      );

      container.innerHTML =
        emptyState(
          "Select a report",
          "Choose an incident from the inbox to review and respond.",
          "fa-folder-open"
        );

      return;
    }

    const targetPlayer =
      incidentTargetPlayer(
        incident
      );

    const targetName =
      incident.targetName ||
      targetPlayer?.displayName ||
      "Team / General Issue";

    setText(
      "reportsCaseStatus",

      STATUS_LABELS[
        incident.status
      ] ||
      formatLabel(
        incident.status
      )
    );

    container.innerHTML = `
      <div class="reports-case-header">

        <div class="reports-case-identity">

          ${avatar(
            targetPlayer || {
              displayName:
                targetName
            },

            "reports-case-avatar"
          )}

          <div>
            <div class="reports-case-badges">

              <span
                class="reports-priority-badge ${escapeHtml(
                  incident.priority
                )}"
              >
                ${escapeHtml(
                  priorityLabel(
                    incident.priority
                  )
                )}
              </span>

              <span
                class="reports-status-badge status-${escapeHtml(
                  incident.status
                )}"
              >
                ${escapeHtml(
                  STATUS_LABELS[
                    incident.status
                  ] ||
                  formatLabel(
                    incident.status
                  )
                )}
              </span>

            </div>

            <h3>
              ${escapeHtml(
                targetName
              )}
            </h3>

            <p>
              ${escapeHtml(
                ISSUE_LABELS[
                  incident.issueType
                ] ||
                formatLabel(
                  incident.issueType
                )
              )}

              ·

              ${escapeHtml(
                formatTeamName(
                  incident.teamKey
                )
              )}

              ·

              ${escapeHtml(
                formatLabel(
                  incident.matchKey ||
                  "general"
                )
              )}
            </p>
          </div>
        </div>

        <div class="reports-case-count">
          <span>Unique Reports</span>

          <strong>
            ${incident.reporterCount}
          </strong>
        </div>
      </div>

      <div class="reports-case-actions">

        ${statusAction(
          "reviewing",
          "Start Review",
          "fa-magnifying-glass",
          incident.status
        )}

        ${statusAction(
          "contacted",
          "Mark Contacted",
          "fa-message",
          incident.status
        )}

        ${statusAction(
          "replacement_required",
          "Replacement Required",
          "fa-people-arrows",
          incident.status
        )}

        ${statusAction(
          "resolved",
          "Resolve",
          "fa-circle-check",
          incident.status
        )}

        ${statusAction(
          "dismissed",
          "Dismiss",
          "fa-ban",
          incident.status
        )}

      </div>

      <section class="reports-case-section">
        <header>
          <div>
            <span>
              Reporter Statements
            </span>

            <strong>
              ${incident.reporterCount}
              Unique
              ${
                incident.reporterCount ===
                1
                  ? "Reporter"
                  : "Reporters"
              }
            </strong>
          </div>
        </header>

        <div class="reports-reporter-list">
          ${incident.reporters
            .map(
              reporterStatement
            )
            .join("")}
        </div>
      </section>

      <section class="reports-case-section">
        <header>
          <div>
            <span>
              Private Case Notes
            </span>

            <strong>
              Visible only to Nexus staff
            </strong>
          </div>
        </header>

        <textarea
          id="reportsInternalNotes"
          class="reports-textarea"
          maxlength="2000"
          placeholder="Document investigation notes, Discord contact, warnings or replacement reasoning."
        >${escapeHtml(
          incident.admin
            .internalNotes ||
          ""
        )}</textarea>

        <div class="reports-editor-actions">
          <button
            class="action-button"
            type="button"
            data-report-action="save-notes"
          >
            <i class="fa-solid fa-floppy-disk"></i>
            Save Internal Notes
          </button>
        </div>
      </section>

      <section
        class="reports-case-section reports-response-section"
      >
        <header>
          <div>
            <span>
              Player Response
            </span>

            <strong>
              Notifies every unique reporter
            </strong>
          </div>
        </header>

        <textarea
          id="reportsPublicResponse"
          class="reports-textarea"
          maxlength="500"
          placeholder="Write the response tournament staff should send to the reporting players."
        >${escapeHtml(
          incident.admin
            .publicResponse ||
          ""
        )}</textarea>

        <div class="reports-editor-actions">

          <button
            class="action-button action-button-primary"
            type="button"
            data-report-action="send-response"
          >
            <i class="fa-solid fa-paper-plane"></i>
            Send Response
          </button>

          ${
            incident.targetUid
              ? `
                <button
                  class="action-button"
                  type="button"
                  data-report-action="focus-subs"
                >
                  <i class="fa-solid fa-user-plus"></i>
                  Find Replacement
                </button>
              `
              : ""
          }

        </div>

        ${
          incident.admin
            .respondedAt
            ? `
              <p class="reports-response-history">
                Last response sent
                ${escapeHtml(
                  formatDateTime(
                    incident.admin
                      .respondedAt
                  )
                )}
              </p>
            `
            : ""
        }
      </section>

      ${replacementHistory(
        incident
      )}
    `;
  }

  function reporterStatement(
    reporter
  ) {
    return `
      <article class="reports-reporter-card">

        <div class="reports-reporter-heading">
          <div>
            <strong>
              ${escapeHtml(
                reporter.reporterName ||
                "Player"
              )}
            </strong>

            <span>
              ${escapeHtml(
                reporter.reporterUid ||
                "Unknown UID"
              )}
            </span>
          </div>

          <time>
            ${escapeHtml(
              formatDateTime(
                reporter.createdAt
              )
            )}
          </time>
        </div>

        <p>
          ${escapeHtml(
            reporter.details ||
            "No written details provided."
          )}
        </p>

      </article>
    `;
  }

  function replacementHistory(
    incident
  ) {
    if (
      !incident.admin
        .replacementSubUid
    ) {
      return "";
    }

    const sub =
      getPlayer(
        incident.admin
          .replacementSubUid
      );

    return `
      <section
        class="reports-case-section reports-resolution-section"
      >
        <header>
          <div>
            <span>
              Replacement Completed
            </span>

            <strong>
              ${escapeHtml(
                sub?.displayName ||
                incident.admin
                  .replacementSubName ||
                "Substitute"
              )}
            </strong>
          </div>
        </header>

        <p>
          Replaced
          ${escapeHtml(
            incident.admin
              .replacedPlayerName ||
            incident.targetName ||
            "player"
          )}

          on

          ${escapeHtml(
            formatTeamName(
              incident.admin
                .replacementTeamKey ||
              incident.teamKey
            )
          )}.
        </p>
      </section>
    `;
  }
function allKnownPlayers() {
  const records =
    new Map();

  Object.entries(
    moduleState.players ||
    {}
  ).forEach(
    ([uid, player]) => {
      records.set(uid, {
        ...(player || {}),
        uid:
          player?.uid ||
          uid
      });
    }
  );

  moduleState.applications.forEach(
    player => {
      if (!player?.uid) {
        return;
      }

      records.set(
        player.uid,
        {
          ...(records.get(
            player.uid
          ) || {}),

          ...player,

          uid:
            player.uid
        }
      );
    }
  );

  mainRoster().forEach(
    player => {
      if (!player?.uid) {
        return;
      }

      records.set(
        player.uid,
        {
          ...(records.get(
            player.uid
          ) || {}),

          ...player,

          uid:
            player.uid
        }
      );
    }
  );

  return Array.from(
    records.values()
  )
    .filter(
      player =>
        clean(player.uid)
    )
    .sort(
      (first, second) =>
        playerDisplayName(first)
          .localeCompare(
            playerDisplayName(
              second
            )
          )
    );
}

function playerDisplayName(
  player
) {
  return clean(
    player?.displayName ||
    player?.rivalsIgn ||
    player?.rgId,
    "Rivals Gauntlet Player"
  );
}

function compareTeamKeys(
  first,
  second
) {
  const firstMatch =
    String(first).match(
      /\d+/
    );

  const secondMatch =
    String(second).match(
      /\d+/
    );

  const firstNumber =
    firstMatch
      ? Number(firstMatch[0])
      : 999;

  const secondNumber =
    secondMatch
      ? Number(secondMatch[0])
      : 999;

  return (
    firstNumber -
      secondNumber ||
    String(first).localeCompare(
      String(second)
    )
  );
}

function clearManualSelection() {
  moduleState.manualTeamKey = "";
  moduleState.manualOutgoingUid = "";
  moduleState.manualIncomingUid = "";

  moduleState.incomingSearch = "";
  moduleState.incomingScope = "all";
  moduleState.incomingReadiness = "all";
  moduleState.incomingRole = "all";

  moduleState.manualReason = "";
}

function reconcileManualSelection() {
  const teams =
    getTeams();

  const team =
    teams[
      moduleState.manualTeamKey
    ] ||
    [];

  if (
    moduleState.manualOutgoingUid &&
    !team.some(
      player =>
        player.uid ===
        moduleState.manualOutgoingUid
    )
  ) {
    clearManualSelection();
    return;
  }

  if (
    moduleState.manualIncomingUid &&
    !allKnownPlayers().some(
      player =>
        player.uid ===
        moduleState.manualIncomingUid
    )
  ) {
    moduleState.manualIncomingUid =
      "";
  }
}

function renderRosterCommandBoard() {
  const board =
    document.getElementById(
      "reportsRosterBoard"
    );

  if (!board) return;

  const teams =
    getTeams();

  const teamKeys =
    Object.keys(teams)
      .sort(compareTeamKeys);

  setText(
    "reportsRosterCommandState",

    moduleState.manualOutgoingUid
      ? moduleState.manualIncomingUid
        ? "Replacement ready"
        : "Choose incoming player"
      : "No player selected"
  );

  if (!teamKeys.length) {
    board.innerHTML =
      emptyState(
        "No published team rosters",
        "Publish teams for this tournament before using roster substitutions.",
        "fa-users-slash"
      );

    renderIncomingDrawer();
    return;
  }

  board.innerHTML =
    teamKeys
      .map(
        teamKey =>
          teamCardMarkup(
            teamKey,
            teams[teamKey] ||
            []
          )
      )
      .join("");

  renderIncomingDrawer();
}

function teamCardMarkup(
  teamKey,
  roster
) {
  const selectedTeam =
    moduleState.manualTeamKey ===
    teamKey;

  const logo =
    getTeamLogo(
      teamKey
    );

  const readyCount =
    roster.filter(
      player =>
        isReady(
          player.uid
        )
    ).length;

  return `
    <article
      class="reports-team-card ${
        selectedTeam
          ? "selected-team"
          : ""
      }"
    >
      <header class="reports-team-card-header">

        <div class="reports-team-identity">

          ${
            logo
              ? `
                <img
                  src="${escapeHtml(logo)}"
                  alt="${escapeHtml(
                    formatTeamName(
                      teamKey
                    )
                  )}"
                >
              `
              : `
                <span class="reports-team-logo-fallback">
                  ${escapeHtml(
                    initials(
                      formatTeamName(
                        teamKey
                      )
                    )
                  )}
                </span>
              `
          }

          <div>
            <span>
              ${escapeHtml(
                teamKey.toUpperCase()
              )}
            </span>

            <strong>
              ${escapeHtml(
                formatTeamName(
                  teamKey
                )
              )}
            </strong>
          </div>
        </div>

        <div class="reports-team-counts">
          <span>
            ${roster.length} Players
          </span>

          <small>
            ${readyCount} Ready
          </small>
        </div>

      </header>

      <div class="reports-team-roster">
        ${
          roster.length
            ? roster
                .map(
                  player =>
                    rosterPlayerRowMarkup(
                      teamKey,
                      player
                    )
                )
                .join("")
            : `
              <div class="reports-team-empty">
                <i class="fa-solid fa-user-plus"></i>
                No players published
              </div>
            `
        }
      </div>
    </article>
  `;
}

function rosterPlayerRowMarkup(
  teamKey,
  player
) {
  const selected =
    moduleState.manualOutgoingUid ===
    player.uid;

  const readiness =
    playerReadiness(
      player.uid
    );

  return `
    <button
      class="reports-roster-player ${
        selected
          ? "selected-out"
          : ""
      }"
      type="button"
      data-roster-action="select-outgoing"
      data-team-key="${escapeHtml(teamKey)}"
      data-player-uid="${escapeHtml(
        player.uid
      )}"
    >
      ${avatar(
        player,
        "reports-roster-avatar"
      )}

      <span class="reports-roster-player-copy">
        <strong>
          ${escapeHtml(
            playerDisplayName(
              player
            )
          )}
        </strong>

        <small>
          ${escapeHtml(
            player.rivalsIgn ||
            player.rgId ||
            "No IGN"
          )}

          ${
            player.mainRole
              ? ` • ${escapeHtml(
                  player.mainRole
                )}`
              : ""
          }
        </small>
      </span>

      <span class="reports-roster-player-meta">
        <b class="${escapeHtml(
          readiness.className
        )}">
          ${escapeHtml(
            readiness.label
          )}
        </b>

        <small>
          ${escapeHtml(
            player.peakRank ||
            "No Rank"
          )}
        </small>
      </span>

      <span class="reports-roster-select-label">
        ${
          selected
            ? "OUT"
            : "Select"
        }
      </span>
    </button>
  `;
}

function renderIncomingDrawer() {
  const drawer =
    document.getElementById(
      "reportsIncomingDrawer"
    );

  if (!drawer) return;

  const outgoing =
    rosterPlayer(
      moduleState.manualOutgoingUid
    );

  if (
    !moduleState.manualTeamKey ||
    !outgoing
  ) {
    drawer.innerHTML =
      emptyState(
        "Choose an outgoing player",
        "Select a player from any team roster to open the replacement pool.",
        "fa-arrow-pointer"
      );

    return;
  }

  const incoming =
    allKnownPlayers()
      .find(
        player =>
          player.uid ===
          moduleState.manualIncomingUid
      );

  drawer.innerHTML = `
    <div class="reports-incoming-header">
      <div>
        <span>
          Substitution Builder
        </span>

        <h3>
          ${escapeHtml(
            formatTeamName(
              moduleState.manualTeamKey
            )
          )}
        </h3>

        <p>
          Replacing

          <strong>
            ${escapeHtml(
              playerDisplayName(
                outgoing
              )
            )}
          </strong>
        </p>
      </div>

      <button
        class="reports-clear-selection"
        type="button"
        data-roster-action="clear-selection"
      >
        <i class="fa-solid fa-xmark"></i>
        Clear
      </button>
    </div>

    <div class="reports-swap-preview ${
      incoming
        ? "ready"
        : ""
    }">
      ${swapPlayerMarkup(
        "OUT",
        outgoing,
        moduleState.manualTeamKey,
        "out"
      )}

      <span class="reports-swap-arrow">
        <i class="fa-solid fa-arrow-right-arrow-left"></i>
      </span>

      ${
        incoming
          ? swapPlayerMarkup(
              "IN",
              incoming,
              assignedTeamKey(
                incoming.uid
              ) ||
              "Unassigned",
              "in"
            )
          : `
            <div class="reports-swap-player empty">
              <span>IN</span>

              <strong>
                Select a replacement
              </strong>

              <small>
                Use the player pool below
              </small>
            </div>
          `
      }
    </div>

    <div class="reports-incoming-toolbar">

      <div class="reports-search">
        <i class="fa-solid fa-magnifying-glass"></i>

        <input
          id="reportsIncomingSearch"
          type="search"
          value="${escapeHtml(
            moduleState.incomingSearch
          )}"
          placeholder="Search name, IGN, RG ID, role or rank..."
          autocomplete="off"
        >
      </div>

      <select
        id="reportsIncomingScopeFilter"
        class="reports-select"
      >
        ${selectOption(
          "all",
          "All RG Players",
          moduleState.incomingScope
        )}

        ${selectOption(
          "eligible",
          "Eligible Substitutes",
          moduleState.incomingScope
        )}

        ${selectOption(
          "unassigned",
          "Unassigned Players",
          moduleState.incomingScope
        )}

        ${selectOption(
          "transfers",
          "Team Transfers",
          moduleState.incomingScope
        )}
      </select>

      <select
        id="reportsIncomingReadinessFilter"
        class="reports-select"
      >
        ${selectOption(
          "all",
          "Any Readiness",
          moduleState.incomingReadiness
        )}

        ${selectOption(
          "ready",
          "Ready Now",
          moduleState.incomingReadiness
        )}

        ${selectOption(
          "not_ready",
          "Not Checked In",
          moduleState.incomingReadiness
        )}

        ${selectOption(
          "unavailable",
          "Unavailable",
          moduleState.incomingReadiness
        )}
      </select>

      <select
        id="reportsIncomingRoleFilter"
        class="reports-select"
      >
        ${incomingRoleOptions()}
      </select>
    </div>

    <div
      id="reportsIncomingPool"
      class="reports-incoming-pool"
    ></div>

    <div class="reports-execute-bar">

      <label class="reports-field reports-execute-reason">
        <span>
          Administrative Reason — Optional
        </span>

        <textarea
          id="reportsManualReason"
          class="reports-textarea"
          maxlength="500"
          placeholder="Emergency replacement, availability change, roster correction, staff decision..."
        >${escapeHtml(
          moduleState.manualReason
        )}</textarea>
      </label>

      <div class="reports-execute-summary">
        <span>
          ${
            incoming
              ? "Ready to execute"
              : "Select an incoming player"
          }
        </span>

        <strong>
          ${
            incoming
              ? `${escapeHtml(
                  playerDisplayName(
                    outgoing
                  )
                )} → ${escapeHtml(
                  playerDisplayName(
                    incoming
                  )
                )}`
              : "Substitution incomplete"
          }
        </strong>

        <button
          class="action-button action-button-primary"
          type="button"
          data-roster-action="execute"
          ${
            incoming
              ? ""
              : "disabled"
          }
        >
          <i class="fa-solid fa-people-arrows"></i>
          Execute Substitution
        </button>
      </div>
    </div>
  `;

  renderIncomingPoolOnly();
}

function renderIncomingPoolOnly() {
  const pool =
    document.getElementById(
      "reportsIncomingPool"
    );

  if (!pool) return;

  const candidates =
    filteredIncomingPlayers();

  if (!candidates.length) {
    pool.innerHTML =
      emptyState(
        "No matching players",
        "Adjust the player scope, readiness, role, or search filters.",
        "fa-user-slash"
      );

    return;
  }

  pool.innerHTML =
    candidates
      .map(
        incomingPlayerCardMarkup
      )
      .join("");
}

function filteredIncomingPlayers() {
  const roster =
    getTeams()[
      moduleState.manualTeamKey
    ] ||
    [];

  const rosterUids =
    new Set(
      roster.map(
        player =>
          player.uid
      )
    );

  const eligibleUids =
    new Set(
      eligibleSubs().map(
        player =>
          player.uid
      )
    );

  const search =
    clean(
      moduleState.incomingSearch
    ).toLowerCase();

  return allKnownPlayers()
    .filter(player => {
      if (
        !player.uid ||
        player.uid ===
          moduleState.manualOutgoingUid
      ) {
        return false;
      }

      if (
        rosterUids.has(
          player.uid
        )
      ) {
        return false;
      }

      const assigned =
        assignedTeamKey(
          player.uid
        );

      const readiness =
        playerReadiness(
          player.uid
        );

      if (
        moduleState.incomingScope ===
          "eligible" &&
        !eligibleUids.has(
          player.uid
        )
      ) {
        return false;
      }

      if (
        moduleState.incomingScope ===
          "unassigned" &&
        assigned
      ) {
        return false;
      }

      if (
        moduleState.incomingScope ===
          "transfers" &&
        !assigned
      ) {
        return false;
      }

      if (
        moduleState.incomingReadiness !==
          "all" &&
        readiness.key !==
          moduleState.incomingReadiness
      ) {
        return false;
      }

      if (
        moduleState.incomingRole !==
          "all" &&
        clean(
          player.mainRole
        ) !==
          moduleState.incomingRole
      ) {
        return false;
      }

      if (!search) {
        return true;
      }

      return [
        player.displayName,
        player.rivalsIgn,
        player.rgId,
        player.mainRole,
        player.peakRank,
        player.region,
        player.platform,
        assigned
          ? formatTeamName(
              assigned
            )
          : "unassigned"
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(search);
    })
    .sort(
      (
        first,
        second
      ) => {
        const firstSelected =
          first.uid ===
          moduleState.manualIncomingUid
            ? 1
            : 0;

        const secondSelected =
          second.uid ===
          moduleState.manualIncomingUid
            ? 1
            : 0;

        if (
          firstSelected !==
          secondSelected
        ) {
          return (
            secondSelected -
            firstSelected
          );
        }

        const firstReady =
          isReady(first.uid)
            ? 1
            : 0;

        const secondReady =
          isReady(second.uid)
            ? 1
            : 0;

        if (
          firstReady !==
          secondReady
        ) {
          return (
            secondReady -
            firstReady
          );
        }

        return playerDisplayName(
          first
        ).localeCompare(
          playerDisplayName(
            second
          )
        );
      }
    );
}

function incomingPlayerCardMarkup(
  player
) {
  const selected =
    moduleState.manualIncomingUid ===
    player.uid;

  const assigned =
    assignedTeamKey(
      player.uid
    );

  const readiness =
    playerReadiness(
      player.uid
    );

  return `
    <button
      class="reports-incoming-player ${
        selected
          ? "selected-in"
          : ""
      }"
      type="button"
      data-roster-action="select-incoming"
      data-player-uid="${escapeHtml(
        player.uid
      )}"
    >
      ${avatar(
        player,
        "reports-incoming-avatar"
      )}

      <span class="reports-incoming-player-copy">
        <strong>
          ${escapeHtml(
            playerDisplayName(
              player
            )
          )}
        </strong>

        <small>
          ${escapeHtml(
            player.rivalsIgn ||
            player.rgId ||
            "No IGN"
          )}
        </small>
      </span>

      <span class="reports-incoming-tags">
        <b>
          ${escapeHtml(
            player.mainRole ||
            "No Role"
          )}
        </b>

        <small>
          ${escapeHtml(
            player.peakRank ||
            "No Rank"
          )}
        </small>
      </span>

      <span class="reports-incoming-status">
        <b class="${escapeHtml(
          readiness.className
        )}">
          ${escapeHtml(
            readiness.label
          )}
        </b>

        <small>
          ${escapeHtml(
            assigned
              ? formatTeamName(
                  assigned
                )
              : "Unassigned"
          )}
        </small>
      </span>

      <span class="reports-incoming-select-label">
        ${
          selected
            ? "IN"
            : "Select"
        }
      </span>
    </button>
  `;
}

function swapPlayerMarkup(
  label,
  player,
  teamLabel,
  tone
) {
  return `
    <div class="reports-swap-player ${escapeHtml(
      tone
    )}">
      <span>
        ${escapeHtml(label)}
      </span>

      ${avatar(
        player,
        "reports-swap-avatar"
      )}

      <strong>
        ${escapeHtml(
          playerDisplayName(
            player
          )
        )}
      </strong>

      <small>
        ${escapeHtml(
          player.mainRole ||
          "No Role"
        )}

        •

        ${escapeHtml(
          formatTeamName(
            teamLabel
          )
        )}
      </small>
    </div>
  `;
}

function incomingRoleOptions() {
  const roles =
    Array.from(
      new Set(
        allKnownPlayers()
          .map(
            player =>
              clean(
                player.mainRole
              )
          )
          .filter(Boolean)
      )
    ).sort();

  if (
    moduleState.incomingRole !==
      "all" &&
    !roles.includes(
      moduleState.incomingRole
    )
  ) {
    moduleState.incomingRole =
      "all";
  }

  return [
    selectOption(
      "all",
      "All Roles",
      moduleState.incomingRole
    ),

    ...roles.map(
      role =>
        selectOption(
          role,
          role,
          moduleState.incomingRole
        )
    )
  ].join("");
}

function selectOption(
  value,
  label,
  currentValue
) {
  return `
    <option
      value="${escapeHtml(value)}"
      ${
        value ===
        currentValue
          ? "selected"
          : ""
      }
    >
      ${escapeHtml(label)}
    </option>
  `;
}

function playerReadiness(uid) {
  if (
    isUnavailable(uid)
  ) {
    return {
      key: "unavailable",
      label: "Unavailable",
      className: "unavailable"
    };
  }

  if (
    isReady(uid)
  ) {
    return {
      key: "ready",
      label: "Ready",
      className: "ready"
    };
  }

  return {
    key: "not_ready",
    label: "Not Checked In",
    className: "pending"
  };
}
  function renderRoleOptions() {
    const select =
      document.getElementById(
        "reportsSubRoleFilter"
      );

    if (!select) return;

    const current =
      select.value ||
      "all";

    const roles =
      Array.from(
        new Set(
          eligibleSubs()
            .map(
              player =>
                clean(
                  player.mainRole
                )
            )
            .filter(Boolean)
        )
      ).sort();

    select.innerHTML = `
      <option value="all">
        All Roles
      </option>

      ${roles
        .map(
          role => `
            <option value="${escapeHtml(role)}">
              ${escapeHtml(role)}
            </option>
          `
        )
        .join("")}
    `;

    select.value =
      roles.includes(current)
        ? current
        : "all";
  }

  function renderSubPool() {
    const container =
      document.getElementById(
        "reportsSubPool"
      );

    if (!container) return;

    const incident =
      selectedIncident();

    const targetPlayer =
      incident
        ? incidentTargetPlayer(
            incident
          )
        : null;

    setText(
      "reportsSubContextLabel",

      targetPlayer
        ? `Best replacements for ${
            targetPlayer
              .displayName ||
            incident.targetName ||
            "reported player"
          }`
        : "All eligible substitutes"
    );

    const search =
      clean(
        document.getElementById(
          "reportsSubSearch"
        )?.value
      ).toLowerCase();

    const readinessFilter =
      document.getElementById(
        "reportsSubReadinessFilter"
      )?.value ||
      "ready";

    const roleFilter =
      document.getElementById(
        "reportsSubRoleFilter"
      )?.value ||
      "all";

    const candidates =
      eligibleSubs()
        .map(player => {
          const assignedTeam =
            assignedTeamKey(
              player.uid
            );

          const ready =
            isReady(
              player.uid
            );

          return {
            ...player,
            ready,
            assignedTeam,

            replacementScore:
              targetPlayer
                ? getReplacementScore(
                    targetPlayer,
                    player
                  )
                : null
          };
        })
        .filter(player => {
          if (
            readinessFilter ===
              "ready" &&
            (
              !player.ready ||
              player.assignedTeam
            )
          ) {
            return false;
          }

          if (
            readinessFilter ===
              "not_ready" &&
            player.ready
          ) {
            return false;
          }

          if (
            readinessFilter ===
              "assigned" &&
            !player.assignedTeam
          ) {
            return false;
          }

          if (
            roleFilter !==
              "all" &&
            player.mainRole !==
              roleFilter
          ) {
            return false;
          }

          if (!search) {
            return true;
          }

          return [
            player.displayName,
            player.rivalsIgn,
            player.rgId,
            player.peakRank,
            player.mainRole,
            player.region,
            player.platform
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(search);
        })
        .sort(
          (
            first,
            second
          ) => {
            const assignedDifference =
              Number(
                Boolean(
                  first.assignedTeam
                )
              ) -
              Number(
                Boolean(
                  second.assignedTeam
                )
              );

            if (
              assignedDifference !==
              0
            ) {
              return assignedDifference;
            }

            const readinessDifference =
              Number(
                second.ready
              ) -
              Number(
                first.ready
              );

            if (
              readinessDifference !==
              0
            ) {
              return readinessDifference;
            }

            if (targetPlayer) {
              const scoreDifference =
                Number(
                  second.replacementScore ||
                  0
                ) -
                Number(
                  first.replacementScore ||
                  0
                );

              if (
                scoreDifference !==
                0
              ) {
                return scoreDifference;
              }
            }

            return String(
              first.displayName ||
              ""
            ).localeCompare(
              String(
                second.displayName ||
                ""
              )
            );
          }
        );

    if (
      !eligibleSubs().length
    ) {
      container.innerHTML =
        emptyState(
          "No eligible substitutes",
          "Waitlisted players who selected substitute availability will appear here.",
          "fa-people-arrows"
        );

      return;
    }

    if (!candidates.length) {
      container.innerHTML =
        emptyState(
          "No matching substitutes",
          "Adjust the readiness, role or search filters.",
          "fa-magnifying-glass"
        );

      return;
    }

    container.innerHTML =
      candidates
        .map(
          player =>
            substituteCard(
              player,
              incident,
              targetPlayer
            )
        )
        .join("");
  }

  function substituteCard(
    player,
    incident,
    targetPlayer
  ) {
    const availabilityState =
      isUnavailable(
        player.uid
      )
        ? "unavailable"
        : player.ready
          ? "ready"
          : "pending";

    const statusText =
      player.assignedTeam
        ? `Assigned to ${formatTeamName(
            player.assignedTeam
          )}`
        : isUnavailable(
            player.uid
          )
          ? "Unavailable"
          : player.ready
            ? "Ready Now"
            : "Not Checked In";

    const canReplace =
      Boolean(
        incident?.targetUid &&
        targetPlayer &&
        player.ready &&
        !player.assignedTeam &&
        player.uid !==
          incident.targetUid
      );

    return `
      <article
        class="reports-sub-card ${availabilityState}"
      >
        <div class="reports-sub-identity">

          ${avatar(
            player,
            "reports-sub-avatar"
          )}

          <div>
            <strong>
              ${escapeHtml(
                player.displayName ||
                player.rivalsIgn ||
                "Substitute"
              )}
            </strong>

            <span>
              ${escapeHtml(
                player.rgId ||
                "NO RG ID"
              )}
            </span>
          </div>

          <span
            class="reports-sub-state ${availabilityState}"
          >
            ${escapeHtml(
              statusText
            )}
          </span>

        </div>

        <div class="reports-sub-tags">
          <span>
            ${escapeHtml(
              player.peakRank ||
              "No Rank"
            )}
          </span>

          <span>
            ${escapeHtml(
              player.mainRole ||
              "No Role"
            )}
          </span>

          <span>
            ${escapeHtml(
              player.region ||
              "No Region"
            )}
          </span>

          <span>
            ${escapeHtml(
              player.platform ||
              "No Platform"
            )}
          </span>
        </div>

        <div class="reports-sub-footer">

          ${
            targetPlayer
              ? `
                <div class="reports-match-score">
                  <span>
                    Roster Match
                  </span>

                  <strong>
                    ${Number(
                      player.replacementScore ||
                      0
                    )}%
                  </strong>
                </div>
              `
              : `
                <div class="reports-match-score">
                  <span>
                    Availability
                  </span>

                  <strong>
                    ${
                      player.ready
                        ? "READY"
                        : "WAIT"
                    }
                  </strong>
                </div>
              `
          }

          <div class="reports-sub-actions">

            <a
              href="player.html?id=${encodeURIComponent(
                player.uid
              )}"
              target="_blank"
              rel="noopener noreferrer"
            >
              Profile
            </a>

            <button
              type="button"
              data-report-action="replace"
              data-sub-uid="${escapeHtml(
                player.uid
              )}"
              ${
                canReplace
                  ? ""
                  : "disabled"
              }
            >
              Replace Target
            </button>

          </div>
        </div>
      </article>
    `;
  }

  async function updateCaseStatus(
    nextStatus,
    button
  ) {
    const incident =
      selectedIncident();

    if (
      !incident ||
      !STATUS_LABELS[
        nextStatus
      ]
    ) {
      return;
    }

    const updates = {
      status:
        nextStatus,

      updatedAt:
        firebase.database
          .ServerValue
          .TIMESTAMP,

      updatedBy:
        context.currentUser?.uid ||
        null
    };

    if (
      nextStatus ===
        "resolved" ||
      nextStatus ===
        "dismissed"
    ) {
      updates.resolvedAt =
        firebase.database
          .ServerValue
          .TIMESTAMP;
    }

    await buttonAction(
      button,
      "Updating...",
      async () => {
        await context.database
          .ref(
            `tournamentReports/${moduleState.tournamentId}/${incident.key}/admin`
          )
          .update(updates);

        context.showToast(
          `Case marked ${
            STATUS_LABELS[
              nextStatus
            ]
          }.`
        );
      }
    );
  }

  async function saveInternalNotes(
    button
  ) {
    const incident =
      selectedIncident();

    if (!incident) return;

    const notes =
      clean(
        document.getElementById(
          "reportsInternalNotes"
        )?.value
      );

    await buttonAction(
      button,
      "Saving...",
      async () => {
        await context.database
          .ref(
            `tournamentReports/${moduleState.tournamentId}/${incident.key}/admin`
          )
          .update({
            internalNotes:
              notes,

            updatedAt:
              firebase.database
                .ServerValue
                .TIMESTAMP,

            updatedBy:
              context.currentUser?.uid ||
              null
          });

        context.showToast(
          "Internal report notes saved."
        );
      }
    );
  }

  async function sendReporterResponse(
    button
  ) {
    const incident =
      selectedIncident();

    if (!incident) return;

    const response =
      clean(
        document.getElementById(
          "reportsPublicResponse"
        )?.value
      );

    if (!response) {
      context.showToast(
        "Write a player response before sending."
      );

      return;
    }

    await buttonAction(
      button,
      "Sending...",
      async () => {
        const timestamp =
          firebase.database
            .ServerValue
            .TIMESTAMP;

        const updates = {};

        updates[
          `tournamentReports/${moduleState.tournamentId}/${incident.key}/admin/publicResponse`
        ] = response;

        updates[
          `tournamentReports/${moduleState.tournamentId}/${incident.key}/admin/respondedAt`
        ] = timestamp;

        updates[
          `tournamentReports/${moduleState.tournamentId}/${incident.key}/admin/respondedBy`
        ] =
          context.currentUser?.uid ||
          null;

        updates[
          `tournamentReports/${moduleState.tournamentId}/${incident.key}/admin/updatedAt`
        ] = timestamp;

        updates[
          `tournamentReports/${moduleState.tournamentId}/${incident.key}/admin/status`
        ] =
          incident.status ===
          "open"
            ? "contacted"
            : incident.status;

        incident.reporters.forEach(
          reporter => {
            if (
              !reporter.reporterUid
            ) {
              return;
            }

            const notificationKey =
              context.database
                .ref(
                  `notifications/${reporter.reporterUid}`
                )
                .push()
                .key;

            updates[
              `notifications/${reporter.reporterUid}/${notificationKey}`
            ] = {
              title:
                "Tournament Report Update",

              message:
                response,

              type:
                "tournament_report",

              tournamentId:
                moduleState.tournamentId,

              incidentKey:
                incident.key,

              read:
                false,

              createdAt:
                timestamp
            };
          }
        );

        await context.database
          .ref()
          .update(updates);

        context.showToast(
          `Response sent to ${
            incident.reporterCount
          } ${
            incident.reporterCount ===
            1
              ? "reporter"
              : "reporters"
          }.`
        );
      }
    );
  }
  async function queueDiscordSubstitutionJob(
  outgoingPlayer,
  incomingPlayer,
  teamKey
) {
  if (
    typeof firebase === "undefined" ||
    typeof firebase.functions !==
      "function"
  ) {
    throw new Error(
      "The Firebase Functions browser SDK is not loaded."
    );
  }

  const outgoingDiscordUserId =
    getDiscordUserId(
      outgoingPlayer
    );

  const incomingDiscordUserId =
    getDiscordUserId(
      incomingPlayer
    );

  const callable =
  firebase
    .app()
    .functions("us-central1")
    .httpsCallable(
      "queueDiscordSubstitution"
    );

  const response =
    await callable({
      tournamentId:
        moduleState.tournamentId,

      teamKey,

      outgoingDiscordUserId,

      incomingDiscordUserId,

      substituteDiscordUserId:
        incomingDiscordUserId,

      outgoingPlayerUid:
        outgoingPlayer.uid || "",

      incomingPlayerUid:
        incomingPlayer.uid || "",

      substitutePlayerUid:
        incomingPlayer.uid || "",

      outgoingPlayerName:
        playerDisplayName(
          outgoingPlayer
        ),

      incomingPlayerName:
        playerDisplayName(
          incomingPlayer
        ),

      substitutePlayerName:
        playerDisplayName(
          incomingPlayer
        )
    });

  return (
    response?.data || {}
  );
}
async function executeManualSubstitution(
  button
) {
  const teamKey =
    moduleState.manualTeamKey;

  const outgoingUid =
    moduleState.manualOutgoingUid;

  const incomingUid =
    moduleState.manualIncomingUid;

  const reason =
    clean(
      moduleState.manualReason ||
      document.getElementById(
        "reportsManualReason"
      )?.value
    );

  const teams =
    getTeams();

  const targetTeam =
    teams[teamKey] ||
    [];

  const outgoing =
    targetTeam.find(
      player =>
        player.uid ===
        outgoingUid
    );

  const incoming =
    allKnownPlayers()
      .find(
        player =>
          player.uid ===
          incomingUid
      );

  if (!teamKey) {
    context.showToast(
      "Select a team."
    );

    return;
  }

  if (!outgoing) {
    context.showToast(
      "Select a current player from that team."
    );

    return;
  }

  if (!incoming) {
    context.showToast(
      "Select an incoming player."
    );

    return;
  }

  if (
    outgoing.uid ===
    incoming.uid
  ) {
    context.showToast(
      "The outgoing and incoming players cannot be the same."
    );

    return;
  }

  const incomingCurrentTeam =
    assignedTeamKey(
      incoming.uid
    );

  if (
    incomingCurrentTeam ===
    teamKey
  ) {
    context.showToast(
      "The incoming player is already on the selected team."
    );

    return;
  }

  const transferWarning =
    incomingCurrentTeam
      ? `\n\n${playerDisplayName(
          incoming
        )} is currently assigned to ${formatTeamName(
          incomingCurrentTeam
        )} and will be removed from that roster.`
      : "";
const incomingIsTest =
  isTestPlayer(incoming);

if (
  !incomingIsTest &&
  !hasValidDiscordUserId(
    incoming
  )
) {
  context.showToast(
    `${playerDisplayName(incoming)} is missing a Discord User ID.`
  );

  return;
}
  const confirmed =
    window.confirm(
      `Execute this roster substitution?\n\n` +
      `${formatTeamName(
        teamKey
      )}\n` +
      `OUT: ${playerDisplayName(
        outgoing
      )}\n` +
      `IN: ${playerDisplayName(
        incoming
      )}` +
      transferWarning +
      `\n\nThis immediately updates the published tournament roster.`
    );

  if (!confirmed) {
    return;
  }

  await buttonAction(
    button,
    "Substituting...",

    async () => {
      const timestamp =
        firebase.database
          .ServerValue
          .TIMESTAMP;

      const historyReference =
        context.database.ref(
          `tournaments/${moduleState.tournamentId}/substitutions`
        ).push();

      const historyKey =
        historyReference.key;

      const updatedTargetTeam =
        targetTeam.map(
          player => {
            if (
              player.uid !==
              outgoing.uid
            ) {
              return publicPlayer(
                player
              );
            }

            return {
              ...publicPlayer(
                incoming
              ),

              replacedPlayerUid:
                outgoing.uid,

              addedAsSubstitute:
                true,

              substitutedAt:
                timestamp
            };
          }
        );

      const updates = {
        [`teams/${moduleState.tournamentId}/teams/${teamKey}`]:
          updatedTargetTeam,

        [`teams/${moduleState.tournamentId}/updatedAt`]:
          timestamp,

        [`teams/${moduleState.tournamentId}/updatedBy`]:
          context.currentUser?.uid ||
          null,

        [`applications/${moduleState.tournamentId}/${incoming.uid}/uid`]:
          incoming.uid,

        [`applications/${moduleState.tournamentId}/${incoming.uid}/tournamentId`]:
          moduleState.tournamentId,

        [`applications/${moduleState.tournamentId}/${incoming.uid}/displayName`]:
          incoming.displayName ||
          "",

        [`applications/${moduleState.tournamentId}/${incoming.uid}/rivalsIgn`]:
          incoming.rivalsIgn ||
          "",

        [`applications/${moduleState.tournamentId}/${incoming.uid}/rgId`]:
          incoming.rgId ||
          "",

        [`applications/${moduleState.tournamentId}/${incoming.uid}/status`]:
          "accepted",

        [`applications/${moduleState.tournamentId}/${incoming.uid}/addedAsSubstitute`]:
          true,

        [`applications/${moduleState.tournamentId}/${incoming.uid}/substitutedInto`]:
          teamKey,

        [`applications/${moduleState.tournamentId}/${incoming.uid}/substitutedAt`]:
          timestamp,

        [`applications/${moduleState.tournamentId}/${incoming.uid}/previousTeamKey`]:
          incomingCurrentTeam ||
          null,

        [`applications/${moduleState.tournamentId}/${incoming.uid}/updatedAt`]:
          timestamp,

        [`applications/${moduleState.tournamentId}/${outgoing.uid}/replacedBySubUid`]:
          incoming.uid,

        [`applications/${moduleState.tournamentId}/${outgoing.uid}/replacedAt`]:
          timestamp,

        [`applications/${moduleState.tournamentId}/${outgoing.uid}/substitutedOutOf`]:
          teamKey,

        [`applications/${moduleState.tournamentId}/${outgoing.uid}/updatedAt`]:
          timestamp,

        [`checkIns/${moduleState.tournamentId}/${incoming.uid}/uid`]:
          incoming.uid,

        [`checkIns/${moduleState.tournamentId}/${incoming.uid}/displayName`]:
          playerDisplayName(
            incoming
          ),

        [`checkIns/${moduleState.tournamentId}/${incoming.uid}/checkedIn`]:
          true,

        [`checkIns/${moduleState.tournamentId}/${incoming.uid}/type`]:
          "main",

        [`checkIns/${moduleState.tournamentId}/${incoming.uid}/teamKey`]:
          teamKey,

        [`checkIns/${moduleState.tournamentId}/${incoming.uid}/replacedPlayerUid`]:
          outgoing.uid,

        [`checkIns/${moduleState.tournamentId}/${incoming.uid}/updatedAt`]:
          timestamp,

        [`checkIns/${moduleState.tournamentId}/${outgoing.uid}/checkedIn`]:
          false,

        [`checkIns/${moduleState.tournamentId}/${outgoing.uid}/replacedBySubUid`]:
          incoming.uid,

        [`checkIns/${moduleState.tournamentId}/${outgoing.uid}/updatedAt`]:
          timestamp,

        [`availability/${moduleState.tournamentId}/${incoming.uid}/status`]:
          "available",

        [`availability/${moduleState.tournamentId}/${incoming.uid}/updatedAt`]:
          timestamp,

        [`tournaments/${moduleState.tournamentId}/substitutions/${historyKey}`]:
          {
            substitutionId:
              historyKey,

            type:
              incomingCurrentTeam
                ? "manual_transfer"
                : "manual_substitution",

            teamKey,

            outgoingUid:
              outgoing.uid,

            outgoingName:
              playerDisplayName(
                outgoing
              ),

            incomingUid:
              incoming.uid,

            incomingName:
              playerDisplayName(
                incoming
              ),

            previousIncomingTeamKey:
              incomingCurrentTeam ||
              "",

            reason,

            createdAt:
              timestamp,

            createdBy:
              context.currentUser?.uid ||
              null
          }
      };

      if (
        incomingCurrentTeam &&
        incomingCurrentTeam !==
          teamKey
      ) {
        const previousTeam =
          teams[
            incomingCurrentTeam
          ] ||
          [];

        updates[
          `teams/${moduleState.tournamentId}/teams/${incomingCurrentTeam}`
        ] =
          previousTeam
            .filter(
              player =>
                player.uid !==
                incoming.uid
            )
            .map(
              publicPlayer
            );
      }

      const incomingNotificationKey =
        context.database
          .ref(
            `notifications/${incoming.uid}`
          )
          .push()
          .key;

      const outgoingNotificationKey =
        context.database
          .ref(
            `notifications/${outgoing.uid}`
          )
          .push()
          .key;

      updates[
        `notifications/${incoming.uid}/${incomingNotificationKey}`
      ] = {
        title:
          "You Have Been Subbed In",

        message:
          `You have been assigned to ${formatTeamName(
            teamKey
          )}. Report to your team voice channel and tournament staff immediately.`,

        type:
          "substitution",

        tournamentId:
          moduleState.tournamentId,

        teamKey,

        read:
          false,

        createdAt:
          timestamp
      };

      updates[
        `notifications/${outgoing.uid}/${outgoingNotificationKey}`
      ] = {
        title:
          "Tournament Roster Updated",

        message:
          `You have been removed from ${formatTeamName(
            teamKey
          )}. Contact tournament staff with any questions.`,

        type:
          "substitution",

        tournamentId:
          moduleState.tournamentId,

        teamKey,

        read:
          false,

        createdAt:
          timestamp
      };

      await context.database
        .ref()
        .update(updates);
let discordSyncFailed = false;
let discordSyncError = "";

if (!isTestPlayer(incoming)) {
  try {
    const discordResult =
      await queueDiscordSubstitutionJob(
        outgoing,
        incoming,
        teamKey
      );

    const jobId =
      discordResult.jobId ||
      discordResult.id ||
      "";

    await context.database
      .ref()
      .update({
        [`tournaments/${moduleState.tournamentId}/substitutions/${historyKey}/discordStatus`]:
          "queued",

        [`tournaments/${moduleState.tournamentId}/substitutions/${historyKey}/discordJobId`]:
          jobId,

        [`tournaments/${moduleState.tournamentId}/substitutions/${historyKey}/discordError`]:
          null,

        [`tournaments/${moduleState.tournamentId}/substitutions/${historyKey}/discordUpdatedAt`]:
          firebase.database.ServerValue.TIMESTAMP
      });
  } catch (error) {
    console.error(
      "Discord substitution failed:",
      error
    );

    discordSyncFailed = true;

    discordSyncError =
      error?.message ||
      error?.details ||
      error?.code ||
      "Unknown Discord synchronization error";

    await context.database
      .ref()
      .update({
        [`tournaments/${moduleState.tournamentId}/substitutions/${historyKey}/discordStatus`]:
          "failed",

        [`tournaments/${moduleState.tournamentId}/substitutions/${historyKey}/discordError`]:
          discordSyncError,

        [`tournaments/${moduleState.tournamentId}/substitutions/${historyKey}/discordUpdatedAt`]:
          firebase.database.ServerValue.TIMESTAMP
      });
  }
}
      clearManualSelection();
renderRosterCommandBoard();

      if (discordSyncFailed) {
  const message =
    `${playerDisplayName(incoming)} replaced ` +
    `${playerDisplayName(outgoing)} on ` +
    `${formatTeamName(teamKey)}, but Discord failed: ` +
    `${discordSyncError}`;

  context.showToast(message);

  window.alert(
    `Roster Updated — Discord Failed\n\n${discordSyncError}`
  );
} else {
  context.showToast(
    `${playerDisplayName(
      incoming
    )} replaced ${playerDisplayName(
      outgoing
    )} on ${formatTeamName(
      teamKey
    )}.`
  );
}
    }
  );
}

  async function replacePlayerWithSub(
    subUid,
    button
  ) {
    const incident =
      selectedIncident();

    const targetPlayer =
      incident
        ? incidentTargetPlayer(
            incident
          )
        : null;

    const sub =
      getPlayer(
        subUid
      );

    if (
      !incident ||
      !targetPlayer ||
      !sub
    ) {
      context.showToast(
        "The target player or substitute could not be found."
      );

      return;
    }

    const teamKey =
      assignedTeamKey(
        targetPlayer.uid
      ) ||
      incident.teamKey;

    const team =
      getTeams()[
        teamKey
      ] ||
      [];

    if (
      !team.some(
        player =>
          player.uid ===
          targetPlayer.uid
      )
    ) {
      context.showToast(
        "The reported player is not currently on that team roster."
      );

      return;
    }

    if (
      !isReady(
        sub.uid
      )
    ) {
      context.showToast(
        "The selected substitute must be checked in and available."
      );

      return;
    }

    if (
      assignedTeamKey(
        sub.uid
      )
    ) {
      context.showToast(
        "The selected substitute is already assigned to a team."
      );

      return;
    }
const substituteIsTest =
  isTestPlayer(sub);

if (
  !substituteIsTest &&
  !hasValidDiscordUserId(
    sub
  )
) {
  context.showToast(
    `${playerDisplayName(sub)} is missing a Discord User ID.`
  );

  return;
}
    const confirmed =
      window.confirm(
        `Replace ${
          targetPlayer.displayName ||
          "reported player"
        } with ${
          sub.displayName ||
          "substitute"
        } on ${formatTeamName(
          teamKey
        )}?\n\n` +
        "This immediately changes the tournament roster and resolves the report case."
      );

    if (!confirmed) return;

    await buttonAction(
      button,
      "Replacing...",
      async () => {
        const timestamp =
          firebase.database
            .ServerValue
            .TIMESTAMP;

        const updatedTeam =
          team.map(player => {
            if (
              player.uid !==
              targetPlayer.uid
            ) {
              return publicPlayer(
                player
              );
            }

            return {
              ...publicPlayer(
                sub
              ),

              replacedPlayerUid:
                targetPlayer.uid,

              addedAsSubstitute:
                true,

              substitutedAt:
                timestamp
            };
          });

        const updates = {
          [`teams/${moduleState.tournamentId}/teams/${teamKey}`]:
            updatedTeam,

          [`teams/${moduleState.tournamentId}/updatedAt`]:
            timestamp,

          [`teams/${moduleState.tournamentId}/updatedBy`]:
            context.currentUser?.uid ||
            null,

          [`applications/${moduleState.tournamentId}/${sub.uid}/status`]:
            "accepted",

          [`applications/${moduleState.tournamentId}/${sub.uid}/addedAsSubstitute`]:
            true,

          [`applications/${moduleState.tournamentId}/${sub.uid}/substitutedInto`]:
            teamKey,

          [`applications/${moduleState.tournamentId}/${sub.uid}/substitutedAt`]:
            timestamp,

          [`applications/${moduleState.tournamentId}/${sub.uid}/updatedAt`]:
            timestamp,

          [`applications/${moduleState.tournamentId}/${targetPlayer.uid}/replacedBySubUid`]:
            sub.uid,

          [`applications/${moduleState.tournamentId}/${targetPlayer.uid}/replacedAt`]:
            timestamp,

          [`applications/${moduleState.tournamentId}/${targetPlayer.uid}/updatedAt`]:
            timestamp,

          [`checkIns/${moduleState.tournamentId}/${sub.uid}/uid`]:
            sub.uid,

          [`checkIns/${moduleState.tournamentId}/${sub.uid}/displayName`]:
            sub.displayName ||
            sub.rivalsIgn ||
            "Substitute",

          [`checkIns/${moduleState.tournamentId}/${sub.uid}/checkedIn`]:
            true,

          [`checkIns/${moduleState.tournamentId}/${sub.uid}/type`]:
            "main",

          [`checkIns/${moduleState.tournamentId}/${sub.uid}/teamKey`]:
            teamKey,

          [`checkIns/${moduleState.tournamentId}/${sub.uid}/replacedPlayerUid`]:
            targetPlayer.uid,

          [`checkIns/${moduleState.tournamentId}/${sub.uid}/updatedAt`]:
            timestamp,

          [`checkIns/${moduleState.tournamentId}/${targetPlayer.uid}/checkedIn`]:
            false,

          [`checkIns/${moduleState.tournamentId}/${targetPlayer.uid}/replacedBySubUid`]:
            sub.uid,

          [`checkIns/${moduleState.tournamentId}/${targetPlayer.uid}/updatedAt`]:
            timestamp,

          [`tournamentReports/${moduleState.tournamentId}/${incident.key}/admin/status`]:
            "resolved",

          [`tournamentReports/${moduleState.tournamentId}/${incident.key}/admin/replacementRequired`]:
            true,

          [`tournamentReports/${moduleState.tournamentId}/${incident.key}/admin/replacementSubUid`]:
            sub.uid,

          [`tournamentReports/${moduleState.tournamentId}/${incident.key}/admin/replacementSubName`]:
            sub.displayName ||
            sub.rivalsIgn ||
            "Substitute",

          [`tournamentReports/${moduleState.tournamentId}/${incident.key}/admin/replacedPlayerUid`]:
            targetPlayer.uid,

          [`tournamentReports/${moduleState.tournamentId}/${incident.key}/admin/replacedPlayerName`]:
            targetPlayer.displayName ||
            targetPlayer.rivalsIgn ||
            "Player",

          [`tournamentReports/${moduleState.tournamentId}/${incident.key}/admin/replacementTeamKey`]:
            teamKey,

          [`tournamentReports/${moduleState.tournamentId}/${incident.key}/admin/replacedAt`]:
            timestamp,

          [`tournamentReports/${moduleState.tournamentId}/${incident.key}/admin/resolvedAt`]:
            timestamp,

          [`tournamentReports/${moduleState.tournamentId}/${incident.key}/admin/updatedAt`]:
            timestamp,

          [`tournamentReports/${moduleState.tournamentId}/${incident.key}/admin/updatedBy`]:
            context.currentUser?.uid ||
            null
        };

        incident.reporters.forEach(
          reporter => {
            if (
              !reporter.reporterUid
            ) {
              return;
            }

            const notificationKey =
              context.database
                .ref(
                  `notifications/${reporter.reporterUid}`
                )
                .push()
                .key;

            updates[
              `notifications/${reporter.reporterUid}/${notificationKey}`
            ] = {
              title:
                "Tournament Report Resolved",

              message:
                `${
                  sub.displayName ||
                  "A substitute"
                } has been assigned to ${formatTeamName(
                  teamKey
                )}.`,

              type:
                "tournament_report_resolved",

              tournamentId:
                moduleState.tournamentId,

              incidentKey:
                incident.key,

              read:
                false,

              createdAt:
                timestamp
            };
          }
        );

        const subNotificationKey =
          context.database
            .ref(
              `notifications/${sub.uid}`
            )
            .push()
            .key;

        updates[
          `notifications/${sub.uid}/${subNotificationKey}`
        ] = {
          title:
            "You Have Been Subbed In",

          message:
            `You have been assigned to ${formatTeamName(
              teamKey
            )}. Open your dashboard and report to tournament staff.`,

          type:
            "substitution",

          tournamentId:
            moduleState.tournamentId,

          teamKey,

          read:
            false,

          createdAt:
            timestamp
        };

        await context.database
          .ref()
          .update(updates);
if (!isTestPlayer(sub)) {
  try {
    await queueDiscordSubstitutionJob(
      targetPlayer,
      sub,
      teamKey
    );

  } catch (error) {

    console.error(
      "Discord substitution failed:",
      error
    );

    context.showToast(
      "Roster updated, but Discord synchronization failed."
    );
  }
}
        context.showToast(
          `${
            sub.displayName ||
            "Substitute"
          } replaced ${
            targetPlayer.displayName ||
            "player"
          } on ${formatTeamName(
            teamKey
          )}.`
        );
      }
    );
  }

  async function buttonAction(
    button,
    loadingText,
    action
  ) {
    const originalHtml =
      button.innerHTML;

    button.disabled =
      true;

    button.innerHTML = `
      <i class="fa-solid fa-spinner fa-spin"></i>
      ${escapeHtml(
        loadingText
      )}
    `;

    try {
      await action();
    } catch (error) {
      console.error(
        "Reports module action failed:",
        error
      );

      const message =
        context.isPermissionDenied(
          error
        )
          ? "Firebase denied this Reports & Substitutions action."
          : error.message ||
            "The report action failed.";

      context.showToast(
        message
      );

      window.alert(
        `Reports & Substitutions Error\n\n${message}`
      );
    } finally {
      button.disabled =
        false;

      button.innerHTML =
        originalHtml;
    }
  }

  function normalizedIncidents() {
    return Object.entries(
      moduleState.reports
    )
      .map(
        ([
          key,
          rawIncident
        ]) =>
          normalizeIncident(
            key,
            rawIncident ||
            {}
          )
      )
      .filter(
        incident =>
          incident.reporterCount >
          0
      )
      .sort(
        (
          first,
          second
        ) => {
          const priorityDifference =
            priorityValue(
              second.priority
            ) -
            priorityValue(
              first.priority
            );

          if (
            priorityDifference !==
            0
          ) {
            return priorityDifference;
          }

          const activeDifference =
            Number(
              isActiveStatus(
                second.status
              )
            ) -
            Number(
              isActiveStatus(
                first.status
              )
            );

          if (
            activeDifference !==
            0
          ) {
            return activeDifference;
          }

          return (
            Number(
              second.updatedAt ||
              0
            ) -
            Number(
              first.updatedAt ||
              0
            )
          );
        }
      );
  }

  function normalizeIncident(
    key,
    rawIncident
  ) {
    const reporters =
      Object.entries(
        rawIncident.reporters ||
        {}
      )
        .map(
          ([
            uid,
            reporter
          ]) => ({
            ...(reporter || {}),

            reporterUid:
              reporter?.reporterUid ||
              uid
          })
        )
        .sort(
          (
            first,
            second
          ) =>
            Number(
              first.createdAt ||
              0
            ) -
            Number(
              second.createdAt ||
              0
            )
        );

    const firstReporter =
      reporters[0] ||
      {};

    const meta =
      rawIncident.meta ||
      {};

    const admin =
      rawIncident.admin ||
      {};

    const issueType =
      firstReporter.issueType ||
      meta.issueType ||
      "other";

    const targetUid =
      firstReporter.targetUid ||
      meta.targetUid ||
      "";

    const targetName =
      firstReporter.targetName ||
      meta.targetName ||
      "";

    const teamKey =
      firstReporter.teamKey ||
      meta.teamKey ||
      "no_team";

    const matchKey =
      firstReporter.matchKey ||
      meta.matchKey ||
      "general";

    const status =
      admin.status ||
      meta.status ||
      "open";

    const updatedAt =
      Math.max(
        Number(
          admin.updatedAt ||
          0
        ),

        Number(
          meta.updatedAt ||
          0
        ),

        ...reporters.map(
          reporter =>
            Number(
              reporter.updatedAt ||
              reporter.createdAt ||
              0
            )
        )
      );

    return {
      key,
      raw:
        rawIncident,
      meta,
      admin,
      reporters,

      reporterCount:
        reporters.length,

      issueType,
      targetUid,
      targetName,
      teamKey,
      matchKey,
      status,

      priority:
        admin.priority ||
        autoPriority(
          issueType,
          reporters.length
        ),

      updatedAt
    };
  }

  function filteredIncidents() {
    const query =
      clean(
        document.getElementById(
          "reportsSearchInput"
        )?.value
      ).toLowerCase();

    const statusFilter =
      document.getElementById(
        "reportsStatusFilter"
      )?.value ||
      "active";

    const issueFilter =
      document.getElementById(
        "reportsIssueFilter"
      )?.value ||
      "all";

    return normalizedIncidents()
      .filter(incident => {
        if (
          statusFilter ===
            "active" &&
          !isActiveStatus(
            incident.status
          )
        ) {
          return false;
        }

        if (
          statusFilter !==
            "active" &&
          statusFilter !==
            "all" &&
          incident.status !==
            statusFilter
        ) {
          return false;
        }

        if (
          issueFilter !==
            "all" &&
          incident.issueType !==
            issueFilter
        ) {
          return false;
        }

        if (!query) {
          return true;
        }

        const reporterText =
          incident.reporters
            .map(
              reporter =>
                [
                  reporter.reporterName,
                  reporter.details
                ]
                  .filter(Boolean)
                  .join(" ")
            )
            .join(" ");

        return [
          incident.targetName,
          incident.targetUid,
          incident.teamKey,
          incident.matchKey,
          ISSUE_LABELS[
            incident.issueType
          ],
          reporterText
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(query);
      });
  }

  function reconcileSelectedIncident() {
    const incidents =
      normalizedIncidents();

    if (
      moduleState
        .selectedIncidentKey &&
      incidents.some(
        incident =>
          incident.key ===
          moduleState.selectedIncidentKey
      )
    ) {
      return;
    }

    moduleState.selectedIncidentKey =
      incidents[0]?.key ||
      "";
  }

  function selectedIncident() {
    return (
      normalizedIncidents()
        .find(
          incident =>
            incident.key ===
            moduleState.selectedIncidentKey
        ) ||
      null
    );
  }

  function incidentTargetPlayer(
    incident
  ) {
    if (
      !incident?.targetUid
    ) {
      return null;
    }

    return (
      rosterPlayer(
        incident.targetUid
      ) ||
      getPlayer(
        incident.targetUid
      ) || {
        uid:
          incident.targetUid,

        displayName:
          incident.targetName ||
          "Reported Player"
      }
    );
  }

  function getTeams() {
    const normalized = {};

    Object.entries(
      moduleState.teamsRecord
        .teams ||
      {}
    ).forEach(
      ([
        teamKey,
        players
      ]) => {
        normalized[teamKey] =
          Array.isArray(players)
            ? players.filter(
                Boolean
              )
            : players &&
                typeof players ===
                  "object"
              ? Object.values(
                  players
                ).filter(Boolean)
              : [];
      }
    );

    return normalized;
  }
function getTeamLogo(
  teamKey
) {
  return safeImageUrl(
    moduleState
      .teamsRecord
      .teamLogos
      ?.[teamKey] ||
    moduleState
      .teamsRecord
      .logos
      ?.[teamKey]
  );
}
  function mainRoster() {
    return Object.values(
      getTeams()
    )
      .flat()
      .filter(Boolean);
  }

  function rosterPlayer(uid) {
    return (
      mainRoster()
        .find(
          player =>
            player.uid === uid
        ) ||
      null
    );
  }

  function getPlayer(uid) {
    return (
      moduleState.applications
        .find(
          player =>
            player.uid === uid
        ) ||
      null
    );
  }
const DISCORD_USER_ID_PATTERN =
  /^\d{17,20}$/;

function applicationByUid(uid) {
  return (
    moduleState.applications.find(
      player => player.uid === uid
    ) || null
  );
}

function profileByUid(uid) {
  return (
    moduleState.players?.[uid] ||
    null
  );
}

function getDiscordUserId(player) {
  const uid =
    player?.uid || "";

  const application =
    applicationByUid(uid);

  const profile =
    profileByUid(uid);

  const candidates = [
    player?.discordUserId,
    application?.discordUserId,
    profile?.discordUserId
  ];

  for (const candidate of candidates) {
    const value =
      String(candidate || "").trim();

    if (value) {
      return value;
    }
  }

  return "";
}

function getDiscordUsername(player) {
  const uid =
    player?.uid || "";

  const application =
    applicationByUid(uid);

  const profile =
    profileByUid(uid);

  return String(
    player?.discordUsername ||
    application?.discordUsername ||
    profile?.discordUsername ||
    ""
  ).trim();
}

function hasValidDiscordUserId(player) {
  return DISCORD_USER_ID_PATTERN.test(
    getDiscordUserId(player)
  );
}

function isTestPlayer(player) {
  return player?.testPlayer === true;
}

function discordReady(player) {
  return (
    isTestPlayer(player) ||
    hasValidDiscordUserId(player)
  );
}
  function eligibleSubs() {
    return moduleState
      .applications
      .filter(player => {
        const wantsSub =
          clean(
            player.wantsSub
          ).toLowerCase() ===
          "yes";

        const substituteFlag =
          player.substitute ===
          true;

        return (
          player.status ===
            "waitlist" &&
          (
            wantsSub ||
            substituteFlag
          )
        );
      });
  }

  function readySubs() {
    return eligibleSubs()
      .filter(
        player =>
          isReady(
            player.uid
          ) &&
          !assignedTeamKey(
            player.uid
          )
      );
  }

  function assignedTeamKey(uid) {
    for (
      const [
        teamKey,
        players
      ] of Object.entries(
        getTeams()
      )
    ) {
      if (
        players.some(
          player =>
            player.uid === uid
        )
      ) {
        return teamKey;
      }
    }

    return "";
  }

  function isCheckedIn(uid) {
    return (
      moduleState.checkIns[
        uid
      ]?.checkedIn ===
      true
    );
  }

  function isUnavailable(uid) {
    return (
      moduleState.availability[
        uid
      ]?.status ===
      "not_available"
    );
  }

  function isReady(uid) {
    return (
      isCheckedIn(uid) &&
      !isUnavailable(uid)
    );
  }

  function getReplacementScore(
    missingPlayer,
    sub
  ) {
    let score = 0;

    if (
      sub.mainRole ===
      missingPlayer.mainRole
    ) {
      score += 50;
    }

    if (
      sub.region ===
      missingPlayer.region
    ) {
      score += 15;
    }

    if (
      sub.platform ===
      missingPlayer.platform
    ) {
      score += 10;
    }

    const rankDifference =
      Math.abs(
        Number(
          RANK_VALUES[
            sub.peakRank
          ] ||
          0
        ) -
        Number(
          RANK_VALUES[
            missingPlayer
              .peakRank
          ] ||
          0
        )
      );

    score +=
      Math.max(
        0,
        25 -
        rankDifference *
          5
      );

    return Math.max(
      0,
      Math.min(
        100,
        score
      )
    );
  }

  function publicPlayer(player) {
    const record = {
  uid:
    player.uid || "",

  rgId:
    player.rgId || "",

  displayName:
    player.displayName || "",

  rivalsIgn:
    player.rivalsIgn || "",

  discordUsername:
    getDiscordUsername(player),

  /*
   * Keep Discord IDs as strings.
   */
  discordUserId:
    getDiscordUserId(player),

  discordMember:
    player.discordMember === true,

  profileImage:
    player.profileImage || "",

  peakRank:
    player.peakRank || "",

  mainRole:
    player.mainRole || "",

  region:
    player.region || "",

  platform:
    player.platform || "",

  testPlayer:
    player.testPlayer === true
};

    if (
      player.replacedPlayerUid
    ) {
      record.replacedPlayerUid =
        player.replacedPlayerUid;
    }

    if (
      player.addedAsSubstitute ===
      true
    ) {
      record.addedAsSubstitute =
        true;
    }

    if (
      player.substitutedAt
    ) {
      record.substitutedAt =
        player.substitutedAt;
    }

    return record;
  }

  function statusAction(
    status,
    label,
    icon,
    currentStatus
  ) {
    return `
      <button
        class="reports-status-action ${
          status ===
          currentStatus
            ? "active"
            : ""
        }"
        type="button"
        data-report-action="status"
        data-status="${escapeHtml(status)}"
        ${
          status ===
          currentStatus
            ? "disabled"
            : ""
        }
      >
        <i class="fa-solid ${escapeHtml(icon)}"></i>
        ${escapeHtml(label)}
      </button>
    `;
  }

  function autoPriority(
    issueType,
    reporterCount
  ) {
    if (
      reporterCount >=
        3 ||
      (
        [
          "throwing",
          "replacement"
        ].includes(
          issueType
        ) &&
        reporterCount >=
          2
      )
    ) {
      return "critical";
    }

    if (
      reporterCount >=
        2 ||
      [
        "throwing",
        "replacement",
        "afk",
        "disconnected",
        "opponent_missing"
      ].includes(
        issueType
      )
    ) {
      return "high";
    }

    return "normal";
  }

  function priorityValue(
    priority
  ) {
    return {
      normal:
        1,
      high:
        2,
      critical:
        3
    }[priority] ||
      0;
  }

  function priorityLabel(
    priority
  ) {
    return {
      normal:
        "Normal",
      high:
        "High Priority",
      critical:
        "Critical"
    }[priority] ||
      formatLabel(
        priority
      );
  }

  function isActiveStatus(
    status
  ) {
    return ![
      "resolved",
      "dismissed"
    ].includes(
      status
    );
  }

  function contextMetric(
    id,
    label,
    value
  ) {
    return `
      <div class="reports-context-metric">
        <span>
          ${escapeHtml(label)}
        </span>

        <strong id="${escapeHtml(id)}">
          ${escapeHtml(value)}
        </strong>
      </div>
    `;
  }

  function summaryMetric(
    id,
    label,
    value,
    icon
  ) {
    return `
      <article class="reports-summary-card">
        <span>
          <i class="fa-solid ${escapeHtml(icon)}"></i>
          ${escapeHtml(label)}
        </span>

        <strong id="${escapeHtml(id)}">
          ${escapeHtml(value)}
        </strong>
      </article>
    `;
  }

  function loadingState(
    message
  ) {
    return `
      <div class="reports-empty-state">
        <i class="fa-solid fa-spinner fa-spin"></i>

        <strong>
          ${escapeHtml(message)}
        </strong>
      </div>
    `;
  }

  function emptyState(
    title,
    message,
    icon
  ) {
    return `
      <div class="reports-empty-state">
        <i class="fa-solid ${escapeHtml(icon)}"></i>

        <strong>
          ${escapeHtml(title)}
        </strong>

        <span>
          ${escapeHtml(message)}
        </span>
      </div>
    `;
  }

  function avatar(
    player,
    className
  ) {
    const imageUrl =
      safeImageUrl(
        player?.profileImage
      );

    if (imageUrl) {
      return `
        <img
          class="${escapeHtml(className)}"
          src="${escapeHtml(imageUrl)}"
          alt="${escapeHtml(
            player?.displayName ||
            "Player"
          )}"
        >
      `;
    }

    return `
      <span
        class="${escapeHtml(className)} avatar-fallback"
      >
        ${escapeHtml(
          initials(
            player?.displayName ||
            player?.rivalsIgn ||
            "RG"
          )
        )}
      </span>
    `;
  }

  function showModuleError(
    message
  ) {
    setHtml(
      "reportsIncidentList",

      emptyState(
        "Report inbox unavailable",
        message,
        "fa-triangle-exclamation"
      )
    );

    setHtml(
      "reportsSubPool",

      emptyState(
        "Substitute panel unavailable",
        message,
        "fa-triangle-exclamation"
      )
    );
  }

  function setText(
    id,
    value
  ) {
    const element =
      document.getElementById(
        id
      );

    if (element) {
      element.textContent =
        String(
          value ??
          ""
        );
    }
  }

  function setHtml(
    id,
    html
  ) {
    const element =
      document.getElementById(
        id
      );

    if (element) {
      element.innerHTML =
        html;
    }
  }

  function clean(
    value,
    fallback = ""
  ) {
    const result =
      String(
        value ??
        ""
      ).trim();

    return result ||
      fallback;
  }

  function capitalize(
    value
  ) {
    const text =
      clean(value);

    return text
      ? text[0].toUpperCase() +
        text.slice(1)
      : "";
  }

  function formatLabel(
    value
  ) {
    return clean(
      value,
      "Unknown"
    )
      .replaceAll(
        "_",
        " "
      )
      .replace(
        /\b\w/g,
        letter =>
          letter.toUpperCase()
      );
  }

  function formatTeamName(
  teamKey
) {
  const publishedName =
    clean(
      moduleState
        .teamsRecord
        ?.teamNames
        ?.[teamKey] ||
      moduleState
        .teamsRecord
        ?.names
        ?.[teamKey]
    );

  if (publishedName) {
    return publishedName;
  }

  const text =
    clean(
      teamKey,
      "No Team"
    );

  const match =
    text.match(
      /team\s*(\d+)/i
    );

  return match
    ? `Team ${match[1]}`
    : formatLabel(text);
}

  function formatDateTime(
    timestamp
  ) {
    if (!timestamp) {
      return "Unknown time";
    }

    const date =
      new Date(
        Number(timestamp)
      );

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return "Unknown time";
    }

    return date.toLocaleString(
      undefined,
      {
        month:
          "short",
        day:
          "numeric",
        hour:
          "numeric",
        minute:
          "2-digit"
      }
    );
  }

  function initials(
    value
  ) {
    return clean(
      value,
      "RG"
    )
      .split(/\s+/)
      .filter(Boolean)
      .slice(
        0,
        2
      )
      .map(
        word =>
          word[0]
      )
      .join("")
      .toUpperCase();
  }

  function safeImageUrl(
    value
  ) {
    const url =
      clean(value);

    if (!url) {
      return "";
    }

    if (
      url.startsWith("/") ||
      url.startsWith("./") ||
      url.startsWith("../")
    ) {
      return url;
    }

    try {
      const parsed =
        new URL(
          url,
          window.location.origin
        );

      return (
        parsed.protocol ===
          "https:" ||
        parsed.protocol ===
          "http:"
      )
        ? parsed.href
        : "";
    } catch (error) {
      return "";
    }
  }

  function escapeHtml(
    value
  ) {
    if (
      context &&
      typeof context.escapeHtml ===
        "function"
    ) {
      return context.escapeHtml(
        value
      );
    }

    return String(
      value ??
      ""
    )
      .replaceAll(
        "&",
        "&amp;"
      )
      .replaceAll(
        "<",
        "&lt;"
      )
      .replaceAll(
        ">",
        "&gt;"
      )
      .replaceAll(
        '"',
        "&quot;"
      )
      .replaceAll(
        "'",
        "&#039;"
      );
  }

  window.NexusReports = {
    render,
    cleanup
  };
})();