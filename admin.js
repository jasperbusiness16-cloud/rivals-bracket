const siteRef = database.ref("site");

siteRef.on("value", (snapshot) => {
  const data = snapshot.val();
  if (!data) return;

  document.getElementById("eventName").value = data.eventName || "";
  document.getElementById("prizePool").value = data.prizePool || "";
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
const teamOptions = [
  data.team1 || "Team 1",
  data.team2 || "Team 2",
  data.team3 || "Team 3",
  data.team4 || "Team 4",
  data.team5 || "Team 5",
  data.team6 || "Team 6",
  data.team7 || "Team 7",
  data.team8 || "Team 8"
];

[
  "qf1Winner",
  "qf2Winner",
  "qf3Winner",
  "qf4Winner",
  "sf1Winner",
  "sf2Winner",
  "grandWinner"
].forEach(id => {
  const select = document.getElementById(id);

  select.innerHTML = '<option value="">-- Select Winner --</option>';

  teamOptions.forEach(team => {
    select.innerHTML += `<option value="${team}">${team}</option>`;
  });
});
  document.getElementById("qf1Winner").value = data.qf1Winner || "";
  document.getElementById("qf2Winner").value = data.qf2Winner || "";
  document.getElementById("qf3Winner").value = data.qf3Winner || "";
  document.getElementById("qf4Winner").value = data.qf4Winner || "";
  document.getElementById("sf1Winner").value = data.sf1Winner || "";
  document.getElementById("sf2Winner").value = data.sf2Winner || "";
  document.getElementById("grandWinner").value = data.grandWinner || "";
});

function saveSiteData() {
  siteRef.update({
    eventName: document.getElementById("eventName").value,
    prizePool: document.getElementById("prizePool").value,
    registrationStatus: document.getElementById("registrationStatus").value,
    countdownDate: document.getElementById("countdownDate").value,
    status: document.getElementById("status").value,
    currentMatch: document.getElementById("currentMatch").value,
    totalPayout: document.getElementById("totalPayout").value,
    eventsHosted: document.getElementById("eventsHosted").value,
    formatType: document.getElementById("formatType").value,

    team1: document.getElementById("team1").value,
    team2: document.getElementById("team2").value,
    team3: document.getElementById("team3").value,
    team4: document.getElementById("team4").value,
    team5: document.getElementById("team5").value,
    team6: document.getElementById("team6").value,
    team7: document.getElementById("team7").value,
    team8: document.getElementById("team8").value,

    qf1Winner: document.getElementById("qf1Winner").value,
    qf2Winner: document.getElementById("qf2Winner").value,
    qf3Winner: document.getElementById("qf3Winner").value,
    qf4Winner: document.getElementById("qf4Winner").value,
    sf1Winner: document.getElementById("sf1Winner").value,
    sf2Winner: document.getElementById("sf2Winner").value,
    grandWinner: document.getElementById("grandWinner").value
  });

  document.getElementById("saveStatus").innerText =
    "✓ Saved successfully";
}
