import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Sparkles, Mail, Lock, LogIn, Eye, EyeOff } from 'lucide-react';
import { useAppContext } from '../store';
import { motion } from 'motion/react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const { login, showToast, logoUrl, companyName, resolvedTheme } = useAppContext();
  const isDark = resolvedTheme === 'dark';
  const navigate = useNavigate();
  const activeLogo = logoUrl || '/assets/aistudio/image_6670885d.png?v=2';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!email || !password) {
      setErrorMsg('Please enter both email/username and password');
      showToast?.('Please enter both email/username and password', 'error');
      return;
    }

    setLoading(true);
    try {
      await login({ email, password });
      showToast?.('Signed in successfully', 'success');
      navigate('/dashboard');
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed');
      showToast?.(err.message || 'Login failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`relative font-sans flex flex-col min-h-screen overflow-hidden ${isDark ? 'bg-black text-slate-100' : 'bg-[#f6f8fc] text-slate-900'} selection:bg-sky-500/20 selection:text-sky-400 transition-colors duration-300`}>
      {/* iOS 26 Liquid Glass Gradient Background & Floating Blobs */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className={`absolute inset-0 transition-colors duration-500 ${isDark ? 'bg-black' : 'bg-gradient-to-br from-[#eef6ff] via-[#f8f9fc] to-[#fcf5fe]'}`} />
        {/* Top-left Cyan / Sky Floating Blob */}
        <div className={`absolute -top-[12%] -left-[8%] w-[52vw] h-[52vw] rounded-full blur-[115px] animate-liquid-1 ${isDark ? 'bg-gradient-to-br from-sky-500/12 via-cyan-500/08 to-transparent' : 'bg-gradient-to-br from-cyan-300/45 via-sky-200/35 to-transparent'}`} />
        {/* Center-right Lavender / Rose Floating Blob */}
        <div className={`absolute top-[18%] -right-[10%] w-[48vw] h-[48vw] rounded-full blur-[125px] animate-liquid-2 ${isDark ? 'bg-gradient-to-bl from-indigo-500/12 via-purple-500/08 to-transparent' : 'bg-gradient-to-bl from-fuchsia-300/40 via-pink-200/35 to-transparent'}`} />
        {/* Bottom-left Mint / Aqua Floating Blob */}
        <div className={`absolute -bottom-[15%] left-[18%] w-[50vw] h-[50vw] rounded-full blur-[120px] animate-liquid-3 ${isDark ? 'bg-gradient-to-tr from-emerald-500/10 via-teal-500/06 to-transparent' : 'bg-gradient-to-tr from-emerald-200/45 via-teal-100/35 to-transparent'}`} />
      </div>

      <main className="relative z-10 flex-grow flex items-center justify-center px-4 sm:px-6 py-12">
        <motion.div 
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: 'spring', damping: 26, stiffness: 300 }}
          className="w-full max-w-[430px] flex flex-col items-center"
        >
          {/* Top Brand Pill Badge (Lumen Reference Style) */}
          <motion.div 
            whileHover={{ scale: 1.03 }}
            className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/85 backdrop-blur-2xl border border-white/95 shadow-[0_4px_16px_rgba(15,23,42,0.05),inset_0_1px_1px_rgba(255,255,255,1)] mb-5"
          >
            <img src={activeLogo} alt="SanitaryFlow" className="w-5 h-5 object-contain" />
            <span className="text-[11px] font-bold tracking-[0.18em] text-slate-800 uppercase">{companyName || 'SanitaryFlow'}</span>
          </motion.div>

          {/* Frosted Glass Squircle Logo */}
          <motion.div 
            whileHover={{ scale: 1.05, y: -2 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            className="w-20 h-20 rounded-[24px] bg-white/95 backdrop-blur-2xl border border-white shadow-[0_10px_28px_rgba(15,23,42,0.07),inset_0_1px_1.5px_rgba(255,255,255,1)] flex items-center justify-center p-2.5 mb-5 overflow-hidden"
          >
            <img src={activeLogo} alt="SanitaryFlow Logo" className="w-full h-full object-contain" />
          </motion.div>

          {/* Centered Title & Subtitle */}
          <div className="text-center mb-8">
            <h1 className="text-[30px] font-bold text-slate-900 tracking-tight leading-tight">Welcome back</h1>
            <p className="text-[14px] text-slate-500 mt-1">Log in to your account</p>
          </div>

          {/* Translucent Frosted Liquid Glass Card */}
          <div className="w-full rounded-[32px] bg-white/[0.62] backdrop-blur-3xl border border-white/95 shadow-[0_24px_60px_-12px_rgba(15,23,42,0.07),0_4px_16px_rgba(15,23,42,0.03),inset_0_1px_2px_rgba(255,255,255,1)] p-7 sm:p-9">
            {errorMsg && (
              <motion.div 
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-5 p-3.5 bg-rose-50/90 border border-rose-200/80 text-rose-700 rounded-2xl text-[13px] font-medium backdrop-blur-md text-center"
              >
                {errorMsg}
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email / Username Field */}
              <div className="space-y-2">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider" htmlFor="email">
                  Email
                </label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 group-focus-within:text-sky-600 transition-colors" />
                  <input 
                    className="w-full pl-11 pr-4 py-3.5 bg-white/75 hover:bg-white/90 focus:bg-white/95 border border-slate-200/80 focus:border-sky-400 rounded-2xl outline-none focus:ring-4 focus:ring-sky-400/15 transition-all text-[14px] text-slate-900 placeholder:text-slate-400 shadow-[inset_0_1px_2px_rgba(15,23,42,0.02)] backdrop-blur-xl" 
                    id="email" 
                    name="email" 
                    placeholder="you@example.com or admin" 
                    type="text"
                    autoComplete="off"
                    tabIndex={1}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider" htmlFor="password">
                    Password
                  </label>
                  <Link
                    to="/forgot-password"
                    tabIndex={4}
                    className="text-[12px] font-semibold text-sky-700 hover:text-sky-600 transition-colors rounded-md focus:outline-none focus:ring-2 focus:ring-sky-400/40 px-1"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 group-focus-within:text-sky-600 transition-colors" />
                  <input 
                    className="w-full pl-11 pr-11 py-3.5 bg-white/75 hover:bg-white/90 focus:bg-white/95 border border-slate-200/80 focus:border-sky-400 rounded-2xl outline-none focus:ring-4 focus:ring-sky-400/15 transition-all text-[14px] text-slate-900 placeholder:text-slate-400 shadow-[inset_0_1px_2px_rgba(15,23,42,0.02)] backdrop-blur-xl" 
                    id="password" 
                    name="password" 
                    placeholder="••••••••" 
                    type={showPassword ? "text" : "password"}
                    tabIndex={2}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors"
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Pill-Shaped Frosted Glass Login Button */}
              <motion.button 
                whileHover={{ scale: 1.01, y: -1 }}
                whileTap={{ scale: 0.98 }}
                tabIndex={3}
                className="w-full mt-2 py-3.5 px-6 rounded-full bg-white/90 hover:bg-white text-slate-900 text-[14.5px] font-bold shadow-[0_6px_22px_rgba(15,23,42,0.07),inset_0_1px_1.5px_rgba(255,255,255,1)] border border-white transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-4 focus:ring-sky-400/25" 
                type="submit"
                disabled={loading}
              >
                {loading ? 'Signing in...' : 'Log in'}
              </motion.button>
            </form>
          </div>

        </motion.div>
      </main>
    </div>
  );
}
