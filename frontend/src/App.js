import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import './App.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Auth Context
const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchUserInfo();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUserInfo = async () => {
    try {
      const response = await axios.get(`${API}/auth/me`);
      setUser(response.data);
    } catch (error) {
      console.error('Error fetching user info:', error);
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await axios.post(`${API}/auth/login`, { email, password });
      const { access_token } = response.data;
      localStorage.setItem('token', access_token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      await fetchUserInfo();
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const register = async (name, email, password) => {
    try {
      const response = await axios.post(`${API}/auth/register`, { name, email, password });
      return true;
    } catch (error) {
      console.error('Registration error:', error);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading, theme, toggleTheme }}>
      {children}
    </AuthContext.Provider>
  );
};

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Components
const Navbar = () => {
  const { user, logout, theme, toggleTheme } = useAuth();
  const [sideMenuOpen, setSideMenuOpen] = useState(false);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 ${theme === 'dark' ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'} border-b transition-colors duration-300`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <button
              onClick={() => setSideMenuOpen(true)}
              className={`md:hidden p-2 rounded-md ${theme === 'dark' ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <Link to="/" className="flex items-center">
              <h1 className={`text-2xl font-bold ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'} tracking-wide`}>
                Radiologix
              </h1>
            </Link>
          </div>
          
          <div className="hidden md:flex items-center space-x-6">
            <Link to="/scan" className={`${theme === 'dark' ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-gray-900'} transition-colors`}>
              Scan
            </Link>
            <Link to="/about" className={`${theme === 'dark' ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-gray-900'} transition-colors`}>
              About
            </Link>
            <Link to="/faq" className={`${theme === 'dark' ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-gray-900'} transition-colors`}>
              FAQ
            </Link>
            <Link to="/contact" className={`${theme === 'dark' ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-gray-900'} transition-colors`}>
              Contact
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-full ${theme === 'dark' ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}
            >
              {theme === 'dark' ? (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
            
            {user ? (
              <div className="flex items-center space-x-4">
                <span className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Welcome, {user.name}
                </span>
                <button
                  onClick={logout}
                  className={`px-4 py-2 rounded-md ${theme === 'dark' ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-red-500 hover:bg-red-600 text-white'} transition-colors`}
                >
                  Logout
                </button>
              </div>
            ) : (
              <button
                onClick={() => {/* Login modal will be handled by parent */}}
                className={`px-4 py-2 rounded-md ${theme === 'dark' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'} transition-colors`}
              >
                Login
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Side Menu */}
      {sideMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setSideMenuOpen(false)}></div>
          <div className={`fixed top-0 left-0 h-full w-64 ${theme === 'dark' ? 'bg-gray-900' : 'bg-white'} shadow-lg transform transition-transform duration-300 ease-in-out`}>
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className={`text-xl font-bold ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>
                Radiologix
              </h2>
              <button
                onClick={() => setSideMenuOpen(false)}
                className={`p-2 rounded-md ${theme === 'dark' ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4">
              <nav className="space-y-4">
                <Link to="/" className={`block py-2 px-4 rounded-md ${theme === 'dark' ? 'text-gray-300 hover:text-white hover:bg-gray-700' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'}`} onClick={() => setSideMenuOpen(false)}>
                  Home
                </Link>
                <Link to="/scan" className={`block py-2 px-4 rounded-md ${theme === 'dark' ? 'text-gray-300 hover:text-white hover:bg-gray-700' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'}`} onClick={() => setSideMenuOpen(false)}>
                  Scan
                </Link>
                <Link to="/about" className={`block py-2 px-4 rounded-md ${theme === 'dark' ? 'text-gray-300 hover:text-white hover:bg-gray-700' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'}`} onClick={() => setSideMenuOpen(false)}>
                  About
                </Link>
                <Link to="/faq" className={`block py-2 px-4 rounded-md ${theme === 'dark' ? 'text-gray-300 hover:text-white hover:bg-gray-700' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'}`} onClick={() => setSideMenuOpen(false)}>
                  FAQ
                </Link>
                <Link to="/contact" className={`block py-2 px-4 rounded-md ${theme === 'dark' ? 'text-gray-300 hover:text-white hover:bg-gray-700' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'}`} onClick={() => setSideMenuOpen(false)}>
                  Contact
                </Link>
              </nav>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

const LoginModal = ({ isOpen, onClose }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register, theme } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        const success = await login(email, password);
        if (success) {
          onClose();
        } else {
          setError('Invalid email or password');
        }
      } else {
        const success = await register(name, email, password);
        if (success) {
          setError('');
          setIsLogin(true);
          setName('');
          setEmail('');
          setPassword('');
          alert('Registration successful! Please login.');
        } else {
          setError('Registration failed. Email might already be in use.');
        }
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`${theme === 'dark' ? 'bg-gray-900' : 'bg-white'} p-8 rounded-lg shadow-xl max-w-md w-full mx-4`}>
        <div className="flex justify-between items-center mb-6">
          <h2 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            {isLogin ? 'Login' : 'Register'}
          </h2>
          <button
            onClick={onClose}
            className={`${theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'} text-2xl`}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${theme === 'dark' ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
              />
            </div>
          )}

          <div>
            <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${theme === 'dark' ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
            />
          </div>

          <div>
            <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${theme === 'dark' ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 px-4 rounded-md text-white font-medium ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'} transition-colors`}
          >
            {loading ? 'Processing...' : (isLogin ? 'Login' : 'Register')}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className={`text-sm ${theme === 'dark' ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-500'}`}
          >
            {isLogin ? "Don't have an account? Register" : "Already have an account? Login"}
          </button>
        </div>
      </div>
    </div>
  );
};

const Hero = () => {
  const { theme } = useAuth();

  return (
    <div className={`relative ${theme === 'dark' ? 'bg-gray-900' : 'bg-white'} overflow-hidden`}>
      <div className="max-w-7xl mx-auto">
        <div className="relative z-10 pb-8 sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32">
          <main className="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
            <div className="sm:text-center lg:text-left">
              <h1 className={`text-4xl tracking-tight font-extrabold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} sm:text-5xl md:text-6xl`}>
                <span className="block xl:inline">Radiologix:</span>{' '}
                <span className={`block ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'} xl:inline`}>
                  Advanced Radiology Solutions
                </span>
              </h1>
              <p className={`mt-3 text-base ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'} sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0`}>
                Experience cutting-edge AI-powered radiology reporting with our state-of-the-art technology. 
                Fast, accurate, and reliable medical imaging analysis at your fingertips.
              </p>
              <div className="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start">
                <div className="rounded-md shadow">
                  <Link
                    to="/scan"
                    className={`w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white ${theme === 'dark' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} md:py-4 md:text-lg md:px-10 transition-colors`}
                  >
                    Start Scanning
                  </Link>
                </div>
                <div className="mt-3 sm:mt-0 sm:ml-3">
                  <Link
                    to="/about"
                    className={`w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md ${theme === 'dark' ? 'text-blue-400 bg-gray-800 hover:bg-gray-700' : 'text-blue-600 bg-blue-50 hover:bg-blue-100'} md:py-4 md:text-lg md:px-10 transition-colors`}
                  >
                    Learn More
                  </Link>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
      <div className="lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2">
        <img
          className="h-56 w-full object-cover sm:h-72 md:h-96 lg:w-full lg:h-full"
          src="https://images.unsplash.com/photo-1655393001768-d946c97d6fd1?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDF8MHwxfHNlYXJjaHwzfHxtZWRpY2FsJTIwcmFkaW9sb2d5fGVufDB8fHxibHVlfDE3NTI1OTQxMTV8MA&ixlib=rb-4.1.0&q=85"
          alt="Medical Equipment"
        />
      </div>
    </div>
  );
};

const FeatureSection = () => {
  const { theme } = useAuth();

  const features = [
    {
      title: 'Cutting-Edge Technology',
      description: 'Advanced AI algorithms powered by machine learning to provide accurate and fast radiology analysis.',
      image: 'https://images.unsplash.com/photo-1706065264583-55f1a8549769?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDF8MHwxfHNlYXJjaHwxfHxtZWRpY2FsJTIwcmFkaW9sb2d5fGVufDB8fHxibHVlfDE3NTI1OTQxMTV8MA&ixlib=rb-4.1.0&q=85',
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      )
    },
    {
      title: 'Expert Radiologists',
      description: 'Our team of certified radiologists ensures the highest quality of medical imaging interpretation.',
      image: 'https://images.pexels.com/photos/7723513/pexels-photo-7723513.jpeg',
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      )
    },
    {
      title: 'Rapid AI Reports',
      description: 'Get comprehensive radiology reports in minutes, not hours, with our advanced AI processing.',
      image: 'https://images.unsplash.com/photo-1716996641746-25e77e53c45b?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDF8MHwxfHNlYXJjaHwyfHxtZWRpY2FsJTIwcmFkaW9sb2d5fGVufDB8fHxibHVlfDE3NTI1OTQxMTV8MA&ixlib=rb-4.1.0&q=85',
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      )
    }
  ];

  return (
    <div className={`py-12 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:text-center">
          <h2 className={`text-base ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'} font-semibold tracking-wide uppercase`}>
            Features
          </h2>
          <p className={`mt-2 text-3xl leading-8 font-extrabold tracking-tight ${theme === 'dark' ? 'text-white' : 'text-gray-900'} sm:text-4xl`}>
            Advanced Radiology at Your Fingertips
          </p>
          <p className={`mt-4 max-w-2xl text-xl ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'} lg:mx-auto`}>
            Experience the future of medical imaging with our comprehensive suite of radiology tools and AI-powered analysis.
          </p>
        </div>

        <div className="mt-10">
          <div className="space-y-10 md:space-y-0 md:grid md:grid-cols-3 md:gap-x-8 md:gap-y-10">
            {features.map((feature, index) => (
              <div key={index} className={`${theme === 'dark' ? 'bg-gray-900' : 'bg-white'} rounded-lg shadow-lg overflow-hidden`}>
                <div className="h-48 bg-gradient-to-br from-blue-500 to-purple-600 p-6 flex items-center justify-center">
                  <img
                    src={feature.image}
                    alt={feature.title}
                    className="h-32 w-32 object-cover rounded-full border-4 border-white shadow-lg"
                  />
                </div>
                <div className="p-6">
                  <div className="flex items-center">
                    <div className={`flex-shrink-0 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-500'}`}>
                      {feature.icon}
                    </div>
                    <div className="ml-4">
                      <h3 className={`text-lg leading-6 font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        {feature.title}
                      </h3>
                    </div>
                  </div>
                  <p className={`mt-2 text-base ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const Footer = () => {
  const { theme } = useAuth();

  return (
    <footer className={`${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'} border-t ${theme === 'dark' ? 'border-gray-800' : 'border-gray-200'}`}>
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <h3 className={`text-2xl font-bold ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>
              Radiologix
            </h3>
            <p className={`mt-2 text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
              Advanced radiology solutions powered by AI technology for faster, more accurate medical imaging analysis.
            </p>
          </div>
          <div>
            <h4 className={`text-sm font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-900'} uppercase tracking-wider`}>
              Services
            </h4>
            <ul className="mt-4 space-y-2">
              <li>
                <Link to="/scan/ct" className={`text-sm ${theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}>
                  CT Scan
                </Link>
              </li>
              <li>
                <Link to="/scan/xray" className={`text-sm ${theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}>
                  X-Ray
                </Link>
              </li>
              <li>
                <Link to="/scan/mri" className={`text-sm ${theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}>
                  MRI
                </Link>
              </li>
              <li>
                <Link to="/scan/ultrasound" className={`text-sm ${theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}>
                  Ultrasound
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className={`text-sm font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-900'} uppercase tracking-wider`}>
              Company
            </h4>
            <ul className="mt-4 space-y-2">
              <li>
                <Link to="/about" className={`text-sm ${theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}>
                  About
                </Link>
              </li>
              <li>
                <Link to="/contact" className={`text-sm ${theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}>
                  Contact
                </Link>
              </li>
              <li>
                <Link to="/faq" className={`text-sm ${theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}>
                  FAQ
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className={`mt-8 pt-8 border-t ${theme === 'dark' ? 'border-gray-800' : 'border-gray-200'}`}>
          <p className={`text-center text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            © 2025 Radiologix. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

// Pages
const Home = () => {
  const { user, theme } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    if (!user) {
      const timer = setTimeout(() => {
        setShowLoginModal(true);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [user]);

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-white'}`}>
      <div className="pt-16">
        <Hero />
        <FeatureSection />
        <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
      </div>
    </div>
  );
};

const ScanOverview = () => {
  const { theme } = useAuth();

  const scanTypes = [
    {
      name: 'CT Scan',
      description: 'Computed Tomography for detailed cross-sectional imaging',
      image: 'https://images.unsplash.com/photo-1655393001768-d946c97d6fd1?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDF8MHwxfHNlYXJjaHwzfHxtZWRpY2FsJTIwcmFkaW9sb2d5fGVufDB8fHxibHVlfDE3NTI1OTQxMTV8MA&ixlib=rb-4.1.0&q=85',
      path: '/scan/ct'
    },
    {
      name: 'X-Ray',
      description: 'Traditional radiography for bone and tissue imaging',
      image: 'https://images.unsplash.com/photo-1716996641746-25e77e53c45b?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDF8MHwxfHNlYXJjaHwyfHxtZWRpY2FsJTIwcmFkaW9sb2d5fGVufDB8fHxibHVlfDE3NTI1OTQxMTV8MA&ixlib=rb-4.1.0&q=85',
      path: '/scan/xray'
    },
    {
      name: 'MRI',
      description: 'Magnetic Resonance Imaging for soft tissue analysis',
      image: 'https://images.unsplash.com/photo-1706065264583-55f1a8549769?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDF8MHwxfHNlYXJjaHwxfHxtZWRpY2FsJTIwcmFkaW9sb2d5fGVufDB8fHxibHVlfDE3NTI1OTQxMTV8MA&ixlib=rb-4.1.0&q=85',
      path: '/scan/mri'
    },
    {
      name: 'Ultrasound',
      description: 'Non-invasive imaging using sound waves',
      image: 'https://images.pexels.com/photos/6234988/pexels-photo-6234988.jpeg',
      path: '/scan/ultrasound'
    }
  ];

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-white'} pt-16`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className={`text-4xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-4`}>
            Scan Services
          </h1>
          <p className={`text-xl ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} mb-12`}>
            Choose from our comprehensive range of radiology services
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {scanTypes.map((scan, index) => (
            <Link key={index} to={scan.path} className={`${theme === 'dark' ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-50'} rounded-lg shadow-lg overflow-hidden transition-all duration-300 transform hover:scale-105`}>
              <div className="h-48 bg-gradient-to-br from-blue-500 to-purple-600 p-4">
                <img
                  src={scan.image}
                  alt={scan.name}
                  className="w-full h-full object-cover rounded-md"
                />
              </div>
              <div className="p-6">
                <h3 className={`text-xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-2`}>
                  {scan.name}
                </h3>
                <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                  {scan.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

const ScanPage = () => {
  const { type } = useParams();
  const { user, theme } = useAuth();
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');

  const scanInfo = {
    ct: {
      name: 'CT Scan',
      description: 'Computed Tomography provides detailed cross-sectional images of the body using X-rays from multiple angles.',
      image: 'https://images.unsplash.com/photo-1655393001768-d946c97d6fd1?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDF8MHwxfHNlYXJjaHwzfHxtZWRpY2FsJTIwcmFkaW9sb2d5fGVufDB8fHxibHVlfDE3NTI1OTQxMTV8MA&ixlib=rb-4.1.0&q=85'
    },
    xray: {
      name: 'X-Ray',
      description: 'Traditional radiography uses electromagnetic radiation to create images of bones and tissues.',
      image: 'https://images.unsplash.com/photo-1716996641746-25e77e53c45b?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDF8MHwxfHNlYXJjaHwyfHxtZWRpY2FsJTIwcmFkaW9sb2d5fGVufDB8fHxibHVlfDE3NTI1OTQxMTV8MA&ixlib=rb-4.1.0&q=85'
    },
    mri: {
      name: 'MRI',
      description: 'Magnetic Resonance Imaging uses strong magnetic fields and radio waves to create detailed images of soft tissues.',
      image: 'https://images.unsplash.com/photo-1706065264583-55f1a8549769?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDF8MHwxfHNlYXJjaHwxfHxtZWRpY2FsJTIwcmFkaW9sb2d5fGVufDB8fHxibHVlfDE3NTI1OTQxMTV8MA&ixlib=rb-4.1.0&q=85'
    },
    ultrasound: {
      name: 'Ultrasound',
      description: 'Non-invasive imaging technique using high-frequency sound waves to create real-time images.',
      image: 'https://images.pexels.com/photos/6234988/pexels-photo-6234988.jpeg'
    }
  };

  const currentScan = scanInfo[type] || scanInfo.ct;

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setError('');
    }
  };

  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file to upload');
      return;
    }

    if (!user) {
      setError('Please login to upload scans');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const base64Image = await convertToBase64(selectedFile);
      
      const formData = new FormData();
      formData.append('scan_type', type);
      formData.append('image_data', base64Image);

      const response = await axios.post(`${API}/scans`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setReport(response.data);
      setSelectedFile(null);
    } catch (error) {
      console.error('Upload error:', error);
      setError('Failed to upload and process scan. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  if (!user) {
    return (
      <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-white'} pt-16`}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className={`text-4xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-4`}>
              Please Login
            </h1>
            <p className={`text-xl ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} mb-8`}>
              You need to be logged in to upload and analyze scans.
            </p>
            <button
              onClick={() => navigate('/')}
              className={`px-6 py-3 rounded-md ${theme === 'dark' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white font-medium transition-colors`}
            >
              Go to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-white'} pt-16`}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className={`text-4xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-4`}>
            {currentScan.name}
          </h1>
          <p className={`text-xl ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} mb-8`}>
            {currentScan.description}
          </p>
          <img
            src={currentScan.image}
            alt={currentScan.name}
            className="mx-auto h-64 w-full max-w-md object-cover rounded-lg shadow-lg"
          />
        </div>

        <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg p-8 mb-8`}>
          <h2 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-6`}>
            Upload Your Scan
          </h2>
          
          <div className="space-y-6">
            <div>
              <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                Select Image File
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className={`block w-full text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-900'} file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold ${theme === 'dark' ? 'file:bg-blue-600 file:text-white hover:file:bg-blue-700' : 'file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100'}`}
              />
            </div>

            {selectedFile && (
              <div className="mt-4">
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                  Selected: {selectedFile.name}
                </p>
              </div>
            )}

            {error && (
              <div className="text-red-500 text-sm">{error}</div>
            )}

            <button
              onClick={handleUpload}
              disabled={uploading || !selectedFile}
              className={`w-full py-3 px-4 rounded-md font-medium text-white transition-colors ${
                uploading || !selectedFile
                  ? 'bg-gray-400 cursor-not-allowed'
                  : `${theme === 'dark' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'}`
              }`}
            >
              {uploading ? 'Processing...' : 'Upload and Analyze'}
            </button>
          </div>
        </div>

        {report && (
          <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg p-8`}>
            <h2 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-6`}>
              AI Analysis Report
            </h2>
            
            <div className="space-y-6">
              <div>
                <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-2`}>
                  Scan Information
                </h3>
                <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                  Type: {report.scan_type.toUpperCase()}
                </p>
                <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                  Date: {new Date(report.created_at).toLocaleDateString()}
                </p>
              </div>

              <div>
                <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-2`}>
                  Uploaded Image
                </h3>
                <img
                  src={report.image_data}
                  alt="Uploaded scan"
                  className="max-w-full h-auto max-h-96 object-contain rounded-lg border"
                />
              </div>

              <div>
                <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-2`}>
                  AI Analysis
                </h3>
                <div className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-4`}>
                  <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} whitespace-pre-wrap`}>
                    {report.ai_report}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const About = () => {
  const { theme } = useAuth();

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-white'} pt-16`}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className={`text-4xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-4`}>
            About Radiologix
          </h1>
          <p className={`text-xl ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
            Revolutionizing radiology with cutting-edge AI technology
          </p>
        </div>

        <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg p-8 mb-8`}>
          <h2 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-4`}>
            Our Mission
          </h2>
          <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} text-lg leading-relaxed`}>
            At Radiologix, we are committed to transforming healthcare through advanced radiology solutions. 
            Our mission is to provide healthcare professionals with the most accurate, efficient, and accessible 
            radiology services powered by artificial intelligence and cutting-edge technology.
          </p>
        </div>

        <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg p-8 mb-8`}>
          <h2 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-4`}>
            Our Technology
          </h2>
          <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} text-lg leading-relaxed mb-4`}>
            We leverage state-of-the-art machine learning algorithms and computer vision technology to provide:
          </p>
          <ul className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} text-lg space-y-2`}>
            <li>• Rapid and accurate image analysis</li>
            <li>• Automated report generation</li>
            <li>• Quality assurance and validation</li>
            <li>• Integration with existing healthcare systems</li>
          </ul>
        </div>

        <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg p-8`}>
          <h2 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-4`}>
            Our Team
          </h2>
          <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} text-lg leading-relaxed`}>
            Our interdisciplinary team consists of experienced radiologists, AI researchers, software engineers, 
            and healthcare professionals who are passionate about improving patient outcomes through technology. 
            Together, we work tirelessly to push the boundaries of what's possible in medical imaging.
          </p>
        </div>
      </div>
    </div>
  );
};

const FAQ = () => {
  const { theme } = useAuth();
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      question: "How accurate is the AI analysis?",
      answer: "Our AI technology has been trained on thousands of medical images and achieves high accuracy rates. However, all AI-generated reports should be reviewed by qualified healthcare professionals for final diagnosis."
    },
    {
      question: "What types of scans are supported?",
      answer: "We currently support CT scans, X-rays, MRI, and ultrasound images. We're continuously working to expand our capabilities to include more imaging modalities."
    },
    {
      question: "How long does it take to get results?",
      answer: "Our AI analysis typically provides results within minutes of uploading your scan. The exact time depends on the image size and complexity."
    },
    {
      question: "Is my data secure?",
      answer: "Yes, we take data security very seriously. All uploaded images and reports are encrypted and stored securely. We comply with healthcare data protection regulations."
    },
    {
      question: "Can I download my reports?",
      answer: "Yes, you can access and download all your scan reports from your account dashboard at any time."
    }
  ];

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-white'} pt-16`}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className={`text-4xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-4`}>
            Frequently Asked Questions
          </h1>
          <p className={`text-xl ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
            Find answers to common questions about Radiologix
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg`}>
              <button
                onClick={() => toggleFAQ(index)}
                className={`w-full text-left p-6 focus:outline-none ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} transition-colors`}
              >
                <div className="flex items-center justify-between">
                  <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {faq.question}
                  </h3>
                  <svg
                    className={`w-5 h-5 transform transition-transform ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} ${openIndex === index ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>
              {openIndex === index && (
                <div className="px-6 pb-6">
                  <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                    {faq.answer}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const Contact = () => {
  const { theme } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle form submission (placeholder)
    alert('Thank you for your message! We will get back to you soon.');
    setFormData({ name: '', email: '', message: '' });
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-white'} pt-16`}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className={`text-4xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-4`}>
            Contact Us
          </h1>
          <p className={`text-xl ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
            Get in touch with our team
          </p>
        </div>

        <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg p-8`}>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
              />
            </div>

            <div>
              <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
              />
            </div>

            <div>
              <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                Message
              </label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                rows={6}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
              />
            </div>

            <button
              type="submit"
              className={`w-full py-3 px-4 rounded-md font-medium text-white transition-colors ${theme === 'dark' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'}`}
            >
              Send Message
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

function App() {
  const { theme } = useAuth();

  return (
    <div className={theme}>
      <Router>
        <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-white'}`}>
          <Navbar />
          <main>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/scan" element={<ScanOverview />} />
              <Route path="/scan/:type" element={<ScanPage />} />
              <Route path="/about" element={<About />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/contact" element={<Contact />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </div>
  );
}

export default function AppWrapper() {
  return (
    <AuthProvider>
      <App />
    </AuthProvider>
  );
}