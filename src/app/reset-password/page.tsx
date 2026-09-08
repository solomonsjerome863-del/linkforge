"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link2, Lock, Loader2, KeyRound, CheckCircle2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";

/**
 * Standalone password-reset page — the landing target for reset emails:
 *   /reset-password?token=<token>
 *
 * Deliberately self-contained (does not mount the app store) so it works
 * for logged-out users coming from email.
 */
export default function ResetPasswordPage() {
  const [token, setToken] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState<"reading" | "ready" | "missing-token" | "submitting" | "success" | "error">("reading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("token");
    if (t) {
      setToken(t);
      setStatus("ready");
    } else {
      setMessage("This reset link is missing its token. Please request a new password reset email.");
      setStatus("missing-token");
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    if (password.length < 6) {
      setMessage("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setMessage("Passwords do not match.");
      return;
    }
    setStatus("submitting");
    setMessage("");
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Reset failed");
      setStatus("success");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Reset failed");
      setStatus("error");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-teal-50 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
            <Link2 className="w-5 h-5 text-white" />
          </div>
          <span className="text-2xl font-bold tracking-tight">
            Link<span className="text-orange-500">Forge</span>{" "}
            <span className="text-muted-foreground font-normal text-lg">AI</span>
          </span>
        </div>

        <Card className="border-0 shadow-xl shadow-orange-500/5">
          <CardHeader className="pb-4">
            <CardDescription className="text-center text-base text-foreground/70">
              {status === "success" ? "All done" : "Choose a new password"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {status === "reading" && (
              <div className="py-8 flex flex-col items-center gap-3 text-muted-foreground">
                <Loader2 className="w-6 h-6 animate-spin" />
                <p className="text-sm">Validating your reset link…</p>
              </div>
            )}

            {status === "missing-token" && (
              <div className="py-4 space-y-4 text-center">
                <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
                <p className="text-sm text-muted-foreground">{message}</p>
                <Button asChild className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white">
                  <a href="/">Back to sign in</a>
                </Button>
              </div>
            )}

            {status === "success" && (
              <div className="py-4 space-y-4 text-center">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                <p className="text-sm text-foreground font-medium">Your password has been updated.</p>
                <p className="text-sm text-muted-foreground">You can now sign in with your new password.</p>
                <Button asChild className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white">
                  <a href="/">Go to sign in</a>
                </Button>
              </div>
            )}

            {(status === "ready" || status === "submitting" || status === "error") && (
              <form onSubmit={handleSubmit} className="space-y-4">
                {status === "error" && message && (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800/50 text-sm text-rose-700 dark:text-rose-400">
                    <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>{message}</span>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="reset-password">New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="reset-password"
                      type="password"
                      placeholder="Min. 6 characters"
                      className="pl-9"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={status === "submitting"}
                      autoFocus
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="confirm-password"
                      type="password"
                      placeholder="Repeat your new password"
                      className="pl-9"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      disabled={status === "submitting"}
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg shadow-orange-500/25"
                  disabled={status === "submitting" || !password || !confirm}
                >
                  {status === "submitting" ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <KeyRound className="w-4 h-4 mr-2" />
                  )}
                  Reset Password
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full text-muted-foreground"
                  asChild
                >
                  <a href="/">Back to sign in</a>
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Reset links expire after 1 hour. Need help? support@linkforge.digital
        </p>
      </motion.div>
    </div>
  );
}
