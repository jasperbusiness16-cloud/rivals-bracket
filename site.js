const siteRef = database.ref("site");

siteRef.on("value", (snapshot) => {
  const data = snapshot.val();

  if (!data) return;

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
    el.innerText = data.currentMatch || "";
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
