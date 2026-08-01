(() => {
  "use strict";

  const PATH = "broadcastContent/countdown";
  const DEFAULT_ITEM_MS = 12000;
  const DEFAULT_STARTING_POOL = 60;

  const $ = id => document.getElementById(id);

  const clean = (value, fallback = "") =>
    String(value ?? "").trim() || fallback;

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

  const escapeHtml = value =>
    clean(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  const safeUrl = value => {
    const raw = clean(value);

    if (!raw) {
      return "";
    }

    try {
      const url = new URL(raw, location.href);

      return [
        "http:",
        "https:",
        "blob:"
      ].includes(url.protocol)
        ? url.href
        : "";
    } catch {
      return "";
    }
  };

  const formatMoney = value =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0
    }).format(
      Math.max(0, numberValue(value))
    );

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
let currentItemId = "";
let sceneGeneration = 0;

  function databaseConnection() {
    try {
      if (
        typeof database !== "undefined" &&
        database?.ref
      ) {
        return database;
      }
    } catch {}

    if (window.firebase?.apps?.length) {
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

    const parsed =
      new Date(value).getTime();

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
      const stamp =
        parseTimestamp(value);

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

    const days =
      Math.floor(total / 86400);

    const hours =
      Math.floor(
        (total % 86400) / 3600
      );

    const minutes =
      Math.floor(
        (total % 3600) / 60
      );

    const seconds =
      total % 60;

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
      new Intl.DateTimeFormat(
        "en-US",
        {
          weekday: "long",
          month: "long",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
          timeZoneName: "short"
        }
      ).format(
        new Date(timestamp)
      );

    return `Scheduled for ${formatted}`;
  }

  function updateCountdown() {
    const start =
      getStartTime();

    const remaining =
      start
        ? start - Date.now()
        : 0;

    const text =
      start
        ? formatRemaining(remaining)
        : "--:--";

    const timer = $("timer");

    timer.classList.toggle(
      "long",
      text.length > 8
    );

    if (text !== lastTimerText) {
      timer.textContent = text;

      timer.classList.remove(
        "tick"
      );

      void timer.offsetWidth;

      timer.classList.add(
        "tick"
      );

      lastTimerText = text;
    }

    $("schedule").textContent =
      formatSchedule(start);
  }

  function normalizedDonations(raw) {
    return Object.values(raw || {})
      .map(record => ({
        name: clean(
          record?.name ||
          record?.displayName ||
          record?.donorName ||
          record?.fromName ||
          record?.from_name,
          "Anonymous"
        ),

        amount:
          moneyValue(
            record?.amount
          ),

        createdAt:
          parseTimestamp(
            record?.createdAt ||
            record?.timestamp ||
            record?.receivedAt ||
            record?.date
          )
      }))
      .filter(item => {
        return item.amount > 0;
      })
      .sort((first, second) => {
        return (
          second.createdAt -
          first.createdAt
        );
      });
  }

  function updateStaticData() {
    $("eventName").textContent =
      clean(
        countdownData.eventName ||
        siteData.eventName,
        "RIVALS GAUNTLET"
      ).toUpperCase();

    $("website").textContent =
      clean(
        countdownData.website ||
        siteData.websiteUrl ||
        siteData.website,
        "RIVALSGAUNTLET.COM"
      )
        .replace(
          /^https?:\/\//i,
          ""
        )
        .replace(
          /^www\./i,
          ""
        )
        .replace(
          /\/+$/,
          ""
        )
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

    const community =
      donations.reduce(
        (sum, item) => {
          return (
            sum +
            item.amount
          );
        },
        0
      );

    $("prizePool").textContent =
      formatMoney(
        starting + community
      );

    const matches =
      countdownData.matchups || {};

    const upNext =
      countdownData.upNext || {};

    $("nextTeamA").textContent =
      clean(
        upNext.teamA ||
        matches.match1A ||
        siteData.team1,
        "TEAM 1"
      );

    $("nextTeamB").textContent =
      clean(
        upNext.teamB ||
        matches.match1B ||
        siteData.team2,
        "TEAM 2"
      );

    $("nextLabelA").textContent =
      clean(
        upNext.label ||
        matches.match1Label,
        "UP NEXT"
      );

    $("nextLabelB").textContent =
      clean(
        upNext.label ||
        matches.match1Label,
        "UP NEXT"
      );

    renderSchedule();
  }

  function renderSchedule() {
  const configured =
    settings.scheduleItems;

  const upNext =
    countdownData.upNext || {};

  const matchups =
    countdownData.matchups || {};

  /*
   * The complete tournament order.
   * The schedule begins at the match currently set as Up Next.
   */
  const tournamentOrder = [
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
    "GF1"
  ];

  function normalizeMatchId(value) {
    let raw =
      clean(value)
        .toUpperCase()
        .trim();

    raw = raw
      .replace(
        /GRAND\s*FINALS?/g,
        "GF1"
      )
      .replace(
        /GRAND\s*FINAL/g,
        "GF1"
      )
      .replace(
        /\s*•\s*BO\d+/g,
        ""
      )
      .replace(
        /\s*-\s*BO\d+/g,
        ""
      )
      .replace(
        /\s+/g,
        ""
      );

    if (
      /^R16[-_]?\d$/.test(raw)
    ) {
      return raw
        .replace("_", "-")
        .replace(
          /^R16(\d)$/,
          "R16-$1"
        );
    }

    if (/^QF\d$/.test(raw)) {
      return raw;
    }

    if (/^SF\d$/.test(raw)) {
      return raw;
    }

    if (/^GF\d?$/.test(raw)) {
      return "GF1";
    }

    return raw;
  }

  function displayMatchLabel(matchId) {
    if (matchId === "GF1") {
      return "Grand Finals";
    }

    return matchId;
  }

  function firstValue(...values) {
    for (const value of values) {
      const result =
        clean(value);

      if (result) {
        return result;
      }
    }

    return "";
  }

  function getMatchTeams(matchId) {
    /*
     * Round of 16
     */
    if (
      matchId.startsWith("R16-")
    ) {
      const matchNumber =
        Number(
          matchId.split("-")[1]
        );

      const firstTeamNumber =
        (matchNumber - 1) * 2 + 1;

      const secondTeamNumber =
        firstTeamNumber + 1;

      return [
        firstValue(
          matchups[
            `r16${matchNumber}A`
          ],
          matchups[
            `match${matchNumber}A`
          ],
          siteData[
            `team${firstTeamNumber}`
          ]
        ) ||
          `TEAM ${firstTeamNumber}`,

        firstValue(
          matchups[
            `r16${matchNumber}B`
          ],
          matchups[
            `match${matchNumber}B`
          ],
          siteData[
            `team${secondTeamNumber}`
          ]
        ) ||
          `TEAM ${secondTeamNumber}`
      ];
    }

    /*
     * Quarterfinals
     */
    if (
      matchId.startsWith("QF")
    ) {
      const matchNumber =
        Number(
          matchId.replace(
            "QF",
            ""
          )
        );

      const firstTeamNumber =
        (matchNumber - 1) * 2 + 1;

      const secondTeamNumber =
        firstTeamNumber + 1;

      return [
        firstValue(
          matchups[
            `qf${matchNumber}A`
          ],
          matchups[
            `match${matchNumber}A`
          ],
          siteData[
            `team${firstTeamNumber}`
          ]
        ) ||
          `TEAM ${firstTeamNumber}`,

        firstValue(
          matchups[
            `qf${matchNumber}B`
          ],
          matchups[
            `match${matchNumber}B`
          ],
          siteData[
            `team${secondTeamNumber}`
          ]
        ) ||
          `TEAM ${secondTeamNumber}`
      ];
    }

    /*
     * Semifinal 1
     */
    if (matchId === "SF1") {
      return [
        firstValue(
          siteData.qf1Winner,
          matchups.sf1A
        ) ||
          "WINNER QF1",

        firstValue(
          siteData.qf2Winner,
          matchups.sf1B
        ) ||
          "WINNER QF2"
      ];
    }

    /*
     * Semifinal 2
     */
    if (matchId === "SF2") {
      return [
        firstValue(
          siteData.qf3Winner,
          matchups.sf2A
        ) ||
          "WINNER QF3",

        firstValue(
          siteData.qf4Winner,
          matchups.sf2B
        ) ||
          "WINNER QF4"
      ];
    }

    /*
     * Grand Finals
     */
    if (matchId === "GF1") {
      return [
        firstValue(
          siteData.sf1Winner,
          matchups.gf1A,
          matchups.finalA
        ) ||
          "WINNER SF1",

        firstValue(
          siteData.sf2Winner,
          matchups.gf1B,
          matchups.finalB
        ) ||
          "WINNER SF2"
      ];
    }

    return [
      "TO BE ANNOUNCED",
      "TO BE ANNOUNCED"
    ];
  }

  /*
   * Your current admin already provides upNext.label.
   * Examples:
   *
   * QF3
   * QF3 • Bo3
   * SF1
   * Grand Finals
   */
  const currentMatchId =
    normalizeMatchId(
      upNext.label ||
      countdownData.nextMatch ||
      matchups.match1Label ||
      "QF1"
    );

  let items = [];

  /*
   * Only use manually configured schedule entries when this
   * switch is deliberately enabled. This prevents old fixed
   * QF1–QF4 entries from overriding the live schedule.
   */
  if (
    settings.useCustomSchedule === true &&
    configured &&
    typeof configured === "object"
  ) {
    items =
      Object
        .values(configured)
        .filter(Boolean)
        .sort(
          (first, second) => {
            return (
              numberValue(
                first.order
              ) -
              numberValue(
                second.order
              )
            );
          }
        );
  } else {
    let startIndex =
      tournamentOrder.indexOf(
        currentMatchId
      );

    /*
     * If the admin label is temporarily missing or unknown,
     * fall back to QF1 instead of breaking the rail.
     */
    if (startIndex < 0) {
      startIndex =
        tournamentOrder.indexOf(
          "QF1"
        );
    }

    items =
      tournamentOrder
        .slice(
          startIndex,
          startIndex + 6
        )
        .map(
          (matchId, index) => {
            const teams =
              getMatchTeams(
                matchId
              );

            return {
              label:
                displayMatchLabel(
                  matchId
                ),

              title:
                `${teams[0]} VS ${teams[1]}`,

              subtitle:
                index === 0
                  ? "Up Next"
                  : "Coming Up",

              active:
                index === 0
            };
          }
        );
  }

  $("scheduleList").innerHTML =
    items
      .slice(0, 6)
      .map(item => `
        <article class="schedule-item ${
          item.active
            ? "active"
            : ""
        }">
          <small>
            ${escapeHtml(
              clean(
                item.label,
                "Event"
              )
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
              clean(
                item.subtitle,
                ""
              )
            )}
          </span>
        </article>
      `)
      .join("");
}

  function playlistItems(raw) {
    return Object
      .entries(raw || {})
      .map(([id, item]) => ({
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
          numberValue(
            item?.startAt
          )
        ),

        endAt: Math.max(
          0,
          numberValue(
            item?.endAt
          )
        ),

        durationMs: Math.max(
          3000,
          numberValue(
            item?.durationMs,
            DEFAULT_ITEM_MS
          )
        ),

        order:
          numberValue(
            item?.order
          ),

        enabled:
          item?.enabled !== false,

        updatedAt:
          numberValue(
            item?.updatedAt
          )
      }))
      .filter(item => {
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

      durationMs:
        DEFAULT_ITEM_MS
    };
  }

  function activeItemById(id) {
    return playlist.find(item => {
      return item.id === id;
    });
  }

  function stopCurrent() {
    playbackToken += 1;
sceneGeneration += 1;
    if (currentTimer) {
      clearTimeout(
        currentTimer
      );
    }

    currentTimer = null;

    if (transitionTimer) {
      clearTimeout(
        transitionTimer
      );
    }

    transitionTimer = null;

    if (currentVideo) {
      try {
        currentVideo.pause();

        currentVideo.removeAttribute(
          "src"
        );

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

    if (
      playlist.length === 1 &&
      playlist[0].id ===
        currentItemId
    ) {
      const item =
        playlist[0];

      if (
        item.type === "clip" &&
        currentVideo
      ) {
        try {
          currentVideo.currentTime =
            Math.max(
              0,
              item.startAt || 0
            );

          currentVideo
            .play()
            .catch(() => {});

          return;
        } catch (error) {
          console.warn(
            "Single clip could not restart in place:",
            error
          );
        }
      }
    }

    currentIndex =
      (currentIndex + 1) %
      playlist.length;

    showItem(
      playlist[currentIndex],
      false
    );
  }

  function waitForSceneMedia(layer) {
  return new Promise((resolve) => {
    const video =
      layer.querySelector(
        "video.media-main"
      );

    const image =
      layer.querySelector(
        "img.media-main"
      );

    /*
     * Firebase cards, news and matchup scenes
     * can display immediately.
     */
    if (!video && !image) {
      resolve();
      return;
    }

    let completed = false;

    function finish() {
      if (completed) {
        return;
      }

      completed = true;
      resolve();
    }

    /*
     * Keep the current scene visible if the media
     * takes time to load. Never show a blank screen.
     */
    const safetyTimer =
      window.setTimeout(
        finish,
        5000
      );

    function ready() {
      window.clearTimeout(
        safetyTimer
      );

      finish();
    }

    if (video) {
      /*
       * "playing" means playback has genuinely started.
       * It is more reliable here than "canplay."
       */
      video.addEventListener(
        "playing",
        ready,
        {
          once: true
        }
      );

      video.addEventListener(
        "error",
        ready,
        {
          once: true
        }
      );

      /*
       * A video can already be advancing before the
       * listener is checked.
       */
      if (
        !video.paused &&
        video.currentTime > 0
      ) {
        ready();
      }

      return;
    }

    if (image.complete) {
      ready();
      return;
    }

    image.addEventListener(
      "load",
      ready,
      {
        once: true
      }
    );

    image.addEventListener(
      "error",
      ready,
      {
        once: true
      }
    );
  });
}

async function mount(html, callback) {
  const contentMount =
    document.getElementById(
      "contentMount"
    );

  if (!contentMount) {
    return;
  }

  sceneGeneration += 1;

  const generation =
    sceneGeneration;

  if (transitionTimer) {
    window.clearTimeout(
      transitionTimer
    );

    transitionTimer = null;
  }

  /*
   * Keep only the single active scene.
   */
  const existingLayers =
    Array.from(
      contentMount.querySelectorAll(
        ":scope > .scene-layer"
      )
    );

  const previousLayer =
    existingLayers.find(layer => {
      return layer.classList.contains(
        "is-visible"
      );
    }) || null;

  existingLayers.forEach(layer => {
    if (layer !== previousLayer) {
      layer.remove();
    }
  });

  const nextLayer =
    document.createElement("div");

  nextLayer.className =
    "scene-layer is-incoming";

  nextLayer.dataset.generation =
    String(generation);

  nextLayer.innerHTML =
    html;

  contentMount.appendChild(
    nextLayer
  );

  /*
   * Attach playback events and start the incoming
   * video while it remains hidden.
   */
  if (
    typeof callback === "function"
  ) {
    callback(nextLayer);
  }

  await waitForSceneMedia(
    nextLayer
  );

  if (
    generation !== sceneGeneration ||
    !nextLayer.isConnected
  ) {
    nextLayer.remove();
    return;
  }

  /*
   * Perform the handoff in one rendered frame.
   * The previous scene is removed before the new
   * scene becomes visible, preventing overlap.
   */
  requestAnimationFrame(() => {
    if (
      generation !== sceneGeneration ||
      !nextLayer.isConnected
    ) {
      nextLayer.remove();
      return;
    }

    if (
      previousLayer &&
      previousLayer.isConnected
    ) {
      previousLayer.remove();
    }

    contentMount
      .querySelectorAll(
        ":scope > .scene-layer"
      )
      .forEach(layer => {
        if (layer !== nextLayer) {
          layer.remove();
        }
      });

    nextLayer.classList.remove(
      "is-incoming"
    );

    nextLayer.classList.add(
      "is-visible",
      "is-ready"
    );

    transitionTimer =
      window.setTimeout(() => {
        nextLayer.classList.remove(
          "is-ready"
        );

        transitionTimer = null;
      }, 110);
  });
}

  function mediaMarkup(
    item,
    kind
  ) {
    const url =
      safeUrl(
        item.mediaUrl
      );

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

    /*
     * Contain mode uses a lightweight CSS background.
     * It no longer creates a second video element.
     */
    const blur =
      item.fit === "contain"
        ? `
          <div
            class="media-blur"
            style="
              background:
                radial-gradient(
                  circle at 30% 30%,
                  rgba(86,169,255,.34),
                  transparent 34%
                ),
                radial-gradient(
                  circle at 72% 25%,
                  rgba(255,114,197,.30),
                  transparent 36%
                ),
                linear-gradient(
                  145deg,
                  #151842,
                  #08091f
                );
            "
          ></div>
        `
        : "";

    const media =
      kind === "video"
        ? `
          <video
            id="activeVideo"
            class="media-main"
            src="${escapeHtml(url)}"
            ${
              item.muted
                ? "muted"
                : ""
            }
            ${
              item.loop
                ? "loop"
                : ""
            }
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
      <div
        class="media-layer fit-${escapeHtml(
          item.fit
        )}"
      >
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
            ${escapeHtml(
              item.title
            )}
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
            ${escapeHtml(
              item.title
            )}
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
        `${teamA} VS ${teamB}`,

      message: clean(
        item.description,
        "The next Rivals Gauntlet matchup is coming up after the countdown."
      )
    });
  }

  function donationTotals() {
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

    const community =
      donations.reduce(
        (sum, item) => {
          return (
            sum +
            moneyValue(
              item.amount
            )
          );
        },
        0
      );

    const current =
      starting + community;

    const goal = Math.max(
      1,
      moneyValue(
        siteData.donationGoal,
        250
      )
    );

    const percent = Math.max(
      0,
      Math.min(
        100,
        Math.round(
          (current / goal) *
          100
        )
      )
    );

    return {
      starting,
      community,
      current,
      goal,
      percent
    };
  }

  function groupedSupporters() {
    const grouped =
      new Map();

    donations.forEach(
      donation => {
        const name = clean(
          donation.name,
          "Anonymous"
        );

        const key =
          name.toLowerCase();

        if (!grouped.has(key)) {
          grouped.set(key, {
            name,
            total: 0,
            count: 0,
            latest: 0
          });
        }

        const entry =
          grouped.get(key);

        entry.total +=
          moneyValue(
            donation.amount
          );

        entry.count += 1;

        entry.latest =
          Math.max(
            entry.latest,
            numberValue(
              donation.createdAt
            )
          );
      }
    );

    return Array
      .from(grouped.values())
      .sort((first, second) => {
        return (
          second.total -
          first.total ||
          second.latest -
          first.latest
        );
      });
  }

  function relativeTime(timestamp) {
    const value =
      numberValue(timestamp);

    if (!value) {
      return "Recently";
    }

    const difference =
      Math.max(
        0,
        Date.now() - value
      );

    if (difference < 60000) {
      return "Just now";
    }

    if (difference < 3600000) {
      return (
        `${Math.max(
          1,
          Math.round(
            difference / 60000
          )
        )}m ago`
      );
    }

    if (difference < 86400000) {
      return (
        `${Math.max(
          1,
          Math.round(
            difference / 3600000
          )
        )}h ago`
      );
    }

    return (
      `${Math.max(
        1,
        Math.round(
          difference / 86400000
        )
      )}d ago`
    );
  }

  function prizePoolMarkup(item) {
    const totals =
      donationTotals();

    return `
      <section class="auto-card">
        <header class="auto-card-head">
          <div>
            <span class="auto-card-kicker">
              ${escapeHtml(
                item.subtitle ||
                "Community Funded"
              )}
            </span>

            <h2 class="auto-card-title">
              ${escapeHtml(
                item.title ||
                "Live Prize Pool"
              )}
            </h2>
          </div>

          <div class="auto-card-live">
            Live Firebase Data
          </div>
        </header>

        <div class="prize-feature">
          <div>
            <div class="prize-amount">
              ${escapeHtml(
                formatMoney(
                  totals.current
                )
              )}
            </div>

            <p class="prize-caption">
              ${escapeHtml(
                item.message ||
                "The displayed amount updates automatically as confirmed prize-pool contributions are received."
              )}
            </p>
          </div>

          <div class="prize-breakdown">
            <div class="prize-line">
              <span>
                Starting Pool
              </span>

              <strong>
                ${escapeHtml(
                  formatMoney(
                    totals.starting
                  )
                )}
              </strong>
            </div>

            <div class="prize-line">
              <span>
                Community Contributions
              </span>

              <strong>
                ${escapeHtml(
                  formatMoney(
                    totals.community
                  )
                )}
              </strong>
            </div>

            <div class="prize-line">
              <span>
                Current Goal
              </span>

              <strong>
                ${escapeHtml(
                  formatMoney(
                    totals.goal
                  )
                )}
              </strong>
            </div>

            <div class="prize-progress">
              <div class="prize-progress-meta">
                <span>
                  Goal Progress
                </span>

                <strong>
                  ${totals.percent}%
                </strong>
              </div>

              <div class="prize-progress-track">
                <div
                  class="prize-progress-fill"
                  style="width:${totals.percent}%"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </section>
    `;
  }

  function supportersMarkup(item) {
    const top =
      groupedSupporters()
        .slice(0, 5);

    const recent =
      donations.slice(0, 5);

    const topRows =
      top.length
        ? top
            .map(
              (
                supporter,
                index
              ) => `
                <article class="supporter-live-row">
                  <span class="supporter-live-rank">
                    #${index + 1}
                  </span>

                  <div class="supporter-live-copy">
                    <strong>
                      ${escapeHtml(
                        supporter.name
                      )}
                    </strong>

                    <small>
                      ${supporter.count}
                      contribution${
                        supporter.count === 1
                          ? ""
                          : "s"
                      }
                    </small>
                  </div>

                  <strong class="supporter-live-amount">
                    ${escapeHtml(
                      formatMoney(
                        supporter.total
                      )
                    )}
                  </strong>
                </article>
              `
            )
            .join("")
        : `
          <div class="auto-empty">
            The first confirmed supporter will appear here.
          </div>
        `;

    const recentRows =
      recent.length
        ? recent
            .map(
              donation => `
                <article class="supporter-live-row">
                  <span class="supporter-live-rank">
                    +
                  </span>

                  <div class="supporter-live-copy">
                    <strong>
                      ${escapeHtml(
                        clean(
                          donation.name,
                          "Anonymous"
                        )
                      )}
                    </strong>

                    <small>
                      ${escapeHtml(
                        relativeTime(
                          donation.createdAt
                        )
                      )}
                    </small>
                  </div>

                  <strong class="supporter-live-amount">
                    +${escapeHtml(
                      formatMoney(
                        donation.amount
                      )
                    )}
                  </strong>
                </article>
              `
            )
            .join("")
        : `
          <div class="auto-empty">
            Recent confirmed contributions will appear here.
          </div>
        `;

    return `
      <section class="auto-card">
        <header class="auto-card-head">
          <div>
            <span class="auto-card-kicker">
              ${escapeHtml(
                item.subtitle ||
                "Community Support"
              )}
            </span>

            <h2 class="auto-card-title">
              ${escapeHtml(
                item.title ||
                "Supporter Spotlight"
              )}
            </h2>
          </div>

          <div class="auto-card-live">
            Live Firebase Data
          </div>
        </header>

        <div class="supporter-grid">
          <section class="supporter-column">
            <h3>
              Top Supporters
            </h3>

            ${topRows}
          </section>

          <section class="supporter-column">
            <h3>
              Recent Contributions
            </h3>

            ${recentRows}
          </section>
        </div>
      </section>
    `;
  }

  function bracketMarkup(item) {
    const matchups =
      countdownData.matchups || {};

    const matches =
      [1, 2, 3, 4].map(
        (number, index) => {
          const firstTeam =
            index * 2 + 1;

          const secondTeam =
            firstTeam + 1;

          return {
            label: clean(
              matchups[
                `match${number}Label`
              ],
              `QF${number}`
            ),

            teamA: clean(
              matchups[
                `match${number}A`
              ] ||
              siteData[
                `team${firstTeam}`
              ],
              `TEAM ${firstTeam}`
            ),

            teamB: clean(
              matchups[
                `match${number}B`
              ] ||
              siteData[
                `team${secondTeam}`
              ],
              `TEAM ${secondTeam}`
            )
          };
        }
      );

    return `
      <section class="auto-card">
        <header class="auto-card-head">
          <div>
            <span class="auto-card-kicker">
              ${escapeHtml(
                item.subtitle ||
                "Opening Round"
              )}
            </span>

            <h2 class="auto-card-title">
              ${escapeHtml(
                item.title ||
                "Current Bracket"
              )}
            </h2>
          </div>

          <div class="auto-card-live">
            Live Tournament Data
          </div>
        </header>

        <div class="bracket-feature">
          ${matches
            .map(match => `
              <article class="bracket-match">
                <div class="bracket-match-head">
                  <span>
                    ${escapeHtml(
                      match.label
                    )}
                  </span>

                  <span>
                    Best of 3
                  </span>
                </div>

                <div class="bracket-team">
                  <span>
                    ${escapeHtml(
                      match.teamA
                    )}
                  </span>
                </div>

                <div class="bracket-team">
                  <span>
                    ${escapeHtml(
                      match.teamB
                    )}
                  </span>
                </div>
              </article>
            `)
            .join("")}
        </div>
      </section>
    `;
  }

  function showItem(
    item,
    forced
  ) {
    stopCurrent();

    currentItemId =
      item.id || "";

    const token =
      playbackToken;

    let finished = false;

    function finishItem() {
      if (
        finished ||
        token !== playbackToken
      ) {
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
      markup =
        mediaMarkup(
          item,
          "video"
        );
    } else if (
      item.type === "image"
    ) {
      markup =
        mediaMarkup(
          item,
          "img"
        );
    } else if (
      item.type === "matchup"
    ) {
      markup =
        matchupMarkup(item);
    } else if (
      item.type === "prize_pool"
    ) {
      markup =
        prizePoolMarkup(item);
    } else if (
      item.type === "top_supporters"
    ) {
      markup =
        supportersMarkup(item);
    } else if (
      item.type === "bracket"
    ) {
      markup =
        bracketMarkup(item);
    } else {
      markup =
        newsMarkup(item);
    }

    mount(markup, (sceneLayer) => {
      if (
        token !== playbackToken
      ) {
        return;
      }

      if (
        item.type !== "clip"
      ) {
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
  sceneLayer.querySelector(
    "#activeVideo"
  );

      if (!video) {
        currentTimer =
          window.setTimeout(
            finishItem,
            3000
          );

        return;
      }

      currentVideo = video;
/*
 * Keep the incoming video invisible until it
 * has genuinely entered the playing state.
 */
video.playsInline = true;
video.preload = "auto";
      video.muted =
        item.muted;

      video.volume =
        item.muted
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
            token !==
            playbackToken
          ) {
            return;
          }

          if (
            item.startAt > 0 &&
            item.startAt <
            video.duration
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
            token !==
            playbackToken
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
        const checkEndTime =
          () => {
            if (
              token !==
              playbackToken
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
       * The actual video ending controls
       * normal clip advancement.
       *
       * The duration field only acts as a
       * long safety fallback.
       */
      if (item.loop !== true) {
        currentTimer =
          window.setTimeout(
            finishItem,
            Math.max(
              item.durationMs,
              10 * 60 * 1000
            )
          );
      }

      video
        .play()
        .catch(
          async error => {
            console.warn(
              "Initial video playback failed:",
              error
            );

            /*
             * If sound autoplay is blocked,
             * retry muted so the clip still
             * plays rather than freezing.
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
          }
        );
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
    db =
      databaseConnection();

    db.ref(
      ".info/connected"
    ).on(
      "value",
      snapshot => {
        const online =
          snapshot.val() === true;

        $("connection")
          .classList
          .toggle(
            "online",
            online
          );

        $("connection")
          .classList
          .remove(
            "error"
          );

        $("connectionText")
          .textContent =
            online
              ? "REALTIME CONNECTED"
              : "RECONNECTING";
      }
    );

    db.ref(
      "broadcastCountdown"
    ).on(
      "value",
      snapshot => {
        countdownData =
          snapshot.val() || {};

        updateStaticData();
      }
    );

    db.ref(
      "site"
    ).on(
      "value",
      snapshot => {
        siteData =
          snapshot.val() || {};

        updateStaticData();
      }
    );

    db.ref(
      "donations"
    ).on(
      "value",
      snapshot => {
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
      snapshot => {
        settings =
          snapshot.val() || {};

        updateStaticData();

        /*
         * Do not restart an active clip
         * because unrelated settings changed.
         */
        if (
          !playlist.length &&
          !currentItemId
        ) {
          refreshPlaylist(true);
        }
      }
    );

    db.ref(
      `${PATH}/items`
    ).on(
      "value",
      snapshot => {
        const updatedPlaylist =
          playlistItems(
            snapshot.val()
          );

        const preservedId =
          currentItemId;

        playlist =
          updatedPlaylist;

        if (!playlist.length) {
          currentIndex = -1;

          showItem(
            fallbackNews(),
            false
          );

          return;
        }

        /*
         * Preserve the currently playing
         * item when another playlist item
         * is edited, added, or reordered.
         */
        const preservedIndex =
          playlist.findIndex(
            item => {
              return (
                item.id ===
                preservedId
              );
            }
          );

        if (
          preservedIndex >= 0
        ) {
          currentIndex =
            preservedIndex;

          return;
        }

        refreshPlaylist(true);
      }
    );

    db.ref(
      `${PATH}/control`
    ).on(
      "value",
      snapshot => {
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
                entry => {
                  return (
                    entry.id ===
                    item.id
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
    event => {
      $("connection")
        .classList
        .add(
          "error"
        );

      $("connectionText")
        .textContent =
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
