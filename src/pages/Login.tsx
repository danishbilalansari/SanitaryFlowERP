import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Factory, Mail, Lock, LogIn, ShieldCheck, Copyright } from 'lucide-react';
import { useAppContext } from '../store';
import { motion } from 'motion/react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, showToast } = useAppContext();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      showToast?.('Please enter both email/username and password', 'error');
      return;
    }

    setLoading(true);
    try {
      await login({ email, password });
      showToast?.('Signed in successfully', 'success');
      navigate('/dashboard');
    } catch (err: any) {
      showToast?.(err.message || 'Login failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#f8f9fa] text-[#191c1d] font-sans flex flex-col min-h-screen">
      <main className="flex-grow flex items-center justify-center px-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-[440px]"
        >
          {/* Login Card */}
          <div className="bg-white border border-[#c4c6cd] shadow-sm rounded-xl overflow-hidden">
            {/* Branding Header */}
            <div className="pt-8 px-8 pb-4 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#162839] mb-4">
                <Factory className="text-white w-8 h-8" />
              </div>
              <h1 className="text-[30px] font-bold text-[#162839] tracking-tight leading-[38px]">SanitaryFlow</h1>
              <p className="text-[14px] text-[#43474c] mt-1">Factory & Shop Management</p>
            </div>

            {/* Form Section */}
            <div className="px-8 pb-8">
              <div className="mb-6">
                <h2 className="text-[20px] font-semibold text-[#191c1d] leading-[28px]">Welcome back</h2>
                <p className="text-[13px] text-[#43474c]">Please enter your details to sign in</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email Field */}
                <div className="space-y-1">
                  <label className="block text-[13px] font-bold text-[#191c1d]" htmlFor="email">
                    Email/Username
                  </label>
                  <div className="relative group">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-[#74777d] w-5 h-5 group-focus-within:text-[#006397] transition-colors" />
                    <input 
                      className="w-full pl-10 pr-4 py-2.5 bg-[#f8f9fa] border border-[#c4c6cd] rounded focus:border-[#006397] focus:ring-2 focus:ring-[#5cb8fd] outline-none transition-all text-sm text-[#191c1d] placeholder:text-[#74777d]" 
                      id="email" 
                      name="email" 
                      placeholder="manager@sanitaryflow.com" 
                      type="text"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-1">
                  <label className="block text-[13px] font-bold text-[#191c1d]" htmlFor="password">
                    Password
                  </label>
                  <div className="relative group">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-[#74777d] w-5 h-5 group-focus-within:text-[#006397] transition-colors" />
                    <input 
                      className="w-full pl-10 pr-4 py-2.5 bg-[#f8f9fa] border border-[#c4c6cd] rounded focus:border-[#006397] focus:ring-2 focus:ring-[#5cb8fd] outline-none transition-all text-sm text-[#191c1d] placeholder:text-[#74777d]" 
                      id="password" 
                      name="password" 
                      placeholder="••••••••" 
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* CTA Button */}
                <button 
                  className="w-full bg-[#162839] hover:bg-[#36485b] text-white py-3 rounded-lg text-lg font-semibold transition-colors shadow-sm mt-4 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed" 
                  type="submit"
                  disabled={loading}
                >
                  {loading ? 'Signing in...' : 'Login'}
                  <LogIn className="w-5 h-5" />
                </button>
              </form>
            </div>
          </div>

          {/* Security Badge */}
          <div className="mt-8 flex justify-center opacity-70">
            <div className="bg-[#edeeef] p-4 rounded-xl border border-[#c4c6cd] flex items-center gap-3 w-full max-w-[400px]">
              <div className="w-10 h-10 bg-white rounded flex items-center justify-center shrink-0 shadow-sm">
                <ShieldCheck className="text-[#162839] w-5 h-5 fill-[#162839]" />
              </div>
              <div className="flex-1">
                <p className="text-[11px] font-bold text-[#43474c] uppercase tracking-wider">Enterprise Security</p>
                <p className="text-[12px] text-[#43474c] leading-tight mt-0.5">Your session is protected with industry-standard 256-bit encryption.</p>
              </div>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Visual Background Element */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none opacity-5">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#162839] rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-[#006397] to-transparent opacity-20"></div>
      </div>
    </div>
  );
}
