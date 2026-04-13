import React, { useState } from 'react';
import { Animal, AnimalCategory } from '../../../types';

interface FeedFormProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isSubmitting: boolean;
  animal: Animal;
  existingData?: any;
}

export default function FeedForm({ onSubmit, onCancel, isSubmitting, animal, existingData }: FeedFormProps) {
  const canCast = animal.category === AnimalCategory.OWLS || animal.category === AnimalCategory.RAPTORS;

  const [feed, setFeed] = useState(existingData?.value || '');
  const [notes, setNotes] = useState(existingData?.notes || '');
  const [cast, setCast] = useState(existingData?.cast || false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feed) return;
    
    onSubmit({
      ...existingData,
      value: feed,
      notes,
      cast: canCast ? cast : undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">Feed Amount / Type</label>
        <input
          type="text"
          value={feed}
          onChange={(e) => setFeed(e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="e.g., 2 DOC, 50g beef..."
          required
          autoFocus
        />
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">Diet Notes</label>
        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Supplements added, refused food, etc..."
        />
      </div>

      {canCast && (
        <label className="flex items-center gap-2 cursor-pointer mt-2 w-fit">
          <input
            type="checkbox"
            checked={cast}
            onChange={(e) => setCast(e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
          />
          <span className="text-sm font-bold text-slate-700 select-none">Cast found today</span>
        </label>
      )}

      <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
          Cancel
        </button>
        <button type="submit" disabled={isSubmitting || !feed} className="px-4 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50">
          {isSubmitting ? 'Saving...' : (existingData ? 'Update Feed' : 'Save Feed')}
        </button>
      </div>
    </form>
  );
}
