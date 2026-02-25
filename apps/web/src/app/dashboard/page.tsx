'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/auth-context';
import { formatPriority, formatStatus } from '@/lib/utils';
import { api } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Ticket, CheckCircle2, Clock, Circle, X, MoreVertical } from 'lucide-react';
import Link from 'next/link';
import { getDataFromResponse, type Ticket as TicketType, type Department } from '@/types';
export default function DashboardPage() {
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');
  const [requesterFilter, setRequesterFilter] = useState<string>('');
  const [createdInFilter, setCreatedInFilter] = useState<string>('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('');

  const { data: departmentsResponse } = useQuery({
    queryKey: ['departments'],
    queryFn: () => api.getDepartments(),
  });

  const departments = getDataFromResponse<Department>(departmentsResponse);

  const { data: ticketsResponse, isLoading } = useQuery({
    queryKey: ['tickets', departmentFilter],
    queryFn: () => api.getTickets({
      departmentId: departmentFilter || undefined,
    }),
  });

  const tickets = getDataFromResponse<TicketType>(ticketsResponse);

  const stats = {
    total: tickets.length,
    open: tickets.filter((t: TicketType) => t.status === 'OPEN').length,
    inProgress: tickets.filter((t: TicketType) => 
      t.status === 'IN_PROGRESS' || 
      t.status === 'WAITING_REQUESTER' || 
      t.status === 'WAITING_AGENT'
    ).length,
    onHold: tickets.filter((t: TicketType) => t.status === 'ON_HOLD').length,
    resolved: tickets.filter((t: TicketType) => t.status === 'RESOLVED' || t.status === 'CLOSED').length,
  };

  // Filter tickets for Recent Tickets section
  const filteredTickets = tickets.filter((ticket: TicketType) => {
    if (statusFilter && ticket.status !== statusFilter) return false;
    if (priorityFilter && ticket.priority !== priorityFilter) return false;
    if (requesterFilter && ticket.requesterId !== requesterFilter) return false;
    if (createdInFilter) {
      const ticketDate = new Date(ticket.createdAt);
      const filterDate = new Date(createdInFilter);
      const isSameDay = ticketDate.toDateString() === filterDate.toDateString();
      if (!isSameDay) return false;
    }
    return true;
  });

  const recentTickets = filteredTickets.slice(0, 5);

  const sortByLastChange = (list: TicketType[]) =>
    [...list].sort((a, b) => {
      const dateA = new Date(a.updatedAt ?? a.createdAt).getTime();
      const dateB = new Date(b.updatedAt ?? b.createdAt).getTime();
      return dateB - dateA;
    });
  const KANBAN_MAX_CARDS = 10;

  // Group tickets by status for Kanban; max 10 per column, most recent by updatedAt first
  const openTickets = sortByLastChange(tickets.filter((t: TicketType) => t.status === 'OPEN')).slice(0, KANBAN_MAX_CARDS);
  const inProgressTickets = sortByLastChange(tickets.filter((t: TicketType) =>
    t.status === 'IN_PROGRESS' ||
    t.status === 'WAITING_REQUESTER' ||
    t.status === 'WAITING_AGENT'
  )).slice(0, KANBAN_MAX_CARDS);
  const onHoldTickets = sortByLastChange(tickets.filter((t: TicketType) => t.status === 'ON_HOLD')).slice(0, KANBAN_MAX_CARDS);
  const resolvedTickets = sortByLastChange(tickets.filter((t: TicketType) =>
    t.status === 'RESOLVED' || t.status === 'CLOSED'
  )).slice(0, KANBAN_MAX_CARDS);

  const getPriorityBadgeClass = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800';
      case 'HIGH':
        return 'bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800';
      case 'MEDIUM':
        return 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800';
      case 'LOW':
        return 'bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800';
      default:
        return 'bg-muted/50';
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'OPEN':
        return 'bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800';
      case 'IN_PROGRESS':
        return 'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800';
      case 'WAITING_REQUESTER':
        return 'bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800';
      case 'WAITING_AGENT':
        return 'bg-yellow-50 dark:bg-yellow-950/30 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800';
      case 'ON_HOLD':
        return 'bg-gray-50 dark:bg-gray-950/30 text-gray-700 dark:text-gray-400 border-gray-200 dark:border-gray-800';
      case 'RESOLVED':
        return 'bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800';
      case 'CLOSED':
        return 'bg-slate-50 dark:bg-slate-950/30 text-slate-700 dark:text-slate-400 border-slate-200 dark:border-slate-800';
      default:
        return 'bg-muted/50';
    }
  };

  const hasActiveFilters = statusFilter || priorityFilter || requesterFilter || createdInFilter;
  const clearFilters = () => {
    setStatusFilter('');
    setPriorityFilter('');
    setRequesterFilter('');
    setCreatedInFilter('');
  };

  // Get unique requesters for filter
  const requestersMap = new Map<string, string>();
  tickets.forEach((t: TicketType) => {
    if (t.requesterId && !requestersMap.has(t.requesterId)) {
      requestersMap.set(t.requesterId, t.requester?.name || t.requester?.email || 'Unknown');
    }
  });
  const requesters = Array.from(requestersMap.entries()).map(([id, name]) => ({ id, name }));

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-4xl font-bold tracking-tight">Painel</h1>
        <p className="text-muted-foreground text-base sm:text-lg">Bem-vindo de volta, {user?.name || user?.email}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
        <Card className="border-border hover:border-border transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total de Tickets</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-muted/50 flex items-center justify-center">
              <Ticket className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card className="border-orange-200/50 dark:border-orange-800/50 hover:border-orange-300 dark:hover:border-orange-700 transition-colors bg-gradient-to-br from-background to-orange-50/30 dark:from-background dark:to-orange-950/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Abertos</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-orange-100 dark:bg-orange-950/50 flex items-center justify-center">
              <Circle className="h-4 w-4 text-orange-600 dark:text-orange-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600 dark:text-orange-500">{stats.open}</div>
          </CardContent>
        </Card>

        <Card className="border-blue-200/50 dark:border-blue-800/50 hover:border-blue-300 dark:hover:border-blue-700 transition-colors bg-gradient-to-br from-background to-blue-50/30 dark:from-background dark:to-blue-950/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Em Andamento</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-blue-100 dark:bg-blue-950/50 flex items-center justify-center">
              <Clock className="h-4 w-4 text-blue-600 dark:text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-500">{stats.inProgress}</div>
          </CardContent>
        </Card>

        <Card className="border-gray-200/50 dark:border-gray-800/50 hover:border-gray-300 dark:hover:border-gray-700 transition-colors bg-gradient-to-br from-background to-gray-50/30 dark:from-background dark:to-gray-950/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Em Espera</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-gray-100 dark:bg-gray-950/50 flex items-center justify-center">
              <Clock className="h-4 w-4 text-gray-600 dark:text-gray-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-600 dark:text-gray-500">{stats.onHold}</div>
          </CardContent>
        </Card>

        <Card className="border-green-200/50 dark:border-green-800/50 hover:border-green-300 dark:hover:border-green-700 transition-colors bg-gradient-to-br from-background to-green-50/30 dark:from-background dark:to-green-950/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Resolvidos</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-green-100 dark:bg-green-950/50 flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600 dark:text-green-500">{stats.resolved}</div>
          </CardContent>
        </Card>
      </div>

      {/* Kanban View */}
      <Card className="border-border">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-lg sm:text-xl">Visualização Kanban</CardTitle>
              <CardDescription>Visualize os últimos 10 tickets por status (ordenados pela última alteração)</CardDescription>
            </div>
            <Select value={departmentFilter || 'all'} onValueChange={(value) => setDepartmentFilter(value === 'all' ? '' : value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Todos os Departamentos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Departamentos</SelectItem>
                {departments.map((dept: Department) => (
                  <SelectItem key={dept.id} value={dept.id}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : (
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
              {/* Open Column */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 px-3 py-2 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200/50 dark:border-orange-800/50">
                  <Circle className="h-4 w-4 text-orange-600 dark:text-orange-500" />
                  <span className="font-semibold text-sm">Abertos</span>
                </div>

                <div className="space-y-3 max-h-[calc(3*(180px+12px))] overflow-y-auto pr-2">
                  {openTickets.length === 0 ? (
                    <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
                      No open tickets
                    </div>
                  ) : (
                    openTickets.map((ticket: TicketType) => (
                      <Link key={`open-${ticket.id}`} href={`/tickets/${ticket.id}`} className="block">
                        <Card className="hover:border-primary/50 transition-all border-border cursor-pointer group">
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between gap-2">
                              <CardTitle className="text-base leading-tight group-hover:text-primary transition-colors flex-1">
                                {ticket.subject}
                              </CardTitle>
                              <span className="text-xs text-muted-foreground font-mono shrink-0">
                                #{ticket.id.slice(0, 8)}
                              </span>
                            </div>
                            <CardDescription className="text-sm mt-2 line-clamp-2">
                              {ticket.description}
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="pt-0">
                            <Badge variant="outline" className={getPriorityBadgeClass(ticket.priority)}>
                              {formatPriority(ticket.priority)}
                            </Badge>
                          </CardContent>
                        </Card>
                      </Link>
                    ))
                  )}
                </div>
              </div>

              {/* In Progress Column */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200/50 dark:border-blue-800/50">
                  <Clock className="h-4 w-4 text-blue-600 dark:text-blue-500" />
                  <span className="font-semibold text-sm">Em Andamento</span>
                </div>

                <div className="space-y-3 max-h-[calc(3*(180px+12px))] overflow-y-auto pr-2">
                  {inProgressTickets.length === 0 ? (
                    <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
                      No in progress tickets
                    </div>
                  ) : (
                    inProgressTickets.map((ticket: TicketType) => (
                      <Link key={`inprogress-${ticket.id}`} href={`/tickets/${ticket.id}`} className="block">
                        <Card className="hover:border-primary/50 transition-all border-border cursor-pointer group">
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between gap-2">
                              <CardTitle className="text-base leading-tight group-hover:text-primary transition-colors flex-1">
                                {ticket.subject}
                              </CardTitle>
                              <span className="text-xs text-muted-foreground font-mono shrink-0">
                                #{ticket.id.slice(0, 8)}
                              </span>
                            </div>
                            <CardDescription className="text-sm mt-2 line-clamp-2">
                              {ticket.description}
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="pt-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              {(ticket.status === 'WAITING_AGENT' || ticket.status === 'WAITING_REQUESTER') && (
                                <Badge variant="outline" className={getStatusBadgeClass(ticket.status)}>
                                  {formatStatus(ticket.status)}
                                </Badge>
                              )}
                              <Badge variant="outline" className={getPriorityBadgeClass(ticket.priority)}>
                                {formatPriority(ticket.priority)}
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    ))
                  )}
                </div>
              </div>

              {/* On Hold Column */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-950/20 rounded-lg border border-gray-200/50 dark:border-gray-800/50">
                  <Clock className="h-4 w-4 text-gray-600 dark:text-gray-500" />
                  <span className="font-semibold text-sm">Em Espera</span>
                </div>

                <div className="space-y-3 max-h-[calc(3*(180px+12px))] overflow-y-auto pr-2">
                  {onHoldTickets.length === 0 ? (
                    <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
                      Nenhum ticket em espera
                    </div>
                  ) : (
                    onHoldTickets.map((ticket: TicketType) => (
                      <Link key={`onhold-${ticket.id}`} href={`/tickets/${ticket.id}`} className="block">
                        <Card className="hover:border-primary/50 transition-all border-border cursor-pointer group">
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between gap-2">
                              <CardTitle className="text-base leading-tight group-hover:text-primary transition-colors flex-1">
                                {ticket.subject}
                              </CardTitle>
                              <span className="text-xs text-muted-foreground font-mono shrink-0">
                                #{ticket.id.slice(0, 8)}
                              </span>
                            </div>
                            <CardDescription className="text-sm mt-2 line-clamp-2">
                              {ticket.description}
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="pt-0">
                            <Badge variant="outline" className={getPriorityBadgeClass(ticket.priority)}>
                              {formatPriority(ticket.priority)}
                            </Badge>
                          </CardContent>
                        </Card>
                      </Link>
                    ))
                  )}
                </div>
              </div>

              {/* Resolved Column */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 px-3 py-2 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200/50 dark:border-green-800/50">
                  <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-500" />
                  <span className="font-semibold text-sm">Resolvidos</span>
                </div>

                <div className="space-y-3 max-h-[calc(3*(180px+12px))] overflow-y-auto pr-2">
                  {resolvedTickets.length === 0 ? (
                    <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
                      No resolved tickets
                    </div>
                  ) : (
                    resolvedTickets.map((ticket: TicketType) => (
                      <Link key={`resolved-${ticket.id}`} href={`/tickets/${ticket.id}`} className="block">
                        <Card className="hover:border-primary/50 transition-all border-border cursor-pointer group">
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between gap-2">
                              <CardTitle className="text-base leading-tight group-hover:text-primary transition-colors flex-1">
                                {ticket.subject}
                              </CardTitle>
                              <span className="text-xs text-muted-foreground font-mono shrink-0">
                                #{ticket.id.slice(0, 8)}
                              </span>
                            </div>
                            <CardDescription className="text-sm mt-2 line-clamp-2">
                              {ticket.description}
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="pt-0">
                            <Badge variant="outline" className={getPriorityBadgeClass(ticket.priority)}>
                              {formatPriority(ticket.priority)}
                            </Badge>
                          </CardContent>
                        </Card>
                      </Link>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Tickets */}
      <Card className="border-border">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-lg sm:text-xl">Tickets Recentes</CardTitle>
              <CardDescription>Últimos tickets em seu workspace</CardDescription>
            </div>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="w-full sm:w-auto">
                <X className="h-4 w-4 mr-1" />
                Clear Filters
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-2 sm:gap-3">
            <Select value={statusFilter || 'all'} onValueChange={(value) => setStatusFilter(value === 'all' ? '' : value)}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Todos os Status" />
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

            <Select value={priorityFilter || 'all'} onValueChange={(value) => setPriorityFilter(value === 'all' ? '' : value)}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Todas as Prioridades" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Prioridades</SelectItem>
                <SelectItem value="LOW">Baixa</SelectItem>
                <SelectItem value="MEDIUM">Média</SelectItem>
                <SelectItem value="HIGH">Alta</SelectItem>
                <SelectItem value="URGENT">Urgente</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Ticket List */}
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Carregando tickets...</div>
          ) : recentTickets.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">Nenhum ticket encontrado</div>
          ) : (
            <div className="space-y-3">
              {recentTickets.map((ticket: TicketType) => (
                <Link key={`recent-${ticket.id}`} href={`/tickets/${ticket.id}`} className="block">
                  <Card className="hover:border-primary/50 transition-all border-border cursor-pointer group">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-3">
                          <CardTitle className="text-lg leading-tight group-hover:text-primary transition-colors">
                            {ticket.subject}
                          </CardTitle>
                          <CardDescription className="text-sm leading-relaxed line-clamp-3">
                            {ticket.description}
                          </CardDescription>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={`${getStatusBadgeClass(ticket.status)} font-medium`}>
                              {formatStatus(ticket.status)}
                            </Badge>
                            <Badge variant="outline" className={getPriorityBadgeClass(ticket.priority)}>
                              {formatPriority(ticket.priority)}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <span className="text-xs text-muted-foreground font-mono">
                            #{ticket.id.slice(0, 8)}
                          </span>
                          <Button variant="ghost" size="icon" className="shrink-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
