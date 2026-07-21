(() => {
  "use strict";

  const EVENT_TIME_ZONE =
    "America/Chicago";

  const EVENT_TIME_FORMATTER =
    new Intl.DateTimeFormat(
      "en-US",
      {
        timeZone:
          EVENT_TIME_ZONE,

        year:
          "numeric",

        month:
          "2-digit",

        day:
          "2-digit",

        hour:
          "2-digit",

        minute:
          "2-digit",

        second:
          "2-digit",

        hourCycle:
          "h23"
      }
    );

  const FORMAT_OPTIONS = {
    "8_single_elim": {
      label: "8 Team Single Elimination",
      teamCount: 8
    },

    "16_single_elim": {
      label: "16 Team Single Elimination",
      teamCount: 16
    }
  };

  const PHASE_OPTIONS = {
    draft: "Draft",
    applications_open: "Applications Open",
    applications_closed: "Applications Closed",
    teams_building: "Teams Building",
    teams_published: "Teams Published",
    check_in: "Check-In",
    live: "Live Tournament",
    completed: "Completed",
    archived: "Archived"
  };

  const moduleState = {
    activeTournamentId: "",
    selectedTournamentId: "",
    tournaments: {},
    applications: {},
    teamsRecord: {},
    dirty: false,
    listeners: [],
    tournamentListeners: []
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
          <h2>Event Control</h2>

          <p>
            Create tournaments, choose the active event, control registration,
            configure capacity and maintain the public event information.
          </p>
        </div>

        <div class="module-actions">
          <button
            id="eventCreateToggleButton"
            class="action-button"
            type="button"
          >
            <i class="fa-solid fa-plus"></i>
            New Tournament
          </button>

          <button
            id="eventRefreshButton"
            class="action-button"
            type="button"
          >
            <i class="fa-solid fa-rotate"></i>
            Refresh
          </button>
        </div>
      </section>

      <section
        id="eventCreatePanel"
        class="event-create-panel nexus-panel"
        hidden
      >
        <header class="panel-header">
          <h3>Create Tournament</h3>
          <span>New permanent event record</span>
        </header>

        <div class="event-panel-content">
          <div class="event-form-grid event-create-grid">
            ${fieldMarkup(
              "newEventId",
              "Tournament ID",
              "text",
              "open2",
              "Lowercase letters, numbers, hyphens and underscores only."
            )}

            ${fieldMarkup(
              "newEventName",
              "Event Name",
              "text",
              "Rivals Gauntlet Open #2"
            )}

            <div class="event-field">
              <label for="newEventFormat">Format</label>

              <select
                id="newEventFormat"
                class="event-control-select"
              >
                ${formatOptionsMarkup("8_single_elim")}
              </select>
            </div>

            ${fieldMarkup(
              "newEventPlayersPerTeam",
              "Players Per Team",
              "number",
              "6"
            )}

        ${fieldMarkup(
  "newEventMaxPlayers",
  "Application Capacity",
  "number",
  "Leave blank for unlimited",
  "Optional. Leave blank to accept unlimited player applications."
)}

           ${dateTimePickerMarkup(
  "newEvent",
 "Tournament Start — Central Time"
)}
          </div>

          <label class="event-checkbox-row">
            <input
              id="newEventSetActive"
              type="checkbox"
            >

            <span>
              Set this tournament as the active website event after creation
            </span>
          </label>

          <div class="event-button-row">
            <button
              id="createTournamentButton"
              class="action-button action-button-primary"
              type="button"
            >
              <i class="fa-solid fa-plus"></i>
              Create Tournament
            </button>

            <button
              id="cancelCreateTournamentButton"
              class="action-button"
              type="button"
            >
              Cancel
            </button>
          </div>
        </div>
      </section>

      <article class="nexus-panel">
        <header class="panel-header">
          <h3>Tournament Context</h3>
          <span id="eventActiveContextBadge">
            Loading
          </span>
        </header>

        <div class="event-panel-content">
          <div class="event-context-row">
            <div class="event-field">
              <label for="eventTournamentSelect">
                Tournament to Manage
              </label>

              <select
                id="eventTournamentSelect"
                class="event-control-select"
              >
                <option value="">
                  Loading tournaments...
                </option>
              </select>
            </div>

            <button
              id="setActiveTournamentButton"
              class="action-button action-button-primary"
              type="button"
            >
              <i class="fa-solid fa-bullseye"></i>
              Set Active Tournament
            </button>
          </div>

          <div class="event-context-grid">
            ${metricMarkup(
              "eventContextName",
              "Tournament",
              "Loading..."
            )}

            ${metricMarkup(
              "eventContextFormat",
              "Format",
              "—"
            )}

            ${metricMarkup(
              "eventContextCapacity",
              "Roster Capacity",
              "0"
            )}

            ${metricMarkup(
              "eventContextApplications",
              "Applications",
              "0"
            )}
          </div>
        </div>
      </article>

      <section class="event-summary-grid">
        ${summaryMarkup(
          "eventPendingApplications",
          "Pending",
          "0",
          "fa-file-circle-question"
        )}

        ${summaryMarkup(
          "eventAcceptedApplications",
          "Accepted",
          "0",
          "fa-user-check"
        )}

        ${summaryMarkup(
          "eventAssignedTeams",
          "Teams Built",
          "0",
          "fa-people-group"
        )}

        ${summaryMarkup(
          "eventRegistrationMetric",
          "Registration",
          "Closed",
          "fa-door-closed"
        )}

        ${summaryMarkup(
          "eventPhaseMetric",
          "Event Phase",
          "Draft",
          "fa-flag"
        )}
      </section>

      <section class="event-workspace">
        <article class="nexus-panel">
          <header class="panel-header">
            <h3>Event Configuration</h3>

            <span id="eventSaveState">
              Synced with Firebase
            </span>
          </header>

          <div class="event-panel-content">
            <div class="event-form-grid">
              ${fieldMarkup(
                "eventNameInput",
                "Event Name",
                "text",
                "Rivals Gauntlet Open #1"
              )}

              <div class="event-field">
                <label for="eventFormatSelect">
                  Tournament Format
                </label>

                <select
                  id="eventFormatSelect"
                  class="event-control-select"
                >
                  ${formatOptionsMarkup("8_single_elim")}
                </select>
              </div>

              ${fieldMarkup(
                "eventPlayersPerTeamInput",
                "Players Per Team",
                "number",
                "6"
              )}

             ${fieldMarkup(
  "eventMaxPlayersInput",
  "Application Capacity",
  "number",
  "Leave blank for unlimited",
  "Optional. Leave blank to accept unlimited player applications."
)}

            ${dateTimePickerMarkup(
  "event",
"Tournament Start — Central Time"
)}

              <div class="event-field">
                <label for="eventRegistrationStatusSelect">
                  Registration Status
                </label>

                <select
                  id="eventRegistrationStatusSelect"
                  class="event-control-select"
                >
                  <option value="OPEN">
                    OPEN
                  </option>

                  <option value="CLOSED">
                    CLOSED
                  </option>

                  <option value="FULL">
                    FULL
                  </option>
                </select>
              </div>

              <div class="event-field">
                <label for="eventPhaseSelect">
                  Event Phase
                </label>

                <select
                  id="eventPhaseSelect"
                  class="event-control-select"
                >
                  ${phaseOptionsMarkup("draft")}
                </select>
              </div>

              ${fieldMarkup(
                "eventPrizePoolInput",
                "Current Prize Pool",
                "text",
                "$60"
              )}

              ${fieldMarkup(
                "eventStartingPrizePoolInput",
                "Starting Prize Pool",
                "text",
                "$60"
              )}

              ${fieldMarkup(
                "eventDonationGoalInput",
                "Donation Goal",
                "text",
                "$250"
              )}
            </div>

            <div class="event-calculated-grid">
              ${calculatedMarkup(
                "eventCalculatedTeamCount",
                "Team Count",
                "8"
              )}

              ${calculatedMarkup(
                "eventCalculatedRosterCapacity",
                "Starting Roster Capacity",
                "48"
              )}

              ${calculatedMarkup(
                "eventTeamsPublishedValue",
                "Teams Published",
                "No"
              )}

              ${calculatedMarkup(
                "eventActiveValue",
                "Website Active Event",
                "No"
              )}
            </div>

            <div class="event-button-row">
              <button
                id="saveTournamentButton"
                class="action-button action-button-primary"
                type="button"
              >
                <i class="fa-solid fa-floppy-disk"></i>
                Save Tournament
              </button>

              <button
                id="openApplicationsButton"
                class="action-button"
                type="button"
              >
                <i class="fa-solid fa-door-open"></i>
                Open Applications
              </button>

              <button
                id="closeApplicationsButton"
                class="action-button"
                type="button"
              >
                <i class="fa-solid fa-door-closed"></i>
                Close Applications
              </button>
            </div>
          </div>
        </article>

        <aside class="event-side-stack">
          <article class="nexus-panel">
            <header class="panel-header">
              <h3>Lifecycle Snapshot</h3>
              <span>Connected systems</span>
            </header>

            <div class="event-panel-content">
              <div
                id="eventLifecycleList"
                class="event-lifecycle-list"
              >
                ${lifecycleRow(
                  "Applications",
                  "Loading",
                  "neutral"
                )}

                ${lifecycleRow(
                  "Teams",
                  "Loading",
                  "neutral"
                )}

                ${lifecycleRow(
                  "Check-In",
                  "Loading",
                  "neutral"
                )}

                ${lifecycleRow(
                  "Public Website",
                  "Loading",
                  "neutral"
                )}
              </div>
            </div>
          </article>

          <article
            class="nexus-panel event-compatibility-panel"
          >
            <header class="panel-header">
              <h3>Website Compatibility</h3>
              <span>Protected mirror</span>
            </header>

            <div class="event-panel-content">
              <div class="event-protection-note">
                <i class="fa-solid fa-shield-halved"></i>

                <div>
                  <strong>
                    Live Operations is protected.
                  </strong>

                  <p>
                    Event Control mirrors only event name,
                    registration, date, format and prize
                    settings into <code>site</code>. It never
                    changes Current Match, live status,
                    scores, winners or Up Next.
                  </p>
                </div>
              </div>
            </div>
          </article>

          <article
            class="nexus-panel event-danger-panel"
          >
            <header class="panel-header">
              <h3>Archive Tournament</h3>
              <span>Protected action</span>
            </header>

            <div class="event-panel-content">
              <p>
                Archiving closes registration and removes
                the event from normal active workflows.
                The tournament record and history remain
                in Firebase.
              </p>

              <button
                id="archiveTournamentButton"
                class="event-danger-button"
                type="button"
              >
                <i class="fa-solid fa-box-archive"></i>
                Archive Selected Tournament
              </button>
            </div>
          </article>
        </aside>
      </section>
    `;

    bindEvents();
    void initialize();
  }

  function cleanup() {
    detachAllListeners();

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
    moduleState.selectedTournamentId = "";
    moduleState.tournaments = {};
    moduleState.applications = {};
    moduleState.teamsRecord = {};
    moduleState.dirty = false;
    moduleState.listeners = [];
    moduleState.tournamentListeners = [];
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
      const activeTournamentId =
        await context.getCurrentTournamentId();

      moduleState.activeTournamentId =
        activeTournamentId ||
        "open1";

      listen(
        context.database.ref(
          "site/currentTournament"
        ),

        snapshot => {
          moduleState.activeTournamentId =
            snapshot.val() ||
            "open1";

          renderTournamentOptions();
          renderAll();
        },

        "active tournament"
      );

      listen(
        context.database.ref(
          "tournaments"
        ),

        snapshot => {
          moduleState.tournaments =
            snapshot.val() ||
            {};

          if (
            !moduleState.selectedTournamentId
          ) {
            moduleState.selectedTournamentId =
              moduleState.tournaments[
                moduleState.activeTournamentId
              ]
                ? moduleState.activeTournamentId
                : Object.keys(
                    moduleState.tournaments
                  )[0] ||
                  "";

            attachSelectedTournamentListeners();
          }

          if (
            moduleState.selectedTournamentId &&
            !moduleState.tournaments[
              moduleState.selectedTournamentId
            ]
          ) {
            moduleState.selectedTournamentId =
              moduleState.tournaments[
                moduleState.activeTournamentId
              ]
                ? moduleState.activeTournamentId
                : Object.keys(
                    moduleState.tournaments
                  )[0] ||
                  "";

            attachSelectedTournamentListeners();
          }

          renderTournamentOptions();

          if (!moduleState.dirty) {
            populateForm();
          }

          renderAll();
        },

        "tournaments"
      );
    } catch (error) {
      console.error(
        "Event Control initialization failed:",
        error
      );

      showModuleError(
        context.isPermissionDenied(error)
          ? "Firebase denied access to tournament configuration."
          : error.message ||
            "Event Control could not be loaded."
      );
    }
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
            : `${capitalize(label)} could not be loaded.`
        );
      }
    );

    moduleState.listeners.push({
      reference,
      handler
    });
  }

  function listenSelected(
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
            : `${capitalize(label)} could not be loaded.`
        );
      }
    );

    moduleState.tournamentListeners.push({
      reference,
      handler
    });
  }

  function detachAllListeners() {
    moduleState.listeners.forEach(
      ({
        reference,
        handler
      }) => {
        reference.off(
          "value",
          handler
        );
      }
    );

    moduleState.tournamentListeners.forEach(
      ({
        reference,
        handler
      }) => {
        reference.off(
          "value",
          handler
        );
      }
    );

    moduleState.listeners = [];
    moduleState.tournamentListeners = [];
  }

  function detachSelectedTournamentListeners() {
    moduleState.tournamentListeners.forEach(
      ({
        reference,
        handler
      }) => {
        reference.off(
          "value",
          handler
        );
      }
    );

    moduleState.tournamentListeners = [];
  }

  function attachSelectedTournamentListeners() {
    detachSelectedTournamentListeners();

    moduleState.applications = {};
    moduleState.teamsRecord = {};

    const tournamentId =
      moduleState.selectedTournamentId;

    if (!tournamentId) {
      renderAll();
      return;
    }

    listenSelected(
      context.database.ref(
        `applications/${tournamentId}`
      ),

      snapshot => {
        moduleState.applications =
          snapshot.val() ||
          {};

        renderAll();
      },

      "applications"
    );

    listenSelected(
      context.database.ref(
        `teams/${tournamentId}`
      ),

      snapshot => {
        moduleState.teamsRecord =
          snapshot.val() ||
          {};

        renderAll();
      },

      "teams"
    );
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

    switch (button.id) {
      case "eventCreateToggleButton":
        toggleCreatePanel(true);
        break;

      case "cancelCreateTournamentButton":
        toggleCreatePanel(false);
        break;

      case "createTournamentButton":
        void createTournament(button);
        break;

      case "eventRefreshButton":
        void refreshModule(button);
        break;

      case "saveTournamentButton":
        void saveTournament(button);
        break;

      case "setActiveTournamentButton":
        void setActiveTournament(button);
        break;

      case "openApplicationsButton":
        void setRegistrationState(
          "OPEN",
          button
        );
        break;

      case "closeApplicationsButton":
        void setRegistrationState(
          "CLOSED",
          button
        );
        break;

      case "archiveTournamentButton":
        void archiveTournament(button);
        break;

      default:
        break;
    }
  }

  function handleChange(event) {
    const target =
      event.target;

    if (
      target.id ===
      "eventTournamentSelect"
    ) {
      const nextId =
        target.value;

      if (
        moduleState.dirty &&
        !window.confirm(
          "Discard the unsaved Event Control changes and switch tournaments?"
        )
      ) {
        target.value =
          moduleState.selectedTournamentId;

        return;
      }

      moduleState.selectedTournamentId =
        nextId;

      moduleState.dirty =
        false;

      attachSelectedTournamentListeners();
      populateForm();
      renderAll();

      return;
    }

    if (
  target.matches(
    "#eventFormatSelect, #eventRegistrationStatusSelect, #eventPhaseSelect, #eventStartDate, #eventStartHour, #eventStartMinute, #eventStartPeriod"
  )
) {
      moduleState.dirty =
        true;

      setText(
        "eventSaveState",
        "Unsaved changes"
      );

      if (
        target.id ===
        "eventRegistrationStatusSelect"
      ) {
        const phaseSelect =
          document.getElementById(
            "eventPhaseSelect"
          );

        if (phaseSelect) {
          if (
            target.value ===
            "OPEN"
          ) {
            phaseSelect.value =
              "applications_open";
          } else if (
            phaseSelect.value ===
            "applications_open"
          ) {
            phaseSelect.value =
              "applications_closed";
          }
        }
      }

      updateCalculatedValues();
    }

    if (
      target.id ===
      "newEventFormat"
    ) {
      updateNewEventDefaults();
    }
  }

  function handleInput(event) {
    if (
      event.target.closest(
        "#eventCreatePanel"
      )
    ) {
      return;
    }

    if (
      event.target.matches(
       "#eventNameInput, #eventFormatSelect, #eventPlayersPerTeamInput, #eventMaxPlayersInput, #eventStartDate, #eventStartHour, #eventStartMinute, #eventStartPeriod, #eventRegistrationStatusSelect, #eventPhaseSelect, #eventPrizePoolInput, #eventStartingPrizePoolInput, #eventDonationGoalInput"
      )
    ) {
      moduleState.dirty =
        true;

      setText(
        "eventSaveState",
        "Unsaved changes"
      );

      updateCalculatedValues();
    }
  }

  async function refreshModule(
    button
  ) {
    await buttonAction(
      button,
      "Refreshing...",

      async () => {
        moduleState.dirty =
          false;

        const snapshot =
          await context.database
            .ref("tournaments")
            .once("value");

        moduleState.tournaments =
          snapshot.val() ||
          {};

        renderTournamentOptions();
        populateForm();
        renderAll();

        context.showToast(
          "Event Control refreshed."
        );
      }
    );
  }

  async function createTournament(
    button
  ) {
    const tournamentId =
      normalizeTournamentId(
        valueOf(
          "newEventId"
        )
      );

    const name =
      valueOf(
        "newEventName"
      );

    const formatType =
      valueOf(
        "newEventFormat"
      );

    const playersPerTeam =
      numberValue(
        "newEventPlayersPerTeam",
        6
      );

    const maxPlayers =
  optionalNumberValue(
    "newEventMaxPlayers"
  );

    const countdownDate =
  readFriendlyDateTime(
    "newEvent"
  );

if (!countdownDate) {
  context.showToast(
    "Choose a tournament start date and time."
  );

  return;
}

    const setActive =
      Boolean(
        document.getElementById(
          "newEventSetActive"
        )?.checked
      );

    if (!tournamentId) {
      context.showToast(
        "Enter a valid tournament ID using letters, numbers, hyphens or underscores."
      );

      return;
    }

    if (!name) {
      context.showToast(
        "Enter the tournament name."
      );

      return;
    }

    if (
      !FORMAT_OPTIONS[
        formatType
      ]
    ) {
      context.showToast(
        "Select a supported tournament format."
      );

      return;
    }

    const teamCount =
      FORMAT_OPTIONS[
        formatType
      ].teamCount;

    const rosterCapacity =
      teamCount *
      playersPerTeam;

    if (
      playersPerTeam < 1 ||
      playersPerTeam > 12
    ) {
      context.showToast(
        "Players per team must be between 1 and 12."
      );

      return;
    }

    if (
  maxPlayers !== null &&
  maxPlayers < rosterCapacity
) {
  context.showToast(
    `Application capacity must be at least ${rosterCapacity}, or left blank for unlimited.`
  );

  return;
}

    await buttonAction(
      button,
      "Creating...",

      async () => {
        const existing =
          await context.database
            .ref(
              `tournaments/${tournamentId}`
            )
            .once("value");

        if (
          existing.exists()
        ) {
          throw new Error(
            `Tournament ID ${tournamentId} already exists.`
          );
        }

        const timestamp =
          firebase.database
            .ServerValue
            .TIMESTAMP;

        const tournamentRecord = {
          name,
          formatType,
          teamCount,
          playersPerTeam,
          maxPlayers,

          registrationStatus:
            "CLOSED",

          applicationsOpen:
            false,

          countdownDate,

          prizePool:
            "",

          startingPrizePool:
            "",

          donationGoal:
            "$250",

          status:
            "draft",

          teamsPublished:
            false,

          createdAt:
            timestamp,

          createdBy:
            context.currentUser?.uid ||
            null,

          updatedAt:
            timestamp,

          updatedBy:
            context.currentUser?.uid ||
            null
        };

        const updates = {
          [`tournaments/${tournamentId}`]:
            tournamentRecord
        };

        if (setActive) {
          Object.assign(
            updates,

            activeSiteUpdates(
              tournamentId,
              tournamentRecord
            )
          );
        }

        await context.database
          .ref()
          .update(updates);

        moduleState.selectedTournamentId =
          tournamentId;

        moduleState.activeTournamentId =
          setActive
            ? tournamentId
            : moduleState.activeTournamentId;

        moduleState.dirty =
          false;

        toggleCreatePanel(false);
        clearCreateForm();
        attachSelectedTournamentListeners();

        context.showToast(
          setActive
            ? "Tournament created and set active."
            : "Tournament created."
        );
      }
    );
  }

  async function saveTournament(
    button
  ) {
    const tournamentId =
      moduleState.selectedTournamentId;

    if (!tournamentId) {
      context.showToast(
        "Select a tournament first."
      );

      return;
    }

    const current =
      selectedTournament();

    const form =
      readEventForm();

    const validationError =
      validateEventForm(form);

    if (validationError) {
      context.showToast(
        validationError
      );

      return;
    }

    await buttonAction(
      button,
      "Saving...",

      async () => {
        const timestamp =
          firebase.database
            .ServerValue
            .TIMESTAMP;

        const record = {
          ...current,
          ...form,

          updatedAt:
            timestamp,

          updatedBy:
            context.currentUser?.uid ||
            null
        };

        if (
          !record.createdAt
        ) {
          record.createdAt =
            timestamp;
        }

        const updates = {
          [`tournaments/${tournamentId}`]:
            record
        };

        if (
          tournamentId ===
          moduleState.activeTournamentId
        ) {
          Object.assign(
            updates,

            activeSiteUpdates(
              tournamentId,
              record
            )
          );
        }

        await context.database
          .ref()
          .update(updates);

        moduleState.dirty =
          false;

        setText(
          "eventSaveState",
          "Saved to Firebase"
        );

        context.showToast(
          "Tournament settings saved."
        );
      }
    );
  }

  async function setActiveTournament(
    button
  ) {
    const tournamentId =
      moduleState.selectedTournamentId;

    const tournament =
      selectedTournament();

    if (
      !tournamentId ||
      !tournament.name
    ) {
      context.showToast(
        "Select a valid tournament first."
      );

      return;
    }

    if (
      moduleState.dirty
    ) {
      context.showToast(
        "Save the tournament before making it active."
      );

      return;
    }

    const confirmed =
      window.confirm(
        `Set ${tournament.name} as the active Rivals Gauntlet tournament?\n\n` +
        "Public pages, Applications, Team Builder, Check-In and Reports will use this tournament ID."
      );

    if (!confirmed) {
      return;
    }

    await buttonAction(
      button,
      "Activating...",

      async () => {
        await context.database
          .ref()
          .update(
            activeSiteUpdates(
              tournamentId,
              tournament
            )
          );

        moduleState.activeTournamentId =
          tournamentId;

        renderTournamentOptions();
        renderAll();

        context.showToast(
          `${tournament.name} is now the active tournament.`
        );
      }
    );
  }

  async function setRegistrationState(
    status,
    button
  ) {
    const tournamentId =
      moduleState.selectedTournamentId;

    if (!tournamentId) {
      context.showToast(
        "Select a tournament first."
      );

      return;
    }

    const open =
      status ===
      "OPEN";

    const current =
      selectedTournament();

    await buttonAction(
      button,

      open
        ? "Opening..."
        : "Closing...",

      async () => {
        const timestamp =
          firebase.database
            .ServerValue
            .TIMESTAMP;

        const phase =
          open
            ? "applications_open"
            : current.teamsPublished
              ? "teams_published"
              : "applications_closed";

        const updates = {
          [`tournaments/${tournamentId}/registrationStatus`]:
            status,

          [`tournaments/${tournamentId}/applicationsOpen`]:
            open,

          [`tournaments/${tournamentId}/status`]:
            phase,

          [`tournaments/${tournamentId}/updatedAt`]:
            timestamp,

          [`tournaments/${tournamentId}/updatedBy`]:
            context.currentUser?.uid ||
            null
        };

        if (
          tournamentId ===
          moduleState.activeTournamentId
        ) {
          updates[
            "site/registrationStatus"
          ] = status;
        }

        await context.database
          .ref()
          .update(updates);

        moduleState.dirty =
          false;

        context.showToast(
          open
            ? "Tournament applications opened."
            : "Tournament applications closed."
        );
      }
    );
  }

  async function archiveTournament(
    button
  ) {
    const tournamentId =
      moduleState.selectedTournamentId;

    const tournament =
      selectedTournament();

    if (
      !tournamentId ||
      !tournament.name
    ) {
      context.showToast(
        "Select a valid tournament first."
      );

      return;
    }

    if (
      tournamentId ===
      moduleState.activeTournamentId
    ) {
      context.showToast(
        "Set another tournament active before archiving this one."
      );

      return;
    }

    const confirmed =
      window.confirm(
        `Archive ${tournament.name}?\n\n` +
        "Applications will close, but all tournament records and history will remain saved."
      );

    if (!confirmed) {
      return;
    }

    await buttonAction(
      button,
      "Archiving...",

      async () => {
        const timestamp =
          firebase.database
            .ServerValue
            .TIMESTAMP;

        await context.database
          .ref(
            `tournaments/${tournamentId}`
          )
          .update({
            status:
              "archived",

            registrationStatus:
              "CLOSED",

            applicationsOpen:
              false,

            archivedAt:
              timestamp,

            archivedBy:
              context.currentUser?.uid ||
              null,

            updatedAt:
              timestamp,

            updatedBy:
              context.currentUser?.uid ||
              null
          });

        moduleState.dirty =
          false;

        context.showToast(
          "Tournament archived."
        );
      }
    );
  }

  function activeSiteUpdates(
    tournamentId,
    tournament
  ) {
    return {
      "site/currentTournament":
        tournamentId,

      "site/eventName":
        tournament.name ||
        "",

      "site/registrationStatus":
        tournament.registrationStatus ||
        "CLOSED",

      "site/countdownDate":
        tournament.countdownDate ||
        "",

      "site/formatType":
        tournament.formatType ||
        "8_single_elim",

      "site/prizePool":
        tournament.prizePool ||
        "",

      "site/startingPrizePool":
        tournament.startingPrizePool ||
        "",

      "site/donationGoal":
        tournament.donationGoal ||
        "$250"
    };
  }

  function readEventForm() {
    const formatType =
      valueOf(
        "eventFormatSelect"
      );

    const playersPerTeam =
      numberValue(
        "eventPlayersPerTeamInput",
        6
      );

    const teamCount =
      FORMAT_OPTIONS[
        formatType
      ]?.teamCount ||
      8;

    const registrationStatus =
      valueOf(
        "eventRegistrationStatusSelect"
      );

    return {
      name:
        valueOf(
          "eventNameInput"
        ),

      formatType,
      teamCount,
      playersPerTeam,

      maxPlayers:
  optionalNumberValue(
    "eventMaxPlayersInput"
  ),

      countdownDate:
  readFriendlyDateTime(
    "event"
  ),

      registrationStatus,

      applicationsOpen:
        registrationStatus ===
        "OPEN",

      status:
        valueOf(
          "eventPhaseSelect"
        ) ||
        "draft",

      prizePool:
        valueOf(
          "eventPrizePoolInput"
        ),

      startingPrizePool:
        valueOf(
          "eventStartingPrizePoolInput"
        ),

      donationGoal:
        valueOf(
          "eventDonationGoalInput"
        )
    };
  }

  function validateEventForm(
    form
  ) {
    if (!form.name) {
      return "Enter the tournament name.";
    }

    if (
      !FORMAT_OPTIONS[
        form.formatType
      ]
    ) {
      return "Select a supported tournament format.";
    }

    if (
      form.playersPerTeam < 1 ||
      form.playersPerTeam > 12
    ) {
      return "Players per team must be between 1 and 12.";
    }

    const rosterCapacity =
      form.teamCount *
      form.playersPerTeam;

    if (
  form.maxPlayers !== null &&
  form.maxPlayers < rosterCapacity
) {
  return `Application capacity must be at least ${rosterCapacity}, or left blank for unlimited.`;
}

    if (
      !PHASE_OPTIONS[
        form.status
      ]
    ) {
      return "Select a valid event phase.";
    }

    return "";
  }

  function populateForm() {
    const tournament =
      selectedTournament();

    if (
      !moduleState.selectedTournamentId
    ) {
      clearEventForm();
      return;
    }

    setValue(
      "eventNameInput",
      tournament.name ||
      ""
    );

    setValue(
      "eventFormatSelect",
      tournament.formatType ||
      "8_single_elim"
    );

    setValue(
      "eventPlayersPerTeamInput",
      Number(
        tournament.playersPerTeam ||
        6
      )
    );

    setValue(
  "eventMaxPlayersInput",

  tournament.maxPlayers === null ||
  tournament.maxPlayers === undefined
    ? ""
    : tournament.maxPlayers
);

    populateFriendlyDateTime(
  "event",
  tournament.countdownDate
);

    setValue(
      "eventRegistrationStatusSelect",

      tournament.registrationStatus ||
      (
        tournament.applicationsOpen
          ? "OPEN"
          : "CLOSED"
      )
    );

    setValue(
      "eventPhaseSelect",
      tournament.status ||
      "draft"
    );

    setValue(
      "eventPrizePoolInput",
      tournament.prizePool ||
      ""
    );

    setValue(
      "eventStartingPrizePoolInput",
      tournament.startingPrizePool ||
      ""
    );

    setValue(
      "eventDonationGoalInput",
      tournament.donationGoal ||
      "$250"
    );

    moduleState.dirty =
      false;

    setText(
      "eventSaveState",
      "Synced with Firebase"
    );

    updateCalculatedValues();
  }

  function clearEventForm() {
    [
       "eventNameInput",

  "eventPrizePoolInput",

  "eventStartingPrizePoolInput",

  "eventDonationGoalInput"
    ].forEach(
      id => {
        setValue(
          id,
          ""
        );
      }
    );

clearFriendlyDateTime(
  "event"
);

    setValue(
      "eventFormatSelect",
      "8_single_elim"
    );

    setValue(
      "eventPlayersPerTeamInput",
      6
    );

    setValue(
  "eventMaxPlayersInput",
  ""
);

    setValue(
      "eventRegistrationStatusSelect",
      "CLOSED"
    );

    setValue(
      "eventPhaseSelect",
      "draft"
    );

    updateCalculatedValues();
  }

  function clearCreateForm() {
    setValue(
      "newEventId",
      ""
    );

    setValue(
      "newEventName",
      ""
    );

    setValue(
      "newEventFormat",
      "8_single_elim"
    );

    setValue(
      "newEventPlayersPerTeam",
      6
    );

    setValue(
  "newEventMaxPlayers",
  ""
);

    clearFriendlyDateTime(
  "newEvent"
);

    const setActive =
      document.getElementById(
        "newEventSetActive"
      );

    if (setActive) {
      setActive.checked =
        false;
    }
  }

 function updateNewEventDefaults() {
  const maxInput =
    document.getElementById(
      "newEventMaxPlayers"
    );

  if (maxInput) {
    maxInput.removeAttribute(
      "min"
    );

    maxInput.placeholder =
      "Leave blank for unlimited";
  }
}

  function updateCalculatedValues() {
    const formatType =
      valueOf(
        "eventFormatSelect"
      ) ||
      "8_single_elim";

    const teamCount =
      FORMAT_OPTIONS[
        formatType
      ]?.teamCount ||
      8;

    const playersPerTeam =
      Math.max(
        1,

        numberValue(
          "eventPlayersPerTeamInput",
          6
        )
      );

    const tournament =
      selectedTournament();

    setText(
      "eventCalculatedTeamCount",
      teamCount
    );

    setText(
      "eventCalculatedRosterCapacity",
      teamCount *
      playersPerTeam
    );

    setText(
      "eventTeamsPublishedValue",
      tournament.teamsPublished
        ? "Yes"
        : "No"
    );

    setText(
      "eventActiveValue",

      moduleState.selectedTournamentId ===
      moduleState.activeTournamentId
        ? "Yes"
        : "No"
    );
  }

  function renderAll() {
    renderTournamentOptions();
    renderContext();
    renderSummary();
    renderLifecycle();
    updateCalculatedValues();
  }

  function renderTournamentOptions() {
    const select =
      document.getElementById(
        "eventTournamentSelect"
      );

    if (!select) {
      return;
    }

    const currentValue =
      moduleState.selectedTournamentId;

    const entries =
      Object.entries(
        moduleState.tournaments
      )
      .sort(
        (
          [, first],
          [, second]
        ) => {
          const firstArchived =
            first?.status ===
            "archived"
              ? 1
              : 0;

          const secondArchived =
            second?.status ===
            "archived"
              ? 1
              : 0;

          if (
            firstArchived !==
            secondArchived
          ) {
            return (
              firstArchived -
              secondArchived
            );
          }

          return (
            Number(
              second?.createdAt ||
              0
            ) -
            Number(
              first?.createdAt ||
              0
            )
          );
        }
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
        .map(
          ([
            id,
            tournament
          ]) => {
            const active =
              id ===
              moduleState.activeTournamentId
                ? " — ACTIVE"
                : "";

            const archived =
              tournament?.status ===
              "archived"
                ? " — ARCHIVED"
                : "";

            return `
              <option value="${escapeHtml(id)}">
                ${escapeHtml(
                  tournament?.name ||
                  id
                )}
                (${escapeHtml(id)})${active}${archived}
              </option>
            `;
          }
        )
        .join("");

    select.value =
      currentValue;
  }

  function renderContext() {
    const tournament =
      selectedTournament();

    const format =
      FORMAT_OPTIONS[
        tournament.formatType ||
        "8_single_elim"
      ];

    const teamCount =
      tournament.teamCount ||
      format?.teamCount ||
      8;

    const playersPerTeam =
      tournament.playersPerTeam ||
      6;

    setText(
      "eventActiveContextBadge",

      moduleState.selectedTournamentId ===
      moduleState.activeTournamentId
        ? "Active Tournament"
        : "Inactive Tournament"
    );

    setText(
      "eventContextName",

      tournament.name ||
      moduleState.selectedTournamentId ||
      "No tournament"
    );

    setText(
      "eventContextFormat",
      format?.label ||
      "Unknown Format"
    );

    setText(
      "eventContextCapacity",
      teamCount *
      playersPerTeam
    );

    setText(
      "eventContextApplications",
      Object.keys(
        moduleState.applications
      ).length
    );
  }

  function renderSummary() {
    const applications =
      Object.values(
        moduleState.applications
      );

    const tournament =
      selectedTournament();

    const teams =
      getTeams();

    setText(
      "eventPendingApplications",

      applications.filter(
        application =>
          !application?.status ||
          application.status ===
          "pending"
      ).length
    );

    setText(
      "eventAcceptedApplications",

      applications.filter(
        application =>
          [
            "accepted",
            "approved"
          ].includes(
            application?.status
          )
      ).length
    );

    setText(
      "eventAssignedTeams",
      Object.keys(
        teams
      ).length
    );

    setText(
      "eventRegistrationMetric",

      formatLabel(
        tournament.registrationStatus ||
        (
          tournament.applicationsOpen
            ? "OPEN"
            : "CLOSED"
        )
      )
    );

    setText(
      "eventPhaseMetric",

      PHASE_OPTIONS[
        tournament.status
      ] ||
      formatLabel(
        tournament.status ||
        "draft"
      )
    );
  }

  function renderLifecycle() {
    const tournament =
      selectedTournament();

    const applications =
      Object.values(
        moduleState.applications
      );

    const teams =
      getTeams();

    const registrationOpen =
      tournament.registrationStatus ===
        "OPEN" ||
      tournament.applicationsOpen ===
        true;

    const active =
      moduleState.selectedTournamentId ===
      moduleState.activeTournamentId;

    const accepted =
      applications.filter(
        application =>
          [
            "accepted",
            "approved"
          ].includes(
            application?.status
          )
      ).length;

    const teamCount =
      Object.keys(
        teams
      ).length;

    const container =
      document.getElementById(
        "eventLifecycleList"
      );

    if (!container) {
      return;
    }

    container.innerHTML = [
      lifecycleRow(
        "Applications",

        registrationOpen
          ? `${applications.length} submitted · Open`
          : `${applications.length} submitted · Closed`,

        registrationOpen
          ? "good"
          : "neutral"
      ),

      lifecycleRow(
        "Accepted Players",
        `${accepted} accepted`,
        accepted > 0
          ? "good"
          : "neutral"
      ),

      lifecycleRow(
        "Teams",

        tournament.teamsPublished
          ? `${teamCount} published`
          : `${teamCount} currently built`,

        tournament.teamsPublished
          ? "good"
          : "warning"
      ),

      lifecycleRow(
        "Public Website",

        active
          ? "Using this tournament"
          : "Using another tournament",

        active
          ? "good"
          : "neutral"
      )
    ].join("");
  }

  function getTeams() {
    const source =
      moduleState.teamsRecord
        .teams ||
      {};

    const result = {};

    Object.entries(
      source
    ).forEach(
      ([
        key,
        value
      ]) => {
        if (
          Array.isArray(value)
        ) {
          result[key] =
            value;
        } else if (
          value &&
          typeof value ===
          "object"
        ) {
          result[key] =
            Object.values(
              value
            );
        }
      }
    );

    return result;
  }

  function selectedTournament() {
    return (
      moduleState.tournaments[
        moduleState.selectedTournamentId
      ] ||
      {}
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
      ${escapeHtml(loadingText)}
    `;

    try {
      await action();
    } catch (error) {
      console.error(
        "Event Control action failed:",
        error
      );

      const message =
        context.isPermissionDenied(
          error
        )
          ? "Firebase denied this Event Control action."
          : error.message ||
            "The Event Control action failed.";

      context.showToast(
        message
      );

      window.alert(
        `Event Control Error\n\n${message}`
      );
    } finally {
      button.disabled =
        false;

      button.innerHTML =
        originalHtml;
    }
  }

  function toggleCreatePanel(
    open
  ) {
    const panel =
      document.getElementById(
        "eventCreatePanel"
      );

    if (!panel) {
      return;
    }

    panel.hidden =
      !open;

    if (open) {
      updateNewEventDefaults();

      panel.scrollIntoView({
        behavior:
          "smooth",

        block:
          "start"
      });

      requestAnimationFrame(
        () => {
          document.getElementById(
            "newEventId"
          )?.focus();
        }
      );
    }
  }

  function showModuleError(
    message
  ) {
    if (!boundContent) {
      return;
    }

    boundContent.innerHTML = `
      <section class="module-intro">
        <div>
          <h2>Event Control</h2>
          <p>${escapeHtml(message)}</p>
        </div>
      </section>

      <article class="nexus-panel placeholder-panel">
        <div>
          <div class="placeholder-icon">
            <i class="fa-solid fa-triangle-exclamation"></i>
          </div>

          <h3>
            Event Control unavailable
          </h3>

          <p>
            ${escapeHtml(message)}
          </p>
        </div>
      </article>
    `;
  }

function dateTimePickerMarkup(
  prefix,
  label
) {
  return `
    <div class="event-field event-date-time-field">
      <label for="${escapeHtml(prefix)}StartDate">
        ${escapeHtml(label)}
      </label>

      <div class="event-date-time-grid">
        <input
          id="${escapeHtml(prefix)}StartDate"
          class="event-control-input"
          type="date"
        >

        <select
          id="${escapeHtml(prefix)}StartHour"
          class="event-control-select"
          aria-label="Start hour"
        >
          ${Array.from(
            { length: 12 },
            (_, index) => {
              const hour =
                index + 1;

              return `
                <option value="${hour}">
                  ${hour}
                </option>
              `;
            }
          ).join("")}
        </select>

        <span class="event-time-divider">
          :
        </span>

        <select
          id="${escapeHtml(prefix)}StartMinute"
          class="event-control-select"
          aria-label="Start minute"
        >
          ${[
            "00",
            "05",
            "10",
            "15",
            "20",
            "25",
            "30",
            "35",
            "40",
            "45",
            "50",
            "55"
          ].map(
            minute => `
              <option value="${minute}">
                ${minute}
              </option>
            `
          ).join("")}
        </select>

        <select
          id="${escapeHtml(prefix)}StartPeriod"
          class="event-control-select"
          aria-label="AM or PM"
        >
          <option value="AM">
            AM
          </option>

          <option value="PM">
            PM
          </option>
        </select>
      </div>

   <small>
  All tournament start times use Central Time (CST/CDT).
</small>
    </div>
  `;
}

  function fieldMarkup(
    id,
    label,
    type,
    placeholder,
    help = ""
  ) {
    return `
      <div class="event-field">
        <label for="${escapeHtml(id)}">
          ${escapeHtml(label)}
        </label>

        <input
          id="${escapeHtml(id)}"
          class="event-control-input"
          type="${escapeHtml(type)}"
          placeholder="${escapeHtml(placeholder)}"
          ${
            type === "number"
              ? 'min="1" step="1"'
              : ""
          }
        >

        ${
          help
            ? `
              <small>
                ${escapeHtml(help)}
              </small>
            `
            : ""
        }
      </div>
    `;
  }

  function formatOptionsMarkup(
    selected
  ) {
    return Object.entries(
      FORMAT_OPTIONS
    )
      .map(
        ([
          value,
          option
        ]) => `
          <option
            value="${escapeHtml(value)}"
            ${
              value === selected
                ? "selected"
                : ""
            }
          >
            ${escapeHtml(option.label)}
          </option>
        `
      )
      .join("");
  }

  function phaseOptionsMarkup(
    selected
  ) {
    return Object.entries(
      PHASE_OPTIONS
    )
      .map(
        ([
          value,
          label
        ]) => `
          <option
            value="${escapeHtml(value)}"
            ${
              value === selected
                ? "selected"
                : ""
            }
          >
            ${escapeHtml(label)}
          </option>
        `
      )
      .join("");
  }

  function metricMarkup(
    id,
    label,
    value
  ) {
    return `
      <div class="event-context-metric">
        <span>
          ${escapeHtml(label)}
        </span>

        <strong id="${escapeHtml(id)}">
          ${escapeHtml(value)}
        </strong>
      </div>
    `;
  }

  function summaryMarkup(
    id,
    label,
    value,
    icon
  ) {
    return `
      <article class="event-summary-card">
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

  function calculatedMarkup(
    id,
    label,
    value
  ) {
    return `
      <div class="event-calculated-card">
        <span>
          ${escapeHtml(label)}
        </span>

        <strong id="${escapeHtml(id)}">
          ${escapeHtml(value)}
        </strong>
      </div>
    `;
  }

  function lifecycleRow(
    label,
    value,
    status
  ) {
    return `
      <div class="event-lifecycle-row">
        <span
          class="event-lifecycle-dot ${escapeHtml(status)}"
        ></span>

        <div>
          <strong>
            ${escapeHtml(label)}
          </strong>

          <small>
            ${escapeHtml(value)}
          </small>
        </div>
      </div>
    `;
  }

  function normalizeTournamentId(
    value
  ) {
    return String(
      value ||
      ""
    )
      .trim()
      .toLowerCase()
      .replace(
        /[^a-z0-9_-]+/g,
        "-"
      )
      .replace(
        /^-+|-+$/g,
        ""
      )
      .slice(
        0,
        64
      );
  }

function getEventTimeParts(
  date
) {
  const values = {};

  EVENT_TIME_FORMATTER
    .formatToParts(date)
    .forEach(part => {
      if (
        part.type !==
        "literal"
      ) {
        values[
          part.type
        ] = part.value;
      }
    });

  return {
    year:
      Number(
        values.year
      ),

    month:
      Number(
        values.month
      ),

    day:
      Number(
        values.day
      ),

    hour:
      Number(
        values.hour
      ),

    minute:
      Number(
        values.minute
      ),

    second:
      Number(
        values.second
      )
  };
}

function getEventTimeZoneOffset(
  date
) {
  const parts =
    getEventTimeParts(
      date
    );

  const displayedAsUtc =
    Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute,
      parts.second
    );

  const timestampWithoutMilliseconds =
    date.getTime() -
    date.getMilliseconds();

  return (
    displayedAsUtc -
    timestampWithoutMilliseconds
  );
}

function readFriendlyDateTime(
  prefix
) {
  const dateValue =
    valueOf(
      `${prefix}StartDate`
    );

  const hourValue =
    Number(
      valueOf(
        `${prefix}StartHour`
      )
    );

  const minuteValue =
    Number(
      valueOf(
        `${prefix}StartMinute`
      )
    );

  const period =
    valueOf(
      `${prefix}StartPeriod`
    );

  if (
    !dateValue ||
    hourValue < 1 ||
    hourValue > 12 ||
    minuteValue < 0 ||
    minuteValue > 59 ||
    ![
      "AM",
      "PM"
    ].includes(period)
  ) {
    return "";
  }

  let hour24 =
    hourValue % 12;

  if (
    period ===
    "PM"
  ) {
    hour24 += 12;
  }

  const [
    year,
    month,
    day
  ] = dateValue
    .split("-")
    .map(Number);

  if (
    !year ||
    !month ||
    !day
  ) {
    return "";
  }

  /*
   * Begin with the selected clock values
   * represented temporarily as UTC.
   */
  const wallClockTimestamp =
    Date.UTC(
      year,
      month - 1,
      day,
      hour24,
      minuteValue,
      0,
      0
    );

  /*
   * Calculate the Central Time offset
   * for this particular calendar date.
   */
  let offset =
    getEventTimeZoneOffset(
      new Date(
        wallClockTimestamp
      )
    );

  let finalTimestamp =
    wallClockTimestamp -
    offset;

  /*
   * Recheck because the first estimate
   * may cross a daylight-saving boundary.
   */
  const correctedOffset =
    getEventTimeZoneOffset(
      new Date(
        finalTimestamp
      )
    );

  if (
    correctedOffset !==
    offset
  ) {
    offset =
      correctedOffset;

    finalTimestamp =
      wallClockTimestamp -
      offset;
  }

  const finalDate =
    new Date(
      finalTimestamp
    );

  const verification =
    getEventTimeParts(
      finalDate
    );

  /*
   * Reject nonexistent clock times,
   * such as during the spring DST jump.
   */
  if (
    verification.year !==
      year ||
    verification.month !==
      month ||
    verification.day !==
      day ||
    verification.hour !==
      hour24 ||
    verification.minute !==
      minuteValue
  ) {
    return "";
  }

  return finalDate
    .toISOString();
}

function populateFriendlyDateTime(
  prefix,
  savedValue
) {
  if (!savedValue) {
    clearFriendlyDateTime(
      prefix
    );

    return;
  }

  const date =
    new Date(
      savedValue
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    clearFriendlyDateTime(
      prefix
    );

    return;
  }

  const parts =
    getEventTimeParts(
      date
    );

  const hour12 =
    parts.hour % 12 ||
    12;

  const period =
    parts.hour >= 12
      ? "PM"
      : "AM";

  const month =
    String(
      parts.month
    ).padStart(
      2,
      "0"
    );

  const day =
    String(
      parts.day
    ).padStart(
      2,
      "0"
    );

  const minute =
    String(
      parts.minute
    ).padStart(
      2,
      "0"
    );

  const minuteSelect =
    document.getElementById(
      `${prefix}StartMinute`
    );

  /*
   * Preserve an older saved minute even
   * when it is not a five-minute option.
   */
  if (
    minuteSelect &&
    !Array.from(
      minuteSelect.options
    ).some(
      option =>
        option.value ===
        minute
    )
  ) {
    const option =
      document.createElement(
        "option"
      );

    option.value =
      minute;

    option.textContent =
      minute;

    minuteSelect.appendChild(
      option
    );
  }

  setValue(
    `${prefix}StartDate`,

    `${parts.year}-${month}-${day}`
  );

  setValue(
    `${prefix}StartHour`,
    hour12
  );

  setValue(
    `${prefix}StartMinute`,
    minute
  );

  setValue(
    `${prefix}StartPeriod`,
    period
  );
}
function clearFriendlyDateTime(
  prefix
) {
  setValue(
    `${prefix}StartDate`,
    ""
  );

  setValue(
    `${prefix}StartHour`,
    7
  );

  setValue(
    `${prefix}StartMinute`,
    "00"
  );

  setValue(
    `${prefix}StartPeriod`,
    "PM"
  );
}

  function valueOf(id) {
    return String(
      document.getElementById(
        id
      )?.value ||
      ""
    ).trim();
  }

  function numberValue(
    id,
    fallback
  ) {
    const value =
      Number(
        document.getElementById(
          id
        )?.value
      );

    return Number.isFinite(
      value
    )
      ? Math.round(value)
      : fallback;
  }

function optionalNumberValue(id) {
  const rawValue =
    String(
      document.getElementById(
        id
      )?.value ||
      ""
    ).trim();

  if (!rawValue) {
    return null;
  }

  const value =
    Number(rawValue);

  return Number.isFinite(value)
    ? Math.round(value)
    : null;
}

  function setValue(
    id,
    value
  ) {
    const element =
      document.getElementById(
        id
      );

    if (element) {
      element.value =
        String(
          value ??
          ""
        );
    }
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

  function formatLabel(
    value
  ) {
    return String(
      value ||
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

  function capitalize(
    value
  ) {
    const text =
      String(
        value ||
        ""
      );

    return text
      ? text[0].toUpperCase() +
        text.slice(1)
      : "";
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

  window.NexusEventControl = {
    render,
    cleanup
  };
})();