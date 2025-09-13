import React from "react";
import { FileText, Download } from "lucide-react";
import type { RequestType } from "../RequestDetailsModal";

const RequestDesignSection: React.FC<{ request: RequestType }> = ({ request }) => {
  if (!request.sketch) {
    return (
      <div className="flex flex-col items-center justify-center py-10 bg-gray-50 rounded-lg border border-gray-200">
        <FileText size={48} className="text-gray-300 mb-3" />
        <p className="text-gray-500">No design sketch available</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 w-full max-w-md">
        <img
          src={request.sketch}
          alt="Design Sketch"
          className="w-full h-auto object-contain"
        />
      </div>
      <button className="mt-4 flex items-center gap-2 px-4 py-2 bg-teal-50 text-teal-600 rounded-lg hover:bg-teal-100 transition-colors">
        <Download size={16} />
        Download Design
      </button>
    </div>
  );
};

export default RequestDesignSection;
