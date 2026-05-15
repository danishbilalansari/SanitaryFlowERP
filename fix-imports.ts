import fs from 'fs';
import path from 'path';

const filesToFixStore = [
  'src/pages/Accounts.tsx',
  'src/pages/CustomerDetail.tsx',
  'src/pages/CustomerLedger.tsx',
  'src/pages/Customers.tsx',
  'src/pages/Dashboard.tsx',
  'src/pages/Inventory.tsx',
  'src/pages/InvoiceView.tsx',
];

const filesToFixFormat = [
  'src/pages/AddPurchase.tsx',
  'src/pages/AddSale.tsx',
  'src/pages/InventoryDetail.tsx',
]

for (const file of filesToFixStore) {
  let content = fs.readFileSync(file, 'utf8');
  if (!content.includes('import { useAppContext }')) {
    content = `import { useAppContext } from '../store';\n` + content;
    fs.writeFileSync(file, content);
    console.log('Fixed store in', file);
  }
}

for (const file of filesToFixFormat) {
  let content = fs.readFileSync(file, 'utf8');
  if (!content.includes('import { formatCurrency }')) {
    content = `import { formatCurrency } from '../lib/currency';\n` + content;
    fs.writeFileSync(file, content);
    console.log('Fixed formatCurrency in', file);
  }
}
