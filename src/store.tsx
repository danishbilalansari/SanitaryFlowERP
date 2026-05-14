import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

export type InventoryItem = {
  id: string;
  code: string;
  name: string;
  category: string;
  factoryStock: number;
  shopStock: number;
  price: number;
};

export type SaleItem = {
  itemId: string;
  qty: number;
  price: number;
};

export type Sale = {
  id: string;
  customerId: string;
  date: string;
  type: string;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  total: number;
  status: string;
};

export type Customer = {
  id: string;
  name: string;
  type: string;
  contact: string;
  email: string;
  address: string;
  city: string;
  balance: number;
};

export type AccountEntry = {
  id: string;
  date: string;
  type: 'Credit' | 'Debit';
  amount: number;
  description: string;
  referenceId: string;
  balanceAfter: number;
};

export type Purchase = {
  id: string;
  date: string;
  vendorName: string;
  items: SaleItem[]; // Reuse SaleItem for simplicity if it fits (itemId, qty, price)
  total: number;
  status: 'Paid' | 'Unpaid';
};

export type FactoryBatch = {
  id: string;
  productId: string;
  targetQty: number;
  completionDate: string;
  supervisor: string;
  notes: string;
  status: string;
  output: number;
};

type AppContextType = {
  inventory: InventoryItem[];
  addInventory: (item: Omit<InventoryItem, 'id'>) => void;
  sales: Sale[];
  addSale: (sale: Omit<Sale, 'id'>) => void;
  updateSaleStatus: (saleId: string, status: string) => void;
  customers: Customer[];
  addCustomer: (customer: Omit<Customer, 'id'>) => void;
  accounts: AccountEntry[];
  addAccountEntry: (entry: Omit<AccountEntry, 'id' | 'balanceAfter'>) => void;
  factoryBatches: FactoryBatch[];
  addFactoryBatch: (batch: Omit<FactoryBatch, 'id'>) => void;
  purchases: Purchase[];
  addPurchase: (purchase: Omit<Purchase, 'id'>) => void;
  currency: string;
  setCurrency: (currency: string) => void;
  logoUrl: string | null;
  setLogoUrl: (logoUrl: string | null) => void;
  toast?: { message: string, type: 'success' | 'error' | 'info' | null };
  showToast?: (message: string, type: 'success' | 'error' | 'info') => void;
  currentUser: any | null; 
  authLoading: boolean;
  login: (credentials: any) => Promise<void>;
  logout: () => Promise<void>;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

const initialInventory: InventoryItem[] = [
  { id: '1', code: 'ITM-001', name: 'Ceramic Basin A1', category: 'Ceramics', factoryStock: 500, shopStock: 20, price: 4500 },
  { id: '2', code: 'ITM-002', name: 'Steel Faucet Q9', category: 'Faucets', factoryStock: 1200, shopStock: 150, price: 2500 },
  { id: '3', code: 'ITM-003', name: 'Toilet Bowl Pro', category: 'Ceramics', factoryStock: 0, shopStock: 5, price: 12000 },
  { id: '4', code: 'ITM-004', name: 'PVC Pipe 4"', category: 'Pipes', factoryStock: 8000, shopStock: 500, price: 600 },
  { id: '5', code: 'ITM-005', name: 'Shower Head X', category: 'Showers', factoryStock: 300, shopStock: 45, price: 1800 },
];

const initialCustomers: Customer[] = [
  { id: '1', name: 'Ali Traders', city: 'Lahore', contact: '+92 300 1234567', type: 'Wholesale', balance: 45000, email: '', address: '' },
  { id: '2', name: 'Uzair Sanitary', city: 'Karachi', contact: '+92 321 7654321', type: 'Retail', balance: -12000, email: '', address: '' },
  { id: '3', name: 'Bilal Construction', city: 'Islamabad', contact: '+92 333 9876543', type: 'Corporate', balance: 150000, email: '', address: '' },
];

const initialAccounts: AccountEntry[] = [
  { id: '1', date: '2026-05-01', description: 'Received Payment', referenceId: 'Ali Traders', type: 'Credit', amount: 45000, balanceAfter: 1545000 },
  { id: '2', date: '2026-05-02', description: 'Raw Material Purchase', referenceId: 'BuildCo Suppliers', type: 'Debit', amount: 150000, balanceAfter: 1395000 },
  { id: '3', date: '2026-05-03', description: 'Utility Bill', referenceId: 'K-Electric', type: 'Debit', amount: 35000, balanceAfter: 1360000 },
];

const initialBatches: FactoryBatch[] = [
  { id: 'BCH-8492', productId: '1', targetQty: 500, status: 'Molding', output: 120, completionDate: '', supervisor: '', notes: '' },
  { id: 'BCH-8493', productId: '4', targetQty: 5000, status: 'Extruding', output: 2500, completionDate: '', supervisor: '', notes: '' },
];

const initialSales: Sale[] = [
  { id: 'INV-2024-0892', customerId: '3', date: 'Oct 24, 2024', type: 'Wholesale', items: [{ itemId: '1', qty: 15, price: 145 }, { itemId: '2', qty: 15, price: 89.5 }, { itemId: '4', qty: 15, price: 12 }], subtotal: 3697.5, discount: 184.88, total: 3512.62, status: 'Completed' },
];

const initialPurchases: Purchase[] = [
  { id: 'PUR-1001', date: '2026-05-01', vendorName: 'Ceramic Clay Ltd', items: [{ itemId: '1', qty: 100, price: 1500 }], total: 150000, status: 'Paid' },
];

export function AppProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [inventory, setInventory] = useState<InventoryItem[]>(initialInventory);
  const [sales, setSales] = useState<Sale[]>(initialSales);
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [accounts, setAccounts] = useState<AccountEntry[]>(initialAccounts);
  const [factoryBatches, setFactoryBatches] = useState<FactoryBatch[]>(initialBatches);
  const [purchases, setPurchases] = useState<Purchase[]>(initialPurchases);
  const [currency, setCurrency] = useState<string>(() => localStorage.getItem('app_currency') || 'USD');
  const [logoUrl, setLogoUrl] = useState<string | null>(() => localStorage.getItem('app_logo'));
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' | 'info' | null }>({ message: '', type: null });
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    fetch('/api/me', { credentials: 'include' })
      .then(async res => {
        const contentType = res.headers.get('content-type');
        if (res.ok && contentType && contentType.includes('application/json')) {
          const data = await res.json();
          setCurrentUser(data);
        } else {
          setCurrentUser(null);
        }
      })
      .catch(err => {
        console.error('Failed to fetch user', err);
        setCurrentUser(null);
      })
      .finally(() => setAuthLoading(false));
  }, []);

  useEffect(() => {
    localStorage.setItem('app_currency', currency);
  }, [currency]);

  useEffect(() => {
    if (logoUrl) localStorage.setItem('app_logo', logoUrl);
    else localStorage.removeItem('app_logo');
  }, [logoUrl]);

  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: '', type: null }), 3000);
  };

  const login = async (credentials: any) => {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
      credentials: 'include'
    });
    
    const contentType = res.headers.get('content-type');
    if (res.ok && contentType && contentType.includes('application/json')) {
      const user = await res.json();
      setCurrentUser(user);
    } else {
      const text = await res.text();
      let errorMsg = 'Login failed';
      try {
        if (contentType && contentType.includes('application/json')) {
          const err = JSON.parse(text);
          errorMsg = err.error || errorMsg;
        } else if (res.status === 404) {
          errorMsg = 'Login endpoint not found (404)';
        } else {
          errorMsg = `Server error (${res.status})`;
          console.error('Non-JSON error response:', text.substring(0, 200));
        }
      } catch (e) {
        errorMsg = `Server error (${res.status})`;
      }
      throw new Error(errorMsg);
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/logout', { method: 'POST', credentials: 'include' });
    } catch (error) {
      console.error('Logout failed', error);
    }
    setCurrentUser(null);
    navigate('/login');
  };

  const addInventory = (item: Omit<InventoryItem, 'id'>) => {
    setInventory((prev) => [...prev, { ...item, id: Math.random().toString(36).substring(7) }]);
  };

  const addSale = (sale: Omit<Sale, 'id'>) => {
    setSales((prev) => [...prev, { ...sale, id: 'INV-' + Math.floor(1000 + Math.random() * 9000) }]);
  };

  const updateSaleStatus = (saleId: string, status: string) => {
    setSales(prev => prev.map(s => s.id === saleId ? { ...s, status } : s));
  };

  const addCustomer = (customer: Omit<Customer, 'id'>) => {
    setCustomers((prev) => [...prev, { ...customer, id: Math.random().toString(36).substring(7) }]);
  };

  const addAccountEntry = (entry: Omit<AccountEntry, 'id' | 'balanceAfter'>) => {
    setAccounts((prev) => {
      const lastBal = prev.length > 0 ? prev[prev.length - 1].balanceAfter : 0;
      const balanceAfter = entry.type === 'Credit' ? lastBal + entry.amount : lastBal - entry.amount;
      return [...prev, { ...entry, id: Math.random().toString(36).substring(7), balanceAfter }];
    });
  };

  const addFactoryBatch = (batch: Omit<FactoryBatch, 'id'>) => {
    setFactoryBatches((prev) => [...prev, { ...batch, id: 'BCH-' + Math.floor(1000 + Math.random() * 9000) }]);
  };

  const addPurchase = (purchase: Omit<Purchase, 'id'>) => {
    setPurchases(prev => [...prev, { ...purchase, id: 'PUR-' + Math.floor(1000 + Math.random() * 9000) }]);
  };

  return (
    <AppContext.Provider
      value={{
        inventory,
        addInventory,
        sales,
        addSale,
        updateSaleStatus,
        customers,
        addCustomer,
        accounts,
        addAccountEntry,
        factoryBatches,
        addFactoryBatch,
        purchases,
        addPurchase,
        currency,
        setCurrency,
        logoUrl,
        setLogoUrl,
        toast,
        showToast,
        currentUser,
        authLoading,
        login,
        logout,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
