// src/pages/UserRequests.tsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useUser } from "@clerk/clerk-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

import ClientNavbar from "../components/UsersNavbar";
import DynamicSidebar from "../components/Sidebar";
import ShirtDesignForm from "../components/form";
import RequestDetailsModal from "../components/ClientRequestDetailsModal";

import { FileText, CheckCircle, Clock, AlertTriangle, Activity, Plus, Search, Filter, ArrowUpDown } from "lucide-react";

/* -------------------------
   Helpers
   ------------------------- */

function formatTimeAgo(timestamp?: number) {
  if (!timestamp) return "Unknown";
  const diff = Date.now() - timestamp;
  if (diff < 60 * 60 * 1000) return "Just now";
  if (diff < 24 * 60 * 60 * 1000) return "Today";
  if (diff < 48 * 60 * 60 * 1000) return "1 day ago";
  if (diff < 7 * 24 * 60 * 60 * 1000) return `${Math.floor(diff / (24 * 60 * 60 * 1000))} days ago`;
  return new Date(timestamp).toLocaleDateString();
}

function formatStatus(status: string) {
  switch (status) {
    case "pending":
      return "Planning";
    case "approved":
      return "In Progress";
    case "rejected":
      return "Cancelled";
    default:
      return status;
  }
}

/* -------------------------
   Types
   ------------------------- */

interface ConvexUser {
  _id: Id<"users">;
  clerkId?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: "client" | "designer" | "admin";
  createdAt?: number;
}

interface DesignRequestRecord {
  _id: Id<"design_requests">;
  request_title: string;
  description?: string;
  tshirt_type?: string;
  gender?: string;
  status: "pending" | "approved" | "rejected";
  created_at?: number;
  _creationTime?: number;
  designer?: { full_name?: string } | null;
  [k: string]: any;
}

/* -------------------------
   Status Badge (UI)
   ------------------------- */

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  let bgColor = "bg-gray-100";
  let textColor = "text-gray-800";
  let icon = <FileText className="h-3 w-3 mr-1" />;

  if (status === "Planning") {
    bgColor = "bg-yellow-100";
    textColor = "text-yellow-800";
    icon = <Clock className="h-3 w-3 mr-1" />;
  } else if (status === "In Progress") {
    bgColor = "bg-blue-100";
    textColor = "text-blue-800";
    icon = <Activity className="h-3 w-3 mr-1" />;
  } else if (status === "Completed") {
    bgColor = "bg-green-100";
    textColor = "text-green-800";
    icon = <CheckCircle className="h-3 w-3 mr-1" />;
  } else if (status === "Cancelled") {
    bgColor = "bg-red-100";
    textColor = "text-red-800";
    icon = <AlertTriangle className="h-3 w-3 mr-1" />;
  }

  return (
    <span className={`text-xs px-2 py-1 rounded-full flex items-center ${bgColor} ${textColor}`}>
      {icon}
      {status}
    </span>
  );
};

/* -------------------------
   Component
   ------------------------- */

const UserRequests: React.FC = () => {
  const { user: clerkUser } = useUser();
  const navigate = useNavigate();

  const currentUser = useQuery(api.userQueries.getUserByClerkId, clerkUser ? { clerkId: clerkUser.id } : "skip") as
    | ConvexUser
    | null
    | undefined;

  const clientRequests = useQuery(
    api.design_requests.getRequestsByClient,
    currentUser ? { clientId: currentUser._id } : "skip"
  ) as DesignRequestRecord[] | undefined;

  const cancelRequest = useMutation(api.design_requests.cancelDesignRequest);

  const [convexUserId, setConvexUserId] = useState<Id<"users"> | null>(null);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<DesignRequestRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!currentUser) return;
    if (currentUser.role !== "client") {
      navigate("/sign-in");
      return;
    }
    setConvexUserId(currentUser._id);
  }, [currentUser, navigate]);

  const handleCancelRequest = async (requestId: Id<"design_requests">) => {
    if (!convexUserId) return;
    if (!window.confirm("Are you sure you want to cancel this request?")) return;

    try {
      await cancelRequest({ request_id: requestId, client_id: convexUserId });
      alert("Request cancelled successfully!");
    } catch (err) {
      console.error("Error cancelling request:", err);
      alert("Failed to cancel request. Please try again.");
    }
  };

  const openRequestModal = (request: DesignRequestRecord) => {
    setSelectedRequest(request);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedRequest(null);
    setIsModalOpen(false);
  };

  const handleSubmitRequest = async (formData: any) => {
    if (!convexUserId) return;
    setIsSubmitting(true);
    try {
      console.log("submit request form data:", formData);
      setShowRequestForm(false);
      alert("Request submitted!");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (currentUser === undefined || clientRequests === undefined) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  if (currentUser === null) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <p className="text-gray-600">User not found. Please sign in.</p>
      </div>
    );
  }

  const filteredRequests = (clientRequests ?? [])
    .filter((r) => {
      const matchesSearch =
        !searchTerm ||
        r.request_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.description || "").toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || r.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      const aTime = a.created_at ?? (a as any)._creationTime ?? 0;
      const bTime = b.created_at ?? (b as any)._creationTime ?? 0;
      return sortOrder === "newest" ? bTime - aTime : aTime - bTime;
    });

  const projects = filteredRequests.map((r) => ({
    id: r._id,
    name: r.request_title,
    lastUpdate: formatTimeAgo(r.created_at ?? (r as any)._creationTime),
    status: formatStatus(r.status),
    rawStatus: r.status,
    designer: r.designer?.full_name ?? "Unassigned",
    type: r.tshirt_type ?? "T-Shirt",
    gender: r.gender ?? "",
    description: r.description ?? "",
  }));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
      className="flex min-h-screen bg-gradient-to-br from-white to-teal-50"
    >
      <DynamicSidebar />
      <div className="flex-1 flex flex-col">
        <ClientNavbar />
        <main className="p-6 md:p-8 flex flex-col gap-6 overflow-auto">
          {/* Header */}
          <div className="p-6 bg-white rounded-2xl shadow-md">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">My Design Requests</h1>
                <p className="text-gray-600">Manage and track your t-shirt design requests</p>
              </div>
              <button
                onClick={() => setShowRequestForm(true)}
                className="px-6 py-3 text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors flex items-center gap-2 self-start"
              >
                <Plus size={18} />
                New Request
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="p-6 bg-white rounded-2xl shadow-md">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <div className="relative w-full md:w-96">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search requests..."
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>

              <div className="flex flex-wrap gap-3 w-full md:w-auto">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Filter className="h-4 w-4 text-gray-400" />
                  </div>
                  <select
                    aria-label="Filter requests by status"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 appearance-none bg-white"
                  >
                    <option value="all">All</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Cancelled</option>
                  </select>
                </div>

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <ArrowUpDown className="h-4 w-4 text-gray-400" />
                  </div>
                  <select
                    aria-label="Sort requests by creation date"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value as "newest" | "oldest")}
                    className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 appearance-none bg-white"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="mt-4 text-sm text-gray-600">
              Showing {projects.length} {projects.length === 1 ? "request" : "requests"}
              {searchTerm && <span> matching "{searchTerm}"</span>}
              {statusFilter !== "all" && <span> with status "{statusFilter}"</span>}
            </div>
          </div>

          {/* Requests list */}
          <div className="bg-white p-6 rounded-2xl shadow-md">
            {projects.length === 0 ? (
              <div className="py-8 text-center">
                <div className="inline-block p-3 bg-gray-100 rounded-full mb-4">
                  <FileText className="h-6 w-6 text-gray-500" />
                </div>
                <p className="text-gray-600">No requests found.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {projects.map((project) => (
                  <div
                    key={(project.id as unknown) as string}
                    className="p-5 transition-all border border-gray-200 shadow-sm bg-gradient-to-r from-white to-teal-50 rounded-xl hover:shadow-md hover:border-teal-200"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-base font-semibold text-gray-800 line-clamp-1">{project.name}</h3>
                      <StatusBadge status={project.status} />
                    </div>

                    <p className="text-sm text-gray-600 mb-1">
                      Type: <span className="font-medium">{project.type}</span>
                    </p>

                    <p className="text-sm text-gray-600 mb-1">
                      Gender: <span className="font-medium">{project.gender}</span>
                    </p>

                    <p className="text-sm text-gray-600 mb-3">
                      Designer: <span className="font-medium">{project.designer}</span>
                    </p>

                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">{project.lastUpdate}</span>
                      <div className="flex gap-2">
                        {project.rawStatus === "pending" && (
                          <button
                            onClick={() => handleCancelRequest(project.id)}
                            className="px-3 py-1.5 text-sm font-medium text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            Cancel
                          </button>
                        )}
                        <button
                          onClick={() => openRequestModal((project as unknown) as DesignRequestRecord)}
                          className="px-3 py-1.5 text-sm font-medium text-teal-600 hover:text-teal-800 hover:bg-teal-50 rounded-lg transition-colors"
                        >
                          View Details →
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Conditionally render ShirtDesignForm */}
      {showRequestForm && (
        <ShirtDesignForm
          onClose={() => setShowRequestForm(false)}
          onSubmit={handleSubmitRequest}
        />
      )}

      <RequestDetailsModal
        isOpen={!!selectedRequest}
        onClose={closeModal}
        request={selectedRequest}
        userType="client"
        onStartProject={() => {
          console.log("Project started for request:", selectedRequest?._id);
        }}
      />
    </motion.div>
  );
};

export default UserRequests;
