import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import QRScanner from "../components/QRScanner";

const card =
  "rounded-[20px] border border-white/10 bg-[rgba(20,26,40,0.72)] shadow-[0_8px_24px_rgba(0,0,0,0.25)] backdrop-blur-xl";

function ScanQR() {
  const navigate = useNavigate();
  const [scannedCode, setScannedCode] = useState("");

  const handleScan = (code) => {
    setScannedCode(code);
  };

  // Go to verification a moment after a successful scan.
  // The cleanup stops the redirect if the operator leaves the page first.
  useEffect(() => {
    if (!scannedCode) return;

    const timer = setTimeout(() => {
      navigate("/operator/verification");
    }, 1000);

    return () => clearTimeout(timer);
  }, [scannedCode, navigate]);

  const steps = [
    "Ask the student to show their QR code.",
    "Allow camera access if your browser asks.",
    "Hold the code inside the frame until it scans.",
    "Check the details that open on the next page.",
  ];

  return (
    <div className="min-h-screen">
      <Sidebar />

      <main className="ml-64 min-h-screen">
        <Navbar title="Scan QR Code" />

        <div className="grid gap-6 p-8 lg:grid-cols-[1.4fr_1fr]">
          {/* LEFT: scanner */}
          <div className="space-y-6">
            <section className={`${card} p-6`}>
              <div className="mb-5 flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white">
                  <svg
                    viewBox="0 0 24 24"
                    className="h-6 w-6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3M4 12h16" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-2xl font-semibold text-white">
                    Scan a QR code
                  </h1>
                  <p className="text-[15px] text-slate-400">
                    Scan the code on a student's bag to open its details.
                  </p>
                </div>
              </div>

              <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/30 p-3">
                <QRScanner onScan={handleScan} />
              </div>
            </section>

            {/* RESULT */}
            <div aria-live="polite">
              {scannedCode && (
                <div className="rounded-[20px] border border-emerald-400/30 bg-emerald-500/10 p-5 backdrop-blur-xl">
                  <p className="text-lg font-semibold text-emerald-300">
                    Code scanned
                  </p>
                  <p className="mt-1 break-all text-sm text-slate-200">
                    {scannedCode}
                  </p>
                  <p className="mt-3 text-sm text-slate-400">
                    Opening the verification page...
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: how to scan */}
          <section className={`${card} h-fit p-6`}>
            <h2 className="text-xl font-semibold text-white">How to scan</h2>

            <ol className="mt-5 space-y-4">
              {steps.map((step, index) => (
                <li key={step} className="flex items-start gap-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600/20 text-sm font-semibold text-blue-300">
                    {index + 1}
                  </span>
                  <span className="pt-1 text-slate-300">{step}</span>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </main>
    </div>
  );
}

export default ScanQR;