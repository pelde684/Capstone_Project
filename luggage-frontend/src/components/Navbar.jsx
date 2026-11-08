import { Bell, UserCircle, ChevronDown } from "lucide-react";

function Navbar({ title, name = "Operator One", role = "Operator" }) {
  return (
    <header className="flex h-[90px] items-center justify-between border-b border-white/10 bg-[rgba(12,18,32,0.82)] px-10 backdrop-blur-xl">
      {/* LEFT SIDE */}
      <div>
        <h2 className="text-2xl font-semibold text-white">{title}</h2>
        <p className="mt-0.5 text-[15px] text-slate-400">
          QR Luggage Room Management System
        </p>
      </div>

      {/* RIGHT SIDE */}
      <div className="flex items-center gap-5">
        {/* NOTIFICATION */}
        <button
          type="button"
          aria-label="Notifications"
          className="text-slate-300 transition hover:text-white"
        >
          <Bell size={22} />
        </button>

        {/* PROFILE */}
        <div className="flex items-center gap-3">
          <UserCircle size={40} strokeWidth={1.5} className="text-slate-300" />

          <div>
            <p className="text-[15px] font-semibold leading-tight text-white">
              {name}
            </p>
            <p className="text-[13px] text-slate-400">
              {role}, CST Luggage Room
            </p>
          </div>

          <ChevronDown size={18} className="text-slate-400" />
        </div>
      </div>
    </header>
  );
}

export default Navbar;