import { Users, FileText, Layers, PieChart } from "lucide-react";

interface Stats {
  users: { total: number; designer: number; client: number; admin: number };
  requests: { total: number; pending: number; approved: number; rejected: number };
  templates: { total: number };
  shirtSizes: { total: number };
}

interface StatsCardsProps {
  stats: Stats;
}

const StatsCards: React.FC<StatsCardsProps> = ({ stats }) => {
 

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Users Card */}
      <div className="bg-white p-6 rounded-2xl shadow-md border-l-4 border-blue-500 hover:shadow-lg transition-shadow">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-gray-500">Total Users</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">{stats.users.total}</h3>
          </div>
          <div className="p-3 bg-blue-100 rounded-full">
            <Users className="h-6 w-6 text-blue-500" />
          </div>
        </div>
        <div className="mt-4 flex gap-3">
          <span className="text-xs px-2 py-1 bg-purple-100 text-purple-800 rounded-full">Designers: {stats.users.designer}</span>
          <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">Clients: {stats.users.client}</span>
        </div>
      </div>

      {/* Requests Card */}
      <div className="bg-white p-6 rounded-2xl shadow-md border-l-4 border-teal-500 hover:shadow-lg transition-shadow">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-gray-500">Design Requests</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">{stats.requests.total}</h3>
          </div>
          <div className="p-3 bg-teal-100 rounded-full">
            <FileText className="h-6 w-6 text-teal-500" />
          </div>
        </div>
      </div>

      {/* Templates Card */}
      <div className="bg-white p-6 rounded-2xl shadow-md border-l-4 border-purple-500 hover:shadow-lg transition-shadow">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-gray-500">Design Templates</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">{stats.templates.total}</h3>
          </div>
          <div className="p-3 bg-purple-100 rounded-full">
            <Layers className="h-6 w-6 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Shirt Sizes Card */}
      <div className="bg-white p-6 rounded-2xl shadow-md border-l-4 border-amber-500 hover:shadow-lg transition-shadow">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-gray-500">Shirt Sizes</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">{stats.shirtSizes.total}</h3>
          </div>
          <div className="p-3 bg-amber-100 rounded-full">
            <PieChart className="h-6 w-6 text-amber-500" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsCards;
