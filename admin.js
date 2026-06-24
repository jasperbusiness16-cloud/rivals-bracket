const siteRef = database.ref("site");

siteRef.on("value", (snapshot) => {
  const data = snapshot.val();
  if (!data) return;

  document.getElementById("eventName").value = data.eventName || "";
  document.getElementById("prizePool").value = data.prizePool || "";
  document.getElementById("startingPrizePool").value = data.startingPrizePool || "";
  document.getElementById("communityDonations").value = data.communityDonations || "";
  document.getElementById("donationGoal").value = data.donationGoal || "$250";
  document.getElementById("registrationStatus").value = data.registrationStatus || "";
  document.getElementById("countdownDate").value = data.countdownDate || "";
  document.getElementById("status").value = data.status || "";
  document.getElementById("currentMatch").value = data.currentMatch || "";
  document.getElementById("totalPayout").value = data.totalPayout || "";
  document.getElementById("eventsHosted").value = data.eventsHosted || "";
  document.getElementById("formatType").value = data.formatType || "8_single_elim";
const is16Team = (data.formatType || "8_single_elim") === "16_single_elim";

document.getElementById("r16AdminSection").style.display =
  is16Team ? "block" : "none";

document.getElementById("extraTeamsSection").style.display =
  is16Team ? "block" : "none";

  
  document.getElementById("team1").value = data.team1 || "";
  document.getElementById("team2").value = data.team2 || "";
  document.getElementById("team3").value = data.team3 || "";
  document.getElementById("team4").value = data.team4 || "";
  document.getElementById("team5").value = data.team5 || "";
  document.getElementById("team6").value = data.team6 || "";
  document.getElementById("team7").value = data.team7 || "";
  document.getElementById("team8").value = data.team8 || "";
  document.getElementById("team9").value = data.team9 || "";
document.getElementById("team10").value = data.team10 || "";
document.getElementById("team11").value = data.team11 || "";
document.getElementById("team12").value = data.team12 || "";
document.getElementById("team13").value = data.team13 || "";
document.getElementById("team14").value = data.team14 || "";
document.getElementById("team15").value = data.team15 || "";
document.getElementById("team16").value = data.team16 || "";
document.getElementById("r16m1Team1Label").innerText = `${data.team1 || "Team 1"} Score`;
document.getElementById("r16m1Team2Label").innerText = `${data.team2 || "Team 2"} Score`;

document.getElementById("r16m2Team1Label").innerText = `${data.team3 || "Team 3"} Score`;
document.getElementById("r16m2Team2Label").innerText = `${data.team4 || "Team 4"} Score`;

document.getElementById("r16m3Team1Label").innerText = `${data.team5 || "Team 5"} Score`;
document.getElementById("r16m3Team2Label").innerText = `${data.team6 || "Team 6"} Score`;

document.getElementById("r16m4Team1Label").innerText = `${data.team7 || "Team 7"} Score`;
document.getElementById("r16m4Team2Label").innerText = `${data.team8 || "Team 8"} Score`;

document.getElementById("r16m5Team1Label").innerText = `${data.team9 || "Team 9"} Score`;
document.getElementById("r16m5Team2Label").innerText = `${data.team10 || "Team 10"} Score`;

document.getElementById("r16m6Team1Label").innerText = `${data.team11 || "Team 11"} Score`;
document.getElementById("r16m6Team2Label").innerText = `${data.team12 || "Team 12"} Score`;

document.getElementById("r16m7Team1Label").innerText = `${data.team13 || "Team 13"} Score`;
document.getElementById("r16m7Team2Label").innerText = `${data.team14 || "Team 14"} Score`;

document.getElementById("r16m8Team1Label").innerText = `${data.team15 || "Team 15"} Score`;
document.getElementById("r16m8Team2Label").innerText = `${data.team16 || "Team 16"} Score`;
  
  const sf1Team1 = data.qf1Winner || "SF1 Team 1";
  const sf1Team2 = data.qf2Winner || "SF1 Team 2";
  const sf2Team1 = data.qf3Winner || "SF2 Team 1";
  const sf2Team2 = data.qf4Winner || "SF2 Team 2";
  const gfTeam1 = data.sf1Winner || "GF Team 1";
  const gfTeam2 = data.sf2Winner || "GF Team 2";

  document.getElementById("qf1Team1Label").innerText = `${data.team1 || "Team 1"} Score`;
  document.getElementById("qf1Team2Label").innerText = `${data.team2 || "Team 2"} Score`;
  document.getElementById("qf2Team1Label").innerText = `${data.team3 || "Team 3"} Score`;
  document.getElementById("qf2Team2Label").innerText = `${data.team4 || "Team 4"} Score`;
  document.getElementById("qf3Team1Label").innerText = `${data.team5 || "Team 5"} Score`;
  document.getElementById("qf3Team2Label").innerText = `${data.team6 || "Team 6"} Score`;
  document.getElementById("qf4Team1Label").innerText = `${data.team7 || "Team 7"} Score`;
  document.getElementById("qf4Team2Label").innerText = `${data.team8 || "Team 8"} Score`;

  document.getElementById("sf1Team1Label").innerText = `${sf1Team1} Score`;
  document.getElementById("sf1Team2Label").innerText = `${sf1Team2} Score`;
  document.getElementById("sf2Team1Label").innerText = `${sf2Team1} Score`;
  document.getElementById("sf2Team2Label").innerText = `${sf2Team2} Score`;
  document.getElementById("gfTeam1Label").innerText = `${gfTeam1} Score`;
  document.getElementById("gfTeam2Label").innerText = `${gfTeam2} Score`;


  for (let i = 1; i <= 8; i++) {
  document.getElementById(`r16m${i}Team1Score`).value = data[`r16m${i}Team1Score`] || "";
  document.getElementById(`r16m${i}Team2Score`).value = data[`r16m${i}Team2Score`] || "";
}
  document.getElementById("qf1Team1Score").value = data.qf1Team1Score || "";
  document.getElementById("qf1Team2Score").value = data.qf1Team2Score || "";
  document.getElementById("qf2Team1Score").value = data.qf2Team1Score || "";
  document.getElementById("qf2Team2Score").value = data.qf2Team2Score || "";
  document.getElementById("qf3Team1Score").value = data.qf3Team1Score || "";
  document.getElementById("qf3Team2Score").value = data.qf3Team2Score || "";
  document.getElementById("qf4Team1Score").value = data.qf4Team1Score || "";
  document.getElementById("qf4Team2Score").value = data.qf4Team2Score || "";

  document.getElementById("sf1Team1Score").value = data.sf1Team1Score || "";
  document.getElementById("sf1Team2Score").value = data.sf1Team2Score || "";
  document.getElementById("sf2Team1Score").value = data.sf2Team1Score || "";
  document.getElementById("sf2Team2Score").value = data.sf2Team2Score || "";
  document.getElementById("gfTeam1Score").value = data.gfTeam1Score || "";
  document.getElementById("gfTeam2Score").value = data.gfTeam2Score || "";


  const r16Options = [
  [data.team1 || "Team 1", data.team2 || "Team 2"],
  [data.team3 || "Team 3", data.team4 || "Team 4"],
  [data.team5 || "Team 5", data.team6 || "Team 6"],
  [data.team7 || "Team 7", data.team8 || "Team 8"],
  [data.team9 || "Team 9", data.team10 || "Team 10"],
  [data.team11 || "Team 11", data.team12 || "Team 12"],
  [data.team13 || "Team 13", data.team14 || "Team 14"],
  [data.team15 || "Team 15", data.team16 || "Team 16"]
];

for (let i = 1; i <= 8; i++) {
  fillWinnerDropdown(
    `r16m${i}Winner`,
    r16Options[i - 1],
    data[`r16m${i}Winner`]
  );
}
  const is16Team = (data.formatType || "8_single_elim") === "16_single_elim";

const qf1Options = is16Team
  ? [data.r16m1Winner || "Winner R16-1", data.r16m2Winner || "Winner R16-2"]
  : [data.team1 || "Team 1", data.team2 || "Team 2"];

const qf2Options = is16Team
  ? [data.r16m3Winner || "Winner R16-3", data.r16m4Winner || "Winner R16-4"]
  : [data.team3 || "Team 3", data.team4 || "Team 4"];

const qf3Options = is16Team
  ? [data.r16m5Winner || "Winner R16-5", data.r16m6Winner || "Winner R16-6"]
  : [data.team5 || "Team 5", data.team6 || "Team 6"];

const qf4Options = is16Team
  ? [data.r16m7Winner || "Winner R16-7", data.r16m8Winner || "Winner R16-8"]
  : [data.team7 || "Team 7", data.team8 || "Team 8"];
  const sf1Options = [
    data.qf1Winner || "Winner QF1",
    data.qf2Winner || "Winner QF2"
  ];

  const sf2Options = [
    data.qf3Winner || "Winner QF3",
    data.qf4Winner || "Winner QF4"
  ];

  const grandOptions = [
    data.sf1Winner || "Winner SF1",
    data.sf2Winner || "Winner SF2"
  ];

  fillWinnerDropdown("qf1Winner", qf1Options, data.qf1Winner);
  fillWinnerDropdown("qf2Winner", qf2Options, data.qf2Winner);
  fillWinnerDropdown("qf3Winner", qf3Options, data.qf3Winner);
  fillWinnerDropdown("qf4Winner", qf4Options, data.qf4Winner);
  fillWinnerDropdown("sf1Winner", sf1Options, data.sf1Winner);
  fillWinnerDropdown("sf2Winner", sf2Options, data.sf2Winner);
  fillWinnerDropdown("grandWinner", grandOptions, data.grandWinner);
});

function fillWinnerDropdown(id, teams, selectedValue) {
  const select = document.getElementById(id);
  if (!select) return;

  select.innerHTML = "";

  const blank = document.createElement("option");
  blank.value = "";
  blank.textContent = "-- Select Winner --";
  select.appendChild(blank);

  teams.forEach(team => {
    const option = document.createElement("option");
    option.value = team;
    option.textContent = team;
    select.appendChild(option);
  });

  select.value = selectedValue || "";
}

function scoreWinner(teamA, teamB, scoreA, scoreB, fallbackWinner) {
  const a = Number(scoreA);
  const b = Number(scoreB);

  if (scoreA === "" || scoreB === "") return fallbackWinner || "";
  if (Number.isNaN(a) || Number.isNaN(b)) return fallbackWinner || "";
  if (a === b) return fallbackWinner || "";

  return a > b ? teamA : teamB;
}

function saveSiteData() {
  const team1 = document.getElementById("team1").value || "Team 1";
const team2 = document.getElementById("team2").value || "Team 2";
const team3 = document.getElementById("team3").value || "Team 3";
const team4 = document.getElementById("team4").value || "Team 4";
const team5 = document.getElementById("team5").value || "Team 5";
const team6 = document.getElementById("team6").value || "Team 6";
const team7 = document.getElementById("team7").value || "Team 7";
const team8 = document.getElementById("team8").value || "Team 8";
const team9 = document.getElementById("team9").value || "Team 9";
const team10 = document.getElementById("team10").value || "Team 10";
const team11 = document.getElementById("team11").value || "Team 11";
const team12 = document.getElementById("team12").value || "Team 12";
const team13 = document.getElementById("team13").value || "Team 13";
const team14 = document.getElementById("team14").value || "Team 14";
const team15 = document.getElementById("team15").value || "Team 15";
const team16 = document.getElementById("team16").value || "Team 16";


  const r16Winners = [];

for (let i = 1; i <= 8; i++) {
  const teamA = document.getElementById(`team${i * 2 - 1}`).value;
  const teamB = document.getElementById(`team${i * 2}`).value;

  const winner = scoreWinner(
    teamA,
    teamB,
    document.getElementById(`r16m${i}Team1Score`).value,
    document.getElementById(`r16m${i}Team2Score`).value,
    document.getElementById(`r16m${i}Winner`).value
  );

  r16Winners.push(winner);
}
  const qf1Winner = scoreWinner(
    team1,
    team2,
    document.getElementById("qf1Team1Score").value,
    document.getElementById("qf1Team2Score").value,
    document.getElementById("qf1Winner").value
  );

  const qf2Winner = scoreWinner(
    team3,
    team4,
    document.getElementById("qf2Team1Score").value,
    document.getElementById("qf2Team2Score").value,
    document.getElementById("qf2Winner").value
  );

  const qf3Winner = scoreWinner(
    team5,
    team6,
    document.getElementById("qf3Team1Score").value,
    document.getElementById("qf3Team2Score").value,
    document.getElementById("qf3Winner").value
  );

  const qf4Winner = scoreWinner(
    team7,
    team8,
    document.getElementById("qf4Team1Score").value,
    document.getElementById("qf4Team2Score").value,
    document.getElementById("qf4Winner").value
  );

  const sf1Winner = scoreWinner(
    qf1Winner,
    qf2Winner,
    document.getElementById("sf1Team1Score").value,
    document.getElementById("sf1Team2Score").value,
    document.getElementById("sf1Winner").value
  );

  const sf2Winner = scoreWinner(
    qf3Winner,
    qf4Winner,
    document.getElementById("sf2Team1Score").value,
    document.getElementById("sf2Team2Score").value,
    document.getElementById("sf2Winner").value
  );

  const grandWinner = scoreWinner(
    sf1Winner,
    sf2Winner,
    document.getElementById("gfTeam1Score").value,
    document.getElementById("gfTeam2Score").value,
    document.getElementById("grandWinner").value
  );

  siteRef.update({
    eventName: document.getElementById("eventName").value,
    prizePool: document.getElementById("prizePool").value,
    startingPrizePool: document.getElementById("startingPrizePool").value,
    communityDonations: document.getElementById("communityDonations").value,
    donationGoal: document.getElementById("donationGoal").value,
    registrationStatus: document.getElementById("registrationStatus").value,
    countdownDate: document.getElementById("countdownDate").value,
    status: document.getElementById("status").value,
    currentMatch: document.getElementById("currentMatch").value,
    totalPayout: document.getElementById("totalPayout").value,
    eventsHosted: document.getElementById("eventsHosted").value,
    formatType: document.getElementById("formatType").value,

    team1, team2, team3, team4, team5, team6, team7, team8,
team9, team10, team11, team12, team13, team14, team15, team16,


    r16m1Winner: r16Winners[0],
r16m2Winner: r16Winners[1],
r16m3Winner: r16Winners[2],
r16m4Winner: r16Winners[3],
r16m5Winner: r16Winners[4],
r16m6Winner: r16Winners[5],
r16m7Winner: r16Winners[6],
r16m8Winner: r16Winners[7],
    qf1Winner,
    qf2Winner,
    qf3Winner,
    qf4Winner,
    sf1Winner,
    sf2Winner,
    grandWinner,


    r16m1Team1Score: document.getElementById("r16m1Team1Score").value,
r16m1Team2Score: document.getElementById("r16m1Team2Score").value,
r16m2Team1Score: document.getElementById("r16m2Team1Score").value,
r16m2Team2Score: document.getElementById("r16m2Team2Score").value,
r16m3Team1Score: document.getElementById("r16m3Team1Score").value,
r16m3Team2Score: document.getElementById("r16m3Team2Score").value,
r16m4Team1Score: document.getElementById("r16m4Team1Score").value,
r16m4Team2Score: document.getElementById("r16m4Team2Score").value,
r16m5Team1Score: document.getElementById("r16m5Team1Score").value,
r16m5Team2Score: document.getElementById("r16m5Team2Score").value,
r16m6Team1Score: document.getElementById("r16m6Team1Score").value,
r16m6Team2Score: document.getElementById("r16m6Team2Score").value,
r16m7Team1Score: document.getElementById("r16m7Team1Score").value,
r16m7Team2Score: document.getElementById("r16m7Team2Score").value,
r16m8Team1Score: document.getElementById("r16m8Team1Score").value,
r16m8Team2Score: document.getElementById("r16m8Team2Score").value,
    qf1Team1Score: document.getElementById("qf1Team1Score").value,
    qf1Team2Score: document.getElementById("qf1Team2Score").value,
    qf2Team1Score: document.getElementById("qf2Team1Score").value,
    qf2Team2Score: document.getElementById("qf2Team2Score").value,
    qf3Team1Score: document.getElementById("qf3Team1Score").value,
    qf3Team2Score: document.getElementById("qf3Team2Score").value,
    qf4Team1Score: document.getElementById("qf4Team1Score").value,
    qf4Team2Score: document.getElementById("qf4Team2Score").value,

    sf1Team1Score: document.getElementById("sf1Team1Score").value,
    sf1Team2Score: document.getElementById("sf1Team2Score").value,
    sf2Team1Score: document.getElementById("sf2Team1Score").value,
    sf2Team2Score: document.getElementById("sf2Team2Score").value,
    gfTeam1Score: document.getElementById("gfTeam1Score").value,
    gfTeam2Score: document.getElementById("gfTeam2Score").value
  });

  document.getElementById("saveStatus").innerText = "✓ Saved successfully";
}

function resetScoresOnly() {
  if (!confirm("Reset all match scores? Winners and team names will stay.")) return;

  siteRef.update({
    r16m1Team1Score: "",
    r16m1Team2Score: "",
    r16m2Team1Score: "",
    r16m2Team2Score: "",
    r16m3Team1Score: "",
    r16m3Team2Score: "",
    r16m4Team1Score: "",
    r16m4Team2Score: "",
    r16m5Team1Score: "",
    r16m5Team2Score: "",
    r16m6Team1Score: "",
    r16m6Team2Score: "",
    r16m7Team1Score: "",
    r16m7Team2Score: "",
    r16m8Team1Score: "",
    r16m8Team2Score: "",

    qf1Team1Score: "",
    qf1Team2Score: "",
    qf2Team1Score: "",
    qf2Team2Score: "",
    qf3Team1Score: "",
    qf3Team2Score: "",
    qf4Team1Score: "",
    qf4Team2Score: "",

    sf1Team1Score: "",
    sf1Team2Score: "",
    sf2Team1Score: "",
    sf2Team2Score: "",

    gfTeam1Score: "",
    gfTeam2Score: ""
  });

  document.getElementById("saveStatus").innerText = "✓ Scores reset";
}
function resetWinnersOnly() {
  if (!confirm("Reset all winners? Scores and team names will stay.")) return;

  siteRef.update({
    r16m1Winner: "",
    r16m2Winner: "",
    r16m3Winner: "",
    r16m4Winner: "",
    r16m5Winner: "",
    r16m6Winner: "",
    r16m7Winner: "",
    r16m8Winner: "",

    qf1Winner: "",
    qf2Winner: "",
    qf3Winner: "",
    qf4Winner: "",
    sf1Winner: "",
    sf2Winner: "",
    grandWinner: "",

    currentMatch: "No Match Live",
    status: "● OFFLINE"
  });

  document.getElementById("saveStatus").innerText = "✓ Winners reset";
}

function resetFullTournament() {
  if (!confirm("Reset winners, scores, live status, and current match? Team names and event info will stay.")) return;

  siteRef.update({

    // Round of 16 winners
    r16m1Winner: "",
    r16m2Winner: "",
    r16m3Winner: "",
    r16m4Winner: "",
    r16m5Winner: "",
    r16m6Winner: "",
    r16m7Winner: "",
    r16m8Winner: "",

    // Quarterfinal winners
    qf1Winner: "",
    qf2Winner: "",
    qf3Winner: "",
    qf4Winner: "",

    // Semifinal winners
    sf1Winner: "",
    sf2Winner: "",

    // Grand Finals winner
    grandWinner: "",

    // Round of 16 scores
    r16m1Team1Score: "",
    r16m1Team2Score: "",
    r16m2Team1Score: "",
    r16m2Team2Score: "",
    r16m3Team1Score: "",
    r16m3Team2Score: "",
    r16m4Team1Score: "",
    r16m4Team2Score: "",
    r16m5Team1Score: "",
    r16m5Team2Score: "",
    r16m6Team1Score: "",
    r16m6Team2Score: "",
    r16m7Team1Score: "",
    r16m7Team2Score: "",
    r16m8Team1Score: "",
    r16m8Team2Score: "",

    // Quarterfinal scores
    qf1Team1Score: "",
    qf1Team2Score: "",
    qf2Team1Score: "",
    qf2Team2Score: "",
    qf3Team1Score: "",
    qf3Team2Score: "",
    qf4Team1Score: "",
    qf4Team2Score: "",

    // Semifinal scores
    sf1Team1Score: "",
    sf1Team2Score: "",
    sf2Team1Score: "",
    sf2Team2Score: "",

    // Grand Finals scores
    gfTeam1Score: "",
    gfTeam2Score: "",

    // Stream status
    currentMatch: "No Match Live",
    status: "● OFFLINE"
  });

  document.getElementById("saveStatus").innerText = "✓ Tournament reset";
}
