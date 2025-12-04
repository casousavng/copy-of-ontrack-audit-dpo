import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { Button } from '../components/ui/Button';
import { ArrowLeft, Save, Calendar, MapPin, Users } from 'lucide-react';
import { db } from '../services/dbAdapter';
import { Store, VisitType, AuditStatus, User, UserRole } from '../types';
import { getCurrentUser } from '../utils/auth';

export const AmontNewVisitDOT: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const preSelectedDate = location.state?.selectedDate;
  const initialDate = preSelectedDate 
    ? new Date(preSelectedDate).toISOString().split('T')[0]
    : new Date().toISOString().split('T')[0];
  
  const currentUser = getCurrentUser();
  const [allStores, setAllStores] = useState<Store[]>([]);
  const [dots, setDots] = useState<User[]>([]);
  const [selectedDotId, setSelectedDotId] = useState<number | ''>('');
  const [selectedStoreId, setSelectedStoreId] = useState<number | ''>('');
  const [visitType, setVisitType] = useState<VisitType>(VisitType.ACOMPANHAMENTO);
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [date, setDate] = useState(initialDate);
  const [time, setTime] = useState('09:00');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Filtered stores based on selected DOT
  const availableStores = selectedDotId 
    ? allStores.filter(s => Number(s.dot_user_id || s.dotUserId) === Number(selectedDotId))
    : allStores;

  useEffect(() => {
    const loadData = async () => {
      if (!currentUser) {
        navigate('/');
        return;
      }
      // Amont can see all stores and DOTs
      const stores = await db.getStores();
      const allUsers = await db.getUsers();
      
      // Filter DOTs that are associated with this Amont
      const dotUsers = allUsers.filter(u => 
        u.roles?.includes(UserRole.DOT) && 
        Number(u.amontId) === Number(currentUser.userId)
      );
      
      setAllStores(stores);
      setDots(dotUsers);
    };
    loadData();
  }, []);

  // Reset store selection when DOT changes
  useEffect(() => {
    setSelectedStoreId('');
  }, [selectedDotId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedDotId || !selectedStoreId || !title.trim()) {
      setError('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    if (!currentUser) return;

    setSaving(true);
    setError('');
    try {
      const datetime = new Date(`${date}T${time}`);
      
      // Create visit assigned to the selected DOT
      await db.createVisit({
        type: visitType,
        title: title.trim(),
        description: text.trim(),
        user_id: selectedDotId as number, // DOT is the user assigned to the visit
        store_id: selectedStoreId as number,
        dtstart: datetime.toISOString(),
        status: AuditStatus.NEW,
        created_by: currentUser.userId // Amont created it
      });

      navigate('/amont/dashboard');
    } catch (error) {
      console.error('Erro ao criar visita:', error);
      setError('Erro ao criar visita. Por favor, tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const getTypeColor = (type: VisitType) => {
    switch(type) {
      case VisitType.AUDITORIA: return 'bg-red-100 text-red-800 border-red-200';
      case VisitType.FORMACAO: return 'bg-blue-100 text-blue-800 border-blue-200';
      case VisitType.ACOMPANHAMENTO: return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const selectedDot = dots.find(d => d.id === selectedDotId);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8 flex items-center gap-4">
          <button 
            onClick={() => navigate('/amont/dashboard')} 
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Nova Visita para DOT</h1>
            <p className="text-gray-600 mt-1">Agendar uma visita para um DOT específico</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="text-sm text-red-800">{error}</div>
            </div>
          )}

          {/* DOT Selection */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Users className="text-gray-400" size={20} />
              <h3 className="text-lg font-semibold text-gray-900">DOT Responsável</h3>
            </div>
            <select
              value={selectedDotId}
              onChange={(e) => setSelectedDotId(e.target.value ? Number(e.target.value) : '')}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mousquetaires focus:border-mousquetaires"
            >
              <option value="">Selecione um DOT</option>
              {dots.map(dot => (
                <option key={dot.id} value={dot.id}>
                  {dot.fullname} ({dot.email})
                </option>
              ))}
            </select>
            {dots.length === 0 && (
              <p className="text-sm text-orange-600 mt-2">
                Não existem DOTs associados a si. Verifique com o administrador.
              </p>
            )}
          </div>

          {/* Visit Type */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Tipo de Visita</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { type: VisitType.AUDITORIA, label: 'Auditoria' },
                { type: VisitType.FORMACAO, label: 'Formação' },
                { type: VisitType.ACOMPANHAMENTO, label: 'Acompanhamento' },
                { type: VisitType.OUTROS, label: 'Outros' },
              ].map(({ type, label }) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setVisitType(type)}
                  className={`p-3 rounded-lg border-2 text-center font-medium transition-all ${
                    visitType === type
                      ? getTypeColor(type) + ' border-current'
                      : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
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
              disabled={!selectedDotId}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mousquetaires focus:border-mousquetaires disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">
                {!selectedDotId ? 'Selecione primeiro um DOT' : 'Selecione uma loja'}
              </option>
              {availableStores.map(store => (
                <option key={store.id} value={store.id}>
                  {store.codehex} - {store.city} ({store.brand})
                </option>
              ))}
            </select>
            {selectedDotId && availableStores.length === 0 && (
              <p className="text-sm text-orange-600 mt-2">
                Este DOT não tem lojas atribuídas. Atribua lojas primeiro no painel de administração.
              </p>
            )}
            {selectedDot && availableStores.length > 0 && (
              <p className="text-sm text-gray-500 mt-2">
                {availableStores.length} loja(s) disponível(is) para {selectedDot.fullname}
              </p>
            )}
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
              placeholder="Ex: Auditoria trimestral, Formação HACCP..."
              required
              maxLength={200}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mousquetaires focus:border-mousquetaires"
            />
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
              rows={4}
              maxLength={2000}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mousquetaires focus:border-mousquetaires resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-4 justify-end bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => navigate('/amont/dashboard')}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'A guardar...' : 'Agendar Visita'}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
};
