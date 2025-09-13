import React from "react";
import RequestReferencesDisplay from "../RequestReferencesDisplay";
import type { RequestType } from "../RequestDetailsModal";

const RequestReferencesSection: React.FC<{ request: RequestType }> = ({ request }) => (
  <div>
    <RequestReferencesDisplay requestId={request._id} compact={false} />
  </div>
);

export default RequestReferencesSection;
