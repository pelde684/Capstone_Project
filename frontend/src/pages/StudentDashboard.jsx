import React from "react";
import { useNavigate } from "react-router-dom";
import {
  ClipboardList,
  Boxes,
  Clock,
  CheckCircle2,
  PackageCheck,
  ChevronRight,
  Briefcase,
  MessageSquare,
  CalendarDays,
} from "lucide-react";
import Sidebar from "../components/Sidebar";
import NotificationBell from "../components/NotificationBell";
import MyRoom from "../components/MyRoom";
import MenuToggle from "../components/MenuToggle";
import ProfileMenu from "../components/ProfileMenu";
import { getUser } from "../api";
import { useBelongings } from "../context/BelongingsContext";

export default function StudentDashboard() {
  const navigate = useNavigate();
  const { items } = useBelongings();
  const user = getUser();

  // numbers come from the student's real items
  const count = (label) => items.filter((i) => i.status === label).length;
  const pending = count("Pending Verification");
  const stats = [
    { label: "My Items", value: items.length, icon: Briefcase },
    { label: "Pending Verification", value: pending, icon: Clock },
    { label: "Stored", value: count("Stored"), icon: PackageCheck },
    { label: "Returned", value: count("Returned"), icon: CheckCircle2 },
  ];

  // greeting banner, same idea as the staff dashboard
  const first = (user?.name || "").split(" ")[0] || "there";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const today = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
  const note =
    items.length === 0
      ? "You have not registered any items yet."
      : pending > 0
      ? `${pending} item${pending === 1 ? " is" : "s are"} waiting to be checked.`
      : "All your items are up to date.";

  return (
    <div className="min-h-screen bg-overlay">
      <div className="flex min-h-screen flex-col md:flex-row">
        <Sidebar activePath="/dashboard" />

        <div className="min-w-0 flex-1">
          <header className="flex flex-col gap-3 border-b border-line bg-bar px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8 sm:py-5">
            <div className="flex items-center gap-3">
              <MenuToggle />
              <div>
                <h1 className="text-lg font-semibold text-heading sm:text-xl">Student Dashboard</h1>
                <p className="text-xs text-body sm:text-sm">QR Luggage Room Management System</p>
              </div>
            </div>
            <div className="flex w-full items-center justify-between gap-5 sm:w-auto sm:justify-end">
              <NotificationBell />
              <ProfileMenu />
            </div>
          </header>

          <main className="space-y-5 px-4 py-5 sm:px-8 sm:py-6">
            {/* Deep teal greeting banner with white text */}
            <section className="relative overflow-hidden rounded-xl bg-blue-500 px-6 py-7 text-white sm:px-8">
              <span className="pointer-events-none absolute -right-12 -top-16 h-44 w-44 rounded-full bg-white/10" />
              <span className="pointer-events-none absolute -bottom-20 right-32 h-36 w-36 rounded-full bg-white/10" />
              <div className="relative flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="flex items-center gap-1.5 text-sm text-white/85">
                    <CalendarDays className="h-4 w-4" /> {today}
                  </p>
                  <h2 className="mt-1 text-2xl font-semibold sm:text-3xl">
                    {greeting}, {first}
                  </h2>
                  <p className="mt-1 text-sm text-white/90">{note}</p>
                </div>
                <div className="flex flex-wrap gap-2.5">
                  <button
                    onClick={() => navigate("/register")}
                    className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-blue-500 transition-transform hover:-translate-y-0.5"
                  >
                    <ClipboardList className="h-4 w-4" /> Register item
                  </button>
                  <button
                    onClick={() => navigate("/belongings")}
                    className="inline-flex items-center gap-2 rounded-lg border border-white/60 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/15"
                  >
                    <Boxes className="h-4 w-4" /> My belongings
                  </button>
                </div>
              </div>
            </section>

            <MyRoom />

            {/* The four numbers in one flat strip */}
            <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line lg:grid-cols-4">
              {stats.map(({ label, value, icon: Icon }) => (
                <div key={label} className="flex items-center justify-between bg-panel p-4 sm:p-5">
                  <div>
                    <p className="text-xs font-medium text-muted sm:text-sm">{label}</p>
                    <p className="mt-1 text-2xl font-bold text-heading sm:text-3xl">{value}</p>
                  </div>
                  <Icon className="h-5 w-5 text-amber-500 sm:h-6 sm:w-6" />
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-2">
              <div className="rounded-xl bg-blue-500 p-6 text-white sm:p-7">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15">
                  <ClipboardList className="h-5 w-5 text-amber-500" />
                </div>
                <h2 className="mt-4 text-lg font-semibold">Register Belongings</h2>
                <p className="mt-1 text-sm text-white/90">
                  Add your items and get one QR code for the whole drop-off.
                </p>
                <button
                  onClick={() => navigate("/register")}
                  className="mt-4 flex items-center gap-1 text-sm font-semibold text-white transition-all hover:gap-2"
                >
                  Register Item <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              <div className="rounded-xl border border-line bg-panel p-6 sm:p-7">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/15">
                  <Boxes className="h-5 w-5 text-amber-500" />
                </div>
                <h2 className="mt-4 text-lg font-semibold text-heading">My Belongings</h2>
                <p className="mt-1 text-sm text-muted">
                  View everything you've registered and its current status.
                </p>
                <button
                  onClick={() => navigate("/belongings")}
                  className="mt-4 flex items-center gap-1 text-sm font-semibold text-accent transition-all hover:gap-2"
                >
                  View Belongings <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              <div className="rounded-xl border border-line bg-panel p-6 sm:p-7 lg:col-span-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/15">
                  <MessageSquare className="h-5 w-5 text-amber-500" />
                </div>
                <h2 className="mt-4 text-lg font-semibold text-heading">Feedback &amp; Complaints</h2>
                <p className="mt-1 text-sm text-muted">
                  Found something wrong with the website, or have a suggestion? Let us know.
                </p>
                <button
                  onClick={() => navigate("/feedback")}
                  className="mt-4 flex items-center gap-1 text-sm font-semibold text-accent transition-all hover:gap-2"
                >
                  Send Feedback <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}