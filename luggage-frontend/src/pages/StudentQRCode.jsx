import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

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

const DownloadIcon = (p) => (
  <Svg {...p}>
    <path d="M12 4v11M7 11l5 5 5-5M5 20h14" />
  </Svg>
);

/* ------------------------------------------------------------------ */
/*  QR-style picture. This is a visual placeholder, NOT a scannable    */
/*  code. For a real one, use a package such as `qrcode.react`.        */
/* ------------------------------------------------------------------ */
const GRID = 21;

function buildModules(seedText) {
  // Turn the ID into a number so every bag gets its own pattern
  let seed = 0;
  for (const char of String(seedText)) {
    seed = (seed * 31 + char.charCodeAt(0)) >>> 0;
  }

  const next = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };

  const inFinder = (x, y) =>
    (x < 8 && y < 8) || (x >= GRID - 8 && y < 8) || (x < 8 && y >= GRID - 8);

  const modules = [];
  for (let y = 0; y < GRID; y++) {
    for (let x = 0; x < GRID; x++) {
      if (!inFinder(x, y) && next() > 0.52) {
        modules.push([x, y]);
      }
    }
  }
  return modules;
}

function QrPicture({ value }) {
  const modules = useMemo(() => buildModules(value), [value]);

  const finders = [
    [0, 0],
    [GRID - 7, 0],
    [0, GRID - 7],
  ];

  return (
    <svg
      viewBox={`0 0 ${GRID} ${GRID}`}
      className="h-full w-full"
      shapeRendering="crispEdges"
      role="img"
      aria-label={`QR code for luggage ${value}`}
    >
      {modules.map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill="#0f172a" />
      ))}

      {finders.map(([x, y]) => (
        <g key={`${x}-${y}`}>
          <rect x={x} y={y} width="7" height="7" fill="#0f172a" />
          <rect x={x + 1} y={y + 1} width="5" height="5" fill="#ffffff" />
          <rect x={x + 2} y={y + 2} width="3" height="3" fill="#0f172a" />
        </g>
      ))}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */
export default function StudentQRCode() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [notice, setNotice] = useState("");

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
          onClick={() => navigate("/student/belongings")}
          className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-4 py-2 text-sm font-semibold text-slate-200 transition-colors hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300"
        >
          <BackIcon size={16} />
          Back to my belongings
        </button>
      </header>

      <main className="mx-auto max-w-lg p-4 sm:p-8">
        <section className="rounded-2xl border border-white/10 bg-slate-950/85 p-6 backdrop-blur-md sm:p-8">
          <h1 className="font-display text-3xl font-bold tracking-tight text-white">
            Your bag's QR code
          </h1>

          <p className="mt-2 text-slate-300">
            Show this code to the operator when you drop off or pick up your
            bag.
          </p>

          {/* QR on a white tile so it stays easy to scan */}
          <div className="mx-auto mt-8 aspect-square w-full max-w-[16rem] rounded-xl bg-white p-4">
            <QrPicture value={id} />
          </div>

          {/* LUGGAGE ID */}
          <div className="mt-6 flex items-baseline justify-between gap-4 rounded-xl border border-white/10 bg-white/5 px-5 py-4">
            <p className="text-sm text-slate-400">Luggage ID</p>
            <p className="font-display break-all text-right text-xl font-bold text-white">
              {id}
            </p>
          </div>

          {/* DOWNLOAD */}
          <button
            onClick={() => setNotice("Downloading will be available soon.")}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-white py-3 text-sm font-semibold text-slate-900 transition-colors hover:bg-slate-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300"
          >
            <DownloadIcon size={18} />
            Download QR code
          </button>

          <div aria-live="polite">
            {notice && (
              <p className="mt-4 text-center text-sm text-slate-400">
                {notice}
              </p>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}