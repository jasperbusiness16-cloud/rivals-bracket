(() => {
  "use strict";

  const mount = document.getElementById("globalFooter");
  if (!mount) return;

  const currentYear = new Date().getFullYear();

  const primaryLinks = [
    ["Home", "/"],
    ["Tournament", "/tournament.html"],
    ["Predictions", "/predictions.html"],
    ["Leaderboard", "/leaderboard.html"],
    ["Add to Prize Pool", "/donate.html", "prize"],
    ["About", "/about.html"]
  ];

  const legalLinks = [
    ["Privacy Policy", "/privacy.html"],
    ["Terms of Service", "/terms.html"],
    ["Tournament Rules", "/tournament-rules.html"],
    ["Contact", "/contact.html"]
  ];

  const socialLinks = [
    ["Discord", "https://discord.gg/82HPpfkhQN", "fa-brands fa-discord"],
    ["Twitch", "https://www.twitch.tv/atrophylive", "fa-brands fa-twitch"]
  ];

  function createStandardLinks(links, extraClass = "") {
    return `
      <div class="rg-footer__links ${extraClass}">
        ${links.map(([label, href, type]) => `
          <a
            href="${href}"
            class="rg-footer__link ${type === "prize" ? "rg-footer__link--prize" : ""}"
          >
            ${type === "prize"
              ? '<i class="fa-solid fa-coins"></i>'
              : ""}
            ${label}
          </a>
        `).join("")}
      </div>
    `;
  }

  function createSocialLinks() {
    return `
      <div class="rg-footer__links rg-footer__links--social">
        ${socialLinks.map(([label, href, icon]) => `
          <a
            class="rg-footer__link rg-footer__social"
            href="${href}"
            target="_blank" rel="noopener noreferrer"
          >
            <i class="${icon}"></i>
            <span>${label}</span>
          </a>
        `).join("")}
      </div>
    `;
  }

  mount.innerHTML = `
    <footer class="rg-footer">

      <div class="rg-footer__inner">

        <div class="rg-footer__main">

          <div class="rg-footer__brand">

            <div class="rg-footer__name">
              Rivals Gauntlet
            </div>

            <div class="rg-footer__eyebrow">
              Community Tournament Platform
            </div>

            <a
              href="/"
              class="rg-footer__domain"
            >
              rivalsgauntlet.com
            </a>

          </div>

          <div class="rg-footer__groups">

            <nav class="rg-footer__group">

              <h2 class="rg-footer__group-title">
                Explore
              </h2>

              ${createStandardLinks(primaryLinks)}

            </nav>

            <nav class="rg-footer__group">

              <h2 class="rg-footer__group-title">
                Information
              </h2>

              ${createStandardLinks(
                legalLinks,
                "rg-footer__links--legal"
              )}

            </nav>

            <nav class="rg-footer__group rg-footer__group--connect">

              <h2 class="rg-footer__group-title">
                Connect
              </h2>

              ${createSocialLinks()}

            </nav>

          </div>

        </div>

        <div class="rg-footer__bottom">

          <p class="rg-footer__copyright">
            © ${currentYear} Rivals Gauntlet. All rights reserved.
          </p>

          <p class="rg-footer__status">
            Community-operated tournament platform
          </p>

        </div>

      </div>

    </footer>
  `;
})();

/*
  Keep the prize-pool payout presentation identical on Tournament and Donate.
  Both pages intentionally use their existing data bindings; this only
  normalizes the visual component and the display copy.
*/
(() => {
  "use strict";

  const pathname = String(window.location.pathname || "");
  const isTournament = /^\/tournament(?:\.html)?\/?$/i.test(pathname);
  const isDonate = /^\/donate(?:\.html)?\/?$/i.test(pathname);

  if (!isTournament && !isDonate) return;

  const style = document.createElement("style");
  style.setAttribute("data-rg-prize-payout-ui", "true");
  style.textContent = `
    .dynamic-prize-card .prize-split-bar,
    .payout-panel .prize-split-bar {
      display: flex;
      width: 100%;
      height: 46px;
      overflow: hidden;
      border: 1px solid rgba(255,255,255,.10);
      border-radius: 12px;
      background: #09080f;
    }

    .dynamic-prize-card .prize-split-first,
    .dynamic-prize-card .prize-split-second,
    .payout-panel .prize-split-first,
    .payout-panel .prize-split-second {
      display: flex;
      align-items: center;
      justify-content: center;
      min-width: 0;
      overflow: hidden;
      padding: 0 4px;
      color: #fff !important;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: .055em;
      line-height: 1;
      text-align: center;
      text-transform: uppercase;
      white-space: nowrap;
      text-shadow: 0 1px 3px rgba(0,0,0,.58);
    }

    .dynamic-prize-card .prize-split-first,
    .payout-panel .prize-split-first {
      width: 80%;
      background: linear-gradient(90deg, #6d28d9, #a855f7) !important;
    }

    .dynamic-prize-card .prize-split-second,
    .payout-panel .prize-split-second {
      width: 20%;
      color: #fff !important;
      background: linear-gradient(90deg, #414052, #5d596e) !important;
      box-shadow: inset 1px 0 rgba(255,255,255,.08);
    }

    /* Donate uses a span for the placement badge. Its generic span rule was
       overriding the badge display/font, so use higher specificity here. */
    .payout-panel .placement-row .placement-number {
      display: grid !important;
      width: 46px !important;
      height: 46px !important;
      place-items: center !important;
      flex: 0 0 46px;
      padding: 0 !important;
      border: 0 !important;
      border-radius: 13px !important;
      color: #fff !important;
      background: linear-gradient(135deg, #6d28d9, #a855f7) !important;
      font-size: 21px !important;
      font-weight: 800 !important;
      letter-spacing: 0 !important;
      line-height: 1 !important;
      text-align: center !important;
      text-transform: none !important;
      box-shadow: inset 0 1px rgba(255,255,255,.08);
    }

    .payout-panel .payout-card:not(.first) .placement-number {
      background: #414052 !important;
    }

    /* Match Donate payout cards/details to the Tournament component. */
    .payout-panel .payout-card {
      padding: 22px;
      border: 1px solid rgba(255,255,255,.09);
      border-radius: 16px;
      background: rgba(255,255,255,.025);
    }

    .payout-panel .payout-card.first {
      border-color: rgba(168,85,247,.30);
      background:
        radial-gradient(circle at top right, rgba(168,85,247,.12), transparent 40%),
        rgba(255,255,255,.025);
    }

    .payout-panel .placement-row {
      gap: 14px;
    }

    .payout-panel .placement-row > div > span {
      color: #746e82;
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 1.4px;
      text-transform: uppercase;
    }

    .payout-panel .placement-row > div > strong {
      margin-top: 3px;
      font-size: 25px;
    }

    .payout-panel .payout-details {
      display: grid;
      grid-template-columns: repeat(2, minmax(0,1fr));
      gap: 10px;
      margin-top: 18px;
    }

    .payout-panel .payout-details > div {
      padding: 13px;
      border: 1px solid rgba(255,255,255,.09);
      border-radius: 11px;
      background: rgba(0,0,0,.16);
    }

    .payout-panel .payout-details span {
      color: #746e82;
      font-size: 10px;
      font-weight: 800;
      letter-spacing: .7px;
      text-transform: uppercase;
    }

    .payout-panel .payout-details strong {
      display: block;
      margin-top: 5px;
      font-size: 20px;
    }

    @media (max-width: 470px) {
      .dynamic-prize-card .prize-split-first,
      .payout-panel .prize-split-first {
        font-size: 9px;
        letter-spacing: .02em;
      }

      .dynamic-prize-card .prize-split-second,
      .payout-panel .prize-split-second {
        font-size: 0 !important;
        white-space: normal;
      }

      .dynamic-prize-card .prize-split-second::after,
      .payout-panel .prize-split-second::after {
        content: "20%\\A 2ND PLACE";
        display: block;
        color: #fff;
        font-size: 9px;
        font-weight: 800;
        letter-spacing: .02em;
        line-height: 1.05;
        text-align: center;
        white-space: pre-line;
        text-shadow: 0 1px 3px rgba(0,0,0,.62);
      }

      .payout-panel .payout-details {
        grid-template-columns: 1fr;
      }
    }
  `;

  document.head.appendChild(style);

  if (!isDonate) return;

  /* Match Tournament display copy without touching the live payout IDs. */
  const firstSplit = document.getElementById("firstPlaceSplitBar");
  const secondSplit = document.getElementById("secondPlaceSplitBar");
  if (firstSplit) firstSplit.textContent = "80% First Place";
  if (secondSplit) secondSplit.textContent = "20% Second Place";

  const cards = document.querySelectorAll(".payout-panel .payout-card");
  if (cards[0]) {
    const label = cards[0].querySelector(".placement-row > div > span");
    if (label) label.textContent = "First Place";
  }
  if (cards[1]) {
    const label = cards[1].querySelector(".placement-row > div > span");
    if (label) label.textContent = "Second Place";
  }

  document.querySelectorAll(".payout-panel .payout-details").forEach(details => {
    const shareLabel = details.querySelector("div:first-child span");
    if (shareLabel) shareLabel.textContent = "Team Share";
  });
})();

/* iPad/tablet launch polish for Home and Prediction Command. */
(() => {
  "use strict";

  const pathname = String(window.location.pathname || "");
  const isHome = pathname === "/" || /^\/index(?:\.html)?\/?$/i.test(pathname);
  const isPredictions = /^\/predictions(?:\.html)?\/?$/i.test(pathname);

  if (!isHome && !isPredictions) return;

  const style = document.createElement("style");
  style.setAttribute("data-rg-ipad-layout-fixes", "true");

  style.textContent = `
    ${isHome ? `
      /* Prevent the 3-column countdown from using min-content widths that
         push the Minutes box outside the tablet card. */
      .count-panel,
      .countdown,
      .unit {
        min-width: 0;
      }

      .countdown {
        width: 100%;
        grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
      }

      @media (min-width: 981px) and (max-width: 1400px) {
        .tournament-card {
          grid-template-columns: minmax(0, 1.08fr) minmax(280px, .92fr) !important;
          gap: 18px !important;
          padding: 28px !important;
        }

        .count-panel {
          padding: 20px 16px !important;
          overflow: hidden;
        }

        .countdown {
          gap: 6px !important;
        }

        .unit {
          padding: 13px 3px !important;
        }

        .unit strong {
          font-size: clamp(23px, 2.5vw, 28px) !important;
        }

        .unit span {
          margin-top: 6px !important;
          font-size: 8px !important;
          letter-spacing: .65px !important;
          white-space: nowrap;
        }

        .event-date {
          font-size: 12px !important;
          line-height: 1.35;
        }
      }
    ` : ""}

    ${isPredictions ? `
      /* Keep both teams visually balanced around VS instead of letting the
         left team sit at the far edge while the row-reversed right team hugs
         the center. */
      @media (min-width: 981px) and (max-width: 1400px) {
        .live-match-hero {
          grid-template-columns:
            minmax(230px, 330px)
            minmax(110px, 140px)
            minmax(230px, 330px) !important;
          justify-content: center;
          gap: 22px !important;
          padding-left: 24px !important;
          padding-right: 24px !important;
        }

        .live-team {
          justify-content: flex-end;
        }

        .live-team.right {
          /* row-reverse makes flex-end the inner/left edge of this column,
             which mirrors the left team around the center block. */
          justify-content: flex-end;
        }

        .live-team-copy {
          max-width: 220px;
        }
      }
    ` : ""}
  `;

  document.head.appendChild(style);
})();

/* Desktop polish shared by public pages that load the global footer script. */
(() => {
  "use strict";

  const pathname = String(window.location.pathname || "");
  const isPredictions = /^\/predictions(?:\.html)?\/?$/i.test(pathname);
  const style = document.createElement("style");
  style.setAttribute("data-rg-desktop-launch-polish", "true");

  style.textContent = `
    @media (min-width: 1241px) {
      #globalHeader .rg-header__nav-link {
        min-width: 94px;
        padding-left: 17px;
        padding-right: 17px;
      }

      #globalHeader .rg-header__nav-link::before {
        inset: 19px 1px;
        border-radius: 9px;
      }

      #globalHeader .rg-header__nav-link.is-active::after {
        width: calc(100% - 30px);
      }
    }

    ${isPredictions ? `
      @media (min-width: 1401px) {
        .live-match-hero {
          grid-template-columns:
            minmax(250px, 360px)
            minmax(120px, 150px)
            minmax(250px, 360px) !important;
          justify-content: center;
          gap: 28px !important;
          padding-left: 40px !important;
          padding-right: 40px !important;
        }

        .live-team {
          justify-content: flex-end;
        }

        .live-team.right {
          justify-content: flex-end;
        }

        .live-team-copy {
          max-width: 240px;
        }
      }
    ` : ""}
  `;

  document.head.appendChild(style);
})();