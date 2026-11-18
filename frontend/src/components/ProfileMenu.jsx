import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { UserCircle2, ChevronDown, LogOut } from "lucide-react";
import { clearSession, getUser } from "../api";
import { useBelongings } from "../context/BelongingsContext";

// Profile button for the top bar. Click it to open a small menu with "Log out".
// The menu is drawn on top of the page (a portal), so no other element can cover it.
export default function ProfileMenu() {
  const user = getUser();
  const navigate = useNavigate();
  const { clear } = useBelongings();
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, right: 8 });
  const buttonRef = useRef(null);
  const menuRef = useRef(null);

  // put the menu just under the button, aligned to its right edge
  const place = () => {
    if (!buttonRef.current) return;
    const r = buttonRef.current.getBoundingClientRect();
    setPos({ top: r.bottom + 8, right: Math.max(8, window.innerWidth - r.right) });
  };

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    const onPointerDown = (e) => {
      if (buttonRef.current?.contains(e.target) || menuRef.current?.contains(e.target)) return;
      close();
    };
    const onKey = (e) => e.key === "Escape" && close();
    // Scrolling or a phone's address bar sliding in and out must not close the menu,
    // so the menu just follows the button instead.
    const onMove = () => place();
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", onMove);
    window.addEventListener("scroll", onMove, true);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onMove);
      window.removeEventListener("scroll", onMove, true);
    };
  }, [open]);

  const toggle = () => {
    if (!open) place();
    setOpen((o) => !o);
  };

  const logout = () => {
    clearSession(); // forget the login token
    try { clear(); } catch { /* items on screen are reset by the next page load anyway */ }
    setOpen(false);
    navigate("/", { replace: true });
  };

  const name = user?.name || "Student";
  const id = user?.studentId || "CST Luggage Room";

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={toggle}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-xl px-2 py-1 text-left transition-colors hover:bg-hover"
      >
        <UserCircle2 className="h-8 w-8 text-accent" />
        <div className="leading-tight">
          <p className="text-sm font-semibold text-heading">{name}</p>
          <p className="text-xs text-body">{id}</p>
        </div>
        <ChevronDown className={`h-4 w-4 text-muted transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            style={{ position: "fixed", top: pos.top, right: pos.right, zIndex: 1000 }}
            className="w-56 rounded-xl border border-line bg-drawer p-1 shadow-lg"
          >
            <div className="px-3 py-2">
              <p className="truncate text-sm font-semibold text-heading">{name}</p>
              <p className="truncate text-xs text-body">{id}</p>
            </div>
            <div className="my-1 h-px bg-line" />
            <button
              type="button"
              role="menuitem"
              onClick={logout}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-hover dark:text-red-300"
            >
              <LogOut className="h-4 w-4" />
              Log out
            </button>
          </div>,
          document.body
        )}
    </>
  );
}