(() => {
  "use strict";

  const ROUND_LABELS = {
    r16: "Round of 16",
    qf: "Quarterfinals",
    sf: "Semifinals",
    gf: "Grand Finals"
  };

  const moduleState = {
    activeTournamentId: "",
    tournamentId: "",
    tournaments: {},
    tournament: {},
    teamRecord: {},
    site: {},
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
          <h2>Bracket &amp; Matches</h2>
          <p>
            Manage tournament scores, winners, advancement and protected resets
            while keeping the public bracket compatible.
          </p>
        </div>

        <div class="module-actions">
          <button
            id="nexusBracketRefreshButton"
            class="action-button"
            type="button"
          >
            <i class="fa-solid fa-rotate"></i>
            Refresh
          </button>
        </div>
      </section>

      <section class="nexus-bracket-layout">
        <article class="nexus-panel">
          <header class="panel-header">
            <h3>Tournament Context</h3>
            <span id="nexusBracketActiveBadge">Loading</span>
          </header>

          <div class="nexus-bracket-panel-content">
            <div class="nexus-bracket-context-row">
              <div class="nexus-bracket-field">
                <label for="nexusBracketTournamentSelect">
                  Tournament to Manage
                </label>

                <select
                  id="nexusBracketTournamentSelect"
                  class="nexus-bracket-select"
                >
                  <option value="">Loading tournaments...</option>
                </select>
              </div>

              <button
                id="nexusBracketOpenTeamsButton"
                class="action-button"
                type="button"
              >
                <i class="fa-solid fa-people-group"></i>
                Team Builder
              </button>
            </div>

            <div class="nexus-bracket-context-grid">
              ${metricMarkup(
                "nexusBracketTournamentName",
                "Tournament",
                "Loading..."
              )}

              ${metricMarkup(
                "nexusBracketFormat",
                "Format",
                "--"
              )}

              ${metricMarkup(
                "nexusBracketCompleted",
                "Completed",
                "0"
              )}

              ${metricMarkup(
                "nexusBracketCurrentMatch",
                "Current Match",
                "--"
              )}

              ${metricMarkup(
                "nexusBracketChampion",
                "Champion",
                "TBD"
              )}
            </div>
          </div>
        </article>

        <article
          id="nexusBracketWarningPanel"
          class="nexus-bracket-warning-panel"
          hidden
        >
          <i class="fa-solid fa-triangle-exclamation"></i>

          <div>
            <strong>
              Bracket attention required
            </strong>

            <div id="nexusBracketWarningList"></div>
          </div>
        </article>

        <article class="nexus-panel">
          <header class="panel-header nexus-bracket-controls-header">
            <div>
              <h3>Bracket Controls</h3>

              <span id="nexusBracketSyncState">
                Live Firebase data
              </span>
            </div>

            <div class="nexus-bracket-control-row">
              <button
                class="action-button"
                type="button"
                data-bracket-action="clear-scores"
              >
                <i class="fa-solid fa-eraser"></i>
                Clear All Scores
              </button>

              <button
                class="action-button nexus-bracket-danger-button"
                type="button"
                data-bracket-action="clear-results"
              >
                <i class="fa-solid fa-rotate-left"></i>
                Clear All Results
              </button>
            </div>
          </header>

          <div class="nexus-bracket-help-strip">
            <span>
              <i class="fa-solid fa-circle-info"></i>
              Clear All Scores keeps saved winners. Clear All Results removes
              scores and winners.
            </span>
          </div>

          <div
            id="nexusBracketCanvas"
            class="nexus-bracket-canvas"
          >
            ${loadingMarkup(
              "Loading bracket..."
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
    }

    boundContent = null;
    context = null;
  }

  function resetState() {
    moduleState.activeTournamentId = "";
    moduleState.tournamentId = "";
    moduleState.tournaments = {};
    moduleState.tournament = {};
    moduleState.teamRecord = {};
    moduleState.site = {};
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
        activeTournamentId ||
        "open1";

      moduleState.tournaments =
        tournamentsSnapshot.val() ||
        {};

      const preferredTournament =
        sessionStorage.getItem(
          "nexusBracketTournament"
        );

      sessionStorage.removeItem(
        "nexusBracketTournament"
      );

      const initialTournament =
        preferredTournament &&
        moduleState.tournaments[
          preferredTournament
        ]
          ? preferredTournament
          : moduleState.activeTournamentId;

      renderTournamentOptions();
      switchTournament(
        initialTournament
      );
    } catch (error) {
      console.error(
        "Bracket initialization failed:",
        error
      );

      showModuleError(
        context.isPermissionDenied(error)
          ? "Firebase denied access to tournament bracket data."
          : error.message ||
            "Bracket & Matches could not be loaded."
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
      "nexusBracketRefreshButton"
    ) {
      void refreshModule(button);
      return;
    }

    if (
      button.id ===
      "nexusBracketOpenTeamsButton"
    ) {
      sessionStorage.setItem(
        "nexusTeamBuilderTournament",
        moduleState.tournamentId
      );

      context.openModule(
        "teams"
      );

      return;
    }

    const action =
      button.dataset.bracketAction;

    if (
      action ===
      "clear-scores"
    ) {
      void clearAllScores(button);
      return;
    }

    if (
      action ===
      "clear-results"
    ) {
      void clearAllResults(button);
      return;
    }

    if (
      action ===
      "adjust-score"
    ) {
      adjustScore(
        button.dataset.matchId,
        button.dataset.side,
        Number(
          button.dataset.delta ||
          0
        )
      );

      return;
    }

    if (
      action ===
      "save-match"
    ) {
      void saveMatch(
        button.dataset.matchId,
        button
      );

      return;
    }

    if (
      action ===
      "reset-match"
    ) {
      void resetMatch(
        button.dataset.matchId,
        button
      );

      return;
    }

    if (
      action ===
      "open-live"
    ) {
      void openInLiveOperations(
        button.dataset.matchId,
        button
      );
    }
  }

  function handleChange(event) {
    if (
      event.target.id ===
      "nexusBracketTournamentSelect"
    ) {
      switchTournament(
        event.target.value
      );
    }
  }

  async function refreshModule(
    button
  ) {
    await runButtonAction(
      button,
      "Refreshing...",
      async () => {
        const tournamentsSnapshot =
          await context.database
            .ref("tournaments")
            .once("value");

        moduleState.tournaments =
          tournamentsSnapshot.val() ||
          {};

        renderTournamentOptions();

        switchTournament(
          moduleState.tournamentId ||
          moduleState.activeTournamentId
        );

        context.showToast(
          "Bracket refreshed."
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
    moduleState.teamRecord = {};
    moduleState.site = {};

    const select =
      document.getElementById(
        "nexusBracketTournamentSelect"
      );

    if (select) {
      select.value =
        tournamentId;
    }

    setText(
      "nexusBracketSyncState",
      "Loading tournament..."
    );

    setHtml(
      "nexusBracketCanvas",
      loadingMarkup(
        "Loading bracket..."
      )
    );

    const tournamentRef =
      context.database.ref(
        `tournaments/${tournamentId}`
      );

    const teamsRef =
      context.database.ref(
        `teams/${tournamentId}`
      );

    const siteRef =
      context.database.ref(
        "site"
      );

    const tournamentHandler =
      snapshot => {
        moduleState.tournament =
          snapshot.val() ||
          {};

        renderAll();
      };

    const teamsHandler =
      snapshot => {
        moduleState.teamRecord =
          snapshot.val() ||
          {};

        renderAll();
      };

    const siteHandler =
      snapshot => {
        moduleState.site =
          snapshot.val() ||
          {};

        moduleState.activeTournamentId =
          moduleState.site
            .currentTournament ||
          moduleState.activeTournamentId;

        renderTournamentOptions();
        renderAll();
      };

    const listenerError =
      label => error => {
        console.error(
          `${label} listener failed:`,
          error
        );

        context.showToast(
          context.isPermissionDenied(
            error
          )
            ? `Firebase denied access to ${label}.`
            : `${label} could not be loaded.`
        );
      };

    tournamentRef.on(
      "value",
      tournamentHandler,
      listenerError(
        "Tournament data"
      )
    );

    teamsRef.on(
      "value",
      teamsHandler,
      listenerError(
        "Team data"
      )
    );

    siteRef.on(
      "value",
      siteHandler,
      listenerError(
        "Public site data"
      )
    );

    moduleState.listeners.push(
      {
        ref:
          tournamentRef,

        handler:
          tournamentHandler
      },
      {
        ref:
          teamsRef,

        handler:
          teamsHandler
      },
      {
        ref:
          siteRef,

        handler:
          siteHandler
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
        "nexusBracketTournamentSelect"
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
          ([
            id,
            tournament
          ]) => {
            const activeLabel =
              id ===
              moduleState
                .activeTournamentId
                ? " — ACTIVE"
                : "";

            return `
              <option value="${escapeHtml(
                id
              )}">
                ${escapeHtml(
                  tournament.name ||
                  id
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
    if (
      !boundContent ||
      !moduleState.tournamentId
    ) {
      return;
    }

    const definitions =
      getDefinitions();

    const completedCount =
      definitions.filter(
        definition =>
          Boolean(
            getEffectiveWinner(
              definition.id
            )
          )
      ).length;

    const champion =
      getEffectiveWinner(
        "GF"
      ) ||
      "TBD";

    const active =
      isActiveTournament();

    setText(
      "nexusBracketTournamentName",
      moduleState.tournament.name ||
      moduleState.tournamentId
    );

    setText(
      "nexusBracketFormat",
      formatDisplayName()
    );

    setText(
      "nexusBracketCompleted",
      `${completedCount}/${definitions.length}`
    );

    setText(
      "nexusBracketCurrentMatch",
      active
        ? moduleState.site
            .currentMatch ||
          "No Match Live"
        : "Inactive"
    );

    setText(
      "nexusBracketChampion",
      champion
    );

    setText(
      "nexusBracketActiveBadge",
      active
        ? "Active Tournament"
        : "Inactive Tournament"
    );

    setText(
      "nexusBracketSyncState",
      "Live Firebase data"
    );

    renderWarnings();
    renderBracket();
  }

  function renderWarnings() {
    const warnings =
      collectWarnings();

    const panel =
      document.getElementById(
        "nexusBracketWarningPanel"
      );

    const list =
      document.getElementById(
        "nexusBracketWarningList"
      );

    if (
      !panel ||
      !list
    ) {
      return;
    }

    panel.hidden =
      warnings.length ===
      0;

    list.innerHTML =
      warnings
        .map(
          warning => `
            <span>
              ${escapeHtml(warning)}
            </span>
          `
        )
        .join("");
  }

  function renderBracket() {
    const container =
      document.getElementById(
        "nexusBracketCanvas"
      );

    if (!container) return;

    const definitions =
      getDefinitions();

    if (!definitions.length) {
      container.innerHTML =
        emptyMarkup(
          "Unsupported format",
          "Bracket & Matches currently supports 8-team and 16-team single elimination.",
          "fa-diagram-project"
        );

      return;
    }

    const roundKeys =
      getFormatType() ===
      "16_single_elim"
        ? [
            "r16",
            "qf",
            "sf",
            "gf"
          ]
        : [
            "qf",
            "sf",
            "gf"
          ];

    container.innerHTML = `
      <div class="nexus-bracket-scroll">
        <div class="nexus-bracket-rounds">
          ${roundKeys
            .map(
              roundKey => {
                const roundMatches =
                  definitions.filter(
                    definition =>
                      definition.round ===
                      roundKey
                  );

                return `
                  <section class="nexus-bracket-round nexus-bracket-round-${roundKey}">
                    <header>
                      <span>
                        ${escapeHtml(
                          ROUND_LABELS[
                            roundKey
                          ]
                        )}
                      </span>

                      <strong>
                        ${roundMatches.length}
                        Match${
                          roundMatches.length ===
                          1
                            ? ""
                            : "es"
                        }
                      </strong>
                    </header>

                    <div class="nexus-bracket-round-stack">
                      ${roundMatches
                        .map(
                          matchCardMarkup
                        )
                        .join("")}
                    </div>
                  </section>
                `;
              }
            )
            .join("")}
        </div>
      </div>
    `;
  }

  function matchCardMarkup(
    definition
  ) {
    const participantA =
      resolveParticipant(
        definition.sourceA
      );

    const participantB =
      resolveParticipant(
        definition.sourceB
      );

    const record =
      getMatchRecord(
        definition
      );

    const effectiveWinner =
      getEffectiveWinner(
        definition.id
      );

    const status =
      getMatchStatus(
        definition,
        participantA,
        participantB
      );

    const disabled =
      participantA.placeholder ||
      participantB.placeholder;

    const maxScore =
      winsNeeded(
        definition.bestOf
      );

    const issues =
      getMatchWarnings(
        definition
      );

    return `
      <article class="nexus-bracket-match-card ${escapeHtml(
        status.className
      )}">
        <header class="nexus-bracket-match-header">
          <div>
            <span>
              ${escapeHtml(
                definition.label
              )}
              • BO${definition.bestOf}
            </span>

            <strong>
              ${escapeHtml(
                status.label
              )}
            </strong>
          </div>

          ${
            issues.length
              ? `
                <i
                  class="fa-solid fa-triangle-exclamation"
                  title="${escapeHtml(
                    issues.join(" ")
                  )}"
                ></i>
              `
              : `
                <i class="fa-solid ${escapeHtml(
                  status.icon
                )}"></i>
              `
          }
        </header>

        ${teamScoreRowMarkup(
          definition,
          participantA,
          "A",
          record.scoreA,
          effectiveWinner,
          maxScore,
          disabled
        )}

        ${teamScoreRowMarkup(
          definition,
          participantB,
          "B",
          record.scoreB,
          effectiveWinner,
          maxScore,
          disabled
        )}

        <div class="nexus-bracket-winner-field">
          <label for="nexusBracketWinner-${escapeHtml(
            definition.id
          )}">
            Saved Winner
          </label>

          <select
            id="nexusBracketWinner-${escapeHtml(
              definition.id
            )}"
            class="nexus-bracket-select"
            ${
              disabled
                ? "disabled"
                : ""
            }
          >
            <option value="">
              Auto from score / Not decided
            </option>

            ${winnerOptionMarkup(
              participantA.name,
              record.winner
            )}

            ${winnerOptionMarkup(
              participantB.name,
              record.winner
            )}
          </select>

          <small>
            Advances:
            ${escapeHtml(
              effectiveWinner ||
              "Not decided"
            )}
          </small>
        </div>

        <div class="nexus-bracket-match-actions">
          <button
            class="action-button action-button-primary"
            type="button"
            data-bracket-action="save-match"
            data-match-id="${escapeHtml(
              definition.id
            )}"
            ${
              disabled
                ? "disabled"
                : ""
            }
          >
            <i class="fa-solid fa-floppy-disk"></i>
            Save Result
          </button>

          <button
            class="action-button"
            type="button"
            data-bracket-action="open-live"
            data-match-id="${escapeHtml(
              definition.id
            )}"
            ${
              !isActiveTournament() ||
              disabled
                ? "disabled"
                : ""
            }
          >
            <i class="fa-solid fa-tower-broadcast"></i>
            Open Live
          </button>

          <button
            class="action-button nexus-bracket-reset-button"
            type="button"
            data-bracket-action="reset-match"
            data-match-id="${escapeHtml(
              definition.id
            )}"
          >
            <i class="fa-solid fa-arrow-rotate-left"></i>
            Reset
          </button>
        </div>
      </article>
    `;
  }

  function teamScoreRowMarkup(
    definition,
    participant,
    side,
    score,
    effectiveWinner,
    maxScore,
    disabled
  ) {
    const logo =
      getTeamLogo(
        participant.teamKey
      );

    const winnerClass =
      effectiveWinner &&
      effectiveWinner ===
      participant.name
        ? "is-winner"
        : "";

    return `
      <div class="nexus-bracket-team-row ${winnerClass}">
        ${teamIdentityMarkup(
          participant,
          logo
        )}

        <div class="nexus-bracket-score-control">
          <button
            type="button"
            aria-label="Decrease ${escapeHtml(
              participant.name
            )} score"
            data-bracket-action="adjust-score"
            data-match-id="${escapeHtml(
              definition.id
            )}"
            data-side="${side}"
            data-delta="-1"
            ${
              disabled
                ? "disabled"
                : ""
            }
          >
            <i class="fa-solid fa-minus"></i>
          </button>

          <input
            id="nexusBracketScore${side}-${escapeHtml(
              definition.id
            )}"
            type="number"
            min="0"
            max="${maxScore}"
            step="1"
            inputmode="numeric"
            value="${escapeHtml(score)}"
            aria-label="${escapeHtml(
              participant.name
            )} score"
            ${
              disabled
                ? "disabled"
                : ""
            }
          >

          <button
            type="button"
            aria-label="Increase ${escapeHtml(
              participant.name
            )} score"
            data-bracket-action="adjust-score"
            data-match-id="${escapeHtml(
              definition.id
            )}"
            data-side="${side}"
            data-delta="1"
            ${
              disabled
                ? "disabled"
                : ""
            }
          >
            <i class="fa-solid fa-plus"></i>
          </button>
        </div>
      </div>
    `;
  }

  function teamIdentityMarkup(
    participant,
    logo
  ) {
    const fallback =
      initials(
        participant.name
      );

    return `
      <div class="nexus-bracket-team-identity">
        ${
          logo
            ? `
              <img
                src="${escapeHtml(logo)}"
                alt="${escapeHtml(
                  participant.name
                )} logo"
              >
            `
            : `
              <span>
                ${escapeHtml(fallback)}
              </span>
            `
        }

        <strong title="${escapeHtml(
          participant.name
        )}">
          ${escapeHtml(
            participant.name
          )}
        </strong>
      </div>
    `;
  }

  function winnerOptionMarkup(
    teamName,
    selectedWinner
  ) {
    if (
      !teamName ||
      teamName.startsWith(
        "Winner "
      )
    ) {
      return "";
    }

    return `
      <option
        value="${escapeHtml(
          teamName
        )}"
        ${
          teamName ===
          selectedWinner
            ? "selected"
            : ""
        }
      >
        ${escapeHtml(teamName)}
      </option>
    `;
  }

  function adjustScore(
    matchId,
    side,
    delta
  ) {
    const definition =
      getDefinition(
        matchId
      );

    if (!definition) return;

    const input =
      document.getElementById(
        `nexusBracketScore${side}-${matchId}`
      );

    if (!input) return;

    const max =
      winsNeeded(
        definition.bestOf
      );

    const current =
      Number(
        input.value ||
        0
      );

    input.value =
      String(
        Math.min(
          max,
          Math.max(
            0,
            current + delta
          )
        )
      );
  }

  async function saveMatch(
    matchId,
    button
  ) {
    const definition =
      getDefinition(
        matchId
      );

    if (!definition) return;

    const participantA =
      resolveParticipant(
        definition.sourceA
      );

    const participantB =
      resolveParticipant(
        definition.sourceB
      );

    if (
      participantA.placeholder ||
      participantB.placeholder
    ) {
      context.showToast(
        "Both teams must be known before saving this match."
      );

      return;
    }

    const scoreAResult =
      readScore(
        `nexusBracketScoreA-${matchId}`
      );

    const scoreBResult =
      readScore(
        `nexusBracketScoreB-${matchId}`
      );

    if (
      !scoreAResult.valid ||
      !scoreBResult.valid
    ) {
      context.showToast(
        "Scores must be whole numbers or left blank."
      );

      return;
    }

    const scoreA =
      scoreAResult.value;

    const scoreB =
      scoreBResult.value;

    const maxScore =
      winsNeeded(
        definition.bestOf
      );

    if (
      (
        scoreA !== "" &&
        scoreA > maxScore
      ) ||
      (
        scoreB !== "" &&
        scoreB > maxScore
      )
    ) {
      context.showToast(
        `A BO${definition.bestOf} score cannot exceed ${maxScore}.`
      );

      return;
    }

    if (
      scoreA === maxScore &&
      scoreB === maxScore
    ) {
      context.showToast(
        "Both teams cannot have the winning score."
      );

      return;
    }

    const winnerSelect =
      document.getElementById(
        `nexusBracketWinner-${matchId}`
      );

    const selectedWinner =
      clean(
        winnerSelect?.value
      );

    const automaticWinner =
      scoreWinner(
        participantA.name,
        participantB.name,
        scoreA,
        scoreB,
        definition.bestOf
      );

    if (
      selectedWinner &&
      ![
        participantA.name,
        participantB.name
      ].includes(
        selectedWinner
      )
    ) {
      context.showToast(
        "The saved winner must be one of the two teams."
      );

      return;
    }

    if (
      automaticWinner &&
      selectedWinner &&
      automaticWinner !==
      selectedWinner
    ) {
      context.showToast(
        "The selected winner conflicts with the completed score. Correct the score or winner."
      );

      return;
    }

    const nextWinner =
      automaticWinner ||
      selectedWinner ||
      "";

    const previousWinner =
      getEffectiveWinner(
        matchId
      );

    const descendants =
      getDescendants(
        matchId
      );

    const descendantsWithData =
      descendants.filter(
        descendantId =>
          matchHasData(
            getDefinition(
              descendantId
            )
          )
      );

    if (
      previousWinner !==
      nextWinner &&
      descendantsWithData.length
    ) {
      const confirmed =
        window.confirm(
          `Changing ${matchId}'s winner will clear downstream results for:\n\n${descendantsWithData.join(
            ", "
          )}\n\nContinue?`
        );

      if (!confirmed) return;
    }

    await runButtonAction(
      button,
      "Saving...",
      async () => {
        const updates = {};

        const timestamp =
          firebase.database
            .ServerValue
            .TIMESTAMP;

        writeCanonicalMatchUpdates(
          updates,
          definition,
          {
            scoreA,
            scoreB,
            winner:
              nextWinner,

            updatedAt:
              timestamp,

            updatedBy:
              context.currentUser?.uid ||
              null
          }
        );

        if (
          isActiveTournament()
        ) {
          writeLegacyMatchUpdates(
            updates,
            definition,
            {
              scoreA,
              scoreB,
              winner:
                nextWinner
            }
          );
        }

        if (
          previousWinner !==
          nextWinner
        ) {
          descendants.forEach(
            descendantId => {
              const descendant =
                getDefinition(
                  descendantId
                );

              writeCanonicalMatchUpdates(
                updates,
                descendant,
                blankMatchRecord(
                  timestamp
                )
              );

              if (
                isActiveTournament()
              ) {
                writeLegacyMatchUpdates(
                  updates,
                  descendant,
                  blankMatchRecord(
                    timestamp
                  )
                );
              }
            }
          );
        }

        updates[
          `tournaments/${moduleState.tournamentId}/bracketUpdatedAt`
        ] = timestamp;

        updates[
          `tournaments/${moduleState.tournamentId}/bracketUpdatedBy`
        ] =
          context.currentUser?.uid ||
          null;

        await context.database
          .ref()
          .update(updates);

        context.showToast(
          `${matchId} result saved.`
        );
      }
    );
  }

  async function resetMatch(
    matchId,
    button
  ) {
    const definition =
      getDefinition(
        matchId
      );

    if (!definition) return;

    const descendants =
      getDescendants(
        matchId
      );

    const affected =
      [
        matchId,
        ...descendants
      ].filter(
        id =>
          matchHasData(
            getDefinition(id)
          )
      );

    if (!affected.length) {
      context.showToast(
        `${matchId} is already empty.`
      );

      return;
    }

    const confirmed =
      window.confirm(
        `Reset ${matchId}?\n\nThis will clear scores and winners for:\n${affected.join(
          ", "
        )}`
      );

    if (!confirmed) return;

    await runButtonAction(
      button,
      "Resetting...",
      async () => {
        const updates = {};

        const timestamp =
          firebase.database
            .ServerValue
            .TIMESTAMP;

        [
          matchId,
          ...descendants
        ].forEach(
          id => {
            const match =
              getDefinition(id);

            writeCanonicalMatchUpdates(
              updates,
              match,
              blankMatchRecord(
                timestamp
              )
            );

            if (
              isActiveTournament()
            ) {
              writeLegacyMatchUpdates(
                updates,
                match,
                blankMatchRecord(
                  timestamp
                )
              );
            }
          }
        );

        updates[
          `tournaments/${moduleState.tournamentId}/bracketUpdatedAt`
        ] = timestamp;

        updates[
          `tournaments/${moduleState.tournamentId}/bracketUpdatedBy`
        ] =
          context.currentUser?.uid ||
          null;

        await context.database
          .ref()
          .update(updates);

        context.showToast(
          `${matchId} and downstream results were reset.`
        );
      }
    );
  }

  async function clearAllScores(
    button
  ) {
    const confirmed =
      window.confirm(
        "Clear every bracket score?\n\nSaved winners will remain so bracket advancement stays intact."
      );

    if (!confirmed) return;

    await runButtonAction(
      button,
      "Clearing...",
      async () => {
        const updates = {};

        const timestamp =
          firebase.database
            .ServerValue
            .TIMESTAMP;

        getDefinitions().forEach(
          definition => {
            const winner =
              getEffectiveWinner(
                definition.id
              );

            const record = {
              scoreA: "",
              scoreB: "",
              winner,

              updatedAt:
                timestamp,

              updatedBy:
                context.currentUser?.uid ||
                null
            };

            writeCanonicalMatchUpdates(
              updates,
              definition,
              record
            );

            if (
              isActiveTournament()
            ) {
              writeLegacyMatchUpdates(
                updates,
                definition,
                record
              );
            }
          }
        );

        updates[
          `tournaments/${moduleState.tournamentId}/bracketUpdatedAt`
        ] = timestamp;

        updates[
          `tournaments/${moduleState.tournamentId}/bracketUpdatedBy`
        ] =
          context.currentUser?.uid ||
          null;

        await context.database
          .ref()
          .update(updates);

        context.showToast(
          "All scores cleared. Winners were preserved."
        );
      }
    );
  }

  async function clearAllResults(
    button
  ) {
    const tournamentName =
      moduleState.tournament.name ||
      moduleState.tournamentId;

    const confirmed =
      window.confirm(
        `Clear every score and winner for ${tournamentName}?\n\nTeam names and rosters will stay. This cannot be undone from Nexus.`
      );

    if (!confirmed) return;

    await runButtonAction(
      button,
      "Clearing...",
      async () => {
        const updates = {};

        const timestamp =
          firebase.database
            .ServerValue
            .TIMESTAMP;

        getDefinitions().forEach(
          definition => {
            const blank =
              blankMatchRecord(
                timestamp
              );

            writeCanonicalMatchUpdates(
              updates,
              definition,
              blank
            );

            if (
              isActiveTournament()
            ) {
              writeLegacyMatchUpdates(
                updates,
                definition,
                blank
              );
            }
          }
        );

        updates[
          `tournaments/${moduleState.tournamentId}/bracketUpdatedAt`
        ] = timestamp;

        updates[
          `tournaments/${moduleState.tournamentId}/bracketUpdatedBy`
        ] =
          context.currentUser?.uid ||
          null;

        await context.database
          .ref()
          .update(updates);

        context.showToast(
          "All bracket scores and winners cleared."
        );
      }
    );
  }

  async function openInLiveOperations(
    matchId,
    button
  ) {
    const definition =
      getDefinition(
        matchId
      );

    if (
      !definition ||
      !isActiveTournament()
    ) {
      return;
    }

    const participantA =
      resolveParticipant(
        definition.sourceA
      );

    const participantB =
      resolveParticipant(
        definition.sourceB
      );

    if (
      participantA.placeholder ||
      participantB.placeholder
    ) {
      context.showToast(
        "Both teams must be known before opening this match live."
      );

      return;
    }

    const confirmed =
      window.confirm(
        `Set ${definition.currentMatchValue} as the current live match?\n\nThis may close or lock live predictions tied to the current match.`
      );

    if (!confirmed) return;

    await runButtonAction(
      button,
      "Opening...",
      async () => {
        await context.database
          .ref(
            "site/currentMatch"
          )
          .set(
            definition.currentMatchValue
          );

        sessionStorage.setItem(
          "nexusLiveMatchId",
          definition.id
        );

        context.showToast(
          `${definition.currentMatchValue} is now current.`
        );

        context.openModule(
          "live"
        );
      }
    );
  }

  function writeCanonicalMatchUpdates(
    updates,
    definition,
    record
  ) {
    if (!definition) return;

    const base =
      `tournaments/${moduleState.tournamentId}/bracket/${definition.storageKey}`;

    updates[
      `${base}/scoreA`
    ] =
      record.scoreA ??
      "";

    updates[
      `${base}/scoreB`
    ] =
      record.scoreB ??
      "";

    updates[
      `${base}/winner`
    ] =
      record.winner ||
      "";

    updates[
      `${base}/updatedAt`
    ] =
      record.updatedAt ||
      null;

    updates[
      `${base}/updatedBy`
    ] =
      record.updatedBy ||
      null;
  }

  function writeLegacyMatchUpdates(
    updates,
    definition,
    record
  ) {
    if (!definition) return;

    updates[
      `site/${definition.legacyScoreA}`
    ] =
      record.scoreA ??
      "";

    updates[
      `site/${definition.legacyScoreB}`
    ] =
      record.scoreB ??
      "";

    updates[
      `site/${definition.legacyWinner}`
    ] =
      record.winner ||
      "";
  }

  function blankMatchRecord(
    timestamp
  ) {
    return {
      scoreA: "",
      scoreB: "",
      winner: "",

      updatedAt:
        timestamp,

      updatedBy:
        context.currentUser?.uid ||
        null
    };
  }

  function getDefinitions() {
    return buildDefinitions(
      getFormatType()
    );
  }

  function getDefinition(
    matchId
  ) {
    return (
      getDefinitions().find(
        definition =>
          definition.id ===
          matchId
      ) ||
      null
    );
  }

  function buildDefinitions(
    formatType
  ) {
    const base = [
      matchDefinition(
        "QF1",
        "qf",
        3,
        winnerSource("R16-1"),
        winnerSource("R16-2")
      ),

      matchDefinition(
        "QF2",
        "qf",
        3,
        winnerSource("R16-3"),
        winnerSource("R16-4")
      ),

      matchDefinition(
        "QF3",
        "qf",
        3,
        winnerSource("R16-5"),
        winnerSource("R16-6")
      ),

      matchDefinition(
        "QF4",
        "qf",
        3,
        winnerSource("R16-7"),
        winnerSource("R16-8")
      ),

      matchDefinition(
        "SF1",
        "sf",
        3,
        winnerSource("QF1"),
        winnerSource("QF2")
      ),

      matchDefinition(
        "SF2",
        "sf",
        3,
        winnerSource("QF3"),
        winnerSource("QF4")
      ),

      matchDefinition(
        "GF",
        "gf",
        5,
        winnerSource("SF1"),
        winnerSource("SF2")
      )
    ];

    if (
      formatType ===
      "8_single_elim"
    ) {
      base[0].sourceA =
        seedSource(1);

      base[0].sourceB =
        seedSource(2);

      base[1].sourceA =
        seedSource(3);

      base[1].sourceB =
        seedSource(4);

      base[2].sourceA =
        seedSource(5);

      base[2].sourceB =
        seedSource(6);

      base[3].sourceA =
        seedSource(7);

      base[3].sourceB =
        seedSource(8);

      return base;
    }

    if (
      formatType ===
      "16_single_elim"
    ) {
      const r16 = [];

      for (
        let index = 1;
        index <= 8;
        index += 1
      ) {
        r16.push(
          matchDefinition(
            `R16-${index}`,
            "r16",
            3,
            seedSource(
              index * 2 - 1
            ),
            seedSource(
              index * 2
            )
          )
        );
      }

      return [
        ...r16,
        ...base
      ];
    }

    return [];
  }

  function matchDefinition(
    id,
    round,
    bestOf,
    sourceA,
    sourceB
  ) {
    const isGrandFinal =
      id ===
      "GF";

    const r16Match =
      id.match(
        /^R16-(\d+)$/
      );

    const storageKey =
      r16Match
        ? `r16m${r16Match[1]}`
        : id.toLowerCase();

    const legacyBase =
      r16Match
        ? `r16m${r16Match[1]}`
        : isGrandFinal
          ? "gf"
          : id.toLowerCase();

    return {
      id,

      label:
        isGrandFinal
          ? "Grand Finals"
          : id,

      round,
      bestOf,
      sourceA,
      sourceB,
      storageKey,

      legacyScoreA:
        `${legacyBase}Team1Score`,

      legacyScoreB:
        `${legacyBase}Team2Score`,

      legacyWinner:
        isGrandFinal
          ? "grandWinner"
          : `${storageKey}Winner`,

      currentMatchValue:
        isGrandFinal
          ? "Grand Finals • Bo5"
          : `${id} • Bo${bestOf}`
    };
  }

  function seedSource(index) {
    return {
      type: "seed",
      index
    };
  }

  function winnerSource(
    matchId
  ) {
    return {
      type: "winner",
      matchId
    };
  }

  function resolveParticipant(
    source,
    depth = 0
  ) {
    if (
      !source ||
      depth > 20
    ) {
      return {
        name: "Unknown Team",
        teamKey: "",
        placeholder: true
      };
    }

    if (
      source.type ===
      "seed"
    ) {
      const teamKey =
        `team${source.index}`;

      return {
        name:
          getTeamName(
            teamKey
          ),

        teamKey,
        placeholder: false
      };
    }

    if (
      source.type ===
      "winner"
    ) {
      const sourceDefinition =
        getDefinition(
          source.matchId
        );

      const winner =
        getEffectiveWinner(
          source.matchId,
          depth + 1
        );

      if (
        !sourceDefinition ||
        !winner
      ) {
        return {
          name:
            `Winner ${source.matchId}`,

          teamKey: "",
          placeholder: true
        };
      }

      const participantA =
        resolveParticipant(
          sourceDefinition.sourceA,
          depth + 1
        );

      const participantB =
        resolveParticipant(
          sourceDefinition.sourceB,
          depth + 1
        );

      if (
        winner ===
        participantA.name
      ) {
        return participantA;
      }

      if (
        winner ===
        participantB.name
      ) {
        return participantB;
      }

      return {
        name: winner,
        teamKey: "",
        placeholder: false
      };
    }

    return {
      name: "Unknown Team",
      teamKey: "",
      placeholder: true
    };
  }

  function getMatchRecord(
    definition
  ) {
    if (!definition) {
      return {
        scoreA: "",
        scoreB: "",
        winner: ""
      };
    }

    const canonical =
      moduleState.tournament
        .bracket?.[
          definition.storageKey
        ] ||
      {};

    const active =
      isActiveTournament();

    return {
      scoreA:
        normalizeScore(
          canonical.scoreA !==
          undefined
            ? canonical.scoreA
            : active
              ? moduleState.site[
                  definition.legacyScoreA
                ]
              : ""
        ),

      scoreB:
        normalizeScore(
          canonical.scoreB !==
          undefined
            ? canonical.scoreB
            : active
              ? moduleState.site[
                  definition.legacyScoreB
                ]
              : ""
        ),

      winner:
        clean(
          canonical.winner !==
          undefined
            ? canonical.winner
            : active
              ? moduleState.site[
                  definition.legacyWinner
                ]
              : ""
        )
    };
  }

  function getEffectiveWinner(
    matchId,
    depth = 0
  ) {
    if (
      depth > 20
    ) {
      return "";
    }

    const definition =
      getDefinition(
        matchId
      );

    if (!definition) {
      return "";
    }

    const participantA =
      resolveParticipant(
        definition.sourceA,
        depth + 1
      );

    const participantB =
      resolveParticipant(
        definition.sourceB,
        depth + 1
      );

    const record =
      getMatchRecord(
        definition
      );

    return (
      scoreWinner(
        participantA.name,
        participantB.name,
        record.scoreA,
        record.scoreB,
        definition.bestOf
      ) ||
      record.winner ||
      ""
    );
  }

  function scoreWinner(
    teamA,
    teamB,
    scoreA,
    scoreB,
    bestOf
  ) {
    if (
      scoreA === "" ||
      scoreB === ""
    ) {
      return "";
    }

    const a =
      Number(scoreA);

    const b =
      Number(scoreB);

    if (
      !Number.isFinite(a) ||
      !Number.isFinite(b) ||
      a === b
    ) {
      return "";
    }

    const needed =
      winsNeeded(
        bestOf
      );

    if (
      a < needed &&
      b < needed
    ) {
      return "";
    }

    return a > b
      ? teamA
      : teamB;
  }

  function winsNeeded(
    bestOf
  ) {
    return bestOf === 5
      ? 3
      : 2;
  }

  function getDescendants(
    matchId
  ) {
    const definitions =
      getDefinitions();

    const descendants = [];
    const queue = [matchId];

    const seen =
      new Set([
        matchId
      ]);

    while (
      queue.length
    ) {
      const current =
        queue.shift();

      definitions.forEach(
        definition => {
          const dependsOnCurrent =
            [
              definition.sourceA,
              definition.sourceB
            ].some(
              source =>
                source.type ===
                "winner" &&
                source.matchId ===
                current
            );

          if (
            dependsOnCurrent &&
            !seen.has(
              definition.id
            )
          ) {
            seen.add(
              definition.id
            );

            descendants.push(
              definition.id
            );

            queue.push(
              definition.id
            );
          }
        }
      );
    }

    return descendants;
  }

  function matchHasData(
    definition
  ) {
    if (!definition) {
      return false;
    }

    const record =
      getMatchRecord(
        definition
      );

    return Boolean(
      record.scoreA !== "" ||
      record.scoreB !== "" ||
      record.winner
    );
  }

  function getMatchStatus(
    definition,
    participantA,
    participantB
  ) {
    if (
      isCurrentMatch(
        definition
      )
    ) {
      return {
        label: "Live",
        className: "is-live",
        icon: "fa-tower-broadcast"
      };
    }

    if (
      getEffectiveWinner(
        definition.id
      )
    ) {
      return {
        label: "Completed",
        className: "is-completed",
        icon: "fa-circle-check"
      };
    }

    if (
      participantA.placeholder ||
      participantB.placeholder
    ) {
      return {
        label: "Waiting",
        className: "is-waiting",
        icon: "fa-hourglass-half"
      };
    }

    return {
      label: "Upcoming",
      className: "is-upcoming",
      icon: "fa-clock"
    };
  }

  function isCurrentMatch(
    definition
  ) {
    if (
      !isActiveTournament()
    ) {
      return false;
    }

    const current =
      clean(
        moduleState.site
          .currentMatch
      ).toLowerCase();

    if (!current) {
      return false;
    }

    if (
      definition.id ===
      "GF"
    ) {
      return current.includes(
        "grand finals"
      );
    }

    return current.includes(
      definition.id.toLowerCase()
    );
  }

  function collectWarnings() {
    const warnings = [];

    if (
      moduleState.teamRecord
        .published !== true &&
      moduleState.tournament
        .teamsPublished !== true
    ) {
      warnings.push(
        "Teams are not marked as published for this tournament. Confirm team names before entering results."
      );
    }

    getDefinitions().forEach(
      definition => {
        getMatchWarnings(
          definition
        ).forEach(
          warning => {
            warnings.push(
              `${definition.id}: ${warning}`
            );
          }
        );
      }
    );

    return warnings.slice(
      0,
      8
    );
  }

  function getMatchWarnings(
    definition
  ) {
    const warnings = [];

    const participantA =
      resolveParticipant(
        definition.sourceA
      );

    const participantB =
      resolveParticipant(
        definition.sourceB
      );

    const record =
      getMatchRecord(
        definition
      );

    const automaticWinner =
      scoreWinner(
        participantA.name,
        participantB.name,
        record.scoreA,
        record.scoreB,
        definition.bestOf
      );

    const needed =
      winsNeeded(
        definition.bestOf
      );

    if (
      record.winner &&
      !participantA.placeholder &&
      !participantB.placeholder &&
      ![
        participantA.name,
        participantB.name
      ].includes(
        record.winner
      )
    ) {
      warnings.push(
        "saved winner no longer matches either participant"
      );
    }

    if (
      automaticWinner &&
      record.winner &&
      automaticWinner !==
      record.winner
    ) {
      warnings.push(
        "saved winner conflicts with the completed score"
      );
    }

    if (
      Number(
        record.scoreA
      ) > needed ||
      Number(
        record.scoreB
      ) > needed
    ) {
      warnings.push(
        `score exceeds the BO${definition.bestOf} maximum`
      );
    }

    if (
      (
        participantA.placeholder ||
        participantB.placeholder
      ) &&
      matchHasData(
        definition
      )
    ) {
      warnings.push(
        "result exists before both participants are known"
      );
    }

    return warnings;
  }

  function getTeamName(
    teamKey
  ) {
    const number =
      String(
        teamKey ||
        ""
      ).replace(
        "team",
        ""
      );

    const publicName =
      isActiveTournament()
        ? clean(
            moduleState.site[
              teamKey
            ]
          )
        : "";

    const savedName =
      clean(
        moduleState.teamRecord
          .teamNames?.[
            teamKey
          ]
      );

    return (
      publicName ||
      savedName ||
      `Team ${number}`
    );
  }

  function getTeamLogo(
    teamKey
  ) {
    return safeImageUrl(
      moduleState.teamRecord
        .teamLogos?.[
          teamKey
        ]
    );
  }

  function getFormatType() {
    const explicit =
      clean(
        moduleState.tournament
          .formatType
      );

    if (explicit) {
      return explicit;
    }

    if (
      isActiveTournament() &&
      clean(
        moduleState.site
          .formatType
      )
    ) {
      return clean(
        moduleState.site
          .formatType
      );
    }

    return Number(
      moduleState.tournament
        .teamCount ||
      8
    ) >= 16
      ? "16_single_elim"
      : "8_single_elim";
  }

  function formatDisplayName() {
    return getFormatType() ===
      "16_single_elim"
      ? "16 Team Single Elimination"
      : getFormatType() ===
        "8_single_elim"
        ? "8 Team Single Elimination"
        : "Unsupported";
  }

  function isActiveTournament() {
    return (
      moduleState.tournamentId ===
      moduleState.activeTournamentId
    );
  }

  function readScore(id) {
    const raw =
      clean(
        document.getElementById(
          id
        )?.value
      );

    if (
      raw === ""
    ) {
      return {
        valid: true,
        value: ""
      };
    }

    const number =
      Number(raw);

    return {
      valid:
        Number.isInteger(
          number
        ) &&
        number >= 0,

      value:
        Number.isInteger(
          number
        ) &&
        number >= 0
          ? number
          : ""
    };
  }

  function normalizeScore(
    value
  ) {
    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return "";
    }

    const number =
      Number(value);

    return Number.isFinite(
      number
    )
      ? number
      : "";
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
      ${escapeHtml(
        loadingText
      )}
    `;

    try {
      await action();
    } catch (error) {
      console.error(
        "Bracket action failed:",
        error
      );

      const message =
        context.isPermissionDenied(
          error
        )
          ? "Firebase denied this bracket action. Your Realtime Database rules may need to allow this tournament and site update."
          : error.message ||
            "The bracket action failed.";

      context.showToast(
        message
      );

      window.alert(
        `Bracket & Matches Error\n\n${message}`
      );
    } finally {
      button.disabled = false;
      button.innerHTML =
        originalHtml;
    }
  }

  function showModuleError(
    message
  ) {
    setHtml(
      "nexusBracketCanvas",
      emptyMarkup(
        "Bracket unavailable",
        message,
        "fa-triangle-exclamation"
      )
    );
  }

  function metricMarkup(
    id,
    label,
    value
  ) {
    return `
      <div class="nexus-bracket-context-metric">
        <span>
          ${escapeHtml(label)}
        </span>

        <strong id="${escapeHtml(
          id
        )}">
          ${escapeHtml(value)}
        </strong>
      </div>
    `;
  }

  function loadingMarkup(
    message
  ) {
    return `
      <div class="nexus-bracket-empty-state">
        <i class="fa-solid fa-spinner fa-spin"></i>

        <strong>
          ${escapeHtml(message)}
        </strong>
      </div>
    `;
  }

  function emptyMarkup(
    title,
    message,
    icon
  ) {
    return `
      <div class="nexus-bracket-empty-state">
        <i class="fa-solid ${escapeHtml(
          icon
        )}"></i>

        <strong>
          ${escapeHtml(title)}
        </strong>

        <span>
          ${escapeHtml(message)}
        </span>
      </div>
    `;
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
    value
  ) {
    return String(
      value ??
      ""
    ).trim();
  }

  function initials(
    value
  ) {
    return clean(
      value ||
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

  window.NexusBracket = {
    render,
    cleanup
  };
})();