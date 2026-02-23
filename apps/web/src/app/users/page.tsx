'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Plus, Search, Edit, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';

export default function UsersPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [editRole, setEditRole] = useState<string>('');
  const [editDisabled, setEditDisabled] = useState<boolean>(false);
  const [editDepartmentIds, setEditDepartmentIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const queryClient = useQueryClient();

  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: () => api.getDepartments(),
    enabled: user?.role === 'ADMIN' || user?.role === 'AGENT',
  });

  const { data: usersResponse, isLoading } = useQuery({
    queryKey: ['users', page, searchQuery, departmentFilter, roleFilter],
    queryFn: () =>
      api.getUsers({
        page,
        limit: pageSize,
        search: searchQuery.trim() || undefined,
        departmentId: departmentFilter || undefined,
        role: roleFilter || undefined,
      }),
    enabled: user?.role === 'ADMIN' || user?.role === 'AGENT',
  });

  const isPaginated =
    usersResponse &&
    typeof usersResponse === 'object' &&
    'data' in usersResponse &&
    Array.isArray((usersResponse as { data: any[] }).data);
  const users = isPaginated ? (usersResponse as { data: any[] }).data : (usersResponse as any[] | undefined);
  const total = isPaginated ? (usersResponse as { total: number }).total : users?.length ?? 0;
  const totalPages = isPaginated ? (usersResponse as { totalPages: number }).totalPages : 1;

  useEffect(() => {
    setPage(1);
  }, [searchQuery, departmentFilter, roleFilter]);

  const createMutation = useMutation({
    mutationFn: api.createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsCreateOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user', editingUser?.id] });
      setIsEditOpen(false);
      setEditingUser(null);
    },
  });

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createMutation.mutate({
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      role: formData.get('role') as string || 'USER',
    });
  };

  const handleEdit = (user: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingUser(user);
    setEditRole(user.role);
    setEditDisabled(user.disabled || false);
    setEditDepartmentIds(user.departments?.map((ud: any) => ud.department.id) || []);
    setIsEditOpen(true);
  };

  const handleUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingUser) return;

    updateMutation.mutate({
      id: editingUser.id,
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

  if (user?.role !== 'ADMIN' && user?.role !== 'AGENT') {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Você não tem permissão para visualizar esta página.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-4xl font-bold tracking-tight">Usuários</h1>
          <p className="text-muted-foreground text-base sm:text-lg">Gerencie usuários em seu workspace</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Novo Usuário
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Novo Usuário</DialogTitle>
              <DialogDescription>Adicione um novo usuário ao seu workspace</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input id="name" name="name" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input id="password" name="password" type="password" required minLength={6} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select name="role" defaultValue="USER">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USER">Usuário</SelectItem>
                    {user?.role === 'ADMIN' && (
                      <>
                        <SelectItem value="AGENT">Agente</SelectItem>
                        <SelectItem value="SUPERVISOR">Supervisor</SelectItem>
                        <SelectItem value="ADMIN">Administrador</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
              {createMutation.isError && (
                <div className="text-sm text-red-600">
                  {(createMutation.error as ApiError)?.message || 'Falha ao criar usuário'}
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
                  {createMutation.isPending ? 'Creating...' : 'Create User'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit User Dialog */}
      {user?.role === 'ADMIN' && (
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Usuário</DialogTitle>
              <DialogDescription>Atualize a função, departamentos e status do usuário</DialogDescription>
            </DialogHeader>
            {editingUser && (
              <form onSubmit={handleUpdate} className="space-y-4">
                <div className="space-y-2">
                  <Label>Nome</Label>
                  <Input value={editingUser.name} disabled />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={editingUser.email} disabled />
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
                    {departments?.map((dept: any) => {
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
                    <Label>Account Status</Label>
                    <p className="text-sm text-muted-foreground">
                      {editDisabled ? 'User is inactive and cannot login' : 'User is active and can login'}
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
                    onClick={() => {
                      setIsEditOpen(false);
                      setEditingUser(null);
                    }}
                  >
                    Cancel
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

      <Card>
        <CardHeader>
        </CardHeader>
        <CardContent className="space-y-4">
          {(users?.length > 0 || total > 0) && (
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Buscar por nome ou email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={departmentFilter || 'all'} onValueChange={(value) => setDepartmentFilter(value === 'all' ? '' : value)}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Todos os Departamentos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Departamentos</SelectItem>
                  {departments?.map((dept: any) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={roleFilter || 'all'} onValueChange={(value) => setRoleFilter(value === 'all' ? '' : value)}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Todas as Funções" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Funções</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="SUPERVISOR">Supervisor</SelectItem>
                  <SelectItem value="AGENT">Agente</SelectItem>
                  <SelectItem value="USER">User</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          {isLoading ? (
            <div className="text-center py-8">Carregando usuários...</div>
          ) : (() => {
            const list = users ?? [];

            if (list.length === 0 && total === 0) {
              return (
                <div className="text-center py-8 text-muted-foreground">
                  <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>
                    {searchQuery || departmentFilter || roleFilter
                      ? 'Nenhum usuário encontrado correspondendo à sua busca'
                      : 'Usuários não encontrados'}
                  </p>
                </div>
              );
            }

            return (
              <div className="space-y-4">
                <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-semibold">Nome</TableHead>
                      <TableHead className="font-semibold">E-mail</TableHead>
                      <TableHead className="font-semibold">Função</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                      {user?.role === 'ADMIN' && (
                        <TableHead className="font-semibold">Ações</TableHead>
                      )}
                      <TableHead className="hidden sm:table-cell font-semibold">Criado em</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {list.map((u: any) => (
                      <TableRow 
                        key={u.id}
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => router.push(`/users/${u.id}`)}
                      >
                        <TableCell className="font-medium">{u.name}</TableCell>
                        <TableCell className="break-words">{u.email}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{u.role}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={u.disabled ? "destructive" : "default"}>
                            {u.disabled ? 'Inativo' : 'Ativo'}
                          </Badge>
                        </TableCell>
                        {user?.role === 'ADMIN' && (
                          <TableCell onClick={(e) => handleEdit(u, e)}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEdit(u, e);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        )}
                        <TableCell className="hidden sm:table-cell">
                          {(() => {
                            const date = new Date(u.createdAt);
                            const day = String(date.getDate()).padStart(2, '0');
                            const month = String(date.getMonth() + 1).padStart(2, '0');
                            const year = date.getFullYear();
                            return `${day}/${month}/${year}`;
                          })()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Mostrando {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} de {total} usuários
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
            );
          })()}
        </CardContent>
      </Card>
    </div>
  );
}

