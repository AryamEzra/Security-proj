"use client";
import { useGeoData } from "./hooks/useGeoData";
import { MapVisualization } from "./GeoMap/MapVisualization";
import { GeoTable } from "./GeoMap/GeoTable";
import { LoadingSkeleton } from "./GeoMap/LoadingSkeleton";
import { StatisticsPanel } from "./GeoMap/StatisticsPanel";

interface GeoMapProps {
  events?: any[];
  users?: any[];
}

export default function GeoMap({ events = [], users = [] }: GeoMapProps) {
  const { geoEvents, countryCounts, loading } = useGeoData(events, users);

  if (loading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
        🌍 Login Geographic Distribution
      </h3>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* World Map */}
        <div>
          <MapVisualization
            geoEvents={geoEvents}
            countryCounts={countryCounts}
          />
        </div>

        {/* Statistics Panel */}
        <StatisticsPanel
          geoEvents={geoEvents}
          countryCounts={countryCounts}
        />
      </div>

      {/* Detailed Geo Table */}
      <GeoTable geoEvents={geoEvents} />
    </div>
  );
}