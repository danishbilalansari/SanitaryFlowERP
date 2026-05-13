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
  Calendar
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export default function Customers() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetch('/api/customers')
      .then(res => res.json())
      .then(data => {
        setCustomers(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching customers:', err);
        setLoading(false);
      });
  }, []);

  const stats = [
    { label: 'Total Customers', value: customers.length.toString(), trend: 'Active baseline', trendColor: 'text-[#006397]' },
    { label: 'Active Orders', value: '42', trend: '8 pending shipment', trendColor: 'text-[#006397]' },
    { label: 'Outstanding Total', value: '$142,500', trend: 'Across 18 customers', trendColor: 'text-neutral-500' },
    { label: 'Collection Rate', value: '94.2%', trend: '94.2%', progress: true },
  ];

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.company && c.company.toLowerCase().includes(searchQuery.toLowerCase()))
  );

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
            to="/customers/logs"
            className="flex items-center gap-2 px-6 py-2.5 bg-white border border-[#edeeef] text-[#162839] font-bold rounded-lg hover:bg-neutral-50 transition-colors text-[14px]"
          >
            <History className="w-4 h-4 text-neutral-400" />
            Audit Logs
          </Link>
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
        <div className="flex gap-2 w-full md:w-auto">
          <button className="flex-1 md:flex-none justify-center items-center gap-2 px-4 py-3 bg-white border border-[#edeeef] rounded-lg text-[13px] font-bold text-neutral-600 hover:bg-neutral-50 transition-colors whitespace-nowrap flex">
            <Filter className="w-4 h-4 text-neutral-400" />
            Status: All
          </button>
          <button className="flex-1 md:flex-none justify-center items-center gap-2 px-4 py-3 bg-white border border-[#edeeef] rounded-lg text-[13px] font-bold text-neutral-600 hover:bg-neutral-50 transition-colors whitespace-nowrap flex">
            <Calendar className="w-4 h-4 text-neutral-400" />
            May 2026
          </button>
        </div>
      </div>

      {/* Table Container */}
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
    </div>
  );
}
