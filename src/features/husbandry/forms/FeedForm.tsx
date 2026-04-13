import React from 'react';
import { useForm } from '@tanstack/react-form';
import { Animal, AnimalCategory } from '../../../types';
import { useFoodOptions } from '../hooks/useFoodOptions';

interface FeedFormProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isSubmitting: boolean;
  animal: Animal;
  existingData?: any;
}

export default function FeedForm({ onSubmit, onCancel, isSubmitting, animal, existingData }: FeedFormProps) {
  const canCast = animal.category === AnimalCategory.OWLS || animal.category === AnimalCategory.RAPTORS;
  const { foodOptions } = useFoodOptions();

  // Safely parses existing JSON string (or object) back into the UI
  const getInitialValue = () => {
    if (!existingData || !existingData.value) return {};
    try {
      const parsed = typeof existingData.value === 'string' ? JSON.parse(existingData.value) : existingData.value;
      return parsed || {};
    } catch {
      return {};
    }
  };

  const initialValues = getInitialValue();

  const form = useForm({
    defaultValues: {
      foodOption: initialValues.foodOption || '',
      quantity: initialValues.quantity || '',
      preparation: initialValues.preparation || '',
      notes: existingData?.notes || '',
      cast: existingData?.cast || false,
    },
    onSubmit: async ({ value }) => {
      // FIX: Force strict JSON stringification so Supabase and BirdRow map it perfectly
      const jsonValue = JSON.stringify({
        foodOption: value.foodOption,
        quantity: value.quantity,
        preparation: value.preparation,
      });

      onSubmit({
        ...existingData, // Pass the ID back!
        value: jsonValue,
        notes: value.notes,
        cast: canCast ? value.cast : undefined,
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
          name="foodOption"
          validators={{ onChange: ({ value }) => (!value ? 'Required' : undefined) }}
        >
          {(field) => (
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">Food Option</label>
              <select
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">Select Food...</option>
                {foodOptions?.map(opt => (
                  <option key={opt.id} value={opt.name}>{opt.name}</option>
                ))}
              </select>
            </div>
          )}
        </form.Field>

        <form.Field
          name="quantity"
          validators={{ onChange: ({ value }) => (!value ? 'Required' : undefined) }}
        >
          {(field) => (
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">Quantity</label>
              <input
                type="text"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. 2, 50g"
              />
            </div>
          )}
        </form.Field>
      </div>

      <form.Field name="preparation">
        {(field) => (
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">Preparation</label>
            <select
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">None</option>
              <option value="Yolked">Yolked</option>
              <option value="Gutted">Gutted</option>
              <option value="Skinned">Skinned</option>
            </select>
          </div>
        )}
      </form.Field>

      <form.Field name="notes">
        {(field) => (
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">Diet Notes</label>
            <input
              type="text"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Refused, left half, supplements..."
            />
          </div>
        )}
      </form.Field>

      {canCast && (
        <form.Field name="cast">
          {(field) => (
            <label className="flex items-center gap-2 cursor-pointer mt-2 w-fit">
              <input
                type="checkbox"
                checked={field.state.value as boolean}
                onChange={(e) => field.handleChange(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
              />
              <span className="text-sm font-bold text-slate-700 select-none">Cast found today</span>
            </label>
          )}
        </form.Field>
      )}

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
              {isSubmitting ? 'Saving...' : (existingData ? 'Update Feed' : 'Save Feed')}
            </button>
          )}
        </form.Subscribe>
      </div>
    </form>
  );
}
