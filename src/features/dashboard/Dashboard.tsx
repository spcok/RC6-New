import React, { useState } from 'react';
import { AnimalCategory, Animal, LogEntry } from '../../types';
import { Heart, AlertCircle, Plus, Calendar, Scale, Drumstick, ArrowUpDown, Loader2, ClipboardCheck, CheckCircle, ChevronUp, ChevronDown, ChevronRight, Lock, Unlock, GripVertical } from 'lucide-react';
import { formatWeightDisplay, parseLegacyWeightToGrams } from '../../services/weightUtils';
import AnimalFormModal from '../animals/AnimalFormModal';
import { useDashboardData, EnhancedAnimal, PendingTask } from './useDashboardData';
import { usePermissions } from '../../hooks/usePermissions';

import { animalsCollection } from '../../lib/database';

// --- DND-KIT IMPORTS ---
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface DashboardProps {
  onSelectAnimal: (animal: EnhancedAnimal) => void;
  activeTab: AnimalCategory | 'ARCHIVED';
  setActiveTab: (tab: AnimalCategory | 'ARCHIVED') => void;
  viewDate: string;
  setViewDate: (date: string) => void;
}

// -------------------------------------------------------------
// SORTABLE ROW COMPONENT
// -------------------------------------------------------------
interface SortableRowProps {
  animal: EnhancedAnimal;
  activeTab: AnimalCategory | 'ARCHIVED';
  isReorderingEnabled: boolean;
  onSelectAnimal: (animal: EnhancedAnimal) => void;
  getWeightDisplay: (log: LogEntry | undefined, unit: string) => string;
  isExpandedGroupChild?: boolean;
}

const SortableAnimalRow: React.FC<SortableRowProps> = ({
  animal, activeTab, isReorderingEnabled, onSelectAnimal, getWeightDisplay, isExpandedGroupChild
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: animal.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    position: isDragging ? ('relative' as const) : ('static' as const),
    zIndex: isDragging ? 99 : 'auto',
    backgroundColor: isDragging ? '#f8fafc' : undefined,
  };

  return (
    <tr 
      ref={setNodeRef} 
      style={style} 
      className={`hover:bg-slate-50 transition-colors cursor-pointer ${isExpandedGroupChild ? 'bg-slate-50/30' : ''}`} 
      onClick={() => onSelectAnimal(animal)}
    >
      {isReorderingEnabled && (
        <td className="px-1 py-1 w-16">
          {/* touch-none prevents page scrolling when the user tries to drag */}
          <div className="flex items-center justify-center w-full h-full py-2 touch-none cursor-grab active:cursor-grabbing" {...attributes} {...listeners} onClick={(e) => e.stopPropagation()}>
            <GripVertical size={16} className="text-slate-400 hover:text-blue-600 transition-colors" />
          </div>
        </td>
      )}
      <td className={`px-1 py-2 md:px-2 md:py-3 lg:px-4 lg:py-4 text-sm md:text-base font-bold text-slate-900 whitespace-normal break-words min-w-[90px] max-w-[140px] md:max-w-[250px] leading-tight ${isExpandedGroupChild ? 'pl-4 md:pl-8' : ''}`}>
        {isExpandedGroupChild && <span className="text-slate-300 mr-2">↳</span>}
        {animal.name ?? 'Unknown'}
      </td>
      <td className="px-1 py-2 md:px-2 md:py-3 lg:px-4 lg:py-4 text-xs md:text-sm text-slate-500 whitespace-nowrap hidden xl:table-cell">{animal.species ?? 'Unknown'}</td>
      <td className="px-1 py-2 md:px-2 md:py-3 lg:px-4 lg:py-4 text-xs md:text-sm text-slate-400 whitespace-nowrap hidden 2xl:table-cell">{animal.displayId ?? 'N/A'}</td>
      
      {activeTab === 'ARCHIVED' ? (
          <>
              <td className="px-1 py-2 md:px-2 md:py-3 lg:px-4 lg:py-4 text-xs md:text-sm text-slate-600 whitespace-nowrap">{animal.dispositionStatus ?? 'Unknown'}</td>
              <td className="px-1 py-2 md:px-2 md:py-3 lg:px-4 lg:py-4 text-xs md:text-sm text-slate-600 whitespace-nowrap">{animal.archivedAt ? new Date(animal.archivedAt).toLocaleDateString('en-GB') : '-'}</td>
              <td className="px-1 py-2 md:px-2 md:py-3 lg:px-4 lg:py-4 text-xs md:text-sm text-slate-600 whitespace-normal">{animal.archiveReason ?? 'Unknown'}</td>
          </>
      ) : (
          <>
              <td className={`px-1 py-2 md:px-2 md:py-3 lg:px-4 lg:py-4 text-xs md:text-sm text-slate-400 whitespace-nowrap ${activeTab === AnimalCategory.EXOTICS ? 'hidden' : ''}`}>{animal.todayWeight ? getWeightDisplay(animal.todayWeight, animal.weightUnit ?? 'g') : '-'}</td>
              <td className="px-1 py-2 md:px-2 md:py-3 lg:px-4 lg:py-4 text-xs md:text-sm text-slate-400 whitespace-nowrap">{animal.todayFeed ? (typeof animal.todayFeed.value === 'string' ? animal.todayFeed.value : String(animal.todayFeed.value ?? 'Fed')) : '-'}</td>
              <td className={`px-1 py-2 md:px-2 md:py-3 lg:px-4 lg:py-4 text-xs md:text-sm text-slate-400 whitespace-normal leading-tight min-w-[60px] ${activeTab === AnimalCategory.EXOTICS ? 'hidden' : (activeTab === AnimalCategory.OWLS || activeTab === AnimalCategory.RAPTORS ? '' : 'hidden md:table-cell')}`}>{animal.lastFedStr ?? 'N/A'}</td>
              <td className={`px-1 py-2 md:px-2 md:py-3 lg:px-4 lg:py-4 text-xs md:text-sm text-slate-500 whitespace-normal min-w-[90px] ${activeTab === AnimalCategory.EXOTICS ? '' : 'hidden'}`}>
              {animal.nextFeedTask ? (
                  <div className="flex flex-col gap-0.5"><span className="font-bold text-slate-800 text-xs uppercase tracking-tight">{new Date(animal.nextFeedTask.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span><span className="text-[9px] font-black uppercase tracking-widest text-slate-400 leading-tight">{animal.nextFeedTask.notes ?? 'Scheduled'}</span></div>
              ) : <span className="text-slate-300">-</span>}
              </td>
              <td className="px-1 py-2 md:px-2 md:py-3 lg:px-4 lg:py-4 text-xs md:text-sm text-blue-500 whitespace-nowrap hidden md:table-cell">{animal.location ?? 'Unknown'}</td>
          </>
      )}
    </tr>
  );
};


// -------------------------------------------------------------
// MAIN DASHBOARD COMPONENT
// -------------------------------------------------------------
const Dashboard: React.FC<DashboardProps> = ({ 
    onSelectAnimal, activeTab, setActiveTab, viewDate, setViewDate
}) => {
  const permissions = usePermissions();
  const canManageSystem = permissions.isAdmin || permissions.isOwner;

  const dashboardData = useDashboardData(activeTab, viewDate);
  const {
    filteredAnimals,
    animalStats,
    taskStats,
    isLoading,
    sortOption,
    setSortOption, 
    cycleSort,
    isOrderLocked,
    toggleOrderLock
  } = dashboardData;

  const [isCreateAnimalModalOpen, setIsCreateAnimalModalOpen] = useState(false);
  const [isBentoMinimized, setIsBentoMinimized] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const toggleGroup = (groupName: string) => {
    setExpandedGroups(prev => ({ ...prev, [groupName]: !prev[groupName] }));
  };

  // Setup DND Sensors (Touch & Mouse optimized)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Safe Math DND Reorder Handler
  const handleDragEnd = async (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id || !canManageSystem) return;

      const activeId = active.id as string;
      const overId = over.id as string;

      const activeAnimal = filteredAnimals.find(a => a.id === activeId);
      const overAnimal = filteredAnimals.find(a => a.id === overId);

      if (!activeAnimal || !overAnimal || activeAnimal.parentMobId !== overAnimal.parentMobId) return;

      const contextRows = activeAnimal.parentMobId
          ? filteredAnimals.filter(a => a.parentMobId === activeAnimal.parentMobId)
          : filteredAnimals.filter(a => !a.parentMobId);

      const oldIndex = contextRows.findIndex(a => a.id === activeId);
      const newIndex = contextRows.findIndex(a => a.id === overId);

      const newOrder = arrayMove(contextRows, oldIndex, newIndex);
      const updates: Promise<void>[] = [];

      newOrder.forEach((item, index) => {
          const exactOrder = index * 10;
          if (item.customOrder !== exactOrder) {
              updates.push(animalsCollection.update(item.id, (old: Animal) => ({ ...old, customOrder: exactOrder })));
          }
      });

      try {
          await Promise.all(updates);
      } catch (error) {
          console.error("Failed to reorder animals:", error);
      }
  };

  const handleSortSelect = (val: string) => {
      if (setSortOption) {
          setSortOption(val);
      } else {
          cycleSort(); 
      }
      if (val !== 'custom') toggleOrderLock(true);
      setIsDropdownOpen(false);
  };

  const getSortLabel = () => {
    if (sortOption === 'alpha-asc') return 'Name (A-Z)';
    if (sortOption === 'alpha-desc') return 'Name (Z-A)';
    if (sortOption === 'location-asc') return 'Location (A-Z)';
    if (sortOption === 'location-desc') return 'Location (Z-A)';
    return 'Curated Order';
  }


  if (!permissions.view_animals) {
    return (
      <div className="p-8 flex flex-col items-center justify-center h-full min-h-[50vh] space-y-4">
        <div className="p-4 bg-rose-50 text-rose-600 rounded-2xl border border-rose-100 flex flex-col items-center gap-2 max-w-md text-center">
          <Lock size={48} className="opacity-50" />
          <h2 className="text-lg font-bold uppercase tracking-tight">Access Restricted</h2>
          <p className="text-sm font-medium">You do not have permission to view the animal directory.</p>
        </div>
      </div>
    );
  }

  const getWeightDisplay = (log?: { weight?: number; weightUnit?: string; weightGrams?: number; value?: string | number }, unit: 'g' | 'oz' | 'lbs_oz' | 'kg' = 'g') => {
      if (!log) return '-';
      const targetUnit = unit || 'g';
      const grams = log.weightGrams ?? parseLegacyWeightToGrams(String(log.value || ''));
      if (grams !== null && !isNaN(grams)) return formatWeightDisplay(grams, targetUnit as 'g' | 'kg' | 'oz' | 'lbs_oz');
      if (log.weight) return `${log.weight}${log.weightUnit || 'g'}`;
      return typeof log.value === 'string' ? log.value : String(log.value || '-');
  };

  if (isLoading) {
    return (
          <div className="p-8 flex flex-col items-center justify-center h-full min-h-[50vh] space-y-4">
              <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
              <p className="text-sm font-medium text-slate-500">Loading Dashboard...</p>
          </div>
      );
  }

  const isReorderingEnabled = !isOrderLocked && activeTab !== 'ARCHIVED' && canManageSystem && sortOption === 'custom';

  return (
    <div className="space-y-6 pt-4">
      
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 mt-0.5 flex items-center gap-2 text-xs">
            {new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} <span className="text-slate-300">|</span> 🌤️ 14°C Partly Cloudy
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-col transition-all duration-300">
              <div className="flex items-center justify-between cursor-pointer" onClick={() => setIsBentoMinimized(!isBentoMinimized)}>
                  <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg"><ClipboardCheck size={18} /></div>
                      <h2 className="text-base font-semibold text-slate-800">Pending Duties</h2>
                  </div>
                  <div className="flex items-center gap-2">
                      <span className="bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full">{taskStats?.pendingTasks?.length || 0}</span>
                      <button className="text-slate-400 hover:text-slate-600 transition-colors">
                          {isBentoMinimized ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
                      </button>
                  </div>
              </div>
              {!isBentoMinimized && (
                  <div className="mt-3 flex-1 overflow-y-auto max-h-48 pr-2 space-y-2 scrollbar-hide">
                      {(taskStats?.pendingTasks?.length || 0) > 0 ? (
                          (taskStats?.pendingTasks || []).map((t: PendingTask) => (
                              <div key={t.id} className="flex items-start gap-2 p-2 rounded-lg bg-slate-50 border border-slate-100 hover:border-blue-200 hover:bg-white transition-all group">
                                  <div className="mt-1 p-0.5 bg-amber-100 rounded-full">
                                    <AlertCircle size={12} className="text-amber-600 shrink-0"/>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                      <p className="text-xs font-medium text-slate-900 leading-tight truncate">{t.title}</p>
                                      <div className="flex items-center gap-1.5 mt-0.5">
                                        <Calendar size={10} className="text-slate-400" />
                                        <p className="text-[10px] text-slate-500">Due: {t.dueDate ? new Date(t.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : 'N/A'}</p>
                                      </div>
                                  </div>
                              </div>
                          ))
                      ) : (
                          <div className="h-full flex flex-col items-center justify-center text-slate-400 py-6">
                              <div className="p-2 bg-emerald-50 rounded-full mb-2">
                                <CheckCircle size={24} className="text-emerald-500 opacity-80"/>
                              </div>
                              <p className="text-xs font-medium text-slate-500">All Duties Satisfied</p>
                          </div>
                      )}
                  </div>
              )}
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-col transition-all duration-300">
              <div className="flex items-center justify-between cursor-pointer" onClick={() => setIsBentoMinimized(!isBentoMinimized)}>
                  <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-rose-50 text-rose-600 rounded-lg"><Heart size={18} /></div>
                      <h2 className="text-base font-semibold text-slate-800">Health Rota</h2>
                  </div>
                  <div className="flex items-center gap-2">
                      <span className="bg-rose-50 text-rose-700 text-[10px] font-bold px-2 py-0.5 rounded-full">{taskStats?.pendingHealth?.length ?? 0}</span>
                      <button className="text-slate-400 hover:text-slate-600 transition-colors">
                          {isBentoMinimized ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
                      </button>
                  </div>
              </div>
              {!isBentoMinimized && (
                  <div className="mt-3 flex-1 overflow-y-auto max-h-48 pr-2 space-y-2 scrollbar-hide">
                      {(taskStats?.pendingHealth?.length ?? 0) > 0 ? (
                          (taskStats?.pendingHealth || []).map((t: PendingTask) => (
                              <div key={t.id} className="flex items-start gap-2 p-2 rounded-lg bg-rose-50/30 border border-rose-100 hover:border-rose-300 hover:bg-white transition-all group">
                                  <div className="mt-1 p-0.5 bg-rose-100 rounded-full">
                                    <Heart size={12} className="text-rose-600 shrink-0"/>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                      <p className="text-xs font-medium text-slate-900 leading-tight truncate">{t.title}</p>
                                      <div className="flex items-center gap-1.5 mt-0.5">
                                        <Calendar size={10} className="text-slate-400" />
                                        <p className="text-[10px] text-slate-500">Mandatory: {t.dueDate ? new Date(t.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : 'N/A'}</p>
                                      </div>
                                  </div>
                              </div>
                          ))
                      ) : (
                          <div className="h-full flex flex-col items-center justify-center text-slate-400 py-6">
                              <div className="p-2 bg-rose-50 rounded-full mb-2">
                                <Heart size={24} className="text-rose-300 opacity-60"/>
                              </div>
                              <p className="text-xs font-medium text-slate-500">Collection Stable</p>
                          </div>
                      )}
                  </div>
              )}
          </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
        <div className="bg-[#0fa968] rounded-xl p-4 text-white flex justify-between items-center shadow-sm">
          <div>
            <div className="text-[10px] font-medium opacity-90 mb-0.5">Weighed Today</div>
            <div className="text-xl lg:text-2xl font-bold">
              {animalStats?.weighed || 0}<span className="text-xs lg:text-sm opacity-80">/{animalStats?.total || 0}</span>
            </div>
          </div>
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <Scale size={20} className="text-white" />
          </div>
        </div>
        <div className="bg-[#f97316] rounded-xl p-4 text-white flex justify-between items-center shadow-sm">
          <div>
            <div className="text-[10px] font-medium opacity-90 mb-0.5">Fed Today</div>
            <div className="text-xl lg:text-2xl font-bold">
              {animalStats?.fed || 0}<span className="text-xs lg:text-sm opacity-80">/{animalStats?.total || 0}</span>
            </div>
          </div>
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <Drumstick size={20} className="text-white" />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex flex-wrap items-center justify-center gap-3 w-full">
          <div className="flex items-center gap-1.5 text-slate-700 font-medium whitespace-nowrap text-[10px] lg:text-xs">
            <Calendar size={16} className="text-blue-600" />
            Viewing Date:
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <button onClick={() => { const d = new Date(viewDate); d.setDate(d.getDate() - 1); setViewDate(d.toISOString().split('T')[0]); }} className="px-2 py-1 border border-slate-200 rounded-lg text-[10px] lg:text-xs hover:bg-slate-50 whitespace-nowrap flex-1 sm:flex-none text-center">← Prev</button>
            <div className="relative flex-1 sm:flex-none min-w-[120px]">
              <input type="date" value={viewDate} onChange={e => setViewDate(e.target.value)} className="w-full pl-2 pr-8 py-1 border border-slate-200 rounded-lg text-[10px] lg:text-xs focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <Calendar size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
            <button onClick={() => { const d = new Date(viewDate); d.setDate(d.getDate() + 1); setViewDate(d.toISOString().split('T')[0]); }} className="px-2 py-1 border border-slate-200 rounded-lg text-[10px] lg:text-xs hover:bg-slate-50 whitespace-nowrap flex-1 sm:flex-none text-center">Next →</button>
            <button onClick={() => setViewDate(new Date().toISOString().split('T')[0])} className="px-2 py-1 border border-slate-200 rounded-lg text-[10px] lg:text-xs hover:bg-slate-50 whitespace-nowrap flex-1 sm:flex-none text-center">Today</button>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center justify-center gap-1.5 w-full">
            
            <div className="relative z-30">
              <button 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)} 
                className="flex items-center justify-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-lg text-[10px] lg:text-xs font-medium hover:bg-slate-50 text-slate-700 bg-white min-w-[80px]"
              >
                <ArrowUpDown size={14} /> 
                {getSortLabel()}
              </button>
              
              {isDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)} />
                  <div className="absolute top-full left-0 mt-1 w-36 bg-white border border-slate-200 rounded-lg shadow-lg z-50 overflow-hidden flex flex-col py-1">
                    <button onClick={() => handleSortSelect('alpha-asc')} className={`text-left px-3 py-2 text-[10px] lg:text-xs font-medium hover:bg-slate-50 ${sortOption === 'alpha-asc' ? 'text-blue-600 bg-blue-50/50' : 'text-slate-700'}`}>Name (A-Z)</button>
                    <button onClick={() => handleSortSelect('alpha-desc')} className={`text-left px-3 py-2 text-[10px] lg:text-xs font-medium hover:bg-slate-50 ${sortOption === 'alpha-desc' ? 'text-blue-600 bg-blue-50/50' : 'text-slate-700'}`}>Name (Z-A)</button>
                    <button onClick={() => handleSortSelect('location-asc')} className={`text-left px-3 py-2 text-[10px] lg:text-xs font-medium hover:bg-slate-50 ${sortOption === 'location-asc' ? 'text-blue-600 bg-blue-50/50' : 'text-slate-700'}`}>Location (A-Z)</button>
                    <button onClick={() => handleSortSelect('location-desc')} className={`text-left px-3 py-2 text-[10px] lg:text-xs font-medium hover:bg-slate-50 ${sortOption === 'location-desc' ? 'text-blue-600 bg-blue-50/50' : 'text-slate-700'}`}>Location (Z-A)</button>
                    {activeTab !== 'ARCHIVED' && (
                        <button onClick={() => handleSortSelect('custom')} className={`text-left px-3 py-2 text-[10px] lg:text-xs font-medium hover:bg-slate-50 ${sortOption === 'custom' ? 'text-blue-600 bg-blue-50/50' : 'text-slate-700'}`}>Curated Order</button>
                    )}
                  </div>
                </>
              )}
            </div>

            {sortOption === 'custom' && activeTab !== 'ARCHIVED' && canManageSystem && (
              <button onClick={() => toggleOrderLock(!isOrderLocked)} className={`shrink-0 p-2 border border-slate-200 rounded-lg transition-colors ${isOrderLocked ? 'bg-slate-100 text-slate-400 hover:bg-slate-200' : 'bg-amber-100 text-amber-700 border-amber-300 shadow-sm'}`}>
                {isOrderLocked ? <Lock size={14} /> : <Unlock size={14} />}
              </button>
            )}

          {permissions.add_animals && (
            <button onClick={() => setIsCreateAnimalModalOpen(true)} className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-[10px] lg:text-xs font-medium hover:bg-blue-700 shadow-sm whitespace-nowrap w-full sm:w-auto">
              <Plus size={14} /> Add {activeTab ? (activeTab.charAt(0) + activeTab.slice(1).toLowerCase()) : 'Animal'}
            </button>
          )}
        </div>
      </div>

      <div className="flex overflow-x-auto scrollbar-hide bg-slate-100 p-1 rounded-xl gap-0.5 sm:gap-1">
        {[AnimalCategory.OWLS, AnimalCategory.RAPTORS, AnimalCategory.MAMMALS, AnimalCategory.EXOTICS].map(cat => (
          <button
            key={cat}
            onClick={() => setActiveTab(cat)}
            className={`flex-1 min-w-fit sm:min-w-[100px] py-1.5 px-1 sm:py-2 sm:px-4 text-[11px] sm:text-xs lg:text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
              activeTab === cat ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {cat.charAt(0) + cat.slice(1).toLowerCase()}
          </button>
        ))}
        {(permissions.isAdmin || permissions.isOwner) && (
          <button
            onClick={() => setActiveTab('ARCHIVED')}
            className={`shrink-0 sm:flex-1 min-w-[80px] sm:min-w-[100px] py-1.5 px-3 sm:py-2 sm:px-4 text-[11px] sm:text-xs lg:text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'ARCHIVED' ? 'bg-amber-100 text-amber-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Archived
          </button>
        )}
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-lg lg:text-2xl font-semibold text-slate-800">Your {activeTab ? (activeTab.charAt(0) + activeTab.slice(1).toLowerCase()) : 'Animals'}</h2>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="w-full overflow-x-auto overflow-y-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-white border-b border-slate-200 text-slate-600 font-medium">
                <tr>
                  {isReorderingEnabled && (
                    <th className="px-1 py-2 md:px-2 md:py-3 lg:px-4 lg:py-4 text-[11px] md:text-xs whitespace-nowrap w-16">Move</th>
                  )}
                  <th className="px-1 py-2 md:px-2 md:py-3 lg:px-4 lg:py-4 text-[11px] md:text-xs whitespace-normal break-words min-w-[90px] max-w-[140px] md:max-w-[250px] leading-tight">Name</th>
                  <th className="px-1 py-2 md:px-2 md:py-3 lg:px-4 lg:py-4 text-[11px] md:text-xs whitespace-nowrap hidden xl:table-cell">Species</th>
                  <th className="px-1 py-2 md:px-2 md:py-3 lg:px-4 lg:py-4 text-[11px] md:text-xs whitespace-nowrap hidden 2xl:table-cell">Ring/Microchip</th>
                  {activeTab === 'ARCHIVED' ? (
                      <>
                          <th className="px-1 py-2 md:px-2 md:py-3 lg:px-4 lg:py-4 text-[11px] md:text-xs whitespace-nowrap">Status</th>
                          <th className="px-1 py-2 md:px-2 md:py-3 lg:px-4 lg:py-4 text-[11px] md:text-xs whitespace-nowrap">Date Archived</th>
                          <th className="px-1 py-2 md:px-2 md:py-3 lg:px-4 lg:py-4 text-[11px] md:text-xs whitespace-nowrap">Reason</th>
                      </>
                  ) : (
                      <>
                          <th className={`px-1 py-2 md:px-2 md:py-3 lg:px-4 lg:py-4 text-[11px] md:text-xs whitespace-nowrap ${activeTab === AnimalCategory.EXOTICS ? 'hidden' : ''}`}>Today's Weight</th>
                          <th className="px-1 py-2 md:px-2 md:py-3 lg:px-4 lg:py-4 text-[11px] md:text-xs whitespace-nowrap">Today's Feed</th>
                          <th className={`px-1 py-2 md:px-2 md:py-3 lg:px-4 lg:py-4 text-[11px] md:text-xs whitespace-normal leading-tight ${activeTab === AnimalCategory.EXOTICS ? 'hidden' : (activeTab === AnimalCategory.OWLS || activeTab === AnimalCategory.RAPTORS ? '' : 'hidden md:table-cell')}`}>Last Fed</th>
                          <th className={`px-1 py-2 md:px-2 md:py-3 lg:px-4 lg:py-4 text-[11px] md:text-xs whitespace-nowrap ${activeTab === AnimalCategory.EXOTICS ? '' : 'hidden'}`}>Next Feed</th>
                          <th className="px-1 py-2 md:px-2 md:py-3 lg:px-4 lg:py-4 text-[11px] md:text-xs whitespace-nowrap hidden md:table-cell">Location</th>
                      </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(() => {
                  const grouped = new Map<string, EnhancedAnimal[]>();
                  const standalone: EnhancedAnimal[] = [];
                  
                  (filteredAnimals || []).forEach((animal: EnhancedAnimal) => {
                    if (animal.parentMobId) {
                      if (!grouped.has(animal.parentMobId)) {
                        grouped.set(animal.parentMobId, []);
                      }
                      grouped.get(animal.parentMobId)!.push(animal);
                    } else {
                      standalone.push(animal);
                    }
                  });

                  const rows: React.ReactNode[] = [];

                  Array.from(grouped.entries()).forEach(([parentMobId, animals]: [string, EnhancedAnimal[]]) => {
                    const isExpanded = expandedGroups[parentMobId];
                    const parentMob = standalone.find((a: EnhancedAnimal) => a.id === parentMobId);
                    const displayName = parentMob ? parentMob.name : 'Unknown Group';
                    
                    rows.push(
                      <tr key={`group-${parentMobId}`} className="bg-slate-100/50 border-y border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => toggleGroup(parentMobId)}>
                        <td colSpan={isReorderingEnabled ? 10 : 9} className="px-2 py-3 lg:px-4 lg:py-4">
                          <div className="flex items-center gap-2">
                            {isExpanded ? <ChevronDown size={16} className="text-slate-500" /> : <ChevronRight size={16} className="text-slate-500" />}
                            <span className="font-bold text-slate-800">{displayName}</span>
                            <span className="text-xs font-medium text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full">{animals.length} individuals</span>
                          </div>
                        </td>
                      </tr>
                    );

                    if (isExpanded) {
                      const itemIds = animals.map(a => a.id);
                      rows.push(
                        <SortableContext key={`ctx-${parentMobId}`} items={itemIds} strategy={verticalListSortingStrategy}>
                          {animals.map((animal: EnhancedAnimal) => (
                            <SortableAnimalRow 
                                key={animal.id} 
                                animal={animal} 
                                activeTab={activeTab} 
                                isReorderingEnabled={isReorderingEnabled} 
                                onSelectAnimal={onSelectAnimal} 
                                getWeightDisplay={getWeightDisplay} 
                                isExpandedGroupChild={true} 
                            />
                          ))}
                        </SortableContext>
                      );
                    }
                  });

                  const standaloneRows = standalone.filter((a: EnhancedAnimal) => !grouped.has(a.id));
                  if (standaloneRows.length > 0) {
                      const standaloneIds = standaloneRows.map(a => a.id);
                      rows.push(
                        <SortableContext key="ctx-standalone" items={standaloneIds} strategy={verticalListSortingStrategy}>
                          {standaloneRows.map((animal: EnhancedAnimal) => (
                            <SortableAnimalRow 
                                key={animal.id} 
                                animal={animal} 
                                activeTab={activeTab} 
                                isReorderingEnabled={isReorderingEnabled} 
                                onSelectAnimal={onSelectAnimal} 
                                getWeightDisplay={getWeightDisplay} 
                            />
                          ))}
                        </SortableContext>
                      );
                  }

                  return rows;
                })()}
              </tbody>
            </table>
          </div>
        </div>
      </DndContext>
      
      {isCreateAnimalModalOpen && (
          <AnimalFormModal isOpen={isCreateAnimalModalOpen} onClose={() => setIsCreateAnimalModalOpen(false)} />
      )}
    </div>
  );
};

export default Dashboard;
