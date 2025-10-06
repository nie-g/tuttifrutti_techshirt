import React from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Loader, Image, ExternalLink } from "lucide-react";

interface CanvasSketchProps {
  requestId: Id<"design_requests">;
}

/** Helper for relative time display */
function formatTimeAgo(timestamp: number) {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / (1000 * 60));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const CanvasSketch: React.FC<CanvasSketchProps> = ({ requestId }) => {
  // Fetch sketch record for the request
  const sketches =
    useQuery(api.designSketch.getByRequestId, { requestId }) ?? [];

  const storageIds = sketches.map((s) => s.sketch_image);
  const urls =
    useQuery(api.getPreviewUrl.getPreviewUrls, { storageIds }) ?? [];

  if (!sketches) {
    return (
      <div className="flex flex-col items-center justify-center py-6">
        <Loader className="h-6 w-6 text-teal-500 animate-spin mb-2" />
        <p className="text-sm text-gray-600">Loading sketch...</p>
      </div>
    );
  }

  if (sketches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-6 text-center">
        <Image className="h-8 w-8 text-gray-300 mb-2" />
        <p className="text-sm text-gray-600 font-medium">
          No sketch to show.
        </p>
      </div>
    );
  }

  const sketchesWithUrls = sketches.map((sketch, idx) => ({
    ...sketch,
    url: urls[idx] ?? null,
  }));

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {sketchesWithUrls.map((sketch, idx) => (
        <div
          key={sketch._id}
          className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow"
        >
          <div className="relative h-56 bg-gray-50 flex items-center justify-center">
            {sketch.url ? (
              <img
                src={sketch.url}
                alt={`Sketch ${idx + 1}`}
                className="w-full h-full object-contain"
              />
            ) : (
              <p className="text-xs text-gray-400">Image not available</p>
            )}
            {sketch.url && (
              <a
                href={sketch.url}
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
           
            <p className="text-xs text-gray-500">
              {formatTimeAgo(sketch.created_at ?? sketch._creationTime)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CanvasSketch;
