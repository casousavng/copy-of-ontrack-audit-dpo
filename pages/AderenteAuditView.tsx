import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { Button } from '../components/ui/Button';
import { CommentThread } from '../components/audit/CommentThread';
import { ArrowLeft, Image as ImageIcon, FileText } from 'lucide-react';
import { db } from '../services/dbAdapter';
import { Audit, AuditScore, Checklist, Store } from '../types';

export const AderenteAuditView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [audit, setAudit] = useState<Audit | null>(null);
  const [store, setStore] = useState<Store | null>(null);
  const [checklist, setChecklist] = useState<Checklist | null>(null);
  const [scores, setScores] = useState<AuditScore[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      // Reset loading state when id changes
      setLoading(true);
      
      if (!id) {
        setLoading(false);
        return;
      }
      
      // Get audit by ID directly (all audits are stored globally)
      const auditData = await db.getAuditById(Number(id));
      if (!auditData) {
        navigate('/aderente/dashboard');
        return;
      }

      setAudit(auditData);
      const stores = await db.getStores();
      setStore(stores.find(s => s.id === auditData.store_id) || null);
      const checklistData = await db.getChecklist();
      setChecklist(checklistData);
      const scoresData = await db.getScores(Number(id));
      setScores(scoresData);
      setLoading(false);
    };
    loadData();
  }, [id, navigate]);

  const getScoreForCriteria = (criteriaId: number): AuditScore | undefined => {
    return scores.find(s => s.criteria_id === criteriaId);
  };

  const getScoreBadge = (score: number | null) => {
    if (score === null) return <span className="text-gray-400 text-sm">Não avaliado</span>;
    if (score === 0) return <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded font-medium">N/A</span>;
    
    const color = score <= 2 ? 'red' : score === 3 ? 'yellow' : 'green';
    return (
      <span className={`bg-${color}-100 text-${color}-800 text-xs px-2 py-1 rounded font-medium`}>
        {score}/5
      </span>
    );
  };

  if (loading || !audit || !store || !checklist) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <p className="text-gray-500">A carregar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/aderente/dashboard')}
            className="mb-4"
          >
            <ArrowLeft size={16} className="mr-2" />
            Voltar ao Dashboard
          </Button>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  Visita de Auditoria
                </h1>
                <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                  <div>
                    <span className="font-medium">Loja:</span> {store.brand} - {store.city}
                  </div>
                  <div>
                    <span className="font-medium">Data:</span>{' '}
                    {new Date(audit.dtstart).toLocaleDateString('pt-PT', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </div>
                  {audit.score !== undefined && (
                    <div>
                      <span className="font-medium">Pontuação Final:</span>{' '}
                      <span className={`font-bold ${
                        audit.score < 50 ? 'text-red-600' :
                        audit.score < 80 ? 'text-yellow-600' :
                        'text-green-600'
                      }`}>
                        {audit.score.toFixed(0)}%
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* General Observations */}
            {audit.auditorcomments && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <FileText size={16} />
                  Observações Gerais do Auditor
                </h3>
                <p className="text-sm text-gray-600 whitespace-pre-wrap bg-gray-50 p-4 rounded-lg">
                  {audit.auditorcomments}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Checklist Results */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
          <div className="p-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">
              Resultados da Avaliação
            </h2>
          </div>
          
          <div className="divide-y divide-gray-100">
            {checklist.sections.map(section => (
              <div key={section.id} className="p-6">
                <h3 className="text-base font-semibold text-gray-800 mb-4">
                  {section.name}
                </h3>
                
                {section.items.map(item => (
                  <div key={item.id} className="ml-4 mb-6 last:mb-0">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">
                      {item.name}
                    </h4>
                    
                    <div className="space-y-3">
                      {item.criteria.map(criteria => {
                        const scoreData = getScoreForCriteria(criteria.id);
                        
                        return (
                          <div
                            key={criteria.id}
                            className="ml-4 p-4 bg-gray-50 rounded-lg border border-gray-200"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <p className="text-sm text-gray-900 font-medium">
                                  {criteria.name}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  Peso: {criteria.weight}
                                </p>
                              </div>
                              <div className="ml-4">
                                {getScoreBadge(scoreData?.score ?? null)}
                              </div>
                            </div>

                            {/* Comment */}
                            {scoreData?.comment && (
                              <div className="mt-3 pt-3 border-t border-gray-200">
                                <p className="text-xs font-semibold text-gray-600 mb-1">
                                  💬 Comentário:
                                </p>
                                <p className="text-sm text-gray-700">
                                  {scoreData.comment}
                                </p>
                              </div>
                            )}

                            {/* Photos */}
                            {scoreData?.photos && scoreData.photos.length > 0 && (
                              <div className="mt-3 pt-3 border-t border-gray-200">
                                <p className="text-xs font-semibold text-gray-600 mb-2 flex items-center gap-1">
                                  <ImageIcon size={14} />
                                  Fotografias ({scoreData.photos.length}):
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {scoreData.photos.map((photo, idx) => (
                                    <div
                                      key={idx}
                                      className="relative group cursor-pointer"
                                    >
                                      <img
                                        src={photo}
                                        alt={`Foto ${idx + 1}`}
                                        className="w-20 h-20 object-cover rounded border border-gray-300"
                                        onClick={() => window.open(photo, '_blank')}
                                      />
                                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity rounded flex items-center justify-center">
                                        <span className="text-white text-xs opacity-0 group-hover:opacity-100">
                                          🔍 Ampliar
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Comment Thread */}
        <CommentThread auditId={audit.id} />

        {/* Action Plan Link */}
        <div className="mt-6 text-center">
          <Button
            variant="primary"
            onClick={() => navigate('/aderente/actions')}
          >
            Ver Plano de Ação
          </Button>
        </div>

      </main>
    </div>
  );
};
