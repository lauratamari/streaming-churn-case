// ── Histogram helper ─────────────────────────────────────────────────────
    function makeHist(id, buckets, fillClass) {
      const el = document.getElementById(id);
      if (!el) return;
      const max = Math.max(...buckets.map(b => b.v));
      el.innerHTML = buckets.map(b => `
        <div class="h-bar-row">
          <span class="h-bar-label xs">${b.label}</span>
          <div class="h-bar-track">
            <div class="h-bar-fill ${fillClass}" style="width:${(b.v/max*100).toFixed(1)}%"></div>
          </div>
          <span class="h-bar-val" style="font-size:.65rem">${b.pct || ''}</span>
        </div>`).join('');
    }

    makeHist('watch-hist', [
      {label:'0–4 hrs',  v:2500, pct:'25%'},
      {label:'4–8 hrs',  v:2480, pct:'25%'},
      {label:'8–12 hrs', v:2520, pct:'25%'},
      {label:'12–16 hrs',v:2490, pct:'25%'},
      {label:'16–20 hrs',v:2010, pct:'20%'},
    ], 'fill-accent');

    makeHist('days-hist', [
      {label:'0–12 d',  v:2000, pct:'20%'},
      {label:'12–24 d', v:2010, pct:'20%'},
      {label:'24–36 d', v:2040, pct:'20%'},
      {label:'36–48 d', v:1990, pct:'20%'},
      {label:'48–60 d', v:1960, pct:'20%'},
    ], 'fill-red');

    makeHist('login-hist', [
      {label:'0–4',   v:2490, pct:'25%'},
      {label:'4–8',   v:2505, pct:'25%'},
      {label:'8–12',  v:2510, pct:'25%'},
      {label:'12–16', v:2495, pct:'25%'},
      {label:'16–20', v:2000, pct:'20%'},
    ], 'fill-blue');

    makeHist('completion-hist', [
      {label:'0.2–0.4', v:2510, pct:'25%'},
      {label:'0.4–0.6', v:2490, pct:'25%'},
      {label:'0.6–0.8', v:2510, pct:'25%'},
      {label:'0.8–1.0', v:2490, pct:'25%'},
    ], 'fill-green');

    // ── Box plots ────────────────────────────────────────────────────────────
    const boxData = [
      {
        label: 'days_since_last_watch',
        min: 0, max: 60,
        renews:  {q1:14, med:25, q3:38},
        cancels: {q1:25, med:40, q3:54},
        wont:    {q1:28, med:42, q3:56},
      },
      {
        label: 'avg_watch_hours_pw',
        min: 0, max: 20,
        renews:  {q1:4.9, med:10.1, q3:15.1},
        cancels: {q1:5.0, med:10.2, q3:15.0},
        wont:    {q1:4.9, med:10.1, q3:15.2},
      },
      {
        label: 'completion_rate',
        min: 0.2, max: 1.0,
        renews:  {q1:0.41, med:0.62, q3:0.81},
        cancels: {q1:0.38, med:0.57, q3:0.78},
        wont:    {q1:0.39, med:0.58, q3:0.79},
      },
      {
        label: 'logins_per_week',
        min: 0, max: 20,
        renews:  {q1:5, med:10, q3:15},
        cancels: {q1:5, med:10, q3:15},
        wont:    {q1:5, med:10, q3:15},
      },
      {
        label: 'payment_failures',
        min: 0, max: 2,
        renews:  {q1:0, med:1, q3:2},
        cancels: {q1:0, med:1, q3:2},
        wont:    {q1:0, med:1, q3:2},
      },
      {
        label: 'age',
        min: 18, max: 65,
        renews:  {q1:30, med:42, q3:54},
        cancels: {q1:30, med:42, q3:54},
        wont:    {q1:30, med:42, q3:54},
      },
      {
        label: 'monthly_price',
        min: 9.99, max: 19.99,
        renews:  {q1:9.99, med:14.99, q3:19.99},
        cancels: {q1:9.99, med:14.99, q3:19.99},
        wont:    {q1:9.99, med:14.99, q3:19.99},
      },
      {
        label: 'tickets_last_30d',
        min: 0, max: 5,
        renews:  {q1:1, med:2, q3:4},
        cancels: {q1:1, med:2, q3:4},
        wont:    {q1:1, med:2, q3:4},
      },
    ];

    const container = document.getElementById('box-plots');
    const classes = [
      {key:'renews',  cls:'renews',  label:'Renews'},
      {key:'cancels', cls:'cancels', label:'Cancels Early'},
      {key:'wont',    cls:'wont',    label:"Won't Renew"},
    ];

    boxData.forEach(feat => {
      const range = feat.max - feat.min;
      const rows = classes.map(c => {
        const d = feat[c.key];
        const iqrLeft = ((d.q1 - feat.min) / range * 100).toFixed(1);
        const iqrW    = ((d.q3 - d.q1)    / range * 100).toFixed(1);
        const medLeft = ((d.med - feat.min)/ range * 100).toFixed(1);
        return `<div class="box-track" title="${c.label}: Q1=${d.q1} Med=${d.med} Q3=${d.q3}">
          <div class="box-iqr ${c.cls}" style="left:${iqrLeft}%;width:${iqrW}%"></div>
          <div class="box-median ${c.cls}" style="left:${medLeft}%"></div>
        </div>`;
      }).join('');
      container.innerHTML += `
        <div class="box-item">
          <div class="box-label">${feat.label}</div>
          ${rows}
          <div class="box-stats"><span>${feat.min}</span><span>${feat.max}</span></div>
        </div>`;
    });

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
    "eda.sidebar.overview":          "Overview",
    "eda.sidebar.dataset":           "Dataset & Setup",
    "eda.sidebar.dtypes":            "Data Types",
    "eda.sidebar.missing":           "Missing Values",
    "eda.sidebar.descriptive":       "Descriptive Stats",
    "eda.sidebar.single":            "Single Variable",
    "eda.sidebar.churndist":         "Churn Distribution",
    "eda.sidebar.continuous":        "Continuous Features",
    "eda.sidebar.categorical":       "Categorical Features",
    "eda.sidebar.cancellation":      "Cancellation Rate",
    "eda.sidebar.churnbygroup":      "Churn by Plan & Billing",
    "eda.sidebar.multi":             "Multi-Variable",
    "eda.sidebar.boxplots":          "Features vs Churn",
    "eda.sidebar.catvschurn":        "Categorical vs Churn",
    "eda.sidebar.correlation":       "Correlation",
    "eda.sidebar.summary":           "Summary",
    "eda.sidebar.findings":          "Key Findings",

    "eda.overview.title":            "Dataset <em>Overview</em>",
    "eda.overview.p1":               "Data pulled from PostgreSQL via SQLAlchemy, joining six tables — users, subscriptions, engagement, support tickets, billing, and churn labels — all linked by <code>user_id</code>. Result: <strong>10,000 rows × 21 columns</strong>.",
    "eda.overview.groups":           "Column Groups",

    "eda.dtypes.title":              "Data Type <em>Corrections</em>",
    "eda.dtypes.p1":                 "On initial load all five date columns were <code>object</code> (string). Cast before analysis:",

    "eda.missing.title":             "Missing <em>Values</em>",
    "eda.missing.p1":                "Only two columns contain nulls — both expected by design. All other 19 columns are fully populated.",
    "eda.missing.callout":           "No imputation required. The dataset is clean and ready for analysis.",

    "eda.descriptive.title":         "Descriptive <em>Statistics</em>",
    "eda.descriptive.p1":            "Continuous features show broadly uniform distributions — consistent with synthetic data designed to cover a wide variety of user profiles.",

    "eda.churndist.title":           "Churn <em>Distribution</em>",
    "eda.churndist.p1":              "The target variable <code>churn_type</code> is heavily imbalanced. Class 0 dominates at 76.7%; Class 1 is the critical minority at just 3.7%.",
    "eda.churndist.callout":         "Class 1 (Cancels Early) at 3.7% is severely underrepresented. Accuracy alone will be misleading — use F1-score and ROC-AUC per class, with class weighting applied during training.",

    "eda.continuous.title":          "Continuous Feature <em>Distributions</em>",
    "eda.continuous.p1":             "Near-uniform distributions across most features reflect the synthetic nature of the dataset. Monthly and yearly price are discrete — three values per plan tier. Payment failures and tickets are capped integers.",

    "eda.categorical.title":         "Categorical Feature <em>Distributions</em>",
    "eda.categorical.p1":            "Plans and billing cycles are roughly balanced. Countries span multiple regions. Price increase is a boolean split approximately evenly across the dataset.",

    "eda.cancellation.title":        "Cancellation Rate <em>Analysis</em>",
    "eda.cancellation.p1":           "15% of users have formally cancelled. Monthly subscribers and exposure to price increases show elevated cancellation rates.",

    "eda.churnbygroup.title":        "Churn Type by Plan <em>&amp; Billing Cycle</em>",
    "eda.churnbygroup.p1":           "Percentage breakdown of churn_type within each group. All segments are dominated by Renews (class 0) consistent with the 76.7% baseline. Monthly subscribers show slightly more early cancellations.",

    "eda.boxplots.title":            "Continuous Features <em>vs Churn</em>",
    "eda.boxplots.p1":               "IQR ranges and medians for each feature split by churn class. <code>days_since_last_watch</code> shows the only clear class separation — churning users have not watched recently.",
    "eda.boxplots.callout":          "days_since_last_watch is the clearest visual separator between churn classes. Churning users (classes 1 &amp; 2) show higher medians and wider spreads than renewing users — validating the correlation result (r = +0.623).",

    "eda.catvschurn.title":          "Categorical Features <em>vs Churn Rate</em>",
    "eda.catvschurn.p1":             "Churn rate (% with churn_type ≠ 0) per categorical value. The vertical marker shows the overall average of <strong>23.3%</strong>.",

    "eda.correlation.title":         "Feature <em>Correlation</em>",
    "eda.correlation.p1":            "Pearson correlations between all 8 continuous features and a binary churn indicator (1 if churn_type ≠ 0), sorted by absolute strength.",
    "eda.correlation.callout":       "days_since_last_watch is by far the strongest linear predictor. All other continuous features show near-zero correlation — suggesting non-linear interactions and categorical features carry most of the remaining predictive power. This is why XGBoost is well-suited to this problem.",

    "eda.findings.title":            "Key Findings &amp; <em>Implications</em>",
    "eda.findings.p1":               "Summary of the most important EDA findings and their implications for the modelling pipeline.",
    "eda.findings.output":           "Output",
    "eda.findings.output.p":         "The cleaned DataFrame was exported to Parquet for use in the modelling notebook:",

    // ── Overview stat cards ─────────────────────────────────────────────────
    "eda.stat.users":                "Users",
    "eda.stat.features":             "Features",
    "eda.stat.tables":               "Source Tables",
    "eda.stat.classes":              "Churn Classes",

    // ── Overview table headers ───────────────────────────────────────────────
    "eda.overview.th.group":         "Group",
    "eda.overview.th.type":          "Type",
    "eda.overview.th.columns":       "Columns",
    "eda.overview.td.continuous":    "Continuous",
    "eda.overview.td.categorical":   "Categorical",
    "eda.overview.td.date":          "Date",
    "eda.overview.td.target":        "Target",

    // ── Missing values table ─────────────────────────────────────────────────
    "eda.missing.th.column":         "Column",
    "eda.missing.th.nulls":          "Nulls",
    "eda.missing.th.reason":         "Reason",
    "eda.missing.td.yearly":         "Only populated for yearly subscribers (~50% of users).",
    "eda.missing.td.cancellation":   "Only populated when a user has actually cancelled (15% of users).",

    // ── Descriptive stats table ──────────────────────────────────────────────
    "eda.descriptive.th.feature":    "Feature",
    "eda.descriptive.th.min":        "Min",
    "eda.descriptive.th.median":     "Median",
    "eda.descriptive.th.max":        "Max",
    "eda.descriptive.th.std":        "Std",

    // ── Churn distribution ───────────────────────────────────────────────────
    "eda.stat.renews":               "Renews · 7,672 users",
    "eda.stat.cancels":              "Cancels Early · 372 users",
    "eda.stat.wont":                 "Won't Renew · 1,956 users",
    "eda.stat.cancelled":            "Formally Cancelled · 1,504",
    "eda.chart.cancelled.title":     "Cancelled flag",
    "eda.chart.cancelled.caption":   "85% of users have not formally cancelled.",
    "eda.chart.churntype.title":     "Churn type (multiclass target)",
    "eda.chart.churntype.caption":   "Class 1 is severely underrepresented — only 372 users.",

    // ── Continuous distributions ─────────────────────────────────────────────
    "eda.chart.watch.title":         "Avg watch hours / week",
    "eda.chart.watch.caption":       "Uniform 0–20 hrs, mean ~10.",
    "eda.chart.days.title":          "Days since last watch",
    "eda.chart.days.caption":        "Uniform 0–60 days, mean ~30. Strongest churn predictor.",
    "eda.chart.logins.title":        "Logins / week",
    "eda.chart.logins.caption":      "Uniform 0–20, mean ~10.",
    "eda.chart.completion.title":    "Completion rate",
    "eda.chart.completion.caption":  "Uniform 0.20–1.00, mean ~0.60.",
    "eda.chart.price.title":         "Monthly price (USD) — discrete",
    "eda.chart.price.caption":       "Three price points mapping directly to plan tiers.",
    "eda.chart.failures.title":      "Payment failures — capped at 2",
    "eda.chart.failures.caption":    "Capped integer — max 2, mean 1.00.",

    // ── Categorical distributions ────────────────────────────────────────────
    "eda.chart.plan.title":          "Plan tier",
    "eda.chart.plan.caption":        "Perfectly balanced across all three plan tiers.",
    "eda.chart.billing.title":       "Billing cycle",
    "eda.chart.billing.caption":     "Near-even monthly / yearly split (~50/50).",
    "eda.chart.priceinc.title":      "Price increase last 6m",
    "eda.chart.priceinc.caption":    "Nearly half the userbase experienced a recent price increase.",
    "eda.chart.country.title":       "Country (representative sample)",
    "eda.chart.country.caption":     "Multiple regions with no single dominant country.",

    // ── Cancellation analysis ────────────────────────────────────────────────
    "eda.chart.cancel.billing.title":   "Cancellation &amp; churn rate by billing cycle",
    "eda.chart.cancel.rate":            "Cancellation rate",
    "eda.chart.churn.rate":             "Churn rate (type ≠ 0)",
    "eda.chart.cancel.billing.caption": "Monthly subscribers are significantly more likely to cancel — consistent with lower commitment.",
    "eda.chart.cancel.plan.title":      "Cancellation rate by plan",
    "eda.chart.cancel.plan.caption":    "Broadly similar across plan tiers — no tier stands out.",

    // ── Churn by group ───────────────────────────────────────────────────────
    "eda.chart.churnplan.title":     "Churn type by plan (%)",
    "eda.chart.churnplan.caption":   "Distribution is broadly consistent across plan tiers.",
    "eda.chart.churnbilling.title":  "Churn type by billing cycle (%)",
    "eda.chart.churnbilling.caption":"Monthly subscribers show a slightly higher share of early cancellations vs yearly.",

    // ── Box plots ────────────────────────────────────────────────────────────
    "eda.chart.box.title":           "Feature distributions by churn class — IQR + median",
    "eda.chart.box.caption":         "Each row of boxes shows the IQR (25th–75th percentile) with a median marker per class. days_since_last_watch is the only feature with meaningful visual separation.",

    // ── Categorical vs churn ─────────────────────────────────────────────────
    "eda.chart.cvsc.billing.title":   "Churn rate by billing cycle &mdash; avg 23.3%",
    "eda.chart.cvsc.billing.caption": "Monthly above average; yearly below. Vertical line = 23.3% avg.",
    "eda.chart.cvsc.priceinc.title":  "Churn rate by price increase &mdash; avg 23.3%",
    "eda.chart.cvsc.priceinc.caption":"Largest deviation from average — price hike users are ~2× more likely to churn.",
    "eda.chart.cvsc.plan.title":      "Churn rate by plan &mdash; avg 23.3%",
    "eda.chart.cvsc.plan.caption":    "Minimal variation — all three plan tiers sit near the overall average.",
    "eda.chart.cvsc.country.title":   "Churn rate by country (sample) &mdash; avg 23.3%",
    "eda.chart.cvsc.country.caption": "Geographic signals exist but are weak — all near the overall average.",

    // ── Categorical signal cards ─────────────────────────────────────────────
    "eda.badge.signal":              "signal",
    "eda.badge.weak":                "weak",
    "eda.signal.billing.desc":       "Monthly subscribers churn at a meaningfully higher rate than yearly subscribers.",
    "eda.signal.priceinc.desc":      "Largest categorical deviation — users who saw a price hike are ~2× more likely to churn.",
    "eda.signal.plan.desc":          "All three plan tiers sit right at the overall average. Minimal predictive signal on its own.",
    "eda.signal.country.desc":       "Slight regional variation but no country deviates dramatically from the mean.",

    // ── Correlation ──────────────────────────────────────────────────────────
    "eda.chart.corr.title":          "Correlation with churn target (Pearson r) — bar width = absolute strength",
    "eda.chart.corr.caption":        "days_since_last_watch (r = +0.623) towers above all others. The near-zero values for all remaining features indicate the model must rely on non-linear interactions.",

    // ── Findings table ───────────────────────────────────────────────────────
    "eda.findings.th.num":           "#",
    "eda.findings.th.finding":       "Finding",
    "eda.findings.th.implication":   "Implication",
    "eda.findings.td.f1":            "Strong class imbalance: 76.7% Renews, 3.7% Cancels Early",
    "eda.findings.td.i1":            "Use class weighting; evaluate with F1 / ROC-AUC per class, not accuracy",
    "eda.findings.td.f2":            "<code>days_since_last_watch</code> r = +0.623 — far above all other features",
    "eda.findings.td.i2":            "Expected top feature; validate via SHAP post-training",
    "eda.findings.td.f3":            "Most continuous features have near-zero linear correlation with churn",
    "eda.findings.td.i3":            "Non-linear XGBoost interactions may capture patterns Pearson misses",
    "eda.findings.td.f4":            "Monthly subscribers churn at a higher rate than yearly",
    "eda.findings.td.i4":            "<code>billing_cycle</code> is a meaningful categorical signal",
    "eda.findings.td.f5":            "Price increase in last 6m is strongly associated with churn",
    "eda.findings.td.i5":            "<code>price_increase_last_6m</code> is a high-value boolean feature",
    "eda.findings.td.f6":            "No missing values in any predictive feature",
    "eda.findings.td.i6":            "No imputation needed; exclude <code>cancellation_date</code> from model inputs",
    "eda.findings.td.f7":            "Date fields required casting from string to datetime64",
    "eda.findings.td.i7":            "Pre-processing must cast types before any date-based feature engineering",
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

    "eda.sidebar.overview":          "Visão Geral",
    "eda.sidebar.dataset":           "Dataset & Configuração",
    "eda.sidebar.dtypes":            "Tipos de Dados",
    "eda.sidebar.missing":           "Valores Ausentes",
    "eda.sidebar.descriptive":       "Estatísticas Descritivas",
    "eda.sidebar.single":            "Variável Única",
    "eda.sidebar.churndist":         "Distribuição de Churn",
    "eda.sidebar.continuous":        "Features Contínuas",
    "eda.sidebar.categorical":       "Features Categóricas",
    "eda.sidebar.cancellation":      "Taxa de Cancelamento",
    "eda.sidebar.churnbygroup":      "Churn por Plano & Cobrança",
    "eda.sidebar.multi":             "Multivariável",
    "eda.sidebar.boxplots":          "Features vs Churn",
    "eda.sidebar.catvschurn":        "Categóricas vs Churn",
    "eda.sidebar.correlation":       "Correlação",
    "eda.sidebar.summary":           "Resumo",
    "eda.sidebar.findings":          "Principais Achados",

    "eda.overview.title":            "Visão Geral do <em>Dataset</em>",
    "eda.overview.p1":               "Dados extraídos do PostgreSQL via SQLAlchemy, unindo seis tabelas — usuários, assinaturas, engajamento, tickets de suporte, faturamento e rótulos de churn — todos vinculados por <code>user_id</code>. Resultado: <strong>10.000 linhas × 21 colunas</strong>.",
    "eda.overview.groups":           "Grupos de Colunas",

    "eda.dtypes.title":              "Correções de <em>Tipos de Dados</em>",
    "eda.dtypes.p1":                 "No carregamento inicial, todas as cinco colunas de data eram <code>object</code> (string). Convertidas antes da análise:",

    "eda.missing.title":             "Valores <em>Ausentes</em>",
    "eda.missing.p1":                "Apenas duas colunas contêm nulos — ambas esperadas por design. Todas as outras 19 colunas estão completamente preenchidas.",
    "eda.missing.callout":           "Nenhuma imputação necessária. O dataset está limpo e pronto para análise.",

    "eda.descriptive.title":         "Estatísticas <em>Descritivas</em>",
    "eda.descriptive.p1":            "As features contínuas mostram distribuições amplamente uniformes — consistentes com dados sintéticos projetados para cobrir uma grande variedade de perfis de usuários.",

    "eda.churndist.title":           "Distribuição de <em>Churn</em>",
    "eda.churndist.p1":              "A variável alvo <code>churn_type</code> é fortemente desequilibrada. A classe 0 domina com 76,7%; a classe 1 é a minoria crítica com apenas 3,7%.",
    "eda.churndist.callout":         "A Classe 1 (Cancela Antecipado) com 3,7% está severamente sub-representada. A acurácia sozinha será enganosa — use F1-score e ROC-AUC por classe, com ponderação de classes aplicada durante o treinamento.",

    "eda.continuous.title":          "Distribuições de Features <em>Contínuas</em>",
    "eda.continuous.p1":             "Distribuições quase uniformes na maioria das features refletem a natureza sintética do dataset. Os preços mensais e anuais são discretos — três valores por nível de plano. Falhas de pagamento e tickets são inteiros limitados.",

    "eda.categorical.title":         "Distribuições de Features <em>Categóricas</em>",
    "eda.categorical.p1":            "Planos e ciclos de cobrança são aproximadamente equilibrados. Os países abrangem múltiplas regiões. O aumento de preço é um booleano dividido aproximadamente de forma uniforme no dataset.",

    "eda.cancellation.title":        "Análise da Taxa de <em>Cancelamento</em>",
    "eda.cancellation.p1":           "15% dos usuários cancelaram formalmente. Assinantes mensais e expostos a aumentos de preço apresentam taxas de cancelamento mais elevadas.",

    "eda.churnbygroup.title":        "Tipo de Churn por Plano <em>&amp; Ciclo de Cobrança</em>",
    "eda.churnbygroup.p1":           "Distribuição percentual de churn_type dentro de cada grupo. Todos os segmentos são dominados por Renova (classe 0), consistente com a linha de base de 76,7%. Assinantes mensais mostram ligeiramente mais cancelamentos antecipados.",

    "eda.boxplots.title":            "Features Contínuas <em>vs Churn</em>",
    "eda.boxplots.p1":               "Intervalos IQR e medianas para cada feature dividida por classe de churn. <code>days_since_last_watch</code> mostra a única separação clara entre classes — usuários com churn não assistiram recentemente.",
    "eda.boxplots.callout":          "days_since_last_watch é o separador visual mais claro entre classes de churn. Usuários com churn (classes 1 e 2) mostram medianas mais altas e distribuições mais amplas do que os usuários que renovam — validando o resultado de correlação (r = +0,623).",

    "eda.catvschurn.title":          "Features Categóricas <em>vs Taxa de Churn</em>",
    "eda.catvschurn.p1":             "Taxa de churn (% com churn_type ≠ 0) por valor categórico. A marca vertical mostra a média geral de <strong>23,3%</strong>.",

    "eda.correlation.title":         "Correlação de <em>Features</em>",
    "eda.correlation.p1":            "Correlações de Pearson entre todas as 8 features contínuas e um indicador binário de churn (1 se churn_type ≠ 0), ordenadas por força absoluta.",
    "eda.correlation.callout":       "days_since_last_watch é de longe o preditor linear mais forte. Todas as outras features contínuas mostram correlação quase nula — sugerindo que interações não lineares e features categóricas carregam a maior parte do poder preditivo restante. É por isso que o XGBoost é bem adequado para este problema.",

    "eda.findings.title":            "Principais Achados <em>&amp; Implicações</em>",
    "eda.findings.p1":               "Resumo dos achados mais importantes da EDA e suas implicações para o pipeline de modelagem.",
    "eda.findings.output":           "Saída",
    "eda.findings.output.p":         "O DataFrame limpo foi exportado para Parquet para uso no notebook de modelagem:",

    // ── Overview stat cards ─────────────────────────────────────────────────
    "eda.stat.users":                "Usuários",
    "eda.stat.features":             "Features",
    "eda.stat.tables":               "Tabelas de Origem",
    "eda.stat.classes":              "Classes de Churn",

    // ── Overview table headers ───────────────────────────────────────────────
    "eda.overview.th.group":         "Grupo",
    "eda.overview.th.type":          "Tipo",
    "eda.overview.th.columns":       "Colunas",
    "eda.overview.td.continuous":    "Contínuas",
    "eda.overview.td.categorical":   "Categóricas",
    "eda.overview.td.date":          "Data",
    "eda.overview.td.target":        "Alvo",

    // ── Missing values table ─────────────────────────────────────────────────
    "eda.missing.th.column":         "Coluna",
    "eda.missing.th.nulls":          "Nulos",
    "eda.missing.th.reason":         "Motivo",
    "eda.missing.td.yearly":         "Preenchido apenas para assinantes anuais (~50% dos usuários).",
    "eda.missing.td.cancellation":   "Preenchido apenas quando o usuário de fato cancelou (15% dos usuários).",

    // ── Descriptive stats table ──────────────────────────────────────────────
    "eda.descriptive.th.feature":    "Feature",
    "eda.descriptive.th.min":        "Mín",
    "eda.descriptive.th.median":     "Mediana",
    "eda.descriptive.th.max":        "Máx",
    "eda.descriptive.th.std":        "Desvio Padrão",

    // ── Churn distribution ───────────────────────────────────────────────────
    "eda.stat.renews":               "Renova · 7.672 usuários",
    "eda.stat.cancels":              "Cancela Antecipado · 372 usuários",
    "eda.stat.wont":                 "Não Renova · 1.956 usuários",
    "eda.stat.cancelled":            "Cancelado Formalmente · 1.504",
    "eda.chart.cancelled.title":     "Flag de cancelamento",
    "eda.chart.cancelled.caption":   "85% dos usuários não cancelaram formalmente.",
    "eda.chart.churntype.title":     "Tipo de churn (alvo multiclasse)",
    "eda.chart.churntype.caption":   "A classe 1 está severamente sub-representada — apenas 372 usuários.",

    // ── Continuous distributions ─────────────────────────────────────────────
    "eda.chart.watch.title":         "Horas médias assistidas / semana",
    "eda.chart.watch.caption":       "Uniforme 0–20 hrs, média ~10.",
    "eda.chart.days.title":          "Dias desde a última visualização",
    "eda.chart.days.caption":        "Uniforme 0–60 dias, média ~30. Maior preditor de churn.",
    "eda.chart.logins.title":        "Logins / semana",
    "eda.chart.logins.caption":      "Uniforme 0–20, média ~10.",
    "eda.chart.completion.title":    "Taxa de conclusão",
    "eda.chart.completion.caption":  "Uniforme 0,20–1,00, média ~0,60.",
    "eda.chart.price.title":         "Preço mensal (USD) — discreto",
    "eda.chart.price.caption":       "Três faixas de preço mapeando diretamente para os níveis de plano.",
    "eda.chart.failures.title":      "Falhas de pagamento — máximo 2",
    "eda.chart.failures.caption":    "Inteiro limitado — máx 2, média 1,00.",

    // ── Categorical distributions ────────────────────────────────────────────
    "eda.chart.plan.title":          "Nível de plano",
    "eda.chart.plan.caption":        "Perfeitamente equilibrado entre os três níveis de plano.",
    "eda.chart.billing.title":       "Ciclo de cobrança",
    "eda.chart.billing.caption":     "Divisão quase igual entre mensal e anual (~50/50).",
    "eda.chart.priceinc.title":      "Aumento de preço nos últimos 6 meses",
    "eda.chart.priceinc.caption":    "Quase metade da base de usuários passou por um aumento recente de preço.",
    "eda.chart.country.title":       "País (amostra representativa)",
    "eda.chart.country.caption":     "Múltiplas regiões sem nenhum país dominante.",

    // ── Cancellation analysis ────────────────────────────────────────────────
    "eda.chart.cancel.billing.title":   "Taxa de cancelamento &amp; churn por ciclo de cobrança",
    "eda.chart.cancel.rate":            "Taxa de cancelamento",
    "eda.chart.churn.rate":             "Taxa de churn (tipo ≠ 0)",
    "eda.chart.cancel.billing.caption": "Assinantes mensais têm uma probabilidade significativamente maior de cancelar — consistente com menor comprometimento.",
    "eda.chart.cancel.plan.title":      "Taxa de cancelamento por plano",
    "eda.chart.cancel.plan.caption":    "Amplamente semelhante entre os níveis de plano — nenhum nível se destaca.",

    // ── Churn by group ───────────────────────────────────────────────────────
    "eda.chart.churnplan.title":     "Tipo de churn por plano (%)",
    "eda.chart.churnplan.caption":   "A distribuição é amplamente consistente entre os níveis de plano.",
    "eda.chart.churnbilling.title":  "Tipo de churn por ciclo de cobrança (%)",
    "eda.chart.churnbilling.caption":"Assinantes mensais mostram uma proporção ligeiramente maior de cancelamentos antecipados em relação aos anuais.",

    // ── Box plots ────────────────────────────────────────────────────────────
    "eda.chart.box.title":           "Distribuição de features por classe de churn — IQR + mediana",
    "eda.chart.box.caption":         "Cada linha de caixas mostra o IQR (25º–75º percentil) com um marcador de mediana por classe. days_since_last_watch é a única feature com separação visual significativa.",

    // ── Categorical vs churn ─────────────────────────────────────────────────
    "eda.chart.cvsc.billing.title":   "Taxa de churn por ciclo de cobrança &mdash; média 23,3%",
    "eda.chart.cvsc.billing.caption": "Mensal acima da média; anual abaixo. Linha vertical = média 23,3%.",
    "eda.chart.cvsc.priceinc.title":  "Taxa de churn por aumento de preço &mdash; média 23,3%",
    "eda.chart.cvsc.priceinc.caption":"Maior desvio da média — usuários com aumento de preço têm ~2× mais probabilidade de churn.",
    "eda.chart.cvsc.plan.title":      "Taxa de churn por plano &mdash; média 23,3%",
    "eda.chart.cvsc.plan.caption":    "Variação mínima — os três níveis de plano ficam próximos da média geral.",
    "eda.chart.cvsc.country.title":   "Taxa de churn por país (amostra) &mdash; média 23,3%",
    "eda.chart.cvsc.country.caption": "Existem sinais regionais, mas são fracos — todos próximos da média geral.",

    // ── Categorical signal cards ─────────────────────────────────────────────
    "eda.badge.signal":              "sinal",
    "eda.badge.weak":                "fraco",
    "eda.signal.billing.desc":       "Assinantes mensais cancelam a uma taxa significativamente maior do que os anuais.",
    "eda.signal.priceinc.desc":      "Maior desvio categórico — usuários que sofreram aumento de preço têm ~2× mais probabilidade de churn.",
    "eda.signal.plan.desc":          "Os três níveis de plano ficam bem na média geral. Sinal preditivo mínimo por si só.",
    "eda.signal.country.desc":       "Leve variação regional, mas nenhum país desvia dramaticamente da média.",

    // ── Correlation ──────────────────────────────────────────────────────────
    "eda.chart.corr.title":          "Correlação com o alvo de churn (Pearson r) — largura da barra = força absoluta",
    "eda.chart.corr.caption":        "days_since_last_watch (r = +0,623) está muito acima de todas as outras. Os valores próximos de zero para todas as features restantes indicam que o modelo precisa depender de interações não lineares.",

    // ── Findings table ───────────────────────────────────────────────────────
    "eda.findings.th.num":           "#",
    "eda.findings.th.finding":       "Achado",
    "eda.findings.th.implication":   "Implicação",
    "eda.findings.td.f1":            "Forte desequilíbrio de classes: 76,7% Renova, 3,7% Cancela Antecipado",
    "eda.findings.td.i1":            "Use ponderação de classes; avalie com F1 / ROC-AUC por classe, não acurácia",
    "eda.findings.td.f2":            "<code>days_since_last_watch</code> r = +0,623 — muito acima de todas as outras features",
    "eda.findings.td.i2":            "Feature principal esperada; validar via SHAP após o treinamento",
    "eda.findings.td.f3":            "A maioria das features contínuas tem correlação linear quase nula com o churn",
    "eda.findings.td.i3":            "Interações não lineares do XGBoost podem capturar padrões que o Pearson não detecta",
    "eda.findings.td.f4":            "Assinantes mensais cancelam a uma taxa maior do que os anuais",
    "eda.findings.td.i4":            "<code>billing_cycle</code> é um sinal categórico relevante",
    "eda.findings.td.f5":            "Aumento de preço nos últimos 6 meses está fortemente associado ao churn",
    "eda.findings.td.i5":            "<code>price_increase_last_6m</code> é uma feature booleana de alto valor",
    "eda.findings.td.f6":            "Nenhum valor ausente em qualquer feature preditiva",
    "eda.findings.td.i6":            "Nenhuma imputação necessária; excluir <code>cancellation_date</code> das entradas do modelo",
    "eda.findings.td.f7":            "Campos de data precisaram de conversão de string para datetime64",
    "eda.findings.td.i7":            "O pré-processamento deve converter os tipos antes de qualquer engenharia de features baseada em data",
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