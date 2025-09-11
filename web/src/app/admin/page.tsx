"use client";
import { useEffect, useState } from "react";
import { getEvents, getSessionsForUser, revokeFamily, revokeSession, getUsers, getStats } from "../../lib/api";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line 
} from 'recharts';
import GeoMap from "@/src/components/GeoMap";

// Color palette that matches your dark/light theme
const CHART_COLORS = {
  primary: '#3b82f6',    // blue-500
  success: '#10b981',    // green-500
  danger: '#ef4444',     // red-500
  warning: '#f59e0b',    // amber-500
  purple: '#8b5cf6',     // purple-500
  gray: '#6b7280'        // gray-500
};

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
    const interval = setInterval(loadData, 5000); // Refresh every 5 seconds
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

  // Color by event type
  const getEventColor = (type: string) => {
    if (type === 'LOGIN_SUCCESS') return CHART_COLORS.success;
    if (type === 'FAMILY_REVOKED') return CHART_COLORS.danger;
    if (type === 'TOKEN_REUSE_DETECTED') return CHART_COLORS.warning;
    if (type === 'REFRESH') return CHART_COLORS.primary;
    if (type === 'USER_SIGNUP') return CHART_COLORS.gray;
    if (type === 'LOGIN_FAILED') return '#fbbf24'; // yellow-400
    return CHART_COLORS.purple;
  };

  // Prepare chart data
  const eventTypeData = Object.entries(stats).map(([type, count]) => ({
    name: type.replace(/_/g, ' '),
    value: count,
    color: getEventColor(type)
  }));

  const hourlyActivityData = [
    { hour: '00:00', events: 12 },
    { hour: '06:00', events: 8 },
    { hour: '12:00', events: 25 },
    { hour: '18:00', events: 18 },
    { hour: '24:00', events: 10 }
  ];

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

  // Dashboard stats
  const dashboardStats = [
    {
      title: 'Total Users',
      value: users.length,
      color: 'bg-blue-500'
    },
    {
      title: 'Active Sessions',
      value: sessions.filter((s: any) => !s.revokedAt && !s.revoked_at).length,
      color: 'bg-green-500'
    },
    {
      title: 'Security Events',
      value: events.length,
      color: 'bg-purple-500'
    },
    {
      title: 'Blocked Attempts',
      value: events.filter((e: any) => e.type.includes('FAILED') || e.type.includes('REVOKED')).length,
      color: 'bg-red-500'
    }
  ];

  // Custom label for pie chart with smaller text
  const renderCustomizedLabel = ({
    cx, cy, midAngle, innerRadius, outerRadius, percent, name
  }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize={10} // Smaller font size
      >
        {`${name.split(' ')[0]}`} {/* Only show first word to save space */}
      </text>
    );
  };

  // Detect dark mode
  const isDarkMode = typeof window !== 'undefined' && document.documentElement.classList.contains('dark');

  return (
    <div className={`min-h-screen p-6 ${isDarkMode ? 'bg-gray-900' : ''}`}>
      <div className="max-w-7xl mx-auto space-y-6">
        {message && (
          <div className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 p-4 rounded-lg">
            {message}
          </div>
        )}

        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Security Dashboard</h1>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Auto-refreshing every 5 seconds
          </div>
        </div>

        <GeoMap events={events} isDarkMode={isDarkMode} />

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Sidebar - Users */}
          <div className="lg:col-span-1 space-y-6">
            <div className="card">
              <h2 className="text-lg font-semibold mb-4">Users</h2>
              {loading && <div className="text-gray-600 dark:text-gray-400">Loading users...</div>}
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {users.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div>
                      <div className="font-medium">{user.username}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {user.email} • ID: {user.id}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-500">
                        Joined: {new Date(user.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <button 
                      className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm"
                      onClick={() => setSelectedUser(user.id)}
                    >
                      View
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Event Type Pie Chart */}
            <div className="card">
              <h3 className="text-lg font-semibold mb-4">Event Types</h3>
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={eventTypeData}
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    fill="#8884d8"
                    dataKey="value"
                    label={renderCustomizedLabel} // Use custom label
                    labelLine={false}
                  >
                    {eventTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: any, name: any, props: any) => [
                      `${value}`, 
                      `${props.payload.name}`
                    ]} 
                  />
                  <Legend 
                    layout="vertical" 
                    verticalAlign="bottom"
                    formatter={(value, entry, index) => (
                      <span className="text-xs">
                        {eventTypeData[index].name}
                      </span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {dashboardStats.map((stat, index) => (
                <div key={index} className={`rounded-lg p-4 text-white ${stat.color}`}>
                  <h3 className="text-sm font-medium">{stat.title}</h3>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
              ))}
            </div>

            {/* Activity Chart */}
            <div className="card">
              <h3 className="text-lg font-semibold mb-4">Activity Timeline</h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={hourlyActivityData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="events" stroke={CHART_COLORS.primary} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Recent Events */}
            <div className="card">
              <h3 className="text-lg font-semibold mb-4">Recent Security Events</h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {events.slice(0, 20).map((event) => (
                  <div key={event.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
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
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(event.created_at || event.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">{event.message}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      User: {event.user_id || event.userId || 'N/A'}, 
                      Session: {event.session_id || event.sessionId || 'N/A'}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      IP: {event.ip_address || 'N/A'} &bull; ISP: {event.isp || 'N/A'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}