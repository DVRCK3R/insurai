"""
Kenya Market Configuration — InsurAI localization for Kenya
"""

# ============================================================
# CURRENCY & PRICING
# ============================================================
CURRENCY = "KES"
CURRENCY_NAME = "Kenyan Shillings"
CURRENCY_SYMBOL = "KES"

# Base premiums by coverage type
BASE_PREMIUMS = {
    "mvtpl_only": 1500.0,           # Motor Vehicle Third-Party Liability (mandatory minimum)
    "third_party_fire_theft": 2500.0,  # TP + Fire & Theft
    "comprehensive": 3500.0,        # Full comprehensive coverage (DEFAULT)
}

# Premium adjustments
PREMIUM_ADJUSTMENTS = {
    "discount_annual": 0.15,        # 15% discount for annual payment
    "discount_quarterly": 0.12,     # 12% discount for quarterly
    "surcharge_young_driver": 0.10, # +10% for drivers <25 with clean record
    "regional_nairobi": 0.05,       # +5% in Nairobi (congestion, theft)
    "regional_mombasa": 0.03,       # +3% in Mombasa (coastal, corrosion)
    "regional_western": -0.02,      # -2% in Western/Central (lower density)
    "regional_northern": 0.08,      # +8% in Northern (poor roads)
    "seasonal_rainy": 0.02,         # +2% during rainy season (Mar–May, Oct–Dec)
    "seasonal_peak_holiday": 0.05,  # +5% during peak travel (Dec 15–Jan 5)
}

# Risk score multiplier (0.65–1.65 range)
RISK_MULTIPLIER_MIN = 0.65        # Low risk: 35% discount
RISK_MULTIPLIER_MAX = 1.65        # High risk: 65% surcharge

# ============================================================
# COVERAGE & LIMITS
# ============================================================
COVERAGE_TYPES = {
    "mvtpl": {
        "name": "Motor Vehicle Third-Party Liability",
        "mandatory": True,
        "third_party_liability_limit": 15000000,  # KES 15M (MVIP standard)
        "premium": 1500,
    },
    "comprehensive": {
        "name": "Comprehensive (Full Cover)",
        "includes": [
            "Third-party liability (15M KES)",
            "Own vehicle damage",
            "Fire and theft",
            "Windscreen cover (50k KES)",
            "Legal liability",
            "Emergency roadside assistance",
        ],
        "excess": 10000,  # KES 10,000 standard deductible
        "premium": 3500,
    },
}

# Optional add-ons
ADD_ONS = {
    "personal_accident_cover": {
        "name": "Personal Accident Cover (PAC)",
        "coverage": 500000,  # KES 500,000 per person
        "premium_monthly": 300,
    },
    "excess_waiver_5k": {
        "name": "Excess Waiver (Reduce to 5k)",
        "reduces_excess_to": 5000,
        "premium_monthly": 200,
    },
    "zero_excess": {
        "name": "Zero Excess (for <50k claims)",
        "conditions": "Claims under KES 50,000 only",
        "premium_monthly": 300,
    },
    "breakdown_assistance": {
        "name": "Breakdown Assistance",
        "includes": "Towing, roadside repair, accommodation",
        "premium_monthly": 250,
    },
}

# ============================================================
# VEHICLE & DRIVER FACTORS
# ============================================================
VEHICLE_TYPES = {
    "minivan": {"code": 0, "risk_factor": 0.9, "common_in_kenya": "Public transport operators"},
    "sedan": {"code": 1, "risk_factor": 1.0, "common_in_kenya": "Personal use, Nairobi taxi"},
    "sports": {"code": 2, "risk_factor": 1.2, "common_in_kenya": "High-income earners, racing clubs"},
    "suv": {"code": 3, "risk_factor": 1.1, "common_in_kenya": "Commercial, safari, personal"},
    "truck": {"code": 4, "risk_factor": 1.3, "common_in_kenya": "Commercial transport, rural areas"},
}

TYPICAL_MILEAGE_BY_REGION = {
    "urban_nairobi": 8000,       # City commuting
    "suburban_kisumu": 10000,    # Regional centers
    "highway_msa": 15000,        # Mombasa-Nairobi Highway
    "commercial_matatu": 25000,  # Public service vehicles (PSV)
}

# Gender encoding (Kenya)
GENDER_ENCODING = {
    "female": 0,
    "male": 1,
}

# ============================================================
# LEGAL & COMPLIANCE
# ============================================================
REGULATORY_BODY = "Insurance Regulatory Authority (IRA), Kenya"
MINIMUM_INSURANCE = "Motor Vehicle Third-Party Liability (MVTPL) — mandatory"
EXCHANGE_RATE_USD_TO_KES = 123.0  # Approximate (from Central Bank of Kenya)

# Claim excess (deductible) per category
EXCESS_BY_COVERAGE = {
    "own_damage": 10000,        # KES 10,000 standard
    "own_damage_waived": 0,     # Optional waiver
    "third_party": 0,           # No excess (paid by other party)
}

# Maximum liability limits
LIABILITY_LIMITS = {
    "third_party_bodily": 15000000,      # KES 15M (MVIP standard)
    "third_party_property": 5000000,     # KES 5M
    "personal_accident": 500000,         # KES 500k (with PAC)
}

# ============================================================
# CLAIM PROCESSING
# ============================================================
CLAIM_REQUIREMENTS = [
    "Police report (OB number) for theft/hit-and-run",
    "Photos of vehicle damage (min 3 angles)",
    "Original driving license (copy)",
    "National ID (copy)",
    "Original insurance policy document",
    "Repair quotations from approved garages",
]

CLAIM_PROCESSING_TIMELINE = {
    "initial_review_hours": 48,         # Documentation completeness check
    "loss_adjuster_visit_hours": 72,    # Inspector assessment
    "garage_assessment_days": 7,        # Repair estimate
    "settlement_decision_days": 21,     # Final approval/denial
    "payment_days": 10,                 # After approval, within days
}

# Approved garage network in Kenya
APPROVED_GARAGE_NETWORK = [
    "Simba Auto Care (Nairobi, Mombasa, Kisumu)",
    "Jatco (Nairobi, nationwide)",
    "CMC Motors (Nairobi, Nakuru)",
    "Isuzu Service Centers (nationwide)",
    "Toyota Service Centers (nationwide)",
    # Add more as network expands
]

# ============================================================
# PAYMENT & BILLING
# ============================================================
PAYMENT_METHODS = {
    "mpesa": {
        "name": "M-Pesa",
        "providers": ["Safaricom", "Airtel", "Equity"],
        "processing_time": "Instant",
        "fee": 0,
    },
    "bank_transfer": {
        "name": "Bank Transfer (Local KES)",
        "processing_time": "2–24 hours",
        "fee": "20–50 KES",
    },
    "card": {
        "name": "Visa/Mastercard (Online)",
        "processing_time": "Instant",
        "fee": "2% surcharge",
    },
    "lipa_na_mpesa": {
        "name": "Lipa Na M-Pesa Online",
        "target": "Retailers, aggregators",
        "processing_time": "Instant",
        "fee": 0,
    },
}

# Billing cycles
BILLING_CYCLES = {
    "monthly": {"name": "Monthly", "discount": 0.0},
    "quarterly": {"name": "Quarterly (3 months)", "discount": 0.12},
    "annual": {"name": "Annual", "discount": 0.15},
}

# Late payment grace period
GRACE_PERIOD_DAYS = 30  # Coverage continues for 30 days after due date

# ============================================================
# REGIONAL MARKETS & PRICING
# ============================================================
REGIONS = {
    "nairobi": {
        "name": "Nairobi Metropolitan",
        "adjustment": 0.05,
        "reason": "Congestion, theft risk, high traffic",
        "typical_mileage": 8000,
    },
    "coastal": {
        "name": "Mombasa & Coastal Regions",
        "adjustment": 0.03,
        "reason": "Salt corrosion, humidity, marine environment",
        "typical_mileage": 12000,
    },
    "central": {
        "name": "Central Kenya (Nairobi satellites, Thika, Murang'a)",
        "adjustment": 0.0,
        "reason": "Baseline (moderate traffic & safety)",
        "typical_mileage": 10000,
    },
    "western": {
        "name": "Western Kenya (Kisumu, Nakuru, Eldoret)",
        "adjustment": -0.02,
        "reason": "Lower traffic density, safer roads",
        "typical_mileage": 10000,
    },
    "northern": {
        "name": "Northern Kenya (Samburu, Turkana, Garissa)",
        "adjustment": 0.08,
        "reason": "Poor road conditions, remote access, higher risk",
        "typical_mileage": 15000,
    },
}

# ============================================================
# CONTACT INFORMATION
# ============================================================
CUSTOMER_SERVICE = {
    "email": "support@insurai.co.ke",
    "phone": "+254 700 XXX XXX",
    "whatsapp": "+254 700 XXX XXX",
    "claims": "claims@insurai.co.ke",
    "complaints": "escalations@insurai.co.ke",
    "hours": "Monday–Friday, 8:00 AM–5:00 PM EAT (UTC+3)",
}

# Regulatory contacts
REGULATORY_CONTACTS = {
    "ira_portal": "https://www.ira.go.ke/complaints",
    "ira_email": "feedback@ira.go.ke",
    "ira_phone": "+254 20 3227 100",
    "ombudsman_email": "complaints@ombudsman.go.ke",
    "ombudsman_portal": "https://www.ombudsman.go.ke",
}

# ============================================================
# FEATURE ENGINEERING (For ML Model)
# ============================================================
# Expected model input features (after preprocessing)
MODEL_FEATURES = [
    "age",
    "gender",
    "driving_experience",
    "vehicle_ownership",
    "annual_mileage",
    "vehicle_type",
    "speeding_violations",
    "duis",
    "young_driver",
    "senior_driver",
]

# Feature mappings for encoding
FEATURE_ENCODINGS = {
    "gender": GENDER_ENCODING,
    "vehicle_type": {v["code"]: k for k, v in VEHICLE_TYPES.items()},
    "vehicle_ownership": {"owned": 1, "financed": 0, "leased": 0},
}

print("✓ Kenya market configuration loaded successfully")
print(f"✓ Currency: {CURRENCY_NAME} ({CURRENCY_SYMBOL})")
print(f"✓ Base Premium (Comprehensive): KES {BASE_PREMIUMS['comprehensive']:,.0f}/month")
print(f"✓ Regulatory Body: {REGULATORY_BODY}")
