"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import {
  Save,
  Palette,
  Flower2,
  Type,
  Sparkles,
  Loader2,
  CheckCircle2,
} from "lucide-react";

interface CardSettings {
  defaultCardMessage: string;
  defaultCardSignedBy: string;
  cardTemplateId: string;
  logoUrl: string | null;
}

interface FormValues {
  defaultCardMessage: string;
  defaultCardSignedBy: string;
  cardTemplateId: string;
}

const TEMPLATES = [
  {
    id: "classic",
    name: "Classic",
    description: "Elegant, cream background",
    icon: Palette,
    bgColor: "#FFFDF5",
    borderColor: "#D4A574",
    textColor: "#5C3D2E",
    accentColor: "#8B6914",
    headingFont: "serif",
  },
  {
    id: "floral",
    name: "Floral",
    description: "Flowers border",
    icon: Flower2,
    bgColor: "#FFF5F7",
    borderColor: "#E8A0BF",
    textColor: "#6B2140",
    accentColor: "#D4507A",
    headingFont: "serif",
  },
  {
    id: "modern",
    name: "Modern",
    description: "Minimalist, bold typography",
    icon: Type,
    bgColor: "#FAFAFA",
    borderColor: "#333333",
    textColor: "#1A1A1A",
    accentColor: "#E8553A",
    headingFont: "sans-serif",
  },
  {
    id: "elegant",
    name: "Elegant",
    description: "Gold accents",
    icon: Sparkles,
    bgColor: "#FEFDFB",
    borderColor: "#C9A84C",
    textColor: "#2C2C2C",
    accentColor: "#C9A84C",
    headingFont: "serif",
  },
] as const;

function getTemplate(id: string) {
  return TEMPLATES.find((t) => t.id === id) || TEMPLATES[0];
}

export default function CardsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      defaultCardMessage:
        "Wishing you a wonderful birthday filled with joy and celebration!",
      defaultCardSignedBy: "The HR Team",
      cardTemplateId: "classic",
    },
  });

  const watchMessage = watch("defaultCardMessage");
  const watchSignedBy = watch("defaultCardSignedBy");
  const watchTemplate = watch("cardTemplateId");

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch("/api/cards/settings");
        if (res.ok) {
          const data: CardSettings = await res.json();
          setValue(
            "defaultCardMessage",
            data.defaultCardMessage ||
              "Wishing you a wonderful birthday filled with joy and celebration!"
          );
          setValue("defaultCardSignedBy", data.defaultCardSignedBy || "The HR Team");
          setValue("cardTemplateId", data.cardTemplateId || "classic");
          setLogoUrl(data.logoUrl);
        }
      } catch {
        // Use defaults
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, [setValue]);

  async function onSubmit(data: FormValues) {
    setSaving(true);
    setSaveSuccess(false);
    try {
      const res = await fetch("/api/cards/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch {
      // Error handling
    } finally {
      setSaving(false);
    }
  }

  const selectedTemplate = getTemplate(watchTemplate);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <div className="h-8 w-72 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-48 bg-gray-200 rounded animate-pulse mt-2" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-card shadow-sm border border-gray-100 p-6 h-[500px] animate-pulse" />
          <div className="bg-white rounded-card shadow-sm border border-gray-100 p-6 h-[500px] animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold font-heading text-dark">
          Birthday Card Customization
        </h1>
        <p className="text-gray-500 font-body mt-1">
          Customize the birthday card sent to your employees
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Card Settings Form */}
        <div className="bg-white rounded-card shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold font-heading text-dark mb-5">
            Card Settings
          </h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Default Message */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Default Message
              </label>
              <textarea
                {...register("defaultCardMessage", {
                  required: "Message is required",
                  maxLength: {
                    value: 500,
                    message: "Message must be under 500 characters",
                  },
                })}
                rows={4}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm font-body focus:outline-none focus:ring-2 focus:ring-[#E8553A]/20 focus:border-[#E8553A] resize-none transition-colors"
                placeholder="Enter your birthday message..."
              />
              {errors.defaultCardMessage && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.defaultCardMessage.message}
                </p>
              )}
              <p className="text-xs text-gray-400 mt-1">
                {watchMessage?.length || 0}/500 characters
              </p>
            </div>

            {/* Signed By */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Signed By
              </label>
              <input
                type="text"
                {...register("defaultCardSignedBy", {
                  required: "Signed by is required",
                  maxLength: {
                    value: 100,
                    message: "Must be under 100 characters",
                  },
                })}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm font-body focus:outline-none focus:ring-2 focus:ring-[#E8553A]/20 focus:border-[#E8553A] transition-colors"
                placeholder='e.g., "The HR Team" or CEO name'
              />
              {errors.defaultCardSignedBy && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.defaultCardSignedBy.message}
                </p>
              )}
            </div>

            {/* Template Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Card Template
              </label>
              <div className="grid grid-cols-2 gap-3">
                {TEMPLATES.map((template) => {
                  const Icon = template.icon;
                  const isSelected = watchTemplate === template.id;
                  return (
                    <button
                      key={template.id}
                      type="button"
                      onClick={() => setValue("cardTemplateId", template.id)}
                      className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                        isSelected
                          ? "border-[#E8553A] bg-[#FFF0ED] shadow-sm"
                          : "border-gray-200 bg-white hover:border-gray-300"
                      }`}
                    >
                      {isSelected && (
                        <span className="absolute top-2 right-2 w-5 h-5 bg-[#E8553A] rounded-full flex items-center justify-center">
                          <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                        </span>
                      )}
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: template.bgColor }}
                      >
                        <Icon
                          className="w-5 h-5"
                          style={{ color: template.accentColor }}
                        />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium text-dark">
                          {template.name}
                        </p>
                        <p className="text-xs text-gray-400">
                          {template.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Save Button */}
            <button
              type="submit"
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#E8553A] text-white font-medium text-sm rounded-lg hover:bg-[#D4472E] disabled:opacity-50 transition-colors"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : saveSuccess ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {saving
                ? "Saving..."
                : saveSuccess
                ? "Settings Saved!"
                : "Save Settings"}
            </button>
          </form>
        </div>

        {/* Right: Live Card Preview */}
        <div className="bg-white rounded-card shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold font-heading text-dark mb-5">
            Live Preview
          </h2>

          <div className="flex justify-center">
            <div
              className="w-[350px] rounded-2xl overflow-hidden shadow-lg"
              style={{
                backgroundColor: selectedTemplate.bgColor,
                border: `2px solid ${selectedTemplate.borderColor}`,
              }}
            >
              {/* Decorative top strip */}
              <div
                className="h-2"
                style={{ backgroundColor: selectedTemplate.accentColor }}
              />

              <div className="p-8 text-center space-y-6">
                {/* Logo placeholder */}
                <div className="flex justify-center">
                  {logoUrl ? (
                    <img
                      src={logoUrl}
                      alt="Company logo"
                      className="h-10 object-contain"
                    />
                  ) : (
                    <div
                      className="px-4 py-2 rounded-lg text-xs font-medium"
                      style={{
                        backgroundColor: `${selectedTemplate.accentColor}15`,
                        color: selectedTemplate.accentColor,
                        border: `1px dashed ${selectedTemplate.accentColor}40`,
                      }}
                    >
                      Your Logo
                    </div>
                  )}
                </div>

                {/* Heading */}
                <h3
                  className="text-xl font-bold leading-tight"
                  style={{
                    color: selectedTemplate.textColor,
                    fontFamily: selectedTemplate.headingFont,
                  }}
                >
                  Happy Birthday, {"{Employee Name}"}!
                </h3>

                {/* Divider */}
                <div className="flex items-center justify-center gap-3">
                  <div
                    className="h-px w-12"
                    style={{ backgroundColor: `${selectedTemplate.borderColor}60` }}
                  />
                  <Sparkles
                    className="w-4 h-4"
                    style={{ color: selectedTemplate.accentColor }}
                  />
                  <div
                    className="h-px w-12"
                    style={{ backgroundColor: `${selectedTemplate.borderColor}60` }}
                  />
                </div>

                {/* Message */}
                <p
                  className="text-sm leading-relaxed"
                  style={{
                    color: `${selectedTemplate.textColor}CC`,
                    fontFamily: selectedTemplate.headingFont,
                  }}
                >
                  {watchMessage ||
                    "Wishing you a wonderful birthday filled with joy and celebration!"}
                </p>

                {/* Signed by */}
                <p
                  className="text-sm italic"
                  style={{ color: selectedTemplate.accentColor }}
                >
                  — {watchSignedBy || "The HR Team"}
                </p>
              </div>

              {/* Decorative bottom strip */}
              <div
                className="h-2"
                style={{ backgroundColor: selectedTemplate.accentColor }}
              />
            </div>
          </div>

          <p className="text-xs text-gray-400 text-center mt-4">
            This is how the birthday card will appear for each employee
          </p>
        </div>
      </div>
    </div>
  );
}
