import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { 
  FileText, Search, Filter, TrendingUp, CheckCircle, 
  AlertTriangle, Clock, BarChart3, Upload, 
  Calendar as CalendarIcon, List as ListIcon, Building2, Users, ChevronLeft, ChevronRight
} from 'lucide-react';
import { db } from '../services/dbAdapter';
import { MonthPlanner } from '../components/calendar/MonthPlanner';
import { WeekPlanner } from '../components/calendar/WeekPlanner';
import { Audit, AuditStatus, Store, Visit, VisitType } from '../types';

// Unified visit item type that can be either an Audit or a Visit
type VisitItem = (Audit & { store: Store; visitType: VisitType }) | (Visit & { store: Store; visitType: VisitType });

export const AmontDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [visits, setVisits] = useState<VisitItem[]>([]);
  const [filteredVisits, setFilteredVisits] = useState<VisitItem[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | AuditStatus>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | VisitType>('all');
  const [brandFilter, setBrandFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  // View state
  type ViewMode = 'list' | 'calendar' | 'store' | 'dot';
  type PageSize = 5 | 15 | 25;
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  type CalendarScope = 'month' | 'week';
  const [calendarScope, setCalendarScope] = useState<CalendarScope>('month');
  const [pageSize, setPageSize] = useState<PageSize>(15);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedStore, setSelectedStore] = useState<number | ''>('');
  const [selectedDOT, setSelectedDOT] = useState<number | ''>('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    const loadData = async () => {
      // Amont sees ALL visits (audits + other visit types) from all users
      const stores = await db.getStores();
      const allUsers = await db.getUsers();
      setUsers(allUsers);
      
      // Get all audits
      const allAuditsData = await db.getAudits(1);
      const enrichedAudits: VisitItem[] = allAuditsData
        .map(audit => {
          const store = stores.find(s => s.id === audit.store_id);
          return store ? { ...audit, store, visitType: VisitType.AUDITORIA } as VisitItem : null;
        })
        .filter((audit): audit is VisitItem => audit !== null);

      // Get all visits (Formação, Acompanhamento, Outros)
      const allVisitsData = await db.getVisits();
      const enrichedVisits: VisitItem[] = allVisitsData
        .map(visit => {
          const store = stores.find(s => s.id === visit.store_id);
          return store ? { ...visit, store, visitType: visit.type } as VisitItem : null;
        })
        .filter((visit): visit is VisitItem => visit !== null);

      // Combine and sort by date
      const allVisits = [...enrichedAudits, ...enrichedVisits]
        .sort((a, b) => new Date(b.dtstart).getTime() - new Date(a.dtstart).getTime());

      setVisits(allVisits);
      setFilteredVisits(allVisits);
      setLoading(false);
    };
    
    loadData();
  }, []);

  useEffect(() => {
    let filtered = [...visits];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(v => {
        const titleMatch = 'title' in v && v.title?.toLowerCase().includes(searchTerm.toLowerCase());
        return (
          v.store.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
          v.store.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
          v.store.codehex.toLowerCase().includes(searchTerm.toLowerCase()) ||
          titleMatch
        );
      });
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(v => v.status === statusFilter);
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(v => v.visitType === typeFilter);
    }

    // Brand filter
    if (brandFilter !== 'all') {
      filtered = filtered.filter(v => v.store.brand === brandFilter);
    }

    setFilteredVisits(filtered);
  }, [searchTerm, statusFilter, typeFilter, brandFilter, visits]);

  // Distinct stores present in filtered visits
  const storesInFiltered = useMemo(() => {
    const ids = Array.from(new Set(filteredVisits.map(v => v.store_id)));
    return ids
      .map(id => filteredVisits.find(v => v.store_id === id)?.store)
      .filter(Boolean) as Store[];
  }, [filteredVisits]);

  // DOTs inferred from stores
  const dotsInFiltered = useMemo(() => {
    const dotIds = Array.from(new Set(storesInFiltered.map(s => s.dotUserId).filter(Boolean)));
    return users.filter(u => dotIds.includes(u.id));
  }, [storesInFiltered, users]);

  // Apply additional filters for current view
  const viewVisits = useMemo(() => {
    let list = [...filteredVisits];
    if (viewMode === 'store' && selectedStore !== '') {
      list = list.filter(v => v.store_id === selectedStore);
    }
    if (viewMode === 'dot' && selectedDOT !== '') {
      list = list.filter(v => v.store.dotUserId === selectedDOT);
    }
    if (viewMode === 'calendar') {
      list = list.filter(v => {
        const d = new Date(v.dtstart);
        return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
      });
    }
    return list.sort((a, b) => new Date(b.dtstart).getTime() - new Date(a.dtstart).getTime());
  }, [filteredVisits, viewMode, selectedStore, selectedDOT, selectedMonth, selectedYear]);

  // Pagination for list view
  const totalPages = Math.ceil(viewVisits.length / pageSize) || 1;
  const paginatedVisits = useMemo(() => {
    if (viewMode !== 'list') return viewVisits;
    const start = (currentPage - 1) * pageSize;
    return viewVisits.slice(start, start + pageSize);
  }, [viewVisits, viewMode, currentPage, pageSize]);

  useEffect(() => {
    setCurrentPage(1);
  }, [viewMode, selectedStore, selectedDOT, selectedMonth, selectedYear, pageSize]);

  const getStatusBadge = (status: AuditStatus) => {
    switch(status) {
      case AuditStatus.NEW:
        return <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded font-medium">Nova</span>;
      case AuditStatus.IN_PROGRESS:
        return <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded font-medium">Em Progresso</span>;
      case AuditStatus.SUBMITTED:
        return <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded font-medium">Submetida</span>;
      case AuditStatus.ENDED:
        return <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded font-medium">Concluída</span>;
      case AuditStatus.CLOSED:
        return <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded font-medium">Fechada</span>;
      default:
        return null;
    }
  };

  const getVisitTypeBadge = (visitType: VisitType) => {
    switch(visitType) {
      case VisitType.AUDITORIA:
        return <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded font-medium">Auditoria</span>;
      case VisitType.FORMACAO:
        return <span className="bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded font-medium">Formação</span>;
      case VisitType.ACOMPANHAMENTO:
        return <span className="bg-cyan-100 text-cyan-800 text-xs px-2 py-1 rounded font-medium">Acompanhamento</span>;
      case VisitType.OUTROS:
        return <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded font-medium">Outros</span>;
      default:
        return null;
    }
  };

  const renderCalendar = () => {
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const firstDay = new Date(selectedYear, selectedMonth, 1).getDay();
    const cells: React.ReactNode[] = [];
    for (let i = 0; i < firstDay; i++) cells.push(<div key={`e-${i}`} className="h-24 bg-gray-50"/>);
    for (let d = 1; d <= daysInMonth; d++) {
      const dayVisits = viewVisits.filter(v => new Date(v.dtstart).getDate() === d);
      cells.push(
        <div key={d} className="h-24 border border-gray-200 p-1 overflow-y-auto">
          <div className="text-xs font-semibold text-gray-700 mb-1">{d}</div>
          {dayVisits.map(v => {
            const isAudit = v.visitType === VisitType.AUDITORIA;
            const bgColor = v.visitType === VisitType.AUDITORIA ? 'bg-red-500 hover:bg-red-700' :
                           v.visitType === VisitType.FORMACAO ? 'bg-indigo-500 hover:bg-indigo-700' :
                           v.visitType === VisitType.ACOMPANHAMENTO ? 'bg-cyan-500 hover:bg-cyan-700' :
                           'bg-gray-500 hover:bg-gray-700';
            return (
              <div
                key={`${v.visitType}-${v.id}`}
                onClick={() => isAudit ? navigate(`/amont/audit/${v.id}`) : navigate(`/amont/visit/${v.id}`)}
                className={`text-xs ${bgColor} text-white px-1 py-0.5 rounded mb-1 cursor-pointer truncate`}
                title={`${v.store.codehex} - ${v.visitType}`}
              >
                {v.store.codehex}
              </div>
            );
          })}
        </div>
      );
    }
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-center gap-4 bg-white p-4 rounded-lg">
          <button
            onClick={() => {
              if (selectedMonth === 0) { setSelectedMonth(11); setSelectedYear(y => y - 1); }
              else setSelectedMonth(m => m - 1);
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
              if (selectedMonth === 11) { setSelectedMonth(0); setSelectedYear(y => y + 1); }
              else setSelectedMonth(m => m + 1);
            }}
            className="p-2 hover:bg-gray-100 rounded"
          >
            <ChevronRight size={20} />
          </button>
        </div>
        {/* Legend */}
        <div className="bg-white p-3 rounded-lg border border-gray-200">
          <div className="text-xs font-semibold text-gray-700 mb-2">Legenda:</div>
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded"></div>
              <span className="text-xs text-gray-700">Auditoria</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-indigo-500 rounded"></div>
              <span className="text-xs text-gray-700">Formação</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-cyan-500 rounded"></div>
              <span className="text-xs text-gray-700">Acompanhamento</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-500 rounded"></div>
              <span className="text-xs text-gray-700">Outros</span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-0 border border-gray-300">
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
            <div key={d} className="bg-gray-100 p-2 text-center text-sm font-semibold text-gray-700 border-b border-gray-300">{d}</div>
          ))}
          {cells}
        </div>
      </div>
    );
  };

  const renderStoreView = () => {
    const groups = storesInFiltered.map(store => ({
      store,
      visits: viewVisits.filter(v => v.store_id === store.id)
    })).filter(g => g.visits.length > 0);

    const totalStorePages = Math.ceil(groups.length / pageSize) || 1;
    const start = (currentPage - 1) * pageSize;
    const pagedGroups = groups.slice(start, start + pageSize);

    return (
      <div className="space-y-4">
        {pagedGroups.map(({ store, visits }) => (
          <div key={store.id} className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {store.city} <span className="text-sm text-gray-500">({store.codehex})</span>
            </h3>
            <div className="text-sm text-gray-600 mb-3">{store.brand} • {store.size}</div>
            <div className="space-y-2">
              {(expandedStores.includes(store.id) ? visits : visits.slice(0,5)).map(v => {
                const isAudit = v.visitType === VisitType.AUDITORIA;
                const score = isAudit && 'score' in v ? v.score : null;
                return (
                  <div 
                    key={`${v.visitType}-${v.id}`} 
                    onClick={() => isAudit ? navigate(`/amont/audit/${v.id}`) : null} 
                    className={`flex items-center justify-between p-2 bg-gray-50 rounded ${isAudit ? 'hover:bg-gray-100 cursor-pointer' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-900">{new Date(v.dtstart).toLocaleDateString('pt-PT')}</span>
                      {getVisitTypeBadge(v.visitType)}
                      {getStatusBadge(v.status)}
                    </div>
                    <span className="text-sm font-bold text-gray-900">{score ? `${score.toFixed(1)}%` : '-'}</span>
                  </div>
                );
              })}
              {visits.length > 5 && !expandedStores.includes(store.id) && (
                <div className="text-center pt-1">
                  <button
                    className="text-sm text-mousquetaires hover:text-red-900 font-medium"
                    onClick={() => setExpandedStores(prev => [...prev, store.id])}
                  >
                    Ver mais
                  </button>
                </div>
              )}
              {visits.length > 5 && expandedStores.includes(store.id) && (
                <div className="text-center pt-1">
                  <button
                    className="text-sm text-gray-600 hover:text-gray-800"
                    onClick={() => setExpandedStores(prev => prev.filter(id => id !== store.id))}
                  >
                    Ver menos
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
        {/* Pagination for stores */}
        {totalStorePages > 1 && (
          <div className="p-4 flex items-center justify-between bg-white rounded-lg">
            <div className="text-sm text-gray-700">Mostrando lojas {start + 1} a {Math.min(start + pageSize, groups.length)} de {groups.length}</div>
            <div className="flex items-center gap-2">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1 rounded bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"><ChevronLeft size={16} /></button>
              {Array.from({ length: totalStorePages }, (_, i) => i + 1)
                .filter(page => page === 1 || page === totalStorePages || Math.abs(page - currentPage) <= 1)
                .map((page, idx, arr) => (
                  <React.Fragment key={page}>
                    {arr[idx-1] && page - arr[idx-1] > 1 && <span className="px-2 text-gray-500">...</span>}
                    <button onClick={() => setCurrentPage(page)} className={`px-3 py-1 rounded ${currentPage === page ? 'bg-mousquetaires text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}>{page}</button>
                  </React.Fragment>
                ))}
              <button onClick={() => setCurrentPage(p => Math.min(totalStorePages, p + 1))} disabled={currentPage === totalStorePages} className="px-3 py-1 rounded bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"><ChevronRight size={16} /></button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const [expandedDots, setExpandedDots] = useState<number[]>([]);
  const [expandedStores, setExpandedStores] = useState<number[]>([]);
  const renderDOTView = () => {
    const dots = dotsInFiltered;
    const groups = dots.map(dot => ({
      dot,
      visits: viewVisits.filter(v => v.store.dotUserId === dot.id),
      stores: storesInFiltered.filter(s => s.dotUserId === dot.id)
    })).filter(g => g.visits.length > 0);
    return (
      <div className="space-y-4">
        {groups.map(({ dot, visits, stores }) => (
          <div key={dot.id} className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">{dot.fullname}</h3>
            <div className="text-sm text-gray-600 mb-3">{dot.email} • {stores.length} {stores.length === 1 ? 'loja' : 'lojas'}</div>
            <div className="space-y-2">
              {(expandedDots.includes(dot.id) ? visits : visits.slice(0,5)).map(v => {
                const isAudit = v.visitType === VisitType.AUDITORIA;
                const score = isAudit && 'score' in v ? v.score : null;
                return (
                  <div 
                    key={`${v.visitType}-${v.id}`} 
                    onClick={() => isAudit ? navigate(`/amont/audit/${v.id}`) : null} 
                    className={`flex items-center justify-between p-2 bg-gray-50 rounded ${isAudit ? 'hover:bg-gray-100 cursor-pointer' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-900">{new Date(v.dtstart).toLocaleDateString('pt-PT')}</span>
                      <span className="text-sm text-gray-600">{v.store.codehex}</span>
                      {getVisitTypeBadge(v.visitType)}
                      {getStatusBadge(v.status)}
                    </div>
                    <span className="text-sm font-bold text-gray-900">{score ? `${score.toFixed(1)}%` : '-'}</span>
                  </div>
                );
              })}
              {visits.length > 5 && !expandedDots.includes(dot.id) && (
                <div className="text-center pt-1">
                  <button
                    className="text-sm text-mousquetaires hover:text-red-900 font-medium"
                    onClick={() => setExpandedDots(prev => [...prev, dot.id])}
                  >
                    Ver mais
                  </button>
                </div>
              )}
              {visits.length > 5 && expandedDots.includes(dot.id) && (
                <div className="text-center pt-1">
                  <button
                    className="text-sm text-gray-600 hover:text-gray-800"
                    onClick={() => setExpandedDots(prev => prev.filter(id => id !== dot.id))}
                  >
                    Ver menos
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const brands = Array.from(new Set(visits.map(v => v.store.brand)));

  const stats = {
    total: visits.length,
    inProgress: visits.filter(v => v.status === AuditStatus.IN_PROGRESS).length,
    submitted: visits.filter(v => v.status === AuditStatus.SUBMITTED).length,
    ended: visits.filter(v => v.status === AuditStatus.ENDED).length,
    avgScore: (() => {
      const auditsWithScore = visits.filter(v => v.visitType === VisitType.AUDITORIA && 'score' in v && v.score !== undefined);
      return auditsWithScore.length > 0
        ? auditsWithScore.reduce((sum, v) => sum + ((v as any).score || 0), 0) / auditsWithScore.length
        : 0;
    })(),
    byType: {
      auditoria: visits.filter(v => v.visitType === VisitType.AUDITORIA).length,
      formacao: visits.filter(v => v.visitType === VisitType.FORMACAO).length,
      acompanhamento: visits.filter(v => v.visitType === VisitType.ACOMPANHAMENTO).length,
      outros: visits.filter(v => v.visitType === VisitType.OUTROS).length,
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard Amont</h1>
            <p className="text-gray-500">Supervisão e análise de todas as visitas</p>
          </div>
          <div className="flex gap-3">
            <Button onClick={() => navigate('/amont/import-visitas')} size="md">
              <Upload className="w-4 h-4 mr-2" />
              Importar Visitas
            </Button>
            <Button onClick={() => navigate('/amont/reports')} size="md">
              <BarChart3 className="w-4 h-4 mr-2" />
              Relatórios
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
                <div className="text-sm text-gray-500">Total Visitas</div>
              </div>
              <FileText className="text-gray-400" size={32} />
            </div>
          </div>

          <div className="bg-yellow-50 rounded-lg shadow-sm border border-yellow-100 p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-yellow-600">{stats.inProgress}</div>
                <div className="text-sm text-yellow-600">Em Progresso</div>
              </div>
              <Clock className="text-yellow-400" size={32} />
            </div>
          </div>

          <div className="bg-purple-50 rounded-lg shadow-sm border border-purple-100 p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-purple-600">{stats.submitted}</div>
                <div className="text-sm text-purple-600">Submetidas</div>
              </div>
              <AlertTriangle className="text-purple-400" size={32} />
            </div>
          </div>

          <div className="bg-green-50 rounded-lg shadow-sm border border-green-100 p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-green-600">{stats.ended}</div>
                <div className="text-sm text-green-600">Concluídas</div>
              </div>
              <CheckCircle className="text-green-400" size={32} />
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg shadow-sm border border-blue-100 p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {stats.avgScore.toFixed(0)}%
                </div>
                <div className="text-sm text-blue-600">Média Global</div>
              </div>
              <TrendingUp className="text-blue-400" size={32} />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Pesquisar loja, cidade, código..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-2 items-center">
              <Filter size={20} className="text-gray-500" />
              
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value === 'all' ? 'all' : Number(e.target.value) as AuditStatus)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Todos os Estados</option>
                <option value={AuditStatus.NEW}>Nova</option>
                <option value={AuditStatus.IN_PROGRESS}>Em Progresso</option>
                <option value={AuditStatus.SUBMITTED}>Submetida</option>
                <option value={AuditStatus.ENDED}>Concluída</option>
                <option value={AuditStatus.CLOSED}>Fechada</option>
              </select>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as 'all' | VisitType)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Todas as Tipologias</option>
                <option value={VisitType.AUDITORIA}>Auditoria</option>
                <option value={VisitType.FORMACAO}>Formação</option>
                <option value={VisitType.ACOMPANHAMENTO}>Acompanhamento</option>
                <option value={VisitType.OUTROS}>Outros</option>
              </select>

              <select
                value={brandFilter}
                onChange={(e) => setBrandFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Todas as Marcas</option>
                {brands.map(brand => (
                  <option key={brand} value={brand}>{brand}</option>
                ))}
              </select>

              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/amont/reports')}
              >
                <BarChart3 size={16} className="mr-2" />
                Relatórios
              </Button>
            </div>
          </div>
        </div>

        {/* View mode selector + page size */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={() => setViewMode('list')} className={`flex items-center gap-2 px-4 py-2 rounded-lg ${viewMode==='list'?'bg-mousquetaires text-white':'bg-white text-gray-700 hover:bg-gray-100'}`}>
              <ListIcon size={18} />
              <span>Lista</span>
            </button>
            <button onClick={() => setViewMode('calendar')} className={`flex items-center gap-2 px-4 py-2 rounded-lg ${viewMode==='calendar'?'bg-mousquetaires text-white':'bg-white text-gray-700 hover:bg-gray-100'}`}>
              <CalendarIcon size={18} />
              <span>Calendário</span>
            </button>
            <button onClick={() => setViewMode('store')} className={`flex items-center gap-2 px-4 py-2 rounded-lg ${viewMode==='store'?'bg-mousquetaires text-white':'bg-white text-gray-700 hover:bg-gray-100'}`}>
              <Building2 size={18} />
              <span>Por Loja</span>
            </button>
            <button onClick={() => setViewMode('dot')} className={`flex items-center gap-2 px-4 py-2 rounded-lg ${viewMode==='dot'?'bg-mousquetaires text-white':'bg-white text-gray-700 hover:bg-gray-100'}`}>
              <Users size={18} />
              <span>Por DOT</span>
            </button>
          </div>
          {viewMode==='list' && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-700">Mostrar:</span>
              {[5,15,25].map(size => (
                <button key={size} onClick={() => setPageSize(size as PageSize)} className={`px-3 py-1 rounded ${pageSize===size?'bg-mousquetaires text-white':'bg-white text-gray-700 hover:bg-gray-100'}`}>{size}</button>
              ))}
              <span className="text-sm text-gray-700">resultados</span>
            </div>
          )}
        </div>

        {/* Optional filters per view */}
        {viewMode==='store' && (
          <div className="mb-6 bg-white p-4 rounded-lg">
            <label className="block text-sm font-medium text-gray-700 mb-2">Filtrar por loja:</label>
            <select value={selectedStore} onChange={e=>setSelectedStore(e.target.value ? Number(e.target.value) : '')} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mousquetaires">
              <option value="">Todas as lojas</option>
              {storesInFiltered.map(s => (
                <option key={s.id} value={s.id}>{s.city} - {s.codehex} ({s.brand})</option>
              ))}
            </select>
          </div>
        )}
        {viewMode==='dot' && (
          <div className="mb-6 bg-white p-4 rounded-lg">
            <label className="block text-sm font-medium text-gray-700 mb-2">Filtrar por DOT:</label>
            <select value={selectedDOT} onChange={e=>setSelectedDOT(e.target.value ? Number(e.target.value) : '')} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mousquetaires">
              <option value="">Todos os DOTs</option>
              {dotsInFiltered.map(dot => (
                <option key={dot.id} value={dot.id}>{dot.fullname} - {dot.email}</option>
              ))}
            </select>
          </div>
        )}

        {/* Content switch */}
        {loading ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 mb-8">
            <p className="text-center text-gray-500">A carregar...</p>
          </div>
        ) : viewMode === 'calendar' ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 overflow-y-auto min-h-[520px]" style={{ scrollbarGutter: 'stable' }}>
            {/* Calendar scope toggle */}
            <div className="mb-4 flex items-center justify-center gap-2">
              <button
                onClick={() => setCalendarScope('month')}
                className={`px-4 py-2 rounded-lg text-sm ${calendarScope === 'month' ? 'bg-mousquetaires text-white' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'}`}
              >
                Vista Mensal
              </button>
              <button
                onClick={() => setCalendarScope('week')}
                className={`px-4 py-2 rounded-lg text-sm ${calendarScope === 'week' ? 'bg-mousquetaires text-white' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'}`}
              >
                Vista Semanal
              </button>
            </div>

            {(() => {
              // Map unified visits to planner-friendly audits shape
              const plannerAudits = filteredVisits.map(v => ({
                id: v.id as number,
                user_id: 0,
                store_id: v.store.id,
                checklist_id: 0,
                dtstart: v.dtstart,
                status: v.status,
                store: v.store
              })) as unknown as (Audit & { store: Store })[];

              return calendarScope === 'month' ? (
                <MonthPlanner
                  audits={plannerAudits}
                  onAuditClick={(id) => navigate(`/amont/audit/${id}`)}
                  onDateClick={(date) => navigate('/select-visit-type', { state: { selectedDate: date.toISOString() } })}
                />
              ) : (
                <WeekPlanner
                  audits={plannerAudits}
                  onAuditClick={(id) => navigate(`/amont/audit/${id}`)}
                  onDateClick={(date) => navigate('/select-visit-type', { state: { selectedDate: date.toISOString() } })}
                />
              );
            })()}
          </div>
        ) : viewVisits.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 mb-8">
            <p className="text-center text-gray-500">Nenhuma visita corresponde aos filtros.</p>
          </div>
        ) : viewMode === 'store' ? (
          <div className="">{renderStoreView()}</div>
        ) : viewMode === 'dot' ? (
          <div className="">{renderDOTView()}</div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-700">Visitas (a mostrar {paginatedVisits.length} de {viewVisits.length})</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Código</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Loja</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DOT</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pontuação</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginatedVisits.map(visit => {
                    const isAudit = visit.visitType === VisitType.AUDITORIA;
                    const score = isAudit && 'score' in visit ? visit.score : null;
                    const title = 'title' in visit ? visit.title : null;
                    const dotUser = visit.store.dotUserId ? users.find(u => u.id === visit.store.dotUserId) : null;
                    return (
                      <tr 
                        key={`${visit.visitType}-${visit.id}`} 
                        className={`hover:bg-gray-50 ${isAudit ? 'cursor-pointer' : ''}`} 
                        onClick={() => isAudit ? navigate(`/amont/audit/${visit.id}`) : null}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{visit.store.codehex}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{visit.store.brand}</div>
                          <div className="text-sm text-gray-500">{visit.store.city}</div>
                          {title && <div className="text-xs text-gray-400 italic">{title}</div>}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {dotUser ? dotUser.fullname : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(visit.dtstart).toLocaleDateString('pt-PT')}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{getVisitTypeBadge(visit.visitType)}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(visit.status)}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {score !== undefined && score !== null ? (
                            <div className="flex items-center gap-2">
                              <span className={`text-sm font-semibold ${score < 50 ? 'text-red-600' : score < 80 ? 'text-yellow-600' : 'text-green-600'}`}>{score.toFixed(0)}%</span>
                              <div className="w-16 bg-gray-200 rounded-full h-2">
                                <div className={`${score < 50 ? 'bg-red-500' : score < 80 ? 'bg-yellow-500' : 'bg-green-500'} h-2 rounded-full`} style={{ width: `${score}%` }} />
                              </div>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {isAudit ? (
                            <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); navigate(`/amont/audit/${visit.id}`); }}>
                              Ver Detalhes
                            </Button>
                          ) : (
                            <span className="text-xs text-gray-400">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="p-4 flex items-center justify-between">
                <div className="text-sm text-gray-700">Mostrando {((currentPage - 1) * pageSize) + 1} a {Math.min(currentPage * pageSize, viewVisits.length)} de {viewVisits.length} resultados</div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1 rounded bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"><ChevronLeft size={16} /></button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(page => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1)
                    .map((page, idx, arr) => {
                      const prev = arr[idx - 1];
                      return (
                        <React.Fragment key={page}>
                          {prev && page - prev > 1 && <span className="px-2 text-gray-500">...</span>}
                          <button onClick={() => setCurrentPage(page)} className={`px-3 py-1 rounded ${currentPage === page ? 'bg-mousquetaires text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}>{page}</button>
                        </React.Fragment>
                      );
                    })}
                  <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-3 py-1 rounded bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"><ChevronRight size={16} /></button>
                </div>
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
};
