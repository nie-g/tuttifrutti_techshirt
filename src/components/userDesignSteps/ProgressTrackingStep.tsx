import React from "react";
import type { Id } from "../../../convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

interface Preview {
  _id: Id<"design_preview">;
  preview_image: Id<"_storage">;
  created_at?: number; // ✅ use created_at from DB
}

interface ProgressTrackingStepProps {
  previews: Preview[];
}

const ProgressTrackingStep: React.FC<ProgressTrackingStepProps> = ({ previews }) => {
  const storageIds = previews.map((p) => p.preview_image);

  // ✅ Fetch all URLs in one call
  const urls = useQuery(api.getPreviewUrl.getPreviewUrls, { storageIds });

  if (!previews.length) {
    return <div className="text-gray-500">No previews yet.</div>;
  }

  return (
    <div className="max-h-[300px] overflow-y-auto pr-2">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {previews.map((p, idx) => (
          <div key={p._id} className="flex flex-col items-center">
            {urls && urls[idx] ? (
              <img
                src={urls[idx]!}
                alt="Preview"
                className="max-w-full max-h-[300px] object-contain rounded-lg border border-gray-300"
              />
            ) : (
              <div className="w-full h-64 flex items-center justify-center bg-gray-100 rounded-lg border border-gray-300 text-gray-400">
                No image available
              </div>
            )}

            <p className="text-sm text-gray-500 mt-2">
              {p.created_at
                ? `Last updated: ${new Date(p.created_at).toLocaleString()}`
                : "No date available"}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProgressTrackingStep;
