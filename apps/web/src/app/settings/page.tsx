'use client';

import { useState, useEffect } from 'react';
import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/auth-context';
import { useTenant } from '@/contexts/tenant-context';
import { api, ApiError } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info, Mail, CheckCircle2, AlertCircle, Building2 } from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuth();
  const { tenant, refetch } = useTenant();
  const queryClient = useQueryClient();
  const [showPassword, setShowPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [tenantName, setTenantName] = useState('');
  const [tenantSlug, setTenantSlug] = useState('');
  const [formData, setFormData] = useState({
    smtpHost: '',
    smtpPort: 587,
    smtpSecure: false,
    smtpUser: '',
    smtpPassword: '',
    emailFrom: '',
  });

  const { data: emailSettings, isLoading: isLoadingEmail } = useQuery({
    queryKey: ['emailSettings'],
    queryFn: api.getEmailSettings,
    enabled: user?.role === 'ADMIN',
  });

  useEffect(() => {
    if (tenant) {
      setTenantName(tenant.name || '');
      setTenantSlug(tenant.slug || '');
    }
  }, [tenant]);

  const updateTenantMutation = useMutation({
    mutationFn: () => api.updateTenant({
      name: tenantName !== tenant?.name ? tenantName : undefined,
      slug: tenantSlug !== tenant?.slug ? tenantSlug : undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant'] });
      refetch();
    },
  });

  const updateEmailMutation = useMutation({
    mutationFn: api.updateEmailSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emailSettings'] });
      setSuccessMessage('Email settings updated successfully!');
      setErrorMessage('');
      setTimeout(() => setSuccessMessage(''), 5000);
    },
    onError: (error: any) => {
      setErrorMessage(error.message || 'Failed to update email settings');
      setSuccessMessage('');
    },
  });

  if (user?.role !== 'ADMIN') {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">You don't have permission to view this page.</p>
      </div>
    );
  }

  // Update form data when settings load
  React.useEffect(() => {
    if (emailSettings) {
      setFormData({
        smtpHost: emailSettings.smtpHost || '',
        smtpPort: emailSettings.smtpPort || 587,
        smtpSecure: emailSettings.smtpSecure || false,
        smtpUser: emailSettings.smtpUser || '',
        smtpPassword: '',
        emailFrom: emailSettings.emailFrom || '',
      });
    }
  }, [emailSettings]);

  const handleTenantSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateTenantMutation.mutate();
  };

  const handleEmailSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSuccessMessage('');
    setErrorMessage('');

    const data: any = {};

    if (formData.smtpHost) data.smtpHost = formData.smtpHost;
    if (formData.smtpPort) data.smtpPort = formData.smtpPort;
    data.smtpSecure = formData.smtpSecure;
    if (formData.smtpUser) data.smtpUser = formData.smtpUser;
    if (formData.smtpPassword) data.smtpPassword = formData.smtpPassword;
    if (formData.emailFrom) data.emailFrom = formData.emailFrom;

    updateEmailMutation.mutate(data);
  };

  return (
    <div className="space-y-6 max-w-2xl w-full">
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-4xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground text-base sm:text-lg">Manage your system configuration</p>
      </div>

      {/* Tenant Settings */}
      <Card className="border-border/50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            <CardTitle>Tenant Settings</CardTitle>
          </div>
          <CardDescription>Update your tenant name and slug</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleTenantSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tenant-name">Tenant Name</Label>
              <Input
                id="tenant-name"
                value={tenantName}
                onChange={(e) => setTenantName(e.target.value)}
                required
                placeholder="Enter tenant name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tenant-slug">Slug</Label>
              <Input
                id="tenant-slug"
                value={tenantSlug}
                onChange={(e) => setTenantSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                required
                placeholder="tenant-slug"
                pattern="[a-z0-9-]+"
              />
              <p className="text-xs text-muted-foreground">
                Slug must contain only lowercase letters, numbers, and hyphens
              </p>
            </div>
            {updateTenantMutation.isError && (
              <div className="text-sm text-red-600 bg-red-50 dark:bg-red-950/30 p-3 rounded-md">
                {(updateTenantMutation.error as ApiError)?.message || 'Failed to update tenant'}
              </div>
            )}
            {updateTenantMutation.isSuccess && (
              <div className="text-sm text-green-600 bg-green-50 dark:bg-green-950/30 p-3 rounded-md">
                Tenant updated successfully!
              </div>
            )}
            <div className="flex flex-col sm:flex-row justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setTenantName(tenant?.name || '');
                  setTenantSlug(tenant?.slug || '');
                }}
                disabled={updateTenantMutation.isPending}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updateTenantMutation.isPending} className="w-full sm:w-auto">
                {updateTenantMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
          {tenant && (
            <div className="mt-6 pt-6 border-t space-y-3">
              <div>
                <Label className="text-muted-foreground">Tenant ID</Label>
                <p className="font-mono text-sm">{tenant.id}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Created At</Label>
                <p className="text-sm">{new Date(tenant.createdAt).toLocaleString()}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Email Settings */}
      <Card className="border-border/50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            <CardTitle>E-mail Settings</CardTitle>
          </div>
          <CardDescription>
            Configure SMTP settings for sending password reset emails and notifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingEmail ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : (
            <form id="email-settings-form" onSubmit={handleEmailSubmit} className="space-y-6">
              {/* SMTP Host */}
              <div className="space-y-2">
                <Label htmlFor="smtpHost">SMTP Server (Host)</Label>
                  <Input
                  id="smtpHost"
                  name="smtpHost"
                  type="text"
                  placeholder="smtp.gmail.com"
                  value={formData.smtpHost}
                  onChange={(e) => setFormData({ ...formData, smtpHost: e.target.value })}
                  disabled={updateEmailMutation.isPending}
                />
                <p className="text-sm text-muted-foreground">
                  The SMTP server address for your email provider
                </p>
              </div>

              {/* SMTP Port */}
              <div className="space-y-2">
                <Label htmlFor="smtpPort">SMTP Port</Label>
                  <Input
                  id="smtpPort"
                  name="smtpPort"
                  type="number"
                  placeholder="587"
                  value={formData.smtpPort}
                  onChange={(e) => setFormData({ ...formData, smtpPort: parseInt(e.target.value) || 587 })}
                  min={1}
                  max={65535}
                  disabled={updateEmailMutation.isPending}
                />
                <p className="text-sm text-muted-foreground">
                  Usually 587 for TLS or 465 for SSL
                </p>
              </div>

              {/* SMTP Secure */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="smtpSecure">Use SSL/TLS</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable for port 465 (SSL), disable for port 587 (TLS)
                  </p>
                </div>
                <Switch
                  id="smtpSecure"
                  name="smtpSecure"
                  checked={formData.smtpSecure}
                  onCheckedChange={(checked) => setFormData({ ...formData, smtpSecure: checked })}
                  disabled={updateEmailMutation.isPending}
                />
              </div>

              {/* SMTP User */}
              <div className="space-y-2">
                <Label htmlFor="smtpUser">Email Address (Username)</Label>
                  <Input
                  id="smtpUser"
                  name="smtpUser"
                  type="email"
                  placeholder="your-email@gmail.com"
                  value={formData.smtpUser}
                  onChange={(e) => setFormData({ ...formData, smtpUser: e.target.value })}
                  disabled={updateEmailMutation.isPending}
                />
                <p className="text-sm text-muted-foreground">
                  The email address used to authenticate with the SMTP server
                </p>
              </div>

              {/* SMTP Password */}
              <div className="space-y-2">
                <Label htmlFor="smtpPassword">Password / App Password</Label>
                <div className="flex gap-2">
                  <Input
                    id="smtpPassword"
                    name="smtpPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.smtpPassword}
                    onChange={(e) => setFormData({ ...formData, smtpPassword: e.target.value })}
                    placeholder={emailSettings?.hasPassword ? '•••••••• (leave blank to keep current)' : 'Enter password'}
                    disabled={updateEmailMutation.isPending}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={updateEmailMutation.isPending}
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  For Gmail, use an App Password (not your regular password). 
                  <a 
                    href="https://myaccount.google.com/apppasswords" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline ml-1"
                  >
                    Generate one here
                  </a>
                </p>
              </div>

              {/* Email From */}
              <div className="space-y-2">
                <Label htmlFor="emailFrom">From Email Address</Label>
                  <Input
                  id="emailFrom"
                  name="emailFrom"
                  type="email"
                  placeholder="noreply@yourdomain.com"
                  value={formData.emailFrom}
                  onChange={(e) => setFormData({ ...formData, emailFrom: e.target.value })}
                  disabled={updateEmailMutation.isPending}
                />
                <p className="text-sm text-muted-foreground">
                  The email address that will appear as the sender
                </p>
              </div>

              {/* Info Alert */}
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Note:</strong> If you leave the password field blank, the current password will be kept. 
                  To change the password, enter a new one. For Gmail users, make sure to use an App Password, not your regular account password.
                </AlertDescription>
              </Alert>

              {/* Success/Error Messages */}
              {successMessage && (
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    {successMessage}
                  </AlertDescription>
                </Alert>
              )}

              {errorMessage && (
                <Alert className="bg-red-50 border-red-200">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    {errorMessage}
                  </AlertDescription>
                </Alert>
              )}

              {/* Submit Button */}
              <Button type="submit" disabled={updateEmailMutation.isPending} className="w-full">
                {updateEmailMutation.isPending ? 'Saving...' : 'Save Email Settings'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
