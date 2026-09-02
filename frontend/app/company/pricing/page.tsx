"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import { requireCompany } from "../../lib/auth";
import NotificationBell from "../../components/NotificationBell";

type CompanyPlan = {
  subscription_plan: "free" | "starter" | "pro" | string;
  subscription_status:
    | "inactive"
    | "active"
    | "cancelled"
    | "past_due"
    | string;
  subscription_expires_at: string | null;
};

type PlanKey = "free" | "starter" | "pro";
type PaidPlanKey = "starter" | "pro";

type PricingPlan = {
  key: PlanKey;
  name: string;
  price: string;
  period: string;
  description: string;
  featured?: boolean;
  features: string[];
};

type CreateOrderResponse = {
  orderId: string;
  amount: number | string;
  currency: string;
  plan: PaidPlanKey;
  planName: string;
  keyId: string;
  companyName: string;
  companyEmail: string;
  error?: string;
};

type VerifyPaymentResponse = {
  verified?: boolean;
  captured?: boolean;
  paymentStatus?: string;
  paymentId?: string;
  orderId?: string;
  plan?: PaidPlanKey;
  planName?: string;
  amount?: number;
  message?: string;
  error?: string;
};

type RazorpaySuccessResponse = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};

type RazorpayFailureResponse = {
  error?: {
    code?: string;
    description?: string;
    source?: string;
    step?: string;
    reason?: string;
    metadata?: {
      order_id?: string;
      payment_id?: string;
    };
  };
};

type RazorpayOptions = {
  key: string;
  amount: number | string;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill?: {
    name?: string;
    email?: string;
  };
  notes?: {
    plan?: string;
  };
  theme?: {
    color?: string;
  };
  retry?: {
    enabled: boolean;
  };
  modal?: {
    ondismiss?: () => void;
  };
  handler: (
    response: RazorpaySuccessResponse
  ) => void | Promise<void>;
};

type RazorpayInstance = {
  open: () => void;
  on: (
    event: "payment.failed",
    callback: (
      response: RazorpayFailureResponse
    ) => void
  ) => void;
};

declare global {
  interface Window {
    Razorpay?: new (
      options: RazorpayOptions
    ) => RazorpayInstance;
  }
}

const pricingPlans: PricingPlan[] = [
  {
    key: "free",
    name: "Free",
    price: "₹0",
    period: "forever",
    description:
      "Explore FresherHire and start building your candidate pipeline.",
    features: [
      "Browse fresher profiles",
      "View skills and project evidence",
      "View assessment results",
      "Shortlist candidates",
      "Basic recruiter dashboard",
      "Candidate contact details locked",
      "Candidate resumes locked",
    ],
  },
  {
    key: "starter",
    name: "Starter",
    price: "₹999",
    period: "30 days",
    description:
      "For startups and hiring teams actively recruiting entry-level talent.",
    featured: true,
    features: [
      "Everything in Free",
      "Unlock candidate email",
      "Unlock candidate phone number",
      "Access eligible candidate resumes",
      "Contact shortlisted candidates",
      "Contact candidates who applied to your jobs",
      "Up to 5 active jobs",
    ],
  },
  {
    key: "pro",
    name: "Pro",
    price: "₹1,999",
    period: "30 days",
    description:
      "For growing teams that need more hiring capacity and deeper insights.",
    features: [
      "Everything in Starter",
      "More active job listings",
      "Advanced candidate ranking",
      "Advanced candidate filters",
      "Recruitment analytics",
      "Priority recruiter features",
      "Designed for higher-volume hiring",
    ],
  },
];

export default function CompanyPricingPage() {
  const router = useRouter();

  const [companyPlan, setCompanyPlan] =
    useState<CompanyPlan | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [paymentMessage, setPaymentMessage] =
    useState("");

  const [paymentMessageType, setPaymentMessageType] =
    useState<"success" | "error" | "info" | "">("");

  const [processingPlan, setProcessingPlan] =
    useState<PaidPlanKey | null>(null);

  useEffect(() => {
    loadPlan();
  }, []);

  async function loadPlan(
    showPageLoader = true
  ) {
    if (showPageLoader) {
      setLoading(true);
    }

    setError("");

    try {
      const auth =
        await requireCompany();

      if (!auth.allowed) {
        router.replace(
          auth.redirectTo!
        );
        return;
      }

      const user = auth.user;

      if (!user) {
        router.replace("/login");
        return;
      }

      const {
        data,
        error: planError,
      } = await supabase
        .from("companies")
        .select(`
          subscription_plan,
          subscription_status,
          subscription_expires_at
        `)
        .eq("id", user.id)
        .maybeSingle();

      if (planError) {
        console.error(
          "Subscription load error:",
          planError
        );

        setError(
          planError.message ||
            "Could not load your current plan."
        );

        if (showPageLoader) {
          setLoading(false);
        }

        return;
      }

      if (!data) {
        setError(
          "Company profile not found."
        );

        if (showPageLoader) {
          setLoading(false);
        }

        return;
      }

      setCompanyPlan(data as CompanyPlan);

      if (showPageLoader) {
        setLoading(false);
      }
    } catch (err) {
      console.error(
        "Pricing page error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while loading pricing."
      );

      if (showPageLoader) {
        setLoading(false);
      }
    }
  }

  function isCurrentPlan(plan: PlanKey) {
    if (!companyPlan) return false;

    return (
      companyPlan.subscription_plan === plan &&
      (plan === "free" ||
        companyPlan.subscription_status === "active")
    );
  }

  function getCurrentPlanLabel() {
    if (!companyPlan) return "Free";

    const plan = companyPlan.subscription_plan;

    return (
      plan.charAt(0).toUpperCase() +
      plan.slice(1)
    );
  }

  function getStatusLabel() {
    if (!companyPlan) return "Inactive";

    if (
      companyPlan.subscription_status === "active"
    ) {
      return "Active";
    }

    if (
      companyPlan.subscription_status === "past_due"
    ) {
      return "Past Due";
    }

    if (
      companyPlan.subscription_status === "cancelled"
    ) {
      return "Cancelled";
    }

    return "Inactive";
  }

  function showPaymentStatus(
    message: string,
    type: "success" | "error" | "info"
  ) {
    setPaymentMessage(message);
    setPaymentMessageType(type);
  }

  async function getAccessToken() {
    const {
      data: sessionData,
      error: sessionError,
    } = await supabase.auth.getSession();

    if (
      sessionError ||
      !sessionData.session?.access_token
    ) {
      throw new Error(
        "Your login session has expired. Please sign in again."
      );
    }

    return sessionData.session.access_token;
  }

  async function loadRazorpayScript() {
    if (typeof window === "undefined") {
      return false;
    }

    if (window.Razorpay) {
      return true;
    }

    return await new Promise<boolean>((resolve) => {
      const existingScript =
        document.querySelector<HTMLScriptElement>(
          'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
        );

      if (existingScript) {
        existingScript.addEventListener(
          "load",
          () => resolve(true),
          { once: true }
        );

        existingScript.addEventListener(
          "error",
          () => resolve(false),
          { once: true }
        );

        return;
      }

      const script =
        document.createElement("script");

      script.src =
        "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);

      document.body.appendChild(script);
    });
  }

  async function refreshPlanAfterPayment(
    expectedPlan: PaidPlanKey
  ) {
    for (let attempt = 0; attempt < 6; attempt++) {
      const auth = await requireCompany();

      if (!auth.allowed || !auth.user) {
        return false;
      }

      const {
        data,
        error: refreshError,
      } = await supabase
        .from("companies")
        .select(`
          subscription_plan,
          subscription_status,
          subscription_expires_at
        `)
        .eq("id", auth.user.id)
        .maybeSingle();

      if (!refreshError && data) {
        setCompanyPlan(data as CompanyPlan);

        if (
          data.subscription_plan === expectedPlan &&
          data.subscription_status === "active"
        ) {
          return true;
        }
      }

      await new Promise((resolve) =>
        window.setTimeout(resolve, 1500)
      );
    }

    return false;
  }

  async function verifyPayment(
    response: RazorpaySuccessResponse,
    plan: PaidPlanKey,
    accessToken: string
  ) {
    const verifyResponse = await fetch(
      "/api/razorpay/verify-payment",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(response),
      }
    );

    const verifyData =
      (await verifyResponse.json()) as VerifyPaymentResponse;

    if (!verifyResponse.ok) {
      throw new Error(
        verifyData.error ||
          "Payment verification failed."
      );
    }

    if (!verifyData.verified) {
      throw new Error(
        verifyData.error ||
          "Razorpay payment could not be verified."
      );
    }

    if (!verifyData.captured) {
      showPaymentStatus(
        `Payment was received but is currently ${verifyData.paymentStatus || "processing"}. Your plan will activate after Razorpay confirms capture.`,
        "info"
      );
      return;
    }

    showPaymentStatus(
      `Payment verified successfully for the ${
        plan === "starter" ? "Starter" : "Pro"
      } plan. Activating your recruiter access...`,
      "success"
    );

    const activated =
      await refreshPlanAfterPayment(plan);

    if (activated) {
      showPaymentStatus(
        `${plan === "starter" ? "Starter" : "Pro"} is now active. Candidate contact and eligible resume access are unlocked.`,
        "success"
      );
    } else {
      showPaymentStatus(
        "Payment was verified successfully. Plan activation is waiting for the Razorpay webhook. Refresh this page shortly; no second payment is required.",
        "info"
      );
    }
  }

  async function choosePlan(plan: PlanKey) {
    if (
      plan === "free" ||
      processingPlan
    ) {
      return;
    }

    setError("");
    setPaymentMessage("");
    setPaymentMessageType("");
    setProcessingPlan(plan);

    try {
      const accessToken =
        await getAccessToken();

      const scriptLoaded =
        await loadRazorpayScript();

      if (!scriptLoaded) {
        throw new Error(
          "Could not load Razorpay Checkout. Check your internet connection and try again."
        );
      }

      const orderResponse = await fetch(
        "/api/razorpay/create-order",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ plan }),
        }
      );

      const orderData =
        (await orderResponse.json()) as CreateOrderResponse;

      if (!orderResponse.ok) {
        throw new Error(
          orderData.error ||
            "Could not create payment order."
        );
      }

      if (!window.Razorpay) {
        throw new Error(
          "Razorpay Checkout is unavailable."
        );
      }

      const razorpay = new window.Razorpay({
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "FresherHire",
        description: `${orderData.planName} Recruiter Plan - 30 Days`,
        order_id: orderData.orderId,
        prefill: {
          name: orderData.companyName || "",
          email: orderData.companyEmail || "",
        },
        notes: {
          plan: orderData.plan,
        },
        theme: {
          color: "#2563eb",
        },
        retry: {
          enabled: true,
        },
        modal: {
          ondismiss: () => {
            setProcessingPlan(null);
            showPaymentStatus(
              "Payment window closed. No plan change was made.",
              "info"
            );
          },
        },
        handler: async (paymentResponse) => {
          try {
            showPaymentStatus(
              "Payment received. Verifying securely...",
              "info"
            );

            await verifyPayment(
              paymentResponse,
              plan,
              accessToken
            );
          } catch (verifyError) {
            console.error(
              "Payment verification error:",
              verifyError
            );

            showPaymentStatus(
              verifyError instanceof Error
                ? verifyError.message
                : "Payment verification failed.",
              "error"
            );
          } finally {
            setProcessingPlan(null);
          }
        },
      });

      razorpay.on(
        "payment.failed",
        (failure) => {
          console.error(
            "Razorpay payment failed:",
            failure
          );

          setProcessingPlan(null);

          showPaymentStatus(
            failure.error?.description ||
              "Payment failed. Please try again.",
            "error"
          );
        }
      );

      razorpay.open();
    } catch (err) {
      console.error(
        "Razorpay checkout error:",
        err
      );

      setProcessingPlan(null);

      showPaymentStatus(
        err instanceof Error
          ? err.message
          : "Could not start payment.",
        "error"
      );
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-900">
        <div className="text-center">
          <div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />
          <p className="mt-4 font-semibold">
            Loading pricing...
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Checking your recruiter plan
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <nav className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <Link
            href="/company/dashboard"
            className="text-2xl font-bold tracking-tight text-slate-950"
          >
            Fresher
            <span className="text-blue-600">
              Hire
            </span>
          </Link>

          <div className="flex items-center gap-3 sm:gap-5">
            <Link
              href="/company/candidates"
              className="hidden text-sm font-medium text-slate-600 hover:text-slate-950 sm:block"
            >
              Find Freshers
            </Link>

            <Link
              href="/company/jobs"
              className="hidden text-sm font-medium text-slate-600 hover:text-slate-950 md:block"
            >
              My Jobs
            </Link>

            <Link
              href="/company/dashboard"
              className="text-sm font-semibold text-slate-600 hover:text-slate-950"
            >
              Dashboard
            </Link>

            <NotificationBell />
          </div>
        </div>
      </nav>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-blue-600">
            Recruiter Plans
          </p>

          <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
            Hire faster with verified fresher talent
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-600">
            Browse candidates for free. Upgrade when you&apos;re ready to unlock private contact details and resumes.
          </p>
        </div>

        {error && (
          <div className="mx-auto mt-8 max-w-2xl rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {paymentMessage && (
          <div
            className={`mx-auto mt-8 max-w-2xl rounded-2xl border p-5 text-center ${
              paymentMessageType === "success"
                ? "border-green-200 bg-green-50 text-green-800"
                : paymentMessageType === "error"
                ? "border-red-200 bg-red-50 text-red-700"
                : "border-blue-200 bg-blue-50 text-blue-800"
            }`}
          >
            <p className="font-semibold">
              {paymentMessageType === "success"
                ? "Payment Successful"
                : paymentMessageType === "error"
                ? "Payment Issue"
                : "Payment Status"}
            </p>

            <p className="mt-2 text-sm leading-6">
              {paymentMessage}
            </p>

            {paymentMessageType === "info" && (
              <button
                type="button"
                onClick={() => loadPlan(false)}
                className="mt-4 rounded-xl border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100"
              >
                Refresh Plan
              </button>
            )}
          </div>
        )}

        <div className="mx-auto mt-8 max-w-3xl rounded-2xl border border-blue-200 bg-blue-50 p-5 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">
                Your Current Plan
              </p>

              <div className="mt-2 flex flex-wrap items-center gap-3">
                <h2 className="text-2xl font-bold text-slate-950">
                  {getCurrentPlanLabel()}
                </h2>

                <span
                  className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                    companyPlan?.subscription_status === "active"
                      ? "border-green-200 bg-green-50 text-green-700"
                      : "border-slate-200 bg-white text-slate-600"
                  }`}
                >
                  {getStatusLabel()}
                </span>
              </div>

              {companyPlan?.subscription_expires_at && (
                <p className="mt-2 text-sm text-slate-600">
                  Access until{" "}
                  {new Date(
                    companyPlan.subscription_expires_at
                  ).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              )}
            </div>

            <Link
              href="/company/candidates"
              className="w-fit rounded-xl border border-blue-200 bg-white px-5 py-3 text-sm font-semibold text-blue-700 shadow-sm hover:bg-blue-100"
            >
              Browse Candidates →
            </Link>
          </div>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {pricingPlans.map((plan) => {
            const current = isCurrentPlan(plan.key);
            const processing = processingPlan === plan.key;

            return (
              <div
                key={plan.key}
                className={`relative flex h-full flex-col rounded-3xl border bg-white p-6 shadow-sm sm:p-7 ${
                  plan.featured
                    ? "border-blue-300 shadow-lg shadow-blue-100/60"
                    : "border-slate-200"
                }`}
              >
                {plan.featured && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-blue-600 px-4 py-1.5 text-xs font-bold text-white shadow-sm">
                    Most Popular
                  </span>
                )}

                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-2xl font-bold text-slate-950">
                        {plan.name}
                      </h2>

                      <p className="mt-2 min-h-12 text-sm leading-6 text-slate-500">
                        {plan.description}
                      </p>
                    </div>

                    {current && (
                      <span className="shrink-0 rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                        Current
                      </span>
                    )}
                  </div>

                  <div className="mt-6">
                    <span className="text-4xl font-bold tracking-tight text-slate-950">
                      {plan.price}
                    </span>

                    <span className="ml-2 text-sm text-slate-500">
                      {plan.period}
                    </span>
                  </div>
                </div>

                <div className="mt-7 flex-1 border-t border-slate-200 pt-6">
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                    Includes
                  </p>

                  <div className="mt-4 space-y-3">
                    {plan.features.map((feature) => (
                      <div
                        key={feature}
                        className="flex items-start gap-3 text-sm leading-6 text-slate-700"
                      >
                        <span className="mt-0.5 text-green-600">
                          ✓
                        </span>

                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-8">
                  {current ? (
                    <button
                      type="button"
                      disabled
                      className="w-full cursor-not-allowed rounded-xl border border-green-200 bg-green-50 px-5 py-3 font-semibold text-green-700"
                    >
                      Current Plan
                    </button>
                  ) : plan.key === "free" ? (
                    <button
                      type="button"
                      disabled
                      className="w-full cursor-not-allowed rounded-xl border border-slate-300 bg-slate-100 px-5 py-3 font-semibold text-slate-500"
                    >
                      Free Plan
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => choosePlan(plan.key)}
                      disabled={Boolean(processingPlan)}
                      className={`w-full rounded-xl px-5 py-3 font-semibold shadow-sm transition disabled:cursor-not-allowed disabled:opacity-60 ${
                        plan.featured
                          ? "bg-blue-600 text-white hover:bg-blue-700"
                          : "border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
                      }`}
                    >
                      {processing
                        ? "Opening Checkout..."
                        : `Choose ${plan.name} →`}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mx-auto mt-8 max-w-2xl rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-sm">
          <p className="text-sm font-semibold text-slate-900">
            Secure checkout powered by Razorpay
          </p>

          <p className="mt-2 text-xs leading-5 text-slate-500">
            Starter and Pro purchases currently grant 30 days of access. This MVP payment flow does not auto-renew.
          </p>
        </div>

        <section className="mt-12 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">
                How Paid Access Works
              </p>

              <h2 className="mt-3 text-2xl font-bold text-slate-950">
                Candidate privacy stays protected
              </h2>

              <p className="mt-3 text-sm leading-7 text-slate-600">
                A paid plan does not automatically expose every fresher&apos;s private details. The candidate must also have applied to one of your jobs or been shortlisted by your company.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <FeatureCard
                title="Browse First"
                description="Review public profile evidence before paying to contact."
              />

              <FeatureCard
                title="Verified Evidence"
                description="Compare skills, assessments, and projects before outreach."
              />

              <FeatureCard
                title="Private Contacts"
                description="Email and phone unlock only for eligible paid recruiters."
              />

              <FeatureCard
                title="Secure Resumes"
                description="Private resume access follows the same paid-access rules."
              />
            </div>
          </div>
        </section>

        <div className="mt-10 text-center">
          <p className="text-sm text-slate-500">
            Need to continue browsing before upgrading?
          </p>

          <Link
            href="/company/candidates"
            className="mt-3 inline-block text-sm font-semibold text-blue-600 hover:text-blue-700"
          >
            Return to candidate search →
          </Link>
        </div>
      </section>
    </main>
  );
}

function FeatureCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <p className="font-semibold text-slate-950">
        {title}
      </p>

      <p className="mt-2 text-sm leading-6 text-slate-600">
        {description}
      </p>
    </div>
  );
}
