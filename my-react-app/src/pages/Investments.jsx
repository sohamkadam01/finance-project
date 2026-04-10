import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, Wallet, Target, TrendingUp, CreditCard, Settings, 
  Bell, Search, LogOut, Plus, BarChart3, PieChart, TrendingDown,
  RefreshCw, AlertCircle, ChevronDown, ChevronUp
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

// Components
import PortfolioSummary from '../components/Investments/PortfolioSummary';
import PortfolioPerformanceChart from '../components/Investments/PortfolioPerformanceChart';
import AssetAllocationChart from '../components/Investments/AssetAllocationChart';
import InvestmentsTable from '../components/Investments/InvestmentsTable';
import AddInvestmentModal from '../components/Investments/AddInvestmentModal';
import UpdateValueModal from '../components/Investments/UpdateValueModal';
import InvestmentInsights from '../components/Investments/InvestmentInsights';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

const Investments = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  
  const [investments, setInvestments] = useState([]);
  const [summary, setSummary] = useState(null);
  const [performance, setPerformance] = useState(null);
  const [assetAllocation, setAssetAllocation] = useState([]);
  const [loading, setLoading] = useState(true);
  const [performancePeriod, setPerformancePeriod] = useState('6M');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [selectedInvestment, setSelectedInvestment] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  // Fetch all investment data
  const fetchInvestmentData = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      
      // Fetch investments list
      const investmentsResponse = await axios.get(`${API_BASE_URL}/investments/my-investments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setInvestments(investmentsResponse.data || []);
      
      // Fetch portfolio summary
      const summaryResponse = await axios.get(`${API_BASE_URL}/investments/summary`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSummary(summaryResponse.data);
      
      // Fetch portfolio performance
      const performanceResponse = await axios.get(`${API_BASE_URL}/investments/performance`, {
        params: { period: performancePeriod },
        headers: { Authorization: `Bearer ${token}` }
      });
      setPerformance(performanceResponse.data.performance);
      
      // Fetch asset allocation
      const allocationResponse = await axios.get(`${API_BASE_URL}/investments/performance/asset-allocation`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAssetAllocation(allocationResponse.data.allocation || []);
      
    } catch (err) {
      console.error('Failed to fetch investment data:', err);
      setError(err.response?.data?.error || 'Failed to load investment data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvestmentData();
  }, [performancePeriod]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchInvestmentData();
    setRefreshing(false);
  };

  const handleUpdateValue = (investment) => {
    setSelectedInvestment(investment);
    setIsUpdateModalOpen(true);
  };

  const handleDeleteInvestment = async (investmentId) => {
    if (!confirm('Are you sure you want to delete this investment?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE_URL}/investments/${investmentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchInvestmentData();
    } catch (err) {
      console.error('Failed to delete investment:', err);
      alert('Failed to delete investment');
    }
  };

  const userName = user?.name || 'User';
  const userInitials = userName !== 'User' 
    ? userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5, staggerChildren: 0.1 }
    }
  };

  const periodOptions = [
    { value: '1M', label: '1 Month' },
    { value: '3M', label: '3 Months' },
    { value: '6M', label: '6 Months' },
    { value: '1Y', label: '1 Year' },
    { value: 'ALL', label: 'All Time' }
  ];

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
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all text-gray-500 hover:bg-gray-50"
          >
            <LayoutDashboard size={20} />
            <span className="hidden lg:block font-medium">Dashboard</span>
          </button>
          <button
            onClick={() => navigate('/transactions')}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all text-gray-500 hover:bg-gray-50"
          >
            <CreditCard size={20} />
            <span className="hidden lg:block font-medium">Transactions</span>
          </button>
          <button
            onClick={() => navigate('/budgets')}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all text-gray-500 hover:bg-gray-50"
          >
            <Target size={20} />
            <span className="hidden lg:block font-medium">Budgets</span>
          </button>
          <button
            onClick={() => navigate('/bill-reminders')}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all text-gray-500 hover:bg-gray-50"
          >
            <Bell size={20} />
            <span className="hidden lg:block font-medium">Bill Reminders</span>
          </button>
          <button
            onClick={() => navigate('/predictions')}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all text-gray-500 hover:bg-gray-50"
          >
            <TrendingUp size={20} />
            <span className="hidden lg:block font-medium">Predictions</span>
          </button>
          <button
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all text-blue-600 bg-blue-50"
          >
            <TrendingUp size={20} />
            <span className="hidden lg:block font-medium">Investments</span>
          </button>
          <button
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all text-gray-500 hover:bg-gray-50"
          >
            <Settings size={20} />
            <span className="hidden lg:block font-medium">Settings</span>
          </button>
        </nav>

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
            <h2 className="hidden lg:block text-lg font-bold text-slate-800">Investments</h2>
            <div className="flex items-center gap-3 bg-gray-100/80 px-4 py-2.5 rounded-2xl w-full max-w-md">
              <Search size={18} className="text-gray-400" />
              <input 
                type="text" 
                placeholder="Search investments..." 
                className="bg-transparent border-none outline-none text-sm w-full font-medium"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2.5 text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
            >
              <RefreshCw size={20} className={refreshing ? 'animate-spin' : ''} />
            </button>
            <button className="p-2.5 text-gray-500 hover:bg-gray-100 rounded-full transition-colors relative">
              <Bell size={20} />
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
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 md:space-y-8"
        >
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-semibold text-gray-900">Investment Portfolio</h1>
              <p className="text-gray-500 text-sm mt-1">Track and manage your investments</p>
            </div>
            <button
              onClick={() => {
                setSelectedInvestment(null);
                setIsAddModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus size={18} />
              Add Investment
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 rounded-2xl p-4 flex items-center gap-3">
              <AlertCircle size={20} className="text-red-500" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Portfolio Summary Cards */}
          <PortfolioSummary summary={summary} loading={loading} />

          {/* Portfolio Performance Chart */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-2">
                <BarChart3 size={18} className="text-gray-500" />
                <h3 className="text-base font-medium text-gray-900">Portfolio Performance</h3>
              </div>
              <div className="flex items-center gap-2">
                {periodOptions.map(option => (
                  <button
                    key={option.value}
                    onClick={() => setPerformancePeriod(option.value)}
                    className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                      performancePeriod === option.value
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
            <PortfolioPerformanceChart 
              performance={performance} 
              loading={loading}
              period={performancePeriod}
            />
          </div>

          {/* Asset Allocation & Insights Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AssetAllocationChart allocation={assetAllocation} loading={loading} />
            <InvestmentInsights 
              performance={performance} 
              summary={summary}
              loading={loading}
            />
          </div>

          {/* Investments Table */}
          <InvestmentsTable 
            investments={investments}
            loading={loading}
            onUpdateValue={handleUpdateValue}
            onDelete={handleDeleteInvestment}
          />
        </motion.div>
      </main>

      {/* Add/Edit Investment Modal */}
      <AddInvestmentModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={fetchInvestmentData}
        editingInvestment={selectedInvestment}
      />

      {/* Update Value Modal */}
      <UpdateValueModal
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
        onSuccess={fetchInvestmentData}
        investment={selectedInvestment}
      />
    </div>
  );
};

export default Investments;