// frontend/src/pages/IntegrationSync.jsx
import { useEffect, useState } from 'react';
import { Database, RefreshCw } from 'lucide-react';
import MainLayout from '../layout/MainLayout.jsx';
import Card from '../components/ui/Card.jsx';
import Table, { statusBadge } from '../components/ui/Table.jsx';
import { integrationService } from '../services/SyncService.js';

export default function IntegrationSync() {
  const [connStatus, setConnStatus] = useState({ sqlserver: {}, mysql: {} });
  const [stats, setStats] = useState({ pending: 0, success: 0, failed: 0 });
  const [activeTab, setActiveTab] = useState('employees');
  const [currentPage, setCurrentPage] = useState(1);
  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(false);
  const pageSize = 5;

  const [pendingEmployees, setPendingEmployees] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [syncing, setSyncing] = useState(false);

  const columnsMap = {
    employees: [
      { key: 'name', label: 'Đối tượng' },
      { key: 'id', label: 'ID' },
      { key: 'hr_dept', label: 'Phòng ban (HR)' },
      { key: 'payroll_dept', label: 'Phòng ban (Payroll)' },
      { key: 'status', label: 'Trạng thái' },
      { key: 'note', label: 'Ghi chú' }
    ],
    departments: [
      { key: 'name', label: 'Phòng ban' },
      { key: 'id', label: 'ID' },
      { key: 'hr_name', label: 'Tên (HR)' },
      { key: 'payroll_name', label: 'Tên (Payroll)' },
      { key: 'status', label: 'Trạng thái' }
    ],
    positions: [
      { key: 'name', label: 'Chức vụ' },
      { key: 'id', label: 'ID' },
      { key: 'hr_name', label: 'Tên (HR)' },
      { key: 'payroll_name', label: 'Tên (Payroll)' },
      { key: 'status', label: 'Trạng thái' }
    ]
  };

  const transformEmployees = (data) => {
    return data.map(item => ({
      name: item.hr_data?.FullName || item.payroll_data?.FullName || '',
      id: item.id,
      hr_dept: item.hr_data?.DepartmentName || '—',
      payroll_dept: item.payroll_data?.DepartmentName || '—',
      status: item.status === 'synced' ? 'Synced' : (item.status === 'missing' ? 'Missing' : 'Mismatch'),
      note: item.status === 'synced' ? 'Đã đồng bộ' : (item.status === 'missing' ? 'Chưa có trong Payroll' : 'Dữ liệu không khớp')
    }));
  };

  const transformDepartments = (data) => {
    return data.map(item => ({
      name: item.hr_data?.DepartmentName || item.payroll_data?.DepartmentName || '',
      id: item.id,
      hr_name: item.hr_data?.DepartmentName || '—',
      payroll_name: item.payroll_data?.DepartmentName || '—',
      status: item.status === 'synced' ? 'Synced' : (item.status === 'missing' ? 'Missing' : 'Mismatch')
    }));
  };

  const transformPositions = (data) => {
    return data.map(item => ({
      name: item.hr_data?.PositionName || item.payroll_data?.PositionName || '',
      id: item.id,
      hr_name: item.hr_data?.PositionName || '—',
      payroll_name: item.payroll_data?.PositionName || '—',
      status: item.status === 'synced' ? 'Synced' : (item.status === 'missing' ? 'Missing' : 'Mismatch')
    }));
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const status = await integrationService.getStatus();
      setConnStatus(status);
      const statsData = await integrationService.getStats();
      setStats({ pending: statsData.pending || 0, success: statsData.success || 0, failed: statsData.failed || 0 });
      if (activeTab === 'employees') {
        const empData = await integrationService.getEmployeeComparison();
        setTableData(transformEmployees(empData));
        setPendingEmployees(empData.filter(item => item.status !== 'synced'));
      } else if (activeTab === 'departments') {
        const deptData = await integrationService.getDepartmentComparison();
        setTableData(transformDepartments(deptData));
        setPendingEmployees([]);
      } else if (activeTab === 'positions') {
        const posData = await integrationService.getPositionComparison();
        setTableData(transformPositions(posData));
        setPendingEmployees([]);
      }
    } catch (err) {
      console.error('Lỗi fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  const triggerSync = async (type = 'all') => {
    setLoading(true);
    try {
      let result;
      if (type === 'all') result = await integrationService.syncAll();
      else if (type === 'departments') result = await integrationService.syncDepartments();
      else if (type === 'positions') result = await integrationService.syncPositions();
      else result = await integrationService.syncEmployees();
      alert(result.message || result.messages?.join('\n') || 'Đã đồng bộ');
      await fetchData();
    } catch (err) {
      alert('Lỗi đồng bộ: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      newSet.has(id) ? newSet.delete(id) : newSet.add(id);
      return newSet;
    });
  };

  const selectAll = () => setSelectedIds(new Set(pendingEmployees.map(item => item.id)));
  const clearSelection = () => setSelectedIds(new Set());

  const syncSelected = async () => {
    if (selectedIds.size === 0) return;
    setSyncing(true);
    let success = 0;
    for (const id of selectedIds) {
      try {
        await integrationService.syncSingleEmployee(id);
        success++;
      } catch (err) {
        console.error(`Lỗi đồng bộ ID ${id}:`, err);
      }
    }
    setSyncing(false);
    setSelectedIds(new Set());
    alert(`Đã đồng bộ thành công ${success}/${selectedIds.size} nhân viên.`);
    await fetchData();
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      integrationService.getStatus().then(setConnStatus).catch(console.error);
    }, 30000);
    return () => clearInterval(interval);
  }, [activeTab]);

  const totalPages = Math.ceil(tableData.length / pageSize);
  const paginatedRows = tableData.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const columns = columnsMap[activeTab];

  const renderCell = (row, col) => {
    if (col.key === 'status') {
      if (row.status === 'Synced') return statusBadge('Synced');
      if (row.status === 'Missing') return <span className="badge badge-red">Chưa đồng bộ</span>;
      if (row.status === 'Mismatch') return <span className="badge badge-warning">Không khớp</span>;
      return <span className="badge">{row.status}</span>;
    }
    return row[col.key];
  };

  const ConnectionBadge = ({ status }) => (
    status === 'connected'
      ? <span className="badge badge-green sync-badge">● Đã kết nối</span>
      : <span className="badge badge-red sync-badge">● Mất kết nối</span>
  );

  return (
    <MainLayout title="Trạng thái Tích hợp & Đồng bộ">
      <div className="section-head page-title">
        <div>
          <h2>Giám sát Đồng bộ Dữ liệu</h2>
          <p>
            <span className={`dot ${connStatus.sqlserver?.status === 'connected' ? 'green' : 'red'}`}></span>
            Hệ thống đồng bộ giữa HUMAN_2025 và PAYROLL.
          </p>
        </div>
        <div>
          <button className="btn ghost" onClick={() => triggerSync('all')} disabled={loading}>
            <RefreshCw /> {loading ? 'Đang xử lý...' : 'Đồng bộ toàn bộ'}
          </button>
        </div>
      </div>

      <div className="sync-grid">
        <Card className="connector">
          <Database />
          <ConnectionBadge status={connStatus.sqlserver?.status} />
          <h2>HUMAN_2025</h2>
          <p>SQL Server</p>
          <small>Latency: {connStatus.sqlserver?.latency_ms ?? '?'} ms</small>
        </Card>
        <Card className="connector">
          <Database />
          <ConnectionBadge status={connStatus.mysql?.status} />
          <h2>PAYROLL</h2>
          <p>MySQL</p>
          <small>Latency: {connStatus.mysql?.latency_ms ?? '?'} ms</small>
        </Card>
        <div className="stack">
          <Card className="mini-sync">Hàng chờ <b>{pendingEmployees.length}</b></Card>
          <Card className="mini-sync green-text">Thành công <b>{stats.success}</b></Card>
          <Card className="mini-sync red-text">Thất bại <b>{stats.failed}</b></Card>
        </div>
      </div>

      <Card>
        <div className="tabs compact">
          <button className={activeTab === 'employees' ? 'active' : ''} onClick={() => { setActiveTab('employees'); setCurrentPage(1); }}>Nhân viên</button>
          <button className={activeTab === 'departments' ? 'active' : ''} onClick={() => { setActiveTab('departments'); setCurrentPage(1); }}>Phòng ban</button>
          <button className={activeTab === 'positions' ? 'active' : ''} onClick={() => { setActiveTab('positions'); setCurrentPage(1); }}>Chức vụ</button>
        </div>
        <Table columns={columns} rows={paginatedRows} renderCell={renderCell} />
        {totalPages > 1 && (
          <div className="pagination-controls" style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
            <button onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage === 1} className="btn-sm">Trước</button>
            <span>Trang {currentPage} / {totalPages}</span>
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} disabled={currentPage === totalPages} className="btn-sm">Sau</button>
          </div>
        )}
      </Card>

      {pendingEmployees.length > 0 && (
        <Card style={{ marginTop: '1.5rem' }}>
          <h2>📋 Hàng chờ đồng bộ ({pendingEmployees.length})</h2>
          {pendingEmployees.length === 0 ? (
            <p style={{ color: 'var(--muted)', textAlign: 'center', padding: '20px' }}>
              Tất cả nhân viên đã được đồng bộ.
            </p>
          ) : (
            <>
              <div style={{ marginBottom: '12px', display: 'flex', gap: '8px' }}>
                <button className="btn ghost" onClick={selectAll}>Chọn tất cả</button>
                <button className="btn ghost" onClick={clearSelection}>Bỏ chọn</button>
                <button className="btn primary" onClick={syncSelected} disabled={selectedIds.size === 0 || syncing}>
                  {syncing ? 'Đang đồng bộ...' : `Đồng bộ (${selectedIds.size})`}
                </button>
              </div>
              <Table
                columns={[
                  { key: 'id', label: 'ID', width: '60px' },
                  { key: 'name', label: 'Họ và tên' },
                  { key: 'hr_dept', label: 'Phòng ban (HR)' },
                  { key: 'note', label: 'Ghi chú' },
                  { key: 'select', label: '', width: '40px' }
                ]}
                rows={pendingEmployees.map(item => ({
                  id: item.id,
                  name: item.hr_data?.FullName || item.payroll_data?.FullName || '—',
                  hr_dept: item.hr_data?.DepartmentName || '—',
                  note: item.status === 'missing' ? 'Chưa có trong Payroll' : 'Dữ liệu khác biệt',
                }))}
                onRowClick={(row) => toggleSelect(row.id)}
                renderCell={(row, col) => {
                  if (col.key === 'select') {
                    return (
                      <input
                        type="checkbox"
                        checked={selectedIds.has(row.id)}
                        onChange={(e) => {
                          e.stopPropagation();
                          toggleSelect(row.id);
                        }}
                        style={{ width: '16px', height: '16px', cursor: 'pointer', margin: 0 }}
                      />
                    );
                  }
                  return row[col.key];
                }}
              />
            </>
          )}
        </Card>
      )}
    </MainLayout>
  );
} 