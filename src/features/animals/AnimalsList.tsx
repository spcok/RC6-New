import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { createColumnHelper, ColumnDef } from '@tanstack/react-table';
import { ChevronUp, ChevronDown, Lock, Unlock, GripVertical } from 'lucide-react';
import { Animal } from '../../types';
import { usePermissions } from '../../hooks/usePermissions';
import { useAnimalsData } from './useAnimalsData';
import { useArchivedAnimalsData } from './useArchivedAnimalsData';
import { DataTable } from '../../components/ui/DataTable';
import { animalsCollection } from '../../lib/database';

const columnHelper = createColumnHelper<Animal>();

const AnimalsList = () => {
  const [activeTab, setActiveTab] = useState<'live' | 'archived'>('live');
  const [isOrderLocked, setIsOrderLocked] = useState(true); // The Safety Catch State
  
  const permissions = usePermissions();
  const navigate = useNavigate();
  
  const { animals } = useAnimalsData(); 
  const { archivedAnimals } = useArchivedAnimalsData();

  const canViewArchived = permissions.isAdmin || permissions.isOwner;

  // Handles both Mobile Up/Down button clicks AND Desktop Drag-and-Drop drops
  const handleSwapOrder = useCallback(async (animalA: Animal, animalB: Animal) => {
    if (animalA.id === animalB.id) return;

    // Provide a stable mathematical fallback if they've never been ordered
    const indexA = animals.findIndex(a => a.id === animalA.id);
    const indexB = animals.findIndex(a => a.id === animalB.id);
    
    const orderA = animalA.customOrder ?? (indexA * 10);
    const orderB = animalB.customOrder ?? (indexB * 10);

    try {
      if (orderA === orderB) {
         // Edge case resolver
         await animalsCollection.update(animalA.id, (old: Animal) => ({ ...old, customOrder: orderB - 5 }));
      } else {
         await animalsCollection.update(animalA.id, (old: Animal) => ({ ...old, customOrder: orderB }));
         await animalsCollection.update(animalB.id, (old: Animal) => ({ ...old, customOrder: orderA }));
      }
    } catch (error) {
      console.error("Failed to reorder animals:", error);
    }
  }, [animals]);

  const handleArrowMove = useCallback((animal: Animal, direction: 'up' | 'down', visibleRows: Animal[]) => {
    const currentIndex = visibleRows.findIndex(a => a.id === animal.id);
    if (currentIndex === -1) return;
    if (direction === 'up' && currentIndex === 0) return; 
    if (direction === 'down' && currentIndex === visibleRows.length - 1) return; 

    const targetAnimal = visibleRows[direction === 'up' ? currentIndex - 1 : currentIndex + 1];
    handleSwapOrder(animal, targetAnimal);
  }, [handleSwapOrder]);

  const liveColumns = useMemo(() => [
    columnHelper.accessor('customOrder', {
      header: 'Order',
      sortingFn: (rowA, rowB, columnId) => {
        const a = rowA.getValue<number>(columnId) ?? (rowA.index * 10);
        const b = rowB.getValue<number>(columnId) ?? (rowB.index * 10);
        return a - b;
      },
      cell: info => {
        const animal = info.row.original;
        const visibleRows = info.table.getSortedRowModel().rows.map(r => r.original);
        
        return (
          <div className="flex items-center gap-1 prevent-row-click">
            {/* Desktop Drag Handle */}
            <div className="hidden md:flex cursor-grab active:cursor-grabbing p-1 text-slate-300 hover:text-slate-600 transition-colors">
              <GripVertical size={18} />
            </div>
            {/* Mobile Fallback Buttons */}
            <div className="flex flex-col items-center justify-center">
              <button 
                onClick={(e) => { e.stopPropagation(); handleArrowMove(animal, 'up', visibleRows); }}
                className="p-1 text-slate-300 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
              >
                <ChevronUp size={16} strokeWidth={3} />
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); handleArrowMove(animal, 'down', visibleRows); }}
                className="p-1 text-slate-300 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
              >
                <ChevronDown size={16} strokeWidth={3} />
              </button>
            </div>
          </div>
        );
      },
      enableSorting: true,
      meta: { className: 'w-24' }
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
      sortingFn: 'text'
    }),
    columnHelper.accessor('location', {
      header: 'Enclosure',
      cell: info => <span className="font-bold text-slate-700">{info.getValue() || '—'}</span>,
      sortingFn: 'text',
      meta: { className: 'hidden sm:table-cell' }
    }),
    columnHelper.accessor('dispositionStatus', {
      header: 'Status',
      cell: info => <span className="px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-black rounded-full uppercase tracking-widest shadow-sm">{info.getValue() || 'Active'}</span>,
      sortingFn: 'text',
      meta: { className: 'hidden md:table-cell' }
    })
  ], [animals, handleArrowMove]);

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
      meta: { className: 'hidden sm:table-cell' }
    }),
    columnHelper.accessor('archivedAt', {
      header: 'Event Date',
      cell: info => {
        const animal = info.row.original;
        const date = animal.dateOfDeath || animal.dispositionDate || animal.archivedAt;
        return <div className="text-xs font-black text-slate-700">{date ? new Date(date).toLocaleDateString('en-GB') : '—'}</div>;
      },
      sortingFn: 'datetime',
      meta: { className: 'hidden md:table-cell' }
    })
  ], []);

  const currentAnimals = activeTab === 'live' ? animals : archivedAnimals;
  const currentColumns = activeTab === 'live' ? liveColumns : archivedColumns;
  
  // Dynamic Sorting: If unlocked, forcefully sort by customOrder. If locked, maintain Name sort or default.
  const defaultSortState = activeTab === 'live' 
    ? (isOrderLocked ? [{ id: 'name', desc: false }] : [{ id: 'customOrder', desc: false }])
    : [{ id: 'name', desc: false }];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Animals Directory</h1>
          <p className="text-sm font-bold text-slate-500 mt-1">Manage and view the animal collection.</p>
        </div>

        {/* The Safety Catch UI */}
        {activeTab === 'live' && (
          <button
            onClick={() => setIsOrderLocked(!isOrderLocked)}
            className={`flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all border-2 ${
              isOrderLocked
                ? 'bg-white text-slate-400 border-slate-200 hover:bg-slate-50 hover:text-slate-600'
                : 'bg-amber-100 text-amber-700 border-amber-300 shadow-lg shadow-amber-200/50'
            }`}
          >
            {isOrderLocked ? <Lock size={16} /> : <Unlock size={16} />}
            {isOrderLocked ? 'Enable Reordering' : 'Reorder Mode Active'}
          </button>
        )}
      </div>

      {canViewArchived && (
        <div className="flex gap-2 border-b border-slate-200 pb-4 overflow-x-auto">
          <button
            onClick={() => { setActiveTab('live'); setIsOrderLocked(true); }}
            className={`px-6 py-2.5 text-xs uppercase tracking-widest transition-all border-2 ${
              activeTab === 'live' ? 'bg-blue-600 text-white border-blue-600 font-black shadow-lg shadow-blue-200 rounded-xl' : 'text-slate-500 border-transparent hover:bg-slate-100 font-bold rounded-xl'
            }`}
          >
            Live Collection
          </button>
          <button
            onClick={() => { setActiveTab('archived'); setIsOrderLocked(true); }}
            className={`px-6 py-2.5 text-xs uppercase tracking-widest transition-all border-2 ${
              activeTab === 'archived' ? 'bg-slate-800 text-white border-slate-800 font-black shadow-lg shadow-slate-200 rounded-xl' : 'text-slate-500 border-transparent hover:bg-slate-100 font-bold rounded-xl'
            }`}
          >
            Archived Records
          </button>
        </div>
      )}

      <DataTable 
        columns={currentColumns as ColumnDef<Animal, unknown>[]} 
        data={currentAnimals} 
        defaultSort={defaultSortState}
        // TanStack Column Visibility Control
        columnVisibility={{ customOrder: !isOrderLocked }}
        // Drag Engine Integration
        enableDragAndDrop={!isOrderLocked}
        onReorder={handleSwapOrder}
        onRowClick={(animal) => navigate({ to: '/animals/$id', params: { id: animal.id } })}
        searchPlaceholder={activeTab === 'live' ? "Search live collection..." : "Search archives..."}
      />
    </div>
  );
};

export default AnimalsList;
