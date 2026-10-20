import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import QRScanner from "../components/QRScanner";

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
        <Navbar title="Scan QR Code" />

        <div className="mx-auto max-w-4xl p-8">
          {/* HEADER */}
          <header className="mb-8">
            <h1 className="font-display text-4xl font-bold tracking-tight text-white">
              Scan a QR code
            </h1>
            <p className="mt-2 text-lg text-slate-300">
              Scan the code on a student's bag to open its details.
            </p>
          </header>

          {/* SCANNER */}
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-950/85 p-4 backdrop-blur-md">
            <QRScanner onScan={handleScan} />
          </div>

          {/* RESULT */}
          <div aria-live="polite">
            {scannedCode && (
              <div className="mt-6 rounded-2xl border border-emerald-400/30 bg-emerald-950/60 p-5 backdrop-blur-md">
                <p className="font-display text-lg font-bold text-emerald-300">
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

          {/* HOW TO SCAN */}
          <section className="mt-8 rounded-2xl border border-white/10 bg-slate-950/85 p-6 backdrop-blur-md">
            <h2 className="font-display text-xl font-bold text-white">
              How to scan
            </h2>

            <ol className="mt-5 space-y-4">
              {steps.map((step, index) => (
                <li key={step} className="flex items-start gap-4">
                  <span className="font-display flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/20 text-sm font-bold text-slate-200">
                    {index + 1}
                  </span>
                  <span className="pt-0.5 text-slate-300">{step}</span>
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