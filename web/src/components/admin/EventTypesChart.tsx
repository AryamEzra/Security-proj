"use client";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import React from 'react';

interface EventTypesChartProps {
  eventTypeData: any[];
  renderCustomizedLabel: (props: any) => React.JSX.Element;
}

export default function EventTypesChart({ eventTypeData, renderCustomizedLabel }: EventTypesChartProps) {
  return (
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
            label={renderCustomizedLabel}
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
  );
}