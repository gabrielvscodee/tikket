'use client';

import { useState } from 'react';
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
import { Plus, Filter, X } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';

export default function TicketsPage() {
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');
  const [requesterFilter, setRequesterFilter] = useState<string>('');
  const [createdInFilter, setCreatedInFilter] = useState<string>('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: api.getDepartments,
  });

  const { data: tickets, isLoading } = useQuery({
    queryKey: ['tickets', statusFilter, priorityFilter, requesterFilter, createdInFilter],
    queryFn: () => api.getTickets({
      status: statusFilter || undefined,
      priority: priorityFilter || undefined,
      assigneeId: undefined,
      requesterId: requesterFilter || undefined,
    }),
  });

  // Filter by created date on frontend since API doesn't support it
  const filteredTickets = tickets?.filter((ticket: any) => {
    if (createdInFilter) {
      const ticketDate = new Date(ticket.createdAt);
      const filterDate = new Date(createdInFilter);
      const isSameDay = ticketDate.toDateString() === filterDate.toDateString();
      if (!isSameDay) return false;
    }
    return true;
  }) || [];

  const createMutation = useMutation({
    mutationFn: api.createTicket,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      setIsCreateOpen(false);
    },
  });

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createMutation.mutate({
      subject: formData.get('subject') as string,
      description: formData.get('description') as string,
      priority: formData.get('priority') as string || 'MEDIUM',
      departmentId: formData.get('departmentId') as string,
    });
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
  const requestersMap = new Map<string, { id: string; name: string }>();
  tickets?.forEach((t: any) => {
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
          <p className="text-muted-foreground text-base sm:text-lg">Manage and track support tickets</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              New Ticket
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Ticket</DialogTitle>
              <DialogDescription>Fill in the details to create a new support ticket</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input id="subject" name="subject" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" required rows={4} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select name="priority" defaultValue="MEDIUM">
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma opção" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="URGENT">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="departmentId">Department</Label>
                <Select name="departmentId" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments?.map((dept: any) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {createMutation.isError && (
                <div className="text-sm text-red-600">
                  {(createMutation.error as ApiError)?.message || 'Failed to create ticket'}
                </div>
              )}
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Creating...' : 'Create Ticket'}
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
              <CardTitle>All Tickets</CardTitle>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="h-4 w-4 mr-1" />
                  Clear All
                </Button>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500 shrink-0" />
              <Select value={statusFilter || 'all'} onValueChange={(value) => setStatusFilter(value === 'all' ? '' : value)}>
                <SelectTrigger className="w-full sm:w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="OPEN">Open</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="WAITING_REQUESTER">Waiting Requester</SelectItem>
                  <SelectItem value="WAITING_AGENT">Waiting Agent</SelectItem>
                  <SelectItem value="ON_HOLD">On Hold</SelectItem>
                  <SelectItem value="RESOLVED">Resolved</SelectItem>
                  <SelectItem value="CLOSED">Closed</SelectItem>
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
              <Select value={requesterFilter || 'all'} onValueChange={(value) => setRequesterFilter(value === 'all' ? '' : value)}>
                <SelectTrigger className="w-full sm:w-[140px]">
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
              {requesterFilter && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setRequesterFilter('')}
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
                placeholder="Created In"
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
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading tickets...</div>
          ) : filteredTickets.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No tickets found</div>
          ) : (
            <div className="space-y-4">
              {filteredTickets.map((ticket: any) => (
                <Link
                  key={ticket.id}
                  href={`/tickets/${ticket.id}`}
                  className="block p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h3 className="font-medium break-words">{ticket.subject}</h3>
                        <Badge className={getStatusColor(ticket.status)}>
                          {ticket.status}
                        </Badge>
                        <Badge className={getPriorityColor(ticket.priority)}>
                          {ticket.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {ticket.description}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2 text-xs text-gray-500">
                        <span className="break-words">Requester: {ticket.requester?.name || ticket.requester?.email}</span>
                        {ticket.department && (
                          <span className="break-words">Department: {ticket.department.name}</span>
                        )}
                        {ticket.assignee && (
                          <span className="break-words">Assigned to: {ticket.assignee.name || ticket.assignee.email}</span>
                        )}
                        <span>
                          Created: {new Date(ticket.createdAt).toLocaleDateString()}
                        </span>
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
