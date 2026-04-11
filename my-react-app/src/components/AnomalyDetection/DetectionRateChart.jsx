import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';

const DetectionRateChart = ({ statistics, loading }) => {
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

  if (!statistics || !statistics.detectionRateTrend) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center">
        <p className="text-gray-500">No detection rate data available</p>
      </div>
    );
  }

  const trend = statistics.detectionRateTrend;
  const weeklyData = trend.weeklyTrend || [];

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const chartData = weeklyData.map(point => ({
    week: formatDate(point.date),
    rate: point.detectionRate,
    anomalies: point.anomaliesCount
  }));

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white px-4 py-3 rounded-lg shadow-lg border border-gray-100">
          <p className="text-sm font-medium text-gray-900">{label}</p>
          <p className="text-sm text-blue-600">Detection Rate: {payload[0].value}%</p>
          <p className="text-xs text-gray-500">Anomalies: {payload[0].payload.anomalies}</p>
        </div>
      );
    }
    return null;
  };

  const isIncreasing = trend.overallChange > 0;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-medium text-gray-900">Detection Rate Trend</h3>
          <p className="text-sm text-gray-500 mt-0.5">Weekly anomaly detection rate</p>
        </div>
        <div className="flex items-center gap-2">
          {isIncreasing ? (
            <TrendingUp size={16} className="text-red-500" />
          ) : (
            <TrendingDown size={16} className="text-green-500" />
          )}
          <span className={`text-sm font-medium ${isIncreasing ? 'text-red-600' : 'text-green-600'}`}>
            {isIncreasing ? '+' : ''}{trend.overallChange}% change
          </span>
        </div>
      </div>
      
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
            <XAxis 
              dataKey="week" 
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#6b7280', fontSize: 11 }}
              dy={8}
            />
            <YAxis 
              tickFormatter={(value) => `${value}%`}
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#6b7280', fontSize: 11 }}
              domain={[0, 100]}
              width={35}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#e5e7eb', strokeWidth: 1 }} />
            <Line 
              type="monotone" 
              dataKey="rate" 
              stroke="#3b82f6" 
              strokeWidth={2}
              dot={{ fill: '#3b82f6', r: 4 }}
              activeDot={{ r: 6 }}
              animationDuration={1000}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default DetectionRateChart;