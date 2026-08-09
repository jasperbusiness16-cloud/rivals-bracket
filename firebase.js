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
