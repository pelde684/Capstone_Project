import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  UserCircle2,
  ChevronDown,
  MessageSquare,
  Send,
  CheckCircle2,
  ArrowLeft,
} from "lucide-react";
import Sidebar from "../components/Sidebar";
import { api, getUser } from "../api";
import loginBg from "../assets/college.jpeg";

const feedbackTypes = ["Complaint", "Something isn't working", "Suggestion", "Other"];
const feedbackPages = ["Login", "Dashboard", "Register Item", "My Belongings", "Other / not sure"];
// Feedback is sent to the backend as a complaint (POST /api/complaints), so the admin sees it
// on the staff site (Admin > Complaints), can forward it and resolve it. The student sees the status here.
const STATUS_LABEL = {
  OPEN: ["Received", "bg-amber-500/15 text-amber-700 dark:text-amber-300"],
  FORWARDED: ["Forwarded", "bg-blue-500/15 text-accent"],
  IN_PROGRESS: ["In progress", "bg-blue-500/15 text-accent"],
  RESOLVED: ["Resolved", "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"],
  CLOSED: ["Closed", "bg-slate-500/15 text-muted"],
};

// The type and page are written on the first two lines of the description
const describe = (type, page, message) => `Type: ${type}\nPage: ${page || "Not specified"}\n\n${message.trim()}`;
function readDescription(text = "") {
  const m = text.match(/^Type: (.*)\nPage: (.*)\n\n([\s\S]*)$/);
  return m ? { type: m[1], page: m[2], message: m[3] } : { type: "", page: "", message: text };
}

const fieldClass =
  "w-full rounded-xl border border-line bg-field px-4 py-3 text-sm text-heading outline-none placeholder:text-muted focus:border-blue-400";
const optionClass = "bg-white text-slate-900 dark:bg-slate-800 dark:text-white";

export default function FeedbackPage() {
  const navigate = useNavigate();
  const [type, setType] = useState("");
  const [page, setPage] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [history, setHistory] = useState([]);
  const user = getUser();

  const loadHistory = () =>
    api("/complaints/mine").then((r) => setHistory(r.data)).catch(() => {});
  useEffect(() => { loadHistory(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSending(true);
    try {
      await api("/complaints", {
        method: "POST",
        body: { subject: subject.trim(), description: describe(type, page, message) },
      });
      setSent(true);
      loadHistory();
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  const sendAnother = () => {
    setType("");
    setPage("");
    setSubject("");
    setMessage("");
    setSent(false);
  };

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
        <Sidebar activePath="/feedback" />

        <div className="flex-1">
          <header className="flex flex-col gap-3 border-b border-line bg-bar px-4 py-4 backdrop-blur-md sm:flex-row sm:items-center sm:justify-between sm:px-8 sm:py-5">
            <div>
              <h1 className="text-lg font-semibold text-heading sm:text-xl">Feedback &amp; Complaints</h1>
              <p className="text-xs text-body sm:text-sm">Tell us what's wrong or how we can improve</p>
            </div>
            <div className="flex items-center gap-5">
              <button className="relative text-body hover:text-heading">
                <Bell className="h-5 w-5" />
                <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-semibold text-white">
                  1
                </span>
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
            <button
              onClick={() => navigate("/dashboard")}
              className="mb-4 flex items-center gap-1 text-sm text-body hover:text-heading"
            >
              <ArrowLeft className="h-4 w-4" /> Back to Dashboard
            </button>

            <div className="mx-auto max-w-2xl space-y-5">
              <div className="rounded-2xl border border-line bg-panel p-5 shadow-md backdrop-blur-md sm:p-8">
                {sent ? (
                  <div className="py-4 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20">
                      <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-300" />
                    </div>
                    <h2 className="mt-4 text-lg font-semibold text-heading">Thank you!</h2>
                    <p className="mt-1 text-sm text-body">
                      Your feedback has been sent to the luggage room admin. You can follow its status below.
                    </p>
                    <button
                      onClick={sendAnother}
                      className="mt-6 w-full rounded-xl bg-blue-500 py-3 text-sm font-medium text-white shadow-md transition-colors hover:bg-blue-600"
                    >
                      Send Another
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/20">
                        <MessageSquare className="h-5 w-5 text-amber-600 dark:text-amber-300" />
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-heading">Send Feedback</h2>
                        <p className="text-xs text-body">
                          Found something wrong with the website? Let us know.
                        </p>
                      </div>
                    </div>

                    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                      <div>
                        <label className="mb-1 block text-sm font-medium text-body">Type</label>
                        <select
                          value={type}
                          onChange={(e) => setType(e.target.value)}
                          required
                          className={fieldClass}
                        >
                          <option value="" disabled className={optionClass}>
                            What kind of feedback is this?
                          </option>
                          {feedbackTypes.map((t) => (
                            <option key={t} value={t} className={optionClass}>
                              {t}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="mb-1 block text-sm font-medium text-body">
                          Which page? <span className="text-muted">(optional)</span>
                        </label>
                        <select
                          value={page}
                          onChange={(e) => setPage(e.target.value)}
                          className={fieldClass}
                        >
                          <option value="" className={optionClass}>
                            Select a page
                          </option>
                          {feedbackPages.map((p) => (
                            <option key={p} value={p} className={optionClass}>
                              {p}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="mb-1 block text-sm font-medium text-body">Subject</label>
                        <input
                          type="text"
                          value={subject}
                          onChange={(e) => setSubject(e.target.value)}
                          placeholder="e.g. Photo upload is not working"
                          maxLength={150}
                          required
                          className={fieldClass}
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-sm font-medium text-body">Message</label>
                        <textarea
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          placeholder="Describe what happened or what you'd like to see changed."
                          rows={4}
                          maxLength={1900}
                          required
                          className={`${fieldClass} resize-none`}
                        />
                      </div>

                      {error && (
                        <p className="rounded-xl border border-red-400/50 bg-red-500/15 px-4 py-3 text-sm text-heading">
                          Could not send: {error}
                        </p>
                      )}

                      <button
                        type="submit"
                        disabled={sending}
                        className="flex w-full disabled:opacity-60 items-center justify-center gap-2 rounded-xl bg-blue-500 py-3 text-sm font-medium text-white shadow-md transition-colors hover:bg-blue-600"
                      >
                        <Send className="h-4 w-4" />
                        {sending ? "Sending…" : "Submit Feedback"}
                      </button>
                    </form>
                  </>
                )}
              </div>

              {history.length > 0 && (
                <div className="rounded-2xl border border-line bg-panel p-5 shadow-md backdrop-blur-md sm:p-8">
                  <h2 className="text-lg font-semibold text-heading">Your Previous Feedback</h2>
                  <div className="mt-4 space-y-3">
                    {history.map((entry) => {
                      const d = readDescription(entry.description);
                      const [label, tone] = STATUS_LABEL[entry.status] || [entry.status, "bg-blue-500/15 text-accent"];
                      return (
                        <div key={entry.id} className="rounded-xl bg-field p-4">
                          <div className="flex items-start justify-between gap-3">
                            <p className="text-sm font-medium text-heading">{entry.subject}</p>
                            <span className={`flex-shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${tone}`}>{label}</span>
                          </div>
                          <p className="mt-1 text-xs text-muted">
                            {[d.type, d.page,
                              new Date(entry.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
                            ].filter(Boolean).join(" • ")}
                          </p>
                          <p className="mt-2 whitespace-pre-wrap text-xs text-body">{d.message}</p>
                          {entry.forwardedTo && (
                            <p className="mt-2 text-xs text-body">
                              <span className="font-medium text-heading">Forwarded to:</span> {entry.forwardedTo}
                            </p>
                          )}
                          {entry.resolution && (
                            <p className="mt-1 whitespace-pre-wrap text-xs text-body">
                              <span className="font-medium text-heading">Reply from admin:</span> {entry.resolution}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}