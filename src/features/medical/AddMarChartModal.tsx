import React from 'react';
import { useForm } from '@tanstack/react-form';
import { zodValidator } from '@tanstack/zod-form-adapter';
import { z } from 'zod';
import { useAnimalsData } from '../animals/useAnimalsData';
import { useMedicalData } from './useMedicalData';
import { useAuthStore } from '../../store/authStore';
import { X, Loader2 } from 'lucide-react';

const marChartSchema = z.object({
  animal_id: z.string().min(1, 'Patient is required'),
  medication: z.string().min(1, 'Medication is required'),
  dosage: z.string().min(1, 'Dosage is required'),
  route: z.string().min(1, 'Route is required'),
  frequency: z.string().min(1, 'Frequency is required'),
  prescribing_vet: z.string().min(1, 'Prescribing Vet is required'),
  start_date: z.string().min(1, 'Start Date is required'),
  end_date: z.string().optional().nullable(),
  special_instructions: z.string().optional().nullable()
});

interface AddMarChartModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (chart: Omit<MARChart, 'id' | 'isDeleted' | 'updatedAt' | 'createdAt'>) => Promise<void>;
}

export const AddMarChartModal: React.FC<AddMarChartModalProps> = ({ isOpen, onClose, onSave }) => {
  const { animals } = useAnimalsData();
  const { addMarChart } = useMedicalData();
  const { currentUser } = useAuthStore();

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
    validatorAdapter: zodValidator(),
    validators: {
      onChange: marChartSchema,
    },
    onSubmit: async ({ value }) => {
      const combinedInstructions = `Route: ${value.route}\nPrescribing Vet: ${value.prescribing_vet}\n\n${value.special_instructions || ''}`;
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
        staffInitials: currentUser?.initials || '??',
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
              <form.Field name="animal_id">
                {(field) => (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Patient *</label>
                    <select value={field.state.value} onBlur={field.handleBlur} onChange={e => field.handleChange(e.target.value)} className="w-full border border-slate-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500">
                      <option value="">Select Patient</option>
                      {animals.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                    {field.state.meta.errors.length > 0 && <em className="text-xs text-red-500 mt-1 block">{field.state.meta.errors.join(', ')}</em>}
                  </div>
                )}
              </form.Field>

              <form.Field name="prescribing_vet">
                {(field) => (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Prescribing Vet *</label>
                    <input type="text" value={field.state.value} onBlur={field.handleBlur} onChange={e => field.handleChange(e.target.value)} className="w-full border border-slate-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Dr. Smith" />
                    {field.state.meta.errors.length > 0 && <em className="text-xs text-red-500 mt-1 block">{field.state.meta.errors.join(', ')}</em>}
                  </div>
                )}
              </form.Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <form.Field name="medication">
                {(field) => (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Medication *</label>
                    <input type="text" value={field.state.value} onBlur={field.handleBlur} onChange={e => field.handleChange(e.target.value)} className="w-full border border-slate-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="e.g. Meloxicam" />
                    {field.state.meta.errors.length > 0 && <em className="text-xs text-red-500 mt-1 block">{field.state.meta.errors.join(', ')}</em>}
                  </div>
                )}
              </form.Field>

              <form.Field name="dosage">
                {(field) => (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Dosage *</label>
                    <input type="text" value={field.state.value} onBlur={field.handleBlur} onChange={e => field.handleChange(e.target.value)} className="w-full border border-slate-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="e.g. 0.5ml" />
                    {field.state.meta.errors.length > 0 && <em className="text-xs text-red-500 mt-1 block">{field.state.meta.errors.join(', ')}</em>}
                  </div>
                )}
              </form.Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <form.Field name="route">
                {(field) => (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Route</label>
                    <select value={field.state.value} onBlur={field.handleBlur} onChange={e => field.handleChange(e.target.value)} className="w-full border border-slate-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500">
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

              <form.Field name="frequency">
                {(field) => (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Frequency *</label>
                    <input type="text" value={field.state.value} onBlur={field.handleBlur} onChange={e => field.handleChange(e.target.value)} className="w-full border border-slate-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="e.g. SID, BID, Every 12h" />
                    {field.state.meta.errors.length > 0 && <em className="text-xs text-red-500 mt-1 block">{field.state.meta.errors.join(', ')}</em>}
                  </div>
                )}
              </form.Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <form.Field name="start_date">
                {(field) => (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Start Date *</label>
                    <input type="date" value={field.state.value} onBlur={field.handleBlur} onChange={e => field.handleChange(e.target.value)} className="w-full border border-slate-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500" />
                    {field.state.meta.errors.length > 0 && <em className="text-xs text-red-500 mt-1 block">{field.state.meta.errors.join(', ')}</em>}
                  </div>
                )}
              </form.Field>

              <form.Field name="end_date">
                {(field) => (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">End Date (Optional for ongoing)</label>
                    <input type="date" value={field.state.value || ''} onBlur={field.handleBlur} onChange={e => field.handleChange(e.target.value)} className="w-full border border-slate-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500" />
                  </div>
                )}
              </form.Field>
            </div>

            <div>
              <form.Field name="special_instructions">
                {(field) => (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Special Instructions</label>
                    <textarea value={field.state.value || ''} onBlur={field.handleBlur} onChange={e => field.handleChange(e.target.value)} className="w-full border border-slate-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500" rows={3} placeholder="e.g. Give with food, monitor for lethargy" />
                  </div>
                )}
              </form.Field>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t">
              <button type="button" onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors">Cancel</button>
              <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]} children={([canSubmit, isSubmitting]) => (
                <button type="submit" disabled={!canSubmit || isSubmitting} className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2">
                  {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : 'Save Prescription'}
                </button>
              )} />
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
