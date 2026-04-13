import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { createColumnHelper, SortingState } from '@tanstack/react-table';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronUp, ChevronDown, GripVertical, Lock, Unlock, SlidersHorizontal, Plus } from 'lucide-react';
import { Animal } from '../../types';
import { usePermissions } from '../../hooks/usePermissions';
import { useAnimalsData } from './useAnimalsData';
import { useArchivedAnimalsData } from './useArchivedAnimalsData';
import { DataTable } from '../../components/ui/DataTable';
import { animalsCollection } from '../../lib/database';

// ------------------------------------------------------------------
// 1. INLINE TOOLBAR COMPONENT (Bypasses Import Errors)
// ------------------------------------------------------------------
interface ToolbarProps {
  activeTab: 'live' | 'archived';
  setActiveTab: (tab: 'live' | 'archived') => void;
  sorting: SortingState;
  setSorting: (sorting: SortingState) => void;
  isOrderLocked: boolean;
  setIsOrderLocked: (locked: boolean) => void;
  canManageSystem: boolean;
}

const InlineAnimalsToolbar: React.FC<ToolbarProps> = ({
  activeTab, setActiveTab, sorting, setSorting, isOrderLocked, setIsOrderLocked, canManageSystem
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const currentSortId = sorting.length > 0 ? `${sorting[0].id}-${sorting[0].desc ? 'desc' : 'asc'}` : 'name-asc';

  const sortOptions = [
    ...(activeTab === 'live' ? [{ id: 'customOrder-asc', label: 'Curated Order' }] : []),
    { id: 'name-asc', label: 'Name (A-Z)' },
    { id: 'name-desc', label: 'Name (Z-A)' },
    { id: 'location-asc', label: 'Location (A-Z)' },
    { id: 'location-desc', label: 'Location (Z-A)' },
    { id: 'dispositionStatus-asc', label: 'Status (A-Z)' },
    { id: 'dispositionStatus-desc', label: 'Status (Z-A)' },
  ];

  const currentLabel = sortOptions.find(opt => opt.id === currentSortId)?.label || 'Sort By...';

  const handleSelectOption = (val: string) => {
    if (val === 'name-asc') setSorting([{ id: 'name', desc: false }]);
    if (val === 'name-desc') setSorting([{ id: 'name', desc: true }]);
    if (val === 'location-asc') setSorting([{ id: 'location', desc: false }]);
    if (val === 'location-desc') setSorting([{ id: 'location', desc: true }]);
    if (val === 'dispositionStatus-asc') setSorting([{ id: 'dispositionStatus', desc: false }]);
    if (val === 'dispositionStatus-desc') setSorting([{ id: 'dispositionStatus', desc: true }]);
    if (val === 'customOrder-asc') setSorting([{ id: 'customOrder', desc: false }]);

    if (val !== 'customOrder-asc') setIsOrderLocked(true);
    setIsDropdownOpen(false);
  };

  return (
    <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4 border-b border-slate-200 pb-4">
      <div className="flex gap-2 overflow-x-auto pb-2 xl:pb-0 w-full xl:w-auto">
        {canManageSystem ? (
          <>
            <button
              onClick={() => { setActiveTab('live'); setSorting([{ id: 'customOrder', desc: false }]); setIsOrderLocked(true); }}
              className={`whitespace-nowrap px-6 py-2.5 text-xs uppercase tracking-widest transition-all border-2 ${activeTab === 'live' ? 'bg-blue-600 text-white border-blue-600 font-black shadow-lg shadow-blue-200 rounded-xl' : 'text-slate-500 border-transparent hover:bg-slate-100 font-bold rounded-xl'}`}
            >
              Live Collection
            </button>
            <button
              onClick={() => { setActiveTab('archived'); setSorting([{ id: 'name', desc: false }]); setIsOrderLocked(true); }}
              className={`whitespace-nowrap px-6 py-2.5 text-xs uppercase tracking-widest transition-all border-2 ${activeTab === 'archived' ? 'bg-slate-800 text-white border-slate-800 font-black shadow-lg shadow-slate-200 rounded-xl' : 'text-slate-500 border-transparent hover:bg-slate-100 font-bold rounded-xl'}`}
            >
              Archived Records
            </button>
          </>
        ) : <div className="h-[44px]" />}
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full xl:w-auto">
        <div className="relative w-full sm:w-64 z-30">
          <button 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className={`flex items-center justify-between w-full bg-white border-2 rounded-xl px-4 py-3 text-xs font-black text-slate-700 uppercase tracking-widest shadow-sm transition-colors ${isDropdownOpen ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-slate-200 hover:border-slate-300'}`}
          >
            <div className="flex items-center gap-2">
              <SlidersHorizontal size={16} className="text-slate-400" />
              <span>{currentLabel}</span>
            </div>
            <ChevronDown size={16} className={`text-slate-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {isDropdownOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)} />
              <div className="absolute top-full left-0 mt-2 w-full bg-white border-2 border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden flex flex-col animate-in fade-in slide-in-from-top-2 duration-150">
                {sortOptions.map(opt => (
                  <button 
                    key={opt.id} onClick={() => handleSelectOption(opt.id)}
                    className={`text-left px-4 py-3 text-xs font-bold uppercase tracking-wider border-b border-slate-100 last:border-0 transition-colors ${currentSortId === opt.id ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {activeTab === 'live' && canManageSystem && sorting.length > 0 && sorting[0].id === 'customOrder' && (
          <button
            onClick={() => setIsOrderLocked(!isOrderLocked)}
            className={`w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all border-2 z-20 relative ${isOrderLocked ? 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200' : 'bg-amber-100 text-amber-700 border-amber-300 shadow-lg shadow-amber-200/50 animate-in fade-in zoom-in duration-200'}`}
          >
            {isOrderLocked ? <Lock size={16} /> : <Unlock size={16} />}
            {isOrderLocked ? 'Enable Editing' : 'Reorder Active'}
          </button>
        )}
      </div>
    </div>
  );
};

// ------------------------------------------------------------------
// 2. MAIN COMPONENT (Everything Unified)
// ------------------------------------------------------------------
const columnHelper = createColumnHelper<Animal>();

const AnimalsList = () => {
  const [activeTab, setActiveTab] = useState<'live' | 'archived'>('live');
  const [isOrderLocked, setIsOrderLocked] = useState(true);
  const [sorting, setSorting] = useState<SortingState>([{ id: 'customOrder', desc: false }]);
  
  const permissions = usePermissions();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const { animals } = useAnimalsData(); 
  const { archivedAnimals } = useArchivedAnimalsData();
  const canManageSystem = permissions.isAdmin || permissions.isOwner;

  // INLINE MUTATION ENGINE (Bypasses hook import issues)
  const moveAnimalMutation = useMutation({
    mutationFn: async ({ animalToMove, targetAnimal }: { animalToMove: Animal, targetAnimal: Animal }) => {
      const orderA = animalToMove.customOrder ?? 0;
      const orderB = targetAnimal.customOrder ?? 0;
      if (orderA === orderB) {
        await animalsCollection.update(animalToMove.id, (old: Animal) => ({ ...old, customOrder: orderB - 5 }));
      } else {
        await animalsCollection.update(animalToMove.id, (old: Animal) => ({ ...old, customOrder: orderB }));
        await animalsCollection.update(targetAnimal.id, (old: Animal) => ({ ...old, customOrder: orderA }));
      }
    },
    onMutate: async ({ animalToMove, targetAnimal, allVisibleAnimals }: { animalToMove: Animal, targetAnimal: Animal, allVisibleAnimals: Animal[] }) => {
      await queryClient.cancelQueries({ queryKey: ['animals'] });
      const previousAnimals = queryClient.getQueryData<Animal[]>(['animals']);
      const indexA = allVisibleAnimals.findIndex((a: Animal) => a.id === animalToMove.id);
      const indexB = allVisibleAnimals.findIndex((a: Animal) => a.id === targetAnimal.id);
      const optimisticOrderA = targetAnimal.customOrder ?? (indexB * 10);
      const optimisticOrderB = animalToMove.customOrder ?? (indexA * 10);

      queryClient.setQueryData<Animal[]>(['animals'], (old) => {
        if (!old) return old;
        return old.map(animal => {
          if (animal.id === animalToMove.id) return { ...animal, customOrder: optimisticOrderA };
          if (animal.id === targetAnimal.id) return { ...animal, customOrder: optimisticOrderB };
          return animal;
        });
      });
      return { previousAnimals };
    },
    onError: (err, newTodo, context: { previousAnimals: Animal[] } | undefined) => {
      if (context?.previousAnimals) queryClient.setQueryData(['animals'], context.previousAnimals);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['animals'] });
    },
  });

  const handleTableSortChange = (updaterOrValue: SortingState | ((old: SortingState) => SortingState)) => {
    setSorting(prev => {
      const newSort = typeof updaterOrValue === 'function' ? updaterOrValue(prev) : updaterOrValue;
      if (newSort.length > 0 && newSort[0].id !== 'customOrder') setIsOrderLocked(true);
      return newSort;
    });
  };

  const handleArrowClick = useCallback((animal: Animal, direction: 'up' | 'down', visibleRows: Animal[]) => {
    if (!canManageSystem) return;
    const currentIndex = visibleRows.findIndex(a => a.id === animal.id);
    if (currentIndex === -1) return;
    if (direction === 'up' && currentIndex === 0) return; 
    if (direction === 'down' && currentIndex === visibleRows.length - 1) return; 

    const targetAnimal = visibleRows[direction === 'up' ? currentIndex - 1 : currentIndex + 1];
    moveAnimalMutation.mutate({ animalToMove: animal, targetAnimal, allVisibleAnimals: visibleRows });
  }, [canManageSystem, moveAnimalMutation]);

  const liveColumns = useMemo(() => [
    columnHelper.accessor('customOrder', {
      header: 'Move',
      sortingFn: (rowA, rowB, columnId) => {
        const a = rowA.getValue<number>(columnId) ?? (rowA.index * 10);
        const b = rowB.getValue<number>(columnId) ?? (rowB.index * 10);
        return a - b;
      },
      cell: info => {
        if (isOrderLocked) {
          return <div className="flex items-center justify-center w-full pr-2 text-slate-200 prevent-row-click select-none"><Lock size={16} /></div>;
        }
        const animal = info.row.original;
        const visibleRows = info.table.getSortedRowModel().rows.map(r => r.original);
        
        return (
          <div className="flex items-center justify-between w-full pr-2 prevent-row-click select-none">
            <div className="text-slate-300"><GripVertical size={20} /></div>
            <div className="flex flex-col items-center justify-center">
              <button onClick={(e) => { e.stopPropagation(); handleArrowClick(animal, 'up', visibleRows); }} className="p-1 text-slate-400 hover:text-emerald-600 hover:bg-emerald-100 rounded transition-colors active:scale-95"><ChevronUp size={18} strokeWidth={3} /></button>
              <button onClick={(e) => { e.stopPropagation(); handleArrowClick(animal, 'down', visibleRows); }} className="p-1 text-slate-400 hover:text-emerald-600 hover:bg-emerald-100 rounded transition-colors active:scale-95"><ChevronDown size={18} strokeWidth={3} /></button>
            </div>
          </div>
        );
      },
      enableSorting: true,
      meta: { className: 'w-24 bg-slate-50 border-r border-slate-200' }
    }),
    columnHelper.accessor('name', {
      header: 'Animal Identity',
      cell: info => {
        const animal = info.row.original;
        return (
          <div className="flex flex-col py-1">
            <div className="flex items-center gap-2">
              <span className="font-black text-slate-900">{animal.name || 'Unknown'}</span>
              {animal.isBoarding && <span className="px-2 py-0.5 bg-orange-100 text-orange-800 text-[9px] font-black rounded-full uppercase tracking-widest shadow-sm border border-orange-200">Boarding</span>}
            </div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wide mt-0.5">{animal.species || 'Unknown Species'}</div>
          </div>
        );
      },
      enableSorting: true,
      sortingFn: 'text'
    }),
    columnHelper.accessor('location', {
      header: 'Location',
      cell: info => <span className="font-bold text-slate-700">{info.getValue() || '—'}</span>,
      enableSorting: true,
      sortingFn: 'text',
      meta: { className: 'hidden sm:table-cell' }
    }),
    columnHelper.accessor('dispositionStatus', {
      header: 'Status',
      cell: info => <span className="px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-black rounded-full uppercase tracking-widest shadow-sm">{info.getValue() || 'Active'}</span>,
      enableSorting: true,
      sortingFn: 'text',
      meta: { className: 'hidden md:table-cell' }
    })
  ], [isOrderLocked, handleArrowClick]);

  const archivedColumns = useMemo(() => [
    columnHelper.accessor('name', {
      header: 'Animal Identity',
      cell: info => {
        const animal = info.row.original;
        return (
          <div className="flex flex-col py-1">
            <span className="font-black text-slate-900">{animal.name || 'Unknown'}</span>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wide mt-0.5">{animal.species || animal.category || 'Unknown Group'}</div>
          </div>
        );
      },
      enableSorting: true,
      sortingFn: 'text'
    }),
    columnHelper.accessor('archiveReason', {
      header: 'Archive Event Details',
      cell: info => {
        const animal = info.row.original;
        return (
          <div className="flex flex-col py-1">
            <span className="px-2.5 py-0.5 bg-slate-100 border border-slate-200 text-slate-600 rounded-full font-black uppercase text-[9px] tracking-widest w-fit mb-1 shadow-sm">{animal.dispositionStatus || 'Archived'}</span>
            <div className="text-xs font-medium text-slate-600 truncate max-w-xs">{info.getValue() || 'Unknown Reason'}</div>
          </div>
        );
      },
      enableSorting: false,
      meta: { className: 'hidden sm:table-cell' }
    }),
    columnHelper.accessor('archivedAt', {
      header: 'Event Date',
      cell: info => {
        const animal = info.row.original;
        const date = animal.dateOfDeath || animal.dispositionDate || animal.archivedAt;
        return <div className="text-xs font-black text-slate-700">{date ? new Date(date).toLocaleDateString('en-GB') : '—'}</div>;
      },
      enableSorting: true,
      sortingFn: 'datetime',
      meta: { className: 'hidden md:table-cell' }
    })
  ], []);

  const currentAnimals = activeTab === 'live' ? animals : archivedAnimals;
  const currentColumns = activeTab === 'live' ? liveColumns : archivedColumns;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Animals Directory</h1>
          <p className="text-sm font-bold text-slate-500 mt-1">Manage and view the animal collection.</p>
        </div>
        {canManageSystem && (
          <button className="flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-emerald-200">
            <Plus size={16} strokeWidth={3} /> Add Animal
          </button>
        )}
      </div>

      <InlineAnimalsToolbar 
        activeTab={activeTab} setActiveTab={setActiveTab}
        sorting={sorting} setSorting={setSorting}
        isOrderLocked={isOrderLocked} setIsOrderLocked={setIsOrderLocked}
        canManageSystem={canManageSystem}
      />

      <DataTable 
        columns={currentColumns as ColumnDef<Animal, unknown>[]} 
        data={currentAnimals} 
        sortingState={sorting} onSortingChange={handleTableSortChange}
        columnVisibility={{}}
        onRowClick={(animal) => navigate({ to: '/animals/$id', params: { id: animal.id } })}
        searchPlaceholder={activeTab === 'live' ? "Search live collection..." : "Search archives..."}
      />
    </div>
  );
};

export default AnimalsList;
