import React from 'react';
import { useForm } from '@tanstack/react-form';
import { Animal } from '../../../types';

interface WeightFormProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isSubmitting: boolean;
  animal: Animal;
  existingData?: any;
}

export default function WeightForm({ onSubmit, onCancel, isSubmitting, animal, existingData }: WeightFormProps) {
  const form = useForm({
    defaultValues: {
      value: existingData?.value ? String(existingData.value).replace(/[^0-9.]/g, '') : '',
      weightUnit: existingData?.weightUnit || animal.weightUnit || 'g',
      notes: existingData?.notes || '',
    },
    onSubmit: async ({ value }) => {
      onSubmit({
        ...existingData, 
        value: value.value,
        weightUnit: value.weightUnit,
        notes: value.notes,
      });
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
      className="space-y-4"
    >
      <div className="grid grid-cols-2 gap-4">
        <form.Field
          name="value"
          validators={{
            onChange: ({ value }) => (!value ? 'Weight is required' : undefined),
          }}
        >
          {(field) => (
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">Weight</label>
              <input
                type="number"
                step="0.01"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
                autoFocus
              />
            </div>
          )}
        </form.Field>

        <form.Field name="weightUnit">
          {(field) => (
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">Unit</label>
              <select
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="g">Grams (g)</option>
                <option value="kg">Kilograms (kg)</option>
                <option value="oz">Ounces (oz)</option>
                <option value="lbs">Pounds (lbs)</option>
              </select>
            </div>
          )}
        </form.Field>
      </div>

      <form.Field name="notes">
        {(field) => (
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">Observation Notes</label>
            <textarea
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]"
              placeholder="Condition, crop size, etc..."
            />
          </div>
        )}
      </form.Field>

      <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
          Cancel
        </button>
        <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
          {([canSubmit]) => (
            <button
              type="submit"
              disabled={isSubmitting || !canSubmit}
              className="px-4 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : (existingData ? 'Update Weight' : 'Save Weight')}
            </button>
          )}
        </form.Subscribe>
      </div>
    </form>
  );
}
