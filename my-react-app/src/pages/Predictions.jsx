import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, BarChart3, Brain, TrendingUp, ArrowRight, RefreshCw, AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

// Components
import BalanceForecastChart from '../components/Predictions/BalanceForecastChart';
import PredictionCards from '../components/Predictions/PredictionCards';
import ScenarioComparison from '../components/Predictions/ScenarioComparison';
import DailyBreakdownTable from '../components/Predictions/DailyBreakdownTable';
import ConfidenceScore from '../components/Predictions/ConfidenceScore';
import PredictionInsights from '../components/Predictions/PredictionInsights';
import MethodSelector from '../components/Predictions/MethodSelector';
import ComparisonView from '../components/Predictions/ComparisonView';
import Layout from '../components/Layout/Layout'; // Import Layout component

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

const Predictions = () => {
  const navigate = useNavigate();
  const { user } = useAuth(); // Remove logout from here as Layout handles it
  
  const [activeTab, setActiveTab] = useState('forecast'); // forecast, scenarios, compare
  const [predictionMethod, setPredictionMethod] = useState('AUTO'); // STATISTICAL, AI, AUTO
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() + 3);
    return date.toISOString().split('T')[0];
  });
  const [prediction, setPrediction] = useState(null);
  const [scenarios, setScenarios] = useState(null);
  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchPrediction = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      
      if (activeTab === 'forecast') {
        // Fetch prediction based on method
        const endpoint = predictionMethod === 'STATISTICAL' ? '/predictions/statistical' : 
                        predictionMethod === 'AI' ? '/predictions/ai' : '/predictions/auto';
        
        const response = await axios.get(`${API_BASE_URL}${endpoint}`, {
          params: { startDate, endDate },
          headers: { Authorization: `Bearer ${token}` }
        });
        setPrediction(response.data);
        
      } else if (activeTab === 'scenarios') {
        // Fetch best/worst case scenarios
        const months = Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24 * 30));
        const response = await axios.get(`${API_BASE_URL}/predictions/scenarios`, {
          params: { months: Math.max(1, months) },
          headers: { Authorization: `Bearer ${token}` }
        });
        setScenarios(response.data.scenarios);
        
      } else if (activeTab === 'compare') {
        // Fetch comparison between statistical and AI
        const response = await axios.post(`${API_BASE_URL}/predictions/compare`, {
          startDate, endDate
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setComparison(response.data);
      }
      
    } catch (err) {
      console.error('Failed to fetch prediction:', err);
      setError(err.response?.data?.error || 'Failed to load prediction data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrediction();
  }, [activeTab, predictionMethod, startDate, endDate]);

  const handleDateRangeChange = (days) => {
    const start = new Date();
    const end = new Date();
    end.setDate(end.getDate() + days);
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  };

  const tabs = [
    { id: 'forecast', label: 'Balance Forecast', icon: BarChart3 },
    { id: 'scenarios', label: 'Best/Worst Cases', icon: TrendingUp },
    { id: 'compare', label: 'Compare Methods', icon: Brain },
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
            <h1 className="text-2xl md:text-3xl font-semibold text-gray-900">Financial Predictions</h1>
            <p className="text-gray-500 text-sm mt-1">AI-powered forecasts for your financial future</p>
          </div>
          <button
            onClick={fetchPrediction}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-300"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh Prediction
          </button>
        </div>

        {/* Date Range Selector */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-2">
              <Calendar size={18} className="text-gray-400" />
              <span className="text-sm font-medium text-gray-700">Prediction Period</span>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => handleDateRangeChange(30)}
                className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                1 Month
              </button>
              <button
                onClick={() => handleDateRangeChange(90)}
                className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                3 Months
              </button>
              <button
                onClick={() => handleDateRangeChange(180)}
                className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                6 Months
              </button>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <ArrowRight size={16} className="text-gray-400" />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
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
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 rounded-2xl p-4 flex items-center gap-3">
            <AlertCircle size={20} className="text-red-500" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Tab Content */}
        {activeTab === 'forecast' && (
          <div className="space-y-6">
            {/* Method Selector */}
            <MethodSelector 
              method={predictionMethod}
              onMethodChange={setPredictionMethod}
            />

            {/* Prediction Cards */}
            <PredictionCards prediction={prediction} loading={loading} />

            {/* Balance Forecast Chart */}
            <BalanceForecastChart 
              data={prediction?.dailyPredictions} 
              loading={loading}
            />

            {/* Confidence Score */}
            <ConfidenceScore 
              score={prediction?.confidenceScore} 
              method={prediction?.method}
              loading={loading}
            />

            {/* Daily Breakdown */}
            <DailyBreakdownTable 
              predictions={prediction?.dailyPredictions}
              loading={loading}
            />

            {/* Insights */}
            <PredictionInsights 
              insights={prediction?.insights}
              predictedBalance={prediction?.predictedBalance}
              currentBalance={prediction?.currentBalance}
              loading={loading}
            />
          </div>
        )}

        {activeTab === 'scenarios' && (
          <ScenarioComparison 
            scenarios={scenarios} 
            loading={loading}
            startDate={startDate}
            endDate={endDate}
          />
        )}

        {activeTab === 'compare' && (
          <ComparisonView 
            comparison={comparison}
            loading={loading}
            startDate={startDate}
            endDate={endDate}
          />
        )}
      </motion.div>
    </Layout>
  );
};

export default Predictions;