import React, { useState } from 'react';
import { Bell, AlertTriangle, CheckCircle, XCircle, Check } from 'lucide-react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

const BudgetAlerts = ({ alerts, onRefresh }) => {
  const [markingRead, setMarkingRead] = useState(null);

  const getAlertIcon = (type) => {
    switch (type) {
      case 'BUDGET_WARNING':
        return <AlertTriangle size={18} className="text-orange-500" />;
      case 'BILL_REMINDER':
        return <Bell size={18} className="text-blue-500" />;
      case 'UNUSUAL_SPENDING':
        return <AlertTriangle size={18} className="text-red-500" />;
      default:
        return <Bell size={18} className="text-gray-500" />;
    }
  };

  const getAlertBg = (type) => {
    switch (type) {
      case 'BUDGET_WARNING':
        return 'bg-orange-50 border-orange-100';
      case 'BILL_REMINDER':
        return 'bg-blue-50 border-blue-100';
      case 'UNUSUAL_SPENDING':
        return 'bg-red-50 border-red-100';
      default:
        return 'bg-gray-50 border-gray-100';
    }
  };

  const handleMarkAsRead = async (alertId) => {
    setMarkingRead(alertId);
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API_BASE_URL}/alerts/${alertId}/read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Failed to mark alert as read:', err);
    } finally {
      setMarkingRead(null);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API_BASE_URL}/alerts/mark-all-read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Failed to mark all alerts as read:', err);
    }
  };

  if (!alerts || alerts.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={24} className="text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No alerts</h3>
        <p className="text-gray-500">You're all caught up! No new alerts.</p>
      </div>
    );
  }

  const unreadCount = alerts.filter(a => !a.read).length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Bell size={20} className="text-gray-500" />
          <h3 className="text-base font-medium text-gray-900">Budget Alerts</h3>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs rounded-full">
              {unreadCount} new
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Mark all as read
          </button>
        )}
      </div>

      {/* Alerts List */}
      <div className="space-y-3">
        {alerts.map((alert) => (
          <div
            key={alert.alertId}
            className={`p-4 rounded-xl border ${getAlertBg(alert.type)} transition-all ${
              !alert.read ? 'shadow-sm' : 'opacity-75'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                {getAlertIcon(alert.type)}
                <div>
                  <p className="text-sm text-gray-800 whitespace-pre-line">{alert.message}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(alert.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
              {!alert.read && (
                <button
                  onClick={() => handleMarkAsRead(alert.alertId)}
                  disabled={markingRead === alert.alertId}
                  className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                >
                  {markingRead === alert.alertId ? (
                    <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
                  ) : (
                    <Check size={16} />
                  )}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BudgetAlerts;