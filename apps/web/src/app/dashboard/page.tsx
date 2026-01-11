'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/auth-context';
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
export default function DashboardPage() {
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');
  const [requesterFilter, setRequesterFilter] = useState<string>('');
  const [createdInFilter, setCreatedInFilter] = useState<string>('');

  const { data: tickets, isLoading } = useQuery({
    queryKey: ['tickets'],
    queryFn: () => api.getTickets(),
  });

  const stats = {
    total: tickets?.length || 0,
    open: tickets?.filter((t: any) => t.status === 'OPEN').length || 0,
    inProgress: tickets?.filter((t: any) => t.status === 'IN_PROGRESS').length || 0,
    resolved: tickets?.filter((t: any) => t.status === 'RESOLVED').length || 0,
  };

  // Filter tickets for Recent Tickets section
  const filteredTickets = tickets?.filter((ticket: any) => {
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
  }) || [];

  const recentTickets = filteredTickets.slice(0, 5);

  // Group tickets by status for Kanban
  const openTickets = tickets?.filter((t: any) => t.status === 'OPEN') || [];
  const inProgressTickets = tickets?.filter((t: any) => t.status === 'IN_PROGRESS') || [];
  const resolvedTickets = tickets?.filter((t: any) => t.status === 'RESOLVED') || [];

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
      case 'RESOLVED':
        return 'bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800';
      case 'CLOSED':
        return 'bg-gray-50 dark:bg-gray-950/30 text-gray-700 dark:text-gray-400 border-gray-200 dark:border-gray-800';
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
  tickets?.forEach((t: any) => {
    if (t.requesterId && !requestersMap.has(t.requesterId)) {
      requestersMap.set(t.requesterId, t.requester?.name || t.requester?.email || 'Unknown');
    }
  });
  const requesters = Array.from(requestersMap.entries()).map(([id, name]) => ({ id, name }));

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-4xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-base sm:text-lg">Welcome back, {user?.name || user?.email}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/50 hover:border-border transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Tickets</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-muted/50 flex items-center justify-center">
              <Ticket className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">All time tickets</p>
          </CardContent>
        </Card>

        <Card className="border-orange-200/50 dark:border-orange-800/50 hover:border-orange-300 dark:hover:border-orange-700 transition-colors bg-gradient-to-br from-background to-orange-50/30 dark:from-background dark:to-orange-950/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Open</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-orange-100 dark:bg-orange-950/50 flex items-center justify-center">
              <Circle className="h-4 w-4 text-orange-600 dark:text-orange-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600 dark:text-orange-500">{stats.open}</div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting response</p>
          </CardContent>
        </Card>

        <Card className="border-blue-200/50 dark:border-blue-800/50 hover:border-blue-300 dark:hover:border-blue-700 transition-colors bg-gradient-to-br from-background to-blue-50/30 dark:from-background dark:to-blue-950/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">In Progress</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-blue-100 dark:bg-blue-950/50 flex items-center justify-center">
              <Clock className="h-4 w-4 text-blue-600 dark:text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-500">{stats.inProgress}</div>
            <p className="text-xs text-muted-foreground mt-1">Being worked on</p>
          </CardContent>
        </Card>

        <Card className="border-green-200/50 dark:border-green-800/50 hover:border-green-300 dark:hover:border-green-700 transition-colors bg-gradient-to-br from-background to-green-50/30 dark:from-background dark:to-green-950/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Resolved</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-green-100 dark:bg-green-950/50 flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600 dark:text-green-500">{stats.resolved}</div>
            <p className="text-xs text-muted-foreground mt-1">Successfully closed</p>
          </CardContent>
        </Card>
      </div>

      {/* Kanban View */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Kanban View</CardTitle>
          <CardDescription>Visualize tickets by status</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : (
            <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
              {/* Open Column */}
              <div className="space-y-3">
                <div className="flex items-center justify-between px-3 py-2 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200/50 dark:border-orange-800/50">
                  <div className="flex items-center gap-2">
                    <Circle className="h-4 w-4 text-orange-600 dark:text-orange-500" />
                    <span className="font-semibold text-sm">Open</span>
                  </div>
                  <Badge variant="secondary" className="font-mono text-xs">
                    {openTickets.length}
                  </Badge>
                </div>

                <div className="space-y-3 min-h-[200px]">
                  {openTickets.map((ticket: any) => (
                    <Link key={`open-${ticket.id}`} href={`/tickets/${ticket.id}`} className="block">
                      <Card className="hover:border-primary/50 transition-all border-border/50 cursor-pointer group">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base leading-tight group-hover:text-primary transition-colors">
                            {ticket.subject}
                          </CardTitle>
                          <CardDescription className="text-sm mt-2 line-clamp-2">
                            {ticket.description}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <Badge variant="outline" className={getPriorityBadgeClass(ticket.priority)}>
                            {ticket.priority}
                          </Badge>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                  {openTickets.length === 0 && (
                    <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
                      No open tickets
                    </div>
                  )}
                </div>
              </div>

              {/* In Progress Column */}
              <div className="space-y-3">
                <div className="flex items-center justify-between px-3 py-2 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200/50 dark:border-blue-800/50">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-600 dark:text-blue-500" />
                    <span className="font-semibold text-sm">In Progress</span>
                  </div>
                  <Badge variant="secondary" className="font-mono text-xs">
                    {inProgressTickets.length}
                  </Badge>
                </div>

                <div className="space-y-3 min-h-[200px]">
                  {inProgressTickets.map((ticket: any) => (
                    <Link key={`inprogress-${ticket.id}`} href={`/tickets/${ticket.id}`} className="block">
                      <Card className="hover:border-primary/50 transition-all border-border/50 cursor-pointer group">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base leading-tight group-hover:text-primary transition-colors">
                            {ticket.subject}
                          </CardTitle>
                          <CardDescription className="text-sm mt-2 line-clamp-2">
                            {ticket.description}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <Badge variant="outline" className={getPriorityBadgeClass(ticket.priority)}>
                            {ticket.priority}
                          </Badge>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                  {inProgressTickets.length === 0 && (
                    <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
                      No in progress tickets
                    </div>
                  )}
                </div>
              </div>

              {/* Resolved Column */}
              <div className="space-y-3">
                <div className="flex items-center justify-between px-3 py-2 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200/50 dark:border-green-800/50">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-500" />
                    <span className="font-semibold text-sm">Resolved</span>
                  </div>
                  <Badge variant="secondary" className="font-mono text-xs">
                    {resolvedTickets.length}
                  </Badge>
                </div>

                <div className="space-y-3 min-h-[200px]">
                  {resolvedTickets.map((ticket: any) => (
                    <Link key={`resolved-${ticket.id}`} href={`/tickets/${ticket.id}`} className="block">
                      <Card className="hover:border-primary/50 transition-all border-border/50 cursor-pointer group">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base leading-tight group-hover:text-primary transition-colors">
                            {ticket.subject}
                          </CardTitle>
                          <CardDescription className="text-sm mt-2 line-clamp-2">
                            {ticket.description}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <Badge variant="outline" className={getPriorityBadgeClass(ticket.priority)}>
                            {ticket.priority}
                          </Badge>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                  {resolvedTickets.length === 0 && (
                    <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
                      No resolved tickets
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Tickets */}
      <Card className="border-border/50">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-lg sm:text-xl">Recent Tickets</CardTitle>
              <CardDescription>Latest tickets in your workspace</CardDescription>
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
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="OPEN">Open</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="RESOLVED">Resolved</SelectItem>
                <SelectItem value="CLOSED">Closed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priorityFilter || 'all'} onValueChange={(value) => setPriorityFilter(value === 'all' ? '' : value)}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="All Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="LOW">Low</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
                <SelectItem value="URGENT">Urgent</SelectItem>
              </SelectContent>
            </Select>

            <Select value={requesterFilter || 'all'} onValueChange={(value) => setRequesterFilter(value === 'all' ? '' : value)}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="All Requesters" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Requesters</SelectItem>
                {requesters.map((requester) => (
                  <SelectItem key={requester.id} value={requester.id}>
                    {requester.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              type="date"
              value={createdInFilter}
              onChange={(e) => setCreatedInFilter(e.target.value)}
              className="w-[180px]"
              placeholder="mm / dd / yyyy"
            />
            {createdInFilter && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCreatedInFilter('')}
                className="h-9 w-9"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Ticket List */}
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading tickets...</div>
          ) : recentTickets.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No tickets found</div>
          ) : (
            <div className="space-y-3">
              {recentTickets.map((ticket: any) => (
                <Link key={`recent-${ticket.id}`} href={`/tickets/${ticket.id}`} className="block">
                  <Card className="hover:border-primary/50 transition-all border-border/50 cursor-pointer group">
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
                              {ticket.status}
                            </Badge>
                            <Badge variant="outline" className={getPriorityBadgeClass(ticket.priority)}>
                              {ticket.priority}
                            </Badge>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" className="shrink-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
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
