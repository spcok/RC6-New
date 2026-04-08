import React from 'react';
import { useForm } from '@tanstack/react-form';
import { useAnimalsData } from '../animals/useAnimalsData';
import { useMedicalData } from './useMedicalData';
import { X } from 'lucide-react';

interface AddClinicalNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddClinicalNoteModal: React.FC<AddClinicalNoteModalProps> = ({ isOpen, onClose }) => {
  const { animals } = useAnimalsData();
  const { addClinicalNote } = useMedicalData();

  const form = useForm({
    defaultValues: {
      animal_id: '',
      urgency: 'Routine',
      source: 'Internal Keeper',
      prescribing_vet: '',
      soap_subjective: '',
      soap_objective: '',
      soap_assessment: '',
      soap_plan: '',
      follow_up_plan: ''
    },
    onSubmit: async ({ value }) => {
      const combinedNoteText = `Subjective:\n${value.soap_subjective}\n\nObjective:\n${value.soap_objective}`;
      const combinedPlan = `${value.soap_plan}\n\nFollow-up Required:\n${value.follow_up_plan}`;

      await addClinicalNote({
        animalId: value.animal_id,
        urgency: value.urgency,
        noteType: 'Clinical',
        noteText: combinedNoteText,
        diagnosis: value.soap_assessment,
        treatmentPlan: combinedPlan,
        prescribingVet: value.source === 'External Vet' ? value.prescribing_vet : undefined,
        date: new Date().toISOString(),
        staffInitials: '??'
      });
      form.reset();
      onClose();
    }
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-900">New Medical Entry</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
        </div>
        <div className="p-6 overflow-y-auto flex-1">
          <form onSubmit={(e) => { e.preventDefault(); e.stopPropagation(); form.handleSubmit(); }} className="space-y-6">
            
            <div className="grid grid-cols-3 gap-4">
              <form.Field name="animal_id" validators={{ onChange: ({ value }) => !value ? 'Required' : undefined }}>
                {(field) => (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Patient *</label>
                    <select value={field.state.value} onChange={e => field.handleChange(e.target.value)} className="w-full border border-slate-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500">
                      <option value="">Select Patient</option>
                      {animals.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                    {field.state.meta.errors ? <em className="text-xs text-red-500">{field.state.meta.errors}</em> : null}
                  </div>
                )}
              </form.Field>

              <form.Field name="urgency">
                {(field) => (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Urgency</label>
                    <select value={field.state.value} onChange={e => field.handleChange(e.target.value)} className="w-full border border-slate-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500">
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
                    <label className="block text-sm font-medium text-slate-700 mb-1">Source</label>
                    <select value={field.state.value} onChange={e => field.handleChange(e.target.value)} className="w-full border border-slate-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500">
                      <option value="Internal Keeper">Internal Keeper</option>
                      <option value="External Vet">External Vet</option>
                    </select>
                  </div>
                )}
              </form.Field>
            </div>

            <form.Subscribe selector={(state) => state.values.source}>
              {(source) => source === 'External Vet' && (
                <form.Field name="prescribing_vet" validators={{ onChange: ({ value }) => !value ? 'Required for External Vet' : undefined }}>
                  {(field) => (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Prescribing Vet Name *</label>
                      <input type="text" value={field.state.value} onChange={e => field.handleChange(e.target.value)} className="w-full border border-slate-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Dr. Smith" />
                      {field.state.meta.errors ? <em className="text-xs text-red-500">{field.state.meta.errors}</em> : null}
                    </div>
                  )}
                </form.Field>
              )}
            </form.Subscribe>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-900 border-b pb-2">SOAP Notes</h3>
              
              <form.Field name="soap_subjective">
                {(field) => (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Subjective (History & Observations)</label>
                    <textarea value={field.state.value} onChange={e => field.handleChange(e.target.value)} className="w-full border border-slate-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500" rows={3} />
                  </div>
                )}
              </form.Field>

              <form.Field name="soap_objective">
                {(field) => (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Objective (Physical Exam & Vitals)</label>
                    <textarea value={field.state.value} onChange={e => field.handleChange(e.target.value)} className="w-full border border-slate-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500" rows={3} />
                  </div>
                )}
              </form.Field>

              <form.Field name="soap_assessment">
                {(field) => (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Assessment (Diagnosis)</label>
                    <textarea value={field.state.value} onChange={e => field.handleChange(e.target.value)} className="w-full border border-slate-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500" rows={2} />
                  </div>
                )}
              </form.Field>

              <form.Field name="soap_plan">
                {(field) => (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Plan (Treatment & Meds)</label>
                    <textarea value={field.state.value} onChange={e => field.handleChange(e.target.value)} className="w-full border border-slate-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500" rows={3} />
                  </div>
                )}
              </form.Field>
            </div>

            <div className="pt-4">
              <form.Field name="follow_up_plan">
                {(field) => (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Follow-up Plan (Keeper Actions)</label>
                    <textarea value={field.state.value} onChange={e => field.handleChange(e.target.value)} className="w-full border border-slate-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 bg-amber-50" rows={2} placeholder="e.g. Monitor weight daily, recheck in 3 days" />
                  </div>
                )}
              </form.Field>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t">
              <button type="button" onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium">Cancel</button>
              <form.Subscribe
                selector={(state) => ({
                  canSubmit: state.canSubmit,
                  isSubmitting: state.isSubmitting,
                })}
              >
                {({ canSubmit, isSubmitting }) => (
                  <button type="submit" disabled={!canSubmit} className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50">
                    {isSubmitting ? 'Saving...' : 'Save Record'}
                  </button>
                )}
              </form.Subscribe>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
