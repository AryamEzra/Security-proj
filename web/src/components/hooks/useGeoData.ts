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
  failedCount?: number;
}

interface UseGeoDataReturn {
  geoEvents: GeoEvent[];
  countryCounts: Record<string, number>;
  loading: boolean;
}

export function useGeoData(events: any[] = [], users: any[] = []): UseGeoDataReturn {
  const [geoEvents, setGeoEvents] = useState<GeoEvent[]>([]);
  const [countryCounts, setCountryCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const processEvents = () => {
      setLoading(true);

      // Filter and process events with ACTUAL coordinates
      // Build a quick user id -> username map
      const usersMap: Record<string | number, string> = {};
      for (const u of users) {
        if (u?.id != null) usersMap[u.id] = u.username ?? `${u.id}`;
      }

      const rawGeo = events.filter(event => event.type === 'LOGIN_SUCCESS' || event.type === 'LOGIN_FAILED');

      // Compute failed attempts per IP
      const failedPerIp: Record<string, number> = {};
      rawGeo.forEach(e => {
        const ip = e.ip_address || e.ip || '';
        const isFailed = /FAILED|LOGIN_FAILED|LOGIN_FAILED/i.test(e.type || '');
        if (ip && isFailed) failedPerIp[ip] = (failedPerIp[ip] || 0) + 1;
      });

      const geoEventsData: GeoEvent[] = rawGeo
        .map(event => {
          const ip = event.ip_address || event.ip || '';
          const userId = event.user_id ?? event.userId ?? event.user?.id;
          const username = event.user?.username ?? (userId != null ? (usersMap[userId] ?? `User ${userId}`) : 'Unknown');

          return {
            id: event.id,
            ip,
            countryCode: event.country_code || 'XX',
            countryName: event.country_name || event.country || 'Unknown',
            city: event.city || 'Unknown',
            isp: event.isp || 'Unknown',
            timestamp: event.created_at || event.createdAt,
            username,
            type: event.type,
            latitude: event.latitude ?? null,  // Use actual latitude
            longitude: event.longitude ?? null, // Use actual longitude
            failedCount: failedPerIp[ip] || 0
          } as GeoEvent & { failedCount: number };
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
  }, [events, users]);

  return { geoEvents, countryCounts, loading };
}