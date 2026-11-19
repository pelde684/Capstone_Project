import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Package, X, ZoomIn } from "lucide-react";
import Sidebar from "../components/Sidebar";
import MenuToggle from "../components/MenuToggle";
import NotificationBell from "../components/NotificationBell";
import ProfileMenu from "../components/ProfileMenu";
import MyRoom from "../components/MyRoom";
import { useBelongings } from "../context/BelongingsContext";

// Each card is a flat white panel with a coloured left edge that shows the item's status.
// It has a light and a dark version, and the status is also written out in words.
const statusStyles = {
  "Pending Verification": {
    label: "Pending",
    card: "border-l-4 border-l-amber-500",
    iconBox: "bg-amber-500/15",
    icon: "text-amber-600 dark:text-amber-300",
    badge: "text-amber-700 dark:text-amber-300",
    dot: "bg-amber-500",
  },
  Stored: {
    label: "Stored",
    card: "border-l-4 border-l-emerald-600",
    iconBox: "bg-emerald-500/15",
    icon: "text-emerald-700 dark:text-emerald-300",
    badge: "text-emerald-700 dark:text-emerald-300",
    dot: "bg-emerald-500",
  },
  "Not Registered": {
    label: "Not registered",
    card: "border-l-4 border-l-red-600",
    iconBox: "bg-red-500/15",
    icon: "text-red-700 dark:text-red-300",
    badge: "text-red-700 dark:text-red-300",
    dot: "bg-red-500",
  },
  Returned: {
    label: "Returned",
    card: "border-l-4 border-l-slate-400",
    iconBox: "bg-blue-500/15",
    icon: "text-accent",
    badge: "text-body",
    dot: "bg-slate-400",
  },
};

const legend = [
  { label: "Pending", dot: "bg-amber-500" },
  { label: "Stored", dot: "bg-emerald-500" },
  { label: "Not registered", dot: "bg-red-500" },
];

// Where the item is right now, in words the student understands
function whereIs(item) {
  if (item.status === "Returned") return "Collected by you";
  if (item.status === "Not Registered") return "Cancelled";
  if (item.location) return item.status === "Stored" ? item.location : `${item.location} (waiting for verification)`;
  return item.room ? `Not dropped off yet - bring it to ${item.room}` : "Not in the luggage room yet - bring it for drop-off";
}

export default function MyBelongings() {
  const navigate = useNavigate();
  const { items } = useBelongings();
  const [selectedPhoto, setSelectedPhoto] = useState(null); // { photos, name, index } or null

  const step = (dir) =>
    setSelectedPhoto((s) => s && { ...s, index: (s.index + dir + s.photos.length) % s.photos.length });

  // Esc closes the large photo; left/right arrows move between an item's photos
  useEffect(() => {
    if (!selectedPhoto) return;
    const handleKey = (e) => {
      if (e.key === "Escape") setSelectedPhoto(null);
      if (e.key === "ArrowLeft") step(-1);
      if (e.key === "ArrowRight") step(1);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [selectedPhoto]);

  return (
    <div className="min-h-screen bg-overlay">
      <div className="flex min-h-screen flex-col md:flex-row">
        <Sidebar activePath="/belongings" />

        <div className="min-w-0 flex-1">
          <header className="flex flex-col gap-3 border-b border-line bg-bar px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8 sm:py-5">
            <div className="flex items-center gap-3">
              <MenuToggle />
              <div>
                <h1 className="text-lg font-semibold text-heading sm:text-xl">My Belongings</h1>
                <p className="text-xs text-body sm:text-sm">Everything you've registered for storage</p>
              </div>
            </div>
            <div className="flex w-full items-center justify-between gap-5 sm:w-auto sm:justify-end">
              <NotificationBell />
              <ProfileMenu />
            </div>
          </header>

          <main className="px-4 py-5 sm:px-8 sm:py-6">
            <MyRoom />
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
                className="rounded-xl bg-blue-500 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-600 sm:py-2"
              >
                + Register New Item
              </button>
            </div>

            {items.length === 0 ? (
              <div className="rounded-xl border border-line bg-panel p-10 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/15">
                  <Package className="h-6 w-6 text-amber-500" />
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
                      className={`flex flex-col gap-3 rounded-xl border border-line bg-panel p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5 ${style.card}`}
                    >
                      <div className="flex min-w-0 items-center gap-4">
                        {item.photos?.length ? (
                          <button
                            type="button"
                            onClick={() => setSelectedPhoto({ photos: item.photos, name: item.name, index: 0 })}
                            className="group relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl"
                            aria-label={`View photo of ${item.name}`}
                          >
                            <img
                              src={item.photos[0]}
                              alt={item.name}
                              className="h-full w-full object-cover"
                            />
                            {item.photos.length > 1 && (
                              <span className="absolute bottom-1 right-1 rounded-md bg-black/70 px-1.5 text-[10px] font-semibold text-white">
                                {item.photos.length}
                              </span>
                            )}
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
                        <div className="min-w-0">
                          <p className="break-words font-semibold text-heading">{item.name}</p>
                          <p className="text-xs text-body">
                            {item.category} • QR ID: {item.batchId}
                          </p>
                          {item.description && (
                            <p className="mt-1 break-words text-xs text-muted">{item.description}</p>
                          )}
                          <p className="mt-1 text-xs text-body">
                            <span className="font-medium text-heading">Location: </span>
                            {whereIs(item)}
                          </p>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center justify-between gap-4 sm:flex-col sm:items-end sm:gap-1">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${style.badge}`}>
                          <span className={`h-2 w-2 rounded-full ${style.dot}`}></span>
                          {style.label}
                        </span>
                        <p className="text-xs text-body">{item.date}</p>
                      </div>
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
          {selectedPhoto.photos.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); step(-1); }}
                className="absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
                aria-label="Previous photo"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); step(1); }}
                className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
                aria-label="Next photo"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}
          <div className="flex max-h-full max-w-3xl flex-col items-center gap-3">
            <img
              src={selectedPhoto.photos[selectedPhoto.index]}
              alt={selectedPhoto.name}
              onClick={(e) => e.stopPropagation()}
              className="max-h-[80vh] max-w-full rounded-xl object-contain"
            />
            <p className="text-sm font-medium text-white">
              {selectedPhoto.name}
              {selectedPhoto.photos.length > 1 && ` · photo ${selectedPhoto.index + 1} of ${selectedPhoto.photos.length}`}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}