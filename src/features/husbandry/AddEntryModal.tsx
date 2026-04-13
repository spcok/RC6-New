import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Animal, LogType, LogEntry } from '../../types';
import WeightForm from './forms/WeightForm';
import FeedForm from './forms/FeedForm';
import TemperatureForm from './forms/TemperatureForm';
import StandardForm from './forms/StandardForm';
import BirthForm from './forms/BirthForm';

interface AddEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (entry: any) => Promise<void>;
  animal?: Animal;
  initialDate?: string;
  defaultLogType?: LogType;
  dailyLogs: LogEntry[]; // Receives the logs directly
}

export default function AddEntryModal({ isOpen, onClose, onSave, animal, initialDate, defaultLogType = LogType.WEIGHT, dailyLogs }: AddEntryModalProps) {
  const [logType, setLogType] = useState<LogType>(defaultLogType);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !animal) return null;

  const handleSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
       await onSave({
          ...data,
          animalId: animal.id,
          logDate: initialDate || new Date().toISOString().split('T')[0],
          logType,
        });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderForm = () => {
    // Finds the exact log safely from the array passed in
    const existingLog = dailyLogs.find(l => l.animalId === animal.id && l.logType === logType);

    // key={existingLog?.id} forces TanStack form to reload with the prefilled data
    switch (logType) {
      case LogType.WEIGHT:
        return <WeightForm key={existingLog?.id || 'w_new'} onSubmit={handleSubmit} isSubmitting={isSubmitting} onCancel={onClose} animal={animal} existingData={existingLog} />;
      case LogType.FEED:
        return <FeedForm key={existingLog?.id || 'f_new'} onSubmit={handleSubmit} isSubmitting={isSubmitting} onCancel={onClose} animal={animal} existingData={existingLog} />;
      case LogType.TEMPERATURE:
      case LogType.MISTING: // Ensure Exotic Misting correctly mounts the Temp form layout
        return <TemperatureForm key={existingLog?.id || 't_new'} onSubmit={handleSubmit} isSubmitting={isSubmitting} onCancel={onClose} existingData={existingLog} logType={logType} />;
      case LogType.BIRTH:
        return <BirthForm onSubmit={handleSubmit} isSubmitting={isSubmitting} onCancel={onClose} animal={animal} />;
      default:
        return <StandardForm key={existingLog?.id || 's_new'} onSubmit={handleSubmit} isSubmitting={isSubmitting} onCancel={onClose} logType={logType} animal={animal} existingData={existingLog} />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Log Data</h2>
            <p className="text-xs font-medium text-slate-500 mt-0.5">{animal.name} ({animal.species})</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-600 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 border-b border-slate-100 overflow-x-auto scrollbar-hide">
          <div className="flex gap-2 min-w-max">
            {Object.values(LogType).filter(type => type !== LogType.SYSTEM).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setLogType(type)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${
                  logType === type ? 'bg-blue-100 text-blue-700 shadow-sm border border-blue-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-transparent'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 overflow-y-auto">
          {renderForm()}
        </div>
      </div>
    </div>
  );
}
