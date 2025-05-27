
import React, { useState, useCallback, useMemo } from 'react';
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
  ChevronRight
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
  data, 
  columns, 
  enableRowDrag 
}: { 
  data: TableData; 
  columns: TableColumn[];
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
    id: data.key,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

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

  const visibleColumns = columns.filter(col => !col.hidden);

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
      {visibleColumns.map((column) => (
        <td key={column.key} className="px-4 py-4" style={{ width: column.width }}>
          {column.render ? (
            column.render(data[column.dataIndex], data)
          ) : column.dataIndex === 'status' ? (
            <Badge className={`${getStatusColor(data[column.dataIndex])} border`}>
              {data[column.dataIndex]}
            </Badge>
          ) : (
            <span className="text-gray-900">{data[column.dataIndex]}</span>
          )}
        </td>
      ))}
    </tr>
  );
};

// Resizable Header Component
const ResizableHeader = ({ 
  column, 
  onResize, 
  enableResize 
}: { 
  column: TableColumn; 
  onResize: (key: string, width: number) => void;
  enableResize: boolean;
}) => {
  const [isResizing, setIsResizing] = useState(false);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!enableResize) return;
    
    e.preventDefault();
    setIsResizing(true);
    
    const startX = e.clientX;
    const startWidth = column.width || 150;

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = Math.max(80, startWidth + (e.clientX - startX));
      onResize(column.key, newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [column.key, column.width, onResize, enableResize]);

  return (
    <th 
      className="px-4 py-4 text-left font-medium text-white bg-green-500 relative group"
      style={{ width: column.width }}
    >
      <div className="flex items-center justify-between">
        <span>{column.title}</span>
      </div>
      {enableResize && (
        <div
          className={`absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-green-400 transition-colors ${
            isResizing ? 'bg-green-400' : 'bg-transparent'
          } group-hover:bg-green-400/50`}
          onMouseDown={handleMouseDown}
        />
      )}
    </th>
  );
};

// Settings Modal Component
const SettingsModal = ({ 
  columns, 
  onColumnToggle, 
  settings, 
  onSettingsChange 
}: {
  columns: TableColumn[];
  onColumnToggle: (key: string) => void;
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
            </div>
          </div>
          <Separator />
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Column Visibility</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {columns.map((column) => (
                <div key={column.key} className="flex items-center space-x-2">
                  <Checkbox
                    id={column.key}
                    checked={!column.hidden}
                    onCheckedChange={() => onColumnToggle(column.key)}
                  />
                  <label htmlFor={column.key} className="text-sm">
                    {column.title}
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
  const [columns, setColumns] = useState(initialColumns);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [draggedRow, setDraggedRow] = useState<string | null>(null);
  const [settings, setSettings] = useState({
    enableRowDrag,
    enableColumnResize,
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

  // Filter data based on search term
  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    return data.filter(item =>
      Object.values(item).some(value =>
        String(value).toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [data, searchTerm]);

  // Paginate data
  const paginatedData = useMemo(() => {
    if (!pagination) return filteredData;
    const startIndex = (currentPage - 1) * pageSize;
    return filteredData.slice(startIndex, startIndex + pageSize);
  }, [filteredData, currentPage, pageSize, pagination]);

  const totalPages = Math.ceil(filteredData.length / pageSize);

  const handleDragStart = (event: DragStartEvent) => {
    setDraggedRow(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) {
      setDraggedRow(null);
      return;
    }

    const oldIndex = data.findIndex(item => item.key === active.id);
    const newIndex = data.findIndex(item => item.key === over.id);

    if (oldIndex !== newIndex) {
      const newData = arrayMove(data, oldIndex, newIndex);
      setData(newData);
      onDataChange?.(newData);
    }
    setDraggedRow(null);
  };

  const handleColumnResize = useCallback((key: string, width: number) => {
    setColumns(prev => prev.map(col => 
      col.key === key ? { ...col, width } : col
    ));
  }, []);

  const handleColumnToggle = useCallback((key: string) => {
    setColumns(prev => prev.map(col => 
      col.key === key ? { ...col, hidden: !col.hidden } : col
    ));
  }, []);

  const handleSettingsChange = useCallback((key: string, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  const visibleColumns = columns.filter(col => !col.hidden);

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
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
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
              columns={columns}
              onColumnToggle={handleColumnToggle}
              settings={settings}
              onSettingsChange={handleSettingsChange}
            />
            
            {pagination && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Results per page:</span>
                <Select value={pageSize.toString()} onValueChange={(value) => setPageSize(Number(value))}>
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
            <table className="w-full">
              <thead className="bg-green-500">
                <tr className="rounded-t-lg">
                  {settings.enableRowDrag && (
                    <th className="px-4 py-4 text-left font-medium text-white w-12"></th>
                  )}
                  {visibleColumns.map((column) => (
                    <ResizableHeader
                      key={column.key}
                      column={column}
                      onResize={handleColumnResize}
                      enableResize={settings.enableColumnResize}
                    />
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white">
                {settings.enableRowDrag ? (
                  <SortableContext
                    items={paginatedData.map(item => item.key)}
                    strategy={verticalListSortingStrategy}
                  >
                    {paginatedData.map((item) => (
                      <SortableRow
                        key={item.key}
                        data={item}
                        columns={columns}
                        enableRowDrag={settings.enableRowDrag}
                      />
                    ))}
                  </SortableContext>
                ) : (
                  paginatedData.map((item) => (
                    <SortableRow
                      key={item.key}
                      data={item}
                      columns={columns}
                      enableRowDrag={false}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>

          <DragOverlay>
            {draggedRow ? (
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
            Showing {Math.min((currentPage - 1) * pageSize + 1, filteredData.length)} to{' '}
            {Math.min(currentPage * pageSize, filteredData.length)} of {filteredData.length} results
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="border-green-200 hover:border-green-500"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                    className={currentPage === pageNum 
                      ? "bg-green-500 hover:bg-green-600" 
                      : "border-green-200 hover:border-green-500"
                    }
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
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
