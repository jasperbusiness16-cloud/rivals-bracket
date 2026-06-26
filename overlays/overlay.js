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

  return {
    teamA: data.team1 || "TEAM ALPHA",
    teamB: data.team2 || "TEAM BRAVO",
    teamAMeta: currentMatch,
    teamBMeta: isBo5 ? "BEST OF 5" : "BEST OF 3",
    scoreA: Number(data.qf1Team1Score || 0),
    scoreB: Number(data.qf1Team2Score || 0),
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
