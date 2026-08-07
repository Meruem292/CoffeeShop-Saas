import React, { useState } from 'react';
import { Mail, Lock, User, X, Sparkles, Store } from 'lucide-react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '../firebase';
import { useAuth } from '../lib/AuthContext';
import { useToast } from '../lib/ToastContext';

interface UnifiedAuthModalProps {
  onClose: () => void;
  onSuccess?: (displayName: string) => void;
}

export function UnifiedAuthModal({ onClose, onSuccess }: UnifiedAuthModalProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { signInWithEmail } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        if (!name.trim()) {
          throw new Error('Please enter your name.');
        }
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, {
          displayName: name.trim(),
        });
        if (onSuccess) onSuccess(name.trim());
        toast.success('Account created successfully!');
      } else {
        await signInWithEmail(email, password);
        if (onSuccess) onSuccess(auth.currentUser?.displayName || email.split('@')[0] || 'Customer');
        toast.success('Successfully logged in!');
      }
      onClose();
    } catch (err: any) {
      console.error('Auth Error:', err);
      let friendlyMessage = err.message;
      if (err.code === 'auth/email-already-in-use') {
        friendlyMessage = 'This email is already registered. Try logging in instead!';
      } else if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        friendlyMessage = 'Invalid email or password. Please try again.';
      } else if (err.code === 'auth/weak-password') {
        friendlyMessage = 'Password should be at least 6 characters.';
      } else if (err.code === 'auth/invalid-email') {
        friendlyMessage = 'Please enter a valid email address.';
      }
      setError(friendlyMessage || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-slate-300 dark:bg-black/60 backdrop-blur-md" />
      </div>

      <div className="bg-white dark:bg-[#0a0a0c] rounded-[2.5rem] p-8 md:p-10 max-w-sm w-full shadow-[0_50px_100px_-20px_rgba(0,0,0,0.8)] relative border border-black/10 dark:border-white/5 z-10 animate-in zoom-in-95 duration-300">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 text-slate-500 dark:text-white/40 hover:text-slate-900 dark:hover:text-white bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 rounded-full transition-all"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex flex-col items-center mb-6">
          <div className="w-14 h-14 bg-amber-500/10 text-amber-500 rounded-2xl flex items-center justify-center mb-4 border border-amber-500/20">
            <Sparkles className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white text-center uppercase italic tracking-tighter">
            {isSignUp ? 'Create' : 'Account'} <span className="text-amber-500">Login</span>
          </h2>
        </div>

        {error && (
          <div className="bg-rose-500/10 text-rose-500 p-4 rounded-xl text-[10px] font-black uppercase tracking-widest mb-6 border border-rose-500/20">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div className="space-y-1">
              <label className="block text-[9px] font-black text-coffee-600 uppercase tracking-[0.25em] ml-1">Your Name</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-3.5 pl-11 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl focus:border-amber-500/50 outline-none text-slate-900 dark:text-white font-bold text-sm transition-all placeholder:text-coffee-900"
                  placeholder="e.g. John Doe"
                />
                <User className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 dark:text-white/30" />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="block text-[9px] font-black text-coffee-600 uppercase tracking-[0.25em] ml-1">Email</label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3.5 pl-11 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl focus:border-amber-500/50 outline-none text-slate-900 dark:text-white font-bold text-sm transition-all placeholder:text-coffee-900"
                placeholder="you@example.com"
              />
              <Mail className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 dark:text-white/30" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-[9px] font-black text-coffee-600 uppercase tracking-[0.25em] ml-1">Password</label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3.5 pl-11 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl focus:border-amber-500/50 outline-none text-slate-900 dark:text-white font-bold text-sm transition-all placeholder:text-coffee-900"
                placeholder="••••••••"
              />
              <Lock className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 dark:text-white/30" />
            </div>
          </div>

          <button
            disabled={loading}
            type="submit"
            className="w-full py-4 mt-2 bg-amber-500 hover:bg-amber-400 text-black rounded-xl font-black uppercase tracking-widest text-xs shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
          >
            {loading ? 'Authenticating...' : isSignUp ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center space-y-2">
             <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError('');
              }}
              className="block w-full text-[10px] font-black text-amber-500 hover:text-amber-400 uppercase tracking-wider transition-all"
            >
              {isSignUp ? 'Already have an account? Log In' : "Don't have an account? Sign Up"}
            </button>
        </div>
      </div>
    </div>
  );

}
