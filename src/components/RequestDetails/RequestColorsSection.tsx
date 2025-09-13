import React from "react";
import RequestColorsDisplay from "../RequestColorsDisplay";
import type { RequestType } from "../RequestDetailsModal";

const RequestColorsSection: React.FC<{ request: RequestType }> = ({ request }) => (
  <div>
    <RequestColorsDisplay requestId={request._id} compact={false} />
  </div>
);

export default RequestColorsSection;
