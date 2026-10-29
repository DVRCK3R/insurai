"""
/api/ocr  — document scanning endpoint
POST /api/ocr  — accepts an image upload, returns extracted text + fraud signals
"""
import io
import os
import sys
import numpy as np
import pytesseract
from PIL import Image, ImageOps, ImageEnhance
from flask import Blueprint, request, jsonify
from utils.firebase import upload_document

# Configure Tesseract path for Windows
tesseract_path = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
if os.path.exists(tesseract_path):
    pytesseract.pytesseract.pytesseract_cmd = tesseract_path
else:
    print(f"WARNING: Tesseract not found at {tesseract_path}", file=sys.stderr)

ocr_bp = Blueprint("ocr", __name__)

# Maximum allowed file size (5 MB)
MAX_BYTES = 5 * 1024 * 1024
ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp", "application/pdf"}


@ocr_bp.post("/ocr")
def scan_document():
    """
    Accepts: multipart/form-data with fields:
      - file      : image file (JPEG / PNG)
      - userId    : Firebase UID (optional, used to store the upload)
      - docType   : "license" | "registration" | "policy" (optional hint)

    Returns:
    {
      "text": "...",                  // extracted text
      "fields": { "name": "...", ... }, // parsed key fields
      "fraudSignals": [...],           // list of anomalies detected
      "fileUrl": "https://..."         // Firebase Storage URL
    }
    """
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    f = request.files["file"]
    user_id = request.form.get("userId", "anonymous")
    doc_type = request.form.get("docType", "unknown")

    if f.content_type not in ALLOWED_TYPES:
        return jsonify({"error": "Unsupported file type"}), 415

    raw_bytes = f.read()
    if len(raw_bytes) > MAX_BYTES:
        return jsonify({"error": "File too large (max 5 MB)"}), 413

    # ── PIL preprocessing for better OCR accuracy ──────────────────────────
    # Open image from bytes
    pil_img = Image.open(io.BytesIO(raw_bytes))
    
    # Convert to RGB if necessary (handles RGBA, grayscale, etc.)
    if pil_img.mode != 'RGB':
        pil_img = pil_img.convert('RGB')
    
    # Convert to grayscale
    pil_img = ImageOps.grayscale(pil_img)
    
    # Enhance contrast to improve OCR
    enhancer = ImageEnhance.Contrast(pil_img)
    pil_img = enhancer.enhance(2.0)
    
    # Convert to binary (black and white)
    threshold = 128
    # Use 8-bit grayscale (0-255). Using mode '1' can produce boolean arrays,
    # which breaks cv2.Laplacian with: "src data type = bool is not supported".
    pil_img = pil_img.point(lambda x: 0 if x < threshold else 255, 'L')

    # ── Tesseract OCR ──────────────────────────────────────────────────────────
    # --psm 6: assume a single uniform block of text
    # --oem 3: use LSTM engine
    custom_config = r"--oem 3 --psm 6"
    extracted_text = pytesseract.image_to_string(pil_img, config=custom_config)

    # ── Parse key fields from extracted text ──────────────────────────────────
    fields = _parse_fields(extracted_text, doc_type)

    # ── Fraud / anomaly detection ─────────────────────────────────────────────
    fraud_signals = _check_fraud(pil_img, extracted_text)

    # ── Upload original to Firebase Storage ───────────────────────────────────
    file_url = None
    try:
        file_url = upload_document(raw_bytes, f.filename or "doc.jpg", user_id)
    except Exception:
        pass  # Non-fatal

    return jsonify({
        "text":         extracted_text.strip(),
        "fields":       fields,
        "fraudSignals": fraud_signals,
        "fileUrl":      file_url,
    })


def _parse_fields(text: str, doc_type: str) -> dict:
    """
    Regex-light field extraction — grabs common patterns from license text.
    Extend per your country's document format.
    """
    import re
    fields = {}

    # Date of birth patterns: DD/MM/YYYY or MM/DD/YYYY or YYYY-MM-DD
    dob_match = re.search(
        r"\b(?:DOB|DATE OF BIRTH|D\.O\.B)[:\s]*"
        r"(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})", text, re.I
    )
    if dob_match:
        fields["dob"] = dob_match.group(1)

    # License number: letter + digits pattern
    lic_match = re.search(r"\b([A-Z]{1,3}\d{6,10})\b", text)
    if lic_match:
        fields["licenseNumber"] = lic_match.group(1)

    # Name on document (look for "NAME" label)
    name_match = re.search(r"\bNAME[:\s]+([A-Z ]{4,40})\b", text, re.I)
    if name_match:
        fields["name"] = name_match.group(1).strip().title()

    return fields


def _check_fraud(pil_img, text: str) -> list:
    """
    Basic anomaly signals — not a replacement for a dedicated fraud model.
    Returns a list of human-readable warning strings.
    """
    signals = []

    # Signal 1: Unusually small image (real photos from cameras are large)
    w, h = pil_img.size
    if w < 400 or h < 250:
        signals.append("Image resolution too low for a genuine document photo")

    # Signal 2: OCR confidence — if very little text found, something is off
    if len(text.strip()) < 30:
        signals.append("Very little text detected — document may be obscured or fake")

    # Signal 3: Check image sharpness using Laplacian variance
    import cv2
    img_array = np.array(pil_img)
    if len(img_array.shape) == 3:
        gray = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)
    else:
        gray = img_array
    
    laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
    if laplacian_var < 50:
        signals.append("Image appears heavily compressed or blurry")

    return signals
