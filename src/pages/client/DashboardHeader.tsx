import { Plus, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";

export default function DashboardHeader() {
  const navigate = useNavigate();
  const { user } = useUser();

  const userName = user?.fullName || "Client";

  return (
    <div className="p-6 bg-white rounded-2xl shadow-md">
      <h1 className="text-2xl font-bold text-gray-900">Client Dashboard</h1>
      <p className="text-gray-600">Welcome back, {userName}!</p>

      <div className="flex flex-wrap mt-6 gap-4">
        <button
          onClick={() => navigate("/client/requests/new")}
          className="px-6 py-3 text-teal-500 border-2 border-teal-500 rounded-lg hover:bg-teal-500 hover:text-white flex items-center gap-2"
        >
          <Plus size={18} />
          New Design Request
        </button>
        <button
          onClick={() => navigate("/client/requests")}
          className="px-6 py-3 text-teal-500 border-2 border-teal-500 rounded-lg hover:bg-teal-500 hover:text-white flex items-center gap-2"
        >
          <FileText size={18} />
          View All Requests
        </button>
      </div>
    </div>
  );
}
