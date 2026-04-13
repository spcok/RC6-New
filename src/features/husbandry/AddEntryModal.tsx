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
  onSave: (entry: Record<string, any>) => Promise<void>;
  animal?: Animal;
  initialDate?: string;
  defaultLogType?: LogType;
}

export default function AddEntryModal({ isOpen, onClose, onSave, animal, initialDate, defaultLogType = LogType.WEIGHT }: AddEntryModalProps) {
  const [logType, setLogType] = useState<LogType>(defaultLogType);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch the existing logs for this specific animal on this date to populate the forms
  const { getTodayLog, getTodayLogsByType } = useDailyLogData(initialDate || new Date().toISOString().split('T')[0], animal?.category || 'all', animal?.id);

  if (!isOpen || !animal) return null;

  const handleSubmit = async (data: Record<string, any>) => {
    setIsSubmitting(true);
    try {
      // Handle array of entries (like multiple mammal feeds)
      if (Array.isArray(data)) {
         for (const entry of data) {
            await onSave({
              ...entry,
              animalId: animal.id,
              logDate: initialDate || new Date().toISOString().split('T')[0],
              logType,
            });
         }
      } else {
         await onSave({
            ...data,
            animalId: animal.id,
            logDate: initialDate || new Date().toISOString().split('T')[0],
            logType,
          });
      }
      onClose();
    } catch (error) {
      console.error("Failed to save entry", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderForm = () => {
    switch (logType) {
      case LogType.WEIGHT: {
        const existingWeight = getTodayLog(animal.id, LogType.WEIGHT);
        return <WeightForm onSubmit={handleSubmit} isSubmitting={isSubmitting} onCancel={onClose} animal={animal} existingData={existingWeight} />;
      }
      case LogType.FEED: {
        // Feed can have multiple entries now
        const existingFeeds = getTodayLogsByType ? getTodayLogsByType(animal.id, LogType.FEED) : [getTodayLog(animal.id, LogType.FEED)].filter(Boolean);
        return <FeedForm onSubmit={handleSubmit} isSubmitting={isSubmitting} onCancel={onClose} animal={animal} existingData={existingFeeds} />;
      }
      case LogType.TEMPERATURE:
        return <TemperatureForm onSubmit={handleSubmit} isSubmitting={isSubmitting} onCancel={onClose} existingData={getTodayLog(animal.id, LogType.TEMPERATURE)} />;
      case LogType.BIRTH:
        return <BirthForm onSubmit={handleSubmit} isSubmitting={isSubmitting} onCancel={onClose} animal={animal} />;
      default:
        return <StandardForm onSubmit={handleSubmit} isSubmitting={isSubmitting} onCancel={onClose} logType={logType} animal={animal} existingData={getTodayLog(animal.id, logType)} />;
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
