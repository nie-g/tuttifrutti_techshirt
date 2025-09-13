// pages/admin/AdminDashboard.tsx
import { useEffect, useState } from "react";
import type { NavigateFunction } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useQuery, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useUser } from "@clerk/clerk-react"; // ✅ Clerk hook

import AdminNavbar from "../components/UsersNavbar";
import DynamicSidebar from "../components/Sidebar";
import HeaderSection from "./admin/HeaderSection";
import StatsCards from "./admin/StatsCard";
import ProjectsSection from "./admin/ProjectsSection";
import ActivitySection from "./admin/ActivitySection";

interface User {
  full_name: string;
}

interface Project {
  id: string;
  name: string;
  lastUpdate: string;
  status: string;
  client: string;
  designer: string;
}

interface ActivityItem {
  id: string;
  type: "request" | "design";
  status?: string;
  user: string;
  title: string;
  timestamp: number;
}

interface DashboardStats {
  users: { total: number; admin: number; designer: number; client: number };
  requests: { total: number; pending: number; approved: number; completed: number; rejected: number };
  designs: { total: number; completed: number };
  templates: { total: number };
  shirtSizes: { total: number };
  recentActivity: ActivityItem[];
}

const defaultStats: DashboardStats = {
  users: { total: 0, admin: 0, designer: 0, client: 0 },
  requests: { total: 0, pending: 0, approved: 0, completed: 0, rejected: 0 },
  designs: { total: 0, completed: 0 },
  templates: { total: 0 },
  shirtSizes: { total: 0 },
  recentActivity: [],
};

const AdminDashboard: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const navigate: NavigateFunction = useNavigate();
  const { isLoaded, isSignedIn, user: clerkUser } = useUser(); // ✅ Clerk user

  // Convex queries
  const requests = useQuery(api.design_requests.listAllRequests) || [];
  const stats = (useQuery(api.stats.getDashboardStats) as DashboardStats) || defaultStats;

  const isLoading = requests === undefined || stats === undefined;

  const sendClerkInvite = useAction(api.functions.invites.sendClerkInvite);

  const generateInvite = async () => {
    const email = prompt("Enter designer email:");
    if (!email) return;

    try {
      const result = await sendClerkInvite({ email });
      if (result.emailSent) alert(`✅ Invite sent to ${email}!`);
      else alert(`❌ Failed to send invite: ${result.message}`);
    } catch (err) {
      console.error("Error in generateInvite:", err);
      alert("Failed to send invite. Check console for details.");
    }
  };

  const formatTimeAgo = (timestamp?: number) => {
    if (!timestamp) return "Unknown";
    const diff = Date.now() - timestamp;
    if (diff < 3600000) return "Just now";
    else if (diff < 86400000) return "Today";
    else if (diff < 172800000) return "1 day ago";
    else if (diff < 604800000) return Math.floor(diff / 86400000) + " days ago";
    else return new Date(timestamp).toLocaleDateString();
  };

  const formatStatus = (status: string) => {
    switch (status) {
      case "pending":
        return "Planning";
      case "approved":
        return "In Progress";
      case "completed":
        return "Completed";
      case "rejected":
        return "Cancelled";
      default:
        return "Review";
    }
  };

  const projects: Project[] = requests.map((request: any) => ({
    id: request._id?.toString() || "",
    name: request.request_title,
    lastUpdate: formatTimeAgo(request.created_at),
    status: formatStatus(request.status),
    client: request.client
      ? `${request.client.firstName || ""} ${request.client.lastName || ""}`.trim()
      : "Unknown Client",
    designer: request.designer
      ? `${request.designer.firstName || ""} ${request.designer.lastName || ""}`.trim()
      : "Unassigned",
  }));

  // ✅ Check Clerk authentication instead of localStorage
  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      navigate("/sign-in");
      return;
    }

    if (clerkUser) {
      const role = clerkUser.unsafeMetadata?.userType;
      if (role === "admin") {
        setUser({ full_name: clerkUser.fullName || clerkUser.username || "admin" });
      } else {
        navigate("/sign-in"); // redirect if not admin
      }
    }
  }, [isLoaded, isSignedIn, clerkUser, navigate]);

  if (!user) return <div>Loading...</div>;

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
          <HeaderSection />
          <div className="mt-4">
            <button
              type="button"
              onClick={generateInvite}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            >
              Invite Designer
            </button>
          </div>

          <StatsCards stats={stats} />
          <ProjectsSection projects={projects} isLoading={isLoading} />
          <ActivitySection activities={stats.recentActivity} isLoading={isLoading} />
        </main>
      </div>
    </motion.div>
  );
};

export default AdminDashboard;
