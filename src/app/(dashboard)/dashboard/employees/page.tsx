"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Papa from "papaparse";
import {
  Users,
  Plus,
  Pencil,
  Trash2,
  Upload,
  Download,
  Search,
  X,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Filter,
} from "lucide-react";
import { formatDate, getDaysUntilBirthday } from "@/lib/utils";
import type { CakePreference } from "@/types";

// ---------- Types ----------

interface Branch {
  id: string;
  name: string;
}

interface Employee {
  id: string;
  name: string;
  email: string | null;
  dateOfBirth: string;
  cakePreference: CakePreference;
  isActive: boolean;
  branch: Branch;
  createdAt: string;
}

interface CSVError {
  row: number;
  field: string;
  message: string;
}

// ---------- Zod Schema ----------

const employeeFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  branchId: z.string().min(1, "Branch is required"),
  cakePreference: z.enum(["EGGLESS", "EGG", "VEGAN", "SUGAR_FREE", "DEFAULT"]),
});

type EmployeeFormValues = z.infer<typeof employeeFormSchema>;

// ---------- Constants ----------

const CAKE_PREF_STYLES: Record<string, { bg: string; text: string }> = {
  EGGLESS: { bg: "bg-green-100", text: "text-green-700" },
  EGG: { bg: "bg-yellow-100", text: "text-yellow-700" },
  VEGAN: { bg: "bg-emerald-100", text: "text-emerald-700" },
  SUGAR_FREE: { bg: "bg-blue-100", text: "text-blue-700" },
  DEFAULT: { bg: "bg-gray-100", text: "text-gray-700" },
};

const CSV_TEMPLATE =
  "name,email,dob,branch,cake_preference\nJohn Doe,john@example.com,1990-05-15,Head Office,EGGLESS\nJane Smith,jane@example.com,1992-11-20,Branch 2,DEFAULT";

// ---------- Component ----------

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [filterBranch, setFilterBranch] = useState("");
  const [sortBirthday, setSortBirthday] = useState(false);

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  // CSV upload states
  const [csvModalOpen, setCsvModalOpen] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvUploading, setCsvUploading] = useState(false);
  const [csvResult, setCsvResult] = useState<{
    created: number;
    errors: CSVError[];
    total: number;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeFormSchema),
    defaultValues: {
      name: "",
      email: "",
      dateOfBirth: "",
      branchId: "",
      cakePreference: "DEFAULT",
    },
  });

  // ---------- Fetch ----------

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        ...(search && { search }),
        ...(filterBranch && { branchId: filterBranch }),
        ...(sortBirthday && { sortBirthday: "true" }),
      });
      const res = await fetch(`/api/employees?${params}`);
      if (res.ok) {
        const data = await res.json();
        setEmployees(data.employees || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
      }
    } catch {
      // Silent fail
    } finally {
      setLoading(false);
    }
  }, [page, search, filterBranch, sortBirthday]);

  const fetchBranches = useCallback(async () => {
    try {
      const res = await fetch("/api/branches");
      if (res.ok) {
        const data = await res.json();
        setBranches(data.branches || []);
      }
    } catch {
      // Silent fail
    }
  }, []);

  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  // ---------- Search debounce ----------

  const [searchInput, setSearchInput] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // ---------- Add/Edit Modal ----------

  function openAddModal() {
    setEditingEmployee(null);
    reset({
      name: "",
      email: "",
      dateOfBirth: "",
      branchId: branches[0]?.id || "",
      cakePreference: "DEFAULT",
    });
    setApiError(null);
    setModalOpen(true);
  }

  function openEditModal(emp: Employee) {
    setEditingEmployee(emp);
    reset({
      name: emp.name,
      email: emp.email || "",
      dateOfBirth: emp.dateOfBirth.split("T")[0],
      branchId: emp.branch.id,
      cakePreference: emp.cakePreference,
    });
    setApiError(null);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingEmployee(null);
    setApiError(null);
  }

  async function onSubmit(data: EmployeeFormValues) {
    setSubmitting(true);
    setApiError(null);
    try {
      const isEdit = !!editingEmployee;
      const method = isEdit ? "PUT" : "POST";
      const body = isEdit ? { ...data, id: editingEmployee.id } : data;

      const res = await fetch("/api/employees", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        closeModal();
        await fetchEmployees();
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
    if (!confirm("Are you sure you want to remove this employee?")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/employees?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        await fetchEmployees();
      } else {
        const errData = await res.json();
        alert(errData.error || "Failed to delete employee");
      }
    } catch {
      alert("Network error. Please try again.");
    } finally {
      setDeletingId(null);
    }
  }

  // ---------- CSV Download Template ----------

  function downloadTemplate() {
    const blob = new Blob([CSV_TEMPLATE], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "cakedrop_employee_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  // ---------- CSV Upload ----------

  function openCsvModal() {
    setCsvFile(null);
    setCsvResult(null);
    setCsvModalOpen(true);
  }

  function closeCsvModal() {
    setCsvModalOpen(false);
    setCsvFile(null);
    setCsvResult(null);
  }

  async function handleCsvUpload() {
    if (!csvFile) return;
    setCsvUploading(true);
    setCsvResult(null);

    Papa.parse(csvFile, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const res = await fetch("/api/employees/upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ rows: results.data }),
          });
          if (res.ok) {
            const data = await res.json();
            setCsvResult(data);
            if (data.created > 0) {
              await fetchEmployees();
            }
          } else {
            const errData = await res.json();
            setCsvResult({
              created: 0,
              errors: [{ row: 0, field: "file", message: errData.error }],
              total: 0,
            });
          }
        } catch {
          setCsvResult({
            created: 0,
            errors: [{ row: 0, field: "file", message: "Upload failed" }],
            total: 0,
          });
        } finally {
          setCsvUploading(false);
        }
      },
      error: () => {
        setCsvResult({
          created: 0,
          errors: [{ row: 0, field: "file", message: "Failed to parse CSV" }],
          total: 0,
        });
        setCsvUploading(false);
      },
    });
  }

  // ---------- Loading Skeleton ----------

  if (loading && employees.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-64 bg-gray-200 rounded animate-pulse mt-2" />
          </div>
          <div className="flex gap-2">
            <div className="h-10 w-32 bg-gray-200 rounded-lg animate-pulse" />
            <div className="h-10 w-32 bg-gray-200 rounded-lg animate-pulse" />
          </div>
        </div>
        <div className="bg-white rounded-card shadow-sm border border-gray-100 p-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 py-3">
              <div className="h-4 w-40 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
              <div className="h-5 w-16 bg-gray-200 rounded-badge animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ---------- Render ----------

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-heading text-dark">
            Employees
          </h1>
          <p className="text-gray-500 font-body mt-1">
            Manage your team and their birthday preferences ({total} total)
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={downloadTemplate}
            className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 text-gray-700 font-medium text-sm rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Download className="w-4 h-4" />
            Template
          </button>
          <button
            onClick={openCsvModal}
            className="flex items-center gap-2 px-4 py-2.5 border border-[#E8553A] text-[#E8553A] font-medium text-sm rounded-lg hover:bg-[#FFF0ED] transition-colors"
          >
            <Upload className="w-4 h-4" />
            CSV Upload
          </button>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#E8553A] text-white font-medium text-sm rounded-lg hover:bg-[#D4472E] transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Employee
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-card shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm font-body focus:outline-none focus:ring-2 focus:ring-[#E8553A]/20 focus:border-[#E8553A] transition-colors"
            />
          </div>
          {/* Branch filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={filterBranch}
              onChange={(e) => {
                setFilterBranch(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm font-body focus:outline-none focus:ring-2 focus:ring-[#E8553A]/20 focus:border-[#E8553A] bg-white transition-colors"
            >
              <option value="">All Branches</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
          {/* Sort by birthday */}
          <button
            onClick={() => setSortBirthday(!sortBirthday)}
            className={`flex items-center gap-2 px-4 py-2.5 border rounded-lg text-sm font-medium transition-colors ${
              sortBirthday
                ? "border-[#E8553A] bg-[#FFF0ED] text-[#E8553A]"
                : "border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            Sort by Birthday
          </button>
        </div>
      </div>

      {/* Employee Table */}
      <div className="bg-white rounded-card shadow-sm border border-gray-100">
        {employees.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500 font-body">
              {search || filterBranch
                ? "No employees match your search criteria."
                : "No employees yet. Upload a CSV or add employees manually."}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm font-body">
                <thead>
                  <tr className="border-b border-gray-100 text-left text-gray-500">
                    <th className="px-6 py-3 font-medium">Name</th>
                    <th className="px-6 py-3 font-medium">Email</th>
                    <th className="px-6 py-3 font-medium">Branch</th>
                    <th className="px-6 py-3 font-medium">Birthday</th>
                    <th className="px-6 py-3 font-medium">Days Until</th>
                    <th className="px-6 py-3 font-medium">Preference</th>
                    <th className="px-6 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((emp) => {
                    const pref =
                      CAKE_PREF_STYLES[emp.cakePreference] ||
                      CAKE_PREF_STYLES.DEFAULT;
                    const daysUntil = getDaysUntilBirthday(emp.dateOfBirth);
                    return (
                      <tr
                        key={emp.id}
                        className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors"
                      >
                        <td className="px-6 py-3.5 font-medium text-dark">
                          {emp.name}
                        </td>
                        <td className="px-6 py-3.5 text-gray-600">
                          {emp.email || "—"}
                        </td>
                        <td className="px-6 py-3.5 text-gray-600">
                          {emp.branch.name}
                        </td>
                        <td className="px-6 py-3.5 text-gray-600">
                          {formatDate(emp.dateOfBirth)}
                        </td>
                        <td className="px-6 py-3.5">
                          <span
                            className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold ${
                              daysUntil <= 3
                                ? "bg-red-100 text-red-700"
                                : daysUntil <= 7
                                ? "bg-orange-100 text-orange-700"
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {daysUntil}
                          </span>
                        </td>
                        <td className="px-6 py-3.5">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-badge text-xs font-medium ${pref.bg} ${pref.text}`}
                          >
                            {emp.cakePreference.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="px-6 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => openEditModal(emp)}
                              className="p-2 text-gray-400 hover:text-[#E8553A] hover:bg-[#FFF0ED] rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(emp.id)}
                              disabled={deletingId === emp.id}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                              title="Remove"
                            >
                              {deletingId === emp.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
                <p className="text-sm text-gray-500 font-body">
                  Page {page} of {totalPages} ({total} employees)
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="p-2 text-gray-500 hover:text-dark hover:bg-gray-100 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                    className="p-2 text-gray-500 hover:text-dark hover:bg-gray-100 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ---------- Add / Edit Employee Modal ---------- */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={closeModal} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold font-heading text-dark">
                {editingEmployee ? "Edit Employee" : "Add Employee"}
              </h2>
              <button
                onClick={closeModal}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              {apiError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  {apiError}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Name
                </label>
                <input
                  type="text"
                  {...register("name")}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm font-body focus:outline-none focus:ring-2 focus:ring-[#E8553A]/20 focus:border-[#E8553A] transition-colors"
                  placeholder="Employee name"
                />
                {errors.name && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email (optional)
                </label>
                <input
                  type="email"
                  {...register("email")}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm font-body focus:outline-none focus:ring-2 focus:ring-[#E8553A]/20 focus:border-[#E8553A] transition-colors"
                  placeholder="employee@company.com"
                />
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    {...register("dateOfBirth")}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm font-body focus:outline-none focus:ring-2 focus:ring-[#E8553A]/20 focus:border-[#E8553A] transition-colors"
                  />
                  {errors.dateOfBirth && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.dateOfBirth.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Branch
                  </label>
                  <select
                    {...register("branchId")}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm font-body focus:outline-none focus:ring-2 focus:ring-[#E8553A]/20 focus:border-[#E8553A] bg-white transition-colors"
                  >
                    <option value="">Select branch</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                  {errors.branchId && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.branchId.message}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Cake Preference
                </label>
                <select
                  {...register("cakePreference")}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm font-body focus:outline-none focus:ring-2 focus:ring-[#E8553A]/20 focus:border-[#E8553A] bg-white transition-colors"
                >
                  <option value="DEFAULT">Default (Company Choice)</option>
                  <option value="EGGLESS">Eggless</option>
                  <option value="EGG">Egg-based</option>
                  <option value="VEGAN">Vegan</option>
                  <option value="SUGAR_FREE">Sugar-free</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#E8553A] text-white font-medium text-sm rounded-lg hover:bg-[#D4472E] disabled:opacity-50 transition-colors mt-2"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {editingEmployee
                  ? submitting
                    ? "Updating..."
                    : "Update Employee"
                  : submitting
                  ? "Adding..."
                  : "Add Employee"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ---------- CSV Upload Modal ---------- */}
      {csvModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={closeCsvModal}
          />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold font-heading text-dark">
                Upload Employees via CSV
              </h2>
              <button
                onClick={closeCsvModal}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                <p className="font-medium mb-1">CSV Format</p>
                <p>
                  Required columns: <code>name</code>, <code>email</code>,{" "}
                  <code>dob</code>, <code>branch</code>,{" "}
                  <code>cake_preference</code>
                </p>
                <p className="mt-1">
                  Date format: YYYY-MM-DD or DD/MM/YYYY
                </p>
                <button
                  onClick={downloadTemplate}
                  className="mt-2 text-blue-600 underline text-sm font-medium"
                >
                  Download template CSV
                </button>
              </div>

              {/* File input */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-[#E8553A] hover:bg-[#FFF0ED]/30 transition-colors"
              >
                <Upload className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                {csvFile ? (
                  <p className="text-sm text-dark font-medium">
                    {csvFile.name}
                  </p>
                ) : (
                  <p className="text-sm text-gray-500">
                    Click to select a CSV file
                  </p>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={(e) => {
                    setCsvFile(e.target.files?.[0] || null);
                    setCsvResult(null);
                  }}
                />
              </div>

              {/* Upload result */}
              {csvResult && (
                <div className="space-y-3">
                  {csvResult.created > 0 && (
                    <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>
                        Successfully added {csvResult.created} of{" "}
                        {csvResult.total} employees
                      </span>
                    </div>
                  )}
                  {csvResult.errors.length > 0 && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm">
                      <div className="flex items-center gap-2 text-red-700 font-medium mb-2">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        {csvResult.errors.length} error
                        {csvResult.errors.length > 1 ? "s" : ""} found
                      </div>
                      <ul className="space-y-1 text-red-600 max-h-40 overflow-y-auto">
                        {csvResult.errors.map((err, i) => (
                          <li key={i}>
                            Row {err.row}: {err.message}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Upload button */}
              <button
                onClick={handleCsvUpload}
                disabled={!csvFile || csvUploading}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#E8553A] text-white font-medium text-sm rounded-lg hover:bg-[#D4472E] disabled:opacity-50 transition-colors"
              >
                {csvUploading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                {csvUploading ? "Uploading..." : "Upload CSV"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
