(() => {
  "use strict";

  if (window.__RG_REFERRAL_ATTRIBUTION__) return;
  window.__RG_REFERRAL_ATTRIBUTION__ = true;

  const pathname = String(window.location.pathname || "");
  const isSignup = /^\/signup(?:\.html)?\/?$/i.test(pathname);
  const isApply = /^\/apply(?:\.html)?\/?$/i.test(pathname);

  if (!isSignup && !isApply) return;

  const rgDatabase = window.database;
  const rgAuth = window.auth;

  if (!rgDatabase || !rgAuth) {
    console.error("[RG Referral] Firebase was not ready for conversion attribution.");
    return;
  }

  const ATTRIBUTION_KEY = "rg_referral_attribution_v1";

  function clean(value, max = 100) {
    return String(value == null ? "" : value).trim().slice(0, max);
  }

  function cleanCode(value) {
    return clean(value, 48)
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, "")
      .replace(/^-+|-+$/g, "");
  }

  function getAttribution() {
    let attribution;

    try {
      attribution = JSON.parse(
        localStorage.getItem(ATTRIBUTION_KEY) || "null"
      );
    } catch {
      return null;
    }

    if (!attribution || typeof attribution !== "object") {
      return null;
    }

    const code = cleanCode(attribution.code);
    const expiresAt = Number(attribution.expiresAt || 0);

    if (!code || !expiresAt || Date.now() > expiresAt) {
      try {
        localStorage.removeItem(ATTRIBUTION_KEY);
      } catch {}
      return null;
    }

    return {
      code,
      creatorName: clean(attribution.creatorName || code, 100),
      platform: clean(attribution.platform, 40),
      source: clean(attribution.source, 60),
      medium: clean(attribution.medium || "creator", 60),
      campaign: clean(attribution.campaign, 80),
      firstReferredAt: Number(attribution.firstReferredAt || 0),
      lastReferredAt: Number(attribution.lastReferredAt || 0),
      expiresAt
    };
  }

  function analyticsRecord(attribution, extra = {}) {
    return {
      creator: attribution.code,
      creatorName: attribution.creatorName,
      platform: attribution.platform,
      source: attribution.source,
      medium: attribution.medium,
      campaign: attribution.campaign,
      firstReferredAt: attribution.firstReferredAt || null,
      lastReferredAt: attribution.lastReferredAt || null,
      createdAt: firebase.database.ServerValue.TIMESTAMP,
      ...extra
    };
  }

  async function recordSignup(user) {
    const attribution = getAttribution();

    if (!attribution || !user || !user.uid) return;

    await rgDatabase
      .ref(`referralAnalytics/${attribution.code}/signups/${user.uid}`)
      .set(
        analyticsRecord(attribution, {
          uid: user.uid
        })
      );
  }

  if (isSignup && typeof rgAuth.createUserWithEmailAndPassword === "function") {
    const originalCreateUser =
      rgAuth.createUserWithEmailAndPassword.bind(rgAuth);

    rgAuth.createUserWithEmailAndPassword = async (...args) => {
      const credential = await originalCreateUser(...args);

      try {
        await recordSignup(credential && credential.user);
      } catch (error) {
        console.warn(
          "[RG Referral] Account attribution could not be recorded:",
          error && error.message ? error.message : error
        );
      }

      return credential;
    };
  }

  if (isApply && typeof rgDatabase.ref === "function") {
    const originalRef = rgDatabase.ref.bind(rgDatabase);

    rgDatabase.ref = path => {
      const reference = originalRef(path);
      const normalizedPath = String(path || "")
        .replace(/^\/+|\/+$/g, "");

      const match = normalizedPath.match(
        /^applications\/([^/]+)\/([^/]+)$/i
      );

      if (!match || reference.__rgReferralApplicationWrapped) {
        return reference;
      }

      reference.__rgReferralApplicationWrapped = true;

      const tournamentId = match[1];
      const uid = match[2];
      const originalSet = reference.set.bind(reference);

      reference.set = async value => {
        const attribution = getAttribution();
        const currentUser = rgAuth.currentUser;

        let shouldAttribute = Boolean(
          attribution &&
          currentUser &&
          currentUser.uid === uid &&
          value &&
          typeof value === "object" &&
          !Array.isArray(value)
        );

        if (shouldAttribute) {
          try {
            const existing = await reference.once("value");
            shouldAttribute = !existing.exists();
          } catch (error) {
            shouldAttribute = false;
            console.warn(
              "[RG Referral] Could not verify whether this is a new application:",
              error && error.message ? error.message : error
            );
          }
        }

        let payload = value;

        if (shouldAttribute) {
          payload = {
            ...value,
            referral: {
              creator: attribution.code,
              creatorName: attribution.creatorName,
              platform: attribution.platform,
              source: attribution.source,
              medium: attribution.medium,
              campaign: attribution.campaign,
              firstReferredAt: attribution.firstReferredAt || null,
              lastReferredAt: attribution.lastReferredAt || null,
              attributedAt: Date.now()
            }
          };
        }

        const result = await originalSet(payload);

        if (shouldAttribute) {
          try {
            await originalRef(
              `referralAnalytics/${attribution.code}/applications/${tournamentId}/${uid}`
            ).set(
              analyticsRecord(attribution, {
                uid,
                tournamentId
              })
            );
          } catch (error) {
            console.warn(
              "[RG Referral] Application attribution could not be recorded:",
              error && error.message ? error.message : error
            );
          }
        }

        return result;
      };

      return reference;
    };
  }
})();
