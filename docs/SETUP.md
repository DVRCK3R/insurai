# Firebase & Full Setup Guide for InsurAI

## Step 1 — Create a Firebase Project
1. Go to https://console.firebase.google.com
2. Click "Add project" → name it `insurai` → disable Analytics → Create

## Step 2 — Enable Firestore
1. Build → Firestore Database → Create database
2. Start in test mode → choose region nearest to you → Enable

Firestore Security Rules (after testing):
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /quotes/{quoteId} {
      allow read, write: if request.auth != null
                         && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null;
    }
  }
}
```

## Step 3 — Enable Storage
1. Build → Storage → Get started → Test mode → Done
2. Storage Rules:
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /documents/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Step 4 — Enable Authentication
1. Build → Authentication → Get started
2. Sign-in method → Enable Google
3. Add localhost and your production domain to Authorised domains

## Step 5 — Service Account Key (Backend)
1. Gear icon ⚙ → Project settings → Service accounts tab
2. "Generate new private key" → save as `backend/firebase-key.json`
3. Add `firebase-key.json` to .gitignore!

## Step 6 — Web Config (Frontend)
1. Project settings → General → Your apps → copy firebaseConfig
2. Copy `frontend/.env.example` to `frontend/.env` and fill in the values:
```
VITE_FIREBASE_API_KEY=your_key_here
VITE_FIREBASE_AUTH_DOMAIN=insurai.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=insurai
VITE_FIREBASE_STORAGE_BUCKET=insurai.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123:web:abc
VITE_API_URL=http://localhost:5000
```
`frontend/.env` is ignored by Git. Values prefixed with `VITE_` are exposed in
the frontend bundle, so do not put service-account keys, private keys, or other
server secrets in this file. Firebase web config is client-side configuration;
use Firebase Authentication and restrictive Firestore/Storage rules to protect
data.

## Step 7 — Backend .env
```
FLASK_SECRET_KEY=change-this-random-string
FIREBASE_KEY_PATH=firebase-key.json
FIREBASE_STORAGE_BUCKET=insurai.appspot.com
MODEL_PATH=models/risk_model.pkl
```

## Step 8 — Install Tesseract OCR
- Ubuntu/WSL: `sudo apt-get install -y tesseract-ocr`
- macOS:      `brew install tesseract`
- Windows:    https://github.com/UB-Mannheim/tesseract/wiki

## Step 9 — Run everything locally
```bash
# Terminal 1 — Backend
cd backend && source venv/bin/activate && python app.py

# Terminal 2 — Frontend
cd frontend && npm run dev

# Terminal 3 — Train model (once)
cd notebooks && jupyter notebook model_training.ipynb
```

## Step 10 — Deploy
Frontend → Vercel: push to GitHub, connect at vercel.com, set VITE_* env vars
Backend  → Railway: push to GitHub, connect at railway.app, set env vars

Add `backend/Procfile`:
```
web: gunicorn "app:create_app()" --bind 0.0.0.0:$PORT --workers 2
```
