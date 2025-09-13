import { FileText, FileCheck, CheckCircle, AlertTriangle, Palette } from "lucide-react";

interface ActivityIconProps {
  type: string;
  status?: string;
}

const ActivityIcon: React.FC<ActivityIconProps> = ({ type, status }) => {
  if (type === "request") {
    switch (status) {
      case "pending":
        return <div className="p-2 bg-yellow-100 rounded-full"><FileText className="h-4 w-4 text-yellow-600" /></div>;
      case "approved":
        return <div className="p-2 bg-blue-100 rounded-full"><FileCheck className="h-4 w-4 text-blue-600" /></div>;
      case "completed":
        return <div className="p-2 bg-green-100 rounded-full"><CheckCircle className="h-4 w-4 text-green-600" /></div>;
      case "rejected":
        return <div className="p-2 bg-red-100 rounded-full"><AlertTriangle className="h-4 w-4 text-red-600" /></div>;
      default:
        return <div className="p-2 bg-gray-100 rounded-full"><FileText className="h-4 w-4 text-gray-600" /></div>;
    }
  } else {
    return <div className="p-2 bg-purple-100 rounded-full"><Palette className="h-4 w-4 text-purple-600" /></div>;
  }
};

export default ActivityIcon;
