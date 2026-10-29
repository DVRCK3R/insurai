# ============================================================
# InsurAI — Model Training Notebook
# ============================================================
# Run each section in order. At the end you get:
#   backend/models/risk_model.pkl  — the trained pipeline
#
# Dataset: Kaggle Car Insurance Data
# https://www.kaggle.com/datasets/sagnik1511/car-insurance-data
#
# Quick start:
#   pip install pandas scikit-learn xgboost matplotlib seaborn joblib
#   Download the CSV → save as data/car_insurance.csv
#   python model_training.py
# ============================================================

# %% [markdown]
# ## 1. Imports & Setup

# %%
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
import joblib
import os
import warnings
warnings.filterwarnings("ignore")

from sklearn.model_selection import train_test_split, cross_val_score, StratifiedKFold
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.impute import SimpleImputer
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.metrics import (
    classification_report, confusion_matrix,
    roc_auc_score, roc_curve, accuracy_score
)
from xgboost import XGBClassifier

os.makedirs("../backend/models", exist_ok=True)
os.makedirs("data", exist_ok=True)

print("All libraries loaded successfully.")

# %% [markdown]
# ## 2. Load & Explore Data

# %%
# ── Option A: Load from Kaggle CSV ────────────────────────────────────────────
CSV_PATH = "data/car_insurance.csv"

if os.path.exists(CSV_PATH):
    df = pd.read_csv(CSV_PATH)
    print(f"Dataset loaded: {df.shape[0]} rows × {df.shape[1]} cols")
else:
    # ── Option B: Generate synthetic data for demo purposes ───────────────────
    print("CSV not found — generating synthetic dataset for demonstration.")
    np.random.seed(42)
    N = 5000

    df = pd.DataFrame({
        "AGE":                  np.random.randint(18, 80, N),
        "GENDER":               np.random.choice(["male", "female"], N),
        "MARRIED":              np.random.choice([0, 1], N, p=[0.35, 0.65]),
        "CHILDREN":             np.random.randint(0, 5, N),
        "EDUCATION":            np.random.choice(
                                    ["high_school", "bachelor", "master", "phd"], N,
                                    p=[0.4, 0.35, 0.2, 0.05]),
        "OCCUPATION":           np.random.choice(
                                    ["employed", "self-employed", "unemployed",
                                     "retired", "student"], N,
                                    p=[0.55, 0.15, 0.1, 0.12, 0.08]),
        "ANNUAL_MILEAGE":       np.random.randint(3000, 40000, N),
        "VEHICLE_AGE":          np.random.randint(0, 20, N),
        "VEHICLE_TYPE":         np.random.choice(
                                    ["sedan", "suv", "truck", "sports", "minivan"], N,
                                    p=[0.4, 0.25, 0.15, 0.12, 0.08]),
        "SPEEDING_VIOLATIONS":  np.random.choice([0,1,2,3], N, p=[0.65,0.2,0.1,0.05]),
        "DUIS":                 np.random.choice([0,1], N, p=[0.93, 0.07]),
        "PAST_ACCIDENTS":       np.random.choice([0,1,2,3], N, p=[0.6,0.25,0.1,0.05]),
    })

    # Simulate outcome: higher mileage + violations + young → more claims
    risk = (
        (df["AGE"] < 25).astype(int) * 0.4 +
        (df["SPEEDING_VIOLATIONS"] > 0).astype(int) * 0.3 +
        (df["PAST_ACCIDENTS"] > 0).astype(int) * 0.5 +
        (df["ANNUAL_MILEAGE"] > 20000).astype(int) * 0.2 +
        (df["DUIS"] > 0).astype(int) * 0.6 +
        np.random.normal(0, 0.15, N)
    )
    df["OUTCOME"] = (risk > risk.quantile(0.65)).astype(int)  # ~35% claim rate
    print(f"Synthetic dataset created: {df.shape}")

print("\nColumn names:", df.columns.tolist())
print("\nFirst 3 rows:")
df.head(3)

# %%
print("=== Basic info ===")
print(df.dtypes)
print("\n=== Missing values ===")
print(df.isnull().sum())
print("\n=== Target distribution ===")
target_col = "OUTCOME"
print(df[target_col].value_counts(normalize=True).round(3))

# %% [markdown]
# ## 3. Exploratory Data Analysis

# %%
fig, axes = plt.subplots(2, 3, figsize=(15, 9))

# Age distribution by outcome
for outcome, label, color in [(0, "No claim", "#22c55e"), (1, "Claim", "#ef4444")]:
    axes[0,0].hist(df[df[target_col]==outcome]["AGE"], bins=20,
                   alpha=0.7, label=label, color=color, edgecolor="white")
axes[0,0].set_title("Age distribution by claim outcome")
axes[0,0].legend()

# Claim rate by vehicle type
vtype_claim = df.groupby("VEHICLE_TYPE")[target_col].mean().sort_values()
axes[0,1].barh(vtype_claim.index, vtype_claim.values, color="#6366f1")
axes[0,1].set_title("Claim rate by vehicle type")
axes[0,1].set_xlabel("Claim rate")

# Claim rate by speeding violations
spd_claim = df.groupby("SPEEDING_VIOLATIONS")[target_col].mean()
axes[0,2].bar(spd_claim.index, spd_claim.values, color="#f59e0b")
axes[0,2].set_title("Claim rate by speeding violations")
axes[0,2].set_xlabel("Violations")

# Mileage vs outcome (box plot)
df.boxplot(column="ANNUAL_MILEAGE", by=target_col, ax=axes[1,0])
axes[1,0].set_title("Mileage by outcome")
axes[1,0].set_xlabel("Claim (0=No, 1=Yes)")

# Correlation heatmap (numeric only)
num_cols = df.select_dtypes(include=np.number).columns
corr = df[num_cols].corr()
mask = np.triu(np.ones_like(corr, dtype=bool))
sns.heatmap(corr, ax=axes[1,1], mask=mask, cmap="RdYlGn",
            center=0, annot=True, fmt=".2f", annot_kws={"size": 7})
axes[1,1].set_title("Correlation matrix")

# Claim rate by occupation
if "OCCUPATION" in df.columns:
    occ_claim = df.groupby("OCCUPATION")[target_col].mean().sort_values()
    axes[1,2].barh(occ_claim.index, occ_claim.values, color="#0ea5e9")
    axes[1,2].set_title("Claim rate by occupation")
else:
    axes[1,2].axis("off")

plt.tight_layout()
plt.savefig("data/eda_plots.png", dpi=120, bbox_inches="tight")
plt.show()
print("EDA plots saved to data/eda_plots.png")

# %% [markdown]
# ## 4. Feature Engineering & Preprocessing

# %%
df_model = df.copy()

# ── Rename to lowercase for consistency ───────────────────────────────────────
df_model.columns = [c.lower() for c in df_model.columns]

# ── Map target ────────────────────────────────────────────────────────────────
# Ensure binary 0/1; adapt column name to match your dataset
if "outcome" not in df_model.columns:
    # Common column names in car insurance datasets
    for candidate in ["claim", "target", "label", "clm"]:
        if candidate in df_model.columns:
            df_model = df_model.rename(columns={candidate: "outcome"})
            break

TARGET = "outcome"

# ── Encode categoricals ───────────────────────────────────────────────────────
cat_cols = df_model.select_dtypes(include="object").columns.tolist()
for col in cat_cols:
    if col != TARGET:
        df_model[col] = LabelEncoder().fit_transform(df_model[col].astype(str))

# ── Engineer new features ─────────────────────────────────────────────────────
if "annual_mileage" in df_model and "vehicle_age" in df_model:
    df_model["mileage_per_year"] = df_model["annual_mileage"] / (df_model["vehicle_age"].clip(lower=1))
if "age" in df_model:
    df_model["young_driver"]  = (df_model["age"] < 25).astype(int)
    df_model["senior_driver"] = (df_model["age"] > 70).astype(int)
if "annual_mileage" in df_model:
    df_model["high_mileage"] = (df_model["annual_mileage"] > 20000).astype(int)
if "past_accidents" in df_model and "age" in df_model:
    df_model["accident_rate"] = df_model["past_accidents"] / (df_model["age"] - 17).clip(lower=1)

# ── Split features / target ───────────────────────────────────────────────────
EXCLUDE = [TARGET, "id", "policy_id", "customer_id"]
feature_cols = [c for c in df_model.columns if c not in EXCLUDE]

X = df_model[feature_cols]
y = df_model[TARGET].astype(int)

print(f"Features: {len(feature_cols)}")
print(f"Feature list: {feature_cols}")
print(f"Class balance: {y.value_counts(normalize=True).round(3).to_dict()}")

# %%
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)
print(f"Train: {X_train.shape[0]}  Test: {X_test.shape[0]}")

# %% [markdown]
# ## 5. Model Training & Comparison

# %%
models = {
    "Random Forest": Pipeline([
        ("imputer", SimpleImputer(strategy="median")),
        ("scaler",  StandardScaler()),
        ("clf",     RandomForestClassifier(
            n_estimators=200,
            max_depth=12,
            min_samples_leaf=5,
            class_weight="balanced",
            random_state=42,
            n_jobs=-1,
        )),
    ]),
    "XGBoost": Pipeline([
        ("imputer", SimpleImputer(strategy="median")),
        ("clf",     XGBClassifier(
            n_estimators=200,
            max_depth=6,
            learning_rate=0.1,
            subsample=0.8,
            colsample_bytree=0.8,
            use_label_encoder=False,
            eval_metric="logloss",
            random_state=42,
        )),
    ]),
    "Gradient Boosting": Pipeline([
        ("imputer", SimpleImputer(strategy="median")),
        ("scaler",  StandardScaler()),
        ("clf",     GradientBoostingClassifier(
            n_estimators=150,
            max_depth=5,
            learning_rate=0.1,
            random_state=42,
        )),
    ]),
}

results = {}
cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)

for name, pipe in models.items():
    print(f"Training {name}...", end="")
    cv_scores = cross_val_score(pipe, X_train, y_train, cv=cv,
                                scoring="roc_auc", n_jobs=-1)
    pipe.fit(X_train, y_train)
    y_pred  = pipe.predict(X_test)
    y_proba = pipe.predict_proba(X_test)[:, 1]
    auc     = roc_auc_score(y_test, y_proba)
    acc     = accuracy_score(y_test, y_pred)
    results[name] = {
        "model": pipe, "auc": auc, "acc": acc,
        "cv_mean": cv_scores.mean(), "cv_std": cv_scores.std(),
        "y_pred": y_pred, "y_proba": y_proba,
    }
    print(f"  AUC={auc:.4f}  Acc={acc:.4f}  CV={cv_scores.mean():.4f}±{cv_scores.std():.4f}")

# %%
# Pick best model by AUC
best_name = max(results, key=lambda k: results[k]["auc"])
best      = results[best_name]
print(f"\nBest model: {best_name} (AUC={best['auc']:.4f})\n")
print(classification_report(y_test, best["y_pred"],
                             target_names=["No claim", "Claim"]))

# %% [markdown]
# ## 6. Evaluation Plots

# %%
fig, axes = plt.subplots(1, 3, figsize=(15, 5))

# ROC curves
for name, r in results.items():
    fpr, tpr, _ = roc_curve(y_test, r["y_proba"])
    axes[0].plot(fpr, tpr, label=f"{name} (AUC={r['auc']:.3f})")
axes[0].plot([0,1],[0,1],"k--",alpha=0.4)
axes[0].set_xlabel("FPR"); axes[0].set_ylabel("TPR")
axes[0].set_title("ROC Curves"); axes[0].legend(fontsize=9)

# Confusion matrix (best model)
cm = confusion_matrix(y_test, best["y_pred"])
sns.heatmap(cm, ax=axes[1], annot=True, fmt="d", cmap="Blues",
            xticklabels=["No claim","Claim"], yticklabels=["No claim","Claim"])
axes[1].set_title(f"Confusion Matrix ({best_name})")
axes[1].set_ylabel("Actual"); axes[1].set_xlabel("Predicted")

# Feature importance
clf_step = best["model"].named_steps["clf"]
if hasattr(clf_step, "feature_importances_"):
    importances = pd.Series(clf_step.feature_importances_, index=feature_cols)
    top15 = importances.nlargest(15)
    top15.sort_values().plot(kind="barh", ax=axes[2], color="#6366f1")
    axes[2].set_title("Top 15 Feature Importances")
else:
    axes[2].axis("off")

plt.tight_layout()
plt.savefig("data/model_evaluation.png", dpi=120, bbox_inches="tight")
plt.show()
print("Evaluation plots saved to data/model_evaluation.png")

# %% [markdown]
# ## 7. Save the Best Model

# %%
MODEL_PATH = "../backend/models/risk_model.pkl"
joblib.dump(best["model"], MODEL_PATH)
print(f"Model saved → {MODEL_PATH}")
print(f"File size: {os.path.getsize(MODEL_PATH) / 1024:.1f} KB")

# Save feature list so the backend can validate inputs
import json
meta = {
    "model_name":   best_name,
    "auc":          round(best["auc"], 4),
    "accuracy":     round(best["acc"], 4),
    "feature_cols": feature_cols,
    "trained_on":   str(pd.Timestamp.now().date()),
}
with open("../backend/models/model_meta.json", "w") as f:
    json.dump(meta, f, indent=2)
print(f"Metadata saved → ../backend/models/model_meta.json")
print(json.dumps(meta, indent=2))
