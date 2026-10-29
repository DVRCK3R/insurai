#!/usr/bin/env python3
"""Quick test of Kenya KES pricing"""
from models.risk_model import predict

profiles = {
    "Low-risk": {
        "age": 40,
        "gender": "male",
        "driving_experience": 15,
        "vehicle_ownership": 1,
        "annual_mileage": 6000,
        "vehicle_type": "sedan",
        "speeding_violations": 0,
        "duis": 0,
    },
    "High-risk": {
        "age": 22,
        "gender": "male",
        "driving_experience": 2,
        "vehicle_ownership": 0,
        "annual_mileage": 22000,
        "vehicle_type": "truck",
        "speeding_violations": 3,
        "duis": 1,
    },
}

print("=" * 70)
print("InsurAI Kenya — KES Premium Quotes")
print("=" * 70)

for profile_name, data in profiles.items():
    result = predict(data)
    print(f"\n{profile_name} Driver:")
    print(f"  Risk Score: {result['risk_score']:.2%}")
    print(f"  Risk Level: {result['risk_level'].upper()}")
    print(f"  Monthly Premium: KES {result['monthly_premium']:,.2f}")
    print(f"  Insurable: {'✓ Yes' if result['insurable'] else '✗ No'}")
    print(f"  Currency: {result['currency']}")
    print(f"  Top Risk Factors: {', '.join(result['top_risk_factors'][:2])}")
    if not result["insurable"]:
        print(f"  Note: Flagged for underwriting review (high risk)")

print("\n" + "=" * 70)
print("Base Premium (Comprehensive): KES 3,500/month")
print("Risk Range: 65% (KES 2,275) to 165% (KES 5,775)")
print("=" * 70)
