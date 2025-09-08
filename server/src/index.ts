
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { getActiveSessionsForUser, createFamily, createSession, findUserByUsername, findSessionByRefreshLookup, getEvents, insertEvent, markFamilyCompromised, revokeFamily, updateSessionRefresh, revokeSession, seedUser, hashUserAgentIP, db } from './db';
import { generateRefreshToken, signAccessToken, verifyRefreshToken, sha256, verifyAccessToken } from './crypto';
import { rateLimit } from './rateLimit';

const app = new Hono();

app.use('*', cors({ origin: '*', allowHeaders: ['Content-Type', 'Authorization'] }));

// Simple JSON parser
async function readJson(req: Request) {
  try {
    return await req.json();
  } catch {
    return {};
  }
}

function getClientHints(req: Request) {
  const ua = req.headers.get('user-agent');
  const ip = (req.headers.get('x-forwarded-for') ?? '').split(',')[0] || '127.0.0.1';
  return { ua, ip };
}

const loginLimiter = rateLimit({ capacity: 10, refillPerSec: 0.2 }); // max 10 bursts, 1 every 5s

app.get('/', (c) => c.json({ ok: true, message: 'Session Security Hardener API' }));

// Replace your existing /login route with this block
app.post('/login', async (c) => {
  try {
    // Rate-limit by client IP
    const key = getClientHints(c.req.raw).ip;
    if (!loginLimiter(key)) {
      insertEvent('LOGIN_FAILED', null, null, 'Rate limited');
      return c.json({ error: 'Too many attempts' }, 429);
    }

    // Read body safely
    const body = await readJson(c.req.raw);
    const { username, password } = body;
    if (!username || !password) {
      return c.json({ error: 'Missing credentials' }, 400);
    }

    // Find user in DB
    const user = findUserByUsername(username);
    if (!user) {
      insertEvent('LOGIN_FAILED', null, null, `Unknown user ${username}`);
      return c.json({ error: 'Invalid credentials' }, 401);
    }

    // Verify password
    const ok = await Bun.password.verify(password, user.passwordHash);
    if (!ok) {
      insertEvent('LOGIN_FAILED', user.id, null, 'Bad password');
      return c.json({ error: 'Invalid credentials' }, 401);
    }

    // Create or reuse session family for the user
    // For demo we create a new family per login (real systems may reuse device families)
    const familyId = createFamily(user.id);

    // TTLs
    const accessTTL = 60 * 5; // 5 minutes
    const refreshTTL = 60 * 60 * 24 * 7; // 7 days

    // Sign access token
    const { token: accessToken, jti } = await signAccessToken({ sub: String(user.id), username }, accessTTL);

    // Generate refresh token bundle (raw token, lookupHash, atRestHash)
    const refresh = await generateRefreshToken();

    // Bind to UA + IP
    const { ua, ip } = getClientHints(c.req.raw);
    const bindHash = await hashUserAgentIP(ua, ip);

    // Compute ISO timestamps
    const accessExpISO = new Date(Date.now() + accessTTL * 1000).toISOString();
    const refreshExpISO = new Date(Date.now() + refreshTTL * 1000).toISOString();

    // Persist session using helper that sets created_at correctly
    const sessionId = createSession({
      familyId,
      userId: user.id,
      accessJti: jti,
      accessExpiresAtISO: accessExpISO,
      refreshLookupHash: refresh.lookupHash,
      refreshHash: refresh.atRestHash,
      refreshExpiresAtISO: refreshExpISO,
      userAgentHash: bindHash,
      ipHash: bindHash
    });

    insertEvent('LOGIN_SUCCESS', user.id, sessionId, `Session created (family ${familyId})`);

    return c.json({
      accessToken,
      accessExpiresAt: accessExpISO,
      refreshToken: refresh.token,
      refreshExpiresAt: refreshExpISO,
      familyId,
      sessionId,
      user: { id: user.id, username: user.username }
    });
  } catch (err: any) {
    console.error("Login error:", err);
    // Return a sanitized message but log the real error server-side
    return c.json({ error: 'Internal server error', detail: err?.message ?? String(err) }, 500);
  }
});


app.post('/refresh', async (c) => {
  const body = await readJson(c.req.raw);
  const { refreshToken } = body;
  if (!refreshToken) return c.json({ error: 'Missing refreshToken' }, 400);

  const lookup = await sha256(refreshToken);
  const session = findSessionByRefreshLookup(lookup);
  if (!session || session.revokedAt) {
    insertEvent('TOKEN_REUSE_DETECTED', null, null, 'Unknown or revoked refresh token used');
    return c.json({ error: 'Invalid refresh token' }, 401);
  }

  // Verify the refresh token cryptographically
  const valid = await verifyRefreshToken(refreshToken, session.refreshHash);
  if (!valid) {
    // hash matched but verification failed => database collision (unlikely) or tampering
    insertEvent('TOKEN_REUSE_DETECTED', session.userId, session.id, 'Refresh token hash matched, verify failed');
    return c.json({ error: 'Invalid refresh token' }, 401);
  }

  // Token binding check (simple UA+IP binding)
  const { ua, ip } = getClientHints(c.req.raw);
  const bindHash = await hashUserAgentIP(ua, ip);
  if (session.userAgentHash && session.userAgentHash !== bindHash) {
    // Token reuse from different device/network -> compromise!
    markFamilyCompromised(session.familyId);
    revokeFamily(session.familyId);
    insertEvent('TOKEN_REUSE_DETECTED', session.userId, session.id, 'Binding mismatch, family revoked');
    return c.json({ error: 'Token reuse detected. Family revoked.' }, 401);
  }

  // Rotate refresh token
  const accessTTL = 60 * 5;
  const refreshTTL = 60 * 60 * 24 * 7;
  const { token: accessToken, jti } = await signAccessToken({ sub: String(session.userId) }, accessTTL);
  const newRefresh = await generateRefreshToken();
  const accessExpISO = new Date(Date.now() + accessTTL * 1000).toISOString();
  const refreshExpISO = new Date(Date.now() + refreshTTL * 1000).toISOString();

  updateSessionRefresh(session.id, newRefresh.lookupHash, newRefresh.atRestHash, refreshExpISO);
  insertEvent('REFRESH', session.userId, session.id, 'Refresh token rotated');

  return c.json({
    accessToken,
    accessExpiresAt: accessExpISO,
    refreshToken: newRefresh.token,
    refreshExpiresAt: refreshExpISO,
    sessionId: session.id
  });
});

app.post('/revoke/session', async (c) => {
  const body = await readJson(c.req.raw);
  const { sessionId } = body;
  if (!sessionId) return c.json({ error: 'Missing sessionId' }, 400);
  revokeSession(sessionId);
  insertEvent('SESSION_REVOKED', null, sessionId, 'Revoked by admin');
  return c.json({ ok: true });
});

app.post('/revoke/family', async (c) => {
  const body = await readJson(c.req.raw);
  const { familyId } = body;
  if (!familyId) return c.json({ error: 'Missing familyId' }, 400);
  markFamilyCompromised(familyId);
  revokeFamily(familyId);
  insertEvent('FAMILY_REVOKED', null, null, `Family ${familyId} revoked by admin`);
  return c.json({ ok: true });
});

app.get('/sessions/:userId', (c) => {
  const userId = Number(c.req.param('userId'));
  const sessions = getActiveSessionsForUser(userId);
  return c.json(sessions);
});

app.get('/events', (c) => {
  const events = getEvents(200);
  return c.json(events);
});

app.post('/me', async (c) => {
  const body = await readJson(c.req.raw);
  const { accessToken } = body;
  if (!accessToken) return c.json({ error: 'Missing accessToken' }, 400);
  try {
    const { payload } = await verifyAccessToken(accessToken);
    return c.json({ ok: true, payload });
  } catch (e: any) {
    return c.json({ ok: false, error: e?.message ?? 'verify failed' }, 401);
  }
});

// List users (for admin dashboard)
app.get('/users', (c) => {
  // simple list of users (id, username, created_at)
  const rows = db.query('SELECT id, username, created_at FROM users ORDER BY id').all();
  return c.json(rows);
});

// Stats: counts of event types (failed logins, token reuse, refreshes etc)
app.get('/stats', (c) => {
  const rows = db.query('SELECT type, COUNT(*) as count FROM events GROUP BY type').all();
  const map: Record<string, number> = {};
  (rows as any[]).forEach(r => map[r.type] = r.count);
  return c.json(map);
});


const port = Number(process.env.PORT || 4000);

await seedUser();

export default {
  port,
  fetch: app.fetch,
};
