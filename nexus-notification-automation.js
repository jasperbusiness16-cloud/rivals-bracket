(() => {
  "use strict";

  if (window.__RG_NEXUS_NOTIFICATION_AUTOMATION__) {
    return;
  }

  window.__RG_NEXUS_NOTIFICATION_AUTOMATION__ = true;

  const ADMIN_ROLES = new Set([
    "owner",
    "admin"
  ]);

  const MAX_TIMER_DELAY = 2147480000;
  const CHECK_IN_OPEN_BEFORE_MS = 60 * 60 * 1000;
  const CHECK_IN_CLOSE_BEFORE_MS = 30 * 60 * 1000;
  const RECENT_SUBSTITUTION_MS = 2 * 60 * 1000;

  const state = {
    user: null,
    activeTournamentId: "",
    tournament: {},
    listeners: [],
    activeTournamentListener: null,
    checkInTimer: null,
    stopped: false
  };

  function clean(value, fallback = "") {
    return String(
      value ?? fallback
    ).trim();
  }

  function normalize(value) {
    return clean(value)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  }

  function safeKey(value) {
    return clean(value, "event")
      .replace(/[.#$/\[\]]/g, "_")
      .replace(/\s+/g, "_")
      .replace(/[^A-Za-z0-9_-]/g, "_")
      .replace(/_+/g, "_")
      .slice(0, 180);
  }

  function notificationId(eventKey) {
    return `auto_${safeKey(eventKey)}`;
  }

  function isTestUid(uid) {
    return /^testPlayer/i.test(
      clean(uid)
    );
  }

  function getDatabase() {
    return window.database ||
      (typeof database !== "undefined"
        ? database
        : null);
  }

  function getAuth() {
    return window.auth ||
      (typeof auth !== "undefined"
        ? auth
        : null);
  }

  function serverTimestamp() {
    return firebase.database
      .ServerValue
      .TIMESTAMP;
  }

  async function isAuthorizedAdmin(user) {
    if (!user?.uid) {
      return false;
    }

    try {
      const db = getDatabase();
      const snapshot = await db
        .ref(`users/${user.uid}/role`)
        .once("value");

      return ADMIN_ROLES.has(
        clean(snapshot.val()).toLowerCase()
      );
    } catch (error) {
      console.error(
        "[NEXUS NOTIFICATIONS] Could not verify admin role:",
        error
      );

      return false;
    }
  }

  async function hasRecentNotification(
    uid,
    type,
    tournamentId,
    windowMs = RECENT_SUBSTITUTION_MS
  ) {
    const db = getDatabase();

    if (!db || !uid) {
      return false;
    }

    try {
      const snapshot = await db
        .ref(`notifications/${uid}`)
        .orderByChild("createdAt")
        .limitToLast(20)
        .once("value");

      const cutoff =
        Date.now() - windowMs;

      let found = false;

      snapshot.forEach(child => {
        const notification =
          child.val() || {};

        if (
          clean(notification.type) === type &&
          clean(notification.tournamentId) === tournamentId &&
          Number(notification.createdAt || 0) >= cutoff
        ) {
          found = true;
        }
      });

      return found;
    } catch (error) {
      console.error(
        "[NEXUS NOTIFICATIONS] Recent-notification check failed:",
        error
      );

      return false;
    }
  }

  async function sendNotification(
    uid,
    notification,
    options = {}
  ) {
    const db = getDatabase();

    if (
      !db ||
      !uid ||
      isTestUid(uid)
    ) {
      return false;
    }

    const eventKey = clean(
      notification.eventKey,
      `${notification.type || "general"}_${Date.now()}`
    );

    const ref = db.ref(
      `notifications/${uid}/${notificationId(eventKey)}`
    );

    try {
      const existing = await ref.once("value");

      if (
        existing.exists() &&
        options.refreshExisting !== true
      ) {
        return false;
      }

      await ref.set({
        type:
          clean(
            notification.type,
            "general"
          ),

        title:
          clean(
            notification.title,
            "Rivals Gauntlet"
          ),

        message:
          clean(notification.message),

        link:
          clean(notification.link),

        tournamentId:
          clean(notification.tournamentId),

        matchId:
          clean(notification.matchId),

        teamKey:
          clean(notification.teamKey),

        eventKey,
        source: "nexus_notification_automation",
        read: false,
        seen: false,
        createdAt: serverTimestamp()
      });

      return true;
    } catch (error) {
      console.error(
        "[NEXUS NOTIFICATIONS] Notification write failed:",
        error,
        notification
      );

      return false;
    }
  }

  function addListener(ref, event, handler) {
    ref.on(
      event,
      handler,
      error => {
        console.error(
          "[NEXUS NOTIFICATIONS] Listener failed:",
          error
        );
      }
    );

    state.listeners.push({
      ref,
      event,
      handler
    });
  }

  function clearTournamentListeners() {
    state.listeners.forEach(
      ({ ref, event, handler }) => {
        ref.off(
          event,
          handler
        );
      }
    );

    state.listeners = [];

    if (state.checkInTimer) {
      clearTimeout(
        state.checkInTimer
      );

      state.checkInTimer = null;
    }
  }

  function stop() {
    state.stopped = true;
    clearTournamentListeners();

    if (
      state.activeTournamentListener
    ) {
      state.activeTournamentListener.ref.off(
        "value",
        state.activeTournamentListener.handler
      );

      state.activeTournamentListener = null;
    }

    state.activeTournamentId = "";
    state.tournament = {};
  }

  function tournamentName() {
    return clean(
      state.tournament?.name ||
      state.tournament?.eventName,
      state.activeTournamentId ||
      "Rivals Gauntlet Tournament"
    );
  }

  function getTeams(record) {
    return record?.teams &&
      typeof record.teams === "object"
      ? record.teams
      : {};
  }

  function getTeamNames(record) {
    return record?.teamNames &&
      typeof record.teamNames === "object"
      ? record.teamNames
      : {};
  }

  function teamDisplayName(
    record,
    teamKey
  ) {
    const names =
      getTeamNames(record);

    if (clean(names[teamKey])) {
      return clean(names[teamKey]);
    }

    const number =
      clean(teamKey)
        .match(/^team(\d+)$/i)?.[1];

    return number
      ? `Team ${number}`
      : clean(teamKey, "Team");
  }

  function teamKeyFromName(
    record,
    value
  ) {
    const source = clean(value);

    if (!source) {
      return "";
    }

    const teams = getTeams(record);

    if (teams[source]) {
      return source;
    }

    const names = getTeamNames(record);
    const target = normalize(source);

    const match = Object.keys(teams)
      .find(teamKey => {
        return (
          normalize(teamKey) === target ||
          normalize(
            names[teamKey]
          ) === target ||
          normalize(
            teamDisplayName(
              record,
              teamKey
            )
          ) === target
        );
      });

    return match || "";
  }

  function rosterForTeamKey(
    record,
    teamKey
  ) {
    const teams = getTeams(record);
    const roster = teams[teamKey];

    return Array.isArray(roster)
      ? roster.filter(Boolean)
      : [];
  }

  function rosterUidsForTeamName(
    record,
    teamName
  ) {
    const teamKey =
      teamKeyFromName(
        record,
        teamName
      );

    return {
      teamKey,
      teamName:
        teamKey
          ? teamDisplayName(
              record,
              teamKey
            )
          : clean(teamName),
      players:
        teamKey
          ? rosterForTeamKey(
              record,
              teamKey
            )
          : []
    };
  }

  async function loadTeamsRecord(
    tournamentId = state.activeTournamentId
  ) {
    const db = getDatabase();

    const snapshot = await db
      .ref(`teams/${tournamentId}`)
      .once("value");

    return snapshot.val() || {};
  }

  async function loadTournamentRecord(
    tournamentId = state.activeTournamentId
  ) {
    const db = getDatabase();

    const snapshot = await db
      .ref(`tournaments/${tournamentId}`)
      .once("value");

    return snapshot.val() || {};
  }

  async function loadSiteRecord() {
    const db = getDatabase();

    const snapshot = await db
      .ref("site")
      .once("value");

    return snapshot.val() || {};
  }

  function bracketWinnerName(
    bracket,
    teamsRecord,
    storageKey
  ) {
    const winner = clean(
      bracket?.[storageKey]?.winner
    );

    if (!winner) {
      return "";
    }

    const teamKey =
      teamKeyFromName(
        teamsRecord,
        winner
      );

    return teamKey
      ? teamDisplayName(
          teamsRecord,
          teamKey
        )
      : winner;
  }

  async function resolveMatchTeams(
    tournamentId,
    matchId,
    supplied = {}
  ) {
    const suppliedA =
      clean(supplied.teamA);

    const suppliedB =
      clean(supplied.teamB);

    if (suppliedA && suppliedB) {
      return [
        suppliedA,
        suppliedB
      ];
    }

    const [
      teamsRecord,
      tournament,
      site
    ] = await Promise.all([
      loadTeamsRecord(
        tournamentId
      ),
      loadTournamentRecord(
        tournamentId
      ),
      loadSiteRecord()
    ]);

    const short = clean(matchId)
      .split("•")[0]
      .trim();

    const bracket =
      tournament.bracket || {};

    const is16 =
      clean(
        tournament.formatType ||
        site.formatType
      ).includes("16");

    const initialTeam = index => {
      const teamKey =
        `team${index}`;

      return teamDisplayName(
        teamsRecord,
        teamKey
      );
    };

    const winner = storageKey =>
      bracketWinnerName(
        bracket,
        teamsRecord,
        storageKey
      );

    const r16 =
      short.match(/^R16-(\d+)$/i);

    if (r16) {
      const number =
        Number(r16[1]);

      return [
        initialTeam(
          (number - 1) * 2 + 1
        ),
        initialTeam(
          (number - 1) * 2 + 2
        )
      ];
    }

    const qf =
      short.match(/^QF(\d+)$/i);

    if (qf) {
      const number =
        Number(qf[1]);

      if (is16) {
        const first =
          (number - 1) * 2 + 1;

        return [
          winner(`r16m${first}`),
          winner(`r16m${first + 1}`)
        ];
      }

      return [
        initialTeam(
          (number - 1) * 2 + 1
        ),
        initialTeam(
          (number - 1) * 2 + 2
        )
      ];
    }

    const sf =
      short.match(/^SF(\d+)$/i);

    if (sf) {
      const number =
        Number(sf[1]);

      return number === 1
        ? [
            winner("qf1"),
            winner("qf2")
          ]
        : [
            winner("qf3"),
            winner("qf4")
          ];
    }

    if (/grand/i.test(short)) {
      return [
        winner("sf1"),
        winner("sf2")
      ];
    }

    return [
      suppliedA,
      suppliedB
    ];
  }

  async function notifyMatchParticipants(
    tournamentId,
    matchId,
    kind,
    supplied = {}
  ) {
    if (!tournamentId || !matchId) {
      return;
    }

    const normalizedMatch =
      clean(matchId);

    if (
      !normalizedMatch ||
      /no match|tournament complete/i.test(
        normalizedMatch
      )
    ) {
      return;
    }

    try {
      const teamsRecord =
        await loadTeamsRecord(
          tournamentId
        );

      const [
        teamAName,
        teamBName
      ] = await resolveMatchTeams(
        tournamentId,
        normalizedMatch,
        supplied
      );

      const sides = [
        rosterUidsForTeamName(
          teamsRecord,
          teamAName
        ),
        rosterUidsForTeamName(
          teamsRecord,
          teamBName
        )
      ];

      for (
        let index = 0;
        index < sides.length;
        index += 1
      ) {
        const side = sides[index];
        const opponent =
          sides[index === 0 ? 1 : 0]
            .teamName ||
          "your opponent";

        for (const player of side.players) {
          const uid = clean(
            player.uid ||
            player.key
          );

          if (!uid) {
            continue;
          }

          if (kind === "live") {
            await sendNotification(
              uid,
              {
                eventKey:
                  `match_live:${tournamentId}:${normalizedMatch}`,
                type:
                  "match_live",
                title:
                  "Your Match Is Live",
                message:
                  `${side.teamName} vs ${opponent} is now the active series. Stay in your team voice channel and follow tournament staff instructions.`,
                link:
                  "dashboard.html",
                tournamentId,
                matchId:
                  normalizedMatch,
                teamKey:
                  side.teamKey
              }
            );
          } else {
            await sendNotification(
              uid,
              {
                eventKey:
                  `match_on_deck:${tournamentId}:${normalizedMatch}`,
                type:
                  "match_on_deck",
                title:
                  "Your Match Is Next",
                message:
                  `${side.teamName} vs ${opponent} is Up Next. Join your assigned team voice channel and be ready at least 15 minutes early.`,
                link:
                  "dashboard.html",
                tournamentId,
                matchId:
                  normalizedMatch,
                teamKey:
                  side.teamKey
              }
            );
          }
        }
      }
    } catch (error) {
      console.error(
        "[NEXUS NOTIFICATIONS] Match notification failed:",
        error
      );
    }
  }

  async function notifyPublishedTeams(
    tournamentId
  ) {
    try {
      const teamsRecord =
        await loadTeamsRecord(
          tournamentId
        );

      const teams =
        getTeams(teamsRecord);

      for (const [
        teamKey,
        roster
      ] of Object.entries(teams)) {
        if (!Array.isArray(roster)) {
          continue;
        }

        const teamName =
          teamDisplayName(
            teamsRecord,
            teamKey
          );

        for (const player of roster) {
          const uid = clean(
            player?.uid ||
            player?.key
          );

          if (!uid) {
            continue;
          }

          await sendNotification(
            uid,
            {
              eventKey:
                `team_assignment:${tournamentId}`,
              type:
                "team_assignment",
              title:
                "Team Assignment Published",
              message:
                `You have been assigned to ${teamName} for ${tournamentName()}. Review your roster and tournament instructions.`,
              link:
                "dashboard.html",
              tournamentId,
              teamKey
            },
            {
              refreshExisting: true
            }
          );
        }
      }
    } catch (error) {
      console.error(
        "[NEXUS NOTIFICATIONS] Team publish notification failed:",
        error
      );
    }
  }

  async function notifyCheckInOpen(
    tournamentId
  ) {
    try {
      const teamsRecord =
        await loadTeamsRecord(
          tournamentId
        );

      const teams =
        getTeams(teamsRecord);

      for (const [
        teamKey,
        roster
      ] of Object.entries(teams)) {
        if (!Array.isArray(roster)) {
          continue;
        }

        for (const player of roster) {
          const uid = clean(
            player?.uid ||
            player?.key
          );

          if (!uid) {
            continue;
          }

          await sendNotification(
            uid,
            {
              eventKey:
                `check_in_open:${tournamentId}`,
              type:
                "check_in",
              title:
                "Tournament Check-In Is Open",
              message:
                `Check-in is open for ${tournamentName()}. Confirm your availability before the player check-in window closes.`,
              link:
                "check-in.html",
              tournamentId,
              teamKey
            }
          );
        }
      }
    } catch (error) {
      console.error(
        "[NEXUS NOTIFICATIONS] Check-in notification failed:",
        error
      );
    }
  }

  function parseEventTime(value) {
    const source = clean(value);

    if (!source) {
      return 0;
    }

    const parsed =
      Date.parse(source);

    return Number.isFinite(parsed)
      ? parsed
      : 0;
  }

  function scheduleCheckInNotification() {
    if (state.checkInTimer) {
      clearTimeout(
        state.checkInTimer
      );

      state.checkInTimer = null;
    }

    const tournamentId =
      state.activeTournamentId;

    const eventTime =
      parseEventTime(
        state.tournament?.countdownDate ||
        state.tournament?.eventDate
      );

    if (!tournamentId || !eventTime) {
      return;
    }

    const openAt =
      eventTime -
      CHECK_IN_OPEN_BEFORE_MS;

    const closeAt =
      eventTime -
      CHECK_IN_CLOSE_BEFORE_MS;

    const now = Date.now();

    if (
      now >= openAt &&
      now < closeAt
    ) {
      void notifyCheckInOpen(
        tournamentId
      );

      return;
    }

    if (now >= closeAt) {
      return;
    }

    const delay =
      openAt - now;

    if (delay > MAX_TIMER_DELAY) {
      state.checkInTimer =
        setTimeout(
          scheduleCheckInNotification,
          MAX_TIMER_DELAY
        );

      return;
    }

    state.checkInTimer =
      setTimeout(
        () => {
          state.checkInTimer = null;
          void notifyCheckInOpen(
            tournamentId
          );
        },
        Math.max(0, delay)
      );
  }

  function applicationStatusCopy(
    status,
    tournament
  ) {
    const name = clean(
      tournament?.name ||
      tournament?.eventName,
      tournamentName()
    );

    if (status === "accepted") {
      return {
        title:
          "Application Accepted",
        message:
          `You were selected for ${name}. Team assignments will appear in your Command Center when lineups are published.`,
        link:
          "dashboard.html"
      };
    }

    if (status === "waitlist") {
      return {
        title:
          "You Are a Substitute Player",
        message:
          `You were selected as a substitute player for ${name}. Stay available in Discord in case tournament staff needs you to fill an open roster spot.`, 
        link:
          "dashboard.html"
      };
    }

    if (status === "declined") {
      return {
        title:
          "Application Review Complete",
        message:
          `You were not selected for ${name}. Your Rivals Gauntlet account remains ready for future tournaments.`,
        link:
          "apply.html"
      };
    }

    return null;
  }

  async function handleApplicationsChange(
    tournamentId,
    current,
    previous
  ) {
    const tournament =
      state.tournament || {};

    for (const [
      uid,
      application
    ] of Object.entries(current)) {
      const next = application || {};
      const prior = previous[uid] || {};

      const nextStatus = clean(
        next.status,
        "pending"
      ).toLowerCase();

      const priorStatus = clean(
        prior.status,
        "pending"
      ).toLowerCase();

      const substitutedAt =
        Number(
          next.substitutedAt || 0
        );

      const priorSubstitutedAt =
        Number(
          prior.substitutedAt || 0
        );

      const replacedAt =
        Number(
          next.replacedAt || 0
        );

      const priorReplacedAt =
        Number(
          prior.replacedAt || 0
        );

      if (
        substitutedAt &&
        substitutedAt !== priorSubstitutedAt
      ) {
        const recent =
          await hasRecentNotification(
            uid,
            "substitution",
            tournamentId
          );

        if (!recent) {
          let teamName = clean(
            next.substitutedInto
          );

          try {
            const teamsRecord =
              await loadTeamsRecord(
                tournamentId
              );

            const teamKey =
              teamKeyFromName(
                teamsRecord,
                teamName
              ) ||
              teamName;

            teamName =
              teamDisplayName(
                teamsRecord,
                teamKey
              );
          } catch {
            // Use the saved team value if roster lookup fails.
          }

          await sendNotification(
            uid,
            {
              eventKey:
                `substitution_in:${tournamentId}:${substitutedAt}`,
              type:
                "substitution",
              title:
                "You Have Been Subbed In",
              message:
                `You have been assigned to ${teamName || "an active tournament roster"}. Open your Command Center and report to tournament staff immediately.`,
              link:
                "dashboard.html",
              tournamentId,
              teamKey:
                clean(next.substitutedInto)
            }
          );
        }
      }

      if (
        replacedAt &&
        replacedAt !== priorReplacedAt
      ) {
        const recent =
          await hasRecentNotification(
            uid,
            "substitution",
            tournamentId
          );

        if (!recent) {
          await sendNotification(
            uid,
            {
              eventKey:
                `substitution_out:${tournamentId}:${replacedAt}`,
              type:
                "substitution",
              title:
                "Tournament Roster Updated",
              message:
                "You have been replaced on the active tournament roster. Contact tournament staff if you have any questions.",
              link:
                "dashboard.html",
              tournamentId
            }
          );
        }
      }

      if (
        nextStatus !== priorStatus &&
        [
          "accepted",
          "waitlist",
          "declined"
        ].includes(nextStatus)
      ) {
        /*
         * A substitute player promoted directly into a live roster should
         * receive the substitution alert instead of a second acceptance alert.
         */
        if (
          nextStatus === "accepted" &&
          (
            next.addedAsSubstitute === true ||
            substitutedAt
          )
        ) {
          continue;
        }

        const copy =
          applicationStatusCopy(
            nextStatus,
            tournament
          );

        if (!copy) {
          continue;
        }

        await sendNotification(
          uid,
          {
            eventKey:
              `application_status:${tournamentId}:${nextStatus}`,
            type:
              "application_status",
            title:
              copy.title,
            message:
              copy.message,
            link:
              copy.link,
            tournamentId
          },
          {
            refreshExisting: true
          }
        );
      }
    }
  }

  async function notifyTournamentResult(
    tournamentId,
    championRecord
  ) {
    const name = clean(
      championRecord.eventName,
      tournamentName()
    );

    const finalScore = clean(
      championRecord.finalScore
    );

    const championName = clean(
      championRecord.teamName,
      "Tournament Champion"
    );

    const championPlayers =
      Array.isArray(
        championRecord.players
      )
        ? championRecord.players
        : [];

    for (const player of championPlayers) {
      const uid = clean(
        player?.uid ||
        player?.key
      );

      if (!uid) {
        continue;
      }

      await sendNotification(
        uid,
        {
          eventKey:
            `tournament_result:${tournamentId}:champion`,
          type:
            "tournament_result",
          title:
            "Tournament Champions",
          message:
            `Your team, ${championName}, won ${name}${finalScore ? ` ${finalScore}` : ""}. Congratulations on the championship.`,
          link:
            "tournament.html",
          tournamentId,
          teamKey:
            clean(championRecord.teamKey)
        }
      );
    }

    try {
      const teamsRecord =
        await loadTeamsRecord(
          tournamentId
        );

      const runnerUpValue =
        clean(
          championRecord.runnerUpKey ||
          championRecord.runnerUpName ||
          championRecord.runnerUp
        );

      const runnerUp =
        rosterUidsForTeamName(
          teamsRecord,
          runnerUpValue
        );

      for (const player of runnerUp.players) {
        const uid = clean(
          player?.uid ||
          player?.key
        );

        if (!uid) {
          continue;
        }

        await sendNotification(
          uid,
          {
            eventKey:
              `tournament_result:${tournamentId}:runner_up`,
            type:
              "tournament_result",
            title:
              "Grand Final Complete",
            message:
              `${runnerUp.teamName || "Your team"} finished 2nd in ${name}${finalScore ? ` after a ${finalScore} Grand Final` : ""}.`,
            link:
              "tournament.html",
            tournamentId,
            teamKey:
              runnerUp.teamKey
          }
        );
      }
    } catch (error) {
      console.error(
        "[NEXUS NOTIFICATIONS] Runner-up notification failed:",
        error
      );
    }
  }

  function bindTournament(
    tournamentId
  ) {
    const db = getDatabase();

    clearTournamentListeners();

    state.activeTournamentId =
      clean(
        tournamentId,
        "open1"
      );

    const currentTournamentId =
      state.activeTournamentId;

    let applicationsReady = false;
    let previousApplications = {};

    const applicationsRef = db.ref(
      `applications/${currentTournamentId}`
    );

    addListener(
      applicationsRef,
      "value",
      snapshot => {
        const current =
          snapshot.val() || {};

        if (!applicationsReady) {
          applicationsReady = true;
          previousApplications = current;
          return;
        }

        const previous =
          previousApplications;

        previousApplications = current;

        void handleApplicationsChange(
          currentTournamentId,
          current,
          previous
        );
      }
    );

    let publishedReady = false;
    let previousPublishedAt = 0;

    const publishedRef = db.ref(
      `teams/${currentTournamentId}/publishedAt`
    );

    addListener(
      publishedRef,
      "value",
      snapshot => {
        const publishedAt =
          Number(snapshot.val() || 0);

        if (!publishedReady) {
          publishedReady = true;
          previousPublishedAt =
            publishedAt;
          return;
        }

        if (
          publishedAt &&
          publishedAt !==
            previousPublishedAt
        ) {
          void notifyPublishedTeams(
            currentTournamentId
          );
        }

        previousPublishedAt =
          publishedAt;
      }
    );

    const tournamentRef = db.ref(
      `tournaments/${currentTournamentId}`
    );

    addListener(
      tournamentRef,
      "value",
      snapshot => {
        state.tournament =
          snapshot.val() || {};

        scheduleCheckInNotification();
      }
    );

    const currentMatchRef =
      db.ref("site/currentMatch");

    addListener(
      currentMatchRef,
      "value",
      snapshot => {
        const matchId =
          clean(snapshot.val());

        if (
          matchId &&
          !/no match/i.test(matchId)
        ) {
          void notifyMatchParticipants(
            currentTournamentId,
            matchId,
            "live"
          );
        }
      }
    );

    const upNextRef = db.ref(
      "broadcastCountdown/upNext"
    );

    addListener(
      upNextRef,
      "value",
      snapshot => {
        const value =
          snapshot.val() || {};

        const label =
          clean(
            value.label ||
            value.fullMatchId ||
            value.matchId
          );

        if (
          label &&
          !/no match|tournament complete/i.test(
            label
          )
        ) {
          void notifyMatchParticipants(
            currentTournamentId,
            label,
            "next",
            {
              teamA:
                clean(value.teamA),
              teamB:
                clean(value.teamB)
            }
          );
        }
      }
    );

    let championReady = false;
    let previousChampionCreatedAt = 0;

    const championRef = db.ref(
      `champions/${currentTournamentId}`
    );

    addListener(
      championRef,
      "value",
      snapshot => {
        const record =
          snapshot.val() || {};

        const createdAt =
          Number(
            record.createdAt ||
            record.finalizedAt ||
            0
          );

        if (!championReady) {
          championReady = true;
          previousChampionCreatedAt =
            createdAt;
          return;
        }

        if (
          createdAt &&
          createdAt !==
            previousChampionCreatedAt
        ) {
          void notifyTournamentResult(
            currentTournamentId,
            record
          );
        }

        previousChampionCreatedAt =
          createdAt;
      }
    );
  }

  async function start(user) {
    stop();
    state.stopped = false;
    state.user = user;

    if (
      !user ||
      !(await isAuthorizedAdmin(user))
    ) {
      return;
    }

    const db = getDatabase();

    if (!db) {
      return;
    }

    const ref = db.ref(
      "site/currentTournament"
    );

    const handler = snapshot => {
      const tournamentId = clean(
        snapshot.val(),
        "open1"
      );

      if (
        tournamentId ===
        state.activeTournamentId &&
        state.listeners.length
      ) {
        return;
      }

      bindTournament(
        tournamentId
      );
    };

    ref.on(
      "value",
      handler,
      error => {
        console.error(
          "[NEXUS NOTIFICATIONS] Active tournament listener failed:",
          error
        );
      }
    );

    state.activeTournamentListener = {
      ref,
      handler
    };
  }

  function initialize() {
    const authInstance =
      getAuth();

    if (
      !authInstance ||
      typeof authInstance
        .onAuthStateChanged !==
        "function"
    ) {
      console.error(
        "[NEXUS NOTIFICATIONS] Firebase Auth was not available."
      );

      return;
    }

    authInstance.onAuthStateChanged(
      user => {
        void start(user);
      }
    );

    window.addEventListener(
      "beforeunload",
      stop
    );
  }

  initialize();
})();
