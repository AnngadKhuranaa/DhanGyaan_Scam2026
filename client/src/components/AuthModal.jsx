import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { PlayCircle } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { getErrorMessage, getFieldErrors } from '../lib/api';
import { loginSchema, registerSchema } from '../lib/schemas';
import { Modal } from './ui/Overlay';
import Field from './ui/Field';
import { Spinner } from './ui/States';

/** Copy server-side field errors (e.g. "Username is already registered") onto the form. */
function applyServerErrors(error, setError, fields) {
  const fieldErrors = getFieldErrors(error);
  let applied = false;
  for (const [field, message] of Object.entries(fieldErrors)) {
    if (fields.includes(field)) {
      setError(field, { message });
      applied = true;
    }
  }
  return applied;
}

function LoginForm({ onDone }) {
  const login = useAuthStore((s) => s.login);
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (values) => {
    try {
      const user = await login(values.identifier, values.password);
      toast.success(`Welcome back, ${user.username}`);
      onDone();
    } catch (error) {
      if (!applyServerErrors(error, setError, ['identifier', 'password'])) setError('root', { message: getErrorMessage(error) });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <Field label="Username or email" autoComplete="username" error={errors.identifier?.message} {...register('identifier')} />
      <Field label="Password" type="password" autoComplete="current-password" error={errors.password?.message} {...register('password')} />
      {errors.root && <p className="field-error" role="alert">{errors.root.message}</p>}
      <button type="submit" className="btn-primary w-full" disabled={isSubmitting}>
        {isSubmitting && <Spinner size={14} />} Log in
      </button>
    </form>
  );
}

function RegisterForm({ onDone }) {
  const registerUser = useAuthStore((s) => s.register);
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(registerSchema) });

  const onSubmit = async (values) => {
    try {
      const user = await registerUser({ ...values, phone: values.phone || undefined });
      toast.success(`Account created. You start with ${new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(user.balance)} of virtual cash.`);
      onDone();
    } catch (error) {
      if (!applyServerErrors(error, setError, ['username', 'email', 'phone', 'password'])) {
        const message = getErrorMessage(error);
        // 409s name the field in the message, e.g. "Email is already registered".
        const field = /^username/i.test(message) ? 'username' : /^email/i.test(message) ? 'email' : /^phone/i.test(message) ? 'phone' : 'root';
        setError(field, { message });
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <Field label="Username" autoComplete="username" error={errors.username?.message} {...register('username')} />
      <Field label="Email" type="email" autoComplete="email" error={errors.email?.message} {...register('email')} />
      <Field label="Phone (optional)" type="tel" autoComplete="tel" error={errors.phone?.message} {...register('phone')} />
      <Field
        label="Password"
        type="password"
        autoComplete="new-password"
        hint="At least 8 characters with a letter and a number"
        error={errors.password?.message}
        {...register('password')}
      />
      {errors.root && <p className="field-error" role="alert">{errors.root.message}</p>}
      <button type="submit" className="btn-primary w-full" disabled={isSubmitting}>
        {isSubmitting && <Spinner size={14} />} Create account
      </button>
    </form>
  );
}

export default function AuthModal({ open, mode: initialMode = 'login', onClose }) {
  const [mode, setMode] = useState(initialMode);
  const [demoLoading, setDemoLoading] = useState(false);
  const demoLogin = useAuthStore((s) => s.demoLogin);
  const navigate = useNavigate();

  const done = () => {
    onClose();
    navigate('/dashboard');
  };

  const tryDemo = async () => {
    setDemoLoading(true);
    try {
      await demoLogin();
      toast.success('Logged in to the shared demo account');
      done();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={mode === 'login' ? 'Log in to DhanGyaan' : 'Create your free account'} size="max-w-md">
      <div className="tab-list mb-5 w-full" role="tablist" aria-label="Authentication mode">
        {[['login', 'Log in'], ['register', 'Sign up']].map(([value, label]) => (
          <button key={value} type="button" role="tab" aria-selected={mode === value} onClick={() => setMode(value)} className={`tab flex-1 ${mode === value ? 'tab-active' : ''}`}>
            {label}
          </button>
        ))}
      </div>

      {mode === 'login' ? <LoginForm onDone={done} /> : <RegisterForm onDone={done} />}

      <div className="my-5 flex items-center gap-3 text-xs text-slate-500">
        <span className="h-px flex-1 bg-slate-200 dark:bg-slate-800" /> or <span className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
      </div>
      <button type="button" className="btn-secondary w-full" onClick={tryDemo} disabled={demoLoading}>
        {demoLoading ? <Spinner size={14} /> : <PlayCircle size={16} aria-hidden="true" />} Try the demo account
      </button>
      <p className="muted mt-3 text-center text-xs">Paper trading only. No real money is involved.</p>
    </Modal>
  );
}
