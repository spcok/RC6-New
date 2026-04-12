import React from 'react';
import { useForm } from '@tanstack/react-form';
import { zodValidator } from '@tanstack/zod-form-adapter';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { TransferType, TransferStatus } from '../../types';
import { useTransfersData } from './useTransfersData';
import { useAnimalsData } from '../animals/useAnimalsData';

const schema = z.object({
  animal_id: z.string().min(1, 'Animal is required'),
  transfer_type: z.nativeEnum(TransferType),
  date: z.string().min(1, 'Date is required'),
  institution: z.string().min(1, 'Institution is required'),
  transport_method: z.string().min(1, 'Transport method is required'),
  cites_article_10_ref: z.string().min(1, 'CITES/A10 ref is required'),
  status: z.nativeEnum(TransferStatus),
  notes: z.string().optional(),
});

interface Props {
  onClose: () => void;
}

export default function AddTransferModal({ onClose }: Props) {
  const { addTransfer } = useTransfersData();
  const { animals } = useAnimalsData();
  
  const form = useForm({
    defaultValues: {
      animal_id: '',
      transfer_type: TransferType.ARRIVAL,
      date: new Date().toISOString().split('T')[0],
      institution: '',
      transport_method: '',
      cites_article_10_ref: '',
      status: TransferStatus.PENDING,
      notes: ''
    },
    validatorAdapter: zodValidator(),
    validators: {
      onChange: schema,
    },
    onSubmit: async ({ value }) => {
      try {
        const animal = animals.find(a => a.id === value.animal_id);
        await addTransfer({
          ...value,
          animal_name: animal?.name || 'Unknown'
        });
        onClose();
      } catch (error) {
        console.error("Failed to save transfer:", error);
        alert("Failed to save transfer record.");
      }
    }
  });

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 border-2 border-slate-200 animate-in zoom-in-95 duration-200">
        <h2 className="text-xl font-bold text-slate-900 uppercase tracking-tight mb-6">Record External Transfer</h2>
        <form onSubmit={(e) => { e.preventDefault(); e.stopPropagation(); form.handleSubmit(); }} className="space-y-4">
          <form.Field name="animal_id" children={(field) => (
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Subject Animal *</label>
              <select value={field.state.value} onBlur={field.handleBlur} onChange={(e) => field.handleChange(e.target.value)} className={`w-full px-4 py-3 bg-slate-50 border-2 rounded-xl text-sm font-bold transition-colors outline-none ${field.state.meta.errors.length ? 'border-red-300 focus:border-red-500' : 'border-slate-200 focus:border-emerald-500'}`}>
                <option value="">-- Choose Animal --</option>
                {(animals || []).map(a => <option key={a.id} value={a.id}>{a.name} ({a.species})</option>)}
              </select>
              {field.state.meta.errors.length > 0 && <p className="text-red-500 text-[10px] font-bold mt-1 ml-1">{field.state.meta.errors.join(', ')}</p>}
            </div>
          )} />
          
          <div className="grid grid-cols-2 gap-4">
            <form.Field name="transfer_type" children={(field) => (
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Type *</label>
                <select value={field.state.value} onBlur={field.handleBlur} onChange={(e) => field.handleChange(e.target.value as TransferType)} className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-emerald-500 transition-colors">
                  {Object.values(TransferType).map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            )} />
            <form.Field name="date" children={(field) => (
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Date *</label>
                <input type="date" value={field.state.value} onBlur={field.handleBlur} onChange={(e) => field.handleChange(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-emerald-500 transition-colors" />
              </div>
            )} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <form.Field name="institution" children={(field) => (
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Institution *</label>
                <input value={field.state.value} onBlur={field.handleBlur} onChange={(e) => field.handleChange(e.target.value)} className={`w-full px-4 py-3 bg-slate-50 border-2 rounded-xl text-sm font-bold transition-colors outline-none ${field.state.meta.errors.length ? 'border-red-300 focus:border-red-500' : 'border-slate-200 focus:border-emerald-500'}`} placeholder="e.g. London Zoo" />
              </div>
            )} />
            <form.Field name="transport_method" children={(field) => (
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Transport *</label>
                <input value={field.state.value} onBlur={field.handleBlur} onChange={(e) => field.handleChange(e.target.value)} className={`w-full px-4 py-3 bg-slate-50 border-2 rounded-xl text-sm font-bold transition-colors outline-none ${field.state.meta.errors.length ? 'border-red-300 focus:border-red-500' : 'border-slate-200 focus:border-emerald-500'}`} placeholder="e.g. Flight, Van" />
              </div>
            )} />
          </div>

          <form.Field name="cites_article_10_ref" children={(field) => (
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">CITES / A10 Ref *</label>
              <input value={field.state.value} onBlur={field.handleBlur} onChange={(e) => field.handleChange(e.target.value)} className={`w-full px-4 py-3 bg-slate-50 border-2 rounded-xl text-sm font-bold transition-colors outline-none ${field.state.meta.errors.length ? 'border-red-300 focus:border-red-500' : 'border-slate-200 focus:border-emerald-500'}`} placeholder="Reference Number" />
            </div>
          )} />

          <form.Field name="status" children={(field) => (
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status *</label>
              <select value={field.state.value} onBlur={field.handleBlur} onChange={(e) => field.handleChange(e.target.value as TransferStatus)} className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-emerald-500 transition-colors">
                {Object.values(TransferStatus).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          )} />

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 rounded-xl font-black uppercase text-[10px] tracking-widest text-slate-600 transition-colors">Cancel</button>
            <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]} children={([canSubmit, isSubmitting]) => (
              <button 
                type="submit" 
                disabled={!canSubmit || isSubmitting} 
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 disabled:opacity-50 transition-colors shadow-lg shadow-emerald-200"
              >
                {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : 'Commit Transfer'}
              </button>
            )} />
          </div>
        </form>
      </div>
    </div>
  );
}
