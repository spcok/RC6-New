import React, { useState, useMemo } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { createColumnHelper, SortingState } from '@tanstack/react-table';
import { ChevronUp, ChevronDown, GripVertical, Lock, Plus } from 'lucide-react';
import { Animal } from '../../types';
import { usePermissions } from '../../hooks/usePermissions';
import { useAnimalsData } from './useAnimalsData';
import { useArchivedAnimalsData } from './useArchivedAnimalsData';
import { DataTable } from '../../components/ui/DataTable';
import { AnimalsToolbar } from './components/AnimalsToolbar';

// NEW: Import our pristine backend engine
import { useAnimalMutations } from './hooks/useAnimalMutations';

const columnHelper = createColumnHelper<Animal>();

const AnimalsList = () => {
  const [activeTab, setActiveTab] = useState<'live' | 'archived'>('live');
  const [isOrderLocked, setIsOrderLocked] = useState(true);
  const [sorting, setSorting] = useState<SortingState>([{ id: 'customOrder', desc: false }]);
  
  const permissions = usePermissions();
  const navigate = useNavigate();
  
  const { animals } = useAnimalsData(); 
  const { archivedAnimals } = useArchivedAnimalsData();
  
  // NEW: Initialize the mutation engine
  const { moveAnimal } = useAnimalMutations();

  const canManageSystem = permissions.isAdmin || permissions.isOwner;

  const handleTableSortChange = (updaterOrValue: SortingState | ((old: SortingState) => SortingState)) => {
    setSorting(prev => {
      const newSort = typeof updaterOrValue === 'function' ? updaterOrValue(prev) : updaterOrValue;
      if (newSort.length > 0 && newSort[0].id !== 'customOrder') {
        setIsOrderLocked(true);
      }
      return newSort;
    });
  };

  // NEW: The UI now just acts as a simple traffic cop, routing the command to the hook
  const handleArrowClick = useCallback((animal: Animal, direction: 'up' | 'down', visibleRows: Animal[]) => {
    if (!canManageSystem) return;
    const currentIndex = visibleRows.findIndex(a => a.id === animal.id);
    if (currentIndex === -1) return;
    if (direction === 'up' && currentIndex === 0) return; 
    if (direction === 'down' && currentIndex === visibleRows.length - 1) return; 

    const targetAnimal = visibleRows[direction === 'up' ? currentIndex - 1 : currentIndex + 1];
    
    // Fire the optimistic mutation
    moveAnimal({
      animalToMove: animal,
      targetAnimal: targetAnimal,
      direction,
      allVisibleAnimals: visibleRows
    });
  }, [canManageSystem, moveAnimal]);

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
          return (
            <div className="flex items-center justify-center w-full pr-2 text-slate-200 prevent-row-click select-none">
              <Lock size={16} />
            </div>
          );
        }

        const animal = info.row.original;
        const visibleRows = info.table.getSortedRowModel().rows.map(r => r.original);
        
        return (
          <div className="flex items-center justify-between w-full pr-2 prevent-row-click select-none">
            <div className="text-slate-300">
              <GripVertical size={20} />
            </div>
            <div className="flex flex-col items-center justify-center">
              <button 
                onClick={(e) => { e.stopPropagation(); handleArrowClick(animal, 'up', visibleRows); }}
                className="p-1 text-slate-400 hover:text-emerald-600 hover:bg-emerald-100 rounded transition-colors active:scale-95"
              >
                <ChevronUp size={18} strokeWidth={3} />
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); handleArrowClick(animal, 'down', visibleRows); }}
                className="p-1 text-slate-400 hover:text-emerald-600 hover:bg-emerald-100 rounded transition-colors active:scale-95"
              >
                <ChevronDown size={18} strokeWidth={3} />
              </button>
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
            <span className="px-2.5 py-0.5 bg-slate-100 border border-slate-200 text-slate-600 rounded-full font-black uppercase text-[9px] tracking-widest w-fit mb-1 shadow-sm">
              {animal.dispositionStatus || 'Archived'}
            </span>
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
          <button 
             className="flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-emerald-200"
          >
            <Plus size={16} strokeWidth={3} />
            Add Animal
          </button>
        )}
      </div>

      <AnimalsToolbar 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        sorting={sorting}
        setSorting={setSorting}
        isOrderLocked={isOrderLocked}
        setIsOrderLocked={setIsOrderLocked}
        canManageSystem={canManageSystem}
      />

      <DataTable 
        columns={currentColumns as ColumnDef<Animal, unknown>[]} 
        data={currentAnimals} 
        sortingState={sorting}
        onSortingChange={handleTableSortChange}
        columnVisibility={{}}
        onRowClick={(animal) => navigate({ to: '/animals/$id', params: { id: animal.id } })}
        searchPlaceholder={activeTab === 'live' ? "Search live collection..." : "Search archives..."}
      />
      
    </div>
  );
};

export default AnimalsList;
