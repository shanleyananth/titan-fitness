function setYear() {
  const year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());
}

function setStatus(message, type = "info") {
  const statusEl = document.getElementById("payStatus");
  if (!statusEl) return;
  statusEl.textContent = message;
  statusEl.dataset.type = type;
}

function setError(id, message) {
  const el = document.getElementById(id);
  if (el) el.textContent = message;
}

function clearErrors() {
  setError("pAmountError", "");
  setError("pNoteError", "");
}

const EXAMPLE_UPI_IDS = [
  "titanfitness@okaxis",
  "supernovaweb@oksbi",
  "shanleydev@okhdfcbank",
  "portfolio.demo@okicici",
  "example.pay@okpaytm",
];

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function readForm() {
  const amountRaw = document.getElementById("pAmount")?.value ?? "";
  const amount = Number(amountRaw);
  const note = document.getElementById("pNote")?.value?.trim() ?? "";
  return { amount, note };
}

function validate({ amount, note }) {
  clearErrors();
  let ok = true;
  if (!Number.isFinite(amount) || amount <= 0) {
    setError("pAmountError", "Enter a valid amount.");
    ok = false;
  }
  if (!note || note.length < 2) {
    setError("pNoteError", "Enter a short note.");
    ok = false;
  }
  return ok;
}

function buildUpiUri({ upiId, payeeName, amount, note }) {
  const params = new URLSearchParams();
  params.set("pa", upiId);
  params.set("pn", payeeName);
  params.set("am", amount.toFixed(0));
  params.set("cu", "INR");
  params.set("tn", note);
  return `upi://pay?${params.toString()}`;
}

function renderUpi({ upiId, upiUri }) {
  const upiIdText = document.getElementById("upiIdText");
  const upiLinkBox = document.getElementById("upiLinkBox");
  if (upiIdText) upiIdText.textContent = upiId;
  if (upiLinkBox) upiLinkBox.textContent = upiUri;
}

function renderQr(upiUri) {
  const qrBox = document.getElementById("qrBox");
  if (!qrBox) return;
  qrBox.innerHTML = "";

  // qrcodejs exposes a global QRCode.
  // eslint-disable-next-line no-undef
  new QRCode(qrBox, {
    text: upiUri,
    width: 220,
    height: 220,
    correctLevel: QRCode.CorrectLevel.M,
  });
}

let currentUpiId = pickRandom(EXAMPLE_UPI_IDS);

function randomizeUpi() {
  currentUpiId = pickRandom(EXAMPLE_UPI_IDS);
  setStatus(`Random UPI selected: ${currentUpiId}`, "success");
  generate();
}

function generate() {
  setStatus("");
  const values = readForm();
  if (!validate(values)) {
    setStatus("Please fix the highlighted fields.", "error");
    return;
  }

  const upiUri = buildUpiUri({
    upiId: currentUpiId,
    payeeName: "Titan Fitness (Demo)",
    amount: values.amount,
    note: values.note,
  });

  renderUpi({ upiId: currentUpiId, upiUri });
  renderQr(upiUri);
  setStatus("Example QR generated.", "success");
}

async function copyUpiLink() {
  const upiUri = document.getElementById("upiLinkBox")?.textContent ?? "";
  if (!upiUri) {
    setStatus("Generate a QR first.", "error");
    return;
  }
  try {
    await navigator.clipboard.writeText(upiUri);
    setStatus("Copied UPI link to clipboard.", "success");
  } catch {
    setStatus("Could not copy. Your browser may block clipboard access.", "error");
  }
}

function bind() {
  document.getElementById("payForm")?.addEventListener("submit", (e) => {
    e.preventDefault();
    generate();
  });
  document.getElementById("randomBtn")?.addEventListener("click", randomizeUpi);
  document.getElementById("copyBtn")?.addEventListener("click", copyUpiLink);
}

setYear();
bind();
generate();

