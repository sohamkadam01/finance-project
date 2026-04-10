import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { PieChart as PieChartIcon } from 'lucide-react';

const AssetAllocationChart = ({ allocation, loading }) => {
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

  if (!allocation || allocation.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
        <PieChartIcon size={32} className="text-gray-300 mx-auto mb-3" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No allocation data</h3>
        <p className="text-gray-500">Add investments to see your asset allocation</p>
      </div>
    );
  }

  const data = allocation.map(item => ({
    name: item.assetType,
    value: item.amount,
    percentage: item.percentage,
    returns: item.returns,
    icon: item.icon,
    color: item.color
  }));

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white px-4 py-3 rounded-lg shadow-lg border border-gray-100">
          <p className="text-sm font-medium text-gray-900">{data.name}</p>
          <p className="text-lg font-semibold text-gray-900">₹{data.value.toLocaleString()}</p>
          <p className="text-xs text-gray-500">{data.percentage}% of portfolio</p>
          <p className={`text-xs mt-1 ${data.returns >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            Avg Return: {data.returns > 0 ? '+' : ''}{data.returns}%
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <PieChartIcon size={18} className="text-gray-500" />
        <h3 className="text-base font-medium text-gray-900">Asset Allocation</h3>
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
                <Cell key={`cell-${index}`} fill={entry.color} />
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
      
      {/* Allocation List */}
      <div className="mt-6 space-y-2">
        {data.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span className="text-base">{item.icon}</span>
              <span className="text-gray-700">{item.name}</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-gray-900 font-medium">₹{item.value.toLocaleString()}</span>
              <span className="text-xs text-gray-400 w-16 text-right">{item.percentage}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AssetAllocationChart;