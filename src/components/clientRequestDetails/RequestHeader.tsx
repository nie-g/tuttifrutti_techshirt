import React from "react";
import { X } from "lucide-react";

interface RequestHeaderProps {
  onClose: () => void;
  requestId: string;
}

const RequestHeader: React.FC<RequestHeaderProps> = ({ onClose, requestId }) => {
  return (
    <div className="flex justify-between items-center border-b pb-3 mb-4">
      <h2 className="text-xl font-semibold">Request Details</h2>
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-500">ID: {requestId}</span>
        <button aria-label="Close" onClick={onClose} className="text-gray-500 hover:text-gray-700">
          <X size={20} />
        </button>
      </div>
    </div>
  );
};

export default RequestHeader;
