import fs from 'fs';
import path from 'path';

const filesToUpdate = [
  'src/pages/Dashboard.tsx',
  'src/pages/CustomerDetail.tsx',
  'src/pages/Customers.tsx',
  'src/pages/SupplierLedger.tsx',
  'src/pages/Suppliers.tsx',
  'src/pages/CustomerLedger.tsx',
  'src/pages/Reports.tsx',
  'src/pages/InvoiceView.tsx',
  'src/pages/Sales.tsx',
  'src/pages/Inventory.tsx',
  'src/pages/CitySales.tsx',
  'src/pages/RawMaterials.tsx',
  'src/pages/EditPurchase.tsx',
  'src/pages/Purchases.tsx',
  'src/pages/Accounts.tsx'
];

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // Add import if missing
  if (!content.includes('formatCurrency')) {
    // Find last import
    const lastImportIndex = content.lastIndexOf('import ');
    const endOfLastImport = content.indexOf('\n', lastImportIndex);
    
    // figure out depth
    const depthMatch = filePath.match(/\//g);
    const depth = depthMatch ? depthMatch.length : 0;
    const prefix = depth === 2 ? '../' : '../../'; // src/pages is depth 2 (src, pages) 
    
    let importStatement = `\nimport { formatCurrency } from '${prefix}lib/currency';`;
    if (filePath.includes('src/pages/') && !filePath.includes('src/pages/abc')) {
        importStatement = `\nimport { formatCurrency } from '../lib/currency';`;
    }

    content = content.slice(0, endOfLastImport + 1) + importStatement + content.slice(endOfLastImport + 1);
  }

  // Ensure useAppContext has currency destructured
  // Find const { ... } = useAppContext();
  const appContextMatch = content.match(/const\s+\{([^}]+)\}\s*=\s*useAppContext\(\);/);
  if (appContextMatch) {
    if (!appContextMatch[1].includes('currency')) {
      const newLine = `const { ${appContextMatch[1].trim()}, currency } = useAppContext();`;
      content = content.replace(appContextMatch[0], newLine);
    }
  } else {
    // Add it after the component declaration
    const compMatch = content.match(/export\s+default\s+function\s+\w+\([^)]*\)\s*\{/);
    if (compMatch) {
      content = content.replace(compMatch[0], `${compMatch[0]}\n  const { currency } = useAppContext();`);
    } else {
        const compMatch2 = content.match(/const\s+\w+\s*=\s*\([^)]*\)\s*=>\s*\{/);
        if (compMatch2) {
            content = content.replace(compMatch2[0], `${compMatch2[0]}\n  const { currency } = useAppContext();`);
        }
    }
    
    // Ensure useAppContext is imported
    if (!content.includes('useAppContext')) {
        content = `import { useAppContext } from '../store';\n` + content;
    }
  }

  // Now replace patterns
  // Pattern 1: `Rs {\w+.toLocaleString()}` -> `{formatCurrency(..., currency)}`
  // Pattern 2: `$${...}`
  
  // Rs {(expr).toLocaleString()}
  content = content.replace(/Rs\.?\s*\{\s*(.+?)\.toLocaleString\(\)\s*\}/g, '{formatCurrency($1, currency)}');
  content = content.replace(/Rs \{(.+?)\.toLocaleString\(\)\}/g, '{formatCurrency($1, currency)}');
  content = content.replace(/`(Rs\.? ?)\$\{(.+?)\.toLocaleString\(\)\}`/g, 'formatCurrency($2, currency)');
  content = content.replace(/`Rs\.?\s*\$\{(.+?)\.toLocaleString\(\)\}`/g, 'formatCurrency($1, currency)');
  content = content.replace(/>Rs\.?\s*([\d,]+.*?)</g, (match, p1) => `>{formatCurrency(${p1.replace(/,/g, '')}, currency)}<`);
  
  // $
  content = content.replace(/\$\{\s*(.+?)\.toLocaleString\(\)\s*\}/g, '{formatCurrency($1, currency)}');
  content = content.replace(/\$\{\s*(.+?)\.toLocaleString\(.*?\)\s*\}/g, '{formatCurrency($1, currency)}');
  content = content.replace(/`\$\{(.+?)\.toLocaleString\(\)\}`/g, 'formatCurrency($1, currency)');
  content = content.replace(/`\$\{(.+?)\.toLocaleString\(.*?\)\}`/g, 'formatCurrency($1, currency)');
  content = content.replace(/>\$([\d,]+.*?)</g, (match, p1) => `>{formatCurrency(${p1.replace(/,/g, '')}, currency)}<`);

  // literal strings with $ -> like `... $${stats.todayRevenue.toLocaleString()} ...`
  // replacing $ before ${}
  content = content.replace(/\$`\$\{/g, '`'); // remove $ before string interpolation if exist
  content = content.replace(/\$\$\{(.+?)\.toLocaleString\(.*?\)\}/g, '${formatCurrency($1, currency)}');
  
  // some places might have `$${...}` => `${formatCurrency(..., currency)}`
  content = content.replace(/\$\$\{(.+?)\.toLocaleString\(\)\}/g, '${formatCurrency($1, currency)}');
  
  // some literal `... Rs. ${...} ...`
  content = content.replace(/Rs\.?\s*\$\{(.+?)\.toLocaleString\(\)\}/g, '${formatCurrency($1, currency)}');

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Updated:', filePath);
  }
}

for (const file of filesToUpdate) {
  processFile(file);
}
