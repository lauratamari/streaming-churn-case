const API = "https://streaming-churn-case.onrender.com";

const CHURN_LABELS = ["Renews", "Cancels Early", "Won't Renew"];

// ── State ────────────────────────────────────────────────
let allPredictions = [];

// ── DOM refs ─────────────────────────────────────────────
const $ = id => document.getElementById(id);

const elTotal    = $("total");
const elRenews   = $("renews");
const elCancels  = $("cancels");
const elWont     = $("wont");

const fCountry   = $("f-country");
const fPlan      = $("f-plan");
const fCycle     = $("f-cycle");
const btnApply   = $("btn-apply");
const btnReset   = $("btn-reset");

const tbody      = $("pred-tbody");
const tableEmpty = $("table-empty");
const tableLoad  = $("table-loading");
const rowCount   = $("row-count");

const lookupInput  = $("lookup-id");
const btnLookup    = $("btn-lookup");
const lookupResult = $("lookup-result");

// ── Boot ─────────────────────────────────────────────────
(async () => {
  await loadFilters();
  await loadPredictions();
})();

// ── Filters ───────────────────────────────────────────────
async function loadFilters() {
  try {
    const res  = await fetch(`${API}/filters`);
    const data = await res.json();

    data.countries.forEach(c => {
      fCountry.insertAdjacentHTML("beforeend", `<option value="${c}">${c}</option>`);
    });
    data.plans.forEach(p => {
      fPlan.insertAdjacentHTML("beforeend", `<option value="${p}">${p}</option>`);
    });
    data.billing_cycles.forEach(b => {
      fCycle.insertAdjacentHTML("beforeend",
        `<option value="${b}">${b.charAt(0).toUpperCase() + b.slice(1)}</option>`);
    });
  } catch (e) {
    console.error("Failed to load filters:", e);
  }
}

btnApply.addEventListener("click", loadPredictions);
btnReset.addEventListener("click", () => {
  fCountry.value = "";
  fPlan.value    = "";
  fCycle.value   = "";
  loadPredictions();
});

// ── Load predictions ──────────────────────────────────────
async function loadPredictions() {
  showLoading(true);

  const params = new URLSearchParams();
  if (fCountry.value) params.set("country",       fCountry.value);
  if (fPlan.value)    params.set("plan",           fPlan.value);
  if (fCycle.value)   params.set("billing_cycle",  fCycle.value);

  try {
    const res  = await fetch(`${API}/predict?${params}`);
    const data = await res.json();

    allPredictions = data.predictions || [];
    updateSummary(data.summary || {});
    updateBarChart(data.summary || {});
    renderTable(allPredictions);
  } catch (e) {
    console.error("Failed to load predictions:", e);
    tableLoad.textContent = "Error connecting to API.";
  } finally {
    showLoading(false);
  }
}

// ── Summary cards ─────────────────────────────────────────
function updateSummary(s) {
  animateCount(elTotal,   s.total          || 0);
  animateCount(elRenews,  s.renews         || 0);
  animateCount(elCancels, s.cancels_early  || 0);
  animateCount(elWont,    s.wont_renew     || 0);
}

function animateCount(el, target) {
  const start    = parseInt(el.textContent) || 0;
  const duration = 500;
  const startTs  = performance.now();

  function step(ts) {
    const progress = Math.min((ts - startTs) / duration, 1);
    const ease     = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(start + (target - start) * ease);
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

// ── Bar chart ────────────────────────────────────────────
function updateBarChart(s) {
  const total = s.total || 1;
  const bars  = [
    { label: "Renews",        count: s.renews        || 0, cls: "green" },
    { label: "Cancels Early", count: s.cancels_early || 0, cls: "amber" },
    { label: "Won't Renew",   count: s.wont_renew    || 0, cls: "red"   },
  ];

  const container = $("bar-chart");
  container.innerHTML = bars.map(b => {
    const pct = ((b.count / total) * 100).toFixed(1);
    return `
      <div class="bar-row">
        <div class="bar-meta">
          <span>${b.label}</span>
          <span>${b.count} · ${pct}%</span>
        </div>
        <div class="bar-track">
          <div class="bar-fill ${b.cls}" style="width:${pct}%"></div>
        </div>
      </div>`;
  }).join("");
}

// ── Table ────────────────────────────────────────────────
function renderTable(predictions) {
  tbody.innerHTML = "";
  rowCount.textContent = `${predictions.length} row${predictions.length !== 1 ? "s" : ""}`;

  if (!predictions.length) {
    tableEmpty.classList.remove("hidden");
    return;
  }
  tableEmpty.classList.add("hidden");

  const fragment = document.createDocumentFragment();
  predictions.forEach(p => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${p.user_id}</td>
      <td>${p.country}</td>
      <td>${p.plan}</td>
      <td>${p.billing_cycle}</td>
      <td><span class="tag tag-${p.predicted_churn_type}">${p.churn_label}</span></td>
      <td>${(p.prob_renews        * 100).toFixed(1)}%</td>
      <td>${(p.prob_cancels_early * 100).toFixed(1)}%</td>
      <td>${(p.prob_wont_renew    * 100).toFixed(1)}%</td>
    `;
    fragment.appendChild(tr);
  });
  tbody.appendChild(fragment);
}

// ── Single user lookup ───────────────────────────────────
btnLookup.addEventListener("click", lookupUser);
lookupInput.addEventListener("keydown", e => { if (e.key === "Enter") lookupUser(); });

async function lookupUser() {
  const id = lookupInput.value.trim();
  if (!id) return;

  lookupResult.classList.add("hidden");
  lookupResult.innerHTML = "";

  try {
    const res = await fetch(`${API}/predict/${id}`);

    if (!res.ok) {
      lookupResult.innerHTML = `<span style="color:var(--red)">User ${id} not found.</span>`;
      lookupResult.classList.remove("hidden");
      return;
    }

    const p = await res.json();
    const probs = [
      { label: "Renews",        val: p.prob_renews },
      { label: "Cancels Early", val: p.prob_cancels_early },
      { label: "Won't Renew",   val: p.prob_wont_renew },
    ];

    lookupResult.innerHTML = `
      <div>
        <strong>User #${p.user_id}</strong>
        <span class="churn-badge badge-${p.predicted_churn_type}">${p.churn_label}</span>
      </div>
      <div style="margin-top:.4rem;color:var(--muted);font-size:.72rem">
        ${p.country} · ${p.plan} · ${p.billing_cycle}
      </div>
      <div class="lookup-prob-row">
        ${probs.map(pr =>
          `<span class="prob-pill">${pr.label}: <strong>${(pr.val * 100).toFixed(1)}%</strong></span>`
        ).join("")}
      </div>
    `;
    lookupResult.classList.remove("hidden");
  } catch (e) {
    lookupResult.innerHTML = `<span style="color:var(--red)">Error connecting to API.</span>`;
    lookupResult.classList.remove("hidden");
  }
}

// ── Helpers ───────────────────────────────────────────────
function showLoading(show) {
  tableLoad.classList.toggle("hidden", !show);
  if (show) tbody.innerHTML = "";
}