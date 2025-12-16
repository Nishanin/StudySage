import React, { useState } from 'react';
import { Brain, Mail, Lock, User, ArrowLeft } from 'lucide-react';
import logoImage from '../assets/a1cc9b00771e3e571f802dca94aac15bb06b4f82.png';

export default function Auth({ onLogin, onBack, darkMode = false }) {
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    // Simulate authentication
    setTimeout(() => {
      onLogin();
    }, 500);
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-purple-900' : 'bg-gradient-to-br from-purple-50 via-white to-violet-50'} flex items-center justify-center p-6`}>
      <button 
        onClick={onBack}
        className={`absolute top-6 left-6 flex items-center gap-2 ${darkMode ? 'text-gray-300 hover:text-purple-400' : 'text-gray-600 hover:text-purple-600'} transition-colors`}
      >
        <ArrowLeft className="w-5 h-5" />
        Back
      </button>

      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-white rounded-2xl mb-4 p-3">
            <img src={logoImage} alt="StudySage Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className={`text-3xl mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Welcome to StudySage</h1>
          <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>StudySage</p>
        </div>

        {/* Auth Card */}
        <div className={`${darkMode ? 'bg-gray-800/60 border-gray-700' : 'bg-white border-purple-100'} rounded-3xl shadow-xl border p-8 backdrop-blur-sm`}>
          <div className={`flex gap-2 mb-8 ${darkMode ? 'bg-gray-700/50' : 'bg-purple-50'} rounded-xl p-1`}>
            <button
              onClick={() => setIsSignup(false)}
              className={`flex-1 py-2.5 rounded-lg transition-all ${
                !isSignup 
                  ? darkMode 
                    ? 'bg-white shadow-sm text-purple-600' 
                    : 'bg-white shadow-sm text-purple-600'
                  : darkMode 
                    ? 'text-gray-400 hover:text-purple-400' 
                    : 'text-gray-600 hover:text-purple-600'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setIsSignup(true)}
              className={`flex-1 py-2.5 rounded-lg transition-all ${
                isSignup 
                  ? darkMode 
                    ? 'bg-white shadow-sm text-purple-600' 
                    : 'bg-white shadow-sm text-purple-600'
                  : darkMode 
                    ? 'text-gray-400 hover:text-purple-400' 
                    : 'text-gray-600 hover:text-purple-600'
              }`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {isSignup && (
              <div>
                <label className={`block mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Full Name</label>
                <div className="relative">
                  <User className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    className={`w-full pl-12 pr-4 py-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all ${
                      darkMode 
                        ? 'bg-gray-700/50 border border-gray-600 text-white placeholder-gray-500' 
                        : 'bg-purple-50 border border-purple-100'
                    }`}
                    required={isSignup}
                  />
                </div>
              </div>
            )}

            <div>
              <label className={`block mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Email</label>
              <div className="relative">
                <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@university.edu"
                  className={`w-full pl-12 pr-4 py-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all ${
                    darkMode 
                      ? 'bg-gray-700/50 border border-gray-600 text-white placeholder-gray-500' 
                      : 'bg-purple-50 border border-purple-100'
                  }`}
                  required
                />
              </div>
            </div>

            <div>
              <label className={`block mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Password</label>
              <div className="relative">
                <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full pl-12 pr-4 py-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all ${
                    darkMode 
                      ? 'bg-gray-700/50 border border-gray-600 text-white placeholder-gray-500' 
                      : 'bg-purple-50 border border-purple-100'
                  }`}
                  required
                />
              </div>
            </div>

            {!isSignup && (
              <div className="flex items-center justify-between text-sm">
                <label className={`flex items-center gap-2 cursor-pointer ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  <input 
                    type="checkbox" 
                    className={`w-4 h-4 rounded focus:ring-purple-500 ${
                      darkMode 
                        ? 'border-gray-600 bg-gray-700 text-purple-600' 
                        : 'border-purple-300 text-purple-600'
                    }`} 
                  />
                  Remember me
                </label>
                <a href="#" className={darkMode ? 'text-purple-400 hover:text-purple-300' : 'text-purple-600 hover:text-purple-700'}>
                  Forgot password?
                </a>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-4 bg-gradient-to-r from-purple-600 to-violet-600 text-white rounded-xl hover:shadow-lg hover:shadow-purple-500/50 transition-all"
            >
              {isSignup ? 'Create Account' : 'Sign In'}
            </button>
          </form>

          <div className={`mt-6 text-center text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button 
              onClick={() => setIsSignup(!isSignup)}
              className={darkMode ? 'text-purple-400 hover:text-purple-300' : 'text-purple-600 hover:text-purple-700'}
            >
              {isSignup ? 'Sign in' : 'Sign up'}
            </button>
          </div>
        </div>

        <p className={`text-center text-sm mt-6 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}