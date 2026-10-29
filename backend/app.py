"""
InsurAI Backend — Flask Application Entry Point
"""
from flask import Flask
from flask_cors import CORS
from config import Config
from routes.quote import quote_bp
from routes.ocr import ocr_bp
from routes.auth import auth_bp

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Allow React dev server and production domain
    CORS(app, resources={r"/api/*": {"origins": [
        "http://localhost:5173",
        "https://insurai.vercel.app"
    ]}})

    # Register blueprints (route groups)
    app.register_blueprint(quote_bp, url_prefix="/api")
    app.register_blueprint(ocr_bp,   url_prefix="/api")
    app.register_blueprint(auth_bp,  url_prefix="/api")

    @app.get("/")
    def health():
        return {"status": "InsurAI backend running", "version": "1.0.0"}

    return app


if __name__ == "__main__":
    app = create_app()
    # debug=False in production; set PORT env var on Railway/Heroku
    app.run(host="0.0.0.0", port=5000, debug=True)
