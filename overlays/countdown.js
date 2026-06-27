const countdownRef = database.ref("broadcastCountdown");
const siteRef = database.ref("site");

const eventNameEl = document.getElementById("eventName");
const timerEl = document.getElementById("countdownTimer");
const rotationTitleEl = document.getElementById("rotationTitle");
const rotationBodyEl = document.getElementById("rotationBody");
const footerTextEl = document.getElementById("footerText");
const stageEl = document.getElementById("countdownStage");
const startingEl = document.getElementById("broadcastStarting");

let countdownData = {};
let siteData = {};
let rotationIndex = 0;
let rotationTimer = null;
let countdownTimer = null;
let lastTimeText = "";

function safeText(value, fallback = "") {
  return String(value || fallback).trim();
}

function formatCountdown(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function getStartTime() {
  return countdownData.startTime || countdownData.countdownDate || siteData.countdownDate || "";
}

function getEventName() {
  return countdownData.eventName || siteData.eventName || "RIVALS GAUNTLET";
}

function getWebsite() {
  return countdownData.website || "RIVALSGAUNTLET.COM";
}

function getTeam(num) {
  return siteData[`team${num}`] || `Team ${num}`;
}

function makeMatchupsCard() {
  const matchups = countdownData.matchups || {};

  const rows = [
    {
      label: matchups.match1Label || "QF1",
      a: matchups.match1A || getTeam(1),
      b: matchups.match1B || getTeam(2)
    },
    {
      label: matchups.match2Label || "QF2",
      a: matchups.match2A || getTeam(3),
      b: matchups.match2B || getTeam(4)
    },
    {
      label: matchups.match3Label || "QF3",
      a: matchups.match3A || getTeam(5),
      b: matchups.match3B || getTeam(6)
    },
    {
      label: matchups.match4Label || "QF4",
      a: matchups.match4A || getTeam(7),
      b: matchups.match4B || getTeam(8)
    }
  ];

  return {
    title: "TODAY'S MATCHUPS",
    html: `
      <div class="matchup-list">
        ${rows.map(row => `
          <div class="matchup-row">
            <span>${safeText(row.label)}</span>
            <p>${safeText(row.a)}</p>
            <strong>VS</strong>
            <p>${safeText(row.b)}</p>
          </div>
        `).join("")}
      </div>
    `
  };
}

function makeFormatCard() {
  const format = countdownData.format || {};

  return {
    title: "TOURNAMENT FORMAT",
    html: `
      <div class="info-grid">
        <div class="info-item">
          <small>Format</small>
          <strong>${safeText(format.type, "Single Elimination")}</strong>
        </div>
        <div class="info-item">
          <small>Teams</small>
          <strong>${safeText(format.teams, "8 Teams")}</strong>
        </div>
        <div class="info-item">
          <small>Early Rounds</small>
          <strong>${safeText(format.earlyRounds, "Bo3")}</strong>
        </div>
        <div class="info-item">
          <small>Grand Finals</small>
          <strong>${safeText(format.grandFinals, "Bo5")}</strong>
        </div>
      </div>
    `
  };
}

function makePrizeCard() {
  const prize = countdownData.prize || {};
  const prizePool = prize.prizePool || siteData.prizePool || "$0";
  const goalPercentRaw = Number(prize.goalPercent || countdownData.goalPercent || 0);
  const goalPercent = Math.max(0, Math.min(100, goalPercentRaw));

  return {
    title: "CURRENT PRIZE POOL",
    html: `
      <div class="info-grid">
        <div class="info-item">
          <small>Prize Pool</small>
          <strong>${safeText(prizePool)}</strong>
        </div>
        <div class="info-item">
          <small>Community Goal</small>
          <strong>${goalPercent}%</strong>
          <div class="progress-track">
            <div class="progress-fill" style="width:${goalPercent}%"></div>
          </div>
        </div>
        <div class="info-item">
          <small>Support</small>
          <strong>${safeText(prize.supportText, "Fund Future Events")}</strong>
        </div>
        <div class="info-item">
          <small>Website</small>
          <strong>${safeText(getWebsite())}</strong>
        </div>
      </div>
    `
  };
}

function makeFollowCard() {
  const follow = countdownData.follow || {};

  return {
    title: "FOLLOW RIVALS GAUNTLET",
    html: `
      <div class="info-grid">
        <div class="info-item">
          <small>Website</small>
          <strong>${safeText(follow.website, getWebsite())}</strong>
        </div>
        <div class="info-item">
          <small>Discord</small>
          <strong>${safeText(follow.discord, "Join The Community")}</strong>
        </div>
        <div class="info-item">
          <small>Twitch</small>
          <strong>${safeText(follow.twitch, "Live Broadcasts")}</strong>
        </div>
        <div class="info-item">
          <small>YouTube</small>
          <strong>${safeText(follow.youtube, "Clips & VODs")}</strong>
        </div>
      </div>
    `
  };
}

function makeReminderCard() {
  const reminder = countdownData.reminder || {};

  return {
    title: "BROADCAST REMINDERS",
    html: `
      <div class="info-grid">
        <div class="info-item">
          <small>After Matches</small>
          <strong>${safeText(reminder.afterMatches, "Interviews & Recaps")}</strong>
        </div>
        <div class="info-item">
          <small>Stay Connected</small>
          <strong>${safeText(reminder.stayConnected, "Follow For Weekly Events")}</strong>
        </div>
        <div class="info-item">
          <small>Players</small>
          <strong>${safeText(reminder.players, "Check Discord For Updates")}</strong>
        </div>
        <div class="info-item">
          <small>Community</small>
          <strong>${safeText(reminder.community, "Thanks For Supporting")}</strong>
        </div>
      </div>
    `
  };
}

function makeUpNextCard() {
  const matchups = countdownData.matchups || {};
  const upNext = countdownData.upNext || {};

  const label = upNext.label || matchups.match1Label || "QF1";
  const teamA = upNext.teamA || matchups.match1A || getTeam(1);
  const teamB = upNext.teamB || matchups.match1B || getTeam(2);

  return {
    title: "UP NEXT",
    html: `
      <div class="up-next-card">
        <small>${safeText(label)}</small>
        <div class="up-next-teams">
          <strong>${safeText(teamA)}</strong>
          <span>VS</span>
          <strong>${safeText(teamB)}</strong>
        </div>
      </div>
    `
  };
}

function getCards() {
  return [
    makeUpNextCard(),
    makeMatchupsCard(),
    makeFormatCard(),
    makePrizeCard(),
    makeFollowCard(),
    makeReminderCard()
  ];
}

function renderCard(card) {
  const infoShell = document.querySelector(".info-shell");

  rotationBodyEl.classList.add("info-changing");

  if (infoShell) {
    infoShell.classList.toggle("up-next-mode", card.title === "UP NEXT");
  }

  setTimeout(() => {
    rotationTitleEl.textContent = card.title;
    rotationBodyEl.innerHTML = card.html;
    rotationBodyEl.classList.remove("info-changing");
  }, 260);
}

function startRotation() {
  clearInterval(rotationTimer);

  const cards = getCards();
  renderCard(cards[rotationIndex % cards.length]);

  rotationTimer = setInterval(() => {
    const currentCards = getCards();
    rotationIndex = (rotationIndex + 1) % currentCards.length;
    renderCard(currentCards[rotationIndex]);
  }, Number(countdownData.rotationMs || 9000));
}

function updateTimer() {
  const startTime = getStartTime();
  const start = startTime ? new Date(startTime).getTime() : Date.now() + 15 * 60 * 1000;
  const remaining = start - Date.now();
  const timeText = formatCountdown(remaining);

  if (timeText !== lastTimeText) {
  lastTimeText = timeText;
  timerEl.textContent = timeText;
}

  stageEl.classList.toggle("urgent", remaining <= 5 * 60 * 1000);
  stageEl.classList.toggle("final-minute", remaining <= 60 * 1000);
  stageEl.classList.toggle("final-ten", remaining <= 10 * 1000);

  const newRotationSpeed = remaining <= 60 * 1000 ? 6000 : Number(countdownData.rotationMs || 9000);

if (window.currentRotationSpeed !== newRotationSpeed) {
  window.currentRotationSpeed = newRotationSpeed;
  startRotation();
}
  
  if (remaining <= 0) {
    startingEl.classList.add("active");
    timerEl.textContent = "00:00";
  }
}

function startCountdown() {
  clearInterval(countdownTimer);
  updateTimer();
  countdownTimer = setInterval(updateTimer, 1000);
}

function renderAll() {
  eventNameEl.textContent = getEventName().toUpperCase();
  footerTextEl.textContent = getWebsite().toUpperCase();

  startRotation();
  startCountdown();
}

countdownRef.on("value", snapshot => {
  countdownData = snapshot.val() || {};
  renderAll();
});

siteRef.on("value", snapshot => {
  siteData = snapshot.val() || {};
  renderAll();
});
