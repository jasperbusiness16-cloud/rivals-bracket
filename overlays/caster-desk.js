const siteRef = database.ref("site");
const countdownRef = database.ref("broadcastCountdown");

const studioEventName = document.getElementById("studioEventName");
const studioWebsite = document.getElementById("studioWebsite");
const casterLayout = document.getElementById("casterLayout");

const casterSlots = [
  {
    slot: document.querySelector(".caster-1"),
    name: document.getElementById("caster1Name"),
    role: document.getElementById("caster1Role")
  },
  {
    slot: document.querySelector(".caster-2"),
    name: document.getElementById("caster2Name"),
    role: document.getElementById("caster2Role")
  },
  {
    slot: document.querySelector(".caster-3"),
    name: document.getElementById("caster3Name"),
    role: document.getElementById("caster3Role")
  }
];

let siteData = {};
let countdownData = {};

function clean(value, fallback = "") {
  return String(value || fallback).trim();
}

function renderStudio() {
  studioEventName.textContent = clean(
    siteData.eventName,
    "RIVALS GAUNTLET OPEN #1"
  ).toUpperCase();

  studioWebsite.textContent = clean(
    countdownData.website,
    "RIVALSGAUNTLET.COM"
  ).toUpperCase();

  const casters = [
    {
      name: clean(siteData.caster1Name, "JASPER HARVEY"),
      role: clean(siteData.caster1Role, "HOST"),
      enabled: siteData.caster1Enabled !== false
    },
    {
      name: clean(siteData.caster2Name, "CASTER TWO"),
      role: clean(siteData.caster2Role, "ANALYST"),
      enabled: siteData.caster2Enabled !== false
    },
    {
      name: clean(siteData.caster3Name, "GUEST CASTER"),
      role: clean(siteData.caster3Role, "GUEST"),
      enabled: siteData.caster3Enabled === true
    }
  ];

  let activeCount = 0;

  casters.forEach((caster, index) => {
    const item = casterSlots[index];
    if (!item || !item.slot) return;

    if (caster.enabled) {
      activeCount++;
      item.slot.classList.remove("hidden");
      item.name.textContent = caster.name.toUpperCase();
      item.role.textContent = caster.role.toUpperCase();
    } else {
      item.slot.classList.add("hidden");
    }
  });

  casterLayout.classList.remove("layout-1", "layout-2", "layout-3");

  if (activeCount <= 1) {
    casterLayout.classList.add("layout-1");
  } else if (activeCount === 2) {
    casterLayout.classList.add("layout-2");
  } else {
    casterLayout.classList.add("layout-3");
  }
}

siteRef.on("value", snapshot => {
  siteData = snapshot.val() || {};
  renderStudio();
});

countdownRef.on("value", snapshot => {
  countdownData = snapshot.val() || {};
  renderStudio();
});
