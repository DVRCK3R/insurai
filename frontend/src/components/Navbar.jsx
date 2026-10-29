import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { auth, loginWithGoogle, logout } from "../services/firebase";
import { onAuthStateChanged } from "firebase/auth";

export default function Navbar() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, setUser);
    return unsub;
  }, []);

  return (
    <nav className="sticky top-0 z-50 bg-gradient-to-r from-slate-50 via-white to-indigo-50/30 backdrop-blur-sm border-b border-gray-200/50 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="group flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg blur opacity-75 group-hover:opacity-100 transition duration-300" />
            <div className="relative bg-white px-3 py-1.5 rounded-lg">
              <span className="text-2xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                InsurAI
              </span>
            </div>
          </div>
          <span className="ml-2 text-xs font-bold uppercase tracking-widest text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text hidden sm:inline">
            Insurance Redefined
          </span>
        </Link>

        {/* Navigation Links */}
        <div className="hidden md:flex items-center gap-8">
          <Link to="/" className="text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors relative group">
            Get Quote
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-indigo-600 to-purple-600 group-hover:w-full transition-all duration-300" />
          </Link>
          {user && (
            <Link to="/dashboard" className="text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors relative group">
              My Quotes
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-indigo-600 to-purple-600 group-hover:w-full transition-all duration-300" />
            </Link>
          )}
        </div>

        {/* User Section */}
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <div className="text-right hidden sm:block">
                <p className="text-xs font-semibold text-gray-900">{user.displayName?.split(' ')[0] || user.email?.split('@')[0]}</p>
                <p className="text-xs text-gray-500">Verified User</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName} className="w-full h-full rounded-full object-cover" />
                ) : (
                  user.displayName?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()
                )}
              </div>
              <button
                onClick={logout}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-red-100 text-gray-700 hover:text-red-700 transition-all duration-300"
              >
                Sign out
              </button>
            </>
          ) : (
            <button
              onClick={loginWithGoogle}
              className="text-xs font-bold px-5 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-lg hover:scale-105 transition-all duration-300 flex items-center gap-2"
            >
              <span>🔐</span>
              Sign in
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
