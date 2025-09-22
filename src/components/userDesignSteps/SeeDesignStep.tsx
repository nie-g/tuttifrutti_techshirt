import React from "react";
import {
  Shirt,
  FileText,
  Calendar,
  User,
  CheckCircle,
  Clock,
} from "lucide-react";
import type { Id } from "../../../convex/_generated/dataModel";
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
  <div className="flex items-start gap-3">
    <div className="p-2 rounded-lg bg-gray-100 text-gray-600">
      <Icon size={18} />
    </div>
    <div>
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="text-base text-gray-900">{value}</p>
    </div>
  </div>
);

/* -------------------------
   Types
------------------------- */
interface User {
  _id: Id<"users">;
  firstName: string;
  lastName: string;
  email: string;
}

interface DesignRequest {
  _id: Id<"design_requests">;
  request_title: string;
  gender?: string;
  tshirt_type?: string;
  description?: string;
  status: "pending" | "approved" | "rejected";
  created_at?: number;
}

interface Design {
  _id: Id<"design">;
  description?: string;
  status: "in_progress" | "finished" | "billed" | "approved";
  deadline?: string;
  created_at?: number;
  designer?: User;
  client?: User;
  designRequest?: DesignRequest;
}

/* -------------------------
   Component
------------------------- */
const SeeDesignStep: React.FC<{ design: Design }> = ({ design }) => {
  const formatDate = (timestamp?: number) => {
    if (!timestamp) return "N/A";
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-800">Design Details</h3>

      <div className="space-y-4">
        {/* --- DESIGN INFO --- */}
        <InfoRow
          icon={FileText}
          label="Description"
          value={design.description || "No design description available."}
        />
        <InfoRow icon={CheckCircle} label="Status" value={design.status || "N/A"} />
        <InfoRow icon={Clock} label="Deadline" value={design.deadline || "Not set"} />
        <InfoRow icon={Calendar} label="Created At" value={formatDate(design.created_at)} />

        {/* --- DESIGNER INFO --- */}
        <InfoRow
          icon={User}
          label="Designer"
          value={
            design.designer
              ? `${design.designer.firstName} ${design.designer.lastName} (${design.designer.email})`
              : "N/A"
          }
        />

        {/* --- CLIENT INFO --- */}
        <InfoRow
          icon={User}
          label="Client"
          value={
            design.client
              ? `${design.client.firstName} ${design.client.lastName}`
              : "N/A"
          }
        />

        {/* --- DESIGN REQUEST INFO --- */}
        <div className="pt-4 border-t space-y-4">
          <h4 className="text-md font-semibold text-gray-800">Request Details</h4>

          <InfoRow
            icon={FileText}
            label="Request Title"
            value={design.designRequest?.request_title || "N/A"}
          />
          <InfoRow
            icon={Shirt}
            label="Shirt Type"
            value={design.designRequest?.tshirt_type || "N/A"}
          />
          <InfoRow
            icon={User}
            label="Gender"
            value={design.designRequest?.gender || "N/A"}
          />
          <InfoRow
            icon={CheckCircle}
            label="Request Status"
            value={design.designRequest?.status || "N/A"}
          />
          <InfoRow
            icon={FileText}
            label="Request Description"
            value={design.designRequest?.description || "No description"}
          />
          <InfoRow
            icon={Calendar}
            label="Requested At"
            value={formatDate(design.designRequest?.created_at)}
          />
        </div>
      </div>
    </div>
  );
};

export default SeeDesignStep;
