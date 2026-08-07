import React from 'react';
import { User, Copy, Tag, Sparkles } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Voucher, Order } from '../types';

interface ProfilePageProps {
  user: any;
  vouchers: Voucher[];
  orders: Order[];
}

export function ProfilePage({ user, vouchers, orders }: ProfilePageProps) {
  const points = orders.reduce((sum, order) => sum + (order.pointsEarned || 0) - (order.pointsSpent || 0), 0);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (!user) return <div className="p-8">Please log in to view your profile.</div>;

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-8 overflow-y-auto">
      <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">My <span className="text-amber-500">Profile</span></h2>
      
      <div className="bg-white dark:bg-[#0a0a0c] p-6 rounded-3xl border border-black/10 dark:border-white/5 shadow-xl">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-2xl flex items-center justify-center">
            <User className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold">{user.displayName || 'Customer'}</h3>
            <p className="text-sm text-slate-500">{user.email}</p>
            <div className="text-sm font-black text-amber-500">{points} Points</div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-black/5 dark:bg-white/5 rounded-xl border border-black/10 dark:border-white/10">
            <span className="text-xs font-bold uppercase tracking-widest">User ID</span>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono">{user.uid}</span>
              <button onClick={() => copyToClipboard(user.uid)} className="p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded-lg">
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <div className="flex justify-center p-4">
            <QRCodeSVG value={user.uid} size={150} />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-black uppercase italic tracking-tighter">Purchase <span className="text-amber-500">History</span></h3>
        {orders.length === 0 ? (
          <p className="text-sm opacity-50">No purchase history.</p>
        ) : (
          <div className="space-y-4">
            {orders.map(order => (
              <div key={order.id} className="p-4 bg-white dark:bg-[#0a0a0c] rounded-2xl border border-black/10 dark:border-white/5 shadow-sm flex items-center justify-between">
                <div>
                  <div className="font-bold">Order #{order.id?.slice(-4)}</div>
                  <div className="text-sm text-slate-500">{new Date(order.createdAt).toLocaleDateString()}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold">₱{order.total.toLocaleString()}</div>
                  <div className="text-xs font-black uppercase tracking-widest text-amber-500">{order.status}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-black uppercase italic tracking-tighter">Available <span className="text-amber-500">Vouchers</span></h3>
        {vouchers.filter(v => v.isActive).length === 0 ? (
          <p className="text-sm opacity-50">No active vouchers available.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {vouchers.filter(v => v.isActive).map(voucher => (
              <div key={voucher.id} className="p-4 bg-white dark:bg-[#0a0a0c] rounded-2xl border border-black/10 dark:border-white/5 shadow-sm flex items-center gap-4">
                <Tag className="w-8 h-8 text-amber-500" />
                <div>
                  <div className="font-bold">{voucher.code}</div>
                  <div className="text-sm text-slate-500">
                    {voucher.type === 'percentage' ? `${voucher.value}% off` : `$${voucher.value} off`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
