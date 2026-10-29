const LEVEL_COLORS = {
  low:    { 
    bg: "bg-gradient-to-br from-green-50 to-emerald-50", 
    border: "border-green-200", 
    text: "text-green-700",
    badgeBg: "bg-green-100 text-green-800",
    gradientFrom: "from-green-400",
    gradientTo: "to-emerald-500"
  },
  medium: { 
    bg: "bg-gradient-to-br from-amber-50 to-orange-50", 
    border: "border-amber-200", 
    text: "text-amber-700",
    badgeBg: "bg-amber-100 text-amber-800",
    gradientFrom: "from-amber-400",
    gradientTo: "to-orange-500"
  },
  high:   { 
    bg: "bg-gradient-to-br from-red-50 to-rose-50", 
    border: "border-red-200", 
    text: "text-red-700",
    badgeBg: "bg-red-100 text-red-800",
    gradientFrom: "from-red-400",
    gradientTo: "to-rose-500"
  },
};

export default function ResultCard({ result }) {
  if (!result) return null;
  const { insurable, risk_level, risk_score, monthly_premium, top_risk_factors, confidence } = result;
  const c = LEVEL_COLORS[risk_level] || LEVEL_COLORS.medium;

  return (
    <div className={`rounded-2xl border ${c.border} ${c.bg} p-8 shadow-lg hover:shadow-xl transition-all duration-300 animate-slide-up`}>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 mb-2">Your AI Quote</p>
            <h2 className={`text-4xl font-bold ${c.text}`}>
              {insurable ? `KES ${monthly_premium?.toLocaleString() || monthly_premium}/mo` : "Not Insurable"}
            </h2>
            {insurable && <p className="text-sm text-gray-600 mt-1">Monthly premium estimate</p>}
          </div>
          <span className={`px-4 py-2 rounded-lg text-sm font-bold ${c.badgeBg} whitespace-nowrap`}>
            {risk_level.charAt(0).toUpperCase() + risk_level.slice(1)} Risk
          </span>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-white/60 backdrop-blur rounded-lg p-4 border border-white/50">
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Risk Score</p>
          <div className="flex items-baseline gap-2">
            <p className={`text-3xl font-bold ${c.text}`}>{(risk_score * 100).toFixed(0)}</p>
            <p className="text-sm text-gray-500">%</p>
          </div>
          <div className="mt-3 h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${c.gradientFrom} ${c.gradientTo} transition-all duration-700`}
              style={{ width: `${risk_score * 100}%` }}
            />
          </div>
        </div>
        <div className="bg-white/60 backdrop-blur rounded-lg p-4 border border-white/50">
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Confidence</p>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-bold text-indigo-600">{(confidence * 100).toFixed(0)}</p>
            <p className="text-sm text-gray-500">%</p>
          </div>
          <div className="mt-3 h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-purple-500 transition-all duration-700"
              style={{ width: `${confidence * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Top risk factors */}
      {top_risk_factors?.length > 0 && (
        <div className="mb-6 bg-white/40 backdrop-blur rounded-lg p-4 border border-white/50">
          <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-3">
            ⚠️ Key Risk Factors
          </p>
          <div className="flex flex-wrap gap-2">
            {top_risk_factors.slice(0, 5).map((f, i) => (
              <span key={i} className={`text-xs font-medium px-3 py-1 rounded-full ${c.badgeBg}`}>
                {f}
              </span>
            ))}
          </div>
        </div>
      )}

      {!insurable && (
        <div className="mt-6 bg-white/60 border-l-4 border-red-500 rounded-lg p-4">
          <p className="font-semibold text-red-900 text-sm mb-1">Coverage Not Available</p>
          <p className="text-red-800 text-sm">
            Based on your profile, we're unable to offer coverage at this time. Our team can discuss alternative options with you.
          </p>
        </div>
      )}
    </div>
  );
}