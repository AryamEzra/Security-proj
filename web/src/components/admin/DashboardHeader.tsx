"use client";

interface DashboardHeaderProps {
  message: string;
}

export default function DashboardHeader({ message }: DashboardHeaderProps) {
  return (
    <div>
      {message && (
        <div className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 p-4 rounded-lg">
          {message}
        </div>
      )}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Security Dashboard</h1>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Auto-refreshing every 5 seconds
        </div>
      </div>
    </div>
  );
}
