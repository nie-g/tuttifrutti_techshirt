import { useEffect, useState, useMemo, useRef } from "react";
import { motion } from "framer-motion";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useUser } from "@clerk/clerk-react";
import AdminNavbar from "../components/UsersNavbar";
import DynamicSidebar from "../components/Sidebar";
import ReportsOverview from "./admin/ReportsOverview";
import SalesReport from "./admin/SalesReports"; // ✅ Import your OrdersReport component
import AdminRequestReports from "./admin/RequestReports";


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

// Helpers
const formatDateKey = (d: Date) => {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const rangeDaysToMs = (days: number) => days * 24 * 60 * 60 * 1000;

const AdminReports: React.FC = () => {
  const [user, setUser] = useState<{ full_name: string } | null>(null);
  const { isLoaded, isSignedIn, user: clerkUser } = useUser();

  // Convex queries
  const billings = useQuery(api.billing.listAll) || [];
  const requests = useQuery(api.design_requests.listAllRequests) || [];
  const designs = useQuery(api.designs.listAllDesigns) || [];
  const users = useQuery(api.userQueries.listAll) || [];

  const isLoading =
    billings === undefined || requests === undefined || designs === undefined;

  // UI state
  const [activeTab, setActiveTab] = useState<"overview" | "orders"| "requests">("overview");
  const [daysRange, _setDaysRange] = useState<number>(30);
  const [compare, _setCompare] = useState<boolean>(true);
  const [useCustomRange, _setUseCustomRange] = useState<boolean>(false);
  const [customStartDate, _setCustomStartDate] = useState<string>("");
  const [customEndDate, _setCustomEndDate] = useState<string>("");
  const chartRef = useRef<any>(null);

  const getUserName = (userId: string) => {
    const user = users.find((u: any) => u._id === userId);
    if (!user) return "—";
    return `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim() || "Unnamed";
  };

  // --- Auth check ---
  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) return;
    if (clerkUser) {
      const role = clerkUser.unsafeMetadata?.userType;
      if (role === "admin") {
        setUser({
          full_name: clerkUser.fullName || clerkUser.username || "admin",
        });
      }
    }
  }, [isLoaded, isSignedIn, clerkUser]);

  // derived: approved billings only
  const approvedBillings = useMemo(() => {
    return billings.filter((b: any) => {
      if (b.status !== "approved") return false;
      const linkedDesign = designs.find(
        (d: any) => d._id === b.design_id || d._id === b.design
      );
      return linkedDesign?.status === "completed";
    });
  }, [billings, designs]);

  // Stats
  const requestStats = useMemo(() => ({
    total: requests.length,
    pending: requests.filter((r: any) => r.status === "pending").length,
    approved: requests.filter((r: any) => r.status === "approved").length,
    rejected: requests.filter((r: any) => r.status === "rejected").length,
  }), [requests]);

  const designStats = useMemo(() => ({
    total: designs.length,
    finished: designs.filter((d: any) => d.status === "completed").length,
    approved: designs.filter((d: any) => d.status === "approved").length,
    revisions: designs.filter((d: any) => d.status === "pending_revision").length,
  }), [designs]);

  // ===============================
  // Build Chart Data
  // ===============================
  const { labels, thisPeriodData, lastPeriodData, chartSummary } = useMemo(() => {
    let startTime: number;
    let endTime: number;
    let now = Date.now();

    if (useCustomRange && customStartDate && customEndDate) {
      startTime = new Date(customStartDate).getTime();
      endTime = new Date(customEndDate).getTime();
    } else {
      const periodMs = rangeDaysToMs(daysRange);
      startTime = now - periodMs + 1;
      endTime = now;
    }

    const daysArr: string[] = [];
    const diffDays = Math.ceil((endTime - startTime) / (24 * 60 * 60 * 1000));

    for (let i = 0; i <= diffDays; i++) {
      const d = new Date(startTime + i * 24 * 60 * 60 * 1000);
      daysArr.push(formatDateKey(d));
    }

    const aggThis: Record<string, number> = {};
    const aggLast: Record<string, number> = {};
    daysArr.forEach((k) => (aggThis[k] = 0));

    const lastDaysArr: string[] = [];
    for (let i = 0; i <= diffDays; i++) {
      const d = new Date(startTime - (diffDays - i + 1) * 24 * 60 * 60 * 1000);
      lastDaysArr.push(formatDateKey(d));
      aggLast[formatDateKey(d)] = 0;
    }

    for (const b of approvedBillings) {
      const createdTs: number = b.created_at ?? b._creationTime ?? 0;
      const amount = Number(b.final_amount || 0);
      if (!createdTs) continue;

      if (createdTs >= startTime && createdTs <= endTime) {
        const key = formatDateKey(new Date(createdTs));
        aggThis[key] = (aggThis[key] || 0) + amount;
      } else if (!useCustomRange && createdTs < startTime && createdTs >= startTime - rangeDaysToMs(daysRange)) {
        const key = formatDateKey(new Date(createdTs));
        aggLast[key] = (aggLast[key] || 0) + amount;
      }
    }

    const thisData = daysArr.map((k) => aggThis[k] ?? 0);
    const lastData = daysArr.map((_, idx) => aggLast[lastDaysArr[idx]] ?? 0);

    const friendlyLabels = daysArr.map((k) => {
      const [y, m, d] = k.split("-");
      const dt = new Date(Number(y), Number(m) - 1, Number(d));
      return dt.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    });

    const thisSum = thisData.reduce((s, v) => s + v, 0);
    const lastSum = lastData.reduce((s, v) => s + v, 0);
    const percentChange =
      lastSum === 0 ? (thisSum === 0 ? 0 : 100) : ((thisSum - lastSum) / lastSum) * 100;

    return { labels: friendlyLabels, thisPeriodData: thisData, lastPeriodData: lastData, chartSummary: { thisSum, lastSum, percentChange } };
  }, [approvedBillings, daysRange, useCustomRange, customStartDate, customEndDate]);

  const lineChartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index" as const, intersect: false },
      plugins: { legend: { display: true, position: "top" as const } },
      scales: {
        x: { grid: { display: false } },
        y: {
          ticks: {
            callback: function (value: any) {
              if (typeof value === "number") return `₱${value.toLocaleString()}`;
              return value;
            },
          },
        },
      },
    }),
    []
  );

  const chartData = useMemo(() => ({
    labels,
    datasets: [
      {
        label: useCustomRange ? "Selected Range" : "This period",
        data: thisPeriodData,
        borderWidth: 2,
        tension: 0.3,
        fill: true,
        backgroundColor: "rgba(99,102,241,0.12)",
        borderColor: "rgba(99,102,241,1)",
        pointRadius: 2,
      },
      compare && !useCustomRange
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
  }), [labels, thisPeriodData, lastPeriodData, compare, useCustomRange]);

  if (isLoading || !user) {
    return (
      <div className="flex h-screen bg-gray-50">
        <DynamicSidebar />
        <div className="flex-1 flex flex-col">
          <AdminNavbar />
          <div className="flex-1 flex items-center justify-center">
            <div className="bg-white shadow rounded-lg p-6 text-center">
              <p className="text-gray-500">Loading reports...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ===============================
  // JSX
  // ===============================
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-white to-teal-50">
      <DynamicSidebar />
      <div className="flex-1 flex flex-col">
        <AdminNavbar />
        <main className="p-6 md:p-8 flex-1 overflow-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            {/* Sub Navigation */}
            <div className="flex gap-3 mt-2 mb-6">
              <button
                onClick={() => setActiveTab("overview")}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  activeTab === "overview"
                    ? " text-teal-600 bg-gray-100"
                    : " text-gray-700 hover:bg-gray-200"
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab("orders")}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  activeTab === "orders"
                   ? " text-teal-600 bg-gray-100"
                    : " text-gray-700 hover:bg-gray-200"
                }`}
              >
                Sales Report
              </button>
              <button
                onClick={() => setActiveTab("requests")}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  activeTab === "requests"
                    ? " text-teal-600 bg-gray-100"
                    : " text-gray-700 hover:bg-gray-200"
                }`}
              >
                Design Request Report
              </button>
            </div>

            {/* Content Switching */}
            {activeTab === "overview" ? (
            <ReportsOverview
              user={user}
              chartSummary={chartSummary}
              chartData={chartData}
              lineChartOptions={lineChartOptions}
              chartRef={chartRef}
              approvedBillings={approvedBillings}
              requests={requests}
              requestStats={requestStats}
              designStats={designStats}
              getUserName={getUserName}
            />
          ) : activeTab === "orders" ? (
            <SalesReport />
          ) : (
            <AdminRequestReports />
          )}

          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default AdminReports;
