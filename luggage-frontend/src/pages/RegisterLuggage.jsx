import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

/* ------------------------------------------------------------------ */
/*  Icons (plain SVG, no extra package needed)                         */
/* ------------------------------------------------------------------ */
function Svg({ size = 18, className = "", children }) {
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

const BackIcon = (p) => (
  <Svg {...p}>
    <path d="M19 12H5M11 6l-6 6 6 6" />
  </Svg>
);

const UploadIcon = (p) => (
  <Svg {...p}>
    <path d="M12 16V5M7 9l5-5 5 5M5 20h14" />
  </Svg>
);

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */
const requiredFields = [
  { name: "itemName", label: "item name" },
  { name: "color", label: "color" },
  { name: "description", label: "description" },
];

export default function RegisterLuggage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    itemName: "",
    description: "",
    color: "",
    category: "",
  });

  const [photo, setPhoto] = useState(null);
  const [photoUrl, setPhotoUrl] = useState("");
  const [missing, setMissing] = useState([]);
  const [registered, setRegistered] = useState(false);

  // Preview of the chosen photo. The cleanup frees the memory it uses.
  useEffect(() => {
    if (!photo) {
      setPhotoUrl("");
      return;
    }

    const url = URL.createObjectURL(photo);
    setPhotoUrl(url);

    return () => URL.revokeObjectURL(url);
  }, [photo]);

  // Go to the belongings page a moment after registering.
  // The cleanup stops the redirect if the student leaves first.
  useEffect(() => {
    if (!registered) return;

    const timer = setTimeout(() => {
      navigate("/student/belongings");
    }, 1200);

    return () => clearTimeout(timer);
  }, [registered, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((current) => ({ ...current, [name]: value }));

    // Remove the red outline as soon as the student fixes a field
    setMissing((current) => current.filter((field) => field !== name));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const empty = requiredFields.filter((field) => !form[field.name].trim());

    if (empty.length > 0) {
      setMissing(empty.map((field) => field.name));
      return;
    }

    setMissing([]);
    setRegistered(true);
  };

  const missingLabels = requiredFields
    .filter((field) => missing.includes(field.name))
    .map((field) => field.label);

  const fieldClass = (name) =>
    `w-full rounded-lg border bg-slate-900/80 px-4 py-3 text-white placeholder-slate-500 outline-none transition-colors focus:ring-2 ${
      missing.includes(name)
        ? "border-red-400/70 focus:border-red-400 focus:ring-red-400/30"
        : "border-white/15 focus:border-sky-400/60 focus:ring-sky-400/30"
    }`;

  const labelClass = "mb-2 block text-sm font-medium text-slate-200";

  return (
    <div
      className="min-h-screen"
      style={{ fontFamily: "'Figtree', system-ui, sans-serif" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700;12..96,800&family=Figtree:wght@400;500;600&display=swap');

        .font-display { font-family: 'Bricolage Grotesque', 'Figtree', system-ui, sans-serif; }
      `}</style>

      {/* TOP BAR */}
      <header className="flex items-center justify-between border-b border-white/10 bg-slate-950/90 px-4 py-4 backdrop-blur-md sm:px-8">
        <p className="font-display text-xl font-bold text-white">Luggage Room</p>

        <button
          onClick={() => navigate("/student/dashboard")}
          className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-4 py-2 text-sm font-semibold text-slate-200 transition-colors hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300"
        >
          <BackIcon size={16} />
          Back to dashboard
        </button>
      </header>

      <main className="mx-auto max-w-3xl p-4 sm:p-8">
        <section className="rounded-2xl border border-white/10 bg-slate-950/85 p-6 backdrop-blur-md sm:p-8">
          <header>
            <h1 className="font-display text-3xl font-bold tracking-tight text-white">
              Register new luggage
            </h1>

            <p className="mt-2 text-slate-300">
              Tell us about your bag so the operator can match it later.
            </p>
          </header>

          <form onSubmit={handleSubmit} className="mt-8 space-y-6" noValidate>
            {/* ITEM NAME */}
            <div>
              <label htmlFor="itemName" className={labelClass}>
                Item name <span className="text-slate-500">(required)</span>
              </label>

              <input
                id="itemName"
                type="text"
                name="itemName"
                placeholder="For example, Black Suitcase"
                value={form.itemName}
                onChange={handleChange}
                aria-invalid={missing.includes("itemName")}
                className={fieldClass("itemName")}
              />
            </div>

            {/* CATEGORY + COLOR SIDE BY SIDE */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="category" className={labelClass}>
                  Category
                </label>

                <select
                  id="category"
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  style={{ colorScheme: "dark" }}
                  className={fieldClass("category")}
                >
                  <option value="">Choose a category</option>
                  <option value="Suitcase">Suitcase</option>
                  <option value="Backpack">Backpack</option>
                  <option value="Bag">Bag</option>
                  <option value="Box">Box</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label htmlFor="color" className={labelClass}>
                  Color <span className="text-slate-500">(required)</span>
                </label>

                <input
                  id="color"
                  type="text"
                  name="color"
                  placeholder="For example, Black"
                  value={form.color}
                  onChange={handleChange}
                  aria-invalid={missing.includes("color")}
                  className={fieldClass("color")}
                />
              </div>
            </div>

            {/* DESCRIPTION */}
            <div>
              <label htmlFor="description" className={labelClass}>
                Description <span className="text-slate-500">(required)</span>
              </label>

              <textarea
                id="description"
                name="description"
                rows="4"
                placeholder="What is inside, and is there anything that makes it easy to spot?"
                value={form.description}
                onChange={handleChange}
                aria-invalid={missing.includes("description")}
                className={fieldClass("description")}
              />
            </div>

            {/* PHOTO */}
            <div>
              <p className={labelClass}>Photo of the bag</p>

              <label
                htmlFor="photo"
                className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-white/20 bg-white/5 p-8 text-center transition-colors focus-within:border-sky-400/60 hover:border-white/40 hover:bg-white/10"
              >
                {photoUrl ? (
                  <img
                    src={photoUrl}
                    alt="Preview of the chosen bag"
                    className="max-h-48 rounded-lg object-contain"
                  />
                ) : (
                  <UploadIcon size={30} className="text-slate-400" />
                )}

                <span className="mt-3 text-slate-300">
                  {photo ? photo.name : "Click to choose a photo"}
                </span>

                {photo && (
                  <span className="mt-1 text-sm text-slate-500">
                    Click again to choose a different one
                  </span>
                )}

                <input
                  id="photo"
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(e) => setPhoto(e.target.files[0] || null)}
                />
              </label>
            </div>

            {/* MESSAGES */}
            <div aria-live="polite">
              {missingLabels.length > 0 && (
                <p
                  role="alert"
                  className="rounded-lg border border-red-400/30 bg-red-950/60 px-4 py-3 text-sm text-red-200"
                >
                  Please fill in the {missingLabels.join(", ")} before
                  registering.
                </p>
              )}

              {registered && (
                <p className="rounded-lg border border-emerald-400/30 bg-emerald-950/60 px-4 py-3 text-sm text-emerald-300">
                  Luggage registered. Opening your belongings...
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={registered}
              className="w-full rounded-lg bg-white py-3 text-sm font-semibold text-slate-900 transition-colors hover:bg-slate-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Register luggage
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}