/* ==========================================================================
   Rivals Gauntlet — Global Header
   File: global-header.js
   Version: 2.0.0

   Expected globals:
     window.auth
     window.database

   Required mount:
     <div id="globalHeader"></div>

   Recommended load order:
     <script src="firebase.js"></script>
     <script src="notifications.js"></script>
     <script src="friends.js"></script>
     <script src="global-header.js"></script>
   ========================================================================== */

(() => {
    "use strict";

    // =========================================================================
    // DUPLICATE LOAD PROTECTION
    // =========================================================================

    if (window.__RG_GLOBAL_HEADER_LOADED__) {
        console.warn("[RG Header] Duplicate script load prevented.");
        return;
    }

    window.__RG_GLOBAL_HEADER_LOADED__ = true;

    // =========================================================================
    // VERSION
    // =========================================================================

    const VERSION = "2.0.0";

    // =========================================================================
    // DEFAULT CONFIGURATION
    // =========================================================================

    const DEFAULT_CONFIG = Object.freeze({
        mountId: "globalHeader",

        authReadyTimeout: 12000,

        playerPaths: [
            "players/{uid}",
            "users/{uid}",
            "profiles/{uid}"
        ],

        pointsKeys: [
            "rgPoints",
            "points",
            "rp",
            "balance",
            "rg_points"
        ],

        displayNameKeys: [
            "displayName",
            "username",
            "name",
            "gamerTag",
            "gamertag"
        ],

        avatarKeys: [
            "avatarUrl",
            "photoURL",
            "profileImage",
            "avatar",
            "photo"
        ],

        notificationPaths: [
            "notifications/{uid}",
            "userNotifications/{uid}"
        ],

        friendPaths: [
    "userFriends/{uid}"
],

friendRequestPaths: [
    "userFriendRequests/{uid}/incoming"
],

        navigation: [
            {
                label: "Home",
                href: "index.html",
                keys: ["", "index", "home"]
            },
            {
                label: "Tournament",
                href: "tournament.html",
                keys: ["tournament", "bracket", "teams", "watch"]
            },
            {
                label: "Predictions",
                href: "predictions.html",
                keys: ["predictions", "prediction"]
            },
            {
                label: "Shop",
                href: "shop.html",
                keys: ["shop", "store", "crates"]
            },
            {
                label: "Leaderboard",
                href: "leaderboard.html",
                keys: ["leaderboard", "rankings"]
            },
            {
                label: "About",
                href: "about.html",
                keys: ["about"]
            }
        ],

        accountLinks: [
            {
                label: "Dashboard",
                href: "dashboard.html",
                icon: "dashboard"
            },
            {
                label: "Public Profile",
                href: "profile.html",
                icon: "profile"
            },
            {
                label: "Inventory",
                href: "inventory.html",
                icon: "inventory"
            },
            {
                label: "Settings",
                href: "settings.html",
                icon: "settings"
            }
        ],

        signInHref: "login.html",
        createAccountHref: "register.html",

        defaultAvatar: "",

        pointsLabel: "RG Points",

        mobileBreakpoint: 760,
        tabletBreakpoint: 1100,

        maxNotifications: 40,
        maxFriends: 100,

        toastDuration: 4200,

        debug: false
    });

    // =========================================================================
    // SELECTORS
    // =========================================================================

    const SELECTORS = Object.freeze({
        header: "[data-rg-header]",
        nav: "[data-rg-nav]",

        mobilePanel: "[data-rg-mobile-panel]",
        mobileToggle: "[data-rg-mobile-toggle]",

        profileToggle: "[data-rg-profile-toggle]",
        profileMenu: "[data-rg-profile-menu]",

        pointsToggle: "[data-rg-points-toggle]",
        friendsToggle: "[data-rg-friends-toggle]",
        notificationsToggle: "[data-rg-notifications-toggle]",

        authSignedIn: "[data-rg-auth='signed-in']",
        authSignedOut: "[data-rg-auth='signed-out']",

        backdrop: "[data-rg-backdrop]",
        drawer: "[data-rg-drawer]",
        modal: "[data-rg-modal]",

        toastRegion: "[data-rg-toast-region]"
    });

    // =========================================================================
    // SVG ICONS
    // =========================================================================

    const ICONS = Object.freeze({
        menu: `
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 7h16M4 12h16M4 17h16"/>
            </svg>
        `,

        close: `
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18"/>
            </svg>
        `,

        chevron: `
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="m8 10 4 4 4-4"/>
            </svg>
        `,

        dashboard: `
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 4h7v7H4zM13 4h7v4h-7zM13 10h7v10h-7zM4 13h7v7H4z"/>
            </svg>
        `,

        profile: `
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="8" r="4"/>
                <path d="M4.5 20c.8-4 3.3-6 7.5-6s6.7 2 7.5 6"/>
            </svg>
        `,

        inventory: `
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 7h16v13H4zM7 4h10v3H7zM9 11h6"/>
            </svg>
        `,

        settings: `
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19 12a7 7 0 0 0-.1-1l2-1.6-2-3.4-2.5 1A8 8 0 0 0 14 5.6L13.6 3h-4L9 5.6A8 8 0 0 0 6.6 7l-2.5-1-2 3.4L4 11a7 7 0 0 0 0 2l-2 1.6 2 3.4 2.5-1A8 8 0 0 0 9 18.4l.5 2.6h4l.5-2.6a8 8 0 0 0 2.4-1.4l2.5 1 2-3.4-2-1.6a7 7 0 0 0 .1-1Z"/>
            </svg>
        `,

        signout: `
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M10 5H5v14h5M14 8l4 4-4 4M8 12h10"/>
            </svg>
        `,

        search: `
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="11" cy="11" r="6"/>
                <path d="m16 16 4 4"/>
            </svg>
        `,

        check: `
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="m5 12 4 4L19 6"/>
            </svg>
        `,

        info: `
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="12" r="9"/>
                <path d="M12 11v6M12 7.5v.1"/>
            </svg>
        `,

        success: `
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="12" r="9"/>
                <path d="m7.5 12 3 3 6-7"/>
            </svg>
        `,

        warning: `
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 3 2.5 20h19L12 3Z"/>
                <path d="M12 9v5M12 17v.1"/>
            </svg>
        `,

        error: `
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="12" r="9"/>
                <path d="m9 9 6 6M15 9l-6 6"/>
            </svg>
        `,

        friend: `
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="9" cy="8" r="3"/>
                <circle cx="17" cy="9" r="2.4"/>
                <path d="M3.5 20c.6-4 2.4-6 5.5-6s5 2 5.5 6M14 14.5c3.5-.3 5.5 1.5 6.2 5.5"/>
            </svg>
        `,

        bell: `
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M6 16h12l-1.5-2.5V10a4.5 4.5 0 0 0-9 0v3.5L6 16Z"/>
                <path d="M10 19h4"/>
            </svg>
        `,

        coin: `
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="12" r="9"/>
                <path d="M8.5 8.5h5.2a2.3 2.3 0 0 1 0 4.6H10m4.7 0 2 2.4M10 6.5v11"/>
            </svg>
        `,

        tournament: `
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M8 4h8v3a4 4 0 0 1-8 0V4Z"/>
                <path d="M6 5H3v2a4 4 0 0 0 4 4M18 5h3v2a4 4 0 0 1-4 4M12 11v5M8 20h8M9 16h6"/>
            </svg>
        `,

        prediction: `
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 3a7 7 0 0 0-4 12.7V19h8v-3.3A7 7 0 0 0 12 3Z"/>
                <path d="M9 22h6M9 11l2 2 4-5"/>
            </svg>
        `,

        reward: `
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 10h16v10H4zM3 7h18v3H3zM12 7v13M12 7H8.5A2.5 2.5 0 1 1 11 4.5L12 7Zm0 0h3.5A2.5 2.5 0 1 0 13 4.5L12 7Z"/>
            </svg>
        `,

        empty: `
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M5 6h14v13H5zM8 3h8v3H8zM8 10h8M8 14h5"/>
            </svg>
        `
    });

    // =========================================================================
    // GLOBAL HEADER CONTROLLER
    // =========================================================================

    class RGHeaderController {
        constructor(config = {}) {
            this.config = {
                ...DEFAULT_CONFIG,
                ...config
            };

            this.state = {
                initialized: false,
                destroyed: false,

                user: null,
                player: null,

                points: 0,

                notifications: [],
friends: [],
friendRequests: [],
giftInbox: [],

dailyGiftStats: {
    sentCount: 0,
    receivedCount: 0,
    receivedLimit: 5,
    sentTo: {}
},

                activeOverlay: null,
                activeDrawer: null,
                activeModal: null,

                mobileOpen: false,
                profileOpen: false,

                listeners: [],
                firebaseListeners: [],

                lastFocusedElement: null,

                notificationUnread: 0,
                friendRequestCount: 0,

                firstNotificationLoad: true
            };

            this.dom = {};

            this.auth = null;
            this.database = null;

            this.initPromise = null;
            this.authUnsubscribe = null;
        }

        // =====================================================================
        // LOGGING
        // =====================================================================

        log(...args) {
            if (this.config.debug) {
                console.log("[RG Header]", ...args);
            }
        }

        warn(...args) {
            console.warn("[RG Header]", ...args);
        }

        // =====================================================================
        // INITIALIZATION
        // =====================================================================

        async init() {
            if (this.initPromise) {
                return this.initPromise;
            }

            this.initPromise = (async () => {
                await this.waitForDocument();

                if (this.state.destroyed) {
                    return this;
                }

                const mount = document.getElementById(this.config.mountId);

                if (!mount) {
                    this.warn(`Mount #${this.config.mountId} was not found.`);
                    return this;
                }

                this.dom.mount = mount;




                this.render();
                
                
                
                
                this.cacheDOM();
                this.bindEvents();
                this.applyActiveNavigation();
                this.updateResponsiveState();
                this.installPublicCompatibility();

                const firebaseReady = await this.waitForFirebase();

                if (firebaseReady) {
                    this.auth = window.auth;
                    this.database = window.database;

                    this.bindAuth();
                } else {
                    this.warn("Firebase globals were not available before timeout.");
                    this.setSignedOutUI();
                }

                this.state.initialized = true;

                document.documentElement.classList.add("rg-header-ready");

                window.dispatchEvent(
                    new CustomEvent("rgheader:ready", {
                        detail: {
                            version: VERSION,
                            controller: this
                        }
                    })
                );

                return this;
            })();

            return this.initPromise;
        }

        waitForDocument() {
            if (document.readyState !== "loading") {
                return Promise.resolve();
            }

            return new Promise((resolve) => {
                document.addEventListener("DOMContentLoaded", resolve, {
                    once: true
                });
            });
        }

        waitForFirebase() {
            if (window.auth && window.database) {
                return Promise.resolve(true);
            }

            return new Promise((resolve) => {
                const started = Date.now();

                const timer = window.setInterval(() => {
                    if (window.auth && window.database) {
                        window.clearInterval(timer);
                        resolve(true);
                        return;
                    }

                    if (
                        Date.now() - started >=
                        this.config.authReadyTimeout
                    ) {
                        window.clearInterval(timer);
                        resolve(false);
                    }
                }, 100);
            });
        }

        // =====================================================================
        // HEADER HTML
        // =====================================================================

        render() {
            const navItems = this.config.navigation
                .map((item) => {
                    return `
                        <a
                            class="rg-header__nav-link"
                            href="${this.escapeAttribute(item.href)}"
                            data-rg-nav-link
                            data-rg-nav-keys="${this.escapeAttribute(
                                item.keys.join(",")
                            )}"
                        >
                            <span>${this.escapeHTML(item.label)}</span>
                        </a>
                    `;
                })
                .join("");

            const mobileNavItems = this.config.navigation
                .map((item) => {
                    return `
                        <a
                            class="rg-mobile-panel__link"
                            href="${this.escapeAttribute(item.href)}"
                            data-rg-nav-link
                            data-rg-nav-keys="${this.escapeAttribute(
                                item.keys.join(",")
                            )}"
                        >
                            <span>${this.escapeHTML(item.label)}</span>
                        </a>
                    `;
                })
                .join("");

            const accountLinks = this.config.accountLinks
                .map((item) => {
                    return `
                        <a
                            class="rg-profile-menu__item"
                            href="${this.escapeAttribute(item.href)}"
                        >
                            <span class="rg-profile-menu__icon">
                                ${ICONS[item.icon] || ICONS.profile}
                            </span>

                            <span>${this.escapeHTML(item.label)}</span>
                        </a>
                    `;
                })
                .join("");

            this.dom.mount.innerHTML = `
                <header class="rg-header" data-rg-header>
                    <div
                        class="rg-header__energy"
                        aria-hidden="true"
                    ></div>

                   <div class="rg-header__inner">
    <button
        class="rg-header__mobile-toggle"
        type="button"
        data-rg-mobile-toggle
        aria-label="Open menu"
        aria-expanded="false"
    >
        <span data-rg-mobile-icon>
            ${ICONS.menu}
        </span>
    </button>

    <a
        class="rg-header__brand"
        href="index.html"
        aria-label="Rivals Gauntlet home"
    >
        <span class="rg-header__brand-copy">
                                <strong>RIVALS GAUNTLET</strong>
                                <small>COMPETE • PREDICT • EARN</small>
                            </span>
                        </a>

                        <nav
                            class="rg-header__nav"
                            data-rg-nav
                            aria-label="Primary navigation"
                        >
                            ${navItems}
                        </nav>

                        <div class="rg-header__utilities">
                            <div
                                class="rg-header__auth rg-header__auth--out"
                                data-rg-auth="signed-out"
                            >
                                <a
                                    class="rg-header__sign-in"
                                    href="${this.escapeAttribute(
                                        this.config.signInHref
                                    )}"
                                >
                                    Sign In
                                </a>

                                <a
                                    class="rg-header__create-account"
                                    href="${this.escapeAttribute(
                                        this.config.createAccountHref
                                    )}"
                                >
                                    Create Account
                                </a>
                            </div>

                            <div
                                class="rg-header__auth rg-header__auth--in"
                                data-rg-auth="signed-in"
                                hidden
                            >
                                <button
                                    class="rg-utility rg-utility--points"
                                    type="button"
                                    data-rg-points-toggle
                                    aria-label="View RG Points"
                                >
                                    <span
                                        class="rg-utility__icon rg-utility__icon--asset"
                                    >
                                        <img
                                            src="rg-points-icon.PNG"
                                            alt=""
                                            data-rg-asset-fallback="coin"
                                        >
                                    </span>

                                    <span class="rg-utility__copy">
                                        <strong data-rg-points-short>
                                            0
                                        </strong>

                                        <small>RG</small>
                                    </span>
                                </button>

                                <button
                                    class="rg-utility"
                                    type="button"
                                    data-rg-friends-toggle
                                    aria-label="Open friends"
                                >
                                    <span
                                        class="rg-utility__icon rg-utility__icon--asset"
                                    >
                                        <img
                                            src="friends-icon.PNG"
                                            alt=""
                                            data-rg-asset-fallback="friend"
                                        >
                                    </span>

                                    <span
                                        class="rg-badge"
                                        data-rg-friends-badge
                                        hidden
                                    >
                                        0
                                    </span>
                                </button>

                                <button
                                    class="rg-utility"
                                    type="button"
                                    data-rg-notifications-toggle
                                    aria-label="Open notifications"
                                >
                                    <span
                                        class="rg-utility__icon rg-utility__icon--asset"
                                    >
                                        <img
                                            src="notification-bell.PNG"
                                            alt=""
                                            data-rg-asset-fallback="bell"
                                        >
                                    </span>

                                    <span
                                        class="rg-badge"
                                        data-rg-notifications-badge
                                        hidden
                                    >
                                        0
                                    </span>
                                </button>

                                <div class="rg-profile">
                                    <button
                                        class="rg-profile__toggle"
                                        type="button"
                                        data-rg-profile-toggle
                                        aria-haspopup="menu"
                                        aria-expanded="false"
                                    >
                                        <span
                                            class="rg-profile__avatar"
                                            data-rg-profile-avatar
                                        >
                                            <span
                                                data-rg-profile-initial
                                            >
                                                R
                                            </span>
                                        </span>

                                        <span class="rg-profile__copy">
                                            <strong
                                                data-rg-profile-name
                                            >
                                                Player
                                            </strong>

                                            <small>Competitor</small>
                                        </span>

                                        <span
                                            class="rg-profile__chevron"
                                        >
                                            ${ICONS.chevron}
                                        </span>
                                    </button>

                                    <div
                                        class="rg-profile-menu"
                                        data-rg-profile-menu
                                        role="menu"
                                        hidden
                                    >
                                        <div
                                            class="rg-profile-menu__identity"
                                        >
                                            <span
                                                class="rg-profile-menu__avatar"
                                                data-rg-menu-avatar
                                            >
                                                <span
                                                    data-rg-menu-initial
                                                >
                                                    R
                                                </span>
                                            </span>

                                            <span>
                                                <strong
                                                    data-rg-menu-name
                                                >
                                                    Player
                                                </strong>

                                                <small
                                                    data-rg-menu-email
                                                ></small>
                                            </span>
                                        </div>

                                        <div
                                            class="rg-profile-menu__links"
                                        >
                                            ${accountLinks}
                                        </div>

                                        <button
                                            class="rg-profile-menu__item rg-profile-menu__item--danger"
                                            type="button"
                                            data-rg-sign-out
                                        >
                                            <span
                                                class="rg-profile-menu__icon"
                                            >
                                                ${ICONS.signout}
                                            </span>

                                            <span>Sign Out</span>
                                        </button>
                                    </div>
                                </div>
                            </div>

                         
                        </div>
                    </div>

                    <div
                        class="rg-mobile-panel"
                        data-rg-mobile-panel
                        hidden
                    >
                        <nav
                            class="rg-mobile-panel__nav"
                            aria-label="Mobile navigation"
                        >
                            ${mobileNavItems}
                        </nav>

                        <div
                            class="rg-mobile-panel__auth"
                            data-rg-mobile-auth
                        ></div>
                    </div>
                </header>

                <div
                    class="rg-overlay-backdrop"
                    data-rg-backdrop
                    hidden
                ></div>

                <aside
                    class="rg-drawer rg-drawer--friends"
                    data-rg-drawer="friends"
                    aria-hidden="true"
                    aria-labelledby="rgFriendsTitle"
                >
                    <div class="rg-drawer__header">
                        <div>
                            <span class="rg-drawer__eyebrow">
                                SOCIAL
                            </span>

                            <h2 id="rgFriendsTitle">
                                Friends
                            </h2>
                        </div>

                        <button
                            class="rg-icon-button"
                            type="button"
                            data-rg-close
                            aria-label="Close friends"
                        >
                            ${ICONS.close}
                        </button>
                    </div>

                    <div class="rg-drawer__search">
                        <span>${ICONS.search}</span>

                        <input
                            type="search"
                            data-rg-friend-search
                            placeholder="Search friends or players"
                            autocomplete="off"
                            aria-label="Search friends or players"
                        >
                    </div>

                 <div
    class="rg-tabs"
    role="tablist"
    aria-label="Friends sections"
    style="
        grid-template-columns:
        repeat(3, minmax(0, 1fr));
    "
>
    <button
        class="rg-tab is-active"
        type="button"
        role="tab"
        aria-selected="true"
        data-rg-friends-tab="friends"
    >
        Friends

        <span data-rg-friends-count>
            0
        </span>
    </button>

    <button
        class="rg-tab"
        type="button"
        role="tab"
        aria-selected="false"
        data-rg-friends-tab="gifts"
    >
        Gifts

        <span data-rg-gifts-count>
            0
        </span>
    </button>

    <button
        class="rg-tab"
        type="button"
        role="tab"
        aria-selected="false"
        data-rg-friends-tab="requests"
    >
        Requests

        <span data-rg-requests-count>
            0
        </span>
    </button>
</div>

                    <div class="rg-drawer__body">
                        <div data-rg-friends-panel="friends">
                            <div
                                class="rg-skeleton-list"
                                data-rg-friends-loading
                            >
                                ${this.skeletonRows(5)}
                            </div>

                            <div data-rg-friends-list></div>
                        </div>

<div
    data-rg-friends-panel="gifts"
    hidden
>
    <div data-rg-gifts-list></div>
</div>

                        <div
                            data-rg-friends-panel="requests"
                            hidden
                        >
                            <div data-rg-requests-list></div>
                        </div>
                    </div>
                </aside>

                <aside
                    class="rg-drawer rg-drawer--notifications"
                    data-rg-drawer="notifications"
                    aria-hidden="true"
                    aria-labelledby="rgNotificationsTitle"
                >
                    <div class="rg-drawer__header">
                        <div>
                            <span class="rg-drawer__eyebrow">
                                INBOX
                            </span>

                            <h2 id="rgNotificationsTitle">
                                Notifications
                            </h2>
                        </div>

                        <div class="rg-drawer__header-actions">
                            <button
                                class="rg-text-button"
                                type="button"
                                data-rg-mark-all-read
                            >
                                Mark All Read
                            </button>

                            <button
                                class="rg-icon-button"
                                type="button"
                                data-rg-close
                                aria-label="Close notifications"
                            >
                                ${ICONS.close}
                            </button>
                        </div>
                    </div>

                    <div class="rg-notification-summary">
                        <strong
                            data-rg-notification-summary
                        >
                            You're all caught up
                        </strong>

                        <span
                            data-rg-notification-subsummary
                        >
                            New activity will appear here.
                        </span>
                    </div>

                    <div class="rg-drawer__body">
                        <div
                            class="rg-skeleton-list"
                            data-rg-notifications-loading
                        >
                            ${this.skeletonRows(5, true)}
                        </div>

                        <div
                            class="rg-notification-list"
                            data-rg-notification-list
                        ></div>
                    </div>
                </aside>

                <div
                    class="rg-modal-shell"
                    data-rg-modal="points"
                    aria-hidden="true"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="rgPointsTitle"
                >
                    <div class="rg-modal rg-points-modal">
                        <button
                            class="rg-icon-button rg-modal__close"
                            type="button"
                            data-rg-close
                            aria-label="Close RG Points"
                        >
                            ${ICONS.close}
                        </button>

                        <div class="rg-points-modal__icon">
                            <img
                                src="rg-points-icon.PNG"
                                alt=""
                                data-rg-asset-fallback="coin"
                            >
                        </div>

                        <span class="rg-points-modal__eyebrow">
                            YOUR BALANCE
                        </span>

                        <h2
                            id="rgPointsTitle"
                            data-rg-points-full
                        >
                            0
                        </h2>

                        <p>
                            ${this.escapeHTML(
                                this.config.pointsLabel
                            )}
                        </p>

                        <div class="rg-points-modal__footer">
                            Earn RG Points through predictions,
                            tournaments, daily rewards, and
                            community activity.
                        </div>
                    </div>
                </div>

                <div
                    class="rg-toast-region"
                    data-rg-toast-region
                    aria-live="polite"
                    aria-atomic="false"
                ></div>
            `;
        }

        skeletonRows(count = 4, notification = false) {
            return Array.from(
                {
                    length: count
                },
                () => {
                    return `
                        <div
                            class="rg-skeleton-row ${
                                notification
                                    ? "rg-skeleton-row--notification"
                                    : ""
                            }"
                        >
                            <span
                                class="rg-skeleton rg-skeleton--avatar"
                            ></span>

                            <span class="rg-skeleton-row__copy">
                                <span
                                    class="rg-skeleton rg-skeleton--line"
                                ></span>

                                <span
                                    class="rg-skeleton rg-skeleton--line rg-skeleton--line-short"
                                ></span>
                            </span>
                        </div>
                    `;
                }
            ).join("");
        }

        // =====================================================================
        // CACHE GENERATED DOM
        // =====================================================================

        cacheDOM() {
            const root = this.dom.mount;

            this.dom.header = root.querySelector(
                SELECTORS.header
            );

            this.dom.mobilePanel = root.querySelector(
                SELECTORS.mobilePanel
            );

            this.dom.mobileToggle = root.querySelector(
                SELECTORS.mobileToggle
            );

            this.dom.mobileIcon = root.querySelector(
                "[data-rg-mobile-icon]"
            );

            this.dom.profileToggle = root.querySelector(
                SELECTORS.profileToggle
            );

            this.dom.profileMenu = root.querySelector(
                SELECTORS.profileMenu
            );

            this.dom.signedIn = root.querySelector(
                SELECTORS.authSignedIn
            );

            this.dom.signedOut = root.querySelector(
                SELECTORS.authSignedOut
            );

            this.dom.mobileAuth = root.querySelector(
                "[data-rg-mobile-auth]"
            );

            this.dom.backdrop = root.querySelector(
                SELECTORS.backdrop
            );

            this.dom.pointsModal = root.querySelector(
                "[data-rg-modal='points']"
            );

            this.dom.friendsDrawer = root.querySelector(
                "[data-rg-drawer='friends']"
            );

            this.dom.notificationsDrawer = root.querySelector(
                "[data-rg-drawer='notifications']"
            );

            this.dom.toastRegion = root.querySelector(
                SELECTORS.toastRegion
            );

            this.dom.pointsShort = root.querySelector(
                "[data-rg-points-short]"
            );

            this.dom.pointsFull = root.querySelector(
                "[data-rg-points-full]"
            );

            this.dom.profileName = root.querySelector(
                "[data-rg-profile-name]"
            );

            this.dom.menuName = root.querySelector(
                "[data-rg-menu-name]"
            );

            this.dom.menuEmail = root.querySelector(
                "[data-rg-menu-email]"
            );

            this.dom.profileAvatar = root.querySelector(
                "[data-rg-profile-avatar]"
            );

            this.dom.menuAvatar = root.querySelector(
                "[data-rg-menu-avatar]"
            );

            this.dom.profileInitial = root.querySelector(
                "[data-rg-profile-initial]"
            );

            this.dom.menuInitial = root.querySelector(
                "[data-rg-menu-initial]"
            );

            this.dom.notificationBadge = root.querySelector(
                "[data-rg-notifications-badge]"
            );

            this.dom.friendsBadge = root.querySelector(
                "[data-rg-friends-badge]"
            );

            this.dom.notificationList = root.querySelector(
                "[data-rg-notification-list]"
            );

            this.dom.notificationsLoading = root.querySelector(
                "[data-rg-notifications-loading]"
            );

            this.dom.notificationSummary = root.querySelector(
                "[data-rg-notification-summary]"
            );

            this.dom.notificationSubsummary = root.querySelector(
                "[data-rg-notification-subsummary]"
            );

            this.dom.friendsList = root.querySelector(
                "[data-rg-friends-list]"
            );

            this.dom.requestsList = root.querySelector(
                "[data-rg-requests-list]"
            );

            this.dom.friendsLoading = root.querySelector(
                "[data-rg-friends-loading]"
            );

            this.dom.friendsCount = root.querySelector(
                "[data-rg-friends-count]"
            );

            this.dom.requestsCount = root.querySelector(
                "[data-rg-requests-count]"
            );

this.dom.giftsList = root.querySelector(
    "[data-rg-gifts-list]"
);

this.dom.giftsCount = root.querySelector(
    "[data-rg-gifts-count]"
);

            this.dom.friendSearch = root.querySelector(
                "[data-rg-friend-search]"
            );
        }

        // =====================================================================
        // EVENT BINDING
        // =====================================================================

        bindEvents() {
            this.listen(
                this.dom.mount,
                "click",
                (event) => this.handleClick(event)
            );

            this.listen(
                document,
                "keydown",
                (event) => this.handleKeydown(event)
            );

            this.listen(
                document,
                "click",
                (event) => this.handleDocumentClick(event)
            );

            this.listen(
                window,
                "resize",
                () => this.updateResponsiveState(),
                {
                    passive: true
                }
            );

            this.listen(
                window,
                "popstate",
                () => this.applyActiveNavigation()
            );

            if (this.dom.friendSearch) {
                this.listen(
                    this.dom.friendSearch,
                    "input",
                    this.debounce((event) => {
                        this.filterFriends(
                            event.target.value
                        );
                    }, 120)
                );
            }

            this.dom.mount
                .querySelectorAll(
                    "img[data-rg-asset-fallback]"
                )
                .forEach((img) => {
                    this.listen(
                        img,
                        "error",
                        () => this.replaceBrokenAsset(img),
                        {
                            once: true
                        }
                    );
                });
        }

        listen(target, type, handler, options) {
            if (!target) {
                return;
            }

            target.addEventListener(
                type,
                handler,
                options
            );

            this.state.listeners.push(() => {
                target.removeEventListener(
                    type,
                    handler,
                    options
                );
            });
        }

        // =====================================================================
        // MAIN CLICK ROUTER
        // =====================================================================

        handleClick(event) {
            const target = event.target;

            if (
                target.closest(
                    "[data-rg-mobile-toggle]"
                )
            ) {
                this.toggleMobileMenu();
                return;
            }

            if (
                target.closest(
                    "[data-rg-profile-toggle]"
                )
            ) {
                this.toggleProfileMenu();
                return;
            }

            if (
                target.closest(
                    "[data-rg-points-toggle]"
                )
            ) {
                this.openPoints();
                return;
            }

            if (
                target.closest(
                    "[data-rg-friends-toggle]"
                )
            ) {
                this.openFriends();
                return;
            }

            if (
                target.closest(
                    "[data-rg-notifications-toggle]"
                )
            ) {
                this.openNotifications();
                return;
            }

            if (
                target.closest(
                    "[data-rg-close]"
                )
            ) {
                this.closeAll();
                return;
            }

            if (
                target.closest(
                    "[data-rg-backdrop]"
                )
            ) {
                this.closeAll();
                return;
            }

            if (
                target.closest(
                    "[data-rg-sign-out]"
                )
            ) {
                this.signOut();
                return;
            }

            if (
                target.closest(
                    "[data-rg-mark-all-read]"
                )
            ) {
                this.markAllNotificationsRead();
                return;
            }

            const tab = target.closest(
                "[data-rg-friends-tab]"
            );

            if (tab) {
                this.setFriendsTab(
                    tab.dataset.rgFriendsTab
                );
                return;
            }

            const notificationAction = target.closest(
                "[data-rg-notification-action]"
            );

            if (notificationAction) {
                this.handleNotificationAction(
                    notificationAction
                );
                return;
            }

            const friendAction = target.closest(
                "[data-rg-friend-action]"
            );

            if (friendAction) {
                this.handleFriendAction(
                    friendAction
                );
                return;
            }

            const requestAction = target.closest(
                "[data-rg-request-action]"
            );

            if (requestAction) {
                this.handleRequestAction(
                    requestAction
                );
                return;
            }

            const navLink = target.closest(
                "[data-rg-nav-link]"
            );

            if (
                navLink &&
                this.state.mobileOpen
            ) {
                this.closeMobileMenu();
            }
        }

        handleDocumentClick(event) {
            if (!this.state.profileOpen) {
                return;
            }

            if (
                event.target.closest(
                    "[data-rg-profile-toggle], [data-rg-profile-menu]"
                )
            ) {
                return;
            }

            this.closeProfileMenu();
        }

        handleKeydown(event) {
            if (event.key === "Escape") {
                this.closeAll();
                return;
            }

            if (
                event.key === "Tab" &&
                (
                    this.state.activeDrawer ||
                    this.state.activeModal
                )
            ) {
                this.trapFocus(event);
            }
        }

        // =====================================================================
        // MOBILE MENU
        // =====================================================================

        toggleMobileMenu(force) {
            const shouldOpen =
                typeof force === "boolean"
                    ? force
                    : !this.state.mobileOpen;

            if (shouldOpen) {
                this.openMobileMenu();
            } else {
                this.closeMobileMenu();
            }
        }

        openMobileMenu() {
            this.closeProfileMenu();

            this.state.mobileOpen = true;

            this.dom.mobilePanel.hidden = false;

            this.dom.header.classList.add(
                "is-mobile-open"
            );

            this.dom.mobileToggle.setAttribute(
                "aria-expanded",
                "true"
            );

            this.dom.mobileToggle.setAttribute(
                "aria-label",
                "Close menu"
            );

            this.dom.mobileIcon.innerHTML =
                ICONS.close;

            this.syncMobileAuth();
        }

        closeMobileMenu() {
            this.state.mobileOpen = false;

            this.dom.mobilePanel.hidden = true;

            this.dom.header.classList.remove(
                "is-mobile-open"
            );

            this.dom.mobileToggle.setAttribute(
                "aria-expanded",
                "false"
            );

            this.dom.mobileToggle.setAttribute(
                "aria-label",
                "Open menu"
            );

            this.dom.mobileIcon.innerHTML =
                ICONS.menu;
        }

        // =====================================================================
        // PROFILE MENU
        // =====================================================================

        toggleProfileMenu(force) {
            const shouldOpen =
                typeof force === "boolean"
                    ? force
                    : !this.state.profileOpen;

            if (shouldOpen) {
                this.openProfileMenu();
            } else {
                this.closeProfileMenu();
            }
        }

        openProfileMenu() {
            this.closeMobileMenu();

            this.state.profileOpen = true;

            this.dom.profileMenu.hidden = false;

            this.dom.profileToggle.setAttribute(
                "aria-expanded",
                "true"
            );

            requestAnimationFrame(() => {
                this.dom.profileMenu.classList.add(
                    "is-open"
                );
            });
        }

        closeProfileMenu() {
            if (!this.dom.profileMenu) {
                return;
            }

            this.state.profileOpen = false;

            this.dom.profileMenu.classList.remove(
                "is-open"
            );

            this.dom.profileToggle?.setAttribute(
                "aria-expanded",
                "false"
            );

            window.setTimeout(() => {
                if (!this.state.profileOpen) {
                    this.dom.profileMenu.hidden = true;
                }
            }, 170);
        }

        // =====================================================================
        // RESPONSIVE STATE
        // =====================================================================

        updateResponsiveState() {
            const width = window.innerWidth;

            if (
                width <=
                this.config.mobileBreakpoint
            ) {
                document.documentElement.dataset.rgViewport =
                    "mobile";
            } else if (
                width <=
                this.config.tabletBreakpoint
            ) {
                document.documentElement.dataset.rgViewport =
                    "tablet";
            } else {
                document.documentElement.dataset.rgViewport =
                    "desktop";
            }

            if (
                width >
                    this.config.mobileBreakpoint &&
                this.state.mobileOpen
            ) {
                this.closeMobileMenu();
            }
        }

        // =====================================================================
        // ACTIVE NAVIGATION
        // =====================================================================

        applyActiveNavigation() {
            const page =
                this.getCurrentPageKey();

            this.dom.mount
                .querySelectorAll(
                    "[data-rg-nav-link]"
                )
                .forEach((link) => {
                    const keys = (
                        link.dataset.rgNavKeys || ""
                    )
                        .split(",")
                        .map((value) => {
                            return value
                                .trim()
                                .toLowerCase();
                        })
                        .filter(Boolean);

                    const active = keys.some(
                        (key) => {
                            return (
                                page === key ||
                                page.startsWith(
                                    `${key}-`
                                )
                            );
                        }
                    );

                    link.classList.toggle(
                        "is-active",
                        active
                    );

                    if (active) {
                        link.setAttribute(
                            "aria-current",
                            "page"
                        );
                    } else {
                        link.removeAttribute(
                            "aria-current"
                        );
                    }
                });
        }

        getCurrentPageKey() {
            const explicit =
                document.body?.dataset?.page;

            if (explicit) {
                return explicit
                    .toLowerCase()
                    .replace(/\.html?$/, "");
            }

            const file =
                window.location.pathname
                    .split("/")
                    .pop() || "";

            return (
                file
                    .toLowerCase()
                    .replace(/\.html?$/, "")
                    .replace(/^index$/, "") ||
                "home"
            );
        }

          // =====================================================================
        // FIREBASE AUTHENTICATION
        // =====================================================================

        bindAuth() {
            if (
                !this.auth ||
                typeof this.auth.onAuthStateChanged !==
                    "function"
            ) {
                this.warn(
                    "window.auth does not expose onAuthStateChanged()."
                );

                this.setSignedOutUI();
                return;
            }

            const unsubscribe =
                this.auth.onAuthStateChanged(
                    (user) => {
                        this.onAuthStateChanged(user);
                    },

                    (error) => {
                        this.warn(
                            "Auth listener error:",
                            error
                        );

                        this.setSignedOutUI();

                        this.showToast(
                            "Could not load your account.",
                            "error"
                        );
                    }
                );

            if (
    typeof unsubscribe ===
    "function"
) {
    this.authUnsubscribe =
        unsubscribe;
}
        }

        async onAuthStateChanged(user) {
            this.detachUserListeners();

            this.state.user = user || null;
            this.state.player = null;

            this.state.points = 0;

            this.state.notifications = [];
this.state.friends = [];
this.state.friendRequests = [];
this.state.giftInbox = [];

this.state.dailyGiftStats = {
    sentCount: 0,
    receivedCount: 0,
    receivedLimit: 5,
    sentTo: {}
};

            this.state.notificationUnread = 0;
            this.state.friendRequestCount = 0;
            this.state.firstNotificationLoad = true;

            if (!user) {
                this.setSignedOutUI();

                this.renderNotifications([]);
this.renderFriends([]);
this.renderFriendRequests([]);
this.renderGiftInbox([]);

                window.dispatchEvent(
                    new CustomEvent(
                        "rgheader:authchange",
                        {
                            detail: {
                                user: null
                            }
                        }
                    )
                );

                return;
            }

            this.setSignedInUI(user);

            this.attachPlayerListener(
                user.uid
            );

            this.attachNotificationListeners(
                user.uid
            );

            this.attachFriendListeners(
                user.uid
            );

            window.dispatchEvent(
                new CustomEvent(
                    "rgheader:authchange",
                    {
                        detail: {
                            user
                        }
                    }
                )
            );
        }

        // =====================================================================
        // SIGNED-OUT UI
        // =====================================================================

        setSignedOutUI() {
            if (
                !this.dom.signedOut ||
                !this.dom.signedIn
            ) {
                return;
            }

            this.dom.signedOut.hidden = false;
            this.dom.signedIn.hidden = true;

            this.updatePoints(0);

            this.updateNotificationBadge();
            this.updateFriendsBadge();

            this.closeAll();
            this.syncMobileAuth();

            document.documentElement.classList.remove(
                "rg-authenticated"
            );

            document.documentElement.classList.add(
                "rg-signed-out"
            );
        }

        // =====================================================================
        // SIGNED-IN UI
        // =====================================================================

        setSignedInUI(user) {
            this.dom.signedOut.hidden = true;
            this.dom.signedIn.hidden = false;

            this.updateIdentity({
                displayName:
                    user.displayName ||
                    this.nameFromEmail(
                        user.email
                    ) ||
                    "Player",

                email:
                    user.email ||
                    "",

                avatar:
                    user.photoURL ||
                    ""
            });

            this.updatePoints(0);
            this.syncMobileAuth();

            document.documentElement.classList.add(
                "rg-authenticated"
            );

            document.documentElement.classList.remove(
                "rg-signed-out"
            );
        }

        // =====================================================================
        // MOBILE AUTHENTICATION MENU
        // =====================================================================

        syncMobileAuth() {
            if (!this.dom.mobileAuth) {
                return;
            }

            if (!this.state.user) {
                this.dom.mobileAuth.innerHTML = `
                    <a
                        class="rg-mobile-panel__sign-in"
                        href="${this.escapeAttribute(
                            this.config.signInHref
                        )}"
                    >
                        Sign In
                    </a>

                    <a
                        class="rg-mobile-panel__create"
                        href="${this.escapeAttribute(
                            this.config.createAccountHref
                        )}"
                    >
                        Create Account
                    </a>
                `;

                return;
            }

            this.dom.mobileAuth.innerHTML = "";
        }

        // =====================================================================
        // PLAYER FIREBASE LISTENER
        // =====================================================================

        attachPlayerListener(uid) {
            const paths =
                this.config.playerPaths.map(
                    (path) => {
                        return this.interpolate(
                            path,
                            {
                                uid
                            }
                        );
                    }
                );

            this.attachFirstAvailablePath(
                paths,

                (snapshot) => {
                    const player =
                        snapshot?.val?.() ??
                        null;

                    this.state.player =
                        player || {};

                    const displayName =
                        this.pick(
                            player,
                            this.config
                                .displayNameKeys
                        ) ||
                        this.state.user
                            ?.displayName ||
                        this.nameFromEmail(
                            this.state.user
                                ?.email
                        ) ||
                        "Player";

                    const avatar =
                        this.pick(
                            player,
                            this.config.avatarKeys
                        ) ||
                        this.state.user
                            ?.photoURL ||
                        "";

                    const pointsRaw =
                        this.pick(
                            player,
                            this.config.pointsKeys
                        );

                    const points =
                        this.normalizeNumber(
                            pointsRaw
                        );

                    this.updateIdentity({
                        displayName,
                        email:
                            this.state.user
                                ?.email ||
                            "",
                        avatar
                    });

                    this.updatePoints(
                        points
                    );

                    window.dispatchEvent(
                        new CustomEvent(
                            "rgheader:playerchange",
                            {
                                detail: {
                                    player:
                                        this.state
                                            .player,

                                    points
                                }
                            }
                        )
                    );
                },

                "player"
            );
        }

        // =====================================================================
        // NOTIFICATION FIREBASE LISTENER
        // =====================================================================

        attachNotificationListeners(uid) {
            const paths =
                this.config.notificationPaths.map(
                    (path) => {
                        return this.interpolate(
                            path,
                            {
                                uid
                            }
                        );
                    }
                );

            this.attachFirstAvailablePath(
                paths,

                (snapshot) => {
                    const raw =
                        snapshot?.val?.() ??
                        {};

                    const notifications =
                        this.normalizeCollection(
                            raw
                        )
                            .map((item) => {
                                return this.normalizeNotification(
                                    item
                                );
                            })
                            .filter(Boolean)
                            .sort((a, b) => {
                                return (
                                    b.timestamp -
                                    a.timestamp
                                );
                            })
                            .slice(
                                0,
                                this.config
                                    .maxNotifications
                            );

                    const previousUnread =
                        this.state
                            .notificationUnread;

                    this.state.notifications =
                        notifications;

                    this.state.notificationUnread =
                        notifications.filter(
                            (item) => {
                                return !item.read;
                            }
                        ).length;

                    this.updateNotificationBadge();

                    this.renderNotifications(
                        notifications
                    );

                    if (
                        !this.state
                            .firstNotificationLoad &&
                        this.state
                            .notificationUnread >
                            previousUnread
                    ) {
                        this.animateBadge(
                            this.dom
                                .notificationBadge
                        );
                    }

                    this.state.firstNotificationLoad =
                        false;

                    window.dispatchEvent(
                        new CustomEvent(
                            "rgheader:notificationschange",
                            {
                                detail: {
                                    notifications,

                                    unread:
                                        this.state
                                            .notificationUnread
                                }
                            }
                        )
                    );
                },

                "notifications"
            );
        }

        // =====================================================================
        // FRIENDS FIREBASE LISTENERS
        // =====================================================================

        attachFriendListeners(uid) {
    if (
        !uid ||
        !this.database ||
        typeof this.database.ref !== "function"
    ) {
        this.renderFriends([]);
        this.renderFriendRequests([]);
        return;
    }

    const userFriendsRef = this.database.ref(
        `userFriends/${uid}`
    );

    let loadVersion = 0;

    const handler = async (snapshot) => {
        const currentLoad = ++loadVersion;
        const entries = snapshot?.val?.() || {};

        const friendUids = Object.keys(entries)
            .filter((friendUid) => {
                return friendUid && friendUid !== uid;
            })
            .slice(0, this.config.maxFriends);

        if (!friendUids.length) {
            this.state.friends = [];
            this.renderFriends([]);

            window.dispatchEvent(
                new CustomEvent(
                    "rgheader:friendschange",
                    {
                        detail: {
                            friends: []
                        }
                    }
                )
            );

            return;
        }

        try {
            const friends = (
                await Promise.all(
                    friendUids.map(async (friendUid) => {
                        const playerSnapshot =
                            await this.database
                                .ref(`players/${friendUid}`)
                                .once("value");

                        const player =
                            playerSnapshot.val() || {};

                        return {
                            id: friendUid,

                            name: String(
                                player.displayName ||
                                player.rivalsIgn ||
                                player.rgId ||
                                "Player"
                            ),

                            avatar: String(
                                player.profileImage ||
                                player.avatarUrl ||
                                player.photoURL ||
                                ""
                            ),

                            online: false,
                            canInvite: false,

                            statusText: String(
                                player.rgId ||
                                player.rivalsIgn ||
                                "Rivals Gauntlet Player"
                            ),

                            raw: {
                                uid: friendUid,
                                ...player,
                                friendship:
                                    entries[friendUid] || {}
                            }
                        };
                    })
                )
            )
                .filter(Boolean)
                .sort((a, b) => {
                    return a.name.localeCompare(b.name);
                });

            if (
                currentLoad !== loadVersion ||
                this.state.user?.uid !== uid
            ) {
                return;
            }

            this.state.friends = friends;
            this.renderFriends(friends);

            window.dispatchEvent(
                new CustomEvent(
                    "rgheader:friendschange",
                    {
                        detail: {
                            friends
                        }
                    }
                )
            );
        } catch (error) {
            this.warn(
                "Could not load friend profiles:",
                error
            );

            if (this.dom.friendsLoading) {
                this.dom.friendsLoading.hidden = true;
            }

            if (this.dom.friendsList) {
                this.dom.friendsList.innerHTML =
                    this.emptyState(
                        "Friends unavailable",
                        "Your friend list could not be loaded. Refresh and try again.",
                        "friend"
                    );
            }
        }
    };

    const errorHandler = (error) => {
        this.warn(
            "userFriends listener failed:",
            error
        );

        this.state.friends = [];

        if (this.dom.friendsLoading) {
            this.dom.friendsLoading.hidden = true;
        }

        if (this.dom.friendsList) {
            this.dom.friendsList.innerHTML =
                this.emptyState(
                    "Friends unavailable",
                    "Your account could not read its friend list.",
                    "friend"
                );
        }
    };

    userFriendsRef.on(
        "value",
        handler,
        errorHandler
    );

    this.state.firebaseListeners.push(() => {
        userFriendsRef.off(
            "value",
            handler
        );
    });

if (
    window.RGDailyGifts &&
    typeof window.RGDailyGifts.listenToDailyStats ===
        "function"
) {
    const stopDailyGiftStats =
        window.RGDailyGifts.listenToDailyStats(
            uid,
            stats => {
                this.state.dailyGiftStats =
                    stats || {
                        sentCount: 0,
                        receivedCount: 0,
                        receivedLimit: 5,
                        sentTo: {}
                    };

                this.renderFriends(
                    this.state.friends
                );
            }
        );

    if (
        typeof stopDailyGiftStats ===
        "function"
    ) {
        this.state.firebaseListeners.push(
            stopDailyGiftStats
        );
    }
}

if (
    window.RGDailyGifts &&
    typeof window.RGDailyGifts.listenToGiftInbox ===
        "function"
) {
    const stopGiftInbox =
        window.RGDailyGifts.listenToGiftInbox(
            uid,
            gifts => {
                this.state.giftInbox =
                    Array.isArray(gifts)
                        ? gifts
                        : [];

                this.renderGiftInbox(
                    this.state.giftInbox
                );
            }
        );

    if (
        typeof stopGiftInbox ===
        "function"
    ) {
        this.state.firebaseListeners.push(
            stopGiftInbox
        );
    }
}

    const incomingRequestsRef =
    this.database.ref(
        `userFriendRequests/${uid}/incoming`
    );

let requestLoadVersion = 0;

const requestHandler = async snapshot => {
    const currentLoad =
        ++requestLoadVersion;

    const requestIndex =
        snapshot?.val?.() || {};

    const requestIds =
        Object.keys(requestIndex);

    if (!requestIds.length) {
        this.state.friendRequests = [];
        this.state.friendRequestCount = 0;

        this.updateFriendsBadge();
        this.renderFriendRequests([]);

        return;
    }

    try {
        const requests = (
            await Promise.all(
                requestIds.map(
                    async requestId => {
                        const requestSnapshot =
                            await this.database
                                .ref(
                                    `friendRequests/${requestId}`
                                )
                                .once("value");

                        const request =
                            requestSnapshot.val();

                        if (
                            !request ||
                            request.receiverUid !== uid ||
                            request.status !== "pending"
                        ) {
                            return null;
                        }

                        let sender = {};

                        try {
                            const senderSnapshot =
                                await this.database
                                    .ref(
                                        `players/${request.senderUid}`
                                    )
                                    .once("value");

                            sender =
                                senderSnapshot.val() || {};
                        } catch (error) {
                            console.warn(
                                "Friend request sender could not be loaded:",
                                error
                            );
                        }

                        return {
                            id: requestId,

                            fromUid: String(
                                request.senderUid || ""
                            ),

                            name: String(
                                sender.displayName ||
                                request.senderName ||
                                sender.rivalsIgn ||
                                "Player"
                            ),

                            avatar: String(
                                sender.profileImage || ""
                            ),

                            status: "pending",

                            timestamp:
                                this.normalizeTimestamp(
                                    request.createdAt
                                ),

                            raw: request
                        };
                    }
                )
            )
        )
            .filter(Boolean)
            .sort((requestA, requestB) => {
                return (
                    requestB.timestamp -
                    requestA.timestamp
                );
            });

        if (
            currentLoad !== requestLoadVersion ||
            this.state.user?.uid !== uid
        ) {
            return;
        }

        this.state.friendRequests =
            requests;

        this.state.friendRequestCount =
            requests.length;

        this.updateFriendsBadge();

        this.renderFriendRequests(
            requests
        );
    } catch (error) {
        console.error(
            "Friend requests could not be loaded:",
            error
        );

        this.state.friendRequests = [];
        this.state.friendRequestCount = 0;

        this.updateFriendsBadge();
        this.renderFriendRequests([]);
    }
};

const requestErrorHandler = error => {
    console.error(
        "Incoming friend request listener failed:",
        error
    );

    this.state.friendRequests = [];
    this.state.friendRequestCount = 0;

    this.updateFriendsBadge();
    this.renderFriendRequests([]);
};

incomingRequestsRef.on(
    "value",
    requestHandler,
    requestErrorHandler
);

this.state.firebaseListeners.push(() => {
    incomingRequestsRef.off(
        "value",
        requestHandler
    );
});
}

        // =====================================================================
        // GENERIC FIREBASE PATH FALLBACK LISTENER
        // =====================================================================

        attachFirstAvailablePath(
            paths,
            callback,
            label
        ) {
            if (
                !this.database ||
                typeof this.database.ref !==
                    "function"
            ) {
                return;
            }

            let selectedPath = null;
            let selectedRef = null;
            let selectedHandler = null;
            let resolved = false;

            const candidates = [];

            const select = (
                path,
                ref,
                handler,
                snapshot
            ) => {
                if (
                    resolved &&
                    selectedPath !== path
                ) {
                    return;
                }

                if (!resolved) {
                    resolved = true;

                    selectedPath = path;
                    selectedRef = ref;
                    selectedHandler = handler;

                    candidates.forEach(
                        (candidate) => {
                            if (
                                candidate.path !==
                                path
                            ) {
                                candidate.ref.off(
                                    "value",
                                    candidate.handler
                                );
                            }
                        }
                    );

                    this.state.firebaseListeners.push(
                        () => {
                            selectedRef?.off?.(
                                "value",
                                selectedHandler
                            );
                        }
                    );
                }

                callback(snapshot);
            };

            paths.forEach(
                (path, index) => {
                    try {
                        const ref =
                            this.database.ref(
                                path
                            );

                        const handler =
                            (snapshot) => {
                                const value =
                                    snapshot?.val?.();

                                const hasValue =
                                    value !== null &&
                                    value !== undefined;

                                if (
                                    hasValue ||
                                    index ===
                                        paths.length -
                                            1
                                ) {
                                    select(
                                        path,
                                        ref,
                                        handler,
                                        snapshot
                                    );
                                }
                            };

                        candidates.push({
                            path,
                            ref,
                            handler
                        });

                        ref.on(
                            "value",

                            handler,

                            (error) => {
                                this.log(
                                    `${label} path failed:`,
                                    path,
                                    error
                                );

                                if (
                                    index ===
                                        paths.length -
                                            1 &&
                                    !resolved
                                ) {
                                    select(
                                        path,
                                        ref,
                                        handler,
                                        {
                                            val: () =>
                                                null
                                        }
                                    );
                                }
                            }
                        );
                    } catch (error) {
                        this.log(
                            `${label} listener setup failed:`,
                            path,
                            error
                        );
                    }
                }
            );
        }

        // =====================================================================
        // REMOVE FIREBASE USER LISTENERS
        // =====================================================================

        detachUserListeners() {
            this.state.firebaseListeners
                .splice(0)
                .forEach((unsubscribe) => {
                    try {
                        unsubscribe();
                    } catch (error) {
                        this.log(
                            "Listener cleanup failed:",
                            error
                        );
                    }
                });
        }

        // =====================================================================
        // PLAYER IDENTITY
        // =====================================================================

        updateIdentity({
            displayName,
            email,
            avatar
        }) {
            const safeName =
                String(
                    displayName ||
                    "Player"
                ).trim() ||
                "Player";

            const initial =
                safeName
                    .charAt(0)
                    .toUpperCase();

            this.dom.profileName.textContent =
                safeName;

            this.dom.menuName.textContent =
                safeName;

            this.dom.menuEmail.textContent =
                email || "";

            this.dom.profileInitial.textContent =
                initial;

            this.dom.menuInitial.textContent =
                initial;

            this.applyAvatar(
                this.dom.profileAvatar,
                avatar,
                initial
            );

            this.applyAvatar(
                this.dom.menuAvatar,
                avatar,
                initial
            );
        }

        applyAvatar(
            container,
            url,
            initial
        ) {
            if (!container) {
                return;
            }

            container
                .querySelectorAll("img")
                .forEach((img) => {
                    img.remove();
                });

            const fallback =
                container.querySelector(
                    "span"
                );

            if (fallback) {
                fallback.textContent =
                    initial;
            }

            if (!url) {
                container.classList.remove(
                    "has-image"
                );

                return;
            }

            const image = new Image();

            image.alt = "";
            image.decoding = "async";
            image.referrerPolicy =
                "no-referrer";

            image.onload = () => {
                container.prepend(image);

                container.classList.add(
                    "has-image"
                );
            };

            image.onerror = () => {
                container.classList.remove(
                    "has-image"
                );
            };

            image.src = url;
        }

        // =====================================================================
        // RG POINTS
        // =====================================================================

        updatePoints(value) {
            const points = Math.max(
                0,
                this.normalizeNumber(value)
            );

            this.state.points =
                points;

            if (this.dom.pointsShort) {
                this.dom.pointsShort.textContent =
                    this.formatCompact(
                        points
                    );
            }

            if (this.dom.pointsFull) {
                this.dom.pointsFull.textContent =
                    this.formatFull(
                        points
                    );
            }

            window.dispatchEvent(
                new CustomEvent(
                    "rgheader:pointschange",
                    {
                        detail: {
                            points
                        }
                    }
                )
            );
        }

        // =====================================================================
        // HEADER BADGES
        // =====================================================================

        updateNotificationBadge() {
            const count =
                this.state
                    .notificationUnread;

            this.updateBadge(
                this.dom.notificationBadge,
                count
            );

            const button =
                this.dom.mount.querySelector(
                    "[data-rg-notifications-toggle]"
                );

            if (button) {
                button.setAttribute(
                    "aria-label",

                    count
                        ? `Open notifications, ${count} unread`
                        : "Open notifications"
                );
            }
        }

        updateFriendsBadge() {
            const count =
                this.state
                    .friendRequestCount;

            this.updateBadge(
                this.dom.friendsBadge,
                count
            );

            const button =
                this.dom.mount.querySelector(
                    "[data-rg-friends-toggle]"
                );

            if (button) {
                button.setAttribute(
                    "aria-label",

                    count
                        ? `Open friends, ${count} pending requests`
                        : "Open friends"
                );
            }
        }

        updateBadge(
            element,
            count
        ) {
            if (!element) {
                return;
            }

            const numeric =
                Math.max(
                    0,
                    this.normalizeNumber(
                        count
                    )
                );

            element.hidden =
                numeric === 0;

            element.textContent =
                numeric > 99
                    ? "99+"
                    : String(numeric);

            element.classList.toggle(
                "is-visible",
                numeric > 0
            );
        }

        animateBadge(element) {
            if (
                !element ||
                element.hidden
            ) {
                return;
            }

            element.classList.remove(
                "is-popping"
            );

            void element.offsetWidth;

            element.classList.add(
                "is-popping"
            );

            window.setTimeout(
                () => {
                    element.classList.remove(
                        "is-popping"
                    );
                },
                500
            );
        }

        // =====================================================================
        // OPEN MAIN HEADER PANELS
        // =====================================================================

        openPoints() {
            if (
                !this.requireAuth(
                    "Sign in to view your RG Points."
                )
            ) {
                return;
            }

            this.openModal(
                "points"
            );
        }

        openFriends() {
            if (
                !this.requireAuth(
                    "Sign in to use Friends."
                )
            ) {
                return;
            }

            this.openDrawer(
                "friends"
            );

            this.refreshFriendsFromAdapter();
        }

        openNotifications() {
            if (
                !this.requireAuth(
                    "Sign in to view notifications."
                )
            ) {
                return;
            }

            this.openDrawer(
                "notifications"
            );

            this.refreshNotificationsFromAdapter();
        }

                // =====================================================================
        // DRAWER SYSTEM
        // =====================================================================

        openDrawer(name) {
            this.closeProfileMenu();
            this.closeMobileMenu();
            this.closeModal(false);

            const drawer =
                this.dom.mount.querySelector(
                    `[data-rg-drawer="${CSS.escape(
                        name
                    )}"]`
                );

            if (!drawer) {
                this.warn(
                    `Drawer "${name}" was not found.`
                );

                return;
            }

            if (
                this.state.activeDrawer &&
                this.state.activeDrawer !== name
            ) {
                this.closeDrawer(false);
            }

            this.state.lastFocusedElement =
                document.activeElement;

            this.state.activeDrawer =
                name;

            this.state.activeOverlay =
                "drawer";

            drawer.setAttribute(
                "aria-hidden",
                "false"
            );

            drawer.classList.add(
                "is-open"
            );

            this.showBackdrop();
            this.lockScroll();

            const focusTarget =
                drawer.querySelector(
                    [
                        "input:not([disabled])",
                        "button:not([disabled])",
                        "a[href]",
                        "[tabindex]:not([tabindex='-1'])"
                    ].join(",")
                );

            window.setTimeout(() => {
                focusTarget?.focus();
            }, 180);

            window.dispatchEvent(
                new CustomEvent(
                    "rgheader:draweropen",
                    {
                        detail: {
                            name
                        }
                    }
                )
            );
        }

        closeDrawer(
            restoreFocus = true
        ) {
            if (!this.state.activeDrawer) {
                return;
            }

            const drawerName =
                this.state.activeDrawer;

            const drawer =
                this.dom.mount.querySelector(
                    `[data-rg-drawer="${CSS.escape(
                        drawerName
                    )}"]`
                );

            drawer?.classList.remove(
                "is-open"
            );

            drawer?.setAttribute(
                "aria-hidden",
                "true"
            );

            this.state.activeDrawer =
                null;

            this.state.activeOverlay =
                null;

            this.hideBackdrop();
            this.unlockScroll();

            if (restoreFocus) {
                this.restoreFocus();
            }

            window.dispatchEvent(
                new CustomEvent(
                    "rgheader:drawerclose",
                    {
                        detail: {
                            name: drawerName
                        }
                    }
                )
            );
        }

        // =====================================================================
        // MODAL SYSTEM
        // =====================================================================

        openModal(name) {
            this.closeProfileMenu();
            this.closeMobileMenu();
            this.closeDrawer(false);

            const modal =
                this.dom.mount.querySelector(
                    `[data-rg-modal="${CSS.escape(
                        name
                    )}"]`
                );

            if (!modal) {
                this.warn(
                    `Modal "${name}" was not found.`
                );

                return;
            }

            this.state.lastFocusedElement =
                document.activeElement;

            this.state.activeModal =
                name;

            this.state.activeOverlay =
                "modal";

            modal.setAttribute(
                "aria-hidden",
                "false"
            );

            modal.classList.add(
                "is-open"
            );

            this.showBackdrop();
            this.lockScroll();

            window.setTimeout(() => {
                modal
                    .querySelector(
                        [
                            "button:not([disabled])",
                            "a[href]",
                            "input:not([disabled])",
                            "[tabindex]:not([tabindex='-1'])"
                        ].join(",")
                    )
                    ?.focus();
            }, 100);

            window.dispatchEvent(
                new CustomEvent(
                    "rgheader:modalopen",
                    {
                        detail: {
                            name
                        }
                    }
                )
            );
        }

        closeModal(
            restoreFocus = true
        ) {
            if (!this.state.activeModal) {
                return;
            }

            const modalName =
                this.state.activeModal;

            const modal =
                this.dom.mount.querySelector(
                    `[data-rg-modal="${CSS.escape(
                        modalName
                    )}"]`
                );

            modal?.classList.remove(
                "is-open"
            );

            modal?.setAttribute(
                "aria-hidden",
                "true"
            );

            this.state.activeModal =
                null;

            this.state.activeOverlay =
                null;

            this.hideBackdrop();
            this.unlockScroll();

            if (restoreFocus) {
                this.restoreFocus();
            }

            window.dispatchEvent(
                new CustomEvent(
                    "rgheader:modalclose",
                    {
                        detail: {
                            name: modalName
                        }
                    }
                )
            );
        }

        // =====================================================================
        // CLOSE ALL HEADER UI
        // =====================================================================

        closeAll() {
            this.closeProfileMenu();
            this.closeMobileMenu();

            if (this.state.activeDrawer) {
                this.closeDrawer();
                return;
            }

            if (this.state.activeModal) {
                this.closeModal();
                return;
            }

            this.hideBackdrop();
            this.unlockScroll();
        }

        // =====================================================================
        // BACKDROP
        // =====================================================================

        showBackdrop() {
            if (!this.dom.backdrop) {
                return;
            }

            this.dom.backdrop.hidden =
                false;

            requestAnimationFrame(() => {
                this.dom.backdrop.classList.add(
                    "is-visible"
                );
            });
        }

        hideBackdrop() {
            if (!this.dom.backdrop) {
                return;
            }

            this.dom.backdrop.classList.remove(
                "is-visible"
            );

            window.setTimeout(() => {
                if (
                    !this.state.activeDrawer &&
                    !this.state.activeModal
                ) {
                    this.dom.backdrop.hidden =
                        true;
                }
            }, 220);
        }

        // =====================================================================
        // PAGE SCROLL LOCK
        // =====================================================================

        lockScroll() {
            document.documentElement.classList.add(
                "rg-overlay-open"
            );

            document.body?.classList.add(
                "rg-overlay-open"
            );
        }

        unlockScroll() {
            if (
                this.state.activeDrawer ||
                this.state.activeModal
            ) {
                return;
            }

            document.documentElement.classList.remove(
                "rg-overlay-open"
            );

            document.body?.classList.remove(
                "rg-overlay-open"
            );
        }

        // =====================================================================
        // FOCUS MANAGEMENT
        // =====================================================================

        restoreFocus() {
            const element =
                this.state.lastFocusedElement;

            this.state.lastFocusedElement =
                null;

            if (
                element &&
                typeof element.focus ===
                    "function" &&
                document.contains(element)
            ) {
                window.setTimeout(() => {
                    element.focus();
                }, 0);
            }
        }

        trapFocus(event) {
            const container =
                this.state.activeDrawer
                    ? this.dom.mount.querySelector(
                          `[data-rg-drawer="${CSS.escape(
                              this.state
                                  .activeDrawer
                          )}"]`
                      )
                    : this.dom.mount.querySelector(
                          `[data-rg-modal="${CSS.escape(
                              this.state
                                  .activeModal
                          )}"]`
                      );

            if (!container) {
                return;
            }

            const focusable =
                Array.from(
                    container.querySelectorAll(
                        [
                            "a[href]",
                            "button:not([disabled])",
                            "input:not([disabled])",
                            "select:not([disabled])",
                            "textarea:not([disabled])",
                            "[tabindex]:not([tabindex='-1'])"
                        ].join(",")
                    )
                ).filter((element) => {
                    const style =
                        window.getComputedStyle(
                            element
                        );

                    return (
                        style.visibility !==
                            "hidden" &&
                        style.display !==
                            "none"
                    );
                });

            if (!focusable.length) {
                event.preventDefault();
                return;
            }

            const first =
                focusable[0];

            const last =
                focusable[
                    focusable.length - 1
                ];

            if (
                event.shiftKey &&
                document.activeElement === first
            ) {
                event.preventDefault();
                last.focus();
                return;
            }

            if (
                !event.shiftKey &&
                document.activeElement === last
            ) {
                event.preventDefault();
                first.focus();
            }
        }

        // =====================================================================
        // FRIENDS TABS
        // =====================================================================

        setFriendsTab(name) {
            this.dom.mount
                .querySelectorAll(
                    "[data-rg-friends-tab]"
                )
                .forEach((tab) => {
                    const active =
                        tab.dataset
                            .rgFriendsTab ===
                        name;

                    tab.classList.toggle(
                        "is-active",
                        active
                    );

                    tab.setAttribute(
                        "aria-selected",
                        String(active)
                    );
                });

            this.dom.mount
                .querySelectorAll(
                    "[data-rg-friends-panel]"
                )
                .forEach((panel) => {
                    panel.hidden =
                        panel.dataset
                            .rgFriendsPanel !==
                        name;
                });

            if (
                name === "friends" &&
                this.dom.friendSearch
            ) {
                window.setTimeout(() => {
                    this.dom.friendSearch.focus();
                }, 60);
            }
        }

        // =====================================================================
        // FRIENDS LIST RENDERING
        // =====================================================================

        renderFriends(
            friends = this.state.friends
        ) {
            if (!this.dom.friendsList) {
                return;
            }

            if (this.dom.friendsLoading) {
                this.dom.friendsLoading.hidden =
                    true;
            }

            if (this.dom.friendsCount) {
                this.dom.friendsCount.textContent =
                    String(friends.length);
            }

            if (!friends.length) {
                this.dom.friendsList.innerHTML =
                    this.emptyState(
                        "No friends yet",
                        "Search for players or accept a request to start building your squad.",
                        "friend"
                    );

                return;
            }

            this.dom.friendsList.innerHTML =
                friends
                    .map((friend) => {
                        const initial =
                            friend.name
                                .charAt(0)
                                .toUpperCase();

                        const avatarMarkup =
                            friend.avatar
                                ? `
                                    <img
                                        src="${this.escapeAttribute(
                                            friend.avatar
                                        )}"
                                        alt=""
                                        loading="lazy"
                                    >
                                `
                                : `
                                    <span>
                                        ${this.escapeHTML(
                                            initial
                                        )}
                                    </span>
                                `;

                        const giftState =
    window.RGDailyGifts &&
    typeof window.RGDailyGifts.getGiftButtonState ===
        "function"
        ? window.RGDailyGifts.getGiftButtonState(
              this.state.dailyGiftStats,
              friend.id
          )
        : {
              disabled: true,
              label: "Gift unavailable",
              reason:
                  "Daily Gifts are not loaded on this page."
          };

                        return `
                            <article
                                class="rg-friend-card"
                                data-rg-friend-id="${this.escapeAttribute(
                                    friend.id
                                )}"
                            >
                                <div
                                    class="rg-friend-card__avatar ${
                                        friend.online
                                            ? "is-online"
                                            : ""
                                    }"
                                >
                                    ${avatarMarkup}

                                    <i
                                        aria-hidden="true"
                                    ></i>
                                </div>

                                <div
                                    class="rg-friend-card__copy"
                                >
                                    <strong>
                                        ${this.escapeHTML(
                                            friend.name
                                        )}
                                    </strong>

                                    <span>
                                        ${this.escapeHTML(
                                            friend.statusText
                                        )}
                                    </span>
                                </div>

   <div
    style="display:flex;gap:8px;align-items:center;"
>
  <a
    class="rg-friend-card__action"
    href="player.html?id=${encodeURIComponent(
        friend.id
    )}"
    style="
        display:inline-flex;
        align-items:center;
        justify-content:center;
        text-align:center;
        min-height:42px;
        line-height:1;
        text-decoration:none;
        box-sizing:border-box;
    "
>
    Profile
</a>

    <button
        class="rg-friend-card__action"
        type="button"
        data-rg-friend-action="gift"
        data-rg-friend-id="${this.escapeAttribute(
            friend.id
        )}"
        title="${this.escapeAttribute(
            giftState.reason ||
            "Send this friend a Daily Gift"
        )}"
        ${
            giftState.disabled
                ? "disabled"
                : ""
        }
    >
        ${this.escapeHTML(
            giftState.label
        )}
    </button>
</div>
                            </article>
                        `;
                    })
                    .join("");
        }

// =====================================================================
// DAILY GIFT INBOX RENDERING
// =====================================================================

renderGiftInbox(
    gifts = this.state.giftInbox
) {
    if (!this.dom.giftsList) {
        return;
    }

    const safeGifts =
        Array.isArray(gifts)
            ? gifts
            : [];

    const unopenedCount =
        safeGifts.filter(gift => {
            return gift?.opened !== true;
        }).length;

    if (this.dom.giftsCount) {
        this.dom.giftsCount.textContent =
            String(unopenedCount);
    }

    if (!safeGifts.length) {
        this.dom.giftsList.innerHTML =
            this.emptyState(
                "No Daily Gifts",
                "Daily Gifts sent by your friends will appear here.",
                "reward"
            );

        return;
    }

    this.dom.giftsList.innerHTML =
        safeGifts
            .map(gift => {
                const opened =
                    gift.opened === true;

                const senderName =
                    String(
                        gift.senderName ||
                        gift.otherName ||
                        "A friend"
                    );

                const rewardName =
                    String(
                        gift.reward?.name ||
                        "Daily Gift"
                    );

                const statusText =
                    opened
                        ? `Opened • ${rewardName}`
                        : "Ready to open";

                const actionMarkup =
                    opened
                        ? `
                            <button
                                class="rg-friend-card__action"
                                type="button"
                                disabled
                            >
                                Opened ✓
                            </button>
                        `
                        : `
                            <button
                                class="rg-friend-card__action"
                                type="button"
                                data-rg-friend-action="open-gift"
                                data-rg-friend-id="${this.escapeAttribute(
                                    gift.id
                                )}"
                            >
                                Open Gift
                            </button>
                        `;

                return `
                    <article
                        class="rg-friend-card"
                        data-rg-gift-id="${this.escapeAttribute(
                            gift.id
                        )}"
                    >
                        <div
                            class="rg-friend-card__avatar"
                        >
                            <span>🎁</span>
                        </div>

                        <div
                            class="rg-friend-card__copy"
                        >
                            <strong>
                                ${this.escapeHTML(
                                    senderName
                                )}
                            </strong>

                            <span>
                                ${this.escapeHTML(
                                    statusText
                                )}
                            </span>
                        </div>

                        ${actionMarkup}
                    </article>
                `;
            })
            .join("");
}

        // =====================================================================
        // FRIEND REQUEST RENDERING
        // =====================================================================

        renderFriendRequests(
            requests =
                this.state.friendRequests
        ) {
            if (!this.dom.requestsList) {
                return;
            }

            const pending =
                requests.filter((item) => {
                    return (
                        item.status ===
                        "pending"
                    );
                });

            if (this.dom.requestsCount) {
                this.dom.requestsCount.textContent =
                    String(pending.length);
            }

            if (!pending.length) {
                this.dom.requestsList.innerHTML =
                    this.emptyState(
                        "No pending requests",
                        "New friend requests will appear here.",
                        "friend"
                    );

                return;
            }

            this.dom.requestsList.innerHTML =
                pending
                    .map((request) => {
                        const initial =
                            request.name
                                .charAt(0)
                                .toUpperCase();

                        const avatarMarkup =
                            request.avatar
                                ? `
                                    <img
                                        src="${this.escapeAttribute(
                                            request.avatar
                                        )}"
                                        alt=""
                                        loading="lazy"
                                    >
                                `
                                : `
                                    <span>
                                        ${this.escapeHTML(
                                            initial
                                        )}
                                    </span>
                                `;

                        return `
                            <article
                                class="rg-request-card"
                                data-rg-request-id="${this.escapeAttribute(
                                    request.id
                                )}"
                            >
                                <div
                                    class="rg-request-card__avatar"
                                >
                                    ${avatarMarkup}
                                </div>

                                <div
                                    class="rg-request-card__copy"
                                >
                                    <strong>
                                        ${this.escapeHTML(
                                            request.name
                                        )}
                                    </strong>

                                    <span>
                                        Wants to join your friends list
                                    </span>
                                </div>

                                <div
                                    class="rg-request-card__actions"
                                >
                                    <button
                                        type="button"
                                        data-rg-request-action="accept"
                                        data-rg-request-id="${this.escapeAttribute(
                                            request.id
                                        )}"
                                    >
                                        Accept
                                    </button>

                                    <button
                                        type="button"
                                        data-rg-request-action="decline"
                                        data-rg-request-id="${this.escapeAttribute(
                                            request.id
                                        )}"
                                        aria-label="Decline request"
                                    >
                                        ${ICONS.close}
                                    </button>
                                </div>
                            </article>
                        `;
                    })
                    .join("");
        }

        // =====================================================================
        // FRIEND SEARCH
        // =====================================================================

        filterFriends(query) {
            const normalized =
                String(query || "")
                    .trim()
                    .toLowerCase();

            if (!normalized) {
                this.renderFriends(
                    this.state.friends
                );

                return;
            }

            const localResults =
                this.state.friends.filter(
                    (friend) => {
                        return (
                            friend.name
                                .toLowerCase()
                                .includes(
                                    normalized
                                ) ||
                            friend.statusText
                                .toLowerCase()
                                .includes(
                                    normalized
                                )
                        );
                    }
                );

            this.renderFriends(
                localResults
            );

            if (
                normalized.length >= 3
            ) {
                this.searchPlayersFromAdapter(
                    normalized
                );
            }
        }

        // =====================================================================
        // FRIEND ACTIONS
        // =====================================================================

        async handleFriendAction(
            element
        ) {
            const action =
                element.dataset
                    .rgFriendAction;

            const id =
                element.dataset
                    .rgFriendId;

            if (!action || !id) {
                return;
            }

if (action === "open-gift") {
    if (
        !window.RGDailyGifts ||
        typeof window.RGDailyGifts.openGiftSecurely !==
            "function"
    ) {
        this.showToast(
            "Daily Gifts are not loaded on this page.",
            "error"
        );

        return;
    }

    const originalText =
        element.textContent;

    element.disabled = true;
    element.textContent = "Opening...";

    try {
        const result =
            await window.RGDailyGifts
                .openGiftSecurely(id);

        const reward =
            result?.reward || {};

        const rewardName =
            reward.name ||
            "your Daily Gift reward";

        this.state.giftInbox =
            this.state.giftInbox.map(
                gift => {
                    if (gift.id !== id) {
                        return gift;
                    }

                    return {
                        ...gift,
                        opened: true,
                        openedAt:
                            result?.openedAt ||
                            Date.now(),
                        reward
                    };
                }
            );

        this.renderGiftInbox(
            this.state.giftInbox
        );

        this.showToast(
            `You received ${rewardName}!`,
            "success",
            {
                duration: 6500
            }
        );
    } catch (error) {
        element.disabled = false;

        element.textContent =
            originalText ||
            "Open Gift";

        this.showToast(
            error?.message ||
                "The Daily Gift could not be opened.",
            "error",
            {
                duration: 6500
            }
        );
    }

    return;
}

if (action === "gift") {
    if (
        !window.RGDailyGifts ||
        typeof window.RGDailyGifts.sendGiftSecurely !==
            "function"
    ) {
        this.showToast(
            "Daily Gifts are not loaded on this page.",
            "error"
        );

        return;
    }

    const originalText =
        element.textContent;

    element.disabled = true;
    element.textContent = "Sending...";

    try {
        await window.RGDailyGifts
            .sendGiftSecurely(id);

        const currentStats =
            this.state.dailyGiftStats || {};

        this.state.dailyGiftStats = {
            ...currentStats,

            sentCount:
                Number(
                    currentStats.sentCount || 0
                ) + 1,

            sentTo: {
                ...(currentStats.sentTo || {}),
                [id]: true
            }
        };

        this.renderFriends(
            this.state.friends
        );

        this.showToast(
            "Daily Gift sent.",
            "success"
        );
    } catch (error) {
        element.disabled = false;

        element.textContent =
            originalText || "Send Gift";

        this.showToast(
            error?.message ||
                "The Daily Gift could not be sent.",
            "error",
            {
                duration: 6500
            }
        );
    }

    return;
}

            if (action === "invite") {
                element.disabled = true;

                const result =
                    await this.callAdapterMethod(
                        [
                            "RGFriends",
                            "Friends"
                        ],

                        [
                            "invite",
                            "inviteFriend",
                            "sendInvite"
                        ],

                        id
                    );

                if (
                    result.called &&
                    result.value !== false
                ) {
                    this.showToast(
                        "Invite sent.",
                        "success"
                    );
                } else if (
                    !result.called
                ) {
                    window.dispatchEvent(
                        new CustomEvent(
                            "rgheader:friendinvite",
                            {
                                detail: {
                                    friendId: id
                                }
                            }
                        )
                    );

                    this.showToast(
                        "Invite request sent to the page.",
                        "info"
                    );
                } else {
                    this.showToast(
                        "Invite could not be sent.",
                        "error"
                    );
                }

                element.disabled = false;
            }
        }

        // =====================================================================
        // FRIEND REQUEST ACTIONS
        // =====================================================================

        async handleRequestAction(
            element
        ) {
            const action =
                element.dataset
                    .rgRequestAction;

            const requestId =
                element.dataset
                    .rgRequestId;

            if (
                !action ||
                !requestId
            ) {
                return;
            }

            element.disabled = true;

            const methodNames =
                action === "accept"
                    ? [
                          "acceptRequest",
                          "acceptFriendRequest"
                      ]
                    : [
                          "declineRequest",
                          "declineFriendRequest",
                          "rejectRequest"
                      ];

            const result =
                await this.callAdapterMethod(
                    [
                        "RGFriends",
                        "Friends"
                    ],

                    methodNames,

this.state.user?.uid,
requestId
                );

            if (
                result.called &&
                result.value !== false
            ) {
                this.showToast(
                    action === "accept"
                        ? "Friend request accepted."
                        : "Friend request declined.",

                    action === "accept"
                        ? "success"
                        : "info"
                );
            } else if (
                !result.called
            ) {
                window.dispatchEvent(
                    new CustomEvent(
                        "rgheader:friendrequestaction",
                        {
                            detail: {
                                action,
                                requestId
                            }
                        }
                    )
                );

                this.showToast(
                    "Request sent to the friends system.",
                    "info"
                );
            } else {
                this.showToast(
                    "That request could not be updated.",
                    "error"
                );
            }

            element.disabled = false;
        }

        // =====================================================================
        // REFRESH FRIENDS THROUGH OPTIONAL FRIENDS.JS ADAPTER
        // =====================================================================

        async refreshFriendsFromAdapter() {
            const result =
                await this.callAdapterMethod(
                    [
                        "RGFriends",
                        "Friends"
                    ],

                    [
                        "refresh",
                        "refreshFriends",
                        "loadFriends"
                    ]
                );

            if (
                result.called &&
                Array.isArray(
                    result.value
                )
            ) {
                this.state.friends =
                    result.value
                        .map(
                            (
                                value,
                                index
                            ) => {
                                return this.normalizeFriend(
                                    {
                                        id:
                                            value.id ||
                                            value.uid ||
                                            index,

                                        value
                                    }
                                );
                            }
                        )
                        .filter(Boolean);

                this.renderFriends();
            }
        }

        // =====================================================================
        // SEARCH PLAYERS THROUGH OPTIONAL FRIENDS.JS ADAPTER
        // =====================================================================

        async searchPlayersFromAdapter(
            query
        ) {
            const result =
                await this.callAdapterMethod(
                    [
                        "RGFriends",
                        "Friends"
                    ],

                    [
                        "searchPlayers",
                        "searchUsers",
                        "search"
                    ],

                    query
                );

            if (
                !result.called ||
                !Array.isArray(
                    result.value
                )
            ) {
                return;
            }

            window.dispatchEvent(
                new CustomEvent(
                    "rgheader:playersearchresults",
                    {
                        detail: {
                            query,
                            results:
                                result.value
                        }
                    }
                )
            );
        }

        // =====================================================================
        // NORMALIZE FRIEND DATA
        // =====================================================================

        normalizeFriend(item) {
            if (!item) {
                return null;
            }

            const value =
                item.value &&
                typeof item.value ===
                    "object"
                    ? item.value
                    : item;

            const id =
                String(
                    item.id ||
                    value.uid ||
                    value.userId ||
                    value.friendUid ||
                    value.id ||
                    ""
                );

            if (!id) {
                return null;
            }

            const name =
                String(
                    value.displayName ||
                    value.username ||
                    value.name ||
                    value.gamerTag ||
                    value.gamertag ||
                    "Player"
                );

            const online =
                Boolean(
                    value.online ||
                    value.isOnline ||
                    value.status ===
                        "online" ||
                    value.presence ===
                        "online"
                );

            const statusText =
                online
                    ? String(
                          value.activity ||
                          value.statusText ||
                          value.gameStatus ||
                          "Online"
                      )
                    : String(
                          value.lastSeenText ||
                          value.statusText ||
                          "Offline"
                      );

            return {
                id,
                name,

                avatar:
                    String(
                        value.avatarUrl ||
                        value.photoURL ||
                        value.profileImage ||
                        value.avatar ||
                        ""
                    ),

                online,

                canInvite:
                    value.canInvite !==
                        false &&
                    online,

                statusText,

                raw: value
            };
        }

        // =====================================================================
        // NORMALIZE FRIEND REQUEST DATA
        // =====================================================================

        normalizeFriendRequest(item) {
            if (!item) {
                return null;
            }

            const value =
                item.value &&
                typeof item.value ===
                    "object"
                    ? item.value
                    : item;

            const id =
                String(
                    item.id ||
                    value.id ||
                    value.requestId ||
                    value.fromUid ||
                    value.senderUid ||
                    ""
                );

            if (!id) {
                return null;
            }

            return {
                id,

                fromUid:
                    String(
                        value.fromUid ||
                        value.senderUid ||
                        value.uid ||
                        id
                    ),

                name:
                    String(
                        value.fromName ||
                        value.displayName ||
                        value.username ||
                        value.name ||
                        "Player"
                    ),

                avatar:
                    String(
                        value.avatarUrl ||
                        value.photoURL ||
                        value.profileImage ||
                        value.avatar ||
                        ""
                    ),

                status:
                    String(
                        value.status ||
                        "pending"
                    ).toLowerCase(),

                timestamp:
                    this.normalizeTimestamp(
                        value.timestamp ||
                        value.createdAt ||
                        value.time
                    ),

                raw: value
            };
        }

        // =====================================================================
        // EMPTY STATE HTML
        // =====================================================================

        emptyState(
            title,
            message,
            icon = "empty"
        ) {
            return `
                <div class="rg-empty-state">
                    <span
                        class="rg-empty-state__icon"
                    >
                        ${
                            ICONS[icon] ||
                            ICONS.empty
                        }
                    </span>

                    <strong>
                        ${this.escapeHTML(
                            title
                        )}
                    </strong>

                    <p>
                        ${this.escapeHTML(
                            message
                        )}
                    </p>
                </div>
            `;
        }

           // =====================================================================
        // NOTIFICATION LIST RENDERING
        // =====================================================================

        renderNotifications(
            notifications = this.state.notifications
        ) {
            if (!this.dom.notificationList) {
                return;
            }

            if (this.dom.notificationsLoading) {
                this.dom.notificationsLoading.hidden = true;
            }

            const unreadCount = notifications.filter(
                (notification) => !notification.read
            ).length;

            if (this.dom.notificationSummary) {
                this.dom.notificationSummary.textContent =
                    unreadCount > 0
                        ? `${unreadCount} unread ${
                              unreadCount === 1
                                  ? "notification"
                                  : "notifications"
                          }`
                        : "You're all caught up";
            }

            if (this.dom.notificationSubsummary) {
                this.dom.notificationSubsummary.textContent =
                    notifications.length > 0
                        ? unreadCount > 0
                            ? "Review your latest Rivals Gauntlet activity."
                            : "You have no unread notifications."
                        : "New activity will appear here.";
            }

            const markAllButton =
                this.dom.mount.querySelector(
                    "[data-rg-mark-all-read]"
                );

            if (markAllButton) {
                markAllButton.disabled =
                    unreadCount === 0;
            }

            if (!notifications.length) {
                this.dom.notificationList.innerHTML =
                    this.emptyState(
                        "No notifications",
                        "Tournament updates, rewards, predictions, and social activity will appear here.",
                        "bell"
                    );

                return;
            }

            this.dom.notificationList.innerHTML =
                notifications
                    .map((notification) => {
                        return this.notificationCard(
                            notification
                        );
                    })
                    .join("");
        }

        notificationCard(notification) {
            const icon =
                ICONS[
                    notification.icon
                ] ||
                ICONS.info;

            const category =
                notification.category ||
                "GENERAL";

            const actionMarkup =
                notification.actionLabel
                    ? `
                        <button
                            class="rg-notification-card__action"
                            type="button"
                            data-rg-notification-action="open"
                            data-rg-notification-id="${this.escapeAttribute(
                                notification.id
                            )}"
                        >
                            ${this.escapeHTML(
                                notification.actionLabel
                            )}
                        </button>
                    `
                    : "";

            return `
                <article
                    class="rg-notification-card ${
                        notification.read
                            ? "is-read"
                            : "is-unread"
                    }"
                    data-rg-notification-id="${this.escapeAttribute(
                        notification.id
                    )}"
                >
                    <button
                        class="rg-notification-card__main"
                        type="button"
                        data-rg-notification-action="open"
                        data-rg-notification-id="${this.escapeAttribute(
                            notification.id
                        )}"
                    >
                        <span
                            class="rg-notification-card__icon rg-notification-card__icon--${this.escapeAttribute(
                                notification.type
                            )}"
                        >
                            ${icon}
                        </span>

                        <span
                            class="rg-notification-card__content"
                        >
                            <span
                                class="rg-notification-card__meta"
                            >
                                <span
                                    class="rg-notification-card__category"
                                >
                                    ${this.escapeHTML(
                                        category
                                    )}
                                </span>

                                <time
                                    datetime="${this.escapeAttribute(
                                        notification.isoTime
                                    )}"
                                >
                                    ${this.escapeHTML(
                                        notification.timeAgo
                                    )}
                                </time>
                            </span>

                            <strong>
                                ${this.escapeHTML(
                                    notification.title
                                )}
                            </strong>

                            <span
                                class="rg-notification-card__message"
                            >
                                ${this.escapeHTML(
                                    notification.message
                                )}
                            </span>
                        </span>

                        ${
                            notification.read
                                ? ""
                                : `
                                    <span
                                        class="rg-notification-card__unread"
                                        aria-label="Unread"
                                    ></span>
                                `
                        }
                    </button>

                    ${
                        actionMarkup
                            ? `
                                <div
                                    class="rg-notification-card__footer"
                                >
                                    ${actionMarkup}
                                </div>
                            `
                            : ""
                    }
                </article>
            `;
        }

        // =====================================================================
        // NORMALIZE NOTIFICATION DATA
        // =====================================================================

        normalizeNotification(item) {
            if (!item) {
                return null;
            }

            const value =
                item.value &&
                typeof item.value === "object"
                    ? item.value
                    : item;

            const id =
                String(
                    item.id ||
                    value.id ||
                    value.notificationId ||
                    ""
                );

            if (!id) {
                return null;
            }

            const type =
                this.normalizeNotificationType(
                    value.type ||
                    value.category ||
                    value.kind ||
                    "general"
                );

            const timestamp =
                this.normalizeTimestamp(
                    value.timestamp ||
                    value.createdAt ||
                    value.date ||
                    value.time
                );

            const title =
                String(
                    value.title ||
                    value.heading ||
                    value.subject ||
                    this.defaultNotificationTitle(
                        type
                    )
                );

            const message =
                String(
                    value.message ||
                    value.body ||
                    value.description ||
                    value.text ||
                    ""
                );

            const actionUrl =
                String(
                    value.actionUrl ||
                    value.url ||
                    value.href ||
                    value.link ||
                    ""
                );

            const actionLabel =
                String(
                    value.actionLabel ||
                    value.buttonLabel ||
                    value.cta ||
                    (
                        actionUrl
                            ? "View"
                            : ""
                    )
                );

            const read =
                value.read === true ||
                value.isRead === true ||
                value.status === "read";

            return {
                id,
                type,
                category:
                    this.notificationCategory(
                        type
                    ),
                icon:
                    this.notificationIcon(
                        type
                    ),
                title,
                message,
                timestamp,
                isoTime:
                    new Date(
                        timestamp
                    ).toISOString(),
                timeAgo:
                    this.formatRelativeTime(
                        timestamp
                    ),
                actionUrl,
                actionLabel,
                read,
                raw: value
            };
        }

        normalizeNotificationType(type) {
            const value =
                String(type || "general")
                    .trim()
                    .toLowerCase()
                    .replace(/[\s_]+/g, "-");

            const aliases = {
    points: "reward",
    rp: "reward",
    gift: "reward",
    crate: "reward",
    inventory: "reward",

    predictions: "prediction",
    pick: "prediction",
    bracket: "prediction",

    "tournament-update": "tournament",
    match: "tournament",
    "match-live": "tournament",
    event: "tournament",

    friends: "social",
    friend: "social",
    "friend-request": "social",
    comment: "social",

    warning: "warning",
    error: "warning",

    system: "general",
    announcement: "general",
    news: "general"
};

            return (
                aliases[value] ||
                value
            );
        }

        notificationCategory(type) {
            const categories = {
                reward: "REWARD",
                prediction: "PREDICTION",
                tournament: "TOURNAMENT",
                social: "SOCIAL",
                warning: "ALERT",
                general: "UPDATE"
            };

            return (
                categories[type] ||
                "UPDATE"
            );
        }

        notificationIcon(type) {
            const icons = {
                reward: "reward",
                prediction: "prediction",
                tournament: "tournament",
                social: "friend",
                warning: "warning",
                general: "bell"
            };

            return (
                icons[type] ||
                "info"
            );
        }

        defaultNotificationTitle(type) {
            const titles = {
                reward: "Reward Received",
                prediction:
                    "Prediction Update",
                tournament:
                    "Tournament Update",
                social:
                    "Community Activity",
                warning:
                    "Important Alert",
                general:
                    "Rivals Gauntlet Update"
            };

            return (
                titles[type] ||
                "New Notification"
            );
        }

        // =====================================================================
        // NOTIFICATION CLICK ACTION
        // =====================================================================

        async handleNotificationAction(
            element
        ) {
            const notificationId =
                element.dataset
                    .rgNotificationId;

            if (!notificationId) {
                return;
            }

            const notification =
                this.state.notifications.find(
                    (item) => {
                        return (
                            item.id ===
                            notificationId
                        );
                    }
                );

            if (!notification) {
                return;
            }

            await this.markNotificationRead(
                notification
            );

            window.dispatchEvent(
                new CustomEvent(
                    "rgheader:notificationopen",
                    {
                        detail: {
                            notification
                        }
                    }
                )
            );

            if (
                notification.actionUrl &&
                this.isSafeNavigationURL(
                    notification.actionUrl
                )
            ) {
                window.location.href =
                    notification.actionUrl;
            }
        }

        // =====================================================================
        // MARK ONE NOTIFICATION READ
        // =====================================================================

        async markNotificationRead(
            notification
        ) {
            if (
                !notification ||
                notification.read
            ) {
                return true;
            }

            const adapterResult =
                await this.callAdapterMethod(
                    [
                        "RGNotifications",
                        "Notifications"
                    ],

                    [
                        "markRead",
                        "markNotificationRead"
                    ],

                    notification.id
                );

            if (
                adapterResult.called &&
                adapterResult.value !== false
            ) {
                this.applyLocalNotificationRead(
                    notification.id
                );

                return true;
            }

            if (!this.state.user) {
                return false;
            }

            const success =
                await this.updateNotificationReadInFirebase(
                    notification.id,
                    true
                );

            if (success) {
                this.applyLocalNotificationRead(
                    notification.id
                );
            }

            return success;
        }

        applyLocalNotificationRead(
            notificationId
        ) {
            let changed = false;

            this.state.notifications =
                this.state.notifications.map(
                    (notification) => {
                        if (
                            notification.id !==
                                notificationId ||
                            notification.read
                        ) {
                            return notification;
                        }

                        changed = true;

                        return {
                            ...notification,
                            read: true
                        };
                    }
                );

            if (!changed) {
                return;
            }

            this.state.notificationUnread =
                this.state.notifications.filter(
                    (notification) => {
                        return !notification.read;
                    }
                ).length;

            this.updateNotificationBadge();
            this.renderNotifications();
        }

        // =====================================================================
        // MARK ALL NOTIFICATIONS READ
        // =====================================================================

        async markAllNotificationsRead() {
            const unread =
                this.state.notifications.filter(
                    (notification) => {
                        return !notification.read;
                    }
                );

            if (!unread.length) {
                this.showToast(
                    "You're already caught up.",
                    "info"
                );

                return;
            }

            const button =
                this.dom.mount.querySelector(
                    "[data-rg-mark-all-read]"
                );

            if (button) {
                button.disabled = true;
            }

            const adapterResult =
                await this.callAdapterMethod(
                    [
                        "RGNotifications",
                        "Notifications"
                    ],

                    [
                        "markAllRead",
                        "markAllNotificationsRead"
                    ]
                );

            let success = false;

            if (
                adapterResult.called &&
                adapterResult.value !== false
            ) {
                success = true;
            } else if (
                this.state.user
            ) {
                success =
                    await this.markAllNotificationsReadInFirebase(
                        unread
                    );
            }

            if (success) {
                this.state.notifications =
                    this.state.notifications.map(
                        (notification) => {
                            return {
                                ...notification,
                                read: true
                            };
                        }
                    );

                this.state.notificationUnread =
                    0;

                this.updateNotificationBadge();
                this.renderNotifications();

                this.showToast(
                    "All notifications marked as read.",
                    "success"
                );
            } else {
                this.showToast(
                    "Notifications could not be updated.",
                    "error"
                );
            }

            if (button) {
                button.disabled = false;
            }
        }

        // =====================================================================
        // FIREBASE NOTIFICATION WRITES
        // =====================================================================

        async updateNotificationReadInFirebase(
            notificationId,
            read
        ) {
            if (
                !this.database ||
                !this.state.user
            ) {
                return false;
            }

            const uid =
                this.state.user.uid;

            for (
                const pathTemplate of
                this.config.notificationPaths
            ) {
                const basePath =
                    this.interpolate(
                        pathTemplate,
                        {
                            uid
                        }
                    );

                try {
                    await this.database
                        .ref(
                            `${basePath}/${notificationId}/read`
                        )
                        .set(read);

                    return true;
                } catch (error) {
                    this.log(
                        "Notification read update failed:",
                        basePath,
                        error
                    );
                }
            }

            return false;
        }

        async markAllNotificationsReadInFirebase(
            unread
        ) {
            if (
                !this.database ||
                !this.state.user
            ) {
                return false;
            }

            const uid =
                this.state.user.uid;

            for (
                const pathTemplate of
                this.config.notificationPaths
            ) {
                const basePath =
                    this.interpolate(
                        pathTemplate,
                        {
                            uid
                        }
                    );

                const updates = {};

                unread.forEach(
                    (notification) => {
                        updates[
                            `${notification.id}/read`
                        ] = true;
                    }
                );

                try {
                    await this.database
                        .ref(basePath)
                        .update(updates);

                    return true;
                } catch (error) {
                    this.log(
                        "Mark-all notification update failed:",
                        basePath,
                        error
                    );
                }
            }

            return false;
        }

        // =====================================================================
        // REFRESH THROUGH OPTIONAL NOTIFICATIONS.JS ADAPTER
        // =====================================================================

        async refreshNotificationsFromAdapter() {
            const result =
                await this.callAdapterMethod(
                    [
                        "RGNotifications",
                        "Notifications"
                    ],

                    [
                        "refresh",
                        "refreshNotifications",
                        "loadNotifications"
                    ]
                );

            if (
                result.called &&
                Array.isArray(
                    result.value
                )
            ) {
                const notifications =
                    result.value
                        .map(
                            (
                                value,
                                index
                            ) => {
                                return this.normalizeNotification(
                                    {
                                        id:
                                            value.id ||
                                            value.notificationId ||
                                            index,

                                        value
                                    }
                                );
                            }
                        )
                        .filter(Boolean)
                        .sort((a, b) => {
                            return (
                                b.timestamp -
                                a.timestamp
                            );
                        });

                this.state.notifications =
                    notifications;

                this.state.notificationUnread =
                    notifications.filter(
                        (notification) => {
                            return !notification.read;
                        }
                    ).length;

                this.updateNotificationBadge();
                this.renderNotifications();
            }
        }

        // =====================================================================
        // AUTHENTICATION HELPERS
        // =====================================================================

        requireAuth(message) {
            if (this.state.user) {
                return true;
            }

            this.showToast(
                message ||
                    "Sign in to continue.",
                "warning"
            );

            return false;
        }

        async signOut() {
            if (
                !this.auth ||
                typeof this.auth.signOut !==
                    "function"
            ) {
                this.showToast(
                    "Sign out is currently unavailable.",
                    "error"
                );

                return;
            }

            try {
                await this.auth.signOut();

                this.closeAll();

                this.showToast(
                    "You have been signed out.",
                    "success"
                );
            } catch (error) {
                this.warn(
                    "Sign out failed:",
                    error
                );

                this.showToast(
                    "Could not sign you out.",
                    "error"
                );
            }
        }

        // =====================================================================
        // OPTIONAL EXTERNAL ADAPTER SUPPORT
        // =====================================================================

        async callAdapterMethod(
            globalNames,
            methodNames,
            ...args
        ) {
            for (
                const globalName of globalNames
            ) {
                const adapter =
                    window[globalName];

                if (!adapter) {
                    continue;
                }

                for (
                    const methodName of methodNames
                ) {
                    const method =
                        adapter[methodName];

                    if (
                        typeof method !==
                        "function"
                    ) {
                        continue;
                    }

                    try {
                        const value =
                            await method.apply(
                                adapter,
                                args
                            );

                        return {
                            called: true,
                            value
                        };
                    } catch (error) {
                        this.warn(
                            `${globalName}.${methodName} failed:`,
                            error
                        );

                        return {
                            called: true,
                            value: false,
                            error
                        };
                    }
                }
            }

            return {
                called: false,
                value: undefined
            };
        }

        // =====================================================================
        // TOAST SYSTEM
        // =====================================================================

        showToast(
            message,
            type = "info",
            options = {}
        ) {
            if (
                !this.dom.toastRegion ||
                !message
            ) {
                return null;
            }

            const validTypes = [
                "info",
                "success",
                "warning",
                "error"
            ];

            const toastType =
                validTypes.includes(type)
                    ? type
                    : "info";

            const duration =
                Number.isFinite(
                    options.duration
                )
                    ? options.duration
                    : this.config.toastDuration;

            const toast =
                document.createElement(
                    "div"
                );

            toast.className =
                `rg-toast rg-toast--${toastType}`;

            toast.setAttribute(
                "role",
                toastType === "error"
                    ? "alert"
                    : "status"
            );

            toast.innerHTML = `
                <span class="rg-toast__icon">
                    ${
                        ICONS[toastType] ||
                        ICONS.info
                    }
                </span>

                <span class="rg-toast__message">
                    ${this.escapeHTML(
                        String(message)
                    )}
                </span>

                <button
                    class="rg-toast__close"
                    type="button"
                    aria-label="Dismiss notification"
                >
                    ${ICONS.close}
                </button>
            `;

            const remove = () => {
                if (
                    toast.classList.contains(
                        "is-leaving"
                    )
                ) {
                    return;
                }

                toast.classList.add(
                    "is-leaving"
                );

                window.setTimeout(() => {
                    toast.remove();
                }, 220);
            };

            toast
                .querySelector(
                    ".rg-toast__close"
                )
                ?.addEventListener(
                    "click",
                    remove,
                    {
                        once: true
                    }
                );

            this.dom.toastRegion.append(
                toast
            );

            requestAnimationFrame(() => {
                toast.classList.add(
                    "is-visible"
                );
            });

            if (duration > 0) {
                window.setTimeout(
                    remove,
                    duration
                );
            }

            return {
                element: toast,
                close: remove
            };
        }

        // =====================================================================
        // COLLECTION NORMALIZATION
        // =====================================================================

        normalizeCollection(value) {
            if (!value) {
                return [];
            }

            if (Array.isArray(value)) {
                return value
                    .map(
                        (
                            item,
                            index
                        ) => {
                            if (
                                item === null ||
                                item === undefined
                            ) {
                                return null;
                            }

                            return {
                                id:
                                    String(
                                        item.id ||
                                        index
                                    ),
                                value: item
                            };
                        }
                    )
                    .filter(Boolean);
            }

            if (
                typeof value === "object"
            ) {
                return Object.entries(
                    value
                ).map(
                    ([id, item]) => {
                        return {
                            id,
                            value: item
                        };
                    }
                );
            }

            return [];
        }

        // =====================================================================
        // TIME HELPERS
        // =====================================================================

        normalizeTimestamp(value) {
            if (
                value &&
                typeof value.toMillis ===
                    "function"
            ) {
                return value.toMillis();
            }

            if (
                typeof value === "number"
            ) {
                if (
                    value > 0 &&
                    value < 100000000000
                ) {
                    return value * 1000;
                }

                return (
                    Number.isFinite(value)
                        ? value
                        : Date.now()
                );
            }

            if (
                typeof value === "string"
            ) {
                const numeric =
                    Number(value);

                if (
                    Number.isFinite(
                        numeric
                    ) &&
                    numeric > 0
                ) {
                    return this.normalizeTimestamp(
                        numeric
                    );
                }

                const parsed =
                    Date.parse(value);

                if (
                    Number.isFinite(parsed)
                ) {
                    return parsed;
                }
            }

            return Date.now();
        }

        formatRelativeTime(timestamp) {
            const difference =
                Date.now() - timestamp;

            const future =
                difference < 0;

            const absolute =
                Math.abs(difference);

            const units = [
                {
                    size:
                        365 * 24 * 60 * 60 * 1000,
                    label: "year"
                },
                {
                    size:
                        30 * 24 * 60 * 60 * 1000,
                    label: "month"
                },
                {
                    size:
                        7 * 24 * 60 * 60 * 1000,
                    label: "week"
                },
                {
                    size:
                        24 * 60 * 60 * 1000,
                    label: "day"
                },
                {
                    size:
                        60 * 60 * 1000,
                    label: "hour"
                },
                {
                    size:
                        60 * 1000,
                    label: "minute"
                }
            ];

            if (absolute < 45000) {
                return "Just now";
            }

            for (
                const unit of units
            ) {
                if (
                    absolute >= unit.size
                ) {
                    const amount =
                        Math.floor(
                            absolute /
                                unit.size
                        );

                    const label =
                        amount === 1
                            ? unit.label
                            : `${unit.label}s`;

                    return future
                        ? `In ${amount} ${label}`
                        : `${amount} ${label} ago`;
                }
            }

            return "Just now";
        }

        // =====================================================================
        // NUMBER FORMATTING
        // =====================================================================

        normalizeNumber(value) {
            if (
                typeof value === "number"
            ) {
                return Number.isFinite(value)
                    ? Math.round(value)
                    : 0;
            }

            if (
                typeof value === "string"
            ) {
                const cleaned =
                    value.replace(
                        /[^0-9.-]/g,
                        ""
                    );

                const numeric =
                    Number(cleaned);

                return Number.isFinite(
                    numeric
                )
                    ? Math.round(numeric)
                    : 0;
            }

            return 0;
        }

        formatCompact(value) {
    const number = Math.max(
        0,
        this.normalizeNumber(value)
    );

    try {
        return new Intl.NumberFormat(
            "en-US",
            {
                notation: "compact",
                compactDisplay: "short",
                maximumFractionDigits: 1
            }
        )
            .format(number)
            .toLowerCase();
    } catch {
        if (number >= 1000000000) {
            return `${(number / 1000000000)
                .toFixed(1)
                .replace(/\.0$/, "")}b`;
        }

        if (number >= 1000000) {
            return `${(number / 1000000)
                .toFixed(1)
                .replace(/\.0$/, "")}m`;
        }

        if (number >= 1000) {
            return `${(number / 1000)
                .toFixed(1)
                .replace(/\.0$/, "")}k`;
        }

        return String(number);
    }
}

        formatFull(value) {
            return this.normalizeNumber(
                value
            ).toLocaleString("en-US");
        }

        // =====================================================================
        // OBJECT VALUE HELPERS
        // =====================================================================

        pick(source, keys = []) {
            if (
                !source ||
                typeof source !== "object"
            ) {
                return undefined;
            }

            for (const key of keys) {
                if (
                    Object.prototype.hasOwnProperty.call(
                        source,
                        key
                    )
                ) {
                    const value =
                        source[key];

                    if (
                        value !== undefined &&
                        value !== null &&
                        value !== ""
                    ) {
                        return value;
                    }
                }
            }

            return undefined;
        }

        interpolate(
            template,
            values = {}
        ) {
            return String(
                template || ""
            ).replace(
                /\{([^{}]+)\}/g,
                (
                    match,
                    key
                ) => {
                    if (
                        Object.prototype.hasOwnProperty.call(
                            values,
                            key
                        )
                    ) {
                        return encodeURIComponent(
                            String(
                                values[key]
                            )
                        );
                    }

                    return match;
                }
            );
        }

        // =====================================================================
        // USER NAME HELPERS
        // =====================================================================

        nameFromEmail(email) {
            const value =
                String(email || "")
                    .trim();

            if (!value.includes("@")) {
                return "";
            }

            const localPart =
                value.split("@")[0] || "";

            return localPart
                .replace(
                    /[._-]+/g,
                    " "
                )
                .replace(
                    /\b\w/g,
                    (character) => {
                        return character.toUpperCase();
                    }
                )
                .trim();
        }

        // =====================================================================
        // HTML ESCAPING
        // =====================================================================

        escapeHTML(value) {
            return String(
                value ?? ""
            )
                .replace(
                    /&/g,
                    "&amp;"
                )
                .replace(
                    /</g,
                    "&lt;"
                )
                .replace(
                    />/g,
                    "&gt;"
                )
                .replace(
                    /"/g,
                    "&quot;"
                )
                .replace(
                    /'/g,
                    "&#039;"
                );
        }

        escapeAttribute(value) {
            return this.escapeHTML(
                value
            )
                .replace(
                    /`/g,
                    "&#096;"
                )
                .replace(
                    /\r?\n/g,
                    " "
                );
        }

        // =====================================================================
        // URL SAFETY
        // =====================================================================

        isSafeNavigationURL(value) {
            const url =
                String(value || "")
                    .trim();

            if (!url) {
                return false;
            }

            if (
                url.startsWith("#") ||
                url.startsWith("/") ||
                url.startsWith("./") ||
                url.startsWith("../")
            ) {
                return true;
            }

            try {
                const parsed =
                    new URL(
                        url,
                        window.location.href
                    );

                return (
                    parsed.protocol === "http:" ||
                    parsed.protocol === "https:"
                );
            } catch {
                return false;
            }
        }

        // =====================================================================
        // ASSET FALLBACKS
        // =====================================================================

        replaceBrokenAsset(image) {
            if (!image) {
                return;
            }

            const fallbackName =
                image.dataset
                    .rgAssetFallback ||
                "empty";

            const icon =
                ICONS[fallbackName] ||
                ICONS.empty;

            const wrapper =
                document.createElement(
                    "span"
                );

            wrapper.className =
                "rg-asset-fallback";

            wrapper.setAttribute(
                "aria-hidden",
                "true"
            );

            wrapper.innerHTML =
                icon;

            image.replaceWith(
                wrapper
            );
        }

        // =====================================================================
        // FUNCTION HELPERS
        // =====================================================================

        debounce(
            callback,
            delay = 100
        ) {
            let timeoutId = null;

            const debounced = (
                ...args
            ) => {
                if (timeoutId !== null) {
                    window.clearTimeout(
                        timeoutId
                    );
                }

                timeoutId =
                    window.setTimeout(
                        () => {
                            timeoutId = null;

                            callback.apply(
                                this,
                                args
                            );
                        },
                        delay
                    );
            };

            debounced.cancel = () => {
                if (timeoutId !== null) {
                    window.clearTimeout(
                        timeoutId
                    );

                    timeoutId = null;
                }
            };

            return debounced;
        }

        // =====================================================================
        // PUBLIC REFRESH METHODS
        // =====================================================================

        refreshPlayer() {
            const user =
                this.state.user;

            if (
                !user ||
                !user.uid
            ) {
                return false;
            }

            this.attachPlayerListener(
                user.uid
            );

            return true;
        }

        refreshNotifications() {
            if (!this.state.user) {
                return false;
            }

            this.refreshNotificationsFromAdapter();

            return true;
        }

        refreshFriends() {
            if (!this.state.user) {
                return false;
            }

            this.refreshFriendsFromAdapter();

            return true;
        }

        // =====================================================================
        // PUBLIC COMPATIBILITY API
        // =====================================================================

        installPublicCompatibility() {
            const controller =
                this;

            const publicAPI = {
                version: VERSION,

                get controller() {
                    return controller;
                },

                get initialized() {
                    return controller.state
                        .initialized;
                },

                get user() {
                    return controller.state.user;
                },

                get player() {
                    return controller.state.player;
                },

                get points() {
                    return controller.state.points;
                },

                get notifications() {
                    return [
                        ...controller.state
                            .notifications
                    ];
                },

                get friends() {
                    return [
                        ...controller.state
                            .friends
                    ];
                },

                get friendRequests() {
                    return [
                        ...controller.state
                            .friendRequests
                    ];
                },

                openPoints() {
                    return controller.openPoints();
                },

                openFriends() {
                    return controller.openFriends();
                },

                openNotifications() {
                    return controller.openNotifications();
                },

                openDrawer(name) {
                    return controller.openDrawer(
                        name
                    );
                },

                openModal(name) {
                    return controller.openModal(
                        name
                    );
                },

                close() {
                    return controller.closeAll();
                },

                closeAll() {
                    return controller.closeAll();
                },

                showToast(
                    message,
                    type,
                    options
                ) {
                    return controller.showToast(
                        message,
                        type,
                        options
                    );
                },

                setPoints(value) {
                    return controller.updatePoints(
                        value
                    );
                },

                refreshPlayer() {
                    return controller.refreshPlayer();
                },

                refreshNotifications() {
                    return controller.refreshNotifications();
                },

                refreshFriends() {
                    return controller.refreshFriends();
                },

                markAllNotificationsRead() {
                    return controller.markAllNotificationsRead();
                },

                applyActiveNavigation() {
                    return controller.applyActiveNavigation();
                },

                destroy() {
                    return controller.destroy();
                }
            };

            /*
             * Keep the controller instance as the main global, while exposing
             * a stable public API under .api for pages that should not access
             * internal controller state directly.
             */
            controller.api =
                publicAPI;

            window.RGHeaderAPI =
                publicAPI;

            window.openRGFriends = () => {
                controller.openFriends();
            };

            window.openRGNotifications = () => {
                controller.openNotifications();
            };

            window.openRGPoints = () => {
                controller.openPoints();
            };

            window.closeRGHeaderPanels = () => {
                controller.closeAll();
            };

            window.showRGToast = (
                message,
                type = "info",
                options = {}
            ) => {
                return controller.showToast(
                    message,
                    type,
                    options
                );
            };
        }

        // =====================================================================
        // DESTROY
        // =====================================================================

        destroy() {
            if (this.state.destroyed) {
                return;
            }

            this.state.destroyed =
                true;

            this.closeAll();

            this.detachUserListeners();

            if (
                typeof this.authUnsubscribe ===
                "function"
            ) {
                try {
                    this.authUnsubscribe();
                } catch (error) {
                    this.log(
                        "Auth listener cleanup failed:",
                        error
                    );
                }
            }

            this.authUnsubscribe =
                null;

            this.state.listeners
                .splice(0)
                .forEach(
                    (removeListener) => {
                        try {
                            removeListener();
                        } catch (error) {
                            this.log(
                                "DOM listener cleanup failed:",
                                error
                            );
                        }
                    }
                );

            if (this.dom.mount) {
                this.dom.mount.innerHTML =
                    "";
            }

            document.documentElement.classList.remove(
                "rg-header-ready",
                "rg-authenticated",
                "rg-signed-out",
                "rg-overlay-open"
            );

            document.body?.classList.remove(
                "rg-overlay-open"
            );

            delete document.documentElement
                .dataset.rgViewport;

            if (
                window.RGHeaderAPI ===
                this.api
            ) {
                delete window.RGHeaderAPI;
            }

            delete window.openRGFriends;
            delete window.openRGNotifications;
            delete window.openRGPoints;
            delete window.closeRGHeaderPanels;
            delete window.showRGToast;

            if (
                window.RGHeader ===
                this
            ) {
                delete window.RGHeader;
            }

            window.__RG_GLOBAL_HEADER_LOADED__ =
                false;

            window.dispatchEvent(
                new CustomEvent(
                    "rgheader:destroyed",
                    {
                        detail: {
                            version: VERSION
                        }
                    }
                )
            );
        }
    }

    // =========================================================================
    // CREATE AND INITIALIZE GLOBAL HEADER
    // =========================================================================

    const header = new RGHeaderController();

window.RGHeader = header;

header.init().catch((error) => {
    console.error("[RG Header] Initialization failed:", error);

    if (header && typeof header.showToast === "function") {
        header.showToast(
            "The site header could not load.",
            "error"
        );
    }
});

})();