"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Upload,
  Building2,
  Cake,
  Truck,
  CreditCard,
  BarChart3,
  Check,
  ArrowRight,
  Star,
  Users,
  Clock,
  Menu,
  X,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Navbar                                                             */
/* ------------------------------------------------------------------ */
function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-1.5">
          <span className="text-2xl">🎂</span>
          <span className="text-xl font-heading font-extrabold text-primary">
            CakeDrop
          </span>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-8 font-body text-sm text-gray-600">
          <a href="#features" className="hover:text-primary transition-colors">
            Features
          </a>
          <a
            href="#how-it-works"
            className="hover:text-primary transition-colors"
          >
            How It Works
          </a>
          <a href="#pricing" className="hover:text-primary transition-colors">
            Pricing
          </a>
        </div>

        {/* Desktop CTAs */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/login"
            className="font-body text-sm text-gray-600 hover:text-dark transition-colors px-4 py-2"
          >
            Login
          </Link>
          <Link
            href="/signup"
            className="font-body text-sm bg-primary text-white px-5 py-2.5 rounded-xl hover:bg-primary-600 transition-colors shadow-sm hover:shadow-button-hover"
          >
            Start Free Trial
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden text-dark"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 pb-4 pt-2 space-y-3 font-body text-sm">
          <a
            href="#features"
            className="block text-gray-600 hover:text-primary"
            onClick={() => setMobileOpen(false)}
          >
            Features
          </a>
          <a
            href="#how-it-works"
            className="block text-gray-600 hover:text-primary"
            onClick={() => setMobileOpen(false)}
          >
            How It Works
          </a>
          <a
            href="#pricing"
            className="block text-gray-600 hover:text-primary"
            onClick={() => setMobileOpen(false)}
          >
            Pricing
          </a>
          <hr className="border-gray-100" />
          <Link href="/login" className="block text-gray-600">
            Login
          </Link>
          <Link
            href="/signup"
            className="block text-center bg-primary text-white px-5 py-2.5 rounded-xl"
          >
            Start Free Trial
          </Link>
        </div>
      )}
    </nav>
  );
}

/* ------------------------------------------------------------------ */
/*  Hero                                                               */
/* ------------------------------------------------------------------ */
function Hero() {
  const stats = [
    { icon: Building2, value: "500+", label: "Companies" },
    { icon: Cake, value: "50K+", label: "Cakes Delivered" },
    { icon: Clock, value: "98%", label: "On-Time" },
  ];

  return (
    <section className="bg-light-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Copy */}
          <div className="space-y-8">
            <h1 className="font-heading font-extrabold text-4xl sm:text-5xl lg:text-6xl text-dark leading-tight">
              Every Employee Deserves to Feel{" "}
              <span className="text-primary">Celebrated</span>
            </h1>
            <p className="font-body text-gray-500 text-lg max-w-lg">
              Automate birthday celebrations across your entire organisation.
              Upload your team, pick a plan, and we handle cakes, cards &amp;
              delivery — so no birthday ever slips through the cracks.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 bg-primary text-white font-body font-bold px-7 py-3.5 rounded-xl hover:bg-primary-600 transition-colors shadow-sm hover:shadow-button-hover"
              >
                Start Free Trial
                <ArrowRight size={18} />
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex items-center gap-2 border-2 border-primary text-primary font-body font-bold px-7 py-3.5 rounded-xl hover:bg-primary-50 transition-colors"
              >
                See How It Works
              </a>
            </div>
          </div>

          {/* Decorative stats area */}
          <div className="relative flex items-center justify-center">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-card p-8 space-y-6">
              <div className="text-center space-y-2">
                <span className="text-6xl">🎂</span>
                <p className="font-heading font-bold text-dark text-xl">
                  Trusted by teams everywhere
                </p>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {stats.map((s) => (
                  <div
                    key={s.label}
                    className="bg-card-bg rounded-2xl p-4 text-center space-y-1"
                  >
                    <s.icon className="mx-auto text-primary" size={22} />
                    <p className="font-heading font-extrabold text-dark text-lg">
                      {s.value}
                    </p>
                    <p className="font-body text-gray-500 text-xs">
                      {s.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Features Grid                                                      */
/* ------------------------------------------------------------------ */
const features = [
  {
    icon: Upload,
    title: "CSV Upload",
    desc: "Bulk upload employees via a simple CSV — birthdays, preferences and branch info in one go.",
  },
  {
    icon: Building2,
    title: "Multi-Branch",
    desc: "Manage multiple offices and locations from a single dashboard with branch-level controls.",
  },
  {
    icon: Cake,
    title: "Cake Preferences",
    desc: "Support for Eggless, Vegan, Sugar-free and other dietary needs so every team member is covered.",
  },
  {
    icon: Truck,
    title: "Auto-Delivery",
    desc: "Automated ordering and delivery — cakes arrive on the right day at the right office, every time.",
  },
  {
    icon: CreditCard,
    title: "Card Customisation",
    desc: "Branded birthday cards with your company logo and a personal message from the team.",
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    desc: "Track deliveries, upcoming birthdays and monthly spend with real-time charts and reports.",
  },
];

function Features() {
  return (
    <section id="features" className="bg-white py-20 lg:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="inline-block font-body text-primary text-sm font-bold bg-card-bg px-4 py-1.5 rounded-full mb-4">
            Features
          </span>
          <h2 className="font-heading font-extrabold text-3xl sm:text-4xl text-dark">
            Everything You Need to Celebrate Your Team
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <div
              key={f.title}
              className="bg-light-bg rounded-2xl p-7 space-y-4 hover:shadow-card transition-shadow"
            >
              <div className="w-12 h-12 rounded-xl bg-card-bg flex items-center justify-center text-primary">
                <f.icon size={24} />
              </div>
              <h3 className="font-heading font-bold text-dark text-lg">
                {f.title}
              </h3>
              <p className="font-body text-gray-500 text-sm leading-relaxed">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  How It Works                                                       */
/* ------------------------------------------------------------------ */
const steps = [
  {
    num: 1,
    title: "Upload Your Team",
    desc: "Import your employee list with a CSV or add them manually — include birthdays and cake preferences.",
  },
  {
    num: 2,
    title: "We Handle the Rest",
    desc: "Our system schedules orders, coordinates with local bakeries and arranges delivery for every birthday.",
  },
  {
    num: 3,
    title: "Smiles Delivered",
    desc: "A freshly baked cake and a personalised card land at the right office — delighting your team every time.",
  },
];

function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-light-bg py-20 lg:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="inline-block font-body text-primary text-sm font-bold bg-card-bg px-4 py-1.5 rounded-full mb-4">
            How It Works
          </span>
          <h2 className="font-heading font-extrabold text-3xl sm:text-4xl text-dark">
            Three Simple Steps to Happier Teams
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((s) => (
            <div key={s.num} className="text-center space-y-5">
              <div className="mx-auto w-14 h-14 rounded-full bg-primary text-white flex items-center justify-center font-heading font-extrabold text-xl">
                {s.num}
              </div>
              <h3 className="font-heading font-bold text-dark text-xl">
                {s.title}
              </h3>
              <p className="font-body text-gray-500 text-sm leading-relaxed max-w-xs mx-auto">
                {s.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Pricing                                                            */
/* ------------------------------------------------------------------ */
interface Plan {
  name: string;
  price: string;
  billing: string;
  popular: boolean;
  features: string[];
}

const plans: Plan[] = [
  {
    name: "Starter",
    price: "₹149",
    billing: "per employee / month · billed monthly",
    popular: false,
    features: [
      "500 g cake per birthday",
      "Printed birthday card",
      "CSV upload",
      "Email reminders",
      "Basic analytics",
    ],
  },
  {
    name: "Growth",
    price: "₹129",
    billing: "per employee / month · billed quarterly",
    popular: true,
    features: [
      "500 g cake per birthday",
      "Premium birthday card",
      "Company branding on card",
      "Multi-branch support",
      "Priority delivery",
      "Advanced analytics",
    ],
  },
  {
    name: "Enterprise",
    price: "₹99",
    billing: "per employee / month · billed yearly",
    popular: false,
    features: [
      "1 kg cake per birthday",
      "Premium birthday card",
      "Custom personal message",
      "Dedicated account manager",
      "API access",
      "Custom integrations",
    ],
  },
];

function Pricing() {
  return (
    <section id="pricing" className="bg-white py-20 lg:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="inline-block font-body text-primary text-sm font-bold bg-card-bg px-4 py-1.5 rounded-full mb-4">
            Pricing
          </span>
          <h2 className="font-heading font-extrabold text-3xl sm:text-4xl text-dark">
            Simple, Transparent Pricing
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8 items-start">
          {plans.map((p) => (
            <div
              key={p.name}
              className={`relative rounded-2xl p-8 space-y-6 ${
                p.popular
                  ? "bg-dark text-white ring-4 ring-primary shadow-card"
                  : "bg-light-bg text-dark"
              }`}
            >
              {p.popular && (
                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-primary text-white text-xs font-body font-bold px-4 py-1 rounded-full flex items-center gap-1">
                  <Star size={12} /> Most Popular
                </span>
              )}

              <div>
                <h3 className="font-heading font-bold text-xl">{p.name}</h3>
                <div className="mt-3 flex items-end gap-1">
                  <span className="font-heading font-extrabold text-4xl">
                    {p.price}
                  </span>
                </div>
                <p
                  className={`font-body text-sm mt-1 ${
                    p.popular ? "text-gray-300" : "text-gray-500"
                  }`}
                >
                  {p.billing}
                </p>
              </div>

              <ul className="space-y-3">
                {p.features.map((feat) => (
                  <li
                    key={feat}
                    className="flex items-start gap-2 font-body text-sm"
                  >
                    <Check
                      size={16}
                      className={`mt-0.5 shrink-0 ${
                        p.popular ? "text-primary-200" : "text-primary"
                      }`}
                    />
                    <span
                      className={p.popular ? "text-gray-200" : "text-gray-600"}
                    >
                      {feat}
                    </span>
                  </li>
                ))}
              </ul>

              <Link
                href="/signup"
                className={`block text-center font-body font-bold text-sm py-3 rounded-xl transition-colors ${
                  p.popular
                    ? "bg-primary text-white hover:bg-primary-600"
                    : "bg-white text-primary border-2 border-primary hover:bg-primary-50"
                }`}
              >
                Get Started
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  CTA Section                                                        */
/* ------------------------------------------------------------------ */
function CtaSection() {
  return (
    <section className="bg-primary py-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
        <h2 className="font-heading font-extrabold text-3xl sm:text-4xl text-white">
          Ready to Make Every Birthday Special?
        </h2>
        <p className="font-body text-primary-100 text-lg max-w-xl mx-auto">
          Join hundreds of companies that never miss an employee birthday. Start
          your free trial today — no credit card required.
        </p>
        <Link
          href="/signup"
          className="inline-flex items-center gap-2 bg-white text-primary font-body font-bold px-8 py-4 rounded-xl hover:bg-primary-50 transition-colors"
        >
          Start Free Trial
          <ArrowRight size={18} />
        </Link>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Footer                                                             */
/* ------------------------------------------------------------------ */
function Footer() {
  return (
    <footer className="bg-dark text-gray-400 py-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-1.5">
              <span className="text-2xl">🎂</span>
              <span className="text-xl font-heading font-extrabold text-white">
                CakeDrop
              </span>
            </Link>
            <p className="font-body text-sm leading-relaxed">
              Automated birthday cake deliveries for companies that care about
              their people.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-heading font-bold text-white text-sm mb-4">
              Product
            </h4>
            <ul className="space-y-2 font-body text-sm">
              <li>
                <a href="#features" className="hover:text-white transition-colors">
                  Features
                </a>
              </li>
              <li>
                <a href="#pricing" className="hover:text-white transition-colors">
                  Pricing
                </a>
              </li>
              <li>
                <a href="#how-it-works" className="hover:text-white transition-colors">
                  How It Works
                </a>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-heading font-bold text-white text-sm mb-4">
              Company
            </h4>
            <ul className="space-y-2 font-body text-sm">
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  About
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Blog
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Careers
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-heading font-bold text-white text-sm mb-4">
              Legal
            </h4>
            <ul className="space-y-2 font-body text-sm">
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Refund Policy
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4 font-body text-xs">
          <p>&copy; {new Date().getFullYear()} CakeDrop. All rights reserved.</p>
          <p>Made with ❤️ in Chennai</p>
        </div>
      </div>
    </footer>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */
export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white">
      <Navbar />
      <Hero />
      <Features />
      <HowItWorks />
      <Pricing />
      <CtaSection />
      <Footer />
    </main>
  );
}
