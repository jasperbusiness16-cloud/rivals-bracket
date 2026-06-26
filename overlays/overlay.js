const siteRef = database.ref("site");

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function renderSeries(containerId, score, winsNeeded) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = "";

  for (let i = 1; i <= winsNeeded; i++) {
    const piece = document.createElement("span");
    piece.className = i <= score ? "series-piece active" : "series-piece";
    container.appendChild(piece);
  }
}

function getMatchData(data) {
  const currentMatch = data.currentMatch || "No Match Live";
  const isBo5 = currentMatch.toLowerCase().includes("bo5");
  const winsNeeded = isBo5 ? 3 : 2;

  const matches = {
    "QF1": {
      teamA: data.team1 || "Team 1",
      teamB: data.team2 || "Team 2",
      scoreA: data.qf1Team1Score || 0,
      scoreB: data.qf1Team2Score || 0
    },
    "QF2": {
      teamA: data.team3 || "Team 3",
      teamB: data.team4 || "Team 4",
      scoreA: data.qf2Team1Score || 0,
      scoreB: data.qf2Team2Score || 0
    },
    "QF3": {
      teamA: data.team5 || "Team 5",
      teamB: data.team6 || "Team 6",
      scoreA: data.qf3Team1Score || 0,
      scoreB: data.qf3Team2Score || 0
    },
    "QF4": {
      teamA: data.team7 || "Team 7",
      teamB: data.team8 || "Team 8",
      scoreA: data.qf4Team1Score || 0,
      scoreB: data.qf4Team2Score || 0
    },
    "SF1": {
      teamA: data.qf1Winner || "Winner QF1",
      teamB: data.qf2Winner || "Winner QF2",
      scoreA: data.sf1Team1Score || 0,
      scoreB: data.sf1Team2Score || 0
    },
    "SF2": {
      teamA: data.qf3Winner || "Winner QF3",
      teamB: data.qf4Winner || "Winner QF4",
      scoreA: data.sf2Team1Score || 0,
      scoreB: data.sf2Team2Score || 0
    },
    "Grand Finals": {
      teamA: data.sf1Winner || "Winner SF1",
      teamB: data.sf2Winner || "Winner SF2",
      scoreA: data.gfTeam1Score || 0,
      scoreB: data.gfTeam2Score || 0
    }
  };

  const matchKey = Object.keys(matches).find(key =>
    currentMatch.includes(key)
  );

  const match = matches[matchKey] || {
    teamA: "RIVALS",
    teamB: "GAUNTLET",
    scoreA: 0,
    scoreB: 0
  };

  return {
    teamA: match.teamA,
    teamB: match.teamB,
    teamAMeta: currentMatch,
    teamBMeta: isBo5 ? "BEST OF 5" : "BEST OF 3",
    scoreA: Number(match.scoreA || 0),
    scoreB: Number(match.scoreB || 0),
    winsNeeded
  };
}

function updateMatchHeader(match) {
  setText("teamA", match.teamA.toUpperCase());
  setText("teamB", match.teamB.toUpperCase());
  setText("teamAMeta", match.teamAMeta);
  setText("teamBMeta", match.teamBMeta);
  setText("scoreA", match.scoreA);
  setText("scoreB", match.scoreB);

  renderSeries("seriesA", match.scoreA, match.winsNeeded);
  renderSeries("seriesB", match.scoreB, match.winsNeeded);
}

siteRef.on("value", (snapshot) => {
  const data = snapshot.val();
  if (!data) return;

  updateMatchHeader(getMatchData(data));
});
