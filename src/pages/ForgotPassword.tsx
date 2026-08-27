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
  const { showToast } = useAppContext();

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
    <div className="bg-[#f8f9fa] text-[#191c1d] font-sans flex flex-col min-h-screen">
      <main className="flex-grow flex items-center justify-center px-4 py-8">
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-[460px]"
        >
          {/* Card */}
          <div className="bg-white border border-[#c4c6cd] shadow-lg rounded-2xl overflow-hidden">
            
            {/* Header / Brand */}
            <div className="pt-8 px-8 pb-4 text-center border-b border-[#f0f2f5]">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#162839] mb-3 shadow-md">
                <Factory className="text-white w-7 h-7" />
              </div>
              <h1 className="text-[26px] font-bold text-[#162839] tracking-tight leading-tight">SanitaryFlow</h1>
              <p className="text-[13px] text-[#43474c] mt-0.5 font-medium">Account Recovery & Credential Reset</p>

              {/* Step indicator pills */}
              <div className="flex items-center justify-center gap-1.5 mt-5">
                {(['IDENTIFY', 'VERIFY', 'NEW_PASSWORD'] as const).map((s, idx) => {
                  const stepIndex = ['IDENTIFY', 'VERIFY', 'NEW_PASSWORD', 'SUCCESS'].indexOf(step);
                  const isCurrent = step === s;
                  const isDone = stepIndex > idx;
                  return (
                    <div 
                      key={s} 
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        isCurrent 
                          ? 'w-8 bg-[#006397]' 
                          : isDone 
                            ? 'w-5 bg-emerald-500' 
                            : 'w-3 bg-neutral-200'
                      }`}
                    />
                  );
                })}
              </div>
            </div>

            {/* Content Body */}
            <div className="p-8">
              {errorMessage && (
                <div className="mb-5 p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-medium flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
                  <span className="leading-tight">{errorMessage}</span>
                </div>
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
                      <h2 className="text-[19px] font-bold text-[#162839] leading-snug">Forgot your password?</h2>
                      <p className="text-[13px] text-neutral-500 mt-1">
                        Enter your registered email address or username. We'll generate a secure 6-digit verification code to reset your password.
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[13px] font-bold text-[#191c1d]" htmlFor="identifier">
                        Email or Username
                      </label>
                      <div className="relative group">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 w-5 h-5 group-focus-within:text-[#006397] transition-colors" />
                        <input 
                          id="identifier"
                          type="text"
                          value={identifier}
                          onChange={(e) => setIdentifier(e.target.value)}
                          placeholder="e.g. manager@sanitaryflow.com or admin"
                          className="w-full pl-11 pr-4 py-3 bg-[#f8f9fa] border border-[#c4c6cd] rounded-xl focus:border-[#006397] focus:ring-2 focus:ring-[#5cb8fd] outline-none transition-all text-sm text-[#191c1d] placeholder:text-neutral-400"
                          autoFocus
                          required
                        />
                      </div>
                    </div>

                    <button 
                      type="submit"
                      disabled={loading}
                      className="w-full bg-[#162839] hover:bg-[#253e56] text-white py-3 rounded-xl text-sm font-bold uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Finding Account...
                        </>
                      ) : (
                        <>
                          <KeyRound className="w-4 h-4" />
                          Send Verification Code
                        </>
                      )}
                    </button>

                    <div className="text-center pt-2">
                      <Link 
                        to="/login"
                        className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#006397] hover:underline"
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
                      <h2 className="text-[19px] font-bold text-[#162839] leading-snug">Enter Verification Code</h2>
                      <p className="text-[13px] text-neutral-500 mt-1">
                        We generated a 6-digit code for <strong className="text-[#162839]">@{username}</strong> ({maskedEmail}).
                      </p>
                    </div>

                    {/* Simulation / Demo Code Helper Banner */}
                    {generatedCode && (
                      <div className="p-3.5 bg-sky-50/80 border border-sky-200 rounded-xl space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-sky-800 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-sky-600" />
                            Your 6-Digit Reset PIN
                          </span>
                          <button
                            type="button"
                            onClick={handleCopyCode}
                            className="text-[11px] font-bold text-sky-700 hover:text-sky-900 flex items-center gap-1"
                          >
                            {codeCopied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                            {codeCopied ? 'Copied' : 'Copy'}
                          </button>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <code className="text-[20px] font-mono font-bold tracking-[0.3em] text-[#006397] bg-white px-3 py-1 rounded border border-sky-200 shadow-inner">
                            {generatedCode}
                          </code>
                          <button
                            type="button"
                            onClick={handleAutoFillCode}
                            className="px-3 py-1 bg-[#006397] text-white text-[12px] font-bold rounded-lg hover:bg-[#004f7a] transition-all whitespace-nowrap shadow-sm"
                          >
                            Auto-fill
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Code Input */}
                    <div className="space-y-1.5">
                      <label className="block text-[13px] font-bold text-[#191c1d]" htmlFor="code">
                        6-Digit Security Code
                      </label>
                      <input 
                        id="code"
                        type="text"
                        maxLength={6}
                        value={code}
                        onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ''))}
                        placeholder="••••••"
                        className="w-full text-center tracking-[0.5em] text-[22px] font-mono font-bold py-3 bg-[#f8f9fa] border border-[#c4c6cd] rounded-xl focus:border-[#006397] focus:ring-2 focus:ring-[#5cb8fd] outline-none transition-all"
                        autoFocus
                        required
                      />
                    </div>

                    <button 
                      type="submit"
                      disabled={loading || code.length !== 6}
                      className="w-full bg-[#162839] hover:bg-[#253e56] text-white py-3 rounded-xl text-sm font-bold uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Verifying Code...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          Verify & Continue
                        </>
                      )}
                    </button>

                    <div className="flex items-center justify-between pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setStep('IDENTIFY');
                          setErrorMessage('');
                        }}
                        className="text-[12px] font-medium text-neutral-500 hover:text-neutral-800 flex items-center gap-1"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        Back
                      </button>

                      <button
                        type="button"
                        disabled={resendCooldown > 0 || loading}
                        onClick={handleResendCode}
                        className="text-[12px] font-bold text-[#006397] hover:underline disabled:opacity-40 disabled:no-underline flex items-center gap-1"
                      >
                        <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
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
                      <h2 className="text-[19px] font-bold text-[#162839] leading-snug">Set New Password</h2>
                      <p className="text-[13px] text-neutral-500 mt-1">
                        Choose a strong, memorable password for your account.
                      </p>
                    </div>

                    {/* New Password */}
                    <div className="space-y-1">
                      <label className="block text-[13px] font-bold text-[#191c1d]">
                        New Password
                      </label>
                      <div className="relative group">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4 group-focus-within:text-[#006397] transition-colors" />
                        <input 
                          type={showNewPassword ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full pl-10 pr-11 py-2.5 bg-[#f8f9fa] border border-[#c4c6cd] rounded-xl focus:border-[#006397] focus:ring-2 focus:ring-[#5cb8fd] outline-none transition-all text-sm text-[#191c1d]"
                          autoFocus
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700"
                        >
                          {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>

                      {/* Password strength meter */}
                      {newPassword && (
                        <div className="pt-1 space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-neutral-500">Strength:</span>
                            <span className="font-bold text-[#162839]">{strength.label}</span>
                          </div>
                          <div className="grid grid-cols-3 gap-1.5 h-1">
                            <div className={`rounded-full ${strength.score >= 1 ? strength.color : 'bg-neutral-200'}`} />
                            <div className={`rounded-full ${strength.score >= 2 ? strength.color : 'bg-neutral-200'}`} />
                            <div className={`rounded-full ${strength.score >= 3 ? strength.color : 'bg-neutral-200'}`} />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Confirm Password */}
                    <div className="space-y-1">
                      <label className="block text-[13px] font-bold text-[#191c1d]">
                        Confirm New Password
                      </label>
                      <div className="relative group">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4 group-focus-within:text-[#006397] transition-colors" />
                        <input 
                          type={showConfirmPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full pl-10 pr-11 py-2.5 bg-[#f8f9fa] border border-[#c4c6cd] rounded-xl focus:border-[#006397] focus:ring-2 focus:ring-[#5cb8fd] outline-none transition-all text-sm text-[#191c1d]"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700"
                        >
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>

                      {confirmPassword && (
                        <div className="flex items-center gap-1.5 text-[11px] font-medium pt-0.5">
                          {newPassword === confirmPassword ? (
                            <span className="text-emerald-600 flex items-center gap-1 font-bold">
                              <Check className="w-3 h-3" /> Passwords match
                            </span>
                          ) : (
                            <span className="text-red-500 font-bold">Passwords do not match</span>
                          )}
                        </div>
                      )}
                    </div>

                    <button 
                      type="submit"
                      disabled={loading || !newPassword || newPassword !== confirmPassword}
                      className="w-full bg-[#162839] hover:bg-[#253e56] text-white py-3 rounded-xl text-sm font-bold uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Updating Password...
                        </>
                      ) : (
                        <>
                          <KeyRound className="w-4 h-4" />
                          Save New Password
                        </>
                      )}
                    </button>
                  </motion.form>
                )}

                {/* STEP 4: SUCCESS CONFIRMATION */}
                {step === 'SUCCESS' && (
                  <motion.div 
                    key="step-success"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center space-y-5 py-4"
                  >
                    <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                      <CheckCircle2 className="w-10 h-10" />
                    </div>

                    <div>
                      <h2 className="text-[22px] font-black text-[#162839] tracking-tight">Password Reset Complete!</h2>
                      <p className="text-[14px] text-neutral-600 mt-2">
                        Your password has been successfully updated. You can now log into your SanitaryFlow account.
                      </p>
                    </div>

                    <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-500 text-[12px]">
                      Redirecting to login page in <strong className="text-[#162839] font-bold">{autoRedirectSeconds}</strong> seconds...
                    </div>

                    <button 
                      type="button"
                      onClick={() => navigate('/login')}
                      className="w-full bg-[#162839] hover:bg-[#253e56] text-white py-3.5 rounded-xl text-sm font-bold uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2"
                    >
                      Sign In Now
                      <ArrowLeft className="w-4 h-4 rotate-180" />
                    </button>
                  </motion.div>
                )}

              </AnimatePresence>
            </div>
          </div>

          {/* Security footnote badge */}
          <div className="mt-6 flex justify-center opacity-75">
            <div className="bg-[#edeeef] px-4 py-3 rounded-xl border border-[#c4c6cd] flex items-center gap-3 w-full max-w-[420px]">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shrink-0 shadow-sm">
                <ShieldCheck className="text-[#162839] w-4 h-4 fill-[#162839]" />
              </div>
              <div className="flex-1">
                <p className="text-[11px] font-bold text-[#43474c] uppercase tracking-wider">Secure Credential Recovery</p>
                <p className="text-[11px] text-[#43474c] leading-tight">All reset sessions are cryptographically bound and expire in 15 minutes.</p>
              </div>
            </div>
          </div>

        </motion.div>
      </main>
    </div>
  );
}
