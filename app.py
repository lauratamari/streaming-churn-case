import streamlit as st
import pandas as pd
import numpy as np
import joblib
import plotly.graph_objects as go
import plotly.express as px
from datetime import datetime, date, timedelta
import io

# ── Page config ───────────────────────────────────────────────────────────────
st.set_page_config(
    page_title="Churn Intelligence",
    page_icon="📡",
    layout="wide",
    initial_sidebar_state="expanded"
)

# ── Styling ───────────────────────────────────────────────────────────────────
st.markdown("""
<style>
@import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Syne:wght@400;600;700;800&display=swap');

html, body, [class*="css"] {
    font-family: 'Syne', sans-serif;
}

.stApp {
    background-color: #0a0a0f;
    color: #e8e8f0;
}

section[data-testid="stSidebar"] {
    background-color: #0f0f1a;
    border-right: 1px solid #1e1e2e;
}

h1, h2, h3 {
    font-family: 'Syne', sans-serif;
    font-weight: 800;
    letter-spacing: -0.03em;
}

.metric-card {
    background: linear-gradient(135deg, #12121f 0%, #1a1a2e 100%);
    border: 1px solid #2a2a3e;
    border-radius: 12px;
    padding: 20px 24px;
    margin-bottom: 12px;
}

.risk-low {
    color: #4ade80;
    font-weight: 700;
    font-size: 1.4rem;
    font-family: 'Syne', sans-serif;
}
.risk-medium {
    color: #fbbf24;
    font-weight: 700;
    font-size: 1.4rem;
    font-family: 'Syne', sans-serif;
}
.risk-high {
    color: #f87171;
    font-weight: 700;
    font-size: 1.4rem;
    font-family: 'Syne', sans-serif;
}

.churn-badge {
    display: inline-block;
    padding: 6px 16px;
    border-radius: 999px;
    font-family: 'DM Mono', monospace;
    font-size: 0.85rem;
    font-weight: 500;
    letter-spacing: 0.05em;
    text-transform: uppercase;
}
.badge-0 { background: #052e16; color: #4ade80; border: 1px solid #166534; }
.badge-1 { background: #450a0a; color: #f87171; border: 1px solid #991b1b; }
.badge-2 { background: #422006; color: #fbbf24; border: 1px solid #92400e; }

.section-label {
    font-family: 'DM Mono', monospace;
    font-size: 0.7rem;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: #6366f1;
    margin-bottom: 8px;
}

div[data-testid="stMetric"] {
    background: #12121f;
    border: 1px solid #2a2a3e;
    border-radius: 10px;
    padding: 16px;
}

div[data-testid="stMetric"] label {
    color: #6b7280 !important;
    font-family: 'DM Mono', monospace !important;
    font-size: 0.75rem !important;
    text-transform: uppercase;
    letter-spacing: 0.1em;
}

div[data-testid="stMetric"] div[data-testid="stMetricValue"] {
    color: #e8e8f0 !important;
    font-family: 'Syne', sans-serif !important;
    font-weight: 700 !important;
}

.stButton > button {
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    color: white;
    border: none;
    border-radius: 8px;
    font-family: 'Syne', sans-serif;
    font-weight: 600;
    padding: 10px 28px;
    transition: all 0.2s;
    width: 100%;
}
.stButton > button:hover {
    background: linear-gradient(135deg, #4f46e5, #7c3aed);
    transform: translateY(-1px);
}

.stSelectbox > div, .stNumberInput > div, .stDateInput > div {
    background: #12121f !important;
    border-color: #2a2a3e !important;
}

.dataframe {
    font-family: 'DM Mono', monospace !important;
    font-size: 0.8rem !important;
}

hr {
    border-color: #1e1e2e;
}

.insight-box {
    background: #12121f;
    border-left: 3px solid #6366f1;
    border-radius: 0 8px 8px 0;
    padding: 14px 18px;
    margin: 8px 0;
    font-family: 'DM Mono', monospace;
    font-size: 0.82rem;
    color: #a5b4fc;
}
</style>
""", unsafe_allow_html=True)

# ── Constants ─────────────────────────────────────────────────────────────────
COUNTRIES = sorted(["USA", "Brazil", "UK", "Japan", "South Africa", "Canada",
                     "Mexico", "Portugal", "Spain", "Germany", "Thailand",
                     "Argentina", "South Korea"])
PLANS = ["Basic", "Standard", "Premium"]
PRICE_MAP = {"Basic": 9.99, "Standard": 14.99, "Premium": 19.99}
CHURN_LABELS = {0: "Renews", 1: "Cancels Early", 2: "Won't Renew"}
RISK_LABELS = {0: "Low Risk", 1: "High Risk", 2: "Medium Risk"}
RISK_COLORS = {0: "#4ade80", 1: "#f87171", 2: "#fbbf24"}
RISK_CLASS  = {0: "risk-low", 1: "risk-high", 2: "risk-medium"}

# ── Model loading ─────────────────────────────────────────────────────────────
@st.cache_resource
def load_model():
    return joblib.load("models/xgboost_churn.pkl")

try:
    model = load_model()
    MODEL_LOADED = True
except Exception as e:
    MODEL_LOADED = False
    MODEL_ERROR = str(e)

# ── Feature engineering ───────────────────────────────────────────────────────
def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    reference_date = pd.Timestamp(datetime.now().date())

    date_cols = ["signup_date", "start_date", "cancellation_date",
                 "last_renewal_date", "next_renewal_date"]
    for col in date_cols:
        if col in df.columns:
            df[col] = pd.to_datetime(df[col], errors="coerce")

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

    df = pd.get_dummies(df, columns=["country", "plan"], drop_first=False)
    df["price_increase_last_6m"] = df["price_increase_last_6m"].astype(int)

    df = df.drop(columns=[
        "user_id", "signup_date", "start_date", "billing_cycle",
        "yearly_price", "cancelled", "cancellation_date",
        "last_renewal_date", "next_renewal_date", "is_cancelled", "monthly_price"
    ], errors="ignore")

    training_cols = model.named_steps["scaler"].feature_names_in_
    for col in training_cols:
        if col not in df.columns:
            df[col] = 0
    df = df[training_cols]
    return df


def predict(data: pd.DataFrame) -> pd.DataFrame:
    features = engineer_features(data)
    churn_type = model.predict(features)
    probs = model.predict_proba(features)
    out = pd.DataFrame()
    if "user_id" in data.columns:
        out["user_id"] = data["user_id"].values
    out["churn_type"]        = churn_type
    out["churn_label"]       = [CHURN_LABELS[c] for c in churn_type]
    out["risk_label"]        = [RISK_LABELS[c] for c in churn_type]
    out["prob_renews"]       = probs[:, 0].round(3)
    out["prob_cancels_early"]= probs[:, 1].round(3)
    out["prob_wont_renew"]   = probs[:, 2].round(3)
    return out

# ── Sidebar nav ───────────────────────────────────────────────────────────────
with st.sidebar:
    st.markdown("## 📡 Churn Intelligence")
    st.markdown("<div class='section-label'>Navigation</div>", unsafe_allow_html=True)
    page = st.radio("", ["Single Prediction", "Batch Prediction", "Model Insights"],
                    label_visibility="collapsed")
    st.markdown("---")
    if MODEL_LOADED:
        st.markdown("<div style='color:#4ade80; font-family:DM Mono,monospace; font-size:0.75rem;'>● Model loaded</div>", unsafe_allow_html=True)
    else:
        st.markdown("<div style='color:#f87171; font-family:DM Mono,monospace; font-size:0.75rem;'>● Model not found</div>", unsafe_allow_html=True)
        st.caption("Place `xgboost_churn.pkl` in `models/`")

# ── Guard ─────────────────────────────────────────────────────────────────────
if not MODEL_LOADED:
    st.error(f"Could not load model: `{MODEL_ERROR}`")
    st.stop()

# ══════════════════════════════════════════════════════════════════════════════
# PAGE 1 — Single Prediction
# ══════════════════════════════════════════════════════════════════════════════
if page == "Single Prediction":
    st.markdown("# Single User Prediction")
    st.markdown("<div class='section-label'>Enter user details to predict churn risk</div>", unsafe_allow_html=True)
    st.markdown("---")

    with st.form("user_form"):
        col1, col2, col3 = st.columns(3)

        with col1:
            st.markdown("<div class='section-label'>Profile</div>", unsafe_allow_html=True)
            user_id   = st.number_input("User ID", value=9999, step=1)
            age       = st.number_input("Age", min_value=18, max_value=65, value=34)
            country   = st.selectbox("Country", COUNTRIES, index=COUNTRIES.index("Brazil"))
            signup    = st.date_input("Signup Date", value=date(2023, 1, 15))

        with col2:
            st.markdown("<div class='section-label'>Subscription</div>", unsafe_allow_html=True)
            plan          = st.selectbox("Plan", PLANS)
            billing_cycle = st.selectbox("Billing Cycle", ["monthly", "yearly"])
            cancelled     = st.checkbox("Cancelled", value=False)
            last_renewal  = st.date_input("Last Renewal Date", value=date.today() - timedelta(days=15))
            next_renewal  = st.date_input("Next Renewal Date", value=date.today() + timedelta(days=15))

        with col3:
            st.markdown("<div class='section-label'>Engagement & Billing</div>", unsafe_allow_html=True)
            watch_hours   = st.number_input("Avg Watch Hours/Week", 0.0, 20.0, value=1.5, step=0.5)
            logins        = st.number_input("Logins/Week", 0, 20, value=1)
            days_inactive = st.number_input("Days Since Last Watch", 0, 60, value=45)
            completion    = st.slider("Completion Rate", 0.0, 1.0, value=0.3, step=0.05)
            tickets       = st.number_input("Support Tickets (30d)", 0, 5, value=4)
            price_inc     = st.checkbox("Price Increase Last 6m", value=True)
            pay_fail      = st.number_input("Payment Failures", 0, 2, value=2)

        submitted = st.form_submit_button("🔮 Predict Churn Risk")

    if submitted:
        monthly_price = PRICE_MAP[plan]
        yearly_price  = round(monthly_price * 12 * 0.90, 2) if billing_cycle == "yearly" else None

        user_data = pd.DataFrame([{
            "user_id": user_id, "age": age, "country": country,
            "plan": plan, "billing_cycle": billing_cycle,
            "monthly_price": monthly_price, "yearly_price": yearly_price,
            "cancelled": cancelled, "cancellation_date": None,
            "signup_date": str(signup), "start_date": str(signup),
            "last_renewal_date": str(last_renewal),
            "next_renewal_date": str(next_renewal),
            "avg_watch_hours_per_week": watch_hours,
            "number_of_logins_per_week": logins,
            "days_since_last_watch": days_inactive,
            "completion_rate": completion,
            "tickets_last_30d": tickets,
            "price_increase_last_6m": price_inc,
            "payment_failures": pay_fail
        }])

        result = predict(user_data).iloc[0]
        ct = int(result["churn_type"])

        st.markdown("---")
        st.markdown("### Prediction Result")

        r1, r2, r3 = st.columns(3)
        with r1:
            st.markdown(f"""
            <div class='metric-card'>
                <div class='section-label'>Churn Type</div>
                <span class='churn-badge badge-{ct}'>{result['churn_label']}</span>
            </div>""", unsafe_allow_html=True)
        with r2:
            st.markdown(f"""
            <div class='metric-card'>
                <div class='section-label'>Risk Level</div>
                <span class='{RISK_CLASS[ct]}'>{result['risk_label']}</span>
            </div>""", unsafe_allow_html=True)
        with r3:
            top_prob = max(result["prob_renews"], result["prob_cancels_early"], result["prob_wont_renew"])
            st.markdown(f"""
            <div class='metric-card'>
                <div class='section-label'>Confidence</div>
                <span style='font-size:1.4rem; font-weight:700; color:#a5b4fc;'>{top_prob:.1%}</span>
            </div>""", unsafe_allow_html=True)

        # probability bar chart
        fig = go.Figure(go.Bar(
            x=["Renews", "Cancels Early", "Won't Renew"],
            y=[result["prob_renews"], result["prob_cancels_early"], result["prob_wont_renew"]],
            marker_color=["#4ade80", "#f87171", "#fbbf24"],
            text=[f"{v:.1%}" for v in [result["prob_renews"], result["prob_cancels_early"], result["prob_wont_renew"]]],
            textposition="outside",
            textfont=dict(family="DM Mono", size=13)
        ))
        fig.update_layout(
            title="Probability Distribution",
            plot_bgcolor="#0a0a0f", paper_bgcolor="#0a0a0f",
            font=dict(family="Syne", color="#e8e8f0"),
            yaxis=dict(range=[0, 1], tickformat=".0%", gridcolor="#1e1e2e"),
            xaxis=dict(gridcolor="#1e1e2e"),
            title_font=dict(size=16, family="Syne"),
            height=320
        )
        st.plotly_chart(fig, use_container_width=True)

        # contextual insight
        if ct == 0:
            msg = "This user shows healthy engagement patterns. Low churn risk — no action needed."
        elif ct == 1:
            msg = "This user is likely to cancel before renewal. Consider a proactive retention offer or support outreach."
        else:
            msg = "This user may not renew at their next cycle. Consider a re-engagement campaign or a discount."
        st.markdown(f"<div class='insight-box'>💡 {msg}</div>", unsafe_allow_html=True)


# ══════════════════════════════════════════════════════════════════════════════
# PAGE 2 — Batch Prediction
# ══════════════════════════════════════════════════════════════════════════════
elif page == "Batch Prediction":
    st.markdown("# Batch Prediction")
    st.markdown("<div class='section-label'>Upload a CSV file to score multiple users at once</div>", unsafe_allow_html=True)
    st.markdown("---")

    uploaded = st.file_uploader("Upload CSV", type=["csv"])

    if uploaded:
        df_input = pd.read_csv(uploaded)
        st.markdown(f"<div class='section-label'>{len(df_input)} users loaded</div>", unsafe_allow_html=True)
        st.dataframe(df_input.head(5), use_container_width=True)

        if st.button("🔮 Run Batch Prediction"):
            with st.spinner("Scoring users..."):
                results = predict(df_input)

            st.markdown("---")
            st.markdown("### Results")

            # summary metrics
            m1, m2, m3, m4 = st.columns(4)
            total = len(results)
            m1.metric("Total Users", total)
            m2.metric("Low Risk (Renews)", int((results["churn_type"] == 0).sum()),
                      delta=f"{(results['churn_type']==0).mean():.0%}")
            m3.metric("Medium Risk (Won't Renew)", int((results["churn_type"] == 2).sum()),
                      delta=f"{(results['churn_type']==2).mean():.0%}", delta_color="inverse")
            m4.metric("High Risk (Cancels Early)", int((results["churn_type"] == 1).sum()),
                      delta=f"{(results['churn_type']==1).mean():.0%}", delta_color="inverse")

            # donut chart
            counts = results["churn_label"].value_counts()
            fig = go.Figure(go.Pie(
                labels=counts.index,
                values=counts.values,
                hole=0.6,
                marker_colors=["#4ade80", "#fbbf24", "#f87171"],
                textfont=dict(family="DM Mono", size=12),
            ))
            fig.update_layout(
                plot_bgcolor="#0a0a0f", paper_bgcolor="#0a0a0f",
                font=dict(family="Syne", color="#e8e8f0"),
                legend=dict(font=dict(family="DM Mono")),
                height=300, margin=dict(t=20, b=20)
            )
            st.plotly_chart(fig, use_container_width=True)

            # full results table
            st.markdown("### Full Results")
            st.dataframe(results, use_container_width=True)

            # download
            csv_out = results.to_csv(index=False).encode("utf-8")
            st.download_button(
                "⬇ Download Predictions CSV",
                data=csv_out,
                file_name="churn_predictions.csv",
                mime="text/csv"
            )
    else:
        st.markdown("""
        <div class='insight-box'>
        Expected CSV columns: user_id, age, country, plan, billing_cycle, monthly_price, yearly_price,
        cancelled, cancellation_date, signup_date, start_date, last_renewal_date, next_renewal_date,
        avg_watch_hours_per_week, number_of_logins_per_week, days_since_last_watch, completion_rate,
        tickets_last_30d, price_increase_last_6m, payment_failures
        </div>
        """, unsafe_allow_html=True)


# ══════════════════════════════════════════════════════════════════════════════
# PAGE 3 — Model Insights
# ══════════════════════════════════════════════════════════════════════════════
elif page == "Model Insights":
    st.markdown("# Model Insights")
    st.markdown("<div class='section-label'>XGBoost multiclass churn classifier</div>", unsafe_allow_html=True)
    st.markdown("---")

    # model performance table
    st.markdown("### Model Comparison")
    perf = pd.DataFrame([
        {"Model": "Logistic Regression", "Accuracy": 0.741, "Macro F1": 0.501, "Cancels Early F1": 0.130, "ROC-AUC": 0.8829},
        {"Model": "Random Forest",       "Accuracy": 0.866, "Macro F1": 0.534, "Cancels Early F1": 0.000, "ROC-AUC": 0.9149},
        {"Model": "XGBoost ✓",           "Accuracy": 0.852, "Macro F1": 0.548, "Cancels Early F1": 0.048, "ROC-AUC": 0.9135},
    ]).set_index("Model")
    st.dataframe(perf.style.highlight_max(axis=0, color="#1a2a1a"), use_container_width=True)

    st.markdown("""
    <div class='insight-box'>
    XGBoost was selected as the best overall model — highest Macro F1 (0.548) and strong ROC-AUC (0.9135),
    while being the only tree model that partially predicts the minority class (Cancels Early).
    </div>
    """, unsafe_allow_html=True)

    st.markdown("---")

    # feature importance
    st.markdown("### Feature Importance")
    xgb_model = model.named_steps["model"]
    feature_names = model.named_steps["scaler"].feature_names_in_

    imp_df = pd.DataFrame({
        "feature": feature_names,
        "importance": xgb_model.feature_importances_
    }).sort_values("importance", ascending=True).tail(15)

    fig = go.Figure(go.Bar(
        x=imp_df["importance"],
        y=imp_df["feature"],
        orientation="h",
        marker=dict(
            color=imp_df["importance"],
            colorscale=[[0, "#1e1e4e"], [1, "#6366f1"]],
        ),
        text=imp_df["importance"].round(3),
        textposition="outside",
        textfont=dict(family="DM Mono", size=11, color="#e8e8f0")
    ))
    fig.update_layout(
        plot_bgcolor="#0a0a0f", paper_bgcolor="#0a0a0f",
        font=dict(family="Syne", color="#e8e8f0"),
        xaxis=dict(gridcolor="#1e1e2e", title="Importance Score"),
        yaxis=dict(gridcolor="rgba(0,0,0,0)"),
        height=500,
        margin=dict(l=20, r=80)
    )
    st.plotly_chart(fig, use_container_width=True)

    st.markdown("---")

    # churn type explanation
    st.markdown("### Churn Types")
    c1, c2, c3 = st.columns(3)
    with c1:
        st.markdown("""
        <div class='metric-card'>
            <span class='churn-badge badge-0'>Type 0 — Renews</span>
            <p style='margin-top:12px; color:#9ca3af; font-size:0.88rem;'>
            Customer renews at their next renewal date. No action needed.
            </p>
        </div>""", unsafe_allow_html=True)
    with c2:
        st.markdown("""
        <div class='metric-card'>
            <span class='churn-badge badge-1'>Type 1 — Cancels Early</span>
            <p style='margin-top:12px; color:#9ca3af; font-size:0.88rem;'>
            Customer cancels before their renewal date. Immediate retention action recommended.
            </p>
        </div>""", unsafe_allow_html=True)
    with c3:
        st.markdown("""
        <div class='metric-card'>
            <span class='churn-badge badge-2'>Type 2 — Won't Renew</span>
            <p style='margin-top:12px; color:#9ca3af; font-size:0.88rem;'>
            Customer does not renew at their renewal date. Re-engagement campaign recommended.
            </p>
        </div>""", unsafe_allow_html=True)