// src/components/clientRequestDetails/RequestInfo.tsx
import React from "react";
import {
  User,
  FileText,
  Shirt,
  Tag,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";

interface RequestInfoProps {
  request: {
    client?: { full_name?: string; email?: string };
    shirtType?: string;
    styleTemplate?: string;
    description?: string;
    status?: string;
  };
}

const StatusBadge: React.FC<{ status?: string }> = ({ status }) => {
  if (status === "approved") {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700">
        <CheckCircle className="w-3 h-3 mr-1" /> Approved
      </span>
    );
  }
  if (status === "rejected") {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700">
        <XCircle className="w-3 h-3 mr-1" /> Rejected
      </span>
    );
  }
  if (status === "pending") {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-50 text-yellow-700">
        <Clock className="w-3 h-3 mr-1" /> Pending
      </span>
    );
  }
  if (status === "cancelled") {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-50 text-orange-700">
        <Clock className="w-3 h-3 mr-1" /> cancelled
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
      {status || "Unknown"}
    </span>
  );
};

const InfoRow: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}> = ({ icon, label, value }) => (
  <div className="flex items-start space-x-3">
    <div className="mt-0.5 text-gray-400">{icon}</div>
    <div>
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <div className="text-sm text-gray-900">{value}</div>
    </div>
  </div>
);

const RequestInfo: React.FC<RequestInfoProps> = ({ request }) => {
  return (
    <div className="space-y-5">
      {/* Client */}
      <InfoRow
        icon={<User className="h-5 w-5" />}
        label="Client"
        value={
          <div>
            <p className="font-medium">
              {request.client?.full_name || "Unknown"}
            </p>
            {request.client?.email && (
              <p className="text-xs text-gray-500">{request.client.email}</p>
            )}
          </div>
        }
      />

      {/* Description */}
      <InfoRow
        icon={<FileText className="h-5 w-5" />}
        label="Description"
        value={
          request.description ? (
            <p className="whitespace-pre-wrap">{request.description}</p>
          ) : (
            <p className="italic text-gray-500">No description provided.</p>
          )
        }
      />

      {/* Shirt Type */}
      <InfoRow
        icon={<Shirt className="h-5 w-5" />}
        label="Shirt Type"
        value={request.shirtType || "—"}
      />

      {/* Style Template */}
      <InfoRow
        icon={<Tag className="h-5 w-5" />}
        label="Style Template"
        value={request.styleTemplate || "Custom"}
      />

      {/* Status */}
      <InfoRow
        icon={<CheckCircle className="h-5 w-5" />}
        label="Status"
        value={<StatusBadge status={request.status} />}
      />
    </div>
  );
};

export default RequestInfo;
