// src/pages/AdminDesigns.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useUser } from "@clerk/clerk-react";
import AdminNavbar from "../components/UsersNavbar";
import DynamicSidebar from "../components/Sidebar";
import StatusBadge from "../components/StatusBadge";
import { FileText, ArrowUpDown, Search } from "lucide-react";
import type { Id } from "../../convex/_generated/dataModel";
import UserDesignModal from "../components/AdminDesignModal";

interface ConvexUser {
  _id: Id<"users">;
  clerkId?: string;
  full_name?: string;
  role?: "designer" | "client" | "admin";
}

interface DesignRecord {
  _id: Id<"design">;
  request_id: Id<"design_requests">;
  client_id: Id<"users">;
  designer_id: Id<"users">;
  status: "in_progress" | "completed" | "approved" | "pending_revision" | "in_production"| "pending_pickup" ; // 👈 added
  created_at?: number;
  _creationTime?: number;
}

interface DesignRequest {
  _id: Id<"design_requests">;
  request_title: string;
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

const AdminDesigns: React.FC = () => {
  const navigate = useNavigate();
  const { user: clerkUser } = useUser();
  const [user, setUser] = useState<ConvexUser | null>(null);
  const [activeTab, setActiveTab] = useState<
    "all" | "in_progress" | "completed" | "billed" |
    "pending_revision" | "in_production" | "approved"| "pending_pickup"
  >("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  }>({
    key: "created_at",
    direction: "desc",
  });
  const [isLoading, setIsLoading] = useState(true);

  const [selectedRequestId, setSelectedRequestId] =
    useState<Id<"design_requests"> | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = (design: DesignRecord) => {
    setSelectedRequestId(design.request_id);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedRequestId(null);
    setIsModalOpen(false);
  };

  const currentUser = useQuery(
    api.userQueries.getUserByClerkId,
    clerkUser ? { clerkId: clerkUser.id } : "skip"
  ) as ConvexUser | null | undefined;

  useEffect(() => {
    if (currentUser === undefined) return;
    if (!currentUser) {
      navigate("/sign-in");
      return;
    }
    setUser(currentUser);
  }, [currentUser, navigate]);

  const allDesigns = useQuery(api.designs.listAllDesigns, {}); // 👈 Admin sees ALL designs

  const requestIds = allDesigns?.map((d) => d.request_id) ?? [];
  const designRequests =
    useQuery(api.design_requests.getRequestsByIds, { ids: requestIds }) ?? [];

  const requestsMap: Record<string, DesignRequest> = {};
  designRequests.forEach((r: DesignRequest | null) => {
    if (r) requestsMap[r._id] = r;
  });

  useEffect(() => {
    if (allDesigns !== undefined && designRequests.length >= 0)
      setIsLoading(false);
  }, [allDesigns, designRequests]);

  const handleSort = (key: string) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc")
      direction = "desc";
    setSortConfig({ key, direction });
  };

  const filteredDesigns = (allDesigns ?? [])
    .filter((d) => {
      if (activeTab !== "all" && d.status !== activeTab) return false;
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const requestName =
          requestsMap[d.request_id]?.request_title.toLowerCase() ?? "";
        return d.status.toLowerCase().includes(term) || requestName.includes(term);
      }
      return true;
    })
    .sort((a, b) => {
      const { key, direction } = sortConfig;
      let aVal: any =
        key === "created_at"
          ? a.created_at ?? a._creationTime ?? 0
          : (a as any)[key] ?? "";
      let bVal: any =
        key === "created_at"
          ? b.created_at ?? b._creationTime ?? 0
          : (b as any)[key] ?? "";
      if (aVal < bVal) return direction === "asc" ? -1 : 1;
      if (aVal > bVal) return direction === "asc" ? 1 : -1;
      return 0;
    });

   if (isLoading|| !user) {
      return (
        <div className="flex h-screen bg-gray-50">
          <DynamicSidebar />
          <div className="flex-1 flex flex-col">
            <AdminNavbar />
            <div className="flex-1 p-6 flex items-center justify-center">
              <div className="bg-white shadow rounded-lg p-6 text-center">
                <p className="text-gray-500">Loading Orders...</p>
              </div>
            </div>
          </div>
        </div>
      );
    }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-white to-teal-50" >
      <DynamicSidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <AdminNavbar />

        <main className="p-4 sm:p-6 md:p-8 flex flex-col gap-6 w-full max-w-7xl mx-auto overflow-x-hidden">
          {/* Header */}
          <motion.div
            className="bg-white shadow-md rounded-lg p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
           <div className="mb-4">
          <div className="p-6 bg-white rounded-2xl shadow-md w-full">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
              See Orders
            </h1>
            <p className="text-gray-600">Admin view of all Orders</p>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-6 gap-4">
              <div className="relative w-full sm:w-auto">
                <input
                  type="text"
                  placeholder="Search designs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent shadow-sm w-full sm:w-64"
                />
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              </div>
            </div>
          </div>
          </div>
          {/* Tabs */}
          <div className="flex overflow-x-auto pb-2 hide-scrollbar">
            <div className="flex space-x-2 min-w-max">
              {["all", "in_progress", "pending_revision","pending_pickup", "in_production", "completed", "approved"].map(
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

          {/* Designs Table */}
          <div className="bg-white rounded-2xl shadow-md overflow-hidden w-full">
            {filteredDesigns.length === 0 ? (
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
                        {["request_title", "status", "created_at", "actions"].map(
                          (key) => (
                            <th
                              key={key}
                              scope="col"
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                              onClick={
                                key !== "actions" ? () => handleSort(key) : undefined
                              }
                            >
                              <div className="flex items-center">
                                {key.replace("_", " ").replace(/\b\w/g, (l) =>
                                  l.toUpperCase()
                                )}
                                {sortConfig.key === key && (
                                  <ArrowUpDown className="ml-1 h-4 w-4" />
                                )}
                              </div>
                            </th>
                          )
                        )}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredDesigns.map((d) => (
                        <tr key={d._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 break-words">
                            {requestsMap[d.request_id]?.request_title ?? "No Name"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <StatusBadge status={d.status} />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatTimeAgo(d.created_at ?? d._creationTime)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button
                              onClick={() => openModal(d)}
                              className="px-3 py-1 text-sm bg-cyan-600 text-white rounded hover:bg-indigo-600 transition"
                            >
                              See Order Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden grid grid-cols-1 gap-4 px-2 sm:px-4 py-4">
                  {filteredDesigns.map((d) => (
                    <div
                      key={d._id}
                      className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-base font-medium text-gray-900 break-words">
                          {requestsMap[d.request_id]?.request_title ?? "No Name"}
                        </h3>
                        <StatusBadge status={d.status} />
                      </div>
                      <div className="space-y-1 text-sm text-gray-900">
                        <p>Date: {formatTimeAgo(d.created_at ?? d._creationTime)}</p>
                      </div>
                      <div className="mt-2">
                        <button
                          onClick={() => openModal(d)}
                          className="w-full px-3 py-1 text-sm bg-cyan-600 text-white rounded hover:bg-indigo-600 transition"
                        >
                          View Details
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
      </div>

      {selectedRequestId && isModalOpen && (
        <UserDesignModal requestId={selectedRequestId} onClose={closeModal} />
      )}
    </div>
  );
};

export default AdminDesigns;
