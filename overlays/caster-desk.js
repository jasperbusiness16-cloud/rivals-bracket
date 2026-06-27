const siteRef = database.ref("site");

const deskTitle = document.getElementById("deskTitle");
const deskInfo = document.getElementById("deskInfo");

let lastTitle = "";
let lastInfo = "";

function prettyStage(match = "") {
  const text = String(match).toLowerCase();

  if (text.includes("grand")) return "GRAND FINALS";
  if (text.includes("sf1")) return "SEMIFINAL 1";
  if (text.includes("sf2")) return "SEMIFINAL 2";
  if (text.includes("qf1")) return "QUARTERFINAL 1";
  if (text.includes("qf2")) return "QUARTERFINAL 2";
  if (text.includes("qf3")) return "QUARTERFINAL 3";
  if (text.includes("qf4")) return "QUARTERFINAL 4";

  return "RIVALS GAUNTLET DESK";
}

function getFormat(match = "") {
  const text = String(match).toLowerCase();
  return text.includes("bo5") ? "BO5" : "BO3";
}

function setWithTransition(el, value) {
  if (!el || el.textContent === value) return;

  el.classList.add("text-changing");

  setTimeout(() => {
    el.textContent = value;
    el.classList.remove("text-changing");
  }, 220);
}

function updateDesk(title, info) {
  if (title !== lastTitle) {
    lastTitle = title;
    setWithTransition(deskTitle, title);
  }

  if (info !== lastInfo) {
    lastInfo = info;
    setWithTransition(deskInfo, info);
  }
}

siteRef.on("value", snapshot => {
  const data = snapshot.val() || {};

  const currentMatch = data.currentMatch || "";
  const stage = prettyStage(currentMatch);
  const format = getFormat(currentMatch);

  const title =
    stage === "RIVALS GAUNTLET DESK"
      ? "RIVALS GAUNTLET DESK"
      : `${stage} • ${format}`;

  const info = data.deskInfo || "RIVALSGAUNTLET.COM";

  updateDesk(title, info.toUpperCase());
});
