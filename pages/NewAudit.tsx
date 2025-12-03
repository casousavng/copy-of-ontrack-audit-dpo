import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { Button } from '../components/ui/Button';
import { db } from '../services/dbAdapter';
import { AuditStatus, Store } from '../types';
import { getCurrentUser } from '../utils/auth';
import { canCreateAudit } from '../utils/permissions';
import { ArrowLeft, AlertCircle, Calendar, MapPin, Users, Save } from 'lucide-react';

export const NewAudit: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get pre-selected date from navigation state if available
  const preSelectedDate = location.state?.selectedDate;
  const initialDate = preSelectedDate 
    ? new Date(preSelectedDate).toISOString().split('T')[0]
    : new Date().toISOString().split('T')[0];
  
  const [selectedStore, setSelectedStore] = useState('');
  const [date, setDate] = useState(initialDate);
  const [attendees, setAttendees] = useState('');
  const [availableStores, setAvailableStores] = useState<Store[]>([]);
  const [error, setError] = useState('');
  
  useEffect(() => {
    if (!canCreateAudit()) {
      navigate('/dashboard');
      return;
    }

    const currentUser = getCurrentUser();
    // DOT só vê lojas atribuídas
    // AMONT e ADMIN veem todas
    const user = db.getUserByEmail(currentUser?.email || '');
    if (user?.roles.includes('DOT' as any)) {
      const dotStores = db.getStoresForDOT(user.id);
      setAvailableStores(dotStores);
    } else {
      setAvailableStores(db.getStores());
    }
  }, [navigate]);
  
  const handleSubmit = () => {
      if(!selectedStore) return;

      const currentUser = getCurrentUser();
      
      // Verificar se DOT pode criar auditoria para esta loja
      const user = db.getUserByEmail(currentUser?.email || '');
      if (user?.roles.includes('DOT' as any)) {
        if (!db.canDOTCreateAuditForStore(user.id, parseInt(selectedStore))) {
          setError('Não tem permissão para criar auditorias nesta loja.');
          return;
        }
      }

      const checklist = db.getChecklist();
      
      const newAudit = db.createAudit({
          user_id: currentUser?.userId || 0,
          store_id: parseInt(selectedStore),
          checklist_id: checklist.id,
          dtstart: new Date(date).toISOString(),
          status: AuditStatus.NEW,
          aderentes: attendees,
          score: undefined,
          createdBy: currentUser?.userId || 0, // Marca como criado pelo DOT (ele próprio)
      });

      navigate(`/dot/audit/${newAudit.id}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-8">
        
        <div className="mb-8 flex items-center gap-4">
            <button 
              onClick={() => navigate(-1)} 
              className="text-gray-600 hover:text-gray-900"
            >
                <ArrowLeft size={24} />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Nova Visita: Auditoria</h1>
              <p className="text-gray-600 mt-1">Preencha os detalhes da auditoria</p>
            </div>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-6">
            {/* Type Badge */}
            <div className="flex justify-center">
              <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold border-2 bg-red-100 text-red-800 border-red-200">
                Auditoria
              </span>
            </div>

            {availableStores.length === 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="text-yellow-600 mt-0.5" size={20} />
                <div className="flex-1">
                  <p className="text-sm font-medium text-yellow-800">Sem lojas atribuídas</p>
                  <p className="text-sm text-yellow-700 mt-1">
                    Não tem lojas atribuídas. Contacte o AMONT ou Administrador.
                  </p>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="text-red-600 mt-0.5" size={20} />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}
            
            {/* Store Selection */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="text-gray-400" size={20} />
                <h3 className="text-lg font-semibold text-gray-900">Loja</h3>
              </div>
              <select 
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mousquetaires focus:border-mousquetaires"
                  value={selectedStore}
                  onChange={(e) => {
                    setSelectedStore(e.target.value);
                    setError('');
                  }}
                  disabled={availableStores.length === 0}
                  required
              >
                  <option value="">Selecione uma loja</option>
                  {availableStores.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.codehex} - {s.city} ({s.brand})
                      </option>
                  ))}
              </select>
              {availableStores.length > 0 && (
                <p className="text-xs text-gray-500 mt-2">
                  {availableStores.length} loja(s) disponível
                </p>
              )}
            </div>

            {/* Date */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="text-gray-400" size={20} />
                <h3 className="text-lg font-semibold text-gray-900">Data da Visita</h3>
              </div>
              <input 
                  type="date"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mousquetaires focus:border-mousquetaires"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
              />
            </div>

            {/* Attendees */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Users className="text-gray-400" size={20} />
                <h3 className="text-lg font-semibold text-gray-900">Aderentes / Presentes</h3>
              </div>
              <textarea
                 rows={3}
                 className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mousquetaires focus:border-mousquetaires resize-none"
                 placeholder="Nomes dos presentes na auditoria..."
                 value={attendees}
                 onChange={(e) => setAttendees(e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-2">
                Opcional: Liste os nomes das pessoas presentes durante a auditoria
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-4 justify-end bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <Button 
                  type="button"
                  variant="outline" 
                  onClick={() => navigate(-1)}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={!selectedStore || availableStores.length === 0}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Criar Auditoria
                </Button>
            </div>
        </form>
      </main>
    </div>
  );
};