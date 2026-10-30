import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LayoutGrid,
  Boxes,
  ClipboardList,
  MessageSquare,
  LogOut,
  Briefcase,
  Menu,
  X,
} from "lucide-react";
import ThemeToggle from "./ThemeToggle";

const navItems = [
  { label: "Dashboard", icon: LayoutGrid, path: "/dashboard" },
  { label: "Register Item", icon: ClipboardList, path: "/register" },
  { label: "My Belongings", icon: Boxes, path: "/belongings" },
  { label: "Feedback", icon: MessageSquare, path: "/feedback" },
];

export default function Sidebar({ activePath }) {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNavigate = (path) => {
    navigate(path);
    setMobileOpen(false);
  };

  const handleLogout = () => {
    // TODO: once Tandin's auth is ready, also clear the saved login token/session here
    setMobileOpen(false);
    navigate("/");
  };

  return (
    <>
      {/* Mobile top bar, only visible below the md breakpoint */}
      <div className="flex items-center justify-between border-b border-line bg-sidebar px-4 py-3 backdrop-blur-md md:hidden">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500">
            <Briefcase className="h-4 w-4 text-white" />
          </div>
          <p className="text-sm font-semibold text-heading">Luggage Room</p>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle iconOnly />
          <button
            onClick={() => setMobileOpen(true)}
            className="text-body hover:text-heading"
            aria-label="Open menu"
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* Mobile overlay + slide-in sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
          ></div>
          <aside className="relative flex h-full w-64 flex-col justify-between bg-drawer text-body backdrop-blur-md">
            <SidebarContent
              activePath={activePath}
              onNavigate={handleNavigate}
              onLogout={handleLogout}
              onClose={() => setMobileOpen(false)}
              showClose
            />
          </aside>
        </div>
      )}

      {/* Desktop sidebar, always visible at md and up */}
      <aside className="hidden w-64 flex-col justify-between border-r border-line bg-sidebar text-body backdrop-blur-md md:flex">
        <SidebarContent
          activePath={activePath}
          onNavigate={handleNavigate}
          onLogout={handleLogout}
        />
      </aside>
    </>
  );
}

function SidebarContent({ activePath, onNavigate, onLogout, onClose, showClose }) {
  return (
    <>
      <div>
        <div className="flex items-center justify-between px-5 py-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500 shadow-sm">
              <Briefcase className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold leading-tight text-heading">Luggage Room</p>
              <p className="text-xs leading-tight text-muted">Management System</p>
            </div>
          </div>
          {showClose && (
            <button
              onClick={onClose}
              className="text-muted hover:text-heading"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        <p className="px-5 pb-2 pt-4 text-xs font-medium tracking-wide text-accent">
          STUDENT
        </p>
        <nav className="flex flex-col gap-1 px-3">
          {navItems.map(({ label, icon: Icon, path }) => (
            <button
              key={label}
              onClick={() => onNavigate(path)}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                activePath === path
                  ? "bg-blue-500 text-white"
                  : "text-body hover:bg-hover"
              }`}
            >
              <Icon className="h-4.5 w-4.5" />
              {label}
            </button>
          ))}
        </nav>
      </div>

      <div>
        <div className="px-4 pb-1">
          <ThemeToggle className="w-full" />
        </div>
        <button
          onClick={onLogout}
          className="flex items-center gap-3 px-6 py-5 text-sm font-medium text-body hover:text-heading"
        >
          <LogOut className="h-4.5 w-4.5" />
          Logout
        </button>
      </div>
    </>
  );
}