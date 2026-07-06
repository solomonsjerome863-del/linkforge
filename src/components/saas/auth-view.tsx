"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link2, Mail, Lock, User, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAppStore } from "@/lib/store";
import { toast } from "sonner";
import type { User as UserType } from "@/lib/types";

export function AuthView() {
  const setUser = useAppStore((s) => s.setUser);
  const setActiveView = useAppStore((s) => s.setActiveView);
  const [activeTab, setActiveTab] = useState<"signin" | "signup">("signin");
  const [isLoading, setIsLoading] = useState(false);

  // Sign In form state
  const [signinEmail, setSigninEmail] = useState("");
  const [signinPassword, setSigninPassword] = useState("");

  // Sign Up form state
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");

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

  function handleGuestMode() {
    const guestUser: UserType = {
      id: "guest",
      email: "guest@linkforge.ai",
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
      {/* Background decorations */}
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
              AI-powered internal linking for better SEO
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs
              value={activeTab}
              onValueChange={(v) => setActiveTab(v as "signin" | "signup")}
            >
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Create Account</TabsTrigger>
              </TabsList>

              <AnimatePresence mode="wait">
                {activeTab === "signin" ? (
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

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">or</span>
              </div>
            </div>

            {/* Guest mode */}
            <Button
              variant="ghost"
              className="w-full text-muted-foreground hover:text-orange-600"
              onClick={handleGuestMode}
            >
              Try the Blueprint
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </motion.div>
    </div>
  );
}