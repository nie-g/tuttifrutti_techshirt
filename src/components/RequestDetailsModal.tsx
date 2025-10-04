// src/components/RequestDetailsModal.tsx
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Palette, Image } from "lucide-react";
import { formatTimeAgo } from "../pages/utils/convexUtils";
import type { Id } from "../../convex/_generated/dataModel";

import StatusBadge from "./RequestDetails/StatusBadge";
import RequestDetailsSection from "./RequestDetails/RequestDetailsSection";
import RequestDesignSection from "./RequestDetails/RequestDesignSection";
import RequestColorsSection from "./RequestDetails/RequestColorsSection";
import RequestReferencesSection from "./RequestDetails/RequestReferencesSection";
import RequestFooter from "./RequestDetails/RequestFooter";

/* -------------------------
   Types
------------------------- */
interface Designer {
  _id: Id<"users">;
  full_name?: string;
  email?: string;
}
interface Client {
  _id: Id<"users">;
  full_name?: string;
  email?: string;
}
interface Size {
  size_label: string;
  w: number;
  h: number;
}
export interface RequestType {
  _id: Id<"design_requests">;
  designId?: Id<"design">;
  request_title: string;
  description?: string;
  tshirt_type?: string;
  status: "pending" | "approved" | "completed" | "rejected"  | "in_progress";
  created_at?: number;
  designer?: Designer;
  client?: Client;
  sketch?: string;
  size?: Size;
}
interface RequestDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: RequestType | null;
  userType?: "admin" | "designer" | "client";
}

const RequestDetailsModal: React.FC<RequestDetailsModalProps> = ({
  isOpen,
  onClose,
  request,
  userType = "client",
}) => {
  const [activeTab, setActiveTab] = useState<
    "details" | "design" | "colors" | "references"
  >("details");

  // ✅ Lift selected designer state
  const [selectedDesigner, setSelectedDesigner] = useState<Id<"users"> | "">(
    request?.designer?._id || ""
  );

  // Mutation (for approve/reject)
  /*const updateRequestStatus = useMutation(
    api.design_requests.updateDesignRequestStatus
  );*/

  useEffect(() => {
    if (!isOpen) setActiveTab("details");
  }, [isOpen]);

  if (!request) return null;

  const handleModalClick: React.MouseEventHandler<HTMLDivElement> = (e) => {
    e.stopPropagation();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-black/50"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30,
              duration: 0.3,
            }}
            className="bg-white rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden"
            onClick={handleModalClick}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-200 bg-gradient-to-r from-white to-gray-50">
              <div className="flex flex-col">
                <h2 className="text-xl font-bold text-gray-800">
                  {request.request_title}
                </h2>
                <div className="flex items-center mt-1">
                  <StatusBadge status={request.status} />
                  <span className="ml-2 text-sm text-gray-500">
                    Submitted {formatTimeAgo(request.created_at)}
                  </span>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-full hover:bg-gray-100 transition-colors focus:outline-none"
                aria-label="Close modal"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 bg-gray-50">
              {(["details", "design", "colors", "references"] as const).map(
                (tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-3 text-sm font-medium transition-colors ${
                      activeTab === tab
                        ? "text-teal-600 border-b-2 border-teal-500 bg-white"
                        : "text-gray-600 hover:text-teal-600 hover:bg-gray-100"
                    }`}
                  >
                    {tab === "colors" && (
                      <span className="flex items-center">
                        <Palette size={16} className="mr-1" /> Colors
                      </span>
                    )}
                    {tab === "references" && (
                      <span className="flex items-center">
                        <Image size={16} className="mr-1" /> References
                      </span>
                    )}
                    {tab === "details" && "Details"}
                    {tab === "design" && "Design"}
                  </button>
                )
              )}
            </div>

            {/* Content */}
            <div className="p-5 max-h-[50vh] overflow-y-auto custom-scrollbar">
              {activeTab === "details" && (
                <RequestDetailsSection
                  request={request}
                  userType={userType}
                  selectedDesigner={selectedDesigner}
                  setSelectedDesigner={setSelectedDesigner} // ✅ pass setter
                />
              )}
              {activeTab === "design" && <RequestDesignSection request={request} />}
              {activeTab === "colors" && <RequestColorsSection request={request} />}
              {activeTab === "references" && (
                <RequestReferencesSection request={request} />
              )}
            </div>

            {/* Footer */}
            <RequestFooter
              request={request}
              userType={userType}
              selectedDesigner={selectedDesigner} // ✅ pass state
              onClose={onClose}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default RequestDetailsModal;
