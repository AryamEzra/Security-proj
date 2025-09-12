"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/src/lib/api";

import Link from "next/link";

export default function SignUpForm() {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const validateEmail = (email: string) => {
    // Basic email regex
    const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
    if (!emailRegex.test(email)) return false;
    // Accept only gmail.com or any valid domain
    const allowedDomains = ["gmail.com"];
    const domain = email.split("@")[1];
    if (allowedDomains.includes(domain)) return true;
    // Accept any valid domain
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!validateEmail(email)) {
      setError("Please enter a valid email address (e.g. user@gmail.com or another valid domain).");
      setLoading(false);
      return;
    }

    try {
      // Use your API instance instead of direct fetch
      const response = await api.post("/signup", { 
        email, 
        username, 
        password 
      });

      if (response.status === 200) {
        router.push("/login?message=signup_success");
      } else {
        setError(response.data.error || "Signup failed");
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto card">
      <h2 className="text-lg font-semibold mb-3">Create Account</h2>
      <div className="space-y-3">
        <input
          className="input w-full"
          placeholder="Email"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <input
          className="input w-full"
          placeholder="Username"
          value={username}
          onChange={e => setUsername(e.target.value)}
          required
        />
        <input
          className="input w-full"
          placeholder="Password"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        {error && (
          <div className="p-3 bg-red-100 text-red-800 rounded-lg text-sm">{error}</div>
        )}
        <button
          type="submit"
          className="btn w-full rounded-full font-semibold"
          style={{ borderRadius: "9999px" }}
          disabled={loading}
          onClick={handleSubmit}
        >
          {loading ? "Creating Account..." : "Sign Up"}
        </button>
        <div className="mt-2 text-center">
          <span className="muted text-sm">Already have an account? </span>
          <Link href="/login" className="text-blue-600 hover:underline">Sign in</Link>
        </div>
      </div>
    </div>
  );
}