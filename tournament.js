const bracketContainer = document.getElementById("dynamicBracket");

let teams = {};
let winners = {};

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
    qf1Winner: data.qf1Winner || "Winner QF1",
    qf2Winner: data.qf2Winner || "Winner QF2",
    qf3Winner: data.qf3Winner || "Winner QF3",
    qf4Winner: data.qf4Winner || "Winner QF4",
    sf1Winner: data.sf1Winner || "Winner SF1",
    sf2Winner: data.sf2Winner || "Winner SF2",
    grandWinner: data.grandWinner || ""
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

function show8SingleElim() {
  bracketContainer.innerHTML = `
    <div class="pro-bracket">

      <div class="pro-round">
        <h3>Quarterfinals</h3>

        <div class="pro-match">
          <div class="match-label">QF1 • Bo3</div>
          <div class="team-row"><span>${teams.team1}</span><strong>0</strong></div>
          <div class="team-row"><span>${teams.team2}</span><strong>0</strong></div>
        </div>

        <div class="pro-match">
          <div class="match-label">QF2 • Bo3</div>
          <div class="team-row"><span>${teams.team3}</span><strong>0</strong></div>
          <div class="team-row"><span>${teams.team4}</span><strong>0</strong></div>
        </div>

        <div class="pro-match">
          <div class="match-label">QF3 • Bo3</div>
          <div class="team-row"><span>${teams.team5}</span><strong>0</strong></div>
          <div class="team-row"><span>${teams.team6}</span><strong>0</strong></div>
        </div>

        <div class="pro-match">
          <div class="match-label">QF4 • Bo3</div>
          <div class="team-row"><span>${teams.team7}</span><strong>0</strong></div>
          <div class="team-row"><span>${teams.team8}</span><strong>0</strong></div>
        </div>
      </div>

      <div class="pro-round">
        <h3>Semifinals</h3>

        <div class="pro-match semi-spacer">
          <div class="match-label">SF1 • Bo3</div>
          <div class="team-row"><span>${winners.qf1Winner}</span><strong>0</strong></div>
          <div class="team-row"><span>${winners.qf2Winner}</span><strong>0</strong></div>
        </div>

        <div class="pro-match semi-spacer">
          <div class="match-label">SF2 • Bo3</div>
          <div class="team-row"><span>${winners.qf3Winner}</span><strong>0</strong></div>
          <div class="team-row"><span>${winners.qf4Winner}</span><strong>0</strong></div>
        </div>
      </div>

      <div class="pro-round">
        <h3>Grand Finals</h3>

        <div class="pro-match grand-spacer grand-match">
          <div class="match-label">GF • Bo5</div>
          <div class="team-row"><span>${winners.sf1Winner}</span><strong>0</strong></div>
          <div class="team-row"><span>${winners.sf2Winner}</span><strong>0</strong></div>
        </div>

        ${winners.grandWinner ? `
          <div class="pro-match grand-match">
            <div class="match-label">CHAMPION</div>
            <div class="team-row"><span>${winners.grandWinner}</span><strong>🏆</strong></div>
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
