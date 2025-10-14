import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useUser } from "@clerk/clerk-react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import AdminNavbar from "../components/UsersNavbar";
import DynamicSidebar from "../components/Sidebar";
import TemplateGallery from "../components/TemplateGallery";
import ShirtSizeManager from "../components/ShirtSizeManager";
import PricingManager from "../components/PricingManager";
import PrintPricingManager from "../components/PrintPricing";

interface User {
  _id: string;
  clerkId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "client" | "designer" | "admin";
  createdAt: number;
}

type TabOption = "templates" | "upload" | "sizes" | "pricing"|"printpricing";

const Templates: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabOption>("templates");
  const { user: clerkUser, isLoaded } = useUser();

  const convexUser = useQuery(
    api.userQueries.getUserByClerkId,
    clerkUser?.id ? { clerkId: clerkUser.id } : "skip"
  ) as User | null | undefined;

  useEffect(() => {
    if (!isLoaded) return;
    if (convexUser === undefined) return;
    if (!convexUser || convexUser.role !== "admin") {
      navigate("/sign-in", { replace: true });
    }
  }, [convexUser, isLoaded, navigate]);

  if (!isLoaded || convexUser === undefined) {
    return (
      <div className="flex h-screen bg-gray-50">
        <DynamicSidebar />
        <div className="flex-1 flex flex-col">
          <AdminNavbar />
          <div className="flex-1 p-6 flex items-center justify-center">
            <div className="bg-white shadow rounded-lg p-6 text-center">
              <p className="text-gray-500">Loading Designs...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-white to-teal-50">
      <DynamicSidebar />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <AdminNavbar />

        <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-auto">
          <motion.div
            className="bg-white shadow-md rounded-lg p-4 sm:p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            {/* Header Section */}
            <div className="space-y-4">
              <div className="text-center sm:text-left">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                  Templates and Pricing
                </h1>
                <p className="text-gray-600 text-sm sm:text-base">
                  Manage your templates, shirt sizes, and designer pricing
                </p>
              </div>

              {/* Tabs */}
              <div className="flex flex-wrap sm:flex-nowrap gap-2 sm:gap-3 overflow-x-auto hide-scrollbar justify-center sm:justify-start">
                {[
                  { key: "templates", label: "Browse Templates"},
                  { key: "sizes", label: "Manage Shirt Sizes" },
                  { key: "pricing", label: "Designer Pricing" },
                  { key: "printpricing", label: "Print Pricing" },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as TabOption)}
                    className={`flex items-center gap-2 px-3 sm:px-2 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors
                      ${
                        activeTab === tab.key
                          ? "bg-teal-100 text-teal-800"
                          : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-50"
                      }`}
                  >
                    
                    <span className="whitespace-nowrap">{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Content Section */}
            <div className="mt-6 bg-white rounded-2xl shadow-sm p-4 sm:p-6 border border-gray-100">
              <div className="overflow-hidden">
                {activeTab === "templates" && (
                  <div className="w-full">
                    <TemplateGallery />
                  </div>
                )}
                {activeTab === "sizes" && (
                  <div className="w-full">
                    <ShirtSizeManager />
                  </div>
                )}
                {activeTab === "pricing" && (
                  <div className="w-full">
                    <PricingManager />
                  </div>
                )}
                {activeTab === "printpricing" && (
                  <div className="w-full">
                    <PrintPricingManager />
                  </div>
                )}

              </div>
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default Templates;
