import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, UserCircle2, ChevronDown, Package, X, ZoomIn } from "lucide-react";
import Sidebar from "../components/Sidebar";
import { useBelongings } from "../context/BelongingsContext";
import { getUser } from "../api";
import loginBg from "../assets/college.jpeg";

// The whole card takes its color from the item's status, with a light and a dark version
const statusStyles = {
  "Pending Verification": {
    card: "border-yellow-500/60 bg-yellow-200/70 dark:border-yellow-400/50 dark:bg-yellow-500/20",
    iconBox: "bg-yellow-300/70 dark:bg-yellow-500/25",
    icon: "text-yellow-700 dark:text-yellow-200",
  },
  Stored: {
    card: "border-emerald-500/60 bg-emerald-200/70 dark:border-emerald-400/50 dark:bg-emerald-500/20",
    iconBox: "bg-emerald-300/70 dark:bg-emerald-500/25",
    icon: "text-emerald-700 dark:text-emerald-200",
  },
  "Not Registered": {
    card: "border-red-500/60 bg-red-200/70 dark:border-red-400/50 dark:bg-red-500/20",
    iconBox: "bg-red-300/70 dark:bg-red-500/25",
    icon: "text-red-700 dark:text-red-200",
  },
  Returned: {
    card: "border-line bg-panel",
    iconBox: "bg-blue-500/15",
    icon: "text-accent",
  },
};

const legend = [
  { label: "Pending", dot: "bg-yellow-400" },
  { label: "Stored", dot: "bg-emerald-400" },
  { label: "Not registered", dot: "bg-red-400" },
];

export default function MyBelongings() {
  const navigate = useNavigate();
  const { items } = useBelongings();
  const user = getUser();
  const [selectedPhoto, setSelectedPhoto] = useState(null); // { src, name } or null

  // Close the large photo when Esc is pressed
  useEffect(() => {
    if (!selectedPhoto) return;
    const handleKey = (e) => {
      if (e.key === "Escape") setSelectedPhoto(null);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [selectedPhoto]);

  return (
    <div
      className="relative min-h-screen"
      style={{
        backgroundImage: `url(${loginBg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="absolute inset-0 bg-overlay backdrop-blur-[2px]"></div>

      <div className="relative z-10 flex min-h-screen flex-col md:flex-row">
        <Sidebar activePath="/belongings" />

        <div className="flex-1">
          <header className="flex flex-col gap-3 border-b border-line bg-bar px-4 py-4 backdrop-blur-md sm:flex-row sm:items-center sm:justify-between sm:px-8 sm:py-5">
            <div>
              <h1 className="text-lg font-semibold text-heading sm:text-xl">My Belongings</h1>
              <p className="text-xs text-body sm:text-sm">Everything you've registered for storage</p>
            </div>
            <div className="flex items-center gap-5">
              <button className="relative text-body hover:text-heading">
                <Bell className="h-5 w-5" />
                <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-semibold text-white">
                  1
                </span>
              </button>
              <div className="flex items-center gap-2">
                <UserCircle2 className="h-8 w-8 text-accent" />
                <div className="leading-tight">
                  <p className="text-sm font-semibold text-heading">{user?.name || "Student"}</p>
                  <p className="text-xs text-body">{user?.studentId || "CST Luggage Room"}</p>
                </div>
                <ChevronDown className="h-4 w-4 text-muted" />
              </div>
            </div>
          </header>

          <main className="px-4 py-5 sm:px-8 sm:py-6">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-body">
                  {items.length} {items.length === 1 ? "item" : "items"} registered
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-4">
                  {legend.map(({ label, dot }) => (
                    <div key={label} className="flex items-center gap-1.5 text-xs text-body">
                      <span className={`h-2.5 w-2.5 rounded-full ${dot}`}></span>
                      {label}
                    </div>
                  ))}
                </div>
              </div>
              <button
                onClick={() => navigate("/register")}
                className="rounded-xl bg-blue-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-600"
              >
                + Register New Item
              </button>
            </div>

            {items.length === 0 ? (
              <div className="rounded-2xl border border-line bg-panel p-10 text-center shadow-md backdrop-blur-md">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/15">
                  <Package className="h-6 w-6 text-accent" />
                </div>
                <h2 className="mt-4 text-lg font-semibold text-heading">No items yet</h2>
                <p className="mt-1 text-sm text-body">
                  Items you register will show up here with their photo.
                </p>
                <button
                  onClick={() => navigate("/register")}
                  className="mt-5 rounded-xl bg-blue-500 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-600"
                >
                  Register your first item
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((item) => {
                  const style = statusStyles[item.status] || statusStyles["Pending Verification"];
                  return (
                    <div
                      key={item.id}
                      className={`flex flex-col gap-3 rounded-2xl border p-4 shadow-md backdrop-blur-md sm:flex-row sm:items-center sm:justify-between sm:p-5 ${style.card}`}
                    >
                      <div className="flex items-center gap-4">
                        {item.photo ? (
                          <button
                            type="button"
                            onClick={() => setSelectedPhoto({ src: item.photo, name: item.name })}
                            className="group relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl"
                            aria-label={`View photo of ${item.name}`}
                          >
                            <img
                              src={item.photo}
                              alt={item.name}
                              className="h-full w-full object-cover"
                            />
                            <span className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                              <ZoomIn className="h-5 w-5 text-white" />
                            </span>
                          </button>
                        ) : (
                          <div
                            className={`flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-xl ${style.iconBox}`}
                          >
                            <Package className={`h-7 w-7 ${style.icon}`} />
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-heading">{item.name}</p>
                          <p className="text-xs text-body">
                            {item.category} • QR ID: {item.batchId}
                          </p>
                          {item.description && (
                            <p className="mt-1 text-xs text-muted">{item.description}</p>
                          )}
                        </div>
                      </div>

                      <p className="text-xs text-body">{item.date}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Large photo view: tap outside the photo, tap X, or press Esc to close */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <button
            type="button"
            onClick={() => setSelectedPhoto(null)}
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
            aria-label="Close photo"
          >
            <X className="h-6 w-6" />
          </button>
          <div className="flex max-h-full max-w-3xl flex-col items-center gap-3">
            <img
              src={selectedPhoto.src}
              alt={selectedPhoto.name}
              onClick={(e) => e.stopPropagation()}
              className="max-h-[80vh] max-w-full rounded-xl object-contain"
            />
            <p className="text-sm font-medium text-white">{selectedPhoto.name}</p>
          </div>
        </div>
      )}
    </div>
  );
}