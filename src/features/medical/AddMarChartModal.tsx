import React from 'react';
import { useForm } from '@tanstack/react-form';
import { useAnimalsData } from '../animals/useAnimalsData';
import { useMedicalData } from './useMedicalData';
import { X } from 'lucide-react';

interface AddMarChartModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (chart: any) => Promise<void>;
}

export const AddMarChartModal: React.FC<AddMarChartModalProps> = ({ isOpen, onClose, onSave }) => {
  const { animals } = useAnimalsData();
  const { addMarChart } = useMedicalData();

  const form = useForm({
    defaultValues: {
      animal_id: '',
      medication: '',
      dosage: '',
      route: 'PO',
      frequency: '',
      prescribing_vet: '',
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
      special_instructions: ''
    },
    onSubmit: async ({ value }) => {
      const combinedInstructions = `Route: ${value.route}\nPrescribing Vet: ${value.prescribing_vet}\n\n${value.special_instructions}`;
      const selectedAnimal = animals.find(a => a.id === value.animal_id);

      const payload = {
        animalId: value.animal_id,
        animalName: selectedAnimal?.name || 'Unknown',
        medication: value.medication,
        dosage: value.dosage,
        frequency: value.frequency,
        startDate: new Date(value.start_date).toISOString(),
        endDate: value.end_date ? new Date(value.end_date).toISOString() : undefined,
        instructions: combinedInstructions,
        status: 'Active',
        staffInitials: '??', // In a real app, this would be the logged-in user's initials
        administeredDates: []
      };

      if (onSave) {
        await onSave(payload);
      } else {
        await addMarChart(payload);
      }

      form.reset();
      onClose();
    }
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-900">New Prescription</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
        </div>
        <div className="p-6 overflow-y-auto flex-1">
          <form onSubmit={(e) => { e.preventDefault(); e.stopPropagation(); form.handleSubmit(); }} className="space-y-6">
            
            <div className="grid grid-cols-2 gap-4">
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

              <form.Field name="prescribing_vet" validators={{ onChange: ({ value }) => !value ? 'Required' : undefined }}>
                {(field) => (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Prescribing Vet *</label>
                    <input type="text" value={field.state.value} onChange={e => field.handleChange(e.target.value)} className="w-full border border-slate-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Dr. Smith" />
                    {field.state.meta.errors ? <em className="text-xs text-red-500">{field.state.meta.errors}</em> : null}
                  </div>
                )}
              </form.Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <form.Field name="medication" validators={{ onChange: ({ value }) => !value ? 'Required' : undefined }}>
                {(field) => (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Medication *</label>
                    <input type="text" value={field.state.value} onChange={e => field.handleChange(e.target.value)} className="w-full border border-slate-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="e.g. Meloxicam" />
                    {field.state.meta.errors ? <em className="text-xs text-red-500">{field.state.meta.errors}</em> : null}
                  </div>
                )}
              </form.Field>

              <form.Field name="dosage" validators={{ onChange: ({ value }) => !value ? 'Required' : undefined }}>
                {(field) => (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Dosage *</label>
                    <input type="text" value={field.state.value} onChange={e => field.handleChange(e.target.value)} className="w-full border border-slate-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="e.g. 0.5ml" />
                    {field.state.meta.errors ? <em className="text-xs text-red-500">{field.state.meta.errors}</em> : null}
                  </div>
                )}
              </form.Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <form.Field name="route">
                {(field) => (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Route</label>
                    <select value={field.state.value} onChange={e => field.handleChange(e.target.value)} className="w-full border border-slate-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500">
                      <option value="PO">PO (Oral)</option>
                      <option value="IM">IM (Intramuscular)</option>
                      <option value="SC">SC (Subcutaneous)</option>
                      <option value="IV">IV (Intravenous)</option>
                      <option value="Topical">Topical</option>
                      <option value="Ophthalmic">Ophthalmic (Eye)</option>
                      <option value="Otic">Otic (Ear)</option>
                    </select>
                  </div>
                )}
              </form.Field>

              <form.Field name="frequency" validators={{ onChange: ({ value }) => !value ? 'Required' : undefined }}>
                {(field) => (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Frequency *</label>
                    <input type="text" value={field.state.value} onChange={e => field.handleChange(e.target.value)} className="w-full border border-slate-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="e.g. SID, BID, Every 12h" />
                    {field.state.meta.errors ? <em className="text-xs text-red-500">{field.state.meta.errors}</em> : null}
                  </div>
                )}
              </form.Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <form.Field name="start_date" validators={{ onChange: ({ value }) => !value ? 'Required' : undefined }}>
                {(field) => (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Start Date *</label>
                    <input type="date" value={field.state.value} onChange={e => field.handleChange(e.target.value)} className="w-full border border-slate-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500" />
                    {field.state.meta.errors ? <em className="text-xs text-red-500">{field.state.meta.errors}</em> : null}
                  </div>
                )}
              </form.Field>

              <form.Field name="end_date">
                {(field) => (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">End Date (Optional for ongoing)</label>
                    <input type="date" value={field.state.value} onChange={e => field.handleChange(e.target.value)} className="w-full border border-slate-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500" />
                  </div>
                )}
              </form.Field>
            </div>

            <div>
              <form.Field name="special_instructions">
                {(field) => (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Special Instructions</label>
                    <textarea value={field.state.value} onChange={e => field.handleChange(e.target.value)} className="w-full border border-slate-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500" rows={3} placeholder="e.g. Give with food, monitor for lethargy" />
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
                    {isSubmitting ? 'Saving...' : 'Save Prescription'}
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
