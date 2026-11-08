import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Briefcase, User, UserCircle2, Lock, FileText, Users, ShieldCheck, ArrowRight } from "lucide-react";
import ThemeToggle from "../components/ThemeToggle";
import { api, saveSession, sendStaffToStaffSite } from "../api";
import { useBelongings } from "../context/BelongingsContext";
import loginBg from "../assets/college.jpeg";

// One Register page for everyone (same design as the login page). Students give their student ID and hostel;
// operators and admins may need a staff code on the live site (the backend checks it).
// After signing up the person is logged in: students stay here, staff go to the staff site.

const ROLES = [
  ["Student", "Student"],
  ["Operator", "Operator (luggage room staff)"],
  ["Admin", "Admin"],
];

function Field({ label, icon: Icon, hint, children }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-body">
        {label} {hint && <span className="font-normal text-muted">{hint}</span>}
      </label>
      <div className="flex items-center gap-2 rounded-xl border border-line bg-field px-3 py-3">
        <Icon className="h-4 w-4 flex-shrink-0 text-accent" />
        {children}
      </div>
    </div>
  );
}

const inputClass = "w-full bg-transparent text-sm text-heading outline-none placeholder:text-muted";
const optionClass = "bg-white text-slate-900 dark:bg-slate-800 dark:text-white";

export default function SignupPage() {
  const [form, setForm] = useState({ name: "", email: "", role: "Student", studentId: "", departmentId: "", hostelId: "", staffCode: "", password: "", confirm: "" });
  const [hostels, setHostels] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { reload } = useBelongings();
  const isStudent = form.role === "Student";
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  useEffect(() => {
    api("/auth/hostels").then((r) => setHostels(r.data)).catch(() => {});
    api("/auth/departments").then((r) => setDepartments(r.data)).catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirm) return setError("The two passwords are not the same.");
    setLoading(true);
    try {
      const { token, user } = await api("/auth/register", {
        method: "POST",
        body: {
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
          role: form.role,
          ...(isStudent
            ? { studentId: form.studentId.trim(), departmentId: form.departmentId || undefined, hostelId: form.hostelId || undefined }
            : { staffCode: form.staffCode.trim() || undefined }),
        },
      });
      if (sendStaffToStaffSite(token, user)) return;
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
    <div
      className="relative flex min-h-screen items-center justify-center px-4 py-10"
      style={{ backgroundImage: `url(${loginBg})`, backgroundSize: "cover", backgroundPosition: "center" }}
    >
      <div className="absolute inset-0 bg-overlay backdrop-blur-[2px]"></div>

      <div className="absolute right-4 top-4 z-10">
        <ThemeToggle />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-6 flex flex-col items-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500 shadow-lg">
            <Briefcase className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-semibold text-heading">Luggage Room</h1>
          <p className="text-sm text-body">QR Management System</p>
        </div>

        <div className="rounded-2xl border border-line bg-panel p-8 shadow-xl backdrop-blur-md">
          <h2 className="text-xl font-semibold text-heading">Create an account</h2>
          <p className="mt-1 text-sm text-body">Register to use the luggage room system</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <Field label="Full name" icon={User}>
              <input value={form.name} onChange={set("name")} placeholder="Tandin Wangmo" maxLength={100} required autoComplete="name" className={inputClass} />
            </Field>

            <Field label="Email" icon={UserCircle2}>
              <input type="email" value={form.email} onChange={set("email")} placeholder="name@college.edu" maxLength={150} required autoComplete="email" className={inputClass} />
            </Field>

            <Field label="I am a" icon={Briefcase}>
              <select value={form.role} onChange={set("role")} className={`${inputClass} cursor-pointer`}>
                {ROLES.map(([value, label]) => (
                  <option key={value} value={value} className={optionClass}>{label}</option>
                ))}
              </select>
            </Field>

            {isStudent ? (
              <>
                <Field label="Student ID" icon={FileText}>
                  <input value={form.studentId} onChange={set("studentId")} placeholder="02250123" inputMode="numeric" pattern="\d{5,12}" title="Numbers only, e.g. 02250123" required className={inputClass} />
                </Field>
                <Field label="Programme" icon={Briefcase} hint={departments.length ? "(decides your storage room)" : "(none set up yet)"}>
                  <select value={form.departmentId} onChange={set("departmentId")} required={departments.length > 0} className={`${inputClass} cursor-pointer`}>
                    <option value="" className={optionClass}>Select your programme</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id} className={optionClass}>{d.name}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Hostel" icon={Users} hint="(optional)">
                  <select value={form.hostelId} onChange={set("hostelId")} className={`${inputClass} cursor-pointer`}>
                    <option value="" className={optionClass}>Select your hostel</option>
                    {hostels.map((h) => (
                      <option key={h.id} value={h.id} className={optionClass}>{h.name}</option>
                    ))}
                  </select>
                </Field>
              </>
            ) : (
              <Field label="Staff code" icon={ShieldCheck} hint="(if the admin gave you one)">
                <input value={form.staffCode} onChange={set("staffCode")} placeholder="Staff code" autoComplete="off" className={inputClass} />
              </Field>
            )}

            <Field label="Password" icon={Lock} hint="(at least 8 characters)">
              <input type="password" value={form.password} onChange={set("password")} placeholder="••••••••" minLength={8} maxLength={72} required autoComplete="new-password" className={inputClass} />
            </Field>

            <Field label="Confirm password" icon={Lock}>
              <input type="password" value={form.confirm} onChange={set("confirm")} placeholder="••••••••" minLength={8} maxLength={72} required autoComplete="new-password" className={inputClass} />
            </Field>

            {error && (
              <p className="rounded-xl border border-red-400/50 bg-red-500/15 px-3 py-2 text-sm text-red-600 dark:text-red-300" role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-500 py-3 text-sm font-medium text-white shadow-md transition-colors hover:bg-blue-600 disabled:opacity-60"
            >
              {loading ? "Creating account..." : "Register"} <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-body">
            Already have an account?{" "}
            <Link to="/" className="font-semibold text-accent hover:underline">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
