import React from 'react';
import { useForm } from '@tanstack/react-form';
import { zodValidator } from '@tanstack/zod-form-adapter';
import { z } from 'zod';
import { Scale, Loader2, Check } from 'lucide-react';
import { useDailyLogData } from '../useDailyLogData';
import { LogType } from '../../../types';

interface Props {
  animalId: string;
  animalName: string;
  onClose: () => void;
}

// 1. Strict Zod Schema for High-Frequency Entry
const weightSchema = z.object({
  weight: z.number().min(0.01, "Weight must be greater than 0"),
  unit: z.enum(['kg', 'g']),
  notes: z.string().optional(),
  date: z.string().min(1, "Date is required")
});

const WeightForm: React.FC<Props> = ({ animalId, animalName, onClose }) => {
  const { addLogEntry } = useDailyLogData(new Date().toISOString().split('T')[0], 'all');

  // 2. Official TanStack Form Hook
  const form = useForm({
    defaultValues: {
      weight: 0,
      unit: 'kg' as 'kg' | 'g',
      notes: '',
      date: new Date().toISOString().split('T')[0],
    },
    validatorAdapter: zodValidator(),
    validators: {
      onChange: weightSchema,
    },
    onSubmit: async ({ value }) => {
      // Map the form values to the exact Supabase/Native DB schema expected by the hook
      await addLogEntry({
        id: crypto.randomUUID(),
        animalId,
        logType: LogType.WEIGHT,
        logDate: value.date,
        value: value.weight,
        unit: value.unit,
        notes: value.notes,
        recordedBy: 'Current User', // In a full app, pull from authStore
        isDeleted: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      onClose();
    },
  });

  return (
    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
      <div className="flex items-center gap-2 mb-4 text-slate-700">
        <Scale className="w-5 h-5 text-emerald-600" />
        <h3 className="font-bold">Record Weight for {animalName}</h3>
      </div>

      <form.Provider>
        <form onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }} className="space-y-4">
          
          <div className="grid grid-cols-2 gap-4">
            {/* 3. Isolated Field Components */}
            <form.Field name="weight">
              {(field) => (
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Weight</label>
                  <input
                    type="number"
                    step="0.01"
                    value={field.state.value || ''}
                    onChange={(e) => field.handleChange(parseFloat(e.target.value))}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="0.00"
                  />
                  {field.state.meta.errors ? (
                    <em className="text-xs text-red-500 mt-1">{field.state.meta.errors.join(', ')}</em>
                  ) : null}
                </div>
              )}
            </form.Field>

            <form.Field name="unit">
              {(field) => (
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Unit</label>
                  <div className="flex bg-white border border-slate-200 rounded-lg overflow-hidden">
                    <button
                      type="button"
                      onClick={() => field.handleChange('kg')}
                      className={`flex-1 py-2 text-sm font-bold transition-colors ${field.state.value === 'kg' ? 'bg-emerald-100 text-emerald-800' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                      kg
                    </button>
                    <div className="w-px bg-slate-200"></div>
                    <button
                      type="button"
                      onClick={() => field.handleChange('g')}
                      className={`flex-1 py-2 text-sm font-bold transition-colors ${field.state.value === 'g' ? 'bg-emerald-100 text-emerald-800' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                      g
                    </button>
                  </div>
                </div>
              )}
            </form.Field>
          </div>

          <form.Field name="notes">
            {(field) => (
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Observation Notes</label>
                <textarea
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[80px]"
                  placeholder="e.g., Animal was active, ate well prior to weighing..."
                />
              </div>
            )}
          </form.Field>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-bold text-slate-600 hover:text-slate-800 transition-colors">
              Cancel
            </button>
            <form.Subscribe
              selector={(state) => [state.canSubmit, state.isSubmitting]}
              children={([canSubmit, isSubmitting]) => (
                <button 
                  type="submit" 
                  disabled={!canSubmit || isSubmitting} 
                  className="px-6 py-2 bg-emerald-600 text-white text-sm font-bold rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Save Weight
                </button>
              )}
            />
          </div>
        </form>
      </form.Provider>
    </div>
  );
};

export default WeightForm;
