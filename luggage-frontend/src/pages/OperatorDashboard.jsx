import { useNavigate } from "react-router-dom";

import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

/* ------------------------------------------------------------------ */
/*  Icons (plain SVG, no extra package needed)                         */
/* ------------------------------------------------------------------ */
function Svg({ size = 24, className = "", children }) {
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

const QrIcon = (p) => (
  <Svg {...p}>
    <rect x="4" y="4" width="6" height="6" rx="1" />
    <rect x="14" y="4" width="6" height="6" rx="1" />
    <rect x="4" y="14" width="6" height="6" rx="1" />
    <path d="M14 14h2v2h-2zM18 14h2M14 18h2v2M19 18v2" />
  </Svg>
);

const ClipboardIcon = (p) => (
  <Svg {...p}>
    <rect x="6" y="5" width="12" height="16" rx="2" />
    <rect x="9" y="3" width="6" height="4" rx="1" />
    <path d="M9 12h6M9 16h4" />
  </Svg>
);

const ArrowRightIcon = (p) => (
  <Svg {...p}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Svg>
);

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function formatToday() {
  return new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */
function OperatorDashboard() {
  const navigate = useNavigate();

  const totalBelongings = 128;
  const pending = 12;
  const completed = 96;
  const students = 82;

  const handoverPercent = Math.round((completed / totalBelongings) * 100);

  const stats = [
    { label: "In the room", value: totalBelongings, note: "Registered so far" },
    {
      label: "Waiting for a check",
      value: pending,
      note: "These need you",
      urgent: true,
    },
    { label: "Handed back", value: completed, note: "Returned to students" },
    { label: "Students", value: students, note: "Have bags stored" },
  ];

  const today = [
    { label: "QR codes scanned", value: 18 },
    { label: "Belongings verified", value: 14 },
    { label: "Handed over", value: 8 },
  ];

  return (
    <div
      className="min-h-screen"
      style={{ fontFamily: "'Figtree', system-ui, sans-serif" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700;12..96,800&family=Figtree:wght@400;500;600&display=swap');

        .font-display { font-family: 'Bricolage Grotesque', 'Figtree', system-ui, sans-serif; }

        @keyframes scan-sweep {
          0%   { top: 8%;  opacity: 0; }
          15%  { opacity: 1; }
          85%  { opacity: 1; }
          100% { top: 88%; opacity: 0; }
        }
        .scan-line { animation: scan-sweep 1.6s ease-in-out infinite; }

        @media (prefers-reduced-motion: reduce) {
          .scan-line { animation: none; opacity: 0; }
        }
      `}</style>

      {/* SIDEBAR */}
      <Sidebar />

      {/* MAIN CONTENT */}
      <main className="ml-64 min-h-screen">
        <Navbar title="Operator Dashboard" />

        <div className="p-8 max-w-[1400px]">
          {/* HEADER */}
          <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="font-display text-4xl font-bold tracking-tight text-white">
                {getGreeting()}
              </h1>
              <p className="mt-2 text-lg text-slate-300">
                {pending} belongings are waiting for you to check them.
              </p>
            </div>

            <p className="text-sm text-slate-400">{formatToday()}</p>
          </header>

          {/* STATISTICS: one panel, thin dividers, no icon boxes */}
          <section
            aria-label="Luggage room summary"
            className="mb-8 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 xl:grid-cols-4"
          >
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="bg-slate-950/85 p-6 backdrop-blur-md"
              >
                <p className="text-sm text-slate-400">{stat.label}</p>

                <p
                  className={`font-display mt-3 text-5xl font-bold ${
                    stat.urgent ? "text-amber-300" : "text-white"
                  }`}
                >
                  {stat.value}
                </p>

                <p
                  className={`mt-2 text-sm ${
                    stat.urgent ? "text-amber-200/80" : "text-slate-500"
                  }`}
                >
                  {stat.note}
                </p>
              </div>
            ))}
          </section>

          {/* QUICK ACTIONS */}
          <section
            aria-label="Quick actions"
            className="mb-8 grid grid-cols-1 gap-5 lg:grid-cols-5"
          >
            {/* SCAN QR */}
            <button
              onClick={() => navigate("/operator/scan")}
              className="group relative overflow-hidden rounded-2xl bg-blue-600 p-8 text-left text-white transition-colors duration-200 hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky-300 lg:col-span-3"
            >
              <div
                aria-hidden="true"
                className="absolute right-8 top-1/2 hidden h-36 w-36 -translate-y-1/2 sm:block"
              >
                <span className="absolute left-0 top-0 h-7 w-7 rounded-tl-lg border-l-4 border-t-4 border-white/70" />
                <span className="absolute right-0 top-0 h-7 w-7 rounded-tr-lg border-r-4 border-t-4 border-white/70" />
                <span className="absolute bottom-0 left-0 h-7 w-7 rounded-bl-lg border-b-4 border-l-4 border-white/70" />
                <span className="absolute bottom-0 right-0 h-7 w-7 rounded-br-lg border-b-4 border-r-4 border-white/70" />
                <QrIcon
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white/45"
                  size={56}
                />
                <span className="scan-line absolute left-2 right-2 h-0.5 rounded-full bg-sky-200 opacity-0 group-hover:opacity-100" />
              </div>

              <div className="relative max-w-sm">
                <h2 className="font-display text-3xl font-bold">
                  Scan a student's QR code
                </h2>

                <p className="mt-3 text-blue-100">
                  Point the camera at the code on a bag to pull up its details.
                </p>

                <span className="mt-8 inline-flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 font-semibold text-blue-700">
                  Open scanner
                  <ArrowRightIcon size={16} />
                </span>
              </div>
            </button>

            {/* VERIFICATION */}
            <button
              onClick={() => navigate("/operator/verification")}
              className="group flex flex-col rounded-2xl border border-white/10 bg-slate-950/85 p-8 text-left text-white backdrop-blur-md transition-colors duration-200 hover:border-white/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky-300 lg:col-span-2"
            >
              <ClipboardIcon className="text-slate-300" size={34} />

              <h2 className="font-display mt-5 text-2xl font-bold">
                Check belongings
              </h2>

              <p className="mt-2 text-slate-400">
                Review what students registered and approve it.
              </p>

              <span className="mt-auto inline-flex items-center gap-2 pt-6 font-semibold text-sky-300">
                Start checking
                <ArrowRightIcon
                  size={16}
                  className="transition-transform group-hover:translate-x-1"
                />
              </span>
            </button>
          </section>

          {/* TODAY */}
          <section
            aria-label="Today"
            className="grid grid-cols-1 gap-5 lg:grid-cols-3"
          >
            <div className="rounded-2xl border border-white/10 bg-slate-950/85 p-6 backdrop-blur-md lg:col-span-2">
              <h2 className="font-display text-xl font-bold text-white">
                Today at the desk
              </h2>

              <ul className="mt-5 divide-y divide-white/10">
                {today.map((item) => (
                  <li
                    key={item.label}
                    className="flex items-baseline justify-between py-4 first:pt-0 last:pb-0"
                  >
                    <span className="text-slate-300">{item.label}</span>
                    <span className="font-display text-3xl font-bold text-white">
                      {item.value}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-950/85 p-6 backdrop-blur-md">
              <h2 className="font-display text-xl font-bold text-white">
                Handover progress
              </h2>

              <p className="font-display mt-5 text-5xl font-bold text-white">
                {handoverPercent}%
              </p>

              <div
                role="progressbar"
                aria-valuenow={handoverPercent}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Belongings handed back"
                className="mt-4 h-2 overflow-hidden rounded-full bg-white/10"
              >
                <div
                  className="h-full rounded-full bg-sky-400 transition-all duration-700"
                  style={{ width: `${handoverPercent}%` }}
                />
              </div>

              <p className="mt-3 text-sm text-slate-400">
                {completed} of {totalBelongings} belongings are back with their
                owners.
              </p>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

export default OperatorDashboard;