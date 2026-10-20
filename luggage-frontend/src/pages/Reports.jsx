import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";

/* ------------------------------------------------------------------ */
/*  Icons (plain SVG, no extra package needed)                         */
/* ------------------------------------------------------------------ */
function Svg({ size = 20, className = "", children }) {
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

const BackIcon = (p) => (
  <Svg {...p}>
    <path d="M19 12H5M11 6l-6 6 6 6" />
  </Svg>
);

const PrinterIcon = (p) => (
  <Svg {...p}>
    <path d="M7 9V4h10v5" />
    <rect x="4" y="9" width="16" height="8" rx="2" />
    <path d="M7 14h10v6H7z" />
  </Svg>
);

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */
const reports = [
  {
    id: "RPT-001",
    type: "Luggage Registration",
    date: "18 Sep 2026",
    total: 25,
    status: "Completed",
  },
  {
    id: "RPT-002",
    type: "Verification Report",
    date: "18 Sep 2026",
    total: 18,
    status: "Completed",
  },
  {
    id: "RPT-003",
    type: "Handover Report",
    date: "17 Sep 2026",
    total: 12,
    status: "Completed",
  },
  {
    id: "RPT-004",
    type: "Pending Verification",
    date: "16 Sep 2026",
    total: 8,
    status: "Pending",
  },
];

const statusLook = {
  Completed: { dot: "bg-emerald-400", text: "text-emerald-300" },
  Pending: { dot: "bg-amber-400", text: "text-amber-300" },
};

const summary = [
  { label: "Total reports", value: 24, note: "Generated so far" },
  { label: "Completed", value: 20, note: "Ready to read" },
  { label: "Pending", value: 4, note: "Still being prepared", urgent: true },
];

const headings = ["Report", "Type", "Date", "Total", "Status"];

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */
export default function Reports() {
  const navigate = useNavigate();

  const [query, setQuery] = useState("");

  // Search reports
  const filteredReports = useMemo(() => {
    const q = query.trim().toLowerCase();

    if (!q) {
      return reports;
    }

    return reports.filter(
      (report) =>
        report.id.toLowerCase().includes(q) ||
        report.type.toLowerCase().includes(q) ||
        report.date.toLowerCase().includes(q) ||
        report.status.toLowerCase().includes(q)
    );
  }, [query]);

  return (
    <div
      className="relative min-h-screen"
      style={{ fontFamily: "'Figtree', system-ui, sans-serif" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700;12..96,800&family=Figtree:wght@400;500;600&display=swap');

        .font-display { font-family: 'Bricolage Grotesque', 'Figtree', system-ui, sans-serif; }
      `}</style>

      {/* BACKGROUND */}
      <div
        className="fixed inset-0 bg-cover bg-center blur-md"
        style={{
          backgroundImage:
            "linear-gradient(rgba(15, 23, 42, 0.82), rgba(15, 23, 42, 0.82)), url('/college.jpeg')",
        }}
      />

      {/* PAGE CONTENT */}
      <div className="relative z-10">
        {/* TOP BAR */}
        <header className="border-b border-white/10 bg-slate-950/90 backdrop-blur-md">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-8">
            <p className="font-display text-xl font-bold text-white">
              Luggage Room
            </p>

            <button
              onClick={() => navigate("/admin/dashboard")}
              className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-4 py-2 text-sm font-semibold text-slate-200 transition-colors hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300"
            >
              <BackIcon size={16} />
              Back to dashboard
            </button>
          </div>
        </header>

        <main className="mx-auto max-w-7xl p-4 sm:p-8">
          {/* PAGE HEADER */}
          <header className="mb-8">
            <h1 className="font-display text-4xl font-bold tracking-tight text-white">
              Reports
            </h1>

            <p className="mt-2 text-lg text-slate-300">
              Look at what the luggage room has done and print what you need.
            </p>
          </header>

          {/* SUMMARY: one panel, thin dividers */}
          <section
            aria-label="Report summary"
            className="mb-8 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 md:grid-cols-3"
          >
            {summary.map((item) => (
              <div
                key={item.label}
                className="bg-slate-950/85 p-6 backdrop-blur-md"
              >
                <p className="text-sm text-slate-400">{item.label}</p>

                <p
                  className={`font-display mt-3 text-5xl font-bold ${
                    item.urgent ? "text-amber-300" : "text-white"
                  }`}
                >
                  {item.value}
                </p>

                <p
                  className={`mt-2 text-sm ${
                    item.urgent ? "text-amber-200/80" : "text-slate-500"
                  }`}
                >
                  {item.note}
                </p>
              </div>
            ))}
          </section>

          {/* SEARCH BAR */}
          <div className="relative mb-6">
            <SearchIcon
              size={20}
              className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              aria-label="Search reports"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by report ID, type, date or status"
              className="w-full rounded-xl border border-white/10 bg-slate-950/85 py-3.5 pl-12 pr-12 text-white placeholder-slate-500 backdrop-blur-md outline-none transition-colors focus:border-sky-400/60 focus:ring-2 focus:ring-sky-400/30"
            />

            {query && (
              <button
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-md p-1.5 text-slate-400 transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-300"
              >
                <CloseIcon size={18} />
              </button>
            )}
          </div>

          {/* REPORT TABLE */}
          <section className="overflow-hidden rounded-2xl border border-white/10 bg-slate-950/85 backdrop-blur-md">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 px-6 py-5">
              <div>
                <h2 className="font-display text-xl font-bold text-white">
                  System reports
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  {filteredReports.length} of {reports.length} reports
                </p>
              </div>

              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 transition-colors hover:bg-slate-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300"
              >
                <PrinterIcon size={18} />
                Print report
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left">
                <thead>
                  <tr className="border-b border-white/10">
                    {headings.map((heading) => (
                      <th
                        key={heading}
                        scope="col"
                        className="px-6 py-3 text-sm font-medium text-slate-400"
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-white/10">
                  {filteredReports.map((report) => {
                    const look = statusLook[report.status];

                    return (
                      <tr
                        key={report.id}
                        className="transition-colors hover:bg-white/5"
                      >
                        <td className="px-6 py-4 text-slate-300">
                          {report.id}
                        </td>

                        <td className="px-6 py-4 font-semibold text-white">
                          {report.type}
                        </td>

                        <td className="px-6 py-4 text-slate-400">
                          {report.date}
                        </td>

                        <td className="px-6 py-4 tabular-nums text-white">
                          {report.total}
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-2 font-medium ${look.text}`}
                          >
                            <span
                              className={`h-2 w-2 rounded-full ${look.dot}`}
                            />
                            {report.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* NO RESULTS */}
            {filteredReports.length === 0 && (
              <div className="px-6 py-12 text-center">
                <h3 className="font-display text-lg font-bold text-white">
                  No reports found
                </h3>
                <p className="mt-2 text-slate-400">
                  Nothing matches that search. Try an ID, type or date.
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
    </div>
  );
}