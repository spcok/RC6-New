import React, { useState, useEffect } from 'react';
import { Animal, AnimalCategory } from '../../../types';
import { Plus, Trash2 } from 'lucide-react';
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
  const isMammal = animal.category === AnimalCategory.MAMMALS;
  const { foodOptions } = useFoodOptions();

  // Deconstructs the existing 'value' string back into inputs, or sets up a fresh array
  const parseExistingData = () => {
    if (!existingData || !existingData.value) {
        return [{ id: '', quantity: '', preparation: '', foodOption: '', notes: '', cast: false }];
    }

    // Basic extraction assuming pattern: "2 Yolked DOC" or "50 g Beef"
    // Since existingData is technically one log in this scope, we map it into the array format
    const str = existingData.value;
    const parts = str.split(' ');
    
    let q = '';
    let p = '';
    let f = '';

    if (parts.length >= 3) {
        q = parts[0];
        p = parts[1];
        f = parts.slice(2).join(' ');
    } else if (parts.length === 2) {
        q = parts[0];
        f = parts[1];
    } else {
        f = str;
    }

    return [{ 
        id: existingData.id, 
        quantity: q, 
        preparation: p, 
        foodOption: f, 
        notes: existingData.notes || '', 
        cast: existingData.cast || false 
    }];
  };

  const [feeds, setFeeds] = useState<any[]>(parseExistingData());

  const handleAddFeed = () => {
    setFeeds([...feeds, { id: '', quantity: '', preparation: '', foodOption: '', notes: '', cast: false }]);
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
    const validFeeds = feeds.filter(f => f.foodOption.trim() !== '');
    if (validFeeds.length === 0) return;
    
    // Stitch it correctly for saving: `${quantity} ${preparation} ${foodOption}`
    const payloads = validFeeds.map(f => {
        const constructedValue = `${f.quantity ? f.quantity + ' ' : ''}${f.preparation && f.preparation !== 'None' ? f.preparation + ' ' : ''}${f.foodOption}`.trim();
        return {
            id: f.id || undefined, // Preserve ID for updates!
            value: constructedValue,
            notes: f.notes,
            cast: canCast ? f.cast : undefined
        };
    });

    // Pass an array if it's a mammal (multi-feed support), or just the object
    if (isMammal) {
        onSubmit(payloads);
    } else {
        onSubmit(payloads[0]); 
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {feeds.map((feed, index) => (
        <div key={index} className="p-4 bg-slate-50 border border-slate-200 rounded-xl relative space-y-4">
            
            {isMammal && feeds.length > 1 && (
                <button type="button" onClick={() => handleRemoveFeed(index)} className="absolute top-2 right-2 p-1.5 text-slate-400 hover:text-rose-500 bg-white rounded-lg shadow-sm border border-slate-200 transition-colors">
                    <Trash2 size={14} />
                </button>
            )}

            <div className="grid grid-cols-12 gap-3 pr-6">
                <div className="col-span-3">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Qty</label>
                  <input type="text" value={feed.quantity} onChange={(e) => handleChange(index, 'quantity', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white" placeholder="2, 50g..." autoFocus={index === 0} />
                </div>
                
                <div className="col-span-4">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Prep</label>
                  <select value={feed.preparation} onChange={(e) => handleChange(index, 'preparation', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white">
                      <option value="">None</option>
                      <option value="Yolked">Yolked</option>
                      <option value="Gutted">Gutted</option>
                      <option value="Skinned">Skinned</option>
                      <option value="Halved">Halved</option>
                  </select>
                </div>

                <div className="col-span-5">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Food Option</label>
                  <select value={feed.foodOption} onChange={(e) => handleChange(index, 'foodOption', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white" required>
                      <option value="">Select...</option>
                      {foodOptions.map((opt: any) => (
                          <option key={opt.id} value={opt.name}>{opt.name}</option>
                      ))}
                  </select>
                </div>
            </div>
            
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Diet Notes</label>
              <input type="text" value={feed.notes} onChange={(e) => handleChange(index, 'notes', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white" placeholder="Supplements added, refused food, etc..." />
            </div>

            {canCast && (
              <label className="flex items-center gap-2 cursor-pointer mt-2 w-fit">
                <input type="checkbox" checked={feed.cast} onChange={(e) => handleChange(index, 'cast', e.target.checked)} className="w-4 h-4 text-blue-600 rounded border-slate-300" />
                <span className="text-sm font-bold text-slate-700 select-none">Cast found today</span>
              </label>
            )}
        </div>
      ))}

      {isMammal && (
          <button type="button" onClick={handleAddFeed} className="flex items-center justify-center gap-1.5 w-full py-2.5 border-2 border-dashed border-slate-300 rounded-xl text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50 transition-colors">
              <Plus size={16} /> Add Additional Feed
          </button>
      )}

      <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg">
          Cancel
        </button>
        <button type="submit" disabled={isSubmitting || !feeds[0].foodOption} className="px-4 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50">
          {isSubmitting ? 'Saving...' : (existingData ? 'Update Feed' : 'Save Feed')}
        </button>
      </div>
    </form>
  );
}
