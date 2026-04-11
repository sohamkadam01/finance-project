import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { AlertTriangle } from 'lucide-react';

const SeverityPieChart = ({ statistics, loading }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-32 bg-gray-200 rounded"></div>
          <div className="h-64 bg-gray-100 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (!statistics || !statistics.severityBreakdown) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center">
        <p className="text-gray-500">No severity data available</p>
      </div>
    );
  }

  const severity = statistics.severityBreakdown;
  const total = severity.highSeverity + severity.mediumSeverity + severity.lowSeverity;

  const data = [
    { name: 'High Severity', value: severity.highSeverity, percentage: severity.highPercentage, color: '#ef4444' },
    { name: 'Medium Severity', value: severity.mediumSeverity, percentage: severity.mediumPercentage, color: '#f59e0b' },
    { name: 'Low Severity', value: severity.lowSeverity, percentage: severity.lowPercentage, color: '#eab308' }
  ].filter(d => d.value > 0);

  const COLORS = ['#ef4444', '#f59e0b', '#eab308'];

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white px-4 py-3 rounded-lg shadow-lg border border-gray-100">
          <p className="text-sm font-medium text-gray-900">{data.name}</p>
          <p className="text-lg font-semibold text-gray-900">{data.value} anomalies</p>
          <p className="text-xs text-gray-500">{data.percentage.toFixed(1)}% of total</p>
        </div>
      );
    }
    return null;
  };

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center">
        <AlertTriangle size={32} className="text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">No severity data available</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle size={18} className="text-gray-500" />
        <h3 className="text-base font-medium text-gray-900">Severity Breakdown</h3>
      </div>
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
              labelLine={false}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              verticalAlign="bottom" 
              height={36}
              formatter={(value) => <span className="text-xs text-gray-600">{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-4 space-y-2">
        {data.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-gray-700">{item.name}</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-gray-900 font-medium">{item.value}</span>
              <span className="text-xs text-gray-400 w-12 text-right">{item.percentage.toFixed(1)}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SeverityPieChart;