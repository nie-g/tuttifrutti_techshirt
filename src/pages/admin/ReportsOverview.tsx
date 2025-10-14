// src/pages/admin/ReportsOverview.tsx
import { motion } from "framer-motion";
import { Line } from "react-chartjs-2";
import ReportsMetrics from "./AdminMetricsCard";

interface ReportsOverviewProps {
  user: { full_name: string };
  chartSummary: any;
  chartData: any;
  lineChartOptions: any;
  chartRef: any;
  approvedBillings: any[];
  requests: any[];
  requestStats: any;
  designStats: any;
  getUserName: (id: string) => string;
}

const ReportsOverview: React.FC<ReportsOverviewProps> = ({
  user,
  chartSummary,
  chartData,
  lineChartOptions,
  chartRef,
  approvedBillings,
  requests,
  requestStats,
  designStats,
  getUserName,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-6 mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Admin Reports</h1>
          <p className="text-sm text-gray-500">
            Welcome back, {user.full_name}
          </p>
        </div>
      </div>
      <ReportsMetrics />

      {/* Main content: Chart + Right column */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart area */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold">Overall Sales</h3>
              <p className="text-sm text-gray-500">
                Revenue trend for the selected period
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">This period</div>
              <div className="text-xl font-semibold">
                ₱{chartSummary.thisSum.toLocaleString()}
              </div>
              <div className="text-xs text-gray-500">
                Last: ₱{chartSummary.lastSum.toLocaleString()}
              </div>
            </div>
          </div>

          <div style={{ height: 300 }}>
            <Line ref={chartRef} data={chartData} options={lineChartOptions} />
          </div>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-6">
          {/* Conversion */}
          <div className="bg-white rounded-2xl p-6 shadow">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-md font-semibold">Conversion Rate</h4>
              <div className="text-sm text-green-600 font-semibold">
                {requests.length === 0
                  ? "0%"
                  : `${Math.round(
                      (approvedBillings.length / requests.length) * 10000
                    ) / 100}%`}
              </div>
            </div>
            <div className="text-sm text-gray-500 mb-3">
              Based on requests → approved billings
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-500">Checkout initiated</div>
                <div className="text-sm font-medium">{requests.length}</div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-500">Completed purchases</div>
                <div className="text-sm font-medium">
                  {approvedBillings.length}
                </div>
              </div>
            </div>
          </div>

          {/* Design Stats */}
          <div className="bg-white rounded-2xl p-4 shadow divide-y">
            <div className="p-3">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">Design Requests</h4>
                <div className="text-xs text-gray-500">
                  Total {requestStats.total}
                </div>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-center">
                <div className="bg-gray-50 p-2 rounded">
                  <div className="text-sm font-semibold">
                    {requestStats.approved}
                  </div>
                  <div className="text-gray-500">Approved</div>
                </div>
                <div className="bg-gray-50 p-2 rounded">
                  <div className="text-sm font-semibold">
                    {requestStats.pending}
                  </div>
                  <div className="text-gray-500">Pending</div>
                </div>
                <div className="bg-gray-50 p-2 rounded">
                  <div className="text-sm font-semibold">
                    {requestStats.rejected}
                  </div>
                  <div className="text-gray-500">Rejected</div>
                </div>
              </div>
            </div>

            <div className="p-3">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">Designs</h4>
                <div className="text-xs text-gray-500">
                  Total {designStats.total}
                </div>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-center">
                <div className="bg-gray-50 p-2 rounded">
                  <div className="text-sm font-semibold">
                    {designStats.finished}
                  </div>
                  <div className="text-gray-500">Completed</div>
                </div>
                <div className="bg-gray-50 p-2 rounded">
                  <div className="text-sm font-semibold">
                    {designStats.approved}
                  </div>
                  <div className="text-gray-500">Approved</div>
                </div>
                <div className="bg-gray-50 p-2 rounded">
                  <div className="text-sm font-semibold">
                    {designStats.revisions}
                  </div>
                  <div className="text-gray-500">Revisions</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tables Section */}
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
                  <tr
                    key={b._id}
                    className="border-t hover:bg-gray-50 transition"
                  >
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
                      {new Date(
                        b.created_at || b.createdAt || Date.now()
                      ).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
                {approvedBillings.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="p-4 text-center text-gray-500"
                    >
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
                <div className="text-xs text-gray-500">
                  {r.status} •{" "}
                  {new Date(r.created_at || Date.now()).toLocaleDateString()}
                </div>
              </div>
            ))}
            {requests.length === 0 && (
              <div className="text-gray-500">No requests yet.</div>
            )}
          </div>
        </div>
      </section>
    </motion.div>
  );
};

export default ReportsOverview;
