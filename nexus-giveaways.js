(function () {
  "use strict";

  const MAX_IMAGE_BYTES =
    8 * 1024 * 1024;

  const ALLOWED_IMAGE_TYPES =
    new Set([
      "image/jpeg",
      "image/png",
      "image/webp"
    ]);

  const STATUS_LABELS = {
    draft: "Draft",
    scheduled: "Scheduled",
    live: "Live",
    paused: "Paused",
    closed: "Closed"
  };

  const ELIGIBILITY_LABELS = {
    all_players: "All Signed-In Players",
    tournament_players: "Tournament Participants",
    checked_in_players: "Checked-In Players",
    selected_players: "Selected Players"
  };

  const REWARD_LABELS = {
    rg_points: "RG Points",
    basic_crate: "Basic Crate",
    rare_crate: "Rare Crate",
    elite_crate: "Elite Crate",
    cosmetic: "Profile Cosmetic",
    custom: "Custom Reward"
  };

  const state = {
    api: null,
    database: null,
    storage: null,
    content: null,
    currentUser: null,
    roleId: "",

    activeTournamentId: "",

    giveaways: [],
    entryCounts: {},
    winnerCounts: {},

    giveawaysRef: null,
    giveawaysCallback: null,

    entriesRef: null,
    entriesCallback: null,

    winnersRef: null,
    winnersCallback: null,

    selectedGiveawayId: "",
    filter: "all",
    search: "",

    formDirty: false,
    saving: false,

    localImage: null,
    draft: createEmptyDraft()
  };

  function createEmptyDraft() {
    return {
      title: "",
      description: "",

      status: "draft",
      publicVisible: true,

      scope: "global",
      tournamentId: "",

      startAt: 0,
      endAt: 0,
      claimDeadlineAt: 0,

      eligibility:
        "all_players",

      winnerSlots: 1,

      rewardType:
        "rg_points",

      rewardQuantity: 100,
      rewardItemId: "",
      rewardLabel: "",
      rewardDetails: "",

      image: "",
      imageUrl: "",
      imagePath: "",
      imageName: "",
      imageType: "",
      imageSize: 0,
      imageWidth: 0,
      imageHeight: 0
    };
  }

  function clean(
    value,
    fallback = ""
  ) {
    return String(
      value == null
        ? fallback
        : value
    ).trim();
  }

  function escapeHtml(value) {
    if (
      state.api &&
      typeof state.api.escapeHtml ===
        "function"
    ) {
      return state.api.escapeHtml(
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

  function showToast(message) {
    if (
      state.api &&
      typeof state.api.showToast ===
        "function"
    ) {
      state.api.showToast(message);
      return;
    }

    console.log(message);
  }

  function isPermissionDenied(error) {
    if (
      state.api &&
      typeof state.api
        .isPermissionDenied ===
        "function"
    ) {
      return state.api
        .isPermissionDenied(error);
    }

    const code =
      clean(
        error?.code
      ).toLowerCase();

    const message =
      clean(
        error?.message
      ).toLowerCase();

    return (
      code.includes("permission") ||
      message.includes("permission")
    );
  }

  function query(selector) {
    return state.content
      ?.querySelector(selector) ||
      null;
  }

  function formatNumber(value) {
    return Number(
      value || 0
    ).toLocaleString();
  }

  function formatBytes(value) {
    const bytes =
      Number(value || 0);

    if (!bytes) {
      return "0 KB";
    }

    if (
      bytes <
      1024 * 1024
    ) {
      return `${Math.max(
        1,
        Math.round(
          bytes / 1024
        )
      )} KB`;
    }

    return `${(
      bytes /
      (
        1024 *
        1024
      )
    ).toFixed(1)} MB`;
  }

  function formatDate(value) {
    const timestamp =
      Number(value || 0);

    if (!timestamp) {
      return "Not set";
    }

    try {
      return new Intl
        .DateTimeFormat(
          "en-US",
          {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit"
          }
        )
        .format(
          new Date(timestamp)
        );
    } catch {
      return "Not set";
    }
  }

  function toDateInput(value) {
    const timestamp =
      Number(value || 0);

    if (!timestamp) {
      return "";
    }

    const date =
      new Date(timestamp);

    const adjusted =
      new Date(
        date.getTime() -
        (
          date.getTimezoneOffset() *
          60000
        )
      );

    return adjusted
      .toISOString()
      .slice(0, 16);
  }

  function fromDateInput(value) {
    const cleanValue =
      clean(value);

    if (!cleanValue) {
      return 0;
    }

    const timestamp =
      new Date(
        cleanValue
      ).getTime();

    return Number.isFinite(
      timestamp
    )
      ? timestamp
      : 0;
  }

  function getStatusLabel(status) {
    return (
      STATUS_LABELS[status] ||
      "Draft"
    );
  }

  function getEligibilityLabel(
    eligibility
  ) {
    return (
      ELIGIBILITY_LABELS[
        eligibility
      ] ||
      "All Signed-In Players"
    );
  }

  function getRewardLabel(type) {
    return (
      REWARD_LABELS[type] ||
      "Custom Reward"
    );
  }

  function getGiveawayImage(
    giveaway
  ) {
    return clean(
      giveaway?.imageUrl ||
      giveaway?.image
    );
  }

  function getEntryCount(id) {
    return Number(
      state.entryCounts[id] ||
      0
    );
  }

  function getWinnerCount(id) {
    return Number(
      state.winnerCounts[id] ||
      0
    );
  }

  function normalizeGiveaway(
    id,
    value
  ) {
    const giveaway =
      value || {};

    const reward =
      giveaway.reward || {};

    return {
      id,

      title:
        clean(
          giveaway.title
        ),

      description:
        clean(
          giveaway.description
        ),

      status:
        clean(
          giveaway.status,
          "draft"
        ),

      publicVisible:
        giveaway.publicVisible !==
        false,

      scope:
        clean(
          giveaway.scope,
          giveaway.tournamentId
            ? "tournament"
            : "global"
        ),

      tournamentId:
        clean(
          giveaway.tournamentId
        ),

      startAt:
        Number(
          giveaway.startAt ||
          0
        ),

      endAt:
        Number(
          giveaway.endAt ||
          0
        ),

      claimDeadlineAt:
        Number(
          giveaway.claimDeadlineAt ||
          0
        ),

      eligibility:
        clean(
          giveaway.eligibility,
          "all_players"
        ),

      winnerSlots:
        Math.max(
          1,
          Number(
            giveaway.winnerSlots ||
            1
          )
        ),

      rewardType:
        clean(
          reward.type ||
          giveaway.rewardType,
          "rg_points"
        ),

      rewardQuantity:
        Math.max(
          1,
          Number(
            reward.quantity ||
            giveaway.rewardQuantity ||
            1
          )
        ),

      rewardItemId:
        clean(
          reward.itemId ||
          giveaway.rewardItemId
        ),

      rewardLabel:
        clean(
          reward.label ||
          giveaway.rewardLabel
        ),

      rewardDetails:
        clean(
          reward.details ||
          giveaway.rewardDetails
        ),

      image:
        clean(
          giveaway.image ||
          giveaway.imageUrl
        ),

      imageUrl:
        clean(
          giveaway.imageUrl ||
          giveaway.image
        ),

      imagePath:
        clean(
          giveaway.imagePath
        ),

      imageName:
        clean(
          giveaway.imageName
        ),

      imageType:
        clean(
          giveaway.imageType
        ),

      imageSize:
        Number(
          giveaway.imageSize ||
          0
        ),

      imageWidth:
        Number(
          giveaway.imageWidth ||
          0
        ),

      imageHeight:
        Number(
          giveaway.imageHeight ||
          0
        ),

      deliveryStatus:
        clean(
          giveaway.deliveryStatus,
          "pending_backend"
        ),

      createdBy:
        clean(
          giveaway.createdBy
        ),

      createdAt:
        Number(
          giveaway.createdAt ||
          0
        ),

      updatedBy:
        clean(
          giveaway.updatedBy
        ),

      updatedAt:
        Number(
          giveaway.updatedAt ||
          0
        ),

      publishedAt:
        Number(
          giveaway.publishedAt ||
          0
        )
    };
  }

  function sortGiveaways(items) {
    return [...items].sort(
      (a, b) => {
        const order = {
          live: 0,
          scheduled: 1,
          paused: 2,
          draft: 3,
          closed: 4
        };

        const statusDifference =
          (
            order[a.status] ??
            99
          ) -
          (
            order[b.status] ??
            99
          );

        if (
          statusDifference !== 0
        ) {
          return statusDifference;
        }

        return (
          Number(
            b.updatedAt ||
            b.createdAt ||
            0
          ) -
          Number(
            a.updatedAt ||
            a.createdAt ||
            0
          )
        );
      }
    );
  }

  function getSelectedGiveaway() {
    if (
      !state.selectedGiveawayId
    ) {
      return null;
    }

    return (
      state.giveaways.find(
        giveaway =>
          giveaway.id ===
          state.selectedGiveawayId
      ) ||
      null
    );
  }

  function setStatus(
    message,
    type = ""
  ) {
    const element =
      query(
        "#nexusGiveawayStatus"
      );

    if (!element) {
      return;
    }

    element.textContent =
      message || "";

    element.className =
      "nexus-giveaway-status";

    if (type) {
      element.classList.add(
        type
      );
    }
  }

  function setButtonLoading(
    button,
    loading,
    text = ""
  ) {
    if (!button) {
      return;
    }

    if (loading) {
      button.dataset
        .originalHtml =
          button.innerHTML;

      button.disabled = true;

      button.innerHTML = `
        <i class="fa-solid fa-spinner fa-spin"></i>
        ${escapeHtml(text)}
      `;

      return;
    }

    button.disabled = false;

    if (
      button.dataset
        .originalHtml
    ) {
      button.innerHTML =
        button.dataset
          .originalHtml;

      delete button.dataset
        .originalHtml;
    }
  }

  function renderShell() {
    state.content.innerHTML = `
      <section class="nexus-giveaways">

        <header class="nexus-giveaway-hero">

          <div>
            <span class="nexus-giveaway-eyebrow">
              Engagement Operations
            </span>

            <h2>
              Giveaways & Rewards
            </h2>

            <p>
              Create public giveaways, configure eligibility and prepare winner rewards without exposing protected player balances or inventory.
            </p>
          </div>

          <button
            class="nexus-giveaway-button primary"
            type="button"
            data-giveaway-action="new"
          >
            <i class="fa-solid fa-plus"></i>
            New Giveaway
          </button>

        </header>

        <div class="nexus-giveaway-security-note">

          <i class="fa-solid fa-shield-halved"></i>

          <div>
            <strong>
              Secure Reward Protection Active
            </strong>

            <span>
              Nexus may create and publish giveaway records, but winner drawing and reward delivery remain locked until the Firebase Function is deployed.
            </span>
          </div>

        </div>

        <section class="nexus-giveaway-metrics">

          <article>
            <span>Total Giveaways</span>
            <strong id="nexusGiveawayMetricTotal">0</strong>
            <small>All private records</small>
          </article>

          <article>
            <span>Live</span>
            <strong id="nexusGiveawayMetricLive">0</strong>
            <small>Currently active</small>
          </article>

          <article>
            <span>Total Entries</span>
            <strong id="nexusGiveawayMetricEntries">0</strong>
            <small>Across all giveaways</small>
          </article>

          <article>
            <span>Pending Delivery</span>
            <strong id="nexusGiveawayMetricPending">0</strong>
            <small>Backend required</small>
          </article>

        </section>

        <section class="nexus-giveaway-workspace">

          <article class="nexus-giveaway-panel nexus-giveaway-editor">

            <header class="nexus-giveaway-panel-head">

              <div>
                <span>Giveaway Editor</span>

                <h3 id="nexusGiveawayEditorTitle">
                  Create New Giveaway
                </h3>
              </div>

              <span
                id="nexusGiveawayEditorMode"
                class="nexus-giveaway-chip draft"
              >
                New
              </span>

            </header>

            <form id="nexusGiveawayForm">

              <div class="nexus-giveaway-form-grid">

                <label class="nexus-giveaway-field full">
                  <span>Giveaway Title</span>

                  <input
                    id="nexusGiveawayTitle"
                    type="text"
                    maxlength="120"
                    placeholder="Summer Elite Crate Giveaway"
                    required
                  >
                </label>

                <label class="nexus-giveaway-field">
                  <span>Status</span>

                  <select id="nexusGiveawayState">
                    <option value="draft">Draft</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="live">Live</option>
                    <option value="paused">Paused</option>
                    <option value="closed">Closed</option>
                  </select>
                </label>

                <label class="nexus-giveaway-field">
                  <span>Scope</span>

                  <select id="nexusGiveawayScope">
                    <option value="global">
                      Global Giveaway
                    </option>

                    <option value="tournament">
                      Active Tournament
                    </option>
                  </select>
                </label>

                <label class="nexus-giveaway-field full">
                  <span>Description</span>

                  <textarea
                    id="nexusGiveawayDescription"
                    maxlength="3000"
                    placeholder="Explain the giveaway, reward, eligibility and important details..."
                    required
                  ></textarea>

                  <small>
                    <b id="nexusGiveawayDescriptionCount">0</b>
                    / 3,000 characters
                  </small>
                </label>

                <label class="nexus-giveaway-field">
                  <span>Starts</span>

                  <input
                    id="nexusGiveawayStart"
                    type="datetime-local"
                  >
                </label>

                <label class="nexus-giveaway-field">
                  <span>Ends</span>

                  <input
                    id="nexusGiveawayEnd"
                    type="datetime-local"
                  >
                </label>

                <label class="nexus-giveaway-field">
                  <span>Claim Deadline</span>

                  <input
                    id="nexusGiveawayClaimDeadline"
                    type="datetime-local"
                  >
                </label>

                <label class="nexus-giveaway-field">
                  <span>Number of Winners</span>

                  <input
                    id="nexusGiveawayWinnerSlots"
                    type="number"
                    min="1"
                    max="100"
                    step="1"
                    value="1"
                  >
                </label>

                <label class="nexus-giveaway-field full">
                  <span>Eligibility</span>

                  <select id="nexusGiveawayEligibility">
                    <option value="all_players">
                      All Signed-In Players
                    </option>

                    <option value="tournament_players">
                      Tournament Participants
                    </option>

                    <option value="checked_in_players">
                      Checked-In Tournament Players
                    </option>

                    <option value="selected_players">
                      Selected Player List
                    </option>
                  </select>
                </label>

              </div>

              <section class="nexus-giveaway-section">

                <div class="nexus-giveaway-section-head">
                  <div>
                    <span>Reward Configuration</span>
                    <h4>Winner Reward</h4>
                  </div>

                  <strong>
                    Delivery Locked
                  </strong>
                </div>

                <div class="nexus-giveaway-form-grid">

                  <label class="nexus-giveaway-field">
                    <span>Reward Type</span>

                    <select id="nexusGiveawayRewardType">
                      <option value="rg_points">
                        RG Points
                      </option>

                      <option value="basic_crate">
                        Basic Crate
                      </option>

                      <option value="rare_crate">
                        Rare Crate
                      </option>

                      <option value="elite_crate">
                        Elite Crate
                      </option>

                      <option value="cosmetic">
                        Profile Cosmetic
                      </option>

                      <option value="custom">
                        Custom Reward
                      </option>
                    </select>
                  </label>

                  <label class="nexus-giveaway-field">
                    <span>Quantity Per Winner</span>

                    <input
                      id="nexusGiveawayRewardQuantity"
                      type="number"
                      min="1"
                      max="1000000"
                      step="1"
                      value="100"
                    >
                  </label>

                  <label class="nexus-giveaway-field">
                    <span>Reward Item ID</span>

                    <input
                      id="nexusGiveawayRewardItemId"
                      type="text"
                      maxlength="120"
                      placeholder="Optional internal item ID"
                    >
                  </label>

                  <label class="nexus-giveaway-field">
                    <span>Public Reward Name</span>

                    <input
                      id="nexusGiveawayRewardLabel"
                      type="text"
                      maxlength="120"
                      placeholder="100 RG Points"
                    >
                  </label>

                  <label class="nexus-giveaway-field full">
                    <span>Reward Details</span>

                    <textarea
                      id="nexusGiveawayRewardDetails"
                      maxlength="1000"
                      placeholder="Optional public details about the reward..."
                    ></textarea>
                  </label>

                </div>

              </section>

              <section class="nexus-giveaway-section">

                <div class="nexus-giveaway-section-head">

                  <div>
                    <span>Promotional Artwork</span>
                    <h4>Giveaway Image</h4>
                  </div>

                  <strong>
                    JPG, PNG or WebP • 8 MB
                  </strong>

                </div>

                <input
                  id="nexusGiveawayImageFile"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  hidden
                >

                <div
                  id="nexusGiveawayImageWorkspace"
                  class="nexus-giveaway-image-workspace"
                ></div>

                <div class="nexus-giveaway-image-actions">

                  <label
                    for="nexusGiveawayImageFile"
                    class="nexus-giveaway-button primary"
                  >
                    <i class="fa-solid fa-images"></i>
                    Choose from Camera Roll
                  </label>

                  <button
                    class="nexus-giveaway-button"
                    type="button"
                    data-giveaway-action="remove-image"
                  >
                    <i class="fa-solid fa-trash"></i>
                    Remove Image
                  </button>

                </div>

              </section>

              <label class="nexus-giveaway-toggle">

                <input
                  id="nexusGiveawayPublicVisible"
                  type="checkbox"
                  checked
                >

                <span>
                  <strong>
                    Public Giveaway
                  </strong>

                  <small>
                    Mirror this record to publicGiveaways when it is not a draft.
                  </small>
                </span>

              </label>

              <div class="nexus-giveaway-save-row">

                <div>
                  <strong>
                    Giveaway Record
                  </strong>

                  <span>
                    Public-safe fields are mirrored separately. Entry records, winners and delivery data remain private.
                  </span>
                </div>

                <button
                  id="nexusGiveawaySaveButton"
                  class="nexus-giveaway-button primary"
                  type="submit"
                >
                  <i class="fa-solid fa-floppy-disk"></i>
                  Save Giveaway
                </button>

              </div>

              <p
                id="nexusGiveawayStatus"
                class="nexus-giveaway-status"
              ></p>

            </form>

          </article>

          <aside class="nexus-giveaway-side-stack">

            <article class="nexus-giveaway-panel nexus-giveaway-preview-panel">

              <header class="nexus-giveaway-panel-head">
                <div>
                  <span>Public Preview</span>
                  <h3>Giveaway Card</h3>
                </div>

                <span class="nexus-giveaway-chip preview">
                  Preview
                </span>
              </header>

              <div
                id="nexusGiveawayPreview"
                class="nexus-giveaway-preview"
              ></div>

            </article>

            <article class="nexus-giveaway-panel nexus-giveaway-backend-panel">

              <header class="nexus-giveaway-panel-head">
                <div>
                  <span>Winner Operations</span>
                  <h3>Secure Delivery</h3>
                </div>

                <span class="nexus-giveaway-chip locked">
                  Locked
                </span>
              </header>

              <div class="nexus-giveaway-backend-stats">

                <div>
                  <span>Entries</span>
                  <strong id="nexusGiveawaySelectedEntries">0</strong>
                </div>

                <div>
                  <span>Winners</span>
                  <strong id="nexusGiveawaySelectedWinners">0</strong>
                </div>

              </div>

              <button
                class="nexus-giveaway-locked-button"
                type="button"
                disabled
              >
                <i class="fa-solid fa-shuffle"></i>
                Draw Winners — Backend Required
              </button>

              <button
                class="nexus-giveaway-locked-button"
                type="button"
                disabled
              >
                <i class="fa-solid fa-gift"></i>
                Deliver Rewards — Backend Required
              </button>

              <p>
                The future callable Function will verify eligibility, choose winners server-side and issue every reward exactly once.
              </p>

            </article>

          </aside>

        </section>

        <section class="nexus-giveaway-panel nexus-giveaway-library-panel">

          <header class="nexus-giveaway-library-head">

            <div>
              <span>Giveaway Library</span>
              <h3>Existing Giveaways</h3>
            </div>

            <div class="nexus-giveaway-library-tools">

              <label class="nexus-giveaway-search">
                <i class="fa-solid fa-magnifying-glass"></i>

                <input
                  id="nexusGiveawaySearch"
                  type="search"
                  placeholder="Search giveaways..."
                >
              </label>

              <select id="nexusGiveawayFilter">
                <option value="all">
                  All Giveaways
                </option>

                <option value="live">
                  Live
                </option>

                <option value="scheduled">
                  Scheduled
                </option>

                <option value="draft">
                  Drafts
                </option>

                <option value="paused">
                  Paused
                </option>

                <option value="closed">
                  Closed
                </option>
              </select>

            </div>

          </header>

          <div
            id="nexusGiveawayLibrary"
            class="nexus-giveaway-library"
          >
            <div class="nexus-giveaway-empty">
              <i class="fa-solid fa-spinner fa-spin"></i>
              <strong>Loading Giveaways</strong>
            </div>
          </div>

        </section>

      </section>
    `;

    fillForm();
    renderImageWorkspace();
    renderPreview();
    renderMetrics();
    renderLibrary();
    renderSelectedCounts();
  }

  function fillForm() {
    const draft =
      state.draft;

    const values = {
      "#nexusGiveawayTitle":
        draft.title,

      "#nexusGiveawayDescription":
        draft.description,

      "#nexusGiveawayState":
        draft.status,

      "#nexusGiveawayScope":
        draft.scope,

      "#nexusGiveawayStart":
        toDateInput(
          draft.startAt
        ),

      "#nexusGiveawayEnd":
        toDateInput(
          draft.endAt
        ),

      "#nexusGiveawayClaimDeadline":
        toDateInput(
          draft.claimDeadlineAt
        ),

      "#nexusGiveawayWinnerSlots":
        draft.winnerSlots,

      "#nexusGiveawayEligibility":
        draft.eligibility,

      "#nexusGiveawayRewardType":
        draft.rewardType,

      "#nexusGiveawayRewardQuantity":
        draft.rewardQuantity,

      "#nexusGiveawayRewardItemId":
        draft.rewardItemId,

      "#nexusGiveawayRewardLabel":
        draft.rewardLabel,

      "#nexusGiveawayRewardDetails":
        draft.rewardDetails
    };

    Object.entries(
      values
    ).forEach(
      ([
        selector,
        value
      ]) => {
        const element =
          query(selector);

        if (element) {
          element.value =
            value ?? "";
        }
      }
    );

    const publicVisible =
      query(
        "#nexusGiveawayPublicVisible"
      );

    if (publicVisible) {
      publicVisible.checked =
        draft.publicVisible !==
        false;
    }

    updateEditorLabels();
    updateDescriptionCount();
  }

  function syncDraftFromForm() {
    state.draft.title =
      clean(
        query(
          "#nexusGiveawayTitle"
        )?.value
      );

    state.draft.description =
      clean(
        query(
          "#nexusGiveawayDescription"
        )?.value
      );

    state.draft.status =
      clean(
        query(
          "#nexusGiveawayState"
        )?.value,
        "draft"
      );

    state.draft.scope =
      clean(
        query(
          "#nexusGiveawayScope"
        )?.value,
        "global"
      );

    state.draft.tournamentId =
      state.draft.scope ===
      "tournament"
        ? state.activeTournamentId
        : "";

    state.draft.startAt =
      fromDateInput(
        query(
          "#nexusGiveawayStart"
        )?.value
      );

    state.draft.endAt =
      fromDateInput(
        query(
          "#nexusGiveawayEnd"
        )?.value
      );

    state.draft.claimDeadlineAt =
      fromDateInput(
        query(
          "#nexusGiveawayClaimDeadline"
        )?.value
      );

    state.draft.winnerSlots =
      Math.max(
        1,
        Math.min(
          100,
          Number(
            query(
              "#nexusGiveawayWinnerSlots"
            )?.value ||
            1
          )
        )
      );

    state.draft.eligibility =
      clean(
        query(
          "#nexusGiveawayEligibility"
        )?.value,
        "all_players"
      );

    state.draft.rewardType =
      clean(
        query(
          "#nexusGiveawayRewardType"
        )?.value,
        "rg_points"
      );

    state.draft.rewardQuantity =
      Math.max(
        1,
        Number(
          query(
            "#nexusGiveawayRewardQuantity"
          )?.value ||
          1
        )
      );

    state.draft.rewardItemId =
      clean(
        query(
          "#nexusGiveawayRewardItemId"
        )?.value
      );

    state.draft.rewardLabel =
      clean(
        query(
          "#nexusGiveawayRewardLabel"
        )?.value
      );

    state.draft.rewardDetails =
      clean(
        query(
          "#nexusGiveawayRewardDetails"
        )?.value
      );

    state.draft.publicVisible =
      Boolean(
        query(
          "#nexusGiveawayPublicVisible"
        )?.checked
      );
  }

  function updateEditorLabels() {
    const editing =
      Boolean(
        state.selectedGiveawayId
      );

    const title =
      query(
        "#nexusGiveawayEditorTitle"
      );

    const mode =
      query(
        "#nexusGiveawayEditorMode"
      );

    if (title) {
      title.textContent =
        editing
          ? "Edit Giveaway"
          : "Create New Giveaway";
    }

    if (mode) {
      mode.textContent =
        editing
          ? "Editing"
          : "New";

      mode.className =
        `nexus-giveaway-chip ${
          editing
            ? "editing"
            : "draft"
        }`;
    }
  }

  function updateDescriptionCount() {
    const element =
      query(
        "#nexusGiveawayDescriptionCount"
      );

    if (element) {
      element.textContent =
        formatNumber(
          state.draft
            .description
            .length
        );
    }
  }

  function renderMetrics() {
    const total =
      state.giveaways.length;

    const live =
      state.giveaways.filter(
        giveaway =>
          giveaway.status ===
          "live"
      ).length;

    const entries =
      Object.values(
        state.entryCounts
      ).reduce(
        (
          totalCount,
          value
        ) =>
          totalCount +
          Number(value || 0),
        0
      );

    const pending =
      state.giveaways.filter(
        giveaway =>
          giveaway.status ===
            "closed" &&
          (
            getWinnerCount(
              giveaway.id
            ) <
            giveaway.winnerSlots ||
            giveaway.deliveryStatus !==
              "delivered"
          )
      ).length;

    const values = {
      "#nexusGiveawayMetricTotal":
        total,

      "#nexusGiveawayMetricLive":
        live,

      "#nexusGiveawayMetricEntries":
        entries,

      "#nexusGiveawayMetricPending":
        pending
    };

    Object.entries(
      values
    ).forEach(
      ([
        selector,
        value
      ]) => {
        const element =
          query(selector);

        if (element) {
          element.textContent =
            formatNumber(value);
        }
      }
    );
  }

  function renderSelectedCounts() {
    const giveawayId =
      state.selectedGiveawayId;

    const entries =
      giveawayId
        ? getEntryCount(
            giveawayId
          )
        : 0;

    const winners =
      giveawayId
        ? getWinnerCount(
            giveawayId
          )
        : 0;

    const entriesElement =
      query(
        "#nexusGiveawaySelectedEntries"
      );

    const winnersElement =
      query(
        "#nexusGiveawaySelectedWinners"
      );

    if (entriesElement) {
      entriesElement.textContent =
        formatNumber(entries);
    }

    if (winnersElement) {
      winnersElement.textContent =
        formatNumber(winners);
    }
  }

  function renderPreview() {
    const container =
      query(
        "#nexusGiveawayPreview"
      );

    if (!container) {
      return;
    }

    const draft =
      state.draft;

    const imageUrl =
      state.localImage
        ?.objectUrl ||
      clean(
        draft.imageUrl ||
        draft.image
      );

    const rewardName =
      draft.rewardLabel ||
      (
        draft.rewardType ===
        "rg_points"
          ? `${formatNumber(
              draft.rewardQuantity
            )} RG Points`
          : `${formatNumber(
              draft.rewardQuantity
            )} × ${getRewardLabel(
              draft.rewardType
            )}`
      );

    container.innerHTML = `
      <article class="nexus-giveaway-public-card">

        <div class="nexus-giveaway-public-image ${
          imageUrl
            ? ""
            : "empty"
        }">
          ${
            imageUrl
              ? `
                <img
                  src="${escapeHtml(imageUrl)}"
                  alt="${escapeHtml(
                    draft.title ||
                    "Giveaway artwork"
                  )}"
                >
              `
              : `
                <i class="fa-solid fa-gift"></i>
              `
          }
        </div>

        <div class="nexus-giveaway-public-content">

          <div class="nexus-giveaway-public-meta">

            <span class="nexus-giveaway-status-chip ${escapeHtml(
              draft.status
            )}">
              ${escapeHtml(
                getStatusLabel(
                  draft.status
                )
              )}
            </span>

            <span>
              ${formatNumber(
                draft.winnerSlots
              )}
              ${
                draft.winnerSlots ===
                1
                  ? "Winner"
                  : "Winners"
              }
            </span>

          </div>

          <h3>
            ${escapeHtml(
              draft.title ||
              "Giveaway Title"
            )}
          </h3>

          <p>
            ${escapeHtml(
              draft.description ||
              "Your public giveaway description will appear here."
            ).replaceAll(
              "\n",
              "<br>"
            )}
          </p>

          <div class="nexus-giveaway-reward-preview">

            <i class="fa-solid fa-gift"></i>

            <div>
              <span>Reward Per Winner</span>
              <strong>
                ${escapeHtml(
                  rewardName
                )}
              </strong>
            </div>

          </div>

          <div class="nexus-giveaway-preview-details">

            <div>
              <span>Eligibility</span>

              <strong>
                ${escapeHtml(
                  getEligibilityLabel(
                    draft.eligibility
                  )
                )}
              </strong>
            </div>

            <div>
              <span>Ends</span>

              <strong>
                ${escapeHtml(
                  formatDate(
                    draft.endAt
                  )
                )}
              </strong>
            </div>

          </div>

          <button
            type="button"
            disabled
          >
            Entry Page Coming Later
          </button>

        </div>

      </article>
    `;
  }

  function renderImageWorkspace() {
    const container =
      query(
        "#nexusGiveawayImageWorkspace"
      );

    if (!container) {
      return;
    }

    if (state.localImage) {
      const image =
        state.localImage;

      container.innerHTML = `
        <div class="nexus-giveaway-image-preview">

          <img
            src="${escapeHtml(
              image.objectUrl
            )}"
            alt="Selected giveaway artwork"
          >

          <div>
            <span class="nexus-giveaway-image-state ready">
              Ready to Upload
            </span>

            <strong>
              ${escapeHtml(
                image.file.name
              )}
            </strong>

            <small>
              ${escapeHtml(
                image.file.type
              )}
              •
              ${escapeHtml(
                formatBytes(
                  image.file.size
                )
              )}
              ${
                image.width &&
                image.height
                  ? ` • ${image.width} × ${image.height}`
                  : ""
              }
            </small>

            <p>
              The image will upload when the giveaway is saved.
            </p>
          </div>

        </div>
      `;

      return;
    }

    const imageUrl =
      clean(
        state.draft.imageUrl ||
        state.draft.image
      );

    if (imageUrl) {
      container.innerHTML = `
        <div class="nexus-giveaway-image-preview">

          <img
            src="${escapeHtml(imageUrl)}"
            alt="Existing giveaway artwork"
          >

          <div>
            <span class="nexus-giveaway-image-state uploaded">
              Uploaded Artwork
            </span>

            <strong>
              ${escapeHtml(
                state.draft.imageName ||
                "Giveaway Image"
              )}
            </strong>

            <small>
              ${
                state.draft.imageWidth &&
                state.draft.imageHeight
                  ? `${state.draft.imageWidth} × ${state.draft.imageHeight}`
                  : "Firebase Storage image"
              }
            </small>

            <p>
              This image is currently connected to the giveaway.
            </p>
          </div>

        </div>
      `;

      return;
    }

    container.innerHTML = `
      <div class="nexus-giveaway-image-empty">

        <i class="fa-solid fa-image"></i>

        <strong>
          No Artwork Selected
        </strong>

        <span>
          Add promotional artwork from your Camera Roll.
        </span>

      </div>
    `;
  }

  function getVisibleGiveaways() {
    const search =
      state.search
        .toLowerCase();

    return sortGiveaways(
      state.giveaways.filter(
        giveaway => {
          if (
            state.filter !==
              "all" &&
            giveaway.status !==
              state.filter
          ) {
            return false;
          }

          if (!search) {
            return true;
          }

          const searchable = [
            giveaway.title,
            giveaway.description,
            giveaway.rewardLabel,
            getRewardLabel(
              giveaway.rewardType
            ),
            getEligibilityLabel(
              giveaway.eligibility
            )
          ]
            .join(" ")
            .toLowerCase();

          return searchable
            .includes(search);
        }
      )
    );
  }

  function renderLibrary() {
    const container =
      query(
        "#nexusGiveawayLibrary"
      );

    if (!container) {
      return;
    }

    const giveaways =
      getVisibleGiveaways();

    if (!giveaways.length) {
      container.innerHTML = `
        <div class="nexus-giveaway-empty">

          <i class="fa-solid fa-gift"></i>

          <strong>
            No Matching Giveaways
          </strong>

          <span>
            Create a giveaway or change the current filters.
          </span>

        </div>
      `;

      return;
    }

    container.innerHTML =
      giveaways
        .map(
          giveaway => {
            const image =
              getGiveawayImage(
                giveaway
              );

            const entries =
              getEntryCount(
                giveaway.id
              );

            const winners =
              getWinnerCount(
                giveaway.id
              );

            const rewardName =
              giveaway.rewardLabel ||
              (
                giveaway.rewardType ===
                "rg_points"
                  ? `${formatNumber(
                      giveaway.rewardQuantity
                    )} RG Points`
                  : `${formatNumber(
                      giveaway.rewardQuantity
                    )} × ${getRewardLabel(
                      giveaway.rewardType
                    )}`
              );

            return `
              <article class="nexus-giveaway-library-item">

                <div class="nexus-giveaway-library-image ${
                  image
                    ? ""
                    : "empty"
                }">
                  ${
                    image
                      ? `
                        <img
                          src="${escapeHtml(image)}"
                          alt="${escapeHtml(
                            giveaway.title
                          )}"
                        >
                      `
                      : `
                        <i class="fa-solid fa-gift"></i>
                      `
                  }
                </div>

                <div class="nexus-giveaway-library-main">

                  <div class="nexus-giveaway-library-meta">

                    <span class="nexus-giveaway-status-chip ${escapeHtml(
                      giveaway.status
                    )}">
                      ${escapeHtml(
                        getStatusLabel(
                          giveaway.status
                        )
                      )}
                    </span>

                    ${
                      giveaway.publicVisible &&
                      giveaway.status !==
                        "draft"
                        ? `
                          <span class="nexus-giveaway-public-chip">
                            Public
                          </span>
                        `
                        : ""
                    }

                  </div>

                  <h4>
                    ${escapeHtml(
                      giveaway.title ||
                      "Untitled Giveaway"
                    )}
                  </h4>

                  <p>
                    ${escapeHtml(
                      giveaway.description
                        .slice(
                          0,
                          160
                        )
                    )}
                    ${
                      giveaway.description
                        .length >
                      160
                        ? "..."
                        : ""
                    }
                  </p>

                  <div class="nexus-giveaway-library-stats">

                    <span>
                      <i class="fa-solid fa-gift"></i>
                      ${escapeHtml(
                        rewardName
                      )}
                    </span>

                    <span>
                      <i class="fa-solid fa-ticket"></i>
                      ${formatNumber(
                        entries
                      )}
                      Entries
                    </span>

                    <span>
                      <i class="fa-solid fa-crown"></i>
                      ${formatNumber(
                        winners
                      )}
                      /
                      ${formatNumber(
                        giveaway.winnerSlots
                      )}
                      Winners
                    </span>

                    <span>
                      <i class="fa-solid fa-clock"></i>
                      ${escapeHtml(
                        formatDate(
                          giveaway.endAt
                        )
                      )}
                    </span>

                  </div>

                </div>

                <div class="nexus-giveaway-library-actions">

                  <button
                    type="button"
                    data-giveaway-action="edit"
                    data-giveaway-id="${escapeHtml(
                      giveaway.id
                    )}"
                  >
                    <i class="fa-solid fa-pen"></i>
                    Edit
                  </button>

                  ${
                    giveaway.status ===
                      "live"
                      ? `
                        <button
                          type="button"
                          data-giveaway-action="pause"
                          data-giveaway-id="${escapeHtml(
                            giveaway.id
                          )}"
                        >
                          <i class="fa-solid fa-pause"></i>
                          Pause
                        </button>
                      `
                      : (
                        giveaway.status ===
                          "scheduled" ||
                        giveaway.status ===
                          "paused"
                          ? `
                            <button
                              type="button"
                              data-giveaway-action="start"
                              data-giveaway-id="${escapeHtml(
                                giveaway.id
                              )}"
                            >
                              <i class="fa-solid fa-play"></i>
                              ${
                                giveaway.status ===
                                "paused"
                                  ? "Resume"
                                  : "Start"
                              }
                            </button>
                          `
                          : ""
                      )
                  }

                  ${
                    giveaway.status !==
                      "closed"
                      ? `
                        <button
                          type="button"
                          data-giveaway-action="close"
                          data-giveaway-id="${escapeHtml(
                            giveaway.id
                          )}"
                        >
                          <i class="fa-solid fa-flag-checkered"></i>
                          Close
                        </button>
                      `
                      : ""
                  }

                  <button
                    class="danger"
                    type="button"
                    data-giveaway-action="delete"
                    data-giveaway-id="${escapeHtml(
                      giveaway.id
                    )}"
                  >
                    <i class="fa-solid fa-trash"></i>
                    Delete
                  </button>

                </div>

              </article>
            `;
          }
        )
        .join("");
  }

  function releaseLocalImage() {
    if (
      state.localImage
        ?.objectUrl
    ) {
      URL.revokeObjectURL(
        state.localImage
          .objectUrl
      );
    }

    state.localImage =
      null;

    const input =
      query(
        "#nexusGiveawayImageFile"
      );

    if (input) {
      input.value = "";
    }
  }

  function getImageDimensions(
    objectUrl
  ) {
    return new Promise(
      resolve => {
        const image =
          new Image();

        image.onload = () => {
          resolve({
            width:
              Number(
                image.naturalWidth ||
                0
              ),

            height:
              Number(
                image.naturalHeight ||
                0
              )
          });
        };

        image.onerror = () => {
          resolve({
            width: 0,
            height: 0
          });
        };

        image.src =
          objectUrl;
      }
    );
  }

  function isAllowedImage(file) {
    if (!file) {
      return false;
    }

    if (
      ALLOWED_IMAGE_TYPES.has(
        clean(
          file.type
        ).toLowerCase()
      )
    ) {
      return true;
    }

    const extension =
      clean(
        file.name
      )
        .toLowerCase()
        .split(".")
        .pop();

    return [
      "jpg",
      "jpeg",
      "png",
      "webp"
    ].includes(extension);
  }

  async function selectLocalImage(file) {
    if (!file) {
      return;
    }

    if (!isAllowedImage(file)) {
      setStatus(
        "Select a JPG, PNG or WebP image.",
        "error"
      );

      showToast(
        "Unsupported image format."
      );

      return;
    }

    if (
      file.size >
      MAX_IMAGE_BYTES
    ) {
      setStatus(
        "Choose an image smaller than 8 MB.",
        "error"
      );

      showToast(
        "The image exceeds the 8 MB limit."
      );

      return;
    }

    releaseLocalImage();

    const objectUrl =
      URL.createObjectURL(file);

    const dimensions =
      await getImageDimensions(
        objectUrl
      );

    state.localImage = {
      file,
      objectUrl,
      width:
        dimensions.width,
      height:
        dimensions.height
    };

    state.formDirty = true;

    renderImageWorkspace();
    renderPreview();

    setStatus(
      "Artwork ready. It will upload when the giveaway is saved.",
      "success"
    );
  }

  function removeImage() {
    releaseLocalImage();

    state.draft.image = "";
    state.draft.imageUrl = "";
    state.draft.imagePath = "";
    state.draft.imageName = "";
    state.draft.imageType = "";
    state.draft.imageSize = 0;
    state.draft.imageWidth = 0;
    state.draft.imageHeight = 0;

    state.formDirty = true;

    renderImageWorkspace();
    renderPreview();

    setStatus(
      "Giveaway artwork removed.",
      "success"
    );
  }

  function sanitizeFileName(file) {
    const rawName =
      clean(
        file?.name,
        "giveaway-artwork"
      );

    const mimeType =
      clean(
        file?.type
      ).toLowerCase();

    let extension =
      rawName
        .toLowerCase()
        .split(".")
        .pop();

    if (
      extension === "jpeg"
    ) {
      extension = "jpg";
    }

    if (
      ![
        "jpg",
        "png",
        "webp"
      ].includes(extension)
    ) {
      if (
        mimeType ===
        "image/png"
      ) {
        extension = "png";
      } else if (
        mimeType ===
        "image/webp"
      ) {
        extension = "webp";
      } else {
        extension = "jpg";
      }
    }

    const baseName =
      rawName
        .replace(
          /\.[^.]+$/,
          ""
        )
        .toLowerCase()
        .replace(
          /[^a-z0-9]+/g,
          "-"
        )
        .replace(
          /^-+|-+$/g,
          ""
        )
        .slice(0, 60) ||
      "giveaway-artwork";

    return `${baseName}.${extension}`;
  }

  function uploadArtwork(
    giveawayId
  ) {
    return new Promise(
      (
        resolve,
        reject
      ) => {
        const localImage =
          state.localImage;

        if (
          !localImage?.file
        ) {
          resolve(null);
          return;
        }

        if (!state.storage) {
          reject(
            new Error(
              "Firebase Storage is not initialized."
            )
          );

          return;
        }

        const file =
          localImage.file;

        const path =
          `giveaway-artwork/${giveawayId}/` +
          `${Date.now()}-` +
          sanitizeFileName(file);

        const storageRef =
          state.storage.ref(path);

        const uploadTask =
          storageRef.put(
            file,
            {
              contentType:
                file.type,

              customMetadata: {
                giveawayId:
                  String(
                    giveawayId
                  ),

                uploadedBy:
                  state.currentUser
                    ?.uid ||
                  ""
              }
            }
          );

        uploadTask.on(
          "state_changed",

          snapshot => {
            const total =
              Number(
                snapshot.totalBytes ||
                0
              );

            const transferred =
              Number(
                snapshot.bytesTransferred ||
                0
              );

            const progress =
              total > 0
                ? Math.round(
                    (
                      transferred /
                      total
                    ) *
                    100
                  )
                : 0;

            setStatus(
              `Uploading artwork: ${progress}%`,
              "info"
            );
          },

          error => {
            reject(error);
          },

          async () => {
            try {
              const url =
                await uploadTask
                  .snapshot
                  .ref
                  .getDownloadURL();

              resolve({
                url,
                path,

                name:
                  clean(
                    file.name
                  ),

                type:
                  clean(
                    file.type
                  ),

                size:
                  Number(
                    file.size ||
                    0
                  ),

                width:
                  Number(
                    localImage.width ||
                    0
                  ),

                height:
                  Number(
                    localImage.height ||
                    0
                  )
              });
            } catch (error) {
              reject(error);
            }
          }
        );
      }
    );
  }

  async function deleteArtwork(pathValue) {
    const path =
      clean(pathValue);

    if (
      !path ||
      !path.startsWith(
        "giveaway-artwork/"
      ) ||
      !state.storage
    ) {
      return;
    }

    try {
      await state.storage
        .ref(path)
        .delete();
    } catch (error) {
      const code =
        clean(
          error?.code
        ).toLowerCase();

      if (
        code !==
        "storage/object-not-found"
      ) {
        console.warn(
          "Giveaway artwork could not be deleted:",
          error
        );
      }
    }
  }

  function validateDraft() {
    const draft =
      state.draft;

    if (!draft.title) {
      return "Enter a giveaway title.";
    }

    if (!draft.description) {
      return "Enter a giveaway description.";
    }

    if (
      draft.winnerSlots <
      1 ||
      draft.winnerSlots >
      100
    ) {
      return "Winner count must be between 1 and 100.";
    }

    if (
      draft.rewardQuantity <
      1
    ) {
      return "Reward quantity must be at least 1.";
    }

    if (
      draft.status !==
      "draft"
    ) {
      if (
        !draft.startAt ||
        !draft.endAt
      ) {
        return "Scheduled and public giveaways need a start and end time.";
      }

      if (
        draft.endAt <=
        draft.startAt
      ) {
        return "The giveaway end time must be after its start time.";
      }
    }

    if (
      draft.claimDeadlineAt &&
      draft.endAt &&
      draft.claimDeadlineAt <
        draft.endAt
    ) {
      return "The claim deadline cannot be before the giveaway ends.";
    }

    return "";
  }

  function buildPublicRecord(
    privateRecord
  ) {
    return {
      title:
        privateRecord.title,

      description:
        privateRecord.description,

      status:
        privateRecord.status,

      scope:
        privateRecord.scope,

      tournamentId:
        privateRecord.tournamentId,

      startAt:
        privateRecord.startAt,

      endAt:
        privateRecord.endAt,

      claimDeadlineAt:
        privateRecord.claimDeadlineAt,

      eligibility:
        privateRecord.eligibility,

      winnerSlots:
        privateRecord.winnerSlots,

      reward: {
        type:
          privateRecord.reward.type,

        quantity:
          privateRecord.reward.quantity,

        itemId:
          privateRecord.reward.itemId,

        label:
          privateRecord.reward.label,

        details:
          privateRecord.reward.details
      },

      image:
        privateRecord.image,

      imageUrl:
        privateRecord.imageUrl,

      entryCount:
        privateRecord.entryCount,

      createdAt:
        privateRecord.createdAt,

      updatedAt:
        privateRecord.updatedAt,

      publishedAt:
        privateRecord.publishedAt
    };
  }

  async function saveGiveaway(button) {
    if (state.saving) {
      return;
    }

    syncDraftFromForm();

    const validationError =
      validateDraft();

    if (validationError) {
      setStatus(
        validationError,
        "error"
      );

      showToast(
        validationError
      );

      return;
    }

    const editing =
      Boolean(
        state.selectedGiveawayId
      );

    const existing =
      getSelectedGiveaway();

    const ref =
      editing
        ? state.database.ref(
            `giveaways/${state.selectedGiveawayId}`
          )
        : state.database
            .ref("giveaways")
            .push();

    const giveawayId =
      editing
        ? state.selectedGiveawayId
        : ref.key;

    if (!giveawayId) {
      setStatus(
        "Nexus could not create a giveaway ID.",
        "error"
      );

      return;
    }

    state.saving = true;

    setButtonLoading(
      button,
      true,
      state.localImage
        ? "Uploading Artwork..."
        : "Saving..."
    );

    let uploadedImage =
      null;

    try {
      if (state.localImage) {
        uploadedImage =
          await uploadArtwork(
            giveawayId
          );
      }

      const existingImageUrl =
        getGiveawayImage(
          existing
        );

      const finalImageUrl =
        uploadedImage?.url ||
        clean(
          state.draft.imageUrl ||
          state.draft.image
        );

      const preservingExisting =
        Boolean(
          !uploadedImage &&
          existing &&
          finalImageUrl &&
          finalImageUrl ===
            existingImageUrl
        );

      const finalImagePath =
        uploadedImage
          ? uploadedImage.path
          : (
              preservingExisting
                ? existing.imagePath
                : ""
            );

      const timestamp =
        firebase.database
          .ServerValue
          .TIMESTAMP;

      const becamePublic =
        state.draft.status !==
          "draft" &&
        (
          !existing ||
          existing.status ===
            "draft"
        );

      const privateRecord = {
        title:
          state.draft.title,

        description:
          state.draft.description,

        status:
          state.draft.status,

        publicVisible:
          state.draft.publicVisible,

        scope:
          state.draft.scope,

        tournamentId:
          state.draft.scope ===
          "tournament"
            ? state.activeTournamentId
            : "",

        startAt:
          state.draft.startAt ||
          null,

        endAt:
          state.draft.endAt ||
          null,

        claimDeadlineAt:
          state.draft
            .claimDeadlineAt ||
          null,

        eligibility:
          state.draft.eligibility,

        winnerSlots:
          state.draft.winnerSlots,

        reward: {
          type:
            state.draft.rewardType,

          quantity:
            state.draft.rewardQuantity,

          itemId:
            state.draft.rewardItemId,

          label:
            state.draft.rewardLabel,

          details:
            state.draft.rewardDetails
        },

        image:
          finalImageUrl,

        imageUrl:
          finalImageUrl,

        imagePath:
          finalImagePath,

        imageName:
          uploadedImage
            ?.name ||
          (
            preservingExisting
              ? existing.imageName
              : ""
          ),

        imageType:
          uploadedImage
            ?.type ||
          (
            preservingExisting
              ? existing.imageType
              : ""
          ),

        imageSize:
          uploadedImage
            ?.size ||
          (
            preservingExisting
              ? existing.imageSize
              : 0
          ),

        imageWidth:
          uploadedImage
            ?.width ||
          (
            preservingExisting
              ? existing.imageWidth
              : 0
          ),

        imageHeight:
          uploadedImage
            ?.height ||
          (
            preservingExisting
              ? existing.imageHeight
              : 0
          ),

        entryCount:
          getEntryCount(
            giveawayId
          ),

        selectedWinnerCount:
          getWinnerCount(
            giveawayId
          ),

        deliveryStatus:
          existing
            ?.deliveryStatus ||
          "pending_backend",

        createdBy:
          existing
            ?.createdBy ||
          state.currentUser
            ?.uid ||
          "",

        createdAt:
          existing
            ?.createdAt ||
          timestamp,

        updatedBy:
          state.currentUser
            ?.uid ||
          "",

        updatedAt:
          timestamp,

        publishedAt:
          becamePublic
            ? timestamp
            : (
                existing
                  ?.publishedAt ||
                (
                  state.draft.status !==
                    "draft"
                    ? timestamp
                    : null
                )
              )
      };

      const shouldBePublic =
        state.draft.publicVisible &&
        state.draft.status !==
          "draft";

      const updates = {
        [`giveaways/${giveawayId}`]:
          privateRecord,

        [`publicGiveaways/${giveawayId}`]:
          shouldBePublic
            ? buildPublicRecord(
                privateRecord
              )
            : null
      };

      await state.database
        .ref()
        .update(updates);

      const previousImagePath =
        clean(
          existing?.imagePath
        );

      if (
        previousImagePath &&
        previousImagePath !==
          finalImagePath
      ) {
        await deleteArtwork(
          previousImagePath
        );
      }

      state.formDirty = false;

      const message =
        editing
          ? "Giveaway updated."
          : "Giveaway created.";

      showToast(message);

      resetEditor(true);

      setStatus(
        message,
        "success"
      );
    } catch (error) {
      if (
        uploadedImage?.path
      ) {
        await deleteArtwork(
          uploadedImage.path
        );
      }

      console.error(
        "Giveaway save failed:",
        error
      );

      const code =
        clean(
          error?.code
        ).toLowerCase();

      let message =
        error?.message ||
        "The giveaway could not be saved.";

      if (
        code.includes(
          "storage/unauthorized"
        )
      ) {
        message =
          "Firebase Storage denied the artwork upload. The current Storage Rules only allow the owner account.";
      } else if (
        isPermissionDenied(
          error
        )
      ) {
        message =
          "Firebase rules blocked the giveaway save.";
      }

      showToast(message);

      setStatus(
        message,
        "error"
      );
    } finally {
      state.saving = false;

      setButtonLoading(
        button,
        false
      );

      updateEditorLabels();
    }
  }

  async function updateGiveawayStatus(
    giveawayId,
    newStatus,
    button
  ) {
    const giveaway =
      state.giveaways.find(
        item =>
          item.id ===
          giveawayId
      );

    if (!giveaway) {
      return;
    }

    if (
      newStatus ===
      "live" &&
      (
        !giveaway.startAt ||
        !giveaway.endAt
      )
    ) {
      showToast(
        "Add a start and end time before starting this giveaway."
      );

      return;
    }

    setButtonLoading(
      button,
      true,
      newStatus === "live"
        ? "Starting..."
        : (
            newStatus ===
              "paused"
              ? "Pausing..."
              : "Closing..."
          )
    );

    try {
      const timestamp =
        firebase.database
          .ServerValue
          .TIMESTAMP;

      const updated = {
        ...giveaway,
        status:
          newStatus,
        updatedAt:
          timestamp,
        updatedBy:
          state.currentUser
            ?.uid ||
          ""
      };

      const privateUpdate = {
        status:
          newStatus,

        updatedAt:
          timestamp,

        updatedBy:
          state.currentUser
            ?.uid ||
          ""
      };

      const publicRecord =
        giveaway.publicVisible
          ? buildPublicRecord(
              updated
            )
          : null;

      await state.database
        .ref()
        .update({
          [`giveaways/${giveawayId}/status`]:
            privateUpdate.status,

          [`giveaways/${giveawayId}/updatedAt`]:
            privateUpdate.updatedAt,

          [`giveaways/${giveawayId}/updatedBy`]:
            privateUpdate.updatedBy,

          [`publicGiveaways/${giveawayId}`]:
            publicRecord
        });

      showToast(
        newStatus === "live"
          ? "Giveaway is now live."
          : (
              newStatus ===
                "paused"
                ? "Giveaway paused."
                : "Giveaway closed."
            )
      );
    } catch (error) {
      console.error(
        "Giveaway status update failed:",
        error
      );

      showToast(
        isPermissionDenied(error)
          ? "Firebase rules blocked the status update."
          : "The giveaway status could not be changed."
      );
    } finally {
      setButtonLoading(
        button,
        false
      );
    }
  }

  async function deleteGiveaway(
    giveawayId,
    button
  ) {
    const giveaway =
      state.giveaways.find(
        item =>
          item.id ===
          giveawayId
      );

    if (!giveaway) {
      return;
    }

    const confirmed =
      window.confirm(
        `Delete "${giveaway.title || "this giveaway"}"?\n\n` +
        "Its public record, entry records and winner records will also be removed."
      );

    if (!confirmed) {
      return;
    }

    setButtonLoading(
      button,
      true,
      "Deleting..."
    );

    try {
      await state.database
        .ref()
        .update({
          [`giveaways/${giveawayId}`]:
            null,

          [`publicGiveaways/${giveawayId}`]:
            null,

          [`giveawayEntries/${giveawayId}`]:
            null,

          [`giveawayWinners/${giveawayId}`]:
            null
        });

      await deleteArtwork(
        giveaway.imagePath
      );

      if (
        state.selectedGiveawayId ===
        giveawayId
      ) {
        resetEditor(true);
      }

      showToast(
        "Giveaway deleted."
      );
    } catch (error) {
      console.error(
        "Giveaway deletion failed:",
        error
      );

      showToast(
        isPermissionDenied(error)
          ? "Firebase rules blocked the deletion."
          : "The giveaway could not be deleted."
      );
    } finally {
      setButtonLoading(
        button,
        false
      );
    }
  }

  function confirmDiscardChanges() {
    if (!state.formDirty) {
      return true;
    }

    return window.confirm(
      "Discard the unsaved giveaway changes?"
    );
  }

  function resetEditor(
    skipConfirmation = false
  ) {
    if (
      !skipConfirmation &&
      !confirmDiscardChanges()
    ) {
      return;
    }

    releaseLocalImage();

    state.selectedGiveawayId =
      "";

    state.draft =
      createEmptyDraft();

    state.draft.tournamentId =
      state.activeTournamentId;

    state.formDirty = false;

    fillForm();
    renderImageWorkspace();
    renderPreview();
    renderSelectedCounts();

    setStatus("");
  }

  function editGiveaway(
    giveawayId
  ) {
    const giveaway =
      state.giveaways.find(
        item =>
          item.id ===
          giveawayId
      );

    if (!giveaway) {
      showToast(
        "That giveaway could not be found."
      );

      return;
    }

    if (
      !confirmDiscardChanges()
    ) {
      return;
    }

    releaseLocalImage();

    state.selectedGiveawayId =
      giveaway.id;

    state.draft = {
      title:
        giveaway.title,

      description:
        giveaway.description,

      status:
        giveaway.status,

      publicVisible:
        giveaway.publicVisible,

      scope:
        giveaway.scope,

      tournamentId:
        giveaway.tournamentId,

      startAt:
        giveaway.startAt,

      endAt:
        giveaway.endAt,

      claimDeadlineAt:
        giveaway.claimDeadlineAt,

      eligibility:
        giveaway.eligibility,

      winnerSlots:
        giveaway.winnerSlots,

      rewardType:
        giveaway.rewardType,

      rewardQuantity:
        giveaway.rewardQuantity,

      rewardItemId:
        giveaway.rewardItemId,

      rewardLabel:
        giveaway.rewardLabel,

      rewardDetails:
        giveaway.rewardDetails,

      image:
        giveaway.image,

      imageUrl:
        giveaway.imageUrl,

      imagePath:
        giveaway.imagePath,

      imageName:
        giveaway.imageName,

      imageType:
        giveaway.imageType,

      imageSize:
        giveaway.imageSize,

      imageWidth:
        giveaway.imageWidth,

      imageHeight:
        giveaway.imageHeight
    };

    state.formDirty = false;

    fillForm();
    renderImageWorkspace();
    renderPreview();
    renderSelectedCounts();

    setStatus(
      "Editing existing giveaway.",
      "info"
    );

    state.content.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }

  function attachListeners() {
    detachListeners();

    state.giveawaysRef =
      state.database.ref(
        "giveaways"
      );

    state.giveawaysCallback =
      snapshot => {
        const giveaways = [];

        snapshot.forEach(
          child => {
            giveaways.push(
              normalizeGiveaway(
                child.key,
                child.val()
              )
            );
          }
        );

        state.giveaways =
          sortGiveaways(
            giveaways
          );

        renderMetrics();
        renderLibrary();
        renderSelectedCounts();
      };

    state.giveawaysRef.on(
      "value",
      state.giveawaysCallback,
      error => {
        console.error(
          "Giveaway listener failed:",
          error
        );

        showToast(
          isPermissionDenied(error)
            ? "Firebase rules denied access to giveaways."
            : "Giveaways could not be loaded."
        );
      }
    );

    state.entriesRef =
      state.database.ref(
        "giveawayEntries"
      );

    state.entriesCallback =
      snapshot => {
        const counts = {};

        snapshot.forEach(
          giveawayChild => {
            counts[
              giveawayChild.key
            ] =
              giveawayChild
                .numChildren();
          }
        );

        state.entryCounts =
          counts;

        renderMetrics();
        renderLibrary();
        renderSelectedCounts();
      };

    state.entriesRef.on(
      "value",
      state.entriesCallback,
      error => {
        console.error(
          "Giveaway entry listener failed:",
          error
        );
      }
    );

    state.winnersRef =
      state.database.ref(
        "giveawayWinners"
      );

    state.winnersCallback =
      snapshot => {
        const counts = {};

        snapshot.forEach(
          giveawayChild => {
            counts[
              giveawayChild.key
            ] =
              giveawayChild
                .numChildren();
          }
        );

        state.winnerCounts =
          counts;

        renderMetrics();
        renderLibrary();
        renderSelectedCounts();
      };

    state.winnersRef.on(
      "value",
      state.winnersCallback,
      error => {
        console.error(
          "Giveaway winner listener failed:",
          error
        );
      }
    );
  }

  function detachListeners() {
    if (
      state.giveawaysRef &&
      state.giveawaysCallback
    ) {
      state.giveawaysRef.off(
        "value",
        state.giveawaysCallback
      );
    }

    if (
      state.entriesRef &&
      state.entriesCallback
    ) {
      state.entriesRef.off(
        "value",
        state.entriesCallback
      );
    }

    if (
      state.winnersRef &&
      state.winnersCallback
    ) {
      state.winnersRef.off(
        "value",
        state.winnersCallback
      );
    }

    state.giveawaysRef = null;
    state.giveawaysCallback = null;

    state.entriesRef = null;
    state.entriesCallback = null;

    state.winnersRef = null;
    state.winnersCallback = null;
  }

  function handleInput(event) {
    const target =
      event.target;

    if (
      target.id ===
      "nexusGiveawaySearch"
    ) {
      state.search =
        clean(target.value);

      renderLibrary();
      return;
    }

    if (
      !target.closest(
        "#nexusGiveawayForm"
      )
    ) {
      return;
    }

    syncDraftFromForm();

    state.formDirty = true;

    updateEditorLabels();
    updateDescriptionCount();
    renderPreview();
  }

  async function handleChange(event) {
    const target =
      event.target;

    if (
      target.id ===
      "nexusGiveawayFilter"
    ) {
      state.filter =
        clean(
          target.value,
          "all"
        );

      renderLibrary();
      return;
    }

    if (
      target.id ===
      "nexusGiveawayImageFile"
    ) {
      await selectLocalImage(
        target.files?.[0] ||
        null
      );

      return;
    }

    if (
      target.closest(
        "#nexusGiveawayForm"
      )
    ) {
      syncDraftFromForm();

      state.formDirty = true;

      updateEditorLabels();
      updateDescriptionCount();
      renderPreview();
    }
  }

  function handleClick(event) {
    const button =
      event.target.closest(
        "[data-giveaway-action]"
      );

    if (!button) {
      return;
    }

    const action =
      button.dataset
        .giveawayAction;

    const giveawayId =
      clean(
        button.dataset
          .giveawayId
      );

    switch (action) {
      case "new":
        resetEditor();
        break;

      case "remove-image":
        removeImage();
        break;

      case "edit":
        editGiveaway(
          giveawayId
        );
        break;

      case "start":
        void updateGiveawayStatus(
          giveawayId,
          "live",
          button
        );
        break;

      case "pause":
        void updateGiveawayStatus(
          giveawayId,
          "paused",
          button
        );
        break;

      case "close":
        void updateGiveawayStatus(
          giveawayId,
          "closed",
          button
        );
        break;

      case "delete":
        void deleteGiveaway(
          giveawayId,
          button
        );
        break;

      default:
        break;
    }
  }

  function handleSubmit(event) {
    if (
      event.target.id !==
      "nexusGiveawayForm"
    ) {
      return;
    }

    event.preventDefault();

    void saveGiveaway(
      query(
        "#nexusGiveawaySaveButton"
      )
    );
  }

  async function initialize() {
    state.activeTournamentId =
      await state.api
        .getCurrentTournamentId()
        .catch(
          () => "open1"
        );

    state.draft.tournamentId =
      state.activeTournamentId;

    renderShell();
    attachListeners();
  }

  function render(api) {
    cleanup();

    state.api = api;
    state.database =
      api.database;

    state.content =
      api.content;

    state.currentUser =
      api.currentUser;

    state.roleId =
      api.roleId || "";

    if (
      typeof firebase.storage !==
      "function"
    ) {
      state.content.innerHTML = `
        <div class="nexus-giveaway-empty error">

          <i class="fa-solid fa-triangle-exclamation"></i>

          <strong>
            Firebase Storage SDK Missing
          </strong>

          <span>
            Giveaways require firebase-storage.js to upload artwork.
          </span>

        </div>
      `;

      return;
    }

    state.storage =
      firebase.storage();

    state.giveaways = [];
    state.entryCounts = {};
    state.winnerCounts = {};

    state.selectedGiveawayId =
      "";

    state.filter = "all";
    state.search = "";

    state.formDirty = false;
    state.saving = false;

    state.draft =
      createEmptyDraft();

    state.content.innerHTML = `
      <div class="nexus-giveaway-loading">
        <i class="fa-solid fa-circle-notch fa-spin"></i>
        <span>Loading Giveaways & Rewards...</span>
      </div>
    `;

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

    state.content.addEventListener(
      "submit",
      handleSubmit
    );

    initialize().catch(
      error => {
        console.error(
          "Giveaways module initialization failed:",
          error
        );

        state.content.innerHTML = `
          <div class="nexus-giveaway-empty error">

            <i class="fa-solid fa-triangle-exclamation"></i>

            <strong>
              Giveaways Module Failed
            </strong>

            <span>
              ${escapeHtml(
                error?.message ||
                "Unknown error"
              )}
            </span>

          </div>
        `;
      }
    );
  }

  function cleanup() {
    detachListeners();
    releaseLocalImage();

    if (state.content) {
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

      state.content.removeEventListener(
        "submit",
        handleSubmit
      );
    }

    state.api = null;
    state.database = null;
    state.storage = null;
    state.content = null;
    state.currentUser = null;
    state.roleId = "";

    state.activeTournamentId =
      "";

    state.giveaways = [];
    state.entryCounts = {};
    state.winnerCounts = {};

    state.selectedGiveawayId =
      "";

    state.formDirty = false;
    state.saving = false;

    state.draft =
      createEmptyDraft();
  }

  window.NexusGiveaways = {
    render,
    cleanup
  };
})();
