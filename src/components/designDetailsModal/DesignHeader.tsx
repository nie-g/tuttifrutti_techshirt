import React from "react";
import { X } from "lucide-react";
import type { Id } from "../../../convex/_generated/dataModel";


interface DesignHeaderProps {
  designId?: Id<"design">; // allow undefined
  onClose: () => void;
}

const DesignHeader: React.FC<DesignHeaderProps> = ({ onClose, designId }) => {
  return (
    <div className="flex justify-between items-center border-b pb-3 mb-4">
      <h2 className="text-xl font-semibold">Design Details</h2>
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-500">ID: {designId}</span>
        <button
          aria-label="Close"
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700"
        >
          <X size={20} />
        </button>
      </div>
    </div>
  );
};

export default DesignHeader;
