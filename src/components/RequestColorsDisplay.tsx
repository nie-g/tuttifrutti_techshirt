// src/components/RequestColorsDisplay.tsx
import React, { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Loader, Palette, AlertCircle } from "lucide-react";
import type { Id } from "../../convex/_generated/dataModel";

/* -------------------------
   Props
------------------------- */
interface RequestColorsDisplayProps {
  requestId: Id<"design_requests">;
  compact?: boolean;
}

/* -------------------------
   Component
------------------------- */
const RequestColorsDisplay: React.FC<RequestColorsDisplayProps> = ({
  requestId,
  compact = false,
}) => {
  const [loading, setLoading] = useState(true);

  // Fetch selected colors for this request
  const selectedColors = useQuery(api.colors.getSelectedColors, { requestId });

  useEffect(() => {
    if (selectedColors !== undefined) {
      setLoading(false);
    }
  }, [selectedColors]);

  /* -------------------------
     Loading State
  ------------------------- */
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-6 bg-gray-50 rounded-lg border border-gray-200">
        <Loader
          className={`${
            compact ? "h-6 w-6" : "h-8 w-8"
          } text-teal-500 animate-spin mb-2`}
        />
        <p className={`${compact ? "text-xs" : "text-sm"} text-gray-600`}>
          Loading color information...
        </p>
      </div>
    );
  }

  /* -------------------------
     Empty State
  ------------------------- */
  if (!selectedColors || selectedColors.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-6 bg-gray-50 rounded-lg border border-gray-200">
        <Palette
          className={`${compact ? "h-6 w-6" : "h-8 w-8"} text-gray-300 mb-2`}
        />
        <p
          className={`${
            compact ? "text-xs" : "text-sm"
          } text-gray-700 font-medium`}
        >
          No colors specified
        </p>
        <p
          className={`${
            compact ? "text-xs" : "text-sm"
          } text-gray-500 mt-1 max-w-md text-center px-4`}
        >
          This request doesn&apos;t have any specific colors selected.
        </p>
      </div>
    );
  }

  /* -------------------------
     Sort colors (newest first)
  ------------------------- */
  const sortedColors = [...selectedColors].sort(
    (a, b) =>
      (b.created_at ?? b._creationTime) - (a.created_at ?? a._creationTime)
  );

  /* -------------------------
     Render
  ------------------------- */
  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="bg-white p-3 rounded-lg border border-gray-200">
        <h3
          className={`${
            compact ? "text-xs" : "text-sm"
          } font-semibold text-gray-700 mb-1`}
        >
          Selected Colors
        </h3>
        <p className={`${compact ? "text-xs" : "text-sm"} text-gray-600`}>
          {sortedColors.length}{" "}
          {sortedColors.length === 1 ? "color" : "colors"} selected for this
          design.
        </p>
      </div>

      {/* Color Swatches */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="p-4">
          <div className="flex flex-wrap gap-2">
            {sortedColors.map((color) => (
              <div key={color._id} className="color-item">
                <div
                  className="w-12 h-12 rounded-lg border border-gray-200 shadow-sm"
                  style={{ backgroundColor: color.hex }}
                  title={color.hex}
                />
                <p className="text-xs text-center mt-1 text-gray-600">
                  {color.hex}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Info Box */}
        <div className="p-3 bg-blue-50 border-t border-blue-200">
          <div className="flex items-start">
            <AlertCircle className="text-blue-500 h-4 w-4 mt-0.5 mr-2 flex-shrink-0" />
            <div>
              <p className="text-xs text-blue-800 font-medium">
                About these colors
              </p>
              <p className="text-xs text-blue-700 mt-1">
                These colors were selected during the design request process and
                will be used as a reference for the final design.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequestColorsDisplay;
