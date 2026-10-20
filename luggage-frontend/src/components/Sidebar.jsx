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
} from "lucide-react";

function Sidebar({ role = "operator" }) {
  const navigate = useNavigate();

  const operatorLinks = [
    {
      name: "Dashboard",
      path: "/operator/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "Scan QR",
      path: "/operator/scan",
      icon: QrCode,
    },
    {
      name: "Verification",
      path: "/operator/verification",
      icon: ShieldCheck,
    },
    {
      name: "Handover",
      path: "/operator/handover",
      icon: HandCoins,
    },
  ];

  const adminLinks = [
    {
      name: "Dashboard",
      path: "/admin/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "Students",
      path: "/admin/students",
      icon: Users,
    },
    {
      name: "Reports",
      path: "/admin/reports",
      icon: FileText,
    },
  ];

  const links = role === "admin" ? adminLinks : operatorLinks;

  const logout = () => {
    navigate("/login");
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-slate-900 text-white flex flex-col">

      {/* Logo */}
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Luggage size={24} />
          </div>

          <div>
            <h1 className="font-bold text-lg">
              Luggage Room
            </h1>

            <p className="text-xs text-slate-400">
              Management System
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">

        <p className="text-xs text-slate-500 uppercase px-3 py-2">
          {role === "admin" ? "Administration" : "Operator"}
        </p>

        {links.map((link) => {
          const Icon = link.icon;

          return (
            <NavLink
              key={link.path}
              to={link.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                  isActive
                    ? "bg-blue-600 text-white"
                    : "text-slate-300 hover:bg-slate-800"
                }`
              }
            >
              <Icon size={20} />
              <span>{link.name}</span>
            </NavLink>
          );
        })}

      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-slate-700">

        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-4 py-3 text-slate-300 hover:bg-red-600 rounded-lg transition"
        >
          <LogOut size={20} />
          Logout
        </button>

      </div>
    </aside>
  );
}

export default Sidebar;