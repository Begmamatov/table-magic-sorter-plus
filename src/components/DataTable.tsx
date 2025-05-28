
import React, { useState, useCallback, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
  ColumnDef,
  Row,
} from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { 
  Filter, 
  Settings, 
  GripVertical, 
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export interface TableColumn {
  key: string;
  title: string;
  dataIndex: string;
  width?: number;
  hidden?: boolean;
  render?: (value: any, record: any) => React.ReactNode;
}

export interface TableData {
  key: string;
  status?: string;
  email?: string;
  department?: string;
  experience?: number;
  name?: string;
  [key: string]: any;
}

interface DataTableProps {
  columns: TableColumn[];
  data: TableData[];
  onDataChange?: (data: TableData[]) => void;
  enableRowDrag?: boolean;
  enableColumnResize?: boolean;
  searchable?: boolean;
  filterable?: boolean;
  pagination?: boolean;
}

// Sortable Row Component
const SortableRow = ({ 
  row, 
  enableRowDrag 
}: { 
  row: Row<TableData>; 
  enableRowDrag: boolean;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: row.original.key,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={`border-b border-green-100 hover:bg-green-50/30 transition-colors ${
        isDragging ? 'shadow-lg bg-white' : ''
      }`}
    >
      {enableRowDrag && (
        <td className="px-4 py-4 text-center w-12">
          <div {...listeners} className="cursor-grab hover:cursor-grabbing">
            <GripVertical className="h-4 w-4 text-gray-400 hover:text-green-500 transition-colors" />
          </div>
        </td>
      )}
      {row.getVisibleCells().map((cell) => (
        <td key={cell.id} className="px-4 py-4" style={{ width: cell.column.getSize() }}>
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </td>
      ))}
    </tr>
  );
};

// Sortable Column Header Component
const SortableColumnHeader = ({ 
  header,
  enableColumnDrag,
  enableColumnResize
}: { 
  header: any;
  enableColumnDrag: boolean;
  enableColumnResize: boolean;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: header.id,
    disabled: !enableColumnDrag,
  });

  const [isResizing, setIsResizing] = useState(false);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    width: header.getSize(),
  };

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!enableColumnResize) return;
    
    e.preventDefault();
    setIsResizing(true);
    
    const startX = e.clientX;
    const startWidth = header.getSize();
    
    const handleMouseMove = (e: MouseEvent) => {
      const diff = e.clientX - startX;
      const newWidth = Math.max(100, startWidth + diff);
      header.column.resetSize();
      header.column.setSize(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [enableColumnResize, header]);

  return (
    <th 
      ref={setNodeRef}
      style={style}
      {...(enableColumnDrag ? attributes : {})}
      className={`px-4 py-4 text-left font-medium text-white bg-green-500 relative group ${
        isDragging ? 'shadow-lg bg-green-600' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="flex items-center gap-2 cursor-pointer select-none"
            onClick={header.column.getToggleSortingHandler()}
          >
            <span>
              {flexRender(header.column.columnDef.header, header.getContext())}
            </span>
            {header.column.getCanSort() && (
              <div className="flex flex-col">
                {header.column.getIsSorted() === 'asc' ? (
                  <ArrowUp className="h-3 w-3" />
                ) : header.column.getIsSorted() === 'desc' ? (
                  <ArrowDown className="h-3 w-3" />
                ) : (
                  <ArrowUpDown className="h-3 w-3" />
                )}
              </div>
            )}
          </div>
          {enableColumnDrag && (
            <div {...listeners} className="cursor-grab hover:cursor-grabbing">
              <GripVertical className="h-3 w-3 text-white/70 hover:text-white transition-colors" />
            </div>
          )}
        </div>
        {enableColumnResize && (
          <div
            className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize bg-transparent hover:bg-white/20 transition-colors"
            onMouseDown={handleMouseDown}
            style={{ cursor: isResizing ? 'col-resize' : 'col-resize' }}
          />
        )}
      </div>
    </th>
  );
};

// Settings Modal Component
const SettingsModal = ({ 
  table,
  settings, 
  onSettingsChange 
}: {
  table: any;
  settings: any;
  onSettingsChange: (key: string, value: boolean) => void;
}) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="border-green-200 hover:border-green-500">
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-green-700">Table Settings</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Features</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Row Drag & Drop</span>
                <Switch
                  checked={settings.enableRowDrag}
                  onCheckedChange={(checked) => onSettingsChange('enableRowDrag', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Column Resize</span>
                <Switch
                  checked={settings.enableColumnResize}
                  onCheckedChange={(checked) => onSettingsChange('enableColumnResize', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Column Drag & Drop</span>
                <Switch
                  checked={settings.enableColumnDrag}
                  onCheckedChange={(checked) => onSettingsChange('enableColumnDrag', checked)}
                />
              </div>
            </div>
          </div>
          <Separator />
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Column Visibility</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {table.getAllLeafColumns().map((column: any) => (
                <div key={column.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={column.id}
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) => column.toggleVisibility(!!value)}
                  />
                  <label htmlFor={column.id} className="text-sm">
                    {typeof column.columnDef.header === 'string' ? column.columnDef.header : column.id}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export const DataTable: React.FC<DataTableProps> = ({
  columns: initialColumns,
  data: initialData,
  onDataChange,
  enableRowDrag = false,
  enableColumnResize = false,
  searchable = true,
  filterable = true,
  pagination = true,
}) => {
  const [data, setData] = useState(initialData);
  const [globalFilter, setGlobalFilter] = useState('');
  const [draggedRow, setDraggedRow] = useState<string | null>(null);
  const [draggedColumn, setDraggedColumn] = useState<string | null>(null);
  const [columnOrder, setColumnOrder] = useState<string[]>(initialColumns.map(col => col.key));
  const [columnSizing, setColumnSizing] = useState<Record<string, number>>(() => {
    const sizing: Record<string, number> = {};
    initialColumns.forEach(col => {
      sizing[col.key] = col.width || 150;
    });
    return sizing;
  });
  const [settings, setSettings] = useState({
    enableRowDrag,
    enableColumnResize,
    enableColumnDrag: true,
  });

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 300,
        tolerance: 8,
      },
    }),
  );

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'inactive':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  // Convert columns to TanStack format with proper ordering
  const tanstackColumns = useMemo<ColumnDef<TableData>[]>(() => {
    const orderedColumns = columnOrder.map(key => 
      initialColumns.find(col => col.key === key)
    ).filter(Boolean) as TableColumn[];

    return orderedColumns.map((col) => ({
      id: col.key,
      accessorKey: col.dataIndex,
      header: col.title,
      size: columnSizing[col.key] || col.width || 150,
      enableResizing: settings.enableColumnResize,
      cell: ({ getValue, row }) => {
        const value = getValue();
        if (col.render) {
          return col.render(value, row.original);
        }
        if (col.dataIndex === 'status') {
          return (
            <Badge className={`${getStatusColor(value as string)} border`}>
              {value as string}
            </Badge>
          );
        }
        return <span className="text-gray-900">{value as string}</span>;
      },
    }));
  }, [initialColumns, columnOrder, columnSizing, settings.enableColumnResize]);

  const table = useReactTable({
    data,
    columns: tanstackColumns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    globalFilterFn: 'includesString',
    enableColumnResizing: settings.enableColumnResize,
    columnResizeMode: 'onChange',
    state: {
      globalFilter,
      columnOrder,
      columnSizing,
    },
    onGlobalFilterChange: setGlobalFilter,
    onColumnOrderChange: setColumnOrder,
    onColumnSizingChange: setColumnSizing,
    initialState: {
      pagination: {
        pageSize: 15,
      },
    },
  });

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    
    // Check if it's a column being dragged
    const isColumn = table.getAllLeafColumns().some((col: any) => col.id === active.id);
    
    if (isColumn) {
      setDraggedColumn(active.id as string);
    } else {
      setDraggedRow(active.id as string);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) {
      setDraggedRow(null);
      setDraggedColumn(null);
      return;
    }

    if (draggedColumn) {
      // Handle column reordering
      const oldIndex = columnOrder.findIndex(id => id === active.id);
      const newIndex = columnOrder.findIndex(id => id === over.id);

      if (oldIndex !== newIndex) {
        const newColumnOrder = arrayMove(columnOrder, oldIndex, newIndex);
        setColumnOrder(newColumnOrder);
      }
    } else if (draggedRow) {
      // Handle row reordering
      const oldIndex = data.findIndex(item => item.key === active.id);
      const newIndex = data.findIndex(item => item.key === over.id);

      if (oldIndex !== newIndex) {
        const newData = arrayMove(data, oldIndex, newIndex);
        setData(newData);
        onDataChange?.(newData);
      }
    }

    setDraggedRow(null);
    setDraggedColumn(null);
  };

  const handleSettingsChange = useCallback((key: string, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <Card className="p-6 border-green-100">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            {searchable && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search..."
                  value={globalFilter}
                  onChange={(e) => setGlobalFilter(e.target.value)}
                  className="pl-10 w-64 border-green-200 focus:border-green-500"
                />
              </div>
            )}
            {filterable && (
              <Button variant="outline" size="sm" className="border-green-200 hover:border-green-500">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            )}
          </div>
          
          <div className="flex items-center gap-4">
            <SettingsModal
              table={table}
              settings={settings}
              onSettingsChange={handleSettingsChange}
            />
            
            {pagination && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Results per page:</span>
                <Select 
                  value={table.getState().pagination.pageSize.toString()} 
                  onValueChange={(value) => table.setPageSize(Number(value))}
                >
                  <SelectTrigger className="w-20 border-green-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden border-green-100">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="overflow-x-auto">
            <table className="w-full" style={{ width: table.getTotalSize() }}>
              <thead className="bg-green-500">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {settings.enableRowDrag && (
                      <th className="px-4 py-4 text-left font-medium text-white w-12"></th>
                    )}
                    {settings.enableColumnDrag ? (
                      <SortableContext
                        items={headerGroup.headers.map(header => header.id)}
                        strategy={horizontalListSortingStrategy}
                      >
                        {headerGroup.headers.map((header) => (
                          <SortableColumnHeader
                            key={header.id}
                            header={header}
                            enableColumnDrag={settings.enableColumnDrag}
                            enableColumnResize={settings.enableColumnResize}
                          />
                        ))}
                      </SortableContext>
                    ) : (
                      headerGroup.headers.map((header) => (
                        <SortableColumnHeader
                          key={header.id}
                          header={header}
                          enableColumnDrag={false}
                          enableColumnResize={settings.enableColumnResize}
                        />
                      ))
                    )}
                  </tr>
                ))}
              </thead>
              <tbody className="bg-white">
                {settings.enableRowDrag ? (
                  <SortableContext
                    items={table.getRowModel().rows.map(row => row.original.key)}
                    strategy={verticalListSortingStrategy}
                  >
                    {table.getRowModel().rows.map((row) => (
                      <SortableRow
                        key={row.original.key}
                        row={row}
                        enableRowDrag={settings.enableRowDrag}
                      />
                    ))}
                  </SortableContext>
                ) : (
                  table.getRowModel().rows.map((row) => (
                    <SortableRow
                      key={row.original.key}
                      row={row}
                      enableRowDrag={false}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>

          <DragOverlay>
            {draggedColumn ? (
              <div className="bg-green-500 text-white p-4 rounded-lg shadow-lg border border-green-200">
                <span className="text-white font-medium">
                  {table.getAllLeafColumns().find((col: any) => col.id === draggedColumn)?.columnDef.header}
                </span>
              </div>
            ) : draggedRow ? (
              <div className="bg-white p-4 rounded-lg shadow-lg border border-green-200">
                <span className="text-gray-600">Moving row...</span>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </Card>

      {/* Pagination */}
      {pagination && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{' '}
            {Math.min((table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize, table.getFilteredRowModel().rows.length)} of {table.getFilteredRowModel().rows.length} results
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="border-green-200 hover:border-green-500"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, table.getPageCount()) }, (_, i) => {
                const currentPage = table.getState().pagination.pageIndex;
                const totalPages = table.getPageCount();
                let pageNum;
                
                if (totalPages <= 5) {
                  pageNum = i;
                } else if (currentPage <= 2) {
                  pageNum = i;
                } else if (currentPage >= totalPages - 3) {
                  pageNum = totalPages - 5 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => table.setPageIndex(pageNum)}
                    className={currentPage === pageNum 
                      ? "bg-green-500 hover:bg-green-600" 
                      : "border-green-200 hover:border-green-500"
                    }
                  >
                    {pageNum + 1}
                  </Button>
                );
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="border-green-200 hover:border-green-500"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
