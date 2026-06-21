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
    eventsHosted: document.getElementById("eventsHosted").value
  });

  alert("Site updated!");
}
