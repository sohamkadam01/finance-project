import React from 'react';
import { Edit2, Trash2, CheckCircle, AlertTriangle, Clock, Calendar, CreditCard } from 'lucide-react';

const UpcomingBillsList = ({ bills, onMarkAsPaid, onEdit, onDelete, loading }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-32 bg-gray-200 rounded"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-20 bg-gray-100 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'HIGH': return { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', icon: AlertTriangle };
      case 'MEDIUM': return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: Clock };
      default: return { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', icon: CheckCircle };
    }
  };

  const getDaysUntilText = (days) => {
    if (days === 0) return 'Due today';
    if (days === 1) return 'Due tomorrow';
    return `${days} days left`;
  };

  const unpaidBills = bills.filter(b => !b.paid).sort((a, b) => a.daysUntilDue - b.daysUntilDue);
  const paidBills = bills.filter(b => b.paid);

  if (unpaidBills.length === 0 && paidBills.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <Bell size={24} className="text-gray-300" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No bill reminders</h3>
        <p className="text-gray-500">Add your first bill reminder to never miss a payment</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Upcoming Bills Section */}
      {unpaidBills.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-amber-50/30">
            <div className="flex items-center gap-2">
              <Clock size={18} className="text-amber-600" />
              <h3 className="font-medium text-gray-900">Pending Payments</h3>
              <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full">
                {unpaidBills.length} bills
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-0.5">Bills that need your attention</p>
          </div>
          
          <div className="divide-y divide-gray-100">
            {unpaidBills.map((bill) => {
              const priority = getPriorityColor(bill.priority);
              const PriorityIcon = priority.icon;
              
              return (
                <div key={bill.billId} className="p-5 hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-xl ${priority.bg} flex items-center justify-center`}>
                        <PriorityIcon size={18} className={priority.text} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-gray-900">{bill.name}</h4>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${priority.bg} ${priority.text} border ${priority.border}`}>
                            {bill.priority}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Calendar size={14} />
                            <span>{new Date(bill.dueDate).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <CreditCard size={14} />
                            <span>₹{bill.amount.toLocaleString()}</span>
                          </div>
                        </div>
                        <div className="mt-2">
                          <span className={`text-sm font-medium ${
                            bill.daysUntilDue <= 1 ? 'text-red-600' : 'text-amber-600'
                          }`}>
                            {getDaysUntilText(bill.daysUntilDue)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onMarkAsPaid(bill.billId)}
                        className="px-3 py-1.5 bg-green-50 text-green-600 rounded-lg text-sm font-medium hover:bg-green-100 transition-colors flex items-center gap-1"
                      >
                        <CheckCircle size={14} />
                        Mark Paid
                      </button>
                      <button
                        onClick={() => onEdit(bill)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => onDelete(bill.billId)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Paid Bills Section */}
      {paidBills.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-green-50/30">
            <div className="flex items-center gap-2">
              <CheckCircle size={18} className="text-green-600" />
              <h3 className="font-medium text-gray-900">Recently Paid</h3>
              <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                {paidBills.length} bills
              </span>
            </div>
          </div>
          
          <div className="divide-y divide-gray-100">
            {paidBills.slice(0, 5).map((bill) => (
              <div key={bill.billId} className="p-4 hover:bg-gray-50/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
                      <CheckCircle size={14} className="text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{bill.name}</p>
                      <p className="text-xs text-gray-400">
                        Paid on {new Date(bill.paidDate || bill.dueDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <span className="font-medium text-gray-900">₹{bill.amount.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default UpcomingBillsList;