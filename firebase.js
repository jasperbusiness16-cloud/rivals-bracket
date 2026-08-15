(() => {
  "use strict";

  const pathname = String(window.location.pathname || "");
  const needsReferralAttribution =
    /^\/(?:signup|apply)(?:\.html)?\/?$/i.test(pathname);

  const scripts = ["/firebase-core.js?v=1"];

  if (needsReferralAttribution) {
    scripts.push("/referral-attribution.js?v=1");
  }

  if (document.readyState === "loading") {
    document.write(
      scripts
        .map(src => `<script src="${src}"><\/script>`)
        .join("")
    );
    return;
  }

  // Fallback for any page that loads firebase.js dynamically after parsing.
  // Existing parser-loaded pages use the synchronous path above.
  window.__RGFirebaseBootstrapReady = scripts.reduce(
    (chain, src) => chain.then(() => new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = src;
      script.async = false;
      script.onload = resolve;
      script.onerror = () => reject(new Error(`Failed to load ${src}`));
      document.head.appendChild(script);
    })),
    Promise.resolve()
  ).catch(error => {
    console.error("[RG] Firebase bootstrap failed.", error);
    throw error;
  });
})();
