import React from 'react';
import { X } from 'lucide-react';
import { useForm } from '@tanstack/react-form';
import { zodValidator } from '@tanstack/zod-form-adapter';
import { z } from 'zod';
import { useAuthStore } from '../../store/authStore';
import { Animal, LogType, LogEntry, AnimalCategory } from '../../types';
import { useOperationalLists } from '../../hooks/useOperationalLists';

// Import the Modularized Forms
import WeightForm from './forms/WeightForm';
import FeedForm from './forms/FeedForm';
import TemperatureForm from './forms/TemperatureForm';
import BirthForm from './forms/BirthForm';
import StandardForm from './forms/StandardForm';

interface AddEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (entry: Partial<LogEntry>) => Promise<void>;
  animal: Animal;
  initialType: LogType;
  existingLog?: LogEntry;
  initialDate: string;
  defaultTemperature?: number;
}

export default function AddEntryModal({ isOpen, onClose, onSave, animal, initialType, existingLog, initialDate, defaultTemperature }: AddEntryModalProps) {
  const { currentUser } = useAuthStore();
  
  // Operational Lists for child forms
  const safeCategory = animal?.category || AnimalCategory.MAMMALS;
  const { foodTypes, eventTypes } = useOperationalLists(safeCategory);

  const form = useForm({
    defaultValues: {
      logType: existingLog?.logType || initialType,
      logDate: existingLog?.logDate || initialDate,
      userInitials: existingLog?.userInitials || currentUser?.initials || '',
    },
    validatorAdapter: zodValidator(),
    onSubmit: async ({ value }) => {
      try {
        await onSave(value);
      } catch (err: unknown) {
        console.error('Failed to save log:', err);
        alert('Validation or Database constraints prevented saving this log.');
      }
    },
  });

  if (!isOpen || !animal) return null;

  // Delegate to specific TanStack forms
  const renderSpecificForm = () => {
    const commonProps = {
      animal,
      date: form.getFieldValue('logDate'),
      userInitials: form.getFieldValue('userInitials'),
      existingLog,
      onSave, // Still taking onSave from props, maybe should be handled by form submission?
      onCancel: onClose
    };

    const logType = form.getFieldValue('logType');

    switch (logType) {
      case LogType.WEIGHT:
        return <WeightForm {...commonProps} />;
      case LogType.FEED:
        return <FeedForm {...commonProps} foodTypes={foodTypes} />;
      case LogType.TEMPERATURE:
        return <TemperatureForm {...commonProps} defaultTemperature={defaultTemperature} />;
      case LogType.BIRTH:
        return <BirthForm {...commonProps} />;
      case LogType.EVENT:
      case LogType.HEALTH:
      case LogType.MISTING:
      case LogType.WATER:
      case LogType.GENERAL:
      case LogType.FLIGHT:
      case LogType.TRAINING:
      default:
        return <StandardForm {...commonProps} logType={logType} eventTypes={eventTypes} />;
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">
              {existingLog ? 'Edit' : 'Add'} {form.getFieldValue('logType')}
            </h2>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
              {animal.name} ({animal.species})
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
            <X size={20} />
          </button>
        </div>
        
        {/* Form Body Container */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* Global Router Controls */}
          <div className="grid grid-cols-2 gap-4">
            <form.Field
              name="logDate"
              validators={{
                onChange: z.string().min(1, 'Date is required'),
              }}
              children={(field) => (
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Date</label>
                  <input
                    type="date"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-0 transition-all font-bold text-xs"
                    required
                  />
                  {field.state.meta.errors ? (
                    <em className="text-xs text-red-500 mt-1">{field.state.meta.errors.join(', ')}</em>
                  ) : null}
                </div>
              )}
            />
            <form.Field
              name="logType"
              children={(field) => (
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Type</label>
                  <select
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value as LogType)}
                    disabled={!!existingLog}
                    className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-0 transition-all font-bold text-xs"
                  >
                    {Object.values(LogType).map(type => <option key={type} value={type}>{type}</option>)}
                  </select>
                </div>
              )}
            />
          </div>

          <form.Field
            name="userInitials"
            validators={{
              onChange: z.string().min(2, 'Staff initials must be at least 2 characters'),
            }}
            children={(field) => (
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Staff Initials <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-0 transition-all font-bold text-xs"
                  placeholder="e.g. JD"
                  required
                />
                {field.state.meta.errors ? (
                  <em className="text-xs text-red-500 mt-1">{field.state.meta.errors.join(', ')}</em>
                ) : null}
              </div>
            )}
          />

          {/* Dynamic Form Injection */}
          {renderSpecificForm()}
        </div>
      </div>
    </div>
  );
}
