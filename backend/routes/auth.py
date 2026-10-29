"""
/api/auth  — Firebase token verification
POST /api/auth/verify  → verifies a client-side Firebase ID token
                          and returns user info

Use this to protect any endpoint that needs a logged-in user.
"""
from flask import Blueprint, request, jsonify
import firebase_admin.auth as fb_auth
from utils.firebase import init_firebase

auth_bp = Blueprint("auth", __name__)


@auth_bp.post("/auth/verify")
def verify_token():
    """
    Body: { "idToken": "<firebase-id-token>" }
    Returns: { "uid": "...", "email": "...", "name": "..." }
    """
    init_firebase()
    data = request.get_json(silent=True) or {}
    id_token = data.get("idToken", "")
    if not id_token:
        return jsonify({"error": "idToken required"}), 400

    try:
        decoded = fb_auth.verify_id_token(id_token)
        return jsonify({
            "uid":   decoded["uid"],
            "email": decoded.get("email", ""),
            "name":  decoded.get("name", ""),
        })
    except Exception as e:
        return jsonify({"error": "Invalid token", "detail": str(e)}), 401
