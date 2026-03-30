"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Building2,
  Upload,
  Plus,
  Trash2,
  CheckCircle2,
  ArrowRight,
  Users,
  Loader2,
  ImageIcon,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Zod Schemas                                                        */
/* ------------------------------------------------------------------ */

const companySchema = z.object({
  name: z.string().min(1, "Company name is required"),
  phone: z.string().min(10, "Enter a valid phone number"),
  gstNumber: z.string().optional().or(z.literal("")),
  logoUrl: z.string().optional().or(z.literal("")),
});

type CompanyFormData = z.infer<typeof companySchema>;

const branchSchema = z.object({
  name: z.string().min(1, "Branch name is required"),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  pincode: z
    .string()
    .min(6, "Pincode must be 6 digits")
    .max(6, "Pincode must be 6 digits"),
  contactPerson: z.string().min(1, "Contact person is required"),
  contactPhone: z.string().min(10, "Enter a valid phone number"),
  deliveryWindow: z.enum(["MORNING", "AFTERNOON"]),
});

type BranchFormData = z.infer<typeof branchSchema>;

/* ------------------------------------------------------------------ */
/*  Progress Indicator                                                 */
/* ------------------------------------------------------------------ */

function ProgressIndicator({ currentStep }: { currentStep: number }) {
  const steps = [
    { num: 1, label: "Company Profile" },
    { num: 2, label: "Office Branches" },
    { num: 3, label: "Complete" },
  ];

  return (
    <div className="flex items-center justify-center gap-2 sm:gap-4 mb-10">
      {steps.map((step, idx) => (
        <div key={step.num} className="flex items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-2">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                currentStep > step.num
                  ? "bg-green-500 text-white"
                  : currentStep === step.num
                  ? "bg-orange-500 text-white"
                  : "bg-gray-200 text-gray-500"
              }`}
            >
              {currentStep > step.num ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                step.num
              )}
            </div>
            <span
              className={`hidden sm:inline text-sm font-medium ${
                currentStep >= step.num ? "text-gray-900" : "text-gray-400"
              }`}
            >
              {step.label}
            </span>
          </div>
          {idx < steps.length - 1 && (
            <div
              className={`w-8 sm:w-16 h-0.5 ${
                currentStep > step.num ? "bg-green-500" : "bg-gray-200"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Step 1: Company Profile                                            */
/* ------------------------------------------------------------------ */

function Step1CompanyProfile({
  onNext,
  defaultValues,
}: {
  onNext: (data: CompanyFormData) => void;
  defaultValues: Partial<CompanyFormData>;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(
    defaultValues.logoUrl || null
  );
  const [isDragging, setIsDragging] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<CompanyFormData>({
    resolver: zodResolver(companySchema),
    defaultValues,
  });

  const handleLogoDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    // MVP: just create a placeholder URL
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setLogoPreview(url);
      setValue("logoUrl", `logo-${Date.now()}.${file.name.split(".").pop()}`);
    }
  };

  const handleLogoClick = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const url = URL.createObjectURL(file);
        setLogoPreview(url);
        setValue("logoUrl", `logo-${Date.now()}.${file.name.split(".").pop()}`);
      }
    };
    input.click();
  };

  const onSubmit = async (data: CompanyFormData) => {
    setIsSubmitting(true);
    setApiError(null);
    try {
      const res = await fetch("/api/onboarding/company", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const body = await res.json();
      if (!res.ok) {
        setApiError(body.error || "Failed to save company profile.");
        return;
      }
      onNext(data);
    } catch {
      setApiError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
            <Building2 className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Company Profile
            </h2>
            <p className="text-sm text-gray-500">
              Tell us about your company
            </p>
          </div>
        </div>

        {apiError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {apiError}
          </div>
        )}

        <div className="space-y-5">
          {/* Company Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Company Name <span className="text-red-500">*</span>
            </label>
            <input
              {...register("name")}
              type="text"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-colors"
              placeholder="Acme Corp"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number <span className="text-red-500">*</span>
            </label>
            <input
              {...register("phone")}
              type="tel"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-colors"
              placeholder="9876543210"
            />
            {errors.phone && (
              <p className="mt-1 text-sm text-red-600">
                {errors.phone.message}
              </p>
            )}
          </div>

          {/* GST Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              GST Number{" "}
              <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              {...register("gstNumber")}
              type="text"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-colors"
              placeholder="22AAAAA0000A1Z5"
            />
          </div>

          {/* Logo Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Company Logo{" "}
              <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <div
              onClick={handleLogoClick}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleLogoDrop}
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                isDragging
                  ? "border-orange-400 bg-orange-50"
                  : "border-gray-300 hover:border-orange-300 hover:bg-orange-50/50"
              }`}
            >
              {logoPreview ? (
                <div className="flex flex-col items-center gap-2">
                  <img
                    src={logoPreview}
                    alt="Logo preview"
                    className="w-20 h-20 object-contain rounded-lg"
                  />
                  <p className="text-sm text-gray-500">
                    Click or drag to replace
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <ImageIcon className="w-10 h-10 text-gray-400" />
                  <p className="text-sm text-gray-600">
                    Drag & drop your logo here, or{" "}
                    <span className="text-orange-600 font-medium">browse</span>
                  </p>
                  <p className="text-xs text-gray-400">
                    PNG, JPG up to 2MB
                  </p>
                </div>
              )}
            </div>
            <input type="hidden" {...register("logoUrl")} />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center gap-2 px-6 py-2.5 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              Next
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </form>
  );
}

/* ------------------------------------------------------------------ */
/*  Step 2: Add Office Branches                                        */
/* ------------------------------------------------------------------ */

function Step2Branches({
  onNext,
  onBack,
}: {
  onNext: (branches: BranchFormData[]) => void;
  onBack: () => void;
}) {
  const [branches, setBranches] = useState<BranchFormData[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BranchFormData>({
    resolver: zodResolver(branchSchema),
    defaultValues: {
      city: "Chennai",
      deliveryWindow: "MORNING",
    },
  });

  const addBranch = (data: BranchFormData) => {
    setBranches((prev) => [...prev, data]);
    reset({
      name: "",
      address: "",
      city: "Chennai",
      pincode: "",
      contactPerson: "",
      contactPhone: "",
      deliveryWindow: "MORNING",
    });
  };

  const removeBranch = (index: number) => {
    setBranches((prev) => prev.filter((_, i) => i !== index));
  };

  const handleNext = async () => {
    if (branches.length === 0) {
      setApiError("Please add at least one branch before continuing.");
      return;
    }
    setIsSubmitting(true);
    setApiError(null);
    try {
      const res = await fetch("/api/onboarding/branches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ branches }),
      });
      const body = await res.json();
      if (!res.ok) {
        setApiError(body.error || "Failed to save branches.");
        return;
      }
      onNext(branches);
    } catch {
      setApiError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Branch Form */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
            <Building2 className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Add Office Branches
            </h2>
            <p className="text-sm text-gray-500">
              Add at least one branch where cakes will be delivered
            </p>
          </div>
        </div>

        {apiError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {apiError}
          </div>
        )}

        <form
          onSubmit={handleSubmit(addBranch)}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Branch Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Branch Name <span className="text-red-500">*</span>
              </label>
              <input
                {...register("name")}
                type="text"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-colors"
                placeholder="Head Office"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.name.message}
                </p>
              )}
            </div>

            {/* City */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                City <span className="text-red-500">*</span>
              </label>
              <select
                {...register("city")}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-colors bg-white"
              >
                <option value="Chennai">Chennai</option>
              </select>
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address <span className="text-red-500">*</span>
            </label>
            <input
              {...register("address")}
              type="text"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-colors"
              placeholder="123 Main Road, T. Nagar"
            />
            {errors.address && (
              <p className="mt-1 text-sm text-red-600">
                {errors.address.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Pincode */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pincode <span className="text-red-500">*</span>
              </label>
              <input
                {...register("pincode")}
                type="text"
                maxLength={6}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-colors"
                placeholder="600017"
              />
              {errors.pincode && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.pincode.message}
                </p>
              )}
            </div>

            {/* Contact Person */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contact Person <span className="text-red-500">*</span>
              </label>
              <input
                {...register("contactPerson")}
                type="text"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-colors"
                placeholder="Rajesh Kumar"
              />
              {errors.contactPerson && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.contactPerson.message}
                </p>
              )}
            </div>

            {/* Contact Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contact Phone <span className="text-red-500">*</span>
              </label>
              <input
                {...register("contactPhone")}
                type="tel"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-colors"
                placeholder="9876543210"
              />
              {errors.contactPhone && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.contactPhone.message}
                </p>
              )}
            </div>
          </div>

          {/* Delivery Window */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Delivery Window <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  {...register("deliveryWindow")}
                  type="radio"
                  value="MORNING"
                  className="w-4 h-4 text-orange-500 focus:ring-orange-500"
                />
                <span className="text-sm text-gray-700">
                  Morning (9 AM - 12 PM)
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  {...register("deliveryWindow")}
                  type="radio"
                  value="AFTERNOON"
                  className="w-4 h-4 text-orange-500 focus:ring-orange-500"
                />
                <span className="text-sm text-gray-700">
                  Afternoon (1 PM - 4 PM)
                </span>
              </label>
            </div>
          </div>

          <button
            type="submit"
            className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Branch
          </button>
        </form>
      </div>

      {/* Branch List */}
      {branches.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700">
            Added Branches ({branches.length})
          </h3>
          {branches.map((branch, idx) => (
            <div
              key={idx}
              className="bg-white rounded-lg border border-gray-100 shadow-sm p-4 flex items-start justify-between gap-4"
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900">{branch.name}</p>
                <p className="text-sm text-gray-500 truncate">
                  {branch.address}, {branch.city} - {branch.pincode}
                </p>
                <p className="text-sm text-gray-500">
                  {branch.contactPerson} &middot; {branch.contactPhone} &middot;{" "}
                  <span className="capitalize">
                    {branch.deliveryWindow.toLowerCase()}
                  </span>{" "}
                  delivery
                </p>
              </div>
              <button
                onClick={() => removeBranch(idx)}
                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
        >
          Back
        </button>
        <button
          onClick={handleNext}
          disabled={isSubmitting}
          className="flex items-center gap-2 px-6 py-2.5 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              Next
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Step 3: Complete                                                    */
/* ------------------------------------------------------------------ */

function Step3Complete({
  companyData,
  branches,
}: {
  companyData: CompanyFormData | null;
  branches: BranchFormData[];
}) {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sm:p-8 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          You&apos;re All Set!
        </h2>
        <p className="text-gray-500 mb-8">
          Your company onboarding is complete. Here&apos;s a summary of what was
          set up.
        </p>

        {/* Summary */}
        <div className="text-left space-y-4 max-w-md mx-auto">
          {companyData && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Company
              </h3>
              <p className="text-sm text-gray-900">{companyData.name}</p>
              <p className="text-sm text-gray-500">{companyData.phone}</p>
              {companyData.gstNumber && (
                <p className="text-sm text-gray-500">
                  GST: {companyData.gstNumber}
                </p>
              )}
            </div>
          )}

          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Branches ({branches.length})
            </h3>
            {branches.map((b, i) => (
              <div
                key={i}
                className={`text-sm ${i > 0 ? "mt-2 pt-2 border-t border-gray-200" : ""}`}
              >
                <p className="text-gray-900 font-medium">{b.name}</p>
                <p className="text-gray-500">
                  {b.address}, {b.city} - {b.pincode}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-center gap-3">
        <button
          onClick={() => router.push("/dashboard")}
          className="flex items-center justify-center gap-2 px-6 py-2.5 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors"
        >
          Go to Dashboard
          <ArrowRight className="w-4 h-4" />
        </button>
        <button
          onClick={() => router.push("/dashboard/employees")}
          className="flex items-center justify-center gap-2 px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
        >
          <Upload className="w-4 h-4" />
          Upload Employees
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Onboarding Page                                               */
/* ------------------------------------------------------------------ */

export default function OnboardingPage() {
  const { data: session } = useSession();
  const [step, setStep] = useState(1);
  const [companyData, setCompanyData] = useState<CompanyFormData | null>(null);
  const [savedBranches, setSavedBranches] = useState<BranchFormData[]>([]);

  const companyName = (session?.user as any)?.companyName || "";

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FFFBF7" }}>
      <div className="max-w-2xl mx-auto px-4 py-10 sm:py-16">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome to CakeDrop
          </h1>
          <p className="text-gray-500 mt-2">
            Let&apos;s get your company set up in a few quick steps.
          </p>
        </div>

        {/* Progress */}
        <ProgressIndicator currentStep={step} />

        {/* Steps */}
        {step === 1 && (
          <Step1CompanyProfile
            defaultValues={{ name: companyName, phone: "", gstNumber: "", logoUrl: "" }}
            onNext={(data) => {
              setCompanyData(data);
              setStep(2);
            }}
          />
        )}

        {step === 2 && (
          <Step2Branches
            onBack={() => setStep(1)}
            onNext={(branches) => {
              setSavedBranches(branches);
              setStep(3);
            }}
          />
        )}

        {step === 3 && (
          <Step3Complete companyData={companyData} branches={savedBranches} />
        )}
      </div>
    </div>
  );
}
