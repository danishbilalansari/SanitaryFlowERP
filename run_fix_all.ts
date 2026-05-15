import fs from 'fs';
import path from 'path';

function getFiles(dir: string, files: string[] = []) {
  fs.readdirSync(dir).forEach(file => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      getFiles(filePath, files);
    } else if (filePath.endsWith('.tsx')) {
      files.push(filePath);
    }
  });
  return files;
}

const allFiles = getFiles('src/pages').concat(getFiles('src/components'));

function processFile(filePath: string) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // Manual fixing for the literal currencies
  content = content.replace(/>\$([\d.,]+.*?)</g, (match, p1) => `>{formatCurrency(${p1.replace(/,/g, '')}, currency)}<`);
  content = content.replace(/\$\{\((.+?)\)\.toFixed\(\d\)\}/g, (match, p1) => `{formatCurrency(${p1}, currency)}`);

  // specifically: >${(item.price ?? 0).toFixed(2)}<
  content = content.replace(/>\$\{\((.*?)\)\.toFixed\(\d\)\}</g, (match, p1) => `>{formatCurrency(${p1}, currency)}<`);
  
  content = content.replace(/>\$(.+?)<\//g, (match, p1) => {
    // If it's something like `$142,500` or `$${grandTotal.toFixed(2)}`
    if (p1.trim().startsWith('{')) {
        // Handled below or already
        return match;
    }
    // pure numbers
    if (/^[\d,]+(\.\d+)?$/.test(p1.trim())) {
      return `>{formatCurrency(${p1.trim().replace(/,/g, '')}, currency)}</`;
    }
    return match;
  });

  // >Unit Price ($)<
  content = content.replace(/\(\$\)/g, '({currency})');
  
  // <span className="text-neutral-400">$</span>
  content = content.replace(/>\$<\/span>/g, '>{currency}</span>');
  content = content.replace(/>\$ </g, '>{currency} <');

  if (content !== original) {
    if (!content.includes('formatCurrency')) {
        content = `import { formatCurrency } from '../lib/currency';\n` + content;
    }
    if (!content.includes('useAppContext')) {
        content = `import { useAppContext } from '../store';\n` + content;
    }
    const appContextMatch = content.match(/const\s+\{([^}]+)\}\s*=\s*useAppContext\(\);/);
    if (appContextMatch) {
      if (!appContextMatch[1].includes('currency')) {
        const newLine = `const { ${appContextMatch[1].trim()}, currency } = useAppContext();`;
        content = content.replace(appContextMatch[0], newLine);
      }
    } else {
      const compMatch = content.match(/export\s+default\s+function\s+\w+\([^)]*\)\s*\{/);
      if (compMatch) {
        content = content.replace(compMatch[0], `${compMatch[0]}\n  const { currency } = useAppContext();`);
      }
    }
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Updated:', filePath);
  }
}

for (const f of allFiles) {
  processFile(f);
}
