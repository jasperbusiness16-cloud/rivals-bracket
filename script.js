let state = {};

const bracketRef = database.ref("rivalsBracketV2");

const slots = {
  A_R1_M1: ["Team 1", "Team 2"],
  A_R1_M2: ["Team 3", "Team 4"],
  B_R1_M1: ["Team 5", "Team 6"],
  B_R1_M2: ["Team 7", "Team 8"]
};

function getTeam(value) {
  if (!value) return "";

  if (value.startsWith("slot:")) {
    const id = value.replace("slot:", "");
    const el = document.getElementById(id);
    return el ? el.innerText : "";
  }

  return value;
}

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.innerText = text || "";
}

function pick(match, selected) {
  if (!window.IS_ADMIN) return;

  const winner = getTeam(selected);
  if (!winner) return;

  state[match] = winner;
  bracketRef.set(state);
}

function loserOf(match, teams) {
  const winner = state[match];
  if (!winner || !teams) return "";
  return teams.find(team => team && team !== winner) || "";
}

function advance() {
  clearAllGenerated();

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

  const aWinLoser = loserOf("A_WIN", [a1Winner, a2Winner]);
  const bWinLoser = loserOf("B_WIN", [b1Winner, b2Winner]);

  setText("A_FINAL_LOSE_T1", state.A_LOSE);
  setText("A_FINAL_LOSE_T2", aWinLoser);

  setText("B_FINAL_LOSE_T1", state.B_LOSE);
  setText("B_FINAL_LOSE_T2", bWinLoser);

  setText("A_SEMI_T1", state.A_WIN);
  setText("A_SEMI_T2", state.A_FINAL_LOSE);

  setText("B_SEMI_T1", state.B_WIN);
  setText("B_SEMI_T2", state.B_FINAL_LOSE);

  setText("GRAND_T1", state.A_SEMI);
  setText("GRAND_T2", state.B_SEMI);

if (state.GRAND) {
  setText("champion", "🏆 " + state.GRAND);
} else {
  setText("champion", "");
}
}

function clearAllGenerated() {
  [
    "A_WIN_T1", "A_WIN_T2", "A_LOSE_T1", "A_LOSE_T2",
    "A_FINAL_LOSE_T1", "A_FINAL_LOSE_T2", "A_SEMI_T1", "A_SEMI_T2",
    "B_WIN_T1", "B_WIN_T2", "B_LOSE_T1", "B_LOSE_T2",
    "B_FINAL_LOSE_T1", "B_FINAL_LOSE_T2", "B_SEMI_T1", "B_SEMI_T2",
    "GRAND_T1", "GRAND_T2"
  ].forEach(id => setText(id, ""));
}

function resetTournament() {
  if (!window.IS_ADMIN) return;

  const confirmReset = confirm("Reset the entire tournament?");
  if (!confirmReset) return;

  bracketRef.set({});
}

bracketRef.on("value", snapshot => {
  state = snapshot.val() || {};
  advance();
});
window.resetTournament = function () {
  if (!window.IS_ADMIN) return;

  if (!confirm("Reset the entire tournament?")) return;

  bracketRef.set({});
};
