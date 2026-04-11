import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, CheckCircle, XCircle, AlertTriangle, Calendar, 
  Shield, Check, Filter, RefreshCw, ChevronRight, 
  TrendingUp, Target, CreditCard, LayoutDashboard, 
  Settings, LogOut, Search
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import Layout from '../components/Layout/Layout';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

const Notifications = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  
  const [notifications, setNotifications] = useState([]);
  const [filteredNotifications, setFilteredNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, unread, budget, bill, anomaly
  const [refreshing, setRefreshing] = useState(false);
  const [selectedType, setSelectedType] = useState('all');
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch all notifications
  const fetchNotifications = async () => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      console.error('No token found, redirecting to login');
      navigate('/login');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const response = await axios.get(`${API_BASE_URL}/alerts/all`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const alerts = response.data || [];
      setNotifications(alerts);
      applyFilters(alerts, filter, selectedType, searchQuery);
      
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
      
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setError('Session expired. Please login again.');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setError(err.response?.data?.message || 'Failed to load notifications');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated || localStorage.getItem('token')) {
      fetchNotifications();
    } else {
      navigate('/login');
    }
  }, []);

  const applyFilters = (data, statusFilter, typeFilter, search) => {
    let filtered = [...data];
    
    // Filter by read status
    if (statusFilter === 'unread') {
      filtered = filtered.filter(n => !n.read);
    }
    
    // Filter by type
    if (typeFilter !== 'all') {
      filtered = filtered.filter(n => n.type === typeFilter);
    }
    
    // Filter by search
    if (search) {
      filtered = filtered.filter(n => 
        n.message?.toLowerCase().includes(search.toLowerCase()) ||
        n.type?.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    setFilteredNotifications(filtered);
  };

  const handleFilterChange = (status, type) => {
    setFilter(status);
    setSelectedType(type);
    applyFilters(notifications, status, type, searchQuery);
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    applyFilters(notifications, filter, selectedType, query);
  };

  const handleMarkAsRead = async (alertId) => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    
    try {
      await axios.put(`${API_BASE_URL}/alerts/${alertId}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const updatedNotifications = notifications.map(n => 
        n.alertId === alertId ? { ...n, read: true } : n
      );
      setNotifications(updatedNotifications);
      applyFilters(updatedNotifications, filter, selectedType, searchQuery);
      
    } catch (err) {
      console.error('Failed to mark as read:', err);
      if (err.response?.status === 401) {
        navigate('/login');
      }
    }
  };

  const handleMarkAllAsRead = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    
    try {
      await axios.put(`${API_BASE_URL}/alerts/mark-all-read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const updatedNotifications = notifications.map(n => ({ ...n, read: true }));
      setNotifications(updatedNotifications);
      applyFilters(updatedNotifications, filter, selectedType, searchQuery);
      
    } catch (err) {
      console.error('Failed to mark all as read:', err);
      if (err.response?.status === 401) {
        navigate('/login');
      }
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.4, staggerChildren: 0.05 }
    }
  };

  const statsCardVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: (i) => ({ 
      opacity: 1, 
      scale: 1,
      transition: { delay: i * 0.1, duration: 0.3 }
    })
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'BUDGET_WARNING':
        return { icon: AlertTriangle, color: 'orange', bg: 'bg-orange-100' };
      case 'BILL_REMINDER':
        return { icon: Calendar, color: 'blue', bg: 'bg-blue-100' };
      case 'UNUSUAL_SPENDING':
        return { icon: Shield, color: 'red', bg: 'bg-red-100' };
      default:
        return { icon: Bell, color: 'gray', bg: 'bg-gray-100' };
    }
  };

  const typeFilters = [
    { value: 'all', label: 'All', icon: Bell, color: 'gray' },
    { value: 'BUDGET_WARNING', label: 'Budget', icon: AlertTriangle, color: 'orange' },
    { value: 'BILL_REMINDER', label: 'Bills', icon: Calendar, color: 'blue' },
    { value: 'UNUSUAL_SPENDING', label: 'Anomalies', icon: Shield, color: 'red' },
  ];

  const statusFilters = [
    { value: 'all', label: 'All' },
    { value: 'unread', label: 'Unread' },
  ];

  if (error) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <motion.div 
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <AlertTriangle size={32} className="text-red-500" />
            </motion.div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Session Expired</h2>
            <p className="text-gray-500 mb-4">{error}</p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/login')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Go to Login
            </motion.button>
          </motion.div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="p-4 md:p-8 max-w-5xl mx-auto space-y-6 md:space-y-8"
      >
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <motion.h1 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-2xl md:text-3xl font-semibold text-gray-900"
            >
              Notifications
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="text-gray-500 text-sm mt-1"
            >
              Stay updated with your financial activity
            </motion.p>
          </div>
          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
              Refresh
            </motion.button>
            {unreadCount > 0 && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleMarkAllAsRead}
                className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <Check size={16} />
                Mark all as read
              </motion.button>
            )}
          </div>
        </div>

        {/* Search Bar */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="relative"
        >
          <Search size={18} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search notifications..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </motion.div>

        {/* Stats Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total', value: notifications.length, color: 'gray', icon: Bell },
            { label: 'Unread', value: unreadCount, color: 'blue', icon: Bell },
            { label: 'Budget Alerts', value: notifications.filter(n => n.type === 'BUDGET_WARNING').length, color: 'orange', icon: AlertTriangle },
            { label: 'Anomalies', value: notifications.filter(n => n.type === 'UNUSUAL_SPENDING').length, color: 'red', icon: Shield },
          ].map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={idx}
                custom={idx}
                variants={statsCardVariants}
                initial="hidden"
                animate="visible"
                whileHover={{ scale: 1.02, y: -2 }}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 transition-all hover:shadow-md"
              >
                <div className={`w-8 h-8 rounded-xl bg-${stat.color}-100 flex items-center justify-center mb-3`}>
                  <Icon size={16} className={`text-${stat.color}-600`} />
                </div>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
              </motion.div>
            );
          })}
        </div>

        {/* Filters */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-gray-400" />
              <span className="text-sm font-medium text-gray-700">Filters</span>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {/* Status Filters */}
              <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                {statusFilters.map((status) => (
                  <motion.button
                    key={status.value}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleFilterChange(status.value, selectedType)}
                    className={`px-3 py-1.5 text-sm rounded-md transition-all ${
                      filter === status.value
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {status.label}
                  </motion.button>
                ))}
              </div>
              
              {/* Type Filters */}
              <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                {typeFilters.map((type) => {
                  const Icon = type.icon;
                  return (
                    <motion.button
                      key={type.value}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleFilterChange(filter, type.value)}
                      className={`flex items-center gap-1 px-3 py-1.5 text-sm rounded-md transition-all ${
                        selectedType === type.value
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <Icon size={14} />
                      {type.label}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Notifications List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-gray-200 rounded-xl animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
                    <div className="h-3 w-full bg-gray-100 rounded animate-pulse" />
                    <div className="h-3 w-24 bg-gray-100 rounded animate-pulse" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : filteredNotifications.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center"
          >
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <Bell size={24} className="text-gray-400" />
            </motion.div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications</h3>
            <p className="text-gray-500">
              {filter !== 'all' || selectedType !== 'all' || searchQuery
                ? 'No notifications match your filters'
                : 'You\'re all caught up!'}
            </p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {filteredNotifications.map((notification, idx) => {
                const { icon: Icon, color, bg } = getNotificationIcon(notification.type);
                return (
                  <motion.div
                    key={notification.alertId}
                    layout
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, x: -100, scale: 0.9 }}
                    transition={{ delay: idx * 0.03, duration: 0.3 }}
                    whileHover={{ scale: 1.01, x: 4 }}
                    className={`bg-white rounded-2xl border shadow-sm p-5 transition-all cursor-pointer ${
                      !notification.read ? 'border-l-4 border-l-blue-500' : 'border-gray-100'
                    } hover:shadow-md`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <motion.div 
                          whileHover={{ scale: 1.1, rotate: 10 }}
                          className={`p-2 rounded-xl ${bg}`}
                        >
                          <Icon size={18} className={`text-${color}-600`} />
                        </motion.div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className="font-semibold text-gray-900">
                              {notification.type === 'BUDGET_WARNING' && 'Budget Alert'}
                              {notification.type === 'BILL_REMINDER' && 'Bill Reminder'}
                              {notification.type === 'UNUSUAL_SPENDING' && 'Security Alert'}
                              {!notification.type && 'Notification'}
                            </h3>
                            {!notification.read && (
                              <motion.span 
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full"
                              >
                                New
                              </motion.span>
                            )}
                          </div>
                          <p className="text-sm text-gray-700 leading-relaxed">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-400 mt-2">
                            {new Date(notification.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 ml-4">
                        {!notification.read && (
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkAsRead(notification.alertId);
                            }}
                            className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Mark as read"
                          >
                            <Check size={16} />
                          </motion.button>
                        )}
                      </div>
                    </div>
                    
                    {/* Action button if available */}
                    {notification.actionUrl && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-3 pt-3 border-t border-gray-100"
                      >
                        <button
                          onClick={() => navigate(notification.actionUrl)}
                          className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 group"
                        >
                          View Details
                          <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                      </motion.div>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </motion.div>
    </Layout>
  );
};

export default Notifications;