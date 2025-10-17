import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { motion } from "framer-motion";
import { FileSpreadsheet, FileText } from "lucide-react";
import { exportDesignReportToPDF } from "../utils/exportDesignsToPdf";
import { exportRequestToExcel } from "../utils/exportRequestToExcel";

const AdminDesignReports: React.FC = () => {
  // ✅ Fetch all designs and all users
  const designs = useQuery(api.designs.listAllDesigns) || [];
  const users = useQuery(api.userQueries.listAll) || [];

  const [statusFilter, setStatusFilter] = useState("all");

  // ✅ Join client/designer names from users table
  const enrichedDesigns = useMemo(() => {
    if (!users.length) return designs;

    return designs.map((d: any) => {
      const clientUser = users.find((u: any) => u._id === d.client_id);
      const designerUser = users.find((u: any) => u._id === d.designer_id);

      return {
        ...d,
        clientName: clientUser
          ? `${clientUser.first_name} ${clientUser.last_name}`
          : "Unknown Client",
        designerName: designerUser
          ? `${designerUser.first_name} ${designerUser.last_name}`
          : "Unknown Designer",
      };
    });
  }, [designs, users]);

  // ✅ Filter by status
  const filteredDesigns = useMemo(() => {
    if (statusFilter === "all") return enrichedDesigns;
    return enrichedDesigns.filter((d: any) => d.status === statusFilter);
  }, [enrichedDesigns, statusFilter]);

  // ✅ Format for export
  const formattedData = filteredDesigns.map((d: any) => ({
    designId: d._id,
    client: d.clientName,
    designer: d.designerName,
    revisionCount: d.revision_count ?? 0,
    status: d.status,
    deadline: d.deadline ?? "N/A",
    createdAt: new Date(d.created_at || d._creationTime).toLocaleDateString(),
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
                  Design Reports
                </h1>
                <p className="text-gray-600">
                  View and export all approved, pending, and completed designs
                </p>
              </div>

              {/* Export Buttons */}
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() =>
                    exportDesignReportToPDF(formattedData, "Design_Report")
                  }
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-teal-600 border border-teal-500 rounded-lg hover:bg-teal-500 hover:text-white transition"
                >
                  <FileText size={18} /> Export as PDF
                </button>
                <button
                  onClick={() =>
                    exportRequestToExcel(formattedData, "Design_Report")
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
                <span className="text-sm font-medium">Filter by Status:</span>
              </div>
              {[
                "all",
                "in_progress",
                "pending_revision",
                "in_production",
                "pending_pickup",
                "completed",
                "approved",
              ].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1 text-sm rounded-full border transition ${
                    statusFilter === status
                      ? "bg-teal-500 text-white border-teal-500"
                      : "border-gray-300 text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {status.replace("_", " ")}
                </button>
              ))}
            </div>

            {/* Stats */}
            <div className="mt-6 text-sm text-gray-600">
              Total Designs:{" "}
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
              <p className="text-gray-600">No designs found</p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full table-auto divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-10">
                        #
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">
                        Client
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">
                        Designer
                        </th>
                        <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                        Revisions
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                        Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                        Deadline
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                        Date
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-28">
                        Actions
                        </th>
                    </tr>
                    </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {formattedData.map((d, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-4 py-4 text-sm font-medium text-gray-900">
                          {idx + 1}
                        </td>
                        <td className="px-4 py-4 text-sm ">{d.client}</td>
                        <td className="px-4 py-4 text-sm">{d.designer}</td>
                        <td className="px-4 py-4 text-sm">{d.revisionCount}</td>
                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              d.status === "approved"
                                ? "bg-cyan-100 text-cyan-800"
                                : d.status === "pending_revision"
                                ? "bg-yellow-100 text-yellow-800"
                                : d.status === "in_production"
                                ? "bg-blue-100 text-blue-800"
                                : d.status === "completed"
                                ? "bg-green-100 text-green-800"
                                  : d.status === "pending_pickup"
                                ? "bg-purple-100 text-purple-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {d.status.replace("_", " ")}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm ">{d.deadline}</td>
                        <td className="px-6 py-4 text-sm">
                          {d.createdAt}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex space-x-2">
                            <button
                              onClick={() =>
                                exportDesignReportToPDF([d], `Design_${idx + 1}`)
                              }
                              className="px-3 py-1 text-xs font-semibold bg-cyan-600 text-white rounded-md hover:bg-cyan-700 transition"
                            >
                              PDF
                            </button>
                            <button
                              onClick={() =>
                                exportRequestToExcel([d], `Design_${idx + 1}`)
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
            </>
          )}
        </div>
      </motion.div>
    </main>
  );
};

export default AdminDesignReports;
