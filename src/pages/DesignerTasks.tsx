// src/pages/DesignerTasks.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useUser } from "@clerk/clerk-react";
import AdminNavbar from "../components/UsersNavbar";
import DynamicSidebar from "../components/Sidebar";
import StatusBadge from "../components/StatusBadge";
import RequestDetailsModal from "../components/RequestDetailsModal"; // import your modal
import { FileText, ArrowUpDown, Search } from "lucide-react";
import type { Id } from "../../convex/_generated/dataModel";

interface ConvexUser {
  _id: Id<"users">;
  clerkId?: string;
  full_name?: string;
  role?: "designer" | "client" | "admin";
}

interface DesignRequestRecord {
  _id: Id<"design_requests">;
  designId: Id<"design">;
  request_title: string;
  status: "pending" | "approved" | "in_progress" | "completed" | "rejected";
  created_at?: number;
  _creationTime?: number;
  tshirt_type?: string;
  client?: { full_name?: string; email?: string };
  designer_id?: Id<"users">;
  description?: string;
  [k: string]: any;
}

function formatTimeAgo(timestamp?: number) {
  if (!timestamp) return "Unknown";
  const diff = Date.now() - timestamp;
  if (diff < 60 * 60 * 1000) return "Just now";
  if (diff < 24 * 60 * 60 * 1000) return "Today";
  if (diff < 48 * 60 * 60 * 1000) return "1 day ago";
  if (diff < 7 * 24 * 60 * 60 * 1000)
    return `${Math.floor(diff / (24 * 60 * 60 * 1000))} days ago`;
  return new Date(timestamp).toLocaleDateString();
}

const DesignerTasks: React.FC = () => {
  const navigate = useNavigate();
  const { user: clerkUser } = useUser();
  const [user, setUser] = useState<ConvexUser | null>(null);
  const [activeTab, setActiveTab] = useState<
    "all" | "pending" | "approved" | "in_progress" | "completed" | "rejected"
  >("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" }>({
    key: "created_at",
    direction: "desc",
  });
  const [isLoading, setIsLoading] = useState(true);

  // Modal state
  const [selectedRequest, setSelectedRequest] = useState<DesignRequestRecord | null>(null);

  // Always call hooks, even if clerkUser is undefined
  const currentUser = useQuery(
    api.userQueries.getUserByClerkId,
    clerkUser ? { clerkId: clerkUser.id } : "skip"
  ) as ConvexUser | null | undefined;

  useEffect(() => {
    if (currentUser === undefined) return;
    if (!currentUser || currentUser.role !== "designer") {
      navigate("/sign-in");
      return;
    }
    setUser(currentUser);
  }, [currentUser, navigate]);

  // Fetch all requests assigned to this designer
  const designRequests = useQuery(
    api.design_requests.getRequestsByDesigner,
    user ? { designerId: user._id } : "skip"
  ) as DesignRequestRecord[] | undefined;

  useEffect(() => {
    if (designRequests !== undefined) setIsLoading(false);
  }, [designRequests]);

  const handleSort = (key: string) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") direction = "desc";
    setSortConfig({ key, direction });
  };

  const filteredRequests = (designRequests ?? [])
    .filter((req) => {
      if (activeTab !== "all" && req.status !== activeTab) return false;
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        return (
          req.request_title.toLowerCase().includes(term) ||
          (req.client?.full_name?.toLowerCase().includes(term) ?? false) ||
          (req.tshirt_type?.toLowerCase().includes(term) ?? false)
        );
      }
      return true;
    })
    .sort((a, b) => {
      const { key, direction } = sortConfig;
      let aVal: any, bVal: any;
      if (key === "client") {
        aVal = a.client?.full_name ?? "";
        bVal = b.client?.full_name ?? "";
      } else if (key === "created_at") {
        aVal = a.created_at ?? a._creationTime ?? 0;
        bVal = b.created_at ?? b._creationTime ?? 0;
      } else {
        aVal = a[key] ?? "";
        bVal = b[key] ?? "";
      }
      if (aVal < bVal) return direction === "asc" ? -1 : 1;
      if (aVal > bVal) return direction === "asc" ? 1 : -1;
      return 0;
    });

  if (!user || isLoading)
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="p-4 text-center">
          <div className="w-16 h-16 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading tasks...</p>
        </div>
      </div>
    );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="flex min-h-screen bg-gradient-to-br from-white to-teal-50"
    >
      <DynamicSidebar />
      <div className="flex-1 flex flex-col">
        <AdminNavbar />
        <main className="p-6 md:p-8 flex flex-col gap-6 overflow-auto">
          {/* Header */}
          <div className="p-6 bg-white rounded-2xl shadow-md">
            <h1 className="text-2xl font-bold text-gray-900">My Tasks</h1>
            <p className="text-gray-600">Manage your assigned design requests</p>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-6 gap-4">
              <div className="relative w-full sm:w-auto">
                <input
                  type="text"
                  placeholder="Search tasks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent shadow-sm w-full sm:w-64"
                />
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              </div>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex overflow-x-auto pb-2 hide-scrollbar">
            <div className="flex space-x-2 min-w-max">
              {["all", "pending", "approved", "in_progress", "completed", "rejected"].map(
                (tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab as typeof activeTab)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                      activeTab === tab
                        ? "bg-teal-100 text-teal-800"
                        : "bg-white text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {tab.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Task Table */}
          <div className="bg-white rounded-2xl shadow-md overflow-hidden">
            {filteredRequests.length === 0 ? (
              <div className="p-8 text-center">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No tasks found</p>
                <p className="text-gray-500 text-sm mt-1">
                  Tasks will appear here when assigned to you
                </p>
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        {["request_title", "client", "tshirt_type", "status", "created_at"].map(
                          (key) => (
                            <th
                              key={key}
                              scope="col"
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                              onClick={() => handleSort(key)}
                            >
                              <div className="flex items-center">
                                {key.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                                {sortConfig.key === key && <ArrowUpDown className="ml-1 h-4 w-4" />}
                              </div>
                            </th>
                          )
                        )}
                        <th
                          scope="col"
                          className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredRequests.map((req) => (
                        <tr key={req._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">{req.request_title}</td>
                          <td className="px-6 py-4 whitespace-nowrap">{req.client?.full_name ?? "Unknown"}</td>
                          <td className="px-6 py-4 whitespace-nowrap">{req.tshirt_type ?? "T-shirt"}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <StatusBadge status={req.status} />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatTimeAgo(req.created_at ?? req._creationTime)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              className="text-teal-600 hover:text-teal-900"
                              onClick={() => setSelectedRequest(req)}
                            >
                              View Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden grid grid-cols-1 gap-4 px-4 py-4">
                  {filteredRequests.map((req) => (
                    <div
                      key={req._id}
                      className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-base font-medium text-gray-900 break-words">{req.request_title}</h3>
                        <StatusBadge status={req.status} />
                      </div>
                      <div className="space-y-1 text-sm text-gray-900">
                        <p>Client: {req.client?.full_name ?? "Unknown"}</p>
                        <p>Type: {req.tshirt_type ?? "T-shirt"}</p>
                        <p>Date: {formatTimeAgo(req.created_at ?? req._creationTime)}</p>
                      </div>
                      <button
                        className="w-full mt-2 px-4 py-2.5 bg-teal-50 text-teal-600 rounded-lg hover:bg-teal-100 text-sm font-medium"
                        onClick={() => setSelectedRequest(req)}
                      >
                        View Details
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Request Details Modal */}
          {selectedRequest && (
            <RequestDetailsModal
             request={{
                        ...selectedRequest,
                        client: selectedRequest.client
                          ? { _id: "temp_id" as Id<"users">, ...selectedRequest.client }
                          : undefined,
                      }}
              userType="designer"
               isOpen={true} // <-- add this
              onClose={() => setSelectedRequest(null)}
            />
          )}
        </main>
      </div>
    </motion.div>
  );
};

export default DesignerTasks;
