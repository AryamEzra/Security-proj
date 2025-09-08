
"use client";
import { useEffect } from "react";

import { useDashboardStore } from "../../store/dashboard";
import { getEvents, getSessionsForUser, revokeFamily, revokeSession } from "../lib/api";

export default function Home() {
  const { events, sessions, userId, setEvents, setSessions } = useDashboardStore();

  useEffect(() => {
    const fetchAll = async () => {
      setEvents(await getEvents());
      if (userId) setSessions(await getSessionsForUser(userId));
    };
    fetchAll();
    const id = setInterval(fetchAll, 2000);
    return () => clearInterval(id);
  }, [userId, setEvents, setSessions]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="card">
        <h2 className="text-lg font-semibold mb-3">Active Sessions {userId ? `(User ${userId})` : ""}</h2>
        {!sessions.length && <p className="muted">No active sessions yet. Use "Simulate Login".</p>}
        <div className="space-y-3">
          {sessions.map(s => (
            <div key={s.id} className="border border-neutral-800 rounded-xl p-3">
              <div className="text-sm">Session #{s.id} · Family {s.familyId}</div>
              <div className="muted">Access exp: {new Date(s.accessExpiresAt).toLocaleString()}</div>
              <div className="muted">Refresh exp: {new Date(s.refreshExpiresAt).toLocaleString()}</div>
              <div className="flex gap-2 mt-2">
                <button className="btn" onClick={() => revokeSession(s.id)}>Revoke</button>
                <button className="btn" onClick={() => revokeFamily(s.familyId)}>Revoke Family</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold mb-3">Security Events</h2>
        {!events.length && <p className="muted">No events yet.</p>}
        <div className="space-y-3 max-h-[70vh] overflow-auto">
          {events.map(e => (
            <div key={e.id} className="border border-neutral-800 rounded-xl p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">{e.type}</span>
                <span className="muted">{new Date(e.createdAt).toLocaleTimeString()}</span>
              </div>
              <div className="muted">{e.message}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
