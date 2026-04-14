import React from 'react';
import { Animal } from '../../types';
import { useNavigate } from '@tanstack/react-router';
import { useForm } from '@tanstack/react-form';
import { zodValidator } from '@tanstack/zod-form-adapter';
import { z } from 'zod';
import { Loader2, X } from 'lucide-react';
import { animalsCollection } from '@/src/lib/db';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  animal: Animal;
}

const archiveSchema = z.object({
  archiveType: z.string().min(1, 'Archive type is required'),
  destination: z.string().optional(),
  date: z.string().optional(),
  notes: z.string().optional(),
  vet: z.string().optional(),
  justification: z.string().optional(),
  cause: z.string().optional(),
  necropsy: z.string().optional(),
});

export const ArchiveAnimalModal: React.FC<Props> = ({ isOpen, onClose, animal }) => {
  const navigate = useNavigate();

  const form = useForm({
    defaultValues: {
      archiveType: '',
      destination: '',
      date: new Date().toISOString().split('T')[0],
      notes: '',
      vet: '',
      justification: '',
      cause: '',
      necropsy: '',
    },
    validatorAdapter: zodValidator(),
    validators: {
      onChange: archiveSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        const reason = Object.entries(value)
          .filter(([k, v]) => k !== 'archiveType' && k !== 'date' && v)
          .map(([k, v]) => `${k}: ${v}`)
          .join(', ');
        
        const archiveDate = value.date || new Date().toISOString();
        
        // Converted to camelCase to match local Offline Engine requirements
        const updatePayload: Partial<Animal> = {
          archived: true,
          archiveReason: reason,
          archivedAt: new Date().toISOString(),
          archiveType: value.archiveType,
          dispositionStatus: value.archiveType,
          dispositionDate: archiveDate
        };

        if (value.archiveType === 'Death' || value.archiveType === 'Euthanasia') {
          updatePayload.dateOfDeath = archiveDate;
        }

        // CRITICAL OFFLINE FIX: Route through local DB with safe updater callback
        await animalsCollection.update(animal.id, (old: Animal) => ({ ...old, ...updatePayload }));

        // Navigate back to animals list to reflect the UI change
        navigate({ to: '/animals' });
        onClose();
      } catch (err: unknown) {
        console.error('Archive error:', err);
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
        window.alert(`Failed to archive animal: ${errorMessage}`);
      }
    }
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 border-2 border-slate-200 animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900 uppercase tracking-tight">Archive Record</h2>
            <p className="text-xs font-bold text-rose-600 uppercase tracking-widest mt-1">{animal.name}</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors"><X size={20} /></button>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); e.stopPropagation(); form.handleSubmit(); }} className="space-y-4">
          <form.Field name="archiveType" children={(field) => (
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Archive Type *</label>
              <select className={`w-full px-4 py-3 bg-slate-50 border-2 rounded-xl text-sm font-bold outline-none transition-colors ${field.state.meta.errors.length ? 'border-red-300 focus:border-red-500' : 'border-slate-200 focus:border-rose-500'}`} onBlur={field.handleBlur} onChange={(e) => field.handleChange(e.target.value)} value={field.state.value}>
                <option value="">Select Archive Type</option>
                <option value="Disposition">Disposition</option>
                <option value="Death">Death</option>
                <option value="Euthanasia">Euthanasia</option>
                <option value="Missing">Missing</option>
                <option value="Stolen">Stolen</option>
              </select>
            </div>
          )} />
          
          <form.Subscribe selector={(state) => state.values.archiveType} children={(archiveType) => (
            <div className="space-y-4">
              {archiveType === 'Disposition' && (
                <>
                  <form.Field name="destination" children={(field) => (
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Destination Institution</label>
                      <input className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-rose-500" onBlur={field.handleBlur} value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} />
                    </div>
                  )} />
                  <form.Field name="date" children={(field) => (
                     <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Transfer Date</label>
                      <input type="date" className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-rose-500" onBlur={field.handleBlur} value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} />
                    </div>
                  )} />
                  <form.Field name="notes" children={(field) => (
                     <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Notes</label>
                      <textarea className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-rose-500 resize-none h-24" onBlur={field.handleBlur} value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} />
                    </div>
                  )} />
                </>
              )}
              {archiveType === 'Euthanasia' && (
                <>
                  <form.Field name="vet" children={(field) => (
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Authorizing Vet</label>
                      <input className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-rose-500" onBlur={field.handleBlur} value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} />
                    </div>
                  )} />
                  <form.Field name="justification" children={(field) => (
                     <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Medical Justification</label>
                      <input className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-rose-500" onBlur={field.handleBlur} value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} />
                    </div>
                  )} />
                  <form.Field name="date" children={(field) => (
                     <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Date</label>
                      <input type="date" className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-rose-500" onBlur={field.handleBlur} value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} />
                    </div>
                  )} />
                </>
              )}
              {archiveType === 'Death' && (
                <>
                  <form.Field name="cause" children={(field) => (
                     <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Suspected Cause</label>
                      <input className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-rose-500" onBlur={field.handleBlur} value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} />
                    </div>
                  )} />
                  <form.Field name="necropsy" children={(field) => (
                     <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Necropsy Required?</label>
                      <select className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-rose-500" onBlur={field.handleBlur} value={field.state.value} onChange={(e) => field.handleChange(e.target.value)}>
                        <option value="">Select Option</option>
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </select>
                    </div>
                  )} />
                  <form.Field name="date" children={(field) => (
                     <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Date</label>
                      <input type="date" className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-rose-500" onBlur={field.handleBlur} value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} />
                    </div>
                  )} />
                </>
              )}
              {(archiveType === 'Missing' || archiveType === 'Stolen') && (
                <>
                  <form.Field name="date" children={(field) => (
                     <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Date</label>
                      <input type="date" className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-rose-500" onBlur={field.handleBlur} value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} />
                    </div>
                  )} />
                  <form.Field name="notes" children={(field) => (
                     <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Notes</label>
                      <textarea className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-rose-500 resize-none h-24" onBlur={field.handleBlur} value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} />
                    </div>
                  )} />
                </>
              )}
            </div>
          )} />
          
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-black uppercase text-[10px] tracking-widest transition-colors">Cancel</button>
            <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting, state.values.archiveType]} children={([canSubmit, isSubmitting, archiveType]) => (
              <button 
                type="submit" 
                disabled={!canSubmit || isSubmitting || !archiveType} 
                className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 disabled:opacity-50 transition-colors shadow-lg shadow-rose-200"
              >
                {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : 'Confirm Archive'}
              </button>
            )} />
          </div>
        </form>
      </div>
    </div>
  );
};
