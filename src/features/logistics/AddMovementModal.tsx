import React from 'react';
import { useForm } from '@tanstack/react-form';
import { zodValidator } from '@tanstack/zod-form-adapter';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { MovementType } from '../../types';
import { useMovementsData } from './useMovementsData';
import { useAnimalsData } from '../animals/useAnimalsData';

const schema = z.object({
  animal_id: z.string().min(1, 'Animal is required'),
  log_date: z.string().min(1, 'Date is required'),
  movement_type: z.nativeEnum(MovementType),
  source_location: z.string().min(1, 'Source is required'),
  destination_location: z.string().min(1, 'Destination is required'),
  notes: z.string().optional(),
});

interface Props {
  onClose: () => void;
}

export default function AddMovementModal({ onClose }: Props) {
  const { addMovement } = useMovementsData();
  const { animals } = useAnimalsData();
  
  const form = useForm({
    defaultValues: {
      animal_id: '',
      log_date: new Date().toISOString().split('T')[0],
      movement_type: MovementType.TRANSFER,
      source_location: '',
      destination_location: '',
      notes: ''
    },
    validatorAdapter: zodValidator(),
    validators: {
      onChange: schema,
    },
    onSubmit: async ({ value }) => {
      try {
        const animal = animals.find(a => a.id === value.animal_id);
        await addMovement({
          ...value,
          animalName: animal?.name || 'Unknown'
        });
        onClose();
      } catch (error) {
        console.error("Failed to save movement:", error);
        alert("Failed to save record.");
      }
    }
  });

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 border-2 border-slate-200 animate-in zoom-in-95 duration-200">
        <h2 className="text-xl font-bold text-slate-900 uppercase tracking-tight mb-6">Record Internal Movement</h2>
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
            <form.Field name="log_date" children={(field) => (
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Date *</label>
                <input type="date" value={field.state.value} onBlur={field.handleBlur} onChange={(e) => field.handleChange(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-emerald-500 transition-colors" />
              </div>
            )} />
            <form.Field name="movement_type" children={(field) => (
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Type *</label>
                <select value={field.state.value} onBlur={field.handleBlur} onChange={(e) => field.handleChange(e.target.value as MovementType)} className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-emerald-500 transition-colors">
                  {Object.values(MovementType).map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            )} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <form.Field name="source_location" children={(field) => (
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">From *</label>
                <input value={field.state.value} onBlur={field.handleBlur} onChange={(e) => field.handleChange(e.target.value)} className={`w-full px-4 py-3 bg-slate-50 border-2 rounded-xl text-sm font-bold transition-colors outline-none ${field.state.meta.errors.length ? 'border-red-300 focus:border-red-500' : 'border-slate-200 focus:border-emerald-500'}`} placeholder="Aviary 1" />
              </div>
            )} />
            <form.Field name="destination_location" children={(field) => (
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">To *</label>
                <input value={field.state.value} onBlur={field.handleBlur} onChange={(e) => field.handleChange(e.target.value)} className={`w-full px-4 py-3 bg-slate-50 border-2 rounded-xl text-sm font-bold transition-colors outline-none ${field.state.meta.errors.length ? 'border-red-300 focus:border-red-500' : 'border-slate-200 focus:border-emerald-500'}`} placeholder="Aviary 4" />
              </div>
            )} />
          </div>

          <form.Field name="notes" children={(field) => (
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Notes</label>
              <textarea value={field.state.value || ''} onBlur={field.handleBlur} onChange={(e) => field.handleChange(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-bold h-24 outline-none focus:border-emerald-500 transition-colors resize-none" placeholder="Reason for move..." />
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
                {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : 'Commit Move'}
              </button>
            )} />
          </div>
        </form>
      </div>
    </div>
  );
}
