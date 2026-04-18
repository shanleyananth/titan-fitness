import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "YOUR_SUPABASE_URL";
const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY";

const EMAILJS_PUBLIC_KEY = "YOUR_EMAILJS_PUBLIC_KEY";
const EMAILJS_SERVICE_ID = "YOUR_EMAILJS_SERVICE_ID";
const EMAILJS_TEMPLATE_ID = "YOUR_EMAILJS_TEMPLATE_ID";

const PRODUCT = {
  name: "SupernovaX Smart Bottle",
  amount: 499,
  upiId: "supernovax@upi",
  payeeName: "SupernovaX",
};

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function $(id) {
  return document.getElementById(id);
}

function setYear() {
  const year = $("year");
  if (year) year.textContent = String(new Date().getFullYear());
}

function initEmailJs() {
  const lib = window.emailjs;
  if (!lib) return false;
  try {
    lib.init(EMAILJS_PUBLIC_KEY);
    return true;
  } catch {
    return false;
  }
}

function setStatus(id, message, type = "info") {
  const el = $(id);
  if (!el) return;
  el.textContent = message;
  el.dataset.type = type;
}

function setError(id, message) {
  const el = $(id);
  if (el) el.textContent = message;
}

function reveal() {
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
    { threshold: 0.12 },
  );
  items.forEach((el) => observer.observe(el));
}

function upiUri({ upiId, payeeName, amount, note }) {
  const params = new URLSearchParams();
  params.set("pa", upiId);
  params.set("pn", payeeName);
  params.set("am", String(amount));
  params.set("cu", "INR");
  if (note) params.set("tn", note);
  return `upi://pay?${params.toString()}`;
}

function renderQr(text) {
  const qrBox = $("qrBox");
  if (!qrBox) return;
  qrBox.innerHTML = "";
  if (!window.QRCode) return;
  // eslint-disable-next-line no-undef
  new QRCode(qrBox, { text, width: 220, height: 220, correctLevel: QRCode.CorrectLevel.M });
}

async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data?.session ?? null;
}

function getNextUrl() {
  const next = new URLSearchParams(window.location.search).get("next");
  if (!next) return null;
  return next;
}

function toggleAuthUi(session) {
  const pill = $("userPill");
  const email = $("userEmail");
  const loginLink = $("loginLink");
  const logoutBtn = $("logoutBtn");

  if (session?.user?.email) {
    if (pill) pill.hidden = false;
    if (email) email.textContent = session.user.email;
    if (loginLink) loginLink.hidden = true;
    if (logoutBtn) logoutBtn.hidden = false;
  } else {
    if (pill) pill.hidden = true;
    if (email) email.textContent = "";
    if (loginLink) loginLink.hidden = false;
    if (logoutBtn) logoutBtn.hidden = true;
  }
}

function showCheckoutAuthed(session) {
  const loginRequiredCard = $("loginRequiredCard");
  const paymentCard = $("paymentCard");
  const orderCard = $("orderCard");
  const emailInput = $("oEmail");

  const authed = Boolean(session?.user?.email);
  if (loginRequiredCard) loginRequiredCard.hidden = authed;
  if (paymentCard) paymentCard.hidden = !authed;
  if (orderCard) orderCard.hidden = !authed;
  if (emailInput && authed) emailInput.value = session.user.email;

  if (authed) {
    $("amountText") && ($("amountText").textContent = String(PRODUCT.amount));
    $("priceText") && ($("priceText").textContent = String(PRODUCT.amount));
    $("upiIdText") && ($("upiIdText").textContent = PRODUCT.upiId);
    renderQr(
      upiUri({
        upiId: PRODUCT.upiId,
        payeeName: PRODUCT.payeeName,
        amount: PRODUCT.amount,
        note: `Order: ${PRODUCT.name}`,
      }),
    );
  }
}

async function copyUpiLink() {
  const link = upiUri({
    upiId: PRODUCT.upiId,
    payeeName: PRODUCT.payeeName,
    amount: PRODUCT.amount,
    note: `Order: ${PRODUCT.name}`,
  });
  try {
    await navigator.clipboard.writeText(link);
    setStatus("orderStatus", "Copied UPI link.", "success");
  } catch {
    setStatus("orderStatus", "Could not copy UPI link.", "error");
  }
}

function validateOrder({ name, utr }) {
  setError("oNameErr", "");
  setError("oUtrErr", "");
  let ok = true;
  if (!name || name.trim().length < 2) {
    setError("oNameErr", "Enter your name.");
    ok = false;
  }
  if (!utr || String(utr).trim().length < 8) {
    setError("oUtrErr", "Enter a valid UTR number.");
    ok = false;
  }
  return ok;
}

async function placeOrder({ name, email, utr }) {
  const payload = {
    name: name.trim(),
    email,
    product_name: PRODUCT.name,
    amount: PRODUCT.amount,
    utr_number: String(utr).trim(),
    status: "pending",
  };

  const { error } = await supabase.from("orders").insert(payload);
  if (error) throw error;

  if (window.emailjs) {
    await window.emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
      customer_name: payload.name,
      customer_email: payload.email,
      product: payload.product_name,
      amount: String(payload.amount),
      utr_number: payload.utr_number,
      status: payload.status,
    });
  }
}

async function bindHome() {
  const logoutBtn = $("logoutBtn");
  const buyNowBtn = $("buyNowBtn");
  const copyBtn = $("copyUpiBtn");
  const orderForm = $("orderForm");
  const orderSubmitBtn = $("orderSubmitBtn");

  initEmailJs();

  let session = await getSession();
  toggleAuthUi(session);
  showCheckoutAuthed(session);

  supabase.auth.onAuthStateChange((_event, nextSession) => {
    session = nextSession;
    toggleAuthUi(session);
    showCheckoutAuthed(session);
  });

  logoutBtn?.addEventListener("click", async () => {
    await supabase.auth.signOut();
  });

  buyNowBtn?.addEventListener("click", async () => {
    const s = await getSession();
    if (!s) {
      window.location.href = "./login.html?next=index.html%23checkout";
      return;
    }
    document.getElementById("checkout")?.scrollIntoView({ behavior: "smooth" });
  });

  copyBtn?.addEventListener("click", copyUpiLink);

  orderForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    setStatus("orderStatus", "");

    const s = await getSession();
    const email = s?.user?.email ?? "";
    if (!email) {
      window.location.href = "./login.html?next=index.html%23checkout";
      return;
    }

    const name = $("oName")?.value ?? "";
    const utr = $("oUtr")?.value ?? "";
    if (!validateOrder({ name, utr })) {
      setStatus("orderStatus", "Please fix the highlighted fields.", "error");
      return;
    }

    if (orderSubmitBtn) {
      orderSubmitBtn.disabled = true;
      orderSubmitBtn.textContent = "Submitting…";
    }

    try {
      setStatus("orderStatus", "Saving order and notifying admin…", "info");
      await placeOrder({ name, email, utr });
      setStatus("orderStatus", "Order placed. Waiting for verification.", "success");
      orderForm.reset();
      const emailInput = $("oEmail");
      if (emailInput) emailInput.value = email;
    } catch (err) {
      const msg = err?.message ? String(err.message) : "Failed to place order.";
      setStatus("orderStatus", msg, "error");
    } finally {
      if (orderSubmitBtn) {
        orderSubmitBtn.disabled = false;
        orderSubmitBtn.textContent = "Submit Order";
      }
    }
  });
}

async function bindLogin() {
  initEmailJs();

  const signInBtn = $("signInBtn");
  const signUpBtn = $("signUpBtn");

  const setBusy = (busy) => {
    if (signInBtn) signInBtn.disabled = busy;
    if (signUpBtn) signUpBtn.disabled = busy;
  };

  const read = () => ({
    email: $("aEmail")?.value?.trim() ?? "",
    password: $("aPassword")?.value ?? "",
  });

  const validate = ({ email, password }) => {
    setError("aEmailError", "");
    setError("aPasswordError", "");
    let ok = true;
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      setError("aEmailError", "Enter a valid email.");
      ok = false;
    }
    if (!password || password.length < 6) {
      setError("aPasswordError", "Password must be at least 6 characters.");
      ok = false;
    }
    return ok;
  };

  const goNext = () => {
    const next = getNextUrl();
    window.location.href = next || "./index.html#checkout";
  };

  const run = async (mode) => {
    setStatus("authStatus", "");
    setBusy(true);
    try {
      const v = read();
      if (!validate(v)) {
        setStatus("authStatus", "Please fix the highlighted fields.", "error");
        return;
      }
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword(v);
        if (error) throw error;
        setStatus("authStatus", "Signed in. Redirecting…", "success");
        window.setTimeout(goNext, 350);
        return;
      }
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp(v);
        if (error) throw error;
        setStatus("authStatus", "Account created. Redirecting…", "success");
        window.setTimeout(goNext, 350);
        return;
      }
    } catch (err) {
      const msg = err?.message ? String(err.message) : "Login failed.";
      setStatus("authStatus", msg, "error");
    } finally {
      setBusy(false);
    }
  };

  signInBtn?.addEventListener("click", () => run("signin"));
  signUpBtn?.addEventListener("click", () => run("signup"));

  const session = await getSession();
  if (session) {
    setStatus("authStatus", "You are already signed in. Redirecting…", "success");
    window.setTimeout(goNext, 350);
  }
}

setYear();
reveal();

const page = document.body?.dataset?.page;
if (page === "home") bindHome();
if (page === "login") bindLogin();

