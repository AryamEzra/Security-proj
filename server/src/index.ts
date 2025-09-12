import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { 
  getActiveSessionsForUser, createFamily, createSession, 
  findSessionByRefreshLookup, getEvents, 
  insertEvent, markFamilyCompromised, revokeFamily, updateSessionRefresh, 
  revokeSession, seedUser, hashUserAgentIP, 
  db,
  nowISO,
  findUserByUsername
} from './db';
import { generateRefreshToken, verifyRefreshToken, sha256, signAccessToken, verifyAccessToken } from './crypto';
import { rateLimit } from './rateLimit';
import { hashPassword, verifyPassword } from './password';
import { getGeoLocation } from './ipinfo-service';

const app = new Hono();

app.use(cors({
  origin: [
    "http://localhost:3000", 
    "https://security-proj.onrender.com" 
  ],
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization']
}));

// Add the readJson function HERE, right after middleware
async function readJson(req: Request) {
  try {
    const body = await req.text();
    return JSON.parse(body);
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
async function authenticateUser(identifier: string, password: string) {
  // Check by username OR email
  const user = db.query(`
    SELECT id, username, password_hash as passwordHash 
    FROM users 
    WHERE username = ? OR email = ?
  `).get(identifier, identifier) as any;

  if (!user) return null;

  try {
    const isValid = await verifyPassword(password, user.passwordHash);
    return isValid ? user : null;
  } catch (error) {
    console.error("Password verification error:", error);
    return null;
  }
}

// Routes
app.get('/', (c) => c.json({ message: 'Session Security Hardener API' }));

app.post('/login', async (c) => {
  try {
    const { ua, ip } = getClientInfo(c.req.raw);
    const clientKey = ip;
    
    // Get geolocation data - THIS WILL BE INSTANT NOW!
    let geoData;
    try {
      geoData = await getGeoLocation(ip);
      console.log('GeoIP result:', { 
        ip: geoData.ip, 
        country: geoData.country, 
        isp: geoData.isp,
        city: geoData.city 
      });
    } catch (geoError) {
      console.warn('Geolocation failed:', geoError);
      geoData = {
        ip,
        country: 'Unknown',
        country_code: 'XX',
        city: 'Unknown',
        region: 'Unknown',
        timezone: 'UTC',
        org: 'Unknown',
        isp: 'Unknown ISP',  // Add ISP fallback
        asn: 'AS0000',
        latitude: null,
        longitude: null
      };
    } 
    
    // Rate limiting
    if (!loginLimiter(clientKey)) {
      insertEvent('LOGIN_FAILED', null, null, 'Rate limited', ip, geoData.country_code, geoData.country, geoData.city, geoData.isp, geoData.latitude === null ? undefined : geoData.latitude, geoData.longitude === null ? undefined : geoData.longitude);
      return c.json({ error: 'Too many attempts' }, 429);
    }

    const body = await readJson(c.req.raw);
    const { username, password } = body;
    
    if (!username || !password) {
      return c.json({ error: 'Missing credentials' }, 400);
    }

    // Check if user exists first
    const userRecord = findUserByUsername(username);
    if (!userRecord) {
      insertEvent('LOGIN_FAILED', null, null, `Login attempt for non-existent user ${username}`, ip, geoData.country_code, geoData.country, geoData.city, geoData.isp, geoData.latitude === null ? undefined : geoData.latitude, geoData.longitude === null ? undefined : geoData.longitude);
      return c.json({ error: 'User not found' }, 404);
    }

    // Verify password
    let passwordValid = false;
    try {
      passwordValid = await verifyPassword(password, (userRecord as any).passwordHash);
    } catch (err) {
      console.error('Password verification error:', err);
      // Treat verification errors as invalid credentials
      insertEvent('LOGIN_FAILED', userRecord.id, null, `Password verification error for ${username}`, ip, geoData.country_code, geoData.country, geoData.city, geoData.isp, geoData.latitude === null ? undefined : geoData.latitude, geoData.longitude === null ? undefined : geoData.longitude);
      return c.json({ error: 'Invalid credentials' }, 401);
    }

    if (!passwordValid) {
      insertEvent('LOGIN_FAILED', userRecord.id, null, `Incorrect password for ${username}`, ip, geoData.country_code, geoData.country, geoData.city, geoData.isp, geoData.latitude === null ? undefined : geoData.latitude, geoData.longitude === null ? undefined : geoData.longitude);
      return c.json({ error: 'Incorrect password' }, 401);
    }

    // Normalize user object for the rest of the flow
    const user = { id: userRecord.id, username: userRecord.username };

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

    // insertEvent('LOGIN_SUCCESS', user.id, sessionId, `Session created (family ${familyId})`);

    insertEvent(
      'LOGIN_SUCCESS', 
      user.id, 
      sessionId, 
      `Session created for ${user.username}`,
      ip,
      geoData.country_code,
      geoData.country,
      geoData.city,
      geoData.isp,  // Use geoData.isp instead of geoData.org
      geoData.latitude === null ? undefined : geoData.latitude,
      geoData.longitude === null ? undefined : geoData.longitude
    );

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
    console.log("=== REFRESH ENDPOINT CALLED ===");
    
    const body = await readJson(c.req.raw);
    const { refreshToken } = body;
    
    if (!refreshToken) {
      console.log("No refresh token provided");
      return c.json({ error: 'Missing refreshToken' }, 400);
    }

    console.log("Refresh token received (first 10 chars):", refreshToken.substring(0, 10) + "...");
    
    const { ua, ip } = getClientInfo(c.req.raw);
    console.log("Client info - UA:", ua.substring(0, 30) + "...", "IP:", ip);
    
    // Create lookup hash
    const lookup = await sha256(refreshToken);
    console.log("Lookup hash:", lookup);
    
    // Find session by refresh token hash
    const session = findSessionByRefreshLookup(lookup);
    
    if (!session) {
      console.log("No session found for this refresh token");
      insertEvent('TOKEN_REUSE_DETECTED', null, null, 'Unknown refresh token used', ip, undefined, undefined, undefined, undefined, undefined, undefined);
      return c.json({ error: 'Invalid refresh token' }, 401);
    }

    if (session.revokedAt) {
      console.log("Session has been revoked:", session.revokedAt);
      insertEvent('TOKEN_REUSE_DETECTED', session.userId, session.id, 'Revoked refresh token used', ip, undefined, undefined, undefined, undefined, undefined, undefined);
      return c.json({ error: 'Refresh token revoked' }, 401);
    }

    console.log("Session found - ID:", session.id, "User ID:", session.userId);
    
    // Verify the refresh token cryptographically
    console.log("Verifying refresh token...");
    const valid = await verifyRefreshToken(refreshToken, session.refreshHash);
    
    if (!valid) {
      console.log("Refresh token verification FAILED");
      insertEvent('TOKEN_REUSE_DETECTED', session.userId, session.id, 'Refresh token verification failed', ip, undefined, undefined, undefined, undefined, undefined, undefined);
      return c.json({ error: 'Invalid refresh token' }, 401);
    }

    console.log("Refresh token verified successfully");
    
    // Token binding check (UA+IP binding)
    console.log("Checking token binding...");
    const currentBindHash = await hashUserAgentIP(ua, ip);
    console.log("Current bind hash:", currentBindHash);
    console.log("Stored bind hash:", session.userAgentHash);
    
    if (session.userAgentHash && session.userAgentHash !== currentBindHash) {
      console.log("TOKEN REUSE DETECTED! Binding mismatch");
      markFamilyCompromised(session.familyId);
      revokeFamily(session.familyId);
      insertEvent('TOKEN_REUSE_DETECTED', session.userId, session.id, 'Binding mismatch, family revoked', ip, undefined, undefined, undefined, undefined, undefined, undefined);
      return c.json({ error: 'Token reuse detected. Family revoked.' }, 401);
    }

    console.log("Token binding check passed");
    
    // Rotate tokens (issue new ones)
    console.log("Rotating tokens...");
    const accessTTL = 60 * 5; // 5 minutes
    const refreshTTL = 60 * 60 * 24 * 7; // 7 days
    
    // Generate new access token
    const { token: accessToken, jti } = await signAccessToken(
      { sub: String(session.userId) }, 
      accessTTL
    );
    
    // Generate new refresh token
    const newRefresh = await generateRefreshToken();
    const accessExpISO = new Date(Date.now() + accessTTL * 1000).toISOString();
    const refreshExpISO = new Date(Date.now() + refreshTTL * 1000).toISOString();

    console.log("Updating session with new refresh token...");
    
    // Update session with new refresh token
  updateSessionRefresh(session.id, newRefresh.lookupHash, newRefresh.atRestHash, refreshExpISO);
  insertEvent('REFRESH', session.userId, session.id, 'Refresh token rotated', ip, undefined, undefined, undefined, undefined, undefined, undefined);

    console.log("Token rotation completed successfully");
    
    return c.json({
      accessToken,
      accessExpiresAt: accessExpISO,
      refreshToken: newRefresh.token,
      refreshExpiresAt: refreshExpISO,
      sessionId: session.id
    });

  } catch (error) {
    console.error("REFRESH ENDPOINT ERROR:", error);
    if (error instanceof Error) {
      console.error("Error stack:", error.stack);
    }
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
  try {
    // Query all users from the database
    const users = db.query(`
      SELECT id, username, email, created_at 
      FROM users 
      ORDER BY created_at DESC
    `).all();
    
    return c.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    return c.json({ error: 'Failed to fetch users' }, 500);
  }
});

app.get('/stats', (c) => {
  try {
    // Get actual stats from events table
    const stats = db.query(`
      SELECT type, COUNT(*) as count 
      FROM events 
      GROUP BY type
    `).all();
    
    // Convert to object format
    const statsObj: Record<string, number> = {};
    stats.forEach((stat: any) => {
      statsObj[stat.type] = stat.count;
    });
    
    return c.json(statsObj);
  } catch (error) {
    console.error("Error fetching stats:", error);
    return c.json({ error: 'Failed to fetch stats' }, 500);
  }
});

app.post('/signup', async (c) => {
  try {
    const body = await readJson(c.req.raw);
    const { username, email, password } = body;
    
    if (!username || !email || !password) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    // Server-side password strength validation
    function evaluatePasswordServer(pw: string, usernameOrEmail: string | undefined) {
      let score = 0;
      const suggestions: string[] = [];

      if (pw.length >= 8) score++; else suggestions.push('at least 8 characters');
      if (/[A-Z]/.test(pw)) score++; else suggestions.push('an uppercase letter');
      if (/[0-9]/.test(pw)) score++; else suggestions.push('a number');
      if (/[^A-Za-z0-9]/.test(pw)) score++; else suggestions.push('a symbol');

      if (usernameOrEmail) {
        const lower = pw.toLowerCase();
        const local = usernameOrEmail.split('@')[0].toLowerCase();
        const uname = usernameOrEmail.toLowerCase();
        if ((local && local.length >= 3 && lower.includes(local)) || (uname && uname.length >= 3 && lower.includes(uname))) {
          score = Math.max(0, score - 2);
          suggestions.push('do not include your username/email');
        }
      }

      return { score, suggestions };
    }

    const pwEval = evaluatePasswordServer(password, username || email);
    if (pwEval.score < 4) {
      return c.json({ error: 'Password too weak. Include at least 8 chars, uppercase, number and a symbol, and avoid using your username/email.' + (pwEval.suggestions.length ? ' Suggestions: ' + pwEval.suggestions.slice(0,3).join(', ') : '') }, 400);
    }

    // Check if user exists
    const existingUser = db.query('SELECT id FROM users WHERE username = ? OR email = ?')
      .get(username, email) as any;
    
    if (existingUser) {
      return c.json({ error: 'User already exists. Please login into your account' }, 409);
    }

    // Hash password
    const hash = await hashPassword(password);
    
    // Create user
    const result = db.query('INSERT INTO users (username, email, password_hash, created_at) VALUES (?,?,?,?)')
      .run(username, email, hash, nowISO());

    const userId = db.query('SELECT last_insert_rowid() as id').get() as any;

  // Attach IP/geo data to signup event if available
  const { ua, ip } = getClientInfo(c.req.raw);
  insertEvent('USER_SIGNUP', userId.id, null, `New user registered: ${username}`, ip, undefined, undefined, undefined, undefined, undefined, undefined);
    
    return c.json({ success: true, message: 'User created successfully' });
    
  } catch (error) {
    console.error("Signup error:", error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Add this to your index.ts for debugging
app.post('/debug-sessions', async (c) => {
  try {
    const sessions = db.query('SELECT * FROM sessions ORDER BY created_at DESC').all();
    console.log("All sessions:", sessions);
    return c.json(sessions);
  } catch (error) {
    console.error("Debug error:", error);
    return c.json({ error: 'Debug failed' }, 500);
  }
});

app.post('/logout', async (c) => {
  try {
    const body = await readJson(c.req.raw);
    const { sessionId } = body;

    if (!sessionId) {
      return c.json({ error: 'Missing sessionId' }, 400);
    }

    // You'll need to implement or find the `revokeSession` function
    revokeSession(sessionId);
    
    return c.json({ success: true });
  } catch (error) {
    console.error("Logout error:", error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Initialize and start server
const port = Number(process.env.PORT || 4000);

await seedUser();

export default {
  port,
  fetch: app.fetch,
};