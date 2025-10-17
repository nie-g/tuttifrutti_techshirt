import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { motion } from "framer-motion";
import { FileSpreadsheet, FileText, Filter } from "lucide-react";

import { exportRequestToPDF } from "../utils/exportRequestToPdf";
import { exportRequestToExcel } from "../utils/exportRequestToExcel";

const AdminRequestReports: React.FC = () => {
  // ✅ Fetch from design_requests table instead of designs
  const requests = useQuery(api.design_requests.listAllRequests) || [];

  const [statusFilter, setStatusFilter] = useState("all");

  // ✅ Filter requests by status
  const filteredRequests = useMemo(() => {
    if (statusFilter === "all") return requests;
    return requests.filter((r: any) => r.status === statusFilter);
  }, [requests, statusFilter]);

  // ✅ Format for table and export
  const formattedData = filteredRequests.map((r: any) => ({
    requestId: r._id,
    client: r.client?.full_name ?? "Unknown",
    title: r.request_title ?? "Untitled Request",
    tshirtType: r.tshirt_type ?? "N/A",
    printType: r.print_type ?? "N/A",
    description: r.description || "No details provided",
    status: r.status,
    createdAt: new Date(r.created_at || r._creationTime).toLocaleDateString(),
  }));

  return (
    <main>
      <motion.div
        className="bg-white shadow-md rounded-lg p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        {/* Header */}
        <div className="mb-4">
          <div className="p-6 bg-white rounded-lg border border-slate-50 shadow-md w-full">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                  Design Request Reports
                </h1>
                <p className="text-gray-600">
                  View and export all client design requests
                </p>
              </div>

              {/* Export Buttons */}
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  title="Export PDF"
                  aria-label="Export PDF"
                  onClick={() =>
                    exportRequestToPDF(formattedData, "Design_Request_Report")
                  }
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-teal-600 border border-teal-500 rounded-lg hover:bg-teal-500 hover:text-white transition"
                >
                  <FileText size={18} /> Export as PDF
                </button>
                <button
                  title="Export Excel"
                  aria-label="Export Excel"
                  type="button"
                  onClick={() =>
                    exportRequestToExcel(formattedData, "Design_Request_Report")
                  }
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-teal-600 border border-teal-500 rounded-lg hover:bg-teal-500 hover:text-white transition"
                >
                  <FileSpreadsheet size={18} /> Export as Excel
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="mt-6 flex flex-wrap gap-3 items-center">
              <div className="flex items-center gap-2 text-gray-700">
                <Filter size={16} />
                <span className="text-sm font-medium">Filter by Status:</span>
              </div>
              {["all", "pending", "approved", "declined", "cancelled"].map(
                (status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-3 py-1 text-sm rounded-full border transition ${
                      statusFilter === status
                        ? "bg-teal-500 text-white border-teal-500"
                        : "border-gray-300 text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                )
              )}
            </div>

            {/* Stats */}
            <div className="mt-6 text-sm text-gray-600">
              Total Requests:{" "}
              <span className="font-semibold text-gray-900">
                {formattedData.length}
              </span>
            </div>
          </div>
        </div>

        {/* Table Section */}
        <div className="bg-white rounded-lg border border-slate-50 shadow-md overflow-hidden w-full">
          {formattedData.length === 0 ? (
            <div className="p-8 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No design requests found</p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full table-auto divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {[
                        "#",
                        "Client",
                        "Title",
                        "T-shirt Type",
                        "Print Type",
                        "Status",
                        "Date",
                        "Actions",
                      ].map((header) => (
                        <th
                          key={header}
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {formattedData.map((r, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {idx + 1}
                        </td>
                        <td className="px-6 py-4">{r.client}</td>
                        <td className="px-6 py-4">{r.title}</td>
                        <td className="px-6 py-4">{r.tshirtType}</td>
                        <td className="px-6 py-4">{r.printType}</td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              r.status === "approved"
                                ? "bg-green-100 text-green-800"
                                : r.status === "pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : r.status === "rejected"
                                ? "bg-red-100 text-red-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {r.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {r.createdAt}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex space-x-2">
                            <button
                              onClick={() =>
                                exportRequestToPDF([r], `Request_${idx + 1}`)
                              }
                              className="px-3 py-1 text-xs font-semibold bg-cyan-600 text-white rounded-md hover:bg-cyan-700 transition"
                            >
                              PDF
                            </button>
                            <button
                              onClick={() =>
                                exportRequestToExcel([r], `Request_${idx + 1}`)
                              }
                              className="px-3 py-1 text-xs font-semibold bg-teal-600 text-white rounded-md hover:bg-teal-700 transition"
                            >
                              Excel
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
                {formattedData.map((r, idx) => (
                  <div
                    key={idx}
                    className="bg-white border rounded-lg p-4 shadow-sm"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="text-sm font-medium text-gray-900">
                        Request #{idx + 1}
                      </div>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          r.status === "approved"
                            ? "bg-green-100 text-green-800"
                            : r.status === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : r.status === "rejected"
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {r.status}
                      </span>
                    </div>
                    <div className="space-y-1 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Client:</span> {r.client}
                      </div>
                      <div>
                        <span className="font-medium">Title:</span> {r.title}
                      </div>
                      <div>
                        <span className="font-medium">T-shirt Type:</span>{" "}
                        {r.tshirtType}
                      </div>
                      <div>
                        <span className="font-medium">Print Type:</span>{" "}
                        {r.printType}
                      </div>
                      <div>
                        <span className="font-medium">Date:</span> {r.createdAt}
                      </div>
                    </div>
                    <div className="flex space-x-2 mt-3">
                      <button
                        onClick={() =>
                          exportRequestToPDF([r], `Request_${idx + 1}`)
                        }
                        className="flex-1 px-3 py-2 text-sm bg-cyan-600 text-white rounded hover:bg-cyan-700 transition"
                      >
                        PDF
                      </button>
                      <button
                        onClick={() =>
                          exportRequestToExcel([r], `Request_${idx + 1}`)
                        }
                        className="flex-1 px-3 py-2 text-sm bg-teal-600 text-white rounded hover:bg-teal-700 transition"
                      >
                        Excel
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

export default AdminRequestReports;
