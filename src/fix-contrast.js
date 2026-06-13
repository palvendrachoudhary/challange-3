const fs = require('fs');
const path = require('path');

const walkSync = (dir, filelist = []) => {
  fs.readdirSync(dir).forEach(file => {
    const dirFile = path.join(dir, file);
    if (fs.statSync(dirFile).isDirectory()) {
      if (!dirFile.includes('node_modules')) {
        filelist = walkSync(dirFile, filelist);
      }
    } else if (dirFile.endsWith('.tsx')) {
      filelist.push(dirFile);
    }
  });
  return filelist;
};

const files = walkSync('/src');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');

  content = content.replace(/text-gray-400/g, 'text-gray-500 dark:text-gray-400');
  content = content.replace(/text-emerald-500/g, 'text-emerald-700 dark:text-emerald-400');
  content = content.replace(/text-rose-500/g, 'text-rose-700 dark:text-rose-400');
  content = content.replace(/text-sky-500/g, 'text-sky-700 dark:text-sky-400');
  content = content.replace(/text-emerald-400/g, 'text-emerald-700 dark:text-emerald-300');
  
  fs.writeFileSync(file, content, 'utf8');
  console.log('Fixed contrast in', file);
});
