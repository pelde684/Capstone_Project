import { useState } from "react";
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

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */
const records = [
  {
    id: "REC-001",
    time: "2026-09-28 09:15",
    student: "Kinley Dorji",
    studentId: "02250123",
    item: "Black Suitcase",
    status: "Completed",
    operator: "Tenzin Norbu",
  },
  {
    id: "REC-002",
    time: "2026-09-28 10:02",
    student: "Pema Wangchuk",
    studentId: "02250456",
    item: "Blue Backpack",
    status: "Completed",
    operator: "Tenzin Norbu",
  },
  {
    id: "REC-003",
    time: "2026-09-28 11:40",
    student: "Tashi Tshering",
    studentId: "02250789",
    item: "Laptop Bag",
    status: "Completed",
    operator: "Choki Lhamo",
  },
  {
    id: "REC-004",
    time: "2026-09-28 12:15",
    student: "Sonam Wangmo",
    studentId: "02250987",
    item: "Travel Bag",
    status: "Pending",
    operator: "Choki Lhamo",
  },
  {
    id: "REC-005",
    time: "2026-09-28 13:05",
    student: "Sonam Choden",
    studentId: "02250217",
    item: "Red Trolley Bag",
    status: "Completed",
    operator: "Jigme Wangdi",
  },
  {
    id: "REC-006",
    time: "2026-09-28 13:40",
    student: "Tshering Dema",
    studentId: "02250334",
    item: "Green Duffel Bag",
    status: "Pending",
    operator: "Jigme Wangdi",
  },
  {
    id: "REC-007",
    time: "2026-09-28 14:20",
    student: "Karma Tenzin",
    studentId: "02250589",
    item: "Grey Laptop Bag",
    status: "Completed",
    operator: "Tenzin Norbu",
  },
  {
    id: "REC-008",
    time: "2026-09-28 15:10",
    student: "Dechen Lhamo",
    studentId: "02250671",
    item: "Brown Cardboard Box",
    status: "Pending",
    operator: "Choki Lhamo",
  },
];

const statusLook = {
  Completed: { dot: "bg-emerald-400", text: "text-emerald-300" },
  Pending: { dot: "bg-amber-400", text: "text-amber-300" },
};

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */
export default function SystemRecords() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  // Search records
  const term = search.toLowerCase();
  const filteredRecords = records.filter(
    (record) =>
      record.student.toLowerCase().includes(term) ||
      record.studentId.toLowerCase().includes(term) ||
      record.item.toLowerCase().includes(term) ||
      record.status.toLowerCase().includes(term) ||
      record.operator.toLowerCase().includes(term) ||
      record.id.toLowerCase().includes(term)
  );

  const headings = ["Record", "Time", "Student", "Item", "Status", "Operator"];

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
            "linear-gradient(rgba(15,23,42,0.82), rgba(15,23,42,0.82)), url('/college.jpeg')",
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
              System records
            </h1>

            <p className="mt-2 text-lg text-slate-300">
              Everything that has happened in the luggage room, newest last.
            </p>
          </header>

          {/* SEARCH BAR */}
          <div className="relative mb-6">
            <SearchIcon
              size={20}
              className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              aria-label="Search records"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by student, ID, item, status or operator"
              className="w-full rounded-xl border border-white/10 bg-slate-950/85 py-3.5 pl-12 pr-12 text-white placeholder-slate-500 backdrop-blur-md outline-none transition-colors focus:border-sky-400/60 focus:ring-2 focus:ring-sky-400/30"
            />

            {search && (
              <button
                onClick={() => setSearch("")}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-md p-1.5 text-slate-400 transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-300"
              >
                <CloseIcon size={18} />
              </button>
            )}
          </div>

          {/* ACTIVITY LOG */}
          <section className="overflow-hidden rounded-2xl border border-white/10 bg-slate-950/85 backdrop-blur-md">
            <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-white/10 px-6 py-5">
              <h2 className="font-display text-xl font-bold text-white">
                Activity log
              </h2>
              <p className="text-sm text-slate-400">
                {filteredRecords.length} of {records.length} records
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left">
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
                  {filteredRecords.map((record) => {
                    const look = statusLook[record.status];

                    return (
                      <tr
                        key={record.id}
                        className="transition-colors hover:bg-white/5"
                      >
                        <td className="px-6 py-4 text-slate-300">
                          {record.id}
                        </td>

                        <td className="px-6 py-4 tabular-nums text-slate-400">
                          {record.time}
                        </td>

                        <td className="px-6 py-4">
                          <p className="font-semibold text-white">
                            {record.student}
                          </p>
                          <p className="text-sm text-slate-400">
                            {record.studentId}
                          </p>
                        </td>

                        <td className="px-6 py-4 text-white">{record.item}</td>

                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-2 font-medium ${look.text}`}
                          >
                            <span
                              className={`h-2 w-2 rounded-full ${look.dot}`}
                            />
                            {record.status}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <p className="font-semibold text-white">
                            {record.operator}
                          </p>
                          <p className="text-sm text-slate-400">Operator</p>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* NO RESULTS */}
            {filteredRecords.length === 0 && (
              <div className="px-6 py-12 text-center">
                <h3 className="font-display text-lg font-bold text-white">
                  No records found
                </h3>
                <p className="mt-2 text-slate-400">
                  Nothing matches that search. Try a name, ID or item.
                </p>
                <button
                  onClick={() => setSearch("")}
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