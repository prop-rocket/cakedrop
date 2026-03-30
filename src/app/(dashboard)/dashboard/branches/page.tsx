"use client";

import { useEffect, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Building2,
  MapPin,
  Phone,
  User,
  Clock,
  Plus,
  Pencil,
  Trash2,
  X,
  Loader2,
  Users,
} from "lucide-react";

// ---------- Types ----------

interface Branch {
  id: string;
  name: string;
  address: string;
  city: string;
  pincode: string;
  contactPerson: string;
  contactPhone: string;
  deliveryWindow: "MORNING" | "AFTERNOON";
  isActive: boolean;
  employeeCount: number;
  createdAt: string;
  updatedAt: string;
}

// ---------- Zod Schema ----------

const branchFormSchema = z.object({
  name: z.string().min(1, "Branch name is required"),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  pincode: z
    .string()
    .min(6, "Pincode must be 6 digits")
    .max(6, "Pincode must be 6 digits")
    .regex(/^\d{6}$/, "Pincode must be 6 digits"),
  contactPerson: z.string().min(1, "Contact person is required"),
  contactPhone: z
    .string()
    .min(10, "Phone must be 10 digits")
    .max(10, "Phone must be 10 digits")
    .regex(/^\d{10}$/, "Phone must be 10 digits"),
  deliveryWindow: z.enum(["MORNING", "AFTERNOON"]),
});

type BranchFormValues = z.infer<typeof branchFormSchema>;

// ---------- City Availability Data ----------

const CITY_AVAILABILITY = [
  { name: "Chennai", status: "Live" as const },
  { name: "Bangalore", status: "Coming Soon" as const },
  { name: "Hyderabad", status: "Coming Soon" as const },
];

// ---------- Component ----------

export default function BranchesPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<BranchFormValues>({
    resolver: zodResolver(branchFormSchema),
    defaultValues: {
      name: "",
      address: "",
      city: "Chennai",
      pincode: "",
      contactPerson: "",
      contactPhone: "",
      deliveryWindow: "MORNING",
    },
  });

  const watchDeliveryWindow = watch("deliveryWindow");

  // ---------- Fetch Branches ----------

  const fetchBranches = useCallback(async () => {
    try {
      const res = await fetch("/api/branches");
      if (res.ok) {
        const data = await res.json();
        setBranches(data.branches || []);
      }
    } catch {
      // Silent fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

  // ---------- Open Modal ----------

  function openAddModal() {
    setEditingBranch(null);
    reset({
      name: "",
      address: "",
      city: "Chennai",
      pincode: "",
      contactPerson: "",
      contactPhone: "",
      deliveryWindow: "MORNING",
    });
    setApiError(null);
    setModalOpen(true);
  }

  function openEditModal(branch: Branch) {
    setEditingBranch(branch);
    reset({
      name: branch.name,
      address: branch.address,
      city: branch.city,
      pincode: branch.pincode,
      contactPerson: branch.contactPerson,
      contactPhone: branch.contactPhone,
      deliveryWindow: branch.deliveryWindow,
    });
    setApiError(null);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingBranch(null);
    setApiError(null);
  }

  // ---------- Submit (Create / Update) ----------

  async function onSubmit(data: BranchFormValues) {
    setSubmitting(true);
    setApiError(null);

    try {
      const isEdit = !!editingBranch;
      const url = "/api/branches";
      const method = isEdit ? "PUT" : "POST";
      const body = isEdit ? { ...data, id: editingBranch.id } : data;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        closeModal();
        await fetchBranches();
      } else {
        const errData = await res.json();
        setApiError(errData.error || "Something went wrong");
      }
    } catch {
      setApiError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  // ---------- Delete ----------

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this branch?")) return;

    setDeletingId(id);
    try {
      const res = await fetch(`/api/branches?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        await fetchBranches();
      } else {
        const errData = await res.json();
        alert(errData.error || "Failed to delete branch");
      }
    } catch {
      alert("Network error. Please try again.");
    } finally {
      setDeletingId(null);
    }
  }

  // ---------- Loading Skeleton ----------

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-64 bg-gray-200 rounded animate-pulse mt-2" />
          </div>
          <div className="h-10 w-32 bg-gray-200 rounded-lg animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-card shadow-sm border border-gray-100 p-6 h-56 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  // ---------- Render ----------

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-heading text-dark">
            Branches
          </h1>
          <p className="text-gray-500 font-body mt-1">
            Manage your office branches and delivery locations
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#E8553A] text-white font-medium text-sm rounded-lg hover:bg-[#D4472E] transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Branch
        </button>
      </div>

      {/* Branch Cards Grid */}
      {branches.length === 0 ? (
        <div className="bg-white rounded-card shadow-sm border border-gray-100 p-12 text-center">
          <Building2 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500 font-body">
            No branches yet. Add your first branch to get started.
          </p>
          <button
            onClick={openAddModal}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 bg-[#E8553A] text-white font-medium text-sm rounded-lg hover:bg-[#D4472E] transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Branch
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {branches.map((branch) => (
            <div
              key={branch.id}
              className="bg-white rounded-card border border-gray-100 p-6 shadow-sm hover:shadow-card transition-shadow"
            >
              {/* Card Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#FFF0ED] flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-[#E8553A]" />
                  </div>
                  <div>
                    <h3 className="font-bold font-heading text-dark">
                      {branch.name}
                    </h3>
                    <span
                      className={`inline-block mt-0.5 px-2 py-0.5 rounded-badge text-xs font-medium ${
                        branch.isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {branch.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(branch)}
                    className="p-2 text-gray-400 hover:text-[#E8553A] hover:bg-[#FFF0ED] rounded-lg transition-colors"
                    title="Edit branch"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(branch.id)}
                    disabled={deletingId === branch.id}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                    title="Delete branch"
                  >
                    {deletingId === branch.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Card Details */}
              <div className="space-y-2.5 text-sm font-body">
                <div className="flex items-start gap-2.5 text-gray-600">
                  <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                  <span>
                    {branch.address}, {branch.city} - {branch.pincode}
                  </span>
                </div>
                <div className="flex items-center gap-2.5 text-gray-600">
                  <User className="w-4 h-4 text-gray-400 shrink-0" />
                  <span>{branch.contactPerson}</span>
                </div>
                <div className="flex items-center gap-2.5 text-gray-600">
                  <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                  <span>{branch.contactPhone}</span>
                </div>
                <div className="flex items-center gap-2.5 text-gray-600">
                  <Clock className="w-4 h-4 text-gray-400 shrink-0" />
                  <span>
                    {branch.deliveryWindow === "MORNING"
                      ? "Morning (9 AM - 12 PM)"
                      : "Afternoon (1 PM - 5 PM)"}
                  </span>
                </div>
                <div className="flex items-center gap-2.5 text-gray-600">
                  <Users className="w-4 h-4 text-gray-400 shrink-0" />
                  <span>
                    {branch.employeeCount}{" "}
                    {branch.employeeCount === 1 ? "employee" : "employees"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* City Availability */}
      <div className="bg-white rounded-card shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-bold font-heading text-dark mb-4">
          City Availability
        </h2>
        <div className="flex flex-wrap gap-3">
          {CITY_AVAILABILITY.map((city) => (
            <div
              key={city.name}
              className="flex items-center gap-2.5 px-4 py-2.5 border border-gray-100 rounded-xl"
            >
              <MapPin className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-medium text-dark font-body">
                {city.name}
              </span>
              <span
                className={`inline-block px-2.5 py-0.5 rounded-badge text-xs font-medium ${
                  city.status === "Live"
                    ? "bg-green-100 text-green-700"
                    : "bg-yellow-100 text-yellow-700"
                }`}
              >
                {city.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ---------- Add / Edit Branch Modal ---------- */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={closeModal}
          />

          {/* Modal Panel */}
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold font-heading text-dark">
                {editingBranch ? "Edit Branch" : "Add Branch"}
              </h2>
              <button
                onClick={closeModal}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              {apiError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  {apiError}
                </div>
              )}

              {/* Branch Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Branch Name
                </label>
                <input
                  type="text"
                  {...register("name")}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm font-body focus:outline-none focus:ring-2 focus:ring-[#E8553A]/20 focus:border-[#E8553A] transition-colors"
                  placeholder="e.g., T. Nagar Office"
                />
                {errors.name && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.name.message}
                  </p>
                )}
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Address
                </label>
                <textarea
                  {...register("address")}
                  rows={2}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm font-body focus:outline-none focus:ring-2 focus:ring-[#E8553A]/20 focus:border-[#E8553A] resize-none transition-colors"
                  placeholder="Full street address"
                />
                {errors.address && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.address.message}
                  </p>
                )}
              </div>

              {/* City + Pincode Row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    City
                  </label>
                  <select
                    {...register("city")}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm font-body focus:outline-none focus:ring-2 focus:ring-[#E8553A]/20 focus:border-[#E8553A] transition-colors bg-white"
                  >
                    <option value="Chennai">Chennai</option>
                    <option value="Bangalore" disabled>
                      Bangalore (Coming Soon)
                    </option>
                    <option value="Hyderabad" disabled>
                      Hyderabad (Coming Soon)
                    </option>
                  </select>
                  {errors.city && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.city.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Pincode
                  </label>
                  <input
                    type="text"
                    {...register("pincode")}
                    maxLength={6}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm font-body focus:outline-none focus:ring-2 focus:ring-[#E8553A]/20 focus:border-[#E8553A] transition-colors"
                    placeholder="600017"
                  />
                  {errors.pincode && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.pincode.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Contact Person */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Contact Person
                </label>
                <input
                  type="text"
                  {...register("contactPerson")}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm font-body focus:outline-none focus:ring-2 focus:ring-[#E8553A]/20 focus:border-[#E8553A] transition-colors"
                  placeholder="Name of branch contact"
                />
                {errors.contactPerson && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.contactPerson.message}
                  </p>
                )}
              </div>

              {/* Contact Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Contact Phone
                </label>
                <input
                  type="text"
                  {...register("contactPhone")}
                  maxLength={10}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm font-body focus:outline-none focus:ring-2 focus:ring-[#E8553A]/20 focus:border-[#E8553A] transition-colors"
                  placeholder="10-digit phone number"
                />
                {errors.contactPhone && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.contactPhone.message}
                  </p>
                )}
              </div>

              {/* Delivery Window */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Delivery Window
                </label>
                <div className="flex gap-4">
                  <label
                    className={`flex items-center gap-2.5 px-4 py-3 border-2 rounded-xl cursor-pointer transition-all flex-1 ${
                      watchDeliveryWindow === "MORNING"
                        ? "border-[#E8553A] bg-[#FFF0ED]"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <input
                      type="radio"
                      value="MORNING"
                      {...register("deliveryWindow")}
                      className="sr-only"
                    />
                    <Clock
                      className={`w-4 h-4 ${
                        watchDeliveryWindow === "MORNING"
                          ? "text-[#E8553A]"
                          : "text-gray-400"
                      }`}
                    />
                    <div>
                      <p
                        className={`text-sm font-medium ${
                          watchDeliveryWindow === "MORNING"
                            ? "text-[#E8553A]"
                            : "text-dark"
                        }`}
                      >
                        Morning
                      </p>
                      <p className="text-xs text-gray-400">9 AM - 12 PM</p>
                    </div>
                  </label>

                  <label
                    className={`flex items-center gap-2.5 px-4 py-3 border-2 rounded-xl cursor-pointer transition-all flex-1 ${
                      watchDeliveryWindow === "AFTERNOON"
                        ? "border-[#E8553A] bg-[#FFF0ED]"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <input
                      type="radio"
                      value="AFTERNOON"
                      {...register("deliveryWindow")}
                      className="sr-only"
                    />
                    <Clock
                      className={`w-4 h-4 ${
                        watchDeliveryWindow === "AFTERNOON"
                          ? "text-[#E8553A]"
                          : "text-gray-400"
                      }`}
                    />
                    <div>
                      <p
                        className={`text-sm font-medium ${
                          watchDeliveryWindow === "AFTERNOON"
                            ? "text-[#E8553A]"
                            : "text-dark"
                        }`}
                      >
                        Afternoon
                      </p>
                      <p className="text-xs text-gray-400">1 PM - 5 PM</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#E8553A] text-white font-medium text-sm rounded-lg hover:bg-[#D4472E] disabled:opacity-50 transition-colors mt-2"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {editingBranch
                  ? submitting
                    ? "Updating..."
                    : "Update Branch"
                  : submitting
                  ? "Adding..."
                  : "Add Branch"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
