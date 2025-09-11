import maxmind, { CityResponse, Reader } from 'maxmind';
import path from 'path';
import { GeoLocationData } from './types';

let reader: Reader<CityResponse> | null = null;

// Initialize the GeoIP reader
export async function initGeoIP() {
  try {
    const dbPath = path.join(process.cwd(), 'GeoLite2-City.mmdb');
    reader = await maxmind.open<CityResponse>(dbPath);
    console.log('GeoIP database loaded successfully');
  } catch (error) {
    console.error('Failed to load GeoIP database:', error);
    throw error;
  }
}

export async function getGeoLocation(ip: string): Promise<GeoLocationData> {
  // Handle private IPs
  if (isPrivateIP(ip)) {
    return {
      ip,
      country: 'Local Network',
      country_code: 'LN',
      city: 'Local',
      region: 'Local',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      org: 'Private Network',
      asn: 'AS0000',
      latitude: null,
      longitude: null
    };
  }

  if (!reader) {
    throw new Error('GeoIP database not initialized');
  }

  try {
    const data = reader.get(ip);
    
    if (!data) {
      return getFallbackGeoData(ip);
    }

    return {
      ip,
      country: data.country?.names?.en || 'Unknown',
      country_code: data.country?.iso_code || 'XX',
      city: data.city?.names?.en || 'Unknown',
      region: data.subdivisions?.[0]?.names?.en || 'Unknown',
      timezone: data.location?.time_zone || 'UTC',
      org: data.traits?.isp || data.traits?.organization || 'Unknown',
      asn: data.traits?.autonomous_system_number ? 
           `AS${data.traits.autonomous_system_number}` : 'AS0000',
      latitude: data.location?.latitude || null,
      longitude: data.location?.longitude || null
    };
  } catch (error) {
    console.warn('Local geolocation failed:', error);
    return getFallbackGeoData(ip);
  }
}

function getFallbackGeoData(ip: string): GeoLocationData {
  return {
    ip,
    country: 'Unknown',
    country_code: 'XX',
    city: 'Unknown',
    region: 'Unknown',
    timezone: 'UTC',
    org: 'Unknown',
    asn: 'AS0000',
    latitude: null,
    longitude: null
  };
}


function isPrivateIP(ip: string): boolean {
  return ip === '127.0.0.1' || 
         ip === 'localhost' ||
         ip.startsWith('192.168.') ||
         ip.startsWith('10.0.') ||
         ip.startsWith('172.16.') ||
         ip.startsWith('172.17.') ||
         ip.startsWith('172.18.') ||
         ip.startsWith('172.19.') ||
         ip.startsWith('172.20.') ||
         ip.startsWith('172.21.') ||
         ip.startsWith('172.22.') ||
         ip.startsWith('172.23.') ||
         ip.startsWith('172.24.') ||
         ip.startsWith('172.25.') ||
         ip.startsWith('172.26.') ||
         ip.startsWith('172.27.') ||
         ip.startsWith('172.28.') ||
         ip.startsWith('172.29.') ||
         ip.startsWith('172.30.') ||
         ip.startsWith('172.31.');
}