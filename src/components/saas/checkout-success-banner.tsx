"use client";

import { CheckCircle2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface CheckoutSuccessBannerProps {
  show: boolean;
  plan: string | null;
  onDismiss: () => void;
}

export function CheckoutSuccessBanner({
  show,
  plan,
  onDismiss,
}: CheckoutSuccessBannerProps) {
  return (
    <AnimatePresence>
      {show && plan && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-4 right-4 left-4 sm:left-auto sm:w-96 z-[100] bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 shadow-lg"
        >
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-emerald-800 dark:text-emerald-300">
                Plan Upgraded!
              </p>
              <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-0.5">
                You&apos;re now on the{" "}
                <span className="font-semibold">
                  {plan.charAt(0).toUpperCase() + plan.slice(1)}
                </span>{" "}
                plan. Enjoy your new features!
              </p>
            </div>
            <button
              onClick={onDismiss}
              className="text-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-300 shrink-0"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}