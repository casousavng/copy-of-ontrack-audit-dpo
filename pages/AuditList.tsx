import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { db } from '../services/dbAdapter';
import { Audit, AuditStatus, Store } from '../types';
import { getCurrentUser } from '../utils/auth';
import { ArrowLeft, Calendar as CalendarIcon, List, Building2, Users, ChevronLeft, ChevronRight } from 'lucide-react';

type ViewMode = 'list' | 'calendar' | 'store' | 'dot';
type PageSize = 5 | 15 | 25;

export const AuditList: React.FC = () => {
  const navigate = useNavigate();
  const [audits, setAudits] = useState<(Audit & { store: Store })[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [pageSize, setPageSize] = useState<PageSize>(15);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedStore, setSelectedStore] = useState<number | null>(null);
  const [selectedDOT, setSelectedDOT] = useState<number | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    
    const user = db.getUserByEmail(currentUser.email);
    if (!user) return;
    
    // DOT vê apenas as suas auditorias
    const rawAudits = db.getAudits(1);
    const stores = db.getStores();
    
    // Filtrar auditorias para DOT (apenas as suas)
    const filteredAudits = user.roles.includes('DOT' as any)
      ? rawAudits.filter(a => a.user_id === user.id)
      : rawAudits; // AMONT vê todas
    
    const enriched = filteredAudits.map(a => ({
        ...a,
        store: stores.find(s => s.id === a.store_id) as Store
    }));
    setAudits(enriched);
  }, []);

  // Get unique stores and DOTs with audits
  const stores = useMemo(() => {
    const uniqueStores = Array.from(new Set(audits.map(a => a.store_id)))
      .map(id => audits.find(a => a.store_id === id)?.store)
      .filter(Boolean) as Store[];
    return uniqueStores;
  }, [audits]);

  const dots = useMemo(() => {
    const allUsers = db.getUsers();
    const dotIds = Array.from(new Set(stores.map(s => s.dotUserId).filter(Boolean)));
    return allUsers.filter(u => dotIds.includes(u.id));
  }, [stores]);

  // Filter audits based on view mode
  const filteredAudits = useMemo(() => {
    let filtered = [...audits];

    if (viewMode === 'store' && selectedStore) {
      filtered = filtered.filter(a => a.store_id === selectedStore);
    }

    if (viewMode === 'dot' && selectedDOT) {
      filtered = filtered.filter(a => a.store.dotUserId === selectedDOT);
    }

    if (viewMode === 'calendar') {
      filtered = filtered.filter(a => {
        const auditDate = new Date(a.dtstart);
        return auditDate.getMonth() === selectedMonth && auditDate.getFullYear() === selectedYear;
      });
    }

    return filtered.sort((a, b) => new Date(b.dtstart).getTime() - new Date(a.dtstart).getTime());
  }, [audits, viewMode, selectedStore, selectedDOT, selectedMonth, selectedYear]);

  // Pagination
  const totalPages = Math.ceil(filteredAudits.length / pageSize);
  const paginatedAudits = filteredAudits.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [viewMode, selectedStore, selectedDOT, selectedMonth, selectedYear, pageSize]);

  const getStatusLabel = (status: AuditStatus) => {
    switch (status) {
      case AuditStatus.ENDED: return 'Concluída';
      case AuditStatus.IN_PROGRESS: return 'Em Curso';
      case AuditStatus.SUBMITTED: return 'Submetida';
      default: return 'Nova';
    }
  };

  const getStatusColor = (status: AuditStatus) => {
    switch (status) {
      case AuditStatus.ENDED: return 'bg-green-100 text-green-800';
      case AuditStatus.IN_PROGRESS: return 'bg-yellow-100 text-yellow-800';
      case AuditStatus.SUBMITTED: return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const renderCalendarView = () => {
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const firstDay = new Date(selectedYear, selectedMonth, 1).getDay();
    const days = [];

    // Empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-24 bg-gray-50"></div>);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(selectedYear, selectedMonth, day);
      const dayAudits = filteredAudits.filter(a => {
        const auditDate = new Date(a.dtstart);
        return auditDate.getDate() === day;
      });

      days.push(
        <div key={day} className="h-24 border border-gray-200 p-1 overflow-y-auto">
          <div className="text-xs font-semibold text-gray-700 mb-1">{day}</div>
          {dayAudits.map(audit => (
            <div
              key={audit.id}
              onClick={() => navigate(`/audit/${audit.id}`)}
              className="text-xs bg-mousquetaires text-white px-1 py-0.5 rounded mb-1 cursor-pointer hover:bg-red-900 truncate"
              title={`${audit.store.city} - ${audit.store.codehex}`}
            >
              {audit.store.codehex}
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="grid grid-cols-7 gap-0 border border-gray-300">
        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
          <div key={day} className="bg-gray-100 p-2 text-center text-sm font-semibold text-gray-700 border-b border-gray-300">
            {day}
          </div>
        ))}
        {days}
      </div>
    );
  };

  const renderStoreView = () => {
    const storeGroups = stores.map(store => {
      const storeAudits = filteredAudits.filter(a => a.store_id === store.id);
      return { store, audits: storeAudits };
    }).filter(g => g.audits.length > 0);

    return (
      <div className="space-y-4">
        {storeGroups.map(({ store, audits }) => (
          <div key={store.id} className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {store.city} <span className="text-sm text-gray-500">({store.codehex})</span>
            </h3>
            <div className="text-sm text-gray-600 mb-3">
              {store.brand} • {store.size}
            </div>
            <div className="space-y-2">
              {audits.slice(0, 5).map(audit => (
                <div
                  key={audit.id}
                  onClick={() => navigate(`/audit/${audit.id}`)}
                  className="flex items-center justify-between p-2 bg-gray-50 hover:bg-gray-100 rounded cursor-pointer"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-sm text-gray-900">
                      {new Date(audit.dtstart).toLocaleDateString()}
                    </span>
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(audit.status)}`}>
                      {getStatusLabel(audit.status)}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-gray-900">
                    {audit.score ? `${audit.score.toFixed(1)}%` : '-'}
                  </span>
                </div>
              ))}
              {audits.length > 5 && (
                <div className="text-xs text-gray-500 text-center pt-1">
                  +{audits.length - 5} mais auditorias
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderDOTView = () => {
    const dotGroups = dots.map(dot => {
      const dotAudits = filteredAudits.filter(a => a.store.dotUserId === dot.id);
      const dotStores = stores.filter(s => s.dotUserId === dot.id);
      return { dot, audits: dotAudits, stores: dotStores };
    }).filter(g => g.audits.length > 0);

    return (
      <div className="space-y-4">
        {dotGroups.map(({ dot, audits, stores }) => (
          <div key={dot.id} className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">{dot.fullname}</h3>
            <div className="text-sm text-gray-600 mb-3">
              {dot.email} • {stores.length} {stores.length === 1 ? 'loja' : 'lojas'}
            </div>
            <div className="space-y-2">
              {audits.slice(0, 5).map(audit => (
                <div
                  key={audit.id}
                  onClick={() => navigate(`/audit/${audit.id}`)}
                  className="flex items-center justify-between p-2 bg-gray-50 hover:bg-gray-100 rounded cursor-pointer"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-sm text-gray-900">
                      {new Date(audit.dtstart).toLocaleDateString()}
                    </span>
                    <span className="text-sm text-gray-600">{audit.store.codehex}</span>
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(audit.status)}`}>
                      {getStatusLabel(audit.status)}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-gray-900">
                    {audit.score ? `${audit.score.toFixed(1)}%` : '-'}
                  </span>
                </div>
              ))}
              {audits.length > 5 && (
                <div className="text-xs text-gray-500 text-center pt-1">
                  +{audits.length - 5} mais auditorias
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-7xl mx-auto px-4 py-8">
            <div className="mb-6 flex items-center">
                <button onClick={() => navigate('/dashboard')} className="mr-4 text-gray-600 hover:text-black">
                    <ArrowLeft />
                </button>
                <h1 className="text-2xl font-bold text-gray-900">Histórico de Visitas</h1>
            </div>

            {/* View Mode Selector */}
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setViewMode('list')}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
                    viewMode === 'list' ? 'bg-mousquetaires text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <List size={18} />
                  <span>Lista</span>
                </button>
                <button
                  onClick={() => setViewMode('calendar')}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
                    viewMode === 'calendar' ? 'bg-mousquetaires text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <CalendarIcon size={18} />
                  <span>Calendário</span>
                </button>
                <button
                  onClick={() => setViewMode('store')}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
                    viewMode === 'store' ? 'bg-mousquetaires text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Building2 size={18} />
                  <span>Por Loja</span>
                </button>
                <button
                  onClick={() => setViewMode('dot')}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
                    viewMode === 'dot' ? 'bg-mousquetaires text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Users size={18} />
                  <span>Por DOT</span>
                </button>
              </div>

              {/* Page Size Selector */}
              {viewMode === 'list' && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-700">Mostrar:</span>
                  {[5, 15, 25].map(size => (
                    <button
                      key={size}
                      onClick={() => setPageSize(size as PageSize)}
                      className={`px-3 py-1 rounded ${
                        pageSize === size ? 'bg-mousquetaires text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                  <span className="text-sm text-gray-700">resultados</span>
                </div>
              )}
            </div>

            {/* Calendar Month/Year Selector */}
            {viewMode === 'calendar' && (
              <div className="mb-6 flex items-center justify-center space-x-4 bg-white p-4 rounded-lg">
                <button
                  onClick={() => {
                    if (selectedMonth === 0) {
                      setSelectedMonth(11);
                      setSelectedYear(selectedYear - 1);
                    } else {
                      setSelectedMonth(selectedMonth - 1);
                    }
                  }}
                  className="p-2 hover:bg-gray-100 rounded"
                >
                  <ChevronLeft size={20} />
                </button>
                <h2 className="text-xl font-semibold text-gray-900">
                  {new Date(selectedYear, selectedMonth).toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' })}
                </h2>
                <button
                  onClick={() => {
                    if (selectedMonth === 11) {
                      setSelectedMonth(0);
                      setSelectedYear(selectedYear + 1);
                    } else {
                      setSelectedMonth(selectedMonth + 1);
                    }
                  }}
                  className="p-2 hover:bg-gray-100 rounded"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            )}

            {/* Store Filter */}
            {viewMode === 'store' && (
              <div className="mb-6 bg-white p-4 rounded-lg">
                <label className="block text-sm font-medium text-gray-700 mb-2">Filtrar por loja:</label>
                <select
                  value={selectedStore || ''}
                  onChange={(e) => setSelectedStore(e.target.value ? Number(e.target.value) : null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mousquetaires"
                >
                  <option value="">Todas as lojas</option>
                  {stores.map(store => (
                    <option key={store.id} value={store.id}>
                      {store.city} - {store.codehex} ({store.brand})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* DOT Filter */}
            {viewMode === 'dot' && (
              <div className="mb-6 bg-white p-4 rounded-lg">
                <label className="block text-sm font-medium text-gray-700 mb-2">Filtrar por DOT:</label>
                <select
                  value={selectedDOT || ''}
                  onChange={(e) => setSelectedDOT(e.target.value ? Number(e.target.value) : null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mousquetaires"
                >
                  <option value="">Todos os DOTs</option>
                  {dots.map(dot => (
                    <option key={dot.id} value={dot.id}>
                      {dot.fullname} - {dot.email}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Content based on view mode */}
            {viewMode === 'calendar' && renderCalendarView()}
            {viewMode === 'store' && renderStoreView()}
            {viewMode === 'dot' && renderDOTView()}

            {/* List View */}
            {viewMode === 'list' && (
              <>
                <div className="bg-white shadow rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Loja</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DOT</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {paginatedAudits.map(audit => {
                          const dotUser = audit.store.dotUserId ? db.getUsers().find(u => u.id === audit.store.dotUserId) : null;
                          return (
                            <tr key={audit.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/audit/${audit.id}`)}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {new Date(audit.dtstart).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {audit.store.city} <span className="text-gray-500 text-xs">({audit.store.codehex})</span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                    {dotUser?.fullname || '-'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(audit.status)}`}>
                                        {getStatusLabel(audit.status)}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                                    {audit.score ? `${audit.score.toFixed(1)}%` : '-'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <span className="text-mousquetaires hover:text-red-900">Ver</span>
                                </td>
                            </tr>
                          );
                        })}
                        {paginatedAudits.length === 0 && (
                          <tr>
                            <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                              Nenhuma auditoria encontrada
                            </td>
                          </tr>
                        )}
                    </tbody>
                </table>
            </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-4 flex items-center justify-between bg-white px-4 py-3 rounded-lg">
                    <div className="text-sm text-gray-700">
                      Mostrando {((currentPage - 1) * pageSize) + 1} a {Math.min(currentPage * pageSize, filteredAudits.length)} de {filteredAudits.length} resultados
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1 rounded bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft size={16} />
                      </button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter(page => {
                          // Show first, last, current, and adjacent pages
                          return page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1;
                        })
                        .map((page, idx, arr) => {
                          // Add ellipsis
                          const showEllipsisBefore = idx > 0 && page - arr[idx - 1] > 1;
                          return (
                            <React.Fragment key={page}>
                              {showEllipsisBefore && <span className="px-2 text-gray-500">...</span>}
                              <button
                                onClick={() => setCurrentPage(page)}
                                className={`px-3 py-1 rounded ${
                                  currentPage === page
                                    ? 'bg-mousquetaires text-white'
                                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                                }`}
                              >
                                {page}
                              </button>
                            </React.Fragment>
                          );
                        })}
                      <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 rounded bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
        </main>
    </div>
  );
};
