"use client";

interface RecentEventsProps {
  events: any[];
}

export default function RecentEvents({ events }: RecentEventsProps) {
  return (
    <div className="card">
      <h3 className="text-lg font-semibold mb-4">Recent Security Events</h3>
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {events.slice(0, 20).map((event) => (
          <div
            key={event.id}
            className="border border-gray-200 dark:border-gray-700 rounded-lg p-3"
          >
            <div className="flex justify-between items-center">
              <span
                className={`text-sm font-medium ${
                  event.type.includes("FAILED") || event.type.includes("REVOKED")
                    ? "text-red-600"
                    : event.type.includes("SUCCESS")
                    ? "text-green-600"
                    : "text-blue-600"
                }`}
              >
                {event.type}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {new Date(
                  event.created_at || event.createdAt
                ).toLocaleString()}
              </span>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {event.message}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              User: {event.user_id || event.userId || "N/A"}, Session:{" "}
              {event.session_id || event.sessionId || "N/A"}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              IP: {event.ip_address || "N/A"} &bull; ISP: {event.isp || "N/A"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
