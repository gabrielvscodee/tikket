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
import { Plus, Trash2, UserPlus, UserMinus, Building, Users, Ticket, Pencil, Search } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { CardDescription } from '@/components/ui/card';

export default function DepartmentsPage() {
  const { user } = useAuth();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedDept, setSelectedDept] = useState<string | null>(null);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<any | null>(null);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [searchQueries, setSearchQueries] = useState<Record<string, string>>({});
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
    mutationFn: async ({ id, userIds }: { id: string; userIds: string[] }) => {
      // Add users one by one
      const promises = userIds.map(userId => api.addUserToDepartment(id, userId));
      await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      setIsAddUserOpen(false);
      setSelectedDept(null);
      setSelectedUserIds([]);
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

  const handleEdit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingDept) return;
    const formData = new FormData(e.currentTarget);
    updateMutation.mutate({
      id: editingDept.id,
      data: {
        name: formData.get('name') as string,
        description: formData.get('description') as string || null,
      },
    });
    setIsEditOpen(false);
    setEditingDept(null);
  };

  const handleEditOpen = (dept: any) => {
    setEditingDept(dept);
    setIsEditOpen(true);
  };

  const handleEditClose = () => {
    setIsEditOpen(false);
    setEditingDept(null);
  };

  const handleAddUser = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedDept || selectedUserIds.length === 0) return;
    addUserMutation.mutate({
      id: selectedDept,
      userIds: selectedUserIds,
    });
  };

  const handleUserToggle = (userId: string) => {
    setSelectedUserIds(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleDialogOpenChange = (open: boolean) => {
    setIsAddUserOpen(open);
    if (!open) {
      setSelectedDept(null);
      setSelectedUserIds([]);
    }
  };

  if (user?.role !== 'ADMIN') {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">You don't have permission to view this page.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading departments...</p>
        </div>
      </div>
    );
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

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        {departments?.map((dept: any) => (
          <Card key={dept.id} className="border-border hover:border-border transition-all hover:shadow-md">
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 dark:bg-primary/20 flex items-center justify-center shrink-0 self-start">
                    <Building className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg mb-1">{dept.name}</CardTitle>
                    {dept.description && (
                      <CardDescription className="line-clamp-2">{dept.description}</CardDescription>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Dialog
                    open={isAddUserOpen && selectedDept === dept.id}
                    onOpenChange={handleDialogOpenChange}
                  >
                    <DialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          setSelectedDept(dept.id);
                          setIsAddUserOpen(true);
                          setSelectedUserIds([]);
                        }}
                      >
                        <UserPlus className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
                      <DialogHeader>
                        <DialogTitle>Add Users to Department</DialogTitle>
                        <DialogDescription>
                          Select users to add to {dept.name}
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleAddUser} className="flex flex-col flex-1 min-h-0">
                        <div className="space-y-2 flex-1 overflow-y-auto min-h-0 pr-2">
                          {users?.filter(
                            (u: any) =>
                              !dept.members?.some((m: any) => m.user.id === u.id)
                          ).length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                              <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                              <p>All available users are already in this department</p>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {users
                                ?.filter(
                                  (u: any) =>
                                    !dept.members?.some((m: any) => m.user.id === u.id)
                                )
                                .map((u: any) => (
                                  <label
                                    key={u.id}
                                    htmlFor={`user-${u.id}`}
                                    className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 cursor-pointer transition-colors group"
                                  >
                                    <div className="relative flex items-center">
                                      <input
                                        type="checkbox"
                                        id={`user-${u.id}`}
                                        checked={selectedUserIds.includes(u.id)}
                                        onChange={() => handleUserToggle(u.id)}
                                        className="h-4 w-4 rounded border-border text-primary focus:ring-primary focus:ring-2 focus:ring-offset-0 cursor-pointer"
                                      />
                                    </div>
                                    <Avatar className="h-9 w-9 shrink-0">
                                      <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                                        {u.name?.charAt(0).toUpperCase() || 'U'}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium truncate">{u.name}</p>
                                      <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                                    </div>
                                    <Badge variant="outline" className="shrink-0 text-xs">
                                      {u.role}
                                    </Badge>
                                  </label>
                                ))}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center justify-between pt-4 mt-4 border-t">
                          <p className="text-sm text-muted-foreground">
                            {selectedUserIds.length} user{selectedUserIds.length !== 1 ? 's' : ''} selected
                          </p>
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => handleDialogOpenChange(false)}
                            >
                              Cancel
                            </Button>
                            <Button
                              type="submit"
                              disabled={addUserMutation.isPending || selectedUserIds.length === 0}
                            >
                              {addUserMutation.isPending
                                ? 'Adding...'
                                : `Add ${selectedUserIds.length > 0 ? `(${selectedUserIds.length})` : ''}`}
                            </Button>
                          </div>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleEditOpen(dept)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => {
                      if (confirm(`Are you sure you want to delete ${dept.name}?`)) {
                        deleteMutation.mutate(dept.id);
                      }
                    }}
                    disabled={deleteMutation.isPending || (dept._count?.tickets || 0) > 0}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Members List */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-foreground">Team Members</h3>
                  <Badge variant="secondary" className="font-normal">
                    {dept.members?.length || 0}
                  </Badge>
                </div>
                {dept.members && dept.members.length > 0 && (
                  <div className="mb-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="text"
                        placeholder="Search by name or email..."
                        value={searchQueries[dept.id] || ''}
                        onChange={(e) => {
                          setSearchQueries(prev => ({
                            ...prev,
                            [dept.id]: e.target.value
                          }));
                        }}
                        className="pl-9"
                      />
                    </div>
                  </div>
                )}
                {(() => {
                  const filteredMembers = dept.members?.filter((member: any) => {
                    const query = (searchQueries[dept.id] || '').toLowerCase();
                    if (!query) return true;
                    const name = (member.user.name || '').toLowerCase();
                    const email = (member.user.email || '').toLowerCase();
                    return name.includes(query) || email.includes(query);
                  }) || [];

                  if (dept.members && dept.members.length > 0) {
                    if (filteredMembers.length === 0) {
                      return (
                        <div className="flex flex-col items-center justify-center py-8 rounded-lg border border-dashed border-border bg-muted/20">
                          <Search className="h-8 w-8 text-muted-foreground/50 mb-2" />
                          <p className="text-sm text-muted-foreground font-medium">No members found matching your search</p>
                        </div>
                      );
                    }
                    return (
                      <div className="space-y-2">
                        {filteredMembers.map((member: any) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <Avatar className="h-9 w-9 shrink-0">
                            <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                              {member.user.name?.charAt(0).toUpperCase() || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{member.user.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{member.user.email}</p>
                          </div>
                          <Badge variant="outline" className="shrink-0 text-xs mr-3">
                            {member.user.role}
                          </Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
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
                      </div>
                    ))}
                      </div>
                    );
                  }
                  return (
                    <div className="flex flex-col items-center justify-center py-8 rounded-lg border border-dashed border-border bg-muted/20">
                      <Users className="h-8 w-8 text-muted-foreground/50 mb-2" />
                      <p className="text-sm text-muted-foreground font-medium">No members assigned</p>
                      <p className="text-xs text-muted-foreground mt-1">Add users to this department</p>
                    </div>
                  );
                })()}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Department Dialog */}
      <Dialog open={isEditOpen} onOpenChange={handleEditClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Department</DialogTitle>
            <DialogDescription>Update department information</DialogDescription>
          </DialogHeader>
          {editingDept && (
            <form onSubmit={handleEdit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Name</Label>
                <Input
                  id="edit-name"
                  name="name"
                  defaultValue={editingDept.name}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  name="description"
                  rows={3}
                  defaultValue={editingDept.description || ''}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleEditClose}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {(!departments || departments.length === 0) && (
        <Card className="border-border">
          <CardContent className="py-16 text-center">
            <div className="flex flex-col items-center justify-center max-w-md mx-auto">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Building className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No departments yet</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Create your first department to start organizing tickets and assigning team members.
              </p>
              <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Department
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
          </CardContent>
        </Card>
      )}
    </div>
  );
}
