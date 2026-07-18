const RGDailyGifts = (() => {
  const TIME_ZONE = "America/Chicago";
  const FUNCTIONS_REGION = "us-central1";
  const MAX_RECEIVED_PER_DAY = 5;

  let sendDailyGiftCallable = null;
  let openDailyGiftCallable = null;

  const sendingTo = new Set();
  const openingGifts = new Set();

  /*
    These odds are only for displaying reward chances.

    The browser does not select rewards. The deployed
    openDailyGift function performs the secure server roll.
  */
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

  /*
    The secure backend stores the active daily counters at:

    dailyGiftStats/{uid}

    The record itself contains its Central Time dateKey.
  */
  function getDailyGiftPath(uid) {
    return `dailyGiftStats/${uid}`;
  }

  function getGiftInboxPath(uid) {
    return `dailyGiftInbox/${uid}`;
  }

  function getGiftHistoryPath(uid) {
    return `dailyGiftHistory/${uid}`;
  }

  function normalizeDailyStats(data = {}) {
    const todayKey = getZonedDateKey();
    const savedDateKey = String(data.dateKey || "");

    /*
      An old record from a previous day must display as zero
      until the backend creates today's record.
    */
    const isCurrentDay = savedDateKey === todayKey;

    return {
      dateKey: todayKey,

      sentCount: isCurrentDay
        ? Math.max(0, Number(data.sentCount || 0))
        : 0,

      receivedCount: isCurrentDay
        ? Math.max(0, Number(data.receivedCount || 0))
        : 0,

      receivedLimit: MAX_RECEIVED_PER_DAY,

      sentTo:
        isCurrentDay &&
        data.sentTo &&
        typeof data.sentTo === "object"
          ? data.sentTo
          : {},

      lifetimeSent: Math.max(
        0,
        Number(data.lifetimeSent || 0)
      ),

      lifetimeReceived: Math.max(
        0,
        Number(data.lifetimeReceived || 0)
      )
    };
  }

  function listenToDailyStats(uid, callback) {
    if (!uid || typeof callback !== "function") {
      return null;
    }

    const ref = database.ref(
      getDailyGiftPath(uid)
    );

    const handler = snapshot => {
      callback(
        normalizeDailyStats(
          snapshot.val() || {}
        )
      );
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
      stats &&
      stats.sentTo &&
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

    if (sendingTo.has(friendUid)) {
      return {
        disabled: true,
        label: "Sending...",
        reason: "Your gift is being processed."
      };
    }

    if (
      hasSentToFriendToday(
        stats,
        friendUid
      )
    ) {
      return {
        disabled: true,
        label: "Gift Sent ✓",
        reason:
          "You already sent this friend a gift today."
      };
    }

    return {
      disabled: false,
      label: "Send Gift",
      reason: ""
    };
  }

  function getRewardIcon(reward) {
    if (!reward) {
      return "🎁";
    }

    if (reward.type === "crate") {
      return "📦";
    }

    return "RP";
  }

  function getOddsTotal() {
    return rewardOdds.reduce(
      (total, reward) =>
        total + Number(reward.chance || 0),
      0
    );
  }

  function requireFunctionsSdk() {
    if (
      typeof firebase === "undefined" ||
      typeof firebase.app !== "function"
    ) {
      throw new Error(
        "Firebase is not loaded on this page."
      );
    }

    const app = firebase.app();

    if (
      !app ||
      typeof app.functions !== "function"
    ) {
      throw new Error(
        "Firebase Functions is not loaded on this page."
      );
    }

    return app.functions(FUNCTIONS_REGION);
  }

  function getSendCallable() {
    if (!sendDailyGiftCallable) {
      sendDailyGiftCallable = requireFunctionsSdk()
        .httpsCallable("sendDailyGift");
    }

    return sendDailyGiftCallable;
  }

  function getOpenCallable() {
    if (!openDailyGiftCallable) {
      openDailyGiftCallable = requireFunctionsSdk()
        .httpsCallable("openDailyGift");
    }

    return openDailyGiftCallable;
  }

  function normalizeReceiverUid(value) {
    if (typeof value === "string") {
      return value.trim();
    }

    if (
      value &&
      typeof value === "object"
    ) {
      return String(
        value.receiverUid ||
        value.recipientUid ||
        value.friendUid ||
        value.uid ||
        ""
      ).trim();
    }

    return "";
  }

  function normalizeGiftId(value) {
    if (typeof value === "string") {
      return value.trim();
    }

    if (
      value &&
      typeof value === "object"
    ) {
      return String(
        value.giftId ||
        value.id ||
        ""
      ).trim();
    }

    return "";
  }

  function getFriendlyError(error) {
    const code = String(
      error?.code || ""
    );

    const message = String(
      error?.message || ""
    );

    if (
      code.includes("unauthenticated")
    ) {
      return "Please sign in again before using Daily Gifts.";
    }

    if (
      code.includes("invalid-argument")
    ) {
      return message ||
        "The Daily Gift request was invalid.";
    }

    if (
      code.includes("permission-denied")
    ) {
      return message ||
        "Daily Gifts can only be sent to confirmed friends.";
    }

    if (
      code.includes("already-exists")
    ) {
      return message ||
        "That Daily Gift action was already completed.";
    }

    if (
      code.includes("resource-exhausted")
    ) {
      return message ||
        "The Daily Gift limit has been reached.";
    }

    if (
      code.includes("not-found")
    ) {
      return message ||
        "That Daily Gift or player could not be found.";
    }

    if (
      code.includes("failed-precondition")
    ) {
      return message ||
        "Your player profile is not ready for Daily Gifts.";
    }

    if (
      code.includes("unavailable") ||
      code.includes("deadline-exceeded")
    ) {
      return "The Daily Gift server is temporarily unavailable. Please try again.";
    }

    return message ||
      "The Daily Gift action could not be completed.";
  }

  async function sendGiftSecurely(receiver) {
    const receiverUid =
      normalizeReceiverUid(receiver);

    if (!receiverUid) {
      throw new Error(
        "Missing friend account."
      );
    }

    const user = firebase.auth().currentUser;

    if (!user) {
      throw new Error(
        "Please sign in again before sending a gift."
      );
    }

    if (user.uid === receiverUid) {
      throw new Error(
        "You cannot send a gift to yourself."
      );
    }

    if (sendingTo.has(receiverUid)) {
      throw new Error(
        "This gift is already being processed."
      );
    }

    sendingTo.add(receiverUid);

    try {
      const callable = getSendCallable();

      const result = await callable({
        receiverUid
      });

      const data = result?.data || {};

      window.dispatchEvent(
        new CustomEvent(
          "rg:daily-gift-sent",
          {
            detail: data
          }
        )
      );

      return data;
    } catch (error) {
      console.error(
        "Secure Daily Gift send failed:",
        error
      );

      const friendlyError =
        new Error(getFriendlyError(error));

      friendlyError.code =
        error?.code || "";

      friendlyError.originalError = error;

      throw friendlyError;
    } finally {
      sendingTo.delete(receiverUid);
    }
  }

  async function openGiftSecurely(gift) {
    const giftId = normalizeGiftId(gift);

    if (!giftId) {
      throw new Error(
        "Missing Daily Gift."
      );
    }

    const user = firebase.auth().currentUser;

    if (!user) {
      throw new Error(
        "Please sign in again before opening your gift."
      );
    }

    if (openingGifts.has(giftId)) {
      throw new Error(
        "This gift is already being opened."
      );
    }

    openingGifts.add(giftId);

    try {
      const callable = getOpenCallable();

      const result = await callable({
        giftId
      });

      const data = result?.data || {};

      window.dispatchEvent(
        new CustomEvent(
          "rg:daily-gift-opened",
          {
            detail: data
          }
        )
      );

      return data;
    } catch (error) {
      console.error(
        "Secure Daily Gift open failed:",
        error
      );

      const friendlyError =
        new Error(getFriendlyError(error));

      friendlyError.code =
        error?.code || "";

      friendlyError.originalError = error;

      throw friendlyError;
    } finally {
      openingGifts.delete(giftId);
    }
  }

  function isSendingTo(friendUid) {
    return sendingTo.has(
      String(friendUid || "")
    );
  }

  function isOpeningGift(giftId) {
    return openingGifts.has(
      String(giftId || "")
    );
  }

  return {
    TIME_ZONE,
    FUNCTIONS_REGION,
    MAX_RECEIVED_PER_DAY,
    rewardOdds,

    getZonedDateKey,
    getDailyGiftPath,
    getGiftInboxPath,
    getGiftHistoryPath,

    normalizeDailyStats,
    listenToDailyStats,
    listenToGiftInbox,

    hasSentToFriendToday,
    canReceiveMore,
    getGiftButtonState,

    getRewardIcon,
    getOddsTotal,
    getFriendlyError,

    sendGiftSecurely,
    openGiftSecurely,

    isSendingTo,
    isOpeningGift
  };
})();

window.RGDailyGifts = RGDailyGifts;
