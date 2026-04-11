import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, BarChart3, RefreshCw, AlertCircle
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
import Layout from '../components/Layout/Layout'; // Import Layout component

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

const Investments = () => {
  const navigate = useNavigate();
  const { user } = useAuth(); // Remove logout from here as Layout handles it
  
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
      if (!token) {
        navigate('/login');
        return;
      }
      
      // Log the API calls
      console.log('Fetching investments...');
      const investmentsResponse = await axios.get(`${API_BASE_URL}/investments/my-investments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Investments response:', investmentsResponse.data);
      const investmentsData = investmentsResponse.data?.investments || 
                             investmentsResponse.data?.data || 
                             investmentsResponse.data || [];
      setInvestments(investmentsData);
      
      // Fetch portfolio summary
      console.log('Fetching summary...');
      const summaryResponse = await axios.get(`${API_BASE_URL}/investments/summary`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Summary response:', summaryResponse.data);
      
      // Extract summary from common response wrappers (.summary or .data)
      const summaryData = summaryResponse.data.summary || 
                          summaryResponse.data.data || 
                          summaryResponse.data;
      setSummary(summaryData);

      // Fix: Update Asset Allocation if present in the response
      if (summaryData.assetAllocation) {
        setAssetAllocation(summaryData.assetAllocation);
      }
      
      // Fetch portfolio performance
      console.log(`Fetching performance for period: ${performancePeriod}`);
      const performanceResponse = await axios.get(`${API_BASE_URL}/investments/performance`, {
        params: { period: performancePeriod },
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Performance response:', performanceResponse.data);
      
      const performanceData = performanceResponse.data.performance || 
                             performanceResponse.data.data || 
                             performanceResponse.data;
      setPerformance(performanceData);

      // Fallback 1: If allocation wasn't in summary, check performance response
      if (!summaryData.assetAllocation && performanceData.assetAllocation) {
        setAssetAllocation(performanceData.assetAllocation);
      }

      // Fallback 2: Calculate allocation manually from investments list if backend didn't provide it
      if (!summaryData.assetAllocation && !performanceData.assetAllocation && investmentsData.length > 0) {
        const totals = investmentsData.reduce((acc, inv) => {
          const type = inv.type || 'Other';
          const value = inv.currentValue || inv.amountInvested || 0;
          acc[type] = (acc[type] || 0) + value;
          return acc;
        }, {});
        
        const totalValue = Object.values(totals).reduce((a, b) => a + b, 0);
        
        const manualAllocation = Object.entries(totals).map(([type, amount]) => ({
          assetType: type,
          amount: amount,
          percentage: totalValue > 0 ? Math.round((amount / totalValue) * 100) : 0
        }));
        setAssetAllocation(manualAllocation);
      }
      
    } catch (err) {
      console.error('Failed to fetch investment data:', err);
      console.error('Error response:', err.response?.data);
      if (err.response?.status === 401) {
        navigate('/login');
      }
      setError(err.response?.data?.message || err.response?.data?.error || 'Failed to load investment data');
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
            <h1 className="text-2xl md:text-3xl font-semibold text-gray-900">Investment Portfolio</h1>
            <p className="text-gray-500 text-sm mt-1">Track and manage your investments</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
              Refresh
            </button>
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
            <div className="flex items-center gap-2 flex-wrap">
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
    </Layout>
  );
};

export default Investments;