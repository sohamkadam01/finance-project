// src/components/Dashboard/QuickActions.jsx
import React, { useState } from 'react';
import { 
  Plus, Upload, Wallet, Target, 
  Sparkles, TrendingUp, CreditCard, 
  Receipt, PiggyBank, ArrowRight,
  Zap, CircleDollarSign, FileText, Briefcase
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReceiptUploadModal from './ReceiptUploadModal';
import AddAccountModal from './AddAccountModal';
import CreateBudgetModal from './CreateBudgetModal';
import AddTransactionModal from './AddTransactionModal';

const QuickActions = ({ onRefresh, variant = 'default' }) => {
  const [isAddTransactionModalOpen, setIsAddTransactionModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isAddAccountModalOpen, setIsAddAccountModalOpen] = useState(false);
  const [isCreateBudgetModalOpen, setIsCreateBudgetModalOpen] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const actions = [
    { 
      icon: Plus, 
      label: 'Add Transaction', 
      description: 'Record income or expense',
      color: 'blue',
      gradient: 'from-blue-500 to-blue-600',
      bg: 'bg-blue-50',
      text: 'text-blue-600',
      border: 'border-blue-100',
      hoverBg: 'hover:bg-blue-50',
      onClick: () => setIsAddTransactionModalOpen(true) 
    },
    { 
      icon: Upload, 
      label: 'Upload Receipt', 
      description: 'Scan & auto-fill',
      color: 'purple',
      gradient: 'from-purple-500 to-purple-600',
      bg: 'bg-purple-50',
      text: 'text-purple-600',
      border: 'border-purple-100',
      hoverBg: 'hover:bg-purple-50',
      onClick: () => setIsUploadModalOpen(true) 
    },
    { 
      icon: Wallet, 
      label: 'Add Account', 
      description: 'Connect bank account',
      color: 'emerald',
      gradient: 'from-emerald-500 to-emerald-600',
      bg: 'bg-emerald-50',
      text: 'text-emerald-600',
      border: 'border-emerald-100',
      hoverBg: 'hover:bg-emerald-50',
      onClick: () => setIsAddAccountModalOpen(true) 
    },
    { 
      icon: Target, 
      label: 'Create Budget', 
      description: 'Set spending limits',
      color: 'orange',
      gradient: 'from-orange-500 to-orange-600',
      bg: 'bg-orange-50',
      text: 'text-orange-600',
      border: 'border-orange-100',
      hoverBg: 'hover:bg-orange-50',
      onClick: () => setIsCreateBudgetModalOpen(true) 
    },
  ];

  const handleSuccess = () => {
    if (onRefresh) onRefresh();
  };

  // Variant 1: Modern Glassmorphic Cards (Default)
  if (variant === 'glass') {
    return (
      <>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {actions.map((action, idx) => (
            <motion.button
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              onClick={action.onClick}
              className="group relative overflow-hidden bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100 p-4 hover:shadow-xl transition-all duration-300"
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-gray-50 to-transparent rounded-full -mr-10 -mt-10 opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className={`relative z-10 flex flex-col items-center gap-3`}>
                <div className={`p-3 rounded-2xl ${action.bg} ${action.text} group-hover:scale-110 transition-transform duration-300`}>
                  <action.icon size={22} />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-gray-700">{action.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{action.description}</p>
                </div>
              </div>
            </motion.button>
          ))}
        </div>

        {/* Modals */}
        <AddTransactionModal isOpen={isAddTransactionModalOpen} onClose={() => setIsAddTransactionModalOpen(false)} onSuccess={handleSuccess} />
        <ReceiptUploadModal isOpen={isUploadModalOpen} onClose={() => setIsUploadModalOpen(false)} onSuccess={handleSuccess} />
        <AddAccountModal isOpen={isAddAccountModalOpen} onClose={() => setIsAddAccountModalOpen(false)} onSuccess={handleSuccess} />
        <CreateBudgetModal isOpen={isCreateBudgetModalOpen} onClose={() => setIsCreateBudgetModalOpen(false)} onSuccess={handleSuccess} />
      </>
    );
  }

  // Variant 2: Minimalist Modern (Clean & Simple)
  if (variant === 'minimal') {
    return (
      <>
        <div className="flex flex-wrap gap-3">
          {actions.map((action, idx) => (
            <motion.button
              key={idx}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              onClick={action.onClick}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border ${action.border} ${action.hoverBg} transition-all duration-200 group`}
              whileHover={{ x: 2 }}
            >
              <action.icon size={18} className={action.text} />
              <span className="text-sm font-medium text-gray-700">{action.label}</span>
              <ArrowRight size={14} className={`${action.text} opacity-0 group-hover:opacity-100 transition-opacity ml-0 -ml-2 group-hover:ml-1`} />
            </motion.button>
          ))}
        </div>

        {/* Modals */}
        <AddTransactionModal isOpen={isAddTransactionModalOpen} onClose={() => setIsAddTransactionModalOpen(false)} onSuccess={handleSuccess} />
        <ReceiptUploadModal isOpen={isUploadModalOpen} onClose={() => setIsUploadModalOpen(false)} onSuccess={handleSuccess} />
        <AddAccountModal isOpen={isAddAccountModalOpen} onClose={() => setIsAddAccountModalOpen(false)} onSuccess={handleSuccess} />
        <CreateBudgetModal isOpen={isCreateBudgetModalOpen} onClose={() => setIsCreateBudgetModalOpen(false)} onSuccess={handleSuccess} />
      </>
    );
  }

  // Variant 3: Gradient Cards (Bold & Vibrant)
  if (variant === 'gradient') {
    return (
      <>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {actions.map((action, idx) => (
            <motion.button
              key={idx}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              onClick={action.onClick}
              className={`group relative overflow-hidden bg-gradient-to-br ${action.gradient} rounded-2xl p-4 shadow-lg hover:shadow-xl transition-all duration-300`}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity" />
              
              <div className="relative z-10 flex flex-col items-center gap-3">
                <div className="p-2 rounded-xl bg-white/20 backdrop-blur-sm">
                  <action.icon size={22} className="text-white" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-white">{action.label}</p>
                  <p className="text-xs text-white/70 mt-0.5">{action.description}</p>
                </div>
              </div>
            </motion.button>
          ))}
        </div>

        {/* Modals */}
        <AddTransactionModal isOpen={isAddTransactionModalOpen} onClose={() => setIsAddTransactionModalOpen(false)} onSuccess={handleSuccess} />
        <ReceiptUploadModal isOpen={isUploadModalOpen} onClose={() => setIsUploadModalOpen(false)} onSuccess={handleSuccess} />
        <AddAccountModal isOpen={isAddAccountModalOpen} onClose={() => setIsAddAccountModalOpen(false)} onSuccess={handleSuccess} />
        <CreateBudgetModal isOpen={isCreateBudgetModalOpen} onClose={() => setIsCreateBudgetModalOpen(false)} onSuccess={handleSuccess} />
      </>
    );
  }

  // Variant 4: Floating Action Buttons (FAB Style)
  if (variant === 'fab') {
    return (
      <>
        <div className="flex flex-col sm:flex-row gap-3">
          {actions.map((action, idx) => (
            <motion.button
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              onClick={action.onClick}
              className="group flex items-center gap-3 px-5 py-3 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 flex-1"
              whileHover={{ y: -1 }}
            >
              <div className={`p-2 rounded-xl ${action.bg} ${action.text} transition-all duration-300 group-hover:scale-110`}>
                <action.icon size={18} />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-gray-700">{action.label}</p>
                <p className="text-xs text-gray-400">{action.description}</p>
              </div>
            </motion.button>
          ))}
        </div>

        {/* Modals */}
        <AddTransactionModal isOpen={isAddTransactionModalOpen} onClose={() => setIsAddTransactionModalOpen(false)} onSuccess={handleSuccess} />
        <ReceiptUploadModal isOpen={isUploadModalOpen} onClose={() => setIsUploadModalOpen(false)} onSuccess={handleSuccess} />
        <AddAccountModal isOpen={isAddAccountModalOpen} onClose={() => setIsAddAccountModalOpen(false)} onSuccess={handleSuccess} />
        <CreateBudgetModal isOpen={isCreateBudgetModalOpen} onClose={() => setIsCreateBudgetModalOpen(false)} onSuccess={handleSuccess} />
      </>
    );
  }

  // Variant 5: Circular Menu (Interactive & Fun)
  if (variant === 'circular') {
    const [isOpen, setIsOpen] = useState(false);
    
    return (
      <>
        <div className="relative flex justify-center">
          <motion.button
            onClick={() => setIsOpen(!isOpen)}
            className="relative z-20 w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full shadow-lg flex items-center justify-center text-white"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            animate={{ rotate: isOpen ? 45 : 0 }}
          >
            <Plus size={28} />
          </motion.button>
          
          <AnimatePresence>
            {isOpen && actions.map((action, idx) => {
              const angle = (idx * 90) - 135; // Spread in a semicircle
              const radius = 80;
              const x = Math.cos(angle * Math.PI / 180) * radius;
              const y = Math.sin(angle * Math.PI / 180) * radius;
              
              return (
                <motion.button
                  key={idx}
                  initial={{ opacity: 0, x: 0, y: 0 }}
                  animate={{ opacity: 1, x, y }}
                  exit={{ opacity: 0, x: 0, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => {
                    action.onClick();
                    setIsOpen(false);
                  }}
                  className="absolute z-10 w-12 h-12 rounded-full bg-white shadow-md border border-gray-100 flex items-center justify-center hover:shadow-lg transition-shadow"
                  style={{ left: 'calc(50% - 24px)', top: 'calc(50% - 24px)' }}
                >
                  <action.icon size={18} className={action.text} />
                </motion.button>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Modals */}
        <AddTransactionModal isOpen={isAddTransactionModalOpen} onClose={() => setIsAddTransactionModalOpen(false)} onSuccess={handleSuccess} />
        <ReceiptUploadModal isOpen={isUploadModalOpen} onClose={() => setIsUploadModalOpen(false)} onSuccess={handleSuccess} />
        <AddAccountModal isOpen={isAddAccountModalOpen} onClose={() => setIsAddAccountModalOpen(false)} onSuccess={handleSuccess} />
        <CreateBudgetModal isOpen={isCreateBudgetModalOpen} onClose={() => setIsCreateBudgetModalOpen(false)} onSuccess={handleSuccess} />
      </>
    );
  }

  // Variant 6: Premium Cards with Icons (Default/Original Enhanced)
  const getColorStyles = (color) => {
    const colors = {
      blue: 'from-blue-500/10 to-blue-600/5 border-blue-200',
      purple: 'from-purple-500/10 to-purple-600/5 border-purple-200',
      emerald: 'from-emerald-500/10 to-emerald-600/5 border-emerald-200',
      orange: 'from-orange-500/10 to-orange-600/5 border-orange-200',
    };
    return colors[color] || colors.blue;
  };

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {actions.map((action, idx) => (
          <motion.button
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            onMouseEnter={() => setHoveredIndex(idx)}
            onMouseLeave={() => setHoveredIndex(null)}
            onClick={action.onClick}
            className="group relative overflow-hidden bg-gradient-to-br rounded-2xl border p-5 transition-all duration-300 hover:shadow-xl"
            style={{
              background: `linear-gradient(135deg, ${action.color === 'blue' ? '#eff6ff' : 
                action.color === 'purple' ? '#faf5ff' : 
                action.color === 'emerald' ? '#ecfdf5' : '#fff7ed'} 0%, white 100%)`,
              borderColor: `${action.color === 'blue' ? '#dbeafe' : 
                action.color === 'purple' ? '#f3e8ff' : 
                action.color === 'emerald' ? '#d1fae5' : '#ffedd5'}`
            }}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            {/* Animated Background Effect */}
            <motion.div 
              className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              style={{
                background: `radial-gradient(circle at 30% 20%, ${action.color === 'blue' ? 'rgba(59,130,246,0.05)' : 
                  action.color === 'purple' ? 'rgba(147,51,234,0.05)' : 
                  action.color === 'emerald' ? 'rgba(16,185,129,0.05)' : 'rgba(249,115,22,0.05)'} 0%, transparent 70%)`
              }}
            />
            
            {/* Shine Effect on Hover */}
            <motion.div 
              className="absolute inset-0 opacity-0 group-hover:opacity-100"
              initial={{ x: '-100%' }}
              animate={{ x: hoveredIndex === idx ? '100%' : '-100%' }}
              transition={{ duration: 0.6 }}
              style={{
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)'
              }}
            />
            
            <div className="relative z-10 flex flex-col items-start gap-3">
              {/* Icon with Pulse Animation */}
              <div className="relative">
                <div className={`p-3 rounded-xl ${action.bg} ${action.text} transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg`}>
                  <action.icon size={22} />
                </div>
                {hoveredIndex === idx && (
                  <motion.div 
                    className={`absolute inset-0 rounded-xl ${action.bg} opacity-50`}
                    initial={{ scale: 1 }}
                    animate={{ scale: 1.3, opacity: 0 }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                  />
                )}
              </div>
              
              <div className="text-left w-full">
                <p className="text-base font-semibold text-gray-800 group-hover:text-gray-900 transition-colors">
                  {action.label}
                </p>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                  {action.description}
                </p>
                
                {/* Quick Tip */}
                <div className="mt-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Sparkles size={12} className={action.text} />
                  <span className="text-xs text-gray-400">Click to start</span>
                </div>
              </div>
            </div>
            
            {/* Decorative Corner */}
            <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <ArrowRight size={16} className={action.text} />
            </div>
          </motion.button>
        ))}
      </div>

      {/* Modals */}
      <AddTransactionModal
        isOpen={isAddTransactionModalOpen}
        onClose={() => setIsAddTransactionModalOpen(false)}
        onSuccess={handleSuccess}
      />

      <ReceiptUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSuccess={handleSuccess}
      />

      <AddAccountModal
        isOpen={isAddAccountModalOpen}
        onClose={() => setIsAddAccountModalOpen(false)}
        onSuccess={handleSuccess}
      />

      <CreateBudgetModal
        isOpen={isCreateBudgetModalOpen}
        onClose={() => setIsCreateBudgetModalOpen(false)}
        onSuccess={handleSuccess}
      />
    </>
  );
};

// Alternative: Compact Action Bar Component
export const CompactActionBar = ({ onRefresh }) => {
  const [activeModal, setActiveModal] = useState(null);
  
  const actions = [
    { id: 'transaction', icon: Plus, label: 'Add', color: 'blue' },
    { id: 'upload', icon: Upload, label: 'Upload', color: 'purple' },
    { id: 'account', icon: Wallet, label: 'Account', color: 'emerald' },
    { id: 'budget', icon: Target, label: 'Budget', color: 'orange' },
  ];

  const handleSuccess = () => {
    if (onRefresh) onRefresh();
    setActiveModal(null);
  };

  return (
    <>
      <div className="flex items-center gap-2 p-1 bg-gray-100/50 rounded-full w-fit">
        {actions.map((action) => (
          <button
            key={action.id}
            onClick={() => setActiveModal(action.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all bg-white shadow-sm hover:shadow-md ${action.color === 'blue' ? 'hover:text-blue-600' : 
              action.color === 'purple' ? 'hover:text-purple-600' : 
              action.color === 'emerald' ? 'hover:text-emerald-600' : 'hover:text-orange-600'}`}
          >
            <action.icon size={16} />
            <span className="hidden sm:inline">{action.label}</span>
          </button>
        ))}
      </div>

      {/* Modals */}
      <AddTransactionModal isOpen={activeModal === 'transaction'} onClose={() => setActiveModal(null)} onSuccess={handleSuccess} />
      <ReceiptUploadModal isOpen={activeModal === 'upload'} onClose={() => setActiveModal(null)} onSuccess={handleSuccess} />
      <AddAccountModal isOpen={activeModal === 'account'} onClose={() => setActiveModal(null)} onSuccess={handleSuccess} />
      <CreateBudgetModal isOpen={activeModal === 'budget'} onClose={() => setActiveModal(null)} onSuccess={handleSuccess} />
    </>
  );
};

// Alternative: Action Menu Dropdown
export const ActionMenuDropdown = ({ onRefresh }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeModal, setActiveModal] = useState(null);

  const actions = [
    { id: 'transaction', icon: Plus, label: 'Add Transaction', color: 'text-blue-600' },
    { id: 'upload', icon: Upload, label: 'Upload Receipt', color: 'text-purple-600' },
    { id: 'account', icon: Wallet, label: 'Add Account', color: 'text-emerald-600' },
    { id: 'budget', icon: Target, label: 'Create Budget', color: 'text-orange-600' },
  ];

  const handleSuccess = () => {
    if (onRefresh) onRefresh();
    setActiveModal(null);
    setIsOpen(false);
  };

  return (
    <>
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
        >
          <Plus size={18} />
          <span>Quick Actions</span>
        </button>
        
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-50"
            >
              {actions.map((action) => (
                <button
                  key={action.id}
                  onClick={() => setActiveModal(action.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                >
                  <action.icon size={18} className={action.color} />
                  <span className="text-sm text-gray-700">{action.label}</span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Modals */}
      <AddTransactionModal isOpen={activeModal === 'transaction'} onClose={() => setActiveModal(null)} onSuccess={handleSuccess} />
      <ReceiptUploadModal isOpen={activeModal === 'upload'} onClose={() => setActiveModal(null)} onSuccess={handleSuccess} />
      <AddAccountModal isOpen={activeModal === 'account'} onClose={() => setActiveModal(null)} onSuccess={handleSuccess} />
      <CreateBudgetModal isOpen={activeModal === 'budget'} onClose={() => setActiveModal(null)} onSuccess={handleSuccess} />
    </>
  );
};

export default QuickActions;