interface GeoEvent {
  id: number;
  ip: string;
  countryCode: string;
  countryName: string;
  city: string;
  isp: string;
  timestamp: string;
  username: string;
  type: string;
  latitude?: number;
  longitude?: number;
}

interface GeoTableProps {
  geoEvents: GeoEvent[];
}
"use client";

export function GeoTable({ geoEvents }: GeoTableProps) {
  return (
    <div className="mt-6">
      <h4 className="font-medium text-gray-900 dark:text-white mb-3">Recent Login Activity</h4>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
          <thead className="text-xs uppercase bg-neutral-100 dark:bg-neutral-900 text-gray-700 dark:text-neutral-400">
            <tr>
              <th className="px-4 py-2">Time</th>
              <th className="px-4 py-2">User</th>
              <th className="px-4 py-2">Country</th>
              <th className="px-4 py-2">City</th>
              <th className="px-4 py-2">ISP</th>
              <th className="px-4 py-2">IP</th>
            </tr>
          </thead>
          <tbody>
            {geoEvents.slice(0, 5).map((event) => (
              <tr key={event.id} className="border-b dark:border-gray-700">
                <td className="px-4 py-2 text-gray-900 dark:text-gray-300">{new Date(event.timestamp).toLocaleTimeString()}</td>
                <td className="px-4 py-2 font-medium text-gray-900 dark:text-white">{event.username}</td>
                <td className="px-4 py-2">
                  <span className={`px-2 py-1 rounded text-xs ${
                    event.countryCode !== 'ET'
                      ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  }`}>
                    {event.countryCode} - {event.countryName}
                  </span>
                </td>
                <td className="px-4 py-2 text-gray-900 dark:text-gray-300">{event.city}</td>
                <td className="px-4 py-2 text-gray-900 dark:text-gray-300">{event.isp}</td>
                <td className="px-4 py-2 font-mono text-xs text-gray-900 dark:text-gray-300">{event.ip}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}