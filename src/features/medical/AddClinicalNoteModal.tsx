import React from 'react';
import { useForm } from '@tanstack/react-form';
import { zodValidator } from '@tanstack/zod-form-adapter';
import { z } from 'zod';
import { useAnimalsData } from '../animals/useAnimalsData';
import { useMedicalData } from './useMedicalData';
import { useAuthStore } from '../../store/authStore';
import { X, Loader2 } from 'lucide-react';

const clinicalNoteSchema = z.object({
  animal_id: z.string().min(1, 'Patient is required'),
  urgency: z.enum(['Routine', 'Urgent', 'Critical']),
  source: z.enum(['Internal Keeper', 'External Vet']),
  prescribing_vet: z.string().optional(),
  soap_subjective: z.string().optional(),
  soap_objective: z.string().optional(),
  soap_assessment: z.string().optional(),
  soap_plan: z.string().optional(),
  follow_up_plan: z.string().optional()
}).refine(data => {
  if (data.source === 'External Vet' && (!data.prescribing_vet || data.prescribing_vet.trim() === '')) {
    return false;
  }
  return true;
}, {
  message: "Prescribing Vet Name is required when source is External Vet",
  path: ["prescribing_vet"]
});

interface AddClinicalNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddClinicalNoteModal: React.FC<AddClinicalNoteModalProps> = ({ isOpen, onClose }) => {
  const { animals } = useAnimalsData();
  const { addClinicalNote } = useMedicalData();
  const { currentUser } = useAuthStore();

  const form = useForm({
    defaultValues: {
      animal_id: '',
      urgency: 'Routine' as 'Routine' | 'Urgent' | 'Critical',
      source: 'Internal Keeper' as 'Internal Keeper' | 'External Vet',
      prescribing_vet: '',
      soap_subjective: '',
      soap_objective: '',
      soap_assessment: '',
      soap_plan: '',
      follow_up_plan: ''
    },
    validatorAdapter: zodValidator(),
    validators: {
      onChange: clinicalNoteSchema,
    },
    onSubmit: async ({ value }) => {
      const combinedNoteText = `Subjective:\n${value.soap_subjective || 'None'}\n\nObjective:\n${value.soap_objective || 'None'}`;
      const combinedPlan = `${value.soap_plan || 'None'}\n\nFollow-up Required:\n${value.follow_up_plan || 'None'}`;

      await addClinicalNote({
        animalId: value.animal_id,
        urgency: value.urgency,
        noteType: 'Clinical',
        noteText: combinedNoteText,
        diagnosis: value.soap_assessment || 'Pending',
        treatmentPlan: combinedPlan,
        prescribingVet: value.source === 'External Vet' ? value.prescribing_vet : undefined,
        date: new Date().toISOString(),
        staffInitials: currentUser?.initials || '??'
      });
      form.reset();
      onClose();
    }
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">New Medical Entry</h2>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Record Clinical SOAP Note</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-600 rounded-full transition-colors"><X size={20} /></button>
        </div>
        
        <div className="p-8 overflow-y-auto flex-1 custom-scrollbar">
          <form onSubmit={(e) => { e.preventDefault(); e.stopPropagation(); form.handleSubmit(); }} className="space-y-8">
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-100">
              <form.Field name="animal_id">
                {(field) => (
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Patient *</label>
                    <select value={field.state.value} onBlur={field.handleBlur} onChange={e => field.handleChange(e.target.value)} className={`w-full p-3 bg-white border-2 rounded-xl text-sm font-bold text-slate-900 transition-all outline-none ${field.state.meta.errors.length ? 'border-red-300 focus:border-red-500' : 'border-slate-200 focus:border-indigo-500'}`}>
                      <option value="">Select Patient</option>
                      {animals.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                  </div>
                )}
              </form.Field>

              <form.Field name="urgency">
                {(field) => (
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Urgency</label>
                    <select value={field.state.value} onBlur={field.handleBlur} onChange={e => field.handleChange(e.target.value as 'Routine' | 'Urgent' | 'Critical')} className="w-full p-3 bg-white border-2 border-slate-200 rounded-xl text-sm font-bold text-slate-900 transition-all outline-none focus:border-indigo-500">
                      <option value="Routine">Routine</option>
                      <option value="Urgent">Urgent</option>
                      <option value="Critical">Critical</option>
                    </select>
                  </div>
                )}
              </form.Field>

              <form.Field name="source">
                {(field) => (
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Source</label>
                    <select value={field.state.value} onBlur={field.handleBlur} onChange={e => field.handleChange(e.target.value as 'Internal Keeper' | 'External Vet')} className="w-full p-3 bg-white border-2 border-slate-200 rounded-xl text-sm font-bold text-slate-900 transition-all outline-none focus:border-indigo-500">
                      <option value="Internal Keeper">Internal Keeper</option>
                      <option value="External Vet">External Vet</option>
                    </select>
                  </div>
                )}
              </form.Field>

              <form.Subscribe selector={(state) => state.values.source}>
                {(source) => source === 'External Vet' && (
                  <div className="md:col-span-3">
                    <form.Field name="prescribing_vet">
                      {(field) => (
                        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                          <label className="block text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1.5 ml-1">Prescribing Vet Name *</label>
                          <input type="text" value={field.state.value} onBlur={field.handleBlur} onChange={e => field.handleChange(e.target.value)} className={`w-full p-3 bg-amber-50 border-2 rounded-xl text-sm font-bold text-amber-900 transition-all outline-none ${field.state.meta.errors.length ? 'border-red-400 focus:border-red-600' : 'border-amber-200 focus:border-amber-500'}`} placeholder="Dr. Smith" />
                          {field.state.meta.errors.length > 0 && <em className="text-[10px] font-bold text-red-500 mt-1 block ml-1">{field.state.meta.errors.join(', ')}</em>}
                        </div>
                      )}
                    </form.Field>
                  </div>
                )}
              </form.Subscribe>
            </div>

            <div className="space-y-6">
              <h3 className="text-sm font-black text-slate-300 uppercase tracking-widest border-b border-slate-100 pb-2">S.O.A.P. Notes</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <form.Field name="soap_subjective">
                    {(field) => (
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Subjective (History & Observations)</label>
                        <textarea value={field.state.value} onBlur={field.handleBlur} onChange={e => field.handleChange(e.target.value)} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-medium text-slate-900 focus:border-indigo-500 outline-none transition-all resize-none" rows={3} placeholder="Keeper observations, behavior changes..." />
                      </div>
                    )}
                  </form.Field>

                  <form.Field name="soap_objective">
                    {(field) => (
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Objective (Physical Exam & Vitals)</label>
                        <textarea value={field.state.value} onBlur={field.handleBlur} onChange={e => field.handleChange(e.target.value)} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-medium text-slate-900 focus:border-indigo-500 outline-none transition-all resize-none" rows={3} placeholder="Measurable data, weight, body condition score..." />
                      </div>
                    )}
                  </form.Field>

                  <form.Field name="soap_assessment">
                    {(field) => (
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Assessment (Diagnosis)</label>
                        <textarea value={field.state.value} onBlur={field.handleBlur} onChange={e => field.handleChange(e.target.value)} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-medium text-slate-900 focus:border-indigo-500 outline-none transition-all resize-none" rows={3} placeholder="Veterinary diagnosis or suspected condition..." />
                      </div>
                    )}
                  </form.Field>

                  <form.Field name="soap_plan">
                    {(field) => (
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Plan (Treatment & Meds)</label>
                        <textarea value={field.state.value} onBlur={field.handleBlur} onChange={e => field.handleChange(e.target.value)} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-medium text-slate-900 focus:border-indigo-500 outline-none transition-all resize-none" rows={3} placeholder="Medications prescribed, husbandry changes..." />
                      </div>
                    )}
                  </form.Field>
              </div>
            </div>

            <div className="pt-4">
              <form.Field name="follow_up_plan">
                {(field) => (
                  <div>
                    <label className="block text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1.5 ml-1">Follow-up Plan (Keeper Actions)</label>
                    <textarea value={field.state.value} onBlur={field.handleBlur} onChange={e => field.handleChange(e.target.value)} className="w-full p-4 bg-indigo-50/50 border-2 border-indigo-100 rounded-2xl text-sm font-bold text-indigo-900 focus:border-indigo-500 outline-none transition-all resize-none" rows={2} placeholder="e.g. Monitor weight daily, recheck in 3 days..." />
                  </div>
                )}
              </form.Field>
            </div>

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
              className="px-8 py-3 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : 'Save Record'}
            </button>
          )} />
        </div>

      </div>
    </div>
  );
};
