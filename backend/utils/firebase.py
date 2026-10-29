"""
Firebase Admin SDK — initialised once at import time.
Provides helpers for Firestore and Storage.
"""
import firebase_admin
from firebase_admin import credentials, firestore, storage
from flask import current_app
import os

_initialized = False

def init_firebase():
    global _initialized
    if _initialized:
        return
    key_path = os.getenv("FIREBASE_KEY_PATH", "firebase-key.json")
    cred = credentials.Certificate(key_path)
    firebase_admin.initialize_app(cred, {
        "storageBucket": os.getenv("FIREBASE_STORAGE_BUCKET", "insurai.appspot.com")
    })
    _initialized = True


def get_db():
    """Return Firestore client (auto-initialises Firebase if needed)."""
    init_firebase()
    return firestore.client()


def save_quote(user_id: str, quote_data: dict) -> str:
    """
    Persist a quote to Firestore.
    Returns the auto-generated document ID.
    """
    db = get_db()
    doc_ref = db.collection("quotes").document()
    doc_ref.set({
        "userId": user_id,
        **quote_data,
        "createdAt": firestore.SERVER_TIMESTAMP
    })
    return doc_ref.id


def get_user_quotes(user_id: str) -> list:
    """Fetch all quotes for a given user, newest first."""
    db = get_db()
    docs = (
        db.collection("quotes")
          .where("userId", "==", user_id)
          .order_by("createdAt", direction=firestore.Query.DESCENDING)
          .limit(20)
          .stream()
    )
    return [{"id": d.id, **d.to_dict()} for d in docs]


def upload_document(file_bytes: bytes, filename: str, user_id: str) -> str:
    """
    Upload a document image to Firebase Storage.
    Returns the public download URL.
    """
    init_firebase()
    bucket = storage.bucket()
    blob = bucket.blob(f"documents/{user_id}/{filename}")
    blob.upload_from_string(file_bytes, content_type="image/jpeg")
    blob.make_public()
    return blob.public_url
