// Database adapter - calls PostgreSQL API instead of localStorage
import { api } from './api';
import type { User, Store, Audit, Visit, ActionPlan, AuditScore, AuditComment, Checklist } from '../types';

class DatabaseAdapter {
  // ============ USERS ============
  async getUsers(): Promise<User[]> {
    return api.getUsers();
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const users = await api.getUsers();
    return users.find((u: User) => u.email === email);
  }

  async getUserById(id: number): Promise<User | undefined> {
    try {
      return await api.getUserById(id);
    } catch {
      return undefined;
    }
  }

  async createUser(userData: Partial<User>): Promise<User> {
    return api.createUser({
      email: userData.email,
      fullname: userData.fullname,
      roles: userData.roles || ['ADERENTE'],
      amontId: userData.amontId,
      assignedStores: userData.assignedStores || []
    });
  }

  async updateUser(user: User): Promise<void> {
    await api.updateUser(user.id, user);
  }

  async deleteUser(userId: number): Promise<void> {
    await api.deleteUser(userId);
  }

  async assignDOTToStore(storeId: number, dotUserId: number): Promise<void> {
    await api.updateStore(storeId, { dotUserId });
  }

  async assignAderenteToStore(storeId: number, aderenteId: number): Promise<void> {
    await api.updateStore(storeId, { aderenteId });
  }

  // ============ STORES ============
  async getStores(): Promise<Store[]> {
    return api.getStores();
  }

  async getStoreById(id: number): Promise<Store | undefined> {
    const stores = await api.getStores();
    return stores.find((s: Store) => s.id === id);
  }

  async getStoresForDOT(dotUserId: number): Promise<Store[]> {
    const stores = await api.getStores();
    return stores.filter((s: Store) => s.dot_user_id === dotUserId);
  }

  async createStore(storeData: Partial<Store>): Promise<Store> {
    return api.createStore(storeData);
  }

  async updateStore(store: Store): Promise<void> {
    await api.updateStore(store.id, store);
  }

  async deleteStore(storeId: number): Promise<void> {
    await api.deleteStore(storeId);
  }

  // ============ AUDITS ============
  async getAudits(userId?: number): Promise<Audit[]> {
    return api.getAudits(userId);
  }

  async getAuditById(id: number): Promise<Audit | undefined> {
    try {
      return await api.getAuditById(id);
    } catch {
      return undefined;
    }
  }

  async createAudit(auditData: Partial<Audit> & { user_id?: number; store_id?: number; checklist_id?: number; created_by?: number }): Promise<Audit> {
    return api.createAudit({
      storeId: auditData.store_id,
      dotUserId: auditData.dot_user_id || auditData.user_id, // Suporta tanto dot_user_id (DOT) como user_id (Aderente)
      checklistId: auditData.checklist_id || 1,
      dtstart: auditData.dtstart,
      status: auditData.status || 'SCHEDULED',
      createdBy: auditData.created_by || auditData.createdBy
    });
  }

  async updateAudit(audit: Audit): Promise<void> {
    await api.updateAudit(audit.id, {
      status: audit.status,
      dtend: audit.dtend,
      finalScore: audit.final_score
    });
  }

  // ============ VISITS ============
  async getVisits(params?: { userId?: number; storeId?: number; type?: string }): Promise<Visit[]> {
    return api.getVisits(params);
  }

  async getVisitsForDOT(dotUserId: number): Promise<Visit[]> {
    return api.getVisits({ userId: dotUserId });
  }

  async getVisitById(id: number): Promise<Visit | undefined> {
    try {
      return await api.getVisitById(id);
    } catch {
      return undefined;
    }
  }

  async createVisit(visitData: Partial<Visit>): Promise<Visit> {
    return api.createVisit({
      storeId: visitData.store_id,
      userId: visitData.user_id,
      type: visitData.type,
      title: visitData.title,
      description: visitData.description || '',
      dtstart: visitData.dtstart,
      status: visitData.status || 'SCHEDULED',
      createdBy: visitData.created_by
    });
  }

  async updateVisit(visit: Visit): Promise<void> {
    await api.updateVisit(visit.id, {
      title: visit.title,
      description: visit.description,
      status: visit.status,
      dtend: visit.dtend
    });
  }

  async deleteVisit(visitId: number): Promise<void> {
    await api.deleteVisit(visitId);
  }

  // ============ SCORES ============
  async getScores(auditId: number): Promise<AuditScore[]> {
    return api.getScores(auditId);
  }

  async saveScore(score: Partial<AuditScore>): Promise<void> {
    await api.saveScore({
      auditId: score.audit_id,
      criteriaId: score.criteria_id,
      score: score.score,
      comment: score.comment,
      photoUrl: score.photo_url
    });
  }

  // ============ ACTIONS ============
  async getActions(auditId?: number): Promise<ActionPlan[]> {
    return api.getActions(auditId);
  }

  async createAction(actionData: Partial<ActionPlan>): Promise<ActionPlan> {
    return api.createAction({
      auditId: actionData.audit_id,
      criteriaId: actionData.criteria_id,
      title: actionData.title,
      description: actionData.description,
      responsible: actionData.responsible,
      dueDate: actionData.due_date,
      createdBy: actionData.created_by
    });
  }

  async updateAction(action: ActionPlan): Promise<void> {
    await api.updateAction(action.id, {
      title: action.title,
      description: action.description,
      status: action.status,
      progress: action.progress,
      completedDate: action.completed_date
    });
  }

  async deleteAction(actionId: number): Promise<void> {
    await api.deleteAction(actionId);
  }

  // ============ COMMENTS ============
  async getComments(auditId: number): Promise<AuditComment[]> {
    return api.getComments(auditId);
  }

  async createComment(commentData: Partial<AuditComment>): Promise<AuditComment> {
    return api.createComment({
      auditId: commentData.audit_id,
      userId: commentData.user_id,
      content: commentData.content,
      isInternal: commentData.is_internal
    });
  }

  // ============ CHECKLISTS ============
  async getChecklist(): Promise<Checklist | null> {
    const checklists = await api.getChecklists();
    return checklists[0] || null;
  }

  async getChecklistById(id: number): Promise<Checklist | undefined> {
    try {
      return await api.getChecklistById(id);
    } catch {
      return undefined;
    }
  }

  // ============ HELPERS ============
  async getDOTsForAmont(amontUserId: number): Promise<User[]> {
    const users = await api.getUsers();
    return users.filter((u: User) => u.amont_id === amontUserId);
  }

  // No-op for compatibility (data now persists in PostgreSQL)
  resetSeeds(): void {
    console.warn('resetSeeds() is deprecated - data is now in PostgreSQL');
  }
}

// Export singleton instance
export const db = new DatabaseAdapter();
