const championsRef = database.ref("champions");
const siteRef = database.ref("site");
const donationsRef = database.ref("donations");

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

function findTeamNumberByName(name, siteData) {
  const target = clean(name).toLowerCase();

  for (let i = 1; i <= 16; i++) {
    const teamName = clean(siteData[`team${i}`]).toLowerCase();
    if (teamName === target) return i;
  }

  return null;
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

  
  champTeamName.textContent = teamName.toUpperCase();
  champEventName.textContent = eventName.toUpperCase();
  champDate.textContent = date.toUpperCase();
  champFinalScore.textContent = finalScore.toUpperCase();
  champPrizeWon.textContent = prizeWon.toUpperCase();
  champNumber.textContent = `CHAMPION #${count}`;

  champFooterText.textContent = "ETCHED INTO RIVALS GAUNTLET HISTORY";

  renderRoster(champion.players || []);

  requestAnimationFrame(() => {
    champStage.classList.remove("loading");
  });
}

Promise.all([
  championsRef.once("value"),
  siteRef.once("value"),
  donationsRef.once("value")
]).then(([championsSnap, siteSnap, donationsSnap]) => {
  const championsData = championsSnap.val();
  const siteData = siteSnap.val() || {};
  const donationsData = donationsSnap.val() || {};

const donationTotal = Object.values(donationsData).reduce((sum, donation) => {
  return sum + (Number(donation.amount) || 0);
}, 0);

const startingPrizePool =
  Number(String(siteData.startingPrizePool || "0").replace(/[^0-9.]/g, "")) || 0;

const calculatedPrizePool =
  `$${(startingPrizePool + donationTotal).toLocaleString("en-US")}`;
  const result = getLatestChampion(championsData);

  const grandWinner = clean(siteData.grandWinner, "");

  if (grandWinner) {
    const teamNum = findTeamNumberByName(grandWinner, siteData);

    const players = [];

    if (teamNum) {
      for (let i = 1; i <= 6; i++) {
        players.push({
          name: clean(siteData[`team${teamNum}Player${i}`], `Player ${i}`)
        });
      }
    }

    renderChampion({
      teamName: grandWinner,
      eventName: clean(siteData.eventName, "Rivals Gauntlet Open #1"),
      date: "Event Complete",
      finalScore: `${clean(siteData.gfTeam1Score, "0")} - ${clean(siteData.gfTeam2Score, "0")}`,
      prizeWon: calculatedPrizePool,
      players
    }, result ? result.count + 1 : 1);

    return;
  }

  if (result && result.latest) {
    renderChampion(result.latest, result.count);
    return;
  }

  renderChampion({
    teamName: "Champion Team",
    eventName: "Rivals Gauntlet Open #1",
    date: "Event Complete",
    finalScore: "Final",
    prizeWon: "Prize TBD",
    players: []
  }, 1);
});
