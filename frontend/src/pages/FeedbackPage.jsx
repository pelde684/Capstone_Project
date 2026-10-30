import React, { useState } from "react";
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
import loginBg from "../assets/college.jpeg";

const feedbackTypes = ["Complaint", "Something isn't working", "Suggestion", "Other"];
const feedbackPages = ["Login", "Dashboard", "Register Item", "My Belongings", "Other / not sure"];
const FEEDBACK_KEY = "luggage-room-feedback";

function loadFeedback() {
  try {
    return JSON.parse(localStorage.getItem(FEEDBACK_KEY) || "[]");
  } catch {
    return [];
  }
}

// TODO: once Tandin's API is ready, send the feedback to the backend here instead
// of keeping it in this browser's storage, so staff can actually read it.
function saveFeedback(entry) {
  try {
    const saved = loadFeedback();
    localStorage.setItem(FEEDBACK_KEY, JSON.stringify([entry, ...saved]));
  } catch {
    console.warn("Could not save feedback in this browser.");
  }
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
  const [history, setHistory] = useState(loadFeedback);

  const handleSubmit = (e) => {
    e.preventDefault();
    saveFeedback({
      id: Date.now().toString(36),
      type,
      page: page || "Not specified",
      subject,
      message,
      date: new Date().toISOString(),
      status: "New",
    });
    setHistory(loadFeedback());
    setSent(true);
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
                  <p className="text-sm font-semibold text-heading">Student</p>
                  <p className="text-xs text-body">CST Luggage Room</p>
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
                      Your feedback has been sent. We'll use it to improve the system.
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
                          required
                          className={`${fieldClass} resize-none`}
                        />
                      </div>

                      <button
                        type="submit"
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-500 py-3 text-sm font-medium text-white shadow-md transition-colors hover:bg-blue-600"
                      >
                        <Send className="h-4 w-4" />
                        Submit Feedback
                      </button>
                    </form>
                  </>
                )}
              </div>

              {history.length > 0 && (
                <div className="rounded-2xl border border-line bg-panel p-5 shadow-md backdrop-blur-md sm:p-8">
                  <h2 className="text-lg font-semibold text-heading">Your Previous Feedback</h2>
                  <div className="mt-4 space-y-3">
                    {history.map((entry) => (
                      <div key={entry.id} className="rounded-xl bg-field p-4">
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-sm font-medium text-heading">{entry.subject}</p>
                          <span className="flex-shrink-0 rounded-full bg-blue-500/15 px-2.5 py-1 text-xs font-medium text-accent">
                            {entry.status}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-muted">
                          {entry.type} • {entry.page} •{" "}
                          {new Date(entry.date).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                        <p className="mt-2 text-xs text-body">{entry.message}</p>
                      </div>
                    ))}
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