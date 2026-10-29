# InsurAI — AI-Powered Underwriting Automation

A full-stack web application that uses machine learning to automate insurance risk
assessment and generate instant premium quotes.

---

## Project Structure

### View project directory

```text
insurai/
├── backend/
│   ├── app.py
│   ├── config.py
│   ├── requirements.txt
│   ├── models/
│   ├── routes/
│   └── utils/
├── frontend/
│   ├── package.json
│   └── src/
│       ├── App.jsx
│       ├── components/
│       ├── pages/
│       └── services/
├── notebooks/
│   └── model_training.ipynb
├── docs/
│   └── SETUP.md
├── .gitignore
└── README.md
```

---

## Tech Stack

| Layer      | Technology                            |
|------------|---------------------------------------|
| Frontend   | React.js, Tailwind CSS, Axios         |
| Backend    | Python 3.10+, Flask                   |
| ML/AI      | Scikit-learn, XGBoost, Pandas         |
| OCR        | Tesseract (pytesseract), OpenCV       |
| Database   | Firebase Firestore                    |
| Storage    | Firebase Cloud Storage                |
| Auth       | Firebase Authentication               |
| Deployment | Vercel (frontend) + Railway (backend) |

---

## Quick Start

### Prerequisites

- Python 3.10+
- Node.js 18+
- A Firebase project (free tier works)
- Tesseract OCR installed on your system

### Step 1 — Clone and install

```bash
git clone https://github.com/yourname/insurai.git
cd insurai
```

### Step 2 — Firebase setup (see SETUP.md for full guide)

1. Go to https://console.firebase.google.com
2. Create a new project called "insurai"
3. Enable Firestore, Storage, and Authentication
4. Download the service account key JSON → save as `backend/firebase-key.json` (never commit this file)
5. Copy `frontend/.env.example` to `frontend/.env` and fill in your Firebase web config

The `VITE_*` values are included in the browser bundle and are not suitable for
server secrets. Protect Firebase data with authentication and Firebase Security
Rules; keep service-account credentials and other private keys on the backend.

### Step 3 — Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py
# → Runs on http://localhost:5000
```

### Step 4 — Train the ML model

```bash
cd notebooks
jupyter notebook model_training.ipynb
# Run all cells — saves model to backend/models/risk_model.pkl
```

### Step 5 — Frontend

```bash
cd frontend
npm install
npm run dev
# → Runs on http://localhost:5173
```

---

## Answering the Challenge Questions

**1. How does your model decide "high-risk" vs "low-risk"?**
The Random Forest model assigns risk using features: age, vehicle age, annual mileage,
prior claims count, speeding violations, and vehicle type. Each tree votes; the majority
decision sets the class. SHAP values explain each individual prediction.

**2. Can your AI handle missing data?**
Yes. The preprocessing pipeline uses median imputation for numeric fields and
mode imputation for categorical fields. Users who skip optional fields (e.g. job title)
still get a valid quote — the model was trained with intentionally missing values.

**3. What's the biggest limitation?**
The model is trained on historical data that may encode existing biases (e.g.
zip-code-correlated pricing). Without bias auditing, it can perpetuate unfair pricing
for underrepresented groups. This is a known challenge in AI underwriting.
