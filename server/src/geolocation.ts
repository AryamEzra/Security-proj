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
      country: 'Local Network',
      country_code: 'LN',
      city: 'Local',
      region: 'Local',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      org: 'Private Network',
      asn: 'AS0000'
    };
  }

  // Check cache first
  if (geoCache.has(ip)) {
    return geoCache.get(ip)!;
  }

  try {
    // Use a more reliable geolocation service with better free tier
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,message,country,countryCode,city,region,timezone,org,as,query`);
    
    if (!response.ok) {
      throw new Error(`Geolocation API responded with status ${response.status}`);
    }

    const data = await response.json();
    
    if (data.status === 'fail') {
      throw new Error(data.message);
    }

    const geoData: GeoLocationData = {
      ip: data.query || ip,
      country: data.country || 'Unknown',
      country_code: data.countryCode || 'XX',
      city: data.city || 'Unknown',
      region: data.region || 'Unknown',
      timezone: data.timezone || 'UTC',
      org: data.org || 'Unknown',
      asn: data.as || 'AS0000'
    };

    // Cache the result
    geoCache.set(ip, geoData);
    
    return geoData;
  } catch (error) {
    console.warn('Geolocation API failed, using fallback data:', error);
    
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