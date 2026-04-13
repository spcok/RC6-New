import { useState, useRef, useEffect } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  flexRender,
  ColumnDef,
  SortingState,
  VisibilityState,
} from '@tanstack/react-table';
import { Search, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { useVirtualizer } from '@tanstack/react-virtual';

declare module '@tanstack/react-table' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData, TValue> {
    className?: string;
  }
}

interface DataTableProps<TData, TValue = unknown> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  pageSize?: number;
  searchPlaceholder?: string;
  onRowClick?: (data: TData) => void;
  defaultSort?: SortingState;
  columnVisibility?: VisibilityState;
  enableDragAndDrop?: boolean;
  onReorder?: (draggedItem: TData, targetItem: TData) => void;
}

export function DataTable<TData, TValue = unknown>({
  columns,
  data,
  pageSize = 10000, 
  searchPlaceholder = "Search records...",
  onRowClick,
  defaultSort = [],
  columnVisibility = {},
  enableDragAndDrop = false,
  onReorder
}: DataTableProps<TData, TValue>) {
  const [globalFilter, setGlobalFilter] = useState('');
  const [sorting, setSorting] = useState<SortingState>(defaultSort);
  const [draggedRowIndex, setDraggedRowIndex] = useState<number | null>(null);
  
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize,
  });

  const defaultSortString = JSON.stringify(defaultSort);
  useEffect(() => {
    if (defaultSort && defaultSort.length > 0) {
      setSorting(JSON.parse(defaultSortString));
    }
  }, [defaultSortString, defaultSort]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    state: {
      sorting,
      pagination,
      globalFilter,
      columnVisibility,
    },
  });

  const parentRef = useRef<HTMLDivElement>(null);
  const rows = table.getRowModel().rows;

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 65,
  });

  const virtualItems = virtualizer.getVirtualItems();

  return (
    <div className="space-y-4">
      <div className="relative w-full md:w-72">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
          <Search size={18} />
        </div>
        <input
          type="text"
          value={globalFilter ?? ''}
          onChange={e => setGlobalFilter(e.target.value)}
          placeholder={searchPlaceholder}
          className="block w-full pl-10 pr-3 py-3 border-2 border-slate-200 rounded-xl leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm transition-all font-bold"
        />
      </div>

      <div 
        className="bg-white border-2 border-slate-200 rounded-xl overflow-auto h-[600px] shadow-sm custom-scrollbar" 
        ref={parentRef}
      >
        <table className="w-full text-left text-sm relative">
          <thead className="sticky top-0 bg-slate-50 border-b-2 border-slate-200 z-20">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th 
                    key={header.id} 
                    className={`px-4 py-4 font-black text-slate-400 uppercase text-[10px] tracking-widest bg-slate-50 select-none border-b-2 border-slate-200 ${header.column.columnDef.meta?.className ?? ''}`}
                  >
                    {header.isPlaceholder ? null : (
                      <div
                        {...{
                          className: header.column.getCanSort() ? 'cursor-pointer flex items-center gap-2 hover:text-slate-700 transition-colors' : '',
                          onClick: header.column.getToggleSortingHandler(),
                        }}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {{
                          asc: <ArrowUp size={14} className="text-emerald-500 shrink-0" />,
                          desc: <ArrowDown size={14} className="text-emerald-500 shrink-0" />,
                        }[header.column.getIsSorted() as string] ?? (header.column.getCanSort() ? <ArrowUpDown size={14} className="text-slate-300 opacity-50 shrink-0" /> : null)}
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody 
            className="divide-y divide-slate-100 relative"
            style={{ height: `${virtualizer.getTotalSize()}px` }}
          >
            {virtualItems.length ? (
              virtualItems.map((virtualRow) => {
                const row = rows[virtualRow.index];
                const isBeingDragged = draggedRowIndex === row.index;
                
                return (
                  <tr 
                    key={row.id} 
                    draggable={enableDragAndDrop}
                    onDragStart={(e) => {
                      if (!enableDragAndDrop) return;
                      setDraggedRowIndex(row.index);
                      e.dataTransfer.effectAllowed = 'move';
                    }}
                    onDragOver={(e) => {
                      if (!enableDragAndDrop) return;
                      e.preventDefault(); 
                      e.dataTransfer.dropEffect = 'move';
                    }}
                    onDrop={(e) => {
                      if (!enableDragAndDrop || draggedRowIndex === null) return;
                      e.preventDefault();
                      const draggedData = rows[draggedRowIndex].original;
                      if (draggedData !== row.original) {
                        onReorder?.(draggedData, row.original);
                      }
                      setDraggedRowIndex(null);
                    }}
                    onDragEnd={() => setDraggedRowIndex(null)}
                    onClick={(e) => {
                      if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('.prevent-row-click')) return;
                      onRowClick?.(row.original);
                    }}
                    className={`transition-colors border-b border-slate-100 bg-white ${onRowClick && !enableDragAndDrop ? 'cursor-pointer hover:bg-slate-50' : 'hover:bg-slate-50'} ${isBeingDragged ? 'opacity-50 bg-emerald-50' : ''}`}
                    style={{ 
                      position: 'absolute', 
                      top: 0, 
                      left: 0, 
                      width: '100%', 
                      height: `${virtualRow.size}px`,
                      transform: `translateY(${virtualRow.start}px)` 
                    }}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td 
                        key={cell.id} 
                        className={`px-4 py-3 text-slate-700 ${cell.column.columnDef.meta?.className ?? ''}`}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={columns.length} className="h-24 text-center text-slate-500 font-medium">
                  No records found matching "{globalFilter}".
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between px-2">
        <div className="text-xs text-slate-500 font-bold uppercase tracking-widest">
          Showing {rows.length} records
        </div>
      </div>
    </div>
  );
}
