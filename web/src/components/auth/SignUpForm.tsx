"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/src/lib/api";

import Link from "next/link";
import PasswordField from "../ui/PasswordField";
import EmailUsernameInputs from "./EmailUsernameInputs";
import PasswordStrength from "./PasswordStrength";
import SignUpToasts from "./SignUpToasts";

export default function SignUpForm() {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [pwInfo, setPwInfo] = useState<{ score: number; label: string; suggestions: string[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPwPopup, setShowPwPopup] = useState(false);
  const [pwPopupMessage, setPwPopupMessage] = useState("");
  const [showUserExistsPopup, setShowUserExistsPopup] = useState(false);
  const [userExistsMsg, setUserExistsMsg] = useState("");
  const router = useRouter();

  // Auto-hide popups after 3 seconds when they are shown
  useEffect(() => {
    let t: number | undefined;
    if (showPwPopup) {
      t = window.setTimeout(() => setShowPwPopup(false), 3000);
    }
    return () => {
      if (t) clearTimeout(t);
    };
  }, [showPwPopup]);

  useEffect(() => {
    let t: number | undefined;
    if (showUserExistsPopup) {
      t = window.setTimeout(() => setShowUserExistsPopup(false), 3000);
    }
    return () => {
      if (t) clearTimeout(t);
    };
  }, [showUserExistsPopup]);

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

  // Password strength helper
  function evaluatePassword(password: string, usernameOrEmail?: string) {
    const suggestions: string[] = [];
    let score = 0;

    if (password.length >= 8) score++;
    else suggestions.push('Make it at least 8 characters long');

    if (/[A-Z]/.test(password)) score++;
    else suggestions.push('Add an uppercase letter');

    if (/[0-9]/.test(password)) score++;
    else suggestions.push('Add a number');

    if (/[^A-Za-z0-9]/.test(password)) score++;
    else suggestions.push('Add a symbol (e.g. !@#$%)');

    // Penalize if password contains username or email local-part
    if (usernameOrEmail && usernameOrEmail.length > 0) {
      const lower = password.toLowerCase();
      const local = usernameOrEmail.split('@')[0].toLowerCase();
      const uname = usernameOrEmail.toLowerCase();
      if ((local && local.length >= 3 && lower.includes(local)) || (uname && uname.length >= 3 && lower.includes(uname))) {
        // strongly discourage
        suggestions.push('Avoid using your username or email in the password');
        // reduce score
        score = Math.max(0, score - 2);
      }
    }

    // Normalize score between 0 and 4
    score = Math.max(0, Math.min(4, score));

    let label = 'Very weak';
    if (score >= 4) label = 'Strong';
    else if (score === 3) label = 'Good';
    else if (score === 2) label = 'Weak';

    return { score, label, suggestions } as const;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!validateEmail(email)) {
      setError("Please enter a valid email address (e.g. user@gmail.com or another valid domain).");
      setLoading(false);
      return;
    }

    // Client-side password strength enforcement
    const evaluation = evaluatePassword(password, username || email);
    if (evaluation.score < 4) {
      // show popup instead of inline error
      setPwPopupMessage('Please choose a stronger password: ' + evaluation.suggestions.slice(0,2).join('; '));
      setShowPwPopup(true);
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
        // If server reports user exists, show popup
        if (response.status === 409) {
          setUserExistsMsg(response.data?.error || 'User already exists. Please log in.');
          setShowUserExistsPopup(true);
          // auto-hide after 5s
          setTimeout(() => setShowUserExistsPopup(false), 5000);
        } else {
          setError(response.data.error || "Signup failed");
        }
      }
    } catch (err: any) {
      const status = err?.response?.status;
      const message = err?.response?.data?.error;
      if (status === 409) {
        setUserExistsMsg(message || 'User already exists. Please log in.');
        setShowUserExistsPopup(true);
        setTimeout(() => setShowUserExistsPopup(false), 5000);
      } else {
        setError(message || "Network error. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto card">
      <h2 className="text-lg font-semibold mb-3">Create Account</h2>
      <div className="space-y-3">
        <EmailUsernameInputs
          email={email}
          setEmail={setEmail}
          username={username}
          setUsername={setUsername}
        />
        <PasswordField
          value={password}
          onChange={v => {
            setPassword(v);
            setPwInfo(evaluatePassword(v, username || email));
          }}
          placeholder="Password"
        />
        <PasswordStrength pwInfo={pwInfo} />
        {error && (
          <div className="p-3 bg-red-100 text-red-800 rounded-lg text-sm">{error}</div>
        )}
        <SignUpToasts
          showPwPopup={showPwPopup}
          pwPopupMessage={pwPopupMessage}
          showUserExistsPopup={showUserExistsPopup}
          userExistsMsg={userExistsMsg}
        />
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