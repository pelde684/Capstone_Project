import React from "react";
import { useNavigate } from "react-router-dom";
import {
  ClipboardList,
  Boxes,
  Bell,
  UserCircle2,
  Clock,
  CheckCircle2,
  PackageCheck,
  ChevronRight,
  ChevronDown,
  Briefcase,
  MessageSquare,
} from "lucide-react";
import Sidebar from "../components/Sidebar";
import { getUser } from "../api";
import { useBelongings } from "../context/BelongingsContext";
import loginBg from "../assets/college.jpeg";

export default function StudentDashboard() {
  const navigate = useNavigate();
  const { items } = useBelongings();
  const user = getUser();

  // numbers come from the student's real items
  const count = (label) => items.filter((i) => i.status === label).length;
  const stats = [
    { label: "My Items", value: items.length, icon: Briefcase },
    { label: "Pending Verification", value: count("Pending Verification"), icon: Clock },
    { label: "Stored", value: count("Stored"), icon: PackageCheck },
    { label: "Returned", value: count("Returned"), icon: CheckCircle2 },
  ];

  return (
    <div
      className="relative min-h-screen"
      style={{
        backgroundImage: `url(${loginBg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="absolute inset-0 bg-overlay backdrop-blur-[2px]"></div>

      <div className="relative z-10 flex min-h-screen flex-col md:flex-row">
        <Sidebar activePath="/dashboard" />

        <div className="flex-1">
          <header className="flex flex-col gap-3 border-b border-line bg-bar px-4 py-4 backdrop-blur-md sm:flex-row sm:items-center sm:justify-between sm:px-8 sm:py-5">
            <div>
              <h1 className="text-lg font-semibold text-heading sm:text-xl">Student Dashboard</h1>
              <p className="text-xs text-body sm:text-sm">QR Luggage Room Management System</p>
            </div>
            <div className="flex items-center gap-5">
              <button className="relative text-body hover:text-heading">
                <Bell className="h-5 w-5" />
              </button>
              <div className="flex items-center gap-2">
                <UserCircle2 className="h-8 w-8 text-accent" />
                <div className="leading-tight">
                  <p className="text-sm font-semibold text-heading">{user?.name || "Student"}</p>
                  <p className="text-xs text-body">{user?.studentId || "CST Luggage Room"}</p>
                </div>
                <ChevronDown className="h-4 w-4 text-muted" />
              </div>
            </div>
          </header>

          <main className="px-4 py-5 sm:px-8 sm:py-6">
            <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
              {stats.map(({ label, value, icon: Icon }) => (
                <div
                  key={label}
                  className="flex items-center justify-between rounded-2xl border border-line bg-panel p-4 shadow-md backdrop-blur-md sm:p-5"
                >
                  <div>
                    <p className="text-xs text-body sm:text-sm">{label}</p>
                    <p className="mt-1 text-xl font-semibold text-heading sm:text-2xl">{value}</p>
                  </div>
                  <Icon className="h-5 w-5 text-accent sm:h-6 sm:w-6" />
                </div>
              ))}
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 sm:mt-6 sm:gap-5 lg:grid-cols-2">
              <div className="rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 p-6 text-white shadow-md sm:p-7">
                <ClipboardList className="h-8 w-8" />
                <h2 className="mt-4 text-lg font-semibold">Register Belongings</h2>
                <p className="mt-1 text-sm text-blue-50">
                  Add your items and get one QR code for the whole drop-off.
                </p>
                <button
                  onClick={() => navigate("/register")}
                  className="mt-4 flex items-center gap-1 text-sm font-medium text-white transition-all hover:gap-2"
                >
                  Register Item <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              <div className="rounded-2xl border border-line bg-panel p-6 shadow-md backdrop-blur-md sm:p-7">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/20">
                  <Boxes className="h-5 w-5 text-emerald-600 dark:text-emerald-300" />
                </div>
                <h2 className="mt-4 text-lg font-semibold text-heading">My Belongings</h2>
                <p className="mt-1 text-sm text-body">
                  View everything you've registered and its current status.
                </p>
                <button
                  onClick={() => navigate("/belongings")}
                  className="mt-4 flex items-center gap-1 text-sm font-medium text-accent transition-all hover:gap-2"
                >
                  View Belongings <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              <div className="rounded-2xl border border-line bg-panel p-6 shadow-md backdrop-blur-md sm:p-7 lg:col-span-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/20">
                  <MessageSquare className="h-5 w-5 text-amber-600 dark:text-amber-300" />
                </div>
                <h2 className="mt-4 text-lg font-semibold text-heading">Feedback &amp; Complaints</h2>
                <p className="mt-1 text-sm text-body">
                  Found something wrong with the website, or have a suggestion? Let us know.
                </p>
                <button
                  onClick={() => navigate("/feedback")}
                  className="mt-4 flex items-center gap-1 text-sm font-medium text-accent transition-all hover:gap-2"
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
