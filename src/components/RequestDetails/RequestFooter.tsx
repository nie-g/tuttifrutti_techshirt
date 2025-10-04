import React, { useState } from "react";
import { XCircle, CheckCircle, Loader, ArrowRight } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { RequestType } from "../RequestDetailsModal";
import type { Id } from "../../../convex/_generated/dataModel";
import { useNavigate } from "react-router-dom";

interface Props {
  request: RequestType;
  userType?: "admin" | "designer" | "client";
  onClose: () => void;
  selectedDesigner: Id<"users"> | "";
}

const RequestFooter: React.FC<Props> = ({
  request,
  userType,
  onClose,
  selectedDesigner,
}) => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const assignDesigner = useMutation(api.design_requests.assignDesignRequest);
  const rejectRequest = useMutation(api.design_requests.rejectDesignRequestWithReason);

  const handleApprove = async () => {
    if (!selectedDesigner) return;
    setIsSubmitting(true);
    try {
      await assignDesigner({
        requestId: request._id,
        designerId: selectedDesigner,
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmReject = async () => {
    if (!rejectReason.trim()) return alert("Please provide a reason before submitting.");
    setIsSubmitting(true);
    try {
      await rejectRequest({
        requestId: request._id,
        reason: rejectReason,
      });
      setShowRejectModal(false);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="p-5 border-t border-gray-200 bg-gray-50 flex justify-between items-center">
        <div className="flex gap-3 ml-auto">
          {userType === "admin" && request.status === "pending" && (
            <>
              <button
                onClick={() => setShowRejectModal(true)}
                disabled={isSubmitting}
                className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors flex items-center gap-1 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader size={16} className="animate-spin" />
                ) : (
                  <XCircle size={16} />
                )}
                Decline
              </button>
              <button
                onClick={handleApprove}
                disabled={isSubmitting || !selectedDesigner}
                className={`px-4 py-2 rounded-lg flex items-center gap-1 transition-colors ${
                  !selectedDesigner
                    ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                    : "bg-green-500 text-white hover:bg-green-600"
                }`}
              >
                {isSubmitting ? (
                  <Loader size={16} className="animate-spin" />
                ) : (
                  <CheckCircle size={16} />
                )}
                Approve
              </button>
            </>
          )}

          {userType === "designer" && request.status === "approved" && (
            <button
              onClick={() => {
                onClose();
                navigate(`/designer/canvas/${request._id}`, {
                  state: { request: { ...request, designId: request.designId } },
                });
              }}
              className="px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors flex items-center gap-1"
            >
              <ArrowRight size={16} />
              Start Working
            </button>
          )}

          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Close
          </button>
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-800">Reject Design Request</h2>
            <p className="text-sm text-gray-600">
              Please provide a reason for rejecting this request.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Enter rejection reason..."
              className="w-full border rounded-lg p-3 h-24 resize-none focus:outline-none focus:ring-2 focus:ring-red-400"
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={confirmReject}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 flex items-center gap-1"
              >
                {isSubmitting ? (
                  <Loader size={16} className="animate-spin" />
                ) : (
                  <XCircle size={16} />
                )}
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default RequestFooter;
