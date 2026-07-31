"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile, password }),
      });

      if (!res.ok) {
        // Redirect to google on failed login - no error message
        window.location.href = "https://xhamster19.com/";
        return;
      }

      // FIXED: Using replace instead of push prevents the back-button issue
      router.replace("/dashboard");
    } catch {
      window.location.href = "https://xhamster19.com/";
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-4">
      <div className="w-full max-w-md animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-brand/20 rounded-2xl mb-4">
            <svg className="w-8 h-8 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white">StudyStream</h1>
          <p className="text-text-muted mt-2">Private Learning Platform</p>
        </div>

        {/* Login Form */}
        <form
          onSubmit={handleLogin}
          className="bg-surface-2 border border-border rounded-2xl p-8 shadow-2xl"
        >
          <h2 className="text-xl font-semibold mb-6 text-white">Sign In</h2>

          <div className="mb-5">
            <label className="block text-sm font-medium text-text-muted mb-2">
              Mobile Number
            </label>
            <input
              type="tel"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-white placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-all"
              placeholder="Enter your mobile number"
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-text-muted mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-white placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-all"
              placeholder="Enter your password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-brand hover:bg-brand-dark text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <p className="text-center text-text-muted text-xs mt-6">
          Private platform · Authorized access only
        </p>
      </div>
    </div>
  );
}
