"use client";
import { useEffect, useState } from "react";
import { getEvents, getSessionsForUser, revokeFamily, revokeSession, getUsers, getStats } from "../../lib/api";

export default function AdminPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [sessions, setSessions] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 3000);
    return () => clearInterval(interval);
  }, [selectedUser]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersData, eventsData, statsData] = await Promise.all([
        getUsers(),
        getEvents(),
        getStats()
      ]);
      
      setUsers(usersData);
      setEvents(eventsData);
      setStats(statsData);
      
      if (selectedUser) {
        const sessionsData = await getSessionsForUser(selectedUser);
        setSessions(sessionsData);
      }
    } catch (error: any) {
      setMessage(`Error loading data: ${error.response?.data?.error || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeSession = async (sessionId: number) => {
    try {
      await revokeSession(sessionId);
      setMessage("Session revoked successfully");
      loadData(); // Reload data
    } catch (error: any) {
      setMessage(`Failed to revoke session: ${error.response?.data?.error || error.message}`);
    }
  };

  const handleRevokeFamily = async (familyId: number) => {
    try {
      await revokeFamily(familyId);
      setMessage("Family revoked successfully");
      loadData(); // Reload data
    } catch (error: any) {
      setMessage(`Failed to revoke family: ${error.response?.data?.error || error.message}`);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {message && (
        <div className="col-span-full p-3 bg-blue-100 text-blue-800 rounded-lg">
          {message}
        </div>
      )}
      
      <div className="card col-span-1">
        <h2 className="text-lg font-semibold mb-4">Users</h2>
        {loading && <div className="muted">Loading users...</div>}
        <div className="space-y-3">
          {users.map((user) => (
            <div key={user.id} className="flex items-center justify-between p-2 border rounded-lg">
              <div>
                <div className="font-medium">{user.username}</div>
                <div className="muted text-xs">ID: {user.id}</div>
                <div className="muted text-xs">
                  Created: {new Date(user.created_at || user.createdAt).toLocaleDateString()}
                </div>
              </div>
              <button 
                className="btn"
                onClick={() => setSelectedUser(user.id)}
              >
                View Sessions
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="card col-span-2">
        <h2 className="text-lg font-semibold mb-4">Dashboard</h2>
        
        {/* Statistics */}
        <div className="mb-6">
          <h3 className="font-semibold mb-2">Security Statistics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(stats).map(([type, count]) => (
              <div key={type} className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
                <div className="text-sm text-gray-600 dark:text-gray-400">{type.replace(/_/g, ' ')}</div>
                <div className="text-xl font-bold">{count}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Sessions */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">
              {selectedUser ? `Sessions for User ${selectedUser}` : "Select a user to view sessions"}
            </h3>
            {selectedUser && (
              <button className="btn" onClick={() => setSelectedUser(null)}>
                Clear
              </button>
            )}
          </div>
          
          {loading && selectedUser && <div className="muted">Loading sessions...</div>}
          
          <div className="space-y-3">
            {sessions.map((session) => (
              <div key={session.id} className="border border-gray-300 dark:border-gray-700 rounded-lg p-3">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium">Session #{session.id}</div>
                    <div className="muted text-sm">Family: {session.family_id || session.familyId}</div>
                    <div className="muted text-sm">
                      Created: {new Date(session.created_at || session.createdAt).toLocaleString()}
                    </div>
                    <div className="muted text-sm">
                      Expires: {new Date(session.refresh_expires_at || session.refreshExpiresAt).toLocaleString()}
                    </div>
                    <div className="muted text-sm">
                      Status: {session.revoked_at || session.revokedAt ? 'Revoked' : 'Active'}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {!session.revoked_at && !session.revokedAt && (
                      <>
                        <button 
                          className="btn bg-red-500 text-white"
                          onClick={() => handleRevokeSession(session.id)}
                        >
                          Revoke
                        </button>
                        <button 
                          className="btn bg-orange-500 text-white"
                          onClick={() => handleRevokeFamily(session.family_id || session.familyId)}
                        >
                          Revoke Family
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Events */}
        <div>
          <h3 className="font-semibold mb-3">Recent Security Events</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {events.map((event) => (
              <div key={event.id} className="border border-gray-300 dark:border-gray-700 rounded-lg p-3">
                <div className="flex justify-between items-center">
                  <span className={`text-sm font-medium ${
                    event.type.includes('FAILED') || event.type.includes('REVOKED') 
                      ? 'text-red-600' 
                      : event.type.includes('SUCCESS') 
                      ? 'text-green-600' 
                      : 'text-blue-600'
                  }`}>
                    {event.type}
                  </span>
                  <span className="muted text-xs">
                    {new Date(event.created_at || event.createdAt).toLocaleString()}
                  </span>
                </div>
                <div className="muted text-sm mt-1">{event.message}</div>
                <div className="muted text-xs mt-1">
                  User: {event.user_id || event.userId || 'N/A'}, 
                  Session: {event.session_id || event.sessionId || 'N/A'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}