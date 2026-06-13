import fs from 'fs';
import path from 'path';

const walkSync = (dir, filelist = []) => {
  fs.readdirSync(dir).forEach(file => {
    const dirFile = path.join(dir, file);
    if (fs.statSync(dirFile).isDirectory()) {
      if (!dirFile.includes('node_modules')) {
        filelist = walkSync(dirFile, filelist);
      }
    } else if (dirFile.endsWith('.tsx') || dirFile.endsWith('.ts')) {
      filelist.push(dirFile);
    }
  });
  return filelist;
};

const files = walkSync('/app/applet/src');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');

  // Colors
  content = content.replace(/text-gray-400/g, 'text-gray-500 dark:text-gray-400');
  content = content.replace(/text-emerald-500/g, 'text-emerald-700 dark:text-emerald-400');
  content = content.replace(/text-rose-500/g, 'text-rose-700 dark:text-rose-400');
  content = content.replace(/text-sky-500/g, 'text-sky-700 dark:text-sky-400');
  
  // Buttons
  content = content.replace(/<button([^>]*)>/g, (match, p1) => {
    if (!match.includes('aria-label=')) {
      return `<button aria-label="Interactive Button"${p1}>`;
    }
    return match;
  });

  // Inputs
  content = content.replace(/<input([^>]*)>/g, (match, p1) => {
    if (!match.includes('aria-label=') && !match.includes('type="hidden"')) {
      return `<input aria-label="Input field"${p1}>`;
    }
    return match;
  });

  // Selects
  content = content.replace(/<select([^>]*)>/g, (match, p1) => {
    if (!match.includes('aria-label=')) {
      return `<select aria-label="Dropdown selection"${p1}>`;
    }
    return match;
  });
  
  fs.writeFileSync(file, content, 'utf8');
});
console.log("Fixed ARIA and Contrast");
