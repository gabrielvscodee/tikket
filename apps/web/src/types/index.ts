// Common types for the application

export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'WAITING_REQUESTER' | 'WAITING_AGENT' | 'ON_HOLD' | 'RESOLVED' | 'CLOSED';
export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type UserRole = 'ADMIN' | 'AGENT' | 'SUPERVISOR' | 'REQUESTER';

export interface Ticket {
  id: string;
  subject: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  requesterId: string;
  assigneeId?: string | null;
  departmentId: string;
  sectionId?: string | null;
  createdAt: string;
  updatedAt: string;
  requester?: User;
  assignee?: User;
  department?: Department;
  section?: Section;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  disabled: boolean;
  createdAt: string;
  updatedAt: string;
  requestedTickets?: Ticket[];
  assignedTickets?: Ticket[];
  departments?: Department[];
}

export interface Department {
  id: string;
  name: string;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
  members?: User[];
  _count?: {
    members?: number;
  };
}

export interface Section {
  id: string;
  name: string;
  description?: string | null;
  departmentId: string;
  createdAt: string;
  updatedAt: string;
  members?: User[];
  _count?: {
    members?: number;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export type ApiResponse<T> = T[] | PaginatedResponse<T>;

export function isPaginatedResponse<T>(response: ApiResponse<T>): response is PaginatedResponse<T> {
  return typeof response === 'object' && response !== null && 'data' in response && 'total' in response;
}

export function getDataFromResponse<T>(response: ApiResponse<T> | undefined): T[] {
  if (!response) return [];
  if (isPaginatedResponse(response)) {
    return response.data;
  }
  return response;
}
