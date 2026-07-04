const siteRef = database.ref("site");
const countdownRef = database.ref("broadcastCountdown");
const predictionLocksRef = database.ref("predictionLocks");


function showToast(message = "✓ Saved", button = null) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");

  if (navigator.vibrate) navigator.vibrate(40);

  if (button) {
    const oldText = button.textContent;
    button.textContent = "✓ Saved";
    setTimeout(() => {
      button.textContent = oldText;
    }, 1400);
  }

  setTimeout(() => {
    toast.classList.remove("show");
  }, 2200);
}

let siteData = {};
let currentMatchId = "No Match Live";
let teamAScore = 0;
let teamBScore = 0;
let nextMatch = {
  label: "",
  teamA: "",
  teamB: ""
};

const matches = [
  "No Match Live",
  "R16-1 • Bo3",
  "R16-2 • Bo3",
  "R16-3 • Bo3",
  "R16-4 • Bo3",
  "R16-5 • Bo3",
  "R16-6 • Bo3",
  "R16-7 • Bo3",
  "R16-8 • Bo3",
  "QF1 • Bo3",
  "QF2 • Bo3",
  "QF3 • Bo3",
  "QF4 • Bo3",
  "SF1 • Bo3",
  "SF2 • Bo3",
  "Grand Finals • Bo5"
];

function clean(value, fallback = "") {
  return String(value || fallback).trim();
}

function getPredictionType(matchId) {
  return `match_${String(matchId || "")
    .replaceAll(" ", "_")
    .replaceAll("•", "")
    .replaceAll("-", "_")}`;
}

function getMatchConfig(matchId = currentMatchId) {
  const d = siteData;
  const is16 = (d.formatType || "8_single_elim") === "16_single_elim";

  const configs = {
    "R16-1 • Bo3": { label:"R16-1", a:d.team1 || "Team 1", b:d.team2 || "Team 2", scoreA:"r16m1Team1Score", scoreB:"r16m1Team2Score", winner:"r16m1Winner", max:2 },
    "R16-2 • Bo3": { label:"R16-2", a:d.team3 || "Team 3", b:d.team4 || "Team 4", scoreA:"r16m2Team1Score", scoreB:"r16m2Team2Score", winner:"r16m2Winner", max:2 },
    "R16-3 • Bo3": { label:"R16-3", a:d.team5 || "Team 5", b:d.team6 || "Team 6", scoreA:"r16m3Team1Score", scoreB:"r16m3Team2Score", winner:"r16m3Winner", max:2 },
    "R16-4 • Bo3": { label:"R16-4", a:d.team7 || "Team 7", b:d.team8 || "Team 8", scoreA:"r16m4Team1Score", scoreB:"r16m4Team2Score", winner:"r16m4Winner", max:2 },
    "R16-5 • Bo3": { label:"R16-5", a:d.team9 || "Team 9", b:d.team10 || "Team 10", scoreA:"r16m5Team1Score", scoreB:"r16m5Team2Score", winner:"r16m5Winner", max:2 },
    "R16-6 • Bo3": { label:"R16-6", a:d.team11 || "Team 11", b:d.team12 || "Team 12", scoreA:"r16m6Team1Score", scoreB:"r16m6Team2Score", winner:"r16m6Winner", max:2 },
    "R16-7 • Bo3": { label:"R16-7", a:d.team13 || "Team 13", b:d.team14 || "Team 14", scoreA:"r16m7Team1Score", scoreB:"r16m7Team2Score", winner:"r16m7Winner", max:2 },
    "R16-8 • Bo3": { label:"R16-8", a:d.team15 || "Team 15", b:d.team16 || "Team 16", scoreA:"r16m8Team1Score", scoreB:"r16m8Team2Score", winner:"r16m8Winner", max:2 },

    "QF1 • Bo3": { label:"QF1", a:is16 ? d.r16m1Winner || "Winner R16-1" : d.team1 || "Team 1", b:is16 ? d.r16m2Winner || "Winner R16-2" : d.team2 || "Team 2", scoreA:"qf1Team1Score", scoreB:"qf1Team2Score", winner:"qf1Winner", max:2 },
    "QF2 • Bo3": { label:"QF2", a:is16 ? d.r16m3Winner || "Winner R16-3" : d.team3 || "Team 3", b:is16 ? d.r16m4Winner || "Winner R16-4" : d.team4 || "Team 4", scoreA:"qf2Team1Score", scoreB:"qf2Team2Score", winner:"qf2Winner", max:2 },
    "QF3 • Bo3": { label:"QF3", a:is16 ? d.r16m5Winner || "Winner R16-5" : d.team5 || "Team 5", b:is16 ? d.r16m6Winner || "Winner R16-6" : d.team6 || "Team 6", scoreA:"qf3Team1Score", scoreB:"qf3Team2Score", winner:"qf3Winner", max:2 },
    "QF4 • Bo3": { label:"QF4", a:is16 ? d.r16m7Winner || "Winner R16-7" : d.team7 || "Team 7", b:is16 ? d.r16m8Winner || "Winner R16-8" : d.team8 || "Team 8", scoreA:"qf4Team1Score", scoreB:"qf4Team2Score", winner:"qf4Winner", max:2 },

    "SF1 • Bo3": { label:"SF1", a:d.qf1Winner || "Winner QF1", b:d.qf2Winner || "Winner QF2", scoreA:"sf1Team1Score", scoreB:"sf1Team2Score", winner:"sf1Winner", max:2 },
    "SF2 • Bo3": { label:"SF2", a:d.qf3Winner || "Winner QF3", b:d.qf4Winner || "Winner QF4", scoreA:"sf2Team1Score", scoreB:"sf2Team2Score", winner:"sf2Winner", max:2 },

    "Grand Finals • Bo5": { label:"Grand Finals", a:d.sf1Winner || "Winner SF1", b:d.sf2Winner || "Winner SF2", scoreA:"gfTeam1Score", scoreB:"gfTeam2Score", winner:"grandWinner", max:3 }
  };

  return configs[matchId] || null;
}

function getWinner(config) {
  if (!config) return "";

  if (teamAScore >= config.max && teamAScore > teamBScore) return config.a;
  if (teamBScore >= config.max && teamBScore > teamAScore) return config.b;

  return "";
}

function renderMatchOptions() {
  const select = document.getElementById("currentMatchSelect");
  select.innerHTML = matches.map(match => `
    <option value="${match}">${match}</option>
  `).join("");

  select.value = currentMatchId;
}

function renderCurrentMatch() {
  const config = getMatchConfig();

  if (!config) {
    document.getElementById("teamAName").textContent = "No Match";
    document.getElementById("teamBName").textContent = "Select Match";
    document.getElementById("teamAScore").textContent = "0";
    document.getElementById("teamBScore").textContent = "0";
    document.getElementById("winnerPreview").textContent = "—";
    return;
  }

  teamAScore = Number(siteData[config.scoreA] || 0);
  teamBScore = Number(siteData[config.scoreB] || 0);

  document.getElementById("teamAName").textContent = config.a;
  document.getElementById("teamBName").textContent = config.b;
  document.getElementById("teamAScore").textContent = teamAScore;
  document.getElementById("teamBScore").textContent = teamBScore;
  document.getElementById("winnerPreview").textContent = getWinner(config) || "Not decided";
}

function changeScore(side, amount) {
  const config = getMatchConfig();
  if (!config) return;

  if (side === "A") {
    teamAScore = Math.max(0, Math.min(config.max, teamAScore + amount));
  }

  if (side === "B") {
    teamBScore = Math.max(0, Math.min(config.max, teamBScore + amount));
  }

  document.getElementById("teamAScore").textContent = teamAScore;
  document.getElementById("teamBScore").textContent = teamBScore;
  document.getElementById("winnerPreview").textContent = getWinner(config) || "Not decided";
}

function saveCurrentResult() {
  const config = getMatchConfig();
  if (!config) return;

  const winner = getWinner(config);

  const updates = {
    currentMatch: currentMatchId,
    [config.scoreA]: String(teamAScore),
    [config.scoreB]: String(teamBScore)
  };

  if (winner) {
    updates[config.winner] = winner;
  }

  siteRef.update(updates).then(() => {
  const next = getAutoNextMatch();

  nextMatch = next;

  document.getElementById("nextLabel").textContent = next.label;
  document.getElementById("nextTeams").textContent =
    next.teamA && next.teamB
      ? `${next.teamA} vs ${next.teamB}`
      : "Tournament Complete";

  return countdownRef.update({
    upNext: {
      label: next.label,
      teamA: next.teamA,
      teamB: next.teamB
    }
  });
}).then(() => {
  showToast("✓ Result + Up Next Saved");
});
}

function getAutoNextMatch() {
  const match = currentMatchId;

  const order8 = [
    "QF1 • Bo3",
    "QF2 • Bo3",
    "QF3 • Bo3",
    "QF4 • Bo3",
    "SF1 • Bo3",
    "SF2 • Bo3",
    "Grand Finals • Bo5"
  ];

  const order16 = [
    "R16-1 • Bo3",
    "R16-2 • Bo3",
    "R16-3 • Bo3",
    "R16-4 • Bo3",
    "R16-5 • Bo3",
    "R16-6 • Bo3",
    "R16-7 • Bo3",
    "R16-8 • Bo3",
    ...order8
  ];

  const order = (siteData.formatType || "8_single_elim") === "16_single_elim" ? order16 : order8;
  const index = order.indexOf(match);
  const nextId = index >= 0 ? order[index + 1] : order[0];
  const config = getMatchConfig(nextId);

  if (!config) {
    return { label:"TOURNAMENT COMPLETE", teamA:"", teamB:"" };
  }

  return {
    label: config.label,
    teamA: config.a,
    teamB: config.b
  };
}

function autoGenerateNext() {
  nextMatch = getAutoNextMatch();

  document.getElementById("nextLabel").textContent = nextMatch.label;
  document.getElementById("nextTeams").textContent =
    nextMatch.teamA && nextMatch.teamB
      ? `${nextMatch.teamA} vs ${nextMatch.teamB}`
      : "Tournament Complete";
}

function saveNextMatch() {
  countdownRef.update({
    upNext: {
      label: nextMatch.label,
      teamA: nextMatch.teamA,
      teamB: nextMatch.teamB
    }
  }).then(() => {
    showToast("✓ Up Next Saved");
  });
}

function finishTournament() {
  nextMatch = {
    label: "NO MATCH",
    teamA: "",
    teamB: ""
  };

  document.getElementById("nextLabel").textContent = "NO MATCH";
  document.getElementById("nextTeams").textContent = "No upcoming match";

  countdownRef.update({
    upNext: nextMatch
  }).then(() => {
    showToast("✓ Tournament Complete");
  });
}

function startHubTimer(minutes) {
  const durationMs = minutes * 60 * 1000;

  countdownRef.update({
    hubEndTime: new Date(Date.now() + durationMs).toISOString(),
    hubDurationMs: durationMs
  });

  showToast(`✓ ${minutes} Min Break Started`);
}

function resetHubTimer() {
  countdownRef.update({
    hubEndTime: null,
    hubDurationMs: null
  });

  showToast("✓ Timer Reset");
}

document.getElementById("currentMatchSelect").addEventListener("change", e => {
  currentMatchId = e.target.value;
  renderCurrentMatch();
  autoGenerateNext();

  const next = getAutoNextMatch();
  const tournamentId = siteData.currentTournament || "open1";

  const currentPredictionId = getPredictionType(currentMatchId);

  const nextFullMatchId = matches.find(match => {
    const c = getMatchConfig(match);
    return c && c.label === next.label;
  });

  const nextPredictionId = getPredictionType(nextFullMatchId || next.label);

  const updates = {};

  updates[`site/currentMatch`] = currentMatchId;

  updates[`predictionLocks/${tournamentId}/${currentPredictionId}`] = {
    locked: true,
    matchId: currentMatchId,
    lockedAt: Date.now()
  };

  if (next.label !== "TOURNAMENT COMPLETE") {
    updates[`predictionLocks/${tournamentId}/${nextPredictionId}`] = null;

    updates[`broadcastCountdown/upNext`] = {
      label: next.label,
      teamA: next.teamA,
      teamB: next.teamB
    };
  }

  database.ref().update(updates).then(() => {
    showToast("✓ Current Match Live + Next Prediction Opened");
  });
});

siteRef.on("value", snapshot => {
  siteData = snapshot.val() || {};
  currentMatchId = siteData.currentMatch || "No Match Live";

  renderMatchOptions();
  renderCurrentMatch();

  document.getElementById("statusSelect").value = siteData.status || "● OFFLINE";

  autoGenerateNext();
});
