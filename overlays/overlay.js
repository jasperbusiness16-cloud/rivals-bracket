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

function renderSeriesDots(containerId, score, winsNeeded) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = "";

  for (let i = 1; i <= winsNeeded; i++) {
    const dot = document.createElement("span");
    dot.className = i <= score ? "dot active" : "dot";
    container.appendChild(dot);
  }
}

function updateMatchHeader(data) {
  setText("teamA", data.teamA);
  setText("teamB", data.teamB);
  setText("teamAMeta", data.teamAMeta);
  setText("teamBMeta", data.teamBMeta);
  setText("scoreA", data.scoreA);
  setText("scoreB", data.scoreB);

  renderSeriesDots("seriesA", Number(data.scoreA), data.winsNeeded);
  renderSeriesDots("seriesB", Number(data.scoreB), data.winsNeeded);
}

updateMatchHeader(matchData);
