'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Mail, User, Calendar, Briefcase, Ticket } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const userId = params.id as string;

  const { data: userData, isLoading } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => api.getUser(userId),
    enabled: !!userId && (currentUser?.role === 'ADMIN' || currentUser?.role === 'AGENT'),
  });

  const formatStatus = (status: string) => {
    return status.replace(/_/g, ' ');
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
        <p className="text-gray-600">You don't have permission to view this page.</p>
      </div>
    );
  }

  if (isLoading) {
    return <div className="text-center py-8">Loading user...</div>;
  }

  if (!userData) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">User not found</p>
        <Button onClick={() => router.push('/users')} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Users
        </Button>
      </div>
    );
  }

  const requestedTickets = userData.requestedTickets || [];
  const assignedTickets = userData.assignedTickets || [];
  const allTickets = [...requestedTickets, ...assignedTickets];
  const uniqueTickets = Array.from(
    new Map(allTickets.map((ticket: any) => [ticket.id, ticket])).values()
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => router.push('/users')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl sm:text-4xl font-bold tracking-tight">User Details</h1>
          <p className="text-muted-foreground text-base sm:text-lg">View user information and related tickets</p>
        </div>
      </div>

      {/* User Resume Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            User Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <User className="h-4 w-4" />
                Name
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
                Role
              </div>
              <div>
                <Badge variant="outline">{userData.role}</Badge>
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Created At
              </div>
              <div className="text-base">{formatDate(userData.createdAt)}</div>
            </div>
          </div>

          {userData.departments && userData.departments.length > 0 && (
            <div className="space-y-2 pt-4 border-t">
              <div className="text-sm font-medium text-muted-foreground">Departments</div>
              <div className="flex flex-wrap gap-2">
                {userData.departments.map((ud: any) => (
                  <Badge key={ud.department.id} variant="outline">
                    {ud.department.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
            <div className="space-y-1">
              <div className="text-sm font-medium text-muted-foreground">Tickets Requested</div>
              <div className="text-2xl font-bold">{requestedTickets.length}</div>
            </div>
            <div className="space-y-1">
              <div className="text-sm font-medium text-muted-foreground">Tickets Assigned</div>
              <div className="text-2xl font-bold">{assignedTickets.length}</div>
            </div>
            <div className="space-y-1">
              <div className="text-sm font-medium text-muted-foreground">Total Tickets</div>
              <div className="text-2xl font-bold">{uniqueTickets.length}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tickets Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ticket className="h-5 w-5" />
            Related Tickets
          </CardTitle>
        </CardHeader>
        <CardContent>
          {uniqueTickets.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Ticket className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No tickets found for this user</p>
            </div>
          ) : (
            <div className="space-y-4">
              {uniqueTickets.map((ticket: any) => {
                const isRequested = requestedTickets.some((t: any) => t.id === ticket.id);
                const isAssigned = assignedTickets.some((t: any) => t.id === ticket.id);
                
                return (
                  <Link
                    key={ticket.id}
                    href={`/tickets/${ticket.id}`}
                    className="block"
                  >
                    <Card className="hover:border-primary/50 transition-all border-border/50 cursor-pointer group">
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
                                {ticket.priority}
                              </Badge>
                              {isRequested && isAssigned && (
                                <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400">
                                  Requested & Assigned
                                </Badge>
                              )}
                              {isRequested && !isAssigned && (
                                <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400">
                                  Requested
                                </Badge>
                              )}
                              {!isRequested && isAssigned && (
                                <Badge variant="outline" className="bg-purple-50 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400">
                                  Assigned
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
                              {ticket.description}
                            </p>
                            <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-gray-500">
                              {ticket.department && (
                                <span className="break-words">Department: {ticket.department.name}</span>
                              )}
                              {isRequested && ticket.requester && (
                                <span className="break-words">Requester: {ticket.requester.name || ticket.requester.email}</span>
                              )}
                              {isAssigned && ticket.assignee && (
                                <span className="break-words">Assigned to: {ticket.assignee.name || ticket.assignee.email}</span>
                              )}
                              <span>Created: {formatDate(ticket.createdAt)}</span>
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
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
