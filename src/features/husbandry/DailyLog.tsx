import React, { useState } from 'react';
import { useDailyLogData } from './useDailyLogData';
import { AnimalCategory, LogType } from '../../types';
import { Search, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import AddEntryModal from './AddEntryModal';
import { getUKLocalDate } from '../../services/temporalService';

import { BirdRow } from './components/BirdRow';
import { MammalRow } from './components/MammalRow';
import { ExoticRow } from './components/ExoticRow';

export default function DailyLog() {
  const [activeTab, setActiveTab] = useState<AnimalCategory | 'all'>(AnimalCategory.OWLS);
  const [viewDate, setViewDate] = useState(getUKLocalDate());
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedAnimal, setSelectedAnimal] = useState<any>(null);
  const [initialLogType, setInitialLogType] = useState<LogType>(LogType.WEIGHT);

  const { animals, dailyLogs, isLoading, addLogEntry, updateLogEntry } = useDailyLogData(viewDate, activeTab);

  // SAFE RETRIEVAL: Prevents Vite crash
  const getTodayLog = (animalId: string, logType: LogType) => {
    return dailyLogs.find(log => log.animalId === animalId && log.logType === logType);
  };

  const handleSaveLog = async (entry: any) => {
    try {
        if (entry.id) {
            await updateLogEntry(entry.id, entry);
        } else {
            await addLogEntry(entry);
        }
        setIsAddModalOpen(false);
        setSelectedAnimal(null);
    } catch (error) {
        console.error('Failed to save log', error);
    }
  };

  const handleCellClick = (animal: any, type: LogType) => {
      setSelectedAnimal(animal);
      setInitialLogType(type);
      setIsAddModalOpen(true);
  };

  const handlePrevDay = () => {
    const d = new Date(viewDate);
    d.setDate(d.getDate() - 1);
    setViewDate(d.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const d = new Date(viewDate);
    d.setDate(d.getDate() + 1);
    setViewDate(d.toISOString().split('T')[0]);
  };

  const filteredAnimals = animals.filter((a: any) => 
    !a.isDeleted && 
    !a.archived && 
    (searchTerm === '' || a.name?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const tabs = [AnimalCategory.OWLS, AnimalCategory.RAPTORS, AnimalCategory.MAMMALS, AnimalCategory.EXOTICS];

  return (
    <div className="space-y-6 pt-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Daily Logs</h1>
          <p className="text-slate-500">Record daily weights, feed, and observations.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handlePrevDay} className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 transition-colors">
            <ChevronLeft size={20} />
          </button>
          <input 
              type="date" 
              value={viewDate} 
              onChange={(e) => setViewDate(e.target.value)} 
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm font-medium"
          />
          <button onClick={handleNextDay} className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 transition-colors">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex overflow-x-auto scrollbar-hide bg-slate-100 p-1 rounded-xl gap-1">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                activeTab === tab ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab.charAt(0) + tab.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
        <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
                type="text" 
                placeholder="Search animals..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg w-full sm:w-64"
            />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-4 py-3 font-bold text-slate-600">Animal</th>
                            <th className="px-4 py-3 font-bold text-slate-600 text-center">Weight</th>
                            <th className="px-4 py-3 font-bold text-slate-600 text-center">Feed</th>
                            <th className="px-4 py-3 font-bold text-slate-600 text-center">Temp/Env</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredAnimals.length === 0 ? (
                            <tr><td colSpan={4} className="p-8 text-center text-slate-500">No animals found.</td></tr>
                        ) : (
                            filteredAnimals.map((animal: any) => {
                                if (animal.category === AnimalCategory.OWLS || animal.category === AnimalCategory.RAPTORS) {
                                    return <BirdRow key={animal.id} animal={animal} getTodayLog={getTodayLog} onCellClick={handleCellClick} />;
                                }
                                if (animal.category === AnimalCategory.MAMMALS) {
                                    return <MammalRow key={animal.id} animal={animal} getTodayLog={getTodayLog} onCellClick={handleCellClick} />;
                                }
                                return <ExoticRow key={animal.id} animal={animal} getTodayLog={getTodayLog} onCellClick={handleCellClick} />;
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
      )}

      {isAddModalOpen && selectedAnimal && (
          <AddEntryModal
              isOpen={isAddModalOpen}
              onClose={() => { setIsAddModalOpen(false); setSelectedAnimal(null); }}
              onSave={handleSaveLog}
              animal={selectedAnimal}
              initialDate={viewDate}
              defaultLogType={initialLogType}
              dailyLogs={dailyLogs}
          />
      )}
    </div>
  );
}
