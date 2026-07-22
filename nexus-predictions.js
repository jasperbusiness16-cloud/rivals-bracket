(function () {
  "use strict";

  const state = {
    api: null,
    database: null,
    content: null,
    currentUser: null,
    roleId: "",

    globalRefs: [],
    tournamentRefs: [],

    activeTournamentId: "",
    selectedTournamentId: "",

    tournaments: {},
    tournament: {},
    teamData: {},
    siteData: {},
    upNextData: {},

    brackets: {},
    drafts: {},
    livePredictions: {},
    predictionResults: {},
    predictionSettings: {},
    bracketData: {},
    legacyChampionPredictions: {},

    selectedMatchKey: "",
    matchSelectionInitialized: false,

    loading: true
  };

  const MATCHES_8 = [
    "QF1",
    "QF2",
    "QF3",
    "QF4",
    "SF1",
    "SF2",
    "GRAND"
  ];

  const MATCHES_16 = [
    "R16-1",
    "R16-2",
    "R16-3",
    "R16-4",
    "R16-5",
    "R16-6",
    "R16-7",
    "R16-8",
    "QF1",
    "QF2",
    "QF3",
    "QF4",
    "SF1",
    "SF2",
    "GRAND"
  ];

  function clean(value, fallback = "") {
    return String(
      value ?? fallback
    ).trim();
  }

  function escapeHtml(value) {
    if (
      state.api &&
      typeof state.api.escapeHtml ===
        "function"
    ) {
      return state.api.escapeHtml(
        value
      );
    }

    return String(
      value ?? ""
    )
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll(
        "'",
        "&#039;"
      );
  }

  function showToast(message) {
    if (
      state.api &&
      typeof state.api.showToast ===
        "function"
    ) {
      state.api.showToast(
        message
      );

      return;
    }

    console.log(message);
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
        .isPermissionDenied(error);
    }

    return (
      clean(
        error?.code
      ).toUpperCase() ===
        "PERMISSION_DENIED" ||
      clean(
        error?.message
      )
        .toLowerCase()
        .includes("permission")
    );
  }

  function formatNumber(value) {
    return Number(
      value || 0
    ).toLocaleString();
  }

  function formatDate(value) {
    const timestamp =
      Number(value || 0);

    if (!timestamp) {
      return "—";
    }

    try {
      return new Intl.DateTimeFormat(
        "en-US",
        {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit"
        }
      ).format(
        new Date(timestamp)
      );
    } catch {
      return "—";
    }
  }

  function listen(
    collection,
    ref,
    event,
    callback
  ) {
    ref.on(
      event,
      callback,
      error => {
        console.error(
          "Prediction listener failed:",
          error
        );

        showToast(
          isPermissionDenied(error)
            ? "Firebase rules blocked prediction data."
            : "Prediction data could not be loaded."
        );
      }
    );

    collection.push({
      ref,
      event,
      callback
    });
  }

  function detachRefs(
    collection
  ) {
    collection.forEach(
      ({
        ref,
        event,
        callback
      }) => {
        ref.off(
          event,
          callback
        );
      }
    );

    collection.length = 0;
  }

  function getTournamentName(
    tournamentId
  ) {
    const record =
      state.tournaments[
        tournamentId
      ] || {};

    return (
      clean(
        record.name ||
          record.eventName
      ) ||
      tournamentId
    );
  }

  function getBracketSize() {
    const format = clean(
      state.tournament
        .formatType ||
        (
          state.selectedTournamentId ===
          state.activeTournamentId
            ? state.siteData
                .formatType
            : ""
        )
    ).toLowerCase();

    if (
      format.includes("16")
    ) {
      return 16;
    }

    if (
      format.includes("8")
    ) {
      return 8;
    }

    const teams =
      state.teamData.teams ||
      {};

    const count =
      Object.keys(
        teams
      ).length;

    return count > 8
      ? 16
      : 8;
  }

  function getMatchOrder() {
    return getBracketSize() ===
      16
      ? MATCHES_16
      : MATCHES_8;
  }

  function normalizeMatchKey(
    value
  ) {
    let source = value;

    if (
      source &&
      typeof source ===
        "object"
    ) {
      source =
        source.label ||
        source.fullMatchId ||
        source.matchId ||
        source.id ||
        "";
    }

    const cleaned = clean(
      source
    );

    if (!cleaned) {
      return "";
    }

    if (
      /grand/i.test(cleaned)
    ) {
      return "GRAND";
    }

    const firstPart =
      cleaned
        .split("•")[0]
        .trim()
        .toUpperCase();

    const r16 =
      firstPart.match(
        /^R16[-\s]?(\d+)$/
      );

    if (r16) {
      return `R16-${r16[1]}`;
    }

    const qf =
      firstPart.match(
        /^QF[-\s]?(\d+)$/
      );

    if (qf) {
      return `QF${qf[1]}`;
    }

    const sf =
      firstPart.match(
        /^SF[-\s]?(\d+)$/
      );

    if (sf) {
      return `SF${sf[1]}`;
    }

    return firstPart;
  }

  function getMatchLabel(
    matchKey
  ) {
    if (
      matchKey === "GRAND"
    ) {
      return "Grand Finals • Bo5";
    }

    return `${matchKey} • Bo3`;
  }

  function getStorageKey(
    matchKey
  ) {
    if (
      matchKey === "GRAND"
    ) {
      return "gf";
    }

    const r16 =
      matchKey.match(
        /^R16-(\d+)$/
      );

    if (r16) {
      return `r16m${r16[1]}`;
    }

    return matchKey
      .toLowerCase();
  }

  function getLegacyConfig(
    matchKey
  ) {
    if (
      matchKey === "GRAND"
    ) {
      return {
        scoreA:
          "gfTeam1Score",
        scoreB:
          "gfTeam2Score",
        winner:
          "grandWinner"
      };
    }

    const r16 =
      matchKey.match(
        /^R16-(\d+)$/
      );

    if (r16) {
      return {
        scoreA:
          `r16m${r16[1]}Team1Score`,
        scoreB:
          `r16m${r16[1]}Team2Score`,
        winner:
          `r16m${r16[1]}Winner`
      };
    }

    const qf =
      matchKey.match(
        /^QF(\d+)$/
      );

    if (qf) {
      return {
        scoreA:
          `qf${qf[1]}Team1Score`,
        scoreB:
          `qf${qf[1]}Team2Score`,
        winner:
          `qf${qf[1]}Winner`
      };
    }

    const sf =
      matchKey.match(
        /^SF(\d+)$/
      );

    if (sf) {
      return {
        scoreA:
          `sf${sf[1]}Team1Score`,
        scoreB:
          `sf${sf[1]}Team2Score`,
        winner:
          `sf${sf[1]}Winner`
      };
    }

    return null;
  }

  function getTeamCount() {
    const bracketSize =
      getBracketSize();

    return bracketSize ===
      16
      ? 16
      : 8;
  }

  function getTeamsArray() {
    const count =
      getTeamCount();

    const teamsObject =
      state.teamData.teams ||
      {};

    const names =
      state.teamData
        .teamNames || {};

    const logos =
      state.teamData
        .teamLogos ||
      state.teamData.logos ||
      {};

    return Array.from(
      {
        length: count
      },
      (
        _,
        index
      ) => {
        const teamNumber =
          index + 1;

        const teamKey =
          `team${teamNumber}`;

        const activeSiteName =
          state.selectedTournamentId ===
          state.activeTournamentId
            ? clean(
                state.siteData[
                  teamKey
                ]
              )
            : "";

        return {
          teamKey,
          seed:
            teamNumber,
          teamName:
            clean(
              names[
                teamKey
              ]
            ) ||
            activeSiteName ||
            `Team ${teamNumber}`,
          logo:
            clean(
              logos[
                teamKey
              ]
            ),
          players:
            Array.isArray(
              teamsObject[
                teamKey
              ]
            )
              ? teamsObject[
                  teamKey
                ]
              : []
        };
      }
    );
  }

  function getTeam(
    teamKey
  ) {
    return (
      getTeamsArray().find(
        team =>
          team.teamKey ===
          teamKey
      ) || null
    );
  }

  function getTeamName(
    teamKey
  ) {
    if (!teamKey) {
      return "TBD";
    }

    return (
      getTeam(
        teamKey
      )?.teamName ||
      teamKey
    );
  }

  function normalizeTeamKey(
    value
  ) {
    const cleaned =
      clean(value);

    if (!cleaned) {
      return "";
    }

    const direct =
      getTeam(cleaned);

    if (direct) {
      return direct.teamKey;
    }

    const lowered =
      cleaned.toLowerCase();

    const matching =
      getTeamsArray().find(
        team =>
          clean(
            team.teamName
          ).toLowerCase() ===
          lowered
      );

    return (
      matching?.teamKey ||
      cleaned
    );
  }

  function getCanonicalMatchRecord(
    matchKey
  ) {
    const storageKey =
      getStorageKey(
        matchKey
      );

    return (
      state.bracketData[
        storageKey
      ] || {}
    );
  }

  function hasStoredValue(
    object,
    key
  ) {
    return (
      object &&
      Object.prototype
        .hasOwnProperty.call(
          object,
          key
        )
    );
  }

  function getOfficialMatchRecord(
    matchKey
  ) {
    const canonical =
      getCanonicalMatchRecord(
        matchKey
      );

    const legacy =
      getLegacyConfig(
        matchKey
      );

    const useSite =
      state.selectedTournamentId ===
      state.activeTournamentId;

    const scoreA =
      hasStoredValue(
        canonical,
        "scoreA"
      )
        ? clean(
            canonical.scoreA
          )
        : (
            useSite &&
            legacy
              ? clean(
                  state.siteData[
                    legacy.scoreA
                  ]
                )
              : ""
          );

    const scoreB =
      hasStoredValue(
        canonical,
        "scoreB"
      )
        ? clean(
            canonical.scoreB
          )
        : (
            useSite &&
            legacy
              ? clean(
                  state.siteData[
                    legacy.scoreB
                  ]
                )
              : ""
          );

    const winnerValue =
      hasStoredValue(
        canonical,
        "winner"
      )
        ? clean(
            canonical.winner
          )
        : (
            useSite &&
            legacy
              ? clean(
                  state.siteData[
                    legacy.winner
                  ]
                )
              : ""
          );

    return {
      scoreA,
      scoreB,
      winner:
        normalizeTeamKey(
          winnerValue
        )
    };
  }

  function getOfficialWinner(
    matchKey
  ) {
    return getOfficialMatchRecord(
      matchKey
    ).winner;
  }

  function resolveMatchTeams(
    matchKey,
    seen = new Set()
  ) {
    if (
      seen.has(matchKey)
    ) {
      return [
        "",
        ""
      ];
    }

    seen.add(matchKey);

    const teams =
      getTeamsArray();

    const bracketSize =
      getBracketSize();

    if (
      bracketSize === 16 &&
      /^R16-\d+$/.test(
        matchKey
      )
    ) {
      const matchNumber =
        Number(
          matchKey.split(
            "-"
          )[1]
        );

      const firstIndex =
        (
          matchNumber -
          1
        ) * 2;

      return [
        teams[
          firstIndex
        ]?.teamKey || "",
        teams[
          firstIndex + 1
        ]?.teamKey || ""
      ];
    }

    if (
      bracketSize === 8 &&
      /^QF\d+$/.test(
        matchKey
      )
    ) {
      const matchNumber =
        Number(
          matchKey.replace(
            "QF",
            ""
          )
        );

      const firstIndex =
        (
          matchNumber -
          1
        ) * 2;

      return [
        teams[
          firstIndex
        ]?.teamKey || "",
        teams[
          firstIndex + 1
        ]?.teamKey || ""
      ];
    }

    if (
      bracketSize === 16 &&
      /^QF\d+$/.test(
        matchKey
      )
    ) {
      const matchNumber =
        Number(
          matchKey.replace(
            "QF",
            ""
          )
        );

      const firstR16 =
        (
          matchNumber -
          1
        ) * 2 +
        1;

      return [
        getOfficialWinner(
          `R16-${firstR16}`
        ),
        getOfficialWinner(
          `R16-${firstR16 + 1}`
        )
      ];
    }

    if (
      matchKey === "SF1"
    ) {
      return [
        getOfficialWinner(
          "QF1"
        ),
        getOfficialWinner(
          "QF2"
        )
      ];
    }

    if (
      matchKey === "SF2"
    ) {
      return [
        getOfficialWinner(
          "QF3"
        ),
        getOfficialWinner(
          "QF4"
        )
      ];
    }

    if (
      matchKey === "GRAND"
    ) {
      return [
        getOfficialWinner(
          "SF1"
        ),
        getOfficialWinner(
          "SF2"
        )
      ];
    }

    return [
      "",
      ""
    ];
  }

  function getCurrentMatchKey() {
    if (
      state.selectedTournamentId !==
      state.activeTournamentId
    ) {
      return "";
    }

    return normalizeMatchKey(
      state.siteData
        .currentMatch
    );
  }

  function getUpNextMatchKey() {
    if (
      state.selectedTournamentId !==
      state.activeTournamentId
    ) {
      return "";
    }

    return normalizeMatchKey(
      state.upNextData
    );
  }

  function getMatchIndex(
    matchKey
  ) {
    return getMatchOrder()
      .indexOf(
        matchKey
      );
  }

  function tournamentHasStarted() {
    const current =
      getCurrentMatchKey();

    return (
      current &&
      getMatchIndex(
        current
      ) >= 0
    );
  }

  function isPickemLocked() {
    return Boolean(
      tournamentHasStarted() ||
      state.predictionSettings
        .pickemLocked
    );
  }

  function getSubmittedEntries() {
    return Object.values(
      state.brackets || {}
    ).filter(
      entry =>
        entry &&
        entry.submitted
    );
  }

  function getDraftEntries() {
    return Object.values(
      state.drafts || {}
    ).filter(Boolean);
  }

  function getFinalizedMatches() {
    return getMatchOrder().filter(
      matchKey =>
        Boolean(
          getOfficialWinner(
            matchKey
          )
        )
    );
  }

  function bracketIsAlive(
    entry
  ) {
    if (
      getBracketSize() !== 8
    ) {
      return null;
    }

    const finalized =
      getFinalizedMatches();

    return finalized.every(
      matchKey =>
        clean(
          entry?.picks?.[
            matchKey
          ]
        ) ===
        getOfficialWinner(
          matchKey
        )
    );
  }

  function getPerfectRemaining() {
    if (
      getBracketSize() !== 8
    ) {
      return null;
    }

    const eligible =
      getSubmittedEntries().filter(
        entry =>
          entry
            .perfectEligible !==
          false
      );

    return eligible.filter(
      entry =>
        bracketIsAlive(
          entry
        )
    ).length;
  }

  function getChampionStats() {
    const submitted =
      getSubmittedEntries();

    const stats = new Map();

    submitted.forEach(
      entry => {
        const teamKey =
          normalizeTeamKey(
            entry.championPick ||
            entry.picks
              ?.GRAND
          );

        if (!teamKey) {
          return;
        }

        stats.set(
          teamKey,
          (
            stats.get(
              teamKey
            ) || 0
          ) + 1
        );
      }
    );

    const total =
      submitted.length;

    return Array.from(
      stats.entries()
    )
      .map(
        ([
          teamKey,
          count
        ]) => ({
          teamKey,
          teamName:
            getTeamName(
              teamKey
            ),
          count,
          percent:
            total
              ? Math.round(
                  (
                    count /
                    total
                  ) * 100
                )
              : 0
        })
      )
      .sort(
        (
          a,
          b
        ) =>
          b.count -
          a.count
      );
  }

  function getResultRecord(
    matchKey,
    questionId
  ) {
    return (
      state.predictionResults
        ?.[matchKey]
        ?.[questionId] ??
      null
    );
  }

  function getResultAnswer(
    matchKey,
    questionId
  ) {
    const record =
      getResultRecord(
        matchKey,
        questionId
      );

    if (
      record &&
      typeof record ===
        "object"
    ) {
      return clean(
        record.answer
      );
    }

    return clean(record);
  }

  function getLiveQuestionRecords(
    matchKey,
    questionId
  ) {
    return Object.values(
      state.livePredictions
        ?.[matchKey]
        ?.[questionId] ||
      {}
    ).filter(Boolean);
  }

  function getExactScoreOptions(
    matchKey
  ) {
    if (
      matchKey === "GRAND"
    ) {
      return [
        "3-0",
        "3-1",
        "3-2",
        "0-3",
        "1-3",
        "2-3"
      ];
    }

    return [
      "2-0",
      "2-1",
      "0-2",
      "1-2"
    ];
  }

  function getQuestionOptions(
    matchKey,
    questionId
  ) {
    if (
      questionId ===
      "map1Winner"
    ) {
      return resolveMatchTeams(
        matchKey
      )
        .filter(Boolean)
        .map(
          teamKey => ({
            value:
              teamKey,
            label:
              getTeamName(
                teamKey
              )
          })
        );
    }

    return getExactScoreOptions(
      matchKey
    ).map(
      score => ({
        value: score,
        label: score
      })
    );
  }

  function getAnswerLabel(
    matchKey,
    questionId,
    answer
  ) {
    if (
      questionId ===
      "map1Winner"
    ) {
      return getTeamName(
        normalizeTeamKey(
          answer
        )
      );
    }

    return answer;
  }

  function getQuestionBreakdown(
    matchKey,
    questionId
  ) {
    const records =
      getLiveQuestionRecords(
        matchKey,
        questionId
      );

    const options =
      getQuestionOptions(
        matchKey,
        questionId
      );

    const optionMap =
      new Map(
        options.map(
          option => [
            option.value,
            option
          ]
        )
      );

    records.forEach(
      record => {
        const answer =
          clean(
            record.answer
          );

        if (
          answer &&
          !optionMap.has(
            answer
          )
        ) {
          optionMap.set(
            answer,
            {
              value:
                answer,
              label:
                getAnswerLabel(
                  matchKey,
                  questionId,
                  answer
                )
            }
          );
        }
      }
    );

    return Array.from(
      optionMap.values()
    ).map(
      option => {
        const count =
          records.filter(
            record =>
              clean(
                record.answer
              ) ===
              option.value
          ).length;

        return {
          ...option,
          count,
          total:
            records.length,
          percent:
            records.length
              ? Math.round(
                  (
                    count /
                    records.length
                  ) * 100
                )
              : 0
        };
      }
    );
  }

  function getGradingPreview(
    matchKey,
    questionId
  ) {
    const answer =
      getResultAnswer(
        matchKey,
        questionId
      );

    const records =
      getLiveQuestionRecords(
        matchKey,
        questionId
      );

    if (!answer) {
      return {
        total:
          records.length,
        correct: 0,
        incorrect: 0
      };
    }

    const correct =
      records.filter(
        record =>
          clean(
            record.answer
          ) === answer
      ).length;

    return {
      total:
        records.length,
      correct,
      incorrect:
        records.length -
        correct
    };
  }

  function getOfficialScore(
    matchKey
  ) {
    const official =
      getOfficialMatchRecord(
        matchKey
      );

    if (
      official.scoreA ===
        "" ||
      official.scoreB ===
        ""
    ) {
      return "";
    }

    return `${official.scoreA}-${official.scoreB}`;
  }

  function getMatchState(
    matchKey
  ) {
    const current =
      getCurrentMatchKey();

    const next =
      getUpNextMatchKey();

    if (
      matchKey === current
    ) {
      return {
        label:
          "Current Match",
        className:
          "live"
      };
    }

    if (
      matchKey === next
    ) {
      return {
        label:
          "Predictions Open",
        className:
          "open"
      };
    }

    const currentIndex =
      getMatchIndex(
        current
      );

    const matchIndex =
      getMatchIndex(
        matchKey
      );

    if (
      currentIndex >= 0 &&
      matchIndex >= 0 &&
      currentIndex >
        matchIndex
    ) {
      return {
        label:
          "Completed",
        className:
          "complete"
      };
    }

    return {
      label:
        "Inactive",
      className:
        "inactive"
    };
  }

  function getAvailableMatches() {
    const keys =
      new Set(
        getMatchOrder()
      );

    Object.keys(
      state.livePredictions ||
      {}
    ).forEach(
      key => {
        const normalized =
          normalizeMatchKey(
            key
          );

        if (normalized) {
          keys.add(
            normalized
          );
        }
      }
    );

    Object.keys(
      state.predictionResults ||
      {}
    ).forEach(
      key => {
        const normalized =
          normalizeMatchKey(
            key
          );

        if (normalized) {
          keys.add(
            normalized
          );
        }
      }
    );

    return Array.from(
      keys
    ).sort(
      (
        a,
        b
      ) => {
        const order =
          getMatchOrder();

        const aIndex =
          order.indexOf(a);

        const bIndex =
          order.indexOf(b);

        if (
          aIndex === -1
        ) {
          return 1;
        }

        if (
          bIndex === -1
        ) {
          return -1;
        }

        return (
          aIndex -
          bIndex
        );
      }
    );
  }

  function ensureSelectedMatch() {
    const available =
      getAvailableMatches();

    if (
      state.selectedMatchKey &&
      available.includes(
        state.selectedMatchKey
      )
    ) {
      return;
    }

    const preferred = [
      getUpNextMatchKey(),
      getCurrentMatchKey(),
      ...available.filter(
        matchKey =>
          getLiveQuestionRecords(
            matchKey,
            "map1Winner"
          ).length ||
          getLiveQuestionRecords(
            matchKey,
            "exactScore"
          ).length
      ),
      ...available
    ].find(Boolean);

    state.selectedMatchKey =
      preferred || "";
  }

  function selectOptionsMarkup(
    options,
    selected,
    placeholder
  ) {
    return `
      <option value="">
        ${escapeHtml(
          placeholder
        )}
      </option>

      ${options
        .map(
          option => `
            <option
              value="${escapeHtml(
                option.value
              )}"
              ${
                option.value ===
                selected
                  ? "selected"
                  : ""
              }
            >
              ${escapeHtml(
                option.label
              )}
            </option>
          `
        )
        .join("")}
    `;
  }

  function breakdownMarkup(
    matchKey,
    questionId
  ) {
    const breakdown =
      getQuestionBreakdown(
        matchKey,
        questionId
      );

    if (
      !breakdown.length ||
      !breakdown.some(
        item =>
          item.total
      )
    ) {
      return `
        <div class="nexus-prediction-empty-small">
          No answers submitted.
        </div>
      `;
    }

    return breakdown
      .map(
        item => `
          <div class="nexus-prediction-breakdown-row">
            <div class="nexus-prediction-breakdown-head">
              <strong>
                ${escapeHtml(
                  item.label
                )}
              </strong>

              <span>
                ${item.count}
                •
                ${item.percent}%
              </span>
            </div>

            <div class="nexus-prediction-progress">
              <span
                style="width:${item.percent}%"
              ></span>
            </div>
          </div>
        `
      )
      .join("");
  }

  function championStatsMarkup() {
    const stats =
      getChampionStats();

    if (!stats.length) {
      return `
        <div class="nexus-prediction-empty-small">
          No submitted champion picks.
        </div>
      `;
    }

    return stats
      .map(
        stat => `
          <div class="nexus-prediction-breakdown-row">
            <div class="nexus-prediction-breakdown-head">
              <strong>
                ${escapeHtml(
                  stat.teamName
                )}
              </strong>

              <span>
                ${stat.count}
                •
                ${stat.percent}%
              </span>
            </div>

            <div class="nexus-prediction-progress">
              <span
                style="width:${stat.percent}%"
              ></span>
            </div>
          </div>
        `
      )
      .join("");
  }

  function bracketEntriesMarkup() {
    const entries =
      getSubmittedEntries()
        .sort(
          (
            a,
            b
          ) =>
            Number(
              b.updatedAt ||
              b.submittedAt ||
              0
            ) -
            Number(
              a.updatedAt ||
              a.submittedAt ||
              0
            )
        );

    if (!entries.length) {
      return `
        <div class="nexus-prediction-empty">
          <i class="fa-solid fa-diagram-project"></i>

          <strong>
            No Submitted Brackets
          </strong>

          <span>
            Player submissions will appear here.
          </span>
        </div>
      `;
    }

    return `
      <div class="nexus-prediction-table-wrap">
        <table class="nexus-prediction-table">
          <thead>
            <tr>
              <th>Predictor</th>
              <th>Champion Pick</th>
              <th>Perfect Status</th>
              <th>Updated</th>
            </tr>
          </thead>

          <tbody>
            ${entries
              .map(
                entry => {
                  const champion =
                    normalizeTeamKey(
                      entry.championPick ||
                      entry.picks
                        ?.GRAND
                    );

                  const alive =
                    bracketIsAlive(
                      entry
                    );

                  let status =
                    "Eligible";

                  let statusClass =
                    "eligible";

                  if (
                    alive === false
                  ) {
                    status =
                      "Eliminated";

                    statusClass =
                      "eliminated";
                  }

                  if (
                    alive === null
                  ) {
                    status =
                      "16-Team Unsupported";

                    statusClass =
                      "warning";
                  }

                  return `
                    <tr>
                      <td>
                        <strong>
                          ${escapeHtml(
                            entry.displayName ||
                            entry.rgId ||
                            "Player"
                          )}
                        </strong>

                        <span>
                          ${escapeHtml(
                            entry.rgId ||
                            entry.uid ||
                            ""
                          )}
                        </span>
                      </td>

                      <td>
                        ${escapeHtml(
                          getTeamName(
                            champion
                          )
                        )}
                      </td>

                      <td>
                        <span class="nexus-prediction-entry-status ${statusClass}">
                          ${escapeHtml(
                            status
                          )}
                        </span>
                      </td>

                      <td>
                        ${escapeHtml(
                          formatDate(
                            entry.updatedAt ||
                            entry.submittedAt
                          )
                        )}
                      </td>
                    </tr>
                  `;
                }
              )
              .join("")}
          </tbody>
        </table>
      </div>
    `;
  }

  function renderView() {
    if (!state.content) {
      return;
    }

    ensureSelectedMatch();

    const bracketSize =
      getBracketSize();

    const submittedCount =
      getSubmittedEntries()
        .length;

    const draftCount =
      getDraftEntries()
        .length;

    const perfectRemaining =
      getPerfectRemaining();

    const currentMatch =
      getCurrentMatchKey();

    const upNext =
      getUpNextMatchKey();

    const forcedLock =
      Boolean(
        state.predictionSettings
          .pickemLocked
      );

    const pickemLocked =
      isPickemLocked();

    const selectedMatch =
      state.selectedMatchKey;

    const matchState =
      selectedMatch
        ? getMatchState(
            selectedMatch
          )
        : {
            label:
              "No Match",
            className:
              "inactive"
          };

    const participants =
      selectedMatch
        ? resolveMatchTeams(
            selectedMatch
          )
        : [
            "",
            ""
          ];

    const map1Options =
      selectedMatch
        ? getQuestionOptions(
            selectedMatch,
            "map1Winner"
          )
        : [];

    const exactOptions =
      selectedMatch
        ? getQuestionOptions(
            selectedMatch,
            "exactScore"
          )
        : [];

    const map1Answer =
      selectedMatch
        ? getResultAnswer(
            selectedMatch,
            "map1Winner"
          )
        : "";

    const exactAnswer =
      selectedMatch
        ? getResultAnswer(
            selectedMatch,
            "exactScore"
          )
        : "";

    const officialScore =
      selectedMatch
        ? getOfficialScore(
            selectedMatch
          )
        : "";

    const officialWinner =
      selectedMatch
        ? getOfficialWinner(
            selectedMatch
          )
        : "";

    const mapPreview =
      selectedMatch
        ? getGradingPreview(
            selectedMatch,
            "map1Winner"
          )
        : {
            total: 0,
            correct: 0,
            incorrect: 0
          };

    const exactPreview =
      selectedMatch
        ? getGradingPreview(
            selectedMatch,
            "exactScore"
          )
        : {
            total: 0,
            correct: 0,
            incorrect: 0
          };

    const exactConflict =
      Boolean(
        exactAnswer &&
        officialScore &&
        exactAnswer !==
          officialScore
      );

    const legacyCount =
      Object.keys(
        state.legacyChampionPredictions ||
        {}
      ).length;

    const matchOptions =
      getAvailableMatches();

    state.content.innerHTML = `
      <section class="nexus-predictions">
        <header class="nexus-predictions-header">
          <div>
            <span class="nexus-predictions-eyebrow">
              Tournament Intelligence
            </span>

            <h2>
              Prediction Operations
            </h2>

            <p>
              Review Pick’em submissions, live answers and correct-answer records without issuing RP payouts.
            </p>
          </div>

          <div class="nexus-predictions-header-actions">
            <label class="nexus-predictions-select-field">
              <span>Tournament</span>

              <select
                id="nexusPredictionTournament"
              >
                ${Object.keys(
                  state.tournaments ||
                  {}
                )
                  .sort(
                    (
                      a,
                      b
                    ) =>
                      getTournamentName(
                        a
                      ).localeCompare(
                        getTournamentName(
                          b
                        )
                      )
                  )
                  .map(
                    tournamentId => `
                      <option
                        value="${escapeHtml(
                          tournamentId
                        )}"
                        ${
                          tournamentId ===
                          state.selectedTournamentId
                            ? "selected"
                            : ""
                        }
                      >
                        ${escapeHtml(
                          getTournamentName(
                            tournamentId
                          )
                        )}
                        ${
                          tournamentId ===
                          state.activeTournamentId
                            ? " • ACTIVE"
                            : ""
                        }
                      </option>
                    `
                  )
                  .join("")}
              </select>
            </label>

            <button
              class="nexus-prediction-button"
              type="button"
              data-prediction-action="open-bracket"
            >
              <i class="fa-solid fa-diagram-project"></i>
              Open Bracket
            </button>
          </div>
        </header>

        ${
          bracketSize === 16
            ? `
              <div class="nexus-prediction-alert warning">
                <i class="fa-solid fa-triangle-exclamation"></i>

                <div>
                  <strong>
                    16-Team Pick’em Compatibility Warning
                  </strong>

                  <span>
                    The current player-facing Pick’em only stores QF, SF and Grand Final picks. Nexus will not grade Perfect Brackets for this event until R16 prediction support is added.
                  </span>
                </div>
              </div>
            `
            : ""
        }

        ${
          legacyCount
            ? `
              <div class="nexus-prediction-alert legacy">
                <i class="fa-solid fa-clock-rotate-left"></i>

                <div>
                  <strong>
                    ${legacyCount} Legacy Champion ${
                      legacyCount === 1
                        ? "Entry"
                        : "Entries"
                    } Found
                  </strong>

                  <span>
                    These are stored under the old standalone champion path. Current champion statistics use submitted bracket records instead.
                  </span>
                </div>
              </div>
            `
            : ""
        }

        <div class="nexus-prediction-metrics">
          <article>
            <span>
              Submitted Brackets
            </span>

            <strong>
              ${formatNumber(
                submittedCount
              )}
            </strong>

            <small>
              Completed Pick’em entries
            </small>
          </article>

          <article>
            <span>
              Saved Drafts
            </span>

            <strong>
              ${formatNumber(
                draftCount
              )}
            </strong>

            <small>
              Unsubmitted player drafts
            </small>
          </article>

          <article>
            <span>
              Perfect Remaining
            </span>

            <strong>
              ${
                perfectRemaining ===
                null
                  ? "—"
                  : formatNumber(
                      perfectRemaining
                    )
              }
            </strong>

            <small>
              ${
                perfectRemaining ===
                null
                  ? "Unavailable for 16-team Pick’em"
                  : "Still matching official results"
              }
            </small>
          </article>

          <article>
            <span>
              Pick’em Status
            </span>

            <strong class="${
              pickemLocked
                ? "danger"
                : "success"
            }">
              ${
                pickemLocked
                  ? "LOCKED"
                  : "OPEN"
              }
            </strong>

            <small>
              ${
                tournamentHasStarted()
                  ? "Locked by tournament progress"
                  : forcedLock
                    ? "Manually locked by staff"
                    : "Accepting submissions"
              }
            </small>
          </article>
        </div>

        <div class="nexus-prediction-main-grid">
          <section class="nexus-prediction-panel">
            <div class="nexus-prediction-panel-head">
              <div>
                <span>
                  Tournament Pick’em
                </span>

                <h3>
                  Bracket Operations
                </h3>
              </div>

              <span class="nexus-prediction-status ${
                pickemLocked
                  ? "locked"
                  : "open"
              }">
                ${
                  pickemLocked
                    ? "Locked"
                    : "Open"
                }
              </span>
            </div>

            <div class="nexus-prediction-status-grid">
              <div>
                <span>
                  Current Match
                </span>

                <strong>
                  ${escapeHtml(
                    currentMatch
                      ? getMatchLabel(
                          currentMatch
                        )
                      : "No Match Live"
                  )}
                </strong>
              </div>

              <div>
                <span>
                  Up Next
                </span>

                <strong>
                  ${escapeHtml(
                    upNext
                      ? getMatchLabel(
                          upNext
                        )
                      : "Not Set"
                  )}
                </strong>
              </div>

              <div>
                <span>
                  Bracket Format
                </span>

                <strong>
                  ${bracketSize}-Team Single Elimination
                </strong>
              </div>
            </div>

            <div class="nexus-prediction-lock-box">
              <div>
                <strong>
                  Manual Pick’em Lock
                </strong>

                <span>
                  This can close submissions before the tournament starts. Tournament progress always keeps Pick’em locked.
                </span>
              </div>

              <button
                class="nexus-prediction-button ${
                  forcedLock
                    ? "danger"
                    : "primary"
                }"
                type="button"
                data-prediction-action="toggle-pickem-lock"
                ${
                  tournamentHasStarted()
                    ? "disabled"
                    : ""
                }
              >
                <i class="fa-solid ${
                  forcedLock
                    ? "fa-lock-open"
                    : "fa-lock"
                }"></i>

                ${
                  forcedLock
                    ? "Remove Manual Lock"
                    : "Lock Pick’em"
                }
              </button>
            </div>

            <div class="nexus-prediction-section-title">
              <div>
                <span>
                  Community Forecast
                </span>

                <h4>
                  Champion Picks
                </h4>
              </div>

              <strong>
                ${submittedCount} Total
              </strong>
            </div>

            <div class="nexus-prediction-breakdown">
              ${championStatsMarkup()}
            </div>
          </section>

          <section class="nexus-prediction-panel">
            <div class="nexus-prediction-panel-head">
              <div>
                <span>
                  Live Prediction Results
                </span>

                <h3>
                  Correct Answer Control
                </h3>
              </div>

              <span class="nexus-prediction-status ${matchState.className}">
                ${escapeHtml(
                  matchState.label
                )}
              </span>
            </div>

            <label class="nexus-prediction-field">
              <span>
                Match
              </span>

              <select
                id="nexusPredictionMatch"
              >
                ${matchOptions
                  .map(
                    matchKey => `
                      <option
                        value="${escapeHtml(
                          matchKey
                        )}"
                        ${
                          matchKey ===
                          selectedMatch
                            ? "selected"
                            : ""
                        }
                      >
                        ${escapeHtml(
                          getMatchLabel(
                            matchKey
                          )
                        )}
                      </option>
                    `
                  )
                  .join("")}
              </select>
            </label>

            ${
              selectedMatch
                ? `
                  <div class="nexus-prediction-match-card">
                    <div>
                      <span>
                        Team Alpha
                      </span>

                      <strong>
                        ${escapeHtml(
                          getTeamName(
                            participants[0]
                          )
                        )}
                      </strong>
                    </div>

                    <b>
                      VS
                    </b>

                    <div class="right">
                      <span>
                        Team Bravo
                      </span>

                      <strong>
                        ${escapeHtml(
                          getTeamName(
                            participants[1]
                          )
                        )}
                      </strong>
                    </div>
                  </div>

                  <div class="nexus-prediction-official-row">
                    <div>
                      <span>
                        Official Series Score
                      </span>

                      <strong>
                        ${escapeHtml(
                          officialScore ||
                          "Not Final"
                        )}
                      </strong>
                    </div>

                    <div>
                      <span>
                        Official Series Winner
                      </span>

                      <strong>
                        ${escapeHtml(
                          officialWinner
                            ? getTeamName(
                                officialWinner
                              )
                            : "Not Final"
                        )}
                      </strong>
                    </div>
                  </div>

                  <div class="nexus-prediction-result-grid">
                    <article>
                      <div class="nexus-prediction-question-head">
                        <div>
                          <span>
                            Question 01
                          </span>

                          <h4>
                            Map 1 Winner
                          </h4>
                        </div>

                        <button
                          class="nexus-prediction-clear"
                          type="button"
                          data-prediction-action="clear-result"
                          data-question-id="map1Winner"
                          ${
                            map1Answer
                              ? ""
                              : "disabled"
                          }
                        >
                          Clear
                        </button>
                      </div>

                      <label class="nexus-prediction-field">
                        <span>
                          Correct Answer
                        </span>

                        <select
                          id="nexusPredictionMap1Result"
                        >
                          ${selectOptionsMarkup(
                            map1Options,
                            map1Answer,
                            "Select Map 1 Winner"
                          )}
                        </select>
                      </label>

                      <div class="nexus-prediction-preview">
                        <div>
                          <span>
                            Answers
                          </span>

                          <strong>
                            ${mapPreview.total}
                          </strong>
                        </div>

                        <div>
                          <span>
                            Correct
                          </span>

                          <strong class="success">
                            ${mapPreview.correct}
                          </strong>
                        </div>

                        <div>
                          <span>
                            Incorrect
                          </span>

                          <strong class="danger">
                            ${mapPreview.incorrect}
                          </strong>
                        </div>
                      </div>

                      <div class="nexus-prediction-breakdown compact">
                        ${breakdownMarkup(
                          selectedMatch,
                          "map1Winner"
                        )}
                      </div>
                    </article>

                    <article>
                      <div class="nexus-prediction-question-head">
                        <div>
                          <span>
                            Question 02
                          </span>

                          <h4>
                            Exact Series Score
                          </h4>
                        </div>

                        <button
                          class="nexus-prediction-clear"
                          type="button"
                          data-prediction-action="clear-result"
                          data-question-id="exactScore"
                          ${
                            exactAnswer
                              ? ""
                              : "disabled"
                          }
                        >
                          Clear
                        </button>
                      </div>

                      <label class="nexus-prediction-field">
                        <span>
                          Correct Answer
                        </span>

                        <select
                          id="nexusPredictionExactResult"
                        >
                          ${selectOptionsMarkup(
                            exactOptions,
                            exactAnswer,
                            "Select Exact Score"
                          )}
                        </select>
                      </label>

                      ${
                        exactConflict
                          ? `
                            <div class="nexus-prediction-conflict">
                              <i class="fa-solid fa-triangle-exclamation"></i>

                              Selected answer does not match the official series score of
                              ${escapeHtml(
                                officialScore
                              )}.
                            </div>
                          `
                          : ""
                      }

                      <div class="nexus-prediction-preview">
                        <div>
                          <span>
                            Answers
                          </span>

                          <strong>
                            ${exactPreview.total}
                          </strong>
                        </div>

                        <div>
                          <span>
                            Correct
                          </span>

                          <strong class="success">
                            ${exactPreview.correct}
                          </strong>
                        </div>

                        <div>
                          <span>
                            Incorrect
                          </span>

                          <strong class="danger">
                            ${exactPreview.incorrect}
                          </strong>
                        </div>
                      </div>

                      <div class="nexus-prediction-breakdown compact">
                        ${breakdownMarkup(
                          selectedMatch,
                          "exactScore"
                        )}
                      </div>
                    </article>
                  </div>

                  <div class="nexus-prediction-result-actions">
                    <div>
                      <strong>
                        Grading Preview Only
                      </strong>

                      <span>
                        Saving correct answers does not modify player balances, stats or prediction history.
                      </span>
                    </div>

                    <button
                      class="nexus-prediction-button primary"
                      type="button"
                      data-prediction-action="save-results"
                    >
                      <i class="fa-solid fa-check"></i>
                      Save Correct Answers
                    </button>
                  </div>
                `
                : `
                  <div class="nexus-prediction-empty">
                    <i class="fa-solid fa-bullseye"></i>

                    <strong>
                      No Match Selected
                    </strong>

                    <span>
                      Select a match to review live predictions.
                    </span>
                  </div>
                `
            }
          </section>
        </div>

        <section class="nexus-prediction-panel entries">
          <div class="nexus-prediction-panel-head">
            <div>
              <span>
                Player Submissions
              </span>

              <h3>
                Tournament Bracket Directory
              </h3>
            </div>

            <strong class="nexus-prediction-count">
              ${submittedCount} Entries
            </strong>
          </div>

          ${bracketEntriesMarkup()}
        </section>

        <div class="nexus-prediction-backend-notice">
          <i class="fa-solid fa-shield-halved"></i>

          <div>
            <strong>
              Prediction Payout Backend Required
            </strong>

            <span>
              Client-side RP payouts are intentionally disabled. A secure Firebase Function must verify results, prevent duplicate rewards and update balances atomically.
            </span>
          </div>
        </div>
      </section>
    `;
  }

  function resetTournamentState() {
    state.tournament = {};
    state.teamData = {};
    state.brackets = {};
    state.drafts = {};
    state.livePredictions = {};
    state.predictionResults = {};
    state.predictionSettings = {};
    state.bracketData = {};
    state.legacyChampionPredictions = {};
    state.selectedMatchKey = "";
    state.matchSelectionInitialized =
      false;
  }

  function attachTournamentListeners(
    tournamentId
  ) {
    detachRefs(
      state.tournamentRefs
    );

    resetTournamentState();

    state.selectedTournamentId =
      tournamentId;

    renderView();

    listen(
      state.tournamentRefs,
      state.database.ref(
        `tournaments/${tournamentId}`
      ),
      "value",
      snapshot => {
        state.tournament =
          snapshot.val() || {};

        renderView();
      }
    );

    listen(
      state.tournamentRefs,
      state.database.ref(
        `tournaments/${tournamentId}/bracket`
      ),
      "value",
      snapshot => {
        state.bracketData =
          snapshot.val() || {};

        renderView();
      }
    );

    listen(
      state.tournamentRefs,
      state.database.ref(
        `teams/${tournamentId}`
      ),
      "value",
      snapshot => {
        state.teamData =
          snapshot.val() || {};

        renderView();
      }
    );

    listen(
      state.tournamentRefs,
      state.database.ref(
        `predictions/${tournamentId}/brackets`
      ),
      "value",
      snapshot => {
        state.brackets =
          snapshot.val() || {};

        renderView();
      }
    );

    listen(
      state.tournamentRefs,
      state.database.ref(
        `predictions/${tournamentId}/bracketDrafts`
      ),
      "value",
      snapshot => {
        state.drafts =
          snapshot.val() || {};

        renderView();
      }
    );

    listen(
      state.tournamentRefs,
      state.database.ref(
        `predictions/${tournamentId}/live`
      ),
      "value",
      snapshot => {
        state.livePredictions =
          snapshot.val() || {};

        renderView();
      }
    );

    listen(
      state.tournamentRefs,
      state.database.ref(
        `predictions/${tournamentId}/results`
      ),
      "value",
      snapshot => {
        state.predictionResults =
          snapshot.val() || {};

        renderView();
      }
    );

    listen(
      state.tournamentRefs,
      state.database.ref(
        `predictions/${tournamentId}/settings`
      ),
      "value",
      snapshot => {
        state.predictionSettings =
          snapshot.val() || {};

        renderView();
      }
    );

    listen(
      state.tournamentRefs,
      state.database.ref(
        `predictions/${tournamentId}/champion`
      ),
      "value",
      snapshot => {
        state.legacyChampionPredictions =
          snapshot.val() || {};

        renderView();
      }
    );
  }

  async function togglePickemLock(
    button
  ) {
    if (
      tournamentHasStarted()
    ) {
      showToast(
        "Pick’em cannot be unlocked after the tournament has started."
      );

      return;
    }

    const nextValue =
      !Boolean(
        state.predictionSettings
          .pickemLocked
      );

    const confirmed =
      window.confirm(
        nextValue
          ? "Lock Tournament Pick’em now? Players will no longer be able to save or submit brackets after the player page is connected to this lock."
          : "Remove the manual Pick’em lock?"
      );

    if (!confirmed) {
      return;
    }

    const originalText =
      button.innerHTML;

    button.disabled = true;
    button.textContent =
      "Saving...";

    try {
      const timestamp =
        firebase.database
          .ServerValue
          .TIMESTAMP;

      const updates = {
        [`predictions/${state.selectedTournamentId}/settings/pickemLocked`]:
          nextValue,

        [`predictions/${state.selectedTournamentId}/settings/pickemLockUpdatedAt`]:
          timestamp,

        [`predictions/${state.selectedTournamentId}/settings/pickemLockUpdatedBy`]:
          state.currentUser
            ?.uid ||
          null
      };

      if (
        state.selectedTournamentId ===
        state.activeTournamentId
      ) {
        updates[
          "site/predictionPickemLocked"
        ] = nextValue;
      }

      await state.database
        .ref()
        .update(updates);

      showToast(
        nextValue
          ? "Tournament Pick’em locked."
          : "Manual Pick’em lock removed."
      );
    } catch (error) {
      console.error(
        "Pick’em lock update failed:",
        error
      );

      showToast(
        isPermissionDenied(error)
          ? "Firebase rules blocked the Pick’em lock update."
          : "Pick’em lock could not be updated."
      );
    } finally {
      button.disabled = false;
      button.innerHTML =
        originalText;
    }
  }

  async function saveCorrectAnswers(
    button
  ) {
    const matchKey =
      state.selectedMatchKey;

    if (!matchKey) {
      showToast(
        "Select a match first."
      );

      return;
    }

    const map1Answer =
      clean(
        state.content
          .querySelector(
            "#nexusPredictionMap1Result"
          )?.value
      );

    const exactAnswer =
      clean(
        state.content
          .querySelector(
            "#nexusPredictionExactResult"
          )?.value
      );

    if (
      !map1Answer &&
      !exactAnswer
    ) {
      showToast(
        "Select at least one correct answer."
      );

      return;
    }

    const officialScore =
      getOfficialScore(
        matchKey
      );

    if (
      exactAnswer &&
      officialScore &&
      exactAnswer !==
        officialScore
    ) {
      const confirmed =
        window.confirm(
          `The selected exact score (${exactAnswer}) does not match the official bracket score (${officialScore}). Save it anyway?`
        );

      if (!confirmed) {
        return;
      }
    }

    const originalText =
      button.innerHTML;

    button.disabled = true;
    button.textContent =
      "Saving...";

    try {
      const timestamp =
        firebase.database
          .ServerValue
          .TIMESTAMP;

      const updates = {};

      if (map1Answer) {
        const currentRecord =
          getResultRecord(
            matchKey,
            "map1Winner"
          );

        updates[
          `predictions/${state.selectedTournamentId}/results/${matchKey}/map1Winner`
        ] = {
          answer:
            map1Answer,
          matchId:
            matchKey,
          questionId:
            "map1Winner",
          createdAt:
            (
              currentRecord &&
              typeof currentRecord ===
                "object" &&
              currentRecord.createdAt
            ) ||
            timestamp,
          updatedAt:
            timestamp,
          updatedBy:
            state.currentUser
              ?.uid ||
            null
        };
      }

      if (exactAnswer) {
        const currentRecord =
          getResultRecord(
            matchKey,
            "exactScore"
          );

        updates[
          `predictions/${state.selectedTournamentId}/results/${matchKey}/exactScore`
        ] = {
          answer:
            exactAnswer,
          matchId:
            matchKey,
          questionId:
            "exactScore",
          createdAt:
            (
              currentRecord &&
              typeof currentRecord ===
                "object" &&
              currentRecord.createdAt
            ) ||
            timestamp,
          updatedAt:
            timestamp,
          updatedBy:
            state.currentUser
              ?.uid ||
            null
        };
      }

      updates[
        `predictions/${state.selectedTournamentId}/results/${matchKey}/updatedAt`
      ] = timestamp;

      updates[
        `predictions/${state.selectedTournamentId}/results/${matchKey}/updatedBy`
      ] =
        state.currentUser
          ?.uid ||
        null;

      await state.database
        .ref()
        .update(updates);

      showToast(
        "Correct answers saved. No RP payouts were issued."
      );
    } catch (error) {
      console.error(
        "Prediction result save failed:",
        error
      );

      showToast(
        isPermissionDenied(error)
          ? "Firebase rules blocked the prediction result."
          : "Correct answers could not be saved."
      );
    } finally {
      button.disabled = false;
      button.innerHTML =
        originalText;
    }
  }

  async function clearCorrectAnswer(
    button,
    questionId
  ) {
    const matchKey =
      state.selectedMatchKey;

    if (
      !matchKey ||
      !questionId
    ) {
      return;
    }

    const questionName =
      questionId ===
      "map1Winner"
        ? "Map 1 Winner"
        : "Exact Series Score";

    const confirmed =
      window.confirm(
        `Clear the saved correct answer for ${questionName}? Player submissions will not be deleted.`
      );

    if (!confirmed) {
      return;
    }

    button.disabled = true;

    try {
      await state.database
        .ref(
          `predictions/${state.selectedTournamentId}/results/${matchKey}/${questionId}`
        )
        .remove();

      showToast(
        `${questionName} result cleared.`
      );
    } catch (error) {
      console.error(
        "Prediction result clear failed:",
        error
      );

      showToast(
        isPermissionDenied(error)
          ? "Firebase rules blocked the result removal."
          : "Correct answer could not be cleared."
      );
    } finally {
      button.disabled = false;
    }
  }

  function handleChange(event) {
    if (
      event.target.id ===
      "nexusPredictionTournament"
    ) {
      const tournamentId =
        clean(
          event.target.value
        );

      if (
        tournamentId &&
        tournamentId !==
          state.selectedTournamentId
      ) {
        attachTournamentListeners(
          tournamentId
        );
      }

      return;
    }

    if (
      event.target.id ===
      "nexusPredictionMatch"
    ) {
      state.selectedMatchKey =
        normalizeMatchKey(
          event.target.value
        );

      renderView();
      return;
    }

    if (
      event.target.id ===
        "nexusPredictionMap1Result" ||
      event.target.id ===
        "nexusPredictionExactResult"
    ) {
      const mapSelect =
        state.content.querySelector(
          "#nexusPredictionMap1Result"
        );

      const exactSelect =
        state.content.querySelector(
          "#nexusPredictionExactResult"
        );

      const matchKey =
        state.selectedMatchKey;

      if (
        mapSelect &&
        matchKey
      ) {
        const preview =
          getLiveQuestionRecords(
            matchKey,
            "map1Winner"
          );

        const answer =
          clean(
            mapSelect.value
          );

        const correct =
          answer
            ? preview.filter(
                record =>
                  clean(
                    record.answer
                  ) ===
                  answer
              ).length
            : 0;

        const cards =
          state.content
            .querySelectorAll(
              ".nexus-prediction-result-grid > article"
            );

        if (cards[0]) {
          const values =
            cards[0].querySelectorAll(
              ".nexus-prediction-preview strong"
            );

          if (values[1]) {
            values[1].textContent =
              correct;
          }

          if (values[2]) {
            values[2].textContent =
              answer
                ? preview.length -
                  correct
                : 0;
          }
        }
      }

      if (
        exactSelect &&
        matchKey
      ) {
        const preview =
          getLiveQuestionRecords(
            matchKey,
            "exactScore"
          );

        const answer =
          clean(
            exactSelect.value
          );

        const correct =
          answer
            ? preview.filter(
                record =>
                  clean(
                    record.answer
                  ) ===
                  answer
              ).length
            : 0;

        const cards =
          state.content
            .querySelectorAll(
              ".nexus-prediction-result-grid > article"
            );

        if (cards[1]) {
          const values =
            cards[1].querySelectorAll(
              ".nexus-prediction-preview strong"
            );

          if (values[1]) {
            values[1].textContent =
              correct;
          }

          if (values[2]) {
            values[2].textContent =
              answer
                ? preview.length -
                  correct
                : 0;
          }
        }
      }
    }
  }

  function handleClick(event) {
    const button =
      event.target.closest(
        "[data-prediction-action]"
      );

    if (!button) {
      return;
    }

    const action =
      button.dataset
        .predictionAction;

    if (
      action ===
      "open-bracket"
    ) {
      if (
        state.api &&
        typeof state.api
          .openModule ===
          "function"
      ) {
        state.api.openModule(
          "bracket"
        );
      }

      return;
    }

    if (
      action ===
      "toggle-pickem-lock"
    ) {
      togglePickemLock(
        button
      );

      return;
    }

    if (
      action ===
      "save-results"
    ) {
      saveCorrectAnswers(
        button
      );

      return;
    }

    if (
      action ===
      "clear-result"
    ) {
      clearCorrectAnswer(
        button,
        button.dataset
          .questionId
      );
    }
  }

  async function initialize() {
    try {
      let currentTournamentId =
        "";

      if (
        state.api &&
        typeof state.api
          .getCurrentTournamentId ===
          "function"
      ) {
        currentTournamentId =
          await state.api
            .getCurrentTournamentId();
      }

      state.activeTournamentId =
        clean(
          currentTournamentId,
          "open1"
        );

      state.selectedTournamentId =
        state.activeTournamentId;

      listen(
        state.globalRefs,
        state.database.ref(
          "site/currentTournament"
        ),
        "value",
        snapshot => {
          const nextActive =
            clean(
              snapshot.val(),
              "open1"
            );

          const previousActive =
            state.activeTournamentId;

          state.activeTournamentId =
            nextActive;

          if (
            !state.selectedTournamentId ||
            state.selectedTournamentId ===
              previousActive
          ) {
            if (
              state.selectedTournamentId !==
              nextActive
            ) {
              attachTournamentListeners(
                nextActive
              );
            }
          }

          renderView();
        }
      );

      listen(
        state.globalRefs,
        state.database.ref(
          "tournaments"
        ),
        "value",
        snapshot => {
          state.tournaments =
            snapshot.val() || {};

          if (
            !state.tournaments[
              state.activeTournamentId
            ]
          ) {
            state.tournaments[
              state.activeTournamentId
            ] = {
              name:
                state.activeTournamentId
            };
          }

          renderView();
        }
      );

      listen(
        state.globalRefs,
        state.database.ref(
          "site"
        ),
        "value",
        snapshot => {
          state.siteData =
            snapshot.val() || {};

          renderView();
        }
      );

      listen(
        state.globalRefs,
        state.database.ref(
          "broadcastCountdown/upNext"
        ),
        "value",
        snapshot => {
          state.upNextData =
            snapshot.val() || {};

          renderView();
        }
      );

      attachTournamentListeners(
        state.selectedTournamentId
      );

      state.loading = false;
      renderView();
    } catch (error) {
      console.error(
        "Prediction Operations initialization failed:",
        error
      );

      state.content.innerHTML = `
        <div class="nexus-prediction-empty">
          <i class="fa-solid fa-triangle-exclamation"></i>

          <strong>
            Prediction Operations Failed to Load
          </strong>

          <span>
            ${escapeHtml(
              error?.message ||
              "Unknown error"
            )}
          </span>
        </div>
      `;
    }
  }

  function cleanup() {
    detachRefs(
      state.globalRefs
    );

    detachRefs(
      state.tournamentRefs
    );

    if (state.content) {
      state.content.removeEventListener(
        "click",
        handleClick
      );

      state.content.removeEventListener(
        "change",
        handleChange
      );
    }

    state.api = null;
    state.database = null;
    state.content = null;
    state.currentUser = null;
    state.roleId = "";

    state.tournaments = {};
    state.tournament = {};
    state.teamData = {};
    state.siteData = {};
    state.upNextData = {};
    state.brackets = {};
    state.drafts = {};
    state.livePredictions = {};
    state.predictionResults = {};
    state.predictionSettings = {};
    state.bracketData = {};
    state.legacyChampionPredictions = {};
  }

  function render(api) {
    cleanup();

    state.api = api;
    state.database =
      api.database;
    state.content =
      api.content;
    state.currentUser =
      api.currentUser;
    state.roleId =
      api.roleId;

    state.content.innerHTML = `
      <div class="nexus-prediction-loading">
        <i class="fa-solid fa-circle-notch fa-spin"></i>

        <span>
          Loading Prediction Operations...
        </span>
      </div>
    `;

    state.content.addEventListener(
      "click",
      handleClick
    );

    state.content.addEventListener(
      "change",
      handleChange
    );

    initialize();
  }

  window.NexusPredictions = {
    render,
    cleanup
  };
})();