import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useLiveQuery } from '@tanstack/react-db';
import { useAuthStore } from '../../store/authStore';
import { Animal, LogType, LogEntry } from '../../types';
import { useOperationalLists } from '../../hooks/useOperationalLists';
import { usersCollection } from '../../lib/db';

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
  dailyLogs?: LogEntry[];
}

export default function AddEntryModal({ isOpen, onClose, onSave, animal, initialDate, defaultLogType = LogType.WEIGHT, dailyLogs = [] }: AddEntryModalProps) {
  const [logType, setLogType] = useState<LogType>(defaultLogType);
  
  // 1. Get raw session ID
  const authUser = useAuthStore(state => state.user);
  
  // 2. Query TanStack DB directly for the official User Profile & Initials
  const { data: localUsers = [] } = useLiveQuery((q) => q.from({ item: usersCollection }));
  const localDbProfile = localUsers.find((u: any) => u.id === authUser?.id);
  const userInitials = localDbProfile?.initials || authUser?.initials || 'UNK';
  
  // 3. Query TanStack DB (via your hook) for the Operational Lists
  const operationalData = useOperationalLists() || {};
  const safeLists = operationalData.lists || []; 
  
  // 4. Safely filter the database snake_case list types
  const getListType = (l: any) => String(l.listType || l.list_type || '').toLowerCase();
  const foodTypes = safeLists.filter(l => getListType(l) === 'food_type');
  const feedMethods = safeLists.filter(l => getListType(l) === 'feed_method');
  const eventTypes = safeLists.filter(l => getListType(l) === 'event_type').map(l => l.value);

  if (!isOpen || !animal) return null;

  const date = initialDate || new Date().toISOString().split('T')[0];

  const handleSubmit = async (payload: any) => {
    await onSave(payload);
  };

  const renderForm = () => {
    // Find the existing log safely without crashing Vite
    const existingLog = dailyLogs.find(l => l.animalId === animal.id && l.logType === logType);

    switch (logType) {
      case LogType.WEIGHT:
        return <WeightForm key={existingLog?.id || 'w_new'} animal={animal} date={date} userInitials={userInitials} existingLog={existingLog} onSave={handleSubmit} onCancel={onClose} />;
      case LogType.FEED:
        return <FeedForm key={existingLog?.id || 'f_new'} animal={animal} date={date} userInitials={userInitials} existingLog={existingLog} foodTypes={foodTypes} feedMethods={feedMethods} onSave={handleSubmit} onCancel={onClose} />;
      case LogType.TEMPERATURE:
        return <TemperatureForm key={existingLog?.id || 't_new'} animal={animal} date={date} userInitials={userInitials} existingLog={existingLog} onSave={handleSubmit} onCancel={onClose} />;
      case LogType.BIRTH:
        return <BirthForm animal={animal} date={date} userInitials={userInitials} onSave={handleSubmit} onCancel={onClose} />;
      default:
        return <StandardForm key={existingLog?.id || 's_new'} logType={logType} animal={animal} date={date} userInitials={userInitials} existingLog={existingLog} eventTypes={eventTypes} onSave={handleSubmit} onCancel={onClose} />;
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
                  logType === type ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'bg-slate-50 text-slate-500 hover:bg-slate-100 border border-transparent'
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
