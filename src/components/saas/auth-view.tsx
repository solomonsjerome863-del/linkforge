"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link2, Mail, Lock, User, Loader2, ArrowRight, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useAppStore } from "@/lib/store";
import { toast } from "sonner";
import type { User as UserType } from "@/lib/types";

type AuthMode = "signin" | "signup" | "forgot" | "reset";

export function AuthView() {
  const setUser = useAppStore((s) => s.setUser);
  const setActiveView = useAppStore((s) => s.setActiveView);
  const [mode, setMode] = useState<AuthMode>("signin");
  const [isLoading, setIsLoading] = useState(false);

  // Sign In
  const [signinEmail, setSigninEmail] = useState("");
  const [signinPassword, setSigninPassword] = useState("");

  // Sign Up
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");

  // Forgot Password
  const [forgotEmail, setForgotEmail] = useState("");

  // Reset Password
  const [resetToken, setResetToken] = useState("");
  const [resetPassword, setResetPassword] = useState("");

  function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    if (!signinEmail || !signinPassword) {
      toast.error("Please fill in all fields");
      return;
    }
    setIsLoading(true);
    fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: signinEmail, password: signinPassword }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || "Invalid credentials");
        }
        return res.json();
      })
      .then((data: { user: UserType }) => {
        setUser(data.user);
        setActiveView("dashboard");
        toast.success("Welcome back!");
      })
      .catch((err) => {
        toast.error(err.message || "Sign in failed");
      })
      .finally(() => setIsLoading(false));
  }

  function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    if (!signupName || !signupEmail || !signupPassword) {
      toast.error("Please fill in all fields");
      return;
    }
    setIsLoading(true);
    fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: signupName,
        email: signupEmail,
        password: signupPassword,
      }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || "Sign up failed");
        }
        return res.json();
      })
      .then((data: { user: UserType }) => {
        setUser(data.user);
        setActiveView("dashboard");
        toast.success("Account created with demo site!");
      })
      .catch((err) => {
        toast.error(err.message || "Sign up failed");
      })
      .finally(() => setIsLoading(false));
  }

  function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!forgotEmail) {
      toast.error("Please enter your email");
      return;
    }
    setIsLoading(true);
    fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: forgotEmail }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || "Request failed");
        }
        return res.json();
      })
      .then((data) => {
        toast.success("Reset instructions generated!");
        // In demo mode, show the token so user can reset
        if (data.devToken) {
          setResetToken(data.devToken);
          setMode("reset");
        } else {
          setMode("signin");
        }
      })
      .catch((err) => {
        toast.error(err.message || "Request failed");
      })
      .finally(() => setIsLoading(false));
  }

  function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!resetToken || !resetPassword) {
      toast.error("Please fill in all fields");
      return;
    }
    if (resetPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setIsLoading(true);
    fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: resetToken, password: resetPassword }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || "Reset failed");
        }
        return res.json();
      })
      .then(() => {
        toast.success("Password reset! You can now sign in.");
        setMode("signin");
        setResetToken("");
        setResetPassword("");
      })
      .catch((err) => {
        toast.error(err.message || "Reset failed");
      })
      .finally(() => setIsLoading(false));
  }

  function handleGuestMode() {
    const guestUser: UserType = {
      id: "guest",
      email: "guest@linkforge.digital",
      name: "Guest User",
      image: null,
      plan: "starter",
      usageLinks: 0,
      usageQueries: 0,
      createdAt: new Date().toISOString(),
    };
    setUser(guestUser);
    setActiveView("blueprint");
    toast.info("Exploring as guest");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-teal-50 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950 p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-orange-200/30 dark:bg-orange-900/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-teal-200/30 dark:bg-teal-900/10 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
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
              {mode === "forgot" || mode === "reset"
                ? "Reset your password"
                : "AI-powered internal linking for better SEO"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AnimatePresence mode="wait">
              {/* Forgot Password */}
              {mode === "forgot" && (
                <motion.form
                  key="forgot"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.2 }}
                  onSubmit={handleForgotPassword}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="forgot-email">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="forgot-email"
                        type="email"
                        placeholder="you@example.com"
                        className="pl-9"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Enter the email associated with your account. In this demo, the reset token will be shown to you directly.
                  </p>
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg shadow-orange-500/25"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <KeyRound className="w-4 h-4 mr-2" />
                    )}
                    Send Reset Instructions
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full text-muted-foreground"
                    onClick={() => setMode("signin")}
                  >
                    Back to Sign In
                  </Button>
                </motion.form>
              )}

              {/* Reset Password */}
              {mode === "reset" && (
                <motion.form
                  key="reset"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.2 }}
                  onSubmit={handleResetPassword}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="reset-token">Reset Token</Label>
                    <Input
                      id="reset-token"
                      type="text"
                      placeholder="Paste your reset token"
                      value={resetToken}
                      onChange={(e) => setResetToken(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reset-password">New Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="reset-password"
                        type="password"
                        placeholder="Min. 6 characters"
                        className="pl-9"
                        value={resetPassword}
                        onChange={(e) => setResetPassword(e.target.value)}
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg shadow-orange-500/25"
                    disabled={isLoading || !resetToken || !resetPassword}
                  >
                    {isLoading ? (
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
                    onClick={() => setMode("signin")}
                  >
                    Back to Sign In
                  </Button>
                </motion.form>
              )}

              {/* Sign In / Sign Up Tabs */}
              {mode !== "forgot" && mode !== "reset" && (
                <Tabs
                  value={mode === "signup" ? "signup" : "signin"}
                  onValueChange={(v) => setMode(v as "signin" | "signup")}
                >
                  <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="signin">Sign In</TabsTrigger>
                    <TabsTrigger value="signup">Create Account</TabsTrigger>
                  </TabsList>

                  <AnimatePresence mode="wait">
                    {mode === "signin" ? (
                      <motion.form
                        key="signin"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        transition={{ duration: 0.2 }}
                        onSubmit={handleSignIn}
                        className="space-y-4"
                      >
                        <div className="space-y-2">
                          <Label htmlFor="signin-email">Email</Label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                              id="signin-email"
                              type="email"
                              placeholder="you@example.com"
                              className="pl-9"
                              value={signinEmail}
                              onChange={(e) => setSigninEmail(e.target.value)}
                              disabled={isLoading}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="signin-password">Password</Label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                              id="signin-password"
                              type="password"
                              placeholder="Enter your password"
                              className="pl-9"
                              value={signinPassword}
                              onChange={(e) => setSigninPassword(e.target.value)}
                              disabled={isLoading}
                            />
                          </div>
                        </div>
                        <div className="text-right">
                          <button
                            type="button"
                            className="text-xs text-orange-600 hover:text-orange-700 dark:text-orange-400 transition-colors"
                            onClick={() => {
                              setForgotEmail(signinEmail);
                              setMode("forgot");
                            }}
                          >
                            Forgot password?
                          </button>
                        </div>
                        <Button
                          type="submit"
                          className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg shadow-orange-500/25"
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <ArrowRight className="w-4 h-4 mr-2" />
                          )}
                          Sign In
                        </Button>
                      </motion.form>
                    ) : (
                      <motion.form
                        key="signup"
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.2 }}
                        onSubmit={handleSignUp}
                        className="space-y-4"
                      >
                        <div className="space-y-2">
                          <Label htmlFor="signup-name">Name</Label>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                              id="signup-name"
                              type="text"
                              placeholder="Your name"
                              className="pl-9"
                              value={signupName}
                              onChange={(e) => setSignupName(e.target.value)}
                              disabled={isLoading}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="signup-email">Email</Label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                              id="signup-email"
                              type="email"
                              placeholder="you@example.com"
                              className="pl-9"
                              value={signupEmail}
                              onChange={(e) => setSignupEmail(e.target.value)}
                              disabled={isLoading}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="signup-password">Password</Label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                              id="signup-password"
                              type="password"
                              placeholder="Create a password"
                              className="pl-9"
                              value={signupPassword}
                              onChange={(e) => setSignupPassword(e.target.value)}
                              disabled={isLoading}
                            />
                          </div>
                        </div>
                        <Button
                          type="submit"
                          className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg shadow-orange-500/25"
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <ArrowRight className="w-4 h-4 mr-2" />
                          )}
                          Create Account
                        </Button>
                      </motion.form>
                    )}
                  </AnimatePresence>
                </Tabs>
              )}
            </AnimatePresence>

            {/* Divider + Guest (only on signin/signup) */}
            {mode !== "forgot" && mode !== "reset" && (
              <>
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">or</span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  className="w-full text-muted-foreground hover:text-orange-600"
                  onClick={handleGuestMode}
                >
                  Try the Blueprint
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </motion.div>
    </div>
  );
}