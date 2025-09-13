import React from "react";
import { FileText, Palette, Bell } from "lucide-react";

interface StatsCardsProps {
  requests: any[];
  designs: any[];
}

const StatsCards: React.FC<StatsCardsProps> = ({ requests, designs }) => {
  const requestStats = {
    total: requests.length,
    pending: requests.filter(r => r.status === "pending").length,
    approved: requests.filter(r => r.status === "approved").length,
    completed: requests.filter(r => r.status === "completed").length,
  };

  const designStats = {
    total: designs.length,
    completed: designs.filter(d => d.status === "completed").length,
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Requests */}
      <div className="bg-white p-6 rounded-2xl shadow-md border-l-4 border-teal-500 hover:shadow-lg transition-shadow">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-gray-500">My Requests</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">{requestStats.total}</h3>
          </div>
          <div className="p-3 bg-teal-100 rounded-full">
            <FileText className="h-6 w-6 text-teal-500" />
          </div>
        </div>
        <div className="mt-4 flex gap-3 flex-wrap">
          <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full">
            Pending: {requestStats.pending}
          </span>
          <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
            Approved: {requestStats.approved}
          </span>
          <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">
            Completed: {requestStats.completed}
          </span>
        </div>
      </div>

      {/* Designs */}
      <div className="bg-white p-6 rounded-2xl shadow-md border-l-4 border-purple-500 hover:shadow-lg transition-shadow">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-gray-500">My Designs</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">{designStats.total}</h3>
          </div>
          <div className="p-3 bg-purple-100 rounded-full">
            <Palette className="h-6 w-6 text-purple-500" />
          </div>
        </div>
        <div className="mt-4 flex gap-3">
          <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">
            Completed: {designStats.completed}
          </span>
          <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
            In Progress: {designStats.total - designStats.completed}
          </span>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-white p-6 rounded-2xl shadow-md border-l-4 border-indigo-500 hover:shadow-lg transition-shadow">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-gray-500">Notifications</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">0</h3>
          </div>
          <div className="p-3 bg-indigo-100 rounded-full">
            <Bell className="h-6 w-6 text-indigo-500" />
          </div>
        </div>
        <div className="mt-4">
          <span className="text-xs px-2 py-1 bg-gray-100 text-gray-800 rounded-full">No unread notifications</span>
        </div>
      </div>
    </div>
  );
};

export default StatsCards;
