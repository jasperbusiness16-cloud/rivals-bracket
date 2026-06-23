const siteRef = database.ref("site");
let latestSiteData = {};
let latestDonations = [];

siteRef.on("value", (snapshot) => {
  const data = snapshot.val();

  if (!data) return;
latestSiteData = data;
  
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

document.querySelectorAll("[data-starting-prize-pool]").forEach(el => {
  el.innerText = data.startingPrizePool || "$0";
});

document.querySelectorAll("[data-community-donations]").forEach(el => {
  el.innerText = data.communityDonations || "+$0";
});

document.querySelectorAll("[data-donation-goal]").forEach(el => {
  el.innerText = data.donationGoal || "$250";
});
  
const goalAmount = Number(
  (data.donationGoal || "$250").replace(/[^0-9.]/g, "")
);

const currentPrizeNumber = Number(
  (data.prizePool || "0").replace(/[^0-9.]/g, "")
);

const goalPercent = Math.min((currentPrizeNumber / goalAmount) * 100, 100);

document.querySelectorAll("[data-goal-current]").forEach(el => {
  el.innerText = data.prizePool || "$0";
});

document.querySelectorAll("[data-goal-target]").forEach(el => {
  el.innerText = `${data.donationGoal || "$250"} Goal`;
});

const goalFill = document.getElementById("goalFill");

if (goalFill) {
  goalFill.style.width = `${goalPercent}%`;
}
document.querySelectorAll("[data-goal-percent]").forEach(el => {
  el.innerText =
    `${data.prizePool || "$0"} / ${data.donationGoal || "$250"} (${Math.round(goalPercent)}%)`;
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

document.querySelectorAll("[data-next-event-date]").forEach(el => {
  if (!data.countdownDate) {
    el.innerText = "";
    return;
  }

  const eventDate = new Date(data.countdownDate);

  el.innerText = eventDate.toLocaleString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short"
  });
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

function getMoneyNumber(value) {
  return Number(String(value || "0").replace(/[^0-9.]/g, "")) || 0;
}

function formatMoney(value) {
  return `$${Math.round(Number(value || 0))}`;
}
const donationsRef = database.ref("donations");

donationsRef.on("value", (snapshot) => {
  const data = snapshot.val() || {};

  latestDonations = Object.values(data)
  .filter(d => d && d.name && d.amount)
  .map(d => ({
    name: d.name || "Anonymous",
    amount: Number(d.amount) || 0,
    createdAt: Number(d.createdAt) || 0
  }))
  .sort((a, b) => b.createdAt - a.createdAt);

renderRecentDonations(latestDonations);
renderTopDonators(latestDonations);
updateDonationTotals();
});

function updateDonationTotals() {
  const donationTotal = latestDonations.reduce((sum, donation) => {
    return sum + (Number(donation.amount) || 0);
  }, 0);

  const startingPrizePool = getMoneyNumber(latestSiteData.startingPrizePool || "$0");
  const currentPrizePool = startingPrizePool + donationTotal;
  const goalAmount = getMoneyNumber(latestSiteData.donationGoal || "$250");

  const goalPercent =
    goalAmount > 0
      ? Math.min((currentPrizePool / goalAmount) * 100, 100)
      : 0;

  document.querySelectorAll("[data-community-donations]").forEach(el => {
    el.innerText = `+${formatMoney(donationTotal)}`;
  });

  document.querySelectorAll("[data-prize-pool]").forEach(el => {
    el.innerText = formatMoney(currentPrizePool);
  });

  document.querySelectorAll("[data-goal-current]").forEach(el => {
    el.innerText = formatMoney(currentPrizePool);
  });

  document.querySelectorAll("[data-goal-percent]").forEach(el => {
    el.innerText =
      `${formatMoney(currentPrizePool)} / ${latestSiteData.donationGoal || "$250"} (${Math.round(goalPercent)}%)`;
  });

  const goalFill = document.getElementById("goalFill");
  if (goalFill) {
    goalFill.style.width = `${goalPercent}%`;
  }
}

function renderRecentDonations(donations) {
  const container = document.getElementById("recentDonations");
  if (!container) return;

  if (donations.length === 0) {
    container.innerHTML = `
      <div class="donation-entry">
        <strong>No donations yet</strong>
        <span>Be the first supporter</span>
      </div>
    `;
    return;
  }

  container.innerHTML = donations.slice(0, 5).map(donation => `
    <div class="donation-entry">
      <strong>${donation.name}</strong>
      <span>donated $${donation.amount}</span>
    </div>
  `).join("");
}

function renderTopDonators(donations) {
  const container = document.getElementById("topDonators");
  if (!container) return;

  if (donations.length === 0) {
    container.innerHTML = `
      <div class="donation-entry">
        <strong>No donors yet</strong>
        <span>Leaderboard coming soon</span>
      </div>
    `;
    return;
  }

  const totals = {};

  donations.forEach(donation => {
    const name = donation.name || "Anonymous";
    totals[name] = (totals[name] || 0) + donation.amount;
  });

  const medals = ["🥇", "🥈", "🥉", "4.", "5."];

  const topDonators = Object.entries(totals)
    .map(([name, total]) => ({ name, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  container.innerHTML = topDonators.map((donator, index) => `
    <div class="donation-entry">
      <strong>${medals[index]} ${donator.name}</strong>
      <span>$${donator.total} Total</span>
    </div>
  `).join("");
}
