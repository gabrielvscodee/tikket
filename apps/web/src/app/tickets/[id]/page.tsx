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
import { ArrowLeft, MessageSquare, Send, Lock, Paperclip, Image as ImageIcon, Download, Trash2, X, History } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { useState, useRef, useEffect, useMemo } from 'react';
import { formatPriority, formatStatus } from '@/lib/utils';

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

function ImageThumbnailSmall({
  attachment,
  ticketId,
  onLoadPreview,
  imagePreviews,
}: {
  attachment: any;
  ticketId: string;
  onLoadPreview: (id: string) => Promise<string | null>;
  imagePreviews: Record<string, string>;
}) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(imagePreviews[attachment.id] || null);

  useEffect(() => {
    if (attachment.isImage && !previewUrl) {
      onLoadPreview(attachment.id).then((url) => {
        if (url) {
          setPreviewUrl(url);
        }
      });
    }
  }, [attachment.id, attachment.isImage]);

  return (
    <div className="w-12 h-12 rounded overflow-hidden bg-gray-100 flex-shrink-0">
      {previewUrl ? (
        <img
          src={previewUrl}
          alt={attachment.filename}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <ImageIcon className="h-6 w-6 text-gray-400" />
        </div>
      )}
    </div>
  );
}

function ImageThumbnail({ 
  attachment, 
  ticketId, 
  onPreview, 
  onLoadPreview 
}: { 
  attachment: any; 
  ticketId: string; 
  onPreview: (url: string) => void;
  onLoadPreview: (id: string) => Promise<string | null>;
}) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (attachment.isImage) {
      onLoadPreview(attachment.id).then((url) => {
        if (url) {
          setPreviewUrl(url);
        }
        setLoading(false);
      });
    }

    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        window.URL.revokeObjectURL(previewUrl);
      }
    };
  }, [attachment.id, attachment.isImage]);

  const handleClick = async () => {
    if (previewUrl) {
      onPreview(previewUrl);
    } else {
      const url = await onLoadPreview(attachment.id);
      if (url) {
        onPreview(url);
      }
    }
  };

  return (
    <div className="space-y-2">
      <div
        className="relative aspect-square cursor-pointer rounded overflow-hidden bg-gray-100 group"
        onClick={handleClick}
      >
        {loading ? (
          <div className="w-full h-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400"></div>
          </div>
        ) : previewUrl ? (
          <>
            <img
              src={previewUrl}
              alt={attachment.filename}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
              <ImageIcon className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon className="h-8 w-8 text-gray-400" />
          </div>
        )}
      </div>
      <p className="text-xs text-gray-600 truncate" title={attachment.filename}>
        {attachment.filename}
      </p>
      <p className="text-xs text-gray-400">{formatFileSize(attachment.size)}</p>
      {attachment.createdAt && (
        <p className="text-xs text-gray-400">
          Added: {new Date(attachment.createdAt).toLocaleString()}
        </p>
      )}
    </div>
  );
}

export default function TicketDetailPage() {
  const params = useParams();
  const ticketId = params.id as string;
  const { user } = useAuth();
  const [comment, setComment] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const queryClient = useQueryClient();

  const isAgent = user?.role === 'ADMIN' || user?.role === 'AGENT';
  const canSeeHistory = user?.role === 'ADMIN' || user?.role === 'AGENT' || user?.role === 'SUPERVISOR';

  const { data: ticket, isLoading } = useQuery({
    queryKey: ['ticket', ticketId],
    queryFn: () => api.getTicket(ticketId),
  });

  const { data: comments } = useQuery({
    queryKey: ['comments', ticketId],
    queryFn: () => api.getComments(ticketId),
  });

  const { data: history } = useQuery({
    queryKey: ['ticket-history', ticketId],
    queryFn: () => api.getTicketHistory(ticketId),
    enabled: !!ticketId && canSeeHistory,
  });

  const { data: attachments } = useQuery({
    queryKey: ['attachments', ticketId],
    queryFn: () => api.getAttachments(ticketId),
  });

  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: () => api.getDepartments(),
    enabled: isAgent,
  });

  const { data: sections } = useQuery({
    queryKey: ['sections', ticket?.departmentId],
    queryFn: () => api.getSections(ticket.departmentId),
    enabled: isAgent && !!ticket?.departmentId,
  });

  const { data: departmentMembers } = useQuery({
    queryKey: ['departmentMembers', ticket?.departmentId],
    queryFn: () => api.getDepartmentMembers(ticket.departmentId),
    enabled: isAgent && !!ticket?.departmentId,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const updateMutation = useMutation({
    mutationFn: (data: any) => api.updateTicket(ticketId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['ticket-history', ticketId] });
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

  const uploadMutation = useMutation({
    mutationFn: (file: File) => api.uploadAttachment(ticketId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attachments', ticketId] });
      queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] });
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    onError: () => {
      setUploading(false);
    },
  });

  const deleteAttachmentMutation = useMutation({
    mutationFn: (attachmentId: string) => api.deleteAttachment(ticketId, attachmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attachments', ticketId] });
      queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] });
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploading(true);
      uploadMutation.mutate(file);
    }
  };

  const timeline = useMemo(() => {
    const items: { type: 'comment' | 'history'; createdAt: string; data: any }[] = [];
    (comments ?? []).forEach((c: any) => {
      items.push({ type: 'comment', createdAt: c.createdAt, data: c });
    });
    if (canSeeHistory && history) {
      history.forEach((h: any) => {
        items.push({ type: 'history', createdAt: h.createdAt, data: h });
      });
    }
    items.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    return items;
  }, [comments, history, canSeeHistory]);

  const historyKindLabel = (kind: string) => {
    switch (kind) {
      case 'STATUS_CHANGED': return 'Status alterado';
      case 'PRIORITY_CHANGED': return 'Prioridade alterada';
      case 'DEPARTMENT_ASSIGNED': return 'Departamento atribuído';
      case 'SECTION_ASSIGNED': return 'Seção atribuída';
      case 'AGENT_ASSIGNED': return 'Agente atribuído';
      default: return kind;
    }
  };

  const handleDownload = async (attachmentId: string, filename: string) => {
    try {
      const blob = await api.downloadAttachment(ticketId, attachmentId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const [imagePreviews, setImagePreviews] = useState<Record<string, string>>({});

  const loadImagePreview = async (attachmentId: string) => {
    if (imagePreviews[attachmentId]) return imagePreviews[attachmentId];
    
    try {
      const blob = await api.downloadAttachment(ticketId, attachmentId);
      const url = window.URL.createObjectURL(blob);
      setImagePreviews(prev => ({ ...prev, [attachmentId]: url }));
      return url;
    } catch (error) {
      console.error('Failed to load image preview:', error);
      return null;
    }
  };

  useEffect(() => {
    return () => {
      Object.values(imagePreviews).forEach(url => {
        if (url.startsWith('blob:')) {
          window.URL.revokeObjectURL(url);
        }
      });
      if (selectedImage && selectedImage.startsWith('blob:')) {
        window.URL.revokeObjectURL(selectedImage);
      }
    };
  }, []);

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

  if (isLoading) {
    return <div className="text-center py-8">Carregando ticket...</div>;
  }

  if (!ticket) {
    return <div className="text-center py-8">Ticket não encontrado</div>;
  }

  return (
    <>
      {selectedImage && (
        <Dialog open={!!selectedImage} onOpenChange={() => {
          if (selectedImage.startsWith('blob:')) {
            window.URL.revokeObjectURL(selectedImage);
          }
          setSelectedImage(null);
        }}>
          <DialogContent className="max-w-4xl w-full p-0">
            <div className="relative w-full" style={{ maxHeight: '90vh' }}>
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 z-10 bg-black/50 text-white hover:bg-black/70"
                onClick={() => {
                  if (selectedImage.startsWith('blob:')) {
                    window.URL.revokeObjectURL(selectedImage);
                  }
                  setSelectedImage(null);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
              <img
                src={selectedImage}
                alt="Preview"
                className="w-full h-auto max-h-[90vh] object-contain"
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
      <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/tickets">
          <Button variant="ghost" size="icon" className="shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold break-words">{ticket.subject}</h1>
          <p className="text-gray-600 mt-2 text-sm sm:text-base">Ticket #{ticket.id.slice(0, 8)}</p>
        </div>
      </div>

      <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Descrição</CardTitle>
            </CardHeader>
            <CardContent>
              <DescriptionWithImages 
                description={ticket.description} 
                attachments={attachments || []}
                ticketId={ticketId}
                onImageClick={(url) => setSelectedImage(url)}
                loadImagePreview={loadImagePreview}
              />
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
              {timeline.map((item) =>
                item.type === 'comment' ? (
                  <div
                    key={`c-${item.data.id}`}
                    className={`p-4 border rounded-lg ${
                      item.data.isInternal
                        ? 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950/30 dark:border-yellow-800/50'
                        : ''
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium break-words">{item.data.author.name || item.data.author.email}</span>
                        {item.data.isInternal && (
                          <Badge variant="outline" className="text-xs shrink-0 border-yellow-600/50 dark:border-yellow-500/50 text-yellow-800 dark:text-yellow-400">
                            <Lock className="h-3 w-3 mr-1" />
                            Interno
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-gray-500 dark:text-muted-foreground shrink-0">
                        {new Date(item.data.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{item.data.content}</p>
                  </div>
                ) : (
                  <div
                    key={`h-${item.data.id}`}
                    className="flex items-start gap-3 p-3 rounded-lg border border-border bg-muted/30 dark:bg-muted/20"
                  >
                    <History className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">{historyKindLabel(item.data.kind)}</span>
                        {item.data.oldValue != null || item.data.newValue != null ? (
                          <>: {item.data.kind === 'STATUS_CHANGED' ? formatStatus(item.data.oldValue ?? '') : item.data.kind === 'PRIORITY_CHANGED' ? formatPriority(item.data.oldValue ?? '') : (item.data.oldValue ?? '—')} → {item.data.kind === 'STATUS_CHANGED' ? formatStatus(item.data.newValue ?? '') : item.data.kind === 'PRIORITY_CHANGED' ? formatPriority(item.data.newValue ?? '') : (item.data.newValue ?? '—')}</>
                        ) : null}
                        {' · '}
                        <span className="text-xs">por {item.data.user?.name || item.data.user?.email}</span>
                      </p>
                      <span className="text-xs text-muted-foreground">
                        {new Date(item.data.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                )
              )}

              <Separator />

              <div className="space-y-4">
                <div className="space-y-2">
                  <Textarea
                    id="comment"
                    placeholder="escreva aqui seu comentário..."
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
                      Comentário interno (visível apenas para agentes/administradores)
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
                    {(commentMutation.error as ApiError)?.message || 'Falha ao adicionar comentário'}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6 min-w-0">
          <Card>
            <CardHeader>
              <CardTitle>Detalhes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 min-w-0">
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
                      <SelectItem value="OPEN">Aberto</SelectItem>
                      <SelectItem value="IN_PROGRESS">Em Andamento</SelectItem>
                      <SelectItem value="WAITING_REQUESTER">Aguardando Solicitante</SelectItem>
                      <SelectItem value="WAITING_AGENT">Aguardando Agente</SelectItem>
                      <SelectItem value="ON_HOLD">Em Espera</SelectItem>
                      <SelectItem value="RESOLVED">Resolvido</SelectItem>
                      <SelectItem value="CLOSED">Fechado</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="mt-1">
                    <Badge className={getStatusColor(ticket.status)}>
                      {formatStatus(ticket.status)}
                    </Badge>
                  </div>
                )}
              </div>
              <div>
                <Label className="text-xs text-gray-500">Prioridade</Label>
                {isAgent ? (
                  <Select
                    value={ticket.priority}
                    onValueChange={(value) => updateMutation.mutate({ priority: value })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">Baixa</SelectItem>
                      <SelectItem value="MEDIUM">Média</SelectItem>
                      <SelectItem value="HIGH">Alta</SelectItem>
                      <SelectItem value="URGENT">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="mt-1">
                    <Badge variant="outline">{formatPriority(ticket.priority)}</Badge>
                  </div>
                )}
              </div>
              <div>
                <Label className="text-xs text-gray-500">Solicitante</Label>
                <p className="mt-1 text-sm">
                  {ticket.requester?.name || ticket.requester?.email}
                </p>
              </div>
              {ticket.department && (
                <div>
                  <Label className="text-xs text-gray-500">Departmento</Label>
                  {isAgent ? (
                    <Select
                      value={ticket.department?.id}
                      onValueChange={(value) => {
                        updateMutation.mutate({ 
                          departmentId: value,
                          sectionId: null // Reset section when department changes
                        });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {departments?.map((dept: any) => (
                          <SelectItem key={dept.id} value={dept.id}>
                            {dept.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="mt-1 text-sm">
                      {ticket.department?.name}
                    </p>
                  )}
                </div>
              )}
              {ticket.department && (
                <div>
                  <Label className="text-xs text-gray-500">Seção (Opcional)</Label>
                  {isAgent ? (
                    <Select
                      value={ticket.section?.id || '__none__'}
                      onValueChange={(value) => updateMutation.mutate({ sectionId: value === '__none__' ? null : value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Nenhuma seção" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">Nenhuma</SelectItem>
                        {sections?.map((section: any) => (
                          <SelectItem key={section.id} value={section.id}>
                            {section.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="mt-1 text-sm">
                      {ticket.section?.name || 'No section'}
                    </p>
                  )}
                </div>
              )}
              <div className="min-w-0 max-w-full">
                <Label className="text-xs text-gray-500">Atribuído A</Label>
                {isAgent ? (
                  <>
                    {departmentMembers && departmentMembers.length > 0 ? (
                      <Select
                        value={ticket.assigneeId || 'unassign'}
                        onValueChange={(value) => {
                          updateMutation.mutate({ 
                            assigneeId: value === 'unassign' ? null : value 
                          });
                        }}
                      >
                        <SelectTrigger className="mt-1 min-w-0 max-w-full [&>span]:truncate [&>span]:block [&>span]:text-left">
                          <SelectValue placeholder="Selecione um responsável">
                            {ticket.assigneeId && ticket.assigneeId !== 'unassign'
                              ? (departmentMembers?.find((m: any) => m.id === ticket.assigneeId)?.name ?? ticket.assignee?.name ?? '—')
                              : null}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unassign">Não atribuído</SelectItem>
                          {departmentMembers.map((member: any) => (
                            <SelectItem key={member.id} value={member.id}>
                              <div className="flex flex-col items-start gap-0.5 py-0.5">
                                <span className="font-medium text-muted-foreground text-xs uppercase">{member.role}</span>
                                <span className="font-medium">{member.name || '—'}</span>
                                <span className="text-muted-foreground text-xs truncate max-w-[220px]" title={member.email}>{member.email}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="mt-1 text-sm text-gray-500">
                        Nenhum membro neste departamento. Adicione membros para atribuir tickets.
                      </p>
                    )}
                  </>
                ) : ticket.assignee ? (
                  <div className="mt-1 flex flex-col gap-0.5 text-sm min-w-0">
                    {ticket.assignee.role && (
                      <span className="text-xs font-medium text-muted-foreground uppercase">{ticket.assignee.role}</span>
                    )}
                    <span className="font-medium truncate" title={ticket.assignee.name || ''}>{ticket.assignee.name || '—'}</span>
                    <span className="text-muted-foreground truncate text-xs" title={ticket.assignee.email}>{ticket.assignee.email}</span>
                  </div>
                ) : (
                  <p className="mt-1 text-sm text-gray-500">Não atribuído</p>
                )}
              </div>
              <div>
                <Label className="text-xs text-gray-500">Criado em</Label>
                <p className="mt-1 text-sm">
                  {new Date(ticket.createdAt).toLocaleString()}
                </p>
              </div>
              <div>
                <Label className="text-xs text-gray-500">Atualizado em</Label>
                <p className="mt-1 text-sm">
                  {new Date(ticket.updatedAt).toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Paperclip className="h-5 w-5" />
                Anexos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  id="file-upload"
                  className="hidden"
                  onChange={handleFileSelect}
                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.zip"
                />
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="w-full"
                >
                  <Paperclip className="mr-2 h-4 w-4" />
                  {uploading ? 'Enviando...' : 'Envie um anexo'}
                </Button>
                {uploadMutation.isError && (
                  <div className="text-sm text-red-600">
                    {(uploadMutation.error as ApiError)?.message || 'Falha no envio'}
                  </div>
                )}
              </div>

              {attachments && attachments.length > 0 && (
                <div className="space-y-2">
                  <Separator />
                  <div className="text-xs text-gray-500 bg-blue-50 p-2 rounded border border-blue-200">
                    <strong>Dica:</strong> Para inserir uma imagem na descrição, use <code className="bg-white px-1 rounded">[image:attachment-id]</code> ou <code className="bg-white px-1 rounded">[image:filename]</code>
                  </div>
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {attachments.map((attachment: any) => (
                      <div
                        key={attachment.id}
                        className="border rounded-lg p-2 hover:bg-gray-50 transition-colors flex items-center gap-2"
                      >
                        {attachment.isImage ? (
                          <ImageThumbnailSmall
                            attachment={attachment}
                            ticketId={ticketId}
                            onLoadPreview={loadImagePreview}
                            imagePreviews={imagePreviews}
                          />
                        ) : (
                          <div className="w-12 h-12 flex items-center justify-center bg-gray-100 rounded flex-shrink-0">
                            <Paperclip className="h-6 w-6 text-gray-400" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-900 truncate" title={attachment.filename}>
                            {attachment.filename}
                          </p>
                          <p className="text-xs text-gray-500">{formatFileSize(attachment.size)}</p>
                          {attachment.createdAt && (
                            <p className="text-xs text-gray-400 mt-0.5">
                              Adicionado: {new Date(attachment.createdAt).toLocaleString()}
                            </p>
                          )}
                          {attachment.isImage && (
                            <button
                              className="text-xs text-blue-600 font-mono mt-1 hover:text-blue-800 hover:underline"
                              title="Click to copy image reference"
                              onClick={() => {
                                const ref = `[image:${attachment.id}]`;
                                navigator.clipboard.writeText(ref);
                              }}
                            >
                              ID: {attachment.id.slice(0, 8)}... (clique para copiar)
                            </button>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2"
                            onClick={() => handleDownload(attachment.id, attachment.filename)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          {(isAgent || ticket.requesterId === user?.id) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2 text-red-600 hover:text-red-700"
                              onClick={() => {
                                if (confirm('Tem certeza que deseja excluir este anexo?')) {
                                  deleteAttachmentMutation.mutate(attachment.id);
                                }
                              }}
                              disabled={deleteAttachmentMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
    </>
  );
}

function DescriptionWithImages({
  description,
  attachments,
  ticketId,
  onImageClick,
  loadImagePreview,
}: {
  description: string;
  attachments: any[];
  ticketId: string;
  onImageClick: (url: string) => void;
  loadImagePreview: (id: string) => Promise<string | null>;
}) {
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
  const [loadingImages, setLoadingImages] = useState<Set<string>>(new Set());

  const parts = useMemo(() => {
    if (!description) return [description];
    
    const result: (string | { type: 'image'; id: string; filename?: string })[] = [];
    const imagePattern = /\[image:([^\]]+)\]/g;
    const descriptionCopy = description;
    let lastIndex = 0;
    let match;

    imagePattern.lastIndex = 0;
    
    while ((match = imagePattern.exec(descriptionCopy)) !== null) {
      if (match.index > lastIndex) {
        result.push(descriptionCopy.substring(lastIndex, match.index));
      }
      
      const imageRef = match[1].trim();
      
      let attachment = attachments.find(
        (a) => a.id === imageRef || a.filename === imageRef
      );
      
      if (!attachment && imageRef.length >= 8) {
        attachment = attachments.find(
          (a) => a.id.startsWith(imageRef) || imageRef.startsWith(a.id.substring(0, 8))
        );
      }
      
      if (attachment) {
        if (attachment.isImage) {
          result.push({ type: 'image', id: attachment.id, filename: attachment.filename });
        } else {
          console.warn('Attachment found but not an image:', attachment.id, attachment.filename);
          result.push(match[0]);
        }
      } else {
        console.warn('Image attachment not found for reference:', imageRef, 'Available attachments:', attachments.map(a => ({ id: a.id, filename: a.filename, isImage: a.isImage })));
        result.push(match[0]);
      }
      
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < descriptionCopy.length) {
      result.push(descriptionCopy.substring(lastIndex));
    }

    if (result.length === 0) {
      return [description];
    }

    return result;
  }, [description, attachments]);

  useEffect(() => {
    const imageParts = parts.filter((part): part is { type: 'image'; id: string; filename?: string } => 
      typeof part === 'object' && part.type === 'image'
    );

    imageParts.forEach((part) => {
      // Only load if we don't have the URL and aren't already loading it
      if (!imageUrls[part.id] && !loadingImages.has(part.id)) {
        setLoadingImages((prev) => new Set(prev).add(part.id));
        loadImagePreview(part.id)
          .then((url) => {
            if (url) {
              setImageUrls((prev) => ({ ...prev, [part.id]: url }));
            } else {
              console.warn('Image preview returned null for:', part.id);
            }
          })
          .catch((error) => {
            console.error('Failed to load image:', part.id, error);
          })
          .finally(() => {
            setLoadingImages((prev) => {
              const next = new Set(prev);
              next.delete(part.id);
              return next;
            });
          });
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parts]);

  return (
    <div className="whitespace-pre-wrap">
      {parts.map((part, index) => {
        if (typeof part === 'string') {
          return <span key={index}>{part}</span>;
        } else if (part.type === 'image') {
          const imageUrl = imageUrls[part.id];
          const isLoading = loadingImages.has(part.id);
          
          return (
            <span key={index} className="inline-block my-2 w-full">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={part.filename || 'Image'}
                  className="max-w-full h-auto rounded-lg cursor-pointer border hover:opacity-90 transition-opacity block"
                  style={{ maxHeight: '400px' }}
                  onClick={() => onImageClick(imageUrl)}
                  onError={(e) => {
                    console.error('Image blob URL failed for:', part.id);
                    // Retry loading
                    setImageUrls((prev) => {
                      const next = { ...prev };
                      delete next[part.id];
                      return next;
                    });
                    if (!loadingImages.has(part.id)) {
                      loadImagePreview(part.id).then((url) => {
                        if (url) {
                          setImageUrls((prev) => ({ ...prev, [part.id]: url }));
                        }
                      });
                    }
                  }}
                />
              ) : (
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 rounded text-sm text-gray-600">
                  <ImageIcon className={`h-4 w-4 ${isLoading ? 'animate-pulse' : ''}`} />
                  <span>{isLoading ? 'Carregando imagem...' : 'Imagem não carregada'}</span>
                </div>
              )}
            </span>
          );
        }
        return null;
      })}
    </div>
  );
}

