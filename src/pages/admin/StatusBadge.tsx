import { CheckCircle, Clock, AlertTriangle, FileText } from "lucide-react";

interface StatusBadgeProps {
  status: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  let bgColor = "bg-gray-100";
  let textColor = "text-gray-800";
  let icon = <FileText className="h-3 w-3 mr-1" />;

  switch (status) {
    case "Planning":
      bgColor = "bg-yellow-100";
      textColor = "text-yellow-800";
      icon = <Clock className="h-3 w-3 mr-1" />;
      break;
    case "Approved":
      bgColor = "bg-yellow-100";
      textColor = "text-yellow-800";
      icon = <Clock className="h-3 w-3 mr-1" />;
      break;
    case "In Progress":
      bgColor = "bg-blue-100";
      textColor = "text-blue-800";
      icon = <CheckCircle className="h-3 w-3 mr-1" />;
      break;
    case "Rejected":
      bgColor = "bg-red-100";
      textColor = "text-red-800";
      icon = <AlertTriangle className="h-3 w-3 mr-1" />;
      break;
    case "Completed":
      bgColor = "bg-green-100";
      textColor = "text-green-800";
      icon = <CheckCircle className="h-3 w-3 mr-1" />;
      break;
    case "Pending":
      bgColor = "bg-green-100";
      textColor = "text-green-800";
      icon = <CheckCircle className="h-3 w-3 mr-1" />;
      break;
    case "Cancelled":
      bgColor = "bg-red-100";
      textColor = "text-red-800";
      icon = <AlertTriangle className="h-3 w-3 mr-1" />;
      break;
  }

  return (
    <span className={`text-xs px-2 py-1 rounded-full flex items-center ${bgColor} ${textColor}`}>
      {icon}
      {status}
    </span>
  );
};

export default StatusBadge;
