const fs = require('fs');
let code = fs.readFileSync('src/components/AdminProducts.tsx', 'utf8');

const oldCode = `                    </div>
                  </div>

                  <div className="flex justify-end gap-4 mt-2">
                    <button type="button" onClick={cancelCategoryEdit} className="px-8 py-3.5 text-slate-500 dark:text-white/50 hover:text-slate-900 dark:hover:text-white transition-all font-black uppercase tracking-widest text-xs">Cancel</button>`;

const newCode = `                    </div>
                  </div>

                  <div className="flex items-center gap-3 bg-black/5 dark:bg-white/5 p-4 rounded-2xl border border-black/10 dark:border-white/5">
                    <button 
                      type="button" 
                      onClick={() => setCategoryFormData({ ...categoryFormData, isActive: !categoryFormData.isActive })}
                      className={\`w-12 h-6 rounded-full transition-colors relative \${categoryFormData.isActive !== false ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-700'}\`}
                    >
                      <div className={\`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform \${categoryFormData.isActive !== false ? 'translate-x-6' : 'translate-x-1'}\`} />
                    </button>
                    <div>
                      <span className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest block">Available on Sale</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">Toggle whether this category appears in the ordering menus</span>
                    </div>
                  </div>

                  <div className="flex justify-end gap-4 mt-2">
                    <button type="button" onClick={cancelCategoryEdit} className="px-8 py-3.5 text-slate-500 dark:text-white/50 hover:text-slate-900 dark:hover:text-white transition-all font-black uppercase tracking-widest text-xs">Cancel</button>`;

code = code.replace(oldCode, newCode);
fs.writeFileSync('src/components/AdminProducts.tsx', code);
