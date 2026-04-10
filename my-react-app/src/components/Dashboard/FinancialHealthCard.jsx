import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, TrendingUp, AlertTriangle } from 'lucide-react';

const FinancialHealthCard = ({ health, loading }) => {
  if (loading) {
    return (
      <div className="bg-white p-6 rounded-3xl border border-gray-100 animate-pulse">
        <div className="flex items-center gap-8">
          <div className="w-28 h-28 rounded-full bg-gray-200"></div>
          <div className="flex-1">
            <div className="h-6 w-32 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 w-full bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  const score = health?.overallScore || 0;
  const status = health?.status || 'FAIR';
  const summary = health?.summary || 'Loading...';
  const strengths = health?.strengths || [];
  const weaknesses = health?.weaknesses || [];

  const getStatusColor = () => {
    switch(status) {
      case 'EXCELLENT': return 'text-emerald-600';
      case 'GOOD': return 'text-blue-600';
      case 'FAIR': return 'text-yellow-600';
      case 'POOR': return 'text-orange-600';
      default: return 'text-red-600';
    }
  };

  const getStatusBg = () => {
    switch(status) {
      case 'EXCELLENT': return 'bg-emerald-500';
      case 'GOOD': return 'bg-blue-500';
      case 'FAIR': return 'bg-yellow-500';
      case 'POOR': return 'bg-orange-500';
      default: return 'bg-red-500';
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white p-6 rounded-3xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.04)] lg:col-span-2 flex flex-col md:flex-row items-center gap-8 group"
    >
      <div className="relative flex-shrink-0">
        <svg className="w-28 h-28 transform -rotate-90 filter drop-shadow-sm">
          <circle
            cx="56" cy="56" r="48"
            stroke="#F1F5F9" strokeWidth="10" fill="transparent"
          />
          <motion.circle
            cx="56" cy="56" r="48"
            stroke="url(#gradientHealth)" strokeWidth="10"
            strokeDasharray={301.6}
            initial={{ strokeDashoffset: 301.6 }}
            animate={{ strokeDashoffset: 301.6 - (301.6 * score) / 100 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            strokeLinecap="round"
            fill="transparent"
          />
          <defs>
            <linearGradient id="gradientHealth" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center rotate-90">
          <span className="text-2xl font-black text-slate-800 tracking-tighter">{score}</span>
          <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Score</span>
        </div>
      </div>
      
      <div className="flex-1 text-center md:text-left">
        <div className="flex items-center gap-2 mb-2 justify-center md:justify-start">
          <div className={`p-1.5 rounded-lg ${getStatusBg()} bg-opacity-10`}>
            <ShieldCheck size={16} className={getStatusColor()} />
          </div>
          <h3 className={`font-bold text-lg ${getStatusColor()}`}>
            Financial Health - {status}
          </h3>
        </div>
        <p className="text-sm text-gray-500 leading-relaxed font-medium">
          {summary}
        </p>
        
        {/* Strengths & Weaknesses */}
        <div className="mt-4 flex flex-wrap gap-3 justify-center md:justify-start">
          {strengths.slice(0, 2).map((strength, idx) => (
            <span key={idx} className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-600 text-xs rounded-full">
              <TrendingUp size={12} />
              {strength}
            </span>
          ))}
          {weaknesses.slice(0, 2).map((weakness, idx) => (
            <span key={idx} className="inline-flex items-center gap-1 px-2 py-1 bg-rose-50 text-rose-600 text-xs rounded-full">
              <AlertTriangle size={12} />
              {weakness}
            </span>
          ))}
        </div>
        
        <div className="mt-4 h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${score}%` }}
            transition={{ duration: 1, delay: 0.5 }}
            className={`h-full rounded-full ${getStatusBg()}`}
          />
        </div>
      </div>
    </motion.div>
  );
};

export default FinancialHealthCard;