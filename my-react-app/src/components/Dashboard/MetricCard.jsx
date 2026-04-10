import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

const MetricCard = ({ title, value, change, icon: Icon, trend, loading }) => {
  if (loading) {
    return (
      <div className="bg-white p-6 rounded-3xl border border-gray-100 animate-pulse">
        <div className="h-12 w-12 bg-gray-200 rounded-2xl mb-4"></div>
        <div className="h-4 w-24 bg-gray-200 rounded mb-2"></div>
        <div className="h-8 w-32 bg-gray-200 rounded"></div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className="bg-white p-6 rounded-3xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition-all"
    >
      <div className="flex justify-between items-start mb-4">
        <div className="p-2.5 bg-blue-50/80 rounded-2xl text-blue-600">
          <Icon size={22} />
        </div>
        <div className={`flex items-center px-2 py-1 rounded-full text-xs font-bold ${
          trend === 'up' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
        }`}>
          {trend === 'up' ? <ArrowUpRight size={14} className="mr-0.5" /> : <ArrowDownRight size={14} className="mr-0.5" />}
          {Math.abs(change)}%
        </div>
      </div>
      <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">{title}</p>
      <h3 className="text-2xl font-bold text-gray-900 mt-1.5 tracking-tight">{value}</h3>
    </motion.div>
  );
};

export default MetricCard;