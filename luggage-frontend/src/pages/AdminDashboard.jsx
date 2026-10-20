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

const StudentsIcon = (p) => (
  <Svg {...p}>
    <circle cx="9" cy="8" r="3" />
    <path d="M3 19c0-3 3-5 6-5s6 2 6 5" />
    <circle cx="17" cy="9" r="2.5" />
    <path d="M17 14c2.5 0 4 1.5 4 4" />
  </Svg>
);

const ChartIcon = (p) => (
  <Svg {...p}>
    <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
  </Svg>
);

const RecordsIcon = (p) => (
  <Svg {...p}>
    <path d="M7 3h7l4 4v14H7z" />
    <path d="M14 3v4h4M10 12h5M10 16h5" />
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
export default function AdminDashboard() {
  const navigate = useNavigate();

  const totalStudents = 245;
  const totalBelongings = 382;
  const pending = 24;
  const completed = 310;

  const handoverPercent = Math.round((completed / totalBelongings) * 100);

  const stats = [
    { label: "Students", value: totalStudents, note: "Registered in the system" },
    { label: "Belongings", value: totalBelongings, note: "Stored so far" },
    {
      label: "Waiting for a check",
      value: pending,
      note: "Operators are working on these",
      urgent: true,
    },
    { label: "Handed back", value: completed, note: "Returned to students" },
  ];

  const management = [
    {
      title: "Manage students",
      text: "See who is registered and update their details.",
      cta: "Open students",
      path: "/admin/students",
      icon: StudentsIcon,
    },
    {
      title: "Reports",
      text: "Look at luggage and handover numbers.",
      cta: "Open reports",
      path: "/admin/reports",
      icon: ChartIcon,
    },
    {
      title: "System records",
      text: "Follow what is happening in the luggage room.",
      cta: "Open records",
      path: "/admin/records",
      icon: RecordsIcon,
    },
  ];

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
          <p className="text-sm text-slate-400">Administrator</p>
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
              Manage students, bags and reports from here.
            </p>
          </div>

          <p className="text-sm text-slate-400">{formatToday()}</p>
        </section>

        {/* STATISTICS: one panel, thin dividers */}
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

        {/* MANAGEMENT */}
        <section
          aria-label="Management"
          className="mb-8 grid grid-cols-1 gap-5 md:grid-cols-3"
        >
          {management.map((card, index) => {
            const Icon = card.icon;
            const primary = index === 0;

            return (
              <button
                key={card.title}
                onClick={() => navigate(card.path)}
                className={`group flex flex-col rounded-2xl p-7 text-left text-white transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky-300 ${
                  primary
                    ? "bg-blue-600 hover:bg-blue-500"
                    : "border border-white/10 bg-slate-950/85 backdrop-blur-md hover:border-white/25"
                }`}
              >
                <Icon
                  size={34}
                  className={primary ? "text-white" : "text-slate-300"}
                />

                <h2 className="font-display mt-5 text-2xl font-bold">
                  {card.title}
                </h2>

                <p
                  className={`mt-2 ${
                    primary ? "text-blue-100" : "text-slate-400"
                  }`}
                >
                  {card.text}
                </p>

                {primary ? (
                  <span className="mt-auto inline-flex w-fit items-center gap-2 rounded-lg bg-white px-5 py-2.5 font-semibold text-blue-700">
                    <span className="sr-only" />
                    {card.cta}
                    <ArrowRightIcon size={16} />
                  </span>
                ) : (
                  <span className="mt-auto inline-flex items-center gap-2 pt-6 font-semibold text-sky-300">
                    {card.cta}
                    <ArrowRightIcon
                      size={16}
                      className="transition-transform group-hover:translate-x-1"
                    />
                  </span>
                )}
              </button>
            );
          })}
        </section>

        {/* HANDOVER PROGRESS */}
        <section
          aria-label="Handover progress"
          className="rounded-2xl border border-white/10 bg-slate-950/85 p-6 backdrop-blur-md"
        >
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 className="font-display text-xl font-bold text-white">
              Handover progress
            </h2>
            <p className="font-display text-4xl font-bold text-white">
              {handoverPercent}%
            </p>
          </div>

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
        </section>
      </main>
    </div>
  );
}