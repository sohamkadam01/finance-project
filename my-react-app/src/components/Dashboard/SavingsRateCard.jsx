import React from 'react';
import { motion } from 'framer-motion';
import { Percent, TrendingUp, TrendingDown } from 'lucide-react';

const SavingsRateCard = ({ savingsRate, loading }) => {
  if (loading) {
    return (
      <div className="bg-white p-6 rounded-3xl border border-gray-100 animate-pulse">
        <div className="h-12 w-12 bg-gray-200 rounded-2xl mb-4"></div>
        <div className="h-4 w-24 bg-gray-200 rounded mb-2"></div>
        <div className="h-8 w-32 bg-gray-200 rounded"></div>
      </div>
    );
  }

  const rate = savingsRate?.currentSavingsRate || 0;
  const status = savingsRate?.savingsStatus || 'FAIR';
  const insight = savingsRate?.insight || '';
  const recommendations = savingsRate?.recommendations || [];

  const getStatusColor = () => {
    if (rate >= 30) return 'text-emerald-600';
    if (rate >= 20) return 'text-blue-600';
    if (rate >= 10) return 'text-yellow-600';
    if (rate >= 0) return 'text-orange-600';
    return 'text-red-600';
  };

  const getStatusBg = () => {
    if (rate >= 30) return 'bg-emerald-500';
    if (rate >= 20) return 'bg-blue-500';
    if (rate >= 10) return 'bg-yellow-500';
    if (rate >= 0) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white p-6 rounded-3xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition-all"
    >
      <div className="flex justify-between items-start mb-4">
        <div className="p-2.5 bg-purple-50/80 rounded-2xl text-purple-600">
          <Percent size={22} />
        </div>
        <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${rate >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
          {rate >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {Math.abs(rate)}% Savings Rate
        </div>
      </div>
      
      <div className="mb-4">
        <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Savings Rate</p>
        <h3 className={`text-3xl font-bold mt-1.5 tracking-tight ${getStatusColor()}`}>
          {rate}%
        </h3>
      </div>
      
      <div className="mb-4">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>0%</span>
          <span>10%</span>
          <span>20%</span>
          <span>30%</span>
          <span>40%</span>
        </div>
        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(rate, 40)}%` }}
            transition={{ duration: 1 }}
            className={`h-full rounded-full ${getStatusBg()}`}
          />
        </div>
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-100">
        <p className="text-sm text-gray-600 font-medium">{insight}</p>
        {recommendations.length > 0 && (
          <p className="text-xs text-gray-500 mt-2 italic">
            💡 {recommendations[0]}
          </p>
        )}
      </div>
    </motion.div>
  );
};

export default SavingsRateCard;