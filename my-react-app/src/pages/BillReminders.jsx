import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, List, History, BarChart3, Plus
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
import Layout from '../components/Layout/Layout'; // Import Layout component

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

const BillReminders = () => {
  const navigate = useNavigate();
  const { user } = useAuth(); // Remove logout from here as Layout handles it
  
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
      const summaryResponse = await axios.get(`${API_BASE_URL}/bill-reminders/monthly-summary/current`, {
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
          <div className="flex gap-6 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 pb-3 px-1 transition-all relative whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <tab.icon size={18} />
                <span className="font-medium">{tab.label}</span>
                {tab.badge > 0 && (
                  <span className="absolute -top-1 -right-3 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                    {tab.badge > 9 ? '9+' : tab.badge}
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
    </Layout>
  );
};

export default BillReminders;