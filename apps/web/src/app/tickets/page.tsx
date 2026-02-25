'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Filter, X, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { formatPriority, formatStatus } from '@/lib/utils';
import { getDataFromResponse, isPaginatedResponse, type Ticket, type Department, type Section, type PaginatedResponse } from '@/types';

export default function TicketsPage() {
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');
  const [requesterFilter, setRequesterFilter] = useState<string>('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('');
  const [createdInFilter, setCreatedInFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>('');
  const [selectedSectionId, setSelectedSectionId] = useState<string>('__none__');
  const [createPriority, setCreatePriority] = useState<string>('MEDIUM');
  const [createFiles, setCreateFiles] = useState<File[]>([]);
  const createFileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const { data: departmentsResponse } = useQuery({
    queryKey: ['departments'],
    queryFn: () => api.getDepartments(),
  });

  const departments = getDataFromResponse<Department>(departmentsResponse);

  const { data: sectionsResponse } = useQuery({
    queryKey: ['sections', selectedDepartmentId],
    queryFn: () => api.getSections(selectedDepartmentId),
    enabled: !!selectedDepartmentId,
  });

  const sections = getDataFromResponse<Section>(sectionsResponse);

  const { data: ticketsResponse, isLoading } = useQuery({
    queryKey: [
      'tickets',
      statusFilter,
      priorityFilter,
      requesterFilter,
      departmentFilter,
      createdInFilter,
      searchQuery,
      page,
    ],
    queryFn: () =>
      api.getTickets({
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
        assigneeId: undefined,
        requesterId: requesterFilter || undefined,
        departmentId: departmentFilter || undefined,
        page,
        limit: pageSize,
        search: searchQuery.trim() || undefined,
        createdIn: createdInFilter || undefined,
      }),
  });

  const isPaginated = ticketsResponse ? isPaginatedResponse(ticketsResponse) : false;
  const tickets = getDataFromResponse<Ticket>(ticketsResponse);
  const total = isPaginated && ticketsResponse ? (ticketsResponse as PaginatedResponse<Ticket>).total : tickets.length;
  const totalPages = isPaginated && ticketsResponse ? (ticketsResponse as PaginatedResponse<Ticket>).totalPages : 1;
  const filteredTickets = tickets;

  useEffect(() => {
    setPage(1);
  }, [statusFilter, priorityFilter, requesterFilter, departmentFilter, createdInFilter, searchQuery]);

  const createMutation = useMutation({
    mutationFn: api.createTicket,
  });

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const sectionId = selectedSectionId && selectedSectionId !== '__none__' ? selectedSectionId : undefined;
    const departmentId = selectedDepartmentId || (formData.get('departmentId') as string);
    if (!departmentId) return;

    try {
      const ticket = await createMutation.mutateAsync({
        subject: formData.get('subject') as string,
        description: formData.get('description') as string,
        priority: createPriority || 'MEDIUM',
        departmentId,
        sectionId,
      });
      if (createFiles.length > 0 && ticket?.id) {
        for (const file of createFiles) {
          await api.uploadAttachment(ticket.id, file);
        }
      }
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      setIsCreateOpen(false);
      setCreateFiles([]);
      setSelectedDepartmentId('');
      setSelectedSectionId('__none__');
      setCreatePriority('MEDIUM');
    } catch {
      // Error already shown by mutation
    }
  };

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
      case 'URGENT': return 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-400';
      case 'HIGH': return 'bg-orange-100 text-orange-800 dark:bg-orange-950/40 dark:text-orange-400';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/40 dark:text-yellow-400';
      case 'LOW': return 'bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-950/40 dark:text-gray-400';
    }
  };

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const year = d.getFullYear();
    return `${month}/${day}/${year}`;
  };

  const hasActiveFilters = statusFilter || priorityFilter || requesterFilter || departmentFilter || createdInFilter || searchQuery;
  const clearFilters = () => {
    setStatusFilter('');
    setPriorityFilter('');
    setRequesterFilter('');
    setDepartmentFilter('');
    setCreatedInFilter('');
    setSearchQuery('');
    setPage(1);
  };

  const requestersMap = new Map<string, { id: string; name: string }>();
  tickets.forEach((t: Ticket) => {
    if (t.requesterId && !requestersMap.has(t.requesterId)) {
      requestersMap.set(t.requesterId, {
        id: t.requesterId,
        name: t.requester?.name || t.requester?.email || 'Unknown',
      });
    }
  });
  const requesters = Array.from(requestersMap.values());

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-4xl font-bold tracking-tight">Tickets</h1>
          <p className="text-muted-foreground text-base sm:text-lg">Gerencie e acompanhe tickets de suporte</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={(open) => {
          setIsCreateOpen(open);
          if (!open) {
            setSelectedDepartmentId('');
            setSelectedSectionId('__none__');
            setCreatePriority('MEDIUM');
            setCreateFiles([]);
          }
        }}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Novo Ticket
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Novo Ticket</DialogTitle>
              <DialogDescription>Preencha os detalhes para criar um novo ticket de suporte</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="subject" className="font-semibold">Assunto</Label>
                <Input id="subject" name="subject" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description" className="font-semibold">Descrição</Label>
                <Textarea id="description" name="description" required rows={4} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority" className="font-semibold">Prioridade</Label>
                <Select value={createPriority} onValueChange={setCreatePriority}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma opção" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Baixa</SelectItem>
                    <SelectItem value="MEDIUM">Média</SelectItem>
                    <SelectItem value="HIGH">Alta</SelectItem>
                    <SelectItem value="URGENT">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-wrap gap-4">
                <div className="space-y-2 flex-1 min-w-[200px]">
                  <Label htmlFor="departmentId" className="font-semibold">Departamento</Label>
                  <input type="hidden" name="departmentId" value={selectedDepartmentId} />
                  <Select 
                    required
                    value={selectedDepartmentId || undefined}
                    onValueChange={(value) => {
                      setSelectedDepartmentId(value);
                      setSelectedSectionId('__none__');
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um departamento" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept: Department) => (
                        <SelectItem key={dept.id} value={dept.id}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {selectedDepartmentId && (
                  <div className="space-y-2 flex-1 min-w-[200px]">
                    <Label htmlFor="sectionId" className="font-semibold">Seção (opcional)</Label>
                    <Select value={selectedSectionId} onValueChange={setSelectedSectionId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma seção (opcional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">Nenhuma</SelectItem>
                        {sections.map((section: Section) => (
                          <SelectItem key={section.id} value={section.id}>
                            {section.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label className="font-semibold">Anexos (opcional)</Label>
                <input
                  ref={createFileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    const files = e.target.files;
                    if (files?.length) {
                      setCreateFiles((prev) => [...prev, ...Array.from(files)]);
                      e.target.value = '';
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => createFileInputRef.current?.click()}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Anexar arquivos
                </Button>
                {createFiles.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {createFiles.map((f, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-1.5 rounded-md border bg-muted/50 px-3 py-2 text-sm text-muted-foreground max-w-[180px]"
                      >
                        <span className="truncate flex-1 min-w-0" title={f.name}>{f.name}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 shrink-0"
                          onClick={() => setCreateFiles((prev) => prev.filter((_, j) => j !== i))}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {createMutation.isError && (
                <div className="text-sm text-red-600">
                  {(createMutation.error as ApiError)?.message || 'Falha ao criar ticket'}
                </div>
              )}
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Criando...' : 'Criar Ticket'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="h-4 w-4 mr-1" />
                  Limpar Tudo
                </Button>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search on the left */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1 sm:w-[400px]">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Procure por título ou descrição..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                  {searchQuery && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
              {/* Filters on the right */}
              <div className="flex flex-wrap items-center gap-2 flex-1 justify-end">
                <Filter className="h-4 w-4 text-gray-500 shrink-0" />
                <Select value={statusFilter || 'all'} onValueChange={(value) => setStatusFilter(value === 'all' ? '' : value)}>
                  <SelectTrigger className="w-full sm:w-[140px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Status</SelectItem>
                    <SelectItem value="OPEN">Aberto</SelectItem>
                    <SelectItem value="IN_PROGRESS">Em Andamento</SelectItem>
                    <SelectItem value="WAITING_REQUESTER">Aguardando Solicitante</SelectItem>
                    <SelectItem value="WAITING_AGENT">Aguardando Agente</SelectItem>
                    <SelectItem value="ON_HOLD">Em Espera</SelectItem>
                    <SelectItem value="RESOLVED">Resolvido</SelectItem>
                    <SelectItem value="CLOSED">Fechado</SelectItem>
                  </SelectContent>
                </Select>
                {statusFilter && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setStatusFilter('')}
                    className="h-9 w-9 shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
                <Select value={priorityFilter || 'all'} onValueChange={(value) => setPriorityFilter(value === 'all' ? '' : value)}>
                  <SelectTrigger className="w-full sm:w-[140px]">
                    <SelectValue placeholder="Prioridade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as Prioridades</SelectItem>
                    <SelectItem value="LOW">Baixa</SelectItem>
                    <SelectItem value="MEDIUM">Média</SelectItem>
                    <SelectItem value="HIGH">Alta</SelectItem>
                    <SelectItem value="URGENT">Urgente</SelectItem>
                  </SelectContent>
                </Select>
                {priorityFilter && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setPriorityFilter('')}
                    className="h-9 w-9 shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
                <Select value={departmentFilter || 'all'} onValueChange={(value) => setDepartmentFilter(value === 'all' ? '' : value)}>
                  <SelectTrigger className="w-full sm:w-[140px]">
                    <SelectValue placeholder="Departamento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Departamentos</SelectItem>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {departmentFilter && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDepartmentFilter('')}
                    className="h-9 w-9 shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
                <Input
                  type="date"
                  value={createdInFilter}
                  onChange={(e) => setCreatedInFilter(e.target.value)}
                  className="w-full sm:w-[160px]"
                  placeholder="Criado Em"
                />
                {createdInFilter && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setCreatedInFilter('')}
                    className="h-9 w-9 shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Carregando tickets...</div>
          ) : filteredTickets.length === 0 ? (
            <div className="text-center py-8 text-gray-500">Tickets não encontrados</div>
          ) : (
            <div className="space-y-4">
              {filteredTickets.map((ticket: Ticket) => (
                <Link
                  key={ticket.id}
                  href={`/tickets/${ticket.id}`}
                  className="block p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-muted/40 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h3 className="font-semibold break-words">{ticket.subject}</h3>
                        <Badge className={getStatusColor(ticket.status)}>
                          {formatStatus(ticket.status)}
                        </Badge>
                        <Badge className={getPriorityColor(ticket.priority)}>
                          {formatPriority(ticket.priority)}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-muted-foreground line-clamp-2">
                        {ticket.description}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2 text-xs text-gray-500 dark:text-muted-foreground">
                        <span className="break-words">Solicitante: {ticket.requester?.name || ticket.requester?.email}</span>
                        {ticket.department && (
                          <span className="break-words">Departamento: {ticket.department.name}</span>
                        )}
                        {ticket.assignee && (
                          <span className="break-words">Atribuído a: {ticket.assignee.name || ticket.assignee.email}</span>
                        )}
                        <span>
                          Criado: {formatDate(ticket.createdAt)}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground font-mono shrink-0">
                      #{ticket.id.slice(0, 8)}
                    </span>
                  </div>
                </Link>
              ))}
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Mostrando {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} de {total} tickets
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page <= 1}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Anterior
                    </Button>
                    <span className="text-sm text-muted-foreground px-2">
                      Página {page} de {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page >= totalPages}
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
