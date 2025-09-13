import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useUser } from "@clerk/clerk-react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

import ClientNavbar from "../components/UsersNavbar";
import DynamicSidebar from "../components/Sidebar";
import StatsCards from "./client/StatsCard";
import DashboardHeader from "./client/DashboardHeader";
import ProjectsSection from "./client/ProjectsSection";
import QuickActionsSection from "./client/Quick";

const ClientDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user: clerkUser } = useUser();

  // Fetch current user directly from Convex
  const currentUser = useQuery(
  api.userQueries.getUserByClerkId,
  clerkUser ? { clerkId: clerkUser.id } : "skip"
  );
  // Fetch requests and designs for current user
  const requests = useQuery(
    api.design_requests.getRequestsByClient,
    currentUser ? { clientId: currentUser._id } : "skip"
  ) || [];

  const designs = useQuery(
    api.designs.getDesignsByClient,
    currentUser ? { clientId: currentUser._id } : "skip"
  ) || [];

  if (!clerkUser || !currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="p-4 text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="flex min-h-screen bg-gradient-to-br from-white to-teal-50"
    >
      <DynamicSidebar />
      <div className="flex-1 flex flex-col">
        <ClientNavbar />
        <main className="p-6 md:p-8 flex flex-col gap-6 overflow-auto">
          <DashboardHeader />
          <StatsCards requests={requests} designs={designs} />
          <ProjectsSection requests={requests} navigate={navigate} />
          <QuickActionsSection navigate={navigate} />
        </main>
      </div>
    </motion.div>
  );
};

export default ClientDashboard;
