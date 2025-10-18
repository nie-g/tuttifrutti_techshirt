import React from "react";
import { FileText, Download } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { RequestType } from "../RequestDetailsModal";
import type { Id } from "../../../convex/_generated/dataModel";

const RequestDesignSection: React.FC<{ request: RequestType }> = ({ request }) => {
  // 1️⃣ Fetch sketches for this request
  const sketches = useQuery(api.designSketch.getByRequestId, {
    requestId: request._id,
  });

  // 2️⃣ Pick the latest sketch (or first)
  const latestSketchId = sketches?.[0]?.sketch_image as Id<"_storage"> | undefined;

  // 3️⃣ Fetch the storage URL
  const url = useQuery(api.getPreviewUrl.getPreviewUrls, {
    storageIds: latestSketchId ? [latestSketchId] : [],
  })?.[0];

  if (!latestSketchId) {
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
        {url ? (
          <img
            src={url}
            alt="Design Sketch"
            className="w-full h-auto object-contain"
          />
        ) : (
          <div className="w-full h-64 flex items-center justify-center bg-gray-100 rounded-lg border border-gray-300 text-gray-400">
            Loading image...
          </div>
        )}
      </div>
      {url && (
        <a
          href={url}
          download="design_sketch.png"
          className="mt-4 flex items-center gap-2 px-4 py-2 bg-teal-50 text-teal-600 rounded-lg hover:bg-teal-100 transition-colors"
        >
          <Download size={16} />
          Download Design
        </a>
      )}
    </div>
  );
};

export default RequestDesignSection;
