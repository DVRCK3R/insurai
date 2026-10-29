import { useState, useRef } from "react";
import { scanDocument } from "../services/api";
import { auth } from "../services/firebase";

export default function FileUpload({ onScanComplete }) {
  const [status, setStatus] = useState("idle");
  const [result, setResult] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef();

  const handleFile = async (file) => {
    if (!file) return;
    setStatus("uploading");
    setResult(null);
    try {
      const userId = auth.currentUser?.uid || "anonymous";
      const data = await scanDocument(file, userId, "license");
      setResult(data);
      setStatus("done");
      if (onScanComplete) onScanComplete(data);
    } catch (err) {
      setStatus("error");
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  };

  return (
    <div className="w-full">
      <div
        className={`relative border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-300
          ${dragOver 
            ? "border-indigo-500 bg-indigo-50/50 shadow-lg scale-105" 
            : "border-gray-300 hover:border-indigo-400 hover:bg-indigo-50/20"}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current.click()}
      >
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp"
          className="hidden" onChange={(e) => handleFile(e.target.files[0])} />
        
        {status === "uploading" ? (
          <div className="space-y-3">
            <div className="flex justify-center">
              <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
            </div>
            <p className="text-sm font-medium text-indigo-600">Scanning your document…</p>
            <p className="text-xs text-gray-500">Using OCR to extract details</p>
          </div>
        ) : (
          <>
            <div className="text-5xl mb-4 animate-bounce">📄</div>
            <p className="text-base font-semibold text-gray-900 mb-1">Upload your documents</p>
            <p className="text-sm text-gray-600 mb-3">
              Drag and drop or <span className="text-indigo-600 font-bold hover:underline">browse</span> your files
            </p>
            <p className="text-xs text-gray-500 font-medium">JPEG, PNG, WebP • Max 5 MB</p>
          </>
        )}
      </div>

      {status === "done" && result && (
        <div className="mt-6 space-y-4 animate-slide-up">
          {Object.keys(result.fields || {}).length > 0 && (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-indigo-200 rounded-xl p-5">
              <p className="text-xs font-bold uppercase tracking-widest text-indigo-700 mb-4">✓ Detected Information</p>
              <div className="space-y-2">
                {Object.entries(result.fields).map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between">
                    <span className="text-sm text-indigo-700 capitalize font-medium">{k.replace(/([A-Z])/g, " $1")}</span>
                    <span className="text-sm font-bold text-indigo-900 bg-white/50 px-3 py-1 rounded-lg">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {result.fraudSignals?.length > 0 ? (
            <div className="bg-gradient-to-br from-red-50 to-rose-50 border border-red-300 rounded-xl p-5">
              <p className="text-xs font-bold uppercase tracking-widest text-red-700 mb-3">⚠️ Potential Issues Found</p>
              <ul className="space-y-2">
                {result.fraudSignals.map((s, i) => (
                  <li key={i} className="text-sm text-red-700 flex items-start gap-2">
                    <span className="text-red-500 font-bold mt-0.5">•</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-300 rounded-xl p-5">
              <p className="text-sm font-bold text-green-700">✓ All checks passed — Document verified</p>
            </div>
          )}
        </div>
      )}

      {status === "error" && (
        <div className="mt-4 bg-red-50 border-l-4 border-red-500 rounded-lg p-4 animate-slide-up">
          <p className="font-semibold text-red-900 text-sm mb-1">Scan Failed</p>
          <p className="text-red-700 text-sm">Unable to process document. Please ensure Tesseract is installed or try another file.</p>
        </div>
      )}
    </div>
  );
}
