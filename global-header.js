(() => {
  "use strict";

  if (window.RG_GLOBAL_HEADER_LOADED) return;
  window.RG_GLOBAL_HEADER_LOADED = true;

  const mount = document.getElementById("globalHeader");

  if (!mount) {
    console.error('Missing <div id="globalHeader"></div>');
    return;
  }

  const currentFile =
    window.location.pathname.split("/").pop().toLowerCase() ||
    "index.html";

  function isActive(section) {
    if (section === "home") {
      return currentFile === "index.html" ||
        currentFile.includes("home");
    }

    return currentFile.includes(section);
  }

  const styles = document.createElement("style");

  styles.id = "globalHeaderStyles";

  styles.textContent = `
    :root {
      --gh-text: var(--text, #f7f4ff);
      --gh-muted: var(--muted, #aaa4b9);
      --gh-dim: var(--dim, #746e82);
      --gh-border: var(--border, rgba(255,255,255,.09));
      --gh-purple: var(--purple, #a855f7);
      --gh-purple2: var(--purple2, #c084fc);
      --gh-shadow: var(--shadow, 0 24px 70px rgba(0,0,0,.42));
      --gh-max: var(--max, 1500px);
    }

    body.global-menu-open,
    body.global-drawer-open {
      overflow: hidden;
    }

    #globalHeader,
    #globalFriendsRoot {
      font-family: "Rajdhani", Arial, sans-serif;
      color: var(--gh-text);
    }

    #globalHeader *,
    #globalFriendsRoot * {
      box-sizing: border-box;
    }

    #globalHeader a,
    #globalFriendsRoot a {
      color: inherit;
      text-decoration: none;
    }

    #globalHeader button,
    #globalFriendsRoot button {
      color: inherit;
      font: inherit;
    }

    #globalHeader img,
    #globalFriendsRoot img {
      display: block;
      max-width: 100%;
    }

    #globalHeader .global-shell {
      width: min(calc(100% - 48px), var(--gh-max));
      margin: 0 auto;
    }

    #globalHeader header {
      position: sticky;
      top: 0;
      z-index: 2000;
      border-bottom: 1px solid var(--gh-border);
      background: rgba(8,8,13,.9);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
    }

    #globalHeader .header-inner {
      min-height: 78px;
      display: flex;
      align-items: center;
      gap: 26px;
    }

    #globalHeader .brand {
      display: flex;
      align-items: center;
      gap: 12px;
      white-space: nowrap;
    }

    #globalHeader .brand-mark {
      width: 38px;
      height: 38px;
      display: grid;
      place-items: center;
      flex: 0 0 38px;
      border: 1px solid rgba(192,132,252,.5);
      background:
        linear-gradient(
          135deg,
          rgba(168,85,247,.22),
          rgba(109,40,217,.05)
        );
      clip-path:
        polygon(
          18% 0,
          82% 0,
          100% 18%,
          100% 82%,
          82% 100%,
          18% 100%,
          0 82%,
          0 18%
        );
      font-weight: 800;
    }

    #globalHeader .brand-copy {
      line-height: .88;
    }

    #globalHeader .brand-copy strong {
      display: block;
      font-size: 16px;
      letter-spacing: 1.2px;
    }

    #globalHeader .brand-copy span {
      display: block;
      margin-top: 6px;
      color: var(--gh-dim);
      font-size: 9px;
      font-weight: 800;
      letter-spacing: 2.5px;
    }

    #globalHeader .mobile-toggle {
      display: none;
      width: 44px;
      height: 44px;
      border: 1px solid var(--gh-border);
      border-radius: 10px;
      background: rgba(255,255,255,.03);
      cursor: pointer;
    }

    #globalHeader nav {
      min-height: 78px;
      display: flex;
      align-items: stretch;
      gap: 4px;
      flex: 1;
    }

    #globalHeader nav a {
      position: relative;
      display: flex;
      align-items: center;
      padding: 0 12px;
      color: var(--gh-muted);
      font-size: 14px;
      font-weight: 800;
      letter-spacing: .65px;
      text-transform: uppercase;
    }

    #globalHeader nav a:hover,
    #globalHeader nav a.active {
      color: #fff;
    }

    #globalHeader nav a.active::after {
      content: "";
      position: absolute;
      left: 12px;
      right: 12px;
      bottom: -1px;
      height: 3px;
      border-radius: 99px 99px 0 0;
      background:
        linear-gradient(
          90deg,
          var(--gh-purple),
          var(--gh-purple2)
        );
      box-shadow: 0 0 18px rgba(168,85,247,.7);
    }

    #globalHeader .header-actions {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    #globalHeader .points {
      height: 46px;
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 0 4px;
      flex-shrink: 0;
    }

    #globalHeader .points-icon {
      width: 34px;
      height: 34px;
      display: grid;
      place-items: center;
      flex: 0 0 34px;
    }

    #globalHeader .points-icon img {
      width: 34px;
      height: 34px;
      object-fit: contain;
    }

    #globalHeader .points-copy {
      line-height: 1;
    }

    #globalHeader .points-copy span {
      display: block;
      color: var(--gh-dim);
      font-size: 9px;
      font-weight: 800;
      letter-spacing: 1.3px;
    }

    #globalHeader .points-copy strong {
      display: block;
      margin-top: 5px;
      font-size: 18px;
      white-space: nowrap;
    }

    #globalHeader .header-square-button,
#globalHeader .notification-bell{
    position:relative;
    width:46px;
    height:46px;
    display:grid;
    place-items:center;
    padding:0;
    overflow:hidden;

    border:none;
    background:transparent;
    border-radius:12px;

    cursor:pointer;
}

#globalHeader .header-square-button:hover,
#globalHeader .notification-bell:hover{
    background:rgba(255,255,255,.04);
}

    #globalHeader .header-square-button img,
    #globalHeader .notification-bell-icon img {
      width: 36px;
      height: 36px;
      object-fit: contain;
    }

    #globalHeader #friendsButton img {
      width: 48px;
      height: 48px;
      max-width: none;
    }

    #globalHeader .header-badge,
    #globalHeader .notification-unread-badge {
      position: absolute;
      top: -6px;
      right: -6px;
      min-width: 20px;
      height: 20px;
      display: none;
      align-items: center;
      justify-content: center;
      padding: 0 5px;
      border: 2px solid #08080d;
      border-radius: 999px;
      background: var(--gh-purple);
      color: #fff;
      font-size: 10px;
      font-weight: 800;
    }

    #globalHeader .account {
      position: relative;
    }

    #globalHeader .account-btn {
      height: 52px;
      min-width:205px;
      max-width: 240px;
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 0 8px 0 4px;
      border: 0;
      border-radius: 12px;
      background: transparent;
      cursor: pointer;
      text-align: left;
    }

    #globalHeader .account-btn:hover {
      background: rgba(255,255,255,.035);
    }

    #globalHeader .avatar,
    #globalHeader .avatar-fallback {
      width: 44px;
      height: 44px;
      flex: 0 0 44px;
      border-radius: 12px;
      object-fit: cover;
      border: 0;
      background: #20182e;
    }

    #globalHeader .avatar-fallback {
      display: grid;
      place-items: center;
      color: var(--gh-purple2);
      font-weight: 800;
    }

    #globalHeader .account-copy {
      min-width: 0;
      flex: 1;
      line-height: 1;
    }

    #globalHeader .account-copy span {
      display: block;
      color: var(--gh-dim);
      font-size: 9px;
      font-weight: 800;
      letter-spacing: 1.2px;
    }

    #globalHeader .account-copy strong {
      display: block;
      max-width: 145px;
      margin-top: 5px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    #globalHeader .account-chevron {
      color: var(--gh-dim);
      transition: .18s;
    }

    #globalHeader
    .account-btn[aria-expanded="true"]
    .account-chevron {
      transform: rotate(180deg);
      color: var(--gh-purple2);
    }

    #globalHeader .account-menu {
      position: fixed;
      top: 72px;
      right: 16px;
      z-index: 2300;
      width: 250px;
      max-width: calc(100vw - 32px);
      padding: 9px;
      border: 1px solid rgba(168,85,247,.35);
      border-radius: 14px;
      background: rgba(15,14,23,.99);
      box-shadow: var(--gh-shadow);
      opacity: 0;
      visibility: hidden;
      transform: translateY(-8px);
      transition: .18s;
    }

    #globalHeader .account-menu.show {
      opacity: 1;
      visibility: visible;
      transform: none;
    }

    #globalHeader .account-menu a,
    #globalHeader .account-menu button {
      width: 100%;
      min-height: 46px;
      display: flex;
      align-items: center;
      padding: 0 13px;
      border: 0;
      border-radius: 9px;
      background: none;
      color: var(--gh-muted);
      cursor: pointer;
    }

    #globalHeader .account-menu a:hover,
    #globalHeader .account-menu button:hover {
      color: #fff;
      background: rgba(168,85,247,.1);
    }

    #globalHeader .auth-links {
      display: none;
      gap: 8px;
    }

    #globalHeader .auth-links.show {
      display: flex;
    }

    #globalHeader .auth-links a {
      height: 42px;
      display: flex;
      align-items: center;
      padding: 0 14px;
      border: 1px solid var(--gh-border);
      border-radius: 10px;
      font-size: 12px;
      font-weight: 800;
      text-transform: uppercase;
    }

    #globalHeader .auth-links a:last-child {
      border-color: rgba(168,85,247,.45);
      background: rgba(168,85,247,.12);
    }

    #globalHeader #globalNotificationMount {
      position: relative;
    }

    #globalHeader .notification-center {
      position: relative;
    }

    #globalHeader .notification-bell-icon {
      display: grid;
      place-items: center;
    }

    #globalHeader .notification-panel {
      position: absolute;
      top: 58px;
      right: 0;
      width: min(390px, calc(100vw - 28px));
      overflow: hidden;
      border: 1px solid rgba(168,85,247,.35);
      border-radius: 16px;
      background: rgba(15,14,23,.99);
      box-shadow: var(--gh-shadow);
      opacity: 0;
      visibility: hidden;
      transform: translateY(-8px);
      transition: .18s;
    }

    #globalHeader .notification-panel.show {
      opacity: 1;
      visibility: visible;
      transform: none;
    }

    #globalHeader .notification-panel-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      padding: 18px;
      border-bottom: 1px solid var(--gh-border);
    }

    #globalHeader .notification-panel-header span {
      color: var(--gh-purple2);
      font-size: 9px;
      font-weight: 800;
      letter-spacing: 1.5px;
    }

    #globalHeader .notification-panel-header h3 {
      margin: 3px 0 0;
      font-size: 20px;
    }

    #globalHeader .notification-mark-all {
      border: 0;
      background: transparent;
      color: var(--gh-purple2);
      font-size: 11px;
      font-weight: 800;
      cursor: pointer;
    }

    #globalHeader .notification-list {
      max-height: 430px;
      overflow-y: auto;
    }

    #globalHeader .notification-item {
      width: 100%;
      display: grid;
      grid-template-columns: 38px 1fr auto;
      gap: 12px;
      padding: 15px 18px;
      border: 0;
      border-bottom: 1px solid var(--gh-border);
      background: transparent;
      text-align: left;
      cursor: pointer;
    }

    #globalHeader .notification-item.unread {
      background: rgba(168,85,247,.07);
    }

    #globalHeader .notification-item-icon {
      width: 38px;
      height: 38px;
      display: grid;
      place-items: center;
      border-radius: 11px;
      background: rgba(168,85,247,.1);
    }

    #globalHeader .notification-item-content strong {
      display: block;
      font-size: 14px;
    }

    #globalHeader .notification-item-content p {
      margin: 4px 0 7px;
      color: var(--gh-muted);
      font-size: 12px;
      line-height: 1.35;
    }

    #globalHeader .notification-item-content time {
      color: var(--gh-dim);
      font-size: 10px;
    }

    #globalHeader .notification-unread-dot {
      width: 7px;
      height: 7px;
      margin-top: 8px;
      border-radius: 50%;
      background: var(--gh-purple2);
    }

    #globalHeader .notification-empty {
      padding: 28px 18px;
      color: var(--gh-dim);
      text-align: center;
    }
  `;

  document.head.appendChild(styles);

  mount.innerHTML = `
    <header>
      <div class="global-shell header-inner">
        <a
          href="index.html"
          class="brand"
          aria-label="Rivals Gauntlet home"
        >
          <div class="brand-mark">RG</div>

          <div class="brand-copy">
            <strong>RIVALS GAUNTLET</strong>
            <span>COMPETE • PREDICT • EARN</span>
          </div>
        </a>

        <button
          id="mobileToggle"
          class="mobile-toggle"
          type="button"
          aria-label="Open navigation"
          aria-expanded="false"
        >
          ☰
        </button>

        <nav id="mainNav">
          <a
            class="${isActive("home") ? "active" : ""}"
            href="index.html"
          >
            Home
          </a>

          <a
            class="${isActive("tournament") ? "active" : ""}"
            href="tournament.html"
          >
            Tournament
          </a>

          <a
            class="${isActive("prediction") ? "active" : ""}"
            href="predictions.html"
          >
            Predictions
          </a>

          <a
            class="${isActive("shop") ? "active" : ""}"
            href="shop.html"
          >
            Shop
          </a>

          <a
            class="${isActive("leaderboard") ? "active" : ""}"
            href="leaderboard.html"
          >
            Leaderboard
          </a>

          <a
            class="${isActive("about") ? "active" : ""}"
            href="about.html"
          >
            About
          </a>
        </nav>

        <div class="header-actions">
          <div
            id="pointsBox"
            class="points"
            style="display:none;"
          >
            <div class="points-icon">
              <img src="rg-points-icon.PNG" alt="">
            </div>

            <div class="points-copy">
              <span>RG Points</span>
              <strong
                id="headerRgPoints"
                data-raw-points="0"
              >
                0
              </strong>
            </div>
          </div>

          <div
            id="friendsButtonWrap"
            style="display:none;"
          >
            <button
              id="friendsButton"
              class="header-square-button"
              type="button"
              aria-label="Open friends"
              aria-expanded="false"
            >
              <img src="friends-icon.PNG" alt="">

              <span
                id="friendsRequestBadge"
                class="header-badge"
              >
                0
              </span>
            </button>
          </div>

          <div
            id="globalNotificationMount"
            style="display:none;"
          ></div>

          <div
            id="accountBox"
            class="account"
            style="display:none;"
          >
            <button
              id="accountButton"
              class="account-btn"
              type="button"
              aria-expanded="false"
            >
              <img
                id="headerAvatar"
                class="avatar"
                src=""
                alt="Profile"
                style="display:none;"
              >

              <div
                id="headerFallback"
                class="avatar-fallback"
              >
                RG
              </div>

              <div class="account-copy">
                <span>Player Account</span>
                <strong id="headerName">Player</strong>
              </div>

              <span class="account-chevron">⌄</span>
            </button>

            <div
              id="accountMenu"
              class="account-menu"
            >
              <a href="dashboard.html">Dashboard</a>
              <a id="publicProfileLink" href="#">
                Public Profile
              </a>
              <a href="inventory.html">Inventory</a>
              <a href="dashboard.html">Notifications</a>
              <a href="settings.html">Settings</a>

              <button
                id="signOutButton"
                type="button"
              >
                Sign Out
              </button>
            </div>
          </div>

          <div id="authLinks" class="auth-links">
            <a href="login.html">Sign In</a>
            <a href="register.html">Create Account</a>
          </div>
        </div>
      </div>
    </header>
  `;

     /* =========================================================
     RESPONSIVE HEADER CSS
  ========================================================= */

  styles.textContent += `
    @media (min-width: 721px) {
      #globalHeader .brand-mark {
        display: none;
      }

      #globalHeader .brand {
        gap: 0;
      }
    }

    @media (max-width: 1180px) {
      #globalHeader .brand-copy {
        display: none;
      }

      #globalHeader nav a {
        padding: 0 9px;
        font-size: 13px;
      }

      #globalHeader .account-btn {
        min-width: 138px;
      }
    }

    @media (max-width: 980px) {
      #globalHeader .mobile-toggle {
        display: block;
      }

      #globalHeader nav {
        position: fixed;
        inset: 78px 0 auto 0;
        height: calc(100vh - 78px);
        min-height: 0;
        display: none;
        flex-direction: column;
        align-items: stretch;
        gap: 0;
        padding: 22px 24px;
        background: rgba(8,8,13,.98);
        overflow-y: auto;
      }

      #globalHeader nav.show {
        display: flex;
      }

      #globalHeader nav a {
        min-height: 58px;
        padding: 0 14px;
        border-bottom: 1px solid var(--gh-border);
        font-size: 18px;
      }

      #globalHeader nav a.active::after {
        left: 0;
        right: auto;
        top: 15px;
        bottom: 15px;
        width: 3px;
        height: auto;
      }
    }

    @media (max-width: 720px) {
      #globalHeader .global-shell {
        width: min(calc(100% - 28px), var(--gh-max));
      }

      #globalHeader .brand {
        display: none;
      }

      #globalHeader .header-inner {
        min-height: 60px;
        gap: 8px;
      }

      #globalHeader .mobile-toggle {
        display: block;
        order: -1;
        width: 40px;
        height: 40px;
        flex: 0 0 40px;
        padding: 0;
        border: 0;
        border-radius: 10px;
        background: transparent;
        font-size: 24px;
      }

      #globalHeader .header-actions {
        order: 1;
        flex: 1;
        min-width: 0;
        gap: 5px;
      }

      #globalHeader #pointsBox {
        order: 1;
        margin-right: auto;
      }

      #globalHeader #friendsButtonWrap {
        order: 2;
      }

      #globalHeader #globalNotificationMount {
        order: 3;
      }

      #globalHeader #accountBox {
        order: 4;
      }

      #globalHeader .points {
        height: 40px;
        padding: 0;
        gap: 6px;
      }

      #globalHeader .points-icon,
      #globalHeader .points-icon img {
        width: 31px;
        height: 31px;
      }

      #globalHeader .points-icon {
        flex-basis: 31px;
      }

      #globalHeader .points-copy span {
        display: none;
      }

      #globalHeader .points-copy strong {
        margin-top: 0;
        font-size: 15px;
      }

      #globalHeader .header-square-button,
      #globalHeader #globalNotificationMount .notification-bell {
        width: 40px;
        height: 40px;
        padding: 0;
        overflow: visible;
        border: 0;
        border-radius: 10px;
        background: transparent;
        box-shadow: none;
      }

      #globalHeader #friendsButton img {
        width: 43px;
        height: 43px;
        max-width: none;
        transform: translateX(1px);
      }

      #globalHeader
      #globalNotificationMount
      .notification-bell-icon img {
        width: 33px;
        height: 33px;
      }

      #globalHeader .account-btn {
        width: 40px;
        min-width: 40px;
        max-width: 40px;
        height: 40px;
        flex: 0 0 40px;
        padding: 0;
        justify-content: center;
      }

      #globalHeader .avatar,
      #globalHeader .avatar-fallback {
        width: 38px;
        height: 38px;
        flex: 0 0 38px;
        border-radius: 11px;
      }

      #globalHeader .account-copy,
      #globalHeader .account-chevron {
        display: none;
      }

      #globalHeader nav {
        inset: 60px 0 auto 0;
        height: calc(100vh - 60px);
      }

      #globalHeader .account-menu {
        top: 68px;
        left: auto;
        right: 12px;
      }

      #globalHeader .notification-panel {
        position: fixed;
        top: 68px;
        left: 14px;
        right: 14px;
        width: auto;
        max-height: calc(100vh - 88px);
      }
    }

    @media (max-width: 470px) {
      #globalHeader .header-actions {
        gap: 4px;
      }

      #globalHeader .mobile-toggle,
      #globalHeader .header-square-button,
      #globalHeader #globalNotificationMount .notification-bell,
      #globalHeader .account-btn {
        width: 39px;
        height: 39px;
      }

      #globalHeader .mobile-toggle {
        flex-basis: 39px;
      }

      #globalHeader .account-btn {
        min-width: 39px;
        max-width: 39px;
        flex-basis: 39px;
      }

      #globalHeader .avatar,
      #globalHeader .avatar-fallback {
        width: 37px;
        height: 37px;
        flex-basis: 37px;
      }

      #globalHeader #friendsButton img {
        width: 42px;
        height: 42px;
      }

      #globalHeader
      #globalNotificationMount
      .notification-bell-icon img {
        width: 32px;
        height: 32px;
      }

      #globalHeader .points-icon,
      #globalHeader .points-icon img {
        width: 29px;
        height: 29px;
      }

      #globalHeader .points-icon {
        flex-basis: 29px;
      }

      #globalHeader .points-copy strong {
        font-size: 14px;
      }
    }

    /* =========================================================
       FRIENDS DRAWER
    ========================================================= */

    #globalFriendsRoot {
      position: relative;
      z-index: 3000;
    }

    #globalFriendsRoot .friends-backdrop {
      position: fixed;
      inset: 0;
      z-index: 3000;
      display: none;
      background: rgba(3,3,7,.62);
      backdrop-filter: blur(6px);
      -webkit-backdrop-filter: blur(6px);
    }

    #globalFriendsRoot .friends-backdrop.show {
      display: block;
    }

    #globalFriendsRoot .friends-drawer {
      position: fixed;
      top: 0;
      right: 0;
      z-index: 3100;
      width: min(430px,100vw);
      height: 100dvh;
      display: flex;
      flex-direction: column;
      border-left: 1px solid rgba(168,85,247,.3);
      background: #0d0c13;
      box-shadow: -28px 0 80px rgba(0,0,0,.48);
      transform: translateX(100%);
      transition: transform .22s ease;
    }

    #globalFriendsRoot .friends-drawer.show {
      transform: translateX(0);
    }

    #globalFriendsRoot .friends-drawer-header {
      min-height: 76px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      padding: 0 20px;
      border-bottom: 1px solid var(--gh-border);
      background: rgba(15,14,23,.97);
    }

    #globalFriendsRoot .friends-drawer-header span {
      display: block;
      color: var(--gh-purple2);
      font-size: 9px;
      font-weight: 800;
      letter-spacing: 1.7px;
      text-transform: uppercase;
    }

    #globalFriendsRoot .friends-drawer-header h2 {
      margin: 4px 0 0;
      font-size: 24px;
      line-height: 1;
    }

    #globalFriendsRoot .friends-close {
      width: 40px;
      height: 40px;
      border: 1px solid var(--gh-border);
      border-radius: 11px;
      background: rgba(255,255,255,.035);
      color: var(--gh-muted);
      cursor: pointer;
      font-size: 24px;
      line-height: 1;
    }

    #globalFriendsRoot .friends-tabs {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      padding: 14px 16px;
      border-bottom: 1px solid var(--gh-border);
    }

    #globalFriendsRoot .friends-tab {
      min-height: 42px;
      border: 1px solid var(--gh-border);
      border-radius: 10px;
      background: rgba(255,255,255,.025);
      color: var(--gh-muted);
      cursor: pointer;
      font-weight: 800;
      letter-spacing: .6px;
      text-transform: uppercase;
    }

    #globalFriendsRoot .friends-tab.active {
      border-color: rgba(192,132,252,.42);
      background: rgba(168,85,247,.1);
      color: #fff;
    }

    #globalFriendsRoot .friends-search-wrap {
      padding: 14px 16px 0;
    }

    #globalFriendsRoot .friends-search-box {
      position: relative;
    }

    #globalFriendsRoot .friends-search-box input {
      width: 100%;
      height: 44px;
      padding: 0 42px 0 14px;
      border: 1px solid var(--gh-border);
      border-radius: 11px;
      outline: none;
      background: rgba(255,255,255,.025);
      color: var(--gh-text);
      font: inherit;
      font-size: 14px;
    }

    #globalFriendsRoot .friends-search-box input:focus {
      border-color: rgba(192,132,252,.48);
      box-shadow: 0 0 0 3px rgba(168,85,247,.08);
    }

    #globalFriendsRoot .friends-search-icon {
      position: absolute;
      top: 50%;
      right: 14px;
      transform: translateY(-50%);
      color: var(--gh-dim);
      pointer-events: none;
    }

    #globalFriendsRoot .friends-search-status {
      min-height: 18px;
      margin-top: 7px;
      color: var(--gh-dim);
      font-size: 11px;
    }

    #globalFriendsRoot .friends-search-results {
      display: none;
      padding: 10px 16px 0;
    }

    #globalFriendsRoot .friends-search-results.show {
      display: block;
    }

    #globalFriendsRoot .friends-search-results h3 {
      margin: 0 0 10px;
      font-size: 16px;
    }

    #globalFriendsRoot .friends-drawer-body {
      flex: 1;
      overflow-y: auto;
      padding: 14px 16px 24px;
    }

    #globalFriendsRoot .friends-section {
      display: none;
    }

    #globalFriendsRoot .friends-section.active {
      display: block;
    }

    #globalFriendsRoot .friends-section-heading {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin: 4px 0 12px;
    }

    #globalFriendsRoot .friends-section-heading h3 {
      margin: 0;
      font-size: 18px;
    }

    #globalFriendsRoot .friends-section-heading span {
      color: var(--gh-dim);
      font-size: 11px;
      font-weight: 700;
    }

    #globalFriendsRoot .friend-list,
    #globalFriendsRoot .request-list,
    #globalFriendsRoot .search-player-list {
      display: grid;
      gap: 10px;
    }

    #globalFriendsRoot .friend-row,
    #globalFriendsRoot .request-row,
    #globalFriendsRoot .search-player-row {
      display: grid;
      grid-template-columns: 48px minmax(0,1fr);
      gap: 12px;
      padding: 13px;
      border: 1px solid var(--gh-border);
      border-radius: 14px;
      background: rgba(255,255,255,.025);
    }

    #globalFriendsRoot .friend-avatar,
    #globalFriendsRoot .friend-avatar-fallback {
      width: 48px;
      height: 48px;
      border-radius: 13px;
      object-fit: cover;
      background: #1b1625;
    }

    #globalFriendsRoot .friend-avatar-fallback {
      display: grid;
      place-items: center;
      color: var(--gh-purple2);
      font-weight: 800;
    }

    #globalFriendsRoot .friend-main {
      min-width: 0;
    }

    #globalFriendsRoot .friend-main-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }

    #globalFriendsRoot .friend-name {
      display: block;
      overflow: hidden;
      font-size: 15px;
      font-weight: 800;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    #globalFriendsRoot .friend-rgid {
      display: block;
      margin-top: 3px;
      color: var(--gh-dim);
      font-size: 10px;
      font-weight: 700;
      letter-spacing: .7px;
    }

    #globalFriendsRoot .friend-status {
      color: var(--gh-dim);
      font-size: 10px;
      font-weight: 700;
      white-space: nowrap;
    }

    #globalFriendsRoot .friend-actions,
    #globalFriendsRoot .request-actions,
    #globalFriendsRoot .search-player-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 10px;
    }

    #globalFriendsRoot .friend-action,
    #globalFriendsRoot .request-action,
    #globalFriendsRoot .search-player-action {
      min-height: 34px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0 11px;
      border: 1px solid var(--gh-border);
      border-radius: 9px;
      background: rgba(255,255,255,.03);
      color: var(--gh-muted);
      cursor: pointer;
      font-size: 11px;
      font-weight: 800;
    }

    #globalFriendsRoot .friend-action.gift,
    #globalFriendsRoot .search-player-action.add {
      border-color: rgba(168,85,247,.34);
      background: rgba(168,85,247,.08);
      color: #d7baf7;
    }

    #globalFriendsRoot .request-action.accept,
    #globalFriendsRoot .search-player-action.respond {
      border-color: rgba(61,220,151,.35);
      background: rgba(61,220,151,.08);
      color: #8ee9c1;
    }

    #globalFriendsRoot .request-action.decline {
      border-color: rgba(255,77,100,.28);
      background: rgba(255,77,100,.06);
      color: #ff9dac;
    }

    #globalFriendsRoot .friend-action:disabled,
    #globalFriendsRoot .request-action:disabled,
    #globalFriendsRoot .search-player-action:disabled {
      cursor: default;
      opacity: .58;
    }

    #globalFriendsRoot .friends-empty {
      padding: 34px 18px;
      border: 1px dashed var(--gh-border);
      border-radius: 14px;
      color: var(--gh-dim);
      text-align: center;
    }

    @media (max-width: 720px) {
      #globalFriendsRoot .friends-drawer {
        width: 100%;
        border-left: 0;
      }

      #globalFriendsRoot .friends-drawer-header {
        min-height: 68px;
        padding: 0 16px;
      }
    }
  `;

  /* =========================================================
     FRIENDS DRAWER HTML
  ========================================================= */

  const friendsRoot = document.createElement("div");

  friendsRoot.id = "globalFriendsRoot";

  friendsRoot.innerHTML = `
    <div
      id="friendsBackdrop"
      class="friends-backdrop"
    ></div>

    <aside
      id="friendsDrawer"
      class="friends-drawer"
      aria-hidden="true"
      aria-labelledby="friendsDrawerTitle"
    >
      <div class="friends-drawer-header">
        <div>
          <span>Rivals Gauntlet Social</span>
          <h2 id="friendsDrawerTitle">Friends</h2>
        </div>

        <button
          id="friendsClose"
          class="friends-close"
          type="button"
          aria-label="Close friends"
        >
          ×
        </button>
      </div>

      <div class="friends-tabs">
        <button
          class="friends-tab active"
          type="button"
          data-friends-tab="friends"
        >
          Friends
        </button>

        <button
          class="friends-tab"
          type="button"
          data-friends-tab="requests"
        >
          Requests
        </button>
      </div>

      <div class="friends-search-wrap">
        <div class="friends-search-box">
          <input
            id="friendsSearchInput"
            type="search"
            placeholder="Search players by name or RG ID..."
            autocomplete="off"
            maxlength="50"
          >

          <span class="friends-search-icon">
            ⌕
          </span>
        </div>

        <div
          id="friendsSearchStatus"
          class="friends-search-status"
        ></div>
      </div>

      <section
        id="friendsSearchResults"
        class="friends-search-results"
      >
        <h3>Player Search</h3>

        <div
          id="friendsSearchList"
          class="search-player-list"
        ></div>
      </section>

      <div class="friends-drawer-body">
        <section
          id="friendsTabPanel"
          class="friends-section active"
        >
          <div class="friends-section-heading">
            <h3>Your Friends</h3>

            <span id="friendsCountLabel">
              0 Friends
            </span>
          </div>

          <div
            id="friendsList"
            class="friend-list"
          >
            <div class="friends-empty">
              Loading friends...
            </div>
          </div>
        </section>

        <section
          id="requestsTabPanel"
          class="friends-section"
        >
          <div class="friends-section-heading">
            <h3>Friend Requests</h3>

            <span id="requestsCountLabel">
              0 Requests
            </span>
          </div>

          <div
            id="requestsList"
            class="request-list"
          >
            <div class="friends-empty">
              Loading requests...
            </div>
          </div>
        </section>
      </div>
    </aside>
  `;

  document.body.appendChild(friendsRoot);

   /* =========================================================
     SHARED HELPERS
  ========================================================= */

  function clean(value, fallback = "") {
    return String(value || fallback).trim();
  }

  function initials(name) {
    return clean(name, "RG")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part[0])
      .join("")
      .toUpperCase();
  }

  function escapeHtml(value) {
    return String(value || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function compactNumber(value) {
    const number = Number(value || 0);

    if (number >= 1000000) {
      return `${(number / 1000000).toFixed(
        number >= 10000000 ? 0 : 1
      )}M`;
    }

    if (number >= 1000) {
      return `${(number / 1000).toFixed(
        number >= 10000 ? 0 : 1
      )}K`;
    }

    return number.toLocaleString("en-US");
  }

  function renderRgPoints(value) {
    const target = document.getElementById("headerRgPoints");

    if (!target) return;

    const points = Number(value || 0);

    target.dataset.rawPoints = String(points);

    target.textContent =
      window.innerWidth <= 720
        ? compactNumber(points)
        : points.toLocaleString("en-US");
  }

  /* =========================================================
     HEADER CONTROLS
  ========================================================= */

  const mobileToggle =
    document.getElementById("mobileToggle");

  const mainNav =
    document.getElementById("mainNav");

  const accountButton =
    document.getElementById("accountButton");

  const accountMenu =
    document.getElementById("accountMenu");

  const signOutButton =
    document.getElementById("signOutButton");

  mobileToggle.addEventListener("click", () => {
    const open = mainNav.classList.toggle("show");

    mobileToggle.textContent = open ? "×" : "☰";

    mobileToggle.setAttribute(
      "aria-expanded",
      String(open)
    );

    mobileToggle.setAttribute(
      "aria-label",
      open
        ? "Close navigation"
        : "Open navigation"
    );

    document.body.classList.toggle(
      "global-menu-open",
      open
    );
  });

  accountButton.addEventListener(
    "click",
    event => {
      event.stopPropagation();

      const open =
        accountMenu.classList.toggle("show");

      accountButton.setAttribute(
        "aria-expanded",
        String(open)
      );
    }
  );

  document.addEventListener(
    "click",
    event => {
      if (
        !event.target.closest(
          "#globalHeader .account"
        )
      ) {
        accountMenu.classList.remove("show");

        accountButton.setAttribute(
          "aria-expanded",
          "false"
        );
      }
    }
  );

  signOutButton.addEventListener(
    "click",
    () => {
      if (typeof auth !== "undefined") {
        auth.signOut();
      }
    }
  );

  /* =========================================================
     FRIENDS DRAWER CONTROLS
  ========================================================= */

  const friendsButton =
    document.getElementById("friendsButton");

  const friendsBackdrop =
    document.getElementById("friendsBackdrop");

  const friendsDrawer =
    document.getElementById("friendsDrawer");

  const friendsClose =
    document.getElementById("friendsClose");

  const friendsSearchInput =
    document.getElementById("friendsSearchInput");

  const friendsSearchStatus =
    document.getElementById("friendsSearchStatus");

  const friendsSearchResults =
    document.getElementById("friendsSearchResults");

  const friendsSearchList =
    document.getElementById("friendsSearchList");

  const friendsList =
    document.getElementById("friendsList");

  const requestsList =
    document.getElementById("requestsList");

  const friendsCountLabel =
    document.getElementById("friendsCountLabel");

  const requestsCountLabel =
    document.getElementById("requestsCountLabel");

  const friendsRequestBadge =
    document.getElementById("friendsRequestBadge");

  function openFriendsDrawer() {
    friendsDrawer.classList.add("show");
    friendsBackdrop.classList.add("show");

    friendsDrawer.setAttribute(
      "aria-hidden",
      "false"
    );

    friendsButton.setAttribute(
      "aria-expanded",
      "true"
    );

    document.body.classList.add(
      "global-drawer-open"
    );
  }

  function closeFriendsDrawer() {
    friendsDrawer.classList.remove("show");
    friendsBackdrop.classList.remove("show");

    friendsDrawer.setAttribute(
      "aria-hidden",
      "true"
    );

    friendsButton.setAttribute(
      "aria-expanded",
      "false"
    );

    document.body.classList.remove(
      "global-drawer-open"
    );
  }

  friendsButton.addEventListener(
    "click",
    event => {
      event.stopPropagation();
      openFriendsDrawer();
    }
  );

  friendsClose.addEventListener(
    "click",
    closeFriendsDrawer
  );

  friendsBackdrop.addEventListener(
    "click",
    closeFriendsDrawer
  );

  function setFriendsTab(tabName) {
    document
      .querySelectorAll("[data-friends-tab]")
      .forEach(button => {
        button.classList.toggle(
          "active",
          button.dataset.friendsTab === tabName
        );
      });

    document
      .getElementById("friendsTabPanel")
      .classList.toggle(
        "active",
        tabName === "friends"
      );

    document
      .getElementById("requestsTabPanel")
      .classList.toggle(
        "active",
        tabName === "requests"
      );
  }

  document
    .querySelectorAll("[data-friends-tab]")
    .forEach(button => {
      button.addEventListener(
        "click",
        () => {
          setFriendsTab(
            button.dataset.friendsTab
          );
        }
      );
    });

  /* =========================================================
     FRIENDS DATA
  ========================================================= */

  let currentUser = null;
  let currentPlayer = null;

  let currentFriends = [];
  let currentIncomingRequests = [];
  let currentOutgoingRequests = [];

  let allSearchablePlayers = null;
  let friendsSearchTimer = null;

  let stopFriendsListener = null;
  let stopIncomingRequestsListener = null;
  let stopOutgoingRequestsListener = null;

  function stopFriendsSystem() {
    if (
      typeof stopFriendsListener === "function"
    ) {
      stopFriendsListener();
    }

    if (
      typeof stopIncomingRequestsListener ===
      "function"
    ) {
      stopIncomingRequestsListener();
    }

    if (
      typeof stopOutgoingRequestsListener ===
      "function"
    ) {
      stopOutgoingRequestsListener();
    }

    stopFriendsListener = null;
    stopIncomingRequestsListener = null;
    stopOutgoingRequestsListener = null;

    currentFriends = [];
    currentIncomingRequests = [];
    currentOutgoingRequests = [];
    allSearchablePlayers = null;

    clearTimeout(friendsSearchTimer);

    friendsSearchInput.value = "";
    friendsSearchStatus.textContent = "";
    friendsSearchResults.classList.remove("show");
    friendsSearchList.innerHTML = "";

    friendsRequestBadge.style.display = "none";

    friendsCountLabel.textContent = "0 Friends";
    requestsCountLabel.textContent = "0 Requests";

    friendsList.innerHTML = `
      <div class="friends-empty">
        Sign in to view your friends.
      </div>
    `;

    requestsList.innerHTML = `
      <div class="friends-empty">
        Sign in to view friend requests.
      </div>
    `;

    closeFriendsDrawer();
  }

  function getRelationshipStatus(targetUid) {
    if (!targetUid) return "none";

    if (
      currentFriends.some(
        friend => friend.uid === targetUid
      )
    ) {
      return "friends";
    }

    if (
      currentOutgoingRequests.some(
        request =>
          request.receiverUid === targetUid
      )
    ) {
      return "outgoing";
    }

    if (
      currentIncomingRequests.some(
        request =>
          request.senderUid === targetUid
      )
    ) {
      return "incoming";
    }

    return "none";
  }

  function renderFriendsList(players) {
    currentFriends =
      Array.isArray(players)
        ? players
        : [];

    friendsCountLabel.textContent =
      `${currentFriends.length} ${
        currentFriends.length === 1
          ? "Friend"
          : "Friends"
      }`;

    if (!currentFriends.length) {
      friendsList.innerHTML = `
        <div class="friends-empty">
          Your friends will appear here.
        </div>
      `;

      return;
    }

    friendsList.innerHTML =
      currentFriends
        .map(player => {
          const displayName =
            player.displayName || "Player";

          const avatar =
            player.profileImage
              ? `
                <img
                  class="friend-avatar"
                  src="${escapeHtml(
                    player.profileImage
                  )}"
                  alt=""
                >
              `
              : `
                <div class="friend-avatar-fallback">
                  ${escapeHtml(
                    initials(displayName)
                  )}
                </div>
              `;

          return `
            <article class="friend-row">
              ${avatar}

              <div class="friend-main">
                <div class="friend-main-top">
                  <div>
                    <a
                      class="friend-name"
                      href="player.html?id=${encodeURIComponent(
                        player.uid
                      )}"
                    >
                      ${escapeHtml(displayName)}
                    </a>

                    ${
                      player.rgId
                        ? `
                          <span class="friend-rgid">
                            ${escapeHtml(
                              player.rgId
                            )}
                          </span>
                        `
                        : ""
                    }
                  </div>

                  <span class="friend-status">
                    Friend
                  </span>
                </div>

                <div class="friend-actions">
                  <a
                    class="friend-action"
                    href="player.html?id=${encodeURIComponent(
                      player.uid
                    )}"
                  >
                    View Profile
                  </a>

                  <button
                    class="friend-action gift"
                    type="button"
                    data-send-gift="${escapeHtml(
                      player.uid
                    )}"
                  >
                    Send Gift
                  </button>
                </div>
              </div>
            </article>
          `;
        })
        .join("");
  }

  async function renderIncomingRequests() {
    requestsCountLabel.textContent =
      `${currentIncomingRequests.length} ${
        currentIncomingRequests.length === 1
          ? "Request"
          : "Requests"
      }`;

    friendsRequestBadge.textContent =
      currentIncomingRequests.length > 99
        ? "99+"
        : String(
            currentIncomingRequests.length
          );

    friendsRequestBadge.style.display =
      currentIncomingRequests.length > 0
        ? "flex"
        : "none";

    if (!currentIncomingRequests.length) {
      requestsList.innerHTML = `
        <div class="friends-empty">
          You have no pending friend requests.
        </div>
      `;

      return;
    }

    const playerPairs =
      await Promise.all(
        currentIncomingRequests.map(
          async request => {
            try {
              return [
                request.id,
                await RGFriends.getPlayer(
                  request.senderUid
                )
              ];
            } catch {
              return [request.id, null];
            }
          }
        )
      );

    const playersByRequest =
      Object.fromEntries(playerPairs);

    requestsList.innerHTML =
      currentIncomingRequests
        .map(request => {
          const player =
            playersByRequest[request.id] || {};

          const displayName =
            player.displayName ||
            request.senderName ||
            "Player";

          const avatar =
            player.profileImage
              ? `
                <img
                  class="friend-avatar"
                  src="${escapeHtml(
                    player.profileImage
                  )}"
                  alt=""
                >
              `
              : `
                <div class="friend-avatar-fallback">
                  ${escapeHtml(
                    initials(displayName)
                  )}
                </div>
              `;

          return `
            <article class="request-row">
              ${avatar}

              <div class="friend-main">
                <strong class="friend-name">
                  ${escapeHtml(displayName)}
                </strong>

                ${
                  player.rgId
                    ? `
                      <span class="friend-rgid">
                        ${escapeHtml(
                          player.rgId
                        )}
                      </span>
                    `
                    : ""
                }

                <div class="request-actions">
                  <button
                    class="request-action accept"
                    type="button"
                    data-accept-request="${escapeHtml(
                      request.id
                    )}"
                  >
                    Accept
                  </button>

                  <button
                    class="request-action decline"
                    type="button"
                    data-decline-request="${escapeHtml(
                      request.id
                    )}"
                  >
                    Decline
                  </button>
                </div>
              </div>
            </article>
          `;
        })
        .join("");
  }

  async function loadSearchablePlayers() {
    if (allSearchablePlayers) {
      return allSearchablePlayers;
    }

    const snapshot =
      await database
        .ref("players")
        .once("value");

    const data = snapshot.val() || {};

    allSearchablePlayers =
      Object.entries(data).map(
        ([uid, player]) => ({
          uid,
          ...(player || {})
        })
      );

    return allSearchablePlayers;
  }

  function renderSearchResults(players) {
    const results =
      Array.isArray(players)
        ? players
        : [];

    if (!results.length) {
      friendsSearchList.innerHTML = `
        <div class="friends-empty">
          No matching players found.
        </div>
      `;

      friendsSearchResults.classList.add(
        "show"
      );

      return;
    }

    friendsSearchList.innerHTML =
      results
        .map(player => {
          const displayName =
            player.displayName || "Player";

          const relationship =
            getRelationshipStatus(
              player.uid
            );

          const avatar =
            player.profileImage
              ? `
                <img
                  class="friend-avatar"
                  src="${escapeHtml(
                    player.profileImage
                  )}"
                  alt=""
                >
              `
              : `
                <div class="friend-avatar-fallback">
                  ${escapeHtml(
                    initials(displayName)
                  )}
                </div>
              `;

          let actionHtml = `
            <button
              class="search-player-action add"
              type="button"
              data-add-friend="${escapeHtml(
                player.uid
              )}"
            >
              Add Friend
            </button>
          `;

          if (relationship === "friends") {
            actionHtml = `
              <button
                class="search-player-action"
                type="button"
                disabled
              >
                Friends
              </button>
            `;
          }

          if (relationship === "outgoing") {
            actionHtml = `
              <button
                class="search-player-action"
                type="button"
                disabled
              >
                Request Sent
              </button>
            `;
          }

          if (relationship === "incoming") {
            actionHtml = `
              <button
                class="search-player-action respond"
                type="button"
                data-open-requests="true"
              >
                Respond
              </button>
            `;
          }

          return `
            <article class="search-player-row">
              ${avatar}

              <div class="friend-main">
                <a
                  class="friend-name"
                  href="player.html?id=${encodeURIComponent(
                    player.uid
                  )}"
                >
                  ${escapeHtml(displayName)}
                </a>

                ${
                  player.rgId
                    ? `
                      <span class="friend-rgid">
                        ${escapeHtml(
                          player.rgId
                        )}
                      </span>
                    `
                    : ""
                }

                <div class="search-player-actions">
                  <a
                    class="search-player-action"
                    href="player.html?id=${encodeURIComponent(
                      player.uid
                    )}"
                  >
                    View Profile
                  </a>

                  ${actionHtml}
                </div>
              </div>
            </article>
          `;
        })
        .join("");

    friendsSearchResults.classList.add(
      "show"
    );
  }

  async function runPlayerSearch() {
    const query =
      String(
        friendsSearchInput.value || ""
      )
        .trim()
        .toLowerCase();

    if (query.length < 2) {
      friendsSearchStatus.textContent =
        query.length === 1
          ? "Enter at least 2 characters."
          : "";

      friendsSearchResults.classList.remove(
        "show"
      );

      friendsSearchList.innerHTML = "";
      return;
    }

    if (!currentUser) {
      friendsSearchStatus.textContent =
        "Sign in to search players.";

      friendsSearchResults.classList.remove(
        "show"
      );

      return;
    }

    friendsSearchStatus.textContent =
      "Searching...";

    try {
      const players =
        await loadSearchablePlayers();

      const matches =
        players
          .filter(
            player =>
              player.uid !==
              currentUser.uid
          )
          .filter(player => {
            const name =
              String(
                player.displayName || ""
              ).toLowerCase();

            const rgId =
              String(
                player.rgId || ""
              ).toLowerCase();

            const ign =
              String(
                player.rivalsIgn || ""
              ).toLowerCase();

            return (
              name.includes(query) ||
              rgId.includes(query) ||
              ign.includes(query)
            );
          })
          .slice(0, 20);

      friendsSearchStatus.textContent =
        `${matches.length} ${
          matches.length === 1
            ? "player"
            : "players"
        } found`;

      renderSearchResults(matches);
    } catch (error) {
      console.error(
        "Player search error:",
        error
      );

      friendsSearchStatus.textContent =
        "Player search could not be loaded.";

      friendsSearchResults.classList.remove(
        "show"
      );
    }
  }

  friendsSearchInput.addEventListener(
    "input",
    () => {
      clearTimeout(friendsSearchTimer);

      friendsSearchTimer =
        setTimeout(
          runPlayerSearch,
          280
        );
    }
  );

  friendsSearchList.addEventListener(
    "click",
    async event => {
      const addButton =
        event.target.closest(
          "[data-add-friend]"
        );

      const respondButton =
        event.target.closest(
          "[data-open-requests]"
        );

      if (respondButton) {
        setFriendsTab("requests");
        return;
      }

      if (
        !addButton ||
        !currentUser ||
        typeof RGFriends === "undefined"
      ) {
        return;
      }

      addButton.disabled = true;
      addButton.textContent = "Sending...";

      try {
        const targetPlayer =
          await RGFriends.getPlayer(
            addButton.dataset.addFriend
          );

        if (!targetPlayer) {
          throw new Error(
            "Player account not found."
          );
        }

        await RGFriends.sendFriendRequest(
          {
            uid: currentUser.uid,

            displayName:
              currentPlayer?.displayName ||
              currentUser.displayName ||
              "Player"
          },
          targetPlayer
        );

        addButton.textContent =
          "Request Sent";
      } catch (error) {
        addButton.disabled = false;
        addButton.textContent =
          "Add Friend";

        alert(
          error.message ||
          "Friend request could not be sent."
        );
      }
    }
  );

  requestsList.addEventListener(
    "click",
    async event => {
      const acceptButton =
        event.target.closest(
          "[data-accept-request]"
        );

      const declineButton =
        event.target.closest(
          "[data-decline-request]"
        );

      if (
        !currentUser ||
        typeof RGFriends === "undefined"
      ) {
        return;
      }

      try {
        if (acceptButton) {
          acceptButton.disabled = true;

          await RGFriends.acceptFriendRequest(
            currentUser.uid,
            acceptButton.dataset.acceptRequest
          );

          return;
        }

        if (declineButton) {
          declineButton.disabled = true;

          await RGFriends.declineFriendRequest(
            currentUser.uid,
            declineButton.dataset.declineRequest
          );
        }
      } catch (error) {
        alert(
          error.message ||
          "Friend request could not be updated."
        );
      }
    }
  );

  friendsList.addEventListener(
    "click",
    event => {
      const giftButton =
        event.target.closest(
          "[data-send-gift]"
        );

      if (!giftButton) return;

      document.dispatchEvent(
        new CustomEvent(
          "rg-send-daily-gift",
          {
            detail: {
              receiverUid:
                giftButton.dataset.sendGift
            }
          }
        )
      );

      if (!window.RGDailyGiftUI) {
        alert(
          "Secure daily gifting will be connected here next."
        );
      }
    }
  );

  function initializeFriendsSystem(uid) {
    if (
      typeof RGFriends === "undefined"
    ) {
      console.warn(
        "friends.js must load before global-header.js"
      );

      return;
    }

    if (
      typeof stopFriendsListener ===
      "function"
    ) {
      stopFriendsListener();
    }

    if (
      typeof stopIncomingRequestsListener ===
      "function"
    ) {
      stopIncomingRequestsListener();
    }

    if (
      typeof stopOutgoingRequestsListener ===
      "function"
    ) {
      stopOutgoingRequestsListener();
    }

    stopFriendsListener =
      RGFriends.listenToFriends(
        uid,
        () => {
          RGFriends.getFriends(uid)
            .then(renderFriendsList)
            .catch(error => {
              console.error(
                "Friends load error:",
                error
              );

              friendsList.innerHTML = `
                <div class="friends-empty">
                  Friends could not be loaded.
                </div>
              `;
            });
        }
      );

    stopIncomingRequestsListener =
      RGFriends.listenToIncomingRequests(
        uid,
        requestMap => {
          const requestIds =
            Object.keys(
              requestMap || {}
            );

          Promise.all(
            requestIds.map(requestId =>
              RGFriends
                .getRequest(requestId)
                .then(request =>
                  request
                    ? {
                        id: requestId,
                        ...request
                      }
                    : null
                )
                .catch(() => null)
            )
          ).then(requests => {
            currentIncomingRequests =
              requests.filter(Boolean);

            renderIncomingRequests();

            if (
              friendsSearchInput.value
                .trim().length >= 2
            ) {
              runPlayerSearch();
            }
          });
        }
      );

    if (
      typeof RGFriends
        .listenToOutgoingRequests ===
      "function"
    ) {
      stopOutgoingRequestsListener =
        RGFriends.listenToOutgoingRequests(
          uid,
          requestMap => {
            const requestIds =
              Object.keys(
                requestMap || {}
              );

            Promise.all(
              requestIds.map(requestId =>
                RGFriends
                  .getRequest(requestId)
                  .then(request =>
                    request
                      ? {
                          id: requestId,
                          ...request
                        }
                      : null
                  )
                  .catch(() => null)
              )
            ).then(requests => {
              currentOutgoingRequests =
                requests.filter(Boolean);

              if (
                friendsSearchInput.value
                  .trim().length >= 2
              ) {
                runPlayerSearch();
              }
            });
          }
        );
    }
  }

   /* =========================================================
     AUTHENTICATION + PLAYER HEADER DATA
  ========================================================= */

  if (typeof auth === "undefined") {
    console.error(
      "firebase-auth.js and firebase.js must load before global-header.js"
    );
  } else {
    auth.onAuthStateChanged(user => {
      currentUser = user || null;

      const notificationMount =
        document.getElementById("globalNotificationMount");

      const pointsBox =
        document.getElementById("pointsBox");

      const friendsButtonWrap =
        document.getElementById("friendsButtonWrap");

      const accountBox =
        document.getElementById("accountBox");

      const authLinks =
        document.getElementById("authLinks");

      if (!user) {
        currentPlayer = null;

        notificationMount.style.display = "none";
        pointsBox.style.display = "none";
        friendsButtonWrap.style.display = "none";
        accountBox.style.display = "none";

        authLinks.classList.add("show");

        accountMenu.classList.remove("show");

        accountButton.setAttribute(
          "aria-expanded",
          "false"
        );

        if (
          typeof RGNotificationCenter !==
          "undefined"
        ) {
          RGNotificationCenter.destroy();
        }

        stopFriendsSystem();

        return;
      }

      notificationMount.style.display = "block";
      pointsBox.style.display = "flex";
      friendsButtonWrap.style.display = "block";
      accountBox.style.display = "block";

      authLinks.classList.remove("show");

      /* -----------------------------------------
         NOTIFICATION CENTER
      ----------------------------------------- */

      if (
        typeof RGNotificationCenter !==
        "undefined"
      ) {
        RGNotificationCenter.init(
          user.uid,
          "#globalNotificationMount"
        );

        setTimeout(() => {
          const bellIcon =
            document.querySelector(
              "#globalHeader .notification-bell-icon"
            );

          if (bellIcon) {
            bellIcon.innerHTML = `
              <img
                src="notification-bell.PNG"
                alt=""
              >
            `;
          }
        }, 0);
      } else {
        console.warn(
          "notification-center.js must load before global-header.js"
        );
      }

      /* -----------------------------------------
         PLAYER PROFILE + RG POINTS
      ----------------------------------------- */

      if (typeof database === "undefined") {
        console.error(
          "firebase-database.js and firebase.js must load before global-header.js"
        );

        return;
      }

      database
        .ref(`players/${user.uid}`)
        .on("value", snapshot => {
          const player =
            snapshot.val() || {};

          currentPlayer = player;

          const displayName =
            player.displayName ||
            user.displayName ||
            "Player";

          const headerName =
            document.getElementById(
              "headerName"
            );

          const headerFallback =
            document.getElementById(
              "headerFallback"
            );

          const publicProfileLink =
            document.getElementById(
              "publicProfileLink"
            );

          const headerAvatar =
            document.getElementById(
              "headerAvatar"
            );

          headerName.textContent =
            displayName;

          headerFallback.textContent =
            initials(displayName);

          publicProfileLink.href =
            `player.html?id=${encodeURIComponent(
              user.uid
            )}`;

          accountButton.title =
            `Open account menu for ${displayName}`;

          renderRgPoints(
            Number(player.rgPoints || 0)
          );

          if (player.profileImage) {
            headerAvatar.src =
              player.profileImage;

            headerAvatar.style.display =
              "block";

            headerFallback.style.display =
              "none";
          } else {
            headerAvatar.removeAttribute(
              "src"
            );

            headerAvatar.style.display =
              "none";

            headerFallback.style.display =
              "grid";
          }
        });

      initializeFriendsSystem(user.uid);
    });
  }

  /* =========================================================
     RESPONSIVE POINTS UPDATE
  ========================================================= */

  window.addEventListener(
    "resize",
    () => {
      const pointsTarget =
        document.getElementById(
          "headerRgPoints"
        );

      if (!pointsTarget) return;

      renderRgPoints(
        Number(
          pointsTarget.dataset.rawPoints ||
          0
        )
      );

      if (
        window.innerWidth > 980 &&
        mainNav.classList.contains("show")
      ) {
        mainNav.classList.remove("show");

        mobileToggle.textContent = "☰";

        mobileToggle.setAttribute(
          "aria-expanded",
          "false"
        );

        mobileToggle.setAttribute(
          "aria-label",
          "Open navigation"
        );

        document.body.classList.remove(
          "global-menu-open"
        );
      }
    }
  );

  /* =========================================================
     ESCAPE KEY BEHAVIOR
  ========================================================= */

  document.addEventListener(
    "keydown",
    event => {
      if (event.key !== "Escape") return;

      if (
        friendsDrawer.classList.contains(
          "show"
        )
      ) {
        closeFriendsDrawer();
        return;
      }

      if (
        accountMenu.classList.contains(
          "show"
        )
      ) {
        accountMenu.classList.remove(
          "show"
        );

        accountButton.setAttribute(
          "aria-expanded",
          "false"
        );

        return;
      }

      if (
        mainNav.classList.contains(
          "show"
        )
      ) {
        mainNav.classList.remove("show");

        mobileToggle.textContent = "☰";

        mobileToggle.setAttribute(
          "aria-expanded",
          "false"
        );

        mobileToggle.setAttribute(
          "aria-label",
          "Open navigation"
        );

        document.body.classList.remove(
          "global-menu-open"
        );
      }
    }
  );

  /* =========================================================
     OPTIONAL EXTERNAL CONTROLS
  ========================================================= */

  window.RGGlobalHeader = {
    openFriends: openFriendsDrawer,
    closeFriends: closeFriendsDrawer,

    updatePoints(value) {
      renderRgPoints(value);
    },

    closeNavigation() {
      mainNav.classList.remove("show");

      mobileToggle.textContent = "☰";

      mobileToggle.setAttribute(
        "aria-expanded",
        "false"
      );

      document.body.classList.remove(
        "global-menu-open"
      );
    }
  };

})();
