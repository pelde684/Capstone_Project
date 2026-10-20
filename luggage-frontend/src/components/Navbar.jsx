import { Bell, UserCircle } from "lucide-react";

function Navbar({ title, role = "Operator" }) {
  return (
    <header className="h-20 bg-slate-900 border-b border-slate-700 flex items-center justify-between px-8">

      {/* LEFT SIDE */}
      <div>
        <h2 className="text-2xl font-bold text-white">
          {title}
        </h2>

        <p className="text-sm text-slate-300">
          QR Luggage Room Management System
        </p>
      </div>

      {/* RIGHT SIDE */}
      <div className="flex items-center gap-6">

        {/* NOTIFICATION */}
        <button
          className="relative text-slate-300 hover:text-white transition"
        >
          <Bell size={22} />

          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
            3
          </span>
        </button>

        {/* PROFILE */}
        <div className="flex items-center gap-3">

          <UserCircle
            size={38}
            className="text-blue-500"
          />

          <div>
            <p className="font-semibold text-sm text-white">
              {role}
            </p>

            <p className="text-xs text-slate-400">
              CST Luggage Room
            </p>
          </div>

        </div>

      </div>

    </header>
  );
}

export default Navbar;