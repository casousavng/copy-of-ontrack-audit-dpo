import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { Button } from '../components/ui/Button';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { db } from '../services/dbAdapter';
import { Audit, Store, ActionPlan as ActionPlanType, ActionStatus, ActionResponsible, Checklist, Criteria } from '../types';
import { ArrowLeft, Plus, Trash2, Check, Clock, AlertCircle, User } from 'lucide-react';
import { MOCK_USER_ID } from '../constants';
import { canCreateActions } from '../utils/permissions';

export const ActionPlan: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const fromList = location.state?.fromList;
  
  const [audit, setAudit] = useState<Audit | null>(null);
  const [store, setStore] = useState<Store | null>(null);
  const [actions, setActions] = useState<ActionPlanType[]>([]);
  const [checklist, setChecklist] = useState<Checklist | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAction, setEditingAction] = useState<ActionPlanType | null>(null);
  const [confirmState, setConfirmState] = useState<{open:boolean; message:string; onConfirm:()=>void}>({open:false, message:'', onConfirm: ()=>{}});
  
  // Form state
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formResponsible, setFormResponsible] = useState<ActionResponsible>(ActionResponsible.ADERENTE);
  const [formDueDate, setFormDueDate] = useState('');

  useEffect(() => {
    if (!id) return;
    const aud = db.getAuditById(parseInt(id));
    if (!aud) {
      navigate('/dashboard');
      return;
    }
    setAudit(aud);
    
    const stores = db.getStores();
    setStore(stores.find(s => s.id === aud.store_id) || null);
    
    const cl = db.getChecklist();
    setChecklist(cl);
    
    loadActions();
    setLoading(false);
  }, [id, navigate]);

  const loadActions = () => {
    if (!id) return;
    const acts = db.getActions(parseInt(id));
    setActions(acts);
  };

  const autoGenerateActions = () => {
    if (!id || !checklist) return;
    
    const scores = db.getScores(parseInt(id));
    const criticalScores = scores.filter(s => s.score !== null && s.score > 0 && s.score <= 2);
    
    criticalScores.forEach(score => {
      // Find criteria name
      let criteriaName = '';
      let criteriaObj: Criteria | null = null;
      
      checklist.sections.forEach(section => {
        section.items.forEach(item => {
          item.criteria.forEach(crit => {
            if (crit.id === score.criteria_id) {
              criteriaName = `${item.name} - ${crit.name}`;
              criteriaObj = crit;
            }
          });
        });
      });
      
      // Check if action already exists for this criteria
      const exists = actions.find(a => a.criteria_id === score.criteria_id);
      if (!exists && criteriaObj) {
        const newAction: Omit<ActionPlanType, 'id'> = {
          audit_id: parseInt(id),
          criteria_id: score.criteria_id,
          title: `Corrigir: ${criteriaName}`,
          description: score.comment || 'Ação corretiva necessária',
          responsible: ActionResponsible.ADERENTE,
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // +7 days
          status: ActionStatus.PENDING,
          progress: 0,
          createdBy: MOCK_USER_ID
        };
        
        db.createAction(newAction);
      }
    });
    
    loadActions();
  };

  const handleAddAction = () => {
    if (!id || !formTitle) return;
    
    const newAction: Omit<ActionPlanType, 'id'> = {
      audit_id: parseInt(id),
      title: formTitle,
      description: formDescription,
      responsible: formResponsible,
      dueDate: formDueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      status: ActionStatus.PENDING,
      progress: 0,
      createdBy: MOCK_USER_ID
    };
    
    db.createAction(newAction);
    loadActions();
    resetForm();
    setShowAddModal(false);
  };

  const handleUpdateAction = () => {
    if (!editingAction || !formTitle) return;
    
    const updated: ActionPlanType = {
      ...editingAction,
      title: formTitle,
      description: formDescription,
      responsible: formResponsible,
      dueDate: formDueDate
    };
    
    db.updateAction(updated);
    loadActions();
    resetForm();
    setEditingAction(null);
  };

  const handleDeleteAction = (actionId: number) => {
    setConfirmState({
      open: true,
      message: 'Eliminar esta ação?',
      onConfirm: () => {
        db.deleteAction(actionId);
        loadActions();
      }
    });
  };

  const handleStatusChange = (action: ActionPlanType, newStatus: ActionStatus) => {
    const updated = {
      ...action,
      status: newStatus,
      progress: newStatus === ActionStatus.COMPLETED ? 100 : action.progress,
      completedDate: newStatus === ActionStatus.COMPLETED ? new Date().toISOString() : undefined
    };
    db.updateAction(updated);
    loadActions();
  };

  const resetForm = () => {
    setFormTitle('');
    setFormDescription('');
    setFormResponsible(ActionResponsible.ADERENTE);
    setFormDueDate('');
  };

  const openEditModal = (action: ActionPlanType) => {
    setEditingAction(action);
    setFormTitle(action.title);
    setFormDescription(action.description);
    setFormResponsible(action.responsible);
    setFormDueDate(action.dueDate.split('T')[0]);
  };

  const getStatusIcon = (status: ActionStatus) => {
    switch (status) {
      case ActionStatus.COMPLETED:
        return <Check className="text-green-600" size={20} />;
      case ActionStatus.IN_PROGRESS:
        return <Clock className="text-yellow-600" size={20} />;
      case ActionStatus.CANCELLED:
        return <AlertCircle className="text-gray-600" size={20} />;
      default:
        return <AlertCircle className="text-red-600" size={20} />;
    }
  };

  const getStatusColor = (status: ActionStatus) => {
    switch (status) {
      case ActionStatus.COMPLETED:
        return 'bg-green-100 text-green-800';
      case ActionStatus.IN_PROGRESS:
        return 'bg-yellow-100 text-yellow-800';
      case ActionStatus.CANCELLED:
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-red-100 text-red-800';
    }
  };

  const getStatusLabel = (status: ActionStatus) => {
    switch (status) {
      case ActionStatus.COMPLETED:
        return 'Concluída';
      case ActionStatus.IN_PROGRESS:
        return 'Em Progresso';
      case ActionStatus.CANCELLED:
        return 'Cancelada';
      default:
        return 'Pendente';
    }
  };

  if (loading || !audit || !store) return <div>A carregar...</div>;

  const pendingActions = actions.filter(a => a.status === ActionStatus.PENDING);
  const inProgressActions = actions.filter(a => a.status === ActionStatus.IN_PROGRESS);
  const completedActions = actions.filter(a => a.status === ActionStatus.COMPLETED);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-5xl mx-auto px-4 py-8">
        
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center">
            <button onClick={() => navigate(fromList ? '/actions' : `/dot/audit/${id}`)} className="mr-4 text-gray-600 hover:text-black">
              <ArrowLeft />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Plano de Ação</h1>
              <p className="text-sm text-gray-500">{store.brand} {store.city}</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            {canCreateActions() && (
              <>
                <Button variant="outline" onClick={autoGenerateActions}>
                  Gerar Ações Automáticas
                </Button>
                <Button onClick={() => setShowAddModal(true)}>
                  <Plus className="mr-2" size={18} /> Nova Ação
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
            <div className="text-2xl font-bold text-gray-900">{actions.length}</div>
            <div className="text-sm text-gray-500">Total de Ações</div>
          </div>
          <div className="bg-red-50 rounded-lg shadow-sm border border-red-100 p-4">
            <div className="text-2xl font-bold text-red-600">{pendingActions.length}</div>
            <div className="text-sm text-red-600">Pendentes</div>
          </div>
          <div className="bg-yellow-50 rounded-lg shadow-sm border border-yellow-100 p-4">
            <div className="text-2xl font-bold text-yellow-600">{inProgressActions.length}</div>
            <div className="text-sm text-yellow-600">Em Progresso</div>
          </div>
          <div className="bg-green-50 rounded-lg shadow-sm border border-green-100 p-4">
            <div className="text-2xl font-bold text-green-600">{completedActions.length}</div>
            <div className="text-sm text-green-600">Concluídas</div>
          </div>
        </div>

        {/* Actions List */}
        <div className="space-y-4">
          {actions.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
              <p className="text-gray-500 mb-4">Nenhuma ação criada ainda.</p>
              <Button onClick={autoGenerateActions}>Gerar Ações Automáticas</Button>
            </div>
          ) : (
            actions.map(action => {
              const isOverdue = new Date(action.dueDate) < new Date() && action.status !== ActionStatus.COMPLETED;
              
              return (
                <div key={action.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {getStatusIcon(action.status)}
                        <h3 className="font-semibold text-gray-900">{action.title}</h3>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(action.status)}`}>
                          {getStatusLabel(action.status)}
                        </span>
                        {isOverdue && (
                          <span className="px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800">
                            Atrasada
                          </span>
                        )}
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-3">{action.description}</p>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <User size={14} />
                          <span>{action.responsible}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock size={14} />
                          <span>Prazo: {new Date(action.dueDate).toLocaleDateString('pt-PT')}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 ml-4">
                      {action.status === ActionStatus.PENDING && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStatusChange(action, ActionStatus.IN_PROGRESS)}
                        >
                          Iniciar
                        </Button>
                      )}
                      {action.status === ActionStatus.IN_PROGRESS && (
                        <Button
                          size="sm"
                          onClick={() => handleStatusChange(action, ActionStatus.COMPLETED)}
                        >
                          Concluir
                        </Button>
                      )}
                      {canCreateActions() && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditModal(action)}
                          >
                            Editar
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteAction(action.id)}
                          >
                            <Trash2 size={16} />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

      </main>

      {/* Add/Edit Modal */}
      {(showAddModal || editingAction) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              {editingAction ? 'Editar Ação' : 'Nova Ação'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Título</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-mousquetaires outline-none"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Ex: Corrigir temperatura das vitrinas"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Descrição</label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-mousquetaires outline-none resize-none"
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Detalhes da ação..."
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Responsável</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-mousquetaires outline-none"
                    value={formResponsible}
                    onChange={(e) => setFormResponsible(e.target.value as ActionResponsible)}
                  >
                    <option value={ActionResponsible.DOT}>DOT</option>
                    <option value={ActionResponsible.ADERENTE}>Aderente</option>
                    <option value={ActionResponsible.BOTH}>Ambos</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Data Limite</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-mousquetaires outline-none"
                    value={formDueDate}
                    onChange={(e) => setFormDueDate(e.target.value)}
                  />
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddModal(false);
                  setEditingAction(null);
                  resetForm();
                }}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={editingAction ? handleUpdateAction : handleAddAction}
                className="flex-1"
                disabled={!formTitle}
              >
                {editingAction ? 'Atualizar' : 'Criar'}
              </Button>
            </div>
          </div>
        </div>
      )}
      <ConfirmDialog
        open={confirmState.open}
        message={confirmState.message}
        title="Confirmar eliminação"
        confirmText="Eliminar"
        onCancel={() => setConfirmState(s=>({...s, open:false}))}
        onConfirm={() => { confirmState.onConfirm(); setConfirmState(s=>({...s, open:false})); }}
      />
    </div>
  );
};
