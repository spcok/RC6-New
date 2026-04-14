import React from 'react';
import { useForm } from '@tanstack/react-form';
import { zodValidator } from '@tanstack/zod-form-adapter';
import { z } from 'zod';
import { Save, Loader2, Calendar, Utensils, Plus, Trash2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { LogType, LogEntry, Animal, OperationalList, AnimalCategory } from '../../../types';

const feedItemSchema = z.object({
  type: z.string().min(1, "Select food"),
  quantity: z.string().min(1, "Required")
});

const feedSchema = z.object({
  logDate: z.string().min(1, "Date is required"),
  userInitials: z.string().min(2, 'Initials required').max(4, 'Max 4 chars'),
  feedItems: z.array(feedItemSchema).min(1, "At least one food item is required"),
  method: z.string().optional(),
  cast: z.string().optional(),
  feedTime: z.string().optional(),
  userNotes: z.string().optional()
});

interface FeedFormProps {
  animal: Animal;
  date: string;
  userInitials: string;
  existingLog?: LogEntry;
  foodTypes: OperationalList[];
  onSave: (entry: Partial<LogEntry>) => Promise<void>;
  onCancel: () => void;
}

export default function FeedForm({ animal, date, userInitials, existingLog, foodTypes, onSave, onCancel }: FeedFormProps) {
  const isBird = animal.category === AnimalCategory.OWLS || animal.category === AnimalCategory.RAPTORS;
  const isExotic = animal.category === AnimalCategory.EXOTICS;

  const existingNotesData = (() => {
    try {
      return existingLog?.notes ? JSON.parse(existingLog.notes) : {};
    } catch {
      return {};
    }
  })();

  const form = useForm({
    validatorAdapter: zodValidator(),
    defaultValues: {
      logDate: existingLog?.logDate || date,
      userInitials: existingLog?.userInitials || userInitials || '',
      feedItems: (() => {
        if (existingLog?.value) {
          return existingLog.value.split(', ').map(item => {
            const [type, quantity] = item.split(' - ');
            return { type: type || '', quantity: quantity || '' };
          });
        }
        return [{ type: '', quantity: '' }];
      })(),
      method: existingNotesData.method || '',
      cast: existingNotesData.cast || '',
      feedTime: existingNotesData.feedTime || '',
      userNotes: existingNotesData.userNotes || ''
    },
    onSubmit: async ({ value }) => {
      try {
        const finalValue = value.feedItems.map(item => `${item.type} - ${item.quantity}`).join(', ');
        
        const payload: Partial<LogEntry> = {
          id: existingLog?.id || uuidv4(),
          animalId: animal.id,
          logType: LogType.FEED,
          logDate: value.logDate,
          userInitials: value.userInitials.toUpperCase(),
          value: finalValue,
          notes: JSON.stringify({ 
            method: value.method,
            cast: value.cast, 
            feedTime: value.feedTime, 
            userNotes: value.userNotes || '' 
          })
        };
        
        await onSave(payload);
        onCancel();
      } catch (err) {
        console.error("Submission Error:", err);
        alert('Failed to save log');
      }
    }
  });

  return (
    <form onSubmit={(e) => { e.preventDefault(); e.stopPropagation(); form.handleSubmit(); }} className="space-y-6">
      
      <div className="flex flex-col sm:flex-row gap-4 p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
        <div className="flex-1">
          <label className="flex items-center gap-1.5 text-[10px] font-black text-emerald-800 uppercase tracking-widest mb-1">
            <Utensils size={12} /> Record Type
          </label>
          <div className="font-bold text-emerald-900">Feed Log</div>
        </div>
        <form.Field name="logDate">
          {(field) => (
            <div className="flex-1">
              <label className="flex items-center gap-1.5 text-[10px] font-black text-emerald-800 uppercase tracking-widest mb-1">
                <Calendar size={12} /> Date
              </label>
              <input 
                type="date" 
                value={field.state.value} 
                onChange={(e) => field.handleChange(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-emerald-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
          )}
        </form.Field>
      </div>

      <form.Field name="feedItems" validators={{ onChange: feedSchema.shape.feedItems }}>
        {(field) => (
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Food Items</label>
            
            {field.state.value.map((item, index) => (
              <div key={index} className="flex flex-wrap sm:flex-nowrap gap-2 items-start">
                <div className="flex-1 min-w-[150px]">
                  <select 
                    value={item.type} 
                    onChange={e => {
                      const newItems = [...field.state.value];
                      newItems[index].type = e.target.value;
                      field.handleChange(newItems);
                    }} 
                    className={`w-full p-3 bg-white border-2 rounded-xl text-sm font-medium outline-none focus:border-emerald-500 transition-colors ${!item.type && field.state.meta.isTouched ? 'border-red-300' : 'border-slate-200'}`}
                  >
                    <option value="">Select Food...</option>
                    {foodTypes.map(f => <option key={f.id} value={f.value}>{f.value}</option>)}
                  </select>
                </div>
                
                <div className="w-full sm:w-32">
                  <input 
                    type="text" 
                    value={item.quantity} 
                    onChange={e => {
                      const newItems = [...field.state.value];
                      newItems[index].quantity = e.target.value;
                      field.handleChange(newItems);
                    }} 
                    placeholder="Qty (e.g. 2, 50g)" 
                    className={`w-full p-3 bg-white border-2 rounded-xl text-sm font-medium outline-none focus:border-emerald-500 transition-colors ${!item.quantity && field.state.meta.isTouched ? 'border-red-300' : 'border-slate-200'}`} 
                  />
                </div>
                
                {field.state.value.length > 1 && (
                  <button 
                    type="button" 
                    onClick={() => field.handleChange(field.state.value.filter((_, i) => i !== index))} 
                    className="p-3 text-red-500 hover:bg-red-50 rounded-xl border-2 border-transparent hover:border-red-200 transition-colors"
                    title="Remove item"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            ))}
            
            <button 
              type="button" 
              onClick={() => field.handleChange([...field.state.value, { type: '', quantity: '' }])} 
              className="mt-2 w-full sm:w-auto px-4 py-2.5 border-2 border-dashed border-slate-300 rounded-xl text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-emerald-600 hover:border-emerald-300 hover:bg-emerald-50 transition-colors flex items-center justify-center gap-2"
            >
              <Plus size={16} /> Add Another Item
            </button>
            {field.state.meta.errors.length > 0 && <p className="text-xs text-red-500 font-medium mt-2">Please ensure all items have a food type and quantity.</p>}
          </div>
        )}
      </form.Field>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {(isBird || isExotic) && (
          <form.Field name="method">
            {(field) => (
              <div className="sm:col-span-2">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Method of Feeding</label>
                <input 
                  type="text" 
                  value={field.state.value} 
                  onChange={e => field.handleChange(e.target.value)} 
                  className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl font-medium text-sm outline-none focus:border-emerald-500" 
                  placeholder={isBird ? "e.g. Yolked, Gutted, Skinned, Block..." : "e.g. Tongs, Scatter, Bowl..."} 
                />
              </div>
            )}
          </form.Field>
        )}

        {isBird && (
          <form.Field name="cast">
            {(field) => (
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Cast Produced?</label>
                <select 
                  value={field.state.value} 
                  onChange={e => field.handleChange(e.target.value)} 
                  className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl font-medium text-sm outline-none focus:border-emerald-500"
                >
                  <option value="">Select...</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                  <option value="N/A">N/A</option>
                </select>
              </div>
            )}
          </form.Field>
        )}

        <form.Field name="feedTime">
          {(field) => (
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Time of Feed</label>
              <input 
                type="time" 
                value={field.state.value} 
                onChange={e => field.handleChange(e.target.value)} 
                className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl font-medium text-sm outline-none focus:border-emerald-500" 
              />
            </div>
          )}
        </form.Field>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <form.Field name="userInitials" validators={{ onChange: feedSchema.shape.userInitials }}>
          {(field) => (
            <div className="sm:col-span-1">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Staff Initials</label>
              <input 
                type="text" 
                value={field.state.value} 
                onChange={e => field.handleChange(e.target.value.toUpperCase())} 
                className={`w-full p-3 bg-slate-50 border-2 rounded-xl font-bold text-slate-700 outline-none focus:border-emerald-500 transition-colors ${field.state.meta.errors.length ? 'border-red-300 bg-red-50' : 'border-slate-200'}`}
                placeholder="e.g. JD" 
                maxLength={4}
              />
              {field.state.meta.errors.length > 0 && <p className="text-xs text-red-500 mt-1.5 font-medium">{field.state.meta.errors.join(', ')}</p>}
            </div>
          )}
        </form.Field>

        <form.Field name="userNotes">
          {(field) => (
            <div className="sm:col-span-2">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Notes (Optional)</label>
              <input 
                type="text" 
                value={field.state.value} 
                onChange={e => field.handleChange(e.target.value)} 
                className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl font-medium text-sm outline-none focus:border-emerald-500" 
                placeholder="e.g. Left half, supplements added..." 
              />
            </div>
          )}
        </form.Field>
      </div>
      
      <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
        <button type="button" onClick={onCancel} className="px-6 py-3 bg-white border-2 text-slate-600 rounded-xl font-bold uppercase text-xs hover:bg-slate-50 transition-colors">
          Cancel
        </button>
        <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
          {([canSubmit, isSubmitting]) => (
            <button 
              type="submit" 
              disabled={!canSubmit || isSubmitting} 
              className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold uppercase text-xs flex items-center gap-2 hover:bg-emerald-700 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save Record
            </button>
          )}
        </form.Subscribe>
      </div>
    </form>
  );
}
