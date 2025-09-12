"use client";
import { useEffect, useState } from "react";
import { getEvents, getUsers, getStats } from "../../lib/api";
import GeoMap from "@/src/components/GeoMap";
import DashboardHeader from "@/src/components/admin/DashboardHeader";
import StatsGrid from "@/src/components/admin/StatsGrid";
import UserList from "@/src/components/admin/UserList";
import EventTypesChart from "@/src/components/admin/EventTypesChart";
import ActivityChart from "@/src/components/admin/ActivityChart";
import RecentEvents from "@/src/components/admin/RecentEvents";

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
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

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

  // Dashboard stats
  const dashboardStats = [
    {
      title: 'Successful Logins',
      value: stats.LOGIN_SUCCESS || 0,
      color: 'bg-green-500'
    },
    {
      title: 'Total Users',
      value: users.length,
      color: 'bg-blue-500'
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

  return (
    <div className={`min-h-screen p-6 $`}>
      <div className="max-w-7xl mx-auto space-y-6">
        <DashboardHeader message={message} />

        <GeoMap events={events}  />

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Sidebar - Users */}
          <div className="lg:col-span-1 space-y-6">
            <UserList users={users} loading={loading} onSelectUser={() => {}} />

            {/* Event Type Pie Chart */}
            <EventTypesChart eventTypeData={eventTypeData} renderCustomizedLabel={renderCustomizedLabel} />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Stats Grid */}
            <StatsGrid stats={dashboardStats} />

            {/* Activity Chart */}
            <ActivityChart data={hourlyActivityData} />

            {/* Recent Events */}
            <RecentEvents events={events} />
          </div>
        </div>
      </div>
    </div>
  );
}