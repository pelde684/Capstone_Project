import React from "react";
import { useNavigate } from "react-router-dom";
import {
  LayoutGrid,
  Boxes,
  ClipboardList,
  MessageSquare,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import Logo from "../public/Logo";
import { clearSession } from "../api";
import { useBelongings } from "../context/BelongingsContext";
import {
  useSidebarCollapsed,
  useSidebarDrawer,
  useHasMenuToggle,
} from "./useSidebarCollapsed";

const navItems = [
  { label: "Dashboard", icon: LayoutGrid, path: "/dashboard" },
  { label: "Register Item", icon: ClipboardList, path: "/register" },
  { label: "My Belongings", icon: Boxes, path: "/belongings" },
  { label: "Feedback", icon: MessageSquare, path: "/feedback" },
];

export default function Sidebar({ activePath }) {
  const navigate = useNavigate();
  const { clear } = useBelongings();
  const [collapsed] = useSidebarCollapsed(); // hidden with the menu button (bigger screens)
  const [drawerOpen, setDrawerOpen] = useSidebarDrawer(); // slid open (phones)
  const hasToggle = useHasMenuToggle(); // does the page header already have a menu button?

  const handleNavigate = (path) => {
    navigate(path);
    setDrawerOpen(false);
  };

  const handleLogout = () => {
    clearSession(); // forget the login token
    clear(); // forget this student's items on screen
    setDrawerOpen(false);
    navigate("/");
  };

  return (
    <>
      {/* Old mobile top bar: only on pages that do not have a menu button in their own header yet */}
      {!hasToggle && (
        <div className="flex items-center justify-between border-b border-line bg-sidebar px-4 py-3 md:hidden">
          <div className="flex items-center gap-2">
            <Logo variant="mark" size={32} />
            <p className="text-sm font-semibold text-heading">Luggage Room</p>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle iconOnly />
            <button
              onClick={() => setDrawerOpen(true)}
              className="text-body hover:text-heading"
              aria-label="Open menu"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      )}

      {/* Slide-in menu on phones and narrow windows */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setDrawerOpen(false)}
          ></div>
          <aside className="relative flex h-full w-72 max-w-[85vw] flex-col justify-between bg-drawer text-body">
            <SidebarContent
              activePath={activePath}
              onNavigate={handleNavigate}
              onLogout={handleLogout}
              onClose={() => setDrawerOpen(false)}
              showClose
            />
          </aside>
        </div>
      )}

      {/* Desktop sidebar: visible at md and up, unless hidden with the menu button.
          It stays fixed on the left while you scroll, like the staff site, so it is always
          right beside the page and the footer, with no gap under it. */}
      <aside
        className={`hidden w-64 flex-col justify-between border-r border-line bg-sidebar text-body ${
          collapsed ? "" : "md:fixed md:inset-y-0 md:left-0 md:z-30 md:flex md:overflow-y-auto"
        }`}
      >
        <SidebarContent
          activePath={activePath}
          onNavigate={handleNavigate}
          onLogout={handleLogout}
        />
      </aside>

      {/* keeps the room the fixed sidebar would have taken in the page layout */}
      {!collapsed && <div className="hidden w-64 shrink-0 md:block" aria-hidden="true" />}
    </>
  );
}

function SidebarContent({ activePath, onNavigate, onLogout, onClose, showClose }) {
  return (
    <>
      <div>
        <div className="flex items-center justify-between px-5 py-6">
          <div className="flex items-center gap-3">
            <Logo variant="mark" size={44} />
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