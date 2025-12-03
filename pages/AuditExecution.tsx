import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { Button } from '../components/ui/Button';
import { CommentThread } from '../components/audit/CommentThread';
import { db } from '../services/dbAdapter';
import { Audit, AuditScore, AuditStatus, Store, Section, Criteria, Checklist } from '../types';
import { ArrowLeft, ChevronLeft, ChevronRight, Camera, Save, CheckCircle, AlertTriangle, Send, X, ListTodo } from 'lucide-react';
import { ScoreGauge } from '../components/charts/ScoreGauge';
import { canEditAudit, canDeleteAudit, canSubmitAudit } from '../utils/permissions';
import { getCurrentUser } from '../utils/auth';
import { UserRole } from '../types';

export const AuditExecution: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  
  const [audit, setAudit] = useState<Audit | null>(null);
  const [store, setStore] = useState<Store | null>(null);
  const [checklist, setChecklist] = useState<Checklist | null>(null);
  const [scores, setScores] = useState<AuditScore[]>([]);
  
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [generalComments, setGeneralComments] = useState('');
  const [criteriaComments, setCriteriaComments] = useState<Record<number, string>>({});
  const [criteriaPhotos, setCriteriaPhotos] = useState<Record<number, string[]>>({});

  useEffect(() => {
    const loadData = async () => {
      // Reset loading state when id changes
      setLoading(true);
      
      if (!id) {
        setLoading(false);
        return;
      }
      const aud = await db.getAuditById(parseInt(id));
      if (!aud) {
          // Redirecionar para o dashboard correto baseado no role
          if (currentUser?.roles.includes(UserRole.ADERENTE)) {
            navigate('/aderente/dashboard');
          } else {
            navigate('/dashboard');
          }
          return;
      }
      setAudit(aud);
      
      const stores = await db.getStores();
      setStore(stores.find(s => s.id === aud.store_id) || null);
      
      const cl = await db.getChecklist();
      setChecklist(cl);

      const sc = await db.getScores(aud.id);
      setScores(sc);
      
      // Load comments and photos from scores
      const comments: Record<number, string> = {};
      const photos: Record<number, string[]> = {};
      sc.forEach(s => {
        if (s.comment) comments[s.criteria_id] = s.comment;
        if (s.photos) photos[s.criteria_id] = s.photos;
      });
      setCriteriaComments(comments);
      setCriteriaPhotos(photos);
      setGeneralComments(aud.auditorcomments || '');
      
      setLoading(false);
    };
    loadData();
  }, [id]);

  const handleScoreChange = async (criteriaId: number, value: number | null) => {
      const scoreId = scores.find(s => s.criteria_id === criteriaId)?.id;
      if (scoreId) {
          await db.updateScore(scoreId, value, criteriaComments[criteriaId], criteriaPhotos[criteriaId]);
          // Update local state
          setScores(prev => prev.map(s => s.id === scoreId ? { ...s, score: value } : s));
          
          // If audit was new, set to in progress
          if (audit && audit.status === AuditStatus.NEW) {
              const updated = { ...audit, status: AuditStatus.IN_PROGRESS };
              await db.updateAudit(updated);
              setAudit(updated);
          }
      }
  };

  const handleCommentChange = async (criteriaId: number, comment: string) => {
      setCriteriaComments(prev => ({ ...prev, [criteriaId]: comment }));
      const scoreId = scores.find(s => s.criteria_id === criteriaId)?.id;
      if (scoreId) {
          await db.updateScore(scoreId, scores.find(s => s.id === scoreId)?.score || null, comment, criteriaPhotos[criteriaId]);
      }
  };

  const handlePhotoUpload = (criteriaId: number, event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (files && files.length > 0) {
          const file = files[0];
          const reader = new FileReader();
          reader.onloadend = async () => {
              const base64 = reader.result as string;
              setCriteriaPhotos(prev => ({
                  ...prev,
                  [criteriaId]: [...(prev[criteriaId] || []), base64]
              }));
              const scoreId = scores.find(s => s.criteria_id === criteriaId)?.id;
              if (scoreId) {
                  const newPhotos = [...(criteriaPhotos[criteriaId] || []), base64];
                  await db.updateScore(scoreId, scores.find(s => s.id === scoreId)?.score || null, criteriaComments[criteriaId], newPhotos);
              }
          };
          reader.readAsDataURL(file);
      }
  };

  const handleRemovePhoto = async (criteriaId: number, photoIndex: number) => {
      setCriteriaPhotos(prev => {
          const newPhotos = [...(prev[criteriaId] || [])];
          newPhotos.splice(photoIndex, 1);
          return { ...prev, [criteriaId]: newPhotos };
      });
      const scoreId = scores.find(s => s.criteria_id === criteriaId)?.id;
      if (scoreId) {
          const newPhotos = [...(criteriaPhotos[criteriaId] || [])];
          newPhotos.splice(photoIndex, 1);
          await db.updateScore(scoreId, scores.find(s => s.id === scoreId)?.score || null, criteriaComments[criteriaId], newPhotos);
      }
  };

  const handleSave = async () => {
      if (audit) {
          const updated = { ...audit, auditorcomments: generalComments };
          await db.updateAudit(updated);
          setAudit(updated);
      }
  };

  const handleSubmit = async () => {
      if (audit) {
          const updated = { 
              ...audit, 
              status: AuditStatus.SUBMITTED,
              auditorcomments: generalComments,
              score: calculateTotalScore()
          };
          await db.updateAudit(updated);
          setAudit(updated);
          setShowSubmitModal(false);
          
          // Redirecionar para o dashboard correto
          if (currentUser?.roles.includes(UserRole.ADERENTE)) {
            navigate('/aderente/dashboard');
          } else {
            navigate('/dashboard');
          }
      }
  };

  const calculateSectionScore = (section: Section) => {
      let total = 0;
      let count = 0;
      section.items.forEach(item => {
          item.criteria.forEach(crit => {
              const s = scores.find(sc => sc.criteria_id === crit.id);
              if (s && s.score !== null && s.score > 0) { // Assuming 0 is N/A
                  total += s.score;
                  count++;
              }
          });
      });
      return count === 0 ? 0 : (total / (count * 5)) * 100; // Percentage
  };

  const calculateTotalScore = () => {
      let total = 0;
      let count = 0;
      scores.forEach(s => {
          if (s.score !== null && s.score > 0) {
              total += s.score;
              count++;
          }
      });
      return count === 0 ? 0 : (total / (count * 5)) * 100;
  };

  const handleFinish = () => {
      handleSave();
      setShowSubmitModal(true);
  };

  if (loading || !audit || !checklist || !store) return <div>Loading...</div>;

  const currentSection = checklist.sections[currentSectionIndex];
  const sectionScore = calculateSectionScore(currentSection);
  
  // Verificar se pode editar baseado nas permissões
  const canEdit = canEditAudit(audit.status, audit.user_id);
  const canSubmit = canSubmitAudit(audit.status);
  const isReadOnly = !canEdit;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50 px-4 py-3 flex items-center justify-between shadow-sm">
          <button onClick={() => {
            if (currentUser?.roles.includes(UserRole.ADERENTE)) {
              navigate('/aderente/dashboard');
            } else {
              navigate('/dashboard');
            }
          }} className="text-gray-600 hover:text-black">
              <ArrowLeft />
          </button>
          <div className="text-center">
              <h2 className="text-sm font-bold text-gray-900 uppercase">GUIÃO DA VISITA</h2>
              <p className="text-xs text-gray-500">{store.brand} {store.city}</p>
          </div>
          <button 
              onClick={() => navigate(`/audit/${id}/actions`)} 
              className="text-gray-600 hover:text-mousquetaires"
              title="Plano de Ação"
          >
              <ListTodo />
          </button>
      </div>

      <main className="flex-1 overflow-y-auto p-4 max-w-4xl mx-auto w-full">
          
          {/* Section Header */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
              <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-lg">{currentSection.name}</h3>
                  <span className={`px-2 py-1 rounded text-xs font-bold ${sectionScore < 50 ? 'bg-red-100 text-red-600' : sectionScore < 80 ? 'bg-yellow-100 text-yellow-600' : 'bg-green-100 text-green-600'}`}>
                      {sectionScore.toFixed(0)}%
                  </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className={`h-2 rounded-full ${sectionScore < 50 ? 'bg-red-500' : sectionScore < 80 ? 'bg-yellow-500' : 'bg-green-500'}`} style={{ width: `${sectionScore}%` }}></div>
              </div>
          </div>

          {/* Items & Criteria */}
          <div className="space-y-6">
              {currentSection.items.map(item => (
                  <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                      <div className="bg-gray-50 px-4 py-2 border-b border-gray-100">
                          <h4 className="font-semibold text-gray-700">{item.name}</h4>
                      </div>
                      <div className="divide-y divide-gray-100">
                          {item.criteria.map(crit => {
                              const scoreVal = scores.find(s => s.criteria_id === crit.id)?.score;
                              
                              return (
                                  <div key={crit.id} className="p-4">
                                      <p className="text-sm font-medium text-gray-800 mb-3">{crit.name}</p>
                                      
                                      <div className="flex flex-wrap items-center justify-between gap-4">
                                          {/* Scoring Buttons */}
                                          <div className="flex items-center space-x-1">
                                              {[1, 2, 3, 4, 5].map(val => (
                                                  <button
                                                      key={val}
                                                      disabled={isReadOnly}
                                                      onClick={() => handleScoreChange(crit.id, val)}
                                                      className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                                                          scoreVal === val 
                                                          ? val <= 2 ? 'bg-red-500 text-white' : val === 3 ? 'bg-yellow-500 text-white' : 'bg-green-500 text-white'
                                                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                                      }`}
                                                  >
                                                      {val}
                                                  </button>
                                              ))}
                                              <div className="w-px h-6 bg-gray-300 mx-2"></div>
                                              <button
                                                  disabled={isReadOnly}
                                                  onClick={() => handleScoreChange(crit.id, 0)} // 0 for N/A
                                                  className={`px-2 py-1 text-xs rounded border ${scoreVal === 0 ? 'bg-gray-600 text-white border-gray-600' : 'bg-white text-gray-500 border-gray-200'}`}
                                              >
                                                  NA
                                              </button>
                                          </div>

                                          {/* Actions */}
                                          <div className="flex items-center space-x-2">
                                              <label className="cursor-pointer">
                                                  <input 
                                                      type="file" 
                                                      accept="image/*" 
                                                      className="hidden" 
                                                      onChange={(e) => handlePhotoUpload(crit.id, e)}
                                                      disabled={isReadOnly}
                                                  />
                                                  <div className="p-2 text-gray-400 hover:text-mousquetaires rounded-full hover:bg-red-50">
                                                      <Camera size={20} />
                                                  </div>
                                              </label>
                                          </div>
                                      </div>
                                      
                                      {/* Photos Preview */}
                                      {criteriaPhotos[crit.id] && criteriaPhotos[crit.id].length > 0 && (
                                          <div className="mt-3 flex flex-wrap gap-2">
                                              {criteriaPhotos[crit.id].map((photo, idx) => (
                                                  <div key={idx} className="relative group">
                                                      <img src={photo} alt="" className="w-20 h-20 object-cover rounded border" />
                                                      {!isReadOnly && (
                                                          <button 
                                                              onClick={() => handleRemovePhoto(crit.id, idx)}
                                                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                                          >
                                                              <X size={12} />
                                                          </button>
                                                      )}
                                                  </div>
                                              ))}
                                          </div>
                                      )}
                                      
                                      {/* Comment Input */}
                                      {scoreVal !== null && scoreVal !== undefined && (
                                          <textarea 
                                            placeholder={scoreVal <= 2 ? "Ação corretiva obrigatória..." : "Observações (opcional)..."} 
                                            className={`mt-3 w-full text-sm border rounded bg-gray-50 px-3 py-2 focus:ring-1 focus:ring-mousquetaires outline-none resize-none ${scoreVal <= 2 ? 'border-red-300' : 'border-gray-200'}`}
                                            rows={2}
                                            value={criteriaComments[crit.id] || ''}
                                            onChange={(e) => handleCommentChange(crit.id, e.target.value)}
                                            disabled={isReadOnly}
                                          />
                                      )}
                                  </div>
                              );
                          })}
                      </div>
                  </div>
              ))}
          </div>

          {/* General Observations Section */}
          {currentSectionIndex === checklist.sections.length - 1 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mt-6">
                  <h4 className="font-semibold text-gray-700 mb-3">Observações Gerais</h4>
                  <textarea
                      className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:ring-1 focus:ring-mousquetaires outline-none resize-none"
                      rows={4}
                      placeholder="Comentários gerais sobre a visita..."
                      value={generalComments}
                      onChange={(e) => setGeneralComments(e.target.value)}
                      disabled={isReadOnly}
                  />
                  {!isReadOnly && (
                      <div className="mt-3 flex justify-end">
                          <Button variant="outline" onClick={handleSave}>
                              <Save className="mr-2" size={16} /> Guardar Rascunho
                          </Button>
                      </div>
                  )}
              </div>
          )}

      </main>

      {/* Submit Confirmation Modal */}
      {showSubmitModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Submeter Visita</h3>
                  <p className="text-gray-600 mb-2">
                      Ao submeter, o guião ficará visível ao Aderente e não poderá ser editado.
                  </p>
                  <p className="text-sm text-gray-500 mb-6">
                      Pontuação final: <span className="font-bold text-mousquetaires">{calculateTotalScore().toFixed(0)}%</span>
                  </p>
                  <div className="flex gap-3">
                      <Button variant="outline" onClick={() => setShowSubmitModal(false)} className="flex-1">
                          Cancelar
                      </Button>
                      <Button onClick={handleSubmit} className="flex-1">
                          <Send className="mr-2" size={16} /> Submeter
                      </Button>
                  </div>
              </div>
          </div>
      )}

      {/* Footer Navigation */}
      <div className="bg-white border-t border-gray-200 p-4 shadow-lg sticky bottom-0">
          <div className="max-w-4xl mx-auto flex justify-between items-center">
              <Button 
                variant="outline" 
                onClick={() => setCurrentSectionIndex(Math.max(0, currentSectionIndex - 1))}
                disabled={currentSectionIndex === 0}
              >
                  <ChevronLeft className="mr-1" size={18} /> Anterior
              </Button>

              <div className="text-sm font-medium text-gray-500">
                  {currentSectionIndex + 1} / {checklist.sections.length}
              </div>

              {currentSectionIndex < checklist.sections.length - 1 ? (
                   <Button 
                    onClick={() => setCurrentSectionIndex(Math.min(checklist.sections.length - 1, currentSectionIndex + 1))}
                   >
                    Próximo <ChevronRight className="ml-1" size={18} />
                   </Button>
              ) : (
                  canSubmit && (
                    <Button variant="secondary" onClick={handleFinish}>
                        Finalizar <CheckCircle className="ml-1" size={18} />
                    </Button>
                  )
              )}
          </div>

          {/* Comment Thread - Only show on last section or if submitted */}
          {(currentSectionIndex === checklist.sections.length - 1 || isReadOnly) && audit && (
            <div className="mt-6">
              <CommentThread auditId={audit.id} />
            </div>
          )}
      </div>
    </div>
  );
};