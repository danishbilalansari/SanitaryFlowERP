import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Factory, 
  Mail, 
  Lock, 
  ArrowLeft, 
  ShieldCheck, 
  CheckCircle2, 
  Eye, 
  EyeOff, 
  KeyRound, 
  Sparkles, 
  AlertCircle, 
  Loader2, 
  RefreshCw,
  Copy,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppContext } from '../store';

type Step = 'IDENTIFY' | 'VERIFY' | 'NEW_PASSWORD' | 'SUCCESS';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const { showToast, logoUrl, companyName, resolvedTheme } = useAppContext();
  const isDark = resolvedTheme === 'dark';
  const activeLogo = logoUrl || '/assets/aistudio/image_6670885d.png?v=2';

  // State
  const [step, setStep] = useState<Step>('IDENTIFY');
  const [identifier, setIdentifier] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Step 2 & 3 State
  const [userId, setUserId] = useState<number | null>(null);
  const [maskedEmail, setMaskedEmail] = useState('');
  const [username, setUsername] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [code, setCode] = useState('');
  const [codeCopied, setCodeCopied] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // New Password State
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [autoRedirectSeconds, setAutoRedirectSeconds] = useState(5);

  // Resend timer countdown
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Auto redirect countdown on success
  useEffect(() => {
    if (step === 'SUCCESS') {
      if (autoRedirectSeconds <= 0) {
        navigate('/login');
        return;
      }
      const timer = setTimeout(() => setAutoRedirectSeconds(s => s - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [step, autoRedirectSeconds, navigate]);

  // Password strength calculation
  const getStrength = (pass: string) => {
    let score = 0;
    if (!pass) return { score: 0, label: 'None', color: 'bg-neutral-200' };
    if (pass.length >= 6) score += 1;
    if (pass.length >= 10) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score <= 2) return { score: 1, label: 'Weak', color: 'bg-red-500' };
    if (score <= 4) return { score: 2, label: 'Medium', color: 'bg-amber-500' };
    return { score: 3, label: 'Strong', color: 'bg-emerald-500' };
  };

  const strength = getStrength(newPassword);

  // STEP 1: Request Reset
  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (!identifier.trim()) {
      setErrorMessage('Please enter your email address or username');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/forgot-password/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: identifier.trim() })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to request password reset');
      }

      setUserId(data.userId);
      setUsername(data.username);
      setMaskedEmail(data.emailMasked);
      setGeneratedCode(data.verificationCode);
      setResendCooldown(30);
      setStep('VERIFY');
      showToast?.('Verification code generated successfully', 'success');
    } catch (err: any) {
      setErrorMessage(err.message || 'Something went wrong');
      showToast?.(err.message || 'Failed to request reset', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Resend code handler
  const handleResendCode = async () => {
    if (resendCooldown > 0 || !identifier) return;
    setErrorMessage('');
    setLoading(true);
    try {
      const res = await fetch('/api/forgot-password/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: identifier.trim() })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to resend code');
      }

      setGeneratedCode(data.verificationCode);
      setResendCooldown(30);
      showToast?.('A new verification code has been generated', 'success');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to resend code');
    } finally {
      setLoading(false);
    }
  };

  // STEP 2: Verify Code
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (!code.trim() || code.trim().length !== 6) {
      setErrorMessage('Please enter the complete 6-digit verification code');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/forgot-password/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, code: code.trim() })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Invalid verification code');
      }

      setStep('NEW_PASSWORD');
      showToast?.('Code verified! Please set your new password', 'success');
    } catch (err: any) {
      setErrorMessage(err.message || 'Verification failed');
      showToast?.(err.message || 'Verification failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Auto-fill test code
  const handleAutoFillCode = () => {
    if (generatedCode) {
      setCode(generatedCode);
      setErrorMessage('');
      showToast?.('Verification code auto-filled', 'info');
    }
  };

  const handleCopyCode = () => {
    if (generatedCode) {
      navigator.clipboard.writeText(generatedCode);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
      showToast?.('Code copied to clipboard', 'info');
    }
  };

  // STEP 3: Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!newPassword) {
      setErrorMessage('Please enter a new password');
      return;
    }
    if (newPassword.length < 4) {
      setErrorMessage('Password must be at least 4 characters long');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/forgot-password/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          code: code.trim(),
          newPassword: newPassword.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to reset password');
      }

      setStep('SUCCESS');
      showToast?.('Password reset successfully!', 'success');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to reset password');
      showToast?.(err.message || 'Failed to reset password', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`relative font-sans flex flex-col min-h-screen overflow-hidden ${isDark ? 'bg-[#2b2c30] text-slate-100' : 'bg-[#f6f8fc] text-slate-900'} selection:bg-sky-500/20 selection:text-sky-400 transition-colors duration-300`}>
      {/* iOS 26 Liquid Glass Gradient Background & Floating Blobs */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className={`absolute inset-0 transition-colors duration-500 ${isDark ? 'bg-[#2b2c30]' : 'bg-gradient-to-br from-[#eef6ff] via-[#f8f9fc] to-[#fcf5fe]'}`} />
        {/* Top-left Cyan / Sky Floating Blob */}
        <div className={`absolute -top-[12%] -left-[8%] w-[52vw] h-[52vw] rounded-full blur-[115px] animate-liquid-1 ${isDark ? 'bg-gradient-to-br from-sky-500/08 via-cyan-500/05 to-transparent' : 'bg-gradient-to-br from-cyan-300/45 via-sky-200/35 to-transparent'}`} />
        {/* Center-right Lavender / Rose Floating Blob */}
        <div className={`absolute top-[18%] -right-[10%] w-[48vw] h-[48vw] rounded-full blur-[125px] animate-liquid-2 ${isDark ? 'bg-gradient-to-bl from-indigo-500/08 via-purple-500/05 to-transparent' : 'bg-gradient-to-bl from-fuchsia-300/40 via-pink-200/35 to-transparent'}`} />
        {/* Bottom-left Mint / Aqua Floating Blob */}
        <div className={`absolute -bottom-[15%] left-[18%] w-[50vw] h-[50vw] rounded-full blur-[120px] animate-liquid-3 ${isDark ? 'bg-gradient-to-tr from-emerald-500/08 via-teal-500/05 to-transparent' : 'bg-gradient-to-tr from-emerald-200/45 via-teal-100/35 to-transparent'}`} />
      </div>

      <main className="relative z-10 flex-grow flex items-center justify-center px-4 sm:px-6 py-12">
        <motion.div 
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: 'spring', damping: 26, stiffness: 300 }}
          className="w-full max-w-[440px] flex flex-col items-center"
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
            {step === 'SUCCESS' ? (
              <CheckCircle2 className="w-8 h-8 text-emerald-500 stroke-[2]" />
            ) : (
              <img src={activeLogo} alt="SanitaryFlow Logo" className="w-full h-full object-contain" />
            )}
          </motion.div>

          {/* Centered Title, Subtitle & Step Pills */}
          <div className="text-center mb-7">
            <h1 className="text-[28px] sm:text-[30px] font-bold text-slate-900 tracking-tight leading-tight">
              {step === 'IDENTIFY' && 'Account Recovery'}
              {step === 'VERIFY' && 'Verify Identity'}
              {step === 'NEW_PASSWORD' && 'Set New Password'}
              {step === 'SUCCESS' && 'Password Updated'}
            </h1>
            <p className="text-[14px] text-slate-500 mt-1">
              {step === 'IDENTIFY' && 'Reset your SanitaryFlow credentials securely'}
              {step === 'VERIFY' && 'Enter the 6-digit security code'}
              {step === 'NEW_PASSWORD' && 'Create a strong new password for your account'}
              {step === 'SUCCESS' && 'Your credentials have been restored'}
            </p>

            {/* Step indicator pills */}
            <div className="flex items-center justify-center gap-2 mt-4">
              {(['IDENTIFY', 'VERIFY', 'NEW_PASSWORD'] as const).map((s, idx) => {
                const stepIndex = ['IDENTIFY', 'VERIFY', 'NEW_PASSWORD', 'SUCCESS'].indexOf(step);
                const isCurrent = step === s;
                const isDone = stepIndex > idx;
                return (
                  <div 
                    key={s} 
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      isCurrent 
                        ? 'w-9 bg-sky-500 shadow-[0_0_10px_rgba(14,165,233,0.4)]' 
                        : isDone 
                          ? 'w-5 bg-emerald-400' 
                          : 'w-3 bg-white/80 border border-slate-200/80'
                    }`}
                  />
                );
              })}
            </div>
          </div>

          {/* Translucent Frosted Liquid Glass Card */}
          <div className="w-full rounded-[32px] bg-white/[0.62] backdrop-blur-3xl border border-white/95 shadow-[0_24px_60px_-12px_rgba(15,23,42,0.07),0_4px_16px_rgba(15,23,42,0.03),inset_0_1px_2px_rgba(255,255,255,1)] p-7 sm:p-9">
            {errorMessage && (
              <motion.div 
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-5 p-3.5 bg-rose-50/90 border border-rose-200/80 text-rose-700 rounded-2xl text-[13px] font-medium backdrop-blur-md flex items-start gap-2.5"
              >
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
                <span className="leading-tight">{errorMessage}</span>
              </motion.div>
            )}

            <AnimatePresence mode="wait">
              
              {/* STEP 1: IDENTIFY USER */}
              {step === 'IDENTIFY' && (
                <motion.form 
                  key="step-identify"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  onSubmit={handleRequestReset}
                  className="space-y-5"
                >
                  <div>
                    <h2 className="text-[17px] font-bold text-slate-900 leading-snug">Forgot your password?</h2>
                    <p className="text-[13px] text-slate-500 mt-1 leading-relaxed">
                      Enter your registered email address or username. We'll generate a secure 6-digit verification code to reset your password.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider" htmlFor="identifier">
                      Email or Username
                    </label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 group-focus-within:text-sky-600 transition-colors" />
                      <input 
                        id="identifier"
                        type="text"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        placeholder="you@example.com or admin"
                        className="w-full pl-11 pr-4 py-3.5 bg-white/75 hover:bg-white/90 focus:bg-white/95 border border-slate-200/80 focus:border-sky-400 rounded-2xl outline-none focus:ring-4 focus:ring-sky-400/15 transition-all text-[14px] text-slate-900 placeholder:text-slate-400 shadow-[inset_0_1px_2px_rgba(15,23,42,0.02)] backdrop-blur-xl"
                        autoFocus
                        required
                      />
                    </div>
                  </div>

                  <motion.button 
                    whileHover={{ scale: 1.01, y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 px-6 rounded-full bg-white/90 hover:bg-white text-slate-900 text-[14px] font-bold shadow-[0_6px_22px_rgba(15,23,42,0.07),inset_0_1px_1.5px_rgba(255,255,255,1)] border border-white transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-sky-600" />
                        <span>Finding Account...</span>
                      </>
                    ) : (
                      <>
                        <KeyRound className="w-4 h-4 text-sky-600" />
                        <span>Send Verification Code</span>
                      </>
                    )}
                  </motion.button>

                  <div className="text-center pt-1">
                    <Link 
                      to="/login"
                      className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-sky-700 hover:text-sky-600 transition-colors"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      Return to Sign In
                    </Link>
                  </div>
                </motion.form>
              )}

              {/* STEP 2: VERIFY CODE */}
              {step === 'VERIFY' && (
                <motion.form 
                  key="step-verify"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  onSubmit={handleVerifyCode}
                  className="space-y-5"
                >
                  <div>
                    <h2 className="text-[17px] font-bold text-slate-900 leading-snug">Enter Verification Code</h2>
                    <p className="text-[13px] text-slate-500 mt-1">
                      We generated a 6-digit code for <strong className="text-slate-900">@{username}</strong> ({maskedEmail}).
                    </p>
                  </div>

                  {/* Simulation / Demo Code Helper Banner */}
                  {generatedCode && (
                    <div className="p-4 bg-white/75 backdrop-blur-xl border border-white rounded-2xl shadow-[0_4px_16px_rgba(15,23,42,0.04)] space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-sky-700 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-sky-600" />
                          Your 6-Digit Reset PIN
                        </span>
                        <button
                          type="button"
                          onClick={handleCopyCode}
                          className="text-[11px] font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
                        >
                          {codeCopied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                          {codeCopied ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <code className="text-[20px] font-mono font-bold tracking-[0.3em] text-sky-700 bg-sky-50/80 px-3.5 py-1.5 rounded-xl border border-sky-200/70">
                          {generatedCode}
                        </code>
                        <button
                          type="button"
                          onClick={handleAutoFillCode}
                          className="px-4 py-2 rounded-full bg-white hover:bg-sky-50 text-sky-700 text-[12px] font-bold border border-sky-200/80 shadow-xs transition-all whitespace-nowrap cursor-pointer"
                        >
                          Auto-fill
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Code Input */}
                  <div className="space-y-2">
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider" htmlFor="code">
                      6-Digit Security Code
                    </label>
                    <input 
                      id="code"
                      type="text"
                      maxLength={6}
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="••••••"
                      className="w-full text-center tracking-[0.5em] text-[22px] font-mono font-bold py-3.5 bg-white/75 hover:bg-white/90 focus:bg-white/95 border border-slate-200/80 focus:border-sky-400 rounded-2xl outline-none focus:ring-4 focus:ring-sky-400/15 transition-all text-slate-900 shadow-[inset_0_1px_2px_rgba(15,23,42,0.02)] backdrop-blur-xl"
                      autoFocus
                      required
                    />
                  </div>

                  <motion.button 
                    whileHover={{ scale: 1.01, y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={loading || code.length !== 6}
                    className="w-full py-3.5 px-6 rounded-full bg-white/90 hover:bg-white text-slate-900 text-[14px] font-bold shadow-[0_6px_22px_rgba(15,23,42,0.07),inset_0_1px_1.5px_rgba(255,255,255,1)] border border-white transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-sky-600" />
                        <span>Verifying Code...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-sky-600" />
                        <span>Verify & Continue</span>
                      </>
                    )}
                  </motion.button>

                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setStep('IDENTIFY');
                        setErrorMessage('');
                      }}
                      className="text-[12.5px] font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      Back
                    </button>

                    <button
                      type="button"
                      disabled={resendCooldown > 0 || loading}
                      onClick={handleResendCode}
                      className="text-[12.5px] font-semibold text-sky-700 hover:text-sky-600 disabled:opacity-40 flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                      {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend Code'}
                    </button>
                  </div>
                </motion.form>
              )}

              {/* STEP 3: NEW PASSWORD */}
              {step === 'NEW_PASSWORD' && (
                <motion.form 
                  key="step-new-pass"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  onSubmit={handleResetPassword}
                  className="space-y-4"
                >
                  <div>
                    <h2 className="text-[17px] font-bold text-slate-900 leading-snug">Set New Password</h2>
                    <p className="text-[13px] text-slate-500 mt-1">
                      Choose a strong, memorable password for your account.
                    </p>
                  </div>

                  {/* New Password */}
                  <div className="space-y-2">
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      New Password
                    </label>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 group-focus-within:text-sky-600 transition-colors" />
                      <input 
                        type={showNewPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-11 pr-11 py-3.5 bg-white/75 hover:bg-white/90 focus:bg-white/95 border border-slate-200/80 focus:border-sky-400 rounded-2xl outline-none focus:ring-4 focus:ring-sky-400/15 transition-all text-[14px] text-slate-900 placeholder:text-slate-400 shadow-[inset_0_1px_2px_rgba(15,23,42,0.02)] backdrop-blur-xl"
                        autoFocus
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Password strength meter */}
                    {newPassword && (
                      <div className="pt-1 space-y-1.5">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-500 font-medium">Strength</span>
                          <span className="font-bold text-slate-800">{strength.label}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-1.5 h-1.5">
                          <div className={`rounded-full transition-colors ${strength.score >= 1 ? strength.color : 'bg-white/80'}`} />
                          <div className={`rounded-full transition-colors ${strength.score >= 2 ? strength.color : 'bg-white/80'}`} />
                          <div className={`rounded-full transition-colors ${strength.score >= 3 ? strength.color : 'bg-white/80'}`} />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-2">
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Confirm New Password
                    </label>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 group-focus-within:text-sky-600 transition-colors" />
                      <input 
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-11 pr-11 py-3.5 bg-white/75 hover:bg-white/90 focus:bg-white/95 border border-slate-200/80 focus:border-sky-400 rounded-2xl outline-none focus:ring-4 focus:ring-sky-400/15 transition-all text-[14px] text-slate-900 placeholder:text-slate-400 shadow-[inset_0_1px_2px_rgba(15,23,42,0.02)] backdrop-blur-xl"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    {confirmPassword && (
                      <div className="flex items-center gap-1.5 text-[11.5px] font-medium pt-0.5">
                        {newPassword === confirmPassword ? (
                          <span className="text-emerald-600 flex items-center gap-1 font-bold">
                            <Check className="w-3.5 h-3.5" /> Passwords match
                          </span>
                        ) : (
                          <span className="text-rose-500 font-bold">Passwords do not match</span>
                        )}
                      </div>
                    )}
                  </div>

                  <motion.button 
                    whileHover={{ scale: 1.01, y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={loading || !newPassword || newPassword !== confirmPassword}
                    className="w-full mt-2 py-3.5 px-6 rounded-full bg-white/90 hover:bg-white text-slate-900 text-[14px] font-bold shadow-[0_6px_22px_rgba(15,23,42,0.07),inset_0_1px_1.5px_rgba(255,255,255,1)] border border-white transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-sky-600" />
                        <span>Updating Password...</span>
                      </>
                    ) : (
                      <>
                        <KeyRound className="w-4 h-4 text-sky-600" />
                        <span>Save New Password</span>
                      </>
                    )}
                  </motion.button>
                </motion.form>
              )}

              {/* STEP 4: SUCCESS CONFIRMATION */}
              {step === 'SUCCESS' && (
                <motion.div 
                  key="step-success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center space-y-5 py-2"
                >
                  <div className="w-16 h-16 bg-emerald-50/90 border border-emerald-200/80 text-emerald-600 rounded-[22px] flex items-center justify-center mx-auto shadow-[0_8px_24px_rgba(16,185,129,0.12)]">
                    <CheckCircle2 className="w-9 h-9" />
                  </div>

                  <div>
                    <h2 className="text-[21px] font-bold text-slate-900 tracking-tight">Password Reset Complete!</h2>
                    <p className="text-[13.5px] text-slate-500 mt-1.5 leading-relaxed">
                      Your password has been successfully updated. You can now log into your SanitaryFlow account.
                    </p>
                  </div>

                  <div className="p-3.5 bg-white/75 border border-white rounded-2xl text-slate-500 text-[12.5px] shadow-xs">
                    Redirecting to login page in <strong className="text-slate-900 font-bold">{autoRedirectSeconds}</strong> seconds...
                  </div>

                  <motion.button 
                    whileHover={{ scale: 1.01, y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={() => navigate('/login')}
                    className="w-full py-3.5 px-6 rounded-full bg-white/90 hover:bg-white text-slate-900 text-[14px] font-bold shadow-[0_6px_22px_rgba(15,23,42,0.07),inset_0_1px_1.5px_rgba(255,255,255,1)] border border-white transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Sign In Now</span>
                    <ArrowLeft className="w-4 h-4 rotate-180 text-sky-600" />
                  </motion.button>
                </motion.div>
              )}

            </AnimatePresence>
          </div>

        </motion.div>
      </main>
    </div>
  );
}
