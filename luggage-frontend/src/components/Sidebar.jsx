import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  QrCode,
  ShieldCheck,
  HandCoins,
  Users,
  FileText,
  LogOut,
  Luggage,
  Sun,
  Moon,
} from "lucide-react";

function Sidebar({ role = "operator" }) {
  const navigate = useNavigate();

  // Theme: saved in localStorage and applied to <html data-theme="...">
  const [isDark, setIsDark] = useState(
    () => localStorage.getItem("theme") !== "light"
  );

  useEffect(() => {
    const theme = isDark ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", theme);
    document.documentElement.classList.toggle("dark", isDark);
    localStorage.setItem("theme", theme);
  }, [isDark]);

  const toggleTheme = () => setIsDark((d) => !d);

  const operatorLinks = [
    { name: "Dashboard", path: "/operator/dashboard", icon: LayoutDashboard },
    { name: "Scan QR", path: "/operator/scan", icon: QrCode },
    { name: "Verification", path: "/operator/verification", icon: ShieldCheck },
    { name: "Handover", path: "/operator/handover", icon: HandCoins },
    { name: "Report", path: "/operator/report", icon: FileText },
  ];

  const adminLinks = [
    { name: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard },
    { name: "Students", path: "/admin/students", icon: Users },
    { name: "Reports", path: "/admin/reports", icon: FileText },
  ];

  const links = role === "admin" ? adminLinks : operatorLinks;

  const logout = () => {
    navigate("/login");
  };

  return (
    <aside className="fixed left-0 top-0 z-20 flex h-screen w-64 flex-col border-r border-white/10 bg-[rgba(12,18,32,0.82)] px-3 py-5 text-white backdrop-blur-xl">
      {/* Logo */}
      <div className="flex items-center gap-3 px-2 pb-6">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600">
          <Luggage size={22} />
        </div>
        <div>
          <h1 className="text-base font-semibold leading-tight">
            Luggage Room
          </h1>
          <p className="text-[13px] text-slate-400">Management System</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1">
        <p className="px-3 pb-2 pt-1 text-[13px] font-semibold uppercase text-slate-400">
          {role === "admin" ? "Administration" : "Operator"}
        </p>

        {links.map((link) => {
          const Icon = link.icon;

          return (
            <NavLink
              key={link.path}
              to={link.path}
              className={({ isActive }) =>
                `flex items-center gap-3.5 rounded-xl px-4 py-3 font-medium transition ${
                  isActive
                    ? "bg-blue-600 text-white"
                    : "text-slate-200 hover:bg-white/10"
                }`
              }
            >
              <Icon size={20} />
              <span>{link.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Theme + Logout */}
      <div>
        <button
          type="button"
          onClick={toggleTheme}
          className="mb-3 flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-[rgba(10,16,34,0.7)] px-4 py-3 text-[15px] font-medium text-white transition hover:bg-white/10"
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
          {isDark ? "Light mode" : "Dark mode"}
        </button>

        <button
          type="button"
          onClick={logout}
          className="flex w-full items-center gap-3.5 rounded-xl px-4 py-3 font-medium text-slate-200 transition hover:bg-white/10"
        >
          <LogOut size={20} />
          Logout
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;