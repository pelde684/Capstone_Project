import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";
import {
  UserCircle2,
  ChevronDown,
  Upload,
  ArrowLeft,
  Download,
  CheckCircle2,
  Pencil,
  Plus,
  Trash2,
  Package,
  X,
} from "lucide-react";
import Sidebar from "../components/Sidebar";
import NotificationBell from "../components/NotificationBell";
import { api, buildDropOffForm, getUser } from "../api";
import { useBelongings } from "../context/BelongingsContext";
import { shortCode } from "../utils/belongings";
import loginBg from "../assets/college.jpeg";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_PHOTO_MB = 5;
const MAX_PHOTOS = 4; // per item, from different sides (meeting 9)

function emptyItem() {
  return {
    key: Math.random().toString(16).slice(2),
    id: null, // set when this item already exists in the database (editing)
    itemName: "",
    categoryId: "",
    description: "",
    photos: [], // up to 4: { id } = already saved, { file } = newly picked; preview = what is shown
  };
}

export default function RegisterItem() {
  const navigate = useNavigate();
  const { reload } = useBelongings();
  const user = getUser();

  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([emptyItem()]);
  const [registered, setRegistered] = useState(null); // the saved drop-off from the server
  const [editingDropOffId, setEditingDropOffId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // categories come from the database, so the list always matches what the admin manages
  useEffect(() => {
    api("/categories")
      .then((r) => setCategories(r.data))
      .catch((err) => setError(err.message));
  }, []);

  const updateItem = (key, field, value) => {
    setItems((prev) => prev.map((it) => (it.key === key ? { ...it, [field]: value } : it)));
  };

  // Several photos can be picked at once; anything over 4 per item is left out with a message
  const handlePhotoChange = (key, e) => {
    const files = [...e.target.files];
    e.target.value = ""; // so the same file can be picked again after removing it
    if (!files.length) return;
    const bad = files.find((f) => !ALLOWED_TYPES.includes(f.type));
    if (bad) return setError(`"${bad.name}" is not a JPG, PNG or WebP photo.`);
    const big = files.find((f) => f.size > MAX_PHOTO_MB * 1024 * 1024);
    if (big) return setError(`"${big.name}" is bigger than ${MAX_PHOTO_MB} MB.`);

    const item = items.find((it) => it.key === key);
    const room = MAX_PHOTOS - item.photos.length;
    setError(files.length > room ? `Only ${MAX_PHOTOS} photos per item, so the extra ${files.length - room} were left out.` : "");
    const added = files.slice(0, room).map((file) => ({ file, preview: URL.createObjectURL(file) }));
    setItems((prev) => prev.map((it) => (it.key === key ? { ...it, photos: [...it.photos, ...added] } : it)));
  };

  const removePhoto = (key, index) =>
    setItems((prev) =>
      prev.map((it) => (it.key === key ? { ...it, photos: it.photos.filter((_, i) => i !== index) } : it))
    );

  const addItem = () => setItems((prev) => [...prev, emptyItem()]);

  const removeItem = (key) =>
    setItems((prev) => (prev.length > 1 ? prev.filter((it) => it.key !== key) : prev));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const missing = items.findIndex((it) => !it.photos.length);
    if (missing !== -1) {
      setError(`Item ${missing + 1} needs at least one photo.`);
      return;
    }

    setError("");
    setSubmitting(true);
    try {
      const form = buildDropOffForm(items);
      let dropOffId;
      if (editingDropOffId) {
        // editing keeps the SAME QR code, so a label that was already printed stays valid
        await api(`/drop-offs/${editingDropOffId}`, { method: "PUT", form });
        dropOffId = editingDropOffId;
      } else {
        const created = await api("/drop-offs", { method: "POST", form });
        dropOffId = created.id;
      }
      const saved = await api(`/drop-offs/${dropOffId}`); // items with photo links + the QR value
      await reload(); // My Belongings and the Dashboard update
      setEditingDropOffId(null);
      setRegistered(saved);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = () => {
    setEditingDropOffId(registered.id);
    setItems(
      registered.items.map((it) => ({
        key: Math.random().toString(16).slice(2),
        id: it.id,
        itemName: it.name,
        categoryId: String(it.categoryId),
        description: it.description || "",
        // the saved photos (up to 4), kept unless the student removes them
        photos: (it.photos?.length ? it.photos : it.photographUrl ? [it.photographUrl] : []).map((url, i) => ({
          id: it.photoIds?.[i] ?? null,
          preview: url,
        })),
      }))
    );
    setError("");
    setRegistered(null);
  };

  // One label per item (every bag gets the same QR), 6 labels on an A4 sheet.
  // Each sheet is saved as a PNG ready to print; 7+ items give a second sheet.
  const handleDownload = () => {
    const qr = document.getElementById("batch-qr-print"); // drawn at full label size, so the squares stay sharp
    const code = shortCode(registered.qrValue);
    const items = registered.items;
    const W = 1240, H = 1754, M = 60, GAP = 30, COLS = 2, ROWS = 3, PER = COLS * ROWS; // A4 at 150 dpi
    const cw = (W - 2 * M - GAP) / COLS, ch = (H - 2 * M - 2 * GAP) / ROWS;
    const fit = (ctx, text, max) => {
      let t = String(text || "");
      while (t.length > 1 && ctx.measureText(t).width > max) t = t.slice(0, -1);
      return t === String(text || "") ? t : t.slice(0, -1) + "…";
    };

    const sheets = Math.ceil(items.length / PER);
    for (let s = 0; s < sheets; s++) {
      const c = document.createElement("canvas");
      c.width = W; c.height = H;
      const ctx = c.getContext("2d");
      ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, W, H);
      ctx.textAlign = "center"; ctx.fillStyle = "#000";

      items.slice(s * PER, s * PER + PER).forEach((item, k) => {
        const n = s * PER + k;
        const x = M + (k % COLS) * (cw + GAP), y = M + Math.floor(k / COLS) * (ch + GAP);
        ctx.setLineDash([12, 8]); ctx.strokeStyle = "#777"; ctx.lineWidth = 2;
        ctx.strokeRect(x, y, cw, ch); ctx.setLineDash([]);
        const q = 300, cx = x + cw / 2;
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(qr, cx - q / 2, y + 40, q, q);
        ctx.font = "bold 40px Arial"; ctx.fillText(code, cx, y + 40 + q + 50);
        ctx.font = "bold 30px Arial"; ctx.fillText(fit(ctx, item.name, cw - 40), cx, y + 40 + q + 95);
        ctx.font = "22px Arial"; ctx.fillStyle = "#333";
        ctx.fillText(fit(ctx, `${user?.name || ""} · ${user?.studentId || ""} · Bag ${n + 1} of ${items.length}`, cw - 40), cx, y + 40 + q + 132);
        ctx.font = "18px Arial"; ctx.fillStyle = "#666"; ctx.fillText("CST Luggage Room", cx, y + 40 + q + 162);
        ctx.fillStyle = "#000";
      });

      const link = document.createElement("a");
      link.href = c.toDataURL("image/png");
      link.download = sheets > 1 ? `${code}-labels-${s + 1}.png` : `${code}-labels.png`;
      setTimeout(() => link.click(), s * 400); // small gap so the browser allows several downloads
    }
  };

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
        <Sidebar activePath="/register" />

        <div className="flex-1">
          <header className="flex flex-col gap-3 border-b border-line bg-bar px-4 py-4 backdrop-blur-md sm:flex-row sm:items-center sm:justify-between sm:px-8 sm:py-5">
            <div>
              <h1 className="text-lg font-semibold text-heading sm:text-xl">Register Item</h1>
              <p className="text-xs text-body sm:text-sm">Add one or more belongings for storage</p>
            </div>
            <div className="flex items-center gap-5">
              <NotificationBell />
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
            {!registered ? (
              <>
                <button
                  onClick={() => navigate("/dashboard")}
                  className="mb-4 flex items-center gap-1 text-sm text-body hover:text-heading"
                >
                  <ArrowLeft className="h-4 w-4" /> Back to Dashboard
                </button>

                <div className="mx-auto max-w-2xl space-y-5">
                  <div className="rounded-2xl border border-line bg-panel p-5 shadow-md backdrop-blur-md sm:p-6">
                    <p className="text-sm text-body">
                      {editingDropOffId
                        ? "You're editing a drop-off. Your QR code stays the same, so a label you already printed is still valid."
                        : "Add details for each item you're storing. All items in this submission will share one QR code for drop-off."}
                    </p>
                  </div>

                  {error && (
                    <div className="rounded-xl border border-red-400/50 bg-red-500/15 px-4 py-3 text-sm text-red-600 dark:text-red-300">
                      {error}
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-5">
                    {items.map((item, index) => (
                      <div
                        key={item.key}
                        className="rounded-2xl border border-line bg-panel p-5 shadow-md backdrop-blur-md sm:p-8"
                      >
                        <div className="flex items-center justify-between">
                          <h2 className="text-lg font-semibold text-heading">Item {index + 1}</h2>
                          {items.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeItem(item.key)}
                              className="flex items-center gap-1 rounded-lg border border-line px-2.5 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-hover dark:text-red-300"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Remove
                            </button>
                          )}
                        </div>

                        <div className="mt-5 space-y-5">
                          <div>
                            <label className="mb-1 block text-sm font-medium text-body">
                              Item Name
                            </label>
                            <input
                              type="text"
                              value={item.itemName}
                              onChange={(e) => updateItem(item.key, "itemName", e.target.value)}
                              placeholder="e.g. Black Suitcase"
                              required
                              maxLength={150}
                              className="w-full rounded-xl border border-line bg-field px-4 py-3 text-sm text-heading outline-none placeholder:text-muted focus:border-blue-400"
                            />
                          </div>

                          <div>
                            <label className="mb-1 block text-sm font-medium text-body">
                              Category
                            </label>
                            <select
                              value={item.categoryId}
                              onChange={(e) => updateItem(item.key, "categoryId", e.target.value)}
                              required
                              className="w-full rounded-xl border border-line bg-field px-4 py-3 text-sm text-heading outline-none focus:border-blue-400"
                            >
                              <option
                                value=""
                                disabled
                                className="bg-white text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                              >
                                Select a category
                              </option>
                              {categories.map((c) => (
                                <option
                                  key={c.id}
                                  value={c.id}
                                  className="bg-white text-slate-900 dark:bg-slate-800 dark:text-white"
                                >
                                  {c.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="mb-1 block text-sm font-medium text-body">
                              Description
                            </label>
                            <textarea
                              value={item.description}
                              onChange={(e) => updateItem(item.key, "description", e.target.value)}
                              placeholder="e.g. Black medium-sized suitcase with clothes."
                              rows={3}
                              className="w-full resize-none rounded-xl border border-line bg-field px-4 py-3 text-sm text-heading outline-none placeholder:text-muted focus:border-blue-400"
                            />
                          </div>

                          <div>
                            <label className="mb-1 block text-sm font-medium text-body">
                              Photos <span className="text-muted">({item.photos.length} of {MAX_PHOTOS}, from different sides)</span>
                            </label>
                            <div className="grid grid-cols-2 gap-3 rounded-xl border-2 border-dashed border-muted/40 bg-field p-3 sm:grid-cols-4">
                              {item.photos.map((p, i) => (
                                <div key={p.preview} className="relative aspect-square overflow-hidden rounded-lg">
                                  <img src={p.preview} alt={`Photo ${i + 1}`} className="h-full w-full object-cover" />
                                  {i === 0 && (
                                    <span className="absolute left-1 top-1 rounded-md bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold text-white">Main</span>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => removePhoto(item.key, i)}
                                    className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-white hover:bg-red-600"
                                    aria-label={`Remove photo ${i + 1}`}
                                  >
                                    <X className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              ))}
                              {item.photos.length < MAX_PHOTOS && (
                                <label
                                  htmlFor={`photo-upload-${item.key}`}
                                  className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-muted/50 text-center hover:border-blue-400"
                                >
                                  <Upload className="h-5 w-5 text-accent" />
                                  <p className="text-xs text-body">{item.photos.length ? "Add photo" : "Upload photos"}</p>
                                  <p className="text-[10px] text-muted">JPG, PNG, WebP · {MAX_PHOTO_MB}MB</p>
                                </label>
                              )}
                            </div>
                            <input
                              id={`photo-upload-${item.key}`}
                              type="file"
                              multiple
                              accept="image/jpeg,image/png,image/webp"
                              onChange={(e) => handlePhotoChange(item.key, e)}
                              className="hidden"
                            />
                          </div>
                        </div>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={addItem}
                      className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-muted/40 py-3 text-sm font-medium text-body transition-colors hover:bg-hover"
                    >
                      <Plus className="h-4 w-4" />
                      Add Another Item
                    </button>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full rounded-xl bg-blue-500 py-3 text-sm font-medium text-white shadow-md transition-colors hover:bg-blue-600 disabled:opacity-60"
                    >
                      {submitting
                        ? "Saving..."
                        : editingDropOffId
                        ? "Save Changes"
                        : `Register ${items.length > 1 ? `${items.length} Items` : "Item"}`}
                    </button>
                  </form>
                </div>
              </>
            ) : (
              <div className="mx-auto max-w-md rounded-2xl border border-line bg-panel p-6 text-center shadow-md backdrop-blur-md sm:p-8">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20">
                  <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-300" />
                </div>
                <h2 className="mt-4 text-lg font-semibold text-heading">
                  {registered.items.length > 1
                    ? `${registered.items.length} Items Registered!`
                    : "Item Registered!"}
                </h2>
                <p className="mt-1 text-sm text-body">
                  One QR code covers everything in this drop-off.
                </p>

                <div className="mt-6 flex justify-center rounded-xl bg-white p-6">
                  <QRCodeCanvas id="batch-qr-canvas" value={registered.qrValue} size={180} />
                  {/* same QR at the exact size used on the printed labels (not shown) */}
                  <QRCodeCanvas id="batch-qr-print" value={registered.qrValue} size={300} level="M" style={{ display: "none" }} />
                </div>
                <p className="mt-2 text-xs text-muted">{shortCode(registered.qrValue)}</p>

                <div className="mt-5 space-y-2 text-left">
                  {registered.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 rounded-xl bg-field p-3">
                      {item.photographUrl ? (
                        <img
                          src={item.photographUrl}
                          alt={item.name}
                          className="h-10 w-10 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/15">
                          <Package className="h-5 w-5 text-accent" />
                        </div>
                      )}
                      {item.photos?.length > 1 && (
                        <span className="rounded-md bg-blue-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-accent">{item.photos.length} photos</span>
                      )}
                      <div>
                        <p className="text-sm font-medium text-heading">{item.name}</p>
                        <p className="text-xs text-muted">{item.categoryName}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleEdit}
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-line py-2.5 text-sm font-medium text-accent transition-colors hover:bg-hover"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Edit Items
                </button>

                <p className="mt-5 text-xs text-muted">
                  You get one label per item, all with the same QR code. Print, cut along the dashed
                  lines and stick one on each bag, or show the code on your phone at drop-off.
                </p>

                <button
                  onClick={handleDownload}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-500 py-3 text-sm font-medium text-white shadow-md transition-colors hover:bg-blue-600"
                >
                  <Download className="h-4 w-4" />
                  {registered.items.length > 1
                    ? `Download ${registered.items.length} QR Labels`
                    : "Download QR Label"}
                </button>

                <button
                  onClick={() => navigate("/belongings")}
                  className="mt-3 w-full rounded-xl border border-line py-3 text-sm font-medium text-body transition-colors hover:bg-hover"
                >
                  Go to My Belongings
                </button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
