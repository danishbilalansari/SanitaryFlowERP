import React, { useState } from 'react';
import { 
  KeyRound, 
  Lock, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Users, 
  RefreshCw, 
  Loader2, 
  Search,
  Check,
  Shield
} from 'lucide-react';
import { useAppContext } from '../store';
import ResetUserPasswordModal from './ResetUserPasswordModal';

interface SecuritySettingsSectionProps {
  users: any[];
  roles: any[];
  onReloadUsers?: () => void;
}

export default function SecuritySettingsSection({ users, roles, onReloadUsers }: SecuritySettingsSectionProps) {
  const { currentUser, showToast } = useAppContext();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [updatingSelf, setUpdatingSelf] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Admin user reset modal
  const [selectedUserForReset, setSelectedUserForReset] = useState<any | null>(null);
  const [userSearch, setUserSearch] = useState('');

  // Strength score
  const hasMinLength = newPassword.length >= 6;
  const hasLetters = /[a-zA-Z]/.test(newPassword);
  const hasNumbers = /[0-9]/.test(newPassword);
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;

  let strengthScore = 0;
  if (newPassword.length >= 4) strengthScore += 1;
  if (hasMinLength) strengthScore += 1;
  if (hasLetters && hasNumbers) strengthScore += 1;
  if (newPassword.length >= 10 && /[^a-zA-Z0-9]/.test(newPassword)) strengthScore += 1;

  const strengthLabels = ['Too Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'];
  const strengthColors = ['bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-emerald-500', 'bg-[#006397]'];

  const handleUpdateOwnPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!currentPassword) {
      setErrorMsg('Please enter your current password.');
      return;
    }
    if (!newPassword) {
      setErrorMsg('Please enter your new password.');
      return;
    }
    if (newPassword.length < 4) {
      setErrorMsg('New password must be at least 4 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('New password and confirmation do not match.');
      return;
    }
    if (currentPassword === newPassword) {
      setErrorMsg('New password must be different from current password.');
      return;
    }

    setUpdatingSelf(true);
    try {
      const res = await fetch('/api/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
        credentials: 'include'
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to change password');
      }

      setSuccessMsg('Your password has been changed successfully.');
      showToast?.('Password updated successfully!', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to change password');
    } finally {
      setUpdatingSelf(false);
    }
  };

  const filteredUsers = users.filter((u) => 
    u.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.username?.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email?.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.role_name?.toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Top Grid: Change Password Form & Security Profile */}
      <div className="grid grid-cols-12 gap-8">
        {/* Left Column: Direct Change Password Form */}
        <div className="col-span-12 lg:col-span-7 bg-white p-8 rounded-2xl border border-[#edeeef] shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-[#edeeef] pb-5">
            <div className="w-10 h-10 rounded-xl bg-[#cce5ff] text-[#006397] flex items-center justify-center font-bold">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-[18px] font-bold text-[#162839]">Change Your Password</h3>
              <p className="text-[13px] text-neutral-400 font-medium">Update the login password for your active account ({currentUser?.username || 'User'}).</p>
            </div>
          </div>

          <form onSubmit={handleUpdateOwnPassword} className="space-y-5">
            {errorMsg && (
              <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-red-700 text-[13px] animate-in fade-in">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2.5 text-emerald-700 text-[13px] animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Current Password */}
            <div className="space-y-1.5">
              <label className="text-[13px] font-bold text-[#162839] block" htmlFor="settings-current-password">
                Current Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input 
                  id="settings-current-password"
                  type={showCurrent ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  required
                  className="w-full bg-[#f8f9fa] border border-[#d1d5db] rounded-xl pl-10 pr-11 py-2.5 text-[14px] font-medium outline-none focus:bg-white focus:ring-2 focus:ring-[#5cb8fd] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-[#162839] p-1"
                >
                  {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* New Password & Confirmation */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[13px] font-bold text-[#162839] block" htmlFor="settings-new-password">
                  New Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input 
                    id="settings-new-password"
                    type={showNew ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min. 4 characters"
                    required
                    className="w-full bg-[#f8f9fa] border border-[#d1d5db] rounded-xl pl-10 pr-11 py-2.5 text-[14px] font-medium outline-none focus:bg-white focus:ring-2 focus:ring-[#5cb8fd] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-[#162839] p-1"
                  >
                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[13px] font-bold text-[#162839] block" htmlFor="settings-confirm-password">
                  Confirm New Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input 
                    id="settings-confirm-password"
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    required
                    className={`w-full bg-[#f8f9fa] border rounded-xl pl-10 pr-11 py-2.5 text-[14px] font-medium outline-none focus:bg-white focus:ring-2 transition-all ${
                      confirmPassword && !passwordsMatch 
                        ? 'border-red-400 focus:ring-red-400' 
                        : confirmPassword && passwordsMatch 
                          ? 'border-emerald-400 focus:ring-emerald-400' 
                          : 'border-[#d1d5db] focus:ring-[#5cb8fd]'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-[#162839] p-1"
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Password Strength Indicator */}
            {newPassword && (
              <div className="p-3 bg-[#f8f9fa] border border-[#edeeef] rounded-xl space-y-2">
                <div className="flex items-center justify-between text-[12px]">
                  <span className="font-bold text-[#162839]">Password Strength</span>
                  <span className={`font-black uppercase tracking-wider text-[11px] ${strengthScore <= 1 ? 'text-red-500' : strengthScore === 2 ? 'text-amber-500' : 'text-emerald-600'}`}>
                    {strengthLabels[strengthScore]}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-1.5 h-1.5">
                  {[0, 1, 2, 3].map((idx) => (
                    <div 
                      key={idx}
                      className={`h-full rounded-full transition-all duration-300 ${
                        idx < strengthScore ? strengthColors[strengthScore] : 'bg-neutral-200'
                      }`}
                    />
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] font-medium text-neutral-500 pt-1">
                  <div className={`flex items-center gap-1 ${hasMinLength ? 'text-emerald-600 font-bold' : ''}`}>
                    {hasMinLength ? <Check className="w-3 h-3" /> : <span className="w-3 h-3 block rounded-full border border-neutral-300" />}
                    At least 6 characters
                  </div>
                  <div className={`flex items-center gap-1 ${hasLetters && hasNumbers ? 'text-emerald-600 font-bold' : ''}`}>
                    {hasLetters && hasNumbers ? <Check className="w-3 h-3" /> : <span className="w-3 h-3 block rounded-full border border-neutral-300" />}
                    Letters & numbers combined
                  </div>
                </div>
              </div>
            )}

            <div className="pt-3 flex items-center justify-end">
              <button
                id="save-my-password-btn"
                type="submit"
                disabled={updatingSelf || (newPassword.length > 0 && confirmPassword.length > 0 && !passwordsMatch)}
                className="px-6 py-3 bg-[#006397] text-white font-bold text-[13px] rounded-xl hover:opacity-90 active:scale-95 transition-all shadow-md flex items-center gap-2 disabled:opacity-50"
              >
                {updatingSelf ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Updating Password...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    Save New Password
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Security Guidance & Active Session */}
        <div className="col-span-12 lg:col-span-5 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-[#edeeef] shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-[16px] text-[#162839]">Active Session Profile</h4>
                <p className="text-[12px] text-neutral-400 font-medium">Authentication token is secure</p>
              </div>
            </div>

            <div className="divide-y divide-[#edeeef] text-[13px]">
              <div className="py-2.5 flex justify-between">
                <span className="text-neutral-400 font-medium">Logged In As</span>
                <span className="font-bold text-[#162839]">{currentUser?.name || 'System Admin'}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-neutral-400 font-medium">Username</span>
                <span className="font-bold text-[#006397]">@{currentUser?.username || 'admin'}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-neutral-400 font-medium">System Role</span>
                <span className="bg-[#cce5ff] text-[#006397] px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase">
                  {currentUser?.role_name || currentUser?.role_id || 'Admin'}
                </span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-neutral-400 font-medium">Audit Status</span>
                <span className="text-emerald-600 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Logged & Monitored
                </span>
              </div>
            </div>
          </div>

          <div className="bg-[#f0f7ff] border border-[#b5dbff] p-6 rounded-2xl space-y-3">
            <div className="flex items-center gap-2 text-[#006397]">
              <ShieldAlert className="w-5 h-5" />
              <h4 className="font-bold text-[15px]">Security Recommendations</h4>
            </div>
            <ul className="text-[12px] text-[#254660] space-y-2 leading-relaxed font-medium list-disc pl-4">
              <li>Use a unique passphrase with a mixture of letters, numbers, and symbols.</li>
              <li>Avoid reusing passwords from personal email or social accounts.</li>
              <li>Administrators can reset user credentials directly from the Access Control or Credentials panel below.</li>
              <li>All password modifications are recorded in the System Audit Trail.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Admin User Credentials Table (Quick Reset for Staff) */}
      <div className="bg-white rounded-2xl border border-[#edeeef] shadow-sm overflow-hidden">
        <div className="p-6 border-b border-[#edeeef] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-[18px] text-[#162839]">Staff Credentials & Password Management</h3>
            <p className="text-[13px] text-neutral-400 font-medium mt-0.5">Quickly override or reset system access passwords for team members.</p>
          </div>
          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input 
              type="text" 
              placeholder="Search user..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[#f8f9fa] border border-[#edeeef] rounded-xl text-[13px] font-medium outline-none focus:bg-white focus:ring-2 focus:ring-[#5cb8fd] transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#f8f9fa] border-b border-[#edeeef] text-[11px] font-black text-neutral-400 uppercase tracking-widest">
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Username</th>
                <th className="px-6 py-4">Assigned Role</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Credentials Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#edeeef]">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-neutral-400 text-[13px] font-medium">
                    No users found matching your search.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-[#fbfcfd] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-[13px] ${u.color || 'bg-blue-100 text-[#006397]'}`}>
                          {u.initials || u.name?.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-[14px] font-bold text-[#162839]">{u.name}</p>
                          <p className="text-[12px] text-neutral-400 font-medium">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-[13px] text-[#006397]">
                      @{u.username}
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-[#d1e4fb] text-[#006397] px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider">
                        {u.role_name || u.role_id}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${u.status === 'Active' ? 'bg-emerald-500' : 'bg-neutral-300'}`} />
                        <span className="text-[13px] font-bold text-[#162839]">{u.status}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setSelectedUserForReset(u)}
                        className="px-3.5 py-1.5 bg-[#f8f9fa] border border-[#d1d5db] hover:border-[#006397] hover:bg-[#cce5ff] text-[#162839] hover:text-[#006397] font-bold text-[12px] rounded-lg transition-all inline-flex items-center gap-1.5 shadow-sm"
                        title="Reset this user's password"
                      >
                        <KeyRound className="w-3.5 h-3.5" />
                        Reset Password
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Admin Reset Password Modal */}
      <ResetUserPasswordModal 
        isOpen={Boolean(selectedUserForReset)}
        onClose={() => setSelectedUserForReset(null)}
        user={selectedUserForReset}
        onSuccess={() => onReloadUsers?.()}
      />
    </div>
  );
}
