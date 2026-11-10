/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AppProvider, useAppContext } from './store';
import Layout from './components/Layout';

// Eagerly load Login for instant initial auth screen, lazy-load all other pages
import Login from './pages/Login';

const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Inventory = lazy(() => import('./pages/Inventory'));
const InventoryDetail = lazy(() => import('./pages/InventoryDetail'));
const RawMaterials = lazy(() => import('./pages/RawMaterials'));
const ShopDashboard = lazy(() => import('./pages/ShopDashboard'));
const DefineRole = lazy(() => import('./pages/DefineRole'));
const AddUser = lazy(() => import('./pages/AddUser'));
const StockTransfer = lazy(() => import('./pages/StockTransfer'));
const TransferHistory = lazy(() => import('./pages/TransferHistory'));
const AddInventory = lazy(() => import('./pages/AddInventory'));
const CitySales = lazy(() => import('./pages/CitySales'));
const Sales = lazy(() => import('./pages/Sales'));
const AddSale = lazy(() => import('./pages/AddSale'));
const Customers = lazy(() => import('./pages/Customers'));
const Labour = lazy(() => import('./pages/Labour'));
const AddCustomer = lazy(() => import('./pages/AddCustomer'));
const EditCustomer = lazy(() => import('./pages/EditCustomer'));
const AuditLogs = lazy(() => import('./pages/AuditLogs'));
const CustomerLedger = lazy(() => import('./pages/CustomerLedger'));
const CustomerDetail = lazy(() => import('./pages/CustomerDetail'));
const Factory = lazy(() => import('./pages/Factory'));
const AddFactoryBatch = lazy(() => import('./pages/AddFactoryBatch'));
const Accounts = lazy(() => import('./pages/Accounts'));
const AddAccountEntry = lazy(() => import('./pages/AddAccountEntry'));
const InvoiceView = lazy(() => import('./pages/InvoiceView'));
const Purchases = lazy(() => import('./pages/Purchases'));
const AddPurchase = lazy(() => import('./pages/AddPurchase'));
const EditPurchase = lazy(() => import('./pages/EditPurchase'));
const Suppliers = lazy(() => import('./pages/Suppliers'));
const AddSupplier = lazy(() => import('./pages/AddSupplier'));
const SupplierLedger = lazy(() => import('./pages/SupplierLedger'));
const Reports = lazy(() => import('./pages/Reports'));
const Settings = lazy(() => import('./pages/Settings'));

function PageLoader() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0284c7]" />
    </div>
  );
}

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
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
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
              <Route path="labour" element={<Labour />} />
              <Route path="accounts" element={<Accounts />} />
              <Route path="accounts/add" element={<AddAccountEntry />} />
              <Route path="factory" element={<Factory />} />
              <Route path="factory/add" element={<AddFactoryBatch />} />
              <Route path="reports" element={<Reports />} />
              <Route path="settings" element={<Settings />} />
            </Route>
          </Routes>
        </Suspense>
      </AppProvider>
    </Router>
  );
}

