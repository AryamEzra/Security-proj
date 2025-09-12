import { getTopCountries } from "../utils/geoUtils";

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

interface StatisticsPanelProps {
  geoEvents: GeoEvent[];
  countryCounts: Record<string, number>;
}

export function StatisticsPanel({ geoEvents, countryCounts }: StatisticsPanelProps) {
  const topCountries = getTopCountries(countryCounts, 8);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {geoEvents.length}
          </div>
          <div className="text-sm text-blue-600 dark:text-blue-300">Total Logins</div>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {Object.keys(countryCounts).length}
          </div>
          <div className="text-sm text-green-600 dark:text-green-300">Countries</div>
        </div>
      </div>

      {/* Top Countries */}
      <div>
        <h4 className="font-medium text-gray-900 dark:text-white mb-3">Top Countries</h4>
        <div className="space-y-2">
          {topCountries.map(([countryCode, count]) => {
            const countryName = geoEvents.find(e => e.countryCode === countryCode)?.countryName || countryCode;
            const percentage = ((count / geoEvents.length) * 100).toFixed(1);

            return (
              <div key={countryCode} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {countryName}
                </span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    {count}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    ({percentage}%)
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div>
        <h4 className="font-medium text-gray-900 dark:text-white mb-2">Activity Level</h4>
        <div className="space-y-1 text-xs">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-500 mr-2 rounded"></div>
            <span className="text-gray-700 dark:text-gray-300">High (&gt;10 logins)</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-amber-500 mr-2 rounded"></div>
            <span className="text-gray-700 dark:text-gray-300">Medium (5-10 logins)</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 mr-2 rounded"></div>
            <span className="text-gray-700 dark:text-gray-300">Low (2-5 logins)</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-500 mr-2 rounded"></div>
            <span className="text-gray-700 dark:text-gray-300">Very Low (1-2 logins)</span>
          </div>
        </div>
      </div>

      {/* Recent International Activity */}
      {geoEvents.filter(e => e.countryCode !== 'ET').length > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
          <div className="flex items-center">
            <span className="text-yellow-600 dark:text-yellow-400">⚠️</span>
            <div className="ml-2">
              <div className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                International Activity Detected
              </div>
              <div className="text-xs text-yellow-700 dark:text-yellow-300">
                {geoEvents.filter(e => e.countryCode !== 'ET').length} logins from {Object.keys(countryCounts).filter(c => c !== 'ET').length} countries
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}