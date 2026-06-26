const siteRef = database.ref("site");

const matchLabel = document.getElementById("matchLabel");
const dock = document.getElementById("matchDock");

let lastLabel = "";

function prettyStage(match = "") {

    const text = match.toLowerCase();

    if (text.includes("grand"))
        return "GRAND FINALS";

    if (text.includes("sf1"))
        return "SEMIFINAL 1";

    if (text.includes("sf2"))
        return "SEMIFINAL 2";

    if (text.includes("qf1"))
        return "QUARTERFINAL 1";

    if (text.includes("qf2"))
        return "QUARTERFINAL 2";

    if (text.includes("qf3"))
        return "QUARTERFINAL 3";

    if (text.includes("qf4"))
        return "QUARTERFINAL 4";

    return "CURRENT MATCH";
}

function updateDock(label){

    if(label === lastLabel) return;

    lastLabel = label;

    matchLabel.style.opacity = 0;
    matchLabel.style.transform = "translateY(6px)";

    setTimeout(()=>{

        matchLabel.textContent = label;

        matchLabel.style.opacity = 1;
        matchLabel.style.transform = "translateY(0)";

    },180);

}

siteRef.on("value", snapshot=>{

    const data = snapshot.val();

    if(!data) return;

    const currentMatch = data.currentMatch || "";

    const stage = prettyStage(currentMatch);

    const format =
        currentMatch.toLowerCase().includes("bo5")
        ? "BO5"
        : "BO3";

    updateDock(`${stage} • ${format}`);

});
