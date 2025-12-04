// Database adapter - calls PostgreSQL API instead of localStorage
import { api } from './api';
import { User, Store, Audit, Visit, ActionPlan, AuditScore, AuditComment, Checklist, AuditStatus } from '../types';

class DatabaseAdapter {
  // ============ USERS ============
  async getUsers(): Promise<User[]> {
    const users = await api.getUsers();
    return users.map((u: any) => ({
      ...u,
      amontId: u.amont_id,
      assignedStores: u.assigned_stores
    }));
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const users = await this.getUsers();
    return users.find((u: User) => u.email === email);
  }

  async getUserById(id: number): Promise<User | undefined> {
    try {
      const u = await api.getUserById(id);
      if (!u) return undefined;
      return {
        ...u,
        amontId: u.amont_id,
        assignedStores: u.assigned_stores
      };
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
    const stores = await api.getStores();
    // Normalize snake_case to camelCase
    return stores.map((s: any) => ({
      ...s,
      dotUserId: s.dot_user_id,
      aderenteId: s.aderente_id
    }));
  }

  async getStoreById(id: number): Promise<Store | undefined> {
    const stores = await this.getStores();
    return stores.find((s: Store) => s.id === id);
  }

  async getStoresForDOT(dotUserId: number): Promise<Store[]> {
    const stores = await this.getStores();
    // Convert to number for comparison to handle string IDs from localStorage
    const userId = Number(dotUserId);
    return stores.filter((s: Store) => 
      Number(s.dotUserId) === userId || Number(s.dot_user_id) === userId
    );
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
    let statusStr = 'SCHEDULED';
    if (auditData.status) {
      switch (auditData.status) {
        case AuditStatus.NEW: statusStr = 'SCHEDULED'; break;
        case AuditStatus.IN_PROGRESS: statusStr = 'IN_PROGRESS'; break;
        case AuditStatus.SUBMITTED: statusStr = 'COMPLETED'; break;
        case AuditStatus.ENDED: statusStr = 'COMPLETED'; break;
        case AuditStatus.CLOSED: statusStr = 'COMPLETED'; break;
        case AuditStatus.CANCELLED: statusStr = 'CANCELLED'; break;
        default: statusStr = 'SCHEDULED';
      }
    }

    return api.createAudit({
      storeId: auditData.store_id,
      dotUserId: auditData.dot_user_id || auditData.user_id, // Suporta tanto dot_user_id (DOT) como user_id (Aderente)
      checklistId: auditData.checklist_id || 1,
      dtstart: auditData.dtstart,
      status: statusStr,
      createdBy: auditData.created_by || auditData.createdBy
    });
  }

  async updateAudit(auditOrId: Audit | number, partialData?: Partial<Audit>): Promise<void> {
    let id: number;
    let status: AuditStatus;
    let dtend: string | undefined;
    let final_score: number | undefined;
    let auditorcomments: string | undefined;

    if (typeof auditOrId === 'number') {
      // Called with (id, partialData)
      id = auditOrId;
      status = partialData?.status ?? AuditStatus.NEW;
      dtend = partialData?.dtend;
      final_score = partialData?.final_score;
      auditorcomments = partialData?.auditorcomments;
    } else {
      // Called with (audit)
      id = auditOrId.id;
      status = auditOrId.status;
      dtend = auditOrId.dtend;
      final_score = auditOrId.final_score;
      auditorcomments = auditOrId.auditorcomments;
    }

    let statusStr = 'SCHEDULED';
    // Map numeric enum to string enum for DB
    switch (status) {
      case AuditStatus.NEW: statusStr = 'SCHEDULED'; break;
      case AuditStatus.IN_PROGRESS: statusStr = 'IN_PROGRESS'; break;
      case AuditStatus.SUBMITTED: statusStr = 'COMPLETED'; break;
      case AuditStatus.ENDED: statusStr = 'COMPLETED'; break;
      case AuditStatus.CLOSED: statusStr = 'COMPLETED'; break;
      case AuditStatus.CANCELLED: statusStr = 'CANCELLED'; break;
      default: statusStr = 'SCHEDULED';
    }

    await api.updateAudit(id, {
      status: statusStr,
      dtend,
      finalScore: final_score,
      auditorcomments
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

  async saveScore(score: Partial<AuditScore> & { photo_url?: string }): Promise<void> {
    await api.saveScore({
      auditId: score.audit_id,
      criteriaId: score.criteria_id,
      score: score.score,
      comment: score.comment,
      photoUrl: (score as any).photo_url || (score as any).photoUrl
    });
  }

  // ============ ACTIONS ============
  async getActions(auditId?: number): Promise<ActionPlan[]> {
    return api.getActions(auditId);
  }

  async createAction(actionData: Partial<ActionPlan> & { audit_id?: number; criteria_id?: number; due_date?: string; created_by?: number }): Promise<ActionPlan> {
    return api.createAction({
      auditId: (actionData as any).audit_id || actionData.audit_id,
      criteriaId: (actionData as any).criteria_id || actionData.criteria_id,
      title: actionData.title,
      description: actionData.description,
      responsible: actionData.responsible,
      dueDate: (actionData as any).due_date || actionData.dueDate,
      createdBy: (actionData as any).created_by || actionData.createdBy
    });
  }

  async updateAction(action: ActionPlan): Promise<void> {
    await api.updateAction(action.id, {
      title: action.title,
      description: action.description,
      status: action.status,
      progress: action.progress,
      completedDate: action.completedDate || (action as any).completed_date
    });
  }

  async deleteAction(actionId: number): Promise<void> {
    await api.deleteAction(actionId);
  }

  // ============ COMMENTS ============
  async getComments(auditId: number): Promise<AuditComment[]> {
    return api.getComments(auditId);
  }

  async createComment(commentData: Partial<AuditComment> & { audit_id?: number; user_id?: number; is_internal?: boolean }): Promise<AuditComment> {
    return api.createComment({
      auditId: commentData.audit_id,
      userId: commentData.user_id,
      // accept both 'comment' (UI) and 'content' (API) keys
      content: (commentData as any).comment ?? (commentData as any).content ?? '',
      // accept both 'isInternal' (UI) and 'is_internal' (API) keys
      isInternal: (commentData as any).isInternal ?? (commentData as any).is_internal ?? false
    });
  }

  // ============ CHECKLISTS ============
  async getChecklist(): Promise<Checklist | null> {
    const checklists = await api.getChecklists();
    return checklists[0] || null;
  }

  async getChecklists(): Promise<Checklist[]> {
    const checklists = await api.getChecklists();
    // Normalize target_role to targetRole for frontend compatibility
    return checklists.map((c: any) => ({
      ...c,
      targetRole: c.target_role || c.targetRole
    }));
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
    return users.filter((u: any) => u.amont_id === amontUserId || u.amontId === amontUserId);
  }

  // No-op for compatibility (data now persists in PostgreSQL)
  resetSeeds(): void {
    console.warn('resetSeeds() is deprecated - data is now in PostgreSQL');
  }
}

// Export singleton instance
export const db = new DatabaseAdapter();
