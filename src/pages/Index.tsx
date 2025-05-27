
import React from 'react';
import { DataTable, TableColumn, TableData } from '@/components/DataTable';

const Index = () => {
  // Sample data matching the image
  const sampleData: TableData[] = [
    {
      key: '1',
      status: 'active',
      email: 'alisher@example.com',
      department: 'it',
      experience: 25,
      name: 'Alisher Karimov'
    },
    {
      key: '2',
      status: 'active',
      email: 'nigora@example.com',
      department: 'hr',
      experience: 30,
      name: 'Nigora Ergasheva'
    },
    {
      key: '3',
      status: 'inactive',
      email: 'jahongir@example.com',
      department: 'marketing',
      experience: 28,
      name: 'Jahongir Tursunov'
    },
    {
      key: '4',
      status: 'active',
      email: 'malika@example.com',
      department: 'design',
      experience: 22,
      name: 'Malika Nazarova'
    },
    {
      key: '5',
      status: 'active',
      email: 'bobur@example.com',
      department: 'it',
      experience: 27,
      name: 'Bobur Usmonov'
    }
  ];

  const columns: TableColumn[] = [
    {
      key: 'status',
      title: 'Status',
      dataIndex: 'status',
      width: 120,
    },
    {
      key: 'email',
      title: 'Email',
      dataIndex: 'email',
      width: 200,
    },
    {
      key: 'department',
      title: "Bo'lim",
      dataIndex: 'department',
      width: 150,
    },
    {
      key: 'experience',
      title: 'Yosh',
      dataIndex: 'experience',
      width: 100,
    },
    {
      key: 'name',
      title: 'Ism',
      dataIndex: 'name',
      width: 200,
    },
  ];

  const [data, setData] = React.useState(sampleData);

  const handleDataChange = (newData: TableData[]) => {
    setData(newData);
    console.log('Data updated:', newData);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Employee Management</h1>
          <p className="text-gray-600">
            Advanced data table with drag & drop, resizable columns, and customizable features
          </p>
        </div>
        
        <DataTable
          columns={columns}
          data={data}
          onDataChange={handleDataChange}
          enableRowDrag={true}
          enableColumnResize={true}
          searchable={true}
          filterable={true}
          pagination={true}
        />
      </div>
    </div>
  );
};

export default Index;
