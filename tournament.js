const bracketContainer = document.getElementById("dynamicBracket");

let teams = {};
let winners = {};
let scores = {};

database.ref("site").on("value", (snapshot) => {
  const data = snapshot.val();

  if (!data) return;

  teams = {
    team1: data.team1 || "Team 1",
    team2: data.team2 || "Team 2",
    team3: data.team3 || "Team 3",
    team4: data.team4 || "Team 4",
    team5: data.team5 || "Team 5",
    team6: data.team6 || "Team 6",
    team7: data.team7 || "Team 7",
    team8: data.team8 || "Team 8"
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
    qf4Team2Score: data.qf4Team2Score || "0"
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

function show8SingleElim() {
  const qf1Done = winners.qf1Winner !== "";
  const qf2Done = winners.qf2Winner !== "";
  const qf3Done = winners.qf3Winner !== "";
  const qf4Done = winners.qf4Winner !== "";
  const sf1Done = winners.sf1Winner !== "";
  const sf2Done = winners.sf2Winner !== "";
  const grandDone = winners.grandWinner !== "";

  bracketContainer.innerHTML = `
    <div class="pro-bracket">

      <div class="pro-round">
        <h3>Quarterfinals</h3>

        <div class="pro-match">
          <div class="match-label">QF1 • Bo3</div>
          <div class="team-row ${rowClass(teams.team1, winners.qf1Winner, qf1Done)}"><span>${teams.team1}</span><strong>${scores.qf1Team1Score}</strong></div>
          <div class="team-row ${rowClass(teams.team2, winners.qf1Winner, qf1Done)}"><span>${teams.team2}</span><strong>${scores.qf1Team2Score}</strong></div>
        </div>

        <div class="pro-match">
          <div class="match-label">QF2 • Bo3</div>
          <div class="team-row ${rowClass(teams.team3, winners.qf2Winner, qf2Done)}"><span>${teams.team3}</span><strong>${scores.qf2Team1Score}</strong></div>
          <div class="team-row ${rowClass(teams.team4, winners.qf2Winner, qf2Done)}"><span>${teams.team4}</span><strong>${scores.qf2Team2Score}</strong></div>
        </div>

        <div class="pro-match">
          <div class="match-label">QF3 • Bo3</div>
          <div class="team-row ${rowClass(teams.team5, winners.qf3Winner, qf3Done)}"><span>${teams.team5}</span><strong>${scores.qf3Team1Score}</strong></div>
          <div class="team-row ${rowClass(teams.team6, winners.qf3Winner, qf3Done)}"><span>${teams.team6}</span><strong>${scores.qf3Team2Score}</strong></div>
        </div>

        <div class="pro-match">
          <div class="match-label">QF4 • Bo3</div>
          <div class="team-row ${rowClass(teams.team7, winners.qf4Winner, qf4Done)}"><span>${teams.team7}</span><strong>${scores.qf4Team1Score}</strong></div>
          <div class="team-row ${rowClass(teams.team8, winners.qf4Winner, qf4Done)}"><span>${teams.team8}</span><strong>${scores.qf4Team2Score}</strong></div>
        </div>
      </div>

      <div class="pro-round">
        <h3>Semifinals</h3>

        <div class="pro-match semi-spacer">
          <div class="match-label">SF1 • Bo3</div>
          <div class="team-row ${rowClass(winners.qf1Winner || "Winner QF1", winners.sf1Winner, sf1Done)}"><span>${winners.qf1Winner || "Winner QF1"}</span><strong>0</strong></div>
          <div class="team-row ${rowClass(winners.qf2Winner || "Winner QF2", winners.sf1Winner, sf1Done)}"><span>${winners.qf2Winner || "Winner QF2"}</span><strong>0</strong></div>
        </div>

        <div class="pro-match semi-spacer">
          <div class="match-label">SF2 • Bo3</div>
          <div class="team-row ${rowClass(winners.qf3Winner || "Winner QF3", winners.sf2Winner, sf2Done)}"><span>${winners.qf3Winner || "Winner QF3"}</span><strong>0</strong></div>
          <div class="team-row ${rowClass(winners.qf4Winner || "Winner QF4", winners.sf2Winner, sf2Done)}"><span>${winners.qf4Winner || "Winner QF4"}</span><strong>0</strong></div>
        </div>
      </div>

      <div class="pro-round">
        <h3>Grand Finals</h3>

        <div class="pro-match grand-spacer grand-match">
          <div class="match-label">GF • Bo5</div>
          <div class="team-row ${rowClass(winners.sf1Winner || "Winner SF1", winners.grandWinner, grandDone)}"><span>${winners.sf1Winner || "Winner SF1"}</span><strong>0</strong></div>
          <div class="team-row ${rowClass(winners.sf2Winner || "Winner SF2", winners.grandWinner, grandDone)}"><span>${winners.sf2Winner || "Winner SF2"}</span><strong>0</strong></div>
        </div>

        ${winners.grandWinner ? `
          <div class="pro-match grand-match">
            <div class="match-label">CHAMPION</div>
            <div class="team-row winner-row"><span>${winners.grandWinner}</span><strong>🏆</strong></div>
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
