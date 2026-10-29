/**
 * API service — wraps all calls to the Flask backend.
 * Base URL comes from .env: VITE_API_URL=http://localhost:5000
 */
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000",
  timeout: 30000,
});

/**
 * Request a quote.
 * @param {object} formData  — user's application data
 * @param {string} userId    — Firebase UID (optional)
 */
export async function requestQuote(formData, userId = null) {
  const { data } = await api.post("/api/quote", { ...formData, userId });
  return data;
}

/**
 * Scan a document with OCR.
 * @param {File}   file     — image file from <input type="file">
 * @param {string} userId   — Firebase UID
 * @param {string} docType  — "license" | "registration" | "policy"
 */
export async function scanDocument(file, userId, docType = "license") {
  const form = new FormData();
  form.append("file", file);
  form.append("userId", userId);
  form.append("docType", docType);
  const { data } = await api.post("/api/ocr", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

/**
 * Fetch a user's past quotes.
 */
export async function fetchHistory(userId) {
  const { data } = await api.get("/api/quote/history", { params: { userId } });
  return data.quotes;
}
