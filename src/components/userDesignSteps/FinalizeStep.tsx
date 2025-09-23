import React from "react";
import type { Id } from "../../../convex/_generated/dataModel";

interface FinalizeDesignStepProps {
  design: {
    _id: Id<"design">;
    status: string;
    title?: string;
    description?: string;
    price?: number;
    createdAt?: number;
  };
}

const FinalizeDesignStep: React.FC<FinalizeDesignStepProps> = ({ design }) => {
  const isFinished = design.status === "finished";

  return (
    <div className="p-4 space-y-6">
      {/* Summary */}
      <div>
        <h2 className="text-lg font-semibold mb-2">Order Summary</h2>
        <div className="space-y-1 text-gray-700 text-sm">
          <p>
            <span className="font-medium">Design Title:</span>{" "}
            {design.title || "Untitled"}
          </p>
          <p>
            <span className="font-medium">Description:</span>{" "}
            {design.description || "No description provided"}
          </p>
          <p>
            <span className="font-medium">Status:</span>{" "}
            <span
              className={`${
                isFinished ? "text-green-600 font-semibold" : "text-red-500"
              }`}
            >
              {design.status}
            </span>
          </p>
          {design.createdAt && (
            <p>
              <span className="font-medium">Requested On:</span>{" "}
              {new Date(design.createdAt).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>

      {/* Billing */}
      <div>
        <h2 className="text-lg font-semibold mb-2">Billing</h2>
        <div className="p-4 border rounded-lg shadow-sm bg-gray-50">
          <p className="text-sm text-gray-600 mb-3">
            {isFinished
              ? "Your design is marked finished. You can now proceed with billing."
              : "Billing is locked until your design is marked as finished."}
          </p>
          <div className="flex items-center justify-between">
            <span className="font-medium text-gray-700">
              Total: ₱{design.price ?? 0}
            </span>
            <button
              disabled={!isFinished}
              className={`px-4 py-2 text-sm rounded-md shadow-md transition ${
                isFinished
                  ? "bg-teal-500 text-white hover:bg-teal-600"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              {isFinished ? "Proceed to Payment" : "Locked"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinalizeDesignStep;
