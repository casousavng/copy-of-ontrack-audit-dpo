import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ArrowLeft, Save, Calendar, MapPin } from 'lucide-react';
import { db } from '../services/dbAdapter';
import { Store, VisitType, AuditStatus } from '../types';
import { getCurrentUser } from '../utils/auth';
import { getDefaultDashboard } from '../utils/permissions';

export const NewVisit: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const visitType = searchParams.get('type') as 'Formacao' | 'Acompanhamento' | 'Outros' || 'Outros';
  
  // Get pre-selected date from navigation state if available
  const preSelectedDate = location.state?.selectedDate;
  const initialDate = preSelectedDate 
    ? new Date(preSelectedDate).toISOString().split('T')[0]
    : new Date().toISOString().split('T')[0];
  
  const currentUser = getCurrentUser();
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<number | ''>('');
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [date, setDate] = useState(initialDate);
  const [time, setTime] = useState('09:00');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadStores = async () => {
      if (!currentUser) {
        navigate('/');
        return;
      }
      // DOT only sees their assigned stores
      const userStores = await db.getStoresForDOT(currentUser.userId);
      setStores(userStores);
    };
    loadStores();
  }, []); // Empty dependency array - only run once on mount

  const getVisitTypeEnum = (type: string): VisitType => {
    switch(type) {
      case 'Formacao': return VisitType.FORMACAO;
      case 'Acompanhamento': return VisitType.ACOMPANHAMENTO;
      default: return VisitType.OUTROS;
    }
  };

  const getVisitTypeLabel = (type: string): string => {
    switch(type) {
      case 'Formacao': return 'Formação';
      case 'Acompanhamento': return 'Acompanhamento';
      default: return 'Outros';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedStoreId || !title.trim()) {
      setError('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    if (!currentUser) return;

    setSaving(true);
    setError('');
    try {
      const datetime = new Date(`${date}T${time}`);
      
      await db.createVisit({
        type: getVisitTypeEnum(visitType),
        title: title.trim(),
        text: text.trim(),
        user_id: currentUser.userId,
        store_id: selectedStoreId as number,
        dtstart: datetime.toISOString(),
        status: AuditStatus.NEW,
        createdBy: currentUser.userId
      });

      navigate(getDefaultDashboard());
    } catch (error) {
      console.error('Erro ao criar visita:', error);
      setError('Erro ao criar visita. Por favor, tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const getTypeColor = (type: string) => {
    switch(type) {
      case 'Formacao': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Acompanhamento': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8 flex items-center gap-4">
          <button 
            onClick={() => navigate('/select-visit-type')} 
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Nova Visita: {getVisitTypeLabel(visitType)}</h1>
            <p className="text-gray-600 mt-1">Preencha os detalhes da visita</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex gap-3">
                <div className="text-red-600 mt-0.5">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="text-sm text-red-800">
                  {error}
                </div>
              </div>
            </div>
          )}

          {/* Type Badge */}
          <div className="flex justify-center">
            <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold border-2 ${getTypeColor(visitType)}`}>
              {getVisitTypeLabel(visitType)}
            </span>
          </div>

          {/* Store Selection */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="text-gray-400" size={20} />
              <h3 className="text-lg font-semibold text-gray-900">Loja</h3>
            </div>
            <select
              value={selectedStoreId}
              onChange={(e) => setSelectedStoreId(e.target.value ? Number(e.target.value) : '')}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mousquetaires focus:border-mousquetaires"
            >
              <option value="">Selecione uma loja</option>
              {stores.map(store => (
                <option key={store.id} value={store.id}>
                  {store.codehex} - {store.city} ({store.brand})
                </option>
              ))}
            </select>
          </div>

          {/* Date and Time */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="text-gray-400" size={20} />
              <h3 className="text-lg font-semibold text-gray-900">Data e Hora</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Data</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mousquetaires focus:border-mousquetaires"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Hora</label>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mousquetaires focus:border-mousquetaires"
                />
              </div>
            </div>
          </div>

          {/* Title */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Título <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Formação HACCP - Sessão Inicial"
              required
              maxLength={200}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mousquetaires focus:border-mousquetaires"
            />
            <p className="text-xs text-gray-500 mt-2">{title.length}/200 caracteres</p>
          </div>

          {/* Description */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descrição / Notas
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Descreva os objetivos, tópicos abordados, ou outras observações relevantes..."
              rows={6}
              maxLength={2000}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mousquetaires focus:border-mousquetaires resize-none"
            />
            <p className="text-xs text-gray-500 mt-2">{text.length}/2000 caracteres</p>
          </div>

          {/* Actions */}
          <div className="flex gap-4 justify-end bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => navigate('/dot/select-visit-type')}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'A guardar...' : 'Criar Visita'}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
};
