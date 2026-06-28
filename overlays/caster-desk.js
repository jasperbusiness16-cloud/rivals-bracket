const siteRef = database.ref("site");
const countdownRef = database.ref("broadcastCountdown");

const studioEventName = document.getElementById("studioEventName");
const studioWebsite = document.getElementById("studioWebsite");
const casterLayout = document.getElementById("casterLayout");

const debugBox = document.createElement("div");
debugBox.style.cssText = `
  position:fixed;
  top:10px;
  left:10px;
  z-index:99999;
  background:red;
  color:white;
  padding:12px;
  font-size:20px;
`;
document.body.appendChild(debugBox);


let siteData = {};
let countdownData = {};

function clean(value, fallback = "") {
  return String(value || fallback).trim();
}

function renderStudio() {
  debugBox.innerText = `
JS WORKING
Caster 1: ${siteData.caster1Name || "none"}
Caster 2: ${siteData.caster2Name || "none"}
Caster 3 Enabled: ${siteData.caster3Enabled}
`;
  
  
  studioEventName.textContent = clean(siteData.eventName, "RIVALS GAUNTLET OPEN #1").toUpperCase();
  studioWebsite.textContent = clean(countdownData.website, "RIVALSGAUNTLET.COM").toUpperCase();

  const count = siteData.caster3Enabled ? 3 : siteData.caster2Enabled ? 2 : 1;

  casterLayout.classList.remove("layout-1", "layout-2", "layout-3");
  casterLayout.classList.add(`layout-${count}`);

  document.querySelector(".caster-1").classList.remove("hidden");
  document.querySelector(".caster-2").classList.toggle("hidden", count < 2);
  document.querySelector(".caster-3").classList.toggle("hidden", count < 3);

  document.getElementById("caster1Name").textContent = clean(siteData.caster1Name, "JASPER HARVEY").toUpperCase();
  document.getElementById("caster1Role").textContent = clean(siteData.caster1Role, "HOST").toUpperCase();

  document.getElementById("caster2Name").textContent = clean(siteData.caster2Name, "CASTER TWO").toUpperCase();
  document.getElementById("caster2Role").textContent = clean(siteData.caster2Role, "ANALYST").toUpperCase();

  document.getElementById("caster3Name").textContent = clean(siteData.caster3Name, "GUEST CASTER").toUpperCase();
  document.getElementById("caster3Role").textContent = clean(siteData.caster3Role, "GUEST").toUpperCase();
}

siteRef.on("value", snapshot => {
  siteData = snapshot.val() || {};
  renderStudio();
});

countdownRef.on("value", snapshot => {
  countdownData = snapshot.val() || {};
  renderStudio();
});
