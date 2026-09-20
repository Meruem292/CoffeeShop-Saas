const fs = require('fs');
let code = fs.readFileSync('src/components/CashierView.tsx', 'utf8');

const modalCode = `
      {payingOrder && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { setPayingOrder(null); setAmountTendered(''); }} />
          <div className="relative bg-white dark:bg-slate-900 rounded-[2rem] p-8 max-w-md w-full shadow-2xl border border-black/10 dark:border-white/10 animate-in zoom-in-95 duration-200">
            <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-6 flex items-center gap-3">
              <Banknote className="w-6 h-6 text-amber-500" />
              Collect Payment
            </h3>
            
            <div className="space-y-6">
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">Total Amount</span>
                <span className="text-2xl font-black text-slate-900 dark:text-white">₱{payingOrder.total.toLocaleString()}</span>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-2">Amount Tendered</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400">₱</span>
                  <input
                    type="number"
                    min={payingOrder.total}
                    value={amountTendered}
                    onChange={(e) => setAmountTendered(e.target.value)}
                    className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl py-4 pl-10 pr-4 text-xl font-black text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="0.00"
                    autoFocus
                  />
                </div>
              </div>

              {Number(amountTendered) >= payingOrder.total && (
                <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-4 flex items-center justify-between">
                  <span className="text-xs font-bold text-green-700 dark:text-green-400 uppercase tracking-widest">Change Due</span>
                  <span className="text-2xl font-black text-green-700 dark:text-green-400">
                    ₱{(Number(amountTendered) - payingOrder.total).toLocaleString()}
                  </span>
                </div>
              )}

              <div className="flex gap-4 pt-4 border-t border-black/10 dark:border-white/10">
                <button
                  onClick={() => { setPayingOrder(null); setAmountTendered(''); }}
                  className="flex-1 py-4 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-slate-900 dark:text-white rounded-xl font-bold uppercase tracking-widest text-xs transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmPayment}
                  disabled={Number(amountTendered) < payingOrder.total}
                  className="flex-1 py-4 bg-amber-500 hover:bg-amber-400 text-black rounded-xl font-black uppercase tracking-widest text-xs transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                >
                  Confirm & Print
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
`;

code = code.replace(
`    </div>
  );
}`, modalCode);

fs.writeFileSync('src/components/CashierView.tsx', code);
