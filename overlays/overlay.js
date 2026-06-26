const matchData = {
  teamA: "TEAM ALPHA",
  teamB: "TEAM BRAVO",
  teamAMeta: "#1 SEED",
  teamBMeta: "#4 SEED",
  scoreA: 0,
  scoreB: 0,
  winsNeeded: 2
};

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

function updateMatchHeader(data) {
  setText("teamA", data.teamA);
  setText("teamB", data.teamB);
  setText("teamAMeta", data.teamAMeta);
  setText("teamBMeta", data.teamBMeta);
  setText("scoreA", data.scoreA);
  setText("scoreB", data.scoreB);

  renderSeries("seriesA", Number(data.scoreA), data.winsNeeded);
  renderSeries("seriesB", Number(data.scoreB), data.winsNeeded);
}

updateMatchHeader(matchData);
