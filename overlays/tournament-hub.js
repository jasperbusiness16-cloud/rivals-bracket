const siteRef = database.ref("site");
const countdownRef = database.ref("broadcastCountdown");
const donationsRef = database.ref("donations");

const hubStage = document.querySelector(".hub-stage");
const hubEventName = document.getElementById("hubEventName");
const hubStatusText = document.getElementById("hubStatusText");
const hubTimer = document.getElementById("hubTimer");
const timerProgressFill = document.getElementById("timerProgressFill");
const featureContent = document.getElementById("featureContent");
const infoCard = document.getElementById("infoCard");
const hubWebsite = document.getElementById("hubWebsite");

let siteData = {};
let countdownData = {};
let donationsData = {};

let featureIndex = 0;
let infoIndex = 0;
let countdownInterval = null;
let featureInterval = null;
let infoInterval = null;

const DEFAULT_BREAK_MINUTES = 5;
const FEATURE_ROTATION_MS = 30000;
const INFO_ROTATION_MS = 8500;

function clean(value, fallback = "") {
  return String(value || fallback).trim();
}

function money(value, fallback = "$0") {
  const raw = clean(value, fallback);
  if (raw.startsWith("$")) return raw;
  return `$${raw}`;
}

function normalize(text = "") {
  return String(text).toLowerCase();
}

function getFormat(match = "") {
  return normalize(match).includes("bo5") ? "BO5" : "BO3";
}

function getRoundLabel(match = "") {
  const text = normalize(match);

  if (text.includes("grand")) return "GRAND FINALS";
  if (text.includes("sf1")) return "SEMIFINAL 1";
  if (text.includes("sf2")) return "SEMIFINAL 2";
  if (text.includes("qf1")) return "QUARTERFINAL 1";
  if (text.includes("qf2")) return "QUARTERFINAL 2";
  if (text.includes("qf3")) return "QUARTERFINAL 3";
  if (text.includes("qf4")) return "QUARTERFINAL 4";
  if (text.includes("r16-1")) return "ROUND OF 16 • MATCH 1";
  if (text.includes("r16-2")) return "ROUND OF 16 • MATCH 2";
  if (text.includes("r16-3")) return "ROUND OF 16 • MATCH 3";
  if (text.includes("r16-4")) return "ROUND OF 16 • MATCH 4";
  if (text.includes("r16-5")) return "ROUND OF 16 • MATCH 5";
  if (text.includes("r16-6")) return "ROUND OF 16 • MATCH 6";
  if (text.includes("r16-7")) return "ROUND OF 16 • MATCH 7";
  if (text.includes("r16-8")) return "ROUND OF 16 • MATCH 8";

  return "NEXT MATCH";
}

function teamName(num) {
  return clean(siteData[`team${num}`], `Team ${num}`);
}

function getMatchFromCurrent() {
  const current = siteData.currentMatch || "";
  const text = normalize(current);

  if (text.includes("r16-1")) return { label: "ROUND OF 16 • MATCH 1", aName: teamName(1), bName: teamName(2) };
  if (text.includes("r16-2")) return { label: "ROUND OF 16 • MATCH 2", aName: teamName(3), bName: teamName(4) };
  if (text.includes("r16-3")) return { label: "ROUND OF 16 • MATCH 3", aName: teamName(5), bName: teamName(6) };
  if (text.includes("r16-4")) return { label: "ROUND OF 16 • MATCH 4", aName: teamName(7), bName: teamName(8) };
  if (text.includes("r16-5")) return { label: "ROUND OF 16 • MATCH 5", aName: teamName(9), bName: teamName(10) };
  if (text.includes("r16-6")) return { label: "ROUND OF 16 • MATCH 6", aName: teamName(11), bName: teamName(12) };
  if (text.includes("r16-7")) return { label: "ROUND OF 16 • MATCH 7", aName: teamName(13), bName: teamName(14) };
  if (text.includes("r16-8")) return { label: "ROUND OF 16 • MATCH 8", aName: teamName(15), bName: teamName(16) };

  if (text.includes("qf1")) {
    return {
      label: "QUARTERFINAL 1",
      aName: siteData.r16m1Winner || teamName(1),
      bName: siteData.r16m2Winner || teamName(2)
    };
  }

  if (text.includes("qf2")) {
    return {
      label: "QUARTERFINAL 2",
      aName: siteData.r16m3Winner || teamName(3),
      bName: siteData.r16m4Winner || teamName(4)
    };
  }

  if (text.includes("qf3")) {
    return {
      label: "QUARTERFINAL 3",
      aName: siteData.r16m5Winner || teamName(5),
      bName: siteData.r16m6Winner || teamName(6)
    };
  }

  if (text.includes("qf4")) {
    return {
      label: "QUARTERFINAL 4",
      aName: siteData.r16m7Winner || teamName(7),
      bName: siteData.r16m8Winner || teamName(8)
    };
  }

  if (text.includes("sf1")) {
    return {
      label: "SEMIFINAL 1",
      aName: siteData.qf1Winner || "Winner QF1",
      bName: siteData.qf2Winner || "Winner QF2"
    };
  }

  if (text.includes("sf2")) {
    return {
      label: "SEMIFINAL 2",
      aName: siteData.qf3Winner || "Winner QF3",
      bName: siteData.qf4Winner || "Winner QF4"
    };
  }

  if (text.includes("grand")) {
    return {
      label: "GRAND FINALS",
      aName: siteData.sf1Winner || "Winner SF1",
      bName: siteData.sf2Winner || "Winner SF2"
    };
  }

  return {
    label: getRoundLabel(siteData.currentMatch || "QF1 • BO3"),
    aName: teamName(1),
    bName: teamName(2)
  };
}

function getNextMatch() {
  const upNext = countdownData.upNext || {};

  if (upNext.teamA && upNext.teamB) {
    return {
      label: upNext.label || getRoundLabel(siteData.currentMatch),
      aName: upNext.teamA,
      bName: upNext.teamB,
      format: getFormat(upNext.label || siteData.currentMatch)
    };
  }

  const match = getMatchFromCurrent();
  return {
    ...match,
    format: getFormat(siteData.currentMatch || match.label)
  };
}

function getCountdownEndTime() {
  if (countdownData.hubEndTime) {
    const parsed = new Date(countdownData.hubEndTime).getTime();
    if (!Number.isNaN(parsed)) return parsed;
  }

  if (countdownData.countdownStartTime) {
    const parsed = new Date(countdownData.countdownStartTime).getTime();
    if (!Number.isNaN(parsed)) return parsed;
  }

  return Date.now() + DEFAULT_BREAK_MINUTES * 60 * 1000;
}

function formatTime(ms) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function updateCountdown() {
  const endTime = getCountdownEndTime();
  const totalDuration = Number(countdownData.hubDurationMs) || DEFAULT_BREAK_MINUTES * 60 * 1000;
  const remaining = endTime - Date.now();

  hubStage.classList.remove("urgent", "final-countdown", "returning");

  if (remaining <= 0) {
    hubStage.classList.add("returning");
    hubStatusText.textContent = "RETURNING TO BROADCAST";
    hubTimer.textContent = "RETURNING";
    timerProgressFill.style.width = "0%";
    return;
  }

  hubStatusText.textContent = "WE’LL BE RIGHT BACK";
  hubTimer.textContent = formatTime(remaining);

  const percent = Math.max(0, Math.min(100, (remaining / totalDuration) * 100));
  timerProgressFill.style.width = `${percent}%`;

  if (remaining <= 60000) hubStage.classList.add("urgent");
  if (remaining <= 30000) hubStage.classList.add("final-countdown");
}

function getDonationArray() {
  if (!donationsData) return [];

  return Object.values(donationsData)
    .filter(d => d && (d.name || d.from_name || d.amount))
    .map(d => ({
      name: clean(d.name || d.from_name || d.displayName, "Anonymous"),
      amount: Number(d.amount || d.amount_value || 0)
    }))
    .filter(d => d.amount > 0)
    .sort((a, b) => b.amount - a.amount);
}

function getTopSupporters(limit = 3) {
  const totals = {};

  getDonationArray().forEach(donation => {
    totals[donation.name] = (totals[donation.name] || 0) + donation.amount;
  });

  return Object.entries(totals)
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, limit);
}

function getPrizePoolNumber() {
  const raw = clean(siteData.prizePool || siteData.currentPrizePool || siteData.startingPrizePool || "0");
  const num = Number(raw.replace(/[^0-9.]/g, ""));
  return Number.isNaN(num) ? 0 : num;
}

function getDonationGoalNumber() {
  const raw = clean(siteData.donationGoal || "250");
  const num = Number(raw.replace(/[^0-9.]/g, ""));
  return Number.isNaN(num) ? 250 : num;
}

function renderNextMatchFeature() {
  const match = getNextMatch();

  return `
    <p class="feature-eyebrow">${match.label}</p>
    <h2 class="feature-title">NEXT MATCH</h2>

    <div class="match-row">
      <div class="match-team left">${clean(match.aName, "Team A")}</div>
      <div class="match-vs">VS</div>
      <div class="match-team right">${clean(match.bName, "Team B")}</div>
    </div>

    <p class="feature-sub">${match.format} • PLAYERS ENTERING LOBBY</p>
  `;
}

function renderBracketFeature() {
  return `
    <div class="mini-bracket">
      <div class="bracket-col">
        <div class="bracket-label">Quarterfinals</div>
        ${bracketBox("QF1", siteData.qf1Winner || "Winner QF1", siteData.currentMatch)}
        ${bracketBox("QF2", siteData.qf2Winner || "Winner QF2", siteData.currentMatch)}
        ${bracketBox("QF3", siteData.qf3Winner || "Winner QF3", siteData.currentMatch)}
        ${bracketBox("QF4", siteData.qf4Winner || "Winner QF4", siteData.currentMatch)}
      </div>

      <div class="bracket-col">
        <div class="bracket-label">Semifinals</div>
        ${bracketBox("SF1", siteData.sf1Winner || "Winner SF1", siteData.currentMatch)}
        ${bracketBox("SF2", siteData.sf2Winner || "Winner SF2", siteData.currentMatch)}
      </div>

      <div class="bracket-col">
        <div class="bracket-label">Finals</div>
        ${bracketBox("GRAND", siteData.grandWinner || "Grand Finalist", siteData.currentMatch)}
      </div>
    </div>
  `;
}

function bracketBox(label, team, currentMatch = "") {
  const current = normalize(currentMatch).includes(normalize(label).replace("grand", "grand"));
  const winner = !normalize(team).includes("winner") && !normalize(team).includes("finalist");

  return `
    <div class="bracket-box ${winner ? "winner" : ""} ${current ? "current" : ""}">
      <span>${label}</span>
      <span>${team}</span>
    </div>
  `;
}

function renderPrizeFeature() {
  const prize = getPrizePoolNumber();
  const goal = getDonationGoalNumber();
  const percent = Math.max(0, Math.min(100, Math.round((prize / goal) * 100)));

  return `
    <p class="feature-eyebrow">Community Prize Pool</p>
    <h2 class="big-stat">$${prize}</h2>
    <div class="goal-bar">
      <div class="goal-fill" style="width:${percent}%"></div>
    </div>
    <p class="feature-sub">${percent}% TO COMMUNITY GOAL • 100% GOES BACK TO EVENTS</p>
  `;
}

function renderSupporterFeature() {
  const supporters = getTopSupporters(3);

  const pills = supporters.length
    ? supporters.map((s, i) => `
        <div class="supporter-pill">
          <strong>${["🥇", "🥈", "🥉"][i] || "★"} ${s.name}</strong>
          <small>$${s.amount.toFixed(2)}</small>
        </div>
      `).join("")
    : `
        <div class="supporter-pill">
          <strong>Supporters</strong>
          <small>Coming Soon</small>
        </div>
      `;

  return `
    <p class="feature-eyebrow">Top Supporters</p>
    <h2 class="feature-title">THANK YOU FOR SUPPORTING THE GAUNTLET</h2>
    <div class="supporter-list">${pills}</div>
  `;
}

function renderCommunityFeature() {
  return `
    <p class="feature-eyebrow">Join The Community</p>
    <h2 class="feature-title">COMPETE • WATCH • SUPPORT</h2>

    <div class="community-grid">
      <div class="community-box">
        <strong>Discord</strong>
        <small>Signups & updates</small>
      </div>

      <div class="community-box">
        <strong>Website</strong>
        <small>RivalsGauntlet.com</small>
      </div>

      <div class="community-box">
        <strong>Broadcast</strong>
        <small>Follow for future events</small>
      </div>
    </div>
  `;
}

function getFeaturePanels() {
  return [
    renderNextMatchFeature,
    renderBracketFeature,
    renderPrizeFeature,
    renderSupporterFeature,
    renderCommunityFeature
  ];
}

function renderFeaturePanel() {
  const panels = getFeaturePanels();
  const render = panels[featureIndex % panels.length];

  featureContent.classList.remove("active");

  setTimeout(() => {
    featureContent.innerHTML = render();
    featureContent.classList.add("active");
  }, 120);
}

function getInfoPanels() {
  const match = getNextMatch();
  const prize = money(siteData.prizePool || siteData.currentPrizePool || siteData.startingPrizePool || "$0");

  return [
    {
      eyebrow: "Next Match",
      title: `${match.aName} vs ${match.bName}`,
      side: `${match.label} • ${match.format}`
    },
    {
      eyebrow: "Prize Pool",
      title: `${prize} Current Prize Pool`,
      side: "Community donations support future events"
    },
    {
      eyebrow: "Tournament Format",
      title: clean(siteData.formatText || "Single Elimination • BO3 Matches"),
      side: "Grand Finals BO5"
    },
    {
      eyebrow: "Community",
      title: "Join the Discord for signups",
      side: "Rules • Updates • Sub info • Announcements"
    },
    {
      eyebrow: "Website",
      title: clean(countdownData.website || "RivalsGauntlet.com").toUpperCase(),
      side: "Bracket • Donations • Event info"
    },
    {
      eyebrow: "Broadcast",
      title: "Casters setting up the next lobby",
      side: "Stay tuned — coverage returns shortly"
    }
  ];
}

function renderInfoCard() {
  const panels = getInfoPanels();
  const panel = panels[infoIndex % panels.length];

  infoCard.classList.remove("active");

  setTimeout(() => {
    infoCard.innerHTML = `
      <div class="info-main">
        <small>${panel.eyebrow}</small>
        <strong>${panel.title}</strong>
      </div>
      <div class="info-side">${panel.side}</div>
    `;

    infoCard.classList.add("active");
  }, 120);
}

function renderStaticData() {
  hubEventName.textContent = clean(siteData.eventName, "Rivals Gauntlet Open #1").toUpperCase();
  hubWebsite.textContent = clean(countdownData.website, "RIVALSGAUNTLET.COM").toUpperCase();
}

function renderAll() {
  renderStaticData();
  updateCountdown();
  renderFeaturePanel();
  renderInfoCard();
}

function startLoops() {
  if (!countdownInterval) {
    countdownInterval = setInterval(updateCountdown, 250);
  }

  if (!featureInterval) {
    featureInterval = setInterval(() => {
      featureIndex++;
      renderFeaturePanel();
    }, FEATURE_ROTATION_MS);
  }

  if (!infoInterval) {
    infoInterval = setInterval(() => {
      infoIndex++;
      renderInfoCard();
    }, INFO_ROTATION_MS);
  }
}

siteRef.on("value", snapshot => {
  siteData = snapshot.val() || {};
  renderAll();
  startLoops();
});

countdownRef.on("value", snapshot => {
  countdownData = snapshot.val() || {};
  renderAll();
  startLoops();
});

donationsRef.on("value", snapshot => {
  donationsData = snapshot.val() || {};
  renderAll();
  startLoops();
});
