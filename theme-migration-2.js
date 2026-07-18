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
  { regex: /(?<!dark:)(?<!hover:)(?<!focus:)bg-\[\#0D0F14\]\/95/g, replacement: 'bg-white/95 dark:bg-[#0D0F14]/95' },
  { regex: /(?<!dark:)(?<!hover:)(?<!focus:)bg-\[\#0D0F14\]\/90/g, replacement: 'bg-white/90 dark:bg-[#0D0F14]/90' },
  { regex: /(?<!dark:)(?<!hover:)(?<!focus:)bg-\[\#131722\]\/80/g, replacement: 'bg-slate-50/80 dark:bg-[#131722]/80' },
  { regex: /(?<!dark:)(?<!hover:)(?<!focus:)bg-\[\#131722\]\/50/g, replacement: 'bg-slate-50/50 dark:bg-[#131722]/50' },
  { regex: /(?<!dark:)(?<!hover:)(?<!focus:)bg-\[\#0b1329\]\/95/g, replacement: 'bg-white/95 dark:bg-[#0b1329]/95' },
  { regex: /(?<!dark:)(?<!hover:)(?<!focus:)bg-\[\#0b1329\]/g, replacement: 'bg-white dark:bg-[#0b1329]' },
  { regex: /(?<!dark:)(?<!hover:)(?<!focus:)bg-\[\#0a0a0c\]/g, replacement: 'bg-white dark:bg-[#0a0a0c]' },
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
