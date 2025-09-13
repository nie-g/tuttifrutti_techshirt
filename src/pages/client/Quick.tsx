// src/components/QuickActions.tsx
import React from "react";
import { FileText, Palette, Bell } from "lucide-react";

interface QuickActionsProps {
  navigate: (path: string) => void;
}

const QuickActions: React.FC<QuickActionsProps> = ({ navigate }) => {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-md">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Quick Actions</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-teal-50 rounded-xl hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-teal-100 rounded-full">
              <FileText className="h-5 w-5 text-teal-600" />
            </div>
            <h3 className="font-medium text-gray-800">New Request</h3>
          </div>
          <p className="text-sm text-gray-600 mb-3">Create a new design request for your t-shirt project.</p>
          <button
            onClick={() => navigate('/client/requests/new')}
            className="w-full px-3 py-2 bg-teal-100 text-teal-700 rounded-md hover:bg-teal-200 transition-colors text-sm font-medium"
          >
            Start New Request
          </button>
        </div>

        <div className="p-4 bg-teal-50 rounded-xl hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-teal-100 rounded-full">
              <Palette className="h-5 w-5 text-teal-600" />
            </div>
            <h3 className="font-medium text-gray-800">My Designs</h3>
          </div>
          <p className="text-sm text-gray-600 mb-3">View and download your completed design files.</p>
          <button
            onClick={() => navigate('/client/designs')}
            className="w-full px-3 py-2 bg-teal-100 text-teal-700 rounded-md hover:bg-teal-200 transition-colors text-sm font-medium"
          >
            View Designs
          </button>
        </div>

        <div className="p-4 bg-teal-50 rounded-xl hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-teal-100 rounded-full">
              <Bell className="h-5 w-5 text-teal-600" />
            </div>
            <h3 className="font-medium text-gray-800">Notifications</h3>
          </div>
          <p className="text-sm text-gray-600 mb-3">View all your notifications and updates.</p>
          <button
            onClick={() => navigate('/notifications')}
            className="w-full px-3 py-2 bg-teal-100 text-teal-700 rounded-md hover:bg-teal-200 transition-colors text-sm font-medium"
          >
            View Notifications
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuickActions;
