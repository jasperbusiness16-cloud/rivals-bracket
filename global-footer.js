(() => {
  "use strict";

  const mount = document.getElementById("globalFooter");

  if (!mount) {
    return;
  }

  const currentYear = new Date().getFullYear();

  const primaryLinks = [
    ["Home", "/"],
    ["Tournament", "/tournament.html"],
    ["Predictions", "/predictions.html"],
    ["Leaderboard", "/leaderboard.html"],
    ["Add to Prize Pool", "/donate.html"],
    ["About", "/about.html"]
  ];

  const legalLinks = [
    ["Privacy Policy", "/privacy.html"],
    ["Terms of Service", "/terms.html"],
    ["Tournament Rules", "/tournament-rules.html"],
    ["Contact", "/contact.html"]
  ];

  function createLinks(links, modifier = "") {
    return `
      <div class="rg-footer__links ${modifier}">
        ${links
          .map(
            ([label, href]) => `
              <a class="rg-footer__link" href="${href}">
                ${label}
              </a>
            `
          )
          .join("")}
      </div>
    `;
  }

  mount.innerHTML = `
    <footer class="rg-footer" aria-label="Rivals Gauntlet footer">
      <div class="rg-footer__inner">

        <div class="rg-footer__main">

          <div class="rg-footer__brand">
            <div class="rg-footer__eyebrow">
              Independent Competition Platform
            </div>

            <div class="rg-footer__name">
              Rivals Gauntlet
            </div>

            <div class="rg-footer__domain">
              rivalsgauntlet.com
            </div>
          </div>

          <div class="rg-footer__groups">

            <nav aria-label="Footer navigation">
              <h2 class="rg-footer__group-title">
                Explore
              </h2>

              ${createLinks(primaryLinks)}
            </nav>

            <nav aria-label="Legal and contact">
              <h2 class="rg-footer__group-title">
                Information
              </h2>

              ${createLinks(
                legalLinks,
                "rg-footer__links--legal"
              )}
            </nav>

          </div>
        </div>

        <div class="rg-footer__bottom">

          <p class="rg-footer__copyright">
            © ${currentYear} Rivals Gauntlet. All rights reserved.
          </p>

          <p class="rg-footer__status">
            Community-operated esports platform
          </p>

        </div>
      </div>
    </footer>
  `;
})();
