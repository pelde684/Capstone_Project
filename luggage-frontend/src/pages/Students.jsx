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

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */
const students = [
  {
    id: "02250123",
    name: "Kinley Dorji",
    email: "kinley@example.com",
    belongings: 2,
    status: "Active",
  },
  {
    id: "02250456",
    name: "Pema Wangchuk",
    email: "pema@example.com",
    belongings: 1,
    status: "Active",
  },
  {
    id: "02250789",
    name: "Tashi Tshering",
    email: "tashi@example.com",
    belongings: 3,
    status: "Active",
  },
  {
    id: "02250217",
    name: "Sonam Choden",
    email: "sonam@example.com",
    belongings: 1,
    status: "Active",
  },
  {
    id: "02250334",
    name: "Tshering Dema",
    email: "tshering@example.com",
    belongings: 1,
    status: "Active",
  },
  {
    id: "02250589",
    name: "Karma Tenzin",
    email: "karma@example.com",
    belongings: 2,
    status: "Active",
  },
  {
    id: "02250671",
    name: "Dechen Lhamo",
    email: "dechen@example.com",
    belongings: 1,
    status: "Active",
  },
  {
    id: "02250742",
    name: "Ugyen Namgay",
    email: "ugyen@example.com",
    belongings: 1,
    status: "Active",
  },
];

function StatusLabel({ status }) {
  return (
    <span className="inline-flex items-center gap-2 font-medium text-emerald-300">
      <span className="h-2 w-2 rounded-full bg-emerald-400" />
      {status}
    </span>
  );
}

const headings = ["Student ID", "Name", "Email", "Belongings", "Status"];

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */
export default function Students() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const filteredStudents = useMemo(() => {
    const q = query.trim().toLowerCase();

    if (!q) return students;

    return students.filter(
      (s) =>
        s.id.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.status.toLowerCase().includes(q)
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

      {/* BLURRED BACKGROUND LAYER */}
      <div
        className="fixed inset-0 scale-110 bg-cover bg-center blur-md"
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
              Students
            </h1>

            <p className="mt-2 text-lg text-slate-300">
              Everyone who has registered bags in the luggage room.
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
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, ID or email"
              aria-label="Search students"
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

          {/* STUDENT LIST */}
          <section className="overflow-hidden rounded-2xl border border-white/10 bg-slate-950/85 backdrop-blur-md">
            <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-white/10 px-6 py-5">
              <h2 className="font-display text-xl font-bold text-white">
                Registered students
              </h2>
              <p className="text-sm text-slate-400">
                {filteredStudents.length} of {students.length} students
              </p>
            </div>

            {filteredStudents.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <h3 className="font-display text-lg font-bold text-white">
                  No students found
                </h3>
                <p className="mt-2 text-slate-400">
                  No student matches "{query}". Try a name, ID or email.
                </p>
                <button
                  onClick={() => setQuery("")}
                  className="mt-5 rounded-lg border border-white/20 px-4 py-2 text-sm font-semibold text-slate-200 transition-colors hover:border-white/40 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300"
                >
                  Clear search
                </button>
              </div>
            ) : (
              <>
                {/* DESKTOP / TABLET */}
                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full text-left">
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
                      {filteredStudents.map((student) => (
                        <tr
                          key={student.id}
                          className="transition-colors hover:bg-white/5"
                        >
                          <td className="px-6 py-4 tabular-nums text-slate-300">
                            {student.id}
                          </td>

                          <td className="px-6 py-4 font-semibold text-white">
                            {student.name}
                          </td>

                          <td className="px-6 py-4 text-slate-400">
                            {student.email}
                          </td>

                          <td className="px-6 py-4 tabular-nums text-white">
                            {student.belongings}
                          </td>

                          <td className="px-6 py-4">
                            <StatusLabel status={student.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* MOBILE */}
                <ul className="divide-y divide-white/10 md:hidden">
                  {filteredStudents.map((student) => (
                    <li key={student.id} className="space-y-3 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold text-white">
                            {student.name}
                          </p>
                          <p className="break-all text-sm text-slate-400">
                            {student.email}
                          </p>
                        </div>

                        <StatusLabel status={student.status} />
                      </div>

                      <div className="flex gap-8 text-sm">
                        <div>
                          <p className="text-slate-400">Student ID</p>
                          <p className="font-medium tabular-nums text-slate-200">
                            {student.id}
                          </p>
                        </div>

                        <div>
                          <p className="text-slate-400">Belongings</p>
                          <p className="font-medium tabular-nums text-slate-200">
                            {student.belongings}
                          </p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}