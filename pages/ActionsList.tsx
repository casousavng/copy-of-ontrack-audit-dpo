import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { ArrowLeft, Clock, Check, AlertCircle, ChevronRight } from 'lucide-react';
import { db } from '../services/dbAdapter';
import { ActionPlan, ActionStatus, Audit, Store } from '../types';
import { getCurrentUser } from '../utils/auth';

export const ActionsList: React.FC = () => {
  const navigate = useNavigate();
  type ActionsByAudit = { audit: Audit & { store: Store }, actions: ActionPlan[] };
  const [actionsByAudit, setActionsByAudit] = useState<ActionsByAudit[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('pending');

  useEffect(() => {
    const loadActions = async () => {
      const currentUser = getCurrentUser();
      if (!currentUser) {
        navigate('/');
        return;
      }

      // Get all audits for this DOT
      const user = await db.getUserByEmail(currentUser.email);
      if (!user) return;

      let audits = await db.getAudits(1);
      if (user.roles.includes('DOT' as any)) {
        audits = audits.filter(a => a.user_id === user.id);
      }

      const stores = await db.getStores();
      const auditsList: ActionsByAudit[] = [];

      for (const audit of audits) {
        const actions = await db.getActions(audit.id);
        if (actions.length > 0) {
          const store = stores.find(s => s.id === audit.store_id);
          if (store) {
            auditsList.push({
              audit: { ...audit, store },
              actions
            });
          }
        }
      }

      setActionsByAudit(auditsList);
      setLoading(false);
    };
    
    loadActions();
  }, [navigate]);

  const getStatusIcon = (status: ActionStatus) => {
    switch (status) {
      case ActionStatus.PENDING:
        return <Clock className="text-yellow-600" size={18} />;
      case ActionStatus.IN_PROGRESS:
        return <AlertCircle className="text-blue-600" size={18} />;
      case ActionStatus.COMPLETED:
        return <Check className="text-green-600" size={18} />;
      default:
        return <Clock className="text-gray-600" size={18} />;
    }
  };

  const getStatusLabel = (status: ActionStatus) => {
    switch (status) {
      case ActionStatus.PENDING:
        return 'Pendente';
      case ActionStatus.IN_PROGRESS:
        return 'Em progresso';
      case ActionStatus.COMPLETED:
        return 'Concluída';
      default:
        return 'Desconhecido';
    }
  };

  const getStatusColor = (status: ActionStatus) => {
    switch (status) {
      case ActionStatus.PENDING:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case ActionStatus.IN_PROGRESS:
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case ActionStatus.COMPLETED:
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const filteredData = actionsByAudit.filter(data => {
    if (filter === 'all') return true;
    if (filter === 'pending') {
      return data.actions.some(a => a.status !== ActionStatus.COMPLETED);
    }
    if (filter === 'completed') {
      return data.actions.every(a => a.status === ActionStatus.COMPLETED);
    }
    return true;
  });

  const totalActions: number = actionsByAudit.reduce((sum: number, data) => sum + data.actions.length, 0);
  const pendingActions: number = actionsByAudit.reduce((sum: number, data) => 
    sum + data.actions.filter(a => a.status !== ActionStatus.COMPLETED).length, 0
  );
  const completedActions: number = totalActions - pendingActions;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8 flex items-center gap-4">
          <button 
            onClick={() => navigate('/dot/dashboard')} 
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Planos de Ação</h1>
            <p className="text-gray-600 mt-1">Visão geral de todas as ações pendentes e concluídas</p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-3 rounded-lg">
                <AlertCircle className="text-blue-600" size={24} />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{totalActions}</div>
                <div className="text-sm text-gray-600">Total de Ações</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="bg-yellow-100 p-3 rounded-lg">
                <Clock className="text-yellow-600" size={24} />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{pendingActions}</div>
                <div className="text-sm text-gray-600">Pendentes</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 p-3 rounded-lg">
                <Check className="text-green-600" size={24} />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{completedActions}</div>
                <div className="text-sm text-gray-600">Concluídas</div>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2 mb-6 flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'all' ? 'bg-mousquetaires text-white' : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            Todas
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'pending' ? 'bg-mousquetaires text-white' : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            Pendentes
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'completed' ? 'bg-mousquetaires text-white' : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            Concluídas
          </button>
        </div>

        {/* Actions List by Audit */}
        {loading ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <p className="text-gray-500">A carregar...</p>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <AlertCircle className="mx-auto text-gray-400 mb-3" size={48} />
            <p className="text-gray-500">Nenhuma ação encontrada</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredData.map((data) => {
              const pendingCount = data.actions.filter(a => a.status !== ActionStatus.COMPLETED).length;
              const completedCount = data.actions.filter(a => a.status === ActionStatus.COMPLETED).length;
              
              return (
                <div key={data.audit.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                  <div className="bg-gray-50 border-b border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-gray-900">{data.audit.store.brand}</h3>
                        <p className="text-sm text-gray-600">{data.audit.store.city}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Auditoria: {new Date(data.audit.dtstart).toLocaleDateString('pt-PT')}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-sm text-gray-600">
                            {completedCount}/{data.actions.length} concluídas
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            {pendingCount > 0 && (
                              <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-800">
                                {pendingCount} pendente{pendingCount !== 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => navigate(`/audit/${data.audit.id}/actions`, { state: { fromList: true } })}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <ChevronRight className="text-gray-600" size={20} />
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 space-y-2">
                    {data.actions.slice(0, 3).map(action => (
                      <div key={action.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        {getStatusIcon(action.status)}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 truncate">{action.title}</div>
                          <div className="text-xs text-gray-500">
                            Responsável: {action.responsible === 'DOT' ? 'DOT' : action.responsible === 'Aderente' ? 'Aderente' : 'Ambos'}
                          </div>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full border ${getStatusColor(action.status)}`}>
                          {getStatusLabel(action.status)}
                        </span>
                      </div>
                    ))}
                    {data.actions.length > 3 && (
                      <button
                        onClick={() => navigate(`/audit/${data.audit.id}/actions`, { state: { fromList: true } })}
                        className="w-full text-center text-sm text-mousquetaires hover:text-mousquetaires-dark font-medium py-2"
                      >
                        Ver todas as {data.actions.length} ações →
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};
