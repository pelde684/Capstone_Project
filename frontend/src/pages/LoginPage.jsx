import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, Lock, ArrowRight } from "lucide-react";
import ThemeToggle from "../components/ThemeToggle";
import PublicLayout from "../public/PublicLayout";
import { api, saveSession, sendStaffToStaffSite } from "../api";
import { useBelongings } from "../context/BelongingsContext";
import loginBg from "../assets/college.jpeg";

export default function LoginPage() {
  const [studentId, setStudentId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { reload } = useBelongings();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      // One login page for everyone: the backend accepts a student ID or an email as `identifier`
      const { token, user } = await api("/auth/login", {
        method: "POST",
        body: { identifier: studentId.trim(), password },
      });
      if (sendStaffToStaffSite(token, user)) return; // operators and admins continue on the staff site
      saveSession(token, user);
      await reload();
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PublicLayout
      backgroundSrc={loginBg}
      themeSlot={<ThemeToggle />}
      themeSlotCompact={<ThemeToggle iconOnly />}
      loginPath="/"
      registerPath="/signup"
    >
      <div className="w-full rounded-2xl border border-line bg-panel p-8 shadow-md">
        <h2 className="text-xl font-semibold text-heading">Welcome back</h2>
        <p className="mt-1 text-sm text-body">Please enter your details to access your account.</p>

        <form onSubmit={handleLogin} className="mt-6 space-y-4">
          <div>
            <label htmlFor="login-id" className="mb-1 block text-sm font-medium text-body">
              Student ID or email
            </label>
            <div className="flex items-center gap-2 rounded-xl border border-line bg-field px-3 py-3">
              <User className="h-4 w-4 text-accent" />
              <input
                id="login-id"
                type="text"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                placeholder="02250123 or name@college.edu"
                autoComplete="username"
                required
                className="w-full bg-transparent text-sm text-heading outline-none placeholder:text-muted"
              />
            </div>
          </div>

          <div>
            <label htmlFor="login-password" className="mb-1 block text-sm font-medium text-body">
              Password
            </label>
            <div className="flex items-center gap-2 rounded-xl border border-line bg-field px-3 py-3">
              <Lock className="h-4 w-4 text-accent" />
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                required
                className="w-full bg-transparent text-sm text-heading outline-none placeholder:text-muted"
              />
            </div>
          </div>

          {error && (
            <p
              role="alert"
              className="rounded-xl border border-red-400/50 bg-red-500/15 px-3 py-2 text-sm text-red-600 dark:text-red-300"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-500 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-600 disabled:opacity-60"
          >
            {loading ? "Logging in..." : "Log in"} <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-body">
          Students log in with their Student ID, operators and admins with their email.
        </p>
        <p className="mt-2 text-center text-sm text-body">
          Don't have an account?{" "}
          <Link to="/signup" className="font-semibold text-accent hover:underline">Register</Link>
        </p>
      </div>
    </PublicLayout>
  );
}