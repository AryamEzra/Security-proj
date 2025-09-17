export const passwordConfig = {
    algorithm: 'argon2id',
    timeCost: 4,
    memoryCost: 4096,
};
export async function hashPassword(password) {
    return Bun.password.hash(password, passwordConfig);
}
export async function verifyPassword(password, hash) {
    try {
        return await Bun.password.verify(password, hash);
    }
    catch (error) {
        console.error('Password verification error:', error);
        return false;
    }
}
