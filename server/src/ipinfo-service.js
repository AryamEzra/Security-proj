const IPINFO_BASE_URL = 'https://ipinfo.io';
const IPINFO_API_KEY = process.env.IPINFO_API_KEY || 'e84483c7e399ca';
// Cache to avoid redundant API calls
const geoCache = new Map();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour cache
// Map of country codes to full country names
const countryCodeToName = {
    'NL': 'Netherlands',
    'PL': 'Poland',
    'SG': 'Singapore',
    'US': 'United States',
    'JP': 'Japan',
    'RO': 'Romania',
    'ET': 'Ethiopia',
    'GB': 'United Kingdom',
    'CA': 'Canada',
    'DE': 'Germany',
    'FR': 'France',
    'CN': 'China',
    'IN': 'India',
    'BR': 'Brazil',
    'RU': 'Russia',
    'AU': 'Australia',
    'ZA': 'South Africa',
    'NG': 'Nigeria',
    'KE': 'Kenya',
    'EG': 'Egypt',
};
export async function getGeoLocation(ip) {
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
            longitude: null,
            cachedAt: Date.now()
        };
    }
    // Check cache first (with TTL)
    const cached = geoCache.get(ip);
    if (cached && (Date.now() - cached.cachedAt) < CACHE_TTL) {
        return cached;
    }
    try {
        const url = `${IPINFO_BASE_URL}/${ip}/json?token=${IPINFO_API_KEY}`;
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'SessionSecurityApp/1.0'
            }
        });
        if (!response.ok) {
            throw new Error(`ipinfo.io responded with status ${response.status}`);
        }
        const data = await response.json();
        // Get full country name from mapping or use country code as fallback
        const countryCode = data.country || 'XX';
        const countryName = countryCodeToName[countryCode] || countryCode;
        // Parse the ASN information if available
        let asn = 'AS0000';
        let isp = data.org || 'Unknown ISP';
        if (data.org && data.org.startsWith('AS')) {
            asn = data.org.split(' ')[0];
            isp = data.org.split(' ').slice(1).join(' ') || isp;
        }
        // Parse coordinates from loc string (format: "latitude,longitude")
        let latitude = null;
        let longitude = null;
        if (data.loc) {
            const [lat, lon] = data.loc.split(',').map((coord) => parseFloat(coord.trim()));
            if (!isNaN(lat) && !isNaN(lon)) {
                latitude = lat;
                longitude = lon;
            }
        }
        const geoData = {
            ip: data.ip || ip,
            country: countryName, // Use full country name here
            country_code: countryCode, // Keep the 2-letter code separate
            city: data.city || 'Unknown',
            region: data.region || 'Unknown',
            timezone: data.timezone || 'UTC',
            org: data.org || 'Unknown',
            isp: isp,
            asn: asn,
            latitude: latitude,
            longitude: longitude,
            cachedAt: Date.now()
        };
        // Cache the result
        geoCache.set(ip, geoData);
        return geoData;
    }
    catch (error) {
        console.warn('ipinfo.io API failed:', error);
        return getFallbackGeoData(ip);
    }
}
function getFallbackGeoData(ip) {
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
        longitude: null,
        cachedAt: 0,
    };
}
function isPrivateIP(ip) {
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
