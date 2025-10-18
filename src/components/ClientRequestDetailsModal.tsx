// src/components/ClientRequestDetailsModal.tsx
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { X, CheckCircle, XCircle, Clock, Loader, Download } from "lucide-react";
import RequestColorsDisplay from "./RequestColorsDisplay";
import RequestInfo from "./clientRequestDetails/RequestInfo";
import RequestReferencesGallery from "./RequestReferencesGallery";
import type { Id } from "../../convex/_generated/dataModel";

// Helper to format time
const formatTimeAgo = (timestamp: number) => {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / (1000 * 60));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

// Status badge
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  if (status === "approved") return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
      <CheckCircle className="w-3 h-3 mr-1" /> Approved
    </span>
  );
  if (status === "rejected") return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
      <XCircle className="w-3 h-3 mr-1" /> Rejected
    </span>
  );
  if (status === "pending") return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
      <Clock className="w-3 h-3 mr-1" /> Pending
    </span>
  );
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
      {status}
    </span>
  );
};

interface ClientRequestDetailsModalProps {
  request: any;
  onClose: () => void;
  isOpen: boolean;
  onStartProject?: () => void; // <- add this line
   userType?: "client" | "designer"; // add this
}

const ClientRequestDetailsModal: React.FC<ClientRequestDetailsModalProps> = ({
  request,
  onClose,
  isOpen,
}) => {
  const [activeTab, setActiveTab] = useState("details");
  const [requestData, setRequestData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const requestId = request?._id || request?.id;

  // Fetch request details
  const completeRequestData = useQuery(
    api.design_requests.getById,
    requestId ? { requestId } : "skip"
  );

  // Fetch sketches from request_sketches table
  const sketches = useQuery(
    api.designSketch.getByRequestId,
    requestId ? { requestId } : "skip"
  );

  // Get latest sketch ID
  const latestSketchId = sketches?.[0]?.sketch_image as Id<"_storage"> | undefined;

  // Convert to URL
  const sketchUrl = useQuery(api.getPreviewUrl.getPreviewUrls, {
    storageIds: latestSketchId ? [latestSketchId] : [],
  })?.[0];

  // Design references (optional)
  const designReferences =
    useQuery(
      api.designReferences.getByRequestId,
      requestId ? { requestId } : "skip"
    ) || [];
  const referenceUrls = useQuery(api.getPreviewUrl.getPreviewUrls, {
    storageIds: designReferences.map((r) => r.design_image),
  }) ?? [];

  useEffect(() => {
    const source = completeRequestData || request;
    if (source) {
      const enhanced: any = { ...source };
      enhanced.sketch = sketchUrl || null;

      if (designReferences.length > 0) {
        enhanced.references = designReferences.map((ref, idx) => ({
          ...ref,
          url: referenceUrls[idx] ?? null,
        }));
      }

      setRequestData(enhanced);
      setLoading(false);
    }
  }, [completeRequestData, request, sketchUrl, designReferences, referenceUrls]);

  const handleModalClick = (e: React.MouseEvent) => e.stopPropagation();

  if (loading && isOpen) {
    return (
      <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-black/50">
        <motion.div
          className="bg-white rounded-xl shadow-xl p-8 max-w-md w-full flex flex-col items-center"
          onClick={handleModalClick}
        >
          <Loader className="h-10 w-10 text-teal-500 animate-spin mb-4" />
          <h3 className="text-lg font-medium text-gray-900">Loading Request Details</h3>
        </motion.div>
      </motion.div>
    );
  }

  if (!requestData) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-black/50"
          onClick={onClose}
        >
          <motion.div
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
              <button aria-label="Close" onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100 transition-colors">
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
                <RequestInfo requestId={requestData._id || requestData.id} />
              )}

              {activeTab === "design" && (
                <div className="flex flex-col items-center">
                  {requestData.sketch ? (
                    <>
                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 w-full max-w-md">
                        <img
                          src={requestData.sketch}
                          alt="Design Sketch"
                          className="w-full h-auto object-contain"
                        />
                      </div>
                      <a
                        href={requestData.sketch}
                        download="design_sketch.png"
                        className="mt-4 flex items-center gap-2 px-4 py-2 bg-teal-50 text-teal-600 rounded-lg hover:bg-teal-100 transition-colors"
                      >
                        <Download size={16} /> Download Design
                      </a>
                    </>
                  ) : (
                    <p className="text-sm text-gray-500 italic">
                      No design sketch available.
                    </p>
                  )}
                </div>
              )}

              {activeTab === "colors" && (
                <RequestColorsDisplay requestId={requestData._id || requestData.id} compact={false} />
              )}

              {activeTab === "references" && (
                <RequestReferencesGallery requestId={requestId} />
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-4 py-3 border-t border-gray-200 bg-gray-50">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ClientRequestDetailsModal;
