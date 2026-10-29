"""
/api/quote  — main underwriting endpoint
POST /api/quote  → returns AI risk assessment + premium
GET  /api/quote/history?userId=xxx  → returns past quotes from Firestore
"""
from flask import Blueprint, request, jsonify
from models.risk_model import predict
from utils.firebase import save_quote, get_user_quotes

quote_bp = Blueprint("quote", __name__)


@quote_bp.post("/quote")
def get_quote():
    """
    Expected JSON body:
    {
      "age": 28,
      "gender": "M",
      "driving_experience": 8,
      "vehicle_ownership": "YES",
      "annual_mileage": 15000,
      "vehicle_type": "Sedan",
      "speeding_violations": 1,
      "duis": 0,
      "userId": "firebase-uid-optional"
    }
    """
    data = request.get_json(force=True, silent=True)
    if not data:
        return jsonify({"error": "Invalid or missing JSON body"}), 400

    # Basic validation — only age is strictly required
    if "age" not in data:
        return jsonify({"error": "Field 'age' is required"}), 422

    try:
        result = predict(data)
    except FileNotFoundError as e:
        return jsonify({"error": str(e)}), 503
    except Exception as e:
        return jsonify({"error": f"Prediction failed: {str(e)}"}), 500

    # Persist to Firestore if a userId was provided
    quote_id = None
    user_id = data.get("userId")
    if user_id:
        try:
            quote_id = save_quote(user_id, {
                "input": data,
                "result": result,
            })
        except Exception:
            pass  # Don't fail the quote if storage fails

    return jsonify({
        "quoteId":  quote_id,
        "input":    data,
        "result":   result,
    })


@quote_bp.get("/quote/history")
def quote_history():
    user_id = request.args.get("userId")
    if not user_id:
        return jsonify({"error": "userId query param required"}), 400
    try:
        quotes = get_user_quotes(user_id)
        return jsonify({"quotes": quotes})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
