import { useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { motion } from "framer-motion";
import { FileSpreadsheet, FileText } from "lucide-react";

import { exportToPDF } from "../utils/exportOrderToPdf";
import { exportToExcel } from "../utils/exportOrderToExcel";

const AdminOrdersReport: React.FC = () => {
  const billings = useQuery(api.billing.listAll) || [];
  const designs = useQuery(api.designs.listAllDesigns) || [];
  const users = useQuery(api.userQueries.listAll) || [];

  const completedOrders = useMemo(() => {
    return billings.filter((b: any) => {
      const design = designs.find((d: any) => d._id === b.design_id);
      return design?.status === "completed" && b.status === "approved";
    });
  }, [billings, designs]);

  const getUserName = (id: string) => {
    const user = users.find((u: any) => u._id === id);
    return user ? `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim() : "Unknown";
  };

  const formattedData = completedOrders.map((o: any) => ({
    bookingNo: o._id,
    client: getUserName(o.client_id),
    designer: getUserName(o.designer_id),
    amount: `₱${Number(o.final_amount).toLocaleString()}`,
    date: new Date(o.created_at || o._creationTime).toLocaleDateString(),
    status: o.status,
  }));

  return (
    <main >    {/* Header Section */}
      <motion.div
        className="bg-white shadow-md rounded-lg p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        <div className="mb-4">
          <div className="p-6 bg-white rounded-lg border border-slate-50 shadow-md w-full">
            {/* Header Row */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Order Sales Report</h1>
                <p className="text-gray-600">View and export all completed sales</p>
              </div>

              {/* Export Buttons */}
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  title="Export PDF"
                  aria-label="Export PDF"
                  onClick={() => exportToPDF(formattedData, "Orders_Report")}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-teal-600 border border-teal-500 rounded-lg hover:bg-teal-500 hover:text-white transition"
                >
                  <FileText size={18} /> Export as PDF
                </button>
                <button
                  title="Export Excel"
                  aria-label="Export Excel"
                  type="button"
                  onClick={() => exportToExcel(formattedData, "Orders_Report")}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-teal-600 border border-teal-500 rounded-lg hover:bg-teal-500 hover:text-white transition"
                >
                  <FileSpreadsheet size={18} /> Export as Excel
                </button>
              </div>
            </div>

            {/* Stats Summary */}
            <div className="mt-6 grid sm:grid-cols-2 gap-3 text-sm text-gray-600">
              <div>
                Total Orders:{" "}
                <span className="font-semibold text-gray-900">{formattedData.length}</span>
              </div>
              <div>
                Total Revenue:{" "}
                <span className="font-semibold text-teal-600">
                  ₱
                  {formattedData
                    .reduce((sum, order) => {
                      const amount = parseFloat(order.amount.replace(/[₱,]/g, "")) || 0;
                      return sum + amount;
                    }, 0)
                    .toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-lg border border-slate-50 shadow-md overflow-hidden w-full">
          {formattedData.length === 0 ? (
            <div className="p-8 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No completed orders found</p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full table-auto divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {["#", "Client", "Designer", "Amount", "Date", "Status", "Actions"].map(
                        (header) => (
                          <th
                            key={header}
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            {header}
                          </th>
                        )
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {formattedData.map((o, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{idx + 1}</td>
                        <td className="px-6 py-4">{o.client}</td>
                        <td className="px-6 py-4">{o.designer}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{o.amount}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{o.date}</td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {o.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => exportToPDF([o], `Order_${idx + 1}`)}
                              className="px-3 py-1 text-xs font-semibold bg-cyan-600 text-white rounded-md hover:bg-cyan-700 transition"
                            >
                              Export PDF
                            </button>
                            <button
                              onClick={() => exportToExcel([o], `Order_${idx + 1}`)}
                              className="px-3 py-1 text-xs font-semibold bg-teal-600 text-white rounded-md hover:bg-teal-700 transition"
                            >
                              Export Excel
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden grid grid-cols-1 gap-4 p-4">
                {formattedData.map((o, idx) => (
                  <div key={idx} className="bg-white border rounded-lg p-4 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                      <div className="text-sm font-medium text-gray-900">Order #{idx + 1}</div>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {o.status}
                      </span>
                    </div>
                    <div className="space-y-1 text-sm text-gray-600">
                      <div><span className="font-medium">Client:</span> {o.client}</div>
                      <div><span className="font-medium">Designer:</span> {o.designer}</div>
                      <div><span className="font-medium">Amount:</span> {o.amount}</div>
                      <div><span className="font-medium">Date:</span> {o.date}</div>
                    </div>
                    <div className="flex space-x-2 mt-3">
                      <button
                        onClick={() => exportToPDF([o], `Order_${idx + 1}`)}
                        className="flex-1 px-3 py-2 text-sm bg-cyan-600 text-white rounded hover:bg-cyan-700 transition"
                      >
                        Export PDF
                      </button>
                      <button
                        onClick={() => exportToExcel([o], `Order_${idx + 1}`)}
                        className="flex-1 px-3 py-2 text-sm bg-teal-600 text-white rounded hover:bg-teal-700 transition"
                      >
                        Export Excel
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </motion.div>
    </main>
  );
};

export default AdminOrdersReport;
