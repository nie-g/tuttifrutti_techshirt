import React from "react";
import { CheckCircle, XCircle, Clock } from "lucide-react";
import type { RequestType } from "../RequestDetailsModal";

const StatusBadge: React.FC<{ status: RequestType["status"] }> = ({ status }) => {
  if (status === "approved")
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        <CheckCircle className="w-3 h-3 mr-1" /> Approved
      </span>
    );
  if (status === "declined")
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
        <XCircle className="w-3 h-3 mr-1" /> declined
      </span>
    );
  if (status === "pending")
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
        <Clock className="w-3 h-3 mr-1" /> Pending
      </span>
    );

  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
      {status}
    </span>
  );
};

export default StatusBadge;
