import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./supabase-config.js";

const navToggle = document.querySelector(".nav__toggle");
const navLinks = document.getElementById("navLinks");
const toTop = document.getElementById("toTop");

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function setYear() {
  const year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());
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

function bindBackToTop() {
  if (!toTop) return;
  const onScroll = () => {
    const show = window.scrollY > 650;
    toTop.classList.toggle("is-visible", show);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  toTop.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

function setActiveNavLink() {
  const links = Array.from(document.querySelectorAll('.nav__links a[href^="#"]'));
  if (!links.length) return;

  const sections = links
    .map((a) => {
      const id = a.getAttribute("href")?.slice(1);
      const el = id ? document.getElementById(id) : null;
      return { a, el };
    })
    .filter((x) => x.el);

  if (!sections.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio);
      if (!visible.length) return;
      const activeEl = visible[0].target;
      for (const { a, el } of sections) {
        a.classList.toggle("is-active", el === activeEl);
      }
    },
    { rootMargin: "-30% 0px -55% 0px", threshold: [0.05, 0.12, 0.2] },
  );

  sections.forEach(({ el }) => observer.observe(el));
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

function setStatus(message, type = "info") {
  const statusEl = document.getElementById("contactStatus");
  if (!statusEl) return;
  statusEl.textContent = message;
  statusEl.dataset.type = type;
}

function validateContactForm() {
  clearErrors();
  let ok = true;

  const name = document.getElementById("cName");
  const email = document.getElementById("cEmail");
  const message = document.getElementById("cMessage");

  if (!name?.value?.trim()) {
    setError("cName", "Please enter your name.");
    ok = false;
  }
  if (!email?.value?.trim() || !email.checkValidity()) {
    setError("cEmail", "Please enter a valid email.");
    ok = false;
  }
  if (!message?.value?.trim() || message.value.trim().length < 10) {
    setError("cMessage", "Please enter a message (at least 10 characters).");
    ok = false;
  }

  return ok;
}

function bindContactForm() {
  const form = document.getElementById("contactForm");
  const submitBtn = document.getElementById("contactSubmit");
  if (!form || !submitBtn) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    setStatus("");

    if (!validateContactForm()) {
      setStatus("Please fix the highlighted fields.", "error");
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Sending...";
    setStatus("Sending your message…", "info");

    const name = document.getElementById("cName")?.value?.trim() ?? "";
    const email = document.getElementById("cEmail")?.value?.trim() ?? "";
    const message = document.getElementById("cMessage")?.value?.trim() ?? "";

    try {
      const { error } = await supabase.from("contact_messages").insert({
        name,
        email,
        message,
        page_url: window.location.href,
        user_agent: navigator.userAgent,
      });

      if (error) throw error;

      setStatus("Thanks! Your message was sent successfully.", "success");
      form.reset();
    } catch (err) {
      const msg = err?.message ? String(err.message) : "Failed to send message. Please try again.";
      setStatus(msg, "error");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Send Message";
    }
  });
}

setYear();
bindNavToggle();
initRevealAnimations();
bindBackToTop();
setActiveNavLink();
bindContactForm();

