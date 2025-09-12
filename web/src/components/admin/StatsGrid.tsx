"use client";

interface StatsGridProps {
  stats: {
    title: string;
    value: number;
    color: string;
  }[];
}

export default function StatsGrid({ stats }: StatsGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <div key={index} className={`rounded-lg p-4 text-white ${stat.color}`}>
          <h3 className="text-sm font-medium">{stat.title}</h3>
          <p className="text-2xl font-bold">{stat.value}</p>
        </div>
      ))}
    </div>
  );
}
