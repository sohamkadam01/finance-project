import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Tag } from 'lucide-react';

const CategoryBreakdown = ({ statistics, loading }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-40 bg-gray-200 rounded"></div>
          <div className="h-64 bg-gray-100 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (!statistics || !statistics.categoryBreakdown || statistics.categoryBreakdown.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center">
        <Tag size={32} className="text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">No category data available</p>
      </div>
    );
  }

  const categoryData = statistics.categoryBreakdown.map(cat => ({
    name: cat.categoryName,
    anomalies: cat.anomalyCount,
    fraud: cat.confirmedFraud,
    amount: cat.totalAmount
  })).sort((a, b) => b.anomalies - a.anomalies);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white px-4 py-3 rounded-lg shadow-lg border border-gray-100">
          <p className="text-sm font-medium text-gray-900">{label}</p>
          <p className="text-sm text-orange-600">Anomalies: {data.anomalies}</p>
          <p className="text-sm text-red-600">Confirmed Fraud: {data.fraud}</p>
          <p className="text-xs text-gray-500">Amount: ₹{data.amount?.toLocaleString()}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <Tag size={18} className="text-gray-500" />
        <h3 className="text-base font-medium text-gray-900">Anomalies by Category</h3>
      </div>
      
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={categoryData} layout="vertical" margin={{ top: 10, right: 10, left: 80, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e5e7eb" />
            <XAxis 
              type="number"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#6b7280', fontSize: 11 }}
            />
            <YAxis 
              type="category"
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#6b7280', fontSize: 11 }}
              width={70}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8f9fa' }} />
            <Bar 
              dataKey="anomalies" 
              name="Anomalies" 
              fill="#f59e0b" 
              radius={[0, 4, 4, 0]}
              barSize={30}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default CategoryBreakdown;