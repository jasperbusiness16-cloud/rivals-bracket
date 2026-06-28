const championsRef = database.ref("champions");

const champStage = document.getElementById("champStage");
const champKicker = document.getElementById("champKicker");
const champTeamName = document.getElementById("champTeamName");
const champEventName = document.getElementById("champEventName");
const champDate = document.getElementById("champDate");
const champFinalScore = document.getElementById("champFinalScore");
const champPrizeWon = document.getElementById("champPrizeWon");
const champNumber = document.getElementById("champNumber");
const champRoster = document.getElementById("champRoster");
const champFooterText = document.getElementById("champFooterText");

function clean(value, fallback = "") {
  return String(value || fallback).trim();
}

function getLatestChampion(data) {
  if (!data) return null;

  const champions = Object.entries(data)
    .map(([id, champion]) => ({ id, ...champion }))
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

  return {
    latest: champions[0],
    count: champions.length
  };
}

function renderRoster(players = []) {
  const safePlayers = players.length
    ? players
    : [
        { name: "Player 1" },
        { name: "Player 2" },
        { name: "Player 3" },
        { name: "Player 4" },
        { name: "Player 5" },
        { name: "Player 6" }
      ];

  champRoster.innerHTML = safePlayers.slice(0, 6).map(player => `
    <div class="player-card">
      <strong>${clean(player.name, "Player")}</strong>
      <small>CHAMPION ROSTER</small>
    </div>
  `).join("");
}

function renderChampion(champion, count) {
  const teamName = clean(champion.teamName, "Champion Team");
  const eventName = clean(champion.eventName, "Rivals Gauntlet Open #1");
  const date = clean(champion.date, "Event Complete");
  const finalScore = clean(champion.finalScore, "Final");
  const prizeWon = clean(champion.prizeWon, "Prize TBD");

  champKicker.textContent = "YOUR RIVALS GAUNTLET";
  champTeamName.textContent = teamName.toUpperCase();
  champEventName.textContent = eventName.toUpperCase();
  champDate.textContent = date.toUpperCase();
  champFinalScore.textContent = finalScore.toUpperCase();
  champPrizeWon.textContent = prizeWon.toUpperCase();
  champNumber.textContent = `CHAMPION #${count}`;

  champFooterText.textContent =
    count === 1
      ? "THE FIRST RIVALS GAUNTLET CHAMPIONS"
      : "RIVALS GAUNTLET CHAMPIONS";

  renderRoster(champion.players || []);

  requestAnimationFrame(() => {
    champStage.classList.remove("loading");
  });
}

championsRef.once("value").then(snapshot => {
  const data = snapshot.val();
  const result = getLatestChampion(data);

  if (!result || !result.latest) {
    renderChampion({
      teamName: "Champion Team",
      eventName: "Rivals Gauntlet Open #1",
      date: "Event Complete",
      finalScore: "Final",
      prizeWon: "Prize TBD",
      players: []
    }, 1);

    return;
  }

  renderChampion(result.latest, result.count);
});
