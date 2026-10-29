"""
Preprocessing — converts raw user input dict into a feature array
ready for the scikit-learn pipeline.

This version matches the features the model was trained on:
  age, gender, driving_experience, vehicle_ownership, annual_mileage,
  vehicle_type, speeding_violations, duis, young_driver, senior_driver

Categorical features (gender, vehicle_ownership, vehicle_type) are 
label-encoded to match training data preprocessing.
"""
import pandas as pd
import numpy as np
from sklearn.preprocessing import LabelEncoder

# ── Feature schema with safe defaults ─────────────────────────────────────────
DEFAULTS = {
    "age":                  35,
    "gender":               "M",  # M or F
    "driving_experience":   10,
    "vehicle_ownership":    "NO",  # YES or NO
    "annual_mileage":       12000,
    "vehicle_type":         "Sedan",  # Sedan, SUV, Truck, Coupe, etc.
    "speeding_violations":  0,
    "duis":                 0,
}

# Label encoders for categorical features (must match training data)
# These are initialized with the categories seen during training
_label_encoders = {
    "gender": {"M": 1, "F": 0},  # Male=1, Female=0
    "vehicle_ownership": {"YES": 1, "NO": 0},  # YES=1, NO=0
    "vehicle_type": {
        "Sedan": 0, "SUV": 1, "Truck": 2, "Coupe": 3, "Sports": 4,
        "Minivan": 5, "Other": 6, "sedan": 0, "suv": 1, "truck": 2,
        "coupe": 3, "sports": 4, "minivan": 5, "other": 6,
    },
}


def preprocess(raw: dict) -> pd.DataFrame:
    """
    raw   — dict from the API request (may have missing keys)
    returns a single-row DataFrame with features matching training data.
    
    Expected fields:
      - age (numeric)
      - gender ("M" or "F")
      - driving_experience (numeric, years)
      - vehicle_ownership ("YES" or "NO")
      - annual_mileage (numeric)
      - vehicle_type ("Sedan", "SUV", "Truck", etc.)
      - speeding_violations (numeric)
      - duis (numeric, 0 or 1)
    """
    # Fill missing fields with safe defaults
    d = {**DEFAULTS, **{k: v for k, v in raw.items() if v not in (None, "", "unknown")}}

    # ── Numeric features ──────────────────────────────────────────────────────
    age                = float(d.get("age", DEFAULTS["age"]))
    annual_mileage     = float(d.get("annual_mileage", DEFAULTS["annual_mileage"]))
    driving_experience = float(d.get("driving_experience", DEFAULTS["driving_experience"]))
    speeding_violations = float(d.get("speeding_violations", DEFAULTS["speeding_violations"]))
    duis               = float(d.get("duis", DEFAULTS["duis"]))

    # ── Categorical features (label-encoded) ───────────────────────────────────
    gender_raw = str(d.get("gender", DEFAULTS["gender"])).upper()
    gender = _label_encoders["gender"].get(gender_raw, 0)

    vehicle_ownership_raw = str(d.get("vehicle_ownership", DEFAULTS["vehicle_ownership"])).upper()
    vehicle_ownership = _label_encoders["vehicle_ownership"].get(vehicle_ownership_raw, 0)

    vehicle_type_raw = str(d.get("vehicle_type", DEFAULTS["vehicle_type"])).title()
    vehicle_type = _label_encoders["vehicle_type"].get(vehicle_type_raw, 0)

    # ── Derived / engineered features ──────────────────────────────────────────
    young_driver  = 1 if age < 25 else 0
    senior_driver = 1 if age > 70 else 0

    # ── Assemble final feature vector ──────────────────────────────────────────
    # Feature order MUST match training data
    row = {
        "age":                  age,
        "gender":               gender,
        "driving_experience":   driving_experience,
        "vehicle_ownership":    vehicle_ownership,
        "annual_mileage":       annual_mileage,
        "vehicle_type":         vehicle_type,
        "speeding_violations":  speeding_violations,
        "duis":                 duis,
        "young_driver":         young_driver,
        "senior_driver":        senior_driver,
    }

    return pd.DataFrame([row])


def calculate_premium(base_premium: float, risk_score: float) -> float:
    """
    Compute final monthly premium from a base rate and ML risk score (0–1).
    Uses Kenyan market rates per IRA guidelines.

    risk_score 0.0  → 35% discount  → KES 2,275/month (at KES 3,500 base)
    risk_score 0.5  → standard rate → KES 3,500/month
    risk_score 1.0  → 65% surcharge → KES 5,775/month
    """
    multiplier = 0.65 + (risk_score * 1.0)  # Range: 0.65 to 1.65
    return round(base_premium * multiplier, 2)
