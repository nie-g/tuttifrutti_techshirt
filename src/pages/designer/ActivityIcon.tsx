interface Activity {
  message: string;
  created_at: number;
}

interface ActivitySectionProps {
  activities: Activity[];
}

export default function ActivitySection({ activities }: ActivitySectionProps) {
  return (
    <section className="mt-8 bg-white p-6 rounded-2xl shadow">
      <h2 className="text-lg font-bold text-gray-800 mb-4">Recent Activity</h2>
      {activities.length === 0 ? (
        <p className="text-gray-500">No recent activity.</p>
      ) : (
        <ul className="space-y-3">
          {activities.map((act, idx) => (
            <li
              key={idx}
              className="p-3 bg-gray-50 rounded-xl border flex justify-between"
            >
              <span className="text-gray-700">{act.message}</span>
              <span className="text-xs text-gray-400">
                {new Date(act.created_at).toLocaleTimeString()}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
