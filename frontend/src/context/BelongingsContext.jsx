import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api, getToken } from "../api";
import { flattenDropOffs } from "../utils/belongings";

const BelongingsContext = createContext(null);

// Holds the logged-in student's drop-offs, loaded from the backend.
// `items` is the same flat list the pages already use (name, category, photo, status, date ...).
export function BelongingsProvider({ children }) {
  const [dropOffs, setDropOffs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    if (!getToken()) {
      setDropOffs([]);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const result = await api("/drop-offs/mine");
      setDropOffs(result.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const clear = useCallback(() => setDropOffs([]), []);

  // load on first open / page refresh when already logged in
  useEffect(() => {
    reload();
  }, [reload]);

  const items = useMemo(() => flattenDropOffs(dropOffs), [dropOffs]);

  return (
    <BelongingsContext.Provider value={{ items, dropOffs, loading, error, reload, clear }}>
      {children}
    </BelongingsContext.Provider>
  );
}

export function useBelongings() {
  const context = useContext(BelongingsContext);
  if (!context) {
    throw new Error("useBelongings must be used inside BelongingsProvider");
  }
  return context;
}
