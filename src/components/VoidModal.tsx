import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';

interface VoidModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  title: string;
}

const VOID_REASONS = [
  'Invalid Receipt',
  'Not Received',
  'Incorrect Order',
  'Customer Request',
  'System Error',
  'Other'
];

export function VoidModal({ isOpen, onClose, onConfirm, title }: VoidModalProps) {
  const [reason, setReason] = useState(VOID_REASONS[0]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="bg-white dark:bg-[#0b1329] w-full max-w-sm rounded-[2rem] border border-black/10 dark:border-white/10 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)] p-6 animate-in zoom-in-95 duration-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-500" />
          </div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">{title}</h3>
        </div>
        
        <label className="block text-[10px] font-black text-slate-500 dark:text-white/40 uppercase tracking-[0.2em] mb-2">Select Reason</label>
        <select 
          value={reason} 
          onChange={(e) => setReason(e.target.value)}
          className="w-full p-3 mb-6 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500/50"
        >
          {VOID_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
        </select>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-slate-900 dark:text-white rounded-xl font-bold uppercase text-xs tracking-wider transition-all"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm(reason);
              onClose();
            }}
            className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold uppercase text-xs tracking-wider transition-all"
          >
            Void Order
          </button>
        </div>
      </div>
    </div>
  );
}
