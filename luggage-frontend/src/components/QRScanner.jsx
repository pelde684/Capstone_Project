import { useEffect } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";

function QRScanner({ onScan }) {

  useEffect(() => {

    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      {
        fps: 10,
        qrbox: {
          width: 250,
          height: 250,
        },
      },
      false
    );

    scanner.render(
      (decodedText) => {
        onScan(decodedText);
        scanner.clear().catch(() => {});
      },
      () => {}
    );

    return () => {
      scanner.clear().catch(() => {});
    };

  }, [onScan]);

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">

      <h3 className="text-lg font-semibold mb-4">
        Scan Luggage QR Code
      </h3>

      <div
        id="qr-reader"
        className="max-w-md mx-auto"
      />

      <p className="text-center text-sm text-slate-500 mt-4">
        Place the QR code inside the scanning area.
      </p>

    </div>
  );
}

export default QRScanner;