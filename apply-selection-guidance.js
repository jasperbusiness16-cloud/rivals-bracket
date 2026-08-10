(() => {
  "use strict";

  function applySelectionGuidance() {
    const strengthCard = document.querySelector(
      ".profile-strength-card"
    );

    if (strengthCard) {
      const heading = strengthCard.querySelector(
        ".profile-strength-head strong"
      );

      const copy = strengthCard.querySelector(
        ".profile-strength-head p"
      );

      if (heading) {
        heading.textContent =
          "Improve Your Selection Chances";
      }

      if (copy) {
        copy.textContent =
          "Applicants with a public Marvel Rivals profile and connected creator/social links are significantly easier for staff to verify and evaluate. Those applications receive stronger consideration and have a much higher likelihood of being selected. Keep your Rivals profile public through selections and connect any Twitch, YouTube, TikTok, or X accounts you actively use.";
      }
    }

    const finalReviewNotice = document.querySelector(
      '.form-step[data-form-step="4"] .review-notice'
    );

    if (finalReviewNotice) {
      const heading = finalReviewNotice.querySelector(
        "strong"
      );

      const copy = finalReviewNotice.querySelector(
        "p"
      );

      if (heading) {
        heading.textContent =
          "Final Selection Check";
      }

      if (copy) {
        copy.textContent =
          "Before submitting, make sure your information is current. For the strongest application, keep your Marvel Rivals account set to public and connect your active Twitch, YouTube, TikTok, or X accounts. Public competitive history and creator links give staff more information to review and can significantly improve your selection chances.";
      }
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      applySelectionGuidance,
      { once: true }
    );
  } else {
    applySelectionGuidance();
  }
})();
