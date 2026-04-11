import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, Calendar, BarChart3, History, TrendingUp, Bell, Target
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
import Layout from '../components/Layout/Layout'; // Import Layout component

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

const Budgets = () => {
  const navigate = useNavigate();
  const { user } = useAuth(); // Remove logout from here as Layout handles it
  
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
    <Layout>
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
          <div className="flex gap-6 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 pb-3 px-1 transition-all whitespace-nowrap ${
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
    </Layout>
  );
};

export default Budgets;