import { useNavigate } from "react-router-dom";
import { FileText, Users } from "lucide-react";
import { useUser } from "@clerk/clerk-react";


export default function HeaderSection() {
  const navigate = useNavigate();
  const { user } = useUser();

  const userName = user?.fullName || "Admin";


  return (
    <div className="p-6 bg-white rounded-2xl shadow-md">
      <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
      <p className="text-gray-600">Welcome back, {userName}!</p>
      <div className="flex flex-wrap mt-6 gap-4">
        <button
          onClick={() => navigate('/admin/requests')}
          className="px-6 py-3 text-teal-500 transition border-2 border-teal-500 rounded-lg hover:bg-teal-500 hover:text-white flex items-center gap-2"
        >
          <FileText size={18} /> View All Requests
        </button>
        <button
          onClick={() => navigate('/admin/users')}
          className="px-6 py-3 text-teal-500 transition border-2 border-teal-500 rounded-lg hover:bg-teal-500 hover:text-white flex items-center gap-2"
        >
          <Users size={18} /> Manage Users
        </button>
      </div>
    </div>
  );
}
