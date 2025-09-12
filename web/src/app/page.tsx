
"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getEvents, getUsers, getStats } from "../lib/api";

export default function Home() {
  const [stats, setStats] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const statsData = await getStats();
        setStats(statsData);
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const features = [
    {
      title: "Token Reuse Detection",
      description: "Automatically detects and prevents refresh token reuse attacks by revoking entire session families.",
      icon: "🔒"
    },
    {
      title: "Session Family Management",
      description: "Groups related sessions together for efficient revocation and security monitoring.",
      icon: "👥"
    },
    {
      title: "Real-time Security Events",
      description: "Monitor authentication attempts, suspicious activities, and security incidents in real-time.",
      icon: "📊"
    },
    {
      title: "Advanced Rate Limiting",
      description: "Protects against brute force attacks with intelligent rate limiting and IP-based blocking.",
      icon: "🛡️"
    }
  ];

  const statsCards = [
    {
      label: "Total Users",
      value: stats.total_users || 0,
      color: "bg-blue-500"
    },
    {
      label: "Security Events",
      value: Object.values(stats).reduce((a, b) => a + b, 0) || 0,
      color: "bg-purple-500"
    },
    {
      label: "Blocked Attempts",
      value: (stats.LOGIN_FAILED || 0) + (stats.TOKEN_REUSE_DETECTED || 0),
      color: "bg-red-500"
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="text-center py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Advanced Session Security Hardener
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            Protect your applications with enterprise-grade authentication security.
            Detect token reuse, manage session families, and monitor threats in real-time.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link
              href="/signup"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
            >
              Try Demo
            </Link>
            <Link
              href="/admin"
              className="border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 px-8 py-3 rounded-lg font-semibold transition-colors"
            >
              View Dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-6 dark:bg-gray-900">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Security Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {statsCards.map((stat, index) => (
              <div key={index} className="card text-center">
                <div className={`w-16 h-16 ${stat.color} rounded-full flex items-center justify-center mx-auto mb-4`}>
                  <span className="text-2xl font-bold">
                    {loading ? "..." : stat.value}
                  </span>
                </div>
                <h3 className="text-lg font-semibold mb-2">{stat.label}</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {loading ? "Loading..." : `${stat.value} recorded`}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Security Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="card hover:shadow-lg transition-shadow">
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-gray-600 dark:text-neutral-900">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-gray-200 dark:border-gray-800">
        <div className="max-w-6xl mx-auto text-center">
          <h3 className="text-lg font-semibold mb-4">Session Security Hardener</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Built with modern security practices to protect your applications from authentication threats.
          </p>
          <div className="flex justify-center gap-6 text-sm text-gray-500 dark:text-gray-400">
            <span>🔐 Token Security</span>
            <span>👁️ Real-time Monitoring</span>
            <span>🛡️ Threat Prevention</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
