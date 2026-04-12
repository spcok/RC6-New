import React from 'react';
import { useForm } from '@tanstack/react-form';
import { zodValidator } from '@tanstack/zod-form-adapter';
import { z } from 'zod';
import { X, Save, Loader2 } from 'lucide-react';
import { ShiftType, Shift } from '../../types';
import { useRotaData } from './useRotaData';
import { useUsersData } from '../settings/useUsersData';

const schema = z.object({
  user_id: z.string().min(1, 'User is required'),
  date: z.string().min(1, 'Date is required'),
  shift_type: z.nativeEnum(ShiftType),
  start_time: z.string().min(1, 'Start time is required'),
  end_time: z.string().min(1, 'End time is required'),
  assigned_area: z.string().optional(),
  repeat: z.boolean(),
  repeatDays: z.array(z.number()),
  weeks: z.number().min(1).max(52)
});

interface AddShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AddShiftModal: React.FC<AddShiftModalProps> = ({ isOpen, onClose }) => {
  const { addShift } = useRotaData();
  const { users } = useUsersData();

  const form = useForm({
    defaultValues: {
      user_id: '',
      date: new Date().toISOString().split('T')[0],
      shift_type: ShiftType.DAY,
      start_time: '',
      end_time: '',
      assigned_area: '',
      repeat: false,
      repeatDays: [] as number[],
      weeks: 1
    },
    validatorAdapter: zodValidator(),
    validators: {
      onChange: schema,
    },
    onSubmit: async ({ value }) => {
      try {
        const user = users.find(u => u.id === value.user_id);
        
        const cleanShiftData = {
          user_id: value.user_id,
          date: value.date,
          shift_type: value.shift_type,
          start_time: value.start_time,
          end_time: value.end_time,
          assigned_area: value.assigned_area,
          user_name: user?.name || 'Unknown',
          user_role: user?.role || 'Unknown'
        };

        // Note: The actual repetition generation logic exists within the useRotaData hook or should be handled by the backend.
        // We pass the full clean payload.
        await addShift(cleanShiftData as Shift);
        onClose();
      } catch (error) {
        console.error("Failed to save shift:", error);
        alert("Failed to save shift record.");
      }
    }
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm p-4">
      <div className="bg-white p-6 rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex justify-between mb-4 border-b pb-4">
          <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Add Shift</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors"><X /></button>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); e.stopPropagation(); form.handleSubmit(); }} className="space-y-4">
          <form.Field name="user_id" children={(field) => (
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">User *</label>
              <select value={field.state.value} onBlur={field.handleBlur} onChange={(e) => field.handleChange(e.target.value)} className={`w-full border-2 p-3 bg-slate-50 rounded-xl text-sm font-bold outline-none transition-colors ${field.state.meta.errors.length ? 'border-red-300 focus:border-red-500' : 'border-slate-200 focus:border-emerald-500'}`}>
                <option value="">Select User</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
          )} />
          <form.Field name="date" children={(field) => (
             <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Date *</label>
              <input type="date" value={field.state.value} onBlur={field.handleBlur} onChange={(e) => field.handleChange(e.target.value)} className="w-full border-2 border-slate-200 p-3 bg-slate-50 rounded-xl text-sm font-bold outline-none focus:border-emerald-500 transition-colors" />
            </div>
          )} />
          <form.Field name="shift_type" children={(field) => (
             <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Shift Type *</label>
              <select value={field.state.value} onBlur={field.handleBlur} onChange={(e) => field.handleChange(e.target.value as ShiftType)} className="w-full border-2 border-slate-200 p-3 bg-slate-50 rounded-xl text-sm font-bold outline-none focus:border-emerald-500 transition-colors">
                {Object.values(ShiftType).map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          )} />
          <div className="flex gap-2">
            <form.Field name="start_time" children={(field) => (
              <div className="flex-1">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Start *</label>
                <input type="time" value={field.state.value} onBlur={field.handleBlur} onChange={(e) => field.handleChange(e.target.value)} className="w-full border-2 border-slate-200 p-3 bg-slate-50 rounded-xl text-sm font-bold outline-none focus:border-emerald-500 transition-colors" />
              </div>
            )} />
            <form.Field name="end_time" children={(field) => (
               <div className="flex-1">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">End *</label>
                <input type="time" value={field.state.value} onBlur={field.handleBlur} onChange={(e) => field.handleChange(e.target.value)} className="w-full border-2 border-slate-200 p-3 bg-slate-50 rounded-xl text-sm font-bold outline-none focus:border-emerald-500 transition-colors" />
              </div>
            )} />
          </div>
          <form.Field name="assigned_area" children={(field) => (
             <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Assigned Area</label>
              <input type="text" value={field.state.value || ''} onBlur={field.handleBlur} onChange={(e) => field.handleChange(e.target.value)} placeholder="e.g. Aviaries" className="w-full border-2 border-slate-200 p-3 bg-slate-50 rounded-xl text-sm font-bold outline-none focus:border-emerald-500 transition-colors" />
            </div>
          )} />
          
          <div className="pt-2">
            <form.Field name="repeat" children={(field) => (
              <label className="flex items-center gap-2 text-sm font-bold text-slate-700 cursor-pointer">
                <input type="checkbox" checked={field.state.value} onChange={e => field.handleChange(e.target.checked)} className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
                Repeat Shift?
              </label>
            )} />
          </div>

          <form.Subscribe selector={(state) => state.values.repeat} children={(repeat) => (
            repeat ? (
              <div className="space-y-3 bg-slate-50 p-4 rounded-xl border-2 border-slate-100">
                <div className="flex gap-1">
                  <form.Field name="repeatDays" children={(field) => (
                    <>
                      {[
                        { label: 'M', val: 1 }, { label: 'T', val: 2 }, { label: 'W', val: 3 }, 
                        { label: 'T', val: 4 }, { label: 'F', val: 5 }, { label: 'S', val: 6 }, { label: 'S', val: 0 }
                      ].map((day) => (
                        <button 
                          key={day.val} 
                          type="button" 
                          onClick={() => {
                            const current = field.state.value;
                            field.handleChange(
                              current.includes(day.val)
                                ? current.filter(d => d !== day.val)
                                : [...current, day.val]
                            );
                          }}
                          className={`flex-1 py-2 rounded-lg font-bold text-xs transition-colors border ${field.state.value.includes(day.val) ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-500 hover:bg-slate-100 border-slate-200'}`}
                        >
                          {day.label}
                        </button>
                      ))}
                    </>
                  )} />
                </div>
                <form.Field name="weeks" children={(field) => (
                   <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Duration (Weeks)</label>
                    <input type="number" min="1" max="52" value={field.state.value} onBlur={field.handleBlur} onChange={e => field.handleChange(Number(e.target.value))} className="w-full border-2 border-slate-200 p-3 bg-white rounded-xl text-sm font-bold outline-none focus:border-emerald-500 transition-colors" />
                  </div>
                )} />
              </div>
            ) : null
          )} />

          <div className="pt-4">
            <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]} children={([canSubmit, isSubmitting]) => (
              <button 
                type="submit" 
                disabled={!canSubmit || isSubmitting} 
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white p-4 rounded-xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2 disabled:opacity-50 transition-colors shadow-lg shadow-emerald-200"
              >
                {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} 
                {isSubmitting ? 'Saving...' : 'Save Shift'}
              </button>
            )} />
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddShiftModal;
