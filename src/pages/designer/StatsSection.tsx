import React from "react";
import { Users, Layers, FileText } from "lucide-react";

export interface StatsSectionProps {
  totalClients: number;
  totalDesigns: number;
  totalRequests: number;
}

const StatsSection: React.FC<StatsSectionProps> = ({
  totalClients,
  totalDesigns,
  totalRequests,
}) => {
  return (
    <section className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-6">
      {/* Clients Card */}
      <div className="bg-white p-6 rounded-2xl shadow-md border-l-4 border-blue-500 hover:shadow-lg transition-shadow">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-gray-500">Clients</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">
              {totalClients}
            </h3>
          </div>
          <div className="p-3 bg-blue-100 rounded-full">
            <Users className="h-6 w-6 text-blue-500" />
          </div>
        </div>
      </div>

      {/* Designs Card */}
      <div className="bg-white p-6 rounded-2xl shadow-md border-l-4 border-purple-500 hover:shadow-lg transition-shadow">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-gray-500">Designs</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">
              {totalDesigns}
            </h3>
          </div>
          <div className="p-3 bg-purple-100 rounded-full">
            <Layers className="h-6 w-6 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Requests Card */}
      <div className="bg-white p-6 rounded-2xl shadow-md border-l-4 border-teal-500 hover:shadow-lg transition-shadow">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-gray-500">Requests</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">
              {totalRequests}
            </h3>
          </div>
          <div className="p-3 bg-teal-100 rounded-full">
            <FileText className="h-6 w-6 text-teal-500" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
