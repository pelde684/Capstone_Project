import { useState } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

function SearchIcon({ size = 20, className = "" }) {
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
      <circle cx="11" cy="11" r="6.5" />
      <path d="M16 16l4.5 4.5" />
    </svg>
  );
}

function Handover() {
  const [items, setItems] = useState([
    {
      id: 1,
      student: "Kinley Dorji",
      studentId: "02250123",
      item: "Black Suitcase",
      qr: "QR-2026-001",
      description: "Black medium-sized suitcase with clothes.",
      handedOver: false,
    },
    {
      id: 2,
      student: "Pema Wangchuk",
      studentId: "02250456",
      item: "Blue Backpack",
      qr: "QR-2026-002",
      description: "Blue backpack containing books and personal items.",
      handedOver: false,
    },
    {
      id: 3,
      student: "Sonam Choden",
      studentId: "02250217",
      item: "Red Trolley Bag",
      qr: "QR-2026-003",
      description: "Red trolley bag with a broken left wheel, filled with winter clothes.",
      handedOver: false,
    },
    {
      id: 4,
      student: "Tshering Dema",
      studentId: "02250334",
      item: "Green Duffel Bag",
      qr: "QR-2026-004",
      description: "Green duffel bag with sports shoes and a football jersey.",
      handedOver: false,
    },
    {
      id: 5,
      student: "Karma Tenzin",
      studentId: "02250589",
      item: "Grey Laptop Bag",
      qr: "QR-2026-005",
      description: "Grey laptop bag with a charger, notebooks and a pencil case.",
      handedOver: false,
    },
    {
      id: 6,
      student: "Dechen Lhamo",
      studentId: "02250671",
      item: "Brown Cardboard Box",
      qr: "QR-2026-006",
      description: "Medium cardboard box taped shut, with kitchen items and bedding.",
      handedOver: false,
    },
    {
      id: 7,
      student: "Ugyen Namgay",
      studentId: "02250742",
      item: "Maroon Suitcase",
      qr: "QR-2026-007",
      description: "Large maroon suitcase with a name tag on the handle.",
      handedOver: false,
    },
    {
      id: 8,
      student: "Yangchen Pelden",
      studentId: "02250815",
      item: "Black Sports Bag",
      qr: "QR-2026-008",
      description: "Black sports bag with a badminton racket and a water bottle.",
      handedOver: false,
    },
  ]);

  const [searchTerm, setSearchTerm] = useState("");

  const setHandedOver = (id, handedOver) => {
    setItems((current) =>
      current.map((entry) =>
        entry.id === id ? { ...entry, handedOver } : entry
      )
    );
  };

  // SEARCH
  const term = searchTerm.toLowerCase();
  const filteredItems = items.filter(
    (entry) =>
      entry.item.toLowerCase().includes(term) ||
      entry.student.toLowerCase().includes(term) ||
      entry.studentId.toLowerCase().includes(term) ||
      entry.qr.toLowerCase().includes(term)
  );

  return (
    <div
      className="min-h-screen"
      style={{ fontFamily: "'Figtree', system-ui, sans-serif" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700;12..96,800&family=Figtree:wght@400;500;600&display=swap');

        .font-display { font-family: 'Bricolage Grotesque', 'Figtree', system-ui, sans-serif; }
      `}</style>

      <Sidebar />

      <main className="ml-64 min-h-screen">
        <Navbar title="Handover" />

        <div className="mx-auto max-w-5xl p-8">
          {/* PAGE HEADER */}
          <header className="mb-8">
            <h1 className="font-display text-4xl font-bold tracking-tight text-white">
              Hand over a bag
            </h1>

            <p className="mt-2 text-lg text-slate-300">
              Check the student and the bag against the record, then confirm.
            </p>
          </header>

          {/* SEARCH BAR */}
          <div className="relative mb-6">
            <SearchIcon
              size={20}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              aria-label="Search students and bags"
              placeholder="Search by student name, ID, bag or QR code"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-slate-950/85 py-3.5 pl-12 pr-4 text-white placeholder-slate-500 backdrop-blur-md outline-none transition-colors focus:border-sky-400/60 focus:ring-2 focus:ring-sky-400/30"
            />
          </div>

          {/* HANDOVER LIST */}
          <div className="space-y-5">
            {filteredItems.length > 0 ? (
              filteredItems.map((entry) => (
                <article
                  key={entry.id}
                  className="rounded-2xl border border-white/10 bg-slate-950/85 p-6 backdrop-blur-md"
                >
                  {/* STUDENT NAME + ID AT THE TOP */}
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <div>
                      <p className="text-sm text-slate-400">Student</p>
                      <p className="font-display mt-1 text-2xl font-bold text-white">
                        {entry.student}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-slate-400">Student ID</p>
                      <p className="font-display mt-1 text-2xl font-bold text-white">
                        {entry.studentId}
                      </p>
                    </div>
                  </div>

                  {/* THE ITEM: turns green once handed over */}
                  <div
                    className={`relative mt-6 overflow-hidden rounded-xl border py-5 pl-7 pr-5 transition-colors duration-300 ${
                      entry.handedOver
                        ? "border-emerald-400/40 bg-emerald-500/15"
                        : "border-white/10 bg-white/5"
                    }`}
                  >
                    <span
                      className={`absolute inset-y-0 left-0 w-2 ${
                        entry.handedOver ? "bg-emerald-400" : "bg-slate-500"
                      }`}
                    />

                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p
                          className={`font-display text-xl font-bold ${
                            entry.handedOver ? "text-emerald-200" : "text-white"
                          }`}
                        >
                          {entry.item}
                        </p>
                        <p
                          className={`mt-0.5 text-sm ${
                            entry.handedOver
                              ? "text-emerald-200/70"
                              : "text-slate-400"
                          }`}
                        >
                          QR ID: {entry.qr}
                        </p>
                      </div>

                      {entry.handedOver && (
                        <span className="shrink-0 rounded-md bg-emerald-600 px-3 py-1 text-sm font-semibold text-white">
                          Handed over
                        </span>
                      )}
                    </div>

                    <p
                      className={`mt-3 ${
                        entry.handedOver
                          ? "text-emerald-100/90"
                          : "text-slate-300"
                      }`}
                    >
                      {entry.description}
                    </p>
                  </div>

                  {/* ACTION */}
                  <div className="mt-6 flex justify-end">
                    {entry.handedOver ? (
                      <button
                        onClick={() => setHandedOver(entry.id, false)}
                        className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-400 transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300"
                      >
                        Undo
                      </button>
                    ) : (
                      <button
                        onClick={() => setHandedOver(entry.id, true)}
                        className="rounded-lg bg-white px-8 py-2.5 text-sm font-semibold text-slate-900 transition-colors hover:bg-slate-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300"
                      >
                        Confirm handover
                      </button>
                    )}
                  </div>
                </article>
              ))
            ) : (
              <div className="rounded-2xl border border-white/10 bg-slate-950/85 p-12 text-center backdrop-blur-md">
                <h2 className="font-display text-xl font-bold text-white">
                  No matches
                </h2>

                <p className="mt-2 text-slate-400">
                  Nothing matches that search. Try a name, ID or QR code.
                </p>

                <button
                  onClick={() => setSearchTerm("")}
                  className="mt-5 rounded-lg border border-white/20 px-4 py-2 text-sm font-semibold text-slate-200 transition-colors hover:border-white/40 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300"
                >
                  Clear search
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default Handover;