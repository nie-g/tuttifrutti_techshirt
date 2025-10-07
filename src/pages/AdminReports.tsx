// src/pages/AdminReports.tsx
import { useEffect, useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useUser } from "@clerk/clerk-react";
import AdminNavbar from "../components/UsersNavbar";
import DynamicSidebar from "../components/Sidebar";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  TimeScale,
} from "chart.js";
import { Line } from "react-chartjs-2";
import "chartjs-adapter-date-fns";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  TimeScale
);

// helpers
const formatDateKey = (d: Date) => {
  // return ISO day key for grouping
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const rangeDaysToMs = (days: number) => days * 24 * 60 * 60 * 1000;

const AdminReports: React.FC = () => {
  const [user, setUser] = useState<{ full_name: string } | null>(null);
  const navigate = useNavigate();
  const { isLoaded, isSignedIn, user: clerkUser } = useUser();

  // Convex queries (real data)
  const billings = useQuery(api.billing.listAll) || []; // all billing docs
  const requests = useQuery(api.design_requests.listAllRequests) || [];
  const designs = useQuery(api.designs.listAllDesigns) || [];

  const isLoading =
    billings === undefined || requests === undefined || designs === undefined;

  // UI state
  const [daysRange, setDaysRange] = useState<number>(30); // 7 | 30 | 90
  const [compare, setCompare] = useState<boolean>(true); // compare with previous period
  const chartRef = useRef<any>(null);
  const users = useQuery(api.userQueries.listAll) || [];
  const getUserName = (userId: string) => {
  const user = users.find((u: any) => u._id === userId);
    if (!user) return "—";
    return `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim() || "Unnamed";
  };


  // --- Auth check ---
  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      navigate("/sign-in");
      return;
    }
    if (clerkUser) {
      const role = clerkUser.unsafeMetadata?.userType;
      if (role === "admin") {
        setUser({
          full_name: clerkUser.fullName || clerkUser.username || "admin",
        });
      } else {
        navigate("/sign-in");
      }
    }
  }, [isLoaded, isSignedIn, clerkUser, navigate]);

  // derived: filter approved billings only for revenue/statistics
  const approvedBillings = useMemo(() => {
  // Only include billings that are approved AND linked to a completed design
  return billings.filter((b: any) => {
    if (b.status !== "approved") return false;
    const linkedDesign = designs.find((d: any) => d._id === b.design_id || d._id === b.design);
    return linkedDesign?.status === "completed";
  });
}, [billings, designs]);


  // totals & stats
  const totalRevenue = useMemo(
    () =>
      approvedBillings.reduce((sum: number, b: any) => sum + (b.final_amount || 0), 0),
    [approvedBillings]
  );

  const avgSale = useMemo(() => {
    if (approvedBillings.length === 0) return 0;
    return (
      approvedBillings.reduce((s: number, b: any) => s + (b.final_amount || 0), 0) /
      approvedBillings.length
    );
  }, [approvedBillings]);

  const requestStats = useMemo(() => {
    return {
      total: requests.length,
      pending: requests.filter((r: any) => r.status === "pending").length,
      approved: requests.filter((r: any) => r.status === "approved").length,
      rejected: requests.filter((r: any) => r.status === "rejected").length,
    };
  }, [requests]);

  const designStats = useMemo(() => {
    return {
      total: designs.length,
      finished: designs.filter((d: any) => d.status === "completed").length,
      approved: designs.filter((d: any) => d.status === "approved").length,
      revisions: designs.filter((d: any) => d.status === "pending_revision").length,
    };
  }, [designs]);

  // Build time series for chart from billings.final_amount grouped by day.
  const { labels, thisPeriodData, lastPeriodData, chartSummary } = useMemo(() => {
    // prepare date ranges
    const now = Date.now();
    const periodMs = rangeDaysToMs(daysRange);
    const thisPeriodStart = now - periodMs + 1; // inclusive
    const lastPeriodStart = thisPeriodStart - periodMs;
    const thisPeriodEnd = now;

    // create date keys array (this period)
    const daysArr: string[] = [];
    for (let i = daysRange - 1; i >= 0; i--) {
      const d = new Date(now - i * 24 * 60 * 60 * 1000);
      daysArr.push(formatDateKey(d));
    }

    // aggregates
    const aggThis: Record<string, number> = {};
    const aggLast: Record<string, number> = {};

    // init zeros
    daysArr.forEach((k) => (aggThis[k] = 0));

    // last period labels (shifted)
    const lastDaysArr: string[] = [];
    for (let i = daysRange - 1; i >= 0; i--) {
      const d = new Date(now - (i + daysRange) * 24 * 60 * 60 * 1000);
      lastDaysArr.push(formatDateKey(d));
      aggLast[formatDateKey(d)] = 0;
    }

    // aggregate billings into this/last
    // billings.created_at assumed to be a number (timestamp ms)
    for (const b of approvedBillings) {
      const createdTs: number = b.created_at ?? b._creationTime ?? 0;
      const amount = Number(b.final_amount || 0);
      if (!createdTs) continue;
      if (createdTs >= thisPeriodStart && createdTs <= thisPeriodEnd) {
        const key = formatDateKey(new Date(createdTs));
        aggThis[key] = (aggThis[key] || 0) + amount;
      } else if (createdTs >= lastPeriodStart && createdTs < thisPeriodStart) {
        const key = formatDateKey(new Date(createdTs));
        aggLast[key] = (aggLast[key] || 0) + amount;
      }
    }

    const thisData = daysArr.map((k) => aggThis[k] ?? 0);
    const lastData = daysArr.map((_, idx) => {
      const k = lastDaysArr[idx];
      return aggLast[k] ?? 0;
    });

    // labels in friendly format (e.g., "Aug 05")
    const friendlyLabels = daysArr.map((k) => {
      const [y, m, d] = k.split("-");
      const dt = new Date(Number(y), Number(m) - 1, Number(d));
      return dt.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    });

    // summary numbers
    const thisSum = thisData.reduce((s, v) => s + v, 0);
    const lastSum = lastData.reduce((s, v) => s + v, 0);
    const percentChange =
      lastSum === 0 ? (thisSum === 0 ? 0 : 100) : ((thisSum - lastSum) / lastSum) * 100;

    return {
      labels: friendlyLabels,
      thisPeriodData: thisData,
      lastPeriodData: lastData,
      chartSummary: {
        thisSum,
        lastSum,
        percentChange,
      },
    };
  }, [approvedBillings, daysRange]);

  // Chart config
  const lineChartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index" as const, intersect: false },
      plugins: {
        legend: { display: true, position: "top" as const },
        tooltip: { mode: "index" as const },
      },
      scales: {
        x: {
          grid: { display: false },
        },
        y: {
          ticks: {
            callback: function (value: any) {
              // currency format
              if (typeof value === "number") return `₱${value.toLocaleString()}`;
              return value;
            },
          },
        },
      },
    }),
    []
  );

  const chartData = useMemo(() => {
    return {
      labels,
      datasets: [
        {
          label: "This period",
          data: thisPeriodData,
          borderWidth: 2,
          tension: 0.3,
          fill: true,
          backgroundColor: "rgba(99,102,241,0.12)",
          borderColor: "rgba(99,102,241,1)",
          pointRadius: 2,
        },
        compare
          ? {
              label: "Last period",
              data: lastPeriodData,
              borderWidth: 1.5,
              tension: 0.3,
              borderDash: [6, 6],
              fill: false,
              borderColor: "rgba(107,114,128,0.25)",
              pointRadius: 0,
            }
          : undefined,
      ].filter(Boolean),
    };
  }, [labels, thisPeriodData, lastPeriodData, compare]);

  const ratings = useQuery(api.ratings_and_feedback.listAll) || [];
  const overallRatingStats = useMemo(() => {
    if (!ratings.length) return { avg: 0, count: 0 };
    const sum = ratings.reduce((total: number, r: any) => total + (r.rating || 0), 0);
    const avg = sum / ratings.length;
    return { avg, count: ratings.length };
  }, [ratings]);


 
  if (isLoading || !user) {
        return (
          <div className="flex h-screen bg-gray-50">
            <DynamicSidebar />
            <div className="flex-1 flex flex-col">
              <AdminNavbar />
              <div className="flex-1 p-6 flex items-center justify-center">
                <div className="bg-white shadow rounded-lg p-6 text-center">
                  <p className="text-gray-500">Loading requests...</p>
                </div>
              </div>
            </div>
          </div>
        );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-white to-teal-50">
      <DynamicSidebar />
      <div className="flex-1 flex flex-col">
        <AdminNavbar />
        <main className="p-6 md:p-8 flex-1 overflow-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
          {/* Header */}
          <div className="flex items-start justify-between gap-6 mb-6">
            <div>
              <h1 className="text-2xl font-semibold">Admin Reports</h1>
              <p className="text-sm text-gray-500">Welcome back, {user.full_name}</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl shadow-sm">
                <label className="text-sm text-gray-600">Range</label>
                <div className="flex gap-1">
                  {[7, 30, 90].map((d) => (
                    <button
                      key={d}
                      onClick={() => setDaysRange(d)}
                      className={`px-3 py-1 rounded-lg text-sm font-medium ${
                        daysRange === d
                          ? "bg-indigo-600 text-white shadow"
                          : "bg-transparent text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      {d}d
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl shadow-sm">
                <label className="text-sm text-gray-600">Compare</label>
                <button
                  onClick={() => setCompare((v) => !v)}
                  className={`px-3 py-1 rounded-lg text-sm font-medium ${
                    compare ? "bg-indigo-600 text-white" : "bg-transparent text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {compare ? "On" : "Off"}
                </button>
              </div>
            </div>
          </div>

          {/* Top metrics */}
          <section className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <motion.div
              initial={{ y: -6, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.05 }}
              className="bg-white rounded-2xl p-4 shadow flex flex-col justify-between"
            >
              <div className="text-sm font-medium text-gray-500">New Net Income</div>
              <div className="flex items-center justify-between mt-3">
                <div>
                  <div className="text-2xl font-semibold">₱{chartSummary.thisSum.toLocaleString()}</div>
                  <div className="text-xs text-gray-500">+₱{(chartSummary.thisSum - chartSummary.lastSum).toLocaleString()} from last period</div>
                </div>
                <div className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-sm">+{chartSummary.percentChange.toFixed(1)}%</div>
              </div>
            </motion.div>

            <motion.div
              initial={{ y: -6, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl p-4 shadow"
            >
              <div className="text-sm font-medium text-gray-500">Average Sales</div>
              <div className="mt-3">
                <div className="text-2xl font-semibold">₱{Math.round(avgSale).toLocaleString()}</div>
                <div className="text-xs text-gray-500">Avg per approved billing</div>
              </div>
            </motion.div>

            <motion.div
              initial={{ y: -6, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="bg-white rounded-2xl p-4 shadow"
            >
              <div className="text-sm font-medium text-gray-500">Total Orders</div>
              <div className="mt-3">
                <div className="text-2xl font-semibold">{approvedBillings.length}</div>
                <div className="text-xs text-gray-500">Approved billings</div>
              </div>
            </motion.div>

            <motion.div
              initial={{ y: -6, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl p-4 shadow"
            >
              <div className="text-sm font-medium text-gray-500">Overall Ratings</div>
                <div className="mt-3">
                  <div className="text-2xl font-semibold">
                    {overallRatingStats.avg.toFixed(1)} ⭐
                  </div>
                  <div className="text-xs text-gray-500">
                    Based on {overallRatingStats.count} reviews
                  </div>
                </div>

            </motion.div>
          </section>

          {/* Main content: Chart + Right column */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chart area */}
            <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold">Overall Sales</h3>
                  <p className="text-sm text-gray-500">Revenue trend for the selected period</p>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500">This period</div>
                  <div className="text-xl font-semibold">₱{chartSummary.thisSum.toLocaleString()}</div>
                  <div className="text-xs text-gray-500">Last: ₱{chartSummary.lastSum.toLocaleString()}</div>
                </div>
              </div>

              <div style={{ height: 300 }}>
                <Line ref={chartRef} data={chartData as any} options={lineChartOptions as any} />
              </div>
            </div>

            {/* Right column: conversion + lists */}
            <div className="flex flex-col gap-6">
              <div className="bg-white rounded-2xl p-6 shadow">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-md font-semibold">Conversion Rate</h4>
                  <div className="text-sm text-green-600 font-semibold">{
                    // crude conversion: approved billings / requests
                    requests.length === 0 ? "0%" : `${Math.round((approvedBillings.length / requests.length) * 10000) / 100}%`
                  }</div>
                </div>
                <div className="text-sm text-gray-500 mb-3">Based on requests → approved billings</div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-500">Product views</div>
                    <div className="text-sm font-medium">—</div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-500">Add to cart</div>
                    <div className="text-sm font-medium">—</div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-500">Checkout initiated</div>
                    <div className="text-sm font-medium">{requests.length}</div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-500">Completed purchases</div>
                    <div className="text-sm font-medium">{approvedBillings.length}</div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-4 shadow divide-y">
                <div className="p-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">Design Requests</h4>
                    <div className="text-xs text-gray-500">Total {requestStats.total}</div>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-center">
                    <div className="bg-gray-50 p-2 rounded">
                      <div className="text-sm font-semibold">{requestStats.approved}</div>
                      <div className="text-gray-500">Approved</div>
                    </div>
                    <div className="bg-gray-50 p-2 rounded">
                      <div className="text-sm font-semibold">{requestStats.pending}</div>
                      <div className="text-gray-500">Pending</div>
                    </div>
                    <div className="bg-gray-50 p-2 rounded">
                      <div className="text-sm font-semibold">{requestStats.rejected}</div>
                      <div className="text-gray-500">Rejected</div>
                    </div>
                  </div>
                </div>

                <div className="p-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">Designs</h4>
                    <div className="text-xs text-gray-500">Total {designStats.total}</div>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-center">
                    <div className="bg-gray-50 p-2 rounded">
                      <div className="text-sm font-semibold">{designStats.finished}</div>
                      <div className="text-gray-500">Completed</div>
                    </div>
                    <div className="bg-gray-50 p-2 rounded">
                      <div className="text-sm font-semibold">{designStats.approved}</div>
                      <div className="text-gray-500">Approved</div>
                    </div>
                    <div className="bg-gray-50 p-2 rounded">
                      <div className="text-sm font-semibold">{designStats.revisions}</div>
                      <div className="text-gray-500">Revisions</div>
                    </div>
                  </div>
                </div>
              </div>

              
            </div>
          </section>

          {/* Tables (condensed) */}
          <section className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-2xl p-4 shadow">
              <h4 className="font-semibold mb-3">Recent Approved Billings</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-xs text-gray-500">
                    <tr>
                      <th className="p-2">Client</th>
                      <th className="p-2">Designer</th>
                      <th className="p-2">Amount</th>
                      <th className="p-2">Date</th>
                    </tr>
                  </thead>
                   <tbody>
                    {approvedBillings.slice(-8).reverse().map((b: any) => (
                      <tr key={b._id} className="border-t hover:bg-gray-50 transition">
                        <td className="p-2">
                          {getUserName(b.client_id ?? b.client)}
                        </td>
                        <td className="p-2">
                          {getUserName(b.designer_id ?? b.designer)}
                        </td>
                        <td className="p-2 font-medium text-gray-700">
                          ₱{Number(b.final_amount || 0).toLocaleString()}
                        </td>
                        <td className="p-2 text-gray-500">
                          {new Date(b.created_at || b.createdAt || Date.now()).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                    {approvedBillings.length === 0 && (
                      <tr>
                        <td colSpan={4} className="p-4 text-center text-gray-500">
                          No approved billings yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                 </table>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 shadow">
              <h4 className="font-semibold mb-3">Recent Requests</h4>
              <div className="space-y-2 text-sm text-gray-700">
                {requests.slice(-6).reverse().map((r: any) => (
                  <div key={r._id} className="p-2 bg-gray-50 rounded">
                    <div className="font-medium">{r.request_title || "Untitled"}</div>
                    <div className="text-xs text-gray-500">{r.status} • {new Date(r.created_at || Date.now()).toLocaleDateString()}</div>
                  </div>
                ))}
                {requests.length === 0 && <div className="text-gray-500">No requests yet.</div>}
              </div>
            </div>
          </section>
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default AdminReports;
