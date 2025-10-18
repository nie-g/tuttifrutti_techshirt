import React from "react";
import { useNavigate } from "react-router-dom";
import { TrendingUp, FileText, Activity } from "lucide-react";
import StatusBadge from "../../components/StatusBadge";

interface Project {
  id: string;
  name: string;
  lastUpdate: string;
  status: string;
  client: string;
  designer: string;
}

interface ProjectsSectionProps {
  projects: Project[];
  isLoading: boolean;
}

const ProjectsSection: React.FC<ProjectsSectionProps> = ({ projects, isLoading }) => {
  const navigate = useNavigate();


  return (
    <div className="bg-white p-6 rounded-2xl shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-900">Recent Projects</h2>
        <button
          onClick={() => navigate('/admin/requests')}
          className="text-sm text-teal-600 hover:text-teal-800 flex items-center gap-1"
        >
          View All <TrendingUp size={16} />
        </button>
      </div>

      {isLoading ? (
        <div className="py-8 text-center">
          <div className="inline-block p-3 bg-teal-100 rounded-full mb-4">
            <Activity className="h-6 w-6 text-teal-500 animate-pulse" />
          </div>
          <p className="text-gray-600">Loading projects...</p>
        </div>
      ) : projects.length === 0 ? (
        <div className="py-8 text-center">
          <div className="inline-block p-3 bg-gray-100 rounded-full mb-4">
            <FileText className="h-6 w-6 text-gray-500" />
          </div>
          <p className="text-gray-600">No active projects found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {projects.slice(0, 6).map((project) => (
            <div
              key={project.id}
              className="p-5 transition-all border border-gray-200 shadow-sm bg-gradient-to-r from-white to-teal-50 rounded-xl hover:shadow-md hover:border-teal-200"
            >
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-base font-semibold text-gray-800 line-clamp-1">{project.name}</h3>
                <StatusBadge status={project.status} />
              </div>
              <p className="text-sm text-gray-600 mb-1">
                Client: <span className="font-medium">{project.client}</span>
              </p>
              <p className="text-sm text-gray-600 mb-3">
                Designer: <span className="font-medium">{project.designer}</span>
              </p>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">{project.lastUpdate}</span>
              
              </div>
            </div>
          ))}
        </div>
      )}
      
    </div>
    

  );
};

export default ProjectsSection;
