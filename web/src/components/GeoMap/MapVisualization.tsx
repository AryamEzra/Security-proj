"use client";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  ZoomableGroup
} from "react-simple-maps";
import { getColorForCount } from "../utils/geoUtils";
import { useTheme } from "../ThemeProvider";

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

interface MapVisualizationProps {
  geoEvents: GeoEvent[];
  countryCounts: Record<string, number>;
}

export function MapVisualization({ geoEvents, countryCounts }: MapVisualizationProps) {
  const { theme } = useTheme(); // Get current theme

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800 h-96">
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
                    fill={count > 0 ? getColorForCount(count, theme) : theme === 'dark' ? '#374151' : '#e5e7eb'}
                    stroke={theme === 'dark' ? '#4B5563' : '#fff'}
                    strokeWidth={0.5}
                    style={{
                      default: { outline: "none" },
                      hover: { outline: "none", fill: getColorForCount(1, theme) },
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
                fill={event.type === 'LOGIN_SUCCESS' ? '#10b981' : '#ef4444'}
                stroke="#fff"
                strokeWidth={1}
              />
              <text
                textAnchor="middle"
                y={-10}
                style={{
                  fontFamily: "system-ui",
                  fill: theme === 'dark' ? '#fff' : '#000',
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
  );
}