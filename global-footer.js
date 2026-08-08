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