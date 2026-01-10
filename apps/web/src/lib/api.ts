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

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    // Handle network errors (CORS, connection refused, etc.)
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'An error occurred' }));
      throw new ApiError(error.message || 'Request failed', response.status, error);
    }

    return response.json();
  } catch (error) {
    // Handle network errors (CORS, connection refused, etc.)
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new ApiError(
        'Network error: Unable to connect to the server. Please ensure the API server is running.',
        0,
        { originalError: error.message }
      );
    }
    // Re-throw ApiError instances
    if (error instanceof ApiError) {
      throw error;
    }
    // Handle other errors
    throw new ApiError('An unexpected error occurred', 0, { originalError: error });
  }
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
  getTickets: (filters?: { status?: string; priority?: string; assigneeId?: string; requesterId?: string; departmentId?: string }) => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.priority) params.append('priority', filters.priority);
    if (filters?.assigneeId) params.append('assigneeId', filters.assigneeId);
    if (filters?.requesterId) params.append('requesterId', filters.requesterId);
    if (filters?.departmentId) params.append('departmentId', filters.departmentId);
    return fetchApi<any[]>(`/tickets?${params.toString()}`);
  },
  getTicket: (id: string) => fetchApi<any>(`/tickets/${id}`),
  createTicket: (data: { subject: string; description: string; priority?: string; departmentId: string }) =>
    fetchApi<any>('/tickets', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateTicket: (id: string, data: { subject?: string; description?: string; status?: string; priority?: string; departmentId?: string; assigneeId?: string | null }) =>
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

  // Attachments
  getAttachments: (ticketId: string) => fetchApi<any[]>(`/tickets/${ticketId}/attachments`),
  uploadAttachment: async (ticketId: string, file: File) => {
    const token = typeof window !== 'undefined' 
      ? localStorage.getItem('token') 
      : null;

    const formData = new FormData();
    formData.append('file', file);

    const headers: HeadersInit = {
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    };

    const response = await fetch(`${API_URL}/tickets/${ticketId}/attachments`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'An error occurred' }));
      throw new ApiError(error.message || 'Upload failed', response.status, error);
    }

    return response.json();
  },
  downloadAttachment: (ticketId: string, attachmentId: string) => {
    const token = typeof window !== 'undefined' 
      ? localStorage.getItem('token') 
      : null;

    const headers: HeadersInit = {
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    };

    return fetch(`${API_URL}/tickets/${ticketId}/attachments/${attachmentId}/download`, {
      headers,
    }).then(async (response) => {
      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'An error occurred' }));
        throw new ApiError(error.message || 'Download failed', response.status, error);
      }
      return response.blob();
    });
  },
  deleteAttachment: (ticketId: string, attachmentId: string) =>
    fetchApi<void>(`/tickets/${ticketId}/attachments/${attachmentId}`, {
      method: 'DELETE',
    }),

  // Tenants
  getTenant: () => fetchApi<any>('/tenants/me'),
  updateTenant: (data: { name?: string; slug?: string }) =>
    fetchApi<any>('/tenants/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  getAllTenants: () => fetchApi<any[]>('/tenants'),

  // Departments
  getDepartments: () => fetchApi<any[]>('/departments'),
  getMyDepartments: () => fetchApi<any[]>('/departments/my-departments'),
  getDepartment: (id: string) => fetchApi<any>(`/departments/${id}`),
  createDepartment: (data: { name: string; description?: string }) =>
    fetchApi<any>('/departments', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateDepartment: (id: string, data: { name?: string; description?: string | null }) =>
    fetchApi<any>(`/departments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteDepartment: (id: string) =>
    fetchApi<void>(`/departments/${id}`, {
      method: 'DELETE',
    }),
  addUserToDepartment: (id: string, userId: string) =>
    fetchApi<any>(`/departments/${id}/users`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    }),
  removeUserFromDepartment: (id: string, userId: string) =>
    fetchApi<void>(`/departments/${id}/users/${userId}`, {
      method: 'DELETE',
    }),
  getDepartmentMembers: (id: string) =>
    fetchApi<any[]>(`/departments/${id}/members`),
};

