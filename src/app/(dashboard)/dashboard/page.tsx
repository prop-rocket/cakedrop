"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
  Users,
  Cake,
  Package,
  IndianRupee,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { StatCard } from "@/components/dashboard/StatCard";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { DashboardStats, UpcomingBirthday, CakePreference, OrderStatus } from "@/types";

interface RecentOrder {
  id: string;
  employeeName: string;
  status: OrderStatus;
  deliveryDate: string;
}

interface MonthlyDelivery {
  month: string;
  deliveries: number;
}

const STATUS_COLORS: Record<OrderStatus, { bg: string; text: string }> = {
  PENDING: { bg: "bg-yellow-100", text: "text-yellow-800" },
  CONFIRMED: { bg: "bg-blue-100", text: "text-blue-800" },
  BAKING: { bg: "bg-orange-100", text: "text-orange-800" },
  OUT_FOR_DELIVERY: { bg: "bg-purple-100", text: "text-purple-800" },
  DELIVERED: { bg: "bg-green-100", text: "text-green-800" },
  FAILED: { bg: "bg-red-100", text: "text-red-800" },
};

const CAKE_PREF_COLORS: Record<CakePreference, { bg: string; text: string }> = {
  EGGLESS: { bg: "bg-green-100", text: "text-green-700" },
  EGG: { bg: "bg-yellow-100", text: "text-yellow-700" },
  VEGAN: { bg: "bg-emerald-100", text: "text-emerald-700" },
  SUGAR_FREE: { bg: "bg-blue-100", text: "text-blue-700" },
  DEFAULT: { bg: "bg-gray-100", text: "text-gray-700" },
};

const MOCK_STATS: DashboardStats = {
  totalEmployees: 124,
  upcomingBirthdays: 5,
  deliveredThisMonth: 18,
  monthlySpend: 12600,
};

const MOCK_BIRTHDAYS: UpcomingBirthday[] = [
  { id: "1", name: "Priya Sharma", branchName: "T. Nagar", dateOfBirth: "1995-04-02", daysUntil: 2, cakePreference: "EGGLESS" },
  { id: "2", name: "Rahul Menon", branchName: "Anna Nagar", dateOfBirth: "1990-04-05", daysUntil: 5, cakePreference: "EGG" },
  { id: "3", name: "Ananya Iyer", branchName: "Velachery", dateOfBirth: "1993-04-08", daysUntil: 8, cakePreference: "VEGAN" },
  { id: "4", name: "Karthik Rajan", branchName: "T. Nagar", dateOfBirth: "1988-04-14", daysUntil: 14, cakePreference: "EGGLESS" },
  { id: "5", name: "Deepa Krishnan", branchName: "Adyar", dateOfBirth: "1991-04-20", daysUntil: 20, cakePreference: "SUGAR_FREE" },
  { id: "6", name: "Vijay Kumar", branchName: "Anna Nagar", dateOfBirth: "1994-04-25", daysUntil: 25, cakePreference: "DEFAULT" },
];

const MOCK_ORDERS: RecentOrder[] = [
  { id: "1", employeeName: "Lakshmi Narayan", status: "DELIVERED", deliveryDate: "2026-03-24" },
  { id: "2", employeeName: "Arjun Reddy", status: "OUT_FOR_DELIVERY", deliveryDate: "2026-03-26" },
  { id: "3", employeeName: "Meena Sundaram", status: "BAKING", deliveryDate: "2026-03-27" },
  { id: "4", employeeName: "Suresh Babu", status: "CONFIRMED", deliveryDate: "2026-03-28" },
  { id: "5", employeeName: "Nithya Raman", status: "PENDING", deliveryDate: "2026-03-30" },
  { id: "6", employeeName: "Ganesh Venkat", status: "FAILED", deliveryDate: "2026-03-20" },
];

const MOCK_MONTHLY: MonthlyDelivery[] = [
  { month: "Jan", deliveries: 12 },
  { month: "Feb", deliveries: 15 },
  { month: "Mar", deliveries: 18 },
  { month: "Apr", deliveries: 0 },
  { month: "May", deliveries: 0 },
  { month: "Jun", deliveries: 0 },
  { month: "Jul", deliveries: 0 },
  { month: "Aug", deliveries: 0 },
  { month: "Sep", deliveries: 0 },
  { month: "Oct", deliveries: 0 },
  { month: "Nov", deliveries: 0 },
  { month: "Dec", deliveries: 0 },
];

function SkeletonCard() {
  return (
    <div className="bg-white rounded-card p-5 shadow-sm border border-gray-100 flex items-center gap-4 animate-pulse">
      <div className="w-12 h-12 rounded-xl bg-gray-200" />
      <div className="space-y-2">
        <div className="h-3 w-24 bg-gray-200 rounded" />
        <div className="h-6 w-16 bg-gray-200 rounded" />
      </div>
    </div>
  );
}

function SkeletonTable() {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <div className="h-4 w-32 bg-gray-200 rounded" />
          <div className="h-4 w-20 bg-gray-200 rounded" />
          <div className="h-4 w-24 bg-gray-200 rounded" />
          <div className="h-4 w-12 bg-gray-200 rounded" />
          <div className="h-5 w-16 bg-gray-200 rounded-badge" />
        </div>
      ))}
    </div>
  );
}

function SkeletonList() {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="h-4 w-28 bg-gray-200 rounded" />
            <div className="h-3 w-20 bg-gray-200 rounded" />
          </div>
          <div className="h-5 w-20 bg-gray-200 rounded-badge" />
        </div>
      ))}
    </div>
  );
}

function formatStatusLabel(status: OrderStatus): string {
  return status.replace(/_/g, " ");
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const companyName = (session?.user as any)?.companyName || "Your Company";

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [birthdays, setBirthdays] = useState<UpcomingBirthday[] | null>(null);
  const [orders, setOrders] = useState<RecentOrder[] | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyDelivery[]>(MOCK_MONTHLY);
  const [loading, setLoading] = useState(true);

  const todayFormatted = new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  useEffect(() => {
    async function fetchData() {
      setLoading(true);

      // Fetch stats
      try {
        const res = await fetch("/api/dashboard/stats");
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        } else {
          setStats(MOCK_STATS);
        }
      } catch {
        setStats(MOCK_STATS);
      }

      // Fetch upcoming birthdays
      try {
        const res = await fetch("/api/employees?upcoming=true");
        if (res.ok) {
          const data = await res.json();
          setBirthdays(data.employees || data);
        } else {
          setBirthdays(MOCK_BIRTHDAYS);
        }
      } catch {
        setBirthdays(MOCK_BIRTHDAYS);
      }

      // Fetch recent orders
      try {
        const res = await fetch("/api/orders?recent=true");
        if (res.ok) {
          const data = await res.json();
          setOrders(data.orders || data);
          if (data.monthlyDeliveries) {
            setMonthlyData(data.monthlyDeliveries);
          }
        } else {
          setOrders(MOCK_ORDERS);
        }
      } catch {
        setOrders(MOCK_ORDERS);
      }

      setLoading(false);
    }

    fetchData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold font-heading text-dark">
          Welcome back, {companyName}
        </h1>
        <p className="text-gray-500 font-body mt-1">{todayFormatted}</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading || !stats ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : (
          <>
            <StatCard
              title="Total Employees"
              value={stats.totalEmployees}
              icon={<Users className="h-5 w-5" />}
              color="#E8553A"
            />
            <StatCard
              title="Upcoming Birthdays"
              value={stats.upcomingBirthdays}
              icon={<Cake className="h-5 w-5" />}
              color="#F97316"
            />
            <StatCard
              title="Delivered This Month"
              value={stats.deliveredThisMonth}
              icon={<Package className="h-5 w-5" />}
              color="#10B981"
            />
            <StatCard
              title="Monthly Spend"
              value={formatCurrency(stats.monthlySpend)}
              icon={<IndianRupee className="h-5 w-5" />}
              color="#3B82F6"
            />
          </>
        )}
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Upcoming Birthdays */}
        <div className="lg:col-span-2 bg-white rounded-card shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold font-heading text-dark mb-4">
            Upcoming Birthdays
          </h2>

          {loading || !birthdays ? (
            <SkeletonTable />
          ) : birthdays.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Cake className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p className="font-body">No upcoming birthdays in the next 30 days</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm font-body">
                <thead>
                  <tr className="border-b border-gray-100 text-left text-gray-500">
                    <th className="pb-3 font-medium">Employee Name</th>
                    <th className="pb-3 font-medium">Branch</th>
                    <th className="pb-3 font-medium">Birthday</th>
                    <th className="pb-3 font-medium">Days Until</th>
                    <th className="pb-3 font-medium">Cake Preference</th>
                  </tr>
                </thead>
                <tbody>
                  {birthdays.map((b) => {
                    const pref = CAKE_PREF_COLORS[b.cakePreference] || CAKE_PREF_COLORS.DEFAULT;
                    return (
                      <tr
                        key={b.id}
                        className="border-b border-gray-50 last:border-0"
                      >
                        <td className="py-3 font-medium text-dark">{b.name}</td>
                        <td className="py-3 text-gray-600">{b.branchName}</td>
                        <td className="py-3 text-gray-600">
                          {formatDate(b.dateOfBirth)}
                        </td>
                        <td className="py-3">
                          <span
                            className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold ${
                              b.daysUntil <= 3
                                ? "bg-red-100 text-red-700"
                                : b.daysUntil <= 7
                                ? "bg-orange-100 text-orange-700"
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {b.daysUntil}
                          </span>
                        </td>
                        <td className="py-3">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-badge text-xs font-medium ${pref.bg} ${pref.text}`}
                          >
                            {b.cakePreference.replace(/_/g, " ")}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right column - Recent Deliveries */}
        <div className="bg-white rounded-card shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold font-heading text-dark mb-4">
            Recent Deliveries
          </h2>

          {loading || !orders ? (
            <SkeletonList />
          ) : orders.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Package className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p className="font-body">No recent deliveries</p>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => {
                const statusStyle = STATUS_COLORS[order.status] || STATUS_COLORS.PENDING;
                return (
                  <div
                    key={order.id}
                    className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
                  >
                    <div>
                      <p className="font-medium text-dark text-sm">
                        {order.employeeName}
                      </p>
                      <p className="text-xs text-gray-400">
                        {formatDate(order.deliveryDate)}
                      </p>
                    </div>
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-badge text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}
                    >
                      {formatStatusLabel(order.status)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Monthly Deliveries Chart */}
      <div className="bg-white rounded-card shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-bold font-heading text-dark mb-4">
          Monthly Deliveries ({new Date().getFullYear()})
        </h2>
        <div className="w-full h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={monthlyData}
              margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 12, fill: "#9CA3AF" }}
                axisLine={{ stroke: "#E5E7EB" }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 12, fill: "#9CA3AF" }}
                axisLine={{ stroke: "#E5E7EB" }}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: "12px",
                  border: "1px solid #E5E7EB",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                }}
                labelStyle={{ fontWeight: 600, color: "#1A1A2E" }}
              />
              <Bar
                dataKey="deliveries"
                fill="#E8553A"
                radius={[6, 6, 0, 0]}
                maxBarSize={48}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
