// src/pages/Requests.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { motion } from "framer-motion";
import AdminNavbar from "../components/UsersNavbar";
import DynamicSidebar from "../components/Sidebar";
import {
  CheckCircle, XCircle, Clock, AlertTriangle,
  Search, FileText, ArrowUpDown
} from "lucide-react";
import type { Id } from "../../convex/_generated/dataModel";
import { useUser } from "@clerk/clerk-react";
import RequestDetailsModal from "../components/RequestDetailsModal";

/* -------------------------
   Types
------------------------- */
interface Designer {
  _id: Id<"users">;
  firstName?: string;
  lastName?: string;
  email?: string;
}

interface Client {
  _id: Id<"users">;
  full_name?: string;
  email?: string;
}

export interface RequestType {
  _id: Id<"design_requests">;
  request_title: string;
  tshirt_type?: string;
  status: "pending" | "approved" | "completed" | "rejected" | "cancelled";
  created_at?: number;
  client?: Client;
  designer?: Designer;
}

/* -------------------------
   Status Badge
------------------------- */
const StatusBadge: React.FC<{ status: RequestType["status"] }> = ({ status }) => {
  switch (status) {
    case "pending":
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" /> Pending</span>;
    case "approved":
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"><CheckCircle className="w-3 h-3 mr-1" /> Approved</span>;
    case "rejected":
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" /> Rejected</span>;
    case "cancelled":
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800"><CheckCircle className="w-3 h-3 mr-1" /> Cancelled</span>;
    default:
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"><AlertTriangle className="w-3 h-3 mr-1" /> Unknown</span>;
  }
};

/* -------------------------
   Main Component
------------------------- */
const Requests: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<{ key: keyof RequestType | "client" | "designer"; direction: "asc" | "desc" }>({ key: "created_at", direction: "desc" });
  const [selectedRequest, setSelectedRequest] = useState<RequestType | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const designs = useQuery(api.designs.listAllDesigns);
  const requests = useQuery(api.design_requests.listAllRequests) as RequestType[] | undefined;
  const designers = useQuery(api.userQueries.listAllUsers) as Designer[] | undefined;
  const { user: clerkUser } = useUser();

  const isLoading = requests === undefined || designers === undefined;
  const userType = (clerkUser?.unsafeMetadata?.userType as "admin" | "designer" | "client") || "client";

  // --- Helpers ---
  const formatDate = (timestamp?: number) =>
    timestamp ? new Date(timestamp).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "Unknown";

  const formatTimeAgo = (timestamp?: number) => {
    if (!timestamp) return "Unknown";
    const diff = Date.now() - timestamp;
    if (diff < 3600000) return "Just now";
    if (diff < 86400000) return "Today";
    if (diff < 172800000) return "1 day ago";
    if (diff < 604800000) return `${Math.floor(diff / 86400000)} days ago`;
    return formatDate(timestamp);
  };

  const getDesignerForApprovedRequest = (request: RequestType): Designer | undefined => {
    if (!designs || !designers) return request.designer;
    const matchingDesign = designs.find((d: any) => d.request_id === request._id);
    if (!matchingDesign) return request.designer;
    const matchingDesigner = designers.find((u) => u._id === matchingDesign.designer_id);
    if (!matchingDesigner) return request.designer;
    return {
      _id: matchingDesigner._id,
      firstName: matchingDesigner.firstName ?? "",
      lastName: matchingDesigner.lastName ?? "",
      email: matchingDesigner.email ?? "",
    };
  };

  const handleSort = (key: keyof RequestType | "client" | "designer") => {
    const direction = sortConfig.key === key && sortConfig.direction === "asc" ? "desc" : "asc";
    setSortConfig({ key, direction });
  };

  const openRequestModal = (request: RequestType) => {
    setSelectedRequest(request);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedRequest(null);
  };

  // --- Filter + Sort ---
  const filteredRequests = (requests ?? [])
    .filter((r) => activeTab === "all" || r.status === activeTab)
    .filter((r) => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return (
        r.request_title.toLowerCase().includes(term) ||
        r.client?.full_name?.toLowerCase().includes(term) ||
        r.designer?.firstName?.toLowerCase().includes(term)
      );
    })
    .sort((a, b) => {
      let aVal: any, bVal: any;
      if (sortConfig.key === "client") {
        aVal = a.client?.full_name ?? "";
        bVal = b.client?.full_name ?? "";
      } else if (sortConfig.key === "designer") {
        aVal = a.designer?.firstName ?? "";
        bVal = b.designer?.firstName ?? "";
      } else {
        aVal = a[sortConfig.key] ?? "";
        bVal = b[sortConfig.key] ?? "";
      }
      if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });

  if (isLoading) {
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
    <div className="flex min-h-screen bg-gradient-to-br from-white to-gray-50">
      <DynamicSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <AdminNavbar />
        <main className="flex-1 p-6 overflow-auto">
          <motion.div
            className="bg-white shadow-md rounded-lg p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <div className="mb-4">
              <h1 className="text-2xl font-bold text-gray-900">Design Requests</h1>
              <p className="text-gray-600">Manage and review all design requests</p>
            </div>

            {/* Search + Tabs */}
            <div className="mb-4 flex flex-col gap-3">
              <div className="relative w-full">
                <input
                  type="text"
                  placeholder="Search requests..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
              <div className="flex space-x-2 overflow-x-auto pb-2 hide-scrollbar">
                {["all", "pending", "approved", "rejected"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab as typeof activeTab)}
                    className={`px-3 py-2 rounded-lg text-xs font-medium ${
                      activeTab === tab
                        ? "bg-teal-100 text-teal-800"
                        : "bg-white text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Requests Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              {filteredRequests.length === 0 ? (
                <div className="p-6 text-center">
                  <FileText className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 text-sm">No requests found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        {["request_title", "client", "designer", "status", "created_at"].map((col) => (
                          <th
                            key={col}
                            onClick={() => handleSort(col as keyof RequestType | "client" | "designer")}
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                          >
                            <div className="flex items-center">
                              {col.toUpperCase()}{" "}
                              {sortConfig.key === col && <ArrowUpDown className="ml-1 h-4 w-4" />}
                            </div>
                          </th>
                        ))}
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredRequests.map((request) => {
                        const finalDesigner = getDesignerForApprovedRequest(request);
                        return (
                          <tr key={request._id.toString()} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{request.request_title}</div>
                              <div className="text-sm text-gray-500">{request.tshirt_type || "T-shirt"}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{request.client?.full_name || "Unknown"}</div>
                              <div className="text-sm text-gray-500">{request.client?.email || ""}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {finalDesigner?.firstName || "Unassigned"} {finalDesigner?.lastName || ""}
                              </div>
                              <div className="text-sm text-gray-500">{finalDesigner?.email || ""}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <StatusBadge status={request.status} />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatTimeAgo(request.created_at)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <button
                                onClick={() => openRequestModal(request)}
                                className="text-teal-600 hover:text-teal-900 px-3 py-1 rounded-md hover:bg-teal-50 transition-colors"
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
              )}
            </div>
          </motion.div>
        </main>
      </div>

      {/* ✅ Modal Integration */}
      {selectedRequest && (
        <RequestDetailsModal
          request={selectedRequest}
          isOpen={isModalOpen}
          onClose={closeModal}
          userType={userType}
        />
      )}
    </div>
  );
};

export default Requests;
