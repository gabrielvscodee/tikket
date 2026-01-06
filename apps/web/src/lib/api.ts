const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = typeof window !== 'undefined' 
    ? localStorage.getItem('token') 
    : null;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'An error occurred' }));
    throw new ApiError(error.message || 'Request failed', response.status, error);
  }

  return response.json();
}

export const api = {
  // Auth
  login: (email: string, password: string) =>
    fetchApi<{ access_token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  // Users
  getUsers: () => fetchApi<any[]>('/users'),
  getProfile: () => fetchApi<any>('/users/me'),
  updateProfile: (data: { name?: string; email?: string; password?: string; currentPassword?: string }) =>
    fetchApi<any>('/users/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  createUser: (data: { name: string; email: string; password: string; role?: string }) =>
    fetchApi<any>('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Tickets
  getTickets: (filters?: { status?: string; priority?: string; assigneeId?: string; requesterId?: string }) => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.priority) params.append('priority', filters.priority);
    if (filters?.assigneeId) params.append('assigneeId', filters.assigneeId);
    if (filters?.requesterId) params.append('requesterId', filters.requesterId);
    return fetchApi<any[]>(`/tickets?${params.toString()}`);
  },
  getTicket: (id: string) => fetchApi<any>(`/tickets/${id}`),
  createTicket: (data: { subject: string; description: string; priority?: string }) =>
    fetchApi<any>('/tickets', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateTicket: (id: string, data: { subject?: string; description?: string; status?: string; priority?: string }) =>
    fetchApi<any>(`/tickets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  assignTicket: (id: string, assigneeId: string) =>
    fetchApi<any>(`/tickets/${id}/assign`, {
      method: 'POST',
      body: JSON.stringify({ assigneeId }),
    }),
  deleteTicket: (id: string) =>
    fetchApi<void>(`/tickets/${id}`, {
      method: 'DELETE',
    }),

  // Comments
  getComments: (ticketId: string) => fetchApi<any[]>(`/tickets/${ticketId}/comments`),
  createComment: (ticketId: string, data: { content: string; isInternal?: boolean }) =>
    fetchApi<any>(`/tickets/${ticketId}/comments`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateComment: (ticketId: string, commentId: string, data: { content?: string; isInternal?: boolean }) =>
    fetchApi<any>(`/tickets/${ticketId}/comments/${commentId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteComment: (ticketId: string, commentId: string) =>
    fetchApi<void>(`/tickets/${ticketId}/comments/${commentId}`, {
      method: 'DELETE',
    }),
};

