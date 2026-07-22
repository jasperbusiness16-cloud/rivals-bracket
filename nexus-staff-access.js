(function () {
  "use strict";

  const state = {
    api: null,
    database: null,
    content: null,
    currentUser: null,
    roleId: "",

    roleTemplates: {},
    modules: {},

    usersMap: {},
    playersMap: {},
    accounts: [],
    history: [],

    usersRef: null,
    usersCallback: null,

    playersRef: null,
    playersCallback: null,

    historyRef: null,
    historyCallback: null,

    selectedUid: "",
    search: "",
    filter: "staff",
    saving: false
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
      typeof state.api.isPermissionDenied ===
        "function"
    ) {
      return state.api.isPermissionDenied(
        error
      );
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

  function formatDate(value) {
    const timestamp =
      Number(value || 0);

    if (!timestamp) {
      return "Not available";
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
      return "Not available";
    }
  }

  function normalizeRole(value) {
    const role =
      clean(
        value,
        "player"
      ).toLowerCase();

    if (
      role === "owner" ||
      role === "admin" ||
      role === "player"
    ) {
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

    return (
      labels[role] ||
      "Player"
    );
  }

  function createInitials(value) {
    return clean(
      value,
      "RG"
    )
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(
        part => part[0]
      )
      .join("")
      .toUpperCase();
  }

  function humanizePermission(permission) {
    return clean(permission)
      .replaceAll(".", " ")
      .replaceAll("_", " ")
      .replace(
        /\b\w/g,
        character =>
          character.toUpperCase()
      );
  }

  function normalizeAccount(uid) {
    const user =
      state.usersMap[uid] ||
      {};

    const player =
      state.playersMap[uid] ||
      {};

    const displayName =
      clean(
        player.displayName ||
        user.displayName ||
        user.email ||
        "Unnamed Account"
      );

    return {
      uid,

      displayName,

      profileImage:
        clean(
          player.profileImage ||
          user.profileImage
        ),

      rivalsIgn:
        clean(
          player.rivalsIgn
        ),

      rgId:
        clean(
          player.rgId ||
          user.rgId
        ),

      email:
        clean(
          user.email
        ),

      emailVerified:
        Boolean(
          user.emailVerified
        ),

      role:
        normalizeRole(
          user.role
        ),

      region:
        clean(
          player.region,
          "Unspecified"
        ),

      platform:
        clean(
          player.platform,
          "Unspecified"
        ),

      discordUsername:
        clean(
          player.discordUsername
        ),

      createdAt:
        Number(
          user.createdAt ||
          player.createdAt ||
          0
        ),

      lastLogin:
        Number(
          user.lastLogin ||
          0
        )
    };
  }

  function rebuildAccounts() {
    const ids =
      new Set([
        ...Object.keys(
          state.usersMap
        ),

        ...Object.keys(
          state.playersMap
        )
      ]);

    const roleOrder = {
      owner: 0,
      admin: 1,
      player: 2
    };

    state.accounts =
      [...ids]
        .map(normalizeAccount)
        .sort(
          (a, b) => {
            const roleDifference =
              (
                roleOrder[a.role] ??
                9
              ) -
              (
                roleOrder[b.role] ??
                9
              );

            if (
              roleDifference !== 0
            ) {
              return roleDifference;
            }

            return a.displayName
              .localeCompare(
                b.displayName,
                undefined,
                {
                  sensitivity:
                    "base"
                }
              );
          }
        );

    if (
      state.selectedUid &&
      !state.accounts.some(
        account =>
          account.uid ===
          state.selectedUid
      )
    ) {
      state.selectedUid = "";
    }

    if (
      !state.selectedUid &&
      state.accounts.length
    ) {
      const owner =
        state.accounts.find(
          account =>
            account.role ===
            "owner"
        );

      state.selectedUid =
        owner?.uid ||
        state.accounts[0].uid;
    }

    renderMetrics();
    renderDirectory();
    renderDetail();
  }

  function getSelectedAccount() {
    return (
      state.accounts.find(
        account =>
          account.uid ===
          state.selectedUid
      ) ||
      null
    );
  }

  function getVisibleAccounts() {
    const search =
      state.search
        .toLowerCase();

    return state.accounts.filter(
      account => {
        if (
          state.filter ===
            "staff" &&
          account.role ===
            "player"
        ) {
          return false;
        }

        if (
          state.filter ===
            "admins" &&
          account.role !==
            "admin"
        ) {
          return false;
        }

        if (
          state.filter ===
            "players" &&
          account.role !==
            "player"
        ) {
          return false;
        }

        if (!search) {
          return true;
        }

        const searchable = [
          account.displayName,
          account.rivalsIgn,
          account.rgId,
          account.email,
          account.discordUsername,
          account.uid,
          account.region,
          account.platform,
          account.role
        ]
          .join(" ")
          .toLowerCase();

        return searchable.includes(
          search
        );
      }
    );
  }

  function renderAvatar(
    account,
    className = ""
  ) {
    if (account.profileImage) {
      return `
        <span class="nexus-staff-avatar ${escapeHtml(
          className
        )}">
          <img
            src="${escapeHtml(
              account.profileImage
            )}"
            alt="${escapeHtml(
              account.displayName
            )}"
          >
        </span>
      `;
    }

    return `
      <span class="nexus-staff-avatar ${escapeHtml(
        className
      )}">
        ${escapeHtml(
          createInitials(
            account.displayName
          )
        )}
      </span>
    `;
  }

  function renderShell() {
    state.content.innerHTML = `
      <section class="nexus-staff-access">

        <header class="nexus-staff-hero">

          <div>
            <span class="nexus-staff-eyebrow">
              Owner Administration
            </span>

            <h2>
              Staff & Access
            </h2>

            <p>
              Promote existing Rivals Gauntlet accounts to Administrator, remove administrative access and review the exact Nexus permissions assigned to each role.
            </p>
          </div>

          <span class="nexus-staff-owner-chip">
            <i class="fa-solid fa-lock"></i>
            Owner Only
          </span>

        </header>

        <div class="nexus-staff-security-note">

          <i class="fa-solid fa-shield-halved"></i>

          <div>
            <strong>
              Server-Enforced Role Protection
            </strong>

            <span>
              Firebase now allows only the Owner to change account roles. Administrators cannot promote themselves, create another Owner or modify the role templates stored in Firebase.
            </span>
          </div>

        </div>

        <section class="nexus-staff-metrics">

          <article>
            <span>Total Staff</span>
            <strong id="nexusStaffMetricTotal">0</strong>
            <small>Owner and administrators</small>
          </article>

          <article>
            <span>Administrators</span>
            <strong id="nexusStaffMetricAdmins">0</strong>
            <small>Accounts with Nexus access</small>
          </article>

          <article>
            <span>Player Accounts</span>
            <strong id="nexusStaffMetricPlayers">0</strong>
            <small>Eligible for promotion</small>
          </article>

          <article>
            <span>Access Changes</span>
            <strong id="nexusStaffMetricHistory">0</strong>
            <small>Recorded role changes</small>
          </article>

        </section>

        <section class="nexus-staff-workspace">

          <article class="nexus-staff-panel nexus-staff-directory-panel">

            <header class="nexus-staff-panel-head">

              <div>
                <span>Account Directory</span>
                <h3>Staff Management</h3>
              </div>

              <strong id="nexusStaffVisibleCount">
                0 Results
              </strong>

            </header>

            <div class="nexus-staff-tools">

              <label class="nexus-staff-search">

                <i class="fa-solid fa-magnifying-glass"></i>

                <input
                  id="nexusStaffSearch"
                  type="search"
                  placeholder="Search name, email, RG ID, IGN or UID..."
                  autocomplete="off"
                >

              </label>

              <select id="nexusStaffFilter">
                <option value="staff">
                  Current Staff
                </option>

                <option value="admins">
                  Administrators
                </option>

                <option value="players">
                  Player Candidates
                </option>

                <option value="all">
                  All Accounts
                </option>
              </select>

            </div>

            <div
              id="nexusStaffDirectory"
              class="nexus-staff-directory"
            >
              <div class="nexus-staff-empty">
                <i class="fa-solid fa-spinner fa-spin"></i>
                <strong>Loading Accounts</strong>
              </div>
            </div>

          </article>

          <aside
            id="nexusStaffDetail"
            class="nexus-staff-panel nexus-staff-detail-panel"
          ></aside>

        </section>

        <section class="nexus-staff-panel nexus-staff-permissions-panel">

          <header class="nexus-staff-panel-head">

            <div>
              <span>Current Nexus Template</span>
              <h3>Permission Matrix</h3>
            </div>

            <span class="nexus-staff-readonly-chip">
              Read Only
            </span>

          </header>

          <div class="nexus-staff-permission-note">

            <i class="fa-solid fa-circle-info"></i>

            <span>
              These permissions come directly from the current
              <code>ROLE_TEMPLATES</code>
              object in
              <code>nexus-control.js</code>.
              Individual permission editing remains disabled because your Firebase Database Rules currently authorize protected writes by account role, not by individual Nexus permission.
            </span>

          </div>

          <div
            id="nexusStaffPermissionMatrix"
            class="nexus-staff-permission-matrix"
          ></div>

        </section>

        <section class="nexus-staff-panel nexus-staff-history-panel">

          <header class="nexus-staff-panel-head">

            <div>
              <span>Security Record</span>
              <h3>Access History</h3>
            </div>

            <span>
              Last 50 Changes
            </span>

          </header>

          <div
            id="nexusStaffHistory"
            class="nexus-staff-history"
          >
            <div class="nexus-staff-empty">
              <i class="fa-solid fa-spinner fa-spin"></i>
              <strong>Loading History</strong>
            </div>
          </div>

        </section>

      </section>
    `;

    renderMetrics();
    renderDirectory();
    renderDetail();
    renderPermissionMatrix();
    renderHistory();
  }

  function renderMetrics() {
    const staff =
      state.accounts.filter(
        account =>
          account.role ===
            "owner" ||
          account.role ===
            "admin"
      ).length;

    const administrators =
      state.accounts.filter(
        account =>
          account.role ===
          "admin"
      ).length;

    const players =
      state.accounts.filter(
        account =>
          account.role ===
          "player"
      ).length;

    const values = {
      "#nexusStaffMetricTotal":
        staff,

      "#nexusStaffMetricAdmins":
        administrators,

      "#nexusStaffMetricPlayers":
        players,

      "#nexusStaffMetricHistory":
        state.history.length
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

  function renderDirectory() {
    const container =
      query(
        "#nexusStaffDirectory"
      );

    const countElement =
      query(
        "#nexusStaffVisibleCount"
      );

    if (!container) {
      return;
    }

    const accounts =
      getVisibleAccounts();

    if (countElement) {
      countElement.textContent =
        `${formatNumber(
          accounts.length
        )} ${
          accounts.length === 1
            ? "Result"
            : "Results"
        }`;
    }

    if (!accounts.length) {
      container.innerHTML = `
        <div class="nexus-staff-empty">

          <i class="fa-solid fa-user-slash"></i>

          <strong>
            No Matching Accounts
          </strong>

          <span>
            Change the search or account filter.
          </span>

        </div>
      `;

      return;
    }

    container.innerHTML =
      accounts
        .map(
          account => `
            <article
              class="nexus-staff-account-row ${
                account.uid ===
                state.selectedUid
                  ? "active"
                  : ""
              }"
              data-staff-action="inspect"
              data-staff-uid="${escapeHtml(
                account.uid
              )}"
            >

              ${renderAvatar(
                account
              )}

              <div class="nexus-staff-account-main">

                <div>
                  <strong>
                    ${escapeHtml(
                      account.displayName
                    )}
                  </strong>

                  <span class="nexus-staff-role-chip ${escapeHtml(
                    account.role
                  )}">
                    ${escapeHtml(
                      getRoleLabel(
                        account.role
                      )
                    )}
                  </span>
                </div>

                <span>
                  ${escapeHtml(
                    account.email ||
                    "No email available"
                  )}
                </span>

                <small>
                  ${escapeHtml(
                    account.rivalsIgn ||
                    "No Rivals IGN"
                  )}

                  ${
                    account.rgId
                      ? ` • ${escapeHtml(
                          account.rgId
                        )}`
                      : ""
                  }
                </small>

              </div>

              <i class="fa-solid fa-chevron-right"></i>

            </article>
          `
        )
        .join("");
  }

  function renderDetail() {
    const container =
      query(
        "#nexusStaffDetail"
      );

    if (!container) {
      return;
    }

    const account =
      getSelectedAccount();

    if (!account) {
      container.innerHTML = `
        <div class="nexus-staff-empty detail">

          <i class="fa-solid fa-user-shield"></i>

          <strong>
            Select an Account
          </strong>

          <span>
            Choose an account to inspect or modify its Nexus role.
          </span>

        </div>
      `;

      return;
    }

    const isOwner =
      account.role ===
      "owner";

    const isAdmin =
      account.role ===
      "admin";

    const isSelf =
      account.uid ===
      state.currentUser?.uid;

    container.innerHTML = `
      <header class="nexus-staff-detail-hero">

        ${renderAvatar(
          account,
          "large"
        )}

        <div>

          <span class="nexus-staff-role-chip ${escapeHtml(
            account.role
          )}">
            ${escapeHtml(
              getRoleLabel(
                account.role
              )
            )}
          </span>

          <h3>
            ${escapeHtml(
              account.displayName
            )}
          </h3>

          <p>
            ${escapeHtml(
              account.rivalsIgn ||
              account.email ||
              "Account profile"
            )}
          </p>

        </div>

      </header>

      ${
        isOwner
          ? `
            <div class="nexus-staff-owner-lock">

              <i class="fa-solid fa-crown"></i>

              <div>
                <strong>
                  Owner Role Locked
                </strong>

                <span>
                  Nexus does not expose controls that demote, replace or create another Owner.
                </span>
              </div>

            </div>
          `
          : ""
      }

      <section class="nexus-staff-detail-section">

        <div class="nexus-staff-section-head">
          <span>Account Information</span>
          <strong>Read Only</strong>
        </div>

        <div class="nexus-staff-information-list">

          ${createInfoRow(
            "Email",
            account.email ||
            "Not available",
            account.emailVerified
              ? "Verified"
              : "Not verified"
          )}

          ${createInfoRow(
            "Rivals IGN",
            account.rivalsIgn ||
            "Not set"
          )}

          ${createInfoRow(
            "RG ID",
            account.rgId ||
            "Not assigned"
          )}

          ${createInfoRow(
            "Region",
            account.region
          )}

          ${createInfoRow(
            "Platform",
            account.platform
          )}

          ${createInfoRow(
            "Created",
            formatDate(
              account.createdAt
            )
          )}

          ${createInfoRow(
            "Last Login",
            formatDate(
              account.lastLogin
            )
          )}

          ${createInfoRow(
            "Firebase UID",
            account.uid
          )}

        </div>

      </section>

      <section class="nexus-staff-detail-section">

        <div class="nexus-staff-section-head">
          <span>Access Controls</span>
          <strong>Owner Authorized</strong>
        </div>

        <div class="nexus-staff-access-summary">

          <i class="fa-solid ${
            isOwner
              ? "fa-crown"
              : (
                  isAdmin
                    ? "fa-user-shield"
                    : "fa-user"
                )
          }"></i>

          <div>
            <span>Current Role</span>

            <strong>
              ${escapeHtml(
                getRoleLabel(
                  account.role
                )
              )}
            </strong>

            <small>
              ${
                isOwner
                  ? "Full Nexus and Firebase administrative access."
                  : (
                      isAdmin
                        ? "Receives the Administrator permissions defined in ROLE_TEMPLATES."
                        : "Standard player account with no Nexus Control Center access."
                    )
              }
            </small>
          </div>

        </div>

        <div class="nexus-staff-detail-actions">

          <button
            type="button"
            data-staff-action="copy"
            data-copy-value="${escapeHtml(
              account.uid
            )}"
            data-copy-label="UID"
          >
            <i class="fa-solid fa-copy"></i>
            Copy UID
          </button>

          ${
            !isOwner &&
            !isAdmin
              ? `
                <button
                  class="primary"
                  type="button"
                  data-staff-action="promote"
                  data-staff-uid="${escapeHtml(
                    account.uid
                  )}"
                >
                  <i class="fa-solid fa-user-shield"></i>
                  Grant Administrator Access
                </button>
              `
              : ""
          }

          ${
            isAdmin
              ? `
                <button
                  class="danger"
                  type="button"
                  data-staff-action="demote"
                  data-staff-uid="${escapeHtml(
                    account.uid
                  )}"
                >
                  <i class="fa-solid fa-user-minus"></i>
                  Remove Administrator Access
                </button>
              `
              : ""
          }

        </div>

        ${
          isSelf
            ? `
              <p class="nexus-staff-self-note">
                <i class="fa-solid fa-circle-info"></i>
                This is your currently authenticated Nexus account.
              </p>
            `
            : ""
        }

      </section>
    `;
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

  function roleHasPermission(
    roleId,
    permission
  ) {
    const permissions =
      state.roleTemplates[
        roleId
      ]?.permissions ||
      [];

    return (
      permissions.includes("*") ||
      permissions.includes(
        permission
      )
    );
  }

  function getPermissionRows() {
    const represented =
      new Set();

    const rows =
      Object.entries(
        state.modules
      )
        .map(
          ([
            moduleId,
            module
          ]) => {
            const permission =
              clean(
                module.permission
              );

            represented.add(
              permission
            );

            return {
              id: moduleId,

              title:
                clean(
                  module.title,
                  moduleId
                ),

              permission,

              breadcrumb:
                clean(
                  module.breadcrumb
                )
            };
          }
        )
        .filter(
          row =>
            row.permission
        );

    const templatePermissions =
      new Set();

    Object.values(
      state.roleTemplates
    ).forEach(
      role => {
        (
          role?.permissions ||
          []
        ).forEach(
          permission => {
            if (
              permission !== "*"
            ) {
              templatePermissions.add(
                permission
              );
            }
          }
        );
      }
    );

    templatePermissions.forEach(
      permission => {
        if (
          represented.has(
            permission
          )
        ) {
          return;
        }

        rows.push({
          id:
            permission,

          title:
            humanizePermission(
              permission
            ),

          permission,

          breadcrumb:
            "Additional Role Permission"
        });
      }
    );

    return rows;
  }

  function renderPermissionMatrix() {
    const container =
      query(
        "#nexusStaffPermissionMatrix"
      );

    if (!container) {
      return;
    }

    const rows =
      getPermissionRows();

    if (!rows.length) {
      container.innerHTML = `
        <div class="nexus-staff-empty">

          <i class="fa-solid fa-key"></i>

          <strong>
            No Permission Templates Found
          </strong>

        </div>
      `;

      return;
    }

    container.innerHTML = `
      <div class="nexus-staff-permission-table">

        <div class="nexus-staff-permission-row header">

          <span>Module / Capability</span>
          <span>Permission</span>
          <span>Owner</span>
          <span>Administrator</span>

        </div>

        ${rows
          .map(
            row => `
              <div class="nexus-staff-permission-row">

                <div>
                  <strong>
                    ${escapeHtml(
                      row.title
                    )}
                  </strong>

                  <small>
                    ${escapeHtml(
                      row.breadcrumb
                    )}
                  </small>
                </div>

                <code>
                  ${escapeHtml(
                    row.permission
                  )}
                </code>

                <span class="nexus-staff-permission-state enabled">
                  <i class="fa-solid fa-check"></i>
                  Allowed
                </span>

                <span class="nexus-staff-permission-state ${
                  roleHasPermission(
                    "admin",
                    row.permission
                  )
                    ? "enabled"
                    : "blocked"
                }">

                  <i class="fa-solid ${
                    roleHasPermission(
                      "admin",
                      row.permission
                    )
                      ? "fa-check"
                      : "fa-lock"
                  }"></i>

                  ${
                    roleHasPermission(
                      "admin",
                      row.permission
                    )
                      ? "Allowed"
                      : "Blocked"
                  }

                </span>

              </div>
            `
          )
          .join("")}

      </div>
    `;
  }

  function normalizeHistory(
    id,
    value
  ) {
    const record =
      value || {};

    return {
      id,

      targetUid:
        clean(
          record.targetUid
        ),

      targetName:
        clean(
          record.targetName,
          "Unknown Account"
        ),

      previousRole:
        normalizeRole(
          record.previousRole
        ),

      newRole:
        normalizeRole(
          record.newRole
        ),

      changedByUid:
        clean(
          record.changedByUid
        ),

      changedByName:
        clean(
          record.changedByName,
          "Owner"
        ),

      createdAt:
        Number(
          record.createdAt ||
          0
        )
    };
  }

  function renderHistory() {
    const container =
      query(
        "#nexusStaffHistory"
      );

    if (!container) {
      return;
    }

    if (!state.history.length) {
      container.innerHTML = `
        <div class="nexus-staff-empty">

          <i class="fa-solid fa-clock-rotate-left"></i>

          <strong>
            No Access Changes Yet
          </strong>

          <span>
            Future promotions and demotions will be recorded here.
          </span>

        </div>
      `;

      return;
    }

    container.innerHTML =
      state.history
        .map(
          record => `
            <article class="nexus-staff-history-row">

              <span class="nexus-staff-history-icon ${
                record.newRole ===
                "admin"
                  ? "promote"
                  : "demote"
              }">

                <i class="fa-solid ${
                  record.newRole ===
                  "admin"
                    ? "fa-user-shield"
                    : "fa-user-minus"
                }"></i>

              </span>

              <div>

                <strong>
                  ${escapeHtml(
                    record.targetName
                  )}
                </strong>

                <span>
                  ${escapeHtml(
                    getRoleLabel(
                      record.previousRole
                    )
                  )}
                  →
                  ${escapeHtml(
                    getRoleLabel(
                      record.newRole
                    )
                  )}
                </span>

                <small>
                  Changed by
                  ${escapeHtml(
                    record.changedByName
                  )}
                  •
                  ${escapeHtml(
                    formatDate(
                      record.createdAt
                    )
                  )}
                </small>

              </div>

              <button
                type="button"
                data-staff-action="copy"
                data-copy-value="${escapeHtml(
                  record.targetUid
                )}"
                data-copy-label="Target UID"
              >
                <i class="fa-solid fa-copy"></i>
              </button>

            </article>
          `
        )
        .join("");
  }

  function setButtonLoading(
    button,
    loading,
    label = ""
  ) {
    if (!button) {
      return;
    }

    if (loading) {
      button.dataset.originalHtml =
        button.innerHTML;

      button.disabled = true;

      button.innerHTML = `
        <i class="fa-solid fa-spinner fa-spin"></i>
        ${escapeHtml(label)}
      `;

      return;
    }

    button.disabled = false;

    if (
      button.dataset.originalHtml
    ) {
      button.innerHTML =
        button.dataset.originalHtml;

      delete button.dataset
        .originalHtml;
    }
  }

  async function changeAccountRole(
    uid,
    newRole,
    button
  ) {
    if (state.saving) {
      return;
    }

    if (
      state.roleId !==
      "owner"
    ) {
      showToast(
        "Only the Owner can change staff access."
      );

      return;
    }

    const account =
      state.accounts.find(
        item =>
          item.uid === uid
      );

    if (!account) {
      showToast(
        "That account could not be found."
      );

      return;
    }

    if (
      account.role ===
      "owner"
    ) {
      showToast(
        "The Owner role is locked."
      );

      return;
    }

    if (
      newRole !==
        "admin" &&
      newRole !==
        "player"
    ) {
      showToast(
        "Unsupported role change."
      );

      return;
    }

    if (
      account.role ===
      newRole
    ) {
      showToast(
        "That account already has this role."
      );

      return;
    }

    const actionLabel =
      newRole === "admin"
        ? "grant Administrator access"
        : "remove Administrator access";

    const confirmed =
      window.confirm(
        `${actionLabel} for "${account.displayName}"?\n\n` +
        (
          newRole === "admin"
            ? "This account will gain access to every module currently allowed by the Administrator ROLE_TEMPLATES entry."
            : "Firebase will immediately block this account from administrator-only database paths."
        )
      );

    if (!confirmed) {
      return;
    }

    state.saving = true;

    setButtonLoading(
      button,
      true,
      newRole === "admin"
        ? "Granting Access..."
        : "Removing Access..."
    );

    try {
      const historyKey =
        state.database
          .ref(
            "roles/staffAccessHistory"
          )
          .push()
          .key;

      if (!historyKey) {
        throw new Error(
          "Could not create an access history ID."
        );
      }

      const currentOwner =
        state.accounts.find(
          item =>
            item.uid ===
            state.currentUser?.uid
        );

      const timestamp =
        firebase.database
          .ServerValue
          .TIMESTAMP;

      const updates = {
        [`users/${uid}/role`]:
          newRole,

        [`roles/staffAccessHistory/${historyKey}`]:
          {
            targetUid:
              uid,

            targetName:
              account.displayName,

            previousRole:
              account.role,

            newRole,

            changedByUid:
              state.currentUser
                ?.uid ||
              "",

            changedByName:
              currentOwner
                ?.displayName ||
              state.currentUser
                ?.email ||
              "Owner",

            createdAt:
              timestamp
          }
      };

      await state.database
        .ref()
        .update(updates);

      showToast(
        newRole === "admin"
          ? `${account.displayName} is now an Administrator.`
          : `${account.displayName}'s Administrator access was removed.`
      );
    } catch (error) {
      console.error(
        "Staff access update failed:",
        error
      );

      showToast(
        isPermissionDenied(error)
          ? "Firebase rules blocked the role change. Confirm you are signed in as the Owner."
          : (
              error?.message ||
              "The account role could not be changed."
            )
      );
    } finally {
      state.saving = false;

      setButtonLoading(
        button,
        false
      );
    }
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
        "Copy failed:",
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
      "nexusStaffSearch"
    ) {
      return;
    }

    state.search =
      clean(
        event.target.value
      );

    renderDirectory();
  }

  function handleChange(event) {
    if (
      event.target.id !==
      "nexusStaffFilter"
    ) {
      return;
    }

    state.filter =
      clean(
        event.target.value,
        "staff"
      );

    renderDirectory();
  }

  function handleClick(event) {
    const actionElement =
      event.target.closest(
        "[data-staff-action]"
      );

    if (!actionElement) {
      return;
    }

    const action =
      actionElement.dataset
        .staffAction;

    const uid =
      clean(
        actionElement.dataset
          .staffUid
      );

    if (
      action ===
      "inspect"
    ) {
      state.selectedUid =
        uid;

      renderDirectory();
      renderDetail();

      return;
    }

    if (
      action ===
      "copy"
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
      "promote"
    ) {
      void changeAccountRole(
        uid,
        "admin",
        actionElement
      );

      return;
    }

    if (
      action ===
      "demote"
    ) {
      void changeAccountRole(
        uid,
        "player",
        actionElement
      );
    }
  }

  function attachListeners() {
    detachListeners();

    state.usersRef =
      state.database.ref(
        "users"
      );

    state.usersCallback =
      snapshot => {
        state.usersMap =
          snapshot.val() ||
          {};

        rebuildAccounts();
      };

    state.usersRef.on(
      "value",
      state.usersCallback,
      error => {
        console.error(
          "Staff users listener failed:",
          error
        );

        showLoadError(
          error,
          "users"
        );
      }
    );

    state.playersRef =
      state.database.ref(
        "players"
      );

    state.playersCallback =
      snapshot => {
        state.playersMap =
          snapshot.val() ||
          {};

        rebuildAccounts();
      };

    state.playersRef.on(
      "value",
      state.playersCallback,
      error => {
        console.error(
          "Staff players listener failed:",
          error
        );

        showLoadError(
          error,
          "players"
        );
      }
    );

    state.historyRef =
      state.database
        .ref(
          "roles/staffAccessHistory"
        )
        .limitToLast(50);

    state.historyCallback =
      snapshot => {
        const history = [];

        snapshot.forEach(
          child => {
            history.push(
              normalizeHistory(
                child.key,
                child.val()
              )
            );
          }
        );

        state.history =
          history.sort(
            (a, b) =>
              b.createdAt -
              a.createdAt
          );

        renderMetrics();
        renderHistory();
      };

    state.historyRef.on(
      "value",
      state.historyCallback,
      error => {
        console.error(
          "Staff history listener failed:",
          error
        );

        const container =
          query(
            "#nexusStaffHistory"
          );

        if (container) {
          container.innerHTML = `
            <div class="nexus-staff-empty error">

              <i class="fa-solid fa-triangle-exclamation"></i>

              <strong>
                History Read Failed
              </strong>

              <span>
                ${
                  isPermissionDenied(
                    error
                  )
                    ? "Firebase denied access to roles/staffAccessHistory."
                    : escapeHtml(
                        error?.message ||
                        "Unknown error"
                      )
                }
              </span>

            </div>
          `;
        }
      }
    );
  }

  function showLoadError(
    error,
    path
  ) {
    const container =
      query(
        "#nexusStaffDirectory"
      );

    if (!container) {
      return;
    }

    container.innerHTML = `
      <div class="nexus-staff-empty error">

        <i class="fa-solid fa-triangle-exclamation"></i>

        <strong>
          Staff Directory Read Failed
        </strong>

        <span>
          ${
            isPermissionDenied(
              error
            )
              ? `Firebase denied access to ${escapeHtml(
                  path
                )}.`
              : escapeHtml(
                  error?.message ||
                  "Unknown error"
                )
          }
        </span>

      </div>
    `;
  }

  function detachListeners() {
    if (
      state.usersRef &&
      state.usersCallback
    ) {
      state.usersRef.off(
        "value",
        state.usersCallback
      );
    }

    if (
      state.playersRef &&
      state.playersCallback
    ) {
      state.playersRef.off(
        "value",
        state.playersCallback
      );
    }

    if (
      state.historyRef &&
      state.historyCallback
    ) {
      state.historyRef.off(
        "value",
        state.historyCallback
      );
    }

    state.usersRef = null;
    state.usersCallback = null;

    state.playersRef = null;
    state.playersCallback = null;

    state.historyRef = null;
    state.historyCallback = null;
  }

  function renderAccessDenied() {
    state.content.innerHTML = `
      <div class="nexus-staff-denied">

        <i class="fa-solid fa-lock"></i>

        <span>
          Staff & Access
        </span>

        <h2>
          Owner Access Required
        </h2>

        <p>
          Only the Rivals Gauntlet Owner may promote accounts, remove Administrator access or inspect the full Staff & Access workspace.
        </p>

      </div>
    `;
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

    state.roleTemplates =
      api.roleTemplates ||
      {};

    state.modules =
      api.modules ||
      {};

    state.usersMap = {};
    state.playersMap = {};
    state.accounts = [];
    state.history = [];

    state.selectedUid = "";
    state.search = "";
    state.filter = "staff";
    state.saving = false;

    if (
      state.roleId !==
      "owner"
    ) {
      renderAccessDenied();
      return;
    }

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

    state.roleTemplates = {};
    state.modules = {};

    state.usersMap = {};
    state.playersMap = {};
    state.accounts = [];
    state.history = [];

    state.selectedUid = "";
    state.search = "";
    state.filter = "staff";
    state.saving = false;
  }

  window.NexusStaffAccess = {
    render,
    cleanup
  };
})();
