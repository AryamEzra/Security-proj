// Free tier: 1000 requests/month, no API key needed for basic info
const IPAPI_BASE_URL = 'https://ipapi.co';

export interface GeoLocationData {
  ip: string;
  country: string;
  country_code: string;
  city: string;
  region: string;
  timezone: string;
  org: string;
  asn: string;
}

// Cache to avoid redundant API calls
const geoCache = new Map<string, GeoLocationData>();

export async function getGeoLocation(ip: string): Promise<GeoLocationData> {
  // Skip API calls for local/private IPs
  if (isPrivateIP(ip)) {
    return {
      ip,
      country: 'Ethiopia',
      country_code: 'ET',
      city: 'Local Network',
      region: 'Local',
      timezone: 'Africa/Addis_Ababa',
      org: 'Private Network',
      asn: 'AS0000'
    };
  }

  // Check cache first
  if (geoCache.has(ip)) {
    return geoCache.get(ip)!;
  }

  try {
    const response = await fetch(`${IPAPI_BASE_URL}/${ip}/json/`);
    
    if (!response.ok) {
      throw new Error(`IPAPI responded with status ${response.status}`);
    }

    const data = await response.json();
    
    const geoData: GeoLocationData = {
      ip: data.ip,
      country: data.country_name,
      country_code: data.country_code,
      city: data.city,
      region: data.region,
      timezone: data.timezone,
      org: data.org,
      asn: data.asn
    };

    // Cache the result
    geoCache.set(ip, geoData);
    
    return geoData;
  } catch (error) {
    console.error('Geolocation API error:', error);
    
    // Fallback data
    return {
      ip,
      country: 'Unknown',
      country_code: 'XX',
      city: 'Unknown',
      region: 'Unknown',
      timezone: 'UTC',
      org: 'Unknown',
      asn: 'AS0000'
    };
  }
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