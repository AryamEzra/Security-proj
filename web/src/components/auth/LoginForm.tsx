"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDashboardStore } from "../../../store/dashboard";
import { api, login, me, refresh } from "../../lib/api";
import PasswordField from "../../components/ui/PasswordField";
import Link from "next/link";

export default function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [showSignupPrompt, setShowSignupPrompt] = useState(false);
  const [signupPromptMsg, setSignupPromptMsg] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [userId, setUserIdState] = useState<number | null>(null);
  const { setUserId } = useDashboardStore();
  const router = useRouter();

  const doLogin = async () => {
    try {
      setMessage("Logging in...");
      const r = await login(username, password);
      setAccessToken(r.accessToken);
      setRefreshToken(r.refreshToken);
      setSessionId(r.sessionId || null);
      setUserIdState(r.user?.id || null);
      setUserId(r.user?.id || 1);
      setMessage("Login successful!");
      // Redirect to admin after successful login
      // setTimeout(() => router.push('/admin'), 1000);
    } catch (error: any) {
      const serverMsg = error.response?.data?.error || error.message;
      const status = error.response?.status;

      // Distinguish between user not found (suggest signup) and incorrect password
      if (status === 404 || /user not found/i.test(serverMsg)) {
        setShowSignupPrompt(true);
        setSignupPromptMsg('Account not found. Would you like to create one?');
      } else if (status === 401 && /incorrect password/i.test(serverMsg)) {
        setMessage('Incorrect password. Please try again.');
        setShowSignupPrompt(false);
      } else if (status === 401 && /invalid credentials/i.test(serverMsg)) {
        // Generic invalid credentials fallback
        setMessage('Invalid credentials. Please check your username and password.');
        setShowSignupPrompt(false);
      } else {
        setMessage(`Login failed: ${serverMsg}`);
        setShowSignupPrompt(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await doLogin();
  };

  const checkMe = async () => {
    try {
      setMessage("Checking token...");
      const r = await me();
      setMessage(`Token valid: ${JSON.stringify(r, null, 2)}`);
    } catch (error: any) {
      setMessage(`Token check failed: ${error.response?.data?.error || error.message}`);
    }
  };

  const doRefresh = async () => {
    try {
      setMessage("Refreshing token...");
      const r = await refresh();
      setAccessToken(r.accessToken);
      setRefreshToken(r.refreshToken);
      setMessage("Token refreshed successfully!");
    } catch (error: any) {
      setMessage(`Refresh failed: ${error.response?.data?.error || error.message}`);
    }
  };

  const triggerReuse = async () => {
    if (!refreshToken) {
      setMessage("No refresh token available");
      return;
    }
    
    try {
      setMessage("Triggering token reuse detection...");
      
      // First refresh should work
      await refresh();
      
      // Second refresh with the same old token should trigger reuse detection
      const response = await fetch("/api/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken })
      });
      
      const result = await response.json();
      
      if (response.status === 401) {
        setMessage(`Token reuse detected! Family revoked. Response: ${JSON.stringify(result)}`);
      } else {
        setMessage(`Unexpected response: ${JSON.stringify(result)}`);
      }
    } catch (error: any) {
      setMessage(`Reuse trigger failed: ${error.message}`);
    }
  };

  const handleLogout = async () => {
  console.log("Logging out with sessionId:", sessionId, "userId:", userId);
  if (!sessionId || !userId) {
    alert("No users are logged in.");
    return;
  }
  try {
    await api.post("/logout", { sessionId });
    // Clear all stored data
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setSessionId(null);
    setUserIdState(null);
    setAccessToken(null);
    setRefreshToken(null);
    setMessage("");
    router.push("/");
  } catch (err) {
    console.error("Logout error:", err);
    alert("Logout failed. Please try again.");
  }
};

  return (
    <div className="max-w-md mx-auto card">
      <h2 className="text-lg font-semibold mb-3">Simulate Login</h2>
      <form className="space-y-3" onSubmit={handleSubmit}>
        <input 
          className="input w-full" 
          placeholder="username" 
          value={username} 
          onChange={e => setUsername(e.target.value)} 
        />
        {/* Password field with show/hide */}
        {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
        {/* @ts-ignore-next-line */}
        <PasswordField value={password} onChange={setPassword} placeholder="password" />

        {/* style={{ width: '100%', flexWrap: 'nowrap', overflowX: 'auto' }} */}

        <div className="flex gap-2 flex-nowrap" style={{ width: '100%'}}>
          <button className="btn" type="submit">Login</button>
          <button className="btn" onClick={doRefresh} disabled={!refreshToken}>Refresh</button>
          <button className="btn" onClick={triggerReuse} disabled={!refreshToken}>Trigger Reuse</button>
          <button className="btn" onClick={checkMe} disabled={!accessToken}>/me</button>
          <button className="btn" onClick={handleLogout}>Logout</button>
        </div>
        
        {message && (
          <div className="p-3 bg-blue-100 text-blue-800 rounded-lg text-sm">
            {message}
          </div>
        )}
        {showSignupPrompt && (
          <div className="p-3 bg-blue-100 text-blue-800 rounded-lg text-sm mt-2">
            <div className="font-medium">{signupPromptMsg}</div>
            <div className="mt-2">
              <Link href="/signup" className="underline text-blue-600">Go to Sign up</Link>
            </div>
          </div>
        )}
        
        <div className="border-t pt-3">
          <div className="muted text-sm">Access Token: {accessToken ? `${accessToken.slice(0, 20)}...` : 'None'}</div>
          <div className="muted text-sm">Refresh Token: {refreshToken ? `${refreshToken.slice(0, 10)}...` : 'None'}</div>
        </div>
  </form>
    </div>
  );
}
