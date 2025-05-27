
import React, { useState, useCallback, useMemo } from 'react';
import { Table, Button, Input, Select, Badge, Card, Modal, Switch, Checkbox, Space, Divider } from 'antd';
import { 
  FilterOutlined, 
  SettingOutlined, 
  HolderOutlined, 
  SearchOutlined 
} from '@ant-design/icons';
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
  children, 
  enableRowDrag, 
  ...props 
}: { 
  children: React.ReactNode;
  enableRowDrag: boolean;
  [key: string]: any;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: props['data-row-key'],
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    backgroundColor: isDragging ? '#f0f9ee' : undefined,
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...props}
      className={`${props.className || ''} ${isDragging ? 'shadow-lg' : ''}`}
    >
      {enableRowDrag && (
        <td {...listeners} className="text-center cursor-grab hover:cursor-grabbing">
          <HolderOutlined className="text-green-500" />
        </td>
      )}
      {children}
    </tr>
  );
};

// Sortable Column Header Component
const SortableColumnHeader = ({ 
  children, 
  column, 
  enableColumnDrag,
  ...props 
}: { 
  children: React.ReactNode;
  column: TableColumn;
  enableColumnDrag: boolean;
  [key: string]: any;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: column.key,
    disabled: !enableColumnDrag,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <th
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...props}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span>{children}</span>
        {enableColumnDrag && (
          <HolderOutlined
            {...listeners}
            className="cursor-grab hover:cursor-grabbing text-white ml-2"
            style={{ fontSize: '12px' }}
          />
        )}
      </div>
    </th>
  );
};

// Settings Modal Component
const SettingsModal = ({ 
  open,
  onClose,
  columns, 
  onColumnToggle, 
  settings, 
  onSettingsChange 
}: {
  open: boolean;
  onClose: () => void;
  columns: TableColumn[];
  onColumnToggle: (key: string) => void;
  settings: any;
  onSettingsChange: (key: string, value: boolean) => void;
}) => {
  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <SettingOutlined style={{ marginRight: 8 }} />
          Table Settings
        </div>
      }
      open={open}
      onCancel={onClose}
      footer={[
        <Button key="close" onClick={onClose}>
          Close
        </Button>,
      ]}
      width={600}
    >
      <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
        {/* Features Settings */}
        <div style={{ marginBottom: 24, padding: 16, border: '1px solid #f0f0f0', borderRadius: 6 }}>
          <div style={{ fontWeight: 600, marginBottom: 12, color: '#2dc492' }}>Features</div>
          <Space direction="vertical" style={{ width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Row Drag & Drop</span>
              <Switch
                checked={settings.enableRowDrag}
                onChange={(checked) => onSettingsChange('enableRowDrag', checked)}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Column Drag & Drop</span>
              <Switch
                checked={settings.enableColumnDrag}
                onChange={(checked) => onSettingsChange('enableColumnDrag', checked)}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Column Resize</span>
              <Switch
                checked={settings.enableColumnResize}
                onChange={(checked) => onSettingsChange('enableColumnResize', checked)}
              />
            </div>
          </Space>
        </div>

        <Divider />

        {/* Column Visibility */}
        <div style={{ marginBottom: 24, padding: 16, border: '1px solid #f0f0f0', borderRadius: 6 }}>
          <div style={{ fontWeight: 600, marginBottom: 12, color: '#2dc492' }}>Column Visibility</div>
          <Space direction="vertical" style={{ width: '100%' }}>
            {columns.map((column) => (
              <div key={column.key} style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                padding: 8,
                border: '1px solid #f0f0f0',
                borderRadius: 4,
                marginBottom: 8
              }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <Checkbox
                    checked={!column.hidden}
                    onChange={() => onColumnToggle(column.key)}
                  />
                  <span style={{ marginLeft: 8 }}>{column.title}</span>
                </div>
              </div>
            ))}
          </Space>
        </div>
      </div>
    </Modal>
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
  const [draggedColumn, setDraggedColumn] = useState<string | null>(null);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
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

  // Filter data based on search term
  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    return data.filter(item =>
      Object.values(item).some(value =>
        String(value).toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [data, searchTerm]);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    
    // Check if it's a column being dragged
    const isColumn = columns.some(col => col.key === active.id);
    
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
      const oldIndex = columns.findIndex(col => col.key === active.id);
      const newIndex = columns.findIndex(col => col.key === over.id);

      if (oldIndex !== newIndex) {
        const newColumns = arrayMove(columns, oldIndex, newIndex);
        setColumns(newColumns);
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

  const handleColumnToggle = useCallback((key: string) => {
    setColumns(prev => prev.map(col => 
      col.key === key ? { ...col, hidden: !col.hidden } : col
    ));
  }, []);

  const handleSettingsChange = useCallback((key: string, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return { color: '#52c41a', backgroundColor: '#f6ffed', borderColor: '#b7eb8f' };
      case 'inactive':
        return { color: '#ff4d4f', backgroundColor: '#fff2f0', borderColor: '#ffccc7' };
      default:
        return { color: '#595959', backgroundColor: '#fafafa', borderColor: '#d9d9d9' };
    }
  };

  const visibleColumns = columns.filter(col => !col.hidden);

  // Prepare Ant Design columns
  const antColumns = useMemo(() => {
    let cols: any[] = [];

    // Add drag handle column for rows if enabled
    if (settings.enableRowDrag) {
      cols.push({
        key: 'drag-handle',
        title: '',
        width: 50,
        className: 'text-center',
        render: () => null, // Handled by SortableRow
      });
    }

    // Add visible columns
    const processedColumns = visibleColumns.map((column) => ({
      ...column,
      onHeaderCell: () => ({
        column,
        enableColumnDrag: settings.enableColumnDrag,
      }),
      render: (value: any, record: any) => {
        if (column.render) {
          return column.render(value, record);
        }
        if (column.dataIndex === 'status') {
          const statusStyle = getStatusColor(value);
          return (
            <Badge 
              style={statusStyle}
              text={value}
            />
          );
        }
        return value;
      },
    }));

    cols = [...cols, ...processedColumns];
    return cols;
  }, [visibleColumns, settings]);

  const components = {
    header: {
      cell: (props: any) => {
        const { column, enableColumnDrag, ...restProps } = props;
        if (column?.key === 'drag-handle') {
          return <th {...restProps} />;
        }
        return (
          <SortableColumnHeader
            column={column}
            enableColumnDrag={enableColumnDrag}
            {...restProps}
          />
        );
      },
    },
    body: {
      row: (props: any) => (
        <SortableRow 
          enableRowDrag={settings.enableRowDrag} 
          {...props} 
        />
      ),
    },
  };

  return (
    <div style={{ padding: '20px 0' }}>
      {/* Header Controls */}
      <Card style={{ marginBottom: 24, border: '1px solid #2dc492' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {searchable && (
              <Input
                placeholder="Search..."
                prefix={<SearchOutlined />}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ width: 250 }}
              />
            )}
            {filterable && (
              <Button 
                icon={<FilterOutlined />}
                style={{ borderColor: '#2dc492', color: '#2dc492' }}
              >
                Filter
              </Button>
            )}
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Button
              onClick={() => setSettingsModalOpen(true)}
              icon={<SettingOutlined />}
              style={{ borderColor: '#2dc492', color: '#2dc492' }}
            >
              Settings
            </Button>
            
            {pagination && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>Results per page:</span>
                <Select 
                  value={pageSize} 
                  onChange={setPageSize}
                  style={{ width: 80 }}
                >
                  <Select.Option value={15}>15</Select.Option>
                  <Select.Option value={25}>25</Select.Option>
                  <Select.Option value={50}>50</Select.Option>
                  <Select.Option value={100}>100</Select.Option>
                </Select>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Table */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {settings.enableColumnDrag ? (
          <SortableContext
            items={visibleColumns.map(col => col.key)}
            strategy={horizontalListSortingStrategy}
          >
            {settings.enableRowDrag ? (
              <SortableContext
                items={filteredData.map(item => item.key)}
                strategy={verticalListSortingStrategy}
              >
                <Table
                  components={components}
                  columns={antColumns}
                  dataSource={filteredData}
                  rowKey="key"
                  pagination={pagination ? {
                    current: currentPage,
                    pageSize: pageSize,
                    total: filteredData.length,
                    onChange: setCurrentPage,
                    showSizeChanger: false,
                    style: { marginTop: 16 }
                  } : false}
                  style={{
                    backgroundColor: 'white',
                    borderRadius: 8,
                    overflow: 'hidden'
                  }}
                />
              </SortableContext>
            ) : (
              <Table
                components={components}
                columns={antColumns}
                dataSource={filteredData}
                rowKey="key"
                pagination={pagination ? {
                  current: currentPage,
                  pageSize: pageSize,
                  total: filteredData.length,
                  onChange: setCurrentPage,
                  showSizeChanger: false,
                  style: { marginTop: 16 }
                } : false}
                style={{
                  backgroundColor: 'white',
                  borderRadius: 8,
                  overflow: 'hidden'
                }}
              />
            )}
          </SortableContext>
        ) : settings.enableRowDrag ? (
          <SortableContext
            items={filteredData.map(item => item.key)}
            strategy={verticalListSortingStrategy}
          >
            <Table
              components={components}
              columns={antColumns}
              dataSource={filteredData}
              rowKey="key"
              pagination={pagination ? {
                current: currentPage,
                pageSize: pageSize,
                total: filteredData.length,
                onChange: setCurrentPage,
                showSizeChanger: false,
                style: { marginTop: 16 }
              } : false}
              style={{
                backgroundColor: 'white',
                borderRadius: 8,
                overflow: 'hidden'
              }}
            />
          </SortableContext>
        ) : (
          <Table
            components={components}
            columns={antColumns}
            dataSource={filteredData}
            rowKey="key"
            pagination={pagination ? {
              current: currentPage,
              pageSize: pageSize,
              total: filteredData.length,
              onChange: setCurrentPage,
              showSizeChanger: false,
              style: { marginTop: 16 }
            } : false}
            style={{
              backgroundColor: 'white',
              borderRadius: 8,
              overflow: 'hidden'
            }}
          />
        )}

        <DragOverlay>
          {draggedColumn ? (
            <div style={{
              background: '#2dc492',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '6px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            }}>
              {columns.find(col => col.key === draggedColumn)?.title}
            </div>
          ) : draggedRow ? (
            <div style={{
              background: 'white',
              padding: '8px 16px',
              borderRadius: '6px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              border: '1px solid #2dc492',
            }}>
              Moving row...
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <SettingsModal
        open={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        columns={columns}
        onColumnToggle={handleColumnToggle}
        settings={settings}
        onSettingsChange={handleSettingsChange}
      />
    </div>
  );
};
