// src/components/designCanvasComponents/DesignDetails.tsx
import React from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

interface DesignDetailsProps {
  designId: Id<"design">;
}

const DesignDetails: React.FC<DesignDetailsProps> = ({ designId }) => {
  const data = useQuery(api.designs.getDesignWithRequest, { designId });

  if (data === undefined) {
    return (
      <div className="p-4 bg-white rounded shadow text-center text-gray-500">
        Loading...
      </div>
    );
  }

  if (data === null) {
    return (
      <div className="p-4 bg-white rounded shadow text-center text-gray-500">
        No design found
      </div>
    );
  }

  const { request, client, status, created_at, colors, sizes } = data;

  return (
    <div className="p-4 bg-white rounded shadow w-80 space-y-4 max-h-[70vh] overflow-y-auto">
      {/* === Title & Description === */}
      <div>
        <h3 className="font-semibold text-gray-800 text-sm">Request Title</h3>
        <p className="text-gray-700 text-sm">
          {request?.request_title || "Untitled"}
        </p>
      </div>
      <div>
        <h3 className="font-semibold text-gray-800 text-sm">Description</h3>
        <p className="text-gray-700 text-sm">
          {request?.description || "No description"}
        </p>
      </div>

      {/* === Selected Colors === */}
      <div>
        <h3 className="font-semibold text-gray-800 text-sm">Selected Colors</h3>
        <div className="flex flex-wrap gap-2 mt-1">
          {colors?.length ? (
            colors.map((c, idx) => (
              <div
                key={idx}
                className="w-6 h-6 rounded border shadow-sm"
                style={{ backgroundColor: c.hex }}
                title={c.hex}
              />
            ))
          ) : (
            <p className="text-gray-500 text-sm">No colors selected</p>
          )}
        </div>
      </div>

      {/* === Client Info === */}
      <div>
        <h3 className="font-semibold text-gray-800 text-sm">Client</h3>
        <p className="text-gray-700 text-sm">
          {client ? `${client.firstName} ${client.lastName}` : "Unknown"}
        </p>
      </div>

      {/* === Shirt Sizes & Gender === */}
      <div>
        <h3 className="font-semibold text-gray-800 text-sm">Shirt Details</h3>
        <p className="text-gray-700 text-sm">
          Sizes:{" "}
          {sizes?.length
            ? sizes.map((s) => `${s.size_label} (${s.quantity})`).join(", ")
            : "N/A"}
        </p>
        <p className="text-gray-700 text-sm">
          Gender: {request?.gender || "Unspecified"}
        </p>
      </div>

      {/* === Created At === */}
      <div>
        <h3 className="font-semibold text-gray-800 text-sm">Created At</h3>
        <p className="text-gray-700 text-sm">
          {created_at ? new Date(created_at).toLocaleString() : "Unknown"}
        </p>
      </div>

      {/* === Status === */}
      <div>
        <h3 className="font-semibold text-gray-800 text-sm">Status</h3>
        <span
          className={`px-2 py-1 rounded text-xs font-medium ${
            status === "approved"
              ? "bg-green-100 text-green-700"
              : status === "in_progress"
              ? "bg-yellow-100 text-yellow-700"
              : "bg-gray-100 text-gray-700"
          }`}
        >
          {status}
        </span>
      </div>
    </div>
  );
};

export default DesignDetails;
