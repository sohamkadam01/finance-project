import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, Wallet, Target, TrendingUp, CreditCard, Settings, 
  Bell, Search, LogOut, Plus, Calendar, AlertCircle, CheckCircle, 
  BarChart3, History, TrendingDown, DollarSign
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

// Components
import BudgetCard from '../components/Budgets/BudgetCard';
import CreateBudgetModal from '../components/Budgets/CreateBudgetModal';
import BudgetSummary from '../components/Budgets/BudgetSummary';
import BudgetHistory from '../components/Budgets/BudgetHistory';
import BudgetPerformance from '../components/Budgets/BudgetPerformance';
import BudgetAlerts from '../components/Budgets/BudgetAlerts';
import CategoryBreakdown from '../components/Budgets/CategoryBreakdown';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

const Budgets = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  
  const [budgets, setBudgets] = useState([]);
  const [summary, setSummary] = useState(null);
  const [performance, setPerformance] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // overview, history, performance, alerts
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);

  // Fetch all budget data
  const fetchBudgetData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const [year, month] = selectedMonth.split('-');
      
      // Fetch budgets for selected month
      const budgetsResponse = await axios.get(
        `${API_BASE_URL}/budgets?year=${year}&month=${month}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setBudgets(budgetsResponse.data.budgets || []);
      setSummary(budgetsResponse.data.summary);
      
      // Fetch performance data
      const performanceResponse = await axios.get(
        `${API_BASE_URL}/budgets/performance`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPerformance(performanceResponse.data.performance);
      
      // Fetch alerts
      const alertsResponse = await axios.get(
        `${API_BASE_URL}/alerts/unread`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAlerts(alertsResponse.data || []);
      
    } catch (err) {
      console.error('Failed to fetch budget data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgetData();
  }, [selectedMonth]);

  const handleMonthChange = (e) => {
    setSelectedMonth(e.target.value);
  };

  const handleEditBudget = (budget) => {
    setEditingBudget(budget);
    setIsCreateModalOpen(true);
  };

  const handleDeleteBudget = async (budgetId) => {
    if (!confirm('Are you sure you want to delete this budget?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE_URL}/budgets/${budgetId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchBudgetData();
    } catch (err) {
      console.error('Failed to delete budget:', err);
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

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'history', label: 'History', icon: History },
    { id: 'performance', label: 'Performance', icon: TrendingUp },
    { id: 'alerts', label: 'Alerts', icon: Bell },
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
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all text-blue-600 bg-blue-50"
          >
            <Target size={20} />
            <span className="hidden lg:block font-medium">Budgets</span>
          </button>
          <button
            onClick={() => navigate('/investments')}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all text-gray-500 hover:bg-gray-50"
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
            <h2 className="hidden lg:block text-lg font-bold text-slate-800">Budgets</h2>
            <div className="flex items-center gap-3 bg-gray-100/80 px-4 py-2.5 rounded-2xl w-full max-w-md">
              <Search size={18} className="text-gray-400" />
              <input 
                type="text" 
                placeholder="Search budgets..." 
                className="bg-transparent border-none outline-none text-sm w-full font-medium"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2.5 text-gray-500 hover:bg-gray-100 rounded-full transition-colors relative">
              <Bell size={20} />
              {alerts.length > 0 && (
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
              )}
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
              <h1 className="text-2xl md:text-3xl font-semibold text-gray-900">Budget Planner</h1>
              <p className="text-gray-500 text-sm mt-1">Track and manage your monthly spending limits</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2">
                <Calendar size={16} className="text-gray-400" />
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={handleMonthChange}
                  className="text-sm border-none outline-none bg-transparent"
                />
              </div>
              <button
                onClick={() => {
                  setEditingBudget(null);
                  setIsCreateModalOpen(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus size={18} />
                Create Budget
              </button>
            </div>
          </div>

          {/* Summary Cards */}
          <BudgetSummary summary={summary} loading={loading} />

          {/* Tabs */}
          <div className="border-b border-gray-100">
            <div className="flex gap-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 pb-3 px-1 transition-all ${
                    activeTab === tab.id
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <tab.icon size={18} />
                  <span className="font-medium">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="space-y-6">
            {activeTab === 'overview' && (
              <>
                {/* Budgets Grid */}
                {budgets.length === 0 ? (
                  <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Target size={24} className="text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No budgets yet</h3>
                    <p className="text-gray-500 mb-4">Create your first budget to start tracking your spending</p>
                    <button
                      onClick={() => setIsCreateModalOpen(true)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      + Create Budget
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {budgets.map((budget) => (
                      <BudgetCard
                        key={budget.budgetId}
                        budget={budget}
                        onEdit={() => handleEditBudget(budget)}
                        onDelete={() => handleDeleteBudget(budget.budgetId)}
                      />
                    ))}
                  </div>
                )}

                {/* Category Breakdown */}
                {budgets.length > 0 && (
                  <CategoryBreakdown budgets={budgets} loading={loading} />
                )}
              </>
            )}

            {activeTab === 'history' && (
              <BudgetHistory selectedMonth={selectedMonth} />
            )}

            {activeTab === 'performance' && (
              <BudgetPerformance performance={performance} loading={loading} />
            )}

            {activeTab === 'alerts' && (
              <BudgetAlerts alerts={alerts} onRefresh={fetchBudgetData} />
            )}
          </div>
        </motion.div>
      </main>

      {/* Create/Edit Budget Modal */}
      <CreateBudgetModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditingBudget(null);
        }}
        onSuccess={fetchBudgetData}
        editingBudget={editingBudget}
        selectedMonth={selectedMonth}
      />
    </div>
  );
};

export default Budgets;