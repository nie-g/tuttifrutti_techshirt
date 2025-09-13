import React from "react";

interface ProjectsProps {
  requests: any[];
  navigate: any;
}

const ProjectsSection: React.FC<ProjectsProps> = ({ requests, navigate }) => {
  if (!requests.length) {
    return (
      <div className="bg-white p-6 rounded-2xl shadow-md text-center">
        <p className="text-gray-600">No active projects found.</p>
        <button
          onClick={() => navigate("/client/requests/new")}
          className="mt-4 px-4 py-2 bg-teal-100 text-teal-700 rounded-md hover:bg-teal-200 transition-colors"
        >
          Create Your First Request
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-2xl shadow-md">
      <h2 className="text-xl font-bold text-gray-900 mb-4">My Projects</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {requests.map((project: any) => (
          <div
            key={project._id}
            className="p-5 transition-all border border-gray-200 shadow-sm bg-gradient-to-r from-white to-teal-50 rounded-xl hover:shadow-md hover:border-teal-200"
          >
            <div className="flex justify-between items-start mb-3">
              <h3 className="text-base font-semibold text-gray-800">{project.request_title}</h3>
              <span className="text-xs px-2 py-1 bg-gray-100 text-gray-800 rounded-full">{project.status}</span>
            </div>
            <p className="text-sm text-gray-600 mb-1">Type: <span className="font-medium">{project.tshirt_type}</span></p>
            <p className="text-sm text-gray-600 mb-3">Designer: <span className="font-medium">{project.designer?.full_name || "Unassigned"}</span></p>
            <div className="flex justify-between items-center">
              <button
                onClick={() => navigate(`/client/requests/${project._id}`)}
                className="px-3 py-1.5 text-sm font-medium text-teal-600 hover:text-teal-800 hover:bg-teal-50 rounded-lg transition-colors"
              >
                View Details →
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProjectsSection;
