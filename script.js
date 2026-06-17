if (window.location.search.includes("reset=1")) {
  localStorage.removeItem("rivalsBracket");
}function pickMatch(match, winner, loser) {
  if (match === 1) {
    document.getElementById("semiA1").innerText = winner;
    document.getElementById("loserA1").innerText = loser;
  }

  if (match === 2) {
    document.getElementById("semiA2").innerText = winner;
    document.getElementById("loserA2").innerText = loser;
  }

  if (match === 3) {
    document.getElementById("semiB1").innerText = winner;
    document.getElementById("loserB1").innerText = loser;
  }

  if (match === 4) {
    document.getElementById("semiB2").innerText = winner;
    document.getElementById("loserB2").innerText = loser;
  }

  saveBracket();
}

document.getElementById("semiA1").onclick = function() {
  document.getElementById("finalA").innerText = this.innerText;
  saveBracket();
};

document.getElementById("semiA2").onclick = function() {
  document.getElementById("finalA").innerText = this.innerText;
  saveBracket();
};

document.getElementById("semiB1").onclick = function() {
  document.getElementById("finalB").innerText = this.innerText;
  saveBracket();
};

document.getElementById("semiB2").onclick = function() {
  document.getElementById("finalB").innerText = this.innerText;
  saveBracket();
};

document.getElementById("finalA").onclick = function() {
  document.getElementById("champion").innerText = "🏆 " + this.innerText;
  saveBracket();
};

document.getElementById("finalB").onclick = function() {
  document.getElementById("champion").innerText = "🏆 " + this.innerText;
  saveBracket();
};

function saveBracket() {
  const data = {};
  document.querySelectorAll(".team, .champion").forEach(el => {
    data[el.id || el.className] = el.innerText;
  });
  localStorage.setItem("rivalsBracket", JSON.stringify(data));
}

function loadBracket() {
  const saved = JSON.parse(localStorage.getItem("rivalsBracket"));
  if (!saved) return;

  document.querySelectorAll(".team, .champion").forEach(el => {
    const key = el.id || el.className;
    if (saved[key]) el.innerText = saved[key];
  });
}

loadBracket();
