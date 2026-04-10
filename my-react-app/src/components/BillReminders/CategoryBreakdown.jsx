import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const CategoryBreakdown = ({ breakdown, loading }) => {
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

  if (!breakdown || Object.keys(breakdown).length === 0) {
    return null;
  }

  const data = Object.entries(breakdown).map(([category, value]) => ({
    name: category,
    value: value.total,
    count: value.count,
    icon: value.icon
  }));

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white px-4 py-2 rounded-lg shadow-lg border border-gray-100">
          <p className="text-sm font-medium text-gray-900">{data.name}</p>
          <p className="text-lg font-semibold text-gray-900">₹{data.value.toLocaleString()}</p>
          <p className="text-xs text-gray-500">{data.count} bill(s)</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <PieChart size={18} className="text-gray-500" />
        <h3 className="text-base font-medium text-gray-900">Category Breakdown</h3>
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
      
      {/* Category List */}
      <div className="mt-6 space-y-2">
        {data.map((category, idx) => (
          <div key={idx} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span className="text-base">{category.icon}</span>
              <span className="text-gray-700">{category.name}</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-gray-900 font-medium">₹{category.value.toLocaleString()}</span>
              <span className="text-xs text-gray-400 w-12 text-right">{category.count} bills</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CategoryBreakdown;