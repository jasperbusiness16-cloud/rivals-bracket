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

  const qf1Options = [data.team1 || "Team 1", data.team2 || "Team 2"];
  const qf2Options = [data.team3 || "Team 3", data.team4 || "Team 4"];
  const qf3Options = [data.team5 || "Team 5", data.team6 || "Team 6"];
  const qf4Options = [data.team7 || "Team 7", data.team8 || "Team 8"];

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
  const team1 = document.getElementById("team1").value;
  const team2 = document.getElementById("team2").value;
  const team3 = document.getElementById("team3").value;
  const team4 = document.getElementById("team4").value;
  const team5 = document.getElementById("team5").value;
  const team6 = document.getElementById("team6").value;
  const team7 = document.getElementById("team7").value;
  const team8 = document.getElementById("team8").value;

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

    qf1Winner,
    qf2Winner,
    qf3Winner,
    qf4Winner,
    sf1Winner,
    sf2Winner,
    grandWinner,

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
    qf1Winner: "",
    qf2Winner: "",
    qf3Winner: "",
    qf4Winner: "",
    sf1Winner: "",
    sf2Winner: "",
    grandWinner: "",

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
    gfTeam2Score: "",

    currentMatch: "No Match Live",
    status: "● OFFLINE"
  });

  document.getElementById("saveStatus").innerText = "✓ Tournament reset";
}
