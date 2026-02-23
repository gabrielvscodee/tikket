'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  ArrowLeft,
  Pencil,
  UserPlus,
  UserMinus,
  Plus,
  Trash2,
  FolderTree,
  Search,
  Users,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import Link from 'next/link';
import { getDataFromResponse, isPaginatedResponse, type User, type Department, type Section, type PaginatedResponse } from '@/types';

const PAGE_SIZE = 20;

export default function DepartmentConfigPage() {
  const params = useParams();
  const id = params?.id as string;
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [addUserSearchQuery, setAddUserSearchQuery] = useState('');
  const [membersPage, setMembersPage] = useState(1);
  const [isCreateSectionOpen, setIsCreateSectionOpen] = useState(false);
  const [sectionsPage, setSectionsPage] = useState(1);
  const [isAddUserToSectionOpen, setIsAddUserToSectionOpen] = useState(false);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [selectedUserIdsForSection, setSelectedUserIdsForSection] = useState<string[]>([]);

  const { data: department, isLoading: deptLoading } = useQuery({
    queryKey: ['department', id],
    queryFn: () => api.getDepartment(id),
    enabled: !!id && (user?.role === 'ADMIN' || user?.role === 'SUPERVISOR'),
  });

  const { data: membersResponse, isLoading: membersLoading } = useQuery({
    queryKey: ['department-members', id, membersPage],
    queryFn: () => api.getDepartmentMembers(id, { page: membersPage, limit: PAGE_SIZE }),
    enabled: !!id && (user?.role === 'ADMIN' || user?.role === 'SUPERVISOR'),
  });
  const membersPaginated = membersResponse ? isPaginatedResponse(membersResponse) : false;
  const members = getDataFromResponse<User>(membersResponse);
  const membersTotal = membersPaginated && membersResponse ? (membersResponse as PaginatedResponse<User>).total : members.length;
  const membersTotalPages = membersPaginated && membersResponse ? (membersResponse as PaginatedResponse<User>).totalPages : 1;

  const { data: sectionsResponse, isLoading: sectionsLoading } = useQuery({
    queryKey: ['sections', id, sectionsPage],
    queryFn: () => api.getSections(id, { page: sectionsPage, limit: PAGE_SIZE }),
    enabled: !!id && (user?.role === 'ADMIN' || user?.role === 'SUPERVISOR'),
  });
  const sectionsPaginated = sectionsResponse ? isPaginatedResponse(sectionsResponse) : false;
  const sections = getDataFromResponse<Section>(sectionsResponse);
  const sectionsTotal = sectionsPaginated && sectionsResponse ? (sectionsResponse as PaginatedResponse<Section>).total : sections.length;
  const sectionsTotalPages = sectionsPaginated && sectionsResponse ? (sectionsResponse as PaginatedResponse<Section>).totalPages : 1;

  const { data: usersResponse } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.getUsers(),
    enabled: (user?.role === 'ADMIN' || user?.role === 'SUPERVISOR') && (isAddUserOpen || isAddUserToSectionOpen),
  });

  const users = getDataFromResponse<User>(usersResponse);

  useEffect(() => {
    if (department) {
      setEditName(department.name);
      setEditDescription(department.description || '');
    }
  }, [department]);

  const updateMutation = useMutation({
    mutationFn: ({ data }: { data: { name: string; description?: string | null } }) =>
      api.updateDepartment(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['department', id] });
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      setIsEditOpen(false);
    },
  });

  const addUserMutation = useMutation({
    mutationFn: async (userIds: string[]) => {
      for (const userId of userIds) {
        await api.addUserToDepartment(id, userId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['department-members', id] });
      queryClient.invalidateQueries({ queryKey: ['department', id] });
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      setIsAddUserOpen(false);
      setSelectedUserIds([]);
      setAddUserSearchQuery('');
    },
  });

  const removeUserMutation = useMutation({
    mutationFn: (userId: string) => api.removeUserFromDepartment(id, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['department-members', id] });
      queryClient.invalidateQueries({ queryKey: ['department', id] });
      queryClient.invalidateQueries({ queryKey: ['departments'] });
    },
  });

  const createSectionMutation = useMutation({
    mutationFn: api.createSection,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sections', id] });
      setIsCreateSectionOpen(false);
    },
  });

  const deleteSectionMutation = useMutation({
    mutationFn: api.deleteSection,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sections', id] });
    },
  });

  const addUserToSectionMutation = useMutation({
    mutationFn: async ({ sectionId, userIds }: { sectionId: string; userIds: string[] }) => {
      for (const userId of userIds) {
        await api.addUserToSection(sectionId, userId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sections', id] });
      setIsAddUserToSectionOpen(false);
      setSelectedSection(null);
      setSelectedUserIdsForSection([]);
    },
  });

  const removeUserFromSectionMutation = useMutation({
    mutationFn: ({ sectionId, userId }: { sectionId: string; userId: string }) =>
      api.removeUserFromSection(sectionId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sections', id] });
    },
  });

  const handleEdit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    updateMutation.mutate({
      data: {
        name: editName,
        description: editDescription || null,
      },
    });
  };

  const handleAddUser = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (selectedUserIds.length === 0) return;
    addUserMutation.mutate(selectedUserIds);
  };

  const handleUserToggle = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const departmentMembers = (department?.members?.map((m: { user: User }) => m.user) ?? []) as User[];
  const usersAvailableForDepartment = users.filter(
    (u) =>
      u.role !== 'REQUESTER' &&
      !departmentMembers.some((m) => m.id === u.id)
  );
  const filteredUsersForAdd = addUserSearchQuery
    ? usersAvailableForDepartment.filter(
        (u) =>
          (u.name || '').toLowerCase().includes(addUserSearchQuery.toLowerCase()) ||
          (u.email || '').toLowerCase().includes(addUserSearchQuery.toLowerCase())
      )
    : usersAvailableForDepartment;

  if (user?.role !== 'ADMIN' && user?.role !== 'SUPERVISOR') {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Você não tem permissão para visualizar esta página.</p>
      </div>
    );
  }

  if (deptLoading || !department) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground">Carregando departamento...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <Link
          href="/departments"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Voltar aos departamentos
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-4xl font-bold tracking-tight">{department.name}</h1>
            {department.description && (
              <p className="text-muted-foreground mt-1">{department.description}</p>
            )}
          </div>
        </div>
      </div>

      {/* General info / Edit */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Informações</CardTitle>
              <CardDescription>Nome e descrição do departamento</CardDescription>
            </div>
            {user?.role === 'ADMIN' && (
              <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Pencil className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Editar Departamento</DialogTitle>
                    <DialogDescription>Atualize as informações do departamento</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleEdit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-name">Nome</Label>
                      <Input
                        id="edit-name"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-description">Descrição</Label>
                      <Textarea
                        id="edit-description"
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        rows={3}
                      />
                    </div>
                    {updateMutation.isError && (
                      <div className="text-sm text-red-600">
                        {(updateMutation.error as ApiError)?.message || 'Falha ao atualizar'}
                      </div>
                    )}
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                        Cancelar
                      </Button>
                      <Button type="submit" disabled={updateMutation.isPending}>
                        {updateMutation.isPending ? 'Salvando...' : 'Salvar'}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Members */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Membros da Equipe
              </CardTitle>
              <CardDescription>Agentes e supervisores atribuídos a este departamento</CardDescription>
            </div>
            <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Adicionar usuários
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
                <DialogHeader>
                  <DialogTitle>Adicionar Usuários ao Departamento</DialogTitle>
                  <DialogDescription>Selecione usuários para adicionar a {department.name}</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddUser} className="flex flex-col flex-1 min-h-0">
                  <div className="mb-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="text"
                        placeholder="Buscar por nome ou email..."
                        value={addUserSearchQuery}
                        onChange={(e) => setAddUserSearchQuery(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                  </div>
                  <div className="space-y-2 flex-1 overflow-y-auto min-h-0 pr-2">
                    {filteredUsersForAdd.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>
                          {addUserSearchQuery
                            ? 'Nenhum usuário encontrado'
                            : 'Todos os usuários disponíveis já estão neste departamento'}
                        </p>
                      </div>
                    ) : (
                      filteredUsersForAdd.map((u) => (
                        <label
                          key={u.id}
                          className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedUserIds.includes(u.id)}
                            onChange={() => handleUserToggle(u.id)}
                            className="h-4 w-4 rounded border-border"
                          />
                          <Avatar className="h-9 w-9 shrink-0">
                            <AvatarFallback className="bg-primary/10 text-primary text-xs">
                              {(u.name || 'U').charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{u.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {u.role}
                          </Badge>
                        </label>
                      ))
                    )}
                  </div>
                  <div className="flex items-center justify-between pt-4 mt-4 border-t">
                    <p className="text-sm text-muted-foreground">
                      {selectedUserIds.length} selecionado(s)
                    </p>
                    <div className="flex gap-2">
                      <Button type="button" variant="outline" onClick={() => setIsAddUserOpen(false)}>
                        Cancelar
                      </Button>
                      <Button
                        type="submit"
                        disabled={addUserMutation.isPending || selectedUserIds.length === 0}
                      >
                        {addUserMutation.isPending ? 'Adicionando...' : 'Adicionar'}
                      </Button>
                    </div>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {membersLoading ? (
            <div className="text-center py-6">Carregando membros...</div>
          ) : members.length === 0 && membersTotal === 0 ? (
            <div className="text-center py-8 rounded-lg border border-dashed bg-muted/20">
              <Users className="h-10 w-10 mx-auto text-muted-foreground/50 mb-2" />
              <p className="text-sm font-medium text-muted-foreground">Nenhum membro atribuído</p>
              <p className="text-xs text-muted-foreground mt-1">Adicione usuários a este departamento</p>
            </div>
          ) : (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-semibold">Nome</TableHead>
                    <TableHead className="font-semibold">E-mail</TableHead>
                    <TableHead className="font-semibold">Função</TableHead>
                    <TableHead className="w-0" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">{member.name}</TableCell>
                      <TableCell className="text-muted-foreground">{member.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{member.role}</Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => {
                            if (confirm(`Remover ${member.name} deste departamento?`)) {
                              removeUserMutation.mutate(member.id);
                            }
                          }}
                          disabled={removeUserMutation.isPending}
                        >
                          <UserMinus className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {membersTotalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Mostrando {(membersPage - 1) * PAGE_SIZE + 1}–
                    {Math.min(membersPage * PAGE_SIZE, membersTotal)} de {membersTotal} membros
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setMembersPage((p) => Math.max(1, p - 1))}
                      disabled={membersPage <= 1}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Anterior
                    </Button>
                    <span className="text-sm text-muted-foreground px-2">
                      Página {membersPage} de {membersTotalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setMembersPage((p) => Math.min(membersTotalPages, p + 1))}
                      disabled={membersPage >= membersTotalPages}
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

      {/* Sections */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FolderTree className="h-5 w-5" />
                Seções
              </CardTitle>
              <CardDescription>Subdivisões do departamento</CardDescription>
            </div>
            <Dialog open={isCreateSectionOpen} onOpenChange={setIsCreateSectionOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Seção
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nova Seção</DialogTitle>
                  <DialogDescription>Adicione uma subdivisão a {department.name}</DialogDescription>
                </DialogHeader>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    createSectionMutation.mutate({
                      name: formData.get('name') as string,
                      description: (formData.get('description') as string) || undefined,
                      departmentId: id,
                    });
                  }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="section-name">Nome</Label>
                    <Input id="section-name" name="name" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="section-description">Descrição</Label>
                    <Textarea id="section-description" name="description" rows={3} />
                  </div>
                  {createSectionMutation.isError && (
                    <div className="text-sm text-red-600">
                      {(createSectionMutation.error as ApiError)?.message || 'Falha ao criar seção'}
                    </div>
                  )}
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsCreateSectionOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={createSectionMutation.isPending}>
                      {createSectionMutation.isPending ? 'Criando...' : 'Criar'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {sectionsLoading ? (
            <div className="text-center py-6">Carregando seções...</div>
          ) : sections.length === 0 && sectionsTotal === 0 ? (
            <div className="text-center py-8 rounded-lg border border-dashed bg-muted/20">
              <FolderTree className="h-10 w-10 mx-auto text-muted-foreground/50 mb-2" />
              <p className="text-sm font-medium text-muted-foreground">Nenhuma seção</p>
              <p className="text-xs text-muted-foreground mt-1">Crie uma seção para organizar o departamento</p>
            </div>
          ) : (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-semibold">Nome</TableHead>
                    <TableHead className="font-semibold">Descrição</TableHead>
                    <TableHead className="font-semibold">Membros</TableHead>
                    <TableHead className="w-0" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sections.map((section) => (
                    <TableRow key={section.id}>
                      <TableCell className="font-medium">{section.name}</TableCell>
                      <TableCell className="text-muted-foreground max-w-[200px] truncate">
                        {section.description || '—'}
                      </TableCell>
                      <TableCell>{section._count?.members ?? section.members?.length ?? 0}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Dialog
                            open={isAddUserToSectionOpen && selectedSection === section.id}
                            onOpenChange={(open) => {
                              setIsAddUserToSectionOpen(open);
                              if (!open) {
                                setSelectedSection(null);
                                setSelectedUserIdsForSection([]);
                              }
                            }}
                          >
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedSection(section.id);
                                  setIsAddUserToSectionOpen(true);
                                  setSelectedUserIdsForSection([]);
                                }}
                              >
                                <UserPlus className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
                              <DialogHeader>
                                <DialogTitle>Adicionar usuários à seção</DialogTitle>
                                <DialogDescription>
                                  Selecione usuários do departamento para adicionar a {section.name}
                                </DialogDescription>
                              </DialogHeader>
                              <form
                                onSubmit={(e) => {
                                  e.preventDefault();
                                  if (selectedSection && selectedUserIdsForSection.length > 0) {
                                    addUserToSectionMutation.mutate({
                                      sectionId: selectedSection,
                                      userIds: selectedUserIdsForSection,
                                    });
                                  }
                                }}
                                className="flex flex-col flex-1 min-h-0"
                              >
                                <div className="space-y-2 flex-1 overflow-y-auto min-h-0 pr-2">
                                  {users
                                    .filter(
                                      (u) =>
                                        u.role !== 'REQUESTER' &&
                                        departmentMembers.some((m) => m.id === u.id) &&
                                        !section.members?.some((m: { user: User }) => m.user?.id === u.id)
                                    )
                                    .map((u) => (
                                      <label
                                        key={u.id}
                                        className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 cursor-pointer"
                                      >
                                        <input
                                          type="checkbox"
                                          checked={selectedUserIdsForSection.includes(u.id)}
                                          onChange={() =>
                                            setSelectedUserIdsForSection((prev) =>
                                              prev.includes(u.id)
                                                ? prev.filter((id) => id !== u.id)
                                                : [...prev, u.id]
                                            )
                                          }
                                          className="h-4 w-4 rounded border-border"
                                        />
                                        <span className="text-sm font-medium">{u.name}</span>
                                        <span className="text-xs text-muted-foreground">{u.email}</span>
                                      </label>
                                    ))}
                                  {(!users?.length ||
                                    !users.some(
                                      (u: any) =>
                                        u.role !== 'REQUESTER' &&
                                        departmentMembers.some((m) => m.id === u.id) &&
                                        !section.members?.some((m: { user: User }) => m.user?.id === u.id)
                                    )) && (
                                    <div className="text-center py-6 text-muted-foreground text-sm">
                                      Todos os membros do departamento já estão nesta seção ou não há membros.
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center justify-between pt-4 mt-4 border-t">
                                  <p className="text-sm text-muted-foreground">
                                    {selectedUserIdsForSection.length} selecionado(s)
                                  </p>
                                  <div className="flex gap-2">
                                    <Button
                                      type="button"
                                      variant="outline"
                                      onClick={() => {
                                        setIsAddUserToSectionOpen(false);
                                        setSelectedSection(null);
                                        setSelectedUserIdsForSection([]);
                                      }}
                                    >
                                      Cancelar
                                    </Button>
                                    <Button
                                      type="submit"
                                      disabled={
                                        addUserToSectionMutation.isPending ||
                                        selectedUserIdsForSection.length === 0
                                      }
                                    >
                                      {addUserToSectionMutation.isPending ? 'Adicionando...' : 'Adicionar'}
                                    </Button>
                                  </div>
                                </div>
                              </form>
                            </DialogContent>
                          </Dialog>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => {
                              if (confirm(`Excluir a seção ${section.name}?`)) {
                                deleteSectionMutation.mutate(section.id);
                              }
                            }}
                            disabled={deleteSectionMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {sectionsTotalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Mostrando {(sectionsPage - 1) * PAGE_SIZE + 1}–
                    {Math.min(sectionsPage * PAGE_SIZE, sectionsTotal)} de {sectionsTotal} seções
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSectionsPage((p) => Math.max(1, p - 1))}
                      disabled={sectionsPage <= 1}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Anterior
                    </Button>
                    <span className="text-sm text-muted-foreground px-2">
                      Página {sectionsPage} de {sectionsTotalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSectionsPage((p) => Math.min(sectionsTotalPages, p + 1))}
                      disabled={sectionsPage >= sectionsTotalPages}
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
