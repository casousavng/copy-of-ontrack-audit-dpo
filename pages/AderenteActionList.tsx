import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { Button } from '../components/ui/Button';
import { CheckCircle, Clock, AlertCircle, ChevronDown } from 'lucide-react';
import { db } from '../services/dbAdapter';
import { ActionPlan, ActionStatus, Audit, Store } from '../types';
import { getCurrentUser } from '../utils/auth';

export const AderenteActionList: React.FC = () => {
  const navigate = useNavigate();
  const [actions, setActions] = useState<(ActionPlan & { audit: Audit; store: Store })[]>([]);
  const [filter, setFilter] = useState<'all' | ActionStatus>('all');
  const [loading, setLoading] = useState(true);
  const [selectedAction, setSelectedAction] = useState<ActionPlan | null>(null);

  useEffect(() => {
    loadActions();
  }, []);

  const loadActions = async () => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      setLoading(false);
      return;
    }

    const stores = await db.getStores();
    
    // Encontrar a loja do Aderente (relação 1:1)
    const aderenteStore = stores.find(s => s.aderenteId === currentUser.userId);
    
    if (!aderenteStore) {
      console.warn('Aderente não tem loja atribuída');
      setLoading(false);
      return;
    }

    // Carregar TODAS as auditorias
    const allAudits = await db.getAudits(1);
    
    // Filtrar auditorias da loja do Aderente
    const myAudits = allAudits.filter(a => a.store_id === aderenteStore.id);
    
    const allActions: (ActionPlan & { audit: Audit; store: Store })[] = [];
    
    for (const audit of myAudits) {
      const auditActions = await db.getActions(audit.id);
      
      auditActions
        .filter(a => a.responsible === 'Aderente' || a.responsible === 'Ambos')
        .forEach(action => {
          allActions.push({ ...action, audit, store: aderenteStore });
        });
    }

    setActions(allActions);
    setLoading(false);
  };

  const getStatusBadge = (status: ActionStatus) => {
    switch(status) {
      case ActionStatus.PENDING:
        return <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded font-medium">Pendente</span>;
      case ActionStatus.IN_PROGRESS:
        return <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded font-medium">Em Progresso</span>;
      case ActionStatus.COMPLETED:
        return <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded font-medium">Concluída</span>;
      case ActionStatus.CANCELLED:
        return <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded font-medium">Cancelada</span>;
      default:
        return null;
    }
  };

  const handleStatusChange = async (action: ActionPlan, newStatus: ActionStatus) => {
    await db.updateAction({ ...action, status: newStatus });
    await loadActions();
    setSelectedAction(null);
  };

  const filteredActions = filter === 'all' 
    ? actions 
    : actions.filter(a => a.status === filter);

  const sortedActions = [...filteredActions].sort((a, b) => {
    // Overdue first
    const aOverdue = new Date(a.dueDate) < new Date() && a.status !== ActionStatus.COMPLETED;
    const bOverdue = new Date(b.dueDate) < new Date() && b.status !== ActionStatus.COMPLETED;
    if (aOverdue && !bOverdue) return -1;
    if (!aOverdue && bOverdue) return 1;
    // Then by due date
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });

  const stats = {
    total: actions.length,
    pending: actions.filter(a => a.status === ActionStatus.PENDING).length,
    inProgress: actions.filter(a => a.status === ActionStatus.IN_PROGRESS).length,
    completed: actions.filter(a => a.status === ActionStatus.COMPLETED).length,
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Plano de Ação</h1>
          <p className="text-gray-500">Gerir as suas ações atribuídas</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
                <div className="text-sm text-gray-500">Total</div>
              </div>
            </div>
          </div>

          <div className="bg-red-50 rounded-lg shadow-sm border border-red-100 p-4 cursor-pointer hover:bg-red-100 transition-colors"
               onClick={() => setFilter(filter === ActionStatus.PENDING ? 'all' : ActionStatus.PENDING)}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-red-600">{stats.pending}</div>
                <div className="text-sm text-red-600">Pendentes</div>
              </div>
              <AlertCircle className="text-red-400" size={32} />
            </div>
          </div>

          <div className="bg-yellow-50 rounded-lg shadow-sm border border-yellow-100 p-4 cursor-pointer hover:bg-yellow-100 transition-colors"
               onClick={() => setFilter(filter === ActionStatus.IN_PROGRESS ? 'all' : ActionStatus.IN_PROGRESS)}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-yellow-600">{stats.inProgress}</div>
                <div className="text-sm text-yellow-600">Em Progresso</div>
              </div>
              <Clock className="text-yellow-400" size={32} />
            </div>
          </div>

          <div className="bg-green-50 rounded-lg shadow-sm border border-green-100 p-4 cursor-pointer hover:bg-green-100 transition-colors"
               onClick={() => setFilter(filter === ActionStatus.COMPLETED ? 'all' : ActionStatus.COMPLETED)}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
                <div className="text-sm text-green-600">Concluídas</div>
              </div>
              <CheckCircle className="text-green-400" size={32} />
            </div>
          </div>
        </div>

        {/* Filter Info */}
        {filter !== 'all' && (
          <div className="mb-4 flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg p-3">
            <span className="text-sm text-blue-800">
              A mostrar apenas ações {filter === ActionStatus.PENDING ? 'pendentes' : filter === ActionStatus.IN_PROGRESS ? 'em progresso' : 'concluídas'}
            </span>
            <Button size="sm" variant="outline" onClick={() => setFilter('all')}>
              Mostrar Todas
            </Button>
          </div>
        )}

        {/* Actions List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          {loading ? (
            <p className="p-8 text-center text-gray-500">A carregar...</p>
          ) : sortedActions.length === 0 ? (
            <p className="p-8 text-center text-gray-500">
              {filter === 'all' ? 'Nenhuma ação atribuída.' : 'Nenhuma ação encontrada com este filtro.'}
            </p>
          ) : (
            <div className="divide-y divide-gray-100">
              {sortedActions.map(action => {
                const isOverdue =
                  new Date(action.dueDate) < new Date() &&
                  action.status !== ActionStatus.COMPLETED;
                const expanded = selectedAction?.id === action.id;

                return (
                  <div key={action.id} className="p-4">
                    <div
                      className="cursor-pointer"
                      onClick={() => setSelectedAction(expanded ? null : action)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-gray-900">{action.title}</h4>
                            {isOverdue && (
                              <span className="bg-red-100 text-red-800 text-xs px-2 py-0.5 rounded font-medium">
                                ⚠️ Atrasada
                              </span>
                            )}
                            {getStatusBadge(action.status)}
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{action.description}</p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>
                              📍 {action.store.brand} - {action.store.city}
                            </span>
                            <span>
                              📅 Prazo: {new Date(action.dueDate).toLocaleDateString('pt-PT')}
                            </span>
                            <span>
                              👥 Responsável: {action.responsible}
                            </span>
                          </div>
                        </div>
                        <ChevronDown
                          className={`text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
                          size={20}
                        />
                      </div>
                    </div>

                    {/* Expanded Actions */}
                    {expanded && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <div className="flex flex-wrap gap-2">
                          {action.status === ActionStatus.PENDING && (
                            <Button
                              size="sm"
                              variant="primary"
                              onClick={() => handleStatusChange(action, ActionStatus.IN_PROGRESS)}
                            >
                              ▶️ Iniciar
                            </Button>
                          )}
                          {action.status === ActionStatus.IN_PROGRESS && (
                            <>
                              <Button
                                size="sm"
                                variant="primary"
                                onClick={() => handleStatusChange(action, ActionStatus.COMPLETED)}
                              >
                                ✅ Marcar como Concluída
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleStatusChange(action, ActionStatus.PENDING)}
                              >
                                ⏸️ Pausar
                              </Button>
                            </>
                          )}
                          {action.status === ActionStatus.COMPLETED && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStatusChange(action, ActionStatus.IN_PROGRESS)}
                            >
                              🔄 Reabrir
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate(`/aderente/audit/${action.audit_id}`)}
                          >
                            📋 Ver Visita
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </main>
    </div>
  );
};
