import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Wallet, Target, TrendingUp, CreditCard, 
  Settings, Bell, Shield, Receipt, LogOut, ChevronLeft,
  BarChart3, FileText, HelpCircle, Zap
} from 'lucide-react';

const Sidebar = ({ isCollapsed, onToggle, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { id: 'transactions', label: 'Transactions', icon: CreditCard, path: '/transactions' },
    { id: 'budgets', label: 'Budgets', icon: Target, path: '/budgets' },
    { id: 'bill-reminders', label: 'Bill Reminders', icon: Bell, path: '/bill-reminders' },
    { id: 'predictions', label: 'Predictions', icon: TrendingUp, path: '/predictions' },
    { id: 'investments', label: 'Investments', icon: BarChart3, path: '/investments' },
    { id: 'investment-advice', label: 'Investment Advice', icon: Zap, path: '/investment-advice' },
    { id: 'anomaly-detection', label: 'Anomaly Detection', icon: Shield, path: '/anomaly-detection' },
    { id: 'documents', label: 'Documents', icon: FileText, path: '/documents' },
    { id: 'settings', label: 'Settings', icon: Settings, path: '/settings' },
  ];

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <aside 
      className={`bg-white border-r border-gray-100 flex flex-col sticky h-screen top-0 transition-all duration-300 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Logo Section */}
      <div className={`p-6 flex ${isCollapsed ? 'justify-center' : 'justify-start'} items-center border-b border-gray-100`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
            <Zap size={22} strokeWidth={2.5} />
          </div>
          {!isCollapsed && (
            <span className="font-bold text-xl tracking-tight text-slate-800">FinCore</span>
          )}
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const active = isActive(item.path);
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`
                w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200
                ${active 
                  ? 'bg-blue-50 text-blue-600' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }
                ${isCollapsed ? 'justify-center' : 'justify-start'}
              `}
              title={isCollapsed ? item.label : ''}
            >
              <item.icon size={20} className={active ? 'text-blue-600' : 'text-gray-500'} />
              {!isCollapsed && (
                <span className={`font-medium text-sm ${active ? 'font-semibold' : ''}`}>
                  {item.label}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className="p-4 border-t border-gray-100 space-y-2">
        {/* Help Button */}
        <button
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-gray-500 hover:bg-gray-50 ${
            isCollapsed ? 'justify-center' : 'justify-start'
          }`}
          title={isCollapsed ? 'Help' : ''}
        >
          <HelpCircle size={20} />
          {!isCollapsed && <span className="text-sm font-medium">Help & Support</span>}
        </button>

        {/* Logout Button */}
        <button
          onClick={onLogout}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-red-500 hover:bg-red-50 ${
            isCollapsed ? 'justify-center' : 'justify-start'
          }`}
          title={isCollapsed ? 'Logout' : ''}
        >
          <LogOut size={20} />
          {!isCollapsed && <span className="text-sm font-medium">Logout</span>}
        </button>

        {/* Collapse Toggle Button */}
        <button
          onClick={onToggle}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-gray-400 hover:bg-gray-50 ${
            isCollapsed ? 'justify-center' : 'justify-start'
          }`}
          title={isCollapsed ? 'Expand' : 'Collapse'}
        >
          <ChevronLeft size={20} className={`transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} />
          {!isCollapsed && <span className="text-sm font-medium">Collapse</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;