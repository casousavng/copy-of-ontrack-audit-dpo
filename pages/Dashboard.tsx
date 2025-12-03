import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { Button } from '../components/ui/Button';
import { PlusCircle, Store as StoreIcon, AlertCircle } from 'lucide-react';
import { db } from '../services/dbAdapter';
import { Audit, AuditStatus, Store, Visit } from '../types';
import { getCurrentUser } from '../utils/auth';
import { canCreateAudit } from '../utils/permissions';
import { ScoreGauge } from '../components/charts/ScoreGauge';
import { MonthPlanner } from '../components/calendar/MonthPlanner';
import { WeekPlanner } from '../components/calendar/WeekPlanner';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [audits, setAudits] = useState<(Audit & { store: Store })[]>([]);
  const [assignedStores, setAssignedStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  type CalendarScope = 'month' | 'week';
  const [calendarScope, setCalendarScope] = useState<CalendarScope>('month');

  useEffect(() => {
    const loadData = async () => {
      const currentUser = getCurrentUser();
      
      if (!currentUser) {
        navigate('/');
        return;
      }

      // Carregar lojas atribuídas ao DOT
      const user = await db.getUserByEmail(currentUser.email);
      if (user?.roles.includes('DOT' as any)) {
        const stores = await db.getStoresForDOT(user.id);
        setAssignedStores(stores);
      } else {
        const stores = await db.getStores();
        setAssignedStores(stores);
      }

      // Carregar auditorias e visitas
      let rawAudits = await db.getAudits(1);
      const visits: Visit[] = user ? await db.getVisitsForDOT(user.id) : [];
      
      // DOT: mostrar apenas as suas auditorias (CSV agendadas e manuais)
      if (user?.roles.includes('DOT' as any)) {
        rawAudits = rawAudits.filter(a => a.user_id === user.id);
      }
      const stores = await db.getStores();
      
      const enrichedAudits = rawAudits.map(a => ({
          ...a,
          store: stores.find(s => s.id === a.store_id) as Store
      }));

      // Convert visits to audit-like shape for calendar display
      const enrichedVisits = visits.map(v => ({
          id: v.id,
          user_id: v.user_id,
          store_id: v.store_id,
          checklist_id: 0,
          dtstart: v.dtstart,
          status: v.status,
          store: stores.find(s => s.id === v.store_id) as Store
      })) as (Audit & { store: Store })[];

      // Merge audits and visits for calendar display
      setAudits([...enrichedAudits, ...enrichedVisits]);
      setLoading(false);
    };
    loadData();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header com info de lojas atribuídas */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard DOT</h1>
          <p className="text-gray-500 mt-1">
            {assignedStores.length > 0 
              ? `${assignedStores.length} loja(s) atribuída(s)`
              : 'Nenhuma loja atribuída'}
          </p>
        </div>

        {/* Lojas Atribuídas */}
        {assignedStores.length > 0 && (
          <div className="mb-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <StoreIcon size={20} className="text-mousquetaires" />
                Minhas Lojas
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {assignedStores.map(store => (
                <div key={store.id} className="border border-gray-200 rounded-lg p-4 hover:border-mousquetaires transition-colors">
                  <div className="font-semibold text-gray-900">{store.brand}</div>
                  <div className="text-sm text-gray-600">{store.city}</div>
                  <div className="text-xs text-gray-500 mt-1">{store.codehex}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {assignedStores.length === 0 && (
          <div className="mb-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6 flex items-start gap-3">
            <AlertCircle className="text-yellow-600 mt-0.5" size={20} />
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-800">Sem lojas atribuídas</p>
              <p className="text-sm text-yellow-700 mt-1">
                Contacte o AMONT ou Administrador para atribuição de lojas.
              </p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="mb-8 flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
           <div>
               <h2 className="text-lg font-bold text-gray-900">PLANO DE VISITAS</h2>
               <p className="text-sm text-gray-500">Organize as suas auditorias</p>
           </div>
           {canCreateAudit() && assignedStores.length > 0 && (
             <Button onClick={() => navigate('/select-visit-type')}>
               <PlusCircle className="mr-2 h-5 w-5" />
               Nova Visita
             </Button>
           )}
        </div>

        {/* Month Planner Calendar */}
        {loading ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 mb-8">
            <p className="text-center text-gray-500">A carregar...</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-8 overflow-y-auto min-h-[520px]" style={{ scrollbarGutter: 'stable' }}>
            {/* Calendar scope toggle */}
            <div className="mb-4 flex items-center justify-center gap-2">
              <button
                onClick={() => setCalendarScope('month')}
                className={`px-4 py-2 rounded-lg text-sm ${calendarScope === 'month' ? 'bg-mousquetaires text-white' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'}`}
              >
                Vista Mensal
              </button>
              <button
                onClick={() => setCalendarScope('week')}
                className={`px-4 py-2 rounded-lg text-sm ${calendarScope === 'week' ? 'bg-mousquetaires text-white' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'}`}
              >
                Vista Semanal
              </button>
            </div>

            {calendarScope === 'month' ? (
              <MonthPlanner 
                audits={audits} 
                onAuditClick={(id) => navigate(`/dot/audit/${id}`)}
                onDateClick={(date) => {
                  // Navigate to select visit type with pre-selected date
                  navigate('/select-visit-type', { state: { selectedDate: date.toISOString() } });
                }}
              />
            ) : (
              <WeekPlanner 
                audits={audits} 
                onAuditClick={(id) => navigate(`/dot/audit/${id}`)}
                onDateClick={(date) => {
                  // Navigate to select visit type with pre-selected date
                  navigate('/select-visit-type', { state: { selectedDate: date.toISOString() } });
                }}
              />
            )}
          </div>
        )}

        {/* Tiles Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
             {[
                 { title: 'INDICADORES COMERCIAIS', icon: '📊', color: 'bg-green-100 text-green-600', action: () => navigate('/amont/reports') },
                 { title: 'HISTÓRICO DE VISITAS', icon: '📅', color: 'bg-blue-100 text-blue-600', action: () => navigate('/history') },
                 { title: 'PLANO DE AÇÃO', icon: '🧭', color: 'bg-orange-100 text-orange-600', action: () => navigate('/actions') },
                 { title: 'NOVA VISITA', icon: '📋', color: 'bg-purple-100 text-purple-600', action: () => navigate('/select-visit-type') }
             ].map((item, idx) => (
                 <button 
                    key={idx} 
                    onClick={item.action}
                    className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center hover:shadow-md transition-shadow group"
                 >
                     <div className={`w-12 h-12 rounded-full ${item.color} flex items-center justify-center text-2xl mb-3 group-hover:scale-110 transition-transform`}>
                         {item.icon}
                     </div>
                     <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">{item.title}</span>
                 </button>
             ))}
        </div>

      </main>
    </div>
  );
};