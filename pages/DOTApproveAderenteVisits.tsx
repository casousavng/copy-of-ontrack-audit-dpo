import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { Button } from '../components/ui/Button';
import { ArrowLeft, CheckCircle, XCircle, Eye, Clock, AlertCircle } from 'lucide-react';
import { db } from '../services/dbAdapter';
import { Audit, AuditStatus, Store, User } from '../types';
import { getCurrentUser } from '../utils/auth';

export const DOTApproveAderenteVisits: React.FC = () => {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const [pendingVisits, setPendingVisits] = useState<(Audit & { store: Store; aderente: User })[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);

  useEffect(() => {
    loadPendingVisits();
  }, []);

  const loadPendingVisits = async () => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    try {
      const stores = await db.getStores();
      const allUsers = await db.getUsers();
      
      // Lojas atribuídas a este DOT
      const myStores = stores.filter(s => s.dotUserId === currentUser.userId || s.dot_user_id === currentUser.userId);
      const myStoreIds = myStores.map(s => s.id);
      
      // Buscar todas as auditorias
      const allAudits = await db.getAudits(currentUser.userId);
      
      // Filtrar auditorias criadas por Aderentes (nas lojas do DOT) com status SUBMITTED
      const aderenteVisits = allAudits.filter(audit => {
        // A visita é das minhas lojas
        const isMyStore = myStoreIds.includes(audit.store_id);
        // Foi criada por um Aderente (user com role ADERENTE)
        const creator = allUsers.find(u => u.id === audit.createdBy);
        const isFromAderente = creator?.roles?.includes('ADERENTE' as any);
        // Está pendente de aprovação (SUBMITTED)
        const isPending = audit.status === AuditStatus.SUBMITTED;
        
        return isMyStore && isFromAderente && isPending;
      });

      // Enriquecer com dados da loja e aderente
      const enrichedVisits = aderenteVisits.map(audit => {
        const store = myStores.find(s => s.id === audit.store_id)!;
        const aderente = allUsers.find(u => u.id === audit.createdBy)!;
        return { ...audit, store, aderente };
      });

      setPendingVisits(enrichedVisits);
    } catch (error) {
      console.error('Erro ao carregar visitas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (auditId: number) => {
    setProcessingId(auditId);
    try {
      await db.updateAudit(auditId, { status: AuditStatus.ENDED });
      await loadPendingVisits();
    } catch (error) {
      console.error('Erro ao aprovar visita:', error);
      alert('Erro ao aprovar visita');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (auditId: number) => {
    const reason = prompt('Motivo da rejeição (opcional):');
    if (reason === null) return; // Cancelou
    
    setProcessingId(auditId);
    try {
      await db.updateAudit(auditId, { 
        status: AuditStatus.IN_PROGRESS,
        auditorcomments: `Rejeitada pelo DOT: ${reason || 'Sem motivo especificado'}`
      });
      await loadPendingVisits();
    } catch (error) {
      console.error('Erro ao rejeitar visita:', error);
      alert('Erro ao rejeitar visita');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        <div className="mb-6 flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => navigate('/dashboard')}
          >
            <ArrowLeft className="mr-2" size={16} />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Visitas de Aderentes</h1>
            <p className="text-sm text-gray-500">Aprovar visitas submetidas por Aderentes</p>
          </div>
        </div>

        {/* Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex gap-3">
            <AlertCircle className="text-blue-600 flex-shrink-0" size={20} />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Aprovação de Visitas</p>
              <p>As visitas de auditoria realizadas pelos Aderentes às outras lojas aparecem aqui para sua revisão e aprovação.</p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
            <p className="text-center text-gray-500">A carregar...</p>
          </div>
        ) : pendingVisits.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
            <div className="text-center">
              <CheckCircle className="mx-auto mb-4 text-green-500" size={48} />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Tudo em dia!</h3>
              <p className="text-gray-500">Não há visitas de Aderentes pendentes de aprovação.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingVisits.map(visit => (
              <div key={visit.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded font-medium flex items-center gap-1">
                        <Clock size={12} />
                        Pendente Aprovação
                      </span>
                    </div>
                    
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {visit.store.brand} - {visit.store.city}
                    </h3>
                    <p className="text-sm text-gray-500 mb-3">
                      Código: {visit.store.codehex}
                    </p>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Realizada por:</span>
                        <span className="ml-2 font-medium text-gray-900">{visit.aderente?.fullname || 'Aderente'}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Data:</span>
                        <span className="ml-2 font-medium text-gray-900">
                          {new Date(visit.dtstart).toLocaleDateString('pt-PT', {
                            day: '2-digit',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                      {visit.score !== undefined && (
                        <div>
                          <span className="text-gray-500">Pontuação:</span>
                          <span className={`ml-2 font-bold ${
                            visit.score >= 80 ? 'text-green-600' :
                            visit.score >= 50 ? 'text-yellow-600' :
                            'text-red-600'
                          }`}>
                            {visit.score.toFixed(0)}%
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/dot/audit/${visit.id}`)}
                    >
                      <Eye size={16} className="mr-2" />
                      Ver Detalhes
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleApprove(visit.id)}
                      disabled={processingId === visit.id}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle size={16} className="mr-2" />
                      {processingId === visit.id ? 'A processar...' : 'Aprovar'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleReject(visit.id)}
                      disabled={processingId === visit.id}
                      className="text-red-600 border-red-200 hover:bg-red-50"
                    >
                      <XCircle size={16} className="mr-2" />
                      Rejeitar
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
