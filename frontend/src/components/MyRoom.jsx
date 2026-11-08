import React, { useEffect, useState } from "react";
import { Package } from "lucide-react";
import { api } from "../api";

// Shows the storage room the admin allocated to the student's department (e.g. SWE -> HF 210),
// so the student knows where to bring their items.
export default function MyRoom() {
  const [me, setMe] = useState(null);

  useEffect(() => {
    api("/auth/me").then((r) => setMe(r.user)).catch(() => {});
  }, []);

  if (!me) return null;

  let text;
  if (!me.department) text = "Your programme is not set. Ask the luggage room admin to add it to your account.";
  else if (!me.room) text = `No storage room has been allocated to ${me.department} yet. Ask the luggage room admin.`;

  return (
    <div className="mb-5 flex items-center gap-4 rounded-2xl border border-line bg-panel p-4 shadow-md backdrop-blur-md sm:p-5">
      <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-blue-500/15">
        <Package className="h-5 w-5 text-accent" />
      </div>
      {text ? (
        <p className="text-sm text-body">{text}</p>
      ) : (
        <div>
          <p className="text-xs text-body">Your storage room</p>
          <p className="text-lg font-semibold text-heading">{me.room}</p>
          <p className="text-xs text-muted">Storage room for {me.department} - bring your items here for drop-off</p>
        </div>
      )}
    </div>
  );
}
