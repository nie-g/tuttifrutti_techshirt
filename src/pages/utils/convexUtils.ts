/**
 * Utility functions for working with Convex data and project formatting
 */

export const formatDate = (timestamp?: number | string | Date): string => {
  if (!timestamp) return "N/A";
  const date = new Date(timestamp);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export const formatDateTime = (timestamp?: number | string | Date): string => {
  if (!timestamp) return "N/A";
  const date = new Date(timestamp);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const formatTimeAgo = (timestamp?: number | string | Date): string => {
  if (!timestamp) return "Unknown";
  const now = Date.now();
  const time = typeof timestamp === "number" ? timestamp : new Date(timestamp).getTime();
  const diff = now - time;

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  const weeks = Math.floor(diff / 604800000);
  const months = Math.floor(diff / 2629800000);

  if (diff < 60000) return "Just now";
  if (diff < 3600000) return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`;
  if (diff < 86400000) return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  if (diff < 604800000) return `${days} ${days === 1 ? "day" : "days"} ago`;
  if (diff < 2629800000) return `${weeks} ${weeks === 1 ? "week" : "weeks"} ago`;
  if (diff < 31557600000) return `${months} ${months === 1 ? "month" : "months"} ago`;
  return new Date(time).toLocaleDateString();
};

export const getStatusColor = (status?: string): string => {
  switch (status?.toLowerCase()) {
    case "pending":
      return "bg-yellow-100 text-yellow-800";
    case "approved":
      return "bg-green-100 text-green-800";
    case "rejected":
      return "bg-red-100 text-red-800";
    case "completed":
      return "bg-blue-100 text-blue-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export const getStatusText = (status?: string): string => {
  switch (status?.toLowerCase()) {
    case "pending":
      return "Pending";
    case "approved":
      return "Approved";
    case "rejected":
      return "Rejected";
    case "completed":
      return "Completed";
    default:
      return "Unknown";
  }
};

export const formatStatus = (status?: string): string => {
  switch (status?.toLowerCase()) {
    case "pending":
      return "Planning";
    case "approved":
      return "In Progress";
    case "completed":
      return "Completed";
    case "rejected":
      return "Cancelled";
    default:
      return "Review";
  }
};

export const truncateText = (text?: string, maxLength = 50): string => {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
};
