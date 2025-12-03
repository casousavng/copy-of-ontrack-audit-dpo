import { UserRole } from '../types';
import { getCurrentUser, hasRole } from './auth';

// ====================================
// HIERARQUIA: ADMIN > AMONT > DOT > ADERENTE
// ====================================

export const canCreateAudit = (): boolean => {
  // DOT pode criar auditorias nas suas próprias lojas
  // AMONT pode criar via CSV
  // ADMIN pode criar sempre
  return hasRole(UserRole.DOT) || hasRole(UserRole.AMONT) || hasRole(UserRole.ADMIN);
};

export const canEditAudit = (auditStatus: number, auditUserId?: number, createdBy?: number): boolean => {
  const currentUser = getCurrentUser();
  if (!currentUser) return false;

  // ADMIN pode editar sempre
  if (hasRole(UserRole.ADMIN)) return true;
  
  // AMONT pode editar metadados (não conteúdo específico do DOT)
  if (hasRole(UserRole.AMONT)) return true;
  
  // DOT pode editar apenas se:
  // - É o criador da auditoria (user_id)
  // - Auditoria ainda não foi submetida
  // - Se foi criada por Amont (createdBy), DOT pode preencher mas não pode apagar
  if (hasRole(UserRole.DOT)) {
    return auditStatus < 3 && (!auditUserId || currentUser.userId === auditUserId);
  }
  
  return false;
};

export const canEditAuditDate = (createdBy?: number): boolean => {
  const currentUser = getCurrentUser();
  if (!currentUser) return false;

  // ADMIN pode sempre alterar datas
  if (hasRole(UserRole.ADMIN)) return true;
  
  // AMONT pode alterar datas
  if (hasRole(UserRole.AMONT)) return true;
  
  // DOT pode alterar datas APENAS de auditorias que ele próprio criou
  // NÃO pode alterar datas de auditorias criadas pelo Amont
  if (hasRole(UserRole.DOT) && createdBy) {
    return currentUser.userId === createdBy;
  }
  
  return false;
};

export const canDeleteAudit = (createdBy?: number): boolean => {
  const currentUser = getCurrentUser();
  if (!currentUser) return false;
  
  // ADMIN pode apagar sempre
  if (hasRole(UserRole.ADMIN)) return true;
  
  // DOT pode apagar APENAS auditorias que ele próprio criou manualmente
  // NÃO pode apagar auditorias criadas pelo Amont via CSV
  if (hasRole(UserRole.DOT) && createdBy) {
    return currentUser.userId === createdBy;
  }
  
  return false;
};

export const canViewAudit = (): boolean => {
  // Todos podem ver auditorias (com filtros apropriados)
  return true;
};

export const canSubmitAudit = (auditUserId: number): boolean => {
  const currentUser = getCurrentUser();
  if (!currentUser) return false;
  
  // Apenas o criador DOT pode submeter a sua auditoria
  return currentUser.userId === auditUserId && hasRole(UserRole.DOT);
};

export const canManageActions = (): boolean => {
  // DOT e Aderente podem ver ações
  // AMONT e ADMIN também podem
  return hasRole(UserRole.DOT) || hasRole(UserRole.ADERENTE) || hasRole(UserRole.AMONT) || hasRole(UserRole.ADMIN);
};

export const canCreateActions = (): boolean => {
  // Apenas DOT pode criar ações (após auditoria)
  return hasRole(UserRole.DOT) || hasRole(UserRole.ADMIN);
};

export const canUpdateActionStatus = (actionResponsible: string): boolean => {
  const user = getCurrentUser();
  if (!user) return false;
  
  // ADMIN pode sempre atualizar
  if (hasRole(UserRole.ADMIN)) return true;
  
  // DOT pode sempre atualizar ações que criou
  if (hasRole(UserRole.DOT)) return true;
  
  // Aderente pode atualizar apenas se for responsável
  if (hasRole(UserRole.ADERENTE)) {
    return actionResponsible === 'Aderente' || actionResponsible === 'Ambos';
  }
  
  return false;
};

export const canCloseAudit = (): boolean => {
  // Apenas AMONT e ADMIN podem fechar auditorias
  return hasRole(UserRole.AMONT) || hasRole(UserRole.ADMIN);
};

export const canViewReports = (): boolean => {
  // Apenas AMONT e ADMIN podem ver relatórios
  return hasRole(UserRole.AMONT) || hasRole(UserRole.ADMIN);
};

export const canImportAuditsCSV = (): boolean => {
  // Apenas AMONT e ADMIN podem importar auditorias via CSV
  return hasRole(UserRole.AMONT) || hasRole(UserRole.ADMIN);
};

export const canManageUsers = (): boolean => {
  // Apenas ADMIN pode criar/editar/apagar utilizadores
  return hasRole(UserRole.ADMIN);
};

export const canAssignDOTsToStores = (): boolean => {
  // ADMIN e AMONT podem atribuir DOTs a lojas
  return hasRole(UserRole.ADMIN) || hasRole(UserRole.AMONT);
};

export const canAccessAmontDashboard = (): boolean => {
  return hasRole(UserRole.AMONT) || hasRole(UserRole.ADMIN);
};

export const canAccessAderenteDashboard = (): boolean => {
  return hasRole(UserRole.ADERENTE);
};

export const canAccessDOTDashboard = (): boolean => {
  return hasRole(UserRole.DOT) || hasRole(UserRole.ADMIN);
};

export const canAddInternalComments = (): boolean => {
  // Apenas DOT pode adicionar comentários internos
  return hasRole(UserRole.DOT) || hasRole(UserRole.ADMIN);
};

export const canAccessAdminDashboard = (): boolean => {
  return hasRole(UserRole.ADMIN);
};

// Helper functions para verificação de roles
export const isAdmin = (): boolean => hasRole(UserRole.ADMIN);
export const isAmont = (): boolean => hasRole(UserRole.AMONT);
export const isDOT = (): boolean => hasRole(UserRole.DOT);
export const isAderente = (): boolean => hasRole(UserRole.ADERENTE);

export const getDefaultDashboard = (): string => {
  if (hasRole(UserRole.ADMIN)) return '/admin/dashboard';
  if (hasRole(UserRole.AMONT)) return '/amont/dashboard';
  if (hasRole(UserRole.ADERENTE)) return '/aderente/dashboard';
  if (hasRole(UserRole.DOT)) return '/dashboard';
  return '/';
};
