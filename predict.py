# predict.py
import pandas as pd
import numpy as np
import joblib
from datetime import datetime

# load the saved model
MODEL_PATH = "models/xgboost_churn.pkl"
pipeline = joblib.load(MODEL_PATH)

CHURN_LABELS = {
    0: "Renews",
    1: "Cancels Early",
    2: "Won't Renew"
}

RISK_LABELS = {
    0: "Low Risk",
    1: "High Risk",
    2: "Medium Risk"
}


def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    """Apply the same feature engineering steps used during training."""
    df = df.copy()
    reference_date = pd.Timestamp(datetime.now().date())

    # date conversion
    date_cols = ["signup_date", "start_date", "cancellation_date",
                 "last_renewal_date", "next_renewal_date"]
    for col in date_cols:
        if col in df.columns:
            df[col] = pd.to_datetime(df[col])

    # engineered features
    df["engagement_score"] = (
        df["completion_rate"] * 0.4 +
        (df["avg_watch_hours_per_week"] / 20) * 0.4 +
        (df["number_of_logins_per_week"] / 20) * 0.2
    )
    df["tenure_days"] = (reference_date - df["signup_date"]).dt.days
    df["is_inactive"] = (df["days_since_last_watch"] > 30).astype(int)
    df["high_risk_billing"] = (
        (df["price_increase_last_6m"] == True) & (df["payment_failures"] > 0)
    ).astype(int)
    df["high_support"] = (df["tickets_last_30d"] > 3).astype(int)
    df["is_yearly"] = (df["billing_cycle"] == "yearly").astype(int)
    df["effective_monthly_price"] = np.where(
        df["billing_cycle"] == "yearly",
        df["yearly_price"] / 12,
        df["monthly_price"]
    )
    df["is_cancelled"] = df["cancelled"].astype(int)
    df["days_until_renewal"] = (
        df["next_renewal_date"] - reference_date
    ).dt.days.clip(lower=0)

    # encode categoricals
    df = pd.get_dummies(df, columns=["country", "plan"], drop_first=False)
    df["price_increase_last_6m"] = df["price_increase_last_6m"].astype(int)

    # drop raw columns
    df = df.drop(columns=[
        "user_id", "signup_date", "start_date", "billing_cycle",
        "yearly_price", "cancelled", "cancellation_date",
        "last_renewal_date", "next_renewal_date",
        "is_cancelled", "monthly_price"
    ], errors="ignore")

    # align columns with training data
    training_cols = pipeline.named_steps["scaler"].feature_names_in_
    for col in training_cols:
        if col not in df.columns:
            df[col] = 0  # fill missing dummy columns with 0
    df = df[training_cols]  # enforce column order

    return df


def predict(data: pd.DataFrame) -> pd.DataFrame:
    """Run prediction and return full report."""
    features = engineer_features(data)

    churn_type = pipeline.predict(features)
    probabilities = pipeline.predict_proba(features)

    results = data[["user_id"]].copy() if "user_id" in data.columns else pd.DataFrame()
    results["churn_type"] = churn_type
    results["churn_label"] = [CHURN_LABELS[c] for c in churn_type]
    results["risk_label"] = [RISK_LABELS[c] for c in churn_type]
    results["prob_renews"] = probabilities[:, 0].round(3)
    results["prob_cancels_early"] = probabilities[:, 1].round(3)
    results["prob_wont_renew"] = probabilities[:, 2].round(3)

    return results


def predict_from_csv(filepath: str) -> pd.DataFrame:
    """Load a CSV file and run predictions."""
    df = pd.read_csv('data/test_users.csv')
    print(f"Loaded {len(df)} records from {filepath}")
    return predict(df)


def predict_from_dict(user: dict) -> pd.DataFrame:
    """Accept a single user as a dictionary and run prediction."""
    df = pd.DataFrame([user])
    return predict(df)


if __name__ == "__main__":
    # --- example: CSV input ---
    # results = predict_from_csv("data/new_users.csv")
    # print(results)

    # --- example: manual dict input ---
    example_user = {
        "user_id": 9999,
        "age": 34,
        "country": "Brazil",
        "plan": "Basic",
        "billing_cycle": "monthly",
        "monthly_price": 9.99,
        "yearly_price": None,
        "cancelled": False,
        "cancellation_date": None,
        "signup_date": "2023-01-15",
        "start_date": "2023-01-15",
        "last_renewal_date": "2024-12-15",
        "next_renewal_date": "2025-01-15",
        "avg_watch_hours_per_week": 1.5,
        "number_of_logins_per_week": 1,
        "days_since_last_watch": 45,
        "completion_rate": 0.3,
        "tickets_last_30d": 4,
        "price_increase_last_6m": True,
        "payment_failures": 2
    }

    results = predict_from_csv("data/test_users.csv")
    print("\n--- Prediction Report ---")
    print(results.to_string(index=False))