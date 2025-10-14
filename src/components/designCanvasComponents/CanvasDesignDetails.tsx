import React from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import {
  Shirt,
  FileText,
  Calendar,
  User,
  CheckCircle,
  Clock,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

/* -------------------------
   Reusable Info Row
------------------------- */
const InfoRow = ({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string | React.ReactNode;
}) => (
  <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition">
    <div className="p-2 rounded-lg bg-white shadow-sm text-gray-600 flex items-center justify-center">
      <Icon size={18} />
    </div>
    <div>
      <p className="text-xs uppercase font-medium text-gray-500 tracking-wide">
        {label}
      </p>
      <p className="text-sm font-semibold text-gray-900">{value}</p>
    </div>
  </div>
);

interface DesignDetailsProps {
  designId: Id<"design">;
}

const DesignDetails: React.FC<DesignDetailsProps> = ({ designId }) => {
  const data = useQuery(api.designs.getDesignWithRequest, { designId });

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return "N/A";
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

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
    <div className="p-4 bg-white rounded shadow w-80 space-y-6 max-h-[70vh] overflow-y-auto">
      {/* === Title & Description === */}
      <div className="space-y-3">
        <InfoRow
          icon={FileText}
          label="Request Title"
          value={request?.request_title || "Untitled"}
        />
        <InfoRow
          icon={FileText}
          label="Description"
          value={request?.description || "No description"}
        />
      </div>

      {/* === Client Info === */}
      <InfoRow
        icon={User}
        label="Client"
        value={client ? `${client.firstName} ${client.lastName}` : "Unknown"}
      />

      {/* === Shirt Details === */}
      <div className="space-y-3">
        <InfoRow
          icon={Shirt}
          label="Shirt Type"
          value={request?.tshirt_type || "N/A"}
        />
        <InfoRow
          icon={User}
          label="Gender"
          value={request?.gender || "Unspecified"}
        />
      </div>

      {/* === Selected Colors === */}
      <div>
        <p className="text-sm font-semibold text-gray-700 mb-2">
          Selected Colors
        </p>
        <div className="flex flex-wrap gap-2">
          {colors?.length ? (
            colors.map((c, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-300 shadow-sm"
              >
                <span
                  className="inline-block w-5 h-5 rounded-full border"
                  style={{ backgroundColor: c.hex }}
                />
                <span className="text-sm text-gray-800">{c.hex}</span>
              </div>
            ))
          ) : (
            <p className="text-gray-500 italic text-sm">No colors selected</p>
          )}
        </div>
      </div>

      {/* === Sizes === */}
      <div className="bg-gray-50 rounded-xl p-4 shadow-sm">
        <p className="text-sm font-semibold text-gray-700 mb-2">Shirt Sizes</p>
        <ul className="space-y-1 text-sm text-gray-900">
          {sizes?.length ? (
            sizes.map((s, idx) => (
              <li
                key={idx}
                className="flex justify-between bg-white px-3 py-1.5 rounded-md shadow-sm"
              >
                <span>{s.size_label}</span>
                <span className="text-gray-600">{s.quantity} pcs</span>
              </li>
            ))
          ) : (
            <li className="text-gray-500 italic">No sizes specified</li>
          )}
        </ul>
      </div>

      {/* === Deadline === */}
      <InfoRow
        icon={Clock}
        label="Deadline"
        value={
          request?.preferred_date
            ? new Date(request.preferred_date).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })
            : "No deadline set"
        }
      />

      {/* === Created At === */}
      <InfoRow
        icon={Calendar}
        label="Created At"
        value={formatDate(created_at)}
      />

      {/* === Status === */}
      <InfoRow
        icon={CheckCircle}
        label="Status"
        value={
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
        }
      />
    </div>
  );
};

export default DesignDetails;
