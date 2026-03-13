const API = "https://streaming-churn-case.onrender.com";

const CHURN_LABELS = ["Renews", "Cancels Early", "Won't Renew"];

let allPredictions = [];

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

(async () => {
  await loadFilters();
  await loadPredictions();
})();

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

function showLoading(show) {
  tableLoad.classList.toggle("hidden", !show);
  if (show) tbody.innerHTML = "";
}

const TRANSLATIONS = {
  en: {
    // ── Shared header / nav ──────────────────────────────────────────────────
    "header.label":            "Streaming Analytics",
    "header.h1":               "Churn <em>Prediction</em>",
    "header.sub":              "XGBoost · Multiclass · Live DB",
    "nav.dashboard":           "Dashboard",
    "nav.documentation":       "Documentation",
    "nav.eda":                 "EDA",
    "nav.github":              "GitHub Repository",
    "footer.text":             "Churn Prediction · Portfolio Project · <a href=\"https://lauratamari.github.io/\">Personal Website</a> · <a href=\"https://github.com/lauratamari?\">GitHub</a>",

    // ── index.html ──────────────────────────────────────────────────────────
    "idx.card.total":          "Total Users",
    "idx.card.renews":         "Renews",
    "idx.card.cancels":        "Cancels Early",
    "idx.card.wont":           "Won't Renew",
    "idx.filter.country":      "Country",
    "idx.filter.plan":         "Plan",
    "idx.filter.billing":      "Billing",
    "idx.btn.apply":           "Apply",
    "idx.btn.reset":           "Reset",
    "idx.chart.dist":          "Churn Distribution",
    "idx.chart.lookup":        "Single User Lookup",
    "idx.lookup.placeholder":  "User ID",
    "idx.lookup.btn":          "Search",
    "idx.table.title":         "All Predictions",
    "idx.table.loading":       "Loading predictions…",
    "idx.table.empty":         "No results found.",
    "idx.th.userid":           "User ID",
    "idx.th.country":          "Country",
    "idx.th.plan":             "Plan",
    "idx.th.billing":          "Billing",
    "idx.th.prediction":       "Prediction",
    "idx.th.prenews":          "P(Renews)",
    "idx.th.pcancels":         "P(Cancels Early)",
    "idx.th.pwont":            "P(Won't Renew)",
  },

  pt: {
    // ── Shared header / nav ──────────────────────────────────────────────────
    "header.label":            "Analytics de Streaming",
    "header.h1":               "Previsão de <em>Churn</em>",
    "header.sub":              "XGBoost · Multiclasse · BD ao Vivo",
    "nav.dashboard":           "Painel",
    "nav.documentation":       "Documentação",
    "nav.eda":                 "EDA",
    "nav.github":              "Repositório GitHub",
    "footer.text":             "Previsão de Churn · Projeto de Portfólio · <a href=\"https://lauratamari.github.io/\">Site Pessoal</a> · <a href=\"https://github.com/lauratamari?\">GitHub</a>",

    // ── index.html ──────────────────────────────────────────────────────────
    "idx.card.total":          "Total de Usuários",
    "idx.card.renews":         "Renova",
    "idx.card.cancels":        "Cancela Antecipado",
    "idx.card.wont":           "Não Renova",
    "idx.filter.country":      "País",
    "idx.filter.plan":         "Plano",
    "idx.filter.billing":      "Cobrança",
    "idx.btn.apply":           "Aplicar",
    "idx.btn.reset":           "Resetar",
    "idx.chart.dist":          "Distribuição de Churn",
    "idx.chart.lookup":        "Busca por Usuário",
    "idx.lookup.placeholder":  "ID do Usuário",
    "idx.lookup.btn":          "Buscar",
    "idx.table.title":         "Todas as Previsões",
    "idx.table.loading":       "Carregando previsões…",
    "idx.table.empty":         "Nenhum resultado encontrado.",
    "idx.th.userid":           "ID do Usuário",
    "idx.th.country":          "País",
    "idx.th.plan":             "Plano",
    "idx.th.billing":          "Cobrança",
    "idx.th.prediction":       "Previsão",
    "idx.th.prenews":          "P(Renova)",
    "idx.th.pcancels":         "P(Cancela Antecipado)",
    "idx.th.pwont":            "P(Não Renova)",
  }
};

// ── Lang persistence ──────────────────────────────────────────────────────────
function getLang() {
  return localStorage.getItem('lang') || 'en';
}

function setLang(lang) {
  localStorage.setItem('lang', lang);
  applyLang(lang);
  updateToggle(lang);
  document.documentElement.lang = lang === 'pt' ? 'pt-BR' : 'en';
}

function applyLang(lang) {
  const dict = TRANSLATIONS[lang];
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key  = el.getAttribute('data-i18n');
    const attr = el.getAttribute('data-i18n-attr');
    if (!dict[key]) return;
    if (attr) {
      el.setAttribute(attr, dict[key]);
    } else {
      el.innerHTML = dict[key];
    }
  });
}

function updateToggle(lang) {
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === lang);
  });
}

function initI18n() {
  const lang = getLang();
  applyLang(lang);
  updateToggle(lang);
  document.documentElement.lang = lang === 'pt' ? 'pt-BR' : 'en';
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => setLang(btn.dataset.lang));
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initI18n);
} else {
  initI18n();
}