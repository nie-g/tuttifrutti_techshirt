import React from "react";
import { motion } from "framer-motion";
import { useUser } from "@clerk/clerk-react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useNavigate } from "react-router-dom";
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
  status: "pending" | "approved" | "rejected";
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

  // ✅ Fetch designer-specific requests and designs
  const requests: Request[] =
    useQuery(
      api.design_requests.getRequestsByDesigner,
      currentUser ? { designerId: currentUser._id } : "skip"
    ) || [];

  const designs: Design[] =
    useQuery(
      api.designs.getDesignsByDesigner,
      currentUser ? { designerId: currentUser._id } : "skip"
    ) || [];

  // ✅ Fetch global counts
  const navigate = useNavigate();
  const allUsers: User[] = useQuery(api.userQueries.listAllUsers) || [];
  const totalClients = allUsers.filter((u) => u.role === "client").length;
  const totalDesigns = designs.length;
  const totalRequests =
    (useQuery(api.design_requests.listAllRequests) || []).length;

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

           <ProjectsSection requests={requests} navigate={navigate} />

          <QuickActionsSection />
        </main>
      </div>
    </motion.div>
  );
};

export default DesignerDashboard;
