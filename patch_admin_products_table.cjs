const fs = require('fs');
let code = fs.readFileSync('src/components/AdminProducts.tsx', 'utf8');

const oldCode = `                                <div className="text-[9px] text-coffee-600 font-bold uppercase tracking-widest mt-0.5">Icon: {category.iconName}</div>`;

const newCode = `                                <div className="text-[9px] text-coffee-600 font-bold uppercase tracking-widest mt-0.5">Icon: {category.iconName}</div>
                                {category.isActive !== false ? (
                                  <span className="inline-block mt-1 px-2 py-0.5 bg-green-500/20 text-green-600 dark:text-green-400 text-[9px] font-black uppercase tracking-widest rounded-full">Active</span>
                                ) : (
                                  <span className="inline-block mt-1 px-2 py-0.5 bg-red-500/20 text-red-600 dark:text-red-400 text-[9px] font-black uppercase tracking-widest rounded-full">Hidden</span>
                                )}`;

code = code.replace(oldCode, newCode);
fs.writeFileSync('src/components/AdminProducts.tsx', code);
