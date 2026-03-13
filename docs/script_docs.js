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

    "docs.sidebar.overview":         "Overview",
    "docs.sidebar.project":          "Project",
    "docs.sidebar.architecture":     "Architecture",
    "docs.sidebar.database":         "Database",
    "docs.sidebar.schema":           "Schema Design",
    "docs.sidebar.connection":       "Connection Setup",
    "docs.sidebar.seeding":          "Seeding Data",
    "docs.sidebar.churnlabel":       "Churn Label Logic",
    "docs.sidebar.ml":               "ML Pipeline",
    "docs.sidebar.feature":          "Feature Engineering",
    "docs.sidebar.model":            "Model Details",
    "docs.sidebar.results":          "Results & Scores",
    "docs.sidebar.classes":          "Churn Classes",
    "docs.sidebar.frontend":         "Frontend",
    "docs.sidebar.state":            "State & DOM",
    "docs.sidebar.functions":        "JS Functions",
    "docs.sidebar.api":              "API",
    "docs.sidebar.endpoints":        "Endpoints",
    "docs.sidebar.responses":        "Response Shapes",

    "docs.overview.title":           "Project <em>Overview</em>",
    "docs.overview.p1":              "A full-stack churn prediction system for a streaming service. Users are classified into one of three churn categories using an XGBoost multiclass classifier trained in Python on historical data pulled from PostgreSQL. The trained model is deployed to a FastAPI backend on Render, which queries a separate set of test tables — stored in the same PostgreSQL database — to serve live predictions to the dashboard.",
    "docs.overview.goal":            "Goal",
    "docs.overview.goal.p":          "Predict which subscribers are likely to leave — split into three outcomes (<span class=\"tag tag-0\">Renews</span> <span class=\"tag tag-1\">Cancels Early</span> <span class=\"tag tag-2\">Won't Renew</span>) — enabling targeted retention strategies rather than treating all at-risk users the same.",
    "docs.overview.stack":           "Tech Stack",
    "docs.overview.th.layer":        "Layer",
    "docs.overview.th.tech":         "Technology",
    "docs.overview.th.purpose":      "Purpose",

    "docs.arch.title":               "<em>Architecture</em>",
    "docs.arch.training":            "Training Pipeline",
    "docs.arch.serving":             "Serving Pipeline",
    "docs.arch.note":                "Training and test tables live in the same PostgreSQL database — the API queries the <code style=\"font-size:.6rem;color:inherit\">*_test</code> tables directly at request time.",

    "docs.db.title":                 "Database <em>Design</em>",
    "docs.db.p1":                    "The project uses a single PostgreSQL database with two sets of tables — training tables and test tables — all connected via <code>user_id</code> as a foreign key. The schema separates concerns clearly: user demographics, subscription info, engagement behaviour, support history, and billing are each stored independently.",
    "docs.db.training.label":        "Training Tables — 6 tables · 10,000 users",
    "docs.db.training.p":            "Seeded by <code>seed_database.py</code>. Includes a <code>churn_labels</code> table with the ground truth used to train the model.",
    "docs.db.test.label":            "Test Tables — 5 tables · 150 users",
    "docs.db.test.p":                "Seeded by <code>test_data.py</code> into the same database. Mirrors the training schema but omits <code>churn_labels</code> entirely — these users have no ground truth; their churn class is predicted live by the deployed model.",
    "docs.db.th.table":              "Table",
    "docs.db.th.columns":            "Key Columns",

    "docs.conn.title":               "Connection <em>Setup</em>",
    "docs.conn.p1":                  "The database connection is handled in <code>database.py</code> using <code>psycopg2</code>. Credentials are never hardcoded — they are loaded from a <code>.env</code> file using <code>python-dotenv</code>, keeping sensitive information out of the codebase and out of version control.",
    "docs.conn.p2":                  "The <code>.env</code> file is never committed to version control (added to <code>.gitignore</code>). For EDA notebooks, the connection was upgraded to <code>SQLAlchemy</code> to avoid a pandas deprecation warning with raw psycopg2 connections — the same credentials are reused.",

    "docs.seed.title":               "Database <em>Seeding</em>",
    "docs.seed.p1":                  "Both databases were created entirely in Python — no SQL client or GUI was used. This makes setup fully reproducible: clone the project, configure <code>.env</code>, and run the script to recreate the database from scratch.",
    "docs.seed.sublabel":            "How seed_database.py works",
    "docs.seed.li1":                 "Generates user data (age, country, signup_date) for all <code>n</code> users and collects them in a list first.",
    "docs.seed.li2":                 "Inserts all users in a single batch using <code>execute_values</code> — much faster than inserting one row at a time.",
    "docs.seed.li3":                 "Retrieves all generated <code>user_id</code>s via <code>RETURNING user_id</code>, then builds related records for all other tables.",
    "docs.seed.li4":                 "Inserts each table's data in one bulk call.",
    "docs.seed.li5":                 "Wraps everything in a single transaction — if seeding fails halfway through, a rollback ensures no partial data is left.",
    "docs.seed.flow":                "Execution flow",

    "docs.churn.title":              "Churn <em>Label Logic</em>",
    "docs.churn.p1":                 "Churn is assigned probabilistically using a weighted score to avoid purely deterministic labels. A fully deterministic rule would allow the model to memorise the logic rather than learn from the features.",

    "docs.feat.title":               "Feature <em>Engineering</em>",
    "docs.feat.p1":                  "Feature engineering transforms raw data into more informative inputs. After this step the dataset grew from 15 to 31 columns. The same <code>build_features()</code> logic runs in both the training notebook and in <code>main.py</code> at serving time, ensuring full consistency.",

    "docs.model.title":              "Model <em>Details</em>",
    "docs.model.p1":                 "Three classifiers were trained and compared — Logistic Regression, Random Forest, and XGBoost — all evaluated on a held-out test set of 2,000 users (80/20 stratified split). XGBoost was selected as the final model based on its best macro F1 score. After training, the pipeline and exact feature column order are persisted to disk.",
    "docs.model.config":             "Training Configuration",
    "docs.model.dist":               "Class Distribution (Training Data)",
    "docs.model.dist.p":             "The dataset is heavily imbalanced — <span class=\"tag tag-1\">Cancels Early</span> accounts for only 3.7% of users. Sample weights were used to prevent the model from ignoring this minority class.",
    "docs.model.compare":            "Model Comparison",
    "docs.model.compare.p":          "XGBoost was chosen for its highest macro F1 — the most meaningful metric given class imbalance. Raw accuracy is misleading here since a model that predicts only \"Renews\" would score 76%+ without learning anything useful.",
    "docs.model.perclass":           "XGBoost — Per-Class Results (Test Set, n = 2,000)",
    "docs.model.features":           "Top 15 Feature Importances",
    "docs.model.features.p":         "<code>days_since_last_watch</code> dominates by a large margin, confirming the EDA finding (r = +0.37). The next strongest signals are billing-related (<code>price_increase_last_6m</code>) and support volume (<code>tickets_last_30d</code>). Several country one-hot columns rank mid-table, reflecting geographic patterns in the synthetic data.",
    "docs.model.takeaways":          "Key Takeaways",
    "docs.model.li1":                "<strong>Renews</strong> and <strong>Won't Renew</strong> are predicted reliably — F1 of 0.92 and 0.69 respectively. These are the actionable majority classes for retention campaigns.",
    "docs.model.li2":                "<strong>Cancels Early</strong> (F1 = 0.07) is the hardest class by far — only 75 examples in the test set (3.7%). Even with sample weighting, the signal is too sparse for confident predictions. This is a known limitation of the synthetic data design.",
    "docs.model.li3":                "Random Forest achieved the highest ROC-AUC (0.9178) but scored 0.000 F1 on Cancels Early, meaning it never predicted that class at all. XGBoost's balanced approach makes it the better choice for real-world use.",
    "docs.model.li4":                "<code>days_since_last_watch</code> is the single most important feature by a wide margin — consistent with the EDA correlation analysis.",
    "docs.model.persist":            "Model Persistence",
    "docs.model.persist.p":          "The <code>feature_columns.json</code> file is critical — it ensures the serving API builds features in exactly the same column order the model was trained on via <code>align_columns()</code> in <code>main.py</code>.",

    "docs.classes.title":            "Churn <em>Classes</em>",

    "docs.state.title":              "State <em>&amp; DOM</em>",
    "docs.state.global":             "Global State",
    "docs.state.dom":                "Key DOM References",

    "docs.fns.title":                "JS <em>Functions</em>",

    "docs.endpoints.title":          "API <em>Endpoints</em>",
    "docs.endpoints.base":           "Base URL: <code>https://streaming-churn-case.onrender.com</code>",

    "docs.responses.title":          "Response <em>Shapes</em>",

    "docs.classes.th.index":         "Class Index",
    "docs.classes.th.label":         "Label",
    "docs.classes.th.tag":           "CSS Tag",
    "docs.classes.th.meaning":       "Meaning",
    "docs.classes.td.0":             "User is predicted to renew their subscription at the next cycle.",
    "docs.classes.td.1":             "User is predicted to cancel before their current period ends.",
    "docs.classes.td.2":             "User is predicted to let their subscription lapse at expiry without cancelling early.",

    "docs.feat.desc.engagement":     "A weighted composite of watch hours (40%), completion rate (40%), and logins (20%). Gives the model one clean pre-combined signal instead of three correlated features.",
    "docs.feat.desc.tenure":         "How long the user has been subscribed, in days. Captures loyalty — long-standing users tend to be stickier. Requires <code>signup_date</code> to be converted to datetime first (DATE columns from PostgreSQL are read as <code>object</code> dtype by pandas and must be converted manually).",
    "docs.feat.desc.inactive":       "Binary flag (0/1) for users inactive for over 30 days. Directly encodes the strongest EDA signal — <code>days_since_last_watch</code> had the highest churn correlation at r = +0.37. Converting to a binary threshold makes the decision boundary explicit. 49% of users are flagged as inactive.",
    "docs.feat.desc.billing":        "Flags users who have experienced both a price increase and a payment failure — a compound billing risk signal.",
    "docs.feat.desc.support":        "Binary flag for users with more than 3 support tickets in the last 30 days, indicating friction or dissatisfaction.",
    "docs.feat.desc.yearly":         "Binary encoding of billing cycle. Annual subscribers are generally stickier, making this relationship explicit for the model.",
    "docs.feat.desc.price":          "Normalises price to a monthly equivalent regardless of billing cycle, making price comparable across all users.",
    "docs.feat.desc.renewal":        "How many days until the user's next renewal. Users close to renewal with low engagement are at higher churn risk.",
    "docs.feat.desc.ohe":            "<code>country</code> and <code>plan</code> are one-hot encoded. <code>drop_first=False</code> keeps all categories. The exact column order is saved to <code>feature_columns.json</code> after training, so the API aligns features identically at prediction time via <code>align_columns()</code>.",

    "docs.state.td.predictions":     "Full list of prediction objects currently displayed. Updated on every filter apply.",
    "docs.state.td.cards":           "Summary card value spans, animated on data load.",
    "docs.state.td.filters":         "Filter <code>&lt;select&gt;</code> elements.",
    "docs.state.td.tbody":           "Table body for prediction rows.",
    "docs.state.td.lookup":          "Single-user lookup input and result panel.",

    "docs.fns.desc.loadFilters":     "Fetches available filter values from <code>GET /filters</code> and populates the three dropdown selects (country, plan, billing cycle) with <code>&lt;option&gt;</code> elements.",
    "docs.fns.desc.loadPredictions": "Reads current filter values, builds a query string, and fetches <code>GET /predict?\u2026</code>. On success, calls <code>updateSummary()</code>, <code>updateBarChart()</code>, and <code>renderTable()</code>. Manages loading state visibility.",
    "docs.fns.desc.updateSummary":   "Reads the summary object returned by the API and triggers animated count transitions on all four summary card values.",
    "docs.fns.desc.animateCount":    "Smoothly transitions a numeric text value from its current number to <code>target</code> over 500 ms using cubic ease-out via <code>requestAnimationFrame</code>.",
    "docs.fns.desc.updateBarChart":  "Rebuilds the bar chart HTML inside <code>#bar-chart</code> from the summary object. Each bar's width is set as an inline percentage, triggering the CSS transition on <code>.bar-fill</code>.",
    "docs.fns.desc.renderTable":     "Clears and rebuilds the predictions table using a <code>DocumentFragment</code> for performance. Each row gets a colored <code>.tag</code> badge based on <code>predicted_churn_type</code> (0, 1, or 2).",
    "docs.fns.desc.lookupUser":      "Reads the user ID from <code>#lookup-id</code> and calls <code>GET /predict/:id</code>. Renders a result card with country, plan, billing cycle, predicted class badge, and all three class probabilities as pill badges.",
    "docs.fns.desc.showLoading":     "Toggles visibility of the <code>#table-loading</code> overlay and clears the table body when entering loading state.",

    "docs.fns.param.sideeffects":    "Sets <code>allPredictions</code>, updates summary cards, bar chart, and table.",
    "docs.fns.param.stotal":         "Total user count across the current filter set.",
    "docs.fns.param.scounts":        "Per-class user counts.",
    "docs.fns.param.el":             "DOM element whose <code>textContent</code> is the animated counter.",
    "docs.fns.param.target":         "Final integer value to animate toward.",
    "docs.fns.param.predictions":    "Array of prediction objects from the API.",
    "docs.fns.param.show":           "<code>boolean</code> — <code>true</code> to show loading, <code>false</code> to hide.",

    "docs.responses.filters":        "GET /filters",
    "docs.responses.predict":        "GET /predict",
    "docs.responses.predictid":      "GET /predict/:id",

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
    "docs.sidebar.overview":         "Visão Geral",
    "docs.sidebar.project":          "Projeto",
    "docs.sidebar.architecture":     "Arquitetura",
    "docs.sidebar.database":         "Banco de Dados",
    "docs.sidebar.schema":           "Design do Schema",
    "docs.sidebar.connection":       "Configuração da Conexão",
    "docs.sidebar.seeding":          "Populando os Dados",
    "docs.sidebar.churnlabel":       "Lógica do Rótulo de Churn",
    "docs.sidebar.ml":               "Pipeline de ML",
    "docs.sidebar.feature":          "Engenharia de Features",
    "docs.sidebar.model":            "Detalhes do Modelo",
    "docs.sidebar.results":          "Resultados & Métricas",
    "docs.sidebar.classes":          "Classes de Churn",
    "docs.sidebar.frontend":         "Frontend",
    "docs.sidebar.state":            "Estado & DOM",
    "docs.sidebar.functions":        "Funções JS",
    "docs.sidebar.api":              "API",
    "docs.sidebar.endpoints":        "Endpoints",
    "docs.sidebar.responses":        "Formatos de Resposta",

    "docs.overview.title":           "Visão Geral do <em>Projeto</em>",
    "docs.overview.p1":              "Um sistema completo de previsão de churn para um serviço de streaming. Os usuários são classificados em uma de três categorias de churn usando um classificador multiclasse XGBoost treinado em Python com dados históricos extraídos do PostgreSQL. O modelo treinado é implantado em um backend FastAPI no Render, que consulta um conjunto separado de tabelas de teste — armazenadas no mesmo banco de dados PostgreSQL — para servir previsões ao vivo para o painel.",
    "docs.overview.goal":            "Objetivo",
    "docs.overview.goal.p":          "Prever quais assinantes têm probabilidade de sair — divididos em três resultados (<span class=\"tag tag-0\">Renova</span> <span class=\"tag tag-1\">Cancela Antecipado</span> <span class=\"tag tag-2\">Não Renova</span>) — permitindo estratégias de retenção direcionadas em vez de tratar todos os usuários em risco da mesma forma.",
    "docs.overview.stack":           "Stack Tecnológica",
    "docs.overview.th.layer":        "Camada",
    "docs.overview.th.tech":         "Tecnologia",
    "docs.overview.th.purpose":      "Propósito",

    "docs.arch.title":               "<em>Arquitetura</em>",
    "docs.arch.training":            "Pipeline de Treinamento",
    "docs.arch.serving":             "Pipeline de Servição",
    "docs.arch.note":                "As tabelas de treinamento e teste estão no mesmo banco de dados PostgreSQL — a API consulta as tabelas <code style=\"font-size:.6rem;color:inherit\">*_test</code> diretamente no momento da requisição.",

    "docs.db.title":                 "Design do <em>Banco de Dados</em>",
    "docs.db.p1":                    "O projeto usa um único banco de dados PostgreSQL com dois conjuntos de tabelas — tabelas de treinamento e tabelas de teste — todas conectadas via <code>user_id</code> como chave estrangeira. O schema separa as responsabilidades claramente: dados demográficos, informações de assinatura, comportamento de engajamento, histórico de suporte e faturamento são armazenados de forma independente.",
    "docs.db.training.label":        "Tabelas de Treinamento — 6 tabelas · 10.000 usuários",
    "docs.db.training.p":            "Populadas por <code>seed_database.py</code>. Inclui uma tabela <code>churn_labels</code> com a verdade fundamental usada para treinar o modelo.",
    "docs.db.test.label":            "Tabelas de Teste — 5 tabelas · 150 usuários",
    "docs.db.test.p":                "Populadas por <code>test_data.py</code> no mesmo banco de dados. Espelha o schema de treinamento, mas omite <code>churn_labels</code> completamente — esses usuários não têm verdade fundamental; sua classe de churn é prevista ao vivo pelo modelo implantado.",
    "docs.db.th.table":              "Tabela",
    "docs.db.th.columns":            "Colunas Principais",

    "docs.conn.title":               "Configuração da <em>Conexão</em>",
    "docs.conn.p1":                  "A conexão com o banco de dados é gerenciada em <code>database.py</code> usando <code>psycopg2</code>. As credenciais nunca são codificadas — são carregadas de um arquivo <code>.env</code> usando <code>python-dotenv</code>, mantendo informações sensíveis fora do código e do controle de versão.",
    "docs.conn.p2":                  "O arquivo <code>.env</code> nunca é enviado para o controle de versão (adicionado ao <code>.gitignore</code>). Para os notebooks de EDA, a conexão foi atualizada para <code>SQLAlchemy</code> a fim de evitar um aviso de depreciação do pandas com conexões brutas do psycopg2 — as mesmas credenciais são reutilizadas.",

    "docs.seed.title":               "Populando o <em>Banco de Dados</em>",
    "docs.seed.p1":                  "Ambos os bancos de dados foram criados inteiramente em Python — nenhum cliente SQL ou interface gráfica foi utilizado. Isso torna a configuração totalmente reproduzível: clone o projeto, configure o <code>.env</code> e execute o script para recriar o banco do zero.",
    "docs.seed.sublabel":            "Como o seed_database.py funciona",
    "docs.seed.li1":                 "Gera dados de usuários (idade, país, data de cadastro) para todos os <code>n</code> usuários e os coleta em uma lista primeiro.",
    "docs.seed.li2":                 "Insere todos os usuários em um único lote usando <code>execute_values</code> — muito mais rápido do que inserir uma linha por vez.",
    "docs.seed.li3":                 "Recupera todos os <code>user_id</code>s gerados via <code>RETURNING user_id</code>, depois constrói os registros relacionados para todas as outras tabelas.",
    "docs.seed.li4":                 "Insere os dados de cada tabela em uma única chamada em lote.",
    "docs.seed.li5":                 "Encapsula tudo em uma única transação — se o processo falhar no meio, um rollback garante que nenhum dado parcial seja deixado.",
    "docs.seed.flow":                "Fluxo de execução",

    "docs.churn.title":              "Lógica do <em>Rótulo de Churn</em>",
    "docs.churn.p1":                 "O churn é atribuído probabilisticamente usando uma pontuação ponderada para evitar rótulos puramente determinísticos. Uma regra totalmente determinística permitiria que o modelo memorizasse a lógica em vez de aprender com as features.",

    "docs.feat.title":               "Engenharia de <em>Features</em>",
    "docs.feat.p1":                  "A engenharia de features transforma dados brutos em entradas mais informativas. Após essa etapa, o dataset cresceu de 15 para 31 colunas. A mesma lógica <code>build_features()</code> roda tanto no notebook de treinamento quanto em <code>main.py</code> no momento de servir, garantindo total consistência.",

    "docs.model.title":              "Detalhes do <em>Modelo</em>",
    "docs.model.p1":                 "Três classificadores foram treinados e comparados — Regressão Logística, Random Forest e XGBoost — todos avaliados em um conjunto de teste separado de 2.000 usuários (divisão estratificada 80/20). O XGBoost foi selecionado como modelo final com base no melhor F1 macro. Após o treinamento, o pipeline e a ordem exata das colunas de features são persistidos em disco.",
    "docs.model.config":             "Configuração de Treinamento",
    "docs.model.dist":               "Distribuição das Classes (Dados de Treinamento)",
    "docs.model.dist.p":             "O dataset é fortemente desequilibrado — <span class=\"tag tag-1\">Cancela Antecipado</span> representa apenas 3,7% dos usuários. Pesos de amostragem foram usados para evitar que o modelo ignorasse essa classe minoritária.",
    "docs.model.compare":            "Comparação de Modelos",
    "docs.model.compare.p":          "O XGBoost foi escolhido pelo maior F1 macro — a métrica mais significativa dado o desequilíbrio de classes. A acurácia bruta é enganosa aqui, pois um modelo que prevê apenas \"Renova\" atingiria mais de 76% sem aprender nada útil.",
    "docs.model.perclass":           "XGBoost — Resultados por Classe (Conjunto de Teste, n = 2.000)",
    "docs.model.features":           "Top 15 Importâncias de Features",
    "docs.model.features.p":         "<code>days_since_last_watch</code> domina por uma grande margem, confirmando o achado da EDA (r = +0,37). Os próximos sinais mais fortes são relacionados a faturamento (<code>price_increase_last_6m</code>) e volume de suporte (<code>tickets_last_30d</code>). Várias colunas one-hot de país ficam no meio da tabela, refletindo padrões geográficos nos dados sintéticos.",
    "docs.model.takeaways":          "Principais Conclusões",
    "docs.model.li1":                "<strong>Renova</strong> e <strong>Não Renova</strong> são previstos de forma confiável — F1 de 0,92 e 0,69 respectivamente. Estas são as classes majoritárias acionáveis para campanhas de retenção.",
    "docs.model.li2":                "<strong>Cancela Antecipado</strong> (F1 = 0,07) é a classe mais difícil — apenas 75 exemplos no conjunto de teste (3,7%). Mesmo com ponderação de amostras, o sinal é muito escasso para previsões confiantes. Esta é uma limitação conhecida do design dos dados sintéticos.",
    "docs.model.li3":                "O Random Forest atingiu o maior ROC-AUC (0,9178) mas obteve F1 = 0,000 em Cancela Antecipado, ou seja, nunca previu essa classe. A abordagem equilibrada do XGBoost o torna a melhor escolha para uso no mundo real.",
    "docs.model.li4":                "<code>days_since_last_watch</code> é de longe a feature individual mais importante — consistente com a análise de correlação da EDA.",
    "docs.model.persist":            "Persistência do Modelo",
    "docs.model.persist.p":          "O arquivo <code>feature_columns.json</code> é essencial — garante que a API de servição construa as features exatamente na mesma ordem de colunas com a qual o modelo foi treinado, via <code>align_columns()</code> em <code>main.py</code>.",

    "docs.classes.title":            "Classes de <em>Churn</em>",

    "docs.state.title":              "Estado <em>&amp; DOM</em>",
    "docs.state.global":             "Estado Global",
    "docs.state.dom":                "Referências DOM Principais",

    "docs.fns.title":                "Funções <em>JS</em>",

    "docs.endpoints.title":          "Endpoints da <em>API</em>",
    "docs.endpoints.base":           "URL Base: <code>https://streaming-churn-case.onrender.com</code>",

    "docs.responses.title":          "Formatos de <em>Resposta</em>",

    "docs.classes.th.index":         "\u00cdndice da Classe",
    "docs.classes.th.label":         "R\u00f3tulo",
    "docs.classes.th.tag":           "Tag CSS",
    "docs.classes.th.meaning":       "Significado",
    "docs.classes.td.0":             "Previs\u00e3o de renova\u00e7\u00e3o na pr\u00f3xima data de ciclo.",
    "docs.classes.td.1":             "Previs\u00e3o de cancelamento antes do t\u00e9rmino do per\u00edodo atual.",
    "docs.classes.td.2":             "Previs\u00e3o de deixar a assinatura expirar sem cancelar antecipadamente.",

    "docs.feat.desc.engagement":     "Composto ponderado de horas assistidas (40%), taxa de conclus\u00e3o (40%) e logins (20%). Fornece ao modelo um sinal \u00fanico pr\u00e9-combinado em vez de tr\u00eas features correlacionadas.",
    "docs.feat.desc.tenure":         "H\u00e1 quantos dias o usu\u00e1rio est\u00e1 inscrito. Captura fidelidade \u2014 usu\u00e1rios de longa data tendem a ser mais est\u00e1veis. Requer que <code>signup_date</code> seja convertida para datetime primeiro (colunas DATE do PostgreSQL s\u00e3o lidas como dtype <code>object</code> pelo pandas e precisam ser convertidas manualmente).",
    "docs.feat.desc.inactive":       "Flag bin\u00e1ria (0/1) para usu\u00e1rios inativos h\u00e1 mais de 30 dias. Codifica diretamente o sinal mais forte da EDA \u2014 <code>days_since_last_watch</code> teve a maior correla\u00e7\u00e3o com churn em r = +0,37. Converter para um limiar bin\u00e1rio torna o limite de decis\u00e3o expl\u00edcito. 49% dos usu\u00e1rios s\u00e3o marcados como inativos.",
    "docs.feat.desc.billing":        "Sinaliza usu\u00e1rios que sofreram tanto um aumento de pre\u00e7o quanto uma falha de pagamento \u2014 um sinal composto de risco de faturamento.",
    "docs.feat.desc.support":        "Flag bin\u00e1ria para usu\u00e1rios com mais de 3 tickets de suporte nos \u00faltimos 30 dias, indicando atrito ou insatisfa\u00e7\u00e3o.",
    "docs.feat.desc.yearly":         "Codifica\u00e7\u00e3o bin\u00e1ria do ciclo de cobran\u00e7a. Assinantes anuais tendem a ser mais est\u00e1veis, tornando essa rela\u00e7\u00e3o expl\u00edcita para o modelo.",
    "docs.feat.desc.price":          "Normaliza o pre\u00e7o para um equivalente mensal independentemente do ciclo de cobran\u00e7a, tornando o pre\u00e7o compar\u00e1vel entre todos os usu\u00e1rios.",
    "docs.feat.desc.renewal":        "Quantos dias at\u00e9 a pr\u00f3xima renova\u00e7\u00e3o do usu\u00e1rio. Usu\u00e1rios pr\u00f3ximos \u00e0 renova\u00e7\u00e3o com baixo engajamento t\u00eam maior risco de churn.",
    "docs.feat.desc.ohe":            "<code>country</code> e <code>plan</code> s\u00e3o codificados com one-hot. <code>drop_first=False</code> mant\u00e9m todas as categorias. A ordem exata das colunas \u00e9 salva em <code>feature_columns.json</code> ap\u00f3s o treinamento, para que a API alinhe as features de forma id\u00eantica no momento da previs\u00e3o via <code>align_columns()</code>.",

    "docs.state.td.predictions":     "Lista completa dos objetos de previs\u00e3o exibidos atualmente. Atualizada a cada aplica\u00e7\u00e3o de filtro.",
    "docs.state.td.cards":           "Spans de valor dos cards de resumo, com anima\u00e7\u00e3o ao carregar os dados.",
    "docs.state.td.filters":         "Elementos <code>&lt;select&gt;</code> dos filtros.",
    "docs.state.td.tbody":           "Corpo da tabela para as linhas de previs\u00e3o.",
    "docs.state.td.lookup":          "Campo de entrada e painel de resultado da busca por usu\u00e1rio.",

    "docs.fns.desc.loadFilters":     "Busca os valores de filtro dispon\u00edveis em <code>GET /filters</code> e preenche os tr\u00eas selects (pa\u00eds, plano, ciclo de cobran\u00e7a) com elementos <code>&lt;option&gt;</code>.",
    "docs.fns.desc.loadPredictions": "L\u00ea os valores atuais dos filtros, constr\u00f3i uma query string e faz a requisi\u00e7\u00e3o para <code>GET /predict?\u2026</code>. Em caso de sucesso, chama <code>updateSummary()</code>, <code>updateBarChart()</code> e <code>renderTable()</code>. Gerencia a visibilidade do estado de carregamento.",
    "docs.fns.desc.updateSummary":   "L\u00ea o objeto de resumo retornado pela API e aciona as transi\u00e7\u00f5es de contagem animadas nos quatro cards de resumo.",
    "docs.fns.desc.animateCount":    "Transiciona suavemente um valor num\u00e9rico do n\u00famero atual at\u00e9 <code>target</code> em 500 ms, usando ease-out c\u00fabico via <code>requestAnimationFrame</code>.",
    "docs.fns.desc.updateBarChart":  "Reconstr\u00f3i o HTML do gr\u00e1fico de barras dentro de <code>#bar-chart</code> a partir do objeto de resumo. A largura de cada barra \u00e9 definida como percentual inline, acionando a transi\u00e7\u00e3o CSS em <code>.bar-fill</code>.",
    "docs.fns.desc.renderTable":     "Limpa e reconstr\u00f3i a tabela de previs\u00f5es usando um <code>DocumentFragment</code> para desempenho. Cada linha recebe um badge colorido <code>.tag</code> com base em <code>predicted_churn_type</code> (0, 1 ou 2).",
    "docs.fns.desc.lookupUser":      "L\u00ea o ID do usu\u00e1rio de <code>#lookup-id</code> e chama <code>GET /predict/:id</code>. Renderiza um card de resultado com pa\u00eds, plano, ciclo de cobran\u00e7a, badge da classe prevista e as tr\u00eas probabilidades de classe como pill badges.",
    "docs.fns.desc.showLoading":     "Alterna a visibilidade do overlay <code>#table-loading</code> e limpa o corpo da tabela ao entrar no estado de carregamento.",

    "docs.fns.param.sideeffects":    "Define <code>allPredictions</code>, atualiza os cards de resumo, gr\u00e1fico de barras e tabela.",
    "docs.fns.param.stotal":         "Contagem total de usu\u00e1rios no conjunto de filtros atual.",
    "docs.fns.param.scounts":        "Contagem de usu\u00e1rios por classe.",
    "docs.fns.param.el":             "Elemento DOM cujo <code>textContent</code> \u00e9 o contador animado.",
    "docs.fns.param.target":         "Valor inteiro final para o qual animar.",
    "docs.fns.param.predictions":    "Array de objetos de previs\u00e3o da API.",
    "docs.fns.param.show":           "<code>boolean</code> \u2014 <code>true</code> para exibir o carregamento, <code>false</code> para ocultar.",

    "docs.responses.filters":        "GET /filters",
    "docs.responses.predict":        "GET /predict",
    "docs.responses.predictid":      "GET /predict/:id",

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