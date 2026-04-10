import React, { useState, useEffect, useRef } from 'react';
import { Calendar, TrendingUp, TrendingDown, Eye, ChevronRight, Award, Target, PieChart } from 'lucide-react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

// Scroll-Triggered CountUp Animation Component
const CountUp = ({ end, duration = 2000, start = 0, suffix = '', prefix = '', delay = 0, decimals = 0 }) => {
  const [count, setCount] = useState(start);
  const [hasAnimated, setHasAnimated] = useState(false);
  const elementRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          
          setTimeout(() => {
            let startTime = null;
            let animationFrame = null;
            
            const animate = (currentTime) => {
              if (!startTime) startTime = currentTime;
              const progress = Math.min((currentTime - startTime) / duration, 1);
              const easeOutCubic = 1 - Math.pow(1 - progress, 3);
              const currentCount = start + (end - start) * easeOutCubic;
              setCount(currentCount);
              
              if (progress < 1) {
                animationFrame = requestAnimationFrame(animate);
              } else {
                setCount(end);
              }
            };
            
            animationFrame = requestAnimationFrame(animate);
            
            return () => {
              if (animationFrame) {
                cancelAnimationFrame(animationFrame);
              }
            };
          }, delay);
        }
      },
      { threshold: 0.1, triggerOnce: true }
    );
    
    if (elementRef.current) {
      observer.observe(elementRef.current);
    }
    
    return () => {
      if (elementRef.current) {
        observer.unobserve(elementRef.current);
      }
    };
  }, [end, start, duration, hasAnimated, delay]);

  const formattedValue = decimals > 0 
    ? count.toFixed(decimals) 
    : Math.floor(count);

  return (
    <span ref={elementRef}>
      {prefix}
      {formattedValue.toLocaleString()}
      {suffix}
    </span>
  );
};

// Scroll-Triggered Animated Progress Bar Component
const AnimatedProgressBar = ({ value, duration = 1500, height = 'h-2', delay = 0 }) => {
  const [width, setWidth] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const elementRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          
          setTimeout(() => {
            let startTime = null;
            let animationFrame = null;
            
            const animate = (currentTime) => {
              if (!startTime) startTime = currentTime;
              const progress = Math.min((currentTime - startTime) / duration, 1);
              const easeOutCubic = 1 - Math.pow(1 - progress, 3);
              const currentWidth = value * easeOutCubic;
              setWidth(currentWidth);
              
              if (progress < 1) {
                animationFrame = requestAnimationFrame(animate);
              } else {
                setWidth(value);
              }
            };
            
            animationFrame = requestAnimationFrame(animate);
            
            return () => {
              if (animationFrame) {
                cancelAnimationFrame(animationFrame);
              }
            };
          }, delay);
        }
      },
      { threshold: 0.1, triggerOnce: true }
    );
    
    if (elementRef.current) {
      observer.observe(elementRef.current);
    }
    
    return () => {
      if (elementRef.current) {
        observer.unobserve(elementRef.current);
      }
    };
  }, [value, duration, hasAnimated, delay]);

  const getColorClass = () => {
    if (value <= 80) return 'bg-green-500';
    if (value <= 100) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <div ref={elementRef} className="w-full">
      <div className={`w-full bg-gray-200 rounded-full overflow-hidden ${height}`}>
        <div
          className={`rounded-full transition-all duration-75 ${getColorClass()}`}
          style={{ width: `${Math.min(width, 100)}%`, height: '100%' }}
        />
      </div>
    </div>
  );
};

const BudgetHistory = ({ selectedMonth }) => {
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedMonth, setExpandedMonth] = useState(null);

  useEffect(() => {
    fetchHistory();
  }, [selectedMonth]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/budgets/history?months=12`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHistory(response.data.history);
    } catch (err) {
      console.error('Failed to fetch budget history:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleMonthExpand = (index) => {
    setExpandedMonth(expandedMonth === index ? null : index);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Skeleton Loader */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 animate-pulse">
          <div className="h-6 w-40 bg-gray-200 rounded mb-4"></div>
          <div className="grid grid-cols-4 gap-4 mb-6">
            {[1,2,3,4].map(i => (
              <div key={i} className="space-y-2">
                <div className="h-3 w-16 bg-gray-200 rounded"></div>
                <div className="h-8 w-20 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
          <div className="h-64 bg-gray-100 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (!history) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <Calendar size={32} className="text-gray-300" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No budget history yet</h3>
        <p className="text-gray-500 text-sm">Create budgets to start tracking your history</p>
        <button className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
          Create Budget
        </button>
      </div>
    );
  }

  const monthlyHistory = history.monthlyHistory || [];
  const categoryAverages = history.categoryAverages || {};

  return (
    <div className="space-y-6">
      {/* Hero Stats - Google Material Style with Counter Animations */}
      {history.performanceSummary && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100">
            <h3 className="text-base font-medium text-gray-900">Performance Overview</h3>
            <p className="text-sm text-gray-500 mt-0.5">12-month budget performance summary</p>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <p className="text-sm text-gray-500 mb-1">Months Tracked</p>
                <p className="text-2xl font-semibold text-gray-900">
                  <CountUp end={history.performanceSummary.totalMonthsTracked || 0} duration={2000} delay={0} />
                </p>
                <p className="text-xs text-gray-400 mt-1">Total period</p>
              </div>
              <div className="border-l border-gray-100 pl-6">
                <p className="text-sm text-gray-500 mb-1">On Track</p>
                <p className="text-2xl font-semibold text-green-600">
                  <CountUp end={history.performanceSummary.monthsOnTrack || 0} duration={2000} delay={100} />
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  <CountUp 
                    end={(history.performanceSummary.monthsOnTrack / history.performanceSummary.totalMonthsTracked) * 100 || 0} 
                    duration={2000} 
                    suffix="% of time"
                    delay={100}
                    decimals={0}
                  />
                </p>
              </div>
              <div className="border-l border-gray-100 pl-6">
                <p className="text-sm text-gray-500 mb-1">Over Budget</p>
                <p className="text-2xl font-semibold text-red-600">
                  <CountUp end={history.performanceSummary.monthsOverBudget || 0} duration={2000} delay={200} />
                </p>
                <p className="text-xs text-gray-400 mt-1">Needs improvement</p>
              </div>
              <div className="border-l border-gray-100 pl-6">
                <p className="text-sm text-gray-500 mb-1">Avg Utilization</p>
                <p className="text-2xl font-semibold text-gray-900">
                  <CountUp 
                    end={history.performanceSummary.averageUtilization || 0} 
                    duration={2000} 
                    suffix="%"
                    delay={300}
                    decimals={1}
                  />
                </p>
                <p className="text-xs text-gray-400 mt-1">Overall efficiency</p>
              </div>
            </div>
            
            {/* Best & Worst Months */}
            <div className="mt-6 pt-6 border-t border-gray-100 flex flex-col sm:flex-row justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-50 rounded-full flex items-center justify-center">
                  <Award size={16} className="text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Best Month</p>
                  <p className="text-sm font-medium text-gray-900">{history.performanceSummary.bestMonth || '—'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-red-50 rounded-full flex items-center justify-center">
                  <TrendingDown size={16} className="text-red-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Needs Improvement</p>
                  <p className="text-sm font-medium text-gray-900">{history.performanceSummary.worstMonth || '—'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Monthly History Timeline - Google Material Timeline */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100">
          <h3 className="text-base font-medium text-gray-900">Monthly History</h3>
          <p className="text-sm text-gray-500 mt-0.5">Your budget performance month by month</p>
        </div>
        
        <div className="divide-y divide-gray-100">
          {monthlyHistory.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-500">No monthly data available</p>
            </div>
          ) : (
            monthlyHistory.map((month, idx) => {
              const isExpanded = expandedMonth === idx;
              const utilization = month.overallUtilization;
              const status = utilization <= 80 ? 'On Track' : utilization <= 100 ? 'At Risk' : 'Exceeded';
              const statusColor = utilization <= 80 ? 'text-green-600 bg-green-50' : 
                                  utilization <= 100 ? 'text-amber-600 bg-amber-50' : 'text-red-600 bg-red-50';
              
              return (
                <div key={idx} className="hover:bg-gray-50/50 transition-colors">
                  {/* Month Header - Clickable */}
                  <button
                    onClick={() => toggleMonthExpand(idx)}
                    className="w-full px-6 py-4 flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center">
                        <Calendar size={18} className="text-gray-500" />
                      </div>
                      <div className="text-left">
                        <h4 className="font-medium text-gray-900">
                          {new Date(month.month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${statusColor}`}>
                            {status}
                          </span>
                          <span className="text-xs text-gray-400">
                            <CountUp end={month.budgetCount || 0} duration={1500} suffix=" categories" delay={idx * 50} />
                          </span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight 
                      size={18} 
                      className={`text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} 
                    />
                  </button>
                  
                  {/* Expanded Details - Google Material Style with Counter Animations */}
                  {isExpanded && (
                    <div className="px-6 pb-5 pt-2 border-t border-gray-100 bg-gray-50/30">
                      {/* Stats Grid */}
                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div className="bg-white rounded-xl p-3 text-center shadow-sm">
                          <p className="text-xs text-gray-500">Budgeted</p>
                          <p className="text-base font-semibold text-gray-900">
                            <CountUp 
                              end={month.totalBudget || 0} 
                              duration={1500} 
                              prefix="₹"
                              delay={idx * 50 + 100}
                            />
                          </p>
                        </div>
                        <div className="bg-white rounded-xl p-3 text-center shadow-sm">
                          <p className="text-xs text-gray-500">Spent</p>
                          <p className="text-base font-semibold text-gray-900">
                            <CountUp 
                              end={month.totalSpent || 0} 
                              duration={1500} 
                              prefix="₹"
                              delay={idx * 50 + 200}
                            />
                          </p>
                        </div>
                        <div className="bg-white rounded-xl p-3 text-center shadow-sm">
                          <p className="text-xs text-gray-500">Remaining</p>
                          <p className={`text-base font-semibold ${month.remaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            <CountUp 
                              end={Math.abs(month.remaining || 0)} 
                              duration={1500} 
                              prefix={month.remaining >= 0 ? "₹" : "-₹"}
                              delay={idx * 50 + 300}
                            />
                          </p>
                        </div>
                      </div>
                      
                      {/* Progress Bar with Animation */}
                      <div className="mb-4">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>Utilization</span>
                          <span>
                            <CountUp 
                              end={utilization || 0} 
                              duration={1500} 
                              suffix="%"
                              delay={idx * 50 + 400}
                              decimals={1}
                            />
                          </span>
                        </div>
                        <AnimatedProgressBar 
                          value={utilization || 0}
                          duration={1500}
                          height="h-2"
                          delay={idx * 50 + 450}
                        />
                      </div>
                      
                      {/* Category Breakdown */}
                      {month.categoryDetails && month.categoryDetails.length > 0 && (
                        <div className="mt-4">
                          <p className="text-xs font-medium text-gray-500 mb-2">Category Breakdown</p>
                          <div className="space-y-2">
                            {month.categoryDetails.slice(0, 5).map((cat, catIdx) => (
                              <div key={catIdx} className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                  <span className="text-base">{cat.categoryIcon || '📊'}</span>
                                  <span className="text-gray-700">{cat.categoryName}</span>
                                </div>
                                <div className="flex items-center gap-4">
                                  <span className="text-gray-500">
                                    <CountUp 
                                      end={cat.spent || 0} 
                                      duration={1200} 
                                      prefix="₹"
                                      delay={idx * 50 + 500 + (catIdx * 50)}
                                    />
                                  </span>
                                  <span className={`text-xs ${
                                    cat.percentageUsed <= 80 ? 'text-green-600' :
                                    cat.percentageUsed <= 100 ? 'text-amber-600' : 'text-red-600'
                                  }`}>
                                    <CountUp 
                                      end={cat.percentageUsed || 0} 
                                      duration={1200} 
                                      suffix="%"
                                      delay={idx * 50 + 500 + (catIdx * 50)}
                                      decimals={0}
                                    />
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                          {month.categoryDetails.length > 5 && (
                            <p className="text-xs text-gray-400 mt-2">+{month.categoryDetails.length - 5} more categories</p>
                          )}
                        </div>
                      )}
                      
                      {/* Summary Stats with Counters */}
                      <div className="mt-4 pt-3 border-t border-gray-200 flex justify-between text-xs text-gray-400">
                        <span>
                          ✅ <CountUp end={month.budgetCount - month.exceededCount - month.atRiskCount || 0} duration={1000} delay={idx * 50 + 600} /> on track
                        </span>
                        <span>
                          ⚠️ <CountUp end={month.atRiskCount || 0} duration={1000} delay={idx * 50 + 650} /> at risk
                        </span>
                        <span>
                          🔴 <CountUp end={month.exceededCount || 0} duration={1000} delay={idx * 50 + 700} /> exceeded
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Category Averages - Google Material Cards with Counter Animations */}
      {Object.keys(categoryAverages).length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <PieChart size={18} className="text-gray-500" />
              <h3 className="text-base font-medium text-gray-900">Category Averages</h3>
            </div>
            <p className="text-sm text-gray-500 mt-0.5">Average monthly spending by category (last 3 months)</p>
          </div>
          
          <div className="divide-y divide-gray-100">
            {Object.entries(categoryAverages)
              .sort(([, a], [, b]) => b - a)
              .map(([category, amount], idx) => (
                <div key={category} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center text-sm">
                      {category.charAt(0)}
                    </div>
                    <span className="text-sm text-gray-700">{category}</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    <CountUp 
                      end={amount || 0} 
                      duration={1500} 
                      prefix="₹"
                      delay={idx * 100}
                    />
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Empty State for Category Averages */}
      {Object.keys(categoryAverages).length === 0 && monthlyHistory.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
          <Target size={32} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Category averages will appear once you have 3 months of data</p>
        </div>
      )}
    </div>
  );
};

export default BudgetHistory;