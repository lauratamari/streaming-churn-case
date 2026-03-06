import json
import logging
import numpy as np
import pandas as pd
from datetime import datetime
from pathlib import Path
from typing import Optional

import joblib
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from database import get_connection

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

MODEL_PATH     = Path("models/xgboost_churn.pkl")
FEATURES_PATH  = Path("models/feature_columns.json")

CHURN_LABELS = {0: "Renews", 1: "Cancels Early", 2: "Won't Renew"}

# ── load model once at startup ────────────────────────────────────────────────
pipeline: object = None
model_features: list[str] = []

@asynccontextmanager
async def lifespan(app: FastAPI):
    global pipeline, model_features
    if not MODEL_PATH.exists():
        raise RuntimeError(f"Model not found at {MODEL_PATH}")
    if not FEATURES_PATH.exists():
        raise RuntimeError(f"Feature columns not found at {FEATURES_PATH}")

    pipeline = joblib.load(MODEL_PATH)
    with open(FEATURES_PATH) as f:
        model_features = json.load(f)
    logger.info("Model loaded successfully.")

    yield  # app runs here


app = FastAPI(title="Churn Prediction API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://lauratamari.github.io",
        "http://localhost:5500",
        "http://127.0.0.1:5500",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── helpers ───────────────────────────────────────────────────────────────────
def fetch_users(user_ids: list[int] | None = None) -> pd.DataFrame:
    connection = get_connection()
    cursor = connection.cursor()
    cursor.execute("SET search_path TO test_data")

    filter_clause = ""
    params = ()
    if user_ids:
        filter_clause = "WHERE u.user_id = ANY(%s)"
        params = (user_ids,)

    cursor.execute(f"""
        SELECT
            u.user_id, u.age, u.country, u.signup_date,
            s.plan, s.billing_cycle, s.monthly_price, s.yearly_price,
            s.last_renewal_date, s.next_renewal_date, s.start_date,
            e.avg_watch_hours_per_week, e.number_of_logins_per_week,
            e.days_since_last_watch, e.completion_rate,
            st.tickets_last_30d,
            b.price_increase_last_6m, b.payment_failures
        FROM users u
        JOIN subscriptions s    ON u.user_id = s.user_id
        JOIN engagement e       ON u.user_id = e.user_id
        JOIN support_tickets st ON u.user_id = st.user_id
        JOIN billing b          ON u.user_id = b.user_id
        {filter_clause}
    """, params)

    rows = cursor.fetchall()
    cols = [d[0] for d in cursor.description]
    cursor.close()
    connection.close()

    df = pd.DataFrame(rows, columns=cols)
    for c in ["avg_watch_hours_per_week", "completion_rate", "monthly_price", "yearly_price"]:
        if c in df.columns:
            df[c] = df[c].astype(float)
    return df


def build_features(df: pd.DataFrame) -> pd.DataFrame:
    ref = pd.Timestamp(datetime.now().date())
    df["signup_date"]       = pd.to_datetime(df["signup_date"])
    df["next_renewal_date"] = pd.to_datetime(df["next_renewal_date"])

    df["engagement_score"] = (
        df["completion_rate"] * 0.4 +
        (df["avg_watch_hours_per_week"] / 20) * 0.4 +
        (df["number_of_logins_per_week"] / 20) * 0.2
    )
    df["tenure_days"]            = (ref - df["signup_date"]).dt.days
    df["is_inactive"]            = (df["days_since_last_watch"] > 30).astype(int)
    df["high_risk_billing"]      = ((df["price_increase_last_6m"] == True) & (df["payment_failures"] > 0)).astype(int)
    df["high_support"]           = (df["tickets_last_30d"] > 3).astype(int)
    df["is_yearly"]              = (df["billing_cycle"] == "yearly").astype(int)
    df["effective_monthly_price"] = np.where(df["billing_cycle"] == "yearly", df["yearly_price"] / 12, df["monthly_price"])
    df["days_until_renewal"]     = (df["next_renewal_date"] - ref).dt.days.clip(lower=0)
    df["price_increase_last_6m"] = df["price_increase_last_6m"].astype(int)

    df = pd.get_dummies(df, columns=["country", "plan"], drop_first=False)
    df = df.drop(columns=["user_id", "signup_date", "start_date", "billing_cycle",
                           "yearly_price", "last_renewal_date", "next_renewal_date",
                           "monthly_price"], errors="ignore")
    return df


def align_columns(df: pd.DataFrame) -> pd.DataFrame:
    for col in model_features:
        if col not in df.columns:
            df[col] = 0
    extra = [c for c in df.columns if c not in model_features]
    return df.drop(columns=extra)[model_features]


def run_predictions(df_raw: pd.DataFrame) -> list[dict]:
    user_ids   = df_raw["user_id"].tolist()
    countries  = df_raw["country"].tolist()
    plans      = df_raw["plan"].tolist()
    cycles     = df_raw["billing_cycle"].tolist()

    features   = align_columns(build_features(df_raw.copy()))
    preds      = pipeline.predict(features)
    probs      = pipeline.predict_proba(features)

    results = []
    for i, uid in enumerate(user_ids):
        results.append({
            "user_id":             uid,
            "country":             countries[i],
            "plan":                plans[i],
            "billing_cycle":       cycles[i],
            "predicted_churn_type": int(preds[i]),
            "churn_label":         CHURN_LABELS[int(preds[i])],
            "prob_renews":         round(float(probs[i][0]), 4),
            "prob_cancels_early":  round(float(probs[i][1]), 4),
            "prob_wont_renew":     round(float(probs[i][2]), 4),
        })
    return results


# ── routes ────────────────────────────────────────────────────────────────────
@app.get("/predict")
def predict_all(
    country:       Optional[str] = Query(None),
    plan:          Optional[str] = Query(None),
    billing_cycle: Optional[str] = Query(None),
):
    """Return predictions for all users, with optional filters."""
    df = fetch_users()
    if df.empty:
        raise HTTPException(status_code=404, detail="No users found.")

    if country:
        df = df[df["country"] == country]
    if plan:
        df = df[df["plan"] == plan]
    if billing_cycle:
        df = df[df["billing_cycle"] == billing_cycle]

    if df.empty:
        return {"predictions": [], "summary": {}}

    predictions = run_predictions(df)

    summary = {
        "total": len(predictions),
        "renews":         sum(1 for p in predictions if p["predicted_churn_type"] == 0),
        "cancels_early":  sum(1 for p in predictions if p["predicted_churn_type"] == 1),
        "wont_renew":     sum(1 for p in predictions if p["predicted_churn_type"] == 2),
    }
    return {"predictions": predictions, "summary": summary}


@app.get("/predict/{user_id}")
def predict_user(user_id: int):
    """Return prediction for a single user."""
    df = fetch_users(user_ids=[user_id])
    if df.empty:
        raise HTTPException(status_code=404, detail=f"User {user_id} not found.")
    return run_predictions(df)[0]


@app.get("/filters")
def get_filters():
    """Return available filter values from the DB."""
    connection = get_connection()
    cursor = connection.cursor()
    cursor.execute("SET search_path TO test_data")
    cursor.execute("SELECT DISTINCT country FROM users ORDER BY country")
    countries = [r[0] for r in cursor.fetchall()]
    cursor.close()
    connection.close()
    return {
        "countries":      countries,
        "plans":          ["Basic", "Standard", "Premium"],
        "billing_cycles": ["monthly", "yearly"],
    }