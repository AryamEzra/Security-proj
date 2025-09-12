"use client";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface ActivityChartProps {
  data: any[];
}

const CHART_COLORS = {
  primary: "#3b82f6", // blue-500
};

export default function ActivityChart({
  data,
}: ActivityChartProps) {
  return (
    <div className="card">
      <h3 className="text-lg font-semibold mb-4">Activity Timeline</h3>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="hour" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="events" stroke={CHART_COLORS.primary} strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
