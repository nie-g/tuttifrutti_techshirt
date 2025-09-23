// src/components/ClientRequestDetailsModal.tsx
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import {
  X,
  CheckCircle, XCircle, Clock,
  Loader
} from "lucide-react";
import RequestColorsDisplay from "./RequestColorsDisplay";
import RequestInfo from "./clientRequestDetails/RequestInfo";
//git config --global user.name "nie-g"
//git config --global user.email "niegonora@gmail.com"

// ✅ Local utilities (fallback if convexUtils not found)
/*const formatDate = (timestamp: number) =>
  new Date(timestamp).toLocaleDateString();
*/
const formatTimeAgo = (timestamp: number) => {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / (1000 * 60));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

interface ClientRequestDetailsModalProps {
  request: any;
  onClose: () => void;
  onStartProject: () => void;
  isOpen: boolean;
  userType: string;
}

// ✅ Status Badge
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  if (status === "approved") {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
        <CheckCircle className="w-3 h-3 mr-1" /> Approved
      </span>
    );
  }
  if (status === "rejected") {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
        <XCircle className="w-3 h-3 mr-1" /> Rejected
      </span>
    );
  }
  if (status === "pending") {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
        <Clock className="w-3 h-3 mr-1" /> Pending
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
      {status}
    </span>
  );
};

const ClientRequestDetailsModal: React.FC<ClientRequestDetailsModalProps> = ({request,onClose,isOpen,
}) => {
  const [activeTab, setActiveTab] = useState("details");
  const [requestData, setRequestData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const requestId = request?.id || request?._id;

  // ✅ Queries
  const completeRequestData = useQuery(
    api.design_requests.getById,
    requestId ? { requestId } : "skip"
  );
  const designReferences =
    useQuery(
      api.designReferences.getByRequestId,
      requestId ? { requestId } : "skip"
    ) || [];

  useEffect(() => {
    const source = completeRequestData || request;
    if (source) {
      const enhanced: any = { ...source };

      if (!enhanced.request_title && enhanced.name) {
        enhanced.request_title = enhanced.name;
      }
      if (!enhanced.tshirt_type && enhanced.type) {
        enhanced.tshirt_type = enhanced.type;
      }
      if (!enhanced.status && enhanced.rawStatus) {
        enhanced.status = enhanced.rawStatus;
      }
      if (!enhanced.created_at) {
        enhanced.created_at = enhanced._creationTime || Date.now();
      }

      if (designReferences.length > 0) {
        enhanced.references = designReferences;
      }

      if (enhanced.description) {
        enhanced.designPreferences = enhanced.description;
      }

      setRequestData(enhanced);
      setLoading(false);
    }
  }, [request, completeRequestData, designReferences]);

  const handleModalClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  if (loading && isOpen) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-black/50"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-xl shadow-xl p-8 max-w-md w-full flex flex-col items-center"
          onClick={handleModalClick}
        >
          <Loader className="h-10 w-10 text-teal-500 animate-spin mb-4" />
          <h3 className="text-lg font-medium text-gray-900">
            Loading Request Details
          </h3>
          <p className="text-gray-500 text-center mt-2">
            Please wait while we fetch the request details...
          </p>
        </motion.div>
      </motion.div>
    );
  }

  if (!requestData) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-black/50"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="bg-white rounded-lg shadow-lg w-full max-w-2xl overflow-hidden border border-gray-200"
            onClick={handleModalClick}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-teal-50 to-white">
              <div className="flex flex-col">
                <h2 className="text-lg font-bold text-gray-800">
                  {requestData.request_title || "Design Request"}
                </h2>
                <div className="flex items-center mt-1">
                  <StatusBadge status={requestData.status || "pending"} />
                  <span className="ml-2 text-xs text-gray-500">
                    {requestData.created_at
                      ? `Submitted ${formatTimeAgo(requestData.created_at)}`
                      : "Recently submitted"}
                  </span>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Close modal"
              >
                <X size={18} className="text-gray-500" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 bg-gray-50">
              {["details", "design", "colors", "references"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-2 text-sm font-medium transition-colors ${
                    activeTab === tab
                      ? "text-teal-600 border-b-2 border-teal-500 bg-white"
                      : "text-gray-600 hover:text-teal-600 hover:bg-gray-100"
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="p-4 max-h-[65vh] overflow-y-auto custom-scrollbar">
              {activeTab === "details" && (
                <div className="space-y-4">
                   {/* ✅ Request Info */}
                  <RequestInfo
                    request={{
                      shirtType: requestData.tshirt_type,
                      styleTemplate: requestData.styleTemplate,
                      description: requestData.description,
                      status: requestData.status,
                    }}
                  />
                </div>
              )}

              {activeTab === "design" && (
                <div>
                  {requestData.sketch ? (
                    <img
                      src={requestData.sketch}
                      alt="Design Sketch"
                      className="w-full h-auto rounded border"
                    />
                  ) : (
                    <p className="text-sm text-gray-500 italic">
                      No design sketch available.
                    </p>
                  )}
                </div>
              )}

              {activeTab === "colors" && (
                <RequestColorsDisplay
                  requestId={requestData._id || requestData.id}
                  compact={false}
                />
              )}

              {activeTab === "references" && (
                <div>
                  {requestData.references?.length > 0 ? (
                    requestData.references.map((ref: any, idx: number) => (
                      <img
                        key={idx}
                        src={ref.design_image}
                        alt={`Reference ${idx + 1}`}
                        className="w-full h-auto mb-3 rounded border"
                      />
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 italic">
                      No references provided.
                    </p>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ClientRequestDetailsModal;
