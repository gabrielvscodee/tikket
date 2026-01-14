'use client';

import { useState, useEffect } from 'react';
import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/auth-context';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info, Mail, CheckCircle2, AlertCircle } from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showPassword, setShowPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [formData, setFormData] = useState({
    smtpHost: '',
    smtpPort: 587,
    smtpSecure: false,
    smtpUser: '',
    smtpPassword: '',
    emailFrom: '',
  });

  const { data: emailSettings, isLoading } = useQuery({
    queryKey: ['emailSettings'],
    queryFn: api.getEmailSettings,
    enabled: user?.role === 'ADMIN',
  });

  const updateMutation = useMutation({
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

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
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

    updateMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-2">Manage your system configuration</p>
      </div>

      {/* Email Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            <CardTitle>Email Configuration</CardTitle>
          </div>
          <CardDescription>
            Configure SMTP settings for sending password reset emails and notifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : (
            <form id="email-settings-form" onSubmit={handleSubmit} className="space-y-6">
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
                  disabled={updateMutation.isPending}
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
                  disabled={updateMutation.isPending}
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
                  disabled={updateMutation.isPending}
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
                  disabled={updateMutation.isPending}
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
                    disabled={updateMutation.isPending}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={updateMutation.isPending}
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
                  disabled={updateMutation.isPending}
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
              <Button type="submit" disabled={updateMutation.isPending} className="w-full">
                {updateMutation.isPending ? 'Saving...' : 'Save Email Settings'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
