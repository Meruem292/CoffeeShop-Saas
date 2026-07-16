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
        <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />
      </div>

      <div
        className="bg-[#0a0a0c] rounded-[3rem] p-10 max-w-sm w-full shadow-[0_50px_100px_-20px_rgba(0,0,0,0.8)] relative border-2 border-white/5 z-10 backdrop-blur-xl animate-in zoom-in-95 duration-500"
      >
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 text-white/40 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-white/5 text-amber-500 rounded-2xl flex items-center justify-center mb-6 shadow-inner border border-white/10">
            <Store className="w-8 h-8" />
          </div>
          <h2 className="text-3xl font-black text-white text-center uppercase italic tracking-tighter">
            Staff <span className="text-white/20">Login</span>
          </h2>
          <p className="text-coffee-600 text-center text-[10px] font-black uppercase tracking-[0.2em] mt-3 opacity-50">
            Authentication Required
          </p>
        </div>

        {error && (
          <div className="bg-rose-500/10 text-rose-500 p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest mb-6 border border-rose-500/20">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-coffee-600 uppercase tracking-[0.3em] ml-1">Email Terminal</label>
            <input 
              type="email" 
              required 
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl focus:border-amber-500/50 outline-none text-white font-bold transition-all placeholder:text-coffee-900" 
              placeholder="admin@astro.local"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-coffee-600 uppercase tracking-[0.3em] ml-1">Access Key</label>
            <input 
              type="password" 
              required 
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl focus:border-amber-500/50 outline-none text-white font-bold transition-all placeholder:text-coffee-900" 
              placeholder="••••••••"
            />
          </div>
          
          <button
            disabled={loading}
            type="submit"
            className="w-full py-5 bg-white hover:bg-white/90 text-black rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl transition-all disabled:opacity-30 disabled:grayscale active:scale-95"
          >
            {loading ? 'Decrypting...' : 'Authenticate'}
          </button>
        </form>
      </div>
    </div>
  );
}
