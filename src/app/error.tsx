"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-teal-50 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950 p-4">
      <div className="w-full max-w-md text-center">
        <div className="w-16 h-16 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-8 h-8 text-orange-500" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
        <p className="text-muted-foreground mb-6">
          An unexpected error occurred. This has been logged. Please try again.
        </p>
        <Button
          onClick={reset}
          className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Try Again
        </Button>
      </div>
    </div>
  );
}