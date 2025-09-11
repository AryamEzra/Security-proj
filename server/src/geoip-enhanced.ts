import maxmind, { CityResponse, AsnResponse, Reader } from 'maxmind';
import path from 'path';
import { GeoLocationData } from './types';

let cityReader: Reader<CityResponse> | null = null;
let asnReader: Reader<AsnResponse> | null = null;

// Initialize both GeoIP readers
export async function initGeoIP() {
  try {
    const cityDbPath = path.join(process.cwd(), 'GeoLite2-City.mmdb');
    const asnDbPath = path.join(process.cwd(), 'GeoLite2-ASN.mmdb');
    
    cityReader = await maxmind.open<CityResponse>(cityDbPath);
    asnReader = await maxmind.open<AsnResponse>(asnDbPath);
    
    console.log('Both GeoIP databases loaded successfully');
  } catch (error) {
    console.error('Failed to load GeoIP databases:', error);
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
      isp: 'Private Network',
      asn: 'AS0000',
      latitude: null,
      longitude: null
    };
  }

  if (!cityReader || !asnReader) {
    throw new Error('GeoIP databases not initialized');
  }

  try {
    // Get data from both databases
    const cityData = cityReader.get(ip);
    const asnData = asnReader.get(ip);
    
    if (!cityData && !asnData) {
      return getFallbackGeoData(ip);
    }

    // Extract ISP information from ASN database
    const isp = asnData?.autonomous_system_organization || 
                cityData?.traits?.isp || 
                cityData?.traits?.organization || 
                'Unknown ISP';

    const asn = asnData?.autonomous_system_number ? 
                `AS${asnData.autonomous_system_number}` : 
                (cityData?.traits?.autonomous_system_number ? 
                 `AS${cityData.traits.autonomous_system_number}` : 'AS0000');

    return {
      ip,
      country: cityData?.country?.names?.en || 'Unknown',
      country_code: cityData?.country?.iso_code || 'XX',
      city: cityData?.city?.names?.en || 'Unknown',
      region: cityData?.subdivisions?.[0]?.names?.en || 'Unknown',
      timezone: cityData?.location?.time_zone || 'UTC',
      org: cityData?.traits?.organization || 'Unknown',
      isp: isp,
      asn: asn,
      latitude: cityData?.location?.latitude || null,
      longitude: cityData?.location?.longitude || null
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
    isp: 'Unknown ISP',
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