window.RGNotificationCenter = (() => {
  let currentUid = "";
  let notifications = [];
  let initialized = false;

  function getIcon(type) {
    const icons = {
      friend_request: "👥",
      friend_accepted: "✓",
      gift_received: "🎁",
      daily_check_in: "📅",
      commendation: "★",
      comment: "💬",
      tournament: "🏆",
      prediction_reward: "🎯",
      crate_reward: "📦",
      substitution: "🚨",
      general: "🔔"
    };

    return icons[type] || icons.general;
  }

  function formatTime(timestamp) {
    const value = Number(timestamp || 0);
    if (!value) return "";

    const difference = Date.now() - value;
    const minutes = Math.floor(difference / 60000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;

    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;

    return new Date(value).toLocaleDateString();
  }

  function escapeHtml(value) {
    return String(value || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function buildHtml() {
    return `
      <div class="notification-center">

        <button
          id="notificationBell"
          class="notification-bell"
          type="button"
          aria-label="Open notifications"
          aria-expanded="false"
        >
        <span class="notification-bell-icon">
  <img src="notification-bell.PNG" alt="">
</span>

          <span
            id="notificationUnreadBadge"
            class="notification-unread-badge"
          >
            0
          </span>
        </button>

        <div
          id="notificationPanel"
          class="notification-panel"
          aria-hidden="true"
        >
          <div class="notification-panel-header">
            <div>
              <span>RIVALS GAUNTLET</span>
              <h3>Notifications</h3>
            </div>

            <button
              id="notificationMarkAll"
              class="notification-mark-all"
              type="button"
            >
              Mark all as read
            </button>
          </div>

          <div id="notificationList" class="notification-list">
            <div class="notification-empty">
              Loading notifications...
            </div>
          </div>
        </div>

      </div>
    `;
  }

  function togglePanel() {
    const bell = document.getElementById("notificationBell");
    const panel = document.getElementById("notificationPanel");

    if (!bell || !panel) return;

    const isOpen = panel.classList.toggle("show");

    bell.setAttribute("aria-expanded", String(isOpen));
    panel.setAttribute("aria-hidden", String(!isOpen));
  }

  function closePanel() {
    const bell = document.getElementById("notificationBell");
    const panel = document.getElementById("notificationPanel");

    if (!bell || !panel) return;

    panel.classList.remove("show");
    bell.setAttribute("aria-expanded", "false");
    panel.setAttribute("aria-hidden", "true");
  }

  function render(items) {
    notifications = Array.isArray(items) ? items : [];

    const badge = document.getElementById(
      "notificationUnreadBadge"
    );

    const list = document.getElementById(
      "notificationList"
    );

    if (!badge || !list) return;

    const unreadCount = notifications.filter(
      notification => !notification.read
    ).length;

    badge.innerText =
      unreadCount > 99 ? "99+" : String(unreadCount);

    badge.style.display =
      unreadCount > 0 ? "flex" : "none";

    if (!notifications.length) {
      list.innerHTML = `
        <div class="notification-empty">
          You have no notifications yet.
        </div>
      `;
      return;
    }

    list.innerHTML = notifications.map(notification => `
      <button
        class="notification-item ${
          notification.read ? "" : "unread"
        }"
        type="button"
        data-notification-id="${escapeHtml(notification.id)}"
      >
        <div class="notification-item-icon">
          ${getIcon(notification.type)}
        </div>

        <div class="notification-item-content">
          <strong>
            ${escapeHtml(
              notification.title || "Rivals Gauntlet"
            )}
          </strong>

          <p>
            ${escapeHtml(notification.message || "")}
          </p>

          <time>
            ${formatTime(notification.createdAt)}
          </time>
        </div>

        ${
          notification.read
            ? ""
            : `<div class="notification-unread-dot"></div>`
        }
      </button>
    `).join("");
  }

  function openNotification(notificationId) {
    if (!currentUid || !notificationId) return;

    const notification = notifications.find(
      item => item.id === notificationId
    );

    markNotificationRead(currentUid, notificationId)
      .then(() => {
        if (notification?.link) {
          window.location.href = notification.link;
          return;
        }

        closePanel();
      })
      .catch(error => {
        console.error(
          "Notification read error:",
          error
        );
      });
  }

  function markAllRead() {
    if (!currentUid) return;

    markAllNotificationsRead(currentUid)
      .catch(error => {
        console.error(
          "Mark all notifications read error:",
          error
        );
      });
  }

  function bindEvents() {
    const bell = document.getElementById(
      "notificationBell"
    );

    const markAllButton = document.getElementById(
      "notificationMarkAll"
    );

    const list = document.getElementById(
      "notificationList"
    );

    bell?.addEventListener("click", event => {
      event.stopPropagation();
      togglePanel();
    });

    markAllButton?.addEventListener("click", event => {
      event.stopPropagation();
      markAllRead();
    });

    list?.addEventListener("click", event => {
      const notificationItem = event.target.closest(
        "[data-notification-id]"
      );

      if (!notificationItem) return;

      openNotification(
        notificationItem.dataset.notificationId
      );
    });

    document.addEventListener("click", event => {
      const center = document.querySelector(
        ".notification-center"
      );

      if (
        center &&
        !center.contains(event.target)
      ) {
        closePanel();
      }
    });

    document.addEventListener("keydown", event => {
      if (event.key === "Escape") {
        closePanel();
      }
    });
  }

  function init(uid, mountTarget) {
    if (!uid) {
      console.error(
        "Notification center requires a user ID."
      );
      return;
    }

    const mount =
      typeof mountTarget === "string"
        ? document.querySelector(mountTarget)
        : mountTarget;

    if (!mount) {
      console.error(
        "Notification center mount element was not found."
      );
      return;
    }

    currentUid = uid;

    if (!initialized) {
      mount.innerHTML = buildHtml();
      bindEvents();
      initialized = true;
    }

    listenToNotifications(uid, render);
  }

  function destroy() {
    stopNotificationListener();

    currentUid = "";
    notifications = [];
    initialized = false;
  }

  return {
    init,
    destroy,
    close: closePanel
  };
})();
