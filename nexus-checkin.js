(() => {
  "use strict";

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

  const state = {
    activeTournamentId: "",
    tournamentId: "",
    tournaments: {},
    tournament: {},
    teamsRecord: {},
    checkIns: {},
    availability: {},
    applications: [],
    listeners: []
  };

  let context = null;
  let content = null;

  function render(nexusContext) {
    cleanup();

    context = nexusContext;
    content = context.content;

    resetState();

    content.innerHTML = `
      <section class="module-intro">
        <div>
          <h2>Check-In Desk</h2>

          <p>
            Track main-roster readiness, missing players and checked-in
            substitutes, then perform emergency roster replacements.
          </p>
        </div>

        <div class="module-actions">
          <button
            id="checkInRefreshButton"
            class="action-button"
            type="button"
          >
            <i class="fa-solid fa-rotate"></i>
            Refresh
          </button>
        </div>
      </section>

      <section class="checkin-layout">

        <article class="nexus-panel">
          <header class="panel-header">
            <h3>Tournament Context</h3>
            <span id="checkInActiveBadge">Loading</span>
          </header>

          <div class="checkin-panel-content">

            <div class="checkin-context-row">

              <div class="checkin-field">
                <label for="checkInTournamentSelect">
                  Tournament to Monitor
                </label>

                <select
                  id="checkInTournamentSelect"
                  class="checkin-select"
                >
                  <option value="">
                    Loading tournaments...
                  </option>
                </select>
              </div>

              <button
                id="checkInOpenTeamBuilderButton"
                class="action-button"
                type="button"
              >
                <i class="fa-solid fa-people-group"></i>
                Team Builder
              </button>

            </div>

            <div class="checkin-context-grid">

              ${contextMetric(
                "checkInTournamentName",
                "Tournament",
                "Loading..."
              )}

              ${contextMetric(
                "checkInPublishedState",
                "Team State",
                "—"
              )}

              ${contextMetric(
                "checkInRosterCount",
                "Main Roster",
                "0"
              )}

              ${contextMetric(
                "checkInWaitlistCount",
                "Sub Candidates",
                "0"
              )}

            </div>
          </div>
        </article>

        <section class="checkin-summary-grid">

          ${summaryMetric(
            "checkInMainReadyCount",
            "Main Ready",
            "0/0",
            "fa-user-check"
          )}

          ${summaryMetric(
            "checkInMissingCount",
            "Missing",
            "0",
            "fa-user-clock"
          )}

          ${summaryMetric(
            "checkInSubsReadyCount",
            "Subs Ready",
            "0",
            "fa-people-arrows"
          )}

          ${summaryMetric(
            "checkInReadyPercent",
            "Ready",
            "0%",
            "fa-gauge-high"
          )}

          ${summaryMetric(
            "checkInTeamsReadyCount",
            "Teams Ready",
            "0/0",
            "fa-shield-halved"
          )}

        </section>

        <article
          id="checkInOwnerTools"
          class="nexus-panel checkin-owner-panel"
          hidden
        >
          <header class="panel-header">
            <h3>Owner Test Tools</h3>
            <span>Development Only</span>
          </header>

          <div class="checkin-panel-content checkin-owner-content">

            <p>
              These actions are intended for generated tournament
              test data.
            </p>

            <div class="checkin-action-row">

              <button
                class="action-button"
                type="button"
                data-checkin-action="check-test-subs"
              >
                <i class="fa-solid fa-user-plus"></i>
                Check In Test Subs
              </button>

              <button
                class="action-button checkin-danger-button"
                type="button"
                data-checkin-action="clear-all"
              >
                <i class="fa-solid fa-trash"></i>
                Clear All Check-Ins
              </button>

            </div>
          </div>
        </article>

        <article
          id="checkInAlertsPanel"
          class="nexus-panel checkin-alerts-panel"
          hidden
        >
          <header class="panel-header">
            <h3>
              <i class="fa-solid fa-triangle-exclamation"></i>
              Immediate Attention Required
            </h3>

            <span id="checkInAlertCount">
              0 Alerts
            </span>
          </header>

          <div
            id="checkInPriorityAlerts"
            class="checkin-priority-alerts"
          ></div>
        </article>

        <article class="nexus-panel">
          <header class="panel-header">
            <h3>Team Check-In</h3>

            <span id="checkInTeamStatusLabel">
              Loading teams...
            </span>
          </header>

          <div
            id="checkInTeamGrid"
            class="checkin-team-grid"
          >
            ${loadingState(
              "Loading team readiness..."
            )}
          </div>
        </article>

        <article class="nexus-panel">
          <header class="panel-header">
            <h3>Substitute Pool</h3>

            <span id="checkInSubPoolCount">
              0 Ready
            </span>
          </header>

          <div class="checkin-panel-content">

            <div class="checkin-sub-toolbar">

              <div class="checkin-search">
                <i class="fa-solid fa-magnifying-glass"></i>

                <input
                  id="checkInSubSearch"
                  type="search"
                  placeholder="Search substitute candidates..."
                  autocomplete="off"
                >
              </div>

              <select
                id="checkInSubFilter"
                class="checkin-select"
              >
                <option value="ready">
                  Checked In
                </option>

                <option value="all">
                  All Candidates
                </option>

                <option value="notReady">
                  Not Checked In
                </option>
              </select>

            </div>

            <div
              id="checkInSubPool"
              class="checkin-sub-pool"
            >
              ${loadingState(
                "Loading substitutes..."
              )}
            </div>

          </div>
        </article>

      </section>
    `;

    bindEvents();

    const ownerTools =
      document.getElementById(
        "checkInOwnerTools"
      );

    if (ownerTools) {
      ownerTools.hidden =
        context.roleId !== "owner";
    }

    void initialize();
  }

  function cleanup() {
    detachListeners();

    if (content) {
      content.removeEventListener(
        "click",
        handleClick
      );

      content.removeEventListener(
        "change",
        handleChange
      );

      content.removeEventListener(
        "input",
        handleInput
      );
    }

    context = null;
    content = null;
  }

  function resetState() {
    state.activeTournamentId = "";
    state.tournamentId = "";
    state.tournaments = {};
    state.tournament = {};
    state.teamsRecord = {};
    state.checkIns = {};
    state.availability = {};
    state.applications = [];
    state.listeners = [];
  }

  function bindEvents() {
    content.addEventListener(
      "click",
      handleClick
    );

    content.addEventListener(
      "change",
      handleChange
    );

    content.addEventListener(
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

      state.activeTournamentId =
        activeTournamentId || "open1";

      state.tournaments =
        tournamentsSnapshot.val() || {};

      const requested =
        sessionStorage.getItem(
          "nexusCheckInTournament"
        );

      sessionStorage.removeItem(
        "nexusCheckInTournament"
      );

      const initialId =
        requested &&
        state.tournaments[requested]
          ? requested
          : state.activeTournamentId;

      renderTournamentOptions();
      switchTournament(initialId);
    } catch (error) {
      console.error(
        "Check-In initialization failed:",
        error
      );

      showModuleError(
        context.isPermissionDenied(error)
          ? "Firebase denied access to Check-In data."
          : error.message ||
            "Check-In Desk could not be loaded."
      );
    }
  }

  function handleClick(event) {
    const button =
      event.target.closest("button");

    if (
      !button ||
      !content.contains(button)
    ) {
      return;
    }

    if (
      button.id ===
      "checkInRefreshButton"
    ) {
      void refreshModule(button);
      return;
    }

    if (
      button.id ===
      "checkInOpenTeamBuilderButton"
    ) {
      sessionStorage.setItem(
        "nexusTeamBuilderTournament",
        state.tournamentId
      );

      context.openModule("teams");
      return;
    }

    const action =
      button.dataset.checkinAction;

    if (action === "replace") {
      void replacePlayer(
        button.dataset.missingUid,
        button.dataset.subUid,
        button.dataset.teamKey,
        button
      );

      return;
    }

    if (
      action ===
      "check-test-subs"
    ) {
      void checkInAllTestSubs(button);
      return;
    }

    if (action === "clear-all") {
      void clearAllCheckIns(button);
    }
  }

  function handleChange(event) {
    if (
      event.target.id ===
      "checkInTournamentSelect"
    ) {
      switchTournament(
        event.target.value
      );

      return;
    }

    if (
      event.target.id ===
      "checkInSubFilter"
    ) {
      renderSubs();
    }
  }

  function handleInput(event) {
    if (
      event.target.id ===
      "checkInSubSearch"
    ) {
      renderSubs();
    }
  }

  async function refreshModule(button) {
    await buttonAction(
      button,
      "Refreshing...",
      async () => {
        const snapshot =
          await context.database
            .ref("tournaments")
            .once("value");

        state.tournaments =
          snapshot.val() || {};

        renderTournamentOptions();

        switchTournament(
          state.tournamentId ||
          state.activeTournamentId
        );

        context.showToast(
          "Check-In Desk refreshed."
        );
      }
    );
  }

  function switchTournament(
    tournamentId
  ) {
    if (!tournamentId) return;

    detachListeners();

    state.tournamentId =
      tournamentId;

    state.tournament = {};
    state.teamsRecord = {};
    state.checkIns = {};
    state.availability = {};
    state.applications = [];

    const select =
      document.getElementById(
        "checkInTournamentSelect"
      );

    if (select) {
      select.value = tournamentId;
    }

    setHtml(
      "checkInTeamGrid",
      loadingState(
        "Loading team readiness..."
      )
    );

    setHtml(
      "checkInSubPool",
      loadingState(
        "Loading substitutes..."
      )
    );

    listen(
      context.database.ref(
        `tournaments/${tournamentId}`
      ),

      snapshot => {
        state.tournament =
          snapshot.val() || {};

        renderAll();
      },

      "Tournament data"
    );

    listen(
      context.database.ref(
        `teams/${tournamentId}`
      ),

      snapshot => {
        state.teamsRecord =
          snapshot.val() || {};

        renderAll();
      },

      "Team data"
    );

    listen(
      context.database.ref(
        `checkIns/${tournamentId}`
      ),

      snapshot => {
        state.checkIns =
          snapshot.val() || {};

        renderAll();
      },

      "Check-in data"
    );

    listen(
      context.database.ref(
        `availability/${tournamentId}`
      ),

      snapshot => {
        state.availability =
          snapshot.val() || {};

        renderAll();
      },

      "Availability data"
    );

    listen(
      context.database.ref(
        `applications/${tournamentId}`
      ),

      snapshot => {
        const data =
          snapshot.val() || {};

        state.applications =
          Object.entries(data)
            .map(
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

      "Application data"
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
          context.isPermissionDenied(error)
            ? `Firebase denied access to ${label}.`
            : `${label} could not be loaded.`
        );
      }
    );

    state.listeners.push({
      reference,
      handler
    });
  }

  function detachListeners() {
    state.listeners.forEach(
      listener => {
        listener.reference.off(
          "value",
          listener.handler
        );
      }
    );

    state.listeners = [];
  }

  function renderTournamentOptions() {
    const select =
      document.getElementById(
        "checkInTournamentSelect"
      );

    if (!select) return;

    const entries =
      Object.entries(
        state.tournaments
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
          ) => {
            return (
              Number(
                second.createdAt || 0
              ) -
              Number(
                first.createdAt || 0
              )
            );
          }
        )
        .map(
          ([id, tournament]) => `
            <option value="${escapeHtml(id)}">
              ${escapeHtml(
                tournament.name ||
                id
              )}
              (${escapeHtml(id)})
              ${
                id ===
                state.activeTournamentId
                  ? "— ACTIVE"
                  : ""
              }
            </option>
          `
        )
        .join("");

    select.value =
      state.tournamentId ||
      state.activeTournamentId;
  }

  function renderAll() {
    renderContext();
    renderOverview();
    renderAlerts();
    renderTeams();
    renderSubs();
  }

  function renderContext() {
    const teams =
      getTeams();

    setText(
      "checkInTournamentName",

      state.tournament.name ||
      state.tournamentId ||
      "Tournament"
    );

    setText(
      "checkInPublishedState",

      state.teamsRecord.published ===
        true ||
      state.tournament.teamsPublished ===
        true
        ? "Published"
        : Object.keys(teams).length
          ? "Draft"
          : "No Teams"
    );

    setText(
      "checkInRosterCount",
      mainRoster().length
    );

    setText(
      "checkInWaitlistCount",
      subCandidates().length
    );

    setText(
      "checkInActiveBadge",

      state.tournamentId ===
      state.activeTournamentId
        ? "Active Tournament"
        : "Inactive Tournament"
    );
  }

  function renderOverview() {
    const teams =
      sortedTeams();

    const roster =
      mainRoster();

    const ready =
      roster.filter(
        player =>
          isReady(player.uid)
      );

    const missing =
      roster.filter(
        player =>
          !isReady(player.uid)
      );

    const readyTeams =
      teams.filter(
        ([, players]) => {
          return (
            players.length > 0 &&
            players.every(
              player =>
                isReady(player.uid)
            )
          );
        }
      ).length;

    setText(
      "checkInMainReadyCount",
      `${ready.length}/${roster.length}`
    );

    setText(
      "checkInMissingCount",
      missing.length
    );

    setText(
      "checkInSubsReadyCount",
      readySubs().length
    );

    setText(
      "checkInReadyPercent",

      `${
        roster.length
          ? Math.round(
              (
                ready.length /
                roster.length
              ) * 100
            )
          : 0
      }%`
    );

    setText(
      "checkInTeamsReadyCount",
      `${readyTeams}/${teams.length}`
    );
  }

  function renderAlerts() {
    const panel =
      document.getElementById(
        "checkInAlertsPanel"
      );

    const container =
      document.getElementById(
        "checkInPriorityAlerts"
      );

    if (
      !panel ||
      !container
    ) {
      return;
    }

    const alerts = [];

    sortedTeams().forEach(
      ([teamKey, players]) => {
        players.forEach(player => {
          if (
            !isUnavailable(
              player.uid
            )
          ) {
            return;
          }

          alerts.push({
            player,
            teamKey,

            recommendations:
              recommendedSubs(player)
          });
        });
      }
    );

    panel.hidden =
      alerts.length === 0;

    setText(
      "checkInAlertCount",

      `${alerts.length} ${
        alerts.length === 1
          ? "Alert"
          : "Alerts"
      }`
    );

    container.innerHTML =
      alerts
        .map(priorityAlert)
        .join("");
  }

  function renderTeams() {
    const grid =
      document.getElementById(
        "checkInTeamGrid"
      );

    if (!grid) return;

    const teams =
      sortedTeams();

    if (!teams.length) {
      grid.innerHTML =
        emptyState(
          "No teams available",

          "Save or publish teams before using the Check-In Desk.",

          "fa-people-group"
        );

      setText(
        "checkInTeamStatusLabel",
        "No teams found"
      );

      return;
    }

    const readyTeamCount =
      teams.filter(
        ([, players]) => {
          return (
            players.length > 0 &&
            players.every(
              player =>
                isReady(player.uid)
            )
          );
        }
      ).length;

    setText(
      "checkInTeamStatusLabel",
      `${readyTeamCount}/${teams.length} Teams Ready`
    );

    grid.innerHTML =
      teams
        .map(
          ([teamKey, players]) =>
            teamCard(
              teamKey,
              players
            )
        )
        .join("");
  }

  function renderSubs() {
    const pool =
      document.getElementById(
        "checkInSubPool"
      );

    if (!pool) return;

    const query =
      clean(
        document.getElementById(
          "checkInSubSearch"
        )?.value
      ).toLowerCase();

    const filter =
      document.getElementById(
        "checkInSubFilter"
      )?.value || "ready";

    const all =
      subCandidates();

    const filtered =
      all
        .filter(player => {
          const ready =
            isReady(player.uid);

          if (
            filter === "ready" &&
            !ready
          ) {
            return false;
          }

          if (
            filter === "notReady" &&
            ready
          ) {
            return false;
          }

          if (!query) return true;

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
            .includes(query);
        })
        .sort(
          (first, second) => {
            const readyDifference =
              Number(
                isReady(second.uid)
              ) -
              Number(
                isReady(first.uid)
              );

            return (
              readyDifference ||
              String(
                first.displayName ||
                ""
              ).localeCompare(
                String(
                  second.displayName ||
                  ""
                )
              )
            );
          }
        );

    setText(
      "checkInSubPoolCount",
      `${readySubs().length} Ready`
    );

    if (!all.length) {
      pool.innerHTML =
        emptyState(
          "No substitute candidates",

          "Waitlisted players who selected substitute availability will appear here.",

          "fa-people-arrows"
        );

      return;
    }

    if (!filtered.length) {
      pool.innerHTML =
        emptyState(
          "No matching substitutes",

          "Adjust the search or readiness filter.",

          "fa-magnifying-glass"
        );

      return;
    }

    pool.innerHTML =
      filtered
        .map(subCard)
        .join("");
  }

  function teamCard(
    teamKey,
    players
  ) {
    const readyCount =
      players.filter(
        player =>
          isReady(player.uid)
      ).length;

    const missing =
      players.filter(
        player =>
          !isReady(player.uid)
      );

    const teamReady =
      players.length > 0 &&
      missing.length === 0;

    const number =
      teamNumber(teamKey);

    return `
      <article
        class="checkin-team-card ${
          teamReady
            ? "is-ready"
            : "has-missing"
        }"
      >
        <header class="checkin-team-header">

          <div>
            <span>
              TEAM ${number}
            </span>

            <h3>
              Team ${number}
            </h3>
          </div>

          <div class="checkin-team-readiness">
            <span>Ready</span>

            <strong>
              ${readyCount}/${players.length}
            </strong>
          </div>

        </header>

        <div
          class="checkin-team-state ${
            teamReady
              ? "ready"
              : "warning"
          }"
        >
          <i class="fa-solid ${
            teamReady
              ? "fa-circle-check"
              : "fa-triangle-exclamation"
          }"></i>

          ${
            teamReady
              ? "TEAM READY"
              : `${missing.length} PLAYER${
                  missing.length === 1
                    ? ""
                    : "S"
                } NEED ATTENTION`
          }
        </div>

        <div class="checkin-roster-list">
          ${players
            .map(playerRow)
            .join("")}
        </div>

        ${
          missing.length
            ? `
              <div class="checkin-missing-section">
                <h4>
                  Missing Players & Replacements
                </h4>

                ${missing
                  .map(
                    player =>
                      missingBlock(
                        player,
                        teamKey
                      )
                  )
                  .join("")}
              </div>
            `
            : ""
        }
      </article>
    `;
  }

  function playerRow(player) {
    const unavailable =
      isUnavailable(player.uid);

    const checked =
      isCheckedIn(player.uid);

    const ready =
      checked &&
      !unavailable;

    const statusClass =
      unavailable
        ? "unavailable"
        : ready
          ? "ready"
          : "pending";

    const statusText =
      unavailable
        ? "Not Available"
        : ready
          ? "Checked In"
          : "Not Checked In";

    const statusIcon =
      unavailable
        ? "fa-circle-xmark"
        : ready
          ? "fa-circle-check"
          : "fa-clock";

    return `
      <div
        class="checkin-player-row ${statusClass}"
      >
        ${avatar(
          player,
          "checkin-player-avatar"
        )}

        <div class="checkin-player-copy">
          <strong>
            ${escapeHtml(
              player.displayName ||
              player.rivalsIgn ||
              "Player"
            )}
          </strong>

          <span>
            ${escapeHtml(
              player.peakRank ||
              "No Rank"
            )}

            ·

            ${escapeHtml(
              player.mainRole ||
              "No Role"
            )}

            ·

            ${escapeHtml(
              player.region ||
              "No Region"
            )}
          </span>
        </div>

        <span
          class="checkin-state-badge ${statusClass}"
        >
          <i class="fa-solid ${statusIcon}"></i>
          ${statusText}
        </span>
      </div>
    `;
  }

  function missingBlock(
    player,
    teamKey
  ) {
    const unavailable =
      isUnavailable(player.uid);

    const reason =
      state.availability[
        player.uid
      ]?.reason || "";

    const recommendations =
      recommendedSubs(player);

    return `
      <div class="checkin-missing-player">

        <div class="checkin-missing-copy">
          <strong>
            ${escapeHtml(
              player.displayName ||
              "Player"
            )}
          </strong>

          <span
            class="${
              unavailable
                ? "unavailable"
                : "pending"
            }"
          >
            ${
              unavailable
                ? "NOT AVAILABLE"
                : "NOT CHECKED IN"
            }
          </span>

          <small>
            ${escapeHtml(
              player.peakRank ||
              "No Rank"
            )}

            ·

            ${escapeHtml(
              player.mainRole ||
              "No Role"
            )}

            ${
              reason
                ? ` · ${escapeHtml(reason)}`
                : ""
            }
          </small>
        </div>

        <div class="checkin-recommendation-list">

          ${
            recommendations.length
              ? recommendations
                  .map(
                    sub =>
                      recommendation(
                        player,
                        sub,
                        teamKey
                      )
                  )
                  .join("")
              : `
                <div class="checkin-no-replacement">
                  No checked-in substitutes are
                  currently available.
                </div>
              `
          }

        </div>
      </div>
    `;
  }

  function recommendation(
    missingPlayer,
    sub,
    teamKey
  ) {
    return `
      <div class="checkin-recommendation">

        <div>
          <strong>
            ${escapeHtml(
              sub.displayName ||
              sub.rivalsIgn ||
              "Substitute"
            )}
          </strong>

          <span>
            ${escapeHtml(
              sub.peakRank ||
              "No Rank"
            )}

            ·

            ${escapeHtml(
              sub.mainRole ||
              "No Role"
            )}
          </span>
        </div>

        <div class="checkin-match-score">
          <strong>
            ${sub.replacementScore}%
          </strong>

          <span>Match</span>
        </div>

        <button
          type="button"
          data-checkin-action="replace"
          data-missing-uid="${escapeHtml(
            missingPlayer.uid
          )}"
          data-sub-uid="${escapeHtml(
            sub.uid
          )}"
          data-team-key="${escapeHtml(
            teamKey
          )}"
        >
          Replace
        </button>

      </div>
    `;
  }

  function priorityAlert(alert) {
    const best =
      alert.recommendations[0];

    const reason =
      state.availability[
        alert.player.uid
      ]?.reason ||
      "No reason provided";

    return `
      <article class="checkin-priority-card">

        <div class="checkin-priority-icon">
          <i class="fa-solid fa-user-xmark"></i>
        </div>

        <div class="checkin-priority-copy">
          <span>
            Team ${teamNumber(
              alert.teamKey
            )}
          </span>

          <h4>
            ${escapeHtml(
              alert.player.displayName ||
              "Player"
            )}
          </h4>

          <p>
            ${escapeHtml(reason)}
          </p>
        </div>

        <div class="checkin-priority-replacement">

          ${
            best
              ? `
                <span>
                  Best Replacement
                </span>

                <strong>
                  ${escapeHtml(
                    best.displayName ||
                    best.rivalsIgn ||
                    "Substitute"
                  )}
                </strong>

                <small>
                  ${best.replacementScore}%
                  roster match
                </small>

                <button
                  type="button"
                  data-checkin-action="replace"
                  data-missing-uid="${escapeHtml(
                    alert.player.uid
                  )}"
                  data-sub-uid="${escapeHtml(
                    best.uid
                  )}"
                  data-team-key="${escapeHtml(
                    alert.teamKey
                  )}"
                >
                  Replace Now
                </button>
              `
              : `
                <span>
                  No ready substitute
                </span>

                <small>
                  A waitlisted substitute
                  must check in first.
                </small>
              `
          }

        </div>
      </article>
    `;
  }

  function subCard(player) {
    const unavailable =
      isUnavailable(player.uid);

    const ready =
      isReady(player.uid);

    const statusClass =
      unavailable
        ? "unavailable"
        : ready
          ? "ready"
          : "pending";

    const statusText =
      unavailable
        ? "Unavailable"
        : ready
          ? "Ready"
          : "Not Checked In";

    return `
      <article
        class="checkin-sub-card ${statusClass}"
      >
        <div class="checkin-sub-identity">

          ${avatar(
            player,
            "checkin-sub-avatar"
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
            class="checkin-state-badge ${statusClass}"
          >
            ${statusText}
          </span>

        </div>

        <div class="checkin-sub-tags">
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
      </article>
    `;
  }

  async function replacePlayer(
    missingUid,
    subUid,
    teamKey,
    button
  ) {
    const teams =
      getTeams();

    const team =
      teams[teamKey] || [];

    const missingPlayer =
      team.find(
        player =>
          player.uid === missingUid
      );

    const sub =
      state.applications.find(
        player =>
          player.uid === subUid
      );

    if (
      !missingPlayer ||
      !sub
    ) {
      context.showToast(
        "Replacement records could not be found."
      );

      return;
    }

    if (!isReady(subUid)) {
      context.showToast(
        "The selected substitute must be checked in first."
      );

      return;
    }

    const confirmed =
      window.confirm(
        `Replace ${
          missingPlayer.displayName ||
          "missing player"
        } with ${
          sub.displayName ||
          "substitute"
        }?\n\n` +
        "This immediately updates the tournament team roster."
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
              missingUid
            ) {
              return publicPlayer(player);
            }

            return {
              ...publicPlayer(sub),

              replacedPlayerUid:
                missingUid,

              addedAsSubstitute:
                true,

              substitutedAt:
                timestamp
            };
          });

        await context.database
          .ref()
          .update({
            [`teams/${state.tournamentId}/teams/${teamKey}`]:
              updatedTeam,

            [`teams/${state.tournamentId}/updatedAt`]:
              timestamp,

            [`teams/${state.tournamentId}/updatedBy`]:
              context.currentUser?.uid ||
              null,

            [`applications/${state.tournamentId}/${subUid}/status`]:
              "accepted",

            [`applications/${state.tournamentId}/${subUid}/addedAsSubstitute`]:
              true,

            [`applications/${state.tournamentId}/${subUid}/substitutedInto`]:
              teamKey,

            [`applications/${state.tournamentId}/${subUid}/substitutedAt`]:
              timestamp,

            [`applications/${state.tournamentId}/${subUid}/updatedAt`]:
              timestamp,

            [`applications/${state.tournamentId}/${missingUid}/replacedBySubUid`]:
              subUid,

            [`applications/${state.tournamentId}/${missingUid}/replacedAt`]:
              timestamp,

            [`applications/${state.tournamentId}/${missingUid}/updatedAt`]:
              timestamp,

            [`checkIns/${state.tournamentId}/${subUid}/type`]:
              "main",

            [`checkIns/${state.tournamentId}/${subUid}/teamKey`]:
              teamKey,

            [`checkIns/${state.tournamentId}/${subUid}/replacedPlayerUid`]:
              missingUid,

            [`checkIns/${state.tournamentId}/${subUid}/updatedAt`]:
              timestamp,

            [`checkIns/${state.tournamentId}/${missingUid}/checkedIn`]:
              false,

            [`checkIns/${state.tournamentId}/${missingUid}/replacedBySubUid`]:
              subUid,

            [`checkIns/${state.tournamentId}/${missingUid}/updatedAt`]:
              timestamp
          });

        context.showToast(
          `${
            sub.displayName ||
            "Substitute"
          } replaced ${
            missingPlayer.displayName ||
            "player"
          }.`
        );
      }
    );
  }

  async function checkInAllTestSubs(
    button
  ) {
    if (
      context.roleId !== "owner"
    ) {
      return;
    }

    const testSubs =
      subCandidates().filter(
        player =>
          player.testPlayer
      );

    if (!testSubs.length) {
      context.showToast(
        "No test substitutes were found."
      );

      return;
    }

    await buttonAction(
      button,
      "Checking In...",
      async () => {
        const updates = {};

        testSubs.forEach(player => {
          updates[
            `checkIns/${state.tournamentId}/${player.uid}`
          ] = {
            ...checkInRecord(player),

            checkedIn: true,

            type:
              "substitute",

            checkedInAt:
              firebase.database
                .ServerValue
                .TIMESTAMP,

            updatedAt:
              firebase.database
                .ServerValue
                .TIMESTAMP,

            updatedBy:
              context.currentUser?.uid ||
              null
          };
        });

        await context.database
          .ref()
          .update(updates);

        context.showToast(
          `${testSubs.length} test substitutes checked in.`
        );
      }
    );
  }

  async function clearAllCheckIns(
    button
  ) {
    if (
      context.roleId !== "owner"
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        `Clear every check-in for ${
          state.tournamentId
        }?\n\n` +
        "Teams and applications will remain unchanged."
      );

    if (!confirmed) return;

    await buttonAction(
      button,
      "Clearing...",
      async () => {
        await context.database
          .ref(
            `checkIns/${state.tournamentId}`
          )
          .remove();

        context.showToast(
          "All tournament check-ins cleared."
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

    button.disabled = true;

    button.innerHTML = `
      <i class="fa-solid fa-spinner fa-spin"></i>
      ${escapeHtml(loadingText)}
    `;

    try {
      await action();
    } catch (error) {
      console.error(
        "Check-In action failed:",
        error
      );

      const message =
        context.isPermissionDenied(error)
          ? "Firebase denied this Check-In action."
          : error.message ||
            "The Check-In action failed.";

      context.showToast(message);

      window.alert(
        `Check-In Desk Error\n\n${message}`
      );
    } finally {
      button.disabled = false;
      button.innerHTML = originalHtml;
    }
  }

  function getTeams() {
    const normalized = {};

    Object.entries(
      state.teamsRecord.teams || {}
    ).forEach(
      ([teamKey, players]) => {
        normalized[teamKey] =
          Array.isArray(players)
            ? players.filter(Boolean)
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

  function sortedTeams() {
    return Object.entries(
      getTeams()
    ).sort(
      ([first], [second]) =>
        teamNumber(first) -
        teamNumber(second)
    );
  }

  function mainRoster() {
    return sortedTeams()
      .flatMap(
        ([, players]) =>
          players
      )
      .filter(Boolean);
  }

  function subCandidates() {
    return state.applications
      .filter(player => {
        return (
          player.status ===
            "waitlist" &&
          player.wantsSub ===
            "Yes"
        );
      });
  }

  function readySubs() {
    return subCandidates()
      .filter(
        player =>
          isReady(player.uid)
      );
  }

  function isCheckedIn(uid) {
    return (
      state.checkIns[uid]
        ?.checkedIn === true
    );
  }

  function isUnavailable(uid) {
    return (
      state.availability[uid]
        ?.status ===
      "not_available"
    );
  }

  function isReady(uid) {
    return (
      isCheckedIn(uid) &&
      !isUnavailable(uid)
    );
  }

  function recommendedSubs(
    missingPlayer
  ) {
    return readySubs()
      .filter(
        sub =>
          sub.uid !==
          missingPlayer.uid
      )
      .map(sub => ({
        ...sub,

        replacementScore:
          replacementScore(
            missingPlayer,
            sub
          )
      }))
      .sort(
        (first, second) =>
          second.replacementScore -
          first.replacementScore
      )
      .slice(0, 3);
  }

  function replacementScore(
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
        (
          RANK_VALUES[
            sub.peakRank
          ] || 0
        ) -
        (
          RANK_VALUES[
            missingPlayer
              .peakRank
          ] || 0
        )
      );

    return Math.max(
      0,
      Math.min(
        100,

        score +
        Math.max(
          0,
          25 -
          rankDifference * 5
        )
      )
    );
  }

  function publicPlayer(player) {
    const result = {
      uid:
        player.uid || "",

      rgId:
        player.rgId || "",

      displayName:
        player.displayName || "",

      rivalsIgn:
        player.rivalsIgn || "",

      profileImage:
        player.profileImage || "",

      peakRank:
        player.peakRank || "",

      mainRole:
        player.mainRole || "",

      region:
        player.region || "",

      platform:
        player.platform || ""
    };

    if (
      player.replacedPlayerUid
    ) {
      result.replacedPlayerUid =
        player.replacedPlayerUid;
    }

    if (
      player.addedAsSubstitute ===
      true
    ) {
      result.addedAsSubstitute =
        true;
    }

    if (player.substitutedAt) {
      result.substitutedAt =
        player.substitutedAt;
    }

    return result;
  }

  function checkInRecord(player) {
    return {
      uid:
        player.uid,

      displayName:
        player.displayName || "",

      rivalsIgn:
        player.rivalsIgn || "",

      rgId:
        player.rgId || "",

      profileImage:
        player.profileImage || "",

      peakRank:
        player.peakRank || "",

      mainRole:
        player.mainRole || "",

      region:
        player.region || "",

      platform:
        player.platform || ""
    };
  }

  function contextMetric(
    id,
    label,
    value
  ) {
    return `
      <div class="checkin-context-metric">
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
      <article class="checkin-summary-card">
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

  function loadingState(message) {
    return `
      <div class="checkin-empty-state">
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
      <div class="checkin-empty-state">
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
        player.profileImage
      );

    if (imageUrl) {
      return `
        <img
          class="${className}"
          src="${escapeHtml(imageUrl)}"
          alt="${escapeHtml(
            player.displayName ||
            "Player"
          )}"
        >
      `;
    }

    return `
      <span
        class="${className} avatar-fallback"
      >
        ${escapeHtml(
          initials(
            player.displayName ||
            player.rivalsIgn ||
            "RG"
          )
        )}
      </span>
    `;
  }

  function showModuleError(message) {
    setHtml(
      "checkInTeamGrid",

      emptyState(
        "Check-In Desk unavailable",
        message,
        "fa-triangle-exclamation"
      )
    );

    setHtml(
      "checkInSubPool",

      emptyState(
        "Substitute pool unavailable",
        message,
        "fa-triangle-exclamation"
      )
    );
  }

  function teamNumber(teamKey) {
    return (
      Number(
        String(teamKey)
          .replace(/\D/g, "")
      ) || 0
    );
  }

  function setText(id, value) {
    const element =
      document.getElementById(id);

    if (element) {
      element.textContent =
        String(value ?? "");
    }
  }

  function setHtml(id, html) {
    const element =
      document.getElementById(id);

    if (element) {
      element.innerHTML = html;
    }
  }

  function clean(
    value,
    fallback = ""
  ) {
    return String(
      value || fallback
    ).trim();
  }

  function initials(value) {
    return String(value || "RG")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(word => word[0])
      .join("")
      .toUpperCase();
  }

  function safeImageUrl(value) {
    const url =
      String(
        value || ""
      ).trim();

    if (!url) return "";

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

  function escapeHtml(value) {
    if (
      context &&
      typeof context.escapeHtml ===
        "function"
    ) {
      return context.escapeHtml(
        value
      );
    }

    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  window.NexusCheckIn = {
    render,
    cleanup
  };
})();