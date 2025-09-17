import { SignJWT, jwtVerify, generateKeyPair as joseGenerateKeyPair } from 'jose';
let keyPair = null;
export const getKeys = async () => {
    if (!keyPair) {
        try {
            // Try using jose's key generation first
            const { publicKey, privateKey } = await joseGenerateKeyPair('EdDSA', { crv: 'Ed25519' });
            keyPair = { publicKey, privateKey };
        }
        catch (e) {
            console.warn("[crypto] jose.generateKeyPair failed, falling back to WebCrypto:", e?.message);
            // Fallback to WebCrypto with extractable set to true
            const pair = await crypto.subtle.generateKey({ name: 'EdDSA', namedCurve: 'Ed25519' }, true, // extractable MUST be true for jose to work
            ['sign', 'verify']);
            keyPair = { publicKey: pair.publicKey, privateKey: pair.privateKey };
        }
    }
    return keyPair;
};
export async function signAccessToken(payload, expiresInSec) {
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
export async function verifyAccessToken(token) {
    const { publicKey } = await getKeys();
    const result = await jwtVerify(token, publicKey, { issuer: 'better-auth-session-hardener' });
    return result;
}
export async function generateRefreshToken() {
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
export async function verifyRefreshToken(raw, atRestHash) {
    try {
        console.log("Verifying refresh token...");
        console.log("Raw token:", raw.substring(0, 10) + "...");
        if (!atRestHash) {
            console.error("No atRestHash provided - cannot verify token");
            return false;
        }
        console.log("Stored hash:", atRestHash.substring(0, 20) + "...");
        // Bun.password.verify should work with argon2id hashes
        const isValid = await Bun.password.verify(raw, atRestHash);
        console.log("Verification result:", isValid);
        return isValid;
    }
    catch (error) {
        console.error("Error in verifyRefreshToken:", error);
        return false;
    }
}
export async function sha256(input) {
    const buf = new TextEncoder().encode(input);
    const hash = await crypto.subtle.digest('SHA-256', buf);
    return Buffer.from(hash).toString('hex');
}
