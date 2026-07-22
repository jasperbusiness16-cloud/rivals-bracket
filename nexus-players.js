(function () {
  "use strict";

  const state = {
    api: null,
    database: null,
    content: null,
    currentUser: null,
    roleId: "",

    playersRef: null,
    playersCallback: null,
    usersRef: null,
    usersCallback: null,

    playersMap: {},
    usersMap: {},
    records: [],

    inspectedUid: "",
    giveawaySelection: new Set(),

    search: "",
    roleFilter: "all",
    regionFilter: "all",
    platformFilter: "all",
    completenessFilter: "all",

    detailRequestId: 0,
    detailCache: new Map()
  };

  function clean(value, fallback = "") {
    return String(
      value == null
        ? fallback
        : value
    ).trim();
  }

  function escapeHtml(value) {
    if (
      state.api &&
      typeof state.api.escapeHtml === "function"
    ) {
      return state.api.escapeHtml(value);
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
      typeof state.api.showToast === "function"
    ) {
      state.api.showToast(message);
      return;
    }

    console.log(message);
  }

  function isPermissionDenied(error) {
    if (
      state.api &&
      typeof state.api.isPermissionDenied === "function"
    ) {
      return state.api.isPermissionDenied(error);
    }

    const code = clean(error?.code).toLowerCase();
    const message = clean(error?.message).toLowerCase();

    return (
      code.includes("permission") ||
      message.includes("permission")
    );
  }

  function query(selector) {
    return state.content?.querySelector(selector) || null;
  }

  function formatNumber(value) {
    return Number(value || 0).toLocaleString();
  }

  function formatDate(value) {
    const timestamp = Number(value || 0);

    if (!timestamp) {
      return "Not available";
    }

    try {
      return new Intl.DateTimeFormat(
        "en-US",
        {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit"
        }
      ).format(new Date(timestamp));
    } catch {
      return "Not available";
    }
  }

  function normalizeRole(value) {
    const role = clean(value, "player").toLowerCase();

    if (["owner", "admin", "player"].includes(role)) {
      return role;
    }

    return "player";
  }

  function getRoleLabel(role) {
    const labels = {
      owner: "Owner",
      admin: "Administrator",
      player: "Player"
    };

    return labels[role] || "Player";
  }

  function createInitials(value) {
    return clean(value, "RG")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part[0])
      .join("")
      .toUpperCase();
  }

  function normalizePredictionStats(value) {
    const stats = value || {};

    return {
      accuracy: Number(
        stats.accuracy ??
        stats.accuracyPercent ??
        0
      ),
      correct: Number(
        stats.correct ??
        stats.correctPredictions ??
        0
      ),
      total: Number(
        stats.total ??
        stats.totalPredictions ??
        0
      ),
      currentStreak: Number(
        stats.currentStreak ??
        0
      ),
      bestStreak: Number(
        stats.bestStreak ??
        stats.bestPredictionStreak ??
        0
      ),
      rpEarned: Number(
        stats.rpEarned ??
        stats.predictionRpEarned ??
        0
      )
    };
  }

  function calculateProfileCompleteness(record) {
    const fields = [
      record.displayName,
      record.rivalsIgn,
      record.discordUsername,
      record.region,
      record.platform,
      record.bio,
      record.profileImage
    ];

    const completed = fields.filter(value => clean(value)).length;

    return Math.round(
      (completed / fields.length) * 100
    );
  }

  function normalizeRecord(uid) {
    const player = state.playersMap[uid] || {};
    const user = state.usersMap[uid] || {};

    const displayName = clean(
      player.displayName ||
      user.displayName ||
      user.email ||
      "Unnamed Player"
    );

    const record = {
      uid,
      displayName,
      rivalsIgn: clean(player.rivalsIgn),
      discordUsername: clean(player.discordUsername),
      discordMember: Boolean(player.discordMember),
      region: clean(player.region, "Unspecified"),
      platform: clean(player.platform, "Unspecified"),
      bio: clean(player.bio),
      profileImage: clean(player.profileImage),
      rgId: clean(player.rgId || user.rgId),

      email: clean(user.email),
      emailVerified: Boolean(user.emailVerified),
      role: normalizeRole(user.role || player.role),
      createdAt: Number(user.createdAt || player.createdAt || 0),
      lastLogin: Number(user.lastLogin || 0),

      rgPoints: Number(player.rgPoints || 0),
      lifetimeRgPoints: Number(player.lifetimeRgPoints || 0),
      prestige: Number(player.prestige || 0),
      eventsPlayed: Number(player.eventsPlayed || 0),
      championships: Number(player.championships || 0),
      bestFinish: clean(player.bestFinish, "--"),
      predictionStats: normalizePredictionStats(player.predictionStats)
    };

    record.completeness = calculateProfileCompleteness(record);
    return record;
  }

  function rebuildRecords() {
    const ids = new Set([
      ...Object.keys(state.playersMap),
      ...Object.keys(state.usersMap)
    ]);

    state.records = [...ids]
      .map(normalizeRecord)
      .sort((a, b) => {
        const roleOrder = {
          owner: 0,
          admin: 1,
          player: 2
        };

        const roleDifference =
          (roleOrder[a.role] ?? 9) -
          (roleOrder[b.role] ?? 9);

        if (roleDifference !== 0) {
          return roleDifference;
        }

        return a.displayName.localeCompare(
          b.displayName,
          undefined,
          { sensitivity: "base" }
        );
      });

    if (
      state.inspectedUid &&
      !state.records.some(record => record.uid === state.inspectedUid)
    ) {
      state.inspectedUid = "";
    }

    renderMetrics();
    renderFilterOptions();
    renderPlayerList();

    if (!state.inspectedUid) {
      const first = getVisibleRecords()[0];

      if (first) {
        inspectPlayer(first.uid);
      } else {
        renderEmptyDetail();
      }
    } else {
      renderPlayerDetail(
        state.records.find(record => record.uid === state.inspectedUid) || null
      );
    }
  }

  function getVisibleRecords() {
    const search = state.search.toLowerCase();

    return state.records.filter(record => {
      if (
        state.roleFilter !== "all" &&
        record.role !== state.roleFilter
      ) {
        return false;
      }

      if (
        state.regionFilter !== "all" &&
        record.region !== state.regionFilter
      ) {
        return false;
      }

      if (
        state.platformFilter !== "all" &&
        record.platform !== state.platformFilter
      ) {
        return false;
      }

      if (
        state.completenessFilter === "complete" &&
        record.completeness < 80
      ) {
        return false;
      }

      if (
        state.completenessFilter === "incomplete" &&
        record.completeness >= 80
      ) {
        return false;
      }

      if (!search) {
        return true;
      }

      const haystack = [
        record.displayName,
        record.rivalsIgn,
        record.rgId,
        record.email,
        record.discordUsername,
        record.uid,
        record.region,
        record.platform
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(search);
    });
  }

  function renderShell() {
    state.content.innerHTML = `
      <section class="nexus-players">

        <header class="nexus-players-hero">
          <div>
            <span class="nexus-players-eyebrow">
              Community Operations
            </span>

            <h2>Player Directory</h2>

            <p>
              Search accounts, inspect player profiles and prepare selected-player lists without changing protected balances, roles or inventory.
            </p>
          </div>

          <div class="nexus-player-selection-summary">
            <span>Giveaway Selection</span>
            <strong id="nexusPlayerSelectionCount">0</strong>
            <small>Local to this Nexus session</small>
          </div>
        </header>

        <div class="nexus-player-security-note">
          <i class="fa-solid fa-eye"></i>

          <div>
            <strong>Read-Only Directory</strong>
            <span>
              This module reads player, account and inventory information. It does not write RG Points, roles, profile records, loadouts or reward data.
            </span>
          </div>
        </div>

        <section class="nexus-player-metrics">
          <article>
            <span>Total Accounts</span>
            <strong id="nexusPlayerMetricTotal">0</strong>
            <small>Users and player profiles</small>
          </article>

          <article>
            <span>Players</span>
            <strong id="nexusPlayerMetricPlayers">0</strong>
            <small>Standard player accounts</small>
          </article>

          <article>
            <span>Staff</span>
            <strong id="nexusPlayerMetricStaff">0</strong>
            <small>Owner and administrators</small>
          </article>

          <article>
            <span>Complete Profiles</span>
            <strong id="nexusPlayerMetricComplete">0</strong>
            <small>80% profile completion or higher</small>
          </article>
        </section>

        <section class="nexus-player-toolbar">
          <label class="nexus-player-search">
            <i class="fa-solid fa-magnifying-glass"></i>

            <input
              id="nexusPlayerSearch"
              type="search"
              placeholder="Search name, IGN, RG ID, email, Discord or UID..."
              autocomplete="off"
            >
          </label>

          <select id="nexusPlayerRoleFilter">
            <option value="all">All Roles</option>
            <option value="owner">Owner</option>
            <option value="admin">Administrators</option>
            <option value="player">Players</option>
          </select>

          <select id="nexusPlayerRegionFilter">
            <option value="all">All Regions</option>
          </select>

          <select id="nexusPlayerPlatformFilter">
            <option value="all">All Platforms</option>
          </select>

          <select id="nexusPlayerCompletenessFilter">
            <option value="all">All Profiles</option>
            <option value="complete">Complete Profiles</option>
            <option value="incomplete">Incomplete Profiles</option>
          </select>
        </section>

        <section class="nexus-player-selection-bar">
          <div>
            <i class="fa-solid fa-user-plus"></i>

            <span>
              <strong id="nexusPlayerSelectionLabel">No players selected</strong>
              <small>
                Build a temporary UID list for future selected-player giveaways.
              </small>
            </span>
          </div>

          <div>
            <button
              type="button"
              data-player-action="copy-selection"
            >
              <i class="fa-solid fa-copy"></i>
              Copy UID List
            </button>

            <button
              type="button"
              data-player-action="clear-selection"
            >
              <i class="fa-solid fa-xmark"></i>
              Clear
            </button>
          </div>
        </section>

        <section class="nexus-player-workspace">

          <article class="nexus-player-panel nexus-player-list-panel">
            <header class="nexus-player-panel-head">
              <div>
                <span>Account Directory</span>
                <h3>Players</h3>
              </div>

              <strong id="nexusPlayerVisibleCount">0 Results</strong>
            </header>

            <div
              id="nexusPlayerList"
              class="nexus-player-list"
            >
              <div class="nexus-player-empty">
                <i class="fa-solid fa-spinner fa-spin"></i>
                <strong>Loading Players</strong>
              </div>
            </div>
          </article>

          <aside
            id="nexusPlayerDetail"
            class="nexus-player-panel nexus-player-detail-panel"
          ></aside>

        </section>

      </section>
    `;

    renderMetrics();
    renderFilterOptions();
    renderPlayerList();
    renderSelectionState();
    renderEmptyDetail();
  }

  function renderMetrics() {
    const total = state.records.length;
    const players = state.records.filter(record => record.role === "player").length;
    const staff = state.records.filter(record => record.role !== "player").length;
    const complete = state.records.filter(record => record.completeness >= 80).length;

    const values = {
      "#nexusPlayerMetricTotal": total,
      "#nexusPlayerMetricPlayers": players,
      "#nexusPlayerMetricStaff": staff,
      "#nexusPlayerMetricComplete": complete
    };

    Object.entries(values).forEach(([selector, value]) => {
      const element = query(selector);

      if (element) {
        element.textContent = formatNumber(value);
      }
    });
  }

  function setSelectOptions(selector, values, currentValue, allLabel) {
    const select = query(selector);

    if (!select) {
      return;
    }

    const uniqueValues = [...new Set(
      values
        .map(value => clean(value))
        .filter(value => value && value !== "Unspecified")
    )].sort((a, b) => a.localeCompare(b));

    select.innerHTML = `
      <option value="all">${escapeHtml(allLabel)}</option>
      ${uniqueValues.map(value => `
        <option value="${escapeHtml(value)}">
          ${escapeHtml(value)}
        </option>
      `).join("")}
    `;

    select.value = uniqueValues.includes(currentValue)
      ? currentValue
      : "all";
  }

  function renderFilterOptions() {
    setSelectOptions(
      "#nexusPlayerRegionFilter",
      state.records.map(record => record.region),
      state.regionFilter,
      "All Regions"
    );

    setSelectOptions(
      "#nexusPlayerPlatformFilter",
      state.records.map(record => record.platform),
      state.platformFilter,
      "All Platforms"
    );
  }

  function renderAvatar(record, className = "") {
    if (record.profileImage) {
      return `
        <span class="nexus-player-avatar ${escapeHtml(className)}">
          <img
            src="${escapeHtml(record.profileImage)}"
            alt="${escapeHtml(record.displayName)}"
          >
        </span>
      `;
    }

    return `
      <span class="nexus-player-avatar ${escapeHtml(className)}">
        ${escapeHtml(createInitials(record.displayName))}
      </span>
    `;
  }

  function renderPlayerList() {
    const container = query("#nexusPlayerList");
    const countElement = query("#nexusPlayerVisibleCount");

    if (!container) {
      return;
    }

    const records = getVisibleRecords();

    if (countElement) {
      countElement.textContent = `${formatNumber(records.length)} ${records.length === 1 ? "Result" : "Results"}`;
    }

    if (!records.length) {
      container.innerHTML = `
        <div class="nexus-player-empty">
          <i class="fa-solid fa-user-slash"></i>
          <strong>No Matching Players</strong>
          <span>Adjust the current search or filters.</span>
        </div>
      `;

      return;
    }

    container.innerHTML = records.map(record => {
      const selected = state.giveawaySelection.has(record.uid);
      const inspected = state.inspectedUid === record.uid;

      return `
        <article
          class="nexus-player-row ${inspected ? "active" : ""}"
          data-player-action="inspect"
          data-player-uid="${escapeHtml(record.uid)}"
        >
          ${renderAvatar(record)}

          <div class="nexus-player-row-main">
            <div class="nexus-player-row-title">
              <strong>${escapeHtml(record.displayName)}</strong>

              <span class="nexus-player-role-chip ${escapeHtml(record.role)}">
                ${escapeHtml(getRoleLabel(record.role))}
              </span>
            </div>

            <span>
              ${escapeHtml(record.rivalsIgn || "No Rivals IGN")}
              ${record.rgId ? ` • ${escapeHtml(record.rgId)}` : ""}
            </span>

            <small>
              ${escapeHtml(record.region)}
              •
              ${escapeHtml(record.platform)}
              •
              ${record.completeness}% Complete
            </small>
          </div>

          <div class="nexus-player-row-stats">
            <span>RG Points</span>
            <strong>${formatNumber(record.rgPoints)}</strong>
          </div>

          <button
            class="nexus-player-select-button ${selected ? "selected" : ""}"
            type="button"
            data-player-action="toggle-selection"
            data-player-uid="${escapeHtml(record.uid)}"
            aria-label="${selected ? "Remove from" : "Add to"} giveaway selection"
          >
            <i class="fa-solid ${selected ? "fa-check" : "fa-plus"}"></i>
          </button>
        </article>
      `;
    }).join("");
  }

  function renderSelectionState() {
    const count = state.giveawaySelection.size;

    const countElement = query("#nexusPlayerSelectionCount");
    const labelElement = query("#nexusPlayerSelectionLabel");

    if (countElement) {
      countElement.textContent = formatNumber(count);
    }

    if (labelElement) {
      labelElement.textContent = count === 0
        ? "No players selected"
        : `${formatNumber(count)} ${count === 1 ? "player" : "players"} selected`;
    }
  }

  function renderEmptyDetail() {
    const container = query("#nexusPlayerDetail");

    if (!container) {
      return;
    }

    container.innerHTML = `
      <div class="nexus-player-empty detail-empty">
        <i class="fa-solid fa-address-card"></i>
        <strong>Select a Player</strong>
        <span>Choose an account to inspect its profile and protected read-only details.</span>
      </div>
    `;
  }

  function renderPlayerDetail(record, extra = null) {
    const container = query("#nexusPlayerDetail");

    if (!container) {
      return;
    }

    if (!record) {
      renderEmptyDetail();
      return;
    }

    const selectionActive = state.giveawaySelection.has(record.uid);
    const prediction = record.predictionStats;

    container.innerHTML = `
      <header class="nexus-player-detail-hero">
        ${renderAvatar(record, "large")}

        <div>
          <span class="nexus-player-role-chip ${escapeHtml(record.role)}">
            ${escapeHtml(getRoleLabel(record.role))}
          </span>

          <h3>${escapeHtml(record.displayName)}</h3>

          <p>${escapeHtml(record.rivalsIgn || "No Rivals IGN set")}</p>
        </div>
      </header>

      <div class="nexus-player-detail-actions">
        <button
          type="button"
          data-player-action="toggle-selection"
          data-player-uid="${escapeHtml(record.uid)}"
          class="${selectionActive ? "selected" : ""}"
        >
          <i class="fa-solid ${selectionActive ? "fa-check" : "fa-user-plus"}"></i>
          ${selectionActive ? "Selected for Giveaway" : "Add to Giveaway Selection"}
        </button>

        <button
          type="button"
          data-player-action="copy"
          data-copy-value="${escapeHtml(record.uid)}"
          data-copy-label="UID"
        >
          <i class="fa-solid fa-copy"></i>
          Copy UID
        </button>

        ${record.rgId ? `
          <button
            type="button"
            data-player-action="copy"
            data-copy-value="${escapeHtml(record.rgId)}"
            data-copy-label="RG ID"
          >
            <i class="fa-solid fa-id-card"></i>
            Copy RG ID
          </button>
        ` : ""}
      </div>

      <section class="nexus-player-detail-section">
        <div class="nexus-player-section-head">
          <span>Profile Completion</span>
          <strong>${record.completeness}%</strong>
        </div>

        <div class="nexus-player-completion-track">
          <span style="width: ${record.completeness}%"></span>
        </div>
      </section>

      <section class="nexus-player-stat-grid">
        ${createStatCard("RG Points", record.rgPoints)}
        ${createStatCard("Lifetime RP", record.lifetimeRgPoints)}
        ${createStatCard("Prestige", record.prestige)}
        ${createStatCard("Events Played", record.eventsPlayed)}
        ${createStatCard("Championships", record.championships)}
        ${createStatCard("Best Finish", record.bestFinish)}
      </section>

      <section class="nexus-player-detail-section">
        <div class="nexus-player-section-head">
          <span>Account Identity</span>
          <strong>Read Only</strong>
        </div>

        <div class="nexus-player-information-list">
          ${createInfoRow("Email", record.email || "Not available", record.emailVerified ? "Verified" : "Not verified")}
          ${createInfoRow("Discord", record.discordUsername || "Not set", record.discordMember ? "Server member" : "Membership unknown")}
          ${createInfoRow("Region", record.region)}
          ${createInfoRow("Platform", record.platform)}
          ${createInfoRow("RG ID", record.rgId || "Not assigned")}
          ${createInfoRow("Firebase UID", record.uid)}
          ${createInfoRow("Created", formatDate(record.createdAt))}
          ${createInfoRow("Last Login", formatDate(record.lastLogin))}
        </div>
      </section>

      <section class="nexus-player-detail-section">
        <div class="nexus-player-section-head">
          <span>Prediction Career</span>
          <strong>${formatNumber(prediction.total)} Total</strong>
        </div>

        <div class="nexus-player-mini-grid">
          ${createMiniStat("Accuracy", `${Number(prediction.accuracy || 0).toFixed(1)}%`)}
          ${createMiniStat("Correct", prediction.correct)}
          ${createMiniStat("Current Streak", prediction.currentStreak)}
          ${createMiniStat("Best Streak", prediction.bestStreak)}
          ${createMiniStat("Prediction RP", prediction.rpEarned)}
        </div>
      </section>

      <section class="nexus-player-detail-section">
        <div class="nexus-player-section-head">
          <span>Inventory & Loadout</span>
          <strong id="nexusPlayerInventoryState">${extra ? "Loaded" : "Loading"}</strong>
        </div>

        <div id="nexusPlayerInventoryContent">
          ${extra ? renderInventoryMarkup(extra) : `
            <div class="nexus-player-detail-loading">
              <i class="fa-solid fa-spinner fa-spin"></i>
              Reading protected player inventory...
            </div>
          `}
        </div>
      </section>

      ${record.bio ? `
        <section class="nexus-player-detail-section">
          <div class="nexus-player-section-head">
            <span>Profile Bio</span>
          </div>

          <p class="nexus-player-bio">
            ${escapeHtml(record.bio)}
          </p>
        </section>
      ` : ""}
    `;
  }

  function createStatCard(label, value) {
    return `
      <article>
        <span>${escapeHtml(label)}</span>
        <strong>${typeof value === "number" ? formatNumber(value) : escapeHtml(value)}</strong>
      </article>
    `;
  }

  function createMiniStat(label, value) {
    return `
      <div>
        <span>${escapeHtml(label)}</span>
        <strong>${typeof value === "number" ? formatNumber(value) : escapeHtml(value)}</strong>
      </div>
    `;
  }

  function createInfoRow(label, value, note = "") {
    return `
      <div>
        <span>${escapeHtml(label)}</span>
        <strong title="${escapeHtml(value)}">${escapeHtml(value)}</strong>
        ${note ? `<small>${escapeHtml(note)}</small>` : ""}
      </div>
    `;
  }

  function countOwnedRecords(value) {
    if (value == null || value === false || value === 0 || value === "") {
      return 0;
    }

    if (typeof value !== "object") {
      return 1;
    }

    return Object.values(value).reduce(
      (total, child) => total + countOwnedRecords(child),
      0
    );
  }

  function sumNumericValues(value) {
    if (typeof value === "number" && Number.isFinite(value) && value > 0) {
      return value;
    }

    if (!value || typeof value !== "object") {
      return 0;
    }

    return Object.values(value).reduce(
      (total, child) => total + sumNumericValues(child),
      0
    );
  }

  function getInventorySummary(inventory) {
    const data = inventory || {};

    const crateData =
      data.crates ||
      data.crateInventory ||
      data.crateCounts ||
      {};

    const cosmetics = data.profileCosmetics || {};
    const trackers = data.profileTrackers || {};

    return {
      crates: sumNumericValues(crateData),
      cosmetics: countOwnedRecords(cosmetics),
      trackers: countOwnedRecords(trackers),
      totalRecords: countOwnedRecords(data)
    };
  }

  function getLoadoutSummary(loadout) {
    const data = loadout || {};

    const slots = [
      data.backgroundId,
      data.frameId,
      data.titleId,
      data.badgeId,
      data.effectId,
      data.nameplateId
    ];

    const equipped = slots.filter(value => {
      const normalized = clean(value).toLowerCase();

      return normalized &&
        normalized !== "none" &&
        !normalized.startsWith("default_");
    }).length;

    const trackers = [
      data.trackers?.slot1?.trackerId,
      data.trackers?.slot2?.trackerId,
      data.trackers?.slot3?.trackerId
    ].filter(value => clean(value)).length;

    return {
      equipped,
      trackers,
      backgroundId: clean(data.backgroundId, "default_void"),
      frameId: clean(data.frameId, "default_frame"),
      titleId: clean(data.titleId, "none"),
      badgeId: clean(data.badgeId, "none"),
      effectId: clean(data.effectId, "none"),
      nameplateId: clean(data.nameplateId, "default_nameplate")
    };
  }

  function renderInventoryMarkup(extra) {
    const inventory = getInventorySummary(extra.inventory);
    const loadout = getLoadoutSummary(extra.loadout);

    return `
      <div class="nexus-player-mini-grid inventory-grid">
        ${createMiniStat("Crates", inventory.crates)}
        ${createMiniStat("Cosmetic Records", inventory.cosmetics)}
        ${createMiniStat("Tracker Records", inventory.trackers)}
        ${createMiniStat("Inventory Records", inventory.totalRecords)}
        ${createMiniStat("Custom Slots", loadout.equipped)}
        ${createMiniStat("Equipped Trackers", loadout.trackers)}
      </div>

      <div class="nexus-player-loadout-list">
        ${createInfoRow("Background", loadout.backgroundId)}
        ${createInfoRow("Frame", loadout.frameId)}
        ${createInfoRow("Title", loadout.titleId)}
        ${createInfoRow("Badge", loadout.badgeId)}
        ${createInfoRow("Effect", loadout.effectId)}
        ${createInfoRow("Nameplate", loadout.nameplateId)}
      </div>
    `;
  }

  async function inspectPlayer(uid) {
    const record = state.records.find(item => item.uid === uid);

    if (!record) {
      return;
    }

    state.inspectedUid = uid;
    renderPlayerList();

    const cached = state.detailCache.get(uid);
    renderPlayerDetail(record, cached || null);

    if (cached) {
      return;
    }

    const requestId = ++state.detailRequestId;

    try {
      const [inventorySnapshot, loadoutSnapshot] = await Promise.all([
        state.database.ref(`inventory/${uid}`).once("value"),
        state.database.ref(`profileLoadouts/${uid}`).once("value")
      ]);

      if (
        requestId !== state.detailRequestId ||
        state.inspectedUid !== uid
      ) {
        return;
      }

      const extra = {
        inventory: inventorySnapshot.val() || {},
        loadout: loadoutSnapshot.val() || {}
      };

      state.detailCache.set(uid, extra);
      renderPlayerDetail(record, extra);
    } catch (error) {
      console.error("Player detail read failed:", error);

      if (
        requestId !== state.detailRequestId ||
        state.inspectedUid !== uid
      ) {
        return;
      }

      renderPlayerDetail(record, {
        inventory: {},
        loadout: {}
      });

      const inventoryState = query("#nexusPlayerInventoryState");

      if (inventoryState) {
        inventoryState.textContent = isPermissionDenied(error)
          ? "Read Blocked"
          : "Unavailable";
      }
    }
  }

  function toggleSelection(uid) {
    if (!uid) {
      return;
    }

    if (state.giveawaySelection.has(uid)) {
      state.giveawaySelection.delete(uid);
    } else {
      state.giveawaySelection.add(uid);
    }

    renderSelectionState();
    renderPlayerList();

    const record = state.records.find(item => item.uid === state.inspectedUid);

    if (record) {
      renderPlayerDetail(
        record,
        state.detailCache.get(record.uid) || null
      );
    }
  }

  async function copyText(value, label) {
    const text = clean(value);

    if (!text) {
      showToast(`${label} is unavailable.`);
      return;
    }

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        textarea.remove();
      }

      showToast(`${label} copied.`);
    } catch (error) {
      console.error("Copy failed:", error);
      showToast(`Could not copy ${label}.`);
    }
  }

  function handleInput(event) {
    if (event.target.id !== "nexusPlayerSearch") {
      return;
    }

    state.search = clean(event.target.value);
    renderPlayerList();
  }

  function handleChange(event) {
    const target = event.target;

    switch (target.id) {
      case "nexusPlayerRoleFilter":
        state.roleFilter = clean(target.value, "all");
        break;

      case "nexusPlayerRegionFilter":
        state.regionFilter = clean(target.value, "all");
        break;

      case "nexusPlayerPlatformFilter":
        state.platformFilter = clean(target.value, "all");
        break;

      case "nexusPlayerCompletenessFilter":
        state.completenessFilter = clean(target.value, "all");
        break;

      default:
        return;
    }

    renderPlayerList();
  }

  function handleClick(event) {
    const actionElement = event.target.closest("[data-player-action]");

    if (!actionElement) {
      return;
    }

    const action = actionElement.dataset.playerAction;
    const uid = clean(actionElement.dataset.playerUid);

    if (action === "inspect") {
      void inspectPlayer(uid);
      return;
    }

    if (action === "toggle-selection") {
      event.stopPropagation();
      toggleSelection(uid);
      return;
    }

    if (action === "copy") {
      void copyText(
        actionElement.dataset.copyValue,
        clean(actionElement.dataset.copyLabel, "Value")
      );
      return;
    }

    if (action === "copy-selection") {
      if (state.giveawaySelection.size === 0) {
        showToast("Select at least one player first.");
        return;
      }

      void copyText(
        [...state.giveawaySelection].join("\n"),
        "Selected UID list"
      );
      return;
    }

    if (action === "clear-selection") {
      state.giveawaySelection.clear();
      renderSelectionState();
      renderPlayerList();

      const record = state.records.find(item => item.uid === state.inspectedUid);

      if (record) {
        renderPlayerDetail(
          record,
          state.detailCache.get(record.uid) || null
        );
      }

      showToast("Giveaway selection cleared.");
    }
  }

  function attachListeners() {
    detachListeners();

    state.playersRef = state.database.ref("players");
    state.playersCallback = snapshot => {
      state.playersMap = snapshot.val() || {};
      rebuildRecords();
    };

    state.playersRef.on(
      "value",
      state.playersCallback,
      error => {
        console.error("Players listener failed:", error);
        showLoadError(error, "players");
      }
    );

    state.usersRef = state.database.ref("users");
    state.usersCallback = snapshot => {
      state.usersMap = snapshot.val() || {};
      rebuildRecords();
    };

    state.usersRef.on(
      "value",
      state.usersCallback,
      error => {
        console.error("Users listener failed:", error);
        showLoadError(error, "users");
      }
    );
  }

  function showLoadError(error, path) {
    const container = query("#nexusPlayerList");

    if (!container) {
      return;
    }

    container.innerHTML = `
      <div class="nexus-player-empty error">
        <i class="fa-solid fa-triangle-exclamation"></i>
        <strong>Directory Read Failed</strong>
        <span>
          ${isPermissionDenied(error)
            ? `Firebase rules denied access to ${escapeHtml(path)}.`
            : escapeHtml(error?.message || "Unknown error")}
        </span>
      </div>
    `;
  }

  function detachListeners() {
    if (state.playersRef && state.playersCallback) {
      state.playersRef.off("value", state.playersCallback);
    }

    if (state.usersRef && state.usersCallback) {
      state.usersRef.off("value", state.usersCallback);
    }

    state.playersRef = null;
    state.playersCallback = null;
    state.usersRef = null;
    state.usersCallback = null;
  }

  function render(api) {
    cleanup();

    state.api = api;
    state.database = api.database;
    state.content = api.content;
    state.currentUser = api.currentUser;
    state.roleId = api.roleId || "";

    state.playersMap = {};
    state.usersMap = {};
    state.records = [];
    state.inspectedUid = "";
    state.giveawaySelection = new Set();
    state.detailRequestId = 0;
    state.detailCache = new Map();

    state.search = "";
    state.roleFilter = "all";
    state.regionFilter = "all";
    state.platformFilter = "all";
    state.completenessFilter = "all";

    renderShell();

    state.content.addEventListener("click", handleClick);
    state.content.addEventListener("input", handleInput);
    state.content.addEventListener("change", handleChange);

    attachListeners();
  }

  function cleanup() {
    detachListeners();

    state.detailRequestId += 1;

    if (state.content) {
      state.content.removeEventListener("click", handleClick);
      state.content.removeEventListener("input", handleInput);
      state.content.removeEventListener("change", handleChange);
    }

    state.api = null;
    state.database = null;
    state.content = null;
    state.currentUser = null;
    state.roleId = "";

    state.playersMap = {};
    state.usersMap = {};
    state.records = [];
    state.inspectedUid = "";
    state.giveawaySelection = new Set();
    state.detailCache = new Map();

    state.search = "";
    state.roleFilter = "all";
    state.regionFilter = "all";
    state.platformFilter = "all";
    state.completenessFilter = "all";
  }

  window.NexusPlayers = {
    render,
    cleanup
  };
})();
