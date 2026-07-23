(() => {
  "use strict";

  const FORMATS = {
    "8_single_elim": {
      label: "8 Team Single Elimination",
      teamCount: 8
    },

    "16_single_elim": {
      label: "16 Team Single Elimination",
      teamCount: 16
    }
  };

  const TIMEZONES = [
    [
      "America/Chicago",
      "Central Time — America/Chicago"
    ],

    [
      "America/New_York",
      "Eastern Time — America/New_York"
    ],

    [
      "America/Denver",
      "Mountain Time — America/Denver"
    ],

    [
      "America/Los_Angeles",
      "Pacific Time — America/Los_Angeles"
    ],

    [
      "UTC",
      "UTC"
    ]
  ];

  const FEATURES = [
    [
      "predictions",
      "Predictions",
      "Public Prediction Center and Pick’em visibility.",
      "fa-crosshairs"
    ],

    [
      "giveaways",
      "Giveaways",
      "Public giveaway discovery and entry visibility.",
      "fa-gift"
    ],

    [
      "leaderboard",
      "Leaderboard",
      "Player rankings and Hall of Champions access.",
      "fa-ranking-star"
    ],

    [
      "shop",
      "Shop",
      "Public shop navigation and storefront visibility.",
      "fa-store"
    ],

    [
      "hallOfChampions",
      "Hall of Champions",
      "Public championship archive visibility.",
      "fa-crown"
    ]
  ];

  const TONES = {
    info: [
      "Information",
      "fa-circle-info"
    ],

    success: [
      "Success",
      "fa-circle-check"
    ],

    warning: [
      "Warning",
      "fa-triangle-exclamation"
    ],

    critical: [
      "Critical",
      "fa-circle-exclamation"
    ]
  };

  const SAFE_PRIVATE = {
    schemaVersion: 1,

    defaultTournament: {
      formatType:
        "8_single_elim",

      playersPerTeam:
        6,

      maxApplications:
        64,

      prizePool:
        "$60",

      startingPrizePool:
        "$60",

      donationGoal:
        "$250",

      timezone:
        "America/Chicago"
    },

    updatedAt:
      0,

    updatedBy:
      ""
  };

  const SAFE_PUBLIC = {
    schemaVersion: 1,

    features: {
      predictions:
        true,

      giveaways:
        true,

      leaderboard:
        true,

      shop:
        false,

      hallOfChampions:
        true
    },

    banner: {
      enabled:
        false,

      tone:
        "info",

      title:
        "",

      message:
        "",

      linkLabel:
        "",

      linkUrl:
        ""
    },

    updatedAt:
      0,

    updatedBy:
      ""
  };

  const state = {
    database:
      null,

    content:
      null,

    currentUser:
      null,

    roleId:
      "",

    showToast:
      null,

    escapeHtml:
      null,

    isPermissionDenied:
      null,

    privateSaved:
      null,

    privateDraft:
      null,

    publicSaved:
      null,

    publicDraft:
      null,

    privateDirty:
      false,

    publicDirty:
      false,

    busy:
      false,

    bound:
      false
  };

  const clone =
    value =>
      JSON.parse(
        JSON.stringify(value)
      );

  const clean =
    (
      value,
      fallback = ""
    ) =>
      String(
        value == null
          ? fallback
          : value
      ).trim();

  const num =
    (
      value,
      fallback
    ) =>
      Number.isFinite(
        Number(value)
      )
        ? Number(value)
        : fallback;

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
      .replaceAll(
        "&",
        "&amp;"
      )
      .replaceAll(
        "<",
        "&lt;"
      )
      .replaceAll(
        ">",
        "&gt;"
      )
      .replaceAll(
        '"',
        "&quot;"
      )
      .replaceAll(
        "'",
        "&#039;"
      );
  }

  function toast(message) {
    if (
      typeof state.showToast ===
      "function"
    ) {
      state.showToast(
        message
      );
    }
  }

  function normalizedPrivate(
    value = {}
  ) {
    const source =
      value.defaultTournament ||
      {};

    const maxApplications =
      source
        .maxApplicationsUnlimited ===
        true ||
      source.maxApplications ===
        null ||
      source.maxApplications ===
        ""
        ? null
        : Math.max(
            1,
            Math.round(
              num(
                source
                  .maxApplications,
                64
              )
            )
          );

    return {
      schemaVersion:
        1,

      defaultTournament: {
        formatType:
          FORMATS[
            source.formatType
          ]
            ? source.formatType
            : "8_single_elim",

        playersPerTeam:
          Math.min(
            12,
            Math.max(
              1,
              Math.round(
                num(
                  source
                    .playersPerTeam,
                  6
                )
              )
            )
          ),

        maxApplications,

        prizePool:
          clean(
            source.prizePool,
            "$60"
          ),

        startingPrizePool:
          clean(
            source
              .startingPrizePool,
            "$60"
          ),

        donationGoal:
          clean(
            source.donationGoal,
            "$250"
          ),

        timezone:
          TIMEZONES.some(
            ([key]) =>
              key ===
              source.timezone
          )
            ? source.timezone
            : "America/Chicago"
      },

      updatedAt:
        num(
          value.updatedAt,
          0
        ),

      updatedBy:
        clean(
          value.updatedBy
        )
    };
  }

  function normalizedPublic(
    value = {}
  ) {
    const sourceFeatures =
      value.features ||
      {};

    const sourceBanner =
      value.banner ||
      {};

    const features = {};

    FEATURES.forEach(
      ([key]) => {
        features[key] =
          typeof sourceFeatures[
            key
          ] ===
          "boolean"
            ? sourceFeatures[
                key
              ]
            : SAFE_PUBLIC
                .features[
                  key
                ];
      }
    );

    return {
      schemaVersion:
        1,

      features,

      banner: {
        enabled:
          typeof sourceBanner
            .enabled ===
          "boolean"
            ? sourceBanner
                .enabled
            : false,

        tone:
          TONES[
            sourceBanner.tone
          ]
            ? sourceBanner.tone
            : "info",

        title:
          clean(
            sourceBanner.title
          ),

        message:
          clean(
            sourceBanner.message
          ),

        linkLabel:
          clean(
            sourceBanner.linkLabel
          ),

        linkUrl:
          clean(
            sourceBanner.linkUrl
          )
      },

      updatedAt:
        num(
          value.updatedAt,
          0
        ),

      updatedBy:
        clean(
          value.updatedBy
        )
    };
  }

  function render(context) {
    cleanup();

    state.database =
      context.database;

    state.content =
      context.content;

    state.currentUser =
      context.currentUser;

    state.roleId =
      context.roleId ||
      "";

    state.showToast =
      context.showToast;

    state.escapeHtml =
      context.escapeHtml;

    state.isPermissionDenied =
      context
        .isPermissionDenied;

    if (
      state.roleId !==
      "owner"
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
      state.content
        .removeEventListener(
          "click",
          handleClick
        );

      state.content
        .removeEventListener(
          "input",
          handleInput
        );

      state.content
        .removeEventListener(
          "change",
          handleChange
        );
    }

    Object.assign(
      state,
      {
        database:
          null,

        content:
          null,

        currentUser:
          null,

        roleId:
          "",

        showToast:
          null,

        escapeHtml:
          null,

        isPermissionDenied:
          null,

        privateSaved:
          null,

        privateDraft:
          null,

        publicSaved:
          null,

        publicDraft:
          null,

        privateDirty:
          false,

        publicDirty:
          false,

        busy:
          false,

        bound:
          false
      }
    );
  }

  function bind() {
    state.content
      .addEventListener(
        "click",
        handleClick
      );

    state.content
      .addEventListener(
        "input",
        handleInput
      );

    state.content
      .addEventListener(
        "change",
        handleChange
      );

    state.bound =
      true;
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
      !force &&
      (
        state.privateDirty ||
        state.publicDirty
      ) &&
      !window.confirm(
        "Discard unsaved Nexus Settings changes and reload Firebase?"
      )
    ) {
      return;
    }

    state.busy =
      true;

    try {
      const [
        privateSnapshot,
        publicSnapshot
      ] =
        await Promise.all([
          state.database
            .ref(
              "nexusSettings"
            )
            .once(
              "value"
            ),

          state.database
            .ref(
              "publicConfig"
            )
            .once(
              "value"
            )
        ]);

      state.privateSaved =
        normalizedPrivate(
          privateSnapshot.val() ||
          SAFE_PRIVATE
        );

      state.privateDraft =
        clone(
          state.privateSaved
        );

      state.publicSaved =
        normalizedPublic(
          publicSnapshot.val() ||
          SAFE_PUBLIC
        );

      state.publicDraft =
        clone(
          state.publicSaved
        );

      state.privateDirty =
        false;

      state.publicDirty =
        false;

      paint();
    } catch (error) {
      console.error(
        "Nexus Settings load failed:",
        error
      );

      state.content.innerHTML =
        errorMarkup(error);
    } finally {
      state.busy =
        false;
    }
  }

  function paint() {
    if (
      !state.content ||
      !state.privateDraft ||
      !state.publicDraft
    ) {
      return;
    }

    state.content.innerHTML = `
      <section class="module-intro nexus-settings-intro">
        <div>
          <h2>Nexus Settings</h2>

          <p>
            Manage owner-only tournament defaults and publish safe public configuration.
          </p>
        </div>

        <div class="module-actions">
          <button
            class="action-button"
            type="button"
            data-settings-action="refresh"
          >
            <i class="fa-solid fa-rotate"></i>
            Reload Firebase
          </button>
        </div>
      </section>

      <section class="nexus-settings-summary">
        ${metric(
          "Owner Access",
          "Protected",
          "Private settings are owner-only",
          "fa-shield-halved",
          "protected"
        )}

        ${metric(
          "Default Format",
          FORMATS[
            state.privateDraft
              .defaultTournament
              .formatType
          ].label,
          `${state.privateDraft.defaultTournament.playersPerTeam} players per team`,
          "fa-diagram-project"
        )}

        ${metric(
          "Public Features",
          `${enabledCount()}/${FEATURES.length} Enabled`,
          "Stored in publicConfig/features",
          "fa-toggle-on"
        )}

        ${metric(
          "Public Banner",
          state.publicDraft
            .banner.enabled
            ? "Enabled"
            : "Disabled",
          state.publicDraft
            .banner.title ||
            "No active title",
          "fa-bullhorn",
          state.publicDraft
            .banner.enabled
            ? "active"
            : ""
        )}
      </section>

      <article class="nexus-panel nexus-settings-scope-note">
        <i class="fa-solid fa-circle-info"></i>

        <div>
          <strong>
            Configuration registry
          </strong>

          <p>
            This module stores defaults and public flags. Existing pages only react after they are connected to
            <code>publicConfig</code>. It never changes matches, scores, winners, rewards, balances or overlays.
          </p>
        </div>
      </article>

      <section class="nexus-settings-layout">
        ${privatePanelMarkup()}
        ${featuresPanelMarkup()}
        ${bannerPanelMarkup()}
        ${scopePanelMarkup()}
      </section>
    `;
  }

  function privatePanelMarkup() {
    const d =
      state.privateDraft
        .defaultTournament;

    return `
      <article class="nexus-panel nexus-settings-panel">
        <header class="panel-header nexus-settings-panel-header">
          <div>
            <h3>
              Tournament Defaults
            </h3>

            <span>
              Private · nexusSettings/defaultTournament
            </span>
          </div>

          ${saveState(
            state.privateDirty,
            state.privateSaved
              .updatedAt
          )}
        </header>

        <div class="nexus-settings-panel-body">
          <div class="nexus-settings-form-grid">
            <label class="nexus-settings-field">
              <span>
                Default Format
              </span>

              <select
                data-private-field="formatType"
              >
                ${Object.entries(
                  FORMATS
                )
                  .map(
                    ([
                      key,
                      value
                    ]) => `
                      <option
                        value="${esc(
                          key
                        )}"
                        ${
                          key ===
                          d.formatType
                            ? "selected"
                            : ""
                        }
                      >
                        ${esc(
                          value.label
                        )}
                      </option>
                    `
                  )
                  .join("")}
              </select>
            </label>

            <label class="nexus-settings-field">
              <span>
                Players Per Team
              </span>

              <input
                type="number"
                inputmode="numeric"
                min="1"
                max="12"
                step="1"
                value="${esc(
                  d.playersPerTeam
                )}"
                data-private-field="playersPerTeam"
              >
            </label>

            <label class="nexus-settings-field">
              <span>
                Maximum Applications
              </span>

              <input
                type="number"
                inputmode="numeric"
                min="1"
                step="1"
                placeholder="Blank = unlimited"
                value="${
                  d.maxApplications ==
                  null
                    ? ""
                    : esc(
                        d.maxApplications
                      )
                }"
                data-private-field="maxApplications"
              >

              <small
                id="nexusSettingsCapacityNote"
              >
                ${esc(
                  capacityNote()
                )}
              </small>
            </label>

            <label class="nexus-settings-field">
              <span>
                Event Time Zone
              </span>

              <select
                data-private-field="timezone"
              >
                ${TIMEZONES.map(
                  ([
                    key,
                    label
                  ]) => `
                    <option
                      value="${esc(
                        key
                      )}"
                      ${
                        key ===
                        d.timezone
                          ? "selected"
                          : ""
                      }
                    >
                      ${esc(
                        label
                      )}
                    </option>
                  `
                ).join("")}
              </select>
            </label>

            ${textField(
              "Current Prize Pool Default",
              "prizePool",
              d.prizePool,
              "$60"
            )}

            ${textField(
              "Starting Prize Pool Default",
              "startingPrizePool",
              d.startingPrizePool,
              "$60"
            )}

            ${textField(
              "Donation Goal Default",
              "donationGoal",
              d.donationGoal,
              "$250",
              true
            )}
          </div>

          <div class="nexus-settings-actions">
            <button
              class="action-button"
              type="button"
              data-settings-action="restore-private"
            >
              <i class="fa-solid fa-arrow-rotate-left"></i>
              Restore Safe Defaults
            </button>

            <button
              class="action-button action-button-primary"
              type="button"
              data-settings-action="save-private"
            >
              <i class="fa-solid fa-floppy-disk"></i>
              Save Owner Defaults
            </button>
          </div>
        </div>
      </article>
    `;
  }

  function featuresPanelMarkup() {
    return `
      <article class="nexus-panel nexus-settings-panel">
        <header class="panel-header nexus-settings-panel-header">
          <div>
            <h3>
              Public Feature Registry
            </h3>

            <span>
              Public · publicConfig/features
            </span>
          </div>

          ${saveState(
            state.publicDirty,
            state.publicSaved
              .updatedAt
          )}
        </header>

        <div class="nexus-settings-panel-body">
          <div class="nexus-settings-feature-list">
            ${FEATURES.map(
              ([
                key,
                title,
                description,
                icon
              ]) =>
                featureMarkup(
                  key,
                  title,
                  description,
                  icon
                )
            ).join("")}
          </div>

          <div class="nexus-settings-public-warning">
            <i class="fa-solid fa-code"></i>

            <span>
              A toggle becomes active only after the matching page or global header reads its publicConfig value.
            </span>
          </div>
        </div>
      </article>
    `;
  }

  function bannerPanelMarkup() {
    const b =
      state.publicDraft
        .banner;

    return `
      <article class="nexus-panel nexus-settings-panel nexus-settings-banner-panel">
        <header class="panel-header nexus-settings-panel-header">
          <div>
            <h3>
              Public Announcement Banner
            </h3>

            <span>
              Public · publicConfig/banner
            </span>
          </div>

          <span class="nexus-settings-live-badge ${
            b.enabled
              ? "enabled"
              : ""
          }">
            <i class="fa-solid ${
              b.enabled
                ? "fa-eye"
                : "fa-eye-slash"
            }"></i>

            ${
              b.enabled
                ? "Enabled"
                : "Disabled"
            }
          </span>
        </header>

        <div class="nexus-settings-banner-layout">
          <section class="nexus-settings-banner-editor">
            <label class="nexus-settings-switch-row">
              <span>
                <strong>
                  Enable Public Banner
                </strong>

                <small>
                  Publishes the banner state for connected public pages.
                </small>
              </span>

              <input
                type="checkbox"
                data-banner-field="enabled"
                ${
                  b.enabled
                    ? "checked"
                    : ""
                }
              >

              <span
                class="nexus-settings-switch"
                aria-hidden="true"
              ></span>
            </label>

            <div class="nexus-settings-form-grid">
              <label class="nexus-settings-field">
                <span>
                  Banner Tone
                </span>

                <select
                  data-banner-field="tone"
                >
                  ${Object.entries(
                    TONES
                  )
                    .map(
                      ([
                        key,
                        value
                      ]) => `
                        <option
                          value="${esc(
                            key
                          )}"
                          ${
                            key ===
                            b.tone
                              ? "selected"
                              : ""
                          }
                        >
                          ${esc(
                            value[0]
                          )}
                        </option>
                      `
                    )
                    .join("")}
                </select>
              </label>

              <label class="nexus-settings-field">
                <span>
                  Banner Title
                </span>

                <input
                  type="text"
                  maxlength="80"
                  value="${esc(
                    b.title
                  )}"
                  placeholder="Tournament applications are open"
                  data-banner-field="title"
                >
              </label>

              <label class="nexus-settings-field nexus-settings-field-wide">
                <span>
                  Banner Message
                </span>

                <textarea
                  maxlength="240"
                  placeholder="Enter the public announcement..."
                  data-banner-field="message"
                >${esc(
                  b.message
                )}</textarea>
              </label>

              <label class="nexus-settings-field">
                <span>
                  Link Label
                </span>

                <input
                  type="text"
                  maxlength="40"
                  value="${esc(
                    b.linkLabel
                  )}"
                  placeholder="View Tournament"
                  data-banner-field="linkLabel"
                >
              </label>

              <label class="nexus-settings-field">
                <span>
                  Link URL
                </span>

                <input
                  type="text"
                  maxlength="240"
                  value="${esc(
                    b.linkUrl
                  )}"
                  placeholder="tournament.html"
                  data-banner-field="linkUrl"
                >
              </label>
            </div>
          </section>

          <aside class="nexus-settings-banner-preview">
            <header>
              <span>
                Website Preview
              </span>

              <strong>
                ${
                  b.enabled
                    ? "Configured"
                    : "Hidden"
                }
              </strong>
            </header>

            <div
              id="nexusSettingsBannerPreview"
            >
              ${bannerPreview()}
            </div>
          </aside>
        </div>

        <div class="nexus-settings-publish-row">
          <button
            class="action-button"
            type="button"
            data-settings-action="restore-public"
          >
            <i class="fa-solid fa-arrow-rotate-left"></i>
            Restore Public Defaults
          </button>

          <button
            class="action-button action-button-primary"
            type="button"
            data-settings-action="save-public"
          >
            <i class="fa-solid fa-cloud-arrow-up"></i>
            Publish Public Configuration
          </button>
        </div>
      </article>
    `;
  }

  function scopePanelMarkup() {
    return `
      <article class="nexus-panel nexus-settings-data-panel">
        <header class="panel-header">
          <h3>
            Firebase Scope
          </h3>

          <span>
            Protected boundaries
          </span>
        </header>

        <div class="nexus-settings-data-grid">
          ${pathMarkup(
            "nexusSettings",
            "Owner-only read and write",
            "Tournament defaults and future private Nexus preferences",
            "fa-lock"
          )}

          ${pathMarkup(
            "publicConfig",
            "Public read · Owner write",
            "Feature visibility and announcement banner configuration",
            "fa-globe"
          )}
        </div>
      </article>
    `;
  }

  function metric(
    label,
    value,
    detail,
    icon,
    className = ""
  ) {
    return `
      <article class="nexus-settings-metric ${esc(
        className
      )}">
        <span class="nexus-settings-metric-icon">
          <i class="fa-solid ${esc(
            icon
          )}"></i>
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

  function saveState(
    dirty,
    updatedAt
  ) {
    return `
      <span class="nexus-settings-save-state ${
        dirty
          ? "dirty"
          : ""
      }">
        <i class="fa-solid ${
          dirty
            ? "fa-pen"
            : "fa-circle-check"
        }"></i>

        ${esc(
          dirty
            ? "Unsaved Changes"
            : updatedLabel(
                updatedAt
              )
        )}
      </span>
    `;
  }

  function textField(
    label,
    key,
    value,
    placeholder,
    wide = false
  ) {
    return `
      <label class="nexus-settings-field ${
        wide
          ? "nexus-settings-field-wide"
          : ""
      }">
        <span>
          ${esc(label)}
        </span>

        <input
          type="text"
          maxlength="60"
          value="${esc(
            value
          )}"
          placeholder="${esc(
            placeholder
          )}"
          data-private-field="${esc(
            key
          )}"
        >
      </label>
    `;
  }

  function featureMarkup(
    key,
    title,
    description,
    icon
  ) {
    const enabled =
      state.publicDraft
        .features[key] ===
      true;

    return `
      <label class="nexus-settings-feature ${
        enabled
          ? "enabled"
          : ""
      }">
        <span class="nexus-settings-feature-icon">
          <i class="fa-solid ${esc(
            icon
          )}"></i>
        </span>

        <span class="nexus-settings-feature-copy">
          <strong>
            ${esc(title)}
          </strong>

          <small>
            ${esc(
              description
            )}
          </small>
        </span>

        <input
          type="checkbox"
          data-feature-key="${esc(
            key
          )}"
          ${
            enabled
              ? "checked"
              : ""
          }
        >

        <span
          class="nexus-settings-switch"
          aria-hidden="true"
        ></span>
      </label>
    `;
  }

  function bannerPreview() {
    const b =
      state.publicDraft
        .banner;

    const tone =
      TONES[b.tone] ||
      TONES.info;

    if (
      !b.title &&
      !b.message
    ) {
      return `
        <div class="nexus-settings-banner-empty">
          <i class="fa-solid fa-bullhorn"></i>

          <strong>
            No Banner Content
          </strong>

          <span>
            Enter a title or message to preview the announcement.
          </span>
        </div>
      `;
    }

    return `
      <div class="nexus-settings-banner-card tone-${esc(
        b.tone
      )} ${
        b.enabled
          ? ""
          : "disabled"
      }">
        <i class="fa-solid ${esc(
          tone[1]
        )}"></i>

        <div>
          <strong>
            ${esc(
              b.title ||
              tone[0]
            )}
          </strong>

          ${
            b.message
              ? `
                <span>
                  ${esc(
                    b.message
                  )}
                </span>
              `
              : ""
          }
        </div>

        ${
          b.linkLabel
            ? `
              <span class="nexus-settings-banner-link">
                ${esc(
                  b.linkLabel
                )}

                <i class="fa-solid fa-arrow-right"></i>
              </span>
            `
            : ""
        }
      </div>
    `;
  }

  function pathMarkup(
    path,
    access,
    description,
    icon
  ) {
    return `
      <div class="nexus-settings-data-path">
        <i class="fa-solid ${esc(
          icon
        )}"></i>

        <div>
          <code>
            ${esc(path)}
          </code>

          <strong>
            ${esc(access)}
          </strong>

          <span>
            ${esc(
              description
            )}
          </span>
        </div>
      </div>
    `;
  }

  function loadingMarkup() {
    return `
      <section class="module-intro">
        <div>
          <h2>
            Nexus Settings
          </h2>

          <p>
            Protected Control Center configuration and public feature registry.
          </p>
        </div>
      </section>

      <article class="nexus-panel nexus-settings-state">
        <i class="fa-solid fa-spinner fa-spin"></i>

        <strong>
          Loading Settings
        </strong>

        <span>
          Reading owner defaults and public configuration from Firebase.
        </span>
      </article>
    `;
  }

  function deniedMarkup() {
    return `
      <section class="module-intro">
        <div>
          <h2>
            Nexus Settings
          </h2>

          <p>
            Protected Control Center configuration and public feature registry.
          </p>
        </div>
      </section>

      <article class="nexus-panel nexus-settings-state">
        <i class="fa-solid fa-lock"></i>

        <strong>
          Owner Access Required
        </strong>

        <span>
          Nexus Settings is restricted to the Rivals Gauntlet owner account.
        </span>
      </article>
    `;
  }

  function errorMarkup(
    error
  ) {
    const denied =
      typeof state
        .isPermissionDenied ===
        "function" &&
      state.isPermissionDenied(
        error
      );

    return `
      <section class="module-intro">
        <div>
          <h2>
            Nexus Settings
          </h2>

          <p>
            Protected Control Center configuration and public feature registry.
          </p>
        </div>
      </section>

      <article class="nexus-panel nexus-settings-state nexus-settings-error">
        <i class="fa-solid fa-triangle-exclamation"></i>

        <strong>
          Settings Could Not Load
        </strong>

        <span>
          ${esc(
            denied
              ? "Firebase denied access. Confirm the owner-only nexusSettings and publicConfig rules are published."
              : error?.message ||
                "Firebase did not return the settings records."
          )}
        </span>

        <button
          class="action-button"
          type="button"
          data-settings-action="refresh"
        >
          <i class="fa-solid fa-rotate"></i>
          Try Again
        </button>
      </article>
    `;
  }

  function enabledCount() {
    return FEATURES.filter(
      ([key]) =>
        state.publicDraft
          .features[key]
    ).length;
  }

  function capacityNote() {
    const d =
      state.privateDraft
        .defaultTournament;

    const rosterCapacity =
      FORMATS[
        d.formatType
      ].teamCount *
      d.playersPerTeam;

    return d.maxApplications ==
      null
      ? `Unlimited applications · ${rosterCapacity} roster positions`
      : `${d.maxApplications} application limit · ${rosterCapacity} roster positions`;
  }

  function updatedLabel(
    timestamp
  ) {
    if (!timestamp) {
      return "Never saved";
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

    return new Intl
      .DateTimeFormat(
        "en-US",
        {
          month:
            "short",

          day:
            "numeric",

          year:
            "numeric",

          hour:
            "numeric",

          minute:
            "2-digit"
        }
      )
      .format(date);
  }

  function handleInput(
    event
  ) {
    const privateField =
      clean(
        event.target
          .dataset
          .privateField
      );

    const bannerField =
      clean(
        event.target
          .dataset
          .bannerField
      );

    if (privateField) {
      setPrivateField(
        privateField,
        event.target.value
      );

      return;
    }

    if (
      bannerField &&
      event.target.type !==
        "checkbox"
    ) {
      state.publicDraft
        .banner[
          bannerField
        ] =
        event.target.value;

      state.publicDirty =
        true;

      updateLivePieces();
    }
  }

  function handleChange(
    event
  ) {
    const privateField =
      clean(
        event.target
          .dataset
          .privateField
      );

    const bannerField =
      clean(
        event.target
          .dataset
          .bannerField
      );

    const featureKey =
      clean(
        event.target
          .dataset
          .featureKey
      );

    if (privateField) {
      setPrivateField(
        privateField,
        event.target.value
      );

      return;
    }

    if (
      featureKey &&
      featureKey in
        state.publicDraft
          .features
    ) {
      state.publicDraft
        .features[
          featureKey
        ] =
        event.target.checked;

      state.publicDirty =
        true;

      paint();

      return;
    }

    if (bannerField) {
      state.publicDraft
        .banner[
          bannerField
        ] =
        event.target.type ===
        "checkbox"
          ? event.target.checked
          : event.target.value;

      state.publicDirty =
        true;

      paint();
    }
  }

  function setPrivateField(
    field,
    rawValue
  ) {
    const d =
      state.privateDraft
        .defaultTournament;

    if (
      field ===
      "playersPerTeam"
    ) {
      d.playersPerTeam =
        Math.min(
          12,
          Math.max(
            1,
            Math.round(
              num(
                rawValue,
                1
              )
            )
          )
        );
    } else if (
      field ===
      "maxApplications"
    ) {
      d.maxApplications =
        clean(rawValue) ===
        ""
          ? null
          : Math.max(
              1,
              Math.round(
                num(
                  rawValue,
                  1
                )
              )
            );
    } else {
      d[field] =
        rawValue;
    }

    state.privateDirty =
      true;

    updateLivePieces();
  }

  function updateLivePieces() {
    const note =
      state.content
        ?.querySelector(
          "#nexusSettingsCapacityNote"
        );

    if (note) {
      note.textContent =
        capacityNote();
    }

    const preview =
      state.content
        ?.querySelector(
          "#nexusSettingsBannerPreview"
        );

    if (preview) {
      preview.innerHTML =
        bannerPreview();
    }

    const saveStates =
      state.content
        ?.querySelectorAll(
          ".nexus-settings-save-state"
        ) ||
      [];

    if (
      saveStates[0] &&
      state.privateDirty
    ) {
      saveStates[0]
        .className =
        "nexus-settings-save-state dirty";

      saveStates[0]
        .innerHTML =
        '<i class="fa-solid fa-pen"></i> Unsaved Changes';
    }

    if (
      saveStates[1] &&
      state.publicDirty
    ) {
      saveStates[1]
        .className =
        "nexus-settings-save-state dirty";

      saveStates[1]
        .innerHTML =
        '<i class="fa-solid fa-pen"></i> Unsaved Changes';
    }
  }

  function handleClick(
    event
  ) {
    const button =
      event.target.closest(
        "[data-settings-action]"
      );

    if (
      !button ||
      !state.content
        ?.contains(button)
    ) {
      return;
    }

    switch (
      button.dataset
        .settingsAction
    ) {
      case "refresh":
        void load();
        break;

      case "restore-private":
        restorePrivate();
        break;

      case "restore-public":
        restorePublic();
        break;

      case "save-private":
        void savePrivate(
          button
        );
        break;

      case "save-public":
        void savePublic(
          button
        );
        break;

      default:
        break;
    }
  }

  function restorePrivate() {
    if (
      !window.confirm(
        "Restore the local tournament-default form to safe defaults?\n\nNothing is written until Save Owner Defaults is pressed."
      )
    ) {
      return;
    }

    state.privateDraft =
      clone(
        SAFE_PRIVATE
      );

    state.privateDirty =
      true;

    paint();

    toast(
      "Safe tournament defaults restored locally."
    );
  }

  function restorePublic() {
    if (
      !window.confirm(
        "Restore the local public feature and banner form to safe defaults?\n\nNothing is written until Publish Public Configuration is pressed."
      )
    ) {
      return;
    }

    state.publicDraft =
      clone(
        SAFE_PUBLIC
      );

    state.publicDirty =
      true;

    paint();

    toast(
      "Public configuration defaults restored locally."
    );
  }

  function validatePrivate() {
    const d =
      state.privateDraft
        .defaultTournament;

    if (
      !FORMATS[
        d.formatType
      ]
    ) {
      return "Select a supported tournament format.";
    }

    const rosterCapacity =
      FORMATS[
        d.formatType
      ].teamCount *
      d.playersPerTeam;

    if (
      !Number.isInteger(
        d.playersPerTeam
      ) ||
      d.playersPerTeam <
        1 ||
      d.playersPerTeam >
        12
    ) {
      return "Players per team must be a whole number from 1 to 12.";
    }

    if (
      d.maxApplications !=
        null &&
      (
        !Number.isInteger(
          d.maxApplications
        ) ||
        d.maxApplications <
          rosterCapacity
      )
    ) {
      return `Maximum applications must be blank for unlimited or at least ${rosterCapacity}.`;
    }

    if (
      !TIMEZONES.some(
        ([key]) =>
          key ===
          d.timezone
      )
    ) {
      return "Select a supported event time zone.";
    }

    return "";
  }

  function validUrl(value) {
    if (!clean(value)) {
      return true;
    }

    try {
      const url =
        new URL(
          value,
          window.location.href
        );

      return (
        url.protocol ===
          "http:" ||
        url.protocol ===
          "https:"
      );
    } catch {
      return false;
    }
  }

  function validatePublic() {
    const b =
      state.publicDraft
        .banner;

    if (
      !TONES[b.tone]
    ) {
      return "Select a supported banner tone.";
    }

    if (
      b.enabled &&
      !clean(b.title) &&
      !clean(b.message)
    ) {
      return "Enter a banner title or message before enabling it.";
    }

    if (
      b.linkLabel &&
      !b.linkUrl
    ) {
      return "Enter the banner link URL or remove its link label.";
    }

    if (
      b.linkUrl &&
      !validUrl(
        b.linkUrl
      )
    ) {
      return "The banner link must be an HTTP, HTTPS or valid relative website URL.";
    }

    return "";
  }

  async function runButton(
    button,
    loadingText,
    action
  ) {
    if (
      state.busy ||
      !button
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
      ${esc(
        loadingText
      )}
    `;

    try {
      await action();
    } catch (error) {
      console.error(
        "Nexus Settings action failed:",
        error
      );

      const denied =
        typeof state
          .isPermissionDenied ===
          "function" &&
        state.isPermissionDenied(
          error
        );

      toast(
        denied
          ? "Firebase denied the owner-only settings write."
          : error?.message ||
            "The Nexus Settings action failed."
      );
    } finally {
      state.busy =
        false;

      button.disabled =
        false;

      button.innerHTML =
        original;
    }
  }

  async function savePrivate(
    button
  ) {
    const error =
      validatePrivate();

    if (error) {
      return toast(error);
    }

    await runButton(
      button,
      "Saving...",
      async () => {
        const d =
          state.privateDraft
            .defaultTournament;

        const timestamp =
          firebase.database
            .ServerValue
            .TIMESTAMP;

        await state.database
          .ref()
          .update({
            "nexusSettings/schemaVersion":
              1,

            "nexusSettings/defaultTournament":
              {
                formatType:
                  d.formatType,

                playersPerTeam:
                  d.playersPerTeam,

                maxApplications:
                  d.maxApplications,

                maxApplicationsUnlimited:
                  d.maxApplications ==
                  null,

                prizePool:
                  clean(
                    d.prizePool
                  ),

                startingPrizePool:
                  clean(
                    d.startingPrizePool
                  ),

                donationGoal:
                  clean(
                    d.donationGoal
                  ),

                timezone:
                  d.timezone
              },

            "nexusSettings/updatedAt":
              timestamp,

            "nexusSettings/updatedBy":
              state.currentUser
                ?.uid ||
              null
          });

        state.privateSaved =
          clone(
            state.privateDraft
          );

        state.privateSaved
          .updatedAt =
          Date.now();

        state.privateSaved
          .updatedBy =
          state.currentUser
            ?.uid ||
          "";

        state.privateDraft =
          clone(
            state.privateSaved
          );

        state.privateDirty =
          false;

        paint();

        toast(
          "Owner tournament defaults saved."
        );
      }
    );
  }

  async function savePublic(
    button
  ) {
    const error =
      validatePublic();

    if (error) {
      return toast(error);
    }

    const b =
      state.publicDraft
        .banner;

    if (
      !window.confirm(
        `${b.enabled ? "Publish" : "Save"} the current public feature and banner configuration?\n\nThis writes to publicConfig, which public website pages can read.`
      )
    ) {
      return;
    }

    await runButton(
      button,
      "Publishing...",
      async () => {
        const timestamp =
          firebase.database
            .ServerValue
            .TIMESTAMP;

        await state.database
          .ref()
          .update({
            "publicConfig/schemaVersion":
              1,

            "publicConfig/features":
              clone(
                state.publicDraft
                  .features
              ),

            "publicConfig/banner":
              {
                enabled:
                  b.enabled,

                tone:
                  b.tone,

                title:
                  clean(
                    b.title
                  ),

                message:
                  clean(
                    b.message
                  ),

                linkLabel:
                  clean(
                    b.linkLabel
                  ),

                linkUrl:
                  clean(
                    b.linkUrl
                  )
              },

            "publicConfig/updatedAt":
              timestamp,

            "publicConfig/updatedBy":
              state.currentUser
                ?.uid ||
              null
          });

        state.publicSaved =
          clone(
            state.publicDraft
          );

        state.publicSaved
          .updatedAt =
          Date.now();

        state.publicSaved
          .updatedBy =
          state.currentUser
            ?.uid ||
          "";

        state.publicDraft =
          clone(
            state.publicSaved
          );

        state.publicDirty =
          false;

        paint();

        toast(
          "Public configuration published."
        );
      }
    );
  }

  function hasUnsavedChanges() {
    return (
      state.privateDirty ||
      state.publicDirty
    );
  }

  window.NexusSettings = {
    render,
    cleanup,
    hasUnsavedChanges
  };
})();
