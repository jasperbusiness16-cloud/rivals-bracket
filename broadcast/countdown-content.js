(() => {
  "use strict";

  const PATH = "broadcastContent/countdown";
  const DEFAULT_ITEM_MS = 12000;
  const DEFAULT_STARTING_POOL = 60;

  const $ = (id) => document.getElementById(id);

  const clean = (value, fallback = "") => {
    return String(value ?? "").trim() || fallback;
  };

  const numberValue = (value, fallback = 0) => {
    const parsed = Number(value);

    return Number.isFinite(parsed)
      ? parsed
      : Number(fallback || 0);
  };

  const moneyValue = (value, fallback = 0) => {
    const parsed = Number(
      String(value ?? "").replace(/[^0-9.-]/g, "")
    );

    return Number.isFinite(parsed)
      ? parsed
      : Number(fallback || 0);
  };

  const escapeHtml = (value) => {
    return clean(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  };

  const safeUrl = (value) => {
    const raw = clean(value);

    if (!raw) {
      return "";
    }

    try {
      const url = new URL(raw, location.href);

      return ["http:", "https:", "blob:"].includes(url.protocol)
        ? url.href
        : "";
    } catch {
      return "";
    }
  };

  const formatMoney = (value) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0
    }).format(
      Math.max(0, numberValue(value))
    );
  };

  let db;

  let siteData = {};
  let countdownData = {};
  let donations = [];
  let playlist = [];
  let settings = {};

  let currentIndex = -1;
  let currentTimer = null;
  let currentVideo = null;

  let forceKey = "";
let lastTimerText = "";

let playbackToken = 0;
let transitionTimer = null;

  function databaseConnection() {
    try {
      if (
        typeof database !== "undefined" &&
        database?.ref
      ) {
        return database;
      }
    } catch (error) {
      console.warn(
        "Global database reference was not available:",
        error
      );
    }

    if (
      window.firebase?.apps?.length
    ) {
      return firebase.database();
    }

    throw new Error(
      "Firebase Realtime Database is unavailable."
    );
  }

  function parseTimestamp(value) {
    if (!value) {
      return 0;
    }

    const numeric = Number(value);

    if (
      Number.isFinite(numeric) &&
      numeric > 0
    ) {
      return numeric;
    }

    const parsed = new Date(value).getTime();

    return Number.isFinite(parsed)
      ? parsed
      : 0;
  }

  function getStartTime() {
    const values = [
      countdownData.startTime,
      countdownData.countdownDate,
      siteData.countdownDate,
      countdownData.startTimeLocal
    ];

    for (const value of values) {
      const stamp = parseTimestamp(value);

      if (stamp > 0) {
        return stamp;
      }
    }

    return 0;
  }

  function formatRemaining(milliseconds) {
    const total = Math.max(
      0,
      Math.floor(milliseconds / 1000)
    );

    const days = Math.floor(total / 86400);

    const hours = Math.floor(
      (total % 86400) / 3600
    );

    const minutes = Math.floor(
      (total % 3600) / 60
    );

    const seconds = total % 60;

    if (days > 0) {
      return (
        `${days}:` +
        `${String(hours).padStart(2, "0")}:` +
        `${String(minutes).padStart(2, "0")}:` +
        `${String(seconds).padStart(2, "0")}`
      );
    }

    if (hours > 0) {
      return (
        `${hours}:` +
        `${String(minutes).padStart(2, "0")}:` +
        `${String(seconds).padStart(2, "0")}`
      );
    }

    return (
      `${String(minutes).padStart(2, "0")}:` +
      `${String(seconds).padStart(2, "0")}`
    );
  }

  function formatSchedule(timestamp) {
    if (!timestamp) {
      return "Waiting for the broadcast start time.";
    }

    const formatted =
      new Intl.DateTimeFormat("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        timeZoneName: "short"
      }).format(new Date(timestamp));

    return `Scheduled for ${formatted}`;
  }

  function updateCountdown() {
    const start = getStartTime();

    const remaining = start
      ? start - Date.now()
      : 0;

    const text = start
      ? formatRemaining(remaining)
      : "--:--";

    const timer = $("timer");

    timer.classList.toggle(
      "long",
      text.length > 8
    );

    if (text !== lastTimerText) {
      timer.textContent = text;

      timer.classList.remove("tick");

      void timer.offsetWidth;

      timer.classList.add("tick");

      lastTimerText = text;
    }

    $("schedule").textContent =
      formatSchedule(start);
  }

  function normalizedDonations(raw) {
    return Object.values(raw || {})
      .map((record) => {
        return {
          amount: moneyValue(record?.amount)
        };
      })
      .filter((item) => {
        return item.amount > 0;
      });
  }

  function updateStaticData() {
    $("eventName").textContent = clean(
      countdownData.eventName ||
        siteData.eventName,
      "RIVALS GAUNTLET"
    ).toUpperCase();

    $("website").textContent = clean(
      countdownData.website ||
        siteData.websiteUrl ||
        siteData.website,
      "RIVALSGAUNTLET.COM"
    )
      .replace(/^https?:\/\//i, "")
      .replace(/^www\./i, "")
      .replace(/\/+$/, "")
      .toUpperCase();

    const starting = Math.max(
      0,
      moneyValue(
        siteData.startingPrizePool,
        moneyValue(
          siteData.prizePool,
          DEFAULT_STARTING_POOL
        )
      )
    );

    const community = donations.reduce(
      (sum, item) => {
        return sum + item.amount;
      },
      0
    );

    $("prizePool").textContent =
      formatMoney(starting + community);

    const matches =
      countdownData.matchups || {};

    const upNext =
      countdownData.upNext || {};

    $("nextTeamA").textContent = clean(
      upNext.teamA ||
        matches.match1A ||
        siteData.team1,
      "TEAM 1"
    );

    $("nextTeamB").textContent = clean(
      upNext.teamB ||
        matches.match1B ||
        siteData.team2,
      "TEAM 2"
    );

    $("nextLabelA").textContent = clean(
      upNext.label ||
        matches.match1Label,
      "UP NEXT"
    );

    $("nextLabelB").textContent = clean(
      upNext.label ||
        matches.match1Label,
      "UP NEXT"
    );

    renderSchedule();
  }

  function renderSchedule() {
    const configured =
      settings.scheduleItems;

    let items = [];

    if (
      configured &&
      typeof configured === "object"
    ) {
      items = Object.values(configured)
        .filter(Boolean)
        .sort((first, second) => {
          return (
            numberValue(first.order) -
            numberValue(second.order)
          );
        });
    }

    if (!items.length) {
      const matchups =
        countdownData.matchups || {};

      items = [1, 2, 3, 4].map(
        (number, index) => {
          const firstTeamNumber =
            index * 2 + 1;

          const secondTeamNumber =
            index * 2 + 2;

          return {
            label: clean(
              matchups[
                `match${number}Label`
              ],
              `QF${number}`
            ),

            title:
              `${clean(
                matchups[
                  `match${number}A`
                ] ||
                  siteData[
                    `team${firstTeamNumber}`
                  ],
                `TEAM ${firstTeamNumber}`
              )} VS ${clean(
                matchups[
                  `match${number}B`
                ] ||
                  siteData[
                    `team${secondTeamNumber}`
                  ],
                `TEAM ${secondTeamNumber}`
              )}`,

            subtitle:
              index === 0
                ? "Up Next"
                : "Opening Round",

            active:
              index === 0
          };
        }
      );
    }

    $("scheduleList").innerHTML = items
      .slice(0, 6)
      .map((item) => {
        return `
          <article class="schedule-item ${
            item.active ? "active" : ""
          }">
            <small>
              ${escapeHtml(
                clean(item.label, "Event")
              )}
            </small>

            <strong>
              ${escapeHtml(
                clean(
                  item.title,
                  "To Be Announced"
                )
              )}
            </strong>

            <span>
              ${escapeHtml(
                clean(item.subtitle, "")
              )}
            </span>
          </article>
        `;
      })
      .join("");
  }

  function playlistItems(raw) {
    return Object.entries(raw || {})
      .map(([id, item]) => {
        return {
          id,

          type: clean(
            item?.type,
            "news"
          ),

          title: clean(
            item?.title,
            "Rivals Gauntlet"
          ),

          subtitle: clean(
            item?.subtitle
          ),

          message: clean(
            item?.message
          ),

          submittedBy: clean(
            item?.submittedBy
          ),

          creatorHandle: clean(
            item?.creatorHandle
          ),

          creatorUrl: clean(
            item?.creatorUrl
          ),

          mediaUrl: clean(
            item?.mediaUrl
          ),

          thumbnailUrl: clean(
            item?.thumbnailUrl
          ),

          fit: clean(
            item?.fit,
            "cover"
          ),

          muted:
            item?.muted !== false,

          loop:
            item?.loop === true,

          startAt: Math.max(
            0,
            numberValue(item?.startAt)
          ),

          endAt: Math.max(
            0,
            numberValue(item?.endAt)
          ),

          durationMs: Math.max(
            3000,
            numberValue(
              item?.durationMs,
              DEFAULT_ITEM_MS
            )
          ),

          order: numberValue(
            item?.order
          ),

          enabled:
            item?.enabled !== false,

          updatedAt: numberValue(
            item?.updatedAt
          )
        };
      })
      .filter((item) => {
        return item.enabled;
      })
      .sort((first, second) => {
        return (
          first.order -
            second.order ||
          first.updatedAt -
            second.updatedAt
        );
      });
  }

  function fallbackNews() {
    return {
      id: "fallback",
      type: "news",

      title: clean(
        settings.fallbackTitle,
        "Rivals Gauntlet Open"
      ),

      subtitle: clean(
        settings.fallbackSubtitle,
        "Tournament Update"
      ),

      message: clean(
        settings.fallbackMessage,
        "Community clips, upcoming matches and official tournament updates will appear here throughout the countdown."
      ),

      durationMs: DEFAULT_ITEM_MS
    };
  }

  function activeItemById(id) {
    return playlist.find((item) => {
      return item.id === id;
    });
  }

function stopCurrent() {
  playbackToken += 1;

  if (currentTimer) {
    clearTimeout(currentTimer);
  }

  currentTimer = null;

  if (transitionTimer) {
    clearTimeout(transitionTimer);
  }

  transitionTimer = null;

  if (currentVideo) {
    try {
      currentVideo.pause();
      currentVideo.removeAttribute("src");
      currentVideo.load();
    } catch (error) {
      console.warn(
        "The current video could not be fully stopped:",
        error
      );
    }

    currentVideo = null;
  }
}

  function advance() {
    if (!playlist.length) {
      showItem(
        fallbackNews(),
        false
      );

      return;
    }

    currentIndex =
      (currentIndex + 1) %
      playlist.length;

    showItem(
      playlist[currentIndex],
      false
    );
  }

  function mount(html, callback) {
  const contentMount =
    document.getElementById("contentMount");

  if (!contentMount) {
    return;
  }

  contentMount.classList.remove(
    "fade-in",
    "fade-out"
  );

  contentMount.classList.add(
    "fade-out"
  );

  transitionTimer = window.setTimeout(() => {
    contentMount.innerHTML = html;

    contentMount.classList.remove(
      "fade-out"
    );

    contentMount.classList.add(
      "fade-in"
    );

    if (
      typeof callback === "function"
    ) {
      callback();
    }

    transitionTimer = window.setTimeout(() => {
      contentMount.classList.remove(
        "fade-in"
      );

      transitionTimer = null;
    }, 420);
  }, 220);
}

  function mediaMarkup(item, kind) {
    const url =
      safeUrl(item.mediaUrl);

    if (!url) {
      return newsMarkup({
        ...item,

        title:
          item.title ||
          "Media unavailable",

        message:
          item.message ||
          "This playlist item does not have a valid media URL."
      });
    }

    const blur =
      item.fit === "contain"
        ? kind === "video"
          ? `
            <video
              class="media-blur"
              src="${escapeHtml(url)}"
              muted
              autoplay
              loop
              playsinline
            ></video>
          `
          : `
            <img
              class="media-blur"
              src="${escapeHtml(url)}"
              alt=""
            >
          `
        : "";

    const media =
      kind === "video"
        ? `
          <video
            id="activeVideo"
            class="media-main"
            src="${escapeHtml(url)}"
            ${item.muted ? "muted" : ""}
            ${item.loop ? "loop" : ""}
            autoplay
            playsinline
            preload="auto"
          ></video>
        `
        : `
          <img
            class="media-main"
            src="${escapeHtml(url)}"
            alt=""
          >
        `;

    return `
      <div class="media-layer fit-${escapeHtml(
        item.fit
      )}">
        ${blur}
        ${media}
      </div>

      <div class="now-playing">
        <div class="playing-meta">
          <span>
            ${
              kind === "video"
                ? "Community Highlight"
                : "Featured Media"
            }
          </span>

          <strong>
            ${escapeHtml(item.title)}
          </strong>

          <small>
            ${escapeHtml(
              item.subtitle ||
                item.message
            )}
          </small>
        </div>

        <div class="submitter">
          <span>
            ${
              item.submittedBy
                ? "Submitted By"
                : "Rivals Gauntlet"
            }
          </span>

          <strong>
            ${escapeHtml(
              item.submittedBy ||
                "Official Broadcast"
            )}
          </strong>

          <small>
            ${escapeHtml(
              item.creatorHandle
            )}
          </small>
        </div>
      </div>
    `;
  }

  function newsMarkup(item) {
    return `
      <section class="news-card">
        <div class="news-copy">
          <span>
            ${escapeHtml(
              item.subtitle ||
                "Official Update"
            )}
          </span>

          <h2>
            ${escapeHtml(item.title)}
          </h2>

          <p>
            ${escapeHtml(
              item.message ||
                "More information will appear here soon."
            )}
          </p>
        </div>

        <aside class="news-side">
          <small>
            Rivals Gauntlet Broadcast
          </small>

          <strong>
            ${escapeHtml(
              clean(
                item.sideTitle,
                "Stay Connected"
              )
            )}
          </strong>

          <p>
            ${escapeHtml(
              clean(
                item.sideMessage,
                "View the live bracket, tournament details, predictions and official updates throughout the event."
              )
            )}
          </p>
        </aside>
      </section>
    `;
  }

  function matchupMarkup(item) {
    const teamA = clean(
      item.teamA ||
        item.subtitle,
      $("nextTeamA").textContent
    );

    const teamB = clean(
      item.teamB ||
        item.message,
      $("nextTeamB").textContent
    );

    return newsMarkup({
      ...item,

      subtitle: clean(
        item.label,
        "Up Next"
      ),

      title:
        `${teamA}  VS  ${teamB}`,

      message: clean(
        item.description,
        "The next Rivals Gauntlet matchup is coming up after the countdown."
      )
    });
  }

  function showItem(item, forced) {
  stopCurrent();

  const token = playbackToken;
  let finished = false;

  function finishItem() {
    if (finished) {
      return;
    }

    if (token !== playbackToken) {
      return;
    }

    finished = true;

    if (
      forced &&
      settings.holdForcedItem
    ) {
      return;
    }

    advance();
  }

  $("footerStatus").textContent =
    item.type === "clip"
      ? `Now Playing • ${clean(
          item.submittedBy,
          "Community Highlight"
        )}`
      : `${clean(
          item.subtitle,
          "Tournament Update"
        )} • Rivals Gauntlet`;

  let markup = "";

  if (item.type === "clip") {
    markup = mediaMarkup(
      item,
      "video"
    );
  } else if (item.type === "image") {
    markup = mediaMarkup(
      item,
      "img"
    );
  } else if (item.type === "matchup") {
    markup = matchupMarkup(item);
  } else {
    markup = newsMarkup(item);
  }

  mount(markup, () => {
    if (token !== playbackToken) {
      return;
    }

    if (item.type !== "clip") {
      if (
        !(
          forced &&
          settings.holdForcedItem
        )
      ) {
        currentTimer =
          window.setTimeout(
            finishItem,
            item.durationMs
          );
      }

      return;
    }

    const video =
      document.getElementById(
        "activeVideo"
      );

    if (!video) {
      currentTimer =
        window.setTimeout(
          finishItem,
          item.durationMs
        );

      return;
    }

    currentVideo = video;

    video.muted = item.muted;
    video.volume = item.muted
      ? 0
      : Math.min(
          1,
          numberValue(
            settings.clipVolume,
            0.8
          )
        );

    video.addEventListener(
      "loadedmetadata",
      () => {
        if (
          token !== playbackToken
        ) {
          return;
        }

        if (
          item.startAt > 0 &&
          item.startAt < video.duration
        ) {
          video.currentTime =
            item.startAt;
        }
      },
      {
        once: true
      }
    );

    video.addEventListener(
      "ended",
      finishItem,
      {
        once: true
      }
    );

    video.addEventListener(
      "error",
      () => {
        if (
          token !== playbackToken
        ) {
          return;
        }

        console.error(
          "Countdown video failed:",
          video.error,
          video.currentSrc
        );

        currentTimer =
          window.setTimeout(
            finishItem,
            3000
          );
      },
      {
        once: true
      }
    );

    if (
      item.endAt >
      item.startAt
    ) {
      const checkEndTime = () => {
        if (
          token !== playbackToken
        ) {
          video.removeEventListener(
            "timeupdate",
            checkEndTime
          );

          return;
        }

        if (
          video.currentTime >=
          item.endAt
        ) {
          video.removeEventListener(
            "timeupdate",
            checkEndTime
          );

          finishItem();
        }
      };

      video.addEventListener(
        "timeupdate",
        checkEndTime
      );
    }

    /*
     * Use a duration timer only when the admin
     * does not want the complete video duration.
     */
    /*
 * Video clips advance when the video ends.
 * The duration field is only used as a safety fallback.
 */
if (item.loop !== true) {
  const safetyDuration =
    Math.max(
      item.durationMs,
      10 * 60 * 1000
    );

  currentTimer = window.setTimeout(
    finishItem,
    safetyDuration
  );
}

    video.play().catch(async (error) => {
      console.warn(
        "Initial video playback failed:",
        error
      );

      /*
       * Retry muted if autoplay with sound
       * was rejected.
       */
      video.muted = true;
      video.volume = 0;

      try {
        await video.play();
      } catch (retryError) {
        console.error(
          "Muted playback also failed:",
          retryError
        );

        currentTimer =
          window.setTimeout(
            finishItem,
            3000
          );
      }
    });
  });
}
  function refreshPlaylist(
    force = false
  ) {
    if (!playlist.length) {
      currentIndex = -1;

      showItem(
        fallbackNews(),
        false
      );

      return;
    }

    if (
      force ||
      currentIndex < 0 ||
      currentIndex >=
        playlist.length
    ) {
      currentIndex = 0;

      showItem(
        playlist[0],
        false
      );
    }
  }

  function connect() {
    db = databaseConnection();

    db.ref(".info/connected").on(
      "value",
      (snapshot) => {
        const online =
          snapshot.val() === true;

        $("connection").classList.toggle(
          "online",
          online
        );

        $("connection").classList.remove(
          "error"
        );

        $("connectionText").textContent =
          online
            ? "REALTIME CONNECTED"
            : "RECONNECTING";
      }
    );

    db.ref(
      "broadcastCountdown"
    ).on(
      "value",
      (snapshot) => {
        countdownData =
          snapshot.val() || {};

        updateStaticData();
      }
    );

    db.ref("site").on(
      "value",
      (snapshot) => {
        siteData =
          snapshot.val() || {};

        updateStaticData();
      }
    );

    db.ref("donations").on(
      "value",
      (snapshot) => {
        donations =
          normalizedDonations(
            snapshot.val()
          );

        updateStaticData();
      }
    );

    db.ref(
      `${PATH}/settings`
    ).on(
      "value",
      (snapshot) => {
        settings =
          snapshot.val() || {};

        updateStaticData();

        if (!playlist.length) {
          refreshPlaylist(true);
        }
      }
    );

    db.ref(
      `${PATH}/items`
    ).on(
      "value",
      (snapshot) => {
        playlist =
          playlistItems(
            snapshot.val()
          );

        refreshPlaylist(true);
      }
    );

    db.ref(
      `${PATH}/control`
    ).on(
      "value",
      (snapshot) => {
        const control =
          snapshot.val() || {};

        const key =
          `${clean(
            control.forceItemId
          )}:${numberValue(
            control.forceNonce
          )}`;

        if (key === forceKey) {
          return;
        }

        forceKey = key;

        if (
          control.forceItemId
        ) {
          const item =
            activeItemById(
              control.forceItemId
            );

          if (item) {
            currentIndex =
              playlist.findIndex(
                (entry) => {
                  return (
                    entry.id === item.id
                  );
                }
              );

            showItem(
              item,
              true
            );
          }
        } else if (
          control.command === "next"
        ) {
          advance();
        } else if (
          control.command === "resume"
        ) {
          refreshPlaylist(true);
        }
      }
    );

    window.setInterval(
      updateCountdown,
      250
    );

    updateCountdown();
  }

  window.addEventListener(
    "error",
    (event) => {
      $("connection").classList.add(
        "error"
      );

      $("connectionText").textContent =
        "SCRIPT ERROR";

      console.error(
        "[RG COUNTDOWN]",
        event.error ||
          event.message
      );
    }
  );

  connect();
})();
