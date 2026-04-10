import React from 'react';
import { TrendingUp, TrendingDown, Award, AlertTriangle, CheckCircle, Info, ChevronRight } from 'lucide-react';

const BudgetPerformance = ({ performance, loading }) => {
  if (loading) {
    return (
      <div className="space-y-6">
        {/* Skeleton Loader - Google Material Style */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="p-8 animate-pulse">
            <div className="flex items-center gap-6">
              <div className="w-28 h-28 rounded-full bg-gray-100"></div>
              <div className="flex-1 space-y-3">
                <div className="h-6 w-48 bg-gray-100 rounded"></div>
                <div className="h-4 w-32 bg-gray-100 rounded"></div>
              </div>
            </div>
            <div className="mt-6 h-12 bg-gray-100 rounded-lg"></div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          <div className="h-6 w-40 bg-gray-100 rounded mb-6"></div>
          <div className="grid grid-cols-4 gap-4">
            {[1,2,3,4].map(i => (
              <div key={i} className="space-y-2">
                <div className="h-3 w-16 bg-gray-100 rounded"></div>
                <div className="h-8 w-20 bg-gray-100 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!performance) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <TrendingUp size={32} className="text-gray-300" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No performance data yet</h3>
        <p className="text-gray-500 text-sm">Create budgets to start tracking your performance</p>
        <button className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
          Create Budget
        </button>
      </div>
    );
  }

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-amber-600';
    return 'text-red-600';
  };

  const getScoreRingColor = (score) => {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#3b82f6';
    if (score >= 40) return '#f59e0b';
    return '#ef4444';
  };

  // Calculate circle circumference
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (performance.overallPerformanceScore / 100) * circumference;

  return (
    <div className="space-y-6">
      {/* Hero Score Card - Google Material Style */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
            {/* Score Circle */}
            <div className="flex items-center gap-8">
              <div className="relative flex-shrink-0">
                <svg width="120" height="120" viewBox="0 0 120 120" className="transform -rotate-90">
                  <circle
                    cx="60"
                    cy="60"
                    r={radius}
                    fill="none"
                    stroke="#e5e7eb"
                    strokeWidth="8"
                  />
                  <circle
                    cx="60"
                    cy="60"
                    r={radius}
                    fill="none"
                    stroke={getScoreRingColor(performance.overallPerformanceScore)}
                    strokeWidth="8"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-3xl font-bold ${getScoreColor(performance.overallPerformanceScore)}`}>
                    {performance.overallPerformanceScore}
                  </span>
                  <span className="text-xs text-gray-400 mt-0.5">/100</span>
                </div>
              </div>
              
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-xl font-medium text-gray-900">Budget Performance</h3>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    performance.performanceStatus === 'EXCELLENT' ? 'bg-green-50 text-green-700' :
                    performance.performanceStatus === 'GOOD' ? 'bg-blue-50 text-blue-700' :
                    performance.performanceStatus === 'AVERAGE' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'
                  }`}>
                    {performance.performanceStatus}
                  </span>
                </div>
                <p className="text-sm text-gray-500">Grade: <span className="font-medium">{performance.performanceGrade}</span></p>
                
                {performance.trend && (
                  <div className="flex items-center gap-2 mt-3">
                    {performance.trend.direction === 'IMPROVING' ? (
                      <TrendingUp size={16} className="text-green-500" />
                    ) : performance.trend.direction === 'DECLINING' ? (
                      <TrendingDown size={16} className="text-red-500" />
                    ) : null}
                    <span className="text-sm text-gray-600">
                      {performance.trend.direction} • {Math.abs(performance.trend.changePercentage)}% from last month
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Stats */}
            {performance.summary && (
              <div className="flex gap-6">
                <div className="text-center">
                  <p className="text-2xl font-semibold text-gray-900">{performance.summary.totalCategoriesWithBudget}</p>
                  <p className="text-xs text-gray-500">Categories</p>
                </div>
                <div className="w-px bg-gray-200"></div>
                <div className="text-center">
                  <p className="text-2xl font-semibold text-green-600">{performance.summary.categoriesOnTrack}</p>
                  <p className="text-xs text-gray-500">On Track</p>
                </div>
                <div className="w-px bg-gray-200"></div>
                <div className="text-center">
                  <p className="text-2xl font-semibold text-amber-600">{performance.summary.categoriesAtRisk}</p>
                  <p className="text-xs text-gray-500">At Risk</p>
                </div>
                <div className="w-px bg-gray-200"></div>
                <div className="text-center">
                  <p className="text-2xl font-semibold text-red-600">{performance.summary.categoriesExceeded}</p>
                  <p className="text-xs text-gray-500">Exceeded</p>
                </div>
              </div>
            )}
          </div>

          {/* Insight Banner */}
          {performance.overallInsight && (
            <div className="mt-6 p-4 bg-blue-50 rounded-xl flex items-start gap-3">
              <Info size={18} className="text-blue-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-800">{performance.overallInsight}</p>
            </div>
          )}
        </div>
      </div>

      {/* Best & Worst Performers */}
      {performance.summary && (performance.summary.bestPerformingCategory || performance.summary.worstPerformingCategory) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Best Performer */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-green-50 rounded-full flex items-center justify-center">
                <TrendingUp size={16} className="text-green-600" />
              </div>
              <h4 className="text-sm font-medium text-gray-700">Best Performing</h4>
            </div>
            <p className="text-lg font-semibold text-gray-900">{performance.summary.bestPerformingCategory || '—'}</p>
            <p className="text-xs text-gray-400 mt-1">Lowest budget utilization</p>
          </div>

          {/* Worst Performer */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-red-50 rounded-full flex items-center justify-center">
                <TrendingDown size={16} className="text-red-600" />
              </div>
              <h4 className="text-sm font-medium text-gray-700">Needs Improvement</h4>
            </div>
            <p className="text-lg font-semibold text-gray-900">{performance.summary.worstPerformingCategory || '—'}</p>
            <p className="text-xs text-gray-400 mt-1">Highest budget utilization</p>
          </div>
        </div>
      )}

      {/* Achievements */}
      {performance.achievements && performance.achievements.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-5">
            <Award size={20} className="text-amber-500" />
            <h3 className="text-base font-medium text-gray-900">Achievements</h3>
          </div>
          <div className="flex flex-wrap gap-3">
            {performance.achievements.map((achievement, idx) => (
              <div key={idx} className="flex items-center gap-2 px-3 py-2 bg-green-50 rounded-full">
                <CheckCircle size={14} className="text-green-600" />
                <span className="text-sm text-green-700">{achievement}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Category Performance Table - Google Material Style */}
      {performance.categoryPerformance && performance.categoryPerformance.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100">
            <h3 className="text-base font-medium text-gray-900">Category Breakdown</h3>
            <p className="text-sm text-gray-500 mt-0.5">Budget vs actual spending by category</p>
          </div>
          
          <div className="divide-y divide-gray-100">
            {performance.categoryPerformance.map((category, idx) => (
              <div key={idx} className="px-6 py-5 hover:bg-gray-50/50 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-xl">
                      {category.categoryIcon || '📊'}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{category.categoryName}</h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-gray-500">
                          Budget: ₹{category.budgeted?.toLocaleString()}
                        </span>
                        <span className="text-xs text-gray-300">•</span>
                        <span className="text-xs text-gray-500">
                          Spent: ₹{category.spent?.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      category.performanceLevel === 'EXCELLENT' ? 'bg-green-50 text-green-700' :
                      category.performanceLevel === 'GOOD' ? 'bg-blue-50 text-blue-700' :
                      category.performanceLevel === 'FAIR' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'
                    }`}>
                      {category.performanceLevel}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Score: {category.performanceScore}</p>
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Utilization</span>
                    <span>{category.utilizationPercentage}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        category.utilizationPercentage <= 80 ? 'bg-green-500' :
                        category.utilizationPercentage <= 100 ? 'bg-amber-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(category.utilizationPercentage, 100)}%` }}
                    />
                  </div>
                </div>
                
                {/* Insight and Trend */}
                <div className="flex items-center justify-between mt-2">
                  {category.insight && (
                    <p className="text-xs text-gray-500">{category.insight}</p>
                  )}
                  {category.trend && (
                    <div className="flex items-center gap-1">
                      {category.trend === 'IMPROVING' ? (
                        <TrendingUp size={12} className="text-green-500" />
                      ) : category.trend === 'DECLINING' ? (
                        <TrendingDown size={12} className="text-red-500" />
                      ) : null}
                      <span className="text-xs text-gray-400 capitalize">{category.trend}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations - Google Style */}
      {performance.recommendations && performance.recommendations.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100">
            <h3 className="text-base font-medium text-gray-900">Recommendations</h3>
            <p className="text-sm text-gray-500 mt-0.5">Personalized suggestions to improve your budget performance</p>
          </div>
          <div className="divide-y divide-gray-100">
            {performance.recommendations.map((rec, idx) => (
              <div key={idx} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors group">
                <div className="flex items-start gap-3">
                  <AlertTriangle size={16} className="text-blue-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-700">{rec}</span>
                </div>
                <ChevronRight size={16} className="text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BudgetPerformance;