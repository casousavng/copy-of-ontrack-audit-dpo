import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { Button } from '../components/ui/Button';
import { ArrowLeft, Calendar, MapPin, User, FileText } from 'lucide-react';
import { db } from '../services/dbAdapter';
import { Visit, Store, User as UserType, VisitType, AuditStatus } from '../types';

export const VisitDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [visit, setVisit] = useState<Visit | null>(null);
  const [store, setStore] = useState<Store | null>(null);
  const [dotUser, setDotUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadVisit = async () => {
      if (!id) return;
      const visitId = Number(id);
      const allVisits = await db.getVisits();
      const foundVisit = allVisits.find(v => v.id === visitId);
      
      if (foundVisit) {
        setVisit(foundVisit);
        const allStores = await db.getStores();
        const foundStore = allStores.find(s => s.id === foundVisit.store_id);
        setStore(foundStore || null);
        const allUsers = await db.getUsers();
        const foundUser = allUsers.find(u => u.id === foundVisit.user_id);
        setDotUser(foundUser || null);
      }
      setLoading(false);
    };
    
    loadVisit();
  }, [id]);

  const getStatusLabel = (status: AuditStatus) => {
    switch(status) {
      case AuditStatus.NEW: return 'Nova';
      case AuditStatus.IN_PROGRESS: return 'Em Progresso';
      case AuditStatus.SUBMITTED: return 'Submetida';
      case AuditStatus.ENDED: return 'Concluída';
      case AuditStatus.CLOSED: return 'Fechada';
      default: return 'Desconhecido';
    }
  };

  const getVisitTypeLabel = (type: VisitType) => {
    switch(type) {
      case VisitType.AUDITORIA: return 'Auditoria';
      case VisitType.FORMACAO: return 'Formação';
      case VisitType.ACOMPANHAMENTO: return 'Acompanhamento';
      case VisitType.OUTROS: return 'Outros';
      default: return type;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-4xl mx-auto px-4 py-8">
          <p className="text-center text-gray-500">A carregar...</p>
        </main>
      </div>
    );
  }

  if (!visit || !store) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-center text-gray-500">Visita não encontrada.</p>
            <div className="mt-4 text-center">
              <Button onClick={() => navigate(-1)}>Voltar</Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6 flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)} 
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{visit.title || `Visita ${getVisitTypeLabel(visit.type)}`}</h1>
            <p className="text-sm text-gray-500">Detalhes da visita</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-mousquetaires to-red-700 p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-white bg-opacity-20">
                {getVisitTypeLabel(visit.type)}
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-white bg-opacity-20">
                {getStatusLabel(visit.status)}
              </span>
            </div>
            <h2 className="text-3xl font-bold mb-2">{visit.title}</h2>
          </div>

          {/* Info Grid */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="flex items-start gap-3">
                <MapPin className="text-gray-400 mt-1" size={20} />
                <div>
                  <div className="text-sm font-medium text-gray-500">Loja</div>
                  <div className="text-base font-semibold text-gray-900">{store.brand} - {store.city}</div>
                  <div className="text-sm text-gray-600">{store.codehex} • {store.size}</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="text-gray-400 mt-1" size={20} />
                <div>
                  <div className="text-sm font-medium text-gray-500">Data da Visita</div>
                  <div className="text-base font-semibold text-gray-900">
                    {new Date(visit.dtstart).toLocaleDateString('pt-PT', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </div>
                  <div className="text-sm text-gray-600">
                    {new Date(visit.dtstart).toLocaleTimeString('pt-PT', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              </div>

              {dotUser && (
                <div className="flex items-start gap-3">
                  <User className="text-gray-400 mt-1" size={20} />
                  <div>
                    <div className="text-sm font-medium text-gray-500">DOT Responsável</div>
                    <div className="text-base font-semibold text-gray-900">{dotUser.fullname}</div>
                    <div className="text-sm text-gray-600">{dotUser.email}</div>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <FileText className="text-gray-400 mt-1" size={20} />
                <div>
                  <div className="text-sm font-medium text-gray-500">ID da Visita</div>
                  <div className="text-base font-semibold text-gray-900">#{visit.id}</div>
                </div>
              </div>
            </div>

            {/* Description/Text */}
            {visit.text && (
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Descrição</h3>
                <div className="prose max-w-none">
                  <p className="text-gray-700 whitespace-pre-wrap">{visit.text}</p>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-500">
                Criado por: ID #{visit.createdBy}
              </div>
              <Button onClick={() => navigate(-1)}>
                Voltar
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
