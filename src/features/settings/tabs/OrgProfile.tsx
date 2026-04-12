import React, { useEffect, useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { zodValidator } from '@tanstack/zod-form-adapter';
import { z } from 'zod';
import { useOrgSettings } from '../useOrgSettings';
import { supabase } from '../../../lib/supabase';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

const orgSchema = z.object({
  id: z.string().optional(),
  orgName: z.string().min(1, 'Organisation Name is required'),
  logoUrl: z.string().optional().nullable(),
  contactEmail: z.string().email('Invalid email'),
  contactPhone: z.string().min(1, 'Contact Phone is required'),
  address: z.string().min(1, 'Address is required'),
  zlaLicenseNumber: z.string().min(1, 'ZLA Licence Number is required'),
  officialWebsite: z.string().optional().nullable(),
  adoptionPortal: z.string().optional().nullable(),
});

const OrgProfile: React.FC = () => {
  const { settings, isLoading, saveSettings } = useOrgSettings();
  const [isUploading, setIsUploading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const form = useForm({
    defaultValues: {
      id: settings?.id || '',
      orgName: settings?.orgName || '',
      logoUrl: settings?.logoUrl || '',
      contactEmail: settings?.contactEmail || '',
      contactPhone: settings?.contactPhone || '',
      address: settings?.address || '',
      zlaLicenseNumber: settings?.zlaLicenseNumber || '',
      officialWebsite: settings?.officialWebsite || '',
      adoptionPortal: settings?.adoptionPortal || ''
    },
    validatorAdapter: zodValidator(),
    validators: {
      onChange: orgSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        await saveSettings(value as any);
        showToast('Settings saved successfully!', 'success');
      } catch (error) {
        console.error('Validation/Save failed:', error);
        showToast('Save failed. Check network connection.', 'error');
      }
    }
  });

  useEffect(() => {
    if (settings && !isLoading) {
      form.reset({
        id: settings.id || '',
        orgName: settings.orgName || '',
        logoUrl: settings.logoUrl || '',
        contactEmail: settings.contactEmail || '',
        contactPhone: settings.contactPhone || '',
        address: settings.address || '',
        zlaLicenseNumber: settings.zlaLicenseNumber || '',
        officialWebsite: settings.officialWebsite || '',
        adoptionPortal: settings.adoptionPortal || ''
      });
    }
  }, [settings, isLoading, form]);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setIsUploading(true);
      try {
        const file = e.target.files[0];
        const fileExt = file.name.split('.').pop();
        const filePath = `logos/primary-logo.${fileExt}`;

        const { data: existingFiles } = await supabase.storage.from('koa-attachments').list('logos');
        if (existingFiles && existingFiles.length > 0) {
          const filesToRemove = existingFiles.map(f => `logos/${f.name}`);
          await supabase.storage.from('koa-attachments').remove(filesToRemove);
        }

        const { error: uploadError } = await supabase.storage.from('koa-attachments').upload(filePath, file, { upsert: true });
        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from('koa-attachments').getPublicUrl(filePath);
        const cacheBustedUrl = `${data.publicUrl}?t=${Date.now()}`;

        form.setFieldValue('logoUrl', cacheBustedUrl);
      } catch (error) {
        console.error('Upload failed', error);
        showToast('Upload failed.', 'error');
      } finally {
        setIsUploading(false);
      }
    }
  };

  if (isLoading) return <div className="p-6 text-slate-500 font-medium flex items-center gap-2"><Loader2 className="animate-spin" size={16}/> Loading organization profile...</div>;

  return (
    <div className="relative">
      {toast && (
        <div className={`absolute top-0 right-0 p-4 rounded-lg shadow-lg flex items-center gap-2 text-white text-sm font-medium z-50 ${toast.type === 'success' ? 'bg-emerald-500' : 'bg-rose-500'}`}>
          {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          {toast.message}
        </div>
      )}
      <form onSubmit={(e) => { e.preventDefault(); e.stopPropagation(); form.handleSubmit(); }} className="space-y-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="w-48 h-48 border-2 border-dashed border-slate-300 rounded-xl flex items-center justify-center overflow-hidden bg-slate-50 shrink-0">
              <form.Subscribe selector={(state) => state.values.logoUrl} children={(logoUrl) => (
                logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                ) : (
                  <span className="text-slate-400 text-sm font-bold">No Logo</span>
                )
              )} />
            </div>
            
            <div className="flex-1 space-y-4">
              <input type="file" accept="image/*" onChange={handleLogoUpload} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-colors cursor-pointer" />
              {isUploading && <p className="text-sm font-bold text-blue-500 flex items-center gap-2"><Loader2 size={14} className="animate-spin"/> Uploading to Supabase...</p>}
              
              <div className="grid grid-cols-1 gap-4">
                <form.Field name="orgName" children={(field) => (
                  <div>
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-1">Academy Name *</label>
                    <input value={field.state.value || ''} onBlur={field.handleBlur} onChange={(e) => field.handleChange(e.target.value)} className={`block w-full border-2 rounded-lg p-2.5 bg-slate-50 outline-none font-bold text-sm transition-colors ${field.state.meta.errors.length ? 'border-red-300 focus:border-red-500' : 'border-slate-200 focus:border-blue-500'}`} />
                    {field.state.meta.errors.length > 0 && <em className="text-[10px] font-bold text-red-500 mt-1 block ml-1">{field.state.meta.errors.join(', ')}</em>}
                  </div>
                )} />
                <form.Field name="zlaLicenseNumber" children={(field) => (
                  <div>
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-1">Zoo Licence Number *</label>
                    <input value={field.state.value || ''} onBlur={field.handleBlur} onChange={(e) => field.handleChange(e.target.value)} className={`block w-full border-2 rounded-lg p-2.5 bg-slate-50 outline-none font-bold text-sm transition-colors ${field.state.meta.errors.length ? 'border-red-300 focus:border-red-500' : 'border-slate-200 focus:border-blue-500'}`} />
                    {field.state.meta.errors.length > 0 && <em className="text-[10px] font-bold text-red-500 mt-1 block ml-1">{field.state.meta.errors.join(', ')}</em>}
                  </div>
                )} />
              </div>
            </div>
          </div>

          <div className="mt-6">
            <form.Field name="address" children={(field) => (
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-1">Headquarters Address *</label>
                <textarea value={field.state.value || ''} onBlur={field.handleBlur} onChange={(e) => field.handleChange(e.target.value)} className={`block w-full border-2 rounded-lg p-2.5 bg-slate-50 outline-none font-bold text-sm transition-colors resize-none ${field.state.meta.errors.length ? 'border-red-300 focus:border-red-500' : 'border-slate-200 focus:border-blue-500'}`} rows={3} />
                {field.state.meta.errors.length > 0 && <em className="text-[10px] font-bold text-red-500 mt-1 block ml-1">{field.state.meta.errors.join(', ')}</em>}
              </div>
            )} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <form.Field name="contactEmail" children={(field) => (
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-1">Professional Email *</label>
                <input type="email" value={field.state.value || ''} onBlur={field.handleBlur} onChange={(e) => field.handleChange(e.target.value)} className={`block w-full border-2 rounded-lg p-2.5 bg-slate-50 outline-none font-bold text-sm transition-colors ${field.state.meta.errors.length ? 'border-red-300 focus:border-red-500' : 'border-slate-200 focus:border-blue-500'}`} />
                {field.state.meta.errors.length > 0 && <em className="text-[10px] font-bold text-red-500 mt-1 block ml-1">{field.state.meta.errors.join(', ')}</em>}
              </div>
            )} />
            <form.Field name="contactPhone" children={(field) => (
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-1">Academy Phone *</label>
                <input value={field.state.value || ''} onBlur={field.handleBlur} onChange={(e) => field.handleChange(e.target.value)} className={`block w-full border-2 rounded-lg p-2.5 bg-slate-50 outline-none font-bold text-sm transition-colors ${field.state.meta.errors.length ? 'border-red-300 focus:border-red-500' : 'border-slate-200 focus:border-blue-500'}`} />
                {field.state.meta.errors.length > 0 && <em className="text-[10px] font-bold text-red-500 mt-1 block ml-1">{field.state.meta.errors.join(', ')}</em>}
              </div>
            )} />
            <form.Field name="officialWebsite" children={(field) => (
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-1">Official Website</label>
                <input value={field.state.value || ''} onBlur={field.handleBlur} onChange={(e) => field.handleChange(e.target.value)} className="block w-full border-2 border-slate-200 rounded-lg p-2.5 bg-slate-50 outline-none font-bold text-sm focus:border-blue-500 transition-colors" />
              </div>
            )} />
            <form.Field name="adoptionPortal" children={(field) => (
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-1">Adoption Portal</label>
                <input value={field.state.value || ''} onBlur={field.handleBlur} onChange={(e) => field.handleChange(e.target.value)} className="block w-full border-2 border-slate-200 rounded-lg p-2.5 bg-slate-50 outline-none font-bold text-sm focus:border-blue-500 transition-colors" />
              </div>
            )} />
          </div>
        </div>

        <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]} children={([canSubmit, isSubmitting]) => (
          <button 
            type="submit" 
            disabled={!canSubmit || isSubmitting}
            className="bg-blue-600 text-white px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 shadow-lg shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all w-full md:w-auto"
          >
            {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : 'Save Changes'}
          </button>
        )} />
      </form>
    </div>
  );
};

export default OrgProfile;
