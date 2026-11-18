import React, { useEffect } from "react";
import { Menu } from "lucide-react";
import {
  useSidebarCollapsed,
  useSidebarDrawer,
  registerMenuToggle,
} from "./useSidebarCollapsed";

// The menu button in a page header, like the staff site:
//   bigger screens: hides or shows the side menu
//   phones and narrow windows: slides the menu in from the left
export default function MenuToggle() {
  const [collapsed, toggleCollapsed] = useSidebarCollapsed();
  const [, setDrawer] = useSidebarDrawer();

  // tells the Sidebar that this page has its own menu button
  useEffect(() => registerMenuToggle(), []);

  const onClick = () => (window.innerWidth >= 768 ? toggleCollapsed() : setDrawer(true));
  const label = collapsed ? "Show menu" : "Open or close menu";

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title="Menu"
      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-line bg-panel text-heading transition-colors hover:bg-hover"
    >
      <Menu className="h-5 w-5" />
    </button>
  );
}