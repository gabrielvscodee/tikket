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
import { Ticket, AlertCircle, CheckCircle, Clock, X } from 'lucide-react';
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'bg-red-100 text-red-800';
      case 'HIGH': return 'bg-orange-100 text-orange-800';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800';
      case 'LOW': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
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
  const requesters = Array.from(
    new Set(tickets?.map((t: any) => ({ id: t.requesterId, name: t.requester?.name || t.requester?.email })))
  ).filter((r: any) => r.id) as Array<{ id: string; name: string }>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome back, {user?.name || user?.email}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
            <Ticket className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.open}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inProgress}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.resolved}</div>
          </CardContent>
        </Card>
      </div>

      {/* Kanban View */}
      <Card>
        <CardHeader>
          <CardTitle>Kanban View</CardTitle>
          <CardDescription>Visualize tickets by status</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Open Column */}
              <div className="space-y-3">
                <div className="flex items-center justify-between p-2 bg-orange-50 rounded-lg">
                  <h3 className="font-semibold text-orange-900">Open</h3>
                  <Badge variant="outline">{openTickets.length}</Badge>
                </div>
                <div className="space-y-2 min-h-[200px]">
                  {openTickets.map((ticket: any) => (
                    <Link
                      key={ticket.id}
                      href={`/tickets/${ticket.id}`}
                      className="block p-3 bg-white border rounded-lg hover:shadow-md transition-shadow"
                    >
                      <h4 className="font-medium text-sm mb-1">{ticket.subject}</h4>
                      <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                        {ticket.description}
                      </p>
                      <Badge className={getPriorityColor(ticket.priority)} variant="outline">
                        {ticket.priority}
                      </Badge>
                    </Link>
                  ))}
                  {openTickets.length === 0 && (
                    <div className="text-center text-sm text-gray-400 py-8">No open tickets</div>
                  )}
                </div>
              </div>

              {/* In Progress Column */}
              <div className="space-y-3">
                <div className="flex items-center justify-between p-2 bg-blue-50 rounded-lg">
                  <h3 className="font-semibold text-blue-900">In Progress</h3>
                  <Badge variant="outline">{inProgressTickets.length}</Badge>
                </div>
                <div className="space-y-2 min-h-[200px]">
                  {inProgressTickets.map((ticket: any) => (
                    <Link
                      key={ticket.id}
                      href={`/tickets/${ticket.id}`}
                      className="block p-3 bg-white border rounded-lg hover:shadow-md transition-shadow"
                    >
                      <h4 className="font-medium text-sm mb-1">{ticket.subject}</h4>
                      <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                        {ticket.description}
                      </p>
                      <Badge className={getPriorityColor(ticket.priority)} variant="outline">
                        {ticket.priority}
                      </Badge>
                    </Link>
                  ))}
                  {inProgressTickets.length === 0 && (
                    <div className="text-center text-sm text-gray-400 py-8">No in progress tickets</div>
                  )}
                </div>
              </div>

              {/* Resolved Column */}
              <div className="space-y-3">
                <div className="flex items-center justify-between p-2 bg-green-50 rounded-lg">
                  <h3 className="font-semibold text-green-900">Resolved</h3>
                  <Badge variant="outline">{resolvedTickets.length}</Badge>
                </div>
                <div className="space-y-2 min-h-[200px]">
                  {resolvedTickets.map((ticket: any) => (
                    <Link
                      key={ticket.id}
                      href={`/tickets/${ticket.id}`}
                      className="block p-3 bg-white border rounded-lg hover:shadow-md transition-shadow"
                    >
                      <h4 className="font-medium text-sm mb-1">{ticket.subject}</h4>
                      <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                        {ticket.description}
                      </p>
                      <Badge className={getPriorityColor(ticket.priority)} variant="outline">
                        {ticket.priority}
                      </Badge>
                    </Link>
                  ))}
                  {resolvedTickets.length === 0 && (
                    <div className="text-center text-sm text-gray-400 py-8">No resolved tickets</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Tickets with Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Tickets</CardTitle>
              <CardDescription>Latest tickets in your workspace</CardDescription>
            </div>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-1" />
                Clear Filters
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-wrap gap-2">
            <Select value={statusFilter || 'all'} onValueChange={(value) => setStatusFilter(value === 'all' ? '' : value)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
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
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Priority" />
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
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Requester" />
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
              className="w-[160px]"
              placeholder="Created In"
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
          {isLoading ? (
            <div className="text-center py-8">Loading...</div>
          ) : recentTickets.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No tickets found</div>
          ) : (
            <div className="space-y-4">
              {recentTickets.map((ticket: any) => (
                <Link
                  key={ticket.id}
                  href={`/tickets/${ticket.id}`}
                  className="block p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium">{ticket.subject}</h3>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {ticket.description}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline">{ticket.status}</Badge>
                        <Badge variant="secondary">{ticket.priority}</Badge>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
