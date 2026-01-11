'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2, UserPlus, UserMinus } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Badge } from '@/components/ui/badge';

export default function DepartmentsPage() {
  const { user } = useAuth();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedDept, setSelectedDept] = useState<string | null>(null);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: departments, isLoading } = useQuery({
    queryKey: ['departments'],
    queryFn: api.getDepartments,
    enabled: user?.role === 'ADMIN',
  });

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: api.getUsers,
    enabled: (user?.role === 'ADMIN' || user?.role === 'AGENT') && isAddUserOpen,
  });

  const createMutation = useMutation({
    mutationFn: api.createDepartment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      setIsCreateOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.updateDepartment(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: api.deleteDepartment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
    },
  });

  const addUserMutation = useMutation({
    mutationFn: ({ id, userId }: { id: string; userId: string }) =>
      api.addUserToDepartment(id, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      setIsAddUserOpen(false);
      setSelectedDept(null);
    },
  });

  const removeUserMutation = useMutation({
    mutationFn: ({ id, userId }: { id: string; userId: string }) =>
      api.removeUserFromDepartment(id, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
    },
  });

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createMutation.mutate({
      name: formData.get('name') as string,
      description: formData.get('description') as string || undefined,
    });
  };

  const handleAddUser = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedDept) return;
    const formData = new FormData(e.currentTarget);
    addUserMutation.mutate({
      id: selectedDept,
      userId: formData.get('userId') as string,
    });
  };

  if (user?.role !== 'ADMIN') {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">You don't have permission to view this page.</p>
      </div>
    );
  }

  if (isLoading) {
    return <div className="text-center py-8">Loading departments...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-4xl font-bold tracking-tight">Departments</h1>
          <p className="text-muted-foreground text-base sm:text-lg">Manage departments and assign agents</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              New Department
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Department</DialogTitle>
              <DialogDescription>Add a new department to organize tickets</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" rows={3} />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Creating...' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6">
        {departments?.map((dept: any) => (
          <Card key={dept.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>{dept.name}</CardTitle>
                  {dept.description && (
                    <p className="text-sm text-gray-600 mt-1">{dept.description}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Dialog
                    open={isAddUserOpen && selectedDept === dept.id}
                    onOpenChange={(open) => {
                      setIsAddUserOpen(open);
                      if (!open) setSelectedDept(null);
                    }}
                  >
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedDept(dept.id);
                          setIsAddUserOpen(true);
                        }}
                      >
                        <UserPlus className="mr-2 h-4 w-4" />
                        Add User
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add User to Department</DialogTitle>
                        <DialogDescription>
                          Select a user to add to {dept.name}
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleAddUser} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="userId">User</Label>
                          <Select name="userId" required>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a user" />
                            </SelectTrigger>
                            <SelectContent>
                              {users
                                ?.filter(
                                  (u: any) =>
                                    !dept.members?.some((m: any) => m.user.id === u.id)
                                )
                                .map((u: any) => (
                                  <SelectItem key={u.id} value={u.id}>
                                    {u.name} ({u.email}) - {u.role}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setIsAddUserOpen(false);
                              setSelectedDept(null);
                            }}
                          >
                            Cancel
                          </Button>
                          <Button type="submit" disabled={addUserMutation.isPending}>
                            {addUserMutation.isPending ? 'Adding...' : 'Add'}
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      if (confirm(`Are you sure you want to delete ${dept.name}?`)) {
                        deleteMutation.mutate(dept.id);
                      }
                    }}
                    disabled={deleteMutation.isPending || (dept._count?.tickets || 0) > 0}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Members ({dept.members?.length || 0})</h3>
                  {dept.members && dept.members.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {dept.members.map((member: any) => (
                          <TableRow key={member.id}>
                            <TableCell>{member.user.name}</TableCell>
                            <TableCell>{member.user.email}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{member.user.role}</Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  if (
                                    confirm(
                                      `Remove ${member.user.name} from ${dept.name}?`
                                    )
                                  ) {
                                    removeUserMutation.mutate({
                                      id: dept.id,
                                      userId: member.user.id,
                                    });
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
                  ) : (
                    <p className="text-sm text-gray-500">No members assigned</p>
                  )}
                </div>
                <div className="text-sm text-gray-500">
                  Tickets: {dept._count?.tickets || 0}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {(!departments || departments.length === 0) && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-gray-600">No departments created yet.</p>
            <p className="text-sm text-gray-500 mt-2">
              Create your first department to start organizing tickets.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
