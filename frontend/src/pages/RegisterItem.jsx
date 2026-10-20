import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";
import {
  Bell,
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
} from "lucide-react";
import Sidebar from "../components/Sidebar";
import { useBelongings } from "../context/BelongingsContext";
import loginBg from "../assets/college.jpeg";

const categories = ["Suitcase", "Backpack", "Box", "Bucket", "Mirror", "Other"];

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
    photo: null,
    photoPreview: null,
  };
}

// Shrinks a photo and turns it into a small image string that can be saved
function fileToDataUrl(file, maxSize = 800, quality = 0.7) {
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

export default function RegisterItem() {
  const navigate = useNavigate();
  const { addItems, replaceBatch } = useBelongings();

  const [items, setItems] = useState([emptyItem()]);
  const [registered, setRegistered] = useState(null);
  const [editingBatchId, setEditingBatchId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const updateItem = (key, field, value) => {
    setItems((prev) =>
      prev.map((it) => (it.key === key ? { ...it, [field]: value } : it))
    );
  };

  const handlePhotoChange = (key, e) => {
    const file = e.target.files[0];
    if (file) {
      updateItem(key, "photo", file);
      updateItem(key, "photoPreview", URL.createObjectURL(file));
    }
  };

  const addItem = () => setItems((prev) => [...prev, emptyItem()]);

  const removeItem = (key) =>
    setItems((prev) => (prev.length > 1 ? prev.filter((it) => it.key !== key) : prev));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const batchId = generateBatchId();
    const date = new Date().toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    const savedItems = await Promise.all(
      items.map(async (it, index) => ({
        id: `${batchId}-${index + 1}`,
        batchId,
        name: it.itemName,
        category: it.category,
        description: it.description,
        photo: it.photo ? await fileToDataUrl(it.photo) : it.photoPreview,
        status: "Pending Verification",
        date,
      }))
    );

    // TODO: connect to Tandin's belongings-registration API endpoint here, sending
    // savedItems and receiving back the real batch ID the backend generated.
    if (editingBatchId) {
      replaceBatch(editingBatchId, savedItems);
    } else {
      addItems(savedItems);
    }

    setEditingBatchId(null);
    setRegistered({ batchId, items: savedItems });
    setSubmitting(false);
  };

  const handleEdit = () => {
    setEditingBatchId(registered.batchId);
    setItems(
      registered.items.map((it) => ({
        key: Math.random().toString(16).slice(2),
        itemName: it.name,
        category: it.category,
        description: it.description,
        photo: null,
        photoPreview: it.photo,
      }))
    );
    setRegistered(null);
  };

  const handleDownload = () => {
    const canvas = document.getElementById("batch-qr-canvas");
    const url = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = url;
    link.download = `${registered.batchId}.png`;
    link.click();
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
                        ? "You're editing a drop-off. Resubmitting will replace it and generate a new QR code."
                        : "Add details for each item you're storing. All items in this submission will share one QR code for drop-off."}
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

                          <div>
                            <label className="mb-1 block text-sm font-medium text-body">
                              Photo
                            </label>
                            <label
                              htmlFor={`photo-upload-${item.key}`}
                              className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-muted/40 bg-field px-4 py-8 text-center hover:border-blue-400"
                            >
                              {item.photoPreview ? (
                                <img
                                  src={item.photoPreview}
                                  alt="Preview"
                                  className="h-32 w-32 rounded-lg object-cover"
                                />
                              ) : (
                                <>
                                  <Upload className="h-6 w-6 text-accent" />
                                  <p className="text-sm text-body">
                                    Click to upload a photo of your item
                                  </p>
                                  <p className="text-xs text-muted">PNG or JPG, up to 5MB</p>
                                </>
                              )}
                            </label>
                            <input
                              id={`photo-upload-${item.key}`}
                              type="file"
                              accept="image/*"
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
                  <QRCodeCanvas id="batch-qr-canvas" value={registered.batchId} size={180} />
                </div>
                <p className="mt-2 text-xs text-muted">{registered.batchId}</p>

                <div className="mt-5 space-y-2 text-left">
                  {registered.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 rounded-xl bg-field p-3"
                    >
                      {item.photo ? (
                        <img
                          src={item.photo}
                          alt={item.name}
                          className="h-10 w-10 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/15">
                          <Package className="h-5 w-5 text-accent" />
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-heading">{item.name}</p>
                        <p className="text-xs text-muted">{item.category}</p>
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
                  Print this QR code and attach it to your belongings, or show it on your
                  phone at drop-off for the operator to scan.
                </p>

                <button
                  onClick={handleDownload}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-500 py-3 text-sm font-medium text-white shadow-md transition-colors hover:bg-blue-600"
                >
                  <Download className="h-4 w-4" />
                  Download QR Code
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