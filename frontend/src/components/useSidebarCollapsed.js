import { useEffect, useState } from "react";

// Shared state for the side menu, so the menu button in a page header and the Sidebar
// stay in step on every page:
//   collapsed: the menu is hidden on bigger screens (remembered between visits)
//   drawer:    the menu is slid open on a phone or narrow window
//   toggles:   how many pages currently show a menu button in their header
const KEY = "luggage-room-sidebar-collapsed";

const read = () => {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
};

const state = { collapsed: read(), drawer: false, toggles: 0 };
const listeners = new Set();
const emit = () => listeners.forEach((fn) => fn());

// re-renders the component that calls it whenever the shared state changes
function useStore() {
  const [, setTick] = useState(0);
  useEffect(() => {
    const fn = () => setTick((n) => n + 1);
    listeners.add(fn);
    return () => listeners.delete(fn);
  }, []);
}

export function toggleCollapsed() {
  state.collapsed = !state.collapsed;
  try {
    localStorage.setItem(KEY, state.collapsed ? "1" : "0");
  } catch {
    /* not remembered, but it still works until the page is refreshed */
  }
  emit();
}

export function useSidebarCollapsed() {
  useStore();
  return [state.collapsed, toggleCollapsed];
}

export function useSidebarDrawer() {
  useStore();
  return [
    state.drawer,
    (open) => {
      state.drawer = open;
      emit();
    },
  ];
}

export function useHasMenuToggle() {
  useStore();
  return state.toggles > 0;
}

export function registerMenuToggle() {
  state.toggles += 1;
  emit();
  return () => {
    state.toggles -= 1;
    emit();
  };
}