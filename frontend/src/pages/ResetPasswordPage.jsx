import React, { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Lock, ArrowRight } from "lucide-react";
import AuthLayout from "../components/AuthLayout";
import { api } from "../api";

const LOGIN_PATH = "/login"; // change if your student login route is different

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get("token"); // link looks like /reset-password?token=abc123
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    if (password !== confirm) return setError("Passwords do not match.");

    setLoading(true);
    try {
      await api("/auth/reset-password", {
        method: "POST",
        body: { token, password },
      });
      setDone(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <AuthLayout title="Link not valid" subtitle="This reset link is missing or incomplete. Request a new one.">
        <Link
          to="/forgot-password"
          className="mt-6 flex w-full items-center justify-center rounded-xl bg-blue-500 py-3 text-sm font-medium text-white shadow-md transition-colors hover:bg-blue-600"
        >
          Request new link
        </Link>
      </AuthLayout>
    );
  }

  if (done) {
    return (
      <AuthLayout title="Password updated" subtitle="You can now log in with your new password.">
        <Link
          to={LOGIN_PATH}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-500 py-3 text-sm font-medium text-white shadow-md transition-colors hover:bg-blue-600"
        >
          Go to login <ArrowRight className="h-4 w-4" />
        </Link>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Set new password" subtitle="Choose a password you haven't used here before">
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {[
          ["New password", password, setPassword, "At least 8 characters"],
          ["Confirm password", confirm, setConfirm, "Re-enter password"],
        ].map(([label, value, setter, placeholder]) => (
          <div key={label}>
            <label className="mb-1 block text-sm font-medium text-body">{label}</label>
            <div className="flex items-center gap-2 rounded-xl border border-line bg-field px-3 py-3">
              <Lock className="h-4 w-4 text-accent" />
              <input
                type="password"
                value={value}
                onChange={(e) => setter(e.target.value)}
                placeholder={placeholder}
                required
                className="w-full bg-transparent text-sm text-heading outline-none placeholder:text-muted"
              />
            </div>
          </div>
        ))}

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
          {loading ? "Saving..." : "Update password"} <ArrowRight className="h-4 w-4" />
        </button>
      </form>
    </AuthLayout>
  );
}