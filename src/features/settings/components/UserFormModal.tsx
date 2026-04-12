import React, { useEffect, useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { zodValidator } from '@tanstack/zod-form-adapter';
import { X, AlertCircle, Loader2 } from 'lucide-react';
import { z } from 'zod';
import { User, UserRole } from '../../../types';
import { SignatureCapture } from '../../../components/ui/SignatureCapture';
import { supabase } from '../../../lib/supabase';
import { useAuthStore } from '../../../store/authStore';

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: User | null;
  onSave?: (data: Partial<User>) => Promise<void>;
  onAdd?: (data: { email: string; password?: string; profileData: Partial<User> }) => Promise<unknown>;
  onSuccess: () => void;
}

const userSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  role: z.nativeEnum(UserRole),
  initials: z.string().min(1, 'Initials are required').max(3, 'Initials max 3 chars'),
  password: z.string().optional(),
  pin: z.string().min(4, 'PIN must be at least 4 digits').max(6, 'PIN max 6 digits'),
});

const UserFormModal: React.FC<UserFormModalProps> = ({ isOpen, onClose, initialData, onSave, onAdd, onSuccess }) => {
  const { currentUser } = useAuthStore();
  
  const [isCapturingSignature, setIsCapturingSignature] = useState(false);
  const [currentSignature, setCurrentSignature] = useState<string | undefined>();
  const [globalError, setGlobalError] = useState<string | null>(null);

  const form = useForm({
    defaultValues: {
      name: initialData?.name || '',
      email: initialData?.email || '',
      role: initialData?.role || UserRole.VOLUNTEER,
      initials: initialData?.initials || '',
      password: '',
      pin: initialData?.pin || '',
    },
    validatorAdapter: zodValidator(),
    validators: {
      onChange: userSchema,
    },
    onSubmit: async ({ value }) => {
      if (!navigator.onLine) {
        setGlobalError("You must be connected to the internet to perform this action.");
        return;
      }

      setGlobalError(null);
      
      try {
        let integritySeal = undefined;
        if (currentSignature) {
          const recordId = initialData?.id || 'NEW_RECORD';
          const timestamp = new Date().toISOString();
          const userId = currentUser?.id || 'UNKNOWN_USER';
          const dataToHash = `${recordId}${timestamp}${userId}${currentSignature}`;
          const encoder = new TextEncoder();
          const dataBuffer = encoder.encode(dataToHash);
          const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
          const hashArray = Array.from(new Uint8Array(hashBuffer));
          integritySeal = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        }

        const cleanData = {
          name: value.name,
          email: value.email,
          role: value.role,
          initials: value.initials.toUpperCase(),
          pin: value.pin,
          password: value.password || undefined,
          signature_data: currentSignature,
          integrity_seal: integritySeal
        };

        if (initialData && onSave) {
          await onSave(cleanData);
          onSuccess();
          onClose();
        } else {
          if (!cleanData.password) throw new Error('Password is required for new accounts.');
          
          const profileData = {
            name: cleanData.name,
            role: cleanData.role,
            initials: cleanData.initials,
            pin: cleanData.pin,
            signature_data: cleanData.signature_data,
            integrity_seal: cleanData.integrity_seal
          };

          if (onAdd) {
            await onAdd({ email: cleanData.email, password: cleanData.password, profileData });
          } else {
            const { data: response, error } = await supabase.functions.invoke('create-staff-account', {
              body: { email: cleanData.email, password: cleanData.password, profileData: profileData }
            });

            if (error) throw new Error(`Network Error: ${error.message}`);
            if (response?.error) throw new Error(response.error);
          }

          onSuccess();
          onClose();
        }
      } catch (error: unknown) {
        setGlobalError(error instanceof Error ? error.message : "An unexpected error occurred.");
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  });

  useEffect(() => {
    setGlobalError(null);
    if (initialData) {
      form.reset({
        name: initialData.name,
        email: initialData.email,
        role: initialData.role,
        initials: initialData.initials,
        pin: initialData.pin,
        password: '',
      });
      setCurrentSignature(initialData.signature_data);
    } else {
      form.reset({ name: '', email: '', role: UserRole.VOLUNTEER, initials: '', password: '', pin: '' });
      setCurrentSignature(undefined);
    }
  }, [initialData, form, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4 overflow-y-auto">
      <div className="bg-white rounded-[2rem] w-full max-w-4xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 my-8">
        
        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">{initialData ? 'Edit Staff Member' : 'Add Staff Member'}</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        {globalError && (
          <div className="mx-8 mt-8 p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3">
            <AlertCircle size={20} className="text-rose-500 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-black text-rose-800 uppercase tracking-widest">Action Failed</h4>
              <p className="text-sm font-medium text-rose-600 mt-1">{globalError}</p>
            </div>
          </div>
        )}

        <form onSubmit={(e) => { e.preventDefault(); e.stopPropagation(); form.handleSubmit(); }} className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <h4 className="text-xs font-black text-slate-300 uppercase tracking-widest border-b border-slate-100 pb-2">Account Details</h4>
              <form.Field name="name" children={(field) => (
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Full Name *</label>
                  <input value={field.state.value} onBlur={field.handleBlur} onChange={(e) => field.handleChange(e.target.value)} className={`w-full p-4 bg-slate-50 border-2 rounded-2xl outline-none transition-all font-bold text-slate-900 ${field.state.meta.errors.length ? 'border-red-300 focus:border-red-500' : 'border-slate-100 focus:border-indigo-500'}`} placeholder="e.g. John Smith" />
                  {field.state.meta.errors.length > 0 && <em className="text-[10px] font-bold text-red-500 mt-1 block ml-1">{field.state.meta.errors.join(', ')}</em>}
                </div>
              )} />
              <form.Field name="email" children={(field) => (
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Email Address *</label>
                  <input value={field.state.value} onBlur={field.handleBlur} onChange={(e) => field.handleChange(e.target.value)} className={`w-full p-4 bg-slate-50 border-2 rounded-2xl outline-none transition-all font-bold text-slate-900 ${field.state.meta.errors.length ? 'border-red-300 focus:border-red-500' : 'border-slate-100 focus:border-indigo-500'}`} placeholder="e.g. john@kentowlacademy.com" />
                  {field.state.meta.errors.length > 0 && <em className="text-[10px] font-bold text-red-500 mt-1 block ml-1">{field.state.meta.errors.join(', ')}</em>}
                </div>
              )} />
              <form.Field name="initials" children={(field) => (
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Initials (Max 3) *</label>
                  <input value={field.state.value} onBlur={field.handleBlur} onChange={(e) => field.handleChange(e.target.value)} className={`w-full p-4 bg-slate-50 border-2 rounded-2xl outline-none transition-all font-bold text-slate-900 uppercase ${field.state.meta.errors.length ? 'border-red-300 focus:border-red-500' : 'border-slate-100 focus:border-indigo-500'}`} placeholder="JS" />
                  {field.state.meta.errors.length > 0 && <em className="text-[10px] font-bold text-red-500 mt-1 block ml-1">{field.state.meta.errors.join(', ')}</em>}
                </div>
              )} />
            </div>

            <div className="space-y-6">
              <h4 className="text-xs font-black text-slate-300 uppercase tracking-widest border-b border-slate-100 pb-2">Access & Security</h4>
              <form.Field name="role" children={(field) => (
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">System Role *</label>
                  <select value={field.state.value} onBlur={field.handleBlur} onChange={(e) => field.handleChange(e.target.value as UserRole)} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 outline-none transition-all font-bold text-slate-900 appearance-none cursor-pointer">
                    <option value={UserRole.VOLUNTEER}>Volunteer</option>
                    <option value={UserRole.KEEPER}>Keeper</option>
                    <option value={UserRole.SENIOR_KEEPER}>Senior Keeper</option>
                    <option value={UserRole.ADMIN}>Administrator</option>
                    <option value={UserRole.OWNER}>Owner</option>
                  </select>
                </div>
              )} />
              <form.Field name="pin" children={(field) => (
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Daily PIN (Up to 6 Digits) *</label>
                  <input type="password" value={field.state.value} onBlur={field.handleBlur} onChange={(e) => field.handleChange(e.target.value)} maxLength={6} className={`w-full p-4 bg-slate-50 border-2 rounded-2xl outline-none transition-all font-bold text-slate-900 tracking-[0.5em] ${field.state.meta.errors.length ? 'border-red-300 focus:border-red-500' : 'border-slate-100 focus:border-indigo-500'}`} placeholder="••••••" />
                  {field.state.meta.errors.length > 0 && <em className="text-[10px] font-bold text-red-500 mt-1 block ml-1">{field.state.meta.errors.join(', ')}</em>}
                </div>
              )} />
              {!initialData && (
                <form.Field name="password" children={(field) => (
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Login Password *</label>
                    <input type="password" value={field.state.value || ''} onBlur={field.handleBlur} onChange={(e) => field.handleChange(e.target.value)} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 outline-none transition-all font-bold text-slate-900" placeholder="••••••••" />
                  </div>
                )} />
              )}
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-slate-100">
            <div className="max-w-md">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Digital Signature</label>
              {isCapturingSignature ? (
                <SignatureCapture 
                  recordId={initialData?.id || 'new-user'}
                  onSave={(base64) => { 
                    setCurrentSignature(base64); 
                    setIsCapturingSignature(false); 
                  }} 
                  onCancel={() => setIsCapturingSignature(false)} 
                  initialSignature={currentSignature} 
                />
              ) : (
                <div className="space-y-3">
                  {currentSignature && <div className="p-4 border-2 border-slate-100 rounded-2xl bg-white"><img src={currentSignature} alt="Signature" className="h-16 mx-auto" /></div>}
                  <button type="button" onClick={() => setIsCapturingSignature(true)} className="w-full p-4 border-2 border-dashed border-slate-200 rounded-2xl font-black uppercase text-[10px] tracking-widest text-slate-500 hover:bg-slate-50 transition-all">
                    {currentSignature ? 'Update Signature' : 'Draw Digital Signature'}
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="mt-8 pt-4 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-8 py-4 border-2 border-slate-100 rounded-2xl font-black uppercase text-[10px] tracking-widest text-slate-500 hover:bg-slate-50 transition-all">Cancel</button>
            <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]} children={([canSubmit, isSubmitting]) => (
              <button 
                type="submit" 
                disabled={!canSubmit || isSubmitting} 
                className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed min-w-[180px] flex items-center justify-center gap-2"
              >
                {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : (initialData ? 'Update Profile' : 'Create Account')}
              </button>
            )} />
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserFormModal;
