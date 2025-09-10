"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDashboardStore } from "../../../store/dashboard";
import { login, me, refresh } from "../../lib/api";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const { setUserId } = useDashboardStore();
  const router = useRouter();

  const doLogin = async () => {
    try {
      setMessage("Logging in...");
      const r = await login(username, password);
      setAccessToken(r.accessToken);
      setRefreshToken(r.refreshToken);
      setUserId(r.user?.id || 1);
      setMessage("Login successful!");
      
      // Redirect to admin after successful login
      // setTimeout(() => router.push('/admin'), 1000);
    } catch (error: any) {
      setMessage(`Login failed: ${error.response?.data?.error || error.message}`);
    }
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

  return (
    <div className="max-w-md mx-auto card">
      <h2 className="text-lg font-semibold mb-3">Simulate Login</h2>
      <div className="space-y-3">
        <input 
          className="input w-full" 
          placeholder="username" 
          value={username} 
          onChange={e => setUsername(e.target.value)} 
        />
        <input 
          className="input w-full" 
          placeholder="password" 
          type="password" 
          value={password} 
          onChange={e => setPassword(e.target.value)} 
        />
        
        <div className="flex gap-2 flex-wrap">
          <button className="btn" onClick={doLogin}>Login</button>
          <button className="btn" onClick={doRefresh} disabled={!refreshToken}>Refresh</button>
          <button className="btn" onClick={triggerReuse} disabled={!refreshToken}>Trigger Reuse</button>
          <button className="btn" onClick={checkMe} disabled={!accessToken}>/me</button>
        </div>
        
        {message && (
          <div className="p-3 bg-blue-100 text-blue-800 rounded-lg text-sm">
            {message}
          </div>
        )}
        
        <div className="border-t pt-3">
          <div className="muted text-sm">Access Token: {accessToken ? `${accessToken.slice(0, 20)}...` : 'None'}</div>
          <div className="muted text-sm">Refresh Token: {refreshToken ? `${refreshToken.slice(0, 10)}...` : 'None'}</div>
        </div>
      </div>
    </div>
  );
}