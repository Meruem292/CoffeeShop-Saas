import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Store, X } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import Silk from './Silk';

export function AdminLoginModal({ onClose }: { onClose: () => void }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { signIn, signInWithEmail, signUpWithEmail, makeAdmin } = useAuth();
  
  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      await signIn();
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to sign in with Google');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await signInWithEmail(email, password);
      } else {
        const newUser = await signUpWithEmail(email, password);
        await makeAdmin(newUser); // automatically make the new user admin for demo
      }
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
    >
      <div className="absolute inset-0 z-0">
        <Silk color="#2d1b15" speed={2} scale={0.5} noiseIntensity={0.5} />
        <div className="absolute inset-0 bg-coffee-950/40 backdrop-blur-sm" />
      </div>

      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="bg-white/95 rounded-3xl p-8 max-w-sm w-full shadow-2xl relative border-2 border-coffee-100 z-10 backdrop-blur-md"
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-coffee-400 hover:text-coffee-900 bg-coffee-50 hover:bg-coffee-100 rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 bg-coffee-100 text-coffee-900 rounded-full flex items-center justify-center mb-4">
            <Store className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-coffee-900 text-center">
            {isLogin ? 'Staff Login' : 'Register Staff'}
          </h2>
          <p className="text-coffee-600 text-center text-sm mt-1">
            {isLogin ? 'Enter your credentials to access the admin portal.' : 'Create a new staff account.'}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm mb-4 border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-coffee-700 mb-1">Email</label>
            <input 
              type="email" 
              required 
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full p-3 border border-coffee-200 rounded-xl focus:ring-2 focus:ring-coffee-500 bg-coffee-50/50" 
              placeholder="admin@coffeehouse.local"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-coffee-700 mb-1">Password</label>
            <input 
              type="password" 
              required 
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full p-3 border border-coffee-200 rounded-xl focus:ring-2 focus:ring-coffee-500 bg-coffee-50/50" 
              placeholder="••••••••"
            />
          </div>
          
          <button
            disabled={loading}
            type="submit"
            className="w-full py-3 bg-coffee-900 hover:bg-coffee-800 text-white rounded-xl font-bold text-base shadow-md transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? 'Please wait...' : (isLogin ? 'Log In' : 'Register Account')}
          </button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-coffee-200"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white/95 px-2 text-coffee-500">Or continue with</span>
          </div>
        </div>

        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full py-3 bg-white border border-coffee-200 hover:bg-coffee-50 text-coffee-700 rounded-xl font-bold text-base shadow-sm transition-colors flex items-center justify-center gap-3 disabled:opacity-70"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Google
        </button>

        <div className="mt-6 text-center">
          <button 
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="text-coffee-600 hover:text-coffee-900 text-sm font-medium transition-colors underline"
          >
            {isLogin ? "Need a staff account? Register here" : "Already have an account? Log in"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
