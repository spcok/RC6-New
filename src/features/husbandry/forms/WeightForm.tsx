import React from 'react';
import { useForm } from '@tanstack/react-form';
import { zodValidator } from '@tanstack/zod-form-adapter';
import { z } from 'zod';
import { Save, Loader2, Calendar, Scale } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { LogType, LogEntry, Animal } from '../../../types';
import { convertToGrams, convertFromGrams } from '../../../services/weightUtils';

// 1. Strict Zod Schema for pure data integrity
const weightSchema = z.object({
  logDate: z.string().min(1, "Date is required"),
  userInitials: z.string().min(2, 'Initials required').max(4, 'Max 4 chars'),
  weightGrams: z.number().positive("Weight must be greater than 0"),
  weightValues: z.object({
    g: z.number(),
    lb: z.number(),
    oz: z.number(),
    eighths: z.number()
  }),
  notes: z.string().optional()
});

interface WeightFormProps {
  animal: Animal;
  date: string; // Passed from parent modal
  userInitials: string; // Passed from auth store
  existingLog?: LogEntry;
  onSave: (entry: Partial<LogEntry>) => Promise<void>;
  onCancel: () => void;
}

export default function WeightForm({ animal, date, userInitials, existingLog, onSave, onCancel }: WeightFormProps) {
  // Determine the primary unit from the animal's profile
  const targetUnit = animal?.weightUnit === 'lbs_oz' ? 'lb' : (animal?.weightUnit === 'oz' ? 'oz' : 'g');

  // 2. Initialize the modern TanStack Form
  const form = useForm({
    validatorAdapter: zodValidator(),
    defaultValues: {
      logDate: existingLog?.logDate || date,
      userInitials: existingLog?.userInitials || userInitials || '',
      weightGrams: existingLog?.weightGrams || 0,
      weightValues: existingLog?.weightGrams 
        ? convertFromGrams(existingLog.weightGrams, targetUnit as 'g' | 'oz' | 'lb') 
        : { g: 0, lb: 0, oz: 0, eighths: 0 },
      notes: existingLog?.notes || ''
    },
    onSubmit: async ({ value }) => {
      try {
        const payload: Partial<LogEntry> = {
          id: existingLog?.id || uuidv4(),
          animalId: animal.id,
          logType: LogType.WEIGHT,
          logDate: value.logDate,
          userInitials: value.userInitials.toUpperCase(),
          weightGrams: value.weightGrams,
          weightUnit: animal.weightUnit,
          value: `${value.weightGrams}g`, // Fallback display string
          notes: value.notes
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
      
      {/* Header Info: Record Type & Date */}
      <div className="flex flex-col sm:flex-row gap-4 p-4 bg-blue-50 border border-blue-100 rounded-xl">
        <div className="flex-1">
          <label className="flex items-center gap-1.5 text-[10px] font-black text-blue-800 uppercase tracking-widest mb-1">
            <Scale size={12} /> Record Type
          </label>
          <div className="font-bold text-blue-900">Weight Log</div>
        </div>
        <form.Field name="logDate">
          {(field) => (
            <div className="flex-1">
              <label className="flex items-center gap-1.5 text-[10px] font-black text-blue-800 uppercase tracking-widest mb-1">
                <Calendar size={12} /> Date
              </label>
              <input 
                type="date" 
                value={field.state.value} 
                onChange={(e) => field.handleChange(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-blue-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          )}
        </form.Field>
      </div>

      {/* Staff Initials */}
      <form.Field name="userInitials" validators={{ onChange: weightSchema.shape.userInitials }}>
        {(field) => (
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Staff Initials</label>
            <input 
              type="text" 
              value={field.state.value} 
              onChange={e => field.handleChange(e.target.value.toUpperCase())} 
              className={`w-32 p-3 bg-slate-50 border-2 rounded-xl font-bold text-slate-700 outline-none focus:border-blue-500 transition-colors ${field.state.meta.errors.length ? 'border-red-300 bg-red-50' : 'border-slate-200'}`}
              placeholder="e.g. JD" 
              maxLength={4}
            />
            {field.state.meta.errors.length > 0 && (
              <p className="text-xs text-red-500 mt-1.5 font-medium">{field.state.meta.errors.join(', ')}</p>
            )}
          </div>
        )}
      </form.Field>

      {/* Dynamic Weight Inputs */}
      <form.Field name="weightValues">
        {(field) => {
          const handleWeightChange = (subField: keyof typeof field.state.value, val: string) => {
            const num = val === '' ? 0 : parseInt(val, 10);
            const newValues = { ...field.state.value, [subField]: num };
            field.handleChange(newValues);
            
            // Automatically calculate and store total grams for the database
            const totalGrams = convertToGrams(targetUnit as 'g' | 'oz' | 'lb', newValues);
            form.setFieldValue('weightGrams', totalGrams);
          };

          return (
            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
              <h4 className="text-sm font-bold text-slate-800 mb-4">Weight Entry ({targetUnit})</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                
                {/* Grams UI */}
                {targetUnit === 'g' && (
                  <div className="sm:col-span-3">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Total Grams</label>
                    <input 
                      type="number" 
                      value={field.state.value.g || ''} 
                      onChange={(e) => handleWeightChange('g', e.target.value)} 
                      className="w-full p-3 bg-white border-2 border-slate-200 rounded-xl text-sm font-medium focus:border-blue-500 outline-none" 
                      placeholder="e.g. 1050" 
                    />
                  </div>
                )}

                {/* Ounces UI */}
                {targetUnit === 'oz' && (
                  <>
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Ounces (oz)</label>
                      <input 
                        type="number" 
                        value={field.state.value.oz || ''} 
                        onChange={(e) => handleWeightChange('oz', e.target.value)} 
                        className="w-full p-3 bg-white border-2 border-slate-200 rounded-xl text-sm font-medium focus:border-blue-500 outline-none" 
                        placeholder="oz" 
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">8ths</label>
                      <select 
                        value={field.state.value.eighths || 0} 
                        onChange={(e) => handleWeightChange('eighths', e.target.value)} 
                        className="w-full p-3 bg-white border-2 border-slate-200 rounded-xl text-sm font-medium focus:border-blue-500 outline-none appearance-none"
                      >
                        {[0,1,2,3,4,5,6,7].map(n => <option key={n} value={n}>{n}/8</option>)}
                      </select>
                    </div>
                  </>
                )}

                {/* Pounds & Ounces UI */}
                {targetUnit === 'lb' && (
                  <>
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Pounds (lb)</label>
                      <input 
                        type="number" 
                        value={field.state.value.lb || ''} 
                        onChange={(e) => handleWeightChange('lb', e.target.value)} 
                        className="w-full p-3 bg-white border-2 border-slate-200 rounded-xl text-sm font-medium focus:border-blue-500 outline-none" 
                        placeholder="lb" 
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Ounces (oz)</label>
                      <select 
                        value={field.state.value.oz || 0} 
                        onChange={(e) => handleWeightChange('oz', e.target.value)} 
                        className="w-full p-3 bg-white border-2 border-slate-200 rounded-xl text-sm font-medium focus:border-blue-500 outline-none appearance-none"
                      >
                        {Array.from({length: 16}, (_, i) => i).map(n => <option key={n} value={n}>{n} oz</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">8ths</label>
                      <select 
                        value={field.state.value.eighths || 0} 
                        onChange={(e) => handleWeightChange('eighths', e.target.value)} 
                        className="w-full p-3 bg-white border-2 border-slate-200 rounded-xl text-sm font-medium focus:border-blue-500 outline-none appearance-none"
                      >
                        {[0,1,2,3,4,5,6,7].map(n => <option key={n} value={n}>{n}/8</option>)}
                      </select>
                    </div>
                  </>
                )}
              </div>
              
              <form.Field name="weightGrams">
                {(gramsField) => (
                  <div className="mt-4 pt-3 border-t border-slate-200 flex justify-between items-center">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Database Value</p>
                     <p className="text-sm font-bold text-slate-600">{gramsField.state.value.toFixed(2)}g</p>
                  </div>
                )}
              </form.Field>
            </div>
          );
        }}
      </form.Field>
      
      {/* Notes Field */}
      <form.Field name="notes">
        {(field) => (
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Notes (Optional)</label>
            <textarea 
              value={field.state.value} 
              onChange={e => field.handleChange(e.target.value)} 
              className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl min-h-[100px] outline-none focus:border-blue-500 transition-colors resize-none" 
              placeholder="e.g. Empty crop, pre-feed, post-flight..."
            />
          </div>
        )}
      </form.Field>
      
      {/* Footer & Submit */}
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
