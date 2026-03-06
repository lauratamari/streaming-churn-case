import json
import logging
import joblib
import numpy as np
import pandas as pd
from datetime import datetime
from backend.database import get_connection

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

MODEL_PATH = "models/xgboost_churn.pkl"

CHURN_LABELS = {
    0: "Renews",
    1: "Cancels Early",
    2: "Won't Renew"
}

COUNTRIES = [
    "USA", "Brazil", "UK", "Japan", "South Africa",
    "Canada", "Mexico", "Portugal", "Spain", "Germany",
    "Thailand", "Argentina", "South Korea"
]

PLANS = ["Basic", "Standard", "Premium"]


def fetch_users(cursor: object, user_ids: list[int] | None = None) -> pd.DataFrame:
    """Pull all relevant columns from the DB, joining all tables."""
    filter_clause = ""
    params = ()

    if user_ids:
        filter_clause = "WHERE u.user_id = ANY(%s)"
        params = (user_ids,)

    query = f"""
        SELECT
            u.user_id,
            u.age,
            u.country,
            u.signup_date,
            s.plan,
            s.billing_cycle,
            s.monthly_price,
            s.yearly_price,
            s.last_renewal_date,
            s.next_renewal_date,
            s.start_date,
            e.avg_watch_hours_per_week,
            e.number_of_logins_per_week,
            e.days_since_last_watch,
            e.completion_rate,
            st.tickets_last_30d,
            b.price_increase_last_6m,
            b.payment_failures
        FROM users u
        JOIN subscriptions s  ON u.user_id = s.user_id
        JOIN engagement e     ON u.user_id = e.user_id
        JOIN support_tickets st ON u.user_id = st.user_id
        JOIN billing b        ON u.user_id = b.user_id
        {filter_clause}
    """

    cursor.execute(query, params)
    rows = cursor.fetchall()
    columns = [desc[0] for desc in cursor.description]
    df = pd.DataFrame(rows, columns=columns)

    # PostgreSQL returns NUMERIC columns as decimal.Decimal — cast to float
    decimal_cols = [
        "avg_watch_hours_per_week", "completion_rate",
        "monthly_price", "yearly_price",
    ]
    for col in decimal_cols:
        if col in df.columns:
            df[col] = df[col].astype(float)

    logger.info(f"Fetched {len(df)} users from database.")
    return df


def build_features(df: pd.DataFrame) -> pd.DataFrame:
    """Replicate the feature engineering from feature_engineering.ipynb."""
    reference_date = pd.Timestamp(datetime.now().date())

    df["signup_date"] = pd.to_datetime(df["signup_date"])
    df["next_renewal_date"] = pd.to_datetime(df["next_renewal_date"])

    # Engineered features
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

    df["days_until_renewal"] = (
        df["next_renewal_date"] - reference_date
    ).dt.days.clip(lower=0)

    df["price_increase_last_6m"] = df["price_increase_last_6m"].astype(int)

    # One-hot encode country and plan — must match training columns
    df = pd.get_dummies(df, columns=["country", "plan"], drop_first=False)

    # Drop columns not used during training
    df = df.drop(columns=[
        "user_id", "signup_date", "start_date",
        "billing_cycle", "yearly_price",
        "last_renewal_date", "next_renewal_date",
        "monthly_price",
    ], errors="ignore")

    return df


def align_columns(df: pd.DataFrame, model_features: list[str]) -> pd.DataFrame:
    """Ensure the dataframe has exactly the columns the model expects."""
    for col in model_features:
        if col not in df.columns:
            df[col] = 0  # fill missing dummy columns with 0

    extra_cols = [c for c in df.columns if c not in model_features]
    if extra_cols:
        logger.warning(f"Dropping unexpected columns: {extra_cols}")
        df = df.drop(columns=extra_cols)

    return df[model_features]  # enforce column order


def predict(user_ids: list[int] | None = None) -> pd.DataFrame:
    """
    Load model, fetch users from DB, engineer features, and return predictions.

    Args:
        user_ids: Optional list of user_ids to predict. Predicts all users if None.

    Returns:
        DataFrame with columns: user_id, predicted_churn_type, churn_label,
        prob_renews, prob_cancels_early, prob_wont_renew
    """
    logger.info(f"Loading model from {MODEL_PATH}...")
    pipeline = joblib.load(MODEL_PATH)

    # Load the exact feature order saved during training
    with open("models/feature_columns.json") as f:
        model_features = json.load(f)

    connection = get_connection()
    cursor = connection.cursor()
    cursor.execute("SET search_path TO test_data")

    try:
        raw_df = fetch_users(cursor, user_ids)

        if raw_df.empty:
            logger.warning("No users found.")
            return pd.DataFrame()

        user_ids_col = raw_df["user_id"].copy()

        features_df = build_features(raw_df)
        features_df = align_columns(features_df, model_features)

        logger.info("Running predictions...")
        predictions = pipeline.predict(features_df)
        probabilities = pipeline.predict_proba(features_df)

        results = pd.DataFrame({
            "user_id": user_ids_col.values,
            "predicted_churn_type": predictions,
            "churn_label": [CHURN_LABELS[p] for p in predictions],
            "prob_renews": probabilities[:, 0].round(4),
            "prob_cancels_early": probabilities[:, 1].round(4),
            "prob_wont_renew": probabilities[:, 2].round(4),
        })

        logger.info("Prediction summary:")
        logger.info(f"\n{results['churn_label'].value_counts().to_string()}")

        return results

    finally:
        cursor.close()
        connection.close()


def main() -> None:
    results = predict()

    if results.empty:
        logger.warning("No predictions generated.")
        return

    print("\n--- Churn Predictions ---")
    print(results.to_string(index=False))

    output_path = "data/predictions.csv"
    results.to_csv(output_path, index=False)
    logger.info(f"Predictions saved to {output_path}")


if __name__ == "__main__":
    main()