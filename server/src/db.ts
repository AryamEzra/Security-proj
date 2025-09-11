import { Database } from 'bun:sqlite';
import { sha256 } from './crypto';
import type { User, SessionFamily, Session, Event } from './types';
import { hashPassword, verifyPassword } from './password';

export const db = new Database('data.db');

// Simplified schema creation
db.exec(`
  -- Ensure users table has email column
  PRAGMA table_info(users);
  
  -- If email column doesn't exist, alter table
  CREATE TEMPORARY TABLE IF NOT EXISTS temp_check (email TEXT);
  DROP TABLE IF EXISTS temp_check;

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
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
    ip_address TEXT,
    country_code TEXT,
    country_name TEXT,
    city TEXT,
    isp TEXT,  // Ensure this column exists
    latitude REAL,
    longitude REAL,
    created_at TEXT NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(session_id) REFERENCES sessions(id)
  );

`);

export function nowISO() { return new Date().toISOString(); }

export async function seedUser() {
  // Check if user exists
  const user = db
    .query('SELECT id, username, password_hash as passwordHash, created_at as createdAt FROM users WHERE username=?')
    .get('alice') as any;
  
  if (!user) {
    // Create new user
    const hash = await hashPassword('Password123!');
    db.query('INSERT INTO users (username, email, password_hash, created_at) VALUES (?,?,?,?)')
      .run('alice', 'alice@example.com', hash, nowISO());
    console.log('User "alice" created');
  } else {
    // Verify and rehash if needed
    try {
      const isValid = await verifyPassword('Password123!', user.passwordHash);
      
      if (!isValid) {
        console.log('Rehashing password...');
        const newHash = await hashPassword('Password123!');
        db.query('UPDATE users SET password_hash = ? WHERE username = ?')
          .run(newHash, 'alice');
        console.log('Password rehashed');
      }
    } catch (error) {
      console.log('Rehashing password due to algorithm change...');
      const newHash = await hashPassword('Password123!');
      db.query('UPDATE users SET password_hash = ? WHERE username = ?')
        .run(newHash, 'alice');
      console.log('Password rehashed with current algorithm');
    }
  }
}

// export function insertEvent(type: string, userId: number | null, sessionId: number | null, message: string) {
//   db.query('INSERT INTO events (type, user_id, session_id, message, created_at) VALUES (?,?,?,?,?)')
//     .run(type, userId, sessionId, message, nowISO());
// }

export function insertEvent(
  type: string, 
  userId: number | null, 
  sessionId: number | null, 
  message: string,
  ip?: string,
  countryCode?: string,
  countryName?: string,
  city?: string,
  isp?: string,  // Add ISP parameter
  latitude?: number,
  longitude?: number,
) {
  db.query(
    'INSERT INTO events (type, user_id, session_id, message, ip_address, country_code, country_name, city, isp, latitude, longitude, created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)'
  ).run(
    type,
    userId,
    sessionId,
    message,
    ip ?? null,
    countryCode ?? null,
    countryName ?? null,
    city ?? null,
    isp ?? null,  // Add ISP here
    latitude ?? null,
    longitude ?? null,
    nowISO()
  );
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
  try {
    console.log("Updating session refresh - Session ID:", sessionId);
    
    const result = db.query(
      'UPDATE sessions SET refresh_lookup_hash=?, refresh_hash=?, refresh_expires_at=? WHERE id=?'
    ).run(lookupHash, refreshHash, refreshExpiresAtISO, sessionId);
    
    console.log("Update result:", result);
    
  } catch (error) {
    console.error("Error updating session refresh:", error);
    throw error;
  }
}

export function revokeSession(sessionId: number) {
  db.query('UPDATE sessions SET revoked_at=? WHERE id=? AND revoked_at IS NULL').run(nowISO(), sessionId);
}

export function findUserByUsername(username: string) {
  return db.query('SELECT id, username, password_hash as passwordHash, created_at as createdAt FROM users WHERE username=?')
    .get(username) as User | undefined;
}

export function findSessionByRefreshLookup(lookupHash: string) {
  console.log("Looking for session with hash:", lookupHash);
  
  const session = db.query(`
    SELECT 
      id, 
      family_id as familyId, 
      user_id as userId, 
      access_jti as accessJti, 
      access_expires_at as accessExpiresAt, 
      refresh_lookup_hash as refreshLookupHash, 
      refresh_hash as refreshHash, 
      refresh_expires_at as refreshExpiresAt, 
      user_agent_hash as userAgentHash, 
      ip_hash as ipHash, 
      created_at as createdAt, 
      revoked_at as revokedAt 
    FROM sessions 
    WHERE refresh_lookup_hash = ?
  `).get(lookupHash) as Session | undefined;
  
  console.log("Session found:", session ? session.id : 'None');
  return session;
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
