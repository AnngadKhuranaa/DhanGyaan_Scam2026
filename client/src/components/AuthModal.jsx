import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Mail, Lock, User, Phone, Eye, EyeOff,
  ArrowRight, Loader2, CheckCircle2, AlertCircle,
  ShieldCheck, TrendingUp, BarChart3, Sparkles,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';

// ─── Password strength calculator ────────────────────────────────
function getPasswordStrength(pw) {
  if (!pw) return { score: 0, label: '', color: '' };
  let score = 0;
  if (pw.length >= 6) score++;
  if (pw.length >= 10) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;

  if (score <= 1) return { score: 1, label: 'Weak', color: 'bg-rose-500' };
  if (score <= 2) return { score: 2, label: 'Fair', color: 'bg-amber-500' };
  if (score <= 3) return { score: 3, label: 'Good', color: 'bg-blue-500' };
  return { score: 4, label: 'Strong', color: 'bg-emerald-500' };
}

// ─── Reusable AuthInput ──────────────────────────────────────────
function AuthInput({
  icon: Icon, label, type = 'text', value, onChange,
  placeholder, error, success, autoFocus, children,
}) {
  const [focused, setFocused] = useState(false);

  const borderColor = error
    ? 'border-rose-400 focus-within:ring-rose-200'
    : success
    ? 'border-emerald-400 focus-within:ring-emerald-200'
    : focused
    ? 'border-brand-400 focus-within:ring-brand-500/10'
    : 'border-slate-200';

  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-[13px] font-medium text-slate-600">
          {label}
        </label>
      )}
      <div
        className={`relative flex items-center rounded-xl border ${borderColor} bg-white/80 backdrop-blur-sm px-3.5 transition-all duration-300 focus-within:ring-4 focus-within:shadow-md focus-within:shadow-brand-500/5`}
      >
        {Icon && <Icon size={16} className="shrink-0 text-slate-400" />}
        <input
          type={type}
          value={value}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className="w-full bg-transparent py-3 pl-3 pr-2 text-sm text-slate-900 outline-none placeholder:text-slate-400"
        />
        {children}
      </div>
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-1 text-xs text-rose-500"
        >
          <AlertCircle size={12} /> {error}
        </motion.p>
      )}
    </div>
  );
}

// ─── Google SVG icon ─────────────────────────────────────────────
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48">
      <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
      <path fill="#FF3D00" d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
      <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
      <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
    </svg>
  );
}

// ─── Floating elements for left panel ────────────────────────────
const floatingVariants = {
  animate: (custom) => ({
    y: [0, custom.y, 0],
    x: [0, custom.x, 0],
    rotate: [0, custom.r, 0],
    transition: {
      duration: custom.d,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  }),
};

function FloatingElements() {
  const items = useMemo(() => [
    { icon: TrendingUp, x: 8, y: -14, r: 5, d: 5, pos: 'top-16 left-8' },
    { icon: BarChart3, x: -10, y: 12, r: -3, d: 6.5, pos: 'top-32 right-10' },
    { icon: ShieldCheck, x: 6, y: -10, r: 4, d: 7, pos: 'bottom-40 left-12' },
    { icon: Sparkles, x: -8, y: 10, r: -6, d: 5.5, pos: 'bottom-24 right-8' },
  ], []);

  return items.map(({ icon: Icon, x, y, r, d, pos }, i) => (
    <motion.div
      key={i}
      custom={{ x, y, r, d }}
      variants={floatingVariants}
      animate="animate"
      className={`absolute ${pos} flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm border border-white/20`}
    >
      <Icon size={18} className="text-white/70" />
    </motion.div>
  ));
}

// ─── Toast notification ──────────────────────────────────────────
function Toast({ show, message, type, onClose }) {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(onClose, 3500);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, x: 80, scale: 0.95 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 80, scale: 0.95 }}
          className={`fixed top-5 right-5 z-[70] flex items-center gap-2.5 rounded-xl px-4 py-3 shadow-xl text-sm font-medium text-white ${
            type === 'success'
              ? 'bg-gradient-to-r from-emerald-500 to-emerald-600'
              : 'bg-gradient-to-r from-rose-500 to-rose-600'
          }`}
        >
          {type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ═════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═════════════════════════════════════════════════════════════════
export default function AuthModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const { setToken } = useAuthStore();

  // ── Form state ──
  const [isSignup, setIsSignup] = useState(false);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [shakeForm, setShakeForm] = useState(false);

  // ── Validation state ──
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // ── ESC key ──
  useEffect(() => {
    function handleKey(e) { if (e.key === 'Escape') onClose(); }
    if (isOpen) document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  // ── Helpers ──
  const showToast = useCallback((message, type = 'success') => {
    setToast({ show: true, message, type });
  }, []);

  const clearToast = useCallback(() => {
    setToast({ show: false, message: '', type: 'success' });
  }, []);

  const triggerShake = () => {
    setShakeForm(true);
    setTimeout(() => setShakeForm(false), 500);
  };

  const switchMode = () => {
    setIsSignup(!isSignup);
    setErrors({});
    setPassword('');
  };

  // ── Validation ──
  const validateLogin = () => {
    const errs = {};
    if (!identifier.trim()) errs.identifier = 'This field is required';
    if (!password) errs.password = 'Password is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateSignup = () => {
    const errs = {};
    if (!username.trim() || username.trim().length < 3) errs.username = 'At least 3 characters';
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) errs.email = 'Valid email required';
    if (!phone.trim() || phone.replace(/\D/g, '').length < 10) errs.phone = 'Valid phone number required';
    if (!password || password.length < 6) errs.password = 'At least 6 characters';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ── Login ──
  const handleLogin = async () => {
    if (!validateLogin()) { triggerShake(); return; }

    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });
      const data = await response.json();

      if (data.success) {
        localStorage.setItem('token', data.token);
        useAuthStore.setState({ user: data.user, token: data.token, isAuthenticated: true });
        showToast('Login successful!', 'success');
        setTimeout(() => { onClose(); navigate('/dashboard'); }, 800);
      } else {
        showToast(data.message || 'Invalid credentials', 'error');
        triggerShake();
      }
    } catch {
      showToast('Connection error. Please try again.', 'error');
      triggerShake();
    } finally {
      setIsLoading(false);
    }
  };

  // ── Signup ──
  const handleSignup = async () => {
    if (!validateSignup()) { triggerShake(); return; }

    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, phone, password }),
      });
      const data = await response.json();

      if (data.success) {
        showToast('Account created! You can now log in.', 'success');
        setTimeout(() => switchMode(), 1200);
      } else {
        showToast(data.message || 'User already exists', 'error');
        triggerShake();
      }
    } catch {
      showToast('Connection error. Please try again.', 'error');
      triggerShake();
    } finally {
      setIsLoading(false);
    }
  };

  // ── Enter key ──
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      isSignup ? handleSignup() : handleLogin();
    }
  };

  const passwordStrength = getPasswordStrength(password);

  if (!isOpen) return null;

  return (
    <>
      <Toast show={toast.show} message={toast.message} type={toast.type} onClose={clearToast} />

      <AnimatePresence>
        <motion.div
          key="auth-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 py-8 backdrop-blur-sm"
        >
          {/* Click outside to close */}
          <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 20 }}
            transition={{ type: 'spring', damping: 28, stiffness: 350 }}
            className="relative w-full max-w-[960px] overflow-hidden rounded-[2rem] bg-white shadow-[0_40px_120px_rgba(15,23,42,0.25)] ring-1 ring-slate-200"
          >
            {/* Close button */}
            <button
              type="button"
              onClick={onClose}
              className="absolute right-4 top-4 z-20 inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200/80 bg-white/90 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-600"
              aria-label="Close modal"
            >
              <X size={16} />
            </button>

            <div className="grid min-h-[600px] md:grid-cols-[1.05fr_0.95fr]">
              {/* ── LEFT: BRANDING PANEL ── */}
              <div className="relative hidden overflow-hidden bg-gradient-to-br from-indigo-600 via-brand-600 to-blue-500 p-10 text-white md:flex md:flex-col md:justify-between md:p-12">
                {/* Grid pattern */}
                <div className="absolute inset-0 opacity-[0.15] [background-image:linear-gradient(rgba(255,255,255,0.25)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.25)_1px,transparent_1px)] [background-size:32px_32px]" />
                {/* Radial glow */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.25),transparent_50%),radial-gradient(circle_at_80%_80%,rgba(255,255,255,0.15),transparent_40%)]" />

                {/* Floating elements */}
                <FloatingElements />

                <div className="relative z-10">
                  <div className="inline-flex items-center gap-2.5 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 backdrop-blur-sm">
                    <div className="flex h-6 w-6 items-center justify-center rounded-md bg-white/20 text-xs font-bold">ध</div>
                    <span className="text-xs font-semibold tracking-wider uppercase">धनGyaan</span>
                  </div>

                  <h2 className="mt-10 max-w-[280px] text-[2.5rem] font-bold leading-[1.15] tracking-tight">
                    Invest Smarter, Not Harder
                  </h2>
                  <p className="mt-5 max-w-xs text-[15px] leading-7 text-blue-100/90">
                    AI-powered risk insights, simulations, and smarter decisions — all in one platform.
                  </p>
                </div>

                {/* Trust badge */}
                <div className="relative z-10">
                  <div className="rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur-md">
                    <div className="flex items-center gap-3">
                      <div className="flex -space-x-2">
                        {['bg-blue-300', 'bg-indigo-300', 'bg-violet-300', 'bg-cyan-300'].map((bg, i) => (
                          <div
                            key={i}
                            className={`h-7 w-7 rounded-full ${bg} ring-2 ring-white/20 flex items-center justify-center text-[10px] font-bold text-white/80`}
                          >
                            {['A', 'R', 'S', 'P'][i]}
                          </div>
                        ))}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">1,000+ investors</p>
                        <p className="text-[11px] text-blue-200/80">Learning & growing (demo)</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-4">
                    {[
                      { icon: ShieldCheck, text: 'Secure' },
                      { icon: TrendingUp, text: 'Real-time' },
                      { icon: Sparkles, text: 'AI Powered' },
                    ].map(({ icon: Ic, text }) => (
                      <div key={text} className="flex items-center gap-1.5 text-[11px] text-blue-200/70">
                        <Ic size={12} /> {text}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ── RIGHT: FORM PANEL ── */}
              <div className="flex flex-col justify-center bg-gradient-to-br from-white/90 via-white/70 to-indigo-50/30 p-7 md:p-10 backdrop-blur-xl">
                <motion.div
                  animate={shakeForm ? { x: [0, -8, 8, -6, 6, -3, 3, 0] } : {}}
                  transition={{ duration: 0.4 }}
                  className="w-full max-w-sm mx-auto"
                  onKeyDown={handleKeyDown}
                >
                  {/* Header */}
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={isSignup ? 'signup-header' : 'login-header'}
                      initial={{ opacity: 0, y: 12, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -12, scale: 0.98 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                    >
                      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-600">
                        {isSignup ? 'Create Account' : 'Welcome Back'}
                      </p>
                      <h3 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                        {isSignup ? 'Start Your Journey' : 'Log in to your account'}
                      </h3>
                      <p className="mt-1.5 text-sm text-slate-500">
                        {isSignup
                          ? 'Set up your investor profile in seconds'
                          : 'Use email, username, or phone number'}
                      </p>
                    </motion.div>
                  </AnimatePresence>

                  {/* Form */}
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={isSignup ? 'signup-form' : 'login-form'}
                      initial={{ opacity: 0, x: isSignup ? 30 : -30, scale: 0.97 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      exit={{ opacity: 0, x: isSignup ? -30 : 30, scale: 0.97 }}
                      transition={{ type: 'spring', damping: 24, stiffness: 280, duration: 0.35 }}
                      className="mt-7 space-y-4"
                    >
                      {!isSignup ? (
                        <>
                          {/* ── LOGIN FORM ── */}
                          <AuthInput
                            icon={Mail}
                            label="Email / Username / Phone"
                            value={identifier}
                            onChange={(e) => { setIdentifier(e.target.value); setErrors(prev => ({ ...prev, identifier: '' })); }}
                            placeholder="you@example.com"
                            error={errors.identifier}
                            autoFocus
                          />
                          <AuthInput
                            icon={Lock}
                            label="Password"
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => { setPassword(e.target.value); setErrors(prev => ({ ...prev, password: '' })); }}
                            placeholder="••••••••"
                            error={errors.password}
                          >
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="shrink-0 p-1 text-slate-400 hover:text-slate-600 transition-colors"
                              tabIndex={-1}
                            >
                              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                          </AuthInput>
                        </>
                      ) : (
                        <>
                          {/* ── SIGNUP FORM ── */}
                          <AuthInput
                            icon={User}
                            label="Username"
                            value={username}
                            onChange={(e) => { setUsername(e.target.value); setErrors(prev => ({ ...prev, username: '' })); }}
                            placeholder="johndoe123"
                            error={errors.username}
                            autoFocus
                          />
                          <AuthInput
                            icon={Mail}
                            label="Email"
                            type="email"
                            value={email}
                            onChange={(e) => { setEmail(e.target.value); setErrors(prev => ({ ...prev, email: '' })); }}
                            placeholder="john@example.com"
                            error={errors.email}
                          />
                          <AuthInput
                            icon={Phone}
                            label="Phone"
                            type="tel"
                            value={phone}
                            onChange={(e) => { setPhone(e.target.value); setErrors(prev => ({ ...prev, phone: '' })); }}
                            placeholder="+91 9999999999"
                            error={errors.phone}
                          />
                          <div>
                            <AuthInput
                              icon={Lock}
                              label="Password"
                              type={showPassword ? 'text' : 'password'}
                              value={password}
                              onChange={(e) => { setPassword(e.target.value); setErrors(prev => ({ ...prev, password: '' })); }}
                              placeholder="Min. 6 characters"
                              error={errors.password}
                            >
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="shrink-0 p-1 text-slate-400 hover:text-slate-600 transition-colors"
                                tabIndex={-1}
                              >
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                              </button>
                            </AuthInput>
                            {/* Password strength */}
                            {password && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="mt-2 space-y-1.5"
                              >
                                <div className="flex gap-1">
                                  {[1, 2, 3, 4].map((seg) => (
                                    <div
                                      key={seg}
                                      className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                                        seg <= passwordStrength.score
                                          ? passwordStrength.color
                                          : 'bg-slate-200'
                                      }`}
                                    />
                                  ))}
                                </div>
                                <p className={`text-[11px] font-medium ${
                                  passwordStrength.score <= 1 ? 'text-rose-500' :
                                  passwordStrength.score <= 2 ? 'text-amber-500' :
                                  passwordStrength.score <= 3 ? 'text-blue-500' :
                                  'text-emerald-500'
                                }`}>
                                  {passwordStrength.label}
                                </p>
                              </motion.div>
                            )}
                          </div>
                        </>
                      )}

                      {/* CTA Button */}
                      <motion.button
                        type="button"
                        onClick={isSignup ? handleSignup : handleLogin}
                        disabled={isLoading}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-500 px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all duration-200 hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed"
                      >
                        {isLoading ? (
                          <Loader2 size={18} className="animate-spin" />
                        ) : (
                          <>
                            {isSignup ? 'Create Account' : 'Continue'}
                            <ArrowRight size={16} />
                          </>
                        )}
                      </motion.button>

                      {/* Divider */}
                      <div className="relative flex items-center gap-3 py-1">
                        <div className="h-px flex-1 bg-slate-200" />
                        <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">or</span>
                        <div className="h-px flex-1 bg-slate-200" />
                      </div>

                      {/* Google button (UI only) */}
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        className="inline-flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50 hover:shadow"
                      >
                        <GoogleIcon />
                        Continue with Google
                      </motion.button>

                      {/* Switch mode */}
                      <p className="pt-2 text-center text-sm text-slate-500">
                        {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
                        <button
                          type="button"
                          onClick={switchMode}
                          className="font-semibold text-brand-600 transition-colors hover:text-brand-700 hover:underline"
                        >
                          {isSignup ? 'Log in' : 'Sign up'}
                        </button>
                      </p>
                    </motion.div>
                  </AnimatePresence>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </>
  );
}
