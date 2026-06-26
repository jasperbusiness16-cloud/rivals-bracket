// Rivals Gauntlet Match Header Data

const overlayData = {
  teamA: "TEAM ALPHA",
  teamB: "TEAM BRAVO",
  scoreA: 0,
  scoreB: 0,
  matchInfo: "ROUND 1 • BEST OF 3"
};

document.getElementById("teamA").innerText = overlayData.teamA;
document.getElementById("teamB").innerText = overlayData.teamB;
document.getElementById("scoreA").innerText = overlayData.scoreA;
document.getElementById("scoreB").innerText = overlayData.scoreB;
document.getElementById("matchInfo").innerText = overlayData.matchInfo;
