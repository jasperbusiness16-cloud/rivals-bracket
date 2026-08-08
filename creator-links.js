(() => {
  "use strict";

  if (window.__RG_CREATOR_LINKS__) return;
  window.__RG_CREATOR_LINKS__ = true;

  const clean = value => String(value ?? "").trim();

  function parseWebUrl(value) {
    const raw = clean(value);
    if (!raw) return null;

    try {
      const url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
      return ["http:", "https:"].includes(url.protocol) ? url : null;
    } catch {
      return null;
    }
  }

  function normalizeSocialUrl(platform, value) {
    const raw = clean(value);
    if (!raw) return "";

    const key = clean(platform).toLowerCase();
    const direct = raw.replace(/^@/, "");

    if (key === "twitch" && /^[A-Za-z0-9_]{1,25}$/.test(direct)) {
      return `https://www.twitch.tv/${direct}`;
    }

    if (key === "tiktok" && /^[A-Za-z0-9._]{1,24}$/.test(direct)) {
      return `https://www.tiktok.com/@${direct}`;
    }

    if (key === "x" && /^[A-Za-z0-9_]{1,15}$/.test(direct)) {
      return `https://x.com/${direct}`;
    }

    const url = parseWebUrl(raw);
    if (!url) return "";

    const host = url.hostname
      .toLowerCase()
      .replace(/^www\./, "")
      .replace(/^m\./, "");

    const parts = url.pathname
      .split("/")
      .filter(Boolean)
      .map(part => {
        try {
          return decodeURIComponent(part);
        } catch {
          return part;
        }
      });

    if (key === "twitch") {
      const reserved = new Set([
        "directory",
        "downloads",
        "jobs",
        "p",
        "settings",
        "subscriptions",
        "turbo",
        "videos",
        "wallet"
      ]);

      const handle = parts[0] || "";

      if (
        host !== "twitch.tv" ||
        parts.length !== 1 ||
        reserved.has(handle.toLowerCase()) ||
        !/^[A-Za-z0-9_]{1,25}$/.test(handle)
      ) {
        return "";
      }

      return `https://www.twitch.tv/${handle}`;
    }

    if (key === "youtube") {
      if (host !== "youtube.com") return "";

      const first = parts[0] || "";
      const second = parts[1] || "";

      const handlePath =
        parts.length === 1 &&
        /^@[A-Za-z0-9._-]{1,100}$/.test(first);

      const channelPath =
        parts.length === 2 &&
        first === "channel" &&
        /^[A-Za-z0-9_-]{10,}$/.test(second);

      const legacyPath =
        parts.length === 2 &&
        ["c", "user"].includes(first) &&
        /^[A-Za-z0-9._-]{1,100}$/.test(second);

      if (!handlePath && !channelPath && !legacyPath) {
        return "";
      }

      return `https://www.youtube.com/${parts.join("/")}`;
    }

    if (key === "tiktok") {
      const first = parts[0] || "";
      const handle = first.replace(/^@/, "");

      if (
        host !== "tiktok.com" ||
        parts.length !== 1 ||
        !first.startsWith("@") ||
        !/^[A-Za-z0-9._]{1,24}$/.test(handle)
      ) {
        return "";
      }

      return `https://www.tiktok.com/@${handle}`;
    }

    if (key === "x") {
      const reserved = new Set([
        "compose",
        "explore",
        "home",
        "i",
        "intent",
        "messages",
        "notifications",
        "search",
        "settings",
        "share"
      ]);

      const handle = parts[0] || "";

      if (
        !["x.com", "twitter.com"].includes(host) ||
        parts.length !== 1 ||
        reserved.has(handle.toLowerCase()) ||
        !/^[A-Za-z0-9_]{1,15}$/.test(handle)
      ) {
        return "";
      }

      return `https://x.com/${handle}`;
    }

    return "";
  }

  function handleFromUrl(platform, value) {
    const normalized = normalizeSocialUrl(platform, value);
    if (!normalized) return clean(value).replace(/^@/, "");

    const url = new URL(normalized);
    const first = url.pathname.split("/").filter(Boolean)[0] || "";

    try {
      return decodeURIComponent(first).replace(/^@/, "");
    } catch {
      return first.replace(/^@/, "");
    }
  }

  function injectStyles() {
    if (document.getElementById("rgCreatorLinkStyles")) return;

    const style = document.createElement("style");
    style.id = "rgCreatorLinkStyles";
    style.textContent = `
      .rg-social-handle-shell{
        min-height:48px;
        display:grid;
        grid-template-columns:auto minmax(0,1fr);
        align-items:center;
        overflow:hidden;
        border:1px solid rgba(255,255,255,.11);
        background:#101018;
        transition:.18s ease;
      }
      .rg-social-handle-shell:focus-within{
        border-color:rgba(154,124,255,.7);
        box-shadow:0 0 0 3px rgba(154,124,255,.08);
      }
      .rg-social-handle-shell.invalid{
        border-color:rgba(255,101,123,.72);
      }
      .rg-social-prefix{
        height:100%;
        display:flex;
        align-items:center;
        padding-left:14px;
        color:#747080;
        font-size:12px;
        font-weight:700;
        white-space:nowrap;
        user-select:none;
      }
      .rg-social-handle-shell .rg-social-proxy{
        min-width:0;
        width:100%;
        height:46px;
        padding:0 14px 0 6px;
        border:0!important;
        outline:0;
        background:transparent!important;
        color:#fff;
        box-shadow:none!important;
      }
      .rg-social-note{
        margin:7px 0 0;
        color:#747080;
        font-size:10px;
        line-height:1.35;
      }
      .social-state.rg-invalid{color:#ff657b!important}
    `;

    document.head.appendChild(style);
  }

  function showSettingsError(message) {
    const toast = document.getElementById("toast");
    const title = document.getElementById("toastTitle");
    const body = document.getElementById("toastMessage");

    if (!toast || !title || !body) {
      window.alert(message);
      return;
    }

    title.textContent = "Check Creator Links";
    body.textContent = message;
    toast.className = "toast error show";

    window.setTimeout(() => {
      toast.classList.remove("show");
    }, 3200);
  }

  function setupSettings() {
    if (!document.getElementById("creator-links")) return;

    injectStyles();

    const intro = document.querySelector("#creator-links .section-head p");
    if (intro) {
      intro.textContent =
        "Add only your profile or channel. Rivals Gauntlet validates each platform before the link can appear publicly.";
    }

    const configs = {
      twitch: {
        prefix: "twitch.tv/",
        placeholder: "yourname",
        note: "Enter your Twitch username. Pasted Twitch profile links are accepted and cleaned automatically."
      },
      tiktok: {
        prefix: "tiktok.com/@",
        placeholder: "yourname",
        note: "Enter your TikTok username. Individual video and share links are rejected."
      },
      x: {
        prefix: "x.com/",
        placeholder: "yourname",
        note: "Enter your X username. X and legacy Twitter profile links are both accepted."
      }
    };

    const proxies = {};
    const lastOriginal = {};

    Object.entries(configs).forEach(([platform, config]) => {
      const original = document.getElementById(platform);
      if (!original || original.dataset.rgSocialWrapped === "true") return;

      original.dataset.rgSocialWrapped = "true";

      const shell = document.createElement("div");
      shell.className = "rg-social-handle-shell";
      shell.dataset.rgSocialShell = platform;

      const prefix = document.createElement("span");
      prefix.className = "rg-social-prefix";
      prefix.textContent = config.prefix;

      const proxy = document.createElement("input");
      proxy.className = "rg-social-proxy";
      proxy.type = "text";
      proxy.inputMode = "text";
      proxy.autocomplete = "off";
      proxy.placeholder = config.placeholder;
      proxy.setAttribute("aria-label", `${platform} username`);

      shell.append(prefix, proxy);
      original.insertAdjacentElement("afterend", shell);
      original.hidden = true;

      const note = document.createElement("p");
      note.className = "rg-social-note";
      note.textContent = config.note;
      shell.insertAdjacentElement("afterend", note);

      proxies[platform] = proxy;
      lastOriginal[platform] = clean(original.value);

      const syncProxyFromOriginal = () => {
        const current = clean(original.value);
        if (current === lastOriginal[platform]) return;
        lastOriginal[platform] = current;
        if (document.activeElement !== proxy) {
          proxy.value = current ? handleFromUrl(platform, current) : "";
        }
      };

      const syncOriginalFromProxy = () => {
        const raw = clean(proxy.value);
        const normalized = normalizeSocialUrl(platform, raw);
        original.value = normalized || raw;
        lastOriginal[platform] = clean(original.value);
        original.dispatchEvent(new Event("input", { bubbles: true }));
        renderState(platform);
      };

      proxy.addEventListener("input", syncOriginalFromProxy);
      proxy.addEventListener("blur", () => {
        const normalized = normalizeSocialUrl(platform, proxy.value);
        if (normalized) {
          proxy.value = handleFromUrl(platform, normalized);
          syncOriginalFromProxy();
        }
      });

      window.setInterval(syncProxyFromOriginal, 250);
    });

    const youtube = document.getElementById("youtube");
    if (youtube && !youtube.dataset.rgSocialEnhanced) {
      youtube.dataset.rgSocialEnhanced = "true";
      youtube.setAttribute("aria-label", "YouTube channel URL");
      youtube.placeholder = "https://youtube.com/@yourname";

      const note = document.createElement("p");
      note.className = "rg-social-note";
      note.textContent =
        "Use a YouTube channel/profile URL. Video, Shorts, playlist, and watch links are rejected.";
      youtube.insertAdjacentElement("afterend", note);

      youtube.addEventListener("input", () => {
        window.setTimeout(() => renderState("youtube"), 0);
      });

      youtube.addEventListener("blur", () => {
        const normalized = normalizeSocialUrl("youtube", youtube.value);
        if (normalized) {
          youtube.value = normalized;
          youtube.dispatchEvent(new Event("input", { bubbles: true }));
        }
        renderState("youtube");
      });
    }

    function rawFor(platform) {
      if (proxies[platform]) return clean(proxies[platform].value);
      return clean(document.getElementById(platform)?.value);
    }

    function renderState(platform) {
      const raw = rawFor(platform);
      const valid = Boolean(normalizeSocialUrl(platform, raw));
      const stateNode = document.getElementById(`${platform}State`);
      const shell = document.querySelector(`[data-rg-social-shell="${platform}"]`);
      const input = platform === "youtube" ? document.getElementById("youtube") : null;

      if (stateNode) {
        stateNode.textContent = !raw ? "Not added" : valid ? "Added" : "Check link";
        stateNode.classList.toggle("connected", valid);
        stateNode.classList.toggle("rg-invalid", Boolean(raw) && !valid);
      }

      if (shell) shell.classList.toggle("invalid", Boolean(raw) && !valid);
      if (input) input.classList.toggle("invalid", Boolean(raw) && !valid);
    }

    ["twitch", "youtube", "tiktok", "x"].forEach(platform => {
      window.setTimeout(() => renderState(platform), 0);
    });

    window.setTimeout(() => {
      Object.keys(proxies).forEach(platform => {
        const original = document.getElementById(platform);
        if (original && original.value) {
          proxies[platform].value = handleFromUrl(platform, original.value);
          lastOriginal[platform] = clean(original.value);
        }
        renderState(platform);
      });
      renderState("youtube");
    }, 700);

    const saveButton = document.getElementById("saveButton");
    if (saveButton && !saveButton.dataset.rgSocialGuard) {
      saveButton.dataset.rgSocialGuard = "true";

      saveButton.addEventListener(
        "click",
        event => {
          const checks = [
            ["twitch", rawFor("twitch"), "Enter a Twitch username or Twitch profile URL."],
            ["youtube", rawFor("youtube"), "Enter a YouTube channel/profile URL, not a video, Short, playlist, or watch link."],
            ["tiktok", rawFor("tiktok"), "Enter a TikTok username or TikTok profile URL."],
            ["x", rawFor("x"), "Enter an X username or X/Twitter profile URL."]
          ];

          for (const [platform, raw, message] of checks) {
            if (raw && !normalizeSocialUrl(platform, raw)) {
              event.preventDefault();
              event.stopImmediatePropagation();
              renderState(platform);
              showSettingsError(message);
              return;
            }
          }

          Object.keys(proxies).forEach(platform => {
            const original = document.getElementById(platform);
            const normalized = normalizeSocialUrl(platform, proxies[platform].value);
            if (original) original.value = normalized;
          });

          if (youtube) {
            youtube.value = normalizeSocialUrl("youtube", youtube.value);
          }
        },
        true
      );
    }
  }

  function platformFromAnchor(anchor) {
    const icon = anchor.querySelector("i")?.className || "";
    const text = clean(anchor.textContent).toLowerCase();

    if (icon.includes("fa-twitch") || text.includes("twitch")) return "twitch";
    if (icon.includes("fa-youtube") || text.includes("youtube")) return "youtube";
    if (icon.includes("fa-tiktok") || text.includes("tiktok")) return "tiktok";
    if (icon.includes("fa-x-twitter") || text === "x") return "x";
    return "";
  }

  function sanitizeProfileSocials() {
    const root = document.getElementById("heroSocialLinks");
    if (!root) return;

    const sanitize = () => {
      root.querySelectorAll("a[href]").forEach(anchor => {
        const platform = platformFromAnchor(anchor);
        if (!platform) return;

        const normalized = normalizeSocialUrl(platform, anchor.getAttribute("href"));

        if (!normalized) {
          anchor.removeAttribute("href");
          anchor.removeAttribute("target");
          anchor.removeAttribute("rel");
          anchor.classList.remove("connected");
          anchor.classList.add("empty-link");
          return;
        }

        if (anchor.href !== normalized) {
          anchor.href = normalized;
        }
      });
    };

    sanitize();

    const observer = new MutationObserver(sanitize);
    observer.observe(root, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["href"]
    });
  }

  function init() {
    setupSettings();
    sanitizeProfileSocials();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }

  window.RGCreatorLinks = {
    normalizeSocialUrl
  };
})();
