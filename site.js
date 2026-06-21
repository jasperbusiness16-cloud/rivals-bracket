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
});
