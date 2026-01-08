'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/auth-context';
import { useTenant } from '@/contexts/tenant-context';
import { api, ApiError } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Building2 } from 'lucide-react';

export default function TenantsPage() {
  const { user } = useAuth();
  const { tenant, refetch } = useTenant();
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');

  useEffect(() => {
    if (tenant) {
      setName(tenant.name || '');
      setSlug(tenant.slug || '');
    }
  }, [tenant]);

  const updateMutation = useMutation({
    mutationFn: () => api.updateTenant({
      name: name !== tenant?.name ? name : undefined,
      slug: slug !== tenant?.slug ? slug : undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant'] });
      refetch();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate();
  };

  if (user?.role !== 'ADMIN') {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">You don't have permission to access this page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl w-full">
      <div>
        <h1 className="text-2xl sm:text-4xl font-bold tracking-tight">Tenant Management</h1>
        <p className="text-muted-foreground text-base sm:text-lg mt-2">Manage your tenant information</p>
      </div>

      <Card className="border-border/50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            <CardTitle>Tenant Information</CardTitle>
          </div>
          <CardDescription>Update your tenant name and slug</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Tenant Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Enter tenant name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                required
                placeholder="tenant-slug"
                pattern="[a-z0-9-]+"
              />
              <p className="text-xs text-muted-foreground">
                Slug must contain only lowercase letters, numbers, and hyphens
              </p>
            </div>
            {updateMutation.isError && (
              <div className="text-sm text-red-600 bg-red-50 dark:bg-red-950/30 p-3 rounded-md">
                {(updateMutation.error as ApiError)?.message || 'Failed to update tenant'}
              </div>
            )}
            {updateMutation.isSuccess && (
              <div className="text-sm text-green-600 bg-green-50 dark:bg-green-950/30 p-3 rounded-md">
                Tenant updated successfully!
              </div>
            )}
            <div className="flex flex-col sm:flex-row justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setName(tenant?.name || '');
                  setSlug(tenant?.slug || '');
                }}
                disabled={updateMutation.isPending}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updateMutation.isPending} className="w-full sm:w-auto">
                {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {tenant && (
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Current Tenant Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-muted-foreground">Tenant ID</Label>
              <p className="font-mono text-sm">{tenant.id}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Created At</Label>
              <p className="text-sm">{new Date(tenant.createdAt).toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

