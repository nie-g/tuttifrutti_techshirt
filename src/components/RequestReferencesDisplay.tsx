// src/components/RequestReferencesDisplay.tsx
import React from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Loader, Image, ExternalLink, Download, Info } from "lucide-react";
import { formatTimeAgo } from "../pages/utils/convexUtils";
import type { Id } from "../../convex/_generated/dataModel";

/* -------------------------
   Props
------------------------- */
interface RequestReferencesDisplayProps {
  requestId: Id<"design_requests">;
  compact?: boolean;
}

const RequestReferencesDisplay: React.FC<RequestReferencesDisplayProps> = ({
  requestId,
}) => {
  // Fetch references (storage IDs + meta)
  const designReferences = useQuery(api.designReferences.getByRequestId, {
    requestId,
  });

  // Extract storageIds
  const storageIds = designReferences?.map((r) => r.design_image) ?? [];

  // Resolve all URLs in one query
  const urls =
    useQuery(api.getPreviewUrl.getPreviewUrls, { storageIds }) ?? [];

  if (!designReferences) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <Loader className="h-8 w-8 text-teal-500 animate-spin mb-2" />
        <p className="text-sm text-gray-600">Loading reference images...</p>
      </div>
    );
  }

  if (designReferences.length === 0) {
    return (
      <div className="space-y-4">
        <div className="bg-white p-3 rounded-lg border border-gray-200 mb-3">
          <h3 className="text-sm font-semibold text-gray-700 mb-1">
            Reference Images
          </h3>
          <p className="text-xs text-gray-600">
            These are additional reference images provided with the request.
          </p>
        </div>

        <div className="flex flex-col items-center justify-center py-8 bg-gray-50 rounded-lg border border-gray-200">
          <Image className="h-10 w-10 text-gray-300 mb-2" />
          <p className="text-sm text-gray-700 font-medium">
            No reference images available
          </p>
          <p className="text-xs text-gray-500 mt-1 max-w-md text-center px-4">
            This request was submitted without additional reference images.
          </p>
        </div>
      </div>
    );
  }

  // Attach resolved URLs to references
  const referencesWithUrls = designReferences.map((ref, idx) => ({
    ...ref,
    url: urls[idx] ?? null,
  }));

  // Sort newest first
  const sortedReferences = [...referencesWithUrls].sort(
    (a, b) =>
      (b.created_at ?? b._creationTime) - (a.created_at ?? a._creationTime)
  );

  return (
    <div className="space-y-4">
      <div className="bg-white p-3 rounded-lg border border-gray-200 mb-3">
        <h3 className="text-sm font-semibold text-gray-700 mb-1">
          Reference Images
        </h3>
        <p className="text-xs text-gray-600">
          These are additional reference images provided with the request.
        </p>
      </div>

      <p className="text-sm text-gray-700 mb-4">
        <span className="font-medium">{sortedReferences.length}</span>{" "}
        reference {sortedReferences.length === 1 ? "image" : "images"} provided
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {sortedReferences.map((reference, index) => (
          <div
            key={reference._id}
            className="bg-white border border-gray-200 rounded-xl hover:shadow-md transition-shadow"
          >
            <div className="h-40 bg-gray-50 relative">
              {reference.url ? (
                <img
                  src={reference.url}
                  alt={reference.description || `Reference ${index + 1}`}
                  className="w-full h-full object-contain"
                  onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                    const target = e.currentTarget;
                    target.onerror = null;
                    target.src =
                      "https://placehold.co/400x300?text=Image+Not+Available";
                  }}
                />
              ) : (
                <div className="flex items-center justify-center w-full h-full bg-gray-100 text-gray-400 text-sm">
                  Image not available
                </div>
              )}
              {reference.url && (
                <a
                  href={reference.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute top-2 right-2 p-1.5 bg-black bg-opacity-50 rounded-full text-white hover:bg-opacity-70 transition-opacity"
                  title="View full size"
                >
                  <ExternalLink size={16} />
                </a>
              )}
            </div>
            <div className="p-4">
              <div className="flex justify-between items-start mb-2">
                <h4 className="text-sm font-medium text-gray-900">
                  Reference Image {index + 1}
                </h4>
                <span className="text-xs text-gray-500">
                  {formatTimeAgo(reference.created_at ?? reference._creationTime)}
                </span>
              </div>
              {reference.description ? (
                <p className="text-sm text-gray-700 mb-3">
                  {reference.description}
                </p>
              ) : (
                <p className="text-sm text-gray-500 italic mb-3">
                  No description provided
                </p>
              )}
              <div className="flex justify-end">
                {reference.url && (
                  <a
                    href={reference.url}
                    download={`reference_image_${index + 1}.png`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-teal-600 hover:text-teal-800 flex items-center gap-1 px-3 py-1.5 bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors"
                  >
                    <Download size={14} />
                    Download Image
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {sortedReferences.length > 0 && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg mt-4">
          <div className="flex items-start">
            <Info className="text-blue-500 h-4 w-4 mt-0.5 mr-2 flex-shrink-0" />
            <div>
              <p className="text-xs text-blue-800 font-medium">
                About these references
              </p>
              <p className="text-xs text-blue-700 mt-1">
                These reference images help guide the design process and ensure
                the final design meets the client&apos;s expectations.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RequestReferencesDisplay;
