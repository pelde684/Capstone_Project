import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";

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

const SearchIcon = (p) => (
  <Svg {...p}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="M16 16l4.5 4.5" />
  </Svg>
);

const CloseIcon = (p) => (
  <Svg {...p}>
    <path d="M6 6l12 12M18 6L6 18" />
  </Svg>
);

const PlusIcon = (p) => (
  <Svg {...p}>
    <path d="M12 5v14M5 12h14" />
  </Svg>
);

const QrIcon = (p) => (
  <Svg {...p}>
    <rect x="4" y="4" width="6" height="6" rx="1" />
    <rect x="14" y="4" width="6" height="6" rx="1" />
    <rect x="4" y="14" width="6" height="6" rx="1" />
    <path d="M14 14h2v2h-2zM18 14h2M14 18h2v2M19 18v2" />
  </Svg>
);

const ArrowRightIcon = (p) => (
  <Svg {...p}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Svg>
);

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */
const actions = [
  {
    title: "Register new luggage",
    description: "Add your bag's details and upload a photo of it.",
    cta: "Start registering",
    path: "/student/register",
    icon: PlusIcon,
    primary: true,
  },
  {
    title: "My belongings and QR codes",
    description: "See your registered bags and show their QR codes.",
    cta: "View my bags",
    path: "/student/belongings",
    icon: QrIcon,
    primary: false,
  },
];

const stats = [
  { label: "My belongings", value: 3, note: "Registered by you" },
  { label: "Waiting for a check", value: 1, note: "An operator will review it", urgent: true },
  { label: "Handed back", value: 2, note: "Returned to you" },
];

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
export default function StudentDashboard() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const filteredActions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return actions;
    return actions.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q) ||
        a.cta.toLowerCase().includes(q)
    );
  }, [query]);

  return (
    <div
      className="min-h-screen"
      style={{ fontFamily: "'Figtree', system-ui, sans-serif" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700;12..96,800&family=Figtree:wght@400;500;600&display=swap');

        .font-display { font-family: 'Bricolage Grotesque', 'Figtree', system-ui, sans-serif; }
      `}</style>

      {/* TOP BAR */}
      <header className="flex items-center justify-between border-b border-white/10 bg-slate-950/90 px-4 py-4 text-white backdrop-blur-md sm:px-8">
        <div>
          <p className="font-display text-xl font-bold">Luggage Room</p>
          <p className="text-sm text-slate-400">Student</p>
        </div>

        <button
          onClick={() => navigate("/login")}
          className="rounded-lg border border-white/20 px-4 py-2 text-sm font-semibold text-slate-200 transition-colors hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300"
        >
          Log out
        </button>
      </header>

      <main className="mx-auto max-w-7xl p-4 sm:p-8">
        {/* HEADER */}
        <section className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl font-bold tracking-tight text-white">
              {getGreeting()}
            </h1>
            <p className="mt-2 text-lg text-slate-300">
              Register your bags and find their QR codes here.
            </p>
          </div>

          <p className="text-sm text-slate-400">{formatToday()}</p>
        </section>

        {/* STATISTICS: one panel, thin dividers */}
        <section
          aria-label="Your luggage summary"
          className="mb-8 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 md:grid-cols-3"
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

        {/* SEARCH */}
        <div className="relative mb-6">
          <SearchIcon
            size={20}
            className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-slate-400"
          />

          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search, for example register or QR codes"
            aria-label="Search dashboard"
            className="w-full rounded-xl border border-white/10 bg-slate-950/85 py-3.5 pl-12 pr-12 text-white placeholder-slate-500 backdrop-blur-md outline-none transition-colors focus:border-sky-400/60 focus:ring-2 focus:ring-sky-400/30"
          />

          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-md p-1.5 text-slate-400 transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-300"
            >
              <CloseIcon size={18} />
            </button>
          )}
        </div>

        {/* ACTIONS */}
        <section
          aria-label="What would you like to do"
          className="grid grid-cols-1 gap-5 md:grid-cols-2"
        >
          {filteredActions.length > 0 ? (
            filteredActions.map((action) => {
              const Icon = action.icon;

              return (
                <button
                  key={action.path}
                  onClick={() => navigate(action.path)}
                  className={`group flex flex-col rounded-2xl p-7 text-left text-white transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky-300 ${
                    action.primary
                      ? "bg-blue-600 hover:bg-blue-500"
                      : "border border-white/10 bg-slate-950/85 backdrop-blur-md hover:border-white/25"
                  }`}
                >
                  <Icon
                    size={34}
                    className={action.primary ? "text-white" : "text-slate-300"}
                  />

                  <h2 className="font-display mt-5 text-2xl font-bold">
                    {action.title}
                  </h2>

                  <p
                    className={`mt-2 ${
                      action.primary ? "text-blue-100" : "text-slate-400"
                    }`}
                  >
                    {action.description}
                  </p>

                  {action.primary ? (
                    <span className="mt-6 inline-flex w-fit items-center gap-2 rounded-lg bg-white px-5 py-2.5 font-semibold text-blue-700">
                      {action.cta}
                      <ArrowRightIcon size={16} />
                    </span>
                  ) : (
                    <span className="mt-6 inline-flex items-center gap-2 font-semibold text-sky-300">
                      {action.cta}
                      <ArrowRightIcon
                        size={16}
                        className="transition-transform group-hover:translate-x-1"
                      />
                    </span>
                  )}
                </button>
              );
            })
          ) : (
            <div className="rounded-2xl border border-white/10 bg-slate-950/85 p-10 text-center backdrop-blur-md md:col-span-2">
              <h2 className="font-display text-xl font-bold text-white">
                Nothing found
              </h2>
              <p className="mt-2 text-slate-400">
                No action matches "{query}". Try "register" or "QR".
              </p>
              <button
                onClick={() => setQuery("")}
                className="mt-5 rounded-lg border border-white/20 px-4 py-2 text-sm font-semibold text-slate-200 transition-colors hover:border-white/40 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300"
              >
                Clear search
              </button>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}