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

// Look of the ITEM panel only, for each status
const itemStyles = {
  waiting: {
    box: "border-white/10 bg-white/5",
    edge: "bg-slate-500",
    name: "text-white",
    text: "text-slate-300",
    qr: "text-slate-400",
  },
  approved: {
    box: "border-emerald-400/40 bg-emerald-500/15",
    edge: "bg-emerald-400",
    name: "text-emerald-200",
    text: "text-emerald-100/90",
    qr: "text-emerald-200/70",
  },
  rejected: {
    box: "border-red-400/40 bg-red-500/15",
    edge: "bg-red-400",
    name: "text-red-200",
    text: "text-red-100/90",
    qr: "text-red-200/70",
  },
};

function Verification() {
  const [items, setItems] = useState([
    {
      id: 1,
      itemName: "Black Suitcase",
      qrCode: "QR-2026-001",
      studentName: "Kinley Dorji",
      studentId: "02250123",
      description: "Black medium-sized suitcase with clothes.",
      status: "waiting",
    },
    {
      id: 2,
      itemName: "Blue Backpack",
      qrCode: "QR-2026-002",
      studentName: "Pema Wangchuk",
      studentId: "02250456",
      description: "Blue backpack containing books and personal items.",
      status: "waiting",
    },
    {
      id: 3,
      itemName: "Red Trolley Bag",
      qrCode: "QR-2026-003",
      studentName: "Sonam Choden",
      studentId: "02250217",
      description: "Red trolley bag with a broken left wheel, filled with winter clothes.",
      status: "waiting",
    },
    {
      id: 4,
      itemName: "Green Duffel Bag",
      qrCode: "QR-2026-004",
      studentName: "Tshering Dema",
      studentId: "02250334",
      description: "Green duffel bag with sports shoes and a football jersey.",
      status: "waiting",
    },
    {
      id: 5,
      itemName: "Grey Laptop Bag",
      qrCode: "QR-2026-005",
      studentName: "Karma Tenzin",
      studentId: "02250589",
      description: "Grey laptop bag with a charger, notebooks and a pencil case.",
      status: "waiting",
    },
    {
      id: 6,
      itemName: "Brown Cardboard Box",
      qrCode: "QR-2026-006",
      studentName: "Dechen Lhamo",
      studentId: "02250671",
      description: "Medium cardboard box taped shut, with kitchen items and bedding.",
      status: "waiting",
    },
    {
      id: 7,
      itemName: "Maroon Suitcase",
      qrCode: "QR-2026-007",
      studentName: "Ugyen Namgay",
      studentId: "02250742",
      description: "Large maroon suitcase with a name tag on the handle.",
      status: "waiting",
    },
    {
      id: 8,
      itemName: "Black Sports Bag",
      qrCode: "QR-2026-008",
      studentName: "Yangchen Pelden",
      studentId: "02250815",
      description: "Black sports bag with a badminton racket and a water bottle.",
      status: "waiting",
    },
  ]);

  const [searchTerm, setSearchTerm] = useState("");

  const setStatus = (id, status) => {
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, status } : item))
    );
  };

  // SEARCH
  const term = searchTerm.toLowerCase();
  const filteredItems = items.filter(
    (item) =>
      item.itemName.toLowerCase().includes(term) ||
      item.studentName.toLowerCase().includes(term) ||
      item.studentId.toLowerCase().includes(term) ||
      item.qrCode.toLowerCase().includes(term)
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
        <Navbar title="Verification" />

        <div className="mx-auto max-w-5xl p-8">
          {/* PAGE HEADER */}
          <header className="mb-8">
            <h1 className="font-display text-4xl font-bold tracking-tight text-white">
              Check belongings
            </h1>

            <p className="mt-2 text-lg text-slate-300">
              Look over each bag's details, then approve or reject it.
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
              aria-label="Search belongings"
              placeholder="Search by student name, ID, bag or QR code"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-slate-950/85 py-3.5 pl-12 pr-4 text-white placeholder-slate-500 backdrop-blur-md outline-none transition-colors focus:border-sky-400/60 focus:ring-2 focus:ring-sky-400/30"
            />
          </div>

          {/* VERIFICATION ITEMS */}
          <div className="space-y-5">
            {filteredItems.length > 0 ? (
              filteredItems.map((item) => {
                const look = itemStyles[item.status];

                return (
                  <article
                    key={item.id}
                    className="rounded-2xl border border-white/10 bg-slate-950/85 p-6 backdrop-blur-md"
                  >
                    {/* STUDENT NAME + ID AT THE TOP (always neutral) */}
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                      <div>
                        <p className="text-sm text-slate-400">Student</p>
                        <p className="font-display mt-1 text-2xl font-bold text-white">
                          {item.studentName}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-slate-400">Student ID</p>
                        <p className="font-display mt-1 text-2xl font-bold text-white">
                          {item.studentId}
                        </p>
                      </div>
                    </div>

                    {/* THE ITEM: only this panel changes color */}
                    <div
                      className={`relative mt-6 overflow-hidden rounded-xl border py-5 pl-7 pr-5 transition-colors duration-300 ${look.box}`}
                    >
                      <span
                        className={`absolute inset-y-0 left-0 w-2 ${look.edge}`}
                      />

                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p
                            className={`font-display text-xl font-bold ${look.name}`}
                          >
                            {item.itemName}
                          </p>
                          <p className={`mt-0.5 text-sm ${look.qr}`}>
                            QR ID: {item.qrCode}
                          </p>
                        </div>

                        {item.status !== "waiting" && (
                          <span
                            className={`shrink-0 rounded-md px-3 py-1 text-sm font-semibold text-white ${
                              item.status === "approved"
                                ? "bg-emerald-600"
                                : "bg-red-600"
                            }`}
                          >
                            {item.status === "approved" ? "Approved" : "Rejected"}
                          </span>
                        )}
                      </div>

                      <p className={`mt-3 ${look.text}`}>{item.description}</p>
                    </div>

                    {/* ACTIONS: simple buttons */}
                    <div className="mt-6 flex justify-end gap-3">
                      {item.status === "waiting" ? (
                        <>
                          <button
                            onClick={() => setStatus(item.id, "rejected")}
                            className="w-28 rounded-lg border border-white/20 py-2.5 text-sm font-semibold text-slate-200 transition-colors hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300"
                          >
                            Reject
                          </button>

                          <button
                            onClick={() => setStatus(item.id, "approved")}
                            className="w-28 rounded-lg bg-white py-2.5 text-sm font-semibold text-slate-900 transition-colors hover:bg-slate-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300"
                          >
                            Approve
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => setStatus(item.id, "waiting")}
                          className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-400 transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300"
                        >
                          Undo
                        </button>
                      )}
                    </div>
                  </article>
                );
              })
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

export default Verification;