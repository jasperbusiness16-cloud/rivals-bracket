(() => {
  "use strict";

  const DEFAULTS = {
    schemaVersion: 1,

    global: {
      enabled: true,
      basePath: "overlays",
      website: "RIVALSGAUNTLET.COM",
      accent: "purple",
      motionEnabled: true,
      animationSpeed: 1,
      showFrame: true,
      showConnectionStatus: true
    },

    matchDock: {
      enabled: true,
      showTeamLogos: true,
      showScores: true,
      showSeriesFormat: true,
      showCurrentMatch: true,
      compactMode: false,
      replayToken: 0
    },

    countdown: {
      enabled: true,
      showPrizePool: true,
      showSupporters: true,
      showPredictionCenter: true,
      showCreateAccount: true,
      showWebsitePromotion: true,
      rotationSpeed: 1,
      replayToken: 0
    },

    casterDesk: {
  enabled: true,
  casterCount: "2",

  showHandles: true,
  showRoles: true,
  showSubtitles: true,
  showWebsite: true,
  showStatusLabel: true,

  statusLabel: "CASTER DESK",

  caster1Name: "JASPER HARVEY",
  caster1Role: "HOST",
  caster1Handle: "",
  caster1Subtitle: "",

  caster2Name: "CASTER TWO",
  caster2Role: "ANALYST",
  caster2Handle: "",
  caster2Subtitle: "",

  caster3Name: "CASTER THREE",
  caster3Role: "GUEST",
  caster3Handle: "",
  caster3Subtitle: "",

  caster4Name: "CASTER FOUR",
  caster4Role: "ANALYST",
  caster4Handle: "",
  caster4Subtitle: "",

  replayToken: 0
},

    matchIntro: {
      enabled: true,
      showTeamLogos: true,
      showRoster: true,
      showPlayerRoles: true,
      revealSpeed: 1,
      replayToken: 0
    },

    intermission: {
      enabled: true,
      showUpNext: true,
      showSupporters: true,
      showPrizePool: true,
      showCarousel: true,
      showReturnTime: true,
      carouselSpeed: 1,
      replayToken: 0
    },

    champion: {
      enabled: true,
      showRoster: true,
      showPrize: true,
      showFinalScore: true,
      showParticles: true,
      particleIntensity: 1,
      replayToken: 0
    },

    credits: {
      enabled: true,
      showChampion: true,
      showCasters: true,
      showProduction: true,
      showSupporters: true,
      showTeams: true,
      showWebsitePromotion: true,
      rollSpeed: 1,
      replayToken: 0
    },

    bracket: {
      enabled: true,
      showTeamLogos: true,
      showScores: true,
      showConnectors: true,
      showChampionCard: true,
      highlightCurrentMatch: true,
      replayToken: 0
    },

    winnerAdvances: {
      enabled: true,
      showDefeatedTeam: true,
      showFinalScore: true,
      showParticles: true,
      autoUseLatestResult: true,
      forcedMatch: "",
      replayToken: 0
    },

    updatedAt: 0,
    updatedBy: ""
  };

  const MATCH_OPTIONS = [
    ["", "Automatic / Latest Result"],
    ["R16-1", "Round of 16 • Match 1"],
    ["R16-2", "Round of 16 • Match 2"],
    ["R16-3", "Round of 16 • Match 3"],
    ["R16-4", "Round of 16 • Match 4"],
    ["R16-5", "Round of 16 • Match 5"],
    ["R16-6", "Round of 16 • Match 6"],
    ["R16-7", "Round of 16 • Match 7"],
    ["R16-8", "Round of 16 • Match 8"],
    ["QF1", "Quarterfinal 1"],
    ["QF2", "Quarterfinal 2"],
    ["QF3", "Quarterfinal 3"],
    ["QF4", "Quarterfinal 4"],
    ["SF1", "Semifinal 1"],
    ["SF2", "Semifinal 2"],
    ["GF", "Grand Finals"]
  ];

  const OVERLAYS = [
    {
      key: "matchDock",
      title: "Match Dock",
      description: "Persistent live matchup and score dock.",
      icon: "fa-table-columns",
      file: "match-dock.html",

      options: [
        toggle(
          "showTeamLogos",
          "Team Logos",
          "Show published team artwork."
        ),

        toggle(
          "showScores",
          "Scores",
          "Show the current series score."
        ),

        toggle(
          "showSeriesFormat",
          "Series Format",
          "Show BO3 or BO5."
        ),

        toggle(
          "showCurrentMatch",
          "Match Label",
          "Show the current bracket match."
        ),

        toggle(
          "compactMode",
          "Compact Mode",
          "Reduce the dock footprint."
        )
      ]
    },

    {
      key: "countdown",
      title: "Broadcast Countdown",
      description: "Pre-show countdown and promotional rotation.",
      icon: "fa-hourglass-half",
      file: "countdown.html",

      options: [
        toggle(
          "showPrizePool",
          "Prize Pool",
          "Include the live prize pool card."
        ),

        toggle(
          "showSupporters",
          "Supporters",
          "Show top and recent supporters."
        ),

        toggle(
          "showPredictionCenter",
          "Prediction Center",
          "Promote bracket and live predictions."
        ),

        toggle(
          "showCreateAccount",
          "Create Account",
          "Show the RG account promotion."
        ),

        toggle(
          "showWebsitePromotion",
          "Website Promotion",
          "Show RivalsGauntlet.com messaging."
        ),

        range(
          "rotationSpeed",
          "Rotation Speed",
          "Multiplier for feature slide timing.",
          0.5,
          2,
          0.1,
          "×"
        )
      ]
    },

    {
      key: "casterDesk",
      title: "Caster Desk",
      description: "Caster names, roles and broadcast identity.",
      icon: "fa-microphone-lines",
      file: "caster-desk.html",

      options: [
select(
  "casterCount",
  "Number of Casters",
  "Choose how many caster nameplates appear on screen.",
  [
    ["1", "1 Caster"],
    ["2", "2 Casters"],
    ["3", "3 Casters"],
    ["4", "4 Casters"]
  ],
  true
),
              toggle(
          "showHandles",
          "Caster Handles",
          "Show social handles below names."
        ),

        toggle(
  "showRoles",
  "Caster Roles",
  "Show host, analyst and guest roles."
),

toggle(
  "showSubtitles",
  "Caster Subtitles",
  "Show the optional description below each role."
),

toggle(
  "showWebsite",
          "Website",
          "Show the website callout."
        ),

        toggle(
          "showStatusLabel",
          "Desk Status",
          "Show the current desk label."
        )
      ]
    },

    {
      key: "matchIntro",
      title: "Match Intro",
      description: "Team-versus-team roster reveal.",
      icon: "fa-bolt",
      file: "match-intro.html",

      options: [
        toggle(
          "showTeamLogos",
          "Team Logos",
          "Show published team artwork."
        ),

        toggle(
          "showRoster",
          "Player Roster",
          "Reveal the published player list."
        ),

        toggle(
          "showPlayerRoles",
          "Player Roles",
          "Show each player's main role."
        ),

        range(
          "revealSpeed",
          "Reveal Speed",
          "Multiplier for the team reveal sequence.",
          0.5,
          2,
          0.1,
          "×"
        )
      ]
    },

    {
      key: "intermission",
      title: "Intermission",
      description: "Break timer, Up Next and rotating information.",
      icon: "fa-mug-hot",
      file: "tournament-hub.html",

      options: [
        toggle(
          "showUpNext",
          "Up Next",
          "Show the next tournament matchup."
        ),

        toggle(
          "showSupporters",
          "Supporters",
          "Show supporter leaderboards."
        ),

        toggle(
          "showPrizePool",
          "Prize Pool",
          "Show the live prize total."
        ),

        toggle(
          "showCarousel",
          "Feature Carousel",
          "Rotate informational cards."
        ),

        toggle(
          "showReturnTime",
          "Return Time",
          "Show the expected local return time."
        ),

        range(
          "carouselSpeed",
          "Carousel Speed",
          "Multiplier for carousel timing.",
          0.5,
          2,
          0.1,
          "×"
        )
      ]
    },

    {
      key: "champion",
      title: "Tournament Champion",
      description: "Full-screen tournament winner celebration.",
      icon: "fa-crown",
      file: "champion-celebration.html",

      options: [
        toggle(
          "showRoster",
          "Champion Roster",
          "Show all published winning players."
        ),

        toggle(
          "showPrize",
          "Prize Won",
          "Show the calculated prize amount."
        ),

        toggle(
          "showFinalScore",
          "Final Score",
          "Show the Grand Finals result."
        ),

        toggle(
          "showParticles",
          "Celebration Particles",
          "Enable the ambient celebration effect."
        ),

        range(
          "particleIntensity",
          "Particle Intensity",
          "Control celebration particle density.",
          0,
          2,
          0.1,
          "×"
        )
      ]
    },

    {
      key: "credits",
      title: "End Credits",
      description: "Movie-style end-of-stream credit roll.",
      icon: "fa-film",
      file: "credits.html",

      options: [
        toggle(
          "showChampion",
          "Champion Section",
          "Feature the tournament winner."
        ),

        toggle(
          "showCasters",
          "Caster Desk",
          "Include active broadcast casters."
        ),

        toggle(
          "showProduction",
          "Production",
          "Include tournament and production credits."
        ),

        toggle(
          "showSupporters",
          "Supporters",
          "Include top and recent supporters."
        ),

        toggle(
          "showTeams",
          "Participating Teams",
          "Include every published team."
        ),

        toggle(
          "showWebsitePromotion",
          "Website Promotion",
          "Include the final account and website callout."
        ),

        range(
          "rollSpeed",
          "Credit Roll Speed",
          "Multiplier for the full credit roll.",
          0.5,
          2,
          0.1,
          "×"
        )
      ]
    },

    {
      key: "bracket",
      title: "Stream Bracket",
      description: "Full broadcast tournament bracket.",
      icon: "fa-diagram-project",
      file: "tournament-bracket.html",

      options: [
        toggle(
          "showTeamLogos",
          "Team Logos",
          "Show published team artwork."
        ),

        toggle(
          "showScores",
          "Match Scores",
          "Show saved bracket scores."
        ),

        toggle(
          "showConnectors",
          "Bracket Connectors",
          "Draw advancement paths."
        ),

        toggle(
          "showChampionCard",
          "Champion Card",
          "Show the final champion destination."
        ),

        toggle(
          "highlightCurrentMatch",
          "Live Highlight",
          "Pulse the current live match."
        )
      ]
    },

    {
      key: "winnerAdvances",
      title: "Winner Advances",
      description: "Post-match winner and advancement announcement.",
      icon: "fa-arrow-up-right-dots",
      file: "winner-advances.html",

      options: [
        toggle(
          "showDefeatedTeam",
          "Defeated Team",
          "Show the opposing team in the result details."
        ),

        toggle(
          "showFinalScore",
          "Final Score",
          "Show the completed series score."
        ),

        toggle(
          "showParticles",
          "Result Particles",
          "Enable the ambient winner effect."
        ),

        toggle(
          "autoUseLatestResult",
          "Automatic Result",
          "Use the latest completed tournament match."
        ),

        select(
          "forcedMatch",
          "Forced Match",
          "Override the automatic match selection for testing.",
          MATCH_OPTIONS,
          true
        )
      ]
    }
  ];

  const state = {
    database: null,
    content: null,
    currentUser: null,
    roleId: "",
    showToast: null,
    escapeHtml: null,
    isPermissionDenied: null,
    saved: null,
    draft: null,
    dirty: false,
    busy: false,
    bound: false
  };

  function toggle(
    key,
    label,
    description
  ) {
    return {
      type: "toggle",
      key,
      label,
      description
    };
  }

  function range(
    key,
    label,
    description,
    min,
    max,
    step,
    suffix = ""
  ) {
    return {
      type: "range",
      key,
      label,
      description,
      min,
      max,
      step,
      suffix
    };
  }

  function select(
    key,
    label,
    description,
    options,
    wide = false
  ) {
    return {
      type: "select",
      key,
      label,
      description,
      options,
      wide
    };
  }

  function clone(value) {
    return JSON.parse(
      JSON.stringify(value)
    );
  }

  function clean(
    value,
    fallback = ""
  ) {
    const resolved =
      value == null
        ? fallback
        : value;

    return String(
      resolved
    ).trim();
  }

  function numberValue(
    value,
    fallback = 0
  ) {
    const parsed =
      Number(value);

    return Number.isFinite(parsed)
      ? parsed
      : fallback;
  }

  function esc(value) {
    if (
      typeof state.escapeHtml ===
      "function"
    ) {
      return state.escapeHtml(
        value
      );
    }

    return String(
      value == null
        ? ""
        : value
    )
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function mergeDefaults(
    defaultValue,
    incomingValue
  ) {
    if (
      Array.isArray(
        defaultValue
      )
    ) {
      return Array.isArray(
        incomingValue
      )
        ? clone(incomingValue)
        : clone(defaultValue);
    }

    if (
      defaultValue &&
      typeof defaultValue ===
        "object"
    ) {
      const incoming =
        incomingValue &&
        typeof incomingValue ===
          "object" &&
        !Array.isArray(
          incomingValue
        )
          ? incomingValue
          : {};

      const output = {};

      Object.keys(
        defaultValue
      ).forEach(key => {
        output[key] =
          mergeDefaults(
            defaultValue[key],
            incoming[key]
          );
      });

      Object.keys(
        incoming
      ).forEach(key => {
        if (
          !(key in output)
        ) {
          output[key] =
            clone(
              incoming[key]
            );
        }
      });

      return output;
    }

    return incomingValue == null
      ? defaultValue
      : incomingValue;
  }

  function normalizedSettings(
    value
  ) {
    const normalized =
      mergeDefaults(
        DEFAULTS,
        value || {}
      );

    normalized.schemaVersion = 1;

    normalized.global.enabled =
      normalized.global.enabled !==
      false;

    normalized.global.basePath =
      clean(
        normalized.global.basePath,
        "overlays"
      );

    normalized.global.website =
      clean(
        normalized.global.website,
        "RIVALSGAUNTLET.COM"
      );

    normalized.global.accent =
      [
        "purple",
        "gold",
        "white"
      ].includes(
        normalized.global.accent
      )
        ? normalized.global.accent
        : "purple";

    normalized.global.animationSpeed =
      clamp(
        normalized.global
          .animationSpeed,
        0.5,
        2,
        1
      );

    OVERLAYS.forEach(
      overlay => {
        normalized[overlay.key] =
          mergeDefaults(
            DEFAULTS[
              overlay.key
            ],
            normalized[
              overlay.key
            ]
          );

        normalized[
          overlay.key
        ].enabled =
          normalized[
            overlay.key
          ].enabled !== false;

        normalized[
          overlay.key
        ].replayToken =
          numberValue(
            normalized[
              overlay.key
            ].replayToken,
            0
          );

        overlay.options.forEach(
          option => {
            if (
              option.type ===
              "range"
            ) {
              normalized[
                overlay.key
              ][option.key] =
                clamp(
                  normalized[
                    overlay.key
                  ][option.key],
                  option.min,
                  option.max,
                  1
                );
            }
          }
        );
      }
    );

    return normalized;
  }

  function clamp(
    value,
    min,
    max,
    fallback
  ) {
    const parsed =
      numberValue(
        value,
        fallback
      );

    return Math.min(
      max,
      Math.max(
        min,
        parsed
      )
    );
  }

  function render(
    context = {}
  ) {
    cleanup();

    Object.assign(
      state,
      {
        database:
          context.database ||
          null,

        content:
          context.content ||
          null,

        currentUser:
          context.currentUser ||
          null,

        roleId:
          clean(
            context.roleId
          ),

        showToast:
          context.showToast ||
          null,

        escapeHtml:
          context.escapeHtml ||
          null,

        isPermissionDenied:
          context.isPermissionDenied ||
          null,

        saved: null,
        draft: null,
        dirty: false,
        busy: false,
        bound: false
      }
    );

    if (!state.content) {
      return;
    }

    if (!state.database) {
      state.content.innerHTML =
        errorMarkup(
          new Error(
            "Nexus did not provide a Firebase database connection."
          )
        );

      return;
    }

    if (
      ![
        "owner",
        "admin"
      ].includes(
        state.roleId
      )
    ) {
      state.content.innerHTML =
        deniedMarkup();

      return;
    }

    bind();

    state.content.innerHTML =
      loadingMarkup();

    void load();
  }

  function cleanup() {
    if (
      state.content &&
      state.bound
    ) {
      state.content.removeEventListener(
        "click",
        handleClick
      );

      state.content.removeEventListener(
        "input",
        handleInput
      );

      state.content.removeEventListener(
        "change",
        handleChange
      );
    }

    Object.assign(
      state,
      {
        database: null,
        content: null,
        currentUser: null,
        roleId: "",
        showToast: null,
        escapeHtml: null,
        isPermissionDenied: null,
        saved: null,
        draft: null,
        dirty: false,
        busy: false,
        bound: false
      }
    );
  }

  function bind() {
    state.content.addEventListener(
      "click",
      handleClick
    );

    state.content.addEventListener(
      "input",
      handleInput
    );

    state.content.addEventListener(
      "change",
      handleChange
    );

    state.bound = true;
  }

  async function load(
    force = false
  ) {
    if (
      !state.database ||
      state.busy
    ) {
      return;
    }

    if (
      force &&
      state.dirty &&
      !window.confirm(
        "Discard unsaved Overlay Settings changes and reload Firebase?"
      )
    ) {
      return;
    }

    state.busy = true;

    try {
      const snapshot =
        await state.database
          .ref(
            "broadcastOverlays"
          )
          .once(
            "value"
          );

      state.saved =
        normalizedSettings(
          snapshot.val() ||
          DEFAULTS
        );

      state.draft =
        clone(
          state.saved
        );

      state.dirty = false;

      paint();
    } catch (error) {
      console.error(
        "Overlay Settings load failed:",
        error
      );

      state.content.innerHTML =
        errorMarkup(error);
    } finally {
      state.busy = false;
    }
  }

    function paint() {
    if (
      !state.content ||
      !state.draft
    ) {
      return;
    }

    const enabled =
      enabledOverlayCount();

    const total =
      OVERLAYS.length;

    const global =
      state.draft.global;

    state.content.innerHTML = `
      <section class="module-intro nexus-overlays-intro">
        <div>
          <h2>Overlay Settings</h2>

          <p>
            Control OBS overlay visibility, display options,
            animation timing, preview links and replay triggers.
          </p>
        </div>

        <div class="module-actions">
          <button
            class="action-button"
            type="button"
            data-overlay-action="refresh"
          >
            <i class="fa-solid fa-rotate"></i>
            Reload Firebase
          </button>

          <button
            class="action-button action-button-primary"
            type="button"
            data-overlay-action="save"
          >
            <i class="fa-solid fa-floppy-disk"></i>
            Save All Settings
          </button>
        </div>
      </section>

      <section class="nexus-overlays-summary">
        ${metric(
          "Overlay System",

          global.enabled
            ? "Enabled"
            : "Disabled",

          global.enabled
            ? "OBS configuration is active"
            : "Every connected overlay is disabled",

          global.enabled
            ? "fa-tower-broadcast"
            : "fa-power-off"
        )}

        ${metric(
          "Enabled Overlays",
          `${enabled}/${total}`,
          "Individual overlay visibility",
          "fa-layer-group"
        )}

        ${metric(
          "Motion",

          global.motionEnabled
            ? `${formatMultiplier(
                global.animationSpeed
              )} Speed`
            : "Disabled",

          "Global animation preference",
          "fa-wand-magic-sparkles"
        )}

        ${metric(
          "Last Saved",

          updatedLabel(
            state.saved?.updatedAt
          ),

          state.saved?.updatedBy
            ? "Saved by an authorized Nexus user"
            : "No saved author record",

          "fa-clock-rotate-left"
        )}
      </section>

      <article class="nexus-overlays-note">
        <i class="fa-solid fa-circle-info"></i>

        <div>
          <strong>
            Overlay configuration registry
          </strong>

          <p>
            Nexus saves these controls to
            <code>broadcastOverlays</code>.
            Replay buttons update immediately.
            Each OBS file must read its matching
            settings record before the display
            toggles affect that overlay.
          </p>
        </div>
      </article>

      ${globalPanelMarkup()}

      <section class="nexus-overlays-grid">
        ${OVERLAYS
          .map(
            overlayCardMarkup
          )
          .join("")}
      </section>

      <article class="nexus-panel nexus-overlays-savebar">
        <span
          class="nexus-overlays-save-state ${
            state.dirty
              ? "dirty"
              : ""
          }"
        >
          ${
            state.dirty
              ? "Unsaved overlay changes"
              : "All overlay settings are saved"
          }
        </span>

        <div class="module-actions">
          <button
            class="action-button"
            type="button"
            data-overlay-action="restore"
          >
            <i class="fa-solid fa-arrow-rotate-left"></i>
            Restore Safe Defaults
          </button>

          <button
            class="action-button action-button-primary"
            type="button"
            data-overlay-action="save"
          >
            <i class="fa-solid fa-floppy-disk"></i>
            Save All Settings
          </button>
        </div>
      </article>
    `;
  }

  function globalPanelMarkup() {
    const global =
      state.draft.global;

    return `
      <article class="nexus-panel nexus-overlays-global">
        <header class="panel-header">
          <div>
            <h3>
              Global Overlay Defaults
            </h3>

            <span>
              Firebase · broadcastOverlays/global
            </span>
          </div>

          <span
            class="nexus-overlays-save-state ${
              state.dirty
                ? "dirty"
                : ""
            }"
          >
            ${
              state.dirty
                ? "Unsaved"
                : "Saved"
            }
          </span>
        </header>

        <div class="nexus-overlays-panel-body">
          <div class="nexus-overlays-global-grid">
            ${globalToggleMarkup(
              "enabled",

              "Enable Overlay System",

              "Connected overlays may hide their visual content when disabled."
            )}

            ${globalToggleMarkup(
              "motionEnabled",

              "Enable Motion",

              "Allow entrance, ambient and replay animations."
            )}

            ${globalToggleMarkup(
              "showFrame",

              "Show Broadcast Frame",

              "Show the subtle outer frame on supported overlays."
            )}

            ${globalToggleMarkup(
              "showConnectionStatus",

              "Connection Status",

              "Show the realtime Firebase connection indicator."
            )}

            <label
              class="nexus-overlays-field nexus-overlays-field-wide"
            >
              <span>
                Overlay Folder
              </span>

              <input
                type="text"
                maxlength="120"
                value="${esc(
                  global.basePath
                )}"
                placeholder="overlays"
                data-overlay-global-field="basePath"
              >

              <small>
                Folder path relative to the website root.
                Example:
                <code>overlays</code>
                or
                <code>broadcast/overlays</code>.
              </small>
            </label>

            <label class="nexus-overlays-field">
              <span>
                Website Label
              </span>

              <input
                type="text"
                maxlength="80"
                value="${esc(
                  global.website
                )}"
                placeholder="RIVALSGAUNTLET.COM"
                data-overlay-global-field="website"
              >
            </label>

            <label class="nexus-overlays-field">
              <span>
                Accent Preset
              </span>

              <select
                data-overlay-global-field="accent"
              >
                ${selectOptionMarkup(
                  "purple",
                  "Purple",
                  global.accent
                )}

                ${selectOptionMarkup(
                  "gold",
                  "Gold",
                  global.accent
                )}

                ${selectOptionMarkup(
                  "white",
                  "Neutral White",
                  global.accent
                )}
              </select>
            </label>

            <label class="nexus-overlays-field">
              <span>
                Global Animation Speed
              </span>

              <div class="nexus-overlays-range-wrap">
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value="${esc(
                    global.animationSpeed
                  )}"
                  data-overlay-global-field="animationSpeed"
                >

                <output
                  class="nexus-overlays-range-value"
                  data-range-output="global.animationSpeed"
                >
                  ${esc(
                    formatMultiplier(
                      global.animationSpeed
                    )
                  )}
                </output>
              </div>

              <small>
                1.0× keeps the original overlay timing.
              </small>
            </label>
          </div>

          <div class="nexus-overlays-global-actions">
            <span
              class="nexus-overlays-save-state ${
                state.dirty
                  ? "dirty"
                  : ""
              }"
            >
              ${
                state.dirty
                  ? "Changes have not been written to Firebase"
                  : `Saved ${updatedLabel(
                      state.saved?.updatedAt
                    )}`
              }
            </span>

            <button
              class="action-button action-button-primary"
              type="button"
              data-overlay-action="save"
            >
              <i class="fa-solid fa-floppy-disk"></i>
              Save Global and Overlay Settings
            </button>
          </div>
        </div>
      </article>
    `;
  }

  function overlayCardMarkup(
    overlay
  ) {
    const settings =
      state.draft[
        overlay.key
      ];

    const url =
      getOverlayUrl(
        overlay
      );

    return `
      <article
        class="nexus-overlay-card ${
          settings.enabled
            ? ""
            : "is-disabled"
        }"
        data-overlay-card="${esc(
          overlay.key
        )}"
      >
        <header class="nexus-overlay-card-header">
          <span class="nexus-overlay-card-icon">
            <i
              class="fa-solid ${esc(
                overlay.icon
              )}"
            ></i>
          </span>

          <div class="nexus-overlay-card-copy">
            <strong>
              ${esc(
                overlay.title
              )}
            </strong>

            <span>
              ${esc(
                overlay.description
              )}
              ·
              ${esc(
                overlay.file
              )}
            </span>
          </div>

          <label class="nexus-overlay-enabled">
            <input
              type="checkbox"
              data-overlay-key="${esc(
                overlay.key
              )}"
              data-overlay-field="enabled"
              ${
                settings.enabled
                  ? "checked"
                  : ""
              }
            >

            Enabled
          </label>
        </header>

       <div class="nexus-overlay-options">
  ${overlay.options
    .map(
      option =>
        overlayOptionMarkup(
          overlay,
          option
        )
    )
    .join("")}
</div>

${
  overlay.key === "casterDesk"
    ? casterNameplateEditorMarkup()
    : ""
}

<div class="nexus-overlay-actions">
          <button
            class="action-button"
            type="button"
            data-overlay-action="preview"
            data-overlay-key="${esc(
              overlay.key
            )}"
          >
            <i class="fa-solid fa-up-right-from-square"></i>
            Open Preview
          </button>

          <button
            class="action-button"
            type="button"
            data-overlay-action="copy-url"
            data-overlay-key="${esc(
              overlay.key
            )}"
          >
            <i class="fa-solid fa-copy"></i>
            Copy OBS URL
          </button>

          <button
            class="action-button action-button-primary"
            type="button"
            data-overlay-action="replay"
            data-overlay-key="${esc(
              overlay.key
            )}"
          >
            <i class="fa-solid fa-rotate-right"></i>
            Replay Animation
          </button>

          <span
            class="nexus-overlay-url"
            title="${esc(url)}"
          >
            ${esc(url)}
          </span>
        </div>
      </article>
    `;
  }

  function overlayOptionMarkup(
    overlay,
    option
  ) {
    const value =
      state.draft[
        overlay.key
      ][option.key];

    const wideClass =
      option.wide
        ? " nexus-overlay-option-wide"
        : "";

    if (
      option.type ===
      "toggle"
    ) {
      return `
        <div
          class="nexus-overlay-option${wideClass}"
        >
          <label class="nexus-overlays-switch-row">
            <span class="nexus-overlays-switch-copy">
              <strong>
                ${esc(
                  option.label
                )}
              </strong>

              <small>
                ${esc(
                  option.description
                )}
              </small>
            </span>

            <span class="nexus-overlays-switch-control">
              <input
                type="checkbox"
                data-overlay-key="${esc(
                  overlay.key
                )}"
                data-overlay-field="${esc(
                  option.key
                )}"
                ${
                  value
                    ? "checked"
                    : ""
                }
              >

              <span
                class="nexus-overlays-switch-track"
                aria-hidden="true"
              ></span>
            </span>
          </label>
        </div>
      `;
    }

    if (
      option.type ===
      "range"
    ) {
      return `
        <div
          class="nexus-overlay-option${wideClass}"
        >
          <label class="nexus-overlays-field">
            <span>
              ${esc(
                option.label
              )}
            </span>

            <div class="nexus-overlays-range-wrap">
              <input
                type="range"
                min="${esc(
                  option.min
                )}"
                max="${esc(
                  option.max
                )}"
                step="${esc(
                  option.step
                )}"
                value="${esc(value)}"
                data-overlay-key="${esc(
                  overlay.key
                )}"
                data-overlay-field="${esc(
                  option.key
                )}"
              >

              <output
                class="nexus-overlays-range-value"
                data-range-output="${esc(
                  `${overlay.key}.${option.key}`
                )}"
              >
                ${esc(
                  formatRange(
                    value,
                    option.suffix
                  )
                )}
              </output>
            </div>

            <small>
              ${esc(
                option.description
              )}
            </small>
          </label>
        </div>
      `;
    }

    if (
      option.type ===
      "select"
    ) {
      return `
        <div
          class="nexus-overlay-option${wideClass}"
        >
          <label class="nexus-overlays-field">
            <span>
              ${esc(
                option.label
              )}
            </span>

            <select
              data-overlay-key="${esc(
                overlay.key
              )}"
              data-overlay-field="${esc(
                option.key
              )}"
            >
              ${option.options
                .map(
                  ([
                    optionValue,
                    label
                  ]) =>
                    selectOptionMarkup(
                      optionValue,
                      label,
                      value
                    )
                )
                .join("")}
            </select>

            <small>
              ${esc(
                option.description
              )}
            </small>
          </label>
        </div>
      `;
    }

    return "";
  }
function casterNameplateEditorMarkup() {
  const settings =
    state.draft.casterDesk;

  const casterCount =
    Math.min(
      4,
      Math.max(
        1,
        Number(
          settings.casterCount
        ) || 2
      )
    );

  const nameplates =
    [1, 2, 3, 4]
      .map(index => {
        const active =
          index <= casterCount;

        return `
          <article
            class="nexus-caster-nameplate-editor ${
              active
                ? "is-active"
                : "is-inactive"
            }"
          >
            <header class="nexus-caster-editor-header">
              <span>
                C${String(index).padStart(2, "0")}
              </span>

              <div>
                <strong>
                  Caster ${index} Nameplate
                </strong>

                <small>
                  ${
                    active
                      ? "Currently visible"
                      : "Hidden by caster count"
                  }
                </small>
              </div>
            </header>

            <div class="nexus-caster-editor-fields">
              <label class="nexus-overlays-field nexus-caster-field-wide">
                <span>
                  Full Display Name
                </span>

                <input
                  type="text"
                  maxlength="70"
                  value="${esc(
                    settings[
                      `caster${index}Name`
                    ]
                  )}"
                  placeholder="Caster full name"
                  data-overlay-key="casterDesk"
                  data-overlay-field="caster${index}Name"
                >
              </label>

              <label class="nexus-overlays-field">
                <span>
                  Broadcast Role
                </span>

                <input
                  type="text"
                  maxlength="40"
                  value="${esc(
                    settings[
                      `caster${index}Role`
                    ]
                  )}"
                  placeholder="Host, Analyst, Guest..."
                  data-overlay-key="casterDesk"
                  data-overlay-field="caster${index}Role"
                >
              </label>

              <label class="nexus-overlays-field">
                <span>
                  Handle
                </span>

                <input
                  type="text"
                  maxlength="60"
                  value="${esc(
                    settings[
                      `caster${index}Handle`
                    ]
                  )}"
                  placeholder="@caster"
                  data-overlay-key="casterDesk"
                  data-overlay-field="caster${index}Handle"
                >
              </label>

              <label class="nexus-overlays-field nexus-caster-field-wide">
                <span>
                  Optional Subtitle
                </span>

                <input
                  type="text"
                  maxlength="90"
                  value="${esc(
                    settings[
                      `caster${index}Subtitle`
                    ]
                  )}"
                  placeholder="Marvel Rivals specialist, play-by-play..."
                  data-overlay-key="casterDesk"
                  data-overlay-field="caster${index}Subtitle"
                >
              </label>
            </div>
          </article>
        `;
      })
      .join("");

  return `
    <section class="nexus-caster-editor">
      <header class="nexus-caster-editor-title">
        <div>
          <strong>
            Full Caster Nameplates
          </strong>

          <span>
            Edit the text displayed by caster-desk.html.
          </span>
        </div>

        <label class="nexus-overlays-field">
          <span>
            Desk Status Label
          </span>

          <input
            type="text"
            maxlength="50"
            value="${esc(
              settings.statusLabel
            )}"
            placeholder="CASTER DESK"
            data-overlay-key="casterDesk"
            data-overlay-field="statusLabel"
          >
        </label>
      </header>

      <div class="nexus-caster-editor-grid">
        ${nameplates}
      </div>
    </section>
  `;
}
    function globalToggleMarkup(
    key,
    label,
    description
  ) {
    return `
      <label class="nexus-overlays-switch-row">
        <span class="nexus-overlays-switch-copy">
          <strong>
            ${esc(label)}
          </strong>

          <small>
            ${esc(description)}
          </small>
        </span>

        <span class="nexus-overlays-switch-control">
          <input
            type="checkbox"
            data-overlay-global-field="${esc(key)}"
            ${
              state.draft.global[key]
                ? "checked"
                : ""
            }
          >

          <span
            class="nexus-overlays-switch-track"
            aria-hidden="true"
          ></span>
        </span>
      </label>
    `;
  }

  function selectOptionMarkup(
    value,
    label,
    selectedValue
  ) {
    return `
      <option
        value="${esc(value)}"
        ${
          String(value) ===
          String(selectedValue)
            ? "selected"
            : ""
        }
      >
        ${esc(label)}
      </option>
    `;
  }

  function metric(
    label,
    value,
    detail,
    icon
  ) {
    return `
      <article class="nexus-overlays-metric">
        <span class="nexus-overlays-metric-icon">
          <i
            class="fa-solid ${esc(icon)}"
          ></i>
        </span>

        <div>
          <span>
            ${esc(label)}
          </span>

          <strong>
            ${esc(value)}
          </strong>

          <small>
            ${esc(detail)}
          </small>
        </div>
      </article>
    `;
  }

  function enabledOverlayCount() {
    return OVERLAYS.filter(
      overlay =>
        state.draft[
          overlay.key
        ].enabled
    ).length;
  }

  function formatMultiplier(value) {
    return `${
      numberValue(
        value,
        1
      ).toFixed(1)
    }×`;
  }

  function formatRange(
    value,
    suffix
  ) {
    const parsed =
      numberValue(
        value,
        0
      );

    return suffix === "×"
      ? `${parsed.toFixed(1)}×`
      : `${parsed}${suffix}`;
  }

  function updatedLabel(timestamp) {
    if (!timestamp) {
      return "Never";
    }

    const date =
      new Date(timestamp);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return "Saved";
    }

    return new Intl.DateTimeFormat(
      "en-US",
      {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit"
      }
    ).format(date);
  }

  function getOverlayDefinition(key) {
    return (
      OVERLAYS.find(
        overlay =>
          overlay.key === key
      ) ||
      null
    );
  }

  function getOverlayUrl(overlay) {
    const basePath =
      clean(
        state.draft
          ?.global
          ?.basePath,
        "overlays"
      )
        .replace(
          /^\/+/,
          ""
        )
        .replace(
          /\/+$/,
          ""
        );

    const relative =
      `${basePath}/${overlay.file}`
        .replace(
          /\/{2,}/g,
          "/"
        );

    const base =
      `${window.location.origin}${
        window.location.pathname.replace(
          /\/[^/]*$/,
          "/"
        )
      }`;

    try {
      return new URL(
        `/${relative}`,
        window.location.origin
      ).href;
    } catch (error) {
      return `${base}${relative}`;
    }
  }

  function handleInput(event) {
    const target =
      event.target;

    const globalField =
      clean(
        target.dataset
          .overlayGlobalField
      );

    const overlayKey =
      clean(
        target.dataset
          .overlayKey
      );

    const overlayField =
      clean(
        target.dataset
          .overlayField
      );

    if (
      globalField &&
      target.type !==
        "checkbox"
    ) {
      state.draft
        .global[
          globalField
        ] =
          inputValue(target);

      markDirty();

      updateRangeOutput(
        target,
        `global.${globalField}`
      );

      updateUrlLabels();

      return;
    }

    if (
      overlayKey &&
      overlayField &&
      target.type !==
        "checkbox"
    ) {
      if (
        !state.draft[
          overlayKey
        ]
      ) {
        return;
      }

      state.draft[
        overlayKey
      ][overlayField] =
        inputValue(target);

      markDirty();

      updateRangeOutput(
        target,
        `${overlayKey}.${overlayField}`
      );
    }
  }

  function handleChange(event) {
    const target =
      event.target;

    const globalField =
      clean(
        target.dataset
          .overlayGlobalField
      );

    const overlayKey =
      clean(
        target.dataset
          .overlayKey
      );

    const overlayField =
      clean(
        target.dataset
          .overlayField
      );

    if (globalField) {
      state.draft
        .global[
          globalField
        ] =
          inputValue(target);

      markDirty();
      paint();

      return;
    }

    if (
      overlayKey &&
      overlayField &&
      state.draft[
        overlayKey
      ]
    ) {
      state.draft[
        overlayKey
      ][overlayField] =
        inputValue(target);

      markDirty();
      paint();
    }
  }

  function inputValue(target) {
    if (
      target.type ===
      "checkbox"
    ) {
      return target.checked;
    }

    if (
      target.type ===
        "range" ||
      target.type ===
        "number"
    ) {
      return numberValue(
        target.value,
        0
      );
    }

    return target.value;
  }

  function updateRangeOutput(
    target,
    key
  ) {
    if (
      target.type !==
      "range"
    ) {
      return;
    }

    const output =
      state.content
        .querySelector(
          `[data-range-output="${cssEscape(
            key
          )}"]`
        );

    if (!output) {
      return;
    }

    output.textContent =
      `${
        numberValue(
          target.value,
          1
        ).toFixed(1)
      }×`;
  }

  function cssEscape(value) {
    if (
      window.CSS &&
      typeof window.CSS
        .escape ===
        "function"
    ) {
      return window.CSS.escape(
        value
      );
    }

    return String(value)
      .replace(
        /(["\\])/g,
        "\\$1"
      );
  }

  function updateUrlLabels() {
    OVERLAYS.forEach(
      overlay => {
        const card =
          state.content
            .querySelector(
              `[data-overlay-card="${cssEscape(
                overlay.key
              )}"]`
            );

        const label =
          card?.querySelector(
            ".nexus-overlay-url"
          );

        if (!label) {
          return;
        }

        const url =
          getOverlayUrl(
            overlay
          );

        label.textContent =
          url;

        label.title =
          url;
      }
    );
  }

  function markDirty() {
    state.dirty = true;

    state.content
      .querySelectorAll(
        ".nexus-overlays-save-state"
      )
      .forEach(
        element => {
          element.classList.add(
            "dirty"
          );

          element.textContent =
            "Unsaved overlay changes";
        }
      );
  }

  function handleClick(event) {
    const button =
      event.target.closest(
        "[data-overlay-action]"
      );

    if (
      !button ||
      !state.content.contains(
        button
      )
    ) {
      return;
    }

    const action =
      clean(
        button.dataset
          .overlayAction
      );

    const overlayKey =
      clean(
        button.dataset
          .overlayKey
      );

    switch (action) {
      case "refresh":
        void load(true);
        break;

      case "save":
        void save(button);
        break;

      case "restore":
        restoreDefaults();
        break;

      case "preview":
        openPreview(
          overlayKey
        );
        break;

      case "copy-url":
        void copyUrl(
          overlayKey
        );
        break;

      case "replay":
        void replayOverlay(
          overlayKey,
          button
        );
        break;

      default:
        break;
    }
  }

  async function save(button) {
    if (
      !state.draft ||
      state.busy
    ) {
      return;
    }

    const validationError =
      validate();

    if (validationError) {
      toast(
        validationError
      );

      return;
    }

    await runButton(
      button,
      "Saving...",

      async () => {
        const payload =
          normalizedSettings(
            state.draft
          );

        payload.updatedAt =
          firebase.database
            .ServerValue
            .TIMESTAMP;

        payload.updatedBy =
          state.currentUser
            ?.uid ||
          null;

        await state.database
          .ref(
            "broadcastOverlays"
          )
          .set(payload);

        state.saved =
          normalizedSettings({
            ...state.draft,

            updatedAt:
              Date.now(),

            updatedBy:
              state.currentUser
                ?.uid ||
              ""
          });

        state.draft =
          clone(
            state.saved
          );

        state.dirty =
          false;

        paint();

        toast(
          "Overlay settings saved."
        );
      }
    );
  }

  function validate() {
    const basePath =
      clean(
        state.draft
          .global
          .basePath
      );

    if (!basePath) {
      return "Enter the folder containing your OBS overlay files.";
    }

    if (
      /^(https?:)?\/\//i.test(
        basePath
      )
    ) {
      return "Overlay Folder must be a website-relative folder, not a full URL.";
    }

    if (
      basePath.includes(
        ".."
      )
    ) {
      return "Overlay Folder cannot contain parent-directory segments.";
    }

    return "";
  }

  function restoreDefaults() {
    const confirmed =
      window.confirm(
        "Restore every Overlay Setting to the safe defaults?\n\n" +
        "This does not write to Firebase until you press Save All Settings."
      );

    if (!confirmed) {
      return;
    }

    state.draft =
      normalizedSettings(
        DEFAULTS
      );

    state.dirty =
      true;

    paint();

    toast(
      "Safe overlay defaults restored. Save to publish them."
    );
  }

  function openPreview(
    overlayKey
  ) {
    const overlay =
      getOverlayDefinition(
        overlayKey
      );

    if (!overlay) {
      return;
    }

    window.open(
      getOverlayUrl(
        overlay
      ),
      "_blank",
      "noopener,noreferrer"
    );
  }

  async function copyUrl(
    overlayKey
  ) {
    const overlay =
      getOverlayDefinition(
        overlayKey
      );

    if (!overlay) {
      return;
    }

    const url =
      getOverlayUrl(
        overlay
      );

    try {
      if (
        navigator.clipboard &&
        window.isSecureContext
      ) {
        await navigator.clipboard
          .writeText(url);
      } else {
        fallbackCopy(url);
      }

      toast(
        `${overlay.title} OBS URL copied.`
      );
    } catch (error) {
      console.error(
        "Overlay URL copy failed:",
        error
      );

      fallbackCopy(url);

      toast(
        `${overlay.title} OBS URL copied.`
      );
    }
  }

  function fallbackCopy(value) {
    const textarea =
      document.createElement(
        "textarea"
      );

    textarea.value =
      value;

    textarea.setAttribute(
      "readonly",
      ""
    );

    textarea.style.position =
      "fixed";

    textarea.style.opacity =
      "0";

    document.body.appendChild(
      textarea
    );

    textarea.select();

    document.execCommand(
      "copy"
    );

    textarea.remove();
  }

  async function replayOverlay(
    overlayKey,
    button
  ) {
    const overlay =
      getOverlayDefinition(
        overlayKey
      );

    if (
      !overlay ||
      !state.draft
        ?.[overlayKey]
    ) {
      return;
    }

    await runButton(
      button,
      "Triggering...",

      async () => {
        const token =
          Date.now();

        await state.database
          .ref(
            `broadcastOverlays/${overlayKey}/replayToken`
          )
          .set(token);

        state.draft[
          overlayKey
        ].replayToken =
          token;

        if (
          state.saved
            ?.[overlayKey]
        ) {
          state.saved[
            overlayKey
          ].replayToken =
            token;
        }

        toast(
          `${overlay.title} replay triggered.`
        );
      }
    );
  }

  async function runButton(
    button,
    loadingText,
    action
  ) {
    if (
      !button ||
      state.busy
    ) {
      return;
    }

    const original =
      button.innerHTML;

    state.busy =
      true;

    button.disabled =
      true;

    button.innerHTML = `
      <i class="fa-solid fa-spinner fa-spin"></i>
      ${esc(loadingText)}
    `;

    try {
      await action();
    } catch (error) {
      console.error(
        "Overlay Settings action failed:",
        error
      );

      const denied =
        typeof state.isPermissionDenied ===
          "function" &&
        state.isPermissionDenied(
          error
        );

      toast(
        denied
          ? "Firebase denied the broadcastOverlays write. Update your Realtime Database rules."
          : error?.message ||
            "The Overlay Settings action failed."
      );
    } finally {
      state.busy =
        false;

      if (
        button.isConnected
      ) {
        button.disabled =
          false;

        button.innerHTML =
          original;
      }
    }
  }

  function toast(message) {
    if (
      typeof state.showToast ===
      "function"
    ) {
      state.showToast(
        message
      );

      return;
    }

    window.alert(
      message
    );
  }

  function loadingMarkup() {
    return `
      <section class="module-intro">
        <div>
          <h2>
            Overlay Settings
          </h2>

          <p>
            OBS overlay configuration and replay controls.
          </p>
        </div>
      </section>

      <article class="nexus-panel nexus-overlays-state">
        <i class="fa-solid fa-spinner fa-spin"></i>

        <strong>
          Loading Overlay Settings
        </strong>

        <span>
          Reading broadcastOverlays from Firebase.
        </span>
      </article>
    `;
  }

  function deniedMarkup() {
    return `
      <section class="module-intro">
        <div>
          <h2>
            Overlay Settings
          </h2>

          <p>
            OBS overlay configuration and replay controls.
          </p>
        </div>
      </section>

      <article class="nexus-panel nexus-overlays-state error">
        <i class="fa-solid fa-lock"></i>

        <strong>
          Broadcast Control Required
        </strong>

        <span>
          Your Nexus role cannot modify broadcast overlay settings.
        </span>
      </article>
    `;
  }

  function errorMarkup(error) {
    const denied =
      typeof state.isPermissionDenied ===
        "function" &&
      state.isPermissionDenied(
        error
      );

    return `
      <section class="module-intro">
        <div>
          <h2>
            Overlay Settings
          </h2>

          <p>
            OBS overlay configuration and replay controls.
          </p>
        </div>
      </section>

      <article class="nexus-panel nexus-overlays-state error">
        <i class="fa-solid fa-triangle-exclamation"></i>

        <strong>
          Overlay Settings Could Not Load
        </strong>

        <span>
          ${esc(
            denied
              ? "Firebase denied access to broadcastOverlays. Publish the overlay rules before reopening this module."
              : error?.message ||
                "Firebase did not return the overlay settings record."
          )}
        </span>

        <button
          class="action-button"
          type="button"
          data-overlay-action="refresh"
        >
          <i class="fa-solid fa-rotate"></i>
          Try Again
        </button>
      </article>
    `;
  }

  function hasUnsavedChanges() {
    return state.dirty;
  }

  window.NexusOverlays = {
    render,
    cleanup,
    hasUnsavedChanges
  };
})();
      
