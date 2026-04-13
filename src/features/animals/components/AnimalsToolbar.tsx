import React, { useState } from 'react';
import { SortingState } from '@tanstack/react-table';
import { Lock, Unlock, SlidersHorizontal, ChevronDown } from 'lucide-react';

interface AnimalsToolbarProps {
  activeTab: 'live' | 'archived';
  setActiveTab: (tab: 'live' | 'archived') => void;
  sorting: SortingState;
  setSorting: (sorting: SortingState) => void;
  isOrderLocked: boolean;
  setIsOrderLocked: (locked: boolean) => void;
  canManageSystem: boolean;
}

export const AnimalsToolbar: React.FC<AnimalsToolbarProps> = ({
  activeTab,
  setActiveTab,
  sorting,
  setSorting,
  isOrderLocked,
  setIsOrderLocked,
  canManageSystem
}) => {
  // Custom Dropdown State
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const currentSortId = sorting.length > 0 ? `${sorting[0].id}-${sorting[0].desc ? 'desc' : 'asc'}` : 'name-asc';

  // Define our available options explicitly
  const sortOptions = [
    ...(activeTab === 'live' ? [{ id: 'customOrder-asc', label: 'Curated Order' }] : []),
    { id: 'name-asc', label: 'Name (A-Z)' },
    { id: 'name-desc', label: 'Name (Z-A)' },
    { id: 'location-asc', label: 'Location (A-Z)' },
    { id: 'location-desc', label: 'Location (Z-A)' },
    { id: 'dispositionStatus-asc', label: 'Status (A-Z)' },
    { id: 'dispositionStatus-desc', label: 'Status (Z-A)' },
  ];

  // Find the label for the currently selected option to display on the button
  const currentLabel = sortOptions.find(opt => opt.id === currentSortId)?.label || 'Sort By...';

  const handleSelectOption = (val: string) => {
    if (val === 'name-asc') setSorting([{ id: 'name', desc: false }]);
    if (val === 'name-desc') setSorting([{ id: 'name', desc: true }]);
    if (val === 'location-asc') setSorting([{ id: 'location', desc: false }]);
    if (val === 'location-desc') setSorting([{ id: 'location', desc: true }]);
    if (val === 'dispositionStatus-asc') setSorting([{ id: 'dispositionStatus', desc: false }]);
    if (val === 'dispositionStatus-desc') setSorting([{ id: 'dispositionStatus', desc: true }]);
    if (val === 'customOrder-asc') setSorting([{ id: 'customOrder', desc: false }]);

    // Safety Catch: Lock UI if they navigate away from Custom Order
    if (val !== 'customOrder-asc') {
      setIsOrderLocked(true);
    }
    
    // Close the dropdown
    setIsDropdownOpen(false);
  };

  return (
    <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4 border-b border-slate-200 pb-4">
      
      {/* 1. Collection Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 xl:pb-0 w-full xl:w-auto">
        {canManageSystem ? (
          <>
            <button
              onClick={() => { 
                setActiveTab('live'); 
                setSorting([{ id: 'customOrder', desc: false }]); 
                setIsOrderLocked(true); 
              }}
              className={`whitespace-nowrap px-6 py-2.5 text-xs uppercase tracking-widest transition-all border-2 ${
                activeTab === 'live' ? 'bg-blue-600 text-white border-blue-600 font-black shadow-lg shadow-blue-200 rounded-xl' : 'text-slate-500 border-transparent hover:bg-slate-100 font-bold rounded-xl'
              }`}
            >
              Live Collection
            </button>
            <button
              onClick={() => { 
                setActiveTab('archived'); 
                setSorting([{ id: 'name', desc: false }]); 
                setIsOrderLocked(true); 
              }}
              className={`whitespace-nowrap px-6 py-2.5 text-xs uppercase tracking-widest transition-all border-2 ${
                activeTab === 'archived' ? 'bg-slate-800 text-white border-slate-800 font-black shadow-lg shadow-slate-200 rounded-xl' : 'text-slate-500 border-transparent hover:bg-slate-100 font-bold rounded-xl'
              }`}
            >
              Archived Records
            </button>
          </>
        ) : (
           <div className="h-[44px]" /> 
        )}
      </div>

      {/* 2. Sort Selector & Padlock Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full xl:w-auto">
        
        {/* TRUE CUSTOM DROPDOWN */}
        <div className="relative w-full sm:w-64 z-30">
          <button 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className={`flex items-center justify-between w-full bg-white border-2 rounded-xl px-4 py-3 text-xs font-black text-slate-700 uppercase tracking-widest shadow-sm transition-colors ${
              isDropdownOpen ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <SlidersHorizontal size={16} className="text-slate-400" />
              <span>{currentLabel}</span>
            </div>
            <ChevronDown size={16} className={`text-slate-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {isDropdownOpen && (
            <>
              {/* Invisible overlay to handle "click outside to close" */}
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setIsDropdownOpen(false)}
              />
              
              {/* The Floating Menu */}
              <div className="absolute top-full left-0 mt-2 w-full bg-white border-2 border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden flex flex-col animate-in fade-in slide-in-from-top-2 duration-150">
                {sortOptions.map(opt => (
                  <button 
                    key={opt.id}
                    onClick={() => handleSelectOption(opt.id)}
                    className={`text-left px-4 py-3 text-xs font-bold uppercase tracking-wider border-b border-slate-100 last:border-0 transition-colors ${
                      currentSortId === opt.id 
                        ? 'bg-emerald-50 text-emerald-700' 
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* The Padlock (Admin + Live Tab + Custom Sort Only) */}
        {activeTab === 'live' && canManageSystem && sorting.length > 0 && sorting[0].id === 'customOrder' && (
          <button
            onClick={() => setIsOrderLocked(!isOrderLocked)}
            className={`w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all border-2 z-20 relative ${
              isOrderLocked
                ? 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                : 'bg-amber-100 text-amber-700 border-amber-300 shadow-lg shadow-amber-200/50 animate-in fade-in zoom-in duration-200'
            }`}
          >
            {isOrderLocked ? <Lock size={16} /> : <Unlock size={16} />}
            {isOrderLocked ? 'Enable Editing' : 'Reorder Active'}
          </button>
        )}
      </div>

    </div>
  );
};
