const RGDailyGifts = (() => {
  const TIME_ZONE = "America/Chicago";
  const MAX_RECEIVED_PER_DAY = 5;

  const rewardOdds = [
    {
      id: "rp_10",
      type: "rg_points",
      label: "10 RP",
      amount: 10,
      chance: 45
    },
    {
      id: "rp_20",
      type: "rg_points",
      label: "20 RP",
      amount: 20,
      chance: 25
    },
    {
      id: "rp_40",
      type: "rg_points",
      label: "40 RP",
      amount: 40,
      chance: 15
    },
    {
      id: "rp_75",
      type: "rg_points",
      label: "75 RP",
      amount: 75,
      chance: 9
    },
    {
      id: "basic_crate",
      type: "crate",
      label: "Basic Crate",
      itemId: "basic_crate",
      amount: 1,
      chance: 5
    },
    {
      id: "elite_crate",
      type: "crate",
      label: "Elite Crate",
      itemId: "elite_crate",
      amount: 1,
      chance: 1,
      jackpot: true
    }
  ];

  function getZonedDateKey(timestamp = Date.now()) {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: TIME_ZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    });

    const parts = formatter.formatToParts(
      new Date(timestamp)
    );

    const result = {};

    parts.forEach(part => {
      if (part.type !== "literal") {
        result[part.type] = part.value;
      }
    });

    return [
      result.year,
      result.month,
      result.day
    ].join("-");
  }

  function getDailyGiftPath(uid, dateKey = getZonedDateKey()) {
    return `dailyGiftStats/${uid}/${dateKey}`;
  }

  function getGiftInboxPath(uid) {
    return `dailyGiftInbox/${uid}`;
  }

  function getGiftHistoryPath(uid) {
    return `dailyGiftHistory/${uid}`;
  }

  function listenToDailyStats(uid, callback) {
    if (!uid || typeof callback !== "function") {
      return null;
    }

    const dateKey = getZonedDateKey();
    const ref = database.ref(
      getDailyGiftPath(uid, dateKey)
    );

    const handler = snapshot => {
      const data = snapshot.val() || {};

      callback({
        dateKey,
        sentCount: Math.max(
          0,
          Number(data.sentCount || 0)
        ),
        receivedCount: Math.max(
          0,
          Number(data.receivedCount || 0)
        ),
        receivedLimit: MAX_RECEIVED_PER_DAY,
        sentTo: data.sentTo || {}
      });
    };

    ref.on("value", handler);

    return () => {
      ref.off("value", handler);
    };
  }

  function listenToGiftInbox(uid, callback) {
    if (!uid || typeof callback !== "function") {
      return null;
    }

    const ref = database
      .ref(getGiftInboxPath(uid))
      .orderByChild("createdAt");

    const handler = snapshot => {
      const data = snapshot.val() || {};

      const gifts = Object.entries(data)
        .map(([id, gift]) => ({
          id,
          ...gift
        }))
        .sort((a, b) =>
          Number(b.createdAt || 0) -
          Number(a.createdAt || 0)
        );

      callback(gifts);
    };

    ref.on("value", handler);

    return () => {
      ref.off("value", handler);
    };
  }

  function hasSentToFriendToday(
    stats,
    friendUid
  ) {
    return Boolean(
      stats?.sentTo &&
      stats.sentTo[friendUid]
    );
  }

  function canReceiveMore(stats) {
    return Number(
      stats?.receivedCount || 0
    ) < MAX_RECEIVED_PER_DAY;
  }

  function getGiftButtonState(
    stats,
    friendUid
  ) {
    if (!friendUid) {
      return {
        disabled: true,
        label: "Unavailable",
        reason: "Missing friend account."
      };
    }

    if (hasSentToFriendToday(stats, friendUid)) {
      return {
        disabled: true,
        label: "Gift Sent ✓",
        reason: "You already sent this friend a gift today."
      };
    }

    return {
      disabled: false,
      label: "Send Gift",
      reason: ""
    };
  }

  function getRewardIcon(reward) {
    if (!reward) return "🎁";
    if (reward.type === "crate") return "📦";
    return "RP";
  }

  function getOddsTotal() {
    return rewardOdds.reduce(
      (total, reward) =>
        total + Number(reward.chance || 0),
      0
    );
  }

  /*
    This intentionally does not send or open gifts yet.

    The final implementation must call a secure Firebase
    Function so the browser cannot choose rewards, bypass
    daily limits, or award itself RP/crates.
  */

  function sendGiftSecurely() {
    return Promise.reject(
      new Error(
        "Daily Gift backend is not deployed yet."
      )
    );
  }

  function openGiftSecurely() {
    return Promise.reject(
      new Error(
        "Daily Gift backend is not deployed yet."
      )
    );
  }

  return {
    TIME_ZONE,
    MAX_RECEIVED_PER_DAY,
    rewardOdds,
    getZonedDateKey,
    getDailyGiftPath,
    getGiftInboxPath,
    getGiftHistoryPath,
    listenToDailyStats,
    listenToGiftInbox,
    hasSentToFriendToday,
    canReceiveMore,
    getGiftButtonState,
    getRewardIcon,
    getOddsTotal,
    sendGiftSecurely,
    openGiftSecurely
  };
})();
