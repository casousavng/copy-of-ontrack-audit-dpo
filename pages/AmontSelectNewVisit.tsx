import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { ArrowLeft, User, Users } from 'lucide-react';

export const AmontSelectNewVisit: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const selectedDate = location.state?.selectedDate;

  const handleSelectAmont = () => {
    navigate('/amont/new-visit-amont', { state: { selectedDate } });
  };

  const handleSelectDOT = () => {
    navigate('/amont/new-visit-dot', { state: { selectedDate } });
  };

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
            <h1 className="text-3xl font-bold text-gray-900">Nova Visita</h1>
            <p className="text-gray-600 mt-1">Selecione quem vai realizar a visita</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Opção AMONT */}
          <button
            onClick={handleSelectAmont}
            className="bg-white rounded-xl shadow-sm border-2 border-gray-200 p-8 hover:border-mousquetaires hover:shadow-md transition-all text-left group"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 bg-indigo-100 rounded-full flex items-center justify-center group-hover:bg-indigo-200 transition-colors">
                <User className="text-indigo-600" size={28} />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Visita AMONT</h3>
                <p className="text-sm text-gray-500">Para eu realizar</p>
              </div>
            </div>
            <p className="text-gray-600">
              Criar uma visita que você (AMONT) irá realizar pessoalmente. 
              Pode ser Auditoria, Formação, Acompanhamento ou Outros.
            </p>
            <div className="mt-4 text-indigo-600 font-medium text-sm flex items-center gap-2">
              Criar visita para mim
              <ArrowLeft className="rotate-180" size={16} />
            </div>
          </button>

          {/* Opção DOT */}
          <button
            onClick={handleSelectDOT}
            className="bg-white rounded-xl shadow-sm border-2 border-gray-200 p-8 hover:border-mousquetaires hover:shadow-md transition-all text-left group"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center group-hover:bg-green-200 transition-colors">
                <Users className="text-green-600" size={28} />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Atribuir a DOT</h3>
                <p className="text-sm text-gray-500">Para um DOT realizar</p>
              </div>
            </div>
            <p className="text-gray-600">
              Criar uma visita e atribuir a um DOT específico. 
              Pode ser Auditoria, Formação, Acompanhamento ou Outros.
            </p>
            <div className="mt-4 text-green-600 font-medium text-sm flex items-center gap-2">
              Atribuir a um DOT
              <ArrowLeft className="rotate-180" size={16} />
            </div>
          </button>
        </div>

        {selectedDate && (
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Data selecionada:</strong> {new Date(selectedDate).toLocaleDateString('pt-PT', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
        )}
      </main>
    </div>
  );
};
