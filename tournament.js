const bracketContainer = document.getElementById("dynamicBracket");

database.ref("site/formatType").on("value", (snapshot) => {
  const formatType = snapshot.val() || "8_single_elim";

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
          <div class="team-row"><span>Team 1</span><strong>0</strong></div>
          <div class="team-row"><span>Team 2</span><strong>0</strong></div>
        </div>

        <div class="pro-match">
          <div class="match-label">QF2 • Bo3</div>
          <div class="team-row"><span>Team 3</span><strong>0</strong></div>
          <div class="team-row"><span>Team 4</span><strong>0</strong></div>
        </div>

        <div class="pro-match">
          <div class="match-label">QF3 • Bo3</div>
          <div class="team-row"><span>Team 5</span><strong>0</strong></div>
          <div class="team-row"><span>Team 6</span><strong>0</strong></div>
        </div>

        <div class="pro-match">
          <div class="match-label">QF4 • Bo3</div>
          <div class="team-row"><span>Team 7</span><strong>0</strong></div>
          <div class="team-row"><span>Team 8</span><strong>0</strong></div>
        </div>
      </div>

      <div class="pro-round">
        <h3>Semifinals</h3>

        <div class="pro-match semi-spacer">
          <div class="match-label">SF1 • Bo3</div>
          <div class="team-row"><span>Winner QF1</span><strong>0</strong></div>
          <div class="team-row"><span>Winner QF2</span><strong>0</strong></div>
        </div>

        <div class="pro-match semi-spacer">
          <div class="match-label">SF2 • Bo3</div>
          <div class="team-row"><span>Winner QF3</span><strong>0</strong></div>
          <div class="team-row"><span>Winner QF4</span><strong>0</strong></div>
        </div>
      </div>

      <div class="pro-round">
        <h3>Grand Finals</h3>

        <div class="pro-match grand-spacer grand-match">
          <div class="match-label">GF • Bo5</div>
          <div class="team-row"><span>Winner SF1</span><strong>0</strong></div>
          <div class="team-row"><span>Winner SF2</span><strong>0</strong></div>
        </div>
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
