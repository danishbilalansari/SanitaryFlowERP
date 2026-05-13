import React, { ReactNode, useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import Toast from './Toast';
import { useAppContext } from '../store';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  Wallet, 
  Factory, 
  Menu, 
  Search,
  LogOut,
  User,
  ShoppingBag,
  FileBarChart,
  Settings,
  CircleUserRound,
  Plus,
  ChevronDown,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const MENU_ITEMS = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Inventory', path: '/inventory', icon: Package },
  { name: 'Purchases', path: '/purchases', icon: ShoppingBag },
  { name: 'Sales', path: '/sales', icon: ShoppingCart },
  { name: 'Customers', path: '/customers', icon: Users },
  { name: 'Accounts', path: '/accounts', icon: Wallet },
  { name: 'Production', path: '/factory', icon: Factory },
  { name: 'Reports', path: '/reports', icon: FileBarChart },
  { name: 'Settings', path: '/settings', icon: Settings },
];

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { logoUrl } = useAppContext();
  const location = useLocation();
  const navigate = useNavigate();

  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({});
  const { currentUser, logout } = useAppContext();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed', error);
    }
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { 
      name: 'Inventory', 
      path: '/inventory', 
      icon: Package,
      subItems: [
        { name: 'All Inventory', path: '/inventory' },
        { name: 'Shop Inventory', path: '/inventory/shop' },
        { name: 'Transfer Tracking', path: '/inventory/transfer/history' },
      ]
    },
    { name: 'Production', path: '/factory', icon: Factory },
    { name: 'Sales', path: '/sales', icon: ShoppingBag },
    { name: 'Customers', path: '/customers', icon: Users },
    { 
      name: 'Purchases', 
      path: '/purchases', 
      icon: ShoppingCart,
      subItems: [
        { name: 'Purchase Orders', path: '/purchases' },
        { name: 'Suppliers', path: '/suppliers' },
        { name: 'Raw Materials', path: '/purchases/raw-materials' },
      ]
    },
    { name: 'Reports', path: '/reports', icon: FileBarChart },
    { name: 'Settings', path: '/settings', icon: Settings },
  ].filter(item => {
    if (!currentUser) return false;
    if (currentUser.role_id === 'admin') return true;
    const permissionMap: Record<string, string> = {
      'Dashboard': 'Sales',
      'Inventory': 'Inventory',
      'Production': 'Production',
      'Sales': 'Sales',
      'Customers': 'Customers',
      'Purchases': 'Purchases',
      'Reports': 'Reports',
      'Settings': 'Settings',
    };
    return currentUser.permissions.includes(permissionMap[item.name]);
  });

  useEffect(() => {
    // Auto-expand menu if subItem is active
    navItems.forEach(item => {
      if (item.subItems && location.pathname.startsWith(item.path)) {
        setExpandedMenus(prev => ({ ...prev, [item.name]: true }));
      }
    });
  }, [location.pathname]);

  return (
    <div className="flex h-screen bg-[#f8f9fa] text-[#191c1d] font-sans tracking-normal overflow-hidden">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex w-[260px] flex-col bg-[#162839] z-40 print:hidden shadow-lg transition-all border-r border-[#2c3e50]">
        <div className="p-8 mb-4">
          <div className="flex flex-col gap-1 items-start">
            <h1 className="text-[24px] font-bold text-white tracking-tight">SanitaryFlow</h1>
          </div>
          <p className="text-[8px] text-[#5cb8fd] font-medium opacity-80 uppercase tracking-wider">FACTORY & SHOP MANAGEMENT</p>
        </div>
        
        <nav className="flex-1 px-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            // Active logic: for items without subItems, match path precisely. 
            // For items with subItems, we'll let subItems handle their own active state visually.
            const hasSubItems = !!item.subItems;
            let active = false;
            
            if (!hasSubItems) {
              active = location.pathname === item.path || (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
            } else {
              active = location.pathname.startsWith(item.path) && !item.subItems?.find(sub => sub.path === location.pathname);
            }

            const isExpanded = expandedMenus[item.name];

            const toggleExpand = (e: React.MouseEvent) => {
              if (hasSubItems) {
                e.preventDefault();
                setExpandedMenus(prev => ({...prev, [item.name]: !prev[item.name]}));
              }
            };

            return (
              <div key={item.path} className="flex flex-col">
                <NavLink
                  to={item.path}
                  onClick={toggleExpand}
                  className={`flex items-center justify-between px-4 py-3 text-[14px] font-bold transition-all duration-200 rounded-lg group ${
                    (active && !hasSubItems) || (hasSubItems && isExpanded)
                      ? 'bg-[#2c3e50] text-[#5cb8fd] border-l-4 border-[#5cb8fd] pl-5' 
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center">
                    <Icon className={`w-5 h-5 mr-3 flex-shrink-0 transition-colors ${((active && !hasSubItems) || (hasSubItems && isExpanded)) ? 'text-[#5cb8fd]' : 'text-white/30 group-hover:text-white/60'}`} />
                    {item.name}
                  </div>
                  {hasSubItems && (
                    <div className="ml-ml-auto">
                      {isExpanded ? <ChevronDown className="w-4 h-4 opacity-50" /> : <ChevronRight className="w-4 h-4 opacity-50" />}
                    </div>
                  )}
                </NavLink>
                
                {hasSubItems && isExpanded && (
                  <div className="flex flex-col mt-1 space-y-1">
                    {item.subItems.map((sub, idx) => {
                      const isExact = location.pathname === sub.path;
                      const isChild = location.pathname.startsWith(sub.path + '/');
                      const betterMatch = item.subItems.some(s => s.path !== sub.path && location.pathname.startsWith(s.path) && s.path.length > sub.path.length);
                      const isSubActive = (isExact || isChild) && !betterMatch;
                      
                      return (
                        <NavLink
                          key={idx}
                          to={sub.path}
                          className={`flex items-center pl-12 pr-4 py-2.5 text-[13px] font-medium transition-all duration-200 rounded-lg ${
                            isSubActive 
                              ? 'bg-[#2c3e50]/50 text-[#5cb8fd]' 
                              : 'text-white/50 hover:text-white hover:bg-white/5'
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

        <div className="p-6">
          <NavLink 
            to={location.pathname.startsWith('/purchases') ? "/purchases/add" : "/sales/add"} 
            className="w-full bg-[#006397] text-white py-4 px-4 font-bold rounded-xl flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all text-[14px] shadow-lg shadow-black/20"
          >
            <Plus className="w-5 h-5" />
            New Order
          </NavLink>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="bg-white sticky top-0 h-16 border-b border-[#edeeef] flex items-center justify-between px-8 z-30 print:hidden shadow-sm">
          <div className="flex items-center flex-1">
            <button 
              className="md:hidden p-2 -ml-2 text-neutral-500 hover:text-neutral-700"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex items-center gap-6 ml-4">

            
            <div className="flex items-center gap-3 pl-2">
              <div className="text-right hidden md:block">
                <p className="text-[14px] font-bold text-[#162839] leading-tight">{currentUser?.name || 'Guest'}</p>
                <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest">{currentUser?.role_name || currentUser?.role_id || 'User'}</p>
              </div>
              <div className="relative group">
                <img 
                  src={currentUser?.avatar_url || "https://lh3.googleusercontent.com/aida-public/AB6AXuAS5Yx_knVKbwiE0_9u6IayJWVsOJMueTTrLHrOhoISHxXcUDKO9Lget5WJIMUsSJqdpEoHoImUAomVa-PjcV8Uc666vsz_6YuWW1XY-LEOyLvxem2aUQLMdLKDy7oV35Sc3NL4RzJW9uev0ZbkknOWi7bfimuuX5k-F5lrU7vtMdZmHYK2IOWcSaNkzDFjH-f8s_VbmQ__IlDGKXbBb37lkcbYCu9pwa-uZZZ8OsB03KtUpOKO1j1KELa4e0losZZxKTEa1UDL53OY"} 
                  alt="Profile" 
                  className="w-10 h-10 rounded-full object-cover border border-[#edeeef] shadow-sm hover:ring-2 hover:ring-[#5cb8fd] transition-all cursor-pointer"
                />
                <div className="absolute right-0 mt-2 w-48 bg-white border border-[#edeeef] rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="p-4 border-b border-[#edeeef]">
                    <p className="text-sm font-bold text-[#162839] truncate">{currentUser?.name}</p>
                    <p className="text-xs text-neutral-400 truncate">{currentUser?.email}</p>
                  </div>
                  <div className="p-2">
                    <button 
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-4 sm:p-8 print:p-0 print:bg-white bg-[#f8f9fa]">
          <Outlet />
        </main>
        <Toast />
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-[#162839]/80 backdrop-blur-sm" onClick={() => setSidebarOpen(false)}>
          <aside 
            className="fixed inset-y-0 left-0 w-[280px] bg-[#162839] shadow-2xl flex flex-col transition-transform duration-300 transform translate-x-0"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-8 mb-4 flex justify-between items-start">
              <div>
                <h1 className="text-[20px] font-bold text-white tracking-tight">SanitaryFlow</h1>
                <p className="text-[8px] text-[#5cb8fd] font-medium opacity-80 uppercase tracking-wider">MANAGEMENT SYSTEM</p>
              </div>
              <button 
                className="p-2 text-white/50 hover:text-white"
                onClick={() => setSidebarOpen(false)}
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            </div>
            
            <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
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
                          setExpandedMenus(prev => ({...prev, [item.name]: !prev[item.name]}));
                        } else {
                          setSidebarOpen(false);
                        }
                      }}
                      className={({ isActive }) =>
                        `flex items-center justify-between px-4 py-3 rounded-lg text-[14px] font-bold transition-all ${
                          isActive && !hasSubItems
                            ? 'bg-[#2c3e50] text-[#5cb8fd] border-l-4 border-[#5cb8fd] pl-5' 
                            : 'text-white/60 hover:text-white hover:bg-white/5'
                        }`
                      }
                    >
                      <div className="flex items-center">
                        <Icon className={`w-5 h-5 mr-3 ${isExpanded ? 'text-[#5cb8fd]' : ''}`} />
                        {item.name}
                      </div>
                      {hasSubItems && (
                        <div>
                          {isExpanded ? <ChevronDown className="w-4 h-4 opacity-50" /> : <ChevronRight className="w-4 h-4 opacity-50" />}
                        </div>
                      )}
                    </NavLink>
                    
                    {hasSubItems && isExpanded && (
                      <div className="flex flex-col mt-1 space-y-1">
                        {item.subItems.map((sub, idx) => {
                          const isExact = location.pathname === sub.path;
                          const isChild = location.pathname.startsWith(sub.path + '/');
                          const betterMatch = item.subItems.some(s => s.path !== sub.path && location.pathname.startsWith(s.path) && s.path.length > sub.path.length);
                          const isSubActive = (isExact || isChild) && !betterMatch;
                          
                          return (
                            <NavLink
                              key={idx}
                              to={sub.path}
                              onClick={() => setSidebarOpen(false)}
                              className={`flex items-center pl-12 pr-4 py-2 text-[13px] font-medium rounded-lg ${
                                isSubActive 
                                  ? 'bg-[#2c3e50]/50 text-[#5cb8fd]' 
                                  : 'text-white/50 hover:text-white hover:bg-white/5'
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

            <div className="p-6">
              <button 
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 text-[14px] font-bold text-red-400 bg-red-400/10 hover:bg-red-400/20 rounded-xl transition-all"
              >
                <LogOut className="w-4 h-4" />
                Logout Session
              </button>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
