// src/pages/Templates.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useUser } from "@clerk/clerk-react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import AdminNavbar from "../components/UsersNavbar";
import DynamicSidebar from "../components/Sidebar";
import TemplateGallery from "../components/TemplateGallery";
import TemplateUploader from "../components/TemplateUploader";
import ShirtSizeManager from "../components/ShirtSizeManager";
import PricingManager from "../components/PricingManager";
import { Shirt, Upload, Layers, Plus } from "lucide-react";

// ✅ Define User type (based on Convex schema "users" table)
interface User {
  _id: string;
  clerkId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "client" | "designer" | "admin";
  createdAt: number;
}

type TabOption = "templates" | "upload" | "sizes" | "pricing";


const Templates: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabOption>("templates");
  const { user: clerkUser, isLoaded } = useUser();

  // ✅ Fetch Convex user by Clerk ID
  const convexUser = useQuery(
    api.userQueries.getUserByClerkId,
    clerkUser?.id ? { clerkId: clerkUser.id } : "skip"
  ) as User | null | undefined;

  // ✅ Redirect if not admin
  useEffect(() => {
    if (!isLoaded) return; // Wait until Clerk finishes loading
    if (convexUser === undefined) return; // Still loading Convex query

    if (!convexUser || convexUser.role !== "admin") {
      navigate("/sign-in", { replace: true });
    }
  }, [convexUser, isLoaded, navigate]);

  // ✅ Loading state
  if (!isLoaded || convexUser === undefined) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="ml-2 text-gray-700">Loading...</p>
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
        <AdminNavbar />
        <main className="p-6 md:p-8 flex flex-col gap-6 overflow-auto">
          {/* Header Section */}
          <div className="p-6 bg-white rounded-2xl shadow-md">
            <h1 className="text-2xl font-bold text-gray-900">Design Resources</h1>
            <p className="text-gray-600">Manage your templates and shirt sizes</p>
            <div className="mt-2">
              <span className="px-3 py-1 text-xs font-medium rounded-full bg-teal-100 text-teal-800">
                Resources
              </span>
            </div>

            <div className="flex flex-wrap mt-6 gap-4">
              <button
                onClick={() => setActiveTab("templates")}
                className={`px-6 py-3 transition border-2 rounded-lg flex items-center gap-2 ${
                  activeTab === "templates"
                    ? "bg-teal-500 text-white border-teal-500"
                    : "text-teal-500 border-teal-500 hover:bg-teal-500 hover:text-white"
                }`}
              >
                <Layers size={18} />
                Browse Templates
              </button>
              <button
                onClick={() => setActiveTab("upload")}
                className={`px-6 py-3 transition border-2 rounded-lg flex items-center gap-2 ${
                  activeTab === "upload"
                    ? "bg-teal-500 text-white border-teal-500"
                    : "text-teal-500 border-teal-500 hover:bg-teal-500 hover:text-white"
                }`}
              >
                <Plus size={18} />
                Upload Template
              </button>
              <button
                onClick={() => setActiveTab("sizes")}
                className={`px-6 py-3 transition border-2 rounded-lg flex items-center gap-2 ${
                  activeTab === "sizes"
                    ? "bg-teal-500 text-white border-teal-500"
                    : "text-teal-500 border-teal-500 hover:bg-teal-500 hover:text-white"
                }`}
              >
                <Shirt size={18} />
                Manage Shirt Sizes
              </button>
              <button
                onClick={() => setActiveTab("pricing")}
                className={`px-6 py-3 transition border-2 rounded-lg flex items-center gap-2 ${
                  activeTab === "pricing"
                    ? "bg-teal-500 text-white border-teal-500"
                    : "text-teal-500 border-teal-500 hover:bg-teal-500 hover:text-white"
                }`}
              >
                <Plus size={18} />
                Manage Pricing
              </button>
            </div>
          </div>

          {/* Content Section */}
          <div className="bg-white rounded-2xl shadow-md p-6">
            {/* Section Title */}
            <div className="flex items-center mb-6 border-b border-gray-100 pb-4">
              {activeTab === "templates" && (
                <>
                  <div className="p-2 bg-indigo-100 rounded-full mr-3">
                    <Layers className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-800">Design Templates</h2>
                    <p className="text-sm text-gray-500">
                      Browse and manage your template collection
                    </p>
                  </div>
                </>
              )}
              {activeTab === "upload" && (
                <>
                  <div className="p-2 bg-teal-100 rounded-full mr-3">
                    <Upload className="h-5 w-5 text-teal-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-800">Upload New Template</h2>
                    <p className="text-sm text-gray-500">
                      Add new design templates to your collection
                    </p>
                  </div>
                </>
              )}
              {activeTab === "sizes" && (
                <>
                  <div className="p-2 bg-purple-100 rounded-full mr-3">
                    <Shirt className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-800">Shirt Size Management</h2>
                    <p className="text-sm text-gray-500">
                      Manage shirt sizes for your design projects
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Tab Content */}
            <div className="overflow-hidden">
              {activeTab === "templates" && <TemplateGallery />}
              {activeTab === "upload" && <TemplateUploader />}
              {activeTab === "sizes" && <ShirtSizeManager />}
              {activeTab === "pricing" && <PricingManager />}
            </div>
          </div>
        </main>
      </div>
    </motion.div>
  );
};

export default Templates;
