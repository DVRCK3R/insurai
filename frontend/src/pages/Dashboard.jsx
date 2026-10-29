import { useState, useEffect } from "react";
import { auth, fetchQuoteHistory, deleteQuoteFromFirestore } from "../services/firebase";
import { getQuotesLocally, mergeQuotes, deleteQuoteLocally } from "../services/localStorage";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";


const LEVEL_BADGE = {
  low:    "bg-green-100 text-green-800",
  medium: "bg-amber-100 text-amber-800",
  high:   "bg-red-100 text-red-800",
};

export default function Dashboard() {
  const [user, setUser]     = useState(null);
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState(""); // Track data source
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) { navigate("/"); return; }
      setUser(u);
      try {
        let allQuotes = [];
        let dataSource = "";
        
        // Try to fetch from Firestore first
        try {
          const firestoreQuotes = await fetchQuoteHistory(u.uid);
          allQuotes = firestoreQuotes;
          dataSource = "firebase";
        } catch (firestoreErr) {
          console.warn("Firestore fetch failed, falling back to local storage:", firestoreErr);
          dataSource = "local";
        }
        
        // Get local storage quotes
        const localQuotes = getQuotesLocally(u.uid);
        
        // Merge both sources if we have local quotes
        if (localQuotes.length > 0) {
          allQuotes = mergeQuotes(allQuotes, localQuotes);
          if (dataSource === "local") {
            dataSource = "local-only";
          } else {
            dataSource = "merged";
          }
        }
        
        setQuotes(allQuotes);
        setSource(dataSource);
      } catch (e) {
        console.error("Failed to load quotes:", e);
        // Last resort: try local storage only
        const localQuotes = getQuotesLocally(u.uid);
        setQuotes(localQuotes);
        setSource("local");
      } finally {
        setLoading(false);
      }
    });
    return unsub;
  }, [navigate]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4" />
      <p className="text-gray-600 font-medium">Loading your dashboard…</p>
    </div>
  );

  const removeQuoteById = (quoteId) => {
    setQuotes((prev) => prev.filter((q) => q.id !== quoteId));
  };

  const handleDeleteQuote = async (q) => {
    if (!user) return;

    const ok = window.confirm(
      "Delete this quote from your history? This action cannot be undone."
    );
    if (!ok) return;

    const quoteId = q?.id;
    const source = q?._source || "";

    // Optimistic UI update
    removeQuoteById(quoteId);

    try {
      if (source === "firestore") {
        await deleteQuoteFromFirestore(user.uid, quoteId);
        return;
      }

      if (source === "local") {
        deleteQuoteLocally(user.uid, quoteId);
        return;
      }

      // Fallback: attempt both
      const firestoreDeleted = await deleteQuoteFromFirestore(user.uid, quoteId);
      if (!firestoreDeleted) {
        deleteQuoteLocally(user.uid, quoteId);
      }
    } catch (err) {
      console.error("Failed to delete quote:", err);
      // If deletion fails, re-fetch would be ideal; keep UI stable by reloading locally for now.
      try {
        const localQuotes = getQuotesLocally(user.uid);
        const firestoreQuotes = await fetchQuoteHistory(user.uid);
        const allQuotes = mergeQuotes(firestoreQuotes, localQuotes);
        setQuotes(allQuotes);
      } catch (e) {
        // no-op
      }
    }
  };

  // Calculate dashboard stats
  const totalQuotes = quotes.length;
  const lowRiskQuotes = quotes.filter((q) => q.result?.risk_level === "low").length;
  const avgRiskScore = quotes.length > 0
    ? (quotes.reduce((sum, q) => sum + (q.result?.risk_score || 0), 0) / quotes.length * 100).toFixed(0)
    : 0;
  const totalSavings = quotes.filter((q) => q.result?.insurable).length; // Count of insurable profiles


  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 p-8 text-white shadow-xl">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full mix-blend-multiply filter blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full mix-blend-multiply filter blur-3xl" />
        </div>
        
        <div className="relative z-10">
          <h1 className="text-4xl md:text-5xl font-bold mb-2">Welcome back, {user?.displayName?.split(' ')[0] || 'Driver'}</h1>
          <p className="text-indigo-100 text-lg mb-6">Your personalized insurance dashboard powered by AI</p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 border border-white/30">
              <p className="text-indigo-100 text-sm font-semibold uppercase tracking-wide mb-1">Total Quotes</p>
              <p className="text-3xl font-bold">{totalQuotes}</p>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 border border-white/30">
              <p className="text-indigo-100 text-sm font-semibold uppercase tracking-wide mb-1">Low Risk</p>
              <p className="text-3xl font-bold">{lowRiskQuotes}</p>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 border border-white/30">
              <p className="text-indigo-100 text-sm font-semibold uppercase tracking-wide mb-1">Avg Score</p>
              <p className="text-3xl font-bold">{avgRiskScore}%</p>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 border border-white/30">
              <p className="text-indigo-100 text-sm font-semibold uppercase tracking-wide mb-1">Insurable</p>
              <p className="text-3xl font-bold">{totalSavings}</p>
            </div>
          </div>
        </div>
      </div>

      {/* AI Badge - Relocated */}
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-gray-900">Your Quote History</h2>
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-indigo-100 to-purple-100 border border-indigo-300">
          <span className="text-lg">⚡</span>
          <span className="text-xs font-bold uppercase tracking-widest bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">AI Powered Analysis</span>
        </div>
      </div>
      {quotes.length === 0 ? (
        <div className="text-center py-20 space-y-4">
          <div className="text-7xl mb-6 animate-bounce">🚗</div>
          <h3 className="text-2xl font-bold text-gray-900">No quotes yet</h3>
          <p className="text-gray-600">Start your journey to smarter insurance today</p>
          <a href="/" className="inline-block mt-4 px-6 py-3 rounded-lg font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:shadow-lg hover:scale-105 transition-all duration-300">
            Get Your First Quote →
          </a>
        </div>
      ) : (
        <>
          {/* Achievement Section - Surprise Element! */}
          {totalQuotes >= 3 && (
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-400 p-6 shadow-lg animate-slide-up">
              <div className="absolute inset-0 opacity-20">
                <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.1)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.1)_50%,rgba(255,255,255,0.1)_75%,transparent_75%,transparent)] bg-[length:40px_40px] animate-pulse" />
              </div>
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-amber-900 uppercase tracking-widest mb-1">🎉 Achievement Unlocked!</p>
                  <h3 className="text-2xl font-bold text-amber-900">Insurance Expert {totalQuotes >= 5 ? '⭐⭐⭐' : totalQuotes >= 3 ? '⭐⭐' : '⭐'}</h3>
                  <p className="text-amber-800 text-sm mt-1">You've completed {totalQuotes} quote{totalQuotes !== 1 ? 's' : ''} and are becoming a pro! {totalQuotes >= 5 && '🏆'}</p>
                </div>
                <span className="text-6xl">{totalQuotes >= 5 ? '🏆' : totalQuotes >= 3 ? '⭐' : '🚀'}</span>
              </div>
            </div>
          )}

          {/* Quotes List */}
          <div className="space-y-3">
          {quotes.map((q) => {
            const r = q.result || {};
            const badge = LEVEL_BADGE[r.risk_level] || "bg-gray-100 text-gray-600";
            const date = q.createdAt?.toDate ? q.createdAt.toDate().toLocaleDateString() : q.createdAt ? new Date(q.createdAt).toLocaleDateString() : "—";
            const dateTime = q.createdAt?.toDate ? q.createdAt.toDate().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : q.createdAt ? new Date(q.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : "";
            
            return (
              <div key={q.id} className="group bg-white hover:shadow-lg transition-all duration-300 rounded-xl border border-gray-200 hover:border-indigo-300 p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`text-xs font-bold px-3 py-1 rounded-lg ${badge}`}>
                        {(r.risk_level||"—").charAt(0).toUpperCase()+(r.risk_level||"").slice(1)} risk
                      </span>
                      <span className="text-xs text-gray-500">{date} • {dateTime}</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <button
                      type="button"
                      onClick={() => handleDeleteQuote(q)}
                      className="text-sm font-semibold text-red-700 hover:text-red-800 hover:underline"
                    >
                      Delete
                    </button>

                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900">
                        {r.insurable ? `KES ${r.monthly_premium?.toLocaleString()}` : "—"}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">{r.insurable ? "per month" : "Not insurable"}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-lg p-3">
                    <p className="text-gray-600 text-xs font-semibold uppercase tracking-wide mb-1">Risk score</p>
                    <p className="font-bold text-lg text-gray-900">{((r.risk_score||0)*100).toFixed(0)}%</p>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-lg p-3">
                    <p className="text-gray-600 text-xs font-semibold uppercase tracking-wide mb-1">Confidence</p>
                    <p className="font-bold text-lg text-gray-900">{((r.confidence||0)*100).toFixed(0)}%</p>
                  </div>
                  <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-lg p-3">
                    <p className="text-gray-600 text-xs font-semibold uppercase tracking-wide mb-1">Vehicle</p>
                    <p className="font-bold text-lg text-gray-900 capitalize">{q.input?.vehicle_type||"—"}</p>
                  </div>
                  <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-lg p-3">
                    <p className="text-gray-600 text-xs font-semibold uppercase tracking-wide mb-1">Mileage</p>
                    <p className="font-bold text-lg text-gray-900">{q.input?.annual_mileage?.toLocaleString()||"—"}</p>
                  </div>
                </div>
                {r.top_risk_factors?.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Key risk factors</p>
                    <div className="flex flex-wrap gap-2">
                      {r.top_risk_factors.map((f, i) => (
                        <span key={i} className="text-xs bg-red-50 text-red-700 px-2 py-1 rounded-md font-medium">
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          </div>
        </>
      )}
    </div>
  );
}
