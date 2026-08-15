const firebaseConfig = {
  apiKey: "AIzaSyDKEp-XP1QDCvnAJjn_tGkvjg2nMveJdq8",
  authDomain: "rivals-bracket-eb713.firebaseapp.com",
  databaseURL: "https://rivals-bracket-eb713-default-rtdb.firebaseio.com",
  projectId: "rivals-bracket-eb713",
  storageBucket: "rivals-bracket-eb713.firebasestorage.app",
  messagingSenderId: "248737838095",
  appId: "1:248737838095:web:583b27b79021b8ac9c9f7a"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

window.database = firebase.database();
window.auth = firebase.auth();

/*
  Keep Font Awesome available for shared header controls on every page.
  Several production pages intentionally do not load Font Awesome themselves,
  while the global header currently uses it for Friends and Notifications.
*/
(() => {
  const alreadyLoaded = Array.from(
    document.querySelectorAll('link[rel="stylesheet"]')
  ).some(link =>
    String(link.href || "").includes("font-awesome") ||
    String(link.href || "").includes("fontawesome")
  );

  if (alreadyLoaded) return;

  const fontAwesome = document.createElement("link");
  fontAwesome.rel = "stylesheet";
  fontAwesome.href =
    "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css";
  fontAwesome.referrerPolicy = "no-referrer";

  document.head.appendChild(fontAwesome);
})();

/*
  Keep these names available for older page scripts
  that use database and auth directly.
*/
const database = window.database;
const auth = window.auth;

/*
  Current-roster role guard.

  Emergency substitutions deliberately stamp roster entries with
  addedAsSubstitute / substitutedAt / replacedPlayerUid. A newly published
  roster is a new baseline, so a substitution that happened before the newest
  teams/{tournamentId}/publishedAt must not keep a player in substitute mode.

  Player surfaces receive a sanitized read-only view of the roster. The legacy
  Team Builder is also guarded so it cannot copy historical substitution fields
  from an application back into a newly saved or published baseline roster.
*/
(() => {
  "use strict";

  if (window.__RG_ROSTER_ROLE_GUARD__) return;

  const pathname = String(
    window.location.pathname || ""
  );

  const playerRoleSurface =
    /^\/(?:dashboard|check-in)(?:\.html)?\/?$/i.test(
      pathname
    );

  const legacyTeamBuilder =
    /^\/team-builder(?:\.html)?\/?$/i.test(
      pathname
    );

  if (!playerRoleSurface && !legacyTeamBuilder) {
    return;
  }

  window.__RG_ROSTER_ROLE_GUARD__ = true;

  const originalRef =
    database.ref.bind(database);

  const substitutionFields = [
    "addedAsSubstitute",
    "substitutedAt",
    "substitutedInto",
    "substituteTeam",
    "replacedPlayerUid",
    "replacedBySubUid",
    "replacedAt",
    "discordSubstitutionStatus",
    "discordSubstitutionJobId",
    "discordSubstitutionError",
    "discordSubstitutionUpdatedAt"
  ];

  function clonePlain(value) {
    if (
      !value ||
      typeof value !== "object"
    ) {
      return value;
    }

    try {
      return JSON.parse(
        JSON.stringify(value)
      );
    } catch (error) {
      console.warn(
        "[RG] Roster role guard could not clone a Firebase value.",
        error
      );

      return value;
    }
  }

  function forEachRosterMember(
    teamsValue,
    callback
  ) {
    if (
      !teamsValue ||
      typeof teamsValue !== "object"
    ) {
      return;
    }

    Object.values(teamsValue).forEach(team => {
      if (Array.isArray(team)) {
        team.forEach(member => {
          if (
            member &&
            typeof member === "object"
          ) {
            callback(member);
          }
        });

        return;
      }

      if (
        team &&
        typeof team === "object"
      ) {
        const roster =
          team.players ||
          team.roster ||
          team.members ||
          team.lineup;

        if (Array.isArray(roster)) {
          roster.forEach(member => {
            if (
              member &&
              typeof member === "object"
            ) {
              callback(member);
            }
          });

          return;
        }

        if (
          roster &&
          typeof roster === "object"
        ) {
          Object.values(roster).forEach(member => {
            if (
              member &&
              typeof member === "object"
            ) {
              callback(member);
            }
          });

          return;
        }

        Object.values(team).forEach(member => {
          if (
            member &&
            typeof member === "object" &&
            (member.uid || member.userId || member.id)
          ) {
            callback(member);
          }
        });
      }
    });
  }

  function clearSubstitutionFields(member) {
    substitutionFields.forEach(field => {
      delete member[field];
    });
  }

  function sanitizePublishedRoster(record) {
    const copy = clonePlain(record);

    if (
      !copy ||
      typeof copy !== "object"
    ) {
      return copy;
    }

    const publishedAt = Number(
      copy.publishedAt || 0
    );

    if (!(publishedAt > 0)) {
      return copy;
    }

    const teamsValue =
      copy.teams ||
      copy.rosters ||
      null;

    forEachRosterMember(
      teamsValue,
      member => {
        const substitutedAt = Number(
          member.substitutedAt || 0
        );

        const hasSubstitutionMarker = Boolean(
          member.addedAsSubstitute === true ||
          substitutedAt > 0 ||
          member.replacedPlayerUid
        );

        if (
          hasSubstitutionMarker &&
          substitutedAt > 0 &&
          substitutedAt < publishedAt
        ) {
          clearSubstitutionFields(member);
        }
      }
    );

    return copy;
  }

  function sanitizeBaselineRoster(record) {
    const copy = clonePlain(record);

    if (
      !copy ||
      typeof copy !== "object"
    ) {
      return copy;
    }

    const teamsValue =
      copy.teams ||
      copy.rosters ||
      null;

    forEachRosterMember(
      teamsValue,
      clearSubstitutionFields
    );

    return copy;
  }

  function sanitizeTeamsOnly(teamsValue) {
    const copy = clonePlain(teamsValue);

    forEachRosterMember(
      copy,
      clearSubstitutionFields
    );

    return copy;
  }

  function wrapSnapshot(snapshot) {
    return new Proxy(snapshot, {
      get(target, property) {
        if (property === "val") {
          return () =>
            sanitizePublishedRoster(
              target.val()
            );
        }

        const value = target[property];

        return typeof value === "function"
          ? value.bind(target)
          : value;
      }
    });
  }

  function wrapPlayerRosterReference(ref) {
    const callbackMap = new WeakMap();
    const originalOn = ref.on.bind(ref);
    const originalOff = ref.off.bind(ref);
    const originalOnce = ref.once.bind(ref);

    ref.on = (
      eventType,
      callback,
      cancelCallback,
      context
    ) => {
      if (
        eventType !== "value" ||
        typeof callback !== "function"
      ) {
        return originalOn(
          eventType,
          callback,
          cancelCallback,
          context
        );
      }

      const wrappedCallback = snapshot => {
        return callback.call(
          context || null,
          wrapSnapshot(snapshot)
        );
      };

      callbackMap.set(
        callback,
        wrappedCallback
      );

      return originalOn(
        eventType,
        wrappedCallback,
        cancelCallback,
        context
      );
    };

    ref.off = (
      eventType,
      callback,
      context
    ) => {
      const wrappedCallback =
        callback &&
        callbackMap.get(callback);

      return originalOff(
        eventType,
        wrappedCallback || callback,
        context
      );
    };

    ref.once = (
      eventType,
      successCallback,
      failureCallback,
      context
    ) => {
      if (eventType !== "value") {
        return originalOnce(
          eventType,
          successCallback,
          failureCallback,
          context
        );
      }

      if (
        typeof successCallback === "function"
      ) {
        return originalOnce(
          eventType,
          snapshot =>
            successCallback.call(
              context || null,
              wrapSnapshot(snapshot)
            ),
          failureCallback,
          context
        );
      }

      return originalOnce(eventType).then(
        wrapSnapshot
      );
    };

    return ref;
  }

  function wrapLegacyBuilderReference(
    ref,
    refPath
  ) {
    const originalSet = ref.set.bind(ref);
    const originalUpdate = ref.update.bind(ref);

    ref.set = value => {
      if (/^teams\/[^/]+$/i.test(refPath)) {
        return originalSet(
          sanitizeBaselineRoster(value)
        );
      }

      return originalSet(value);
    };

    ref.update = updates => {
      if (
        !updates ||
        typeof updates !== "object"
      ) {
        return originalUpdate(updates);
      }

      const cleanUpdates =
        clonePlain(updates);

      Object.keys(cleanUpdates).forEach(key => {
        const normalizedKey = String(key)
          .replace(/^\/+|\/+$/g, "");

        if (/^teams\/[^/]+$/i.test(normalizedKey)) {
          cleanUpdates[key] =
            sanitizeBaselineRoster(
              cleanUpdates[key]
            );

          return;
        }

        if (/^teams\/[^/]+\/teams$/i.test(normalizedKey)) {
          cleanUpdates[key] =
            sanitizeTeamsOnly(
              cleanUpdates[key]
            );
        }
      });

      return originalUpdate(cleanUpdates);
    };

    return ref;
  }

  database.ref = path => {
    const ref = originalRef(path);

    const refPath = String(
      path || ""
    ).replace(/^\/+|\/+$/g, "");

    if (
      playerRoleSurface &&
      /^teams\/[^/]+$/i.test(refPath)
    ) {
      return wrapPlayerRosterReference(ref);
    }

    if (legacyTeamBuilder) {
      return wrapLegacyBuilderReference(
        ref,
        refPath
      );
    }

    return ref;
  };
})();

/*
  Launch guard for the shared header.

  firebase.js loads before global-header.js on the production pages, so the
  setter below patches the header instance synchronously when global-header.js
  assigns window.RGHeader and before header.init() begins. This keeps the
  notification bell on the canonical notification paths and makes every header
  identity surface initials-only without relying on legacy profile-image data.
*/
(() => {
  "use strict";

  const patchHeader = header => {
    if (!header || header.__rgLaunchGuardApplied) return;
    header.__rgLaunchGuardApplied = true;

    header.config = header.config || {};
    header.config.notificationPaths = [
      "notifications/{uid}",
      "userNotifications/{uid}"
    ];
    header.config.avatarKeys = [];
    header.config.defaultAvatar = "";

    /* Always show the complete RG Points balance in the header. */
    if (typeof header.updatePoints === "function") {
      const originalUpdatePoints =
        header.updatePoints.bind(header);

      header.updatePoints = value => {
        const result = originalUpdatePoints(value);
        const points = Math.max(0, Number(value) || 0);

        if (header.dom?.pointsShort) {
          header.dom.pointsShort.textContent =
            typeof header.formatFull === "function"
              ? header.formatFull(points)
              : Math.floor(points).toLocaleString("en-US");
        }

        return result;
      };
    }

    if (typeof header.updateIdentity === "function") {
      const originalUpdateIdentity =
        header.updateIdentity.bind(header);

      header.updateIdentity = data => {
        return originalUpdateIdentity({
          ...(data || {}),
          avatar: ""
        });
      };
    }

    if (typeof header.normalizeFriend === "function") {
      const originalNormalizeFriend =
        header.normalizeFriend.bind(header);

      header.normalizeFriend = item => {
        const normalized = originalNormalizeFriend(item);
        if (normalized) normalized.avatar = "";
        return normalized;
      };
    }

    if (typeof header.normalizeFriendRequest === "function") {
      const originalNormalizeFriendRequest =
        header.normalizeFriendRequest.bind(header);

      header.normalizeFriendRequest = item => {
        const normalized = originalNormalizeFriendRequest(item);
        if (normalized) normalized.avatar = "";
        return normalized;
      };
    }

    if (typeof header.renderPlayerSearchResults === "function") {
      const originalRenderPlayerSearchResults =
        header.renderPlayerSearchResults.bind(header);

      header.renderPlayerSearchResults = players => {
        const initialsOnly = Array.isArray(players)
          ? players.map(player => ({
              ...(player || {}),
              profileImage: "",
              avatar: "",
              avatarUrl: "",
              photoURL: ""
            }))
          : [];

        return originalRenderPlayerSearchResults(initialsOnly);
      };
    }

    /* Retired Daily Gift UI is intentionally inert at launch. */
    header.renderGiftInbox = () => {};
  };

  if (window.RGHeader) {
    patchHeader(window.RGHeader);
    return;
  }

  let headerValue;

  try {
    Object.defineProperty(window, "RGHeader", {
      configurable: true,
      enumerable: true,
      get() {
        return headerValue;
      },
      set(value) {
        headerValue = value;
        patchHeader(value);
      }
    });
  } catch (error) {
    console.warn("[RG] Header launch guard could not install early.", error);

    const fallback = window.setInterval(() => {
      if (!window.RGHeader) return;
      window.clearInterval(fallback);
      patchHeader(window.RGHeader);
    }, 25);
  }
})();

/*
  The Donate page keeps all-time supporter history, while this guard ensures
  the live/current prize pool only counts donations assigned to the active
  tournament. It runs alongside the page's existing all-time supporter view.
*/
if (
  /^\/donate(?:\.html)?\/?$/i.test(
    window.location.pathname
  )
) {
  const donateScopeScript =
    document.createElement("script");

  donateScopeScript.src =
    "donate-scope.js?v=1";

  donateScopeScript.async = false;

  donateScopeScript.onerror = () => {
    console.error(
      "[RG] Active tournament prize pool guard failed to load."
    );
  };

  document.head.appendChild(
    donateScopeScript
  );
}

/*
  Make tournament selection guidance explicit on the Apply page without
  changing eligibility requirements. Public Marvel Rivals history and active
  creator/social links give staff more information to evaluate applicants.
*/
if (
  /^\/apply(?:\.html)?\/?$/i.test(
    window.location.pathname
  )
) {
  const applyGuidanceScript =
    document.createElement("script");

  applyGuidanceScript.src =
    "apply-selection-guidance.js?v=1";

  applyGuidanceScript.async = false;

  applyGuidanceScript.onerror = () => {
    console.error(
      "[RG] Application selection guidance failed to load."
    );
  };

  document.head.appendChild(
    applyGuidanceScript
  );
}

/*
  Nexus notification automation is admin-side only.
  Load it from the shared Firebase bootstrap when the
  Control Center is open so public pages never run it.
*/
if (
  /^\/nexus-control(?:\.html)?\/?$/i.test(
    window.location.pathname
  )
) {
  const notificationAutomationScript =
    document.createElement("script");

  notificationAutomationScript.src =
    "nexus-notification-automation.js?v=1";

  notificationAutomationScript.async = false;

  notificationAutomationScript.onerror = () => {
    console.error(
      "[NEXUS] Notification automation failed to load."
    );
  };

  document.head.appendChild(
    notificationAutomationScript
  );
}
