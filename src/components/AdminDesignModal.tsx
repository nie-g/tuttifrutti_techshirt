import React, { useState } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { useUser } from "@clerk/clerk-react";

// Steps
import ProgressTrackingStep from "./adminDesignSteps/ProgressTrackingStep";
import SeeDesignStep from "./adminDesignSteps/SeeDesignStep";
import FinalizeDesignStep from "./adminDesignSteps/FinalizeStep";

// Modal header
import DesignHeader from "./designDetailsModal/DesignHeader";

interface UserDesignModalProps {
  requestId: Id<"design_requests">;
  onClose: () => void;
}

const UserDesignModal: React.FC<UserDesignModalProps> = ({ requestId, onClose }) => {
  const [step, setStep] = useState(1);
  const { user } = useUser();

  const convexUser = useQuery(api.userQueries.getUserByClerkId, user ? { clerkId: user.id } : "skip");
  const design = useQuery(api.designs.getDesignByRequestId, { requestId });
  const previewsResult = useQuery(
    api.design_preview.getByDesign,
    design ? { designId: design._id } : "skip"
  );
  const billing = useQuery(
    api.billing.getBillingByDesign,
    design ? { designId: design._id } : "skip"
  );

  const markCompleted = useMutation(api.designs.markAsCompleted);
  const markInProduction = useMutation(api.designs.markAsInProduction); // ✅ add this mutation

  const totalSteps = 3;
  const handleNext = () => setStep((prev) => Math.min(prev + 1, totalSteps));
  const handleBack = () => setStep((prev) => Math.max(prev - 1, 1));

  if (!design) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
        <div className="p-4 text-sm sm:p-6 sm:text-base bg-white rounded-lg shadow-xl">
          Loading design...
        </div>
      </div>
    );
  }

  // ✅ Helper to determine which button to show
    const renderActionButton = () => {
        if (design.status === "in_production") {
          return (
            <button
              onClick={() => {
                if (!convexUser?._id) return;
                markCompleted({ designId: design._id, userId: convexUser._id });
              }}
              className="px-4 sm:px-6 md:px-8 py-2 text-xs sm:text-sm text-white bg-green-500 rounded-lg shadow-md hover:bg-green-600"
            >
              Mark as Completed
            </button>
          );
        }

        if (design.status === "approved") {
          return (
            <button
              onClick={() => {
                if (!convexUser?._id) return;
                markInProduction({ designId: design._id, userId: convexUser._id });
              }}
              className="px-4 sm:px-6 md:px-8 py-2 text-xs sm:text-sm text-white bg-teal-500 rounded-lg shadow-md hover:bg-teal-600"
            >
              Mark as In Production
            </button>
          );
        }

        // Default close button
        return (
          <button
            onClick={onClose}
            className="px-4 sm:px-6 md:px-8 py-2 text-xs sm:text-sm text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
          >
            Close
          </button>
        );
      };


  const previews = previewsResult
    ? Array.isArray(previewsResult)
      ? previewsResult
      : [previewsResult]
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="w-full max-w-lg sm:max-w-xl md:max-w-2xl lg:max-w-3xl mx-4 sm:mx-6 p-4 sm:p-6 bg-white rounded-lg shadow-2xl h-[90vh] flex flex-col"
      >
        {/* Header */}
        <DesignHeader onClose={onClose} designId={design._id} />

        {/* Stepper */}
        <div className="flex justify-center my-4 sm:my-1 space-x-6 sm:space-x-8">
          {["Order Details", "Design Progress", "Summary"].map((label, index) => (
            <div key={index} className="flex flex-col items-center">
              <div
                className={`w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-full text-white font-bold shadow-lg ${
                  step === index + 1 ? "bg-teal-500 scale-110" : "bg-gray-300"
                }`}
              >
                {index + 1}
              </div>
              <span
                className={`text-xs sm:text-sm mt-1 ${
                  step === index + 1 ? "text-teal-600 font-medium" : "text-gray-400"
                }`}
              >
                {label}
              </span>
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="mt-2 sm:mt-4 flex-1 overflow-y-auto pr-1 sm:pr-2">
          {step === 1 && <SeeDesignStep designId={design._id} />}
          {step === 2 && <ProgressTrackingStep designId={design._id} />}
          {step === 3 && convexUser && <FinalizeDesignStep design={design} />}
        </div>

        {/* Navigation */}
        <div className="flex justify-between mt-4 sm:mt-6">
          {/* Back button */}
          <button
            onClick={handleBack}
            className={`px-4 sm:px-6 md:px-8 py-2 text-xs sm:text-sm text-gray-700 transition border rounded-md hover:bg-gray-100 ${
              step === 1 ? "invisible" : ""
            }`}
          >
            Back
          </button>

          {/* Conditional Action Button */}
          {step === totalSteps ? renderActionButton() : (
            <button
              onClick={handleNext}
              className="px-4 sm:px-6 md:px-8 py-2 text-xs sm:text-sm text-white bg-teal-500 rounded-lg shadow-md hover:bg-teal-600"
            >
              Next
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default UserDesignModal;
