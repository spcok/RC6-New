import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Animal, LogType } from '../../types';
import WeightForm from './forms/WeightForm';
import FeedForm from './forms/FeedForm';
import TemperatureForm from './forms/TemperatureForm';
import StandardForm from './forms/StandardForm';
import BirthForm from './forms/BirthForm';
import { useDailyLogData } from './useDailyLogData';

interface AddEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (entry: any) => Promise<void>;
  animal?: Animal;
  initialDate?: string;
  defaultLogType?: LogType;
}

export default function AddEntryModal({ isOpen, onClose, onSave, animal, initialDate, defaultLogType = LogType.WEIGHT }: AddEntryModalProps) {
  const [logType, setLogType] = useState<LogType>(defaultLogType);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { getTodayLog } = useDailyLogData(initialDate || new Date().toISOString().split('T')[0], animal?.category || 'all');

  if (!isOpen || !animal) return null;

  const handleSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
        const payload = Array.isArray(data) 
            ? data.map(d => ({ ...d, animalId: animal.id, logDate: initialDate || new Date().toISOString().split('T')[0], logType }))
            : { ...data, animalId: animal.id, logDate: initialDate || new Date().toISOString().split('T')[0], logType };

        await onSave(payload);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderForm = () => {
    const existingWeight = getTodayLog(animal.id, LogType.WEIGHT);
    const existingFeed = getTodayLog(animal.id, LogType.FEED);
    const existingTemp = getTodayLog(animal.id, LogType.TEMPERATURE);

    switch (logType) {
      case LogType.WEIGHT:
        return <WeightForm key={existingWeight?.id || 'w'} onSubmit={handleSubmit} isSubmitting={isSubmitting} onCancel={onClose} animal={animal} existingData={existingWeight} />;
      case LogType.FEED:
        return <FeedForm key={existingFeed?.id || 'f'} onSubmit={handleSubmit} isSubmitting={isSubmitting} onCancel={onClose} animal={animal} existingData={existingFeed} />;
      case LogType.TEMPERATURE:
        return <TemperatureForm key={existingTemp?.id || 't'} onSubmit={handleSubmit} isSubmitting={isSubmitting} onCancel={onClose} existingData={existingTemp} />;
      case LogType.BIRTH:
        return <BirthForm onSubmit={handleSubmit} isSubmitting={isSubmitting} onCancel={onClose} animal={animal} />;
      default:
        return <StandardForm onSubmit={handleSubmit} isSubmitting={isSubmitting} onCancel={onClose} logType={logType} animal={animal} />;
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
