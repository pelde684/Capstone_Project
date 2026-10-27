import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  UserCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Package,
  X,
  ZoomIn,
} from "lucide-react";
import Sidebar from "../components/Sidebar";
import { useBelongings } from "../context/BelongingsContext";
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

// Items saved earlier only have one "photo", newer ones have a "photos" list
function getPhotos(item) {
  if (item.photos && item.photos.length > 0) return item.photos;
  if (item.photo) return [item.photo];
  return [];
}

export default function MyBelongings() {
  const navigate = useNavigate();
  const { items } = useBelongings();
  const [gallery, setGallery] = useState(null); // { photos, name, index } or null
  const galleryOpen = gallery !== null;

  const showPrev = () =>
    setGallery((g) => ({ ...g, index: (g.index - 1 + g.photos.length) % g.photos.length }));
  const showNext = () =>
    setGallery((g) => ({ ...g, index: (g.index + 1) % g.photos.length }));

  // Keyboard: Esc closes, left and right arrows move between photos
  useEffect(() => {
    if (!galleryOpen) return;
    const handleKey = (e) => {
      if (e.key === "Escape") setGallery(null);
      if (e.key === "ArrowLeft") setGallery((g) => ({ ...g, index: (g.index - 1 + g.photos.length) % g.photos.length }));
      if (e.key === "ArrowRight") setGallery((g) => ({ ...g, index: (g.index + 1) % g.photos.length }));
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [galleryOpen]);

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
                  <p className="text-sm font-semibold text-heading">Student</p>
                  <p className="text-xs text-body">CST Luggage Room</p>
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
                  Items you register will show up here with their photos.
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
                  const photos = getPhotos(item);
                  return (
                    <div
                      key={item.id}
                      className={`flex flex-col gap-3 rounded-2xl border p-4 shadow-md backdrop-blur-md sm:flex-row sm:items-center sm:justify-between sm:p-5 ${style.card}`}
                    >
                      <div className="flex items-center gap-4">
                        {photos.length > 0 ? (
                          <button
                            type="button"
                            onClick={() => setGallery({ photos, name: item.name, index: 0 })}
                            className="group relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl"
                            aria-label={`View ${photos.length} photo${photos.length === 1 ? "" : "s"} of ${item.name}`}
                          >
                            <img
                              src={photos[0]}
                              alt={item.name}
                              className="h-full w-full object-cover"
                            />
                            <span className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                              <ZoomIn className="h-5 w-5 text-white" />
                            </span>
                            {photos.length > 1 && (
                              <span className="absolute bottom-1 right-1 rounded-md bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                                {photos.length}
                              </span>
                            )}
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
                            {item.category} • QR ID: {item.Id}
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

      {/* Large photo view: arrows or thumbnails switch photos; tap outside, X, or Esc closes */}
      {galleryOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
          onClick={() => setGallery(null)}
        >
          <button
            type="button"
            onClick={() => setGallery(null)}
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
            aria-label="Close photos"
          >
            <X className="h-6 w-6" />
          </button>

          {gallery.photos.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  showPrev();
                }}
                className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 sm:left-6"
                aria-label="Previous photo"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  showNext();
                }}
                className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 sm:right-6"
                aria-label="Next photo"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}

          <div
            className="flex max-h-full max-w-3xl flex-col items-center gap-3"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={gallery.photos[gallery.index]}
              alt={`${gallery.name}, photo ${gallery.index + 1}`}
              className="max-h-[70vh] max-w-full rounded-xl object-contain"
            />
            <p className="text-sm font-medium text-white">
              {gallery.name}
              {gallery.photos.length > 1 && (
                <span className="ml-2 text-white/60">
                  {gallery.index + 1} / {gallery.photos.length}
                </span>
              )}
            </p>

            {gallery.photos.length > 1 && (
              <div className="flex gap-2">
                {gallery.photos.map((src, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setGallery((g) => ({ ...g, index: i }))}
                    className={`h-12 w-12 overflow-hidden rounded-lg border-2 transition-opacity ${
                      i === gallery.index
                        ? "border-blue-400 opacity-100"
                        : "border-transparent opacity-60 hover:opacity-100"
                    }`}
                    aria-label={`Show photo ${i + 1}`}
                  >
                    <img src={src} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}