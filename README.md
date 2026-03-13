# Streaming Churn Prediction

A full-stack churn prediction system for a streaming service. Users are classified into one of three churn categories using an XGBoost multiclass classifier trained on historical data pulled from PostgreSQL. The model is deployed to a FastAPI backend on Render, which queries a separate set of test tables to serve live predictions to a static frontend dashboard.

**Live demo:** [streaming-churn-case](https://lauratamari.github.io/streaming-churn-case/)

---

## What it does

- Predicts subscriber churn into three classes: **Renews**, **Cancels Early**, or **Won't Renew**
- Serves live predictions from a PostgreSQL-backed REST API
- Displays results on an interactive dashboard with filters, a single-user lookup, and a full predictions table
- Includes a full EDA page and a technical documentation page
- Supports **EN / PT** language toggle across all three pages

---

## Tech Stack

| Layer | Technology |
|---|---|
| ML model | XGBoost (multiclass classifier) |
| Training | Python, pandas, scikit-learn, XGBoost |
| Database | PostgreSQL (via psycopg2 + SQLAlchemy) |
| Backend API | FastAPI, deployed on Render |
| Frontend | Vanilla HTML / CSS / JS (no framework) |
| EDA | Jupyter Notebook |

---

## Project Structure

```
streaming-churn-case/
├── index.html          # Dashboard — live predictions, filters, lookup
├── docs.html           # Technical documentation
├── eda.html            # Exploratory data analysis
├── style.css           # Dashboard styles
├── style_docs.css      # Docs styles
├── style_eda.css       # EDA styles
├── script.js           # Dashboard logic + EN/PT i18n
├── script_docs.js      # Docs i18n
├── script_eda.js       # EDA i18n + chart rendering
└── README.md
```

The backend, model training notebooks, and database seeding scripts live in a separate repository.

---

## ML Pipeline

**Data:** 10,000 users joined across 6 PostgreSQL tables — users, subscriptions, engagement, support tickets, billing, and churn labels.

**Churn label logic:** Assigned probabilistically using a weighted score to avoid purely deterministic labels, which would let the model memorise the rule rather than learn from features.

**Feature engineering:** Raw data was transformed from 15 → 31 columns. The same `build_features()` function runs in both the training notebook and the FastAPI serving layer to guarantee consistency.

**Model selection:** Logistic Regression, Random Forest, and XGBoost were all trained and compared on a held-out test set of 2,000 users (80/20 stratified split). XGBoost was selected based on best macro F1.

**Class imbalance:** *Cancels Early* accounts for only 3.7% of users. Sample weights were applied during training to prevent the model from ignoring this minority class.

**Persistence:** The trained pipeline and exact feature column order are saved to disk and loaded by the API at serve time.

---

## API Endpoints

The backend is deployed at `https://streaming-churn-case.onrender.com`.

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/filters` | Returns available countries, plans, and billing cycles |
| `GET` | `/predict` | Returns predictions for all test users, with optional filters (`country`, `plan`, `billing_cycle`). Includes a summary object with class counts |
| `GET` | `/predict/{user_id}` | Returns the prediction for a single user by ID |

---

## Database Design

Two sets of tables share the same PostgreSQL database, both linked by `user_id`:

- **Training tables** (6 tables · 10,000 users) — seeded by `seed_database.py`, includes a `churn_labels` table with ground truth
- **Test tables** (5 tables · 150 users) — seeded by `test_data.py`, mirrors the training schema but omits `churn_labels` entirely; the API predicts their churn class live

Credentials are loaded from a `.env` file via `python-dotenv` and are never committed to version control.

---

## Frontend

Three static HTML pages with no build step or framework:

- **Dashboard (`index.html`)** — fetches from `/predict` on load, populates filter dropdowns from `/filters`, animates summary cards, renders a bar chart and a paginated predictions table, and supports single-user lookup via `/predict/{id}`
- **Documentation (`docs.html`)** — architecture overview, database schema, ML pipeline walkthrough, API reference, and JS function documentation
- **EDA (`eda.html`)** — inline SVG/HTML charts covering churn distribution, continuous and categorical feature distributions, cancellation analysis, box plots, categorical vs churn rates, Pearson correlation, and a key findings table

All three pages share a common header, nav, language toggle, and footer. Language preference is persisted in `localStorage`.

---

## Running locally

The frontend is fully static — open any `.html` file directly in a browser. It will call the deployed Render API automatically.

To run the backend locally, see the backend repository for setup instructions including PostgreSQL configuration and `.env` setup.

---

## Author

Laura Tamari · [lauratamari.github.io](https://lauratamari.github.io) · [GitHub](https://github.com/lauratamari)
