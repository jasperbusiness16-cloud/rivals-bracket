(() => {
  "use strict";

  const moduleState = {
    activeTournamentId: "",
    tournamentId: "",
    tournaments: {},
    tournament: {},
    applications: [],
    listeners: []
  };

  let context = null;
  let boundContent = null;

  function render(nexusContext) {
    cleanup();

    context = nexusContext;
    boundContent = context.content;

    moduleState.activeTournamentId = "";
    moduleState.tournamentId = "";
    moduleState.tournaments = {};
    moduleState.tournament = {};
    moduleState.applications = [];

    boundContent.innerHTML = `
      <section class="module-intro">
        <div>
          <h2>Application Review</h2>

          <p>
            Review tournament applicants, manage acceptance status,
            save internal notes and send accepted players to Team Builder.
          </p>
        </div>

        <div class="module-actions">
          <button
            id="applicationsRefreshButton"
            class="action-button"
            type="button"
          >
            <i class="fa-solid fa-rotate"></i>
            Refresh
          </button>
        </div>
      </section>

      <section class="applications-layout">

        <article class="nexus-panel applications-tournament-panel">
          <header class="panel-header">
            <h3>Tournament Context</h3>
            <span id="applicationsActiveLabel">
              Loading
            </span>
          </header>

          <div class="applications-panel-content">
            <div class="applications-tournament-controls">

              <div class="applications-field">
                <label for="applicationsTournamentSelect">
                  Tournament to Review
                </label>

                <select
                  id="applicationsTournamentSelect"
                  class="applications-select"
                >
                  <option value="">
                    Loading tournaments...
                  </option>
                </select>
              </div>

              <button
                id="applicationsSetActiveButton"
                class="action-button action-button-primary"
                type="button"
              >
                <i class="fa-solid fa-bolt"></i>
                Set as Active
              </button>

            </div>

            <div class="applications-tournament-summary">

              <div>
                <span>Tournament</span>
                <strong id="applicationsTournamentName">
                  Loading...
                </strong>
              </div>

              <div>
                <span>Status</span>
                <strong id="applicationsTournamentStatus">
                  —
                </strong>
              </div>

              <div>
                <span>Accepted Players</span>
                <strong id="applicationsAcceptedPlayers">
                  0 / 0
                </strong>
              </div>

              <div>
                <span>Team Count</span>
                <strong id="applicationsTeamCount">
                  0
                </strong>
              </div>

            </div>

            <div class="applications-context-actions">
              <button
                id="applicationsOpenTeamsButton"
                class="action-button"
                type="button"
                disabled
              >
                <i class="fa-solid fa-people-group"></i>
                Team Builder Locked
              </button>

              <p>
                Tournament creation will be placed in Event Control
                instead of Application Review.
              </p>
            </div>
          </div>
        </article>

        <section class="applications-summary-grid">

          ${createSummaryCard(
            "applicationsTotalCount",
            "Total",
            "fa-layer-group"
          )}

          ${createSummaryCard(
            "applicationsPendingCount",
            "Pending",
            "fa-hourglass-half"
          )}

          ${createSummaryCard(
            "applicationsAcceptedCount",
            "Accepted",
            "fa-circle-check"
          )}

          ${createSummaryCard(
            "applicationsWaitlistCount",
            "Waitlist",
            "fa-list-check"
          )}

          ${createSummaryCard(
            "applicationsDeclinedCount",
            "Declined",
            "fa-circle-xmark"
          )}

        </section>

        <article class="nexus-panel">
          <header class="panel-header">
            <h3>Application Controls</h3>
            <span id="applicationsVisibleCount">
              0 Results
            </span>
          </header>

          <div class="applications-panel-content">
            <div class="applications-filter-grid">

              <div class="applications-field">
                <label for="applicationsSearchInput">
                  Search
                </label>

                <div class="applications-search">
                  <i class="fa-solid fa-magnifying-glass"></i>

                  <input
                    id="applicationsSearchInput"
                    type="search"
                    placeholder="Name, IGN, RG ID, rank, region..."
                    autocomplete="off"
                  >
                </div>
              </div>

              <div class="applications-field">
                <label for="applicationsStatusFilter">
                  Status
                </label>

                <select
                  id="applicationsStatusFilter"
                  class="applications-select"
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="accepted">Accepted</option>
                  <option value="waitlist">Waitlist</option>
                  <option value="declined">Declined</option>
                </select>
              </div>

              <div class="applications-field">
                <label for="applicationsSortFilter">
                  Sort By
                </label>

                <select
                  id="applicationsSortFilter"
                  class="applications-select"
                >
                  <option value="newest">Newest</option>
                  <option value="oldest">Oldest</option>
                  <option value="followersHigh">
                    Most Followers
                  </option>
                  <option value="followersLow">
                    Least Followers
                  </option>
                  <option value="rankHigh">
                    Highest Rank
                  </option>
                  <option value="rankLow">
                    Lowest Rank
                  </option>
                  <option value="role">
                    Preferred Role
                  </option>
                  <option value="region">
                    Region
                  </option>
                </select>
              </div>

            </div>
          </div>
        </article>

        <article class="nexus-panel">
          <header class="panel-header">
            <h3>Applicants</h3>
            <span id="applicationsTournamentReference">
              No Tournament
            </span>
          </header>

          <div
            id="applicationsList"
            class="applications-list"
          >
            ${createLoadingState()}
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
        "input",
        handleInput
      );

      boundContent.removeEventListener(
        "change",
        handleChange
      );
    }

    boundContent = null;
    context = null;
  }

  function bindEvents() {
    boundContent.addEventListener(
      "click",
      handleClick
    );

    boundContent.addEventListener(
      "input",
      handleInput
    );

    boundContent.addEventListener(
      "change",
      handleChange
    );
  }

  async function initializeModule() {
    setApplicationsList(createLoadingState());

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

      renderTournamentOptions();

      switchReviewedTournament(
        moduleState.activeTournamentId
      );
    } catch (error) {
      console.error(
        "Unable to initialize Applications:",
        error
      );

      setApplicationsList(
        createErrorState(
          context.isPermissionDenied(error)
            ? "Firebase denied access to the tournament or application collection."
            : error.message ||
              "Applications could not be loaded."
        )
      );
    }
  }

  function handleClick(event) {
    const button =
      event.target.closest("button");

    if (
      !button ||
      !boundContent.contains(button)
    ) {
      return;
    }

    if (button.id === "applicationsRefreshButton") {
      void refreshModule(button);
      return;
    }

    if (
      button.id ===
      "applicationsSetActiveButton"
    ) {
      void saveActiveTournament(button);
      return;
    }

    if (
  button.id ===
  "applicationsOpenTeamsButton"
) {
  sessionStorage.setItem(
    "nexusTeamBuilderTournament",
    moduleState.tournamentId
  );

  context.openModule("teams");
  return;
}

    const action =
      button.dataset.applicationAction;

    const uid =
      button.dataset.uid;

    if (
      action === "status" &&
      uid
    ) {
      void updateApplicationStatus(
        uid,
        button.dataset.status,
        button
      );

      return;
    }

    if (
      action === "save-note" &&
      uid
    ) {
      void saveApplicationNote(
        uid,
        button
      );
    }
  }

  function handleInput(event) {
    if (
      event.target.id ===
      "applicationsSearchInput"
    ) {
      renderApplicationList();
    }
  }

  function handleChange(event) {
    if (
      event.target.id ===
      "applicationsTournamentSelect"
    ) {
      switchReviewedTournament(
        event.target.value
      );

      return;
    }

    if (
      event.target.id ===
        "applicationsStatusFilter" ||
      event.target.id ===
        "applicationsSortFilter"
    ) {
      renderApplicationList();
    }
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

        switchReviewedTournament(
          moduleState.tournamentId ||
          moduleState.activeTournamentId
        );

        context.showToast(
          "Application data refreshed."
        );
      }
    );
  }

  function renderTournamentOptions() {
    const select =
      document.getElementById(
        "applicationsTournamentSelect"
      );

    if (!select) return;

    const tournamentEntries =
      Object.entries(
        moduleState.tournaments
      );

    if (!tournamentEntries.length) {
      select.innerHTML = `
        <option value="">
          No tournaments found
        </option>
      `;

      return;
    }

    select.innerHTML =
      tournamentEntries
        .sort(([, first], [, second]) => {
          return Number(
            second.createdAt || 0
          ) - Number(
            first.createdAt || 0
          );
        })
        .map(([id, tournament]) => {
          const name =
            tournament.name || id;

          const activeText =
            id ===
            moduleState.activeTournamentId
              ? " — ACTIVE"
              : "";

          return `
            <option value="${escapeHtml(id)}">
              ${escapeHtml(name)}
              (${escapeHtml(id)})
              ${activeText}
            </option>
          `;
        })
        .join("");

    select.value =
      moduleState.tournamentId ||
      moduleState.activeTournamentId;
  }

  function switchReviewedTournament(
    tournamentId
  ) {
    if (!tournamentId) return;

    detachRealtimeListeners();

    moduleState.tournamentId =
      tournamentId;

    moduleState.tournament = {};
    moduleState.applications = [];

    const select =
      document.getElementById(
        "applicationsTournamentSelect"
      );

    if (select) {
      select.value = tournamentId;
    }

    setApplicationsList(
      createLoadingState()
    );

    const tournamentRef =
      context.database.ref(
        `tournaments/${tournamentId}`
      );

    const applicationsRef =
      context.database.ref(
        `applications/${tournamentId}`
      );

    const tournamentHandler =
      snapshot => {
        moduleState.tournament =
          snapshot.val() || {};

        renderTournamentSummary();
        renderApplicationSummary();
        renderApplicationList();
      };

    const applicationsHandler =
      snapshot => {
        const records =
          snapshot.val() || {};

        moduleState.applications =
          Object.entries(records)
            .map(([uid, application]) => ({
              ...(application || {}),
              uid:
                application?.uid ||
                uid,
              status:
                application?.status ||
                "pending"
            }))
            .sort((first, second) => {
              return Number(
                second.submittedAt || 0
              ) - Number(
                first.submittedAt || 0
              );
            });

        renderTournamentSummary();
        renderApplicationSummary();
        renderApplicationList();
      };

    const tournamentError =
      error => {
        console.error(
          "Tournament listener failed:",
          error
        );

        context.showToast(
          context.isPermissionDenied(error)
            ? "Firebase denied access to this tournament."
            : "Tournament data could not be loaded."
        );
      };

    const applicationsError =
      error => {
        console.error(
          "Applications listener failed:",
          error
        );

        setApplicationsList(
          createErrorState(
            context.isPermissionDenied(error)
              ? "Firebase denied access to this tournament's applications."
              : "Application records could not be loaded."
          )
        );
      };

    tournamentRef.on(
      "value",
      tournamentHandler,
      tournamentError
    );

    applicationsRef.on(
      "value",
      applicationsHandler,
      applicationsError
    );

    moduleState.listeners.push(
      {
        ref: tournamentRef,
        handler: tournamentHandler
      },
      {
        ref: applicationsRef,
        handler: applicationsHandler
      }
    );

    renderTournamentOptions();
    renderTournamentSummary();
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

  function renderTournamentSummary() {
    const tournament =
      moduleState.tournament || {};

    const acceptedCount =
      getStatusCount("accepted");

    const maxPlayers =
      Number(
        tournament.maxPlayers || 48
      );

    const teamCount =
      Number(
        tournament.teamCount || 8
      );

    const tournamentName =
      tournament.name ||
      moduleState.tournamentId ||
      "Tournament";

    const tournamentStatus =
      String(
        tournament.status ||
        "unknown"
      )
        .replaceAll("_", " ")
        .toUpperCase();

    setText(
      "applicationsTournamentName",
      tournamentName
    );

    setText(
      "applicationsTournamentStatus",
      tournamentStatus
    );

    setText(
      "applicationsAcceptedPlayers",
      `${acceptedCount} / ${maxPlayers}`
    );

    setText(
      "applicationsTeamCount",
      teamCount
    );

    setText(
      "applicationsTournamentReference",
      moduleState.tournamentId ||
      "No Tournament"
    );

    const isActive =
      moduleState.tournamentId ===
      moduleState.activeTournamentId;

    setText(
      "applicationsActiveLabel",
      isActive
        ? "Active Tournament"
        : "Reviewing Inactive Tournament"
    );

    const setActiveButton =
      document.getElementById(
        "applicationsSetActiveButton"
      );

    if (setActiveButton) {
      setActiveButton.disabled =
        !moduleState.tournamentId ||
        isActive;

      setActiveButton.innerHTML =
        isActive
          ? `
            <i class="fa-solid fa-circle-check"></i>
            Currently Active
          `
          : `
            <i class="fa-solid fa-bolt"></i>
            Set as Active
          `;
    }

    const teamsButton =
      document.getElementById(
        "applicationsOpenTeamsButton"
      );

    if (teamsButton) {
      const unlocked =
        acceptedCount > 0;

      teamsButton.disabled =
        !unlocked;

      teamsButton.innerHTML =
        unlocked
          ? `
            <i class="fa-solid fa-people-group"></i>
            Open Team Builder
          `
          : `
            <i class="fa-solid fa-lock"></i>
            Team Builder Locked
          `;
    }
  }

  function renderApplicationSummary() {
    setText(
      "applicationsTotalCount",
      moduleState.applications.length
    );

    setText(
      "applicationsPendingCount",
      getStatusCount("pending")
    );

    setText(
      "applicationsAcceptedCount",
      getStatusCount("accepted")
    );

    setText(
      "applicationsWaitlistCount",
      getStatusCount("waitlist")
    );

    setText(
      "applicationsDeclinedCount",
      getStatusCount("declined")
    );
  }

  function renderApplicationList() {
    const list =
      document.getElementById(
        "applicationsList"
      );

    if (!list) return;

    const filtered =
      getFilteredApplications();

    setText(
      "applicationsVisibleCount",
      `${filtered.length} ${
        filtered.length === 1
          ? "Result"
          : "Results"
      }`
    );

    if (!filtered.length) {
      list.innerHTML = `
        <div class="applications-empty">
          <i class="fa-solid fa-inbox"></i>

          <strong>
            No applications found
          </strong>

          <span>
            Adjust the search or status filter,
            or wait for new applicants.
          </span>
        </div>
      `;

      return;
    }

    list.innerHTML =
      filtered
        .map(createApplicationCard)
        .join("");
  }

  function getFilteredApplications() {
    const search =
      clean(
        document.getElementById(
          "applicationsSearchInput"
        )?.value
      ).toLowerCase();

    const statusFilter =
      document.getElementById(
        "applicationsStatusFilter"
      )?.value || "all";

    const sortFilter =
      document.getElementById(
        "applicationsSortFilter"
      )?.value || "newest";

    const filtered =
      moduleState.applications
        .filter(application => {
          const status =
            application.status ||
            "pending";

          const statusMatches =
            statusFilter === "all" ||
            status === statusFilter;

          const searchMatches =
            !search ||
            matchesSearch(
              application,
              search
            );

          return (
            statusMatches &&
            searchMatches
          );
        });

    filtered.sort(
      (first, second) => {
        if (sortFilter === "newest") {
          return Number(
            second.submittedAt || 0
          ) - Number(
            first.submittedAt || 0
          );
        }

        if (sortFilter === "oldest") {
          return Number(
            first.submittedAt || 0
          ) - Number(
            second.submittedAt || 0
          );
        }

        if (
          sortFilter ===
          "followersHigh"
        ) {
          return Number(
            second.followerCount || 0
          ) - Number(
            first.followerCount || 0
          );
        }

        if (
          sortFilter ===
          "followersLow"
        ) {
          return Number(
            first.followerCount || 0
          ) - Number(
            second.followerCount || 0
          );
        }

        if (sortFilter === "rankHigh") {
          return (
            getRankValue(
              second.peakRank
            ) -
            getRankValue(
              first.peakRank
            )
          );
        }

        if (sortFilter === "rankLow") {
          return (
            getRankValue(
              first.peakRank
            ) -
            getRankValue(
              second.peakRank
            )
          );
        }

        if (sortFilter === "role") {
          return String(
            first.mainRole || ""
          ).localeCompare(
            String(
              second.mainRole || ""
            )
          );
        }

        if (sortFilter === "region") {
          return String(
            first.region || ""
          ).localeCompare(
            String(
              second.region || ""
            )
          );
        }

        return 0;
      }
    );

    return filtered;
  }

  function createApplicationCard(application) {
    const uid =
      application.uid;

    const status =
      application.status ||
      "pending";

    const name =
      clean(
        application.displayName,
        "Player"
      );

    const initials =
      createInitials(name);

    const profileImage =
      safeImageUrl(
        application.profileImage
      );

    const avatar =
      profileImage
        ? `
          <img
            class="nexus-application-avatar"
            src="${escapeHtml(profileImage)}"
            alt="${escapeHtml(name)}"
          >
        `
        : `
          <div class="nexus-application-avatar-fallback">
            ${escapeHtml(initials)}
          </div>
        `;

    const applicantNotes =
      displayValue(
        application.adminNotes ||
        application.notes ||
        "None"
      );

    const internalNotes =
      application.internalAdminNotes ||
      "";

    const submitted =
      formatSubmittedAt(
        application.submittedAt
      );

    return `
      <article
        class="nexus-application-card"
        data-application-card="${escapeHtml(uid)}"
      >
        <div class="application-card-identity">
          <div class="application-avatar-column">
            ${avatar}

            <span>
              ${escapeHtml(
                application.rgId ||
                "NO RG ID"
              )}
            </span>
          </div>

          <div class="application-identity-copy">
            <div class="application-name-row">
              <div>
                <h3>
                  ${escapeHtml(name)}
                </h3>

                <p>
                  IGN:
                  <strong>
                    ${escapeHtml(
                      application.rivalsIgn ||
                      "N/A"
                    )}
                  </strong>
                </p>
              </div>

              <span
                class="application-status-badge status-${escapeHtml(status)}"
              >
                ${escapeHtml(status)}
              </span>
            </div>

            <div class="application-tags">

              ${createTag(
                application.peakRank ||
                "No Rank"
              )}

              ${createTag(
                application.mainRole ||
                "No Role"
              )}

              ${createTag(
                application.region ||
                "No Region"
              )}

              ${createTag(
                application.platform ||
                "No Platform"
              )}

              ${createTag(
                `Stream: ${
                  application.willStream ||
                  "N/A"
                }`
              )}

              ${createTag(
                `Sub: ${
                  application.wantsSub ||
                  "N/A"
                }`
              )}

            </div>
          </div>
        </div>

        <div class="application-details-grid">

          ${createDetail(
            "Discord",
            application.discordUsername ||
            "N/A"
          )}

          ${createDetail(
            "Followers",
            formatNumber(
              application.followerCount ||
              0
            )
          )}

          ${createDetail(
            "Main Heroes",
            displayValue(
              application.mainHeroes ||
              "N/A"
            )
          )}

          ${createDetail(
            "Availability",
            displayValue(
              application.availability ||
              "N/A"
            )
          )}

          ${createDetail(
            "Submitted",
            submitted
          )}

          ${createDetail(
            "Tournament",
            moduleState.tournamentId
          )}

        </div>

        <div class="application-applicant-notes">
          <span>Applicant Notes</span>

          <p>
            ${escapeHtml(applicantNotes)}
          </p>
        </div>

        <div class="application-action-row">

          <a
            class="action-button"
            href="player.html?id=${encodeURIComponent(uid)}"
            target="_blank"
            rel="noopener noreferrer"
          >
            <i class="fa-solid fa-user"></i>
            View Profile
          </a>

          <div class="application-status-actions">

            ${createStatusButton(
              uid,
              "accepted",
              "Accept",
              "fa-circle-check",
              status
            )}

            ${createStatusButton(
              uid,
              "waitlist",
              "Waitlist",
              "fa-list-check",
              status
            )}

            ${createStatusButton(
              uid,
              "declined",
              "Decline",
              "fa-circle-xmark",
              status
            )}

            ${createStatusButton(
              uid,
              "pending",
              "Reset Pending",
              "fa-arrow-rotate-left",
              status
            )}

          </div>
        </div>

        <div class="application-note-editor">
          <label>
            Internal Admin Notes
          </label>

          <textarea
            data-admin-note
            placeholder="Visible only to Nexus staff"
          >${escapeHtml(internalNotes)}</textarea>

          <div>
            <button
              class="action-button"
              type="button"
              data-application-action="save-note"
              data-uid="${escapeHtml(uid)}"
            >
              <i class="fa-solid fa-floppy-disk"></i>
              Save Admin Note
            </button>
          </div>
        </div>
      </article>
    `;
  }

  async function updateApplicationStatus(
    uid,
    status,
    button
  ) {
    if (
      ![
        "pending",
        "accepted",
        "waitlist",
        "declined"
      ].includes(status)
    ) {
      context.showToast(
        "Invalid application status."
      );

      return;
    }

    await runButtonAction(
      button,
      "Saving...",
      async () => {
        await context.database
          .ref(
            `applications/${moduleState.tournamentId}/${uid}`
          )
          .update({
            status,
            updatedAt:
              firebase.database
                .ServerValue
                .TIMESTAMP,

            reviewedBy:
              context.currentUser?.uid ||
              null
          });

        context.showToast(
          `Application moved to ${status}.`
        );
      }
    );
  }

  async function saveApplicationNote(
    uid,
    button
  ) {
    const card =
      button.closest(
        "[data-application-card]"
      );

    const textarea =
      card?.querySelector(
        "[data-admin-note]"
      );

    if (!textarea) {
      context.showToast(
        "Admin note field could not be found."
      );

      return;
    }

    const note =
      textarea.value.trim();

    await runButtonAction(
      button,
      "Saving...",
      async () => {
        await context.database
          .ref(
            `applications/${moduleState.tournamentId}/${uid}`
          )
          .update({
            internalAdminNotes:
              note,

            updatedAt:
              firebase.database
                .ServerValue
                .TIMESTAMP,

            noteUpdatedBy:
              context.currentUser?.uid ||
              null
          });

        context.showToast(
          "Internal admin note saved."
        );
      }
    );
  }

  async function saveActiveTournament(
    button
  ) {
    const tournamentId =
      moduleState.tournamentId;

    if (!tournamentId) {
      context.showToast(
        "Select a tournament first."
      );

      return;
    }

    if (
      tournamentId ===
      moduleState.activeTournamentId
    ) {
      context.showToast(
        "This tournament is already active."
      );

      return;
    }

    const tournamentName =
      moduleState.tournament.name ||
      tournamentId;

    const confirmed =
      window.confirm(
        `Set ${tournamentName} as the active tournament?\n\n` +
        "This changes site/currentTournament for the public website and all connected admin modules."
      );

    if (!confirmed) return;

    await runButtonAction(
      button,
      "Switching...",
      async () => {
        await context.database
          .ref("site/currentTournament")
          .set(tournamentId);

        moduleState.activeTournamentId =
          tournamentId;

        renderTournamentOptions();
        renderTournamentSummary();

        context.showToast(
          `${tournamentName} is now active.`
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
        "Applications action failed:",
        error
      );

      const message =
        context.isPermissionDenied(error)
          ? "Firebase denied this Applications action."
          : error.message ||
            "The Applications action failed.";

      context.showToast(message);

      window.alert(
        `Application Review Error\n\n${message}`
      );
    } finally {
      button.disabled = false;
      button.innerHTML = originalHtml;
    }
  }

  function getStatusCount(status) {
    return moduleState.applications
      .filter(application => {
        return (
          application.status ||
          "pending"
        ) === status;
      })
      .length;
  }

  function matchesSearch(
    application,
    search
  ) {
    const searchableText = [
      application.rgId,
      application.displayName,
      application.rivalsIgn,
      application.discordUsername,
      application.peakRank,
      application.region,
      application.platform,
      application.mainRole,
      displayValue(
        application.mainHeroes
      )
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return searchableText.includes(search);
  }

  function getRankValue(rank) {
    const values = {
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

    return values[rank] || 0;
  }

  function createSummaryCard(
    id,
    label,
    icon
  ) {
    return `
      <article class="application-summary-card">
        <span>
          <i class="fa-solid ${escapeHtml(icon)}"></i>
          ${escapeHtml(label)}
        </span>

        <strong id="${escapeHtml(id)}">
          0
        </strong>
      </article>
    `;
  }

  function createTag(value) {
    return `
      <span class="application-tag">
        ${escapeHtml(value)}
      </span>
    `;
  }

  function createDetail(
    label,
    value
  ) {
    return `
      <div class="application-detail">
        <span>${escapeHtml(label)}</span>
        <strong>${escapeHtml(value)}</strong>
      </div>
    `;
  }

  function createStatusButton(
    uid,
    status,
    label,
    icon,
    currentStatus
  ) {
    const selected =
      status === currentStatus;

    return `
      <button
        class="application-status-button status-action-${escapeHtml(status)}"
        type="button"
        data-application-action="status"
        data-uid="${escapeHtml(uid)}"
        data-status="${escapeHtml(status)}"
        ${selected ? "disabled" : ""}
      >
        <i class="fa-solid ${escapeHtml(icon)}"></i>
        ${selected ? "Current" : escapeHtml(label)}
      </button>
    `;
  }

  function createLoadingState() {
    return `
      <div class="applications-empty">
        <i class="fa-solid fa-spinner fa-spin"></i>

        <strong>
          Loading applications
        </strong>

        <span>
          Connecting to Firebase...
        </span>
      </div>
    `;
  }

  function createErrorState(message) {
    return `
      <div class="applications-empty applications-error">
        <i class="fa-solid fa-triangle-exclamation"></i>

        <strong>
          Applications unavailable
        </strong>

        <span>
          ${escapeHtml(message)}
        </span>
      </div>
    `;
  }

  function setApplicationsList(html) {
    const list =
      document.getElementById(
        "applicationsList"
      );

    if (list) {
      list.innerHTML = html;
    }
  }

  function setText(id, value) {
    const element =
      document.getElementById(id);

    if (element) {
      element.textContent =
        String(value ?? "");
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

  function displayValue(value) {
    if (Array.isArray(value)) {
      return value.join(", ");
    }

    if (
      value &&
      typeof value === "object"
    ) {
      return Object.values(value)
        .filter(Boolean)
        .join(", ");
    }

    return String(value || "");
  }

  function formatNumber(value) {
    return new Intl.NumberFormat(
      "en-US"
    ).format(
      Number(value || 0)
    );
  }

  function formatSubmittedAt(value) {
    if (!value) {
      return "Unknown";
    }

    const numericValue =
      Number(value);

    const date =
      Number.isFinite(numericValue) &&
      numericValue > 0
        ? new Date(numericValue)
        : new Date(value);

    if (
      Number.isNaN(date.getTime())
    ) {
      return "Unknown";
    }

    return new Intl.DateTimeFormat(
      "en-US",
      {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit"
      }
    ).format(date);
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
      String(value || "").trim();

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

      if (
        parsed.protocol === "https:" ||
        parsed.protocol === "http:"
      ) {
        return parsed.href;
      }
    } catch (error) {
      return "";
    }

    return "";
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

  window.NexusApplications = {
    render,
    cleanup
  };
})();