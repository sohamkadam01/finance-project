import React, { useState, useEffect, useCallback } from 'react';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { motion } from 'framer-motion';
import { 
  Wallet, Percent, TrendingUp, 
  LayoutDashboard, CreditCard, Target, Settings, Bell, Search, LogOut, ShieldCheck 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Components
import NetWorthChart from '../components/Dashboard/NetWorthChart';
import CashFlowChart from '../components/Dashboard/CashFlowChart';
import QuickActions from '../components/Dashboard/QuickActions';
import RecentTransactions from '../components/Dashboard/RecentTransactions';

// Hooks
import { useDashboardData } from '../hooks/useDashboardData';
import { useAuth } from '../context/AuthContext';

const queryClient = new QueryClient();

const getTimeOfDay = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
};

// Simplified CountUp Animation Component - FIXED
const CountUp = ({ end, duration = 2000, start = 0, suffix = '', prefix = '', trigger = false }) => {
  const [count, setCount] = useState(start);
  
  useEffect(() => {
    if (!trigger && end === 0) return;
    
    let startTime = null;
    let animationFrame = null;
    
    const animate = (currentTime) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      // Easing function for smooth animation
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
  }, [end, start, duration, trigger]);
  
  return (
    <span>
      {prefix}
      {Math.floor(count).toLocaleString()}
      {suffix}
    </span>
  );
};

// Animated Progress Bar Component - FIXED
const AnimatedProgressBar = ({ value, color, duration = 1500, height = 'h-1.5', showValue = false, label = '', trigger = false }) => {
  const [width, setWidth] = useState(0);
  
  useEffect(() => {
    if (!trigger && value === 0) return;
    
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
  }, [value, duration, trigger]);

  const getColorClass = () => {
    if (color) return color;
    if (value >= 80) return 'bg-green-500';
    if (value >= 60) return 'bg-blue-500';
    if (value >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="w-full">
      {showValue && (
        <div className="flex justify-between mb-1">
          <span className="text-xs text-gray-500">{label}</span>
          <span className="text-xs font-medium text-gray-700">{Math.round(width)}%</span>
        </div>
      )}
      <div className={`w-full bg-gray-100 rounded-full overflow-hidden ${height}`}>
        <div
          className={`rounded-full transition-all duration-75 ${getColorClass()}`}
          style={{ width: `${width}%`, height: '100%' }}
        />
      </div>
    </div>
  );
};

// Main Dashboard Content Component
const DashboardContent = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  const [animationsStarted, setAnimationsStarted] = useState(false);
  
  // ✅ ALL HOOKS CALLED FIRST - before any conditional returns
  const {
    netWorth,
    netWorthTrend,
    savingsRate,
    financialHealth,
    recentTransactions,
    isLoading,
    isError,
    refetchAll
  } = useDashboardData();
  
  const userName = user?.name || 'User';
  const userInitials = userName !== 'User' 
    ? userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleRefresh = async () => {
    setAnimationsStarted(false);
    await refetchAll();
    setRefreshKey(prev => prev + 1);
    // Small delay to reset animations
    setTimeout(() => {
      setAnimationsStarted(true);
    }, 100);
  };

  // Start animations when data is loaded
  useEffect(() => {
    if (!isLoading && netWorth && savingsRate !== undefined && financialHealth !== undefined) {
      setAnimationsStarted(true);
    }
  }, [isLoading, netWorth, savingsRate, financialHealth]);

  // ✅ Conditional returns AFTER all hooks
  if (isError) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-red-500 mb-4">Failed to load dashboard data</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-600 text-white rounded-xl"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5, staggerChildren: 0.1 }
    }
  };

  const balanceValue = netWorth?.currentNetWorth || 0;
  const savingsRateValue = savingsRate?.currentSavingsRate || 0;
  const healthScore = financialHealth?.overallScore || 0;

  // Loading skeleton
  if (isLoading && !netWorth) {
    return (
      <div className="flex min-h-screen bg-[#FDFDFF]">
        <aside className="w-20 lg:w-64 bg-white border-r border-gray-100 hidden md:flex flex-col">
          <div className="p-6">
            <div className="w-10 h-10 bg-gray-200 rounded-2xl animate-pulse" />
          </div>
        </aside>
        <main className="flex-1">
          <div className="p-8">
            <div className="animate-pulse space-y-6">
              <div className="h-8 bg-gray-200 rounded w-1/4" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="h-32 bg-gray-200 rounded-xl" />
                <div className="h-32 bg-gray-200 rounded-xl" />
                <div className="h-32 bg-gray-200 rounded-xl" />
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#FDFDFF]">
      {/* Sidebar */}
      <aside className="w-20 lg:w-64 bg-white border-r border-gray-100 hidden md:flex flex-col sticky h-screen top-0">
        <div className="p-6 flex justify-center lg:justify-start">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
              <TrendingUp size={22} strokeWidth={2.5} />
            </div>
            <span className="hidden lg:block font-bold text-xl tracking-tight text-slate-800">FinCore</span>
          </div>
        </div>
        
        <nav className="flex-1 px-4 mt-4 space-y-1">
          {[
            { id: 'overview', icon: LayoutDashboard, label: 'Overview' },
            { id: 'assets', icon: Wallet, label: 'Assets' },
            { id: 'cards', icon: CreditCard, label: 'Cards' },
            { id: 'goals', icon: Target, label: 'Goals' },
            { id: 'settings', icon: Settings, label: 'Settings' }
          ].map((item) => (
            <button
              key={item.id}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all text-gray-500 hover:bg-gray-50"
            >
              <item.icon size={20} strokeWidth={2} />
              <span className="hidden lg:block font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Logout button at bottom */}
        <div className="p-4 mt-auto border-t border-gray-100">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all text-red-500 hover:bg-red-50"
          >
            <LogOut size={20} />
            <span className="hidden lg:block font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {/* Header */}
        <header className="h-20 bg-white/60 backdrop-blur-xl sticky top-0 z-50 border-b border-gray-100 flex items-center justify-between px-4 md:px-8">
          <div className="flex items-center gap-6 flex-1">
            <h2 className="hidden lg:block text-lg font-bold text-slate-800">Dashboard</h2>
            <div className="flex items-center gap-3 bg-gray-100/80 px-4 py-2.5 rounded-2xl w-full max-w-md">
              <Search size={18} className="text-gray-400" />
              <input 
                type="text" 
                placeholder="Search..." 
                className="bg-transparent border-none outline-none text-sm w-full font-medium"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2.5 text-gray-500 hover:bg-gray-100 rounded-full transition-colors relative">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-blue-600 rounded-full ring-2 ring-white"></span>
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-bold text-white text-sm">
                {userInitials}
              </div>
              <div className="hidden lg:block">
                <p className="text-sm font-semibold text-gray-800">{userName}</p>
                <p className="text-xs text-gray-400">{user?.email || ''}</p>
              </div>
            </div>
          </div>
        </header>

        <motion.div 
          key={refreshKey}
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 md:space-y-8"
        >
          {/* Welcome Section */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-medium text-gray-900 tracking-tight">
                Good {getTimeOfDay()}, {userName.split(' ')[0]}
              </h1>
              <p className="text-gray-500 text-sm md:text-base mt-1">
                Here's your financial overview
              </p>
            </div>
            
            {/* Date display */}
            <div className="hidden md:block">
              <p className="text-sm text-gray-400">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>

          {/* Quick Actions - Pass refresh function */}
          <QuickActions onRefresh={handleRefresh} />

          {/* Core Metrics Grid with Animations */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-gray-200 rounded-xl overflow-hidden">
            
            {/* Total Balance with CountUp Animation */}
            <div className="bg-white p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-normal">Total Balance</p>
                  <p className="text-2xl font-normal text-gray-900 mt-1">
                    <CountUp 
                      end={balanceValue} 
                      duration={2000} 
                      prefix="₹"
                      trigger={animationsStarted}
                    />
                  </p>
                </div>
                <Wallet size={24} className="text-gray-400" />
              </div>
              <div className="mt-3 flex items-center gap-1">
                <span className={`text-sm ${netWorth?.percentageChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {netWorth?.percentageChange >= 0 ? '↑' : '↓'} {Math.abs(netWorth?.percentageChange || 0)}%
                </span>
                <span className="text-xs text-gray-400">from last month</span>
              </div>
            </div>

            {/* Savings Rate with Animated Progress Bar */}
            <div className="bg-white p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-normal">Savings Rate</p>
                  <p className="text-2xl font-normal text-gray-900 mt-1">
                    <CountUp 
                      end={savingsRateValue} 
                      duration={2000} 
                      suffix="%"
                      trigger={animationsStarted}
                    />
                  </p>
                </div>
                <Percent size={24} className="text-gray-400" />
              </div>
              <div className="mt-3">
                <AnimatedProgressBar 
                  value={savingsRateValue} 
                  duration={1500}
                  height="h-1.5"
                  trigger={animationsStarted}
                />
                <p className="text-xs text-gray-400 mt-2">
                  {savingsRateValue >= 20 ? '🎯 On track' : savingsRateValue >= 10 ? '📈 Getting there' : '📈 Aim for 20%'}
                </p>
              </div>
            </div>

            {/* Financial Health with Animated Progress Bar */}
            <div className="bg-white p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-normal">Financial Health</p>
                  <p className="text-2xl font-normal text-gray-900 mt-1">
                    <CountUp 
                      end={healthScore} 
                      duration={2000}
                      trigger={animationsStarted}
                    />
                    <span className="text-sm text-gray-400 ml-1">/100</span>
                  </p>
                </div>
                <ShieldCheck size={24} className="text-gray-400" />
              </div>
              <div className="mt-3">
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <AnimatedProgressBar 
                      value={healthScore} 
                      duration={1500}
                      height="h-1.5"
                      trigger={animationsStarted}
                    />
                  </div>
                  <span className="text-xs text-gray-400">
                    {financialHealth?.grade || 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
            <div className="lg:col-span-7">
              <NetWorthChart 
                data={netWorthTrend}
                loading={isLoading}
              />
            </div>
            <div className="lg:col-span-5">
              <CashFlowChart 
                data={savingsRate}
                loading={isLoading}
              />
            </div>
          </div>

          {/* Recent Transactions */}
          <RecentTransactions 
            transactions={recentTransactions}
            loading={isLoading}
          />
        </motion.div>
      </main>
    </div>
  );
};

// Main Dashboard Component with QueryClientProvider
const Dashboard = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <DashboardContent />
    </QueryClientProvider>
  );
};

export default Dashboard;