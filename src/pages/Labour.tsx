import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAppContext } from '../store';

interface Labour {
  id: number;
  name: string;
  cnic: string;
  address: string;
  mobile_no: string;
  designation: string;
  salary: number;
}

export default function LabourPage() {
  const [labour, setLabour] = useState<Labour[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ id: 0, name: '', cnic: '', address: '', mobile_no: '', designation: '', salary: 0 });
  const { showToast } = useAppContext();

  const formatCNIC = (value: string) => {
    const v = value.replace(/\D/g, '');
    const match = v.match(/^(\d{0,5})(\d{0,7})(\d{0,1})$/);
    if (!match) return v;
    return !match[2] ? match[1] : `${match[1]}-${match[2]}${match[3] ? `-${match[3]}` : ''}`;
  };

  const formatMobile = (value: string) => {
    const v = value.replace(/\D/g, '');
    const match = v.match(/^(\d{0,4})(\d{0,7})$/);
    if (!match) return v;
    return !match[2] ? match[1] : `${match[1]}-${match[2]}`;
  };

  const fetchLabour = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/labour');
      if (res.ok) {
        const data = await res.json();
        setLabour(data);
      }
    } catch (err) {
      console.error(err);
      showToast?.('Failed to fetch labour info', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLabour();
  }, []);

  const handleOpenModal = (lab: Labour | null = null) => {
    if (lab) {
      setFormData({ ...lab });
    } else {
      setFormData({ id: 0, name: '', cnic: '', address: '', mobile_no: '', designation: '', salary: 0 });
    }
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const isEdit = formData.id !== 0;
      const url = isEdit ? `/api/labour/${formData.id}` : '/api/labour';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!res.ok) throw new Error('Failed to save labour');
      
      showToast?.(`Labour ${isEdit ? 'updated' : 'added'} successfully`, 'success');
      setShowModal(false);
      fetchLabour();
    } catch (err) {
      console.error(err);
      showToast?.('Failed to save labour info', 'error');
    }
  };

  const handleDelete = (id: number) => {
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/labour/${deleteId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      showToast?.('Labour record deleted', 'success');
      fetchLabour();
    } catch (err) {
      console.error(err);
      showToast?.('Failed to delete labour', 'error');
    } finally {
      setDeleteId(null);
    }
  };

  const filteredLabour = labour.filter(l => 
    l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.cnic.includes(searchQuery) ||
    l.designation.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Breadcrumbs & Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <nav className="flex items-center gap-2 text-[13px] font-medium text-neutral-400 mb-2">
            <Link to="/" className="hover:text-[#006397] transition-colors">Dashboard</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-[#006397] font-bold">Labour</span>
          </nav>
          <h1 className="text-3xl font-bold text-[#162839]">Labour</h1>
          <p className="text-[#43474c] mt-1 text-sm">Manage labour and employees</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#006397] text-white font-bold rounded-lg hover:bg-[#00517a] transition-all shadow-sm"
        >
          <Plus className="w-5 h-5" />
          Add Labour
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-[#f3f4f5] border border-[#edeeef] p-4 rounded-xl flex flex-col md:flex-row gap-4 items-center mb-6">
        <div className="relative flex-1 group w-full">
          <Search className="w-5 h-5 text-neutral-400 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-[#006397] transition-colors" />
          <input 
            type="text"
            placeholder="Search by name, CNIC, or designation..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-[#edeeef] rounded-lg text-[14px] focus:ring-2 focus:ring-[#5cb8fd]/20 focus:border-[#5cb8fd] outline-none transition-all"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#edeeef] shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#f8f9fa] border-b border-[#edeeef] text-[13px] font-bold text-[#43474c] uppercase tracking-wider">
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">CNIC</th>
                <th className="px-6 py-4">Mobile No</th>
                <th className="px-6 py-4">Address</th>
                <th className="px-6 py-4">Designation</th>
                <th className="px-6 py-4 text-right">Salary</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#edeeef]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-[#74777d]">Loading...</td>
                </tr>
              ) : filteredLabour.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-[#74777d]">No labour records found.</td>
                </tr>
              ) : (
                filteredLabour.map(lab => (
                  <tr key={lab.id} className="hover:bg-[#f8f9fa] transition-colors">
                    <td className="px-6 py-4 font-bold text-[#162839]">{lab.name}</td>
                    <td className="px-6 py-4 text-sm">{lab.cnic}</td>
                    <td className="px-6 py-4 text-sm">{lab.mobile_no}</td>
                    <td className="px-6 py-4 text-sm truncate max-w-[200px]" title={lab.address}>{lab.address}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className="px-2.5 py-1 bg-[#e3e2e6] text-[#43474c] rounded-full text-[11px] font-bold">
                        {lab.designation}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-mono font-medium text-[#162839]">
                      {lab.salary.toLocaleString('en-US')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-3">
                        <button onClick={() => handleOpenModal(lab)} className="p-1.5 text-[#006397] hover:bg-[#cde5ff] rounded transition-colors" title="Edit">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(lab.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[9999]">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full sm:w-[450px] min-w-[320px] p-6 animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold text-[#162839] mb-4">
              {formData.id ? 'Edit Labour' : 'Add Labour'}
            </h2>
            <form onSubmit={handleSave} className="space-y-5">
              <div className="space-y-2">
                <label className="text-[13px] font-bold text-[#162839] block">Name</label>
                <input 
                  type="text" required value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-[#f8f9fa] border border-[#edeeef] rounded-xl px-4 py-3 text-[14px] font-medium outline-none focus:ring-2 focus:ring-[#5cb8fd] transition-all"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[13px] font-bold text-[#162839] block">CNIC</label>
                  <input 
                    type="text" required value={formData.cnic} 
                    onChange={e => setFormData({...formData, cnic: formatCNIC(e.target.value)})}
                    placeholder="XXXXX-XXXXXXX-X"
                    maxLength={15}
                    className="w-full bg-[#f8f9fa] border border-[#edeeef] rounded-xl px-4 py-3 text-[14px] font-medium outline-none focus:ring-2 focus:ring-[#5cb8fd] transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[13px] font-bold text-[#162839] block">Mobile No</label>
                  <input 
                    type="text" required value={formData.mobile_no} 
                    onChange={e => setFormData({...formData, mobile_no: formatMobile(e.target.value)})}
                    placeholder="XXXX-XXXXXXX"
                    maxLength={12}
                    className="w-full bg-[#f8f9fa] border border-[#edeeef] rounded-xl px-4 py-3 text-[14px] font-medium outline-none focus:ring-2 focus:ring-[#5cb8fd] transition-all"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[13px] font-bold text-[#162839] block">Address</label>
                <input 
                  type="text" required value={formData.address} 
                  onChange={e => setFormData({...formData, address: e.target.value})}
                  className="w-full bg-[#f8f9fa] border border-[#edeeef] rounded-xl px-4 py-3 text-[14px] font-medium outline-none focus:ring-2 focus:ring-[#5cb8fd] transition-all"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[13px] font-bold text-[#162839] block">Designation</label>
                  <input 
                    type="text" required value={formData.designation} 
                    onChange={e => setFormData({...formData, designation: e.target.value})}
                    placeholder="e.g. Worker, Supervisor"
                    className="w-full bg-[#f8f9fa] border border-[#edeeef] rounded-xl px-4 py-3 text-[14px] font-medium outline-none focus:ring-2 focus:ring-[#5cb8fd] transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[13px] font-bold text-[#162839] block">Salary</label>
                  <input 
                    type="number" required value={formData.salary || ''} 
                    onChange={e => setFormData({...formData, salary: Number(e.target.value)})}
                    className="w-full bg-[#f8f9fa] border border-[#edeeef] rounded-xl px-4 py-3 text-[14px] font-medium outline-none focus:ring-2 focus:ring-[#5cb8fd] transition-all"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4 border-t border-[#edeeef] justify-end mt-6">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 font-bold text-[#43474c] hover:bg-[#f3f4f5] rounded transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-[#006397] text-white font-bold rounded hover:bg-[#00517a] transition-colors"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-[#162839]/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full sm:w-[400px] min-w-[320px] max-w-md p-6 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-[#162839] mb-2">Delete Labour Record</h3>
            <p className="text-[#43474c] text-sm mb-6">
              Are you sure you want to delete this labour record? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 text-sm font-bold text-[#43474c] hover:bg-[#f3f4f5] rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
