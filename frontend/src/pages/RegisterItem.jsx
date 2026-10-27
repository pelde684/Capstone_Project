import React, { useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import {
  Bell,
  UserCircle2,
  ChevronDown,
  ArrowLeft,
  Printer,
  CheckCircle2,
  Pencil,
  Plus,
  Trash2,
  Camera,
  X,
} from "lucide-react";
import Sidebar from "../components/Sidebar";
import { useBelongings } from "../context/BelongingsContext";
import loginBg from "../assets/college.jpeg";

const categories = ["Suitcase", "Backpack", "Box", "Bucket", "Mirror", "Other"];
const MAX_PHOTOS = 4;

// TODO: once Tandin's API is ready, the backend should generate and return the
// real unique batch ID when the items are saved, instead of generating it here.
function generateBatchId() {
  const year = new Date().getFullYear();
  const random = Math.random().toString(16).slice(2, 8).toUpperCase();
  return `QR-${year}-${random}`;
}

function emptyItem() {
  return {
    key: Math.random().toString(16).slice(2),
    itemName: "",
    category: "",
    description: "",
    photos: [], // each one: { id, file, preview }
  };
}

// Shrinks a photo and turns it into a small image string that can be saved.
// Photos are kept small because every item can have up to 4 of them.
function fileToDataUrl(file, maxSize = 640, quality = 0.6) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

/* ---------- A4 print sheet ---------- */

// Works out how many columns to use and how big each label and QR code can be
// so that every item's QR code fits on one A4 page (190 x 245 mm usable area).
function sheetLayout(count) {
  const usableW = 190;
  const usableH = 245;
  const gap = 3;
  const cols = count <= 4 ? 2 : count <= 9 ? 3 : count <= 16 ? 4 : 5;
  const rows = Math.ceil(count / cols);
  const cellW = (usableW - gap * (cols - 1)) / cols;
  const cellH = Math.min(85, (usableH - gap * (rows - 1)) / rows);
  const qr = Math.max(18, Math.min(cellW - 8, cellH - 20, 60));
  return { cols, gap, cellW, cellH, qr };
}

// Hidden on screen. When printing, the app is hidden and only this sheet shows.
const PRINT_CSS = `
  .print-sheet { display: none; }
  @media print {
    @page { size: A4 portrait; margin: 10mm; }
    :root { color-scheme: light !important; }
    html, body { background: #fff !important; color: #000 !important; }
    #root { display: none !important; }
    .print-sheet {
      display: block !important;
      width: 190mm;
      margin: 0 auto;
      font-family: Arial, Helvetica, sans-serif;
      color: #000;
    }
    .print-sheet * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .print-header { height: 18mm; border-bottom: 0.4mm solid #000; margin-bottom: 4mm; }
    .print-title { font-size: 14pt; font-weight: 700; }
    .print-sub { font-size: 8.5pt; margin-top: 1mm; color: #333; }
    .print-grid { display: grid; }
    .print-cell {
      border: 0.3mm dashed #666;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 2mm;
      overflow: hidden;
      break-inside: avoid;
    }
    .print-qr { background: #fff; padding: 1.5mm; line-height: 0; }
    .print-name {
      font-weight: 700;
      margin-top: 1.5mm;
      max-width: 100%;
      overflow: hidden;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      word-break: break-word;
    }
    .print-meta { color: #444; margin-top: 0.5mm; max-width: 100%; word-break: break-all; }
  }
`;

function PrintSheet({ batchId, items, date }) {
  const { cols, gap, cellW, cellH, qr } = sheetLayout(items.length);
  const nameSize = qr >= 40 ? "10pt" : qr >= 28 ? "8pt" : "6.5pt";
  const metaSize = qr >= 40 ? "7.5pt" : qr >= 28 ? "6.5pt" : "5.5pt";

  return createPortal(
    <div className="print-sheet">
      <style>{PRINT_CSS}</style>
      <div className="print-header">
        <div className="print-title">Luggage Room: Item QR Labels</div>
        <div className="print-sub">
          {items.length} {items.length === 1 ? "item" : "items"} • Drop-off {batchId} • {date}
        </div>
        <div className="print-sub">
          Cut along the dashed lines and attach one label to each item.
        </div>
      </div>

      <div
        className="print-grid"
        style={{
          gridTemplateColumns: `repeat(${cols}, ${cellW}mm)`,
          gridAutoRows: `${cellH}mm`,
          gap: `${gap}mm`,
        }}
      >
        {items.map((item) => (
          <div key={item.id} className="print-cell">
            <div className="print-qr">
              <QRCodeSVG
                value={item.id}
                size={256}
                style={{ width: `${qr}mm`, height: `${qr}mm` }}
              />
            </div>
            <div className="print-name" style={{ fontSize: nameSize }}>
              {item.name}
            </div>
            <div className="print-meta" style={{ fontSize: metaSize }}>
              {item.category} • {item.id}
            </div>
          </div>
        ))}
      </div>
    </div>,
    document.body
  );
}

/* ---------- Page ---------- */

export default function RegisterItem() {
  const navigate = useNavigate();
  const { addItems, replaceBatch } = useBelongings();

  const [items, setItems] = useState([emptyItem()]);
  const [registered, setRegistered] = useState(null);
  const [editingBatchId, setEditingBatchId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const updateItem = (key, field, value) => {
    setItems((prev) =>
      prev.map((it) => (it.key === key ? { ...it, [field]: value } : it))
    );
  };

  // Adds the chosen photos to an item, never going over MAX_PHOTOS
  const addPhotos = (key, e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = ""; // lets the same photo be picked again later
    if (!files.length) return;

    const current = items.find((it) => it.key === key);
    const room = MAX_PHOTOS - current.photos.length;
    const added = files.slice(0, room).map((file) => ({
      id: Math.random().toString(16).slice(2),
      file,
      preview: URL.createObjectURL(file),
    }));

    setItems((prev) =>
      prev.map((it) =>
        it.key === key ? { ...it, photos: [...it.photos, ...added] } : it
      )
    );
  };

  const removePhoto = (key, photoId) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.key !== key) return it;
        const target = it.photos.find((p) => p.id === photoId);
        if (target && target.preview.startsWith("blob:")) {
          URL.revokeObjectURL(target.preview);
        }
        return { ...it, photos: it.photos.filter((p) => p.id !== photoId) };
      })
    );
  };

  const addItem = () => setItems((prev) => [...prev, emptyItem()]);

  const removeItem = (key) =>
    setItems((prev) => (prev.length > 1 ? prev.filter((it) => it.key !== key) : prev));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const batchId = generateBatchId();
      const date = new Date().toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });

      const savedItems = await Promise.all(
        items.map(async (it, index) => {
          // new photos get converted, photos already saved (when editing) are reused
          const photos = await Promise.all(
            it.photos.map((p) => (p.file ? fileToDataUrl(p.file) : p.preview))
          );
          return {
            id: `${batchId}-${index + 1}`, // this is the value inside the item's own QR code
            batchId,
            name: it.itemName,
            category: it.category,
            description: it.description,
            photos,
            photo: photos[0] || null, // first photo, kept for older code that reads one photo
            status: "Pending Verification",
            date,
          };
        })
      );

      // TODO: connect to Tandin's belongings-registration API endpoint here, sending
      // savedItems and receiving back the real item IDs the backend generated.
      if (editingBatchId) {
        replaceBatch(editingBatchId, savedItems);
      } else {
        addItems(savedItems);
      }

      setEditingBatchId(null);
      setRegistered({ batchId, date, items: savedItems });
    } catch {
      setError("One of the photos could not be processed. Please remove it and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = () => {
    // Reopen the form with this drop-off's details. The old drop-off stays saved
    // until the student resubmits, then it is replaced by the new one.
    setEditingBatchId(registered.batchId);
    setItems(
      registered.items.map((it) => ({
        key: Math.random().toString(16).slice(2),
        itemName: it.name,
        category: it.category,
        description: it.description,
        photos: (it.photos || (it.photo ? [it.photo] : [])).map((src) => ({
          id: Math.random().toString(16).slice(2),
          file: null,
          preview: src,
        })),
      }))
    );
    setRegistered(null);
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
                      {editingBatchId
                        ? "You're editing a drop-off. Resubmitting will replace it and generate new QR codes."
                        : "Add details and up to 4 photos for each item you're storing. Every item gets its own QR code, and all of them print together on one A4 sheet."}
                    </p>
                  </div>

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
                              className="w-full rounded-xl border border-line bg-field px-4 py-3 text-sm text-heading outline-none placeholder:text-muted focus:border-blue-400"
                            />
                          </div>

                          <div>
                            <label className="mb-1 block text-sm font-medium text-body">
                              Category
                            </label>
                            <select
                              value={item.category}
                              onChange={(e) => updateItem(item.key, "category", e.target.value)}
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
                                  key={c}
                                  value={c}
                                  className="bg-white text-slate-900 dark:bg-slate-800 dark:text-white"
                                >
                                  {c}
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

                          {/* Photos: up to 4 per item */}
                          <div>
                            <div className="mb-1 flex items-center justify-between">
                              <label className="text-sm font-medium text-body">Photos</label>
                              <span className="text-xs text-muted">
                                {item.photos.length}/{MAX_PHOTOS}
                              </span>
                            </div>
                            <p className="mb-3 text-xs text-muted">
                              Add up to 4 photos from different angles so your item can be
                              identified.
                            </p>

                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                              {item.photos.map((photo, photoIndex) => (
                                <div
                                  key={photo.id}
                                  className="relative aspect-square overflow-hidden rounded-xl border border-line"
                                >
                                  <img
                                    src={photo.preview}
                                    alt={`Photo ${photoIndex + 1}`}
                                    className="h-full w-full object-cover"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => removePhoto(item.key, photo.id)}
                                    className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
                                    aria-label={`Remove photo ${photoIndex + 1}`}
                                  >
                                    <X className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              ))}

                              {item.photos.length < MAX_PHOTOS && (
                                <label
                                  htmlFor={`photos-${item.key}`}
                                  className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-muted/40 bg-field text-center hover:border-blue-400"
                                >
                                  <Camera className="h-6 w-6 text-accent" />
                                  <span className="text-xs text-body">Add photo</span>
                                </label>
                              )}
                            </div>

                            <input
                              id={`photos-${item.key}`}
                              type="file"
                              accept="image/*"
                              multiple
                              onChange={(e) => addPhotos(item.key, e)}
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

                    {error && (
                      <p className="rounded-xl bg-red-500/15 px-4 py-3 text-sm text-red-600 dark:text-red-300">
                        {error}
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full rounded-xl bg-blue-500 py-3 text-sm font-medium text-white shadow-md transition-colors hover:bg-blue-600 disabled:opacity-60"
                    >
                      {submitting
                        ? "Saving..."
                        : `Register ${items.length > 1 ? `${items.length} Items` : "Item"}`}
                    </button>
                  </form>
                </div>
              </>
            ) : (
              <div className="mx-auto max-w-2xl rounded-2xl border border-line bg-panel p-6 text-center shadow-md backdrop-blur-md sm:p-8">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20">
                  <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-300" />
                </div>
                <h2 className="mt-4 text-lg font-semibold text-heading">
                  {registered.items.length > 1
                    ? `${registered.items.length} Items Registered!`
                    : "Item Registered!"}
                </h2>
                <p className="mt-1 text-sm text-body">
                  Each item has its own QR code. Print them all on one A4 sheet, cut them out,
                  and attach one to each item.
                </p>

                {/* One QR code per item */}
                <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
                  {registered.items.map((item) => (
                    <div key={item.id} className="rounded-xl bg-field p-3">
                      <div className="mx-auto w-fit rounded-lg bg-white p-2">
                        <QRCodeSVG value={item.id} size={112} />
                      </div>
                      <p className="mt-2 truncate text-sm font-medium text-heading">
                        {item.name}
                      </p>
                      <p className="truncate text-xs text-muted">{item.category}</p>
                      <p className="truncate text-[10px] text-muted">{item.id}</p>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => window.print()}
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-500 py-3 text-sm font-medium text-white shadow-md transition-colors hover:bg-blue-600"
                >
                  <Printer className="h-4 w-4" />
                  Print A4 QR Sheet
                </button>
                <p className="mt-2 text-xs text-muted">
                  In the print window choose paper size A4 and scale 100%. You can also choose
                  "Save as PDF" to keep a copy.
                </p>

                <button
                  onClick={handleEdit}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-line py-2.5 text-sm font-medium text-accent transition-colors hover:bg-hover"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Edit Items
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

      {registered && (
        <PrintSheet
          batchId={registered.batchId}
          items={registered.items}
          date={registered.date}
        />
      )}
    </div>
  );
}