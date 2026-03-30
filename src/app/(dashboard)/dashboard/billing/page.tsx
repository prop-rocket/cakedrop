"use client";

import { useEffect, useState } from "react";
import {
  CreditCard,
  Crown,
  Check,
  Download,
  Loader2,
  Pause,
  Play,
  Zap,
  Building2,
  Rocket,
  IndianRupee,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

type PlanKey = "STARTER" | "GROWTH" | "ENTERPRISE";
type SubStatus = "TRIAL" | "ACTIVE" | "PAUSED" | "CANCELLED";

interface Subscription {
  plan: PlanKey;
  planName: string;
  pricePerEmployee: number;
  billingCycle: string;
  status: SubStatus;
  trialEndsAt: string | null;
  activeEmployees: number;
  razorpaySubId: string | null;
}

interface Invoice {
  id: string;
  amount: number;
  currency: string;
  status: string;
  billingPeriodStart: string;
  billingPeriodEnd: string;
  pdfUrl: string | null;
  createdAt: string;
}

interface BillingData {
  subscription: Subscription;
  invoices: Invoice[];
}

const PLAN_DETAILS: Record<
  PlanKey,
  {
    name: string;
    price: number;
    billingCycle: string;
    badge?: string;
    icon: typeof Rocket;
    features: string[];
  }
> = {
  STARTER: {
    name: "Starter",
    price: 149,
    billingCycle: "Monthly",
    icon: Zap,
    features: [
      "500g cake per birthday",
      "Printed birthday card",
      "Email notifications",
      "Basic dashboard",
    ],
  },
  GROWTH: {
    name: "Growth",
    price: 129,
    billingCycle: "Quarterly",
    badge: "Most Popular",
    icon: Rocket,
    features: [
      "500g cake per birthday",
      "Premium birthday card",
      "Company branding on cards",
      "Priority delivery",
      "Advanced analytics",
    ],
  },
  ENTERPRISE: {
    name: "Enterprise",
    price: 99,
    billingCycle: "Yearly",
    icon: Building2,
    features: [
      "1kg cake per birthday",
      "Premium birthday card",
      "Custom CEO message",
      "Dedicated account manager",
      "Custom card designs",
      "API access",
    ],
  },
};

const STATUS_STYLES: Record<SubStatus, { bg: string; text: string }> = {
  TRIAL: { bg: "bg-blue-100", text: "text-blue-700" },
  ACTIVE: { bg: "bg-green-100", text: "text-green-700" },
  PAUSED: { bg: "bg-yellow-100", text: "text-yellow-700" },
  CANCELLED: { bg: "bg-red-100", text: "text-red-700" },
};

const INVOICE_STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  paid: { bg: "bg-green-100", text: "text-green-700" },
  pending: { bg: "bg-yellow-100", text: "text-yellow-700" },
  failed: { bg: "bg-red-100", text: "text-red-700" },
};

function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div
      className={`bg-gray-200 rounded animate-pulse ${className || ""}`}
    />
  );
}

export default function BillingPage() {
  const [data, setData] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [changingPlan, setChangingPlan] = useState<PlanKey | null>(null);

  useEffect(() => {
    async function fetchBilling() {
      try {
        const res = await fetch("/api/billing");
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch {
        // Error fetching billing
      } finally {
        setLoading(false);
      }
    }
    fetchBilling();
  }, []);

  async function handlePauseResume() {
    if (!data) return;
    setActionLoading(true);
    try {
      const action =
        data.subscription.status === "PAUSED" ? "resume" : "pause";
      const res = await fetch("/api/razorpay/create-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        const refreshRes = await fetch("/api/billing");
        if (refreshRes.ok) {
          const json = await refreshRes.json();
          setData(json);
        }
      }
    } catch {
      // Error
    } finally {
      setActionLoading(false);
    }
  }

  async function handleChangePlan(plan: PlanKey) {
    if (!data || plan === data.subscription.plan) return;
    setChangingPlan(plan);
    try {
      const res = await fetch("/api/razorpay/create-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      if (res.ok) {
        const refreshRes = await fetch("/api/billing");
        if (refreshRes.ok) {
          const json = await refreshRes.json();
          setData(json);
        }
      }
    } catch {
      // Error
    } finally {
      setChangingPlan(null);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <SkeletonBlock className="h-8 w-64" />
          <SkeletonBlock className="h-4 w-48 mt-2" />
        </div>
        <SkeletonBlock className="h-40 w-full rounded-card" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SkeletonBlock className="h-72 rounded-card" />
          <SkeletonBlock className="h-72 rounded-card" />
          <SkeletonBlock className="h-72 rounded-card" />
        </div>
        <SkeletonBlock className="h-64 w-full rounded-card" />
      </div>
    );
  }

  const subscription = data?.subscription;
  const invoices = data?.invoices || [];
  const statusStyle = subscription
    ? STATUS_STYLES[subscription.status]
    : STATUS_STYLES.TRIAL;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold font-heading text-dark">
          Billing & Subscription
        </h1>
        <p className="text-gray-500 font-body mt-1">
          Manage your subscription plan and view invoices
        </p>
      </div>

      {/* Current Plan Info */}
      {subscription && (
        <div className="bg-white rounded-card shadow-sm border border-gray-100 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#FFF0ED] flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-[#E8553A]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold font-heading text-dark">
                    {subscription.planName} Plan
                  </h2>
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-badge text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}
                  >
                    {subscription.status}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-gray-500 font-body">
                  <span>
                    {formatCurrency(subscription.pricePerEmployee)}/employee/mo
                  </span>
                  <span className="hidden sm:inline text-gray-300">|</span>
                  <span className="capitalize">
                    {subscription.billingCycle} billing
                  </span>
                  <span className="hidden sm:inline text-gray-300">|</span>
                  <span>
                    {subscription.activeEmployees} active employee
                    {subscription.activeEmployees !== 1 ? "s" : ""}
                  </span>
                </div>
                {subscription.status === "TRIAL" && subscription.trialEndsAt && (
                  <p className="text-sm text-blue-600 font-medium mt-1">
                    Trial ends on {formatDate(subscription.trialEndsAt)}
                  </p>
                )}
              </div>
            </div>

            {(subscription.status === "ACTIVE" ||
              subscription.status === "PAUSED") && (
              <button
                onClick={handlePauseResume}
                disabled={actionLoading}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
                  subscription.status === "PAUSED"
                    ? "border-green-300 text-green-700 hover:bg-green-50"
                    : "border-yellow-300 text-yellow-700 hover:bg-yellow-50"
                } disabled:opacity-50`}
              >
                {actionLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : subscription.status === "PAUSED" ? (
                  <Play className="w-4 h-4" />
                ) : (
                  <Pause className="w-4 h-4" />
                )}
                {subscription.status === "PAUSED"
                  ? "Resume Subscription"
                  : "Pause Subscription"}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Plan Comparison */}
      <div>
        <h2 className="text-lg font-bold font-heading text-dark mb-4">
          Available Plans
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(Object.keys(PLAN_DETAILS) as PlanKey[]).map((key) => {
            const plan = PLAN_DETAILS[key];
            const Icon = plan.icon;
            const isCurrent = subscription?.plan === key;

            return (
              <div
                key={key}
                className={`relative bg-white rounded-card shadow-sm border-2 p-6 transition-all ${
                  isCurrent
                    ? "border-[#E8553A] shadow-md"
                    : "border-gray-100 hover:border-gray-200"
                }`}
              >
                {/* Badges */}
                {plan.badge && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-[#E8553A] text-white text-xs font-medium rounded-full whitespace-nowrap">
                    {plan.badge}
                  </span>
                )}

                <div className="text-center space-y-4">
                  <div className="flex justify-center">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        isCurrent ? "bg-[#FFF0ED]" : "bg-gray-50"
                      }`}
                    >
                      <Icon
                        className={`w-6 h-6 ${
                          isCurrent ? "text-[#E8553A]" : "text-gray-500"
                        }`}
                      />
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold font-heading text-dark">
                      {plan.name}
                    </h3>
                    <p className="text-sm text-gray-400 font-body">
                      {plan.billingCycle} billing
                    </p>
                  </div>

                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-sm text-gray-500">
                      <IndianRupee className="w-3.5 h-3.5 inline -mt-0.5" />
                    </span>
                    <span className="text-3xl font-bold text-dark">
                      {plan.price}
                    </span>
                    <span className="text-sm text-gray-400">/emp/mo</span>
                  </div>

                  <ul className="space-y-2 text-left">
                    {plan.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-start gap-2 text-sm font-body text-gray-600"
                      >
                        <Check className="w-4 h-4 text-[#E8553A] mt-0.5 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="pt-2">
                    {isCurrent ? (
                      <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#FFF0ED] text-[#E8553A] text-sm font-medium rounded-lg">
                        <Crown className="w-4 h-4" />
                        Current Plan
                      </span>
                    ) : (
                      <button
                        onClick={() => handleChangePlan(key)}
                        disabled={changingPlan !== null}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#E8553A] text-white text-sm font-medium rounded-lg hover:bg-[#D4472E] disabled:opacity-50 transition-colors"
                      >
                        {changingPlan === key ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : null}
                        {changingPlan === key
                          ? "Processing..."
                          : subscription &&
                            PLAN_DETAILS[subscription.plan].price <
                              plan.price
                          ? "Change Plan"
                          : "Upgrade"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Invoice History */}
      <div className="bg-white rounded-card shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-bold font-heading text-dark mb-4">
          Invoice History
        </h2>

        {invoices.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <CreditCard className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p className="font-body">No invoices yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm font-body">
              <thead>
                <tr className="border-b border-gray-100 text-left text-gray-500">
                  <th className="pb-3 font-medium">Invoice #</th>
                  <th className="pb-3 font-medium">Period</th>
                  <th className="pb-3 font-medium">Amount</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => {
                  const invStatus =
                    INVOICE_STATUS_STYLES[invoice.status] ||
                    INVOICE_STATUS_STYLES.pending;
                  return (
                    <tr
                      key={invoice.id}
                      className="border-b border-gray-50 last:border-0"
                    >
                      <td className="py-3 font-medium text-dark">
                        {invoice.id.slice(0, 8).toUpperCase()}
                      </td>
                      <td className="py-3 text-gray-600">
                        {formatDate(invoice.billingPeriodStart)} &ndash;{" "}
                        {formatDate(invoice.billingPeriodEnd)}
                      </td>
                      <td className="py-3 text-gray-600">
                        {formatCurrency(invoice.amount / 100)}
                      </td>
                      <td className="py-3">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-badge text-xs font-medium capitalize ${invStatus.bg} ${invStatus.text}`}
                        >
                          {invoice.status}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        {invoice.pdfUrl ? (
                          <a
                            href={invoice.pdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[#E8553A] hover:text-[#D4472E] text-sm font-medium transition-colors"
                          >
                            <Download className="w-4 h-4" />
                            Download
                          </a>
                        ) : (
                          <span className="text-gray-300 text-sm">--</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
