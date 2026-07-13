import React, { useState } from 'react';
import { Store, X } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';

export function AdminLoginModal({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { signInWithEmail } = useAuth();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signInWithEmail(email, password);
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
    >
      <div className="absolute inset-0 z-0">
        
        <div className="absolute inset-0 bg-coffee-950/40 backdrop-blur-sm" />
      </div>

      <div
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
            Staff Login
          </h2>
          <p className="text-coffee-600 text-center text-sm mt-1">
            Enter your credentials to access the admin portal.
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
            {loading ? 'Please wait...' : 'Log In'}
          </button>
        </form>
      </div>
    </div>
  );
}
