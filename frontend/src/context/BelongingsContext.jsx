import React, { createContext, useContext, useEffect, useState } from "react";

const BelongingsContext = createContext(null);
const STORAGE_KEY = "luggage-room-belongings";

export function BelongingsProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      console.warn("Could not save belongings, browser storage may be full.");
    }
  }, [items]);

  // Add a new drop-off (one or more items sharing a batch QR)
  const addItems = (newItems) => setItems((prev) => [...newItems, ...prev]);

  // Replace an earlier drop-off after the student edits it
  const replaceBatch = (oldBatchId, newItems) =>
    setItems((prev) => [
      ...newItems,
      ...prev.filter((item) => item.batchId !== oldBatchId),
    ]);

  return (
    <BelongingsContext.Provider value={{ items, addItems, replaceBatch }}>
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