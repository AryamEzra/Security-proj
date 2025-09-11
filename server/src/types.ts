export type User = {
  id: number;
  username: string;
  passwordHash: string;
  createdAt: string;
};

export type SessionFamily = {
  id: number;
  userId: number;
  createdAt: string;
  compromisedAt: string | null;
};

export type Session = {
  id: number;
  familyId: number;
  userId: number;
  accessJti: string;
  accessExpiresAt: string;
  refreshLookupHash: string;
  refreshHash: string;  // This was missing!
  refreshExpiresAt: string;
  userAgentHash: string | null;
  ipHash: string | null;
  createdAt: string;
  revokedAt: string | null;
};

export type Event = {
  id: number;
  type: 'LOGIN_SUCCESS' | 'LOGIN_FAILED' | 'REFRESH' | 'TOKEN_REUSE_DETECTED' | 'FAMILY_REVOKED' | 'SESSION_REVOKED' | 'USER_SIGNUP';
  userId: number | null;
  sessionId: number | null;
  message: string;
  createdAt: string;
  ipAddress: string | null;
  countryCode: string | null;
  countryName: string | null;
  city: string | null;
  isp: string | null;
  latitude: number | null;
  longitude: number | null;
};

export interface GeoLocationData {
  ip: string;
  country: string;
  country_code: string;
  city: string;
  region: string;
  timezone: string;
  org: string;
  asn: string;
  latitude: number | null;
  longitude: number | null;
}
