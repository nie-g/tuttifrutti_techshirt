import React from "react";
import { motion } from "framer-motion";
import { useUser } from "@clerk/clerk-react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import DynamicSidebar from "../components/Sidebar";
import HeaderSection from "./designer/HeaderSection";
import StatsSection from "./designer/StatsSection";
import ProjectsSection from "./designer/ProjectsSection";
import QuickActionsSection from "./designer/QuickActionsSection";
import ClientNavbar from "../components/UsersNavbar";

// 🔹 Types for cleaner code
interface User {
  _id: string;
  role: "client" | "designer" | "admin";
}

interface Request {
  _id: string;
  tshirt_type?: string;
  description?: string;
  deadline?: string;
  status: "pending" | "approved" | "rejected" | "declined" | "cancelled";
}

interface Design {
  _id: string;
  preview_image?: string;
}

const DesignerDashboard: React.FC = () => {
  const { user: clerkUser } = useUser();

  // ✅ Get current user from Convex users table
  const currentUser = useQuery(
    api.userQueries.getUserByClerkId,
    clerkUser ? { clerkId: clerkUser.id } : "skip"
  );

  // ✅ Fetch designer-specific requests (nullable allowed)
  const requests: (Request | null)[] =
    useQuery(
      api.design_requests.getRequestsByDesigner,
      currentUser ? { designerId: currentUser._id } : "skip"
    ) || [];

  // ✅ Fetch designer-specific designs (nullable allowed)
  const designs: (Design | null)[] =
    useQuery(
      api.designs.getDesignsByDesigner,
      currentUser ? { designerId: currentUser._id } : "skip"
    ) || [];

  // ✅ Fetch global counts
  
  const allUsers: User[] = useQuery(api.userQueries.listAllUsers) || [];
  const totalClients = allUsers.filter((u) => u.role === "client").length;
  const totalDesigns = designs.filter((d) => d !== null).length; // still safe counting
  const totalRequests =
    (useQuery(api.design_requests.listAllRequests) || []).length;
  // Map and filter requests
  const mappedRequests = requests
  .filter((r): r is Request => r !== null)
  .map((r) => ({
    _id: r._id,
    request_title: r.description || "No Title",
    status: r.status,
    tshirt_type: r.tshirt_type || "N/A",
    client: { full_name: "Me" }, // update if you have real client info
  }));
  
  const isLoadingRequests = !currentUser || !requests;

  if (!clerkUser || !currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <p className="text-gray-600">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="flex min-h-screen bg-gradient-to-br from-white to-blue-50"
    >
      <DynamicSidebar />
      <div className="flex-1 flex flex-col">
        <ClientNavbar />
        <main className="p-6 md:p-8 flex flex-col gap-6 overflow-auto">
          <HeaderSection />
          <StatsSection
            totalClients={totalClients}
            totalDesigns={totalDesigns}
            totalRequests={totalRequests}
          />

          {/* Pass requests (nullable) to ProjectsSection */}
         <ProjectsSection requests={mappedRequests} isLoading={!!isLoadingRequests} />

          <QuickActionsSection />
        </main>
      </div>
    </motion.div>
  );
};

export default DesignerDashboard;
