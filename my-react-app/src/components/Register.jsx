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
  ShieldCheck,
  Globe,
  ArrowLeft,
  User,
  Mail,
  Phone
} from 'lucide-react';

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  // Theme management
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Multi-step form state
  const [step, setStep] = useState(1); // 1: Name, 2: Email & Phone, 3: Password
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Form Fields (preserving original structure)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: ''
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleNext = async (e) => {
    e.preventDefault();
    setError('');

    // Registration Flow Steps
    if (step === 1) {
      if (!formData.name || formData.name.trim().length < 2) {
        setError('Please enter your full name');
        return;
      }
      setStep(2);
    } 
    else if (step === 2) {
      if (!formData.email || !formData.email.includes('@')) {
        setError('Enter a valid email address');
        return;
      }
      setStep(3);
    } 
    else {
      // Final step - Registration
      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setError("Passwords don't match");
        return;
      }
      
      setIsLoading(true);
      
      // Prepare data for registration (excluding confirmPassword)
      const { confirmPassword, ...registerData } = formData;
      const result = await register(registerData);
      
      if (result.success) {
        navigate('/dashboard');
      } else {
        setError(result.error || 'Registration failed. Please try again.');
        setIsLoading(false);
      }
    }
  };

  const handleBack = () => {
    setStep(step - 1);
    setError('');
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col items-center justify-center p-4 transition-colors duration-500 font-sans selection:bg-blue-100 dark:selection:bg-blue-900">
      
      {/* Theme Switcher */}
      <div className="fixed top-0 w-full p-6 flex justify-end z-50">
        <button 
          onClick={toggleTheme}
          className="p-3 rounded-full hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors text-slate-600 dark:text-slate-400"
          aria-label="Toggle theme"
        >
          {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>

      {/* Main Container - Widens for final step */}
      <motion.div 
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`w-full ${step === 3 ? 'max-w-[740px]' : 'max-w-[448px]'} border border-slate-200 dark:border-slate-800 rounded-lg sm:rounded-xl px-6 py-10 sm:px-10 sm:py-12 bg-white dark:bg-slate-950 transition-all duration-500 shadow-sm overflow-hidden`}
      >
        <div className="flex flex-col md:flex-row">
          
          {/* Left Side: Form Content */}
          <div className="flex-1">
            <div className="flex flex-col items-start mb-8">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white">
                  <Zap size={20} fill="currentColor" />
                </div>
                <span className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">FinBrain</span>
              </div>

              <h1 className="text-2xl font-normal text-slate-900 dark:text-white mt-2 mb-1">
                Create your FinBrain Account
              </h1>
              
              <p className="text-base text-slate-700 dark:text-slate-300">
                {step === 1 ? 'Enter your name' : step === 2 ? 'Your contact information' : 'Create a strong password'}
              </p>
            </div>

            <form onSubmit={handleNext} className="flex flex-col">
              <div className="relative min-h-[120px]">
                <AnimatePresence mode="wait">
                  {/* STEP 1: NAME */}
                  {step === 1 && (
                    <motion.div 
                      key="step-name" 
                      initial={{ opacity: 0, x: 15 }} 
                      animate={{ opacity: 1, x: 0 }} 
                      exit={{ opacity: 0, x: -15 }} 
                      className="space-y-6"
                    >
                      <div className="relative group">
                        <input
                          type="text"
                          name="name"
                          required
                          value={formData.name}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-4 rounded-md border ${error ? 'border-red-500' : 'border-slate-300 dark:border-slate-700'} bg-transparent focus:ring-[1px] focus:ring-blue-600 focus:border-blue-600 outline-none transition-all placeholder:text-transparent peer`}
                          id="name"
                          placeholder="Full name"
                        />
                        <User size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <label 
                          htmlFor="name"
                          className="absolute left-4 top-4 text-slate-500 transition-all pointer-events-none peer-focus:-top-2 peer-focus:left-3 peer-focus:text-xs peer-focus:bg-white dark:peer-focus:bg-slate-950 peer-focus:px-1 peer-focus:text-blue-600 peer-[:not(:placeholder-shown)]:-top-2 peer-[:not(:placeholder-shown)]:left-3 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:bg-white dark:peer-[:not(:placeholder-shown)]:bg-slate-950 peer-[:not(:placeholder-shown)]:px-1"
                        >
                          Full name
                        </label>
                      </div>
                      {error && (
                        <p className="text-xs text-red-500 flex items-center gap-1.5">
                          <Info size={14}/> {error}
                        </p>
                      )}
                    </motion.div>
                  )}

                  {/* STEP 2: EMAIL & PHONE */}
                  {step === 2 && (
                    <motion.div 
                      key="step-contact" 
                      initial={{ opacity: 0, x: 15 }} 
                      animate={{ opacity: 1, x: 0 }} 
                      exit={{ opacity: 0, x: -15 }} 
                      className="space-y-6"
                    >
                      <div className="relative group">
                        <input
                          type="email"
                          name="email"
                          required
                          value={formData.email}
                          onChange={handleInputChange}
                          className="w-full px-4 py-4 rounded-md border border-slate-300 dark:border-slate-700 bg-transparent focus:ring-[1px] focus:ring-blue-600 focus:border-blue-600 outline-none transition-all placeholder:text-transparent peer"
                          id="email"
                          placeholder="Email address"
                        />
                        <Mail size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <label 
                          htmlFor="email"
                          className="absolute left-4 top-4 text-slate-500 transition-all pointer-events-none peer-focus:-top-2 peer-focus:left-3 peer-focus:text-xs peer-focus:bg-white dark:peer-focus:bg-slate-950 peer-focus:px-1 peer-focus:text-blue-600 peer-[:not(:placeholder-shown)]:-top-2 peer-[:not(:placeholder-shown)]:left-3 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:bg-white dark:peer-[:not(:placeholder-shown)]:bg-slate-950 peer-[:not(:placeholder-shown)]:px-1"
                        >
                          Email address
                        </label>
                      </div>

                      <div className="relative group">
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          className="w-full px-4 py-4 rounded-md border border-slate-300 dark:border-slate-700 bg-transparent focus:ring-[1px] focus:ring-blue-600 focus:border-blue-600 outline-none transition-all placeholder:text-transparent peer"
                          id="phone"
                          placeholder="Phone number"
                        />
                        <Phone size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <label 
                          htmlFor="phone"
                          className="absolute left-4 top-4 text-slate-500 transition-all pointer-events-none peer-focus:-top-2 peer-focus:left-3 peer-focus:text-xs peer-focus:bg-white dark:peer-focus:bg-slate-950 peer-focus:px-1 peer-focus:text-blue-600 peer-[:not(:placeholder-shown)]:-top-2 peer-[:not(:placeholder-shown)]:left-3 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:bg-white dark:peer-[:not(:placeholder-shown)]:bg-slate-950 peer-[:not(:placeholder-shown)]:px-1"
                        >
                          Phone number (Optional)
                        </label>
                      </div>

                      {error && (
                        <p className="text-xs text-red-500 flex items-center gap-1.5">
                          <Info size={14}/> {error}
                        </p>
                      )}
                    </motion.div>
                  )}

                  {/* STEP 3: PASSWORD */}
                  {step === 3 && (
                    <motion.div 
                      key="step-password" 
                      initial={{ opacity: 0, x: 15 }} 
                      animate={{ opacity: 1, x: 0 }} 
                      exit={{ opacity: 0, x: -15 }} 
                      className="space-y-6"
                    >
                      <div className="relative group">
                        <input
                          type={showPassword ? "text" : "password"}
                          name="password"
                          required
                          value={formData.password}
                          onChange={handleInputChange}
                          className="w-full px-4 py-4 rounded-md border border-slate-300 dark:border-slate-700 bg-transparent focus:ring-[1px] focus:ring-blue-600 focus:border-blue-600 outline-none transition-all placeholder:text-transparent peer"
                          id="password"
                          placeholder="Password"
                        />
                        <button 
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        >
                          {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                        <label 
                          htmlFor="password"
                          className="absolute left-4 top-4 text-slate-500 transition-all pointer-events-none peer-focus:-top-2 peer-focus:left-3 peer-focus:text-xs peer-focus:bg-white dark:peer-focus:bg-slate-950 peer-focus:px-1 peer-focus:text-blue-600 peer-[:not(:placeholder-shown)]:-top-2 peer-[:not(:placeholder-shown)]:left-3 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:bg-white dark:peer-[:not(:placeholder-shown)]:bg-slate-950 peer-[:not(:placeholder-shown)]:px-1"
                        >
                          Password
                        </label>
                      </div>

                      <div className="relative group">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          name="confirmPassword"
                          required
                          value={formData.confirmPassword}
                          onChange={handleInputChange}
                          className="w-full px-4 py-4 rounded-md border border-slate-300 dark:border-slate-700 bg-transparent focus:ring-[1px] focus:ring-blue-600 focus:border-blue-600 outline-none transition-all placeholder:text-transparent peer"
                          id="confirmPassword"
                          placeholder="Confirm password"
                        />
                        <button 
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        >
                          {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                        <label 
                          htmlFor="confirmPassword"
                          className="absolute left-4 top-4 text-slate-500 transition-all pointer-events-none peer-focus:-top-2 peer-focus:left-3 peer-focus:text-xs peer-focus:bg-white dark:peer-focus:bg-slate-950 peer-focus:px-1 peer-focus:text-blue-600 peer-[:not(:placeholder-shown)]:-top-2 peer-[:not(:placeholder-shown)]:left-3 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:bg-white dark:peer-[:not(:placeholder-shown)]:bg-slate-950 peer-[:not(:placeholder-shown)]:px-1"
                        >
                          Confirm password
                        </label>
                      </div>

                      {error && (
                        <p className="text-xs text-red-500 flex items-center gap-1.5">
                          <Info size={14}/> {error}
                        </p>
                      )}
                      
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Use 6 or more characters with a mix of letters & numbers
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Action Buttons */}
              <div className={`mt-12 flex items-center justify-between ${step === 3 ? 'md:max-w-xs' : ''}`}>
                {step > 1 ? (
                  <button 
                    type="button" 
                    onClick={handleBack} 
                    className="text-blue-600 dark:text-blue-400 font-semibold px-2 py-2 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors flex items-center gap-1"
                  >
                    <ArrowLeft size={16}/> Back
                  </button>
                ) : (
                  <Link 
                    to="/login" 
                    className="text-blue-600 dark:text-blue-400 font-semibold px-2 py-2 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                  >
                    Sign in instead
                  </Link>
                )}
                
                <button 
                  type="submit" 
                  disabled={isLoading} 
                  className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-blue-400 text-white font-semibold px-6 py-2.5 rounded transition-all flex items-center justify-center min-w-[90px] shadow-sm"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    step === 3 ? 'Create Account' : 'Next'
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Right Side: Graphic (Only visible in Step 3 on Desktop) */}
          {step === 3 && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="hidden md:flex flex-1 flex-col items-center justify-center text-center p-8 border-l border-slate-100 dark:border-slate-800 ml-8"
            >
              <div className="relative w-48 h-48 mb-6">
                <div className="absolute inset-0 bg-blue-50 dark:bg-blue-900/10 rounded-full animate-pulse" />
                <div className="absolute inset-4 bg-blue-100 dark:bg-blue-900/20 rounded-full" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <ShieldCheck size={80} strokeWidth={1} className="text-blue-600 opacity-60" />
                </div>
              </div>
              <h3 className="text-lg font-medium text-slate-800 dark:text-slate-200 mb-2">Secure your financial future</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Your FinBrain account gives you access to AI-powered insights, automated tracking, and personalized financial advice.
              </p>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Global Footer */}
      <footer className={`w-full ${step === 3 ? 'max-w-[740px]' : 'max-w-[448px]'} mt-6 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-500 dark:text-slate-500 px-2 gap-4 transition-all duration-500`}>
        <div className="flex items-center gap-1 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-900 px-2 py-1 rounded transition-colors group">
          <Globe size={14} className="group-hover:text-blue-500" />
          <span>English (United States)</span>
          <ChevronDown size={14} />
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

export default Register;