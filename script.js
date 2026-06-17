if (window.location.search.includes("reset=1")) {
  localStorage.removeItem("rivalsBracketV2");
}

const slots = {
  A_R1_M1: ["Team 1", "Team 2"],
  A_R1_M2: ["Team 3", "Team 4"],
  B_R1_M1: ["Team 5", "Team 6"],
  B_R1_M2: ["Team 7", "Team 8"],
};

const state = JSON.parse(localStorage.getItem("rivalsBracketV2")) || {};

function getTeam(value) {
  if (value.startsWith("slot:")) {
    return document.getElementById(value.replace("slot:", "")).innerText;
  }
  return value;
}

function setText(id, text) {
  document.getElementById(id).innerText = text || "";
}

function clearText(id) {
  document.getElementById(id).innerText = "";
}

function pick(match, selected) {
  const winner = getTeam(selected);
  if (!winner) return;

  state[match] = winner;
  advance();
  save();
}

function loserOf(match, teams) {
  const winner = state[match];
  if (!winner) return "";
  return teams.find(team => team !== winner) || "";
}

function advance() {
  clearAllGenerated();

  // Round 1 winners/losers
  const a1Winner = state.A_R1_M1;
  const a2Winner = state.A_R1_M2;
  const b1Winner = state.B_R1_M1;
  const b2Winner = state.B_R1_M2;

  const a1Loser = loserOf("A_R1_M1", slots.A_R1_M1);
  const a2Loser = loserOf("A_R1_M2", slots.A_R1_M2);
  const b1Loser = loserOf("B_R1_M1", slots.B_R1_M1);
  const b2Loser = loserOf("B_R1_M2", slots.B_R1_M2);

  setText("A_WIN_T1", a1Winner);
  setText("A_WIN_T2", a2Winner);
  setText("A_LOSE_T1", a1Loser);
  setText("A_LOSE_T2", a2Loser);

  setText("B_WIN_T1", b1Winner);
  setText("B_WIN_T2", b2Winner);
  setText("B_LOSE_T1", b1Loser);
  setText("B_LOSE_T2", b2Loser);

  // Winners match losers drop to final losers match
  const aWinLoser = loserOf("A_WIN", [a1Winner, a2Winner]);
  const bWinLoser = loserOf("B_WIN", [b1Winner, b2Winner]);

  const aLoseWinner = state.A_LOSE;
  const bLoseWinner = state.B_LOSE;

  setText("A_FINAL_LOSE_T1", aLoseWinner);
  setText("A_FINAL_LOSE_T2", aWinLoser);

  setText("B_FINAL_LOSE_T1", bLoseWinner);
  setText("B_FINAL_LOSE_T2", bWinLoser);

  // Semi final
  const aWinWinner = state.A_WIN;
  const bWinWinner = state.B_WIN;

  const aFinalLoseWinner = state.A_FINAL_LOSE;
  const bFinalLoseWinner = state.B_FINAL_LOSE;

  setText("A_SEMI_T1", aWinWinner);
  setText("A_SEMI_T2", aFinalLoseWinner);

  setText("B_SEMI_T1", bWinWinner);
  setText("B_SEMI_T2", bFinalLoseWinner);

  // Grand final
  setText("GRAND_T1", state.A_SEMI);
  setText("GRAND_T2", state.B_SEMI);

  if (state.GRAND) {
    setText("champion", "🏆 " + state.GRAND);
  }
}

function clearAllGenerated() {
  [
    "A_WIN_T1","A_WIN_T2","A_LOSE_T1","A_LOSE_T2",
    "A_FINAL_LOSE_T1","A_FINAL_LOSE_T2","A_SEMI_T1","A_SEMI_T2",
    "B_WIN_T1","B_WIN_T2","B_LOSE_T1","B_LOSE_T2",
    "B_FINAL_LOSE_T1","B_FINAL_LOSE_T2","B_SEMI_T1","B_SEMI_T2",
    "GRAND_T1","GRAND_T2"
  ].forEach(id => clearText(id));

  setText("champion", "Champion");
}

function save() {
  localStorage.setItem("rivalsBracketV2", JSON.stringify(state));
}

advance();
