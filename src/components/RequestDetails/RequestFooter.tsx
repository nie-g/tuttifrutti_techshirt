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
  selectedDesigner: Id<"users"> | ""; // pass current dropdown selection
}

const RequestFooter: React.FC<Props> = ({
  request,
  userType,
  onClose,
  selectedDesigner,
}) => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const assignDesigner = useMutation(api.design_requests.assignDesignRequest);

  const handleApprove = async () => {
    if (!selectedDesigner) return; // ✅ must pick designer

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
  const updateRequestStatus = useMutation(
  api.design_requests.updateDesignRequestStatus
);

  const handleReject = async () => {
  setIsSubmitting(true);
  try {
    await updateRequestStatus({
      requestId: request._id,
      status: "rejected",
    });
    onClose();
  } finally {
    setIsSubmitting(false);
  }
};

  return (
    <div className="p-5 border-t border-gray-200 bg-gray-50 flex justify-between items-center">
      <div className="flex gap-3 ml-auto">
        {userType === "admin" && request.status === "pending" && (
          <>
            <button
              onClick={handleReject}
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
  );
};

export default RequestFooter;
