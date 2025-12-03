import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ArrowLeft, Save, MapPin } from 'lucide-react';
import { db } from '../services/dbAdapter';
import { Store, Checklist } from '../types';
import { getCurrentUser } from '../utils/auth';

export const AderenteNewVisit: React.FC = () => {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  
  const [stores, setStores] = useState<Store[]>([]);
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [myStoreId, setMyStoreId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    storeId: '',
    checklistId: '',
    dtstart: new Date().toISOString().split('T')[0],
    title: '',
    description: ''
  });

  useEffect(() => {
    const loadData = async () => {
      if (!currentUser) {
        navigate('/');
        return;
      }

      try {
        // Carregar todas as lojas
        const allStores = await db.getStores();
        
        // Encontrar a loja do aderente
        const aderenteStore = allStores.find(s => s.aderenteId === currentUser.userId);
        
        if (aderenteStore) {
          setMyStoreId(aderenteStore.id);
          // Filtrar lojas - mostrar apenas lojas diferentes da sua
          setStores(allStores.filter(s => s.id !== aderenteStore.id));
        } else {
          setStores(allStores);
        }

        // Carregar checklists específicas para Aderente
        const allChecklists = await db.getChecklists();
        const aderenteChecklists = allChecklists.filter(
          c => c.targetRole === 'ADERENTE' || !c.targetRole
        );
        setChecklists(aderenteChecklists);

        if (aderenteChecklists.length > 0) {
          setFormData(prev => ({ ...prev, checklistId: String(aderenteChecklists[0].id) }));
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [currentUser, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser || !formData.storeId || !formData.checklistId || !formData.dtstart) {
      alert('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    if (!formData.title.trim()) {
      alert('Por favor, adicione um título para a visita');
      return;
    }

    try {
      // Criar auditoria de visita (usando tabela audits mas marcada como criada por Aderente)
      const newAudit = await db.createAudit({
        user_id: currentUser.userId, // Aderente visitante
        store_id: Number(formData.storeId),
        checklist_id: Number(formData.checklistId),
        dtstart: new Date(formData.dtstart).toISOString(),
        status: 1, // NEW
        createdBy: currentUser.userId
      });

      // Navegar para execução da auditoria
      navigate(`/aderente/visit/${newAudit.id}`);
    } catch (error: any) {
      console.error('Erro ao criar visita:', error);
      alert(error.message || 'Erro ao criar visita de auditoria');
    }
  };

  const selectedStore = stores.find(s => s.id === Number(formData.storeId));

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <p className="text-gray-500">A carregar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        <div className="mb-6 flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => navigate('/aderente/dashboard')}
          >
            <ArrowLeft className="mr-2" size={16} />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Nova Visita de Auditoria</h1>
            <p className="text-sm text-gray-500">Realizar auditoria a outra loja</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Informação */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex gap-3">
              <MapPin className="text-blue-600 flex-shrink-0" size={20} />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Visita de Auditoria entre Lojas</p>
                <p>Poderá visitar e auditar outras lojas da rede para partilha de boas práticas e avaliação cruzada.</p>
              </div>
            </div>
          </div>

          {/* Loja a Visitar */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Loja a Visitar</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Selecione a Loja *
                </label>
                <select
                  value={formData.storeId}
                  onChange={(e) => setFormData({ ...formData, storeId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                >
                  <option value="">-- Escolha uma loja --</option>
                  {stores.map(store => (
                    <option key={store.id} value={store.id}>
                      {store.brand} - {store.city} ({store.codehex})
                    </option>
                  ))}
                </select>
                {stores.length === 0 && (
                  <p className="text-sm text-gray-500 mt-1">Nenhuma outra loja disponível</p>
                )}
              </div>

              {selectedStore && (
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Marca:</span>
                      <span className="ml-2 font-medium">{selectedStore.brand}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Tamanho:</span>
                      <span className="ml-2 font-medium">{selectedStore.size}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Cidade:</span>
                      <span className="ml-2 font-medium">{selectedStore.city}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Código:</span>
                      <span className="ml-2 font-medium">{selectedStore.codehex}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Detalhes da Visita */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Detalhes da Visita</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Título da Visita *
                </label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ex: Visita de benchmarking, Auditoria cruzada, etc."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Checklist *
                </label>
                <select
                  value={formData.checklistId}
                  onChange={(e) => setFormData({ ...formData, checklistId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                >
                  {checklists.length === 0 ? (
                    <option value="">Nenhuma checklist disponível</option>
                  ) : (
                    checklists.map(checklist => (
                      <option key={checklist.id} value={checklist.id}>
                        {checklist.name}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data da Visita *
                </label>
                <Input
                  type="date"
                  value={formData.dtstart}
                  onChange={(e) => setFormData({ ...formData, dtstart: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição/Objetivo
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descreva o objetivo desta visita..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between items-center pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/aderente/dashboard')}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={!formData.storeId || !formData.checklistId || !formData.title.trim() || checklists.length === 0}
            >
              <Save className="mr-2" size={16} />
              Criar e Iniciar Visita
            </Button>
          </div>

        </form>

      </main>
    </div>
  );
};
