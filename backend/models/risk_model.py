"""
Risk Model — loads the trained scikit-learn pipeline from disk
and exposes a single predict() function.

The model file (risk_model.pkl) is created by running
notebooks/model_training.ipynb. Commit it to the repo or download
it at startup from Firebase Storage.
"""
import joblib
import os
import numpy as np
import pandas as pd
from utils.preprocessing import preprocess, calculate_premium

_model = None
BASE_PREMIUM = 3500.0  # KES — Kenya market base rate (comprehensive coverage)


def _load_model():
    global _model
    if _model is None:
        path = os.getenv("MODEL_PATH", "models/risk_model.pkl")
        if not os.path.exists(path):
            raise FileNotFoundError(
                f"Model not found at {path}. "
                "Run notebooks/model_training.ipynb first."
            )
        _model = joblib.load(path)
    return _model


def predict(raw_input: dict) -> dict:
    """
    Accept raw user input, return a structured prediction dict.

    Returns:
      {
        "insurable":      True/False,
        "risk_level":     "low" | "medium" | "high",
        "risk_score":     0.0 – 1.0,
        "monthly_premium": float,
        "top_risk_factors": [str, ...],
        "confidence":     float  (0–1)
      }
    """
    model = _load_model()
    features = preprocess(raw_input)

    # Probability of being a claim (class 1 = will file a claim)
    proba = model.predict_proba(features)[0]
    risk_score = float(proba[1])  # probability of the "risky" class
    decision   = model.predict(features)[0]

    # Map continuous score to human-readable tier
    if risk_score < 0.35:
        risk_level = "low"
    elif risk_score < 0.65:
        risk_level = "medium"
    else:
        risk_level = "high"

    # Insurability: reject only extreme high-risk cases
    insurable = risk_score < 0.85

    premium = calculate_premium(BASE_PREMIUM, risk_score)

    # Best-effort feature importance explanation
    top_factors = _top_risk_factors(features, risk_score)

    return {
        "insurable":       bool(insurable),
        "risk_level":      risk_level,
        "risk_score":      round(risk_score, 4),
        "monthly_premium": premium,
        "top_risk_factors": top_factors,
        "confidence":      round(float(max(proba)), 4),
    }


def _top_risk_factors(features: pd.DataFrame, risk_score: float) -> list:
    """
    Return the top 3 human-readable risk drivers using the model's
    feature importances (works for tree-based models like Random Forest / XGBoost).
    Falls back to a rule-based list for models without feature_importances_.
    """
    model = _load_model()
    step = model  # pipeline or direct estimator

    # Unwrap sklearn Pipeline if needed
    if hasattr(model, "named_steps"):
        step = model.named_steps.get("clf") or list(model.named_steps.values())[-1]

    factors = []
    if hasattr(step, "feature_importances_"):
        importances = step.feature_importances_
        cols = features.columns.tolist()
        ranked = sorted(zip(cols, importances), key=lambda x: -x[1])
        label_map = {
            "age": "Driver age", "prior_claims": "Prior claims",
            "speeding_violations": "Speeding violations",
            "annual_mileage": "Annual mileage", "vehicle_age": "Vehicle age",
            "young_driver": "Young driver (<25)", "high_mileage": "High mileage",
        }
        for col, imp in ranked[:5]:
            if features[col].values[0] != 0 and col in label_map:
                factors.append(label_map[col])
            if len(factors) == 3:
                break

    # Rule-based fallback
    if not factors:
        row = features.iloc[0]
        if row.get("prior_claims", 0) > 1:
            factors.append("Prior claims history")
        if row.get("speeding_violations", 0) > 0:
            factors.append("Speeding violations")
        if row.get("young_driver", 0):
            factors.append("Young driver (<25)")
        if row.get("high_mileage", 0):
            factors.append("High annual mileage")
        factors = factors[:3]

    return factors or ["Standard risk profile"]
