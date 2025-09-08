
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
  refreshLookupHash: string; // sha256(token) for lookup
  refreshHash: string;       // argon2id hash for at-rest secrecy
  refreshExpiresAt: string;
  userAgentHash: string | null;
  ipHash: string | null;
  createdAt: string;
  revokedAt: string | null;
};

export type Event = {
  id: number;
  type: 'LOGIN_SUCCESS' | 'LOGIN_FAILED' | 'REFRESH' | 'TOKEN_REUSE_DETECTED' | 'FAMILY_REVOKED' | 'SESSION_REVOKED';
  userId: number | null;
  sessionId: number | null;
  message: string;
  createdAt: string;
};
