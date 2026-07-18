const RGDailyCheckIn = (() => {
  const TIME_ZONE = "America/Chicago";
  const FUNCTIONS_REGION = "us-central1";

  let claimInProgress = false;
  let claimDailyRewardCallable = null;

  const rewardTrack = [
    {
      day: 1,
      type: "rg_points",
      amount: 10,
      label: "10 RP"
    },
    {
      day: 2,
      type: "rg_points",
      amount: 15,
      label: "15 RP"
    },
    {
      day: 3,
      type: "rg_points",
      amount: 20,
      label: "20 RP"
    },
    {
      day: 4,
      type: "rg_points",
      amount: 25,
      label: "25 RP"
    },
    {
      day: 5,
      type: "rg_points",
      amount: 30,
      label: "30 RP"
    },
    {
      day: 6,
      type: "rg_points",
      amount: 40,
      label: "40 RP"
    },
    {
      day: 7,
      type: "crate",
      itemId: "basic_crate",
      amount: 1,
      label: "Basic Crate"
    }
  ];

  function getZonedParts(timestamp = Date.now()) {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: TIME_ZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23"
    });

    const parts = formatter.formatToParts(
      new Date(timestamp)
    );

    return parts.reduce((result, part) => {
      if (part.type !== "literal") {
        result[part.type] = Number(part.value);
      }

      return result;
    }, {});
  }

  function getDateKey(timestamp = Date.now()) {
    const parts = getZonedParts(timestamp);

    return [
      parts.year,
      String(parts.month).padStart(2, "0"),
      String(parts.day).padStart(2, "0")
    ].join("-");
  }

  function dateKeyToUtcNoon(dateKey) {
    const [year, month, day] = dateKey
      .split("-")
      .map(Number);

    return Date.UTC(year, month - 1, day, 12, 0, 0);
  }

  function shiftDateKey(dateKey, amount) {
    const date = new Date(
      dateKeyToUtcNoon(dateKey) +
      amount * 24 * 60 * 60 * 1000
    );

    return [
      date.getUTCFullYear(),
      String(date.getUTCMonth() + 1).padStart(2, "0"),
      String(date.getUTCDate()).padStart(2, "0")
    ].join("-");
  }

  function getPreviousDateKey(timestamp = Date.now()) {
    return shiftDateKey(getDateKey(timestamp), -1);
  }

  function getTimeZoneOffset(timestamp) {
    const parts = getZonedParts(timestamp);

    const representedAsUtc = Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute,
      parts.second
    );

    return representedAsUtc - timestamp;
  }

  function zonedDateTimeToUtc({
    year,
    month,
    day,
    hour = 0,
    minute = 0,
    second = 0
  }) {
    const estimatedUtc = Date.UTC(
      year,
      month - 1,
      day,
      hour,
      minute,
      second
    );

    const firstOffset = getTimeZoneOffset(estimatedUtc);

    let result = estimatedUtc - firstOffset;

    const correctedOffset = getTimeZoneOffset(result);

    if (correctedOffset !== firstOffset) {
      result = estimatedUtc - correctedOffset;
    }

    return result;
  }

  function getNextResetAt(timestamp = Date.now()) {
    const todayKey = getDateKey(timestamp);
    const tomorrowKey = shiftDateKey(todayKey, 1);

    const [year, month, day] = tomorrowKey
      .split("-")
      .map(Number);

    return zonedDateTimeToUtc({
      year,
      month,
      day,
      hour: 0,
      minute: 0,
      second: 0
    });
  }

  function getRewardForDay(day) {
    const normalizedDay = Math.min(
      7,
      Math.max(1, Number(day || 1))
    );

    return rewardTrack.find(
      reward => reward.day === normalizedDay
    );
  }

  function calculateStatus(state = {}, timestamp = Date.now()) {
    const todayKey = getDateKey(timestamp);
    const yesterdayKey = getPreviousDateKey(timestamp);

    const lastClaimDate = state.lastClaimDate || "";
    const claimedToday = lastClaimDate === todayKey;

    const savedCycleDay = Math.min(
      7,
      Math.max(0, Number(state.cycleDay || 0))
    );

    const savedStreak = Math.max(
      0,
      Number(state.currentStreak || 0)
    );

    let nextCycleDay;
    let projectedStreak;

    if (claimedToday) {
      nextCycleDay =
        savedCycleDay >= 7
          ? 1
          : savedCycleDay + 1;

      projectedStreak = savedStreak;
    } else if (lastClaimDate === yesterdayKey) {
      nextCycleDay =
        savedCycleDay >= 7
          ? 1
          : savedCycleDay + 1;

      projectedStreak = savedStreak + 1;
    } else {
      nextCycleDay = 1;
      projectedStreak = 1;
    }

    return {
      claimedToday,
      canClaim: !claimedToday,
      todayKey,
      yesterdayKey,
      nextResetAt: getNextResetAt(timestamp),

      currentStreak: savedStreak,
      longestStreak: Math.max(
        0,
        Number(state.longestStreak || 0)
      ),

      cycleDay: savedCycleDay,
      nextCycleDay,
      projectedStreak,

      totalClaims: Math.max(
        0,
        Number(state.totalClaims || 0)
      ),

      nextReward: getRewardForDay(nextCycleDay)
    };
  }

  function load(uid) {
    if (!uid) {
      return Promise.reject(
        new Error("Missing player account.")
      );
    }

    return database
      .ref(`dailyCheckIns/${uid}`)
      .once("value")
      .then(snapshot => {
        const state = snapshot.val() || {};

        return {
          state,
          status: calculateStatus(state)
        };
      });
  }

  function listen(uid, callback) {
    if (!uid || typeof callback !== "function") {
      return null;
    }

    const ref = database.ref(`dailyCheckIns/${uid}`);

    const handler = snapshot => {
      const state = snapshot.val() || {};

      callback({
        state,
        status: calculateStatus(state)
      });
    };

    ref.on("value", handler);

    return () => {
      ref.off("value", handler);
    };
  }

  function formatCountdown(milliseconds) {
    const safeValue = Math.max(
      0,
      Number(milliseconds || 0)
    );

    const totalSeconds = Math.floor(
      safeValue / 1000
    );

    const hours = Math.floor(totalSeconds / 3600);

    const minutes = Math.floor(
      (totalSeconds % 3600) / 60
    );

    const seconds = totalSeconds % 60;

    return [
      String(hours).padStart(2, "0"),
      String(minutes).padStart(2, "0"),
      String(seconds).padStart(2, "0")
    ].join(":");
  }

  function getCountdown(nextResetAt) {
    const remaining = Math.max(
      0,
      Number(nextResetAt || 0) - Date.now()
    );

    return {
      remaining,
      complete: remaining <= 0,
      formatted: formatCountdown(remaining)
    };
  }

  function getClaimCallable() {
    if (
      typeof firebase === "undefined" ||
      typeof firebase.functions !== "function"
    ) {
      throw new Error(
        "Firebase Functions is not loaded on this page."
      );
    }

    if (!claimDailyRewardCallable) {
      claimDailyRewardCallable = firebase
  .app()
  .functions(FUNCTIONS_REGION)
  .httpsCallable("claimDailyReward");
    }

    return claimDailyRewardCallable;
  }

  function getFriendlyClaimError(error) {
    const code = String(error?.code || "");

    if (code.includes("unauthenticated")) {
      return "Please sign in again before claiming your reward.";
    }

    if (code.includes("already-exists")) {
      return "You already claimed today's daily reward.";
    }

    if (code.includes("failed-precondition")) {
      return error?.message ||
        "Your player profile must be completed before claiming.";
    }

    if (code.includes("resource-exhausted")) {
      return "Your reward is already being processed. Wait a moment and try again.";
    }

    if (
      code.includes("unavailable") ||
      code.includes("deadline-exceeded")
    ) {
      return "The reward server is temporarily unavailable. Please try again.";
    }

    if (code.includes("permission-denied")) {
      return "Your account is not allowed to claim this reward.";
    }

    return error?.message ||
      "The daily reward could not be claimed.";
  }

  function setClaimUi({
    text,
    disabled,
    countdownText,
    error = false
  }) {
    const button = document.getElementById("dailyClaimButton");
    const countdown = document.getElementById("dailyCountdown");

    if (button) {
      if (text) {
        button.innerText = text;
      }

      button.disabled = Boolean(disabled);
    }

    if (countdown && countdownText) {
      countdown.innerText = countdownText;
      countdown.style.color = error ? "#ef4444" : "";
    }
  }

  async function claimDailyReward() {
    if (claimInProgress) {
      return;
    }

    const user = firebase.auth().currentUser;

    if (!user) {
      setClaimUi({
        text: "Sign In Required",
        disabled: true,
        countdownText: "Please sign in again to claim your reward.",
        error: true
      });
      return;
    }

    claimInProgress = true;

    setClaimUi({
      text: "Claiming...",
      disabled: true,
      countdownText: "Securely processing your reward..."
    });

    try {
      const callable = getClaimCallable();
      const result = await callable({});
      const data = result?.data || {};

      const rewardName =
        data.reward?.name ||
        data.reward?.label ||
        "Daily reward";

      if (data.duplicate) {
        setClaimUi({
          text: "Claimed Today",
          disabled: true,
          countdownText:
            "Today's reward was already added to your account."
        });
      } else {
        setClaimUi({
          text: "Claimed!",
          disabled: true,
          countdownText:
            `✓ ${rewardName} added. Streak: ${Number(
              data.currentStreak || 1
            )}.`
        });
      }

      window.dispatchEvent(
        new CustomEvent("rg:daily-reward-claimed", {
          detail: data
        })
      );

      window.setTimeout(() => {
        load(user.uid)
          .then(refreshed => {
            window.dispatchEvent(
              new CustomEvent("rg:daily-checkin-refreshed", {
                detail: refreshed
              })
            );
          })
          .catch(error => {
            console.error(
              "Daily check-in fallback refresh failed:",
              error
            );
          });
      }, 1200);
    } catch (error) {
      console.error(
        "Secure daily reward claim failed:",
        error
      );

      setClaimUi({
        text: "Try Again",
        disabled: false,
        countdownText: getFriendlyClaimError(error),
        error: true
      });
    } finally {
      claimInProgress = false;
    }
  }

  return {
    TIME_ZONE,
    FUNCTIONS_REGION,
    rewardTrack,
    getDateKey,
    getPreviousDateKey,
    getNextResetAt,
    getRewardForDay,
    calculateStatus,
    formatCountdown,
    getCountdown,
    load,
    listen,
    claimDailyReward
  };
})();

window.claimDailyReward =
  RGDailyCheckIn.claimDailyReward;
