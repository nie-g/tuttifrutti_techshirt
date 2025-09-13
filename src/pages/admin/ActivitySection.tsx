import ActivityIcon from "./ActivityIcon";
import { Activity } from "lucide-react";

interface ActivityItem {
  id: string;
  type: "request" | "design";
  status?: string;
  user: string;
  title: string;
  timestamp: number;
}

interface ActivitySectionProps {
  activities: ActivityItem[];
  isLoading: boolean;
}

const ActivitySection: React.FC<ActivitySectionProps> = ({ activities, isLoading }) => {
  const formatTimeAgo = (timestamp: number) => {
    if (!timestamp) return "Unknown";
    const now = Date.now();
    const diff = now - timestamp;

    if (diff < 3600000) return "Just now";
    else if (diff < 86400000) return "Today";
    else if (diff < 172800000) return "1 day ago";
    else if (diff < 604800000) return Math.floor(diff / 86400000) + " days ago";
    else return new Date(timestamp).toLocaleDateString();
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-900">Recent Activity</h2>
        <span className="text-xs px-2 py-1 bg-teal-100 text-teal-800 rounded-full">
          Last 7 days
        </span>
      </div>

      {isLoading ? (
        <div className="py-8 text-center">
          <div className="inline-block p-3 bg-teal-100 rounded-full mb-4">
            <Activity className="h-6 w-6 text-teal-500 animate-pulse" />
          </div>
          <p className="text-gray-600">Loading activity...</p>
        </div>
      ) : activities.length === 0 ? (
        <div className="py-8 text-center">
          <div className="inline-block p-3 bg-gray-100 rounded-full mb-4">
            <Activity className="h-6 w-6 text-gray-500" />
          </div>
          <p className="text-gray-600">No recent activity found.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg">
          <ul className="divide-y divide-gray-200">
            {activities.map((activity) => (
              <li key={activity.id} className="px-4 py-3 hover:bg-gray-50 transition-colors">
                <div className="flex items-start gap-3">
                  <ActivityIcon type={activity.type} status={activity.status} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800">
                      <span className="font-medium">{activity.user}</span>
                      {activity.type === "request" ? (
                        activity.status === "pending" ? (
                          <> submitted a new design request </> 
                        ) : activity.status === "approved" ? (
                          <> had their request approved </> 
                        ) : activity.status === "completed" ? (
                          <> received a completed design </> 
                        ) : (
                          <> had a request status change </> 
                        )
                      ) : (
                        <> created a new design </> 
                      )}
                      <span className="font-medium"> "{activity.title}"</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{formatTimeAgo(activity.timestamp)}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ActivitySection;
