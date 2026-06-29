const siteRef = database.ref("site");

const advanceStage = document.getElementById("advanceStage");
const advanceTeam = document.getElementById("advanceTeam");
const advanceDestination = document.getElementById("advanceDestination");

function clean(value, fallback = "") {
  return String(value || fallback).trim();
}

function scoreWinner(teamA, teamB, scoreA, scoreB, savedWinner, bestOf = 3) {
  const a = Number(scoreA);
  const b = Number(scoreB);

  if (scoreA === "" || scoreB === "") return savedWinner || "";
  if (Number.isNaN(a) || Number.isNaN(b)) return savedWinner || "";
  if (a === b) return savedWinner || "";

  const winsNeeded = bestOf === 5 ? 3 : 2;
  if (a < winsNeeded && b < winsNeeded) return savedWinner || "";

  return a > b ? teamA : teamB;
}

function getAdvancement(data) {
  const match = clean(data.currentMatch).toLowerCase();

  const teams = {};
  for (let i = 1; i <= 16; i++) {
    teams[`team${i}`] = clean(data[`team${i}`], `Team ${i}`);
  }

  const map = [
    { key:"r16-1", winner:data.r16m1Winner, a:teams.team1, b:teams.team2, sa:data.r16m1Team1Score, sb:data.r16m1Team2Score, dest:"TO QUARTERFINAL 1" },
    { key:"r16-2", winner:data.r16m2Winner, a:teams.team3, b:teams.team4, sa:data.r16m2Team1Score, sb:data.r16m2Team2Score, dest:"TO QUARTERFINAL 1" },
    { key:"r16-3", winner:data.r16m3Winner, a:teams.team5, b:teams.team6, sa:data.r16m3Team1Score, sb:data.r16m3Team2Score, dest:"TO QUARTERFINAL 2" },
    { key:"r16-4", winner:data.r16m4Winner, a:teams.team7, b:teams.team8, sa:data.r16m4Team1Score, sb:data.r16m4Team2Score, dest:"TO QUARTERFINAL 2" },
    { key:"r16-5", winner:data.r16m5Winner, a:teams.team9, b:teams.team10, sa:data.r16m5Team1Score, sb:data.r16m5Team2Score, dest:"TO QUARTERFINAL 3" },
    { key:"r16-6", winner:data.r16m6Winner, a:teams.team11, b:teams.team12, sa:data.r16m6Team1Score, sb:data.r16m6Team2Score, dest:"TO QUARTERFINAL 3" },
    { key:"r16-7", winner:data.r16m7Winner, a:teams.team13, b:teams.team14, sa:data.r16m7Team1Score, sb:data.r16m7Team2Score, dest:"TO QUARTERFINAL 4" },
    { key:"r16-8", winner:data.r16m8Winner, a:teams.team15, b:teams.team16, sa:data.r16m8Team1Score, sb:data.r16m8Team2Score, dest:"TO QUARTERFINAL 4" },

    { key:"qf1", winner:data.qf1Winner, a:teams.team1, b:teams.team2, sa:data.qf1Team1Score, sb:data.qf1Team2Score, dest:"TO SEMIFINAL 1" },
    { key:"qf2", winner:data.qf2Winner, a:teams.team3, b:teams.team4, sa:data.qf2Team1Score, sb:data.qf2Team2Score, dest:"TO SEMIFINAL 1" },
    { key:"qf3", winner:data.qf3Winner, a:teams.team5, b:teams.team6, sa:data.qf3Team1Score, sb:data.qf3Team2Score, dest:"TO SEMIFINAL 2" },
    { key:"qf4", winner:data.qf4Winner, a:teams.team7, b:teams.team8, sa:data.qf4Team1Score, sb:data.qf4Team2Score, dest:"TO SEMIFINAL 2" },

    { key:"sf1", winner:data.sf1Winner, a:data.qf1Winner || "Winner QF1", b:data.qf2Winner || "Winner QF2", sa:data.sf1Team1Score, sb:data.sf1Team2Score, dest:"TO GRAND FINALS" },
    { key:"sf2", winner:data.sf2Winner, a:data.qf3Winner || "Winner QF3", b:data.qf4Winner || "Winner QF4", sa:data.sf2Team1Score, sb:data.sf2Team2Score, dest:"TO GRAND FINALS" },

    { key:"grand", winner:data.grandWinner, a:data.sf1Winner || "Winner SF1", b:data.sf2Winner || "Winner SF2", sa:data.gfTeam1Score, sb:data.gfTeam2Score, dest:"TOURNAMENT CHAMPIONS", bestOf:5 }
  ];

  const item = map.find(m => match.includes(m.key));

  if (!item) {
    return { team: "WINNING TEAM", destination: "ADVANCES" };
  }

  const winner = scoreWinner(
    clean(item.a),
    clean(item.b),
    clean(item.sa, ""),
    clean(item.sb, ""),
    clean(item.winner, ""),
    item.bestOf || 3
  );

  return {
    team: winner || clean(item.winner, "WINNING TEAM"),
    destination: item.dest
  };
}

siteRef.once("value").then(snapshot => {
  const data = snapshot.val() || {};
  const result = getAdvancement(data);

  advanceTeam.textContent = result.team.toUpperCase();
  advanceDestination.textContent = result.destination.toUpperCase();

  requestAnimationFrame(() => {
    advanceStage.classList.remove("loading");
  });
});
