import { SignJWT, jwtVerify, generateKeyPair as joseGenerateKeyPair } from 'jose';
import type { KeyLike } from 'jose';

type KeyPair = {
  privateKey: CryptoKey | KeyLike;
  publicKey: CryptoKey | KeyLike;
};

let keyPair: KeyPair | null = null;

export const getKeys = async (): Promise<KeyPair> => {
  if (!keyPair) {
    try {
      // Try using jose's key generation first
      const { publicKey, privateKey } = await joseGenerateKeyPair('EdDSA', { crv: 'Ed25519' });
      keyPair = { publicKey, privateKey };
    } catch (e) {
      console.warn("[crypto] jose.generateKeyPair failed, falling back to WebCrypto:", (e as any)?.message);
      
      // Fallback to WebCrypto with extractable set to true
      const pair = await crypto.subtle.generateKey(
        { name: 'EdDSA', namedCurve: 'Ed25519' },
        true, // extractable MUST be true for jose to work
        ['sign', 'verify']
      );
      keyPair = { publicKey: pair.publicKey, privateKey: pair.privateKey };
    }
  }
  return keyPair;
};

export async function signAccessToken(payload: Record<string, any>, expiresInSec: number) {
  const { privateKey } = await getKeys();
  
  const jti = crypto.randomUUID();
  const tok = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'EdDSA', typ: 'JWT' })
    .setJti(jti)
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + expiresInSec)
    .setIssuer('better-auth-session-hardener')
    .sign(privateKey);

  return { token: tok, jti };
}

export async function verifyAccessToken(token: string) {
  const { publicKey } = await getKeys();
  const result = await jwtVerify(token, publicKey, { issuer: 'better-auth-session-hardener' });
  return result;
}

// Refresh token helpers
export type RefreshTokenBundle = {
  token: string;
  lookupHash: string;
  atRestHash: string;
};

export async function generateRefreshToken(): Promise<RefreshTokenBundle> {
  const raw = crypto.getRandomValues(new Uint8Array(32));
  const rawB64 = Buffer.from(raw).toString('base64url');
  const lookupHash = await sha256(rawB64);
  const atRestHash = await Bun.password.hash(rawB64, {
    algorithm: 'argon2id',
    memoryCost: 19456,
    timeCost: 2,
  });
  return { token: rawB64, lookupHash, atRestHash };
}

export async function verifyRefreshToken(raw: string, atRestHash: string): Promise<boolean> {
  return Bun.password.verify(raw, atRestHash);
}

export async function sha256(input: string) {
  const buf = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return Buffer.from(hash).toString('hex');
}

export async function hashUserAgentIP(ua: string | null, ip: string | null) {
  const u = ua ?? '';
  const i = ip ?? '';
  const combo = u + '|' + i;
  const h = await sha256(combo);
  return h;
}
