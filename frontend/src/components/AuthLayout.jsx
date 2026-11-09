import React from "react";
import { Briefcase } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import loginBg from "../assets/college.jpeg";

export default function AuthLayout({ title, subtitle, children }) {
  return (
    <div
      className="relative flex min-h-screen items-center justify-center px-4 py-8"
      style={{
        backgroundImage: `url(${loginBg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="absolute inset-0 bg-overlay backdrop-blur-[2px]"></div>

      <div className="absolute right-4 top-4 z-10">
        <ThemeToggle />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-6 flex flex-col items-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500 shadow-lg">
            <Briefcase className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-semibold text-heading">Luggage Room</h1>
          <p className="text-sm text-body">QR Management System</p>
        </div>

        <div className="rounded-2xl border border-line bg-panel p-8 shadow-xl backdrop-blur-md">
          <h2 className="text-xl font-semibold text-heading">{title}</h2>
          {subtitle && <p className="mt-1 text-sm text-body">{subtitle}</p>}
          {children}
        </div>
      </div>
    </div>
  );
}