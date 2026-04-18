import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./supabase-config.js";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function setYear() {
  const year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());
}

function setStatus(message, type = "info") {
  const statusEl = document.getElementById("authStatus");
  if (!statusEl) return;
  statusEl.textContent = message;
  statusEl.dataset.type = type;
}

function setError(id, message) {
  const el = document.getElementById(id);
  if (el) el.textContent = message;
}

function clearErrors() {
  setError("aEmailError", "");
  setError("aPasswordError", "");
}

function readForm() {
  const email = document.getElementById("aEmail")?.value?.trim() ?? "";
  const password = document.getElementById("aPassword")?.value ?? "";
  return { email, password };
}

function validate({ email, password }) {
  clearErrors();
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
}

function renderSession(session) {
  const box = document.getElementById("sessionBox");
  if (!box) return;

  if (!session) {
    box.textContent = "Not signed in.";
    return;
  }

  const safe = {
    user: {
      id: session.user?.id,
      email: session.user?.email,
      created_at: session.user?.created_at,
      last_sign_in_at: session.user?.last_sign_in_at,
    },
    expires_at: session.expires_at,
  };
  box.textContent = JSON.stringify(safe, null, 2);
}

async function refreshSessionBox() {
  const { data } = await supabase.auth.getSession();
  renderSession(data?.session ?? null);
}

async function run(action) {
  const signInBtn = document.getElementById("signInBtn");
  const signUpBtn = document.getElementById("signUpBtn");
  const signOutBtn = document.getElementById("signOutBtn");

  const setBusy = (busy) => {
    if (signInBtn) signInBtn.disabled = busy;
    if (signUpBtn) signUpBtn.disabled = busy;
    if (signOutBtn) signOutBtn.disabled = busy;
  };

  setStatus("");
  clearErrors();
  setBusy(true);

  try {
    if (action === "signOut") {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setStatus("Signed out.", "success");
      await refreshSessionBox();
      return;
    }

    const values = readForm();
    if (!validate(values)) {
      setStatus("Please fix the highlighted fields.", "error");
      return;
    }

    if (action === "signIn") {
      const { error } = await supabase.auth.signInWithPassword(values);
      if (error) throw error;
      setStatus("Signed in.", "success");
      await refreshSessionBox();
      return;
    }

    if (action === "signUp") {
      const { error } = await supabase.auth.signUp(values);
      if (error) throw error;
      setStatus("Account created. If email confirmation is enabled, check your inbox.", "success");
      await refreshSessionBox();
      return;
    }
  } catch (err) {
    const msg = err?.message ? String(err.message) : "Something went wrong.";
    setStatus(msg, "error");
  } finally {
    setBusy(false);
  }
}

function bind() {
  document.getElementById("signInBtn")?.addEventListener("click", () => run("signIn"));
  document.getElementById("signUpBtn")?.addEventListener("click", () => run("signUp"));
  document.getElementById("signOutBtn")?.addEventListener("click", () => run("signOut"));

  supabase.auth.onAuthStateChange((_event, session) => {
    renderSession(session);
  });
}

setYear();
bind();
refreshSessionBox();

