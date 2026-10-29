import { useState, useEffect } from "react";
import { auth, saveQuoteToFirestore } from "../services/firebase";
import { saveQuoteLocally } from "../services/localStorage";
import { onAuthStateChanged } from "firebase/auth";
import { requestQuote } from "../services/api";
import QuoteForm from "../components/QuoteForm";
import ResultCard from "../components/ResultCard";
import FileUpload from "../components/FileUpload";

export default function Home() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, setUser);
    return unsub;
  }, []);

  const handleSubmit = async (formData) => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await requestQuote(formData, user?.uid || null);
      setResult(data.result);
      
      // Save quote to Firestore if logged in
      if (user?.uid) {
        await saveQuoteToFirestore(user.uid, formData, data.result);
      }
      
      // Always save to local storage as backup
      saveQuoteLocally(user?.uid || "anonymous", formData, data.result);
    } catch (err) {
      setError(err.response?.data?.error || "Could not reach backend. Is Flask running on port 5000?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-indigo-50/30">
      {/* Hero Section */}
      <div className="max-w-5xl mx-auto px-4 pt-20 pb-16">
        <div className="text-center space-y-6">
          <div className="inline-block">
            <span className="px-4 py-2 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold uppercase tracking-wide animate-pulse">
              AI-Powered Insurance Quotes
            </span>
          </div>
          <div>
            <h1 className="text-6xl md:text-7xl font-black text-gray-900 leading-tight tracking-tight mb-3">
              Your Quote in
              <br />
              <span className="relative inline-block mt-2">
                <span className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 blur-lg opacity-75 animate-pulse" />
                <span className="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">60 seconds</span>
              </span>
            </h1>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto font-light leading-relaxed">
            Let our advanced ML model analyze your profile and deliver a personalized insurance quote tailored just for you.
          </p>
        </div>

        {/* Process Steps - Modern Vertical Design */}
        <div className="mt-16 mb-16 max-w-3xl mx-auto">
          <div className="space-y-4">
            {[
              { num: "1", title: "Fill Your Details", desc: "Quick form with driving & vehicle info" },
              { num: "2", title: "AI Analysis", desc: "Our model processes 20+ risk factors" },
              { num: "3", title: "Instant Quote", desc: "Get your personalized premium" }
            ].map(({ num, title, desc }, idx) => (
              <div key={num} className="flex items-start gap-4 group">
                <div className="flex-shrink-0 mt-1">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-sm font-bold shadow-lg group-hover:shadow-xl transition-all">
                    {num}
                  </div>
                  {idx < 2 && <div className="w-0.5 h-12 bg-gradient-to-b from-indigo-300 to-transparent ml-[19px] mt-2" />}
                </div>
                <div className="flex-1 pt-1 group-hover:translate-x-1 transition-transform duration-300">
                  <h3 className="font-semibold text-gray-900 text-lg">{title}</h3>
                  <p className="text-gray-600 text-sm mt-1">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Form Section */}
        <div className="max-w-2xl mx-auto mb-12">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 hover:shadow-xl transition-shadow duration-300">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Get Your Quote</h2>
            <p className="text-gray-600 text-sm mb-6">Fill in your information to get started</p>
            <QuoteForm onSubmit={handleSubmit} loading={loading} />
          </div>
        </div>

        {/* Result Section */}
        {result && (
          <div className="max-w-2xl mx-auto mb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <ResultCard result={result} />
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="max-w-2xl mx-auto mb-12 animate-in fade-in duration-300">
            <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4">
              <div className="flex">
                <div className="text-red-500 font-bold text-xl mr-3">!</div>
                <div>
                  <p className="text-red-800 font-medium">Something went wrong</p>
                  <p className="text-red-700 text-sm mt-1">{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Save Reminder */}
        {result && !user && (
          <div className="max-w-2xl mx-auto text-center">
            <p className="text-gray-600 text-sm">
              <span className="font-semibold text-gray-900">Sign in</span> to save and track your quotes over time
            </p>
          </div>
        )}

        {/* OCR Section */}
        <div className="max-w-2xl mx-auto mt-12 mb-12">
          <div className="border border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-indigo-400 transition-colors group">
            <p className="text-sm text-gray-600 mb-3 font-medium">Have your documents ready?</p>
            <FileUpload />
          </div>
        </div>

        {/* Surprise Element - Pro Tips Section */}
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { icon: "check", color: "from-green-500 to-emerald-600", title: "Lower Premiums", tip: "Maintain a clean driving record to unlock better rates" },
              { icon: "settings", color: "from-blue-500 to-indigo-600", title: "Optimize Profile", tip: "Keep your vehicle well-maintained for lower risk scores" },
              { icon: "star", color: "from-purple-500 to-pink-600", title: "Smart Choice", tip: "Review your quote & adjust coverage to fit your needs" }
            ].map(({ icon, color, title, tip }, i) => (
              <div key={i} className="group relative overflow-hidden rounded-lg bg-white p-6 border border-gray-200 hover:border-indigo-300 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 to-purple-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative z-10">
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center mb-3 text-white font-bold`}>
                    {icon === 'check' && <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
                    {icon === 'settings' && <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
                    {icon === 'star' && <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>}
                  </div>
                  <h4 className="font-semibold text-gray-900 text-sm">{title}</h4>
                  <p className="text-xs text-gray-600 mt-2">{tip}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
