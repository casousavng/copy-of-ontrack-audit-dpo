import React, { useState } from 'react';
import { Menu, X, LogOut, User, Settings, Users, Upload, LayoutDashboard } from 'lucide-react';
import { APP_NAME, APP_SUBTITLE } from '../../constants';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser } from '../../utils/auth';
import { isAderente, isAmont, isAdmin } from '../../utils/permissions';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { useToast } from '../ui/Toast';
import { UserRole } from '../../types';

export const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const { show } = useToast();
  const userIsAdmin = isAdmin();
  const userIsAmont = isAmont();
  const userIsAderente = isAderente();

  const handleLogout = () => {
    localStorage.removeItem('ontrack_auth');
    navigate('/');
  };

  const [confirmState, setConfirmState] = useState<{open:boolean; message:string; onConfirm:()=>void}>({open:false, message:'', onConfirm: ()=>{}});

  // Função resetSeeds removida - não é mais necessária com PostgreSQL

  const handleDashboardClick = () => {
    if (userIsAdmin) {
      navigate('/admin/dashboard');
    } else if (userIsAmont) {
      navigate('/amont/dashboard');
    } else if (userIsAderente) {
      navigate('/aderente/dashboard');
    } else {
      navigate('/dashboard');
    }
  };

  // Determinar papel principal para exibição
  const displayRole = currentUser ? (
    currentUser.roles.includes(UserRole.ADMIN) ? 'Administrador' :
    currentUser.roles.includes(UserRole.AMONT) ? 'Supervisor (AMONT)' :
    currentUser.roles.includes(UserRole.DOT) ? 'DOT' :
    currentUser.roles.includes(UserRole.ADERENTE) ? 'Aderente' :
    'Utilizador'
  ) : '';

  const displayIcon = currentUser ? (
    currentUser.roles.includes(UserRole.ADMIN) ? '⚙️' :
    currentUser.roles.includes(UserRole.AMONT) ? '👔' :
    currentUser.roles.includes(UserRole.DOT) ? '👨‍💼' :
    currentUser.roles.includes(UserRole.ADERENTE) ? '🏪' :
    '👤'
  ) : '👤';

  return (
    <>
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center cursor-pointer" onClick={handleDashboardClick}>
            <div className="flex-shrink-0 flex items-center gap-2">
                <div className="bg-mousquetaires text-white p-1 rounded font-bold text-xl">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
                </div>
                <div>
                    <h1 className="text-xl font-bold text-gray-900 leading-none">{APP_NAME}</h1>
                    <p className="text-xs text-gray-500 font-medium">{APP_SUBTITLE}</p>
                </div>
            </div>
          </div>
          
          <div className="flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-mousquetaires"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="absolute top-16 right-0 w-64 bg-white shadow-lg border-l border-gray-100 h-screen z-40">
            <div className="pt-4 pb-3 border-b border-gray-100">
              <div className="flex items-center px-5">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                    <User size={20} />
                  </div>
                </div>
                <div className="ml-3">
                  <div className="text-base font-medium leading-none text-gray-800">
                    {currentUser?.name || 'Utilizador'}
                  </div>
                  <div className="text-sm font-medium leading-none text-gray-400 mt-1">
                    {displayIcon} {displayRole}
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-3 px-2 space-y-1">
              {userIsAdmin && (
                <>
                  <div className="px-3 py-2 text-xs font-bold text-gray-400 uppercase">Administração</div>
                  <button 
                    onClick={() => { navigate('/admin/dashboard'); setIsMenuOpen(false); }}
                    className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  >
                    <LayoutDashboard size={18} />
                    Dashboard Admin
                  </button>
                  <button 
                    onClick={() => { navigate('/admin/dashboard?tab=users'); setIsMenuOpen(false); }}
                    className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  >
                    <Users size={18} />
                    Gerir Utilizadores
                  </button>
                  <button 
                    onClick={() => { navigate('/admin/dashboard?tab=stores'); setIsMenuOpen(false); }}
                    className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  >
                    <Settings size={18} />
                    Atribuir Lojas
                  </button>
                </>
              )}
              {userIsAmont && (
                <>
                  <div className="px-3 py-2 text-xs font-bold text-gray-400 uppercase">Supervisão</div>
                  <button 
                    onClick={() => { navigate('/amont/dashboard'); setIsMenuOpen(false); }}
                    className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  >
                    <LayoutDashboard size={18} />
                    Dashboard
                  </button>
                  <button 
                    onClick={() => { navigate('/amont/reports'); setIsMenuOpen(false); }}
                    className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                    Indicadores
                  </button>
                  <button 
                    onClick={() => { navigate('/amont/import-visitas'); setIsMenuOpen(false); }}
                    className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  >
                    <Upload size={18} />
                    Importar Visitas (CSV)
                  </button>
                </>
              )}
              {userIsAderente && (
                <>
                  <div className="px-3 py-2 text-xs font-bold text-gray-400 uppercase">Minhas Visitas</div>
                  <button 
                    onClick={() => { navigate('/aderente/dashboard'); setIsMenuOpen(false); }}
                    className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  >
                    <LayoutDashboard size={18} />
                    Dashboard
                  </button>
                  <button 
                    onClick={() => { navigate('/aderente/actions'); setIsMenuOpen(false); }}
                    className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    Plano de Ação
                  </button>
                </>
              )}
              {!userIsAdmin && !userIsAmont && !userIsAderente && (
                <>
                  <div className="px-3 py-2 text-xs font-bold text-gray-400 uppercase">Auditorias DOT</div>
                  <button 
                    onClick={() => { navigate('/dashboard'); setIsMenuOpen(false); }}
                    className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  >
                    <LayoutDashboard size={18} />
                    Dashboard
                  </button>
                  <button 
                    onClick={() => { navigate('/history'); setIsMenuOpen(false); }}
                    className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 10"/></svg>
                    Histórico
                  </button>
                </>
              )}
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-600 hover:text-red-800 hover:bg-red-50 mt-4 border-t border-gray-100 pt-4"
              >
                <LogOut size={18} />
                Sair
              </button>
            </div>
        </div>
      )}
    </header>
    <ConfirmDialog
      open={confirmState.open}
      message={confirmState.message}
      title="Confirmar reposição"
      confirmText="Repor"
      onCancel={() => setConfirmState(s=>({...s, open:false}))}
      onConfirm={() => { confirmState.onConfirm(); setConfirmState(s=>({...s, open:false})); }}
    />
    </>
  );
};