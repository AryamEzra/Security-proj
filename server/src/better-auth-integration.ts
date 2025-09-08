import { betterAuth } from "better-auth";
import { db } from "./db";
import { insertEvent, createFamily } from "./db";
import { hashUserAgentIP } from "./crypto";
import { passwordConfig, hashPassword, verifyPassword } from "./password";

// Configure Better Auth to use your existing database
export const auth = betterAuth({
  database: db,
  emailAndPassword: {
    enabled: true,
    autoSignIn: false,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days in seconds
    updateAge: 60 * 60 * 24, // 1 day in seconds
  },
  trustedOrigins: [
    "http://localhost:3000",
    "http://localhost:4000",
  ],
  advanced: {
    ipAddress: {
      ipAddressHeaders: ['x-forwarded-for', 'x-real-ip']
    }
  }
});

// Add custom password handling via app-level functions
// Better Auth doesn't directly expose password config in advanced, so we'll handle this separately

// Export the API
export const authApi = auth.api;

// Custom authentication function that uses your password hashing
export async function customAuthenticate(email: string, password: string) {
  // Find user by email
  const user = await db.query('SELECT * FROM users WHERE email = ? OR username = ?').get(email, email) as {
    id(id: any): unknown;
    username: any; password_hash: string 
} | undefined;
  
  if (!user) {
    return { success: false, error: 'User not found' };
  }

  // Verify password using your custom function
  const isValid = await verifyPassword(password, user.password_hash);
  
  if (!isValid) {
    return { success: false, error: 'Invalid password' };
  }

  return { success: true, user };
}

