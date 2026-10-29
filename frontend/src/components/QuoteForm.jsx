import { useState } from "react";

const VEHICLE_TYPES = ["sedan", "suv", "truck", "sports", "minivan", "other"];

export default function QuoteForm({ onSubmit, loading }) {
  const [form, setForm] = useState({
    age: "",
    gender: "male",
    married: "1",
    children: "0",
    education: "high_school",
    occupation: "employed",
    annual_mileage: "",
    vehicle_age: "",
    vehicle_type: "sedan",
    prior_claims: "0",
    speeding_violations: "0",
  });

  const set = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...form,
      age: Number(form.age),
      married: Number(form.married),
      children: Number(form.children),
      annual_mileage: Number(form.annual_mileage),
      vehicle_age: Number(form.vehicle_age),
      prior_claims: Number(form.prior_claims),
      speeding_violations: Number(form.speeding_violations),
    });
  };

  const field = (label, input, required = false) => (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-semibold text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {input}
    </div>
  );

  const input = (props) => (
    <input
      {...props}
      className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-white
                 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                 hover:border-gray-300 transition-all placeholder-gray-400"
    />
  );

  const select = (name, options) => (
    <select
      value={form[name]}
      onChange={set(name)}
      className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-white
                 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                 hover:border-gray-300 transition-all appearance-none cursor-pointer"
      style={{
        backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 8px center',
        backgroundSize: '20px',
        paddingRight: '32px',
      }}
    >
      {options.map(([val, label]) => (
        <option key={val} value={val}>{label}</option>
      ))}
    </select>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Personal info */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-indigo-600" />
          <h3 className="text-xs font-bold uppercase tracking-widest text-gray-600">Personal Details</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {field("Age", input({
            type: "number", min: 18, max: 100, required: true,
            placeholder: "e.g. 28", value: form.age, onChange: set("age"),
          }), true)}
          {field("Gender", select("gender", [["male","Male"],["female","Female"],["other","Other"]]))}
          {field("Married", select("married", [["1","Yes"],["0","No"]]))}
          {field("Children", input({
            type: "number", min: 0, max: 10,
            placeholder: "0", value: form.children, onChange: set("children"),
          }))}
          {field("Education", select("education", [
            ["high_school","High school"],["bachelor","Bachelor's"],
            ["master","Master's"],["phd","PhD"],["other","Other"],
          ]))}
          {field("Occupation", select("occupation", [
            ["employed","Employed"],["self-employed","Self-employed"],
            ["unemployed","Unemployed"],["retired","Retired"],["student","Student"],
          ]))}
        </div>
      </div>

      {/* Vehicle info */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-purple-600" />
          <h3 className="text-xs font-bold uppercase tracking-widest text-gray-600">Vehicle Details</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {field("Vehicle Type", select("vehicle_type",
            VEHICLE_TYPES.map(t => [t, t.charAt(0).toUpperCase() + t.slice(1)])))}
          {field("Vehicle Age (years)", input({
            type: "number", min: 0, max: 30,
            placeholder: "e.g. 4", value: form.vehicle_age, onChange: set("vehicle_age"),
          }))}
          {field("Annual Mileage (km)", input({
            type: "number", min: 0, required: true,
            placeholder: "e.g. 15,000", value: form.annual_mileage, onChange: set("annual_mileage"),
          }), true)}
        </div>
      </div>

      {/* Driving history */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-amber-600" />
          <h3 className="text-xs font-bold uppercase tracking-widest text-gray-600">Driving History</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {field("Prior Claims", input({
            type: "number", min: 0, max: 20,
            placeholder: "0", value: form.prior_claims, onChange: set("prior_claims"),
          }))}
          {field("Speeding Violations", input({
            type: "number", min: 0, max: 20,
            placeholder: "0", value: form.speeding_violations, onChange: set("speeding_violations"),
          }))}
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 px-6 rounded-lg font-semibold text-white
                   bg-gradient-to-r from-indigo-600 to-purple-600
                   hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed
                   transition-all duration-300 flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Analyzing your profile…
          </>
        ) : (
          <>
            Get My Quote
            <span>→</span>
          </>
        )}
      </button>
    </form>
  );
}
