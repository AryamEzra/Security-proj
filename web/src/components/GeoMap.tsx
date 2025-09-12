"use client";
import { useEffect, useState } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  ZoomableGroup
} from "react-simple-maps";

// You'll need to download a world map GeoJSON file
const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

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

interface GeoMapProps {
  events?: any[];
  isDarkMode?: boolean;
}

// Simple country to coordinates mapping (for demo purposes)
const countryCoordinates: Record<string, [number, number]> = {
  ET: [9.145, 40.4897],   // Ethiopia
  US: [37.0902, -95.7129],// United States
};

export default function GeoMap({ events = [], isDarkMode = false }: GeoMapProps) {
  const [geoEvents, setGeoEvents] = useState<GeoEvent[]>([]);
  const [countryCounts, setCountryCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  const processEvents = () => {
    setLoading(true);
    
    // Filter and process events with ACTUAL coordinates
    const geoEventsData: GeoEvent[] = events
      .filter(event => event.type === 'LOGIN_SUCCESS' || event.type === 'LOGIN_FAILED')
      .map(event => {
        // Use ACTUAL coordinates from the database, not country centers
        return {
          id: event.id,
          ip: event.ip_address || event.ip,
          countryCode: event.country_code || 'XX',
          countryName: event.country_name || event.country || 'Unknown',
          city: event.city || 'Unknown',
          isp: event.isp || 'Unknown',
          timestamp: event.created_at || event.createdAt,
          username: event.user_id ? `User ${event.user_id}` : 'Unknown',
          type: event.type,
          latitude: event.latitude || null,  // Use actual latitude
          longitude: event.longitude || null // Use actual longitude
        };
      })
      .filter(event => event.latitude !== null && event.longitude !== null); // Only events with coordinates

    setGeoEvents(geoEventsData);

    // Count events by country
    const counts: Record<string, number> = {};
    geoEventsData.forEach(event => {
      counts[event.countryCode] = (counts[event.countryCode] || 0) + 1;
    });
    setCountryCounts(counts);
    setLoading(false);
  };

  processEvents();
}, [events]);

  const getColorForCount = (count: number) => {
    if (isDarkMode) {
      if (count > 10) return '#f87171';    // lighter red
      if (count > 5) return '#fbbf24';     // lighter amber
      if (count > 2) return '#34d399';     // lighter green
      return '#60a5fa';                    // lighter blue
    } else {
      if (count > 10) return '#ef4444';    // red
      if (count > 5) return '#f59e0b';     // amber
      if (count > 2) return '#10b981';     // green
      return '#3b82f6';                    // blue
    }
  };

  const topCountries = Object.entries(countryCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 8);

  if (loading) {
    return (
      <div className={
        isDarkMode
          ? "bg-gray-800 rounded-lg shadow p-6"
          : "bg-white rounded-lg shadow p-6"
      }>
        <div className="animate-pulse">
          <div className={
            isDarkMode
              ? "h-6 bg-gray-600 rounded w-1/3 mb-4"
              : "h-6 bg-gray-300 rounded w-1/3 mb-4"
          }></div>
          <div className={
            isDarkMode
              ? "h-64 bg-gray-600 rounded"
              : "h-64 bg-gray-300 rounded"
          }></div>
        </div>
      </div>
    );
  }

  return (
    <div className={
      isDarkMode
        ? "bg-gray-800 rounded-lg shadow p-6"
        : "bg-white rounded-lg shadow p-6"
    }>
      <h3 className={
        isDarkMode
          ? "text-lg font-semibold mb-4 text-white"
          : "text-lg font-semibold mb-4 text-gray-900"
      }>
        🌍 Login Geographic Distribution
      </h3>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* World Map */}
        <div>
          <div className={
            isDarkMode
              ? "border border-gray-700 rounded-lg p-4 bg-gray-700 h-96"
              : "border border-gray-200 rounded-lg p-4 bg-gray-50 h-96"
          }>
            <ComposableMap
              projection="geoMercator"
              projectionConfig={{
                scale: 100,
                center: [0, 20]
              }}
            >
              <ZoomableGroup zoom={1}>
                <Geographies geography={GEO_URL}>
                  {({ geographies }) =>
                    geographies.map((geo) => {
                      const countryCode = geo.properties.iso_a2;
                      const count = countryCounts[countryCode] || 0;
                      return (
                        <Geography
                          key={geo.rsmKey}
                          geography={geo}
                          fill={count > 0 ? getColorForCount(count) : (isDarkMode ? "#374151" : "#e5e7eb")}
                          stroke={isDarkMode ? "#222" : "#fff"}
                          strokeWidth={0.5}
                          style={{
                            default: { outline: "none" },
                            hover: { outline: "none", fill: isDarkMode ? "#60a5fa" : "#3b82f6" },
                            pressed: { outline: "none" },
                          }}
                        />
                      );
                    })
                  }
                </Geographies>
                {/* Markers for login events */}
                {geoEvents.map((event, index) => (
                  <Marker
                    key={`${event.id}-${index}`}
                    coordinates={[event.longitude!, event.latitude!]}
                  >
                    <circle
                      r={2 + Math.min(countryCounts[event.countryCode] || 1, 8)}
                      fill={event.type === 'LOGIN_SUCCESS'
                        ? (isDarkMode ? '#34d399' : '#10b981')
                        : (isDarkMode ? '#f87171' : '#ef4444')}
                      stroke={isDarkMode ? "#222" : "#fff"}
                      strokeWidth={1}
                    />
                    <text
                      textAnchor="middle"
                      y={-10}
                      style={{
                        fontFamily: "system-ui",
                        fill: isDarkMode ? "#fff" : "#000",
                        fontSize: "8px",
                        fontWeight: "bold",
                      }}
                    >
                      {countryCounts[event.countryCode]}
                    </text>
                  </Marker>
                ))}
              </ZoomableGroup>
            </ComposableMap>
          </div>
        </div>

        {/* Statistics Panel */}
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
                <span>High (&gt;10 logins)</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-amber-500 mr-2 rounded"></div>
                <span>Medium (5-10 logins)</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 mr-2 rounded"></div>
                <span>Low (2-5 logins)</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-500 mr-2 rounded"></div>
                <span>Very Low (1-2 logins)</span>
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
      </div>

      {/* Detailed Geo Table */}
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
                  <td className="px-4 py-2">{new Date(event.timestamp).toLocaleTimeString()}</td>
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
                  <td className="px-4 py-2">{event.city}</td>
                  <td className="px-4 py-2">{event.isp}</td>
                  <td className="px-4 py-2 font-mono text-xs">{event.ip}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}