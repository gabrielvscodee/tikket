'use client';

import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, MessageSquare, Send, Lock } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { useState } from 'react';

export default function TicketDetailPage() {
  const params = useParams();
  const ticketId = params.id as string;
  const { user } = useAuth();
  const [comment, setComment] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const queryClient = useQueryClient();

  const { data: ticket, isLoading } = useQuery({
    queryKey: ['ticket', ticketId],
    queryFn: () => api.getTicket(ticketId),
  });

  const { data: comments } = useQuery({
    queryKey: ['comments', ticketId],
    queryFn: () => api.getComments(ticketId),
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => api.updateTicket(ticketId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    },
  });

  const commentMutation = useMutation({
    mutationFn: () => api.createComment(ticketId, { content: comment, isInternal }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', ticketId] });
      setComment('');
      setIsInternal(false);
    },
  });

  const isAgent = user?.role === 'ADMIN' || user?.role === 'AGENT';

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN': return 'bg-orange-100 text-orange-800';
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800';
      case 'RESOLVED': return 'bg-green-100 text-green-800';
      case 'CLOSED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading ticket...</div>;
  }

  if (!ticket) {
    return <div className="text-center py-8">Ticket not found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/tickets">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{ticket.subject}</h1>
          <p className="text-gray-600 mt-2">Ticket #{ticket.id.slice(0, 8)}</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{ticket.description}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Comments
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {comments?.map((c: any) => (
                <div
                  key={c.id}
                  className={`p-4 border rounded-lg ${
                    c.isInternal ? 'bg-yellow-50 border-yellow-200' : ''
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{c.author.name || c.author.email}</span>
                      {c.isInternal && (
                        <Badge variant="outline" className="text-xs">
                          <Lock className="h-3 w-3 mr-1" />
                          Internal
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(c.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{c.content}</p>
                </div>
              ))}

              <Separator />

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="comment">Add Comment</Label>
                  <Textarea
                    id="comment"
                    placeholder="Write a comment..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={4}
                  />
                </div>
                {isAgent && (
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="internal"
                      checked={isInternal}
                      onChange={(e) => setIsInternal(e.target.checked)}
                      className="rounded"
                    />
                    <Label htmlFor="internal" className="text-sm font-normal cursor-pointer">
                      Internal comment (only visible to agents/admins)
                    </Label>
                  </div>
                )}
                <Button
                  onClick={() => commentMutation.mutate()}
                  disabled={!comment.trim() || commentMutation.isPending}
                >
                  <Send className="mr-2 h-4 w-4" />
                  {commentMutation.isPending ? 'Sending...' : 'Send Comment'}
                </Button>
                {commentMutation.isError && (
                  <div className="text-sm text-red-600">
                    {(commentMutation.error as ApiError)?.message || 'Failed to add comment'}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-xs text-gray-500">Status</Label>
                {isAgent ? (
                  <Select
                    value={ticket.status}
                    onValueChange={(value) => updateMutation.mutate({ status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="OPEN">Open</SelectItem>
                      <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                      <SelectItem value="RESOLVED">Resolved</SelectItem>
                      <SelectItem value="CLOSED">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="mt-1">
                    <Badge className={getStatusColor(ticket.status)}>
                      {ticket.status}
                    </Badge>
                  </div>
                )}
              </div>
              <div>
                <Label className="text-xs text-gray-500">Priority</Label>
                <div className="mt-1">
                  <Badge variant="outline">{ticket.priority}</Badge>
                </div>
              </div>
              <div>
                <Label className="text-xs text-gray-500">Requester</Label>
                <p className="mt-1 text-sm">
                  {ticket.requester?.name || ticket.requester?.email}
                </p>
              </div>
              {ticket.assignee && (
                <div>
                  <Label className="text-xs text-gray-500">Assigned To</Label>
                  <p className="mt-1 text-sm">
                    {ticket.assignee.name || ticket.assignee.email}
                  </p>
                </div>
              )}
              <div>
                <Label className="text-xs text-gray-500">Created</Label>
                <p className="mt-1 text-sm">
                  {new Date(ticket.createdAt).toLocaleString()}
                </p>
              </div>
              <div>
                <Label className="text-xs text-gray-500">Updated</Label>
                <p className="mt-1 text-sm">
                  {new Date(ticket.updatedAt).toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

