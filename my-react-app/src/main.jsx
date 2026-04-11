import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import './index.css'
import Intropage from './pages/intropage.jsx'
import AnomalyDetection from './pages/AnomalyDetection';
import Notifications from './pages/Notifications';

import BillReminders from './pages/BillReminders';
import Login from './components/Login.jsx'
import Register from './components/Register.jsx'
import PrivateRoute from './components/PrivateRoute.jsx'
import { AuthProvider } from './context/AuthContext'
import Dashboard from './pages/Dashboard'
import Transactions from './pages/Transactions'  // Import Transactions page
import Budgets from './pages/Budgets';
import Predictions from './pages/Predictions'
import Investments from './pages/Investments';
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Intropage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route 
            path="/dashboard" 
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            } 
          />
          <Route 
  path="/notifications" 
  element={
    <PrivateRoute>
      <Notifications />
    </PrivateRoute>
  } 
/>
          <Route 
  path="/investments" 
  element={
    <PrivateRoute>
      <Investments />
    </PrivateRoute>
  } 
/>

          <Route 
  path="/predictions" 
  element={
    <PrivateRoute>
      <Predictions />
    </PrivateRoute>
  } 
/>
          <Route 
  path="/bill-reminders" 
  element={
    <PrivateRoute>
      <BillReminders />
    </PrivateRoute>
  } 
/>
          <Route 
  path="/budgets" 
  element={
    <PrivateRoute>
      <Budgets />
    </PrivateRoute>
  } 
/>

<Route 
  path="/anomaly-detection" 
  element={
    <PrivateRoute>
      <AnomalyDetection />
    </PrivateRoute>
  } 
/>
          <Route 
            path="/transactions" 
            element={
              <PrivateRoute>
                <Transactions />
              </PrivateRoute>
            } 
          />
          {/* Add more routes as needed */}
        </Routes>
      </Router>
    </AuthProvider>
  </React.StrictMode>,
)


// Add route
