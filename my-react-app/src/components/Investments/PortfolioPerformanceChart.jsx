import React from 'react';
import { TrendingUp, TrendingDown, BarChart3 } from 'lucide-react'; // Combined import statement
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

const PortfolioPerformanceChart = ({ performance, loading, period }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-64 bg-gray-100 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (!performance || !performance.performanceHistory || performance.performanceHistory.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
        <BarChart3 size={32} className="text-gray-300 mx-auto mb-3" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No performance data available</h3>
        <p className="text-gray-500">Add investments to see your portfolio performance</p>
      </div>
    );
  }

  const chartData = performance.performanceHistory.map(point => ({
    date: new Date(point.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
    value: point.value ?? point.currentValue ?? 0,
    invested: point.investedAmount ?? point.amountInvested ?? point.invested ?? 0,
    returns: point.returns ?? point.profitLoss ?? 0
  }));

  const formatYAxis = (value) => {
    if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
    if (value >= 1000) return `₹${(value / 1000).toFixed(0)}k`;
    return `₹${value}`;
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white px-4 py-3 rounded-lg shadow-lg border border-gray-100">
          <p className="text-xs text-gray-500 mb-2">{label}</p>
          <p className="text-sm font-medium text-blue-600">Value: ₹{data.value?.toLocaleString()}</p>
          <p className="text-xs text-gray-500">Invested: ₹{data.invested?.toLocaleString()}</p>
          <p className={`text-xs font-medium ${data.returns >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            Returns: ₹{data.returns?.toLocaleString()}
          </p>
        </div>
      );
    }
    return null;
  };

  const { returnsAnalysis } = performance;
  const totalReturn = returnsAnalysis?.totalReturnsPercentage || 0;
  const isPositive = totalReturn >= 0;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h3 className="text-base font-medium text-gray-900">Portfolio Value Over Time</h3>
          <p className="text-sm text-gray-500 mt-0.5">Period: {period}</p>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${isPositive ? 'bg-green-50' : 'bg-red-50'}`}>
          {isPositive ? <TrendingUp size={14} className="text-green-600" /> : <TrendingDown size={14} className="text-red-600" />}
          <span className={`text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {isPositive ? '+' : ''}{totalReturn.toFixed(1)}% total return
          </span>
        </div>
      </div>
      
      <div className="p-6">
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
              <defs>
                <linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.15}/>
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="investedGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#94a3b8" stopOpacity={0.1}/>
                  <stop offset="100%" stopColor="#94a3b8" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <XAxis 
                dataKey="date" 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#6b7280', fontSize: 11 }}
                dy={8}
              />
              <YAxis 
                tickFormatter={formatYAxis}
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#6b7280', fontSize: 11 }}
                width={60}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#e5e7eb', strokeWidth: 1 }} />
              <Legend verticalAlign="top" height={36}/>
              <Area 
                name="Invested Amount"
                type="monotone" 
                dataKey="invested" 
                stroke="#94a3b8" 
                strokeWidth={2}
                strokeDasharray="5 5"
                fill="url(#investedGradient)"
                animationDuration={1000}
              />
              <Area 
                name="Portfolio Value"
                type="monotone" 
                dataKey="value" 
                stroke="#3b82f6" 
                strokeWidth={2}
                fill="url(#portfolioGradient)"
                animationDuration={1000}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Key Metrics */}
        {returnsAnalysis && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-4 border-t border-gray-100">
            <div>
              <p className="text-xs text-gray-500">CAGR</p>
              <p className={`text-base font-semibold ${returnsAnalysis.cagr >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {returnsAnalysis.cagr > 0 ? '+' : ''}{returnsAnalysis.cagr.toFixed(1)}%
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Volatility</p>
              <p className="text-base font-semibold text-gray-900">{returnsAnalysis.volatility.toFixed(1)}%</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Sharpe Ratio</p>
              <p className="text-base font-semibold text-gray-900">{returnsAnalysis.sharpeRatio.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Max Drawdown</p>
              <p className="text-base font-semibold text-red-600">{Math.abs(returnsAnalysis.maxDrawdown).toFixed(1)}%</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PortfolioPerformanceChart;