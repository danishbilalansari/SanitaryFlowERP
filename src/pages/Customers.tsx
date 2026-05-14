import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Edit2, 
  CreditCard,
  TrendingUp,
  Clock,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  History,
  Calendar,
  Map
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export default function Customers() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState('All Time');
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showDateMenu, setShowDateMenu] = useState(false);
  const [statusFilter, setStatusFilter] = useState('All');

  const [viewMode, setViewMode] = useState<'list' | 'city'>('list');
  const [cityData, setCityData] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/customers')
      .then(async res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const contentType = res.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          const text = await res.text();
          console.error('Non-JSON response from /api/customers:', text.substring(0, 500));
          throw new Error('Server returned non-JSON response');
        }
        return res.json();
      })
      .then(data => {
        setCustomers(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching customers:', err);
        setLoading(false);
      });

    fetch('/api/reports/customer-summary-city-wise')
      .then(async res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const contentType = res.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          const text = await res.text();
          console.error('Non-JSON response from /api/reports/customer-summary-city-wise:', text.substring(0, 500));
          throw new Error('Server returned non-JSON response');
        }
        return res.json();
      })
      .then(data => {
        setCityData(data);
      })
      .catch(err => console.error('Error fetching city data:', err));
  }, []);

  const stats = [
    { label: 'Total Customers', value: customers.length.toString(), trend: 'Active baseline', trendColor: 'text-[#006397]' },
    { label: 'Active Orders', value: '42', trend: '8 pending shipment', trendColor: 'text-[#006397]' },
    { label: 'Outstanding Total', value: '$142,500', trend: 'Across 18 customers', trendColor: 'text-neutral-500' },
    { label: 'Collection Rate', value: '94.2%', trend: '94.2%', progress: true },
  ];

  const filteredCustomers = customers.filter(c => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      c.name.toLowerCase().includes(searchLower) ||
      (c.company && c.company.toLowerCase().includes(searchLower)) ||
      (c.phone && c.phone.toLowerCase().includes(searchLower)) ||
      (c.email && c.email.toLowerCase().includes(searchLower)) ||
      (c.city && c.city.toLowerCase().includes(searchLower));

    // Date filter (based on created_at)
    let matchesDate = true;
    if (dateRange !== 'All Time') {
      const cDate = new Date(c.created_at);
      const now = new Date();
      if (dateRange === 'Today') {
        matchesDate = cDate.toDateString() === now.toDateString();
      } else if (dateRange === 'Last 30 Days') {
        const threshold = new Date();
        threshold.setDate(now.getDate() - 30);
        matchesDate = cDate >= threshold;
      }
    }

    return matchesSearch && matchesDate;
  });

  const handleExport = () => {
    if (!customers || customers.length === 0) {
      alert('No customer data to export.');
      return;
    }

    const headers = ['Name', 'Company', 'Email', 'Phone', 'City', 'Type', 'Credit Limit', 'Created At'];
    const rows = filteredCustomers.map(c => [
      c.name,
      c.company || 'N/A',
      c.email,
      c.phone,
      c.city,
      c.customer_type || 'Regular',
      c.credit_limit,
      c.created_at
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Customers_Report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Header & New Customer Action */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <nav className="flex items-center gap-2 text-[13px] font-medium text-neutral-400 mb-2">
            <Link to="/" className="hover:text-[#006397] transition-colors">Dashboard</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-[#006397] font-bold">Customers</span>
          </nav>
          <h2 className="text-[32px] font-black text-[#001d31] tracking-tight leading-none">Customer Registry</h2>
          <p className="text-[16px] text-neutral-500 mt-1">Manage your global client base and financial records.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 px-6 py-2.5 bg-white border border-[#edeeef] text-[#162839] font-bold rounded-lg hover:bg-neutral-50 transition-colors text-[14px] shadow-sm"
          >
            <Download className="w-4 h-4 text-neutral-400" />
            Export
          </button>
          <Link 
            to="/customers/add"
            className="flex items-center gap-2 px-6 py-2.5 bg-[#006397] text-white text-[14px] font-bold rounded-lg hover:opacity-90 transition-opacity shadow-sm"
          >
            <UserPlus className="w-4 h-4" />
            Add Customer
          </Link>
        </div>
      </div>

      {/* Bento Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white border border-[#edeeef] p-6 rounded-xl shadow-sm flex flex-col gap-1">
            <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-widest leading-none">{stat.label}</span>
            <span className={`text-[24px] font-bold ${stat.label === 'Outstanding Total' ? 'text-red-500' : 'text-[#162839]'}`}>{stat.value}</span>
            {stat.progress ? (
              <div className="w-full bg-[#edeeef] h-1.5 rounded-full mt-2">
                <div className="bg-[#006397] h-full rounded-full" style={{ width: stat.trend }} />
              </div>
            ) : (
              <span className={`text-[12px] font-medium flex items-center gap-1 mt-1 ${stat.trendColor}`}>
                {stat.label === 'Total Customers' && <TrendingUp className="w-3 h-3" />}
                {stat.label === 'Active Orders' && <Clock className="w-3 h-3" />}
                {stat.trend}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="bg-[#f3f4f5] border border-[#edeeef] p-4 rounded-xl flex flex-col md:flex-row gap-4 items-center mb-6">
        <div className="relative flex-1 group w-full">
          <Search className="w-5 h-5 text-neutral-400 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-[#006397] transition-colors" />
          <input 
            type="text"
            placeholder="Search customers..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-[#edeeef] rounded-lg text-[14px] focus:ring-2 focus:ring-[#5cb8fd]/20 focus:border-[#5cb8fd] outline-none transition-all"
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto relative">
          <button 
            onClick={() => setViewMode(viewMode === 'list' ? 'city' : 'list')}
            className="flex-1 md:flex-none justify-center items-center gap-2 px-4 py-3 bg-[#006397] text-white rounded-lg text-[13px] font-bold hover:bg-[#00527d] transition-colors whitespace-nowrap flex"
          >
            <Map className="w-4 h-4" />
            {viewMode === 'list' ? 'City-Wise View' : 'List View'}
          </button>
          
          <div className="relative flex-1 md:flex-none">
            <button 
              onClick={() => setShowStatusMenu(!showStatusMenu)}
              className="w-full justify-center items-center gap-2 px-4 py-3 bg-white border border-[#edeeef] rounded-lg text-[13px] font-bold text-neutral-600 hover:bg-neutral-50 transition-colors whitespace-nowrap flex"
            >
              <Filter className="w-4 h-4 text-neutral-400" />
              Status: {statusFilter}
            </button>
            {showStatusMenu && (
              <div className="absolute top-full right-0 mt-2 w-48 bg-white border border-[#edeeef] rounded-xl shadow-xl z-50 overflow-hidden">
                {['All', 'Active', 'Inactive'].map(s => (
                  <button
                    key={s}
                    onClick={() => {
                        setStatusFilter(s);
                        setShowStatusMenu(false);
                    }}
                    className={`w-full text-left px-4 py-3 text-[13px] font-bold transition-colors hover:bg-neutral-50 ${statusFilter === s ? 'text-[#006397] bg-blue-50/50' : 'text-neutral-600'}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="relative flex-1 md:flex-none">
            <button 
              onClick={() => setShowDateMenu(!showDateMenu)}
              className="w-full justify-center items-center gap-2 px-4 py-3 bg-white border border-[#edeeef] rounded-lg text-[13px] font-bold text-neutral-600 hover:bg-neutral-50 transition-colors whitespace-nowrap flex"
            >
              <Calendar className="w-4 h-4 text-neutral-400" />
              {dateRange}
            </button>
            {showDateMenu && (
              <div className="absolute top-full right-0 mt-2 w-48 bg-white border border-[#edeeef] rounded-xl shadow-xl z-50 overflow-hidden">
                {['Today', 'Last 30 Days', 'All Time'].map(range => (
                  <button
                    key={range}
                    onClick={() => {
                      setDateRange(range);
                      setShowDateMenu(false);
                    }}
                    className={`w-full text-left px-4 py-3 text-[13px] font-bold transition-colors hover:bg-neutral-50 ${dateRange === range ? 'text-[#006397] bg-blue-50/50' : 'text-neutral-600'}`}
                  >
                    {range}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {viewMode === 'city' ? (
        <div className="space-y-6">
          {Object.entries(
            cityData.reduce((acc, curr) => {
              const city = curr.city || 'Unknown City';
              if (!acc[city]) acc[city] = [];
              acc[city].push(curr);
              return acc;
            }, {} as Record<string, any[]>)
          ).map(([city, customersGroup]: [string, any]) => (
            <div key={city} className="bg-white border border-[#edeeef] rounded-xl shadow-sm overflow-hidden">
              <div className="bg-[#f8f9fa] border-b border-[#edeeef] px-8 py-4">
                <h3 className="text-[16px] font-black text-[#162839] flex items-center gap-2">
                  <Map className="w-4 h-4 text-[#006397]"/> 
                  {city}
                  <span className="text-[12px] font-bold text-neutral-400 bg-neutral-200 px-2 py-0.5 rounded-full ml-2">
                    {customersGroup.length}
                  </span>
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[11px] font-bold text-neutral-500 uppercase tracking-widest border-b border-[#edeeef]">
                      <th className="px-8 py-4">Customer Name</th>
                      <th className="px-8 py-4 text-right">Total Sales</th>
                      <th className="px-8 py-4 text-right">Payments / Purchases</th>
                      <th className="px-8 py-4 text-right">Balance Due</th>
                    </tr>
                  </thead>
                  <tbody className="text-[14px] divide-y divide-[#edeeef]">
                    {customersGroup.map((c) => {
                      const sales = Number(c.total_sales) || 0;
                      const payments = Number(c.total_purchases_payments) || 0;
                      const balance = sales - payments;
                      return (
                        <tr key={c.id} className="group hover:bg-[#f8f9fa] transition-colors">
                          <td className="px-8 py-4">
                            <Link to={`/customers/${c.id}`} className="block font-bold text-[#162839] hover:text-[#006397] leading-tight">
                              {c.name}
                            </Link>
                            {c.company && <p className="text-[11px] text-neutral-400 mt-1 font-medium">{c.company}</p>}
                          </td>
                          <td className="px-8 py-4 text-right font-medium text-[#162839]">Rs. {sales.toLocaleString()}</td>
                          <td className="px-8 py-4 text-right font-medium text-emerald-600">Rs. {payments.toLocaleString()}</td>
                          <td className={`px-8 py-4 text-right font-bold ${balance > 0 ? 'text-red-500' : 'text-neutral-500'}`}>
                            Rs. {Math.abs(balance).toLocaleString()} {balance > 0 && '(Dr)'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
          {cityData.length === 0 && (
             <div className="p-12 text-center text-neutral-500 bg-white border border-[#edeeef] rounded-xl">
               No city grouped customer data available.
             </div>
          )}
        </div>
      ) : (
        <div className="bg-white border border-[#edeeef] rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-[#f3f4f5] text-[11px] font-bold text-neutral-500 uppercase tracking-widest border-b border-[#edeeef]">
                  <th className="px-8 py-4">Customer Name</th>
                  <th className="px-8 py-4">City & Type</th>
                  <th className="px-8 py-4">Contact Info</th>
                  <th className="px-8 py-4 text-right">Credit Limit</th>
                  <th className="px-8 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="text-[14px] divide-y divide-[#edeeef]">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-neutral-400">Loading customers...</td>
                  </tr>
                ) : filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-neutral-400">No customers found.</td>
                  </tr>
                ) : filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="group hover:bg-[#f8f9fa] transition-colors">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded bg-[#d1e4fb] text-[#162839] flex items-center justify-center font-bold text-[12px]">
                          {customer.name.charAt(0)}
                        </div>
                        <div>
                          <Link to={`/customers/${customer.id}`} className="block font-bold text-[#162839] leading-tight hover:text-[#006397]">
                            {customer.name}
                          </Link>
                          <p className="text-[11px] text-neutral-400 mt-0.5 tracking-tight font-medium">{customer.company || 'No Company'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <p className="text-[#162839] font-bold leading-none">{customer.city || 'No City'}</p>
                      <span className="inline-block mt-1.5 px-2 py-0.5 bg-neutral-100 rounded text-[9px] font-bold text-neutral-500 uppercase tracking-widest">
                        {customer.business_type || 'Retailer'}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <p className="text-[#162839] font-medium leading-none">{customer.email || 'N/A'}</p>
                      <p className="text-[12px] text-neutral-400 mt-1 font-medium">{customer.phone || 'N/A'}</p>
                    </td>
                    <td className="px-8 py-5 text-right font-bold text-[#162839]">
                      ${(customer.credit_limit || 0).toLocaleString()}
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center justify-center gap-1">
                        <Link to={`/customers/${customer.id}`} className="p-2 text-neutral-400 hover:text-[#006397] hover:bg-neutral-50 rounded-full transition-all">
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link to={`/customers/edit/${customer.id}`} className="p-2 text-neutral-400 hover:text-[#006397] hover:bg-neutral-50 rounded-full transition-all">
                          <Edit2 className="w-4 h-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
