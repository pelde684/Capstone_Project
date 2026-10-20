import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Briefcase, User, Lock, ArrowRight } from "lucide-react";
import loginBg from "../assets/college.jpeg";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    navigate("/dashboard");
  };

  return (
    <div
      className="relative flex min-h-screen items-center justify-center px-4"
      style={{
        backgroundImage: `url(${loginBg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* CHANGE 1: darker overlay (was /30, now /60) */}
      <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-md"></div>

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-6 flex flex-col items-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500 shadow-lg">
            <Briefcase className="h-8 w-8 text-white" />
          </div>
          {/* CHANGE 2: heading text now white, not dark */}
          <h1 className="text-2xl font-semibold text-white">Luggage Room</h1>
          <p className="text-sm text-slate-300">QR Management System</p>
        </div>

        {/* CHANGE 3: card background is now dark translucent navy, not white */}
        <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-8 shadow-xl backdrop-blur-md">
          <h2 className="text-xl font-semibold text-white">Welcome Back</h2>
          <p className="mt-1 text-sm text-slate-300">Login to access the system</p>

          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            <div>
              {/* CHANGE 4: labels now light gray, not dark slate */}
              <label className="mb-1 block text-sm font-medium text-slate-200">
                Student ID
              </label>
              {/* CHANGE 5: input background now dark translucent, not light blue */}
              <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-slate-800/60 px-3 py-3">
                <User className="h-4 w-4 text-blue-300" />
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="02250123"
                  className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-400"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-200">
                Password
              </label>
              <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-slate-800/60 px-3 py-3">
                <Lock className="h-4 w-4 text-blue-300" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-400"
                />
              </div>
            </div>

            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-500 py-3 text-sm font-medium text-white shadow-md hover:bg-blue-600 transition-colors"
            >
              Login <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          <div className="mt-5 text-xs">
            <p className="font-medium text-blue-300 underline">Demo Login</p>
            <p className="mt-1 text-slate-300">Use any Student ID for Student access.</p>
          </div>
        </div>
      </div>
    </div>
  );
}