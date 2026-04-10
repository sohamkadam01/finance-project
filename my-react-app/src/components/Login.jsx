import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, 
  Sun, 
  Moon, 
  Eye, 
  EyeOff, 
  ChevronDown,
  Info,
  UserCircle,
  Mail,
  Lock
} from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  // Theme management
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Multi-step form state
  const [step, setStep] = useState(1); // 1: Identifier, 2: Challenge
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Apply theme
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  // Handle next step / login
  const handleNext = async (e) => {
    e.preventDefault();
    setError('');
    
    if (step === 1) {
      if (!email.includes('@')) {
        setError('Enter a valid email address');
        return;
      }
      setIsLoading(true);
      // Simulate account lookup delay for better UX
      setTimeout(() => {
        setIsLoading(false);
        setStep(2);
      }, 800);
    } else {
      setIsLoading(true);
      
      try {
        // Call the actual login function
        const result = await login({ email, password });
        
        if (result.success) {
          console.log('Login successful, navigating to dashboard...');
          // Navigate to dashboard after successful login
          navigate('/dashboard', { replace: true });
        } else {
          setError(result.error || 'Login failed. Please check your credentials.');
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Login error:', err);
        setError('An unexpected error occurred. Please try again.');
        setIsLoading(false);
      }
    }
  };

  const handleBack = () => {
    setStep(1);
    setPassword('');
    setError('');
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col items-center justify-center p-4 transition-colors duration-500 font-sans selection:bg-blue-100 dark:selection:bg-blue-900">
      
      {/* Absolute Header - Theme Toggle */}
      <div className="fixed top-0 w-full p-6 flex justify-end z-50">
        <button 
          onClick={toggleTheme}
          className="p-3 rounded-full hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors text-slate-600 dark:text-slate-400"
          aria-label="Toggle theme"
        >
          {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>

      {/* Main Identity Container */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-[448px] border border-slate-200 dark:border-slate-800 rounded-lg sm:rounded-xl px-6 py-10 sm:px-10 sm:py-12 bg-white dark:bg-slate-950 transition-all shadow-sm"
      >
        {/* Branding & Header */}
        <div className="flex flex-col items-center text-center">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white">
              <Zap size={20} fill="currentColor" />
            </div>
            <span className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">FinBrain</span>
          </div>

          <h1 className="text-2xl font-normal text-slate-900 dark:text-white mt-2 mb-1">
            {step === 1 ? 'Sign in' : 'Welcome back'}
          </h1>
          
          <div className="flex flex-col items-center min-h-[40px]">
            {step === 1 ? (
              <p className="text-base text-slate-700 dark:text-slate-300">Use your FinBrain Account</p>
            ) : (
              <button 
                onClick={handleBack}
                className="group flex items-center gap-2 px-2 py-1 rounded-full border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all"
              >
                <UserCircle size={18} className="text-blue-600" />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{email}</span>
                <ChevronDown size={14} className="text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300" />
              </button>
            )}
          </div>
        </div>

        {/* Auth Form */}
        <form onSubmit={handleNext} className="mt-8 flex flex-col">
          <div className="relative min-h-[100px]">
            <AnimatePresence mode="wait">
              {step === 1 ? (
                <motion.div
                  key="id-field"
                  initial={{ opacity: 0, x: -15 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 15 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="relative group">
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`w-full px-4 py-4 rounded-md border ${error ? 'border-red-500' : 'border-slate-300 dark:border-slate-700'} bg-transparent focus:ring-[1px] focus:ring-blue-600 focus:border-blue-600 outline-none transition-all placeholder:text-transparent peer`}
                      id="identifier"
                      placeholder="Email or phone"
                      autoComplete="email"
                    />
                    <label 
                      htmlFor="identifier"
                      className="absolute left-4 top-4 text-slate-500 transition-all pointer-events-none peer-focus:-top-2 peer-focus:left-3 peer-focus:text-xs peer-focus:bg-white dark:peer-focus:bg-slate-950 peer-focus:px-1 peer-focus:text-blue-600 peer-[:not(:placeholder-shown)]:-top-2 peer-[:not(:placeholder-shown)]:left-3 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:bg-white dark:peer-[:not(:placeholder-shown)]:bg-slate-950 peer-[:not(:placeholder-shown)]:px-1"
                    >
                      Email or phone
                    </label>
                  </div>
                  {error && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-1 flex items-center gap-1 text-xs text-red-500"
                    >
                      <Info size={12} /> {error}
                    </motion.div>
                  )}
                  <Link to="/forgot-email" className="mt-2 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors inline-block">
                    Forgot email?
                  </Link>
                </motion.div>
              ) : (
                <motion.div
                  key="challenge-field"
                  initial={{ opacity: 0, x: 15 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -15 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="relative group">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      autoFocus
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-4 rounded-md border border-slate-300 dark:border-slate-700 bg-transparent focus:ring-[1px] focus:ring-blue-600 focus:border-blue-600 outline-none transition-all placeholder:text-transparent peer"
                      id="challenge"
                      placeholder="Enter your password"
                      autoComplete="current-password"
                    />
                    <label 
                      htmlFor="challenge"
                      className="absolute left-4 top-4 text-slate-500 transition-all pointer-events-none peer-focus:-top-2 peer-focus:left-3 peer-focus:text-xs peer-focus:bg-white dark:peer-focus:bg-slate-950 peer-focus:px-1 peer-focus:text-blue-600 peer-[:not(:placeholder-shown)]:-top-2 peer-[:not(:placeholder-shown)]:left-3 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:bg-white dark:peer-[:not(:placeholder-shown)]:bg-slate-950 peer-[:not(:placeholder-shown)]:px-1"
                    >
                      Enter your password
                    </label>
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  {error && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-1 flex items-center gap-1 text-xs text-red-500"
                    >
                      <Info size={12} /> {error}
                    </motion.div>
                  )}
                  <Link to="/forgot-password" className="mt-2 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 transition-colors inline-block">
                    Forgot password?
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Privacy Note */}
          <p className="mt-10 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            Not your computer? Use a private window to sign in.{' '}
            <button type="button" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">
              Learn more
            </button>
          </p>

          {/* Actions */}
          <div className="mt-12 flex items-center justify-between">
            <Link 
              to="/register"
              className="text-blue-600 dark:text-blue-400 font-semibold px-2 py-2 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
            >
              Create account
            </Link>
            <button
              type="submit"
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-blue-400 text-white font-semibold px-6 py-2.5 rounded transition-all flex items-center justify-center min-w-[90px] shadow-sm"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : step === 1 ? (
                'Next'
              ) : (
                'Sign In'
              )}
            </button>
          </div>
        </form>
      </motion.div>

      {/* Footer / Meta Links */}
      <footer className="w-full max-w-[448px] mt-6 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-500 dark:text-slate-500 px-2 gap-4">
        <div className="flex items-center gap-1 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-900 px-2 py-1 rounded transition-colors">
          English (United States) <ChevronDown size={14} />
        </div>
        <div className="flex gap-6">
          <Link to="/help" className="hover:text-slate-800 dark:hover:text-slate-300">Help</Link>
          <Link to="/privacy" className="hover:text-slate-800 dark:hover:text-slate-300">Privacy</Link>
          <Link to="/terms" className="hover:text-slate-800 dark:hover:text-slate-300">Terms</Link>
        </div>
      </footer>
    </div>
  );
};

export default Login;