
import { Database } from 'bun:sqlite';
import { sha256 } from './crypto';
import type { User, SessionFamily, Session, Event } from './types';
import { hashPassword, verifyPassword } from './password';

export const db = new Database('data.db');

db.exec(`
PRAGMA journal_mode = WAL;
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS session_families (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  compromised_at TEXT,
  FOREIGN KEY(user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  family_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  access_jti TEXT NOT NULL,
  access_expires_at TEXT NOT NULL,
  refresh_lookup_hash TEXT NOT NULL UNIQUE,
  refresh_hash TEXT NOT NULL,
  refresh_expires_at TEXT NOT NULL,
  user_agent_hash TEXT,
  ip_hash TEXT,
  created_at TEXT NOT NULL,
  revoked_at TEXT,
  FOREIGN KEY(family_id) REFERENCES session_families(id),
  FOREIGN KEY(user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  user_id INTEGER,
  session_id INTEGER,
  message TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY(user_id) REFERENCES users(id),
  FOREIGN KEY(session_id) REFERENCES sessions(id)
);
`);

export function nowISO() { return new Date().toISOString(); }

export async function seedUser() {
  // First, check if user exists and needs rehashing
  const user = db
    .query('SELECT id, username, password_hash as passwordHash, created_at as createdAt FROM users WHERE username=?')
    .get('alice') as any;
  
  if (!user) {
    // Create new user with current algorithm
    const hash = await hashPassword('Password123!');
    db.query('INSERT INTO users (username, password_hash, created_at) VALUES (?,?,?)')
      .run('alice', hash, nowISO());
    console.log('User "alice" created with new password hash');
  } else {
    // Check if password needs rehashing (old algorithm)
    try {
      // Try to verify with current algorithm
      const isValid = await verifyPassword('Password123!', user.passwordHash);
      
      if (!isValid) {
        console.log('Password verification failed - rehashing password...');
        // Rehash with current algorithm
        const newHash = await hashPassword('Password123!');
        db.query('UPDATE users SET password_hash = ? WHERE username = ?')
          .run(newHash, 'alice');
        console.log('Password rehashed with current algorithm');
      } else {
        console.log('Password is already using current algorithm');
      }
    } catch (error) {
      // If verification throws UnsupportedAlgorithm, rehash
      console.log('Unsupported algorithm detected - rehashing password...');
      const newHash = await hashPassword('Password123!');
      db.query('UPDATE users SET password_hash = ? WHERE username = ?')
        .run(newHash, 'alice');
      console.log('Password rehashed with current algorithm');
    }
  }
}

export function insertEvent(type: string, userId: number | null, sessionId: number | null, message: string) {
  db.query('INSERT INTO events (type, user_id, session_id, message, created_at) VALUES (?,?,?,?,?)')
    .run(type, userId, sessionId, message, nowISO());
}

export function createFamily(userId: number): number {
  const stmt = db.query('INSERT INTO session_families (user_id, created_at) VALUES (?,?)');
  stmt.run(userId, nowISO());
  const id = db.query('SELECT last_insert_rowid() as id').get() as any;
  return id.id as number;
}

export function markFamilyCompromised(familyId: number) {
  db.query('UPDATE session_families SET compromised_at=? WHERE id=?').run(nowISO(), familyId);
}

export function revokeFamily(familyId: number) {
  db.query('UPDATE sessions SET revoked_at=? WHERE family_id=? AND revoked_at IS NULL').run(nowISO(), familyId);
}

export function createSession(params: {
  familyId: number;
  userId: number;
  accessJti: string;
  accessExpiresAtISO: string;
  refreshLookupHash: string;
  refreshHash: string;
  refreshExpiresAtISO: string;
  userAgentHash: string | null;
  ipHash: string | null;
}) {
  db.query(`INSERT INTO sessions 
    (family_id, user_id, access_jti, access_expires_at, refresh_lookup_hash, refresh_hash, refresh_expires_at, user_agent_hash, ip_hash, created_at) 
    VALUES (?,?,?,?,?,?,?,?,?,?)`)
    .run(
      params.familyId, params.userId, params.accessJti, params.accessExpiresAtISO,
      params.refreshLookupHash, params.refreshHash, params.refreshExpiresAtISO,
      params.userAgentHash, params.ipHash, nowISO()
    );
  const id = db.query('SELECT last_insert_rowid() as id').get() as any;
  return id.id as number;
}

export function updateSessionRefresh(sessionId: number, lookupHash: string, refreshHash: string, refreshExpiresAtISO: string) {
  db.query('UPDATE sessions SET refresh_lookup_hash=?, refresh_hash=?, refresh_expires_at=? WHERE id=?')
    .run(lookupHash, refreshHash, refreshExpiresAtISO, sessionId);
}

export function revokeSession(sessionId: number) {
  db.query('UPDATE sessions SET revoked_at=? WHERE id=? AND revoked_at IS NULL').run(nowISO(), sessionId);
}

export function findUserByUsername(username: string) {
  return db.query('SELECT id, username, password_hash as passwordHash, created_at as createdAt FROM users WHERE username=?')
    .get(username) as User | undefined;
}

export function findSessionByRefreshLookup(lookupHash: string) {
  return db.query('SELECT * FROM sessions WHERE refresh_lookup_hash=?').get(lookupHash) as Session | undefined;
}

export function getFamilySessions(familyId: number) {
  return db.query('SELECT * FROM sessions WHERE family_id=? ORDER BY created_at DESC').all(familyId) as Session[];
}

export function getEvents(limit=200) {
  return db.query('SELECT * FROM events ORDER BY id DESC LIMIT ?').all(limit) as Event[];
}

export function getActiveSessionsForUser(userId: number) {
  return db.query('SELECT * FROM sessions WHERE user_id=? AND revoked_at IS NULL ORDER BY created_at DESC').all(userId) as Session[];
}

export async function hashUserAgentIP(ua: string | null, ip: string | null) {
  const u = ua ?? '';
  const i = ip ?? '';
  const combo = u + '|' + i;
  const h = await sha256(combo);
  return h;
}
