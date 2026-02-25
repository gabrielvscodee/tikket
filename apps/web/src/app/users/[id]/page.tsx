'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { api, ApiError } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Mail, User as UserIcon, Calendar, Briefcase, Ticket as TicketIcon, Edit, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { formatPriority, formatStatus } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { getDataFromResponse, type User, type Department, type Ticket } from '@/types';

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const userId = params.id as string;
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editRole, setEditRole] = useState<string>('');
  const [editDisabled, setEditDisabled] = useState<boolean>(false);
  const [editDepartmentIds, setEditDepartmentIds] = useState<string[]>([]);
  const [ticketsPage, setTicketsPage] = useState(1);
  const ticketsPageSize = 20;
  const queryClient = useQueryClient();

  const { data: userData, isLoading } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => api.getUser(userId),
    enabled: !!userId && (currentUser?.role === 'ADMIN' || currentUser?.role === 'AGENT'),
  });

  const { data: departmentsResponse } = useQuery({
    queryKey: ['departments'],
    queryFn: () => api.getDepartments(),
    enabled: currentUser?.role === 'ADMIN',
  });

  const departments = getDataFromResponse<Department>(departmentsResponse);

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { role?: string; disabled?: boolean; departmentIds?: string[] } }) => api.updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', userId] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsEditOpen(false);
    },
  });

  const handleUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!userData) return;

    updateMutation.mutate({
      id: userData.id,
      data: {
        role: editRole,
        disabled: editDisabled,
        departmentIds: editDepartmentIds,
      },
    });
  };

  const handleDepartmentToggle = (deptId: string) => {
    setEditDepartmentIds((prev) =>
      prev.includes(deptId)
        ? prev.filter((id) => id !== deptId)
        : [...prev, deptId]
    );
  };

  // Initialize edit state when userData changes or dialog opens
  useEffect(() => {
    if (userData && isEditOpen) {
      setEditRole(userData.role);
      setEditDisabled(userData.disabled || false);
      setEditDepartmentIds(userData.departments?.map((dept: Department | { department: Department }) => ('department' in dept ? dept.department.id : dept.id)) || []);
    }
  }, [userData, isEditOpen]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN': return 'bg-orange-100 text-orange-800 dark:bg-orange-950/30 dark:text-orange-400';
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800 dark:bg-blue-950/30 dark:text-blue-400';
      case 'WAITING_REQUESTER': return 'bg-purple-100 text-purple-800 dark:bg-purple-950/30 dark:text-purple-400';
      case 'WAITING_AGENT': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/30 dark:text-yellow-400';
      case 'ON_HOLD': return 'bg-gray-100 text-gray-800 dark:bg-gray-950/30 dark:text-gray-400';
      case 'RESOLVED': return 'bg-green-100 text-green-800 dark:bg-green-950/30 dark:text-green-400';
      case 'CLOSED': return 'bg-slate-100 text-slate-800 dark:bg-slate-950/30 dark:text-slate-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-950/30 dark:text-gray-400';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'LOW': return 'bg-gray-100 text-gray-800 dark:bg-gray-950/30 dark:text-gray-400';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/30 dark:text-yellow-400';
      case 'HIGH': return 'bg-orange-100 text-orange-800 dark:bg-orange-950/30 dark:text-orange-400';
      case 'URGENT': return 'bg-red-100 text-red-800 dark:bg-red-950/30 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-950/30 dark:text-gray-400';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };

  if (currentUser?.role !== 'ADMIN' && currentUser?.role !== 'AGENT') {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Você não tem permissão para visualizar esta página.</p>
      </div>
    );
  }

  if (isLoading) {
    return <div className="text-center py-8">Carregando usuário...</div>;
  }

  if (!userData) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Usuário não encontrado</p>
        <Button onClick={() => router.push('/users')} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para Usuários
        </Button>
      </div>
    );
  }

  const requestedTickets = userData.requestedTickets || [];
  const assignedTickets = userData.assignedTickets || [];
  const allTickets = [...requestedTickets, ...assignedTickets];
  const uniqueTickets = Array.from(
    new Map(allTickets.map((ticket) => [ticket.id, ticket])).values()
  ) as Ticket[];
  const ticketsTotal = uniqueTickets.length;
  const ticketsTotalPages = Math.max(1, Math.ceil(ticketsTotal / ticketsPageSize));
  const paginatedTickets = uniqueTickets.slice(
    (ticketsPage - 1) * ticketsPageSize,
    ticketsPage * ticketsPageSize
  );

  useEffect(() => {
    setTicketsPage(1);
  }, [userId]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => router.push('/users')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl sm:text-4xl font-bold tracking-tight">Detalhes do Usuário</h1>
          <p className="text-muted-foreground text-base sm:text-lg">Informações do usuário e tickets relacionados</p>
        </div>
        {currentUser?.role === 'ADMIN' && (
          <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
            <DialogTrigger asChild>
              <Button>
                <Edit className="mr-2 h-4 w-4" />
                Editar Usuário
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Editar Usuário</DialogTitle>
                <DialogDescription>Atualize a função, departamentos e status do usuário</DialogDescription>
              </DialogHeader>
              {userData && (
                <form onSubmit={handleUpdate} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Nome</Label>
                    <div className="text-sm text-muted-foreground p-2 bg-muted rounded-md">
                      {userData.name}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <div className="text-sm text-muted-foreground p-2 bg-muted rounded-md">
                      {userData.email}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-role">Função</Label>
                    <Select value={editRole} onValueChange={setEditRole}>
                      <SelectTrigger id="edit-role">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USER">Usuário</SelectItem>
                        <SelectItem value="AGENT">Agente</SelectItem>
                        <SelectItem value="SUPERVISOR">Supervisor</SelectItem>
                        <SelectItem value="ADMIN">Administrador</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-departments">Departamentos</Label>
                    <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-3">
                      {departments.map((dept: Department) => {
                        const isSelected = editDepartmentIds.includes(dept.id);
                        return (
                          <label
                            key={dept.id}
                            className="flex items-center gap-2 p-2 rounded hover:bg-muted cursor-pointer"
                            onClick={() => handleDepartmentToggle(dept.id)}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleDepartmentToggle(dept.id)}
                              className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                            />
                            <span className="text-sm">{dept.name}</span>
                          </label>
                        );
                      })}
                      {(!departments || departments.length === 0) && (
                        <p className="text-sm text-muted-foreground">Nenhum departamento disponível</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Status da conta</Label>
                      <p className="text-sm text-muted-foreground">
                        {editDisabled ? 'Usuário inativo e não pode fazer login' : 'Usuário ativo e pode fazer login'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="text-sm">
                        {editDisabled ? 'Inativo' : 'Ativo'}
                      </Label>
                      <Switch
                        checked={editDisabled}
                        onCheckedChange={setEditDisabled}
                      />
                    </div>
                  </div>
                  {updateMutation.isError && (
                    <div className="text-sm text-red-600">
                      {(updateMutation.error as ApiError)?.message || 'Falha ao atualizar usuário'}
                    </div>
                  )}
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsEditOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={updateMutation.isPending}>
                      {updateMutation.isPending ? 'Atualizando...' : 'Atualizar Usuário'}
                    </Button>
                  </div>
                </form>
              )}
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* User Resume Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserIcon className="h-5 w-5" />
            Informações do Usuário
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <UserIcon className="h-4 w-4" />
                Nome
              </div>
              <div className="text-base font-semibold">{userData.name}</div>
            </div>
            <div className="space-y-1">
              <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email
              </div>
              <div className="text-base break-words">{userData.email}</div>
            </div>
            <div className="space-y-1">
              <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Função
              </div>
              <div>
                <Badge variant="outline">{userData.role}</Badge>
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-sm font-medium text-muted-foreground">Status</div>
              <div>
                <Badge variant={userData.disabled ? "destructive" : "default"}>
                  {userData.disabled ? 'Inativo' : 'Ativo'}
                </Badge>
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Criado Em
              </div>
              <div className="text-base">{formatDate(userData.createdAt)}</div>
            </div>
          </div>

          {userData.departments && userData.departments.length > 0 && (
            <div className="space-y-2 pt-4 border-t">
              <div className="text-sm font-medium text-muted-foreground">Departamentos</div>
              <div className="flex flex-wrap gap-2">
                {userData.departments.map((dept: Department | { department: Department }) => {
                  const department = 'department' in dept ? dept.department : dept;
                  return (
                    <Badge key={department.id} variant="outline">
                      {department.name}
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
            <div className="space-y-1">
              <div className="text-sm font-medium text-muted-foreground">Tickets solicitados</div>
              <div className="text-2xl font-bold">{requestedTickets.length}</div>
            </div>
            <div className="space-y-1">
              <div className="text-sm font-medium text-muted-foreground">Tickets Atribuídos</div>
              <div className="text-2xl font-bold">{assignedTickets.length}</div>
            </div>
            <div className="space-y-1">
              <div className="text-sm font-medium text-muted-foreground">Total de Tickets</div>
              <div className="text-2xl font-bold">{uniqueTickets.length}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tickets Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TicketIcon className="h-5 w-5" />
            Tickets Relacionados
          </CardTitle>
        </CardHeader>
        <CardContent>
          {uniqueTickets.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <TicketIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Nenhum ticket encontrado para este usuário</p>
            </div>
          ) : (
            <div className="space-y-4">
              {paginatedTickets.map((ticket: Ticket) => {
                const isRequested = requestedTickets.some((t: Ticket) => t.id === ticket.id);
                const isAssigned = assignedTickets.some((t: Ticket) => t.id === ticket.id);
                
                return (
                  <Link
                    key={ticket.id}
                    href={`/tickets/${ticket.id}`}
                    className="block"
                  >
                    <Card className="hover:border-primary/50 transition-all border-border cursor-pointer group">
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              <h3 className="font-semibold break-words group-hover:text-primary transition-colors">
                                {ticket.subject}
                              </h3>
                              <Badge className={getStatusColor(ticket.status)}>
                                {formatStatus(ticket.status)}
                              </Badge>
                              <Badge className={getPriorityColor(ticket.priority)}>
                                {formatPriority(ticket.priority)}
                              </Badge>
                              {isRequested && isAssigned && (
                                <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400">
                                  Solicitado & Atribuído
                                </Badge>
                              )}
                              {isRequested && !isAssigned && (
                                <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400">
                                  Solicitado
                                </Badge>
                              )}
                              {!isRequested && isAssigned && (
                                <Badge variant="outline" className="bg-purple-50 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400">
                                  Atribuído
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
                              {ticket.description}
                            </p>
                            <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-gray-500">
                              {ticket.department && (
                                <span className="break-words">Departamento: {ticket.department.name}</span>
                              )}
                              {isRequested && ticket.requester && (
                                <span className="break-words">Solicitante: {ticket.requester.name || ticket.requester.email}</span>
                              )}
                              {isAssigned && ticket.assignee && (
                                <span className="break-words">Atribuído a: {ticket.assignee.name || ticket.assignee.email}</span>
                              )}
                              <span>Criado: {formatDate(ticket.createdAt)}</span>
                            </div>
                          </div>
                          <span className="text-xs text-muted-foreground font-mono shrink-0">
                            #{ticket.id.slice(0, 8)}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
              {ticketsTotalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Mostrando {(ticketsPage - 1) * ticketsPageSize + 1}–{Math.min(ticketsPage * ticketsPageSize, ticketsTotal)} de {ticketsTotal} tickets
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setTicketsPage((p) => Math.max(1, p - 1))}
                      disabled={ticketsPage <= 1}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Anterior
                    </Button>
                    <span className="text-sm text-muted-foreground px-2">
                      Página {ticketsPage} de {ticketsTotalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setTicketsPage((p) => Math.min(ticketsTotalPages, p + 1))}
                      disabled={ticketsPage >= ticketsTotalPages}
                    >
                      Próxima
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
