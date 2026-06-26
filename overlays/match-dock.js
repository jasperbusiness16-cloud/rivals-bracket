const siteRef = database.ref("site");

function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

function getStage(match) {

    const text = (match || "").toLowerCase();

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

siteRef.on("value", snapshot => {

    const data = snapshot.val();
    if (!data) return;

    const currentMatch = data.currentMatch || "";

    const isBo5 = currentMatch.toLowerCase().includes("bo5");

    const format = isBo5 ? "BO5" : "BO3";

    setText(
        "matchLabel",
        `${getStage(currentMatch)} • ${format}`
    );

});
