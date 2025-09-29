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
  Layers,
  Package,
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

interface SeeDesignStepProps {
  designId: Id<"design">; // ✅ Convex Id type
}

const SeeDesignStep: React.FC<SeeDesignStepProps> = ({ designId }) => {
  const design = useQuery(api.designs.getFullDesignDetails, { designId });

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return "N/A";
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (design === undefined) {
    return <p className="text-gray-500 italic">Loading design details…</p>;
  }
  if (design === null) {
    return <p className="text-red-500 font-medium">Design not found.</p>;
  }

  return (
    <div className="space-y-8">
     

      {design.request && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-3">
            <InfoRow
              icon={User}
              label="Assigned Designer"
              value={
                design.designer
                  ? `${design.designer.firstName} ${design.designer.lastName} `
                  : "N/A"
              }
            />
            <InfoRow
              icon={User}
              label="Client"
              value={
                design.client
                  ? `${design.client.firstName} ${design.client.lastName} `
                  : "N/A"
              }
            />
            <InfoRow
              icon={CheckCircle}
              label="Design Status"
              value={design.design.status || "N/A"}
            />
            <InfoRow
              icon={FileText}
              label="Request Title"
              value={design.request.request_title || "N/A"}
            />
            <InfoRow
              icon={Shirt}
              label="Shirt Type"
              value={design.request.tshirt_type || "N/A"}
            />
            <InfoRow
              icon={User}
              label="Gender"
              value={design.request.gender || "N/A"}
            />
          </div>

          {/* Right Column */}
          <div className="space-y-3">
            <InfoRow
              icon={Layers}
              label="Fabric"
              value={design.fabric?.name || "N/A"}
            />
            <InfoRow
              icon={Package}
              label="Print Type"
              value={design.request.print_type || "N/A"}
            />
           
            <InfoRow
              icon={FileText}
              label="Request Description"
              value={design.request.description || "No description"}
            />
            <InfoRow
              icon={Calendar}
              label="Requested At"
              value={formatDate(design.request.created_at)}
            />
          </div>
        </div>
      )}

      {/* Sizes */}
      <div className="bg-gray-50 rounded-xl p-4 shadow-sm">
        <p className="text-sm font-semibold text-gray-700 mb-2">Shirt Sizes</p>
        <ul className="space-y-1 text-sm text-gray-900">
          {design.sizes?.length > 0 ? (
            design.sizes.map((s, idx) => (
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

      {/* Colors */}
      <div className="bg-gray-50 rounded-xl p-4 shadow-sm">
        <p className="text-sm font-semibold text-gray-700 mb-2">
          Selected Colors
        </p>
        <div className="flex flex-wrap gap-2">
          {design.colors?.length > 0 ? (
            design.colors.map((c, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white shadow-sm border border-gray-400"
              >
                <span
                  
                  className="inline-block w-5 h-5 rounded-full border"
                  style={{ backgroundColor: c.hex }}
                />
                <span className="text-sm text-gray-800">{c.hex}</span>
              </div>
            ))
          ) : (
            <p className="text-gray-500 italic">No colors selected</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default SeeDesignStep;
