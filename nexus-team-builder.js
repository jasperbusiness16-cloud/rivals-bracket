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

  const moduleState = {
    activeTournamentId: "",
    tournamentId: "",
    tournaments: {},
    tournament: {},
    acceptedPlayers: [],
    teams: {},
    teamNames: {},
    teamRecord: {},
    selectedPlayerUid: null,
    dirty: false,
    teamsLoaded: false,
    applicationsLoaded: false,
    listeners: []
  };

  let context = null;
  let boundContent = null;

  function render(nexusContext) {
    cleanup();

    context = nexusContext;
    boundContent = context.content;

    resetModuleState();

    boundContent.innerHTML = `
      <section class="module-intro">
        <div>
          <h2>Team Builder</h2>

          <p>
            Build tournament rosters from accepted applicants,
            balance teams, save drafts and publish finalized lineups.
          </p>
        </div>

        <div class="module-actions">
          <button
            id="teamBuilderRefreshButton"
            class="action-button"
            type="button"
          >
            <i class="fa-solid fa-rotate"></i>
            Refresh
          </button>
        </div>
      </section>

      <section class="team-builder-layout">

        <article class="nexus-panel">
          <header class="panel-header">
            <h3>Tournament Context</h3>

            <span id="teamBuilderActiveBadge">
              Loading
            </span>
          </header>

          <div class="team-builder-panel-content">

            <div class="team-builder-context-row">
              <div class="team-builder-field">
                <label for="teamBuilderTournamentSelect">
                  Tournament to Build
                </label>

                <select
                  id="teamBuilderTournamentSelect"
                  class="team-builder-select"
                >
                  <option value="">
                    Loading tournaments...
                  </option>
                </select>
              </div>

              <button
                id="teamBuilderOpenApplicationsButton"
                class="action-button"
                type="button"
              >
                <i class="fa-solid fa-file-signature"></i>
                Applications
              </button>
            </div>

            <div class="team-builder-context-grid">
              ${createContextMetric(
                "teamBuilderTournamentName",
                "Tournament",
                "Loading..."
              )}

              ${createContextMetric(
                "teamBuilderAcceptedCount",
                "Accepted Players",
                "0"
              )}

              ${createContextMetric(
                "teamBuilderTeamCount",
                "Teams",
                "0"
              )}

              ${createContextMetric(
                "teamBuilderPlayersPerTeam",
                "Players Per Team",
                "0"
              )}

              ${createContextMetric(
                "teamBuilderPublishedState",
                "Publish State",
                "Draft"
              )}
            </div>

          </div>
        </article>

        <article class="nexus-panel">
          <header class="panel-header">
            <h3>Builder Controls</h3>

            <span id="teamBuilderSaveState">
              Synced with Firebase
            </span>
          </header>

          <div class="team-builder-panel-content">
            <div class="team-builder-control-row">

              <button
                class="action-button"
                type="button"
                data-builder-action="random"
              >
                <i class="fa-solid fa-shuffle"></i>
                Random Teams
              </button>

              <button
                class="action-button"
                type="button"
                data-builder-action="balanced"
              >
                <i class="fa-solid fa-scale-balanced"></i>
                Rank Balanced
              </button>

              <button
                class="action-button"
                type="button"
                data-builder-action="clear"
              >
                <i class="fa-solid fa-eraser"></i>
                Clear Teams
              </button>

              <button
                class="action-button action-button-primary"
                type="button"
                data-builder-action="save"
              >
                <i class="fa-solid fa-floppy-disk"></i>
                Save Draft
              </button>

              <button
                class="action-button action-button-primary"
                type="button"
                data-builder-action="publish"
              >
                <i class="fa-solid fa-bullhorn"></i>
                Publish Teams
              </button>

            </div>

            <div
              id="teamBuilderOwnerTools"
              class="team-builder-owner-tools"
              hidden
            >
              <div>
                <strong>Owner Test Tools</strong>

                <span>
                  Development-only applicant generation and cleanup.
                </span>
              </div>

              <div class="team-builder-control-row">

                <button
                  class="action-button"
                  type="button"
                  data-builder-action="generate-test"
                >
                  <i class="fa-solid fa-user-plus"></i>
                  Generate Test Players
                </button>

                <button
                  class="action-button"
                  type="button"
                  data-builder-action="delete-test"
                >
                  <i class="fa-solid fa-trash"></i>
                  Delete Test Players
                </button>

              </div>
            </div>
          </div>
        </article>

        <section class="team-builder-balance-grid">

          ${createBalanceMetric(
            "teamBuilderBalanceGrade",
            "Balance Grade",
            "--"
          )}

          ${createBalanceMetric(
            "teamBuilderAverageStrength",
            "Average Strength",
            "0"
          )}

          ${createBalanceMetric(
            "teamBuilderStrongestTeam",
            "Strongest Team",
            "0"
          )}

          ${createBalanceMetric(
            "teamBuilderWeakestTeam",
            "Weakest Team",
            "0"
          )}

          ${createBalanceMetric(
            "teamBuilderStrengthDifference",
            "Difference",
            "0"
          )}

        </section>

        <article class="nexus-panel">
          <header class="panel-header">
            <h3>Accepted Player Pool</h3>

            <span id="teamBuilderPoolCount">
              0 Unassigned
            </span>
          </header>

          <div class="team-builder-panel-content">

            <div class="team-builder-pool-toolbar">

              <div class="team-builder-search">
                <i class="fa-solid fa-magnifying-glass"></i>

                <input
                  id="teamBuilderPlayerSearch"
                  type="search"
                  placeholder="Search accepted players..."
                  autocomplete="off"
                >
              </div>

              <button
                id="teamBuilderCancelSelectionButton"
                class="action-button"
                type="button"
                disabled
              >
                <i class="fa-solid fa-xmark"></i>
                Cancel Selection
              </button>

            </div>

            <p
              id="teamBuilderSelectionNotice"
              class="team-builder-selection-notice"
            >
              Tap a player, then tap a team to assign on mobile.
              Drag and drop also works.
            </p>

            <div
              id="teamBuilderPlayerPool"
              class="team-builder-player-pool"
              data-drop-pool
            >
              ${createLoadingState(
                "Loading accepted players..."
              )}
            </div>

          </div>
        </article>

        <article class="nexus-panel">
          <header class="panel-header">
            <h3>Teams</h3>

            <span id="teamBuilderAssignedCount">
              0 Assigned
            </span>
          </header>

          <div
            id="teamBuilderTeamsGrid"
            class="team-builder-teams-grid"
          >
            ${createLoadingState(
              "Loading saved teams..."
            )}
          </div>
        </article>

      </section>
    `;

    bindEvents();
    void initializeModule();
  }

  function cleanup() {
    detachRealtimeListeners();

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

      boundContent.removeEventListener(
        "dragstart",
        handleDragStart
      );

      boundContent.removeEventListener(
        "dragover",
        handleDragOver
      );

      boundContent.removeEventListener(
        "drop",
        handleDrop
      );

      boundContent.removeEventListener(
        "dragend",
        clearDragHighlights
      );
    }

    boundContent = null;
    context = null;
  }

  function resetModuleState() {
    moduleState.activeTournamentId = "";
    moduleState.tournamentId = "";
    moduleState.tournaments = {};
    moduleState.tournament = {};
    moduleState.acceptedPlayers = [];
    moduleState.teams = {};
    moduleState.teamNames = {};
    moduleState.teamRecord = {};
    moduleState.selectedPlayerUid = null;
    moduleState.dirty = false;
    moduleState.teamsLoaded = false;
    moduleState.applicationsLoaded = false;
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

    boundContent.addEventListener(
      "dragstart",
      handleDragStart
    );

    boundContent.addEventListener(
      "dragover",
      handleDragOver
    );

    boundContent.addEventListener(
      "drop",
      handleDrop
    );

    boundContent.addEventListener(
      "dragend",
      clearDragHighlights
    );
  }

  async function initializeModule() {
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
        activeTournamentId || "open1";

      moduleState.tournaments =
        tournamentsSnapshot.val() || {};

      const preferredTournament =
        sessionStorage.getItem(
          "nexusTeamBuilderTournament"
        );

      sessionStorage.removeItem(
        "nexusTeamBuilderTournament"
      );

      const initialTournament =
        preferredTournament &&
        moduleState.tournaments[preferredTournament]
          ? preferredTournament
          : moduleState.activeTournamentId;

      renderTournamentOptions();
      switchTournament(initialTournament);

      const ownerTools =
        document.getElementById(
          "teamBuilderOwnerTools"
        );

      if (ownerTools) {
        ownerTools.hidden =
          context.roleId !== "owner";
      }
    } catch (error) {
      console.error(
        "Team Builder initialization failed:",
        error
      );

      showModuleError(
        context.isPermissionDenied(error)
          ? "Firebase denied access to the tournament, applications, or teams collection."
          : error.message ||
            "Team Builder could not be loaded."
      );
    }
  }

  function handleClick(event) {
    const button =
      event.target.closest("button");

    if (
      button &&
      boundContent.contains(button)
    ) {
      if (
        button.id ===
        "teamBuilderRefreshButton"
      ) {
        void refreshModule(button);
        return;
      }

      if (
        button.id ===
        "teamBuilderOpenApplicationsButton"
      ) {
        sessionStorage.setItem(
          "nexusApplicationsTournament",
          moduleState.tournamentId
        );

        context.openModule("applications");
        return;
      }

      if (
        button.id ===
        "teamBuilderCancelSelectionButton"
      ) {
        moduleState.selectedPlayerUid = null;

        renderPlayerPool();
        renderTeams();
        renderSelectionNotice();

        return;
      }

      const action =
        button.dataset.builderAction;

      if (action === "random") {
        generateRandomTeams();
        return;
      }

      if (action === "balanced") {
        generateBalancedTeams();
        return;
      }

      if (action === "clear") {
        clearTeams();
        return;
      }

      if (action === "save") {
        void saveTeams(button);
        return;
      }

      if (action === "publish") {
        void publishTeams(button);
        return;
      }

      if (action === "generate-test") {
        void generateTestPlayers(button);
        return;
      }

      if (action === "delete-test") {
        void deleteTestPlayers(button);
        return;
      }

      const removeUid =
        button.dataset.removePlayer;

      if (removeUid) {
        event.stopPropagation();
        removePlayer(removeUid);
        return;
      }
    }

    const playerCard =
      event.target.closest(
        "[data-select-player]"
      );

    if (
      playerCard &&
      boundContent.contains(playerCard)
    ) {
      selectPlayer(
        playerCard.dataset.selectPlayer
      );

      return;
    }

    if (
      event.target.closest(
        "[data-team-name]"
      )
    ) {
      return;
    }

    const teamCard =
      event.target.closest("[data-team-key]");

    if (
      teamCard &&
      boundContent.contains(teamCard) &&
      moduleState.selectedPlayerUid
    ) {
      assignPlayer(
        moduleState.selectedPlayerUid,
        teamCard.dataset.teamKey
      );

      moduleState.selectedPlayerUid = null;
      renderAll();
    }
  }

  function handleChange(event) {
    if (
      event.target.id ===
      "teamBuilderTournamentSelect"
    ) {
      if (moduleState.dirty) {
        const confirmed =
          window.confirm(
            "Switch tournaments and discard unsaved Team Builder changes?"
          );

        if (!confirmed) {
          event.target.value =
            moduleState.tournamentId;

          return;
        }
      }

      switchTournament(
        event.target.value
      );
    }
  }

  function handleInput(event) {
    if (
      event.target.id ===
      "teamBuilderPlayerSearch"
    ) {
      renderPlayerPool();
      return;
    }

    const teamKey =
      event.target.dataset.teamName;

    if (
      teamKey &&
      moduleState.teamNames[
        teamKey
      ] !== undefined
    ) {
      moduleState.teamNames[
        teamKey
      ] =
        clean(
          event.target.value
        );

      const teamCard =
        event.target.closest(
          "[data-team-key]"
        );

      const heading =
        teamCard?.querySelector(
          ".team-builder-team-header h3"
        );

      if (heading) {
        heading.textContent =
          getTeamName(teamKey);
      }

      markDirty(
        "Unsaved team-name changes"
      );
    }
  }

  function handleDragStart(event) {
    const draggable =
      event.target.closest(
        "[data-drag-player]"
      );

    if (!draggable) return;

    const uid =
      draggable.dataset.dragPlayer;

    event.dataTransfer.setData(
      "text/plain",
      uid
    );

    event.dataTransfer.effectAllowed =
      "move";

    requestAnimationFrame(() => {
      draggable.classList.add(
        "dragging"
      );
    });
  }

  function handleDragOver(event) {
    const dropTarget =
      event.target.closest(
        "[data-drop-team], [data-drop-pool]"
      );

    if (
      !dropTarget ||
      !boundContent.contains(dropTarget)
    ) {
      return;
    }

    event.preventDefault();

    event.dataTransfer.dropEffect =
      "move";

    clearDragHighlights();

    dropTarget.classList.add(
      "drag-over"
    );
  }

  function handleDrop(event) {
    const dropTarget =
      event.target.closest(
        "[data-drop-team], [data-drop-pool]"
      );

    if (
      !dropTarget ||
      !boundContent.contains(dropTarget)
    ) {
      return;
    }

    event.preventDefault();

    const uid =
      event.dataTransfer.getData(
        "text/plain"
      );

    clearDragHighlights();

    if (!uid) return;

    if (
      dropTarget.hasAttribute(
        "data-drop-pool"
      )
    ) {
      removePlayer(uid);
      return;
    }

    assignPlayer(
      uid,
      dropTarget.dataset.dropTeam
    );
  }

  function clearDragHighlights() {
    if (!boundContent) return;

    boundContent
      .querySelectorAll(
        ".drag-over, .dragging"
      )
      .forEach(element => {
        element.classList.remove(
          "drag-over",
          "dragging"
        );
      });
  }

  async function refreshModule(button) {
    await runButtonAction(
      button,
      "Refreshing...",
      async () => {
        const tournamentsSnapshot =
          await context.database
            .ref("tournaments")
            .once("value");

        moduleState.tournaments =
          tournamentsSnapshot.val() || {};

        renderTournamentOptions();

        switchTournament(
          moduleState.tournamentId ||
          moduleState.activeTournamentId
        );

        context.showToast(
          "Team Builder refreshed."
        );
      }
    );
  }

  function switchTournament(
    tournamentId
  ) {
    if (!tournamentId) return;

    detachRealtimeListeners();

    moduleState.tournamentId =
      tournamentId;

    moduleState.tournament = {};
    moduleState.acceptedPlayers = [];
    moduleState.teams = {};
    moduleState.teamNames = {};
    moduleState.teamRecord = {};
    moduleState.selectedPlayerUid = null;
    moduleState.dirty = false;
    moduleState.teamsLoaded = false;
    moduleState.applicationsLoaded = false;

    const select =
      document.getElementById(
        "teamBuilderTournamentSelect"
      );

    if (select) {
      select.value = tournamentId;
    }

    setText(
      "teamBuilderSaveState",
      "Loading tournament..."
    );

    setHtml(
      "teamBuilderPlayerPool",
      createLoadingState(
        "Loading accepted players..."
      )
    );

    setHtml(
      "teamBuilderTeamsGrid",
      createLoadingState(
        "Loading saved teams..."
      )
    );

    const tournamentRef =
      context.database.ref(
        `tournaments/${tournamentId}`
      );

    const applicationsRef =
      context.database.ref(
        `applications/${tournamentId}`
      );

    const teamsRef =
      context.database.ref(
        `teams/${tournamentId}`
      );

    const tournamentHandler =
      snapshot => {
        moduleState.tournament =
          snapshot.val() || {};

        ensureTeamStructure();
        renderAll();
      };

    const applicationsHandler =
      snapshot => {
        const data =
          snapshot.val() || {};

        moduleState.acceptedPlayers =
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
            )
            .filter(
              application =>
                application.status ===
                "accepted"
            )
            .sort(
              (first, second) =>
                String(
                  first.displayName || ""
                ).localeCompare(
                  String(
                    second.displayName ||
                    ""
                  )
                )
            );

        moduleState.applicationsLoaded =
          true;

        if (moduleState.teamsLoaded) {
          const changed =
            reconcileTeamsWithAcceptedPlayers();

          if (changed) {
            markDirty(
              "Accepted player changes affected the draft"
            );
          }
        }

        renderAll();
      };

    const teamsHandler =
      snapshot => {
        moduleState.teamRecord =
          snapshot.val() || {};

        if (
          !moduleState.dirty ||
          !moduleState.teamsLoaded
        ) {
          moduleState.teams =
            normalizeSavedTeams(
              moduleState.teamRecord.teams ||
              {}
            );

          moduleState.teamNames =
            normalizeSavedTeamNames(
              moduleState.teamRecord.teamNames ||
              {}
            );

          if (
            moduleState.applicationsLoaded
          ) {
            reconcileTeamsWithAcceptedPlayers();
          }
        }

        moduleState.teamsLoaded = true;
        renderAll();
      };

    const listenerError =
      label => error => {
        console.error(
          `${label} listener failed:`,
          error
        );

        context.showToast(
          context.isPermissionDenied(error)
            ? `Firebase denied access to ${label}.`
            : `${label} could not be loaded.`
        );
      };

    tournamentRef.on(
      "value",
      tournamentHandler,
      listenerError("Tournament data")
    );

    applicationsRef.on(
      "value",
      applicationsHandler,
      listenerError(
        "Accepted applications"
      )
    );

    teamsRef.on(
      "value",
      teamsHandler,
      listenerError("Saved teams")
    );

    moduleState.listeners.push(
      {
        ref: tournamentRef,
        handler: tournamentHandler
      },
      {
        ref: applicationsRef,
        handler: applicationsHandler
      },
      {
        ref: teamsRef,
        handler: teamsHandler
      }
    );

    renderTournamentOptions();
  }

  function detachRealtimeListeners() {
    moduleState.listeners.forEach(
      listener => {
        listener.ref.off(
          "value",
          listener.handler
        );
      }
    );

    moduleState.listeners = [];
  }

  function renderTournamentOptions() {
    const select =
      document.getElementById(
        "teamBuilderTournamentSelect"
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
              second.createdAt || 0
            ) -
            Number(
              first.createdAt || 0
            )
        )
        .map(
          ([id, tournament]) => {
            const activeLabel =
              id ===
              moduleState.activeTournamentId
                ? " — ACTIVE"
                : "";

            return `
              <option value="${escapeHtml(id)}">
                ${escapeHtml(
                  tournament.name || id
                )}
                (${escapeHtml(id)})
                ${activeLabel}
              </option>
            `;
          }
        )
        .join("");

    select.value =
      moduleState.tournamentId ||
      moduleState.activeTournamentId;
  }

  function renderAll() {
    ensureTeamStructure();
    renderContext();
    renderBalancePanel();
    renderPlayerPool();
    renderTeams();
    renderSelectionNotice();
    renderSaveState();
  }

  function renderContext() {
    const teamCount =
      getTeamCount();

    const playersPerTeam =
      getPlayersPerTeam();

    const acceptedCount =
      moduleState.acceptedPlayers.length;

    const published =
      moduleState.teamRecord
        .published === true ||
      moduleState.tournament
        .teamsPublished === true;

    setText(
      "teamBuilderTournamentName",
      moduleState.tournament.name ||
      moduleState.tournamentId ||
      "Tournament"
    );

    setText(
      "teamBuilderAcceptedCount",
      acceptedCount
    );

    setText(
      "teamBuilderTeamCount",
      teamCount
    );

    setText(
      "teamBuilderPlayersPerTeam",
      playersPerTeam
    );

    setText(
      "teamBuilderPublishedState",
      published
        ? "Published"
        : "Draft"
    );

    setText(
      "teamBuilderActiveBadge",

      moduleState.tournamentId ===
      moduleState.activeTournamentId
        ? "Active Tournament"
        : "Inactive Tournament"
    );
  }

  function renderPlayerPool() {
    const container =
      document.getElementById(
        "teamBuilderPlayerPool"
      );

    if (!container) return;

    const assignedUids =
      getAssignedUids();

    const query =
      clean(
        document.getElementById(
          "teamBuilderPlayerSearch"
        )?.value
      ).toLowerCase();

    const unassigned =
      moduleState.acceptedPlayers.filter(
        player => {
          if (
            assignedUids.has(player.uid)
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
        }
      );

    setText(
      "teamBuilderPoolCount",
      `${unassigned.length} Unassigned`
    );

    if (
      !moduleState.acceptedPlayers.length
    ) {
      container.innerHTML =
        createEmptyState(
          "No accepted players",
          "Accept applicants before building tournament teams.",
          "fa-user-clock"
        );

      return;
    }

    if (!unassigned.length) {
      container.innerHTML =
        createEmptyState(
          query
            ? "No matching players"
            : "All players assigned",

          query
            ? "Try another search."
            : "Every accepted player is currently on a team.",

          query
            ? "fa-magnifying-glass"
            : "fa-circle-check"
        );

      return;
    }

    container.innerHTML =
      unassigned
        .map(createPoolPlayerCard)
        .join("");
  }

  function renderTeams() {
    const grid =
      document.getElementById(
        "teamBuilderTeamsGrid"
      );

    if (!grid) return;

    const teamCount =
      getTeamCount();

    const playersPerTeam =
      getPlayersPerTeam();

    let assignedCount = 0;
    let html = "";

    for (
      let index = 1;
      index <= teamCount;
      index += 1
    ) {
      const teamKey =
        `team${index}`;

      const players =
        moduleState.teams[teamKey] ||
        [];

      const teamName =
        getTeamName(teamKey);

      assignedCount +=
        players.length;

      const roleSummary =
        getRoleSummary(players);

      const isFull =
        players.length >=
        playersPerTeam;

      html += `
        <article
          class="team-builder-team-card ${
            isFull ? "is-full" : ""
          }"
          data-team-key="${teamKey}"
          data-drop-team="${teamKey}"
        >
          <header class="team-builder-team-header">
            <div>
              <span>TEAM ${index}</span>

              <h3>
                ${escapeHtml(teamName)}
              </h3>
            </div>

            <div class="team-builder-team-score">
              <span>Strength</span>

              <strong>
                ${getTeamScore(players)}
              </strong>
            </div>
          </header>

          <div class="team-builder-team-identity">
            <label for="teamBuilderName${index}">
              Team Name
            </label>

            <input
              id="teamBuilderName${index}"
              class="team-builder-team-name-input"
              type="text"
              value="${escapeHtml(teamName)}"
              placeholder="Team ${index}"
              maxlength="40"
              autocomplete="off"
              data-team-name="${teamKey}"
            >

            <small>
              This name will appear in the bracket,
              Live Operations and public tournament pages.
            </small>
          </div>

          <div class="team-builder-team-meta">
            <span>
              ${players.length}/${playersPerTeam}
              Players
            </span>

            <span>
              ${escapeHtml(roleSummary)}
            </span>
          </div>

          <div class="team-builder-team-roster">
            ${
              players.length
                ? players
                    .map(
                      player =>
                        createTeamPlayer(
                          player
                        )
                    )
                    .join("")
                : `
                  <div class="team-builder-empty-team">
                    <i class="fa-solid fa-arrow-down"></i>

                    <strong>
                      Drop players here
                    </strong>

                    <span>
                      Or select a player and tap this team.
                    </span>
                  </div>
                `
            }
          </div>
        </article>
      `;
    }

    grid.innerHTML = html;

    setText(
      "teamBuilderAssignedCount",
      `${assignedCount} Assigned`
    );
  }

  function renderSelectionNotice() {
    const selectedPlayer =
      getPlayer(
        moduleState.selectedPlayerUid
      );

    const notice =
      document.getElementById(
        "teamBuilderSelectionNotice"
      );

    const cancelButton =
      document.getElementById(
        "teamBuilderCancelSelectionButton"
      );

    if (notice) {
      notice.textContent =
        selectedPlayer
          ? `Selected: ${
              selectedPlayer.displayName ||
              selectedPlayer.rivalsIgn ||
              "Player"
            }. Tap a team to assign.`
          : "Tap a player, then tap a team to assign on mobile. Drag and drop also works.";
    }

    if (cancelButton) {
      cancelButton.disabled =
        !selectedPlayer;
    }
  }

  function renderBalancePanel() {
    const scores = [];

    for (
      let index = 1;
      index <= getTeamCount();
      index += 1
    ) {
      scores.push(
        getTeamScore(
          moduleState.teams[
            `team${index}`
          ] || []
        )
      );
    }

    const assignedCount =
      getAssignedUids().size;

    if (
      !scores.length ||
      assignedCount === 0
    ) {
      setText(
        "teamBuilderBalanceGrade",
        "--"
      );

      setText(
        "teamBuilderAverageStrength",
        "0"
      );

      setText(
        "teamBuilderStrongestTeam",
        "0"
      );

      setText(
        "teamBuilderWeakestTeam",
        "0"
      );

      setText(
        "teamBuilderStrengthDifference",
        "0"
      );

      return;
    }

    const strongest =
      Math.max(...scores);

    const weakest =
      Math.min(...scores);

    const average =
      (
        scores.reduce(
          (total, score) =>
            total + score,
          0
        ) / scores.length
      ).toFixed(1);

    const difference =
      strongest - weakest;

    let grade = "C";

    if (difference <= 1) {
      grade = "A+";
    } else if (difference === 2) {
      grade = "A";
    } else if (difference === 3) {
      grade = "B+";
    } else if (difference === 4) {
      grade = "B";
    } else if (difference === 5) {
      grade = "C+";
    }

    setText(
      "teamBuilderBalanceGrade",
      grade
    );

    setText(
      "teamBuilderAverageStrength",
      average
    );

    setText(
      "teamBuilderStrongestTeam",
      strongest
    );

    setText(
      "teamBuilderWeakestTeam",
      weakest
    );

    setText(
      "teamBuilderStrengthDifference",
      difference
    );
  }

  function renderSaveState() {
    setText(
      "teamBuilderSaveState",
      moduleState.dirty
        ? "Unsaved team changes"
        : "Synced with Firebase"
    );
  }

  function createPoolPlayerCard(player) {
    const selected =
      moduleState.selectedPlayerUid ===
      player.uid;

    const imageUrl =
      safeImageUrl(
        player.profileImage
      );

    return `
      <button
        class="team-builder-pool-player ${
          selected ? "selected" : ""
        }"
        type="button"
        draggable="true"
        data-select-player="${escapeHtml(
          player.uid
        )}"
        data-drag-player="${escapeHtml(
          player.uid
        )}"
      >
        ${createAvatar(
          player,
          imageUrl
        )}

        <span class="team-builder-player-copy">
          <strong>
            ${escapeHtml(
              player.displayName ||
              player.rivalsIgn ||
              "Player"
            )}
          </strong>

          <span>
            ${escapeHtml(
              player.rgId ||
              "NO RG ID"
            )}
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
            ·
            ${escapeHtml(
              player.region ||
              "No Region"
            )}
          </small>
        </span>

        <i class="fa-solid ${
          selected
            ? "fa-circle-check"
            : "fa-grip-vertical"
        }"></i>
      </button>
    `;
  }

  function createTeamPlayer(player) {
    const imageUrl =
      safeImageUrl(
        player.profileImage
      );

    return `
      <div
        class="team-builder-roster-player"
        draggable="true"
        data-drag-player="${escapeHtml(
          player.uid
        )}"
      >
        ${createAvatar(
          player,
          imageUrl,
          true
        )}

        <div>
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
          </span>
        </div>

        <button
          type="button"
          data-remove-player="${escapeHtml(
            player.uid
          )}"
          aria-label="Remove ${escapeHtml(
            player.displayName ||
            "player"
          )} from team"
        >
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>
    `;
  }

  function createAvatar(
    player,
    imageUrl,
    compact = false
  ) {
    const className =
      compact
        ? "team-builder-mini-avatar"
        : "team-builder-player-avatar";

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
          createInitials(
            player.displayName ||
            player.rivalsIgn ||
            "RG"
          )
        )}
      </span>
    `;
  }

  function selectPlayer(uid) {
    moduleState.selectedPlayerUid =
      moduleState.selectedPlayerUid ===
      uid
        ? null
        : uid;

    renderPlayerPool();
    renderTeams();
    renderSelectionNotice();
  }

  function assignPlayer(
    uid,
    teamKey
  ) {
    const player =
      getPlayer(uid);

    if (
      !player ||
      !moduleState.teams[teamKey]
    ) {
      return;
    }

    const targetTeam =
      moduleState.teams[teamKey];

    const alreadyOnTarget =
      targetTeam.some(
        member =>
          member.uid === uid
      );

    if (
      !alreadyOnTarget &&
      targetTeam.length >=
        getPlayersPerTeam()
    ) {
      context.showToast(
        `That team already has ${getPlayersPerTeam()} players.`
      );

      return;
    }

    removePlayerFromAllTeams(
      uid,
      false
    );

    moduleState.teams[
      teamKey
    ].push(player);

    markDirty(
      `${
        player.displayName ||
        "Player"
      } assigned to ${formatTeamName(
        teamKey
      )}`
    );

    renderAll();
  }

  function removePlayer(uid) {
    const player =
      getPlayer(uid) ||
      findAssignedPlayer(uid);

    const changed =
      removePlayerFromAllTeams(
        uid,
        false
      );

    if (!changed) return;

    if (
      moduleState.selectedPlayerUid ===
      uid
    ) {
      moduleState.selectedPlayerUid =
        null;
    }

    markDirty(
      `${
        player?.displayName ||
        "Player"
      } returned to the pool`
    );

    renderAll();
  }

  function removePlayerFromAllTeams(
    uid,
    shouldRender = true
  ) {
    let changed = false;

    Object.keys(
      moduleState.teams
    ).forEach(teamKey => {
      const before =
        moduleState.teams[
          teamKey
        ].length;

      moduleState.teams[teamKey] =
        moduleState.teams[
          teamKey
        ].filter(
          player =>
            player.uid !== uid
        );

      if (
        moduleState.teams[
          teamKey
        ].length !== before
      ) {
        changed = true;
      }
    });

    if (
      shouldRender &&
      changed
    ) {
      renderAll();
    }

    return changed;
  }

  function generateRandomTeams() {
    if (
      !moduleState.acceptedPlayers.length
    ) {
      context.showToast(
        "There are no accepted players to assign."
      );

      return;
    }

    const players =
      shuffle([
        ...moduleState.acceptedPlayers
      ]);

    resetTeams();

    const capacity =
      getTeamCount() *
      getPlayersPerTeam();

    players
      .slice(0, capacity)
      .forEach(
        (player, index) => {
          const teamKey =
            `team${
              (
                index %
                getTeamCount()
              ) + 1
            }`;

          moduleState.teams[
            teamKey
          ].push(player);
        }
      );

    moduleState.selectedPlayerUid =
      null;

    markDirty(
      "Random teams generated"
    );

    renderAll();

    if (
      players.length > capacity
    ) {
      context.showToast(
        `${
          players.length -
          capacity
        } accepted players remain unassigned because all teams are full.`
      );
    } else {
      context.showToast(
        "Random teams generated."
      );
    }
  }

  function generateBalancedTeams() {
    if (
      !moduleState.acceptedPlayers.length
    ) {
      context.showToast(
        "There are no accepted players to assign."
      );

      return;
    }

    const players =
      shuffle([
        ...moduleState.acceptedPlayers
      ]).sort(
        (first, second) => {
          const rankDifference =
            getRankValue(
              second.peakRank
            ) -
            getRankValue(
              first.peakRank
            );

          return rankDifference !== 0
            ? rankDifference
            : Math.random() - 0.5;
        }
      );

    resetTeams();

    const capacity =
      getTeamCount() *
      getPlayersPerTeam();

    players
      .slice(0, capacity)
      .forEach(player => {
        const role =
          player.mainRole ||
          "Flex";

        const availableTeams =
          Object.keys(
            moduleState.teams
          )
            .filter(
              teamKey =>
                moduleState.teams[
                  teamKey
                ].length <
                getPlayersPerTeam()
            )
            .sort(
              (
                firstKey,
                secondKey
              ) => {
                const firstTeam =
                  moduleState.teams[
                    firstKey
                  ];

                const secondTeam =
                  moduleState.teams[
                    secondKey
                  ];

                const roleDifference =
                  getRoleCount(
                    firstTeam,
                    role
                  ) -
                  getRoleCount(
                    secondTeam,
                    role
                  );

                if (
                  roleDifference !== 0
                ) {
                  return roleDifference;
                }

                const strengthDifference =
                  getTeamScore(
                    firstTeam
                  ) -
                  getTeamScore(
                    secondTeam
                  );

                if (
                  strengthDifference !== 0
                ) {
                  return strengthDifference;
                }

                return (
                  firstTeam.length -
                  secondTeam.length
                );
              }
            );

        if (
          availableTeams.length
        ) {
          moduleState.teams[
            availableTeams[0]
          ].push(player);
        }
      });

    moduleState.selectedPlayerUid =
      null;

    markDirty(
      "Rank-balanced teams generated"
    );

    renderAll();

    if (
      players.length > capacity
    ) {
      context.showToast(
        `${
          players.length -
          capacity
        } accepted players remain unassigned because all teams are full.`
      );
    } else {
      context.showToast(
        "Rank-balanced teams generated."
      );
    }
  }

  function clearTeams() {
    if (!getAssignedUids().size) {
      context.showToast(
        "All teams are already empty."
      );

      return;
    }

    const confirmed =
      window.confirm(
        "Clear every team and return all players to the pool?"
      );

    if (!confirmed) return;

    resetTeams();

    moduleState.selectedPlayerUid =
      null;

    markDirty(
      "All teams cleared"
    );

    renderAll();
  }

  async function saveTeams(button) {
    await runButtonAction(
      button,
      "Saving...",
      async () => {
        await context.database
          .ref(
            `teams/${moduleState.tournamentId}`
          )
          .update({
            teams:
              serializeTeams(),

            teamNames:
              serializeTeamNames(),

            updatedAt:
              firebase.database
                .ServerValue
                .TIMESTAMP,

            updatedBy:
              context.currentUser?.uid ||
              null
          });

        moduleState.teamRecord.teamNames =
          serializeTeamNames();

        moduleState.dirty = false;

        renderSaveState();

        context.showToast(
          "Team draft saved."
        );
      }
    );
  }

  async function publishTeams(button) {
    const assignedCount =
      getAssignedUids().size;

    if (!assignedCount) {
      context.showToast(
        "Assign players before publishing teams."
      );

      return;
    }

    const incompleteTeams =
      Object.keys(
        moduleState.teams
      ).filter(
        teamKey =>
          moduleState.teams[
            teamKey
          ].length !==
          getPlayersPerTeam()
      );

    const warning =
      incompleteTeams.length
        ? `\n\n${incompleteTeams.length} teams are not full.`
        : "";

    const confirmed =
      window.confirm(
        `Publish teams for ${
          moduleState.tournament.name ||
          moduleState.tournamentId
        }?${warning}\n\nThis makes the team lineup public.`
      );

    if (!confirmed) return;

    await runButtonAction(
      button,
      "Publishing...",
      async () => {
        const timestamp =
          firebase.database
            .ServerValue
            .TIMESTAMP;

        const updates = {
          [`teams/${moduleState.tournamentId}/teams`]:
            serializeTeams(),

          [`teams/${moduleState.tournamentId}/teamNames`]:
            serializeTeamNames(),

          [`teams/${moduleState.tournamentId}/published`]:
            true,

          [`teams/${moduleState.tournamentId}/publishedAt`]:
            timestamp,

          [`teams/${moduleState.tournamentId}/updatedAt`]:
            timestamp,

          [`teams/${moduleState.tournamentId}/updatedBy`]:
            context.currentUser?.uid ||
            null,

          [`tournaments/${moduleState.tournamentId}/teamsPublished`]:
            true,

          [`tournaments/${moduleState.tournamentId}/teamsPublishedAt`]:
            timestamp,

          [`tournaments/${moduleState.tournamentId}/status`]:
            "teams_published"
        };

        /*
         * Only the active tournament should update
         * the legacy public-site team fields.
         */
        if (
          moduleState.tournamentId ===
          moduleState.activeTournamentId
        ) {
          for (
            let index = 1;
            index <= 16;
            index += 1
          ) {
            const teamKey =
              `team${index}`;

            updates[
              `site/${teamKey}`
            ] =
              index <= getTeamCount()
                ? getTeamName(teamKey)
                : null;
          }
        }

        await context.database
          .ref()
          .update(updates);

        moduleState.dirty = false;

        moduleState.teamRecord.published =
          true;

        moduleState.teamRecord.teamNames =
          serializeTeamNames();

        renderAll();

        context.showToast(
          "Teams published successfully."
        );
      }
    );
  }

  async function generateTestPlayers(
    button
  ) {
    if (
      context.roleId !== "owner"
    ) {
      return;
    }

    const acceptedCount =
      Number(
        moduleState.tournament
          .maxPlayers ||
        getTeamCount() *
        getPlayersPerTeam()
      );

    const waitlistCount =
      Math.max(
        4,
        getTeamCount()
      );

    const confirmed =
      window.confirm(
        `Generate ${acceptedCount} accepted test players and ${waitlistCount} waitlist players for ${moduleState.tournamentId}?`
      );

    if (!confirmed) return;

    await runButtonAction(
      button,
      "Generating...",
      async () => {
        const names = [
          "Nova",
          "Blaze",
          "Vortex",
          "Echo",
          "Titan",
          "Cipher",
          "Rogue",
          "Phantom",
          "Apex",
          "Shadow",
          "Crimson",
          "Flux",
          "Onyx",
          "Pulse",
          "Storm",
          "Frost",
          "Vector",
          "Rift"
        ];

        const ranks =
          Object.keys(
            RANK_VALUES
          ).reverse();

        const roles = [
          "Vanguard",
          "Duelist",
          "Strategist",
          "Flex"
        ];

        const regions = [
          "NA East",
          "NA Central",
          "NA West",
          "EU"
        ];

        const platforms = [
          "PC",
          "PlayStation",
          "Xbox"
        ];

        const total =
          acceptedCount +
          waitlistCount;

        const updates = {};

        for (
          let index = 1;
          index <= total;
          index += 1
        ) {
          const uid =
            `testPlayer${String(
              index
            ).padStart(3, "0")}`;

          const displayName =
            `${randomFrom(
              names
            )}${index}`;

          updates[
            `applications/${moduleState.tournamentId}/${uid}`
          ] = {
            uid,

            rgId:
              `TEST${String(
                index
              ).padStart(4, "0")}`,

            displayName,
            rivalsIgn: displayName,

            discordUsername:
              `${displayName.toLowerCase()}#0000`,

            discordMember: true,

            region:
              randomFrom(regions),

            platform:
              randomFrom(platforms),

            profileImage: "",

            peakRank:
              randomFrom(ranks),

            mainRole:
              randomFrom(roles),

            mainHeroes:
              "Hela, Luna Snow, Doctor Strange",

            availability: "Yes",
            workingMic: "Yes",
            customLobby: "Yes",
            teamVc: "Yes",

            willStream:
              randomFrom([
                "Yes",
                "Maybe",
                "No"
              ]),

            wantsSub:
              index <= acceptedCount
                ? "No"
                : "Yes",

            followerCount:
              Math.floor(
                Math.random() *
                5000
              ),

            adminNotes:
              "Generated test applicant.",

            internalAdminNotes: "",

            status:
              index <= acceptedCount
                ? "accepted"
                : "waitlist",

            testPlayer: true,

            submittedAt:
              Date.now() + index,

            updatedAt:
              firebase.database
                .ServerValue
                .TIMESTAMP
          };
        }

        await context.database
          .ref()
          .update(updates);

        context.showToast(
          `${acceptedCount} accepted test players generated.`
        );
      }
    );
  }

  async function deleteTestPlayers(
    button
  ) {
    if (
      context.roleId !== "owner"
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        `Delete all generated test applicants for ${moduleState.tournamentId}?\n\nSaved teams will also be cleared because they may contain test players.`
      );

    if (!confirmed) return;

    await runButtonAction(
      button,
      "Deleting...",
      async () => {
        const snapshot =
          await context.database
            .ref(
              `applications/${moduleState.tournamentId}`
            )
            .once("value");

        const data =
          snapshot.val() || {};

        const updates = {};

        Object.entries(data).forEach(
          ([
            uid,
            application
          ]) => {
            if (
              application?.testPlayer ===
              true
            ) {
              updates[
                `applications/${moduleState.tournamentId}/${uid}`
              ] = null;
            }
          }
        );

        updates[
          `teams/${moduleState.tournamentId}`
        ] = null;

        await context.database
          .ref()
          .update(updates);

        resetTeams();
        moduleState.teamNames = {};
        ensureTeamStructure();

        moduleState.teamRecord = {};
        moduleState.dirty = false;

        renderAll();

        context.showToast(
          "Test players and saved test teams deleted."
        );
      }
    );
  }

  async function runButtonAction(
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
        "Team Builder action failed:",
        error
      );

      const message =
        context.isPermissionDenied(error)
          ? "Firebase denied this Team Builder action."
          : error.message ||
            "The Team Builder action failed.";

      context.showToast(message);

      window.alert(
        `Team Builder Error\n\n${message}`
      );
    } finally {
      button.disabled = false;
      button.innerHTML = originalHtml;
    }
  }

  function ensureTeamStructure() {
    const teamCount =
      getTeamCount();

    const nextTeams = {};
    const nextTeamNames = {};

    for (
      let index = 1;
      index <= teamCount;
      index += 1
    ) {
      const teamKey =
        `team${index}`;

      nextTeams[teamKey] =
        Array.isArray(
          moduleState.teams[
            teamKey
          ]
        )
          ? moduleState.teams[
              teamKey
            ].slice(
              0,
              getPlayersPerTeam()
            )
          : [];

      nextTeamNames[teamKey] =
        clean(
          moduleState.teamNames[
            teamKey
          ]
        );
    }

    moduleState.teams =
      nextTeams;

    moduleState.teamNames =
      nextTeamNames;
  }

  function normalizeSavedTeams(
    savedTeams
  ) {
    const normalized = {};

    for (
      let index = 1;
      index <= getTeamCount();
      index += 1
    ) {
      const teamKey =
        `team${index}`;

      const rawTeam =
        savedTeams[teamKey];

      if (Array.isArray(rawTeam)) {
        normalized[teamKey] =
          rawTeam.filter(Boolean);
      } else if (
        rawTeam &&
        typeof rawTeam === "object"
      ) {
        normalized[teamKey] =
          Object.values(
            rawTeam
          ).filter(Boolean);
      } else {
        normalized[teamKey] = [];
      }
    }

    return normalized;
  }

  function reconcileTeamsWithAcceptedPlayers() {
    const acceptedMap =
      new Map(
        moduleState.acceptedPlayers.map(
          player => [
            player.uid,
            player
          ]
        )
      );

    const seen = new Set();
    let changed = false;

    Object.keys(
      moduleState.teams
    ).forEach(teamKey => {
      const nextTeam = [];

      (
        moduleState.teams[
          teamKey
        ] || []
      ).forEach(savedPlayer => {
        const uid =
          savedPlayer?.uid;

        const currentPlayer =
          acceptedMap.get(uid);

        if (
          !uid ||
          !currentPlayer ||
          seen.has(uid) ||
          nextTeam.length >=
            getPlayersPerTeam()
        ) {
          changed = true;
          return;
        }

        seen.add(uid);
        nextTeam.push(
          currentPlayer
        );
      });

      moduleState.teams[
        teamKey
      ] = nextTeam;
    });

    return changed;
  }

  function resetTeams() {
    moduleState.teams = {};
    ensureTeamStructure();
  }

  function serializeTeams() {
    const serialized = {};

    Object.entries(
      moduleState.teams
    ).forEach(
      ([
        teamKey,
        players
      ]) => {
        serialized[teamKey] =
          players.map(player => ({
            uid: player.uid,

            rgId:
              player.rgId || "",

            displayName:
              player.displayName ||
              "",

            rivalsIgn:
              player.rivalsIgn || "",

            profileImage:
              player.profileImage ||
              "",

            peakRank:
              player.peakRank || "",

            mainRole:
              player.mainRole || "",

            region:
              player.region || "",

            platform:
              player.platform || ""
          }));
      }
    );

    return serialized;
  }

  function normalizeSavedTeamNames(
    savedNames
  ) {
    const normalized = {};

    for (
      let index = 1;
      index <= getTeamCount();
      index += 1
    ) {
      const teamKey =
        `team${index}`;

      normalized[teamKey] =
        clean(
          savedNames[teamKey]
        );
    }

    return normalized;
  }

  function serializeTeamNames() {
    const serialized = {};

    for (
      let index = 1;
      index <= getTeamCount();
      index += 1
    ) {
      const teamKey =
        `team${index}`;

      serialized[teamKey] =
        getTeamName(teamKey);
    }

    return serialized;
  }

  function getTeamName(teamKey) {
    const teamNumber =
      String(teamKey || "")
        .replace("team", "");

    return (
      clean(
        moduleState.teamNames[
          teamKey
        ]
      ) ||
      `Team ${teamNumber}`
    );
  }

  function getTeamCount() {
    return Math.max(
      1,
      Number(
        moduleState.tournament
          .teamCount || 8
      )
    );
  }

  function getPlayersPerTeam() {
    const explicit =
      Number(
        moduleState.tournament
          .playersPerTeam || 0
      );

    if (explicit > 0) {
      return explicit;
    }

    const maxPlayers =
      Number(
        moduleState.tournament
          .maxPlayers ||
        getTeamCount() * 6
      );

    return Math.max(
      1,
      Math.ceil(
        maxPlayers /
        getTeamCount()
      )
    );
  }

  function getPlayer(uid) {
    return (
      moduleState.acceptedPlayers
        .find(
          player =>
            player.uid === uid
        ) || null
    );
  }

  function findAssignedPlayer(uid) {
    for (
      const players of
      Object.values(
        moduleState.teams
      )
    ) {
      const player =
        players.find(
          member =>
            member.uid === uid
        );

      if (player) return player;
    }

    return null;
  }

  function getAssignedUids() {
    return new Set(
      Object.values(
        moduleState.teams
      )
        .flat()
        .map(player => player.uid)
        .filter(Boolean)
    );
  }

  function getRankValue(rank) {
    return RANK_VALUES[rank] || 0;
  }

  function getTeamScore(team) {
    return team.reduce(
      (total, player) =>
        total +
        getRankValue(
          player.peakRank
        ),
      0
    );
  }

  function getRoleCount(
    team,
    role
  ) {
    return team.filter(
      player =>
        (
          player.mainRole ||
          "Flex"
        ) === role
    ).length;
  }

  function getRoleSummary(team) {
    if (!team.length) {
      return "No roles assigned";
    }

    const counts = {};

    team.forEach(player => {
      const role =
        player.mainRole ||
        "Flex";

      counts[role] =
        (counts[role] || 0) + 1;
    });

    return Object.entries(counts)
      .map(
        ([role, count]) =>
          `${role} ${count}`
      )
      .join(" · ");
  }

  function markDirty(message) {
    moduleState.dirty = true;

    setText(
      "teamBuilderSaveState",
      message ||
      "Unsaved team changes"
    );
  }

  function formatTeamName(teamKey) {
    return getTeamName(teamKey);
  }

  function shuffle(list) {
    for (
      let index =
        list.length - 1;
      index > 0;
      index -= 1
    ) {
      const randomIndex =
        Math.floor(
          Math.random() *
          (index + 1)
        );

      [
        list[index],
        list[randomIndex]
      ] = [
        list[randomIndex],
        list[index]
      ];
    }

    return list;
  }

  function randomFrom(list) {
    return list[
      Math.floor(
        Math.random() *
        list.length
      )
    ];
  }

  function showModuleError(message) {
    setHtml(
      "teamBuilderPlayerPool",
      createEmptyState(
        "Team Builder unavailable",
        message,
        "fa-triangle-exclamation"
      )
    );

    setHtml(
      "teamBuilderTeamsGrid",
      createEmptyState(
        "Teams unavailable",
        message,
        "fa-triangle-exclamation"
      )
    );
  }

  function createContextMetric(
    id,
    label,
    value
  ) {
    return `
      <div class="team-builder-context-metric">
        <span>
          ${escapeHtml(label)}
        </span>

        <strong id="${escapeHtml(id)}">
          ${escapeHtml(value)}
        </strong>
      </div>
    `;
  }

  function createBalanceMetric(
    id,
    label,
    value
  ) {
    return `
      <article class="team-builder-balance-card">
        <span>
          ${escapeHtml(label)}
        </span>

        <strong id="${escapeHtml(id)}">
          ${escapeHtml(value)}
        </strong>
      </article>
    `;
  }

  function createLoadingState(message) {
    return `
      <div class="team-builder-empty-state">
        <i class="fa-solid fa-spinner fa-spin"></i>

        <strong>
          ${escapeHtml(message)}
        </strong>
      </div>
    `;
  }

  function createEmptyState(
    title,
    message,
    icon
  ) {
    return `
      <div class="team-builder-empty-state">
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

  function createInitials(value) {
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
        parsed.protocol === "https:" ||
        parsed.protocol === "http:"
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
      return context.escapeHtml(value);
    }

    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  window.NexusTeamBuilder = {
    render,
    cleanup
  };
})();
