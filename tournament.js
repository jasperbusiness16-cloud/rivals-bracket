const bracketContainer = document.getElementById("dynamicBracket");

let teams = {};
let winners = {};
let scores = {};
let currentMatch = "";

database.ref("site").on("value", (snapshot) => {
  const data = snapshot.val();

  if (!data) return;

  currentMatch = (data.currentMatch || "").trim().toLowerCase();

  teams = {
  team1: data.team1 || "Team 1",
  team2: data.team2 || "Team 2",
  team3: data.team3 || "Team 3",
  team4: data.team4 || "Team 4",
  team5: data.team5 || "Team 5",
  team6: data.team6 || "Team 6",
  team7: data.team7 || "Team 7",
  team8: data.team8 || "Team 8",
  team9: data.team9 || "Team 9",
  team10: data.team10 || "Team 10",
  team11: data.team11 || "Team 11",
  team12: data.team12 || "Team 12",
  team13: data.team13 || "Team 13",
  team14: data.team14 || "Team 14",
  team15: data.team15 || "Team 15",
  team16: data.team16 || "Team 16"
};

  winners = {
    qf1Winner: data.qf1Winner || "",
    qf2Winner: data.qf2Winner || "",
    qf3Winner: data.qf3Winner || "",
    qf4Winner: data.qf4Winner || "",
    sf1Winner: data.sf1Winner || "",
    sf2Winner: data.sf2Winner || "",
    grandWinner: data.grandWinner || ""
  };

  scores = {
    qf1Team1Score: data.qf1Team1Score || "0",
    qf1Team2Score: data.qf1Team2Score || "0",
    qf2Team1Score: data.qf2Team1Score || "0",
    qf2Team2Score: data.qf2Team2Score || "0",
    qf3Team1Score: data.qf3Team1Score || "0",
    qf3Team2Score: data.qf3Team2Score || "0",
    qf4Team1Score: data.qf4Team1Score || "0",
    qf4Team2Score: data.qf4Team2Score || "0",

    sf1Team1Score: data.sf1Team1Score || "0",
    sf1Team2Score: data.sf1Team2Score || "0",
    sf2Team1Score: data.sf2Team1Score || "0",
    sf2Team2Score: data.sf2Team2Score || "0",
    gfTeam1Score: data.gfTeam1Score || "0",
    gfTeam2Score: data.gfTeam2Score || "0"
  };

  const formatType = data.formatType || "8_single_elim";

  if (formatType === "8_single_elim") {
    show8SingleElim();
  }

  if (formatType === "16_single_elim") {
    showComingSoon("16 Team Single Elimination");
  }

  if (formatType === "8_double_elim") {
    showComingSoon("8 Team Double Elimination");
  }
});

function rowClass(teamName, winnerName, hasWinner) {
  if (!hasWinner) return "";
  return teamName === winnerName ? "winner-row" : "loser-row";
}

function matchClass(matchId) {
  const match = currentMatch.toLowerCase();

  if (matchId === "QF1" && match.includes("qf1")) return "live-match";
  if (matchId === "QF2" && match.includes("qf2")) return "live-match";
  if (matchId === "QF3" && match.includes("qf3")) return "live-match";
  if (matchId === "QF4" && match.includes("qf4")) return "live-match";
  if (matchId === "SF1" && match.includes("sf1")) return "live-match";
  if (matchId === "SF2" && match.includes("sf2")) return "live-match";
  if (matchId === "GF" && match.includes("grand finals")) return "live-match";

  return "";
}

  

function show8SingleElim() {
  const qf1Done = winners.qf1Winner !== "";
  const qf2Done = winners.qf2Winner !== "";
  const qf3Done = winners.qf3Winner !== "";
  const qf4Done = winners.qf4Winner !== "";
  const sf1Done = winners.sf1Winner !== "";
  const sf2Done = winners.sf2Winner !== "";
  const grandDone = winners.grandWinner !== "";

  const sf1Team1 = winners.qf1Winner || "Winner QF1";
  const sf1Team2 = winners.qf2Winner || "Winner QF2";
  const sf2Team1 = winners.qf3Winner || "Winner QF3";
  const sf2Team2 = winners.qf4Winner || "Winner QF4";
  const gfTeam1 = winners.sf1Winner || "Winner SF1";
  const gfTeam2 = winners.sf2Winner || "Winner SF2";

  bracketContainer.innerHTML = `
    <div class="pro-bracket">

      <div class="pro-round">
        <h3>Quarterfinals</h3>

        <div class="pro-match ${matchClass("QF1")}">
          <div class="match-label">QF1 • Bo3</div>
          <div class="team-row ${rowClass(teams.team1, winners.qf1Winner, qf1Done)}"><span>${teams.team1}</span><strong>${scores.qf1Team1Score}</strong></div>
          <div class="team-row ${rowClass(teams.team2, winners.qf1Winner, qf1Done)}"><span>${teams.team2}</span><strong>${scores.qf1Team2Score}</strong></div>
        </div>

        <div class="pro-match ${matchClass("QF2")}">
          <div class="match-label">QF2 • Bo3</div>
          <div class="team-row ${rowClass(teams.team3, winners.qf2Winner, qf2Done)}"><span>${teams.team3}</span><strong>${scores.qf2Team1Score}</strong></div>
          <div class="team-row ${rowClass(teams.team4, winners.qf2Winner, qf2Done)}"><span>${teams.team4}</span><strong>${scores.qf2Team2Score}</strong></div>
        </div>

        <div class="pro-match ${matchClass("QF3")}">
          <div class="match-label">QF3 • Bo3</div>
          <div class="team-row ${rowClass(teams.team5, winners.qf3Winner, qf3Done)}"><span>${teams.team5}</span><strong>${scores.qf3Team1Score}</strong></div>
          <div class="team-row ${rowClass(teams.team6, winners.qf3Winner, qf3Done)}"><span>${teams.team6}</span><strong>${scores.qf3Team2Score}</strong></div>
        </div>

        <div class="pro-match ${matchClass("QF4")}">
          <div class="match-label">QF4 • Bo3</div>
          <div class="team-row ${rowClass(teams.team7, winners.qf4Winner, qf4Done)}"><span>${teams.team7}</span><strong>${scores.qf4Team1Score}</strong></div>
          <div class="team-row ${rowClass(teams.team8, winners.qf4Winner, qf4Done)}"><span>${teams.team8}</span><strong>${scores.qf4Team2Score}</strong></div>
        </div>
      </div>

      <div class="pro-round">
        <h3>Semifinals</h3>

        <div class="pro-match semi-spacer ${matchClass("SF1")}">
          <div class="match-label">SF1 • Bo3</div>
          <div class="team-row ${rowClass(sf1Team1, winners.sf1Winner, sf1Done)}"><span>${sf1Team1}</span><strong>${scores.sf1Team1Score}</strong></div>
          <div class="team-row ${rowClass(sf1Team2, winners.sf1Winner, sf1Done)}"><span>${sf1Team2}</span><strong>${scores.sf1Team2Score}</strong></div>
        </div>

        <div class="pro-match semi-spacer ${matchClass("SF2")}">
          <div class="match-label">SF2 • Bo3</div>
          <div class="team-row ${rowClass(sf2Team1, winners.sf2Winner, sf2Done)}"><span>${sf2Team1}</span><strong>${scores.sf2Team1Score}</strong></div>
          <div class="team-row ${rowClass(sf2Team2, winners.sf2Winner, sf2Done)}"><span>${sf2Team2}</span><strong>${scores.sf2Team2Score}</strong></div>
        </div>
      </div>

      <div class="pro-round">
        <h3>Grand Finals</h3>

        <div class="pro-match grand-spacer grand-match ${matchClass("GF")}">
          <div class="match-label">GF • Bo5</div>
          <div class="team-row ${rowClass(gfTeam1, winners.grandWinner, grandDone)}"><span>${gfTeam1}</span><strong>${scores.gfTeam1Score}</strong></div>
          <div class="team-row ${rowClass(gfTeam2, winners.grandWinner, grandDone)}"><span>${gfTeam2}</span><strong>${scores.gfTeam2Score}</strong></div>
        </div>

        ${winners.grandWinner ? `
  <div class="champion-banner">
    <div class="champion-title">🏆 Tournament Champion</div>
    <div class="champion-name">${winners.grandWinner}</div>
  </div>
` : ""}
      </div>

    </div>
  `;
}

function showComingSoon(formatName) {
  bracketContainer.innerHTML = `
    <div class="event-card">
      <h2>${formatName}</h2>
      <p>This bracket format is coming soon.</p>
    </div>
  `;
}
