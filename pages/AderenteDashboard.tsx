import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { Button } from '../components/ui/Button';
import { CheckCircle, Clock, AlertCircle, FileText, List, MapPin } from 'lucide-react';
import { db } from '../services/dbAdapter';
import { Audit, AuditStatus, Store, ActionPlan, ActionStatus } from '../types';
import { getCurrentUser } from '../utils/auth';

export const AderenteDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [audits, setAudits] = useState<(Audit & { store: Store })[]>([]);
  const [myVisits, setMyVisits] = useState<(Audit & { store: Store })[]>([]); // Visitas criadas pelo Aderente
  const [allActions, setAllActions] = useState<ActionPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
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

      // Carregar TODAS as auditorias (não filtrar por userId)
      const allAudits = await db.getAudits(1); // userId não importa, retorna todas
      
      // Filtrar auditorias da loja do Aderente que foram submetidas
      const enriched = allAudits
        .filter(a => a.store_id === aderenteStore.id && a.status >= AuditStatus.SUBMITTED)
        .map(a => ({
          ...a,
          store: aderenteStore
        }));

      setAudits(enriched);

      // Filtrar visitas criadas pelo próprio Aderente (a outras lojas)
      const myCreatedVisits = allAudits
        .filter(a => a.createdBy === currentUser.userId && a.store_id !== aderenteStore.id)
        .map(a => {
          const visitStore = stores.find(s => s.id === a.store_id);
          return {
            ...a,
            store: visitStore || aderenteStore // fallback
          };
        });

      setMyVisits(myCreatedVisits);

      // Load all actions for received audits
      const actions: ActionPlan[] = [];
      for (const audit of enriched) {
        const auditActions = await db.getActions(audit.id);
        actions.push(...auditActions);
      }
      setAllActions(actions);

      setLoading(false);
    };
    loadData();
  }, []);

  const getStatusBadge = (status: AuditStatus) => {
    switch(status) {
      case AuditStatus.SUBMITTED:
        return <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded font-medium">Submetida</span>;
      case AuditStatus.ENDED:
        return <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded font-medium">Concluída</span>;
      default:
        return null;
    }
  };

  const myActions = allActions.filter(a => 
    a.responsible === 'Aderente' || a.responsible === 'Ambos'
  );
  const pendingActions = myActions.filter(a => a.status === ActionStatus.PENDING);
  const inProgressActions = myActions.filter(a => a.status === ActionStatus.IN_PROGRESS);
  const completedActions = myActions.filter(a => a.status === ActionStatus.COMPLETED);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Aderente</h1>
          <p className="text-gray-500">Bem-vindo, {getCurrentUser()?.name}</p>
        </div>

        {/* Nova Visita Button */}
        <div className="mb-6">
          <Button
            onClick={() => navigate('/aderente/new-visit')}
            className="w-full sm:w-auto"
          >
            <MapPin className="mr-2" size={16} />
            Nova Visita de Auditoria
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <button 
            type="button"
            onClick={() => {
              if (audits.length > 0) {
                navigate(`/aderente/audit/${audits[0].id}`);
              }
            }}
            disabled={audits.length === 0}
            className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow text-left disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">{audits.length}</div>
                <div className="text-sm text-gray-500">Visitas Recebidas</div>
              </div>
              <FileText className="text-gray-400" size={32} />
            </div>
          </button>

          <button 
            type="button"
            onClick={() => navigate('/aderente/actions')}
            className="bg-red-50 rounded-lg shadow-sm border border-red-100 p-4 hover:shadow-md transition-shadow text-left"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-red-600">{pendingActions.length}</div>
                <div className="text-sm text-red-600">Ações Pendentes</div>
              </div>
              <AlertCircle className="text-red-400" size={32} />
            </div>
          </button>

          <button 
            type="button"
            onClick={() => navigate('/aderente/actions')}
            className="bg-yellow-50 rounded-lg shadow-sm border border-yellow-100 p-4 hover:shadow-md transition-shadow text-left"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-yellow-600">{inProgressActions.length}</div>
                <div className="text-sm text-yellow-600">Em Progresso</div>
              </div>
              <Clock className="text-yellow-400" size={32} />
            </div>
          </button>

          <button 
            type="button"
            onClick={() => navigate('/aderente/actions')}
            className="bg-green-50 rounded-lg shadow-sm border border-green-100 p-4 hover:shadow-md transition-shadow text-left"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-green-600">{completedActions.length}</div>
                <div className="text-sm text-green-600">Concluídas</div>
              </div>
              <CheckCircle className="text-green-400" size={32} />
            </div>
          </button>
        </div>

        {/* Recent Audits */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-8">
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-700">Visitas Recentes</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {loading ? (
              <p className="p-4 text-gray-500">A carregar...</p>
            ) : audits.length === 0 ? (
              <p className="p-4 text-gray-500">Nenhuma visita recebida ainda.</p>
            ) : (
              audits.slice(0, 5).map(audit => (
                <div
                  key={audit.id}
                  className="p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div 
                      className="flex-1 cursor-pointer" 
                      onClick={() => navigate(`/aderente/audit/${audit.id}`)}
                    >
                      <div className="flex items-center gap-3 mb-1">
                        <h4 className="font-semibold text-gray-900">
                          {audit.store.brand} - {audit.store.city}
                        </h4>
                        {getStatusBadge(audit.status)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(audit.dtstart).toLocaleDateString('pt-PT', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </div>
                      {audit.score !== undefined && (
                        <div className="mt-2">
                          <div className="flex items-center gap-2">
                            <div className="text-sm font-medium text-gray-700">
                              Pontuação: {audit.score.toFixed(0)}%
                            </div>
                            <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-xs">
                              <div
                                className={`h-2 rounded-full ${
                                  audit.score < 50
                                    ? 'bg-red-500'
                                    : audit.score < 80
                                    ? 'bg-yellow-500'
                                    : 'bg-green-500'
                                }`}
                                style={{ width: `${audit.score}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/aderente/audit/${audit.id}`);
                      }}
                    >
                      Ver Detalhes
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* My Visits to Other Stores */}
        {myVisits.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-8">
            <div className="p-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-700">Minhas Visitas a Outras Lojas</h3>
            </div>
            <div className="divide-y divide-gray-100">
              {myVisits.map(visit => (
                <div
                  key={visit.id}
                  className="p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div 
                      className="flex-1 cursor-pointer" 
                      onClick={() => navigate(`/aderente/visit/${visit.id}`)}
                    >
                      <div className="flex items-center gap-3 mb-1">
                        <h4 className="font-semibold text-gray-900">
                          {visit.store.brand} - {visit.store.city}
                        </h4>
                        {getStatusBadge(visit.status)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(visit.dtstart).toLocaleDateString('pt-PT', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </div>
                      {visit.score !== undefined && (
                        <div className="mt-2">
                          <div className="flex items-center gap-2">
                            <div className="text-sm font-medium text-gray-700">
                              Pontuação: {visit.score.toFixed(0)}%
                            </div>
                            <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-xs">
                              <div
                                className={`h-2 rounded-full ${
                                  visit.score < 50
                                    ? 'bg-red-500'
                                    : visit.score < 80
                                    ? 'bg-yellow-500'
                                    : 'bg-green-500'
                                }`}
                                style={{ width: `${visit.score}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/aderente/visit/${visit.id}`);
                      }}
                    >
                      Ver Detalhes
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* My Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-gray-700">Minhas Ações</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/aderente/actions')}
            >
              <List className="mr-2" size={16} />
              Ver Todas
            </Button>
          </div>
          <div className="divide-y divide-gray-100">
            {myActions.length === 0 ? (
              <p className="p-4 text-gray-500">Nenhuma ação atribuída.</p>
            ) : (
              myActions.slice(0, 5).map(action => {
                const audit = audits.find(a => a.id === action.audit_id);
                const isOverdue =
                  new Date(action.dueDate) < new Date() &&
                  action.status !== ActionStatus.COMPLETED;

                return (
                  <div key={action.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-gray-900">{action.title}</h4>
                          {isOverdue && (
                            <span className="bg-red-100 text-red-800 text-xs px-2 py-0.5 rounded">
                              Atrasada
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{action.description}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          {audit && (
                            <span>
                              {audit.store.brand} - {audit.store.city}
                            </span>
                          )}
                          <span>
                            Prazo: {new Date(action.dueDate).toLocaleDateString('pt-PT')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </main>
    </div>
  );
};
