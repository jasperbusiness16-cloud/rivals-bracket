(function () {
  "use strict";

  const ALLOWED_SEVERITIES =
    new Set([
      "info",
      "success",
      "warning",
      "critical"
    ]);

  const state = {
    api: null,
    database: null,
    content: null,
    currentUser: null,
    roleId: "",

    auditRef: null,
    auditCallback: null,

    staffHistoryRef: null,
    staffHistoryCallback: null,

    auditLogs: [],
    staffLogs: [],
    combinedLogs: [],

    auditLoaded: false,
    staffLoaded: false,

    selectedId: "",

    search: "",
    sourceFilter: "all",
    categoryFilter: "all",
    severityFilter: "all",
    actorFilter: "all",
    timeFilter: "all"
  };

  function clean(value, fallback = "") {
    return String(
      value == null
        ? fallback
        : value
    ).trim();
  }

  function clip(value, maximum) {
    return clean(value).slice(
      0,
      maximum
    );
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
    return (
      state.content?.querySelector(
        selector
      ) ||
      null
    );
  }

  function formatNumber(value) {
    return Number(
      value || 0
    ).toLocaleString();
  }

  function normalizeRole(value) {
    const role =
      clean(
        value,
        "unknown"
      ).toLowerCase();

    if (
      role === "owner" ||
      role === "admin" ||
      role === "player"
    ) {
      return role;
    }

    return "unknown";
  }

  function getRoleLabel(role) {
    const labels = {
      owner: "Owner",
      admin: "Administrator",
      player: "Player",
      unknown: "Unknown Role"
    };

    return (
      labels[role] ||
      "Unknown Role"
    );
  }

  function normalizeSeverity(value) {
    const severity =
      clean(
        value,
        "info"
      ).toLowerCase();

    return ALLOWED_SEVERITIES.has(
      severity
    )
      ? severity
      : "info";
  }

  function humanize(value) {
    return clean(value)
      .replaceAll(".", " ")
      .replaceAll("_", " ")
      .replaceAll("-", " ")
      .replace(
        /\b\w/g,
        character =>
          character.toUpperCase()
      );
  }

  function formatDate(value) {
    const timestamp =
      Number(value || 0);

    if (!timestamp) {
      return "Timestamp unavailable";
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
            minute: "2-digit",
            second: "2-digit"
          }
        )
        .format(
          new Date(timestamp)
        );
    } catch {
      return "Timestamp unavailable";
    }
  }

  function formatRelativeTime(value) {
    const timestamp =
      Number(value || 0);

    if (!timestamp) {
      return "Unknown time";
    }

    const difference =
      Date.now() -
      timestamp;

    if (difference < 0) {
      return formatDate(timestamp);
    }

    const seconds =
      Math.floor(
        difference / 1000
      );

    if (seconds < 60) {
      return "Just now";
    }

    const minutes =
      Math.floor(
        seconds / 60
      );

    if (minutes < 60) {
      return `${minutes}m ago`;
    }

    const hours =
      Math.floor(
        minutes / 60
      );

    if (hours < 24) {
      return `${hours}h ago`;
    }

    const days =
      Math.floor(
        hours / 24
      );

    if (days < 30) {
      return `${days}d ago`;
    }

    return formatDate(timestamp);
  }

  function getSeverityIcon(severity) {
    const icons = {
      info: "fa-circle-info",
      success: "fa-circle-check",
      warning: "fa-triangle-exclamation",
      critical: "fa-shield-halved"
    };

    return (
      icons[severity] ||
      "fa-circle-info"
    );
  }

  function normalizeAuditLog(
    id,
    value
  ) {
    const record =
      value || {};

    const actorName =
      clean(
        record.actorName,
        "Unknown Staff Account"
      );

    const category =
      clean(
        record.category,
        "system"
      ).toLowerCase();

    const action =
      clean(
        record.action,
        "unknown.action"
      );

    return {
      id:
        `audit:${id}`,

      sourceId:
        id,

      source:
        "audit_logs",

      sourceLabel:
        "Nexus Audit",

      action,

      actionLabel:
        humanize(action),

      category,

      categoryLabel:
        humanize(category),

      actorUid:
        clean(
          record.actorUid
        ),

      actorName,

      actorRole:
        normalizeRole(
          record.actorRole
        ),

      summary:
        clean(
          record.summary,
          "No summary was provided."
        ),

      targetType:
        clean(
          record.targetType
        ),

      targetId:
        clean(
          record.targetId
        ),

      targetName:
        clean(
          record.targetName
        ),

      severity:
        normalizeSeverity(
          record.severity
        ),

      createdAt:
        Number(
          record.createdAt ||
          0
        ),

      original:
        record
    };
  }

  function normalizeStaffHistory(
    id,
    value
  ) {
    const record =
      value || {};

    const targetName =
      clean(
        record.targetName,
        "Unknown Account"
      );

    const previousRole =
      normalizeRole(
        record.previousRole
      );

    const newRole =
      normalizeRole(
        record.newRole
      );

    const promoted =
      newRole === "admin";

    return {
      id:
        `staff:${id}`,

      sourceId:
        id,

      source:
        "staff_access",

      sourceLabel:
        "Staff & Access",

      action:
        "staff.role_changed",

      actionLabel:
        "Staff Role Changed",

      category:
        "staff_access",

      categoryLabel:
        "Staff Access",

      actorUid:
        clean(
          record.changedByUid
        ),

      actorName:
        clean(
          record.changedByName,
          "Owner"
        ),

      actorRole:
        "owner",

      summary:
        promoted
          ? `Granted Administrator access to ${targetName}.`
          : `Changed ${targetName} from ${getRoleLabel(
              previousRole
            )} to ${getRoleLabel(
              newRole
            )}.`,

      targetType:
        "user_account",

      targetId:
        clean(
          record.targetUid
        ),

      targetName,

      severity:
        promoted
          ? "success"
          : "warning",

      createdAt:
        Number(
          record.createdAt ||
          0
        ),

      original:
        record
    };
  }

  function rebuildCombinedLogs() {
    state.combinedLogs = [
      ...state.auditLogs,
      ...state.staffLogs
    ].sort(
      (a, b) =>
        Number(
          b.createdAt || 0
        ) -
        Number(
          a.createdAt || 0
        )
    );

    if (
      state.selectedId &&
      !state.combinedLogs.some(
        record =>
          record.id ===
          state.selectedId
      )
    ) {
      state.selectedId = "";
    }

    const visible =
      getVisibleLogs();

    if (
      !state.selectedId &&
      visible.length
    ) {
      state.selectedId =
        visible[0].id;
    }

    renderMetrics();
    renderFilterOptions();
    renderLogList();
    renderDetail();
  }

  function getSelectedRecord() {
    return (
      state.combinedLogs.find(
        record =>
          record.id ===
          state.selectedId
      ) ||
      null
    );
  }

  function getActorFilterKey(record) {
    return (
      record.actorUid ||
      `name:${record.actorName}`
    );
  }

  function isWithinTimeFilter(
    record
  ) {
    if (
      state.timeFilter ===
      "all"
    ) {
      return true;
    }

    const timestamp =
      Number(
        record.createdAt ||
        0
      );

    if (!timestamp) {
      return false;
    }

    const now =
      Date.now();

    if (
      state.timeFilter ===
      "today"
    ) {
      const start =
        new Date();

      start.setHours(
        0,
        0,
        0,
        0
      );

      return (
        timestamp >=
        start.getTime()
      );
    }

    if (
      state.timeFilter ===
      "7d"
    ) {
      return (
        timestamp >=
        now -
        7 *
        24 *
        60 *
        60 *
        1000
      );
    }

    if (
      state.timeFilter ===
      "30d"
    ) {
      return (
        timestamp >=
        now -
        30 *
        24 *
        60 *
        60 *
        1000
      );
    }

    return true;
  }

  function getVisibleLogs() {
    const search =
      state.search
        .toLowerCase();

    return state.combinedLogs.filter(
      record => {
        if (
          state.sourceFilter !==
            "all" &&
          record.source !==
            state.sourceFilter
        ) {
          return false;
        }

        if (
          state.categoryFilter !==
            "all" &&
          record.category !==
            state.categoryFilter
        ) {
          return false;
        }

        if (
          state.severityFilter !==
            "all" &&
          record.severity !==
            state.severityFilter
        ) {
          return false;
        }

        if (
          state.actorFilter !==
            "all" &&
          getActorFilterKey(
            record
          ) !==
            state.actorFilter
        ) {
          return false;
        }

        if (
          !isWithinTimeFilter(
            record
          )
        ) {
          return false;
        }

        if (!search) {
          return true;
        }

        const searchable = [
          record.action,
          record.actionLabel,
          record.category,
          record.categoryLabel,
          record.actorUid,
          record.actorName,
          record.actorRole,
          record.summary,
          record.targetType,
          record.targetId,
          record.targetName,
          record.severity,
          record.sourceLabel
        ]
          .join(" ")
          .toLowerCase();

        return searchable.includes(
          search
        );
      }
    );
  }

  function renderShell() {
    state.content.innerHTML = `
      <section class="nexus-audit">

        <header class="nexus-audit-hero">

          <div>
            <span class="nexus-audit-eyebrow">
              Security & Accountability
            </span>

            <h2>
              Audit History
            </h2>

            <p>
              Review append-only Nexus activity and Staff & Access role changes in one searchable operational history.
            </p>
          </div>

          <span class="nexus-audit-readonly-chip">
            <i class="fa-solid fa-lock"></i>
            Read Only
          </span>

        </header>

        <div class="nexus-audit-security-note">

          <i class="fa-solid fa-shield-halved"></i>

          <div>
            <strong>
              Append-Only Protection Active
            </strong>

            <span>
              Existing audit records cannot be edited or deleted through normal Nexus browser access. Client-created records identify the authenticated UID and current role, but Firebase Functions will eventually provide stronger server-attested logging.
            </span>
          </div>

        </div>

        <section class="nexus-audit-metrics">

          <article>
            <span>Total Records</span>
            <strong id="nexusAuditMetricTotal">0</strong>
            <small>Combined history</small>
          </article>

          <article>
            <span>Today</span>
            <strong id="nexusAuditMetricToday">0</strong>
            <small>Activity since midnight</small>
          </article>

          <article>
            <span>Warnings</span>
            <strong id="nexusAuditMetricWarnings">0</strong>
            <small>Warning and critical records</small>
          </article>

          <article>
            <span>Staff Changes</span>
            <strong id="nexusAuditMetricStaff">0</strong>
            <small>Role promotions and removals</small>
          </article>

        </section>

        <section class="nexus-audit-toolbar">

          <label class="nexus-audit-search">

            <i class="fa-solid fa-magnifying-glass"></i>

            <input
              id="nexusAuditSearch"
              type="search"
              placeholder="Search actions, summaries, staff, targets or IDs..."
              autocomplete="off"
            >

          </label>

          <select id="nexusAuditSourceFilter">
            <option value="all">
              All Sources
            </option>

            <option value="audit_logs">
              Nexus Audit
            </option>

            <option value="staff_access">
              Staff & Access
            </option>
          </select>

          <select id="nexusAuditCategoryFilter">
            <option value="all">
              All Categories
            </option>
          </select>

          <select id="nexusAuditSeverityFilter">
            <option value="all">
              All Severities
            </option>

            <option value="info">
              Information
            </option>

            <option value="success">
              Success
            </option>

            <option value="warning">
              Warning
            </option>

            <option value="critical">
              Critical
            </option>
          </select>

          <select id="nexusAuditActorFilter">
            <option value="all">
              All Staff
            </option>
          </select>

          <select id="nexusAuditTimeFilter">
            <option value="all">
              All Time
            </option>

            <option value="today">
              Today
            </option>

            <option value="7d">
              Last 7 Days
            </option>

            <option value="30d">
              Last 30 Days
            </option>
          </select>

        </section>

        <section class="nexus-audit-export-bar">

          <div>

            <i class="fa-solid fa-filter"></i>

            <span>
              <strong id="nexusAuditVisibleLabel">
                0 records visible
              </strong>

              <small>
                Exporting copies the currently filtered records as JSON.
              </small>
            </span>

          </div>

          <button
            type="button"
            data-audit-action="copy-visible"
          >
            <i class="fa-solid fa-copy"></i>
            Copy Visible JSON
          </button>

        </section>

        <section class="nexus-audit-workspace">

          <article class="nexus-audit-panel nexus-audit-list-panel">

            <header class="nexus-audit-panel-head">

              <div>
                <span>Operational Record</span>
                <h3>Activity Timeline</h3>
              </div>

              <strong id="nexusAuditVisibleCount">
                0 Results
              </strong>

            </header>

            <div
              id="nexusAuditLogList"
              class="nexus-audit-log-list"
            >
              <div class="nexus-audit-empty">
                <i class="fa-solid fa-spinner fa-spin"></i>
                <strong>Loading Audit History</strong>
              </div>
            </div>

          </article>

          <aside
            id="nexusAuditDetail"
            class="nexus-audit-panel nexus-audit-detail-panel"
          ></aside>

        </section>

      </section>
    `;

    renderMetrics();
    renderFilterOptions();
    renderLogList();
    renderDetail();
  }

  function renderMetrics() {
    const total =
      state.combinedLogs.length;

    const todayStart =
      new Date();

    todayStart.setHours(
      0,
      0,
      0,
      0
    );

    const today =
      state.combinedLogs.filter(
        record =>
          Number(
            record.createdAt ||
            0
          ) >=
          todayStart.getTime()
      ).length;

    const warnings =
      state.combinedLogs.filter(
        record =>
          record.severity ===
            "warning" ||
          record.severity ===
            "critical"
      ).length;

    const staff =
      state.combinedLogs.filter(
        record =>
          record.category ===
          "staff_access"
      ).length;

    const values = {
      "#nexusAuditMetricTotal":
        total,

      "#nexusAuditMetricToday":
        today,

      "#nexusAuditMetricWarnings":
        warnings,

      "#nexusAuditMetricStaff":
        staff
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

  function setSelectOptions(
    selector,
    values,
    currentValue,
    allLabel
  ) {
    const select =
      query(selector);

    if (!select) {
      return;
    }

    select.innerHTML = `
      <option value="all">
        ${escapeHtml(allLabel)}
      </option>

      ${values
        .map(
          item => `
            <option value="${escapeHtml(
              item.value
            )}">
              ${escapeHtml(
                item.label
              )}
            </option>
          `
        )
        .join("")}
    `;

    select.value =
      values.some(
        item =>
          item.value ===
          currentValue
      )
        ? currentValue
        : "all";
  }

  function renderFilterOptions() {
    const categoryMap =
      new Map();

    const actorMap =
      new Map();

    state.combinedLogs.forEach(
      record => {
        if (
          record.category &&
          !categoryMap.has(
            record.category
          )
        ) {
          categoryMap.set(
            record.category,
            record.categoryLabel
          );
        }

        const actorKey =
          getActorFilterKey(
            record
          );

        if (
          actorKey &&
          !actorMap.has(
            actorKey
          )
        ) {
          actorMap.set(
            actorKey,
            record.actorName
          );
        }
      }
    );

    const categories =
      [...categoryMap.entries()]
        .map(
          ([
            value,
            label
          ]) => ({
            value,
            label
          })
        )
        .sort(
          (a, b) =>
            a.label.localeCompare(
              b.label
            )
        );

    const actors =
      [...actorMap.entries()]
        .map(
          ([
            value,
            label
          ]) => ({
            value,
            label
          })
        )
        .sort(
          (a, b) =>
            a.label.localeCompare(
              b.label
            )
        );

    setSelectOptions(
      "#nexusAuditCategoryFilter",
      categories,
      state.categoryFilter,
      "All Categories"
    );

    setSelectOptions(
      "#nexusAuditActorFilter",
      actors,
      state.actorFilter,
      "All Staff"
    );
  }

  function renderLogList() {
    const container =
      query(
        "#nexusAuditLogList"
      );

    const countElement =
      query(
        "#nexusAuditVisibleCount"
      );

    const labelElement =
      query(
        "#nexusAuditVisibleLabel"
      );

    if (!container) {
      return;
    }

    if (
      !state.auditLoaded ||
      !state.staffLoaded
    ) {
      container.innerHTML = `
        <div class="nexus-audit-empty">

          <i class="fa-solid fa-spinner fa-spin"></i>

          <strong>
            Loading Audit History
          </strong>

          <span>
            Reading append-only records and Staff & Access history.
          </span>

        </div>
      `;

      return;
    }

    const records =
      getVisibleLogs();

    if (countElement) {
      countElement.textContent =
        `${formatNumber(
          records.length
        )} ${
          records.length === 1
            ? "Result"
            : "Results"
        }`;
    }

    if (labelElement) {
      labelElement.textContent =
        `${formatNumber(
          records.length
        )} ${
          records.length === 1
            ? "record"
            : "records"
        } visible`;
    }

    if (!records.length) {
      container.innerHTML = `
        <div class="nexus-audit-empty">

          <i class="fa-solid fa-clock-rotate-left"></i>

          <strong>
            No Matching Records
          </strong>

          <span>
            Change the search or filters to display more audit activity.
          </span>

        </div>
      `;

      renderDetail();
      return;
    }

    if (
      !records.some(
        record =>
          record.id ===
          state.selectedId
      )
    ) {
      state.selectedId =
        records[0].id;
    }

    container.innerHTML =
      records
        .map(
          record => `
            <article
              class="nexus-audit-row ${
                record.id ===
                state.selectedId
                  ? "active"
                  : ""
              }"
              data-audit-action="inspect"
              data-audit-id="${escapeHtml(
                record.id
              )}"
            >

              <span class="nexus-audit-row-icon ${escapeHtml(
                record.severity
              )}">
                <i class="fa-solid ${escapeHtml(
                  getSeverityIcon(
                    record.severity
                  )
                )}"></i>
              </span>

              <div class="nexus-audit-row-main">

                <div class="nexus-audit-row-meta">

                  <span class="nexus-audit-severity-chip ${escapeHtml(
                    record.severity
                  )}">
                    ${escapeHtml(
                      record.severity
                    )}
                  </span>

                  <span class="nexus-audit-source-chip">
                    ${escapeHtml(
                      record.sourceLabel
                    )}
                  </span>

                  <span>
                    ${escapeHtml(
                      record.categoryLabel
                    )}
                  </span>

                </div>

                <strong>
                  ${escapeHtml(
                    record.summary
                  )}
                </strong>

                <small>
                  ${escapeHtml(
                    record.actorName
                  )}
                  •
                  ${escapeHtml(
                    formatRelativeTime(
                      record.createdAt
                    )
                  )}
                </small>

              </div>

              <i class="fa-solid fa-chevron-right"></i>

            </article>
          `
        )
        .join("");
  }

  function createInfoRow(
    label,
    value,
    note = ""
  ) {
    return `
      <div>

        <span>
          ${escapeHtml(label)}
        </span>

        <strong title="${escapeHtml(
          value
        )}">
          ${escapeHtml(value)}
        </strong>

        ${
          note
            ? `
              <small>
                ${escapeHtml(note)}
              </small>
            `
            : ""
        }

      </div>
    `;
  }

  function renderDetail() {
    const container =
      query(
        "#nexusAuditDetail"
      );

    if (!container) {
      return;
    }

    const record =
      getSelectedRecord();

    const visible =
      getVisibleLogs();

    if (
      !record ||
      !visible.some(
        item =>
          item.id ===
          record.id
      )
    ) {
      container.innerHTML = `
        <div class="nexus-audit-empty detail">

          <i class="fa-solid fa-file-shield"></i>

          <strong>
            Select an Audit Record
          </strong>

          <span>
            Choose an activity record to inspect its actor, target, action and source details.
          </span>

        </div>
      `;

      return;
    }

    container.innerHTML = `
      <header class="nexus-audit-detail-hero">

        <span class="nexus-audit-detail-icon ${escapeHtml(
          record.severity
        )}">
          <i class="fa-solid ${escapeHtml(
            getSeverityIcon(
              record.severity
            )
          )}"></i>
        </span>

        <div>

          <span class="nexus-audit-severity-chip ${escapeHtml(
            record.severity
          )}">
            ${escapeHtml(
              record.severity
            )}
          </span>

          <h3>
            ${escapeHtml(
              record.actionLabel
            )}
          </h3>

          <p>
            ${escapeHtml(
              record.sourceLabel
            )}
          </p>

        </div>

      </header>

      <section class="nexus-audit-summary-card">

        <span>
          Summary
        </span>

        <strong>
          ${escapeHtml(
            record.summary
          )}
        </strong>

      </section>

      <section class="nexus-audit-detail-section">

        <div class="nexus-audit-section-head">
          <span>Record Information</span>
          <strong>Append Only</strong>
        </div>

        <div class="nexus-audit-information-list">

          ${createInfoRow(
            "Action",
            record.action
          )}

          ${createInfoRow(
            "Category",
            record.categoryLabel,
            record.category
          )}

          ${createInfoRow(
            "Severity",
            humanize(
              record.severity
            )
          )}

          ${createInfoRow(
            "Source",
            record.sourceLabel,
            record.source
          )}

          ${createInfoRow(
            "Created",
            formatDate(
              record.createdAt
            ),
            formatRelativeTime(
              record.createdAt
            )
          )}

          ${createInfoRow(
            "Record ID",
            record.sourceId
          )}

        </div>

      </section>

      <section class="nexus-audit-detail-section">

        <div class="nexus-audit-section-head">
          <span>Authenticated Actor</span>
          <strong>${escapeHtml(
            getRoleLabel(
              record.actorRole
            )
          )}</strong>
        </div>

        <div class="nexus-audit-actor-card">

          <span class="nexus-audit-actor-avatar">
            ${escapeHtml(
              clean(
                record.actorName,
                "RG"
              )
                .split(/\s+/)
                .filter(Boolean)
                .slice(0, 2)
                .map(
                  part =>
                    part[0]
                )
                .join("")
                .toUpperCase()
            )}
          </span>

          <div>
            <strong>
              ${escapeHtml(
                record.actorName
              )}
            </strong>

            <span>
              ${escapeHtml(
                getRoleLabel(
                  record.actorRole
                )
              )}
            </span>

            <small>
              ${escapeHtml(
                record.actorUid ||
                "Actor UID unavailable"
              )}
            </small>
          </div>

        </div>

      </section>

      <section class="nexus-audit-detail-section">

        <div class="nexus-audit-section-head">
          <span>Target</span>
        </div>

        <div class="nexus-audit-information-list">

          ${createInfoRow(
            "Target Name",
            record.targetName ||
            "Not specified"
          )}

          ${createInfoRow(
            "Target Type",
            record.targetType ||
            "Not specified"
          )}

          ${createInfoRow(
            "Target ID",
            record.targetId ||
            "Not specified"
          )}

        </div>

      </section>

      <div class="nexus-audit-detail-actions">

        <button
          type="button"
          data-audit-action="copy-record"
          data-audit-id="${escapeHtml(
            record.id
          )}"
        >
          <i class="fa-solid fa-copy"></i>
          Copy Record JSON
        </button>

        ${
          record.actorUid
            ? `
              <button
                type="button"
                data-audit-action="copy-value"
                data-copy-value="${escapeHtml(
                  record.actorUid
                )}"
                data-copy-label="Actor UID"
              >
                <i class="fa-solid fa-user-shield"></i>
                Copy Actor UID
              </button>
            `
            : ""
        }

        ${
          record.targetId
            ? `
              <button
                type="button"
                data-audit-action="copy-value"
                data-copy-value="${escapeHtml(
                  record.targetId
                )}"
                data-copy-label="Target ID"
              >
                <i class="fa-solid fa-crosshairs"></i>
                Copy Target ID
              </button>
            `
            : ""
        }

      </div>
    `;
  }

  function serializeRecord(record) {
    return {
      recordId:
        record.sourceId,

      source:
        record.source,

      sourceLabel:
        record.sourceLabel,

      action:
        record.action,

      category:
        record.category,

      severity:
        record.severity,

      summary:
        record.summary,

      actor: {
        uid:
          record.actorUid,

        name:
          record.actorName,

        role:
          record.actorRole
      },

      target: {
        type:
          record.targetType,

        id:
          record.targetId,

        name:
          record.targetName
      },

      createdAt:
        record.createdAt,

      createdAtFormatted:
        formatDate(
          record.createdAt
        ),

      original:
        record.original
    };
  }

  async function copyText(
    value,
    label
  ) {
    const text =
      clean(value);

    if (!text) {
      showToast(
        `${label} is unavailable.`
      );

      return;
    }

    try {
      if (
        navigator.clipboard
          ?.writeText
      ) {
        await navigator
          .clipboard
          .writeText(text);
      } else {
        const textarea =
          document.createElement(
            "textarea"
          );

        textarea.value =
          text;

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

      showToast(
        `${label} copied.`
      );
    } catch (error) {
      console.error(
        "Audit copy failed:",
        error
      );

      showToast(
        `Could not copy ${label}.`
      );
    }
  }

  function handleInput(event) {
    if (
      event.target.id !==
      "nexusAuditSearch"
    ) {
      return;
    }

    state.search =
      clean(
        event.target.value
      );

    renderLogList();
    renderDetail();
  }

  function handleChange(event) {
    const target =
      event.target;

    switch (target.id) {
      case "nexusAuditSourceFilter":
        state.sourceFilter =
          clean(
            target.value,
            "all"
          );
        break;

      case "nexusAuditCategoryFilter":
        state.categoryFilter =
          clean(
            target.value,
            "all"
          );
        break;

      case "nexusAuditSeverityFilter":
        state.severityFilter =
          clean(
            target.value,
            "all"
          );
        break;

      case "nexusAuditActorFilter":
        state.actorFilter =
          clean(
            target.value,
            "all"
          );
        break;

      case "nexusAuditTimeFilter":
        state.timeFilter =
          clean(
            target.value,
            "all"
          );
        break;

      default:
        return;
    }

    renderLogList();
    renderDetail();
  }

  function handleClick(event) {
    const actionElement =
      event.target.closest(
        "[data-audit-action]"
      );

    if (!actionElement) {
      return;
    }

    const action =
      actionElement.dataset
        .auditAction;

    if (
      action ===
      "inspect"
    ) {
      state.selectedId =
        clean(
          actionElement.dataset
            .auditId
        );

      renderLogList();
      renderDetail();

      return;
    }

    if (
      action ===
      "copy-value"
    ) {
      void copyText(
        actionElement.dataset
          .copyValue,

        clean(
          actionElement.dataset
            .copyLabel,
          "Value"
        )
      );

      return;
    }

    if (
      action ===
      "copy-record"
    ) {
      const record =
        state.combinedLogs.find(
          item =>
            item.id ===
            clean(
              actionElement.dataset
                .auditId
            )
        );

      if (!record) {
        showToast(
          "That audit record could not be found."
        );

        return;
      }

      void copyText(
        JSON.stringify(
          serializeRecord(
            record
          ),
          null,
          2
        ),
        "Audit record"
      );

      return;
    }

    if (
      action ===
      "copy-visible"
    ) {
      const records =
        getVisibleLogs();

      if (!records.length) {
        showToast(
          "There are no visible records to copy."
        );

        return;
      }

      void copyText(
        JSON.stringify(
          records.map(
            serializeRecord
          ),
          null,
          2
        ),
        "Visible audit history"
      );
    }
  }

  function attachListeners() {
    detachListeners();

    state.auditLoaded = false;
    state.staffLoaded = false;

    state.auditRef =
      state.database
        .ref(
          "auditLogs"
        )
        .orderByChild(
          "createdAt"
        )
        .limitToLast(250);

    state.auditCallback =
      snapshot => {
        const records = [];

        snapshot.forEach(
          child => {
            records.push(
              normalizeAuditLog(
                child.key,
                child.val()
              )
            );
          }
        );

        state.auditLogs =
          records;

        state.auditLoaded =
          true;

        rebuildCombinedLogs();
      };

    state.auditRef.on(
      "value",
      state.auditCallback,
      error => {
        console.error(
          "Audit log listener failed:",
          error
        );

        state.auditLoaded =
          true;

        state.auditLogs = [];

        rebuildCombinedLogs();

        showToast(
          isPermissionDenied(error)
            ? "Firebase denied access to auditLogs."
            : "Audit records could not be loaded."
        );
      }
    );

    state.staffHistoryRef =
      state.database
        .ref(
          "roles/staffAccessHistory"
        )
        .limitToLast(100);

    state.staffHistoryCallback =
      snapshot => {
        const records = [];

        snapshot.forEach(
          child => {
            records.push(
              normalizeStaffHistory(
                child.key,
                child.val()
              )
            );
          }
        );

        state.staffLogs =
          records;

        state.staffLoaded =
          true;

        rebuildCombinedLogs();
      };

    state.staffHistoryRef.on(
      "value",
      state.staffHistoryCallback,
      error => {
        console.error(
          "Staff history listener failed:",
          error
        );

        state.staffLoaded =
          true;

        state.staffLogs = [];

        rebuildCombinedLogs();

        showToast(
          isPermissionDenied(error)
            ? "Firebase denied access to Staff & Access history."
            : "Staff access history could not be loaded."
        );
      }
    );
  }

  function detachListeners() {
    if (
      state.auditRef &&
      state.auditCallback
    ) {
      state.auditRef.off(
        "value",
        state.auditCallback
      );
    }

    if (
      state.staffHistoryRef &&
      state.staffHistoryCallback
    ) {
      state.staffHistoryRef.off(
        "value",
        state.staffHistoryCallback
      );
    }

    state.auditRef = null;
    state.auditCallback = null;

    state.staffHistoryRef = null;
    state.staffHistoryCallback = null;
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
      clean(
        api.roleId
      );

    state.auditLogs = [];
    state.staffLogs = [];
    state.combinedLogs = [];

    state.auditLoaded = false;
    state.staffLoaded = false;

    state.selectedId = "";

    state.search = "";
    state.sourceFilter = "all";
    state.categoryFilter = "all";
    state.severityFilter = "all";
    state.actorFilter = "all";
    state.timeFilter = "all";

    renderShell();

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

    attachListeners();
  }

  function cleanup() {
    detachListeners();

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
    }

    state.api = null;
    state.database = null;
    state.content = null;
    state.currentUser = null;
    state.roleId = "";

    state.auditLogs = [];
    state.staffLogs = [];
    state.combinedLogs = [];

    state.auditLoaded = false;
    state.staffLoaded = false;

    state.selectedId = "";

    state.search = "";
    state.sourceFilter = "all";
    state.categoryFilter = "all";
    state.severityFilter = "all";
    state.actorFilter = "all";
    state.timeFilter = "all";
  }

  /*
   * Shared append-only audit helper.
   *
   * This does not automatically log
   * existing Nexus actions yet.
   * Future modules can call:
   *
   * NexusAuditLogger.log({
   *   database,
   *   action: "giveaway.created",
   *   category: "giveaways",
   *   summary: "Created Summer Giveaway",
   *   severity: "success",
   *   targetType: "giveaway",
   *   targetId: giveawayId,
   *   targetName: giveawayTitle
   * });
   */
  async function appendAuditLog(
    options = {}
  ) {
    const database =
      options.database ||
      (
        typeof firebase !==
          "undefined"
          ? firebase.database()
          : null
      );

    const authenticatedUser =
      options.currentUser ||
      (
        typeof firebase !==
          "undefined"
          ? firebase.auth()
              .currentUser
          : null
      );

    if (
      !database ||
      !authenticatedUser
    ) {
      throw new Error(
        "An authenticated Firebase session is required to create an audit record."
      );
    }

    const [
      roleSnapshot,
      userSnapshot,
      playerSnapshot
    ] =
      await Promise.all([
        database
          .ref(
            `users/${authenticatedUser.uid}/role`
          )
          .once("value"),

        database
          .ref(
            `users/${authenticatedUser.uid}`
          )
          .once("value"),

        database
          .ref(
            `players/${authenticatedUser.uid}`
          )
          .once("value")
      ]);

    const role =
      normalizeRole(
        roleSnapshot.val()
      );

    if (
      role !== "owner" &&
      role !== "admin"
    ) {
      throw new Error(
        "Only approved Nexus staff may create audit records."
      );
    }

    const userRecord =
      userSnapshot.val() ||
      {};

    const playerRecord =
      playerSnapshot.val() ||
      {};

    const actorName =
      clip(
        options.actorName ||
        playerRecord.displayName ||
        userRecord.displayName ||
        authenticatedUser.displayName ||
        authenticatedUser.email ||
        "Nexus Staff",
        100
      );

    const action =
      clip(
        options.action,
        120
      );

    const category =
      clip(
        options.category,
        60
      );

    const summary =
      clip(
        options.summary,
        300
      );

    if (
      !action ||
      !category ||
      !summary
    ) {
      throw new Error(
        "Audit action, category and summary are required."
      );
    }

    const severity =
      normalizeSeverity(
        options.severity
      );

    const record = {
      action,
      category,

      actorUid:
        authenticatedUser.uid,

      actorName,

      actorRole:
        role,

      summary,

      severity,

      createdAt:
        firebase.database
          .ServerValue
          .TIMESTAMP
    };

    const targetType =
      clip(
        options.targetType,
        80
      );

    const targetId =
      clip(
        options.targetId,
        180
      );

    const targetName =
      clip(
        options.targetName,
        120
      );

    if (targetType) {
      record.targetType =
        targetType;
    }

    if (targetId) {
      record.targetId =
        targetId;
    }

    if (targetName) {
      record.targetName =
        targetName;
    }

    const reference =
      state.database
        ? state.database
            .ref(
              "auditLogs"
            )
            .push()
        : database
            .ref(
              "auditLogs"
            )
            .push();

    await reference.set(
      record
    );

    return {
      id:
        reference.key,

      ...record
    };
  }

  window.NexusAudit = {
    render,
    cleanup
  };

  window.NexusAuditLogger = {
    log:
      appendAuditLog
  };
})();
