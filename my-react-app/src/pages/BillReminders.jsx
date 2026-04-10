import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, Wallet, Target, TrendingUp, CreditCard, Settings, 
  Bell, Search, LogOut, Plus, Calendar, List, History, BarChart3,
  ChevronLeft, ChevronRight, AlertCircle, CheckCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

// Components
import BillCalendar from '../components/BillReminders/BillCalendar';
import UpcomingBillsList from '../components/BillReminders/UpcomingBillsList';
import AddBillModal from '../components/BillReminders/AddBillModal';
import BillHistory from '../components/BillReminders/BillHistory';
import MonthlyBillSummary from '../components/BillReminders/MonthlyBillSummary';
import CategoryBreakdown from '../components/BillReminders/CategoryBreakdown';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

const BillReminders = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  
  const [activeTab, setActiveTab] = useState('calendar'); // calendar, upcoming, history, summary
  const [currentDate, setCurrentDate] = useState(new Date());
  const [upcomingBills, setUpcomingBills] = useState([]);
  const [monthlySummary, setMonthlySummary] = useState(null);
  const [billHistory, setBillHistory] = useState(null);
  const [categoryBreakdown, setCategoryBreakdown] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingBill, setEditingBill] = useState(null);

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;

  // Fetch all bill data
  const fetchBillData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // Fetch upcoming bills
      const upcomingResponse = await axios.get(`${API_BASE_URL}/bill-reminders/upcoming`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUpcomingBills(upcomingResponse.data || []);
      
      // Fetch monthly summary
      const summaryResponse = await axios.get(`${API_BOOKINGS_URL}/bill-reminders/monthly-summary/current`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMonthlySummary(summaryResponse.data.summary);
      
      // Fetch bill history
      const historyResponse = await axios.get(`${API_BASE_URL}/bill-reminders/history?months=12`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBillHistory(historyResponse.data.history);
      
      // Fetch category breakdown from bills
      if (upcomingResponse.data) {
        const breakdown = calculateCategoryBreakdown(upcomingResponse.data);
        setCategoryBreakdown(breakdown);
      }
      
    } catch (err) {
      console.error('Failed to fetch bill data:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateCategoryBreakdown = (bills) => {
    const breakdown = {};
    bills.forEach(bill => {
      const category = bill.category || 'Other';
      if (!breakdown[category]) {
        breakdown[category] = { total: 0, count: 0, icon: getCategoryIcon(category) };
      }
      breakdown[category].total += bill.amount;
      breakdown[category].count++;
    });
    return breakdown;
  };

  const getCategoryIcon = (category) => {
    const icons = {
      'Entertainment': '🎬',
      'Utilities': '💡',
      'Shopping': '🛍️',
      'Transport': '🚗',
      'Food': '🍔',
      'Subscription': '📺',
      'Insurance': '🛡️',
      'Other': '📄'
    };
    return icons[category] || '📄';
  };

  useEffect(() => {
    fetchBillData();
  }, []);

  const handlePreviousMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 2, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth, 1));
  };

  const handleMarkAsPaid = async (billId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_BASE_URL}/bill-reminders/${billId}/mark-paid`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchBillData();
    } catch (err) {
      console.error('Failed to mark bill as paid:', err);
    }
  };

  const handleEditBill = (bill) => {
    setEditingBill(bill);
    setIsAddModalOpen(true);
  };

  const handleDeleteBill = async (billId) => {
    if (!confirm('Are you sure you want to delete this bill reminder?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE_URL}/bill-reminders/${billId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchBillData();
    } catch (err) {
      console.error('Failed to delete bill:', err);
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

  const tabs = [
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'upcoming', label: 'Upcoming', icon: List, badge: upcomingBills.filter(b => !b.paid).length },
    { id: 'history', label: 'History', icon: History },
    { id: 'summary', label: 'Summary', icon: BarChart3 },
  ];

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5, staggerChildren: 0.1 }
    }
  };

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
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all text-blue-600 bg-blue-50"
          >
            <Bell size={20} />
            <span className="hidden lg:block font-medium">Bill Reminders</span>
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
            <h2 className="hidden lg:block text-lg font-bold text-slate-800">Bill Reminders</h2>
            <div className="flex items-center gap-3 bg-gray-100/80 px-4 py-2.5 rounded-2xl w-full max-w-md">
              <Search size={18} className="text-gray-400" />
              <input 
                type="text" 
                placeholder="Search bills..." 
                className="bg-transparent border-none outline-none text-sm w-full font-medium"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2.5 text-gray-500 hover:bg-gray-100 rounded-full transition-colors relative">
              <Bell size={20} />
              {upcomingBills.filter(b => !b.paid).length > 0 && (
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
              <h1 className="text-2xl md:text-3xl font-semibold text-gray-900">Bill Reminders</h1>
              <p className="text-gray-500 text-sm mt-1">Never miss a payment again</p>
            </div>
            <button
              onClick={() => {
                setEditingBill(null);
                setIsAddModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus size={18} />
              Add Bill Reminder
            </button>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-100">
            <div className="flex gap-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 pb-3 px-1 transition-all relative ${
                    activeTab === tab.id
                      ? 'text-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <tab.icon size={18} />
                  <span className="font-medium">{tab.label}</span>
                  {tab.badge > 0 && (
                    <span className="absolute -top-1 -right-3 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                      {tab.badge}
                    </span>
                  )}
                  {activeTab === tab.id && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="space-y-6">
            {activeTab === 'calendar' && (
              <BillCalendar
                year={currentYear}
                month={currentMonth}
                bills={upcomingBills}
                onMarkAsPaid={handleMarkAsPaid}
                onPreviousMonth={handlePreviousMonth}
                onNextMonth={handleNextMonth}
                loading={loading}
              />
            )}

            {activeTab === 'upcoming' && (
              <div className="space-y-6">
                <UpcomingBillsList
                  bills={upcomingBills}
                  onMarkAsPaid={handleMarkAsPaid}
                  onEdit={handleEditBill}
                  onDelete={handleDeleteBill}
                  loading={loading}
                />
                {categoryBreakdown && (
                  <CategoryBreakdown breakdown={categoryBreakdown} />
                )}
              </div>
            )}

            {activeTab === 'history' && (
              <BillHistory history={billHistory} loading={loading} />
            )}

            {activeTab === 'summary' && (
              <MonthlyBillSummary summary={monthlySummary} loading={loading} />
            )}
          </div>
        </motion.div>
      </main>

      {/* Add/Edit Bill Modal */}
      <AddBillModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingBill(null);
        }}
        onSuccess={fetchBillData}
        editingBill={editingBill}
      />
    </div>
  );
};

export default BillReminders;