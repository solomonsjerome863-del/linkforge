"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Globe, ArrowRight, Sparkles, Zap, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { PlanType } from "@/lib/types";

interface PaymentSuccessScreenProps {
  plan: PlanType;
  planName: string;
  onClose: () => void;
  onNavigateSites: () => void;
}

const PLAN_META: Record<string, { icon: React.ElementType; color: string; gradient: string; price: string; usdEquiv: string; features: string[] }> = {
  pro: {
    icon: Zap,
    color: "text-orange-500",
    gradient: "from-orange-500 to-amber-500",
    price: "R999",
    usdEquiv: "~$49",
    features: ["5 sites", "500 pages per site", "2,000 suggestions/mo", "Analytics dashboard", "Bulk operations", "Priority support"],
  },
  business: {
    icon: Building2,
    color: "text-teal-500",
    gradient: "from-teal-500 to-emerald-500",
    price: "R2,455",
    usdEquiv: "~$149",
    features: ["25 sites", "5,000 pages per site", "10,000 suggestions/mo", "Full analytics", "Bulk actions & API access", "Dedicated support"],
  },
  enterprise: {
    icon: Sparkles,
    color: "text-amber-500",
    gradient: "from-amber-500 to-yellow-500",
    price: "Custom",
    usdEquiv: "",
    features: ["Unlimited sites", "Unlimited pages", "Unlimited suggestions", "Custom integrations", "SLA guarantee", "Dedicated account manager"],
  },
};

const NEXT_STEPS = [
  { icon: Globe, title: "Add your first site", description: "Enter your website URL to start crawling and discovering internal linking opportunities." },
  { icon: Sparkles, title: "Review suggestions", description: "Our AI analyzes your content and generates smart internal link recommendations." },
  { icon: Zap, title: "Apply & grow", description: "Apply links in bulk and watch your organic traffic improve over time." },
];

export function PaymentSuccessScreen({ plan, planName, onClose, onNavigateSites }: PaymentSuccessScreenProps) {
  const [dismissed, setDismissed] = useState(false);
  const meta = PLAN_META[plan] || PLAN_META.pro;
  const PlanIcon = meta.icon;

  if (dismissed) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          setDismissed(true);
          onClose();
        }
      }}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="w-full max-w-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <Card className="border-0 shadow-2xl overflow-hidden">
          {/* Top gradient banner */}
          <div className={`bg-gradient-to-r ${meta.gradient} p-8 text-white text-center relative overflow-hidden`}>
            {/* Subtle background circles */}
            <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full" />
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/10 rounded-full" />

            <div className="relative z-10">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
              >
                <CheckCircle2 className="w-16 h-16 mx-auto mb-4 drop-shadow-lg" />
              </motion.div>
              <h2 className="text-2xl font-bold mb-1">Payment Successful!</h2>
              <p className="text-white/90 text-sm">Welcome to LinkForge</p>
            </div>
          </div>

          <CardContent className="p-6 space-y-5">
            {/* Plan badge */}
            <div className="flex items-center justify-center">
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r ${meta.gradient} bg-opacity-10`}>
                <PlanIcon className="w-4 h-4 text-white" />
                <span className="font-semibold text-white text-sm">{planName}</span>
                <span className="text-white/80 text-sm">
                  {meta.price}/mo{meta.usdEquiv ? ` (${meta.usdEquiv})` : ""}
                </span>
              </div>
            </div>

            {/* Plan features */}
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">What&apos;s included</p>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {meta.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${meta.color}`} />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            {/* Next steps */}
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Get started in 3 steps</p>
              <div className="space-y-3">
                {NEXT_STEPS.map((step, i) => {
                  const StepIcon = step.icon;
                  return (
                    <div key={step.title} className="flex items-start gap-3">
                      <div className={`flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-r ${meta.gradient} text-white text-xs font-bold shrink-0 mt-0.5`}>
                        {i + 1}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{step.title}</p>
                        <p className="text-xs text-muted-foreground">{step.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button
                onClick={() => {
                  setDismissed(true);
                  onClose();
                  onNavigateSites();
                }}
                className={`flex-1 bg-gradient-to-r ${meta.gradient} hover:opacity-90 text-white shadow-lg`}
              >
                Add Your First Site
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setDismissed(true);
                  onClose();
                }}
                className="flex-1"
              >
                Go to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
