export const passwordConfig = {
  algorithm: 'argon2id' as const,
  timeCost: 4,
  memoryCost: 4096,
};

export async function hashPassword(password: string): Promise<string> {
  return Bun.password.hash(password, passwordConfig);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    return await Bun.password.verify(password, hash);
  } catch (error) {
    console.error('Password verification error:', error);
    return false;
  }
}