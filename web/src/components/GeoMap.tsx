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
  AF: [33.9391, 67.7100], // Afghanistan
  AL: [41.1533, 20.1683], // Albania
  DZ: [28.0339, 1.6596],  // Algeria
  AO: [-11.2027, 17.8739],// Angola
  AR: [-38.4161, -63.6167],// Argentina
  AM: [40.0691, 45.0382], // Armenia
  AU: [-25.2744, 133.7751],// Australia
  AT: [47.5162, 14.5501], // Austria
  AZ: [40.1431, 47.5769], // Azerbaijan
  BH: [25.9304, 50.6378], // Bahrain
  BD: [23.6850, 90.3563], // Bangladesh
  BY: [53.7098, 27.9534], // Belarus
  BE: [50.5039, 4.4699],  // Belgium
  BJ: [9.3077, 2.3158],   // Benin
  BO: [-16.2902, -63.5887],// Bolivia
  BA: [43.9159, 17.6791], // Bosnia and Herzegovina
  BW: [-22.3285, 24.6849],// Botswana
  BR: [-14.235, -51.9253],// Brazil
  BG: [42.7339, 25.4858], // Bulgaria
  BF: [12.2383, -1.5616], // Burkina Faso
  BI: [-3.3731, 29.9189], // Burundi
  KH: [12.5657, 104.9910],// Cambodia
  CM: [7.3697, 12.3547],  // Cameroon
  CA: [56.1304, -106.3468],// Canada
  CV: [16.5388, -23.0418],// Cape Verde
  CF: [6.6111, 20.9394],  // Central African Republic
  TD: [15.4542, 18.7322], // Chad
  CL: [-35.6751, -71.5430],// Chile
  CN: [35.8617, 104.1954],// China
  CO: [4.5709, -74.2973], // Colombia
  KM: [-11.8750, 43.8722],// Comoros
  CG: [-0.2280, 15.8277], // Congo
  CD: [-4.0383, 21.7587], // DR Congo
  CR: [9.7489, -83.7534], // Costa Rica
  CI: [7.5399, -5.5471],  // Côte d'Ivoire
  HR: [45.1000, 15.2000], // Croatia
  CU: [21.5218, -77.7812],// Cuba
  CY: [35.1264, 33.4299], // Cyprus
  CZ: [49.8175, 15.4730], // Czechia
  DK: [56.2639, 9.5018],  // Denmark
  DJ: [11.8251, 42.5903], // Djibouti
  DO: [18.7357, -70.1627],// Dominican Republic
  EC: [-1.8312, -78.1834],// Ecuador
  EG: [26.8206, 30.8025], // Egypt
  SV: [13.7942, -88.8965],// El Salvador
  GQ: [1.6508, 10.2679],  // Equatorial Guinea
  ER: [15.1794, 39.7823], // Eritrea
  EE: [58.5953, 25.0136], // Estonia
  SZ: [-26.5225, 31.4659],// Eswatini
  ET: [9.145, 40.4897],   // Ethiopia
  FJ: [-17.7134, 178.0650],// Fiji
  FI: [61.9241, 25.7482], // Finland
  FR: [46.6034, 1.8883],  // France
  GA: [-0.8037, 11.6094], // Gabon
  GM: [13.4432, -15.3101],// Gambia
  GE: [42.3154, 43.3569], // Georgia
  DE: [51.1657, 10.4515], // Germany
  GH: [7.9465, -1.0232],  // Ghana
  GR: [39.0742, 21.8243], // Greece
  GT: [15.7835, -90.2308],// Guatemala
  GN: [9.9456, -9.6966],  // Guinea
  GW: [11.8037, -15.1804],// Guinea-Bissau
  GY: [4.8604, -58.9302], // Guyana
  HT: [18.9712, -72.2852],// Haiti
  HN: [15.2000, -86.2419],// Honduras
  HU: [47.1625, 19.5033], // Hungary
  IS: [64.9631, -19.0208],// Iceland
  IN: [20.5937, 78.9629], // India
  ID: [-0.7893, 113.9213],// Indonesia
  IR: [32.4279, 53.6880], // Iran
  IQ: [33.2232, 43.6793], // Iraq
  IE: [53.1424, -7.6921], // Ireland
  IL: [31.0461, 34.8516], // Israel
  IT: [41.8719, 12.5674], // Italy
  JM: [18.1096, -77.2975],// Jamaica
  JP: [36.2048, 138.2529],// Japan
  JO: [30.5852, 36.2384], // Jordan
  KZ: [48.0196, 66.9237], // Kazakhstan
  KE: [-1.2921, 36.8219], // Kenya
  KI: [1.8709, 157.3630], // Kiribati
  KR: [35.9078, 127.7669],// South Korea
  KW: [29.3117, 47.4818], // Kuwait
  KG: [41.2044, 74.7661], // Kyrgyzstan
  LA: [19.8563, 102.4955],// Laos
  LV: [56.8796, 24.6032], // Latvia
  LB: [33.8547, 35.8623], // Lebanon
  LS: [-29.6099, 28.2336],// Lesotho
  LR: [6.4281, -9.4295],  // Liberia
  LY: [26.3351, 17.2283], // Libya
  LI: [47.1660, 9.5554],  // Liechtenstein
  LT: [55.1694, 23.8813], // Lithuania
  LU: [49.8153, 6.1296],  // Luxembourg
  MG: [-18.7669, 46.8691],// Madagascar
  MW: [-13.2543, 34.3015],// Malawi
  MY: [4.2105, 101.9758], // Malaysia
  MV: [3.2028, 73.2207],  // Maldives
  ML: [17.5707, -3.9962], // Mali
  MT: [35.9375, 14.3754], // Malta
  MH: [7.1315, 171.1845], // Marshall Islands
  MR: [21.0079, -10.9408],// Mauritania
  MU: [-20.3484, 57.5522],// Mauritius
  MX: [23.6345, -102.5528],// Mexico
  FM: [7.4256, 150.5507], // Micronesia
  MD: [47.4116, 28.3699], // Moldova
  MC: [43.7384, 7.4246],  // Monaco
  MN: [46.8625, 103.8467],// Mongolia
  ME: [42.7087, 19.3744], // Montenegro
  MA: [31.7917, -7.0926], // Morocco
  MZ: [-18.6657, 35.5296],// Mozambique
  MM: [21.9162, 95.9560], // Myanmar
  NA: [-22.9576, 18.4904],// Namibia
  NR: [-0.5228, 166.9315],// Nauru
  NP: [28.3949, 84.1240], // Nepal
  NL: [52.1326, 5.2913],  // Netherlands
  NZ: [-40.9006, 174.8860],// New Zealand
  NI: [12.8654, -85.2072],// Nicaragua
  NE: [17.6078, 8.0817],  // Niger
  NG: [9.0820, 8.6753],   // Nigeria
  MK: [41.6086, 21.7453], // North Macedonia
  NO: [60.4720, 8.4689],  // Norway
  OM: [21.4735, 55.9754], // Oman
  PK: [30.3753, 69.3451], // Pakistan
  PW: [7.5150, 134.5825], // Palau
  PS: [31.9522, 35.2332], // Palestine
  PA: [8.5379, -80.7821], // Panama
  PG: [-6.314993, 143.95555], // Papua New Guinea
  PY: [-23.4425, -58.4438],// Paraguay
  PE: [-9.189967, -75.01515],// Peru
  PH: [12.8797, 121.7740],// Philippines
  PL: [51.9194, 19.1451], // Poland
  PT: [39.3999, -8.2245], // Portugal
  QA: [25.3548, 51.1839], // Qatar
  RO: [45.9432, 24.9668], // Romania
  RU: [61.5240, 105.3188],// Russia
  RW: [-1.9403, 29.8739], // Rwanda
  KN: [17.3578, -62.782998],// Saint Kitts and Nevis
  LC: [13.9094, -60.9789],// Saint Lucia
  VC: [12.9843, -61.2872],// Saint Vincent and the Grenadines
  WS: [-13.7590, -172.1046],// Samoa
  SM: [43.9424, 12.4578], // San Marino
  ST: [0.1864, 6.6131],   // Sao Tome and Principe
  SA: [23.8859, 45.0792], // Saudi Arabia
  SN: [14.4974, -14.4524],// Senegal
  RS: [44.0165, 21.0059], // Serbia
  SC: [-4.6796, 55.491977],// Seychelles
  SL: [8.4606, -11.7799], // Sierra Leone
  SG: [1.3521, 103.8198], // Singapore
  SK: [48.6690, 19.6990], // Slovakia
  SI: [46.1512, 14.9955], // Slovenia
  SB: [-9.6457, 160.1562],// Solomon Islands
  SO: [5.1521, 46.1996],  // Somalia
  ZA: [-30.5595, 22.9375],// South Africa
  ES: [40.4637, -3.7492], // Spain
  LK: [7.8731, 80.7718],  // Sri Lanka
  SD: [12.8628, 30.2176], // Sudan
  SR: [3.9193, -56.0278], // Suriname
  SE: [60.1282, 18.6435], // Sweden
  CH: [46.8182, 8.2275],  // Switzerland
  SY: [34.8021, 38.9968], // Syria
  TW: [23.6978, 120.9605],// Taiwan
  TJ: [38.8610, 71.2761], // Tajikistan
  TZ: [-6.3690, 34.8888], // Tanzania
  TH: [15.8700, 100.9925],// Thailand
  TL: [-8.8742, 125.7275],// Timor-Leste
  TG: [8.6195, 0.8248],   // Togo
  TO: [-21.1789, -175.1982],// Tonga
  TT: [10.6918, -61.2225],// Trinidad and Tobago
  TN: [33.8869, 9.5375],  // Tunisia
  TR: [38.9637, 35.2433], // Turkey
  TM: [38.9697, 59.5563], // Turkmenistan
  TV: [-7.1095, 177.6493],// Tuvalu
  UG: [1.3733, 32.2903],  // Uganda
  UA: [48.3794, 31.1656], // Ukraine
  AE: [23.4241, 53.8478], // United Arab Emirates
  GB: [55.3781, -3.4360], // United Kingdom
  US: [37.0902, -95.7129],// United States
  UY: [-32.5228, -55.7658],// Uruguay
  UZ: [41.3775, 64.5853], // Uzbekistan
  VU: [-15.3767, 166.9592],// Vanuatu
  VA: [41.9029, 12.4534], // Vatican City
  VE: [6.4238, -66.5897], // Venezuela
  VN: [14.0583, 108.2772],// Vietnam
  YE: [15.5527, 48.5164], // Yemen
  ZM: [-13.1339, 27.8493],// Zambia
  ZW: [-19.0154, 29.1549],// Zimbabwe
};

export default function GeoMap({ events = [], isDarkMode = false }: GeoMapProps) {
  const [geoEvents, setGeoEvents] = useState<GeoEvent[]>([]);
  const [countryCounts, setCountryCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const processEvents = () => {
      setLoading(true);
      
      const geoEventsData: GeoEvent[] = events
        .filter(event => event.type === 'LOGIN_SUCCESS' || event.type === 'LOGIN_FAILED')
        .map(event => {
          const countryCode = event.country_code || 'ET';
          const coordinates = countryCoordinates[countryCode] || [0, 0];
          
          return {
            id: event.id,
            ip: event.ip_address || '127.0.0.1',
            countryCode: countryCode,
            countryName: event.country_name || 'Ethiopia',
            city: event.city || 'Unknown',
            isp: event.isp || 'Unknown',
            timestamp: event.created_at || event.createdAt,
            username: event.message.includes('user') ? 
                     event.message.split('user')[1]?.split(' ')[0] || 'unknown' : 'unknown',
            type: event.type,
            latitude: coordinates[0],
            longitude: coordinates[1]
          };
        });

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
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
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