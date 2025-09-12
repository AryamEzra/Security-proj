"use client";
import { useEffect, useState } from "react";

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

interface UseGeoDataReturn {
  geoEvents: GeoEvent[];
  countryCounts: Record<string, number>;
  loading: boolean;
}

export function useGeoData(events: any[] = []): UseGeoDataReturn {
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

  return { geoEvents, countryCounts, loading };
}