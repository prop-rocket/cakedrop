import Razorpay from "razorpay";

export const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

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
