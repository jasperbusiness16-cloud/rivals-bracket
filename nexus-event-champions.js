(() => {
  "use strict";

  const state = {
    api: null,
    mount: null,
    tournamentId: "",
    model: null,
    dirty: false,
    saving: false
  };

  function clean(
    value,
    fallback = ""
  ) {
    return String(
      value == null
        ? fallback
        : value
    ).trim();
  }

  function number(value) {
    const parsed =
      Number(value);

    return Number.isFinite(
      parsed
    )
      ? parsed
      : 0;
  }

  function escapeHtml(value) {
    if (
      state.api &&
      typeof state.api
        .escapeHtml ===
        "function"
    ) {
      return state.api
        .escapeHtml(value);
    }

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

  function showToast(message) {
    if (
      state.api &&
      typeof state.api
        .showToast ===
        "function"
    ) {
      state.api.showToast(
        message
      );
    }
  }

  function isPermissionDenied(
    error
  ) {
    if (
      state.api &&
      typeof state.api
        .isPermissionDenied ===
        "function"
    ) {
      return state.api
        .isPermissionDenied(
          error
        );
    }

    const message =
      clean(
        error?.message
      ).toLowerCase();

    return message.includes(
      "permission"
    );
  }

  function getTournament() {
    return (
      state.api?.tournament ||
      {}
    );
  }

  function getTeamsRecord() {
    return (
      state.api?.teamsRecord ||
      {}
    );
  }

  function normalizePlayer(
    player,
    index
  ) {
    const record =
      player || {};

    const uid =
      clean(record.uid);

    const name =
      clean(
        record.displayName ||
        record.name ||
        record.rivalsIgn,
        `Player ${index + 1}`
      );

    return {
      key:
        uid
          ? `uid:${uid}`
          : `name:${name.toLowerCase()}:${index}`,

      uid,

      name,

      displayName:
        clean(
          record.displayName,
          name
        ),

      rivalsIgn:
        clean(
          record.rivalsIgn
        ),

      rgId:
        clean(
          record.rgId
        ),

      profileImage:
        clean(
          record.profileImage
        )
    };
  }

  function getTeamCount() {
    const tournament =
      getTournament();

    if (
      number(
        tournament.teamCount
      ) > 0
    ) {
      return number(
        tournament.teamCount
      );
    }

    return (
      tournament.formatType ===
      "16_single_elim"
        ? 16
        : 8
    );
  }

  function getTeams() {
    const teamRecord =
      getTeamsRecord();

    const savedTeams =
      teamRecord.teams ||
      {};

    const savedNames =
      teamRecord.teamNames ||
      {};

    const result = [];

    for (
      let index = 1;
      index <= getTeamCount();
      index += 1
    ) {
      const key =
        `team${index}`;

      const players =
        Array.isArray(
          savedTeams[key]
        )
          ? savedTeams[key]
          : [];

      result.push({
        key,

        name:
          clean(
            savedNames[key],
            `Team ${index}`
          ),

        players:
          players.map(
            normalizePlayer
          ),

        logo:
          clean(
            teamRecord
              .teamLogos?.[key]
          )
      });
    }

    return result;
  }

  function getTeam(teamKey) {
    return (
      getTeams().find(
        team =>
          team.key === teamKey
      ) ||
      null
    );
  }

  function findTeamByName(
    teamName
  ) {
    const normalized =
      clean(
        teamName
      ).toLowerCase();

    if (!normalized) {
      return null;
    }

    return (
      getTeams().find(
        team =>
          team.name
            .toLowerCase() ===
          normalized
      ) ||
      null
    );
  }

  function normalizeScore(value) {
    if (
      value === "" ||
      value == null
    ) {
      return "";
    }

    const parsed =
      Number(value);

    return Number.isFinite(
      parsed
    )
      ? parsed
      : "";
  }

  function getFinalsSuggestion() {
    const tournament =
      getTournament();

    const bracket =
      tournament.bracket ||
      {};

    const semifinalOne =
      bracket.sf1 ||
      {};

    const semifinalTwo =
      bracket.sf2 ||
      {};

    const grandFinal =
      bracket.gf ||
      {};

    const finalistA =
      clean(
        semifinalOne.winner
      );

    const finalistB =
      clean(
        semifinalTwo.winner
      );

    const scoreA =
      normalizeScore(
        grandFinal.scoreA
      );

    const scoreB =
      normalizeScore(
        grandFinal.scoreB
      );

    let winner =
      clean(
        grandFinal.winner
      );

    if (
      !winner &&
      scoreA !== "" &&
      scoreB !== "" &&
      scoreA !== scoreB &&
      (
        scoreA >= 3 ||
        scoreB >= 3
      )
    ) {
      winner =
        scoreA > scoreB
          ? finalistA
          : finalistB;
    }

    let runnerUp = "";

    if (
      winner &&
      winner === finalistA
    ) {
      runnerUp =
        finalistB;
    } else if (
      winner &&
      winner === finalistB
    ) {
      runnerUp =
        finalistA;
    }

    const championTeam =
      findTeamByName(
        winner
      );

    const runnerUpTeam =
      findTeamByName(
        runnerUp
      );

    let finalScore = "";

    if (
      scoreA !== "" &&
      scoreB !== ""
    ) {
      if (
        winner &&
        winner === finalistB
      ) {
        finalScore =
          `${scoreB}–${scoreA}`;
      } else {
        finalScore =
          `${scoreA}–${scoreB}`;
      }
    }

    return {
      championName:
        winner,

      championKey:
        championTeam?.key ||
        "",

      runnerUpName:
        runnerUp,

      runnerUpKey:
        runnerUpTeam?.key ||
        "",

      finalScore,

      finalistA,
      finalistB
    };
  }

  function formatEventDate(
    value
  ) {
    const raw =
      clean(value);

    if (!raw) {
      return "";
    }

    const date =
      new Date(raw);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return raw;
    }

    try {
      return new Intl
        .DateTimeFormat(
          "en-US",
          {
            month: "long",
            day: "numeric",
            year: "numeric"
          }
        )
        .format(date);
    } catch {
      return raw;
    }
  }

  function savedRosterKeys(
    savedPlayers,
    team
  ) {
    if (
      !team ||
      !Array.isArray(
        savedPlayers
      ) ||
      savedPlayers.length === 0
    ) {
      return (
        team?.players.map(
          player =>
            player.key
        ) ||
        []
      );
    }

    const selected =
      new Set();

    savedPlayers.forEach(
      savedPlayer => {
        const savedUid =
          clean(
            savedPlayer?.uid
          );

        const savedName =
          clean(
            savedPlayer?.name ||
            savedPlayer
              ?.displayName
          ).toLowerCase();

        const match =
          team.players.find(
            player => {
              if (
                savedUid &&
                player.uid ===
                savedUid
              ) {
                return true;
              }

              return (
                savedName &&
                player.name
                  .toLowerCase() ===
                  savedName
              );
            }
          );

        if (match) {
          selected.add(
            match.key
          );
        }
      }
    );

    return [...selected];
  }

  function buildInitialModel() {
    const tournament =
      getTournament();

    const draft =
      state.api?.draft ||
      {};

    const published =
      state.api
        ?.publishedRecord ||
      {};

    const source =
      Object.keys(draft).length
        ? draft
        : published;

    const finals =
      getFinalsSuggestion();

    const initialTeamKey =
      clean(
        source.teamKey ||
        finals.championKey
      );

    const selectedTeam =
      getTeam(
        initialTeamKey
      );

    const sourcePlayers =
      Array.isArray(
        source.players
      )
        ? source.players
        : [];

    return {
      eventName:
        clean(
          source.eventName,
          tournament.name ||
          state.tournamentId
        ),

      teamKey:
        initialTeamKey,

      teamName:
        clean(
          source.teamName,
          selectedTeam?.name ||
          finals.championName
        ),

      runnerUpKey:
        clean(
          source.runnerUpKey ||
          finals.runnerUpKey
        ),

      runnerUpName:
        clean(
          source.runnerUpName ||
          source.runnerUp,
          finals.runnerUpName
        ),

      date:
        clean(
          source.date,
          formatEventDate(
            tournament.countdownDate
          )
        ),

      finalScore:
        clean(
          source.finalScore,
          finals.finalScore
        ),

      prizeWon:
        clean(
          source.prizeWon,
          tournament.prizePool ||
          "TBD"
        ),

      finalsMvp:
        clean(
          source.finalsMvp
        ),

      summary:
        clean(
          source.summary
        ),

      rosterKeys:
        savedRosterKeys(
          sourcePlayers,
          selectedTeam
        ),

      publicCreatedAt:
        number(
          source.publicCreatedAt ||
          published.createdAt
        )
    };
  }

  function hasPublishedRecord() {
    return Boolean(
      state.api
        ?.publishedRecord &&
      Object.keys(
        state.api
          .publishedRecord
      ).length
    );
  }

  function safeImageUrl(value) {
    const url =
      clean(value);

    if (!url) {
      return "";
    }

    try {
      const parsed =
        new URL(
          url,
          window.location.href
        );

      if (
        parsed.protocol ===
          "http:" ||
        parsed.protocol ===
          "https:"
      ) {
        return parsed.href;
      }
    } catch {
      return "";
    }

    return "";
  }

  function initials(value) {
    return clean(
      value,
      "RG"
    )
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(
        part =>
          part[0]
      )
      .join("")
      .toUpperCase();
  }

  function avatarMarkup(
    player,
    compact = false
  ) {
    const image =
      safeImageUrl(
        player.profileImage
      );

    return `
      <span class="event-champion-avatar ${
        compact
          ? "compact"
          : ""
      }">
        ${
          image
            ? `
              <img
                src="${escapeHtml(
                  image
                )}"
                alt="${escapeHtml(
                  player.name
                )}"
              >
            `
            : escapeHtml(
                initials(
                  player.name
                )
              )
        }
      </span>
    `;
  }

  function teamOptions(
    selectedKey,
    excludedKey = ""
  ) {
    return `
      <option value="">
        Select Team
      </option>

      ${getTeams()
        .filter(
          team =>
            !excludedKey ||
            team.key !==
              excludedKey
        )
        .map(
          team => `
            <option
              value="${escapeHtml(
                team.key
              )}"
              ${
                team.key ===
                selectedKey
                  ? "selected"
                  : ""
              }
            >
              ${escapeHtml(
                team.name
              )}
            </option>
          `
        )
        .join("")}
    `;
  }

  function selectedRoster() {
    const team =
      getTeam(
        state.model?.teamKey
      );

    if (!team) {
      return [];
    }

    const selected =
      new Set(
        state.model
          .rosterKeys ||
        []
      );

    return team.players.filter(
      player =>
        selected.has(
          player.key
        )
    );
  }

  function rosterMarkup() {
    const team =
      getTeam(
        state.model.teamKey
      );

    if (!team) {
      return `
        <div class="event-champion-empty">
          <i class="fa-solid fa-people-group"></i>
          <strong>Select a champion team</strong>
          <span>
            Its published Team Builder roster will appear here.
          </span>
        </div>
      `;
    }

    if (
      !team.players.length
    ) {
      return `
        <div class="event-champion-empty">
          <i class="fa-solid fa-user-slash"></i>
          <strong>No saved roster</strong>
          <span>
            This team does not currently have players saved in Team Builder.
          </span>
        </div>
      `;
    }

    const selected =
      new Set(
        state.model
          .rosterKeys
      );

    return team.players
      .map(
        player => `
          <label class="event-champion-roster-player">

            <input
              type="checkbox"
              data-champion-roster-key="${escapeHtml(
                player.key
              )}"
              ${
                selected.has(
                  player.key
                )
                  ? "checked"
                  : ""
              }
            >

            ${avatarMarkup(
              player,
              true
            )}

            <span>
              <strong>
                ${escapeHtml(
                  player.name
                )}
              </strong>

              <small>
                ${escapeHtml(
                  player.rivalsIgn ||
                  player.rgId ||
                  "Championship roster"
                )}
              </small>
            </span>

          </label>
        `
      )
      .join("");
  }

  function previewRosterMarkup() {
    const roster =
      selectedRoster();

    if (!roster.length) {
      return `
        <div class="event-champion-preview-empty">
          Championship roster not selected
        </div>
      `;
    }

    return roster
      .map(
        player => `
          <div class="event-champion-preview-player">

            ${avatarMarkup(
              player,
              true
            )}

            <span>
              ${escapeHtml(
                player.name
              )}
            </span>

          </div>
        `
      )
      .join("");
  }

  function previewMarkup() {
    return `
      <div class="event-champion-preview-kicker">
        Current Gauntlet Holders
      </div>

      <span class="event-champion-preview-event">
        ${escapeHtml(
          state.model.eventName ||
          "Rivals Gauntlet Event"
        )}
      </span>

      <h3>
        ${escapeHtml(
          state.model.teamName ||
          "Champion Team"
        )}
      </h3>

      <p>
        They Claimed the Gauntlet
      </p>

      <div class="event-champion-preview-meta">

        <div>
          <span>Prize Won</span>
          <strong>
            ${escapeHtml(
              state.model.prizeWon ||
              "TBD"
            )}
          </strong>
        </div>

        <div>
          <span>Final Result</span>
          <strong>
            ${escapeHtml(
              state.model.finalScore ||
              "TBD"
            )}
          </strong>
        </div>

        <div>
          <span>Crowned</span>
          <strong>
            ${escapeHtml(
              state.model.date ||
              "TBD"
            )}
          </strong>
        </div>

      </div>

      ${
        state.model.runnerUpName
          ? `
            <div class="event-champion-runner-up">
              Runner-Up
              <strong>
                ${escapeHtml(
                  state.model.runnerUpName
                )}
              </strong>
            </div>
          `
          : ""
      }

      ${
        state.model.finalsMvp
          ? `
            <div class="event-champion-mvp">
              <i class="fa-solid fa-star"></i>
              Finals MVP:
              <strong>
                ${escapeHtml(
                  state.model.finalsMvp
                )}
              </strong>
            </div>
          `
          : ""
      }

      ${
        state.model.summary
          ? `
            <div class="event-champion-preview-summary">
              ${escapeHtml(
                state.model.summary
              )}
            </div>
          `
          : ""
      }

      <div class="event-champion-preview-roster-head">
        <strong>
          Championship Roster
        </strong>

        <span>
          ${selectedRoster().length}
          recorded competitors
        </span>
      </div>

      <div class="event-champion-preview-roster">
        ${previewRosterMarkup()}
      </div>
    `;
  }

  function paint() {
    if (!state.mount) {
      return;
    }

    if (!state.tournamentId) {
      state.mount.innerHTML = `
        <article class="nexus-panel event-champion-no-event">

          <i class="fa-solid fa-crown"></i>

          <strong>
            Select a Tournament
          </strong>

          <span>
            Choose a tournament before creating its Hall of Champions record.
          </span>

        </article>
      `;

      return;
    }

    const published =
      hasPublishedRecord();

    state.mount.innerHTML = `
      <article class="nexus-panel event-champion-panel">

        <header class="panel-header event-champion-header">

          <div>
            <h3>
              Hall of Champions
            </h3>

            <span>
              Event Legacy & Championship Archive
            </span>
          </div>

          <span class="event-champion-status ${
            published
              ? "published"
              : (
                  state.dirty
                    ? "unsaved"
                    : "draft"
                )
          }">
            <i class="fa-solid ${
              published
                ? "fa-circle-check"
                : (
                    state.dirty
                      ? "fa-pen"
                      : "fa-file"
                  )
            }"></i>

            ${
              published
                ? "Published"
                : (
                    state.dirty
                      ? "Unsaved Changes"
                      : "Draft"
                  )
            }
          </span>

        </header>

        <div class="event-champion-safety-note">

          <i class="fa-solid fa-shield-halved"></i>

          <div>
            <strong>
              Manual publication required
            </strong>

            <span>
              Saving a Grand Finals winner does not automatically publish a champion. Review the event record and championship roster before placing it in the public Hall.
            </span>
          </div>

        </div>

        <div class="event-champion-toolbar">

          <button
            type="button"
            data-champion-action="use-finals"
          >
            <i class="fa-solid fa-wand-magic-sparkles"></i>
            Use Grand Finals Result
          </button>

          <span>
            Tournament:
            <strong>
              ${escapeHtml(
                getTournament().name ||
                state.tournamentId
              )}
            </strong>
          </span>

        </div>

        <div class="event-champion-layout">

          <section class="event-champion-editor">

            <div class="event-champion-form-grid">

              <label class="event-champion-field">
                <span>Event Name</span>

                <input
                  type="text"
                  data-champion-field="eventName"
                  value="${escapeHtml(
                    state.model.eventName
                  )}"
                  maxlength="120"
                >
              </label>

              <label class="event-champion-field">
                <span>Champion Team</span>

                <select
                  data-champion-action="champion-team"
                >
                  ${teamOptions(
                    state.model.teamKey
                  )}
                </select>
              </label>

              <label class="event-champion-field">
                <span>Runner-Up</span>

                <select
                  data-champion-action="runner-up-team"
                >
                  ${teamOptions(
                    state.model.runnerUpKey,
                    state.model.teamKey
                  )}
                </select>
              </label>

              <label class="event-champion-field">
                <span>Crowned Date</span>

                <input
                  type="text"
                  data-champion-field="date"
                  value="${escapeHtml(
                    state.model.date
                  )}"
                  placeholder="June 27, 2026"
                  maxlength="80"
                >
              </label>

              <label class="event-champion-field">
                <span>Final Score</span>

                <input
                  type="text"
                  data-champion-field="finalScore"
                  value="${escapeHtml(
                    state.model.finalScore
                  )}"
                  placeholder="3–1"
                  maxlength="40"
                >
              </label>

              <label class="event-champion-field">
                <span>Prize Won</span>

                <input
                  type="text"
                  data-champion-field="prizeWon"
                  value="${escapeHtml(
                    state.model.prizeWon
                  )}"
                  placeholder="$250"
                  maxlength="60"
                >
              </label>

              <label class="event-champion-field event-champion-field-wide">
                <span>Finals MVP</span>

                <input
                  type="text"
                  data-champion-field="finalsMvp"
                  value="${escapeHtml(
                    state.model.finalsMvp
                  )}"
                  placeholder="Optional player name"
                  maxlength="100"
                >
              </label>

              <label class="event-champion-field event-champion-field-wide">
                <span>Championship Summary</span>

                <textarea
                  data-champion-field="summary"
                  maxlength="500"
                  placeholder="Optional short summary of the championship run..."
                >${escapeHtml(
                  state.model.summary
                )}</textarea>
              </label>

            </div>

            <section class="event-champion-roster-section">

              <header>

                <div>
                  <span>
                    Championship Roster
                  </span>

                  <strong id="eventChampionRosterCount">
                    ${selectedRoster().length}
                    Selected
                  </strong>
                </div>

                <div>
                  <button
                    type="button"
                    data-champion-action="select-roster"
                  >
                    Select All
                  </button>

                  <button
                    type="button"
                    data-champion-action="clear-roster"
                  >
                    Clear
                  </button>
                </div>

              </header>

              <div
                id="eventChampionRoster"
                class="event-champion-roster-list"
              >
                ${rosterMarkup()}
              </div>

            </section>

            <div class="event-champion-actions">

              <button
                type="button"
                data-champion-action="save-draft"
              >
                <i class="fa-solid fa-floppy-disk"></i>
                Save Hall Draft
              </button>

              <button
                class="primary"
                type="button"
                data-champion-action="publish"
              >
                <i class="fa-solid fa-crown"></i>

                ${
                  published
                    ? "Update Published Champion"
                    : "Publish to Hall of Champions"
                }
              </button>

              ${
                published
                  ? `
                    <button
                      class="danger"
                      type="button"
                      data-champion-action="unpublish"
                    >
                      <i class="fa-solid fa-eye-slash"></i>
                      Unpublish Champion
                    </button>
                  `
                  : ""
              }

            </div>

          </section>

          <aside class="event-champion-preview">

            <header>
              <span>
                Public Hall Preview
              </span>

              <strong>
                ${
                  published
                    ? "Live Entry"
                    : "Not Published"
                }
              </strong>
            </header>

            <div id="eventChampionPreview">
              ${previewMarkup()}
            </div>

          </aside>

        </div>

      </article>
    `;
  }

  function paintPreview() {
    const preview =
      state.mount?.querySelector(
        "#eventChampionPreview"
      );

    if (preview) {
      preview.innerHTML =
        previewMarkup();
    }

    const count =
      state.mount?.querySelector(
        "#eventChampionRosterCount"
      );

    if (count) {
      count.textContent =
        `${selectedRoster().length} Selected`;
    }

    const status =
      state.mount?.querySelector(
        ".event-champion-status"
      );

    if (
      status &&
      state.dirty
    ) {
      status.className =
        "event-champion-status unsaved";

      status.innerHTML = `
        <i class="fa-solid fa-pen"></i>
        Unsaved Changes
      `;
    }
  }

  function markDirty() {
    state.dirty = true;
    paintPreview();
  }

  function updateTextField(
    target
  ) {
    const field =
      clean(
        target.dataset
          .championField
      );

    if (
      !field ||
      !state.model ||
      !Object.prototype
        .hasOwnProperty.call(
          state.model,
          field
        )
    ) {
      return;
    }

    state.model[field] =
      target.value;

    markDirty();
  }

  function handleInput(event) {
    if (
      event.target.matches(
        "[data-champion-field]"
      )
    ) {
      updateTextField(
        event.target
      );
    }
  }

  function chooseChampionTeam(
    teamKey
  ) {
    const team =
      getTeam(teamKey);

    state.model.teamKey =
      team?.key ||
      "";

    state.model.teamName =
      team?.name ||
      "";

    state.model.rosterKeys =
      team?.players.map(
        player =>
          player.key
      ) ||
      [];

    if (
      state.model.runnerUpKey ===
      state.model.teamKey
    ) {
      state.model.runnerUpKey =
        "";

      state.model.runnerUpName =
        "";
    }

    markDirty();
    paint();
  }

  function chooseRunnerUp(
    teamKey
  ) {
    const team =
      getTeam(teamKey);

    state.model.runnerUpKey =
      team?.key ||
      "";

    state.model.runnerUpName =
      team?.name ||
      "";

    markDirty();
  }

  function toggleRosterPlayer(
    key,
    checked
  ) {
    const selected =
      new Set(
        state.model
          .rosterKeys ||
        []
      );

    if (checked) {
      selected.add(key);
    } else {
      selected.delete(key);
    }

    state.model.rosterKeys =
      [...selected];

    markDirty();
  }

  function handleChange(event) {
    const target =
      event.target;

    if (
      target.dataset
        .championAction ===
      "champion-team"
    ) {
      chooseChampionTeam(
        target.value
      );

      return;
    }

    if (
      target.dataset
        .championAction ===
      "runner-up-team"
    ) {
      chooseRunnerUp(
        target.value
      );

      return;
    }

    const rosterKey =
      clean(
        target.dataset
          .championRosterKey
      );

    if (rosterKey) {
      toggleRosterPlayer(
        rosterKey,
        target.checked
      );
    }
  }

  function useFinalsResult() {
    const suggestion =
      getFinalsSuggestion();

    if (
      !suggestion.championName
    ) {
      showToast(
        "No Grand Finals winner is currently saved."
      );

      return;
    }

    state.model.teamKey =
      suggestion.championKey;

    state.model.teamName =
      suggestion.championName;

    state.model.runnerUpKey =
      suggestion.runnerUpKey;

    state.model.runnerUpName =
      suggestion.runnerUpName;

    state.model.finalScore =
      suggestion.finalScore;

    const championTeam =
      getTeam(
        suggestion.championKey
      );

    state.model.rosterKeys =
      championTeam?.players.map(
        player =>
          player.key
      ) ||
      [];

    if (
      !state.model.eventName
    ) {
      state.model.eventName =
        getTournament().name ||
        state.tournamentId;
    }

    if (
      !state.model.date
    ) {
      state.model.date =
        formatEventDate(
          getTournament()
            .countdownDate
        );
    }

    if (
      !state.model.prizeWon
    ) {
      state.model.prizeWon =
        getTournament()
          .prizePool ||
        "TBD";
    }

    state.dirty = true;
    paint();

    showToast(
      "Grand Finals result loaded into the Hall draft."
    );
  }

  function selectEntireRoster() {
    const team =
      getTeam(
        state.model.teamKey
      );

    state.model.rosterKeys =
      team?.players.map(
        player =>
          player.key
      ) ||
      [];

    markDirty();
    paint();
  }

  function clearRoster() {
    state.model.rosterKeys =
      [];

    markDirty();
    paint();
  }

  function syncFieldsFromDom() {
    state.mount
      ?.querySelectorAll(
        "[data-champion-field]"
      )
      .forEach(
        element => {
          const field =
            clean(
              element.dataset
                .championField
            );

          if (
            field &&
            Object.prototype
              .hasOwnProperty.call(
                state.model,
                field
              )
          ) {
            state.model[field] =
              element.value;
          }
        }
      );
  }

  function publicPlayers() {
    return selectedRoster().map(
      player => ({
        uid:
          player.uid,

        name:
          player.name,

        displayName:
          player.displayName,

        rivalsIgn:
          player.rivalsIgn,

        rgId:
          player.rgId,

        profileImage:
          player.profileImage
      })
    );
  }

  function buildCoreRecord() {
    syncFieldsFromDom();

    const championTeam =
      getTeam(
        state.model.teamKey
      );

    const runnerUpTeam =
      getTeam(
        state.model.runnerUpKey
      );

    return {
      tournamentId:
        state.tournamentId,

      eventName:
        clean(
          state.model.eventName
        ),

      teamKey:
        clean(
          state.model.teamKey
        ),

      teamName:
        clean(
          championTeam?.name ||
          state.model.teamName
        ),

      teamLogo:
        clean(
          championTeam?.logo
        ),

      runnerUpKey:
        clean(
          state.model.runnerUpKey
        ),

      runnerUpName:
        clean(
          runnerUpTeam?.name ||
          state.model
            .runnerUpName
        ),

      runnerUp:
        clean(
          runnerUpTeam?.name ||
          state.model
            .runnerUpName
        ),

      date:
        clean(
          state.model.date
        ),

      finalScore:
        clean(
          state.model
            .finalScore
        ),

      prizeWon:
        clean(
          state.model.prizeWon,
          "TBD"
        ),

      finalsMvp:
        clean(
          state.model.finalsMvp
        ),

      summary:
        clean(
          state.model.summary
        ),

      players:
        publicPlayers(),

      formatType:
        clean(
          getTournament()
            .formatType
        )
    };
  }

  function validatePublication(
    record
  ) {
    if (!record.eventName) {
      return "Enter the event name.";
    }

    if (
      !record.teamKey ||
      !record.teamName
    ) {
      return "Select the champion team.";
    }

    if (!record.date) {
      return "Enter the crowned date.";
    }

    if (!record.finalScore) {
      return "Enter the Grand Finals score.";
    }

    if (
      !record.players.length
    ) {
      return "Select at least one championship roster player.";
    }

    return "";
  }

  async function runAction(
    button,
    loadingText,
    action
  ) {
    if (
      state.saving ||
      !button
    ) {
      return;
    }

    const originalHtml =
      button.innerHTML;

    state.saving = true;
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
        "Hall of Champions action failed:",
        error
      );

      showToast(
        isPermissionDenied(
          error
        )
          ? "Firebase denied the Hall of Champions write."
          : (
              error?.message ||
              "The Hall of Champions action failed."
            )
      );
    } finally {
      state.saving = false;
      button.disabled = false;
      button.innerHTML =
        originalHtml;
    }
  }

  async function saveDraft(
    button
  ) {
    await runAction(
      button,
      "Saving Draft...",
      async () => {
        const core =
          buildCoreRecord();

        const timestamp =
          firebase.database
            .ServerValue
            .TIMESTAMP;

        const previousDraft =
          state.api?.draft ||
          {};

        const record = {
          ...core,

          published:
            hasPublishedRecord(),

          publicCreatedAt:
            number(
              state.api
                ?.publishedRecord
                ?.createdAt ||
              state.model
                .publicCreatedAt
            ) ||
            null,

          createdAt:
            previousDraft
              .createdAt ||
            timestamp,

          createdBy:
            previousDraft
              .createdBy ||
            state.api
              ?.currentUser
              ?.uid ||
            null,

          updatedAt:
            timestamp,

          updatedBy:
            state.api
              ?.currentUser
              ?.uid ||
            null
        };

        await state.api
          .database
          .ref(
            `tournaments/${state.tournamentId}/hallOfChampions`
          )
          .set(record);

        state.dirty = false;

        showToast(
          "Hall of Champions draft saved."
        );
      }
    );
  }

  async function publishChampion(
    button
  ) {
    const core =
      buildCoreRecord();

    const validationError =
      validatePublication(
        core
      );

    if (validationError) {
      showToast(
        validationError
      );

      return;
    }

    const finals =
      getFinalsSuggestion();

    if (
      finals.championName &&
      finals.championName
        .toLowerCase() !==
        core.teamName
          .toLowerCase()
    ) {
      const mismatchConfirmed =
        window.confirm(
          `The saved Grand Finals winner is "${finals.championName}", but this Hall entry selects "${core.teamName}".\n\nPublish the manually selected champion anyway?`
        );

      if (!mismatchConfirmed) {
        return;
      }
    }

    const tournamentStatus =
      clean(
        getTournament().status
      );

    if (
      tournamentStatus !==
        "completed" &&
      tournamentStatus !==
        "archived"
    ) {
      const phaseConfirmed =
        window.confirm(
          "This tournament is not currently marked Completed or Archived.\n\nPublish its Hall of Champions entry anyway?"
        );

      if (!phaseConfirmed) {
        return;
      }
    }

    const confirmed =
      window.confirm(
        `Publish "${core.teamName}" as the champion of "${core.eventName}"?\n\nThis will immediately appear in the public Hall of Champions.`
      );

    if (!confirmed) {
      return;
    }

    await runAction(
      button,
      "Publishing...",
      async () => {
        const timestamp =
          firebase.database
            .ServerValue
            .TIMESTAMP;

        const previousDraft =
          state.api?.draft ||
          {};

        const existingPublic =
          state.api
            ?.publishedRecord ||
          {};

        const publicCreatedAt =
          existingPublic.createdAt ||
          state.model
            .publicCreatedAt ||
          getTournament()
            .completedAt ||
          timestamp;

        const draftRecord = {
          ...core,

          published:
            true,

          publicCreatedAt,

          createdAt:
            previousDraft
              .createdAt ||
            timestamp,

          createdBy:
            previousDraft
              .createdBy ||
            state.api
              ?.currentUser
              ?.uid ||
            null,

          publishedAt:
            timestamp,

          publishedBy:
            state.api
              ?.currentUser
              ?.uid ||
            null,

          updatedAt:
            timestamp,

          updatedBy:
            state.api
              ?.currentUser
              ?.uid ||
            null
        };

        const publicRecord = {
          ...core,

          published:
            true,

          createdAt:
            publicCreatedAt,

          publishedAt:
            timestamp,

          publishedBy:
            state.api
              ?.currentUser
              ?.uid ||
            null,

          updatedAt:
            timestamp,

          updatedBy:
            state.api
              ?.currentUser
              ?.uid ||
            null
        };

        await state.api
          .database
          .ref()
          .update({
            [`tournaments/${state.tournamentId}/hallOfChampions`]:
              draftRecord,

            [`champions/${state.tournamentId}`]:
              publicRecord
          });

        state.model
          .publicCreatedAt =
          number(
            existingPublic
              .createdAt ||
            state.model
              .publicCreatedAt
          );

        state.dirty = false;

        showToast(
          `${core.teamName} was published to the Hall of Champions.`
        );
      }
    );
  }

  async function unpublishChampion(
    button
  ) {
    if (
      !hasPublishedRecord()
    ) {
      return;
    }

    const championName =
      clean(
        state.api
          ?.publishedRecord
          ?.teamName,
        state.model.teamName
      );

    const confirmed =
      window.confirm(
        `Remove "${championName}" from the public Hall of Champions?\n\nThe private Event Control draft will remain saved.`
      );

    if (!confirmed) {
      return;
    }

    await runAction(
      button,
      "Unpublishing...",
      async () => {
        const timestamp =
          firebase.database
            .ServerValue
            .TIMESTAMP;

        await state.api
          .database
          .ref()
          .update({
            [`champions/${state.tournamentId}`]:
              null,

            [`tournaments/${state.tournamentId}/hallOfChampions/published`]:
              false,

            [`tournaments/${state.tournamentId}/hallOfChampions/unpublishedAt`]:
              timestamp,

            [`tournaments/${state.tournamentId}/hallOfChampions/unpublishedBy`]:
              state.api
                ?.currentUser
                ?.uid ||
              null,

            [`tournaments/${state.tournamentId}/hallOfChampions/updatedAt`]:
              timestamp,

            [`tournaments/${state.tournamentId}/hallOfChampions/updatedBy`]:
              state.api
                ?.currentUser
                ?.uid ||
              null
          });

        state.dirty = false;

        showToast(
          "Champion removed from the public Hall."
        );
      }
    );
  }

  function handleClick(event) {
    const button =
      event.target.closest(
        "[data-champion-action]"
      );

    if (
      !button ||
      !state.mount
        ?.contains(button)
    ) {
      return;
    }

    const action =
      button.dataset
        .championAction;

    switch (action) {
      case "use-finals":
        useFinalsResult();
        break;

      case "select-roster":
        selectEntireRoster();
        break;

      case "clear-roster":
        clearRoster();
        break;

      case "save-draft":
        void saveDraft(button);
        break;

      case "publish":
        void publishChampion(
          button
        );
        break;

      case "unpublish":
        void unpublishChampion(
          button
        );
        break;

      default:
        break;
    }
  }

  function bindEvents() {
    state.mount?.addEventListener(
      "click",
      handleClick
    );

    state.mount?.addEventListener(
      "input",
      handleInput
    );

    state.mount?.addEventListener(
      "change",
      handleChange
    );
  }

  function unbindEvents() {
    state.mount?.removeEventListener(
      "click",
      handleClick
    );

    state.mount?.removeEventListener(
      "input",
      handleInput
    );

    state.mount?.removeEventListener(
      "change",
      handleChange
    );
  }

  function render(api) {
    const nextMount =
      api?.mount;

    if (!nextMount) {
      return;
    }

    const nextTournamentId =
      clean(
        api.tournamentId
      );

    const tournamentChanged =
      nextTournamentId !==
      state.tournamentId;

    unbindEvents();

    state.api = api;
    state.mount = nextMount;
    state.tournamentId =
      nextTournamentId;

    if (
      tournamentChanged ||
      !state.model ||
      !state.dirty
    ) {
      state.model =
        buildInitialModel();

      state.dirty =
        false;
    }

    paint();
    bindEvents();
  }

  function hasUnsavedChanges() {
    return state.dirty;
  }

  function cleanup() {
    unbindEvents();

    state.api = null;
    state.mount = null;
    state.tournamentId = "";
    state.model = null;
    state.dirty = false;
    state.saving = false;
  }

  window.NexusEventChampions = {
    render,
    cleanup,
    hasUnsavedChanges
  };
})();
