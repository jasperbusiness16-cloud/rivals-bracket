const championsRef = database.ref("champions");
const donationsRef = database.ref("donations");
const siteRef = database.ref("site");
const countdownRef = database.ref("broadcastCountdown");

const creditsStage = document.getElementById("creditsStage");
const creditsScroll = document.getElementById("creditsScroll");
const creditsWebsite = document.getElementById("creditsWebsite");

function clean(value, fallback = "") {
  return String(value || fallback).trim();
}

function getLatestChampion(data) {
  if (!data) return null;

  const champions = Object.entries(data)
    .map(([id, champion]) => ({ id, ...champion }))
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

  return champions[0] || null;
}

function getTopDonators(data, limit = 5) {
  if (!data) return [];

  const totals = {};

  Object.values(data).forEach(donation => {
    if (!donation) return;

    const name = clean(
      donation.name || donation.from_name || donation.displayName,
      "Anonymous"
    );

    const amount = Number(donation.amount || donation.amount_value || 0);
    if (!amount || Number.isNaN(amount)) return;

    totals[name] = (totals[name] || 0) + amount;
  });

  return Object.entries(totals)
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, limit);
}

function getCasterList(siteData = {}) {
  const casters = [];

  if (siteData.caster1Enabled !== false) {
    casters.push({
      name: clean(siteData.caster1Name, "Jasper Harvey"),
      role: clean(siteData.caster1Role, "Host")
    });
  }

  if (siteData.caster2Enabled) {
    casters.push({
      name: clean(siteData.caster2Name, "Caster Two"),
      role: clean(siteData.caster2Role, "Analyst")
    });
  }

  if (siteData.caster3Enabled) {
    casters.push({
      name: clean(siteData.caster3Name, "Guest Caster"),
      role: clean(siteData.caster3Role, "Guest")
    });
  }

  return casters;
}

function section(title, content) {
  return `
    <section class="credit-section">
      <h2>${title}</h2>
      ${content}
    </section>
  `;
}

function buildCredits({ champion, donors, siteData }) {
  const eventName = clean(siteData.eventName, "Rivals Gauntlet Open #1");
  const casters = getCasterList(siteData);

  const championPlayers = champion?.players?.length
    ? champion.players.slice(0, 6)
    : [];

  const championSection = champion
    ? section(
        "Tournament Champions",
        `
          <div class="credit-main">${clean(champion.teamName, "Champion Team")}</div>
          <div class="credit-small">${clean(champion.eventName, eventName)}</div>
          <div class="credit-small">Final Score • ${clean(champion.finalScore, "Final")}</div>

          <br>

          ${
            championPlayers.length
              ? championPlayers.map(player => `
                  <div class="credit-line">${clean(player.name, "Player")}</div>
                `).join("")
              : `<div class="credit-line">Champion Roster</div>`
          }
        `
      )
    : section(
        "Tournament Champions",
        `
          <div class="credit-main">Champion Team</div>
          <div class="credit-small">${eventName}</div>
        `
      );

  const donorSection = section(
    "Community Support",
    donors.length
      ? `
        <div class="credit-small">Top Donators</div>
        <br>
        ${donors.map(donor => `
          <div class="credit-donor">
            <strong>${donor.name}</strong>
            <span>$${donor.amount.toFixed(2)}</span>
          </div>
        `).join("")}
      `
      : `
        <div class="credit-line">Thank you to everyone supporting Rivals Gauntlet.</div>
      `
  );

  const broadcastSection = section(
    "Broadcast Team",
    `
      ${
        casters.length
          ? casters.map(caster => `
              <div class="credit-small">${caster.role}</div>
              <div class="credit-line">${caster.name}</div>
            `).join("<br>")
          : `
              <div class="credit-small">Host</div>
              <div class="credit-line">Jasper Harvey</div>
            `
      }

      <br><br>

      <div class="credit-small">Production</div>
      <div class="credit-line">Rivals Gauntlet Broadcast Team</div>
    `
  );

  const thanksSection = section(
    "Special Thanks",
    `
      <div class="credit-line">Every Competitor</div>
      <div class="credit-line">Every Viewer</div>
      <div class="credit-line">The Rivals Gauntlet Community</div>
      <div class="credit-line">Everyone Helping Grow The Gauntlet</div>
    `
  );

  const finalSection = section(
    "See You At The Next Gauntlet",
    `
      <div class="credit-main">Rivals Gauntlet</div>
      <div class="credit-small">RivalsGauntlet.com</div>
    `
  );

  return `
    <section class="credit-section intro-section">

        <img class="credits-logo"
             src="assets/logos/clean logo.PNG">

        <div class="credit-main">
            THANK YOU FOR WATCHING
        </div>

        <div class="credit-small">
            ${eventName}
        </div>

    </section>

    ${championSection}
    ${donorSection}
    ${broadcastSection}
    ${thanksSection}
    ${finalSection}
`;
}

Promise.all([
  championsRef.once("value"),
  donationsRef.once("value"),
  siteRef.once("value"),
  countdownRef.once("value")
]).then(([championsSnap, donationsSnap, siteSnap, countdownSnap]) => {
  const siteData = siteSnap.val() || {};
  const countdownData = countdownSnap.val() || {};

  const champion = getLatestChampion(championsSnap.val());
  const donors = getTopDonators(donationsSnap.val(), 5);

  creditsWebsite.textContent = clean(
    countdownData.website,
    "RIVALSGAUNTLET.COM"
  ).toUpperCase();

  creditsScroll.innerHTML = buildCredits({
    champion,
    donors,
    siteData
  });

  requestAnimationFrame(() => {
    creditsStage.classList.remove("loading");

    setTimeout(() => {
        creditsStage.classList.add("ready");
    }, 3500);
});
