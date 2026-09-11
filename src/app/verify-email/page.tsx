"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BadgeCheck, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";

export default function VerifyEmailPage() {
  const [token, setToken] = useState<string | null>(null);
  const [state, setState] = useState<
    "reading" | "ready" | "submitting" | "success" | "error"
  >("reading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("token");
    if (t) {
      setToken(t);
      setState("ready");
    } else {
      setMessage(
        "This verification link is missing its token. Log in to LinkForge and a fresh verification email will be sent to you automatically."
      );
      setState("error");
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setState("submitting");
    try {
      const res = await fetch("/api/auth/verify-email-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Verification failed");
      setState("success");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Verification failed");
      setState("error");
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 via-white to-teal-50 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg shadow-orange-500/25">
            <span className="text-2xl">🔥</span>
          </div>
          <h2 className="text-2xl font-bold mt-4">LinkForge</h2>
        </div>

        <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-800 p-8">
          {state === "reading" && (
            <div className="text-center py-6">
              <Loader2 className="w-8 h-8 mx-auto animate-spin text-orange-500" />
              <p className="text-sm text-muted-foreground mt-3">Validating your verification link…</p>
            </div>
          )}

          {state === "error" && (
            <div className="text-center">
              <div className="mx-auto w-14 h-14 rounded-full bg-red-100 dark:bg-red-950/50 flex items-center justify-center mb-4">
                <AlertTriangle className="w-7 h-7 text-red-500" />
              </div>
              <h3 className="text-lg font-semibold">Verification failed</h3>
              <p className="text-sm text-muted-foreground mt-2">{message}</p>
              <Link
                href="/"
                className="inline-block mt-6 text-sm font-semibold text-orange-600 hover:text-orange-700 dark:text-orange-400"
              >
                Back to LinkForge
              </Link>
            </div>
          )}

          {state === "ready" && (
            <form onSubmit={handleSubmit}>
              <div className="text-center mb-6">
                <div className="mx-auto w-14 h-14 rounded-full bg-orange-100 dark:bg-orange-950/50 flex items-center justify-center mb-4">
                  <BadgeCheck className="w-7 h-7 text-orange-500" />
                </div>
                <h3 className="text-lg font-semibold">Confirm your email address</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  One click and your account is fully unlocked — crawling and AI link
                  suggestions included.
                </p>
              </div>

              <label
                htmlFor="confirm"
                className="block text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 mb-2"
              >
                Click the button below to verify
              </label>

              <button
                id="confirm"
                type="submit"
                disabled={state === "submitting"}
                className="w-full inline-flex items-center justify-center rounded-md text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-orange-600 text-white shadow hover:bg-orange-700 h-10 px-4"
              >
                {state === "submitting" ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <BadgeCheck className="w-4 h-4 mr-2" />
                )}
                Verify my email address
              </button>
            </form>
          )}

          {state === "submitting" && (
            <div className="text-center py-6">
              <Loader2 className="w-8 h-8 mx-auto animate-spin text-orange-500" />
              <p className="text-sm text-muted-foreground mt-3">Verifying your email…</p>
            </div>
          )}

          {state === "success" && (
            <div className="text-center">
              <div className="mx-auto w-14 h-14 rounded-full bg-green-100 dark:bg-green-950/50 flex items-center justify-center mb-4">
                <CheckCircle2 className="w-7 h-7 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold">Email verified!</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Your account is fully unlocked. Crawling and AI link suggestions are
                ready to go.
              </p>
              <Link
                href="/"
                className="mt-6 inline-flex items-center justify-center rounded-md text-sm font-semibold transition-colors bg-orange-600 text-white shadow hover:bg-orange-700 h-10 px-6"
              >
                Go to LinkForge
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
