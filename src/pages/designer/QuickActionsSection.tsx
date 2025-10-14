import { PlusCircle, Upload, Folder } from "lucide-react";

const actions = [
  {
    label: "New Project",
    description: "Start a new design project for your client.",
    icon: <PlusCircle className="h-5 w-5 text-teal-600" />,
    path: "/designer/projects/new",
  },
  {
    label: "Upload Design",
    description: "Upload completed designs and share with clients.",
    icon: <Upload className="h-5 w-5 text-teal-600" />,
    path: "/designer/designs/upload",
  },
  {
    label: "Browse Projects",
    description: "View all active and past projects you’ve worked on.",
    icon: <Folder className="h-5 w-5 text-teal-600" />,
    path: "/designer/projects",
  },
];

interface QuickActionsProps {
  navigate?: (path: string) => void; // optional so UI works standalone
}

export default function QuickActionsSection({ navigate }: QuickActionsProps) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-md">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Quick Actions</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {actions.map((action, idx) => (
          <div
            key={idx}
            className="p-4 bg-teal-50 rounded-xl hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-teal-100 rounded-full">{action.icon}</div>
              <h3 className="font-medium text-gray-800">{action.label}</h3>
            </div>
            <p className="text-sm text-gray-600 mb-3">{action.description}</p>
            <button
              onClick={() => navigate && navigate(action.path)}
              className="w-full px-3 py-2 bg-teal-100 text-teal-700 rounded-md hover:bg-teal-200 transition-colors text-sm font-medium"
            >
              {action.label}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
