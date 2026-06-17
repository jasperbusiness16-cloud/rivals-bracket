function getLoser(winner, teamA, teamB) {
  if (winner === teamA) return teamB;
  if (winner === teamB) return teamA;
  return "";
}

function setOptions(selectId, teamA, teamB, label) {
  const select = document.getElementById(selectId);
  select.innerHTML = "";

  let defaultOption = document.createElement("option");
  defaultOption.text = label;
  select.add(defaultOption);

  if (teamA) {
    let optionA = document.createElement("option");
    optionA.text = teamA;
    select.add(optionA);
  }

  if (teamB) {
    let optionB = document.createElement("option");
    optionB.text = teamB;
    select.add(optionB);
  }
}

function match1() {
  const winner = document.getElementById("m1").value;
  const loser = getLoser(winner, "Team 1", "Team 2");
  document.getElementById("la1").innerText = loser;

  const semi = document.getElementById("semiA");
  setOptions("semiA", winner, semi.options[2]?.text || "", "Group A Final");
  saveBracket();
}

function match2() {
  const winner = document.getElementById("m2").value;
  const loser = getLoser(winner, "Team 3", "Team 4");
  document.getElementById("la2").innerText = loser;

  const semi = document.getElementById("semiA");
  setOptions("semiA", semi.options[1]?.text || "", winner, "Group A Final");
  saveBracket();
}

function match3() {
  const winner = document.getElementById("m3").value;
  const loser = getLoser(winner, "Team 5", "Team 6");
  document.getElementById("lb1").innerText = loser;

  const semi = document.getElementById("semiB");
  setOptions("semiB", winner, semi.options[2]?.text || "", "Group B Final");
  saveBracket();
}

function match4() {
  const winner = document.getElementById("m4").value;
  const loser = getLoser(winner, "Team 7", "Team 8");
  document.getElementById("lb2").innerText = loser;

  const semi = document.getElementById("semiB");
  setOptions("semiB", semi.options[1]?.text || "", winner, "Group B Final");
  saveBracket();
}

function semiA() {
  const winner = document.getElementById("semiA").value;
  const final = document.getElementById("final");
  setOptions("final", winner, final.options[2]?.text || "", "BO3 Finale");
  saveBracket();
}

function semiB() {
  const winner = document.getElementById("semiB").value;
  const final = document.getElementById("final");
  setOptions("final", final.options[1]?.text || "", winner, "BO3 Finale");
  saveBracket();
}

function finalWinner() {
  const winner = document.getElementById("final").value;
  document.getElementById("champion").innerText = "🏆 " + winner;
  saveBracket();
}

function saveBracket() {
  const data = {};
  document.querySelectorAll("select, .slot, .champion").forEach(el => {
    data[el.id] = el.value || el.innerText;
  });
  localStorage.setItem("rivalsBracket", JSON.stringify(data));
}
