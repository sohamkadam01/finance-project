import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Shield, List, BarChart3, RefreshCw
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

// Components
import AnomalyStatsCards from '../components/AnomalyDetection/AnomalyStatsCards';
import AnomalyList from '../components/AnomalyDetection/AnomalyList';
import AnomalyDetailsModal from '../components/AnomalyDetection/AnomalyDetailsModal';
import ResolutionModal from '../components/AnomalyDetection/ResolutionModal';
import DetectionRateChart from '../components/AnomalyDetection/DetectionRateChart';
import SeverityPieChart from '../components/AnomalyDetection/SeverityPieChart';
import CategoryBreakdown from '../components/AnomalyDetection/CategoryBreakdown';
import Layout from '../components/Layout/Layout'; // Import Layout component

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

const AnomalyDetection = () => {
  const navigate = useNavigate();
  const { user } = useAuth(); // Remove logout from here as Layout handles it
  
  const [anomalies, setAnomalies] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedAnomaly, setSelectedAnomaly] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isResolutionModalOpen, setIsResolutionModalOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('list'); // list, stats

  // Fetch all anomaly data
  const fetchAnomalyData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // Fetch anomalies list
      const anomaliesResponse = await axios.get(`${API_BASE_URL}/anomalies/my-anomalies`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAnomalies(anomaliesResponse.data || []);
      
      // Fetch statistics
      const statsResponse = await axios.get(`${API_BASE_URL}/anomalies/statistics`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStatistics(statsResponse.data.statistics);
      
    } catch (err) {
      console.error('Failed to fetch anomaly data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnomalyData();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAnomalyData();
    setRefreshing(false);
  };

  const handleMarkAsFraud = async (anomalyId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_BASE_URL}/anomalies/${anomalyId}/mark-fraud`,
        { notes: 'Marked as fraudulent' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchAnomalyData();
    } catch (err) {
      console.error('Failed to mark as fraud:', err);
    }
  };

  const handleMarkAsFalseAlarm = async (anomalyId, notes) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_BASE_URL}/anomalies/${anomalyId}/false-alarm`,
        { notes: notes || 'False alarm' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchAnomalyData();
    } catch (err) {
      console.error('Failed to mark as false alarm:', err);
    }
  };

  const handleViewDetails = (anomaly) => {
    setSelectedAnomaly(anomaly);
    setIsDetailsModalOpen(true);
  };

  const handleAddResolution = (anomaly) => {
    setSelectedAnomaly(anomaly);
    setIsResolutionModalOpen(true);
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
    { id: 'list', label: 'Flagged Transactions', icon: List },
    { id: 'stats', label: 'Statistics & Analytics', icon: BarChart3 },
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
            <h1 className="text-2xl md:text-3xl font-semibold text-gray-900">Anomaly Detection</h1>
            <p className="text-gray-500 text-sm mt-1">Monitor and review suspicious activities</p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-300"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            Refresh Data
          </button>
        </div>

        {/* Statistics Cards */}
        <AnomalyStatsCards statistics={statistics} loading={loading} />

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
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'list' && (
          <AnomalyList 
            anomalies={anomalies}
            loading={loading}
            onViewDetails={handleViewDetails}
            onMarkAsFraud={handleMarkAsFraud}
            onMarkAsFalseAlarm={handleMarkAsFalseAlarm}
            onAddResolution={handleAddResolution}
          />
        )}

        {activeTab === 'stats' && statistics && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <DetectionRateChart statistics={statistics} loading={loading} />
              <SeverityPieChart statistics={statistics} loading={loading} />
            </div>
            <CategoryBreakdown statistics={statistics} loading={loading} />
            
            {/* Insights Section */}
            {statistics.insights && statistics.insights.length > 0 && (
              <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100">
                <h3 className="text-base font-medium text-gray-900 mb-3">Insights</h3>
                <div className="space-y-2">
                  {statistics.insights.map((insight, idx) => (
                    <p key={idx} className="text-sm text-gray-700">• {insight}</p>
                  ))}
                </div>
              </div>
            )}
            
            {/* Recommendations */}
            {statistics.recommendations && statistics.recommendations.length > 0 && (
              <div className="bg-green-50 rounded-2xl p-6 border border-green-100">
                <h3 className="text-base font-medium text-gray-900 mb-3">Recommendations</h3>
                <div className="space-y-2">
                  {statistics.recommendations.map((rec, idx) => (
                    <p key={idx} className="text-sm text-gray-700">• {rec}</p>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </motion.div>

      {/* Modals */}
      <AnomalyDetailsModal 
        anomaly={selectedAnomaly}
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
      />
      
      <ResolutionModal 
        anomaly={selectedAnomaly}
        isOpen={isResolutionModalOpen}
        onClose={() => setIsResolutionModalOpen(false)}
        onResolve={handleMarkAsFalseAlarm}
      />
    </Layout>
  );
};

export default AnomalyDetection;