import React from "react";
import { Link } from "react-router-dom";
import { Bell } from "lucide-react";
import { useBelongings } from "../context/BelongingsContext";

// Works like the bell on the staff site: the red number shows how many of the student's items
// are still waiting to be checked in by an operator, and clicking it opens My Belongings.
export default function NotificationBell() {
  const { items } = useBelongings();
  const pending = items.filter((i) => i.status === "Pending Verification").length;
  const label = pending
    ? `${pending} item${pending === 1 ? "" : "s"} waiting for verification`
    : "No items waiting for verification";

  return (
    <Link
      to="/belongings"
      className="relative text-accent transition-transform duration-200 hover:-rotate-12 hover:scale-110"
      aria-label={label}
      title={label}
    >
      <Bell className="h-5 w-5" />
      {pending > 0 && (
        <span className="absolute -right-2 -top-2 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
          {pending}
        </span>
      )}
    </Link>
  );
}
