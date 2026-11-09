import React, { useState } from "react";
import { Link } from "react-router-dom";
import { User, Mail, Lock, IdCard, ArrowRight } from "lucide-react";
import AuthLayout from "../components/AuthLayout";
import { api } from "../api";

const LOGIN_PATH = "/login"; // change if your student login route is different

function Field({ label, icon: Icon, ...props }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-body">{label}</label>
      <div className="flex items-center gap-2 rounded-xl border border-line bg-field px-3 py-3">
        <Icon className="h-4 w-4 text-accent" />
        <input
          required
          className="w-full bg-transparent text-sm text-heading outline-none placeholder:text-muted"
          {...props}
        />
      </div>
    </div>
  );
}

export default function RegisterPage() {
  const [form, setForm] = useState({
    name: "",
    studentId: "",
    email: "",
    password: "",
    confirm: "",
  });
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!/^[^@\s]+@rub\.edu\.bt$/i.test(form.email.trim())) {
      return setError("Use your college email ending in @rub.edu.bt.");
    }
    if (form.password.length < 8) {
      return setError("Password must be at least 8 characters.");
    }
    if (form.password !== form.confirm) {
      return setError("Passwords do not match.");
    }

    setLoading(true);
    try {
      await api("/auth/register", {
        method: "POST",
        body: {
          name: form.name.trim(),
          studentId: form.studentId.trim(),
          email: form.email.trim().toLowerCase(),
          password: form.password,
        },
      });
      setDone(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <AuthLayout title="Account created" subtitle="You can now log in with your Student ID.">
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
    <AuthLayout title="Create account" subtitle="Register with your student details">
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <Field label="Full name" icon={User} type="text" value={form.name} onChange={set("name")} placeholder="Tashi Dorji" />
        <Field label="Student ID" icon={IdCard} type="text" value={form.studentId} onChange={set("studentId")} placeholder="02250123" />
        <Field label="College email" icon={Mail} type="email" value={form.email} onChange={set("email")} placeholder="02250123.cst@rub.edu.bt" />
        <Field label="Password" icon={Lock} type="password" value={form.password} onChange={set("password")} placeholder="At least 8 characters" />
        <Field label="Confirm password" icon={Lock} type="password" value={form.confirm} onChange={set("confirm")} placeholder="Re-enter password" />

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
          {loading ? "Creating account..." : "Create account"} <ArrowRight className="h-4 w-4" />
        </button>
      </form>

      <p className="mt-5 text-sm text-body">
        Already have an account?{" "}
        <Link to={LOGIN_PATH} className="font-medium text-accent hover:underline">
          Log in
        </Link>
      </p>
    </AuthLayout>
  );
}