"""
Configuration — reads environment variables from .env file.
Copy .env.example to .env and fill in your values.

.env.example:
  FLASK_SECRET_KEY=your-secret-key-here
  FIREBASE_KEY_PATH=firebase-key.json
  MODEL_PATH=models/risk_model.pkl
"""
import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY        = os.getenv("FLASK_SECRET_KEY", "dev-only-change-me")
    FIREBASE_KEY_PATH = os.getenv("FIREBASE_KEY_PATH", "firebase-key.json")
    MODEL_PATH        = os.getenv("MODEL_PATH", "models/risk_model.pkl")
    MAX_UPLOAD_MB     = 5
    ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "pdf"}
