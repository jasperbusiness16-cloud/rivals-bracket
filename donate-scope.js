(() => {
  "use strict";

  if (window.__RG_DONATE_SCOPE_LOADED__) return;
  window.__RG_DONATE_SCOPE_LOADED__ = true;

  const db = window.database;
  if (!db) return;

  const FIRST_PLACE_PERCENT = 80;
  const SECOND_PLACE_PERCENT = 20;
  const TEAM_SIZE = 6;

  let site = {};
  let donations = [];

  const clean = value => String(value ?? "").trim();

  const moneyNumber = (value, fallback = 0) => {
    const parsed = Number(String(value ?? "").replace(/[^0-9.-]/g, ""));
    return Number.isFinite(parsed) ? parsed : fallback;
  };

  const money = (value, signed = false) => {
    const amount = Number(value || 0);
    const formatted = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(Math.abs(amount));

    if (!signed) return formatted;
    if (amount > 0) return `+${formatted}`;
    if (amount < 0) return `-${formatted}`;
    return formatted;
  };

  const escapeHtml = value =>
    clean(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");

  const initials = value =>
    clean(value, "RG")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part[0])
      .join("")
      .toUpperCase();

  const formatTime = value => {
    const timestamp = Number(value || 0);
    if (!timestamp) return "Confirmed contribution";

    try {
      return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit"
      }).format(new Date(timestamp));
    } catch {
      return "Confirmed contribution";
    }
  };

  const setText = (id, value) => {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
  };

  const currentTournamentDonations = () => {
    const tournamentId = clean(site.currentTournament);
    if (!tournamentId) return [];

    return donations.filter(donation =>
      donation.tournamentId === tournamentId ||
      (!donation.tournamentId && tournamentId === "open1")
    );
  };

  const render = () => {
    const eventDonations = currentTournamentDonations();
    const community = eventDonations.reduce(
      (sum, donation) => sum + donation.amount,
      0
    );

    const starting = Math.max(
      0,
      moneyNumber(
        site.startingPrizePool,
        moneyNumber(site.prizePool, 0)
      )
    );

    const current = starting + community;
    const goal = Math.max(1, moneyNumber(site.donationGoal, 250));
    const percentage = Math.min(100, Math.max(0, (current / goal) * 100));

    setText("heroPrizePool", money(current));
    setText("heroStartingPool", money(starting));
    setText("heroCommunityAdded", money(community, true));
    setText("heroGoalText", `${money(current)} / ${money(goal)}`);
    setText("heroGoalPercent", `${Math.round(percentage)}% reached`);
    setText("startingPrizePoolMetric", money(starting));
    setText("communityContributionMetric", money(community, true));
    setText("currentPrizePoolMetric", money(current));

    const fill = document.getElementById("heroGoalFill");
    if (fill) fill.style.width = `${percentage}%`;

    const firstTeam = current * (FIRST_PLACE_PERCENT / 100);
    const secondTeam = current * (SECOND_PLACE_PERCENT / 100);

    setText("firstPlaceTeamPayout", money(firstTeam));
    setText("secondPlaceTeamPayout", money(secondTeam));
    setText("firstPlacePlayerPayout", money(firstTeam / TEAM_SIZE));
    setText("secondPlacePlayerPayout", money(secondTeam / TEAM_SIZE));

    const recent = document.getElementById("recentDonations");
    const count = document.getElementById("contributionCountLabel");

    if (count) {
      count.textContent =
        `${eventDonations.length.toLocaleString()} confirmed ` +
        `${eventDonations.length === 1 ? "contribution" : "contributions"} for this event`;
    }

    if (recent) {
      const rows = eventDonations.slice(0, 8);

      if (!rows.length) {
        recent.innerHTML = `
          <div class="empty-state">
            <i class="fa-solid fa-hand-holding-heart"></i>
            <strong>No contributions yet</strong>
            <span>Be the first supporter to add to this tournament's prize pool.</span>
          </div>
        `;
      } else {
        recent.innerHTML = rows.map(donation => `
          <article class="donation-row">
            <span class="donor-avatar">${escapeHtml(initials(donation.name))}</span>
            <div class="donation-copy">
              <strong>${escapeHtml(donation.name)}</strong>
              <span>${escapeHtml(donation.message || "Added to the Rivals Gauntlet prize pool")}</span>
              <small>${escapeHtml(formatTime(donation.createdAt))}</small>
            </div>
            <strong class="donation-amount">${escapeHtml(money(donation.amount, true))}</strong>
          </article>
        `).join("");
      }
    }
  };

  const scheduleRender = () => {
    window.setTimeout(render, 0);
    window.setTimeout(render, 80);
  };

  db.ref("site").on("value", snapshot => {
    site = snapshot.val() || {};
    scheduleRender();
  });

  db.ref("donations").on("value", snapshot => {
    const records = snapshot.val() || {};

    donations = Object.entries(records)
      .map(([id, record]) => ({
        id,
        ...(record || {}),
        name: clean(record?.name, "Anonymous"),
        message: clean(record?.message),
        amount: Math.max(0, moneyNumber(record?.amount)),
        createdAt: Number(record?.createdAt || 0),
        tournamentId: clean(record?.tournamentId || record?.eventId)
      }))
      .filter(record => record.amount > 0)
      .sort((a, b) => b.createdAt - a.createdAt);

    scheduleRender();
  });
})();
