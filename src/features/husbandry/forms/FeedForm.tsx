import React, { useState } from 'react';
import { Animal, AnimalCategory } from '../../../types';
import { Plus, Trash2 } from 'lucide-react';

interface FeedFormProps {
  onSubmit: (data: Record<string, any>[]) => void;
  onCancel: () => void;
  isSubmitting: boolean;
  animal: Animal;
  existingData?: Record<string, any>[];
}

export default function FeedForm({ onSubmit, onCancel, isSubmitting, animal, existingData }: FeedFormProps) {
  // Determine if animal can cast
  const canCast = animal.category === AnimalCategory.OWLS || animal.category === AnimalCategory.RAPTORS;
  const isMammal = animal.category === AnimalCategory.MAMMALS;

  // Initialize with existing data array, or a single blank entry
  const [feeds, setFeeds] = useState<Record<string, any>[]>(
    existingData && existingData.length > 0 
        ? existingData 
        : [{ value: '', notes: '', cast: false }]
  );

  const handleAddFeed = () => {
    setFeeds([...feeds, { value: '', notes: '', cast: false }]);
  };

  const handleRemoveFeed = (index: number) => {
    const newFeeds = [...feeds];
    newFeeds.splice(index, 1);
    setFeeds(newFeeds);
  };

  const handleChange = (index: number, field: string, val: any) => {
    const newFeeds = [...feeds];
    newFeeds[index][field] = val;
    setFeeds(newFeeds);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validFeeds = feeds.filter(f => f.value.trim() !== '');
    if (validFeeds.length === 0) return;
    
    // Pass the array of feeds back to the modal for processing
    onSubmit(validFeeds);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {feeds.map((feed, index) => (
        <div key={feed.id || index} className="p-3 bg-slate-50 border border-slate-200 rounded-xl relative">
            
            {/* The multi-feed remove button (only for extra entries) */}
            {feeds.length > 1 && (
                <button type="button" onClick={() => handleRemoveFeed(index)} className="absolute top-2 right-2 p-1 text-slate-400 hover:text-rose-500 bg-white rounded-md shadow-sm border border-slate-200">
                    <Trash2 size={14} />
                </button>
            )}

            <div className="space-y-3 pr-6">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Feed Amount / Type</label>
                  <input
                    type="text"
                    value={feed.value}
                    onChange={(e) => handleChange(index, 'value', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    placeholder="e.g., 2 DOC, 50g beef..."
                    required
                    autoFocus={index === 0}
                  />
                </div>
                
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Diet Notes</label>
                  <input
                    type="text"
                    value={feed.notes}
                    onChange={(e) => handleChange(index, 'notes', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    placeholder="Supplements added, refused food, etc..."
                  />
                </div>

                {/* Conditionally render the Cast checkbox */}
                {canCast && (
                  <label className="flex items-center gap-2 cursor-pointer mt-2 w-fit">
                    <input
                      type="checkbox"
                      checked={feed.cast || false}
                      onChange={(e) => handleChange(index, 'cast', e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                    />
                    <span className="text-sm font-bold text-slate-700 select-none">Cast found today</span>
                  </label>
                )}
            </div>
        </div>
      ))}

      {/* The "+" Button for Mammals */}
      {isMammal && (
          <button type="button" onClick={handleAddFeed} className="flex items-center justify-center gap-1.5 w-full py-2 border-2 border-dashed border-slate-300 rounded-xl text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50 transition-colors">
              <Plus size={14} /> Add Additional Feed
          </button>
      )}

      <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
          Cancel
        </button>
        <button type="submit" disabled={isSubmitting || !feeds[0].value} className="px-4 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50">
          {isSubmitting ? 'Saving...' : 'Save Feed Record'}
        </button>
      </div>
    </form>
  );
}
