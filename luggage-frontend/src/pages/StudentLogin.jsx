
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PageBackground from "../components/PageBackground";

/* Icons */
function Svg({ size = 18, className = "", children }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

const MailIcon = (p) => (
  <Svg {...p}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="M3 7l9 6 9-6" />
  </Svg>
);

const LockIcon = (p) => (
  <Svg {...p}>
    <rect x="5" y="11" width="14" height="9" rx="2" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </Svg>
);

/* Student Login Page */
export default function StudentLogin() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = (e) => {
    e.preventDefault();

    if (!email || !password) {
      setError("Enter your email and password to log in.");
      return;
    }

    setError("");

    // Demo login
    navigate("/student/dashboard");
  };

  const inputClass =
    "w-full rounded-lg border border-slate-700 bg-[#111b30] py-3 pl-11 pr-3 text-white placeholder-slate-500 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30";

  return (
    <PageBackground>
      <div
        className="flex min-h-screen items-center justify-center px-4"
        style={{ fontFamily: "'Figtree', system-ui, sans-serif" }}
      >
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700;12..96,800&family=Figtree:wght@400;500;600&display=swap');

          .font-display {
            font-family: 'Bricolage Grotesque', 'Figtree', system-ui, sans-serif;
          }
        `}</style>

        {/* Login Card */}
        <div className="w-full max-w-md rounded-2xl border border-slate-700/80 bg-[#0f172a]/95 p-6 shadow-2xl backdrop-blur-md sm:p-8">
          <header>
            <p className="text-sm font-medium text-blue-300">
              Luggage Room
            </p>

            <h1 className="font-display mt-1 text-3xl font-bold tracking-tight text-white">
              Student log in
            </h1>

            <p className="mt-2 text-slate-300">
              Use your college email to see your bags and QR codes.
            </p>
          </header>

          <form
            onSubmit={handleLogin}
            className="mt-8 space-y-5"
            noValidate
          >
            {/* EMAIL */}
            <div>
              <label
                htmlFor="student-email"
                className="mb-2 block text-sm font-medium text-slate-200"
              >
                Email
              </label>

              <div className="relative">
                <MailIcon
                  size={18}
                  className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-slate-400"
                />

                <input
                  id="student-email"
                  type="email"
                  autoComplete="email"
                  placeholder="student@cst.edu.bt"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            {/* PASSWORD */}
            <div>
              <label
                htmlFor="student-password"
                className="mb-2 block text-sm font-medium text-slate-200"
              >
                Password
              </label>

              <div className="relative">
                <LockIcon
                  size={18}
                  className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-slate-400"
                />

                <input
                  id="student-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`${inputClass} pr-16`}
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword((current) => !current)
                  }
                  aria-pressed={showPassword}
                  className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-md px-2 py-1 text-sm font-semibold text-blue-300 transition-colors hover:text-blue-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-400"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {/* ERROR MESSAGE */}
            <div aria-live="polite">
              {error && (
                <p
                  role="alert"
                  className="rounded-lg border border-red-400/30 bg-red-950/60 px-4 py-3 text-sm text-red-200"
                >
                  {error}
                </p>
              )}
            </div>

            {/* LOGIN BUTTON */}
            <button
              type="submit"
              className="w-full rounded-lg bg-blue-600 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-950/30 transition-colors hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400"
            >
              Log in
            </button>
          </form>

          {/* OPERATOR / ADMIN LOGIN */}
          <div className="mt-6 border-t border-slate-700/80 pt-5 text-center">
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="text-sm font-semibold text-blue-300 transition-colors hover:text-blue-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400"
            >
              Operator or admin? Log in here
            </button>
          </div>
        </div>
      </div>
    </PageBackground>
  );
}
