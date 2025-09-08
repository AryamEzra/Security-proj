import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { 
  getActiveSessionsForUser, createFamily, createSession, 
  findSessionByRefreshLookup, getEvents, 
  insertEvent, markFamilyCompromised, revokeFamily, updateSessionRefresh, 
  revokeSession, seedUser, hashUserAgentIP 
} from './db';
import { generateRefreshToken, verifyRefreshToken, sha256, signAccessToken, verifyAccessToken } from './crypto';
import { rateLimit } from './rateLimit';

const app = new Hono();

// Middleware
app.use('*', cors({ origin: '*', allowHeaders: ['Content-Type', 'Authorization'] }));

// Helpers
async function readJson(req: Request) {
  try {
    return await req.json();
  } catch {
    return {};
  }
}

function getClientInfo(req: Request) {
  const ua = req.headers.get('user-agent') || '';
  const ip = (req.headers.get('x-forwarded-for') ?? '').split(',')[0] || '127.0.0.1';
  return { ua, ip };
}

// Rate limiting
const loginLimiter = rateLimit({ capacity: 10, refillPerSec: 0.2 });

// Authentication helper
async function authenticateUser(username: string, password: string) {
  // Simple authentication - replace with your actual user lookup
  if (username === 'alice' && password === 'Password123!') {
    return { id: 1, username: 'alice' };
  }
  return null;
}

// Routes
app.get('/', (c) => c.json({ message: 'Session Security Hardener API' }));

app.post('/login', async (c) => {
  try {
    const { ua, ip } = getClientInfo(c.req.raw);
    const clientKey = ip;
    
    // Rate limiting
    if (!loginLimiter(clientKey)) {
      insertEvent('LOGIN_FAILED', null, null, 'Rate limited');
      return c.json({ error: 'Too many attempts' }, 429);
    }

    const body = await readJson(c.req.raw);
    const { username, password } = body;
    
    if (!username || !password) {
      return c.json({ error: 'Missing credentials' }, 400);
    }

    // Authenticate user
    const user = await authenticateUser(username, password);
    if (!user) {
      insertEvent('LOGIN_FAILED', null, null, `Invalid credentials for ${username}`);
      return c.json({ error: 'Invalid credentials' }, 401);
    }

    // Create session family and tokens
    const familyId = createFamily(user.id);
    const accessTTL = 60 * 5; // 5 minutes
    const refreshTTL = 60 * 60 * 24 * 7; // 7 days

    // Generate access token
    const { token: accessToken, jti } = await signAccessToken(
      { sub: String(user.id), username: user.username }, 
      accessTTL
    );

    // Generate refresh token
    const refresh = await generateRefreshToken();
    const bindHash = await hashUserAgentIP(ua, ip);

    // Calculate expiration times
    const accessExpISO = new Date(Date.now() + accessTTL * 1000).toISOString();
    const refreshExpISO = new Date(Date.now() + refreshTTL * 1000).toISOString();

    // Create session
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

  } catch (error) {
    console.error("Login error:", error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

app.post('/refresh', async (c) => {
  try {
    const body = await readJson(c.req.raw);
    const { refreshToken } = body;
    
    if (!refreshToken) {
      return c.json({ error: 'Missing refreshToken' }, 400);
    }

    const { ua, ip } = getClientInfo(c.req.raw);
    const lookup = await sha256(refreshToken);
    const session = findSessionByRefreshLookup(lookup);
    
    // Validate session
    if (!session || session.revokedAt) {
      insertEvent('TOKEN_REUSE_DETECTED', null, null, 'Unknown or revoked refresh token used');
      return c.json({ error: 'Invalid refresh token' }, 401);
    }

    // Verify refresh token
    const valid = await verifyRefreshToken(refreshToken, session.refreshHash);
    if (!valid) {
      insertEvent('TOKEN_REUSE_DETECTED', session.userId, session.id, 'Refresh token verification failed');
      return c.json({ error: 'Invalid refresh token' }, 401);
    }

    // Token binding check
    const currentBindHash = await hashUserAgentIP(ua, ip);
    if (session.userAgentHash && session.userAgentHash !== currentBindHash) {
      markFamilyCompromised(session.familyId);
      revokeFamily(session.familyId);
      insertEvent('TOKEN_REUSE_DETECTED', session.userId, session.id, 'Binding mismatch, family revoked');
      return c.json({ error: 'Token reuse detected. Family revoked.' }, 401);
    }

    // Rotate tokens
    const accessTTL = 60 * 5;
    const refreshTTL = 60 * 60 * 24 * 7;
    
    const { token: accessToken, jti } = await signAccessToken(
      { sub: String(session.userId) }, 
      accessTTL
    );
    
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

  } catch (error) {
    console.error("Refresh error:", error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

app.post('/revoke/session', async (c) => {
  try {
    const body = await readJson(c.req.raw);
    const { sessionId } = body;
    
    if (!sessionId) {
      return c.json({ error: 'Missing sessionId' }, 400);
    }
    
    revokeSession(sessionId);
    insertEvent('SESSION_REVOKED', null, sessionId, 'Revoked by admin');
    
    return c.json({ ok: true });
  } catch (error) {
    return c.json({ error: 'Internal server error' }, 500);
  }
});

app.post('/revoke/family', async (c) => {
  try {
    const body = await readJson(c.req.raw);
    const { familyId } = body;
    
    if (!familyId) {
      return c.json({ error: 'Missing familyId' }, 400);
    }
    
    markFamilyCompromised(familyId);
    revokeFamily(familyId);
    insertEvent('FAMILY_REVOKED', null, null, `Family ${familyId} revoked by admin`);
    
    return c.json({ ok: true });
  } catch (error) {
    return c.json({ error: 'Internal server error' }, 500);
  }
});

app.get('/sessions/:userId', (c) => {
  const userId = parseInt(c.req.param('userId'));
  
  if (isNaN(userId)) {
    return c.json({ error: 'Invalid user ID' }, 400);
  }
  
  const sessions = getActiveSessionsForUser(userId);
  return c.json(sessions);
});

app.get('/events', (c) => {
  const events = getEvents(200);
  return c.json(events);
});

app.post('/me', async (c) => {
  try {
    const body = await readJson(c.req.raw);
    const { accessToken } = body;
    
    if (!accessToken) {
      return c.json({ error: 'Missing accessToken' }, 400);
    }
    
    const result = await verifyAccessToken(accessToken);
    return c.json({ ok: true, payload: result.payload });
  } catch (error: any) {
    return c.json({ ok: false, error: error.message }, 401);
  }
});

app.get('/users', (c) => {
  // This would need proper database query implementation
  return c.json([{ id: 1, username: 'alice', created_at: new Date().toISOString() }]);
});

app.get('/stats', (c) => {
  // This would need proper database query implementation
  return c.json({ LOGIN_SUCCESS: 5, LOGIN_FAILED: 2, REFRESH: 3 });
});

// Initialize and start server
const port = Number(process.env.PORT || 4000);

await seedUser();

export default {
  port,
  fetch: app.fetch,
};