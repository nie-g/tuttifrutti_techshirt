import React from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Loader, Image, ExternalLink } from "lucide-react";
import type { Id } from "../../convex/_generated/dataModel";
import { formatTimeAgo } from "../pages/utils/convexUtils";

interface RequestReferencesGalleryProps {
  requestId: Id<"design_requests">;
}

const RequestReferencesGallery: React.FC<RequestReferencesGalleryProps> = ({
  requestId,
}) => {
  const designReferences =
    useQuery(api.designReferences.getByRequestId, { requestId }) ?? [];

  const storageIds = designReferences.map((r) => r.design_image);
  const urls =
    useQuery(api.getPreviewUrl.getPreviewUrls, { storageIds }) ?? [];

  if (!designReferences) {
    return (
      <div className="flex flex-col items-center justify-center py-6">
        <Loader className="h-6 w-6 text-teal-500 animate-spin mb-2" />
        <p className="text-sm text-gray-600">Loading reference images...</p>
      </div>
    );
  }

  if (designReferences.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-6 text-center">
        <Image className="h-8 w-8 text-gray-300 mb-2" />
        <p className="text-sm text-gray-600 font-medium">
          No reference images available
        </p>
      </div>
    );
  }

  const referencesWithUrls = designReferences.map((ref, idx) => ({
    ...ref,
    url: urls[idx] ?? null,
  }));

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {referencesWithUrls.map((ref, idx) => (
        <div
          key={ref._id}
          className="bg-white border border-gray-200 rounded-lg overflow-hidden"
        >
          <div className="relative h-40 bg-gray-50 flex items-center justify-center">
            {ref.url ? (
              <img
                src={ref.url}
                alt={ref.description || `Reference ${idx + 1}`}
                className="w-full h-full object-contain"
              />
            ) : (
              <p className="text-xs text-gray-400">Image not available</p>
            )}
            {ref.url && (
              <a
                href={ref.url}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute top-2 right-2 p-1 bg-black bg-opacity-50 rounded-full text-white hover:bg-opacity-70"
                title="View full size"
              >
                <ExternalLink size={14} />
              </a>
            )}
          </div>
          <div className="p-3">
            <h4 className="text-sm font-medium text-gray-900 mb-1">
              Reference {idx + 1}
            </h4>
            <p className="text-xs text-gray-500">
              {formatTimeAgo(ref.created_at ?? ref._creationTime)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default RequestReferencesGallery;
