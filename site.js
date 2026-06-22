const siteRef = database.ref("site");

siteRef.on("value", (snapshot) => {
  const data = snapshot.val();

  if (!data) return;

  const matchDisplay = getCurrentMatchDisplay(data);

  document.querySelectorAll("[data-event-name]").forEach(el => {
    el.innerText = data.eventName || "";
  });

  document.querySelectorAll("[data-status]").forEach(el => {
    el.innerText = data.status || "";
  });

  document.querySelectorAll("[data-next-event]").forEach(el => {
    el.innerText = data.nextEvent || "";
  });

  document.querySelectorAll("[data-current-match]").forEach(el => {
    el.innerText = matchDisplay || data.currentMatch || "";
  });

  document.querySelectorAll("[data-format]").forEach(el => {
    el.innerText = data.format || "";
  });

  document.querySelectorAll("[data-prize-pool]").forEach(el => {
    el.innerText = data.prizePool || "";
  });

  document.querySelectorAll("[data-total-payout]").forEach(el => {
    el.innerText = data.totalPayout || "";
  });

  document.querySelectorAll("[data-registration-status]").forEach(el => {
    el.innerText = data.registrationStatus || "";
  });

  document.querySelectorAll("[data-events-hosted]").forEach(el => {
    el.innerText = data.eventsHosted || "";
  });

  const liveCard = document.getElementById("liveNowCard");

  if (liveCard) {
    const isLive =
      (data.status || "").toLowerCase().includes("live");

    liveCard.style.display = isLive ? "block" : "none";
  }

  if (data.countdownDate) {
    startCountdown(data.countdownDate);
  }
});

function getCurrentMatchDisplay(data) {
  const match = data.currentMatch || "";

  const team1 = data.team1 || "Team 1";
  const team2 = data.team2 || "Team 2";
  const team3 = data.team3 || "Team 3";
  const team4 = data.team4 || "Team 4";
  const team5 = data.team5 || "Team 5";
  const team6 = data.team6 || "Team 6";
  const team7 = data.team7 || "Team 7";
  const team8 = data.team8 || "Team 8";

  const qf1Winner = data.qf1Winner || "Winner QF1";
  const qf2Winner = data.qf2Winner || "Winner QF2";
  const qf3Winner = data.qf3Winner || "Winner QF3";
  const qf4Winner = data.qf4Winner || "Winner QF4";
  const sf1Winner = data.sf1Winner || "Winner SF1";
  const sf2Winner = data.sf2Winner || "Winner SF2";

  if (match === "QF1 • Bo3") {
    return `QF1 • Bo3 — ${team1} vs ${team2}`;
  }

  if (match === "QF2 • Bo3") {
    return `QF2 • Bo3 — ${team3} vs ${team4}`;
  }

  if (match === "QF3 • Bo3") {
    return `QF3 • Bo3 — ${team5} vs ${team6}`;
  }

  if (match === "QF4 • Bo3") {
    return `QF4 • Bo3 — ${team7} vs ${team8}`;
  }

  if (match === "SF1 • Bo3") {
    return `SF1 • Bo3 — ${qf1Winner} vs ${qf2Winner}`;
  }

  if (match === "SF2 • Bo3") {
    return `SF2 • Bo3 — ${qf3Winner} vs ${qf4Winner}`;
  }

  if (match === "Grand Finals • Bo5") {
    return `Grand Finals • Bo5 — ${sf1Winner} vs ${sf2Winner}`;
  }

  return match;
}

function startCountdown(targetDate) {
  const target = new Date(targetDate).getTime();

  setInterval(() => {
    const now = new Date().getTime();
    const distance = target - now;

    if (distance <= 0) {
      document.querySelectorAll("[data-countdown]").forEach(el => {
        el.innerText = "Event is live";
      });
      return;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((distance / (1000 * 60)) % 60);

    document.querySelectorAll("[data-countdown]").forEach(el => {
      el.innerText = `${days}d ${hours}h ${minutes}m`;
    });
  }, 1000);
}
