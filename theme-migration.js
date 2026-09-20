import fs from 'fs';
import path from 'path';

const walkSync = (dir, filelist = []) => {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const dirFile = path.join(dir, file);
    const dirent = fs.statSync(dirFile);
    if (dirent.isDirectory()) {
      filelist = walkSync(dirFile, filelist);
    } else if (dirFile.endsWith('.tsx') || dirFile.endsWith('.ts')) {
      filelist.push(dirFile);
    }
  }
  return filelist;
};

const files = walkSync('./src');

const replacements = [
  { regex: /(?<!dark:)(?<!hover:)(?<!focus:)bg-\[\#020617\]/g, replacement: 'bg-slate-50 dark:bg-[#020617]' },
  { regex: /(?<!dark:)(?<!hover:)(?<!focus:)bg-\[\#020205\]/g, replacement: 'bg-white dark:bg-[#020205]' },
  { regex: /(?<!dark:)(?<!hover:)(?<!focus:)bg-\[\#111115\]/g, replacement: 'bg-white dark:bg-[#111115]' },
  { regex: /(?<!dark:)(?<!hover:)(?<!focus:)bg-slate-950\/40/g, replacement: 'bg-white/60 dark:bg-slate-950/40' },
  { regex: /(?<!dark:)(?<!hover:)(?<!focus:)bg-slate-950\/80/g, replacement: 'bg-white/80 dark:bg-slate-950/80' },
  { regex: /(?<!dark:)(?<!hover:)(?<!focus:)bg-slate-900\/50/g, replacement: 'bg-slate-100/50 dark:bg-slate-900/50' },
  { regex: /(?<!dark:)(?<!hover:)(?<!focus:)bg-slate-900\/80/g, replacement: 'bg-slate-100/80 dark:bg-slate-900/80' },
  { regex: /(?<!dark:)(?<!hover:)(?<!focus:)bg-slate-800\/50/g, replacement: 'bg-slate-200/50 dark:bg-slate-800/50' },
  { regex: /(?<!dark:)(?<!hover:)(?<!focus:)bg-slate-950/g, replacement: 'bg-white dark:bg-slate-950' },
  { regex: /(?<!dark:)(?<!hover:)(?<!focus:)bg-slate-900/g, replacement: 'bg-slate-100 dark:bg-slate-900' },
  { regex: /(?<!dark:)(?<!hover:)(?<!focus:)bg-slate-800/g, replacement: 'bg-slate-200 dark:bg-slate-800' },
  
  // White opacity backgrounds
  { regex: /(?<!dark:)(?<!hover:)(?<!focus:)bg-white\/5/g, replacement: 'bg-black/5 dark:bg-white/5' },
  { regex: /(?<!dark:)(?<!hover:)(?<!focus:)bg-white\/\[0\.02\]/g, replacement: 'bg-black/[0.02] dark:bg-white/[0.02]' },
  { regex: /(?<!dark:)(?<!hover:)(?<!focus:)bg-white\/10/g, replacement: 'bg-black/10 dark:bg-white/10' },
  { regex: /(?<!dark:)(?<!hover:)(?<!focus:)bg-white\/20/g, replacement: 'bg-black/20 dark:bg-white/20' },
  
  // Black opacity backgrounds
  { regex: /(?<!dark:)(?<!hover:)(?<!focus:)bg-black\/20/g, replacement: 'bg-slate-100 dark:bg-black/20' },
  { regex: /(?<!dark:)(?<!hover:)(?<!focus:)bg-black\/40/g, replacement: 'bg-slate-200 dark:bg-black/40' },
  { regex: /(?<!dark:)(?<!hover:)(?<!focus:)bg-black\/50/g, replacement: 'bg-slate-200 dark:bg-black/50' },
  { regex: /(?<!dark:)(?<!hover:)(?<!focus:)bg-black\/60/g, replacement: 'bg-slate-300 dark:bg-black/60' },
  
  // Borders
  { regex: /(?<!dark:)(?<!hover:)(?<!focus:)border-white\/5/g, replacement: 'border-black/10 dark:border-white/5' },
  { regex: /(?<!dark:)(?<!hover:)(?<!focus:)border-white\/10/g, replacement: 'border-black/10 dark:border-white/10' },
  { regex: /(?<!dark:)(?<!hover:)(?<!focus:)border-white\/20/g, replacement: 'border-black/20 dark:border-white/20' },
  
  // Text colors
  { regex: /(?<!dark:)(?<!hover:)(?<!focus:)text-white(?![\/\w])/g, replacement: 'text-slate-900 dark:text-white' },
  { regex: /(?<!dark:)(?<!hover:)(?<!focus:)text-white\/40/g, replacement: 'text-slate-500 dark:text-white/40' },
  { regex: /(?<!dark:)(?<!hover:)(?<!focus:)text-white\/50/g, replacement: 'text-slate-500 dark:text-white/50' },
  { regex: /(?<!dark:)(?<!hover:)(?<!focus:)text-white\/60/g, replacement: 'text-slate-600 dark:text-white/60' },
  { regex: /(?<!dark:)(?<!hover:)(?<!focus:)text-white\/70/g, replacement: 'text-slate-600 dark:text-white/70' },
  { regex: /(?<!dark:)(?<!hover:)(?<!focus:)text-white\/80/g, replacement: 'text-slate-700 dark:text-white/80' },
  
  { regex: /(?<!dark:)(?<!hover:)(?<!focus:)text-slate-300/g, replacement: 'text-slate-700 dark:text-slate-300' },
  { regex: /(?<!dark:)(?<!hover:)(?<!focus:)text-slate-400/g, replacement: 'text-slate-600 dark:text-slate-400' },
  { regex: /(?<!dark:)(?<!hover:)(?<!focus:)text-slate-200/g, replacement: 'text-slate-800 dark:text-slate-200' },
  
  // Hovers
  { regex: /(?<!dark:)hover:bg-white\/5/g, replacement: 'hover:bg-black/5 dark:hover:bg-white/5' },
  { regex: /(?<!dark:)hover:bg-white\/10/g, replacement: 'hover:bg-black/10 dark:hover:bg-white/10' },
  { regex: /(?<!dark:)hover:bg-white\/20/g, replacement: 'hover:bg-black/20 dark:hover:bg-white/20' },
  { regex: /(?<!dark:)hover:text-white(?![\/\w])/g, replacement: 'hover:text-slate-900 dark:hover:text-white' },
  { regex: /(?<!dark:)hover:border-white\/20/g, replacement: 'hover:border-black/20 dark:hover:border-white/20' },
  { regex: /(?<!dark:)hover:border-white\/30/g, replacement: 'hover:border-black/30 dark:hover:border-white/30' },
  { regex: /(?<!dark:)hover:text-slate-300/g, replacement: 'hover:text-slate-700 dark:hover:text-slate-300' },
  { regex: /(?<!dark:)hover:bg-slate-800/g, replacement: 'hover:bg-slate-200 dark:hover:bg-slate-800' },

  // Focus
  { regex: /(?<!dark:)focus:bg-white\/10/g, replacement: 'focus:bg-black/10 dark:focus:bg-white/10' },
  
  // Divide
  { regex: /(?<!dark:)divide-white\/5/g, replacement: 'divide-black/10 dark:divide-white/5' },
  { regex: /(?<!dark:)divide-white\/10/g, replacement: 'divide-black/10 dark:divide-white/10' },
];

let totalChanges = 0;

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;
  
  for (const { regex, replacement } of replacements) {
    if (regex.test(content)) {
      content = content.replace(regex, replacement);
      changed = true;
    }
  }
  
  if (changed) {
    fs.writeFileSync(file, content);
    console.log(`Updated ${file}`);
    totalChanges++;
  }
}

console.log(`Total files updated: ${totalChanges}`);
