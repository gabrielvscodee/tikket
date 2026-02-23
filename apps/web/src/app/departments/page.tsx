'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
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
import { Plus, Building, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { getDataFromResponse, isPaginatedResponse, type Department, type PaginatedResponse } from '@/types';

export default function DepartmentsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const { data: departmentsResponse, isLoading } = useQuery({
    queryKey: ['departments', page, searchQuery],
    queryFn: () =>
      api.getDepartments({
        page,
        limit: pageSize,
        search: searchQuery.trim() || undefined,
      }),
    enabled: user?.role === 'ADMIN' || user?.role === 'SUPERVISOR',
  });

  const isPaginated = departmentsResponse ? isPaginatedResponse(departmentsResponse) : false;
  const departments = getDataFromResponse<Department>(departmentsResponse);
  const total = isPaginated && departmentsResponse ? (departmentsResponse as PaginatedResponse<Department>).total : departments.length;
  const totalPages = isPaginated && departmentsResponse ? (departmentsResponse as PaginatedResponse<Department>).totalPages : 1;

  useEffect(() => {
    setPage(1);
  }, [searchQuery]);

  const createMutation = useMutation({
    mutationFn: api.createDepartment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      setIsCreateOpen(false);
    },
  });

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createMutation.mutate({
      name: formData.get('name') as string,
      description: (formData.get('description') as string) || undefined,
    });
  };

  if (user?.role !== 'ADMIN' && user?.role !== 'SUPERVISOR') {
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
          <h1 className="text-2xl sm:text-4xl font-bold tracking-tight">Departamentos</h1>
          <p className="text-muted-foreground text-base sm:text-lg">
            Gerencie departamentos e atribua agentes
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Novo Departamento
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Novo Departamento</DialogTitle>
              <DialogDescription>
                Adicione um novo departamento para organizar tickets
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input id="name" name="name" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea id="description" name="description" rows={3} />
              </div>
              {createMutation.isError && (
                <div className="text-sm text-red-600">
                  {(createMutation.error as ApiError)?.message || 'Falha ao criar departamento'}
                </div>
              )}
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Criando...' : 'Criar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Buscar por nome ou descrição..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Carregando departamentos...</div>
          ) : !departments?.length && total === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Building className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="font-medium">Nenhum departamento encontrado</p>
              <p className="text-sm mt-1">
                {searchQuery
                  ? 'Tente outro termo de busca.'
                  : 'Crie seu primeiro departamento para organizar tickets e equipes.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-semibold">Nome</TableHead>
                      <TableHead className="font-semibold">Descrição</TableHead>
                      <TableHead className="font-semibold">Membros</TableHead>
                      <TableHead className="font-semibold">Tickets</TableHead>
                      <TableHead className="hidden sm:table-cell font-semibold w-0" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {departments.map((dept) => (
                      <TableRow
                        key={dept.id}
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => router.push(`/departments/${dept.id}`)}
                      >
                        <TableCell className="font-medium">{dept.name}</TableCell>
                        <TableCell className="text-muted-foreground max-w-[200px] truncate">
                          {dept.description || '—'}
                        </TableCell>
                        <TableCell>{dept.members?.length ?? 0}</TableCell>
                        <TableCell>{dept._count?.tickets ?? 0}</TableCell>
                        <TableCell className="hidden sm:table-cell text-muted-foreground text-xs">
                          Clique para configurar
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Mostrando {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} de{' '}
                    {total} departamentos
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
