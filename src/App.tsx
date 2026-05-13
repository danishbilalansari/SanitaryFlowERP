/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AppProvider, useAppContext } from './store';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import InventoryDetail from './pages/InventoryDetail';
import RawMaterials from './pages/RawMaterials';
import ShopDashboard from './pages/ShopDashboard';
import Login from './pages/Login';

import DefineRole from './pages/DefineRole';
import AddUser from './pages/AddUser';
import StockTransfer from './pages/StockTransfer';
import TransferHistory from './pages/TransferHistory';
import AddInventory from './pages/AddInventory';
import CitySales from './pages/CitySales';
import Sales from './pages/Sales';
import AddSale from './pages/AddSale';
import Customers from './pages/Customers';
import AddCustomer from './pages/AddCustomer';
import EditCustomer from './pages/EditCustomer';
import AuditLogs from './pages/AuditLogs';
import CustomerLedger from './pages/CustomerLedger';
import CustomerDetail from './pages/CustomerDetail';
import Factory from './pages/Factory';
import AddFactoryBatch from './pages/AddFactoryBatch';
import Accounts from './pages/Accounts';
import AddAccountEntry from './pages/AddAccountEntry';
import InvoiceView from './pages/InvoiceView';
import Purchases from './pages/Purchases';
import AddPurchase from './pages/AddPurchase';
import EditPurchase from './pages/EditPurchase';
import Suppliers from './pages/Suppliers';
import AddSupplier from './pages/AddSupplier';
import SupplierLedger from './pages/SupplierLedger';
import Reports from './pages/Reports';
import Settings from './pages/Settings';

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { currentUser, authLoading } = useAppContext();
  const location = useLocation();

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#162839]"></div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <Router>
      <AppProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route 
            path="/" 
            element={
              <AuthGuard>
                <Layout />
              </AuthGuard>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="purchases/raw-materials" element={<RawMaterials />} />
            <Route path="inventory/shop" element={<ShopDashboard />} />
            <Route path="inventory/:id" element={<InventoryDetail />} />
            <Route path="inventory/edit/:id" element={<AddInventory />} />
            <Route path="settings/users/add" element={<AddUser />} />
            <Route path="settings/roles/add" element={<DefineRole />} />
            <Route path="inventory/transfer" element={<StockTransfer />} />
            <Route path="inventory/transfer/history" element={<TransferHistory />} />
            <Route path="inventory/add" element={<AddInventory />} />
            <Route path="purchases" element={<Purchases />} />
            <Route path="purchases/add" element={<AddPurchase />} />
            <Route path="purchases/:id" element={<EditPurchase />} />
            <Route path="suppliers" element={<Suppliers />} />
            <Route path="suppliers/add" element={<AddSupplier />} />
            <Route path="suppliers/ledger/:id" element={<SupplierLedger />} />
            <Route path="sales" element={<Sales />} />
            <Route path="sales/tracking/city" element={<CitySales />} />
            <Route path="sales/add" element={<AddSale />} />
            <Route path="sales/:id" element={<Sales />} />
            <Route path="invoice/:id" element={<InvoiceView />} />
            <Route path="customers" element={<Customers />} />
            <Route path="customers/add" element={<AddCustomer />} />
            <Route path="customers/edit/:id" element={<EditCustomer />} />
            <Route path="customers/logs" element={<AuditLogs />} />
            <Route path="customers/:id" element={<CustomerDetail />} />
            <Route path="customers/ledger/:id" element={<CustomerLedger />} />
            <Route path="accounts" element={<Accounts />} />
            <Route path="accounts/add" element={<AddAccountEntry />} />
            <Route path="factory" element={<Factory />} />
            <Route path="factory/add" element={<AddFactoryBatch />} />
            <Route path="reports" element={<Reports />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </AppProvider>
    </Router>
  );
}
