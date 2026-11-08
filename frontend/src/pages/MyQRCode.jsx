import React from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Bell, UserCircle2, ChevronDown, Download } from "lucide-react";
import Sidebar from "../components/Sidebar";
import loginBg from "../assets/college.jpeg";

// TODO: replace with the real logged-in student's ID from Tandin's auth/session
const studentId = "02250123";
const studentName = "Kinley Tshering";
const qrValue = `STU-${studentId}`;

export default function MyQRCode() {
  const handleDownload = () => {
    const canvas = document.getElementById("student-qr-canvas");
    const url = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = url;
    link.download = `${studentId}-qr-code.png`;
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
      <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-md"></div>

      <div className="relative z-10 flex min-h-screen flex-col md:flex-row">
        <Sidebar activePath="/qr-code" />

        {/* Main content */}
        <div className="flex-1">
          {/* Header */}
          <header className="flex flex-col gap-3 border-b border-white/10 bg-slate-900/40 px-4 py-4 backdrop-blur-md sm:flex-row sm:items-center sm:justify-between sm:px-8 sm:py-5">
            <div>
              <h1 className="text-lg font-semibold text-white sm:text-xl">My QR Code</h1>
              <p className="text-xs text-slate-300 sm:text-sm">
                Show this at drop-off and pickup
              </p>
            </div>
            <div className="flex items-center gap-5">
              <button className="relative text-slate-300 hover:text-white">
                <Bell className="h-5 w-5" />
                <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-semibold text-white">
                  1
                </span>
              </button>
              <div className="flex items-center gap-2">
                <UserCircle2 className="h-8 w-8 text-blue-300" />
                <div className="leading-tight">
                  <p className="text-sm font-semibold text-white">Student</p>
                  <p className="text-xs text-slate-300">CST Luggage Room</p>
                </div>
                <ChevronDown className="h-4 w-4 text-slate-400" />
              </div>
            </div>
          </header>

          {/* Body */}
          <main className="flex justify-center px-4 py-8 sm:px-8 sm:py-10">
            <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-slate-900/60 p-6 text-center shadow-md backdrop-blur-md sm:p-8">
              <p className="text-sm font-medium text-blue-300">
                Your Unique QR Code
              </p>
              <h2 className="mt-1 text-lg font-semibold text-white">
                {studentName}
              </h2>
              <p className="text-xs text-slate-400">Student ID: {studentId}</p>

              <div className="mt-6 flex justify-center rounded-xl bg-white p-6">
                <QRCodeCanvas id="student-qr-canvas" value={qrValue} size={200} />
              </div>

              <p className="mt-5 text-xs text-slate-400">
                This QR code is linked to your account and stays valid for as long as you're
                enrolled. Show it to the operator at drop-off and pickup for verification.
              </p>

              <button
                onClick={handleDownload}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-500 py-3 text-sm font-medium text-white shadow-md hover:bg-blue-600 transition-colors"
              >
                <Download className="h-4 w-4" />
                Download QR Code
              </button>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}