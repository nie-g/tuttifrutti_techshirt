import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

import ClientNavbar from "../components/UsersNavbar";
import DynamicSidebar from "../components/Sidebar";
import ShirtDesignForm from "../components/form";
import RequestDetailsModal from "../components/ClientRequestDetailsModal";

import {
  CheckCircle, Clock, AlertTriangle, XCircle,
  Search, FileText, Plus
} from "lucide-react";

/* ---------------------------
   Helpers
--------------------------- */
const formatTimeAgo = (timestamp?: number) => {
  if (!timestamp) return "Unknown";
  const diff = Date.now() - timestamp;
  if (diff < 3600000) return "Just now";
  if (diff < 86400000) return "Today";
  if (diff < 172800000) return "1 day ago";
  if (diff < 604800000) return `${Math.floor(diff / 86400000)} days ago`;
  return new Date(timestamp).toLocaleDateString();
};

/* ---------------------------
   Status Badge
--------------------------- */
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  switch (status) {
    case "pending":
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <Clock className="w-3 h-3 mr-1" /> Pending
        </span>
      );
    case "approved":
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          <CheckCircle className="w-3 h-3 mr-1" /> Approved
        </span>
      );
    case "rejected":
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <XCircle className="w-3 h-3 mr-1" /> Rejected
        </span>
      );
    case "cancelled":
    return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
          <XCircle className="w-3 h-3 mr-1" /> Cancelled
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          <AlertTriangle className="w-3 h-3 mr-1" /> Unknown
        </span>
      );
  }
};

/* ---------------------------
   Component
--------------------------- */
const UserRequests: React.FC = () => {
  const { user: clerkUser } = useUser();
  const navigate = useNavigate();

  const currentUser = useQuery(api.userQueries.getUserByClerkId, clerkUser ? { clerkId: clerkUser.id } : "skip");
  const clientRequests = useQuery(
    api.design_requests.getRequestsByClient,
    currentUser ? { clientId: currentUser._id } : "skip"
  ) as any[];

  const cancelRequest = useMutation(api.design_requests.cancelDesignRequest);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "pending" | "approved" | "rejected">("all");

  useEffect(() => {
    if (currentUser && currentUser.role !== "client") navigate("/sign-in");
  }, [currentUser, navigate]);

  if (currentUser === undefined || clientRequests === undefined)
    return (
          <div className="flex h-screen bg-gray-50">
            <DynamicSidebar />
            <div className="flex-1 flex flex-col">
              <ClientNavbar/>
              <div className="flex-1 p-6 flex items-center justify-center">
                <div className="bg-white shadow rounded-lg p-6 text-center">
                  <p className="text-gray-500">Loading requests...</p>
                </div>
              </div>
            </div>
          </div>
        );
  if (currentUser === null)
    return <div className="flex items-center justify-center min-h-screen bg-gray-50 text-gray-600">User not found.</div>;

  /* --- Filtering --- */
  const filteredRequests = (clientRequests ?? [])
    .filter((r) => (activeTab === "all" ? true : r.status === activeTab))
    .filter((r) =>
      !searchTerm
        ? true
        : r.request_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (r.description || "").toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => (b.created_at ?? b._creationTime ?? 0) - (a.created_at ?? a._creationTime ?? 0));

  /* --- Actions --- */
  const handleCancelRequest = async (id: Id<"design_requests">) => {
    if (!window.confirm("Cancel this request?")) return;
    try {
      await cancelRequest({ request_id: id, client_id: currentUser._id });
      alert("Request cancelled successfully!");
    } catch {
      alert("Failed to cancel request.");
    }
  };

 

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-white to-gray-50">
      <DynamicSidebar />
      <div className="flex-1 flex flex-col">
        <ClientNavbar />
        <main className="flex-1 p-6 overflow-auto">
          <motion.div
            className="bg-white shadow-md rounded-lg p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">My Design Requests</h1>
                <p className="text-gray-600 text-sm">Manage and track your submitted t-shirt requests</p>
              </div>
              <button
                onClick={() => setShowRequestForm(true)}
                disabled={isSubmitting}
                className={`px-4 py-2 text-sm font-medium text-white rounded-lg flex items-center gap-2 transition-all ${
                  isSubmitting
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-teal-600 hover:bg-teal-700 active:scale-[0.97]"
                }`}
              >
                <Plus className="w-4 h-4" />
                {isSubmitting ? "Submitting..." : "New Request"}
              </button>
            </div>

            {/* Search + Tabs */}
            <div className="mb-4 flex flex-col gap-3">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search requests..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                />
              </div>
              <div className="flex space-x-2 overflow-x-auto pb-2 hide-scrollbar">
                {["all", "pending", "approved", "rejected"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab as typeof activeTab)}
                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
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
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Designer</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Update</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      
                      {filteredRequests.map((req) => (
                        
                        <tr key={req._id.toString()} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{req.request_title}</div>
                            <div className="text-sm text-gray-500 line-clamp-1">{req.description || "No description"}</div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">{req.tshirt_type || "T-shirt"}</td>
                          <td className="px-6 py-4">
                            <StatusBadge status={req.status} />
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">
                            {req.designer?.full_name || "Unassigned"}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {formatTimeAgo(req.created_at ?? req._creationTime)}
                          </td>
                          <td className="px-6 py-4 text-right space-x-2">
                            {req.status === "pending" && (
                              <button
                                onClick={() => handleCancelRequest(req._id)}
                                className="text-xs px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                Cancel
                              </button>
                            )}
                            <button
                              onClick={() => setSelectedRequest(req)}
                              className="text-xs px-3 py-1.5 text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </motion.div>
        </main>
      </div>

      {/* Form Modal */}
      {showRequestForm && (
        <ShirtDesignForm onClose={() => setShowRequestForm(false)} onSubmit={() => setShowRequestForm(false)} />
      )}

      {/* Request Details Modal */}
      {selectedRequest && (
        <RequestDetailsModal
          onStartProject={() => setSelectedRequest(null)}
          isOpen={!!selectedRequest}
          onClose={() => setSelectedRequest(null)}
          request={selectedRequest}
          userType="client"
        />
      )}
    </div>
  );
};

export default UserRequests;
