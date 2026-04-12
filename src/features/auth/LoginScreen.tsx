import React, { useState, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useForm } from '@tanstack/react-form';
import { zodValidator } from '@tanstack/zod-form-adapter';
import { z } from 'zod';
import { useAuthStore } from '../../store/authStore';
import { Loader2, ShieldCheck, Mail, Lock, Bird } from 'lucide-react';
import { motion } from 'motion/react';

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z.string().min(1, 'Secure PIN / Password is required')
});

const LoginScreen: React.FC = () => {
  const { login, isLoading, currentUser } = useAuthStore();
  const navigate = useNavigate();
  const [localError, setLocalError] = useState<string | null>(null);

  // Auto-redirect if they hit the /login URL but are already authenticated
  useEffect(() => {
    if (currentUser) {
      navigate({ to: '/dashboard', replace: true });
    }
  }, [currentUser, navigate]);

  const form = useForm({
    defaultValues: {
      email: '',
      password: ''
    },
    validatorAdapter: zodValidator(),
    validators: {
      onChange: loginSchema,
    },
    onSubmit: async ({ value }) => {
      setLocalError(null);
      try {
        await login(value.email, value.password);
        // Explicitly push the router to the dashboard upon success
        navigate({ to: '/dashboard', replace: true });
      } catch (err: unknown) {
        setLocalError(err instanceof Error ? err.message : 'Authentication failed. Please check your credentials.');
      }
    }
  });

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 relative overflow-hidden">
      {/* Background Ambient Glow */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-900/20 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-900/20 rounded-full blur-[120px]" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md p-8 relative z-10"
      >
        <div className="bg-slate-900/60 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-10 shadow-2xl">
          <div className="flex flex-col items-center mb-10">
            <div className="w-20 h-20 bg-emerald-500/10 rounded-3xl flex items-center justify-center mb-6 border border-emerald-500/20 shadow-inner">
              <Bird size={40} className="text-emerald-500" />
            </div>
            <h1 className="text-3xl font-black text-white uppercase tracking-tighter text-center">
              KOA Manager
            </h1>
            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em] mt-2">
              Authentication Gateway
            </p>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); e.stopPropagation(); form.handleSubmit(); }} className="space-y-6">
            <form.Field name="email" children={(field) => (
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  Staff Email
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-emerald-500 transition-colors">
                    <Mail size={18} />
                  </div>
                  <input
                    type="email"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="name@kentowlacademy.com"
                    className={`block w-full pl-12 pr-4 py-4 bg-slate-950/50 border rounded-2xl text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all ${field.state.meta.errors.length ? 'border-rose-500/50 focus:border-rose-500/50' : 'border-white/5 focus:border-emerald-500/50'}`}
                  />
                </div>
                {field.state.meta.errors.length > 0 && <em className="text-[10px] font-bold text-rose-500 mt-1 block ml-1">{field.state.meta.errors.join(', ')}</em>}
              </div>
            )} />

            <form.Field name="password" children={(field) => (
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  Secure PIN
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-emerald-500 transition-colors">
                    <Lock size={18} />
                  </div>
                  <input
                    type="password"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="••••••••"
                    className={`block w-full pl-12 pr-4 py-4 bg-slate-950/50 border rounded-2xl text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all tracking-widest ${field.state.meta.errors.length ? 'border-rose-500/50 focus:border-rose-500/50' : 'border-white/5 focus:border-emerald-500/50'}`}
                  />
                </div>
                {field.state.meta.errors.length > 0 && <em className="text-[10px] font-bold text-rose-500 mt-1 block ml-1">{field.state.meta.errors.join(', ')}</em>}
              </div>
            )} />

            {localError && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-500 text-xs font-bold text-center"
              >
                {localError}
              </motion.div>
            )}

            <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]} children={([canSubmit, isSubmitting]) => {
              // We combine the form's local submission state with your global Auth Store loading state
              const isBusy = isSubmitting || isLoading;
              return (
                <button
                  type="submit"
                  disabled={!canSubmit || isBusy}
                  className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-900/50 disabled:text-emerald-500/50 disabled:cursor-not-allowed text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-lg shadow-emerald-900/20 active:scale-[0.98] flex items-center justify-center gap-3"
                >
                  {isBusy ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={18} />
                      Sign In
                    </>
                  )}
                </button>
              );
            }} />
          </form>

          {/* Network Awareness Indicator */}
          <div className="mt-8 flex items-center justify-center gap-2">
            <div className={`w-2 h-2 rounded-full ${navigator.onLine ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]'}`}></div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              {navigator.onLine ? 'Live Server Connected' : 'Offline Failover Active'}
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginScreen;
