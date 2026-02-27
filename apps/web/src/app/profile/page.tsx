'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/auth-context';
import { api, ApiError } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: () => api.getProfile(),
  });

  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setEmail(profile.email || '');
    }
  }, [profile]);

  const updateMutation = useMutation({
    mutationFn: () => api.updateProfile({
      name: name !== profile?.name ? name : undefined,
      email: email !== profile?.email ? email : undefined,
      password: password ? password : undefined,
      currentPassword: password ? currentPassword : undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      setPassword('');
      setCurrentPassword('');
      if (email !== profile?.email) {
        logout();
        router.push('/login');
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password && !currentPassword) {
      alert('Por favor, digite sua senha atual para alterar sua senha');
      return;
    }
    updateMutation.mutate();
  };

  const hasChanges = 
    name !== profile?.name || 
    email !== profile?.email || 
    password.length > 0;

  if (isLoading) {
    return <div className="text-center py-8">Carregando perfil...</div>;
  }

  return (
    <div className="space-y-6 max-w-2xl w-full">
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-4xl font-bold tracking-tight">Meu Perfil</h1>
        <p className="text-muted-foreground text-base sm:text-lg">Gerencie as configurações da sua conta</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações do Perfil</CardTitle>
          <CardDescription>Atualize suas informações pessoais</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Senha Atual (obrigatória para alterar senha)</Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Digite a senha atual para alterar a senha"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Nova Senha (deixe vazio para manter a atual)</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Digite a nova senha"
                minLength={6}
              />
            </div>
            {updateMutation.isError && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                {(updateMutation.error as ApiError)?.message || 'Falha ao atualizar perfil'}
              </div>
            )}
            {updateMutation.isSuccess && (
              <div className="text-sm text-green-600 bg-green-50 p-3 rounded-md">
                Perfil atualizado com sucesso!
              </div>
            )}
            <div className="flex flex-col sm:flex-row justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setName(profile?.name || '');
                  setEmail(profile?.email || '');
                  setPassword('');
                  setCurrentPassword('');
                }}
                disabled={updateMutation.isPending}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updateMutation.isPending || !hasChanges} className="w-full sm:w-auto">
                {updateMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

