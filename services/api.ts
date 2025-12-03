const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class ApiClient {
  async request(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Auth
  async login(email: string, password?: string) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async forgotPassword(email: string) {
    return this.request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async verifyResetToken(token: string) {
    return this.request('/auth/verify-reset-token', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  }

  async resetPassword(token: string, password: string) {
    return this.request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    });
  }

  // Users
  async getUsers() {
    return this.request('/users');
  }

  async getUserById(id: number) {
    return this.request(`/users/${id}`);
  }

  async createUser(data: any) {
    return this.request('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateUser(id: number, data: any) {
    return this.request(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteUser(id: number) {
    return this.request(`/users/${id}`, {
      method: 'DELETE',
    });
  }

  // Stores
  async getStores() {
    return this.request('/stores');
  }

  async createStore(data: any) {
    return this.request('/stores', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateStore(id: number, data: any) {
    return this.request(`/stores/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteStore(id: number) {
    return this.request(`/stores/${id}`, {
      method: 'DELETE',
    });
  }

  // Audits
  async getAudits(userId?: number) {
    const query = userId ? `?userId=${userId}` : '';
    return this.request(`/audits${query}`);
  }

  async getAuditById(id: number) {
    return this.request(`/audits/${id}`);
  }

  async createAudit(data: any) {
    return this.request('/audits', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateAudit(id: number, data: any) {
    return this.request(`/audits/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Visits
  async getVisits(params?: { userId?: number; storeId?: number; type?: string }) {
    const query = new URLSearchParams();
    if (params?.userId) query.append('userId', params.userId.toString());
    if (params?.storeId) query.append('storeId', params.storeId.toString());
    if (params?.type) query.append('type', params.type);
    const queryString = query.toString() ? `?${query.toString()}` : '';
    return this.request(`/visits${queryString}`);
  }

  async getVisitById(id: number) {
    return this.request(`/visits/${id}`);
  }

  async createVisit(data: any) {
    return this.request('/visits', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateVisit(id: number, data: any) {
    return this.request(`/visits/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteVisit(id: number) {
    return this.request(`/visits/${id}`, {
      method: 'DELETE',
    });
  }

  // Scores
  async getScores(auditId: number) {
    return this.request(`/scores?auditId=${auditId}`);
  }

  async saveScore(data: any) {
    return this.request('/scores', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Actions
  async getActions(auditId?: number) {
    const query = auditId ? `?auditId=${auditId}` : '';
    return this.request(`/actions${query}`);
  }

  async createAction(data: any) {
    return this.request('/actions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateAction(id: number, data: any) {
    return this.request(`/actions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteAction(id: number) {
    return this.request(`/actions/${id}`, {
      method: 'DELETE',
    });
  }

  // Comments
  async getComments(auditId: number) {
    return this.request(`/comments?auditId=${auditId}`);
  }

  async createComment(data: any) {
    return this.request('/comments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Checklists
  async getChecklists() {
    return this.request('/checklists');
  }

  async getChecklistById(id: number) {
    return this.request(`/checklists/${id}`);
  }
}

export const api = new ApiClient();
