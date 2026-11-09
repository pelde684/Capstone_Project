import React, { useState } from "react";
import { Link } from "react-router-dom";
import { User, ArrowRight, ArrowLeft } from "lucide-react";
import AuthLayout from "../components/AuthLayout";
import { api } from "../api";

const LOGIN_PATH = "/login"; // change if your student login route is different

export default function ForgotPasswordPage() {
  const [identifier, setIdentifier] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api("/auth/forgot-password", {
        method: "POST",
        body: { identifier: identifier.trim() },
      });
      setSent(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <AuthLayout
        title="Check your email"
        subtitle="If an account exists for that Student ID or email, we sent a link to reset your password. The link expires in 30 minutes."
      >
        <Link
          to={LOGIN_PATH}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-500 py-3 text-sm font-medium text-white shadow-md transition-colors hover:bg-blue-600"
        >
          Back to login
        </Link>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Forgot password?" subtitle="Enter your Student ID or college email to get a reset link">
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-body">Student ID or email</label>
          <div className="flex items-center gap-2 rounded-xl border border-line bg-field px-3 py-3">
            <User className="h-4 w-4 text-accent" />
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="02250123"
              required
              className="w-full bg-transparent text-sm text-heading outline-none placeholder:text-muted"
            />
          </div>
        </div>

        {error && (
          <p className="rounded-xl border border-red-400/50 bg-red-500/15 px-3 py-2 text-sm text-red-600 dark:text-red-300">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-500 py-3 text-sm font-medium text-white shadow-md transition-colors hover:bg-blue-600 disabled:opacity-60"
        >
          {loading ? "Sending..." : "Send reset link"} <ArrowRight className="h-4 w-4" />
        </button>
      </form>

      <Link to={LOGIN_PATH} className="mt-5 inline-flex items-center gap-1 text-sm text-accent hover:underline">
        <ArrowLeft className="h-4 w-4" /> Back to login
      </Link>
    </AuthLayout>
  );
}