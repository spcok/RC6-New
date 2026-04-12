import React from 'react';
import { useForm } from '@tanstack/react-form';
import { zodValidator } from '@tanstack/zod-form-adapter';
import { z } from 'zod';
import { X, Loader2 } from 'lucide-react';
import { Animal, QuarantineRecord } from '../../types';
import { useAuthStore } from '../../store/authStore';

// Removed staffInitials from the schema; it will be securely injected by the Auth Store
const quarantineSchema = z.object({
  animalId: z.string().min(1, 'Patient is required'),
  reason: z.string().min(1, 'Reason is required'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'Target release date is required'),
  isolationNotes: z.string().min(1, 'Isolation notes are required')
});

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (record: Omit<QuarantineRecord, 'id' | 'animalName' | 'status'>) => Promise<void>;
  animals: Animal[];
}

export const AddQuarantineModal: React.FC<Props> = ({ isOpen, onClose, onSave, animals }) => {
  const { currentUser } = useAuthStore();

  const form = useForm({
    defaultValues: {
      animalId: '',
      reason: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: (() => {
        const now = new Date();
        return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      })(),
      isolationNotes: ''
    },
    validatorAdapter: zodValidator(),
    validators: {
      onChange: quarantineSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        const selectedAnimal = animals.find(a => a.id === value.animalId);
        
        await onSave({ 
          ...value, 
          animalName: selectedAnimal?.name || 'Unknown', 
          status: 'Active',
          // SECURE INJECTION: Pulling directly from RAM, preventing input forgery
          staffInitials: currentUser?.initials || '??'
        });
        
        form.reset();
        onClose();
      } catch (error) {
        console.error('Submission error:', error);
        alert('Failed to save quarantine record.');
      }
    }
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Add Quarantine Record</h2>
            <p className="text-xs font-bold text-amber-600 uppercase tracking-widest mt-1">Isolate & Monitor</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-600 rounded-full transition-colors"><X size={20} /></button>
        </div>
        
        <div className="p-6">
          <form onSubmit={(e) => { e.preventDefault(); e.stopPropagation(); form.handleSubmit(); }} className="space-y-6">
            
            <form.Field name="animalId">
              {(field) => (
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Patient *</label>
                  <select value={field.state.value} onBlur={field.handleBlur} onChange={(e) => field.handleChange(e.target.value)} className={`w-full p-3 bg-white border-2 rounded-xl text-sm font-bold text-slate-900 transition-all outline-none ${field.state.meta.errors.length ? 'border-red-300 focus:border-red-500' : 'border-slate-200 focus:border-amber-500'}`}>
                    <option value="">Select an animal</option>
                    {animals?.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                  {field.state.meta.errors.length > 0 && <em className="text-[10px] font-bold text-red-500 mt-1 block ml-1">{field.state.meta.errors.join(', ')}</em>}
                </div>
              )}
            </form.Field>

            <form.Field name="reason">
              {(field) => (
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Reason for Quarantine *</label>
                  <input type="text" value={field.state.value} onBlur={field.handleBlur} onChange={(e) => field.handleChange(e.target.value)} className={`w-full p-3 bg-white border-2 rounded-xl text-sm font-bold text-slate-900 transition-all outline-none ${field.state.meta.errors.length ? 'border-red-300 focus:border-red-500' : 'border-slate-200 focus:border-amber-500'}`} placeholder="e.g. New arrival, suspected illness..." />
                  {field.state.meta.errors.length > 0 && <em className="text-[10px] font-bold text-red-500 mt-1 block ml-1">{field.state.meta.errors.join(', ')}</em>}
                </div>
              )}
            </form.Field>

            <div className="grid grid-cols-2 gap-4">
              <form.Field name="startDate">
                {(field) => (
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Start Date *</label>
                    <input type="date" value={field.state.value} onBlur={field.handleBlur} onChange={(e) => field.handleChange(e.target.value)} className={`w-full p-3 bg-white border-2 rounded-xl text-sm font-bold text-slate-900 transition-all outline-none ${field.state.meta.errors.length ? 'border-red-300 focus:border-red-500' : 'border-slate-200 focus:border-amber-500'}`} />
                  </div>
                )}
              </form.Field>

              <form.Field name="endDate">
                {(field) => (
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Target Release *</label>
                    <input type="date" value={field.state.value} onBlur={field.handleBlur} onChange={(e) => field.handleChange(e.target.value)} className={`w-full p-3 bg-white border-2 rounded-xl text-sm font-bold text-slate-900 transition-all outline-none ${field.state.meta.errors.length ? 'border-red-300 focus:border-red-500' : 'border-slate-200 focus:border-amber-500'}`} />
                  </div>
                )}
              </form.Field>
            </div>

            <form.Field name="isolationNotes">
              {(field) => (
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Isolation Notes *</label>
                  <textarea value={field.state.value} onBlur={field.handleBlur} onChange={(e) => field.handleChange(e.target.value)} className={`w-full p-4 bg-slate-50 border-2 rounded-2xl text-sm font-medium text-slate-900 outline-none transition-all resize-none ${field.state.meta.errors.length ? 'border-red-300 focus:border-red-500' : 'border-slate-100 focus:border-amber-500'}`} rows={3} placeholder="Strict barrier nursing required, designated PPE..." />
                  {field.state.meta.errors.length > 0 && <em className="text-[10px] font-bold text-red-500 mt-1 block ml-1">{field.state.meta.errors.join(', ')}</em>}
                </div>
              )}
            </form.Field>

            {/* HIDDEN SUBMIT BUTTON TO ALLOW ENTER KEY */}
            <button type="submit" className="hidden">Submit</button>
          </form>
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-6 py-3 text-xs font-black uppercase tracking-widest text-slate-500 hover:bg-slate-200 rounded-xl transition-colors">Cancel</button>
          <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]} children={([canSubmit, isSubmitting]) => (
            <button 
              type="button" 
              onClick={() => form.handleSubmit()} 
              disabled={!canSubmit || isSubmitting} 
              className="px-8 py-3 bg-amber-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-amber-700 shadow-lg shadow-amber-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : 'Save Record'}
            </button>
          )} />
        </div>

      </div>
    </div>
  );
};
