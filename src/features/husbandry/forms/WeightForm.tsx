import React from 'react';
import { Animal } from '../../../types';

interface WeightFormProps {
  onSubmit: (data: Record<string, any>) => void;
  onCancel: () => void;
  isSubmitting: boolean;
  animal: Animal;
  existingData?: Record<string, any>;
}

export default function WeightForm({ onSubmit, onCancel, isSubmitting, animal, existingData }: WeightFormProps) {
  // Pre-fill with existing data if it exists
  const [weight, setWeight] = React.useState(existingData?.value ? String(existingData.value).replace(/[^0-9.]/g, '') : '');
  const [unit, setUnit] = React.useState(existingData?.weightUnit || animal.weightUnit || 'g');
  const [notes, setNotes] = React.useState(existingData?.notes || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!weight) return;
    
    // Spread existingData to persist the 'id' (forces an update instead of insert)
    onSubmit({
      ...existingData,
      value: weight,
      weightUnit: unit,
      notes,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">Weight</label>
          <input
            type="number"
            step="0.01"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="0.00"
            required
            autoFocus
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">Unit</label>
          <select
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="g">Grams (g)</option>
            <option value="kg">Kilograms (kg)</option>
            <option value="oz">Ounces (oz)</option>
            <option value="lbs">Pounds (lbs)</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">Observation Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]"
          placeholder="Condition, crop size, etc..."
        />
      </div>

      <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
          Cancel
        </button>
        <button type="submit" disabled={isSubmitting || !weight} className="px-4 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50">
          {isSubmitting ? 'Saving...' : (existingData ? 'Update Weight' : 'Save Weight')}
        </button>
      </div>
    </form>
  );
}
