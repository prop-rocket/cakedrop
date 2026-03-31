import Razorpay from "razorpay";

let _razorpay: Razorpay | null = null;

export function getRazorpay(): Razorpay {
  if (!_razorpay) {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      throw new Error("RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be set");
    }
    _razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return _razorpay;
}

export const PLANS = {
  STARTER: {
    name: "Starter",
    pricePerEmployee: 149,
    billingCycle: "monthly",
    cakeSize: "500g",
    features: [
      "500g cake per birthday",
      "Printed birthday card",
      "Email notifications",
      "Basic dashboard",
    ],
  },
  GROWTH: {
    name: "Growth",
    pricePerEmployee: 129,
    billingCycle: "quarterly",
    cakeSize: "500g",
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
    pricePerEmployee: 99,
    billingCycle: "yearly",
    cakeSize: "1kg",
    features: [
      "1kg cake per birthday",
      "Premium birthday card",
      "Custom CEO message",
      "Dedicated account manager",
      "Custom card designs",
      "API access",
    ],
  },
} as const;
