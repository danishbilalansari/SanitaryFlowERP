import React, { useState, useEffect } from 'react';
import { Download, ShoppingCart, Truck, Package, ChevronRight, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAppContext } from '../store';

export default function RawMaterials() {
  const { showToast } = useAppContext();
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/inventory')
      .then(async res => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const text = await res.text();
        return text ? JSON.parse(text) : [];
      })
      .then(data => {
        // Filter for items that likely are raw materials 
        // (You could use a specific category if programmed in the DB)
        const filtered = data.filter((item: any) => 
          (item.category || '').toLowerCase().includes('raw') || 
          ['powder', 'compound', 'fittings', 'kaolin', 'glaze'].some(token => item.name.toLowerCase().includes(token))
        );
        setInventory(filtered);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const lowStockCount = inventory.filter(item => item.stock < item.minStock).length;

  const handleExport = () => {
    if (!inventory || inventory.length === 0) {
      showToast?.('No raw materials data to export', 'error');
      return;
    }

    const headers = ['Material Name', 'Category', 'SKU', 'Current Stock', 'Min Threshold', 'Status'];
    const rows = inventory.map(item => [
      item.name,
      item.category,
      item.sku,
      item.stock,
      item.minStock,
      item.stock < item.minStock ? 'Critical' : 'Stable'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Raw_Materials_Report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast?.('Raw materials report exported successfully', 'success');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <nav className="flex items-center gap-2 text-[13px] font-medium text-neutral-400 mb-2">
            <Link to="/inventory" className="hover:text-[#006397] transition-colors">Inventory</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-[#006397] font-bold">Raw Materials</span>
          </nav>
          <h2 className="text-[32px] font-black text-[#001d31] tracking-tight leading-none">Raw Materials</h2>
          <p className="text-[16px] text-neutral-500 mt-1">Management of base components and production supplies.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleExport}
            className="px-5 py-2.5 border border-outline text-on-surface hover:bg-surface-container transition-colors rounded-lg flex items-center gap-2 font-medium text-[14px]"
          >
            <Download className="w-5 h-5" />
            Export
          </button>
          <Link to="/purchases/add" className="px-5 py-2.5 bg-[#006397] text-white hover:brightness-110 transition-all rounded-lg flex items-center gap-2 font-bold text-[14px] shadow-sm">
            <ShoppingCart className="w-5 h-5" />
            Order Materials
          </Link>
        </div>
      </div>

      {/* Simplified KPI Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border border-[#edeeef] p-6 rounded-xl shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-[#d1e4fb] rounded-lg">
              <Package className="w-5 h-5 text-[#162839]" />
            </div>
            <span className="text-[12px] text-blue-600 font-bold bg-blue-50 px-2.5 py-0.5 rounded-full uppercase tracking-wider">TRACKED ITEMS</span>
          </div>
          <div>
            <p className="text-[11px] font-bold text-neutral-500 uppercase tracking-widest mb-1">RAW MATERIAL SKUS</p>
            <h3 className="text-[32px] font-bold text-[#162839] tracking-tight">{inventory.length} <span className="text-[16px] font-normal text-neutral-500">Categories</span></h3>
          </div>
        </div>

        <div className="bg-white border border-red-100 p-6 rounded-xl shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-red-50 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-500" />
            </div>
            <span className="text-[12px] text-red-600 font-bold bg-red-50 px-2.5 py-0.5 rounded-full uppercase tracking-wider">CRITICAL ALERTS</span>
          </div>
          <div>
            <p className="text-[11px] font-bold text-red-500 uppercase tracking-widest mb-1">LOW STOCK MATERIALS</p>
            <h3 className="text-[32px] font-bold text-[#162839] tracking-tight">{lowStockCount} <span className="text-[16px] font-normal text-neutral-500">Items</span></h3>
          </div>
        </div>
      </div>

      {/* Main Table Section */}
      <div className="bg-white border border-[#edeeef] rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-[#edeeef] flex justify-between items-center bg-[#f3f4f5]/30">
          <h4 className="text-[20px] font-bold text-[#162839]">Material Inventory List</h4>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[#f3f4f5] text-[11px] font-bold text-neutral-500 uppercase tracking-widest border-b border-[#edeeef]">
                <th className="px-6 py-4">Material Info</th>
                <th className="px-6 py-4">SKU</th>
                <th className="px-6 py-4 text-right">Current Stock</th>
                <th className="px-6 py-4 text-right">Min Threshold</th>
                <th className="px-6 py-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="text-[14px] divide-y divide-[#edeeef]">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-neutral-400">Loading materials...</td>
                </tr>
              ) : inventory.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-neutral-400">No raw materials found in inventory.</td>
                </tr>
              ) : inventory.map((item) => (
                <tr key={item.id} className="hover:bg-[#f8f9fa] transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-bold text-[#162839] leading-tight">{item.name}</p>
                    <p className="text-[12px] text-neutral-500 mt-0.5">{item.category}</p>
                  </td>
                  <td className="px-6 py-4 text-neutral-500 font-mono text-[13px]">{item.sku}</td>
                  <td className="px-6 py-4 text-right font-bold text-[#162839]">{item.stock.toLocaleString()}</td>
                  <td className="px-6 py-4 text-right text-neutral-500">{item.minStock.toLocaleString()}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                      item.stock < item.minStock ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                    }`}>
                      {item.stock < item.minStock ? 'Critical' : 'Stable'}
                    </span>
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
