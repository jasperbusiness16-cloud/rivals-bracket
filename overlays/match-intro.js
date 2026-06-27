const siteRef = database.ref("site");
const countdownRef = database.ref("broadcastCountdown");

const introEvent = document.getElementById("introEvent");
const introRound = document.getElementById("introRound");
const teamAName = document.getElementById("teamAName");
const teamBName = document.getElementById("teamBName");
const teamAPlayers = document.getElementById("teamAPlayers");
const teamBPlayers = document.getElementById("teamBPlayers");
const matchFormat = document.getElementById("matchFormat");
const introFooter = document.getElementById("introFooter");

let siteData = {};
let countdownData = {};

let renderTimeout = null;

function scheduleRenderIntro() {
  clearTimeout(renderTimeout);

  renderTimeout = setTimeout(() => {
    renderIntro();
  }, 150);
}

function clean(value, fallback = "") {
  return String(value || fallback).trim();
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

  return "MATCH INTRO";
}

function findTeamNumberByName(name) {
  const target = clean(name).toLowerCase();

  for (let i = 1; i <= 16; i++) {
    const teamName = clean(siteData[`team${i}`], `Team ${i}`).toLowerCase();
    if (teamName === target) return i;
  }

  return null;
}

function teamName(num) {
  return clean(siteData[`team${num}`], `Team ${num}`);
}

function getMatchFromCurrent() {
  const current = siteData.currentMatch || "";
  const text = normalize(current);

  if (text.includes("r16-1")) return { label: "ROUND OF 16 • MATCH 1", aNum: 1, bNum: 2 };
  if (text.includes("r16-2")) return { label: "ROUND OF 16 • MATCH 2", aNum: 3, bNum: 4 };
  if (text.includes("r16-3")) return { label: "ROUND OF 16 • MATCH 3", aNum: 5, bNum: 6 };
  if (text.includes("r16-4")) return { label: "ROUND OF 16 • MATCH 4", aNum: 7, bNum: 8 };
  if (text.includes("r16-5")) return { label: "ROUND OF 16 • MATCH 5", aNum: 9, bNum: 10 };
  if (text.includes("r16-6")) return { label: "ROUND OF 16 • MATCH 6", aNum: 11, bNum: 12 };
  if (text.includes("r16-7")) return { label: "ROUND OF 16 • MATCH 7", aNum: 13, bNum: 14 };
  if (text.includes("r16-8")) return { label: "ROUND OF 16 • MATCH 8", aNum: 15, bNum: 16 };

  if (text.includes("qf1")) return { label: "QUARTERFINAL 1", aNum: 1, bNum: 2 };
  if (text.includes("qf2")) return { label: "QUARTERFINAL 2", aNum: 3, bNum: 4 };
  if (text.includes("qf3")) return { label: "QUARTERFINAL 3", aNum: 5, bNum: 6 };
  if (text.includes("qf4")) return { label: "QUARTERFINAL 4", aNum: 7, bNum: 8 };

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

  return { label: "QUARTERFINAL 1", aNum: 1, bNum: 2 };
}

function getMatchData() {
  const upNext = countdownData.upNext || {};

  if (upNext.teamA && upNext.teamB) {
    return {
      label: upNext.label || getRoundLabel(siteData.currentMatch),
      aName: upNext.teamA,
      bName: upNext.teamB
    };
  }

  return getMatchFromCurrent();
}

function getPlayersByTeam(teamNum, teamNameFallback) {
  const players = [];

  for (let i = 1; i <= 6; i++) {
    players.push({
      name: clean(siteData[`team${teamNum}Player${i}`], `Player ${i}`),
      rankImage: clean(siteData[`team${teamNum}Player${i}RankImage`], "")
    });
  }

  if (!teamNum) {
    for (let i = 1; i <= 6; i++) {
      players.push({
        name: `Player ${i}`,
        rankImage: ""
      });
    }
  }

  return players.slice(0, 6);
}

function renderPlayers(container, players, sideDelay = 0) {
  const visualOrder = [1, 0, 3, 5, 4, 2];

container.innerHTML = visualOrder.map((playerIndex) => {
  const player = players[playerIndex];
  const index = playerIndex;

    const rankHtml = player.rankImage
      ? `<img src="${player.rankImage}" alt="Peak Rank">`
      : `<div class="rank-placeholder">RG</div>`;

    return `
      <div class="player-card">
        <div class="player-rank">
          ${rankHtml}
        </div>

        <div class="player-info">
          <strong>${clean(player.name, `Player ${index + 1}`)}</strong>
          <small>${clean(player.name, `Player ${index + 1}`)} Peak Rank</small>
        </div>
      </div>
    `;
  }).join("");
}

function renderIntro() {
  const match = getMatchData();

  const aNum = match.aNum || findTeamNumberByName(match.aName);
  const bNum = match.bNum || findTeamNumberByName(match.bName);

  const aName = match.aName || teamName(aNum || 1);
  const bName = match.bName || teamName(bNum || 2);

  const currentMatch = siteData.currentMatch || `${match.label} • ${getFormat(match.label)}`;
  const format = getFormat(currentMatch);
  const round = match.label || getRoundLabel(currentMatch);

  introEvent.textContent = clean(siteData.eventName, "RIVALS GAUNTLET").toUpperCase();
  introRound.textContent = `${round} • ${format}`;
  teamAName.textContent = aName.toUpperCase();
  teamBName.textContent = bName.toUpperCase();
  matchFormat.textContent = format;
  introFooter.textContent = clean(countdownData.website, "RIVALSGAUNTLET.COM").toUpperCase();

  renderPlayers(teamAPlayers, getPlayersByTeam(aNum, aName), 0.8);
  renderPlayers(teamBPlayers, getPlayersByTeam(bNum, bName), 2.2);
}

siteRef.on("value", snapshot => {
  siteData = snapshot.val() || {};
  scheduleRenderIntro();
});

countdownRef.on("value", snapshot => {
  countdownData = snapshot.val() || {};
  scheduleRenderIntro();
});
