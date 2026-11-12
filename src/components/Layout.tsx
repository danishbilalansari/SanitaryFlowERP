import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import Toast from './Toast';
import ChangePasswordModal from './ChangePasswordModal';
import { useAppContext } from '../store';
import { cachedJsonFetch } from '../lib/apiCache';
import { 
  Home,
  Package, 
  ShoppingCart, 
  Users, 
  Factory, 
  Menu, 
  LogOut,
  ShoppingBag,
  FileBarChart,
  Settings,
  Plus,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  HardHat,
  KeyRound,
  Sparkles,
  BookOpen,
  PenLine
} from 'lucide-react';

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const { logoUrl, companyName, currentUser, logout, resolvedTheme } = useAppContext();
  const isDark = resolvedTheme === 'dark';
  const location = useLocation();

  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!currentUser) return;
    const warmEndpoints = [
      '/api/analytics/dashboard',
      '/api/production',
      '/api/factory/dashboard',
      '/api/sales',
      '/api/sales/stats',
      '/api/inventory',
      '/api/customers',
      '/api/reports/customer-summary-city-wise',
      '/api/purchases',
      '/api/suppliers/balances',
      '/api/suppliers',
      '/api/labour',
      '/api/shop/dashboard',
      '/api/inventory?category=Shop',
      '/api/inventory/transfers',
      '/api/users',
      '/api/roles',
      '/api/audit-logs?page=1&limit=10',
      '/api/backups'
    ];
    warmEndpoints.forEach(url => {
      cachedJsonFetch(url, { credentials: 'include' }, 60_000).catch(() => {});
    });
  }, [currentUser?.id]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed', error);
    }
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: Home, permissionKey: 'Sales' },
    { 
      name: 'Inventory', 
      path: '/inventory', 
      icon: Package,
      permissionKey: 'Inventory',
      subItems: [
        { name: 'All Inventory', path: '/inventory' },
        { name: 'Shop Inventory', path: '/inventory/shop' },
        { name: 'Transfer Tracking', path: '/inventory/transfer/history' },
      ]
    },
    { name: 'Production', path: '/factory', icon: Factory, permissionKey: 'Production' },
    { name: 'Sales', path: '/sales', icon: ShoppingBag, permissionKey: 'Sales' },
    { name: 'Customers', path: '/customers', icon: Users, permissionKey: 'Customers' },
    { name: 'Labour', path: '/labour', icon: HardHat, permissionKey: 'Labour' },
    { 
      name: 'Purchases', 
      path: '/purchases', 
      icon: ShoppingCart,
      permissionKey: 'Purchases',
      subItems: [
        { name: 'Purchase Orders', path: '/purchases' },
        { name: 'Suppliers', path: '/suppliers' },
        { name: 'Raw Materials', path: '/purchases/raw-materials' },
      ]
    },
    { name: 'Reports', path: '/reports', icon: FileBarChart, permissionKey: 'Reports' },
    { name: 'Settings', path: '/settings', icon: Settings, permissionKey: 'Settings' },
  ].filter(item => {
    if (!currentUser) return false;
    if (currentUser.role_id === 'admin') return true;
    return currentUser.permissions.includes(item.permissionKey);
  });

  useEffect(() => {
    navItems.forEach(item => {
      if (item.subItems && location.pathname.startsWith(item.path)) {
        setExpandedMenus(prev => ({ ...prev, [item.name]: true }));
      }
    });
  }, [location.pathname]);

  const userInitials = (currentUser?.name || 'User')
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className={`relative flex print:block h-screen print:h-auto ${isDark ? 'bg-[#2b2c30] text-slate-100' : 'bg-[#f6f8fc] text-slate-900'} print:bg-white font-sans tracking-normal overflow-hidden print:overflow-visible selection:bg-sky-500/20 selection:text-sky-400 transition-colors duration-300`}>
      {/* iOS 26 Liquid Glass Ambient Canvas & Floating Color Blobs */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden print:hidden">
        {/* Base canvas: Soft luminous pastel in Light Mode, Matte Charcoal (#2b2c30) in Dark Mode */}
        <div
          className={`absolute inset-0 transition-colors duration-500 ${
            isDark
              ? 'bg-[#2b2c30]'
              : 'bg-gradient-to-br from-[#eef6ff] via-[#f8f9fc] to-[#f3f5fb]'
          }`}
        />
        
        {/* Top-left sky/cyan blob */}
        <div
          className={`absolute -top-[14%] -left-[8%] w-[52vw] h-[52vw] rounded-full blur-[115px] animate-liquid-1 transition-opacity duration-500 ${
            isDark
              ? 'bg-gradient-to-br from-sky-500/06 via-cyan-500/04 to-transparent'
              : 'bg-gradient-to-br from-sky-300/45 via-cyan-200/35 to-transparent'
          }`}
        />
        
        {/* Right lavender/indigo blob */}
        <div
          className={`absolute top-[12%] -right-[10%] w-[48vw] h-[52vw] rounded-full blur-[125px] animate-liquid-2 transition-opacity duration-500 ${
            isDark
              ? 'bg-gradient-to-bl from-indigo-500/06 via-purple-500/04 to-transparent'
              : 'bg-gradient-to-bl from-fuchsia-200/45 via-pink-200/35 to-indigo-200/25'
          }`}
        />
        
        {/* Bottom-left mint/aqua blob */}
        <div
          className={`absolute -bottom-[16%] left-[12%] w-[46vw] h-[46vw] rounded-full blur-[120px] animate-liquid-3 transition-opacity duration-500 ${
            isDark
              ? 'bg-gradient-to-tr from-emerald-500/06 via-teal-500/04 to-transparent'
              : 'bg-gradient-to-tr from-emerald-200/40 via-teal-200/30 to-cyan-100/20'
          }`}
        />
      </div>

      {/* Desktop iOS 26 Liquid Glass Sidebar */}
      <aside className={`hidden md:flex w-[252px] flex-col z-20 print:hidden m-4 mr-0 rounded-[32px] transition-all ${
        isDark
          ? 'bg-[#141518] border border-white/[0.08] shadow-[0_18px_42px_-8px_rgba(0,0,0,0.45),inset_0_1px_1px_rgba(255,255,255,0.06)]'
          : 'bg-white/[0.68] backdrop-blur-3xl border-[1.5px] border-white/95 shadow-[0_12px_40px_-8px_rgba(15,23,42,0.06),0_4px_14px_rgba(15,23,42,0.03),inset_0_1px_2px_rgba(255,255,255,1)]'
      }`}>
        {/* Brand Header */}
        <div className="p-6 pb-5">
          <NavLink to="/dashboard" className="flex items-center gap-3.5 group">
            <div className="w-12 h-12 rounded-2xl bg-white/95 backdrop-blur-xl border border-white shadow-[0_4px_12px_rgba(15,23,42,0.06),inset_0_1px_1px_rgba(255,255,255,1)] flex items-center justify-center overflow-hidden p-1.5 group-hover:scale-105 transition-transform shrink-0">
              <img
                src={logoUrl || '/assets/aistudio/image_6670885d.png?v=2'}
                alt="SanitaryFlow Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex flex-col min-w-0">
              <h1 className="text-[17px] font-bold text-slate-900 tracking-tight truncate leading-tight">
                {companyName || 'SanitaryFlow'}
              </h1>
            </div>
          </NavLink>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3.5 space-y-1.5 overflow-y-auto py-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const hasSubItems = !!item.subItems;
            let active = false;
            
            if (!hasSubItems) {
              active = location.pathname === item.path || (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
            } else {
              active = location.pathname.startsWith(item.path);
            }

            const isExpanded = expandedMenus[item.name];

            const toggleExpand = (e: React.MouseEvent) => {
              if (hasSubItems) {
                e.preventDefault();
                setExpandedMenus(prev => ({ ...prev, [item.name]: !prev[item.name] }));
              }
            };

            return (
              <div key={item.path} className="flex flex-col">
                <NavLink
                  to={item.path}
                  onClick={toggleExpand}
                  className={`flex items-center justify-between px-4 py-3 text-[14px] transition-all duration-200 rounded-2xl group ${
                    active
                      ? 'bg-white/95 text-slate-900 font-semibold shadow-[0_4px_16px_-2px_rgba(15,23,42,0.06),inset_0_1px_1.5px_rgba(255,255,255,1)] border border-white'
                      : 'text-slate-700 font-medium hover:text-slate-900 hover:bg-white/55 border border-transparent'
                  }`}
                >
                  <div className="flex items-center min-w-0 gap-3.5">
                    <Icon
                      className={`w-[18px] h-[18px] flex-shrink-0 transition-colors ${
                        active ? 'text-[#0284c7] stroke-[2.1]' : 'text-slate-600 group-hover:text-slate-900 stroke-[1.85]'
                      }`}
                    />
                    <span className="truncate">{item.name}</span>
                  </div>
                  {hasSubItems && (
                    <div className="ml-auto text-slate-500 group-hover:text-slate-800 transition-colors">
                      {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </div>
                  )}
                </NavLink>
                
                {hasSubItems && isExpanded && (
                  <div className="flex flex-col mt-1 ml-6 pl-3.5 border-l border-slate-300/70 space-y-1 py-1">
                    {item.subItems.map((sub, idx) => {
                      const isExact = location.pathname === sub.path;
                      const isChild = location.pathname.startsWith(sub.path + '/');
                      const betterMatch = item.subItems.some(
                        s => s.path !== sub.path && location.pathname.startsWith(s.path) && s.path.length > sub.path.length
                      );
                      const isSubActive = (isExact || isChild) && !betterMatch;
                      
                      return (
                        <NavLink
                          key={idx}
                          to={sub.path}
                          className={`flex items-center px-3 py-2 text-[13px] transition-all duration-150 rounded-xl ${
                            isSubActive 
                              ? 'bg-white/90 text-[#0284c7] font-semibold shadow-xs border border-white' 
                              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50 font-medium'
                          }`}
                        >
                          {sub.name}
                        </NavLink>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Sidebar Footer: Caption & Frosted User Profile Pill */}
        <div className="p-4 pt-2 space-y-3">
          <div className="px-2">
            <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
              Enterprise operations &amp; inventory control
            </p>
          </div>

          <div className="relative">
            <button
              onClick={() => setProfileMenuOpen(prev => !prev)}
              className="w-full flex items-center gap-3 p-2.5 rounded-2xl bg-white/85 hover:bg-white/95 border border-white shadow-[0_4px_14px_rgba(15,23,42,0.05),inset_0_1px_1px_rgba(255,255,255,1)] transition-all text-left cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl bg-sky-50/90 border border-white flex items-center justify-center text-xs font-bold text-[#0284c7] shadow-2xs shrink-0">
                {userInitials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold text-slate-900 truncate leading-tight">
                  {currentUser?.name || 'Admin'}
                </p>
                <p className="text-[11px] text-slate-500 truncate mt-0.5 font-medium">
                  {currentUser?.role_name || 'View profile'}
                </p>
              </div>
            </button>

            {profileMenuOpen && (
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-white/95 backdrop-blur-2xl border border-white rounded-2xl shadow-[0_16px_36px_rgba(15,23,42,0.12),inset_0_1px_1px_rgba(255,255,255,1)] p-1.5 z-50">
                <div className="px-3 py-2 border-b border-slate-100">
                  <p className="text-xs font-bold text-slate-900 truncate">{currentUser?.name}</p>
                  <p className="text-[11px] text-slate-500 truncate">{currentUser?.email}</p>
                </div>
                <button
                  id="dropdown-change-password-btn"
                  onClick={() => {
                    setProfileMenuOpen(false);
                    setIsChangePasswordOpen(true);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 mt-1 text-xs font-semibold text-slate-700 hover:bg-slate-100/80 rounded-xl transition-colors"
                >
                  <KeyRound className="w-3.5 h-3.5 text-[#0284c7]" />
                  <span>Change Password</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50/80 rounded-xl transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Log out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex print:block flex-col min-w-0 overflow-hidden print:overflow-visible z-10">
        {/* Mobile Top Header Bar */}
        <header className="md:hidden sticky top-0 h-14 m-2.5 mb-0 px-4 rounded-2xl bg-white/80 backdrop-blur-2xl border-[1.5px] border-white/95 flex items-center justify-between z-20 print:hidden shadow-[0_6px_20px_rgba(15,23,42,0.05),inset_0_1px_1px_rgba(255,255,255,1)]">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-white/95 border border-white shadow-xs flex items-center justify-center overflow-hidden p-1 shrink-0">
              <img
                src={logoUrl || '/assets/aistudio/image_6670885d.png?v=2'}
                alt="SanitaryFlow Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <span className="font-bold text-[15px] text-slate-900 tracking-tight truncate">
              {companyName || 'SanitaryFlow'}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsChangePasswordOpen(true)}
              className="p-2 rounded-xl bg-white/90 border border-white text-slate-700 hover:text-slate-900 shadow-2xs"
              aria-label="Change password"
            >
              <KeyRound className="w-4 h-4" />
            </button>
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-xl bg-white/90 border border-white text-slate-800 hover:bg-white shadow-2xs"
              aria-label="Open menu"
            >
              <Menu className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Scrollable Viewport with Smooth iOS 26 Spring Screen Transitions */}
        <main className="flex-1 print:block overflow-y-auto print:overflow-visible px-3.5 py-5 sm:px-7 md:px-10 md:py-8 print:p-0 print:bg-white pb-28 md:pb-12">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10, scale: 0.992 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 340, damping: 30 }}
          >
            <Outlet />
          </motion.div>
        </main>
        
        <Toast />
        <ChangePasswordModal 
          isOpen={isChangePasswordOpen} 
          onClose={() => setIsChangePasswordOpen(false)} 
        />
      </div>

      {/* Mobile iOS 26 Liquid Glass Bottom Tab Bar */}
      <div className="md:hidden fixed bottom-3 inset-x-3 z-20 print:hidden">
        <nav className="glass-nav-light rounded-[26px] p-1.5 shadow-[0_14px_36px_rgba(15,23,42,0.12),inset_0_1px_1.5px_rgba(255,255,255,1)] flex items-center justify-around">
          {navItems.slice(0, 4).map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center justify-center py-2 px-3 rounded-2xl transition-all duration-200 ${
                  isActive 
                    ? 'bg-white/95 text-[#0284c7] shadow-[0_4px_12px_rgba(15,23,42,0.06)] border border-white' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#0284c7] stroke-[2.2]' : 'stroke-[1.85]'}`} />
                <span className={`text-[10.5px] mt-1 ${isActive ? 'font-bold text-slate-900' : 'font-semibold text-slate-700'}`}>
                  {item.name}
                </span>
              </NavLink>
            );
          })}
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex flex-col items-center justify-center py-2 px-3 rounded-2xl text-slate-600 hover:text-slate-900"
          >
            <Menu className="w-4 h-4 stroke-[1.85]" />
            <span className="text-[10.5px] font-semibold text-slate-700 mt-1">More</span>
          </button>
        </nav>
      </div>

      {/* Mobile Liquid Glass Drawer */}
      {sidebarOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-slate-900/20 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        >
          <aside 
            className="fixed inset-y-3 left-3 w-[280px] rounded-[32px] bg-white/85 backdrop-blur-3xl border border-white shadow-[0_20px_50px_rgba(15,23,42,0.15),inset_0_1px_2px_rgba(255,255,255,1)] flex flex-col transition-transform duration-300"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6 pb-4 flex justify-between items-center border-b border-slate-200/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white border border-white shadow-sm flex items-center justify-center overflow-hidden p-1 shrink-0">
                  <img
                    src={logoUrl || '/assets/aistudio/image_6670885d.png?v=2'}
                    alt="SanitaryFlow Logo"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <h1 className="text-[16px] font-semibold text-slate-900 tracking-tight leading-tight">
                    {companyName || 'SanitaryFlow'}
                  </h1>
                </div>
              </div>
              <button 
                className="p-1.5 text-slate-500 hover:text-slate-900 rounded-full bg-white/80 border border-white shadow-2xs"
                onClick={() => setSidebarOpen(false)}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
            
            <nav className="flex-1 px-3.5 space-y-1 overflow-y-auto py-3">
              {navItems.map((item) => {
                const Icon = item.icon;
                const hasSubItems = !!item.subItems;
                const isExpanded = expandedMenus[item.name];

                return (
                  <div key={item.path} className="flex flex-col">
                    <NavLink
                      to={item.path}
                      onClick={(e) => {
                        if (hasSubItems) {
                          e.preventDefault();
                          setExpandedMenus(prev => ({ ...prev, [item.name]: !prev[item.name] }));
                        } else {
                          setSidebarOpen(false);
                        }
                      }}
                      className={({ isActive }) =>
                        `flex items-center justify-between px-4 py-2.5 rounded-2xl text-[13.5px] transition-all ${
                          isActive && !hasSubItems
                            ? 'bg-white/95 text-slate-900 font-semibold shadow-xs border border-white' 
                            : 'text-slate-600 font-medium hover:text-slate-900 hover:bg-white/50'
                        }`
                      }
                    >
                      <div className="flex items-center min-w-0 gap-3">
                        <Icon className="w-4 h-4 flex-shrink-0 text-[#0284c7]" />
                        <span className="truncate">{item.name}</span>
                      </div>
                      {hasSubItems && (
                        <div>
                          {isExpanded ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                        </div>
                      )}
                    </NavLink>
                    
                    {hasSubItems && isExpanded && (
                      <div className="flex flex-col mt-1 ml-6 pl-3 border-l border-slate-200/70 space-y-1 py-1">
                        {item.subItems.map((sub, idx) => (
                          <NavLink
                            key={idx}
                            to={sub.path}
                            onClick={() => setSidebarOpen(false)}
                            className={({ isActive }) =>
                              `flex items-center px-3 py-1.5 text-[12.5px] rounded-xl ${
                                isActive 
                                  ? 'bg-white text-[#0284c7] font-semibold shadow-2xs' 
                                  : 'text-slate-500 hover:text-slate-900'
                              }`
                            }
                          >
                            {sub.name}
                          </NavLink>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>

            <div className="p-4 border-t border-slate-200/50 space-y-2">
              <div className="flex items-center gap-3 px-2 py-1">
                <div className="w-8 h-8 rounded-xl bg-slate-100 border border-white flex items-center justify-center text-xs font-bold text-slate-700">
                  {userInitials}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-slate-900 truncate">{currentUser?.name}</p>
                  <p className="text-[10px] text-slate-400 truncate">{currentUser?.email}</p>
                </div>
              </div>
              <button 
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-[13px] font-semibold text-rose-600 bg-rose-50/80 hover:bg-rose-100/80 border border-rose-200/60 rounded-full transition-all"
              >
                <LogOut className="w-4 h-4" />
                <span>Log out</span>
              </button>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
