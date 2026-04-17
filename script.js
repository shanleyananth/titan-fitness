/* global emailjs */

const EMAILJS_PUBLIC_KEY = "It8MnXTlUO0P1sDlz";
const EMAILJS_SERVICE_ID = "service_821ja8h";
const EMAILJS_TEMPLATE_ID = "template_hh2ar0t";

const modal = document.getElementById("bookingModal");
const modalBody = document.getElementById("modalBody");
const form = document.getElementById("bookingForm");
const statusEl = document.getElementById("formStatus");
const submitBtn = document.getElementById("submitBtn");
const planSelect = document.getElementById("plan");
const navToggle = document.querySelector(".nav__toggle");
const navLinks = document.getElementById("navLinks");

const CONFIRMATION_TEXT =
  "Registration successful! Please visit the gym and pay offline to activate your plan.";

function setYear() {
  const year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());
}

function openModalWithPlan(planValue) {
  if (!modal) return;
  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";

  if (planSelect && planValue) {
    planSelect.value = planValue;
  }

  const firstInput = modal.querySelector("input, select, button");
  if (firstInput) firstInput.focus();
}

function closeModal() {
  if (!modal) return;
  modal.classList.remove("is-open");
  modal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

function clearErrors() {
  document.querySelectorAll("[data-error-for]").forEach((el) => {
    el.textContent = "";
  });
}

function setError(inputId, message) {
  const el = document.querySelector(`[data-error-for="${inputId}"]`);
  if (el) el.textContent = message;
}

function isValidPhone(value) {
  const cleaned = String(value || "").replace(/\s+/g, "");
  return /^[0-9]{10,15}$/.test(cleaned);
}

function validateForm() {
  clearErrors();
  let ok = true;

  const name = document.getElementById("name");
  const email = document.getElementById("email");
  const phone = document.getElementById("phone");
  const plan = document.getElementById("plan");

  if (!name || !name.value.trim()) {
    setError("name", "Please enter your name.");
    ok = false;
  }
  if (!email || !email.value.trim() || !email.checkValidity()) {
    setError("email", "Please enter a valid email.");
    ok = false;
  }
  if (!phone || !phone.value.trim() || !isValidPhone(phone.value)) {
    setError("phone", "Please enter a valid phone number (10–15 digits).");
    ok = false;
  }
  if (!plan || !plan.value) {
    setError("plan", "Please select a plan.");
    ok = false;
  }

  return ok;
}

function setStatus(message, type = "info") {
  if (!statusEl) return;
  statusEl.textContent = message;
  statusEl.dataset.type = type;
}

function setSubmitting(isSubmitting) {
  if (!submitBtn) return;
  submitBtn.disabled = isSubmitting;
  submitBtn.textContent = isSubmitting ? "Sending..." : "Submit Registration";
}

function showConfirmation() {
  if (!modalBody) return;
  modalBody.innerHTML = `
    <h2 class="modal__title">You're registered</h2>
    <p class="modal__subtitle">${CONFIRMATION_TEXT}</p>
    <div class="note-banner note-banner--subtle" role="note">
      <strong>Offline payment only – Pay at the gym</strong>
    </div>
    <button class="btn btn--primary btn--full" type="button" id="closeAfterSuccess">Close</button>
  `;
  const closeBtn = document.getElementById("closeAfterSuccess");
  if (closeBtn) closeBtn.addEventListener("click", closeModal);
}

function initEmailJs() {
  if (typeof emailjs === "undefined") return;
  try {
    if (EMAILJS_PUBLIC_KEY && EMAILJS_PUBLIC_KEY !== "YOUR_PUBLIC_KEY") {
      emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });
    }
  } catch {
    // no-op: will be surfaced on send
  }
}

function getPlanFromTrigger(trigger) {
  const plan = trigger?.getAttribute?.("data-plan");
  return plan || "1 Month Pass";
}

function bindJoinButtons() {
  document.querySelectorAll("[data-join]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      openModalWithPlan(getPlanFromTrigger(btn));
      if (navLinks) navLinks.classList.remove("is-open");
      if (navToggle) navToggle.setAttribute("aria-expanded", "false");
    });
  });
}

function bindModalClose() {
  document.querySelectorAll("[data-modal-close]").forEach((el) => {
    el.addEventListener("click", closeModal);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal?.classList.contains("is-open")) closeModal();
  });
}

function bindNavToggle() {
  if (!navToggle || !navLinks) return;
  navToggle.addEventListener("click", () => {
    const isOpen = navLinks.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
  });
  navLinks.querySelectorAll("a").forEach((a) => {
    a.addEventListener("click", () => {
      navLinks.classList.remove("is-open");
      navToggle.setAttribute("aria-expanded", "false");
    });
  });
}

function bindFormSubmit() {
  if (!form) return;
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    setStatus("");

    if (!validateForm()) return;

    const from_name = document.getElementById("name").value.trim();
    const reply_to = document.getElementById("email").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const plan = document.getElementById("plan").value;

    if (typeof emailjs === "undefined") {
      setStatus("Email service not loaded. Please check your internet connection.", "error");
      return;
    }
    if (
      EMAILJS_PUBLIC_KEY === "YOUR_PUBLIC_KEY" ||
      EMAILJS_SERVICE_ID === "YOUR_SERVICE_ID" ||
      EMAILJS_TEMPLATE_ID === "YOUR_TEMPLATE_ID"
    ) {
      setStatus(
        "EmailJS is not configured yet. Add your Public Key, Service ID, and Template ID in script.js.",
        "error",
      );
      return;
    }

    setSubmitting(true);
    setStatus("Submitting your registration...", "info");

    try {
      await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
        from_name,
        reply_to,
        phone,
        plan,
      });

      showConfirmation();
    } catch (err) {
      setStatus("Failed to send. Please try again in a moment.", "error");
      // eslint-disable-next-line no-console
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  });
}

function initRevealAnimations() {
  const items = document.querySelectorAll(".reveal");
  if (!items.length) return;

  const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  if (reducedMotion) {
    items.forEach((el) => el.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      }
    },
    { threshold: 0.14 },
  );

  items.forEach((el) => observer.observe(el));
}

setYear();
bindNavToggle();
bindJoinButtons();
bindModalClose();
initRevealAnimations();
initEmailJs();
bindFormSubmit();

