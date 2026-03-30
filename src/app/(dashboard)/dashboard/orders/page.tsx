"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Package,
  Search,
  X,
  Loader2,
  Clock,
  CheckCircle2,
  Truck,
  AlertCircle,
  ChefHat,
  CircleDot,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  Calendar,
  MapPin,
  Phone,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { OrderStatus } from "@/types";

// ---------- Types ----------

interface Order {
  id: string;
  status: OrderStatus;
  cakeType: string | null;
  cakeSize: string;
  cakePreference: string;
  cardMessage: string | null;
  cardTemplate: string;
  deliveryDate: string;
  actualDeliveryAt: string | null;
  deliveryPhotoUrl: string | null;
  deliveryNotes: string | null;
  bakeryOrderRef: string | null;
  failureReason: string | null;
  createdAt: string;
  updatedAt: string;
  employee: {
    id: string;
    name: string;
    email: string | null;
    dateOfBirth: string;
  };
  branch: {
    id: string;
    name: string;
    address: string;
    pincode: string;
  };
  bakeryPartner: {
    id: string;
    name: string;
    contactPhone: string;
  } | null;
}

interface Pipeline {
  PENDING: number;
  CONFIRMED: number;
  BAKING: number;
  OUT_FOR_DELIVERY: number;
  DELIVERED: number;
  FAILED: number;
}

// ---------- Constants ----------

const STATUS_CONFIG: Record<
  OrderStatus,
  { bg: string; text: string; icon: typeof Clock; label: string }
> = {
  PENDING: {
    bg: "bg-yellow-100",
    text: "text-yellow-800",
    icon: Clock,
    label: "Pending",
  },
  CONFIRMED: {
    bg: "bg-blue-100",
    text: "text-blue-800",
    icon: CheckCircle2,
    label: "Confirmed",
  },
  BAKING: {
    bg: "bg-orange-100",
    text: "text-orange-800",
    icon: ChefHat,
    label: "Baking",
  },
  OUT_FOR_DELIVERY: {
    bg: "bg-purple-100",
    text: "text-purple-800",
    icon: Truck,
    label: "Out for Delivery",
  },
  DELIVERED: {
    bg: "bg-green-100",
    text: "text-green-800",
    icon: CheckCircle2,
    label: "Delivered",
  },
  FAILED: {
    bg: "bg-red-100",
    text: "text-red-800",
    icon: AlertCircle,
    label: "Failed",
  },
};

const PIPELINE_ORDER: OrderStatus[] = [
  "PENDING",
  "CONFIRMED",
  "BAKING",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "FAILED",
];

const TIMELINE_STEPS: { status: OrderStatus; label: string }[] = [
  { status: "PENDING", label: "Order Placed" },
  { status: "CONFIRMED", label: "Bakery Confirmed" },
  { status: "BAKING", label: "Baking" },
  { status: "OUT_FOR_DELIVERY", label: "Out for Delivery" },
  { status: "DELIVERED", label: "Delivered" },
];

function getTimelineIndex(status: OrderStatus): number {
  const idx = TIMELINE_STEPS.findIndex((s) => s.status === status);
  return idx >= 0 ? idx : -1;
}

// ---------- Component ----------

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [pipeline, setPipeline] = useState<Pipeline>({
    PENDING: 0,
    CONFIRMED: 0,
    BAKING: 0,
    OUT_FOR_DELIVERY: 0,
    DELIVERED: 0,
    FAILED: 0,
  });
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterStatus, setFilterStatus] = useState("");
  const [search, setSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // ---------- Fetch ----------

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        ...(filterStatus && { status: filterStatus }),
        ...(search && { search }),
      });
      const res = await fetch(`/api/orders?${params}`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
        if (data.pipeline) {
          setPipeline(data.pipeline);
        }
      }
    } catch {
      // Silent fail
    } finally {
      setLoading(false);
    }
  }, [page, filterStatus, search]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // ---------- Search debounce ----------

  const [searchInput, setSearchInput] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // ---------- Loading Skeleton ----------

  if (loading && orders.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-64 bg-gray-200 rounded animate-pulse mt-2" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-card shadow-sm border border-gray-100 p-4 h-20 animate-pulse"
            />
          ))}
        </div>
        <div className="bg-white rounded-card shadow-sm border border-gray-100 p-6 h-80 animate-pulse" />
      </div>
    );
  }

  // ---------- Render ----------

  const totalOrders = Object.values(pipeline).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold font-heading text-dark">
          Orders & Delivery
        </h1>
        <p className="text-gray-500 font-body mt-1">
          Track cake orders and delivery status ({totalOrders} total orders)
        </p>
      </div>

      {/* Pipeline View */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {PIPELINE_ORDER.map((status) => {
          const config = STATUS_CONFIG[status];
          const Icon = config.icon;
          const count = pipeline[status];
          const isActive = filterStatus === status;
          return (
            <button
              key={status}
              onClick={() => {
                setFilterStatus(isActive ? "" : status);
                setPage(1);
              }}
              className={`bg-white rounded-card shadow-sm border-2 p-4 text-left transition-all hover:shadow-md ${
                isActive
                  ? "border-[#E8553A] shadow-md"
                  : "border-gray-100"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center ${config.bg}`}
                >
                  <Icon className={`w-3.5 h-3.5 ${config.text}`} />
                </div>
              </div>
              <p className="text-2xl font-bold font-heading text-dark">
                {count}
              </p>
              <p className="text-xs text-gray-500 font-body mt-0.5">
                {config.label}
              </p>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="bg-white rounded-card shadow-sm border border-gray-100 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by employee name..."
            className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm font-body focus:outline-none focus:ring-2 focus:ring-[#E8553A]/20 focus:border-[#E8553A] transition-colors"
          />
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-card shadow-sm border border-gray-100">
        {orders.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500 font-body">
              {search || filterStatus
                ? "No orders match your filters."
                : "No orders yet. Orders are created automatically when birthdays are detected."}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm font-body">
                <thead>
                  <tr className="border-b border-gray-100 text-left text-gray-500">
                    <th className="px-6 py-3 font-medium">Order ID</th>
                    <th className="px-6 py-3 font-medium">Employee</th>
                    <th className="px-6 py-3 font-medium">Cake</th>
                    <th className="px-6 py-3 font-medium">Delivery Date</th>
                    <th className="px-6 py-3 font-medium">Bakery</th>
                    <th className="px-6 py-3 font-medium">Status</th>
                    <th className="px-6 py-3 font-medium text-right">
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => {
                    const config = STATUS_CONFIG[order.status] || STATUS_CONFIG.PENDING;
                    return (
                      <tr
                        key={order.id}
                        className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors"
                      >
                        <td className="px-6 py-3.5 font-mono text-xs text-gray-600">
                          {order.id.slice(0, 8).toUpperCase()}
                        </td>
                        <td className="px-6 py-3.5">
                          <div>
                            <p className="font-medium text-dark">
                              {order.employee.name}
                            </p>
                            <p className="text-xs text-gray-400">
                              {order.branch.name}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-3.5 text-gray-600">
                          <div>
                            <p>
                              {order.cakeType || "Standard"} ({order.cakeSize})
                            </p>
                            <p className="text-xs text-gray-400">
                              {order.cakePreference.replace(/_/g, " ")}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-3.5 text-gray-600">
                          {formatDate(order.deliveryDate)}
                        </td>
                        <td className="px-6 py-3.5 text-gray-600">
                          {order.bakeryPartner?.name || "Unassigned"}
                        </td>
                        <td className="px-6 py-3.5">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-badge text-xs font-medium ${config.bg} ${config.text}`}
                          >
                            {config.label}
                          </span>
                        </td>
                        <td className="px-6 py-3.5 text-right">
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="text-sm text-[#E8553A] hover:text-[#D4472E] font-medium transition-colors"
                          >
                            View
                          </button>
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
                  Page {page} of {totalPages} ({total} orders)
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

      {/* ---------- Order Detail Modal ---------- */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setSelectedOrder(null)}
          />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-bold font-heading text-dark">
                  Order Details
                </h2>
                <p className="text-xs text-gray-400 font-mono">
                  #{selectedOrder.id.slice(0, 8).toUpperCase()}
                </p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Status */}
              <div className="flex items-center gap-3">
                {(() => {
                  const cfg = STATUS_CONFIG[selectedOrder.status];
                  const Icon = cfg.icon;
                  return (
                    <>
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center ${cfg.bg}`}
                      >
                        <Icon className={`w-5 h-5 ${cfg.text}`} />
                      </div>
                      <div>
                        <span
                          className={`inline-block px-3 py-1 rounded-badge text-sm font-medium ${cfg.bg} ${cfg.text}`}
                        >
                          {cfg.label}
                        </span>
                        {selectedOrder.status === "FAILED" &&
                          selectedOrder.failureReason && (
                            <p className="text-sm text-red-600 mt-1">
                              {selectedOrder.failureReason}
                            </p>
                          )}
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* Timeline */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">
                  Order Timeline
                </h3>
                <div className="relative pl-6">
                  {TIMELINE_STEPS.map((step, i) => {
                    const currentIdx = getTimelineIndex(
                      selectedOrder.status === "FAILED"
                        ? "PENDING"
                        : selectedOrder.status
                    );
                    const isCompleted = i <= currentIdx;
                    const isCurrent = i === currentIdx;
                    return (
                      <div key={step.status} className="relative pb-5 last:pb-0">
                        {/* Connector line */}
                        {i < TIMELINE_STEPS.length - 1 && (
                          <div
                            className={`absolute left-[-14px] top-6 w-0.5 h-full ${
                              isCompleted && i < currentIdx
                                ? "bg-[#E8553A]"
                                : "bg-gray-200"
                            }`}
                          />
                        )}
                        {/* Dot */}
                        <div
                          className={`absolute left-[-18px] top-1 w-2.5 h-2.5 rounded-full border-2 ${
                            isCompleted
                              ? "bg-[#E8553A] border-[#E8553A]"
                              : "bg-white border-gray-300"
                          } ${isCurrent ? "ring-4 ring-[#E8553A]/20" : ""}`}
                        />
                        {/* Label */}
                        <p
                          className={`text-sm ${
                            isCompleted
                              ? "text-dark font-medium"
                              : "text-gray-400"
                          }`}
                        >
                          {step.label}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Employee & Branch Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 mb-1 font-medium">
                    Employee
                  </p>
                  <p className="text-sm font-medium text-dark">
                    {selectedOrder.employee.name}
                  </p>
                  {selectedOrder.employee.email && (
                    <p className="text-xs text-gray-500">
                      {selectedOrder.employee.email}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDate(selectedOrder.employee.dateOfBirth)}
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 mb-1 font-medium">
                    Delivery Location
                  </p>
                  <p className="text-sm font-medium text-dark">
                    {selectedOrder.branch.name}
                  </p>
                  <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                    <MapPin className="w-3 h-3" />
                    {selectedOrder.branch.address}
                  </p>
                </div>
              </div>

              {/* Cake & Card Details */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <p className="text-xs text-gray-500 font-medium">
                  Cake Details
                </p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-500">Type:</span>{" "}
                    <span className="text-dark font-medium">
                      {selectedOrder.cakeType || "Standard"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Size:</span>{" "}
                    <span className="text-dark font-medium">
                      {selectedOrder.cakeSize}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Preference:</span>{" "}
                    <span className="text-dark font-medium">
                      {selectedOrder.cakePreference.replace(/_/g, " ")}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Card:</span>{" "}
                    <span className="text-dark font-medium capitalize">
                      {selectedOrder.cardTemplate}
                    </span>
                  </div>
                </div>
                {selectedOrder.cardMessage && (
                  <p className="text-sm text-gray-600 italic mt-1">
                    &ldquo;{selectedOrder.cardMessage}&rdquo;
                  </p>
                )}
              </div>

              {/* Bakery Info */}
              {selectedOrder.bakeryPartner && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 mb-1 font-medium">
                    Bakery Partner
                  </p>
                  <p className="text-sm font-medium text-dark">
                    {selectedOrder.bakeryPartner.name}
                  </p>
                  <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                    <Phone className="w-3 h-3" />
                    {selectedOrder.bakeryPartner.contactPhone}
                  </p>
                  {selectedOrder.bakeryOrderRef && (
                    <p className="text-xs text-gray-400 mt-1">
                      Ref: {selectedOrder.bakeryOrderRef}
                    </p>
                  )}
                </div>
              )}

              {/* Delivery Photo */}
              {selectedOrder.deliveryPhotoUrl && (
                <div>
                  <p className="text-xs text-gray-500 font-medium mb-2">
                    Delivery Photo
                  </p>
                  <img
                    src={selectedOrder.deliveryPhotoUrl}
                    alt="Delivery confirmation"
                    className="w-full rounded-xl border border-gray-200 object-cover max-h-48"
                  />
                </div>
              )}

              {/* Delivery Notes */}
              {selectedOrder.deliveryNotes && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
                  <p className="font-medium mb-0.5">Delivery Notes</p>
                  <p>{selectedOrder.deliveryNotes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
